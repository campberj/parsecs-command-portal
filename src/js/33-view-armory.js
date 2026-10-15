/* ----- armory ----- */
const ARM_TABS = [['templates','Unit templates'],['builder','Unit builder'],['weapons','Weapons'],['gear','Gear'],['factions','Factions'],['support','Support assets'],['minis','Miniatures'],['terrain','Terrain'],['import','Import / export']];
function viewArmory(){
  const t = S.ui.armoryTab || 'templates';
  const body = { templates:armTemplates, builder:armBuilder, weapons:armWeapons, gear:armGear, factions:armFactions, support:armSupport, minis:armMinis, terrain:armTerrain, import:armImport }[t]();
  return `<div class="panel"><div class="panel-h"><h3>Armory</h3><span class="example">Example data</span></div>
    <div class="seg" role="group" aria-label="Armory sections">${ARM_TABS.map(([k, l]) => `<button type="button" aria-pressed="${t === k}" data-act="atab" data-k="${k}">${l}</button>`).join('')}</div></div>${body}`;
}
function armTemplates(){
  const groups = [['player',`Your units (${esc(playerFaction().name)})`],['enemy','Other factions']];
  const mineT = x => x.faction ? x.faction === S.setup.player : x.side === 'player';
  return groups.map(([side, label]) => { const ts = S.armory.templates.filter(x => side === 'player' ? mineT(x) : !mineT(x));
    return `<div class="stack"><div class="row"><h3 style="flex:1">${label}</h3><button class="btn primary" type="button" data-act="newtpl" data-side="${side}">New ${side === 'player' ? 'unit' : 'enemy unit'}</button></div>
      <div class="cols-2">${ts.map(x => { const fac = factionOf(x.faction);
        return `<div class="panel"><div class="panel-h"><h3>${esc(x.name)}</h3><span class="pill ${side === 'player' ? 'info' : 'enemy'}">${esc(fac ? fac.name : 'No faction')}</span></div>
          <div class="row small" style="margin-bottom:6px"><span class="chip">${x.troop}${x.level ? ' · ' + x.level : ''}</span><span class="chip">${x.size} figure${x.size > 1 ? 's' : ''}</span>${ptsChip(x)}${(x.rules || []).map(r => `<span class="chip">${esc(r)}</span>`).join('')}</div>
          ${statsBlock(x.profile)}${x.leader ? `<div class="lbl" style="margin-top:6px">Leader</div>${statsBlock(x.leader)}` : ''}
          ${x.notes || x.source ? `<div class="small muted" style="margin-top:6px">${esc(x.notes || '')}${x.source ? ` <span class="chip">${esc(x.source)}</span>` : ''}</div>` : ''}
          <div class="small" style="margin-top:6px">${[...(x.weapons || []), ...(x.teamWeapons || []), ...(x.leaderWeapons || [])].map(id => weaponOf(id) ? esc(weaponOf(id).name) : '').filter(Boolean).join(' · ') || 'No weapons'}</div>
          <div class="row" style="margin-top:10px"><button class="btn sm" type="button" data-act="edittpl" data-id="${x.id}">Edit</button><button class="btn sm" type="button" data-act="duptpl" data-id="${x.id}">Duplicate</button><button class="btn sm danger" type="button" data-act="deltpl" data-id="${x.id}">Delete</button></div></div>`; }).join('') || '<div class="empty">None yet.</div>'}</div></div>`; }).join('<hr>');
}
function draftFromForm(f){
  const fd = new FormData(f); const num = (k, dflt) => { const v = parseFloat(fd.get(k)); return isNaN(v) ? dflt : v; };
  const prof = pre => ({ sp:num(pre + 'sp', 4), re:num(pre + 're', 2), cs:num(pre + 'cs', 0), t:num(pre + 't', 4), kp:num(pre + 'kp', 1), sv:num(pre + 'sv', 0), tr:num(pre + 'tr', 0), save:fd.get(pre + 'save') || '—' });
  const b = S.ui.builder || blankTemplate(); const profile = prof('p_');
  const leader = fd.get('hasLeader') ? (fd.get('l_sp') === null ? (b.leader || { ...profile, kp:profile.kp + 1 }) : prof('l_')) : null;
  return { ...b, name:(fd.get('name') || '').trim(), side:fd.get('side'), faction:fd.get('faction'), troop:fd.get('troop'), size:parseInt(fd.get('size'), 10) || 1, level:fd.get('level') || '',
    profile, leader, weapons:fd.getAll('w_all'), teamWeapons:fd.getAll('w_team'), leaderWeapons:fd.get('hasLeader') ? fd.getAll('w_lead') : [],
    rules:(fd.get('rules') || '').split(',').map(s => s.trim()).filter(Boolean), priceAs:fd.get('priceAs') || '', leaderPriceAs:fd.get('leaderPriceAs') || '', pointsMode:fd.get('pointsMode') || 'auto', points:parseInt(fd.get('points'), 10) || 0 };
}
function builderSide(){
  const b = S.ui.builder || blankTemplate(); const p = tplPoints(b); const iss = legality(b);
  const errs = iss.filter(i => i.lvl === 'err').length;
  return `<div class="panel stack"><h3>Points</h3>
    ${S.mods.points ? `<div><span class="ptsbig">${p.v}</span> <span class="small muted">${b.pointsMode === 'manual' ? 'pts, entered by hand' : b.priceAs ? `pts, priced as ${esc(b.priceAs)}${p.est ? ' (profile costs not yet verified)' : ''}` : 'pts, estimated from stats'}</span></div>
    ${b.pointsMode !== 'manual' && !b.priceAs ? '<p class="small muted">No book profile chosen, so each figure is estimated from its stats (fitted to 16 published FCG profiles, mean error under 1 point). Pick "Priced as" to use the Profile Costs table. Weapons add their listed cost per carrier.</p>' : b.priceAs ? '<p class="small muted">Per figure: the Profile Costs row, plus 2 for a 6+ save or 4 for a 5+ save (Powered or Breach armor). Weapons add their listed cost per carrier.</p>' : ''}` : '<p class="small muted">Army Builder points are switched off in Mods.</p>'}
    <h3>Army Builder check</h3>
    <p class="small muted">${S.mods.freeform ? 'Freeform units are on: issues are warnings only.' : 'Portal generalization of the Army Builder options; errors block saving unless freeform units are on in Mods.'}</p>
    ${iss.length ? `<ul class="legal">${iss.map(i => `<li class="${i.lvl}">${i.lvl === 'err' ? 'Error: ' : 'Note: '}${esc(i.msg)}</li>`).join('')}</ul>` : '<p class="small" style="color:var(--good)">Legal as built.</p>'}
    <div class="row"><button class="btn primary" type="button" data-act="savetpl" ${errs ? 'disabled' : ''}>${b.id ? 'Save changes' : 'Save as new template'}</button>${b.id ? '<button class="btn" type="button" data-act="savetplnew">Save as copy</button>' : ''}<button class="btn" type="button" data-act="cleartpl">Clear</button></div></div>`;
}
function armBuilder(){
  const b = S.ui.builder || blankTemplate(); const facs = S.armory.factions;
  const num = (pre, k, v, lab, step) => `<label class="f"><span>${lab}</span><input type="number" step="${step || 1}" name="${pre}${k}" id="${pre}${k}" value="${v}"></label>`;
  const profFields = (pre, p) => `<div class="form-grid tight">${num(pre, 'sp', p.sp, 'Speed')}${num(pre, 're', p.re, 'Reaction')}${num(pre, 'cs', p.cs, 'Combat')}${num(pre, 't', p.t, 'Toughness')}${num(pre, 'kp', p.kp, 'KP')}${num(pre, 'sv', p.sv, 'Savvy')}${num(pre, 'tr', p.tr, 'Training')}
    <label class="f"><span>Save</span><select name="${pre}save" id="${pre}save">${['—','6+','5+','4+'].map(s => `<option ${p.save === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>`;
  const wepBox = (name, sel, filter) => `<div class="wepgrid">${S.armory.weapons.filter(filter).map(w => `<label class="chk small"><input type="checkbox" name="${name}" value="${w.id}" ${sel.includes(w.id) ? 'checked' : ''}> ${esc(w.name)} <span class="muted">${w.cat}${S.mods.points ? ` · ${w.pts} pts` : ''}</span></label>`).join('')}</div>`;
  const ld = b.leader || { ...b.profile, kp:b.profile.kp + 1 };
  return `<div class="split"><div class="stack">
    <form class="panel stack" data-form="gen" id="genform"><div class="panel-h"><h3>Generate a unit</h3><span class="small muted">Fills the builder below; nothing is saved until you press Save.</span></div>
      <div class="form-grid">
        <label class="f"><span>Side</span><select name="side" id="gen-side"><option value="player">Yours</option><option value="enemy">Enemy</option></select></label>
        <label class="f"><span>Faction</span><select name="faction" id="gen-fac">${facs.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></label>
        <label class="f"><span>Role</span><select name="role" id="gen-role">${Object.entries(ROLES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label class="f"><span>Quality</span><select name="quality" id="gen-q">${Object.entries(QUALITY).map(([k, q]) => `<option value="${k}" ${k === 'regular' ? 'selected' : ''}>${q.name}</option>`).join('')}</select></label>
        <label class="f"><span>Target points (blank = any)</span><input type="number" min="0" name="budget" id="gen-budget" placeholder="80"></label>
        <label class="f"><span>Map to enemy slot (optional)</span><select name="slot" id="gen-slot"><option value="">—</option>${Object.entries(SLOT_LABEL).filter(([k]) => !VEHICLE_SLOTS.includes(k)).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
      </div><div class="row"><button class="btn primary" type="submit">Generate</button><span class="small muted">Uses weapons already in your armory, sized to the budget.</span></div></form>
    <form class="panel stack" data-form="builder" id="builderform"><div class="panel-h"><h3>${b.id ? 'Edit template' : 'New template'}</h3>${b.id ? `<span class="chip">${esc(b.id)}</span>` : ''}</div>
      <div class="form-grid">
        <label class="f" style="grid-column:span 2"><span>Name</span><input type="text" name="name" id="b-name" value="${esc(b.name)}" placeholder="Sturm pioneer squad"></label>
        <label class="f"><span>Side</span><select name="side" id="b-side"><option value="player" ${b.side === 'player' ? 'selected' : ''}>Yours</option><option value="enemy" ${b.side === 'enemy' ? 'selected' : ''}>Enemy</option></select></label>
        <label class="f"><span>Faction</span><select name="faction" id="b-fac">${facs.map(f => `<option value="${f.id}" ${b.faction === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
        <label class="f"><span>Troop type</span><select name="troop" id="b-troop">${['squad','team','individual','vehicle'].map(x => `<option ${b.troop === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="f"><span>Figures</span><input type="number" min="1" max="12" name="size" id="b-size" value="${b.size}"></label>
        <label class="f"><span>Character level</span><select name="level" id="b-level"><option value="">—</option>${['minor','major','epic'].map(x => `<option ${b.level === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      </div>
      <fieldset><legend>${b.troop === 'squad' ? 'Rank-and-file profile' : 'Profile'}</legend>${profFields('p_', b.profile)}</fieldset>
      <label class="chk"><input type="checkbox" name="hasLeader" id="b-hasleader" ${b.leader ? 'checked' : ''}> Has a sergeant or leader with its own profile</label>
      ${b.leader ? `<fieldset><legend>Sergeant / leader profile</legend>${profFields('l_', ld)}</fieldset>` : ''}
      <fieldset><legend>${b.troop === 'squad' ? 'Carried by every rank-and-file figure' : b.troop === 'vehicle' ? 'Mounted weapons' : 'Weapons'}</legend>${wepBox('w_all', b.weapons || [], w => b.troop === 'vehicle' ? true : w.cat !== 'Vehicle')}</fieldset>
      ${b.troop !== 'individual' ? `<fieldset><legend>${b.troop === 'team' ? 'Crew-served weapon' : 'Team weapon (one figure carries it)'}</legend>${wepBox('w_team', b.teamWeapons || [], w => ['Team','Crewed','Vehicle'].includes(w.cat))}</fieldset>` : ''}
      ${b.leader ? `<fieldset><legend>Leader carries</legend>${wepBox('w_lead', b.leaderWeapons || [], w => w.cat !== 'Vehicle')}</fieldset>` : ''}
      <div class="form-grid">
        <label class="f" style="grid-column:span 2"><span>Special rules (comma separated)</span><input type="text" name="rules" id="b-rules" value="${esc((b.rules || []).join(', '))}" placeholder="Leader, Hero, Fearless"></label>
        <label class="f"><span>Priced as (book profile)</span><select name="priceAs" id="b-price"><option value="">Estimate from stats</option>${R('profileCosts').map(r => `<option ${b.priceAs === profileKey(r) ? 'selected' : ''}>${esc(profileKey(r))}</option>`).join('')}</select></label>
        ${b.leader ? `<label class="f"><span>Leader priced as</span><select name="leaderPriceAs" id="b-lprice"><option value="">Same species, Sergeant/Minor</option>${R('profileCosts').map(r => `<option ${b.leaderPriceAs === profileKey(r) ? 'selected' : ''}>${esc(profileKey(r))}</option>`).join('')}</select></label>` : ''}
        <label class="f"><span>Points</span><select name="pointsMode" id="b-pmode"><option value="auto" ${b.pointsMode !== 'manual' ? 'selected' : ''}>Estimate</option><option value="manual" ${b.pointsMode === 'manual' ? 'selected' : ''}>Enter by hand</option></select></label>
        <label class="f"><span>Hand-entered points</span><input type="number" min="0" name="points" id="b-points" value="${b.points || 0}" ${b.pointsMode !== 'manual' ? 'disabled' : ''}></label>
      </div></form>
  </div><div class="stack" id="builderside">${builderSide()}</div></div>`;
}
function armWeapons(){
  const ed = S.ui.weaponEdit ? S.armory.weapons.find(w => w.id === S.ui.weaponEdit) : null; const w = ed || { name:'', base:'', cat:'Rifle', range:24, shots:1, dmg:'0', traits:[], pts:3 };
  return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Display name</th><th>Rules base</th><th>Category</th><th class="num">Range</th><th class="num">Shots</th><th class="num">Dmg</th><th>Traits</th>${S.mods.points ? '<th class="num">Pts</th>' : ''}<th></th></tr></thead><tbody>
    ${S.armory.weapons.map(x => `<tr class="${ed && ed.id === x.id ? 'sel' : ''}"><td><b>${esc(x.name)}</b></td><td>${esc(x.base)}</td><td>${esc(x.cat)}</td><td class="num mono">${x.range >= UNLIMITED ? 'Unlimited' : x.range ? x.range + '"' : 'Melee'}${x.range && x.range < UNLIMITED && rangeMult() !== 1 ? ` <span class="pill warn">${half(x.range * rangeMult())}"</span>` : ''}</td><td class="num mono">${x.shots || '—'}</td><td class="num mono">${esc(x.dmg)}</td><td class="small">${x.traits.map(esc).join(', ') || '—'}</td>${S.mods.points ? `<td class="num mono">${x.pts}</td>` : ''}
      <td><div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sm" type="button" data-act="editw" data-id="${x.id}">Edit</button><button class="btn sm danger" type="button" data-act="delw" data-id="${x.id}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>
    <form class="panel stack" data-form="weapon"><div class="panel-h"><h3>${ed ? 'Edit ' + esc(ed.name) : 'Add a weapon'}</h3></div><div class="form-grid">
      <label class="f"><span>Display name</span><input type="text" id="aw-name" name="name" required value="${esc(w.name)}" placeholder="Hellgun"></label>
      <label class="f"><span>Rules base</span><input type="text" id="aw-base" name="base" value="${esc(w.base)}" placeholder="Infantry laser"></label>
      <label class="f"><span>Category</span><select id="aw-cat" name="cat">${WEAPON_CATS.map(c => `<option ${w.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="f"><span>Range (")</span><input type="number" id="aw-range" name="range" value="${w.range}" min="0"></label>
      <label class="f"><span>Shots</span><input type="number" id="aw-shots" name="shots" value="${w.shots}" min="0"></label>
      <label class="f"><span>Damage</span><input type="text" id="aw-dmg" name="dmg" value="${esc(w.dmg)}"></label>
      <label class="f"><span>Traits (comma separated)</span><input type="text" id="aw-traits" name="traits" value="${esc(w.traits.join(', '))}" placeholder="Piercing, Heavy"></label>
      <label class="f"><span>Points</span><input type="number" id="aw-pts" name="pts" value="${w.pts}" min="0"></label></div>
      <div class="row"><button class="btn primary" type="submit">${ed ? 'Save changes' : 'Add weapon'}</button>${ed ? '<button class="btn" type="button" data-act="editw" data-id="">Cancel</button>' : ''}</div></form>`;
}
function armGear(){
  const ed = S.ui.gearEdit ? S.armory.gear.find(g => g.id === S.ui.gearEdit) : null; const g = ed || { name:'', type:'Equipment', activation:'Free', uses:'', effect:'', pts:1 };
  return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Item</th><th>Type</th><th>Activation</th><th>Uses</th><th>Effect</th>${S.mods.points ? '<th class="num">Pts</th>' : ''}<th></th></tr></thead><tbody>
    ${S.armory.gear.map(x => `<tr class="${ed && ed.id === x.id ? 'sel' : ''}"><td><b>${esc(x.name)}</b></td><td>${esc(x.type)}</td><td class="small">${esc(x.activation)}</td><td class="mono">${esc(x.uses || '∞')}</td><td class="small">${esc(x.effect)}</td>${S.mods.points ? `<td class="num mono">${x.pts}</td>` : ''}
      <td><div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sm" type="button" data-act="editg" data-id="${x.id}">Edit</button><button class="btn sm danger" type="button" data-act="delg" data-id="${x.id}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>
    <form class="panel stack" data-form="gear"><h3>${ed ? 'Edit ' + esc(ed.name) : 'Add gear'}</h3><div class="form-grid">
      <label class="f"><span>Name</span><input type="text" name="name" id="ag-name" required value="${esc(g.name)}"></label>
      <label class="f"><span>Type</span><select name="type" id="ag-type">${GEAR_TYPES.map(t => `<option ${g.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="f"><span>Activation</span><input type="text" name="activation" id="ag-act" value="${esc(g.activation)}"></label>
      <label class="f"><span>Uses (blank = unlimited)</span><input type="text" name="uses" id="ag-uses" value="${esc(g.uses)}"></label>
      <label class="f" style="grid-column:span 2"><span>Effect</span><input type="text" name="effect" id="ag-eff" value="${esc(g.effect)}"></label>
      <label class="f"><span>Points</span><input type="number" min="0" name="pts" id="ag-pts" value="${g.pts}"></label></div>
      <div class="row"><button class="btn primary" type="submit">${ed ? 'Save changes' : 'Add gear'}</button>${ed ? '<button class="btn" type="button" data-act="editg" data-id="">Cancel</button>' : ''}</div></form>`;
}
function armFactions(){
  const tpls = S.armory.templates;
  return `${S.armory.factions.map(f => `<div class="panel stack"><div class="panel-h"><h3>${esc(f.name)}</h3>${f.id === S.setup.player ? '<span class="pill info">Your faction</span>' : ''}${f.id === S.setup.opponent ? '<span class="pill enemy">Current opponent</span>' : ''}</div>
      <div class="form-grid">
        <label class="f"><span>Name</span><input type="text" value="${esc(f.name)}" data-chg="facname" data-f="${f.id}" id="fn-${f.id}"></label>
        <label class="f"><span>Listed under</span><select data-chg="facside" data-f="${f.id}" id="fs-${f.id}"><option value="player" ${f.side === 'player' ? 'selected' : ''}>Your factions</option><option value="enemy" ${f.side === 'enemy' ? 'selected' : ''}>Opposing factions</option></select></label>
        ${true ? `<label class="chk" style="align-self:end"><input type="checkbox" data-chg="facnoveh" data-f="${f.id}" ${f.noVehicles ? 'checked' : ''}> No vehicles (vehicle results become storm squads)</label>` : ''}
        ${true ? `<label class="f"><span>AI personality (as opponent)</span><select data-chg="pers" data-f="${f.id}" id="pers-${f.id}">${PERSONALITIES.map(p => `<option ${p === f.personality ? 'selected' : ''}>${p}</option>`).join('')}</select></label>` : ''}
        <div class="row" style="align-items:end"><span class="small muted">${tpls.filter(t => t.faction === f.id).length} templates</span><button class="btn sm danger" type="button" data-act="delfac" data-id="${f.id}">Delete faction</button></div></div>
      ${f.notes ? `<p class="small muted" style="margin:0;max-width:80ch">${esc(f.notes)}${f.source ? ` <span class="chip">${esc(f.source)}</span>` : ''}</p>` : ''}
      ${(f.rules || []).length ? `<details><summary class="small">Faction rules (${f.rules.length})</summary><div class="tblwrap" style="margin-top:8px"><table class="tbl"><tbody>${f.rules.map(r => `<tr><td style="width:190px"><b>${esc(r.name)}</b></td><td class="small">${esc(r.text)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}
      ${true ? `<details><summary class="small">Slot map when this faction is the opponent: Random Enemy Forces results → its models</summary>
        <div class="tblwrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Enemy table result</th><th>Template</th></tr></thead><tbody>
        ${Object.keys(SLOT_LABEL).map(s => `<tr><td>${SLOT_LABEL[s]}</td><td><select data-chg="slot" data-f="${f.id}" data-s="${s}" id="slot-${f.id}-${s}" aria-label="${SLOT_LABEL[s]}"><option value="">— generic book profile —</option>${(tpls.some(t => t.faction === f.id) ? tpls.filter(t => t.faction === f.id) : tpls).map(tp => `<option value="${tp.id}" ${f.slots && f.slots[s] === tp.id ? 'selected' : ''}>${esc(tp.name)}</option>`).join('')}</select></td></tr>`).join('')}
        </tbody></table></div></details>` : ''}</div>`).join('')}
    <form class="panel row" data-form="faction"><label class="f"><span>New faction name</span><input type="text" name="name" id="nfac-name" required placeholder="Cold Harbor Solutions Group"></label>
      <label class="f"><span>Side</span><select name="side" id="nfac-side"><option value="enemy">Enemy</option><option value="player">Yours</option></select></label>
      <label class="f"><span>Personality</span><select name="personality" id="nfac-pers">${PERSONALITIES.map(p => `<option>${p}</option>`).join('')}</select></label>
      <button class="btn primary" type="submit">Add faction</button></form>`;
}
function armSupport(){
  return `<div class="panel stack"><div class="panel-h"><h3>Support assets</h3><span class="small muted">Banked assets join your next generated mission at their target number.</span></div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Asset</th><th>Support option</th><th class="num">Target</th><th class="num">CP</th><th></th></tr></thead><tbody>
    ${S.armory.support.map(s => `<tr><td><b>${esc(s.name)}</b>${s.strike ? ` <span class="chip">${esc(s.strike)} strike</span>` : ''}</td><td>${esc(s.option)}</td><td class="num mono">${s.tn}+</td><td class="num mono">${s.cp}${s.est ? ' <span class="muted small">est.</span>' : ''}</td>
      <td><div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sm" type="button" data-act="banks" data-id="${s.id}">Bank for next mission</button><button class="btn sm danger" type="button" data-act="dels" data-id="${s.id}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">Book Battle Support is 2 CP, called at 7+ (8+ if you call a paid asset in mid-battle). The 6+ and 8+ tiers are portal options; their costs live in Rules data. Banked now: ${(S.banked || []).map(b => esc(b.name || b)).join(', ') || 'nothing'}.</p></div>
    <form class="panel stack" data-form="support"><h3>Generate or add a support asset</h3><div class="form-grid">
      <label class="f"><span>Support option</span><select name="option" id="sp-opt"><option value="random">Random</option>${SUPPORT.map(s => `<option>${s}</option>`).join('')}</select></label>
      <label class="f"><span>Reliability</span><select name="reliability" id="sp-rel"><option value="reliable">Reliable (6+)</option><option value="standard" selected>Standard (7+)</option><option value="scarce">Scarce (8+)</option></select></label>
      <label class="f"><span>Name (blank = generated)</span><input type="text" name="name" id="sp-name" placeholder="Regimental 120mm battery"></label></div>
      <div class="row"><button class="btn primary" type="submit">Add to library</button></div></form>`;
}
function armMinis(){
  return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Maker</th><th>Line</th><th class="num">Owned</th><th class="num">Painted</th><th>Proxy for</th><th>Ready</th><th></th></tr></thead><tbody>
    ${S.armory.minis.map(m => { const tp = S.armory.templates.find(x => x.id === m.proxy); const ready = tp && m.painted >= tp.size;
      return `<tr><td>${esc(m.maker)}</td><td>${esc(m.line)}</td><td class="num mono">${m.owned}</td><td class="num"><input type="number" class="mono" style="width:70px" min="0" max="${m.owned}" value="${m.painted}" data-chg="painted" data-id="${m.id}" id="pt-${m.id}" aria-label="Painted count"></td>
        <td><select data-chg="proxy" data-id="${m.id}" id="px-${m.id}" aria-label="Proxy template"><option value="">—</option>${S.armory.templates.map(t => `<option value="${t.id}" ${m.proxy === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></td>
        <td>${ready ? '<span class="pill good">Enough painted</span>' : '<span class="pill warn">Short</span>'}</td><td><button class="btn sm danger" type="button" data-act="delm" data-id="${m.id}">Delete</button></td></tr>`; }).join('')}</tbody></table></div>
    <form class="panel row" data-form="mini"><label class="f"><span>Maker</span><input type="text" name="maker" id="mi-maker" required></label><label class="f"><span>Line</span><input type="text" name="line" id="mi-line" required></label>
      <label class="f"><span>Owned</span><input type="number" min="0" name="owned" id="mi-owned" value="5" style="width:80px"></label><label class="f"><span>Painted</span><input type="number" min="0" name="painted" id="mi-painted" value="0" style="width:80px"></label>
      <button class="btn primary" type="submit">Add line</button></form>`;
}
function armTerrain(){
  return `<div class="panel stack"><div class="panel-h"><h3>Terrain language</h3><span class="pill warn">Draft for us to agree</span></div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Tier</th><th>Footprint</th><th>Examples</th><th>Per 12" square</th><th>Role on the table</th></tr></thead><tbody>
      ${Object.values(TERRAIN_TIERS).map(t => `<tr><td><b>${t.name}</b></td><td class="mono">${esc(t.size)}</td><td>${esc(t.examples)}</td><td>${esc(t.perCell)}</td><td class="small">${esc(t.note)}</td></tr>`).join('')}</tbody></table></div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Rules type</th><th>What it does</th></tr></thead><tbody>${Object.entries(TERRAIN_RULES).map(([k, v]) => `<tr><td><b>${k}</b></td><td class="small">${esc(v)}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">Tier says how big a piece is and how the layout spends it; rules type says how it plays. A container is Small and Solid; a woods patch is Medium and Area.</p></div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Piece</th><th>Tier</th><th>Rules type</th><th class="num">Footprint</th><th class="num">Count</th><th></th></tr></thead><tbody>
      ${S.armory.terrain.map(p => `<tr><td>${esc(p.name)}</td><td><select data-chg="ttier" data-id="${p.id}" id="tt-${p.id}" aria-label="Tier">${Object.keys(TERRAIN_TIERS).map(k => `<option value="${k}" ${p.tier === k ? 'selected' : ''}>${TERRAIN_TIERS[k].name}</option>`).join('')}</select></td>
        <td><select data-chg="trules" data-id="${p.id}" id="tru-${p.id}" aria-label="Rules type">${Object.keys(TERRAIN_RULES).map(k => `<option ${p.rules === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>
        <td class="num mono">${p.w}" × ${p.h}"</td><td class="num"><input type="number" class="mono" style="width:64px" min="0" value="${p.count}" data-chg="tcount" data-id="${p.id}" id="tc-${p.id}" aria-label="Count of ${esc(p.name)}"></td>
        <td><button class="btn sm danger" type="button" data-act="delt" data-id="${p.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>
    <form class="panel" data-form="terrain"><div class="form-grid">
      <label class="f"><span>Piece</span><input type="text" name="name" id="nt-name" required placeholder="Comms mast"></label>
      <label class="f"><span>Tier</span><select name="tier" id="nt-tier">${Object.keys(TERRAIN_TIERS).map(k => `<option value="${k}">${TERRAIN_TIERS[k].name}</option>`).join('')}</select></label>
      <label class="f"><span>Rules type</span><select name="rules" id="nt-rules">${Object.keys(TERRAIN_RULES).map(k => `<option>${k}</option>`).join('')}</select></label>
      <label class="f"><span>Width (")</span><input type="number" step="0.5" min="0.5" name="w" id="nt-w" value="3"></label>
      <label class="f"><span>Depth (")</span><input type="number" step="0.5" min="0.5" name="h" id="nt-h" value="3"></label>
      <label class="f"><span>Count</span><input type="number" min="1" name="count" id="nt-c" value="1"></label>
      <div class="row" style="align-items:end"><button class="btn primary" type="submit">Add piece</button></div></div></form>`;
}
function armImport(){
  return `<div class="panel stack"><h3>Bulk import and export</h3>
    <p class="small" style="max-width:72ch">Paste JSON with any of these lists: <span class="mono">weapons, gear, templates, factions, terrain, support, minis</span>. Entries with an existing id replace it; new ids are added. Export gives you the current armory in the same shape.</p>
    <div class="row"><button class="btn" type="button" data-act="armexport">Show armory JSON</button><button class="btn primary" type="button" data-act="armimport">Import pasted JSON</button></div>
    <textarea id="armio" rows="12" aria-label="Armory JSON" placeholder='{"weapons":[{"id":"w-hellgun","name":"Hellgun","base":"Infantry laser","cat":"Rifle","range":30,"shots":1,"dmg":"1","traits":["Snap Shot"],"pts":6}]}'></textarea></div>`;
}

