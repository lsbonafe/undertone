const PREFERENCE_KEY = 'undertone.sound';

export class SoundControl {
  constructor(instrument, { storage, preferenceKey = PREFERENCE_KEY, onChange = () => {}, onError = () => {} } = {}) {
    this.instrument = instrument;
    this.onChange = onChange;
    this.onError = onError;
    this.preferenceKey = preferenceKey;
    this.desired = true;
    try {
      this.storage = storage ?? globalThis.localStorage;
      this.desired = this.storage?.getItem(this.preferenceKey) !== 'off';
    } catch { /* Sound still works when browser storage is unavailable. */ }
    this.pending = null;
    this.failed = false;
    this.contextChanged = () => this.onChange();
  }

  get state() {
    if (this.failed) return 'error';
    if (!this.desired) return 'paused';
    if (this.instrument.enabled && this.instrument.context?.state === 'running') return 'playing';
    return this.pending && this.instrument.context?.state === 'running' ? 'starting' : 'waiting';
  }

  get control() {
    const state = this.state;
    return {
      label:state === 'error' ? 'Retry sound' : state === 'playing' || state === 'starting' ? 'Pause sound' : 'Enable sound',
      pressed:state === 'playing',
    };
  }

  observeContext() {
    const context = this.instrument.context;
    if (this.observedContext === context) return;
    this.observedContext?.removeEventListener?.('statechange', this.contextChanged);
    this.observedContext = context;
    context?.addEventListener?.('statechange', this.contextChanged);
  }

  remember() {
    try { this.storage?.setItem(this.preferenceKey, this.desired ? 'on' : 'off'); } catch { /* Keep the choice for this visit. */ }
  }

  start() {
    if (!this.desired || this.pending || this.state === 'playing') return this.pending;
    this.failed = false;
    // enable() calls AudioContext.resume synchronously, retaining click activation.
    const task = this.instrument.enable();
    this.pending = task;
    this.observeContext();
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
    return this.pending;
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
    if (this.state === 'playing' || this.state === 'starting') { this.pause(); return; }
    this.desired = true;
    this.remember();
    return this.pending ? this.wake() : this.start();
  }

  dispose() {
    this.observedContext?.removeEventListener?.('statechange', this.contextChanged);
    this.observedContext = null;
    this.pending = null;
    this.instrument.mute();
  }
}
