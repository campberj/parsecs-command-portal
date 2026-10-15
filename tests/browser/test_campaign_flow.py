"""End-to-end campaign flow: forces, templates, missions, wizard, manual dice,
battle pack printing, rules editing, import, story, campaigns, backups,
persistence across a browser restart, restore, and phone widths."""
import json, shutil
from playwright.sync_api import sync_playwright
from common import URL, Checks, launch, out

chk = Checks('campaign flow')
with sync_playwright() as pw:
    ctx, pg, errs, prof = launch(pw, accept_downloads=True)
    pg.goto(URL); pg.wait_for_function('typeof S !== "undefined" && S && S.map'); pg.wait_for_timeout(300)
    V = lambda: pg.inner_text('#view')
    chk('boots v1.0', 'v1.0' in pg.inner_text('#topbar').lower())
    for t in ['map','forces','armory','library','missions','quick','events','story','journal','mods','rules','setup']:
        pg.click(f'#tab-{t}'); pg.wait_for_timeout(40)
    chk('all tabs render, no errors', not errs)
    # forces: figure details, advance, loadout, award
    pg.click('#tab-forces'); roth = pg.evaluate("S.roster.units[0].figures.find(f=>/Roth/.test(f.name)).id")
    pg.click(f'[data-act="figopen"][data-f="{roth}"]'); chk('figure details open', pg.query_selector(f'#fadv-{roth}') is not None)
    pg.select_option(f'#fadv-{roth}', 'cs'); pg.wait_for_timeout(50)
    chk('advance bought (Combat 7 XP)', pg.evaluate(f"(()=>{{const f=S.roster.units[0].figures.find(x=>x.id==='{roth}');return f.adv.cs===2&&f.xp===0}})()"))
    pg.click(f'form[data-form="loadout"][data-f="{roth}"] input[value="w-flare"]'); pg.click(f'form[data-form="loadout"][data-f="{roth}"] button[type=submit]'); pg.wait_for_timeout(50)
    chk('loadout saved', pg.evaluate(f"S.roster.units[0].figures.find(x=>x.id==='{roth}').loadout.includes('w-flare')"))
    pg.select_option(f'select[data-chg="award"][data-f="{roth}"]', 'Lifesaving Medal'); pg.wait_for_timeout(50)
    chk('award gives XP', pg.evaluate(f"S.roster.units[0].figures.find(x=>x.id==='{roth}').xp")==1)
    # template edit -> propagation prompt
    pg.click('#tab-armory'); pg.click('[data-act="edittpl"][data-id="t-sturm"]'); pg.fill('#p_cs','2'); pg.dispatch_event('#p_cs','input'); pg.click('[data-act="savetpl"]'); pg.wait_for_timeout(80)
    chk('propagation dialog', pg.query_selector('form[data-form="propagate"]') is not None)
    pg.uncheck('form[data-form="propagate"] input[value="u-eisen"]'); pg.click('form[data-form="propagate"] button[type=submit]'); pg.wait_for_timeout(80)
    chk('Stahlschild follows, Eisenfaust keeps variant', pg.evaluate("S.roster.units.find(u=>u.id==='u-stahl').tpl==='t-sturm' && S.roster.units.find(u=>u.id==='u-eisen').tpl!=='t-sturm'"))
    # mission + orders + wizard
    pg.click('#tab-missions'); pg.click('form[data-form="genmission"] button[type=submit]'); pg.wait_for_timeout(80)
    chk('orders block', 'BATTALION ORDERS' in V() and 'Hartung' in V())
    pg.click('[data-act="wizstart"]'); pg.wait_for_timeout(50)
    pg.click('form[data-form="wiz"] button[value="next"]'); pg.wait_for_timeout(40)
    fid = pg.evaluate("Object.keys(S.ui.wiz.data.figs)[1]")
    pg.select_option(f'select[name="s|{fid}"]', 'casualty'); pg.fill(f'input[name="k|{fid}"]', '2')
    pg.click('form[data-form="wiz"] button[value="next"]'); pg.wait_for_timeout(40)
    pg.click(f'input[name="first"][value="{fid}"]'); pg.click('form[data-form="wiz"] button[value="next"]'); pg.wait_for_timeout(40)
    pg.fill(f'input[name="nt|{fid}"]', 'Took the doorway under fire'); pg.click('form[data-form="wiz"] button[value="next"]'); pg.wait_for_timeout(40)
    chk('review lists injury roll', 'Injury for' in V())
    pg.click('form[data-form="wiz"] button[value="apply"]'); pg.wait_for_timeout(120)
    chk('result applied with debrief', 'result: victory' in V().lower() and 'debrief' in V().lower())
    pg.screenshot(path=out('m10.png'), full_page=True)
    chk('note on figure record', 'Took the doorway' in pg.evaluate(f"JSON.stringify(S.roster.units.flatMap(u=>u.figures).find(f=>f.id==='{fid}'))"))
    pkt = pg.evaluate("scenePacket(S.missions[0])"); chk('scene packet', 'Took the doorway under fire' in pkt and 'Cast (voice cards)' in pkt)
    # manual dice through the wizard
    pg.click('#tab-mods'); pg.uncheck('#mod-appDice'); pg.click('#tab-missions')
    pg.click('form[data-form="genmission"] button[type=submit]'); pg.wait_for_timeout(50)
    for k in range(6):
        if pg.query_selector('.dicecard'): pg.click('[data-act="diceauto"]'); pg.wait_for_timeout(40)
    pg.click('[data-act="wizstart"]')
    for k in range(4): pg.click('form[data-form="wiz"] button[value="next"]'); pg.wait_for_timeout(30)
    pg.click('form[data-form="wiz"] button[value="apply"]'); pg.wait_for_timeout(60)
    chk('manual dice card for report', pg.query_selector('.dicecard') is not None and 'Campaign Points' in V())
    n = len(pg.query_selector_all('.dicecard input'))
    for i in range(n): pg.fill(f'#dice-{i}', '4')
    pg.click('.dicecard button[type=submit]'); pg.wait_for_timeout(80)
    for k in range(4):
        if pg.query_selector('.dicecard'): pg.click('[data-act="diceauto"]'); pg.wait_for_timeout(40)
    chk('report applied after my dice', pg.evaluate("S.missions[0].status")=='complete' and pg.evaluate("S.ui.wiz")==None)
    pg.click('#tab-mods'); pg.check('#mod-appDice')
    # battle pack + print layout to PDF
    pg.click('#tab-forces'); pg.click('[data-act="packopen"]'); pg.wait_for_timeout(60)
    ncards = len(pg.query_selector_all('.cards-preview .icard')); chk('pack preview cards', ncards >= 3)
    pg.evaluate("window.print=()=>{}"); pg.click('[data-act="packprint"]')
    chk('print root filled + Letter sheets by default', len(pg.query_selector_all('#printroot .icard'))==ncards and '11in 8.5in' in pg.inner_text('#pagesize') and len(pg.query_selector_all('#printroot .sheet'))==-(-ncards//4))
    pg.select_option('#pk-paper', 'cards'); pg.wait_for_timeout(80); pg.click('[data-act="packprint"]')
    chk('index-card mode: one card per 5x3 page', len(pg.query_selector_all('#printroot .sheet'))==0 and '5in 3in' in pg.inner_text('#pagesize'))
    pg.emulate_media(media='print'); pg.pdf(path=out('pack.pdf'), width='5in', height='3in', print_background=True, prefer_css_page_size=True); pg.emulate_media(media='screen')
    # rules: invalid then valid edit, persists
    pg.click('#tab-rules'); pg.click('[data-act="rtab"][data-k="unitLosses"]'); pg.fill('input[name="c|3|max"]', '5')
    pg.click('form[data-form="rtable"] button[value="save"]'); pg.wait_for_timeout(50); chk('validation blocks bad table', 'must end at 6' in V())
    pg.fill('input[name="c|3|max"]', '6'); pg.fill('input[name="c|2|battles"]', '2'); pg.select_option('#r-status','keyed')
    pg.click('form[data-form="rtable"] button[value="save"]'); pg.wait_for_timeout(50)
    chk('table saved keyed', pg.evaluate("RULES.tables.unitLosses.status")=='keyed' and pg.evaluate("RULES.tables.unitLosses.rows[2].battles")==2)
    pg.click('[data-act="rtab"][data-k="story"]'); pg.click('form[data-form="rtable"] summary'); pg.fill('#r-paste', '1-50\tQuiet week\tNothing happens.\t\n51-100\tReinforcements\tMore troops.\treinf')
    pg.click('form[data-form="rtable"] button[value="paste"]'); pg.wait_for_timeout(40); pg.click('form[data-form="rtable"] button[value="save"]'); pg.wait_for_timeout(40)
    chk('pasted table saved', pg.evaluate("RULES.tables.story.rows.length")==2 and pg.evaluate("RULES.tables.story.rows[1].effect")=='reinf')
    # import dialog
    bundle = pg.evaluate("JSON.stringify(Object.assign(bundleFor('units',['u-kerner']),{units:[Object.assign(bundleFor('units',['u-kerner']).units[0],{name:'Kerner (imported edit)'})]}))")
    pg.click('#tab-forces'); pg.click('[data-act="importopen"]'); pg.fill('#imp-text', bundle); pg.click('[data-act="importparse"]'); pg.wait_for_timeout(50)
    chk('diff preview shows change', 'changed' in pg.inner_text('#modal') and 'Kerner (imported edit)' in pg.inner_text('#modal'))
    pg.click('form[data-form="importapply"] button[type=submit]'); pg.wait_for_timeout(50)
    chk('import applied', pg.evaluate("S.roster.units.find(u=>u.id==='u-kerner').name")=='Kerner (imported edit)')
    # story tab: edit a voice
    pg.click('#tab-story'); pg.click('details summary >> nth=0'); pg.fill('form[data-form="voice"] textarea[name="l_close"] >> nth=0', 'Dismissed, Unteroffizier.'); pg.click('form[data-form="voice"] button[type=submit] >> nth=0'); pg.wait_for_timeout(40)
    chk('voice saved', pg.evaluate("S.content.voices[0].lines.close[0]")=='Dismissed, Unteroffizier.')
    # campaigns: new slot, switch, persist
    first_id = pg.evaluate("S.id"); pg.click('#tab-setup'); pg.fill('#nc-name','Fringe Detachment'); pg.fill('#nc-seed','FRINGE'); pg.click('form[data-form="newcampaign"] button[type=submit]'); pg.wait_for_timeout(150)
    chk('second campaign slot', pg.evaluate("META.campaigns.length")==2 and pg.evaluate("S.setup.name")=='Fringe Detachment')
    pg.click('#tab-setup'); pg.click(f'[data-act="campopen"][data-id="{first_id}"]'); pg.wait_for_timeout(150)
    chk('switched back', pg.evaluate("S.id")==first_id and pg.evaluate("S.missions.length")==2)
    # download backup
    pg.click("#tab-setup")
    with pg.expect_download() as dl: pg.click('[data-act="dlbackup"]')
    path = dl.value.path(); bk = json.load(open(path)); chk('backup holds both campaigns + rules', len(bk['campaigns'])==2 and bk['rules']['tables']['unitLosses']['status']=='keyed')
    shutil.copy(path, out('backup.json'))
    pg.wait_for_timeout(400)
    ctx.close()
    # relaunch the same profile: file:// storage persists?
    ctx = pw.chromium.launch_persistent_context(prof, viewport={'width':1280,'height':900}, accept_downloads=True)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_function('typeof S !== "undefined" && S && S.map'); pg.wait_for_timeout(300)
    chk('after browser restart: same campaign open', pg.evaluate("S.id")==first_id and pg.evaluate("S.missions.length")==2)
    chk('after restart: rules pack kept', pg.evaluate("RULES.tables.unitLosses.status")=='keyed')
    chk('after restart: both slots listed', pg.evaluate("META.campaigns.length")==2)
    # wipe storage (simulates clearing browsing data) then restore from backup file
    pg.evaluate("localStorage.clear(); indexedDB.deleteDatabase('parsecs-command')"); pg.wait_for_timeout(200); pg.reload(); pg.wait_for_function('typeof S !== "undefined" && S && S.map'); pg.wait_for_timeout(300)
    chk('cleared storage falls back to example', pg.evaluate("META.campaigns.length")==1)
    pg.click('#tab-setup'); pg.set_input_files('#restore-file', out('backup.json')); pg.wait_for_timeout(200)
    chk('restore dialog', pg.query_selector('form[data-form="restore"]') is not None)
    pg.check('form[data-form="restore"] input[name="rules"]'); pg.click('form[data-form="restore"] button[type=submit]'); pg.wait_for_timeout(400)
    chk('restored campaigns + rules', pg.evaluate("META.campaigns.length")==3 and pg.evaluate("RULES.tables.unitLosses.status")=='keyed' and pg.evaluate("S.id")==first_id)
    # phone widths
    pg.set_viewport_size({'width':400,'height':900}); worst = 0
    for t in ['map','forces','armory','library','missions','quick','events','story','journal','mods','rules','setup']:
        pg.click(f'#tab-{t}'); pg.wait_for_timeout(40); w = pg.evaluate('document.documentElement.scrollWidth'); worst = max(worst, w)
        if w > 400: print('  wide tab', t, w)
    chk('phone: no horizontal page scroll', worst <= 400)
    pg.click('#tab-forces'); pg.screenshot(path=out('phone10.png'), full_page=False)
    chk('no page errors', not errs); print(errs[:3])
    ctx.close()
chk.finish()
