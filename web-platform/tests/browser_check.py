"""
TerraShield — browser check (optional; needs Python + Playwright + Chromium).
Opens BOTH versions straight from disk (file://) with ALL network blocked, then:
  1. Judge Mode "Run all tests" must show every shared case passing.
  2. Every shared case is opened through the real screens; the colour and the rule
     cards on screen must match shared/test-cases.json.
  3. R7b shows as a blue info card and never changes the colour by itself.
  4. Live double-sale demo: add sale -> red (R1+R2); reset -> green again.
  5. The exact Bangla disclaimer is shown on results; English switch works.
  6. No horizontal scrolling at 320 px and 390 px widths; no JavaScript errors.
Run:  python3 tests/browser_check.py
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
CASES = json.loads((ROOT / 'shared/test-cases.json').read_text(encoding='utf8'))['cases']
DISCLAIMER = 'এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা। এটি আইনি যাচাই বা মালিকানার প্রমাণ নয়। জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।'
TARGETS = {'web/index.html': ROOT / 'web/index.html', 'dist/terrashield.html': ROOT / 'dist/terrashield.html'}

failures, checks = [], 0
def ok(cond, label):
    global checks
    checks += 1
    if not cond: failures.append(label)
    print(('  ✓ ' if cond else '  ✗ ') + label)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, path in TARGETS.items():
        print(f'\n== {name} ==')
        url = path.as_uri()
        ctx = browser.new_context(viewport={'width': 390, 'height': 844})
        ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:')) else r.abort())
        pg = ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        # 1. Judge Mode run-all-tests
        pg.goto(url + '?judge=1#/samples'); pg.wait_for_timeout(300)
        pg.click('[data-act=run-tests]'); pg.wait_for_timeout(200)
        score = pg.inner_text('.big-score')
        ok(score.startswith('✓') and f'{len(CASES)}' in score.translate(str.maketrans('০১২৩৪৫৬৭৮৯', '0123456789')),
           f'Judge Mode run-all-tests: {score.strip()}')

        # 2 + 3. Every sample case through the screens
        for c in [c for c in CASES if c['sample']]:
            pg.goto(url + '#/samples'); pg.wait_for_timeout(150)
            pg.click(f'[data-act=sample][data-id="{c["id"]}"]'); pg.wait_for_selector('.result-head', timeout=4000)
            cls = pg.get_attribute('.result-head', 'class')
            rules = sorted(pg.eval_on_selector_all('article.finding', 'els => els.map(e => e.dataset.rule)'))
            ok(c['expect']['status'] in cls and rules == sorted(c['expect']['rules']),
               f'{c["id"]}: screen shows {cls.split()[-1]} {rules}')
            if c['id'] == 'case-09':
                ok(pg.get_attribute('article[data-rule=R7b]', 'class') == 'finding info' and 'green' in cls,
                   'R7b is a blue info card and the result stays green')
            if c['expect']['status'] != 'grey':
                ok(DISCLAIMER in pg.inner_text('.disclaimer'), f'{c["id"]}: exact Bangla disclaimer shown')

        # 4. Live double-sale demo
        pg.goto(url + '?judge=1#/samples'); pg.wait_for_timeout(200)
        pg.click('[data-act=demo-reset]'); pg.click('[data-act=demo-check]'); pg.wait_for_selector('.result-head')
        ok('green' in pg.get_attribute('.result-head', 'class'), 'Demo before sale: Rahim / dag 101 is green')
        pg.goto(url + '?judge=1#/samples'); pg.wait_for_timeout(200)
        # (state lives in memory; a fresh goto keeps it because only the hash/search changes on file://? -> re-run in same page)
        pg.evaluate("location.hash = '#/samples'"); pg.wait_for_timeout(200)
        pg.click('[data-act=demo-script]'); pg.wait_for_timeout(200)
        pg.click('[data-act=demo-check]'); pg.wait_for_selector('.result-head')
        rules = sorted(pg.eval_on_selector_all('article.finding', 'els => els.map(e => e.dataset.rule)'))
        ok('red' in pg.get_attribute('.result-head', 'class') and rules == ['R1', 'R2'], f'Demo after sale: red {rules}')
        pg.evaluate("location.hash = '#/samples'"); pg.wait_for_timeout(200)
        pg.click('[data-act=demo-reset]'); pg.click('[data-act=demo-check]'); pg.wait_for_selector('.result-head')
        ok('green' in pg.get_attribute('.result-head', 'class'), 'Demo after reset: green again')

        # 5. English switch
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)
        ok('No mismatch found in our sample records' in pg.inner_text('.result-head h1'), 'English switch: headline in English')
        pg.click('[data-act=lang]'); pg.wait_for_timeout(200)

        # 6. Layout: no sideways scroll on small phones
        for w in (320, 390):
            pg.set_viewport_size({'width': w, 'height': 800})
            worst = 0
            for h in ['#/', '#/step/1', '#/step/2', '#/step/5', '#/samples', '#/help', '#/result', '#/evidence/0', '#/history', '#/report']:
                pg.evaluate(f"location.hash = '{h}'"); pg.wait_for_timeout(150)
                worst = max(worst, pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
            ok(worst <= 1, f'No sideways scroll at {w}px on 10 screens (worst overflow {worst}px)')

        # 7. Voice input (simulated speech engine — real mics aren't available headless)
        vp = ctx.new_page()
        vp.add_init_script("""
          window.__heard = [];
          function FakeRec(){ var s=this; this.start=function(){ setTimeout(function(){
            var a = window.__heard.shift() || ['???'];
            if (a[0]==='???') { s.onend && s.onend(); return; }
            s.onresult && s.onresult({results:[a.map(function(x){return {transcript:x};})]}); s.onend && s.onend(); }, 150); };
            this.stop=function(){}; }
          ['webkitSpeechRecognition','SpeechRecognition'].forEach(function(n){Object.defineProperty(window,n,{value:FakeRec,configurable:true,writable:true});});""")
        vp.goto(url + '#/step/1'); vp.click('[data-act=mouza][data-id=M901]'); vp.click('[data-act=next]'); vp.wait_for_timeout(150)
        vp.evaluate("window.__heard=[['এক শূন্য পাঁচ']]"); vp.click('[data-act=mic]'); vp.wait_for_selector('.heard')
        vp.click('[data-act=sheet-ok]'); vp.wait_for_timeout(100)
        ok(vp.input_value('#f-dag') == '১০৫', 'Voice: "এক শূন্য পাঁচ" → confirm → dag ১০৫')
        vp.evaluate("window.__heard=[['???'],['???']]"); vp.click('[data-act=mic]'); vp.wait_for_timeout(700)
        ok(not vp.is_visible('.sheet') and vp.evaluate('document.activeElement.id') == 'f-dag',
           'Voice: two failed tries → panel closes, keypad input focused')
        vp.goto(url + '#/step/4'); vp.wait_for_timeout(100)
        vp.evaluate("window.__heard=[['সাড়ে বারো']]"); vp.click('[data-act=mic]'); vp.wait_for_selector('.heard'); vp.click('[data-act=sheet-ok]')
        ok(vp.input_value('#f-area') == '১২.৫', 'Voice: "সাড়ে বারো" → area ১২.৫')
        vp.click('[data-act=lang]'); vp.wait_for_timeout(100)
        ok(vp.locator('[data-act=mic]').count() == 0, 'Voice input hidden in English mode (approved: Bangla only)')
        vp.close()

        # 8. Judge Mode story player (#/judge): real app inside the phone frame
        sp = ctx.new_page(); sp.set_viewport_size({'width': 1440, 'height': 900})
        sp.goto(url + '#/judge'); sp.wait_for_timeout(700)
        ok(sp.evaluate("document.body.classList.contains('story')") and sp.locator('#screen-host #scope').count() == 1
           and sp.locator('.story-list li').count() == 6, 'Judge story: starts, app moved into phone frame, 6 steps')
        sp.click('[data-act=story-goto][data-i="3"]'); sp.wait_for_selector('#screen-host .result-head', timeout=5000)
        rules = sorted(sp.eval_on_selector_all('#screen-host article.finding', 'els => els.map(e => e.dataset.rule)'))
        ok('red' in sp.get_attribute('#screen-host .result-head', 'class') and rules == ['R1', 'R2'], f'Judge story step 4: red {rules} inside the frame')
        sp.click('[data-act=story-goto][data-i="5"]'); sp.wait_for_timeout(700)
        sc = sp.inner_text('#screen-host .big-score').translate(str.maketrans('০১২৩৪৫৬৭৮৯', '0123456789'))
        ok(sc.startswith('✓') and f'{len(CASES)} / {len(CASES)}' in sc, f'Judge story step 6: {sc.strip()} inside the frame')
        sp.click('#screen-host main'); sp.wait_for_timeout(250)
        ok('চালান' in sp.inner_text('#story-toggle') or 'Play' in sp.inner_text('#story-toggle'), 'Judge story: touching the live screen pauses it')
        sp.click('[data-act=story-exit]'); sp.wait_for_timeout(400)
        ok(not sp.evaluate("document.body.classList.contains('story')") and sp.locator('body > #scope').count() == 1, 'Judge story: exit restores the normal page')
        sp.close()

        # 9. Dark mode toggle persists after reload
        dp = ctx.new_page(); dp.goto(url); dp.wait_for_timeout(200)
        dp.click('[data-act=theme]'); dp.wait_for_timeout(100)
        was = dp.evaluate("document.documentElement.classList.contains('dark')")
        dp.reload(); dp.wait_for_timeout(300)
        ok(was and dp.evaluate("document.documentElement.classList.contains('dark')"), 'Dark mode: toggles and is kept after reload')
        dp.click('[data-act=theme]'); dp.close()

        # 10. Desktop layout (1366 px): no sideways scroll, two-column result
        wp = ctx.new_page(); wp.set_viewport_size({'width': 1366, 'height': 860})
        wp.goto(url + '#/samples'); wp.wait_for_timeout(150); wp.click('[data-act=sample][data-id="case-05"]'); wp.wait_for_selector('.result-head')
        cols = wp.evaluate("getComputedStyle(document.querySelector('.result-grid')).gridTemplateColumns.split(' ').length")
        worst = 0
        for h in ['#/', '#/step/1', '#/samples', '#/help', '#/result', '#/evidence/0', '#/history', '#/report']:
            wp.evaluate(f"location.hash = '{h}'"); wp.wait_for_timeout(120)
            worst = max(worst, wp.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
        ok(cols == 2 and worst <= 1, f'Desktop 1366 px: result in 2 columns, no sideways scroll (worst {worst}px)')
        wp.close()

        # Bangla font really loaded (offline)
        ok(pg.evaluate("document.fonts.check('16px \"Hind Siliguri\"', 'জমি')"), 'Bangla font loaded with network blocked')
        ok(not errors, f'No JavaScript errors ({errors[:2]})')
        ctx.close()
    browser.close()

print(f'\n{checks - len(failures)} / {checks} browser checks passed')
sys.exit(1 if failures else 0)
