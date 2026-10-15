/* ---------- narrative scenes ----------
   The portal owns structure: who speaks, when a scene fires, where it is kept.
   Words come from the voice cards in the content pack. Anything longer goes to chat as a scene packet. */
const voices = () => (S.content && S.content.voices) || [];
const voiceById = id => voices().find(v => v.id === id);
const voiceForFig = f => voices().find(v => v.figName && v.figName === f.name);
const vName = v => v ? `${v.rank} ${v.name}`.trim() : 'Command';
function fillLine(t, ctx){ return String(t).replace(/\{(\w+)\}/g, (mm, k) => ctx[k] != null && ctx[k] !== '' ? ctx[k] : mm); }
function lineOf(v, key, ctx){ const l = v && v.lines && v.lines[key]; if (!l || !l.length) return null; return fillLine(pick(l), ctx); }
function sceneMode(){ return (S.mods && S.mods.scenes) || 'events'; }
function forceUnits(m){ return (m.force || []).map(id => S.roster.units.find(u => u.id === id)).filter(Boolean); }
function missionCtx(m){
  const units = forceUnits(m); const u = units[0]; const t = u && tplOf(u);
  const lead = u && (u.figures.find(f => f.role === 'sergeant' && f.status === 'active') || u.figures.find(f => f.acting && f.status === 'active') || u.figures.find(f => f.status === 'active'));
  return { leader:lead ? lead.name : (u ? u.name : 'Commander'), unit:u ? u.name : 'your force', region:m.regionName, enemy:m.enemy ? m.enemy.faction : enemyFaction().name,
    theme:m.theme, poi:m.poi, support:(m.support || []).map(s => s.name).join(', ') || 'nothing extra', tier:m.tierName, troop:t ? t.troop : '' };
}
function pushScene(sc){ sc.id = uid('sc'); sc.turn = S.turn; sc.sd = stardate(S.turn); S.scenes = S.scenes || []; S.scenes.unshift(sc); return sc.id; }
function briefingFor(m){
  if (sceneMode() === 'off') return null;
  const v = voiceById(S.content.briefer); const ctx = missionCtx(m);
  const body = lineOf(v, m.stance, ctx) || `${m.theme}.`;
  const assets = m.support.length ? lineOf(v, 'assets', ctx) : lineOf(v, 'noassets', ctx);
  const obj = m.objectives.map(o => `  · ${o.name}: ${o.text}`).concat(m.secondary ? [`  · Secondary: ${m.secondary}`] : []).join('\n');
  const parts = [S.content.ordersHeader || 'ORDERS', `Stardate ${m.sd}`, '', lineOf(v, 'opener', ctx), '', body, '', 'Objectives', obj, '', assets, '', lineOf(v, 'close', ctx), '', v ? `— ${vName(v)}, ${v.post}` : ''];
  const text = parts.filter(x => x != null).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const id = pushScene({ kind:'briefing', title:`Orders: ${m.theme}`, missionId:m.id, beats:[{ who:v ? v.id : null, line:text, orders:true }] });
  return { voice:v ? v.id : null, text, sceneId:id };
}
function squadTalk(m, info, beats){
  const took = new Set(m.result.participants || []);
  const alive = forceUnits(m).flatMap(u => u.figures.filter(f => f.status !== 'kia' && (!took.size || took.has(f.id))).map(f => ({ f, v:voiceForFig(f) }))).filter(x => x.v && x.v.kind === 'squad');
  if (!alive.length) return;
  const ctx = missionCtx(m); const used = new Set();
  const say = (key, fig) => { const cands = alive.filter(x => !used.has(x.v.id) && x.v.lines[key]); if (!cands.length) return; const c = pick(cands); used.add(c.v.id); beats.push({ who:c.v.id, line:fillLine(pick(c.v.lines[key]), { ...ctx, fig:fig ? fig.name : '' }) }); };
  beats.push({ stage:'Later, with the squad.' });
  if (info.dead.length) say('kia', info.dead[0]);
  info.casualties.slice(0, 1).forEach(f => say('casualty', f));
  say(m.result.outcome === 'Victory' ? 'victory' : 'defeat'); say('banter');
}
function debriefScene(m, info){
  const mode = sceneMode(); if (mode === 'off') return null;
  const ctx = missionCtx(m); const out = m.result.outcome; const beats = [{ stage:`After-action, ${m.regionName}. ${out}${m.result.vp ? `, ${m.result.vp} VP` : ''}.` }];
  const db = voiceById(S.content.debriefer); const cv = voiceById(S.content.casualtyVoice); const pv = voiceById(S.content.presenter);
  const l = lineOf(db, out === 'Victory' ? 'victory' : out === 'Draw' ? 'draw' : 'defeat', ctx); if (l) beats.push({ who:db.id, line:l });
  info.dead.forEach(f => { const v = cv && cv.lines.kia ? cv : db; const t = lineOf(v, 'kia', { ...ctx, fig:f.name }); if (t) beats.push({ who:v.id, line:t }); });
  info.casualties.forEach(f => { const t = lineOf(db, 'casualty', { ...ctx, fig:f.name }); if (t) beats.push({ who:db.id, line:t }); });
  info.awarded.forEach(a => { const t = lineOf(pv, 'award', { ...ctx, fig:a.f.name, award:a.award }); if (t) beats.push({ who:pv.id, line:t }); });
  const notable = info.dead.length || info.casualties.length || info.awarded.length || (m.result.moments || []).length;
  if (S.mods.squadTalk && (mode === 'every' || (mode === 'events' && notable))) squadTalk(m, info, beats);
  return pushScene({ kind:'debrief', title:`Debrief: ${m.regionName}`, missionId:m.id, beats });
}
function milestoneScene(kind, u, f, choiceText){
  if (!['events','every'].includes(sceneMode())) return null;
  const ctx = { fig:f.name, unit:u.name, region:myZone() ? regionOf(myZone()).name : S.setup.theater, award:choiceText };
  const beats = [{ stage:`${kind === 'wound2' ? 'The aid station' : 'Parade'}, ${S.setup.theater}.` }];
  if (kind === 'wound2'){ const v = voiceById(S.content.casualtyVoice); const t = lineOf(v, 'wound', ctx) || lineOf(v, 'casualty', ctx); if (t) beats.push({ who:v.id, line:t });
    const me = voiceForFig(f); const t2 = lineOf(me, 'banter', ctx); if (t2) beats.push({ who:me.id, line:t2 }); beats.push({ stage:choiceText }); }
  else { const v = voiceById(S.content.presenter); const t = lineOf(v, 'award', ctx); if (t) beats.push({ who:v.id, line:t }); else beats.push({ stage:choiceText }); }
  return pushScene({ kind:'milestone', title:kind === 'wound2' ? `Second wound: ${f.name}` : `Citation: ${f.name}`, beats });
}
function eventScene(ev){
  if (!['events','every'].includes(sceneMode())) return null;
  const v = voiceById(S.content.eventVoice) || voiceById(S.content.briefer); const ctx = { region:ev.ctx && ev.ctx.zoneName || '', unit:ev.ctx && ev.ctx.unitName || '' };
  const beats = [{ stage:`${ev.title}. ${ev.choice}.` }];
  const t = lineOf(v, 'event', ctx); if (t) beats.push({ who:v.id, line:t });
  const u = ev.ctx && S.roster.units.find(x => x.id === ev.ctx.unitId);
  if (u){ const sq = u.figures.filter(f => f.status !== 'kia').map(voiceForFig).filter(x => x && x.lines.banter); if (sq.length){ const s2 = pick(sq); beats.push({ who:s2.id, line:fillLine(pick(s2.lines.banter), ctx) }); } }
  beats.push({ stage:ev.outcome });
  return pushScene({ kind:'event', title:ev.title, beats });
}
function sceneText(sc){ return sc.beats.map(b => b.stage ? `[${b.stage}]` : b.orders ? b.line : `${vName(voiceById(b.who)).toUpperCase()}: ${b.line}`).join('\n\n'); }
function scenePacket(m){
  const sc = m.debriefId && (S.scenes || []).find(x => x.id === m.debriefId);
  const cast = new Map(); const add = v => { if (v) cast.set(v.id, v); };
  add(voiceById(S.content.briefer)); add(voiceById(S.content.debriefer));
  forceUnits(m).forEach(u => u.figures.forEach(f => add(voiceForFig(f))));
  if (sc) sc.beats.forEach(b => add(voiceById(b.who)));
  const units = forceUnits(m).map(u => `- ${u.name}: ` + u.figures.map(f => `${f.name} (${f.status === 'kia' ? 'KIA' : f.status}${f.kills ? `, ${f.kills} kills` : ''})`).join('; '));
  const r = m.result || { outcome:'not yet fought', lines:[], moments:[] };
  return [`SCENE PACKET — ${S.setup.name}, ${S.setup.theater}`,
    `Mission: ${m.theme} at ${m.regionName} (${m.regionType}). ${m.tierName}, ${m.scenario}. Stardate ${m.sd}.`,
    `Opposition: ${m.enemy ? m.enemy.faction : ''}.`, `Result: ${r.outcome}${r.vp ? `, ${r.vp} VP` : ''}.`, '',
    'Key moments:', ...(r.moments.length ? r.moments.map(x => '- ' + x) : ['- (none recorded)']), '',
    'Post-battle record:', ...r.lines.map(x => '- ' + x), '',
    'Force after the battle:', ...units, '',
    'Cast (voice cards):', ...[...cast.values()].map(v => `- ${vName(v)}, ${v.post}: ${v.voice}`), '',
    'Recent continuity:', ...S.journal.slice(0, 8).reverse().map(j => `- T${j.turn}: ${j.text}`), '',
    ...(sc ? ['Portal draft of the debrief (rewrite freely):', sceneText(sc), ''] : []),
    'Request: write the after-mission scene for this, in the campaign\'s established voice. Keep every character consistent with the voice cards and the continuity above, and do not change any result.'].join('\n');
}

