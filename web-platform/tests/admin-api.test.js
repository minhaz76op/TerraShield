/*
 * TerraShield — Admin login + Admin API tests (Node 18+, no packages).
 * Run: node --test tests/admin-api.test.js
 * Each test starts its own server on a random port with a throw-away DB in the OS temp folder.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const engine = require('../web/js/engine.js');
const V = require('../web/js/admin-validate.js');
const { createServer } = require('../server/server.js');
const { hashPassword, verifyPassword, resolveCredentials } = require('../server/auth.js');

const ROOT = path.join(__dirname, '..');
const EMAIL = 'admin@test.local', PASS = 'test-password-123';
const ENV = { ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD: PASS };
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/test-cases.json'), 'utf8')).cases;
const tmpDb = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ts-admin-')), 'db.json');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function bundled() { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(ROOT, 'web/js/data.js'), 'utf8'), c); return JSON.parse(JSON.stringify(c.window.TS.data)); }

// A tiny client that keeps the session cookie + CSRF token, like the browser does.
async function start(opts) {
  opts = opts || {};
  const server = createServer({ dbFile: opts.dbFile || tmpDb(), env: opts.env || ENV, now: opts.now });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const client = { cookie: '', csrf: '' };
  client.req = async (method, p, body, o) => {
    o = o || {};
    const headers = Object.assign({}, o.headers);
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (client.cookie && !o.noCookie) headers.Cookie = client.cookie;
    if (client.csrf && o.csrf !== false) headers['X-CSRF-Token'] = client.csrf;
    const r = await fetch(base + p, { method, headers, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const sc = r.headers.get('set-cookie'); if (sc) client.cookie = sc.split(';')[0];
    let json = null; try { json = await r.json(); } catch (e) { /* not json */ }
    return { status: r.status, body: json, headers: r.headers };
  };
  client.login = async (email, pass) => {
    const r = await client.req('POST', '/api/admin/login', { email: email || EMAIL, password: pass || PASS });
    if (r.status === 200) client.csrf = r.body.csrf;
    return r;
  };
  client.data = async () => (await client.req('GET', '/api/data')).body.data;
  client.close = () => new Promise((r) => server.close(r));
  client.server = server; client.base = base;
  return client;
}

const RAHIM_SALE = { mouzaId: 'M901', dag: 101, deedNo: '9001/2026', date: '2026-10-01', sellerId: 'O01', buyerId: 'P99', area: 40 };

/* ======================= Configuration ======================= */
test('server refuses to start without proper admin credentials', () => {
  const bad = [{}, { ADMIN_EMAIL: EMAIL }, { ADMIN_PASSWORD: PASS }, { ADMIN_EMAIL: 'not-an-email', ADMIN_PASSWORD: PASS },
    { ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD: 'short' }, { ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD: 'password123' }, { ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD_HASH: 'plain-text' }];
  for (const env of bad) assert.throws(() => createServer({ dbFile: tmpDb(), env }), /ADMIN_|password/i, JSON.stringify(env));
});

test('passwords are stored as salted scrypt hashes', () => {
  const a = hashPassword(PASS), b = hashPassword(PASS);
  assert.match(a, /^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.notEqual(a, b, 'random salt');
  assert.ok(verifyPassword(PASS, a)); assert.ok(!verifyPassword(PASS + 'x', a)); assert.ok(!verifyPassword(PASS, 'garbage'));
  assert.equal(resolveCredentials({ ADMIN_EMAIL: 'A@Test.Local', ADMIN_PASSWORD_HASH: a }).email, 'a@test.local');
});

test('`npm run setup` writes only the hash to .env and backs up an existing .env', () => {
  const { execFileSync } = require('child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-env-')), env = path.join(dir, '.env');
  fs.writeFileSync(env, 'PORT=9999\nADMIN_PASSWORD=old-plain-password\n');
  execFileSync(process.execPath, [path.join(ROOT, 'server/setup.js'), '--email', 'Owner@Example.com', '--password', 'a-long-new-password', '--env', env, '--db', path.join(dir, 'none.json')], { stdio: 'pipe' });
  const out = fs.readFileSync(env, 'utf8');
  assert.match(out, /PORT=9999/); assert.match(out, /ADMIN_EMAIL=owner@example.com/); assert.match(out, /ADMIN_PASSWORD_HASH=scrypt\$/);
  assert.ok(!out.includes('a-long-new-password') && !out.includes('old-plain-password'), 'no plain passwords left');
  assert.ok(fs.readdirSync(dir).some((f) => f.startsWith('.env.backup-')), 'old .env backed up');
  const hash = /ADMIN_PASSWORD_HASH=(.*)/.exec(out)[1];
  assert.ok(verifyPassword('a-long-new-password', hash));
});

/* ======================= Login & session ======================= */
test('wrong email or password → 401, no session cookie, generic message', async () => {
  const c = await start();
  try {
    for (const [e, p] of [[EMAIL, 'wrong-password-1'], ['other@test.local', PASS], ['', '']]) {
      const r = await c.req('POST', '/api/admin/login', { email: e, password: p });
      assert.equal(r.status, 401); assert.deepEqual(r.body, { error: 'bad_credentials' });
      assert.equal(r.headers.get('set-cookie'), null);
    }
  } finally { await c.close(); }
});

test('login sets a secure session cookie; session endpoint works; email is case-insensitive', async () => {
  const c = await start();
  try {
    const r = await c.login(EMAIL.toUpperCase());
    assert.equal(r.status, 200); assert.equal(r.body.email, EMAIL); assert.ok(r.body.csrf.length >= 20);
    const sc = r.headers.get('set-cookie');
    assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Strict/); assert.match(sc, /Path=\/api\/admin/);
    assert.ok(!JSON.stringify(r.body).includes(PASS));
    const s = await c.req('GET', '/api/admin/session');
    assert.equal(s.status, 200); assert.equal(s.body.loggedIn, true); assert.equal(s.body.email, EMAIL);
    const anon = await c.req('GET', '/api/admin/session', undefined, { noCookie: true });
    assert.equal(anon.status, 200); assert.deepEqual(anon.body, { loggedIn: false });
  } finally { await c.close(); }
});

test('every admin route needs a login', async () => {
  const c = await start();
  try {
    for (const [m, p] of [['GET', '/api/admin/overview'], ['GET', '/api/admin/records'], ['GET', '/api/admin/log'], ['GET', '/api/admin/reference'],
      ['POST', '/api/admin/records'], ['POST', '/api/admin/reset'], ['POST', '/api/admin/password'], ['POST', '/api/admin/records/AR-1/approve']]) {
      const r = await c.req(m, p, m === 'POST' ? {} : undefined);
      assert.equal(r.status, 401, m + ' ' + p);
    }
  } finally { await c.close(); }
});

test('changes need the CSRF token and must come from the same site', async () => {
  const c = await start();
  try {
    await c.login();
    const body = { type: 'deed', data: RAHIM_SALE };
    assert.equal((await c.req('POST', '/api/admin/records', body, { csrf: false })).body.error, 'bad_csrf');
    assert.equal((await c.req('POST', '/api/admin/records', body, { csrf: false, headers: { 'X-CSRF-Token': 'x'.repeat(32) } })).status, 403);
    assert.equal((await c.req('POST', '/api/admin/records', body, { headers: { Origin: 'http://evil.example' } })).body.error, 'bad_origin');
    assert.equal((await c.req('POST', '/api/admin/records', body, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).body.error, 'bad_origin');
    assert.equal((await c.req('POST', '/api/admin/login', { email: EMAIL, password: PASS }, { headers: { Origin: 'http://evil.example' } })).status, 403);
    assert.equal((await c.req('POST', '/api/admin/records', body, { headers: { Origin: c.base } })).status, 201, 'same origin + token works');
  } finally { await c.close(); }
});

test('bad request bodies are refused (not JSON, too large, broken JSON)', async () => {
  const c = await start();
  try {
    const t = await fetch(c.base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'email=x' });
    assert.equal(t.status, 415);
    assert.equal((await c.req('POST', '/api/admin/login', '{ broken')).status, 400);
    assert.equal((await c.req('POST', '/api/admin/login', { email: EMAIL, password: 'x'.repeat(40000) })).status, 413);
  } finally { await c.close(); }
});

test('5 failed logins lock login for 15 minutes (even with the right password), then it works again', async () => {
  let clock = Date.now();
  const c = await start({ now: () => clock });
  try {
    for (let i = 0; i < 4; i++) assert.equal((await c.login(EMAIL, 'wrong-' + i + '-password')).status, 401);
    const fifth = await c.login(EMAIL, 'wrong-5-password');
    assert.equal(fifth.status, 429); assert.equal(fifth.body.error, 'locked'); assert.ok(Number(fifth.headers.get('retry-after')) > 800);
    assert.equal((await c.login()).status, 429, 'right password still locked');
    clock += 15 * 60 * 1000 + 1000;
    assert.equal((await c.login()).status, 200, 'unlocked after 15 minutes');
  } finally { await c.close(); }
});

test('sessions expire after 30 minutes idle and after 8 hours in total', async () => {
  let clock = Date.now();
  const c = await start({ now: () => clock });
  try {
    await c.login();
    clock += 29 * 60 * 1000; assert.equal((await c.req('GET', '/api/admin/session')).body.loggedIn, true, 'still active');
    clock += 31 * 60 * 1000; assert.equal((await c.req('GET', '/api/admin/session')).body.loggedIn, false, 'idle timeout');
    await c.login();
    for (let i = 0; i < 17; i++) { clock += 29 * 60 * 1000; await c.req('GET', '/api/admin/session'); }
    assert.equal((await c.req('GET', '/api/admin/session')).body.loggedIn, false, '8 hour limit');
  } finally { await c.close(); }
});

test('logout ends the session and clears the cookie', async () => {
  const c = await start();
  try {
    await c.login();
    const old = c.cookie;
    const r = await c.req('POST', '/api/admin/logout', {});
    assert.equal(r.status, 200); assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
    c.cookie = old;                                               // even if the old cookie is replayed…
    assert.equal((await c.req('GET', '/api/admin/session')).body.loggedIn, false);
  } finally { await c.close(); }
});

test('change password: checks the current one and strength, survives a restart, ends other sessions', async () => {
  const dbFile = tmpDb();
  const c = await start({ dbFile }), other = await start({ dbFile: tmpDb() });
  try {
    await c.login();
    const second = { cookie: '', csrf: '' };
    const r2 = await fetch(c.base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASS }) });
    second.cookie = r2.headers.get('set-cookie').split(';')[0];
    assert.equal((await c.req('POST', '/api/admin/password', { current: 'wrong-current-pw', next: 'brand-new-password-1' })).body.error, 'current_wrong');
    assert.equal((await c.req('POST', '/api/admin/password', { current: PASS, next: 'short' })).body.error, 'password_short');
    assert.equal((await c.req('POST', '/api/admin/password', { current: PASS, next: PASS })).body.error, 'password_same');
    assert.equal((await c.req('POST', '/api/admin/password', { current: PASS, next: 'brand-new-password-1' })).status, 200);
    const s2 = await fetch(c.base + '/api/admin/session', { headers: { Cookie: second.cookie } });
    assert.equal((await s2.json()).loggedIn, false, 'other session ended');
    assert.equal((await c.req('GET', '/api/admin/session')).body.loggedIn, true, 'this session kept');
    assert.equal((await c.login(EMAIL, PASS)).status, 401, 'old password no longer works');
    await c.close();
    const again = await start({ dbFile });                         // restart with the same .env values
    try {
      assert.equal((await again.login(EMAIL, PASS)).status, 401);
      assert.equal((await again.login(EMAIL, 'brand-new-password-1')).status, 200, 'new password survives restart');
    } finally { await again.close(); }
    const raw = fs.readFileSync(dbFile, 'utf8');
    assert.ok(!raw.includes('brand-new-password-1') && !raw.includes(PASS), 'no plain password in the DB');
  } finally { await other.close(); }
});

/* ======================= Record workflow ======================= */
test('create → draft (no effect) → approve (used in results) → edit (back to draft) → archive → restore', async () => {
  const c = await start();
  try {
    await c.login();
    const baseDeeds = bundled().deeds.length;
    const created = await c.req('POST', '/api/admin/records', { type: 'deed', data: RAHIM_SALE, note: 'ফিকশনাল বিক্রয়' });
    assert.equal(created.status, 201);
    const rec = created.body.record;
    assert.equal(rec.status, 'draft'); assert.equal(rec.id, 'AR-1'); assert.equal(rec.data.id, 'AD-1'); assert.equal(rec.data.office, 'SRO-DEMO');
    assert.equal((await c.data()).deeds.length, baseDeeds, 'draft not public');
    assert.equal(engine.check(cases[0].input, await c.data()).status, 'green', 'website result unchanged by a draft');

    assert.equal((await c.req('POST', '/api/admin/records/AR-1/approve', {})).body.error, 'confirm_required');
    const ok = await c.req('POST', '/api/admin/records/AR-1/approve', { confirm: true, note: 'মিলিয়ে দেখা হয়েছে' });
    assert.equal(ok.status, 200); assert.equal(ok.body.record.status, 'reviewed'); assert.equal(ok.body.record.reviewedBy, EMAIL);
    const live = await c.data();
    assert.equal(live.deeds.length, baseDeeds + 1);
    const r = engine.check(cases[0].input, live);
    assert.equal(r.status, 'red'); assert.deepEqual(engine.ruleIds(r), ['R1', 'R2']);

    const edited = await c.req('PUT', '/api/admin/records/AR-1', { data: Object.assign({}, RAHIM_SALE, { area: 10 }) });
    assert.equal(edited.status, 200); assert.equal(edited.body.backToDraft, true); assert.equal(edited.body.record.status, 'draft');
    assert.equal(edited.body.record.data.id, 'AD-1', 'deed id kept');
    assert.equal(engine.check(cases[0].input, await c.data()).status, 'green', 'edited record needs re-approval');

    await c.req('POST', '/api/admin/records/AR-1/approve', { confirm: true });
    const smaller = engine.check(cases[0].input, await c.data());          // 10 sold of 50: 40 left ≥ 20 wanted → only R1
    assert.equal(smaller.status, 'yellow'); assert.deepEqual(engine.ruleIds(smaller), ['R1']);
    const arc = await c.req('POST', '/api/admin/records/AR-1/archive', { note: 'পরীক্ষা শেষ' });
    assert.equal(arc.body.record.status, 'archived');
    assert.equal(engine.check(cases[0].input, await c.data()).status, 'green', 'archived record no longer used');
    assert.equal((await c.req('PUT', '/api/admin/records/AR-1', { data: RAHIM_SALE })).body.error, 'archived_readonly');
    assert.equal((await c.req('POST', '/api/admin/records/AR-1/restore', {})).body.record.status, 'draft');

    const hist = (await c.req('GET', '/api/admin/records/AR-1')).body.record.history.map((h) => h.action);
    assert.deepEqual(hist, ['create', 'approve', 'edit', 'approve', 'archive', 'restore']);
    const log = (await c.req('GET', '/api/admin/log')).body.log.map((l) => l.action);
    assert.deepEqual(log.slice(0, 7), ['restore', 'archive', 'approve', 'edit', 'approve', 'create', 'login']);
  } finally { await c.close(); }
});

test('reject needs a reason; rejected records never affect results; editing sends them back to draft', async () => {
  const c = await start();
  try {
    await c.login();
    await c.req('POST', '/api/admin/records', { type: 'deed', data: RAHIM_SALE });
    assert.equal((await c.req('POST', '/api/admin/records/AR-1/reject', {})).body.error, 'note_required');
    const r = await c.req('POST', '/api/admin/records/AR-1/reject', { note: 'তারিখ মেলেনি' });
    assert.equal(r.body.record.status, 'rejected'); assert.equal(r.body.record.rejectReason, 'তারিখ মেলেনি');
    assert.equal((await c.req('POST', '/api/admin/records/AR-1/approve', { confirm: true })).body.error, 'not_draft');
    assert.equal(engine.check(cases[0].input, await c.data()).status, 'green');
    assert.equal((await c.req('PUT', '/api/admin/records/AR-1', { data: RAHIM_SALE })).body.record.status, 'draft');
  } finally { await c.close(); }
});

test('validation: people only from the fictional list, NID-like numbers refused, dates, deed numbers, duplicates', async () => {
  const c = await start();
  try {
    await c.login();
    const bad = async (type, data, field, code, note) => {
      const r = await c.req('POST', '/api/admin/records', { type, data, note });
      assert.equal(r.status, 400, field + ' ' + code);
      assert.ok(r.body.errors.some((e) => e.field === field && e.code === code), field + ' → ' + JSON.stringify(r.body.errors));
    };
    await bad('deed', Object.assign({}, RAHIM_SALE, { sellerId: 'Real Person' }), 'sellerId', 'person_invalid');
    await bad('deed', Object.assign({}, RAHIM_SALE, { buyerId: 'O01' }), 'buyerId', 'same_person');
    await bad('deed', Object.assign({}, RAHIM_SALE, { deedNo: '12-2024' }), 'deedNo', 'deedno_invalid');
    await bad('deed', Object.assign({}, RAHIM_SALE, { date: '2999-01-01' }), 'date', 'date_future');
    await bad('deed', Object.assign({}, RAHIM_SALE, { date: '2024-02-30' }), 'date', 'date_invalid');
    await bad('deed', Object.assign({}, RAHIM_SALE, { area: -5 }), 'area', 'area_invalid');
    await bad('deed', Object.assign({}, RAHIM_SALE, { mouzaId: 'M999' }), 'mouzaId', 'mouza_invalid');
    await bad('deed', Object.assign({}, RAHIM_SALE, { dag: 777 }), 'dag', 'plot_missing');
    await bad('deed', Object.assign({}, RAHIM_SALE, { deedNo: '১৯৯০১২৩৪৫৬৭৮/2020' }), 'deedNo', 'nid_like');
    await bad('plot', { mouzaId: 'M901', dag: 101, totalArea: 10 }, 'dag', 'plot_exists');
    await bad('khatian', { mouzaId: 'M901', dag: 101, khatianNo: '999', survey: 'BS', recordDate: '2020-01-01', owners: [{ personId: 'O01', share: 10 }] }, 'dag', 'khatian_exists');
    await bad('khatian', { mouzaId: 'M901', dag: 555, khatianNo: '999', survey: 'XX', recordDate: '2020-01-01', owners: [] }, 'survey', 'survey_invalid');
    await bad('namjari', { mouzaId: 'M901', dag: 101, caseNo: 'N-501', applicantId: 'P01', basis: 'inheritance', status: 'pending', date: '2024-01-01' }, 'caseNo', 'case_exists');
    const nidNote = await c.req('POST', '/api/admin/records', { type: 'deed', data: RAHIM_SALE, note: 'NID 1990123456789' });
    assert.equal(nidNote.status, 400); assert.equal(nidNote.body.errors[0].code, 'nid_like');
    assert.equal((await c.req('POST', '/api/admin/records', { type: 'person', data: {} })).body.errors[0].code, 'type_invalid');
    // Things the engine is meant to detect are allowed, with a warning
    const dup = await c.req('POST', '/api/admin/records', { type: 'deed', data: Object.assign({}, RAHIM_SALE, { deedNo: '০১০২/২০২৩' }) });
    assert.equal(dup.status, 201); assert.ok(dup.body.warnings.some((w) => w.code === 'deedno_duplicate'));
    assert.equal(dup.body.record.data.deedNo, '0102/2023', 'Bangla digits stored as English digits');
  } finally { await c.close(); }
});

test('new plot + khatian + deed + namjari: approval order is enforced and the engine uses them', async () => {
  const c = await start();
  try {
    await c.login();
    const post = (type, data) => c.req('POST', '/api/admin/records', { type, data });
    const approve = (id) => c.req('POST', '/api/admin/records/' + id + '/approve', { confirm: true });
    assert.equal((await post('plot', { mouzaId: 'M901', dag: 150, totalArea: 30 })).status, 201);                                  // AR-1
    assert.equal((await post('khatian', { mouzaId: 'M901', dag: 150, khatianNo: '250', survey: 'BS', recordDate: '2016-05-01', owners: [{ personId: 'O02', share: 30 }] })).status, 201); // AR-2
    assert.equal((await post('deed', { mouzaId: 'M901', dag: 150, deedNo: '9100/2025', date: '2025-02-01', sellerId: 'O02', buyerId: 'P03', area: 25 })).status, 201);           // AR-3 (AD-3)
    assert.equal((await post('namjari', { mouzaId: 'M901', dag: 150, caseNo: 'N-900', applicantId: 'P03', basis: 'deed', deedId: 'AD-3', status: 'pending', date: '2025-03-01' })).status, 201); // AR-4

    const blocked = await approve('AR-2');
    assert.equal(blocked.status, 409); assert.deepEqual(blocked.body.blockers, ['plot_not_live']);
    assert.deepEqual((await approve('AR-4')).body.blockers, ['plot_not_live', 'deed_not_live']);
    for (const id of ['AR-1', 'AR-2']) assert.equal((await approve(id)).status, 200);

    const input = { mouzaId: 'M901', dag: 150, sellerId: 'O02', area: 10 };
    assert.equal(engine.check(input, await c.data()).status, 'green', 'new dag works in the engine');
    assert.equal((await approve('AR-3')).status, 200);
    const afterSale = engine.check(input, await c.data());
    assert.equal(afterSale.status, 'red'); assert.ok(engine.ruleIds(afterSale).includes('R2'), 'only 5 left, wants 10');
    assert.equal((await approve('AR-4')).status, 200);
    const nj = engine.check({ mouzaId: 'M901', dag: 150, sellerId: 'O02', area: 4 }, await c.data());
    assert.ok(engine.ruleIds(nj).length >= 1);

    const arc = await c.req('POST', '/api/admin/records/AR-1/archive', {});
    assert.equal(arc.status, 409); assert.equal(arc.body.error, 'has_dependants'); assert.deepEqual(arc.body.dependants.sort(), ['AR-2', 'AR-3', 'AR-4']);
    assert.equal((await c.req('PUT', '/api/admin/records/AR-1', { data: { mouzaId: 'M901', dag: 150, totalArea: 40 } })).body.error, 'has_dependants');
    assert.equal((await c.req('POST', '/api/admin/records/AR-3/archive', {})).body.dependants[0], 'AR-4', 'deed with a namjari linked');
    const detail = (await c.req('GET', '/api/admin/records/AR-3')).body;
    assert.equal(detail.related.plots.length, 1); assert.equal(detail.related.khatians.length, 1); assert.equal(detail.related.namjari.length, 1);
  } finally { await c.close(); }
});

test('base fictional records are read-only: no route can change them, shared/ never written', async () => {
  const files = fs.readdirSync(path.join(ROOT, 'shared/data')).map((f) => path.join(ROOT, 'shared/data', f)).concat([path.join(ROOT, 'shared/test-cases.json')]);
  const before = files.map(sha);
  const c = await start();
  try {
    await c.login();
    for (const id of ['D01', '201', 'M901', '1']) {
      assert.equal((await c.req('PUT', '/api/admin/records/' + id, { data: {} })).status, 404, id);
      assert.equal((await c.req('POST', '/api/admin/records/' + id + '/archive', {})).status, 404, id);
    }
    await c.req('POST', '/api/admin/records', { type: 'deed', data: RAHIM_SALE });
    await c.req('POST', '/api/admin/records/AR-1/approve', { confirm: true });
    await c.req('POST', '/api/admin/reset', { confirm: 'RESET' });
  } finally { await c.close(); }
  assert.deepEqual(files.map(sha), before);
});

test('reset-to-fictional-data: needs typed confirmation, removes all admin records, keeps the log and login', async () => {
  const c = await start();
  try {
    await c.login();
    await c.req('POST', '/api/admin/records', { type: 'deed', data: RAHIM_SALE });
    await c.req('POST', '/api/admin/records/AR-1/approve', { confirm: true });
    assert.equal(engine.check(cases[0].input, await c.data()).status, 'red');
    assert.equal((await c.req('POST', '/api/admin/reset', { confirm: 'yes' })).body.error, 'confirm_required');
    assert.equal((await c.req('POST', '/api/admin/reset', { confirm: 'RESET' })).body.removed, 1);
    assert.deepEqual(await c.data(), bundled());
    for (const tc of cases) {
      const d = await c.data(), r = engine.check(tc.input, tc.addDeeds ? engine.withExtraDeeds(d, tc.addDeeds) : d);
      assert.equal(r.status, tc.expect.status, tc.id); assert.deepEqual(engine.ruleIds(r), [...tc.expect.rules].sort(), tc.id);
    }
    assert.equal((await c.req('GET', '/api/admin/log')).body.log[0].action, 'reset');
    assert.equal((await c.req('GET', '/api/admin/session')).body.loggedIn, true);
    const ov = (await c.req('GET', '/api/admin/overview')).body;
    assert.equal(ov.counts.total, 0); assert.equal(ov.base.deeds, bundled().deeds.length);
  } finally { await c.close(); }
});

test('the change log never contains a password; failed logins are logged without details', async () => {
  const c = await start();
  try {
    await c.login(EMAIL, 'a-wrong-password-9');
    await c.login();
    await c.req('POST', '/api/admin/password', { current: PASS, next: 'another-long-password' });
    const raw = JSON.stringify((await c.req('GET', '/api/admin/log')).body);
    for (const p of [PASS, 'a-wrong-password-9', 'another-long-password']) assert.ok(!raw.includes(p), p);
    assert.ok(raw.includes('login_failed') && raw.includes('password_changed'));
  } finally { await c.close(); }
});

test('validator (shared with the browser): Bangla digits, NID guard, deed number format', () => {
  assert.ok(V.nidLike('১৯৯০১২৩৪৫৬৭৮৯')); assert.ok(V.nidLike('017-1234-56789')); assert.ok(!V.nidLike('0102/2023')); assert.ok(!V.nidLike('N-501'));
  assert.equal(V.normDeedNo('০১০৯/২০১০'), '109/2010'); assert.equal(V.normDeedNo('12-2020'), null);
  const ctx = V.buildContext(bundled(), [], null);
  const r = V.validateRecord('plot', { mouzaId: 'M902', dag: '৩০০', totalArea: '১২.৫' }, ctx);
  assert.ok(r.ok); assert.deepEqual(r.clean, { mouzaId: 'M902', dag: 300, totalArea: 12.5 });
});

/* ======================= SQA regressions (v3.2) ======================= */
test('odd or hostile record payloads get a 400, never a server error', async () => {
  const c = await start();
  try {
    await c.login();
    const odd = [{ type: {}, data: {} }, { type: 'deed', data: 5 }, { type: 'deed', data: [] }, { type: 'deed', data: null }, { type: 'deed' },
      { type: 'khatian', data: { owners: 'x', mouzaId: 'M901', dag: 1 } }, { type: 'khatian', data: { owners: [null, 5, 'x'], mouzaId: 'M901', dag: 101 } },
      { type: 'deed', data: { mouzaId: { toString: 1 }, dag: { a: 1 }, deedNo: ['1/2020'], sellerId: true } }, { type: 'deed', data: { dag: 1e400 } }];
    for (const b of odd) {
      const r = await c.req('POST', '/api/admin/records', b);
      assert.ok(r.status === 400, JSON.stringify(b).slice(0, 60) + ' → ' + r.status);
    }
    for (const b of [{ email: ['x'], password: { a: 1 } }, { email: null }, '[]']) assert.ok((await c.req('POST', '/api/admin/login', b)).status < 500);
  } finally { await c.close(); }
});

test('wrong guesses for OTHER emails do not lock the real admin out (per-email lockout; 20 per IP)', async () => {
  const c = await start();
  try {
    for (let i = 0; i < 10; i++) assert.equal((await c.login('someone' + i + '@else.test', 'wrong-password-1')).status, 401);
    assert.equal((await c.login()).status, 200, 'admin can still log in after 10 wrong guesses for other emails');
    for (let i = 0; i < 25; i++) await c.login('flood' + i + '@else.test', 'wrong-password-1');
    assert.equal((await c.login()).status, 429, 'a flood of 20+ wrong logins from one IP does lock login (brute-force protection)');
  } finally { await c.close(); }
});

test('a login flood cannot wash real entries out of the change log (blocked retries are not logged)', async () => {
  const dbFile = tmpDb(); const c = await start({ dbFile });
  try {
    for (let i = 0; i < 60; i++) await c.login('flood' + i + '@else.test', 'wrong-password-1');
    const db = JSON.parse(require('fs').readFileSync(dbFile, 'utf8'));
    const failed = db.log.filter((l) => l.action === 'login_failed').length;
    assert.ok(failed <= 20, 'only the wrong guesses before the lock are logged, got ' + failed);
  } finally { await c.close(); }
});

/* ======================= Local demo account (v3.2) ======================= */
const { DEMO } = require('../web/js/admin-core.js');
test('demo mode: the login page is told the demo email + password, and they work', async () => {
  const c = await start({ env: { ADMIN_DEMO: '1' } });
  try {
    const s = await c.req('GET', '/api/admin/session');
    assert.deepEqual(s.body, { loggedIn: false, demo: { email: 'demo.admin@terrashield.local', password: 'TerraShield-Demo-2026' } });
    assert.equal((await c.login(DEMO.email, DEMO.password)).status, 200);
    assert.equal((await c.req('GET', '/api/admin/overview')).status, 200, 'demo login opens the Admin Panel API');
    const after = await c.req('GET', '/api/admin/session');
    assert.equal(after.body.loggedIn, true); assert.ok(!('demo' in after.body));
  } finally { await c.close(); }
});

test('a configured password is never shown; the demo is not used when real credentials exist; the demo password is fixed', async () => {
  const c1 = await start();                                        // ADMIN_EMAIL + ADMIN_PASSWORD
  try {
    const s = await c1.req('GET', '/api/admin/session');
    assert.deepEqual(s.body, { loggedIn: false });
    assert.ok(!JSON.stringify(s.body).includes(PASS));
    assert.equal((await c1.login(DEMO.email, DEMO.password)).status, 401, 'demo password does not open a configured server');
  } finally { await c1.close(); }
  const c2 = await start({ env: Object.assign({ ADMIN_DEMO: '1' }, ENV) });
  try { assert.ok(!('demo' in (await c2.req('GET', '/api/admin/session')).body), 'ADMIN_DEMO is ignored when a password is configured'); }
  finally { await c2.close(); }
  const dbFile = tmpDb(); const c3 = await start({ dbFile, env: { ADMIN_DEMO: '1' } });
  try {
    await c3.login(DEMO.email, DEMO.password);
    const r = await c3.req('POST', '/api/admin/password', { current: DEMO.password, next: 'my-own-pass-2026' });
    assert.equal(r.status, 403); assert.equal(r.body.error, 'demo_fixed');
  } finally { await c3.close(); }
  // a password saved by an older version in the DB does not hide the demo login in demo mode
  const old = JSON.parse(fs.readFileSync(dbFile, 'utf8')); old.auth = { email: 'old@own.test', passwordHash: require('../server/auth.js').hashPassword('old-own-pass-1') };
  fs.writeFileSync(dbFile, JSON.stringify(old));
  const c4 = await start({ dbFile, env: { ADMIN_DEMO: '1' } });
  try {
    assert.equal((await c4.req('GET', '/api/admin/session')).body.demo.password, DEMO.password);
    assert.equal((await c4.login(DEMO.email, DEMO.password)).status, 200);
  } finally { await c4.close(); }
});

test('npm start with nothing configured runs with the demo account; with a password configured it does not', async () => {
  const { spawn } = require('child_process');
  const run = (extra) => new Promise((resolve) => {
    // a temp .env-free working copy is not needed: real environment variables win over .env, and an empty
    // ADMIN_PASSWORD_HASH counts as "not configured" exactly like a fresh copy without .env
    const env = Object.assign({ PATH: process.env.PATH, PORT: '0', DB_FILE: tmpDb(), ADMIN_PASSWORD_HASH: '', ADMIN_PASSWORD: '' }, extra);
    const ch = spawn(process.execPath, ['server/server.js'], { cwd: ROOT, env });
    let out = ''; const done = () => { ch.kill(); resolve(out); };
    ch.stdout.on('data', (d) => { out += d; if (/Database:/.test(out)) done(); });
    ch.stderr.on('data', (d) => { out += d; });
    ch.on('exit', () => resolve(out)); setTimeout(done, 8000);
  });
  const demo = await run({});
  assert.match(demo, /Demo login:\s+demo\.admin@terrashield\.local\s+\/\s+TerraShield-Demo-2026/);
  const own = await run({ ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD: PASS });
  assert.match(own, /server running/); assert.ok(!/Demo login|TerraShield-Demo-2026|test-password-123/.test(own), 'no demo line and no password printed');
});
