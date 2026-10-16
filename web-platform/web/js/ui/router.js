/*
 * TerraShield — ui/router.js
 * Hash router (#/step/2, #/result …) and the page frame: demo strip, site header
 * (nav, hotline, Judge Mode, language, voice, theme, mobile menu), footer.
 * In Judge Mode story (#/judge) the app's #scope is moved inside the phone frame.
 */
(function (U) {
  'use strict';
  var TS = window.TS, V = TS.voice;
  var state = U.state, t = U.t, f = U.f, esc = U.esc, I = U.I;

  var STEPS = ['mouza', 'dag', 'seller', 'area', 'deed'];
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function route() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/');
    return { name: parts[0] || 'home', arg: parts[1], arg2: parts[2] };
  }

  function render() {
    V.stopSpeaking();
    var r = route(), view;
    if (r.name === 'judge') { U.story.start(); return; }       // story picks the next app screen itself
    if (['result', 'evidence', 'history', 'report'].indexOf(r.name) >= 0 && !state.result) r = { name: 'home' };
    switch (r.name) {
      case 'step': view = U.screens.step(Math.max(1, Math.min(5, Number(r.arg) || 1))); break;
      case 'review': view = U.screens.review(); break;
      case 'checking': view = U.screens.checking(); break;
      case 'result': view = U.screens.result(); break;
      case 'evidence': view = U.screens.evidence(Number(r.arg) || 0); break;
      case 'history': view = U.screens.history(); break;
      case 'report': view = U.screens.report(); break;
      case 'samples': view = U.screens.samples(); break;
      case 'help': view = U.screens.help(); break;
      case 'calc': view = r.arg === 'guide' ? U.screens.guide() : U.screens.calc(); break;
      case 'admin': view = U.screens.admin(r.arg, r.arg2); break;
      default: view = U.screens.home(); r.name = 'home';
    }
    document.documentElement.lang = state.lang;
    document.title = 'TerraShield — ' + t().appTagline;
    frame(r.name);
    var main = document.getElementById('view');
    main.innerHTML = view.html;
    document.getElementById('bar').innerHTML = view.bar || '';
    document.getElementById('nav').innerHTML = view.nav ? bottomNav(r.name) : '';
    window.scrollTo(0, 0);
    var host = document.getElementById('screen-host'); if (host) host.scrollTop = 0;
    if (!state.story.active) {
      var focusEl = main.querySelector('h1, h2'); if (focusEl) { focusEl.setAttribute('tabindex', '-1'); focusEl.focus({ preventScroll: true }); }
    }
    if (view.after) view.after();
  }

  /* ---------- Page frame ---------- */
  function frame(name) {
    document.getElementById('demostrip').textContent = t().demoStrip;
    var header = document.getElementById('header');
    header.innerHTML = state.story.active ? storyHeader() : siteHeader(name);
    header.classList.toggle('open', !!state.menuOpen && !state.story.active);
    document.getElementById('footer').innerHTML = '<div class="wrap"><span>' + esc(t().footerLeft) + '</span><span>' + esc(t().footerRight) +
      ' · <a class="footer-admin" href="#/admin">' + esc(t().footerAdmin) + '</a></span></div>';
    document.getElementById('apphead').innerHTML = '<span class="logo">' + I.logo + '</span><b>TerraShield</b><span style="flex:1"></span><span class="tag-sim">' + esc(t().sampleBadge) + '</span>';
    placeScope();
    if (state.story.active) U.story.paint();
  }

  // Move the app (#scope) into the phone frame while the story runs, and back afterwards.
  function placeScope() {
    var scope = document.getElementById('scope'), host = document.getElementById('screen-host');
    document.body.classList.toggle('story', state.story.active);
    if (state.story.active && host && scope.parentNode !== host) { host.appendChild(scope); scope.classList.add('in-frame'); }
    if (!state.story.active && scope.parentNode !== document.body) {
      document.body.insertBefore(scope, document.getElementById('footer'));
      scope.classList.remove('in-frame');
    }
  }

  function navLink(href, key, current, label) {
    return '<a href="' + href + '"' + (key === current ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';
  }
  function themeBtn() {
    var dark = U.isDark();
    return '<button class="icon-btn" data-act="theme" aria-label="' + esc(dark ? t().themeLight : t().themeDark) + '" title="' + esc(dark ? t().themeLight : t().themeDark) + '">' + (dark ? I.sun : I.moon) + '</button>';
  }
  function langBtn() {
    return '<button class="lang-btn" data-act="lang" aria-label="' + esc(t().langSwitch) + '">' + I.lang + '<span lang="' + (state.lang === 'bn' ? 'en' : 'bn') + '">' + (state.lang === 'bn' ? 'EN' : 'বাং') + '</span></button>';
  }
  function voiceBtn() {
    var on = state.voiceOn, label = on ? t().voiceOn : t().voiceOff;
    return '<button class="icon-btn" data-act="voice" aria-pressed="' + on + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + (on ? I.speaker : I.speakerOff) + '</button>';
  }
  function siteHeader(name) {
    var T = t(), cur = name === 'step' || name === 'review' || name === 'checking' || name === 'result' || name === 'evidence' || name === 'history' || name === 'report' ? 'check' : name;
    return '<div class="wrap">' +
      '<a class="brand" href="#/" aria-label="TerraShield — ' + esc(T.home) + '"><span class="logo">' + I.logo + '</span><span><b>TerraShield</b><small>' + esc(T.brandSub) + '</small></span></a>' +
      '<nav class="site-nav" aria-label="Main">' + navLink('#/step/1', 'check', cur, T.navCheck) + navLink('#/samples', 'samples', cur, T.navSamples) + navLink('#/calc', 'calc', cur, T.navCalc) + navLink('#/help', 'help', cur, T.navHelp) + '</nav>' +
      '<span class="spacer"></span>' +
      (state.judge ? '<span class="hdr-pill judge-on hdr-hide-sm" title="Judge mode">' + I.flask + '<span class="sr-only">Judge</span></span>' : '') +
      // (v3) the hotline pill left the desktop header to make room for Admin Panel — 16122 stays in the hero, footer, wizard card and ☰ menu
      '<a class="hdr-pill brand-solid hdr-hide-tab" href="#/judge">' + I.present + esc(T.judgeBtn) + '</a>' +
      '<a class="hdr-pill hdr-admin hdr-hide-mid" href="#/admin"' + (name === 'admin' ? ' aria-current="page"' : '') + '>' + I.shield + '<span>' + esc(T.adminNav) + '</span></a>' +
      langBtn() + voiceBtn() + themeBtn() +
      '<button class="icon-btn menu-btn" data-act="menu" aria-expanded="' + !!state.menuOpen + '" aria-label="' + esc(T.menu) + '">' + (state.menuOpen ? I.x : I.menu) + '</button>' +
      '</div>' +
      '<div class="mobile-menu">' +
        '<a href="#/step/1">' + I.search + esc(T.navCheck) + '</a><a href="#/samples">' + I.grid + esc(T.navSamples) + '</a><a href="#/calc">' + I.calc + esc(T.navCalc) + '</a><a href="#/help">' + I.help + esc(T.navHelp) + '</a>' +
        '<a href="#/judge">' + I.present + esc(T.judgeBtn) + '</a><a href="#/admin" class="mm-admin">' + I.shield + esc(T.adminNav) + '</a><a href="tel:' + TS.config.landHotline + '">' + I.phone + esc(T.hotlineLand) + ' ' + esc(f.num(TS.config.landHotline)) + '</a>' +
      '</div>';
  }
  function storyHeader() {
    var T = t();
    return '<div class="wrap">' +
      '<a class="brand" href="#/" data-act="story-exit" aria-label="TerraShield"><span class="logo">' + I.logo + '</span></a>' +
      '<b class="story-tag" style="font-size:17px">' + I.present.replace('<svg', '<svg style="width:20px;height:20px;color:var(--brand-700)"') + esc(T.storyTitle) + '</b>' +
      '<span class="tag-sim hdr-hide-sm">' + esc(T.storyTag) + '</span>' +
      '<span class="spacer"></span>' + langBtn() + themeBtn() +
      '<button class="hdr-pill" data-act="story-exit">' + I.x + '<span class="hdr-hide-sm">' + esc(T.exitStory) + '</span></button></div>';
  }

  function bottomNav(name) {
    function a(href, key, icon, label) { return '<a href="' + href + '"' + (name === key ? ' aria-current="page"' : '') + '>' + icon + '<span>' + esc(label) + '</span></a>'; }
    return '<div class="inner">' + a('#/', 'home', I.home, t().home) + a('#/samples', 'samples', I.grid, t().samples) + a('#/help', 'help', I.help, t().help) + '</div>';
  }
  function listenBtn(text) { return '<button class="icon-btn" data-act="say" data-text="' + esc(text) + '" aria-label="' + esc(t().listen) + '" title="' + esc(t().listen) + '">' + I.speaker + '</button>'; }

  U.STEPS = STEPS; U.go = go; U.route = route; U.render = render; U.bottomNav = bottomNav; U.listenBtn = listenBtn; U.frame = frame;
})(window.TS.ui);
