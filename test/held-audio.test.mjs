import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as webaudio from 'node-web-audio-api';
import { isPercussion, midiOf, pitchClassOf } from '../motion.js';
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

test('held harmony preserves the score’s tonal center and the latest melodic pitch class', () => {
  for (const [id, score] of scores) {
    for (const event of score.events.filter(event => !isPercussion(event.value))) {
      const notes = heldNotes(score.events, midiOf(event.value.note), event.onset / 12);
      assert.equal(notes.length, 3);
      assert.ok(notes.every(note => stories[id].pitchClasses.includes(pitchClassOf(note))));
      assert.equal(pitchClassOf(notes[2]), pitchClassOf(event.value.note));
      assert.equal(notes[1] - notes[0], 7);
    }
  }
});

test('actual Strudel synth voices sustain through long pauses, change smoothly, and stop on explicit mute', async t => {
  const rate = 24000;
  const context = new webaudio.OfflineAudioContext(2, rate * 9 * scores.size, rate);
  strudel.setAudioContext(context);
  await strudel.registerSynthSounds();
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  const sections = [];
  for (const [id, score] of scores) {
    const offset = sections.length * 9;
    const harmony = new HeldHarmony(context, master);
    const notes = heldNotes(score.events);
    harmony.sync(notes, offset, timbreAt(score.events, 0));
    harmony.sync(notes, offset + 2, timbreAt(score.events, 0.36));
    harmony.sync(notes, offset + 4, timbreAt(score.events, 0.72));
    assert.equal(harmony.voices.size, 3);
    harmony.stop(offset + 6);
    assert.equal(harmony.voices.size, 0);
    sections.push({id, offset});
  }
  const buffer = await context.startRendering();
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    for (const value of buffer.getChannelData(channel)) peak = Math.max(peak, Math.abs(value));
  }
  assert.ok(peak < 0.95, `held filter sweeps stay finite and below clipping: peak ${peak}`);
  const rms = (begin, end) => {
    const samples = new Float32Array(Math.round((end - begin) * rate));
    buffer.copyFromChannel(samples, 0, Math.round(begin * rate));
    assert.ok(samples.every(Number.isFinite));
    return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
  };
  const brightness = (begin) => {
    const samples = new Float32Array(Math.round(0.3 * rate));
    buffer.copyFromChannel(samples, 0, Math.round(begin * rate));
    let difference = 0;
    let energy = 0;
    for (let i = 1; i < samples.length; i++) {
      difference += (samples[i] - samples[i - 1]) ** 2;
      energy += samples[i] ** 2;
    }
    return difference / energy;
  };
  for (const {id, offset} of sections) {
    for (const time of [1, 2.1, 3, 4.1, 5.5]) assert.ok(rms(offset + time, offset + time + 0.1) > 0.0004, `${id}: continuous sound at ${time}s`);
    assert.ok(rms(offset + 7, offset + 8) < 0.000001, `${id}: explicit mute releases all held voices`);
    const early = brightness(offset + 1);
    const late = brightness(offset + 5.5);
    if (id === 'erosion') assert.ok(early > late * 1.3, 'closing the held filter audibly removes upper-frequency content');
    if (id === 'fireflies') assert.ok(late > early * 1.05, 'adding held partials actually enriches the spectrum');
    if (id === 'bell') assert.ok(late > early * 1.02, 'deeper held FM actually changes the spectrum');
    if (id === 'worldcup') assert.ok(late > early * 1.05, 'the celebration’s held filter opens without a dropout or spike');
    t.diagnostic(`${id}: held RMS ${rms(offset + 5.5, offset + 5.6).toFixed(4)}; brightness ${early.toFixed(5)} → ${late.toFixed(5)}`);
  }
});

test('rapid reversals of a held filter stay audible, bounded, and continuous', async () => {
  const rate = 24000;
  const context = new webaudio.OfflineAudioContext(2, rate * 3, rate);
  strudel.setAudioContext(context);
  await strudel.registerSynthSounds();
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  const events = scores.get('worldcup').events;
  const harmony = new HeldHarmony(context, master);
  const notes = heldNotes(events);
  for (const [time, progress] of [[0,0], [0.2,0.72], [0.32,0], [0.4,0.36], [0.52,0.72], [0.6,0]]) {
    harmony.sync(notes, time, timbreAt(events, progress));
  }
  harmony.stop(2.5);
  const samples = (await context.startRendering()).getChannelData(0);
  let peak = 0;
  let maxStep = 0;
  for (let i = 1; i < samples.length; i++) {
    peak = Math.max(peak, Math.abs(samples[i]));
    maxStep = Math.max(maxStep, Math.abs(samples[i] - samples[i - 1]));
  }
  assert.ok(peak < 0.95, `no spikes or invalid samples: peak ${peak}`);
  assert.ok(maxStep < 0.1, `no abrupt output jumps: ${maxStep}`);
  for (const time of [0.75, 1, 1.5, 2.2]) {
    const section = samples.subarray(Math.round(time * rate), Math.round((time + 0.1) * rate));
    const rms = Math.sqrt(section.reduce((sum, value) => sum + value ** 2, 0) / section.length);
    assert.ok(rms > 0.0004, `no dropout at ${time}s`);
  }
});

test('the new sound processes are encoded in their scores and survive into the held timbre', () => {
  const profile = (id, position) => timbreAt(scores.get(id).events, position);
  assert.equal(profile('erosion',0).source, 'sawtooth');
  assert.ok(profile('erosion',0).cutoff > profile('erosion',0.72).cutoff);
  assert.equal(profile('fireflies',0).source, 'user');
  assert.ok(profile('fireflies',0).partials.length < profile('fireflies',0.72).partials.length);
  assert.equal(profile('bell',0).kind, 'fm');
  assert.ok(profile('bell',0).fmi < profile('bell',0.72).fmi);
  assert.equal(profile('bell',0.72).fmh, 1.414);
});

test('the four additional cases encode distinct envelopes, omissions, modulation, and connecting entrances', () => {
  const lead = (id, chapter) => scores.get(id).events.filter(event => event.onset >= chapter * 4 && event.onset < (chapter + 1) * 4 && event.value.gain > 0.15);
  const loss = [0, 1, 2].map(chapter => lead('loss', chapter));
  assert.ok(loss[0][0].value.attack < loss[1][0].value.attack);
  assert.ok(loss[1][0].value.attack < loss[2][0].value.attack);
  assert.ok(Math.max(...loss[2].map(event => midiOf(event.value.note))) < Math.max(...loss[1].map(event => midiOf(event.value.note))));

  const minab = [0, 1, 2].map(chapter => lead('minab', chapter));
  for (const chapter of minab) assert.ok(chapter.length < 16, 'the phrase contains actual rests');
  assert.ok(minab[0][0].value.partials[1] > 0);
  assert.equal(minab[1][0].value.partials[1], 0);
  assert.ok(minab[2][0].value.partials[2] < minab[1][0].value.partials[2]);
  assert.equal(timbreAt(scores.get('minab').events, 0.72).partials[1], 0);

  const election = [0, 1, 2].map(chapter => lead('election', chapter)[0].value);
  assert.ok(election.every(value => value.fmh === 2));
  assert.ok(election[1].fmi > election[0].fmi && election[1].fmi > election[2].fmi);

  const connections = [0, 1, 2].map(chapter => scores.get('routes').events.filter(event => event.onset >= chapter * 4 && event.onset < (chapter + 1) * 4 && event.value.gain < 0.07));
  assert.equal(connections[0].length, 0);
  assert.ok(connections[1].length > 0 && connections[2].length > connections[1].length);
  assert.ok(connections.flat().every(event => event.onset % 1 === 0.5), 'connections enter between foundation notes');
});

test('the fictional stories contrast expanding celebration with a disappearing answering voice', () => {
  const cup = scores.get('worldcup').events;
  const ai = scores.get('displacement').events;
  const opening = cup.filter(event => event.onset < 4 && event.value.s === 'sawtooth');
  const ending = cup.filter(event => event.onset >= 8 && event.value.s === 'sawtooth');
  assert.deepEqual(opening.slice(0, 4).map(event => midiOf(event.value.note)), [67, 71, 74, 79], 'a rising major triad opens the celebration');
  assert.ok(ending[0].value.cutoff > opening[0].value.cutoff);
  assert.ok(Math.max(...ending.map(event => midiOf(event.value.note))) > Math.max(...opening.map(event => midiOf(event.value.note))));
  assert.equal(timbreAt(cup, 0.72).kind, 'subtractive');

  const answers = [0, 1, 2].map(chapter => ai.filter(event => event.onset >= chapter * 4 && event.onset < (chapter + 1) * 4 && event.value.s === 'triangle').length);
  assert.deepEqual(answers, [8, 4, 2], 'the answering voice withdraws in stages');
  const routine = [0, 1, 2].map(chapter => ai.filter(event => event.onset >= chapter * 4 && event.onset < (chapter + 1) * 4 && event.value.fmi > 0));
  assert.deepEqual(routine.map(events => events.length), [16, 16, 16], 'the repeating system continues');
  assert.ok(routine[2][0].value.fmi > routine[0][0].value.fmi);
  assert.equal(timbreAt(ai, 0.72).kind, 'fm');
});
