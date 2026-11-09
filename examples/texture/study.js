import {stories} from '../../stories.js';
import {createScrollScore} from '../../scroll-player.js';

const $=id=>document.getElementById(id),root=new URL('../../',import.meta.url);
const query=new URLSearchParams(location.search);
let player,scoreReady=false,revision=0,wanted=false,activeStory;
let touch=query.get('touch')==='notes'?'notes':'continuous';
$('story').replaceChildren(...Object.entries(stories).map(([id,story])=>{
 const option=document.createElement('option');option.value=id;
 option.textContent=`${story.feeling} / ${story.navSubject??story.titleText}`;return option;
}));
function sync(){
 const state=player?.state??'paused',playing=scoreReady&&state==='playing',pending=wanted&&(!scoreReady||state==='starting');
 $('play').disabled=!activeStory;$('play').textContent=playing||pending?'Pause':state==='error'?'Retry sound':wanted?'Enable sound':'Play sound';
 $('play').setAttribute('aria-pressed',String(playing));
 $('status').textContent=!scoreReady?'Loading the score…':!wanted?'Sound paused':state!=='playing'?state==='error'?'Sound needs another try':'Tap Play to enable sound':touch==='continuous'?'Flowing texture':'Scroll-played notes';
 $('hint').textContent=touch==='continuous'?'Move slowly to soften. Faster to swell.':'Scroll to hear separate notes. Stop to hold.';
 $('touch-description').textContent=touch==='continuous'?'A low, layered sound follows your movement. Notes blend within the harmony; scrolling faster gives it more presence, and stopping lets it soften.':'Individual note groups follow your scrolling, above a held harmony or continuing backing.';
 document.querySelectorAll('[data-touch]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.touch===touch)));
}
function motion(progress){
 $('percent').textContent=`${String(Math.round(progress*100)).padStart(2,'0')}%`;$('position').style.width=`${progress*100}%`;
 document.documentElement.style.setProperty('--progress',progress);
 document.documentElement.style.setProperty('--motion',player?.instrument.texture?.energyAt(player.instrument.context?.currentTime??0)??0);
}
async function selectStory(id){
 const ticket=++revision;id=Object.hasOwn(stories,id)?id:'space';const story=stories[id];activeStory=story;scoreReady=false;
 player?.pause();$('story').value=id;$('story').disabled=!player;
 $('title').textContent=story.titleText;$('intro').textContent=story.intro;
 $('palette').textContent=`${story.scale} / ${story.playback?.bpm?`${story.playback.bpm} BPM / `:''}same authored score in both touches`;
 $('image').src=new URL(story.image,root);$('image').alt=story.imageAlt;
 $('image-credit').textContent=story.imageCredit??'';
 $('attribution').textContent=`${story.fictional?'Fictional reading.':`Adapted from ${story.publisher}.`} Original music.`;
 $('source').hidden=!story.source;if(story.source)$('source').href=story.source;
 $('reading').replaceChildren(...story.chapters.map((chapter,index)=>{
  const section=document.createElement('section'),label=document.createElement('p'),heading=document.createElement('h2');
  label.className='eyebrow';label.textContent=`0${index+1} / ${['ENTER','LOOK CLOSER','STAY A WHILE'][index]}`;heading.textContent=chapter.title;section.append(label,heading);
  for(const text of chapter.text.split(/\n\s*\n/u)){const p=document.createElement('p');p.textContent=text.trim();section.append(p)}
  const cue=document.createElement('p');cue.className='chapter-cue';cue.textContent=chapter.cue;section.append(cue);return section;
 }));
 const url=new URL(location.href);url.searchParams.set('story',id);url.searchParams.set('touch',touch);history.replaceState({},'',url);
 scrollTo({top:0,behavior:'instant'});motion(0);sync();
 try{
  const scoreUrl=new URL(story.score,root).href,playback=story.playback??{mode:'hold'};
  if(!player){
   player=await createScrollScore({contentElement:document.documentElement,scoreUrl,touch,...playback,autoStart:false,
    preferenceKey:'undertone.home.sound',volume:Number($('volume').value)/100,onStateChange:sync,onNotes:sync,onIdle:sync,onProgress:motion,
    onError:error=>{console.error(error);sync()},
   });
   // A touch choice made during the initial fetch takes precedence over its initial option.
   player.setTouch(touch);
  }else await player.setScore(scoreUrl,playback);
  if(ticket!==revision)return;
  scoreReady=true;$('story').disabled=false;if(wanted)player.enable();sync();
 }catch(error){if(ticket===revision){console.error(error);$('status').textContent='Could not load this score.';$('play').disabled=true;$('story').disabled=false}}
}
$('play').onclick=()=>{
 const state=player?.state,pending=!scoreReady||state==='starting';wanted=!(wanted&&(state==='playing'||pending));
 if(!wanted)player?.pause();else if(scoreReady)player?.enable();sync();
};
document.querySelectorAll('[data-touch]').forEach(button=>button.onclick=()=>{
 touch=button.dataset.touch;player?.setTouch(touch);
 const url=new URL(location.href);url.searchParams.set('touch',touch);history.replaceState({},'',url);sync();
});
$('story').onchange=()=>selectStory($('story').value);
$('volume').oninput=()=>player?.setVolume(Number($('volume').value)/100);
await selectStory(query.get('story')??'space');
