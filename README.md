# Undertone

Scroll-driven music for the web. Pair a reading with a Strudel score, then let the reader shape its phrasing, dynamics and harmony.

[Live demo](https://lsbonafe.github.io/undertone/) · [Standalone example](https://lsbonafe.github.io/undertone/examples/hello/) · [API reference](docs/player.md)

## Use

Serve the repository alongside your page and import its browser module. No server-side audio service or API key is required.

```js
import { createScrollScore } from './undertone/scroll-player.js';

const button = document.querySelector('[data-scroll-score-toggle]');
const player = await createScrollScore({
  contentElement: document.querySelector('article'),
  scoreUrl: './music/reading.strudel',
  touch: 'continuous',
  autoStart: false,
  onStateChange: (state, control) => {
    button.textContent = control.label;
    button.setAttribute('aria-pressed', String(control.pressed));
  },
});

button.addEventListener('click', () => player.toggle());
// Optional: player.setTouch('notes');
// When removing the reading: player.destroy();
```

Add `data-scroll-score-toggle` to your playback button. The returned control reflects actual audio startup, including browsers that require a user gesture.

- **Continuous** blends sustained harmonic colors. Scroll speed controls their swell, brightness and stereo movement.
- **Notes** plays authored note groups as the reader moves forward or backward. This remains the API default.

Both support `mode: 'hold'` for a sustained pause or `mode: 'groove'` with a positive `bpm` for a continuing backing. Groove scores put the scroll-controlled foreground on **orbit 1**.

Only load trusted scores: the Strudel compiler evaluates their JavaScript. One player can run per page. For package installation, lifecycle behavior and all options, see the [API reference](docs/player.md).

## Develop

Requires Node.js 22 or newer.

```sh
npm ci
npm start       # http://127.0.0.1:4173
npm test
npm run build  # Static output in dist/
```

Tests cover score compilation, both touches, playback state, navigation, scheduling and rendered audio. Browser listening remains necessary to assess sound and device behavior.

[Composition guide](docs/composing.md) · [Architecture and theory](docs/architecture.md) · [Continuous synthesis](docs/texture-study.md) · [Reading catalogue](docs/readings.md) · [Original journal](https://lsbonafe.github.io/undertone/journal.html)

## License

Code and original scores: [AGPL-3.0-or-later](LICENSE). The bundled Strudel engine is pinned to `@strudel/web 1.3.0`; see [third-party notices](THIRD_PARTY.md). Source articles and credited imagery retain their respective rights.
