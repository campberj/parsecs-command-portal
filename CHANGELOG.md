# Changelog

## 1.0.7
- **BLKOUT pack** (`packs/blkout-pack.json`): Enemy Spotted Studios' BLKOUT 2nd Ed. forces as three alignment blocs — The Authority (Harlow 1st Reaction Force, UN 3rd Battalion, UN Raid Force Alpha, UN Forces), Manticor Borz Group and Task Force Boone — 50 units including generic and named Handlers and the four Dusters, on the locked Steel Lions conversion schema. Built by `tools/build-blkout-pack.mjs`.
- The rules reference card now prints a rule shared word for word by several factions once, naming them all, and runs onto extra cards when the rules don't fit on one.

## 1.0.6 — repository
- Moved into this repository. The single file is now built from `src/` (`styles.css`, an HTML shell and 36 section scripts); the built `dist/index.html` matches the 1.0.6 file handed out before except for the header comment, so existing saves and backups carry over unchanged.
- Version string now comes from `package.json`.
- Node engine suites and Playwright browser suites run in GitHub Actions; `main` publishes to GitHub Pages.

## 1.0.6
- **Unit library** tab: filter by faction, type, points range and search; full unit view with printed-card preview; add to list.
- **Army lists**: global, any mix of factions, optional points limit, print battle pack, send to Quick battle as either side, export/import JSON, duplicate, delete. Lists are kept in backups.
- Quick battle accepts a saved list for either side; the budget follows the list total.

## 1.0.5
- Battle cards print collated on US Letter: 3×5 cards four to a landscape sheet, 4×6 cards two to a portrait sheet, with dashed cut lines. One-card-per-page mode kept.

## 1.0.4
- **Quick battle** generator: pick a scale (points default by tier), choose or randomize factions and strength, auto-build both forces, roll objectives, conditions and a table layout, print a battle pack.

## 1.0.3
- Any faction can be the player or the opponent; new campaigns auto-build a starter force for the chosen faction, with neutral voices for factions without a content pack.

## 1.0.2 and earlier
- Operational campaign engine, armory and unit builder, missions, post-battle wizard, story and interactive events, rules data tables, mods, multiple campaign slots, backups.
