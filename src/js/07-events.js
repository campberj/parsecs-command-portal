/* ---------- story events ---------- */
function queueStory(){
  const v = D100('Story event table (D100)'); const row = lookup('story', v);
  S.inbox.push({ id:uid('ev'), kind:'story', roll:v, title:row.title, text:row.text, effect:row.effect || null, resolved:false, turn:S.turn });
}
function applyStory(id){ const ev = S.inbox.find(e => e.id === id); const out = storyEffect(ev); ev.resolved = true; ev.outcome = out; ev.choice = 'Applied'; log('story', `${ev.title} (D100 ${ev.roll}): ${out}`); return out; }
function storyEffect(ev){
  const winner = S.lastResult === 'Victory' ? 'P' : S.lastResult === 'Defeat' ? 'E' : (rand() < 0.5 ? 'P' : 'E');
  const loser = other(winner); const z = S.zones.length ? (S.zones.find(x => x.id === S.commitment) || pick(S.zones)) : null; const txt = [];
  switch (ev.effect){
    case 'reinf': if (z){ z[winner]++; txt.push(`${sideName(winner)}: +1 Army Strength at ${regionOf(z).name}.`); } break;
    case 'crit': S.flags.criticalStrike = true; txt.push('Your next generated mission carries a Critical Strike: win it to cut an enemy army at 4+ strength by 1.'); break;
    case 'shift': if (z){ z[winner]++; z[loser]--; txt.push(`${regionOf(z).name}: ${winner === 'P' ? 'you' : 'the enemy'} +1, the other side −1.`); } break;
    case 'short': { const zz = S.zones.find(x => x[loser] >= 4); if (zz){ zz[loser]--; txt.push(`${sideName(loser)} short on supply: −1 at ${regionOf(zz).name}.`); } else txt.push('No army at 4+ strength to suffer the shortfall.'); } break;
    case 'ally': { const nz = openZone('P', 'order', { P:4, E:2 }); if (nz) txt.push(`An ally opens a front at ${regionOf(nz).name}: 4 against 2.`); } break;
    case 'init': { const low = S.cohesion.P <= S.cohesion.E ? 'P' : 'E'; const zz = weakest(low); if (zz){ zz[low]++; txt.push(`${sideName(low)} seize the initiative at ${regionOf(zz).name}: +1 and fight now.`); opCombat(zz); } } break;
    case 'unconv': { const zz = S.zones.length ? [...S.zones].sort((a, b) => b.E - a.E)[0] : null; if (zz){ const r = D6('Unconventional operation (under enemy strength)'); if (r < zz.E){ zz.E--; txt.push(`Special operation rolls ${r} under the enemy strength at ${regionOf(zz).name}: −1.`); } else txt.push(`Special operation rolls ${r}: no effect.`); } } break;
    case 'losscap': S.noOrders[loser] = true; txt.push(`${sideName(loser)} cannot carry out an order next turn.`); break;
    case 'strategy': S.extraOrders[winner] = 1; txt.push(`${sideName(winner)} carry out two orders next turn.`); break;
    case 'focus': if (S.zones.length > 1){ S.zones.forEach(x => x.focus = false); const f = pick(S.zones); f.focus = true; txt.push(`Focus moves to ${regionOf(f).name}.`); } break;
    case 'transfer': if (z && z.P <= 4){ z.P++; txt.push(`Transfer in: +1 at ${regionOf(z).name}. Add a unit to your roster if you have one ready.`); } break;
    case 'front': { const alt = S.zones.filter(x => x.id !== S.commitment); if (alt.length){ const f = pick(alt); S.commitment = f.id; txt.push(`Your force is moved to ${regionOf(f).name}.`); } } break;
    case 'rr': if (z && z.P <= 3) z.P = 3; S.roster.units.forEach(u => { if (u.condition.state !== 'Lost') u.condition = { state:'Okay', battles:0 }; u.figures.forEach(f => { if (f.status === 'wounded') f.status = 'active'; }); }); txt.push('R&R: conditions cleared, wounded return, your zone raised to at least 3.'); break;
    case 'newfront': { const nz = openZone(rand() < 0.5 ? 'P' : 'E', 'order', { P:4, E:4 }); if (nz){ txt.push(`New front at ${regionOf(nz).name}, 4 against 4.`); opCombat(nz); } } break;
    default: txt.push('Narrative event: play it out or note it in the journal.');
  }
  resolveZones(null);
  return txt.join(' ');
}
function playerAction(id, txt){
  const ev = S.inbox.find(e => e.id === id); const r = D6('Player action (3–6 succeeds)'); let res;
  if (r >= 3) res = `succeeds (rolled ${r})`;
  else { const f = D6('Reason the action failed'); res = `fails (rolled ${r}): ${f === 1 ? 'attempted, failed dramatically' : f <= 3 ? 'prevented by events or the enemy' : 'never attempted for lack of resources'}`; }
  ev.paction = `Player action "${txt}" ${res}.`; log('action', ev.paction); return ev.paction;
}
function commandoRaid(zid){
  const z = S.zones.find(x => x.id === zid); const n = z.pbp; const r = rollN(n, 6, `Commando raid at ${regionOf(z).name}`); z.pbp = 0;
  const sixes = r.filter(x => x === 6).length; z.E = Math.max(0, z.E - sixes);
  log('raid', `Commando raid at ${regionOf(z).name}: rolled [${r.join(' ')}]. ${r.some(x => x <= 2) ? 'A 1–2 came up: all committed PBP are spent.' : 'PBP spent.'} Enemy −${sixes}.`);
  resolveZones(null); return sixes;
}

/* ---------- interactive events ---------- */
const EVENTS = [
  { id:'convoy', title:'Convoy overdue', tags:['logistics'], text:c => `The resupply convoy for ${c.zoneName} is six hours late and the net is quiet. Battalion asks what you intend to do.`,
    choices:[
      { label:c => `Send ${c.unitName} to bring it in`, test:{ stat:'tr', tn:5 }, pass:() => { S.cp += 2; zAdd('P', 1); return '+2 Campaign Points; convoy recovered, +1 Army Strength in your zone.'; }, fail:c => { if (c.unit) c.unit.condition = { state:'Weakened', battles:1 }; return `${c.unitName} is ambushed on the road and comes back Weakened.`; } },
      { label:() => 'Ration what you have', apply:() => { zAdd('P', -1); return '−1 Army Strength in your zone.'; } },
      { label:() => 'Requisition from the local militia (2 CP)', cost:2, apply:() => { zAdd('P', 1); return '+1 Army Strength in your zone.'; } } ] },
  { id:'deserter', title:'Deserter at the wire', tags:['intel'], text:() => `Sentries bring in a ${enemyFaction().name} rifleman who walked into your lines with his hands up.`,
    choices:[
      { label:() => 'Interrogate him', test:{ stat:'sv', tn:5 }, pass:() => { S.zones.forEach(z => { z.scouted = true; z.scoutedTurn = S.turn; }); const z = myZone(); if (z) z.pbp = Math.min(3, z.pbp + 1); return 'Enemy strengths revealed on every front; +1 Player Battle Point in your zone.'; }, fail:() => 'He knows nothing useful, or will not say.' },
      { label:() => 'Hand him to battalion intelligence', apply:() => { S.cp += 1; return '+1 Campaign Point.'; } } ] },
  { id:'battery', title:'Battery offers fire', tags:['support'], text:() => 'A medium battery displacing through your sector offers a fire mission on call for your next action.',
    choices:[
      { label:() => 'Accept (2 CP)', cost:2, apply:() => { S.banked.push({ name:'Medium battery (Fire Support)', tn:6 }); return 'Banked: Fire Support at 6+ on your next mission.'; } },
      { label:() => 'Decline', apply:() => 'The battery moves on.' } ] },
  { id:'hvt', title:'Enemy commander sighted', tags:['chain'], once:true, text:() => `Patrols report an ${enemyFaction().name} field officer touring forward positions on a fixed schedule.`,
    choices:[
      { label:() => 'Plan a snatch raid', apply:() => { S.flags.hvt = true; return 'Your next generated mission carries the secondary objective "Kill Target: the field officer".'; } },
      { label:() => 'Pass it up the chain', apply:() => { const r = D6('Air strike on the staff car (4+)'); if (r >= 4){ const z = [...S.zones].sort((a, b) => b.E - a.E)[0]; if (z){ z.E--; resolveZones(null); return `Rolled ${r}: the strike catches the staff car. −1 enemy strength at ${regionOf(z).name}.`; } } return `Rolled ${r}: nothing comes of it.`; } } ] },
  { id:'refugees', title:'Civilians on the MSR', tags:['civilians'], text:c => `Two hundred civilians are walking the main supply route toward ${c.zoneName}, straight through your firing lanes.`,
    choices:[
      { label:c => `Escort them through with ${c.unitName}`, test:{ stat:'tr', tn:5 }, pass:() => { S.story++; return '+1 story point; the column clears without loss.'; }, fail:c => { const f = woundRandom(c.unit); return f ? `${f.name} is hit by a stray round on the escort.` : 'The escort is shot at; no one is hurt.'; } },
      { label:() => 'Close the road', apply:() => 'The road is closed. The column turns back toward the hills.' } ] },
  { id:'cache', title:'Cache in the rubble', tags:['logistics'], text:() => 'A sweep finds an enemy ammunition cache under a collapsed workshop.',
    choices:[
      { label:() => 'Haul it back', apply:() => { S.munitions += 3; S.cp += 1; return '+3 Munitions, +1 Campaign Point.'; } },
      { label:() => 'Rig it to blow', apply:() => { const r = D6('Demolition charge (5+)'); const z = [...S.zones].sort((a, b) => b.E - a.E)[0]; if (r >= 5 && z){ z.E--; resolveZones(null); return `Rolled ${r}: the blast catches an enemy column. −1 at ${regionOf(z).name}.`; } return `Rolled ${r}: the charge goes off early. No effect.`; } } ] },
  { id:'orders', title:'Orders from battalion', tags:['command'], text:() => 'Battalion wants your force on another front by morning.',
    choices:[
      { label:() => 'Comply', apply:() => { const alt = S.zones.filter(z => z.id !== S.commitment); if (alt.length){ const f = pick(alt); S.commitment = f.id; S.cp += 2; return `Moved to ${regionOf(f).name}; +2 Campaign Points.`; } return 'No other front to move to.'; } },
      { label:() => 'Argue the case', test:{ stat:'sv', tn:6 }, pass:() => { S.cp += 1; return 'Battalion relents; you stay. +1 Campaign Point.'; }, fail:() => { const alt = S.zones.filter(z => z.id !== S.commitment); if (alt.length) S.commitment = pick(alt).id; return 'Overruled. You move anyway, with no credit for it.'; } } ] }
];
function myZone(){ return S.zones.find(z => z.id === S.commitment) || null; }
function zAdd(side, n){ const z = myZone(); if (z) z[side] = Math.max(0, z[side] + n); resolveZones(null); }
function activeUnits(){ return S.roster.units.filter(u => u.condition.state !== 'Lost' && u.figures.some(f => f.status === 'active')); }
function woundRandom(u){ if (!u) return null; const fs = u.figures.filter(f => f.status === 'active'); if (!fs.length) return null; const f = pick(fs); f.wounds++; f.status = 'wounded'; return f; }
function queueInteractive(){
  const pool = EVENTS.filter(e => !e.tags.some(t => S.mods.excludeTags.includes(t)) && !(e.once && S.flags.seenEvents[e.id]));
  if (!pool.length) return;
  const e = pick(pool); S.flags.seenEvents[e.id] = (S.flags.seenEvents[e.id] || 0) + 1;
  const u = pick(activeUnits()) || null; const z = myZone();
  const c = { unit:u, unitName:u ? u.name : 'a patrol', zoneName:z ? regionOf(z).name : 'the front' };
  S.inbox.push({ id:uid('ev'), kind:'interactive', tpl:e.id, title:e.title, text:e.text(c), ctx:{ unitId:u && u.id, unitName:c.unitName, zoneName:c.zoneName }, choices:e.choices.map(ch => ch.label(c)), resolved:false, turn:S.turn, tags:e.tags });
}
function queueMilestones(){
  S.roster.units.forEach(u => u.figures.forEach(f => {
    if (f.status === 'kia') return;
    if (f.wounds >= 2 && !f.msWound){ f.msWound = true; S.inbox.push({ id:uid('ev'), kind:'milestone', tpl:'wound2', title:'Second wound', text:`${f.name} of ${u.name} has been hit twice now. The medic wants him off the line for a battle.`, ctx:{ unitId:u.id, figId:f.id }, choices:['Send him to the rear for one battle','He stays with the squad'], resolved:false, turn:S.turn, tags:['personnel'] }); }
    if (f.kills >= 5 && !f.msKills){ f.msKills = true; S.inbox.push({ id:uid('ev'), kind:'milestone', tpl:'award', title:'Recommendation for award', text:`${f.name} of ${u.name} has five confirmed kills. The company commander asks whether to forward a citation.`, ctx:{ unitId:u.id, figId:f.id }, choices:['Forward the citation','Hold it for now'], resolved:false, turn:S.turn, tags:['personnel'] }); }
  }));
}
function bestStat(unit, stat){ const t = tplOf(unit); if (!t) return 0; const vals = unit.figures.filter(f => f.status === 'active').map(f => (f.role === 'sergeant' && t.leader ? t.leader : t.profile)[stat] || 0); return vals.length ? Math.max(...vals) : 0; }
function resolveEvent(ev, idx){
  let out = '';
  if (ev.kind === 'milestone'){
    const u = S.roster.units.find(x => x.id === ev.ctx.unitId); const f = u && u.figures.find(x => x.id === ev.ctx.figId);
    if (!f){ ev.resolved = true; return { out:'The figure is no longer on the roster.' }; }
    if (ev.tpl === 'wound2'){ if (idx === 0){ f.status = 'wounded'; f.recover = Math.max(f.recover || 0, 1); out = `${f.name} sits out the next turn.`; } else { if (S.mods.figureXP) f.xp += 2; else u.xp += 2; out = `${f.name} stays. +2 XP.`; } milestoneScene('wound2', u, f, out); }
    if (ev.tpl === 'award'){ if (idx === 0){ const aw = (awardList().find(a => a.tier === 'Commendation') || awardList()[0] || { name:'Commendation' }).name; giveAward(u, f, aw, { note:'Five confirmed kills' }); out = `${f.name}: ${aw}.`; milestoneScene('award', u, f, aw); } else { S.story++; out = '+1 story point.'; } }
  } else {
    const tpl = EVENTS.find(e => e.id === ev.tpl); const ch = tpl.choices[idx];
    const c = { unit:S.roster.units.find(u => u.id === ev.ctx.unitId), unitName:ev.ctx.unitName, zoneName:ev.ctx.zoneName };
    if (ch.cost){ if (S.cp < ch.cost) return { err:`Needs ${ch.cost} Campaign Points; you have ${S.cp}.` }; S.cp -= ch.cost; }
    if (ch.test){
      const statVal = c.unit ? bestStat(c.unit, ch.test.stat) : 0; const sn = ch.test.stat === 'tr' ? 'Training' : 'Savvy';
      const r = D6(`${sn} test ${ch.test.tn}+ for ${c.unitName} (adds ${statVal >= 0 ? '+' : ''}${statVal})`);
      const tot = r + statVal; const ok = tot >= ch.test.tn;
      out = `${sn} test ${ch.test.tn}+: rolled ${r} + ${statVal} = ${tot}, ${ok ? 'pass' : 'fail'}. ` + (ok ? ch.pass(c) : ch.fail(c));
    } else out = ch.apply(c);
  }
  ev.resolved = true; ev.outcome = out; ev.choice = ev.choices[idx]; ev.err = null;
  log('event', `${ev.title}: ${ev.choice}. ${out}`);
  if (ev.kind === 'interactive') ev.sceneId = eventScene(ev);
  return { out };
}

