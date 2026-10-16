/*
 * TerraShield — server/server.js   (local prototype server; Node 18+, no npm packages)
 *
 *   npm start       → http://127.0.0.1:8080        website   (no .env yet → the labelled local demo admin account)
 *   npm run setup   → optional: your own admin email + password hash in .env (the demo login is then no longer shown)
 *                     http://127.0.0.1:8080/#/admin  Admin Panel
 *
 * Public API
 *   GET  /api/health                     { ok }
 *   GET  /api/data                       base fictional data + admin records with status "reviewed"
 * Admin API (login required; every change also needs the X-CSRF-Token header)
 *   GET  /api/admin/session              POST /api/admin/login · /logout · /password
 *   GET  /api/admin/overview · /reference · /log · /records[?status=&type=] · /records/:id
 *   POST /api/admin/records              PUT /api/admin/records/:id
 *   POST /api/admin/records/:id/approve · /reject · /archive · /restore
 *   POST /api/admin/reset                remove all admin records (base data is never touched)
 *
 * Settings (.env or environment): PORT (8080) · HOST (127.0.0.1) · DB_FILE (data/db.json)
 *   ADMIN_EMAIL · ADMIN_PASSWORD_HASH (preferred, from `npm run setup`) or ADMIN_PASSWORD · ADMIN_DEMO=1 (demo account)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { openDb } = require('./db');
const { ROOT } = require('./base-data');
const { createAuth, resolveCredentials } = require('./auth');
const { createRecords, ActionError, isActionError } = require('./records');
const { DEMO } = require('../web/js/admin-core.js');

const WEB_ROOT = path.join(ROOT, 'web');
const COOKIE = 'ts_admin';
const BODY_LIMIT = 32 * 1024;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8'
};

// Content-Security-Policy: only this site's own files + the one inline theme script in index.html (by hash).
function buildCsp() {
  const html = fs.readFileSync(path.join(WEB_ROOT, 'index.html'), 'utf8');
  const hashes = [];
  html.replace(/<script>([\s\S]*?)<\/script>/g, (m, code) => { hashes.push("'sha256-" + crypto.createHash('sha256').update(code).digest('base64') + "'"); return m; });
  return ["default-src 'self'", "script-src 'self' " + hashes.join(' '), "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:", "font-src 'self' data:", "media-src 'self'", "connect-src 'self'",
    "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');
}

function securityHeaders(res, csp) {
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');   // microphone: optional voice input
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}

function sendJson(res, status, obj, headers) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) }, headers || {}));
  res.end(body);
}
function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

// Static files from web/ only. Anything that resolves outside web/ is refused.
function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return sendText(res, 405, 'Method not allowed'); }
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { return sendText(res, 400, 'Bad request'); }
  if (rel.includes('\0') || rel.includes('\\')) return sendText(res, 400, 'Bad request');
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(WEB_ROOT, '.' + rel);
  if (file !== WEB_ROOT && !file.startsWith(WEB_ROOT + path.sep)) return sendText(res, 404, 'Not found');
  let stat;
  try { stat = fs.statSync(file); } catch (e) { return sendText(res, 404, 'Not found'); }
  if (!stat.isFile()) return sendText(res, 404, 'Not found');                // no directory listings
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((c) => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = c.slice(i + 1).trim(); });
  return out;
}
function sessionCookie(token, maxAgeSec) {
  return COOKIE + '=' + (token || '') + '; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=' + maxAgeSec;
}

// JSON body (only application/json, max 32 KB).
function readJson(req) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return reject(new ActionError(415, 'json_required'));
    let size = 0; const chunks = [];
    // Too large: stop keeping the data (the rest is drained and dropped) and answer 413.
    req.on('data', (c) => { size += c.length; if (size > BODY_LIMIT) reject(new ActionError(413, 'too_large')); else chunks.push(c); });
    req.on('end', () => {
      if (size > BODY_LIMIT) return;
      try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; resolve(v); }
      catch (e) { reject(new ActionError(400, 'bad_json')); }
    });
    req.on('error', () => reject(new ActionError(400, 'bad_request')));
  });
}

// Requests that change something must come from this same site (blocks cross-site form/JS attacks).
function sameOrigin(req) {
  const origin = req.headers.origin, site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return false;
  if (origin && origin !== 'http://' + req.headers.host && origin !== 'https://' + req.headers.host) return false;
  return true;
}

async function handleApi(req, res, pathname, ctx) {
  const { db, auth, records } = ctx;
  const m = req.method;
  const url = new URL(req.url, 'http://localhost');
  const only = (method) => { if (m !== method) throw new ActionError(405, 'method_not_allowed'); };

  if (pathname === '/api/health') { only('GET'); return sendJson(res, 200, { ok: true }); }
  if (pathname === '/api/data') { only('GET'); return sendJson(res, 200, db.publicData()); }
  if (!pathname.startsWith('/api/admin/')) throw new ActionError(404, 'not_found');

  const route = pathname.slice('/api/admin/'.length);
  const token = cookies(req)[COOKIE];
  const changes = m !== 'GET' && m !== 'HEAD';
  if (changes && !sameOrigin(req)) throw new ActionError(403, 'bad_origin');

  if (route === 'login') {
    only('POST');
    const body = await readJson(req);
    const r = auth.login(body.email, body.password, req.socket.remoteAddress);
    if (!r.ok) {
      // Log wrong passwords and the moment a lock starts — not every blocked retry, so a flood cannot push real entries out of the capped log.
      if (r.code !== 'locked' || r.fresh) records.note('-', 'login_failed', { reason: r.code });
      if (r.code === 'locked') return sendJson(res, 429, { error: 'locked', retryAfterSec: Math.ceil(r.retryAfterMs / 1000) }, { 'Retry-After': String(Math.ceil(r.retryAfterMs / 1000)) });
      return sendJson(res, 401, { error: 'bad_credentials' });
    }
    if (token) auth.logout(token);                                   // fresh session id on every login
    records.note(r.email, 'login');
    return sendJson(res, 200, { email: r.email, csrf: r.csrf }, { 'Set-Cookie': sessionCookie(r.token, 8 * 3600) });
  }

  const session = auth.getSession(token);
  if (route === 'session') {
    only('GET');
    // 200 either way, so a logged-out visit does not show up as an error in the browser console
    // The demo account (and only the demo account) is shown on the login page; a configured or changed password never is.
    if (!session) return sendJson(res, 200, auth.source === 'demo' ? { loggedIn: false, demo: { email: DEMO.email, password: DEMO.password } } : { loggedIn: false });
    return sendJson(res, 200, { loggedIn: true, email: session.email, csrf: session.csrf });
  }
  if (!session) throw new ActionError(401, 'not_logged_in');
  if (changes) {
    const sent = String(req.headers['x-csrf-token'] || '');
    if (sent.length !== session.csrf.length || !crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(session.csrf))) throw new ActionError(403, 'bad_csrf');
  }
  const actor = session.email;

  if (route === 'logout') { only('POST'); auth.logout(token); records.note(actor, 'logout'); return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) }); }
  if (route === 'password') {
    only('POST');
    const body = await readJson(req);
    const r = auth.changePassword(token, body.current, body.next);
    if (!r.ok) throw new ActionError(r.code === 'current_wrong' || r.code === 'demo_fixed' ? 403 : 400, r.code);
    records.note(actor, 'password_changed');
    return sendJson(res, 200, { ok: true });
  }
  if (route === 'overview') { only('GET'); return sendJson(res, 200, Object.assign(records.overview(), { email: actor, credentialSource: auth.source })); }
  if (route === 'reference') { only('GET'); return sendJson(res, 200, records.reference()); }
  if (route === 'log') { only('GET'); return sendJson(res, 200, { log: records.logEntries(Number(url.searchParams.get('limit')) || 200) }); }
  if (route === 'reset') {
    only('POST');
    const body = await readJson(req);
    if (body.confirm !== 'RESET') throw new ActionError(400, 'confirm_required');
    return sendJson(res, 200, { removed: records.reset(actor) });
  }
  if (route === 'records') {
    if (m === 'GET') return sendJson(res, 200, { records: records.list({ status: url.searchParams.get('status') || '', type: url.searchParams.get('type') || '' }) });
    only('POST');
    const body = await readJson(req);
    return sendJson(res, 201, records.create(actor, body.type, body.data, body.note));
  }
  const rm = /^records\/(AR-\d{1,9})(?:\/(approve|reject|archive|restore))?$/.exec(route);
  if (rm) {
    const id = rm[1], action = rm[2];
    if (!action) {
      if (m === 'GET') return sendJson(res, 200, records.get(id));
      only('PUT');
      const body = await readJson(req);
      return sendJson(res, 200, records.update(actor, id, body.data, body.note));
    }
    only('POST');
    const body = await readJson(req);
    if (action === 'approve') return sendJson(res, 200, records.approve(actor, id, body.note, body.confirm));
    if (action === 'reject') return sendJson(res, 200, records.reject(actor, id, body.note));
    if (action === 'archive') return sendJson(res, 200, records.archive(actor, id, body.note));
    return sendJson(res, 200, records.restore(actor, id));
  }
  throw new ActionError(404, 'not_found');
}

/*
 * opts: { dbFile, env, credentials, now }
 * Throws if no usable admin credentials are configured (the server must not run without them).
 */
function createServer(opts) {
  opts = opts || {};
  const db = openDb(opts.dbFile || path.join(ROOT, 'data', 'db.json'));
  const credentials = opts.credentials || resolveCredentials(opts.env || process.env, db.get().auth);
  const auth = createAuth({ credentials, now: opts.now, onPasswordChange: (a) => db.mutate((d) => { d.auth = a; }) });
  const records = createRecords(db);
  const csp = buildCsp();
  const ctx = { db, auth, records };

  const server = http.createServer((req, res) => {
    securityHeaders(res, csp);
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; } catch (e) { return sendText(res, 400, 'Bad request'); }
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      handleApi(req, res, pathname, ctx).catch((e) => {
        if (res.headersSent) return;
        if (isActionError(e)) return sendJson(res, e.status, Object.assign({ error: e.code }, e.extra));
        console.error('[server] error:', e);
        sendJson(res, 500, { error: 'server_error' });                        // never leak details to the browser
      });
      return;
    }
    try { serveStatic(req, res, pathname); } catch (e) { console.error('[server] error:', e); if (!res.headersSent) sendText(res, 500, 'Server error'); }
  });
  server.db = db; server.auth = auth; server.records = records;
  return server;
}

// Minimal .env reader (KEY=value lines; # comments). Real environment variables win.
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) return;
    const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  });
}

if (require.main === module) {
  loadEnv(path.join(ROOT, '.env'));
  // Nothing configured (fresh copy, no .env) → use the labelled local demo account so the panel works out of the box.
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD && process.env.ADMIN_DEMO === undefined) process.env.ADMIN_DEMO = '1';
  const port = Number(process.env.PORT) || 8080;
  const host = process.env.HOST || '127.0.0.1';
  const dbFile = process.env.DB_FILE ? path.resolve(ROOT, process.env.DB_FILE) : path.join(ROOT, 'data', 'db.json');
  let server;
  try { server = createServer({ dbFile }); }
  catch (e) { console.error('\nTerraShield server not started:\n  ' + e.message + '\n'); process.exit(1); }
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.error('\nTerraShield server not started: port ' + port + ' is already in use (is TerraShield already running?).\n  Close the other one, or start with another port, e.g.  PORT=8081 npm start\n');
    else console.error('\nTerraShield server not started: ' + e.message + '\n');
    process.exit(1);
  });
  server.listen(port, host, () => {
    const base = 'http://' + (host === '0.0.0.0' ? 'localhost' : host) + ':' + port;
    console.log('TerraShield server running');
    console.log('  Website:      ' + base + '/');
    console.log('  Admin Panel:  ' + base + '/#/admin   (login: ' + server.auth.email + ')');
    if (server.auth.source === 'demo') console.log('  Demo login:   ' + DEMO.email + '  /  ' + DEMO.password + '   (local demo account — shown on the login page; run `npm run setup` for your own password)');
    console.log('  Database:     ' + path.relative(ROOT, dbFile) + '  (admin records only — base fictional data stays read-only)');
    if (server.auth.source === 'env-plain') console.warn('  Note: ADMIN_PASSWORD is plain text in .env — `npm run setup` stores a hash instead.');
    if (host !== '127.0.0.1' && host !== 'localhost') console.warn('  WARNING: HOST=' + host + ' makes the server reachable from other devices. This prototype is meant for this laptop only.');
  });
}

module.exports = { createServer, loadEnv };
