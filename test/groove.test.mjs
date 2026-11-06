import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GrooveConductor, grooveVoices, GROOVE_LOOKAHEAD } from '../groove.js';
import { pitchClassOf } from '../motion.js';
import { stories } from '../stories.js';

globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
const { compileScore } = await import('../music.js');
const scores = new Map();
const ids = ['mall', 'vhs', 'courier'];
for (const id of ids) scores.set(id, await compileScore(await readFile(new URL(`../scores/${id}.strudel`, import.meta.url), 'utf8')));

function perform(id, { bars = 8, speed = 0, reverse = false, progress = 0.08 } = {}) {
  const config = stories[id].playback;
  const clock = new GrooveConductor(scores.get(id).events, config, progress, 0.02);
  const end = clock.secondsPerBar * bars;
  const plans = [];
  for (let now = 0; now < end; now += 0.02) {
    if (speed) {
      // A long article keeps a sustained fast gesture away from its endpoints.
      const travel = 1000;
      clock.input(progress + (reverse ? -1 : 1) * speed * now / travel, now, travel);
    }
    plans.push(...clock.take(now));
  }
  return { plans: plans.filter(plan => plan.gridAt < end), clock, config };
}

test('only the three groove studies opt into the new playback strategy', () => {
  assert.deepEqual(Object.entries(stories).filter(([, story]) => story.playback?.mode === 'groove').map(([id]) => id), ids);
  for (const id of ids) assert.ok(stories[id].playback.bpm >= 60 && stories[id].playback.bpm <= 135);
});

test('a no-scroll hold repeats the full four-bar passage, including its authored chords, bass and beat', () => {
  for (const id of ids) {
    const { plans, clock, config } = perform(id);
    assert.equal(clock.position, 0.08, `${id}: looping never advances article position`);
    assert.ok(plans.every(plan => plan.mode === 'loop' && plan.energy === 0 && plan.passage === 0));
    const heard = plans.flatMap(plan => grooveVoices(plan, config));
    for (const source of ['u_kick', 'u_snare', 'u_hat']) assert.ok(heard.some(voice => voice.value.s === source));
    const notes = heard.filter(voice => voice.value.note !== undefined);
    assert.ok(notes.length > 12);
    assert.ok(notes.every(voice => voice.value.note === voice.event.value.note), `${id}: no folding or replacement of the voicing`);
    const first = plans.filter(plan => plan.gridAt < 4 * clock.secondsPerBar).map(plan => plan.events.map(event => event.value));
    const second = plans.filter(plan => plan.gridAt >= 4 * clock.secondsPerBar).map(plan => plan.events.map(event => event.value));
    assert.deepEqual(first, second, `${id}: the held passage loops instead of becoming a drone`);
  }
});

test('slow, normal, fast and reverse scrolling keep the same clock and bound added percussion', () => {
  for (const id of ids) {
    const idle = perform(id, { bars: 4 });
    const kickTimes = result => result.plans.filter(plan => plan.events.some(event => event.value.s === 'u_kick')).map(plan => plan.gridAt);
    const heldKicks = kickTimes(idle);
    for (const speed of [0.15, 1, 8]) for (const reverse of [false, true]) {
      const result = perform(id, { bars: 4, speed, reverse, progress: reverse ? 0.3 : 0.08 });
      assert.deepEqual(kickTimes(result), heldKicks, `${id}: scroll speed/direction never bunches or speeds up kicks`);
      assert.equal(result.plans.length, idle.plans.length, 'gesture frequency cannot increase scheduler density');
      const voices = result.plans.flatMap(plan => grooveVoices(plan, result.config));
      assert.ok(voices.filter(voice => voice.event.extra).length <= 8, 'at most two extra hats per bar');
      assert.ok(voices.every(voice => voice.value.gain <= (voice.event.value.gain ?? 0.1)));
      assert.ok(voices.every(voice => voice.value.cutoff <= 7500));
      assert.ok(voices.filter(voice => voice.value.s === 'grit').every(voice => voice.value.resonance <= 2.8));
      if (speed === 8) assert.ok(voices.some(voice => voice.event.extra), 'fast movement audibly adds a bounded rhythmic layer');
    }
  }
});

test('large jumps select only the latest passage at a bar boundary, including reading back', () => {
  const config = stories.courier.playback;
  const clock = new GrooveConductor(scores.get('courier').events, config, 0, 0.02);
  clock.take(0);
  clock.input(0.5, 0.1, 4);
  clock.input(0.95, 0.12, 4);
  let plans = [];
  for (let now = 0.02; now < clock.secondsPerBar * 2; now += 0.02) plans.push(...clock.take(now));
  assert.ok(plans.filter(plan => plan.gridAt < clock.secondsPerBar).every(plan => plan.passage === 0));
  assert.ok(plans.filter(plan => plan.gridAt > clock.secondsPerBar).every(plan => plan.passage === 2));
  assert.ok(plans.every(plan => plan.passage !== 1), 'the skipped passage is not replayed');
  clock.input(0.01, clock.secondsPerBar * 2, 4);
  plans = [];
  for (let now = clock.secondsPerBar * 2; now < clock.secondsPerBar * 4; now += 0.02) plans.push(...clock.take(now));
  assert.ok(plans.some(plan => plan.passage === 0 && plan.direction === 'backward'));
  assert.ok(plans.every(plan => plan.passage !== 1));
});

test('stopping scroll settles added layers while the core groove continues', () => {
  const config = stories.courier.playback;
  const clock = new GrooveConductor(scores.get('courier').events, config, 0, 0.02);
  clock.input(0.1, 0, 8);
  const initial = clock.energyAt(0);
  assert.ok(initial > 0.9);
  assert.ok(clock.energyAt(0.5) < initial);
  assert.ok(clock.energyAt(3) < 0.01);
  const plans = [];
  for (let now = 0; now < 8; now += 0.02) plans.push(...clock.take(now));
  assert.ok(plans.some(plan => plan.gridAt > 6 && plan.mode === 'loop' && plan.events.some(event => event.value.s === 'u_kick')));
  assert.ok(plans.filter(plan => plan.gridAt > 6).flatMap(plan => grooveVoices(plan, config)).every(voice => !voice.event.extra));
});

test('a scheduler stall drops missed hits and never emits a catch-up burst', () => {
  for (const id of ids) {
    const clock = new GrooveConductor(scores.get(id).events, stories[id].playback, 0, 0.02);
    clock.take(0);
    clock.setPosition(0.99);
    const plans = clock.take(60.071);
    assert.ok(plans.length <= 2);
    assert.ok(plans.every(plan => plan.at >= 60.071 && plan.at <= 60.071 + GROOVE_LOOKAHEAD));
    assert.ok(plans.every(plan => plan.passage === 2));
    assert.deepEqual(clock.take(60.071), [], 'polling twice cannot duplicate scheduled notes');
  }
});

test('tiny jitter is ignored and viewport-relative speed survives different article lengths', () => {
  const config = stories.mall.playback;
  const a = new GrooveConductor(scores.get('mall').events, config);
  const b = new GrooveConductor(scores.get('mall').events, config);
  assert.equal(a.input(0.00001, 0, 4), false);
  a.input(0.02, 0.08, 4);
  b.input(0.01, 0.08, 8);
  assert.equal(a.speed, b.speed);
  assert.equal(a.energyAt(0.1), b.energyAt(0.1));
});

test('a small wheel movement plays a foreground note promptly, independent of the next slow score attack', () => {
  for (const id of ids) {
    const config = stories[id].playback;
    const clock = new GrooveConductor(scores.get(id).events, config, 0.1, 0.02);
    for (let now = 0; now < 1; now += 0.02) { clock.take(now); assert.equal(clock.takeGesture(now), null); }
    // 24 pixels on a 900px viewport, with four viewports of article travel.
    assert.ok(clock.input(0.1 + 24 / (900 * 4), 1, 4));
    let gesture;
    for (let now = 1; now <= 1.16; now += 0.02) gesture ??= clock.takeGesture(now);
    assert.ok(gesture, `${id}: a normal wheel tick starts the foreground voice`);
    assert.ok(gesture.at - 1 <= 0.15, `${id}: response does not wait for a bar or slow melody onset`);
    const [voice] = grooveVoices(gesture, config);
    assert.ok(voice.value.gain >= voice.event.value.gain * 0.8, 'small movements get a clear note rather than a nearly silent velocity');
    assert.ok(stories[id].pitchClasses.includes(pitchClassOf(voice.value.note)));
    assert.ok(voice.duration + voice.value.release < 0.5, 'the lead rings out without becoming another held drone');
    for (let now = 1.3; now < 4; now += 0.02) assert.equal(clock.takeGesture(now), null, 'pausing never continues the foreground phrase');
  }
});

test('scrolling up retraces the lead notes and no lead runs automatically with the background', () => {
  for (const id of ids) {
    const config = stories[id].playback;
    const clock = new GrooveConductor(scores.get(id).events, config, 0.1, 0.02);
    const voices = [];
    for (const [now, progress] of [[1,0.11], [2,0.12], [3,0.13], [4,0.12]]) {
      clock.input(progress, now, 4);
      let plan;
      for (let time = now; time < now + 0.18; time += 0.02) plan ??= clock.takeGesture(time);
      assert.ok(plan);
      voices.push(grooveVoices(plan, config)[0]);
    }
    assert.equal(voices[3].value.note, voices[1].value.note, `${id}: reversing returns to the preceding note`);
    assert.ok(voices[0].value.pan > 0.5 && voices[3].value.pan < 0.5);
    const core = clock.take(4).flatMap(plan => grooveVoices(plan, config));
    assert.ok(core.every(voice => voice.value.orbit !== 1), 'the automatic loop does not also play the foreground line');
  }
});

test('the lead grows denser with speed but stays bounded through fast motion, reversal and repeated flicks', () => {
  for (const id of ids) {
    const config = stories[id].playback;
    const counts = [];
    for (const speed of [0.15,1,8]) {
      const clock = new GrooveConductor(scores.get(id).events, config, 0.1, 0.02);
      const hits = [];
      for (let now = 0; now < 6; now += 0.02) {
        clock.input(0.1 + speed * now / 1000, now, 1000);
        const plan = clock.takeGesture(now);
        if (plan) hits.push(plan.at);
      }
      counts.push(hits.length);
      for (let index = 1; index < hits.length; index++) assert.ok(hits[index] - hits[index - 1] >= 0.2 - 1e-6, 'no rapid-fire burst');
    }
    assert.ok(counts[0] < counts[1] && counts[1] < counts[2], `${id}: ${counts} attacks distinguish slow, reading and fast gestures`);
    const clock = new GrooveConductor(scores.get(id).events, config, 0.1, 0.02);
    let previous = -Infinity;
    for (let now = 0; now < 6; now += 0.02) {
      if (Math.round(now * 50) % 11 === 0) clock.input(clock.position < 0.5 ? 0.95 : 0.05, now, 4);
      const plan = clock.takeGesture(now);
      if (plan) { assert.ok(plan.at - previous >= 0.2 - 1e-6, 'repeated flicks cannot bypass the density limit'); previous = plan.at; }
    }
  }
});
