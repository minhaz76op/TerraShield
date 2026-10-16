/*
 * TerraShield — calculator tests (Node 18+, no packages).
 * Run: node --test tests/calc.test.js
 * Expected values are worked out by hand from shared/units.json (1 decimal = 435.6 sq ft).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../web/js/calc.js');

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

/* ---------- Unit constants ---------- */
test('units: 1 acre = 100 decimal, 1 bigha = 20 katha (standard)', () => {
  near(C.unit('acre').sqft / C.unit('decimal').sqft, 100);
  near(C.unit('bigha').sqft / C.unit('katha').sqft, 20);
});
test('units: katha and bigha are marked regional; the others are not', () => {
  const regional = C.UNITS.areaUnits.filter(u => u.regional).map(u => u.id).sort();
  assert.deepEqual(regional, ['bigha', 'katha']);
});
test('units: no ana-gonda share units are included (disabled until verified)', () => {
  const ids = C.UNITS.areaUnits.map(u => u.id);
  for (const x of ['ana', 'gonda', 'kora', 'kranti', 'til']) assert.ok(!ids.includes(x));
});

/* ---------- parseAmount ---------- */
test('parseAmount: Bangla and English digits, decimals, commas', () => {
  assert.equal(C.parseAmount('১২.৫').value, 12.5);
  assert.equal(C.parseAmount('12.5').value, 12.5);
  assert.equal(C.parseAmount(' ১,২০০ ').value, 1200);
  assert.equal(C.parseAmount('.৫').value, 0.5);
});
test('parseAmount: errors', () => {
  assert.equal(C.parseAmount('').error, 'empty');
  assert.equal(C.parseAmount('   ').error, 'empty');
  assert.equal(C.parseAmount('abc').error, 'notNumber');
  assert.equal(C.parseAmount('১০ক').error, 'notNumber');
  assert.equal(C.parseAmount('1.2.3').error, 'notNumber');
  assert.equal(C.parseAmount('0').error, 'notPositive');
  assert.equal(C.parseAmount('-5').error, 'notPositive');
  assert.equal(C.parseAmount('99999999999').error, 'tooLarge');
});

/* ---------- parseShare ---------- */
test('parseShare: fraction in Bangla digits', () => {
  const s = C.parseShare('১/৩');
  assert.ok(s.ok); assert.equal(s.kind, 'fraction'); near(s.value, 1 / 3);
});
test('parseShare: decimal forms used in khatians', () => {
  near(C.parseShare('০.২৫').value, 0.25);
  near(C.parseShare('.৩৩৩').value, 0.333);
  near(C.parseShare('1').value, 1);
  near(C.parseShare('১.০০০').value, 1);
});
test('parseShare: percent', () => {
  const s = C.parseShare('২৫%');
  assert.ok(s.ok); assert.equal(s.kind, 'percent'); near(s.value, 0.25);
  near(C.parseShare('100%').value, 1);
});
test('parseShare: spaces around the slash are fine', () => {
  near(C.parseShare(' 1 / 4 ').value, 0.25);
});
test('parseShare: errors', () => {
  assert.equal(C.parseShare('').error, 'empty');
  assert.equal(C.parseShare('1/0').error, 'zeroDen');
  assert.equal(C.parseShare('0').error, 'notPositive');
  assert.equal(C.parseShare('0/5').error, 'notPositive');
  assert.equal(C.parseShare('-0.5').error, 'notPositive');
  assert.equal(C.parseShare('3/2').error, 'overOne');
  assert.equal(C.parseShare('1.2').error, 'overOne');
  assert.equal(C.parseShare('150%').error, 'overOne');
  assert.equal(C.parseShare('এক তৃতীয়াংশ').error, 'notNumber');
  assert.equal(C.parseShare('1/3/4').error, 'notNumber');
});

/* ---------- shareArea (L3) ---------- */
test('shareArea: 60 decimal × 1/3 = 20 decimal', () => {
  const r = C.shareArea('৬০', 'decimal', '১/৩');
  assert.ok(r.ok); near(r.areaDecimal, 20);
});
test('shareArea: matches sample record — dag 103 is 40 decimal; a 0.75 share is 30', () => {
  near(C.shareArea('40', 'decimal', '0.75').areaDecimal, 30);
});
test('shareArea: total in acres is converted to decimal first (0.5 acre × 1/2 = 25 decimal)', () => {
  const r = C.shareArea('০.৫', 'acre', '1/2');
  assert.ok(r.ok); near(r.totalDecimal, 50); near(r.areaDecimal, 25);
});
test('shareArea: whole share returns the whole dag', () => {
  near(C.shareArea('33', 'decimal', '100%').areaDecimal, 33);
});
test('shareArea: reports errors for each field separately', () => {
  const r = C.shareArea('', 'decimal', '3/2');
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors, { total: 'empty', share: 'overOne' });
  assert.deepEqual(C.shareArea('৬০', 'decimal', '').errors, { share: 'empty' });
});
test('shareArea: unknown total unit falls back to decimal', () => {
  near(C.shareArea('60', 'bigha', '1/2').areaDecimal, 30);
});

/* ---------- convert (L2) ---------- */
test('convert: 1 acre = 100 decimal = 43,560 sq ft', () => {
  const r = C.convert('1', 'acre'), v = id => r.rows.find(x => x.id === id).value;
  near(v('decimal'), 100); near(v('sqft'), 43560); near(v('acre'), 1);
});
test('convert: 10 decimal = 4,356 sq ft ≈ 404.69 sq m ≈ 6.05 katha', () => {
  const r = C.convert('১০', 'decimal'), v = id => r.rows.find(x => x.id === id).value;
  near(v('sqft'), 4356); near(v('sqm'), 404.6856, 1e-3); near(v('katha'), 6.05, 1e-9);
});
test('convert: 1 standard bigha = 14,400 sq ft ≈ 33.06 decimal', () => {
  const r = C.convert('1', 'bigha');
  near(r.rows.find(x => x.id === 'decimal').value, 33.0578, 1e-3);
});
test('convert: 1 sq m = 10.7639 sq ft (exact definition)', () => {
  near(C.convert('1', 'sqm').sqft, 10.7639104, 1e-6);
});
test('convert: round trip decimal → sq ft → decimal', () => {
  const sqft = C.convert('17.25', 'decimal').sqft;
  near(C.convert(String(sqft), 'sqft').rows.find(x => x.id === 'decimal').value, 17.25);
});
test('convert: every row flags regional units', () => {
  const r = C.convert('1', 'decimal');
  assert.deepEqual(r.rows.filter(x => x.regional).map(x => x.id).sort(), ['bigha', 'katha']);
});
test('convert: invalid input returns the parse error', () => {
  assert.equal(C.convert('', 'decimal').error, 'empty');
  assert.equal(C.convert('-3', 'acre').error, 'notPositive');
});

/* ---------- round ---------- */
test('round: trims trailing zeros and keeps sensible places', () => {
  assert.equal(C.round(20), '20');
  assert.equal(C.round(20.0000001), '20');
  assert.equal(C.round(6.05), '6.05');
  assert.equal(C.round(0.25), '0.25');
  assert.equal(C.round(0.33333), '0.3333');
  assert.equal(C.round(4356), '4356');
  assert.equal(C.round(Infinity), '');
});
