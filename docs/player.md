# Player API

`scroll-player.js` is a browser ES module. Serve the repository over HTTP and import it from your page, or install it in a bundled project:

```sh
npm install github:lsbonafe/undertone
```

```js
import { createScrollScore } from 'undertone-scroll-scores/player';
```

Pin a commit in the dependency URL for reproducible deployments. The runtime and its bundled audio assets must remain accessible to the browser. No remote synthesis service is used.

## Creation options

`await createScrollScore(options)` loads and compiles the score, attaches page listeners and returns a player.

| Option | Default | Purpose |
| --- | --- | --- |
| `contentElement` | required | Attached DOM element defining the musical scroll range. Use `document.documentElement` for the whole page. |
| `scoreUrl` | required | URL of an owner-trusted `.strudel` score. |
| `touch` | `'notes'` | `'notes'` for authored note groups; `'continuous'` for sustained harmonic blending. |
| `mode` | `'hold'` | `'hold'` sustains the current harmony; `'groove'` keeps backing music running. |
| `bpm` | — | Required positive tempo for groove mode. |
| `character` | `'electronic'` | Backing treatment; also supports `'vaporwave'`. |
| `volume` | `0.55` | Initial output level, clamped to 0–1. |
| `autoStart` | `true` | Attempt startup if the saved preference allows it. `false` starts paused until explicitly enabled. |
| `preferenceKey` | `'undertone.sound'` | Browser storage key for the sound preference. |

Touch and mode are independent. Continuous groove retains the backing clock and replaces the keyed foreground with the sustained texture. Switching touch keeps position, score, volume and playback intent; it crossfades the audio paths but can restart the backing passage.

The host page scrolls; `contentElement` is a range marker, not an independently scrolling container. Position maps to twelve score cycles. For an article, progress begins at its document offset and ends when its bottom reaches the viewport bottom.

## Player methods

| Method | Behavior |
| --- | --- |
| `enable()` | Start or resume sound; safe to call when already playing. |
| `toggle()` | Toggle playback intent. |
| `pause()` | Silence sound and remember the pause choice. |
| `wake()` | Retry pending browser startup when sound is requested. |
| `setTouch('continuous' \| 'notes')` | Change interpretation immediately. Invalid values throw without changing the current touch. |
| `setVolume(0..1)` | Update output level. |
| `await setScore(url, { mode?, bpm?, character? })` | Load a new score, retaining touch and current mode unless a mode is supplied. A supplied groove mode requires `bpm`. Latest load wins. |
| `destroy()` | Mute, cancel scheduling and remove listeners. Safe to call twice. |

Read `player.touch`, `player.state`, `player.control`, `player.desired`, `player.holding` and `player.groove`. `player.instrument` exposes the underlying engine for advanced integrations; prefer the methods above for normal use.

`state` is `waiting`, `starting`, `playing`, `paused` or `error`. `control` contains a button `label` and `pressed` flag. The flag is true only when audio is running. Autoplay can require a gesture; bind `toggle()` to a button with `data-scroll-score-toggle` so the generic wake listener does not also handle that click.

Scrolling shapes enabled sound; it never changes playback intent. Hidden pages silence their voices, then resume when visible if sound is still requested. Score replacement clears the old audio before loading; a failed load reports an error and leaves no old score playing. Call `destroy()` before removing the reading or mounting another player.

## Callbacks

- `onStateChange(state, control)` — sound startup and transport state.
- `onProgress(progress)` — musical range position, from 0 to 1.
- `onNotes(notes, direction, mode, foreground?)` — played notes or current texture colors. Groove backing notifications may also occur.
- `onIdle(phase, heldNotes?)` — quiet, held harmony or continuing loop.
- `onError(error)` — loading or audio errors. Initial creation and `setScore()` also reject on loading failure.

Only one player is allowed per page. Score source is evaluated as JavaScript and must not come from untrusted visitors. The runtime and original scores are AGPL-3.0-or-later; consult the repository license and third-party notices before redistribution.
