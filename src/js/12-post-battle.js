/* ---------- post-battle ---------- */
/* normalise either the 0.2 result form ({units:{u:{figs,wiped}}}) or the 1.0 wizard form ({figs, wiped}) */
function normaliseResult(form){
  const out = { outcome:form.outcome || 'Victory', vp:parseInt(form.vp, 10) || 0, secondary:!!form.secondary, figs:{}, wiped:{}, unitNotes:form.unitNotes || {} };
  if (form.figs){ Object.assign(out.figs, form.figs); Object.assign(out.wiped, form.wiped || {}); }
  if (form.units) Object.entries(form.units).forEach(([uid_, uu]) => { if (uu.wiped) out.wiped[uid_] = true;
    Object.entries(uu.figs || {}).forEach(([fid, ff]) => { out.figs[fid] = { kills:ff.kills, state:ff.kia ? 'dead' : ff.wounded ? 'casualty' : 'ok' }; }); });
  return out;
}
function figXpOf(key){ const r = R('figXp').find(x => x.key === key); return r ? Number(r.xp) || 0 : 0; }
function giveAward(u, f, name, ctx){
  const a = awardOf(name) || { name, xp:0, tokens:0 };
  f.awards.push({ type:name, turn:S.turn, sd:stardate(S.turn), note:ctx && ctx.note || '', region:ctx && ctx.region || '' });
  if (a.xp){ if (S.mods.figureXP) f.xp += a.xp; else u.xp += a.xp; }
  if (a.tokens) f.tokens = (f.tokens || 0) + a.tokens;
  log('award', `${f.name} (${u.name}) receives the ${name}${a.xp ? `, +${a.xp} XP` : ''}${a.tokens ? `, ${a.tokens} ${S.content.tokenName || 'token'}${a.tokens > 1 ? 's' : ''}` : ''}.`);
  return a;
}
function rollUnitXp(u, outcome){
  const t = tplOf(u); const isInd = t && t.troop === 'individual';
  const row = R('unitXp').find(x => x.key === (isInd && outcome === 'Victory' ? 'indWin' : 'unit')) || { dice:'D6' };
  const dsc = String(row.dice || 'D6').trim().toLowerCase();
  if (dsc === 'best2') return best2(`Experience: ${u.name} (best of 2D6)`);
  if (/^\d+$/.test(dsc)) return parseInt(dsc, 10);
  return rollExpr(row.dice, `Experience: ${u.name}`);
}
function recordResult(m, rawForm){
  const form = normaliseResult(rawForm); const outcome = form.outcome; const vp = form.vp; const lines = []; const moments = [];
  const base = rollN(3, 6, 'Campaign Points (3D6, drop lowest)').sort((a, b) => b - a); const cpBase = base[0] + base[1];
  const cpBonus = vp > 0 ? vp : RP(outcome === 'Victory' ? 'cpWin' : outcome === 'Draw' ? 'cpDraw' : 'cpLoss');
  S.cp += cpBase + cpBonus; lines.push(`Campaign Points +${cpBase + cpBonus} (3D6 drop lowest [${base.join(' ')}] = ${cpBase}, +${cpBonus} ${vp > 0 ? 'for VP' : 'for the result'}).`);
  S.story++; lines.push('Story point +1.');
  if (form.secondary && m.secondary){ S.story++; lines.push(`Secondary objective achieved (${m.secondary}): story point +1.`); moments.push(`Secondary objective achieved: ${m.secondary}.`); }
  const casualties = [], dead = [], awarded = [];
  for (const uid_ of m.force){
    const u = S.roster.units.find(x => x.id === uid_); if (!u) continue;
    u.figures.forEach(f => {
      const ff = form.figs[f.id];
      if (!ff){ if (f.status === 'wounded' && !f.recover) f.status = 'active'; return; }
      const k = parseInt(ff.kills, 10) || 0; f.kills += k; if (k) moments.push(`${f.name}: ${k} kill${k > 1 ? 's' : ''}.`);
      let xp = 0, injXp = 0;
      if (ff.state === 'dead'){ f.status = 'kia'; f.diedAt = `${m.regionName}, Stardate ${m.sd}`; lines.push(`${f.name} killed in action.`); dead.push(f); }
      else if (ff.state === 'casualty'){
        f.wounds++; let v = D100(`Injury: ${f.name}`); let row = lookup('injury', v); let txt = `${row.result} (D100 ${v})`;
        if (ff.stab && S.mods.fieldStab){ const v2 = D100(`Injury reroll, ${f.name} was stabilized`); const r2 = lookup('injury', v2); txt += `; stabilized, reroll ${v2}: ${r2.result} stands`; row = r2; }
        injXp = Number(row.xp) || 0;
        if (row.effect === 'dead'){ f.status = 'kia'; f.diedAt = `${m.regionName}, Stardate ${m.sd}`; lines.push(`${f.name} became a casualty: ${txt}. Killed.`); dead.push(f); }
        else if (row.effect === 'injured'){ const t = Math.max(1, rollExpr(row.turns || '1', `Recovery time: ${f.name} (${row.turns || 1})`)); f.status = 'wounded'; f.recover = t; lines.push(`${f.name} became a casualty: ${txt}. Out for ${t} turn${t > 1 ? 's' : ''}.`); casualties.push(f); }
        else { if (f.status === 'wounded' && !f.recover) f.status = 'active'; lines.push(`${f.name} became a casualty: ${txt}.`); casualties.push(f); }
      } else if (f.status === 'wounded' && !f.recover) f.status = 'active';
      if (S.mods.figureXP && f.status !== 'kia'){
        xp = ff.state === 'casualty' ? figXpOf('casualty') : figXpOf(outcome === 'Victory' ? 'survivedWin' : 'survivedLoss');
        if (ff.first) xp += figXpOf('firstBlood'); if (ff.unique) xp += figXpOf('unique'); xp += k * figXpOf('perKill') + injXp;
        f.xp += xp; if (xp) lines.push(`${f.name} +${xp} XP.`);
      }
      if (ff.first) moments.push(`${f.name} drew first blood.`);
      if (ff.award){ giveAward(u, f, ff.award, { region:m.regionName, note:ff.note || '' }); awarded.push({ f, award:ff.award }); lines.push(`${f.name}: ${ff.award}.`); }
      if (ff.note && ff.note.trim()){ f.notes = (f.notes ? f.notes + '\n' : '') + `${m.sd}, ${m.regionName}: ${ff.note.trim()}`; moments.push(`${f.name}: ${ff.note.trim()}`); }
    });
    if (u.condition.battles > 0){ u.condition.battles--; if (u.condition.battles === 0 && u.condition.state !== 'Lost') u.condition = { state:'Okay', battles:0 }; }
    if (form.wiped[u.id]){
      const r = D6(`Unit Losses table: ${u.name}`); const row = lookup('unitLosses', r); const st = row.state || 'Okay';
      u.condition = { state:st, battles:Number(row.battles) || 0 }; lines.push(`${u.name} unit loss roll ${r}: ${st}.`);
      if (st === 'Lost') S.roster.history.push({ unit:u.name, reason:'Lost in action', sd:m.sd, region:m.regionName });
    }
    if (S.mods.skillCurrency !== 'cp'){ const uxp = rollUnitXp(u, outcome); u.xp += uxp; lines.push(`${u.name} +${uxp} unit XP.`); }
    if (form.unitNotes[u.id]) u.notes = (u.notes ? u.notes + '\n' : '') + `${m.sd}: ${form.unitNotes[u.id]}`;
  }
  S.roster.units = S.roster.units.filter(u => u.condition.state !== 'Lost');
  const z = S.zones.find(x => x.id === m.zoneId);
  if (z){ z.scouted = true; z.scoutedTurn = S.turn;
    if (outcome === 'Victory'){
      if (z.pbpTurn !== S.turn){ z.pbpTurn = S.turn; z.pbpThisTurn = 0; }
      if ((z.pbpThisTurn || 0) < RP('pbpPerTurn') && z.pbp < RP('pbpMax')){ z.pbp++; z.pbpThisTurn = (z.pbpThisTurn || 0) + 1; lines.push(`+1 Player Battle Point at ${m.regionName} (${z.pbp} saved).`); } else lines.push('Battle point cap reached for this zone.');
      if (m.critical){ const zz = S.zones.find(x => x.E >= 4); if (zz){ zz.E--; lines.push(`Critical Strike succeeds: −1 enemy strength at ${regionOf(zz).name}.`); resolveZones(null); } }
    } }
  if (S.mods.mercenary){ const mu = D6('Munitions Points') + (outcome === 'Victory' ? D6('Munitions: scavenging (you held the field)') : 0); S.munitions += mu; lines.push(`Munitions +${mu}.`); }
  S.lastResult = outcome; m.status = 'complete'; m.result = { outcome, vp, lines, moments, secondary:form.secondary, participants:Object.keys(form.figs) };
  log('battle', `${m.regionName} — ${outcome}${vp ? `, ${vp} VP` : ''}. ` + lines.join(' '));
  m.debriefId = debriefScene(m, { casualties, dead, awarded });
  queueMilestones();
  return lines;
}

