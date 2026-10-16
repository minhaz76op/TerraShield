"""
TerraShield — SQA regression checks (v3.1.1) for bugs found in the full-project QA pass. Python + Playwright.
Runs on the double-clicked dist/terrashield.html (no server, network blocked):
  password change in tab A logs out tab B · admin note with HTML/script shown as plain text (no XSS) ·
  tampered backup is cleaned before it is stored and really used · odd payloads give an error, not a crash ·
  all admin tabs visible at 320 px with no sideways scroll · log links at least 24 px · every wizard step and
  the review page have exactly one <h1> · skip link marked with the right languages · no console errors.
Run:  python3 tests/browser_sqa_check.py
"""
import json, pathlib, sys, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
EMAIL, PASS = 'demo.admin@terrashield.local', 'TerraShield-Demo-2026'   # demo account
failures, checks = [], 0

def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

def req(pg, method, path, body=None):
    return pg.evaluate("([m, p, b]) => TS.adminLocal.request(m, p, b)", [method, path, body])

def watch(pg, errors):
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

with sync_playwright() as p:
    url = (ROOT / 'dist/terrashield.html').as_uri()
    ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(prefix='ts-sqa-'), viewport={'width': 1366, 'height': 900})
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:', 'blob:')) else r.abort())
    errors = []
    a = ctx.pages[0] if ctx.pages else ctx.new_page(); watch(a, errors)
    a.goto(url); a.wait_for_selector('.hero-forest')

    print('\n== Sessions across tabs ==')
    ok(req(a, 'POST', 'login', {'email': EMAIL, 'password': PASS})['status'] == 200, 'Tab A: demo account created on first visit and logged in')
    b = ctx.new_page(); watch(b, errors); b.goto(url); b.wait_for_selector('.hero-forest')
    ok(req(b, 'POST', 'login', {'email': EMAIL, 'password': PASS})['status'] == 200, 'Tab B: logged in')
    ok(req(a, 'POST', 'setup', {'email': 'x@y.zz', 'password': 'another-pass-1'})['status'] in (401, 404), 'No setup route any more — nobody can replace the admin account')
    ok(req(a, 'POST', 'password', {'current': PASS, 'next': 'another-pass-2026'})['status'] == 403, 'Demo password cannot be changed (403) — the shown login always works')
    ok(req(b, 'GET', 'session')['body']['loggedIn'] is True, 'Tab B still logged in')
    req(a, 'POST', 'records', {'type': 'deed', 'data': {'mouzaId': 'M901', 'dag': 101, 'deedNo': '9100/2026', 'date': '2026-10-02', 'sellerId': 'O01', 'buyerId': 'P99', 'area': 10}})
    a.evaluate("(() => { const d = JSON.parse(localStorage.getItem('terrashield-admin-v1')); d.auth = { email: 'old@own.test', salt: d.auth.salt, hash: 'B'.repeat(43) + '=', iter: 310000, alg: 'PBKDF2-SHA256' }; localStorage.setItem('terrashield-admin-v1', JSON.stringify(d)); })()")
    s = req(b, 'GET', 'session')['body']
    ok(s['loggedIn'] is False and s.get('demo', {}).get('password') == PASS, 'An account from an older version is switched to the demo account; other tabs must log in again')
    ok(req(b, 'POST', 'login', {'email': EMAIL, 'password': PASS})['status'] == 200 and len(json.loads(b.evaluate("localStorage.getItem('terrashield-admin-v1')"))['records']) == 1, '…demo login works and the admin records are kept')
    ok(req(a, 'POST', 'login', {'email': EMAIL, 'password': PASS})['status'] == 200, 'Tab A logs in again with the demo details')
    b.close()

    print('\n== Hostile input ==')
    xss = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>'
    r = req(a, 'POST', 'records', {'type': 'deed', 'note': xss, 'data': {'mouzaId': 'M901', 'dag': 101, 'deedNo': '9001/2026', 'date': '2026-10-01', 'sellerId': 'O01', 'buyerId': 'P99', 'area': 40}})
    ok(r['status'] == 201, 'Record with an HTML note saved')
    a.evaluate("location.hash = '#/admin/log'"); a.wait_for_selector('.ad-loglist, .ad-table', timeout=15000); a.wait_for_timeout(300)
    ok(a.evaluate('window.__xss') is None and '<img src=x' in a.inner_text('#admin-root') and a.locator('#admin-root img[src=x]').count() == 0, 'Note shown as plain text in the change log; no script ran (no XSS)')
    ok('অফলাইন প্রোটোটাইপ' in a.inner_text('.ad-head') and 'localhost' not in a.inner_text('.ad-head'), 'File mode labelled "offline prototype · this browser", not "localhost"')
    odd = [{'type': {}, 'data': {}}, {'type': 'deed', 'data': 5}, {'type': 'deed', 'data': None},
           {'type': 'khatian', 'data': {'owners': [None, 5], 'mouzaId': 'M901', 'dag': 101}},
           {'type': 'deed', 'data': {'mouzaId': {'a': 1}, 'dag': [1], 'sellerId': True}}]
    ok(all(req(a, 'POST', 'records', o)['status'] == 400 for o in odd), 'Odd payloads → 400 error message, never a crash (500)')
    evil = {'app': 'terrashield-admin-backup', 'db': {'version': 1, 'createdAt': 'x', 'nextId': 2, 'log': [],
            'records': [{'id': 'AR-1', 'type': 'deed', 'status': 'reviewed', 'junk': 1, 'history': [],
                         'data': {'id': 'AD-1', 'office': 'X', 'mouzaId': 'M901', 'dag': '101', 'deedNo': '9001/2026', 'date': '2026-10-01',
                                  'sellerId': 'O01', 'buyerId': 'P99', 'area': '40', '_src': 'base', 'extra': 'z'}}]}}
    ok(req(a, 'POST', 'import', {'confirm': True, 'backup': evil})['status'] == 200, 'Tampered backup accepted after cleaning')
    rec = json.loads(a.evaluate("localStorage.getItem('terrashield-admin-v1')"))['records'][0]
    ok(rec['data']['dag'] == 101 and rec['data']['area'] == 40 and 'extra' not in rec['data'] and '_src' not in rec['data'] and 'junk' not in rec, 'Stored record rebuilt: numbers fixed, unknown keys dropped')
    a.evaluate("location.hash = '#/'"); a.reload(); a.wait_for_selector('.hero-forest'); a.wait_for_timeout(300)
    ok(a.evaluate("TS.engine.check({mouzaId:'M901',dag:101,sellerId:'O01',area:20}, TS.data).status") == 'red', 'Restored record is really used by the check (red)')
    ok(a.evaluate("TS.engine.check({mouzaId:'M901',dag:101,sellerId:'O01',area:20}, TS.baseData).status") == 'green', 'Bundled fictional data untouched (green)')

    print('\n== Small screens and accessibility ==')
    a.set_viewport_size({'width': 320, 'height': 740})
    a.evaluate("location.hash = '#/admin'"); a.wait_for_selector('.ad-tabs a, .ad-tabs button', timeout=15000); a.wait_for_timeout(300)
    vis = a.evaluate("""() => [...document.querySelectorAll('.ad-tabs a, .ad-tabs button')].map(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5 && r.width > 0; })""")
    ok(len(vis) >= 3 and all(vis), f'All {len(vis)} admin tabs fully visible at 320 px')
    ok(a.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'No sideways scroll on the dashboard at 320 px')
    a.evaluate("location.hash = '#/admin/log'"); a.wait_for_timeout(800)
    sizes = a.evaluate("""() => [...document.querySelectorAll('.ad-table a, .ad-loglist a')].map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); })""")
    ok(len(sizes) > 0 and min(sizes) >= 24, f'Log links are at least 24 px (smallest {min(sizes) if sizes else "-"})')
    ok(a.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'No sideways scroll on the log at 320 px')
    a.set_viewport_size({'width': 1366, 'height': 900})
    a.evaluate("TS.ui.state.form = TS.ui.blankForm(); location.hash = '#/step/1'"); a.wait_for_selector('[data-act=mouza]')
    h1s = []
    def count(): return a.evaluate("document.querySelectorAll('h1').length")
    h1s.append(count()); a.click('[data-act=mouza][data-id=M901]'); a.click('[data-act=next]')
    a.wait_for_selector('#f-dag'); h1s.append(count()); a.fill('#f-dag', '101'); a.click('[data-act=next]')
    a.wait_for_selector('[data-act=seller]'); h1s.append(count()); a.click('[data-act=seller][data-id=O01]'); a.click('[data-act=next]')
    a.wait_for_selector('#f-area'); h1s.append(count()); a.fill('#f-area', '20'); a.click('[data-act=next]')
    a.wait_for_timeout(200); h1s.append(count()); a.click('[data-act=next]')
    a.wait_for_selector('[data-act=run]'); h1s.append(count())
    ok(h1s == [1] * 6, f'Wizard steps 1–5 and review each have exactly one h1 {h1s}')
    ok('ধাপ' in a.inner_text('h1') or 'যাচাই' in a.inner_text('h1'), 'Wizard h1 names the page')
    langs = a.evaluate("[...document.querySelectorAll('.skip-link [lang]')].map(e => e.lang)")
    ok(langs == ['bn', 'en'], f'Skip link marked bn + en {langs}')
    ok(not errors, 'No console errors' + ('' if not errors else ': ' + ' | '.join(errors[:3])))
    ctx.close()

print(f'\n{checks - len(failures)}/{checks} checks passed')
sys.exit(1 if failures else 0)
