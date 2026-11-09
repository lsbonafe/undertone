import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import * as webaudio from 'node-web-audio-api';

Object.assign(globalThis,webaudio);globalThis.window=new EventTarget();globalThis.document=new EventTarget();
const {compileScore}=await import('../../music.js');
const {SoundControl}=await import('../../sound-control.js');
const {PRESETS,QuietLayer,QuietInstrument,noiseBuffer,quietShape}=await import('./audio.js');
const {events}=await compileScore(await readFile(new URL('./drone.strudel',import.meta.url),'utf8'));
const rate=24000;
const rms=samples=>Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length);

test('scroll has a meaningful color range without commanding a volume swell',()=>{
  for(const id of Object.keys(PRESETS)){
    const start=quietShape(id,0,0),end=quietShape(id,1,1);
    assert.ok(end.cutoff/start.cutoff>4&&end.cutoff<6000,id);
    assert.equal(start.level,end.level);assert.equal(quietShape(id,.5,0).level,1);
    assert.deepEqual(quietShape(id,-1,-1),start);assert.deepEqual(quietShape(id,2,2),end);
  }
  assert.throws(()=>quietShape('unknown',0),/Unknown/);
});

test('pink and brown noise have distinct spectra, normalized energy and a smooth periodic join',()=>{
  const context=new webaudio.OfflineAudioContext(2,rate,rate),brightness=[];
  for(const kind of ['pink','brown']){
    const buffer=noiseBuffer(context,kind),data=buffer.getChannelData(0);
    assert.equal(noiseBuffer(context,kind),buffer,'repeated selections reuse the buffer');
    assert.ok(Math.abs(rms(data)-.14)<1e-5,'comparable source energy');
    assert.ok(Math.abs(data.reduce((sum,value)=>sum+value,0)/data.length)<1e-6,'no DC offset');
    let difference=0,peak=0;
    for(let i=1;i<data.length;i++){difference+=(data[i]-data[i-1])**2;peak=Math.max(peak,Math.abs(data[i]))}
    const typicalStep=Math.sqrt(difference/(data.length-1));
    assert.ok(Math.abs(data[0]-data.at(-1))<typicalStep*5,'loop boundary is not an outsized step');
    assert.ok(peak<1,'source headroom');brightness.push(difference/data.length);
  }
  assert.ok(brightness[0]>brightness[1]*8,'pink and brown have distinct spectral shapes');
});

test('every texture sustains stopped, slow, fast and reverse motion with finite output and clean pause',async t=>{
  for(const id of Object.keys(PRESETS))for(const behavior of ['stopped','slow','fast','reverse']){
    const context=new webaudio.OfflineAudioContext(2,rate*5,rate),output=context.createGain();output.gain.value=.25;output.connect(context.destination);
    const start=behavior==='reverse'?.9:.1,layer=new QuietLayer(context,output,id,events,start);
    const sources=[...layer.sources,...(layer.flow?.sources??[])];
    const frequencies=sources.filter(source=>source.frequency).map(source=>source.frequency.value);
    for(let frame=0;frame<175;frame++){
      const at=frame/50,progress=behavior==='reverse'?start-at*.23:behavior==='fast'?Math.min(1,start+at*.6):start+at*.04;
      if(behavior!=='stopped')layer.input(progress,at,6);layer.update(at);
      assert.deepEqual([...layer.sources,...(layer.flow?.sources??[])],sources,'scroll allocates no sources');
      if(id==='binaural'){
        assert.equal(sources[1].frequency.value,180,'the left carrier stays fixed');
        assert.ok(sources[2].frequency.value>=186&&sources[2].frequency.value<=192,'the right carrier glides in a bounded range');
      }else assert.deepEqual(sources.filter(source=>source.frequency).map(source=>source.frequency.value),frequencies,'harmonic voices are not retuned');
    }
    layer.stop(3.6);layer.stop(3.7);const audio=await context.startRendering();let peak=0;
    for(let channel=0;channel<2;channel++)for(const value of audio.getChannelData(channel)){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value))}
    const level=rms(audio.getChannelData(0).subarray(rate,rate*3));
    assert.ok(level>.001&&peak<.3,`${id}/${behavior}: level ${level}, peak ${peak}`);
    assert.ok(rms(audio.getChannelData(0).subarray(rate*4.8))<1e-6,'pause stops the layers');
    t.diagnostic(`${id}/${behavior}: RMS ${level.toFixed(4)}, peak ${peak.toFixed(4)}`);
  }
});

test('binaural tones are actually separated into left 180 Hz and right 190 Hz',async()=>{
  const context=new webaudio.OfflineAudioContext(2,rate*4,rate),layer=new QuietLayer(context,context.destination,'binaural',events,2/3);
  layer.update(1);layer.stop(2.8);const audio=await context.startRendering();
  const magnitude=(channel,frequency)=>{
    const data=audio.getChannelData(channel);let real=0,imag=0;
    for(let index=rate;index<rate*2;index++){
      const window=.5-.5*Math.cos(2*Math.PI*(index-rate)/rate),phase=2*Math.PI*frequency*index/rate;
      real+=data[index]*window*Math.cos(phase);imag+=data[index]*window*Math.sin(phase);
    }
    return Math.hypot(real,imag)/rate;
  };
  assert.ok(magnitude(0,180)>magnitude(0,190)*20,'left carrier stays on the left');
  assert.ok(magnitude(1,190)>magnitude(1,180)*20,'right carrier stays on the right');
  assert.deepEqual(layer.sources.filter(source=>source.frequency).map(source=>source.frequency.value),[180,190]);
});

test('a 24px gesture changes the rendered spectrum within 300ms while keeping level restrained',async t=>{
  for(const id of Object.keys(PRESETS)){
    const render=async moving=>{
      const context=new webaudio.OfflineAudioContext(2,rate*4,rate),layer=new QuietLayer(context,context.destination,id,events,.4);
      for(let frame=0;frame<150;frame++){
        const at=frame/50;if(frame===50){const target=.4+24/(800*4);if(moving)layer.input(target,at,4);else layer.seek(target)}layer.update(at);
      }
      layer.stop(3);return context.startRendering();
    };
    const moving=await render(true),still=await render(false);
    const segment=buffer=>buffer.getChannelData(0).subarray(Math.round(rate*1.15),Math.round(rate*1.3));
    const brightness=buffer=>{const data=segment(buffer);let difference=0,power=0;for(let i=1;i<data.length;i++){difference+=(data[i]-data[i-1])**2;power+=data[i]**2}return difference/power};
    const ratio=rms(segment(moving))/rms(segment(still)),contrast=brightness(moving)/brightness(still);
    assert.ok(ratio>.9&&ratio<1.2,`${id}: level ratio ${ratio}`);
    assert.ok(contrast>1.1,`${id}: scroll must change actual rendered color (${contrast})`);
    t.diagnostic(`${id}: 24px spectral contrast ${contrast.toFixed(2)}x; RMS ratio ${ratio.toFixed(2)}x`);
  }
});

test('scrolling changes the actual binaural beat separation from 6 to 12 Hz',async()=>{
  const context=new webaudio.OfflineAudioContext(2,rate*5,rate),layer=new QuietLayer(context,context.destination,'binaural',events,0);
  for(let frame=0;frame<200;frame++){const at=frame/50;if(frame===100)layer.seek(1);layer.update(at)}
  layer.stop(4);const audio=await context.startRendering();
  const magnitude=(channel,frequency,from)=>{
    const data=audio.getChannelData(channel),begin=Math.round(from*rate);let real=0,imag=0;
    for(let i=0;i<rate/2;i++){const window=.5-.5*Math.cos(2*Math.PI*i/(rate/2-1)),phase=2*Math.PI*frequency*i/rate;real+=data[begin+i]*window*Math.cos(phase);imag+=data[begin+i]*window*Math.sin(phase)}
    return Math.hypot(real,imag);
  };
  assert.ok(magnitude(1,186,1.2)>magnitude(1,192,1.2)*10,'the beginning has a 6 Hz separation');
  assert.ok(magnitude(1,192,3.4)>magnitude(1,186,3.4)*10,'the end has a 12 Hz separation');
  assert.ok(magnitude(0,180,3.4)>magnitude(0,186,3.4)*10,'the left anchor stays at 180 Hz');
});

test('rapid sound changes fade out old graphs and keep output bounded',async()=>{
  const context=new webaudio.OfflineAudioContext(2,rate*5,rate),output=context.createGain();output.gain.value=.25;output.connect(context.destination);
  let layer;
  for(let index=0;index<12;index++){
    const at=index*.15;layer?.stop(at);
    layer=new QuietLayer(context,output,Object.keys(PRESETS)[index%4],events,.4,at);
  }
  layer.stop(2.2);const audio=await context.startRendering();let peak=0;
  for(let channel=0;channel<2;channel++)for(const value of audio.getChannelData(channel)){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value))}
  assert.ok(peak<.3,`switching headroom ${peak}`);assert.ok(rms(audio.getChannelData(0).subarray(rate*4))<1e-6);
});

test('Play reflects real startup; pause during preparation cancels playback and fixed mode ignores scroll',async t=>{
  const context=new webaudio.AudioContext({sinkId:{type:'none'}});let finishPreparation;
  const instrument=new QuietInstrument(events,{contextFactory:()=>context,prepare:()=>new Promise(resolve=>{finishPreparation=resolve})});
  const control=new SoundControl(instrument,{storage:{getItem:()=>null,setItem:()=>{}}});control.desired=false;
  t.after(async()=>{control.dispose();instrument.destroy();await context.close()});
  const pending=control.toggle();assert.notEqual(control.state,'playing');control.pause();finishPreparation();await pending;
  assert.equal(instrument.enabled,false);assert.equal(instrument.layer,null);assert.equal(control.state,'paused');
  instrument.prepare=async()=>{};await control.toggle();assert.equal(control.state,'playing');
  instrument.setResponsive(false);const position=instrument.position;instrument.move(.8);assert.equal(instrument.position,position);
  instrument.setResponsive(true,.3);instrument.move(.4);assert.equal(instrument.position,.4);
  const old=instrument.layer;instrument.select('tones');assert.ok(old.stopped);assert.equal(instrument.layer.id,'tones');
  instrument.select('binaural');instrument.setVolume(.15);assert.equal(instrument.volume,.15);
  control.pause();await delay(20);assert.equal(control.state,'paused');assert.equal(instrument.layer,null);assert.equal(instrument.pulse,null);
});

test('the page wires Play, all presets, fixed response, volume and navigation cleanup to the actual instrument',async t=>{
  const context=new webaudio.AudioContext({sinkId:{type:'none'}}),strudel=await import('../../assets/vendor/strudel.mjs');strudel.setAudioContext(context);
  const ids=['play','status','gesture-status','sound-name','sound-detail','scroll-detail','headphone-note','responsive','volume','volume-value'];
  const node=()=>({textContent:'',disabled:false,hidden:false,checked:true,value:'25',attributes:new Map(),setAttribute(name,value){this.attributes.set(name,value)}});
  const elements=new Map(ids.map(id=>[id,node()])),buttons=Object.keys(PRESETS).map(id=>({...node(),dataset:{preset:id}}));
  const previous=Object.fromEntries(['window','document','fetch','location','history','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,globalThis[key]]));
  const window=new EventTarget();Object.assign(window,{scrollY:0,innerHeight:800});
  const document=new EventTarget();Object.assign(document,{body:{dataset:{}},documentElement:{scrollHeight:4000},getElementById:id=>elements.get(id),querySelectorAll:()=>buttons});
  Object.assign(globalThis,{window,document,location:new URL('http://127.0.0.1:4173/experiments/quiet/index.html'),history:{replaceState:(_state,_title,url)=>{globalThis.location=new URL(url)}},
    fetch:async()=>({ok:true,text:()=>readFile(new URL('./drone.strudel',import.meta.url),'utf8')}),requestAnimationFrame:callback=>setTimeout(callback,0),cancelAnimationFrame:clearTimeout});
  t.after(async()=>{window.dispatchEvent(new Event('pagehide'));await context.close();Object.assign(globalThis,previous)});
  await import('./quiet.js');
  const play=elements.get('play');assert.equal(play.disabled,false);assert.equal(play.textContent,'Play sound');
  await play.onclick();assert.equal(play.attributes.get('aria-pressed'),'true');assert.match(elements.get('status').textContent,/playing/);
  window.scrollY=600;window.dispatchEvent(new Event('scroll'));await delay(100);
  assert.match(elements.get('gesture-status').textContent,/Colour 19% · responding/,'a real page scroll reaches the active sound and its readout');
  for(const button of buttons){button.onclick();assert.equal(button.attributes.get('aria-pressed'),'true');assert.equal(document.body.dataset.sound,button.dataset.preset)}
  assert.equal(elements.get('headphone-note').hidden,false);assert.equal(location.searchParams.get('sound'),'binaural');
  elements.get('responsive').checked=false;elements.get('responsive').onchange();assert.match(elements.get('gesture-status').textContent,/response off/);
  window.scrollY=1200;window.dispatchEvent(new Event('scroll'));await delay(60);assert.match(elements.get('gesture-status').textContent,/response off/);
  elements.get('volume').value='15';elements.get('volume').oninput();assert.equal(elements.get('volume-value').value,'15%');
  const cachedHide=new Event('pagehide');Object.defineProperty(cachedHide,'persisted',{value:true});window.dispatchEvent(cachedHide);
  assert.equal(elements.get('status').textContent,'Sound paused','cached navigation does not leave playback enabled');
  await play.onclick();assert.equal(play.attributes.get('aria-pressed'),'true','a restored page can explicitly play again');
  play.onclick();assert.equal(play.attributes.get('aria-pressed'),'false');assert.equal(elements.get('status').textContent,'Sound paused');
});
