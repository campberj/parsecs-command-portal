// Builds packs/blkout-pack.json — BLKOUT (Enemy Spotted Studios, 2nd Ed.) forces for Parsecs Command.
//
//   node tools/build-blkout-pack.mjs
//
// Source: the BLKOUT unit cards in the Steel Lions project (Harlow, Manticor, UN, Duster Update,
// Wetwork handlers), the Print-at-Home rulebook and the March 2026 Supplemental. Task Force Boone
// card fronts are image-only in the project files, so their numbers come from the May 11 conversion
// (read from the card images), confirmed by RJ on 27 Oct 2026.
//
// Conversion follows the locked BLKOUT rules decisions:
//   Skill tier -> Reaction / Combat / Toughness / Savvy / Training (table SK below)
//   Movement   -> Speed (inches, book scale)
//   Armor X/Y  -> KP = X (+1 for a Damage Track), save from Y (table SAVE)
//   Dusters    -> vehicles, KP 6 Chassis with a separate 3-box Mobility track
// Points use the portal's Army Builder formula; vehicles and Dusters are hand-set (flagged).
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'BLKOUT 2nd Ed. (Enemy Spotted Studios), converted for 5P:T';

/* ---------- the locked conversion tables ---------- */
const SK = { // BLKOUT Skill -> 5P:T (approved May 2026)
  4: { re:3, cs:3, t:5, sv:2, tr:3 },   // Epic / legendary operator
  5: { re:3, cs:3, t:5, sv:2, tr:2 },   // Tier 1 (Delta)
  6: { re:2, cs:2, t:4, sv:1, tr:1 },   // Tier 2 (Rangers / SOF)
  7: { re:1, cs:1, t:3, sv:0, tr:1 },   // Trained soldier
  8: { re:1, cs:0, t:3, sv:-1, tr:0 },  // Militia / conscript
};
const SAVE = { 2:'2+', 3:'2+', 4:'3+', 5:'4+', 6:'5+', 7:'5+', 8:'—' };
/** profile from a card: skill, move, armor "X/Y"; o.ai = chassis Toughness for inorganics, o.track = has a Damage Track */
function prof(skill, move, armor, o = {}){
  const [x, y] = armor.split('/').map(Number); const s = SK[skill];
  const p = { sp:move, re:s.re, cs:s.cs, t:s.t, kp:x + (o.track ? 1 : 0), sv:s.sv, tr:s.tr, save:SAVE[y] };
  if (o.ai) Object.assign(p, { t:o.ai, sv:0, tr:0 });
  return Object.assign(p, o.set || {});
}

/* ---------- weapons ---------- */
const weapons = [];
const W = (id, name, base, range, shots, dmg, traits, pts, cat) => { weapons.push({ id:'w-blk-' + id, name, base, range, shots, dmg:String(dmg), traits, pts, cat }); return 'w-blk-' + id; };
// Card weapons. BLKOUT shots come from the Skill Check, so every weapon starts at 1 shot;
// Cyclic and Heavy each add a shot, and Deployed becomes the book Heavy trait.
// BLKOUT Damage 1/2/3/4 -> 5P:T Damage 0/1/2/3. AP 2+ also gets book Piercing.
const w = {
  fal32c:  W('fal32c', 'FAL-32C', 'Military rifle', 24, 1, 0, ['CQB'], 4, 'Rifle'),
  fal32d:  W('fal32d', 'FAL-32D (Springbok)', 'Military rifle', 24, 1, 0, ['CQB', 'Sustained 1'], 5, 'Rifle'),
  carbine: W('carbine', 'Carbine', 'Military rifle (short)', 18, 1, 0, ['CQB'], 3, 'Rifle'),
  m7:      W('m7', 'M7 carbine', 'Military rifle (short)', 18, 1, 0, ['CQB'], 3, 'Rifle'),
  akmz:    W('akmz', 'AKMZ-2', 'Military rifle', 24, 1, 0, ['Medium'], 4, 'Rifle'),
  smart:   W('smart-rifle', 'Smart rifle', 'Military rifle', 24, 1, 0, ['Medium'], 4, 'Rifle'),
  rifle:   W('rifle', 'Service rifle', 'Military rifle', 24, 1, 0, [], 3, 'Rifle'),
  fpr:     W('fpr', 'FPR Auto (Golem)', 'Military rifle', 24, 1, 0, ['Sustained 1'], 4, 'Rifle'),
  hrifle:  W('heavy-rifle-mbg', 'Heavy rifle (Ubiytsa)', 'Shotgun', 12, 1, 1, ['AP 3', 'Piercing'], 4, 'Rifle'),
  smg:     W('smg', 'SMG', 'Military rifle (short)', 12, 1, 0, ['CQB'], 2, 'Rifle'),
  tfbrifle:W('heavy-rifle-tfb', 'Heavy rifle (Boone)', 'Military rifle', 24, 1, 0, ['AP 1'], 4, 'Rifle'),
  pdw:     W('pdw', 'PDW', 'Service pistol', 8, 1, 0, ['Pistol'], 1, 'Sidearm'),
  pistol:  W('pistol', 'Combat pistol', 'Service pistol', 10, 1, 0, ['Pistol'], 1, 'Sidearm'),
  harifle: W('handler-ar', 'Assault rifle (Handler)', 'Military rifle', 24, 2, 0, ['Heavy'], 6, 'Rifle'),
  fragdisp:W('frag-dispenser', 'Frag dispenser', 'Military rifle (short)', 18, 1, 0, ['CQB'], 3, 'Rifle'),
  // team weapons
  p34:     W('p34', 'P34 machine gun', 'Light machine gun', 24, 3, 0, ['Heavy', 'Team'], 10, 'Team'),
  syy1:    W('syy1', 'SYY-1 machine gun', 'Light machine gun', 24, 3, 0, ['Heavy', 'Team'], 10, 'Team'),
  lmg:     W('lmg', 'LMG', 'Light machine gun', 32, 3, 0, ['Heavy', 'Team'], 10, 'Team'),
  clmg:    W('compact-lmg', 'Compact LMG', 'Light machine gun', 24, 2, 0, ['CQB', 'Team'], 8, 'Team'),
  gl:      W('gl', 'Grenade launcher', 'Grenade launcher (frag)', 24, 1, 1, ['Area', 'Heavy', 'Team'], 10, 'Team'),
  hmgmbg:  W('hmg-mbg', 'HMG (Bratva)', 'Light machine gun', 24, 3, 1, ['Heavy', 'Sustained 2', 'Minimum Range 4"', 'Team'], 12, 'Team'),
  at:      W('at-launcher', 'AT launcher', 'Fury rifle', 32, 1, 2, ['AP 2', 'Piercing', 'Area', 'Heavy', 'Minimum Range 8"', 'Team'], 14, 'Team'),
  amr:     W('amr', 'Anti-material rifle', 'Sniper rifle', 32, 1, '1 (x2)', ['AP 2', 'Piercing', 'Heavy', 'Sniping', 'Team'], 10, 'Team'),
  screech: W('screecher', 'Screecher', 'Plasma rifle', 18, 1, 1, ['Seeking', 'Team'], 7, 'Team'),
  // melee
  machete: W('machetes', 'Machetes', 'Blade', 0, 0, 0, ['Melee', 'AP 1'], 1, 'Melee'),
  axe:     W('boarding-axe', 'Boarding axe', 'Ripper sword', 0, 0, 0, ['Melee', 'AP 3', 'Piercing'], 2, 'Melee'),
  elite:   W('elite-melee', 'Elite melee weapons', 'Ripper sword', 0, 0, 0, ['Melee', 'AP 2', 'Piercing', 'Cyclic (2 attacks)'], 3, 'Melee'),
  selfd:   W('self-destruct', 'Self-destruct charge', 'Contact charge', 4, 1, 3, ['AP 4', 'Piercing', 'Area', 'Single Use (destroys the drone)'], 2, 'Melee'),
  // grenades
  microg:  W('micro-grenades', 'Micro grenades', 'Frag grenade', 6, 1, 0, ['Area'], 1, 'Grenade'),
  microg8: W('micro-grenades-h', 'Micro grenades (Handler)', 'Frag grenade', 8, 2, 0, ['Area'], 2, 'Grenade'),
  pulse:   W('pulse-grenades', 'Pulse grenades', 'Frag grenade', 6, 1, 0, ['Area', 'EMP'], 1, 'Grenade'),
  displ:   W('disposable-launcher', 'Disposable launcher', 'Fury rifle (single use)', 24, 1, 2, ['Area', 'Single Use', 'Minimum Range 8"'], 4, 'Grenade'),
  // named Handlers' signature weapons (May 12 conversion, re-scaled)
  verdict: W('verdict', 'Custom FAL-32C "Verdict"', 'Military rifle', 24, 1, 1, ['CQB', 'Medium', 'AP 1'], 7, 'Rifle'),
  genesis: W('genesis', 'Custom sidearm "Genesis"', 'Blast pistol', 10, 1, 1, ['Pistol', 'Snap Shot', 'AP 1'], 3, 'Sidearm'),
  denicr:  W('denic-rifle', 'Service rifle (custom)', 'Military rifle', 24, 1, 1, ['Medium'], 5, 'Rifle'),
  okocarb: W('okofor-carbine', 'Boone tactical carbine', 'Military rifle', 24, 1, 1, ['CQB', 'Snap Shot'], 6, 'Rifle'),
  slug:    W('slug-thrower', 'Heavy slug thrower', 'Military rifle (heavy)', 16, 2, 1, ['CQB', 'AP 1'], 6, 'Rifle'),
  maul:    W('maul', 'Power maul "Judgement"', 'Breaching axe', 0, 0, 3, ['Melee', 'AP 3', 'Piercing', 'Knock Back'], 5, 'Melee'),
  // vehicle weapons
  pmmiss:  W('pm-missiles', 'Missile system (Peacemaker)', 'Fury rifle', 32, 1, 1, ['AP 2', 'Piercing', 'Area', 'Minimum Range 8"'], 8, 'Vehicle'),
  pmhmg:   W('pm-hmg', 'HMG (Peacemaker)', 'Heavy machine gun', 32, 2, 0, ['AP 2', 'Piercing', 'Auto 1', 'Minimum Range 6"'], 10, 'Vehicle'),
  rbatgm:  W('rb-atgm', 'ATGM (Razorback)', 'Fury rifle', 32, 1, 1, ['Area', 'Indirect', 'Minimum Range 6"'], 8, 'Vehicle'),
  rbgauss: W('rb-gauss', 'Gauss SAW (Razorback)', 'Heavy machine gun', 32, 2, 0, ['AP 2', 'Piercing', 'Auto 2'], 10, 'Vehicle'),
  dmmg:    W('duster-mmg', 'MMG (Duster)', 'Heavy machine gun', 32, 2, 0, ['AP 2', 'Piercing', 'Auto 2', 'CQB', 'Minimum Range 4"'], 12, 'Vehicle'),
  dsword:  W('duster-sword', 'Sword (Duster)', 'Duster close-combat arm', 6, 1, 1, ['Melee', 'AP 4', 'Piercing', 'Auto 2', 'CQB'], 8, 'Vehicle'),
  d30:     W('duster-30mm', '30mm autocannon (Duster)', 'Autocannon', 48, 1, 2, ['AP 4', 'Piercing', 'Auto 1', 'Heavy', 'Minimum Range 12"'], 15, 'Vehicle'),
  daxe:    W('duster-axe', 'Axe (Duster)', 'Duster close-combat arm', 4, 1, 1, ['Melee', 'AP 4', 'Piercing', 'Auto 2', 'CQB'], 8, 'Vehicle'),
  dhmg:    W('duster-hmg', 'HMG (Aveles)', 'Heavy machine gun', 32, 2, 1, ['AP 4', 'Piercing', 'Auto 2', 'CQB', 'Minimum Range 8"'], 14, 'Vehicle'),
  dfist:   W('duster-fist', 'Fist (Duster)', 'Duster close-combat arm', 2, 1, 0, ['Melee', 'AP 4', 'Piercing', 'Auto 1', 'CQB'], 5, 'Vehicle'),
};
// Armory items (Combat Loads) — one-use options listed for reference; not part of any unit's cost.
const ARM = ['Armory (Combat Load)'];
W('arm-head', 'HEAD launcher (Harlow armory)', 'Fury rifle', 16, 1, 3, ['Area', 'Piercing', ...ARM], 0, 'Grenade');
W('arm-microl', 'Micro launcher (armory)', 'Grenade launcher (frag)', 16, 2, 1, ['Area', 'Heavy', 'Minimum Range 4"', ...ARM], 0, 'Grenade');
W('arm-fragl', 'Frag launcher (Harlow armory)', 'Military rifle', 24, 1, 0, ['Sustained 2', 'Medium', ...ARM], 0, 'Grenade');
W('arm-rpg33', 'RPG33 (Manticor armory)', 'Fury rifle', 16, 1, 3, ['Area', 'Piercing', ...ARM], 0, 'Grenade');
W('arm-airburst', 'Air burst rifle (Manticor armory)', 'Military rifle', 24, 1, 0, ['Seeking', ...ARM], 0, 'Grenade');
W('arm-thermite', 'Thermite launcher (Manticor armory)', 'Flame projector', 8, 1, 0, ['Sustained 6', 'Single Use', ...ARM], 0, 'Grenade');
W('arm-strip', 'Strip grenades (Manticor armory)', 'Frag grenade', 6, 2, 0, ['Area (2")', ...ARM], 0, 'Grenade');
W('arm-surge', 'Surge (RFA armory)', 'Shock emitter', 16, 1, 1, ['EMP', ...ARM], 0, 'Grenade');
W('arm-lance', 'Lance (RFA armory)', 'Fusion rifle (light)', 12, 1, 0, ['AP 3', 'Piercing', ...ARM], 0, 'Grenade');
W('arm-shotgun', 'Shotgun (UN 3rd Bn armory)', 'Shotgun', 8, 1, 0, ['AP 3', 'Piercing', 'CQB', ...ARM], 0, 'Grenade');
W('arm-chasers', 'Corner chasers (UN 3rd Bn armory)', 'Seeker munitions', 16, 1, 0, ['CQB', 'Indirect', ...ARM], 0, 'Grenade');
W('arm-microwave', 'Microwave gun (UN 3rd Bn armory)', 'Shock emitter', 8, 1, 0, ['EMP', ...ARM], 0, 'Grenade');
W('arm-tracking', 'Tracking bombs (Boone armory)', 'Seeker munitions', 16, 1, 0, ['AP 2', 'Piercing', 'Indirect', ...ARM], 0, 'Grenade');
W('arm-tow', 'TOW (Duster armory)', 'Fury rifle', 32, 1, 2, ['AP 2', 'Piercing', 'Minimum Range 8"', ...ARM], 0, 'Vehicle');
W('arm-cluster', 'Cluster munitions (Duster armory)', 'Grenade launcher (frag)', 32, 1, 0, ['Area (4")', 'Minimum Range 8"', ...ARM], 0, 'Vehicle');

/* ---------- unit templates ---------- */
const templates = [];
function T(fac, key, o){
  const t = { id:`t-blk-${fac.short}-${key}`, name:o.name, side:fac.side, faction:fac.id, troop:o.troop, size:o.size || 1, level:o.level || '',
    profile:o.profile, leader:o.leader || null, weapons:o.weapons || [], teamWeapons:o.team || [], leaderWeapons:o.lw || [],
    rules:o.rules || [], pointsMode:o.points ? 'manual' : 'auto', points:o.points || 0, priceAs:'', source:SRC };
  if (o.notes) t.notes = o.notes;
  templates.push(t); return t.id;
}
const twoCards = n => `BLKOUT card fields ${n}; the portal's squad minimum is 4, so this squad is two cards.`;
const threeCard = 'BLKOUT card fields 3; the portal\'s squad minimum is 4 — field the fourth or leave the slot empty.';
const teamOf3 = n => `BLKOUT card fields ${n}; portal weapon teams are a crew of 3.`;
const BOONE_FLAG = 'Skill, Move, Armor and weapons from the May 11 conversion (read from the card images; confirmed by RJ, 27 Oct 2026).';

/* ---------- factions (alignment blocs) ---------- */
const AUTH = { id:'f-blk-authority', short:'auth', side:'enemy' };
const MBG = { id:'f-blk-manticor', short:'mbg', side:'enemy' };
const TFB = { id:'f-blk-boone', short:'tfb', side:'player' };

/* The Authority — Harlow 1st Reaction Force */
const harlow = {
  control: T(AUTH, 'harlow-control', { name:'Harlow Control Team', troop:'team', size:3, profile:prof(6, 4, '1/6'), weapons:[w.fal32c], team:[w.gl],
    rules:['Harlow 1st Reaction Force', 'Controller', 'Data Spike (Specialist 1)'], notes:'Card: Skill 6, Move 4, Armor 1/6, 1 Grunt + Data Spike and Grenade Launcher specialists.' }),
  assault: T(AUTH, 'harlow-assault', { name:'Harlow Assault Team', troop:'squad', size:4, profile:prof(6, 4, '1/6'), leader:prof(6, 4, '1/6'), weapons:[w.fal32c], team:[w.p34],
    rules:['Harlow 1st Reaction Force', 'Team Leader'], notes:'Card: Skill 6, Move 4, Armor 1/6, 2 Grunts + Machine Gunner and Team Leader specialists.' }),
  springbok: T(AUTH, 'harlow-springbok', { name:'Harlow Springbok AI (2 cards)', troop:'squad', size:4, profile:prof(6, 6, '2/6', { ai:4 }), weapons:[w.fal32d],
    rules:['Harlow 1st Reaction Force', 'AI', 'Chaff Discharge'], notes:'Card: Skill 6, Move 6, Armor 2/6, 2 Grunts. ' + twoCards(2) + ' Combat inorganics: no leader.' }),
  crikets: T(AUTH, 'harlow-crikets', { name:'Harlow Crikets (2 cards)', troop:'squad', size:4, profile:prof(7, 6, '1/8', { ai:3 }), weapons:[w.selfd],
    rules:['Harlow 1st Reaction Force', 'AI', 'Drone', 'Self-destruct: remove the drone after it attacks; it gives no VP'], notes:'Card: Skill 7, Move 6, Armor 1/8 (no save), 2 Grunts. ' + twoCards(2) + ' Does not count toward the unit limit when grouped with Harlow Engineers.' }),
  engineers: T(AUTH, 'harlow-engineers', { name:'Harlow Engineers', troop:'team', size:3, profile:prof(6, 4, '1/6'), weapons:[w.carbine], team:[w.at],
    rules:['Harlow 1st Reaction Force', 'Engineer (Specialist 1)'], notes:'Card: Skill 6, Move 4, Armor 1/6, 1 Grunt + Engineer specialist. ' + teamOf3(2) }),
  veterans: T(AUTH, 'harlow-veterans', { name:'Harlow Veterans', troop:'squad', size:4, profile:prof(5, 6, '1/6'), leader:prof(5, 6, '1/6'), weapons:[w.carbine, w.machete, w.pulse],
    rules:['Harlow 1st Reaction Force', 'Jump (4)', 'Low Tech'], notes:'Card: Skill 5, Move 6, Armor 1/6, 3 Grunts. ' + threeCard }),
};
/* The Authority — UN 3rd Battalion */
const un3 = {
  pointmen: T(AUTH, 'un3-pointmen', { name:'UN Pointmen', troop:'team', size:3, profile:prof(6, 4, '3/6', { ai:5 }), weapons:[w.smart], team:[w.lmg],
    rules:['UN 3rd Battalion', 'AI', 'Shield'], notes:'Card: Skill 6, Move 4, Armor 3/6, 1 Grunt + SAW Gunner specialist. ' + teamOf3(2) }),
  peacemaker: T(AUTH, 'un3-peacemaker', { name:'UN Peacemaker', troop:'vehicle', profile:prof(6, 4, '3/6', { ai:5, track:true }), weapons:[w.pmmiss, w.pmhmg],
    rules:['UN 3rd Battalion', 'AI', 'Drone', 'Damage Track', 'Jammer (12")', 'One weapon per Shoot action'], points:60,
    notes:'Card: Skill 6, Move 4, Armor 3/6, 1 model (Supplemental errata). Hand-priced: the Army Builder formula does not cover vehicles.' }),
  reserve: T(AUTH, 'un3-reserve', { name:'UN Reserve Fireteam', troop:'squad', size:4, profile:prof(7, 4, '1/5'), leader:prof(7, 4, '1/5'), weapons:[w.rifle, w.microg], team:[w.at],
    rules:['UN 3rd Battalion', 'Data Spike (Specialist 1)'], notes:'Card: Skill 7, Move 4, Armor 1/5, 2 Grunts + Data Specialist and AT Specialist. The leader is the Data Specialist.' }),
};
/* The Authority — UN Raid Force Alpha */
const rfa = {
  assaulters: T(AUTH, 'rfa-assaulters', { name:'UTG Assaulters', troop:'team', size:3, profile:prof(5, 6, '1/5'), weapons:[w.m7], team:[w.gl],
    rules:['UN Raid Force Alpha', 'Augmented', 'Jump (4)'], notes:'Card: Skill 5, Move 6, Armor 1/5, 1 Grunt + Grenadier. ' + teamOf3(2) }),
  specialists: T(AUTH, 'rfa-specialists', { name:'UTG Specialists', troop:'team', size:3, profile:prof(5, 6, '1/5'), weapons:[w.m7], team:[w.amr],
    rules:['UN Raid Force Alpha', 'Augmented', 'Jump (4)'], notes:'Card: Skill 5, Move 6, Armor 1/5, 1 Grunt + Marksman. ' + teamOf3(2) + ' Augmented does not apply to the Marksman if she moved (Supplemental FAQ).' }),
  golems: T(AUTH, 'rfa-golems', { name:'Golem Unit', troop:'team', size:3, profile:prof(5, 4, '3/5', { ai:5 }), weapons:[w.fpr], team:[w.screech],
    rules:['UN Raid Force Alpha', 'AI', 'Jump (4)'], notes:'Card: Skill 5, Move 4, Armor 3/5, 1 Grunt + Fire Support. ' + teamOf3(2) + ' Skill 5 confirmed by RJ (27 Oct 2026).' }),
};
/* The Authority — UN Forces (general) */
const unf = {
  batcon: T(AUTH, 'unf-batcon', { name:'UN Batcon', troop:'individual', level:'minor', profile:prof(5, 4, '1/5'), weapons:[w.smart, w.microg],
    rules:['UN Forces', 'Controller', 'Jump (4)', 'Comms Bot: AI drone companion (Armor 3/5, Data Spike)'], notes:'Card: Skill 5, Move 4, Armor 1/5, 1 Grunt + Comms Bot (AI, Data Spike, Armor 3/5). The Comms Bot is a marker that moves with the Batcon and is removed after 3 hits.' }),
  mothers: T(AUTH, 'unf-mothers', { name:'UTG Mothers (2 cards)', troop:'squad', size:4, profile:prof(4, 6, '2/5'), leader:prof(4, 6, '2/5'), weapons:[w.elite, w.pdw],
    rules:['UN Forces', 'Jump (4)'], notes:'Card: Skill 4, Move 6, Armor 2/5, 2 Grunts. ' + twoCards(2) }),
  raid: T(AUTH, 'unf-raid', { name:'UN Raid Team', troop:'squad', size:4, profile:prof(5, 6, '1/5'), leader:prof(5, 6, '1/5'), weapons:[w.carbine, w.microg],
    rules:['UN Forces', 'Jump (4)'], notes:'Card: Skill 5, Move 6, Armor 1/5, 3 Grunts. ' + threeCard }),
};

/* Manticor Borz Group */
const mbg = {
  bratva: T(MBG, 'bratva', { name:'Manticor Bratva Team', troop:'squad', size:4, profile:prof(6, 4, '1/4'), leader:prof(6, 4, '1/4'), weapons:[w.akmz], team:[w.hmgmbg],
    rules:['Manticor Borz Group', 'Shield', 'Data Spike (Specialist 1)', 'Pack Initiative: with 2+ models on the table, roll an extra die for Initiative and keep the best'], notes:'Card: Skill 6, Move 4, Armor 1/4, 2 Grunts + Data Spike and HMG specialists.' }),
  cyka: T(MBG, 'cyka', { name:'Manticor Cyka Team', troop:'individual', level:'minor', profile:prof(6, 4, '2/4', { track:true }), weapons:[w.gl, w.syy1],
    rules:['Manticor Borz Group', 'Powered', 'Damage Track', 'One weapon per Shoot action'], notes:'Card: Skill 6, Move 4, Armor 2/4, 1 model with a Damage Track. Card front lists the Grenade Launcher and SYY-1.' }),
  insertion: T(MBG, 'insertion', { name:'Manticor Insertion Team', troop:'squad', size:4, profile:prof(6, 4, '1/4'), leader:prof(6, 4, '1/4'), weapons:[w.akmz], team:[w.syy1],
    rules:['Manticor Borz Group', 'Sidewinder (Specialist 2): limited uses — as its action, a Training test pins a unit within 12"'], notes:'Card: Skill 6, Move 4, Armor 1/4, 2 Grunts + Machine Gunner and Sidewinder. The leader is the Sidewinder; mark the card\'s use boxes.' }),
  bravo: T(MBG, 'cyka-bravo', { name:'Manticor Cyka Bravo (2 cards)', troop:'squad', size:4, profile:prof(6, 4, '2/4'), leader:prof(6, 4, '2/4'), weapons:[w.smg, w.axe],
    rules:['Manticor Borz Group', 'Powered'], notes:'Card: Skill 6, Move 4, Armor 2/4, 2 Grunts. ' + twoCards(2) }),
  ubcontrol: T(MBG, 'ubiytsa-control', { name:'Ubiytsa Controller', troop:'individual', level:'minor', profile:prof(6, 6, '1/6'), weapons:[w.hrifle, w.axe],
    rules:['Manticor Borz Group', 'Controller', 'Low Tech'], notes:'Card: Ubiytsa Control Team, Skill 6, Move 6, Armor 1/6, 1 Grunt + Controller. The Grunt fights with an Ubiytsa squad; the Controller is this figure.' }),
  ubiytsa: T(MBG, 'ubiytsa', { name:'Manticor Ubiytsa', troop:'squad', size:4, profile:prof(6, 6, '1/6'), leader:prof(6, 6, '1/6'), weapons:[w.hrifle, w.axe],
    rules:['Manticor Borz Group', 'Low Tech'], notes:'Card: Skill 6, Move 6, Armor 1/6, 3 Grunts. Manticor\'s close-combat troops. ' + threeCard }),
};

/* Task Force Boone */
const tfb = {
  recon: T(TFB, 'recon', { name:'Boone Recon Team', troop:'squad', size:4, profile:prof(6, 4, '1/6'), leader:prof(6, 4, '1/6'), weapons:[w.tfbrifle], team:[w.lmg],
    rules:['Task Force Boone', 'Team Leader'], notes:'2 Grunts + Team Leader and SAW Gunner (card back). ' + BOONE_FLAG }),
  vat: T(TFB, 'vat', { name:'Boone VAT Element', troop:'team', size:3, profile:prof(6, 6, '1/6'), weapons:[w.carbine], team:[w.clmg],
    rules:['Task Force Boone', 'Jump (4)', 'Data Specialist (Specialist 1): Jammer (12") and Data Knife (6")'], notes:'1 Grunt + Data Specialist and SAW Gunner (card back). ' + BOONE_FLAG }),
  razorback: T(TFB, 'razorback', { name:'Boone Razorback', troop:'vehicle', profile:prof(4, 4, '3/4', { ai:5, track:true }), weapons:[w.rbgauss, w.rbatgm],
    rules:['Task Force Boone', 'AI', 'Drone', 'Damage Track', 'One weapon per Shoot action'], points:65,
    notes:'1 model (Supplemental errata). Hand-priced: the Army Builder formula does not cover vehicles. ' + BOONE_FLAG }),
};

/* Handlers (Wetwork cards) and Dusters (Duster Update cards): fielded by every bloc */
function handlers(fac){
  return {
    assault: T(fac, 'handler-assault', { name:'Assault Handler', troop:'individual', level:'major', profile:prof(5, 6, '2/5', { track:true }), weapons:[w.harifle, w.displ],
      rules:['Handler', 'Damage Track', 'Exploding Rounds: the assault rifle gains +1 Damage during its activation', 'Jump (4)'], notes:'Card: Skill 5, Move 6, Armor 2/5.' }),
    covert: T(fac, 'handler-covert', { name:'Covert Handler', troop:'individual', level:'major', profile:prof(5, 6, '2/6', { track:true }), weapons:[w.carbine, w.microg8],
      rules:['Handler', 'Damage Track', 'Ghost: may be placed within 2" of its position before it activates', 'Jump (6)'], notes:'Card: Skill 5, Move 6, Armor 2/6.' }),
    siege: T(fac, 'handler-siege', { name:'Siege Handler', troop:'individual', level:'major', profile:prof(5, 4, '2/4', { track:true }), weapons:[w.lmg, w.fragdisp],
      rules:['Handler', 'Damage Track', 'Gun Shield: in an activation in which it fired, its save improves to 2+', 'Jump (2)'], notes:'Card: Skill 5, Move 4, Armor 2/4. LMG carried as a personal weapon.' }),
  };
}
function dusters(fac){
  const d = (key, name, move, armor, ws, pts, extra, note) => T(fac, 'duster-' + key, { name:'Duster — ' + name, troop:'vehicle', profile:prof(5, move, armor, { ai:6, set:{ kp:6, sv:0, tr:0 } }), weapons:ws,
    rules:['Duster', 'Mobility 3', 'Weak Points (rear arc)', 'Fight!', 'One weapon per Shoot action', ...extra], points:pts, notes:`Card: Skill 5, Move ${move}, Armor ${armor}, Chassis 6, Mobility 3. ${note} Hand-priced against the book's vehicles.` });
  return {
    caber: d('caber', 'Caber', 12, '3/4', [w.dmmg, w.dsword], 110, ['Jump (8)'], 'Fast assault frame.'),
    topor: d('topor', 'Topor', 8, '3/2', [w.d30, w.dmmg], 130, [], 'Heavy gun frame.'),
    mattis: d('mattis', 'Mattis', 8, '3/2', [w.d30, w.daxe], 130, ['Jump (4)'], 'Gun and close-combat frame.'),
    aveles: d('aveles', 'Aveles', 10, '3/3', [w.dhmg, w.dfist], 120, ['Jump (8)'], 'Mobile fire-support frame.'),
  };
}
const hAuth = handlers(AUTH), hMbg = handlers(MBG), hTfb = handlers(TFB);
const dAuth = dusters(AUTH), dMbg = dusters(MBG), dTfb = dusters(TFB);

/* Named Handlers — the May 12 characters, re-statted on the locked schema (Skill 4 = epic) */
const named = {
  voss: T(AUTH, 'voss', { name:'Capt. Elara Voss "Widow Maker"', troop:'individual', level:'epic', profile:prof(4, 6, '2/6', { track:true }), weapons:[w.verdict, w.pistol],
    rules:['Handler', 'Leader', 'Hero', 'Controller', 'Ice Queen: friendly Harlow figures within 8" are immune to Fear and gain +1 Training; Voss never tests Morale', 'Marked for Death: before deployment name one enemy figure; +1 to Hit and +1 Damage against it'],
    notes:'Harlow 1st Reaction Force. Named Handler from the May 12 conversion, Skill 4.' }),
  denic: T(AUTH, 'denic', { name:'Maj. Pavel Denic "The Gray Man"', troop:'individual', level:'epic', profile:prof(5, 5, '2/6', { track:true }), weapons:[w.denicr, w.pistol],
    rules:['Handler', 'Leader', 'Hero', 'Defensive Doctrine: friendly UN figures within 6" improve their save by 1 while in cover', 'Reluctant Enemy: if his force breaks, the survivors offer a ceasefire instead of routing'],
    notes:'UN 3rd Battalion. Named Handler from the May 12 conversion, Skill 5.' }),
  stahl: T(AUTH, 'stahl', { name:'Col. Maren Stahl "Prometheus"', troop:'individual', level:'epic', profile:prof(4, 6, '2/6', { track:true, set:{ sv:3 } }), weapons:[w.genesis],
    rules:['Handler', 'Leader', 'Hero', 'Data Spike', 'Mother of the Program: friendly UTG figures within 12" gain +1 Training and are immune to Fear', 'Golem Override: may activate up to 2 friendly Golems within 12" during her activation (one action each)', 'Data Warfare Suite: +2 to Data Attack tests'],
    notes:'UN Raid Force Alpha. Named Handler from the May 12 conversion, Skill 4. Genetic Authority (post-battle booster) is a campaign rule; apply it in the post-battle wizard notes.' }),
  dragic: T(MBG, 'dragic', { name:'Kova "The Furnace" Dragić', troop:'individual', level:'epic', profile:prof(4, 6, '3/4', { track:true, set:{ t:6 } }), weapons:[w.slug, w.maul],
    rules:['Handler', 'Leader', 'Hero', 'Powered', 'Broken Killswitch: immune to Data Attacks, EMP and anything that controls or shuts down Powered figures', 'Warleader: friendly Manticor figures within 8" gain +1 in Brawls and are Fearless', 'Unstoppable: once per round, ignore a lost KP on a D6 roll of 5+'],
    notes:'Manticor Borz Group. Named Handler from the May 12 conversion: an early Ubiytsa prototype in powered armor, Skill 4, Toughness 6.' }),
  okofor: T(TFB, 'okofor', { name:'LtCdr Naia Okofor "Ghost Six"', troop:'individual', level:'epic', profile:prof(4, 6, '2/6', { track:true }), weapons:[w.okocarb],
    rules:['Handler', 'Leader', 'Hero', 'Data Knife (6")', 'Small Unit Tactics Master: once per battle, every friendly Boone figure within 8" moves and fires in sequence', 'Manned-Unmanned Teaming: may activate one friendly AI or Drone within 12" as part of her activation'],
    notes:'Task Force Boone. Named Handler from the May 12 conversion, Skill 4.' }),
};

/* ---------- faction rules (kept short: they print on the battle-pack reference card) ---------- */
const COMMON = [
  { name:'BLKOUT conversion', text:'Card Skill sets Reaction, Combat, Toughness, Savvy and Training (Skill 4 epic, 5 Tier 1, 6 Tier 2, 7 trained, 8 militia); KP = armor dice, +1 for a Damage Track; save from the armor number. Skirmish Mode: no cohesion. Casualties use the DUSTLINE Trauma Clock.' },
  { name:'Control Points', text:'Each side starts the battle with 3 CP (never regained). Spend 1 to: use a Battle Drill on a unit\'s activation; reactivate a Handler once per round; or activate a second unit straight after the first.' },
  { name:'Armory and Combat Loads', text:'A rank-and-file figure may mark one of its unit\'s Combat Loads to use one Armory item from its force card for that activation (one Armory weapon per activation).' },
  { name:'Data warfare', text:'Data Spike: action, Savvy test — pin an enemy unit or remove a pin from a friendly unit (no line of sight needed). Data Knife: action, Savvy test — 1 hit with no save on an AI or Powered figure in range. Jammer: friendly figures in range ignore Pinned. Counter-EWar: a Data Spike figure may oppose an enemy Data Attack with its own test.' },
  { name:'BLKOUT weapon traits', text:'CQB: re-roll misses within half range. Medium: re-roll one miss per attack. Sustained X: the target re-rolls up to X successful saves. Seeking: ignores the cover penalty. Auto X: after firing, X extra shots at other figures within 4" of the target. AP X: the target\'s save is X worse. EMP: only harms AI figures, no save. Armory items are one use per Combat Load.' },
  { name:'BLKOUT unit traits', text:'AI: affected by EMP and anti-AI rules. Drone: cannot Brawl, climb or lean out. Powered: affected by Data Knife. Low Tech: cannot be pinned by Data Attacks or targeted by Indirect fire. Shield: this figure and one friend in contact count as in cover. Jump (X): move X" in any direction over terrain. Controller: after this unit activates, activate another for free. Team Leader: may pass its Ready status to a figure that has already acted. Damage Track: shown as +1 KP.' },
  { name:'Handlers', text:'Elite single figures. Once per round, spend 1 CP to let a Handler activate again after it finishes.' },
  { name:'Dusters', text:'Walkers that turn freely. Mobility 3: a shooter who can see the whole base may target Mobility instead of Chassis at −1 to Hit; 3 Mobility hits wreck it. +1 Damage from the rear arc. Fight!: may Brawl other Dusters. May Juke. Never Suppressed. Fire one weapon per Shoot action.' },
];
const R = (name, text) => ({ name, text });
const factions = [
  { id:AUTH.id, name:'The Authority (BLKOUT)', side:'enemy', personality:'Methodical', source:SRC,
    slots:{ infantry:un3.reserve, recon:unf.raid, storm:harlow.assault, weaponsTeam:un3.pointmen, majorChar:hAuth.assault, epicChar:named.voss, sniper:rfa.specialists, transport:'', armoredCar:un3.peacemaker, lightTank:dAuth.caber, tank:dAuth.topor, heavyTank:dAuth.mattis },
    notes:'ABOL\'s state power and its contractors, as one alignment bloc: Harlow 1st Reaction Force (Harlow Kinetic Solutions), UN 3rd Battalion, UN Raid Force Alpha and general UN Forces. Hostile in the Steel Lions BLKOUT conversion. Built from the BLKOUT 2nd Ed. unit cards on the locked conversion schema; distances are BLKOUT inches used as book scale (turn on Independent Action to scale them with everyone else). Two-model BLKOUT units are listed as squads of two cards or weapon teams of 3 so they pass the Army Builder; each unit\'s notes give the card composition. Generic Handlers and the four Dusters are listed in every BLKOUT bloc. BLKOUT has no transport cards, so a rolled transport stays a generic APC line: use a vehicle of your own or skip it. Infantry points come from the Army Builder formula; vehicles and Dusters are hand-priced.',
    rules:[...COMMON,
      R('Harlow — force rule', '+2" when Dashing. Battle Drills: Assaulters (no Overwatch against its moves), Chaff (smoke within 6" before activating; clears on a D6 of 6), Stims (+2" Speed this activation). Armory: HEAD launcher, Micro launcher, Frag launcher, Boost Jump (Jump 4).'),
      R('UN 3rd Battalion — force rule', 'Infantry in base contact with another infantry figure re-roll misses with non-Armory weapons. Battle Drills: Arsenal (one Armory item without a Combat Load), Peel Back (2" move after activating), Switchback (smoke within 4" and a 2" move before activating; no Jump). Armory: Shotgun, Corner chasers, Microwave gun, Boost Jump (Jump 4).'),
      R('UN Raid Force Alpha — force rule', 'Augmented: UTG Assaulters and Specialists re-roll one failed die on every shooting attack, Brawl and test. Battle Drills: Close Assault (2" move into a Brawl after acting), Cross Fire (+1 Damage when 2+ figures shoot the same target), Switchback. Armory: Surge, Lance, Micro launcher, Boost Jump (Jump 6).'),
      R('UN Forces', 'Batcon, UTG Mothers and the Raid Team use the UN 3rd Battalion or Raid Force Alpha force card, whichever they are fielded with.'),
    ] },
  { id:MBG.id, name:'Manticor Borz Group', side:'enemy', personality:'Aggressive', source:SRC,
    slots:{ infantry:mbg.bratva, recon:mbg.insertion, storm:mbg.ubiytsa, weaponsTeam:mbg.bratva, majorChar:hMbg.siege, epicChar:named.dragic, sniper:'', transport:'', armoredCar:dMbg.aveles, lightTank:dMbg.caber, tank:dMbg.topor, heavyTank:dMbg.mattis },
    notes:'Heavily armored Manticor shock troops and their Ubiytsa close-combat arm (the Chimera bloc in the Steel Lions BLKOUT conversion; hostile). Built from the BLKOUT 2nd Ed. unit cards on the locked conversion schema; book-scale distances. Each unit\'s notes give the card composition. No transport cards: a rolled transport stays a generic APC line. Infantry points come from the Army Builder formula; Dusters are hand-priced.',
    rules:[...COMMON,
      R('Manticor — force rule', 'Ignore the first point of damage from each Area attack. Battle Drills: Linked (a figure that Readies may pass it to one that has acted), Targeting Smoke (smoke within 6" that this unit ignores), Thorax Shields (re-roll one failed save per figure this activation). Armory: RPG33, Air burst rifle, Thermite launcher, Strip grenades.'),
    ] },
  { id:TFB.id, name:'Task Force Boone', side:'player', personality:'Raider', source:SRC,
    slots:{ infantry:tfb.recon, recon:tfb.recon, storm:tfb.vat, weaponsTeam:tfb.vat, majorChar:hTfb.covert, epicChar:named.okofor, sniper:'', transport:'', armoredCar:tfb.razorback, lightTank:dTfb.aveles, tank:dTfb.mattis, heavyTank:dTfb.topor },
    notes:'Martian expeditionary task force leading the Headless resistance on ABOL; allied in the Steel Lions BLKOUT conversion. Card fronts for Boone are image-only in the project files; Skill, Move, Armor and weapons come from the May 11 conversion (read from the card images) and were confirmed by RJ on 27 Oct 2026. Book-scale distances. No transport cards: a rolled transport stays a generic APC line. Infantry points come from the Army Builder formula; the Razorback and Dusters are hand-priced.',
    rules:[...COMMON,
      R('Task Force Boone — force rule', 'Once per round one non-AI infantry figure may make a Data Attack without a Data Spike. Battle Drills: Overwhelming Fire (Return Fire against this unit\'s Cyclic weapons rolls 1 die), Small Unit Tactics (up to half the unit fires instead of moving, then the rest move and act), Tactical Positioning (Overwatch against this unit is −1 to Hit). Armory: Pulse grenade, Disposable launcher, Tracking bombs, Smoke grenade (4").'),
    ] },
];

const pack = { kind:'pcp-bundle', v:1, app:'Parsecs Command 1.0.8', exported:new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z', from:'BLKOUT (Enemy Spotted Studios) — Steel Lions conversion', weapons, gear:[], templates, factions };
writeFileSync(join(root, 'packs', 'blkout-pack.json'), JSON.stringify(pack, null, 1) + '\n');
console.log(`blkout-pack.json: ${factions.length} factions, ${templates.length} units, ${weapons.length} weapons`);
