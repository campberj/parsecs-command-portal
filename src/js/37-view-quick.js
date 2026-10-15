/* ----- quick battle ----- */
function qbForm(){
  const facs = qbFactions(); const f = S.ui.qform || { tier:'1', points:'', player:S.setup.player, opponent:'', strength:'even', region:'', layout:'full', big:true, seed:'' };
  const facSel = (name, id, sel) => `<select name="${name}" id="${id}"><option value="">Random</option>${facs.map(x => `<option value="${x.id}" ${sel === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
  return `<form class="panel stack" data-form="quick"><div class="panel-h"><h3>Quick battle</h3><span class="small muted">A one-off battle between any two factions. Nothing here touches your campaign.</span></div>
    <div class="form-grid">
      <label class="f"><span>Scale</span><select name="tier" id="qb-tier">${TIERS.map((t, i) => `<option value="${i}" ${String(f.tier) === String(i) ? 'selected' : ''}>${t.name}: ${esc(t.force)}, ${QB_POINTS[i]} pts</option>`).join('')}</select></label>
      <label class="f"><span>Points (blank = scale default)</span><input type="number" min="20" step="5" name="points" id="qb-points" value="${esc(f.points)}" placeholder="${QB_POINTS[parseInt(f.tier, 10) || 0]}"></label>
      <label class="f"><span>Your force</span><select name="playerList" id="qb-plist"><option value="">Auto-build from a faction</option>${LISTS.map(l => `<option value="${l.id}" ${f.playerList === l.id ? 'selected' : ''}>List: ${esc(l.name)} (${listTotals(l).pts} pts)</option>`).join('')}</select></label>
      <label class="f"><span>Your faction (when auto-building)</span>${facSel('player', 'qb-player', f.player)}</label>
      <label class="f"><span>Opponent force</span><select name="oppList" id="qb-olist"><option value="">Rolled on Random Enemy Forces</option>${LISTS.map(l => `<option value="${l.id}" ${f.oppList === l.id ? 'selected' : ''}>List: ${esc(l.name)} (${listTotals(l).pts} pts)</option>`).join('')}</select></label>
      <label class="f"><span>Opponent faction (when rolled)</span>${facSel('opponent', 'qb-opp', f.opponent)}</label>
      <label class="f"><span>Enemy strength</span><select name="strength" id="qb-str">${[['even','Even (same points)'],['outnumbered','Outnumbered (+25%)'],['overmatched','Overmatched (+50%)']].map(([k, l]) => `<option value="${k}" ${f.strength === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f"><span>Setting</span><select name="region" id="qb-region"><option value="">Random</option>${REGION_TYPES.map(r => `<option ${f.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
      <label class="f"><span>Setup diagram</span><select name="layout" id="qb-layout"><option value="full" ${f.layout === 'full' ? 'selected' : ''}>Full table layout</option><option value="zones" ${f.layout === 'zones' ? 'selected' : ''}>Zones and objectives only</option></select></label>
      <label class="f"><span>Seed (blank for random)</span><input type="text" name="seed" id="qb-seed" value="${esc(f.seed || '')}"></label></div>
    <label class="chk"><input type="checkbox" name="big" id="qb-big" ${f.big !== false ? 'checked' : ''}> Use a Large centerpiece if one is in the terrain inventory</label>
    <div class="row"><button class="btn primary" type="submit" ${facs.length < 2 ? 'disabled' : ''}>Generate quick battle</button><span class="small muted">${facs.length < 2 ? 'Import or build a second faction with unit templates first.' : 'Forces are built from each faction\'s templates; the enemy mix comes from the Random Enemy Forces table, matched to the points.'}</span></div></form>`;
}
function qbForceTable(rows, enemy){
  const mm = moveMult();
  const body = rows.map(r => { const t = r.unit ? tplOf(r.unit) : null; const p = t && t.profile;
    const weps = t ? [...new Set(weaponIdsOf(t).map(id => weaponOf(id) ? weaponOf(id).name : '').filter(Boolean))] : [];
    return `<tr><td><b>${esc(r.unit ? r.unit.name : r.label)}</b>${t && !r.unit.name.startsWith(t.name) ? `<div class="small muted">${esc(t.name)}</div>` : ''}${!t ? ' <span class="pill warn">no template mapped</span>' : ''}</td>
      <td class="small">${t ? `${t.troop}${t.level ? ' · ' + t.level : ''}` : esc(SLOT_LABEL[r.slot] || '')}</td><td class="num mono">${r.unit ? r.unit.figures.length : '—'}</td>
      ${p ? `<td class="mono">${half(p.sp * mm)}"</td><td class="mono num">${p.re}</td><td class="mono num">${sgn(p.cs)}</td><td class="mono num">${p.t}</td><td class="mono num">${p.kp}</td><td class="mono">${esc(p.save)}</td>` : '<td colspan="6" class="muted small">Generic book profile</td>'}
      <td class="small">${esc(weps.join(', ')) || '—'}${t && (t.rules || []).length ? `<div class="muted">${esc(t.rules.map(x => x.split(':')[0]).join(' · '))}</div>` : ''}</td>
      ${enemy ? `<td class="small">${esc(r.deploy || '')}</td>` : ''}<td class="num mono">${r.pts}</td></tr>`; }).join('');
  const total = rows.reduce((a, r) => a + r.pts, 0);
  return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Unit</th><th>Type</th><th class="num">Figs</th><th>Spd</th><th class="num">Re</th><th class="num">Cs</th><th class="num">T</th><th class="num">KP</th><th>Save</th><th>Weapons and rules</th>${enemy ? '<th>Deployment</th>' : ''}<th class="num">Pts</th></tr></thead>
    <tbody>${body}<tr><td colspan="${enemy ? 11 : 10}" class="small muted">${rows.length} units · ${rows.reduce((a, r) => a + (r.unit ? r.unit.figures.length : 0), 0)} figures</td><td class="num mono"><b>${total}</b></td></tr></tbody></table></div>`;
}
function viewQuick(){
  const q = S.quick; if (!q) return qbForm() + '<div class="empty">Pick a scale and the factions, then generate. Leave a faction on Random to have it chosen for you.</div>';
  const pf = factionOf(q.player.faction), ef = factionOf(q.opp.faction);
  const mine = q.units.map(u => ({ unit:u, pts:tplPoints(tplOf(u)).v }));
  const btn = (k, l) => `<button class="btn sm" type="button" data-act="qreroll" data-k="${k}">${l}</button>`;
  const rules = []; if (S.mods.ia) rules.push('Independent Action: 1.5× movement and ranges, per-figure suppression and Reaction');
  if (S.mods.strictOverwatch) rules.push('Strict Overwatch'); if (S.mods.individualActions) rules.push('Individual Actions'); if (S.mods.retreat) rules.push('Retreat');
  const scaleWarn = prescaled(pf) !== prescaled(ef) ? `<div class="banner small">${esc(prescaled(pf) ? pf.name : ef.name)} uses pre-scaled (×1.5) distances and ${esc(prescaled(pf) ? ef.name : pf.name)} uses book distances. Set the scale on the Mods tab before you play.</div>` : '';
  const counts = { micro:0, small:0, medium:0, large:0 }; q.layout.terrain.forEach(p => counts[p.tier] = (counts[p.tier] || 0) + 1);
  const depthTxt = q.scenario === 'Evolving Objective' ? 'Deploy within 6" of your edge; 12" sector belts carry the objectives.' : `Deployment zones ${q.layout.dep}" deep, ${q.table[1] - 2 * q.layout.dep}" of neutral ground between.`;
  const size = S.ui.qsize || '35';
  return qbForm() + scaleWarn + `<div class="panel stack"><div class="panel-h"><h3>${esc(q.player.name)} vs ${esc(q.opp.name)}</h3><span class="chip">${q.tierName}</span><span class="chip">${q.scenario}</span><span class="chip">${q.points} pts${q.strength !== 'even' && !q.opp.list ? ` · enemy ${q.strength}` : ''}</span>${q.player.list || q.opp.list ? '<span class="chip">from your lists</span>' : ''}<span class="mono small muted">seed ${esc(q.seed)}</span>
      <label class="f" style="margin-left:auto"><span class="sr-only">Card size</span><select id="qb-size" data-chg="qsize"><option value="35" ${size === '35' ? 'selected' : ''}>3" × 5" cards</option><option value="46" ${size === '46' ? 'selected' : ''}>4" × 6" cards</option></select></label>
      <label class="f"><span class="sr-only">Paper</span>${paperSelect('qb-paper')}</label>
      <button class="btn primary sm" type="button" data-act="qprint">Print battle pack</button><button class="btn sm" type="button" data-act="qclear">Clear</button></div>
    <div class="oporder">
      <section><h4>Situation</h4><div>${q.stance === 'attack' ? 'You are on the attack' : 'The enemy holds the initiative'} in ${/^[aeiou]/i.test(q.regionType) ? 'an' : 'a'} ${esc(q.regionType.toLowerCase())} sector. Point of interest: ${esc(q.poi)}.</div></section>
      <section><h4>Mission</h4><div><b>${esc(q.theme)}.</b><ul>${q.objectives.map(o => `<li><b>${esc(o.name)}</b> — ${esc(o.text)} <span class="muted small">(${esc(o.when)})</span></li>`).join('')}${q.secondary ? `<li>Secondary: <b>${esc(q.secondary)}</b></li>` : ''}</ul><div class="row">${btn('objectives', 'Reroll objectives')}</div></div></section>
      <section><h4>Your forces</h4><div class="stack"><div class="small muted">${esc(q.player.name)} · deploy in your zone, up to ${q.layout.dep}" from your edge</div>${qbForceTable(mine, false)}<div class="row">${btn('forces', 'Reroll both forces')}</div></div></section>
      <section><h4>Enemy forces</h4><div class="stack"><div class="small muted">${esc(q.opp.name)} · personality ${esc((ef && ef.personality) || 'Methodical')}${q.tier >= 3 ? ' · half deploy at the start, the rest arrive in rounds 2 and 3' : ''}</div>${qbForceTable(q.eunits, true)}</div></section>
      <section><h4>Off-table assets</h4><div>${q.support.length ? `<ul>${q.support.map(s => `<li>${esc(s.name)} at ${s.tn}+</li>`).join('')}</ul><div class="small muted">2D6 + Savvy to call; each success raises the number by 2.</div>` : '<span class="muted">None at this scale.</span>'}</div></section>
      <section><h4>Terrain and deployment</h4><div>${q.table[0]}" × ${q.table[1]}" table, ${esc(q.length)}. ${depthTxt}
        ${q.conditions.length ? `<ul>${q.conditions.map(c => `<li><b>${esc(c[0])}</b> — ${esc(c[1])}</li>`).join('')}</ul>` : '<div class="small muted">No battlefield conditions rolled.</div>'}
        ${rules.length ? `<div class="small"><b>Rules in force:</b> ${rules.map(esc).join('; ')}.</div>` : ''}<div class="row">${btn('conditions', 'Reroll conditions')}</div></div></section>
      <section><h4>Setup diagram</h4><div class="stack">
        <div class="seg" role="group" aria-label="Diagram mode"><button type="button" aria-pressed="${q.layoutMode === 'full'}" data-act="qlmode" data-k="full">Full table layout</button><button type="button" aria-pressed="${q.layoutMode === 'zones'}" data-act="qlmode" data-k="zones">Zones and objectives only</button></div>
        <div class="layoutbox">${layoutSVG(q)}</div>
        <div class="row small">${btn('terrain', 'Reroll terrain')}<span class="muted">Placed ${counts.large} large, ${counts.medium} medium, ${counts.small} small, ${counts.micro} micro from your terrain inventory${q.layout.unused ? `; ${q.layout.unused} left in the box` : ''}.</span></div></div></section>
    </div></div>`;
}
let CARD_LABEL = null;
function quickCards(q, size){
  const cls = size === '46' ? 'c46' : ''; const out = []; CARD_LABEL = `Quick battle · ${q.player.name} vs ${q.opp.name}`;
  try {
    out.push(missionCardPrint({ ...q, regionName:`${q.player.name} vs ${q.opp.name}` }, cls));
    q.units.forEach(u => out.push(...unitCardsPrint(u, cls)));
    q.eunits.filter(e => e.unit).forEach(e => out.push(...unitCardsPrint(e.unit, cls)));
    const rules = []; [...new Set([q.player.faction, q.opp.faction, ...q.units.map(u => (tplOf(u) || {}).faction), ...q.eunits.filter(e => e.unit).map(e => (tplOf(e.unit) || {}).faction)])].map(factionOf).filter(Boolean).forEach(f => (f.rules || []).forEach(r => rules.push(`${f.name} — ${r.name}: ${r.text}`)));
    if (S.mods.ia) rules.push('Independent Action: 1.5× movement and ranges; per-figure suppression and Reaction; Pinned replaces Broken.');
    if (rules.length) out.push(`<div class="icard ${cls}"><h5>Rules in force<small>reference</small></h5><ol style="margin:0;padding-left:14px">${rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${cardFoot(1, 1)}</div>`);
  } finally { CARD_LABEL = null; }
  return out;
}
function printQuick(){ const size = S.ui.qsize || '35'; printCards(quickCards(S.quick, size), size); }
function layoutSVG(m){
  const L = m.layout; const s = 12, pad = 26; const W = L.W * s, H = L.H * s; const full = m.layoutMode === 'full';
  let g = `<svg viewBox="0 0 ${W + pad * 2} ${H + pad * 2}" width="${W + pad * 2}" role="img" aria-label="Table setup, ${L.W} by ${L.H} inches"><rect x="${pad}" y="${pad}" width="${W}" height="${H}" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>`;
  for (let x = 6; x < L.W; x += 6) g += `<line x1="${pad + x * s}" y1="${pad}" x2="${pad + x * s}" y2="${pad + H}" stroke="var(--line)" stroke-width="${x % 12 ? 0.5 : 1}"/>`;
  for (let y = 6; y < L.H; y += 6) g += `<line x1="${pad}" y1="${pad + y * s}" x2="${pad + W}" y2="${pad + y * s}" stroke="var(--line)" stroke-width="${y % 12 ? 0.5 : 1}"/>`;
  const dep = L.dep * s;
  g += `<rect x="${pad}" y="${pad}" width="${W}" height="${dep}" fill="var(--enemy)" opacity="0.12"/><rect x="${pad}" y="${pad + H - dep}" width="${W}" height="${dep}" fill="var(--player)" opacity="0.12"/>`;
  g += `<text x="${pad + 8}" y="${pad + 16}" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="var(--enemy)">ENEMY DEPLOYMENT · ${L.dep}"</text><text x="${pad + 8}" y="${pad + H - 8}" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="var(--player)">YOUR DEPLOYMENT · ${L.dep}"</text>`;
  if (m.scenario === 'Evolving Objective'){ for (let y = 12; y < L.H; y += 12) g += `<line x1="${pad}" y1="${pad + H - y * s}" x2="${pad + W}" y2="${pad + H - y * s}" stroke="var(--accent)" stroke-dasharray="6 4"/><text x="${pad + W - 6}" y="${pad + H - y * s - 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--accent)">${y}"</text>`; }
  if (m.tier === 4) g += `<text x="${pad - 10}" y="${pad + H / 2}" transform="rotate(-90 ${pad - 10} ${pad + H / 2})" text-anchor="middle" font-size="10" font-family="IBM Plex Sans, sans-serif" fill="var(--muted)">outflank edge</text>`;
  if (full){
    L.terrain.forEach(p => { const x = pad + p.x * s, y = pad + p.y * s, w = p.w * s, h = p.h * s; const op = { large:0.85, medium:0.55, small:0.4, micro:0.3 }[p.tier] || 0.5;
      if (p.rules === 'Hill') g += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="var(--surface-2)" stroke="var(--muted)"/><ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 3.4}" ry="${h / 3.4}" fill="none" stroke="var(--muted)" stroke-dasharray="3 3"/>`;
      else if (p.rules === 'Area') g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2.4}" fill="var(--good)" fill-opacity="${p.tier === 'micro' ? 0.25 : 0.16}" stroke="var(--good)" stroke-dasharray="4 3"/>`;
      else if (p.rules === 'Impassable') g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="var(--crit)" fill-opacity="0.18" stroke="var(--crit)"/>`;
      else if (p.rules === 'Linear') g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--ink)" fill-opacity="${p.tier === 'micro' ? 0.5 : 0.75}"/>`;
      else if (p.rules === 'Building'){ g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--muted)" fill-opacity="${op}" stroke="var(--ink)" stroke-width="${p.tier === 'large' ? 2 : 1}"/>`; if (p.tier === 'large') g += `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h * 0.6}" stroke="var(--surface)" stroke-width="2"/><line x1="${x}" y1="${y + h / 2}" x2="${x + w * 0.4}" y2="${y + h / 2}" stroke="var(--surface)" stroke-width="2"/>`; }
      else if (p.rules === 'Solid') g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--neutral)" fill-opacity="0.75" stroke="var(--ink)" stroke-width="0.8"/>`;
      else g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${p.tier === 'micro' ? 4 : 1}" fill="var(--neutral)" fill-opacity="${op}" stroke="var(--ink)" stroke-width="0.6"/>`;
      if (p.tier !== 'micro' && p.w * p.h >= 20) g += `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-size="10.5" font-family="IBM Plex Sans, sans-serif" fill="var(--ink)" paint-order="stroke" stroke="var(--surface)" stroke-width="3">${esc(p.name)}</text>`; });
  }
  L.obj.forEach(o => { const x = pad + o.x * s, y = pad + o.y * s; g += `<circle cx="${x}" cy="${y}" r="11" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="600" font-family="IBM Plex Mono, monospace" fill="var(--accent-ink)">${esc(o.label)}</text>`; });
  g += `<text x="${pad + W / 2}" y="${pad + H + 18}" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="var(--muted)">${L.W}" · grid 6"</text><text x="${pad + W + 14}" y="${pad + H / 2}" transform="rotate(90 ${pad + W + 14} ${pad + H / 2})" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="var(--muted)">${L.H}"</text>`;
  return g + `</svg>`;
}

