const P = require('../../dist/portal.cjs'); const fs = require('fs');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const settle = () => { let g = 0; while (P.getS().pendingDice && g++ < 60){ const p = P.getS().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); } };
P.setRules(P.defaultRules()); P.newState(P.defaultSetup('L1')); settle();
P.applyImport(P.planImport(JSON.parse(fs.readFileSync(require('path').join(__dirname, '../../packs/separatist-alliance-pack.json'),'utf8'))), false);
let S = P.getS(); S.ui.lib = { fac:'f-cis', troop:'squad', min:'', max:'', q:'', sort:'pts' };
let res = P.libResults(); ok(res.length > 0 && res.every(t => t.faction === 'f-cis' && t.troop === 'squad'), 'filter faction+troop'); ok(P.tplPoints(res[0]).v <= P.tplPoints(res[res.length-1]).v, 'sort pts');
S.ui.lib = { q:'droid' }; ok(P.libResults().length > 5, 'search');
S.ui.lib = { min:'100', max:'200' }; ok(P.libResults().every(t => { const p = P.tplPoints(t).v; return p >= 100 && p <= 200; }), 'points range');
S.ui.lib = {};
// lists
const l = P.newList('Droid Strike', 400);
P.listAdd(l, 't-cis-b1', 2); P.listAdd(l, 't-cis-std', 1); P.listAdd(l, 't-sturm', 1); P.listAdd(l, 't-cis-b1', 1);
const tot = P.listTotals(l); console.log('list totals', tot);
ok(l.entries.length === 3 && l.entries[0].count === 3, 'entries merge');
ok(tot.pts === 54 * 3 + 135 + P.tplPoints(S.armory.templates.find(t => t.id === 't-sturm')).v, 'points total');
// quick battle using list as player, auto enemy
let q = P.quickBattle({ tier:3, playerList:l.id, seed:'LQ1' });
ok(q.units.length === 5 && q.player.name === 'Droid Strike', 'player from list ' + q.units.length);
const ePts = q.eunits.reduce((a, e) => a + e.pts, 0); console.log('enemy', q.opp.name, ePts, 'vs list', tot.pts);
ok(q.points === tot.pts, 'budget = list total');
// list as opponent
const l2 = P.newList('Hongbin cell', 0); P.listAdd(l2, 't-hb-rifles', 2); P.listAdd(l2, 't-hb-officer', 1);
q = P.quickBattle({ tier:1, player:'f-78', oppList:l2.id, seed:'LQ2' });
ok(q.eunits.length === 3 && q.eunits.every(e => e.unit), 'opponent from list'); ok(q.opp.name === 'Hongbin cell', 'opp name');
q = P.quickBattle({ tier:2, playerList:l.id, oppList:l2.id, seed:'LQ3' }); ok(q.units.length === 5 && q.eunits.length === 3, 'both lists');
// export/import + portability to a campaign lacking the templates
const exp = JSON.stringify(P.listExport(l));
P.newState(P.defaultSetup('L2')); settle(); S = P.getS();
ok(!S.armory.templates.some(t => t.id === 't-cis-b1'), 'fresh campaign lacks CIS');
P.setLists([]); const n = P.listImport(JSON.parse(exp)); ok(n === 1 && P.getLists()[0].name === 'Droid Strike', 'import');
const added = P.ensureListInArmory(P.getLists()[0]); ok(added === 2 && S.armory.factions.some(f => f.id === 'f-cis'), 'ensure copies templates+faction ' + added);
const units = P.unitsFromList(P.getLists()[0]); ok(units.length === 5 && units.every(u => S.armory.templates.some(t => t.id === u.tpl)), 'units resolve');
const html = P.viewLibrary(); ok(html.includes('Army lists') && html.includes('Droid Strike') && html.includes('Add to list'), 'library renders');
ok(P.unitDetail(S.armory.templates.find(t => t.id === 't-cis-b1')).includes('Printed card preview'), 'detail renders');
let threw = false; try { P.listImport({ junk:1 }); } catch (e){ threw = true; } ok(threw, 'rejects junk');
console.log(fails ? fails + ' FAILS' : 'ALL OK');
process.exitCode = fails ? 1 : 0;
