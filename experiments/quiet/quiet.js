import {compileScore} from '../../music.js';
import {SoundControl} from '../../sound-control.js';
import {scrollProgress} from '../../motion.js';
import {QuietInstrument,PRESETS} from './audio.js';

const $=id=>document.getElementById(id);
const descriptions={
  brown:['More weight in the low frequencies, with very little to follow.','Scroll to open its upper texture. Faster movement adds a brief, airy wash; stopping lets it settle.'],
  pink:['A broader, airier texture with less emphasis on the high frequencies than white noise.','Scroll to gently brighten the noise. Its level stays steady.'],
  tones:['D and A hold a centre while a few pentatonic colours blend around them.','Scroll to move slowly through the harmony. Stop anywhere to hold it.'],
  binaural:['180 Hz in the left ear, with the right tone 6–12 Hz above it. A soft pink-noise bed sits underneath.','Scroll to gently change the beat spacing and noise colour. The left tone stays anchored.'],
};
let instrument,control,frame=0,ready=false;
const progress=()=>scrollProgress(window.scrollY,document.documentElement.scrollHeight,window.innerHeight);
function syncMotion(){
  if(!control||!instrument)return;
  const energy=instrument.layer?.flow?.energyAt(instrument.context.currentTime)??instrument.layer?.energyAt(instrument.context.currentTime)??0;
  const text=!instrument.follow?'Fixed sound / scroll response off':control.state!=='playing'?'Scroll response on':`Colour ${Math.round(instrument.position*100)}% · ${energy>.04?'responding':'held'}`;
  if($('gesture-status').textContent!==text)$('gesture-status').textContent=text;
}
function sync(){
  if(!control||!instrument)return;
  const state=control.state,playing=state==='playing',pending=state==='starting';
  $('play').disabled=!ready;$('play').textContent=playing||pending?'Pause sound':state==='error'?'Retry sound':control.desired?'Enable sound':'Play sound';
  $('play').setAttribute('aria-pressed',String(playing));
  $('status').textContent=state==='error'?'Sound needs another try':playing?`${PRESETS[instrument.id].name} · playing`:pending?'Starting sound…':control.desired?'Tap Play to enable sound':'Sound paused';
  syncMotion();
  document.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===instrument.id)));
  $('sound-name').textContent=PRESETS[instrument.id].name;
  [$('sound-detail').textContent,$('scroll-detail').textContent]=descriptions[instrument.id];
  $('headphone-note').hidden=instrument.id!=='binaural';
  document.body.dataset.sound=instrument.id;
}
try{
  const response=await fetch('./drone.strudel');if(!response.ok)throw new Error(`Score load: ${response.status}`);
  const {events}=await compileScore(await response.text());
  const requested=new URLSearchParams(location.search).get('sound');
  instrument=new QuietInstrument(events,{id:Object.hasOwn(PRESETS,requested)?requested:'brown',onChange:sync,onMotion:syncMotion});
  instrument.seek(progress());
  control=new SoundControl(instrument,{preferenceKey:'undertone.quiet.sound',onChange:sync,onError:error=>{console.error(error);sync()}});
  control.desired=false;ready=true;sync();
  $('play').onclick=()=>control.toggle();
  document.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>{
    instrument.select(button.dataset.preset);
    const url=new URL(location.href);url.searchParams.set('sound',instrument.id);history.replaceState({},'',url);sync();
  });
  $('responsive').onchange=()=>instrument.setResponsive($('responsive').checked,progress());
  $('volume').oninput=()=>{instrument.setVolume(Number($('volume').value)/100);$('volume-value').value=`${$('volume').value}%`};
  window.addEventListener('scroll',()=>{
    if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const travel=Math.max(.1,(document.documentElement.scrollHeight-window.innerHeight)/window.innerHeight);instrument.move(progress(),performance.now(),travel)});
  },{passive:true});
  window.addEventListener('resize',()=>instrument.seek(progress()));
  window.addEventListener('pagehide',event=>{
    cancelAnimationFrame(frame);frame=0;control.pause();
    if(!event.persisted){control.dispose();instrument.destroy()}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)instrument.seek(progress())});
}catch(error){console.error(error);$('status').textContent='Could not prepare the experiment. Reload to try again.';$('play').disabled=true}
