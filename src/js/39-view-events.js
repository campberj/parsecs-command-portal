/* ----- events ----- */
function viewEvents(){
  const pend = S.inbox.filter(e => !e.resolved), done = S.inbox.filter(e => e.resolved).slice(-8).reverse();
  return `<div class="panel"><div class="panel-h"><h3>Pending decisions</h3><span class="muted small">The turn cannot end until these are resolved.</span>
      <button class="btn sm" type="button" data-act="rollstory" ${S.pendingDice ? 'disabled' : ''}>Roll a story event now</button><button class="btn sm" type="button" data-act="rollevent">Draw an interactive event</button></div>
      ${pend.length ? '' : `<div class="empty">Nothing pending. Story events arrive every ${S.mods.pace} turn(s); interactive events about ${S.mods.eventChance}% of turns.</div>`}</div>
    ${pend.map(eventCard).join('')}
    ${done.length ? `<div class="panel"><h3>Resolved</h3><ul class="small" style="margin:8px 0 0;padding-left:16px">${done.map(e => `<li><b>${esc(e.title)}</b> — ${esc(e.choice || '')}. ${esc(e.outcome || '')}</li>`).join('')}</ul></div>` : ''}`;
}
function eventCard(ev){
  const dis = S.pendingDice ? 'disabled' : '';
  if (ev.kind === 'story'){
    return `<article class="card-ev story"><div class="row"><span class="pill info">Story event</span><span class="mono small">D100 ${ev.roll}</span><h3 style="flex:1">${esc(ev.title)}</h3></div><p>${esc(ev.text)}</p>
      <div class="choice"><div class="t small"><b>Player action (optional).</b> Propose an action that follows from this event. A D6 of 3–6 succeeds.</div>
        <input type="text" id="pa-${ev.id}" placeholder="Fortify the crossroads as a forward base" style="flex:1;min-width:200px"><button class="btn sm" type="button" data-act="paction" data-id="${ev.id}" ${dis}>Attempt</button></div>
      ${ev.paction ? `<div class="small">${esc(ev.paction)}</div>` : ''}
      <div class="row"><button class="btn primary" type="button" data-act="applystory" data-id="${ev.id}" ${dis}>Apply the event</button></div></article>`;
  }
  const tpl = EVENTS.find(e => e.id === ev.tpl);
  return `<article class="card-ev"><div class="row"><span class="pill warn">${ev.kind === 'milestone' ? 'Personnel' : 'Decision'}</span><h3 style="flex:1">${esc(ev.title)}</h3>${(ev.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div><p>${esc(ev.text)}</p>
    ${ev.choices.map((c, i) => { const ch = tpl && tpl.choices[i]; const test = ch && ch.test;
      return `<div class="choice"><div class="t"><b>${esc(c)}</b>${test ? ` <span class="small muted">— ${test.stat === 'tr' ? 'Training' : 'Savvy'} test ${test.tn}+</span>` : ''}${ch && ch.cost ? ` <span class="small muted">— costs ${ch.cost} CP</span>` : ''}</div><button class="btn" type="button" data-act="choose" data-id="${ev.id}" data-i="${i}" ${dis}>Choose</button></div>`; }).join('')}
    ${ev.err ? `<div class="small" style="color:var(--crit)">${esc(ev.err)}</div>` : ''}</article>`;
}

