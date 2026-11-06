import * as strudel from './assets/vendor/strudel.mjs';
import { porcelainSample } from './assets/audio/porcelain.js';
import { genreSamples } from './assets/audio/genre-samples.js';
import { registerGenreSounds } from './genre-sounds.js';

let registered;

export async function registerReadingSounds() {
  strudel.registerZZFXSounds();
  registerGenreSounds();
  registered ??= strudel.samples({ porcelain: { c4: [porcelainSample] }, u_tape:{c4:[genreSamples.u_tape]}, ...Object.fromEntries(['u_kick','u_hat','u_snare'].map(name => [name,[genreSamples[name]]])) });
  await registered;
  // Decode before the first gesture so a lazy sample load cannot drop its attack.
  await Promise.all(['porcelain','u_tape','u_kick','u_hat','u_snare'].map(name => strudel.getSampleBuffer({ s:name, note:name === 'porcelain' || name === 'u_tape' ? 'c4' : undefined }, strudel.getSound(name).data.samples)));
}
