/* ----- campaigns, backups ----- */
function daysSince(iso){ return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : null; }
function backupNag(){
  if (!['map','setup'].includes(S.ui.tab)) return '';
  if (dirState === 'prompt') return `<div class="banner row"><span style="flex:1"><b>Backup folder needs permission again.</b> Browsers ask once per session for a local file.</span><button class="btn primary" type="button" data-act="reconnect">Reconnect backup folder</button></div>`;
  const dd = daysSince(META.lastBackup);
  if (dirState === 'none' && (dd == null ? S.turn > 1 : dd >= 7)) return `<div class="banner row"><span style="flex:1"><b>${dd == null ? 'No backup yet.' : `Last backup ${dd} days ago.`}</b> Browser storage for a local file is wiped if you clear browsing data.</span>${canFolder() ? '<button class="btn primary" type="button" data-act="linkfolder">Link a backup folder</button>' : ''}<button class="btn" type="button" data-act="dlbackup">Download backup</button></div>`;
  return '';
}
function viewSetup(){
  const st = S.setup; const dd = daysSince(META.lastBackup);
  const facs = [...S.armory.factions].sort((a, b) => (a.side === b.side ? a.name.localeCompare(b.name) : a.side === 'player' ? -1 : 1));
  const facOpts = (sel, avoid) => facs.map(f => `<option value="${f.id}" ${sel === f.id ? 'selected' : ''}>${esc(f.name)}${S.armory.templates.some(t => t.faction === f.id) ? '' : ' (no templates yet)'}</option>`).join('');
  const oppDefault = st.opponent !== st.player ? st.opponent : (facs.find(f => f.id !== st.player) || {}).id;
  const camps = [...META.campaigns].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  return `<div class="panel stack"><div class="panel-h"><h3>Campaigns</h3><span class="small muted">${camps.length} on this computer</span></div>
      <div class="tblwrap"><table class="tbl"><thead><tr><th>Campaign</th><th>Theater</th><th class="num">Turn</th><th class="num">Missions</th><th>Last saved</th><th></th></tr></thead><tbody>
      ${camps.map(c => `<tr class="${c.id === S.id ? 'sel' : ''}"><td><b>${esc(c.name)}</b>${c.id === S.id ? ' <span class="pill good">Open</span>' : ''}${c.ended ? ` <span class="pill mute">${esc(c.ended)}</span>` : ''}</td><td>${esc(c.theater)}</td><td class="num mono">${c.turn}</td><td class="num mono">${c.missions || 0}</td><td class="small mono">${c.updated ? esc(new Date(c.updated).toLocaleString()) : '—'}</td>
        <td><div class="row" style="gap:4px;flex-wrap:nowrap">${c.id !== S.id ? `<button class="btn sm" type="button" data-act="campopen" data-id="${c.id}">Open</button>` : ''}<button class="btn sm" type="button" data-act="campdup" data-id="${c.id}">Duplicate</button><button class="btn sm" type="button" data-act="campexp" data-id="${c.id}">Export</button><button class="btn sm danger" type="button" data-act="campdel" data-id="${c.id}">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>
    <div class="panel stack"><div class="panel-h"><h3>Backups</h3><span class="pill ${dirState === 'ok' ? 'good' : 'warn'}">${dirState === 'ok' ? 'Folder linked' : dirState === 'prompt' ? 'Folder needs permission' : 'No folder linked'}</span><span class="small muted">${META.lastBackup ? `Last backup ${esc(new Date(META.lastBackup).toLocaleString())}${dd ? ` (${dd} day${dd > 1 ? 's' : ''} ago)` : ''}: ${esc(META.lastBackupNote || '')}` : 'Never backed up'}</span></div>
      <p class="small" style="margin:0;max-width:80ch">The portal saves as you go, in this browser's storage for this file. That storage is shared by every local page and is wiped if you clear browsing data, so the backup folder is the record of truth. With a folder linked (Chrome or Edge), the portal writes <span class="mono">parsecs-backup-latest.json</span> after every turn and mission, plus a dated copy (the newest 30 are kept). Each backup holds every campaign and your rules pack.</p>
      <div class="row">${canFolder() ? (dirState === 'prompt' ? '<button class="btn primary" type="button" data-act="reconnect">Reconnect folder</button>' : `<button class="btn ${dirState === 'ok' ? '' : 'primary'}" type="button" data-act="linkfolder">${dirState === 'ok' ? 'Change folder' : 'Link a backup folder'}</button>`) : '<span class="small muted">This browser cannot write to a folder; use Download backup.</span>'}
        ${dirState === 'ok' ? '<button class="btn" type="button" data-act="backupnow">Back up now</button>' : ''}<button class="btn" type="button" data-act="dlbackup">Download backup</button>
        <label class="btn" for="restore-file" style="cursor:pointer">Restore from a backup or campaign file…</label><input type="file" id="restore-file" accept=".json,application/json" hidden data-chg="restorefile"></div></div>
    <form class="panel stack" data-form="newcampaign"><div class="panel-h"><h3>New campaign</h3><span class="muted small">Opens in its own save slot; this campaign stays as it is.</span></div>
      <div class="form-grid">
        <label class="f"><span>Campaign name</span><input type="text" name="name" id="nc-name" value="${esc(st.name)}"></label>
        <label class="f"><span>Theater</span><input type="text" name="theater" id="nc-theater" value="${esc(st.theater)}"></label>
        <label class="f"><span>Command scale</span><select name="scale" id="nc-scale">${[['fireteam','Fireteam'],['squad','Squad'],['platoon','Platoon'],['reinforced','Reinforced platoon']].map(([k, l]) => `<option value="${k}" ${st.scale === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="f"><span>Length</span><select name="length" id="nc-length">${[['short','Short'],['standard','Standard'],['long','Long']].map(([k, l]) => `<option value="${k}" ${st.length === k ? 'selected' : ''}>${l} (Cohesion ${cohesionFor(k)})</option>`).join('')}</select></label>
        <label class="f"><span>World type</span><select name="world" id="nc-world">${WORLD_TYPES.map(w => `<option ${st.world === w ? 'selected' : ''}>${w}</option>`).join('')}</select></label>
        <label class="f"><span>Your faction</span><select name="player" id="nc-player">${facOpts(st.player)}</select></label>
        <label class="f"><span>Opponent</span><select name="opponent" id="nc-opp">${facOpts(oppDefault)}</select></label>
        <label class="f"><span>Starting stardate</span><input type="text" name="stardate" id="nc-sd" value="${esc(st.stardate)}"></label>
        <label class="f"><span>Seed (blank for random)</span><input type="text" name="seed" id="nc-seed" placeholder="${esc(S.seed)}"></label></div>
      <label class="chk"><input type="checkbox" name="special" id="nc-special" ${st.special ? 'checked' : ''}> Special regions (Urban, Critical, Defensible, Resource) inside each side's territory</label>
      <label class="chk"><input type="checkbox" name="carry" id="nc-carry" checked> Start from this campaign's armory and mods, and its roster and story content if you keep the same faction (unticked: the example data plus the factions you picked)</label>
      <p class="small muted" style="margin:0;max-width:80ch">A faction other than this campaign's gets an auto-built starter force sized to the command scale, and neutral command voices. The 78th keeps its example roster and voice cards.</p>
      <div class="row"><button class="btn primary" type="submit">Generate campaign</button><span class="small muted">Same seed and settings give the same map. With app dice off, you roll the opening Army Strengths.</span></div></form>
    <div class="panel"><h3>About __VERSION__</h3><p class="small" style="max-width:72ch">Parsecs Command __VERSION__ runs from this single file. Book tables come from the Rules data tab; the example 78th data and voice cards are a content pack you can edit or replace. Battle companion features are planned for 2.0.</p></div>`;
}

