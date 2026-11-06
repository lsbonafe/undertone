import test from 'node:test';
import assert from 'node:assert/strict';
import { calmProfile, holdFrequencies, holdVoiceBalance } from '../comfort.js';

test('hold tuning aligns the foundation and fifth without changing the displayed pitches', () => {
  const notes = [50, 57, 62];
  const frequencies = holdFrequencies(notes);
  assert.equal(frequencies[1] / frequencies[0], 1.5);
  assert.equal(frequencies[2] / frequencies[0], 2);
  assert.deepEqual(notes, [50, 57, 62]);
});

test('all semitone classes retain their pitch category when the hold settles into simple ratios', () => {
  for (let interval = 12; interval <= 24; interval++) {
    const notes = [48, 55, 48 + interval];
    const frequencies = holdFrequencies(notes);
    const midi = 69 + 12 * Math.log2(frequencies[2] / 440);
    assert.ok(Math.abs(midi - notes[2]) < 0.2);
  }
});

test('one comfort transformation softens every palette without discarding the synthesis method', () => {
  for (const profile of [
    {kind:'pure',source:'sine',levelScale:1},
    {kind:'subtractive',source:'sawtooth',cutoff:5200,levelScale:0.7},
    {kind:'additive',source:'user',partials:[1,0.28,0.16,0.1],cutoff:4200,levelScale:0.9},
    {kind:'fm',source:'sine',fmi:0.32,fmh:1.414,cutoff:4800,levelScale:0.85},
    {kind:'subtractive',source:'haze',spread:0.22,vib:0.28,vibmod:0.11,cutoff:1800,levelScale:0.85},
    {kind:'subtractive',source:'grit',drive:5.5,cutoff:1400,levelScale:0.65},
  ]) {
    const held = calmProfile(profile);
    assert.equal(held.source, profile.source);
    assert.equal(held.kind, profile.kind);
    assert.ok(held.levelScale < profile.levelScale);
    assert.ok(held.cutoff <= 1600);
    if (profile.partials) {
      assert.equal(held.partials[0], profile.partials[0]);
      assert.ok(held.partials[2] < profile.partials[2]);
    }
    if (profile.fmi) {
      assert.ok(held.fmi > 0 && held.fmi < profile.fmi);
      assert.equal(held.fmh, profile.fmh);
    }
    if (profile.drive) assert.ok(held.drive < profile.drive);
    if (profile.spread) assert.ok(held.spread < profile.spread && held.vibmod < profile.vibmod);
  }
});

test('tension notes remain in the harmony but occupy less of a long hold', () => {
  assert.ok(holdVoiceBalance([50,57,63],2) < holdVoiceBalance([50,57,62],2));
  assert.equal(holdVoiceBalance([50,57,63],0), 1);
  assert.equal(holdVoiceBalance([50,57,63],1), 1);
});
