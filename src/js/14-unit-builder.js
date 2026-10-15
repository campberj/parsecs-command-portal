/* ---------- unit builder: legality (generalized Army Builder) and generator ---------- */
function legality(t){
  const issues = []; const add = (lvl, msg) => issues.push({ lvl, msg });
  const ws = (t.weapons || []).map(weaponOf).filter(Boolean), tw = (t.teamWeapons || []).map(weaponOf).filter(Boolean), lw = (t.leaderWeapons || []).map(weaponOf).filter(Boolean);
  const p = t.profile;
  if (!t.name || !t.name.trim()) add('err', 'Give the unit a name.');
  if (t.troop === 'squad'){
    if (t.size < 4 || t.size > 6) add('err', 'Squads run 4–6 figures.');
    if (!t.leader) add('wrn', 'Squads are led by a sergeant; add a leader profile.');
    if (tw.length > Math.max(1, Math.floor(t.size / 5))) add('err', `At most ${Math.max(1, Math.floor(t.size / 5))} team weapon(s) for ${t.size} figures.`);
    if ([...ws, ...tw, ...lw].some(w => ['Crewed','Vehicle'].includes(w.cat))) add('err', 'Squads cannot carry crewed or vehicle weapons.');
    if (!ws.some(w => ['Rifle','Sidearm','Melee'].includes(w.cat))) add('err', 'Rank-and-file need a rifle, sidearm or melee weapon.');
  }
  if (t.troop === 'team'){
    if (t.size !== 3) add('err', 'Weapon teams are a crew of 3.');
    if (tw.filter(w => ['Team','Crewed'].includes(w.cat)).length !== 1) add('err', 'A weapon team carries exactly one team or crewed weapon.');
  }
  if (t.troop === 'individual'){
    if (t.size !== 1) add('err', 'Individuals are a single figure.');
    if (!t.level) add('err', 'Pick a character level: minor, major or epic.');
    const main = ws.filter(w => !['Sidearm','Melee','Grenade'].includes(w.cat)); if (main.length > 2) add('err', 'Individuals carry at most 2 main weapons plus a sidearm or blade.');
  }
  if (t.troop === 'vehicle'){
    if (t.size !== 1) add('err', 'Vehicles are a single model.');
    if ([...ws, ...tw].some(w => !['Vehicle','Crewed','Team'].includes(w.cat))) add('wrn', 'Vehicle mounts usually take vehicle or crewed weapons.');
    if (p.kp < 3) add('wrn', 'Vehicles usually have 3 or more KP.');
  }
  const rng = (k, lo, hi, nm) => { if (p[k] < lo || p[k] > hi) add('wrn', `${nm} ${p[k]} is outside the published range (${lo} to ${hi}).`); };
  if (t.troop !== 'vehicle'){ rng('sp', 3, 8, 'Speed'); rng('re', 0, 5, 'Reaction'); rng('cs', -1, 3, 'Combat'); rng('t', 2, 7, 'Toughness'); rng('tr', -1, 3, 'Training'); rng('sv', -1, 3, 'Savvy'); }
  if (p.kp < 1) add('err', 'KP must be at least 1.');
  const freeform = S.mods.freeform;
  return issues.map(i => ({ ...i, lvl:freeform && i.lvl === 'err' ? 'wrn' : i.lvl }));
}
const QUALITY = {
  militia:{ name:'Militia', p:[4,1,0,3,1,0,0], save:'—' }, regular:{ name:'Regular', p:[4,2,1,4,1,0,1], save:'—' },
  veteran:{ name:'Veteran', p:[4,2,1,4,1,0,1], save:'6+' }, elite:{ name:'Elite', p:[4,3,2,4,1,0,2], save:'6+' }
};
const ROLES = { line:'Line infantry squad', assault:'Assault squad', recon:'Recon squad', support:'Fire support team', minor:'Minor character', major:'Major character', epic:'Epic character' };
function generateUnit(spec){
  const q = QUALITY[spec.quality] || QUALITY.regular; const [sp, re, cs, t, kp, sv, tr] = q.p;
  const P = (o) => ({ sp, re, cs, t, kp, sv, tr, save:q.save, ...o });
  const W = cat => S.armory.weapons.filter(w => w.cat === cat).sort((a, b) => a.pts - b.pts);
  const any = (cat, prefer) => { const l = W(cat); if (!l.length) return null; return prefer === 'best' ? l[l.length - 1] : prefer === 'cheap' ? l[0] : pick(l); };
  const role = spec.role; const budget = parseInt(spec.budget, 10) || 0;
  let u = { id:uid('t'), name:spec.name || `${q.name} ${ROLES[role].toLowerCase()}`, side:spec.side, faction:spec.faction, troop:'squad', size:5, level:'', profile:P({}), leader:P({ kp:2, re:re + (spec.quality === 'veteran' || spec.quality === 'elite' ? 1 : 0) }), weapons:[], teamWeapons:[], leaderWeapons:[], rules:['Generated'], pointsMode:'auto', points:0 };
  const idOf = w => w ? w.id : null;
  const rifle = any('Rifle', spec.quality === 'militia' ? 'cheap' : 'mid'), side_ = any('Sidearm', 'cheap'), melee = any('Melee', 'cheap'), gren = any('Grenade', 'cheap'), team = any('Team', 'mid');
  if (role === 'line'){ u.weapons = [idOf(rifle), idOf(gren)]; u.leaderWeapons = [idOf(side_), idOf(melee)]; if (team) u.teamWeapons = [idOf(team)]; }
  else if (role === 'assault'){ const sg = S.armory.weapons.find(w => /shotgun/i.test(w.base)) || rifle; u.weapons = [idOf(sg), idOf(side_), idOf(gren)]; u.leaderWeapons = [idOf(any('Melee', 'best')), idOf(side_)]; u.rules.push('Assault'); }
  else if (role === 'recon'){ u.size = 4; u.profile.sp += 1; u.leader.sp += 1; u.weapons = [idOf(rifle)]; const pr = S.armory.weapons.find(w => /precision|sniper|marksman/i.test(w.base + ' ' + w.name)); if (pr) u.teamWeapons = [pr.id]; u.rules.push('Scout armor'); }
  else if (role === 'support'){ u.troop = 'team'; u.size = 3; u.leader = null; u.weapons = [idOf(side_)]; u.teamWeapons = [idOf(any('Team', 'best'))]; u.rules.push('Crewed'); }
  else { u.troop = 'individual'; u.size = 1; u.leader = null; u.level = role;
    const up = { minor:{ re:re + 1, kp:2 }, major:{ re:re + 1, cs:cs + 1, kp:3, sv:sv + 1, tr:tr + 1 }, epic:{ re:re + 2, cs:cs + 2, kp:4, sv:sv + 1, tr:tr + 2 } }[role];
    u.profile = P(up); u.weapons = [idOf(side_), idOf(melee)]; u.rules = ['Generated', role === 'epic' ? 'Leader' : 'Leader'].concat(role === 'epic' ? ['Hero'] : []); }
  ['weapons','teamWeapons','leaderWeapons'].forEach(k => u[k] = (u[k] || []).filter(Boolean));
  /* fit to budget: step down, then up */
  if (budget > 0){
    /* search the legal loadouts for this role and keep the one closest to the budget */
    const rifles = W('Rifle'), teams = W('Team'), grens = W('Grenade'), cands = [];
    if (u.troop === 'squad'){
      const mains = role === 'assault' ? rifles.filter(w => /shotgun/i.test(w.base)).concat(W('Sidearm')) : rifles;
      const teamOpts = role === 'recon' ? rifles.filter(w => /precision|sniper/i.test(w.base)).concat(teams) : teams;
      for (const size of [4, 5, 6]) for (const mw of (mains.length ? mains : [null])) for (const tw of [null, ...teamOpts]) for (const g of [null, grens[0] || null]){
        const wl = [mw && mw.id, g && g.id]; if (role === 'assault' && side_ && (!mw || mw.id !== side_.id)) wl.push(side_.id);
        cands.push({ ...u, size, weapons:wl.filter(Boolean), teamWeapons:tw ? [tw.id] : [] });
      }
    } else if (u.troop === 'team'){ teams.forEach(tw => cands.push({ ...u, teamWeapons:[tw.id] })); }
    else {
      for (const kpAdd of [0, 1, 2]) for (const extra of [null, ...rifles]) for (const hero of [false, true])
        cands.push({ ...u, profile:{ ...u.profile, kp:u.profile.kp + kpAdd }, weapons:[...u.weapons, ...(extra ? [extra.id] : [])], rules:hero && !u.rules.includes('Hero') ? [...u.rules, 'Hero'] : u.rules });
    }
    const legal = cands.filter(c => !legality(c).some(i => i.lvl === 'err'));
    const pool = legal.length ? legal : cands;
    if (pool.length) u = pool.reduce((best, c) => Math.abs(tplPoints(c).v - budget) < Math.abs(tplPoints(best).v - budget) ? c : best, pool[0]);
  }
  return u;
}
function blankTemplate(side){ const fac = (side || 'player') === 'player' ? playerFaction() : (S.armory.factions.find(f => f.id === S.setup.opponent) || S.armory.factions.find(f => f.side === side)); return { id:null, name:'', side:side || 'player', faction:fac ? fac.id : '', troop:'squad', size:5, level:'', profile:{ sp:4, re:2, cs:1, t:4, kp:1, sv:0, tr:1, save:'—' }, leader:{ sp:4, re:2, cs:1, t:4, kp:2, sv:0, tr:1, save:'—' }, weapons:[], teamWeapons:[], leaderWeapons:[], rules:[], pointsMode:'auto', points:0 }; }
function generateSupport(spec){
  const opt = spec.option && spec.option !== 'random' ? spec.option : pick(SUPPORT);
  const tn = { reliable:6, standard:7, scarce:8 }[spec.reliability] || 7;
  const cpr = R('supportCost').find(x => Number(x.tn) === tn); const cp = cpr ? Number(cpr.cp) : 2;
  const strike = opt === 'Fire Support' ? pick(['Light','Medium','Heavy','Focused','Scattered']) : '';
  return { id:uid('s'), name:cap(pick(SUPPORT_SKINS[opt] || [opt.toLowerCase()])), option:opt, strike, tn, cp, est:true };
}

