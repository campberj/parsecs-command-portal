/* ---------- backups ---------- */
async function refreshDirState(){
  if (!dirHandle){ dirState = 'none'; return; }
  try { const p = await dirHandle.queryPermission({ mode:'readwrite' }); dirState = p === 'granted' ? 'ok' : 'prompt'; } catch (e) { dirState = 'prompt'; }
}
const canFolder = () => isBrowser && typeof window.showDirectoryPicker === 'function';
async function linkFolder(){
  if (!canFolder()){ toast('This browser cannot write to a folder. Use Download backup instead (Chrome or Edge can link a folder).'); return; }
  try { dirHandle = await window.showDirectoryPicker({ id:'parsecs-backups', mode:'readwrite' }); await idbSet('dirHandle', dirHandle); dirState = 'ok'; await backupNow('Folder linked', true); }
  catch (e) { if (e && e.name !== 'AbortError') toast('Could not link the folder: ' + e.message); }
  render();
}
async function reconnectFolder(){ if (!dirHandle) return linkFolder(); try { const p = await dirHandle.requestPermission({ mode:'readwrite' }); dirState = p === 'granted' ? 'ok' : 'prompt'; if (dirState === 'ok') await backupNow('Reconnected', true); } catch (e) { toast('Permission was not granted.'); } render(); }
async function backupBundle(reason){ save(); const camps = await allCampaigns(); const cur = camps.findIndex(c => c.id === S.id); if (cur >= 0) camps[cur] = S; else camps.push(S);
  return { kind:'pcp-backup', v:SCHEMA, app:'Parsecs Command __VERSION__', saved:new Date().toISOString(), reason, current:S.id, rules:RULES, lists:LISTS, campaigns:camps }; }
const stamp = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
async function writeFile(name, text){ const fh = await dirHandle.getFileHandle(name, { create:true }); const w = await fh.createWritable(); await w.write(text); await w.close(); }
async function backupNow(reason, snapshot){
  if (!isBrowser) return false;
  if (dirState !== 'ok') return false;
  try {
    const text = JSON.stringify(await backupBundle(reason), null, 1);
    await writeFile('parsecs-backup-latest.json', text);
    if (snapshot){ await writeFile(`parsecs-backup-${stamp()}.json`, text);
      const names = []; for await (const [n] of dirHandle.entries()) if (/^parsecs-backup-\d{8}-\d{4}\.json$/.test(n)) names.push(n);
      names.sort(); while (names.length > 30) await dirHandle.removeEntry(names.shift()); }
    META.lastBackup = new Date().toISOString(); META.lastBackupNote = reason; lsSet('pcp-meta', META); idbSet('meta', META); return true;
  } catch (e) { dirState = 'prompt'; toast('Backup to folder failed: ' + e.message); return false; }
}
async function downloadBackup(){ const text = JSON.stringify(await backupBundle('Downloaded'), null, 1); downloadText(`parsecs-backup-${stamp()}.json`, text); META.lastBackup = new Date().toISOString(); META.lastBackupNote = 'Downloaded'; save(); render(); }
function downloadText(name, text){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type:'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
async function autoBackup(reason){ if (dirState === 'ok') await backupNow(reason, true); }
async function restoreBackup(obj, opts){
  let n = 0; for (const c of obj.campaigns || []){ try { const o = migrate(c); if (!opts.ids || opts.ids.includes(o.id)){ await idbSet('camp:' + o.id, JSON.stringify(o)); lsSet('pcp-camp:' + o.id, o); const i = META.campaigns.findIndex(x => x.id === o.id); const e = metaEntry(o); if (i >= 0) META.campaigns[i] = e; else META.campaigns.push(e); n++; } } catch (e) {} }
  if (opts.rules && obj.rules && obj.rules.tables){ RULES = mergeRules(obj.rules); saveRules(); }
  if (Array.isArray(obj.lists)){ obj.lists.forEach(l => { const i = LISTS.findIndex(x => x.id === l.id); if (i >= 0) LISTS[i] = l; else LISTS.push(l); }); saveLists(); }
  lsSet('pcp-meta', META); await idbSet('meta', META);
  const target = (opts.ids && opts.ids[0]) || obj.current; if (target && META.campaigns.some(c => c.id === target)) await switchCampaign(target); else render();
  return n;
}
function toast(msg){ if (!isBrowser) return; const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3200); }

