// BLKOUT pack: import, references, Army Builder legality, points, missions, quick battles and campaigns for each bloc.
const P = require('../../dist/portal.cjs'); const fs = require('fs'); const path = require('path');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const settle = () => { let g = 0; while (P.getS().pendingDice && g++ < 60){ const p = P.getS().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); } };
const pack = JSON.parse(fs.readFileSync(path.join(__dirname, '../../packs/blkout-pack.json'), 'utf8'));
const BLOCS = ['f-blk-authority', 'f-blk-manticor', 'f-blk-boone'];

/* 1. pack shape */
ok(pack.kind === 'pcp-bundle', 'bundle kind');
ok(BLOCS.every(id => pack.factions.some(f => f.id === id)), 'three alignment blocs');
const wids = new Set(pack.weapons.map(w => w.id)), tids = new Set(pack.templates.map(t => t.id));
ok(wids.size === pack.weapons.length && tids.size === pack.templates.length, 'unique ids');
for (const t of pack.templates){
  for (const id of [...t.weapons, ...t.teamWeapons, ...t.leaderWeapons]) ok(wids.has(id), `${t.name}: weapon ${id}`);
  ok(BLOCS.includes(t.faction), `${t.name}: faction`);
  ok(t.profile.kp >= 1 && t.profile.sp > 0, `${t.name}: profile`);
}
for (const f of pack.factions) for (const [slot, id] of Object.entries(f.slots)) if (id){
  const t = pack.templates.find(x => x.id === id); ok(t && t.faction === f.id, `${f.name} slot ${slot} -> ${id}`);
}
for (const id of BLOCS){
  const names = pack.templates.filter(t => t.faction === id).map(t => t.name);
  ok(['Assault Handler', 'Covert Handler', 'Siege Handler'].every(n => names.includes(n)), `${id}: generic Handlers`);
  ok(['Caber', 'Topor', 'Mattis', 'Aveles'].every(n => names.includes('Duster — ' + n)), `${id}: four Dusters`);
}
// locked conversion spot checks (card -> profile)
const byName = n => pack.templates.find(t => t.name === n);
const pr = n => byName(n).profile;
ok(pr('UTG Assaulters').cs === 3 && pr('UTG Assaulters').re === 3 && pr('UTG Assaulters').save === '4+', 'Skill 5 / Armor 1/5 -> Combat +3, Reaction 3, save 4+');
ok(pr('Harlow Assault Team').cs === 2 && pr('Harlow Assault Team').t === 4 && pr('Harlow Assault Team').save === '5+', 'Skill 6 / Armor 1/6 -> Combat +2, Toughness 4, 5+');
ok(pr('UN Reserve Fireteam').cs === 1 && pr('UN Reserve Fireteam').t === 3, 'Skill 7 -> Combat +1, Toughness 3');
ok(pr('UTG Mothers (2 cards)').tr === 3 && pr('UTG Mothers (2 cards)').kp === 2, 'Skill 4 epic, Armor 2/5 -> KP 2');
ok(pr('Manticor Bratva Team').save === '3+', 'Armor 1/4 -> 3+');
ok(pr('Harlow Crikets (2 cards)').save === '—', 'Armor 1/8 -> no save');
ok(pr('Assault Handler').kp === 3, 'Handler: 2 armor dice + Damage Track -> KP 3');
ok(pack.templates.filter(t => /^Duster/.test(t.name)).every(t => t.profile.kp === 6 && t.profile.t === 6 && t.rules.includes('Mobility 3')), 'Dusters: KP 6 Chassis + Mobility 3');
ok(pr('Duster — Caber').sp === 12 && pr('Duster — Topor').sp === 8 && pr('Duster — Aveles').sp === 10, 'Duster speeds from cards');

/* 2. import into a campaign; legality; points */
P.setRules(P.defaultRules()); P.newState(P.defaultSetup('BLK1')); settle();
const plan = P.planImport(JSON.parse(JSON.stringify(pack)));
ok(plan.every(i => i.status === 'new'), 'all new on first import');
P.applyImport(plan, false); let S = P.getS();
ok(BLOCS.every(id => S.armory.factions.some(f => f.id === id)), 'factions imported');
for (const t of S.armory.templates.filter(t => BLOCS.includes(t.faction))){
  const errs = P.legality(t).filter(i => i.lvl === 'err'); ok(!errs.length, `legal ${t.name}: ${errs.map(e => e.msg).join('; ')}`);
  const v = P.tplPoints(t).v; ok(v > 0 && v < 200, `points ${t.name}: ${v}`);
  ok(t.pointsMode === 'auto' || t.troop === 'vehicle', `${t.name}: only vehicles are hand-priced`);
}
// re-import is a no-op
ok(P.planImport(JSON.parse(JSON.stringify(pack))).every(i => i.status === 'same'), 're-import unchanged');

/* 3. each bloc as the campaign opponent: every rolled slot maps to a BLKOUT unit (BLKOUT has no transports) */
for (const id of BLOCS){
  S = P.getS(); S.setup.opponent = id; const unmapped = new Set(), seen = new Set();
  for (let i = 0; i < 150; i++){
    P.runStep('mission', [{ tier:String(1 + i % 3) }]); settle();
    for (const u of P.getS().missions[0].enemy.list || []){ if (!u.mapped && u.slot !== 'transport') unmapped.add(u.slot); else if (u.mapped) seen.add(u.label); }
  }
  ok(!unmapped.size, `${id}: unmapped slots ${[...unmapped].join(', ')}`);
  ok(seen.size >= 3, `${id}: variety (${seen.size} unit types)`);
}

/* 4. quick battles between the blocs and against a Steel Lions faction */
const pts = u => P.tplPoints(P.getS().armory.templates.find(t => t.id === u.tpl)).v;
for (const pf of [...BLOCS, 'f-78']) for (const ef of BLOCS) if (pf !== ef) for (let tier = 0; tier < 5; tier++){
  let q; try { q = P.quickBattle({ tier, player:pf, opponent:ef, seed:`${pf}-${ef}-${tier}` }); } catch (e){ ok(false, `${pf} v ${ef} t${tier}: ${e.message}`); continue; }
  ok(q.units.length > 0 && q.eunits.length > 0 && q.eunits.every(e => e.unit), `quick battle ${pf} v ${ef} t${tier}`);
  ok(q.units.every(u => P.getS().armory.templates.find(t => t.id === u.tpl)), 'player units resolve');
  if (tier <= 1) ok(!q.eunits.some(e => P.getS().armory.templates.find(t => t.id === e.unit.tpl).troop === 'vehicle'), `no vehicles at tier ${tier}`);
}
const q = P.quickBattle({ tier:3, player:'f-blk-boone', opponent:'f-blk-authority', seed:'SHOW' }); P.getS().quick = q;
console.log(`${q.player.name} vs ${q.opp.name}: ${q.units.map(u => u.name).join(', ')} | vs ${q.eunits.map(e => e.unit.name).join(', ')}`);
const cards = P.quickCards(q, '35'); ok(cards.length >= q.units.length + 1, 'cards render');
const refs = cards.filter(c => /Rules in force/.test(c)), ref = refs.join('');
ok(/Control Points/.test(ref) && /Task Force Boone — force rule/.test(ref) && /Harlow — force rule/.test(ref), 'reference cards carry both blocs\' rules');
ok((ref.match(/Control Points:/g) || []).length === 1 && /Task Force Boone \/ The Authority \(BLKOUT\) — Control Points/.test(ref), 'shared rules print once, naming both blocs');
ok(refs.length >= 2 && refs.every(c => c.replace(/<[^>]+>/g, '').length < 1900), `long reference split over ${refs.length} cards`);

/* 5. campaigns: play as Boone against the Authority, and as Manticor against the 78th */
for (const [player, opponent] of [['f-blk-boone', 'f-blk-authority'], ['f-blk-manticor', 'f-78']]){
  const out = P.startCampaign({ ...P.defaultSetup('BLK-' + player), name:'BLKOUT ' + player, player, opponent, scale:'platoon' }, true); settle();
  S = P.getS();
  ok(S.setup.player === player && S.roster.units.length >= 3, `${player}: starter force (${S.roster.units.length} units)`);
  ok(S.roster.units.every(u => S.armory.templates.find(t => t.id === u.tpl).faction === player), `${player}: roster from own faction`);
  for (let t = 0; t < 3; t++){ P.runTurn(); settle(); S.inbox.forEach(e => e.resolved = true); }
  ok(!S.pendingDice, `${player}: turns run`);
  if (out && out.notes) console.log(player, '→', S.roster.units.map(u => u.name).join(', '));
}

console.log(fails ? fails + ' FAILS' : 'ALL OK');
process.exitCode = fails ? 1 : 0;
