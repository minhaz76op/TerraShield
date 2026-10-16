/*
 * TerraShield — main.js
 * All button actions (one click listener) and app start-up.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var state = U.state, blankForm = U.blankForm, savePref = U.savePref, t = U.t, currentData = U.currentData, f = U.f, toast = U.toast, say = U.say, drawBackground = U.drawBackground, go = U.go, route = U.route, render = U.render, findPlot = U.findPlot, findKhatian = U.findKhatian, engineInput = U.engineInput, validateStep = U.validateStep, runAllTests = U.runAllTests, addDemoSale = U.addDemoSale, openVoice = U.openVoice;

  /* ======================= Named actions (used by buttons AND the Judge Mode story) ======================= */
  var actions = {
    // Open a shared test case through the real screens (checking → result).
    openSample: function (id) {
      var tc = TS.testCases.find(function (c) { return c.id === id; });
      state.result = E.check(tc.input, U.baseView()); state.resultSource = 'base'; state.fromSample = tc.id; state.showInputs = false;
      state.form = { mouzaId: tc.input.mouzaId, dag: String(tc.input.dag), sellerId: tc.input.sellerId, sellerName: tc.input.sellerName || '', notInList: !tc.input.sellerId && !!tc.input.sellerName, area: String(tc.input.area), deedNo: tc.input.sellerDeedNo || '' };
      go('#/checking');
    },
    // The scripted demo sale: Rahim Uddin sells 40 decimal of dag 101, namjari not done.
    addScriptSale: function (quiet) {
      state.demo = { mouzaId: 'M901', dag: 101, sellerId: 'O01', area: '40', namjari: false };
      addDemoSale();
      if (!quiet) toast(t().saleAdded);
    },
    // Re-check the demo plot (Rahim / dag 101 / 20 decimal = case-01 input) with any added sales.
    demoCheck: function () {
      var D = state.demo, input = { mouzaId: D.mouzaId, dag: Number(D.dag), sellerId: D.sellerId, area: 20 };
      if (D.mouzaId === 'M901' && Number(D.dag) === 101) input = TS.testCases[0].input;
      state.result = E.check(input, U.baseView()); state.resultSource = 'base'; state.fromSample = null;
      state.form = { mouzaId: input.mouzaId, dag: String(input.dag), sellerId: input.sellerId, sellerName: '', notInList: false, area: String(input.area), deedNo: '' };
      go('#/checking');
    },
    runTests: function () { return runAllTests(); }
  };
  U.actions = actions;

  /* ======================= Actions (event delegation) ======================= */
  document.addEventListener('click', function (e) {
    // In Judge Mode, touching the live screen pauses the story (the judge wants to look/explain).
    if (state.story.active && e.target.closest('#screen-host') && state.story.playing) U.story.pause(true);
    var b = e.target.closest('[data-act]'); if (!b || b.closest('#sheet')) return;
    var a = b.getAttribute('data-act'), F = state.form, r = route();
    switch (a) {
      case 'theme': U.setTheme(!U.isDark()); render(); break;
      case 'calc-tu': case 'calc-share': case 'calc-use': U.calcAction(a, b); break;
      case 'menu': state.menuOpen = !state.menuOpen; render(); break;
      case 'skip-main': e.preventDefault(); var m = document.getElementById('view'); m.focus(); break;
      case 'story-toggle': U.story.toggle(); break;
      case 'story-prev': U.story.goStep(state.story.step - 1); break;
      case 'story-next': U.story.goStep(state.story.step + 1); break;
      case 'story-restart': U.story.restart(); break;
      case 'story-goto': U.story.goStep(Number(b.getAttribute('data-i'))); break;
      case 'story-exit': e.preventDefault(); U.story.stop(); break;
      case 'back': history.length > 1 ? history.back() : go('#/'); break;
      case 'home': go('#/'); break;
      case 'lang': state.lang = state.lang === 'bn' ? 'en' : 'bn'; savePref('ts-lang', state.lang); render(); break;
      case 'voice': state.voiceOn = !state.voiceOn; savePref('ts-voice', state.voiceOn ? 'on' : 'off'); if (!state.voiceOn) V.stopSpeaking(); render(); break;
      case 'say': say(b.getAttribute('data-text')); break;
      case 'say-result': say(state._spoken); break;
      case 'mouza': F.mouzaId = b.getAttribute('data-id'); F.sellerId = null; F.notInList = false; delete state.errors.mouza; render(); break;
      case 'seller': F.sellerId = b.getAttribute('data-id'); F.notInList = false; F.sellerName = ''; delete state.errors.seller; render(); break;
      case 'notinlist': F.notInList = true; F.sellerId = null; delete state.errors.seller; render(); setTimeout(function () { var el = document.getElementById('f-sname'); if (el) el.focus(); }, 50); break;
      case 'area-inc': case 'area-dec': {
        var cur = E.parseNumber(F.area); if (isNaN(cur)) cur = 0;
        cur = Math.max(0, Math.round((cur + (a === 'area-inc' ? 1 : -1)) * 100) / 100);
        F.area = f.num(cur); delete state.errors.area; var el = document.getElementById('f-area'); if (el) { el.value = F.area; el.setAttribute('aria-invalid', 'false'); }
        var er = document.getElementById('err-area'); if (er) er.remove(); break;
      }
      case 'mic': openVoice(b.getAttribute('data-field')); break;
      case 'prev': go('#/step/' + (Number(r.arg) - 1)); break;
      case 'goto': state.errors = {}; go('#/step/' + b.getAttribute('data-step')); break;
      case 'skip': F.deedNo = ''; state.errors = {}; go('#/review'); break;
      case 'next': {
        var n = Number(b.getAttribute('data-step'));
        if (!validateStep(n)) { render(); var inv = document.querySelector('[aria-invalid="true"]'); if (inv) inv.focus(); break; }
        if (n === 2 && !findPlot()) { // land not in data → grey result straight away (with "did you mean")
          state.fromSample = null; state.result = E.check(Object.assign(engineInput(), { area: F.area || '1' }), currentData()); state.resultSource = 'live'; go('#/result'); break;
        }
        if (n === 2 && F.sellerId && !findKhatian().owners.some(function (o) { return o.personId === F.sellerId; })) F.sellerId = null;
        go(n < 5 ? '#/step/' + (n + 1) : '#/review'); break;
      }
      case 'run': {
        var res = E.check(engineInput(), currentData());
        if (res.status === 'invalid') { // should not happen after step checks; send user to the first bad step
          state.errors = {}; res.errors.forEach(function (x) { state.errors[x.field] = x; });
          var first = res.errors[0].field; go('#/step/' + ({ mouza: 1, dag: 2, seller: 3, area: 4, deedNo: 5 }[first] || 1)); break;
        }
        state.result = res; state.resultSource = 'live'; state.fromSample = null; state.showInputs = false; go('#/checking'); break;
      }
      case 'new': state.form = blankForm(); state.errors = {}; state.result = null; state.fromSample = null; go('#/step/1'); break;
      case 'pickdag': F.dag = f.num(b.getAttribute('data-dag')); state.errors = {}; go('#/step/3'); break;
      case 'pickdag-inline': {   // tap a suggested dag on the dag step: fill the box, stay on the step
        F.dag = f.num(b.getAttribute('data-dag')); delete state.errors.dag;
        var di = document.getElementById('f-dag'); if (di) { di.value = F.dag; di.setAttribute('aria-invalid', 'false'); di.focus(); }
        var de = document.getElementById('err-dag'); if (de) de.remove();
        U.paintDagLookup(); break;
      }
      case 'toggle-inputs': state.showInputs = !state.showInputs; render(); break;
      case 'print': window.print(); break;
      case 'sample': actions.openSample(b.getAttribute('data-id')); break;
      case 'demo-nj': state.demo.namjari = b.getAttribute('data-v') === '1'; render(); break;
      case 'demo-add': if (addDemoSale()) { toast(t().saleAdded); render(); } break;
      case 'demo-script': actions.addScriptSale(false); render(); break;
      case 'demo-check': actions.demoCheck(); break;
      case 'demo-reset': state.extraDeeds = []; state.extraNamjari = []; state.testRun = null; toast(t().resetDone); render(); break;
      case 'run-tests': actions.runTests(); render(); setTimeout(function () { var s = document.querySelector('.big-score'); if (s) s.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); break;
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'd-plot') {
      var p = e.target.value.split('|'); state.demo.mouzaId = p[0]; state.demo.dag = Number(p[1]);
      var k = TS.baseData.khatians.find(function (x) { return x.mouzaId === p[0] && x.dag === Number(p[1]); });
      state.demo.sellerId = k ? k.owners[0].personId : null; render();
    }
    if (e.target.id === 'd-seller') state.demo.sellerId = e.target.value;
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'd-area') state.demo.area = e.target.value; });
  document.addEventListener('keydown', function (e) {
    // Arrow keys move between radio-style choices (mouza, seller), as screen-reader users expect.
    var radio = e.target.closest && e.target.closest('[role="radio"]');
    if (radio && ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].indexOf(e.key) >= 0) {
      var all = Array.prototype.slice.call(radio.closest('[role="radiogroup"]').querySelectorAll('[role="radio"]'));
      var i = all.indexOf(radio) + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1);
      var nxt = all[(i + all.length) % all.length]; e.preventDefault(); nxt.focus(); nxt.click();
      setTimeout(function () { var again = document.querySelector('[role="radio"][data-id="' + nxt.getAttribute('data-id') + '"]') || document.querySelector('[data-act="notinlist"]'); if (again) again.focus(); }, 0);
      return;
    }
    if (e.key === 'Escape' && state.menuOpen) { state.menuOpen = false; render(); return; }
    if (e.key === 'Escape') { var s = document.getElementById('sheet'); if (s && !s.hidden) { var c = s.querySelector('[data-act="sheet-close"],[data-act="sheet-type"]'); if (c) c.click(); } }
  });

  window.addEventListener('hashchange', function () { state.menuOpen = false; render(); });
  // Server data arrived (npm start): redraw once so the footer and checks use it — unless the person is typing.
  window.addEventListener('ts-data', function (e) {
    var a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if (e.detail && e.detail.first && !typing && !state.story.active) render();
  });
  // Follow the device's light/dark setting until the person chooses one.
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (m) { var saved = null; try { saved = localStorage.getItem('ts-theme'); } catch (x) {} if (!saved) { document.documentElement.classList.toggle('dark', m.matches); render(); } }); } catch (x) { /* old browser */ }
  drawBackground();
  render();
})(window.TS.ui);
