import * as strudel from '../../assets/vendor/strudel.mjs';
import {clamp} from '../../motion.js';
import {FlowTexture,textureShape,textureColorMix} from '../../texture.js';

export const PRESETS=Object.freeze({
  brown:{name:'Brown noise',kind:'noise',cutoff:300,travel:1100,motion:1000},
  pink:{name:'Pink noise',kind:'noise',cutoff:650,travel:2550,motion:2400},
  tones:{name:'Soft tones',kind:'harmony',cutoff:500,travel:900,motion:2600},
  binaural:{name:'Binaural tones',kind:'binaural',cutoff:600,travel:1600,motion:1500},
});

export const RESPONSE=Object.freeze({minimumEnergy:.25,speedScale:.65,decaySeconds:.75,filterSeconds:.16,blendSeconds:.85});

export function quietShape(id,progress,energy=0){
  const preset=PRESETS[id];if(!preset)throw new TypeError('Unknown sound');
  const position=clamp(progress),motion=clamp(energy);
  return {cutoff:preset.cutoff+position*preset.travel+motion*preset.motion,level:1,beatDifference:Math.min(12,6+position*6+motion)};
}

const buffers=new WeakMap();
export function noiseBuffer(context,kind){
  if(!['pink','brown'].includes(kind))throw new TypeError('Unknown noise color');
  if(!buffers.has(context))buffers.set(context,new Map());
  const cached=buffers.get(context);if(cached.has(kind))return cached.get(kind);
  const length=Math.round(context.sampleRate*8),overlap=Math.round(context.sampleRate*.25),raw=new Float32Array(length+overlap);
  let seed=0x7f4a7c15,brown=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<raw.length;i++){
    seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
    const white=(seed>>>0)/2147483648-1;
    if(kind==='brown'){brown=(brown+.02*white)/1.02;raw[i]=brown}
    else{
      // The bundled Strudel engine uses the same pink-noise filter coefficients.
      b0=.99886*b0+white*.0555179;b1=.99332*b1+white*.0750759;b2=.969*b2+white*.153852;
      b3=.8665*b3+white*.3104856;b4=.55*b4+white*.5329522;b5=-.7616*b5-white*.016898;
      raw[i]=(b0+b1+b2+b3+b4+b5+b6+white*.5362)*.11;b6=white*.115926;
    }
  }
  const buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++){
    // The first sample continues the tail; a smooth overlap removes the loop splice.
    const blend=i<overlap?.5-.5*Math.cos(Math.PI*i/(overlap-1)):1;
    data[i]=i<overlap?raw[length+i]*(1-blend)+raw[i]*blend:raw[i];
  }
  const mean=data.reduce((sum,value)=>sum+value,0)/length;
  let power=0;for(let i=0;i<length;i++){data[i]-=mean;power+=data[i]**2}
  const scale=.14/Math.sqrt(power/length);for(let i=0;i<length;i++)data[i]*=scale;
  cached.set(kind,buffer);return buffer;
}

// Retain Undertone's pitch pool and harmonic blending with a quieter expression curve.
export class QuietFlow extends FlowTexture{
  tick(at=this.context.currentTime){
    if(this.stopped)return;
    const shape=quietShape('tones',this.position,this.energyAt(at));
    this.smooth(this.filter.frequency,shape.cutoff,at,RESPONSE.filterSeconds);
    this.smooth(this.filter.Q,0,at,.9);this.smooth(this.pan.pan,0,at,.9);
    this.smooth(this.bus.gain,1.6,at,.7);
    this.colorMix=textureColorMix(this.voicings,textureShape(this.position,0,0).weights);
    for(const color of this.colors)this.smooth(color.gain.gain,(this.colorMix.get(color.note)??0)*.55,at,RESPONSE.blendSeconds);
  }
}

export class QuietLayer{
  constructor(context,destination,id,events,progress=0,at=context.currentTime){
    if(!PRESETS[id])throw new TypeError('Unknown sound');
    this.context=context;this.id=id;this.position=clamp(progress);this.energy=0;this.lastMove=-Infinity;this.stopped=false;
    this.automation=new WeakMap();this.nodes=[];this.sources=[];
    this.bus=context.createGain();this.bus.gain.value=0;this.bus.connect(destination);this.nodes.push(this.bus);
    if(id==='tones')this.flow=new QuietFlow(context,this.bus,events,progress);
    else{
      this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.filter.Q.value=0;
      const highpass=context.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=35;highpass.Q.value=0;
      const level=context.createGain();level.gain.value=id==='binaural'?.15:id==='brown'?.45:.55;
      const noise=context.createBufferSource();noise.buffer=noiseBuffer(context,id==='brown'?'brown':'pink');noise.loop=true;
      noise.connect(highpass).connect(this.filter).connect(level).connect(this.bus);noise.start(at);
      this.nodes.push(highpass,this.filter,level);this.sources.push(noise);
      if(id==='binaural'){
        const merger=context.createChannelMerger(2),gain=context.createGain();gain.gain.value=.06;
        [180,180+quietShape(id,progress).beatDifference].forEach((frequency,channel)=>{
          const oscillator=context.createOscillator();oscillator.frequency.value=frequency;oscillator.connect(merger,0,channel);oscillator.start(at);this.sources.push(oscillator);
          if(channel===1)this.beatCarrier=oscillator;
        });
        merger.connect(gain).connect(this.bus);this.nodes.push(merger,gain);
      }
    }
    this.update(at);this.smooth(this.bus.gain,1,at,.65);
  }
  smooth(...args){return FlowTexture.prototype.smooth.apply(this,args)}
  input(progress,at=this.context.currentTime,travel=4){
    if(this.stopped||![progress,at,travel].every(Number.isFinite))return;
    const next=clamp(progress),distance=Math.abs(next-this.position)*Math.max(.1,travel);
    if(distance<.0004)return;
    const elapsed=at-this.lastMove>.2?.08:Math.max(.004,at-this.lastMove);
    const speed=Math.min(8,distance/elapsed);
    const target=RESPONSE.minimumEnergy+(1-RESPONSE.minimumEnergy)*(1-Math.exp(-speed/RESPONSE.speedScale));
    this.energy=this.energyAt(at)*.25+target*.75;this.position=next;this.lastMove=at;
    this.flow?.input(next,at,travel);
  }
  energyAt(at){return this.energy*Math.exp(-Math.max(0,at-this.lastMove-.1)/RESPONSE.decaySeconds)}
  seek(progress){
    if(!Number.isFinite(progress)||this.stopped)return;
    this.position=clamp(progress);this.energy=0;this.lastMove=-Infinity;this.flow?.seek(progress);
  }
  update(at=this.context.currentTime){
    if(this.stopped)return;
    const energy=this.energyAt(at);
    this.shape=quietShape(this.id,this.position,energy);
    if(this.filter)this.smooth(this.filter.frequency,this.shape.cutoff,at,RESPONSE.filterSeconds);
    if(this.beatCarrier)this.smooth(this.beatCarrier.frequency,180+this.shape.beatDifference,at,.35);
    this.flow?.tick(at);
  }
  stop(at=this.context.currentTime){
    if(this.stopped)return;this.stopped=true;
    this.smooth(this.bus.gain,0,at,.12);
    const end=at+1;
    if(this.flow){
      // Keep its inner release behind the outer fade when changing textures.
      this.flow.stop(end);
      const last=this.flow.sources.at(-1),ended=last?.onended;
      if(last)last.onended=()=>{ended?.();this.bus.disconnect()};else this.bus.disconnect();
    }else{
      let remaining=this.sources.length;
      for(const source of this.sources){source.onended=()=>{source.disconnect();if(--remaining===0)for(const node of this.nodes)node.disconnect()};source.stop(end)}
    }
  }
}

export class QuietInstrument{
  constructor(events,{id='brown',volume=.25,onChange=()=>{},onMotion=()=>{},contextFactory=()=>strudel.getAudioContext(),prepare=()=>strudel.registerSynthSounds()}={}){
    if(!PRESETS[id])throw new TypeError('Unknown sound');
    this.events=events;this.id=id;this.volume=clamp(volume);this.onChange=onChange;this.onMotion=onMotion;this.contextFactory=contextFactory;this.prepare=prepare;
    this.enabled=false;this.position=0;this.follow=true;this.epoch=0;
  }
  async enable(){
    const epoch=++this.epoch;this.context??=this.contextFactory();
    // Resume synchronously inside Play's gesture, as in the main player.
    const resumed=this.context.resume();resumed.catch(()=>{});
    await this.prepare();await resumed;if(epoch!==this.epoch)return false;
    if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination)}
    this.enabled=true;this.layer?.stop();this.layer=new QuietLayer(this.context,this.master,this.id,this.events,this.position);
    this.pulse??=setInterval(()=>this.tick(),40);this.onChange();return true;
  }
  tick(){if(this.enabled&&this.context.state==='running'){this.layer?.update();this.onMotion()}}
  select(id){
    if(!PRESETS[id])throw new TypeError('Unknown sound');
    if(id===this.id)return;this.id=id;
    if(this.enabled&&this.context.state==='running'){this.layer?.stop();this.layer=new QuietLayer(this.context,this.master,id,this.events,this.position)}
    this.onChange();
  }
  move(progress,at=performance.now(),travel=4){
    if(!Number.isFinite(progress)||!this.follow)return;
    this.position=clamp(progress);if(this.enabled&&this.context.state==='running')this.layer?.input(this.position,this.context.currentTime,travel);
  }
  seek(progress){if(Number.isFinite(progress)&&this.follow){this.position=clamp(progress);this.layer?.seek(this.position)}}
  setResponsive(follow,progress=this.position){this.follow=Boolean(follow);if(this.follow)this.seek(progress);else this.layer?.seek(this.position);this.onChange()}
  setVolume(volume){
    if(!Number.isFinite(volume))return;this.volume=clamp(volume);
    if(this.master){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(this.volume,now,.2)}
  }
  mute(){this.epoch++;this.enabled=false;clearInterval(this.pulse);this.pulse=null;this.layer?.stop();this.layer=null;this.onChange()}
  destroy(){this.mute();this.master?.disconnect()}
}
