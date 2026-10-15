/* ---------- quick battle: a one-off mission between any two factions ---------- */
const QB_POINTS = [75, 150, 250, 400, 650]; /* default points by tier: fireteam, squad, section, platoon, reinforced */
const QB_STRENGTH = { even:1, outnumbered:1.25, overmatched:1.5 };
const QB_PATTERN = { fireteam:['squad'], squad:['squad','leader','squad'], section:['squad','leader','squad','support','squad'], platoon:['leader','squad','squad','support','squad','support','squad'], reinforced:['leader','squad','squad','support','squad','squad','support','squad','epic','support'] };
const GENERIC_PTS = { infantry:66, recon:60, storm:80, weaponsTeam:45, majorChar:25, epicChar:40, sniper:20, transport:55, armoredCar:60, lightTank:100, tank:140, heavyTank:200 };
function qbFactions(){ return S.armory.factions.filter(f => S.armory.templates.some(t => t.faction === f.id)); }
/* run fn on the quick battle's own dice: app dice, its own seed, and the chosen opponent; the campaign is left exactly as it was */
function withQuick(seed, oppId, fn){
  const keep = { rng:S.rngState, dice:S.mods.appDice, opp:S.setup.opponent };
  S.rngState = hashSeed(String(seed)); S.mods.appDice = true; S.setup.opponent = oppId;
  try { return fn(); } finally { S.rngState = keep.rng; S.mods.appDice = keep.dice; S.setup.opponent = keep.opp; }
}
/* your side: the scale's pattern, filled from the faction's units up to the points */
function qbPlayerPicks(facId, tier, budget){
  const T = TIERS[tier]; const L = factionLists(facId, tier >= 2);
  const lists = { squad:L.squads.length ? L.squads : L.ts.filter(t => t.troop !== 'vehicle'), leader:L.leaders, support:L.support, epic:L.epics.length ? L.epics : L.leaders };
  const pattern = QB_PATTERN[T.key]; const picks = []; let total = 0; const idx = {}; const cap = budget * 1.1;
  for (let pass = 0; pass < 4; pass++){ let added = false;
    for (const role of pattern){ const l = lists[role]; if (!l || !l.length) continue;
      const i = idx[role] || 0; const pref = role === 'squad' ? l[[0, 0, 1, 2][i] != null && [0, 0, 1, 2][i] < l.length ? [0, 0, 1, 2][i] : i % l.length] : l[i % l.length];
      const t = total + tplPoints(pref).v <= cap ? pref : L.byPts(l).find(x => total + tplPoints(x).v <= cap);
      if (t){ picks.push(t); total += tplPoints(t).v; idx[role] = i + 1; added = true; } }
    if (!added || total >= budget * 0.9) break; }
  if (!picks.length && L.ts.length) picks.push(L.byPts(L.ts.filter(t => tier >= 2 || t.troop !== 'vehicle'))[0] || L.byPts(L.ts)[0]);
  return picks;
}
/* the opponent: Random Enemy Forces rolls, each slot mapped to a template, until the points are spent */
function qbSlotTemplate(L, slot){
  const map = L.fac.slots && L.fac.slots[slot] && L.ts.find(t => t.id === L.fac.slots[slot]); if (map) return map;
  const sq = L.byPts(L.ts.filter(t => t.troop === 'squad')), ind = L.ts.filter(t => t.troop === 'individual'), veh = L.byPts(L.ts.filter(t => t.troop === 'vehicle'));
  const has = (t, re) => re.test([t.name, ...(t.rules || [])].join(' '));
  switch (slot){
    case 'infantry': return sq[0];
    case 'storm': return sq[sq.length - 1];
    case 'recon': return sq.find(t => has(t, /recon|scout|infiltrat/i)) || sq[0];
    case 'weaponsTeam': return L.ts.find(t => t.troop === 'team') || null;
    case 'majorChar': return ind.find(t => t.level !== 'epic' && has(t, /\bleader\b/i)) || ind.find(t => t.level !== 'epic') || null;
    case 'epicChar': return ind.find(t => t.level === 'epic') || ind.find(t => has(t, /\bleader\b/i)) || null;
    case 'sniper': return L.ts.find(t => t.troop !== 'vehicle' && (has(t, /snip/i) || (t.weapons || []).concat(t.teamWeapons || []).some(id => /snip/i.test((weaponOf(id) || {}).name || '')))) || null;
    case 'transport': case 'armoredCar': return veh[0] || null;
    case 'lightTank': return veh[Math.floor(veh.length / 2)] || null;
    default: return veh[veh.length - 1] || null;
  }
}
function qbEnemy(facId, tier, target, playerCount, objectives){
  const L = factionLists(facId); const allowVeh = tier >= 2 && !L.fac.noVehicles && L.ts.some(t => t.troop === 'vehicle'); const out = []; let total = 0, cnt = 0, veh = 0, inf = false;
  /* a result the faction has no model for falls back to the nearest thing it does have */
  const FALLBACK = { weaponsTeam:['storm','infantry'], sniper:['majorChar','recon','infantry'], majorChar:['epicChar','infantry'], epicChar:['majorChar','infantry'], recon:['infantry'], storm:['infantry'], infantry:['storm','majorChar'] };
  const tplFor = s => { let t = qbSlotTemplate(L, s); for (const f of FALLBACK[s] || []){ if (t) break; t = qbSlotTemplate(L, f); } return t || L.byPts(L.ts.filter(x => allowVeh || x.troop !== 'vehicle'))[0] || null; };
  for (let k = 1; k <= 40 && total < target * 0.9; k++){
    const res = enemyRoll({ playerCount, enemyCount:cnt, enemyVehicles:veh, enemyHasInfantry:inf, playerVehicles:0, playerHeavy:false, objectives }, D100(`Quick battle enemy roll ${k}`));
    const slots = res.slots.map(s => !allowVeh && VEHICLE_SLOTS.includes(s) ? 'storm' : s);
    const items = slots.map(s => { const t = tplFor(s); return { slot:s, tpl:t || null, pts:t ? tplPoints(t).v : GENERIC_PTS[s] || 50 }; });
    const add = items.reduce((a, x) => a + x.pts, 0);
    if (!items.length || total + add > target * 1.15) continue;
    items.forEach(x => { out.push(x); total += x.pts; if (VEHICLE_SLOTS.includes(x.slot)) veh++; if (['infantry','storm','recon'].includes(x.slot)) inf = true; });
    cnt += res.count;
  }
  if (!out.length){ const t = tplFor('infantry'); out.push({ slot:'infantry', tpl:t || null, pts:t ? tplPoints(t).v : GENERIC_PTS.infantry }); }
  return out;
}
function quickBattle(o){
  const plist = o.playerList ? LISTS.find(l => l.id === o.playerList) : null, olist = o.oppList ? LISTS.find(l => l.id === o.oppList) : null;
  [plist, olist].filter(Boolean).forEach(ensureListInArmory);
  const facs = qbFactions(); if (facs.length < 2 && !(plist && olist)) throw new Error('Quick battles need at least two factions with unit templates.');
  if ((plist && !plist.entries.length) || (olist && !olist.entries.length)) throw new Error('That list is empty. Add units to it in the Unit library first.');
  const seed = (o.seed || '').trim() || ('Q' + Math.floor(Math.random() * 1e6));
  const pickFac = (want, not) => { const ok = facs.filter(f => f.id !== not); return ok.find(f => f.id === want) || null; };
  const fromList = l => { const id = listFaction(l); const f = factionOf(id); return { id, name:l.name, f }; };
  return withQuick(seed, null, () => {
    const pl = plist ? fromList(plist) : null;
    const pf = pl ? (pl.f || { id:pl.id, name:pl.name }) : pickFac(o.player) || pick(facs.filter(f => f.id !== o.opponent && f.id !== (olist ? listFaction(olist) : '')));
    const el = olist ? fromList(olist) : null;
    const ef = el ? (el.f || { id:el.id, name:el.name }) : pickFac(o.opponent, pf.id) || pick(facs.filter(f => f.id !== pf.id));
    S.setup.opponent = ef.id;
    const tier = clamp(parseInt(o.tier, 10) || 0, 0, 4); const T = TIERS[tier];
    const budget = parseInt(o.points, 10) > 0 ? parseInt(o.points, 10) : plist ? listTotals(plist).pts : olist ? listTotals(olist).pts : QB_POINTS[tier];
    const rtype = REGION_TYPES.includes(o.region) ? o.region : pick(REGION_TYPES);
    const stance = pick(['attack','defend']);
    const q = { id:uid('qb'), seed, created:new Date().toISOString(), quick:true, tier, tierName:T.name, scenario:T.scen, table:[...T.table], length:T.len,
      regionName:`${rtype} sector`, regionType:rtype, stance, theme:pick(THEMES[rtype][stance]), poi:pick(POI[rtype]),
      player:{ faction:pf.id, name:pl ? pl.name : pf.name, list:plist ? plist.id : null }, opp:{ faction:ef.id, name:el ? el.name : ef.name, list:olist ? olist.id : null }, points:budget, strength:o.strength || 'even',
      objectives:[], secondary:null, support:[], conditions:[], layoutMode:o.layout || 'full', bigPiece:o.bigPiece !== false, notes:[] };
    qbRollForces(q); qbRollObjectives(q); qbRollConditions(q); q.layout = buildLayout(q);
    return q;
  });
}
const troopSlot = t => t.troop === 'squad' ? 'infantry' : t.troop === 'team' ? 'weaponsTeam' : t.troop === 'vehicle' ? 'armoredCar' : t.level === 'epic' ? 'epicChar' : 'majorChar';
function qbRollForces(q){
  const pl = q.player.list && LISTS.find(l => l.id === q.player.list), ol = q.opp.list && LISTS.find(l => l.id === q.opp.list);
  q.units = pl ? unitsFromList(pl, 'Quick battle') : namedUnits(qbPlayerPicks(q.player.faction, q.tier, q.points), q.player.faction, 'Quick battle');
  q.pCount = q.units.reduce((a, u) => a + unitCountOf(u), 0); q.figures = q.units.reduce((a, u) => a + u.figures.length, 0);
  const arrivesLater = q.tier >= 3; const deploy = (slot, i, n) => arrivesLater && i >= Math.ceil(n / 2) ? `Arrives at the end of round ${2 + (i % 2)} from the enemy edge` : PLACEMENT[slot];
  if (ol){
    const us = unitsFromList(ol, 'Quick battle');
    q.eunits = us.map((u, i) => { const t = tplOf(u); const slot = troopSlot(t); return { slot, pts:tplPoints(t).v, unit:u, label:t.name, deploy:deploy(slot, i, us.length) }; });
  } else {
    const items = qbEnemy(q.opp.faction, q.tier, q.points * (QB_STRENGTH[q.strength] || 1), q.pCount, true);
    const named = namedUnits(items.filter(x => x.tpl).map(x => x.tpl), q.opp.faction, 'Quick battle'); let ni = 0;
    q.eunits = items.map((x, i) => ({ slot:x.slot, pts:x.pts, unit:x.tpl ? named[ni++] : null, label:x.tpl ? x.tpl.name : SLOT_LABEL[x.slot] + ' (generic book profile)', deploy:deploy(x.slot, i, items.length) }));
  }
  q.enemy = { mode:'pre', faction:q.opp.name, list:q.eunits.map(e => ({ label:e.label, slot:e.slot, mapped:!!e.unit, pts:e.pts })) };
  q.support = q.tier >= 2 ? shuffle([...SUPPORT]).slice(0, 3).map((s, i) => ({ name:s, tn:6 + i })) : [];
}
function qbRollObjectives(q){
  q.objectives = []; q.secondary = null;
  if (q.scenario === 'Skirmish'){ for (let i = 0; i < 3; i++){ let o = rollSkirmishObj(i + 1), g = 0; while (q.objectives.some(x => x.name === o[1]) && g++ < 20) o = rollSkirmishObj(i + 1); q.objectives.push({ name:o[1], text:o[2], when:['After deployment','End of round 1','End of round 2'][i] }); } }
  else if (q.scenario === 'Evolving Objective'){ const n = q.table[1] >= 48 ? 4 : 3; for (let i = 0; i < n; i++) q.objectives.push({ name:`Objective ${i + 1}`, text:'Nature revealed on contact: Scout, Sweep, Capture, Hold or Interact.', when:'On contact' }); }
  else if (q.scenario === 'Battle'){ const o = lookup('battleObj', D6('Battle Scenario objective (D6)')); q.objectives.push({ name:o.name, text:o.text, when:'After deployment' }); }
  else q.objectives.push({ name:'Vital ground', text:'Every building and hill: 1 VP each to the side that last held it with infantry.', when:'End of game' }, { name:'Clear quarters', text:'1 VP per home quarter clear of enemies.', when:'End of game' }, { name:'Attrition', text:'1 VP per enemy squad or vehicle destroyed; 2 VP for the enemy commander.', when:'End of game' });
  if (q.tier >= 3) q.secondary = lookup('secondary', D100('Secondary objective')).name;
}
function qbRollConditions(q){
  q.conditions = []; const n = Number(lookup('condCount', D100('Battlefield condition count')).count) || 0;
  for (let i = 0; i < n; i++){ const c = lookup('conditions', D100(`Battlefield condition ${i + 1}`)); if (!q.conditions.find(x => x[0] === c.name)) q.conditions.push([c.name, c.text]); }
}
function qbReroll(part){
  const q = S.quick; if (!q) return; q.rerolls = (q.rerolls || 0) + 1;
  withQuick(q.seed + '#' + part + q.rerolls, q.opp.faction, () => {
    if (part === 'forces') qbRollForces(q);
    else if (part === 'objectives'){ qbRollObjectives(q); q.layout = buildLayout(q); }
    else if (part === 'conditions') qbRollConditions(q);
    else if (part === 'terrain') q.layout = buildLayout(q);
  });
}

