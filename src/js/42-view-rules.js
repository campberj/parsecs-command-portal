/* ----- rules data ----- */
let RULE_DRAFT = null;
function ruleRows(id){ return RULE_DRAFT && RULE_DRAFT.id === id ? RULE_DRAFT.rows : JSON.parse(JSON.stringify(R(id))); }
function viewRules(){
  const ids = Object.keys(TABLE_DEFS).sort((a, b) => TABLE_DEFS[a].order - TABLE_DEFS[b].order);
  const cnt = st => ids.filter(i => rulesFlag(i) === st).length; const cur = S.ui.rulesTab || ids[0]; const def = TABLE_DEFS[cur]; const rows = ruleRows(cur);
  const errs = RULE_DRAFT && RULE_DRAFT.id === cur ? RULE_DRAFT.errs || [] : [];
  const cell = (r, i, [k, , type, opts]) => {
    if (type === 'fixed') return `<td class="mono small">${esc(r[k])}</td>`;
    if (type === 'sel') return `<td><select name="c|${i}|${k}" aria-label="${k} row ${i + 1}">${opts.map(([v, l]) => `<option value="${v}" ${String(r[k] || '') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></td>`;
    return `<td class="${type === 'int' || type === 'num' ? 'n' : ''}"><input type="${type === 'int' || type === 'num' ? 'number' : 'text'}" ${type === 'num' ? 'step="any"' : ''} name="c|${i}|${k}" value="${esc(r[k] == null ? '' : r[k])}" aria-label="${k} row ${i + 1}"></td>`; };
  return `<div class="panel stack"><div class="panel-h"><h3>Rules data</h3><span class="pill warn">${cnt('placeholder')} placeholder</span><span class="pill info">${cnt('keyed')} keyed in</span><span class="pill good">${cnt('verified')} verified</span></div>
      <p class="small muted" style="margin:0;max-width:80ch">These are the book tables the engine reads. The shipped rows are condensed placeholders. Key in your book's values, then mark each table Keyed in or Verified. The rules pack is saved on this computer only and is shared by all your campaigns; it is included in backups.</p>
      <div class="row"><button class="btn" type="button" data-act="rulesexp">Export rules pack</button><label class="btn" for="rules-file" style="cursor:pointer">Import rules pack…</label><input type="file" id="rules-file" accept=".json,application/json" hidden data-chg="rulesfile"></div></div>
    <div class="split rules-split">
      <div class="panel"><div class="stack" style="gap:4px">${ids.map(i => `<button class="btn sm" type="button" data-act="rtab" data-k="${i}" style="text-align:left;${i === cur ? 'border-color:var(--accent);background:var(--hl)' : ''}"><span class="status-${rulesFlag(i)}">●</span> ${esc(TABLE_DEFS[i].name)}${TABLE_DEFS[i].die ? ` <span class="muted mono">D${TABLE_DEFS[i].die}</span>` : ''}</button>`).join('')}</div></div>
      <form class="panel stack" data-form="rtable" data-id="${cur}"><div class="panel-h"><h3>${esc(def.name)}</h3>${def.die ? `<span class="chip">D${def.die}</span>` : ''}<span class="chip">${esc(def.source)}</span>
          <label class="f"><span>Status</span><select name="status" id="r-status"><option value="placeholder" ${rulesFlag(cur) === 'placeholder' ? 'selected' : ''}>Placeholder</option><option value="keyed" ${rulesFlag(cur) === 'keyed' ? 'selected' : ''}>Keyed in</option><option value="verified" ${rulesFlag(cur) === 'verified' ? 'selected' : ''}>Verified</option></select></label></div>
        <p class="small" style="margin:0">${esc(def.why)}${def.help ? ` <span class="muted">${esc(def.help)}</span>` : ''}</p>
        ${errs.length ? `<ul class="legal">${errs.map(e => `<li class="err">${esc(e)}</li>`).join('')}</ul>` : ''}
        <div class="tblwrap"><table class="tbl rgrid"><thead><tr>${def.cols.map(c => `<th>${esc(c[1])}</th>`).join('')}${def.fixed ? '' : '<th></th>'}</tr></thead><tbody>
          ${rows.map((r, i) => `<tr>${def.cols.map(c => cell(r, i, c)).join('')}${def.fixed ? '' : `<td><button class="btn sm danger" type="button" data-act="rrowdel" data-i="${i}" aria-label="Delete row ${i + 1}">×</button></td>`}</tr>`).join('')}</tbody></table></div>
        <div class="row"><button class="btn primary" type="submit" name="dir" value="save">Check and save</button>${def.fixed ? '' : '<button class="btn" type="submit" name="dir" value="add">Add row</button>'}<button class="btn" type="button" data-act="rreset">Back to placeholder</button>${RULE_DRAFT && RULE_DRAFT.id === cur ? '<span class="pill warn">Unsaved changes</span>' : ''}</div>
        ${def.fixed ? '' : `<details><summary class="small">Paste rows from a spreadsheet or text</summary><p class="small muted">One row per line, columns in this order separated by tabs, | or ;: ${def.cols.map(c => esc(c[1])).join(' | ')}. This replaces the rows above (not saved until you press Check and save).</p>
          <textarea rows="6" name="paste" id="r-paste"></textarea><div class="row"><button class="btn" type="submit" name="dir" value="paste">Replace rows from pasted text</button></div></details>`}</form></div>`;
}
function ruleFormRows(id, fd){
  const def = TABLE_DEFS[id]; const base = ruleRows(id); const rows = base.map(r => ({ ...r }));
  for (const [k, v] of fd.entries()){ const p = k.split('|'); if (p[0] !== 'c') continue; const i = parseInt(p[1], 10); const col = def.cols.find(c => c[0] === p[2]); if (!rows[i] || !col) continue;
    rows[i][p[2]] = col[2] === 'int' ? (v === '' ? '' : parseInt(v, 10)) : col[2] === 'num' ? (v === '' ? '' : parseFloat(v)) : v; }
  return rows;
}
function parsePasted(id, text){
  const def = TABLE_DEFS[id]; return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const parts = l.split(/\t|\||;/).map(x => x.trim()); const r = {};
    def.cols.forEach(([k, , type, opts], i) => { let v = parts[i] == null ? '' : parts[i];
      if (type === 'int') v = parseInt(String(v).replace(/^.*[–-]\s*/, ''), 10) || 0; else if (type === 'num') v = parseFloat(v) || 0;
      else if (type === 'sel'){ const hit = opts.find(([ov, ol]) => ov.toLowerCase() === String(v).toLowerCase() || ol.toLowerCase() === String(v).toLowerCase()); v = hit ? hit[0] : ''; }
      r[k] = v; }); return r; });
}

