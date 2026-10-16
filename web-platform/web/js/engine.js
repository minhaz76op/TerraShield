/*
 * TerraShield — engine.js  (the conflict-detection "brain")
 * -----------------------------------------------------------
 * Pure functions only: no screen code, no internet, no storage.
 * The same file runs in the browser (window.TS.engine) and in Node tests
 * (require('../web/js/engine.js')), so both always give identical results.
 *
 * IMPORTANT WORDING RULE: this engine reports "findings" (mismatches between
 * records). A finding is NOT proof of fraud and NOT legal verification.
 *
 * Simple maths used by the rules (all in decimal / শতাংশ):
 *   S = seller's share in the latest khatian for this dag
 *   A = area this seller already sold from this dag in deeds dated AFTER
 *       the latest khatian's record date
 *   L = S − A   (what is left on record)
 *   W = area the user wants to buy
 *
 * Rules (see docs/rules.md for the plain-language version):
 *   R1  Sold before, namjari not done              → medium
 *   R2  Selling more than he has left (W > L)      → high
 *   R3  Seller not in the latest khatian           → high
 *   R4  Already sold more than his share (A > S)   → high
 *   R5  Someone else's namjari is pending          → medium
 *   R6  Khatian shares add up to more than the plot→ medium
 *   R7a Sold before he acquired it                 → high
 *   R7b Quick resale (≤ 90 days) in the history    → info (does NOT change the result colour)
 *   R8a Seller's deed number not found             → medium
 *   R8b Seller's deed doesn't match (buyer/dag/area)→ high
 *   R8c Same deed number appears more than once    → high
 *
 * Overall result:
 *   any high → "red";  else any medium → "yellow";  else → "green" (info notes allowed)
 *   land (mouza + dag) not in data → "grey"
 */
(function (root, factory) {
  var engine = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = engine;                 // Node (tests)
  } else {
    root.TS = root.TS || {};
    root.TS.engine = engine;                 // Browser
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TOLERANCE = 0.01;      // allowed rounding difference in decimal
  var QUICK_RESALE_DAYS = 90;
  var LEVEL_RANK = { high: 3, medium: 2, info: 1 };

  /* ---------- 1. Small helpers ---------- */

  // Convert Bangla digits (০-৯) to English digits (0-9). Other text is kept.
  function normalizeDigits(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[০-৯]/g, function (d) {
      return String('০১২৩৪৫৬৭৮৯'.indexOf(d));
    });
  }

  // Read a number typed in Bangla or English digits. Returns NaN if not a number.
  function parseNumber(value) {
    var s = normalizeDigits(value).trim().replace(/,/g, '');
    if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  }

  // Deed numbers look like "0109/2010". "109/2010" and "০১০৯/২০১০" mean the same deed.
  function normalizeDeedNo(value) {
    var s = normalizeDigits(value).replace(/\s+/g, '');
    var m = s.match(/^(\d+)\/(\d{4})$/);
    if (!m) return null;
    return String(Number(m[1])) + '/' + m[2];
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function daysBetween(isoA, isoB) {
    return Math.round((Date.parse(isoB) - Date.parse(isoA)) / 86400000);
  }

  function findPlot(data, mouzaId, dag) {
    return data.plots.find(function (p) { return p.mouzaId === mouzaId && p.dag === dag; }) || null;
  }

  function findKhatian(data, mouzaId, dag) {
    return data.khatians.find(function (k) { return k.mouzaId === mouzaId && k.dag === dag; }) || null;
  }

  function deedsOnDag(data, mouzaId, dag) {
    return data.deeds.filter(function (d) { return d.mouzaId === mouzaId && d.dag === dag; });
  }

  function approvedNamjariFor(data, deedId) {
    return data.namjari.find(function (n) { return n.deedId === deedId && n.status === 'approved'; }) || null;
  }

  // Return a copy of the data with extra deeds added (used by the live demo).
  function withExtraDeeds(data, extraDeeds) {
    var copy = Object.assign({}, data);
    copy.deeds = data.deeds.concat(extraDeeds || []);
    return copy;
  }

  /* ---------- 2. Input checks (friendly error codes; screens show the words) ---------- */

  // Returns { ok, errors:[{field, code, params}], clean } where clean has parsed values.
  function validateInput(input, data) {
    var errors = [];
    var dagText = normalizeDigits(input.dag).trim();
    var dag = NaN;
    if (dagText === '') errors.push({ field: 'dag', code: 'dag_required' });
    else if (!/^\d+$/.test(dagText)) errors.push({ field: 'dag', code: 'dag_digits' });
    else dag = Number(dagText);

    var area = parseNumber(input.area);
    var areaText = normalizeDigits(input.area).trim();
    if (areaText === '') errors.push({ field: 'area', code: 'area_required' });
    else if (isNaN(area)) errors.push({ field: 'area', code: 'area_number' });
    else if (area <= 0) errors.push({ field: 'area', code: 'area_positive' });

    if (!input.mouzaId) errors.push({ field: 'mouza', code: 'mouza_required' });

    var plot = (!isNaN(dag) && input.mouzaId) ? findPlot(data, input.mouzaId, dag) : null;
    if (plot && !isNaN(area) && area > plot.totalArea + TOLERANCE) {
      errors.push({ field: 'area', code: 'area_too_big', params: { total: plot.totalArea } });
    }
    if (plot && !input.sellerId && !(input.sellerName && String(input.sellerName).trim())) {
      errors.push({ field: 'seller', code: 'seller_required' });
    }
    var deedNo = null;
    if (input.sellerDeedNo && String(input.sellerDeedNo).trim() !== '') {
      deedNo = normalizeDeedNo(input.sellerDeedNo);
      if (!deedNo) errors.push({ field: 'deedNo', code: 'deed_format' });
    }

    return {
      ok: errors.length === 0,
      errors: errors,
      clean: { mouzaId: input.mouzaId, dag: dag, area: area, sellerId: input.sellerId || null,
               sellerName: input.sellerName ? String(input.sellerName).trim() : null, deedNo: deedNo }
    };
  }

  /* ---------- 3. The main check ---------- */

  function check(input, data) {
    var v = validateInput(input, data);
    var base = { input: input, findings: [], skipped: [], calc: null };

    var plot = (!isNaN(v.clean.dag) && v.clean.mouzaId) ? findPlot(data, v.clean.mouzaId, v.clean.dag) : null;

    // Land not in our sample records → grey (only if the dag itself was readable).
    if (!plot && v.errors.every(function (e) { return e.field !== 'dag' && e.field !== 'mouza'; })) {
      return Object.assign(base, { status: 'grey', plot: null });
    }
    // Any other input problem (empty area, letters in dag, etc.) → stop and report it.
    if (!v.ok) return Object.assign(base, { status: 'invalid', errors: v.errors });

    var c = v.clean;
    var khatian = findKhatian(data, c.mouzaId, c.dag);
    var findings = [];
    var add = function (rule, level, evidence) { findings.push({ rule: rule, level: level, evidence: evidence }); };

    var dagDeeds = deedsOnDag(data, c.mouzaId, c.dag)
      .slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var owners = khatian ? khatian.owners : [];
    var ownerEntry = c.sellerId ? owners.find(function (o) { return o.personId === c.sellerId; }) : null;

    /* R3 — seller not in the latest khatian */
    if (!ownerEntry) {
      add('R3', 'high', { sellerName: c.sellerName, sellerId: c.sellerId,
        khatianNo: khatian ? khatian.khatianNo : null, owners: owners });
      base.skipped.push('area');           // S unknown → area rules can't run
    }

    /* Area maths and R1, R2, R4 (only when the seller is a recorded owner) */
    if (ownerEntry) {
      var S = ownerEntry.share;
      var laterSales = dagDeeds.filter(function (d) {
        return d.sellerId === c.sellerId && d.date > khatian.recordDate;
      });
      var A = laterSales.reduce(function (sum, d) { return sum + d.area; }, 0);
      var L = S - A;
      var W = c.area;
      base.calc = { S: round2(S), A: round2(A), L: round2(L), W: round2(W) };

      // R1 — sold before (after the khatian date) but namjari not approved
      var notMutated = laterSales.filter(function (d) { return !approvedNamjariFor(data, d.id); });
      if (notMutated.length > 0) {
        add('R1', 'medium', { khatianNo: khatian.khatianNo, khatianDate: khatian.recordDate,
          share: S, deeds: notMutated });
      }
      // R2 — wants to buy more than is left
      if (W > L + TOLERANCE) {
        add('R2', 'high', { S: base.calc.S, A: base.calc.A, L: base.calc.L, W: base.calc.W,
          over: round2(W - Math.max(L, 0)) });
      }
      // R4 — already sold more than his whole share
      if (A > S + TOLERANCE) {
        add('R4', 'high', { S: base.calc.S, A: base.calc.A, deeds: laterSales });
      }
    }

    /* R5 — someone else's namjari is pending on this dag */
    var pending = data.namjari.filter(function (n) {
      return n.mouzaId === c.mouzaId && n.dag === c.dag && n.status === 'pending' &&
             n.applicantId !== c.sellerId;
    });
    if (pending.length > 0) add('R5', 'medium', { cases: pending });

    /* R6 — khatian shares add up to more than the plot */
    if (khatian) {
      var totalShares = owners.reduce(function (sum, o) { return sum + o.share; }, 0);
      if (totalShares > plot.totalArea + TOLERANCE) {
        add('R6', 'medium', { khatianNo: khatian.khatianNo, owners: owners,
          totalShares: round2(totalShares), plotArea: plot.totalArea });
      }
    }

    /* R7a — the seller sold this land before he acquired it */
    if (c.sellerId) {
      var acquired = dagDeeds.filter(function (d) { return d.buyerId === c.sellerId; });
      if (acquired.length > 0) {
        var firstAcq = acquired[0];        // earliest acquisition (list is date-sorted)
        var early = dagDeeds.filter(function (d) {
          return d.sellerId === c.sellerId && d.date < firstAcq.date;
        });
        if (early.length > 0) add('R7a', 'high', { acquiredDeed: firstAcq, saleDeeds: early });
      }
    }

    /* R7b — quick resale (0–90 days) anywhere in this dag's deed history. Info only. */
    dagDeeds.forEach(function (sale) {
      var buys = dagDeeds.filter(function (d) { return d.buyerId === sale.sellerId && d.date <= sale.date; });
      if (buys.length === 0) return;
      var lastBuy = buys[buys.length - 1];
      var days = daysBetween(lastBuy.date, sale.date);
      if (days >= 0 && days <= QUICK_RESALE_DAYS) {
        add('R7b', 'info', { personId: sale.sellerId, boughtDeed: lastBuy, soldDeed: sale, days: days });
      }
    });

    /* R8 — the seller's own deed number (optional input) */
    if (c.deedNo) {
      var matches = data.deeds.filter(function (d) { return normalizeDeedNo(d.deedNo) === c.deedNo; });
      if (matches.length === 0) {
        add('R8a', 'medium', { deedNo: input.sellerDeedNo });
      } else if (matches.length > 1) {
        add('R8c', 'high', { deedNo: input.sellerDeedNo, deeds: matches });
      } else {
        var d = matches[0], problems = [];
        if (d.buyerId !== c.sellerId) problems.push('buyer');
        if (d.mouzaId !== c.mouzaId || d.dag !== c.dag) problems.push('dag');
        if (d.area + TOLERANCE < c.area) problems.push('area');
        if (problems.length > 0) add('R8b', 'high', { deed: d, problems: problems });
      }
    }

    /* Sort findings: most serious first (high → medium → info) */
    findings.sort(function (a, b) { return LEVEL_RANK[b.level] - LEVEL_RANK[a.level]; });

    var status = 'green';
    if (findings.some(function (f) { return f.level === 'high'; })) status = 'red';
    else if (findings.some(function (f) { return f.level === 'medium'; })) status = 'yellow';

    return Object.assign(base, {
      status: status, plot: plot, khatian: khatian,
      seller: { id: c.sellerId, name: c.sellerName, inKhatian: !!ownerEntry },
      findings: findings
    });
  }

  // Sorted, de-duplicated list of rule IDs in a result (handy for tests and summaries).
  function ruleIds(result) {
    var ids = [];
    (result.findings || []).forEach(function (f) { if (ids.indexOf(f.rule) < 0) ids.push(f.rule); });
    return ids.sort();
  }

  return {
    TOLERANCE: TOLERANCE,
    QUICK_RESALE_DAYS: QUICK_RESALE_DAYS,
    normalizeDigits: normalizeDigits,
    parseNumber: parseNumber,
    normalizeDeedNo: normalizeDeedNo,
    validateInput: validateInput,
    withExtraDeeds: withExtraDeeds,
    check: check,
    ruleIds: ruleIds
  };
});
