# Composing for scroll

This is a working guide for people and agents writing original scores for Undertone. The [architecture guide](architecture.md#how-a-scroll-becomes-music) explains the player and the [existing scores](../scores/) show concrete arrangements. The mappings below describe this project's musical choices, not rules that make a particular emotion inevitable.

## Begin with a musical brief

Write down the subject, the section of text being scored, the feeling you want to explore, and one sound-making technique that relates to it. Choose a tonal center and a small pitch collection, then identify a recurring root or fifth that can anchor both directions. Give each of the three passages a change in register, density, harmony, or timbre that follows the text. Make the connection an explicit analogy, not a claim that the subject has a universal sound.

Examples already in the repo: [`space.strudel`](../scores/space.strudel) uses D Lydian over a D–A reference; [`erosion.strudel`](../scores/erosion.strudel) filters upper harmonics as its reading describes removal; [`mall.strudel`](../scores/mall.strudel) uses detuned extended chords and a separate scroll-played chime. The [theory section](architecture.md#the-musical-theory) explains the pitch and synthesis reasoning behind these choices.

## Shape the score for movement

The current player maps the article from 0 to **12 Strudel cycles**. Compose three four-cycle passages with audible pitched material in each. Moving down traverses note groups forward; moving up traverses them backward. A useful motif survives reversal because its notes share a pitch collection and tonal reference, even though its shape changes. Avoid making every passage depend on a one-way cadence to make sense. Test the actual reverse trip; reversing notes does not automatically preserve a phrase's effect.

At a slow scroll, attacks are spaced further apart. At a fast scroll, the player limits density, shortens tails, simplifies dense chords, and drops skipped groups. Make the essential contour audible without every inner voice. Keep a clear lead above its supporting layers, and avoid stacking long releases or strong delays that blur fast movement. In this repo's scores, authored gain is kept at or below **0.3** per event; rendered output still needs a headroom check because overlapping voices can add up.

### Continuous touch

Set `touch: 'continuous'` to interpret the foreground as twelve slowly blended harmonic frames. It uses the score's pitch collection with a shared pedal and a lower color register; scroll speed shapes level, brightness and stereo. Its sustained sound family follows the foreground instrument: glass, reeds, strings, organ, metallic FM, tape or vowel choir. Short sample attacks become a sustained harmonic reconstruction. Identify the foreground on **orbit 1** for predictable pitch and sound selection. Both hold and groove modes support either touch. See [continuous touch](texture-study.md).

For a deep bass study, keep the entire foreground between C1 and G♯2 and start on C2 or below. Continuous touch preserves that opening bass root and blends colors in its octave, using a dark, fundamental-heavy voice. [`depths.strudel`](../scores/depths.strudel) demonstrates a D1–A1 foundation. A low accompaniment alone does not activate this register; the foreground must be low too.

### Hold mode

No new melody should advance when scrolling stops. The player derives a sustained voicing from the current score: a root, its fifth, and an upper melodic color. Give it enough stable pitched material near every position to make that derivation useful. The hold lowers brightness and level, softens tense intervals, and crossfades, while retaining some of the score's synthesis character. Audition several stopped positions for sustained comfort, including the beginning, passage boundaries, and ending. A brief sample strike will be reconstructed as a sustained harmonic blend; it will not be looped indefinitely.

### Groove mode

Set `mode: 'groove'` and a positive `bpm`. The backing keeps its clock and current four-bar passage when scrolling stops. Put the scrolling foreground on **orbit 1**; it is excluded from automatic backing playback. Write it with a clear attack and enough level to be heard over bass and drums. Other orbits can carry the continuing pad, bass, percussion, and texture. Scrolling adds foreground notes and energy without changing the backing BPM. Test small scroll movements, fast flicks, reversals, and long stationary listening. Groove mode currently divides the 12 cycles into three four-bar passages.

## Choose a sound-making method

Strudel notes can use built-in sine, triangle, sawtooth, square, and related synth voices; this repo also registers `haze`, `grit`, `porcelain`, `u_tape`, `u_kick`, `u_hat`, and `u_snare`. Use filter shape, FM, additive partials, saturation, sampling, envelope, stereo placement, and restrained delay or room effects as part of the arrangement. Pick a technique because its audible behavior supports the text: subtractive filtering can thin a texture, a sample can imply memory or fragments, and a steady rhythm can sustain a scene through reading pauses. Keep analogy separate from literal sound imitation.

## Verify a new score

1. Compile the score and inspect events across all 12 cycles. For an Undertone story, the score tests check pitched notes against its declared pitch collection, passage coverage, valid sounds, gain, and exact reverse traversal.
2. Run `npm test` and `npm run build`. The existing suite exercises both playback modes and renders audio for timing, response, and levels.
3. In a browser, listen while moving down and up slowly, scrolling quickly, stopping at different positions, and pausing sound. Check the lead-to-backing balance on ordinary speakers or headphones. Automated tests do not establish that the music is pleasant or that browser autoplay succeeded.

Only use score source trusted by the site owner. The compiler evaluates Strudel source code; visitor submissions require a separate isolation design.
