import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import * as webaudio from 'node-web-audio-api';
Object.assign(globalThis,webaudio);
class Article {isConnected=true;scrollHeight=3600;getBoundingClientRect(){return {top:0}}}
globalThis.Element=Article;
globalThis.window=Object.assign(new EventTarget(),{scrollY:0,innerHeight:600});
globalThis.document=Object.assign(new EventTarget(),{documentElement:new Article(),hidden:false});
globalThis.requestAnimationFrame=callback=>setTimeout(callback,0);globalThis.cancelAnimationFrame=clearTimeout;
const nativeFetch=globalThis.fetch;
globalThis.fetch=async url=>typeof url==='string'&&!url.includes('/')?{ok:true,text:()=>readFile(new URL(`../scores/${url}`,import.meta.url),'utf8')}:nativeFetch(url);
const strudel=await import('../assets/vendor/strudel.mjs');
const {createScrollScore}=await import('../scroll-player.js');

test('public API changes touch during playback, keeps score/transport and releases both audio paths',async t=>{
 const context=new webaudio.AudioContext({sinkId:{type:'none'}});strudel.setAudioContext(context);strudel.setSuperdoughAudioController(undefined);
 const errors=[],player=await createScrollScore({contentElement:document.documentElement,scoreUrl:'space.strudel',touch:'continuous',autoStart:false,onError:error=>errors.push(error)});
 t.after(async()=>{player.destroy();await context.close()});
 assert.equal(player.state,'paused');assert.equal(player.instrument.enabled,false);
 await player.enable();assert.equal(player.state,'playing');
 const first=player.instrument.texture;assert.ok(first);
 window.scrollY=900;window.dispatchEvent(new Event('scroll'));await delay(30);
 assert.ok(player.instrument.lastProgress>0);const position=player.instrument.lastProgress;
 player.setTouch('notes');assert.equal(player.state,'playing');assert.equal(first.stopped,true);assert.ok(player.instrument.harmony);
 assert.equal(player.instrument.lastProgress,position);
 player.setTouch('continuous');assert.ok(player.instrument.texture);assert.equal(player.instrument.harmony,null);
 await player.setScore('mall.strudel',{mode:'groove',bpm:72,character:'vaporwave'});
 assert.equal(player.touch,'continuous');assert.equal(player.instrument.playback.gesture,false);assert.ok(player.groove);
 player.setTouch('notes');assert.equal(player.instrument.playback.gesture,true);assert.equal(player.state,'playing');
 player.pause();player.setTouch('continuous');assert.equal(player.state,'paused');assert.equal(player.instrument.texture,null);
 await player.enable();const final=player.instrument.texture;assert.ok(final);player.destroy();await delay(100);
 assert.equal(final.stopped,true);assert.equal(player.instrument.pulse,null);assert.equal(player.instrument.enabled,false);assert.deepEqual(errors,[]);
});
