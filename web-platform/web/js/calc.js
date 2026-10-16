/*
 * TerraShield — calc.js  (land calculator logic; pure functions, no DOM)
 * Used by the browser (window.TS.calc) and by Node tests (require).
 * It never touches the rule engine: it only does arithmetic on numbers the user types.
 *
 *   parseAmount('১২.৫')          → { ok: true, value: 12.5 }
 *   parseShare('১/৩')            → { ok: true, value: 0.3333…, kind: 'fraction', num: 1, den: 3 }
 *   shareArea('60', 'decimal', '1/3') → { ok: true, totalDecimal: 60, share: 0.333…, areaDecimal: 20 }
 *   convert('10', 'decimal')     → { ok: true, sqft: 4356, rows: [{ id: 'decimal', value: 10 }, …] }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../shared/units.json'));
  else { root.TS = root.TS || {}; root.TS.calc = factory(root.TS.units); }
})(typeof self !== 'undefined' ? self : this, function (UNITS) {
  'use strict';

  var MAX = 1e9;                      // anything bigger is a typing mistake
  var BY_ID = {};
  UNITS.areaUnits.forEach(function (u) { BY_ID[u.id] = u; });

  // Bangla digits → ASCII, remove spaces and thousands commas.
  function clean(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[০-৯]/g, function (d) { return String('০১২৩৪৫৬৭৮৯'.indexOf(d)); })
      .replace(/[\s,]/g, '');
  }
  function fail(error) { return { ok: false, error: error }; }

  // A positive amount of land. Errors: empty | notNumber | notPositive | tooLarge
  function parseAmount(text) {
    var s = clean(text);
    if (s === '') return fail('empty');
    if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(s)) return fail('notNumber');
    var v = Number(s);
    if (!(v > 0)) return fail('notPositive');
    if (v > MAX) return fail('tooLarge');
    return { ok: true, value: v };
  }

  // An ownership share as written in a khatian: "1/3", "0.25", ".333", "25%", "1".
  // Errors: empty | notNumber | zeroDen | notPositive | overOne
  function parseShare(text) {
    var s = clean(text).replace(/％/g, '%');
    if (s === '') return fail('empty');
    var m, v, out;
    if ((m = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s))) {
      var num = Number(m[1]), den = Number(m[2]);
      if (den === 0) return fail('zeroDen');
      v = num / den; out = { kind: 'fraction', num: num, den: den };
    } else if ((m = /^(\d+(?:\.\d*)?|\.\d+)%$/.exec(s))) {
      v = Number(m[1]) / 100; out = { kind: 'percent', percent: Number(m[1]) };
    } else if (/^(\d+(\.\d*)?|\.\d+)$/.test(s)) {
      v = Number(s); out = { kind: 'decimal' };
    } else if (/^-/.test(s)) {
      return fail('notPositive');
    } else return fail('notNumber');
    if (!(v > 0)) return fail('notPositive');
    if (v > 1 + 1e-9) return fail('overOne');
    out.ok = true; out.value = Math.min(v, 1);
    return out;
  }

  // Land in the share. totalUnit: 'decimal' | 'acre'. Result always in decimal.
  // Errors are returned per field: { ok:false, errors: { total?: code, share?: code } }
  function shareArea(totalText, totalUnit, shareText) {
    var t = parseAmount(totalText), s = parseShare(shareText), errors = {};
    if (!t.ok) errors.total = t.error;
    if (!s.ok) errors.share = s.error;
    if (!t.ok || !s.ok) return { ok: false, errors: errors };
    var unit = BY_ID[totalUnit] && UNITS.shareTotalUnits.indexOf(totalUnit) >= 0 ? totalUnit : 'decimal';
    var totalDecimal = t.value * BY_ID[unit].sqft / BY_ID.decimal.sqft;
    return { ok: true, total: t.value, totalUnit: unit, totalDecimal: totalDecimal, share: s.value, shareInfo: s, areaDecimal: totalDecimal * s.value };
  }

  // One amount in one unit → the same land in every unit.
  function convert(text, fromId) {
    var a = parseAmount(text);
    if (!a.ok) return a;
    var from = BY_ID[fromId] || BY_ID.decimal;
    var sqft = a.value * from.sqft;
    return {
      ok: true, value: a.value, from: from.id, sqft: sqft,
      rows: UNITS.areaUnits.map(function (u) { return { id: u.id, value: sqft / u.sqft, regional: !!u.regional }; })
    };
  }

  // Display rounding: big numbers 2 places, small numbers up to 4 significant places; no trailing zeros.
  function round(v) {
    if (!isFinite(v)) return '';
    var dp = v >= 100 ? 2 : v >= 1 ? 2 : v >= 0.01 ? 4 : 6;
    return String(Number(v.toFixed(dp)));
  }

  return { UNITS: UNITS, unit: function (id) { return BY_ID[id]; }, clean: clean, parseAmount: parseAmount, parseShare: parseShare, shareArea: shareArea, convert: convert, round: round };
});
