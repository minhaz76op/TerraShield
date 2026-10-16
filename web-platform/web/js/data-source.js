/*
 * TerraShield — data-source.js   (loaded right after data.js, admin-validate.js and admin-core.js)
 *
 * Where the land records come from:
 *  - Served by the local server (npm start)  → GET /api/data = the fictional base data + admin records that an
 *    admin APPROVED on the server. If the server cannot be reached, the bundled data is used.
 *  - Opened by double-click (file://, incl. the standalone terrashield.html) → the bundled fictional data +
 *    admin records APPROVED in this file's Admin Panel, read from this browser's localStorage (admin-local.js).
 *
 * TS.baseData  always the bundled fictional data — used by the 14 shared tests, sample cases and Judge Mode,
 *              so admin records can never change those.
 * TS.data      the data used for a person's own check (base + approved admin records).
 * TS.dataMeta  { source: 'bundled' | 'server' | 'local' | 'bundled-fallback', reviewedAdminRecords }
 * Fires window event 'ts-data' (detail.first = true on the first load) whenever TS.data is replaced.
 */
(function () {
  'use strict';
  var TS = window.TS, C = TS.adminCore;
  TS.baseData = TS.data;
  TS.dataMeta = { source: 'bundled', reviewedAdminRecords: 0 };
  var served = /^https?:$/.test(location.protocol);
  var loads = 0;

  function emit() {
    var first = loads++ === 0;
    try { window.dispatchEvent(new CustomEvent('ts-data', { detail: { first: first, source: TS.dataMeta.source } })); } catch (e) { /* very old browser */ }
  }
  function looksValid(d) {
    return d && ['mouzas', 'people', 'plots', 'khatians', 'deeds', 'namjari'].every(function (k) { return Array.isArray(d[k]); }) && d.district && d.upazila;
  }

  // File mode: merge records approved in this browser's Admin Panel. Synchronous, so the very first screen uses them.
  function mergeLocal() {
    var raw = null;
    try { raw = localStorage.getItem(C.LOCAL_KEY); } catch (e) { raw = null; }
    var m = null;
    try { var db = raw && JSON.parse(raw); if (db && C.isValidShape(db)) m = C.mergePublic(TS.baseData, db.records); } catch (e) { m = null; }
    if (m && m.count > 0) { TS.data = m.data; TS.dataMeta = { source: 'local', reviewedAdminRecords: m.count }; }
    else { TS.data = TS.baseData; TS.dataMeta = { source: 'bundled', reviewedAdminRecords: 0 }; }
  }

  function refresh() {
    if (!served) { mergeLocal(); emit(); return Promise.resolve(true); }
    if (!window.fetch) return Promise.resolve(false);
    return fetch('/api/data', { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (body) {
        if (!looksValid(body && body.data)) throw new Error('unexpected data');
        TS.data = body.data;
        TS.dataMeta = { source: 'server', reviewedAdminRecords: (body.meta && body.meta.reviewedAdminRecords) || 0 };
        emit(); return true;
      })
      .catch(function () {
        TS.data = TS.baseData;
        TS.dataMeta = { source: 'bundled-fallback', reviewedAdminRecords: 0 };
        emit(); return false;
      });
  }

  if (!served && C) { mergeLocal(); loads = 1; }     // already in place before the first screen — later changes need no full redraw
  TS.dataSource = { served: served, mode: served ? 'server' : 'local', refresh: refresh, ready: served ? refresh() : Promise.resolve(true) };
  if (served) document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  // File mode: another tab of this file changed the admin records → use them here too.
  else window.addEventListener('storage', function (e) { if (e.key === C.LOCAL_KEY) { mergeLocal(); emit(); } });
})();
