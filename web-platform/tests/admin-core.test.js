/*
 * TerraShield — admin-core.js tests (the workflow shared by the server and the standalone file).
 * Run: node --test tests/admin-core.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const C = require('../web/js/admin-core.js');
const engine = require('../web/js/engine.js');

const ROOT = path.join(__dirname, '..');
function bundled() { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(ROOT, 'web/js/data.js'), 'utf8'), c); return JSON.parse(JSON.stringify(c.window.TS.data)); }
function memStore() { const s = { base: bundled(), db: C.emptyDb() }; s.get = () => s.db; s.mutate = (fn) => { const d = JSON.parse(JSON.stringify(s.db)); const r = fn(d); s.db = d; return r; }; return s; }
const SALE = { mouzaId: 'M901', dag: 101, deedNo: '9001/2026', date: '2026-10-01', sellerId: 'O01', buyerId: 'P99', area: 40 };
const case01 = { mouzaId: 'M901', dag: 101, sellerId: 'O01', area: 20 };

test('mergePublic adds only reviewed records, marked as admin', () => {
  const s = memStore(), R = C.createRecords(s);
  R.create('a@x.y', 'deed', SALE);
  assert.equal(C.mergePublic(s.base, s.db.records).count, 0);
  R.approve('a@x.y', 'AR-1', '', true);
  const m = C.mergePublic(s.base, s.db.records);
  assert.equal(m.count, 1); assert.equal(m.data.deeds.at(-1)._src, 'admin');
  assert.equal(engine.check(case01, m.data).status, 'red');
  assert.equal(engine.check(case01, s.base).status, 'green', 'base data untouched');
});

test('export → import round trip; no password or hash in the backup; logs merged, nothing lost', () => {
  const a = memStore(), RA = C.createRecords(a);
  a.db.auth = { email: 'a@x.y', hash: 'SECRET-HASH', salt: 'SALT' };
  RA.create('a@x.y', 'deed', SALE); RA.approve('a@x.y', 'AR-1', 'ok', true);
  const backup = RA.exportBackup();
  const raw = JSON.stringify(backup);
  assert.ok(!raw.includes('SECRET-HASH') && !raw.includes('SALT') && !('auth' in backup.db));
  const b = memStore(), RB = C.createRecords(b);
  b.db.auth = { email: 'b@x.y', hash: 'B-HASH' };
  RB.note('b@x.y', 'login');
  assert.equal(RB.importBackup('b@x.y', backup), 1);
  assert.equal(b.db.auth.hash, 'B-HASH', 'login kept');
  const actions = b.db.log.map((l) => l.action);
  assert.ok(actions.includes('login') && actions.includes('create') && actions.includes('approve'), 'both logs kept');
  assert.equal(actions.at(-1), 'import');
  assert.equal(engine.check(case01, C.mergePublic(b.base, b.db.records).data).status, 'red');
  assert.equal(b.db.nextId, 2);
  RB.importBackup('b@x.y', backup);
  assert.equal(b.db.log.filter((l) => l.action === 'create').length, 1, 'importing twice does not duplicate log entries');
});

test('import refuses wrong or tampered backups and changes nothing', () => {
  const s = memStore(), R = C.createRecords(s);
  R.create('a@x.y', 'deed', SALE);
  const good = R.exportBackup();
  const bad = [
    null, { app: 'other', db: good.db },
    { app: 'terrashield-admin-backup', db: { version: 2, records: [], log: [], nextId: 1 } },
    { app: 'terrashield-admin-backup', db: Object.assign({}, good.db, { records: [Object.assign({}, good.db.records[0], { id: 'X-1' })] }) },
    { app: 'terrashield-admin-backup', db: Object.assign({}, good.db, { records: [Object.assign({}, good.db.records[0], { status: 'official' })] }) },
    { app: 'terrashield-admin-backup', db: Object.assign({}, good.db, { records: [Object.assign({}, good.db.records[0], { data: Object.assign({}, SALE, { id: 'AD-1', sellerId: 'Real Person' }) })] }) },
    { app: 'terrashield-admin-backup', db: Object.assign({}, good.db, { records: [good.db.records[0], good.db.records[0]] }) }
  ];
  const before = JSON.stringify(s.db);
  for (const b of bad) assert.throws(() => R.importBackup('a@x.y', b), (e) => e.code === 'backup_invalid', JSON.stringify(b && b.app));
  assert.equal(JSON.stringify(s.db), before);
});

test('password rules are shared by the server and the file', () => {
  assert.equal(C.passwordProblem('short'), 'password_short');
  assert.equal(C.passwordProblem('password123'), 'password_weak');
  assert.equal(C.passwordProblem('aaaaaaaaaaaa'), 'password_weak');
  assert.equal(C.passwordProblem('me@example.com', 'me@example.com'), 'password_is_email');
  assert.equal(C.passwordProblem('a-good-long-pass'), null);
  assert.equal(require('../server/auth.js').passwordProblem, C.passwordProblem, 'server uses the same function');
});

test('reset keeps the login and the log', () => {
  const s = memStore(), R = C.createRecords(s);
  s.db.auth = { email: 'a@x.y', hash: 'H' };
  R.create('a@x.y', 'deed', SALE);
  assert.equal(R.reset('a@x.y'), 1);
  assert.deepEqual(s.db.records, []); assert.equal(s.db.auth.hash, 'H'); assert.equal(s.db.log.at(-1).action, 'reset');
});

test('restored backups are rebuilt from known fields only (types fixed, unknown keys dropped, used by the engine)', () => {
  const s = memStore(), R = C.createRecords(s);
  const evil = { app: 'terrashield-admin-backup', db: { version: 1, createdAt: 'x', nextId: 2,
    log: [{ at: '2026-01-01T00:00:00Z', actor: '<b>x</b>', action: 'create', recordId: 'AR-1', type: 'deed', detail: { note: 'n', extra: 1 }, junk: 1 }, 'not-an-entry'],
    records: [{ id: 'AR-1', type: 'deed', status: 'reviewed', junk: 1, history: [{ at: 'x', actor: 'a', action: 'create', status: 'draft', extra: 2 }, null],
      data: JSON.parse('{"__proto__":{"polluted":1},"id":"AD-1","office":"X","mouzaId":"M901","dag":"101","deedNo":"9001/2026","date":"2026-10-01","sellerId":"O01","buyerId":"P99","area":"40","_src":"base","extra":"z"}') }] } };
  R.importBackup('a@x.y', evil);
  const r = s.db.records[0];
  assert.deepEqual(Object.keys(r.data).sort(), ['area', 'buyerId', 'dag', 'date', 'deedNo', 'id', 'mouzaId', 'office', 'sellerId']);
  assert.equal(r.data.dag, 101); assert.equal(r.data.area, 40); assert.equal(r.data.office, 'SRO-DEMO');
  assert.ok(!('junk' in r) && !('extra' in r.history[0]) && r.history.length === 1);
  assert.equal(({}).polluted, undefined);
  assert.ok(s.db.log.every((e) => typeof e === 'object' && !('junk' in e)));
  assert.equal(engine.check(case01, C.mergePublic(s.base, s.db.records).data).status, 'red', 'restored record really is used');
});

test('file-mode password hashing fallback (no Web Crypto on plain http://) equals standard PBKDF2-SHA-256', () => {
  const crypto = require('crypto');
  const src = fs.readFileSync(path.join(ROOT, 'web/js/admin-local.js'), 'utf8');
  const pbkdf2js = new Function(src.slice(src.indexOf('  var K256'), src.indexOf('  function pbkdf2(password')) + ';return pbkdf2js;')();
  const cases = [['TerraShield-Demo-2026', 'saltsaltsaltsalt', 1], ['TerraShield-Demo-2026', 'saltsaltsaltsalt', 2000], ['x'.repeat(100), '0123456789abcdef', 25],
    ['বাংলা-পাসওয়ার্ড-১২৩', '0123456789abcdef', 7], ['p', '', 3], ['TerraShield-Demo-2026', '0123456789abcdef', 310000]];
  for (const [pw, salt, it] of cases) {
    const ours = Buffer.from(pbkdf2js(Buffer.from(pw), Buffer.from(salt), it)).toString('hex');
    assert.equal(ours, crypto.pbkdf2Sync(pw, salt, it, 32, 'sha256').toString('hex'), pw.slice(0, 12) + ' × ' + it);
  }
});

test('restoring a backup after reset keeps each log entry once, with its details', () => {
  const s = memStore(), R = C.createRecords(s);
  R.create('a@x.y', 'deed', SALE); R.approve('a@x.y', 'AR-1', '', true); R.archive('a@x.y', 'AR-1', 'old');
  R.note('-', 'login_failed', { reason: 'bad_credentials' });
  const bk = R.exportBackup();
  R.reset('a@x.y'); R.importBackup('a@x.y', bk); R.importBackup('a@x.y', bk);
  const arch = s.db.log.filter((l) => l.action === 'archive');
  assert.equal(arch.length, 1, 'archive entry not duplicated');
  assert.deepEqual(arch[0].detail, { note: 'old', from: 'reviewed' }, 'details kept');
  assert.equal(s.db.log.filter((l) => l.action === 'login_failed').length, 1);
  assert.equal(s.db.log.find((l) => l.action === 'login_failed').detail.reason, 'bad_credentials');
});
