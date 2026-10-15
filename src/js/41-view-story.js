/* ----- journal and setup ----- */
function viewJournal(){ return `<div class="panel journal"><div class="panel-h"><h3>Campaign journal</h3><span class="muted small">${S.journal.length} entries, newest first</span></div><ul>${S.journal.map(j => `<li><span class="mono small muted">T${j.turn} · ${j.sd}<br>${j.type}${j.manual ? ' · your dice' : ''}</span><span>${esc(j.text)}</span></li>`).join('')}</ul></div>`; }
/* ----- story: scenes, voice cards, awards ----- */
const LINE_KEYS = [['opener','Briefing opener'],['attack','Briefing: we attack'],['defend','Briefing: we defend'],['assets','Briefing: assets'],['noassets','Briefing: no assets'],['close','Briefing close'],['victory','After a victory'],['draw','After a draw'],['defeat','After a defeat'],['casualty','About a casualty'],['kia','About a death'],['wound','Second wound'],['award','Presenting an award'],['event','Reacting to an event'],['banter','Squad talk']];
function viewStory(){
  const C = S.content; const vs = voices(); const vsel = (k, label) => `<label class="f"><span>${label}</span><select data-chg="cvoice" data-k="${k}" id="cv-${k}"><option value="">—</option>${vs.map(v => `<option value="${v.id}" ${C[k] === v.id ? 'selected' : ''}>${esc(vName(v))}</option>`).join('')}</select></label>`;
  const figNames = S.roster.units.flatMap(u => u.figures.filter(f => f.status !== 'kia').map(f => f.name));
  const scenes = (S.scenes || []).slice(0, 12);
  return `<div class="panel stack"><div class="panel-h"><h3>Scenes</h3><span class="small muted">Mode: <b>${{ off:'Off', briefings:'Briefings and debriefs', events:'Plus milestones and events', every:'Plus squad talk after every mission' }[sceneMode()]}</b> (change in Mods)</span></div>
      <div class="form-grid">${vsel('briefer','Briefs missions')}${vsel('debriefer','Debriefs missions')}${vsel('presenter','Presents awards')}${vsel('casualtyVoice','Speaks about casualties')}${vsel('eventVoice','Reacts to events')}
        <label class="f" style="grid-column:span 2"><span>Orders header</span><input type="text" value="${esc(C.ordersHeader)}" data-chg="cfield" data-k="ordersHeader" id="c-oh"></label>
        <label class="f"><span>Reroll token name</span><input type="text" value="${esc(C.tokenName || '')}" data-chg="cfield" data-k="tokenName" id="c-tok"></label></div></div>
    ${scenes.length ? scenes.map(sceneCard).join('') : '<div class="empty">No scenes yet. Generate a mission to get its orders; finish one for the debrief.</div>'}
    <div class="panel stack"><div class="panel-h"><h3>Voice cards</h3><span class="small muted">Lines may use {leader} {unit} {region} {enemy} {theme} {poi} {support} {fig} {award}. One line per row; the portal picks one at random.</span><button class="btn sm primary" type="button" data-act="voicenew">New voice</button></div>
      ${vs.map(v => `<details ${S.ui.voiceOpen === v.id ? 'open' : ''}><summary><b>${esc(vName(v))}</b> <span class="muted small">${esc(v.post)}${v.figName ? ' · plays ' + esc(v.figName) : ''}</span></summary>
        <form class="stack" data-form="voice" data-id="${v.id}" style="margin:10px 0 16px"><div class="form-grid">
          <label class="f"><span>Rank</span><input type="text" name="rank" value="${esc(v.rank)}"></label><label class="f"><span>Name</span><input type="text" name="name" value="${esc(v.name)}"></label>
          <label class="f"><span>Post</span><input type="text" name="post" value="${esc(v.post)}"></label>
          <label class="f"><span>Kind</span><select name="kind"><option value="command" ${v.kind === 'command' ? 'selected' : ''}>Command</option><option value="squad" ${v.kind === 'squad' ? 'selected' : ''}>Squad</option></select></label>
          <label class="f"><span>Plays roster figure</span><select name="figName"><option value="">—</option>${[...new Set([v.figName, ...figNames].filter(Boolean))].map(n => `<option ${v.figName === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label></div>
          <label class="f"><span>Voice notes (also sent to chat in scene packets)</span><textarea rows="2" name="voice">${esc(v.voice)}</textarea></label>
          <div class="cols-2">${LINE_KEYS.map(([k, l]) => `<label class="f"><span>${l}</span><textarea rows="2" name="l_${k}">${esc((v.lines[k] || []).join('\n'))}</textarea></label>`).join('')}</div>
          <div class="row"><button class="btn primary" type="submit">Save voice</button><button class="btn sm danger" type="button" data-act="voicedel" data-id="${v.id}">Delete voice</button></div></form></details>`).join('')}</div>
    <form class="panel stack" data-form="awards"><div class="panel-h"><h3>Awards</h3><span class="small muted">XP goes to the figure (per-figure XP) or the unit; tokens go to the figure.</span></div>
      <div class="tblwrap"><table class="tbl rgrid"><thead><tr><th>Award</th><th>Native name</th><th>Tier</th><th class="num">XP</th><th class="num">Tokens</th><th>Approved by</th><th>For</th><th></th></tr></thead><tbody>
      ${awardList().map((a, i) => `<tr><td><input type="text" name="a${i}_name" value="${esc(a.name)}" aria-label="Award name"></td><td><input type="text" name="a${i}_de" value="${esc(a.de || '')}" aria-label="Native name"></td><td><input type="text" name="a${i}_tier" value="${esc(a.tier || '')}" aria-label="Tier"></td>
        <td class="n"><input type="number" name="a${i}_xp" value="${a.xp || 0}" aria-label="XP"></td><td class="n"><input type="number" name="a${i}_tokens" value="${a.tokens || 0}" aria-label="Tokens"></td><td><input type="text" name="a${i}_by" value="${esc(a.by || '')}" aria-label="Approved by"></td><td><input type="text" name="a${i}_when" value="${esc(a.when || '')}" aria-label="Awarded for"></td>
        <td><button class="btn sm danger" type="button" data-act="awrowdel" data-i="${i}" aria-label="Delete ${esc(a.name)}">×</button></td></tr>`).join('')}</tbody></table></div>
      <div class="row"><button class="btn primary" type="submit">Save awards</button><button class="btn" type="button" data-act="awrowadd">Add award</button></div></form>
    <form class="panel stack" data-form="houserules"><h3>House rules</h3><p class="small muted" style="margin:0">One rule per line. They print on the battle pack's reference card.</p>
      <textarea rows="7" name="hr" id="c-hr">${esc((C.houseRules || []).join('\n'))}</textarea><div class="row"><button class="btn primary" type="submit">Save house rules</button></div></form>`;
}

