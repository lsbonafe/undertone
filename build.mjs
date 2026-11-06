import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const target = join(root, 'dist');
const files = ['index.html', 'style.css', 'main.js', 'sound-control.js', 'stories.js', 'motion.js', 'groove.js', 'music.js', 'reading-sounds.js', 'genre-sounds.js', 'harmony.js', 'comfort.js', 'assets', 'scores', 'docs', 'scripts/make-porcelain.py', 'scripts/make-genre-samples.py', 'scripts/make-doc-diagrams.py', '.nojekyll', 'README.md', 'LICENSE', 'THIRD_PARTY.md'];
await rm(target, { recursive: true, force: true });
await mkdir(target);
for (const file of files) {
  await mkdir(dirname(join(target, file)), { recursive: true });
  await cp(join(root, file), join(target, file), { recursive: true });
}
console.log('GitHub Pages files are ready in dist/ (no runtime server or dependencies).');
