/* ============================================================
   PARSECS COMMAND PORTAL
   Source files in src/js are concatenated in name order by
   build.mjs into one <script>, so they share one global scope.
   Domain logic first (01–19, no DOM), UI after (20+).
   All book rolls go through die(); with app dice off, each step
   runs in a sandbox, collects the dice it needs, and asks once.
   ============================================================ */

/* ---------- RNG and dice service ---------- */
let S = null;
function hashSeed(str){ let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++){ h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
function rand(){ let t = (S.rngState = (S.rngState + 0x6D2B79F5) | 0); t = Math.imul(t ^ t >>> 15, 1 | t); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const d = n => 1 + Math.floor(rand() * n);
const pick = arr => arr[Math.floor(rand() * arr.length)];
function weighted(items, wfn){ const ws = items.map(wfn); const tot = ws.reduce((a, b) => a + b, 0); if (tot <= 0) return pick(items); let r = rand() * tot; for (let i = 0; i < items.length; i++){ r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }
function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let uidN = 0; const uid = p => p + '-' + (Date.now() % 1e6).toString(36) + (uidN++).toString(36);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const half = v => Math.round(v * 2) / 2;

const DICE = { provided:[], idx:0, requests:[] };
function appDice(){ return !S.mods || S.mods.appDice !== false; }
function die(sides, label){
  if (appDice()) return d(sides);
  if (DICE.idx < DICE.provided.length) return DICE.provided[DICE.idx++];
  DICE.requests.push({ sides, label }); return 1 + Math.floor(Math.random() * sides);   /* sandbox roll, off the seeded stream, so the step can finish discovering what it needs */
}
const D6 = label => die(6, label);
const D100 = label => die(100, label);
const rollN = (n, s, label) => Array.from({ length:n }, (_, i) => die(s, n > 1 ? `${label} — die ${i + 1} of ${n}` : label));
const best2 = label => Math.max(die(6, label + ' — die 1 of 2'), die(6, label + ' — die 2 of 2'));

/* ---------- steps (resumable units of work that may need dice) ---------- */
const STEPS = {
  setup: () => generateCampaign(),
  phase: i => turnPhase(i),
  mission: opts => { const m = generateMission(opts); S.ui.mission = m.id; S.ui.tab = 'missions'; return m; },
  reveal: id => revealRound(id),
  result: (id, form) => recordResult(S.missions.find(m => m.id === id), form),
  event: (id, idx) => resolveEvent(S.inbox.find(e => e.id === id), idx),
  story: id => applyStory(id),
  paction: (id, txt) => playerAction(id, txt),
  raid: zid => commandoRaid(zid),
  rollstory: () => queueStory()
};
const STEP_TITLE = { setup:'Opening Army Strength', phase:['Step 3 · Zone combat','Step 4 · Operational orders','Steps 5–6 · Redeploy and supply','Step 7 · New fronts','Story and events'], mission:'Mission generation', reveal:'Enemy arrivals this round', result:'Post-battle sequence', event:'Event test', story:'Story event', paction:'Player action', raid:'Commando raid', rollstory:'Story event roll' };
function runStep(key, args, provided){
  provided = provided || [];
  const snap = JSON.stringify(S);
  DICE.provided = provided; DICE.idx = 0; DICE.requests = [];
  const result = STEPS[key](...(args || []));
  if (DICE.requests.length){
    const reqs = DICE.requests.slice(); DICE.requests = [];
    S = JSON.parse(snap);
    S.pendingDice = { key, args:args || [], provided, requests:reqs };
    return { pending:true };
  }
  S.pendingDice = null; DICE.provided = []; DICE.idx = 0;
  return { ok:true, result };
}
function stepTitle(p){ const t = STEP_TITLE[p.key]; return Array.isArray(t) ? t[p.args[0]] : t; }

