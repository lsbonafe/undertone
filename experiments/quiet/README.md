# Quiet: local continuous-sound experiment

Serve the existing Undertone checkout with `npm start` and open
`http://127.0.0.1:4173/experiments/quiet/index.html`.

This directory is outside `build.mjs`'s publication list. The experiment does not modify the production player or reading catalogue. No new package, account, remote sample bank or audio service is needed.

## The four sounds

- **Brown noise:** low-weighted noise with a gentle high-pass to remove DC and very low rumble. Scrolling opens its low-pass filter; a quicker gesture briefly adds more air.
- **Pink noise:** a broader noise spectrum. Smooth low-pass motion reveals more of its upper texture as the page moves.
- **Soft tones:** an original D-major-pentatonic Strudel score with a D–A foundation and E/F♯/B colors. `QuietFlow` retains Undertone's fixed pitch pool and common-tone normalization, with slower blends, steady level and a narrower brightness range.
- **Binaural tones:** a pure 180 Hz carrier exclusively on the left, with the right carrier smoothly 6–12 Hz above it, plus a soft central pink-noise bed. Scrolling changes the beat separation and noise filter. Stereo headphones are needed for this comparison.

These are sound-design choices, not claims that a pitch collection or frequency produces a particular state. The noise generators use the algorithms present in the pinned Strudel bundle. An eight-second buffer includes a smooth seam overlap, removes DC and normalizes source RMS. Native Web Audio loops the buffers; it does not trigger a new sample on every scroll.

## Movement and playback

Use Undertone's `SoundControl`, Strudel audio context, `scrollProgress`, score compiler, harmonic-frame functions and `FlowTexture`. Local `QuietLayer` graphs add sustained noise and separated stereo carriers without converting every example into the same pad.

Play explicitly resumes the context inside the button gesture. Saved preference alone never implies playing. Pause during asynchronous startup cancels the pending start. Selecting another texture fades out the old graph; Pause and navigation stop all sources. The sound can continue in a background tab. The default master volume is 25%, with an explicit user control.

Scroll position traverses a darker-to-airier filter range. Gesture speed adds a bounded brightness response with a minimum for intentional movement and a 160 ms filter smoothing constant; it settles after a stop. The harmony uses an 850 ms blend constant. No motion-driven gain boost is commanded, though a broader spectrum can modestly change signal RMS. Binaural separation follows page position with up to a 1 Hz motion contribution, capped at 12 Hz and smoothed over 350 ms. A stop preserves the current position; reverse scrolling retraces the same resting targets. Scroll response off holds the current position and settles motion. Resize aligns position without adding a gesture. The transport shows the active colour position and whether a gesture is settling.

## Evidence and limits

The [2024 white/pink-noise review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11283987/) found a small task-performance benefit in children and young adults with ADHD or elevated attention difficulties. That population-specific finding does not establish benefit for all users; no brown-noise studies were identified in that review.

The [2023 binaural-beat review](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0286023) found inconsistent evidence for brainwave entrainment. The frequency difference here is an acoustic demonstration, not a claim to induce a particular brain state or improve attention.

[NCCIH's music summary](https://www.nccih.nih.gov/health/music-and-health-what-you-need-to-know) reports evidence for some music-based interventions and stress-related outcomes. This original harmony and its scroll mapping have not been studied for those outcomes. Preference, loudness and the task may change whether a listener finds a sound helpful or distracting.

## Validation

```sh
node --test experiments/quiet/quiet.test.mjs
npm test
npm run build
```

The local suite checks noise spectra and loop boundaries, D3-based harmonic continuity, separate left/right carriers and rendered beat-separation changes, finite output and headroom, stopped/slow/fast/reverse movement, source reuse, switching, pause, fixed-response comparison and startup cancellation. A matched-position render requires a 24px gesture to change actual normalized spectral brightness within 300 ms, with RMS change below 20%. This tests a response in the audio rather than only control values. Existing tests validate the unchanged production player. These are automated checks; browser listening, perceived comfort and concentration are separate acceptance questions.
