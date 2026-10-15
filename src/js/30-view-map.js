/* ----- map ----- */
function colorOf(c){ return c === 'P' ? 'var(--player)' : c === 'E' ? 'var(--enemy)' : 'var(--neutral)'; }
function viewMap(){
  const { nodes, edges, W, H } = S.map; const sel = S.ui.sel; const fog = S.mods.fog;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Operational map of ${esc(S.setup.theater)}">
    <defs><pattern id="gridp" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--line)" stroke-width="0.6" opacity="0.6"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="var(--surface)"/><rect width="${W}" height="${H}" fill="url(#gridp)"/>`;
  edges.forEach(([a, b]) => { const A = nodes[a], B = nodes[b]; const front = A.ctrl !== B.ctrl && A.ctrl !== 'N' && B.ctrl !== 'N';
    svg += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${front ? 'var(--accent)' : 'var(--muted)'}" stroke-width="${front ? 2 : 1.4}" stroke-dasharray="${front ? '6 5' : ''}" opacity="${front ? 0.9 : 0.5}"/>`; });
  nodes.forEach(n => {
    const z = zoneAt(n.id); const r = n.capital ? 22 : 16;
    svg += `<g class="node" data-act="sel" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}, ${n.type}, ${n.ctrl === 'P' ? 'yours' : n.ctrl === 'E' ? 'enemy' : 'neutral'}">`;
    if (z) svg += `<circle cx="${n.x}" cy="${n.y}" r="${r + 9}" fill="none" stroke="var(--accent)" stroke-width="${z.focus ? 4 : 2}" stroke-dasharray="${z.focus ? '' : '4 3'}"/>`;
    if (sel === n.id) svg += `<circle cx="${n.x}" cy="${n.y}" r="${r + 15}" fill="var(--hl)" stroke="var(--accent)" stroke-width="1"/>`;
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${colorOf(n.ctrl)}" stroke="var(--surface)" stroke-width="2"/>`;
    if (n.capital) svg += `<rect x="${n.x - 6}" y="${n.y - 6}" width="12" height="12" fill="var(--surface)" transform="rotate(45 ${n.x} ${n.y})"/>`;
    else if (TYPE_GLYPH[n.type]) svg += `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="500" fill="#fff">${TYPE_GLYPH[n.type]}</text>`;
    svg += `<text x="${n.x}" y="${n.y + r + 18}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="13" font-weight="600" fill="var(--ink)" paint-order="stroke" stroke="var(--surface)" stroke-width="4">${esc(n.name)}</text>`;
    if (z){ const eStr = fog && !z.scouted ? '?' : z.E; const bx = n.x + r + 6, by = n.y - r - 14;
      svg += `<rect x="${bx}" y="${by}" width="58" height="22" rx="3" fill="var(--surface)" stroke="var(--line)"/>
        <text x="${bx + 15}" y="${by + 16}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--player)">${z.P}</text>
        <text x="${bx + 29}" y="${by + 16}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" fill="var(--muted)">v</text>
        <text x="${bx + 43}" y="${by + 16}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--enemy)">${eStr}</text>`;
      if (z.id === S.commitment) svg += `<path d="M${n.x - r - 4} ${n.y - r - 18} v18 M${n.x - r - 4} ${n.y - r - 18} h14 l-4 5 l4 5 h-14" fill="var(--player)" stroke="var(--player)" stroke-width="2"/>`; }
    svg += `</g>`;
  });
  svg += `</svg>`;
  const ended = S.ended ? `<div class="banner"><h3>${S.ended === 'win' ? 'Campaign won' : S.ended === 'loss' ? 'Campaign lost' : 'Campaign inconclusive'}</h3><p class="muted small">Start a new campaign from Setup & data. Your roster carries over.</p></div>` : '';
  return `${ended}<div class="split"><div class="stack"><div class="mapbox"><div class="mapscroll">${svg}</div>
      <div class="legend"><span><span class="sw" style="background:var(--player)"></span>Your territory</span><span><span class="sw" style="background:var(--enemy)"></span>${esc(enemyFaction().name)}</span><span><span class="sw" style="background:var(--neutral)"></span>Neutral</span>
        <span>Dashed amber ring: Operational Zone · solid ring: Focus · flag: your force</span><span>U Urban · C Critical · D Defensible · R Resource · I Inhospitable · ◆ HQ</span></div></div>
      ${zonesTable()}</div><div class="stack">${regionPanel()}</div></div>`;
}
function zonesTable(){
  if (!S.zones.length) return `<div class="empty">No active fronts. End the turn and the winners will open new ones.</div>`;
  const rows = S.zones.map(z => { const r = regionOf(z); const eS = S.mods.fog && !z.scouted ? '?' : z.E;
    return `<tr class="${S.ui.sel === r.id ? 'sel' : ''}"><td><button class="btn sm" type="button" data-act="sel" data-id="${r.id}">${esc(r.name)}</button></td><td>${r.type}</td><td>${z.attacker === 'P' ? '<span class="pill info">Your attack</span>' : '<span class="pill enemy">Enemy attack</span>'}</td>
      <td class="num mono" style="color:var(--player)">${z.P}</td><td class="num mono" style="color:var(--enemy)">${eS}</td><td class="num mono">${z.pbp}</td>
      <td>${z.focus ? '<span class="pill warn">Focus</span> ' : ''}${z.id === S.commitment ? '<span class="pill good">Your force</span>' : ''}</td></tr>`; }).join('');
  return `<div class="panel"><div class="panel-h"><h3>Active fronts</h3><span class="muted small">Enemy personality: <b>${esc(personality('E'))}</b>${S.mods.bookAI ? ' (book AI on: random picks)' : ''}</span></div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Region</th><th>Type</th><th>Initiated by</th><th class="num">Yours</th><th class="num">Theirs</th><th class="num">PBP</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function regionPanel(){
  const id = S.ui.sel;
  if (id == null){ const mz = myZone();
    return `<div class="panel"><h3>Region</h3><p class="muted">Select a region on the map to see its points of interest, armies and missions.</p>
      ${mz ? `<hr><p class="small">Your force is at <b>${esc(regionOf(mz).name)}</b>.</p><button class="btn primary" type="button" data-act="genhere" data-zone="${mz.id}">Generate mission there</button>` : ''}</div>`; }
  const n = S.map.nodes[id]; const z = zoneAt(id);
  const ctrl = n.ctrl === 'P' ? '<span class="pill info">Yours</span>' : n.ctrl === 'E' ? '<span class="pill enemy">Enemy</span>' : '<span class="pill mute">Neutral</span>';
  const hist = S.journal.filter(j => j.text.includes(n.name)).slice(0, 5); const missions = S.missions.filter(m => m.region === id);
  return `<div class="panel stack"><div class="panel-h"><h3>${esc(n.name)}</h3>${ctrl}</div>
    <div class="row small"><span class="chip">${n.type}${n.capital ? ' · HQ' : ''}</span><span class="chip">${esc(n.terrain)}</span>${n.type === 'Defensible' ? `<span class="chip">Defense Quality ${n.dq}</span>` : ''}${n.exhausted ? '<span class="chip">Resource exhausted</span>' : ''}</div>
    <div><span class="lbl">Points of interest</span><div class="small">${n.poi.map(esc).join(' · ')}</div></div>
    <div><span class="lbl">Routes to</span><div class="small">${esc(adjOf(id).map(i => S.map.nodes[i].name).join(', '))}</div></div>
    ${z ? `<hr><div><span class="lbl">Operational Zone</span><div class="row" style="margin-top:4px"><span class="mono" style="color:var(--player);font-size:20px">${z.P}</span><span class="muted">against</span><span class="mono" style="color:var(--enemy);font-size:20px">${S.mods.fog && !z.scouted ? '?' : z.E}</span>${z.focus ? '<span class="pill warn">Focus</span>' : ''}</div>
      <div class="small muted">Player Battle Points saved: ${z.pbp} (max 3; up to 2 earned per turn).</div></div>
      <div class="row"><button class="btn primary" type="button" data-act="genhere" data-zone="${z.id}">Generate mission here</button>
        ${z.id !== S.commitment ? `<button class="btn" type="button" data-act="commit" data-zone="${z.id}">Commit your force here</button>` : '<span class="pill good">Your force is here</span>'}
        ${z.pbp > 0 ? `<button class="btn" type="button" data-act="raid" data-zone="${z.id}">Commando raid (spend ${z.pbp} PBP)</button>` : ''}</div>` : `<hr><p class="small muted">No fighting here. Fronts open when a side attacks an adjacent region.</p>`}
    ${missions.length ? `<div><span class="lbl">Missions here</span><div class="stack" style="gap:4px;margin-top:4px">${missions.map(m => `<button class="btn sm" type="button" data-act="openm" data-id="${m.id}">${esc(m.theme)} · ${m.status}</button>`).join('')}</div></div>` : ''}
    ${hist.length ? `<div><span class="lbl">Recent history</span><ul class="small" style="margin:4px 0 0;padding-left:16px">${hist.map(h => `<li><span class="mono">T${h.turn}</span> ${esc(h.text)}</li>`).join('')}</ul></div>` : ''}</div>`;
}

