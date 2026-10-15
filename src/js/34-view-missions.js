/* ----- missions ----- */
function viewMissions(){
  const m = S.missions.find(x => x.id === S.ui.mission) || S.missions[0];
  const gen = `<div class="panel"><div class="panel-h"><h3>Generate a mission</h3></div>
    <form class="form-grid" data-form="genmission">
      <label class="f"><span>Front</span><select id="gm-zone" name="zone">${S.zones.map(z => `<option value="${z.id}" ${z.id === S.commitment ? 'selected' : ''}>${esc(regionOf(z).name)}${z.focus ? ' (Focus)' : ''}${z.id === S.commitment ? ' — your force' : ''}</option>`).join('')}</select></label>
      <label class="f"><span>Tier</span><select id="gm-tier" name="tier"><option value="auto">Auto (scale, focus, table-ready units)</option>${TIERS.map((t, i) => `<option value="${i}">${t.name}</option>`).join('')}</select></label>
      <label class="f"><span>Setup diagram</span><select id="gm-layout" name="layout"><option value="full">Full table layout</option><option value="zones">Zones and objectives only</option></select></label>
      <label class="chk" style="align-self:end"><input type="checkbox" name="bigPiece" id="gm-big" checked> Use a Large centerpiece if one is in the inventory</label>
      <div class="row" style="align-items:end"><button class="btn primary" type="submit" ${S.zones.length && !S.pendingDice ? '' : 'disabled'}>Generate</button></div></form></div>`;
  const list = S.missions.length ? `<div class="panel"><h3>Mission log</h3><div class="tblwrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Stardate</th><th>Region</th><th>Tier</th><th>Theme</th><th>Status</th></tr></thead><tbody>
    ${S.missions.map(x => `<tr class="${m && x.id === m.id ? 'sel' : ''}"><td class="mono">${x.sd}</td><td>${esc(x.regionName)}</td><td>${x.tierName}</td><td><button class="btn sm" type="button" data-act="openm" data-id="${x.id}">${esc(x.theme)}</button></td><td>${x.status === 'complete' ? `<span class="pill ${x.result.outcome === 'Victory' ? 'good' : x.result.outcome === 'Draw' ? 'warn' : 'crit'}">${x.result.outcome}</span>` : '<span class="pill mute">Planned</span>'}</td></tr>`).join('')}</tbody></table></div></div>` : '';
  return `${gen}${m ? missionDetail(m) : '<div class="empty">No missions yet. Generate one above, or from a region on the map.</div>'}${list}`;
}
function missionDetail(m){
  const T = TIERS[m.tier]; const units = m.force.map(id => S.roster.units.find(u => u.id === id)).filter(Boolean); const zz = S.zones.find(z => z.id === m.zoneId);
  const rules = [];
  if (S.mods.ia) rules.push('Independent Action: 1.5× movement and ranges, per-figure suppression and Reaction, Pinned replaces Broken, Piercing ignores saves, Anti-Tank, Sniping, Stream line template');
  if (S.mods.strictOverwatch) rules.push('Strict Overwatch'); if (S.mods.individualActions) rules.push('Individual Actions'); if (S.mods.retreat) rules.push('Retreat'); if (S.mods.landSomewhere) rules.push('It Has to Land Somewhere');
  const e = m.enemy; let enemyHtml = '';
  const myPts = units.reduce((a, u) => a + tplPoints(tplOf(u)).v, 0);
  if (e.mode === 'during'){
    enemyHtml = `<p>Generated during the battle at <b>${e.level}</b> force level: no more than <b>${e.cap}</b> enemy units arrive in total (${e.total} so far). Roll each round's arrivals as you reach it.</p>
      <div class="stack" style="gap:6px">${e.rounds.map((arr, i) => `<div class="choice"><span class="lbl">Round ${i + 1}</span><div class="t small">${arr.map(a => a.slots.length ? a.slots.map(s => { const mm = slotToModel(s); return `<div><b>${esc(mm.name)}</b>${mm.mapped ? '' : ' <span class="pill warn">no model mapped</span>'} <span class="mono muted">D100 ${a.roll}</span><div class="muted">${esc(PLACEMENT[s])}</div></div>`; }).join('') : `<div class="muted">D100 ${a.roll}: ${esc(a.note)}</div>`).join('')}</div></div>`).join('')}
      ${e.rounds.length < 6 && m.status !== 'complete' ? `<button class="btn" type="button" data-act="reveal" data-id="${m.id}" ${S.pendingDice ? 'disabled' : ''}>Roll round ${e.rounds.length + 1} arrivals</button>` : ''}</div>`;
  } else {
    const ePts = (e.list || []).reduce((a, x) => a + (x.pts || 0), 0);
    enemyHtml = `${e.note ? `<p class="small muted">${esc(e.note)}</p>` : `<p>Generated before the battle: enemy unit count <b>${e.count}</b> against your <b>${m.pCount}</b>${S.mods.points && ePts ? `; about <b>${ePts}</b> pts against your <b>${myPts}</b>` : ''}.</p>`}<ul>${e.list.map(x => `<li><b>${esc(x.label)}</b>${x.slot ? ` <span class="muted small">(${SLOT_LABEL[x.slot]})</span>` : ''}${x.mapped === false ? ' <span class="pill warn">no model mapped</span>' : ''}</li>`).join('')}</ul>`;
  }
  const learn = { 'Skirmish':['Squads fight as individuals and Morale tests are off, so every figure\'s position matters.','Objectives arrive after deployment and at the ends of rounds 1 and 2; keep one figure uncommitted.'],
    'Evolving Objective':['Objective natures stay hidden until contact; scout before you commit the squad.','You may break off at the end of any round and keep the VP earned. Decide each round whether one more VP is worth it.'],
    'Battle':['The Clock ends the fight around round 5 or 6; start the objective push by round 3.','Hold a reserve to answer the enemy\'s arrivals.'],
    'Grand Battle':['Vital ground scores at the end; hold it with infantry.','Protect your commander: losing them is worth 2 VP to the enemy.'] }[m.scenario];
  const depthTxt = m.scenario === 'Evolving Objective' ? 'Deploy within 6" of your edge; 12" sector belts carry the objectives.' : `Deployment zones ${m.layout.dep}" deep, ${m.table[1] - 2 * m.layout.dep}" of neutral ground between.`;
  const counts = { micro:0, small:0, medium:0, large:0 }; m.layout.terrain.forEach(p => counts[p.tier] = (counts[p.tier] || 0) + 1);
  const deb = m.debriefId && (S.scenes || []).find(x => x.id === m.debriefId);
  const form = m.status === 'complete' ? `<div class="banner stack"><h3>Result: ${m.result.outcome}${m.result.vp ? `, ${m.result.vp} VP` : ''}</h3><ul class="small" style="margin:0">${m.result.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="row"><button class="btn primary" type="button" data-act="packet" data-id="${m.id}">Copy scene packet for chat</button><span class="small muted">Everything a chat needs to write the full after-mission scene: result, key moments, cast and continuity.</span></div></div>
      ${deb ? sceneCard(deb) : ''}` : wizardPanel(m);
  const brief = m.briefing ? `<div class="panel stack"><div class="panel-h"><h3>Orders</h3><span class="small muted">${esc(vName(voiceById(m.briefing.voice)))}</span><button class="btn sm" type="button" data-act="copyorders" data-id="${m.id}">Copy</button></div><div class="orders">${esc(m.briefing.text)}</div></div>` : '';
  return brief + `<div class="panel stack"><div class="panel-h"><h3>Operation order · ${esc(m.regionName)}</h3><span class="chip">${m.tierName}</span><span class="chip">${m.scenario}</span><span class="mono small">Stardate ${m.sd}</span></div>
    <div class="oporder">
      <section><h4>Situation</h4><div>${m.stance === 'attack' ? 'Your forces are on the attack' : 'The enemy holds the initiative'} at ${esc(m.regionName)} (${m.regionType}). Point of interest: ${esc(m.poi)}.${zz ? ` Army Strength ${zz.P} against ${S.mods.fog && !zz.scouted ? '?' : zz.E}.` : ''}</div></section>
      <section><h4>Mission</h4><div><b>${esc(m.theme)}.</b><ul>${m.objectives.map(o => `<li><b>${esc(o.name)}</b> — ${esc(o.text)} <span class="muted small">(${esc(o.when)})</span></li>`).join('')}${m.secondary ? `<li>Secondary: <b>${esc(m.secondary)}</b> (+1 VP, +1 story point)</li>` : ''}</ul></div></section>
      <section><h4>Friendly forces</h4><div>${units.length ? `<ul>${units.map(u => `<li><b>${esc(u.name)}</b> — ${u.figures.filter(f => f.status === 'active').length} fit figures${u.condition.state === 'Weakened' ? ', one fewer (Weakened)' : ''}${S.mods.points ? ` · ${tplPoints(tplOf(u)).v} pts` : ''}</li>`).join('')}</ul><div class="small muted">Unit count ${m.pCount} · ${m.figures} figures · tier force: ${esc(T.force)}</div>` : '<span class="pill crit">No deployable units</span>'}${m.notes.map(n => `<div class="small" style="color:var(--warn)">${esc(n)}</div>`).join('')}</div></section>
      <section><h4>Enemy forces</h4><div><div class="small muted">${esc(e.faction)} · personality ${esc(personality('E'))}</div>${enemyHtml}</div></section>
      <section><h4>Off-table assets</h4><div>${m.support.length ? `<ul>${m.support.map(s => `<li>${esc(s.name)} at ${s.tn}+${s.banked ? ' (banked)' : ''}</li>`).join('')}</ul><div class="small muted">2D6 + Savvy to call; each success raises the number by 2.</div>` : '<span class="muted">None at this tier.</span>'}</div></section>
      <section><h4>Terrain and deployment</h4><div>${m.table[0]}" × ${m.table[1]}" table, ${esc(m.length)}. ${depthTxt}
        ${m.conditions.length ? `<ul>${m.conditions.map(c => `<li><b>${esc(c[0])}</b> — ${esc(c[1])}</li>`).join('')}</ul>` : '<div class="small muted">No battlefield conditions rolled.</div>'}
        ${rules.length ? `<div class="small"><b>Rules in force:</b> ${rules.map(esc).join('; ')}.</div>` : ''}</div></section>
      <section><h4>Setup diagram</h4><div class="stack">
        <div class="seg" role="group" aria-label="Diagram mode"><button type="button" aria-pressed="${m.layoutMode === 'full'}" data-act="lmode" data-id="${m.id}" data-k="full">Full table layout</button><button type="button" aria-pressed="${m.layoutMode === 'zones'}" data-act="lmode" data-id="${m.id}" data-k="zones">Zones and objectives only</button></div>
        <div class="layoutbox">${layoutSVG(m)}</div>
        ${m.layoutMode === 'full' ? `<div class="row small"><span><span class="swq" style="background:var(--ink);opacity:.85"></span>Large</span><span><span class="swq" style="background:var(--muted)"></span>Medium</span><span><span class="swq" style="background:var(--neutral);opacity:.6"></span>Small</span><span><span class="swq" style="background:var(--ink);opacity:.35"></span>Micro</span><span class="muted">Dashed outline: Area · ellipse: Hill · red: Impassable</span></div>` : ''}
        <div class="row small"><button class="btn sm" type="button" data-act="relayout" data-id="${m.id}">Reroll terrain</button>${m.layoutMode === 'full' ? `<span class="muted">Placed ${counts.large} large, ${counts.medium} medium, ${counts.small} small, ${counts.micro} micro${m.layout.unused ? `; ${m.layout.unused} left in the box` : ''}. ${m.layout.lanes.filter(l => !l.fixed).length ? `<span style="color:var(--warn)">${m.layout.lanes.filter(l => !l.fixed).length} open lane(s) remain edge to edge.</span>` : 'No open lanes edge to edge.'}</span>` : ''}</div></div></section>
      <section><h4>Designer notes</h4><div><ul>${learn.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div></section>
    </div></div>${form}`;
}
