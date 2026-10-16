"""
TerraShield — checks for the v2.1 improvements (A1–A4, B1). Optional; needs Python + Playwright.
Runs on BOTH web/index.html and dist/terrashield.html, from disk, with the network blocked.
  A1  Bangla list numbers in Bangla mode only; unnumbered lists stay unnumbered
  A2  Long dates in History/Report ("১৫ জানুয়ারি ২০২৩"), time of day in the report, safe fallbacks
  A3  Hotline help card in the wizard side panel on wide screens (hidden on phones)
  A4  scroll-padding-top under the sticky header; the hidden attribute always hides
  B1  Live dag lookup: found / not found + tappable sample dags; never says "verified";
      the grey "not in sample records" result still works exactly as before
  +   Accessibility (axe-core WCAG 2 A/AA) on the new states, light + dark — if AXE_PATH points to axe.min.js
Run:  python3 tests/browser_v21_check.py            (AXE_PATH=/path/to/axe.min.js for the audit)
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS = {'web/index.html': ROOT / 'web/index.html', 'dist/terrashield.html': ROOT / 'dist/terrashield.html'}
AXE = pathlib.Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') and pathlib.Path(os.environ['AXE_PATH']).exists() else None
BN = str.maketrans('০১২৩৪৫৬৭৮৯', '0123456789')
failures, checks = [], 0

def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

def open_sample(pg, url, case):
    pg.goto(url + '#/samples'); pg.wait_for_timeout(150)
    pg.click(f'[data-act=sample][data-id="{case}"]'); pg.wait_for_selector('.result-head', timeout=4000)

def to_dag_step(pg, url):
    pg.goto(url + '#/step/1'); pg.wait_for_timeout(150)
    pg.click('[data-act=mouza][data-id=M901]'); pg.click('[data-act=next]'); pg.wait_for_selector('#f-dag')

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, path in TARGETS.items():
        print(f'\n== {name} ==')
        url = path.as_uri()
        ctx = browser.new_context(viewport={'width': 1366, 'height': 860})
        ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:')) else r.abort())
        pg = ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        # ---------- A1 ----------
        open_sample(pg, url, 'case-03')
        lst = "getComputedStyle(document.querySelector('.result-aside ol')).listStyleType"
        ok(pg.evaluate(lst) == 'bengali', 'A1: next-steps list uses Bangla numbers in Bangla mode')
        pg.goto(url + '#/step/1'); pg.wait_for_timeout(150)
        ok(pg.evaluate("getComputedStyle(document.querySelector('.wizard-steps ol')).listStyleType") == 'none', 'A1: step list stays unnumbered (no extra markers)')
        open_sample(pg, url, 'case-03'); pg.click('[data-act=lang]'); pg.wait_for_timeout(150)
        ok(pg.evaluate(lst) == 'decimal', 'A1: English mode keeps 1. 2. 3.')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(150)

        # ---------- A2 ----------
        pg.evaluate("location.hash = '#/history'"); pg.wait_for_timeout(250)
        dates = pg.eval_on_selector_all('.timeline .date', 'els => els.map(e => e.textContent)')
        ok('১৫ জানুয়ারি ২০২৩' in dates and '৩০ জুন ২০১৫' in dates, f'A2: history shows long Bangla dates {dates}')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(150)
        dates_en = pg.eval_on_selector_all('.timeline .date', 'els => els.map(e => e.textContent)')
        ok('15 January 2023' in dates_en and '30 June 2015' in dates_en, f'A2: English long dates {dates_en}')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(150)
        pg.evaluate("location.hash = '#/report'"); pg.wait_for_timeout(250)
        stamp = pg.inner_text('.report table tr:nth-child(2) td:nth-child(2)')
        ok(any(w in stamp for w in ['রাত', 'সকাল', 'দুপুর', 'বিকাল', 'সন্ধ্যা']) and ',' in stamp, f'A2: report time stamp in words: "{stamp}"')
        r = pg.evaluate("""() => { const f = TS.ui.f, mk = h => { const d = new Date(2026, 9, 18, h, 5); return f.timeOfDay(d); };
          return { tod: [4, 5, 11, 12, 14, 15, 17, 18, 19, 20, 23].map(mk), bad: f.dateLong('not-a-date'), m13: f.dateLong('2026-13-01'), empty: f.dateLong('') }; }""")
        exp = ['রাত ৪:০৫', 'সকাল ৫:০৫', 'সকাল ১১:০৫', 'দুপুর ১২:০৫', 'দুপুর ২:০৫', 'বিকাল ৩:০৫', 'বিকাল ৫:০৫', 'সন্ধ্যা ৬:০৫', 'সন্ধ্যা ৭:০৫', 'রাত ৮:০৫', 'রাত ১১:০৫']
        ok(r['tod'] == exp, f'A2: time-of-day boundaries {r["tod"]}')
        ok(r['m13'] == '০১-১৩-২০২৬' and r['empty'] == '' and isinstance(r['bad'], str), f'A2: invalid dates fall back safely {r["m13"]!r}, {r["empty"]!r}')

        # ---------- A3 ----------
        pg.goto(url + '#/step/1'); pg.wait_for_timeout(150)
        card = pg.locator('.wizard-steps .help-card')
        ok(card.is_visible() and pg.get_attribute('.help-card .hc-num', 'href') == 'tel:16122' and '১৬১২২' in card.inner_text()
           and 'সরকারি সেবা নয়' in card.inner_text(), 'A3: help card with 16122 and "not a government service" on wide screens')
        pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(150)
        ok(not pg.locator('.help-card').is_visible(), 'A3: help card hidden on phones (no extra clutter)')
        pg.set_viewport_size({'width': 1366, 'height': 860})

        # ---------- A4 ----------
        ok(pg.evaluate("getComputedStyle(document.documentElement).scrollPaddingTop") == '90px', 'A4: scroll-padding-top keeps fields clear of the sticky header')
        ok(pg.evaluate("""() => { const d = document.createElement('div'); d.className = 'card'; d.style.display = 'block'; d.hidden = true;
          document.body.appendChild(d); const v = getComputedStyle(d).display; d.remove(); return v; }""") == 'none', 'A4: [hidden] always hides, even over component styles')

        # ---------- B1 ----------
        fresh = ctx.new_page(); to_dag_step(fresh, url)          # fresh page = empty form (an earlier sample pre-fills the dag)
        ok(fresh.inner_html('#dag-lookup').strip() == '', 'B1: no status before typing'); fresh.close()
        to_dag_step(pg, url)
        pg.fill('#f-dag', '১০৩'); pg.wait_for_timeout(100)
        t = pg.inner_text('#dag-lookup')
        ok('নমুনা রেকর্ডে পাওয়া গেছে' in t and 'খতিয়ান ২০৩' in t and '৪০ শতাংশ' in t
           and 'ok' in pg.get_attribute('#f-dag >> xpath=ancestor::div[contains(@class,"field")][1]', 'class'), f'B1: dag ১০৩ found → green state: "{t}"')
        ok('যাচাইকৃত' not in t and 'verified' not in t.lower(), 'B1: wording never says "verified"')
        pg.fill('#f-dag', '999'); pg.wait_for_timeout(100)
        chips = pg.eval_on_selector_all('#dag-lookup [data-act=pickdag-inline]', 'els => els.map(e => e.textContent)')
        ok('নমুনা রেকর্ডে নেই' in pg.inner_text('#dag-lookup') and [c.translate(BN) for c in chips] == ['101', '102', '103', '104', '105', '106'],
           f'B1: dag 999 not found → this mouza\'s sample dags {chips}')
        pg.fill('#f-dag', '১০ক'); pg.wait_for_timeout(100)
        ok(pg.inner_html('#dag-lookup').strip() == '', 'B1: letters → no lookup (Next still shows the normal error)')
        pg.fill('#f-dag', '999'); pg.wait_for_timeout(100)
        pg.click('#dag-lookup [data-act=pickdag-inline][data-dag="105"]'); pg.wait_for_timeout(100)
        ok(pg.input_value('#f-dag') == '১০৫' and 'খতিয়ান ২০৫' in pg.inner_text('#dag-lookup') and pg.evaluate("location.hash") == '#/step/2',
           'B1: tapping a suggested dag fills the box and stays on the step')
        pg.click('[data-act=next]'); pg.wait_for_selector('[data-act=seller]')
        ok('ফারুক আহমেদ' in pg.inner_text('.choice-list'), 'B1: Next continues to the seller step for the chosen dag')
        to_dag_step(pg, url); pg.fill('#f-dag', '999'); pg.click('[data-act=next]'); pg.wait_for_selector('.result-head')
        ok('grey' in pg.get_attribute('.result-head', 'class'), 'B1: unknown dag + Next still gives the grey result (unchanged)')
        to_dag_step(pg, url); pg.fill('#f-dag', '103'); pg.click('[data-act=lang]'); pg.wait_for_timeout(150)
        ok('Found in sample records' in pg.inner_text('#dag-lookup') and 'khatian 203' in pg.inner_text('#dag-lookup'), 'B1: English wording after language switch')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(150)

        # ---------- Accessibility on the new states ----------
        if AXE:
            bad = []
            for theme in ['light', 'dark']:
                if theme == 'dark': pg.click('[data-act=theme]'); pg.wait_for_timeout(200)
                for setup in ['found', 'none', 'history', 'report']:
                    if setup in ('found', 'none'):
                        to_dag_step(pg, url); pg.fill('#f-dag', '103' if setup == 'found' else '999'); pg.wait_for_timeout(250)
                    else:
                        open_sample(pg, url, 'case-03'); pg.evaluate(f"location.hash = '#/{setup}'"); pg.wait_for_timeout(500)
                    pg.wait_for_timeout(600)                                  # let entrance/theme transitions finish
                    pg.add_script_tag(content=AXE)
                    v = pg.evaluate("""async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, preload: false })).violations.map(x => x.id + ':' + x.nodes.length)""")
                    bad += [f'{theme}/{setup}/{x}' for x in v]
            pg.click('[data-act=theme]')
            ok(not bad, f'Accessibility (axe WCAG A/AA) on new states, light + dark: {bad or "0 violations"}')
        else:
            print('  – accessibility audit skipped (set AXE_PATH to axe.min.js)')

        ok(not errors, f'No JavaScript errors ({errors[:2]})')
        ctx.close()
    browser.close()

print(f'\n{checks - len(failures)} / {checks} v2.1 checks passed')
sys.exit(1 if failures else 0)
