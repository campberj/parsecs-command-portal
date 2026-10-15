/* ---------- enemy AI ---------- */
function personality(side){ return side === 'E' ? (enemyFaction().personality || 'Methodical') : 'Player'; }
function scoreTarget(side, n){
  const p = personality(side); const opp = other(side);
  if (S.mods.bookAI && side === 'E') return 1;
  let s = 1; const oppCap = S.map.nodes.find(x => x.capital === opp); const nearCap = oppCap && adjOf(oppCap.id).includes(n.id);
  if (p === 'Aggressive'){ if (n.ctrl === opp) s += 3; if (nearCap) s += 3; }
  else if (p === 'Methodical'){ if (n.type === 'Defensible' || n.type === 'Resource') s += 3; if (n.ctrl === 'N') s += 1; }
  else if (p === 'Opportunist'){ if (n.type === 'Critical' || n.type === 'Urban') s += 4; }
  else if (p === 'Raider'){ if (n.ctrl === opp) s += 2; }
  else { if (n.type === 'Critical' || n.type === 'Urban') s += 2; if (n.ctrl === opp) s += 1; }
  if (n.type === 'Inhospitable') s = Math.max(0.5, s - 1);
  return s;
}
function openZone(side, why, fixedStr){
  const opp = other(side);
  const owned = S.map.nodes.filter(n => n.ctrl === side).map(n => n.id);
  const cands = [...new Set(owned.flatMap(adjOf))].map(i => S.map.nodes[i]).filter(n => n.ctrl !== side && !zoneAt(n.id));
  if (!cands.length) return null;
  const tgt = weighted(cands, n => scoreTarget(side, n));
  const who = s => s === 'P' ? 'your' : 'enemy';
  const strOf = s => {
    if (fixedStr) return fixedStr[s];
    const twoDice = why === 'step7' ? s === side : adjacentToTerritory(tgt.id, s);
    return twoDice ? best2(`${tgt.name}: ${who(s)} Army Strength (best of 2D6)`) : D6(`${tgt.name}: ${who(s)} Army Strength (1D6)`);
  };
  let a = strOf(side), b = strOf(opp);
  if (tgt.type === 'Inhospitable'){ a = Math.min(a, RP('inhospCap')); b = Math.min(b, RP('inhospCap')); }
  const z = { id:uid('z'), region:tgt.id, attacker:side, P:side === 'P' ? a : b, E:side === 'E' ? a : b, pbp:0, pbpTurn:0, focus:false, scouted:false, opened:S.turn };
  S.zones.push(z);
  log('zone', `${sideName(side)} open a front at ${tgt.name} (${tgt.type}${tgt.ctrl === 'N' ? ', neutral' : ''}). Army Strength: yours ${z.P}, theirs ${z.E}.`);
  return z;
}

/* ---------- operational combat ---------- */
function combatDice(z, side, extra){
  const opp = other(side); let n = 1;
  if (!adjacentToTerritory(z.region, opp)) n++;
  if (z[side] - z[opp] >= 2) n++;
  const r = regionOf(z); if (r.type === 'Defensible' && r.ctrl === side && r.dq > 0) n++;
  return Math.max(1, n + (extra || 0));
}
function opCombat(z, opts){
  opts = opts || {}; const depth = opts.depth || 0;
  if (z.P <= 0 || z.E <= 0) return;
  let pbp = 0; if (depth === 0 && S.mods.autoPBP && z.pbp > 0){ pbp = z.pbp; z.pbp = 0; }
  const r = regionOf(z); const tag = depth ? ` (refight ${depth})` : '';
  const rp = rollN(combatDice(z, 'P', (opts.extraP || 0) + pbp - (opts.minus || 0)), 6, `${r.name}${tag}: your combat dice`);
  const re = rollN(combatDice(z, 'E', (opts.extraE || 0) - (opts.minus || 0)), 6, `${r.name}${tag}: enemy combat dice`);
  const six = a => a.filter(x => x === 6).length, hi = a => Math.max(...a);
  let out = '', again = false; const before = { P:z.P, E:z.E };
  if (six(rp) >= 2 && six(re) >= 2){ z.P--; z.E--; out = 'devastating major battle: both lose 1, fight again'; again = true; }
  else if (six(rp) >= 2 || six(re) >= 2){ const w = six(rp) >= 2 ? 'P' : 'E'; z[w]++; z[other(w)]--; out = `grand tactical success for ${w === 'P' ? 'you' : 'the enemy'}`; if (z[w] > z[other(w)]){ again = true; out += ', fight again'; } }
  else if (hi(rp) !== hi(re)){ const w = hi(rp) > hi(re) ? 'P' : 'E'; z[other(w)]--; out = `${w === 'P' ? 'you gain' : 'the enemy gains'} the upper hand`; if (r.type === 'Defensible' && r.ctrl === other(w) && r.dq > 0) r.dq--; }
  else if (hi(rp) >= 5){ z.P--; z.E--; out = 'brutal attrition: both lose 1'; }
  else { out = 'inconclusive fighting'; if (r.type === 'Urban'){ z.P--; z.E--; out += '; urban grind: both lose 1, fight again'; again = true; } }
  log('combat', `${r.name}: you roll [${rp.join(' ')}] vs [${re.join(' ')}]${pbp ? ` (spent ${pbp} PBP)` : ''}. ${cap(out)}. Strength ${before.P}–${before.E} → ${Math.max(0, z.P)}–${Math.max(0, z.E)}.`);
  if (again && depth < 3 && z.P > 0 && z.E > 0) opCombat(z, { depth:depth + 1, minus:1 });
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function resolveZones(winners){
  for (const z of [...S.zones]){
    if (z.P > 0 && z.E > 0) continue;
    const r = regionOf(z); const prior = r.ctrl;
    if (z.P <= 0 && z.E <= 0){ if (prior !== 'N') regionLost(prior, r); r.ctrl = 'N'; log('zone', `${r.name}: both armies destroyed. The region falls neutral.`); }
    else {
      const w = z.P > 0 ? 'P' : 'E';
      if (prior === other(w)) regionLost(prior, r);
      if (prior !== w){ if (r.type === 'Critical' && prior === 'N' && !r.critTaken){ r.critTaken = true; S.cohesion[w]++; log('cohesion', `${sideName(w)} take Critical ${r.name} first: +1 Cohesion.`); } r.ctrl = w; }
      if (winners) winners.add(w);
      log('zone', `${r.name} falls to ${w === 'P' ? 'your forces' : enemyFaction().name}.`);
    }
    S.zones = S.zones.filter(x => x !== z);
  }
}
function regionLost(side, r){
  let loss = 1; const why = ['region lost'];
  if (r.type === 'Urban'){ loss++; why.push('Urban'); }
  if (r.type === 'Critical' && !r.critSpent){ loss++; r.critSpent = true; why.push('Critical'); }
  S.cohesion[side] = Math.max(0, S.cohesion[side] - loss);
  log('cohesion', `${side === 'P' ? 'Your' : 'Enemy'} Cohesion −${loss} (${why.join(', ')}): now ${S.cohesion[side]}.`);
}

/* ---------- operational orders ---------- */
function chooseZone(side, purpose){
  const opp = other(side); let zs = [...S.zones]; if (!zs.length) return null;
  const p = personality(side);
  if (S.mods.bookAI && side === 'E') return pick(zs);
  if (purpose === 'continue') zs = zs.filter(z => z[side] >= z[opp]);
  if (!zs.length) return null;
  const by = f => zs.sort((a, b) => f(a) - f(b))[0];
  if (purpose === 'raid') return by(z => -(z[opp] - z[side]));
  if (p === 'Aggressive') return by(z => z[opp]);
  if (p === 'Methodical') return by(z => z[side]);
  if (p === 'Opportunist') return by(z => (['Critical','Urban'].includes(regionOf(z).type) ? -10 : 0) + z[opp]);
  if (p === 'Raider') return by(z => -z[opp]);
  return zs.find(z => z.focus) || by(z => z[opp] - z[side]);
}
function weakest(side){ return [...S.zones].sort((a, b) => a[side] - b[side])[0] || null; }
function doOrder(side, k){
  if (S.noOrders[side]){ log('order', `${sideName(side)} cannot issue orders this turn (loss of capability).`); return; }
  const opp = other(side); const who = side === 'P' ? 'You' : enemyFaction().name;
  const roll = D6(`${side === 'P' ? 'Your' : 'Enemy'} Operational Order${k ? ' (second order)' : ''}`); const row = lookup('orders', roll);
  const fx = ['fortify','continue','newOffensive','renew','raid','bolster']; const o = fx.indexOf(row.effect) + 1 || roll;
  const txt = `${who} roll ${roll}: ${row.name}. `;
  if (o === 1){
    const own = S.map.nodes.filter(n => n.ctrl === side && n.type !== 'Defensible' && !n.capital);
    if (S.setup.special && own.length){ const r = pick(own); r.type = 'Defensible'; r.dq = RP('dq'); log('order', txt + `${r.name} is fortified (Defense Quality ${r.dq}).`); }
    else { const z = weakest(side); if (z){ z[side]++; log('order', txt + `+1 Army Strength at ${regionOf(z).name}.`); } else log('order', txt + 'No army to reinforce.'); }
  } else if (o === 2){
    const z = chooseZone(side, 'continue');
    if (z){ log('order', txt + `Fights again at ${regionOf(z).name}.`); opCombat(z); } else { log('order', txt + 'No zone qualifies; launching a new offensive instead.'); const nz = openZone(side, 'order'); if (nz) opCombat(nz); }
  } else if (o === 3){ log('order', txt + 'Opens a new front.'); const nz = openZone(side, 'order'); if (nz) opCombat(nz); }
  else if (o === 4){ const z = chooseZone(side, 'renew'); if (z){ z[side]++; log('order', txt + `+1 Army Strength and fights at ${regionOf(z).name}.`); opCombat(z); } else log('order', txt + 'No active zone.'); }
  else if (o === 5){ const zs = S.zones.filter(z => z[opp] > z[side]); if (zs.length){ const z = chooseZone(side, 'raid'); const tz = zs.includes(z) ? z : zs[0]; tz[opp]--; log('order', txt + `Raids cut the opposing army at ${regionOf(tz).name} by 1.`); } else log('order', txt + 'No stronger opposing army to raid.'); }
  else { const z = weakest(side); if (z){ z[side]++; log('order', txt + `Weakest army at ${regionOf(z).name} +1.`); } else log('order', txt + 'No army to bolster.'); }
}
function redeploy(side){
  const zs = S.zones.filter(z => z[side] > 0); if (zs.length < 2) return;
  const lo = [...zs].sort((a, b) => a[side] - b[side])[0], hi = [...zs].sort((a, b) => b[side] - a[side])[0];
  if (lo !== hi && lo[side] <= 2 && hi[side] >= lo[side] + 2){ hi[side]--; lo[side]++; log('redeploy', `${sideName(side)} shift 1 strength from ${regionOf(hi).name} to ${regionOf(lo).name}.`); }
}

/* ---------- the operational turn, as five resumable phases ---------- */
function canAdvance(){ return !S.ended && !S.pendingDice && (S.turnPhase > 0 || !S.inbox.some(e => !e.resolved)); }
function turnPhase(i){
  const winners = new Set(S.turnWinners || []);
  if (i === 0){ log('turn', `— Operational turn ${S.turn} resolves —`); for (const z of [...S.zones]) opCombat(z); resolveZones(winners); }
  else if (i === 1){ for (const side of ['P','E']){ const n = 1 + (S.extraOrders[side] || 0); for (let k = 0; k < n; k++){ doOrder(side, k); resolveZones(winners); } } }
  else if (i === 2){
    redeploy('P'); redeploy('E');
    for (const side of ['P','E']){
      const res = S.map.nodes.filter(n => n.ctrl === side && n.type === 'Resource' && !n.exhausted);
      if (res.length && S.zones.length){ const z = weakest(side); const r = D6(`${side === 'P' ? 'Your' : 'Enemy'} Resource roll (${res[0].name})`);
        if (r === 1){ res[0].exhausted = true; log('resource', `${sideName(side)}: ${res[0].name} runs dry (rolled 1).`); }
        else if (r >= z[side]){ z[side]++; log('resource', `${sideName(side)} draw supply from ${res[0].name}: +1 at ${regionOf(z).name} (rolled ${r}).`); } }
    }
  } else if (i === 3){
    winners.forEach(w => openZone(w, 'step7'));
    if (!S.zones.length){ openZone('P', 'step7'); openZone('E', 'step7'); }
    if (S.zones.length && !S.zones.some(z => z.focus)){ const f = pick(S.zones); f.focus = true; log('zone', `New Operational Focus: ${regionOf(f).name}.`); }
    if (!S.zones.find(z => z.id === S.commitment)){ const f = S.zones.find(z => z.focus); S.commitment = f ? f.id : null; if (f) log('commit', `Your force moves to ${regionOf(f).name}.`); }
    if (S.cohesion.E <= 0 && S.cohesion.P <= 0) S.ended = 'draw'; else if (S.cohesion.E <= 0) S.ended = 'win'; else if (S.cohesion.P <= 0) S.ended = 'loss';
    if (S.ended) log('end', S.ended === 'win' ? `${enemyFaction().name} Cohesion is broken. The campaign is won.` : S.ended === 'loss' ? 'Your Cohesion is broken. The campaign is lost.' : 'Both sides are exhausted. The war ends inconclusive.');
    S.noOrders = {}; S.extraOrders = {}; S.turn++;
    S.roster.units.forEach(u => u.figures.forEach(f => { if (f.status === 'wounded' && f.recover > 0){ f.recover--; if (f.recover === 0){ f.status = 'active'; log('roster', `${f.name} returns to ${u.name} from the aid station.`); } } }));
    if (S.mods.fog) S.zones.forEach(z => { if (z.scoutedTurn && S.turn - z.scoutedTurn > 2) z.scouted = false; });
    winners.clear();
  } else if (i === 4){
    if (!S.ended){ if (S.turn % Math.max(1, S.mods.pace) === 0) queueStory(); if (rand() * 100 < S.mods.eventChance) queueInteractive(); queueMilestones(); }
  }
  S.turnWinners = [...winners];
}
function runTurn(){
  if (S.pendingDice || S.ended) return 'blocked';
  if ((S.turnPhase || 0) === 0 && S.inbox.some(e => !e.resolved)) return 'blocked';
  for (let i = S.turnPhase || 0; i < 5; i++){
    const r = runStep('phase', [i]); if (r.pending) return 'pending';
    S.turnPhase = i + 1;
  }
  S.turnPhase = 0; return 'done';
}
const AFTER = { result:() => { if (S.ui) S.ui.wiz = null; if (isBrowser) autoBackup('Mission result'); }, phase:p => { const next = p.args[0] + 1; if (next >= 5){ S.turnPhase = 0; return; } S.turnPhase = next; runTurn(); } };
function submitDice(vals){ const p = S.pendingDice; if (!p) return; const r = runStep(p.key, p.args, [...p.provided, ...vals]); if (r.ok && AFTER[p.key]) AFTER[p.key](p); return r; }
function advanceTurn(){ return runTurn() === 'done'; }

