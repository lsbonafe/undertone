import test from 'node:test';
import assert from 'node:assert/strict';
import * as webaudio from 'node-web-audio-api';

Object.assign(globalThis, webaudio);
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
const strudel = await import('../assets/vendor/strudel.mjs');
const { compileScore } = await import('../music.js');

test('new synthesis, samples, formants, panning and spatial effects change actual rendered audio', async () => {
  const rate = 24000;
  const settings = [
    {s:'z_square',zrand:0,zcrush:0}, {s:'z_square',zrand:0,zcrush:0.1},
    {s:'square',pan:0.18}, {s:'square',pan:0.82},
    {s:'sawtooth',cutoff:600,lpenv:0}, {s:'sawtooth',cutoff:600,lpenv:2.1,lpattack:0.04,lpdecay:0.2,lpsustain:0.25},
    {s:'porcelain',speed:1,begin:0,end:1,duration:0.8}, {s:'porcelain',speed:-1,begin:0,end:1,duration:0.8},
    {s:'sawtooth',vowel:'u'}, {s:'sawtooth',vowel:'a'},
    {s:'sine',room:0}, {s:'sine',room:0.22,roomsize:0.85},
    {s:'sine',delay:0}, {s:'sine',delay:0.22,delaytime:0.32,delayfeedback:0.18},
  ];
  const context = new webaudio.OfflineAudioContext(2, rate * 3 * settings.length, rate);
  strudel.setAudioContext(context);
  strudel.setSuperdoughAudioController(undefined);
  await strudel.initAudio({disableWorklets:true,maxPolyphony:128});
  await strudel.registerSynthSounds();
  await (await import('../reading-sounds.js')).registerReadingSounds();
  strudel.getSuperdoughAudioController().output.destinationGain.gain.value = 0.55;
  const {events} = await compileScore('note("c4").s("sine")');
  for (const [i, value] of settings.entries()) {
    const hap = events[0].hap.withValue(() => ({note:'c4',gain:0.22,attack:0.008,decay:0.1,sustain:0.5,release:0.15,delay:0,room:0,orbit:i+1,...value}));
    await strudel.webaudioOutput(hap, 0, value.duration ?? 0.35, 0.5, i * 3 + 0.02);
  }
  const buffer = await context.startRendering();
  let peak = 0;
  for (let channel = 0; channel < 2; channel++) for (const sample of buffer.getChannelData(channel)) peak = Math.max(peak,Math.abs(sample));
  assert.ok(peak < 0.95, `all new processes stay finite with headroom: ${peak}`);
  const section = (i, channel=0, begin=0.02, end=0.6) => buffer.getChannelData(channel).subarray(Math.round((i*3+begin)*rate),Math.round((i*3+end)*rate));
  const rms = samples => Math.sqrt(samples.reduce((sum,value) => sum+value**2,0)/samples.length);
  const difference = (a,b) => {
    let delta=0, energy=0;
    for(let i=0;i<a.length;i++) {delta+=(a[i]-b[i])**2;energy+=a[i]**2+b[i]**2;}
    return delta/energy;
  };
  for (const [a,b,label] of [[0,1,'ZZFX zcrush'],[4,5,'filter envelope'],[6,7,'sample reversal'],[8,9,'vowel formants']]) {
    assert.ok(rms(section(a)) > 0.00001 && rms(section(b)) > 0.00001, `${label}: both signals exist`);
    assert.ok(difference(section(a),section(b)) > 0.03, `${label}: the sound actually changes`);
  }
  assert.ok(rms(section(2,0)) > rms(section(2,1))*2, 'left placement reaches the left channel');
  assert.ok(rms(section(3,1)) > rms(section(3,0))*2, 'right placement reaches the right channel');
  for (const [dry,wet,label] of [[10,11,'reverb'],[12,13,'delay']]) {
    assert.ok(rms(section(dry,0,0.7,1.1)) < 0.000001, `${label}: dry tone has ended`);
    assert.ok(rms(section(wet,0,0.7,1.1)) > 0.000001, `${label}: effect produces an actual tail`);
  }
});
