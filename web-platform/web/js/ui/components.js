/*
 * TerraShield — ui/components.js
 * Reusable building blocks: progress dots, errors, action bar, result texts, area bar, evidence cards.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var state = U.state, t = U.t, currentData = U.currentData, f = U.f, mouzaName = U.mouzaName, esc = U.esc, I = U.I;

  function progress(n) {
    var dots = ''; for (var i = 1; i <= 5; i++) dots += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return '<div class="progress" aria-label="' + esc(t().stepOf(n, 5, f)) + '"><div class="dots" aria-hidden="true">' + dots + '</div><span class="label">' + esc(t().stepOf(n, 5, f)) + '</span></div>';
  }
  function errHtml(field) {
    var e = state.errors[field]; if (!e) return '';
    var msg = typeof t().err[e.code] === 'function' ? t().err[e.code](e.params || {}, f) : t().err[e.code];
    return '<p class="error-text" role="alert" id="err-' + field + '">' + I.alert + '<span>' + esc(msg) + '</span></p>';
  }
  // Bottom action bar for wizard steps: [Back] [Next →]
  function bar(backAct, step) {
    return '<div class="inner"><button class="btn btn-light" data-act="' + backAct + '">' + I.back + esc(t().back) + '</button>' +
      '<button class="btn btn-primary" data-act="next" data-step="' + step + '">' + esc(t().next) + I.next + '</button></div>';
  }
  function micAllowed() { return state.lang === 'bn' && V.recognitionSupported(); }

  /* ----- Result ----- */
  function findingText(fd) { var R = t().rules[fd.rule]; return { title: R.t, detail: R.d(fd.evidence, f) }; }
  function summaryText(res) {
    var T = t(), S = T.summary;
    if (res.status === 'grey') return T.head.grey + '।';
    var main = res.findings.filter(function (x) { return x.level !== 'info'; });
    var parts = [S[res.status]];
    main.slice(0, 3).forEach(function (x) { parts.push(findingText(x).title + (state.lang === 'bn' ? '।' : '.')); });
    if (res.status !== 'green') parts.push(S.advice);
    return parts.join(' ');
  }
  function areaBar(c) {
    if (!c) return '';
    var T = t(), S = Math.max(c.S, 0.0001), sold = Math.min(Math.max(c.A, 0), S), left = Math.max(c.L, 0);
    var scale = Math.max(S, c.W + (c.S - left)), pct = function (x) { return (x / scale * 100).toFixed(2) + '%'; };
    var wantStart = sold, fits = c.W <= left + E.TOLERANCE;
    var over = Math.max(0, c.W - left);
    return '<div class="areabar" role="img" aria-label="' + esc(T.bar.owns + ' ' + f.num(c.S) + ', ' + T.bar.sold + ' ' + f.num(c.A) + ', ' + T.bar.left + ' ' + f.num(left) + ', ' + T.bar.want + ' ' + f.num(c.W)) + '">' +
      '<div class="track">' + (sold > 0 ? '<div class="seg sold" style="width:' + pct(sold) + '">' + esc(f.num(c.A)) + '</div>' : '') +
      (left > 0 ? '<div class="seg left" style="width:' + pct(left) + (sold > 0 ? '' : ';border-radius:10px 0 0 10px') + ';border-radius:' + (sold > 0 ? '0 10px 10px 0' : '10px') + '">' + esc(f.num(left)) + '</div>' : '') +
      '<div class="want' + (fits ? ' fits' : '') + '" style="left:' + pct(wantStart) + ';width:' + pct(c.W) + '"></div></div>' +
      '<div class="legend"><span><i style="background:#8aa497"></i>' + esc(T.bar.sold) + ': ' + esc(f.num(c.A)) + '</span><span><i style="background:var(--brand-500)"></i>' + esc(T.bar.left) + ': ' + esc(f.num(left)) + '</span><span><i style="border:2px dashed ' + (fits ? 'var(--brand-700)' : 'var(--crit-600)') + '"></i>' + esc(T.bar.want) + ': ' + esc(f.num(c.W)) + '</span><span class="muted">' + esc(T.bar.owns) + ': ' + esc(f.num(c.S)) + ' ' + esc(T.unit) + '</span></div>' +
      (over > E.TOLERANCE ? '<div class="over">' + esc(T.bar.over(Math.round(over * 100) / 100, f)) + '</div>' : '') + '</div>';
  }
  function nextStepsHtml(keys, open) {
    if (!keys.length) return '';
    return '<details class="next-steps"' + (open ? ' open' : '') + '><summary>' + I.next + esc(t().whatNext) + '</summary><ol>' +
      keys.map(function (k) { return '<li>' + esc(t().steps[k]) + '</li>'; }).join('') + '</ol></details>';
  }


  /* ----- Evidence ----- */
  function evCard(icon, title, rows, extraCls) {
    return '<div class="ev-card ' + (extraCls || '') + '"><h3>' + icon + esc(title) + '</h3><dl>' + rows.map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd>' + (r[2] ? '<span class="hl">' + esc(r[1]) + '</span>' : esc(r[1])) + '</dd>'; }).join('') + '</dl></div>';
  }
  function deedCard(d, hl) {
    var T = t(); hl = hl || {};
    var nj = (U.resultData().namjari).find(function (n) { return n.deedId === d.id && n.status === 'approved'; });
    return evCard(I.doc, T.deedCard(d.deedNo, f) + (d._src === 'admin' ? ' · ' + T.adminTag : ''), [
      [T.fDate, f.date(d.date), hl.date], [T.fSeller, f.person(d.sellerId), hl.seller], [T.fBuyer, f.person(d.buyerId), hl.buyer],
      [T.fDag, f.num(d.dag) + ' (' + mouzaName(d.mouzaId) + ')', hl.dag], [T.fArea, f.num(d.area) + ' ' + T.unit, hl.area],
      [T.fNamjari, nj ? T.done + ' (' + nj.caseNo + ')' : T.notDone, hl.namjari && !nj]]);
  }
  function khatianCard(k, hlOwner, hlTotal) {
    var T = t(), rows = [[T.fDate, f.date(k.recordDate)]];
    k.owners.forEach(function (o) { rows.push([T.fOwner, f.person(o.personId) + ' — ' + f.num(o.share) + ' ' + T.unit, hlOwner === o.personId || hlOwner === '*']); });
    if (hlTotal !== undefined) rows.push([T.fTotal, f.num(hlTotal) + ' ' + T.unit, true]);
    return evCard(I.book, T.khatianCard(k.khatianNo, f) + ' · ' + f.survey(k.survey), rows);
  }
  var link = function () { return '<div class="ev-link" aria-hidden="true">' + I.swap + '<span>' + esc(t().mismatch) + '</span></div>'; };


  U.progress = progress; U.errHtml = errHtml; U.bar = bar; U.micAllowed = micAllowed; U.findingText = findingText; U.summaryText = summaryText; U.areaBar = areaBar; U.nextStepsHtml = nextStepsHtml; U.evCard = evCard; U.deedCard = deedCard; U.khatianCard = khatianCard; U.link = link;
})(window.TS.ui);
