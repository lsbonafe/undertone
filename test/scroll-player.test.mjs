import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  isConnected = true;
  scrollHeight = 2400;
  getBoundingClientRect() { return { top:100 - window.scrollY }; }
}
const listeners = new Map();
const target = {
  addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); },
  removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
};
globalThis.Element = FakeElement;
globalThis.window = { ...target, scrollY:0, innerHeight:600 };
globalThis.document = { ...target, dispatchEvent() {}, hidden:false, documentElement:new FakeElement() };
const { createScrollScore } = await import('../scroll-player.js');
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.fetch = async url => ({ ok:!url.includes('missing'), status:404, text:async () => 'note("d4 fs4 a4").s("sine")' });

const article = new FakeElement();

test('a standalone article can load, move, change scores and release its listeners', async () => {
  const progress = [];
  const player = await createScrollScore({ contentElement:article, scoreUrl:'first.strudel', autoStart:false, onProgress:value => progress.push(value) });
  assert.equal(player.state, 'paused');
  assert.equal(player.touch, 'notes');
  assert.ok(player.instrument.events.length);
  window.scrollY = 400;
  for (const handler of listeners.get('scroll')) handler();
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.ok(progress.at(-1) > 0);
  await player.setScore('second.strudel');
  assert.ok(player.instrument.events.length);
  assert.equal(player.instrument.lastProgress, progress.at(-1));
  await player.setScore('second.strudel', { mode:'groove', bpm:90 });
  assert.equal(player.instrument.playback.bpm, 90);
  await player.setScore('first.strudel');
  assert.equal(player.instrument.playback.bpm, 90, 'score replacement retains the current playback mode');
  await player.setScore('first.strudel', { mode:'hold' });
  assert.equal(player.instrument.playback, null);
  assert.equal(listeners.get('scroll').size, 1);
  player.destroy();
  assert.equal(listeners.get('scroll').size, 0);
  assert.equal(listeners.get('keydown').size, 0);
  await assert.rejects(player.setScore('first.strudel'), /destroyed/);
});

test('invalid settings and failed loads report errors without trapping a new player', async () => {
  await assert.rejects(createScrollScore({ contentElement:article, scoreUrl:'x', mode:'groove' }), /bpm/);
  await assert.rejects(createScrollScore({ contentElement:article, scoreUrl:'x', touch:'other' }), /touch/);
  await assert.rejects(createScrollScore({ contentElement:article, scoreUrl:'missing.strudel', autoStart:false }), /404/);
  const player = await createScrollScore({ contentElement:article, scoreUrl:'first.strudel', autoStart:false });
  await assert.rejects(createScrollScore({ contentElement:article, scoreUrl:'first.strudel', autoStart:false }), /Only one/);
  await assert.rejects(player.setScore('first.strudel', { mode:'groove' }), /bpm/);
  assert.ok(player.instrument.events.length, 'invalid settings keep the current score');
  assert.ok(player);
  player.destroy();
});

test('touch selection survives score loads and preserves paused playback', async () => {
  const player = await createScrollScore({ contentElement:article, scoreUrl:'first.strudel', touch:'continuous', autoStart:false });
  try {
    assert.equal(player.touch,'continuous');
    assert.equal(player.desired,false);
    for (const handler of listeners.get('click')) handler({isTrusted:true,target:{closest:()=>null}});
    assert.equal(player.instrument.enabled,false,'manual startup must not wake on unrelated gestures');
    await player.setScore('second.strudel',{mode:'groove',bpm:90});
    assert.equal(player.instrument.playback.gesture,false);
    player.setTouch('notes');
    assert.equal(player.instrument.playback.gesture,true);
    assert.equal(player.state,'paused');
    await player.setScore('first.strudel');
    assert.equal(player.touch,'notes');
    assert.throws(()=>player.setTouch('other'),/Touch/);
    assert.equal(player.touch,'notes');
  } finally { player.destroy(); }
  assert.throws(()=>player.setTouch('continuous'),/destroyed/);
});
