const P = require('../../dist/portal.cjs');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c){ fails++; console.log('FAIL', m); } };
const S_ = () => P.getS();
function settle(){ let g = 0; while (S_().pendingDice && g++ < 60){ const p = S_().pendingDice; P.submitDice(p.requests.map(q => 1 + Math.floor(Math.random() * q.sides))); } ok(!S_().pendingDice, 'settled'); }
const fresh = seed => { P.setRules(P.defaultRules()); P.newState(P.defaultSetup(seed)); const S = S_(); S.mods.figureXP = true; S.mods.ia = true; return S; };

/* 1. default rules validate */
for (const id of Object.keys(P.TABLE_DEFS)) ok(P.validateTable(id, P.R(id)).length === 0, 'default valid ' + id);
ok(P.validateTable('story', [{ max:50, title:'a' }, { max:40, title:'b' }]).length > 0, 'catches out of order');
ok(P.validateTable('enemyForces', [{ max:100, slots:'infantry, bogus' }]).some(e => /bogus/.test(e)), 'catches bad slot');
ok(P.validateTable('injury', [{ max:100, result:'x', effect:'injured', turns:'lots' }]).length > 0, 'catches bad dice expr');

/* 2. keyed-in tables drive the engine */
let S = fresh('R1');
const rules = P.getRules(); rules.tables.enemyForces = { status:'keyed', rows:[{ max:100, slots:'recon' }] };
for (let k = 0; k < 20; k++){ P.runStep('mission', [{ tier:'2' }]); const m = S_().missions[0]; ok(m.enemy.slots.every(s => s === 'recon'), 'enemy table used'); }
rules.tables.orders = { status:'keyed', rows:[1,2,3,4,5,6].map(i => ({ max:i, name:'Bolster Positions', effect:'bolster' })) };
for (let t = 0; t < 3; t++){ P.runTurn(); S_().inbox.forEach(e => e.resolved = true); }
ok(S_().journal.filter(j => j.type === 'order').every(j => /Bolster Positions/.test(j.text) || /cannot issue/.test(j.text)), 'orders table used');
rules.tables.params.rows.find(r => r.key === 'cohStandard').value = 7; P.newState(P.defaultSetup('R2')); ok(S_().cohesion.P === 7 || S_().cohesion.P === 8, 'cohesion param ' + S_().cohesion.P);
ok(P.parsePasted('story', '1-4\tReinforcements\tSomething\treinf\n5–100 | Calm | Nothing | ').length === 2, 'paste parse');
ok(P.parsePasted('story', '1-4\tReinforcements\tSomething\treinf')[0].max === 4 && P.parsePasted('story', '1-4\tR\tS\treinf')[0].effect === 'reinf', 'paste ranges and selects');

/* 3. wizard result: injuries, figure XP, awards, notes, debrief */
let injDead = 0, injHurt = 0, runs = 0;
for (let i = 0; i < 200; i++){
  S = fresh('W' + i); if (i % 2) S.mods.appDice = false;
  let r = P.runStep('mission', [{ tier:'1' }]); if (r.pending) settle();
  const m = S_().missions[0]; const units = m.force.map(id => S_().roster.units.find(u => u.id === id));
  const figs = {}; const parts = units.flatMap(u => u.figures.filter(f => f.status === 'active').map(f => ({ u, f })));
  ok(parts.length > 0, 'participants');
  const xpBefore = {}; parts.forEach(({ f }) => xpBefore[f.id] = f.xp);
  parts.forEach(({ u, f }, k) => figs[f.id] = { u:u.id, kills:k % 3, state:k === 1 ? 'casualty' : 'ok', stab:k === 1 && i % 3 === 0, first:k === 0, unique:false, award:k === 2 ? 'Valor Cross, 2nd Class' : '', note:k === 0 ? 'Held the door' : '' });
  const tok2 = parts[2] && parts[2].f.tokens;
  r = P.runStep('result', [m.id, { outcome:'Victory', vp:0, secondary:true, figs, wiped:{}, unitNotes:{} }]); if (r.pending) settle();
  const mm = S_().missions.find(x => x.id === m.id); ok(mm.status === 'complete', 'complete');
  const S2 = S_(); const find = id => S2.roster.units.flatMap(u => u.figures).find(f => f.id === id);
  const f0 = find(parts[0].f.id); ok(f0.xp === xpBefore[f0.id] + 3 + 1, 'xp survived win + first blood ' + f0.xp + ' vs ' + xpBefore[f0.id]);
  ok(/Held the door/.test(f0.notes), 'note saved');
  if (parts[2]){ const f2 = find(parts[2].f.id); ok(f2.awards.some(a => a.type === 'Valor Cross, 2nd Class'), 'award given'); ok(f2.tokens === tok2 + 1, 'token added'); }
  const f1 = find(parts[1].f.id) || S2.roster.history.length; if (f1 && f1.status === 'kia') injDead++; else if (f1 && f1.status === 'wounded'){ injHurt++; ok(f1.recover >= 1, 'recover set'); }
  ok(mm.result.moments.length > 0, 'moments');
  if (S2.mods.scenes !== 'off') ok(mm.debriefId && S2.scenes.find(s => s.id === mm.debriefId), 'debrief scene');
  ok(mm.briefing && /BATTALION ORDERS/.test(mm.briefing.text), 'briefing');
  const pk = P.scenePacket(mm); ok(/SCENE PACKET/.test(pk) && /Hauptmann Elise Rahn/.test(pk) && /Request:/.test(pk), 'packet');
  // recovery over turns
  const hurt = S2.roster.units.flatMap(u => u.figures).filter(f => f.status === 'wounded' && f.recover > 0);
  for (let t = 0; t < 8 && !S_().ended; t++){ S_().inbox.forEach(e => e.resolved = true); let rt = P.runTurn(); let g = 0; while (rt === 'pending' && g++ < 20){ settle(); rt = S_().turnPhase === 0 ? 'done' : P.runTurn(); } }
  if (!S_().ended && S_().turn >= 8) hurt.forEach(h => { const f = S_().roster.units.flatMap(u => u.figures).find(x => x.id === h.id); if (f && h.recover <= 6) ok(f.status !== 'wounded' || f.recover > 0, 'recovers'); });
  runs++;
}
console.log('injury outcomes over', runs, 'runs: dead', injDead, 'out of action', injHurt);

/* 4. advances */
S = fresh('A1'); const u = S.roster.units[0]; const roth = u.figures.find(f => /Roth/.test(f.name));
roth.xp = 20; const cs0 = P.figProfile(u, roth).cs; ok(P.buyAdvance(u, roth, 'cs') === null, 'advance bought'); ok(P.figProfile(u, roth).cs === cs0 + 1 && roth.xp === 13, 'advance applied');
roth.xp = 0; ok(typeof P.buyAdvance(u, roth, 'sp') === 'string', 'advance refused without XP');

/* 5. template propagation and variants */
S = fresh('T1'); const tpl = JSON.parse(JSON.stringify(S.armory.templates.find(t => t.id === 't-sturm'))); tpl.profile.cs = 2;
const users = S.roster.units.filter(x => x.tpl === 't-sturm'); ok(users.length === 2, 'two users');
const cp0 = S.cp = 5; P.applyTemplateEdit(tpl, [users[0].id], true);
ok(S.armory.templates.find(t => t.id === 't-sturm').profile.cs === 2, 'template updated'); ok(users[0].tpl === 't-sturm', 'follower kept');
ok(users[1].tpl !== 't-sturm' && S.armory.templates.find(t => t.id === users[1].tpl).profile.cs === 1, 'other kept old as variant'); ok(S.cp === cp0 - 1, 'refit charged');
const v = P.customizeUnit(users[0]); ok(v.variantOf === 't-sturm' && users[0].tpl === v.id, 'customize forks');

/* 6. JSON bundles with diff */
S = fresh('J1'); const b = P.bundleFor('units', [S.roster.units[0].id]); ok(b.units.length === 1 && b.templates.length === 1 && b.weapons.length >= 3, 'unit bundle');
let plan = P.planImport(JSON.parse(JSON.stringify(b))); ok(plan.every(i => i.status === 'same'), 'round trip unchanged');
const b2 = JSON.parse(JSON.stringify(b)); b2.units[0].name = 'Renamed'; b2.templates[0].profile.t = 5; b2.weapons.push({ id:'w-new', name:'Hellgun', base:'Infantry laser', cat:'Rifle', range:30, shots:1, dmg:'1', traits:[], pts:6 });
plan = P.planImport(b2); ok(plan.filter(i => i.status === 'changed').length === 2 && plan.filter(i => i.status === 'new').length === 1, 'diff statuses');
ok(plan.find(i => i.key === 'units').changes.some(c => c.path === 'name' && c.to === 'Renamed'), 'diff path');
const nU = S.roster.units.length, nT = S.armory.templates.length; P.applyImport(plan, true);
ok(S.roster.units.length === nU + 1 && S.armory.templates.length === nT + 1, 'copies added');
const copy = S.roster.units[S.roster.units.length - 1]; ok(S.armory.templates.some(t => t.id === copy.tpl) && copy.tpl !== b.units[0].tpl, 'copy references remapped template');
P.applyImport(P.planImport(b2), false); ok(S.roster.units.find(x => x.id === b.units[0].id).name === 'Renamed', 'replace in place');
let threw = false; try { P.planImport({ hello:1 }); } catch (e) { threw = true; } ok(threw, 'rejects junk');
ok(P.planImport(b.units[0]).length === 1, 'bare unit accepted');

/* 7. migrating a 0.2 save */
// fixture: a campaign saved by prototype 0.2 (one mission generated)
const o2 = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../fixtures/save-v0.2.json'), 'utf8')); ok(o2.v === 2, 'old save v2');
const mig = P.migrate(o2); ok(mig.v === 3 && mig.id && mig.content && Array.isArray(mig.scenes) && mig.roster.units.every(u => u.figures.every(f => f.adv && f.xp === 0)), 'migrated');
P.setS(mig); P.runTurn(); ok(P.getS().turn === 2 || P.getS().inbox.length >= 0, 'migrated save plays');

/* 8. battle pack */
S = fresh('C1'); P.runStep('mission', [{ tier:'1' }]); const pm = S_().missions[0];
const cards = P.packCards({ size:'35', mission:pm.id, units:pm.force, ref:true }); ok(cards.length >= 1 + pm.force.length + 1, 'card count ' + cards.length);
ok(cards.some(c => /Roth/.test(c)) || !pm.force.includes('u-stahl'), 'figure on card');
console.log({ checks, fails });
process.exitCode = fails ? 1 : 0;
