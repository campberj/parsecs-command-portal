"""Replacing the old pre-scaled (IA) Separatist pack with the book-scale one; weapons show book ranges."""
from playwright.sync_api import sync_playwright
from common import Checks, launch, boot, import_pack, CIS_PACK, FIXTURES

chk = Checks('pack scale UI')
with sync_playwright() as pw:
    ctx, pg, errs, _ = launch(pw)
    boot(pg)
    import_pack(pg, FIXTURES / 'separatist-ia-prescaled-pack.json')
    chk('pre-scaled pack imported', pg.evaluate("S.armory.factions.some(f => f.id === 'f-cis')"))
    pg.click('#tab-forces'); pg.click('[data-act="importopen"]'); pg.set_input_files('#imp-ufile', CIS_PACK); pg.wait_for_timeout(300)
    chk('import preview shows changes', 'changed' in pg.inner_text('#modal').lower())
    pg.click('form[data-form="importapply"] button[type=submit]'); pg.wait_for_timeout(200)
    chk('faction now book scale', pg.evaluate("!/(Independent Action|IA) OFF/.test(S.armory.factions.find(f => f.id === 'f-cis').notes || '')"))
    pg.click('#tab-setup'); pg.select_option('#nc-player', 'f-cis'); pg.select_option('#nc-opp', 'f-78'); pg.fill('#nc-name', 'Droid Front')
    pg.click('form[data-form="newcampaign"] button[type=submit]'); pg.wait_for_timeout(400)
    pg.click('#tab-forces'); pg.wait_for_timeout(200)
    chk('E-5 blaster rifle listed on the roster', any('E-5 blaster rifle' in l for l in pg.inner_text('#view').split('\n')))
    chk('no page errors', not errs)
    ctx.close()
chk.finish()
