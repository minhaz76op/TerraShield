/*
 * TerraShield — server + database tests (Node 18+, no packages).
 * Run: node --test tests/server.test.js
 * Every test uses a throw-away DB file in the OS temp folder — the real data/db.json is never touched.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const engine = require('../web/js/engine.js');
const { loadBaseData } = require('../server/base-data.js');
const { openDb } = require('../server/db.js');
const { createServer, loadEnv } = require('../server/server.js');

const ROOT = path.join(__dirname, '..');
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/test-cases.json'), 'utf8')).cases;
const tmpFile = (name) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ts-db-')), name || 'db.json');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// The bundled data exactly as the browser sees it (web/js/data.js).
function bundledData() {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'web/js/data.js'), 'utf8'), ctx);
  return JSON.parse(JSON.stringify(ctx.window.TS.data));
}
const runCase = (tc, data) => engine.check(tc.input, tc.addDeeds ? engine.withExtraDeeds(data, tc.addDeeds) : data);

async function withServer(fn, dbFile) {
  const server = createServer({ dbFile: dbFile || tmpFile(), env: { ADMIN_EMAIL: 'admin@test.local', ADMIN_PASSWORD: 'test-password-123' } });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  try { return await fn(base, server); } finally { await new Promise((r) => server.close(r)); }
}

// A reviewed admin deed identical in shape to Judge Mode's "add sale": Rahim Uddin sells 40 decimal of dag 101.
const RAHIM_SALE = { id: 'A-D1', deedNo: '9001/2026', office: 'SRO-DEMO', date: '2026-10-16', sellerId: 'O01', buyerId: 'P99', mouzaId: 'M901', dag: 101, area: 40 };
function addRecord(db, type, status, data) {
  return db.mutate((d) => { const r = { id: 'R' + d.nextId++, type, status, data, createdAt: 'now', updatedAt: 'now' }; d.records.push(r); return r; });
}

/* ---------- Base data ---------- */
test('server base data is identical to the bundled web/js/data.js', () => {
  assert.deepEqual(loadBaseData(), bundledData());
});

/* ---------- Database ---------- */
test('a new DB holds no records and does not copy the base data', () => {
  const f = tmpFile(); const db = openDb(f);
  const saved = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert.deepEqual(saved.records, []); assert.deepEqual(saved.log, []);
  assert.equal(saved.plots, undefined); assert.equal(saved.deeds, undefined);
  assert.equal(db.publicData().meta.reviewedAdminRecords, 0);
});

test('with no admin records, public data equals the bundled data', () => {
  assert.deepEqual(openDb(tmpFile()).publicData().data, bundledData());
});

test('all 14 shared cases give identical engine results on server data and bundled data', () => {
  const server = openDb(tmpFile()).publicData().data, bundled = bundledData();
  assert.equal(cases.length, 14);
  for (const tc of cases) {
    const a = runCase(tc, server), b = runCase(tc, bundled);
    assert.deepEqual(a, b, tc.id);
    assert.equal(a.status, tc.expect.status, tc.id + ' status');
    assert.deepEqual(engine.ruleIds(a), [...tc.expect.rules].sort(), tc.id + ' rules');
  }
});

test('only REVIEWED admin records reach the public data', () => {
  const db = openDb(tmpFile());
  addRecord(db, 'deed', 'draft', Object.assign({}, RAHIM_SALE, { id: 'A-draft' }));
  addRecord(db, 'deed', 'rejected', Object.assign({}, RAHIM_SALE, { id: 'A-rej' }));
  addRecord(db, 'deed', 'archived', Object.assign({}, RAHIM_SALE, { id: 'A-arc' }));
  const before = db.publicData();
  assert.equal(before.data.deeds.length, loadBaseData().deeds.length, 'draft/rejected/archived ignored');
  assert.equal(before.meta.reviewedAdminRecords, 0);
  assert.equal(engine.check(cases[0].input, before.data).status, 'green', 'case-01 still green');

  addRecord(db, 'deed', 'reviewed', RAHIM_SALE);
  const after = db.publicData();
  assert.equal(after.data.deeds.length, loadBaseData().deeds.length + 1);
  const added = after.data.deeds[after.data.deeds.length - 1];
  assert.equal(added._src, 'admin'); assert.equal(added.deedNo, '9001/2026');
  assert.equal(after.meta.reviewedAdminRecords, 1);
});

test('a reviewed admin deed changes the result exactly like Judge Mode\'s demo sale (green → red R1+R2)', () => {
  const db = openDb(tmpFile());
  addRecord(db, 'deed', 'reviewed', RAHIM_SALE);
  const viaDb = engine.check(cases[0].input, db.publicData().data);
  const viaDemo = engine.check(cases[0].input, engine.withExtraDeeds(bundledData(), [RAHIM_SALE]));
  assert.equal(viaDb.status, 'red');
  assert.deepEqual(engine.ruleIds(viaDb), ['R1', 'R2']);
  assert.deepEqual(engine.ruleIds(viaDb), engine.ruleIds(viaDemo));
  assert.deepEqual(viaDb.calc, viaDemo.calc);
});

test('base fictional data in shared/ is never written', () => {
  const files = ['plots', 'khatians', 'deeds', 'namjari', 'people', 'locations'].map((n) => path.join(ROOT, 'shared/data', n + '.json'));
  const before = files.map(sha);
  const db = openDb(tmpFile());
  addRecord(db, 'deed', 'reviewed', RAHIM_SALE); db.resetToBase('test');
  assert.deepEqual(files.map(sha), before);
  assert.equal(db.base.deeds.length, loadBaseData().deeds.length, 'in-memory base unchanged');
});

test('records survive a restart (persisted to disk)', () => {
  const f = tmpFile();
  addRecord(openDb(f), 'deed', 'reviewed', RAHIM_SALE);
  const again = openDb(f);
  assert.equal(again.get().records.length, 1);
  assert.equal(again.publicData().meta.reviewedAdminRecords, 1);
});

test('reset-to-fictional-data removes admin records, logs it, and restores the base data', () => {
  const db = openDb(tmpFile());
  addRecord(db, 'deed', 'reviewed', RAHIM_SALE); addRecord(db, 'plot', 'draft', { mouzaId: 'M901', dag: 999, totalArea: 10 });
  assert.equal(db.resetToBase('admin@test'), 2);
  assert.deepEqual(db.get().records, []);
  const last = db.get().log[db.get().log.length - 1];
  assert.equal(last.action, 'reset'); assert.equal(last.actor, 'admin@test'); assert.equal(last.detail.removed, 2);
  assert.deepEqual(db.publicData().data, bundledData());
  assert.equal(engine.check(cases[0].input, db.publicData().data).status, 'green');
});

test('a failed change saves nothing', () => {
  const f = tmpFile(); const db = openDb(f);
  assert.throws(() => db.mutate((d) => { d.records.push({ id: 'X' }); throw new Error('boom'); }));
  assert.deepEqual(db.get().records, []);
  assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')).records, []);
});

test('writes are atomic: no temp files are left behind', () => {
  const f = tmpFile(); const db = openDb(f);
  for (let i = 0; i < 5; i++) addRecord(db, 'deed', 'draft', RAHIM_SALE);
  assert.deepEqual(fs.readdirSync(path.dirname(f)), ['db.json']);
});

test('a broken DB file is kept (renamed), never overwritten', () => {
  const f = tmpFile(); fs.writeFileSync(f, '{ not json');
  const warn = console.warn; console.warn = () => {};
  try { openDb(f); } finally { console.warn = warn; }
  const files = fs.readdirSync(path.dirname(f));
  const kept = files.find((x) => x.startsWith('db.json.corrupt-'));
  assert.ok(kept, 'corrupt copy kept');
  assert.equal(fs.readFileSync(path.join(path.dirname(f), kept), 'utf8'), '{ not json');
  assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')).records, []);
});

/* ---------- HTTP ---------- */
test('GET /api/health and /api/data', async () => {
  await withServer(async (base) => {
    const h = await fetch(base + '/api/health');
    assert.equal(h.status, 200); assert.deepEqual(await h.json(), { ok: true });
    const d = await fetch(base + '/api/data');
    assert.equal(d.status, 200);
    assert.equal(d.headers.get('cache-control'), 'no-store');
    const body = await d.json();
    assert.deepEqual(body.data, bundledData());
    assert.equal(body.meta.source, 'server'); assert.equal(body.meta.reviewedAdminRecords, 0);
  });
});

test('API: wrong method → 405, unknown route → 404 (JSON, no details leaked)', async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(base + '/api/data', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/api/data', { method: 'DELETE' })).status, 405);
    const r = await fetch(base + '/api/nope'); assert.equal(r.status, 404); assert.deepEqual(await r.json(), { error: 'not_found' });
  });
});

test('serves the existing website from web/ with the right content types', async () => {
  await withServer(async (base) => {
    const page = await fetch(base + '/');
    assert.equal(page.status, 200); assert.match(page.headers.get('content-type'), /text\/html/);
    assert.equal(await page.text(), fs.readFileSync(path.join(ROOT, 'web/index.html'), 'utf8'));
    const js = await fetch(base + '/js/engine.js');
    assert.match(js.headers.get('content-type'), /javascript/);
    assert.equal(await js.text(), fs.readFileSync(path.join(ROOT, 'web/js/engine.js'), 'utf8'));
    const css = await fetch(base + '/css/styles.css'); assert.match(css.headers.get('content-type'), /text\/css/);
    const head = await fetch(base + '/index.html', { method: 'HEAD' }); assert.equal(head.status, 200);
  });
});

test('never serves files outside web/ (path tricks, server code, database, .env)', async () => {
  await withServer(async (base) => {
    for (const p of ['/../package.json', '/%2e%2e/package.json', '/..%2fpackage.json', '/%2e%2e%2f%2e%2e%2fetc%2fpasswd', '/js/../../server/server.js',
      '/server/server.js', '/data/db.json', '/.env', '/shared/data/people.json', '/js/', '/js']) {
      const r = await fetch(base + p);
      assert.ok(r.status === 404 || r.status === 400, p + ' → ' + r.status);
    }
    assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  });
});

test('security headers on every response; CSP allows the one inline theme script by hash', async () => {
  await withServer(async (base) => {
    for (const p of ['/', '/api/data', '/missing']) {
      const r = await fetch(base + p);
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff', p);
      assert.equal(r.headers.get('x-frame-options'), 'DENY', p);
      assert.equal(r.headers.get('referrer-policy'), 'no-referrer', p);
      assert.match(r.headers.get('content-security-policy'), /default-src 'self'/, p);
      assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'none'/, p);
    }
    const html = fs.readFileSync(path.join(ROOT, 'web/index.html'), 'utf8');
    const code = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
    const hash = crypto.createHash('sha256').update(code).digest('base64');
    const csp = (await fetch(base + '/')).headers.get('content-security-policy');
    assert.ok(csp.includes("'sha256-" + hash + "'"), 'inline theme script allowed by hash');
    assert.ok(!/script-src[^;]*unsafe-inline/.test(csp), 'no unsafe-inline scripts');
  });
});

test('.env reader: reads KEY=value, ignores comments, never overrides real environment variables', () => {
  const f = tmpFile('.env');
  fs.writeFileSync(f, '# comment\nTS_TEST_A=hello\nTS_TEST_B="quoted value"\nTS_TEST_C=from-file\n');
  process.env.TS_TEST_C = 'from-env';
  loadEnv(f);
  assert.equal(process.env.TS_TEST_A, 'hello'); assert.equal(process.env.TS_TEST_B, 'quoted value'); assert.equal(process.env.TS_TEST_C, 'from-env');
  delete process.env.TS_TEST_A; delete process.env.TS_TEST_B; delete process.env.TS_TEST_C;
});

test('raw "../" paths (not normalised by a browser) are refused too', async () => {
  const http = require('http');
  await withServer(async (base) => {
    const port = new URL(base).port;
    const get = (p) => new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: p, method: 'GET' }, (res) => { res.resume(); resolve(res.statusCode); });
      req.on('error', reject); req.end();
    });
    for (const p of ['/../package.json', '/../../etc/passwd', '/js/../../server/server.js', '/..\\package.json', '/css/../../.env'])
      assert.ok([400, 404].includes(await get(p)), p);
    assert.equal(await get('/js/../index.html'), 200, 'a harmless ../ that stays inside web/ still works');
  });
});
