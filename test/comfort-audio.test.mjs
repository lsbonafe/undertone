import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as webaudio from 'node-web-audio-api';
import { isPercussion, midiOf } from '../motion.js';
import { stories } from '../stories.js';

Object.assign(globalThis, webaudio);
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
const strudel = await import('../assets/vendor/strudel.mjs');
(await import('../genre-sounds.js')).registerGenreSounds();
const { HeldHarmony, heldNotes, timbreAt } = await import('../harmony.js');
const { compileScore } = await import('../music.js');
const scores = new Map();
for (const id of Object.keys(stories).filter(id => stories[id].playback?.mode !== 'groove')) scores.set(id, await compileScore(await readFile(new URL(`../scores/${id}.strudel`, import.meta.url), 'utf8')));

test('every hold settles to a quieter, stable signal while retaining its synthesis palette and pitch classes', async t => {
  const rate = 24000;
  const seconds = 23;
  const context = new webaudio.OfflineAudioContext(2, rate * seconds * scores.size, rate);
  strudel.setAudioContext(context);
  await strudel.registerSynthSounds();
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  const sections = [];
  for (const [id, score] of scores) {
    const offset = sections.length * seconds;
    const root = heldNotes(score.events)[0];
    const tension = score.events.find(event => !isPercussion(event.value) && [1,6,11].includes(((midiOf(event.value.note) - root) % 12 + 12) % 12));
    const notes = heldNotes(score.events, tension ? midiOf(tension.value.note) : null);
    const profile = timbreAt(score.events, 0.72);
    const harmony = new HeldHarmony(context, master);
    harmony.sync(notes, offset, profile, { holding: false });
    harmony.sync(notes, offset + 2, profile, { holding: true });
    assert.deepEqual(harmony.notes, notes);
    assert.equal(harmony.renderProfile.kind, profile.kind);
    assert.equal(harmony.renderProfile.source, profile.source);
    assert.equal(harmony.renderProfile.comfort, true);
    assert.equal(harmony.voices.size, 3);
    harmony.sync(notes, offset + 17, profile, { holding: false });
    harmony.sync(notes, offset + 18, profile, { holding: true });
    harmony.stop(offset + 21);
    sections.push({id, offset, kind: profile.kind});
  }
  const buffer = await context.startRendering();
  function measure(begin, duration = 0.5) {
    const samples = new Float32Array(Math.round(duration * rate));
    buffer.copyFromChannel(samples, 0, Math.round(begin * rate));
    let energy = 0;
    let difference = 0;
    for (let i = 0; i < samples.length; i++) {
      assert.ok(Number.isFinite(samples[i]));
      energy += samples[i] ** 2;
      if (i) difference += (samples[i] - samples[i-1]) ** 2;
    }
    return { rms: Math.sqrt(energy / samples.length), brightness: energy ? difference / energy : 0 };
  }
  for (const {id, offset, kind} of sections) {
    const flowing = measure(offset + 1);
    const holding = [4,8,12,15].map(time => measure(offset + time));
    assert.ok(holding.every(value => value.rms > 0.0001), `${id}: sustained rather than muted`);
    assert.ok(holding[0].rms < flowing.rms, `${id}: the hold settles to a quieter level`);
    const levels = holding.map(value => value.rms);
    assert.ok(Math.max(...levels) / Math.min(...levels) < 1.3, `${id}: no obvious level pumping during a long hold`);
    if (kind !== 'pure') assert.ok(holding[0].brightness < flowing.brightness, `${id}: the long hold has a softer spectrum`);
    assert.ok(measure(offset + 22).rms < 0.000001, `${id}: explicit mute still stops everything`);
    t.diagnostic(`${id}: flow RMS ${flowing.rms.toFixed(4)}, hold RMS ${holding[0].rms.toFixed(4)}, stable ratio ${(Math.max(...levels)/Math.min(...levels)).toFixed(3)}`);
  }
});
