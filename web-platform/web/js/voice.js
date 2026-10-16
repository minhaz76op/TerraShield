/*
 * TerraShield — voice.js
 * 1) parseSpokenNumber(): turns what speech recognition heard into a number.
 *    Accepts Bangla digits (১০৩), English digits (103), Bangla words
 *    ("একশো তিন", "এক শূন্য তিন", "সাড়ে বারো") and English words
 *    ("one zero three", "one hundred three", "twelve point five").
 *    Pure function — tested in Node (tests/voice.test.js).
 * 2) listen(): browser speech recognition (Chrome, needs internet; audio may be
 *    processed by the browser provider). Returns null if not supported.
 * 3) speak(): reads text aloud with the device's voice. If the device has no
 *    Bangla voice, it reports that so the app can fall back to text.
 * TerraShield never records or stores any audio.
 */
(function (root, factory) {
  var voice = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = voice;
  else { root.TS = root.TS || {}; root.TS.voice = voice; }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  /* ---------- Number words ---------- */
  var BN_WORDS = ['শূন্য','এক','দুই','তিন','চার','পাঁচ','ছয়','সাত','আট','নয়',
    'দশ','এগারো','বারো','তেরো','চৌদ্দ','পনেরো','ষোলো','সতেরো','আঠারো','উনিশ',
    'বিশ','একুশ','বাইশ','তেইশ','চব্বিশ','পঁচিশ','ছাব্বিশ','সাতাশ','আঠাশ','উনত্রিশ',
    'ত্রিশ','একত্রিশ','বত্রিশ','তেত্রিশ','চৌত্রিশ','পঁয়ত্রিশ','ছত্রিশ','সাঁইত্রিশ','আটত্রিশ','উনচল্লিশ',
    'চল্লিশ','একচল্লিশ','বিয়াল্লিশ','তেতাল্লিশ','চুয়াল্লিশ','পঁয়তাল্লিশ','ছেচল্লিশ','সাতচল্লিশ','আটচল্লিশ','উনপঞ্চাশ',
    'পঞ্চাশ','একান্ন','বাহান্ন','তিপ্পান্ন','চুয়ান্ন','পঞ্চান্ন','ছাপ্পান্ন','সাতান্ন','আটান্ন','উনষাট',
    'ষাট','একষট্টি','বাষট্টি','তেষট্টি','চৌষট্টি','পঁয়ষট্টি','ছেষট্টি','সাতষট্টি','আটষট্টি','উনসত্তর',
    'সত্তর','একাত্তর','বাহাত্তর','তিয়াত্তর','চুয়াত্তর','পঁচাত্তর','ছিয়াত্তর','সাতাত্তর','আটাত্তর','উনআশি',
    'আশি','একাশি','বিরাশি','তিরাশি','চুরাশি','পঁচাশি','ছিয়াশি','সাতাশি','অষ্টআশি','উননব্বই',
    'নব্বই','একানব্বই','বিরানব্বই','তিরানব্বই','চুরানব্বই','পঁচানব্বই','ছিয়ানব্বই','সাতানব্বই','আটানব্বই','নিরানব্বই'];
  var BN_EXTRA = { 'দুই': 2, 'দু': 2, 'দো': 2, 'ছ': 6, 'ছয়': 6, 'নয়': 9, 'শুন্য': 0, 'জিরো': 0, 'ষোল': 16, 'বারো': 12 };
  var EN_ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve',
    'thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  var EN_TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

  // Make spelling variants match (ঊ→উ, য় composed form, extra spaces/punctuation).
  function clean(text) {
    return String(text || '')
      .normalize('NFC')
      .replace(/য়/g, 'য়')        // য + ় → য়
      .replace(/ঊ/g, 'উ')
      .replace(/[০-৯]/g, function (d) { return String('০১২৩৪৫৬৭৮৯'.indexOf(d)); })
      .toLowerCase()
      .replace(/[,।?!]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  var BN_MAP = {};
  BN_WORDS.forEach(function (w, i) { BN_MAP[clean(w)] = i; });
  Object.keys(BN_EXTRA).forEach(function (w) { BN_MAP[clean(w)] = BN_EXTRA[w]; });

  // One word → number value, or a marker for hundred/thousand/point/half.
  function wordValue(w) {
    if (/^\d+(\.\d+)?$/.test(w)) return { n: Number(w), digits: w.length };
    if (w in BN_MAP) return { n: BN_MAP[w] };
    var i = EN_ONES.indexOf(w); if (i >= 0) return { n: i };
    if (w in EN_TENS) return { n: EN_TENS[w] };
    if (w === 'oh' || w === 'o') return { n: 0 };
    if (/^(শো|শ|শত|hundred)$/.test(w)) return { mul: 100 };
    if (/^(হাজার|thousand)$/.test(w)) return { mul: 1000 };
    if (/^(দশমিক|point|dot)$/.test(w)) return { point: true };
    if (/^(সাড়ে|সারে)$/.test(w)) return { half: true };
    // Joined hundreds: "একশো", "দুইশো", "তিনশ", "একশত"
    var m = w.match(/^(.+?)(শো|শত|শ)$/);
    if (m && m[1] in BN_MAP) return { n: BN_MAP[m[1]] * 100, hundredWord: true };
    return null;
  }

  function parseSpokenNumber(text) {
    var s = clean(text);
    if (s === '') return null;
    if (/^\d+(\.\d+)?$/.test(s.replace(/\s/g, '')) && !/\d\s+\d+\.\d/.test(s)) {
      // "1 0 3" or "103" or "12.5"
      return Number(s.replace(/\s/g, ''));
    }
    var tokens = s.split(' ').filter(function (t) {
      return t && !/^(শতাংশ|ডেসিমেল|decimal|decimals|দাগ|নম্বর|number|dag)$/.test(t);
    });
    var vals = tokens.map(wordValue);
    if (vals.some(function (v) { return v === null; })) return null;
    // Must contain at least one real number word ("দশমিক" or "সাড়ে" alone is not a number).
    if (!vals.some(function (v) { return v.n !== undefined || v.mul; })) return null;

    // Digit-by-digit style: every token is a single digit 0–9 ("এক শূন্য তিন").
    if (vals.length > 1 && vals.every(function (v) { return v.n !== undefined && v.n <= 9 && !v.hundredWord && !(v.digits > 1); })) {
      return Number(vals.map(function (v) { return v.n; }).join(''));
    }

    var half = false, total = 0, current = 0, decimals = null;
    for (var k = 0; k < vals.length; k++) {
      var v = vals[k];
      if (v.half) { half = true; continue; }
      if (v.point) { decimals = ''; continue; }
      if (decimals !== null) {
        if (v.n === undefined) return null;
        decimals += String(v.n);
        continue;
      }
      if (v.mul) {
        if (v.mul === 100) current = (current || 1) * 100;
        else { total += (current || 1) * 1000; current = 0; }
        continue;
      }
      current += v.n;
    }
    var result = total + current;
    if (decimals) result = Number(String(result) + '.' + decimals);
    if (half) result += 0.5;
    return result;
  }

  /* ---------- Browser speech (guarded: only works in browsers) ---------- */
  function recognitionSupported() {
    return !!(root && (root.SpeechRecognition || root.webkitSpeechRecognition));
  }

  // listen({lang, onResult(text), onError(code), onEnd()}) → stop function, or null if unsupported
  function listen(opts) {
    if (!recognitionSupported()) return null;
    var Rec = root.SpeechRecognition || root.webkitSpeechRecognition;
    var rec = new Rec();
    rec.lang = opts.lang || 'bn-BD';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    var gotResult = false, errored = false;
    rec.onresult = function (e) {
      gotResult = true;
      var alts = [];
      for (var i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
      opts.onResult && opts.onResult(alts);
    };
    rec.onerror = function (e) { errored = true; opts.onError && opts.onError(e.error || 'error'); };
    // Ended with no words heard and no error (e.g. silence) → "no match".
    rec.onend = function () { if (!gotResult && !errored && opts.onNoMatch) opts.onNoMatch(); opts.onEnd && opts.onEnd(); };
    try { rec.start(); } catch (err) { opts.onError && opts.onError('start'); return null; }
    return function stop() { try { rec.stop(); } catch (e) { /* ignore */ } };
  }

  function findVoice(lang) {
    if (!root || !root.speechSynthesis) return null;
    var voices = root.speechSynthesis.getVoices() || [];
    var prefix = lang.slice(0, 2);
    return voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(lang.toLowerCase()) === 0; }) ||
           voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(prefix) === 0; }) || null;
  }

  // speak(text, lang) → 'ok' | 'no-voice' | 'unsupported'
  function speak(text, lang) {
    if (!root || !root.speechSynthesis || typeof root.SpeechSynthesisUtterance === 'undefined') return 'unsupported';
    var v = findVoice(lang);
    if (!v) return 'no-voice';
    root.speechSynthesis.cancel();
    var u = new root.SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 0.92;
    root.speechSynthesis.speak(u);
    return 'ok';
  }
  function stopSpeaking() { if (root && root.speechSynthesis) root.speechSynthesis.cancel(); }

  // Warm up voice list (Chrome loads it asynchronously).
  if (root && root.speechSynthesis) {
    try { root.speechSynthesis.getVoices(); root.speechSynthesis.onvoiceschanged = function () {}; } catch (e) { /* ignore */ }
  }

  return {
    parseSpokenNumber: parseSpokenNumber,
    recognitionSupported: recognitionSupported,
    listen: listen,
    speak: speak,
    stopSpeaking: stopSpeaking
  };
});
