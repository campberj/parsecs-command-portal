// Bundles the portal into one self-contained HTML file.
//
//   node build.mjs          -> dist/index.html, dist/parsecs-command-<version>.html,
//                              dist/portal.cjs (script only, for the Node tests),
//                              dist/packs/*.json
//   node build.mjs --public -> same, but leaves out packs keyed from the rulebooks
//                              (*-from-books.json), for anything published openly
//
// src/js/*.js are plain scripts, not ES modules: they are concatenated in
// file-name order into a single <script>, so they share one global scope
// exactly as the original single-file portal did. Order matters — keep the
// numeric prefixes (domain logic 01–19, UI plumbing 20–29, views 30–49,
// modals/actions 50–59, boot 60, Node exports 99).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const dist = join(root, 'dist');
const isPublic = process.argv.includes('--public');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const read = p => readFileSync(p, 'utf8');
const jsFiles = readdirSync(join(src, 'js')).filter(f => f.endsWith('.js')).sort();
const js = jsFiles.map(f => read(join(src, 'js', f))).join('').replaceAll('__VERSION__', version);
const css = read(join(src, 'styles.css'));
const shell = read(join(src, 'index.html'));

for (const marker of ['<!-- @styles -->', '<!-- @scripts -->'])
  if (!shell.includes(marker)) throw new Error(`src/index.html is missing ${marker}`);
if (js.includes('</script')) throw new Error('A source file contains "</script", which would end the inline script early.');

const html = shell
  .replace('<!-- @styles -->', () => '<style>\n' + css + '</style>')
  .replace('<!-- @scripts -->', () => '<script>\n' + js + '</script>');

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'packs'), { recursive: true });
writeFileSync(join(dist, 'index.html'), html);
writeFileSync(join(dist, `parsecs-command-${version}.html`), html);
writeFileSync(join(dist, 'portal.cjs'), js);
for (const f of readdirSync(join(root, 'packs')).filter(f => f.endsWith('.json') && !(isPublic && f.includes('from-books'))))
  copyFileSync(join(root, 'packs', f), join(dist, 'packs', f));

console.log(`Parsecs Command ${version}: ${jsFiles.length} script files, ${(html.length / 1024).toFixed(0)} KB -> dist/index.html`);
