/* ---------- sample library (example data) ---------- */
function sampleArmory(){
  const W = (id, name, base, range, shots, dmg, traits, pts, cat) => ({ id, name, base, range, shots, dmg, traits, pts, cat });
  const weapons = [
    W('w-lasgun','Lasgewehr M.38','Infantry laser + Blade',30,1,'0',['Snap Shot','Bayonet'],5,'Rifle'), W('w-laspistol','Laspistole','Hand laser',9,1,'0',['Pistol','Snap Shot'],2,'Sidearm'),
    W('w-plpistol','Plasmapistole','Blast pistol',8,1,'1',['Pistol'],2,'Sidearm'), W('w-keule','Grabenkeule','Blade + Suppression maul',0,0,'1',['Melee','Stun'],2,'Melee'),
    W('w-sword','Offizierssäbel','Glare sword',0,0,'1',['Melee','Elegant'],2,'Melee'), W('w-stubber','Laser-MG M.40','Light machine gun',30,3,'0',['Heavy','Team'],10,'Team'),
    W('w-frag','Splittergranate','Frag grenade',6,1,'0',['Area'],1,'Grenade'), W('w-smoke','Nebelgranate','Fog grenade',6,0,'—',['Area','Fog'],1,'Grenade'),
    W('w-flare','Leuchtgranate','Illumination round',24,0,'—',['Cancels darkness 12"'],1,'Grenade'), W('w-plrifle','Plasmagewehr','Plasma rifle',20,2,'1',['Focused','Piercing','Overheat','Team'],8,'Team'),
    W('w-hb-rifle','QBZ battle rifle','Military rifle',24,1,'0',[],3,'Rifle'),
    W('w-pkm','PKM','Light machine gun',30,3,'0',['Heavy','Team'],10,'Team'), W('w-gl','Granatwerfer','Grenade launcher',24,0,'by grenade',['Launcher','Heavy','Team'],10,'Team'),
    W('w-shotgun','Schrotflinte','Shotgun',12,1,'0',['Critical'],2,'Rifle'), W('w-precision','Marksman rifle','Precision rifle',36,1,'1',['Critical','Sniping'],6,'Rifle'),
    W('w-pistol','Service pistol','Service pistol',9,1,'0',['Pistol'],1,'Sidearm'), W('w-blade','Trench knife','Blade',0,0,'1',['Melee'],1,'Melee'),
    W('w-flamer','Flame projector','Flame projector',6,0,'1',['Stream','Burn','Team'],6,'Team'), W('w-sniper','Long rifle','Sniper rifle',40,1,'1 (x2)',['Heavy','Piercing','Sniping','Team'],10,'Team'),
    W('w-hb-shotgun','Combat shotgun','Shotgun',12,1,'0',['Critical'],2,'Rifle'), W('w-hb-frag','Frag grenade','Frag grenade',6,1,'0',['Area'],1,'Grenade'),
    W('w-hb-gl','Grenade launcher','Grenade launcher',24,0,'—',['Launcher','Heavy','Team'],10,'Team')
  ];
  const gear = [
    { id:'g1', name:'Scout armor', type:'Defense', activation:'Always', uses:'', effect:'+1 to Observation; enemies spotting this unit count 1" further.', pts:1 },
    { id:'g2', name:'Superior optics', type:'Equipment', activation:'Free', uses:'', effect:'+2 on Observation tests.', pts:2 },
    { id:'g3', name:'Support beacon', type:'Equipment', activation:'Free / Action to deploy', uses:'', effect:'+1 to support requests (+2 if tied to one support type).', pts:5 },
    { id:'g4', name:'Booster drugs', type:'Equipment', activation:'Free', uses:'1', effect:'Double movement this activation; attacks hit only on a natural 6.', pts:4 }
  ];
  const P = (sp, re, cs, t, kp, sv, tr, save) => ({ sp, re, cs, t, kp, sv, tr, save: save || '—' });
  const templates = [
    { id:'t-sturm', priceAs:'Human · Military', name:'Sturm grenadier squad', side:'player', faction:'f-78', troop:'squad', size:6, level:'', profile:P(4,2,1,3,1,0,1), leader:P(4,2,1,3,2,0,1), weapons:['w-lasgun','w-frag'], teamWeapons:['w-stubber'], leaderWeapons:['w-plpistol','w-keule'], rules:['Iron Discipline','Siege Veterans'], pointsMode:'auto', points:0 },
    { id:'t-hwt', priceAs:'Human · Military', name:'Weapons team (Lang\'s section)', side:'player', faction:'f-78', troop:'team', size:3, level:'', profile:P(4,2,1,3,1,0,1), leader:null, weapons:['w-laspistol'], teamWeapons:['w-stubber'], leaderWeapons:[], rules:['Crewed'], pointsMode:'auto', points:0 },
    { id:'t-lt', priceAs:'Human · Major', name:'Hauptmann', side:'player', faction:'f-78', troop:'individual', size:1, level:'major', profile:P(4,3,2,3,3,1,2), leader:null, weapons:['w-laspistol','w-sword'], teamWeapons:[], leaderWeapons:[], rules:['Leader'], pointsMode:'auto', points:0 },
    { id:'t-medic', priceAs:'Human · Sergeant/Minor', name:'Sanitäter (attached)', side:'player', faction:'f-78', troop:'individual', size:1, level:'minor', profile:P(4,2,0,3,1,2,1), leader:null, weapons:['w-laspistol'], teamWeapons:[], leaderWeapons:[], rules:['Medic','Non-combatant'], pointsMode:'auto', points:0 },
    { id:'t-hb-rifles', priceAs:'Human · Military', name:'Hongbin rifle squad', side:'enemy', faction:'f-hb', troop:'squad', size:5, level:'', profile:P(4,2,1,4,1,0,1,'6+'), leader:P(4,2,1,4,2,0,1,'6+'), weapons:['w-hb-rifle'], teamWeapons:[], leaderWeapons:['w-hb-rifle','w-pistol'], rules:['Military profile (errata from Feuertaufe M5)'], pointsMode:'auto', points:0 },
    { id:'t-hb-grenadiers', priceAs:'Human · Military', name:'Hongbin grenadier squad', side:'enemy', faction:'f-hb', troop:'squad', size:5, level:'', profile:P(4,2,1,4,1,0,1,'6+'), leader:P(4,2,1,4,2,0,1,'6+'), weapons:['w-hb-shotgun','w-hb-frag'], teamWeapons:['w-hb-gl'], leaderWeapons:['w-pistol'], rules:['Mercenary Grenadier'], pointsMode:'auto', points:0 },
    { id:'t-hb-pkm', priceAs:'Human · Military', name:'Hongbin PKM team', side:'enemy', faction:'f-hb', troop:'team', size:3, level:'', profile:P(4,2,1,4,1,0,1,'6+'), leader:null, weapons:['w-pistol'], teamWeapons:['w-pkm'], leaderWeapons:[], rules:['PKM Gunner'], pointsMode:'auto', points:0 },
    { id:'t-hb-recon', priceAs:'Human · Military', name:'Hongbin recon section', side:'enemy', faction:'f-hb', troop:'squad', size:4, level:'', profile:P(5,2,1,4,1,0,1,'6+'), leader:null, weapons:['w-hb-rifle'], teamWeapons:['w-precision'], leaderWeapons:[], rules:['Scout armor'], pointsMode:'auto', points:0 },
    { id:'t-hb-officer', priceAs:'Human · Major', name:'Hongbin field officer', side:'enemy', faction:'f-hb', troop:'individual', size:1, level:'major', profile:P(4,3,2,4,3,1,2,'6+'), leader:null, weapons:['w-pistol'], teamWeapons:[], leaderWeapons:[], rules:['Leader'], pointsMode:'auto', points:0 }
  ];
  const factions = [
    { id:'f-78', name:'78th Sturm Battalion', side:'player', personality:'Methodical', slots:{} },
    { id:'f-hb', name:'Hongbin Alloy', side:'enemy', personality:'Methodical', slots:{ infantry:'t-hb-rifles', recon:'t-hb-recon', storm:'t-hb-grenadiers', weaponsTeam:'t-hb-pkm', majorChar:'t-hb-officer', epicChar:'t-hb-officer', sniper:'t-hb-recon', transport:'', armoredCar:'', lightTank:'', tank:'', heavyTank:'' } },
    { id:'f-asl', name:'Ad Servitutem Liberandum', side:'enemy', personality:'Raider', slots:{} }
  ];
  const minis = [
    { id:'m1', maker:'Makers Cult / GW', line:'Valour Korps and Death Korps line infantry', owned:13, painted:8, proxy:'t-sturm' },
    { id:'m2', maker:'GW', line:'Heavy weapon team', owned:3, painted:0, proxy:'t-hwt' },
    { id:'m3', maker:'BPRE', line:'Hongbin Alloy riflemen', owned:16, painted:16, proxy:'t-hb-rifles' },
    { id:'m4', maker:'BPRE', line:'Hongbin PKM gunners', owned:3, painted:3, proxy:'t-hb-pkm' }
  ];
  const T = (id, name, tier, rules, w, h, count) => ({ id, name, tier, rules, w, h, count });
  const terrain = [
    T('tr1','Rock cluster','micro','Scatter',2,2,6), T('tr2','Supply crates','micro','Scatter',2,1.5,4), T('tr3','Short wall section','micro','Linear',3,0.5,4),
    T('tr4','Tree clump','small','Area',4,4,3), T('tr5','Shipping container','small','Solid',6,2.5,3), T('tr6','Wall run','small','Linear',6,0.75,3), T('tr7','Crater','small','Area',5,5,2), T('tr8','Chem pool','small','Impassable',5,4,1),
    T('tr9','Ruined hab block','medium','Building',8,6,2), T('tr10','Bunker','medium','Building',6,5,1), T('tr11','Woods patch','medium','Area',8,6,2), T('tr12','Rocky hill','medium','Hill',11,8,1),
    T('tr13','Manufactorum, 2 floors','large','Building',14,10,1)
  ];
  const support = [
    { id:'s1', name:'Battalion 81mm mortar section', option:'Fire Support', strike:'Medium', tn:7, cp:2, est:true },
    { id:'s2', name:'Smoke barrage', option:'Obscuration', strike:'', tn:6, cp:3, est:true }
  ];
  return { weapons, gear, templates, factions, minis, terrain, support };
}
function newFig(name, role, o){ return Object.assign({ id:uid('fig'), name, role, status:'active', kills:0, wounds:0, awards:[], notes:'', xp:0, adv:{}, loadout:null, tokens:0, recover:0 }, o || {}); }
function sampleRoster(){
  const fig = newFig; const A = (type, sd, note) => ({ type, sd, note:note || '' });
  const wb = sd => A('Wound Badge', sd), cc = () => A('Combat Clasp', '2426.04.09', 'Four engagements');
  return { formations:[ { id:'fm-1', name:'1st Company "Eisenklinge", 78th Sturm Battalion' } ], history:[], units:[
    { id:'u-stahl', tpl:'t-sturm', name:'Squad 2 "Stahlschild"', formation:'fm-1', xp:0, skills:[], condition:{ state:'Okay', battles:0 }, tableReady:true, notes:'Example data from Feuertaufe after Mission 4. Gefreiter Hartung is acting squad leader while Lask is in the aid station.',
      figures:[ fig('Uffz. Werner Lask','sergeant',{ xp:8, wounds:2, status:'wounded', recover:1, awards:[wb('2426.03.12'), cc()] }),
        fig('Gren. Anton Weiss','trooper',{ xp:4, wounds:1, awards:[wb('2426.03.12')] }),
        fig('Gren. Karl Brandt','trooper',{ xp:9, wounds:1, kills:2, awards:[wb('2426.03.26'), cc()] }),
        fig('Gren. Felix Roth','specialist',{ xp:7, wounds:1, kills:6, adv:{ cs:1 }, loadout:['w-gl','w-frag','w-smoke'], tokens:1, notes:'"Laternenmann". Hates the nickname.', awards:[wb('2426.03.26'), cc(), A('Valor Cross, 2nd Class','2426.04.09','Signal relay, Nachtwache')] }),
        fig('Gren. Dieter Vogel','trooper',{ xp:2, wounds:1, kills:2, adv:{ sp:1, t:1 }, loadout:['w-shotgun'], tokens:1, notes:'Younger brother of Stefan Vogel, Squad 3.', awards:[wb('2426.03.26'), cc(), A('Valor Cross, 2nd Class','2426.04.09','The cache building, Umschlagplatz')] }),
        fig('Gefr. Emil Hartung','specialist',{ xp:4, kills:2, loadout:['w-stubber'], acting:true, notes:'Transferred from Feldwebel Lang\'s Heavy Weapon Section Alpha.' }) ] },
    { id:'u-kerner', tpl:'t-medic', name:'Sanitäterin Ilse Kerner', formation:'fm-1', xp:0, skills:[], condition:{ state:'Okay', battles:0 }, tableReady:true, notes:'Company aid section, attached to Stahlschild. Non-combatant.',
      figures:[ fig('Sanitäterin Ilse Kerner','leader',{ xp:3 }) ] },
    { id:'u-eisen', tpl:'t-sturm', name:'Squad 3 "Eisenfaust"', formation:'fm-1', xp:0, skills:[], condition:{ state:'Okay', battles:0 }, tableReady:false, notes:'Holding the northern approaches of the eastern spur. Models in the paint queue.',
      figures:[ fig('Uffz. Klaus Hoffman','sergeant'), fig('Gren. Hans Muller','specialist',{ loadout:['w-stubber'] }), fig('Gren. Stefan Vogel','trooper',{ loadout:['w-precision'] }), fig('Gren. Lukas Becker','trooper',{ loadout:['w-shotgun','w-keule'] }), fig('Gren. Niklas Weber','trooper') ] } ] };
}

/* ---------- content pack: voices, awards, orders header (example: the 78th) ---------- */
function defaultContent(){
  const V = (id, name, rank, post, kind, voice, lines, figName) => ({ id, name, rank, post, kind, voice, lines, figName:figName || '' });
  return {
    ordersHeader:'BATTALION ORDERS — 78th Sturm Battalion, 1st Company', briefer:'v-rahn', debriefer:'v-rahn', presenter:'v-brenner', casualtyVoice:'v-steiner', eventVoice:'v-adler',
    awards:[
      { name:'Wound Badge', de:'Verwundetenabzeichen', tier:'Badge', xp:0, tokens:0, by:'Automatic', when:'Wounded in action' },
      { name:'Combat Clasp', de:'Gefechtsspange', tier:'Badge', xp:0, tokens:0, by:'Automatic', when:'Engagements fought' },
      { name:'Named in the Order of the Day', de:'', tier:'Commendation', xp:1, tokens:0, by:'Company', when:'Creditable conduct in action' },
      { name:'Merit Cross', de:'', tier:'Service', xp:1, tokens:0, by:'Battalion', when:'Medical, technical, intelligence or logistics service' },
      { name:'Lifesaving Medal', de:'', tier:'Commendation', xp:1, tokens:0, by:'Battalion', when:'Saving a comrade at risk to self' },
      { name:'Close Combat Badge', de:'', tier:'Badge', xp:0, tokens:0, by:'Battalion', when:'Close assault actions' },
      { name:'Valor Cross, 2nd Class', de:'Tapferkeitskreuz II. Klasse', tier:'Gallantry', xp:1, tokens:1, by:'Battalion', when:'An act that decided a fight or saved the objective' },
      { name:'Valor Cross, 1st Class', de:'Tapferkeitskreuz I. Klasse', tier:'Gallantry', xp:2, tokens:2, by:'Oberst Volker', when:'Exceptional gallantry, or a second act by a holder' },
      { name:'Eisenwald Honour Shield', de:'Eisenwald-Ehrenschild', tier:'Gallantry', xp:3, tokens:0, by:'Oberst Volker', when:'An act that redeems the battalion\'s debt. Permanent: once per battle, reroll one die' },
      { name:'Cuff Title', de:'Ärmelband', tier:'Unit', xp:0, tokens:0, by:'Battalion', when:'Whole squad, for a defining action' } ],
    tokenName:'Ehrenmarke',
    houseRules:['Per-figure suppression: markers track to individual figures.','Pinned replaces Broken: morale failure pins (Fanaticism).','Field stabilization: a figure stabilized on the table may reroll its post-battle Injury result; the second result stands.','Per-figure Reaction: the three D6 go to individual Ready figures whose Reaction equals or exceeds the die. Both sides.','Fog: a Nebelgranate cloud 9" across blocks LoS until the end of the round. No damage, no Suppression.','Individual Morale: at the end of a round with friendly losses, each figure that can see a casualty or is within 12" of one rolls 1D6 + Training, 4+ to hold; on a fail it withdraws to its own edge. Fanaticism auto-passes.','Ehrenmarke: spend one to reroll a single die that figure rolls.'],
    voices:[
      V('v-rahn','Elise Rahn','Hauptmann','Battalion Intelligence','command','Analytical and precise; outsider among the Eisenwald officers. Compassionate by 78th standards. Wants proof, not glory.', {
        opener:['{leader}. Your squad is returned to effective status and tasked immediately.','{leader}. Battalion has work for {unit}.','{leader}, sit down. This will not take long, and you will want to read it twice.'],
        attack:['Intelligence puts {enemy} at {region}, working out of the {poi}. Your task: {theme}. I want a face, a uniform or a body. Anything that proves who is behind them.','{region}. The {poi} is where they touch the ground. {theme}. Bring back whatever they leave behind; I will decide what matters.','We have a window at {region} and it will not stay open. {theme}.'],
        defend:['{enemy} are moving on {region}. You will be at the {poi} before they are. {theme}.','Something is coming toward {region} and I do not yet know how much of it. {theme}. Report contact early; I would rather you were wrong than late.','{region} matters to Battalion this week. {theme}.'],
        assets:['Assets assigned: {support}. Use them or lose them.','You have {support} on call. Do not save it for a better moment; there will not be one.'],
        noassets:['No additional assets. You have what you walked in with.'],
        close:['Intelligence saves more lives than bravery ever will. Bring me something I can use.','Go and find out who is arming them.','Questions go through Hauptmann Adler. Dismissed.'],
        victory:['{region} is taken, and the {poi} with it. Good. Now tell me everything you saw, in order.','A clean result at {region}. Battalion will take the credit; I know whose it is.','We have the ground and what they left on it. That is the half of the job you can see.'],
        draw:['Neither side got what it came for at {region}. They will learn from that faster than we will, unless we work at it.','Inconclusive. I have written worse reports. Not many.'],
        defeat:['We learned something at {region}. I would rather we had not paid for it.','They were ready for you. That means someone told them. Leave that problem with me.'],
        casualty:['{fig} is with the aid station. Kerner says {fig} will be back.','Make sure {fig} knows the squad held. It matters more than anyone will admit.'],
        kia:['{fig} died at {region}. Steiner will write the letter. You will add a line to it.'],
        event:['Noted. I did not expect that, and I dislike not expecting things.','Battalion will hear of this one way or another. Better from us.'] }),
      V('v-adler','Werner Adler','Hauptmann','1st Company commander','command','Rose from the ranks; urban specialist, patient, prefers ambushes to frontal assaults. His soldiers trust him completely.', {
        opener:['{leader}. Walk the ground with me first.'], attack:['The enemy gets one chance to make a mistake at {region}. We don\'t. {theme}.'], defend:['We hold {region} the way we held the intersection on Hive Tertius: patiently. {theme}.'],
        close:['Bring them all back. That is also an order.'], victory:['Good work at {region}. Patient work. That is how this gets won.'], defeat:['We go back to {region}. Not today.'], draw:['Nobody lost {region}. Nobody won it either. Rest, then we look again.'],
        casualty:['{fig} did the job. Now {fig} gets to rest.'], event:['Company will carry it. That is what companies are for.','I will speak to Battalion. Keep your people sharp in the meantime.'] }),
      V('v-brenner','Kristoff Brenner','Major','Battalion executive officer','command','Formal, exact; presents decorations on parade. Believes the forms exist so the men are remembered.', {
        award:['For conduct at {region}, the {award} is awarded to {fig}. The battalion is in your debt.','{fig}. The {award}. Wear it where the others can see it.','The citation is read and approved. {fig}, the {award}.'] }),
      V('v-volker','Henrik Volker','Oberst','Battalion commander','command','Grim and calculating; treats soldiers as ammunition to be spent wisely. Every life must purchase something.', {
        victory:['Acceptable.','{region} is worth what it cost. See that the next one is too.'], defeat:['The 78th does not get to lose cheaply. Remember that.'], event:['Every life spent must purchase something. Make sure this one did.'] }),
      V('v-steiner','Otto Steiner','Feldwebel','Command Sergeant Major','command','Gruff and paternal; outlived three commanders. Writes to every family personally.', {
        casualty:['I\'ve seen {fig}. Asking about the squad, which is the right question.','Officers talk about honour. I talk about getting you home alive. {fig} is going home alive.'],
        kia:['I\'ll write to {fig}\'s family tonight. Bring me something true to tell them.'], wound:['Second time for {fig}. The medic wants {fig} off the line, and so do I.'] }),
      V('v-lask','Werner Lask','Unteroffizier','Squad 2 leader','squad','Promoted after his squad leader died; privately afraid his inexperience will get someone killed. Careful, quietly brave.', {
        victory:['Everyone up? Count off. ... Good.','Nobody does that again without telling me first.'], defeat:['That was on me. We do it differently next time.'], casualty:['I should have had someone on that corner.'], kia:['Get the tags. Then the kit. Then we go.'], banter:['Rest while you can. Rahn will have something for us by morning.'] }, 'Uffz. Werner Lask'),
      V('v-roth','Felix Roth','Grenadier','Squad 2, Granatwerfer','squad','The squad\'s gun. Every fight ends with one of his grenades. Hates being called "Laternenmann".', {
        victory:['Count the grenades before you count the kills.','Don\'t call me that.'], banter:['If anyone says "Laternenmann" I\'m loading smoke.'], casualty:['Get him behind something. I\'ll keep their heads down.'] }, 'Gren. Felix Roth'),
      V('v-vogel','Dieter Vogel','Grenadier','Squad 2','squad','Younger brother of Stefan in Eisenfaust; stepping out of his shadow. Writes home in four lines and leaves out the hard parts.', {
        victory:['Stefan will hear about this before I\'ve written to him.'], banter:['I\'ll write to my brother. Four lines. He doesn\'t need more.'], kia:['{fig} was on the line. Every time.'] }, 'Gren. Dieter Vogel'),
      V('v-brandt','Karl Brandt','Grenadier','Squad 2','squad','The unsung one. Present every time; the man the sergeant sleeps easier knowing is on the line.', {
        victory:['I was on the line. That\'s the job.'], banter:['Someone has to watch the flank while Roth makes noise.'] }, 'Gren. Karl Brandt'),
      V('v-hartung','Emil Hartung','Gefreiter','Squad 2, Laser-MG','squad','Older than most; was on Eisenwald and does not talk about it.', {
        victory:['The M.40 ran hot. Vossberg won\'t be pleased.'], banter:['I\'ve seen worse. I don\'t talk about where.'] }, 'Gefr. Emil Hartung'),
      V('v-kerner','Ilse Kerner','Sanitäterin','Company aid section, attached','squad','Practical and unflappable. Non-combatant.', {
        casualty:['{fig} will keep. Hold still, I\'m working.'], banter:['Nobody bleeds before breakfast. That\'s my rule.'] }, 'Sanitäterin Ilse Kerner')
    ] };
}

