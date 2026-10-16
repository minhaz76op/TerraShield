/*
 * TerraShield — screens/help.js
 * Help: glossary, FAQ, hotlines, about.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var t = U.t, f = U.f, esc = U.esc, svg = U.svg, I = U.I, listenBtn = U.listenBtn;

  /* ----- Help ----- */
  function helpScreen() {
    var T = t();
    var main = '<h2 class="section-title" style="margin-top:0">' + esc(T.glossaryTitle) + '</h2>' + T.glossary.map(function (g) { return '<details class="acc"><summary>' + I.book + esc(g[0]) + '</summary><div style="display:flex;gap:8px;align-items:flex-start"><p style="flex:1">' + esc(g[1]) + '</p>' + listenBtn(g[0] + '। ' + g[1]) + '</div></details>'; }).join('') +
      '<h2 class="section-title">' + esc(T.faqTitle) + '</h2>' + T.faq.map(function (q) { return '<details class="acc"><summary>' + I.question + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('');
    var side = '<h2 class="section-title" style="margin-top:0">' + esc(T.hotlineTitle) + '</h2>' +
      '<a class="hotline" href="tel:' + TS.config.landHotline + '"><span class="icon-tile">' + I.phone + '</span><span><span class="numtxt tnum">' + esc(f.num(TS.config.landHotline)) + '</span><br><span class="small muted">' + esc(T.hotlineLand) + '</span></span></a>' +
      (TS.config.showLegalAidHotline ? '<a class="hotline" href="tel:' + TS.config.legalAidHotline + '"><span class="icon-tile">' + I.scale + '</span><span><span class="numtxt tnum">' + esc(f.num(TS.config.legalAidHotline)) + '</span><br><span class="small muted">' + esc(T.hotlineLegal) + '</span></span></a>' : '') +
      '<h2 class="section-title">' + esc(T.aboutTitle) + '</h2><div class="card-soft" style="padding:16px"><p>' + esc(T.about) + '</p><p class="small muted" style="margin-top:10px">' + esc(T.voicePrivacy) + '</p></div>' +
      '<div class="disclaimer"><b>' + I.alert + esc(T.disclaimerTitle) + '</b>' + esc(T.disclaimer) + '</div>';
    var html = '<div class="page jr-page"><p class="eyebrow">' + I.help + esc(T.navHelp) + '</p><h1 class="page-title" style="margin-top:12px">' + esc(T.helpTitle) + '</h1>' +
      '<div class="help-grid" style="margin-top:18px"><div>' + main + '</div><aside>' + side + '</aside></div></div>';
    return { html: html, nav: true };
  }

  U.screens.help = helpScreen;
})(window.TS.ui);
