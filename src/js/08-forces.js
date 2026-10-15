/* ---------- force math ---------- */
const tplOf = u => S.armory.templates.find(t => t.id === u.tpl);
const weaponOf = id => S.armory.weapons.find(w => w.id === id);
const factionOf = id => S.armory.factions.find(f => f.id === id);
function moveMult(){ return S.mods.ia ? 1.5 : (parseFloat(S.mods.moveMult) || 1); }
function rangeMult(){ return S.mods.ia ? 1.5 : (parseFloat(S.mods.rangeMult) || 1); }
function unitCountOf(u){ const t = tplOf(u); return t && t.troop === 'individual' ? 0.5 : 1; }
function deployable(){ return S.roster.units.filter(u => u.condition.state !== 'Lost' && u.condition.state !== 'Devastated' && (!S.mods.tableReadyOnly || u.tableReady) && u.figures.some(f => f.status === 'active')); }

/* ---------- named figures: base profile, advances, loadout ---------- */
function figBase(u, f){ const t = tplOf(u); if (!t) return null; return f.role === 'sergeant' && t.leader ? t.leader : t.profile; }
function figProfile(u, f){ const b = figBase(u, f); if (!b) return null; const p = { ...b }; Object.entries(f.adv || {}).forEach(([k, v]) => { if (typeof p[k] === 'number') p[k] += v; }); return p; }
function figLoadout(u, f){ if (f.loadout && f.loadout.length) return f.loadout; const t = tplOf(u); if (!t) return []; if (f.role === 'sergeant' && t.leader && (t.leaderWeapons || []).length) return t.leaderWeapons; return t.weapons || []; }
function advOptions(u, f){
  const p = figProfile(u, f); if (!p) return [];
  return R('advance').filter(r => p[r.stat] + (Number(r.step) || 1) <= Number(r.max)).map(r => ({ stat:r.stat, xp:Number(r.xp) || 0, step:Number(r.step) || 1, label:(ADV_STATS.find(a => a[0] === r.stat) || [r.stat, r.stat])[1] }));
}
function buyAdvance(u, f, stat){
  const o = advOptions(u, f).find(x => x.stat === stat); if (!o) return 'That stat is at its maximum.';
  if (f.xp < o.xp) return `${o.label} costs ${o.xp} XP; ${f.name} has ${f.xp}.`;
  f.xp -= o.xp; f.adv = f.adv || {}; f.adv[stat] = (f.adv[stat] || 0) + o.step; log('roster', `${f.name} raises ${o.label} by ${o.step} (${o.xp} XP).`); return null;
}

/* ---------- template edits that touch the roster ---------- */
function tplUsers(id){ return S.roster.units.filter(u => u.tpl === id); }
/* apply a template edit: units in `follow` take the new version; every other user keeps the old one as its own variant */
function applyTemplateEdit(draft, follow, refit){
  const i = S.armory.templates.findIndex(t => t.id === draft.id); const old = S.armory.templates[i]; const lines = [];
  tplUsers(draft.id).forEach(u => {
    if (follow.includes(u.id)){ if (refit){ S.cp = Math.max(0, S.cp - RP('refit')); lines.push(`${u.name} refits (${RP('refit')} CP).`); } else lines.push(`${u.name} takes the new version.`); }
    else { const v = JSON.parse(JSON.stringify(old)); v.id = uid('t'); v.name = `${old.name} (${u.name})`; v.variantOf = old.id; S.armory.templates.push(v); u.tpl = v.id; lines.push(`${u.name} keeps the old version as its own variant.`); }
  });
  S.armory.templates[i] = draft; log('armory', `Template saved: ${draft.name}. ${lines.join(' ')}`); return lines;
}
/* fork a unit's template into a variant only that unit uses */
function customizeUnit(u){
  const t = tplOf(u); if (!t) return null; if (t.variantOf && tplUsers(t.id).length === 1) return t;
  const v = JSON.parse(JSON.stringify(t)); v.id = uid('t'); v.name = `${t.name} (${u.name})`; v.variantOf = t.variantOf || t.id; S.armory.templates.push(v); u.tpl = v.id;
  log('armory', `${u.name} now has its own variant of ${t.name}.`); return v;
}

/* ---------- JSON bundles: export, and import with a diff preview ---------- */
const BUNDLE_KEYS = ['units','templates','weapons','gear','factions','terrain','support','minis'];
function weaponIdsOf(t){ return [...(t.weapons || []), ...(t.teamWeapons || []), ...(t.leaderWeapons || [])]; }
function bundleFor(kind, ids){
  const b = { kind:'pcp-bundle', v:1, app:'Parsecs Command __VERSION__', exported:new Date().toISOString(), from:S.setup.name };
  let units = [], tpls = [];
  if (kind === 'units'){ units = S.roster.units.filter(u => !ids || ids.includes(u.id)); tpls = [...new Set(units.map(u => u.tpl))].map(id => S.armory.templates.find(t => t.id === id)).filter(Boolean); }
  else if (kind === 'templates'){ tpls = S.armory.templates.filter(t => !ids || ids.includes(t.id)); }
  else if (kind === 'armory'){ BUNDLE_KEYS.slice(1).forEach(k => b[k] = S.armory[k]); return b; }
  const wids = new Set(); tpls.forEach(t => weaponIdsOf(t).forEach(w => wids.add(w))); units.forEach(u => u.figures.forEach(f => (f.loadout || []).forEach(w => wids.add(w))));
  if (units.length) b.units = units; b.templates = tpls; b.weapons = S.armory.weapons.filter(w => wids.has(w.id));
  return JSON.parse(JSON.stringify(b));
}
function flat(o, pre, out){ out = out || {}; pre = pre || '';
  if (o === null || typeof o !== 'object'){ out[pre] = o; return out; }
  if (Array.isArray(o) && o.every(x => x === null || typeof x !== 'object')){ out[pre] = o.join(', '); return out; }
  Object.keys(o).forEach(k => { if (['id'].includes(k) && pre === '') return; flat(o[k], pre ? `${pre}.${k}` : k, out); }); return out; }
function diffPaths(a, b){ const fa = flat(a), fb = flat(b); const keys = new Set([...Object.keys(fa), ...Object.keys(fb)]); const out = [];
  keys.forEach(k => { if (String(fa[k]) !== String(fb[k])) out.push({ path:k, from:fa[k], to:fb[k] }); }); return out; }
function targetList(key){ return key === 'units' ? S.roster.units : S.armory[key]; }
function planImport(obj){
  if (!obj || typeof obj !== 'object') throw new Error('not JSON data');
  if (obj.kind === 'pcp-backup') throw new Error('this is a full backup; restore it from the Campaigns tab');
  if (obj.v >= 2 && obj.map) throw new Error('this is a whole campaign; open it from the Campaigns tab');
  if (obj.tpl && obj.figures) obj = { units:[obj] };
  const items = [];
  BUNDLE_KEYS.forEach(key => (Array.isArray(obj[key]) ? obj[key] : []).forEach(x => {
    if (!x || typeof x !== 'object') return; const cur = x.id && targetList(key).find(y => y.id === x.id);
    const changes = cur ? diffPaths(cur, x) : [];
    items.push({ key, item:x, name:x.name || x.line || x.id || '(unnamed)', status:!cur ? 'new' : changes.length ? 'changed' : 'same', changes, pick:!cur || changes.length > 0 });
  }));
  const tplIds = new Set([...S.armory.templates.map(t => t.id), ...items.filter(i => i.key === 'templates').map(i => i.item.id)]);
  items.filter(i => i.key === 'units').forEach(i => { if (!tplIds.has(i.item.tpl)) i.warn = 'Its template is not in the file or your armory.'; });
  if (!items.length) throw new Error('no units, templates or armory lists found');
  return items;
}
function applyImport(items, asCopies){
  const map = {}; let n = 0;
  if (asCopies) items.filter(i => i.pick).forEach(i => { if (i.item.id) map[i.item.id] = uid(i.key[0]); });
  const re = id => map[id] || id;
  items.filter(i => i.pick).forEach(i => {
    const x = JSON.parse(JSON.stringify(i.item)); if (!x.id) x.id = uid(i.key[0]); x.id = re(x.id);
    if (asCopies && i.key !== 'units' && x.name) x.name += ' (imported)';
    if (i.key === 'templates'){ ['weapons','teamWeapons','leaderWeapons'].forEach(k => x[k] = (x[k] || []).map(re)); if (x.variantOf) x.variantOf = re(x.variantOf); }
    if (i.key === 'units'){ x.tpl = re(x.tpl); (x.figures || []).forEach(f => { if (asCopies) f.id = uid('fig'); if (f.loadout) f.loadout = f.loadout.map(re); ['xp','tokens','recover'].forEach(k => { if (f[k] == null) f[k] = 0; }); f.adv = f.adv || {}; f.awards = f.awards || []; }); x.formation = x.formation || S.roster.formations[0].id; }
    const list = targetList(i.key); const at = list.findIndex(y => y.id === x.id); if (at >= 0) list[at] = x; else list.push(x); n++;
  });
  log('roster', `Imported ${n} item${n === 1 ? '' : 's'}${asCopies ? ' as copies' : ''}.`); return n;
}

