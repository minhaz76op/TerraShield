/*
 * TerraShield — screens/calc.js
 * Land calculator (#/calc): (1) khatian share → land, with a button that puts the result
 * into the check form's area step; (2) unit converter. Display only — the arithmetic lives
 * in calc.js and the rule engine is never called from here.
 * Results repaint live while typing (only the result boxes change, so focus stays in the input).
 */
(function (U) {
  'use strict';
  var TS = window.TS, C = TS.calc;
  var state = U.state, t = U.t, f = U.f, esc = U.esc, I = U.I;

  // Remembered while the app is open (so switching language or visiting the form keeps the numbers).
  state.calc = state.calc || { total: '', totalUnit: 'decimal', share: '', amount: '', from: 'decimal' };
  var QUICK = ['1/2', '1/3', '1/4', '1'];

  // 4356.0 → "৪,৩৫৬" ; 0.3333 → "০.৩৩৩৩"
  function fmt(v) {
    var p = C.round(v).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return f.num(p.join('.'));
  }
  function uName(id) { return t().units[id]; }
  function errMsg(code, isShare) { var E = t().calcErr; return code === 'notNumber' && isShare ? E.shareNotNumber : E[code]; }

  function calcScreen() {
    var T = t(), S = state.calc;
    var unitBtn = function (id) { return '<button type="button" data-act="calc-tu" data-v="' + id + '" aria-pressed="' + (S.totalUnit === id) + '">' + esc(uName(id)) + '</button>'; };
    var share =
      '<section class="card calc-card" aria-labelledby="share-h">' +
        '<div class="calc-head"><span class="icon-tile solid">' + I.pie + '</span><div><h2 id="share-h">' + esc(T.shareTitle) + '</h2><p class="muted">' + esc(T.shareSub) + '</p></div></div>' +
        '<div class="field"><label for="c-total">' + esc(T.totalLabel) + '</label>' +
          '<div class="calc-row"><input id="c-total" class="input calc-input" inputmode="decimal" autocomplete="off" placeholder="' + esc(f.num('60')) + '" value="' + esc(S.total) + '" aria-describedby="err-c-total">' +
          '<div class="toggle unit-toggle" role="group" aria-label="' + esc(T.fromLabel) + '">' + unitBtn('decimal') + unitBtn('acre') + '</div></div>' +
          '<div id="err-c-total"></div></div>' +
        '<div class="field"><label for="c-share">' + esc(T.shareLabel) + '</label>' +
          '<input id="c-share" class="input calc-input" autocomplete="off" spellcheck="false" placeholder="' + esc(f.num('1/3')) + '" value="' + esc(S.share) + '" aria-describedby="c-share-help err-c-share">' +
          '<p class="help-text" id="c-share-help">' + esc(T.shareHelp) + '</p>' +
          '<div class="calc-chips" role="group" aria-label="' + esc(T.quickShare) + '">' + QUICK.map(function (q) {
            return '<button type="button" class="btn btn-mint btn-sm tnum" data-act="calc-share" data-v="' + q + '">' + esc(q === '1' ? T.shareWhole : f.num(q)) + '</button>';
          }).join('') + '</div>' +
          '<div id="err-c-share"></div></div>' +
        '<div id="c-share-out" class="calc-out" aria-live="polite">' + shareOutHtml() + '</div>' +
      '</section>';

    var opts = C.UNITS.areaUnits.map(function (u) { return '<option value="' + u.id + '"' + (S.from === u.id ? ' selected' : '') + '>' + esc(uName(u.id)) + '</option>'; }).join('');
    var conv =
      '<section class="card calc-card" aria-labelledby="conv-h">' +
        '<div class="calc-head"><span class="icon-tile">' + I.swap + '</span><div><h2 id="conv-h">' + esc(T.convTitle) + '</h2><p class="muted">' + esc(T.convSub) + '</p></div></div>' +
        '<div class="calc-row2">' +
          '<div class="field"><label for="c-amt">' + esc(T.amountLabel) + '</label><input id="c-amt" class="input calc-input" inputmode="decimal" autocomplete="off" placeholder="' + esc(f.num('10')) + '" value="' + esc(S.amount) + '" aria-describedby="err-c-amt"><div id="err-c-amt"></div></div>' +
          '<div class="field"><label for="c-from">' + esc(T.fromLabel) + '</label><select id="c-from" class="input select">' + opts + '</select></div>' +
        '</div>' +
        '<div id="c-conv-out" class="calc-out" aria-live="polite">' + convOutHtml() + '</div>' +
        '<p class="notice warn calc-warn">' + I.alert + '<span>' + esc(T.regionalWarn) + '</span></p>' +
      '</section>';

    var html = '<div class="page jr-page calc-page">' + U.calcTabs('calc') +
      '<p class="eyebrow">' + I.calc + esc(T.navCalc) + '</p>' +
      '<h1 class="page-title" style="margin-top:12px">' + esc(T.calcTitle) + '</h1>' +
      '<p class="page-lead">' + esc(T.calcLead) + '</p>' +
      '<div class="calc-grid">' + share + conv + '</div>' +
      '<div class="disclaimer"><b>' + I.alert + esc(T.calcDiscTitle) + '</b>' + esc(T.calcDisc) + '</div>' +
      '<p class="small muted calc-ana">' + I.info + '<span>' + esc(T.anaNote) + '</span></p>' +
      '</div>';
    return { html: html, nav: true, after: bind };
  }

  /* ---------- Result boxes ---------- */
  function shareOutHtml() {
    var T = t(), S = state.calc, r = C.shareArea(S.total, S.totalUnit, S.share);
    if (!r.ok) return '<p class="calc-empty">' + I.pie + '<span>' + esc(T.shareEmpty) + '</span></p>';
    var info = r.shareInfo, shareTxt = f.num(C.clean(S.share));
    if (info.kind === 'fraction') shareTxt += ' (≈ ' + fmt(info.value) + ')';
    var dec = uName('decimal'), how = '';
    if (r.totalUnit === 'acre') how = fmt(r.total) + ' ' + uName('acre') + ' = ' + fmt(r.totalDecimal) + ' ' + dec + ' → ';
    how += fmt(r.totalDecimal) + ' ' + dec + ' × ' + shareTxt + ' = ' + fmt(r.areaDecimal) + ' ' + dec;
    var forForm = Number(r.areaDecimal.toFixed(2));
    return '<div class="calc-result">' +
      '<p class="k">' + esc(T.shareResultK) + '</p>' +
      '<p class="big tnum" id="c-share-val">' + esc(fmt(r.areaDecimal)) + ' <span>' + esc(dec) + '</span></p>' +
      '<p class="alt">= ' + esc(fmt(r.areaDecimal * C.unit('decimal').sqft)) + ' ' + esc(uName('sqft')) + ' · ' + esc(fmt(r.areaDecimal / 100)) + ' ' + esc(uName('acre')) + '</p>' +
      '<p class="how"><b>' + esc(T.howK) + ':</b> <span>' + esc(how) + '</span></p>' +
      (forForm > 0 ? '<button type="button" class="btn btn-primary btn-block" data-act="calc-use" data-v="' + forForm + '">' + I.search + esc(T.shareUse) + '</button><p class="help-text">' + esc(T.shareUseNote) + '</p>' : '') +
      '</div>';
  }

  function convOutHtml() {
    var T = t(), S = state.calc, r = C.convert(S.amount, S.from);
    if (!r.ok) return '<p class="calc-empty">' + I.swap + '<span>' + esc(T.convEmpty) + '</span></p>';
    var rows = r.rows.map(function (x) {
      return '<tr' + (x.id === r.from ? ' class="is-from"' : '') + '><th scope="row">' + esc(uName(x.id)) +
        (x.regional ? ' <span class="tag-sim">' + esc(T.regionalTag) + '</span>' : '') + '</th><td class="tnum">' + esc(fmt(x.value)) + '</td></tr>';
    }).join('');
    return '<table class="calc-table"><caption class="sr-only">' + esc(T.convTitle) + '</caption><tbody>' + rows + '</tbody></table>' +
      '<p class="how"><b>' + esc(T.howK) + ':</b> <span>' + esc(T.convHow(fmt(r.value), uName(r.from), fmt(r.sqft))) + '</span></p>';
  }

  /* ---------- Live errors: only for boxes that have something typed in ---------- */
  function paintErr(inputId, res, isShare) {
    var box = document.getElementById('err-' + inputId), input = document.getElementById(inputId);
    if (!box || !input) return;
    var bad = !res.ok && res.error !== 'empty';
    input.setAttribute('aria-invalid', String(bad));
    box.innerHTML = bad ? '<p class="error-text">' + I.alert + '<span>' + esc(errMsg(res.error, isShare)) + '</span></p>' : '';
  }
  function paintShare() {
    var S = state.calc;
    paintErr('c-total', C.parseAmount(S.total), false);
    paintErr('c-share', C.parseShare(S.share), true);
    var out = document.getElementById('c-share-out'); if (out) out.innerHTML = shareOutHtml();
  }
  function paintConv() {
    paintErr('c-amt', C.convert(state.calc.amount, state.calc.from), false);
    var out = document.getElementById('c-conv-out'); if (out) out.innerHTML = convOutHtml();
  }

  function bind() {
    var S = state.calc;
    function on(id, key, paint) { var el = document.getElementById(id); if (el) el.addEventListener('input', function () { S[key] = el.value; paint(); }); }
    on('c-total', 'total', paintShare); on('c-share', 'share', paintShare); on('c-amt', 'amount', paintConv);
    var sel = document.getElementById('c-from'); if (sel) sel.addEventListener('change', function () { S.from = sel.value; paintConv(); });
    paintShare(); paintConv();
  }

  /* ---------- Buttons (called from main.js) ---------- */
  function action(a, b) {
    var S = state.calc;
    if (a === 'calc-tu') {
      S.totalUnit = b.getAttribute('data-v');
      Array.prototype.forEach.call(document.querySelectorAll('[data-act="calc-tu"]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      paintShare();
    } else if (a === 'calc-share') {
      S.share = f.num(b.getAttribute('data-v'));
      var inp = document.getElementById('c-share'); if (inp) { inp.value = S.share; inp.focus(); }
      paintShare();
    } else if (a === 'calc-use') {
      // Put the result in the check form's area box; keep everything else the user already chose.
      var F = state.form, v = f.num(b.getAttribute('data-v'));
      F.area = v; delete state.errors.area;
      var ready = F.mouzaId && F.dag && (F.sellerId || (F.notInList && F.sellerName));
      U.toast(t().shareUsed(v));
      U.go(ready ? '#/step/4' : '#/step/1');
    }
  }

  U.screens.calc = calcScreen;
  U.calcAction = action;
})(window.TS.ui);
