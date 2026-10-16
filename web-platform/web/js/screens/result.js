/*
 * TerraShield — screens/result.js
 * Result, evidence, land history and printable report.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var state = U.state, t = U.t, currentData = U.currentData, f = U.f, mouzaName = U.mouzaName, esc = U.esc, todayISO = U.todayISO, say = U.say, svg = U.svg, I = U.I, STATUS_ICON = U.STATUS_ICON, LEVEL_ICON = U.LEVEL_ICON, go = U.go, listenBtn = U.listenBtn, bar = U.bar, findingText = U.findingText, summaryText = U.summaryText, areaBar = U.areaBar, nextStepsHtml = U.nextStepsHtml, evCard = U.evCard, deedCard = U.deedCard, khatianCard = U.khatianCard, link = U.link;

  function resultScreen() {
    var T = t(), res = state.result, st = res.status;
    var issues = res.findings.filter(function (x) { return x.level !== 'info'; }).length;
    var where = mouzaName(res.input.mouzaId) + ' · ' + T.rDag + ' ' + f.num(E.normalizeDigits(res.input.dag));
    var html = '<div class="page jr-page">';
    if (state.fromSample) {
      var sc = TS.testCases.find(function (c) { return c.id === state.fromSample; });
      html += '<div class="sample-banner"><span>' + I.grid + esc(T.sampleBanner) + ': ' + esc(sc.title[state.lang]) + '</span><button class="link-btn" data-act="toggle-inputs">' + esc(T.seeInputs) + '</button></div>' +
        (state.showInputs ? '<div class="inputs-box">' + esc(mouzaName(res.input.mouzaId)) + ' · ' + esc(T.rDag) + ' ' + esc(f.num(res.input.dag)) + ' · ' + esc(res.input.sellerId ? f.person(res.input.sellerId) : (res.input.sellerName || '—')) + ' · ' + esc(f.num(res.input.area)) + ' ' + esc(T.unit) + (res.input.sellerDeedNo ? ' · ' + esc(T.rDeed) + ' ' + esc(res.input.sellerDeedNo) : '') + '</div>' : '');
    }
    html += '<div class="result-grid"><div class="result-main">' +
      '<section class="result-head ' + st + '" role="status" aria-live="polite">' +
        '<div class="top"><span class="badge">' + I.layers.replace('<svg', '<svg style="width:15px;height:15px"') + esc(T.checkedAt) + ' · ' + esc(where) + '</span><span class="tag-sim" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.45)">' + esc(T.sampleBadge) + '</span></div>' +
        '<div class="status-ico pop">' + STATUS_ICON[st] + '</div>' +
        '<h1>' + esc(T.head[st]) + '</h1>' +
        (st === 'green' ? '<p class="greennote">' + esc(T.greenNote) + '</p>' : '') +
        (st === 'red' || st === 'yellow' ? '<p class="count">' + esc(T.issuesFound(issues, f)) + '</p>' : '') +
        '<div class="speak-row"><button class="btn" data-act="say-result">' + I.speaker + esc(T.hearResult) + '</button>' +
          (st !== 'grey' ? '<a class="btn" href="#/history">' + I.clock + esc(T.history) + '</a>' : '') + '</div></section>' +
      adminNotice(res);

    var aside = '';
    if (st === 'grey') {
      var dags = U.resultData().plots.filter(function (p) { return p.mouzaId === res.input.mouzaId; }).map(function (p) { return p.dag; });
      html += '<div class="card-soft summary-box" style="margin-top:14px"><p class="label">' + esc(T.didYouMean) + '</p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">' +
        dags.map(function (d) { return '<button class="btn btn-mint btn-sm tnum" data-act="pickdag" data-dag="' + d + '">' + esc(f.num(d)) + '</button>'; }).join('') + '</div>' +
        '<div class="cta-row" style="margin-top:16px"><button class="btn btn-primary" data-act="goto" data-step="2">' + I.edit + esc(T.checkAgainDetails) + '</button><a class="btn btn-secondary" href="#/samples">' + I.grid + esc(T.ctaSample) + '</a></div></div>';
    } else {
      html += '<div class="card-soft summary-box" style="margin-top:14px"><p class="label">' + I.sparkle.replace('<svg', '<svg style="width:15px;height:15px"') + esc(T.inShort) + '</p><p>' + esc(summaryText(res)) + '</p></div>';
      if (res.skipped && res.skipped.indexOf('area') >= 0) html += '<div class="notice" style="margin-top:12px">' + I.info + '<span>' + esc(T.areaSkipped) + '</span></div>';
      if (res.findings.length) html += '<div class="findings-title"><h2>' + esc(T.evTitle) + '</h2><span class="muted small tnum">' + esc(f.num(res.findings.length)) + '</span></div>';
      res.findings.forEach(function (fd, i) {
        var tx = findingText(fd);
        html += '<article class="finding ' + fd.level + '" data-rule="' + fd.rule + '" style="animation-delay:' + (i * 70) + 'ms"><div class="fhead"><span class="lvl ' + fd.level + '">' + LEVEL_ICON[fd.level] + esc(fd.level === 'info' ? T.infoOnly : T.level[fd.level]) + '</span><span class="rid">' + fd.rule + '</span></div>' +
          '<h3>' + esc(tx.title) + '</h3><p class="detail">' + esc(tx.detail) + '</p>' +
          '<div class="actions"><a class="btn btn-secondary" href="#/evidence/' + i + '">' + I.search + esc(T.seeEvidence) + '</a><button class="btn btn-ghost" data-act="say" data-text="' + esc(tx.title + '। ' + tx.detail) + '">' + I.speaker + esc(T.listen) + '</button></div>' +
          nextStepsHtml(TS.nextStepsFor[fd.rule] || [], false) + '</article>';
      });
      if (res.calc) aside += '<div class="card-soft aside-card"><h3>' + I.ruler + esc(T.resultAside) + '</h3>' + areaBar(res.calc) + '</div>';
      aside += '<div class="card-soft aside-card"><h3>' + I.next + esc(T.whatNext) + '</h3><ol style="margin:8px 0 0;padding-left:20px;font-size:15.5px">' + uniqueSteps(res).map(function (k) { return '<li style="margin:4px 0">' + esc(T.steps[k]) + '</li>'; }).join('') + '</ol></div>';
      aside += '<div class="card-soft aside-card aside-actions"><a class="btn btn-secondary" href="#/history">' + I.clock + esc(T.history) + '</a><a class="btn btn-secondary" href="#/report">' + I.printer + esc(T.report) + '</a></div>';
    }
    aside += '<div class="disclaimer" role="note"><b>' + I.alert + esc(T.disclaimerTitle) + '</b>' + esc(T.disclaimer) + '</div>';
    html += '</div><aside class="result-aside">' + aside + '</aside></div></div>';
    var spoken = T.head[st] + '. ' + (st === 'green' ? T.greenNote + ' ' : '') + (st !== 'grey' ? summaryText(res) + ' ' : '') + T.disclaimer;
    return { html: html, bar: '<div class="inner single"><button class="btn btn-primary" data-act="new">' + I.refresh + esc(T.newCheck) + '</button></div>',
      after: function () { state._spoken = spoken; if (state.voiceOn) setTimeout(function () { say(spoken); }, 300); } };
  }


  function evidenceScreen(i) {
    var T = t(), res = state.result, fd = res.findings[i];
    if (!fd) { go('#/result'); return { html: '' }; }
    var e = fd.evidence, k = res.khatian, sel = res.input.sellerId, left = '', right = '';
    switch (fd.rule) {
      case 'R1': left = khatianCard(k, sel); right = e.deeds.map(function (d) { return deedCard(d, { namjari: true, area: true }); }).join('<div style="height:10px"></div>'); break;
      case 'R2': left = khatianCard(k, sel); right = '<div class="ev-card"><h3>' + I.ruler + esc(T.rArea) + '</h3>' + areaBar(res.calc) + '</div>'; break;
      case 'R3': left = k ? khatianCard(k) : ''; right = evCard(I.user, T.rSeller, [[T.rSeller, e.sellerName || '—', true]]); break;
      case 'R4': left = khatianCard(k, sel); right = e.deeds.map(function (d) { return deedCard(d, { area: true, buyer: true }); }).join('<div style="height:10px"></div>'); break;
      case 'R5': left = khatianCard(k, sel); right = e.cases.map(function (c) { return evCard(I.doc, T.namjariCard(c.caseNo), [[T.fApplicant, f.person(c.applicantId), true], [T.fBasis, T.basis[c.basis] || c.basis], [T.fStatus, T.status[c.status], true], [T.fDate, f.date(c.date)]]); }).join(''); break;
      case 'R6': left = khatianCard(k, '*', e.totalShares); right = evCard(I.pin, T.rDag + ' ' + f.num(res.plot.dag), [[T.fPlotArea, f.num(e.plotArea) + ' ' + T.unit, true]]); break;
      case 'R7a': left = deedCard(e.acquiredDeed, { date: true, buyer: true }); right = e.saleDeeds.map(function (d) { return deedCard(d, { date: true, seller: true }); }).join(''); break;
      case 'R7b': left = deedCard(e.boughtDeed, { date: true, buyer: true }); right = deedCard(e.soldDeed, { date: true, seller: true }); break;
      case 'R8a': left = evCard(I.doc, T.rDeed, [[T.rDeed, e.deedNo, true]]); right = evCard(I.question, T.head.grey, [[T.rDeed, '—']]); break;
      case 'R8b': left = evCard(I.user, T.rSeller, [[T.rSeller, f.person(sel)], [T.rArea, f.num(res.calc ? res.calc.W : res.input.area) + ' ' + T.unit]]); right = deedCard(e.deed, { buyer: e.problems.indexOf('buyer') >= 0, dag: e.problems.indexOf('dag') >= 0, area: e.problems.indexOf('area') >= 0 }); break;
      case 'R8c': left = deedCard(e.deeds[0], { buyer: true, date: true }); right = e.deeds.slice(1).map(function (d) { return deedCard(d, { buyer: true, date: true }); }).join(''); break;
    }
    var tx = findingText(fd);
    var html = '<div class="page mid jr-page"><div class="fhead" style="display:flex;gap:8px;align-items:center"><span class="lvl ' + fd.level + '">' + LEVEL_ICON[fd.level] + esc(fd.level === 'info' ? T.infoOnly : T.level[fd.level]) + '</span><span class="rid mono xs muted">' + fd.rule + '</span></div>' +
      '<h1 class="page-title" style="margin-top:10px">' + esc(T.evTitle) + '</h1><p class="page-lead">' + esc(tx.title) + '</p>' +
      '<div class="ev-grid two">' + left + link() + right + '</div>' +
      '<div class="explain"><div style="display:flex;gap:8px;align-items:flex-start"><p style="margin:0;flex:1">' + esc(tx.detail) + '</p>' + listenBtn(tx.title + '। ' + tx.detail) + '</div></div>' +
      nextStepsHtml(TS.nextStepsFor[fd.rule] || [], true) +
      '<div class="disclaimer"><b>' + I.alert + esc(T.disclaimerTitle) + '</b>' + esc(T.disclaimer) + '</div></div>';
    return { html: html, bar: '<div class="inner single"><a class="btn btn-light" href="#/result">' + I.back + esc(T.backToResult) + '</a></div>' };
  }

  // A person's own check that used records added in the Admin Panel: say so plainly (fictional, not official).
  function adminNotice(res) {
    if (state.resultSource !== 'live' || !TS.dataMeta || (TS.dataMeta.source !== 'server' && TS.dataMeta.source !== 'local')) return '';
    var T = t(), mz = res.input.mouzaId, dag = Number(E.normalizeDigits(res.input.dag)), D = TS.data, items = [];
    var on = function (x) { return x._src === 'admin' && x.mouzaId === mz && Number(x.dag) === dag; };
    D.plots.filter(on).forEach(function () { items.push(T.adminKinds.plot); });
    D.khatians.filter(on).forEach(function (k) { items.push(T.adminKinds.khatian + ' ' + f.num(k.khatianNo)); });
    D.deeds.filter(on).forEach(function (d) { items.push(T.adminKinds.deed + ' ' + d.deedNo); });
    D.namjari.filter(on).forEach(function (n) { items.push(T.adminKinds.namjari + ' ' + n.caseNo); });
    if (!items.length) return '';
    return '<div class="notice admin-used" role="note">' + I.info + '<span><b>' + esc(T.adminUsedTitle) + '</b> ' + esc(T.adminUsedText) +
      '<span class="admin-used-list">' + items.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</span></span></div>';
  }

  /* ----- History ----- */
  function historyScreen() {
    var T = t(), res = state.result, d = U.resultData(), mz = res.plot.mouzaId, dag = res.plot.dag;
    var flagged = {};
    res.findings.forEach(function (fd) {
      var ev = fd.evidence, list = [].concat(ev.deeds || [], ev.saleDeeds || [], ev.acquiredDeed || [], ev.boughtDeed || [], ev.soldDeed || [], ev.deed || []);
      list.forEach(function (x) { if (x && x.id && (!flagged[x.id] || fd.level === 'high')) flagged[x.id] = fd.level; });
      (ev.cases || []).forEach(function (c) { flagged[c.caseNo] = fd.level; });
    });
    var events = [];
    if (res.khatian) events.push({ date: res.khatian.recordDate, cls: '', text: T.histKhatian({ survey: res.khatian.survey, owners: res.khatian.owners.map(function (o) { return f.person(o.personId) + ' ' + f.num(o.share); }).join(', ') }, f) });
    d.deeds.filter(function (x) { return x.mouzaId === mz && x.dag === dag; }).forEach(function (x) {
      events.push({ date: x.date, cls: flagged[x.id] || '', text: T.histDeed({ seller: f.person(x.sellerId), buyer: f.person(x.buyerId), area: x.area, deedNo: x.deedNo }, f) });
    });
    d.namjari.filter(function (n) { return n.mouzaId === mz && n.dag === dag; }).forEach(function (n) {
      events.push({ date: n.date, cls: flagged[n.caseNo] || '', text: T.histNamjari({ caseNo: n.caseNo, applicant: f.person(n.applicantId), status: T.status[n.status] }) });
    });
    events.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var html = '<div class="page narrow jr-page"><h1 class="page-title">' + esc(T.histTitle) + '</h1><p class="page-lead">' + esc(mouzaName(mz)) + ' · ' + esc(T.rDag) + ' ' + esc(f.num(dag)) + '</p><div class="card-soft" style="padding:18px 18px 2px;margin-top:16px"><ul class="timeline" style="margin-top:0">' +
      events.map(function (ev) { return '<li class="' + ev.cls + '"><div class="date">' + esc(f.dateLong(ev.date)) + '</div><div class="what">' + esc(ev.text) + '</div></li>'; }).join('') + '</ul></div>' +
      '<div class="disclaimer"><b>' + I.alert + esc(T.disclaimerTitle) + '</b>' + esc(T.disclaimer) + '</div></div>';
    return { html: html, bar: '<div class="inner single"><a class="btn btn-light" href="#/result">' + I.back + esc(T.backToResult) + '</a></div>' };
  }

  /* ----- Report (printable) ----- */
  function reportScreen() {
    var T = t(), res = state.result, now = new Date();
    if (!state.result._ref) { state.reportNo += 1; state.result._ref = 'TS-' + String(state.reportNo).padStart(4, '0'); }
    var stamp = f.dateLong(todayISO()) + ', ' + f.timeOfDay(now);
    var html = '<div class="page mid jr-page"><div class="no-print" style="margin-bottom:12px"><button class="btn btn-primary" data-act="print">' + I.printer + esc(T.print) + '</button></div>' +
      '<article class="report"><div class="wm" aria-hidden="true"><span data-wm="' + esc(T.watermark) + '"></span></div>' +
      '<div style="display:flex;align-items:center;gap:10px">' + I.logo.replace('<svg', '<svg style="width:36px;height:36px"') + '<div><h1>' + esc(T.reportTitle) + '</h1><div class="muted small">TerraShield · ' + esc(T.sampleBadge) + '</div></div></div>' +
      '<table><tr><td>' + esc(T.reportRef) + '</td><td>' + esc(res._ref) + '</td></tr><tr><td>' + esc(T.reportDate) + '</td><td>' + esc(stamp) + '</td></tr>' +
      '<tr><td>' + esc(T.rPlace) + '</td><td>' + esc(TS.data.district.name[state.lang] + ' › ' + TS.data.upazila.name[state.lang] + ' › ' + mouzaName(res.input.mouzaId)) + '</td></tr>' +
      '<tr><td>' + esc(T.rDag) + '</td><td>' + esc(f.num(E.normalizeDigits(res.input.dag))) + '</td></tr>' +
      '<tr><td>' + esc(T.rSeller) + '</td><td>' + esc(res.input.sellerId ? f.person(res.input.sellerId) : (res.input.sellerName || '—')) + '</td></tr>' +
      '<tr><td>' + esc(T.rArea) + '</td><td>' + esc(f.num(E.normalizeDigits(res.input.area))) + ' ' + esc(T.unit) + '</td></tr>' +
      '<tr><td>' + esc(T.rDeed) + '</td><td>' + esc(res.input.sellerDeedNo || T.notGiven) + '</td></tr></table>' +
      '<h2 style="font-size:18px;margin-top:16px">' + esc(T.head[res.status]) + '</h2>' + (res.status === 'green' ? '<p style="margin:4px 0;font-weight:700">' + esc(T.greenNote) + '</p>' : '') +
      '<p style="margin:6px 0">' + esc(summaryText(res)) + '</p>' +
      res.findings.map(function (fd) { var tx = findingText(fd); return '<div class="r-finding ' + fd.level + '"><b>[' + esc(fd.level === 'info' ? T.infoOnly : T.level[fd.level]) + '] ' + esc(tx.title) + '</b><div class="small">' + esc(tx.detail) + '</div></div>'; }).join('') +
      '<h3 style="font-size:16px;margin-top:14px">' + esc(T.whatNext) + '</h3><ol class="small">' + uniqueSteps(res).map(function (k) { return '<li>' + esc(T.steps[k]) + '</li>'; }).join('') + '</ol>' +
      '<p style="margin-top:14px;font-weight:700">' + esc(T.disclaimer) + '</p><p class="small muted">' + esc(T.about) + '</p></article></div>';
    return { html: html, bar: '<div class="inner single"><a class="btn btn-light" href="#/result">' + I.back + esc(T.backToResult) + '</a></div>' };
  }
  function uniqueSteps(res) {
    var out = [];
    res.findings.forEach(function (fd) { (TS.nextStepsFor[fd.rule] || []).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); }); });
    if (!out.length) out = ['greenSteps', 'lawyer'];
    if (out.indexOf('hotline') < 0) out.push('hotline');
    return out;
  }


  U.uniqueSteps = uniqueSteps;
  U.screens.result = resultScreen;
  U.screens.evidence = evidenceScreen;
  U.screens.history = historyScreen;
  U.screens.report = reportScreen;
})(window.TS.ui);
