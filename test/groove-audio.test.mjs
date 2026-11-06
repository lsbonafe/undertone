import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import * as webaudio from 'node-web-audio-api';
import { GrooveConductor, GrooveTone, grooveVoices } from '../groove.js';
import { stories } from '../stories.js';

const ids = Object.keys(stories).filter(id => stories[id].playback?.mode === 'groove');
const id = process.env.UNDERTONE_GROOVE_RENDER;
if (id && !ids.includes(id)) throw new Error(`Unknown groove: ${id}`);

if (id) test(`${id}: actual groove audio survives no scroll, slow reading, fast flicks and reversals`, async t => {
  Object.assign(globalThis, webaudio);
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  const strudel = await import('../assets/vendor/strudel.mjs');
  const { compileScore } = await import('../music.js');
  const config = stories[id].playback;
  const score = await compileScore(await readFile(new URL(`../scores/${id}.strudel`, import.meta.url), 'utf8'));
  const rate = 24000;
  const barSeconds = 240 / config.bpm;
  const cases = [
    { label:'hold', bars:8, speed:0 },
    { label:'slow', bars:4, speed:0.15 },
    { label:'reading', bars:4, speed:1 },
    { label:'fast', bars:4, speed:8 },
    { label:'reverse', bars:4, speed:8, reverse:true },
    { label:'jump-and-stop', bars:4, speed:8, stop:1, jump:true },
    { label:'small-scroll-lead', seconds:3, bars:0, speed:0, tap:true, onlyGesture:true },
  ];
  let length = 0;
  for (const entry of cases) {
    entry.offset = length;
    entry.seconds ??= entry.bars * barSeconds;
    length += entry.seconds + 4;
  }
  const context = new webaudio.OfflineAudioContext(2, Math.ceil(length * rate), rate);
  strudel.setAudioContext(context);
  strudel.setSuperdoughAudioController(undefined);
  await strudel.initAudio({ disableWorklets:true, maxPolyphony:4096 });
  await strudel.registerSynthSounds();
  await (await import('../reading-sounds.js')).registerReadingSounds();
  const master = strudel.getSuperdoughAudioController().output.destinationGain.gain;
  const tone = new GrooveTone(context, strudel.getSuperdoughAudioController().output.destinationGain, config);
  master.value = 0;
  for (const [section, entry] of cases.entries()) {
    const start = entry.offset + 0.08;
    const clock = new GrooveConductor(score.events, config, entry.reverse ? 0.3 : 0.05, start);
    const end = entry.offset + entry.seconds;
    master.setValueAtTime(0, entry.offset);
    master.linearRampToValueAtTime(0.55, start + 0.1);
    master.setValueAtTime(0.55, end);
    master.linearRampToValueAtTime(0, end + 0.035);
    for (let elapsed = 0; elapsed < entry.seconds; elapsed += 0.02) {
      const now = entry.offset + elapsed;
      if (entry.tap && Math.round(elapsed * 50) === 50) clock.input(0.05 + 24 / (900 * 4), now, 4);
      if (entry.speed && elapsed < (entry.stop ?? Infinity)) {
        const progress = entry.jump ? elapsed % 0.12 < 0.06 ? 0.95 : 0.02
          : (entry.reverse ? 0.3 : 0.05) + (entry.reverse ? -1 : 1) * entry.speed * elapsed / 1000;
        clock.input(progress, now, entry.jump ? 4 : 1000);
      }
      tone.update(clock.energyAt(now), now);
      const plans = clock.take(now);
      const gesture = clock.takeGesture(now);
      if (gesture) plans.push(gesture);
      for (const plan of plans) {
        if (entry.onlyGesture && !plan.gesture) continue;
        if (plan.gesture && entry.tap) entry.noteAt = plan.at;
        if (plan.at >= end) continue;
        for (const voice of grooveVoices(plan, config)) {
          const hap = voice.event.hap.withValue(() => ({ ...voice.value, orbit:section * 4 + (voice.value.orbit ?? 0) }));
          await strudel.webaudioOutput(hap, 0, voice.duration, 1 / plan.secondsPerBar, plan.at);
        }
      }
    }
  }
  const audio = await context.startRendering();
  const left = audio.getChannelData(0);
  for (let channel = 0; channel < audio.numberOfChannels; channel++) {
    const samples = audio.getChannelData(channel);
    for (const value of samples) assert.ok(Number.isFinite(value), 'every rendered sample is finite');
  }
  const rms = (at, duration) => {
    const samples = left.subarray(Math.round(at * rate), Math.round((at + duration) * rate));
    return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
  };
  for (const entry of cases) {
    const samples = left.subarray(Math.round(entry.offset * rate), Math.round((entry.offset + entry.seconds) * rate));
    let peak = 0;
    for (const value of samples) peak = Math.max(peak, Math.abs(value));
    assert.ok(peak < 0.85, `${entry.label}: headroom remains at peak ${peak}`);
    for (let bar = 0; bar < entry.bars; bar++) {
      const level = rms(entry.offset + bar * barSeconds + 0.2, barSeconds - 0.4);
      assert.ok(level > 0.001, `${entry.label}: bar ${bar} keeps a meaningful sound level, RMS ${level}`);
    }
    assert.ok(rms(entry.offset + entry.seconds + 0.5, 1) < 0.000001, `${entry.label}: explicit mute silences beat and effects`);
    t.diagnostic(`${id}/${entry.label}: RMS ${rms(entry.offset + 1, entry.seconds - 1).toFixed(4)}, peak ${peak.toFixed(4)}`);
  }
  const held = cases[0];
  const firstLoop = rms(held.offset + 1, 4 * barSeconds - 1);
  const secondLoop = rms(held.offset + 4 * barSeconds + 1, 4 * barSeconds - 1);
  assert.ok(secondLoop / firstLoop > 0.7 && secondLoop / firstLoop < 1.4, 'the repeating hold retains a stable musical level');
  const moving = rms(cases[3].offset + 1, cases[3].seconds - 1);
  assert.ok(moving / firstLoop < 2.5, 'fast scrolling cannot cause a large loudness jump');
  const tap = cases.find(entry => entry.tap);
  assert.ok(tap.noteAt - tap.offset - 1 <= 0.15, '24px of scroll produces audio within 150ms');
  const afterInput = left.subarray(Math.round((tap.offset + 1) * rate), Math.round((tap.offset + 1.25) * rate));
  const firstSound = afterInput.findIndex(value => Math.abs(value) > 0.0001);
  assert.ok(firstSound >= 0 && firstSound / rate <= 0.15, 'the rendered waveform responds within 150ms, not just its scheduled event');
  assert.ok(rms(tap.offset + 0.2, 0.6) < 0.000001, 'the foreground is silent without scrolling');
  const lead = rms(tap.noteAt + 0.015, 0.1);
  assert.ok(lead > firstLoop * 0.3, `the small-scroll lead has a meaningful level above the background: ${lead} vs ${firstLoop}`);
  t.diagnostic(`${id}/small-scroll contrast: lead RMS ${lead.toFixed(4)}, background RMS ${firstLoop.toFixed(4)}`);
});
else test('all three grooves render their actual hold and scroll playback independently', async t => {
  const run = promisify(execFile);
  for (const id of ids) await t.test(id, async subtest => {
    const env = { ...process.env, UNDERTONE_GROOVE_RENDER:id };
    delete env.NODE_TEST_CONTEXT;
    try {
      const { stdout } = await run(process.execPath, ['--test', fileURLToPath(import.meta.url)], { env, timeout:60000, maxBuffer:1024*1024 });
      for (const line of stdout.split('\n').filter(line => line.includes(`${id}/`) && line.includes('RMS'))) subtest.diagnostic(line.replace(/^# /, ''));
    } catch (error) {
      assert.fail(`${id} groove render failed:\n${error.stdout ?? ''}\n${error.stderr ?? error.message}`);
    }
  });
});
