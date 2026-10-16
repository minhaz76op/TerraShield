"""
TerraShield — Admin Panel end-to-end checks (Python + Playwright + Node).
Starts the real server (node server/server.js) with a throw-away DB and test credentials,
then drives the website and the Admin Panel in Chromium:
  login → add record (form + validation) → draft has no effect → approve → the website's own check
  uses it (with the admin label) → samples / Judge Mode / 14 tests stay on the fictional base data →
  edit (back to draft) → archive → restore → change log → reset to fictional data → change password →
  logout / session protection / lockout → English, dark mode, accessibility (axe), phone width,
  no console/CSP errors → offline standalone file opens its own in-file Admin Panel and still works
  (the full in-file flow is tested by tests/browser_standalone_admin_check.py).
Also: the header "Admin Panel" button (desktop, English, phone ☰ menu, logged-out visitor, offline file).
Run:  python3 tests/browser_admin_check.py        (AXE_PATH=/path/to/axe.min.js for the accessibility audit)
"""
import hashlib, os, pathlib, socket, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
AXE = pathlib.Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') and pathlib.Path(os.environ['AXE_PATH']).exists() else None
EMAIL, PASS, NEWPASS = 'admin@terrasync.test', 'e2e-test-password-1', 'e2e-new-password-22'
failures, checks = [], 0

def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def shared_hashes():
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT / 'shared').rglob('*.json'))}

before_shared = shared_hashes()
port = free_port(); BASE = f'http://127.0.0.1:{port}/'
env = dict(os.environ, PORT=str(port), HOST='127.0.0.1', DB_FILE=str(pathlib.Path(tempfile.mkdtemp()) / 'db.json'), ADMIN_EMAIL=EMAIL, ADMIN_PASSWORD=PASS)
for k in ['ADMIN_PASSWORD_HASH']: env.pop(k, None)
server = subprocess.Popen(['node', 'server/server.js'], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

def wait_server():
    for _ in range(50):
        try:
            socket.create_connection(('127.0.0.1', port), timeout=0.2).close(); return True
        except OSError: time.sleep(0.1)
    return False

def own_check(pg, dag='101', seller='O01', area='20'):
    """A person's own check through the real wizard (not a sample). Returns the result-head class."""
    pg.evaluate("TS.ui.state.form = TS.ui.blankForm(); TS.ui.state.errors = {}; location.hash = '#/step/1'")
    pg.wait_for_selector('[data-act=mouza][data-id=M901]'); pg.click('[data-act=mouza][data-id=M901]'); pg.click('[data-act=next]')
    pg.wait_for_selector('#f-dag'); pg.fill('#f-dag', dag); pg.click('[data-act=next]')
    pg.wait_for_selector(f'[data-act=seller][data-id={seller}]'); pg.click(f'[data-act=seller][data-id={seller}]'); pg.click('[data-act=next]')
    pg.wait_for_selector('#f-area'); pg.fill('#f-area', area); pg.click('[data-act=next]')
    pg.wait_for_selector('[data-act=skip], [data-act=next]'); pg.click('[data-act=next]')
    pg.wait_for_selector('[data-act=run]'); pg.click('[data-act=run]')
    pg.wait_for_selector('.result-head', timeout=8000); pg.wait_for_timeout(150)
    return pg.get_attribute('.result-head', 'class')

def admin(pg, sub=''):
    pg.evaluate(f"location.hash = '#/admin{('/' + sub) if sub else ''}'"); pg.wait_for_timeout(120)
    pg.wait_for_selector('#admin-main:not([aria-busy]), #ad-email', timeout=8000); pg.wait_for_timeout(100)

def login(pg, email=EMAIL, pw=PASS):
    pg.fill('#ad-email', email); pg.fill('#ad-pass', pw); pg.click('#ad-login-form [type=submit]'); pg.wait_for_timeout(500)

def fill_deed(pg, area='40', note=''):
    pg.select_option('#af-mouzaId', 'M901'); pg.fill('#af-dag', '101'); pg.fill('#af-deedNo', '9001/2026'); pg.fill('#af-date', '2026-10-01')
    pg.select_option('#af-sellerId', 'O01'); pg.select_option('#af-buyerId', 'P99'); pg.fill('#af-area', area); pg.fill('#af-note', note)

def axe(pg):
    pg.add_script_tag(content=AXE)
    return pg.evaluate("""async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, preload: false })).violations.map(x => x.id + ':' + x.nodes.length)""")

try:
    ok(wait_server(), 'Server starts with the test credentials')
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
        pg = ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        # ---------- Website through the server ----------
        pg.goto(BASE); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(400)
        ok(pg.evaluate('TS.dataMeta.source') == 'server' and pg.evaluate('TS.data !== TS.baseData'), 'Website loads its data from the server (/api/data)')
        ok(pg.locator('#footer a[href="#/admin"]').count() == 1, 'Footer shows the Admin link when served')
        ok('green' in own_check(pg) and pg.locator('.admin-used').count() == 0, 'Before any admin record: own check M901/101 Rahim 20 → green, no admin label')

        # ---------- Header "Admin Panel" button → login ----------
        btn = pg.locator('.site-header .hdr-admin')
        ok(btn.is_visible() and btn.inner_text().strip() == 'অ্যাডমিন প্যানেল' and btn.get_attribute('href') == '#/admin', 'Header shows a visible "অ্যাডমিন প্যানেল" button (desktop)')
        jb = pg.locator('.site-header .wrap a.brand-solid[href="#/judge"]').bounding_box(); ab = btn.bounding_box()
        ok(ab['x'] > jb['x'] and abs(ab['y'] - jb['y']) < 4, 'It sits on the right, next to "৬০ সেকেন্ডে দেখুন"')
        pg.evaluate("location.hash = '#/'"); pg.wait_for_timeout(200); pg.click('.site-header .hdr-admin'); pg.wait_for_selector('#ad-email')
        ok(pg.evaluate('location.hash') == '#/admin' and pg.get_attribute('.site-header .hdr-admin', 'aria-current') == 'page', 'Clicking it opens #/admin (button marked current)')

        # ---------- Login ----------
        ok(pg.locator('#ad-email').count() == 1 and pg.get_attribute('#ad-pass', 'autocomplete') == 'current-password', 'Admin Panel asks for login (email + password, proper autocomplete)')
        ok(pg.locator('.ad-demo').count() == 0 and PASS not in pg.content() and pg.locator('#admin-root .notice').count() == 0, 'Own configured password (.env) → no demo card and no password on the page; no notice boxes')
        login(pg, EMAIL, 'wrong-password-123')
        ok('ঠিক নয়' in pg.inner_text('#ad-login-err') and pg.input_value('#ad-pass') == '', 'Wrong password → clear error, password box emptied')
        pg.click('[data-aa=togglepw]'); ok(pg.get_attribute('#ad-pass', 'type') == 'text', 'Show/hide password button works'); pg.click('[data-aa=togglepw]')
        login(pg)
        pg.wait_for_selector('.ad-tiles')
        ok(pg.locator('.ad-tile').count() == 4 and 'মানে টিমের একজন অ্যাডমিন রেকর্ডটি দেখেছেন' not in pg.inner_text('#admin-root') and pg.locator('.ad-head ~ .ad-notice').count() == 0, 'Dashboard: 4 status tiles; the removed notice box is gone')
        ok(EMAIL in pg.inner_text('.ad-user'), 'Shows who is logged in')

        # ---------- Add a record (form + validation) ----------
        admin(pg, 'new'); pg.wait_for_selector('#ad-record-form')
        pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(150)
        ok(pg.locator('#ad-record-form [aria-invalid=true]').count() >= 5 and pg.evaluate("document.activeElement.getAttribute('aria-invalid')") == 'true',
           'Empty form → fields marked invalid, focus on the first problem')
        fill_deed(pg, note='NID 19901234567890')
        pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(150)
        ok('এনআইডি' in pg.inner_text('#err-af-note'), 'NID-like number in the note is refused before saving')
        pg.select_option('#af-buyerId', 'O01'); pg.fill('#af-note', ''); pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(150)
        ok('একই হতে পারেন না' in pg.inner_text('#err-af-buyerId'), 'Seller = buyer refused')
        ok(pg.locator('#af-sellerId option').count() == 24 and pg.locator('#af-sellerId').evaluate('e => e.tagName') == 'SELECT', 'People can only be chosen from the fictional list (no free text)')
        fill_deed(pg, note='কাল্পনিক বিক্রয়'); pg.click('#ad-record-form [type=submit]')
        pg.wait_for_selector('.ad-detail')
        ok(pg.locator('.ad-h2 .ad-status.s-draft').count() == 1 and 'অনুমোদন না দেওয়া পর্যন্ত' in pg.inner_text('#ad-flash'), 'Saved as a DRAFT with a clear message')
        ok(pg.locator('.ad-related li').count() >= 2, 'Detail shows the base records on the same dag for comparison')
        ok('green' in own_check(pg), 'Draft does NOT change the website result (still green)')

        # ---------- Review / approve ----------
        admin(pg, 'review')
        ok(pg.locator('.ad-rec').count() == 1 and pg.locator('.ad-tabs .ad-count').inner_text() == '১', 'Review queue lists the draft; tab shows the count')
        pg.click('.ad-rec a.btn-primary'); pg.wait_for_selector('[data-aform=approve]')
        pg.click('[data-aform=approve] [type=submit]'); pg.wait_for_timeout(150)
        ok('টিক দিন' in pg.inner_text('[data-aform=approve] .ad-act-err'), 'Approve without the confirmation tick → refused')
        pg.check('[data-aform=approve] [name=confirm]'); pg.fill('#ad-approve-note', 'কাল্পনিক কাগজ মিলিয়ে দেখা'); pg.click('[data-aform=approve] [type=submit]')
        pg.wait_for_selector('.ad-h2 .ad-status.s-reviewed')
        ok('ওয়েবসাইটের যাচাইয়ে ব্যবহার হবে' in pg.inner_text('#ad-flash'), 'Approved → flash says it is now used in checks')
        res = own_check(pg)
        notice = pg.inner_text('.admin-used') if pg.locator('.admin-used').count() else ''
        ok('red' in res and 'দলিল 9001/2026' in notice and 'সরকারি' in notice, f'Website own check now RED and labelled "admin-approved, fictional, not official" ({res})')
        ok(pg.locator('.disclaimer').count() >= 1 and 'এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা।' in pg.inner_text('.disclaimer'), 'Exact Bangla disclaimer still shown')
        r1 = pg.evaluate("TS.ui.state.result.findings.findIndex(x => x.rule === 'R1')")
        pg.evaluate(f"location.hash = '#/evidence/{r1}'"); pg.wait_for_timeout(300)
        ok('অ্যাডমিন যোগ করা (কাল্পনিক)' in pg.inner_text('#view'), 'Evidence card marks the deed "added by admin (fictional)"')

        # ---------- Samples, Judge Mode, 14 tests stay on the fictional base data ----------
        pg.evaluate("location.hash = '#/samples'"); pg.wait_for_selector('[data-act=sample]'); pg.click('[data-act=sample][data-id="case-01"]'); pg.wait_for_selector('.result-head'); pg.wait_for_timeout(200)
        ok('green' in pg.get_attribute('.result-head', 'class') and pg.locator('.admin-used').count() == 0, 'Sample case-01 is still green (samples use the fictional base data)')
        ok(pg.evaluate('TS.runAllTests().pass') == 14, 'Run all tests: 14 / 14 with an approved admin record present')
        pg.goto(BASE + '?judge=1#/samples'); pg.wait_for_selector('[data-act=run-tests]'); pg.wait_for_timeout(300)
        pg.click('[data-act=run-tests]'); pg.wait_for_timeout(300)
        ok('১৪ / ১৪' in pg.inner_text('.big-score'), 'Judge panel shows ১৪ / ১৪')
        pg.goto(BASE + '#/judge'); pg.wait_for_timeout(800); pg.click('[data-act=story-goto][data-i="1"]'); pg.wait_for_timeout(1500)
        ok('green' in (pg.get_attribute('#screen-host .result-head', 'class') or ''), 'Judge Mode story step 2 (clean land) still green')
        pg.click('[data-act=story-exit] >> nth=-1'); pg.wait_for_timeout(300)

        # ---------- Edit → back to draft; archive; restore ----------
        admin(pg, 'record/AR-1'); pg.click('.ad-actions a[href="#/admin/edit/AR-1"]'); pg.wait_for_selector('#ad-record-form')
        ok('আবার খসড়া হবে' in pg.inner_text('#admin-main') and pg.input_value('#af-area') == '40', 'Edit form is pre-filled and warns it returns to draft')
        pg.fill('#af-area', '10'); pg.click('#ad-record-form [type=submit]'); pg.wait_for_selector('.ad-detail')
        ok(pg.locator('.ad-h2 .ad-status.s-draft').count() == 1 and 'আবার খসড়া' in pg.inner_text('#ad-flash'), 'Edited approved record → draft again')
        ok('green' in own_check(pg), 'Website back to green until re-approved')
        admin(pg, 'record/AR-1'); pg.check('[data-aform=approve] [name=confirm]'); pg.click('[data-aform=approve] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-reviewed')
        ok('yellow' in own_check(pg), 'Re-approved with 10 decimal → website yellow (R1 only)')
        admin(pg, 'record/AR-1'); pg.fill('#ad-archive-note', 'পরীক্ষা শেষ'); pg.click('[data-aform=archive] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-archived')
        ok('green' in own_check(pg), 'Archived → no longer used (website green)')
        admin(pg, 'record/AR-1'); pg.click('[data-aa=restore]'); pg.wait_for_selector('.ad-h2 .ad-status.s-draft')
        ok(pg.locator('.ad-h2 .ad-status.s-draft').count() == 1 and 'খসড়া হিসেবে ফিরেছে' in pg.inner_text('#ad-flash'), 'Restore → draft')
        hist = pg.eval_on_selector_all('.ad-history li b', 'e => e.map(x => x.textContent)')
        ok(hist[:6] == ['খসড়ায় ফেরানো', 'আর্কাইভ', 'অনুমোদন', 'সম্পাদনা', 'অনুমোদন', 'তৈরি'], f'Record history lists every step {hist}')

        # ---------- Reject (needs a reason) ----------
        pg.click('[data-aform=reject] [type=submit]'); pg.wait_for_timeout(150)
        ok('কারণ' in pg.inner_text('[data-aform=reject] .ad-act-err'), 'Reject without a reason → refused')
        pg.fill('#ad-reject-note', 'তারিখ মেলেনি'); pg.click('[data-aform=reject] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-rejected')
        ok('তারিখ মেলেনি' in pg.inner_text('.ad-actions'), 'Rejected record shows the reason')

        # ---------- Khatian form: owners, type switch keeps mouza/dag ----------
        admin(pg, 'new'); pg.wait_for_selector('#ad-record-form')
        pg.select_option('#af-mouzaId', 'M902'); pg.fill('#af-dag', '450')
        pg.click('.ad-typecard:has(input[value=khatian])'); pg.wait_for_selector('#af-khatianNo')
        ok(pg.input_value('#af-mouzaId') == 'M902' and pg.input_value('#af-dag') == '450', 'Switching type keeps the mouza and dag')
        pg.click('[data-aa=addowner]'); ok(pg.locator('.ad-owner-row').count() == 2, 'Add owner row'); pg.click('[data-aa=rmowner] >> nth=1'); ok(pg.locator('.ad-owner-row').count() == 1, 'Remove owner row')
        pg.fill('#af-khatianNo', '650'); pg.fill('#af-recordDate', '2016-01-01'); pg.select_option('#af-owners-0-personId', 'O05'); pg.fill('#af-owners-0-share', '20')
        pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(200)
        ok('প্লট রেকর্ড নেই' in pg.inner_text('#err-af-dag'), 'Khatian for a dag without a plot → "add the plot first"')
        pg.click('.ad-typecard:has(input[value=plot])'); pg.wait_for_selector('#af-totalArea'); pg.fill('#af-totalArea', '25')
        pg.click('#ad-record-form [type=submit]'); pg.wait_for_selector('.ad-detail')
        ok(pg.locator('.ad-h2 .ad-type').inner_text().strip().startswith('দাগ'), 'New plot saved')

        # ---------- Records list filters + change log ----------
        admin(pg, 'records'); ok(pg.locator('.ad-rec').count() == 2, 'Records list shows both records')
        pg.click('.ad-chip[href="#/admin/records/rejected"]'); pg.wait_for_timeout(400); ok(pg.locator('.ad-rec').count() == 1, 'Status filter: rejected')
        pg.select_option('#ad-type-filter', 'plot'); pg.wait_for_timeout(400); ok(pg.locator('.ad-rec').count() == 0, 'Type filter: plot among rejected → none')
        pg.select_option('#ad-type-filter', ''); pg.wait_for_timeout(300)
        admin(pg, 'log')
        acts = pg.eval_on_selector_all('.ad-table tbody td:nth-child(3)', 'e => e.map(x => x.textContent)')
        ok({'তৈরি', 'অনুমোদন', 'সম্পাদনা', 'আর্কাইভ', 'খসড়ায় ফেরানো', 'বাতিল', 'লগইন', 'ভুল লগইন চেষ্টা'} <= set(acts), 'Change log records every action (incl. failed login)')
        ok(PASS not in pg.inner_text('#admin-main') and 'wrong-password-123' not in pg.inner_text('#admin-main'), 'Change log never shows passwords')

        # ---------- English + dark mode ----------
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)
        ok(pg.locator('.site-header .hdr-admin').inner_text().strip() == 'Admin Panel', 'Header button follows the language switch ("Admin Panel")')
        admin(pg)
        ok('Admin Panel' in pg.inner_text('#admin-root') and 'Dashboard' in pg.inner_text('.ad-tabs') and 'means a team admin has looked' not in pg.inner_text('#admin-root'), 'Admin Panel in English')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(300)

        if AXE:
            # The server's Content-Security-Policy (correctly) blocks injecting the axe script, so the audit
            # runs in a separate browser context that bypasses CSP; the main context above stays strict.
            ac = browser.new_context(viewport={'width': 1366, 'height': 900}, bypass_csp=True); ap = ac.new_page()
            ap.goto(BASE + '#/admin'); ap.wait_for_selector('#ad-email'); bad = axe(ap); bad = [f'light/login:{x}' for x in bad]
            login(ap); ap.wait_for_selector('.ad-tiles')
            for theme in ['light', 'dark']:
                if theme == 'dark': ap.click('[data-act=theme]'); ap.wait_for_timeout(250)
                for sub in ['', 'records', 'review', 'record/AR-1', 'record/AR-2', 'new', 'log', 'settings']:
                    admin(ap, sub); ap.wait_for_timeout(500); bad += [f'{theme}/admin/{sub}:{x}' for x in axe(ap)]
                own_check(ap); ap.wait_for_timeout(400); bad += [f'{theme}/result:{x}' for x in axe(ap)]
            ac.close()
            ok(not bad, f'Accessibility (axe WCAG A/AA) on login, every admin screen + result, light + dark: {bad or "0 violations"}')
        else:
            print('  – accessibility audit skipped (set AXE_PATH)')

        # ---------- Phone width ----------
        pg.set_viewport_size({'width': 390, 'height': 844}); pg.evaluate("location.hash = '#/'"); pg.wait_for_timeout(300)
        ok(not pg.locator('.site-header .hdr-admin').is_visible(), 'Phone: header button folds into the ☰ menu')
        pg.click('.menu-btn'); pg.wait_for_timeout(200)
        mm = pg.locator('.mobile-menu a[href="#/admin"]')
        ok(mm.is_visible() and 'অ্যাডমিন প্যানেল' in mm.inner_text(), 'Phone: ☰ menu lists "অ্যাডমিন প্যানেল"')
        mm.click(); pg.wait_for_selector('.ad-tiles')
        ok(pg.evaluate('location.hash') == '#/admin' and not pg.locator('.mobile-menu').is_visible(), 'Phone: menu link opens the dashboard (already logged in) and closes the menu')
        worst = {}
        for sub in ['', 'records', 'record/AR-1', 'new', 'log', 'settings']:
            admin(pg, sub); pg.wait_for_timeout(250)
            worst[sub or 'dashboard'] = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        ok(all(v <= 1 for v in worst.values()), f'No sideways scroll on admin screens at 390 px {worst}')
        pg.set_viewport_size({'width': 1366, 'height': 900})

        # ---------- Reset to fictional data ----------
        admin(pg, 'record/AR-1'); pg.click('.ad-actions a[href="#/admin/edit/AR-1"]'); pg.wait_for_selector('#ad-record-form')
        pg.fill('#af-area', '40'); pg.click('#ad-record-form [type=submit]'); pg.wait_for_selector('.ad-detail')
        pg.check('[data-aform=approve] [name=confirm]'); pg.click('[data-aform=approve] [type=submit]'); pg.wait_for_selector('.ad-h2 .ad-status.s-reviewed')
        ok('red' in own_check(pg), 'Approved again → website red (before reset)')
        admin(pg, 'settings'); pg.fill('#ad-reset-confirm', 'reset'); pg.click('#ad-reset-form [type=submit]'); pg.wait_for_timeout(200)
        ok('RESET' in pg.inner_text('#ad-reset-form .ad-act-err'), 'Reset needs RESET typed exactly')
        pg.fill('#ad-reset-confirm', 'RESET'); pg.click('#ad-reset-form [type=submit]'); pg.wait_for_selector('.ad-tiles')
        ok('রিসেট হয়েছে' in pg.inner_text('#ad-flash') and pg.eval_on_selector_all('.ad-tile .n', 'e => e.map(x => x.textContent)') == ['০', '০', '০', '০'], 'Reset → all admin records removed')
        ok('green' in own_check(pg) and pg.locator('.admin-used').count() == 0, 'Website back to the fictional base data (green)')

        # ---------- Change password, logout, protection ----------
        admin(pg, 'settings'); pg.fill('#ad-pw-cur', PASS); pg.fill('#ad-pw-new', 'short'); pg.fill('#ad-pw-again', 'short'); pg.click('#ad-pw-form [type=submit]'); pg.wait_for_timeout(300)
        ok('১০ অক্ষর' in pg.inner_text('#ad-pw-form .ad-act-err'), 'Weak new password refused')
        pg.fill('#ad-pw-cur', PASS); pg.fill('#ad-pw-new', NEWPASS); pg.fill('#ad-pw-again', NEWPASS); pg.click('#ad-pw-form [type=submit]')
        try: pg.wait_for_function("() => /বদলানো হয়েছে/.test((document.querySelector('#ad-pw-form .ad-act-err') || {}).textContent || '')", timeout=8000)
        except Exception: pass
        ok('বদলানো হয়েছে' in pg.inner_text('#ad-pw-form .ad-act-err'), 'Password changed')
        pg.click('[data-aa=logout]'); pg.wait_for_selector('#ad-email')
        ok('লগআউট হয়েছে' in pg.inner_text('#admin-root'), 'Logout → back to login with a message')
        admin(pg, 'records'); ok(pg.locator('#ad-email').count() == 1 and pg.locator('.ad-rec').count() == 0, 'After logout, admin pages show the login form only')
        ok(pg.evaluate("fetch('/api/admin/records').then(r => r.status)") == 401, 'After logout the API refuses data (401)')
        login(pg, EMAIL, PASS); ok(pg.locator('#ad-login-err .error-text').count() == 1, 'Old password no longer works')
        login(pg, EMAIL, NEWPASS)
        pg.wait_for_selector('.ad-head', timeout=8000)
        ok(pg.locator('.ad-head').count() == 1 and pg.locator('.ad-rec, .ad-empty').count() >= 1, 'New password works — and you land back on the page you were on (records)')

        # ---------- New visitor: homepage → header button → login → dashboard ----------
        nc = browser.new_context(viewport={'width': 1366, 'height': 900}); npg = nc.new_page()
        npg.goto(BASE); npg.wait_for_selector('.hero-forest'); npg.click('.site-header .hdr-admin'); npg.wait_for_selector('#ad-email')
        ok(npg.locator('.ad-tiles').count() == 0, 'Logged-out visitor: header button shows the Admin Login screen')
        login(npg, EMAIL, NEWPASS); npg.wait_for_selector('.ad-tiles')
        ok(npg.evaluate('location.hash') == '#/admin' and npg.locator('.ad-tile').count() == 4, 'After login the Admin Dashboard opens')
        nc.close()

        # ---------- Lockout (separate browser context = separate visitor) ----------
        lc = browser.new_context(); lp = lc.new_page(); lp.goto(BASE + '#/admin'); lp.wait_for_selector('#ad-email')
        for i in range(5): login(lp, 'someone@else.test', f'guess-{i}-password')
        ok('মিনিট পরে' in lp.inner_text('#ad-login-err'), 'After 5 wrong attempts: "try again in N minutes"')
        lc.close()

        # Chrome logs every 4xx answer as "Failed to load resource". This run deliberately causes four
        # (wrong password 401, weak new password 400, API after logout 401, old password after change 401).
        http4xx = [e for e in errors if e.startswith('Failed to load resource: the server responded with a status of 4')]
        real = [e for e in errors if e not in http4xx]
        ok(not real and not any('Refused to' in e for e in errors), f'No JavaScript errors and no Content-Security-Policy violations ({real[:3]})')
        ok(len(http4xx) == 4, f'Only the 4 deliberate 4xx answers were logged ({len(http4xx)})')
        ctx.close()

        # ---------- Offline standalone file ----------
        oc = browser.new_context(viewport={'width': 1366, 'height': 900})
        oc.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:')) else r.abort())
        op = oc.new_page(); oerr = []
        op.on('pageerror', lambda e: oerr.append(str(e))); op.on('console', lambda m: oerr.append(m.text) if m.type == 'error' else None)
        op.goto((ROOT / 'dist/terrashield.html').as_uri()); op.wait_for_timeout(400)
        ok(op.locator('.site-header .hdr-admin').is_visible(), 'Standalone file also shows the header button')
        op.click('.site-header .hdr-admin'); op.wait_for_timeout(500)
        op.wait_for_selector('.ad-demo', timeout=15000)
        ok(op.locator('#ad-login-form').count() == 1 and 'TerraShield-Demo-2026' in op.inner_text('.ad-demo'), 'Standalone file: the button opens the working in-file Admin Login with the demo account')
        ok(op.locator('#footer a[href="#/admin"]').count() == 1 and op.evaluate('TS.dataMeta.source') == 'bundled', 'Standalone: bundled data until something is approved; footer Admin link too')
        op.evaluate("location.hash = '#/samples'"); op.wait_for_timeout(300); op.click('[data-act=sample][data-id="case-03"]'); op.wait_for_selector('.result-head')
        ok('red' in op.get_attribute('.result-head', 'class') and op.evaluate('TS.runAllTests().pass') == 14, 'Standalone still works offline: case-03 red, 14 / 14')
        ok(not oerr, f'Standalone: no console errors ({oerr[:2]})')
        oc.close(); browser.close()
finally:
    server.terminate()
    try: out = server.communicate(timeout=5)[0]
    except Exception: out = ''
    if 'error' in out.lower() and 'TerraShield server running' not in out: print(out)

ok(shared_hashes() == before_shared, 'Fictional base data in shared/ unchanged after the whole run')
print(f'\n{checks - len(failures)} / {checks} admin end-to-end checks passed')
sys.exit(1 if failures else 0)
