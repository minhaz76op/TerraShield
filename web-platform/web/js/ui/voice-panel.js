/*
 * TerraShield — ui/voice-panel.js
 * Voice input panel: listen → "আপনি বলেছেন" confirm → fill field; keypad after 2 failed tries.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var state = U.state, t = U.t, f = U.f, esc = U.esc, toast = U.toast, say = U.say, I = U.I, render = U.render;

  /* ======================= Voice panel ======================= */
  var stopListening = null;
  function openVoice(field) {
    var T = t();
    var host = document.getElementById('sheet');
    function close(focusInput) {
      if (stopListening) { stopListening(); stopListening = null; }
      host.innerHTML = ''; host.hidden = true;
      if (focusInput) { var el = document.getElementById(field === 'dag' ? 'f-dag' : 'f-area'); if (el) el.focus(); }
    }
    function fail(msg) {
      state.voiceFails[field] = (state.voiceFails[field] || 0) + 1;
      if (state.voiceFails[field] >= 2) { close(true); toast(T.notUnderstood2); state.voiceFails[field] = 0; return; }
      showListening(msg);
    }
    function showListening(msg) {
      host.hidden = false;
      host.innerHTML = '<div class="sheet-backdrop" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(T.listening) + '">' +
        '<div class="pulse">' + I.mic + '</div><h2>' + esc(T.listening) + '</h2>' + (msg ? '<p class="error-text" style="justify-content:center">' + esc(msg) + '</p>' : '') +
        '<p class="muted">' + esc(T.sayExample) + '</p><button class="btn btn-light" data-act="sheet-type" style="margin-top:12px">' + I.keyboard + esc(T.typeInstead) + '</button>' +
        '<button class="btn btn-ghost" data-act="sheet-close">' + I.x + esc(T.stop) + '</button>' +
        '<p class="small muted" style="margin:12px 0 0">' + esc(T.voicePrivacy) + '</p></div></div>';
      bindSheet();
      stopListening = V.listen({
        lang: 'bn-BD',
        onResult: function (alts) {
          var val = null;
          for (var i = 0; i < alts.length && val === null; i++) {
            var n = V.parseSpokenNumber(alts[i]);
            if (n !== null && !isNaN(n) && (field === 'area' || Number.isInteger(n))) val = n;
          }
          stopListening = null;
          if (val === null) fail(T.notUnderstood); else showConfirm(val);
        },
        onNoMatch: function () { stopListening = null; fail(T.notUnderstood); },
        onError: function (code) {
          stopListening = null;
          if (code === 'not-allowed' || code === 'service-not-allowed') { close(true); toast(T.micDenied); }
          else if (code === 'network') { close(true); toast(T.noNetVoice); }
          else if (code === 'aborted' || !document.querySelector('#sheet .sheet')) { /* user closed the panel */ }
          else fail(T.notUnderstood);
        }
      });
      if (!stopListening) { close(true); toast(T.noRecognition); }
    }
    function showConfirm(val) {
      host.innerHTML = '<div class="sheet-backdrop"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(T.youSaid) + '">' +
        '<p class="muted" style="margin:0">' + esc(T.youSaid) + '</p><div class="heard">' + esc(f.num(val)) + '</div>' +
        '<button class="btn btn-primary" data-act="sheet-ok">' + I.check + esc(T.correct) + '</button>' +
        '<button class="btn btn-light" data-act="sheet-again">' + I.mic + esc(T.sayAgain) + '</button>' +
        '<button class="btn btn-ghost" data-act="sheet-type">' + I.keyboard + esc(T.typeInstead) + '</button></div></div>';
      bindSheet(val);
      say(T.youSaid + ' ' + f.num(val));
    }
    function bindSheet(val) {
      host.onclick = function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var a = b.getAttribute('data-act');
        if (a === 'sheet-ok') { state.form[field] = f.num(val); state.voiceFails[field] = 0; delete state.errors[field]; close(false); render(); }
        else if (a === 'sheet-again') showListening();
        else if (a === 'sheet-type' || a === 'sheet-close') close(true);
        else if (a === 'sheet-bg' && e.target === b) close(true);
      };
    }
    showListening();
  }


  U.openVoice = openVoice;
})(window.TS.ui);
