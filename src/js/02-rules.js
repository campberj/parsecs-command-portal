/* ---------- rules data (condensed, prototype) ---------- */
const WORLD_TYPES = ['Industrial','Colony','Major habitation','Desert','Jungle','Ice','Barren','Mountainous','Archipelagos'];
const WORLD_TERRAIN = {
  'Industrial':['refinery sprawl','slag fields','rail yards','factory district'], 'Colony':['farm belts','prefab town','orchard terraces','river flats'],
  'Major habitation':['arcology blocks','transit canyons','park ring','old town'], 'Desert':['dune sea','mesa country','salt flats','dry wadis'],
  'Jungle':['canopy forest','swamp delta','vine gorges','plantation clearings'], 'Ice':['glacier shelf','frozen lake','ice caves','tundra scrub'],
  'Barren':['ash plains','crater fields','shattered regolith','basalt ridges'], 'Mountainous':['high passes','pine valleys','cliff terraces','scree slopes'],
  'Archipelagos':['reef islands','causeway chain','mangrove coast','harbor shoals']
};
const REGION_TYPES = ['Urban','Critical','Defensible','Resource','Inhospitable','Open'];
const TYPE_GLYPH = { Urban:'U', Critical:'C', Defensible:'D', Resource:'R', Inhospitable:'I', Open:'' };
const TYPE_WEIGHTS = {
  'Industrial':{Urban:3,Critical:1,Defensible:1,Resource:3,Inhospitable:1,Open:2}, 'Colony':{Urban:1,Critical:1,Defensible:1,Resource:2,Inhospitable:1,Open:5},
  'Major habitation':{Urban:5,Critical:2,Defensible:1,Resource:1,Inhospitable:0,Open:2}, 'Desert':{Urban:1,Critical:1,Defensible:2,Resource:2,Inhospitable:4,Open:3},
  'Jungle':{Urban:1,Critical:1,Defensible:2,Resource:2,Inhospitable:3,Open:3}, 'Ice':{Urban:1,Critical:1,Defensible:2,Resource:2,Inhospitable:4,Open:2},
  'Barren':{Urban:0,Critical:1,Defensible:2,Resource:3,Inhospitable:4,Open:2}, 'Mountainous':{Urban:1,Critical:1,Defensible:4,Resource:2,Inhospitable:2,Open:2},
  'Archipelagos':{Urban:2,Critical:2,Defensible:2,Resource:1,Inhospitable:1,Open:3}
};
const NAME_ROOTS = ['Varn','Kessel','Orsk','Dalen','Marr','Tolvo','Hesk','Brann','Ilsa','Corvan','Petra','Sable','Ruhr','Achen','Volk','Tarr','Grise','Lodz','Nemer','Oster','Halvard','Kord','Seren','Mausk','Fenn','Ulric','Dorn','Rask'];
const NAME_SUFFIX = { Urban:['Hab','Town','Quarter','Sprawl'], Critical:['Starport','Uplink','Relay','Command'], Defensible:['Ridge','Bastion','Line','Heights'], Resource:['Depot','Mine','Refinery','Wells'], Inhospitable:['Flats','Wastes','Basin','Storm Belt'], Open:['Fields','Crossing','Valley','Plain'] };
const POI = {
  Urban:['tram interchange','hab block','market square','militia armory','water tower'], Critical:['landing control tower','uplink dish','power relay','command bunker','fuel farm'],
  Defensible:['bunker line','OP on the crest','river bridge','minefield belt','anti-tank ditch'], Resource:['fuel tanks','mine head','pump station','ore yard','vehicle park'],
  Inhospitable:['crashed lander','weather station','toxic pools','survey camp','wreck field'], Open:['crossroads','farmstead','hedgerow line','irrigation canal','grain silos']
};
const THEMES = {
  Urban:{ attack:['Clear a hab block held by enemy riflemen','Seize the transit interchange before the enemy reinforces it','Raid a district command post and pull its comms logs'], defend:['Hold the market square until the relief column arrives','Stop an enemy push through the tram tunnels','Evacuate wounded from a collapsing tenement under fire'] },
  Critical:{ attack:['Take the landing-control tower at the starport','Knock out the planetary uplink array','Capture the power relay that feeds the capital grid'], defend:['Hold the uplink array through the transmission window','Keep the landing pads open for incoming dropships','Retake the relay station after an enemy coup de main'] },
  Defensible:{ attack:['Breach the bunker line at its weakest bastion','Take the observation post on the ridge','Seize a bridgehead across the defended river'], defend:['Man the bunker line against a probing attack','Hold the ridge OP and call fire on the approach','Counterattack to restore a broken trench section'] },
  Resource:{ attack:['Seize the fuel depot intact','Raid the mine head and wreck the lift gear','Ambush an ore convoy on the haul road'], defend:['Protect the pump station from saboteurs','Escort the fuel convoy through the depot gate','Hold the munitions dump while engineers rig it'] },
  Inhospitable:{ attack:['Hunt an enemy recon team in the ash flats','Recover a downed drone from the toxic basin','Push a patrol through the storm belt to fix enemy positions'], defend:['Reach a stranded survey team before the enemy does','Hold a weather station through a dust storm','Break contact and extract across the salt pan'] },
  Open:{ attack:['Sweep the farmland and clear enemy pickets','Seize the crossroads that controls the valley','Destroy an enemy forward supply point'], defend:['Screen the battalion flank along the hedgerows','Hold the crossroads until dusk','Delay the enemy advance and withdraw in good order'] }
};
const TIERS = [
  { key:'fireteam', name:'Fireteam', scen:'Skirmish', table:[36,36], len:'6 rounds', force:'3–6 figures, no vehicles', gen:'figures' },
  { key:'squad', name:'Squad', scen:'Skirmish', table:[36,36], len:'6 rounds', force:'1 squad + up to 2 characters', gen:'pre' },
  { key:'section', name:'Section', scen:'Evolving Objective', table:[36,36], len:'5–6 rounds', force:'2 squads + 1 support', gen:'pre' },
  { key:'platoon', name:'Platoon', scen:'Battle', table:[48,48], len:'Clock, 18 minutes', force:'4–6 units', gen:'during' },
  { key:'reinforced', name:'Reinforced platoon', scen:'Grand Battle', table:[48,48], len:'Clock, 22 minutes', force:'7–10 units + reserves', gen:'during' }
];
const SCALES = { fireteam:{tier:0,floor:8}, squad:{tier:1,floor:10}, platoon:{tier:3,floor:14}, reinforced:{tier:4,floor:18} };
const cohesionFor = len => RP({ short:'cohShort', standard:'cohStandard', long:'cohLong' }[len] || 'cohStandard');
const SKIRMISH_OBJ = [[20,'Kill Target','Kill a randomly chosen enemy figure.'],[30,'Score Kills','A chosen friendly figure kills two enemies.'],[50,'Kill Confirmed','Reach the spot where the next enemy falls.'],[60,'Stay Alive','A chosen friendly figure survives three rounds.'],[75,'Capture','Hold a target feature alone at the end of two straight rounds.'],[90,'Scout','Contact two target features.'],[100,'Sneak Through','Move a figure off the enemy edge.']];
const BATTLE_OBJ = ['Engagement','Vital Ground','Hold the Field','Recon in Force','Break Point','Search and Retrieve'];
const BATTLE_OBJ_TXT = { 'Engagement':'1 VP per enemy unit destroyed or driven off.', 'Vital Ground':'Hold the terrain at the table centre with no enemy in it at the end.', 'Hold the Field':'Three markers on the centre line; hold two at the end.', 'Recon in Force':'More infantry units in their deployment zone than they have in yours.', 'Break Point':'Destroy or drive off half the enemy units first.', 'Search and Retrieve':'Six markers near the centre line; find the target and carry it.' };
const SECONDARY = [[8,'Reach Location'],[14,'Kill Target'],[23,'Reach Location and Interact'],[30,'Locate'],[37,'Leave Battle'],[43,'Hold Fast'],[49,'Kill Unit'],[55,'Kill Confirmed'],[64,'Capture'],[71,'Confront'],[81,'Search'],[91,'Secure'],[100,'Retrieve']];
const SUPPORT = ['Area Denial','Countermeasures','Engineers','Evac','Fire Support','Illumination','Intel Update','Interdiction','Mine Laying','Obscuration','Resupply','Scanner Sweep','Scramble','Targeting Guidance'];
const SUPPORT_SKINS = {
  'Area Denial':['persistent gas shells','plasma barrier drones'], 'Countermeasures':['counter-battery radar','EW jamming van'], 'Engineers':['pioneer section','combat engineer dozer'],
  'Evac':['dropship dust-off','armored ambulance run'], 'Fire Support':['battalion 81mm mortar section','medium howitzer battery','light orbital lance'], 'Illumination':['star shells','flare drones'],
  'Intel Update':['drone overwatch feed','signals intercept team'], 'Interdiction':['artillery on the approach road','strike fighter on call'], 'Mine Laying':['scatterable mine shells','mine-laying drones'],
  'Obscuration':['smoke barrage','nano-fog canisters'], 'Resupply':['air-dropped ammo pallet','supply crawler'], 'Scanner Sweep':['ISR satellite pass','ground radar mast'],
  'Scramble':['EW detachment','cyber intrusion cell'], 'Targeting Guidance':['laser designator team','spotter drone']
};
const CONDITIONS = [
  ['Poor support','Support availability numbers +1.'],['Limited support','A failed support call raises its number by 1.'],['Jammed transmissions','All communications need a test.'],
  ['Chance encounter','Troops deployed at the start begin Confused.'],['Dangerous terrain','One random feature per quarter is Dangerous.'],['Limited ammo','Crewed and vehicle weapons use Dwindling Ammo.'],
  ['Limited visibility','Limited Visibility rules apply.'],['Weapons testing','Each side picks one prototype weapon: +1 damage, unreliable.'],['Unstable terrain','A feature collapses on a 1 the first time it is entered.'],
  ['Fight to the bitter end','+1 to effective Morale for all troops.'],['Snap decisions','No Overwatch this battle.'],['Uncertain ground','No unit may Dash or Move Out.'],
  ['Rivalry','Each side picks one squad: Fearless, no Morale tests.'],['Combat specialist','Each side picks one figure: x2 close assault attacks.'],['Storm tactics','+1 to all close assault hit dice.'],
  ['Hesitation','Round 1: one activation per phase.'],['Lack of fire control','Units cannot split fire.'],['Heroic battle','Each side picks one figure: +1 KP.'],
  ['Frantic battle','All units +1 Reaction.'],['Tank hunt','A natural 6 to hit a vehicle adds +1 damage.'],['Unexpectedly vital mission','Each VP rolls a D6; on 6 gain another VP.'],
  ['Lengthy battle','Add one round.'],['Uncertain battle length','After the last round, 5–6 plays another round.'],['Delayed','Each side: one random unit arrives in round 3.'],
  ['Immediate reserve','Up to half your units may arrive in round 2.'],['Positional warfare','Each side places cover for two squads or crews.'],['Shelling terrain','Each side turns one feature into craters or ruins.'],
  ['Ammo supply','One squad or crew may reroll up to 3 missed shots.'],['Rookies','One random unit per side: −1 Reaction.'],['Cover the rear','Each side holds one unit out of the battle.'],
  ['Junior leadership','One squad leader per side: +1 KP.'],['Static warfare','The first unit each side activates per round cannot move.'],['Fight to the end','No Skulk or Fall Back.'],['Hero battle','All squad leaders and individuals +1 KP.']
];
const SQUAD_SKILLS = [['Brave',10,'+1 to Morale tests'],['Tank hunters',15,'One Tank Killer shot per activation: +1 hit and damage'],['Keen shots',10,'+6" rifle range; one rifle shot per activation +1 to hit'],['Die-hards',5,'One non-sergeant figure gets +1 KP each battle'],['Fire drill',10,'Stationary: add Combat Skill to Overwatch fire'],['Brawlers',5,'Reroll 1s in close assault'],['Fearless',5,'Squad becomes Fearless'],['Bombers',5,'Two grenades per activation, +2" throw'],['Guerillas',10,'Fire pistols and rifles while Dashing (natural 6)'],['Quick',10,'Dash adds +4"']];
const SGT_SKILLS = [['Rugged',5,'+1 KP'],['Parry',5,'Force one incoming assault reroll'],['Motivator',5,'+1 Morale for the squad'],['Fighter',5,'Two close assault attacks'],['Survivor',5,'Ignore a Hit on 5–6'],['Tactics',10,'Squad +1 Reaction'],['Experienced Eye',5,'+1 to hit, ranged'],['Alert',5,'Spots at +3"']];
const IND_SKILLS = [['Gun-slinging',5,'Fire two pistols'],['Quick feet',5,'Dash bonus equals Speed'],['Deadly accuracy',5,'Reroll 1s on attacks'],['Lucky',5,'6+ Saving Throw'],['Skilled leader',5,'Morale bonus reaches 9"'],['Expert fighter',5,'+1 close combat attack']];
const STORY_TABLE = [
  [4,'Reinforcements','One side gets significant new manpower or capability.','reinf'],[8,'Critical Strike','One side launches an attack on a high-priority target.','crit'],
  [11,'New Main Character','The focal character of your force changes.',null],[15,'Flashback','Play out an earlier event in a character\'s or unit\'s past.',null],
  [20,'Balance is Shifting','One side gains the upper hand in a zone.','shift'],[25,'Shortfall','One side runs short of fuel, ammunition or food.','short'],
  [31,'New Character','A new character joins the story.',null],[36,'New Ally','A new ally enters the war and opens a front.','ally'],
  [42,'Loss of Initiative','The side on the back foot seizes the initiative.','init'],[46,'Change of Perspective','The campaign shifts to a new point of view.',null],
  [52,'Unconventional Operation','One side launches a special operations mission.','unconv'],[57,'Loss of Capability','One side loses a combat capability and cannot issue orders this turn.','losscap'],
  [62,'Side Story','A secondary story unfolds alongside the war.',null],[66,'Unit Reassignment','A unit is reassigned and replaced by a new one.',null],
  [72,'Change in Strategy','One side adopts a new strategy and carries out two orders.','strategy'],[77,'Change of Focus','The Operational Focus moves to another zone.','focus'],
  [83,'Transfer In','A unit transfers in from another formation.','transfer'],[88,'Front Transfer','Your force is moved to a different zone.','front'],
  [92,'R&R','Your force rests, recovers and refits.','rr'],[96,'New Front Opens','A new zone opens at strength 4 against 4 and fights now.','newfront'],
  [100,'Remote Conflict','A linked conflict breaks out elsewhere in the system.',null]
];
const PERSONALITIES = ['Aggressive','Methodical','Opportunist','Raider'];
const awardList = () => (S.content && S.content.awards || []);
const awardOf = name => awardList().find(a => a.name === name);
const WEAPON_CATS = ['Rifle','Sidearm','Melee','Grenade','Team','Crewed','Vehicle'];
const GEAR_TYPES = ['Equipment','Defense','Enhancement','Vehicle modification'];

/* ---------- terrain language (draft, to agree with RJ) ---------- */
const TERRAIN_TIERS = {
  micro:{ name:'Micro', size:'up to 3" across', examples:'rock, crate, barrel cluster, short wall section', perCell:'2–3, clustered near larger pieces', note:'Cover only when a figure is right behind it; never blocks a lane by itself.' },
  small:{ name:'Small', size:'3"–6"', examples:'tree clump, shipping container, 6" wall run, crater, low ruin', perCell:'1–2', note:'The pieces that break up firing lanes between larger features.' },
  medium:{ name:'Medium', size:'6"–12"', examples:'single building, woods patch, hill, bunker', perCell:'1, centre squares first', note:'Every 12" square should hold one of these or two smalls.' },
  large:{ name:'Large', size:'12" and up', examples:'multi-room, multi-floor complex', perCell:'0–1 per table, at the centre', note:'Sets the theme of the table; fights happen inside it as well as around it.' }
};
const TERRAIN_RULES = {
  Scatter:'Person-sized; cover only from fire crossing it; does not slow movement.',
  Linear:'Walls and fences up to 2" tall; 2" to cross; cover within 3".',
  Area:'Woods, rubble, craters; cover inside; line of sight 2" deep; no Dash bonus.',
  Building:'Doors 1", windows 2"; cover at openings; Area blasts +1 inside.',
  Hill:'Height advantage for shooters on top.',
  Solid:'Portal term: blocks line of sight and movement (containers, tanks); cover when adjacent.',
  Impassable:'Cannot be entered (chem pools, chasms).'
};

/* ---------- rules pack (1.0) ----------
   Every book table the engine reads lives here. The shipped rows are condensed
   placeholders; the player keys in the real values on the Rules tab. The pack is
   stored apart from campaigns (local only) and shared by all of them. */
const COND_OPTS = [['','—'],['outnumbered3','You outnumber them by 3+ units'],['outnumbered','You outnumber them'],['playerHeavy','You field a heavy vehicle'],['enemyVehicles2','They already have 2+ vehicles'],['enemyHasInfantry','They already have infantry'],['enemyNoInfantry','They have no infantry yet'],['playerVehicles2','You field 2+ vehicles'],['objectives','Mission has objectives'],['objectivesOutnumbered','Objectives, and you outnumber them']];
const STORY_FX = [['','Narrative only'],['reinf','Reinforcements: +1 to the winning side'],['crit','Critical Strike on your next mission'],['shift','Balance shifts in your zone'],['short','Shortfall: −1 to an army at 4+'],['ally','New ally opens a front 4 v 2'],['init','Side behind seizes the initiative'],['unconv','Special operation vs enemy strength'],['losscap','Loser issues no orders next turn'],['strategy','Winner issues two orders next turn'],['focus','Operational Focus moves'],['transfer','Transfer in: +1 in your zone'],['front','Your force moves front'],['rr','R&R: conditions cleared'],['newfront','New front opens 4 v 4']];
const ORDER_FX = [['fortify','Construct Defense'],['continue','Continued Offensive'],['newOffensive','New Offensive'],['renew','Renewed Effort'],['raid','Raiding'],['bolster','Bolster Positions']];
const INJ_FX = [['dead','Dead'],['injured','Out of action for a time'],['light','Light wound, fights on'],['fine','No lasting effect']];
const ADV_STATS = [['sp','Speed'],['re','Reaction'],['cs','Combat'],['t','Toughness'],['kp','KP'],['sv','Savvy'],['tr','Training']];
const LOSS_STATES = [['Okay','Okay'],['Weakened','Weakened'],['Devastated','Devastated'],['Lost','Lost']];
const SLOT_HELP = 'infantry, recon, storm, transport, armoredCar, lightTank, tank, heavyTank, weaponsTeam, majorChar, epicChar, sniper';
const TABLE_DEFS = {
  enemyForces:{ name:'Random Enemy Forces', source:'5P:T core, enemy generation', die:100, order:1, why:'Every pre-battle and during-battle enemy roll.',
    cols:[['max','Up to','int'],['slots','Arrives','text'],['cond','Swap when','sel',COND_OPTS],['alt','Swap to','text'],['cond2','Else swap when','sel',COND_OPTS],['alt2','Swap to','text']],
    help:'Units are slot keys separated by commas: ' + SLOT_HELP + '. Leave Arrives blank for "nothing arrives". Swaps are checked in order.',
    rows:() => [{max:10,slots:'infantry',cond:'outnumbered3',alt:'infantry, infantry'},{max:20,slots:'infantry, infantry, majorChar'},{max:30,slots:'recon'},{max:40,slots:'infantry, transport'},
      {max:45,slots:'epicChar',cond:'outnumbered3',alt:'epicChar, infantry'},{max:50,slots:'weaponsTeam',cond:'playerHeavy',alt:'heavyTank'},{max:60,slots:'armoredCar',cond:'enemyVehicles2',alt:'infantry'},
      {max:70,slots:'infantry, infantry',cond:'enemyHasInfantry',alt:'tank'},{max:80,slots:'infantry, tank'},{max:90,slots:'',cond:'playerVehicles2',alt:'lightTank'},{max:100,slots:'',cond:'objectivesOutnumbered',alt:'storm, infantry',cond2:'objectives',alt2:'storm'}] },
  story:{ name:'Story Events', source:'5P:T core, Operational campaign', die:100, order:2, why:'The story event rolled every few operational turns.',
    cols:[['max','Up to','int'],['title','Event','text'],['text','What happens','text'],['effect','Map effect','sel',STORY_FX]],
    rows:() => [[4,'Reinforcements','One side gets significant new manpower or capability.','reinf'],[8,'Critical Strike','One side launches an attack on a high-priority target.','crit'],[11,'New Main Character','The focal character of your force changes.',''],[15,'Flashback','Play out an earlier event in a character\'s or unit\'s past.',''],[20,'Balance is Shifting','One side gains the upper hand in a zone.','shift'],[25,'Shortfall','One side runs short of fuel, ammunition or food.','short'],[31,'New Character','A new character joins the story.',''],[36,'New Ally','A new ally enters the war and opens a front.','ally'],[42,'Loss of Initiative','The side on the back foot seizes the initiative.','init'],[46,'Change of Perspective','The campaign shifts to a new point of view.',''],[52,'Unconventional Operation','One side launches a special operations mission.','unconv'],[57,'Loss of Capability','One side loses a combat capability and cannot issue orders this turn.','losscap'],[62,'Side Story','A secondary story unfolds alongside the war.',''],[66,'Unit Reassignment','A unit is reassigned and replaced by a new one.',''],[72,'Change in Strategy','One side adopts a new strategy and carries out two orders.','strategy'],[77,'Change of Focus','The Operational Focus moves to another zone.','focus'],[83,'Transfer In','A unit transfers in from another formation.','transfer'],[88,'Front Transfer','Your force is moved to a different zone.','front'],[92,'R&R','Your force rests, recovers and refits.','rr'],[96,'New Front Opens','A new zone opens at strength 4 against 4 and fights now.','newfront'],[100,'Remote Conflict','A linked conflict breaks out elsewhere in the system.','']].map(([max,title,text,effect]) => ({max,title,text,effect})) },
  orders:{ name:'Operational Orders', source:'5P:T core, Operational campaign', die:6, order:3, why:'Each side\'s order every operational turn.',
    cols:[['max','Roll','int'],['name','Order','text'],['effect','Does','sel',ORDER_FX]],
    rows:() => ORDER_FX.map(([effect,name], i) => ({ max:i + 1, name, effect })) },
  unitLosses:{ name:'Unit Losses', source:'5P:T core, post-battle', die:6, order:4, why:'A unit that was wiped out on the table.',
    cols:[['max','Up to','int'],['state','Result','sel',LOSS_STATES],['battles','Battles out','int']],
    rows:() => [{max:1,state:'Lost',battles:0},{max:2,state:'Devastated',battles:2},{max:3,state:'Weakened',battles:1},{max:6,state:'Okay',battles:0}] },
  injury:{ name:'Casualty Injury', source:'5PFH Injury table, as used for named figures', die:100, order:5, why:'Each named figure that became a casualty. House rule: a figure stabilized on the table may reroll; the second result stands.',
    cols:[['max','Up to','int'],['result','Result','text'],['effect','Outcome','sel',INJ_FX],['turns','Turns out (e.g. 1, D3+1, D6)','text'],['xp','Bonus XP','int']],
    rows:() => [{max:5,result:'Gruesome fate',effect:'dead'},{max:15,result:'Death or permanent injury',effect:'dead'},{max:16,result:'Miraculous escape',effect:'fine'},{max:30,result:'Equipment loss',effect:'fine'},{max:45,result:'Crippling wound',effect:'injured',turns:'D6'},{max:54,result:'Serious injury',effect:'injured',turns:'D3+1'},{max:80,result:'Minor injuries',effect:'injured',turns:'1'},{max:95,result:'Knocked out',effect:'light'},{max:100,result:'School of hard knocks',effect:'fine',xp:1}] },
  figXp:{ name:'Figure Experience', source:'5PFH experience, per-figure (IA campaigns)', die:0, order:6, why:'Experience for named figures when per-figure XP is on in Mods.', fixed:true,
    cols:[['key','Event','fixed'],['label','Description','text'],['xp','XP','int']],
    rows:() => [{key:'casualty',label:'Became a casualty',xp:1},{key:'survivedLoss',label:'Survived, battle not won',xp:2},{key:'survivedWin',label:'Survived, battle won',xp:3},{key:'firstBlood',label:'First casualty of the battle',xp:1},{key:'unique',label:'Killed a unique individual',xp:1},{key:'perKill',label:'Each kill',xp:0}] },
  advance:{ name:'Figure Advancement', source:'5PFH character upgrades', die:0, order:7, why:'What a named figure can buy with its XP.',
    cols:[['stat','Stat','sel',ADV_STATS],['xp','XP cost','int'],['step','Raise by','int'],['max','Maximum','int']],
    rows:() => [{stat:'sp',xp:5,step:1,max:8},{stat:'sv',xp:5,step:1,max:5},{stat:'t',xp:6,step:1,max:6},{stat:'re',xp:7,step:1,max:6},{stat:'cs',xp:7,step:1,max:5}] },
  unitXp:{ name:'Unit Experience', source:'5P:T core, post-battle', die:0, order:8, why:'Unit XP after each battle.', fixed:true,
    cols:[['key','Case','fixed'],['label','Description','text'],['dice','Dice (D6, best2, or a number)','text']],
    rows:() => [{key:'unit',label:'Each unit that took part',dice:'D6'},{key:'indWin',label:'Individual, battle won',dice:'best2'}] },
  skirmishObj:{ name:'Skirmish Objectives', source:'5P:T core, Skirmish scenario', die:100, order:9, why:'The three objectives in Fireteam and Squad missions.',
    cols:[['max','Up to','int'],['name','Objective','text'],['text','Condition','text']],
    rows:() => SKIRMISH_OBJ.map(([max,name,text]) => ({max,name,text})) },
  battleObj:{ name:'Battle Objectives', source:'5P:T core, Battle scenario', die:6, order:10, why:'Platoon battles.',
    cols:[['max','Roll','int'],['name','Objective','text'],['text','Victory condition','text']],
    rows:() => BATTLE_OBJ.map((name, i) => ({ max:i + 1, name, text:BATTLE_OBJ_TXT[name] })) },
  secondary:{ name:'Secondary Objectives', source:'5P:T core', die:100, order:11, why:'Platoon and reinforced missions.',
    cols:[['max','Up to','int'],['name','Objective','text']], rows:() => SECONDARY.map(([max,name]) => ({max,name})) },
  conditions:{ name:'Battlefield Conditions', source:'5P:T core', die:100, order:12, why:'Rolled for every mission.',
    cols:[['max','Up to','int'],['name','Condition','text'],['text','Effect','text']], rows:() => CONDITIONS.map(([name,text], i) => ({ max:Math.min(100, (i + 1) * 3 + (i === 33 ? 1 : 0)), name, text })) },
  condCount:{ name:'Condition Count', source:'Portal default', die:100, order:13, why:'How many battlefield conditions a mission gets.',
    cols:[['max','Up to','int'],['count','Conditions','int']], rows:() => [{max:15,count:0},{max:75,count:1},{max:90,count:2},{max:100,count:3}] },
  squadSkills:{ name:'Squad Veteran Skills', source:'5P:T core / FCG', die:0, order:14, why:'Bought with unit XP.', cols:[['name','Skill','text'],['xp','XP','int'],['text','Effect','text']], rows:() => SQUAD_SKILLS.map(([name,xp,text]) => ({name,xp,text})) },
  sgtSkills:{ name:'Sergeant Skills', source:'5P:T core / FCG', die:0, order:15, why:'Bought with unit XP.', cols:[['name','Skill','text'],['xp','XP','int'],['text','Effect','text']], rows:() => SGT_SKILLS.map(([name,xp,text]) => ({name,xp,text})) },
  indSkills:{ name:'Individual Skills', source:'5P:T core / FCG', die:0, order:16, why:'Bought with unit XP by characters.', cols:[['name','Skill','text'],['xp','XP','int'],['text','Effect','text']], rows:() => IND_SKILLS.map(([name,xp,text]) => ({name,xp,text})) },
  crewSkills:{ name:'Gun Crew Skills', source:'5P:T core', die:0, order:16.2, why:'Veteran skills for weapon teams.', cols:[['name','Skill','text'],['xp','Cost','int'],['text','Effect','text']], rows:() => [{name:'Gun drill',xp:10,text:'May reroll a single Hit die.'},{name:'Fortified positions',xp:5,text:'6+ Saving Throw against all Hits.'}] },
  vehicleSkills:{ name:'Vehicle Crew Skills', source:'5P:T core', die:0, order:16.4, why:'Veteran skills for vehicle crews.', cols:[['name','Skill','text'],['xp','Cost','int'],['text','Effect','text']], rows:() => [{name:'Command',xp:10,text:'+1 Reaction.'},{name:'Improvised armor',xp:10,text:'+1 KP.'}] },
  profileCosts:{ name:'Profile Costs', source:'5P:T Master Points Costs (pp.178–180)', die:0, order:17.5, why:'Points per figure by species and profile, plus creatures and vehicles. A template priced as one of these rows uses it instead of the stat estimate. A vehicle\'s price includes its listed weapons; options (+10 and so on) go in as hand-entered points.',
    cols:[['species','Species','text'],['profile','Profile','text'],['pts','Points per figure','int']],
    rows:() => [{"species": "Human", "profile": "Civilian", "pts": 5}, {"species": "Human", "profile": "Military", "pts": 10}, {"species": "Human", "profile": "Sergeant/Minor", "pts": 15}, {"species": "Human", "profile": "Major", "pts": 20}, {"species": "Human", "profile": "Epic", "pts": 30}, {"species": "Feral", "profile": "Civilian", "pts": 6}, {"species": "Feral", "profile": "Military", "pts": 12}, {"species": "Feral", "profile": "Sergeant/Minor", "pts": 17}, {"species": "Feral", "profile": "Major", "pts": 22}, {"species": "Feral", "profile": "Epic", "pts": 32}, {"species": "Hulker", "profile": "Standard", "pts": 15}, {"species": "Hulker", "profile": "Sergeant/Minor", "pts": 20}, {"species": "Hulker", "profile": "Major", "pts": 25}, {"species": "Hulker", "profile": "Epic", "pts": 40}, {"species": "Erekish (Precursors)", "profile": "Civilian", "pts": 6}, {"species": "Erekish (Precursors)", "profile": "Military", "pts": 12}, {"species": "Erekish (Precursors)", "profile": "Sergeant/Minor", "pts": 18}, {"species": "Erekish (Precursors)", "profile": "Major", "pts": 25}, {"species": "Erekish (Precursors)", "profile": "Epic", "pts": 35}, {"species": "K'Erin", "profile": "Civilian", "pts": 8}, {"species": "K'Erin", "profile": "Military", "pts": 13}, {"species": "K'Erin", "profile": "Sergeant/Minor", "pts": 20}, {"species": "K'Erin", "profile": "Major", "pts": 25}, {"species": "K'Erin", "profile": "Epic", "pts": 32}, {"species": "Souless", "profile": "Standard", "pts": 20}, {"species": "The Converted", "profile": "Worker", "pts": 10}, {"species": "The Converted", "profile": "Military", "pts": 15}, {"species": "The Converted", "profile": "Sergeant/Minor", "pts": 20}, {"species": "The Converted", "profile": "Major", "pts": 25}, {"species": "The Converted", "profile": "Epic", "pts": 36}, {"species": "The Horde", "profile": "Worker", "pts": 6}, {"species": "The Horde", "profile": "Military", "pts": 10}, {"species": "The Horde", "profile": "Sergeant/Minor", "pts": 15}, {"species": "The Horde", "profile": "Major", "pts": 20}, {"species": "The Horde", "profile": "Epic", "pts": 30}, {"species": "Serian (Engineers)", "profile": "Civilian", "pts": 7}, {"species": "Serian (Engineers)", "profile": "Military", "pts": 11}, {"species": "Serian (Engineers)", "profile": "Sergeant/Minor", "pts": 16}, {"species": "Serian (Engineers)", "profile": "Major", "pts": 22}, {"species": "Serian (Engineers)", "profile": "Epic", "pts": 32}, {"species": "The Swift", "profile": "Civilian", "pts": 6}, {"species": "The Swift", "profile": "Military", "pts": 12}, {"species": "The Swift", "profile": "Sergeant/Minor", "pts": 17}, {"species": "The Swift", "profile": "Major", "pts": 22}, {"species": "The Swift", "profile": "Epic", "pts": 32}, {"species": "Keltrin (Skulkers)", "profile": "Civilian", "pts": 6}, {"species": "Keltrin (Skulkers)", "profile": "Military", "pts": 12}, {"species": "Keltrin (Skulkers)", "profile": "Sergeant/Minor", "pts": 17}, {"species": "Keltrin (Skulkers)", "profile": "Major", "pts": 22}, {"species": "Keltrin (Skulkers)", "profile": "Epic", "pts": 32}, {"species": "Hakshan", "profile": "Civilian", "pts": 5}, {"species": "Hakshan", "profile": "Military", "pts": 10}, {"species": "Hakshan", "profile": "Sergeant/Minor", "pts": 15}, {"species": "Hakshan", "profile": "Major", "pts": 20}, {"species": "Hakshan", "profile": "Epic", "pts": 30}, {"species": "Clones (The Many)", "profile": "Civilian", "pts": 8}, {"species": "Clones (The Many)", "profile": "Military", "pts": 15}, {"species": "Clones (The Many)", "profile": "Sergeant/Minor", "pts": 20}, {"species": "Clones (The Many)", "profile": "Major", "pts": 30}, {"species": "Clones (The Many)", "profile": "Epic", "pts": 40}, {"species": "Ystrik (Manipulators)", "profile": "Civilian", "pts": 5}, {"species": "Ystrik (Manipulators)", "profile": "Military", "pts": 8}, {"species": "Ystrik (Manipulators)", "profile": "Sergeant/Minor", "pts": 13}, {"species": "Ystrik (Manipulators)", "profile": "Major", "pts": 18}, {"species": "Ystrik (Manipulators)", "profile": "Epic", "pts": 27}, {"species": "Krag (Dwarves)", "profile": "Civilian", "pts": 5}, {"species": "Krag (Dwarves)", "profile": "Military", "pts": 10}, {"species": "Krag (Dwarves)", "profile": "Sergeant/Minor", "pts": 15}, {"species": "Krag (Dwarves)", "profile": "Major", "pts": 20}, {"species": "Krag (Dwarves)", "profile": "Epic", "pts": 30}, {"species": "Creature", "profile": "Swarm", "pts": 15}, {"species": "Creature", "profile": "Razor Lizard", "pts": 8}, {"species": "Creature", "profile": "Gene-Dog", "pts": 14}, {"species": "Creature", "profile": "Sand Runner", "pts": 8}, {"species": "Creature", "profile": "Krog", "pts": 25}, {"species": "Creature", "profile": "Brute Lizard, Large", "pts": 30}, {"species": "Creature", "profile": "Brute Lizard, Huge", "pts": 40}, {"species": "Creature", "profile": "Brute Lizard, Massive", "pts": 55}, {"species": "Vehicle", "profile": "Nomad Bike", "pts": 15}, {"species": "Vehicle", "profile": "Scouter", "pts": 35}, {"species": "Vehicle", "profile": "Lancer", "pts": 30}, {"species": "Vehicle", "profile": "Frontier Trike", "pts": 35}, {"species": "Vehicle", "profile": "Raider Trike", "pts": 35}, {"species": "Vehicle", "profile": "Armoured Car", "pts": 60}, {"species": "Vehicle", "profile": "APC", "pts": 50}, {"species": "Vehicle", "profile": "APC – Grav", "pts": 55}, {"species": "Vehicle", "profile": "IFV", "pts": 70}, {"species": "Vehicle", "profile": "IFV – Grav", "pts": 75}, {"species": "Vehicle", "profile": "Light tank", "pts": 100}, {"species": "Vehicle", "profile": "Light tank – Grav", "pts": 115}, {"species": "Vehicle", "profile": "Medium tank", "pts": 140}, {"species": "Vehicle", "profile": "Medium – Grav", "pts": 150}, {"species": "Vehicle", "profile": "Heavy tank", "pts": 200}, {"species": "Vehicle", "profile": "Light walker", "pts": 70}, {"species": "Vehicle", "profile": "Heavy walker", "pts": 100}, {"species": "Vehicle", "profile": "CIM-L", "pts": 35}, {"species": "Vehicle", "profile": "CIM-APP", "pts": 45}] },
  params:{ name:'Campaign Numbers', source:'5P:T core and FCG, condensed', die:0, order:17, why:'The single numbers the campaign engine uses.', fixed:true,
    cols:[['key','Setting','fixed'],['label','What it is','text'],['value','Value','num']],
    rows:() => [{key:'cohShort',label:'Cohesion, short campaign',value:3},{key:'cohStandard',label:'Cohesion, standard campaign',value:5},{key:'cohLong',label:'Cohesion, long campaign',value:10},{key:'regionsPerCoh',label:'Regions per point of total Cohesion',value:1.5},
      {key:'pbpPerTurn',label:'Player Battle Points earned per zone per turn',value:2},{key:'pbpMax',label:'Player Battle Points saved per zone',value:3},{key:'dq',label:'Defense Quality of a Defensible region',value:2},{key:'inhospCap',label:'Army Strength cap in Inhospitable regions',value:2},
      {key:'cpWin',label:'Campaign Points bonus, victory',value:3},{key:'cpDraw',label:'Campaign Points bonus, draw',value:2},{key:'cpLoss',label:'Campaign Points bonus, defeat',value:1},{key:'rosterAdd',label:'Roster Addition cost (CP)',value:3},
      {key:'refit',label:'Refit cost per unit when a template changes (CP)',value:1},{key:'skillPremium',label:'XP premium for a second veteran skill',value:5},{key:'skillCP',label:'Gain Veteran Skill (CP, core rules)',value:4},{key:'retrainCP',label:'Retrain Unit (CP, core rules)',value:2}] },
  points:{ name:'Points Costs', source:'FCG Army Builder (estimate until keyed in)', die:0, order:18, why:'Per-figure cost formula. Replace with the Master Points Costs values.', fixed:true,
    cols:[['key','Term','fixed'],['label','What it prices','text'],['value','Points','num']],
    rows:() => [{key:'base',label:'Base figure (Speed 4, Reaction 1, Combat +0, Toughness 3, KP 1)',value:4.82},{key:'sp',label:'Per point of Speed above 4',value:0.97},{key:'re',label:'Per point of Reaction above 1',value:1.33},{key:'cs',label:'Per point of Combat',value:1.82},{key:'t',label:'Per point of Toughness above 3',value:2.28},{key:'kp',label:'Per KP above 1',value:5.26},{key:'sv',label:'Per point of Savvy',value:1.79},{key:'tr',label:'Per point of Training',value:1.09},{key:'save',label:'Per step of armor save (6+ = 1 step)',value:1.34},{key:'individual',label:'Individual surcharge',value:5},{key:'hero',label:'Hero rule',value:5},{key:'leader',label:'Leader rule on an individual',value:10}] },
  supportCost:{ name:'Support Asset Costs', source:'5P:T p.109 Battle Support, plus portal tiers', die:0, order:19, why:'CP to bank a support asset by its target number. Book: 2 CP, called at 7+ when chosen before the battle or 8+ when called in mid-battle.',
    cols:[['tn','Target number','int'],['cp','CP','int'],['note','Source','text']], rows:() => [{tn:6,cp:3,note:'Portal tier'},{tn:7,cp:2,note:'Book: Battle Support'},{tn:8,cp:1,note:'Portal tier (book: mid-battle call of a paid asset)'}] },
};
function defaultRules(){ const tables = {}; Object.entries(TABLE_DEFS).forEach(([id, def]) => { tables[id] = { status:'placeholder', rows:def.rows(), updated:null }; }); return { v:1, tables }; }
let RULES = defaultRules();
function R(id){ const t = RULES.tables[id]; return t && t.rows && t.rows.length ? t.rows : TABLE_DEFS[id].rows(); }
function RP(key){ const r = R('params').find(x => x.key === key); return r ? Number(r.value) : TABLE_DEFS.params.rows().find(x => x.key === key).value; }
function lookup(id, v){ const rows = R(id); return rows.find(r => v <= Number(r.max)) || rows[rows.length - 1]; }
function rulesFlag(id){ const t = RULES.tables[id]; return t ? t.status : 'placeholder'; }
function validateTable(id, rows){
  const def = TABLE_DEFS[id]; const out = [];
  if (def.die){ let prev = 0;
    rows.forEach((r, i) => { const m = Number(r.max); if (!(m > prev)) out.push(`Row ${i + 1}: "${def.cols[0][1]}" must be higher than the row above (${prev}).`); prev = m; });
    if (prev !== def.die) out.push(`The last row must end at ${def.die}.`); }
  def.cols.forEach(([k, , type]) => { if (type === 'int' || type === 'num') rows.forEach((r, i) => { if (r[k] !== '' && r[k] != null && isNaN(Number(r[k]))) out.push(`Row ${i + 1}: ${k} is not a number.`); }); });
  if (id === 'enemyForces') rows.forEach((r, i) => ['slots','alt','alt2'].forEach(k => slotList(r[k]).forEach(s => { if (!SLOT_LABEL[s]) out.push(`Row ${i + 1}: "${s}" is not a slot key.`); })));
  if (id === 'injury') rows.forEach((r, i) => { if (r.effect === 'injured' && !diceExprOk(r.turns)) out.push(`Row ${i + 1}: turns "${r.turns || ''}" should look like 1, D3, D6 or D3+1.`); });
  return out;
}
const slotList = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const diceExprOk = s => /^\s*(\d+|\d*D\d+(\s*[+-]\s*\d+)?)\s*$/i.test(String(s || ''));
function rollExpr(expr, label){
  const s = String(expr || '0').toUpperCase().replace(/\s/g, ''); const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) return parseInt(s, 10) || 0;
  const n = parseInt(m[1] || '1', 10), sides = parseInt(m[2], 10); let t = 0; for (let i = 0; i < n; i++) t += die(sides, n > 1 ? `${label} (${i + 1} of ${n})` : label); return t + (parseInt(m[3] || '0', 10));
}

/* ---------- points (estimate fitted to published FCG profiles) ---------- */
/* Non-negative least squares over 16 per-figure costs (Dragoons, Serian, Bots, Horde, Swarm, special characters): mean error 0.73 pts. */
function PTS(){ const o = {}; R('points').forEach(r => o[r.key] = Number(r.value) || 0); return o; }
const profileKey = r => `${r.species} · ${r.profile}`;
function profileCost(key){ if (!key) return null; const r = R('profileCosts').find(x => profileKey(x) === key); return r ? Number(r.pts) || 0 : null; }
/* the sergeant of a squad priced as a species' Military profile is priced as that species' Sergeant/Minor */
function profileUp(key){ if (!key) return key; const up = key.replace(/ · (Military|Standard)$/, ' · Sergeant/Minor'); return profileCost(up) != null ? up : key; }
function saveSteps(sv){ const m = String(sv || '').match(/(\d)\+/); return m ? clamp(7 - parseInt(m[1], 10), 0, 5) : 0; }
function figPts(p, k){ k = k || PTS(); return Math.max(1, k.base + k.sp * (p.sp - 4) + k.re * (p.re - 1) + k.cs * p.cs + k.t * (p.t - 3) + k.kp * (p.kp - 1) + k.sv * p.sv + k.tr * p.tr + k.save * saveSteps(p.save)); }
function tplPoints(t){
  if (!t) return { v:0, est:false };
  if (t.pointsMode === 'manual') return { v:t.points || 0, est:false };
  const lead = t.leader ? 1 : 0; const rank = Math.max(0, t.size - lead); const k = PTS();
  const wp = id => { const w = weaponOf(id); return w ? (w.pts || 0) : 0; };
  const book = profileCost(t.priceAs), bookL = profileCost(t.leaderPriceAs || t.priceAs);
  const armor = p => ({ '6+':2, '5+':4 }[p && p.save] || 0);
  let estUsed = false;
  const one = (p, b) => { if (b != null) return b + armor(p); estUsed = true; return figPts(p, k); };
  if (t.troop === 'vehicle' && book != null) return { v:book + (/\bhero\b/i.test((t.rules || []).join(' ')) ? PTS().hero : 0), est:rulesFlag('profileCosts') === 'placeholder' };
  let v = rank * one(t.profile, book) + (lead ? one(t.leader, t.leaderPriceAs ? bookL : (book != null ? profileCost(profileUp(t.priceAs)) : null)) : 0);
  v += rank * (t.weapons || []).reduce((a, id) => a + wp(id), 0);
  v += (t.teamWeapons || []).reduce((a, id) => a + wp(id), 0);
  v += (t.leaderWeapons || []).reduce((a, id) => a + wp(id), 0);
  if (lead && !(t.leaderWeapons || []).length) v += (t.weapons || []).reduce((a, id) => a + wp(id), 0);
  const rules = (t.rules || []).join(' ').toLowerCase();
  if (t.troop === 'individual' && book == null) v += k.individual;
  if (/\bhero\b/.test(rules)) v += k.hero;
  if (/\bleader\b/.test(rules) && t.troop === 'individual') v += k.leader;
  return { v:Math.round(v), est:estUsed ? rulesFlag('points') !== 'verified' : rulesFlag('profileCosts') === 'placeholder' };
}

