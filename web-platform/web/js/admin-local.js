/*
 * TerraShield — admin-local.js   Admin Panel "backend" for the double-clicked file (file://, no server).
 *
 * Answers the same requests as the local server (/api/admin/…) but keeps everything in THIS browser:
 *   localStorage   'terrashield-admin-v1'          admin records + change log + the admin account (password HASH only)
 *
 * The admin account in the file is always the labelled local DEMO account (TS.adminCore.DEMO): created on the first
 * visit (stored as a hash, demo:true) and shown on the login page. An account from an older version (own password) is
 * switched to the demo account; admin records and the log are kept. The demo password cannot be changed here.
 *   localStorage   'terrashield-admin-lock-v1'     failed-login counter (5 wrong → 15 minutes locked)
 *   sessionStorage 'terrashield-admin-session-v1'  "logged in" (ends when the browser closes, after 30 min idle or 8 h)
 *
 * Honest limits (also shown in the panel):
 *  - Records live only in this browser on this computer. Another browser/computer, a private window or
 *    "clear browsing data" will not have them → use Settings › Download / Restore backup.
 *  - Without a server, the login is a lock against casual use, not real security: someone with the file
 *    and the browser's developer tools can change stored data. Fine for fictional demo data only.
 * Passwords are hashed with PBKDF2-SHA-256 (Web Crypto); the only password built into the file is the public demo one.
 */
(function () {
  'use strict';
  var TS = window.TS, C = TS.adminCore;
  var KEY = C.LOCAL_KEY, LOCK = 'terrashield-admin-lock-v1', SESS = 'terrashield-admin-session-v1';
  var IDLE_MS = 30 * 60 * 1000, MAX_AGE_MS = 8 * 60 * 60 * 1000, MAX_FAILS = 5, WINDOW_MS = 15 * 60 * 1000, LOCK_MS = 15 * 60 * 1000, ITER = 310000;
  var E = C.ActionError;

  /* ---------- storage ---------- */
  function storageOk() {
    try { localStorage.setItem(KEY + '-probe', '1'); localStorage.removeItem(KEY + '-probe'); sessionStorage.setItem(SESS + '-probe', '1'); sessionStorage.removeItem(SESS + '-probe'); return true; }
    catch (e) { return false; }
  }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { throw E(503, 'storage_unavailable'); }
    if (!raw) return C.emptyDb();
    try { var d = JSON.parse(raw); if (!C.isValidShape(d)) throw new Error('shape'); return d; }
    catch (e) {
      try { localStorage.setItem(KEY + '-corrupt-' + Date.now(), raw); } catch (x) { /* keep going */ }    // never silently lose it
      return C.emptyDb();
    }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { throw E(507, 'storage_failed'); }
  }
  var db = null;
  var store = {
    base: TS.baseData || TS.data,
    get: function () { return db; },
    // Always start from what is stored NOW (another tab, or an earlier step of a slow request, may have saved meanwhile).
    mutate: function (fn) { db = load(); var draft = JSON.parse(JSON.stringify(db)); var r = fn(draft); save(draft); db = draft; return r; }
  };
  var records = C.createRecords(store);

  /* ---------- password hashing (Web Crypto PBKDF2) ---------- */
  function b64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function unb64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function pbkdf2(password, saltB64, iter) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(E(501, 'crypto_unavailable'));
    return crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: iter, hash: 'SHA-256' }, k, 256); })
      .then(b64);
  }
  function newHash(password) {
    var salt = new Uint8Array(16); crypto.getRandomValues(salt);
    var s = b64(salt);
    return pbkdf2(password, s, ITER).then(function (h) { return { salt: s, hash: h, iter: ITER, alg: 'PBKDF2-SHA256' }; });
  }
  function sameText(a, b) { if (a.length !== b.length) return false; var x = 0; for (var i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }
  function verify(password, auth) { return pbkdf2(String(password || '').slice(0, 200), auth.salt, auth.iter).then(function (h) { return sameText(h, auth.hash); }); }

  /* ---------- session + lockout ---------- */
  function now() { return Date.now(); }
  function getSession() {
    var s; try { s = JSON.parse(sessionStorage.getItem(SESS) || 'null'); } catch (e) { s = null; }
    if (!s || !db.auth || s.email !== db.auth.email || s.v !== db.auth.hash.slice(0, 16)) { if (s) endSession(); return null; }
    if (now() - s.seen > IDLE_MS || now() - s.started > MAX_AGE_MS) { endSession(); return null; }
    s.seen = now(); try { sessionStorage.setItem(SESS, JSON.stringify(s)); } catch (e) { /* ignore */ }
    return s;
  }
  // v = start of the current password hash: when the password changes, sessions in other tabs stop matching.
  function startSession(email) { sessionStorage.setItem(SESS, JSON.stringify({ email: email, v: db.auth.hash.slice(0, 16), started: now(), seen: now() })); }
  function endSession() { try { sessionStorage.removeItem(SESS); } catch (e) { /* ignore */ } }
  function lockState() { try { return JSON.parse(localStorage.getItem(LOCK) || 'null') || { times: [], until: 0 }; } catch (e) { return { times: [], until: 0 }; } }
  function lockedFor() { var l = lockState(); return l.until > now() ? l.until - now() : 0; }
  function recordFail() {
    var l = lockState(); l.times = (l.times || []).filter(function (t) { return now() - t < WINDOW_MS; }); l.times.push(now());
    if (l.times.length >= MAX_FAILS) { l.until = now() + LOCK_MS; l.times = []; }
    try { localStorage.setItem(LOCK, JSON.stringify(l)); } catch (e) { /* ignore */ }
  }
  function clearFails() { try { localStorage.removeItem(LOCK); } catch (e) { /* ignore */ } }

  // First visit in this browser: create the labelled local demo account (hash only, like any other password).
  var seeding = null;
  function seedDemo() {
    if (!seeding) seeding = newHash(C.DEMO.password).then(function (h) {
      store.mutate(function (d) {
        if (d.auth && d.auth.demo) return;                                 // another tab was faster
        d.auth = { email: C.DEMO.email, salt: h.salt, hash: h.hash, iter: h.iter, alg: h.alg, demo: true, createdAt: new Date().toISOString() };
        d.log.push({ at: new Date().toISOString(), actor: '-', action: 'demo_account' });
      });
    }).then(function () { seeding = null; }, function (e) { seeding = null; throw e; });
    return seeding;
  }

  /* ---------- request router (same paths and answers as the server) ---------- */
  function ok(body, status) { return { status: status || 200, body: body }; }
  function q(path) { var i = path.indexOf('?'), out = {}; if (i < 0) return out; path.slice(i + 1).split('&').forEach(function (kv) { var p = kv.split('='); out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); return out; }

  function handle(method, path, body, seeded) {
    if (!storageOk()) throw E(503, 'storage_unavailable');
    db = load();                                                     // always fresh (another tab may have changed it)
    body = body || {};
    var route = path.split('?')[0], params = q(path);

    if (!db.auth || !db.auth.demo) {                                 // first visit, or an account from an older version
      if (seeded) throw E(507, 'storage_failed');
      return seedDemo().then(function () { return handle(method, path, body, true); });
    }

    if (route === 'session') {
      var s0 = getSession();
      if (s0) return ok({ loggedIn: true, email: s0.email, csrf: 'local', mode: 'local' });
      return ok({ loggedIn: false, mode: 'local', demo: { email: C.DEMO.email, password: C.DEMO.password } });
    }
    if (route === 'login') {
      if (method !== 'POST') throw E(405, 'method_not_allowed');
      var wait = lockedFor();
      if (wait) throw E(429, 'locked', { retryAfterSec: Math.ceil(wait / 1000) });
      var e2 = String(body.email || '').trim().toLowerCase();
      return verify(body.password, db.auth).then(function (passOk) {
        if (!(passOk && e2 === db.auth.email)) {
          recordFail(); records.note('-', 'login_failed', { reason: 'bad_credentials' });
          var w = lockedFor();
          if (w) throw E(429, 'locked', { retryAfterSec: Math.ceil(w / 1000) });
          throw E(401, 'bad_credentials');
        }
        clearFails(); startSession(db.auth.email); records.note(db.auth.email, 'login');
        return ok({ email: db.auth.email, csrf: 'local' });
      });
    }

    var s = getSession();
    if (!s) throw E(401, 'not_logged_in');
    var actor = s.email;

    if (route === 'logout') { endSession(); records.note(actor, 'logout'); return ok({ ok: true }); }
    if (route === 'password') {
      throw E(403, 'demo_fixed');                                    // the demo password shown on the login page must keep working
    }
    if (route === 'overview') return ok(Object.assign(records.overview(), { email: actor, credentialSource: 'demo' }));
    if (route === 'reference') return ok(records.reference());
    if (route === 'log') return ok({ log: records.logEntries(Number(params.limit) || 200) });
    if (route === 'reset') { if (body.confirm !== 'RESET') throw E(400, 'confirm_required'); return ok({ removed: records.reset(actor) }); }
    if (route === 'backup') return ok(records.exportBackup());
    if (route === 'import') { if (body.confirm !== true) throw E(400, 'confirm_required'); return ok({ imported: records.importBackup(actor, body.backup) }); }
    if (route === 'records') {
      if (method === 'GET') return ok({ records: records.list({ status: params.status || '', type: params.type || '' }) });
      return ok(records.create(actor, body.type, body.data, body.note), 201);
    }
    var m = /^records\/(AR-\d{1,9})(?:\/(approve|reject|archive|restore))?$/.exec(route);
    if (m) {
      if (!m[2]) return method === 'GET' ? ok(records.get(m[1])) : ok(records.update(actor, m[1], body.data, body.note));
      if (m[2] === 'approve') return ok(records.approve(actor, m[1], body.note, body.confirm));
      if (m[2] === 'reject') return ok(records.reject(actor, m[1], body.note));
      if (m[2] === 'archive') return ok(records.archive(actor, m[1], body.note));
      return ok(records.restore(actor, m[1]));
    }
    throw E(404, 'not_found');
  }

  // → Promise<{ status, body }>, like a fetch() to the server
  function request(method, path, body) {
    return Promise.resolve().then(function () { return handle(method, path, body); }).catch(function (e) {
      if (C.isActionError(e)) return { status: e.status, body: Object.assign({ error: e.code }, e.extra) };
      if (window.console) console.warn('[admin-local]', e);
      return { status: 500, body: { error: 'generic' } };
    });
  }

  TS.adminLocal = { request: request, storageOk: storageOk };
})();
