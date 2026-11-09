import { createScrollScore } from '../../scroll-player.js';

const button = document.querySelector('#sound');
const status = document.querySelector('#status');
try {
  const player = await createScrollScore({
    contentElement:document.querySelector('#article'),
    scoreUrl:'./score.strudel',
    onStateChange:(state, control) => {
      button.textContent = control.label;
      button.setAttribute('aria-pressed', String(control.pressed));
      status.textContent = state === 'waiting' ? 'Click to start sound' : state;
    },
    onError:error => { status.textContent = `Sound error: ${error.message}`; },
  });
  button.textContent = player.control.label;
  button.addEventListener('click', () => player.toggle());
} catch (error) { status.textContent = `Cannot load score: ${error.message}`; }
