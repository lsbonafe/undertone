import * as strudel from './assets/vendor/strudel.mjs';
import { clamp, expressiveVoices, indexPattern, isPercussion, ReadingConductor } from './motion.js';
import { HeldHarmony, heldNotes, timbreAt, timbreFor } from './harmony.js';
import { registerReadingSounds } from './reading-sounds.js';
import { GrooveConductor, GrooveTone, grooveVoices } from './groove.js';

let scopeReady;
export async function compileScore(source) {
  scopeReady ??= strudel.evalScope(strudel);
  await scopeReady;
  const compiled = strudel.transpiler(source, { emitMiniLocations: false, emitWidgets: false });
  // Only our bundled composition files are evaluated, never article text or visitor input.
  const pattern = Function(compiled.output)();
  if (typeof pattern?.queryArc !== 'function') throw new Error('This score did not produce a Strudel pattern.');
  return { pattern, events: indexPattern(pattern) };
}

export class ScrollInstrument {
  constructor(onNotes, onIdle, onError) {
    this.onNotes = onNotes;
    this.onIdle = onIdle;
    this.onError = onError;
    this.enabled = false;
    this.volume = 0.55;
    this.events = [];
    this.lastProgress = 0;
    this.epoch = 0;
    this.startEpoch = 0;
    this.conductor = new ReadingConductor();
    this.sounding = false;
    this.lastMelody = null;
    this.holding = false;
    this.lastTimbre = null;
    this.lastHarmonyAt = -Infinity;
  }

  async enable() {
    const attempt = ++this.startEpoch;
    this.enabled = false;
    this.silence();
    this.context = strudel.getAudioContext();
    // Resume inside the actual click before asynchronous initialization.
    const resumed = this.context.resume();
    resumed.catch(() => {});
    await strudel.initAudio({ disableWorklets: true, maxPolyphony: 24 });
    await strudel.registerSynthSounds();
    await registerReadingSounds();
    await resumed;
    if (attempt !== this.startEpoch) return false;
    this.controller = strudel.getSuperdoughAudioController();
    this.controller.reset();
    this.gain = this.controller.output.destinationGain.gain;
    this.resetGain();
    this.conductor = new ReadingConductor(this.events, this.lastProgress);
    this.lastMelody = null;
    this.lastTimbre = null;
    this.lastHarmonyAt = -Infinity;
    this.enabled = true;
    this.holdCurrent();
    return true;
  }

  setScore(events, progress = 0, playback = null) {
    this.silence();
    this.events = events;
    this.playback = playback;
    this.lastProgress = progress;
    this.conductor = new ReadingConductor(events, progress);
    this.lastMelody = null;
    this.lastTimbre = null;
    this.lastHarmonyAt = -Infinity;
    this.epoch++;
    if (this.controller) {
      this.controller.reset();
      this.gain = this.controller.output.destinationGain.gain;
      this.resetGain();
    }
    if (this.enabled) this.holdCurrent();
  }

  setPosition(progress) {
    this.lastProgress = clamp(progress);
    this.conductor = new ReadingConductor(this.events, this.lastProgress);
    this.groove?.setPosition(this.lastProgress);
  }

  setVolume(volume) {
    this.volume = clamp(volume);
    if (this.enabled && this.sounding) this.rampGain(this.volume, 0.04);
  }

  resetGain() {
    const now = this.context.currentTime;
    this.gain.setValueAtTime(0, now);
    this.envelope = { from: 0, to: 0, begin: now, end: now };
  }

  rampGain(target, seconds) {
    if (!this.gain || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    // Track our linear ramps so interruptions never rely on a stale AudioParam.value.
    const { from, to, begin, end } = this.envelope;
    const fraction = end > begin ? clamp((now - begin) / (end - begin)) : 1;
    const current = clamp(from + (to - from) * fraction);
    this.gain.cancelScheduledValues(now);
    this.gain.setValueAtTime(current, now);
    this.gain.linearRampToValueAtTime(target, now + seconds);
    this.envelope = { from: current, to: target, begin: now, end: now + seconds };
  }

  silence() {
    clearInterval(this.pulse);
    this.pulse = null;
    this.harmony?.stop();
    this.harmony = null;
    this.groove = null;
    this.grooveTone?.stop();
    this.grooveTone = null;
    this.conductor.discardPending();
    this.sounding = false;
    this.holding = false;
    this.rampGain(0, 0.035);
    this.onIdle?.('quiet');
  }

  mute() {
    this.enabled = false;
    this.startEpoch++;
    this.epoch++;
    this.silence();
  }

  move(progress, timestamp = performance.now(), travelInViewports = 4) {
    const next = clamp(progress);
    const previous = this.lastProgress;
    this.lastProgress = next;
    if (!this.enabled || this.context.state !== 'running' || next === previous) return;
    if (this.playback?.mode === 'groove') {
      this.groove?.input(next, this.context.currentTime, travelInViewports);
      this.pumpGroove();
      return;
    }
    if (!this.conductor.input(next, timestamp, travelInViewports)) return;
    this.pump(timestamp);
    this.pulse ??= setInterval(() => this.pump(performance.now()), 20);
  }

  holdCurrent() {
    if (!this.enabled || !this.events.length || this.context.state !== 'running' || globalThis.document?.hidden) return;
    if (this.playback?.mode === 'groove') {
      if (!this.groove) {
        // A resumed page gets a fresh output graph, with no old queued hits or tails.
        this.controller.reset();
        this.gain = this.controller.output.destinationGain.gain;
        this.resetGain();
        this.grooveTone = new GrooveTone(this.context, this.controller.output.destinationGain, this.playback);
        this.groove = new GrooveConductor(this.events, this.playback, this.lastProgress, this.context.currentTime + 0.08);
      }
      this.pumpGroove();
      this.pulse ??= setInterval(() => this.pump(performance.now()), 20);
      return;
    }
    if (!this.harmony) {
      this.harmony = new HeldHarmony(this.context, this.controller.output.destinationGain);
      this.harmony.profile = timbreAt(this.events, this.lastProgress);
    }
    const notes = heldNotes(this.events, this.lastMelody, this.lastProgress);
    this.harmony.sync(notes, this.context.currentTime, this.lastTimbre ?? this.harmony.profile, { holding: true });
    if (!this.sounding) this.rampGain(this.volume, 0.15);
    this.sounding = true;
    this.holding = true;
    this.onIdle?.('hold', notes);
  }

  pump(timestamp) {
    if (!this.enabled || this.context.state !== 'running') { this.silence(); return; }
    if (this.groove) { this.pumpGroove(); return; }
    if (!this.conductor.active(timestamp)) {
      clearInterval(this.pulse);
      this.pulse = null;
      this.conductor.discardPending();
      if (this.sounding && !this.holding) this.holdCurrent();
      return;
    }
    const plan = this.conductor.take(timestamp);
    if (!plan) return;
    if (!this.sounding) this.rampGain(this.volume, 0.045);
    this.sounding = true;
    this.holding = false;
    const { voices, nextMelody } = expressiveVoices(plan, this.lastMelody);
    this.lastMelody = nextMelody;
    if (!this.harmony) this.harmony = new HeldHarmony(this.context, this.controller.output.destinationGain);
    const pitched = voices.filter(voice => !isPercussion(voice.value));
    if (pitched.length) {
      const lead = pitched.reduce((louder, voice) => voice.value.gain > louder.value.gain ? voice : louder);
      this.lastTimbre = timbreFor(lead.value);
    }
    this.lastTimbre ??= timbreAt(this.events,this.lastProgress);
    if (plan.mode !== 'skim' || timestamp - this.lastHarmonyAt >= 250 || this.harmony.holding) {
      this.harmony.sync(heldNotes(this.events, nextMelody, this.lastProgress), this.context.currentTime, this.lastTimbre, { holding: false });
      this.lastHarmonyAt = timestamp;
    }
    const start = this.context.currentTime + 0.012;
    const epoch = this.epoch;
    for (const voice of voices) {
      const hap = voice.event.hap.withValue(() => voice.value);
      Promise.resolve(strudel.webaudioOutput(hap, 0, voice.duration, 0.5, start)).catch(error => {
        if (epoch === this.epoch) { this.mute(); this.onError?.(error); }
      });
    }
    this.onNotes?.(pitched.map(voice => voice.value.note), plan.direction, plan.mode);
  }

  pumpGroove() {
    if (!this.groove || !this.enabled || this.context.state !== 'running') return;
    if (!this.sounding) this.rampGain(this.volume, 0.15);
    this.sounding = true;
    this.grooveTone.update(this.groove.energyAt(this.context.currentTime));
    const holding = !this.groove.active(this.context.currentTime);
    if (holding && !this.holding) this.onIdle?.('loop');
    this.holding = holding;
    const epoch = this.epoch;
    const plans = this.groove.take(this.context.currentTime);
    const gesture = this.groove.takeGesture(this.context.currentTime);
    if (gesture) plans.push(gesture);
    for (const plan of plans) {
      const voices = grooveVoices(plan, this.playback);
      for (const voice of voices) {
        const hap = voice.event.hap.withValue(() => voice.value);
        Promise.resolve(strudel.webaudioOutput(hap, 0, voice.duration, 1 / plan.secondsPerBar, plan.at)).catch(error => {
          if (epoch === this.epoch) { this.mute(); this.onError?.(error); }
        });
      }
      const notes = voices.filter(voice => !isPercussion(voice.value)).map(voice => voice.value.note);
      if (notes.length) this.onNotes?.(notes, plan.direction, plan.mode, plan.gesture === true);
    }
  }
}
