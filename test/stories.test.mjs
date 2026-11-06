import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { stories, readingWordCount } from '../stories.js';

test('every reading has clear provenance, three chapters, and available local artwork and score', async () => {
  const numbers = new Set();
  for (const story of Object.values(stories)) {
    assert.ok(story.publisher && story.date);
    if (story.fictional) {
      assert.equal(story.source, undefined, 'fiction does not inherit an article link');
      assert.equal(story.isoDate, undefined, 'fiction has no purported reporting date');
      assert.match(story.category, /FICTION/);
      assert.match(story.publisher, /Fiction/);
      assert.match(story.titleText, /^Fiction:/);
    } else {
      assert.equal(new URL(story.source).protocol, 'https:');
      assert.ok(story.sourceTitle);
    }
    if (story.isoDate) assert.ok(Number.isFinite(Date.parse(story.isoDate)));
    for (const source of story.relatedSources ?? []) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(source.label);
    }
    assert.equal(story.chapters.length, 3);
    assert.ok(story.chapters.every(chapter => chapter.title && chapter.text && chapter.cue));
    assert.ok(!numbers.has(story.number), 'navigation numbers are unique');
    numbers.add(story.number);
    await access(new URL(`../${story.image}`, import.meta.url));
    await access(new URL(`../${story.score}`, import.meta.url));
  }
});

test('the five Learn studies span microfiction to a long, readable narrative', () => {
  const ids = ['laundromat', 'chess', 'bakery', 'porcelain', 'library'];
  const lengths = ids.map(id => readingWordCount(stories[id]));
  assert.ok(lengths[0] <= 90 && lengths[1] <= 160);
  assert.ok(lengths[2] >= 250 && lengths[3] >= 500 && lengths[4] >= 1200);
  assert.ok(Math.max(...lengths) / Math.min(...lengths) > 15);
  assert.ok(new Set(lengths).size === ids.length);
  for (const id of ids) {
    assert.equal(stories[id].fictional, true);
    assert.ok(stories[id].learn.length > 0);
    for (const reference of stories[id].learn) assert.equal(new URL(reference.url).hostname, 'strudel.cc');
  }
  assert.ok(stories.library.chapters.every(chapter => chapter.text.split(/\n\s*\n/u).length > 3), 'the long reading has paragraph breaks');
});

test('next-story navigation visits every reading exactly once before returning home', () => {
  const seen = new Set();
  let id = 'space';
  do {
    assert.ok(Object.hasOwn(stories, id), `route ${id} exists`);
    assert.ok(!seen.has(id), 'no early navigation loop');
    seen.add(id);
    id = stories[id].next;
  } while (id !== 'space');
  assert.equal(seen.size, Object.keys(stories).length);
});
