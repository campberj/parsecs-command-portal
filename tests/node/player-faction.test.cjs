const P = require('../../dist/portal.cjs');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const settle = () => { let g = 0; while (P.getS().pendingDice && g++ < 60){ const p = P.getS().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); } };
P.setRules(P.defaultRules()); P.newState(P.defaultSetup('F1')); settle();
let S = P.getS();
ok(S.setup.player === 'f-78' && P.playerFaction().name.includes('78th'), 'default player 78th');
// import CIS
const pack = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../packs/separatist-alliance-pack.json'),'utf8'));
P.applyImport(P.planImport(pack), false);
// same faction, carry → keeps roster
const before = P.getS().roster.units.map(u => u.id).join();
let out = P.startCampaign({ ...P.defaultSetup('F2'), name:'Same' }, true); settle();
ok(P.getS().roster.units.map(u => u.id).join() === before, 'same faction keeps roster');
ok(P.getS().armory.factions.some(f => f.id === 'f-cis'), 'carry keeps imported faction');
// CIS as player vs 78th
out = P.startCampaign({ ...P.defaultSetup('F3'), name:'Droids', player:'f-cis', opponent:'f-78', scale:'platoon' }, true); settle();
S = P.getS();
console.log('CIS platoon:', S.roster.units.map(u => `${u.name} [${u.figures.length}] ${u.figures.slice(0,2).map(f=>f.name).join(', ')}`).join(' | '));
console.log('notes:', out.notes.join(' '));
ok(S.roster.units.length === 5, 'platoon = 3 squads + leader + support');
ok(S.roster.units.every(u => S.armory.templates.find(t => t.id === u.tpl).faction === 'f-cis'), 'all CIS templates');
ok(S.content.briefer === 'v-ops' && /DIRECTIVE/.test(S.content.ordersHeader), 'machine content');
ok(P.playerFaction().id === 'f-cis', 'playerFaction');
for (let i = 0; i < 10; i++){ P.runStep('mission', [{ tier:String(1 + i % 3) }]); settle(); }
const m = S.missions[0]; ok(/78th/.test(m.enemy.faction), 'enemy is the 78th: ' + m.enemy.faction);
const b = P.briefingFor(m); ok(b && /DIRECTIVE/.test(b.text), 'briefing works'); console.log(b.text.split('\n').slice(0,6).join(' / '));
// Hongbin squad scale, carry off: Hongbin is in sample armory
out = P.startCampaign({ ...P.defaultSetup('F4'), name:'HB', player:'f-hb', opponent:'f-asl', scale:'squad' }, false); settle();
S = P.getS(); console.log('HB squad:', S.roster.units.map(u => `${u.name} [${u.figures.length}] ${u.figures[0].name}`).join(' | '));
ok(S.roster.units.length === 2 && /OPERATIONS ORDER — Hongbin/.test(S.content.ordersHeader), 'HB starter + human content');
// carry off but CIS chosen: should be copied in from previous armory? previous armory (HB campaign, sample) lacks CIS → expect missing
out = P.startCampaign({ ...P.defaultSetup('F5'), name:'x', player:'f-78', opponent:'f-hb' }, false); settle();
ok(P.getS().roster.units.some(u => u.id === 'u-stahl') && P.getS().content.briefer === 'v-rahn', '78th fresh gets example roster + 78th voices');
// migrate a save with no player
const old = JSON.parse(JSON.stringify(P.getS())); delete old.setup.player; ok(P.migrate(old).setup.player === 'f-78', 'migrate infers player');
// carry with CIS from a campaign that has it, carry off → copies CIS into sample armory
P.applyImport(P.planImport(pack), false);
out = P.startCampaign({ ...P.defaultSetup('F6'), name:'y', player:'f-cis', opponent:'f-hb', scale:'reinforced' }, false); settle();
S = P.getS(); ok(S.armory.factions.some(f => f.id === 'f-cis') && S.roster.units.length >= 6, 'carry-off copies chosen faction; reinforced ' + S.roster.units.length);
ok(S.mods.ia === true, 'mixed scale keeps IA as set'); console.log('notes:', out.notes.join(' '));
const legal = S.roster.units.every(u => S.armory.templates.find(t => t.id === u.tpl));
ok(legal, 'templates resolve');
console.log(fails ? fails + ' FAILS' : 'ALL OK');
process.exitCode = fails ? 1 : 0;
