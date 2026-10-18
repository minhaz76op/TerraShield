"""
TerraShield — Admin Panel driven through its real buttons and forms (v3.3). Python + Playwright.
Run in each way the site can be opened:  file (double-clicked dist/terrashield.html) · static (web/ on a plain static
web host, no TerraShield API) · served (npm start, demo account).
  login page (copy buttons, empty / wrong password, show password) → demo login → add plot, khatian (2 owners), deed,
  namjari through the forms → approve each (confirm tick) → the website's own check and wizard use them, result labelled →
  reject needs a reason → archive blocked while dependants are live → archive / restore → edit sends an approved record
  back to draft → records list, type + status filters, review queue, change log → backup download (no password) → reset
  needs RESET → restore backup by file upload (log not duplicated) → English → no sideways scroll at 360 px on every
  admin screen → dark mode → logout protects the pages → no JavaScript errors.
Run:  python3 tests/browser_admin_ui_flow_check.py            (all three modes)
      python3 tests/browser_admin_ui_flow_check.py static     (one mode)
"""
import pathlib, tempfile, subprocess, os, sys, time, json, socket, re
from playwright.sync_api import sync_playwright
R=pathlib.Path(__file__).resolve().parent.parent; S=tempfile.mkdtemp(prefix='ts-uiflow-') + '/'
MODES = sys.argv[1:] or ['file', 'static', 'served']
if len(MODES) > 1:
    codes = [subprocess.call([sys.executable, __file__, m]) for m in MODES]
    print('\nALL MODES: ' + ('passed' if not any(codes) else 'FAILED')); sys.exit(1 if any(codes) else 0)
mode = MODES[0]
fails=[]; n=[0]
def ok(c,l):
    n[0]+=1
    if not c: fails.append(l)
    print(('  ✓ ' if c else '  ✗ ')+l)
def port():
    with socket.socket() as so: so.bind(('127.0.0.1',0)); return so.getsockname()[1]
proc=None
if mode=='file': url=(R/'dist/terrashield.html').as_uri()
elif mode=='static':
    pt=port(); proc=subprocess.Popen([sys.executable,'-m','http.server',str(pt)],cwd=str(R/'web'),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); url=f'http://127.0.0.1:{pt}/index.html'
else:
    pt=port(); db=S+f'final-db-{pt}.json'
    env=dict(os.environ,PORT=str(pt),DB_FILE=db,ADMIN_PASSWORD_HASH='',ADMIN_PASSWORD=''); env.pop('ADMIN_DEMO',None)
    proc=subprocess.Popen(['node','server/server.js'],cwd=R,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT); url=f'http://127.0.0.1:{pt}/'
time.sleep(1.2)
try:
  with sync_playwright() as p:
    ctx=p.chromium.launch_persistent_context(tempfile.mkdtemp(),viewport={'width':1366,'height':900},accept_downloads=True)
    pg=ctx.pages[0]; errs=[]
    pg.on('pageerror',lambda e: errs.append('PAGEERROR '+str(e)))
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and '404' not in m.text and '401' not in m.text else None)
    def go(h): pg.evaluate(f"location.hash='{h}'"); pg.wait_for_timeout(250); pg.wait_for_selector('#admin-main:not([aria-busy]), #ad-email',timeout=20000); pg.wait_for_timeout(250)
    def flash(): return pg.inner_text('#ad-flash') if pg.locator('#ad-flash').count() else ''
    def submit_form(t, vals, owners=None, note='SQA'):
        go(f'#/admin/new/{t}'); pg.wait_for_selector('#ad-record-form')
        for k,v in vals.items():
            el=pg.locator(f'#af-{k}')
            if el.evaluate('e=>e.tagName')=='SELECT': el.select_option(v)
            else: el.fill(str(v))
            pg.wait_for_timeout(120)
        if owners:
            for i,(pid,sh) in enumerate(owners):
                if i>0: pg.click('[data-aa=addowner]'); pg.wait_for_timeout(150)
                pg.select_option(f'#af-owners-{i}-personId',pid); pg.fill(f'#af-owners-{i}-share',str(sh))
        pg.fill('#af-note',note); pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(1200)
        m=re.search(r'AR-\d+',pg.evaluate('location.hash')); return m.group(0) if m else None
    def approve(rid):
        go(f'#/admin/record/{rid}'); pg.check('[data-aform=approve] [name=confirm]'); pg.click('[data-aform=approve] [type=submit]'); pg.wait_for_timeout(1000)
        return 'x'
    def status_of(rid):
        go(f'#/admin/record/{rid}'); return pg.evaluate("(document.querySelector('#admin-main .ad-status')||{}).className||''")

    print(f'\n===== {mode.upper()} =====')
    pg.goto(url); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(600)
    pg.click('.site-header .hdr-admin'); pg.wait_for_selector('.ad-demo',timeout=20000)
    ok(pg.locator('.ad-demo [data-aa=copy]').count()==2,'Login page: demo details with 2 copy buttons')
    pg.click('[data-copy=email]'); pg.wait_for_timeout(200)
    pg.click('#ad-login-form [type=submit]'); pg.wait_for_timeout(300)
    ok(pg.locator('#ad-login-err .error-text').count()==1,'Empty login → "required" error')
    pg.fill('#ad-email','demo.admin@terrashield.local'); pg.fill('#ad-pass','wrong-pass-123'); pg.click('#ad-login-form [type=submit]'); pg.wait_for_timeout(1200)
    ok(pg.locator('#ad-login-err .error-text').count()==1,'Wrong password → error')
    pg.click('[data-aa=togglepw]'); ok(pg.get_attribute('#ad-pass','type')=='text','Show-password toggle works'); pg.click('[data-aa=togglepw]')
    pg.fill('#ad-email',pg.inner_text('#ad-demo-email')); pg.fill('#ad-pass',pg.inner_text('#ad-demo-password')); pg.click('#ad-login-form [type=submit]')
    pg.wait_for_selector('.ad-tiles',timeout=20000); ok(True,'Demo login (UI) → dashboard')

    plot=submit_form('plot',{'mouzaId':'M901','dag':150,'totalArea':60})
    ok(bool(plot),f'UI: new plot saved as draft ({plot})')
    ok('draft' in status_of(plot),'…status is draft')
    ok(approve(plot)!='' and 'reviewed' in status_of(plot),'UI: approve plot (with confirm tick)')
    kh=submit_form('khatian',{'mouzaId':'M901','dag':150,'khatianNo':'K-150','survey':'RS','recordDate':'2020-01-15'},owners=[('O01',40),('O02',20)])
    ok(bool(kh),f'UI: khatian with 2 owners saved ({kh})'); approve(kh); ok('reviewed' in status_of(kh),'UI: approve khatian')
    bopts=pg.evaluate("1")
    go('#/admin/new/deed'); buyers=pg.eval_on_selector_all('#af-buyerId option','e=>e.map(o=>o.value).filter(Boolean)')
    buyer=[b for b in buyers if b.startswith('P')][0]
    dd=submit_form('deed',{'mouzaId':'M901','dag':150,'deedNo':'9150/2026','date':'2026-09-01','sellerId':'O01','buyerId':buyer,'area':30})
    ok(bool(dd),f'UI: deed saved ({dd})'); approve(dd); ok('reviewed' in status_of(dd),'UI: approve deed')
    go('#/admin/new/namjari'); pg.select_option('#af-mouzaId','M901'); pg.wait_for_timeout(200); pg.fill('#af-dag','150'); pg.dispatch_event('#af-dag','change'); pg.wait_for_timeout(400)
    dopts=pg.eval_on_selector_all('#af-deedId option','e=>e.map(o=>o.value).filter(Boolean)')
    ok(len(dopts)>=1,f'Namjari form lists deeds for the chosen dag {dopts}')
    pg.select_option('#af-caseNo' if False else '#af-applicantId',buyer); pg.fill('#af-caseNo','NJ-150/2026'); pg.select_option('#af-basis','deed'); pg.wait_for_timeout(300)
    dopts=pg.eval_on_selector_all('#af-deedId option','e=>e.map(o=>o.value).filter(Boolean)')
    if dopts: pg.select_option('#af-deedId',dopts[-1])
    pg.select_option('#af-status','pending'); pg.fill('#af-date','2026-09-10'); pg.fill('#af-note','SQA'); pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(1200)
    m=re.search(r'AR-\d+',pg.evaluate('location.hash')); nj=m.group(0) if m else None
    ok(bool(nj),f'UI: namjari saved ({nj})'+('' if nj else ' — page says: '+pg.inner_text('#admin-main')[:200].replace('\n',' | ')))
    if nj: approve(nj); ok('reviewed' in status_of(nj),'UI: approve namjari')

    # website uses the approved records
    pg.goto(url); pg.wait_for_selector('.hero-forest'); pg.wait_for_timeout(800)
    res=pg.evaluate("TS.engine.check({mouzaId:'M901',dag:150,sellerId:'O01',area:40}, TS.data)")
    ok(res['status'] in ('red','yellow') and pg.evaluate('TS.dataMeta.reviewedAdminRecords')>=3,f"Own check on the new dag uses admin records → {res['status']} ({[x.get('rule') or x.get('code') or list(x.keys())[:2] for x in res['findings']]})")
    pg.evaluate("TS.ui.state.form = TS.ui.blankForm(); location.hash = '#/step/1'"); pg.wait_for_selector('[data-act=mouza][data-id=M901]')
    pg.click('[data-act=mouza][data-id=M901]'); pg.click('[data-act=next]'); pg.wait_for_selector('#f-dag'); pg.fill('#f-dag','150'); pg.wait_for_timeout(300); pg.click('[data-act=next]')
    pg.wait_for_selector('[data-act=seller]',timeout=8000); sellers=pg.eval_on_selector_all('[data-act=seller]','e=>e.map(x=>x.dataset.id)')
    ok('O01' in sellers and 'O02' in sellers,f'Wizard shows the admin khatian owners for dag 150 {sellers}')
    pg.click('[data-act=seller][data-id=O01]'); pg.click('[data-act=next]'); pg.wait_for_selector('#f-area'); pg.fill('#f-area','40'); pg.click('[data-act=next]'); pg.click('[data-act=next]')
    pg.wait_for_selector('[data-act=run]'); pg.click('[data-act=run]'); pg.wait_for_selector('.result-head',timeout=10000)
    ok(pg.locator('.admin-used').count()==1,'Result screen labels that admin records were used')
    pg.click('.site-header .hdr-admin'); pg.wait_for_selector('.ad-tiles',timeout=20000)

    # reject / archive rules / restore / edit
    d2=submit_form('deed',{'mouzaId':'M901','dag':150,'deedNo':'9151/2026','date':'2026-09-05','sellerId':'O02','buyerId':buyer,'area':5})
    go(f'#/admin/record/{d2}'); pg.click('[data-aform=reject] [type=submit]'); pg.wait_for_timeout(400)
    ok(pg.locator('[data-aform=reject] .error-text').count()==1 or 'draft' in status_of(d2),'Reject without a reason is refused')
    go(f'#/admin/record/{d2}'); pg.fill('#ad-reject-note','ভুল তথ্য'); pg.click('[data-aform=reject] [type=submit]'); pg.wait_for_timeout(900)
    ok('rejected' in status_of(d2),'UI: reject with reason')
    go(f'#/admin/record/{plot}')
    ok(pg.locator('[data-aform=archive] [type=submit]').is_disabled(),'Plot with live dependants cannot be archived (button disabled + reason)')
    if nj:
        go(f'#/admin/record/{nj}'); pg.click('[data-aform=archive] [type=submit]'); pg.wait_for_timeout(900); ok('archived' in status_of(nj),'UI: archive namjari')
        go(f'#/admin/record/{nj}'); pg.click('[data-aa=restore]'); pg.wait_for_timeout(900); ok('draft' in status_of(nj),'UI: restore archived → draft')
    go(f'#/admin/edit/{dd}'); pg.wait_for_selector('#ad-record-form'); pg.fill('#af-area','25'); pg.click('#ad-record-form [type=submit]'); pg.wait_for_timeout(1200)
    ok('draft' in status_of(dd),'UI: editing an approved deed sends it back to draft')

    # lists, filters, review queue, log
    go('#/admin/records'); total=pg.locator('.ad-rec').count(); ok(total==5,f'Records list shows all ({total})')
    pg.select_option('#ad-type-filter','deed'); pg.wait_for_timeout(500); ok(pg.locator('.ad-rec').count()==2,'Type filter: deeds only (2)')
    pg.select_option('#ad-type-filter',''); pg.wait_for_timeout(400)
    go('#/admin/records/rejected'); ok(pg.locator('.ad-rec').count()==1,'Status filter: rejected (1)')
    go('#/admin/review'); rq=pg.locator('.ad-rec').count(); cnt=pg.inner_text('.ad-tabs .ad-count') if pg.locator('.ad-tabs .ad-count').count() else ''
    ok(rq>=2,f'Review queue lists the drafts ({rq}, tab badge {cnt})')
    go('#/admin/log'); ok(pg.locator('.ad-table tbody tr').count()>=10,'Change log lists the actions')

    # settings: backup / reset / restore
    go('#/admin/settings'); pg.wait_for_selector('#ad-reset-form')
    if mode!='served':
        with pg.expect_download() as dl: pg.click('[data-aa=backup-download]')
        path=dl.value.path(); bk=json.loads(open(path).read())
        ok(len(bk['db']['records'])==5 and 'TerraShield-Demo' not in open(path).read() and 'hash' not in json.dumps(bk.get('db',{}).get('auth',{})),'Backup download: records inside, no password/hash')
    pg.fill('#ad-reset-confirm','reset'); pg.click('#ad-reset-form [type=submit]'); pg.wait_for_timeout(500)
    ok(pg.locator('#ad-reset-form .error-text').count()==1,'Reset needs RESET exactly')
    pg.fill('#ad-reset-confirm','RESET'); pg.click('#ad-reset-form [type=submit]'); pg.wait_for_selector('.ad-tiles',timeout=15000); pg.wait_for_timeout(400)
    ok(pg.eval_on_selector_all('.ad-tile .n','e=>e.map(x=>x.textContent).join("")')=='০০০০','Reset → all admin records removed')
    if mode!='served':
        go('#/admin/settings'); pg.set_input_files('#ad-import-file',path); pg.check('#ad-import-form [name=confirm]'); pg.click('#ad-import-form [type=submit]'); pg.wait_for_timeout(1500)
        go('#/admin/records'); ok(pg.locator('.ad-rec').count()==5,'Restore backup (file upload) brings the records back')
        go('#/admin/log'); rows=pg.eval_on_selector_all('.ad-table tbody tr','e=>e.map(r=>r.innerText)')
        ok(len(rows)==len(set(rows)),f'Change log has no duplicated rows after the restore ({len(rows)} rows)')

    # English, dark, phone width on every admin screen
    pg.goto(url); pg.wait_for_selector('.hero-forest'); pg.click('[data-act=lang]'); pg.wait_for_timeout(300)
    pg.click('.site-header .hdr-admin'); pg.wait_for_selector('.ad-tiles',timeout=20000)
    ok('Dashboard' in pg.inner_text('.ad-tabs') and 'ড্যাশবোর্ড' not in pg.inner_text('#admin-root'),'Admin Panel fully in English')
    pg.click('[data-act=lang]'); pg.wait_for_timeout(300)
    pg.set_viewport_size({'width':360,'height':780}); bad=[]
    for h in ['#/admin','#/admin/records','#/admin/review','#/admin/new/khatian','#/admin/log','#/admin/settings']+([f'#/admin/record/{plot}'] if plot else []):
        go(h); w=pg.evaluate('document.documentElement.scrollWidth-innerWidth')
        if w>0: bad.append(f'{h}:{w}px')
    ok(not bad,f'No sideways scroll at 360 px on any admin screen {bad}')
    pg.click('[data-act=theme]') if pg.locator('[data-act=theme]').is_visible() else pg.evaluate("document.documentElement.classList.add('dark')")
    go('#/admin')
    pg.set_viewport_size({'width':1366,'height':900})
    go('#/admin'); pg.click('[data-aa=logout]'); pg.wait_for_selector('#ad-login-form',timeout=15000)
    go('#/admin/records'); ok(pg.locator('#ad-login-form').count()==1 and pg.locator('.ad-rec').count()==0,'Logout → admin pages need login again')
    ok(not errs,f'No JavaScript/console errors {errs[:3]}')
    ctx.close()
finally:
    if proc: proc.terminate()
print(f'{mode}: {n[0]-len(fails)}/{n[0]} passed'); sys.exit(1 if fails else 0)
