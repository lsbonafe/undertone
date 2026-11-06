import { clamp } from './motion.js';

// Simple ratios are a tuning choice, not a universal model of musical preference.
const RATIOS = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8];

export function holdFrequencies(notes) {
  if (!notes.length) return [];
  const root = notes[0];
  const frequency = 440 * 2 ** ((root - 69) / 12);
  return notes.map(note => {
    const interval = note - root;
    const octaves = Math.floor(interval / 12);
    const degree = ((interval % 12) + 12) % 12;
    return frequency * 2 ** octaves * RATIOS[degree];
  });
}

export function calmProfile(profile) {
  return {
    ...profile,
    comfort: true,
    cutoff: profile.kind === 'pure' ? 1100 : clamp((profile.cutoff ?? 2400) * 0.52, 450, 1600),
    levelScale: profile.levelScale * 0.7,
    ...(profile.partials ? { partials: profile.partials.map((amplitude, index) => amplitude / (index + 1) ** 0.7) } : {}),
    ...(profile.fmi ? { fmi: profile.fmi * 0.35 } : {}),
    ...(profile.spread !== undefined ? {spread:profile.spread*0.35} : {}),
    ...(profile.drive !== undefined ? {drive:Math.max(0.5,profile.drive*0.35)} : {}),
    ...(profile.vibmod !== undefined ? {vibmod:profile.vibmod*0.4} : {}),
  };
}

export function holdVoiceBalance(notes, index) {
  if (index !== 2) return 1;
  const degree = ((notes[index] - notes[0]) % 12 + 12) % 12;
  return [1, 6, 11].includes(degree) ? 0.45 : 0.85;
}
