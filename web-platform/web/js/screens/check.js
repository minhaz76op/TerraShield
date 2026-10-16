/*
 * TerraShield — screens/check.js
 * The 5-step check, review and "checking" animation.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var state = U.state, t = U.t, currentData = U.currentData, f = U.f, mouzaName = U.mouzaName, esc = U.esc, say = U.say, svg = U.svg, I = U.I, STEPS = U.STEPS, route = U.route, listenBtn = U.listenBtn, progress = U.progress, errHtml = U.errHtml, bar = U.bar, micAllowed = U.micAllowed, link = U.link;

  function stepScreen(n) {
    var T = t(), F = state.form, key = STEPS[n - 1], html = progress(n), after = null;
    var q = T.voiceQ[key];
    if (key === 'mouza') {
      html += '<div class="q"><h2>' + esc(T.qWhere) + '</h2>' + listenBtn(q) + '</div>' +
        '<div class="field"><label for="f-district">' + esc(T.district) + '</label><select id="f-district" class="select" disabled><option>' + esc(TS.data.district.name[state.lang]) + '</option></select></div>' +
        '<div class="field"><label for="f-upazila">' + esc(T.upazila) + '</label><select id="f-upazila" class="select" disabled><option>' + esc(TS.data.upazila.name[state.lang]) + '</option></select>' +
        '<p class="help-text">' + esc(T.lockedHint) + '</p></div>' +
        '<div class="field" role="radiogroup" aria-labelledby="mz-label"><label id="mz-label">' + esc(T.mouza) + '</label><div class="mouza-choices">' +
        TS.data.mouzas.map(function (m) {
          return '<button class="choice" role="radio" aria-checked="' + (F.mouzaId === m.id) + '" data-act="mouza" data-id="' + m.id + '"><span class="avatar">' + I.pin + '</span><span><span class="name">' + esc(m.name[state.lang]) + '</span><span class="sub">JL ' + esc(f.num(m.jl)) + '</span></span></button>';
        }).join('') + '</div>' + errHtml('mouza') + '</div>';
    } else if (key === 'dag') {
      html += '<div class="q"><h2>' + esc(T.qDag) + '</h2>' + listenBtn(q) + '</div>' +
        '<div class="field"><label for="f-dag" class="sr-only">' + esc(T.qDag) + '</label><div class="with-mic">' +
        '<input id="f-dag" class="input input-big" inputmode="numeric" autocomplete="off" placeholder="' + esc(T.dagPh) + '" value="' + esc(F.dag) + '" aria-invalid="' + !!state.errors.dag + '" aria-describedby="dag-help err-dag">' +
        (micAllowed() ? '<button class="mic-btn" data-act="mic" data-field="dag" aria-label="' + esc(T.speak) + '">' + I.mic + '</button>' : '') +
        '</div>' + errHtml('dag') + '<div class="lookup" id="dag-lookup" aria-live="polite">' + dagLookupHtml() + '</div>' +
        '<p class="help-text" id="dag-help">' + esc(T.dagHelp) + '</p>' +
        (!V.recognitionSupported() && state.lang === 'bn' ? '<p class="help-text">' + esc(T.noRecognition) + '</p>' : '') + '</div>';
      after = function () { bindInput('f-dag', 'dag'); paintDagLookup(); document.getElementById('f-dag').addEventListener('input', paintDagLookup); };
    } else if (key === 'seller') {
      var k = findKhatian();
      html += '<div class="q"><h2>' + esc(T.qSeller) + '</h2>' + listenBtn(q + ' ' + (k ? k.owners.map(function (o, i) { return f.num(i + 1) + '. ' + f.person(o.personId); }).join('। ') : '')) + '</div>' +
        '<p class="muted small" style="margin-top:-6px">' + esc(T.sellerSub) + (k ? ' — ' + esc(T.khatianCard(k.khatianNo, f)) : '') + '</p>' +
        '<div class="choice-list" role="radiogroup" aria-label="' + esc(T.qSeller) + '">' +
        (k ? k.owners : []).map(function (o, i) {
          return '<button class="choice" role="radio" aria-checked="' + (F.sellerId === o.personId && !F.notInList) + '" data-act="seller" data-id="' + o.personId + '">' +
            '<span class="avatar"><span class="num-tag">' + esc(f.num(i + 1)) + '</span></span><span><span class="name">' + esc(f.person(o.personId)) + '</span><span class="sub">' + esc(T.share) + ': ' + esc(f.num(o.share)) + ' ' + esc(T.unit) + '</span></span><span class="check">' + I.check + '</span></button>';
        }).join('') +
        '<button class="choice alt" role="radio" aria-checked="' + F.notInList + '" data-act="notinlist"><span class="avatar">' + I.question + '</span><span class="name">' + esc(T.notInList) + '</span><span class="check">' + I.check + '</span></button></div>' +
        (F.notInList ? '<div class="field"><label for="f-sname">' + esc(T.typeSellerName) + '</label><input id="f-sname" class="input" autocomplete="off" value="' + esc(F.sellerName) + '"></div>' : '') +
        errHtml('seller');
      after = function () { bindInput('f-sname', 'sellerName'); };
    } else if (key === 'area') {
      var plot = findPlot();
      html += '<div class="q"><h2>' + esc(T.qArea) + '</h2>' + listenBtn(q) + '</div>' +
        '<div class="field"><label for="f-area" class="sr-only">' + esc(T.qArea) + '</label><div class="stepper">' +
        '<button data-act="area-dec" aria-label="−1">−</button>' +
        '<input id="f-area" class="input input-big" inputmode="decimal" autocomplete="off" placeholder="২০" value="' + esc(F.area) + '" aria-invalid="' + !!state.errors.area + '" aria-describedby="area-help err-area">' +
        '<button data-act="area-inc" aria-label="+1">+</button></div>' +
        '<p style="text-align:center;font-weight:700;margin:8px 0 0;color:var(--brand-800)">' + esc(T.unit) + '</p>' +
        (micAllowed() ? '<div style="display:flex;justify-content:center;margin-top:10px"><button class="mic-btn" data-act="mic" data-field="area" aria-label="' + esc(T.speak) + '">' + I.mic + '</button></div>' : '') +
        errHtml('area') + '<p class="help-text" id="area-help" style="text-align:center">' + esc(T.unitHelp) + (plot ? ' · ' + esc(T.plotTotal(plot.totalArea, f)) : '') + '</p>' +
        '<p class="calc-link"><a href="#/calc">' + I.calc + esc(T.areaCalcLink) + '</a></p></div>';
      after = function () { bindInput('f-area', 'area'); };
    } else if (key === 'deed') {
      html += '<div class="q"><h2>' + esc(T.qDeed) + ' <span class="tag-optional">' + esc(T.optional) + '</span></h2>' + listenBtn(q) + '</div>' +
        '<div class="field"><label for="f-deed" class="sr-only">' + esc(T.qDeed) + '</label>' +
        '<input id="f-deed" class="input input-big" autocomplete="off" placeholder="' + esc(T.deedPh) + '" value="' + esc(F.deedNo) + '" aria-invalid="' + !!state.errors.deedNo + '" aria-describedby="deed-help err-deedNo">' +
        errHtml('deedNo') + '<p class="help-text" id="deed-help">' + esc(T.deedHelp) + '</p></div>';
      after = function () { bindInput('f-deed', 'deedNo'); };
    }
    var back = n === 1 ? 'home' : 'prev';
    var barHtml = key === 'deed'
      ? '<div class="inner" style="grid-template-columns:1fr 1fr 1.4fr"><button class="btn btn-light" data-act="prev">' + I.back + esc(T.back) + '</button><button class="btn btn-ghost" data-act="skip">' + esc(T.skip) + '</button><button class="btn btn-primary" data-act="next" data-step="5">' + esc(T.next) + I.next + '</button></div>'
      : bar(back, n);
    return { html: wizardShell(n, html), bar: barHtml, after: function () { if (after) after(); if (state.voiceOn) setTimeout(function () { say(q); }, 250); } };
  }


  // Wizard layout: sticky step list with your answers (wide screens) + the question card.
  function wizardShell(current, inner) {
    var T = t(), F = state.form;
    var vals = [mouzaName(F.mouzaId), F.dag ? f.num(E.normalizeDigits(F.dag)) : '',
      F.notInList ? F.sellerName : (F.sellerId ? f.person(F.sellerId) : ''),
      F.area ? f.num(E.normalizeDigits(F.area)) + ' ' + T.unit : '', F.deedNo || ''];
    var list = T.stepNames.map(function (name, i) {
      var n = i + 1, done = n < current, on = n === current;
      var label = '<span class="n">' + (done ? I.check : esc(f.num(n))) + '</span><span>' + esc(name) + '</span>' + (vals[i] && n !== current ? '<span class="val">' + esc(vals[i]) + '</span>' : '');
      return '<li class="' + (done ? 'done' : '') + (on ? ' on' : '') + '"' + (on ? ' aria-current="step"' : '') + '>' +
        (done ? '<button class="link-btn" style="all:unset;display:contents;cursor:pointer" data-act="goto" data-step="' + n + '">' + label + '</button>' : label) + '</li>';
    }).join('');
    // One page heading for screen readers (the visible question is the h2): "জমি যাচাই — দাগ (২ / ৫)" / review.
    var h1 = T.checkTitle + ' — ' + (current <= 5 ? T.stepNames[current - 1] + ' (' + f.num(current) + ' / ' + f.num(5) + ')' : T.reviewTitle);
    return '<div class="page mid jr-page"><h1 class="sr-only">' + esc(h1) + '</h1><div class="wizard">' +
      '<aside class="wizard-steps card-soft" aria-label="' + esc(T.yourAnswers) + '"><p class="label">' + esc(T.checkTitle) + '</p><ol>' + list + '</ol>' +
        '<div class="help-card"><p class="hc-k">' + I.phone + esc(T.helpNeed) + '</p>' +
          '<a class="hc-num tnum" href="tel:' + TS.config.landHotline + '">' + esc(f.num(TS.config.landHotline)) + '</a>' +
          '<p class="hc-sub">' + esc(T.helpHotlineSub) + '</p><p class="hc-note">' + esc(T.helpNotGov) + '</p></div></aside>' +
      '<section class="wizard-main card-soft">' + inner + '</section></div></div>';
  }

  // Live dag lookup (display only): "found in sample records" with khatian + plot total,
  // or "not in sample records" with this mouza's sample dags to tap. It never says
  // "verified" and reveals nothing about conflicts — the rules still run only at Start Check.
  function dagLookupHtml() {
    var T = t(), F = state.form, txt = E.normalizeDigits(F.dag).trim();
    if (!F.mouzaId || !/^\d+$/.test(txt)) return '';
    var plot = findPlot(), k = findKhatian();
    if (plot) return '<p class="lookup-ok">' + I.checkCircle + '<span>' + esc(T.dagFound(k ? k.khatianNo : '—', plot.totalArea, f)) + '</span></p>';
    var dags = TS.data.plots.filter(function (p) { return p.mouzaId === F.mouzaId; }).map(function (p) { return p.dag; });
    return '<div class="lookup-none"><p>' + I.info + '<span>' + esc(T.dagNotFound) + '</span></p><div class="lookup-chips">' +
      dags.map(function (d) { return '<button type="button" class="btn btn-mint btn-sm tnum" data-act="pickdag-inline" data-dag="' + d + '">' + esc(f.num(d)) + '</button>'; }).join('') + '</div></div>';
  }
  function paintDagLookup() {
    var box = document.getElementById('dag-lookup'); if (!box) return;
    box.innerHTML = dagLookupHtml();
    var field = box.closest('.field'); if (field) field.classList.toggle('ok', !!box.querySelector('.lookup-ok'));
  }

  function bindInput(id, key) {
    var el = document.getElementById(id); if (!el) return;
    el.addEventListener('input', function () { state.form[key] = el.value; if (state.errors[key === 'sellerName' ? 'seller' : key]) { delete state.errors[key === 'sellerName' ? 'seller' : key]; el.setAttribute('aria-invalid', 'false'); var er = document.getElementById('err-' + key); if (er) er.remove(); } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var nb = document.querySelector('[data-act="next"]'); if (nb) nb.click(); } });
  }
  function findPlot() { var d = E.parseNumber(state.form.dag); return TS.data.plots.find(function (p) { return p.mouzaId === state.form.mouzaId && p.dag === d; }) || null; }
  function findKhatian() { var d = E.parseNumber(state.form.dag); return TS.data.khatians.find(function (k) { return k.mouzaId === state.form.mouzaId && k.dag === d; }) || null; }
  function engineInput() {
    var F = state.form;
    return { mouzaId: F.mouzaId, dag: F.dag, sellerId: F.notInList ? null : F.sellerId,
      sellerName: F.notInList ? F.sellerName : null, area: F.area, sellerDeedNo: F.deedNo };
  }

  // Validate only the fields that belong to the current step, using the engine's own checks.
  function validateStep(n) {
    var key = STEPS[n - 1], F = state.form, errs = {};
    if (key === 'mouza' && !F.mouzaId) errs.mouza = { code: 'mouza_required' };
    if (key === 'dag' || key === 'area' || key === 'deed' || key === 'seller') {
      var v = E.validateInput(Object.assign(engineInput(), { area: key === 'area' ? F.area : (F.area || '1') }), currentData());
      v.errors.forEach(function (e) {
        if (key === 'dag' && e.field === 'dag') errs.dag = e;
        if (key === 'area' && e.field === 'area') errs.area = e;
        if (key === 'deed' && e.field === 'deedNo') errs.deedNo = e;
        if (key === 'seller' && e.field === 'seller') errs.seller = e;
      });
    }
    state.errors = errs;
    return Object.keys(errs).length === 0;
  }

  function reviewScreen() {
    var T = t(), F = state.form;
    function row(icon, k, v, step) { return '<div class="review-row"><span class="ico">' + icon + '</span><div class="grow"><div class="k">' + esc(k) + '</div><div class="v">' + v + '</div></div><button class="link-btn" data-act="goto" data-step="' + step + '">' + I.edit + esc(T.change) + '</button></div>'; }
    var seller = F.notInList ? esc(F.sellerName) + ' <span class="muted small">(' + esc(T.notInList) + ')</span>' : esc(f.person(F.sellerId));
    var spoken = T.reviewTitle + '. ' + T.rPlace + ': ' + mouzaName(F.mouzaId) + '. ' + T.rDag + ': ' + f.num(F.dag) + '. ' + T.rSeller + ': ' + (F.notInList ? F.sellerName : f.person(F.sellerId)) + '. ' + T.rArea + ': ' + f.num(F.area) + ' ' + T.unit + '.';
    var html = '<div class="q"><h2>' + esc(T.reviewTitle) + '</h2>' + listenBtn(spoken) + '</div><div>' +
      row(I.pin, T.rPlace, esc(TS.data.district.name[state.lang] + ' › ' + TS.data.upazila.name[state.lang] + ' › ' + mouzaName(F.mouzaId)), 1) +
      row(I.hash, T.rDag, esc(f.num(E.normalizeDigits(F.dag))), 2) +
      row(I.user, T.rSeller, seller, 3) +
      row(I.ruler, T.rArea, esc(f.num(E.normalizeDigits(F.area))) + ' ' + esc(T.unit), 4) +
      row(I.doc, T.rDeed, F.deedNo ? esc(F.deedNo) : '<span class="muted">' + esc(T.notGiven) + '</span>', 5) + '</div>';
    return { html: wizardShell(6, html), bar: '<div class="inner">' + '<button class="btn btn-light" data-act="goto" data-step="5">' + I.back + esc(T.back) + '</button><button class="btn btn-primary" data-act="run">' + I.search + esc(T.startCheck) + '</button></div>',
      after: function () { if (state.voiceOn) setTimeout(function () { say(spoken); }, 250); } };
  }

  function checkingScreen() {
    var T = t();
    var html = '<div class="page narrow jr-page"><div class="checking" role="status" aria-live="polite"><div><svg class="scan" viewBox="0 0 180 150" aria-hidden="true">' +
      '<rect class="doc" x="30" y="10" width="90" height="120" rx="10"/><path class="row" d="M48 40h54M48 60h54M48 80h40M48 100h48"/>' +
      '<rect class="doc" x="70" y="24" width="90" height="116" rx="10" opacity=".9"/><path class="row" d="M88 54h54M88 74h40M88 94h54"/>' +
      '<g class="lens" stroke="var(--brand-700)" stroke-width="6" fill="rgba(124,197,170,.25)" stroke-linecap="round"><circle cx="95" cy="70" r="24"/><path d="M112 88l18 18" fill="none"/></g></svg>' +
      '<h2>' + esc(T.checking) + '</h2><ul class="chk-list"><li id="c1">' + I.check + esc(T.chkKhatian) + '</li><li id="c2">' + I.check + esc(T.chkDeed) + '</li><li id="c3">' + I.check + esc(T.chkNamjari) + '</li></ul></div></div></div>';
    return { html: html, after: function () {
      ['c1', 'c2', 'c3'].forEach(function (id, i) { setTimeout(function () { var el = document.getElementById(id); if (el) el.classList.add('on'); }, 220 + i * 230); });
      // replace() so the Back button from the result never lands on this animation again
      setTimeout(function () { if (route().name === 'checking') location.replace('#/result'); }, 1050);
    } };
  }


  U.paintDagLookup = paintDagLookup;
  U.bindInput = bindInput; U.findPlot = findPlot; U.findKhatian = findKhatian; U.engineInput = engineInput; U.validateStep = validateStep;
  U.screens.step = stepScreen;
  U.screens.review = reviewScreen;
  U.screens.checking = checkingScreen;
})(window.TS.ui);
