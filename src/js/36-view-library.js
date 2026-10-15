/* ----- unit library ----- */
const TROOP_LABEL = { squad:'Squad', team:'Weapon team', individual:'Character', vehicle:'Vehicle' };
function libFilter(){ return Object.assign({ fac:'', troop:'', min:'', max:'', q:'', sort:'name' }, S.ui.lib || {}); }
function libResults(){
  const f = libFilter(); const q = f.q.trim().toLowerCase();
  let ts = S.armory.templates.filter(t => (!f.fac || t.faction === f.fac) && (!f.troop || t.troop === f.troop));
  ts = ts.filter(t => { const p = tplPoints(t).v; return (f.min === '' || p >= +f.min) && (f.max === '' || p <= +f.max); });
  if (q) ts = ts.filter(t => [t.name, ...(t.rules || []), ...weaponIdsOf(t).map(id => (weaponOf(id) || {}).name || ''), (factionOf(t.faction) || {}).name || ''].join(' ').toLowerCase().includes(q));
  const by = { name:(a, b) => a.name.localeCompare(b.name), pts:(a, b) => tplPoints(a).v - tplPoints(b).v, ptsdesc:(a, b) => tplPoints(b).v - tplPoints(a).v, faction:(a, b) => ((factionOf(a.faction) || {}).name || '').localeCompare((factionOf(b.faction) || {}).name || '') || a.name.localeCompare(b.name) }[f.sort] || ((a, b) => a.name.localeCompare(b.name));
  return ts.sort(by);
}
function statMini(p){ const mm = moveMult(); return `<table class="tbl statmini"><thead><tr><th>Spd</th><th>Re</th><th>Cs</th><th>T</th><th>KP</th><th>Sv</th><th>Tr</th><th>Save</th></tr></thead><tbody><tr><td>${half(p.sp * mm)}"</td><td>${p.re}</td><td>${sgn(p.cs)}</td><td>${p.t}</td><td>${p.kp}</td><td>${sgn(p.sv)}</td><td>${sgn(p.tr)}</td><td>${esc(p.save)}</td></tr></tbody></table>`; }
function libCard(t){
  const f = factionOf(t.faction); const weps = [...new Set(weaponIdsOf(t).map(id => (weaponOf(id) || {}).name).filter(Boolean))];
  return `<div class="libcard"><div class="row" style="gap:6px;align-items:baseline"><b style="flex:1">${esc(t.name)}</b><span class="mono">${tplPoints(t).v} pts</span></div>
    <div class="row small" style="gap:4px">${f ? `<span class="pill ${f.id === S.setup.player ? 'info' : 'mute'}">${esc(f.name)}</span>` : ''}<span class="chip">${TROOP_LABEL[t.troop] || t.troop}${t.level ? ' · ' + t.level : ''}</span><span class="chip">${t.size} fig${t.size > 1 ? 's' : ''}</span></div>
    ${statMini(t.profile)}
    <div class="small">${esc(weps.join(', ')) || '<span class="muted">No weapons</span>'}</div>
    ${(t.rules || []).length ? `<div class="small muted">${esc(t.rules.map(r => r.split(':')[0]).join(' · '))}</div>` : ''}
    <div class="row" style="gap:6px;margin-top:auto"><button class="btn sm" type="button" data-act="libview" data-id="${t.id}">View</button><button class="btn sm primary" type="button" data-act="libadd" data-id="${t.id}">Add to list</button></div></div>`;
}
function listPanel(){
  const l = activeList();
  const head = `<div class="panel-h"><h3>Army lists</h3><span class="small muted">${LISTS.length} saved · shared by every campaign</span></div>
    <div class="row" style="gap:6px;flex-wrap:wrap">${LISTS.length ? `<select id="list-pick" data-chg="listpick" aria-label="Active list">${LISTS.map(x => `<option value="${x.id}" ${l && x.id === l.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}
      <button class="btn sm" type="button" data-act="listnew">New list</button>
      <label class="btn sm" for="list-file" style="cursor:pointer">Import…</label><input type="file" id="list-file" accept=".json,application/json" hidden data-chg="listimport"></div>`;
  if (!l) return `<div class="panel stack">${head}<div class="empty small">No lists yet. Press New list, or Add to list on any unit.</div></div>`;
  const tot = listTotals(l); const over = l.limit && tot.pts > l.limit;
  const rows = l.entries.map(e => { const fac = factionOf(e.tpl.faction) || e.faction; const missing = !S.armory.templates.some(t => t.id === e.tpl.id);
    return `<tr><td><b>${esc(e.tpl.name)}</b><div class="small muted">${esc(fac ? fac.name : '')}${missing ? ' · not in this campaign\'s armory yet' : ''}</div></td>
      <td class="nowrap"><button class="btn sm" type="button" data-act="listdec" data-id="${e.id}" aria-label="One fewer">−</button> <span class="mono">${e.count}</span> <button class="btn sm" type="button" data-act="listinc" data-id="${e.id}" aria-label="One more">+</button></td>
      <td class="num mono">${entryPts(e) * e.count}</td><td><button class="btn sm danger" type="button" data-act="listrm" data-id="${e.id}" aria-label="Remove">×</button></td></tr>`; }).join('');
  return `<div class="panel stack">${head}
    <div class="form-grid tight"><label class="f"><span>List name</span><input type="text" id="list-name" value="${esc(l.name)}" data-chg="listname"></label><label class="f"><span>Points limit (0 = none)</span><input type="number" min="0" step="5" id="list-limit" value="${l.limit || 0}" data-chg="listlimit"></label></div>
    <div class="row small" style="gap:6px"><span class="pill ${over ? 'crit' : l.limit && tot.pts >= l.limit * 0.9 ? 'good' : 'info'}">${tot.pts}${l.limit ? ` / ${l.limit}` : ''} pts${over ? ` · ${tot.pts - l.limit} over` : l.limit ? ` · ${l.limit - tot.pts} left` : ''}</span><span class="muted">${tot.units} units · ${tot.figs} figures</span></div>
    ${l.entries.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Unit</th><th>Count</th><th class="num">Pts</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty small">Empty. Use Add to list on any unit in the library.</div>'}
    <div class="row" style="gap:6px;flex-wrap:wrap">
      <button class="btn sm primary" type="button" data-act="listprint" ${l.entries.length ? '' : 'disabled'}>Print battle pack</button>
      <select id="list-size" data-chg="qsize" aria-label="Card size"><option value="35" ${(S.ui.qsize || '35') === '35' ? 'selected' : ''}>3" × 5"</option><option value="46" ${S.ui.qsize === '46' ? 'selected' : ''}>4" × 6"</option></select>
      ${paperSelect('list-paper')}
      <button class="btn sm" type="button" data-act="listquick" data-k="player" ${l.entries.length ? '' : 'disabled'}>Quick battle: my side</button>
      <button class="btn sm" type="button" data-act="listquick" data-k="opp" ${l.entries.length ? '' : 'disabled'}>Quick battle: opponent</button>
      <button class="btn sm" type="button" data-act="listexp">Export JSON</button><button class="btn sm" type="button" data-act="listdup">Duplicate</button><button class="btn sm danger" type="button" data-act="listdel">Delete</button></div></div>`;
}
function viewLibrary(){
  const f = libFilter(); const res = libResults(); const facs = [...S.armory.factions].sort((a, b) => a.name.localeCompare(b.name));
  const filters = `<form class="panel stack" data-form="libfilter" id="libfilter"><div class="panel-h"><h3>Unit library</h3><span class="small muted">${res.length} of ${S.armory.templates.length} units in this campaign's armory</span></div>
    <div class="form-grid">
      <label class="f"><span>Faction</span><select name="fac" id="lib-fac" data-chg="libf"><option value="">All factions</option>${facs.map(x => `<option value="${x.id}" ${f.fac === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <label class="f"><span>Type</span><select name="troop" id="lib-troop" data-chg="libf"><option value="">All types</option>${Object.entries(TROOP_LABEL).map(([k, v]) => `<option value="${k}" ${f.troop === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="f"><span>Points from</span><input type="number" min="0" name="min" id="lib-min" value="${esc(f.min)}" data-chg="libf"></label>
      <label class="f"><span>Points to</span><input type="number" min="0" name="max" id="lib-max" value="${esc(f.max)}" data-chg="libf"></label>
      <label class="f"><span>Search name, rule or weapon</span><input type="search" name="q" id="lib-q" value="${esc(f.q)}" data-chg="libf" placeholder="e.g. Leader, sniper, droid"></label>
      <label class="f"><span>Sort</span><select name="sort" id="lib-sort" data-chg="libf">${[['name','Name'],['faction','Faction'],['pts','Points, low first'],['ptsdesc','Points, high first']].map(([k, v]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div></form>`;
  return `<div class="lib-split"><div class="stack">${filters}<div class="libgrid">${res.map(libCard).join('') || '<div class="empty">No units match these filters.</div>'}</div></div><div class="lib-side">${listPanel()}</div></div>`;
}
function unitDetail(t){
  const f = factionOf(t.faction); const rm = rangeMult();
  const wrow = id => { const w = weaponOf(id); if (!w) return ''; const rng = w.range >= UNLIMITED ? 'Unlimited' : w.range ? `${half(w.range * rm)}"${rm !== 1 ? ` <span class="muted">(${w.range}")</span>` : ''}` : 'Melee';
    return `<tr><td><b>${esc(w.name)}</b> <span class="muted small">${esc(w.base || '')}</span></td><td class="mono">${rng}</td><td class="mono num">${w.shots || '—'}</td><td class="mono num">${esc(w.dmg)}</td><td class="small">${(w.traits || []).map(esc).join(', ') || '—'}</td><td class="mono num">${w.pts}</td></tr>`; };
  const wsec = (label, ids) => ids && ids.length ? `<tr><td colspan="6" class="small muted"><b>${label}</b></td></tr>${[...new Set(ids)].map(wrow).join('')}` : '';
  const sample = namedUnits([t], t.faction, 'Library preview')[0]; CARD_LABEL = 'Unit library';
  let card = ''; try { card = unitCardsPrint(sample, '').join(''); } finally { CARD_LABEL = null; }
  return `<div class="stack"><div class="row" style="gap:8px;align-items:baseline"><h3 style="flex:1;margin:0">${esc(t.name)}</h3><span class="mono">${tplPoints(t).v} pts</span></div>
    <div class="row small" style="gap:4px">${f ? `<span class="pill info">${esc(f.name)}</span>` : ''}<span class="chip">${TROOP_LABEL[t.troop] || t.troop}${t.level ? ' · ' + t.level : ''}</span><span class="chip">${t.size} figure${t.size > 1 ? 's' : ''}</span>${t.source ? `<span class="chip">${esc(t.source)}</span>` : ''}</div>
    <div><div class="small muted">${t.leader ? 'Trooper' : 'Profile'}</div>${statMini(t.profile)}${t.leader ? `<div class="small muted">Leader</div>${statMini(t.leader)}` : ''}</div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Weapon</th><th>Range</th><th class="num">Shots</th><th class="num">Dmg</th><th>Traits</th><th class="num">Pts</th></tr></thead><tbody>${wsec(t.troop === 'squad' ? 'Every figure' : 'Weapons', t.weapons)}${wsec('Team weapon', t.teamWeapons)}${wsec('Leader', t.leaderWeapons)}</tbody></table></div>
    ${(t.rules || []).length ? `<div><b class="small">Unit rules</b><ul class="small" style="margin:4px 0">${t.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
    ${f && (f.rules || []).length ? `<details><summary class="small"><b>${esc(f.name)} faction rules</b> (${f.rules.length})</summary><ul class="small" style="margin:4px 0">${f.rules.map(r => `<li><b>${esc(r.name)}:</b> ${esc(r.text)}</li>`).join('')}</ul></details>` : ''}
    ${t.notes ? `<p class="small muted" style="margin:0">${esc(t.notes)}</p>` : ''}
    <details><summary class="small">Printed card preview</summary><div style="overflow-x:auto;margin-top:8px"><div class="cards-preview">${card}</div></div></details>
    <div class="row" style="gap:6px"><button class="btn primary" type="button" data-act="libadd" data-id="${t.id}">Add to ${esc((activeList() || { name:'a new list' }).name)}</button><button class="btn" type="button" data-act="libedit" data-id="${t.id}">Edit in the unit builder</button><button class="btn" type="button" data-act="modalclose">Close</button></div></div>`;
}

