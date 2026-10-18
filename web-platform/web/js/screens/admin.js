/*
 * TerraShield — screens/admin.js   Admin Panel (#/admin…), works only when served by `npm start`.
 *
 *   #/admin                  dashboard          #/admin/records[/status]   records list
 *   #/admin/review           drafts to review   #/admin/record/AR-1        one record (approve/reject/archive/restore)
 *   #/admin/new[/type]       add a record       #/admin/edit/AR-1          edit a record
 *   #/admin/log              change log         #/admin/settings           password + reset to fictional data
 *
 * Two modes, same screens:
 *   served (npm start)        → requests go to the local server (/api/admin/…)
 *   double-clicked file       → the same requests are answered in the browser by admin-local.js
 *                               (records in this browser's localStorage; first visit creates the admin account)
 * Everything shown is escaped (esc). The backend checks the login and every value again; this file only gives
 * instant feedback. Records are always FICTIONAL; "approved" ≠ official verification.
 */
(function (U) {
  'use strict';
  var TS = window.TS, V = TS.adminValidate;
  var t = U.t, f = U.f, esc = U.esc, I = U.I, go = U.go, mouzaName = U.mouzaName;
  var A = U.admin = { session: null, checked: false, flash: null, loginMsg: null, counts: null, typeFilter: '', form: null };
  var TYPE_ICON = { plot: 'layers', khatian: 'book', deed: 'doc', namjari: 'refresh' };
  var STATUSES = ['draft', 'reviewed', 'rejected', 'archived'];

  /* ======================= API ======================= */
  function isLocal() { return !(TS.dataSource && TS.dataSource.served); }
  // → Promise<{ status, body }> from the server, or from admin-local.js when the page is a file or on a host
  //   without the TerraShield server. Waits until data-source.js knows which one it is.
  function transport(method, path, body) {
    var ready = (TS.dataSource && TS.dataSource.ready) || Promise.resolve();
    return ready.then(function () { return send(method, path, body); }, function () { return send(method, path, body); });
  }
  function send(method, path, body) {
    if (isLocal()) return TS.adminLocal.request(method, path, body);
    var h = {};
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (A.session && method !== 'GET') h['X-CSRF-Token'] = A.session.csrf;
    return fetch('/api/admin/' + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); },
        function () { var e = new Error('network'); e.code = 'network'; throw e; });
  }
  function api(method, path, body) {
    return transport(method, path, body).then(function (r) {
      var j = r.body || {};
      if (r.status >= 200 && r.status < 300) return j;
      var e = new Error(j.error || 'generic'); e.status = r.status; e.code = j.error || 'generic'; e.body = j;
      if (r.status === 401 && path !== 'login' && path !== 'session') {        // session ended → back to login
        A.session = null; A.loginMsg = 'expired'; e.handled = true;
        if (location.hash.indexOf('#/admin') === 0) U.render();
      }
      throw e;
    });
  }
  function ensureSession() {
    if (A.checked) return Promise.resolve(A.session);
    return api('GET', 'session').then(function (s) { A.session = s && s.loggedIn ? { email: s.email, csrf: s.csrf } : null; A.demo = s && s.demo || null; A.checked = true; return A.session; }, function (e) {
      if (e.status === 401) { A.session = null; A.checked = true; return null; }
      throw e;
    });
  }
  function liveRefresh() { if (TS.dataSource && TS.dataSource.refresh) TS.dataSource.refresh(); }
  function errText(e) { var AT = t().admin; return e && e.code === 'network' ? AT.serverDown : (AT.err[e && e.code] || AT.settings.pwErr[e && e.code] || AT.err.generic); }

  /* ======================= Helpers ======================= */
  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso); if (isNaN(d)) return '';
    var day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return f.dateLong(day) + ', ' + f.timeOfDay(d);
  }
  function badge(status) { return '<span class="ad-status s-' + esc(status) + '">' + esc(t().admin.status[status] || status) + '</span>'; }
  function typeTag(type) { return '<span class="ad-type">' + I[TYPE_ICON[type]] + esc(t().admin.types[type] || type) + '</span>'; }
  function personName(id) { return f.person(id); }
  function place(d) { return mouzaName(d.mouzaId) + ' · ' + t().rDag + ' ' + f.num(d.dag); }
  function summary(r) {
    var T = t(), d = r.data || {};
    if (r.type === 'plot') return place(d) + ' · ' + f.num(d.totalArea) + ' ' + T.unit;
    if (r.type === 'khatian') return T.adminKinds.khatian + ' ' + f.num(d.khatianNo) + ' · ' + place(d) + ' · ' + (d.owners || []).map(function (o) { return personName(o.personId) + ' ' + f.num(o.share); }).join(', ');
    if (r.type === 'deed') return T.adminKinds.deed + ' ' + d.deedNo + ' · ' + place(d) + ' · ' + personName(d.sellerId) + ' → ' + personName(d.buyerId) + ' · ' + f.num(d.area) + ' ' + T.unit;
    if (r.type === 'namjari') return T.adminKinds.namjari + ' ' + d.caseNo + ' · ' + place(d) + ' · ' + personName(d.applicantId) + ' · ' + (T.admin.form.njOpts[d.status] || d.status);
    return '';
  }
  function notice(kind, html, role) { return '<div class="notice ad-notice ' + kind + '"' + (role ? ' role="' + role + '"' : '') + '>' + (kind === 'ok' ? I.checkCircle : kind === 'bad' ? I.alertCircle : I.info) + '<span>' + html + '</span></div>'; }
  function root() { return document.getElementById('admin-root'); }
  function paint(html) { var r = root(); if (r) r.innerHTML = html; }
  function paintMain(html) { var m = document.getElementById('admin-main'); if (m) { m.innerHTML = html; m.removeAttribute('aria-busy'); } }

  /* ======================= Entry ======================= */
  function adminScreen(sub, id) {
    var AT = t().admin;
    return { nav: true, html: '<div class="page admin-page"><div id="admin-root" class="admin-root"><h1 class="sr-only">' + esc(AT.title) + '</h1><p class="muted" aria-busy="true">' + esc(AT.loading) + '</p></div></div>',
      after: function () { bind(); boot(sub, id); } };
  }

  function boot(sub, id) {
    ensureSession().then(function (s) {
      if (!s) { paint(loginView()); var e = document.getElementById('ad-email'); if (e) e.focus(); return; }
      paint(shell(sub));
      var h = document.querySelector('#admin-root h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      return route(sub, id);
    }).catch(function (e) {
      if (e && e.handled) return;
      paint('<div class="card ad-login"><h1 class="page-title">' + esc(t().admin.title) + '</h1>' + notice('bad', esc(errText(e)), 'alert') +
        '<p style="margin-top:14px"><button class="btn btn-secondary" data-aa="retry">' + I.refresh + esc(t().admin.retry) + '</button></p></div>');
    });
  }

  function route(sub, id) {
    var done = function (p) { return p.catch(function (e) { if (!e.handled) paintMain(notice('bad', esc(errText(e)), 'alert')); }); };
    if (!sub) return done(dashboard());
    if (sub === 'records') return done(recordsView(STATUSES.indexOf(id) >= 0 ? id : '', false));
    if (sub === 'review') return done(recordsView('draft', true));
    if (sub === 'record') return done(detailView(id));
    if (sub === 'new') return done(formView(null, V.TYPES.indexOf(id) >= 0 ? id : null));
    if (sub === 'edit') return done(api('GET', 'records/' + encodeURIComponent(id)).then(function (j) { return formView(j.record); }));
    if (sub === 'log') return done(logView());
    if (sub === 'settings') return done(settingsView());
    go('#/admin');
  }

  /* ======================= Login ======================= */
  // The labelled local demo account — shown only when the server/file says it is the account in use.
  function demoCard() {
    var D = t().admin.demo, d = A.demo;
    if (!d) return '';
    var row = function (key, label, value, copyLabel) {
      return '<div class="ad-demo-row"><span class="ad-demo-label" id="ad-demo-' + key + '-l">' + esc(label) + '</span>' +
        '<span class="ad-demo-val"><code id="ad-demo-' + key + '" aria-labelledby="ad-demo-' + key + '-l ad-demo-' + key + '" translate="no">' + esc(value) + '</code>' +
        '<button type="button" class="btn btn-light btn-sm ad-copy" data-aa="copy" data-copy="' + key + '" aria-label="' + esc(copyLabel) + '">' + I.copy + '<span>' + esc(D.copy) + '</span></button></span></div>';
    };
    return '<section class="ad-demo" aria-labelledby="ad-demo-title"><p class="ad-demo-head"><b id="ad-demo-title">' + esc(D.title) + '</b> <span class="ad-demo-tag">' + esc(D.tag) + '</span></p>' +
      '<p class="ad-demo-intro">' + esc(D.intro) + '</p>' +
      row('email', D.email, d.email, D.copyEmail) + row('password', D.password, d.password, D.copyPassword) +
      '<p class="ad-demo-status small" id="ad-demo-status" role="status" aria-live="polite"></p></section>';
  }
  function copyDemo(btn) {
    var D = t().admin.demo, key = btn.getAttribute('data-copy'), code = document.getElementById('ad-demo-' + key), status = document.getElementById('ad-demo-status');
    if (!code || !A.demo) return;
    var text = key === 'email' ? A.demo.email : A.demo.password;
    var done = function (good) {
      if (status) status.textContent = good ? (key === 'email' ? D.copiedEmail : D.copiedPassword) : D.copyFail;
      var span = btn.querySelector('span'); if (good && span) { span.textContent = D.copied; setTimeout(function () { span.textContent = D.copy; }, 1800); }
      if (!good) { var sel = window.getSelection(), range = document.createRange(); range.selectNodeContents(code); sel.removeAllRanges(); sel.addRange(range); }
    };
    var fallback = function () {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); var good = false; try { good = document.execCommand('copy'); } catch (e) { good = false; }
      document.body.removeChild(ta); btn.focus(); done(good);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  }

  function loginView() {
    var AT = t().admin, L = AT.login, msg = A.loginMsg; A.loginMsg = null;
    // Demo details sit BESIDE the form on wider screens (above it on phones); in the HTML they come first so a
    // screen reader hears the instruction before the fields.
    return '<div class="card ad-login' + (A.demo ? ' has-demo' : '') + '"><span class="icon-tile solid">' + I.shield + '</span>' +
      '<h1 class="page-title" style="margin-top:12px">' + esc(L.title) + '</h1>' +
      (msg ? notice('info', esc(L[msg] || ''), 'status') : '') +
      '<div class="ad-login-grid">' + demoCard() + '<div class="ad-login-main">' +
      '<form id="ad-login-form" class="ad-form" novalidate>' +
        '<div class="field"><label for="ad-email">' + esc(L.email) + '</label><input id="ad-email" name="email" type="email" class="input" autocomplete="username" required maxlength="120" spellcheck="false"></div>' +
        '<div class="field"><label for="ad-pass">' + esc(L.password) + '</label><div class="ad-pass-row"><input id="ad-pass" name="password" type="password" class="input" autocomplete="current-password" required maxlength="200">' +
          '<button type="button" class="btn btn-light btn-sm" data-aa="togglepw" aria-controls="ad-pass" aria-pressed="false">' + esc(L.show) + '</button></div></div>' +
        '<div id="ad-login-err" aria-live="assertive"></div>' +
        '<button type="submit" class="btn btn-primary btn-block" style="margin-top:16px">' + I.shield + '<span>' + esc(L.submit) + '</span></button>' +
      '</form>' +
      '<p style="margin-top:12px"><a href="#/">' + esc(AT.backSite) + '</a></p></div></div></div>';
  }
  function doLogin(form) {
    var L = t().admin.login, email = form.email.value.trim(), pass = form.password.value, out = document.getElementById('ad-login-err'), btn = form.querySelector('[type=submit]');
    if (!email || !pass) { out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(L.required) + '</span></p>'; return; }
    btn.disabled = true; btn.querySelector('span').textContent = L.busy;
    api('POST', 'login', { email: email, password: pass }).then(function (j) {
      A.session = { email: j.email, csrf: j.csrf }; A.checked = true; form.password.value = '';
      U.render();
    }).catch(function (e) {
      btn.disabled = false; btn.querySelector('span').textContent = L.submit; form.password.value = ''; form.password.focus();
      var m = e.code === 'locked' ? L.locked(Math.max(1, Math.ceil(((e.body && e.body.retryAfterSec) || 60) / 60)), f) : e.code === 'bad_credentials' ? L.bad : errText(e);
      out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(m) + '</span></p>';
    });
  }

  /* ======================= Shell ======================= */
  function shell(sub) {
    var AT = t().admin, cur = sub === 'record' || sub === 'edit' ? 'records' : (sub || 'dashboard');
    var tab = function (key, href, icon) {
      var n = key === 'review' && A.counts ? A.counts.draft : 0;
      return '<a href="' + href + '"' + (cur === key ? ' aria-current="page"' : '') + '>' + I[icon] + '<span>' + esc(AT.nav[key]) + '</span>' + (n ? '<b class="ad-count">' + esc(f.num(n)) + '</b>' : '') + '</a>';
    };
    var flash = A.flash; A.flash = null;
    return '<header class="ad-head"><div><p class="eyebrow">' + I.shield + esc(isLocal() ? AT.tagLocal : AT.tag) + '</p><h1 class="page-title">' + esc(AT.title) + '</h1></div>' +
      '<div class="ad-user"><span class="muted small">' + esc(AT.signedIn) + '</span> <b>' + esc(A.session.email) + '</b>' +
        '<span class="ad-user-btns"><a class="btn btn-light btn-sm" href="#/">' + I.home + esc(AT.viewSite) + '</a><button class="btn btn-light btn-sm" data-aa="logout">' + I.x + esc(AT.logout) + '</button></span></div></header>' +
      '<nav class="ad-tabs" aria-label="' + esc(AT.navLabel) + '">' + tab('dashboard', '#/admin', 'grid') + tab('records', '#/admin/records', 'layers') + tab('review', '#/admin/review', 'checkCircle') +
        tab('new', '#/admin/new', 'plus') + tab('log', '#/admin/log', 'clock') + tab('settings', '#/admin/settings', 'edit') + '</nav>' +
      '<div id="ad-flash" role="status" aria-live="polite">' + (flash ? notice(flash.kind || 'ok', esc(flash.text)) : '') + '</div>' +
      '<div id="admin-main" class="ad-main" aria-busy="true"><p class="muted">' + esc(AT.loading) + '</p></div>';
  }
  function setCounts(byStatus) {
    A.counts = byStatus;
    var tabEl = document.querySelector('.ad-tabs a[href="#/admin/review"]');
    if (tabEl) { var b = tabEl.querySelector('.ad-count'); if (b) b.remove(); if (byStatus.draft) tabEl.insertAdjacentHTML('beforeend', '<b class="ad-count">' + esc(f.num(byStatus.draft)) + '</b>'); }
  }

  /* ======================= Dashboard ======================= */
  function dashboard() {
    var AT = t().admin, D = AT.dash;
    return Promise.all([api('GET', 'overview'), api('GET', 'records?status=draft')]).then(function (res) {
      var ov = res[0], drafts = res[1].records, c = ov.counts.byStatus, baseTotal = ov.base.plots + ov.base.khatians + ov.base.deeds + ov.base.namjari;
      setCounts(c);
      var tile = function (s, icon) { return '<a class="ad-tile s-' + s + '" href="#/admin/records/' + s + '"><span class="n">' + esc(f.num(c[s] || 0)) + '</span><span class="l">' + I[icon] + esc(AT.status[s]) + '</span><span class="h">' + esc(AT.statusHint[s]) + '</span></a>'; };
      paintMain('<h2 class="ad-h2">' + esc(D.title) + '</h2>' +
        '<div class="ad-tiles">' + tile('draft', 'clock') + tile('reviewed', 'checkCircle') + tile('rejected', 'xCircle') + tile('archived', 'layers') + '</div>' +
        '<div class="ad-live">' + I.info + '<span>' + esc(D.live(c.reviewed || 0, f)) + ' ' + esc(D.base(baseTotal, f)) + '</span>' +
          '<a class="btn btn-secondary btn-sm" href="#/step/1">' + I.search + esc(D.checkSite) + '</a></div>' +
        '<div class="ad-cols"><section class="card ad-card"><h3>' + I.clock + esc(D.waiting) + '</h3>' +
          (drafts.length ? '<ul class="ad-list">' + drafts.slice(0, 6).map(function (r) { return recItem(r, true); }).join('') + '</ul>' : '<p class="muted">' + esc(D.none) + '</p>') +
          '<p style="margin-top:12px"><a class="btn btn-primary btn-sm" href="#/admin/new">' + I.plus + esc(D.addNew) + '</a></p></section>' +
        '<section class="card ad-card"><h3>' + I.refresh + esc(D.recent) + '</h3>' + logList(ov.recent) + '</section></div>');
    });
  }

  /* ======================= Records list ======================= */
  function recItem(r, reviewBtn) {
    var AT = t().admin;
    return '<li class="ad-rec"><div class="ad-rec-main">' + typeTag(r.type) + ' ' + badge(r.status) +
      '<p class="ad-sum">' + esc(summary(r)) + '</p><p class="muted xs">' + esc(r.id) + ' · ' + esc(AT.records.updated) + ' ' + esc(when(r.updatedAt)) + '</p></div>' +
      '<div class="ad-rec-actions"><a class="btn btn-sm ' + (reviewBtn ? 'btn-primary' : 'btn-secondary') + '" href="#/admin/record/' + esc(r.id) + '" aria-label="' + esc((reviewBtn ? AT.dash.reviewNow : AT.records.open) + ' ' + r.id) + '">' +
        (reviewBtn ? I.checkCircle + esc(AT.dash.reviewNow) : esc(AT.records.open)) + '</a>' +
      (r.status !== 'archived' && !reviewBtn ? '<a class="btn btn-sm btn-light" href="#/admin/edit/' + esc(r.id) + '" aria-label="' + esc(AT.records.edit + ' ' + r.id) + '">' + I.edit + esc(AT.records.edit) + '</a>' : '') + '</div></li>';
  }
  function recordsView(status, reviewMode) {
    var AT = t().admin, R = AT.records;
    return Promise.all([api('GET', 'records' + (status ? '?status=' + status : '')), api('GET', 'overview')]).then(function (res) {
      setCounts(res[1].counts.byStatus);
      var list = res[0].records.filter(function (r) { return !A.typeFilter || r.type === A.typeFilter; });
      var chip = function (s) { var href = '#/admin/records' + (s ? '/' + s : ''); return '<a class="chip ad-chip" href="' + href + '"' + (s === status ? ' aria-current="true"' : '') + '>' + esc(s ? AT.status[s] : R.all) + '</a>'; };
      paintMain('<h2 class="ad-h2">' + esc(reviewMode ? AT.review.title : R.title) + '</h2>' + (reviewMode ? '<p class="muted">' + esc(AT.review.lead) + '</p>' : '') +
        '<div class="ad-filters">' + (reviewMode ? '' : '<div class="ad-chips" role="group" aria-label="' + esc(R.statusFilter) + '">' + chip('') + STATUSES.map(chip).join('') + '</div>') +
          '<label class="ad-typesel"><span>' + esc(R.typeFilter) + '</span><select id="ad-type-filter" class="input select"><option value="">' + esc(R.allTypes) + '</option>' +
          V.TYPES.map(function (ty) { return '<option value="' + ty + '"' + (A.typeFilter === ty ? ' selected' : '') + '>' + esc(AT.types[ty]) + '</option>'; }).join('') + '</select></label></div>' +
        (list.length ? '<ul class="ad-list">' + list.map(function (r) { return recItem(r, reviewMode); }).join('') + '</ul>' : '<p class="muted ad-empty">' + esc(reviewMode ? AT.dash.none : R.empty) + '</p>'));
    });
  }

  /* ======================= Record detail ======================= */
  var FIELD_LABELS = function (F) {
    return { mouzaId: F.mouza, dag: F.dag, totalArea: F.totalArea, khatianNo: F.khatianNo, survey: F.survey, recordDate: F.recordDate, deedNo: F.deedNo, date: F.date,
      sellerId: F.seller, buyerId: F.buyer, area: F.area, caseNo: F.caseNo, applicantId: F.applicant, basis: F.basis, deedId: F.deed, status: F.njStatus, owners: F.owners, id: 'ID' };
  };
  function fieldValue(k, v, F) {
    if (k === 'mouzaId') return mouzaName(v) + ' (' + v + ')';
    if (/Id$/.test(k) && k !== 'deedId') return personName(v) + ' (' + v + ')';
    if (k === 'owners') return (v || []).map(function (o) { return personName(o.personId) + ' — ' + f.num(o.share) + ' ' + t().unit; }).join('; ');
    if (k === 'basis') return F.basisOpts[v] || v;
    if (k === 'status') return F.njOpts[v] || v;
    if (k === 'date' || k === 'recordDate') return f.dateLong(v);
    if (k === 'totalArea' || k === 'area') return f.num(v) + ' ' + t().unit;
    if (k === 'office') return v;
    return v === null || v === undefined ? '—' : String(k === 'dag' ? f.num(v) : v);
  }
  function detailView(id) {
    var AT = t().admin, D = AT.detail, F = AT.form;
    return api('GET', 'records/' + encodeURIComponent(id)).then(function (j) {
      var r = j.record, labels = FIELD_LABELS(F);
      var fields = Object.keys(r.data).filter(function (k) { return k !== 'office'; }).map(function (k) { return '<dt>' + esc(labels[k] || k) + '</dt><dd>' + esc(fieldValue(k, r.data[k], F)) + '</dd>'; }).join('');
      var rel = [];
      ['plots', 'khatians', 'deeds', 'namjari'].forEach(function (k) {
        var type = { plots: 'plot', khatians: 'khatian', deeds: 'deed', namjari: 'namjari' }[k];
        j.related[k].forEach(function (e) { rel.push('<li>' + typeTag(type) + ' <span class="chip ' + (e.src === 'base' ? 'ad-src-base' : 'ad-src-admin') + '">' + esc(e.src === 'base' ? D.base : D.admin + ' · ' + AT.status[e.status]) + '</span><p class="ad-sum">' + esc(summary({ type: type, data: e.data })) + '</p></li>'); });
      });
      var hist = (r.history || []).slice().reverse().map(function (h) {
        return '<li><b>' + esc(AT.log.actions[h.action] || h.action) + '</b> · ' + badge(h.status) + '<span class="muted xs">' + esc(when(h.at)) + ' · ' + esc(h.actor) + '</span>' + (h.note ? '<p class="ad-note">' + esc(h.note) + '</p>' : '') + '</li>';
      }).join('');

      var acts = '';
      if (r.status === 'draft') {
        acts += (j.blockers.length ? notice('bad', esc(j.blockers.map(function (b) { return D.blockers[b] || b; }).join(' '))) : '') +
          '<form class="ad-act" data-aform="approve" novalidate><h3>' + I.checkCircle + esc(D.approveTitle) + '</h3>' +
            '<label class="ad-confirm"><input type="checkbox" name="confirm" required><span>' + esc(D.confirm) + '</span></label>' +
            '<div class="field"><label for="ad-approve-note">' + esc(D.note) + '</label><input id="ad-approve-note" name="note" class="input" maxlength="300"></div>' +
            '<div class="ad-act-err" aria-live="assertive"></div><button class="btn btn-primary" type="submit"' + (j.blockers.length ? ' disabled' : '') + '>' + I.checkCircle + esc(D.approve) + '</button></form>' +
          '<form class="ad-act" data-aform="reject" novalidate><h3>' + I.xCircle + esc(D.rejectTitle) + '</h3>' +
            '<div class="field"><label for="ad-reject-note">' + esc(D.reason) + '</label><textarea id="ad-reject-note" name="note" class="input" rows="2" maxlength="300" required></textarea></div>' +
            '<div class="ad-act-err" aria-live="assertive"></div><button class="btn btn-danger-outline" type="submit">' + I.xCircle + esc(D.reject) + '</button></form>';
      }
      if (r.status === 'reviewed') acts += notice('ok', esc(D.liveNow));
      if (r.status === 'rejected' && r.rejectReason) acts += notice('bad', '<b>' + esc(D.rejectReason) + ':</b> ' + esc(r.rejectReason));
      if (r.status !== 'archived') {
        acts += '<div class="ad-act"><a class="btn btn-secondary" href="#/admin/edit/' + esc(r.id) + '">' + I.edit + esc(D.edit) + '</a>' + (r.status === 'reviewed' ? '<p class="muted small" style="margin-top:6px">' + esc(D.editWarn) + '</p>' : '') + '</div>' +
          '<form class="ad-act" data-aform="archive" novalidate><h3>' + I.layers + esc(D.archiveTitle) + '</h3><p class="muted small">' + esc(D.archiveText) + '</p>' +
            (j.dependants.length ? notice('bad', esc(D.deps(j.dependants.join(', ')))) : '') +
            '<div class="field"><label for="ad-archive-note">' + esc(D.note) + '</label><input id="ad-archive-note" name="note" class="input" maxlength="300"></div>' +
            '<div class="ad-act-err" aria-live="assertive"></div><button class="btn btn-light" type="submit"' + (j.dependants.length ? ' disabled' : '') + '>' + I.layers + esc(D.archive) + '</button></form>';
      } else {
        acts += '<div class="ad-act"><div class="ad-act-err" aria-live="assertive"></div><button class="btn btn-secondary" data-aa="restore">' + I.refresh + esc(D.restore) + '</button></div>';
      }

      paintMain('<p><a href="#/admin/records">‹ ' + esc(D.back) + '</a></p>' +
        '<h2 class="ad-h2">' + typeTag(r.type) + ' <span>' + esc(r.id) + '</span> ' + badge(r.status) + '</h2><p class="muted small">' + esc(AT.statusHint[r.status]) + '</p>' +
        '<div class="ad-detail" data-id="' + esc(r.id) + '"><div>' +
          '<section class="card ad-card"><h3>' + esc(D.fields) + '</h3><p class="ad-sum">' + esc(summary(r)) + '</p><dl class="ad-dl">' + fields + '</dl>' +
            '<p class="muted xs" style="margin-top:8px">' + esc(D.created) + ': ' + esc(when(r.createdAt)) + ' · ' + esc(r.createdBy || '') + (r.reviewedBy ? ' · ' + esc(D.reviewedBy) + ': ' + esc(r.reviewedBy) : '') + '</p></section>' +
          '<section class="card ad-card"><h3>' + esc(D.related) + '</h3>' + (rel.length ? '<ul class="ad-related">' + rel.join('') + '</ul>' : '<p class="muted">' + esc(D.relatedNone) + '</p>') + '</section>' +
          '<section class="card ad-card"><h3>' + esc(D.history) + '</h3><ul class="ad-history">' + hist + '</ul></section>' +
        '</div><aside class="card ad-card ad-actions">' + acts + '</aside></div>');
    });
  }
  function recordAction(kind, form) {
    var AT = t().admin, id = document.querySelector('.ad-detail').getAttribute('data-id'), out = form.querySelector('.ad-act-err'), body = {};
    var fail = function (code) { out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(AT.err[code] || AT.detail.blockers[code] || errText({ code: code })) + '</span></p>'; };
    if (kind === 'approve') { if (!form.confirm.checked) { fail('confirm_required'); form.confirm.focus(); return; } body = { confirm: true, note: form.note.value }; }
    if (kind === 'reject') { if (!form.note.value.trim()) { fail('note_required'); form.note.focus(); return; } body = { note: form.note.value }; }
    if (kind === 'archive') body = { note: form.note.value };
    var btn = form.querySelector('button[type=submit], [data-aa]'); if (btn) btn.disabled = true;
    api('POST', 'records/' + encodeURIComponent(id) + '/' + kind, body).then(function () {
      A.flash = { kind: 'ok', text: AT.flash[{ approve: 'approved', reject: 'rejected', archive: 'archived', restore: 'restored' }[kind]] };
      liveRefresh(); U.render();
    }).catch(function (e) {
      if (btn) btn.disabled = false;
      if (e.handled) return;
      if (e.code === 'blocked') return fail((e.body.blockers || [])[0]);
      if (e.code === 'has_dependants') { out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(AT.detail.deps((e.body.dependants || []).join(', '))) + '</span></p>'; return; }
      if (e.code === 'invalid') return fail((e.body.errors && e.body.errors[0] && e.body.errors[0].code) || 'generic');
      fail(e.code);
    });
  }

  /* ======================= Add / edit form ======================= */
  var LAYOUT = {
    plot: ['mouzaId', 'dag', 'totalArea'],
    khatian: ['mouzaId', 'dag', 'khatianNo', 'survey', 'recordDate', 'owners'],
    deed: ['mouzaId', 'dag', 'deedNo', 'date', 'sellerId', 'buyerId', 'area'],
    namjari: ['mouzaId', 'dag', 'caseNo', 'applicantId', 'basis', 'deedId', 'status', 'date']
  };
  function peopleOptions(sel) {
    var F = t().admin.form;
    return '<option value="">' + esc(F.choose) + '</option>' + TS.baseData.people.map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name[U.state.lang] + ' (' + p.id + ')') + '</option>';
    }).join('');
  }
  function opts(list, sel, labels) {
    var F = t().admin.form;
    return '<option value="">' + esc(F.choose) + '</option>' + list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(labels ? labels[v] || v : v) + '</option>'; }).join('');
  }
  function deedOptions(st) {
    var F = t().admin.form, d = st.data, ctx = st.ctx, dag = Number(V.text(d.dag));
    var list = ctx.deeds.filter(function (e) { return e.data.mouzaId === d.mouzaId && Number(e.data.dag) === dag; });
    return '<option value="">' + esc(F.choose) + '</option>' + list.map(function (e) {
      var id = e.data.id; return '<option value="' + esc(id) + '"' + (id === d.deedId ? ' selected' : '') + '>' + esc(e.data.deedNo + ' · ' + personName(e.data.sellerId) + ' → ' + personName(e.data.buyerId) + (e.src === 'admin' ? ' (' + t().admin.detail.admin + ')' : '')) + '</option>';
    }).join('');
  }
  function fieldHtml(name, st) {
    var F = t().admin.form, d = st.data, idf = 'af-' + name;
    var wrap = function (label, control, help) {
      return '<div class="field ad-field" data-field="' + name + '"><label for="' + idf + '">' + esc(label) + '</label>' + control + (help ? '<p class="help-text" id="' + idf + '-help">' + esc(help) + '</p>' : '') + '<div class="ad-ferr" id="err-' + idf + '"></div></div>';
    };
    var text = function (label, attrs, help) { return wrap(label, '<input id="' + idf + '" name="' + name + '" class="input" value="' + esc(d[name] === undefined || d[name] === null ? '' : d[name]) + '" ' + (attrs || '') + (help ? ' aria-describedby="' + idf + '-help"' : '') + '>', help); };
    switch (name) {
      case 'mouzaId': return wrap(F.mouza, '<select id="' + idf + '" name="mouzaId" class="input select">' + '<option value="">' + esc(F.choose) + '</option>' + TS.baseData.mouzas.map(function (m) { return '<option value="' + esc(m.id) + '"' + (m.id === d.mouzaId ? ' selected' : '') + '>' + esc(m.name[U.state.lang] + ' (JL ' + m.jl + ')') + '</option>'; }).join('') + '</select>');
      case 'dag': return text(F.dag, 'inputmode="numeric" autocomplete="off" maxlength="6"');
      case 'totalArea': return text(F.totalArea, 'inputmode="decimal" autocomplete="off" maxlength="10"');
      case 'area': return text(F.area, 'inputmode="decimal" autocomplete="off" maxlength="10"');
      case 'khatianNo': return text(F.khatianNo, 'autocomplete="off" maxlength="20"');
      case 'deedNo': return text(F.deedNo, 'autocomplete="off" maxlength="20" placeholder="0123/2024"', F.deedNoHelp);
      case 'caseNo': return text(F.caseNo, 'autocomplete="off" maxlength="20" placeholder="N-900"', F.caseHelp);
      case 'date': case 'recordDate': return wrap(F[name], '<input id="' + idf + '" name="' + name + '" type="date" class="input" max="' + V.today() + '" value="' + esc(d[name] || '') + '">');
      case 'survey': return wrap(F.survey, '<select id="' + idf + '" name="survey" class="input select">' + opts(V.SURVEYS, d.survey) + '</select>');
      case 'sellerId': case 'buyerId': case 'applicantId':
        return wrap(F[{ sellerId: 'seller', buyerId: 'buyer', applicantId: 'applicant' }[name]], '<select id="' + idf + '" name="' + name + '" class="input select" aria-describedby="' + idf + '-help">' + peopleOptions(d[name]) + '</select>', F.peopleHelp);
      case 'basis': return wrap(F.basis, '<select id="' + idf + '" name="basis" class="input select">' + opts(V.BASIS, d.basis, F.basisOpts) + '</select>');
      case 'status': return wrap(F.njStatus, '<select id="' + idf + '" name="status" class="input select">' + opts(V.NAMJARI_STATUS, d.status, F.njOpts) + '</select>');
      case 'deedId': return d.basis === 'deed' ? wrap(F.deed, '<select id="' + idf + '" name="deedId" class="input select">' + deedOptions(st) + '</select>') : '';
      case 'owners':
        return '<fieldset class="ad-owners" data-field="owners"><legend>' + esc(F.owners) + '</legend><p class="help-text">' + esc(F.peopleHelp) + '</p>' + (d.owners || []).map(function (o, i) {
          var pid = 'af-owners-' + i + '-personId', sid = 'af-owners-' + i + '-share';
          return '<div class="ad-owner-row"><div class="field"><label for="' + pid + '">' + esc(F.owner + ' ' + f.num(i + 1)) + '</label><select id="' + pid + '" name="owner-person" data-i="' + i + '" class="input select">' + peopleOptions(o.personId) + '</select><div class="ad-ferr" id="err-' + pid + '"></div></div>' +
            '<div class="field"><label for="' + sid + '">' + esc(F.share) + '</label><input id="' + sid + '" name="owner-share" data-i="' + i + '" class="input" inputmode="decimal" maxlength="10" value="' + esc(o.share === undefined ? '' : o.share) + '"><div class="ad-ferr" id="err-' + sid + '"></div></div>' +
            ((d.owners.length > 1) ? '<button type="button" class="btn btn-light btn-sm" data-aa="rmowner" data-i="' + i + '" aria-label="' + esc(F.removeOwner + ' ' + f.num(i + 1)) + '">' + I.x + esc(F.removeOwner) + '</button>' : '') + '</div>';
        }).join('') + '<div class="ad-ferr" id="err-af-owners"></div><button type="button" class="btn btn-mint btn-sm" data-aa="addowner">' + I.plus + esc(F.addOwner) + '</button></fieldset>';
    }
    return '';
  }
  function blankData(type, keep) {
    var d = { mouzaId: keep.mouzaId || '', dag: keep.dag || '' };
    if (type === 'khatian') { d.survey = 'BS'; d.owners = [{ personId: '', share: '' }]; }
    if (type === 'namjari') { d.basis = 'deed'; d.status = 'pending'; }
    return d;
  }
  function formView(record, presetType) {
    return api('GET', 'reference').then(function (ref) {
      var type = record ? record.type : (presetType || (A.form && !A.form.id && A.form.type) || 'deed');
      var data = record ? JSON.parse(JSON.stringify(record.data)) : blankData(type, {});
      if (record && type === 'khatian' && !data.owners.length) data.owners = [{ personId: '', share: '' }];
      A.form = { id: record ? record.id : null, type: type, data: data, note: '', ref: ref, ctx: V.buildContext(ref.base, ref.records, record ? record.id : null), wasLive: record && record.status === 'reviewed' };
      paintForm();
    });
  }
  function paintForm(focusName) {
    var AT = t().admin, F = AT.form, st = A.form;
    var typePick = st.id ? '' : '<fieldset class="ad-typepick"><legend>' + esc(F.chooseType) + '</legend>' + V.TYPES.map(function (ty) {
      return '<label class="ad-typecard' + (ty === st.type ? ' on' : '') + '"><input type="radio" name="ad-type" value="' + ty + '"' + (ty === st.type ? ' checked' : '') + '><span class="ico">' + I[TYPE_ICON[ty]] + '</span><b>' + esc(AT.types[ty]) + '</b><span class="xs muted">' + esc(AT.typeHint[ty]) + '</span></label>';
    }).join('') + '</fieldset>';
    paintMain('<h2 class="ad-h2">' + esc(st.id ? F.editTitle(st.id) : F.newTitle) + '</h2>' +
      (st.wasLive ? notice('warn', esc(AT.detail.editWarn)) : '') +
      '<form id="ad-record-form" class="card ad-card ad-form" novalidate>' + typePick +
        '<div class="ad-grid">' + LAYOUT[st.type].map(function (n) { return fieldHtml(n, st); }).join('') + '</div>' +
        '<div class="field"><label for="af-note">' + esc(F.note) + '</label><textarea id="af-note" name="note" class="input" rows="2" maxlength="300">' + esc(st.note) + '</textarea><div class="ad-ferr" id="err-af-note"></div></div>' +
        '<div id="ad-warnings" aria-live="polite"></div><div id="ad-form-err" aria-live="assertive"></div>' +
        '<div class="cta-row"><button type="submit" class="btn btn-primary">' + I.checkCircle + '<span>' + esc(F.save) + '</span></button>' +
          '<a class="btn btn-light" href="' + (st.id ? '#/admin/record/' + esc(st.id) : '#/admin/records') + '">' + esc(F.cancel) + '</a></div>' +
      '</form>');
    showWarnings(V.validateRecord(st.type, st.data, st.ctx).warnings);
    if (focusName) { var el = document.querySelector('#ad-record-form [name="' + focusName + '"]'); if (el) el.focus(); }
  }
  function readForm() {
    var st = A.form, form = document.getElementById('ad-record-form'); if (!form) return;
    LAYOUT[st.type].forEach(function (n) { if (n !== 'owners' && form[n]) st.data[n] = form[n].value; });
    if (st.type === 'khatian') {
      st.data.owners = Array.prototype.map.call(form.querySelectorAll('[name="owner-person"]'), function (sel) {
        var i = sel.getAttribute('data-i'), share = form.querySelector('[name="owner-share"][data-i="' + i + '"]');
        return { personId: sel.value, share: share ? share.value : '' };
      });
    }
    if (st.type === 'namjari' && st.data.basis !== 'deed') st.data.deedId = null;
    st.note = form.note.value;
  }
  function clearErrors() {
    Array.prototype.forEach.call(document.querySelectorAll('#ad-record-form .ad-ferr'), function (e) { e.innerHTML = ''; });
    Array.prototype.forEach.call(document.querySelectorAll('#ad-record-form [aria-invalid]'), function (e) { e.removeAttribute('aria-invalid'); });
    var g = document.getElementById('ad-form-err'); if (g) g.innerHTML = '';
  }
  function showErrors(errors) {
    var AT = t().admin, first = null, leftover = [];
    errors.forEach(function (e) {
      var id = 'af-' + e.field.replace(/\./g, '-'), box = document.getElementById('err-' + id), input = document.getElementById(id);
      var msg = '<p class="error-text">' + I.alert + '<span>' + esc(AT.err[e.code] || AT.err.generic) + '</span></p>';
      if (box) { box.innerHTML += msg; if (input) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-errormessage', 'err-' + id); first = first || input; } }
      else leftover.push(msg);
    });
    document.getElementById('ad-form-err').innerHTML = '<div class="notice ad-notice bad" role="alert">' + I.alertCircle + '<span>' + esc(AT.form.fixErrors) + leftover.join('') + '</span></div>';
    if (first) first.focus();
  }
  function showWarnings(ws) {
    var AT = t().admin, box = document.getElementById('ad-warnings'); if (!box) return;
    box.innerHTML = ws && ws.length ? notice('warn', '<b>' + esc(AT.form.warnTitle) + ':</b> ' + ws.map(function (w) { return esc(AT.warn[w.code] || w.code); }).join(' ')) : '';
  }
  function submitRecord() {
    var AT = t().admin, st = A.form; readForm(); clearErrors();
    var local = V.validateRecord(st.type, st.data, st.ctx);
    showWarnings(local.warnings);
    if (!local.ok) return showErrors(local.errors);
    if (V.nidLike(st.note)) return showErrors([{ field: 'note', code: 'nid_like' }]);
    var btn = document.querySelector('#ad-record-form [type=submit]'); btn.disabled = true; btn.querySelector('span').textContent = AT.form.saving;
    var req = st.id ? api('PUT', 'records/' + encodeURIComponent(st.id), { data: st.data, note: st.note }) : api('POST', 'records', { type: st.type, data: st.data, note: st.note });
    req.then(function (j) {
      A.flash = { kind: 'ok', text: st.id && j.backToDraft ? AT.form.savedBack : AT.form.saved };
      A.form = null; if (st.id) liveRefresh();
      go('#/admin/record/' + j.record.id);
    }).catch(function (e) {
      btn.disabled = false; btn.querySelector('span').textContent = AT.form.save;
      if (e.handled) return;
      if (e.code === 'invalid') return showErrors(e.body.errors || []);
      if (e.code === 'has_dependants') { document.getElementById('ad-form-err').innerHTML = notice('bad', esc(AT.detail.deps((e.body.dependants || []).join(', '))), 'alert'); return; }
      document.getElementById('ad-form-err').innerHTML = notice('bad', esc(errText(e)), 'alert');
    });
  }

  /* ======================= Log ======================= */
  function logList(entries) {
    var AT = t().admin;
    if (!entries.length) return '<p class="muted">' + esc(AT.log.empty) + '</p>';
    return '<ul class="ad-loglist">' + entries.map(function (l) {
      return '<li><b>' + esc(AT.log.actions[l.action] || l.action) + '</b>' + (l.recordId ? ' · <a href="#/admin/record/' + esc(l.recordId) + '">' + esc(l.recordId) + '</a> (' + esc(AT.types[l.type] || l.type) + ')' : '') +
        '<span class="muted xs">' + esc(when(l.at)) + ' · ' + esc(l.actor) + '</span>' + (l.detail && l.detail.note ? '<p class="ad-note">' + esc(l.detail.note) + '</p>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function logView() {
    var AT = t().admin, L = AT.log;
    return api('GET', 'log?limit=300').then(function (j) {
      var rows = j.log.map(function (l) {
        var detail = l.detail ? (l.detail.note || (l.detail.removed !== undefined ? String(l.detail.removed) : '') || (l.detail.backToDraft ? AT.status.draft : '')) : '';
        return '<tr><td>' + esc(when(l.at)) + '</td><td>' + esc(l.actor) + '</td><td>' + esc(L.actions[l.action] || l.action) + '</td><td>' + (l.recordId ? '<a href="#/admin/record/' + esc(l.recordId) + '">' + esc(l.recordId) + '</a> · ' + esc(AT.types[l.type] || '') : '—') + '</td><td>' + esc(detail) + '</td></tr>';
      }).join('');
      paintMain('<h2 class="ad-h2">' + esc(L.title) + '</h2><p class="muted">' + esc(L.lead) + '</p>' +
        (rows ? '<div class="ad-table-wrap" tabindex="0" role="region" aria-label="' + esc(L.title) + '"><table class="ad-table"><thead><tr><th scope="col">' + esc(L.time) + '</th><th scope="col">' + esc(L.who) + '</th><th scope="col">' + esc(L.action) + '</th><th scope="col">' + esc(L.record) + '</th><th scope="col">' + esc(L.note) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted">' + esc(L.empty) + '</p>'));
    });
  }

  /* ======================= Settings ======================= */
  function settingsView() {
    var AT = t().admin, S = AT.settings;
    return api('GET', 'overview').then(function (ov) {
      setCounts(ov.counts.byStatus);
      paintMain('<h2 class="ad-h2">' + esc(S.title) + '</h2><div class="ad-cols">' + (ov.credentialSource === 'demo' ? '' :      // demo login: fixed password
        '<form id="ad-pw-form" class="card ad-card ad-form" novalidate><h3>' + I.shield + esc(S.pwTitle) + '</h3>' +
          '<input type="text" name="username" autocomplete="username" value="' + esc(A.session.email) + '" hidden>' +
          '<div class="field"><label for="ad-pw-cur">' + esc(S.current) + '</label><input id="ad-pw-cur" name="current" type="password" class="input" autocomplete="current-password" maxlength="200"></div>' +
          '<div class="field"><label for="ad-pw-new">' + esc(S.next) + '</label><input id="ad-pw-new" name="next" type="password" class="input" autocomplete="new-password" minlength="10" maxlength="200"></div>' +
          '<div class="field"><label for="ad-pw-again">' + esc(S.again) + '</label><input id="ad-pw-again" name="again" type="password" class="input" autocomplete="new-password" maxlength="200"></div>' +
          '<div class="ad-act-err" aria-live="assertive"></div><button type="submit" class="btn btn-primary" style="margin-top:12px">' + esc(S.change) + '</button>' +
          '<p class="muted small" style="margin-top:12px">' + esc(S.session) + '</p></form>') +
        '<form id="ad-reset-form" class="card ad-card ad-form ad-danger" novalidate><h3>' + I.refresh + esc(S.resetTitle) + '</h3><p>' + esc(S.resetText(ov.counts.total, f)) + '</p>' +
          '<div class="field"><label for="ad-reset-confirm">' + esc(S.resetType) + '</label><input id="ad-reset-confirm" name="confirm" class="input" autocomplete="off" spellcheck="false" maxlength="10"></div>' +
          '<div class="ad-act-err" aria-live="assertive"></div><button type="submit" class="btn btn-danger-outline" style="margin-top:12px">' + I.refresh + esc(S.resetBtn) + '</button></form>' +
        (isLocal() ? backupCard() : '') +
        '</div>');
    });
  }
  function backupCard() {
    var L = t().admin.local;
    return '<section class="card ad-card ad-form ad-backup"><h3>' + I.doc + esc(L.backupTitle) + '</h3><p>' + esc(L.backupText) + '</p>' +
      '<p><button type="button" class="btn btn-secondary" data-aa="backup-download">' + I.doc + esc(L.download) + '</button></p>' +
      '<form id="ad-import-form" novalidate><h3 style="margin-top:14px">' + I.refresh + esc(L.importTitle) + '</h3><p class="muted small">' + esc(L.importText) + '</p>' +
        '<div class="field"><label for="ad-import-file">' + esc(L.importFile) + '</label><input id="ad-import-file" name="file" type="file" accept=".json,application/json" class="input"></div>' +
        '<label class="ad-confirm"><input type="checkbox" name="confirm"><span>' + esc(L.importConfirm) + '</span></label>' +
        '<div class="ad-act-err" aria-live="assertive"></div><button type="submit" class="btn btn-light" style="margin-top:12px">' + I.refresh + esc(L.importBtn) + '</button></form></section>';
  }
  function downloadBackup() {
    api('GET', 'backup').then(function (b) {
      var blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'terrashield-admin-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }).catch(function (e) { if (!e.handled) A.flash = { kind: 'bad', text: errText(e) }; });
  }
  function importBackup(form) {
    var L = t().admin.local, out = form.querySelector('.ad-act-err');
    var fail = function (m) { out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(m) + '</span></p>'; };
    var file = form.file.files && form.file.files[0];
    if (!file) return fail(L.importFile);
    if (!form.confirm.checked) return fail(t().admin.err.confirm_required);
    if (file.size > 5 * 1024 * 1024) return fail(t().admin.err.backup_invalid);
    var reader = new FileReader();
    reader.onload = function () {
      var backup; try { backup = JSON.parse(String(reader.result)); } catch (e) { return fail(t().admin.err.backup_invalid); }
      api('POST', 'import', { confirm: true, backup: backup }).then(function (j) {
        A.flash = { kind: 'ok', text: L.imported(j.imported, f) }; liveRefresh(); go('#/admin');
      }).catch(function (e) { if (!e.handled) fail(errText(e)); });
    };
    reader.onerror = function () { fail(t().admin.err.backup_invalid); };
    reader.readAsText(file);
  }
  function changePassword(form) {
    var S = t().admin.settings, out = form.querySelector('.ad-act-err');
    var say = function (kind, text) { out.innerHTML = kind === 'ok' ? notice('ok', esc(text), 'status') : '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(text) + '</span></p>'; };
    if (form.next.value !== form.again.value) return say('bad', S.mismatch);
    api('POST', 'password', { current: form.current.value, next: form.next.value }).then(function () {
      form.current.value = form.next.value = form.again.value = ''; say('ok', S.changed);
    }).catch(function (e) { if (!e.handled) say('bad', S.pwErr[e.code] || errText(e)); });
  }
  function resetData(form) {
    var AT = t().admin, S = AT.settings, out = form.querySelector('.ad-act-err');
    if (form.confirm.value.trim() !== 'RESET') { out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(S.resetType) + '</span></p>'; form.confirm.focus(); return; }
    api('POST', 'reset', { confirm: 'RESET' }).then(function (j) {
      A.flash = { kind: 'ok', text: S.resetDone(j.removed, f) }; liveRefresh(); go('#/admin');
    }).catch(function (e) { if (!e.handled) out.innerHTML = '<p class="error-text" role="alert">' + I.alert + '<span>' + esc(errText(e)) + '</span></p>'; });
  }

  /* ======================= Events (one set per visit, on the admin root) ======================= */
  function bind() {
    var r = root(); if (!r) return;
    r.addEventListener('submit', function (e) {
      var form = e.target; e.preventDefault();
      if (form.id === 'ad-login-form') return doLogin(form);
      if (form.id === 'ad-import-form') return importBackup(form);
      if (form.id === 'ad-record-form') return submitRecord();
      if (form.id === 'ad-pw-form') return changePassword(form);
      if (form.id === 'ad-reset-form') return resetData(form);
      if (form.getAttribute('data-aform')) return recordAction(form.getAttribute('data-aform'), form);
    });
    r.addEventListener('click', function (e) {
      var b = e.target.closest('[data-aa]'); if (!b) return;
      var a = b.getAttribute('data-aa');
      if (a === 'retry') { A.checked = false; U.render(); }
      if (a === 'backup-download') downloadBackup();
      if (a === 'logout') {
        api('POST', 'logout', {}).catch(function () {}).then(function () { A.session = null; A.checked = false; A.loginMsg = 'loggedOut'; A.form = null; go('#/admin'); });
      }
      if (a === 'togglepw') {
        var p = document.getElementById('ad-pass'), show = p.type === 'password';
        p.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', String(show)); b.textContent = show ? t().admin.login.hide : t().admin.login.show;
      }
      if (a === 'copy') copyDemo(b);
      if (a === 'restore') recordAction('restore', b.closest('.ad-act'));
      if (a === 'addowner') { readForm(); A.form.data.owners.push({ personId: '', share: '' }); paintForm(); var all = document.querySelectorAll('[name="owner-person"]'); if (all.length) all[all.length - 1].focus(); }
      if (a === 'rmowner') { readForm(); A.form.data.owners.splice(Number(b.getAttribute('data-i')), 1); paintForm(); var add = document.querySelector('[data-aa="addowner"]'); if (add) add.focus(); }
    });
    r.addEventListener('change', function (e) {
      if (e.target.name === 'ad-type' && A.form) {
        readForm(); var keep = { mouzaId: A.form.data.mouzaId, dag: A.form.data.dag };
        A.form.type = e.target.value; A.form.data = blankData(A.form.type, keep); paintForm('ad-type');
        var radio = document.querySelector('[name="ad-type"][value="' + A.form.type + '"]'); if (radio) radio.focus();
        return;
      }
      if (e.target.id === 'ad-type-filter') { A.typeFilter = e.target.value; U.render(); return; }
      if (A.form && document.getElementById('ad-record-form') && ['mouzaId', 'dag', 'basis'].indexOf(e.target.name) >= 0 && A.form.type === 'namjari') { readForm(); paintForm(e.target.name); }
    });
    r.addEventListener('input', function (e) {
      if (!A.form || !document.getElementById('ad-record-form') || !e.target.closest('#ad-record-form')) return;
      readForm(); showWarnings(V.validateRecord(A.form.type, A.form.data, A.form.ctx).warnings);
    });
  }

  U.screens.admin = adminScreen;
})(window.TS.ui);
