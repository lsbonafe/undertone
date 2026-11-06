import { clamp, isPercussion, midiOf, SCORE_CYCLES } from './motion.js';

export const GROOVE_LOOKAHEAD = 0.1;
const MOTION_HOLD = 0.18;
const PASSAGE_BARS = 4;

const passageAt = progress => Math.min(2, Math.floor(clamp(progress) * 3));

// The audio clock keeps the beat. Scroll input never queues or compresses notes.
export class GrooveConductor {
  constructor(events, config, progress = 0, startAt = 0) {
    this.config = config;
    this.secondsPerBar = 240 / config.bpm;
    this.origin = startAt;
    this.gesturePalettes = Array.from({ length: 3 }, (_, passage) => {
      const pitched = events.filter(event => event.onset >= passage * PASSAGE_BARS && event.onset < (passage + 1) * PASSAGE_BARS
        && !isPercussion(event.value) && midiOf(event.value.note) !== null);
      const accents = pitched.filter(event => event.value.orbit === 1);
      return accents.length ? accents : pitched.filter(event => event.value.s === 'grit');
    });
    this.bars = Array.from({ length: SCORE_CYCLES }, (_, bar) => {
      const grouped = new Map();
      const add = (offset, event) => {
        if (!grouped.has(offset)) grouped.set(offset, []);
        grouped.get(offset).push(event);
      };
      const current = events.filter(event => event.onset >= bar && event.onset < bar + 1);
      for (const event of current) add(event.onset - bar, event);
      const hat = current.find(event => event.value.s === 'u_hat');
      if (hat) for (const offset of [3 / 16, 11 / 16]) {
        add(offset, { ...hat, onset: bar + offset, end: bar + offset + 1 / 16, extra: true });
      }
      return [...grouped].map(([offset, events]) => ({ offset, events })).sort((a, b) => a.offset - b.offset);
    });
    this.setPosition(progress);
    this.passage = this.wantedPassage;
    this.bar = 0;
    this.barStart = startAt;
    this.groupIndex = 0;
    this.groups = null;
    this.speed = 0;
    this.direction = 'forward';
    this.lastInputAt = -Infinity;
    this.gestureDistance = 0;
    this.nextGestureAt = -Infinity;
    this.lastGestureAt = -Infinity;
    this.gestureStep = null;
  }

  setPosition(progress) {
    this.position = clamp(progress);
    this.wantedPassage = passageAt(progress);
  }

  input(progress, now, travelInViewports = 4) {
    if (!Number.isFinite(progress) || !Number.isFinite(now)) return false;
    const next = clamp(progress);
    const delta = next - this.position;
    const distance = Math.abs(delta) * Math.max(0.1, travelInViewports);
    if (distance < 0.0004) return false;
    const resumed = now - this.lastInputAt > MOTION_HOLD;
    const elapsed = resumed ? 0.08 : Math.max(0.001, now - this.lastInputAt);
    const velocity = Math.min(8, distance / elapsed);
    const smoothing = 1 - Math.exp(-elapsed / 0.14);
    this.speed = resumed ? velocity : this.speed + smoothing * (velocity - this.speed);
    this.gestureDistance = Math.min(0.1, (resumed ? 0 : this.gestureDistance) + distance);
    if (resumed) this.nextGestureAt = Math.min(this.nextGestureAt, now + 0.04);
    this.direction = delta > 0 ? 'forward' : 'backward';
    this.setPosition(next);
    this.lastInputAt = now;
    return true;
  }

  active(now) {
    return now - this.lastInputAt <= MOTION_HOLD;
  }

  energyAt(now) {
    const age = Math.max(0, now - this.lastInputAt - MOTION_HOLD);
    const target = 1 - Math.exp(-this.speed / 1.8);
    return target * Math.exp(-age / 0.55);
  }

  takeGesture(now) {
    if (!this.config.gesture || !this.active(now) || this.gestureDistance < 0.004) return null;
    const grid = this.secondsPerBar / (this.config.character === 'vaporwave' ? 32 : 16);
    const earliest = Math.max(now + 0.018, this.nextGestureAt, this.lastGestureAt + grid * 2);
    const at = this.origin + Math.ceil((earliest - this.origin) / grid - 1e-8) * grid;
    if (at > now + GROOVE_LOOKAHEAD) return null;
    const palette = this.gesturePalettes[this.passage];
    if (!palette.length) return null;
    this.gestureStep = this.gestureStep === null ? this.direction === 'forward' ? 0 : palette.length - 1
      : this.gestureStep + (this.direction === 'forward' ? 1 : -1);
    const event = palette[((this.gestureStep % palette.length) + palette.length) % palette.length];
    const steps = this.speed > 2.5 ? 2 : this.speed < 0.35 ? 8 : 4;
    this.nextGestureAt = at + steps * grid;
    this.lastGestureAt = at;
    // Keep one response to the latest movement, never a queue of skipped notes.
    this.gestureDistance = 0;
    return {
      events:[event], gesture:true, at, gridAt:at, passage:this.passage,
      secondsPerBar:this.secondsPerBar, energy:this.energyAt(now), direction:this.direction,
      mode:this.speed > 2.5 ? 'skim' : this.speed < 0.35 ? 'slow' : 'reading',
    };
  }

  take(now) {
    const plans = [];
    // A stalled tab resumes on its clock grid instead of replaying a backlog.
    if (now - this.barStart >= this.secondsPerBar) {
      const skipped = Math.floor((now - this.barStart) / this.secondsPerBar);
      this.bar += skipped;
      this.barStart += skipped * this.secondsPerBar;
      this.groups = null;
      this.groupIndex = 0;
    }
    while (this.barStart <= now + GROOVE_LOOKAHEAD) {
      if (!this.groups) {
        this.passage = this.wantedPassage;
        this.groups = this.bars[this.passage * PASSAGE_BARS + this.bar % PASSAGE_BARS];
      }
      const group = this.groups[this.groupIndex];
      if (!group) {
        this.bar++;
        this.barStart += this.secondsPerBar;
        this.groupIndex = 0;
        this.groups = null;
        continue;
      }
      const at = this.barStart + group.offset * this.secondsPerBar;
      if (at > now + GROOVE_LOOKAHEAD) break;
      this.groupIndex++;
      if (at < now - 0.025) continue;
      const holding = !this.active(now);
      plans.push({
        events: group.events, at: Math.max(at, now + 0.002), gridAt: at,
        secondsPerBar: this.secondsPerBar, passage: this.passage,
        energy: this.energyAt(at), direction: this.direction,
        mode: holding ? 'loop' : this.speed > 2.5 ? 'skim' : this.speed < 0.35 ? 'slow' : 'reading',
      });
    }
    return plans;
  }
}

export function grooveVoices(plan, config) {
  const energy = clamp(plan.energy);
  const vapor = config.character === 'vaporwave';
  if (plan.gesture) {
    return plan.events.map(event => ({
      event, duration:Math.min(0.14, plan.secondsPerBar / 16),
      value:{
        ...event.value, note:midiOf(event.value.note),
        gain:event.value.gain * (0.8 + energy * 0.2),
        pan:plan.direction === 'forward' ? 0.62 : 0.38,
      },
    }));
  }
  return plan.events.filter(event => event.value.orbit !== 1 && (!event.extra || energy > 0.5)).map(event => {
    const authored = event.value;
    const drum = isPercussion(authored);
    const hat = authored.s === 'u_hat';
    const level = event.extra ? 0.35 * energy : hat ? 0.25 + 0.75 * energy
      : authored.s === 'u_snare' ? 0.65 + 0.35 * energy
      : ['haze','u_tape','grit'].includes(authored.s) ? 0.6 + 0.1 * energy : 0.82 + 0.18 * energy;
    const cutoff = drum ? Math.min(authored.cutoff ?? 9000, vapor ? hat ? 3800 : 2400 : hat ? 7500 : 6500)
      : Math.min(vapor ? 2800 : 2600, (authored.cutoff ?? 2200) * (0.75 + energy * 0.35));
    return {
      event,
      duration: drum ? clamp((event.end - event.onset) * plan.secondsPerBar, 0.025, 0.18)
        : clamp((event.end - event.onset) * plan.secondsPerBar, 0.06, 8),
      value: {
        ...authored, gain: (authored.gain ?? 0.1) * level,
        attack: authored.attack ?? (drum ? 0.001 : 0.02),
        release: authored.release ?? (drum ? 0.06 : 0.2), cutoff,
        ...(authored.resonance !== undefined ? { resonance: Math.min(authored.resonance, 2.8) } : {}),
        ...(authored.lpenv !== undefined ? { lpenv: Math.min(authored.lpenv, 2.8) * (0.8 + energy * 0.2) } : {}),
        delay: Math.min(authored.delay ?? 0, vapor ? 0.24 : 0.08) * (1 - energy * 0.2),
        delayfeedback: Math.min(authored.delayfeedback ?? 0, vapor ? 0.2 : 0.12),
      },
    };
  });
}

// Shape ringing notes as well as future attacks; a flick needn't wait for a chord.
export class GrooveTone {
  constructor(context, output, config) {
    this.context = context;
    this.vapor = config.character === 'vaporwave';
    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.Q.value = 0.35;
    this.target = this.vapor ? 1100 : 3600;
    this.filter.frequency.setValueAtTime(this.target, context.currentTime);
    this.sweep = { from:this.target, to:this.target, begin:context.currentTime, end:context.currentTime };
    output.disconnect(context.destination);
    output.connect(this.filter).connect(context.destination);
  }

  update(energy, at = this.context.currentTime) {
    const target = this.vapor ? 1100 + clamp(energy) * 1700 : 3600 + clamp(energy) * 3600;
    if (Math.abs(target - this.target) < 1) return;
    const { from, to, begin, end } = this.sweep;
    const current = from + (to - from) * clamp((at - begin) / (end - begin || 1));
    this.filter.frequency.cancelScheduledValues(at);
    this.filter.frequency.linearRampToValueAtTime(current, at);
    this.filter.frequency.setValueAtTime(current, at);
    this.filter.frequency.linearRampToValueAtTime(target, at + 0.16);
    this.sweep = { from:current, to:target, begin:at, end:at + 0.16 };
    this.target = target;
  }

  stop() {
    // The transport's short master fade finishes before this graph is removed.
    const cleanup = setTimeout(() => this.filter.disconnect(), 50);
    cleanup.unref?.();
  }
}
