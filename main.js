import { stories, readingWordCount } from './stories.js';
import { scrollProgress, pitchClassOf } from './motion.js';
import { SoundControl } from './sound-control.js';

const $ = id => document.getElementById(id);
const scores = new Map();
const initialSubjects = { space:'the cosmos', reef:'our oceans', orchestra:'human ingenuity' };
document.querySelector('.story-nav').innerHTML = Object.entries(stories).map(([id, story]) => `<a href="?story=${id}" data-story-link="${id}"><span>${story.number}</span> ${story.navTitle ?? story.feeling} <span class="nav-subject">/ ${story.navSubject ?? initialSubjects[id]}</span><span class="nav-arrow" aria-hidden="true">↗</span></a>`).join('');
let instrument;
let sound;
let activeStory;
let routeEpoch = 0;
let ignoreScroll = true;
let frame;
let activeNotesTimer;
let audioError = false;

function currentProgress() {
  return scrollProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
}

function updateProgress(progress) {
  $('reading-progress').textContent = `${Math.round(progress * 100).toString().padStart(2, '0')}%`;
  $('score-cursor').style.left = `${progress * 100}%`;
  const bars = $('score-strip').querySelectorAll('i');
  bars.forEach((bar, index) => bar.classList.toggle('played', index / bars.length < progress));
}

function idle(phase = instrument?.holding ? instrument?.groove ? 'loop' : 'hold' : 'quiet', held = []) {
  if (phase === 'quiet') {
    clearTimeout(activeNotesTimer);
    document.querySelectorAll('[data-pitch-class]').forEach(dot => dot.classList.remove('active'));
  }
  $('transport-direction').textContent = phase === 'loop' ? '↻' : '↕';
  if (phase === 'hold') {
    clearTimeout(activeNotesTimer);
    if (held.length) {
      const pitches = held.map(pitchClassOf);
      document.querySelectorAll('[data-pitch-class]').forEach(dot => dot.classList.toggle('active', pitches.includes(Number(dot.dataset.pitchClass))));
    }
  }
  $('transport-status').textContent = audioError ? 'Sound needs another try' : sound?.state === 'playing' ? phase === 'loop' ? 'Looping this passage' : phase === 'hold' ? 'Holding this moment' : 'Ready for your scroll' : sound?.desired === false ? 'Sound paused' : sound?.state === 'starting' ? 'Opening sound…' : 'Click, tap or press a key to start sound';
  $('transport-hint').textContent = phase === 'loop' ? 'Scroll to play the lead' : phase === 'hold' ? 'Scroll when you’re ready' : activeStory?.playback?.mode === 'groove' ? 'A steady groove · your scroll plays the lead' : 'Your scroll sets the phrasing';
}

function updateSoundControl() {
  $('sound-toggle').disabled = false;
  $('sound-toggle').setAttribute('aria-pressed', String(sound.control.pressed));
  $('sound-toggle').dataset.state = sound.state;
  $('sound-label').textContent = sound.control.label;
  if (sound.state === 'playing') audioError = false;
  idle();
}

function reportError(error) {
  console.error('Undertone audio:', error);
  audioError = true;
  $('sound-toggle').disabled = false;
  $('sound-toggle').setAttribute('aria-pressed', 'false');
  $('sound-label').textContent = 'Retry sound';
  idle();
  $('transport-hint').textContent = 'Click Retry sound. Reading still works.';
}

function displayNotes(notes, direction, mode, foreground = false) {
  $('transport-direction').textContent = mode === 'loop' ? '↻' : direction === 'forward' ? '↓' : '↑';
  $('transport-status').textContent = foreground ? direction === 'backward' ? 'Playing the lead back' : 'Playing the lead' : mode === 'loop' ? 'Looping this passage' : direction === 'backward' ? 'Reading back' : mode === 'skim' ? 'Moving with you' : mode === 'slow' ? 'Taking it slowly' : 'Following your pace';
  $('transport-hint').textContent = mode === 'loop' ? 'Scroll to play the lead' : activeStory.playback?.mode === 'groove' ? 'Your scroll plays the lead · the groove stays steady' : `${activeStory.feeling} / ${activeStory.scale}`;
  const pitchClasses = notes.map(pitchClassOf);
  document.querySelectorAll('[data-pitch-class]').forEach(dot => dot.classList.toggle('active', pitchClasses.includes(Number(dot.dataset.pitchClass))));
  clearTimeout(activeNotesTimer);
  activeNotesTimer = setTimeout(() => document.querySelectorAll('[data-pitch-class]').forEach(dot => dot.classList.remove('active')), mode === 'slow' ? 1000 : 750);
}

function ornament(index) {
  const path = index === 0 ? 'M0 35 Q70 0 140 35 T280 35 T420 35 T560 35' : index === 1 ? 'M0 35 Q35 5 70 35 T140 35 T210 35 T280 35 T350 35 T420 35 T490 35 T560 35' : 'M0 35 Q140 -5 280 35 T560 35';
  return `<div class="chapter-ornament" aria-hidden="true"><svg viewBox="0 0 560 70" preserveAspectRatio="none"><path d="${path}"/><path d="M0 48H560" opacity=".2"/></svg></div>`;
}

async function loadStory(id, { navigate = false } = {}) {
  id = Object.hasOwn(stories, id) ? id : 'space';
  const story = stories[id] ?? stories.space;
  const epoch = ++routeEpoch;
  activeStory = story;
  ignoreScroll = true;
  instrument?.silence();
  instrument?.setScore([], 0);
  if (navigate) history.pushState({ story: id }, '', `?story=${id}`);
  document.body.dataset.story = id;
  const words = readingWordCount(story);
  document.body.dataset.readingLength = words < 150 ? 'short' : words > 800 ? 'long' : 'medium';
  document.title = `${story.titleText} — Undertone`;
  $('story-number').textContent = story.number;
  $('story-category').textContent = story.category;
  $('story-title').innerHTML = story.title;
  $('story-intro').textContent = story.intro;
  $('listening-guide').textContent = story.playback?.mode === 'groove'
    ? 'Sound starts automatically when your browser allows it. Otherwise, click or tap the page, press a key, or choose Enable sound. The groove keeps playing while you read; scrolling plays its lead. Pause sound to stop everything.'
    : 'Sound starts automatically when your browser allows it. Otherwise, click or tap the page, press a key, or choose Enable sound. Scroll faster to pick up the pace, and stop scrolling to hold the harmony.';
  $('adaptation-note').textContent = `${story.fictional ? 'Fictional scenario. Events and figures are invented.' : 'A short reading adapted from the linked article.'}\nOriginal music composed for this experience.`;
  $('source-name').textContent = story.publisher;
  $('source-date').textContent = story.date;
  $('reading-length').textContent = `${words.toLocaleString()} words · ~${Math.max(1, Math.ceil(words / 220))} min`;
  if (story.isoDate) $('source-date').dateTime = story.isoDate;
  else $('source-date').removeAttribute('datetime');
  $('story-image').src = story.image;
  $('story-image').alt = story.imageAlt;
  $('image-tag').textContent = story.imageTag;
  $('image-credit').textContent = story.imageCredit;
  $('score-feeling').textContent = story.feeling;
  $('score-text').textContent = story.scoreText;
  $('score-scale').textContent = story.scale;
  $('score-texture').textContent = story.texture;
  $('score-theory').textContent = story.theory;
  $('synth-technique').textContent = story.technique ?? 'Pure-wave oscillators';
  $('synth-method').textContent = story.method ?? 'An oscillator creates a repeating wave. The note sets its pitch; the waveform and envelope give it a smooth, rounded or plucked character.';
  $('learn-links').replaceChildren(...(story.learn ?? []).map(reference => {
    const link = document.createElement('a');
    link.href = reference.url;
    link.textContent = `${reference.label} ↗`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }));
  $('learn-links').hidden = !story.learn?.length;
  $('score-file').href = story.score;
  $('original-link').hidden = !story.source;
  if (story.source) {
    $('original-link').href = story.source;
    $('original-link').setAttribute('aria-label', `Read the original article: ${story.sourceTitle}`);
  } else {
    $('original-link').removeAttribute('href');
    $('original-link').removeAttribute('aria-label');
  }
  $('related-sources').replaceChildren(...(story.relatedSources ?? []).map(source => {
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.label;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }));
  $('related-sources').hidden = !story.relatedSources?.length;
  $('next-story').href = `?story=${story.next}`;
  $('next-story').dataset.storyLink = story.next;
  $('next-story').innerHTML = `Next: ${story.nextLabel} <span aria-hidden="true">→</span>`;
  $('pitch-palette').innerHTML = story.pitches.map((pitch, i) => `<span data-pitch-class="${story.pitchClasses[i]}">${pitch}</span>`).join('');
  $('reading').innerHTML = story.chapters.map((chapter, i) => `<section class="chapter ${i === 0 ? 'chapter-first' : ''}"><div class="chapter-index">${String(i + 1).padStart(2, '0')} / ${['ENTER','LOOK CLOSER','CARRY IT WITH YOU'][i]}</div><h2>${chapter.title}</h2>${chapter.text.split(/\n\s*\n/u).map(paragraph => `<p>${paragraph.trim()}</p>`).join('')}${ornament(i)}<div class="chapter-note">${chapter.cue}</div></section>`).join('');
  document.querySelectorAll('[data-story-link]').forEach(link => {
    if (link.closest('.story-nav') && link.dataset.storyLink === id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const nav = document.querySelector('.story-nav');
  const selected = nav.querySelector('[aria-current="page"]');
  if (selected && nav.scrollWidth > nav.clientWidth) {
    const item = selected.getBoundingClientRect();
    const bounds = nav.getBoundingClientRect();
    if (item.left < bounds.left) nav.scrollLeft += item.left - bounds.left;
    else if (item.right > bounds.right) nav.scrollLeft += item.right - bounds.right;
  }
  $('score-strip').querySelectorAll('i').forEach(bar => bar.remove());
  for (let i = 0; i < 46; i++) {
    const bar = document.createElement('i');
    bar.style.height = `${8 + Math.round((Math.sin(i * 1.8) + Math.cos(i * 0.71) + 2) * 5.5)}px`;
    $('score-strip').append(bar);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  updateProgress(0);
  idle();
  if (instrument) {
    try {
      if (!scores.has(id)) {
        const response = await fetch(story.score);
        if (!response.ok) throw new Error(`Cannot load score: ${response.status}`);
        const { compileScore } = await import('./music.js');
        scores.set(id, await compileScore(await response.text()));
      }
      if (epoch !== routeEpoch) return;
      instrument.setScore(scores.get(id).events, currentProgress(), story.playback);
    } catch (error) { if (epoch === routeEpoch) reportError(error); }
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (epoch === routeEpoch) {
      instrument?.setPosition(currentProgress());
      ignoreScroll = false;
    }
  }));
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[data-story-link]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  loadStory(link.dataset.storyLink, { navigate: true });
});

window.addEventListener('popstate', () => loadStory(new URLSearchParams(location.search).get('story') ?? 'space'));
window.addEventListener('scroll', () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    const progress = currentProgress();
    updateProgress(progress);
    if (!ignoreScroll && !document.hidden) {
      const travel = Math.max(0.1, (document.documentElement.scrollHeight - window.innerHeight) / window.innerHeight);
      instrument?.move(progress, performance.now(), travel);
    }
  });
}, { passive: true });
window.addEventListener('resize', () => { instrument?.setPosition(currentProgress()); if (!document.hidden) instrument?.holdCurrent(); updateProgress(currentProgress()); });
document.addEventListener('visibilitychange', () => {
  instrument?.silence();
  instrument?.setPosition(currentProgress());
  if (!document.hidden) { instrument?.holdCurrent(); sound?.wake(); }
});
window.addEventListener('pagehide', () => instrument?.mute());

$('volume').addEventListener('input', event => instrument?.setVolume(Number(event.target.value) / 100));
$('sound-toggle').addEventListener('click', () => sound?.toggle());

function wakeSound(event) {
  if (event.isTrusted && !document.hidden && !event.target.closest?.('#sound-toggle')
      && !event.metaKey && !event.ctrlKey && !event.altKey) sound?.wake();
}
document.addEventListener('pointerdown', wakeSound, { passive:true });
document.addEventListener('pointerup', wakeSound, { passive:true });
document.addEventListener('click', wakeSound, { passive:true });
document.addEventListener('touchend', wakeSound, { passive:true });
document.addEventListener('keydown', wakeSound);

await loadStory(new URLSearchParams(location.search).get('story') ?? 'space');
try {
  const { ScrollInstrument } = await import('./music.js');
  instrument = new ScrollInstrument(displayNotes, idle, reportError);
  await loadStory(new URLSearchParams(location.search).get('story') ?? 'space');
  instrument.setVolume(Number($('volume').value) / 100);
  sound = new SoundControl(instrument, { onChange:updateSoundControl, onError:reportError });
  updateSoundControl();
  if (!document.hidden && !audioError) sound.start();
} catch (error) { reportError(error); }

// Space and PageUp/PageDown scroll naturally, so keyboard reading plays the score too.
