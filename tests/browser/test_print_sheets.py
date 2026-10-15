"""Card printing: 3x5 and 4x6 cards on US Letter sheets, one-card-per-page mode, campaign battle pack."""
from playwright.sync_api import sync_playwright
from common import Checks, launch, boot, import_pack, out

chk = Checks('print sheets')
with sync_playwright() as pw:
    ctx, pg, errs, _ = launch(pw)
    boot(pg); import_pack(pg)
    pg.click('#tab-quick'); pg.select_option('#qb-tier', '3'); pg.select_option('#qb-player', 'f-78'); pg.select_option('#qb-opp', 'f-cis'); pg.fill('#qb-seed', 'SHEET')
    pg.click('form[data-form="quick"] button[type=submit]'); pg.wait_for_timeout(400)
    pg.evaluate("window.print = () => {}")
    per_sheet = {'35': 4, '46': 2}
    for size, paper, name in [('35', 'letter', 'q35_letter'), ('46', 'letter', 'q46_letter'), ('35', 'cards', 'q35_cards')]:
        pg.select_option('#qb-size', size); pg.select_option('#qb-paper', paper); pg.wait_for_timeout(150)
        pg.click('[data-act="qprint"]'); pg.wait_for_timeout(200)
        pg.emulate_media(media='print'); pg.pdf(path=out(name + '.pdf'), prefer_css_page_size=True, print_background=True); pg.emulate_media(media='screen')
        cards = pg.evaluate("document.querySelectorAll('#printroot .icard').length"); sheets = pg.evaluate("document.querySelectorAll('#printroot .sheet').length")
        if paper == 'letter':
            chk(f'{name}: {cards} cards on {sheets} sheets', cards > 0 and sheets == -(-cards // per_sheet[size]))
        else:
            chk(f'{name}: one card per page', cards > 0 and sheets == 0)
    pg.click('#tab-forces'); pg.wait_for_timeout(150); pg.click('[data-act="packopen"]'); pg.wait_for_timeout(200)
    pg.select_option('#pk-paper', 'letter'); pg.wait_for_timeout(150)
    pg.click('[data-act="packprint"]'); pg.wait_for_timeout(200)
    pg.emulate_media(media='print'); pg.pdf(path=out('pack_letter.pdf'), prefer_css_page_size=True, print_background=True)
    cards = pg.evaluate("document.querySelectorAll('#printroot .icard').length"); sheets = pg.evaluate("document.querySelectorAll('#printroot .sheet').length")
    chk(f'campaign pack: {cards} cards on {sheets} sheets', cards > 0 and sheets == -(-cards // 4))
    chk('no page errors', not errs)
    ctx.close()
chk.finish()
