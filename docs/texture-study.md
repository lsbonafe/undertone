# Continuous touch experiment

Local comparison: `http://127.0.0.1:4173/examples/texture/index.html`

The homepage and standalone player use `createScrollScore`. Select `touch: 'continuous'` at creation or call `player.setTouch('continuous')`. The original interpretation is available as `notes`. See the [API reference](player.md).

## Musical approach

Continuous touch places tonal movement inside a lower, layered texture. Scroll speed shapes its swell and brightness promptly; pitch colors blend more slowly underneath. It uses sustained voices rather than a separate solo lead. The foreground's authored instrument determines its sound family. Musical effect and reading comfort require listening review.

Retain each source's tonal center and collection:

- **Wonder / space**: soft glass in D Lydian over D–A, including E, F♯ and G♯ colors from its phrases.
- **Unease / reef**: hollow reeds in D Phrygian over D–A, retaining its E♭ tension and lower register.
- **Empty mall**: metallic FM in D major over the existing 72 BPM backing; pads, bass and drums keep their original clock.

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

`textureVoicings` divides the twelve-cycle score into twelve harmonic frames. Each frame takes the first and last distinct non-pedal colors from its foreground phrase and folds them into the octave above the shared root. Deep bass foregrounds preserve their opening root and use colors in the same octave instead. A root octave fills missing colors. This keeps the pitch classes while avoiding the exposed high register of a foreground lead. The shared root/fifth remains underneath.

`textureShape` blends adjacent frames with equal-power weights. `textureColorMix` combines shared tones and normalizes their energy so a note common to both frames does not swell just because the frames overlap. One sustained voice pair is allocated per unique color, plus two pairs for the pedal. The source count is bounded by the pitch collection, not the number of frames or scroll events; even a fully chromatic collection with FM needs at most 40 oscillators including modulation.

Movement changes gains, filtering and stereo placement. No new sources, pitch bends or solo-note attacks are triggered by scrolling. Tape wow adds a small ongoing detune modulation, and metallic voices use audio-rate FM around fixed carrier pitches. Interrupted expression envelopes retain explicitly tracked starting values. Pause stops carriers and modulation together.

## Sound families

`textureTimbre` uses the same foreground selection as `textureMelody`. It requires no story-specific preset or remote sample bank:

- Foregrounds entirely between C1 and G♯2, starting on C2 or below, become **deep bass**. Their opening root stays in its authored octave; color tones occupy the same octave, with the root octave as a fallback. This keeps the *Below the surface* study's voices between D1 and D2 (36.7–73.4 Hz). A fundamental-heavy spectrum and a 0.18 cutoff multiplier keep the texture low even during movement.
- Plain sine foregrounds become **soft glass**, with a gently declining harmonic spectrum.
- Triangle and square foregrounds become **hollow reeds**, emphasizing odd harmonics around an 850 Hz resonance.
- Sawtooth and grit foregrounds become **bowed strings**, with richer harmonics and wider paired detuning.
- Authored additive partials become a **harmonic organ**. The richest authored partial set supplies the sustained spectrum.
- FM foregrounds become **metal shimmer**, using the authored modulation ratio and restrained sustained FM depth.
- Porcelain's short sample becomes **bowed glass**, emphasizing the third, fifth and seventh harmonics without looping the strike.
- Haze and tape foregrounds become a **tape choir**, with wider detuning and slow, shallow wow.
- Foregrounds with vowel shaping become a **vowel choir**, with a broad 1100 Hz formant.

The pure sine pedal sits below the more prominent color voices, so the shared foundation does not mask each score's character. These names describe synthesis choices; they do not promise realistic acoustic instruments. The page shows the active family beside the score's scale.

## Saved tuning

- `TEXTURE_RESPONSE`: 420–720 Hz resting cutoff, up to 5200 Hz of motion opening, 70 ms filter smoothing, stereo excursion up to ±0.42, and an 800 ms energy-decay constant after a short hold. Small intentional gestures receive a minimum response; tiny jitter does not.
- The same configuration sets a restrained overall swell: `0.82 + 0.4 × energy`, smoothed over a 140 ms time constant. Brightness and color balance contribute to the expression as well as amplitude.
- `HARMONY_RESPONSE`: twelve harmonic frames, color levels 0.045/0.034, and a 450 ms crossfade time constant. Stable sine pedal levels are 0.028/0.016. Color spectra, detuning, cutoff multipliers, formants and modulation follow the sound family above.

These values describe synthesis behavior, not perceptual guarantees. A 450 ms exponential time constant means a blend takes roughly 1.35 seconds to reach 95% of a new target.

`TextureInstrument` replaces the old orbit-1 gesture foreground in groove mode while retaining the actual backing. Hold mode uses the texture alone. Play/Pause, root-document motion, A/B switching and cleanup keep their existing contracts.

## Verification and acceptance

Run `npm test` and `npm run build`. Checks cover source pitch membership, varied harmonic frames, low register, common-tone blend energy, fixed voice count/base frequencies, slow/fast/reverse/stopped movement, equivalent travel at different event rates, seeks, finite output, headroom and mute. Matched renders on identical notes verify distinct normalized upper-partial spectra for all eight sound families both at rest and during movement. Family renders also check that mute stops modulation sources.

Native rendering verifies that E/F♯ changes into E/G♯ through sustained voices, rather than merely filtering one fixed chord. Time-matched renders verify the quick response to a small scroll and restrained faster/slower dynamics at the same harmonic position. Actual instrument tests cover A/B changes and groove continuity.

Browser listening remains the acceptance gate. Compare glass (space), reeds (reef), strings (erosion), organ (fireflies), metal (bell), bowed glass (porcelain), tape (vhs) and choir (library). Judge the texture, the sense of touch and whether the harmonic movement avoids monotony. Automated checks cannot establish that it sounds mature, appealing or pleasant.

The deep bass example is available at `/?story=depths&touch=continuous`. Headphones or speakers with bass extension make its 37 Hz foundation easier to hear. Tests render slow, fast, reverse and stopped movement, verify the D1 fundamental and low-frequency energy, and check finite output, headroom and mute.
