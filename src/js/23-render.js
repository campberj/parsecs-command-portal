function render(){
  if (!isBrowser) return;
  renderTop(); renderTabs();
  const v = document.getElementById('view');
  const views = { map:viewMap, forces:viewForces, armory:viewArmory, missions:viewMissions, library:viewLibrary, quick:viewQuick, events:viewEvents, story:viewStory, mods:viewMods, journal:viewJournal, rules:viewRules, setup:viewSetup };
  const dice = S.pendingDice ? diceCard() : '';
  let body;
  if (!S.map) body = `<div class="empty">The campaign map is waiting for its opening dice.</div>`;
  else body = (views[S.ui.tab] || viewMap)();
  v.innerHTML = `<div class="stack">${backupNag()}${dice}${body}</div>`;
  if (S.pendingDice){ const f = document.getElementById('dice-0'); if (f) f.focus({ preventScroll:true }); }
  renderModal();
  save();
}
function pips(n, max, cls){ let s = ''; for (let i = 0; i < max; i++) s += `<span class="pip ${i < n ? cls : ''}"></span>`; return `<span class="pips" aria-hidden="true">${s}</span>`; }
function renderTop(){
  const pend = S.inbox.filter(e => !e.resolved).length; const max = Math.max(cohesionFor(S.setup.length), S.cohesion.P, S.cohesion.E);
  let label = `End turn ${S.turn}`;
  if (S.ended) label = 'Campaign over'; else if (S.pendingDice) label = 'Enter dice to continue'; else if (S.turnPhase > 0) label = `Continue turn ${S.turn}`; else if (pend) label = `Resolve ${pend} decision${pend > 1 ? 's' : ''} first`;
  document.getElementById('topbar').innerHTML = `
    <div class="brand">Parsecs Command <small>v__VERSION__</small></div>
    <div class="meta">
      <span><span class="lbl">Campaign</span> <b>${esc(S.setup.name)}</b></span>
      <span><span class="lbl">Turn</span> <b>${S.turn}</b></span>
      <span><span class="lbl">Stardate</span> <b>${stardate(S.turn)}</b></span>
      <span class="coh"><span class="lbl">Your cohesion</span> ${pips(S.cohesion.P, max, 'p')} <b>${S.cohesion.P}</b></span>
      <span class="coh"><span class="lbl">Enemy</span> ${pips(S.cohesion.E, max, 'e')} <b>${S.cohesion.E}</b></span>
      <span><span class="lbl">CP</span> <b>${S.cp}</b></span>
      <span><span class="lbl">Story</span> <b>${S.story}</b></span>
      ${S.mods.mercenary ? `<span><span class="lbl">Munitions</span> <b>${S.munitions}</b></span>` : ''}
      <span><span class="lbl">Dice</span> <b>${appDice() ? 'App' : 'Yours'}</b></span>
      <span title="${META.lastBackup ? 'Last backup ' + new Date(META.lastBackup).toLocaleString() : 'No backup yet'}"><span class="lbl">Backup</span> <b style="color:${dirState === 'ok' ? 'var(--good)' : 'var(--warn)'}">${dirState === 'ok' ? 'Folder' : dirState === 'prompt' ? 'Reconnect' : 'Off'}</b></span>
    </div>
    <span class="spacer"></span>
    <button class="btn primary" type="button" id="advance" data-act="advance" ${canAdvance() ? '' : 'disabled'}>${label}</button>`;
}
function renderTabs(){
  const pend = S.inbox.filter(e => !e.resolved).length;
  document.getElementById('tabs').innerHTML = TABS.map(([k, l]) => `<button class="tab" type="button" role="tab" id="tab-${k}" aria-selected="${S.ui.tab === k}" data-act="tab" data-k="${k}">${l}${k === 'events' && pend ? `<span class="cnt">${pend}</span>` : ''}</button>`).join('');
}
function diceCard(){
  const p = S.pendingDice;
  return `<form class="dicecard" data-form="dice" aria-label="Dice needed">
    <div class="row"><span class="pill warn">Your dice</span><h3 style="flex:1">${esc(stepTitle(p))}</h3><span class="small muted">${p.requests.length} ${p.requests.length === 1 ? 'die' : 'dice'}${p.provided.length ? ` · ${p.provided.length} already entered` : ''}</span></div>
    <p class="small">Roll and enter each die in order. The portal applies them and only asks again if a result calls for more dice, such as a refight.</p>
    <div>${p.requests.map((r, i) => `<div class="dicerow"><label for="dice-${i}" class="small">${esc(r.label)}</label><span class="die">D${r.sides}</span><input type="number" inputmode="numeric" min="1" max="${r.sides}" id="dice-${i}" name="d${i}" required aria-label="${esc(r.label)}"></div>`).join('')}</div>
    <div class="row"><button class="btn primary" type="submit">Apply my dice</button><button class="btn" type="button" data-act="diceauto">Roll these for me</button>
      ${p.key !== 'phase' && p.key !== 'setup' ? '<button class="btn" type="button" data-act="dicecancel">Cancel this step</button>' : ''}</div>
  </form>`;
}
function stepResult(r, okMsg){ if (r.pending) toast('Dice needed: enter them in the card at the top.'); else if (okMsg) toast(okMsg); }

