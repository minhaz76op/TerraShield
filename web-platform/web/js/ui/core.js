/*
 * TerraShield — ui/core.js
 * Shared state, text lookup, formatting, safety (esc), toast and speech helpers.
 */
window.TS.ui = window.TS.ui || { screens: {} };   // one shared namespace for all UI modules

(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;

  /* ======================= State ======================= */
  var params = new URLSearchParams(location.search);
  var state = {
    lang: pref('ts-lang', 'bn'),
    voiceOn: pref('ts-voice', 'off') === 'on',
    judge: params.get('judge') === '1' || /judge/.test(location.hash),
    form: blankForm(),
    errors: {},
    result: null,
    fromSample: null,
    showInputs: false,
    extraDeeds: [],
    extraNamjari: [],
    reportNo: 0,
    voiceFails: {},
    voicePrivacyShown: false,
    testRun: null,
    demo: { mouzaId: 'M901', dag: 101, sellerId: 'O01', area: '40', namjari: false },
    menuOpen: false,
    // Judge Mode story player (#/judge): auto-plays the real app inside a phone frame.
    story: { active: false, step: 0, playing: true, elapsed: 0, cycle: 1, userPaused: false },
    // Which data the shown result was computed from: 'base' (samples, Judge Mode) or 'live' (a person's own check).
    resultSource: 'base'
  };
  function blankForm() { return { mouzaId: '', dag: '', sellerId: null, sellerName: '', notInList: false, area: '', deedNo: '' }; }
  function pref(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function savePref(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked — fine */ } }

  function t() { return TS.i18n[state.lang]; }

  /* Theme: 'dark' | 'light'. Default follows the device; the pre-paint script in index.html
     applies it before anything is drawn, so there is no white flash. */
  function isDark() { return document.documentElement.classList.contains('dark'); }
  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0A1411' : '#22795C');
    savePref('ts-theme', dark ? 'dark' : 'light');
  }
  // Current data = fictional base data + anything added in Judge Mode (memory only).
  function currentData() { return withDemo(TS.data); }
  // The fixed fictional data (+ Judge Mode sales): used by samples, Judge Mode and the 14 shared tests,
  // so records added in the Admin Panel can never change them. (data-source.js keeps TS.baseData.)
  function baseView() { return withDemo(TS.baseData || TS.data); }
  function resultData() { return state.resultSource === 'live' ? currentData() : baseView(); }
  function withDemo(src) {
    var d = E.withExtraDeeds(src, state.extraDeeds);
    d.namjari = src.namjari.concat(state.extraNamjari);
    return d;
  }

  /* ======================= Formatting ======================= */
  var BN = '০১২৩৪৫৬৭৮৯';
  var MONTHS = {
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  var f = {
    num: function (n) {
      if (n === null || n === undefined || n === '') return '';
      var s = String(n);
      return state.lang === 'bn' ? s.replace(/\d/g, function (d) { return BN[d]; }) : s;
    },
    date: function (iso) { if (!iso) return ''; var p = iso.split('-'); return f.num(p[2] + '-' + p[1] + '-' + p[0]); },
    // Readable long date: "১৮ অক্টোবর ২০২৬" / "18 October 2026". Own month tables (no Intl),
    // so it is identical on every browser. Falls back to f.date() if the input is not YYYY-MM-DD.
    dateLong: function (iso) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return f.date(iso);
      var mi = Number(m[2]) - 1; if (mi < 0 || mi > 11) return f.date(iso);
      return f.num(Number(m[3])) + ' ' + MONTHS[state.lang][mi] + ' ' + f.num(m[1]);
    },
    // Time of day: "সকাল ১০:২৩" (রাত/সকাল/দুপুর/বিকাল/সন্ধ্যা) or "10:23 am".
    timeOfDay: function (d) {
      var h = d.getHours(), mm = String(d.getMinutes()).padStart(2, '0'), h12 = h % 12 || 12;
      if (state.lang !== 'bn') return h12 + ':' + mm + (h < 12 ? ' am' : ' pm');
      var part = h < 5 ? 'রাত' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
      return part + ' ' + f.num(h12 + ':' + mm);
    },
    person: function (id) {
      var p = TS.data.people.find(function (x) { return x.id === id; });
      return p ? p.name[state.lang] : (id || '—');
    },
    survey: function (s) { return (t().survey && t().survey[s]) || s; }
  };
  function mouzaName(id) { var m = TS.data.mouzas.find(function (x) { return x.id === id; }); return m ? m.name[state.lang] : ''; }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /* ======================= Toast & speech helpers ======================= */
  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 4200);
  }
  function say(text) {
    // Hook for pre-recorded Bangla clips (TS.clips[text] = 'audio/x.mp3'), else device voice.
    if (TS.clips && TS.clips[text]) { try { new Audio(TS.clips[text]).play(); return; } catch (e) { /* fall through */ } }
    var r = V.speak(text, t()._speech);
    if (r !== 'ok') toast(t().noBnVoice);
  }

  U.state = state; U.blankForm = blankForm; U.savePref = savePref; U.t = t; U.isDark = isDark; U.setTheme = setTheme; U.currentData = currentData; U.baseView = baseView; U.resultData = resultData; U.f = f; U.mouzaName = mouzaName; U.esc = esc; U.todayISO = todayISO; U.toast = toast; U.say = say;
})(window.TS.ui);
