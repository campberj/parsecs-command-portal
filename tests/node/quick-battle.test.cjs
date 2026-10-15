const P = require('../../dist/portal.cjs'); const fs = require('fs');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const settle = () => { let g = 0; while (P.getS().pendingDice && g++ < 60){ const p = P.getS().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); } };
P.setRules(P.defaultRules()); P.newState(P.defaultSetup('Q1')); settle();
const add = f => P.applyImport(P.planImport(JSON.parse(fs.readFileSync(f,'utf8'))), false);
add(require('path').join(__dirname, '../../packs/separatist-alliance-pack.json')); add(require('path').join(__dirname, '../../packs/steel-lions-factions-pack.json'));
let S = P.getS(); S.mods.appDice = false; // manual dice campaign: quick battles must not prompt
const rng0 = S.rngState, opp0 = S.setup.opponent, missions0 = S.missions.length, journal0 = S.journal.length;
const facs = S.armory.factions.filter(f => S.armory.templates.some(t => t.faction === f.id)).map(f => f.id);
console.log('factions with templates:', facs.length);
const pts = u => P.tplPoints(S.armory.templates.find(t => t.id === u.tpl)).v;
const DEF = [75, 150, 250, 400, 650]; let n = 0; const ratio = [];
for (const pf of facs) for (const ef of facs) if (pf !== ef) for (let tier = 0; tier < 5; tier++){
  let q; try { q = P.quickBattle({ tier, player:pf, opponent:ef, seed:`${pf}-${ef}-${tier}` }); } catch (e){ ok(false, `${pf} v ${ef} t${tier}: ${e.message}`); continue; }
  n++;
  const mine = q.units.reduce((a, u) => a + pts(u), 0), theirs = q.eunits.reduce((a, e) => a + e.pts, 0);
  ok(q.units.length > 0 && q.eunits.length > 0, `forces ${pf} v ${ef} t${tier}`);
  ok(mine <= DEF[tier] * 1.1 || q.units.length === 1, `player over budget ${pf} t${tier}: ${mine}`);
  ok(theirs <= DEF[tier] * 1.15 || q.eunits.length === 1, `enemy over budget ${ef} t${tier}: ${theirs}`);
  ratio.push(theirs / Math.max(1, mine));
  if (tier <= 1) ok(!q.units.concat(q.eunits.map(e => e.unit).filter(Boolean)).some(u => S.armory.templates.find(t => t.id === u.tpl).troop === 'vehicle'), `no vehicles at tier ${tier} ${pf} v ${ef}`);
  ok(q.objectives.length > 0 && q.layout && q.layout.terrain, 'objectives and layout'); ok(q.eunits.every(e => e.unit), 'all enemy units have models ' + ef + ' t' + tier + ' ' + q.eunits.filter(e => !e.unit).map(e => e.slot).join());
}
console.log('battles generated:', n, '| enemy/player points ratio: median', ratio.sort((a,b)=>a-b)[Math.floor(ratio.length/2)].toFixed(2), 'p10', ratio[Math.floor(ratio.length*0.1)].toFixed(2), 'p90', ratio[Math.floor(ratio.length*0.9)].toFixed(2));
ok(S.rngState === rng0 && S.setup.opponent === opp0 && S.mods.appDice === false && !S.pendingDice, 'campaign untouched');
ok(S.missions.length === missions0 && S.journal.length === journal0, 'no missions or journal entries');
// determinism and randoms
const a = P.quickBattle({ tier:1, seed:'SAME' }), b = P.quickBattle({ tier:1, seed:'SAME' });
ok(a.player.faction === b.player.faction && a.opp.faction === b.opp.faction && a.units.map(u => u.tpl).join() === b.units.map(u => u.tpl).join() && JSON.stringify(a.objectives) === JSON.stringify(b.objectives), 'same seed same battle');
ok(a.player.faction !== a.opp.faction, 'random factions differ');
// sample output
S.quick = P.quickBattle({ tier:3, player:'f-cis', opponent:'f-78', seed:'SHOW' });
const q = S.quick; console.log(`\n${q.player.name} vs ${q.opp.name} — ${q.tierName}, ${q.scenario}, ${q.points} pts, ${q.theme}`);
q.units.forEach(u => console.log('  P', u.name, pts(u))); q.eunits.forEach(e => console.log('  E', e.unit ? e.unit.name : e.label, e.pts, '|', e.deploy));
console.log('  objectives:', q.objectives.map(o => o.name).join(', '), '| secondary:', q.secondary, '| conditions:', q.conditions.map(c => c[0]).join(', '));
P.qbReroll('terrain'); P.qbReroll('forces'); P.qbReroll('objectives'); P.qbReroll('conditions');
ok(S.rngState === rng0, 'rerolls leave campaign RNG alone');
const html = P.viewQuick(); ok(html.includes('Print battle pack') && html.includes('<svg'), 'view renders');
const cards = P.quickCards(S.quick, '35'); ok(cards.length >= q.units.length + 1, 'cards ' + cards.length); ok(cards.join('').includes('Quick battle'), 'card footer label');
console.log(fails ? fails + ' FAILS' : 'ALL OK');
process.exitCode = fails ? 1 : 0;
