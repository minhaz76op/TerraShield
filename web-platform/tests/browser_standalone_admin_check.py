"""
TerraShield — Admin Panel inside the DOUBLE-CLICKED file (no server). Python + Playwright.
Runs on dist/terrashield.html and web/index.html opened from disk, network blocked, using a PERSISTENT
browser profile so "close the browser and open the file again" is real:
  header button → login page shows the labelled local demo account (email + password + copy buttons; no notice boxes)
  → demo login → dashboard (the two removed notices stay gone) → add record → draft has no effect →
  approve → the website's own check uses it (labelled) → samples / 14 tests unchanged → password stored
  only as a hash → CLOSE BROWSER → reopen file: record still there and still used, login asked again →
  archive / restore / approve → second tab follows → backup download (no password inside) → reset →
  restore backup → change password → idle timeout → lockout → broken storage handled → English →
  accessibility (axe) light + dark → no console errors.
Run:  python3 tests/browser_standalone_admin_check.py      (AXE_PATH=/path/to/axe.min.js for the audit)
"""
import json, os, pathlib, sys, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
AXE = pathlib.Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') and pathlib.Path(os.environ['AXE_PATH']).exists() else None
EMAIL, PASS = 'demo.admin@terrashield.local', 'TerraShield-Demo-2026'   # the public demo account (fixed in the file)
GONE = ['এই ফাইলে অ্যাডমিন রেকর্ড শুধু এই কম্পিউটারের', 'মানে টিমের একজন অ্যাডমিন রেকর্ডটি দেখেছেন', 'admin records are saved only in this browser', 'means a team admin has looked at the record']
failures, checks = [], 0

def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

def open_ctx(p, profile):
    ctx = p.chromium.launch_persistent_context(profile, viewport={'width': 1366, 'height': 900}, accept_downloads=True)
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:', 'blob:')) else r.abort())
    return ctx

def own_check(pg, dag='101', seller='O01', area='20'):
    pg.evaluate("TS.ui.state.form = TS.ui.blankForm(); TS.ui.state.errors = {}; location.hash = '#/step/1'")
    pg.wait_for_selector('[data-act=mouza][data-id=M901]'); pg.click('[data-act=mouza][data-id=M901]'); pg.click('[data-act=next]')
    pg.wait_for_selector('#f-dag'); pg.fill('#f-dag', dag); pg.click('[data-act=next]')
    pg.wait_for_selector(f'[data-act=seller][data-id={seller}]'); pg.click(f'[data-act=seller][data-id={seller}]'); pg.click('[data-act=next]')
    pg.wait_for_selector('#f-area'); pg.fill('#f-area', area); pg.click('[data-act=next]'); pg.click('[data-act=next]')
    pg.wait_for_selector('[data-act=run]'); pg.click('[data-act=run]'); pg.wait_for_selector('.result-head', timeout=8000); pg.wait_for_timeout(150)
    return pg.get_attribute('.result-head', 'class')

def admin(pg, sub=''):
    pg.evaluate(f"location.hash = '#/admin{('/' + sub) if sub else ''}'"); pg.wait_for_timeout(150)
    pg.wait_for_selector('#admin-main:not([aria-busy]), #ad-email', timeout=15000); pg.wait_for_timeout(120)

def login(pg, email=EMAIL, pw=PASS):
    pg.fill('#ad-email', email); pg.fill('#ad-pass', pw); pg.click('#ad-login-form [type=submit]'); pg.wait_for_timeout(1200)

def axe(pg):
    pg.add_script_tag(content=AXE)
    return pg.evaluate("""async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, preload: false })).violations.map(x => x.id + ':' + x.nodes.length)""")

def watch(pg, errors):
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type in ('error', 'warning') else None)

with sync_playwright() as p:
    for name in ['dist/terrashield.html', 'web/index.html']:
        print(f'\n== {name} (double-clicked file, no server) ==')
        url = (ROOT / name).as_uri()
        profile = tempfile.mkdtemp(prefix='ts-profile-')
        errors = []

        # ---------- First visit ----------
        ctx = open_ctx(p, profile); pg = ctx.pages[0] if ctx.pages else ctx.new_page(); watch(pg, errors)
        pg.goto(url); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(300)
        ok(pg.evaluate('TS.dataSource.served') is False and pg.evaluate('TS.dataMeta.source') == 'bundled', 'Opened as a file: no server, bundled fictional data')
        ok('green' in own_check(pg), 'Own check M901/101 Rahim 20 → green before any admin record')
        pg.evaluate("location.hash = '#/'"); pg.wait_for_timeout(200)
        pg.click('.site-header .hdr-admin'); pg.wait_for_selector('.ad-demo', timeout=15000)
        ok(pg.evaluate('location.hash') == '#/admin' and pg.locator('#ad-login-form').count() == 1, 'Header "অ্যাডমিন প্যানেল" opens the working panel: Admin Login (no setup step)')
        demo = pg.inner_text('.ad-demo')
        ok('ডেমো অ্যাডমিন লগইনের জন্য নিচের তথ্য ব্যবহার করুন।' in demo and 'লোকাল ডেমো অ্যাকাউন্ট' in demo, 'Login page: exact Bangla instruction + "local demo account" label')
        ok(pg.inner_text('#ad-demo-email') == EMAIL and pg.inner_text('#ad-demo-password') == PASS, 'Login page shows the actual demo email and password')
        cps = pg.eval_on_selector_all('.ad-demo [data-aa=copy]', 'e => e.map(x => x.getAttribute("data-copy") + ":" + x.getAttribute("aria-label"))')
        ok(cps == ['email:ডেমো ইমেইল কপি করুন', 'password:ডেমো পাসওয়ার্ড কপি করুন'], f'A separate, labelled Copy button beside each credential {cps}')
        pg.click('[data-copy=password]'); pg.wait_for_timeout(300)
        ok('কপি হয়েছে' in pg.inner_text('#ad-demo-status'), 'Copy button → "copied" message (screen readers hear it too)')
        body = pg.inner_text('#admin-root')
        ok(pg.locator('#admin-root .notice').count() == 0 and not any(g in body for g in GONE), 'Login page: the two removed notice boxes are not there')
        login(pg, pg.inner_text('#ad-demo-email'), pg.inner_text('#ad-demo-password')); pg.wait_for_selector('.ad-tiles', timeout=15000)
        ok(pg.locator('.ad-tile').count() == 4 and EMAIL in pg.inner_text('.ad-user'), 'Demo credentials work → Admin Dashboard opens')
        body = pg.inner_text('#admin-root')
        ok(not any(g in body for g in GONE) and pg.locator('.ad-head + .notice, .ad-head ~ .ad-notice').count() == 0, 'Dashboard: both notice boxes removed (not in the page at all)')
        stored = pg.evaluate("localStorage.getItem('terrashield-admin-v1')")
        auth = json.loads(stored)['auth']
        ok(PASS not in stored and auth['alg'] == 'PBKDF2-SHA256' and auth['iter'] >= 300000 and len(auth['hash']) > 30 and auth['demo'] is True, 'Demo password stored only as a PBKDF2 hash (never in plain text), marked as the demo account')

        # ---------- Add + approve ----------
        admin(pg, 'new'); pg.wait_for_selector('#ad-record-form')
        pg.select_option('#af-mouzaId', 'M901'); pg.fill('#af-dag', '101'); pg.fill('#af-deedNo', '9001/2026'); pg.fill('#af-date', '2026-10-01')
        pg.select_option('#af-sellerId', 'O01'); pg.select_option('#af-buyerId', 'P99'); pg.fill('#af-area', '40'); pg.fill('#af-note', 'কাল্পনিক বিক্রয়')
        pg.click('#ad-record-form [type=submit]'); pg.wait_for_selector('.ad-detail')
        ok(pg.locator('.ad-h2 .ad-status.s-draft').count() == 1, 'Record saved as a draft')
        ok('green' in own_check(pg), 'Draft does not change the website result')
        admin(pg, 'record/AR-1'); pg.check('[data-aform=approve] [name=confirm]'); pg.click('[data-aform=approve] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-reviewed')
        res = own_check(pg)
        ok('red' in res and 'দলিল 9001/2026' in pg.inner_text('.admin-used'), 'Approved → the website\'s own check turns RED, labelled as an admin-approved (fictional) record')
        pg.evaluate("location.hash = '#/samples'"); pg.wait_for_selector('[data-act=sample]'); pg.click('[data-act=sample][data-id="case-01"]'); pg.wait_for_selector('.result-head'); pg.wait_for_timeout(150)
        ok('green' in pg.get_attribute('.result-head', 'class') and pg.evaluate('TS.runAllTests().pass') == 14, 'Samples stay on the fictional base data; Run all tests 14 / 14')
        ctx.close()

        # ---------- Close the browser, open the file again ----------
        ctx = open_ctx(p, profile); pg = ctx.pages[0] if ctx.pages else ctx.new_page(); watch(pg, errors)
        pg.goto(url); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(300)
        ok(pg.evaluate('TS.dataMeta.source') == 'local' and pg.evaluate('TS.dataMeta.reviewedAdminRecords') == 1, 'After closing and reopening: the approved record is loaded from this browser')
        ok('red' in own_check(pg) and pg.locator('.admin-used').count() == 1, '…and the website\'s check still uses it (red, labelled)')
        pg.evaluate("location.hash = '#/'"); pg.click('.site-header .hdr-admin'); pg.wait_for_selector('#ad-login-form')
        ok(pg.locator('.ad-demo').count() == 1, 'Reopened browser → login asked again (session ended), demo login still shown')
        login(pg, EMAIL, 'wrong-password-1'); ok('ঠিক নয়' in pg.inner_text('#ad-login-err'), 'Wrong password refused')
        login(pg); pg.wait_for_selector('.ad-tiles', timeout=15000)
        ok(pg.eval_on_selector_all('.ad-tile .n', 'e => e.map(x => x.textContent)')[1] == '১', 'Login → dashboard shows the 1 approved record')

        # ---------- Archive / restore / approve; second tab follows ----------
        tab2 = ctx.new_page(); watch(tab2, errors); tab2.goto(url); tab2.wait_for_selector('.hero-forest'); tab2.wait_for_timeout(300)
        admin(pg, 'record/AR-1'); pg.click('[data-aform=archive] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-archived')
        ok('green' in own_check(pg), 'Archived → no longer used (green)')
        tab2.wait_for_timeout(300)
        ok(tab2.evaluate('TS.dataMeta.reviewedAdminRecords') == 0, 'A second open tab of the file picks up the change at once')
        tab2.close()
        admin(pg, 'record/AR-1'); pg.click('[data-aa=restore]'); pg.wait_for_selector('.ad-h2 .ad-status.s-draft')
        pg.check('[data-aform=approve] [name=confirm]'); pg.click('[data-aform=approve] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-reviewed')
        ok('red' in own_check(pg), 'Restored + approved again → red')

        # ---------- Backup / reset / restore ----------
        admin(pg, 'settings'); pg.wait_for_selector('.ad-backup')
        with pg.expect_download() as dl: pg.click('[data-aa=backup-download]')
        path = dl.value.path(); raw = pathlib.Path(path).read_text(); bk = json.loads(raw)
        ok(bk['app'] == 'terrashield-admin-backup' and len(bk['db']['records']) == 1 and 'auth' not in bk['db'] and 'hash' not in raw and PASS not in raw,
           'Backup downloads all records + log, with no password or hash inside')
        pg.fill('#ad-reset-confirm', 'RESET'); pg.click('#ad-reset-form [type=submit]'); pg.wait_for_selector('.ad-tiles')
        ok('green' in own_check(pg), 'Reset to fictional data → green')
        admin(pg, 'settings'); pg.set_input_files('#ad-import-file', path); pg.click('#ad-import-form [type=submit]'); pg.wait_for_timeout(400)
        ok('টিক দিন' in pg.inner_text('#ad-import-form .ad-act-err'), 'Restore backup needs the confirmation tick')
        pg.check('#ad-import-form [name=confirm]'); pg.click('#ad-import-form [type=submit]'); pg.wait_for_selector('.ad-tiles')
        ok('ফেরানো হয়েছে' in pg.inner_text('#ad-flash') and 'red' in own_check(pg), 'Backup restored → record back and used again (red)')
        bad_file = pathlib.Path(tempfile.mkdtemp()) / 'bad.json'; bad_file.write_text('{"app":"something-else"}')
        admin(pg, 'settings'); pg.set_input_files('#ad-import-file', str(bad_file)); pg.check('#ad-import-form [name=confirm]'); pg.click('#ad-import-form [type=submit]'); pg.wait_for_timeout(500)
        ok('সঠিক TerraShield ব্যাকআপ ফাইল নয়' in pg.inner_text('#ad-import-form .ad-act-err'), 'A wrong file is refused (nothing replaced)')

        # ---------- Log, password, idle timeout, lockout ----------
        admin(pg, 'log'); acts = pg.eval_on_selector_all('.ad-table tbody td:nth-child(3)', 'e => e.map(x => x.textContent)')
        ok({'ডেমো অ্যাকাউন্ট তৈরি', 'তৈরি', 'অনুমোদন', 'আর্কাইভ', 'খসড়ায় ফেরানো', 'কাল্পনিক তথ্যে রিসেট', 'ব্যাকআপ ফেরানো', 'লগইন', 'ভুল লগইন চেষ্টা'} <= set(acts), 'Change log records every action')
        admin(pg, 'settings'); pg.wait_for_selector('#ad-reset-form')
        ok(pg.locator('#ad-pw-form').count() == 0 and pg.evaluate("TS.adminLocal.request('POST', 'password', { current: 'TerraShield-Demo-2026', next: 'another-pass-2026' })")['status'] == 403, 'Demo password is fixed (no change form; the API refuses), so the login page is always right')
        pg.click('[data-aa=logout]'); pg.wait_for_selector('.ad-demo')
        t = pg.inner_text('#admin-root')
        ok('নিজের অ্যাডমিন পাসওয়ার্ড' not in t and 'শুধু টিম TerraSync' not in t, 'Login page: no "own password" line and no lead line')
        eb = pg.locator('#ad-email').bounding_box(); db = pg.locator('.ad-demo').bounding_box()
        ok(db['x'] >= eb['x'] + eb['width'] - 2 and abs(db['y'] - eb['y']) < 120, 'Desktop: demo email + password sit beside the login fields')
        login(pg, EMAIL, PASS); pg.wait_for_selector('.ad-head', timeout=15000); ok(pg.locator('.ad-head').count() == 1, 'Demo login works again after logout')
        pg.evaluate("(() => { const k='terrashield-admin-session-v1', s=JSON.parse(sessionStorage.getItem(k)); s.seen -= 31*60*1000; sessionStorage.setItem(k, JSON.stringify(s)); })()")
        admin(pg, 'records'); ok(pg.locator('#ad-login-form').count() == 1, '30 minutes idle → login asked again')
        for i in range(5): login(pg, EMAIL, f'guess-{i}-password')
        ok('মিনিট পরে' in pg.inner_text('#ad-login-err'), '5 wrong passwords → locked for 15 minutes')
        login(pg, EMAIL, PASS); ok(pg.locator('.ad-head').count() == 0, '…even the right password waits while locked')
        pg.evaluate("localStorage.removeItem('terrashield-admin-lock-v1')")

        # ---------- English + accessibility ----------
        pg.evaluate("location.hash = '#/'"); pg.wait_for_timeout(200); pg.click('[data-act=lang]'); admin(pg)
        ok('Admin login' in pg.inner_text('#admin-root') and 'Use the details below for the demo admin login.' in pg.inner_text('#admin-root') and not any(g in pg.inner_text('#admin-root') for g in GONE), 'English: login screen with the demo details, removed notices stay gone')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)
        if AXE:
            bad = []
            admin(pg); bad += [f'login:{x}' for x in axe(pg)]
            login(pg, EMAIL, PASS); pg.wait_for_selector('.ad-head', timeout=15000)
            for theme in ['light', 'dark']:
                if theme == 'dark': pg.click('[data-act=theme]'); pg.wait_for_timeout(250)
                for sub in ['', 'settings', 'record/AR-1']:
                    admin(pg, sub); pg.wait_for_timeout(500); bad += [f'{theme}/{sub}:{x}' for x in axe(pg)]
            pg.click('[data-act=theme]'); pg.wait_for_timeout(200)
            ok(not bad, f'Accessibility (axe WCAG A/AA) on login, dashboard, settings + backup, record — light + dark: {bad or "0 violations"}')
        ctx.close()

        # ---------- Broken storage is handled ----------
        ctx = open_ctx(p, profile); pg = ctx.pages[0] if ctx.pages else ctx.new_page(); errs2 = []; watch(pg, errs2)
        pg.goto(url); pg.wait_for_selector('.hero-forest')
        pg.evaluate("localStorage.setItem('terrashield-admin-v1', '{ broken')"); pg.reload(); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(300)
        ok(pg.evaluate('TS.dataMeta.source') == 'bundled' and 'green' in own_check(pg), 'Broken stored data → site still works on the fictional base data')
        admin(pg); pg.wait_for_selector('.ad-demo', timeout=15000)
        ok(pg.evaluate("Object.keys(localStorage).some(k => k.startsWith('terrashield-admin-v1-corrupt-'))"), '…and the broken copy is kept aside, never silently lost')
        ctx.close()

        real = [e for e in errors + errs2 if 'admin-local' not in e]
        ok(not real, f'No console errors or warnings ({real[:3]})')

print(f'\n{checks - len(failures)} / {checks} standalone-file admin checks passed')
sys.exit(1 if failures else 0)
