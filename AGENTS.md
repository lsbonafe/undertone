# Undertone agent context

Undertone pairs authored Strudel scores with reading motion. Read [the composition guide](docs/composing.md) before writing or changing a score, and use [the README](README.md) for the player API and playback architecture.

## Working on a score

- Start from the subject and source text. State the intended tonal center, pitch collection, motif, and sound-making idea before writing notes. These are artistic choices; do not claim a scale objectively encodes an emotion.
- Keep the score compatible with the current 12-cycle player and its three four-cycle passages. For groove mode, put the scroll-played foreground on orbit 1 and supply a BPM in the story or player configuration.
- Check normal, reverse, slow, fast, and stopped scrolling. A hold score should sustain a stable harmonic moment; a groove should keep its backing while scrolling adds a distinct lead.
- Use existing registered sounds or add and test a sound explicitly. Do not load untrusted visitor-written score code: `compileScore` evaluates score source.
- If adding an Undertone story, update its entry in `stories.js`, score, attribution, navigation, and the reading catalogue together. Preserve the distinction between sourced adaptations and fiction. Do not restore the removed hard techno case.
- Run `npm test` and `npm run build` for score or player changes. Treat rendered audio checks as evidence about timing and levels, not as a listening test; report browser audition separately.

Do not commit or push changes without the user's explicit authorization.
