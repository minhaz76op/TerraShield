/*
 * TerraShield — admin-validate.js  (shared by the server and the admin panel)
 * Checks a land record an admin wants to add/edit, BEFORE it is saved.
 * The server always re-checks (the browser copy is only for instant feedback).
 *
 *   validateRecord(type, input, ctx) → { ok, clean, errors: [{ field, code }], warnings: [{ field, code }] }
 *   buildContext(base, adminRecords, excludeId) → ctx used above
 *   approvalBlockers(record, ctx) / dependants(record, records) → reasons an action is not allowed
 *
 * Rules that keep the prototype honest and the engine consistent:
 *  - People can only be chosen from the FICTIONAL people list (no free-typed names → no real names).
 *  - Any 10+ digit number in any text is refused (looks like an NID / phone number).
 *  - One plot and one khatian per mouza + dag (the engine reads the first match only).
 *  - Things the engine is meant to DETECT (shares above the dag total, duplicate deed numbers)
 *    are allowed but returned as warnings, so admins can model real-world conflicts.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.TS = root.TS || {}; root.TS.adminValidate = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TYPES = ['plot', 'khatian', 'deed', 'namjari'];
  var ARRAY = { plot: 'plots', khatian: 'khatians', deed: 'deeds', namjari: 'namjari' };
  var SURVEYS = ['CS', 'SA', 'RS', 'BS', 'BS (updated by namjari)'];
  var NAMJARI_STATUS = ['pending', 'approved', 'rejected'];
  var BASIS = ['deed', 'inheritance'];
  var ACTIVE = ['draft', 'reviewed'];
  var MAX_AREA = 100000;

  // Only plain strings and numbers are read; anything else (objects, arrays, booleans) counts as empty,
  // so odd input can never crash the check (e.g. an object with a broken toString).
  function digits(v) {
    if (typeof v !== 'string' && typeof v !== 'number') return '';
    return String(v).replace(/[০-৯]/g, function (d) { return String('০১২৩৪৫৬৭৮৯'.indexOf(d)); });
  }
  function text(v, max) { return digits(v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max || 200); }
  function nidLike(v) { return /\d{10,}/.test(digits(v).replace(/[\s-]/g, '')); }
  function num(v) {
    var s = digits(v).trim().replace(/,/g, '');
    if (s === '' || !/^\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  }
  function int(v) { var n = num(v); return Number.isInteger(n) ? n : NaN; }
  function isoDate(v) {
    var s = digits(v).trim(), m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return s;
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function normDeedNo(v) { var m = /^(\d+)\/(\d{4})$/.exec(digits(v).replace(/\s+/g, '')); return m ? String(Number(m[1])) + '/' + m[2] : null; }

  // ctx: everything a record may refer to. "active" = base records + admin drafts/approved (not rejected/archived).
  function buildContext(base, records, excludeId) {
    var ctx = { people: base.people, mouzas: base.mouzas, plots: [], khatians: [], deeds: [], namjari: [] };
    TYPES.forEach(function (t) {
      base[ARRAY[t]].forEach(function (x) { ctx[ARRAY[t]].push({ src: 'base', status: 'base', data: x }); });
    });
    (records || []).forEach(function (r) {
      if (r.id === excludeId || ACTIVE.indexOf(r.status) < 0 || !ARRAY[r.type]) return;
      ctx[ARRAY[r.type]].push({ src: 'admin', id: r.id, status: r.status, data: r.data });
    });
    return ctx;
  }
  var sameDag = function (m, d) { return function (e) { return e.data.mouzaId === m && Number(e.data.dag) === d; }; };
  function personOk(ctx, id) { return ctx.people.some(function (p) { return p.id === id; }); }

  function validateRecord(type, input, ctx) {
    var errors = [], warnings = [], clean = {}, i = input || {};
    var err = function (f, c) { errors.push({ field: f, code: c }); };
    var warn = function (f, c) { warnings.push({ field: f, code: c }); };
    if (TYPES.indexOf(type) < 0) return { ok: false, clean: null, errors: [{ field: 'type', code: 'type_invalid' }], warnings: [] };

    // NID / phone guard on every text value (including nested owners)
    (function scan(o, path) {
      Object.keys(o || {}).forEach(function (k) {
        var v = o[k];
        if (v && typeof v === 'object') scan(v, path ? path + '.' + k : k);
        else if (typeof v === 'string' && nidLike(v)) err(path ? path + '.' + k : k, 'nid_like');
      });
    })(i, '');

    // Every record sits on a mouza + dag
    clean.mouzaId = text(i.mouzaId, 20);
    if (!ctx.mouzas.some(function (m) { return m.id === clean.mouzaId; })) err('mouzaId', 'mouza_invalid');
    clean.dag = int(i.dag);
    if (isNaN(clean.dag) || clean.dag < 1 || clean.dag > 99999) err('dag', 'dag_invalid');
    var onDag = sameDag(clean.mouzaId, clean.dag);
    var plotHere = ctx.plots.filter(onDag)[0] || null;

    if (type === 'plot') {
      clean.totalArea = num(i.totalArea);
      if (isNaN(clean.totalArea) || clean.totalArea <= 0 || clean.totalArea > MAX_AREA) err('totalArea', 'area_invalid');
      if (plotHere) err('dag', 'plot_exists');
    }

    if (type === 'khatian') {
      clean.khatianNo = text(i.khatianNo, 20);
      if (!/^[0-9A-Za-z/\-]{1,20}$/.test(clean.khatianNo)) err('khatianNo', 'khatian_invalid');
      clean.survey = text(i.survey, 30);
      if (SURVEYS.indexOf(clean.survey) < 0) err('survey', 'survey_invalid');
      clean.recordDate = isoDate(i.recordDate);
      if (!clean.recordDate) err('recordDate', 'date_invalid'); else if (clean.recordDate > today()) err('recordDate', 'date_future');
      var owners = Array.isArray(i.owners) ? i.owners.slice(0, 20) : [];
      clean.owners = [];
      if (!owners.length) err('owners', 'owners_required');
      var seen = {}, sum = 0;
      owners.forEach(function (o, n) {
        if (!o || typeof o !== 'object') o = {};
        var pid = text(o.personId, 10), share = num(o.share);
        if (!personOk(ctx, pid)) err('owners.' + n + '.personId', 'person_invalid');
        else if (seen[pid]) err('owners.' + n + '.personId', 'owner_duplicate');
        seen[pid] = true;
        if (isNaN(share) || share <= 0 || share > MAX_AREA) err('owners.' + n + '.share', 'area_invalid'); else sum += share;
        clean.owners.push({ personId: pid, share: share });
      });
      if (!plotHere) err('dag', 'plot_missing');
      else if (sum > Number(plotHere.data.totalArea) + 0.01) warn('owners', 'shares_exceed_total');   // R6 will flag this
      if (ctx.khatians.some(onDag)) err('dag', 'khatian_exists');
    }

    if (type === 'deed') {
      var dn = normDeedNo(i.deedNo);
      clean.deedNo = dn ? text(i.deedNo, 20).replace(/\s+/g, '') : '';
      if (!dn) err('deedNo', 'deedno_invalid');
      clean.office = 'SRO-DEMO';
      clean.date = isoDate(i.date);
      if (!clean.date) err('date', 'date_invalid'); else if (clean.date > today()) err('date', 'date_future');
      clean.sellerId = text(i.sellerId, 10); clean.buyerId = text(i.buyerId, 10);
      if (!personOk(ctx, clean.sellerId)) err('sellerId', 'person_invalid');
      if (!personOk(ctx, clean.buyerId)) err('buyerId', 'person_invalid');
      if (clean.sellerId && clean.sellerId === clean.buyerId) err('buyerId', 'same_person');
      clean.area = num(i.area);
      if (isNaN(clean.area) || clean.area <= 0 || clean.area > MAX_AREA) err('area', 'area_invalid');
      else if (plotHere && clean.area > Number(plotHere.data.totalArea) + 0.01) warn('area', 'area_above_plot');
      if (!plotHere) err('dag', 'plot_missing');
      if (dn && ctx.deeds.some(function (e) { return normDeedNo(e.data.deedNo) === dn; })) warn('deedNo', 'deedno_duplicate');   // R8c will flag this
    }

    if (type === 'namjari') {
      clean.caseNo = text(i.caseNo, 20);
      if (!/^[0-9A-Za-z/\-]{1,20}$/.test(clean.caseNo)) err('caseNo', 'case_invalid');
      clean.applicantId = text(i.applicantId, 10);
      if (!personOk(ctx, clean.applicantId)) err('applicantId', 'person_invalid');
      clean.basis = text(i.basis, 20);
      if (BASIS.indexOf(clean.basis) < 0) err('basis', 'basis_invalid');
      clean.deedId = null;
      if (clean.basis === 'deed') {
        var did = text(i.deedId, 20), deed = ctx.deeds.filter(function (e) { return e.data.id === did; })[0];
        if (!deed) err('deedId', 'deed_missing');
        else if (deed.data.mouzaId !== clean.mouzaId || Number(deed.data.dag) !== clean.dag) err('deedId', 'deed_other_dag');
        clean.deedId = did;
      }
      clean.status = text(i.status, 20);
      if (NAMJARI_STATUS.indexOf(clean.status) < 0) err('status', 'njstatus_invalid');
      clean.date = isoDate(i.date);
      if (!clean.date) err('date', 'date_invalid'); else if (clean.date > today()) err('date', 'date_future');
      if (!plotHere) err('dag', 'plot_missing');
      if (ctx.namjari.some(function (e) { return e.data.caseNo === clean.caseNo; })) err('caseNo', 'case_exists');
    }

    return { ok: errors.length === 0, clean: errors.length ? null : clean, errors: errors, warnings: warnings };
  }

  // Before approving: everything the record depends on must already be live (base or approved).
  function approvalBlockers(record, ctx) {
    var d = record.data, out = [];
    if (record.type !== 'plot') {
      var p = ctx.plots.filter(sameDag(d.mouzaId, Number(d.dag)))[0];
      if (!p || (p.status !== 'base' && p.status !== 'reviewed')) out.push('plot_not_live');
    }
    if (record.type === 'namjari' && d.basis === 'deed') {
      var deed = ctx.deeds.filter(function (e) { return e.data.id === d.deedId; })[0];
      if (!deed || (deed.status !== 'base' && deed.status !== 'reviewed')) out.push('deed_not_live');
    }
    return out;
  }

  // Active admin records that depend on this one (a plot's khatian/deeds/namjari, a deed's namjari).
  function dependants(record, records) {
    return (records || []).filter(function (r) {
      if (r.id === record.id || ACTIVE.indexOf(r.status) < 0) return false;
      if (record.type === 'plot') return r.type !== 'plot' && r.data.mouzaId === record.data.mouzaId && Number(r.data.dag) === Number(record.data.dag);
      if (record.type === 'deed') return r.type === 'namjari' && r.data.deedId === record.data.id;
      return false;
    }).map(function (r) { return r.id; });
  }

  // Keep only the known fields of a record, with the right types (used for restored backups, whose
  // archived/rejected records may legitimately fail the uniqueness checks). Unknown keys are dropped.
  var FIELDS = { plot: ['totalArea'], khatian: ['khatianNo', 'survey', 'recordDate', 'owners'], deed: ['id', 'deedNo', 'office', 'date', 'sellerId', 'buyerId', 'area'],
    namjari: ['caseNo', 'applicantId', 'basis', 'deedId', 'status', 'date'] };
  var NUMERIC = { totalArea: 1, area: 1 };
  function sanitize(type, data) {
    var d = data && typeof data === 'object' ? data : {}, out = { mouzaId: text(d.mouzaId, 20), dag: int(d.dag) };
    (FIELDS[type] || []).forEach(function (k) {
      if (k === 'owners') out.owners = (Array.isArray(d.owners) ? d.owners.slice(0, 20) : []).map(function (o) { o = o && typeof o === 'object' ? o : {}; return { personId: text(o.personId, 10), share: num(o.share) }; });
      else if (NUMERIC[k]) out[k] = num(d[k]);
      else if (k === 'deedId') out[k] = d[k] === null ? null : text(d[k], 20);
      else out[k] = text(d[k], 30);
    });
    return out;
  }

  return { TYPES: TYPES, ARRAY: ARRAY, sanitize: sanitize, SURVEYS: SURVEYS, NAMJARI_STATUS: NAMJARI_STATUS, BASIS: BASIS,
    validateRecord: validateRecord, buildContext: buildContext, approvalBlockers: approvalBlockers, dependants: dependants,
    nidLike: nidLike, normDeedNo: normDeedNo, text: text, today: today };
});
