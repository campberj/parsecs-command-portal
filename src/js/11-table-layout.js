/* ---------- table layout with the four-tier terrain language ---------- */
function deployDepth(m){ const H = m.table[1];
  if (m.scenario === 'Skirmish') return Math.max(3, (H - 18) / 2);
  if (m.scenario === 'Battle') return Math.max(3, (H - 24) / 2);
  if (m.scenario === 'Grand Battle') return Math.max(3, (H - 30) / 2);
  return 6; }
function buildLayout(m){
  const [W, H] = m.table; const dep = deployDepth(m); const obj = [];
  const zx = () => (Math.floor(rand() * 6) + 0.5) * (W / 6);
  if (m.scenario === 'Evolving Objective'){ const belts = H >= 48 ? [[12, 24], [24, 36], [36, 48], [12, 24]] : [[12, 24], [12, 24], [24, 36]]; belts.slice(0, m.objectives.length).forEach((b, i) => obj.push({ x:zx(), y:H - (b[0] + rand() * (b[1] - b[0])), label:String(i + 1) })); }
  else if (m.scenario === 'Battle'){ const o = m.objectives[0].name;
    if (o === 'Hold the Field') [1, 2, 3].forEach(i => obj.push({ x:W * i / 4, y:H / 2, label:String(i) }));
    else if (o === 'Vital Ground') obj.push({ x:W / 2, y:H / 2, label:'V' });
    else if (o === 'Search and Retrieve') for (let i = 0; i < 6; i++) obj.push({ x:W * (i + 0.5) / 6, y:H / 2 + (i % 2 ? 4 : -4), label:String(i + 1) }); }
  else if (m.scenario === 'Skirmish') [[0, 0], [-8, 5], [8, -5]].forEach((o, i) => obj.push({ x:W / 2 + o[0], y:H / 2 + o[1], label:'T' + (i + 1) }));
  const pool = { micro:[], small:[], medium:[], large:[] };
  S.armory.terrain.forEach(t => { for (let i = 0; i < t.count; i++) (pool[t.tier] || pool.small).push({ ...t }); });
  Object.values(pool).forEach(shuffle);
  const cols = Math.max(1, Math.round(W / 12)), rows = Math.max(1, Math.round(H / 12)); const cw = W / cols, ch = H / rows;
  const cells = []; for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) cells.push({ c, r, d:Math.hypot((c + 0.5) * cw - W / 2, (r + 0.5) * ch - H / 2), used:0 });
  cells.sort((a, b) => a.d - b.d);
  const placed = [];
  const fits = (p, x, y, gap) => x >= 0.5 && y >= 0.5 && x + p.w <= W - 0.5 && y + p.h <= H - 0.5 && !placed.some(q => x < q.x + q.w + gap && x + p.w + gap > q.x && y < q.y + q.h + gap && y + p.h + gap > q.y);
  const place = (p, x0, y0, w0, h0, gap) => {
    let w = p.w, h = p.h; if (rand() < 0.4 && p.rules !== 'Hill'){ [w, h] = [h, w]; }
    for (let k = 0; k < 30; k++){ const x = x0 + rand() * Math.max(0.5, w0 - w), y = y0 + rand() * Math.max(0.5, h0 - h); const q = { ...p, w, h };
      if (fits(q, x, y, gap)){ placed.push({ ...q, x:half(x), y:half(y) }); return true; } }
    return false;
  };
  if (m.bigPiece && pool.large.length && W >= 36){ const p = pool.large.shift(); if (!place(p, W / 2 - p.w / 2 - 3, H / 2 - p.h / 2 - 3, p.w + 6, p.h + 6, 1)) pool.large.unshift(p); }
  for (const cell of cells){
    const x0 = cell.c * cw, y0 = cell.r * ch;
    const hasBig = placed.some(q => q.x < x0 + cw && q.x + q.w > x0 && q.y < y0 + ch && q.y + q.h > y0 && (q.tier === 'large' || q.tier === 'medium'));
    if (!hasBig && pool.medium.length && place(pool.medium[0], x0, y0, cw, ch, 1)) pool.medium.shift();
    const nSmall = hasBig || placed.some(q => q.tier === 'medium' && q.x >= x0 && q.x < x0 + cw && q.y >= y0 && q.y < y0 + ch) ? 1 : 2;
    for (let i = 0; i < nSmall && pool.small.length; i++) if (place(pool.small[0], x0, y0, cw, ch, 1)) pool.small.shift();
  }
  /* micro pieces cluster near larger pieces */
  const anchors = placed.filter(p => p.tier !== 'micro');
  let guard = 0;
  while (pool.micro.length && guard++ < 80){ const a = anchors.length ? pick(anchors) : { x:rand() * W, y:rand() * H, w:1, h:1 }; const p = pool.micro[0];
    if (place(p, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 0.5)) pool.micro.shift(); else if (guard > 60){ const c = pick(cells); if (place(p, c.c * cw, c.r * ch, cw, ch, 0.5)) pool.micro.shift(); } }
  if (m.scenario === 'Skirmish'){
    const feats = placed.filter(p => p.tier !== 'micro').sort((a, b) => Math.hypot(a.x + a.w / 2 - W / 2, a.y + a.h / 2 - H / 2) - Math.hypot(b.x + b.w / 2 - W / 2, b.y + b.h / 2 - H / 2));
    feats.slice(0, 3).forEach((p, i) => { obj[i] = { x:p.x + 1.3, y:p.y + 1.3, label:'T' + (i + 1) }; });
  }
  const lanes = []; for (let x = 0; x + 6 <= W; x += 6){ const open = !placed.some(p => p.tier !== 'micro' && p.x < x + 6 && p.x + p.w > x); if (open){
    let fixed = false; const p = pool.small.shift() || pool.medium.shift();
    if (p){ for (let k = 0; k < 3 && !fixed; k++) fixed = place(p, x, dep + k * 4, 6, H - 2 * dep, 1); }
    lanes.push({ x, fixed }); } }
  return { W, H, dep, obj, terrain:placed, lanes, unused:Object.values(pool).reduce((a, l) => a + l.length, 0) };
}

