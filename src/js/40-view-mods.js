/* ----- mods ----- */
function viewMods(){
  const M = S.mods;
  const tog = (k, label, desc) => `<label class="chk"><input type="checkbox" data-chg="mod" data-k="${k}" id="mod-${k}" ${M[k] ? 'checked' : ''}><span><b>${label}</b><br><span class="small muted">${desc}</span></span></label>`;
  const diff = [['Dice','App rolls','App rolls', appDice() ? 'App rolls' : 'You roll; asked once per step'], ['Army Builder points','Tracked','Tracked', M.points ? 'Tracked (estimated)' : 'Off'], ['Custom units','Army Builder legal','Army Builder legal', M.freeform ? 'Freeform' : 'Army Builder legal'],
    ['Movement multiplier','×1','×1',`×${moveMult()}`],['Range multiplier','×1','×1',`×${rangeMult()}`],['Sturm grenadier Speed','4"','4"',`${half(4 * moveMult())}"`],['Lasgun range','30"','30"',`${half(30 * rangeMult())}"`],
    ['Suppression','Per unit','Per unit', M.ia ? 'Per figure' : 'Per unit'],['Failed Morale','Broken','Broken', M.ia ? 'Pinned; rout at Training +1 or lower' : 'Broken'],['Piercing','5P:T trait','5P:T trait', M.ia ? 'Ignores armor saves (5PFH)' : '5P:T trait'],
    ['Enemy targeting','Book random picks','Personality scoring', M.bookAI ? 'Book random picks' : `${personality('E')} scoring`],['Enemy strength on map','Visible','Visible', M.fog ? 'Hidden until scouted' : 'Visible'],['Story event pace','Every 2 turns','Every 2 turns',`Every ${M.pace} turn(s)`]];
  diff.push(['Experience','Per unit','Per unit', M.figureXP ? 'Per unit and per named figure' : 'Per unit']);
  const tags = ['logistics','intel','support','chain','civilians','command','personnel'];
  return `<div class="cols-2">
      <div class="panel stack"><h3>Campaign-wide</h3>
        ${tog('appDice','App rolls the dice','On by default. Turn off to roll your own: each step lists every die it needs on one card, and asks again only if a result calls for more.')}
        ${tog('points','Army Builder points','On by default. Points show on templates, units, the roster total and missions. Estimated until the Master Points Costs table is keyed in.')}
        ${tog('freeform','Freeform custom units','Off by default. The unit builder and generator follow the Army Builder; switch on to save units that break its limits.')}</div>
      <div class="panel stack"><div class="panel-h"><h3>Independent Action</h3><span class="chip">mod pack v1</span></div>
        ${tog('ia','Enable Independent Action','1.5× distance scaling, per-figure suppression and Reaction, Pinned replaces Broken, Piercing ignores saves, Anti-Tank +1 vs vehicles, Sniping +1 stationary, Stream line template ignoring cover, dual-slot armor T1–T4, tag-based modular weapons.')}
        <p class="small muted">Battle-level rules print on every operation order; the 2.0 battle companion will enforce them.</p></div>
      <div class="panel stack"><h3>Distances</h3>
        <label class="f"><span>Movement multiplier ${M.ia ? '(locked by IA)' : ''}</span><input type="number" step="0.25" min="0.5" max="3" value="${M.moveMult}" data-chg="modnum" data-k="moveMult" id="mod-moveMult" ${M.ia ? 'disabled' : ''}></label>
        <label class="f"><span>Range multiplier ${M.ia ? '(locked by IA)' : ''}</span><input type="number" step="0.25" min="0.5" max="3" value="${M.rangeMult}" data-chg="modnum" data-k="rangeMult" id="mod-rangeMult" ${M.ia ? 'disabled' : ''}></label></div>
      <div class="panel stack"><h3>Campaign layer</h3>
        ${tog('fog','Fog of war','Enemy Army Strength shows as ? until you fight or scout in that zone; it fades after two turns.')}
        ${tog('bookAI','Book AI','The enemy picks targets at random, as the book does, instead of by personality.')}
        ${tog('autoPBP','Spend battle points automatically','Saved PBP add combat dice in the zone fight at turn end.')}
        ${tog('tableReadyOnly','Field table-ready units only','Missions draw only on units whose miniatures are painted.')}
        ${tog('mercenary','FCG mercenary economy','Munitions Points after each battle.')}
        ${tog('fcgSecondSkill','FCG second veteran skill','Squads may buy a second squad and sergeant skill at +5 XP.')}
        <label class="f"><span>Story event every N turns</span><input type="number" min="1" max="6" value="${M.pace}" data-chg="modnum" data-k="pace" id="mod-pace"></label>
        <label class="f"><span>Interactive event chance per turn (%)</span><input type="number" min="0" max="100" step="10" value="${M.eventChance}" data-chg="modnum" data-k="eventChance" id="mod-eventChance"></label></div>
      <div class="panel stack"><h3>Personnel and story</h3>
        ${tog('figureXP','Per-figure experience','Named figures earn XP from the Figure Experience table and buy advances, as in Independent Action campaigns. Units still earn unit XP for veteran skills.')}
        <label class="f"><span>Veteran skills are bought with</span><select data-chg="modsel" data-k="skillCurrency" id="mod-skillCurrency"><option value="xp" ${M.skillCurrency !== 'cp' ? 'selected' : ''}>Unit XP (FCG: D6 XP per battle, listed cost, second skill +${RP('skillPremium')})</option><option value="cp" ${M.skillCurrency === 'cp' ? 'selected' : ''}>Campaign Points (core: ${RP('skillCP')} CP a skill, ${RP('retrainCP')} CP to retrain, one of each)</option></select></label>
        ${tog('fieldStab','Field stabilization','A casualty stabilized on the table rerolls its injury; the second result stands.')}
        ${tog('refitDefault','Refit cost on template edits','When a template edit reaches roster units, charge the refit cost by default. You can still untick it each time.')}
        <label class="f"><span>Scenes</span><select data-chg="modsel" data-k="scenes" id="mod-scenes">${[['off','Off'],['briefings','Briefings and debriefs only'],['events','Plus milestones and random events'],['every','Plus squad talk after every mission']].map(([k, l]) => `<option value="${k}" ${M.scenes === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${tog('squadTalk','Squad talk in debriefs','Squad voice cards add a few lines after the command debrief when something notable happened.')}</div>
      <div class="panel stack"><h3>Battle rules printed on briefs</h3>
        ${tog('strictOverwatch','Strict Overwatch','Units must be stationary to enter Overwatch.')}${tog('individualActions','Individual Actions','Each figure in a squad may pick its own action.')}
        ${tog('retreat','Retreat','A unit may retreat to cover instead of testing Morale.')}${tog('landSomewhere','It Has to Land Somewhere','Missed Area shots scatter instead of vanishing.')}</div>
      <div class="panel stack"><h3>Content filter</h3><p class="small muted">Excluded tags never appear in events for this universe.</p>
        ${tags.map(t => `<label class="chk"><input type="checkbox" data-chg="tag" data-k="${t}" id="tag-${t}" ${M.excludeTags.includes(t) ? 'checked' : ''}> Exclude <span class="chip">${t}</span></label>`).join('')}</div></div>
    <div class="panel"><h3>Effective rules</h3><div class="tblwrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Rule</th><th>Book</th><th>Portal default</th><th>This campaign</th></tr></thead><tbody>${diff.map(r => `<tr><td>${r[0]}</td><td class="muted">${r[1]}</td><td class="muted">${r[2]}</td><td>${r[2] !== r[3] ? `<b style="color:var(--accent)">${esc(r[3])}</b>` : esc(r[3])}</td></tr>`).join('')}</tbody></table></div></div>`;
}

