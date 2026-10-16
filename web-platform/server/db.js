/*
 * TerraShield — server/db.js
 * A tiny JSON-file database for ADMIN records (prototype for running on a laptop).
 *
 *  - Base fictional records live in shared/ and are READ-ONLY. They are never copied into the DB.
 *  - The DB only stores admin records + an action log:
 *      { version, createdAt, nextId, records: [ { id, type, status, data, createdAt, updatedAt, ... } ], log: [] }
 *  - Only records with status "reviewed" are merged into the public data used by the engine.
 *  - Writes are atomic (write a temp file, then rename), so a crash never leaves half a file.
 *  - A broken DB file is never overwritten: it is renamed to *.corrupt-<time> first.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadBaseData } = require('./base-data');
const core = require('../web/js/admin-core.js');

// Admin record type → the array it joins in the engine's data object.
const TYPES = { plot: 'plots', khatian: 'khatians', deed: 'deeds', namjari: 'namjari' };
const STATUSES = ['draft', 'reviewed', 'rejected', 'archived'];

function emptyDb() {
  return { version: 1, createdAt: new Date().toISOString(), nextId: 1, records: [], log: [] };
}

function writeAtomic(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function isValidShape(db) {
  return db && db.version === 1 && Array.isArray(db.records) && Array.isArray(db.log) && Number.isInteger(db.nextId);
}

function openDb(file) {
  const base = loadBaseData();          // loaded once; read-only
  let db;

  if (!fs.existsSync(file)) {
    db = emptyDb(); writeAtomic(file, db);
  } else {
    try {
      db = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!isValidShape(db)) throw new Error('unexpected shape');
    } catch (e) {
      const kept = file + '.corrupt-' + Date.now();
      fs.renameSync(file, kept);                         // keep the broken file — never overwrite it
      console.warn('[db] ' + path.basename(file) + ' was unreadable (' + e.message + '); kept as ' + path.basename(kept) + ', starting empty.');
      db = emptyDb(); writeAtomic(file, db);
    }
  }

  // Run a change and save it. fn gets the live db object; if it throws, nothing is saved.
  function mutate(fn) {
    const draft = JSON.parse(JSON.stringify(db));
    const result = fn(draft);
    writeAtomic(file, draft);
    db = draft;
    return result;
  }

  // Data for the website / engine: base + admin records that an admin has REVIEWED.
  function publicData() {
    const m = core.mergePublic(base, db.records);              // same merge as the standalone file
    return { data: m.data, meta: { source: 'server', reviewedAdminRecords: m.count, generatedAt: new Date().toISOString() } };
  }

  // Remove every admin record (base data is untouched). The log keeps a note of the reset.
  function resetToBase(actor) {
    return mutate((d) => {
      const removed = d.records.length;
      d.records = [];
      d.log.push({ at: new Date().toISOString(), actor: actor || 'system', action: 'reset', detail: { removed } });
      return removed;
    });
  }

  return {
    file, base, TYPES, STATUSES,
    get: () => db,                       // read-only use please (callers must use mutate to change)
    mutate, publicData, resetToBase
  };
}

module.exports = { openDb, TYPES, STATUSES, emptyDb };
