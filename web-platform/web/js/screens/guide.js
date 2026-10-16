/*
 * TerraShield — screens/guide.js
 * Beginner's land-document guide (#/calc/guide), reached from the calculator's tab bar,
 * the homepage hero and the help page. Read-only teaching content: no data, no engine calls.
 * In-page links are buttons (data-jump) because the app uses the URL hash for routing.
 */
(function (U) {
  'use strict';
  var t = U.t, f = U.f, esc = U.esc, I = U.I;

  // Tab bar shared by the calculator and the guide.
  function calcTabs(current) {
    var G = t().guide;
    function tab(href, key, icon, label) { return '<a href="' + href + '"' + (key === current ? ' aria-current="page"' : '') + '>' + icon + '<span>' + esc(label) + '</span></a>'; }
    return '<nav class="calc-tabs" aria-label="' + esc(G.tabsLabel) + '">' + tab('#/calc', 'calc', I.calc, G.tabCalc) + tab('#/calc/guide', 'guide', I.book, G.tabGuide) + '</nav>';
  }

  function concept(c, G) {
    var list = function (k, items) { return items ? '<h3>' + esc(G[k]) + '</h3><ul class="guide-list">' + items.map(function (x) { return '<li>' + I.check + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' : ''; };
    var status = c.status ? '<h3>' + esc(G[c.listK]) + '</h3><dl class="guide-status">' + c.status.map(function (s, i) {
      return '<div><dt class="st-' + ['ok', 'wait', 'no', 'none'][i] + '">' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>';
    }).join('') + '</dl>' : list(c.listK, c.list);
    return '<article class="card guide-concept" id="g-' + c.id + '" tabindex="-1" aria-labelledby="gh-' + c.id + '">' +
      '<div class="gc-head"><span class="icon-tile solid">' + I[c.icon] + '</span><div><h2 id="gh-' + c.id + '">' + esc(c.title) + '</h2><p class="aka">' + esc(c.aka) + '</p></div></div>' +
      '<p class="gc-what"><b>' + esc(G.whatK) + ':</b> ' + esc(c.what) + '</p>' +
      status + (c.list2 ? list(c.list2K, c.list2) : '') +
      '<div class="guide-example"><p class="k">' + I.info + esc(G.exampleK) + '</p><p>' + esc(c.example) + '</p></div>' +
      (c.cta ? '<p class="gc-cta"><a href="' + c.cta[0] + '">' + I.calc + esc(c.cta[1]) + I.arrowRight + '</a></p>' : '') +
      '</article>';
  }

  function guideScreen() {
    var T = t(), G = T.guide;
    var toc = G.concepts.map(function (c) { return ['g-' + c.id, c.title]; }).concat([['g-steps', G.stepsTitle], ['g-mistakes', G.mistakesTitle], ['g-checklist', G.checklistTitle]]);
    var html = '<div class="page jr-page guide-page">' + calcTabs('guide') +
      '<p class="eyebrow">' + I.book + esc(G.eyebrow) + '</p>' +
      '<h1 class="page-title" style="margin-top:12px">' + esc(G.title) + '</h1>' +
      '<p class="page-lead guide-lead">' + esc(G.lead) + '</p>' +
      '<div class="guide-edu" role="note"><span class="icon-tile warn">' + I.alert + '</span><div><b>' + esc(G.eduTitle) + '</b><p>' + esc(G.eduText) + '</p></div></div>' +
      '<nav class="guide-toc" aria-label="' + esc(G.onPage) + '"><p class="label">' + esc(G.onPage) + '</p><div>' +
        toc.map(function (x) { return '<button type="button" class="chip" data-jump="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></nav>' +
      '<div class="guide-grid">' + G.concepts.map(function (c) { return concept(c, G); }).join('') + '</div>' +
      '<section class="guide-steps-wrap" id="g-steps" tabindex="-1" aria-labelledby="gh-steps"><h2 id="gh-steps" class="h-display">' + esc(G.stepsTitle) + '</h2><p class="muted">' + esc(G.stepsSub) + '</p>' +
        '<ol class="guide-steps">' + G.steps.map(function (s, i) {
          return '<li><span class="n" aria-hidden="true">' + esc(f.num(i + 1)) + '</span><div><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p></div></li>';
        }).join('') + '</ol></section>' +
      '<div class="guide-two">' +
        '<section class="card guide-mistakes" id="g-mistakes" tabindex="-1" aria-labelledby="gh-mis"><h2 id="gh-mis">' + I.xCircle + esc(G.mistakesTitle) + '</h2><ul>' +
          G.mistakes.map(function (m) { return '<li>' + I.x + '<span>' + esc(m) + '</span></li>'; }).join('') + '</ul></section>' +
        '<section class="card guide-check" id="g-checklist" tabindex="-1" aria-labelledby="gh-chk"><h2 id="gh-chk">' + I.checkCircle + esc(G.checklistTitle) + '</h2><p class="muted small">' + esc(G.checklistSub) + '</p><ul>' +
          G.checklist.map(function (c, i) { return '<li><label><input type="checkbox" id="gchk-' + i + '"><span>' + esc(c) + '</span></label></li>'; }).join('') + '</ul>' +
          '<p class="gc-note">' + I.info + '<span>' + esc(G.checklistNote) + '</span></p></section>' +
      '</div>' +
      '<div class="card guide-practice"><div><h2>' + esc(G.practiceTitle) + '</h2><p class="muted">' + esc(G.practiceText) + '</p></div>' +
        '<div class="cta-row" style="margin-top:12px"><a class="btn btn-primary" href="#/step/1">' + I.search + esc(G.practiceCheck) + '</a><a class="btn btn-secondary" href="#/samples">' + I.grid + esc(G.practiceSamples) + '</a><a class="btn btn-ghost" href="#/calc">' + I.calc + esc(G.practiceCalc) + '</a></div></div>' +
      '<div class="disclaimer"><b>' + I.alert + esc(G.eduTitle) + '</b>' + esc(G.eduText) + '</div>' +
      '</div>';
    return { html: html, nav: true, after: bind };
  }

  function bind() {
    var page = document.querySelector('.guide-page'); if (!page) return;
    page.addEventListener('click', function (e) {
      var b = e.target.closest('[data-jump]'); if (!b) return;
      var target = document.getElementById(b.getAttribute('data-jump')); if (!target) return;
      var smooth = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      target.focus({ preventScroll: true });
    });
  }

  U.calcTabs = calcTabs;
  U.screens.guide = guideScreen;
})(window.TS.ui);
