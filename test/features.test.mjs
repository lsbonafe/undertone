import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expressiveVoices, ReadingConductor } from '../motion.js';

globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
const { compileScore } = await import('../music.js');
const scores = new Map();
for (const id of ['laundromat','chess','bakery','porcelain','library']) scores.set(id, await compileScore(await readFile(new URL(`../scores/${id}.strudel`, import.meta.url), 'utf8')));

test('authored silence, echo times, effects and stereo placement survive the reading clock', () => {
  for (const [id, score] of scores) {
    const events = score.events.filter(event => event.onset === score.events[0].onset);
    const shaped = expressiveVoices({ events, mode:'reading', duration:0.3, gainScale:0.9, releaseScale:1, speed:1, interval:220 });
    for (const voice of shaped.voices) {
      assert.equal(voice.value.delay, voice.event.value.delay ?? 0.13, `${id}: preserve authored delay, including zero`);
      assert.equal(voice.value.delaytime, voice.event.value.delaytime ?? 0.24);
      for (const key of ['pan','vowel','zcrush','lpenv','vib','noise','begin','end','speed']) assert.equal(voice.value[key], voice.event.value[key]);
    }
    const fast = expressiveVoices({ events, mode:'skim', duration:0.08, gainScale:0.8, releaseScale:1.4, speed:8, interval:96 });
    for (const voice of fast.voices) {
      assert.ok(voice.value.delay <= 0.16 && voice.value.delayfeedback <= 0.14);
      assert.ok(voice.value.room === undefined || voice.value.room <= 0.12);
    }
  }
});

test('the same viewport speed produces the same pulse on short and long readings', () => {
  const score = scores.get('library');
  const short = new ReadingConductor(score.events, 0.1);
  const long = new ReadingConductor(score.events, 0.1);
  for (let step = 1; step <= 10; step++) {
    short.input(0.1 + step * 0.01, step * 40, 2);
    long.input(0.1 + step * 0.001, step * 40, 20);
    assert.ok(Math.abs(short.interval - long.interval) < 0.00001);
  }
});

test('the scores encode five different sound processes with stable sample fragments', async () => {
  const lead = id => scores.get(id).events.filter(event => event.value.gain > 0.1);
  assert.ok(lead('laundromat').every(event => event.value.s === 'z_square' && event.value.zcrush > 0 && event.value.zrand === 0));
  assert.deepEqual([...new Set(lead('chess').map(event => event.value.pan))].sort(), [0.18,0.82]);
  const firstCycle = lead('chess').filter(event => event.onset < 1);
  assert.equal(firstCycle.filter(event => event.value.pan === 0.18).length, 3);
  assert.equal(firstCycle.filter(event => event.value.pan === 0.82).length, 5);
  assert.ok(lead('bakery').every(event => event.value.lpenv > 0 && event.value.vib > 0 && event.value.noise === undefined));
  const fragments = lead('porcelain');
  assert.ok(fragments.every(event => event.value.begin >= 0 && event.value.end <= 1 && event.value.begin < event.value.end));
  assert.ok(fragments.some(event => event.value.speed < 0));
  assert.ok(fragments[0].value.end - fragments[0].value.begin < fragments.at(-1).value.end - fragments.at(-1).value.begin);
  const repeated = await compileScore(await readFile(new URL('../scores/porcelain.strudel', import.meta.url), 'utf8'));
  assert.deepEqual(repeated.events.map(event => [event.onset,event.value]), scores.get('porcelain').events.map(event => [event.onset,event.value]));
  assert.ok(new Set(lead('library').map(event => event.value.vowel)).size >= 4);
  assert.ok(lead('library').every(event => event.value.room > 0 && event.value.delaytime === 0.32 && event.value.orbit === 2));
});
