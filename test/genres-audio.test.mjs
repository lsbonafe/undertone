import test from 'node:test';
import assert from 'node:assert/strict';
import * as webaudio from 'node-web-audio-api';

Object.assign(globalThis,webaudio);globalThis.window=new EventTarget();globalThis.document=new EventTarget();
const s=await import('../assets/vendor/strudel.mjs');
const {compileScore}=await import('../music.js');

test('vaporwave width, slowed chords, saturated bass and separate drum voices produce different audio',async()=>{
  const rate=24000;
  const cases=[
    {s:'haze',spread:0,vib:0}, {s:'haze',spread:0.3,vib:0.28,vibmod:0.12},
    {s:'grit',drive:0.5}, {s:'grit',drive:5.5},
    {s:'u_tape',speed:1}, {s:'u_tape',speed:0.5},
    {s:'u_kick',note:undefined}, {s:'u_hat',note:undefined}, {s:'u_snare',note:undefined},
  ];
  const context=new webaudio.OfflineAudioContext(2,rate*3*cases.length,rate);
  s.setAudioContext(context);s.setSuperdoughAudioController(undefined);
  await s.initAudio({disableWorklets:true,maxPolyphony:128});await s.registerSynthSounds();
  await (await import('../reading-sounds.js')).registerReadingSounds();
  s.getSuperdoughAudioController().output.destinationGain.gain.value=0.55;
  const {events}=await compileScore('note("c4").s("sine")');
  for(const[i,value]of cases.entries()){
    const hap=events[0].hap.withValue(()=>({note:'c4',gain:0.22,attack:0.008,decay:0.12,sustain:0.5,release:0.16,delay:0,orbit:i+1,...value}));
    await s.webaudioOutput(hap,0,0.65,0.5,i*3+0.02);
  }
  const audio=await context.startRendering();
  let peak=0;
  for(let channel=0;channel<2;channel++)for(const value of audio.getChannelData(channel))peak=Math.max(peak,Math.abs(value));
  assert.ok(peak<0.95,`all new sources stay finite and below clipping: ${peak}`);
  const chunk=(i,channel=0)=>audio.getChannelData(channel).subarray(Math.round((i*3+0.03)*rate),Math.round((i*3+0.6)*rate));
  const energy=samples=>samples.reduce((sum,value)=>sum+value*value,0);
  const difference=(a,b)=>{
    let delta=0;for(let i=0;i<a.length;i++)delta+=(a[i]-b[i])**2;
    return delta/(energy(a)+energy(b));
  };
  assert.ok(difference(chunk(1,0),chunk(1,1))>difference(chunk(0,0),chunk(0,1))+0.0001,'detuned pad has real stereo width');
  assert.ok(difference(chunk(2),chunk(3))>0.01,'drive changes the bass waveform');
  assert.ok(difference(chunk(4),chunk(5))>0.03,'half-speed playback changes the chord recording');
  for(const i of [6,7,8])assert.ok(energy(chunk(i))>0.0001,'each original drum voice is audible');
  const brightness=samples=>{
    let delta=0;for(let i=1;i<samples.length;i++)delta+=(samples[i]-samples[i-1])**2;
    return delta/energy(samples);
  };
  assert.ok(brightness(chunk(7))>brightness(chunk(6))*5,'hat and kick occupy distinct spectral ranges');
});
