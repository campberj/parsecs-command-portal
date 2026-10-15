"""Quick battle tab: generate, reroll each part, print, random pairing, reload, phone width."""
from playwright.sync_api import sync_playwright
from common import Checks, launch, boot, import_pack, no_hscroll, out

chk = Checks('quick battle UI')
with sync_playwright() as pw:
    ctx, pg, errs, _ = launch(pw)
    boot(pg); import_pack(pg)
    pg.click('#tab-quick'); pg.wait_for_timeout(150)
    pg.select_option('#qb-tier', '3'); pg.select_option('#qb-player', 'f-78'); pg.select_option('#qb-opp', 'f-cis'); pg.select_option('#qb-region', 'Urban')
    pg.click('form[data-form="quick"] button[type=submit]'); pg.wait_for_timeout(400)
    chk('battle generated 78th vs Separatists', pg.evaluate("S.quick && S.quick.player.faction === 'f-78' && S.quick.opp.faction === 'f-cis'"))
    chk('header shows the matchup', any(' VS ' in l.upper() for l in pg.inner_text('#view').split('\n')))
    pg.screenshot(path=out('qb_top.png'))
    for k in ['terrain', 'objectives', 'conditions', 'forces']:
        pg.click(f'[data-act="qreroll"][data-k="{k}"]'); pg.wait_for_timeout(150)
    chk('rerolls keep the battle', pg.evaluate("!!S.quick && S.quick.units.length > 0"))
    pg.click('[data-act="qlmode"][data-k="zones"]'); pg.wait_for_timeout(100)
    pg.evaluate("window.print = () => { window.__printed = true; }")
    pg.click('[data-act="qprint"]'); pg.wait_for_timeout(200)
    chk('print called with cards', pg.evaluate("window.__printed === true") and pg.evaluate("document.querySelectorAll('#printroot .icard').length") > 1)
    pg.select_option('#qb-player', ''); pg.select_option('#qb-opp', ''); pg.click('form[data-form="quick"] button[type=submit]'); pg.wait_for_timeout(300)
    chk('random pairing uses two different factions', pg.evaluate("S.quick.player.faction !== S.quick.opp.faction"))
    chk('campaign missions untouched', pg.evaluate("S.missions.length") == 0)
    pg.reload(); pg.wait_for_function('typeof S !== "undefined" && S && S.map'); pg.wait_for_timeout(300)
    chk('quick battle survives reload', pg.evaluate("!!S.quick"))
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.click('#tab-quick'); pg.wait_for_timeout(200)
    chk('phone: no horizontal scroll', no_hscroll(pg))
    chk('no page errors', not errs)
    ctx.close()
chk.finish()
