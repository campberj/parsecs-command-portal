/* ----- post-battle wizard ----- */
const WIZ_STEPS = ['Outcome','Casualties','Experience','Awards and notes','Review'];
function wizStart(m){
  const figs = {}; forceUnits(m).forEach(u => u.figures.filter(f => f.status === 'active').forEach(f => { figs[f.id] = { u:u.id, kills:0, state:'ok', stab:false, first:false, unique:false, award:'', note:'' }; }));
  S.ui.wiz = { mid:m.id, step:0, data:{ outcome:'Victory', vp:0, secondary:false, figs, wiped:{}, unitNotes:{} } };
}
function wizFigRows(m, fn){ const d = S.ui.wiz.data; return forceUnits(m).map(u => { const fs = u.figures.filter(f => d.figs[f.id]); if (!fs.length) return ''; return fn(u, fs); }).join(''); }
function wizXpPreview(f, ff, outcome){
  if (!S.mods.figureXP || ff.state === 'dead') return ''; let x = ff.state === 'casualty' ? figXpOf('casualty') : figXpOf(outcome === 'Victory' ? 'survivedWin' : 'survivedLoss');
  if (ff.first) x += figXpOf('firstBlood'); if (ff.unique) x += figXpOf('unique'); x += (parseInt(ff.kills, 10) || 0) * figXpOf('perKill'); return `+${x} XP${ff.state === 'casualty' ? ' (plus any injury bonus)' : ''}`;
}
function wizardPanel(m){
  const w = S.ui.wiz;
  if (!w || w.mid !== m.id) return `<div class="panel stack"><div class="panel-h"><h3>After the battle</h3></div><p class="small muted" style="margin:0">A five-step after-action report: outcome, casualties and injuries, experience, awards and notes, then a review before any dice are rolled.</p>
    <div class="row"><button class="btn primary" type="button" data-act="wizstart" data-id="${m.id}" ${S.pendingDice ? 'disabled' : ''}>Start the after-action report</button></div></div>`;
  const d = w.data; const st = w.step;
  const steps = `<div class="steps">${WIZ_STEPS.map((x, i) => `<span class="${i === st ? 'on' : i < st ? 'done' : ''}">${i + 1}. ${x}</span>`).join('')}</div>`;
  let body = '';
  if (st === 0){
    body = `<div class="row"><div class="seg" role="radiogroup" aria-label="Outcome">${['Victory','Draw','Defeat'].map(o => `<label class="chk" style="padding:4px 10px"><input type="radio" name="outcome" value="${o}" ${d.outcome === o ? 'checked' : ''}> ${o}</label>`).join('')}</div>
      <label class="f"><span>Victory points (0 if none)</span><input type="number" name="vp" id="wz-vp" value="${d.vp}" min="0" style="width:90px"></label></div>
      ${m.secondary ? `<label class="chk"><input type="checkbox" name="secondary" ${d.secondary ? 'checked' : ''}> Secondary objective achieved: ${esc(m.secondary)}</label>` : ''}`;
  } else if (st === 1){
    body = `<p class="small muted" style="margin:0">Casualties roll on the Casualty Injury table${rulesFlag('injury') === 'placeholder' ? ' (placeholder values until you key it in)' : ''}. ${S.mods.fieldStab ? 'Tick Stabilized for a figure treated on the table: it rerolls and the second result stands.' : ''} Mark Killed only for a death the story already decided.</p>` +
      wizFigRows(m, (u, fs) => `<div class="tblwrap"><table class="tbl"><thead><tr><th>${esc(u.name)}</th><th class="num">Kills</th><th>Result</th>${S.mods.fieldStab ? '<th>Stabilized</th>' : ''}</tr></thead><tbody>
        ${fs.map(f => { const ff = d.figs[f.id]; return `<tr><td>${esc(f.name)}</td><td class="num"><input type="number" min="0" value="${ff.kills}" style="width:60px" name="k|${f.id}" aria-label="Kills by ${esc(f.name)}"></td>
          <td><select name="s|${f.id}" aria-label="${esc(f.name)} result">${[['ok','Fine'],['casualty','Casualty (roll injury)'],['dead','Killed']].map(([k, l]) => `<option value="${k}" ${ff.state === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
          ${S.mods.fieldStab ? `<td><input type="checkbox" name="st|${f.id}" ${ff.stab ? 'checked' : ''} aria-label="${esc(f.name)} stabilized"></td>` : ''}</tr>`; }).join('')}
        <tr><td colspan="4"><label class="chk small"><input type="checkbox" name="wipe|${u.id}" ${d.wiped[u.id] ? 'checked' : ''}> Whole unit became casualties (roll Unit Losses)</label></td></tr></tbody></table></div>`);
  } else if (st === 2){
    body = `<p class="small muted" style="margin:0">${S.mods.figureXP ? 'Named figures earn XP from the Figure Experience table; units also roll unit XP.' : 'Units roll unit XP. Turn on per-figure XP in Mods to track XP for each named figure.'}</p>` +
      wizFigRows(m, (u, fs) => `<div class="tblwrap"><table class="tbl"><thead><tr><th>${esc(u.name)}</th><th>First blood</th><th>Killed a unique enemy</th>${S.mods.figureXP ? '<th>XP</th>' : ''}</tr></thead><tbody>
        ${fs.map(f => { const ff = d.figs[f.id]; return `<tr><td>${esc(f.name)}${ff.state !== 'ok' ? ` <span class="pill ${ff.state === 'dead' ? 'crit' : 'warn'}">${ff.state === 'dead' ? 'Killed' : 'Casualty'}</span>` : ''}</td>
          <td><input type="radio" name="first" value="${f.id}" ${ff.first ? 'checked' : ''} aria-label="${esc(f.name)} drew first blood"></td><td><input type="checkbox" name="un|${f.id}" ${ff.unique ? 'checked' : ''} aria-label="${esc(f.name)} killed a unique enemy"></td>
          ${S.mods.figureXP ? `<td class="mono small">${wizXpPreview(f, ff, d.outcome)}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>`) +
      `<label class="chk small"><input type="radio" name="first" value="" ${Object.values(d.figs).some(x => x.first) ? '' : 'checked'}> Nobody on your side drew first blood</label>`;
  } else if (st === 3){
    body = `<p class="small muted" style="margin:0">Notes go on each figure's record and into the scene packet. Awards apply their XP and ${esc(S.content.tokenName || 'tokens')} when you apply the report.</p>` +
      wizFigRows(m, (u, fs) => `<div class="tblwrap"><table class="tbl"><thead><tr><th>${esc(u.name)}</th><th>Award</th><th>What happened</th></tr></thead><tbody>
        ${fs.map(f => { const ff = d.figs[f.id]; return `<tr><td>${esc(f.name)}</td><td><select name="aw|${f.id}" aria-label="Award for ${esc(f.name)}"><option value="">—</option>${awardList().map(a => `<option ${ff.award === a.name ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></td>
          <td><input type="text" name="nt|${f.id}" value="${esc(ff.note)}" placeholder="Held the door alone" style="width:100%" aria-label="Note for ${esc(f.name)}"></td></tr>`; }).join('')}
        <tr><td colspan="3"><input type="text" name="unote|${u.id}" value="${esc(d.unitNotes[u.id] || '')}" placeholder="Unit note for the record" style="width:100%" aria-label="Note for ${esc(u.name)}"></td></tr></tbody></table></div>`);
  } else {
    const cas = Object.entries(d.figs).filter(([, x]) => x.state === 'casualty'); const all = forceUnits(m).flatMap(u => u.figures); const nm = id => (all.find(f => f.id === id) || {}).name;
    const dice = ['Campaign Points: 3D6, drop the lowest'];
    cas.forEach(([id, x]) => { dice.push(`Injury for ${nm(id)}: D100${x.stab && S.mods.fieldStab ? ', then a reroll that stands' : ''}, plus recovery time if out of action`); });
    Object.keys(d.wiped).filter(k => d.wiped[k]).forEach(k => dice.push(`Unit Losses for ${S.roster.units.find(u => u.id === k).name}: D6`));
    forceUnits(m).forEach(u => dice.push(`Unit XP for ${u.name}`));
    const awards = Object.entries(d.figs).filter(([, x]) => x.award);
    body = `<div class="cols-2"><div><h4>Entered</h4><ul class="small"><li>${esc(d.outcome)}${d.vp ? `, ${d.vp} VP` : ''}${d.secondary ? '; secondary achieved' : ''}</li>
        ${Object.entries(d.figs).filter(([, x]) => x.kills > 0 || x.state !== 'ok' || x.first).map(([id, x]) => `<li>${esc(nm(id))}: ${[x.kills > 0 ? `${x.kills} kill${x.kills > 1 ? 's' : ''}` : '', x.state === 'casualty' ? 'casualty' : x.state === 'dead' ? 'killed' : '', x.first ? 'first blood' : ''].filter(Boolean).join(', ')}</li>`).join('')}
        ${awards.map(([id, x]) => `<li>${esc(nm(id))}: ${esc(x.award)}</li>`).join('')}</ul></div>
      <div><h4>Dice to roll</h4><ul class="small">${dice.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="small muted">${appDice() ? 'The portal rolls them when you apply.' : 'You will be asked for them on one card when you apply.'}</p></div></div>`;
  }
  const last = st === WIZ_STEPS.length - 1;
  return `<form class="panel stack" data-form="wiz" data-id="${m.id}"><div class="panel-h"><h3>After-action report</h3><button class="btn sm" type="button" data-act="wizcancel">Discard report</button></div>${steps}${body}
    <div class="row">${st > 0 ? '<button class="btn" type="submit" name="dir" value="back">Back</button>' : ''}<button class="btn primary" type="submit" name="dir" value="${last ? 'apply' : 'next'}" ${S.pendingDice ? 'disabled' : ''}>${last ? 'Apply the report' : 'Next'}</button></div></form>`;
}
function wizCollect(f, fd){
  const w = S.ui.wiz; const d = w.data; const st = w.step;
  if (st === 0){ d.outcome = fd.get('outcome') || 'Victory'; d.vp = parseInt(fd.get('vp'), 10) || 0; d.secondary = !!fd.get('secondary'); }
  if (st === 1){ Object.keys(d.figs).forEach(id => { if (fd.has('k|' + id)){ d.figs[id].kills = parseInt(fd.get('k|' + id), 10) || 0; d.figs[id].state = fd.get('s|' + id) || 'ok'; d.figs[id].stab = !!fd.get('st|' + id); } });
    forceUnits(S.missions.find(x => x.id === w.mid)).forEach(u => { d.wiped[u.id] = !!fd.get('wipe|' + u.id); }); }
  if (st === 2){ const first = fd.get('first'); Object.keys(d.figs).forEach(id => { d.figs[id].first = first === id; d.figs[id].unique = !!fd.get('un|' + id); }); }
  if (st === 3){ Object.keys(d.figs).forEach(id => { if (fd.has('aw|' + id)){ d.figs[id].award = fd.get('aw|' + id) || ''; d.figs[id].note = fd.get('nt|' + id) || ''; } });
    for (const [k, v] of fd.entries()) if (k.startsWith('unote|')) d.unitNotes[k.slice(6)] = v; }
}
function sceneCard(sc){
  return `<article class="scene"><div class="row"><span class="pill info">${esc(sc.kind)}</span><h3 style="flex:1">${esc(sc.title)}</h3><span class="mono small muted">T${sc.turn} · ${sc.sd}</span><button class="btn sm" type="button" data-act="copyscene" data-id="${sc.id}">Copy</button></div>
    ${sc.beats.map(b => b.stage ? `<div class="beat"><div class="stage">${esc(b.stage)}</div></div>` : b.orders ? `<div class="orders">${esc(b.line)}</div>` : `<div class="beat"><div class="who">${esc(vName(voiceById(b.who)))}</div><div class="say">${esc(b.line)}</div></div>`).join('')}</article>`;
}

