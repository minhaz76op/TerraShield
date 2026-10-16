/*
 * TerraShield — screens/home.js
 * Landing page in five sections: hero (+ illustrative example card) · the problem ·
 * how it works · the 8 rules · technology & honesty (does / never does, real vs simulated,
 * sourced facts). Every fact card links to its source; no demo numbers are shown as facts.
 */
(function (U) {
  'use strict';
  var TS = window.TS;
  var state = U.state, t = U.t, f = U.f, esc = U.esc, I = U.I, listenBtn = U.listenBtn, LEVEL_ICON = U.LEVEL_ICON;

  function secTitle(icon, eyebrow, title, sub) {
    return '<div class="sec-title"><p class="eyebrow">' + icon + esc(eyebrow) + '</p><h2 class="h-display">' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>';
  }

  // Illustrative example (labelled "উদাহরণ"); mirrors sample case 3.
  function demoCard() {
    var T = t();
    return '<div class="demo-card card-soft floaty" role="group" aria-label="' + esc(T.demoCardTitle) + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><p style="font-size:14px;font-weight:700;color:var(--brand-900)">' + esc(T.demoCardTitle) + '</p><span class="tag-sim">' + esc(T.demoCardTag) + '</span></div>' +
      '<div class="row r-input"><p class="k muted">' + I.pin + esc(T.dcInputK) + '</p><p style="margin-top:2px;font-weight:600">' + esc(T.dcInput) + '</p></div>' +
      '<div class="row r-check"><p class="k">' + I.layers + esc(T.dcCheckK) + '</p><p style="margin-top:2px;font-size:14.5px">' + esc(T.dcCheck) + '</p></div>' +
      '<div class="row r-warn"><p class="k">' + I.alert + esc(T.dcWarnK) + '</p><p style="margin-top:2px;font-weight:600;font-size:15px">' + esc(T.dcWarn) + '</p>' +
        '<div class="mini-bar" aria-hidden="true"><i style="width:75%;background:repeating-linear-gradient(135deg,#8aa497 0 5px,#7a958a 5px 10px)"></i><i style="width:25%;background:var(--brand-500)"></i>' +
        '<span style="position:absolute;left:75%;width:50%;top:-3px;bottom:-3px;border:2px dashed var(--crit-600);border-radius:6px"></span></div></div>' +
      '<div class="row r-out">' + I.stop + '<span>' + esc(T.dcOut) + '</span></div>' +
      '<p class="xs muted" style="margin-top:10px;display:flex;gap:6px;align-items:center">' + I.search.replace('<svg', '<svg style="width:15px;height:15px"') + esc(T.dcFoot) + '</p></div>';
  }

  /* ----- Hero visuals (decorative / illustrative only; all inline SVG, no images, no network) ----- */
  // Faint cadastral boundaries behind the hero band.
  function heroParcels() {
    var lines = ['M-20 120 L180 96 L230 210 L40 260 Z', 'M180 96 L420 70 L470 190 L230 210', 'M420 70 L700 92 L690 220 L470 190', 'M700 92 L980 60 L1010 200 L690 220',
      'M980 60 L1300 84 L1290 236 L1010 200', 'M40 260 L230 210 L260 380 L20 420', 'M230 210 L470 190 L520 360 L260 380', 'M470 190 L690 220 L700 400 L520 360',
      'M690 220 L1010 200 L1040 380 L700 400', 'M1010 200 L1290 236 L1320 420 L1040 380', 'M20 420 L260 380 L300 560 L-20 600', 'M260 380 L520 360 L560 560 L300 560',
      'M520 360 L700 400 L760 600 L560 560', 'M700 400 L1040 380 L1080 600 L760 600', 'M1040 380 L1320 420 L1340 640 L1080 600'];
    return '<svg class="hero-parcels" viewBox="0 0 1300 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      lines.map(function (d) { return '<path d="' + d + '"/>'; }).join('') +
      '<path class="contour" d="M-20 520 C200 470 380 560 620 500 S1000 430 1320 480"/><path class="contour" d="M-20 560 C220 510 400 600 640 540 S1020 470 1320 520"/></svg>';
  }

  // Illustrative mouza map (fictional), mirrors the example card: dag 103, 30 of 40 decimal already sold.
  function mapCard() {
    var T = t(), n = function (x) { return esc(f.num(x)); };
    var P = [['101', '20,30 170,22 160,140 18,150', '#2E6B4F', 92, 90], ['102', '170,22 318,30 304,128 160,140', '#41794F', 238, 84],
             ['104', '160,140 304,128 318,250 176,262', '#2A5F47', 240, 200], ['105', '318,30 446,24 440,152 304,128', '#3A7350', 376, 86],
             ['106', '304,128 440,152 446,250 318,250', '#2C6A50', 378, 202]];
    var parcels = P.map(function (p) {
      return '<polygon points="' + p[1] + '" fill="' + p[2] + '"/><polygon points="' + p[1] + '" fill="url(#mp-furrow)" class="mp-edge"/>' +
        '<text x="' + p[3] + '" y="' + p[4] + '" class="mp-dag">' + n(p[0]) + '</text>';
    }).join('');
    var svgMap = '<svg viewBox="0 0 464 330" class="map-svg" aria-hidden="true" focusable="false">' +
      '<defs><pattern id="mp-furrow" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><path d="M0 0 V9" stroke="rgba(255,255,255,.07)" stroke-width="3"/></pattern>' +
      '<pattern id="mp-sold" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(232,80,76,.22)"/><path d="M0 0 V8" stroke="rgba(252,165,160,.75)" stroke-width="2.2"/></pattern>' +
      '<linearGradient id="mp-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A7E3CB" stop-opacity="0"/><stop offset=".7" stop-color="#A7E3CB" stop-opacity=".16"/><stop offset="1" stop-color="#A7E3CB" stop-opacity=".45"/></linearGradient></defs>' +
      '<rect width="464" height="330" fill="#123B2D"/>' +
      '<path class="mp-outer" d="M20 30 L14 0 M170 22 L172 0 M318 30 L322 0 M446 24 L456 0 M20 30 L0 33 M18 150 L0 153 M446 24 L464 22 M440 152 L464 156 M446 250 L464 252 M30 280 L26 296 M176 262 L180 290 M318 250 L322 286 M446 250 L450 280"/>' +
      '<path d="M0 286 C120 270 250 300 464 276" class="mp-road"/><path d="M0 286 C120 270 250 300 464 276" class="mp-road-mid"/>' +
      '<path d="M-10 322 C110 300 230 336 330 314 S430 300 474 306" class="mp-river"/>' +
      parcels +
      '<polygon points="18,150 160,140 176,262 30,280" fill="#2F7058"/>' +
      '<polygon points="18,150 160,140 170,232 25,248" fill="url(#mp-sold)"/>' +
      '<polygon points="18,150 160,140 176,262 30,280" class="mp-target"/>' +
      '<g class="mp-chip" transform="translate(52 202)"><rect x="-6" y="-17" width="80" height="24" rx="12"/><text x="34" y="0">' + esc(state.lang === 'bn' ? 'দাগ ' : 'Dag ') + n('103') + '</text></g>' +
      '<g class="mp-north" transform="translate(436 52)"><circle r="15"/><path d="M0 -10 L5 4 L0 1 L-5 4 Z"/><text y="12">' + esc(T.mapNorth) + '</text></g>' +
      '<g class="mp-scale" transform="translate(328 304)"><path d="M0 0 H96 M0 -5 V5 M48 -3 V3 M96 -5 V5"/></g>' +
      '<rect class="map-scan" x="0" y="-80" width="464" height="80" fill="url(#mp-scan)"/></svg>';
    return '<figure class="map-card" role="img" aria-label="' + esc(T.mapAria) + '">' +
      '<figcaption class="map-head"><span class="map-title">' + I.layers + esc(T.mapTitle(U.mouzaName('M901'))) + '</span><span class="tag-sim">' + esc(T.mapTag) + '</span></figcaption>' +
      '<div class="map-legend" aria-hidden="true"><span><i class="lg-target"></i>' + esc(T.mapLegendCheck) + '</span><span><i class="lg-sold"></i>' + esc(T.mapLegendSold) + '</span></div>' +
      '<div class="map-frame">' + svgMap + '</div></figure>';
  }

  function homeScreen() {
    var T = t();
    var hero = '<section class="hero hero-forest">' + heroParcels() + '<div class="page"><div class="hero-grid">' +
      '<div class="jr-page hero-copy"><p class="eyebrow">' + I.shield + esc(T.heroEyebrow) + '</p>' +
        '<h1 class="h-display">' + esc(T.heroH1a) + '<br><span class="text-gradient">' + esc(T.heroH1b) + '</span></h1>' +
        '<p class="lead">' + esc(T.heroLead) + '</p>' +
        '<div class="hero-ctas"><a class="btn btn-primary btn-hero" href="#/step/1"><span class="halo">' + I.search + '</span>' + esc(T.ctaCheck) + I.arrowRight + '</a>' +
          '<a class="btn btn-secondary btn-hero" href="#/samples">' + I.grid + esc(T.heroWrite) + '</a>' +
          '<a class="btn btn-ghost btn-hero" href="#/judge">' + I.present + esc(T.judgeBtn) + '</a></div>' +
        '<p class="hero-guide"><a href="#/calc/guide">' + I.book + '<span>' + esc(T.heroGuide) + '</span>' + I.arrowRight + '</a></p>' +
        '<div class="hero-pills"><a class="pill solid" href="tel:' + TS.config.landHotline + '">' + I.phone + esc(T.pillHotline) + '</a><span class="pill fict">' + I.info + esc(T.pillFictional) + '</span>' +
          listenBtn(T.homeTitle + '. ' + T.heroLead) + '</div></div>' +
      '<div class="hero-visual">' + mapCard() + demoCard() + '</div></div>' +
      '<ul class="hero-trust jr-stagger">' + T.trust.map(function (x) { return '<li><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>' +
      '</div></section>';

    var why = '<section class="section tint"><div class="page">' + secTitle(I.alertCircle, T.whyEyebrow, T.whyTitle, T.whySub) +
      '<div class="split-why jr-stagger">' +
        ministry(I.doc, T.m1who, T.m1, T.m1d) + ministry(I.refresh, T.m2who, T.m2, T.m2d) + ministry(I.book, T.m3who, T.m3, T.m3d) + '</div>' +
      '<div class="gap-note" style="margin-top:12px">' + I.alert + '<span>' + esc(T.gapNote) + '</span></div></div></section>';

    var steps = [[I.pin, T.s1, T.s1d], [I.user, T.s2, T.s2d], [I.ruler, T.s3, T.s3d], [I.checkCircle, T.s4, T.s4d]];
    var how = '<section class="section"><div class="page">' + secTitle(I.sparkle, T.howEyebrow, T.howTitle, T.howSub) +
      '<ol class="grid-4 jr-stagger" style="list-style:none;padding:0">' + steps.map(function (s, i) {
        return '<li class="card-soft step-card lift"><span class="top"><span class="icon-tile">' + s[0] + '</span><span class="n">' + esc(f.num(String(i + 1).padStart(2, '0'))) + '</span></span><b>' + esc(s[1]) + '</b><p>' + esc(s[2]) + '</p></li>';
      }).join('') + '</ol>' +
      '<div class="cta-row"><a class="btn btn-primary" href="#/step/1">' + I.search + esc(T.tryNow) + '</a><a class="btn btn-secondary" href="#/samples">' + I.grid + esc(T.ctaSample) + '</a></div></div></section>';

    var ruleList = [['R1', 'medium'], ['R2', 'high'], ['R3', 'high'], ['R4', 'high'], ['R5', 'medium'], ['R6', 'medium'], ['R7a', 'high'], ['R7b', 'info'], ['R8c', 'high']];
    var rules = '<section class="section tint"><div class="page">' + secTitle(I.layers, T.rulesEyebrow, T.rulesTitle, T.rulesSub) +
      '<div class="grid-3 jr-stagger">' + ruleList.map(function (r) {
        return '<div class="card-soft rule-card"><span class="rid">' + r[0] + '</span><span><b>' + esc(T.rules[r[0]].t) + '</b><span class="lvl ' + r[1] + '">' + LEVEL_ICON[r[1]] + esc(r[1] === 'info' ? T.infoOnly : T.level[r[1]]) + '</span></span></div>';
      }).join('') + '</div></div></section>';

    var tag = function (k) { return k === 'real' ? '<span class="tag-real">' + esc(T.tagReal) + '</span>' : k === 'sim' ? '<span class="tag-sim">' + esc(T.tagSim) + '</span>' : '<span class="tag-future">' + esc(T.tagFuture) + '</span>'; };
    var tech = '<section class="section"><div class="page">' + secTitle(I.sparkle, T.techEyebrow, T.techTitle, T.techSub) +
      '<div class="grid-2">' +
        '<div class="card-soft does yes"><h3>' + I.checkCircle + esc(T.doesTitle) + '</h3><ul>' + T.does.map(function (x) { return '<li>' + I.check + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>' +
        '<div class="card-soft does no"><h3>' + I.xCircle + esc(T.doesNotTitle) + '</h3><ul>' + T.doesNot.map(function (x) { return '<li>' + I.x + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div></div>' +
      '<div class="card-soft" style="margin-top:12px;padding:16px"><p class="label">' + esc(T.realTitle) + '</p><div class="status-grid">' +
        T.statusItems.map(function (s) { return '<div class="status-item"><span>' + esc(s[0]) + '</span>' + tag(s[1]) + '</div>'; }).join('') + '</div>' +
        '<p class="xs muted" style="margin-top:10px;display:flex;gap:6px;align-items:center">' + I.wifiOff.replace('<svg', '<svg style="width:15px;height:15px"') + esc(T.fictionalNote) + '</p></div>' +
      '<p class="label" style="margin-top:26px">' + esc(T.factsTitle) + '</p>' +
      '<div class="grid-4 jr-stagger" style="margin-top:10px">' + T.facts.map(function (x) {
        return '<a class="card-soft fact lift" href="' + esc(x[2]) + '" target="_blank" rel="noreferrer"><b>' + esc(x[0]) + '</b><span class="d">' + esc(x[1]) + '</span><span class="src">' + esc(T.srcLabel) + I.external + '</span></a>';
      }).join('') + '</div>' +
      '<div class="cta-row"><a class="btn btn-primary" href="#/step/1">' + I.search + esc(T.ctaCheck) + '</a><a class="btn btn-secondary" href="#/judge">' + I.present + esc(T.judgeBtn) + '</a><a class="btn btn-ghost" href="#/help">' + I.help + esc(T.navHelp) + '</a></div>' +
      '</div></section>';

    return { html: hero + why + how + rules + tech, nav: true };
  }
  function ministry(icon, who, title, d) {
    return '<div class="card-soft ministry"><span class="icon-tile">' + icon + '</span><p class="who" style="margin-top:10px">' + esc(who) + '</p><b>' + esc(title) + '</b><p>' + esc(d) + '</p></div>';
  }

  U.screens.home = homeScreen;
})(window.TS.ui);
