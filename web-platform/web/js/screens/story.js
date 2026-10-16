/*
 * TerraShield — screens/story.js : Judge Mode story player (#/judge)
 * Plays the REAL app inside a phone frame, in 6 steps of 10 seconds (60-second loop):
 *   1 the problem → 2 clean land (green) → 3 seller sells again (demo deed) →
 *   4 same check turns red (R1 + R2) → 5 evidence side by side → 6 all 14 shared tests pass.
 * Each step sets up its own state, so jumping forwards/backwards always shows the right screen.
 * Touching the live screen pauses the story; the clock shows step, time and cycle.
 * Inputs are scripted, the engine and screens are the real ones. Data is fictional and
 * reset at the start of every cycle.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine;
  var state = U.state, t = U.t, f = U.f, esc = U.esc, I = U.I, currentData = U.currentData, blankForm = U.blankForm;

  var STEP_MS = 10000, STEPS = 6, TICK = 200;
  var timer = null, judgeBefore = false;

  function resetDemo() {
    state.extraDeeds = []; state.extraNamjari = []; state.testRun = null;
    state.result = null; state.fromSample = null; state.showInputs = false; state.form = blankForm(); state.errors = {};
  }
  function case01() { return TS.testCases.find(function (c) { return c.id === 'case-01'; }); }

  // What each step does to the real app.
  var ACTIONS = [
    function () { resetDemo(); U.go('#/'); },
    function () { resetDemo(); U.actions.openSample('case-01'); },
    function () {
      resetDemo();
      state.result = E.check(case01().input, U.baseView()); state.resultSource = 'base'; state.fromSample = 'case-01';
      U.actions.addScriptSale(true);
      U.go('#/history');
    },
    function () { resetDemo(); U.actions.addScriptSale(true); U.actions.demoCheck(); },
    function () {
      resetDemo(); U.actions.addScriptSale(true);
      state.result = E.check(case01().input, U.baseView()); state.resultSource = 'base'; state.fromSample = null;
      var i = state.result.findings.findIndex(function (x) { return x.rule === 'R1'; });
      U.go('#/evidence/' + Math.max(0, i));
    },
    function () {
      resetDemo(); U.actions.runTests(); U.go('#/samples');
      setTimeout(function () {
        var host = document.getElementById('screen-host'), el = host && host.querySelector('.big-score');
        if (el) host.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
      }, 350);
    }
  ];

  function enterStep(i) {
    state.story.step = i;
    ACTIONS[i]();
    paint();
  }

  function start() {
    if (!state.story.active) {
      judgeBefore = state.judge;
      state.story = { active: true, step: 0, playing: true, elapsed: 0, cycle: 1, userPaused: false };
      state.judge = true;            // show the Judge panel on the Samples screen during the story
      state.menuOpen = false;
    }
    enterStep(state.story.step);
    run();
  }
  function stop() {
    clearInterval(timer); timer = null;
    state.story.active = false; state.judge = judgeBefore;
    resetDemo();
    U.go('#/');
  }
  function run() {
    clearInterval(timer);
    timer = setInterval(function () {
      var s = state.story; if (!s.active || !s.playing) return;
      s.elapsed += TICK;
      if (s.elapsed >= STEP_MS * STEPS) { s.elapsed = 0; s.cycle += 1; enterStep(0); return; }
      var i = Math.floor(s.elapsed / STEP_MS);
      if (i !== s.step) enterStep(i); else tick();
    }, TICK);
  }
  function play() { state.story.playing = true; state.story.userPaused = false; paint(); }
  function pause(byUser) { state.story.playing = false; state.story.userPaused = !!byUser; paint(); }
  function toggle() { state.story.playing ? pause(false) : play(); }
  function goStep(i) {
    i = (i + STEPS) % STEPS;
    state.story.elapsed = i * STEP_MS;
    enterStep(i);
  }
  function restart() { state.story.cycle += 1; goStep(0); play(); }

  /* ---------- Drawing the side panel ---------- */
  function clock(ms) { var s = Math.floor(ms / 1000); return f.num(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')); }
  function paint() {
    var panel = document.getElementById('story-panel'); if (!panel || !state.story.active) return;
    var focused = panel.contains(document.activeElement) ? document.activeElement.getAttribute('data-act') + '|' + (document.activeElement.getAttribute('data-i') || '') : null;
    var T = t(), s = state.story, st = T.story[s.step];
    var list = T.story.map(function (x, i) {
      var cls = i < s.step ? 'done' : (i === s.step ? 'on' : '');
      return '<li class="' + cls + '"><button data-act="story-goto" data-i="' + i + '"' + (i === s.step ? ' aria-current="step"' : '') + '><span class="n">' + (i < s.step ? I.check : esc(f.num(i + 1))) + '</span>' + esc(x[0]) + '</button></li>';
    }).join('');
    panel.innerHTML =
      '<div class="card-soft story-now" aria-live="polite">' +
        '<div class="story-meta"><span>' + esc(T.storyStep(s.step + 1, STEPS, f)) + '</span><span class="story-clock" id="story-clock"></span></div>' +
        '<div class="story-track"><i id="story-total"></i></div>' +
        '<p class="kicker">' + I.next + esc(T.storyNow) + '</p><h2>' + esc(st[0]) + '</h2><p class="n">' + esc(st[1]) + '</p>' +
        '<div class="step-track"><i id="story-step"></i></div>' +
        (s.userPaused ? '<p class="notice" style="margin-top:12px">' + I.info + '<span>' + esc(T.pausedHint) + '</span></p>' : '') +
        '<div class="story-ctrl">' +
          '<button class="btn btn-secondary sq" data-act="story-prev" aria-label="' + esc(T.prev) + '" title="' + esc(T.prev) + '">' + I.skipBack + '</button>' +
          '<button class="btn btn-primary" data-act="story-toggle" id="story-toggle">' + (s.playing ? I.pause + esc(T.pause) : I.play + esc(T.play)) + '</button>' +
          '<button class="btn btn-secondary sq" data-act="story-next" aria-label="' + esc(T.nextStep) + '" title="' + esc(T.nextStep) + '">' + I.skipFwd + '</button>' +
          '<button class="btn btn-ghost" data-act="story-restart">' + I.refresh + esc(T.restart) + '</button>' +
        '</div></div>' +
      '<div class="card-soft story-list"><ol>' + list + '</ol></div>' +
      '<p class="xs muted" style="padding:0 6px">' + esc(T.storyTag) + ' · ' + esc(T.fictionalNote) + '</p>';
    var cap = document.getElementById('stage-caption');
    if (cap) cap.innerHTML = I.monitor + '<span>' + esc(T.liveScreen) + '</span><span class="mono" style="opacity:.75">' + esc(location.hash || '#/') + '</span>';
    if (focused) { var p = focused.split('|'), el = panel.querySelector('[data-act="' + p[0] + '"]' + (p[1] ? '[data-i="' + p[1] + '"]' : '')); if (el) el.focus(); }
    tick();
  }
  function tick() {
    var s = state.story, c = document.getElementById('story-clock'); if (!c) return;
    c.textContent = clock(s.elapsed) + ' / ' + clock(STEP_MS * STEPS) + ' · ' + t().storyCycle(s.cycle, f);
    document.getElementById('story-total').style.width = (s.elapsed / (STEP_MS * STEPS) * 100).toFixed(2) + '%';
    document.getElementById('story-step').style.width = ((s.elapsed % STEP_MS) / STEP_MS * 100).toFixed(2) + '%';
  }

  U.story = { start: start, stop: stop, paint: paint, play: play, pause: pause, toggle: toggle, goStep: goStep, restart: restart, STEPS: STEPS };
})(window.TS.ui);
