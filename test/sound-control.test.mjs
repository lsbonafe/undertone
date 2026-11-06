import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundControl } from '../sound-control.js';

function setup({ allowed = false, preference } = {}) {
  let unlock;
  const gate = new Promise(resolve => { unlock = resolve; });
  const saved = new Map(preference ? [['undertone.sound', preference]] : []);
  const storage = { getItem:key => saved.get(key), setItem:(key, value) => saved.set(key, value) };
  const instrument = {
    allowed, enabled:false, attempts:0, starts:0, resumes:0,
    context:{ state:'suspended', resume() {
      instrument.resumes++;
      if (instrument.allowed) { this.state = 'running'; unlock(); }
      return gate;
    } },
    async enable() {
      const attempt = ++this.attempts;
      this.starts++;
      await this.context.resume();
      if (attempt !== this.attempts) return false;
      this.enabled = true;
      return true;
    },
    mute() { this.attempts++; this.enabled = false; },
  };
  const states = [];
  const errors = [];
  const sound = new SoundControl(instrument, { storage, onChange:() => states.push(sound.state), onError:error => errors.push(error) });
  return { sound, instrument, saved, storage, states, errors };
}

test('new visitors get sound on automatically when the browser permits playback', async () => {
  const { sound, instrument, states } = setup({ allowed:true });
  assert.equal(sound.desired, true);
  await sound.start();
  assert.equal(instrument.enabled, true);
  assert.equal(sound.state, 'playing');
  assert.equal(instrument.starts, 1);
  assert.equal(states.at(-1), 'playing');
});

test('a gesture unlocks a blocked autoplay attempt without initializing audio twice', async () => {
  const { sound, instrument } = setup();
  const started = sound.start();
  assert.equal(sound.state, 'waiting');
  instrument.allowed = true;
  sound.wake();
  await started;
  assert.equal(sound.state, 'playing');
  assert.equal(instrument.starts, 1);
  assert.equal(instrument.resumes, 2);
});

test('an explicit pause cancels pending startup and cannot be undone by a later gesture', async () => {
  const { sound, instrument, saved } = setup();
  const started = sound.start();
  sound.pause();
  assert.equal(sound.state, 'paused');
  assert.equal(saved.get('undertone.sound'), 'off');
  instrument.allowed = true;
  sound.wake();
  assert.equal(instrument.resumes, 1, 'an ordinary gesture respects the pause choice');
  await instrument.context.resume();
  assert.equal(await started, false);
  assert.equal(instrument.enabled, false, 'late initialization cannot restart paused music');
  assert.equal(sound.state, 'paused');
});

test('blocked autoplay shows an inactive Enable button and its first click starts sound', async () => {
  const { sound, instrument } = setup();
  const started = sound.start();
  assert.equal(sound.desired, true);
  assert.deepEqual(sound.control, { label:'Enable sound', pressed:false });
  instrument.allowed = true;
  await sound.toggle();
  assert.equal(sound.state, 'playing');
  assert.equal(await started, true);
  assert.deepEqual(sound.control, { label:'Pause sound', pressed:true });
  assert.equal(instrument.starts, 1, 'the first click unlocks the existing attempt rather than pausing it');
});

test('an interrupted audio context is not reported as playing and a gesture restarts it', async () => {
  const { sound, instrument } = setup({ allowed:true });
  await sound.start();
  instrument.context.state = 'suspended';
  assert.equal(instrument.enabled, true, 'the instrument can remain initialized during an interruption');
  assert.equal(sound.state, 'waiting');
  assert.equal(sound.control.pressed, false);
  await sound.wake();
  assert.equal(sound.state, 'playing');
});

test('the button can enable sound again and the choice survives a page reload', async () => {
  const { sound, instrument, saved, storage } = setup({ allowed:true, preference:'off' });
  assert.equal(sound.state, 'paused');
  sound.wake();
  assert.equal(instrument.starts, 0);
  await sound.toggle();
  assert.equal(sound.state, 'playing');
  assert.equal(saved.get('undertone.sound'), 'on');
  sound.pause();
  const nextVisit = new SoundControl(instrument, { storage });
  assert.equal(nextVisit.desired, false);
});

test('repeated pointer and key gestures do not restart a playing composition', async () => {
  const { sound, instrument } = setup({ allowed:true });
  await sound.start();
  for (let index = 0; index < 10; index++) sound.wake();
  assert.equal(instrument.starts, 1);
});

test('storage restrictions do not prevent sound or the pause button from working', async () => {
  const { instrument } = setup({ allowed:true });
  const storage = { getItem:() => { throw Error('blocked'); }, setItem:() => { throw Error('blocked'); } };
  const sound = new SoundControl(instrument, { storage });
  assert.equal(sound.desired, true);
  await sound.start();
  sound.pause();
  assert.equal(sound.state, 'paused');
  assert.equal(instrument.enabled, false);
});

test('an initialization error stops sound and allows an explicit retry', async () => {
  const { sound, instrument, errors } = setup({ allowed:true });
  const enable = instrument.enable.bind(instrument);
  instrument.enable = async () => { throw Error('decoder failed'); };
  await sound.start().catch(() => {});
  assert.equal(sound.state, 'error');
  assert.equal(errors.length, 1);
  sound.wake();
  assert.equal(errors.length, 1, 'ordinary input does not loop failed retries');
  instrument.enable = enable;
  await sound.toggle();
  assert.equal(sound.state, 'playing');
});

test('an autoplay permission rejection waits for a gesture instead of presenting an audio failure', async () => {
  const { sound, instrument, errors } = setup({ allowed:true });
  const enable = instrument.enable.bind(instrument);
  instrument.enable = async () => { throw new DOMException('User gesture required', 'NotAllowedError'); };
  await sound.start().catch(() => {});
  assert.equal(sound.state, 'waiting');
  assert.equal(sound.desired, true);
  assert.deepEqual(errors, []);
  instrument.enable = enable;
  await sound.wake();
  assert.equal(sound.state, 'playing');
});
