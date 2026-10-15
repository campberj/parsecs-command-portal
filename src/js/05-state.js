/* ---------- state ---------- */
function defaultMods(){
  return { appDice:true, points:true, freeform:false, ia:false, moveMult:1, rangeMult:1, fog:false, bookAI:false, pace:2, strictOverwatch:false, individualActions:false, retreat:false, landSomewhere:false,
           fcgSecondSkill:true, mercenary:false, tableReadyOnly:true, autoPBP:true, eventChance:60, excludeTags:[],
           figureXP:false, skillCurrency:'xp', fieldStab:true, scenes:'events', squadTalk:true, refitDefault:false };
}
const SCHEMA = 3;
function newState(setup, keep){
  S = { v:SCHEMA, id:uid('c'), created:new Date().toISOString(), seed:setup.seed, rngState:hashSeed(String(setup.seed)), setup, turn:1, turnPhase:0, turnWinners:[], cohesion:{P:0,E:0}, cp:0, story:3, munitions:0,
        map:null, zones:[], commitment:null, armory:sampleArmory(), roster:sampleRoster(), missions:[], inbox:[], journal:[], mods:defaultMods(), content:defaultContent(), scenes:[],
        flags:{ seenEvents:{} }, lastResult:null, ended:null, banked:[], noOrders:{}, extraOrders:{}, pendingDice:null,
        ui:{ tab:'map', sel:null, armoryTab:'templates', mission:null, layout:'full', builder:null, rulesTab:'enemyForces', wiz:null, pack:null, figOpen:null } };
  if (keep) Object.assign(S, JSON.parse(JSON.stringify(keep)));
  return runStep('setup', []);
}
/* start a campaign for any pair of factions; carry = keep this campaign's armory and mods (and roster/content when the faction is unchanged) */
function startCampaign(setup, carry){
  const prev = S; const notes = [];
  const sameSide = carry && prev && prev.setup && prev.setup.player === setup.player;
  const armory = carryFactions(carry ? JSON.parse(JSON.stringify(prev.armory)) : sampleArmory(), prev ? prev.armory : sampleArmory(), [setup.player, setup.opponent]);
  const keep = { armory };
  if (carry){ keep.mods = prev.mods; }
  if (sameSide){ keep.roster = prev.roster; keep.content = prev.content; }
  const r = newState(setup, keep);
  if (!carry){ S.mods.ia = true; S.mods.figureXP = true; }
  if (!sameSide){
    const use78 = setup.player === 'f-78' && S.armory.templates.some(t => t.id === 't-sturm');
    if (use78){ S.roster = sampleRoster(); S.content = defaultContent(); }
    else {
      const fac = S.armory.factions.find(f => f.id === setup.player);
      S.roster = starterRoster(setup.player, setup.scale);
      S.content = genericContent(fac, isMachineFaction(setup.player));
      notes.push(S.roster.units.length ? `Starter force: ${S.roster.units.length} unit${S.roster.units.length > 1 ? 's' : ''} from ${fac ? fac.name : 'your faction'}.` : `${fac ? fac.name : 'Your faction'} has no templates yet; build units on the Armory tab, then add them on Forces.`);
    }
  }
  const pf = S.armory.factions.find(f => f.id === setup.player), of = S.armory.factions.find(f => f.id === setup.opponent);
  if (prescaled(pf) && prescaled(of)){ S.mods.ia = false; S.mods.moveMult = 1; S.mods.rangeMult = 1; notes.push('Both factions use pre-scaled distances, so Independent Action is off.'); }
  else if (prescaled(pf) || prescaled(of)){ notes.push(`${prescaled(pf) ? pf.name : of.name} uses pre-scaled (×1.5) distances and ${prescaled(pf) ? of.name : pf.name} uses book distances; check the scale on the Mods tab.`); }
  return { r, notes };
}
/* bring any older save up to the current schema */
function migrate(o){
  if (!o || typeof o !== 'object' || !o.map) throw new Error('not a portal campaign');
  if (o.v === 2){
    o.v = 3; o.id = o.id || uid('c'); o.created = o.created || new Date().toISOString();
    o.content = o.content || defaultContent(); o.scenes = o.scenes || [];
    o.mods = Object.assign(defaultMods(), o.mods || {});
    (o.roster.units || []).forEach(u => u.figures.forEach(f => { ['xp','tokens','recover'].forEach(k => { if (f[k] == null) f[k] = 0; }); if (!f.adv) f.adv = {}; if (f.loadout === undefined) f.loadout = null; }));
    o.ui = Object.assign({ rulesTab:'enemyForces', wiz:null, pack:null, figOpen:null }, o.ui || {});
  }
  if (o.v !== SCHEMA) throw new Error(`save schema ${o.v} is newer than this portal (${SCHEMA})`);
  o.mods = Object.assign(defaultMods(), o.mods); o.content = o.content || defaultContent(); o.scenes = o.scenes || [];
  if (o.setup && !o.setup.player){ /* older saves had no player faction: infer it from the roster */
    const t = (o.roster.units || []).map(u => o.armory.templates.find(x => x.id === u.tpl)).find(x => x && x.faction);
    o.setup.player = t ? t.faction : ((o.armory.factions.find(f => f.side === 'player') || {}).id || 'f-78'); }
  return o;
}

/* ---------- journal ---------- */
function stardate(turn){ const base = parseFloat(S.setup.stardate) || 2426.03; return (base + (turn - 1) * 0.01).toFixed(2); }
function log(type, text){ S.journal.unshift({ turn:S.turn, sd:stardate(S.turn), type, text, manual:!appDice() }); }

/* ---------- campaign / map generation ---------- */
function generateCampaign(){
  const st = S.setup; const coh = cohesionFor(st.length);
  S.cohesion = { P:coh, E:coh };
  const scale = SCALES[st.scale] || SCALES.squad;
  const N = clamp(Math.max(Math.ceil(RP('regionsPerCoh') * coh * 2), scale.floor), 8, 30);
  const W = 1000, H = 640, pad = 60; const pts = [];
  for (let i = 0; i < N; i++){
    let bestP = null, bestD = -1;
    for (let k = 0; k < 24; k++){ const p = { x:pad + rand() * (W - 2 * pad), y:pad + rand() * (H - 2 * pad) }; let md = Infinity; for (const q of pts) md = Math.min(md, Math.hypot(p.x - q.x, p.y - q.y)); if (md > bestD){ bestD = md; bestP = p; } }
    pts.push(bestP);
  }
  const dist = (a, b) => Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
  let edges = [];
  for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++){ const dab = dist(a, b); let ok = true; for (let c = 0; c < N && ok; c++){ if (c === a || c === b) continue; if (Math.max(dist(a, c), dist(b, c)) < dab) ok = false; } if (ok) edges.push([a, b]); }
  const deg = () => { const g = Array(N).fill(0); edges.forEach(([a, b]) => { g[a]++; g[b]++; }); return g; };
  edges.sort((e1, e2) => dist(e2[0], e2[1]) - dist(e1[0], e1[1]));
  for (const e of [...edges]){ const g = deg(); if (g[e[0]] > 4 || g[e[1]] > 4){ const trial = edges.filter(x => x !== e); if (isConnected(N, trial)) edges = trial; } }
  const g2 = deg();
  for (let a = 0; a < N; a++){ if (g2[a] >= 2) continue;
    const cands = [...Array(N).keys()].filter(b => b !== a && !edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))).sort((p, q) => dist(a, p) - dist(a, q));
    for (const b of cands){ if (g2[b] < 4 && !crosses(pts, edges, a, b)){ edges.push([a, b]); g2[a]++; g2[b]++; break; } } }
  const wts = TYPE_WEIGHTS[st.world] || TYPE_WEIGHTS['Colony']; const used = new Set();
  const nodes = pts.map((p, i) => ({ id:i, x:Math.round(p.x), y:Math.round(p.y), type:weighted(REGION_TYPES, t => wts[t]), terrain:pick(WORLD_TERRAIN[st.world] || WORLD_TERRAIN.Colony), ctrl:'N', capital:null, poi:[], dq:0, name:'' }));
  const adj = buildAdj(N, edges);
  let best = [0, 1, -1];
  for (let a = 0; a < N; a++){ const dd = bfsDist(adj, a); for (let b = 0; b < N; b++) if (dd[b] > best[2]) best = [a, b, dd[b]]; }
  const [cp, ce] = rand() < 0.5 ? [best[0], best[1]] : [best[1], best[0]];
  nodes[cp].ctrl = 'P'; nodes[cp].capital = 'P'; nodes[cp].type = 'Critical';
  nodes[ce].ctrl = 'E'; nodes[ce].capital = 'E'; nodes[ce].type = 'Critical';
  const target = coh + 1;
  const grow = side => { const owned = nodes.filter(n => n.ctrl === side).map(n => n.id); const front = [...new Set(owned.flatMap(id => adj[id]))].filter(id => nodes[id].ctrl === 'N'); if (!front.length) return; const dd = bfsDist(adj, side === 'P' ? cp : ce); front.sort((a, b) => dd[a] - dd[b]); nodes[front[0]].ctrl = side; };
  for (let i = 0; i < target * 2 + 4; i++){ if (nodes.filter(n => n.ctrl === 'P').length < target) grow('P'); if (nodes.filter(n => n.ctrl === 'E').length < target) grow('E'); }
  if (st.special){ for (const side of ['P','E']){ const own = shuffle(nodes.filter(n => n.ctrl === side && !n.capital)); ['Urban','Defensible','Resource'].forEach((t, i) => { if (own[i]) own[i].type = t; }); } }
  else nodes.forEach(n => { if (!n.capital && n.type !== 'Open' && rand() < 0.5) n.type = 'Open'; });
  nodes.forEach(n => {
    if (n.type === 'Defensible') n.dq = RP('dq');
    let nm; let tries = 0; do { nm = pick(NAME_ROOTS) + ' ' + pick(NAME_SUFFIX[n.type]); tries++; } while (used.has(nm) && tries < 40);
    used.add(nm); n.name = n.capital ? (n.capital === 'P' ? 'HQ ' : 'Enemy HQ ') + nm.split(' ')[0] : nm;
    n.poi = shuffle([...POI[n.type]]).slice(0, 2 + (rand() < 0.5 ? 1 : 0));
  });
  S.map = { nodes, edges, W, H };
  S.zones = []; S.turn = 1; S.turnPhase = 0; S.journal = []; S.inbox = []; S.missions = []; S.ended = null;
  log('setup', `Campaign "${st.name}" generated in ${st.theater}: ${N} regions, ${st.world.toLowerCase()} world, Cohesion ${coh} each. Seed ${S.seed}.`);
  const init = rand() < 0.5 ? 'P' : 'E';
  openZone('P', 'open'); openZone('E', 'open'); openZone(init, 'open');
  log('setup', `${sideName(init)} hold the initiative and open a third front.`);
  if (S.zones.length){ const f = pick(S.zones); f.focus = true; S.commitment = f.id; log('setup', `Operational Focus: ${regionOf(f).name}. Your force is committed there.`); }
}
function isConnected(N, edges){ const dd = bfsDist(buildAdj(N, edges), 0); return dd.every(x => x >= 0); }
function buildAdj(N, edges){ const adj = Array.from({ length:N }, () => []); edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); }); return adj; }
function bfsDist(adj, s){ const dd = Array(adj.length).fill(-1); dd[s] = 0; const q = [s]; while (q.length){ const u = q.shift(); for (const v of adj[u]) if (dd[v] < 0){ dd[v] = dd[u] + 1; q.push(v); } } return dd; }
function crosses(pts, edges, a, b){
  const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  const inter = (A, B, C, D) => ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
  return edges.some(([c, e]) => c !== a && c !== b && e !== a && e !== b && inter(pts[a], pts[b], pts[c], pts[e]));
}
const adjOf = id => buildAdj(S.map.nodes.length, S.map.edges)[id];
const regionOf = z => S.map.nodes[z.region];
const other = s => s === 'P' ? 'E' : 'P';
const sideName = s => s === 'P' ? 'Your forces' : enemyFaction().name;
function enemyFaction(){ return S.armory.factions.find(f => f.id === S.setup.opponent) || S.armory.factions.find(f => f.side === 'enemy') || { name:'Enemy', personality:'Methodical', slots:{} }; }
function adjacentToTerritory(regionId, side){ return S.map.nodes[regionId].ctrl === side || adjOf(regionId).some(n => S.map.nodes[n].ctrl === side); }
function zoneAt(regionId){ return S.zones.find(z => z.region === regionId); }

