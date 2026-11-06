import * as strudel from './assets/vendor/strudel.mjs';
import { clamp, isPercussion, midiOf, SCORE_CYCLES } from './motion.js';
import { calmProfile, holdFrequencies, holdVoiceBalance } from './comfort.js';

const HOLD_SECONDS = 3600;

export function timbreFor(value = {}) {
  if (value.s === 'haze' || value.s === 'u_tape') return {kind:'subtractive',source:'haze',cutoff:value.cutoff ?? 1800,levelScale:0.85,spread:value.spread ?? 0.2,vib:value.vib ?? 0.3,vibmod:value.vibmod ?? 0.08};
  if (value.s === 'grit') return {kind:'subtractive',source:'grit',cutoff:value.cutoff ?? 1400,levelScale:0.65,drive:value.drive ?? 4};
  if (value.s === 'square' || value.s === 'z_square') return { kind: 'subtractive', source: 'square', cutoff: value.cutoff ?? 2000, levelScale: 0.55 };
  // A struck sample has an ending; its hold reconstructs the sample's harmonic blend.
  if (value.s === 'porcelain') return { kind: 'additive', source: 'user', partials: [1, 0.28, 0.12, 0.06], cutoff: 2800, levelScale: 0.8 };
  if (value.s === 'sawtooth') return { kind: 'subtractive', source: 'sawtooth', cutoff: value.cutoff ?? 2500, levelScale: 0.7 };
  if (value.s === 'user' && value.partials) return { kind: 'additive', source: 'user', partials: [...value.partials], cutoff: value.cutoff ?? 4200, levelScale: 0.9 };
  if (value.fmi > 0) return { kind: 'fm', source: 'sine', fmi: value.fmi * 0.45, fmh: value.fmh ?? 1, cutoff: value.cutoff ?? 4800, levelScale: 0.85 };
  return { kind: 'pure', source: 'sine', levelScale: 1 };
}

export function timbreAt(events, progress = 0) {
  events = events.filter(event => !isPercussion(event.value) && midiOf(event.value.note) !== null);
  const current = events.findLast(event => event.onset <= progress * SCORE_CYCLES) ?? events[0];
  if (!current) return timbreFor();
  const group = events.filter(event => event.onset === current.onset);
  const lead = group.reduce((louder, event) => event.value.gain > louder.value.gain ? event : louder);
  return timbreFor(lead.value);
}

function cutoffFor(profile, index) {
  if (profile.kind === 'pure') return profile.comfort ? index === 2 ? 1100 : 750 : index === 2 ? 1500 : 950;
  return clamp(profile.cutoff * (index === 2 ? 0.65 : 0.4), 300, 2400);
}

export function heldNotes(events, melody = null, progress = 0) {
  events = events.filter(event => !isPercussion(event.value) && midiOf(event.value.note) !== null);
  if (!events.length) return [];
  const beginning = events.filter(event => event.onset === events[0].onset);
  let root = Math.min(...beginning.map(event => midiOf(event.value.note)));
  while (root < 45) root += 12;
  while (root > 57) root -= 12;
  const current = events.findLast(event => event.onset <= progress * SCORE_CYCLES) ?? events[0];
  let upper = melody ?? midiOf(current.value.note);
  while (upper < root + 12) upper += 12;
  while (upper > root + 24) upper -= 12;
  return [root, root + 7, upper];
}

export class HeldHarmony {
  constructor(context, destination) {
    this.context = context;
    this.bus = context.createGain();
    this.bus.gain.value = 0.7;
    this.bus.connect(destination);
    this.voices = new Map();
    this.retiring = new Set();
    this.notes = [];
    this.disposed = false;
    this.profile = timbreFor();
    this.holding = false;
  }

  sync(notes, at = this.context.currentTime, profile = this.profile, { holding = this.holding } = {}) {
    if (this.disposed) return;
    if (!notes.length) { this.stop(at); return; }
    this.notes = [...notes];
    this.profile = profile;
    this.holding = holding;
    this.renderProfile = holding ? calmProfile(profile) : profile;
    this.frequencies = holding ? holdFrequencies(notes) : notes.map(note => 440 * 2 ** ((note - 69) / 12));
    const shaped = this.renderProfile;
    const timbreKey = JSON.stringify([shaped.source, shaped.partials, shaped.fmi, shaped.fmh, shaped.spread, shaped.drive, shaped.vib, shaped.vibmod, holding]);
    for (const [index, voice] of this.voices) {
      if (voice.note !== notes[index] || voice.timbreKey !== timbreKey) {
        this.retire(voice, at, holding ? 0.95 : 0.3);
        this.voices.delete(index);
      } else {
        const sweep = voice.cutoffSweep;
        const fraction = clamp((at - sweep.start) / (sweep.end - sweep.start || 1), 0, 1);
        const from = sweep.from + (sweep.to - sweep.from) * fraction;
        const end = at + (holding ? 1.05 : 0.54);
        const to = cutoffFor(shaped, index);
        // Rebuild an interrupted ramp before setting its next endpoint.
        voice.filter.frequency.cancelScheduledValues(at);
        voice.filter.frequency.linearRampToValueAtTime(from, at);
        voice.filter.frequency.setValueAtTime(from, at);
        voice.filter.frequency.linearRampToValueAtTime(to, end);
        voice.cutoffSweep = { start: at, end, from, to };
      }
    }
    notes.forEach((note, index) => {
      if (!this.voices.has(index)) this.voices.set(index, this.startVoice(note, index, at, timbreKey));
    });
    clearTimeout(this.renewal);
    // Refresh the same held pitches before the synth's long safety duration expires.
    const oldest = Math.min(...[...this.voices.values()].map(voice => voice.begin));
    this.renewal = setTimeout(() => {
      const now = this.context.currentTime;
      for (const voice of this.voices.values()) this.retire(voice, now, 0.6);
      this.voices.clear();
      this.sync(this.notes, now);
    }, Math.max(100, (oldest + HOLD_SECONDS - 10 - this.context.currentTime) * 1000));
    this.renewal.unref?.();
  }

  startVoice(note, index, at, timbreKey) {
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = cutoffFor(this.renderProfile, index);
    filter.frequency.setValueAtTime(cutoff, at);
    const gain = this.context.createGain();
    const level = [0.12, 0.075, 0.085][index] * this.renderProfile.levelScale * (this.holding ? holdVoiceBalance(this.notes, index) : 1);
    const fadeIn = this.holding ? 0.95 : 0.3;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + fadeIn);
    filter.connect(gain).connect(this.bus);
    const voice = { note, gain, filter, level, begin: at, timbreKey, fadeIn, frequency: this.frequencies[index], cutoffSweep: { start: at, end: at, from: cutoff, to: cutoff } };
    const sound = strudel.getSound(this.renderProfile.source);
    // Strudel exposes individual synth handles, allowing a held note to stop cleanly.
    voice.handle = sound.onTrigger(at, {
      note, freq: this.frequencies[index], duration: HOLD_SECONDS, attack: 0.08, decay: 0.1, sustain: 1, release: 0.4,
      ...(this.renderProfile.partials ? { partials: this.renderProfile.partials } : {}),
      ...(this.renderProfile.fmi ? { fmi: this.renderProfile.fmi, fmh: this.renderProfile.fmh, fmattack: 0.15, fmsustain: 1 } : {}),
      ...Object.fromEntries(['spread','drive','vib','vibmod'].filter(key => this.renderProfile[key] !== undefined).map(key => [key,this.renderProfile[key]])),
      calm: this.renderProfile.comfort === true,
    }, () => {
      filter.disconnect();
      gain.disconnect();
      this.retiring.delete(voice);
      if (this.voices.get(index) === voice) this.voices.delete(index);
      if (this.disposed && !this.retiring.size) this.bus.disconnect();
    });
    voice.handle.node.connect(filter);
    return voice;
  }

  retire(voice, at, duration) {
    this.retiring.add(voice);
    const level = voice.level * Math.max(0, Math.min(1, (at - voice.begin) / voice.fadeIn));
    voice.gain.gain.cancelScheduledValues(at);
    voice.gain.gain.setValueAtTime(level, at);
    voice.gain.gain.linearRampToValueAtTime(0, at + duration);
    voice.handle.stop(at + duration + 0.01);
  }

  stop(at = this.context.currentTime) {
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.renewal);
    for (const voice of this.voices.values()) this.retire(voice, at, 0.035);
    this.voices.clear();
    for (const voice of this.retiring) voice.handle.stop(at + 0.045);
    if (!this.retiring.size) this.bus.disconnect();
  }
}
