# Third-party material

## Strudel

- Browser bundle: `@strudel/web` version **1.3.0**.
- Unmodified distribution: https://unpkg.com/@strudel/web@1.3.0/dist/index.mjs
- Package metadata: `assets/vendor/strudel-package.json`.
- Source repository: https://codeberg.org/uzu/strudel
- Package versions: core 1.2.6, mini 1.2.6, tonal 1.2.6, transpiler 1.2.6, webaudio 1.3.0, as listed by the package.
- Authors: Felix Roos, Alex McLean and Strudel contributors.
- License: AGPL-3.0-or-later; full text in `LICENSE`.

The bundle is self-contained. This demo uses built-in oscillators, ZZFX, two original registered instruments and five original recordings with AudioWorklet effects disabled. It does not load remote sample banks or optional worklet synthesizers. `scripts/make-porcelain.py` generates the original C4 strike. `scripts/make-genre-samples.py` generates the kick, hat, snare and electric-key chord. Their WAV files and embedded JavaScript representations live in `assets/audio/`. `genre-sounds.js` defines the original native Web Audio graphs registered with Strudel. None of these sounds uses a third-party recording.

## Image

`assets/images/pillars.png` is NASA’s James Webb Space Telescope Pillars of Creation image:
https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2022/10/STScI-01GGF8H15VZ09MET9HFBRQX4S3.png/jcr:content/renditions/cq5dam.web.1280.1280.png

Credit: NASA, ESA, CSA, STScI; image processing by Joseph DePasquale, Anton Koekemoer and Alyssa Pagan.

All SVG story illustrations are original to this demo. They are illustrative scenes rather than photographs or reconstructions of the reported events.

## Type

Instrument Serif and DM Sans are requested from Google Fonts. Local serif and sans-serif fallbacks preserve functionality when the font service is unavailable.
