import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import * as webaudio from 'node-web-audio-api';
import { stories } from '../stories.js';
import { crossedEvents, expressiveVoices, isPercussion, ReadingConductor, SCORE_CYCLES } from '../motion.js';

Object.assign(globalThis, webaudio);
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
const strudel = await import('../assets/vendor/strudel.mjs');
const { compileScore } = await import('../music.js');
const scores = new Map();
const renderStory = process.env.UNDERTONE_RENDER_STORY;
if (renderStory && !Object.hasOwn(stories, renderStory)) throw new Error(`Unknown audio-test story: ${renderStory}`);
for (const id of renderStory ? [renderStory] : []) scores.set(id, await compileScore(await readFile(new URL(`../scores/${id}.strudel`, import.meta.url), 'utf8')));

if (renderStory) test(`${renderStory}: both directions and three reading speeds have natural tails and no clipping`, async t => {
  const rate = 24000;
  const segmentSeconds = 4;
  const context = new webaudio.OfflineAudioContext(2, rate * segmentSeconds * scores.size * 8, rate);
  strudel.setAudioContext(context);
  strudel.setSuperdoughAudioController(undefined);
  await strudel.initAudio({ disableWorklets: true, maxPolyphony: 4096 });
  await strudel.registerSynthSounds();
  await (await import('../reading-sounds.js')).registerReadingSounds();
  strudel.getSuperdoughAudioController().output.destinationGain.gain.value = 0.55;
  // Effects are shared by orbit; isolate stories when scheduling them into one offline render.
  const isolated = (hap, id) => hap.withValue(value => ({ ...value, orbit: [...scores.keys()].indexOf(id) * 4 + (value.orbit ?? 1) }));
  const segments = [];
  for (const [id, score] of scores) {
    for (const reverse of [false, true]) {
      const offset = segments.length * segmentSeconds;
      const events = crossedEvents(score.events, reverse ? SCORE_CYCLES : 0, reverse ? 0 : SCORE_CYCLES, 1000);
      for (const event of events) {
        const position = reverse ? SCORE_CYCLES - event.onset : event.onset;
        await strudel.webaudioOutput(isolated(event.hap, id), 0, 0.14, 4, offset + 0.01 + position / 4);
      }
      segments.push({ id, direction: reverse ? 'backward' : 'forward', offset });
    }
  }
  for (const [id, score] of scores) {
    for (const [mode, speed] of [['slow', 0.15], ['reading', 1], ['skim', 5]]) {
      for (const reverse of [false, true]) {
        const offset = segments.length * segmentSeconds;
        const initial = reverse ? 0.9 : 0.1;
        const conductor = new ReadingConductor(score.events, initial);
        let previousMelody = null;
        let ringUntil = 0;
        for (let time = 0; time <= 1200; time += 20) {
          conductor.input(initial + (reverse ? -1 : 1) * (time + 20) / 1000 * speed / 10, time, 10);
          const plan = conductor.take(time);
          if (!plan) continue;
          const shaped = expressiveVoices(plan, previousMelody);
          previousMelody = shaped.nextMelody;
          for (const voice of shaped.voices) {
            if (!isPercussion(voice.value)) ringUntil = Math.max(ringUntil,time/1000+voice.duration+(voice.value.release??0));
            const hap = voice.event.hap.withValue(() => voice.value);
            await strudel.webaudioOutput(isolated(hap, id), 0, voice.duration, 0.5, offset + 0.02 + time / 1000);
          }
        }
        segments.push({ id, direction: `${mode}/${reverse ? 'backward' : 'forward'}`, offset, tail: true, ringUntil });
      }
    }
  }
  const buffer = await context.startRendering();
  for (const { id, direction, offset, tail, ringUntil } of segments) {
    let peak = 0;
    let squares = 0;
    for (let channel = 0; channel < 2; channel++) {
      const samples = new Float32Array(rate * segmentSeconds);
      buffer.copyFromChannel(samples, channel, offset * rate);
      for (const value of samples) {
        assert.ok(Number.isFinite(value), `${id}/${direction} has finite samples`);
        peak = Math.max(peak, Math.abs(value));
        squares += value * value;
      }
    }
    const rms = Math.sqrt(squares / (rate * segmentSeconds * 2));
    assert.ok(rms > 0.001, `${id}/${direction} is audible-level signal: RMS ${rms}`);
    assert.ok(peak < 0.95, `${id}/${direction} has headroom: peak ${peak}`);
    if (tail) {
      const energy = (begin, end) => {
        const samples = new Float32Array(Math.round((end - begin) * rate));
        buffer.copyFromChannel(samples, 0, Math.round((offset + begin) * rate));
        return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      };
      const ringing = energy(1.4,1.5);
      const settled = energy(3.6,3.9);
      if (ringUntil > 1.45) assert.ok(ringing > 0.000001, `${id}/${direction}: scheduled tonal tail remains audible: ${ringing}`);
      assert.ok(settled < 0.00001, `${id}/${direction}: the tail settles naturally: ${settled}`);
    }
    t.diagnostic(`${id}/${direction}: RMS ${rms.toFixed(4)}, peak ${peak.toFixed(4)}`);
  }
});

else test('every gesture score renders independently in both directions and at three reading speeds', async t => {
  const run = promisify(execFile);
  for (const id of Object.keys(stories).filter(id => stories[id].playback?.mode !== 'groove')) {
    await t.test(id, async subtest => {
      const env = { ...process.env, UNDERTONE_RENDER_STORY: id };
      delete env.NODE_TEST_CONTEXT;
      try {
        const { stdout } = await run(process.execPath, ['--test', fileURLToPath(import.meta.url)], { env, timeout:60000, maxBuffer:1024*1024 });
        for (const line of stdout.split('\n').filter(line => line.includes(`${id}/`) && line.includes('RMS'))) subtest.diagnostic(line.replace(/^# /, ''));
      } catch (error) {
        assert.fail(`${id} audio render failed:\n${error.stdout ?? ''}\n${error.stderr ?? error.message}`);
      }
    });
  }
});
