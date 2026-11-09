import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import * as webaudio from 'node-web-audio-api';
import {stories} from '../stories.js';
Object.assign(globalThis,webaudio);globalThis.window=new EventTarget();globalThis.document=new EventTarget();
const strudel=await import('../assets/vendor/strudel.mjs');
const {compileScore}=await import('../music.js');
const {FlowTexture,TextureInstrument,textureShape}=await import('../texture.js');
const scores=new Map();
for(const id of ['space','reef','mall','depths'])scores.set(id,await compileScore(await readFile(new URL(`../scores/${id}.strudel`,import.meta.url),'utf8')));

test('flowing harmony renders slow, fast, reverse and stopped motion without retuning or creating voices',async t=>{
 const rate=24000;
 for(const [id,score] of scores)for(const behavior of ['stopped','slow','fast','reverse']){
  const context=new webaudio.OfflineAudioContext(2,rate*5,rate),master=context.createGain();master.gain.value=.5;master.connect(context.destination);
  const start=behavior==='reverse'?.9:.1,texture=new FlowTexture(context,master,score.events,start),sources=[...texture.sources];
  const frequencies=sources.map(source=>source.frequency.value),harmonies=new Set();
  for(let at=0;at<3.5;at+=.03){
   const position=behavior==='stopped'?start:behavior==='slow'?start+at*.04:behavior==='reverse'?start-at*.23:Math.min(1,start+at*.65);
   if(behavior!=='stopped')texture.input(position,at,6);texture.tick(at);
   harmonies.add(texture.notes.join(','));
   assert.deepEqual(texture.sources,sources,'motion reuses the sustained voices');
   assert.deepEqual(sources.map(source=>source.frequency.value),frequencies,'no solo pitch bends or stepped lead');
  }
  texture.stop(3.7);const buffer=await context.startRendering();
  let peak=0;for(let channel=0;channel<2;channel++)for(const sample of buffer.getChannelData(channel)){assert.ok(Number.isFinite(sample));peak=Math.max(peak,Math.abs(sample))}
  const samples=buffer.getChannelData(0),rms=(from,to)=>{const slice=samples.subarray(from*rate,to*rate);return Math.sqrt(slice.reduce((sum,value)=>sum+value*value,0)/slice.length)};
  assert.ok(sources.length<=26,'the finite pitch pool bounds polyphony');assert.ok(rms(.6,3.3)>.002,`${id}/${behavior}: sustained signal`);
  if(behavior==='stopped')assert.equal(harmonies.size,1);else assert.ok(harmonies.size>=2,`${id}/${behavior}: harmonic movement`);
  assert.ok(peak<.8,`${id}/${behavior}: headroom ${peak}`);assert.ok(rms(4,4.8)<.000001,'mute releases the texture');
  t.diagnostic(`${id}/${behavior}: peak ${peak.toFixed(4)}, ${harmonies.size} harmonic blends, ${sources.length} fixed-pitch sources, mute verified`);
 }
});

test('reverse motion retraces harmonic blends, a stop holds them and a seek adds no gesture',async()=>{
 const context=new webaudio.OfflineAudioContext(2,24000*5,24000),texture=new FlowTexture(context,context.destination,scores.get('space').events,0);
 const forward=new Map(),sources=[...texture.sources];
 for(let step=1;step<=8;step++){
  const at=step*.2;texture.input(step/10,at,6);texture.tick(at);forward.set(step,[...texture.colorMix]);
 }
 for(let step=7;step>=1;step--){
  const at=1.8+(7-step)*.2;texture.input(step/10,at,6);texture.tick(at);assert.deepEqual([...texture.colorMix],forward.get(step));
 }
 texture.input(.95,3.5,6);texture.tick(3.5);const held=[...texture.colorMix];
 for(const at of [3.7,3.9,4.2]){texture.tick(at);assert.deepEqual([...texture.colorMix],held,'no harmonic advancement after stopping')}
 assert.equal(texture.input(NaN,4.25,6),false);
 texture.seek(.25);texture.tick(4.3);assert.equal(texture.energy,0,'layout seeks do not play a gesture');
 assert.deepEqual(texture.sources,sources);texture.stop(4.5);assert.equal(texture.input(.5,4.6,6),false);await context.startRendering();
});

test('the same scroll distance reaches the same harmonic blend at different input event rates',async()=>{
 const mixes=[];
 for(const fps of [30,120]){
  const context=new webaudio.OfflineAudioContext(2,24000*3,24000),texture=new FlowTexture(context,context.destination,scores.get('space').events,0);
  for(let frame=1;frame<=fps*2;frame++){
   const at=frame/fps;texture.input(at*.1,at,6);texture.tick(at);
  }
  mixes.push([...texture.colorMix]);assert.equal(texture.input(.2,2.05,6),false,'unchanged position cannot advance anything');
  texture.tick(2.14);assert.deepEqual([...texture.colorMix],mixes.at(-1));texture.stop(2.5);await context.startRendering();
 }
 assert.deepEqual(mixes[0],mixes[1]);
});

test('rendered upper harmony changes pitch content through a crossfade with no separate lead',async t=>{
 const rate=24000,render=async moving=>{
  const context=new webaudio.OfflineAudioContext(2,rate*4,rate),muted=context.createGain();muted.gain.value=0;muted.connect(context.destination);
  const texture=new FlowTexture(context,muted,scores.get('space').events,0);
  // Isolate the color layer; the complete mix is checked for headroom and mute above.
  for(const color of texture.colors){color.gain.disconnect();color.gain.connect(context.destination)}
  for(let frame=0;frame<175;frame++){const at=frame/50;if(moving&&frame===50)texture.input(1/11,at,6);texture.tick(at)}
  assert.equal(texture.lead,undefined);texture.stop(3.6);return context.startRendering();
 };
 const rest=await render(false),moved=await render(true);
 const magnitude=(buffer,note)=>{
  const frequency=440*2**((note-69)/12),samples=buffer.getChannelData(0);let real=0,imag=0;
  const begin=rate*2,end=rate*2.4;
  for(let index=begin;index<end;index++){
   const window=.5-.5*Math.cos(2*Math.PI*(index-begin)/(end-begin-1)),phase=2*Math.PI*frequency*index/rate;
   real+=samples[index]*window*Math.cos(phase);imag+=samples[index]*window*Math.sin(phase);
  }
  return Math.hypot(real,imag)/(end-begin);
 };
 assert.ok(magnitude(moved,68)>magnitude(rest,68)*4,'G-sharp enters the blend');
 assert.ok(magnitude(moved,66)<magnitude(rest,66)/3,'F-sharp recedes from the blend');
 assert.ok(magnitude(moved,64)>.0001,'the shared E remains present');
 t.diagnostic('Rendered E/F-sharp color becomes E/G-sharp through shared sustained voices.');
});

test('the actual instrument can compare notes and continuous touch without changing scores or leaving old voices playing',async t=>{
 const context=new webaudio.AudioContext({sinkId:{type:'none'}});strudel.setAudioContext(context);strudel.setSuperdoughAudioController(undefined);
 const errors=[],instrument=new TextureInstrument(()=>{},()=>{},error=>errors.push(error));
 t.after(async()=>{instrument.mute();await context.close()});
 instrument.setScore(scores.get('space').events,.25);instrument.setVolume(.5);await instrument.enable();
 const texture=instrument.texture,sources=[...texture.sources];assert.equal(instrument.harmony,null);
 for(const progress of [.26,.3,.65,.95,.8,.2])instrument.move(progress,performance.now(),6);
 await delay(350);assert.equal(instrument.texture,texture);assert.deepEqual(texture.sources,sources);
 const analyser=context.createAnalyser();instrument.controller.output.destinationGain.connect(analyser);
 await delay(50);
 const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);assert.ok(samples.some(value=>Math.abs(value)>.001));
 instrument.setTouch('notes');assert.ok(texture.stopped);assert.equal(instrument.texture,null);assert.ok(instrument.harmony);
 instrument.move(.22);await delay(40);instrument.setTouch('continuous');assert.ok(instrument.texture);assert.notEqual(instrument.texture,texture);
 instrument.setScore(scores.get('mall').events,.15,stories.mall.playback);assert.equal(instrument.playback.gesture,false);
 const groove=instrument.groove;instrument.move(.2);instrument.move(.19);await delay(80);
 assert.equal(instrument.groove,groove);assert.equal(groove.lastGestureAt,-Infinity,'continuous mode has no keyed scroll lead');
 instrument.setTouch('notes');assert.equal(instrument.playback.gesture,true);
 instrument.setTouch('continuous');const finalTexture=instrument.texture;instrument.mute();await delay(100);
 assert.ok(finalTexture.stopped);assert.equal(instrument.gain.value,0);assert.equal(instrument.pulse,null);assert.equal(instrument.texture,null);assert.deepEqual(errors,[]);
});

test('a 24px scroll changes the rendered spectrum within 150ms against a time-matched stationary control',async t=>{
 const rate=24000;
 const render=async moving=>{
  const context=new webaudio.OfflineAudioContext(2,rate*5,rate),master=context.createGain();master.gain.value=.5;master.connect(context.destination);
  const texture=new FlowTexture(context,master,scores.get('space').events,.34),sources=[...texture.sources];
  assert.equal(texture.input(.34+.00001,.1,6),false,'micro-jitter must not activate the minimum motion response');
  for(let frame=0;frame<175;frame++){
   const at=frame/50;
   if(moving&&frame===50){
    assert.equal(texture.input(.34+24/(900*6),at,6),true);
    assert.ok(texture.energyAt(at)>.3,'a small intentional scroll gets a useful response');
    assert.ok(textureShape(texture.position,texture.energyAt(at)).cutoff>2000);
   }
   texture.tick(at);
  }
  assert.ok(texture.energyAt(2.8)<.05,'the sound settles after the gesture');
  assert.deepEqual(texture.sources,sources);texture.stop(3.6);return context.startRendering();
 };
 const control=await render(false),moving=await render(true);
 const metrics=(buffer,from,to)=>{
  let energy=0,difference=0,count=0;
  for(let channel=0;channel<2;channel++){
   const slice=buffer.getChannelData(channel).subarray(Math.round(from*rate),Math.round(to*rate));
   for(let i=1;i<slice.length;i++){energy+=slice[i]**2;difference+=(slice[i]-slice[i-1])**2;count++}
  }
  return {brightness:difference/energy,rms:Math.sqrt(energy/count)};
 };
 // Matching the same instant avoids mistaking natural detuning/beating for gesture response.
 const rest=metrics(control,1.08,1.15),response=metrics(moving,1.08,1.15),contrast=response.brightness/rest.brightness;
 const lateControl=metrics(control,3.1,3.4),lateMotion=metrics(moving,3.1,3.4);
 assert.ok(contrast>1.5,`motion reveals upper harmonics promptly (${contrast})`);
 assert.ok(lateMotion.brightness/lateControl.brightness<contrast,'the rendered response relaxes after stopping');
 assert.ok(response.rms/rest.rms<1.8,'spectral contrast does not rely on a large volume jump');
 let peak=0;for(let channel=0;channel<2;channel++)for(const value of moving.getChannelData(channel)){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value))}
 assert.ok(peak<.8,`headroom ${peak}`);t.diagnostic(`24px response: matched spectral contrast ${contrast.toFixed(2)}x, RMS ratio ${(response.rms/rest.rms).toFixed(2)}, peak ${peak.toFixed(4)}`);
});

test('a faster gesture gives the same harmonic target more level and brightness',async t=>{
 const rate=24000,render=async travel=>{
  const context=new webaudio.OfflineAudioContext(2,rate*3,rate),texture=new FlowTexture(context,context.destination,scores.get('space').events,.34);
  for(let frame=0;frame<125;frame++){
   const at=frame/50;if(frame===50)texture.input(.355,at,travel);texture.tick(at);
  }
  const mix=[...texture.colorMix];texture.stop(2.6);return {audio:await context.startRendering(),mix};
 };
 const slow=await render(1),fast=await render(8);assert.deepEqual(slow.mix,fast.mix);
 const rms=buffer=>{
  let sum=0,count=0;for(let channel=0;channel<2;channel++)for(const sample of buffer.getChannelData(channel).subarray(rate*1.12,rate*1.3)){sum+=sample*sample;count++}
  return Math.sqrt(sum/count);
 };
 const ratio=rms(fast.audio)/rms(slow.audio);assert.ok(ratio>1.1,`speed should change expression (${ratio})`);assert.ok(ratio<1.5,'the layered texture keeps a restrained swell');
 t.diagnostic(`Same harmonic target, fast/slow rendered RMS ratio ${ratio.toFixed(2)}x.`);
});

test('sound families render distinct spectra on identical harmony and stop all modulation sources',async t=>{
 const rate=24000,signatures=[];
 const families=[['sine',{}],['triangle',{}],['sawtooth',{}],['user',{partials:[1,.28,.16,.1,.06,.04]}],['sine',{fmi:.8,fmh:2}],['porcelain',{}],['haze',{}],['sawtooth',{vowel:'a'}]];
 for(const [s,extra] of families){
  const events=Array.from({length:48},(_,index)=>({onset:index/4,value:{s,note:['d3','a3','e4','fs4'][index%4],gain:.2,orbit:1,...extra}}));
  const context=new webaudio.OfflineAudioContext(2,rate*4,rate),texture=new FlowTexture(context,context.destination,events,.3);
  const sources=[...texture.sources];
  for(let frame=0;frame<160;frame++){
   const at=frame/50;if(frame===60)texture.input(.31,at,6);texture.tick(at);
  }
  assert.deepEqual(texture.sources,sources,'scrolling allocates no extra sources');
  assert.ok(sources.length<=40,'carriers and modulation remain bounded');
  texture.stop(3.3);const audio=await context.startRendering(),samples=audio.getChannelData(0);
  let peak=0;for(let channel=0;channel<2;channel++)for(const sample of audio.getChannelData(channel)){assert.ok(Number.isFinite(sample));peak=Math.max(peak,Math.abs(sample))}
  assert.ok(peak>.005&&peak<.8,`${texture.timbre.kind}: headroom ${peak}`);
  assert.ok(samples.subarray(rate*3.6).every(value=>Math.abs(value)<1e-6),'mute also stops FM and tape wow');
  const fingerprint=(from,to)=>{
   const begin=Math.round(from*rate),end=Math.round(to*rate),values=[];
   // Compare upper partials; all renders have exactly the same notes and pedal.
   for(const note of [50,57,64,66])for(let harmonic=2;harmonic<=8;harmonic++){
    const frequency=440*2**((note-69)/12)*harmonic;let real=0,imag=0;
    for(let index=begin;index<end;index++){
     const window=.5-.5*Math.cos(2*Math.PI*(index-begin)/(end-begin-1)),phase=2*Math.PI*frequency*index/rate;
     real+=samples[index]*window*Math.cos(phase);imag+=samples[index]*window*Math.sin(phase);
    }
    values.push(Math.hypot(real,imag));
   }
   const sum=values.reduce((total,value)=>total+value,0);assert.ok(sum>.01,'harmonic detail is present');
   return values.map(value=>value/sum);
  };
  signatures.push({kind:texture.timbre.kind,rest:fingerprint(.7,1.1),moving:fingerprint(1.5,1.9)});
 }
 for(let left=0;left<signatures.length;left++)for(let right=left+1;right<signatures.length;right++){
  for(const state of ['rest','moving']){
   const distance=signatures[left][state].reduce((sum,value,index)=>sum+Math.abs(value-signatures[right][state][index]),0);
   assert.ok(distance>.12,`${signatures[left].kind}/${signatures[right].kind} ${state}: spectral distance ${distance}`);
  }
 }
 t.diagnostic('Eight sound families have distinct normalized upper-partial spectra at rest and during movement on the same notes.');
});

test('the full reading catalogue supports continuous rendering with finite output and headroom',async()=>{
 const rate=24000;
 for(const [id,story] of Object.entries(stories)){
  const score=await compileScore(await readFile(new URL(`../${story.score}`,import.meta.url),'utf8'));
  const context=new webaudio.OfflineAudioContext(2,rate*3,rate),texture=new FlowTexture(context,context.destination,score.events,0);
  for(let frame=0;frame<100;frame++){const at=frame/50;texture.input(frame/99,at,6);texture.tick(at)}
  assert.ok(texture.voicings.flat().every(note=>story.pitchClasses.includes(((note%12)+12)%12)),id);
  texture.stop(2.2);const audio=await context.startRendering();let peak=0;
  for(let channel=0;channel<2;channel++)for(const sample of audio.getChannelData(channel)){assert.ok(Number.isFinite(sample),id);peak=Math.max(peak,Math.abs(sample))}
  assert.ok(peak>.001&&peak<.8,`${id}: peak ${peak}`);
 }
});

test('the deep bass render carries a D1 fundamental and concentrates its energy below 120 Hz',async t=>{
 const rate=24000,context=new webaudio.OfflineAudioContext(2,rate*4,rate);
 const texture=new FlowTexture(context,context.destination,scores.get('depths').events,.3);
 const low=context.createBiquadFilter();low.type='lowpass';low.frequency.value=120;
 // Web Audio low-pass Q is in dB: -3.01 dB gives a non-resonant Butterworth response.
 low.Q.value=-3.0103;
 const split=context.createChannelMerger(2);texture.bus.disconnect();
 texture.bus.connect(split,0,0);texture.bus.connect(low);low.connect(split,0,1);split.connect(context.destination);
 for(let frame=0;frame<160;frame++)texture.tick(frame/50);
 texture.stop(3.3);const audio=await context.startRendering();
 const original=audio.getChannelData(0),filtered=audio.getChannelData(1),begin=rate,end=rate*3;
 let total=0,bass=0,real=0,imag=0;
 for(let i=begin;i<end;i++){
  total+=original[i]**2;bass+=filtered[i]**2;
  const phase=2*Math.PI*(440*2**((26-69)/12))*i/rate;
  real+=original[i]*Math.cos(phase);imag+=original[i]*Math.sin(phase);
 }
 assert.ok(bass/total>.8&&bass/total<=1.01,`bass energy ratio ${bass/total}`);
 assert.ok(Math.hypot(real,imag)/(end-begin)>.005,'D1 is present in the rendered signal');
 assert.ok(original.subarray(rate*3.6).every(value=>Math.abs(value)<1e-6),'the deep layer mutes');
 t.diagnostic(`Deep bass: ${(100*bass/total).toFixed(1)}% of measured energy retained after a 120 Hz low-pass.`);
});
