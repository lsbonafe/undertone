import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stories } from '../stories.js';
import { crossedEvents, isPercussion, pitchClassOf, scrollProgress, SCORE_CYCLES } from '../motion.js';

// The bundle exposes browser input handlers; these EventTargets allow pure pattern tests in Node.
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
const { compileScore } = await import('../music.js');

for (const [id, story] of Object.entries(stories)) {
  const source = await readFile(new URL(`../scores/${id}.strudel`, import.meta.url), 'utf8');
  const { events } = await compileScore(source);

  test(`${id}: real Strudel events stay in the declared mode across all three chapters`, () => {
    assert.ok(events.length >= 40);
    for (const event of events) {
      if (isPercussion(event.value)) assert.equal(event.value.note, undefined, 'drums have no invented melodic pitch');
      else assert.ok(story.pitchClasses.includes(pitchClassOf(event.value.note)), `${event.value.note} is in ${story.scale}`);
      assert.ok(event.onset >= 0 && event.end <= SCORE_CYCLES);
      assert.ok(Number.isFinite(event.value.gain) && event.value.gain <= 0.3);
      assert.ok(['sine', 'triangle', 'sawtooth', 'square', 'user', 'z_square', 'porcelain','haze','grit','u_tape','u_kick','u_hat','u_snare'].includes(event.value.s));
    }
    for (let chapter = 0; chapter < 3; chapter++) assert.ok(events.some(event => event.onset >= chapter * 4 && event.onset < (chapter + 1) * 4));
  });

  test(`${id}: the complete reverse trip retraces the same notes in reverse order`, () => {
    const forward = crossedEvents(events, 0, SCORE_CYCLES, 1000);
    const backward = crossedEvents(events, SCORE_CYCLES, 0, 1000);
    assert.deepEqual(backward.map(event => [event.onset,event.value.note]), forward.toReversed().map(event => [event.onset,event.value.note]));
  });

  test(`${id}: small forward movements trigger every onset exactly once`, () => {
    const traversed = [];
    for (let i = 0; i < 192; i++) traversed.push(...crossedEvents(events, i / 16, (i + 1) / 16));
    assert.deepEqual(traversed, events);
  });

  test(`${id}: no movement means no new notes`, () => {
    assert.deepEqual(crossedEvents(events, 4, 4), []);
  });
}

test('large jumps preserve simultaneous voices and cap scheduled onsets', () => {
  const events = Array.from({ length: 100 }, (_, i) => [0, 1].map(voice => ({ onset:i / 10, value:{ note:voice } }))).flat();
  for (const [from, to] of [[0, 10], [10, 0]]) {
    const crossed = crossedEvents(events, from, to);
    const onsets = new Set(crossed.map(event => event.onset));
    assert.equal(onsets.size, 8);
    assert.equal(crossed.length, 16);
    assert.ok(onsets.has(0) && onsets.has(9.9));
  }
});

test('scroll progress handles document boundaries, overscroll and a page with no travel', () => {
  assert.equal(scrollProgress(0, 2000, 800), 0);
  assert.equal(scrollProgress(600, 2000, 800), 0.5);
  assert.equal(scrollProgress(1200, 2000, 800), 1);
  assert.equal(scrollProgress(-50, 2000, 800), 0);
  assert.equal(scrollProgress(9000, 2000, 800), 1);
  assert.equal(scrollProgress(0, 500, 800), 0);
});

test('enharmonic note names map to the intended pitch classes', () => {
  assert.equal(pitchClassOf('fs5'), 6);
  assert.equal(pitchClassOf('f#5'), 6);
  assert.equal(pitchClassOf('eb4'), 3);
  assert.equal(pitchClassOf('bf3'), 10);
});
