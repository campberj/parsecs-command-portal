/* ----- forces ----- */
const sgn = v => (v >= 0 ? '+' : '') + v;
function statsBlock(p){
  const mm = moveMult(); const sp = half(p.sp * mm);
  return `<div class="stats"><div><div class="k">Speed</div><div class="v ${mm !== 1 ? 'mod' : ''}">${sp}"</div>${mm !== 1 ? `<div class="k">book ${p.sp}"</div>` : ''}</div>
    <div><div class="k">React</div><div class="v">${p.re}</div></div><div><div class="k">Combat</div><div class="v">${sgn(p.cs)}</div></div><div><div class="k">Tough</div><div class="v">${p.t}</div></div>
    <div><div class="k">KP</div><div class="v">${p.kp}</div></div><div><div class="k">Savvy</div><div class="v">${sgn(p.sv)}</div></div><div><div class="k">Training</div><div class="v">${sgn(p.tr)}</div></div><div><div class="k">Save</div><div class="v">${esc(p.save)}</div></div></div>`;
}
const UNLIMITED = 999;
function weaponLine(id){ const w = weaponOf(id); if (!w) return ''; const rm = rangeMult(); const rng = w.range >= UNLIMITED ? 'Unlimited' : w.range ? `${half(w.range * rm)}"${rm !== 1 ? ` <span class="muted">(${w.range}")</span>` : ''}` : 'Melee';
  return `<tr><td><b>${esc(w.name)}</b> <span class="muted small">${esc(w.base)}</span></td><td class="mono">${rng}</td><td class="mono num">${w.shots || '—'}</td><td class="mono num">${esc(w.dmg)}</td><td class="small">${w.traits.map(esc).join(', ') || '—'}</td></tr>`; }
function ptsChip(t){ if (!S.mods.points) return ''; const p = tplPoints(t); return `<span class="chip" title="${p.est ? 'Estimated from the fitted per-figure formula until the Master Points Costs table is keyed in' : 'Entered by hand'}">${p.v} pts${p.est ? ' est.' : ''}</span>`; }
function condPill(c){ const m = { Okay:'good', Weakened:'warn', Devastated:'crit', Lost:'crit' }; return `<span class="pill ${m[c.state] || 'mute'}">${c.state}${c.battles ? ` · ${c.battles} battle${c.battles > 1 ? 's' : ''}` : ''}</span>`; }
function viewForces(){
  const pf = playerFaction(); const mine = S.armory.templates.filter(t => t.faction === pf.id);
  const playerTpls = mine.length ? mine : S.armory.templates.filter(t => t.side === 'player');
  const total = S.roster.units.reduce((a, u) => a + tplPoints(tplOf(u)).v, 0);
  return `<div class="panel"><div class="panel-h"><h3>${esc(S.roster.formations[0].name)}</h3><span class="pill info">${esc(pf.name)}</span>${S.roster.origin === 'starter' ? '<span class="pill mute">Starter force</span>' : S.roster.units.some(u => u.id === 'u-stahl') ? '<span class="example">Example data</span>' : ''}</div>
      <div class="row small"><span>${S.roster.units.length} units · ${S.roster.units.reduce((a, u) => a + u.figures.filter(f => f.status !== 'kia').length, 0)} figures · unit count ${S.roster.units.reduce((a, u) => a + unitCountOf(u), 0)}</span>
      ${S.mods.points ? `<span class="pill info">Army Builder points: ${total} est.</span>` : ''}<span class="muted">Campaign Points ${S.cp}</span>${moveMult() !== 1 ? `<span class="pill warn">Movement ×${moveMult()} · ranges ×${rangeMult()} from mods</span>` : ''}</div><hr>
      <form class="row" data-form="addunit">
        <label class="f"><span>Add unit from template</span><select id="add-tpl" name="tpl">${playerTpls.map(t => `<option value="${t.id}">${esc(t.name)}${S.mods.points ? ` (${tplPoints(t).v} pts)` : ''}</option>`).join('')}</select></label>
        <label class="f"><span>Unit name</span><input type="text" id="add-name" name="name" placeholder="Leave blank to use the template name"></label>
        <label class="chk"><input type="checkbox" id="add-pay" name="pay" checked> Pay ${RP('rosterAdd')} CP (Roster Addition)</label>
        <button class="btn primary" type="submit">Add unit</button>
        <button class="btn" type="button" data-act="atabgo" data-k="builder">Build a new template…</button>
      </form><hr>
      <div class="row"><button class="btn primary" type="button" data-act="packopen">Battle pack (index cards)…</button><button class="btn" type="button" data-act="rosterexp">Export roster JSON</button><button class="btn" type="button" data-act="importopen">Import units or lists…</button>
        <span class="small muted">Import shows what is new or changed before anything is applied.</span></div></div>
    ${S.ui.pack ? packPanel() : ''}
    ${S.roster.units.map(unitCard).join('') || '<div class="empty">No units on the roster. Add one above.</div>'}
    ${S.roster.history.length ? `<div class="panel"><h3>Service history</h3><div class="tblwrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Unit</th><th>Reason</th><th>Where</th><th>Stardate</th></tr></thead><tbody>${S.roster.history.map(h => `<tr><td>${esc(h.unit)}</td><td>${esc(h.reason)}</td><td>${esc(h.region || '—')}</td><td class="mono">${esc(h.sd)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
}
function statusPill(f){ return f.status === 'kia' ? '<span class="pill crit">KIA</span>' : f.status === 'wounded' ? `<span class="pill warn">Wounded${f.recover ? ` · ${f.recover} turn${f.recover > 1 ? 's' : ''}` : ''}</span>` : '<span class="pill good">Active</span>'; }
function advChips(f){ return Object.entries(f.adv || {}).filter(([, v]) => v).map(([k, v]) => `<span class="chip">${(ADV_STATS.find(a => a[0] === k) || [k, k])[1]} ${sgn(v)}</span>`).join(' '); }
function tokenDots(f){ return f.tokens ? `<span title="${f.tokens} ${esc(S.content.tokenName || 'token')}${f.tokens > 1 ? 's' : ''}">${'<span class="tok"></span>'.repeat(Math.min(f.tokens, 6))}</span>` : ''; }
function figDetail(u, f){
  const p = figProfile(u, f); const lo = figLoadout(u, f); const own = !!(f.loadout && f.loadout.length); const opts = advOptions(u, f);
  const fv = voiceForFig(f);
  return `<tr><td colspan="9"><div class="figdet">
    <div class="row"><b>${esc(f.name)}</b>${advChips(f)}${fv ? `<span class="chip" title="${esc(fv.voice)}">Voice card</span>` : ''}<span class="spacer"></span><button class="btn sm" type="button" data-act="figclose">Close</button></div>
    ${p ? statsBlock(p) : ''}
    <div class="form-grid">
      <label class="f"><span>Name</span><input type="text" value="${esc(f.name)}" data-chg="figname" data-u="${u.id}" data-f="${f.id}" id="fname-${f.id}"></label>
      <label class="f"><span>Role</span><select data-chg="figrole" data-u="${u.id}" data-f="${f.id}" id="frole-${f.id}">${['sergeant','trooper','specialist','crew','leader','medic'].map(r => `<option ${f.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
      <label class="f"><span>Figure XP</span><input type="number" min="0" value="${f.xp || 0}" data-chg="figxp" data-u="${u.id}" data-f="${f.id}" id="fxp-${f.id}"></label>
      <label class="f"><span>${esc(S.content.tokenName || 'Tokens')}</span><input type="number" min="0" value="${f.tokens || 0}" data-chg="figtok" data-u="${u.id}" data-f="${f.id}" id="ftok-${f.id}"></label>
      <label class="f"><span>Kills</span><input type="number" min="0" value="${f.kills}" data-chg="figkills" data-u="${u.id}" data-f="${f.id}" id="fk-${f.id}"></label>
      <label class="chk" style="align-self:end"><input type="checkbox" data-chg="figacting" data-u="${u.id}" data-f="${f.id}" ${f.acting ? 'checked' : ''}> Acting leader</label>
      <label class="f"><span>Status</span><select data-chg="figstatus" data-u="${u.id}" data-f="${f.id}" id="fst-${f.id}">${['active','wounded','kia'].map(r => `<option ${f.status === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
    </div>
    ${opts.length ? `<div class="row small"><span class="lbl">Advance</span><select data-chg="figadv" data-u="${u.id}" data-f="${f.id}" id="fadv-${f.id}" aria-label="Buy an advance"><option value="">Spend figure XP…</option>${opts.map(o => `<option value="${o.stat}" ${f.xp < o.xp ? 'disabled' : ''}>${o.label} +${o.step} (${o.xp} XP)</option>`).join('')}</select>${rulesFlag('advance') === 'placeholder' ? '<span class="pill warn">costs are placeholders</span>' : ''}</div>` : ''}
    <form data-form="loadout" data-u="${u.id}" data-f="${f.id}"><fieldset><legend>Loadout ${own ? '(own kit)' : '(template default)'}</legend>
      <div class="wepgrid">${S.armory.weapons.filter(w => w.cat !== 'Vehicle').map(w => `<label class="chk small"><input type="checkbox" name="w" value="${w.id}" ${lo.includes(w.id) ? 'checked' : ''}> ${esc(w.name)}</label>`).join('')}</div>
      <div class="row" style="margin-top:6px"><button class="btn sm primary" type="submit">Save loadout</button>${own ? `<button class="btn sm" type="button" data-act="figreset" data-u="${u.id}" data-f="${f.id}">Back to template default</button>` : ''}</div></fieldset></form>
    <div class="row small"><span class="lbl">Awards</span>${f.awards.map((a, i) => `<span class="chip" title="${esc([a.sd, a.region, a.note].filter(Boolean).join(' · '))}">${esc(a.type)} <button class="btn sm" type="button" style="padding:0 4px" data-act="awdel" data-u="${u.id}" data-f="${f.id}" data-i="${i}" aria-label="Remove ${esc(a.type)}">×</button></span>`).join(' ') || '<span class="muted">none</span>'}
      <select class="small" data-chg="award" data-u="${u.id}" data-f="${f.id}" aria-label="Give award to ${esc(f.name)}"><option value="">Award…</option>${awardList().map(a => `<option value="${esc(a.name)}">${esc(a.name)}${a.xp ? ` (+${a.xp} XP)` : ''}${a.tokens ? ` (+${a.tokens} ${esc(S.content.tokenName || 'token')})` : ''}</option>`).join('')}</select></div>
    <label class="f"><span>Notes</span><textarea rows="3" data-chg="fignotes" data-u="${u.id}" data-f="${f.id}" id="fnotes-${f.id}">${esc(f.notes || '')}</textarea></label>
  </div></td></tr>`;
}
function unitCard(u){
  const t = tplOf(u); if (!t) return `<div class="panel">${esc(u.name)}: template missing. <button class="btn sm danger" type="button" data-act="unitdel" data-u="${u.id}">Remove from roster</button></div>`;
  const skillRows = R({ individual:'indSkills', team:'crewSkills', vehicle:'vehicleSkills' }[t.troop] || 'squadSkills'); const cpMode = S.mods.skillCurrency === 'cp';
  const maxSq = cpMode ? 1 : (S.mods.fcgSecondSkill ? 2 : 1); const unitKind = t.troop === 'individual' ? 'ind' : 'squad';
  const sqSkills = u.skills.filter(s => s.kind === 'squad' || s.kind === 'ind'), sgSkills = u.skills.filter(s => s.kind === 'sgt');
  const prem = n => n >= 1 ? RP('skillPremium') : 0; const cur = cpMode ? 'CP' : 'XP';
  const price = (s, have) => cpMode ? RP('skillCP') : Number(s.xp) + prem(have);
  const skillOpts = skillRows.filter(s => !u.skills.some(x => x.name === s.name)).map(s => { const c = price(s, sqSkills.length); return `<option value="${unitKind}|${esc(s.name)}|${c}">${esc(s.name)} (${c} ${cur}) — ${esc(s.text)}</option>`; }).join('');
  const sgOpts = t.troop === 'squad' ? R('sgtSkills').filter(s => !u.skills.some(x => x.name === s.name)).map(s => { const c = price(s, sgSkills.length); return `<option value="sgt|${esc(s.name)}|${c}">Sergeant: ${esc(s.name)} (${c} ${cur}) — ${esc(s.text)}</option>`; }).join('') : '';
  const retrain = cpMode ? [[sqSkills[0], skillRows, unitKind], [sgSkills[0], t.troop === 'squad' ? R('sgtSkills') : [], 'sgt']].filter(([have]) => have).map(([have, rows, kind]) => rows.filter(r => r.name !== have.name && !u.skills.some(x => x.name === r.name)).map(r => `<option value="retrain|${kind}|${esc(have.name)}|${esc(r.name)}">Retrain ${esc(have.name)} → ${esc(r.name)} (${RP('retrainCP')} CP)</option>`).join('')).join('') : '';
  const canSq = sqSkills.length < maxSq, canSg = sgSkills.length < maxSq; const fx = S.mods.figureXP;
  const figs = u.figures.map(f => `<tr class="${f.status === 'kia' ? 'kia' : ''}"><td><b>${esc(f.name)}</b>${f.acting ? ' <span class="pill info">Acting leader</span>' : ''} ${advChips(f)} ${tokenDots(f)}</td><td class="small">${esc(f.role)}${f.loadout && f.loadout.length ? `<div class="muted">${f.loadout.map(id => weaponOf(id) ? esc(weaponOf(id).name) : '').filter(Boolean).join(', ')}</div>` : ''}</td>
    <td>${statusPill(f)}</td>${fx ? `<td class="mono num">${f.xp || 0}</td>` : ''}<td class="mono num">${f.kills}</td><td class="mono num">${f.wounds}</td><td class="small">${f.awards.map(a => `<span class="chip" title="${esc([a.sd, a.note].filter(Boolean).join(' · '))}">${esc(a.type)}</span>`).join(' ') || '—'}</td>
    <td><button class="btn sm" type="button" data-act="figopen" data-f="${f.id}" aria-expanded="${S.ui.figOpen === f.id}">${S.ui.figOpen === f.id ? 'Hide' : 'Details'}</button></td></tr>${S.ui.figOpen === f.id ? figDetail(u, f) : ''}`).join('');
  const wids = [...new Set([...weaponIdsOf(t), ...u.figures.flatMap(f => f.loadout || [])])];
  return `<article class="unit" id="unit-${u.id}"><div class="unit-h"><h3>${esc(u.name)}</h3><span class="chip">${esc(t.name)}${t.variantOf ? ' · variant' : ''}</span>${ptsChip(t)}${condPill(u.condition)}
      <label class="chk small"><input type="checkbox" data-chg="ready" data-u="${u.id}" ${u.tableReady ? 'checked' : ''}> Table-ready</label>${S.mods.skillCurrency !== 'cp' ? `<span class="mono small">Unit XP ${u.xp}</span>` : ''}
      <button class="btn sm" type="button" data-act="custom" data-u="${u.id}" title="Give this unit its own copy of the template and open it in the builder">Customize</button>
      <button class="btn sm" type="button" data-act="unitexp" data-u="${u.id}">Export JSON</button>
      <select class="small" data-chg="remove" data-u="${u.id}" aria-label="Remove ${esc(u.name)}"><option value="">Remove…</option><option>KIA</option><option>MIA</option><option>Reassigned</option><option>Disbanded</option></select></div>
    <div class="unit-b"><div><span class="lbl">${t.leader ? 'Trooper' : 'Profile'}</span>${statsBlock(t.profile)}</div>${t.leader ? `<div><span class="lbl">Sergeant / leader</span>${statsBlock(t.leader)}</div>` : ''}
      <div class="tblwrap"><table class="tbl"><thead><tr><th>Weapon</th><th>Range</th><th class="num">Shots</th><th class="num">Dmg</th><th>Traits</th></tr></thead><tbody>${wids.map(weaponLine).join('')}</tbody></table></div>
      <div class="figs tblwrap"><table class="tbl"><thead><tr><th>Figure</th><th>Role</th><th>Status</th>${fx ? '<th class="num">XP</th>' : ''}<th class="num">Kills</th><th class="num">Wounds</th><th>Awards</th><th></th></tr></thead><tbody>${figs}</tbody></table></div>
      <div class="row small"><span class="lbl">Veteran skills</span>${u.skills.map(s => `<span class="chip">${esc(s.name)}</span>`).join('') || '<span class="muted">none yet</span>'}
        ${(canSq && skillOpts) || (canSg && sgOpts) || retrain ? `<select data-chg="skill" data-u="${u.id}" class="small" aria-label="Buy veteran skill"><option value="">${cpMode ? `Spend CP on a skill (you have ${S.cp})…` : 'Spend unit XP on a skill…'}</option>${canSq ? skillOpts : ''}${canSg ? sgOpts : ''}${retrain}</select>` : ''}</div>
      <form class="row" data-form="addfig" data-u="${u.id}"><label class="f"><span>Add figure</span><input type="text" name="name" id="nf-${u.id}" placeholder="Name"></label><label class="f"><span>Role</span><select name="role" id="nr-${u.id}"><option>trooper</option><option>sergeant</option><option>specialist</option><option>crew</option><option>medic</option></select></label><button class="btn sm" type="submit">Add</button></form>
      <label class="f"><span>Notes</span><textarea rows="2" data-chg="notes" data-u="${u.id}" id="notes-${u.id}">${esc(u.notes)}</textarea></label></div></article>`;
}

