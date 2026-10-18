/*
 * TerraShield — admin-core.js  (shared by the local server AND the standalone file)
 * The admin record workflow, independent of where records are stored:
 *   - server (npm start):  store = server/db.js (data/db.json)
 *   - double-clicked file: store = web/js/admin-local.js (this browser's localStorage)
 *
 *   draft ──approve──▶ reviewed (used in website results)
 *     │  └──reject───▶ rejected
 *     └──archive────▶ archived ◀── archive ── reviewed / rejected
 *   edit (draft / reviewed / rejected) → back to draft (an approved record must be re-approved)
 *   restore (archived) → draft
 * Base fictional records are read-only: nothing here can edit or archive them.
 *
 * store = { base, get() → db, mutate(fn) }   db = { version, createdAt, nextId, records[], log[], auth? }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./admin-validate.js'));
  else { root.TS = root.TS || {}; root.TS.adminCore = factory(root.TS.adminValidate); }
})(typeof self !== 'undefined' ? self : this, function (V) {
  'use strict';

  var LOG_LIMIT = 2000, NOTE_MAX = 300, MIN_PASSWORD = 10;
  var TYPES = { plot: 'plots', khatian: 'khatians', deed: 'deeds', namjari: 'namjari' };
  var STATUSES = ['draft', 'reviewed', 'rejected', 'archived'];
  var WEAK = ['password', 'password123', 'admin12345', '1234567890', 'change-me', 'changeme', 'terrashield', 'qwertyuiop'];

  function ActionError(status, code, extra) {
    var e = new Error(code); e.name = 'ActionError'; e.status = status; e.code = code; e.extra = extra || {};
    return e;
  }
  function isActionError(e) { return e && e.name === 'ActionError'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function iso() { return new Date().toISOString(); }

  function emptyDb() { return { version: 1, createdAt: iso(), nextId: 1, records: [], log: [] }; }
  function isValidShape(db) {
    return !!db && db.version === 1 && Array.isArray(db.records) && Array.isArray(db.log) && typeof db.nextId === 'number' && db.nextId % 1 === 0;
  }

  // Base data + admin records with status "reviewed" (marked _src: 'admin') — what the engine uses.
  function mergePublic(base, records) {
    var data = clone(base), n = 0;
    (records || []).forEach(function (r) {
      if (r.status !== 'reviewed' || !TYPES[r.type]) return;
      data[TYPES[r.type]].push(Object.assign({}, r.data, { _src: 'admin', _rid: r.id })); n++;
    });
    return { data: data, count: n };
  }

  // Returns an error code, or null if the password is acceptable (same rules on server and file).
  function passwordProblem(password, email) {
    var p = String(password || '');
    if (p.length < MIN_PASSWORD) return 'password_short';
    if (p.length > 200) return 'password_long';
    if (WEAK.indexOf(p.toLowerCase()) >= 0 || /^(.)\1+$/.test(p)) return 'password_weak';
    if (email && p.toLowerCase() === String(email).toLowerCase()) return 'password_is_email';
    return null;
  }
  function validEmail(e) { return typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function cleanNote(note, required) {
    var n = V.text(note, NOTE_MAX);
    if (required && !n) throw ActionError(400, 'note_required');
    if (n && V.nidLike(n)) throw ActionError(400, 'invalid', { errors: [{ field: 'note', code: 'nid_like' }] });
    return n;
  }

  function createRecords(store) {
    // The only detail fields the change log ever writes — a restored backup keeps exactly these (typed, length-limited).
    function logDetail(x) {
      if (!x || typeof x !== 'object') return null;
      var o = {}, n = 0;
      if (typeof x.note === 'string' && x.note) { o.note = String(x.note).slice(0, NOTE_MAX); n++; }
      if (STATUSES.indexOf(x.from) >= 0) { o.from = x.from; n++; }
      if (typeof x.backToDraft === 'boolean') { o.backToDraft = x.backToDraft; n++; }
      ['removed', 'records'].forEach(function (k) { if (typeof x[k] === 'number' && isFinite(x[k]) && x[k] >= 0) { o[k] = Math.floor(x[k]); n++; } });
      if (typeof x.reason === 'string' && /^[a-z_]{1,40}$/.test(x.reason)) { o.reason = x.reason; n++; }
      return n ? o : null;
    }
    function log(d, actor, action, rec, detail) {
      var e = { at: iso(), actor: actor, action: action };
      if (rec) { e.recordId = rec.id; e.type = rec.type; }
      if (detail) e.detail = detail;
      d.log.push(e);
      if (d.log.length > LOG_LIMIT) d.log.splice(0, d.log.length - LOG_LIMIT);
    }
    function find(d, id) {
      var r = d.records.filter(function (x) { return x.id === id; })[0];
      if (!r) throw ActionError(404, 'record_not_found');
      return r;
    }
    function check(type, data, d, excludeId) {
      var res = V.validateRecord(type, data, V.buildContext(store.base, d.records, excludeId));
      if (!res.ok) throw ActionError(400, 'invalid', { errors: res.errors, warnings: res.warnings });
      return res;
    }
    function history(r, actor, action, note) {
      r.history = r.history || [];
      var h = { at: iso(), actor: actor, action: action, status: r.status };
      if (note) h.note = note;
      r.history.push(h);
    }

    return {
      list: function (filter) {
        filter = filter || {};
        return store.get().records
          .filter(function (r) { return (!filter.status || r.status === filter.status) && (!filter.type || r.type === filter.type); })
          .slice().sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
      },

      get: function (id) {
        var d = store.get(), r = find(d, id), ctx = V.buildContext(store.base, d.records, null);
        var onDag = function (e) { return e.data.mouzaId === r.data.mouzaId && Number(e.data.dag) === Number(r.data.dag); };
        var related = {};
        ['plots', 'khatians', 'deeds', 'namjari'].forEach(function (k) {
          related[k] = ctx[k].filter(onDag).filter(function (e) { return e.id !== r.id; }).map(function (e) { return { src: e.src, id: e.id || null, status: e.status, data: e.data }; });
        });
        return { record: r, related: related, blockers: r.status === 'draft' ? V.approvalBlockers(r, ctx) : [], dependants: V.dependants(r, d.records) };
      },

      create: function (actor, type, data, note) {
        var n = cleanNote(note);
        return store.mutate(function (d) {
          var res = check(type, data, d, null);
          var id = 'AR-' + d.nextId++;
          var clean = Object.assign({}, res.clean);
          if (type === 'deed') clean.id = 'AD-' + id.slice(3);                // stable deed id (namjari can link to it)
          var r = { id: id, type: type, status: 'draft', data: clean, createdAt: iso(), updatedAt: iso(), createdBy: actor, history: [] };
          history(r, actor, 'create', n);
          d.records.push(r);
          log(d, actor, 'create', r, n ? { note: n } : null);
          return { record: r, warnings: res.warnings };
        });
      },

      update: function (actor, id, data, note) {
        var n = cleanNote(note);
        return store.mutate(function (d) {
          var r = find(d, id);
          if (r.status === 'archived') throw ActionError(409, 'archived_readonly');
          var deps = V.dependants(r, d.records);
          if (deps.length && r.type === 'plot') throw ActionError(409, 'has_dependants', { dependants: deps });
          var res = check(r.type, data, d, r.id), clean = Object.assign({}, res.clean);
          if (r.type === 'deed') {
            clean.id = r.data.id;
            if (deps.length && (clean.mouzaId !== r.data.mouzaId || clean.dag !== r.data.dag)) throw ActionError(409, 'has_dependants', { dependants: deps });
          }
          var wasLive = r.status === 'reviewed';
          r.data = clean; r.status = 'draft'; r.updatedAt = iso();
          history(r, actor, 'edit', n);
          log(d, actor, 'edit', r, Object.assign({ backToDraft: wasLive }, n ? { note: n } : {}));
          return { record: r, warnings: res.warnings, backToDraft: wasLive };
        });
      },

      approve: function (actor, id, note, confirmed) {
        if (confirmed !== true) throw ActionError(400, 'confirm_required');
        var n = cleanNote(note);
        return store.mutate(function (d) {
          var r = find(d, id);
          if (r.status !== 'draft') throw ActionError(409, 'not_draft');
          check(r.type, r.data, d, r.id);                                      // still valid now?
          var blockers = V.approvalBlockers(r, V.buildContext(store.base, d.records, null));
          if (blockers.length) throw ActionError(409, 'blocked', { blockers: blockers });
          r.status = 'reviewed'; r.updatedAt = iso(); r.reviewedAt = iso(); r.reviewedBy = actor;
          history(r, actor, 'approve', n);
          log(d, actor, 'approve', r, n ? { note: n } : null);
          return { record: r };
        });
      },

      reject: function (actor, id, note) {
        var n = cleanNote(note, true);
        return store.mutate(function (d) {
          var r = find(d, id);
          if (r.status !== 'draft') throw ActionError(409, 'not_draft');
          r.status = 'rejected'; r.updatedAt = iso(); r.rejectReason = n;
          history(r, actor, 'reject', n);
          log(d, actor, 'reject', r, { note: n });
          return { record: r };
        });
      },

      archive: function (actor, id, note) {
        var n = cleanNote(note);
        return store.mutate(function (d) {
          var r = find(d, id);
          if (r.status === 'archived') throw ActionError(409, 'already_archived');
          var deps = V.dependants(r, d.records);
          if (deps.length) throw ActionError(409, 'has_dependants', { dependants: deps });
          var was = r.status;
          r.status = 'archived'; r.updatedAt = iso();
          history(r, actor, 'archive', n);
          log(d, actor, 'archive', r, Object.assign({ from: was }, n ? { note: n } : {}));
          return { record: r };
        });
      },

      restore: function (actor, id) {
        return store.mutate(function (d) {
          var r = find(d, id);
          if (r.status !== 'archived') throw ActionError(409, 'not_archived');
          check(r.type, r.data, d, r.id);                                      // e.g. someone else took this dag meanwhile
          r.status = 'draft'; r.updatedAt = iso();
          history(r, actor, 'restore');
          log(d, actor, 'restore', r);
          return { record: r };
        });
      },

      overview: function () {
        var d = store.get(), byStatus = { draft: 0, reviewed: 0, rejected: 0, archived: 0 }, byType = { plot: 0, khatian: 0, deed: 0, namjari: 0 };
        d.records.forEach(function (r) { byStatus[r.status] = (byStatus[r.status] || 0) + 1; byType[r.type] = (byType[r.type] || 0) + 1; });
        var b = store.base;
        return { counts: { byStatus: byStatus, byType: byType, total: d.records.length },
          base: { plots: b.plots.length, khatians: b.khatians.length, deeds: b.deeds.length, namjari: b.namjari.length },
          recent: d.log.slice(-8).reverse() };
      },

      // Base data + all admin records, so the panel's forms can check things instantly.
      reference: function () { return { base: store.base, records: store.get().records, surveys: V.SURVEYS, namjariStatus: V.NAMJARI_STATUS, basis: V.BASIS }; },

      logEntries: function (limit) { return store.get().log.slice(-Math.max(1, Math.min(limit || 200, LOG_LIMIT))).reverse(); },

      // Remove every admin record (base data is untouched). The log keeps a note of the reset; login is kept.
      reset: function (actor) {
        return store.mutate(function (d) {
          var removed = d.records.length;
          d.records = [];
          log(d, actor || 'system', 'reset', null, { removed: removed });
          return removed;
        });
      },

      note: function (actor, action, detail) { store.mutate(function (d) { log(d, actor, action, null, detail); }); },

      // Replace all admin records with a backup (login kept; change logs merged). Every record is checked first.
      importBackup: function (actor, backup) {
        if (!backup || backup.app !== 'terrashield-admin-backup' || !isValidShape(backup.db)) throw ActionError(400, 'backup_invalid');
        var incoming = backup.db.records;
        if (incoming.length > 5000) throw ActionError(400, 'backup_invalid');
        var ids = {}, txt = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
        // Rebuild every record from known fields only (nothing else from the file is kept), then check it.
        var cleaned = incoming.map(function (r) {
          if (!r || typeof r !== 'object' || !/^AR-\d{1,9}$/.test(r.id) || ids[r.id] || !TYPES[r.type] || STATUSES.indexOf(r.status) < 0 || !r.data || typeof r.data !== 'object') throw ActionError(400, 'backup_invalid');
          ids[r.id] = true;
          var c = { id: r.id, type: r.type, status: r.status, data: V.sanitize(r.type, r.data), createdAt: txt(r.createdAt, 40), updatedAt: txt(r.updatedAt, 40), createdBy: txt(r.createdBy, 120),
            history: (Array.isArray(r.history) ? r.history.slice(-200) : []).filter(function (h) { return h && typeof h === 'object'; }).map(function (h) {
              var o = { at: txt(h.at, 40), actor: txt(h.actor, 120), action: txt(h.action, 40), status: txt(h.status, 20) }; if (h.note) o.note = txt(h.note, NOTE_MAX); return o; }) };
          if (r.reviewedAt) c.reviewedAt = txt(r.reviewedAt, 40);
          if (r.reviewedBy) c.reviewedBy = txt(r.reviewedBy, 120);
          if (r.rejectReason) c.rejectReason = txt(r.rejectReason, NOTE_MAX);
          if (r.type === 'deed' && !/^AD-\d{1,9}$/.test(c.data.id || '')) throw ActionError(400, 'backup_invalid');
          return c;
        });
        cleaned.forEach(function (c) {
          if (c.status === 'archived' || c.status === 'rejected') return;            // may clash with newer records — never used in results
          var res = V.validateRecord(c.type, c.data, V.buildContext(store.base, cleaned, c.id));
          if (!res.ok) throw ActionError(400, 'backup_invalid', { record: c.id, errors: res.errors });
          var keepId = c.data.id; c.data = Object.assign({}, res.clean); if (c.type === 'deed') { c.data.id = keepId; c.data.office = 'SRO-DEMO'; }
        });
        incoming = cleaned;
        return store.mutate(function (d) {
          d.records = clone(incoming);
          // Never lose history: keep this browser's log AND the backup's log (no duplicates, in time order).
          var seen = {}, merged = d.log.concat(clone(backup.db.log)).map(function (e) {
            if (!e || typeof e !== 'object') return null;
            var o = { at: txt(e.at, 40), actor: txt(e.actor, 120), action: txt(e.action, 40) };
            if (/^AR-\d{1,9}$/.test(e.recordId || '')) { o.recordId = e.recordId; o.type = TYPES[e.type] ? e.type : ''; }
            o.detail = logDetail(e.detail); if (!o.detail) delete o.detail;
            return o; }).filter(function (e) {
            if (!e || !e.at || !e.action) return false;
            // both logs are rebuilt the same way, so an entry present in both is recognised and kept once
            var k = JSON.stringify(e); if (seen[k]) return false; seen[k] = true; return true;
          });
          merged.sort(function (x, y) { return x.at < y.at ? -1 : x.at > y.at ? 1 : 0; });
          d.log = merged.slice(-LOG_LIMIT);
          d.nextId = Math.max(backup.db.nextId, 1 + incoming.reduce(function (m, r) { return Math.max(m, Number(r.id.slice(3))); }, 0));
          log(d, actor, 'import', null, { records: incoming.length });
          return incoming.length;
        });
      },

      exportBackup: function () {
        var d = store.get();
        return { app: 'terrashield-admin-backup', exportedAt: iso(), note: 'Fictional TerraShield admin records. No password is included.',
          db: { version: 1, createdAt: d.createdAt, nextId: d.nextId, records: d.records, log: d.log } };
      }
    };
  }

  return { createRecords: createRecords, mergePublic: mergePublic, ActionError: ActionError, isActionError: isActionError,
    passwordProblem: passwordProblem, validEmail: validEmail, emptyDb: emptyDb, isValidShape: isValidShape,
    TYPES: TYPES, STATUSES: STATUSES, MIN_PASSWORD: MIN_PASSWORD, LOG_LIMIT: LOG_LIMIT,
    LOCAL_KEY: 'terrashield-admin-v1',            // localStorage key used by the standalone file
    // Local DEMO account for the hackathon prototype (fictional data only). It is shown on the login page ONLY while it
    // is the account in use: once someone sets their own password (Settings) or configures one with `npm run setup`,
    // the login page stops showing anything. A real password is never displayed.
    DEMO: Object.freeze({ email: 'demo.admin@terrashield.local', password: 'TerraShield-Demo-2026' }) };          // localStorage key used by the standalone file
});
