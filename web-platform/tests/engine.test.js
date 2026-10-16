/*
 * TerraShield — engine tests
 * Run from the project folder:   node --test tests/
 * No packages needed (uses Node's built-in test runner).
 *
 * 1. Every case in shared/test-cases.json must give the expected status,
 *    rule IDs and S/A/L/W numbers. (The mobile app must pass the same file.)
 * 2. Input mistakes (Stage 3, Table 7) must give friendly error codes.
 * 3. The browser data file (web/js/data.js) must match shared/ exactly.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const engine = require('../web/js/engine.js');
const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const loc = read('shared/data/locations.json');
const data = {
  mouzas: loc.mouzas,
  people: read('shared/data/people.json').people,
  plots: read('shared/data/plots.json').plots,
  khatians: read('shared/data/khatians.json').khatians,
  deeds: read('shared/data/deeds.json').deeds,
  namjari: read('shared/data/namjari.json').namjari
};
const cases = read('shared/test-cases.json').cases;

/* ---------- 1. Shared test cases ---------- */
for (const tc of cases) {
  test(`${tc.id} — ${tc.title.en}`, () => {
    const d = tc.addDeeds ? engine.withExtraDeeds(data, tc.addDeeds) : data;
    const r = engine.check(tc.input, d);
    assert.equal(r.status, tc.expect.status, 'overall status');
    assert.deepEqual(engine.ruleIds(r), [...tc.expect.rules].sort(), 'rules found');
    if (tc.expect.calc) assert.deepEqual(r.calc, tc.expect.calc, 'S/A/L/W numbers');
    if (tc.expect.skipped) assert.deepEqual(r.skipped, tc.expect.skipped, 'skipped checks');
  });
}

test('R7b (quick resale) never changes the colour on its own', () => {
  const r = engine.check({ mouzaId: 'M902', dag: 109, sellerId: 'O11', area: 10 }, data);
  const r7b = r.findings.find((f) => f.rule === 'R7b');
  assert.equal(r7b.level, 'info');
  assert.equal(r7b.evidence.days, 35);
  assert.equal(r.status, 'green');
});

test('Evidence is attached: case 3 R1 cites deed 0102/2023', () => {
  const r = engine.check({ mouzaId: 'M901', dag: 103, sellerId: 'O03', area: 20 }, data);
  const r1 = r.findings.find((f) => f.rule === 'R1');
  assert.equal(r1.evidence.deeds[0].deedNo, '0102/2023');
  const r2 = r.findings.find((f) => f.rule === 'R2');
  assert.equal(r2.evidence.over, 10);
});

test('Findings are sorted most serious first', () => {
  const r = engine.check({ mouzaId: 'M901', dag: 105, sellerId: 'O05', area: 10 }, data);
  assert.deepEqual(r.findings.map((f) => f.level), ['high', 'high', 'medium']);
});

/* ---------- 2. Input mistakes (Table 7) ---------- */
const base = { mouzaId: 'M901', dag: 101, sellerId: 'O01', area: 20 };
const codes = (input) => engine.check(input, data).errors?.map((e) => e.code) ?? [];

test('Bangla digits are accepted: dag "১০৩", area "২০"', () => {
  const r = engine.check({ mouzaId: 'M901', dag: '১০৩', sellerId: 'O03', area: '২০' }, data);
  assert.equal(r.status, 'red');
  assert.deepEqual(engine.ruleIds(r), ['R1', 'R2']);
});
test('Empty area → area_required', () => assert.deepEqual(codes({ ...base, area: '' }), ['area_required']));
test('Zero area → area_positive', () => assert.deepEqual(codes({ ...base, area: 0 }), ['area_positive']));
test('Negative area → area_positive', () => assert.deepEqual(codes({ ...base, area: -5 }), ['area_positive']));
test('Area bigger than whole plot → area_too_big (50)', () => {
  const r = engine.check({ ...base, area: 60 }, data);
  assert.equal(r.status, 'invalid');
  assert.equal(r.errors[0].code, 'area_too_big');
  assert.equal(r.errors[0].params.total, 50);
});
test('Letters in dag → dag_digits', () => assert.deepEqual(codes({ ...base, dag: '10a' }), ['dag_digits']));
test('No seller chosen on a known plot → seller_required', () =>
  assert.deepEqual(codes({ ...base, sellerId: null }), ['seller_required']));
test('Bad deed number format → deed_format', () =>
  assert.deepEqual(codes({ ...base, sellerDeedNo: 'abc' }), ['deed_format']));
test('Deed numbers: "109/2010", "০১০৯/২০১০" and "0109/2010" are the same', () => {
  assert.equal(engine.normalizeDeedNo('109/2010'), '109/2010');
  assert.equal(engine.normalizeDeedNo('০১০৯/২০১০'), '109/2010');
  assert.equal(engine.normalizeDeedNo(' 0109 / 2010 '), '109/2010');
});

/* ---------- 3. Browser data file matches shared/ ---------- */
test('web/js/data.js is up to date with shared/ (run scripts/build-data.js if this fails)', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'web/js/data.js'), 'utf8'), sandbox);
  const web = sandbox.window.TS;
  assert.deepEqual(JSON.parse(JSON.stringify(web.data.deeds)), data.deeds);
  assert.deepEqual(JSON.parse(JSON.stringify(web.data.khatians)), data.khatians);
  assert.deepEqual(JSON.parse(JSON.stringify(web.data.namjari)), data.namjari);
  assert.equal(web.testCases.length, cases.length);
});
