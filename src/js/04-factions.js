/* ---------- player faction: any faction can be yours or the opponent ---------- */
function playerFaction(){ return S.armory.factions.find(f => f.id === S.setup.player) || S.armory.factions.find(f => f.side === 'player') || { id:'', name:'Your force', slots:{} }; }
function isMachineFaction(facId, armory){ const a = armory || S.armory; const ts = a.templates.filter(t => t.faction === facId); return ts.length > 0 && ts.filter(t => /droid|synthetic|robot/i.test((t.rules || []).join(' '))).length >= ts.length / 2; }
function prescaled(f){ return !!f && /(Independent Action|\bIA\b)\s+OFF/i.test(f.notes || ''); }
/* neutral content pack for any faction that is not the 78th */
function genericContent(fac, machine){
  const V = (id, name, rank, post, kind, voice, lines) => ({ id, name, rank, post, kind, voice, lines, figName:'' });
  const fname = fac ? fac.name : 'Command';
  const ops = machine
    ? V('v-ops','Tactical Command Node','','Operations, ' + fname,'command','Machine command net. Terse, statistical, indifferent to losses it can replace.', {
        opener:['{leader}. Unit {unit} is assigned. Acknowledge.','Directive issued to {unit}. Priority: high.'],
        attack:['Hostile presence confirmed at {region}: {enemy}, operating from the {poi}. Objective: {theme}.','{region}. Probability of success is acceptable. {theme}.'],
        defend:['{enemy} are advancing on {region}. Occupy the {poi} before contact. {theme}.','Defensive posture at {region}. {theme}. Hold until relieved.'],
        assets:['Support allocated: {support}.'], noassets:['No additional assets allocated.'],
        close:['Proceed.','Report on completion.','End of directive.'],
        victory:['{region} secured. Objective complete.','Outcome at {region} within expected parameters.'], draw:['Outcome at {region} inconclusive. Re-evaluating.'],
        defeat:['Objective at {region} not achieved. Losses logged.','{enemy} retained {region}. Adjusting projections.'],
        casualty:['{fig} damaged. Repair queue updated.'], kia:['{fig} destroyed at {region}. Record closed.'],
        event:['Event logged.','Unexpected variable noted. Recalculating.'], award:['{fig}: performance commendation logged, {award}.'] })
    : V('v-ops','Operations Officer','','Operations, ' + fname,'command','Professional and direct. Briefs plainly, debriefs honestly, remembers names.', {
        opener:['{leader}. {unit} has a task.','{leader}, a word before you move out.'],
        attack:['{enemy} are at {region}, working out of the {poi}. Your task: {theme}.','We have a window at {region}. {theme}.'],
        defend:['{enemy} are moving on {region}. Be at the {poi} before they are. {theme}.','{region} has to hold. {theme}.'],
        assets:['You have {support} on call.'], noassets:['No extra assets this time. You have what you walk in with.'],
        close:['Bring everyone back.','Questions now, not on the radio. Dismissed.'],
        victory:['{region} is ours. Good work.','A clean result at {region}. Get some rest.'], draw:['Nobody won {region} today. We go again.'],
        defeat:['They were ready for us at {region}. We learn from it.','{region} cost us. Make sure it taught us something.'],
        casualty:['{fig} is with the medics. Expected back.'], kia:['{fig} died at {region}. I will write to the family.'],
        event:['Noted. We adapt.','Command will hear about this.'], award:['For conduct at {region}, the {award} goes to {fig}.'] });
  return { ordersHeader:(machine ? 'DIRECTIVE — ' : 'OPERATIONS ORDER — ') + fname, briefer:'v-ops', debriefer:'v-ops', presenter:'v-ops', casualtyVoice:'v-ops', eventVoice:'v-ops',
    awards:[
      { name:'Wound Badge', de:'', tier:'Badge', xp:0, tokens:0, by:'Automatic', when:'Wounded in action' },
      { name:'Combat Clasp', de:'', tier:'Badge', xp:0, tokens:0, by:'Automatic', when:'Engagements fought' },
      { name:'Mentioned in Dispatches', de:'', tier:'Commendation', xp:1, tokens:0, by:'Command', when:'Creditable conduct in action' },
      { name:'Lifesaving Medal', de:'', tier:'Commendation', xp:1, tokens:0, by:'Command', when:'Saving a comrade at risk to self' },
      { name:'Gallantry Cross', de:'', tier:'Gallantry', xp:1, tokens:1, by:'Command', when:'An act that decided a fight or saved the objective' },
      { name:'Distinguished Service Cross', de:'', tier:'Gallantry', xp:2, tokens:2, by:'Command', when:'Exceptional gallantry, or a second act by a holder' } ],
    tokenName:'Commendation',
    houseRules:['Per-figure suppression: markers track to individual figures.','Field stabilization: a figure stabilized on the table may reroll its post-battle Injury result; the second result stands.','Per-figure Reaction: the three D6 go to individual Ready figures whose Reaction equals or exceeds the die. Both sides.','Individual Morale: at the end of a round with friendly losses, each figure that can see a casualty or is within 12" of one rolls 1D6 + Training, 4+ to hold; on a fail it withdraws to its own edge.','Commendation: spend one to reroll a single die that figure rolls.'],
    voices:[ops] };
}
/* starter force for any faction, sized to the command scale */
const STARTER = { fireteam:{ squads:1, leader:0, support:0 }, squad:{ squads:1, leader:1, support:0 }, platoon:{ squads:3, leader:1, support:1 }, reinforced:{ squads:4, leader:1, support:2 } };
const FIRST = ['Ada','Bram','Cass','Dario','Elin','Faris','Greta','Hal','Ines','Jonas','Kira','Leon','Mara','Nils','Oona','Petr','Quinn','Rafe','Sana','Tomas','Una','Vic','Wren','Yara','Zane','Ilya','Mika','Noor','Odile','Rurik'];
const LAST = ['Achterberg','Brask','Calder','Doyle','Ekwueme','Falk','Grieve','Haldane','Imari','Janek','Kovac','Lindqvist','Morrow','Novak','Okafor','Pryce','Quill','Rask','Sorel','Tamm','Ueda','Varga','Wexler','Yusuf','Zell','Mbeki','Ortega','Halvorsen','Ivers','Castell'];
/* faction unit lists shared by the starter force and quick battles */
function factionLists(facId, allowVeh){
  const fac = S.armory.factions.find(f => f.id === facId) || { name:'Force', slots:{} };
  const ts = S.armory.templates.filter(t => t.faction === facId && (allowVeh !== false || t.troop !== 'vehicle'));
  const slotT = k => ts.find(t => t.id === (fac.slots || {})[k]);
  const byPts = arr => [...arr].sort((a, b) => tplPoints(a).v - tplPoints(b).v);
  const uniq = arr => arr.filter((t, i, a) => t && a.indexOf(t) === i);
  return { fac, ts, byPts,
    squads:uniq([slotT('infantry'), slotT('storm'), slotT('recon'), ...byPts(ts.filter(t => t.troop === 'squad'))]).filter(t => t.troop === 'squad'),
    leaders:uniq([slotT('majorChar'), ...ts.filter(t => t.troop === 'individual' && /\bleader\b/i.test((t.rules || []).join(' ')) && t.level !== 'epic'), ...ts.filter(t => t.troop === 'individual' && t.level !== 'epic')]),
    epics:ts.filter(t => t.troop === 'individual' && t.level === 'epic'),
    support:uniq([slotT('weaponsTeam'), ...ts.filter(t => t.troop === 'team'), slotT('armoredCar'), ...byPts(ts.filter(t => t.troop === 'vehicle'))]) };
}
/* turn a list of templates into named roster-style units */
function namedUnits(picks, facId, note){
  const machine = isMachineFaction(facId); const used = new Set(); const count = {};
  const code = t => (t.name.match(/\b([A-Z]{1,3}\d{0,3}(?:-\d+)?)\b/) || [null, t.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()])[1];
  const nameFor = (t, rank) => { let n, g = 0; do { n = machine ? `${code(t)}-${String(1000 + Math.floor(rand() * 9000))}` : `${rank ? rank + ' ' : ''}${pick(FIRST)} ${pick(LAST)}`; } while (used.has(n) && g++ < 50); used.add(n); return n; };
  return picks.map(t => { count[t.id] = (count[t.id] || 0) + 1;
    const nm = t.troop === 'individual' ? null : `${t.name}${picks.filter(x => x === t).length > 1 ? ' ' + count[t.id] : ''}`;
    const figs = Array.from({ length:t.size }, (_, i) => {
      const role = i === 0 && t.leader ? 'sergeant' : t.troop === 'team' ? 'crew' : t.troop === 'individual' ? 'leader' : 'trooper';
      const officer = t.level === 'minor' ? 'Lt.' : 'Capt.';
      const fn = t.troop === 'vehicle' || (t.troop === 'individual' && machine) ? `${t.name}${count[t.id] > 1 ? ' ' + count[t.id] : ''}` : nameFor(t, machine ? '' : role === 'sergeant' ? 'Sgt.' : t.troop === 'individual' ? officer : '');
      return newFig(fn, role); });
    return { id:uid('u'), tpl:t.id, name:nm || figs[0].name, formation:'fm-1', xp:0, skills:[], condition:{ state:'Okay', battles:0 }, tableReady:true, notes:note || '', figures:figs }; });
}
function starterRoster(facId, scale){
  const L = factionLists(facId); const plan = STARTER[scale || S.setup.scale] || STARTER.squad; const picks = [];
  const fill = L.squads.length ? L.squads : L.ts.filter(t => t.troop !== 'vehicle');
  const order = [0, 0, 1, 2]; /* line squads first, then storm and recon types */
  for (let i = 0; i < plan.squads && fill.length; i++) picks.push(fill[order[i] < fill.length ? order[i] : 0]);
  for (let i = 0; i < plan.leader && L.leaders.length; i++) picks.push(L.leaders[i % L.leaders.length]);
  for (let i = 0; i < plan.support && L.support.length; i++) picks.push(L.support[i % L.support.length]);
  return { formations:[{ id:'fm-1', name:L.fac.name }], history:[], units:namedUnits(picks, facId, 'Starter force.'), origin:'starter' };
}
/* make sure the chosen factions (and their templates and weapons) exist in an armory */
function carryFactions(target, source, ids){
  ids.filter(Boolean).forEach(id => {
    if (target.factions.some(f => f.id === id)) return; const f = source.factions.find(x => x.id === id); if (!f) return;
    target.factions.push(JSON.parse(JSON.stringify(f)));
    source.templates.filter(t => t.faction === id && !target.templates.some(x => x.id === t.id)).forEach(t => {
      target.templates.push(JSON.parse(JSON.stringify(t)));
      [...(t.weapons || []), ...(t.teamWeapons || []), ...(t.leaderWeapons || [])].forEach(wid => { if (!target.weapons.some(w => w.id === wid)){ const w = source.weapons.find(x => x.id === wid); if (w) target.weapons.push(JSON.parse(JSON.stringify(w))); } }); });
  });
  return target;
}

