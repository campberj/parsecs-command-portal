"""Shared helpers for the Playwright browser suites.

The suites drive dist/index.html (run `node build.mjs` first; `npm run test:browser` does).
Set PORTAL_URL to test another copy, e.g. the published GitHub Pages site.
Screenshots and PDFs land in tests/browser/out/ (git-ignored)."""
import os, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
URL = os.environ.get('PORTAL_URL') or (ROOT / 'dist' / 'index.html').as_uri()
PACKS = ROOT / 'packs'
FIXTURES = ROOT / 'tests' / 'fixtures'
OUT = Path(__file__).resolve().parent / 'out'
OUT.mkdir(exist_ok=True)
CIS_PACK = str(PACKS / 'separatist-alliance-pack.json')

def out(name):
    return str(OUT / name)

class Checks:
    def __init__(self, name):
        self.name, self.res = name, []
    def __call__(self, label, cond):
        self.res.append((label, bool(cond)))
        print(('ok   ' if cond else 'FAIL ') + label)
    def finish(self):
        passed = sum(1 for _, c in self.res if c)
        print(f'{self.name}: {passed}/{len(self.res)}')
        sys.exit(0 if passed == len(self.res) else 1)

def launch(pw, width=1280, height=900, profile=None, **kw):
    """Fresh persistent profile (so IndexedDB/localStorage behave as in a real browser)."""
    profile = profile or tempfile.mkdtemp()
    ctx = pw.chromium.launch_persistent_context(profile, viewport={'width': width, 'height': height}, **kw)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    return ctx, pg, errs, profile

def boot(pg):
    pg.goto(URL)
    pg.wait_for_function('typeof S !== "undefined" && S && S.map')
    pg.wait_for_timeout(300)

def import_pack(pg, path=CIS_PACK):
    pg.click('#tab-forces'); pg.click('[data-act="importopen"]')
    pg.set_input_files('#imp-ufile', str(path)); pg.wait_for_timeout(300)
    pg.click('form[data-form="importapply"] button[type=submit]'); pg.wait_for_timeout(200)

def no_hscroll(pg):
    return pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
