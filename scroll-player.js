import { compileScore } from './music.js';
import { TextureInstrument } from './texture.js';
import { scrollProgress } from './motion.js';
import { SoundControl } from './sound-control.js';

let activePlayer = null;

export async function createScrollScore({ contentElement, scoreUrl, touch = 'notes', mode = 'hold', bpm, character = 'electronic',
  onStateChange = () => {}, onNotes = () => {}, onIdle = () => {}, onProgress = () => {}, onError = () => {},
  preferenceKey = 'undertone.sound', volume = 0.55, autoStart = true } = {}) {
  if (!(contentElement instanceof Element) || !contentElement.isConnected) throw new TypeError('contentElement must be an attached DOM element');
  if (typeof scoreUrl !== 'string' || !scoreUrl) throw new TypeError('scoreUrl must be a nonempty URL');
  if (!['notes', 'continuous'].includes(touch)) throw new TypeError('touch must be notes or continuous');
  if (!['hold', 'groove'].includes(mode)) throw new TypeError('mode must be hold or groove');
  if (mode === 'groove' && (!Number.isFinite(bpm) || bpm <= 0)) throw new TypeError('groove mode requires a positive bpm');
  if (activePlayer) throw new Error('Only one scroll score player can run on a page');

  let playback = mode === 'groove' ? { mode, bpm, character, gesture:true } : null;
  const instrument = new TextureInstrument(onNotes, onIdle, onError, { touch });
  let destroyed = false;
  let loading = 0;
  let frame = 0;
  let ignoreScroll = true;
  const cache = new Map();
  const progress = () => {
    const top = contentElement === document.documentElement ? 0 : contentElement.getBoundingClientRect().top + window.scrollY;
    return scrollProgress(window.scrollY - top, contentElement.scrollHeight, window.innerHeight);
  };
  const refresh = () => {
    const next = progress();
    onProgress(next);
    return next;
  };
  const sound = new SoundControl(instrument, { preferenceKey, onChange:() => onStateChange(sound.state, sound.control), onError });
  if (!autoStart) sound.desired = false;
  instrument.setVolume(volume);
  const player = {
    get state() { return sound.state; },
    get control() { return sound.control; },
    get desired() { return sound.desired; },
    get touch() { return instrument.touch; },
    get holding() { return instrument.holding; },
    get groove() { return instrument.groove; },
    get instrument() { return instrument; },
    enable() {
      if (destroyed || sound.state === 'playing' || sound.state === 'starting') return;
      return !sound.desired || sound.state === 'error' ? sound.toggle() : sound.wake();
    },
    toggle() { if (!destroyed) return sound.toggle(); },
    pause() { if (!destroyed) sound.pause(); },
    wake() { if (!destroyed) return sound.wake(); },
    setVolume(value) { if (!destroyed) instrument.setVolume(value); },
    setTouch(value) {
      if (destroyed) throw new Error('Player has been destroyed');
      instrument.setTouch(value);
    },
    async setScore(url, options = {}) {
      if (destroyed) throw new Error('Player has been destroyed');
      if (typeof url !== 'string' || !url) throw new TypeError('scoreUrl must be a nonempty URL');
      if (options.mode && !['hold', 'groove'].includes(options.mode)) throw new TypeError('mode must be hold or groove');
      if (options.mode === 'groove' && (!Number.isFinite(options.bpm) || options.bpm <= 0)) throw new TypeError('groove mode requires a positive bpm');
      const epoch = ++loading;
      ignoreScroll = true;
      instrument.setScore([], progress());
      const nextPlayback = options.mode === 'groove'
        ? { mode:'groove', bpm:options.bpm, character:options.character ?? 'electronic', gesture:true }
        : options.mode === 'hold' ? null : playback;
      try {
        if (!cache.has(url)) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Cannot load score: ${response.status}`);
          cache.set(url, await compileScore(await response.text()));
        }
        if (destroyed || epoch !== loading) return;
        playback = nextPlayback;
        instrument.setScore(cache.get(url).events, refresh(), nextPlayback);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!destroyed && epoch === loading) { instrument.setPosition(refresh()); ignoreScroll = false; }
        }));
      } catch (error) {
        if (!destroyed && epoch === loading) onError(error);
        throw error;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      loading++;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pagehide', pagehide);
      document.removeEventListener('visibilitychange', visibility);
      for (const type of ['pointerdown','pointerup','click','touchend','keydown']) document.removeEventListener(type, wake);
      sound.dispose();
      activePlayer = null;
    },
  };
  const scroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const next = refresh();
      if (!ignoreScroll && !document.hidden) {
        const travel = Math.max(0.1, (contentElement.scrollHeight - window.innerHeight) / window.innerHeight);
        instrument.move(next, performance.now(), travel);
      }
    });
  };
  const resize = () => { instrument.setPosition(refresh()); if (!document.hidden) instrument.holdCurrent(); };
  const visibility = () => {
    instrument.silence();
    instrument.setPosition(refresh());
    if (!document.hidden) { instrument.holdCurrent(); sound.wake(); }
  };
  const pagehide = () => instrument.mute();
  const wake = event => {
    if (event.isTrusted && !document.hidden && !event.target.closest?.('[data-scroll-score-toggle]')
      && !event.metaKey && !event.ctrlKey && !event.altKey) sound.wake();
  };
  activePlayer = player;
  window.addEventListener('scroll', scroll, { passive:true });
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', pagehide);
  document.addEventListener('visibilitychange', visibility);
  for (const type of ['pointerdown','pointerup','click','touchend','keydown']) document.addEventListener(type, wake, { passive:true });
  try {
    await player.setScore(scoreUrl, { mode, bpm, character });
    if (!destroyed && autoStart && !document.hidden) sound.start();
    return player;
  } catch (error) {
    player.destroy();
    throw error;
  }
}
