# Parsecs Command — notes for Claude

- Edit `src/`, never `dist/`. `src/js/*.js` are classic scripts concatenated in name order into one `<script>` (shared global scope). New code goes in the file for its section; a new file needs a numeric prefix that puts it after everything it uses at load time.
- Domain files (01–19) must not touch the DOM; Node tests load them via `dist/portal.cjs`. Export anything a test needs from `src/js/99-node-exports.js`.
- Use `__VERSION__` instead of a literal version. Bump `package.json` and `CHANGELOG.md` for a release.
- Run `npm test` and `npm run test:browser` before committing. Browser suites assert, exit non-zero on failure, and write screenshots to `tests/browser/out/`.
- Content rules from the owner: no occult, demonic or satanic content (Force users are written as duelists with telekinesis only). Unit stats follow the Five Parsecs: Tactics books as guidelines; custom content is welcome.
- Factions and points are data packs in `packs/` (`pcp-bundle`). `rules-pack-from-books.json` holds book-keyed tables and must stay out of public builds (`build.mjs --public`).
- `packs/blkout-pack.json` is generated: edit `tools/build-blkout-pack.mjs` and run `npm run pack:blkout`, never the JSON. It follows the locked BLKOUT conversion (Skill tier table, KP = armor dice +1 for a Damage Track, save from the armor number, Dusters KP 6 + Mobility 3).
