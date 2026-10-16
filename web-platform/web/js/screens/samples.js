/*
 * TerraShield — screens/samples.js
 * Sample cases and Judge Mode (live demo, reset, run-all-tests).
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var state = U.state, t = U.t, currentData = U.currentData, f = U.f, mouzaName = U.mouzaName, esc = U.esc, todayISO = U.todayISO, toast = U.toast, I = U.I, STATUS_ICON = U.STATUS_ICON;

  /* ----- Samples & Judge Mode ----- */
  function samplesScreen() {
    var T = t();
    var html = '<div class="page jr-page"><p class="eyebrow">' + I.grid + esc(T.navSamples) + '</p>' +
      '<h1 class="page-title" style="margin-top:12px">' + esc(T.samplesTitle) + '</h1><p class="page-lead">' + esc(T.samplesLead) + '</p>' +
      '<div class="samples-grid jr-stagger">' + TS.testCases.filter(function (c) { return c.sample; }).map(function (c) {
        return '<button class="sample-card" data-act="sample" data-id="' + c.id + '"><span class="dot ' + c.level + '">' + STATUS_ICON[c.level] + '</span><span><b>' + esc(c.title[state.lang]) + '</b><span class="s">' + esc(c.story[state.lang]) + '</span></span><span class="go">' + I.next + '</span></button>';
      }).join('') + '</div>' +
      (state.judge ? judgePanel() : '<div class="notice" style="margin-top:18px">' + I.present + '<span>' + esc(T.judgeBtn) + ' — <a href="#/judge">' + esc(T.storyTitle) + '</a></span></div>') + '</div>';
    return { html: html, nav: true };
  }

  function judgePanel() {
    var T = t(), D = state.demo, d = U.baseView();
    var k = d.khatians.find(function (x) { return x.mouzaId === D.mouzaId && x.dag === Number(D.dag); });
    var plotOpts = (TS.baseData || TS.data).plots.map(function (p) { var v = p.mouzaId + '|' + p.dag; return '<option value="' + v + '"' + (p.mouzaId === D.mouzaId && p.dag === Number(D.dag) ? ' selected' : '') + '>' + esc(mouzaName(p.mouzaId) + ' · ' + T.rDag + ' ' + f.num(p.dag)) + '</option>'; }).join('');
    var sellerOpts = (k ? k.owners : []).map(function (o) { return '<option value="' + o.personId + '"' + (o.personId === D.sellerId ? ' selected' : '') + '>' + esc(f.person(o.personId)) + '</option>'; }).join('');
    var tr = state.testRun;
    return '<section class="judge" aria-labelledby="judge-h"><h2 id="judge-h">' + I.flask + esc(T.judgeTitle) + '</h2><p class="muted small" style="margin-top:4px">' + esc(T.judgeLead) + '</p>' +
      '<div class="cta-row" style="margin-top:12px"><button class="btn btn-primary" data-act="demo-script">' + I.play + esc(T.demoScript) + '</button><a class="btn btn-secondary" href="#/judge">' + I.present + esc(T.judgeBtn) + '</a></div>' +
      '<div class="judge-cols"><div><h3 style="margin-top:6px">' + esc(T.demoTitle) + '</h3><div class="demo-banner">' + esc(T.demoBanner) + '</div>' +
      '<div class="form-grid"><div class="field full"><label for="d-plot">' + esc(T.rDag) + '</label><select id="d-plot" class="select">' + plotOpts + '</select></div>' +
      '<div class="field"><label for="d-seller">' + esc(T.fSeller) + '</label><select id="d-seller" class="select">' + sellerOpts + '</select></div>' +
      '<div class="field"><label for="d-buyer">' + esc(T.buyer) + '</label><input id="d-buyer" class="input" value="' + esc(f.person('P99')) + '" disabled></div>' +
      '<div class="field"><label for="d-area">' + esc(T.fArea) + ' (' + esc(T.unit) + ')</label><input id="d-area" class="input" inputmode="decimal" value="' + esc(D.area) + '"></div>' +
      '<div class="field"><label>' + esc(T.saleDate) + '</label><input class="input" value="' + esc(f.date(todayISO())) + '" disabled></div>' +
      '<div class="field full"><label>' + esc(T.namjariDone) + '</label><div class="toggle"><button data-act="demo-nj" data-v="1" aria-pressed="' + D.namjari + '">' + esc(T.yes) + '</button><button data-act="demo-nj" data-v="0" aria-pressed="' + !D.namjari + '">' + esc(T.no) + '</button></div></div></div>' +
      '<div class="stack" style="margin-top:14px"><button class="btn btn-mint" data-act="demo-add">' + I.plus + esc(T.addSale) + '</button>' +
      '<button class="btn btn-primary" data-act="demo-check">' + I.search + esc(T.checkAgain) + '</button>' +
      '<button class="btn btn-danger-outline" data-act="demo-reset">' + I.refresh + esc(T.resetData) + '</button></div>' +
      '<p class="small muted" style="margin-top:8px">' + esc(T.addedSales(state.extraDeeds.length, f)) + '</p></div>' +
      '<div><h3 style="margin-top:6px">' + esc(T.runTests) + '</h3><button class="btn btn-secondary btn-block" style="margin-top:10px" data-act="run-tests">' + I.flask + esc(T.runTests) + '</button>' +
      (tr ? '<div class="big-score ' + (tr.pass === tr.total ? 'pass' : 'fail') + '">' + (tr.pass === tr.total ? '✓ ' : '✗ ') + esc(T.testsPass(tr.pass, tr.total, f)) + '</div>' +
        '<table class="test-table"><thead><tr><th>Case</th><th>Expected</th><th>Got</th><th></th></tr></thead><tbody>' + tr.rows.map(function (r) {
          return '<tr><td>' + esc(r.id) + '</td><td>' + esc(r.exp) + '</td><td>' + esc(r.got) + '</td><td class="' + (r.ok ? 'test-pass' : 'test-fail') + '">' + (r.ok ? '✓' : '✗') + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      '</div></div></section>';
  }

  // Run every shared test case against the ORIGINAL sample data (demo sales are ignored),
  // exactly like tests/engine.test.js does in Node.
  function runAllTests() {
    var rows = [], pass = 0;
    TS.testCases.forEach(function (tc) {
      var base = TS.baseData || TS.data;            // always the fixed fictional data — admin records never affect the 14 tests
      var d = tc.addDeeds ? E.withExtraDeeds(base, tc.addDeeds) : base;
      var r = E.check(tc.input, d), got = E.ruleIds(r), exp = tc.expect.rules.slice().sort();
      var ok = r.status === tc.expect.status && got.join(',') === exp.join(',') &&
        (!tc.expect.calc || JSON.stringify(r.calc) === JSON.stringify(tc.expect.calc));
      if (ok) pass++;
      rows.push({ id: tc.id, exp: tc.expect.status + ' [' + exp.join(',') + ']', got: r.status + ' [' + got.join(',') + ']', ok: ok });
    });
    state.testRun = { pass: pass, total: TS.testCases.length, rows: rows };
    return state.testRun;
  }
  TS.runAllTests = runAllTests;   // exposed for automated checks

  function addDemoSale() {
    var D = state.demo, area = E.parseNumber(D.area);
    if (isNaN(area) || area <= 0) { toast(t().err.area_positive); return false; }
    var n = state.extraDeeds.length + 1, id = 'DEMO-' + n;
    state.extraDeeds.push({ id: id, deedNo: (9000 + n) + '/' + todayISO().slice(0, 4), office: 'SRO-DEMO', date: todayISO(),
      sellerId: D.sellerId, buyerId: 'P99', mouzaId: D.mouzaId, dag: Number(D.dag), area: area });
    if (D.namjari) state.extraNamjari.push({ caseNo: 'N-D' + n, mouzaId: D.mouzaId, dag: Number(D.dag), applicantId: 'P99', basis: 'deed', deedId: id, status: 'approved', date: todayISO() });
    return true;
  }


  U.runAllTests = runAllTests; U.addDemoSale = addDemoSale; U.judgePanel = judgePanel;
  U.screens.samples = samplesScreen;
})(window.TS.ui);
