/* ---------- random enemy forces ---------- */
const SLOT_LABEL = { infantry:'Infantry squad', recon:'Recon squad', storm:'Storm squad', transport:'Transport (APC or IFV)', armoredCar:'Armored car or walker', lightTank:'Light tank', tank:'Tank', heavyTank:'Heavy tank', weaponsTeam:'Weapons team', majorChar:'Major character (Leader)', epicChar:'Epic character (Leader + Hero)', sniper:'Sniper specialist' };
const SLOT_COUNT = { majorChar:0.5, epicChar:0.5, sniper:0.5 };
const VEHICLE_SLOTS = ['transport','armoredCar','lightTank','tank','heavyTank'];
function condMet(c, ctx){ const outn = ctx.playerCount - ctx.enemyCount;
  return { outnumbered3:outn >= 3, outnumbered:outn > 0, playerHeavy:!!ctx.playerHeavy, enemyVehicles2:ctx.enemyVehicles >= 2, enemyHasInfantry:!!ctx.enemyHasInfantry, enemyNoInfantry:!ctx.enemyHasInfantry, playerVehicles2:ctx.playerVehicles >= 2, objectives:!!ctx.objectives, objectivesOutnumbered:!!ctx.objectives && outn > 0 }[c] || false; }
function enemyRoll(ctx, r){
  const row = lookup('enemyForces', r); let u = slotList(row.slots);
  if (row.cond && condMet(row.cond, ctx)) u = slotList(row.alt); else if (row.cond2 && condMet(row.cond2, ctx)) u = slotList(row.alt2);
  u = u.filter(x => SLOT_LABEL[x]);
  /* book note: a force without vehicles substitutes, e.g. assault infantry for tanks */
  if (S && S.armory && enemyFaction().noVehicles) u = u.map(x => VEHICLE_SLOTS.includes(x) ? 'storm' : x);
  return { roll:r, slots:u, count:u.reduce((a, s) => a + (SLOT_COUNT[s] || 1), 0) };
}
function genEnemyPre(playerCount, objectives, noVehicles){
  const out = []; let cnt = 0, veh = 0, inf = false, k = 0;
  while (k < 30){
    k++;
    const res = enemyRoll({ playerCount, enemyCount:cnt, enemyVehicles:veh, enemyHasInfantry:inf, playerVehicles:0, playerHeavy:false, objectives }, D100(`Random Enemy Forces, roll ${k}`));
    if (noVehicles && res.slots.some(s => VEHICLE_SLOTS.includes(s))) continue;
    if (cnt + res.count > playerCount + 1) break;
    res.slots.forEach(s => { out.push(s); if (VEHICLE_SLOTS.includes(s)) veh++; if (['infantry','storm','recon'].includes(s)) inf = true; });
    cnt += res.count;
    if (cnt >= playerCount) break;
  }
  if (!out.length){ out.push('infantry','infantry'); cnt = 2; }
  return { slots:out, count:cnt };
}
function revealRound(id){
  const m = S.missions.find(x => x.id === id); const e = m.enemy; const rd = e.rounds.length + 1; if (rd > 6) return;
  const n = e.pCount >= 7 && rd <= 3 ? 2 : 1; const arr = [];
  for (let k = 0; k < n; k++){
    const res = enemyRoll({ playerCount:e.pCount, enemyCount:e.total, enemyVehicles:e.veh, enemyHasInfantry:e.inf, playerVehicles:0, playerHeavy:false, objectives:e.objectives }, D100(`Round ${rd} enemy arrivals${n > 1 ? ` (roll ${k + 1} of ${n})` : ''}`));
    if (!res.slots.length){ arr.push({ roll:res.roll, slots:[], note:'No arrivals' }); continue; }
    if (e.total + res.count > e.cap){ arr.push({ roll:res.roll, slots:[], note:'Cap reached: no arrivals' }); continue; }
    e.total += res.count; res.slots.forEach(s => { if (VEHICLE_SLOTS.includes(s)) e.veh++; if (['infantry','storm','recon'].includes(s)) e.inf = true; });
    arr.push({ roll:res.roll, slots:res.slots });
  }
  e.rounds.push(arr);
}
function slotToModel(slot){ const f = enemyFaction(); const tid = f.slots && f.slots[slot]; const t = tid && S.armory.templates.find(x => x.id === tid); return t ? { name:t.name, mapped:true, tpl:t } : { name:SLOT_LABEL[slot] + ' (generic book profile)', mapped:false }; }
const PLACEMENT = { infantry:'Most forward terrain within (round)D6" of the enemy edge', storm:'Most forward terrain within (round)D6" of the enemy edge', recon:'Random neutral edge, D6th feature counted from the enemy edge', weaponsTeam:'Most distant terrain with line of sight to a random unit of yours, on their half', majorChar:'In coherency with a random enemy squad', epicChar:'In coherency with a random enemy squad', sniper:'Most distant feature with line of sight to a random infantry unit of yours', transport:'Open ground about 3D6" from the enemy edge, squad beside it', armoredCar:'Open ground about 3D6" from the enemy edge', lightTank:'Open ground about 3D6" from the enemy edge', tank:'Open ground about 3D6" from the enemy edge', heavyTank:'Open ground about 3D6" from the enemy edge' };

/* ---------- mission generation ---------- */
function autoTier(z){
  let t = (SCALES[S.setup.scale] || SCALES.squad).tier; if (z && z.focus) t++;
  const avail = deployable().reduce((a, u) => a + unitCountOf(u), 0); const need = [0.5, 1, 2, 4, 7];
  while (t > 0 && avail < need[Math.min(t, 4)]) t--;
  return clamp(t, 0, 4);
}
function pickForce(tier){
  const units = deployable(); const T = TIERS[tier]; const out = [];
  const of = k => units.filter(u => tplOf(u) && (Array.isArray(k) ? k.includes(tplOf(u).troop) : tplOf(u).troop === k));
  const squads = of('squad'), inds = of('individual'), sup = of(['team','vehicle']);
  if (T.key === 'fireteam'){ if (squads[0]) out.push(squads[0]); else if (inds[0]) out.push(inds[0]); }
  else if (T.key === 'squad'){ if (squads[0]) out.push(squads[0]); out.push(...inds.slice(0, 2)); }
  else if (T.key === 'section') out.push(...squads.slice(0, 2), ...sup.slice(0, 1), ...inds.slice(0, 1));
  else if (T.key === 'platoon') out.push(...[...squads, ...sup, ...inds].slice(0, 6));
  else out.push(...[...squads, ...sup, ...inds].slice(0, 10));
  return [...new Set(out)];
}
function rollSkirmishObj(n){ const r = D100(`Skirmish objective ${n}`); const o = lookup('skirmishObj', r); return [o.max, o.name, o.text]; }
function generateMission(opts){
  const z = opts.zoneId ? S.zones.find(x => x.id === opts.zoneId) : myZone();
  const region = z ? regionOf(z) : S.map.nodes.find(n => n.capital === 'P');
  const tier = opts.tier === 'auto' || opts.tier == null ? autoTier(z) : parseInt(opts.tier, 10);
  const T = TIERS[tier]; const stance = z ? (z.attacker === 'P' ? 'attack' : 'defend') : 'defend';
  const theme = pick(THEMES[region.type][stance]);
  const force = pickForce(tier);
  const figs = force.reduce((a, u) => a + u.figures.filter(f => f.status === 'active').length - (u.condition.state === 'Weakened' ? 1 : 0), 0);
  const pCount = force.reduce((a, u) => a + unitCountOf(u), 0);
  const m = { id:uid('m'), created:S.turn, sd:stardate(S.turn), status:'planned', zoneId:z ? z.id : null, region:region.id, regionName:region.name, regionType:region.type, tier, tierName:T.name,
              scenario:T.scen, table:[...T.table], length:T.len, stance, theme, poi:pick(region.poi), force:force.map(u => u.id), figures:figs, pCount, notes:[], objectives:[], secondary:null,
              enemy:null, support:[], conditions:[], layoutMode:opts.layout || 'full', bigPiece:opts.bigPiece !== false };
  if (!force.length) m.notes.push('No table-ready units: mark units table-ready on the Forces tab or turn off the table-ready filter in Mods.');
  if (T.key === 'fireteam' && figs < 5) m.table = [24, 24];
  if (T.scen === 'Skirmish'){ for (let i = 0; i < 3; i++){ let o = rollSkirmishObj(i + 1), g = 0; while (m.objectives.some(x => x.name === o[1]) && g++ < 20) o = rollSkirmishObj(`${i + 1} (reroll duplicate)`); m.objectives.push({ name:o[1], text:o[2], when:['After deployment','End of round 1','End of round 2'][i] }); } }
  else if (T.scen === 'Evolving Objective'){ const n = m.table[1] >= 48 ? 4 : 3; for (let i = 0; i < n; i++) m.objectives.push({ name:`Objective ${i + 1}`, text:'Nature revealed on contact: Scout, Sweep, Capture, Hold or Interact.', when:'On contact' }); }
  else if (T.scen === 'Battle'){ const o = lookup('battleObj', D6('Battle Scenario objective (D6)')); m.objectives.push({ name:o.name, text:o.text, when:'After deployment' }); }
  else m.objectives.push({ name:'Vital ground', text:'Every building and hill: 1 VP each to the side that last held it with infantry.', when:'End of game' }, { name:'Clear quarters', text:'1 VP per home quarter clear of enemies.', when:'End of game' }, { name:'Attrition', text:'1 VP per enemy squad or vehicle destroyed; 2 VP for the enemy commander.', when:'End of game' });
  if (tier >= 3){ const r = D100('Secondary objective'); m.secondary = lookup('secondary', r).name; }
  if (S.flags.hvt){ m.secondary = 'Kill Target: the enemy field officer'; S.flags.hvt = false; m.notes.push('Snatch raid from the "Enemy commander sighted" event.'); }
  if (S.flags.criticalStrike){ S.flags.criticalStrike = false; m.critical = true; m.notes.push('Critical Strike: a win cuts an enemy army at 4+ strength by 1.'); }
  const hasObj = T.scen !== 'Skirmish' || m.objectives.some(o => ['Capture','Scout'].includes(o.name));
  if (T.gen === 'figures'){
    const r = D6('Skirmish enemy size (1–2 one fewer, 5–6 one more)'); const nf = Math.max(2, figs + (r <= 2 ? -1 : r >= 5 ? 1 : 0));
    m.enemy = { mode:'figures', note:`Portal skirmish rule: enemy figures = your ${figs} figures, adjusted by D6 (${r}).`, list:[{ label:`${nf - 1} × figures from ${slotToModel('infantry').name}`, mapped:slotToModel('infantry').mapped }, { label:`1 × ${slotToModel(r >= 5 ? 'sniper' : 'majorChar').name}`, mapped:true }], count:nf, faction:enemyFaction().name };
  } else if (T.gen === 'pre'){
    const e = genEnemyPre(pCount, hasObj, tier <= 1);
    m.enemy = { mode:'pre', slots:e.slots, count:e.count, list:e.slots.map(s => { const mm = slotToModel(s); return { slot:s, label:mm.name, mapped:mm.mapped, pts:mm.tpl ? tplPoints(mm.tpl).v : 0 }; }), faction:enemyFaction().name };
  } else {
    const level = tier === 4 ? 'Strong' : (z && z.E > z.P ? 'Strong' : 'Limited');
    m.enemy = { mode:'during', level, cap:level === 'Strong' ? Math.floor(pCount * 1.5) : pCount + 1, rounds:[], total:0, veh:0, inf:false, pCount, objectives:hasObj, faction:enemyFaction().name };
  }
  if (tier >= 2){ m.support = shuffle([...SUPPORT]).slice(0, 3).map((s, i) => ({ name:s, tn:6 + i })); }
  (S.banked || []).forEach(b => m.support.push({ name:typeof b === 'string' ? b : b.name, tn:b.tn || 6, banked:true }));
  S.banked = [];
  const cr = D100('Battlefield condition count'); const ncond = Number(lookup('condCount', cr).count) || 0;
  for (let i = 0; i < ncond; i++){ const r = D100(`Battlefield condition ${i + 1}`); const cr2 = lookup('conditions', r); const c = [cr2.name, cr2.text]; if (!m.conditions.find(x => x[0] === c[0])) m.conditions.push(c); }
  m.layout = buildLayout(m);
  const br = briefingFor(m); if (br) m.briefing = br;
  S.missions.unshift(m);
  log('mission', `Mission generated at ${region.name}: ${T.name}, ${T.scen}. "${theme}".`);
  return m;
}

