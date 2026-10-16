"""
TerraShield — land calculator checks (#/calc). Optional; needs Python + Playwright.
Runs on BOTH web/index.html and dist/terrashield.html, from disk, with the network blocked.
  L3  Khatian share → land: fractions / decimals / percent, acre totals, live results,
      field errors, quick-pick chips, focus stays in the box, "check with this area" → form
  L2  Unit converter: every unit at once, katha/bigha flagged "varies by area" + warning
  +   Display only: the rule engine is never called while using the calculator
  +   Disclaimer, no "verified"/"safe" wording, English switch keeps numbers, no sideways
      scroll (320/390/1000/1366 px), accessibility (axe WCAG A/AA) light + dark if AXE_PATH set
Run:  python3 tests/browser_calc_check.py        (AXE_PATH=/path/to/axe.min.js for the audit)
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS = {'web/index.html': ROOT / 'web/index.html', 'dist/terrashield.html': ROOT / 'dist/terrashield.html'}
AXE = pathlib.Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') and pathlib.Path(os.environ['AXE_PATH']).exists() else None
failures, checks = [], 0

def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

def open_calc(pg, url):
    pg.goto(url + '#/calc'); pg.wait_for_selector('#c-total')

def out(pg, sel='#c-share-out'): return pg.inner_text(sel)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, path in TARGETS.items():
        print(f'\n== {name} ==')
        url = path.as_uri()
        ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
        ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:')) else r.abort())
        pg = ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        # ---------- Page + navigation ----------
        pg.goto(url); pg.wait_for_timeout(300)
        ok(pg.locator('.site-nav a[href="#/calc"]').count() == 1, 'Header has a "ক্যালকুলেটর" link')
        pg.click('.site-nav a[href="#/calc"]'); pg.wait_for_selector('#c-total')
        ok('জমির ক্যালকুলেটর' in pg.inner_text('h1'), 'Calculator page opens (#/calc)')
        pg.evaluate("window.__engineCalls = 0; const _c = TS.engine.check; TS.engine.check = function(){ window.__engineCalls++; return _c.apply(this, arguments); }; 0")

        # ---------- L3: empty state ----------
        ok('দুটি ঘর পূরণ করলে' in out(pg) and pg.locator('#c-share-out .error-text, #err-c-total .error-text, #err-c-share .error-text').count() == 0,
           'L3: empty boxes → friendly hint, no error messages')

        # ---------- L3: results ----------
        pg.fill('#c-total', '৬০'); pg.fill('#c-share', '১/৩'); pg.wait_for_timeout(80)
        o = out(pg)
        ok(pg.inner_text('#c-share-val').startswith('২০') and '৬০ শতাংশ × ১/৩' in o and '= ২০ শতাংশ' in o, f'L3: ৬০ শতাংশ × ১/৩ = ২০ শতাংশ, with the working shown')
        ok(pg.evaluate("document.activeElement.id") == 'c-share', 'L3: live update keeps the cursor in the box (no full re-render)')
        pg.fill('#c-total', '40'); pg.fill('#c-share', '25%'); pg.wait_for_timeout(80)
        ok(pg.inner_text('#c-share-val').startswith('১০'), 'L3: 40 × 25% = 10 (English digits + percent)')
        pg.fill('#c-share', '.75'); pg.wait_for_timeout(80)
        ok(pg.inner_text('#c-share-val').startswith('৩০'), 'L3: 40 × .75 = 30 (khatian-style decimal share)')
        pg.fill('#c-total', '০.৫'); pg.click('[data-act=calc-tu][data-v=acre]'); pg.fill('#c-share', '1/2'); pg.wait_for_timeout(80)
        o = out(pg)
        ok(pg.inner_text('#c-share-val').startswith('২৫') and '০.৫ একর = ৫০ শতাংশ' in o
           and pg.get_attribute('[data-act=calc-tu][data-v=acre]', 'aria-pressed') == 'true', 'L3: total in acres → 0.5 acre × 1/2 = 25 decimal (acre step shown)')
        pg.click('[data-act=calc-tu][data-v=decimal]'); pg.fill('#c-total', '60')
        pg.click('[data-act=calc-share][data-v="1/4"]'); pg.wait_for_timeout(80)
        ok(pg.input_value('#c-share') == '১/৪' and pg.inner_text('#c-share-val').startswith('১৫'), 'L3: quick-pick chip ১/৪ fills the box → 15')
        pg.click('[data-act=calc-share][data-v="1"]'); pg.wait_for_timeout(80)
        ok(pg.inner_text('#c-share-val').startswith('৬০'), 'L3: "পুরো" (whole) → the whole dag')

        # ---------- L3: errors ----------
        for total, share, field, msg, label in [
            ('60', '3/2', 'c-share', 'বেশি হতে পারে না', 'share over 1'),
            ('60', '150%', 'c-share', 'বেশি হতে পারে না', 'percent over 100'),
            ('60', '1/0', 'c-share', '০ হতে পারে না', 'fraction ÷ 0'),
            ('60', 'এক ভাগ', 'c-share', '১/৩, ০.২৫ বা ২৫%', 'words instead of a share'),
            ('abc', '1/3', 'c-total', 'শুধু সংখ্যা', 'letters in total'),
            ('-5', '1/3', 'c-total', 'ঋণাত্মক', 'negative total'),
            ('0', '1/3', 'c-total', 'ঋণাত্মক', 'zero total')]:
            pg.fill('#c-total', total); pg.fill('#c-share', share); pg.wait_for_timeout(60)
            err = pg.inner_text('#err-' + field)
            ok(msg in err and pg.get_attribute('#' + field, 'aria-invalid') == 'true' and pg.locator('#c-share-val').count() == 0,
               f'L3 error — {label}: "{err.strip()}" and no result')
        pg.fill('#c-total', '60'); pg.fill('#c-share', '1/3'); pg.wait_for_timeout(60)
        ok(pg.get_attribute('#c-total', 'aria-invalid') == 'false' and pg.inner_text('#err-c-share') == '', 'L3: errors clear once fixed')

        # ---------- L2: converter ----------
        ok('পরিমাণ লিখলে' in out(pg, '#c-conv-out'), 'L2: empty → hint')
        pg.fill('#c-amt', '1'); pg.select_option('#c-from', 'acre'); pg.wait_for_timeout(80)
        rows = dict(pg.eval_on_selector_all('#c-conv-out tr', "els => els.map(r => [r.querySelector('th').textContent.trim(), r.querySelector('td').textContent])"))
        ok(rows.get('শতাংশ') == '১০০' and rows.get('বর্গফুট') == '৪৩,৫৬০' and rows.get('একর') == '১', f'L2: 1 acre = ১০০ শতাংশ = ৪৩,৫৬০ বর্গফুট')
        ok(any(k.startswith('কাঠা') and 'এলাকাভেদে ভিন্ন' in k for k in rows) and any(k.startswith('বিঘা') and 'এলাকাভেদে ভিন্ন' in k for k in rows)
           and not any(k.startswith('শতাংশ') and 'ভিন্ন' in k for k in rows), 'L2: only katha and bigha carry the "varies by area" tag')
        ok('কাঠা ও বিঘার মাপ এলাকাভেদে ভিন্ন' in pg.inner_text('.calc-warn'), 'L2: regional-variation warning is shown')
        pg.fill('#c-amt', '১'); pg.select_option('#c-from', 'bigha'); pg.wait_for_timeout(80)
        rows = dict(pg.eval_on_selector_all('#c-conv-out tr', "els => els.map(r => [r.querySelector('th').textContent.trim().split(' ')[0], r.querySelector('td').textContent])"))
        ok(rows.get('শতাংশ') == '৩৩.০৬' and rows.get('বর্গফুট') == '১৪,৪০০', f'L2: 1 standard bigha = ৩৩.০৬ শতাংশ = ১৪,৪০০ বর্গফুট ({rows.get("শতাংশ")})')
        pg.fill('#c-amt', 'x'); pg.wait_for_timeout(60)
        ok('শুধু সংখ্যা' in pg.inner_text('#err-c-amt') and pg.locator('#c-conv-out table').count() == 0, 'L2: bad amount → error, no table')
        pg.fill('#c-amt', '10'); pg.select_option('#c-from', 'decimal'); pg.wait_for_timeout(60)

        # ---------- Safety wording ----------
        body = pg.inner_text('#view')
        ok('আমিন বা সরকারি জরিপের মাপ নয়' in body and 'আনা-গণ্ডা হিসাব এখনো যুক্ত করা হয়নি' in body, 'Approximate-measurement disclaimer + ana-gonda "not yet" note')
        ok(not any(w in body for w in ['যাচাইকৃত', 'নিরাপদ', 'নিশ্চিত মালিক']), 'Never says verified / safe')
        ok(pg.evaluate('window.__engineCalls') == 0, 'Display only: the rule engine was never called by the calculator')

        # ---------- English ----------
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)
        ok('Land calculator' in pg.inner_text('h1') and pg.input_value('#c-total') == '60' and pg.inner_text('#c-share-val').startswith('20')
           and 'varies by area' in pg.inner_text('#c-conv-out'), 'English switch keeps the numbers and translates everything')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)

        # ---------- Transfer to the check form ----------
        fresh = ctx.new_page(); open_calc(fresh, url)
        fresh.fill('#c-total', '৬০'); fresh.fill('#c-share', '১/৩'); fresh.wait_for_timeout(60)
        fresh.click('[data-act=calc-use]'); fresh.wait_for_timeout(250)
        ok(fresh.evaluate('location.hash') == '#/step/1' and 'যাচাই ফর্মে বসানো হয়েছে' in fresh.inner_text('#toast'),
           'Use result with an empty form → starts at step 1 and says the area was placed')
        fresh.click('[data-act=mouza][data-id=M901]'); fresh.click('[data-act=next]'); fresh.fill('#f-dag', '103'); fresh.click('[data-act=next]')
        fresh.wait_for_selector('[data-act=seller]'); fresh.click('[data-act=seller] >> nth=0'); fresh.click('[data-act=next]'); fresh.wait_for_selector('#f-area')
        ok(fresh.input_value('#f-area') == '২০', f'…and the area step is pre-filled with ২০ ({fresh.input_value("#f-area")!r})')
        ok(fresh.locator('.calc-link a[href="#/calc"]').count() == 1, 'Area step links to the calculator')
        fresh.click('.calc-link a'); fresh.wait_for_selector('#c-total')
        ok(fresh.input_value('#c-total') == '৬০', 'Calculator remembers its numbers while the app is open')
        fresh.fill('#c-share', '১/২'); fresh.wait_for_timeout(60); fresh.click('[data-act=calc-use]'); fresh.wait_for_timeout(250)
        ok(fresh.evaluate('location.hash') == '#/step/4' and fresh.input_value('#f-area') == '৩০', 'Form already filled → goes straight to the area step with ৩০')
        fresh.click('[data-act=next]'); fresh.wait_for_timeout(200); fresh.click('[data-act=next]'); fresh.wait_for_timeout(200)
        run = fresh.locator('[data-act=run]')
        if run.count(): run.first.click()
        fresh.wait_for_selector('.result-head', timeout=6000)
        ok(fresh.locator('.result-head').count() == 1, 'The check then runs normally with the transferred area')
        fresh.close()

        # ---------- Layout ----------
        worst = 0
        for w in [320, 390, 1000, 1366]:
            pg.set_viewport_size({'width': w, 'height': 900}); open_calc(pg, url)
            pg.fill('#c-total', '60'); pg.fill('#c-share', '1/3'); pg.fill('#c-amt', '123456'); pg.wait_for_timeout(120)
            worst = max(worst, pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
        ok(worst <= 1, f'No sideways scroll at 320/390/1000/1366 px (worst {worst}px)')
        pg.set_viewport_size({'width': 1366, 'height': 900})

        # ---------- Accessibility ----------
        if AXE:
            bad = []
            for theme in ['light', 'dark']:
                if theme == 'dark': pg.click('[data-act=theme]'); pg.wait_for_timeout(250)
                for setup in ['filled', 'errors', 'empty']:
                    open_calc(pg, url)
                    vals = {'filled': ('60', '1/3', '10'), 'errors': ('-1', '3/2', 'x'), 'empty': ('', '', '')}[setup]
                    pg.fill('#c-total', vals[0]); pg.fill('#c-share', vals[1]); pg.fill('#c-amt', vals[2]); pg.wait_for_timeout(700)
                    pg.add_script_tag(content=AXE)
                    v = pg.evaluate("""async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, preload: false })).violations.map(x => x.id + ':' + x.nodes.length)""")
                    bad += [f'{theme}/{setup}/{x}' for x in v]
            pg.click('[data-act=theme]')
            ok(not bad, f'Accessibility (axe WCAG A/AA) light + dark, filled/errors/empty: {bad or "0 violations"}')
        else:
            print('  – accessibility audit skipped (set AXE_PATH to axe.min.js)')

        ok(not errors, f'No JavaScript errors ({errors[:2]})')
        ctx.close()
    browser.close()

print(f'\n{checks - len(failures)} / {checks} calculator checks passed')
sys.exit(1 if failures else 0)
