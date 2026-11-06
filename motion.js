export const SCORE_CYCLES = 12;
export const IDLE_MS = 180;
export const MIN_NOTE_GAP_MS = 96;
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const isPercussion = value => ['u_kick','u_hat','u_snare'].includes(value.s);

export function scrollProgress(position, documentHeight, viewportHeight) {
  const travel = documentHeight - viewportHeight;
  return travel > 0 ? clamp(position / travel) : 0;
}

export function indexPattern(pattern, cycles = SCORE_CYCLES) {
  return pattern.queryArc(0, cycles)
    .filter(hap => hap.hasOnset())
    .map(hap => ({ hap, onset: Number(hap.whole.begin), end: Number(hap.whole.end), value: hap.value }))
    .sort((a, b) => a.onset - b.onset);
}

export function crossedEvents(events, from, to, maxOnsets = 8) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return [];
  const forward = to > from;
  let crossed = events.filter(event => forward
    ? event.onset >= from && event.onset < to
    : event.onset < from && event.onset >= to);
  if (!forward) crossed = crossed.toReversed();
  // Bound huge jumps by onset, keeping simultaneous voices together.
  const onsets = [...new Set(crossed.map(event => event.onset))];
  if (onsets.length > maxOnsets) {
    const selected = new Set(Array.from({ length: maxOnsets }, (_, i) => onsets[Math.round(i * (onsets.length - 1) / (maxOnsets - 1))]));
    crossed = crossed.filter(event => selected.has(event.onset));
  }
  return crossed;
}

export function midiOf(note) {
  if (typeof note === 'number') return note;
  const match = /^([a-g])([#bsf]?)(-?\d+)$/i.exec(String(note));
  if (!match) return null;
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[match[1].toLowerCase()];
  const accidental = /[#s]/i.test(match[2]) ? 1 : /[bf]/i.test(match[2]) ? -1 : 0;
  return (Number(match[3]) + 1) * 12 + base + accidental;
}

export function pitchClassOf(note) {
  const midi = midiOf(note);
  return midi === null ? null : ((midi % 12) + 12) % 12;
}

export class ReadingConductor {
  constructor(events = [], progress = 0) {
    const grouped = new Map();
    for (const event of events) {
      if (!grouped.has(event.onset)) grouped.set(event.onset, { onset: event.onset, events: [] });
      grouped.get(event.onset).events.push(event);
    }
    this.groups = [...grouped.values()].sort((a, b) => a.onset - b.onset);
    this.tonalGroups = this.groups.filter(group => group.events.some(event => !isPercussion(event.value) && midiOf(event.value.note) !== null));
    this.position = clamp(progress);
    this.direction = 1;
    this.speed = 0;
    this.lastInputAt = -Infinity;
    this.lastAttackAt = -Infinity;
    this.nextAttackAt = -Infinity;
    this.pending = [];
  }

  get mode() {
    return this.speed > 2.5 ? 'skim' : this.speed < 0.35 ? 'slow' : 'reading';
  }

  get interval() {
    return clamp(520 / (1 + 1.35 * this.speed), MIN_NOTE_GAP_MS, 500);
  }

  active(now) {
    return now - this.lastInputAt <= IDLE_MS;
  }

  input(progress, now, travelInViewports = 4) {
    if (!Number.isFinite(progress) || !Number.isFinite(now)) return false;
    const next = clamp(progress);
    const delta = next - this.position;
    const distance = Math.abs(delta) * Math.max(0.1, travelInViewports);
    if (distance < 0.0004) return false;
    const gap = now - this.lastInputAt;
    const resumed = gap > IDLE_MS;
    const elapsed = resumed ? 80 : Math.max(1, gap);
    const velocity = Math.min(8, distance / (elapsed / 1000));
    const smoothing = 1 - Math.exp(-elapsed / 140);
    this.speed = resumed ? velocity : this.speed + smoothing * (velocity - this.speed);
    const direction = delta > 0 ? 1 : -1;
    if (resumed || direction !== this.direction) {
      this.pending = [];
      this.nextAttackAt = Math.max(now, this.lastAttackAt + MIN_NOTE_GAP_MS);
    }
    if (Number.isFinite(this.lastAttackAt)) {
      // A flick must accelerate the current phrase, including after a small first input.
      this.nextAttackAt = Math.min(this.nextAttackAt, this.lastAttackAt + this.interval);
    }
    const from = this.position * SCORE_CYCLES;
    const to = next * SCORE_CYCLES;
    let crossed = this.groups.filter(group => direction > 0
      ? group.onset >= from && group.onset < to
      : group.onset < from && group.onset >= to);
    if (direction < 0) crossed = crossed.toReversed();
    this.pending.push(...crossed);
    // Skimming follows the current passage instead of accumulating skipped notes.
    if (this.mode === 'skim') this.pending = this.pending.slice(-4);
    else this.pending = this.pending.slice(-3);
    this.position = next;
    this.direction = direction;
    this.lastInputAt = now;
    return true;
  }

  take(now) {
    if (!this.active(now) || now < this.nextAttackAt || !this.groups.length) return null;
    let group = this.pending.shift();
    if (!group) {
      if (now - this.lastAttackAt < 780) return null;
      const candidates = this.tonalGroups.length ? this.tonalGroups : this.groups;
      group = candidates.findLast(item => item.onset <= this.position * SCORE_CYCLES) ?? candidates[0];
    }
    this.lastAttackAt = now;
    this.nextAttackAt = now + this.interval;
    return {
      ...group,
      direction: this.direction > 0 ? 'forward' : 'backward',
      mode: this.mode,
      speed: this.speed,
      duration: this.mode === 'slow' ? 0.55 : clamp(this.interval / 1000 * 0.85, 0.08, 0.4),
      gainScale: Math.min(0.94, 0.94 * (this.interval / 240) ** 0.2),
      releaseScale: this.mode === 'skim' ? 1.4 : 3.8,
    };
  }

  discardPending() {
    this.pending = [];
  }
}

export function expressiveVoices(plan, previousMelody = null) {
  const pitched = plan.events.filter(event => !isPercussion(event.value) && midiOf(event.value.note) !== null);
  const melody = pitched.length ? pitched.reduce((highest, event) => midiOf(event.value.note) > midiOf(highest.value.note) ? event : highest) : null;
  let nextMelody = melody ? midiOf(melody.value.note) : previousMelody;
  if (melody && (plan.mode === 'skim' || (previousMelody !== null && Math.abs(nextMelody - previousMelody) > 9))) {
    const anchor = previousMelody ?? 69;
    const alternatives = [-24, -12, 0, 12, 24].map(offset => nextMelody + offset).filter(note => note >= 48 && note <= 86);
    if (alternatives.length) nextMelody = alternatives.reduce((nearest, note) => Math.abs(note - anchor) < Math.abs(nearest - anchor) ? note : nearest);
  }
  const lowest = pitched.length ? pitched.reduce((low, event) => midiOf(event.value.note) < midiOf(low.value.note) ? event : low) : null;
  const events = plan.mode === 'skim' && pitched.length > 2
    ? plan.events.filter(event => isPercussion(event.value) || event === melody || event === lowest)
    : plan.events;
  const voices = events.map(event => {
    const value = event.value;
    const percussion = isPercussion(value);
    const release = percussion ? clamp(value.release ?? 0.06, 0.02, 0.16) : clamp((value.release ?? 0.12) * plan.releaseScale, plan.mode === 'skim' ? 0.12 : 0.3, 0.72);
    const energy = clamp(((plan.speed ?? 2.5) - 1.2) / 4);
    return {
      event,
      duration: percussion ? Math.min(plan.duration,0.2) : plan.duration,
      value: {
        ...value,
        note: event === melody ? nextMelody : value.note,
        gain: (value.gain ?? 0.2) * plan.gainScale,
        attack: percussion ? value.attack ?? 0.001 : Math.max(plan.mode === 'skim' ? 0.012 : 0.018, value.attack ?? 0.01),
        release,
        cutoff: percussion ? value.cutoff ?? 10000 : Math.min(6500, (value.cutoff ?? 3500) * (1 + energy * 0.18)),
        delay: clamp(value.delay ?? (percussion ? 0 : 0.13), 0, plan.mode === 'skim' ? 0.16 : 0.32),
        delaytime: clamp(value.delaytime ?? 0.24, 0.04, plan.mode === 'skim' ? 0.24 : 0.4),
        delayfeedback: clamp(value.delayfeedback ?? 0.16, 0, plan.mode === 'skim' ? 0.14 : 0.22),
        ...(value.room !== undefined ? { room: clamp(value.room, 0, plan.mode === 'skim' ? 0.12 : 0.3) } : {}),
      },
    };
  });
  return { voices, nextMelody };
}
