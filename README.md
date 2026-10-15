# Parsecs Command

A campaign portal for **Five Parsecs From Home: Tactics**, built for the Steel Lions campaigns. It runs the operational campaign (map, cohesion, zones, orders, story and interactive events), keeps your forces and armory, generates missions and quick battles, keeps a unit library with army lists, walks you through post-battle results, and prints battle cards on US Letter sheets.

The finished portal is **one self-contained HTML file**. Open it in a browser and it works offline. Campaigns save in the browser (IndexedDB, mirrored to localStorage); use **Campaigns → Download backup** (or a backup folder) for a copy you control.

## Using it

- **From GitHub Pages**: open https://campberj.github.io/parsecs-command-portal/ — or save the page to keep a local copy. Packs are at `/packs/<name>.json` on the same site.
- **From a build**: run `node build.mjs`, then open `dist/index.html`. The same file is also written as `dist/parsecs-command-<version>.html` for keeping alongside your campaign files.
- **Data packs** in [`packs/`](packs/). Faction packs import from **Forces → Import**; the rules pack imports from **Rules data → Import rules pack**.

| Pack | What it adds |
| --- | --- |
| `steel-lions-factions-pack.json` | 8 factions, 76 units: Steel Lions Mercenary Company, 78th Sturm Battalion, Cold Harbor, Aayari Covenant, Hongbin Alloy, Ad Servitutem Liberandum, Solarii Auxiliaries, Aeldari Remnant |
| `dustline-pack.json` | 6 DUSTLINE factions, 44 units |
| `separatist-alliance-pack.json` | Separatist Alliance, 35 units (book scale, points set to Legion balance) |
| `rules-pack-from-books.json` | Campaign tables keyed in from the rulebooks. Kept in this private repo only; never published to Pages |

## Project layout

```
src/
  index.html        page shell; build inserts <!-- @styles --> and <!-- @scripts -->
  styles.css        all styles
  js/NN-*.js        the script, split by section (see below)
packs/              faction and rules packs (pcp-bundle JSON)
tests/
  node/             engine suites, run against dist/portal.cjs
  browser/          Playwright suites, run against dist/index.html
  fixtures/         an old 0.2 save and the retired pre-scaled Separatist pack
build.mjs           bundles src into dist/
```

The files in `src/js` are **plain scripts, not ES modules**. `build.mjs` concatenates them in file-name order into one `<script>`, so they share one global scope exactly as the original single file did. Keep the numeric prefixes when adding files:

| Range | Contents |
| --- | --- |
| `01–19` | Domain logic, no DOM: dice and steps, rules data, content, factions, state, operations, events, forces, missions, quick battle, table layout, post-battle, scenes, unit builder |
| `20–29` | UI plumbing: storage, backups, render loop |
| `30–49` | Views: map, forces, battle pack, armory, missions, army lists, library, quick battle, post-battle, events, mods, story, rules, campaigns |
| `50–59` | Modals and the action/submit/change handlers |
| `60` | Boot |
| `99` | `module.exports` for the Node tests (ignored in the browser) |

The version shown in the app, backups and exports comes from `package.json`; source files use the `__VERSION__` token.

## Development

Needs Node 18+ (no npm dependencies). Browser tests need Python 3 with Playwright.

```bash
npm run build            # dist/index.html, dist/portal.cjs, dist/packs/
npm test                 # build + Node engine suites
npm run test:browser     # build + Playwright suites (screenshots/PDFs in tests/browser/out/)
```

First-time browser test setup:

```bash
pip install playwright
python -m playwright install chromium
```

`N=300 npm test` runs the long campaign simulation (default 120 campaigns).

## Releases and Pages

Every push and pull request runs both test sets in GitHub Actions. Pushes to `main` also publish `dist/` to GitHub Pages using `node build.mjs --public`, which leaves out the book-keyed rules pack.

To release a new version: bump `version` in `package.json`, add a `CHANGELOG.md` entry, and push.
