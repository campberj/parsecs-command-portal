/* ---------- army lists: global, any factions, points-limited ---------- */
function newList(name, limit){ const l = { id:uid('list'), name:name || 'New list', limit:parseInt(limit, 10) || 0, entries:[], created:new Date().toISOString(), updated:new Date().toISOString() }; LISTS.push(l); S.ui.listId = l.id; saveLists(); return l; }
function activeList(){ return LISTS.find(l => l.id === S.ui.listId) || LISTS[0] || null; }
/* each entry carries a snapshot of its template, weapons and faction, so a list works in any campaign */
function listAdd(list, tplId, n){
  const t = S.armory.templates.find(x => x.id === tplId); if (!t || !list) return null;
  let e = list.entries.find(x => x.tpl.id === tplId);
  if (e){ e.count += n || 1; e.tpl = JSON.parse(JSON.stringify(t)); }
  else { const f = factionOf(t.faction);
    e = { id:uid('le'), count:n || 1, tpl:JSON.parse(JSON.stringify(t)), weapons:weaponIdsOf(t).map(weaponOf).filter(Boolean).map(w => JSON.parse(JSON.stringify(w))),
          faction:f ? { id:f.id, name:f.name, rules:f.rules || [], notes:f.notes || '', side:f.side, slots:f.slots || {}, personality:f.personality } : null, pts:tplPoints(t).v };
    list.entries.push(e); }
  e.pts = tplPoints(t).v; list.updated = new Date().toISOString(); saveLists(); return e;
}
function entryPts(e){ const live = S.armory.templates.find(x => x.id === e.tpl.id); return live ? tplPoints(live).v : e.pts; }
function listTotals(l){ return l.entries.reduce((a, e) => ({ pts:a.pts + entryPts(e) * e.count, units:a.units + e.count, figs:a.figs + e.tpl.size * e.count }), { pts:0, units:0, figs:0 }); }
/* copy any templates, weapons and factions a list needs into this campaign's armory */
function ensureListInArmory(l){
  let n = 0;
  l.entries.forEach(e => {
    if (!S.armory.templates.some(t => t.id === e.tpl.id)){ S.armory.templates.push(JSON.parse(JSON.stringify(e.tpl))); n++; }
    (e.weapons || []).forEach(w => { if (!S.armory.weapons.some(x => x.id === w.id)) S.armory.weapons.push(JSON.parse(JSON.stringify(w))); });
    if (e.faction && !S.armory.factions.some(f => f.id === e.faction.id)) S.armory.factions.push(JSON.parse(JSON.stringify(e.faction)));
  });
  return n;
}
function listFaction(l){ const c = {}; l.entries.forEach(e => { const k = e.tpl.faction || ''; c[k] = (c[k] || 0) + e.count; }); const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return best ? best[0] : ''; }
/* named units for every entry, grouped by faction so naming matches the faction's style */
function unitsFromList(l, note){
  ensureListInArmory(l);
  const byFac = {}; l.entries.forEach(e => { const t = S.armory.templates.find(x => x.id === e.tpl.id); (byFac[t.faction || ''] = byFac[t.faction || ''] || []).push(...Array(e.count).fill(t)); });
  return Object.entries(byFac).flatMap(([fac, picks]) => namedUnits(picks, fac, note || `From list: ${l.name}`));
}
function listExport(l){ return { kind:'pcp-list', v:1, app:'Parsecs Command', exported:new Date().toISOString(), list:l }; }
function listImport(obj){
  const arr = obj && obj.kind === 'pcp-list' ? [obj.list] : obj && obj.kind === 'pcp-lists' ? obj.lists : Array.isArray(obj) ? obj : null;
  if (!arr || !arr.every(l => l && Array.isArray(l.entries))) throw new Error('not a Parsecs Command list file');
  arr.forEach(l => { const i = LISTS.findIndex(x => x.id === l.id); if (i >= 0) LISTS[i] = l; else LISTS.push(l); });
  S.ui.listId = arr[arr.length - 1].id; saveLists(); return arr.length;
}

