import test from 'node:test';
import assert from 'node:assert/strict';
import { IDLE_MS, MIN_NOTE_GAP_MS, ReadingConductor, expressiveVoices, pitchClassOf } from '../motion.js';

const events = Array.from({ length: 48 }, (_, i) => ({
  onset: i / 4, end: (i + 1) / 4,
  value: { note: [60, 64, 67, 69][i % 4], gain: 0.28, release: 0.12, cutoff: 3500 },
}));

function gesture(speed, duration = 1600, backward = false, frameMs = 20) {
  const start = backward ? 0.9 : 0.1;
  const conductor = new ReadingConductor(events, start);
  const attacks = [];
  for (let time = 0; time <= duration; time += frameMs) {
    conductor.input(start + (backward ? -1 : 1) * (time + frameMs) / 1000 * speed / 10, time, 10);
    const plan = conductor.take(time);
    if (plan) attacks.push({ time, plan });
  }
  return { conductor, attacks };
}

test('slow reading sustains a relaxed phrase without needing to cross a note on every frame', () => {
  const { attacks } = gesture(0.08);
  assert.ok(attacks.length >= 2 && attacks.length <= 4);
  assert.ok(attacks.every(({ plan }) => plan.mode === 'slow' && plan.duration >= 0.5));
});

test('trackpad flicks are clearly faster than reading without firing at the input event rate', () => {
  const { attacks } = gesture(5, 1600, false, 4);
  const reading = gesture(1).attacks;
  assert.ok(attacks.length >= reading.length * 1.6, `${attacks.length} fast attacks vs ${reading.length} reading attacks`);
  assert.ok(attacks.length <= Math.ceil(1600 / MIN_NOTE_GAP_MS) + 1);
  for (let i = 1; i < attacks.length; i++) assert.ok(attacks[i].time - attacks[i - 1].time >= MIN_NOTE_GAP_MS);
  assert.ok(attacks.slice(1).every(({ plan }) => plan.mode === 'skim' && plan.gainScale < 0.94));
});

test('the next skim note follows the current paragraph rather than a skipped-note backlog', () => {
  const conductor = new ReadingConductor(events);
  conductor.input(0.35, 0, 4);
  const first = conductor.take(0);
  assert.ok(first.onset >= 3);
  conductor.input(0.7, 320, 4);
  const next = conductor.take(320);
  assert.ok(next.onset >= 7, 'the skipped middle does not play later');
});

test('a pause produces no additional attacks, regardless of how many notes the gesture crossed', () => {
  const { conductor, attacks } = gesture(4);
  assert.ok(attacks.length > 0);
  for (let time = 1600 + IDLE_MS + 1; time < 4000; time += 20) assert.equal(conductor.take(time), null);
});

test('reversing drops queued forward notes and respects the musical attack limit', () => {
  const conductor = new ReadingConductor(events, 0.2);
  conductor.input(0.25, 0, 4);
  conductor.take(0);
  conductor.input(0.21, 30, 4);
  assert.equal(conductor.take(30), null);
  conductor.input(0.19, 360, 4);
  const plan = conductor.take(360);
  assert.equal(plan.direction, 'backward');
  assert.ok(plan.onset <= 2.5);
});

test('microscopic back-and-forth jitter does not restart notes', () => {
  const conductor = new ReadingConductor(events, 0.4);
  for (let i = 0; i < 200; i++) {
    assert.equal(conductor.input(0.4 + (i % 2 ? 0.00001 : -0.00001), i * 8, 4), false);
    assert.equal(conductor.take(i * 8), null);
  }
});

test('speed is smoothed across changes, and sustained reading remains within a bounded cadence', () => {
  const conductor = new ReadingConductor(events, 0.1);
  conductor.input(0.11, 0, 4);
  const before = conductor.speed;
  conductor.input(0.111, 20, 4);
  assert.ok(conductor.speed < before && conductor.speed > 0.2);
  const { attacks } = gesture(1);
  assert.ok(attacks.length >= 3);
  for (let i = 1; i < attacks.length; i++) assert.ok(attacks[i].time - attacks[i - 1].time >= MIN_NOTE_GAP_MS);
});

test('velocity estimates remain consistent across trackpad event rates', () => {
  const fastEvents = gesture(5, 1200, false, 4).conductor.speed;
  const normalEvents = gesture(5, 1200, false, 20).conductor.speed;
  assert.ok(Math.abs(fastEvents - normalEvents) < 0.05);
});

test('fast voicing keeps pitch class, shorter releases and a controlled kinetic accent', () => {
  const plan = { events: [{ value: { note: 'c6', gain: 0.3, release: 0.1, cutoff: 4000 } }], mode: 'skim', duration: 0.3, gainScale: 0.65, releaseScale: 2.8 };
  const { voices, nextMelody } = expressiveVoices(plan, 64);
  assert.equal(pitchClassOf(nextMelody), 0);
  assert.ok(Math.abs(nextMelody - 64) <= 7);
  assert.ok(voices[0].value.gain < 0.3);
  assert.ok(voices[0].value.release >= 0.12);
  assert.ok(voices[0].value.cutoff > 4000 && voices[0].value.cutoff <= 6500);
  assert.equal(plan.events[0].value.note, 'c6', 'the stored score remains unchanged');
});

test('the tempo mapping never slows down when scroll speed increases', () => {
  const conductor = new ReadingConductor(events);
  let previous = Infinity;
  for (const speed of [0.08, 0.3, 1, 2.4, 2.6, 4, 8]) {
    conductor.speed = speed;
    assert.ok(conductor.interval <= previous);
    assert.ok(conductor.interval >= MIN_NOTE_GAP_MS);
    previous = conductor.interval;
  }
});

test('a small initial movement does not lock the following fast gesture to a slow first interval', () => {
  const conductor = new ReadingConductor(events, 0.1);
  conductor.input(0.1001, 0, 4);
  conductor.take(0);
  let secondAttack = null;
  for (let time = 20; time <= 180; time += 20) {
    conductor.input(0.1001 + time / 20 * 0.02, time, 4);
    if (conductor.take(time)) { secondAttack = time; break; }
  }
  assert.ok(secondAttack !== null && secondAttack <= 160, `accelerated after ${secondAttack}ms`);
});

test('rapid notes shorten and reduce per-note energy instead of stacking long loud envelopes', () => {
  const reading = gesture(1).attacks.at(-1).plan;
  const fast = gesture(5).attacks.at(-1).plan;
  assert.ok(fast.duration < reading.duration);
  assert.ok(fast.gainScale < reading.gainScale);
  assert.ok(fast.releaseScale < reading.releaseScale);
});
