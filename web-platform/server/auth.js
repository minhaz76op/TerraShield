/*
 * TerraShield — server/auth.js  (admin login for the LOCAL prototype)
 *
 *  - Passwords are stored only as scrypt hashes:  scrypt$N$r$p$<salt base64>$<hash base64>
 *  - Sessions live in server memory (a restart logs everyone out). The browser gets a random
 *    token in an HttpOnly, SameSite=Strict cookie limited to /api/admin, plus a separate CSRF
 *    token that must be sent back in the X-CSRF-Token header for every change.
 *  - Sessions end after 30 min without activity or 8 h in total.
 *  - 5 failed logins for the admin email (or 20 from one IP) within 15 min lock login for 15 min.
 */
'use strict';
const crypto = require('crypto');
const core = require('../web/js/admin-core.js');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };
const IDLE_MS = 30 * 60 * 1000;
const MAX_AGE_MS = 8 * 60 * 60 * 1000;
const MAX_FAILS = 5;            // per email
const MAX_FAILS_IP = 20;        // per IP — on a laptop every visitor is 127.0.0.1, so wrong guesses for OTHER emails must not lock the admin out after 5
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 10;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'base64'), expected = Buffer.from(parts[5], 'base64');
  if (!N || !r || !p || !expected.length) return false;
  const got = crypto.scryptSync(String(password), salt, expected.length, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return crypto.timingSafeEqual(got, expected);
}

// Returns an error code, or null if the new password is acceptable.
// Same password and email rules as the standalone file (web/js/admin-core.js).
const passwordProblem = core.passwordProblem;
const validEmail = core.validEmail;

/*
 * Where the admin credentials come from (first match wins):
 *   0. ADMIN_DEMO=1 with no password in .env → the labelled local demo account (fixed; cannot be changed)
 *   1. a password changed in the Admin Panel (stored as a hash in the DB file)
 *   2. ADMIN_PASSWORD_HASH in .env  (made by `npm run setup`)
 *   3. ADMIN_PASSWORD in .env       (plain text — allowed, but setup is better)
 *   (`npm start` turns ADMIN_DEMO on by itself only when no password is configured)
 * Throws a clear error if nothing usable is configured — the server will not start without it.
 */
function resolveCredentials(env, dbAuth) {
  // Demo mode wins over a password saved in the DB by an older version: the login page always shows the demo login.
  if (!env.ADMIN_PASSWORD_HASH && !env.ADMIN_PASSWORD && env.ADMIN_DEMO === '1') {
    return { email: core.DEMO.email, hash: hashPassword(core.DEMO.password), from: 'demo' };
  }
  const email = String((dbAuth && dbAuth.email) || env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!validEmail(email)) throw new Error('ADMIN_EMAIL is missing or not a valid email. Run `npm run setup` (or copy .env.example to .env and fill it in).');
  if (dbAuth && dbAuth.passwordHash) return { email, hash: dbAuth.passwordHash, from: 'admin-panel' };
  if (env.ADMIN_PASSWORD_HASH) {
    if (!/^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(env.ADMIN_PASSWORD_HASH)) throw new Error('ADMIN_PASSWORD_HASH is not in the expected format. Run `npm run setup` to make a new one.');
    return { email, hash: env.ADMIN_PASSWORD_HASH, from: 'env-hash' };
  }
  if (env.ADMIN_PASSWORD) {
    const problem = passwordProblem(env.ADMIN_PASSWORD, email);
    if (problem) throw new Error('ADMIN_PASSWORD is too weak (' + problem + '): use at least ' + MIN_PASSWORD + ' characters and not a common password.');
    return { email, hash: hashPassword(env.ADMIN_PASSWORD), from: 'env-plain' };
  }
  throw new Error('No admin password configured. Run `npm run setup` to create .env with ADMIN_EMAIL and ADMIN_PASSWORD_HASH.');
}

function createAuth(opts) {
  const now = opts.now || Date.now;
  let creds = opts.credentials;                       // { email, hash, from }
  const sessions = new Map();                         // token → { email, csrf, created, seen }
  const fails = new Map();                            // key → { times: [], lockedUntil }

  function failKey(kind, v) { return kind + ':' + v; }
  // Drop expired sessions and old failure counters so memory cannot grow without limit.
  function housekeeping() {
    for (const [t, s] of sessions) if (now() - s.seen > IDLE_MS || now() - s.created > MAX_AGE_MS) sessions.delete(t);
    for (const [k, f] of fails) if (f.lockedUntil <= now() && !f.times.some((x) => now() - x < WINDOW_MS)) fails.delete(k);
    if (fails.size > 5000) fails.clear();
  }
  function lockedFor(keys) {
    let until = 0;
    keys.forEach((k) => { const f = fails.get(k); if (f && f.lockedUntil > now()) until = Math.max(until, f.lockedUntil); });
    return until > now() ? until - now() : 0;
  }
  function recordFail(keys) {
    keys.forEach((k) => {
      const f = fails.get(k) || { times: [], lockedUntil: 0 };
      f.times = f.times.filter((t) => now() - t < WINDOW_MS); f.times.push(now());
      if (f.times.length >= (k.indexOf('ip:') === 0 ? MAX_FAILS_IP : MAX_FAILS)) { f.lockedUntil = now() + LOCK_MS; f.times = []; }
      fails.set(k, f);
    });
  }

  // → { ok:true, token, csrf, email } | { ok:false, code:'bad_credentials' | 'locked', retryAfterMs }
  function login(email, password, ip) {
    const e = String(email || '').trim().toLowerCase();
    housekeeping();
    const keys = [failKey('ip', ip || '?'), failKey('email', e)];
    const wait = lockedFor(keys);
    if (wait) return { ok: false, code: 'locked', retryAfterMs: wait };
    // Always run the slow hash, even for a wrong email, so timing does not reveal which part was wrong.
    const passOk = verifyPassword(String(password || '').slice(0, 200), creds.hash);
    const emailOk = e.length === creds.email.length && crypto.timingSafeEqual(Buffer.from(e), Buffer.from(creds.email));
    if (!(passOk && emailOk)) { recordFail(keys); const w = lockedFor(keys); return w ? { ok: false, code: 'locked', retryAfterMs: w, fresh: true } : { ok: false, code: 'bad_credentials' }; }
    keys.forEach((k) => fails.delete(k));
    const token = crypto.randomBytes(32).toString('base64url'), csrf = crypto.randomBytes(24).toString('base64url');
    sessions.set(token, { email: creds.email, csrf, created: now(), seen: now() });
    return { ok: true, token, csrf, email: creds.email };
  }

  function getSession(token) {
    const s = token && sessions.get(token);
    if (!s) return null;
    if (now() - s.seen > IDLE_MS || now() - s.created > MAX_AGE_MS) { sessions.delete(token); return null; }
    s.seen = now();
    return s;
  }

  function logout(token) { sessions.delete(token); }

  // Change the password: checks the current one, stores the new hash via onSave, ends all OTHER sessions.
  function changePassword(token, current, next) {
    const s = getSession(token);
    if (!s) return { ok: false, code: 'not_logged_in' };
    if (creds.from === 'demo') return { ok: false, code: 'demo_fixed' };   // the demo password shown on the login page must keep working
    if (!verifyPassword(String(current || '').slice(0, 200), creds.hash)) return { ok: false, code: 'current_wrong' };
    const problem = passwordProblem(next, creds.email);
    if (problem) return { ok: false, code: problem };
    if (verifyPassword(next, creds.hash)) return { ok: false, code: 'password_same' };
    const hash = hashPassword(next);
    opts.onPasswordChange({ email: creds.email, passwordHash: hash, updatedAt: new Date(now()).toISOString() });
    creds = { email: creds.email, hash, from: 'admin-panel' };
    for (const [t] of sessions) if (t !== token) sessions.delete(t);
    return { ok: true };
  }

  return { login, getSession, logout, changePassword, get email() { return creds.email; }, get source() { return creds.from; }, _sessions: sessions };
}

module.exports = { hashPassword, verifyPassword, passwordProblem, validEmail, resolveCredentials, createAuth, IDLE_MS, MAX_AGE_MS, MAX_FAILS, MAX_FAILS_IP, LOCK_MS, MIN_PASSWORD };
