import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stories} from '../stories.js';
import {pitchClassOf} from '../motion.js';
globalThis.window=new EventTarget();globalThis.document=new EventTarget();
const {compileScore}=await import('../music.js');
const {textureVoicings,textureShape,textureMelody,textureColorMix,textureTimbre,HARMONY_RESPONSE}=await import('../texture.js');
const openings={space:[62,69,76,78,69,76,78,80],reef:[50,57,63,62,65,63,62,57],mall:[74,73,69,66,64,66,69,71]};
for(const id of ['space','reef','mall']){
 const score=await compileScore(await readFile(new URL(`../scores/${id}.strudel`,import.meta.url),'utf8'));
 test(`${id}: continuous voicings retain the source collection and a stable pedal`,()=>{
  const voicings=textureVoicings(score.events);assert.equal(voicings.length,HARMONY_RESPONSE.frames);
  for(const notes of voicings){assert.equal(notes.length,4);assert.deepEqual(notes.slice(0,2),voicings[0].slice(0,2));assert.ok(notes.every(note=>stories[id].pitchClasses.includes(pitchClassOf(note))))}
  assert.ok(new Set(voicings.map(notes=>notes.slice(2).join(','))).size>=4,'the harmony changes throughout the reading');
  assert.ok(voicings.every(notes=>notes.slice(2).every(note=>note>=notes[0]+12&&note<notes[0]+24)),'colors stay within one low register');
 });
 test(`${id}: harmonic colors draw from the authored lead rather than unrelated invented notes`,()=>{
  const melody=textureMelody(score.events);
  assert.deepEqual(melody.slice(0,8).map(event=>event.note),openings[id]);
  assert.ok(new Set(melody.map(event=>event.note)).size>=6);
  assert.ok(melody.every(event=>stories[id].pitchClasses.includes(pitchClassOf(event.note))));
  assert.ok(melody.every((event,index)=>index===0||event.onset>melody[index-1].onset));
  for(let chapter=0;chapter<3;chapter++)assert.ok(melody.some(event=>event.onset>=chapter*4&&event.onset<(chapter+1)*4));
 });
}
test('an explicit lead orbit wins over louder accompaniment and percussion; chords use one top voice',()=>{
 const event=(onset,note,s,gain,orbit)=>({onset,value:{note,s,gain,orbit}});
 const melody=textureMelody([
  event(2,'f4','sine',.2,1),event(0,'d2','sine',.9,2),event(1,'c1','u_kick',1,1),
  event(0,'d4','sine',.2,1),event(0,'a4','sine',.2,1),event(1,'e4','sine',.2,1),
 ]);
 assert.deepEqual(melody,[{onset:0,note:69},{onset:1,note:64},{onset:2,note:65}]);
 assert.deepEqual(textureMelody([]),[]);
});
test('harmonic bank weights crossfade continuously with bounded energy and no passage jump',()=>{
 let previous=textureShape(0).weights;
 for(let step=1;step<=1000;step++){
  const weights=textureShape(step/1000).weights;
  assert.ok(weights.every((weight,index)=>weight>=0&&weight<=1&&Math.abs(weight-previous[index])<.02));
  assert.ok(Math.abs(weights.reduce((sum,value)=>sum+value*value,0)-1)<1e-10);previous=weights;
 }
 assert.deepEqual(textureShape(0).weights,[1,...Array(HARMONY_RESPONSE.frames-1).fill(0)]);
 assert.deepEqual(textureShape(1).weights,[...Array(HARMONY_RESPONSE.frames-1).fill(0),1]);
});
test('common tones do not swell when adjacent harmonies overlap',()=>{
 const voicings=[[50,57,64,66],[50,57,64,66]],start=textureColorMix(voicings,[1,0]);
 for(let step=0;step<=100;step++){
  const mix=textureColorMix(voicings,textureShape(step/100,0,0,2).weights);
  for(const [note,level] of start)assert.ok(Math.abs(mix.get(note)-level)<1e-12);
 }
});
test('scroll energy opens harmonic detail and stereo movement with a bounded volume swell',()=>{
 const still=textureShape(.4,0,0),forward=textureShape(.4,1,1),backward=textureShape(.4,1,-1);
 assert.deepEqual(forward.weights,still.weights);assert.ok(forward.cutoff>still.cutoff*2);
 assert.equal(backward.pan,-forward.pan);assert.ok(forward.pan>=.4&&forward.pan<=.45);
 assert.ok(forward.cutoff-still.cutoff>=5000);assert.ok(forward.color/still.color>2);
 assert.ok(forward.level/still.level<1.5);assert.deepEqual(textureVoicings([]),[]);
});

test('continuous sound families follow the authored foreground across the catalogue',async()=>{
 const families={space:'glass',reef:'reed',erosion:'strings',fireflies:'organ',bell:'metal',porcelain:'porcelain',library:'choir',mall:'metal',vhs:'tape',depths:'bass'};
 for(const [id,kind] of Object.entries(families)){
  const score=await compileScore(await readFile(new URL(`../scores/${id}.strudel`,import.meta.url),'utf8'));
  assert.equal(textureTimbre(score.events).kind,kind,id);
 }
 const event=(s,gain,orbit,extra={})=>({onset:0,value:{note:'d4',s,gain,orbit,...extra}});
 assert.equal(textureTimbre([event('sawtooth',.9,2),event('sine',.1,1,{fmi:.8})]).kind,'metal','an explicit lead wins over louder backing');
 assert.equal(textureTimbre([event('triangle',.1,0),event('sawtooth',.3,0)]).kind,'strings','older scores use the loudest authored layer');
 assert.equal(textureTimbre([]).kind,'glass');
});

test('the deep bass study preserves D1 and low colors instead of folding them into the normal register',async()=>{
 const score=await compileScore(await readFile(new URL('../scores/depths.strudel',import.meta.url),'utf8'));
 const voicings=textureVoicings(score.events);
 assert.ok(voicings.every(notes=>notes[0]===26&&notes[1]===33),'D1 and A1 remain the foundation');
 assert.ok(voicings.flat().every(note=>note>=26&&note<=38),'every continuous pitch is between 36.7 and 73.4 Hz');
 assert.ok(new Set(voicings.map(notes=>notes.join(','))).size>=4,'the low harmony still changes');
 for(const notes of voicings)assert.ok(notes.every(note=>stories.depths.pitchClasses.includes(pitchClassOf(note))));
});
