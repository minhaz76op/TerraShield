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
  /* PBKDF2-HMAC-SHA-256 in plain JavaScript — same result as Web Crypto. Used only where the browser hides
     crypto.subtle (a page opened over plain http:// from another computer, e.g. http://192.168.x.x). */
  var K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var IV256 = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var Wbuf = new Int32Array(64);
  function compress(st, w16) {                               // st: Int32Array(8) in/out, w16: 16 words
    var W = Wbuf, i, a = st[0], b = st[1], c = st[2], d = st[3], e = st[4], f = st[5], g = st[6], h = st[7], t1, t2, x, y;
    for (i = 0; i < 16; i++) W[i] = w16[i];
    for (i = 16; i < 64; i++) { x = W[i - 15]; y = W[i - 2];
      W[i] = (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) + W[i - 7] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10)) + W[i - 16] | 0; }
    for (i = 0; i < 64; i++) {
      t1 = h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K256[i] + W[i] | 0;
      t2 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & c) ^ (b & c)) | 0;
      h = g; g = f; f = e; e = d + t1 | 0; d = c; c = b; b = a; a = t1 + t2 | 0;
    }
    st[0] = st[0] + a | 0; st[1] = st[1] + b | 0; st[2] = st[2] + c | 0; st[3] = st[3] + d | 0;
    st[4] = st[4] + e | 0; st[5] = st[5] + f | 0; st[6] = st[6] + g | 0; st[7] = st[7] + h | 0;
  }
  function bytesToWords(bytes, totalLenBefore) {             // SHA-256 of (prefix blocks already hashed) + bytes, padded → word blocks
    var len = bytes.length, total = totalLenBefore + len, n = ((len + 9 + 63) >> 6) << 4, w = new Int32Array(n), i;
    for (i = 0; i < len; i++) w[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
    w[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
    w[n - 1] = total * 8; w[n - 2] = Math.floor(total / 0x20000000);
    return w;
  }
  function sha256From(state, bytes, before) { var st = new Int32Array(state), w = bytesToWords(bytes, before); for (var i = 0; i < w.length; i += 16) compress(st, w.subarray(i, i + 16)); return st; }
  function wordsToBytes(st) { var out = new Uint8Array(32); for (var i = 0; i < 32; i++) out[i] = (st[i >> 2] >>> (24 - (i % 4) * 8)) & 255; return out; }
  function pbkdf2js(passBytes, salt, iter) {
    var key = passBytes.length > 64 ? wordsToBytes(sha256From(IV256, passBytes, 0)) : passBytes, i, j;
    var ipad = new Uint8Array(64), opad = new Uint8Array(64);
    for (i = 0; i < 64; i++) { var k = i < key.length ? key[i] : 0; ipad[i] = k ^ 0x36; opad[i] = k ^ 0x5c; }
    var iState = new Int32Array(IV256), oState = new Int32Array(IV256), blk = new Int32Array(16);
    for (i = 0; i < 16; i++) blk[i] = (ipad[i * 4] << 24) | (ipad[i * 4 + 1] << 16) | (ipad[i * 4 + 2] << 8) | ipad[i * 4 + 3]; compress(iState, blk);
    for (i = 0; i < 16; i++) blk[i] = (opad[i * 4] << 24) | (opad[i * 4 + 1] << 16) | (opad[i * 4 + 2] << 8) | opad[i * 4 + 3]; compress(oState, blk);
    var first = new Uint8Array(salt.length + 4); first.set(salt); first[salt.length + 3] = 1;      // block index 1 (32-byte output)
    var u = sha256From(oState, wordsToBytes(sha256From(iState, first, 64)), 64);
    var acc = new Int32Array(u), st = new Int32Array(8), m = new Int32Array(16);
    m[8] = 0x80000000; m[15] = (64 + 32) * 8;                 // padding for a 32-byte message after the 64-byte key block
    for (j = 1; j < iter; j++) {
      for (i = 0; i < 8; i++) m[i] = u[i];
      st.set(iState); compress(st, m); for (i = 0; i < 8; i++) m[i] = st[i];
      st.set(oState); compress(st, m); for (i = 0; i < 8; i++) { u[i] = st[i]; acc[i] ^= st[i]; }
    }
    return wordsToBytes(acc);
  }

  function pbkdf2(password, saltB64, iter) {
    if (!window.crypto || !crypto.subtle) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { try { resolve(b64(pbkdf2js(new TextEncoder().encode(String(password)), unb64(saltB64), iter).buffer)); } catch (e) { reject(E(501, 'crypto_unavailable')); } }, 0);
      });
    }
    return crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: iter, hash: 'SHA-256' }, k, 256); })
      .then(b64);
  }
  function newHash(password) {
    var salt = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(salt);          // available even on plain http://
    else for (var i = 0; i < 16; i++) salt[i] = Math.floor(Math.random() * 256);
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
