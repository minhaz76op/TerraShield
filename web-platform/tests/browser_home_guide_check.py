"""
TerraShield — v2.3 checks: homepage hero redesign + beginner's land-document guide (#/calc/guide).
Optional; needs Python + Playwright. Runs on BOTH web/index.html and dist/terrashield.html,
from disk, with the network blocked (proves offline use).
  HERO   every link/button still works, disclosures kept, decorative art never blocks clicks,
         map is labelled fictional, light button in light + dark, reduced motion, English
  HEADER nav links never wrap; menu button takes over below 1200 px (v3)
  GUIDE  reachable from calculator tabs + hero; 4 concepts, 7 steps, 7 mistakes, 7-item checklist
         (not saved anywhere), educational disclaimer top + bottom, no "verified/safe" wording,
         examples match the fictional sample records, jump buttons keep the route, English
  +      engine never called, no sideways scroll 320–1440 px, axe WCAG A/AA light + dark, no JS errors
Run:  python3 tests/browser_home_guide_check.py      (AXE_PATH=/path/to/axe.min.js for the audit)
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS = {'web/index.html': ROOT / 'web/index.html', 'dist/terrashield.html': ROOT / 'dist/terrashield.html'}
AXE = pathlib.Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') and pathlib.Path(os.environ['AXE_PATH']).exists() else None
DEMO_STRIP = 'হ্যাকাথন প্রোটোটাইপ · সব নাম, স্থান, খতিয়ান ও দলিল কাল্পনিক · কোনো সরকারি সেবা বা সিস্টেমের সাথে যুক্ত নয় · অফলাইনে চলে'
failures, checks = [], 0

def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

def home(pg, url):
    pg.goto(url + '#/'); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(250)

def lum(rgb):
    import re
    r, g, b = [int(x) / 255 for x in re.findall(r'\d+', rgb)[:3]]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)

WRAP = "window.__engineCalls = 0; const _c = TS.engine.check; TS.engine.check = function(){ window.__engineCalls++; return _c.apply(this, arguments); }; 0"

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, path in TARGETS.items():
        print(f'\n== {name} ==')
        url = path.as_uri()
        ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:')) else r.abort())
        pg = ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        # ---------------- HERO ----------------
        home(pg, url); pg.evaluate(WRAP)
        h1 = pg.inner_text('.hero h1')
        ok('জমি কেনার আগে' in h1 and 'রেকর্ড মিলিয়ে নিন' in h1, 'Hero: headline text unchanged')
        ok(pg.inner_text('#demostrip').strip() == DEMO_STRIP, 'Fictional-data strip text unchanged')
        hrefs = pg.eval_on_selector_all('.hero-ctas a', 'e => e.map(a => a.getAttribute("href"))')
        ok(hrefs == ['#/step/1', '#/samples', '#/judge'], f'Hero: the 3 calls to action keep their targets {hrefs}')
        ok(pg.get_attribute('.hero .pill.solid', 'href') == 'tel:16122' and 'সব তথ্য কাল্পনিক নমুনা' in pg.inner_text('.hero .pill.fict'),
           'Hero: hotline 16122 link + "all data fictional" pill kept')
        ok(pg.locator('.hero [data-act=say]').count() == 1, 'Hero: listen (voice) button kept')
        ok('উদাহরণ' in pg.inner_text('.demo-card .tag-sim') and 'কাল্পনিক' in pg.inner_text('.map-card .tag-sim'),
           'Hero: example card tagged "উদাহরণ", map tagged "কাল্পনিক"')
        ok(pg.get_attribute('.map-card', 'role') == 'img' and 'কাল্পনিক' in pg.get_attribute('.map-card', 'aria-label')
           and pg.get_attribute('.map-svg', 'aria-hidden') == 'true' and pg.get_attribute('.hero-parcels', 'aria-hidden') == 'true',
           'Hero: map has a text alternative; decorative SVGs hidden from screen readers')
        blocked = pg.evaluate("""() => [...document.querySelectorAll('.hero-ctas a, .hero-guide a, .hero .pill.solid')].filter(a => {
            const r = a.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !(el && a.contains(el)); }).map(a => a.textContent)""")
        ok(blocked == [], f'Hero: decorative art never covers a button {blocked}')
        ok(pg.evaluate("getComputedStyle(document.querySelector('.hero-parcels')).pointerEvents") == 'none', 'Hero: background parcels ignore clicks')
        light_bg = pg.evaluate("getComputedStyle(document.querySelector('.hero .btn-primary')).backgroundColor")
        ok(lum(light_bg) > .8, f'Hero: main button is light on the dark band (light theme) {light_bg}')
        ok(len(pg.locator('.hero-trust li').all()) == 3, 'Hero: trust row has 3 items')
        # Every hero link works
        pg.click('.hero-ctas a[href="#/step/1"]'); pg.wait_for_selector('[data-act=mouza]')
        ok(pg.evaluate('location.hash') == '#/step/1', 'Hero → "জমি যাচাই করুন" opens step 1')
        home(pg, url); pg.click('.hero-ctas a[href="#/samples"]'); pg.wait_for_selector('[data-act=sample]')
        ok(pg.locator('[data-act=sample]').count() == 11, 'Hero → samples page (11 sample cases)')
        home(pg, url); pg.click('.hero-guide a'); pg.wait_for_selector('.guide-page')
        ok(pg.evaluate('location.hash') == '#/calc/guide', 'Hero → step-by-step guide')
        home(pg, url); pg.click('.hero-ctas a[href="#/judge"]'); pg.wait_for_timeout(700)
        ok(pg.evaluate("document.body.classList.contains('story')") and pg.locator('#screen-host .hero-forest, #screen-host main').count() >= 1, 'Hero → Judge Mode story starts')
        pg.click('[data-act=story-exit] >> nth=-1'); pg.wait_for_timeout(400)
        ok(not pg.evaluate("document.body.classList.contains('story')"), 'Judge Mode exits cleanly')
        # Dark theme
        home(pg, url); pg.click('[data-act=theme]'); pg.wait_for_timeout(300)
        dark_bg = pg.evaluate("getComputedStyle(document.querySelector('.hero .btn-primary')).backgroundColor")
        ok(pg.evaluate("document.documentElement.classList.contains('dark')") and lum(dark_bg) > .7, f'Hero: main button stays light in dark mode {dark_bg}')
        pg.click('[data-act=theme]'); pg.wait_for_timeout(200)
        # English
        pg.click('[data-act=lang]'); pg.wait_for_timeout(250)
        ok('Nomunapur mouza · map' in pg.inner_text('.map-title') and 'Works offline' in pg.inner_text('.hero-trust')
           and 'step-by-step guide' in pg.inner_text('.hero-guide'), 'Hero: English text for map, trust row and guide link')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(250)

        # ---------------- HEADER ----------------
        for w in [1210, 1366, 1440]:                      # v3: the ☰ menu takes over below 1200 px (Admin Panel button added)
            pg.set_viewport_size({'width': w, 'height': 900}); home(pg, url)
            hs = pg.eval_on_selector_all('.site-nav a', 'e => e.map(a => Math.round(a.getBoundingClientRect().height))')
            ok(len(hs) == 4 and max(hs) <= 48, f'Header at {w}px: 4 nav links on one line each {hs}')
        pg.set_viewport_size({'width': 1024, 'height': 900}); home(pg, url)
        ok(not pg.locator('.site-nav').is_visible() and pg.locator('.menu-btn').is_visible(), 'Header at 1024px: menu button instead of crowded links')
        pg.set_viewport_size({'width': 1180, 'height': 900}); home(pg, url)
        ok(not pg.locator('.site-nav').is_visible() and pg.locator('.menu-btn').is_visible(), 'Header at 1180px: menu button (no room for every link + Admin Panel)')
        pg.set_viewport_size({'width': 1024, 'height': 900}); home(pg, url)
        pg.click('.menu-btn'); pg.wait_for_timeout(200)
        ok(pg.locator('.mobile-menu a[href="#/calc"]').is_visible(), 'Mobile menu still lists the calculator')
        pg.set_viewport_size({'width': 1440, 'height': 900})

        # ---------------- GUIDE ----------------
        pg.goto(url + '#/calc'); pg.wait_for_selector('#c-total'); pg.evaluate(WRAP)
        ok(pg.get_attribute('.calc-tabs a[href="#/calc"]', 'aria-current') == 'page' and pg.locator('.calc-tabs a[href="#/calc/guide"]').count() == 1,
           'Calculator page shows tabs: ক্যালকুলেটর (current) | ধাপে ধাপে নির্দেশিকা')
        before = pg.evaluate('JSON.stringify(Object.keys(localStorage).sort())')
        pg.click('.calc-tabs a[href="#/calc/guide"]'); pg.wait_for_selector('.guide-page')
        ok(pg.inner_text('h1') == 'ধাপে ধাপে নির্দেশিকা' and pg.get_attribute('.calc-tabs a[href="#/calc/guide"]', 'aria-current') == 'page'
           and pg.get_attribute('.site-nav a[href="#/calc"]', 'aria-current') == 'page', 'Guide opens from the tab; tab and header both mark it current')
        titles = pg.eval_on_selector_all('.guide-concept h2', 'e => e.map(x => x.textContent)')
        ok(titles == ['খতিয়ান', 'দাগ নম্বর', 'দলিল', 'নামজারি'], f'Guide explains the 4 concepts {titles}')
        body = pg.inner_text('#view')
        ok(all(k in body for k in ['কী থাকে', 'কীভাবে পড়বেন', 'কী মিলিয়ে দেখবেন', 'অবস্থা কীভাবে বুঝবেন']), 'Guide: contents, how to read, what to check, namjari status')
        ok(pg.eval_on_selector_all('.guide-status dt', 'e => e.map(x => x.textContent)') == ['অনুমোদিত', 'চলমান', 'নামঞ্জুর', 'নামজারি হয়নি'], 'Guide: 4 namjari statuses explained')
        ok(pg.locator('.guide-example').count() == 4 and all('কাল্পনিক উদাহরণ' in x for x in pg.eval_on_selector_all('.guide-example', 'e => e.map(x => x.textContent)')),
           'Guide: every example is labelled "কাল্পনিক উদাহরণ"')
        steps = pg.eval_on_selector_all('.guide-steps .n', 'e => e.map(x => x.textContent)')
        ok(steps == ['১', '২', '৩', '৪', '৫', '৬', '৭'], f'Guide: 7-step workflow, Bangla numbers {steps}')
        ok(pg.locator('.guide-mistakes li').count() == 7, 'Guide: 7 common mistakes')
        edu = pg.eval_on_selector_all('.guide-edu, .guide-page .disclaimer', 'e => e.map(x => x.textContent)')
        ok(len(edu) == 2 and all('আইনি পরামর্শ নয়' in x and 'একাই নিঃসন্দেহ মালিকানা প্রমাণ করে না' in x for x in edu),
           'Guide: "educational, not legal advice; no single paper proves ownership" at top and bottom')
        ok(not any(w in body for w in ['যাচাইকৃত', 'নিরাপদ জমি', 'সরকারি অনুমোদিত', '১০০% নিশ্চিত']), 'Guide never says verified / safe / officially approved')
        # Examples match the fictional data
        facts = pg.evaluate("""() => { const d = TS.data, pl = d.plots.find(x => x.mouzaId === 'M901' && x.dag === 103),
            k = d.khatians.find(x => x.khatianNo === '203'), dd = d.deeds.find(x => x.deedNo === '0102/2023'),
            nm = id => d.people.find(p => p.id === id).name.bn;
          return { total: pl.totalArea, kdag: k.dag, owner: nm(k.owners[0].personId), sold: dd.area, seller: nm(dd.sellerId), buyer: nm(dd.buyerId) }; }""")
        ok(facts == {'total': 40, 'kdag': 103, 'owner': 'জামাল মিয়া', 'sold': 30, 'seller': 'জামাল মিয়া', 'buyer': 'নাসরিন বেগম'}
           and all(s in body for s in ['মোট জমি ৪০ শতাংশ', '৩০ শতাংশ নাসরিন বেগমকে', 'বাকি থাকার কথা ১০ শতাংশ']), 'Guide examples match the fictional sample records exactly')
        # Checklist: works, saves nothing
        boxes = pg.locator('.guide-check input[type=checkbox]')
        ok(boxes.count() == 7, 'Guide: 7-item checklist')
        pg.click('.guide-check label >> nth=0'); pg.click('.guide-check label >> nth=3')
        ok(pg.evaluate("[...document.querySelectorAll('.guide-check input')].filter(i => i.checked).length") == 2, 'Checklist ticks by tapping the text')
        ok(pg.evaluate('JSON.stringify(Object.keys(localStorage).sort())') == before, 'Checklist saves nothing (localStorage unchanged)')
        # Jump buttons
        pg.click('.guide-toc [data-jump="g-namjari"]'); pg.wait_for_timeout(700)
        ok(pg.evaluate('document.activeElement.id') == 'g-namjari' and pg.evaluate('location.hash') == '#/calc/guide', 'Jump button moves focus to নামজারি and keeps the page')
        top = pg.evaluate("document.getElementById('g-namjari').getBoundingClientRect().top")
        ok(60 < top < 220, f'…and the section is not hidden under the sticky header (top {round(top)}px)')
        ok(pg.evaluate('window.__engineCalls') == 0, 'Guide + calculator tabs never call the rule engine')
        # Practice buttons
        pg.click('.guide-practice a[href="#/samples"]'); pg.wait_for_selector('[data-act=sample]')
        ok(pg.evaluate('location.hash') == '#/samples', 'Guide → samples link works')
        pg.goto(url + '#/calc/guide'); pg.wait_for_selector('.guide-page')
        pg.click('.guide-concept .gc-cta a'); pg.wait_for_selector('#c-total')
        ok(pg.evaluate('location.hash') == '#/calc', 'Guide → "অংশ থেকে জমি হিসাব করুন" opens the calculator')
        # English
        pg.goto(url + '#/calc/guide'); pg.wait_for_selector('.guide-page'); pg.click('[data-act=lang]'); pg.wait_for_timeout(250)
        en = pg.inner_text('#view')
        ok(pg.inner_text('h1') == 'Step-by-step guide' and pg.eval_on_selector_all('.guide-concept h2', 'e => e.map(x => x.textContent)') == ['Khatian', 'Dag number', 'Deed (dalil)', 'Namjari']
           and 'not legal advice' in en and 'verified' not in en.replace('not legal advice or official verification', ''), 'Guide in English (same structure, same disclaimer)')
        ok(pg.eval_on_selector_all('.guide-steps .n', 'e => e.map(x => x.textContent)') == ['1', '2', '3', '4', '5', '6', '7'], 'English step numbers')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)

        # ---------------- Reduced motion ----------------
        rm = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); rp = rm.new_page(); home(rp, url)
        ok(rp.evaluate("getComputedStyle(document.querySelector('.map-scan')).display") == 'none'
           and rp.evaluate("getComputedStyle(document.querySelector('.mp-target')).animationName") == 'none', 'Reduced motion: map scan + marching outline switched off')
        rm.close()

        # ---------------- Layout ----------------
        worst = {}
        for w in [320, 390, 768, 1024, 1366, 1440]:
            pg.set_viewport_size({'width': w, 'height': 900})
            for h in ['#/', '#/calc/guide', '#/calc']:
                pg.goto(url + h); pg.wait_for_timeout(250)
                worst[f'{w}{h}'] = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        bad = {k: v for k, v in worst.items() if v > 1}
        ok(not bad, f'No sideways scroll on home / guide / calculator at 320–1440 px {bad or ""}')
        pg.set_viewport_size({'width': 1440, 'height': 900})

        # ---------------- Accessibility ----------------
        if AXE:
            bad = []
            for theme in ['light', 'dark']:
                for h in ['#/', '#/calc/guide', '#/calc']:
                    pg.goto(url + h); pg.wait_for_timeout(300)
                    if theme == 'dark' and not pg.evaluate("document.documentElement.classList.contains('dark')"): pg.click('[data-act=theme]')
                    if theme == 'light' and pg.evaluate("document.documentElement.classList.contains('dark')"): pg.click('[data-act=theme]')
                    pg.wait_for_timeout(900)
                    pg.add_script_tag(content=AXE)
                    v = pg.evaluate("""async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, preload: false })).violations.map(x => x.id + ':' + x.nodes.length)""")
                    bad += [f'{theme}{h}:{x}' for x in v]
            if pg.evaluate("document.documentElement.classList.contains('dark')"): pg.click('[data-act=theme]')
            ok(not bad, f'Accessibility (axe WCAG A/AA) on home, guide, calculator — light + dark: {bad or "0 violations"}')
        else:
            print('  – accessibility audit skipped (set AXE_PATH to axe.min.js)')

        ok(not errors, f'No JavaScript errors ({errors[:2]})')
        ctx.close()
    browser.close()

print(f'\n{checks - len(failures)} / {checks} v2.3 home + guide checks passed')
sys.exit(1 if failures else 0)
