import {ScrollInstrument} from './music.js';
import {clamp,isPercussion,midiOf,pitchClassOf,SCORE_CYCLES} from './motion.js';
import {heldNotes} from './harmony.js';

export const TEXTURE_RESPONSE=Object.freeze({
 minimumEnergy:.22,speedScale:.9,decaySeconds:.8,
 cutoffRest:420,cutoffTravel:300,cutoffMotion:5200,stereoWidth:.42,
 filterSeconds:.07,panSeconds:.12,gainRest:.82,gainMotion:.4,gainSeconds:.14,
});

export const HARMONY_RESPONSE=Object.freeze({
 frames:SCORE_CYCLES,blendSeconds:.45,
 colorLevels:Object.freeze([.045,.034]),
});

function textureForeground(events){
 const pitched=events.filter(event=>!isPercussion(event.value)&&midiOf(event.value.note)!==null);
 let foreground=pitched.filter(event=>event.value.orbit===1);
 if(!foreground.length){
  // Older hold scores have no lead orbit. Use their loudest authored sound layer.
  const layers=new Map();
  for(const event of pitched){
   const key=`${event.value.orbit??0}:${event.value.s??''}`;
   if(!layers.has(key))layers.set(key,[]);layers.get(key).push(event);
  }
  const level=layer=>layer.reduce((sum,event)=>sum+(event.value.gain??.1),0)/layer.length;
  foreground=[...layers.values()].sort((a,b)=>level(b)-level(a))[0]??[];
 }
 return foreground;
}

function bassRoot(foreground){
 const notes=foreground.map(event=>midiOf(event.value.note));
 if(!notes.length||!notes.every(note=>note>=24&&note<45))return null;
 const onset=Math.min(...foreground.map(event=>event.onset));
 const root=Math.min(...foreground.filter(event=>event.onset===onset).map(event=>midiOf(event.value.note)));
 return root<=36?root:null;
}

// Use the same authored foreground for pitch and sound selection.
export function textureTimbre(events){
 const foreground=textureForeground(events),value=foreground[0]?.value??{};
 const profile=(kind,label,partials,options={})=>({kind,label,partials,detune:2.2,cutoff:1,level:1,...options});
 if(bassRoot(foreground)!==null)return profile('bass','Deep bass',[1,.23,.08],{detune:.5,cutoff:.18});
 if(foreground.some(event=>event.value.vowel))return profile('choir','Vowel choir',[1,.6,.32,.2,.12,.08],{formant:1100,detune:3.5,cutoff:1.6});
 if(value.s==='porcelain')return profile('porcelain','Bowed glass',[1,.06,.52,.025,.22,.015,.1],{detune:.7,cutoff:2});
 if(value.s==='haze'||value.s==='u_tape')return profile('tape','Tape choir',[1,.55,.22,.1,.045],{detune:7,cutoff:1.2,wow:.23});
 if(value.s==='user'&&value.partials){
  const richest=foreground.reduce((best,event)=>(event.value.partials?.length??0)>best.length?event.value.partials:best,value.partials);
  return profile('organ','Harmonic organ',[...richest],{detune:0,cutoff:2.4});
 }
 if(value.s==='sawtooth'||value.s==='grit')return profile('strings','Bowed strings',[1,.65,.48,.35,.27,.21,.16,.12,.09,.06],{detune:6,cutoff:1.65,level:.85});
 if(['triangle','square','z_square'].includes(value.s))return profile('reed','Hollow reeds',[1,.025,.7,.015,.42,.01,.23,.005,.12],{detune:1.1,formant:850,cutoff:1.5,level:.85});
 if(foreground.some(event=>event.value.fmi>0))return profile('metal','Metal shimmer',[1,.12,.06],{detune:1,cutoff:2.2,fmRatio:clamp(value.fmh??2,.5,4),fmDepth:.42});
 return profile('glass','Soft glass',[1,.42,.25,.16,.11,.075,.05,.035]);
}

export function textureMelody(events){
 const foreground=textureForeground(events),onsets=new Map();
 for(const event of foreground){
  const note=midiOf(event.value.note),previous=onsets.get(event.onset);
  // A chord on the lead layer becomes its top voice; accompaniment stays separate.
  if(previous===undefined||note>previous)onsets.set(event.onset,note);
 }
 return [...onsets].sort((a,b)=>a[0]-b[0]).map(([onset,note])=>({onset,note}));
}

const frequencyOf=note=>440*2**((note-69)/12);

export function textureVoicings(events){
 const pitched=events.filter(event=>!isPercussion(event.value)&&midiOf(event.value.note)!==null);
 if(!pitched.length)return [];
 const bass=bassRoot(textureForeground(events)),root=bass??heldNotes(pitched)[0],rootClass=pitchClassOf(root);
 const colorBase=root+(bass===null?12:0);
 const collection=new Set(pitched.map(event=>pitchClassOf(event.value.note)));
 const fifth=collection.has(pitchClassOf(root+7))?root+7:root+12;
 const melody=textureMelody(events),width=SCORE_CYCLES/HARMONY_RESPONSE.frames;
 return Array.from({length:HARMONY_RESPONSE.frames},(_,frame)=>{
  // Spread a phrase's opening and closing colors into the harmony, in one low register.
  const colors=melody.filter(event=>event.onset>=frame*width&&event.onset<(frame+1)*width)
   .map(event=>pitchClassOf(event.note)).filter(pc=>pc!==rootClass&&pc!==pitchClassOf(fifth))
   .map(pc=>colorBase+(pc-rootClass+12)%12);
  const first=colors[0]??root+12,last=colors.findLast(note=>note!==first)??root+12;
  return [root,fifth,first,last];
 });
}

export function textureShape(progress,energy=0,direction=0,frames=HARMONY_RESPONSE.frames){
 const position=clamp(progress)*(frames-1),left=Math.min(frames-1,Math.floor(position)),fraction=position-left;
 const weights=Array(frames).fill(0);weights[left]=Math.cos(fraction*Math.PI/2);
 if(left<frames-1)weights[left+1]=Math.sin(fraction*Math.PI/2);
 const motion=clamp(energy);
 return {weights,cutoff:TEXTURE_RESPONSE.cutoffRest+clamp(progress)*TEXTURE_RESPONSE.cutoffTravel+motion*TEXTURE_RESPONSE.cutoffMotion,
  pan:Math.max(-1,Math.min(1,direction))*TEXTURE_RESPONSE.stereoWidth,level:TEXTURE_RESPONSE.gainRest+motion*TEXTURE_RESPONSE.gainMotion,color:.45+motion*.55,resonance:.4+motion*.35};
}

export function textureColorMix(voicings,weights){
 const mix=new Map();let power=0;
 voicings.forEach((notes,index)=>{
  const weight=weights[index]??0;if(!weight)return;
  const frame=new Map();
  notes.slice(2).forEach((note,voice)=>frame.set(note,(frame.get(note)??0)+HARMONY_RESPONSE.colorLevels[voice]));
  for(const [note,level] of frame){mix.set(note,(mix.get(note)??0)+level*weight);power+=(level*weight)**2}
 });
 // Shared tones use the same voices, so overlap must not create a volume bump.
 const sum=[...mix.values()].reduce((total,level)=>total+level*level,0),scale=sum?Math.sqrt(power/sum):1;
 return new Map([...mix].map(([note,level])=>[note,level*scale]));
}

// Fixed-pitch voices blend into changing harmony; there is no separate solo line.
export class FlowTexture{
 constructor(context,destination,events,progress=0){
  this.context=context;this.voicings=textureVoicings(events);this.position=clamp(progress);this.timbre=textureTimbre(events);
  this.automation=new WeakMap();
  this.energy=0;this.direction=0;this.lastInputAt=-Infinity;this.lastSpeedAt=-Infinity;this.stopped=false;
  this.bus=context.createGain();this.bus.gain.value=0;this.bus.connect(destination);
  this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.filter.Q.value=.4;
  this.pan=context.createStereoPanner();this.filter.connect(this.pan).connect(this.bus);
  this.nodes=[this.bus,this.filter,this.pan];this.sources=[];this.colors=[];
  if(!this.voicings.length)return;
  let colorDestination=this.filter;
  if(this.timbre.formant){
   const formant=context.createBiquadFilter();formant.type='peaking';formant.frequency.value=this.timbre.formant;formant.Q.value=1.1;formant.gain.value=6;
   formant.connect(this.filter);this.nodes.push(formant);colorDestination=formant;
  }
  // Color voices inherit the authored sound; the pedal stays restrained underneath.
  const imag=new Float32Array([0,...this.timbre.partials]),real=new Float32Array(imag.length);
  const wave=context.createPeriodicWave(real,imag);
  let wow;
  if(this.timbre.wow){
   const oscillator=context.createOscillator();oscillator.frequency.value=this.timbre.wow;
   wow=context.createGain();wow.gain.value=4;oscillator.connect(wow);oscillator.start();this.sources.push(oscillator);this.nodes.push(wow);
  }
  const voice=(note,level,destination,{pedal=false}={})=>{
   const gain=context.createGain();gain.gain.value=level;gain.connect(destination);this.nodes.push(gain);
   const sources=[];
   let modulation;
   if(!pedal&&this.timbre.fmDepth){
    const oscillator=context.createOscillator();oscillator.frequency.value=frequencyOf(note)*this.timbre.fmRatio;
    modulation=context.createGain();modulation.gain.value=frequencyOf(note)*this.timbre.fmDepth;
    oscillator.connect(modulation);oscillator.start();this.sources.push(oscillator);this.nodes.push(modulation);
   }
   const spread=pedal?2.2:this.timbre.detune;
   for(const cents of [-spread,spread]){
    const oscillator=context.createOscillator();
    if(pedal)oscillator.type='sine';else oscillator.setPeriodicWave(wave);
    oscillator.frequency.value=frequencyOf(note);oscillator.detune.value=cents;
    if(!pedal){wow?.connect(oscillator.detune);modulation?.connect(oscillator.frequency)}
    oscillator.connect(gain);oscillator.start();this.sources.push(oscillator);sources.push(oscillator);
   }
   return {gain,sources,note};
  };
  voice(this.voicings[0][0],.028,this.filter,{pedal:true});voice(this.voicings[0][1],.016,this.filter,{pedal:true});
  const pitches=new Set(this.voicings.flatMap(notes=>notes.slice(2)));
  for(const note of pitches)this.colors.push(voice(note,0,colorDestination));
  this.tick(context.currentTime);
 }
 input(progress,at=this.context.currentTime,travel=4){
  if(this.stopped||![progress,at,travel].every(Number.isFinite))return false;
  const next=clamp(progress),delta=next-this.position;
  if(Math.abs(delta)*Math.max(.1,travel)<.0004)return false;
  const elapsed=at-this.lastSpeedAt>.2?.08:Math.max(.004,at-this.lastSpeedAt);
  const speed=Math.min(8,Math.abs(delta)*Math.max(.1,travel)/elapsed);
  const target=TEXTURE_RESPONSE.minimumEnergy+(1-TEXTURE_RESPONSE.minimumEnergy)*(1-Math.exp(-speed/TEXTURE_RESPONSE.speedScale));
  this.energy=this.energyAt(at)*.25+target*.75;this.direction=delta>0?1:-1;
  this.position=next;this.lastInputAt=at;this.lastSpeedAt=at;return true;
 }
 energyAt(at){return this.energy*Math.exp(-Math.max(0,at-this.lastInputAt-.12)/TEXTURE_RESPONSE.decaySeconds)}
 seek(progress){
  if(this.stopped||!Number.isFinite(progress))return;
  this.position=clamp(progress);this.energy=0;this.direction=0;this.lastInputAt=-Infinity;this.lastSpeedAt=-Infinity;
 }
 get notes(){return this.voicings.length?[...this.voicings[0].slice(0,2),...[...this.colorMix].filter(([,level])=>level>.001).map(([note])=>note)]:[]}
 smooth(parameter,value,at,seconds){
  const previous=this.automation.get(parameter);
  if(previous?.target===value&&previous.seconds===seconds)return;
  // Anchor interrupted envelopes explicitly instead of reading a stale AudioParam value.
  const current=previous?previous.target+(previous.from-previous.target)*Math.exp(-Math.max(0,at-previous.at)/previous.seconds):parameter.value;
  parameter.cancelScheduledValues(at);parameter.setValueAtTime(current,at);parameter.setTargetAtTime(value,at,seconds);
  this.automation.set(parameter,{from:current,target:value,at,seconds});
 }
 tick(at=this.context.currentTime){
  if(this.stopped)return;
  const energy=this.energyAt(at),shape=textureShape(this.position,energy,this.direction*energy);
  this.smooth(this.filter.frequency,Math.min(this.context.sampleRate*.45,shape.cutoff*this.timbre.cutoff),at,TEXTURE_RESPONSE.filterSeconds);
  this.smooth(this.filter.Q,shape.resonance,at,TEXTURE_RESPONSE.filterSeconds);
  this.smooth(this.pan.pan,shape.pan,at,TEXTURE_RESPONSE.panSeconds);
  this.smooth(this.bus.gain,shape.level,at,TEXTURE_RESPONSE.gainSeconds);
  this.colorMix=textureColorMix(this.voicings,shape.weights);
  for(const color of this.colors)this.smooth(color.gain.gain,(this.colorMix.get(color.note)??0)*shape.color*this.timbre.level,at,HARMONY_RESPONSE.blendSeconds);
 }
 stop(at=this.context.currentTime){
  if(this.stopped)return;this.stopped=true;
  this.smooth(this.bus.gain,0,at,.008);
  let remaining=this.sources.length;
  const cleanup=()=>{for(const node of this.nodes)node.disconnect()};
  if(!remaining){cleanup();return}
  for(const source of this.sources){source.onended=()=>{source.disconnect();if(--remaining===0)cleanup()};source.stop(at+.06)}
 }
}

export class TextureInstrument extends ScrollInstrument{
 constructor(onNotes,onIdle,onError,{touch='continuous'}={}){
  super(onNotes,onIdle,onError);
  if(!['notes','continuous'].includes(touch))throw new TypeError('Touch must be notes or continuous');
  this.touch=touch;
 }
 setScore(events,progress=0,playback=null){
  this.authoredPlayback=playback?{...playback}:null;
  super.setScore(events,progress,this.playbackForTouch());
 }
 playbackForTouch(){return this.authoredPlayback?{...this.authoredPlayback,gesture:this.touch==='continuous'?false:this.authoredPlayback.gesture}:null}
 setTouch(touch){
  if(!['notes','continuous'].includes(touch))throw new TypeError('Touch must be notes or continuous');
  if(touch===this.touch)return;
  this.silence();this.touch=touch;this.playback=this.playbackForTouch();this.setPosition(this.lastProgress);this.holdCurrent();
 }
 setPosition(progress){super.setPosition(progress);this.texture?.seek(this.lastProgress)}
 silence(){this.texture?.stop();this.texture=null;super.silence()}
 holdCurrent(){
  if(this.touch!=='continuous')return super.holdCurrent();
  if(!this.enabled||!this.events.length||this.context.state!=='running'||globalThis.document?.hidden)return;
  if(this.playback?.mode==='groove')super.holdCurrent();
  this.texture??=new FlowTexture(this.context,this.controller.output.destinationGain,this.events,this.lastProgress);
  this.texture.seek(this.lastProgress);this.texture.tick();
  if(!this.sounding)this.rampGain(this.volume,.25);
  this.sounding=true;this.holding=true;
  this.onIdle?.(this.groove?'loop':'hold',this.texture.notes);
  this.pulse??=setInterval(()=>this.pump(performance.now()),30);
 }
 move(progress,timestamp=performance.now(),travel=4){
  if(this.touch!=='continuous')return super.move(progress,timestamp,travel);
  this.lastProgress=clamp(progress);
  if(!this.enabled||this.context.state!=='running')return;
  const moved=this.texture?.input(this.lastProgress,this.context.currentTime,travel);
  this.groove?.input(this.lastProgress,this.context.currentTime,travel);
  this.pump(timestamp);
  if(moved){
   this.holding=false;
   this.onNotes?.(this.texture.notes,this.texture.direction>0?'forward':'backward','texture');
  }
 }
 pump(timestamp){
  if(this.touch!=='continuous')return super.pump(timestamp);
  if(!this.enabled||this.context.state!=='running'){this.silence();return}
  if(this.groove)this.pumpGroove();
  this.texture?.tick();
  if(this.texture&&this.context.currentTime-this.texture.lastInputAt>.2&&!this.holding){
   this.holding=true;this.onIdle?.(this.groove?'loop':'hold',this.texture.notes);
  }
 }
}
