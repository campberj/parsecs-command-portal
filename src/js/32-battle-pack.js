/* ----- battle pack: index cards for the table ----- */
function packDefaults(){ const m = S.missions.find(x => x.status !== 'complete'); return { size:'35', mission:m ? m.id : '', units:m ? [...m.force] : deployable().map(u => u.id), ref:true }; }
function cardStatsRow(label, p){ const mm = moveMult(); return `<tr><td>${esc(label)}</td><td>${half(p.sp * mm)}"</td><td>${p.re}</td><td>${sgn(p.cs)}</td><td>${p.t}</td><td>${p.kp}</td><td>${sgn(p.sv)}</td><td>${sgn(p.tr)}</td><td>${esc(p.save)}</td></tr>`; }
const CARD_ST_HEAD = '<tr><th></th><th>Spd</th><th>Re</th><th>Cs</th><th>T</th><th>KP</th><th>Sv</th><th>Tr</th><th>Save</th></tr>';
function cardWeapons(ids){ const rm = rangeMult(); return `<table><tr><th>Weapon</th><th>Rng</th><th>Sh</th><th>Dm</th><th>Traits</th></tr>${ids.map(weaponOf).filter(Boolean).map(w => `<tr><td><b>${esc(w.name)}</b></td><td>${w.range >= UNLIMITED ? 'Unlim.' : w.range ? half(w.range * rm) + '"' : 'Melee'}</td><td>${w.shots || '—'}</td><td>${esc(w.dmg)}</td><td>${esc(w.traits.join(', ') || '—')}</td></tr>`).join('')}</table>`; }
const boxes = n => '<span class="bx"></span>'.repeat(Math.max(0, Math.min(n, 8)));
function cardFoot(n, of){ return `<div class="ft"><span>${CARD_LABEL ? esc(CARD_LABEL) : `${esc(S.setup.name)} · ${esc(S.setup.theater)} · SD ${stardate(S.turn)}`}</span><span>${S.mods.ia ? 'IA distances ×1.5 · ' : ''}${n}/${of}</span></div>`; }
function unitCardsPrint(u, cls){
  const t = tplOf(u); if (!t) return [];
  const pts = S.mods.points ? ` · ${tplPoints(t).v} pts` : '';
  const figs = u.figures.filter(f => f.status !== 'kia');
  const wids = [...new Set([...weaponIdsOf(t), ...figs.flatMap(f => f.loadout || [])])].filter(id => weaponOf(id));
  const rules = [...(t.rules || []), ...u.skills.map(s => s.name)];
  const per = cls === 'c46' ? 14 : 10; const figPer = cls === 'c46' ? 10 : 7;
  const statTbl = `<table class="st">${CARD_ST_HEAD}${cardStatsRow(t.leader ? 'Trooper' : 'Profile', t.profile)}${t.leader ? cardStatsRow('Leader', t.leader) : ''}</table>`;
  const figRow = f => { const p = figProfile(u, f);
    const ch = Object.entries(f.adv || {}).filter(([, v]) => v).map(([k, v]) => `${(ADV_STATS.find(a => a[0] === k) || [k, k])[1]} ${k === 'sp' ? half(p.sp * moveMult()) + '"' : sgn(v)}`).join(', ');
    return `<tr><td><b>${esc(f.name)}</b>${f.role === 'sergeant' ? ' (Sgt)' : ''}${f.acting ? ' (acting ldr)' : ''}${f.status === 'wounded' ? ' — wounded' : ''}</td><td>${esc(ch || '—')}</td><td>${esc(figLoadout(u, f).map(id => weaponOf(id) ? weaponOf(id).name : '').filter(Boolean).join(', '))}</td><td class="kp">${boxes(p.kp)}</td><td class="kp">${boxes(f.tokens || 0)}</td><td class="kp">${boxes(1)}</td></tr>`; };
  const figHead = `<tr><th>Figure</th><th>Changes</th><th>Kit</th><th>KP</th><th>${esc(S.content.tokenName || 'Tok')}</th><th>Out</th></tr>`;
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o.length ? o : [[]]; };
  const head = (sub) => `<h5>${esc(u.name)}<small>${esc(sub)}</small></h5>`;
  const bodies = [];
  if (t.troop === 'individual' && wids.length <= 4) bodies.push(`${head(t.name + pts)}${statTbl}${cardWeapons(wids)}${rules.length ? `<div><b>Rules:</b> ${esc(rules.join(', '))}</div>` : ''}<table>${figHead}${figs.map(figRow).join('')}</table>`);
  else {
    chunk(wids, per).forEach((ws, i) => bodies.push(`${head(i ? 'weapons, continued' : t.name + pts)}${i ? '' : statTbl}${cardWeapons(ws)}${!i && rules.length ? `<div><b>Rules:</b> ${esc(rules.join(', '))}</div>` : ''}${!i && u.condition.state !== 'Okay' ? `<div><b>${esc(u.condition.state)}</b></div>` : ''}`));
    chunk(figs, figPer).forEach((fs, i) => bodies.push(`${head(i ? 'figures, continued' : 'figures')}<table>${figHead}${fs.map(figRow).join('')}</table>`));
  }
  return bodies.map((b, i) => `<div class="icard ${cls}">${b}${cardFoot(i + 1, bodies.length)}</div>`);
}
function missionCardPrint(m, cls){
  const e = m.enemy; const enemy = e.mode === 'during' ? `Generated during battle, ${e.level}: up to ${e.cap} units.` : (e.list || []).map(x => x.label).join('; ');
  return `<div class="icard ${cls}"><h5>${esc(m.regionName)}<small>${esc(m.tierName)} · ${esc(m.scenario)} · ${m.table[0]}"×${m.table[1]}"</small></h5>
    <div><b>${esc(m.theme)}.</b></div>
    <table><tr><th>Objective</th><th>When</th></tr>${m.objectives.map(o => `<tr><td><b>${esc(o.name)}</b> — ${esc(o.text)}</td><td>${esc(o.when)}</td></tr>`).join('')}${m.secondary ? `<tr><td><b>Secondary:</b> ${esc(m.secondary)}</td><td></td></tr>` : ''}</table>
    <div><b>Enemy (${esc(e.faction)}):</b> ${esc(enemy)}</div>
    ${m.conditions.length ? `<div><b>Conditions:</b> ${m.conditions.map(c => esc(c[0]) + ' — ' + esc(c[1])).join(' · ')}</div>` : ''}
    ${m.support.length ? `<div><b>Support:</b> ${m.support.map(s => esc(s.name) + ' ' + s.tn + '+').join(', ')}</div>` : ''}
    ${cardFoot(1, 1)}</div>`;
}
function refCardPrint(cls, unitIds){
  const hr = (S.content.houseRules || []).filter(Boolean); const rules = [];
  const facs = [...new Set((unitIds || []).map(id => S.roster.units.find(u => u.id === id)).filter(Boolean).map(u => tplOf(u) && tplOf(u).faction))].map(factionOf).filter(f => f && (f.rules || []).length);
  facs.forEach(f => f.rules.forEach(r => rules.push(`${f.name} — ${r.name}: ${r.text}`)));
  if (S.mods.ia) rules.push('Independent Action: 1.5× movement and ranges; per-figure suppression and Reaction; Pinned replaces Broken; Piercing ignores saves; Anti-Tank +1 vs vehicles; Sniping +1 stationary; Stream is a line template ignoring cover.');
  ['strictOverwatch','individualActions','retreat','landSomewhere'].forEach(k => { if (S.mods[k]) rules.push({ strictOverwatch:'Strict Overwatch', individualActions:'Individual Actions', retreat:'Retreat', landSomewhere:'It Has to Land Somewhere' }[k]); });
  return `<div class="icard ${cls}"><h5>Rules in force<small>reference</small></h5><ol style="margin:0;padding-left:14px">${[...rules, ...hr].map(r => `<li>${esc(r)}</li>`).join('')}</ol>${cardFoot(1, 1)}</div>`;
}
function packCards(pk){
  const cls = pk.size === '46' ? 'c46' : ''; const out = [];
  const m = pk.mission && S.missions.find(x => x.id === pk.mission); if (m) out.push(missionCardPrint(m, cls));
  pk.units.map(id => S.roster.units.find(u => u.id === id)).filter(Boolean).forEach(u => out.push(...unitCardsPrint(u, cls)));
  if (pk.ref) out.push(refCardPrint(cls, pk.units));
  return out;
}
function packPanel(){
  const pk = S.ui.pack; const cards = packCards(pk); const planned = S.missions.filter(x => x.status !== 'complete');
  return `<div class="panel stack"><div class="panel-h"><h3>Battle pack</h3><span class="small muted">${cards.length} card${cards.length === 1 ? '' : 's'}; print one card per page on index card stock.</span><button class="btn sm" type="button" data-act="packclose">Close</button></div>
    <form class="stack" data-form="pack"><div class="form-grid">
      <label class="f"><span>Card size</span><select name="size" id="pk-size" data-chg="packopt"><option value="35" ${pk.size === '35' ? 'selected' : ''}>3" × 5"</option><option value="46" ${pk.size === '46' ? 'selected' : ''}>4" × 6"</option></select></label>
      <label class="f"><span>Mission card</span><select name="mission" id="pk-m" data-chg="packopt"><option value="">None</option>${planned.map(x => `<option value="${x.id}" ${pk.mission === x.id ? 'selected' : ''}>${esc(x.regionName)}: ${esc(x.theme)}</option>`).join('')}</select></label>
      <label class="f"><span>Paper</span>${paperSelect('pk-paper')}</label>
      <label class="chk" style="align-self:end"><input type="checkbox" name="ref" data-chg="packopt" ${pk.ref ? 'checked' : ''}> Rules reference card</label></div>
      <fieldset><legend>Units</legend><div class="wepgrid">${S.roster.units.map(u => `<label class="chk small"><input type="checkbox" name="u" value="${u.id}" data-chg="packopt" ${pk.units.includes(u.id) ? 'checked' : ''}> ${esc(u.name)}</label>`).join('')}</div></fieldset>
      <div class="row"><button class="btn primary" type="button" data-act="packprint">Print cards</button><span class="small muted">${(S.ui.paper || 'letter') === 'letter' ? `${pk.size === '46' ? 2 : 4} cards per Letter sheet in order, cut along the dashed lines. In the print dialog set margins None and scale 100%.` : 'In the print dialog choose the card size as the paper size, margins None, scale 100%.'} Save as PDF works too.</span></div></form>
    <div style="overflow-x:auto"><div class="cards-preview">${cards.join('')}</div></div></div>`;
}
/* print cards one per page (index card stock) or several per US Letter sheet with cut lines, in order */
const PAPER_OPTS = [['letter','US Letter, cut lines'],['cards','Index card stock (one per page)']];
function paperSelect(id){ const v = S.ui.paper || 'letter'; return `<select id="${id}" data-chg="paper" aria-label="Paper">${PAPER_OPTS.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`; }
function sheetHTML(cards, size, paper){
  if ((paper || 'letter') !== 'letter') return cards.join('');
  const per = size === '46' ? 2 : 4; const out = [];
  for (let i = 0; i < cards.length; i += per) out.push(`<div class="sheet ${size === '46' ? 'l46' : 'l35'}">${cards.slice(i, i + per).join('')}</div>`);
  return out.join('');
}
function printCards(cards, size){
  const paper = S.ui.paper || 'letter'; const root = document.getElementById('printroot'); root.innerHTML = sheetHTML(cards, size, paper);
  let st = document.getElementById('pagesize'); if (!st){ st = document.createElement('style'); st.id = 'pagesize'; document.head.appendChild(st); }
  st.textContent = `@page { size: ${paper === 'letter' ? (size === '46' ? '8.5in 11in' : '11in 8.5in') : (size === '46' ? '6in 4in' : '5in 3in')}; margin: 0; }`;
  window.print();
}
function printPack(){ const pk = S.ui.pack; printCards(packCards(pk), pk.size); }

