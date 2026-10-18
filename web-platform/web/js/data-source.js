/*
 * TerraShield — data-source.js   (loaded right after data.js, admin-validate.js and admin-core.js)
 *
 * Where the land records come from:
 *  - Served by the local server (npm start)  → GET /api/data = the fictional base data + admin records that an
 *    admin APPROVED on the server. If the server cannot be reached, the bundled data is used.
 *  - Opened by double-click (file://, incl. the standalone terrashield.html) → the bundled fictional data +
 *    admin records APPROVED in this file's Admin Panel, read from this browser's localStorage (admin-local.js).
 *  - Put on any other web host (GitHub Pages, Netlify, VS Code Live Server, python -m http.server …) → there is no
 *    TerraShield API there (/api/data answers 404 or a web page), so the page works exactly like the file: "local"
 *    mode with this browser's storage. Server mode is used only when /api/data really answers with our data.
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
  var httpPage = /^https?:$/.test(location.protocol);
  var served = httpPage;                       // provisional on http(s) until /api/data has answered (see detect())
  var loads = 0, listening = false;

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

  function listenLocal() {                    // another tab of this page changed the admin records → use them here too
    if (listening) return; listening = true;
    window.addEventListener('storage', function (e) { if (e.key === C.LOCAL_KEY) { mergeLocal(); emit(); } });
  }
  function setMode(isServer) { served = isServer; TS.dataSource.served = isServer; TS.dataSource.mode = isServer ? 'server' : 'local'; }

  // http(s) page: is the TerraShield server behind it? 404/405, a web page instead of JSON, or no network → no server
  // (static host) → local mode. A 5xx means our server has a problem → stay in server mode with the bundled fallback.
  function detect() {
    if (!window.fetch) { setMode(false); mergeLocal(); listenLocal(); emit(); return Promise.resolve(true); }
    return fetch('/api/data', { cache: 'no-store', credentials: 'same-origin' }).then(function (r) {
      if (r.status >= 500) return 'down';
      if (!r.ok || !/json/i.test(r.headers.get('content-type') || '')) return null;
      return r.json().then(function (b) { return looksValid(b && b.data) ? b : null; }, function () { return null; });
    }, function () { return null; }).then(function (b) {
      if (b === 'down') { setMode(true); TS.data = TS.baseData; TS.dataMeta = { source: 'bundled-fallback', reviewedAdminRecords: 0 }; emit(); return false; }
      if (!b) { setMode(false); mergeLocal(); listenLocal(); emit(); return true; }
      setMode(true); TS.data = b.data;
      TS.dataMeta = { source: 'server', reviewedAdminRecords: (b.meta && b.meta.reviewedAdminRecords) || 0 };
      emit(); return true;
    });
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

  if (!httpPage && C) { mergeLocal(); loads = 1; }   // already in place before the first screen — later changes need no full redraw
  TS.dataSource = { served: served, mode: served ? 'server' : 'local', refresh: refresh, ready: null };
  TS.dataSource.ready = httpPage ? detect() : Promise.resolve(true);
  if (httpPage) document.addEventListener('visibilitychange', function () { if (!document.hidden && served) refresh(); });
  else listenLocal();
})();
