const PREFERENCE_KEY = 'undertone.sound';

export class SoundControl {
  constructor(instrument, { storage, onChange = () => {}, onError = () => {} } = {}) {
    this.instrument = instrument;
    this.onChange = onChange;
    this.onError = onError;
    this.desired = true;
    try {
      this.storage = storage ?? globalThis.localStorage;
      this.desired = this.storage?.getItem(PREFERENCE_KEY) !== 'off';
    } catch { /* Sound still works when browser storage is unavailable. */ }
    this.pending = null;
    this.failed = false;
  }

  get state() {
    if (this.failed) return 'error';
    if (!this.desired) return 'paused';
    if (this.instrument.enabled) return 'playing';
    return this.pending && this.instrument.context?.state === 'running' ? 'starting' : 'waiting';
  }

  remember() {
    try { this.storage?.setItem(PREFERENCE_KEY, this.desired ? 'on' : 'off'); } catch { /* Keep the choice for this visit. */ }
  }

  start() {
    if (!this.desired || this.pending || this.instrument.enabled) return this.pending;
    this.failed = false;
    // enable() calls AudioContext.resume synchronously, retaining click activation.
    const task = this.instrument.enable();
    this.pending = task;
    this.onChange();
    task.then(() => {
      if (this.pending !== task) return;
      this.pending = null;
      this.onChange();
    }, error => {
      if (this.pending !== task) return;
      this.pending = null;
      if (error.name === 'NotAllowedError') {
        this.instrument.mute();
        this.onChange();
        return;
      }
      this.failed = true;
      this.instrument.mute();
      this.onError(error);
      this.onChange();
    });
    return task;
  }

  wake() {
    if (!this.desired || this.failed) return;
    if (!this.pending) return this.start();
    // An autoplay attempt may be waiting for a real user gesture. Reuse it.
    if (this.instrument.context?.state !== 'running') {
      this.instrument.context.resume().catch(() => {});
    }
  }

  pause() {
    this.desired = false;
    this.pending = null;
    this.failed = false;
    this.remember();
    this.instrument.mute();
    this.onChange();
  }

  toggle() {
    if (this.desired && !this.failed) { this.pause(); return; }
    this.desired = true;
    this.remember();
    return this.start();
  }
}
