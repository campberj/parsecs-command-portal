// Every faction pack: imports cleanly, references resolve, book-scale distances, no legality errors.
const P = require('../../dist/portal.cjs'); const fs = require('fs'); const path = require('path');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const dir = path.join(__dirname, '../../packs');
const packs = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('from-books'));
P.setRules(P.defaultRules()); P.newState(P.defaultSetup('PACKS'));
for (const f of packs){
  const pack = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  ok(pack.kind === 'pcp-bundle', `${f}: bundle`);
  const wids = new Set(pack.weapons.map(w => w.id));
  for (const t of pack.templates) for (const id of [...t.weapons, ...t.teamWeapons, ...t.leaderWeapons]) ok(wids.has(id), `${f}: ${t.name} weapon ${id}`);
  P.applyImport(P.planImport(JSON.parse(JSON.stringify(pack))), false);
  for (const fac of pack.factions) ok(!/(Independent Action|\bIA\b)\s+OFF/i.test(fac.notes || ''), `${f}: ${fac.name} is book scale (no pre-scaled note)`);
  for (const t of pack.templates.filter(t => ['squad', 'team'].includes(t.troop))) ok(t.profile.sp <= 9, `${f}: ${t.name} squad speed ${t.profile.sp} looks pre-scaled`);
}
const S = P.getS(); const tp = id => P.tplPoints(S.armory.templates.find(t => t.id === id));
// DUSTLINE at book scale: assault rifle 24", Dash +2"
const dl = JSON.parse(fs.readFileSync(path.join(dir, 'dustline-pack.json'), 'utf8'));
ok(dl.weapons.find(w => w.id === 'w-dl-ar').range === 24, 'DUSTLINE assault rifle 24"');
ok(dl.factions[0].rules.some(r => r.name === 'Distances' && /Dash = Speed \+ 2"/.test(r.text)), 'DUSTLINE Dash +2"');
// Hongbin Errata E-1 priced by the Army Builder as Human Military
ok(tp('t-hb-bpre-grenadiers').v === 74 && tp('t-hb-bpre-pkm').v === 34, `Hongbin E-1 points ${tp('t-hb-bpre-grenadiers').v}/${tp('t-hb-bpre-pkm').v}`);
console.log(`${packs.length} packs checked`); console.log(fails ? fails + ' FAILS' : 'ALL OK');
process.exitCode = fails ? 1 : 0;
