const P = require('../../dist/portal.cjs');
const pack = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../packs/separatist-alliance-pack.json'),'utf8'));
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
P.setRules(P.defaultRules()); P.newState(P.defaultSetup('CIS1'));
let S = P.getS(); S.mods.ia = false;
const plan = P.planImport(JSON.parse(JSON.stringify(pack)));
P.applyImport(plan, false); S = P.getS();
ok(S.armory.factions.some(f => f.id === 'f-cis'), 'faction imported');
ok(pack.templates.every(t => S.armory.templates.some(x => x.id === t.id)), 'all templates');
ok(pack.weapons.every(w => S.armory.weapons.some(x => x.id === w.id)), 'all weapons');
// legality
for (const t of S.armory.templates.filter(t => t.faction === 'f-cis')){
  const is = P.legality(t); const errs = is.filter(i => i.lvl === 'err'); const w = is.filter(i => i.lvl === 'wrn');
  if (errs.length || w.length) console.log((errs.length ? 'ERR ' : 'wrn ') + t.name + ': ' + is.map(i => i.msg).join(' | '));
  ok(!errs.length, 'legal ' + t.name);
  ok(P.tplPoints(t) === t.points || (P.tplPoints(t).v ?? P.tplPoints(t)) === t.points, 'points ' + t.name + ' ' + JSON.stringify(P.tplPoints(t)));
  for (const id of [...t.weapons, ...t.teamWeapons, ...t.leaderWeapons]) ok(S.armory.weapons.some(w => w.id === id), 'weapon ref ' + id);
}
// missions vs CIS
S.setup.opponent = 'f-cis';
const seen = new Set();
for (let i = 0; i < 40; i++){
  const r = P.runStep('mission', [{ tier: String(1 + i % 3) }]);
  let g = 0; while (P.getS().pendingDice && g++ < 60){ const p = P.getS().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); }
  const m = P.getS().missions[0];
  (m.enemy.units || []).forEach(u => seen.add(u.name || u.tpl || JSON.stringify(u).slice(0,60)));
  ok(/Separatist/.test(m.enemy.faction), 'enemy faction ' + m.enemy.faction);
}
// every rolled enemy slot maps to a real Separatist unit
const unmapped = new Set();
for (let i = 0; i < 300; i++){
  P.runStep('mission', [{ tier: String(1 + i % 3) }]);
  let g = 0; while (P.getS().pendingDice && g++ < 60){ const p = P.getS().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); }
  for (const u of P.getS().missions[0].enemy.list || []) if (!u.mapped) unmapped.add(u.slot + ' → ' + u.label);
}
ok(!unmapped.size, 'unmapped enemy slots: ' + [...unmapped].join(', '));
console.log(fails ? fails + ' FAILS' : 'ALL OK');
process.exitCode = fails ? 1 : 0;
