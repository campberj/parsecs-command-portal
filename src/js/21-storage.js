/* ---------- storage (1.0) ----------
   IndexedDB holds every campaign, the rules pack and the backup folder handle.
   localStorage mirrors the open campaign synchronously, so a crash between writes loses nothing.
   Under file:// both are shared by every local page and cleared with browsing data,
   so the backup folder (or a downloaded backup) is the record of truth. */
const DB_NAME = 'parsecs-command', DB_STORE = 'kv';
let idb = null, META = { current:null, campaigns:[], lastBackup:null, lastBackupNote:'' }, dirHandle = null, dirState = 'none', saveTimer = null;
let LISTS = []; /* custom army lists: global, shared by every campaign and saved with backups */
function saveLists(){ if (!isBrowser) return; lsSet('pcp-lists', LISTS); idbSet('lists', JSON.stringify(LISTS)); }
function idbOpen(){ return new Promise(res => { try { if (typeof indexedDB === 'undefined') return res(null); const rq = indexedDB.open(DB_NAME, 1); rq.onupgradeneeded = () => rq.result.createObjectStore(DB_STORE); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null); } catch (e) { res(null); } }); }
function idbReq(mode, fn){ return new Promise(res => { if (!idb) return res(undefined); try { const tx = idb.transaction(DB_STORE, mode); const rq = fn(tx.objectStore(DB_STORE)); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(undefined); } catch (e) { res(undefined); } }); }
const idbGet = k => idbReq('readonly', st => st.get(k));
const idbSet = (k, v) => idbReq('readwrite', st => st.put(v, k));
const idbDel = k => idbReq('readwrite', st => st.delete(k));
const lsGet = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
function metaEntry(st){ return { id:st.id, name:st.setup.name, theater:st.setup.theater, turn:st.turn, ended:st.ended, updated:st.savedAt || new Date().toISOString(), missions:st.missions.length }; }
function touchMeta(){ const e = metaEntry(S); const i = META.campaigns.findIndex(c => c.id === S.id); if (i >= 0) META.campaigns[i] = e; else META.campaigns.push(e); META.current = S.id; }
function save(){
  if (!isBrowser || !S) return;
  S.savedAt = new Date().toISOString(); touchMeta();
  lsSet('pcp-camp:' + S.id, S); lsSet('pcp-meta', META);
  clearTimeout(saveTimer); const snap = JSON.stringify(S), meta = JSON.parse(JSON.stringify(META));
  saveTimer = setTimeout(() => { idbSet('camp:' + JSON.parse(snap).id, snap); idbSet('meta', meta); }, 250);
}
function saveRules(){ if (!isBrowser) return; lsSet('pcp-rules', RULES); idbSet('rules', JSON.stringify(RULES)); }
function newer(a, b){ if (!a) return b; if (!b) return a; return (a.savedAt || '') >= (b.savedAt || '') ? a : b; }
async function loadCampaign(id){
  const fromIdb = await idbGet('camp:' + id); const a = fromIdb ? JSON.parse(fromIdb) : null; const b = lsGet('pcp-camp:' + id);
  const o = newer(a, b); return o ? migrate(o) : null;
}
async function allCampaigns(){ const out = []; for (const c of META.campaigns){ const o = await loadCampaign(c.id); if (o) out.push(o); } return out; }
async function boot(){
  idb = await idbOpen();
  META = (await idbGet('meta')) || lsGet('pcp-meta') || META; META.campaigns = META.campaigns || [];
  const lsMeta = lsGet('pcp-meta'); if (lsMeta && (lsMeta.campaigns || []).length > META.campaigns.length) META = lsMeta;
  const rIdb = await idbGet('rules'); const rr = rIdb ? JSON.parse(rIdb) : lsGet('pcp-rules'); if (rr && rr.tables) RULES = mergeRules(rr);
  const lIdb = await idbGet('lists'); const ll = lIdb ? JSON.parse(lIdb) : lsGet('pcp-lists'); if (Array.isArray(ll)) LISTS = ll;
  /* carry a 0.2 prototype save forward once */
  const legacy = lsGet('pcp-state-v2');
  if (legacy && !META.campaigns.some(c => c.legacy)){ try { const o = migrate(legacy); S = o; save(); META.campaigns.find(c => c.id === o.id).legacy = true; lsSet('pcp-meta', META); } catch (e) {} }
  if (META.current) S = await loadCampaign(META.current).catch(() => null);
  if (!S && META.campaigns.length) S = await loadCampaign(META.campaigns[0].id).catch(() => null);
  if (!S){ sampleCampaign(); }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  dirHandle = (await idbGet('dirHandle')) || null; await refreshDirState();
  render();
}
function mergeRules(rr){ const base = defaultRules(); Object.keys(base.tables).forEach(k => { if (rr.tables[k] && Array.isArray(rr.tables[k].rows)) base.tables[k] = rr.tables[k]; }); return base; }
function sampleCampaign(){ newState(defaultSetup()); S.mods.ia = true; S.mods.figureXP = true; }
async function switchCampaign(id){ save(); const o = await loadCampaign(id); if (!o){ toast('That campaign could not be read.'); return; } S = o; S.ui.tab = 'map'; save(); render(); }
async function deleteCampaign(id){ META.campaigns = META.campaigns.filter(c => c.id !== id); await idbDel('camp:' + id); lsDel('pcp-camp:' + id);
  if (S.id === id){ if (META.campaigns.length) await switchCampaign(META.campaigns[0].id); else { sampleCampaign(); render(); } } else { lsSet('pcp-meta', META); idbSet('meta', META); render(); } }

