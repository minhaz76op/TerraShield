/*
 * TerraShield — server/setup.js   (run once:  npm run setup)
 * Asks for the admin email and password and writes .env with ADMIN_EMAIL + ADMIN_PASSWORD_HASH.
 * The password itself is never written anywhere. An existing .env is backed up first.
 *
 * Non-interactive (scripts/tests):  node server/setup.js --email you@example.com --password "…" [--env path]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { hashPassword, passwordProblem, validEmail, MIN_PASSWORD } = require('./auth');
const { ROOT } = require('./base-data');

function arg(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; }

function ask(rl, question, hidden) {
  return new Promise((resolve) => {
    if (!hidden) return rl.question(question, (a) => resolve(a.trim()));
    const out = rl.output; let muted = false;
    rl._writeToOutput = function (s) { if (!muted) out.write(s); else if (s.includes('\n') || s.includes('\r')) out.write('\n'); };
    rl.question(question, (a) => { muted = false; rl._writeToOutput = function (s) { out.write(s); }; resolve(a); });
    muted = true;
  });
}

function writeEnv(file, email, hash) {
  let keep = [];
  if (fs.existsSync(file)) {
    const backup = file + '.backup-' + new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(file, backup);
    console.log('Existing .env backed up to ' + path.basename(backup));
    keep = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => !/^\s*(ADMIN_EMAIL|ADMIN_PASSWORD_HASH|ADMIN_PASSWORD)\s*=/.test(l));
  } else {
    keep = ['# TerraShield local server settings (private — never commit or zip this file)', 'PORT=8080', 'HOST=127.0.0.1', 'DB_FILE=data/db.json'];
  }
  while (keep.length && keep[keep.length - 1].trim() === '') keep.pop();
  keep.push('', '# Admin login (made by `npm run setup`). Only the hash is stored.', 'ADMIN_EMAIL=' + email, 'ADMIN_PASSWORD_HASH=' + hash, '');
  fs.writeFileSync(file, keep.join('\n'), { encoding: 'utf8', mode: 0o600 });
}

async function main() {
  const envFile = arg('env') ? path.resolve(arg('env')) : path.join(ROOT, '.env');
  let email = arg('email'), password = arg('password');
  if (!email || !password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    console.log('TerraShield admin setup — the password is stored only as a hash in .env\n');
    email = email || await ask(rl, 'Admin email: ');
    password = await ask(rl, 'Password (min ' + MIN_PASSWORD + ' characters): ', true);
    const again = await ask(rl, 'Repeat password: ', true);
    rl.close();
    if (password !== again) { console.error('Passwords do not match. Nothing was changed.'); process.exit(1); }
  }
  email = String(email).trim().toLowerCase();
  if (!validEmail(email)) { console.error('That is not a valid email. Nothing was changed.'); process.exit(1); }
  const problem = passwordProblem(password, email);
  if (problem) { console.error('Password not accepted (' + problem + '). Use at least ' + MIN_PASSWORD + ' characters and not a common password. Nothing was changed.'); process.exit(1); }
  writeEnv(envFile, email, hashPassword(password));
  console.log('Saved ' + path.relative(process.cwd(), envFile) + '.');
  // A password changed in the Admin Panel is kept in the DB and would win over .env — clear it so the new one applies.
  const dbFile = arg('db') ? path.resolve(arg('db')) : path.join(ROOT, 'data', 'db.json');
  if (fs.existsSync(dbFile)) {
    try {
      const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      if (db && db.auth) {
        const backup = dbFile + '.backup-' + new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync(dbFile, backup);
        delete db.auth;
        fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
        console.log('Cleared the password that was changed in the Admin Panel (DB backed up to ' + path.basename(backup) + ').');
      }
    } catch (e) { console.warn('Could not read ' + dbFile + ' (' + e.message + ') — left unchanged.'); }
  }
  console.log('Now run: npm start');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
