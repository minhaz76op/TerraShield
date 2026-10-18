/*
 * TerraShield — ui/icons.js
 * Hand-drawn inline SVG icons (no icon library, works offline).
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;

  /* ======================= Icons (hand-drawn, inline SVG) ======================= */
  function svg(p, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var I = {
    back: svg('<path d="M15 18l-6-6 6-6"/>'),
    next: svg('<path d="M9 18l6-6-6-6"/>'),
    speaker: svg('<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
    speakerOff: svg('<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>'),
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    calc: svg('<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>'),
    pie: svg('<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
    ruler: svg('<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>'),
    doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7M8 11h7"/>'),
    hash: svg('<path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    alert: svg('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/>'),
    stop: svg('<path d="M8 2.5h8L21.5 8v8L16 21.5H8L2.5 16V8z"/><path d="M12 7.5v5.5M12 16.5v.5"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    question: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5"/>'),
    lens: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/><path d="M7.8 10.5l2 2 3.4-3.6"/>'),
    home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5"/>'),
    phone: svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    printer: svg('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),
    refresh: svg('<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>'),
    edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    play: svg('<path d="M7 4l13 8-13 8z"/>'),
    flask: svg('<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/>'),
    swap: svg('<path d="M7 4v14M4 15l3 3 3-3M17 20V6M14 9l3-3 3 3"/>'),
    office: svg('<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01"/>'),
    scale: svg('<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>'),
    hand: svg('<path d="M12 3v9M8.5 5v8M15.5 5v8M5 9v6a7 7 0 0 0 14 0v-3"/>'),
    shield: svg('<path d="M12 3l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z"/>'),
    keyboard: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    lang: svg('<path d="M4 5h8M8 3v2c0 4-2 7-5 9M6 9c1 2 3 4 6 5"/><path d="M13 21l4-9 4 9M14.5 18h5"/>'),
    present: svg('<path d="M3 4h18M5 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4M12 15v4M8 21l4-2 4 2"/>'),
    pause: svg('<path d="M9 5v14M15 5v14"/>'),
    skipBack: svg('<path d="M18 6L10 12l8 6zM6 6v12"/>'),
    skipFwd: svg('<path d="M6 6l8 6-8 6zM18 6v12"/>'),
    external: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    checkCircle: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>'),
    xCircle: svg('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
    sparkle: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    building: svg('<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/>'),
    wifiOff: svg('<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.5-2.4M19 12.5a10 10 0 0 0-2.2-1.6M2 8.8a15 15 0 0 1 4.3-2.7M22 8.8A15 15 0 0 0 11 5M12 20h.01"/>'),
    monitor: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
    alertCircle: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/>')
  };

  // TerraShield logo (web/assets/icons/terrashield-icon.svg). A getter so every copy on the page gets its own
  // gradient/clip ids — a hidden copy (e.g. the header on a small screen) must never be the one others point to.
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22795C"/><stop offset="1" stop-color="#0F4A39"/></linearGradient><clipPath id="sh"><path d="M256 92 L396 142 V258 C396 346 338 402 256 432 C174 402 116 346 116 258 V142 Z"/></clipPath></defs><rect width="512" height="512" rx="114" fill="url(#bg)"/><path d="M256 92 L396 142 V258 C396 346 338 402 256 432 C174 402 116 346 116 258 V142 Z" fill="#F5F8F6"/><g clip-path="url(#sh)"><polygon points="100,262 232,352 412,176 412,450 100,450" fill="#BFE6D3"/><polyline points="100,262 232,352 412,176" fill="none" stroke="#1A6650" stroke-width="30" stroke-linejoin="round"/><line x1="232" y1="352" x2="232" y2="450" stroke="#1A6650" stroke-width="16"/></g><circle cx="226" cy="198" r="40" fill="#E03A3E"/></svg>';
  var logoN = 0;
  Object.defineProperty(I, 'logo', { enumerable: true, get: function () {
    var k = 'tslogo' + (++logoN);
    return LOGO_SVG.replace(/id="(bg|sh)"/g, 'id="' + k + '$1"').replace(/url\(#(bg|sh)\)/g, 'url(#' + k + '$1)');
  } });
  var STATUS_ICON = { red: I.stop, yellow: I.alert, green: I.lens, grey: I.question };
  var LEVEL_ICON = { high: I.stop, medium: I.alert, info: I.info };

  U.svg = svg; U.I = I; U.STATUS_ICON = STATUS_ICON; U.LEVEL_ICON = LEVEL_ICON;
})(window.TS.ui);
