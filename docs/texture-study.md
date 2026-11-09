# Continuous touch experiment

Local comparison: `http://127.0.0.1:4173/examples/texture/index.html`

The homepage and standalone player use `createScrollScore`. Select `touch: 'continuous'` at creation or call `player.setTouch('continuous')`. The original interpretation is available as `notes`. See the [API reference](player.md).

## Musical approach

Continuous touch places tonal movement inside a lower, layered texture. Scroll speed shapes its swell and brightness promptly; pitch colors blend more slowly underneath. It uses sustained, fixed-pitch voices rather than a separate solo lead. Musical effect and reading comfort require listening review.

Retain each source's tonal center and collection:

- **Wonder / space**: D Lydian over D–A, including E, F♯ and G♯ colors from its phrases.
- **Unease / reef**: D Phrygian over D–A, retaining its E♭ tension and lower register.
- **Empty mall**: D major over the existing 72 BPM backing; pads, bass and drums keep their original clock.

These are artistic choices, not universal claims about a scale's emotional effect or an imitation of a film soundtrack.

## Movement contract

| Action | Continuous response |
| --- | --- |
| Scroll down or up | Blend forward or backward through harmonic colors derived from the score. |
| Move slowly | Keep the sound softer and darker while the harmony changes beneath it. |
| Move faster | Make the same texture swell and open; do not add a louder solo or a rush of keyed notes. Backing BPM stays fixed. |
| Stop | Hold the current harmony and let expression settle. No skipped-note queue continues. |
| Make a large jump | Blend toward the new location without playing every intermediate phrase. |
| Resize / seek | Align the texture without generating an expressive gesture. |
| Play / Pause | Explicitly enable or silence all layers. Scrolling never changes playback intent. |

This deliberately reinterprets the score as harmonic movement. It does not play every foreground note or promise the exact melody. Notes mode keeps the original implementation for comparison.

## Harmonic material

`textureMelody` identifies the authored foreground: explicit **orbit 1** when present, otherwise the pitched sound/orbit layer with the highest average authored gain. Chords become their top voice. This fallback fits the three study scores; future arrangements should identify their foreground explicitly.

`textureVoicings` divides the twelve-cycle score into twelve harmonic frames. Each frame takes the first and last distinct non-pedal colors from its foreground phrase and folds them into the octave above the shared root. A root octave fills missing colors. This keeps the pitch classes while avoiding the exposed high register of a foreground lead. The shared root/fifth remains underneath.

`textureShape` blends adjacent frames with equal-power weights. `textureColorMix` combines shared tones and normalizes their energy so a note common to both frames does not swell just because the frames overlap. One sustained voice pair is allocated per unique color, plus two pairs for the pedal. The source count is bounded by the pitch collection, not the number of frames or scroll events; even a fully chromatic collection needs at most 26 oscillators.

Every oscillator keeps its frequency for the lifetime of the texture. Movement changes gains, filtering and stereo placement. No new sources, pitch bends or solo-note attacks are triggered by scrolling. Interrupted expression envelopes retain explicitly tracked starting values.

## Saved tuning

- `TEXTURE_RESPONSE`: 420–720 Hz resting cutoff, up to 5200 Hz of motion opening, 70 ms filter smoothing, stereo excursion up to ±0.42, and an 800 ms energy-decay constant after a short hold. Small intentional gestures receive a minimum response; tiny jitter does not.
- The same configuration sets a restrained overall swell: `0.82 + 0.4 × energy`, smoothed over a 140 ms time constant. Brightness and color balance contribute to the expression as well as amplitude.
- `HARMONY_RESPONSE`: twelve harmonic frames, color levels 0.023/0.017, and a 450 ms crossfade time constant. Stable pedal levels are 0.045/0.025. The paired oscillators retain slight detuning and the earlier waveform's fundamental plus seven progressively quieter harmonics.

These values describe synthesis behavior, not perceptual guarantees. A 450 ms exponential time constant means a blend takes roughly 1.35 seconds to reach 95% of a new target.

`TextureInstrument` replaces the old orbit-1 gesture foreground in groove mode while retaining the actual backing. Hold mode uses the texture alone. Play/Pause, root-document motion, A/B switching and cleanup keep their existing contracts.

## Verification and acceptance

Run `npm test` and `npm run build`. Checks cover source pitch membership, varied harmonic frames, low register, common-tone blend energy, fixed voice count/frequencies, slow/fast/reverse/stopped movement, equivalent travel at different event rates, seeks, finite output, headroom and mute.

Native rendering verifies that E/F♯ changes into E/G♯ through sustained voices, rather than merely filtering one fixed chord. Time-matched renders verify the quick response to a small scroll and restrained faster/slower dynamics at the same harmonic position. Actual instrument tests cover A/B changes and groove continuity.

Browser listening remains the acceptance gate. Compare all three readings and judge the texture, the sense of touch and whether the harmonic movement avoids monotony. Automated checks cannot establish that it sounds mature, appealing or pleasant.
