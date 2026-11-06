import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {expressiveVoices,isPercussion,midiOf,pitchClassOf,ReadingConductor} from '../motion.js';

globalThis.window=new EventTarget();globalThis.document=new EventTarget();
const {compileScore}=await import('../music.js');
const {heldNotes,timbreAt}=await import('../harmony.js');
const scores=new Map();
for(const id of ['mall','vhs','courier']) scores.set(id,await compileScore(await readFile(new URL(`../scores/${id}.strudel`,import.meta.url),'utf8')));

test('drum-only steps keep the last melody and preserve percussion transients',()=>{
  const events=['u_kick','u_hat','u_snare'].map(s=>({value:{s,gain:0.2,attack:0.001,release:0.06}}));
  for(const mode of ['slow','reading','skim']){
    const result=expressiveVoices({events,mode,duration:0.4,gainScale:0.9,releaseScale:3.8,speed:4},64);
    assert.equal(result.nextMelody,64);
    assert.equal(result.voices.length,3);
    for(const voice of result.voices){assert.equal(voice.value.note,undefined);assert.equal(voice.value.attack,0.001);assert.equal(voice.value.delay,0);}
  }
});

test('small ongoing movements rearticulate the current pitched phrase instead of a nearby hat',()=>{
  const pitched={onset:0,value:{s:'haze',note:'c4',gain:0.1}};
  const hat={onset:1,value:{s:'u_hat',gain:0.03}};
  const conductor=new ReadingConductor([pitched,hat],0.1);
  conductor.input(0.101,1000,4);
  const step=conductor.take(1000);
  assert.ok(step.events.some(event=>event.value.note==='c4'));
});

test('fast chord simplification retains the kick and hats',()=>{
  const events=['c4','e4','g4','b4'].map(note=>({value:{note,s:'haze',gain:0.1}}));
  events.push({value:{s:'u_kick',gain:0.24}},{value:{s:'u_hat',gain:0.05}});
  const shaped=expressiveVoices({events,mode:'skim',duration:0.08,gainScale:0.8,releaseScale:1.4,speed:8},64);
  assert.equal(shaped.voices.filter(voice=>isPercussion(voice.value)).length,2);
  assert.equal(shaped.voices.filter(voice=>!isPercussion(voice.value)).length,2);
});

test('percussion cannot determine the held root or instrument',()=>{
  for(const score of scores.values()){
    const tonal=score.events.filter(event=>!isPercussion(event.value));
    assert.deepEqual(heldNotes(score.events),heldNotes(tonal));
    for(const progress of [0,0.23,0.5,0.87]){
      assert.deepEqual(timbreAt(score.events,progress),timbreAt(tonal,progress));
      assert.ok(heldNotes(score.events,null,progress).every(note=>Number.isFinite(midiOf(note))));
    }
  }
});

test('the genre studies have distinct harmonic, sample and drum structures',()=>{
  const mall=scores.get('mall').events;
  const initial=mall.filter(event=>event.onset===0 && event.value.s==='haze');
  const classes=initial.map(event=>pitchClassOf(event.value.note));
  assert.ok(classes.includes(1) && classes.includes(4),'D major seventh and ninth appear in the opening voicing');
  assert.ok(initial.every(event=>event.value.vib>0 && event.value.spread>0));
  assert.ok(scores.get('vhs').events.filter(event=>event.value.s==='u_tape').every(event=>event.value.speed===0.5));
  const kicks=id=>scores.get(id).events.filter(event=>event.onset<1 && event.value.s==='u_kick').map(event=>event.onset);
  assert.deepEqual(kicks('mall'),[0,0.5]);
  assert.deepEqual(kicks('courier'),[0,0.375,0.75]);
  assert.notDeepEqual(kicks('courier'),kicks('mall'));
  assert.ok(scores.get('courier').events.some(event=>event.value.s==='grit' && event.value.drive>=3));
});
