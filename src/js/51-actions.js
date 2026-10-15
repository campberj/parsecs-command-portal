/* ----- actions ----- */
function stepAct(key, args, okMsg){ const r = runStep(key, args); stepResult(r, okMsg); render(); return r; }
const ACT = {
  tab: d => { S.ui.tab = d.k; render(); window.scrollTo(0, 0); },
  sel: d => { S.ui.sel = parseInt(d.id, 10); S.ui.tab = 'map'; render(); },
  advance: () => { const was = S.turn; const r = runTurn(); if (r === 'pending') toast('Dice needed: enter them in the card at the top.'); else if (r === 'done'){ const pend = S.inbox.filter(e => !e.resolved).length; toast(`Turn ${was} resolved.${pend ? ` ${pend} decision${pend > 1 ? 's' : ''} waiting.` : ''}`); if (pend) S.ui.tab = 'events'; autoBackup(`Turn ${was} ended`); } render(); },
  commit: d => { S.commitment = d.zone; log('commit', `Your force commits to ${regionOf(S.zones.find(z => z.id === d.zone)).name}.`); toast('Force committed.'); render(); },
  raid: d => stepAct('raid', [d.zone], 'Raid resolved.'),
  genhere: d => { const r = runStep('mission', [{ zoneId:d.zone, tier:'auto', layout:S.ui.layout }]); if (r.pending) S.ui.tab = 'missions'; stepResult(r); render(); window.scrollTo(0, 0); },
  openm: d => { S.ui.mission = d.id; S.ui.tab = 'missions'; render(); },
  reveal: d => stepAct('reveal', [d.id]),
  lmode: d => { const m = S.missions.find(x => x.id === d.id); m.layoutMode = d.k; S.ui.layout = d.k; render(); },
  relayout: d => { const m = S.missions.find(x => x.id === d.id); m.layout = buildLayout(m); render(); },
  qreroll: d => { qbReroll(d.k); save(); render(); }, qclear: () => { S.quick = null; save(); render(); }, qlmode: d => { if (S.quick){ S.quick.layoutMode = d.k; save(); render(); } }, qprint: () => { if (S.quick) printQuick(); },
  atab: d => { S.ui.armoryTab = d.k; render(); },
  atabgo: d => { S.ui.tab = 'armory'; S.ui.armoryTab = d.k; S.ui.builder = blankTemplate('player'); render(); },
  newtpl: d => { S.ui.builder = blankTemplate(d.side); S.ui.armoryTab = 'builder'; render(); },
  edittpl: d => { S.ui.builder = JSON.parse(JSON.stringify(S.armory.templates.find(t => t.id === d.id))); S.ui.armoryTab = 'builder'; render(); window.scrollTo(0, 0); },
  duptpl: d => { const t = JSON.parse(JSON.stringify(S.armory.templates.find(x => x.id === d.id))); t.id = uid('t'); t.name += ' (copy)'; S.armory.templates.push(t); toast('Duplicated.'); render(); },
  deltpl: d => { const inUse = S.roster.units.some(u => u.tpl === d.id); const slotted = S.armory.factions.some(f => Object.values(f.slots || {}).includes(d.id));
    if (inUse){ toast('A roster unit uses this template. Remove or reassign the unit first.'); return; }
    if (slotted) S.armory.factions.forEach(f => Object.keys(f.slots || {}).forEach(k => { if (f.slots[k] === d.id) f.slots[k] = ''; }));
    S.armory.templates = S.armory.templates.filter(t => t.id !== d.id); toast(slotted ? 'Deleted; its enemy slots now fall back to generic profiles.' : 'Deleted.'); render(); },
  savetpl: () => saveTemplate(false), savetplnew: () => saveTemplate(true),
  cleartpl: () => { S.ui.builder = blankTemplate(); render(); },
  editw: d => { S.ui.weaponEdit = d.id || null; render(); },
  delw: d => { const used = S.armory.templates.some(t => [...(t.weapons || []), ...(t.teamWeapons || []), ...(t.leaderWeapons || [])].includes(d.id)); if (used){ toast('A unit template carries this weapon. Remove it from the template first.'); return; } S.armory.weapons = S.armory.weapons.filter(w => w.id !== d.id); render(); },
  editg: d => { S.ui.gearEdit = d.id || null; render(); },
  delg: d => { S.armory.gear = S.armory.gear.filter(g => g.id !== d.id); render(); },
  delfac: d => { if (d.id === S.setup.player){ toast('This is your faction in this campaign. Start a campaign with another faction first.'); return; } if (d.id === S.setup.opponent){ toast('This faction is the current opponent. Start a campaign against another faction first.'); return; } if (S.armory.templates.some(t => t.faction === d.id)){ toast('Templates belong to this faction. Move or delete them first.'); return; } S.armory.factions = S.armory.factions.filter(f => f.id !== d.id); render(); },
  banks: d => { const s = S.armory.support.find(x => x.id === d.id); if (S.cp < s.cp){ toast(`Needs ${s.cp} CP; you have ${S.cp}.`); return; } S.cp -= s.cp; S.banked.push({ name:`${s.name} (${s.option})`, tn:s.tn }); log('support', `Banked ${s.name} at ${s.tn}+ for ${s.cp} CP.`); toast('Banked for your next mission.'); render(); },
  dels: d => { S.armory.support = S.armory.support.filter(s => s.id !== d.id); render(); },
  delm: d => { S.armory.minis = S.armory.minis.filter(m => m.id !== d.id); render(); },
  delt: d => { S.armory.terrain = S.armory.terrain.filter(t => t.id !== d.id); render(); },
  rollstory: () => stepAct('rollstory', []),
  rollevent: () => { queueInteractive(); render(); },
  applystory: d => stepAct('story', [d.id], 'Story event applied.'),
  paction: d => { const txt = document.getElementById('pa-' + d.id).value.trim() || 'Unnamed action'; stepAct('paction', [d.id, txt]); },
  choose: d => { const r = runStep('event', [d.id, parseInt(d.i, 10)]); const ev = S.inbox.find(e => e.id === d.id); if (r.ok && r.result && r.result.err){ ev.err = r.result.err; } else if (r.ok) toast(ev.title + ': ' + r.result.out); stepResult(r); render(); },
  diceauto: () => { const p = S.pendingDice; const vals = p.requests.map(r => 1 + Math.floor(Math.random() * r.sides)); submitDice(vals); render(); },
  dicecancel: () => { S.pendingDice = null; toast('Step cancelled; nothing changed.'); render(); },
  armexport: () => { document.getElementById('armio').value = JSON.stringify(bundleFor('armory'), null, 1); },
  armimport: () => { try { MODAL = { kind:'import', items:planImport(JSON.parse(document.getElementById('armio').value)) }; renderModal(); } catch (e) { toast('Import failed: ' + e.message); } },
  /* campaigns and backups */
  campopen: d => switchCampaign(d.id),
  campdup: async d => { const o = d.id === S.id ? JSON.parse(JSON.stringify(S)) : await loadCampaign(d.id); if (!o) return; save(); o.id = uid('c'); o.setup.name += ' (copy)'; o.savedAt = null; S = o; save(); toast('Duplicated and opened.'); render(); },
  campexp: async d => { const o = d.id === S.id ? S : await loadCampaign(d.id); if (o) downloadText(`campaign-${(o.setup.name || 'campaign').replace(/[^\w-]+/g, '-').toLowerCase()}-T${o.turn}.json`, JSON.stringify(o, null, 1)); },
  campdel: async d => { const c = META.campaigns.find(x => x.id === d.id); if (!c || !confirm(`Delete "${c.name}" from this computer? Backups already written are not touched.`)) return; await deleteCampaign(d.id); toast('Campaign deleted.'); },
  linkfolder: () => linkFolder(), reconnect: () => reconnectFolder(),
  backupnow: async () => { if (await backupNow('Manual', true)) toast('Backed up to your folder.'); render(); },
  dlbackup: () => downloadBackup(),
  /* forces */
  figopen: d => { S.ui.figOpen = S.ui.figOpen === d.f ? null : d.f; render(); }, figclose: () => { S.ui.figOpen = null; render(); },
  figreset: d => { const f = S.roster.units.find(u => u.id === d.u).figures.find(x => x.id === d.f); f.loadout = null; toast('Back to the template loadout.'); render(); },
  awdel: d => { const u = S.roster.units.find(x => x.id === d.u); const f = u.figures.find(x => x.id === d.f); const a = f.awards.splice(parseInt(d.i, 10), 1)[0]; if (a) log('award', `${a.type} removed from ${f.name}'s record.`); render(); },
  custom: d => { const u = S.roster.units.find(x => x.id === d.u); const v = customizeUnit(u); if (!v) return; S.ui.builder = JSON.parse(JSON.stringify(v)); S.ui.tab = 'armory'; S.ui.armoryTab = 'builder'; toast(`${u.name} has its own template now. Edits here change only this unit.`); render(); window.scrollTo(0, 0); },
  unitexp: d => { const u = S.roster.units.find(x => x.id === d.u); downloadText(`unit-${u.name.replace(/[^\w-]+/g, '-').toLowerCase()}.json`, JSON.stringify(bundleFor('units', [u.id]), null, 1)); },
  rosterexp: () => downloadText(`roster-${S.setup.name.replace(/[^\w-]+/g, '-').toLowerCase()}.json`, JSON.stringify(bundleFor('units'), null, 1)),
  importopen: () => { MODAL = { kind:'importtext' }; renderModal(); },
  importparse: () => { try { MODAL = { kind:'import', items:planImport(JSON.parse(document.getElementById('imp-text').value)) }; renderModal(); } catch (e) { toast('Import failed: ' + e.message); } },
  modalclose: () => { MODAL = null; renderModal(); },
  libview: d => { MODAL = { kind:'unit', id:d.id }; renderModal(); },
  libedit: d => { MODAL = null; renderModal(); S.ui.builder = JSON.parse(JSON.stringify(S.armory.templates.find(t => t.id === d.id))); S.ui.tab = 'armory'; S.ui.armoryTab = 'builder'; render(); window.scrollTo(0, 0); },
  libadd: d => { const l = activeList() || newList('New list', 0); S.ui.listId = l.id; const e = listAdd(l, d.id, 1); if (e) toast(`${e.tpl.name} added to ${l.name} (${listTotals(l).pts} pts).`); if (MODAL && MODAL.kind === 'unit'){ MODAL = null; renderModal(); } render(); },
  listnew: () => { const nm = prompt('Name for the new list:', 'New list'); if (nm === null) return; const lim = prompt('Points limit (0 for none):', '400'); newList(nm.trim() || 'New list', lim); render(); },
  listinc: d => { const l = activeList(); const e = l && l.entries.find(x => x.id === d.id); if (e){ e.count++; l.updated = new Date().toISOString(); saveLists(); render(); } },
  listdec: d => { const l = activeList(); const e = l && l.entries.find(x => x.id === d.id); if (e){ e.count--; if (e.count <= 0) l.entries = l.entries.filter(x => x !== e); saveLists(); render(); } },
  listrm: d => { const l = activeList(); if (l){ l.entries = l.entries.filter(x => x.id !== d.id); saveLists(); render(); } },
  listdel: () => { const l = activeList(); if (!l || !confirm(`Delete the list "${l.name}"?`)) return; LISTS = LISTS.filter(x => x !== l); S.ui.listId = LISTS[0] ? LISTS[0].id : null; saveLists(); render(); },
  listdup: () => { const l = activeList(); if (!l) return; const c = JSON.parse(JSON.stringify(l)); c.id = uid('list'); c.name = l.name + ' (copy)'; c.entries.forEach(e => e.id = uid('le')); LISTS.push(c); S.ui.listId = c.id; saveLists(); render(); },
  listexp: () => { const l = activeList(); if (l) downloadText(`list-${l.name.replace(/[^\w-]+/g, '-').toLowerCase()}.json`, JSON.stringify(listExport(l), null, 1)); },
  listprint: () => { const l = activeList(); if (!l) return; const added = ensureListInArmory(l); const size = S.ui.qsize || '35'; const units = unitsFromList(l); CARD_LABEL = `${l.name} · ${listTotals(l).pts} pts`;
    let cards = []; try { cards = units.flatMap(u => unitCardsPrint(u, size === '46' ? 'c46' : '')); } finally { CARD_LABEL = null; }
    if (added){ save(); toast(`${added} template${added > 1 ? 's' : ''} copied into this campaign's armory for printing.`); } printCards(cards, size); },
  listquick: d => { const l = activeList(); if (!l) return; S.ui.qform = Object.assign({ tier:'1', points:'', player:'', opponent:'', strength:'even', region:'', layout:'full', big:true, seed:'' }, S.ui.qform || {}); if (d.k === 'player') S.ui.qform.playerList = l.id; else S.ui.qform.oppList = l.id; S.ui.tab = 'quick'; render(); window.scrollTo(0, 0); },
  unitdel: d => { S.roster.units = S.roster.units.filter(u => u.id !== d.u); render(); },
  packopen: () => { S.ui.pack = S.ui.pack || packDefaults(); render(); }, packclose: () => { S.ui.pack = null; render(); }, packprint: () => printPack(),
  /* missions */
  wizstart: d => { wizStart(S.missions.find(m => m.id === d.id)); render(); },
  wizcancel: () => { if (confirm('Discard this after-action report?')){ S.ui.wiz = null; render(); } },
  packet: d => copyText(scenePacket(S.missions.find(m => m.id === d.id)), 'Scene packet copied. Paste it into your campaign chat.'),
  copyorders: d => copyText(S.missions.find(m => m.id === d.id).briefing.text, 'Orders copied.'),
  copyscene: d => copyText(sceneText((S.scenes || []).find(x => x.id === d.id)), 'Scene copied.'),
  /* story */
  voicenew: () => { const v = { id:uid('v'), name:'New voice', rank:'', post:'', kind:'squad', voice:'', lines:{}, figName:'' }; S.content.voices.push(v); S.ui.voiceOpen = v.id; render(); },
  voicedel: d => { if (!confirm('Delete this voice card?')) return; S.content.voices = S.content.voices.filter(v => v.id !== d.id); render(); },
  awrowadd: () => { S.content.awards.push({ name:'New award', de:'', tier:'Commendation', xp:0, tokens:0, by:'', when:'' }); render(); },
  awrowdel: d => { S.content.awards.splice(parseInt(d.i, 10), 1); render(); },
  /* rules */
  rtab: d => { RULE_DRAFT = null; S.ui.rulesTab = d.k; render(); },
  rrowdel: d => { const f = document.querySelector('form[data-form="rtable"]'); const id = f.dataset.id; const rows = ruleFormRows(id, new FormData(f)); rows.splice(parseInt(d.i, 10), 1); RULE_DRAFT = { id, rows }; render(); },
  rreset: () => { const id = S.ui.rulesTab; if (!confirm(`Put ${TABLE_DEFS[id].name} back to the shipped placeholder rows?`)) return; RULES.tables[id] = { status:'placeholder', rows:TABLE_DEFS[id].rows(), updated:new Date().toISOString() }; RULE_DRAFT = null; saveRules(); toast('Back to placeholder.'); render(); },
  rulesexp: () => downloadText(`rules-pack-${stamp()}.json`, JSON.stringify({ kind:'pcp-rules', ...RULES }, null, 1)),
  reset: () => { save(); sampleCampaign(); save(); toast('Example campaign opened in a new slot.'); render(); }
};
function copyText(text, msg){
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(msg), () => fallbackCopy(text, msg)); else fallbackCopy(text, msg);
}
function fallbackCopy(text, msg){ const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(msg); } catch (e) { toast('Copy failed; select the text by hand.'); } ta.remove(); }
function saveTemplate(asNew){
  const f = document.getElementById('builderform'); const b = draftFromForm(f); const errs = legality(b).filter(i => i.lvl === 'err');
  if (errs.length){ toast(errs[0].msg); return; }
  if (asNew || !b.id){ b.id = uid('t'); if (asNew) b.name += ' (copy)'; delete b.variantOf; S.armory.templates.push(b); }
  else {
    const users = tplUsers(b.id); const old = S.armory.templates.find(t => t.id === b.id);
    const solo = old && old.variantOf && users.length <= 1;
    if (users.length && !solo && JSON.stringify(old) !== JSON.stringify(b)){ MODAL = { kind:'propagate', draft:b }; renderModal(); return; }
    const i = S.armory.templates.findIndex(t => t.id === b.id); S.armory.templates[i] = b; }
  if (b.slotTarget){ const fac = factionOf(b.faction); if (fac){ fac.slots = fac.slots || {}; fac.slots[b.slotTarget] = b.id; } delete b.slotTarget; }
  S.ui.builder = JSON.parse(JSON.stringify(b)); log('armory', `Template saved: ${b.name}.`); toast('Template saved.'); render();
}
function defaultSetup(seed){ return { name:'Feuertaufe', theater:'Bargos', scale:'squad', length:'standard', world:'Industrial', player:'f-78', opponent:'f-hb', special:true, stardate:'2426.03', seed:seed || 'BARGOS-78' }; }
function onSubmit(e){
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); const fd = new FormData(f); const kind = f.dataset.form;
  const dir = e.submitter && e.submitter.value;
  if (kind === 'libfilter'){ S.ui.lib = { fac:fd.get('fac') || '', troop:fd.get('troop') || '', min:fd.get('min') || '', max:fd.get('max') || '', q:fd.get('q') || '', sort:fd.get('sort') || 'name' }; render(); return; }
  if (kind === 'wiz'){
    wizCollect(f, fd); const w = S.ui.wiz;
    if (dir === 'back'){ w.step = Math.max(0, w.step - 1); render(); return; }
    if (dir === 'apply'){ const mid = w.mid; const r = runStep('result', [mid, JSON.parse(JSON.stringify(w.data))]);
      if (r.ok){ S.ui.wiz = null; toast('After-action report applied.'); autoBackup('Mission result'); } else stepResult(r); render(); return; }
    w.step = Math.min(WIZ_STEPS.length - 1, w.step + 1); render(); return;
  }
  if (kind === 'loadout'){ const u = S.roster.units.find(x => x.id === f.dataset.u); const fg = u.figures.find(x => x.id === f.dataset.f); const ws = fd.getAll('w');
    const def = figLoadout(u, { ...fg, loadout:null }); fg.loadout = ws.length && JSON.stringify([...ws].sort()) !== JSON.stringify([...def].sort()) ? ws : null; log('roster', `${fg.name}'s loadout updated.`); toast('Loadout saved.'); render(); return; }
  if (kind === 'rtable'){
    const id = f.dataset.id; let rows = ruleFormRows(id, fd); const status = fd.get('status') || 'placeholder';
    if (dir === 'add'){ const blank = {}; TABLE_DEFS[id].cols.forEach(([k, , type]) => blank[k] = type === 'int' || type === 'num' ? '' : ''); rows.push(blank); RULE_DRAFT = { id, rows }; render(); return; }
    if (dir === 'paste'){ const txt = fd.get('paste') || ''; const pr = parsePasted(id, txt); if (!pr.length){ toast('Nothing to paste.'); return; } RULE_DRAFT = { id, rows:pr }; toast(`${pr.length} rows read. Check them, then save.`); render(); return; }
    const errs = validateTable(id, rows); if (errs.length){ RULE_DRAFT = { id, rows, errs }; toast('Not saved: fix the rows marked above.'); render(); return; }
    RULES.tables[id] = { status, rows, updated:new Date().toISOString() }; RULE_DRAFT = null; saveRules(); toast(`${TABLE_DEFS[id].name} saved${status === 'placeholder' ? ' (still marked placeholder)' : ''}.`); render(); return;
  }
  if (kind === 'voice'){ const v = voices().find(x => x.id === f.dataset.id); ['rank','name','post','kind','figName','voice'].forEach(k => v[k] = (fd.get(k) || '').trim());
    v.lines = {}; LINE_KEYS.forEach(([k]) => { const ls = (fd.get('l_' + k) || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean); if (ls.length) v.lines[k] = ls; }); S.ui.voiceOpen = v.id; toast('Voice saved.'); render(); return; }
  if (kind === 'awards'){ S.content.awards = S.content.awards.map((a, i) => ({ name:(fd.get(`a${i}_name`) || '').trim() || a.name, de:fd.get(`a${i}_de`) || '', tier:fd.get(`a${i}_tier`) || '', xp:parseInt(fd.get(`a${i}_xp`), 10) || 0, tokens:parseInt(fd.get(`a${i}_tokens`), 10) || 0, by:fd.get(`a${i}_by`) || '', when:fd.get(`a${i}_when`) || '' })); toast('Awards saved.'); render(); return; }
  if (kind === 'houserules'){ S.content.houseRules = (fd.get('hr') || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean); toast('House rules saved.'); render(); return; }
  if (kind === 'propagate'){ const draft = MODAL.draft; const lines = applyTemplateEdit(draft, fd.getAll('u'), !!fd.get('refit')); S.ui.builder = JSON.parse(JSON.stringify(draft)); MODAL = null; toast(lines.join(' ') || 'Template saved.'); render(); return; }
  if (kind === 'importapply'){ const picks = new Set(fd.getAll('i').map(Number)); MODAL.items.forEach((it, i) => it.pick = picks.has(i)); const n = applyImport(MODAL.items, !!fd.get('copies')); MODAL = null; toast(`Imported ${n} item${n === 1 ? '' : 's'}.`); render(); return; }
  if (kind === 'restore'){ const o = MODAL.obj; const ids = fd.getAll('c'); MODAL = null; restoreBackup(o, { ids, rules:!!fd.get('rules') }).then(n => toast(`Restored ${n} campaign${n === 1 ? '' : 's'}.`)); return; }
  if (kind === 'dice'){ const p = S.pendingDice; const vals = p.requests.map((r, i) => parseInt(fd.get('d' + i), 10));
    const bad = vals.findIndex((v, i) => !(v >= 1 && v <= p.requests[i].sides)); if (bad >= 0){ toast(`Die ${bad + 1} must be 1 to ${p.requests[bad].sides}.`); return; }
    const r = submitDice(vals); if (r && r.pending) toast('That result calls for more dice.'); render(); return; }
  if (kind === 'addunit'){
    const t = S.armory.templates.find(x => x.id === fd.get('tpl')); if (!t){ toast('Build a player template first.'); return; } const pay = fd.get('pay');
    const addCost = RP('rosterAdd'); if (pay && S.cp < addCost){ toast(`Roster Addition costs ${addCost} CP; you have ${S.cp}. Untick "Pay" to add it free.`); return; }
    if (pay) S.cp -= addCost; const name = fd.get('name') || t.name;
    const figs = Array.from({ length:t.size }, (_, i) => newFig(i === 0 && t.leader ? 'Sergeant' : t.troop === 'individual' ? name : 'Trooper ' + (i + 1), i === 0 && t.leader ? 'sergeant' : t.troop === 'team' ? 'crew' : t.troop === 'individual' ? 'leader' : 'trooper'));
    S.roster.units.push({ id:uid('u'), tpl:t.id, name, formation:S.roster.formations[0].id, xp:0, skills:[], condition:{ state:'Okay', battles:0 }, tableReady:true, notes:'', figures:figs });
    log('roster', `${name} joins the roster${pay ? ' (3 CP)' : ''}.`); toast(name + ' added.'); render();
  } else if (kind === 'addfig'){
    const u = S.roster.units.find(x => x.id === f.dataset.u); const nm = (fd.get('name') || '').trim(); if (!nm){ toast('Give the figure a name.'); return; }
    u.figures.push({ id:uid('fig'), name:nm, role:fd.get('role'), status:'active', kills:0, wounds:0, awards:[], notes:'', replacement:true }); log('roster', `${nm} joins ${u.name} as a replacement.`); render();
  } else if (kind === 'weapon'){
    const w = { name:fd.get('name'), base:fd.get('base') || fd.get('name'), range:parseFloat(fd.get('range')) || 0, shots:parseInt(fd.get('shots'), 10) || 0, dmg:fd.get('dmg') || '0', traits:(fd.get('traits') || '').split(',').map(s => s.trim()).filter(Boolean), pts:parseInt(fd.get('pts'), 10) || 0, cat:fd.get('cat') };
    if (S.ui.weaponEdit){ Object.assign(S.armory.weapons.find(x => x.id === S.ui.weaponEdit), w); S.ui.weaponEdit = null; toast('Weapon saved.'); } else { S.armory.weapons.push({ id:uid('w'), ...w }); toast('Weapon added.'); } render();
  } else if (kind === 'gear'){
    const g = { name:fd.get('name'), type:fd.get('type'), activation:fd.get('activation'), uses:fd.get('uses'), effect:fd.get('effect'), pts:parseInt(fd.get('pts'), 10) || 0 };
    if (S.ui.gearEdit){ Object.assign(S.armory.gear.find(x => x.id === S.ui.gearEdit), g); S.ui.gearEdit = null; } else S.armory.gear.push({ id:uid('g'), ...g }); toast('Gear saved.'); render();
  } else if (kind === 'faction'){ S.armory.factions.push({ id:uid('f'), name:fd.get('name'), side:fd.get('side'), personality:fd.get('personality'), slots:{} }); toast('Faction added.'); render(); }
  else if (kind === 'support'){ const s = generateSupport({ option:fd.get('option'), reliability:fd.get('reliability') }); if ((fd.get('name') || '').trim()) s.name = fd.get('name').trim(); S.armory.support.push(s); toast(`${s.name}: ${s.option} at ${s.tn}+.`); render(); }
  else if (kind === 'mini'){ S.armory.minis.push({ id:uid('m'), maker:fd.get('maker'), line:fd.get('line'), owned:parseInt(fd.get('owned'), 10) || 0, painted:parseInt(fd.get('painted'), 10) || 0, proxy:'' }); render(); }
  else if (kind === 'terrain'){ S.armory.terrain.push({ id:uid('tr'), name:fd.get('name'), tier:fd.get('tier'), rules:fd.get('rules'), w:parseFloat(fd.get('w')) || 1, h:parseFloat(fd.get('h')) || 1, count:parseInt(fd.get('count'), 10) || 1 }); render(); }
  else if (kind === 'gen'){
    const u = generateUnit({ side:fd.get('side'), faction:fd.get('faction'), role:fd.get('role'), quality:fd.get('quality'), budget:fd.get('budget') });
    u.id = null; if (fd.get('slot')) u.slotTarget = fd.get('slot'); S.ui.builder = u;
    const pv = tplPoints(u).v, bud = parseInt(fd.get('budget'), 10);
    toast(bud && Math.abs(pv - bud) / bud > 0.15 ? `Closest legal build is ${pv} pts; ${bud} is outside this role and quality's range. Review it and press Save.` : `Generated ${u.name}: ${pv} pts. Review it and press Save.`); render();
  } else if (kind === 'genmission'){
    const r = runStep('mission', [{ zoneId:fd.get('zone'), tier:fd.get('tier'), layout:fd.get('layout'), bigPiece:!!fd.get('bigPiece') }]); S.ui.layout = fd.get('layout'); stepResult(r); render();
  } else if (kind === 'result'){
    const form = { outcome:fd.get('outcome'), vp:fd.get('vp'), units:{} };
    for (const [k, v] of fd.entries()){ const p = k.split('|'); if (p.length < 2) continue; const uu = form.units[p[1]] = form.units[p[1]] || { figs:{} };
      if (p[0] === 'wipe') uu.wiped = true; else { const ff = uu.figs[p[2]] = uu.figs[p[2]] || {}; if (p[0] === 'k') ff.kills = v; if (p[0] === 'w') ff.wounded = true; if (p[0] === 'x') ff.kia = true; } }
    stepAct('result', [f.dataset.id, form], 'Result recorded.');
  } else if (kind === 'quick'){
    S.ui.qform = { tier:fd.get('tier'), points:fd.get('points') || '', player:fd.get('player') || '', opponent:fd.get('opponent') || '', playerList:fd.get('playerList') || '', oppList:fd.get('oppList') || '', strength:fd.get('strength'), region:fd.get('region') || '', layout:fd.get('layout'), big:!!fd.get('big'), seed:fd.get('seed') || '' };
    if (!S.ui.qform.playerList && !S.ui.qform.oppList && S.ui.qform.player && S.ui.qform.player === S.ui.qform.opponent){ toast('Pick a different faction for you and for the opponent.'); return; }
    try { S.quick = quickBattle({ ...S.ui.qform, bigPiece:S.ui.qform.big }); save(); toast(`Quick battle: ${S.quick.player.name} vs ${S.quick.opp.name}.`); } catch (err){ toast(err.message); }
    render();
  } else if (kind === 'newcampaign'){
    const seed = (fd.get('seed') || '').trim() || ('S' + Math.floor(Math.random() * 1e6));
    if (fd.get('player') === fd.get('opponent')){ toast('Pick a different faction for you and for the opponent.'); return; }
    save();
    const out = startCampaign({ name:fd.get('name') || 'Campaign', theater:fd.get('theater') || 'Unknown', scale:fd.get('scale'), length:fd.get('length'), world:fd.get('world'), player:fd.get('player'), opponent:fd.get('opponent'), special:!!fd.get('special'), stardate:fd.get('stardate') || '2426.03', seed }, !!fd.get('carry'));
    S.ui.tab = 'map'; stepResult(out.r, ['New campaign generated in its own slot.', ...out.notes].join(' ')); render(); autoBackup('New campaign');
  }
}
function onBuilderInput(e){
  const f = e.target.closest('#builderform'); if (!f) return;
  const b = draftFromForm(f); const prev = S.ui.builder || {};
  if (prev.slotTarget) b.slotTarget = prev.slotTarget;
  const structural = ['troop','hasLeader','pointsMode'].includes(e.target.name);
  S.ui.builder = b;
  if (structural) render(); else { const side = document.getElementById('builderside'); const html = builderSide(); if (side && side.dataset.last !== html){ side.innerHTML = html; side.dataset.last = html; } }
}
function onChange(e){
  if (e.target.closest('#builderform')){ if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onBuilderInput(e); return; }
  const el = e.target.closest('[data-chg]'); if (!el) return; const c = el.dataset.chg;
  const unit = () => S.roster.units.find(u => u.id === el.dataset.u);
  if (c === 'ready'){ unit().tableReady = el.checked; render(); }
  else if (c === 'notes'){ unit().notes = el.value; save(); }
  else if (c === 'award' && el.value){ const u = unit(); const f = u.figures.find(x => x.id === el.dataset.f); const a = giveAward(u, f, el.value, {}); toast(`Award recorded${a.xp ? `, +${a.xp} XP` : ''}${a.tokens ? `, +${a.tokens} ${S.content.tokenName || 'token'}` : ''}.`); render(); }
  else if (c.startsWith('fig') && el.dataset.f){ const u = unit(); const f = u.figures.find(x => x.id === el.dataset.f); const v = el.value;
    if (c === 'figname'){ const old = f.name; f.name = v.trim() || old; voices().forEach(x => { if (x.figName === old) x.figName = f.name; }); render(); }
    else if (c === 'figrole'){ f.role = v; render(); }
    else if (c === 'figacting'){ u.figures.forEach(x => x.acting = false); f.acting = el.checked; render(); }
    else if (c === 'figxp'){ f.xp = Math.max(0, parseInt(v, 10) || 0); render(); }
    else if (c === 'figtok'){ f.tokens = Math.max(0, parseInt(v, 10) || 0); render(); }
    else if (c === 'figkills'){ f.kills = Math.max(0, parseInt(v, 10) || 0); render(); }
    else if (c === 'figstatus'){ f.status = v; if (v !== 'wounded') f.recover = 0; if (v === 'kia') log('roster', `${f.name} marked KIA.`); render(); }
    else if (c === 'figadv' && v){ const err = buyAdvance(u, f, v); toast(err || 'Advance bought.'); render(); }
    else if (c === 'fignotes'){ f.notes = v; save(); } }
  else if (c === 'cvoice'){ S.content[el.dataset.k] = el.value; save(); }
  else if (c === 'cfield'){ S.content[el.dataset.k] = el.value; save(); }
  else if (c === 'modsel'){ S.mods[el.dataset.k] = el.value; render(); }
  else if (c === 'qsize'){ S.ui.qsize = el.value; }
  else if (c === 'libf'){ const fd = new FormData(document.getElementById('libfilter')); S.ui.lib = { fac:fd.get('fac') || '', troop:fd.get('troop') || '', min:fd.get('min') || '', max:fd.get('max') || '', q:fd.get('q') || '', sort:fd.get('sort') || 'name' }; render(); const q = document.getElementById(el.id); if (q && el.type === 'search'){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  else if (c === 'listpick'){ S.ui.listId = el.value; render(); }
  else if (c === 'listname'){ const l = activeList(); if (l){ l.name = el.value.trim() || 'Untitled list'; saveLists(); render(); } }
  else if (c === 'listlimit'){ const l = activeList(); if (l){ l.limit = Math.max(0, parseInt(el.value, 10) || 0); saveLists(); render(); } }
  else if (c === 'listimport'){ const file = el.files && el.files[0]; if (!file) return; file.text().then(txt => { try { const n = listImport(JSON.parse(txt)); toast(`Imported ${n} list${n > 1 ? 's' : ''}.`); } catch (err){ toast('Could not import: ' + err.message); } render(); }); }
  else if (c === 'paper'){ S.ui.paper = el.value; render(); }
  else if (c === 'packopt'){ const f = el.closest('form'); const fd = new FormData(f); S.ui.pack = { size:fd.get('size'), mission:fd.get('mission') || '', units:fd.getAll('u'), ref:!!fd.get('ref') }; render(); }
  else if ((c === 'rulesfile' || c === 'restorefile' || c === 'impufile') && el.files && el.files[0]){ const rd = new FileReader(); rd.onload = () => fileLoaded(c, rd.result); rd.readAsText(el.files[0]); el.value = ''; }
  else if (c === 'remove' && el.value){ const u = unit(); S.roster.history.push({ unit:u.name, reason:el.value, sd:stardate(S.turn), region:myZone() ? regionOf(myZone()).name : '' }); S.roster.units = S.roster.units.filter(x => x !== u); log('roster', `${u.name} removed: ${el.value}.`); render(); }
  else if (c === 'skill' && el.value){ const u = unit(); const parts = el.value.split('|'); const cp = S.mods.skillCurrency === 'cp';
    if (parts[0] === 'retrain'){ const [, kind, from, to] = parts; const n = RP('retrainCP'); if (S.cp < n){ toast(`Retraining costs ${n} CP; you have ${S.cp}.`); el.value = ''; return; }
      S.cp -= n; const sk = u.skills.find(x => x.name === from); sk.name = to; sk.kind = kind; log('roster', `${u.name} retrains ${from} into ${to} (${n} CP).`); render(); return; }
    const [kind, name, cost] = parts; const n = parseInt(cost, 10);
    if (cp){ if (S.cp < n){ toast(`${name} costs ${n} CP; you have ${S.cp}.`); el.value = ''; return; } S.cp -= n; }
    else { if (u.xp < n){ toast(`${name} needs ${n} XP; ${u.name} has ${u.xp}.`); el.value = ''; return; } u.xp -= n; }
    u.skills.push({ kind, name }); log('roster', `${u.name} gains veteran skill ${name} (${n} ${cp ? 'CP' : 'XP'}).`); render(); }
  else if (c === 'pers'){ factionOf(el.dataset.f).personality = el.value; render(); }
  else if (c === 'facname'){ factionOf(el.dataset.f).name = el.value; save(); renderTop(); }
  else if (c === 'facside'){ factionOf(el.dataset.f).side = el.value; render(); }
  else if (c === 'facnoveh'){ factionOf(el.dataset.f).noVehicles = el.checked; render(); }
  else if (c === 'slot'){ const f = factionOf(el.dataset.f); f.slots = f.slots || {}; f.slots[el.dataset.s] = el.value; save(); }
  else if (c === 'painted'){ const m = S.armory.minis.find(x => x.id === el.dataset.id); m.painted = clamp(parseInt(el.value, 10) || 0, 0, m.owned); render(); }
  else if (c === 'proxy'){ S.armory.minis.find(x => x.id === el.dataset.id).proxy = el.value; render(); }
  else if (c === 'tcount'){ S.armory.terrain.find(x => x.id === el.dataset.id).count = Math.max(0, parseInt(el.value, 10) || 0); save(); }
  else if (c === 'ttier'){ S.armory.terrain.find(x => x.id === el.dataset.id).tier = el.value; save(); }
  else if (c === 'trules'){ S.armory.terrain.find(x => x.id === el.dataset.id).rules = el.value; save(); }
  else if (c === 'mod'){ S.mods[el.dataset.k] = el.checked; render(); }
  else if (c === 'modnum'){ const v = parseFloat(el.value); if (!isNaN(v)) S.mods[el.dataset.k] = v; render(); }
  else if (c === 'tag'){ const t = el.dataset.k; S.mods.excludeTags = el.checked ? [...new Set([...S.mods.excludeTags, t])] : S.mods.excludeTags.filter(x => x !== t); save(); }
}
async function fileLoaded(kind, text){
  let o; try { o = JSON.parse(text); } catch (e) { toast('That file is not JSON.'); return; }
  if (kind === 'rulesfile'){ if (!o.tables){ toast('That is not a rules pack.'); return; } RULES = mergeRules(o); saveRules(); toast('Rules pack imported.'); render(); return; }
  if (kind === 'impufile'){ try { MODAL = { kind:'import', items:planImport(o) }; renderModal(); } catch (e) { toast('Import failed: ' + e.message); } return; }
  if (o.kind === 'pcp-backup'){ MODAL = { kind:'restore', obj:o }; renderModal(); return; }
  try { const c = migrate(o); save(); if (META.campaigns.some(x => x.id === c.id)){ if (!confirm(`"${c.setup.name}" is already on this computer. Replace it with the file? (Cancel keeps both: the file opens as a copy.)`)){ c.id = uid('c'); c.setup.name += ' (imported)'; } }
    c.savedAt = null; S = c; save(); toast('Campaign opened.'); render(); } catch (e) { toast('Not a campaign or backup: ' + e.message); }
}

