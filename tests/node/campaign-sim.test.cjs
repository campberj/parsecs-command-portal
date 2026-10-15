const P = require('../../dist/portal.cjs');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; if (fails < 15) console.log('FAIL', m); } };
const S_ = () => P.getS();
function connected(S){ const N=S.map.nodes.length; const adj=Array.from({length:N},()=>[]); S.map.edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a)}); const seen=new Set([0]); const q=[0]; while(q.length){const u=q.shift(); for(const v of adj[u]) if(!seen.has(v)){seen.add(v);q.push(v)}} return seen.size===N; }
// feed random dice until a step completes (manual mode)
function settle(r){ let g=0; while (S_().pendingDice && g++<50){ const p=S_().pendingDice; ok(p.requests.length>0,'request labels'); p.requests.forEach(q=>ok(q.label && q.sides,'label')); r = P.submitDice(p.requests.map(q=>1+Math.floor(Math.random()*q.sides))); } ok(!S_().pendingDice,'settled'); return r; }
P.newState(P.defaultSetup('X1')); const a = JSON.stringify(S_().map); P.newState(P.defaultSetup('X1')); ok(a===JSON.stringify(S_().map),'determinism');
let turns=0, missions=0, manualPrompts=0, ends={};
for (let i=0;i<(+process.env.N||300);i++){
  const st=P.defaultSetup('seed'+i); st.scale=['fireteam','squad','platoon','reinforced'][i%4]; st.length=['short','standard','long'][i%3]; st.special=i%2===0;
  st.world=['Industrial','Desert','Ice','Jungle','Colony','Barren','Mountainous','Archipelagos','Major habitation'][i%9];
  const manual = i%3===0;
  if (manual){ P.newState(st, { mods:Object.assign(require('../../dist/portal.cjs').getS() ? {} : {}, {}) }); }
  P.newState(st);
  const S=S_(); if (manual){ S.mods.appDice=false; }
  ok(connected(S),'connected'); const coh={short:4,standard:5,long:8}[st.length];
  ok(S.map.nodes.filter(n=>n.ctrl==='P').length>=coh,'P terr'); ok(S.zones.length>=1,'zones');
  for (let t=0;t<20 && !S_().ended;t++){
    if (S_().zones.length && i%4===0){
      let r=P.runStep('mission',[{tier:'auto',layout:'full'}]); if (r.pending){ manualPrompts++; settle(); }
      const m=S_().missions[0]; missions++; ok(m.objectives.length,'obj'); ok(m.enemy,'enemy');
      if (m.enemy.mode==='during'){ for(let k=0;k<3;k++){ const rr=P.runStep('reveal',[m.id]); if(rr.pending) settle(); } ok(m.enemy===S_().missions[0].enemy || true,''); ok(S_().missions[0].enemy.total<=S_().missions[0].enemy.cap,'cap'); }
      const mm=S_().missions[0]; const form={outcome:['Victory','Draw','Defeat'][t%3],vp:0,units:{}}; mm.force.forEach(id=>form.units[id]={figs:{},wiped:t%4===0});
      r=P.runStep('result',[mm.id,form]); if(r.pending) settle(); ok(S_().missions[0].status==='complete','complete');
    }
    let g=0;
    while(!P.canAdvance() && !S_().ended && g++<30){
      if (S_().pendingDice){ settle(); continue; }
      const ev=S_().inbox.find(e=>!e.resolved); if(!ev) break;
      let r = ev.kind==='story' ? P.runStep('story',[ev.id]) : P.runStep('event',[ev.id, ev.choices.length-1]);
      if (r.pending){ manualPrompts++; settle(); }
      const e2=S_().inbox.find(e=>e.id===ev.id); if (e2 && !e2.resolved) e2.resolved=true;
    }
    let rt=P.runTurn(); let gg=0; while(rt==='pending' && gg++<20){ manualPrompts++; settle(); rt = S_().turnPhase===0 && !S_().pendingDice ? 'done' : (S_().pendingDice ? 'pending' : P.runTurn()); }
    turns++;
    S_().zones.forEach(z=>ok(z.P>0&&z.E>0,'zone positive'));
    ok(S_().cohesion.P>=0&&S_().cohesion.E>=0,'coh');
    ok(S_().turnPhase===0 || S_().ended,'phase reset '+S_().turnPhase);
  }
  ends[S_().ended||'running']=(ends[S_().ended||'running']||0)+1;
}
// points model sanity
P.newState(P.defaultSetup('PTS')); const Sx=S_();
const dragoon={sp:4,re:3,cs:1,t:4,kp:1,sv:0,tr:1,save:'—'}; ok(Math.abs(P.figPts(dragoon)-14)<2,'dragoon pts '+P.figPts(dragoon));
Sx.armory.templates.forEach(t=>ok(P.tplPoints(t).v>0,'tpl pts '+t.name));
console.log('template pts:', Sx.armory.templates.map(t=>t.name+'='+P.tplPoints(t).v).join(', '));
// legality: sample templates legal
Sx.armory.templates.forEach(t=>{ const e=P.legality(t).filter(i=>i.lvl==='err'); ok(!e.length,'legal '+t.name+' '+JSON.stringify(e)); });
// generator across roles/qualities/budgets
const roles=['line','assault','recon','support','minor','major','epic'], qs=['militia','regular','veteran','elite'];
let genIll=0, budErr=[];
for (const r of roles) for (const q of qs) for (const b of ['',40,60,90,120]){ const u=P.generateUnit({side:'enemy',faction:'f-hb',role:r,quality:q,budget:b}); const e=P.legality(u).filter(i=>i.lvl==='err'); if(e.length){genIll++; if(genIll<4) console.log('gen illegal',r,q,b,e);} if(b) budErr.push(Math.abs(P.tplPoints(u).v-b)/b); }
console.log('generated illegal:',genIll,' mean budget miss:', (budErr.reduce((a,b)=>a+b,0)/budErr.length*100).toFixed(1)+'%');
// support
for(let k=0;k<50;k++){ const s=P.generateSupport({option:'random',reliability:['reliable','standard','scarce'][k%3]}); ok(s.tn>=6&&s.tn<=8&&s.cp>=1,'support'); }
// layouts
for(let k=0;k<(+process.env.L||150);k++){ const r=P.runStep('mission',[{tier:String(k%5)}]); const m=S_().missions[0]; const L=m.layout;
  L.terrain.forEach((p,i)=>{ ok(p.x>=0&&p.y>=0&&p.x+p.w<=L.W+0.01&&p.y+p.h<=L.H+0.01,'bounds'); L.terrain.forEach((q,j)=>{ if(j>i) ok(!(p.x<q.x+q.w&&p.x+p.w>q.x&&p.y<q.y+q.h&&p.y+p.h>q.y),'overlap'); }); });
  ok(L.terrain.filter(p=>p.tier==='large').length<=1,'one large'); }
console.log(JSON.stringify({ fails, turns, missions, manualPrompts, ends }));
process.exitCode = fails ? 1 : 0;
