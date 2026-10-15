/* ----- modal dialogs ----- */
let MODAL = null;
function renderModal(){
  const el = document.getElementById('modal'); if (!el) return;
  if (!MODAL){ el.innerHTML = ''; return; }
  let body = '';
  if (MODAL.kind === 'propagate'){
    const users = tplUsers(MODAL.draft.id);
    body = `<h3>This template is in use</h3><p class="small" style="margin:0">${users.length} roster unit${users.length > 1 ? 's use' : ' uses'} <b>${esc(MODAL.draft.name)}</b>. Ticked units take the new version. Unticked units keep the current version as their own variant, so nothing changes for them.</p>
      <form class="stack" data-form="propagate">${users.map(u => `<label class="chk"><input type="checkbox" name="u" value="${u.id}" checked> ${esc(u.name)} <span class="muted small">${u.figures.filter(f => f.status !== 'kia').length} figures</span></label>`).join('')}
        <label class="chk"><input type="checkbox" name="refit" ${S.mods.refitDefault ? 'checked' : ''}> Charge a refit: ${RP('refit')} CP per updated unit (you have ${S.cp})</label>
        <div class="row"><button class="btn primary" type="submit">Save template</button><button class="btn" type="button" data-act="modalclose">Cancel</button></div></form>`;
  } else if (MODAL.kind === 'import'){
    const it = MODAL.items; const by = k => it.filter(i => i.key === k);
    body = `<h3>Import preview</h3><p class="small" style="margin:0">${it.filter(i => i.status === 'new').length} new · ${it.filter(i => i.status === 'changed').length} changed · ${it.filter(i => i.status === 'same').length} unchanged. Nothing is applied until you press Import.</p>
      <form class="stack" data-form="importapply">${BUNDLE_KEYS.filter(k => by(k).length).map(k => `<div><h4>${k}</h4><div class="tblwrap"><table class="tbl diff"><tbody>${by(k).map(i => { const n = it.indexOf(i);
        return `<tr><td style="width:28px"><input type="checkbox" name="i" value="${n}" ${i.pick ? 'checked' : ''} aria-label="Import ${esc(i.name)}"></td><td><b>${esc(i.name)}</b>${i.warn ? `<div class="small" style="color:var(--warn)">${esc(i.warn)}</div>` : ''}${i.changes.length ? `<div class="chg">${i.changes.slice(0, 8).map(c => `${esc(c.path)}: ${esc(String(c.from == null ? '—' : c.from).slice(0, 40))} → ${esc(String(c.to == null ? '—' : c.to).slice(0, 40))}`).join('<br>')}${i.changes.length > 8 ? `<br>and ${i.changes.length - 8} more` : ''}</div>` : ''}</td>
          <td><span class="pill ${i.status === 'new' ? 'good' : i.status === 'changed' ? 'warn' : 'mute'}">${i.status}</span></td></tr>`; }).join('')}</tbody></table></div></div>`).join('')}
        <label class="chk"><input type="checkbox" name="copies"> Import as copies with new ids (keeps your existing entries untouched)</label>
        <div class="row"><button class="btn primary" type="submit">Import selected</button><button class="btn" type="button" data-act="modalclose">Cancel</button></div></form>`;
  } else if (MODAL.kind === 'importtext'){
    body = `<h3>Import units or lists</h3><p class="small" style="margin:0">Paste JSON exported from the portal, or a unit you designed in chat. Accepted lists: ${BUNDLE_KEYS.join(', ')}.</p>
      <textarea id="imp-text" rows="10" aria-label="JSON to import"></textarea>
      <div class="row"><button class="btn primary" type="button" data-act="importparse">Preview import</button><label class="btn" for="imp-ufile" style="cursor:pointer">Load a file…</label><input type="file" id="imp-ufile" accept=".json,application/json" hidden data-chg="impufile"><button class="btn" type="button" data-act="modalclose">Cancel</button></div>`;
  } else if (MODAL.kind === 'unit'){
    const t = S.armory.templates.find(x => x.id === MODAL.id); body = t ? unitDetail(t) : '<p>That unit is no longer in the armory.</p><button class="btn" type="button" data-act="modalclose">Close</button>';
  } else if (MODAL.kind === 'restore'){
    const o = MODAL.obj;
    body = `<h3>Restore from backup</h3><p class="small" style="margin:0">Saved ${esc(new Date(o.saved).toLocaleString())}. Campaigns with the same id on this computer are replaced; others are left alone.</p>
      <form class="stack" data-form="restore">${(o.campaigns || []).map(c => `<label class="chk"><input type="checkbox" name="c" value="${esc(c.id)}" checked> <b>${esc(c.setup.name)}</b> <span class="muted small">turn ${c.turn}${META.campaigns.some(x => x.id === c.id) ? ' · replaces the copy here' : ' · new here'}</span></label>`).join('')}
        ${o.rules ? '<label class="chk"><input type="checkbox" name="rules"> Also replace my rules pack with the one in this backup</label>' : ''}
        <div class="row"><button class="btn primary" type="submit">Restore</button><button class="btn" type="button" data-act="modalclose">Cancel</button></div></form>`;
  }
  el.innerHTML = `<div class="modal-bg" role="dialog" aria-modal="true"><div class="modal">${body}</div></div>`;
}

