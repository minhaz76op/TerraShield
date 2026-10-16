/*
 * TerraShield — ui/background.js
 * Animated cadastral land-parcel background with nakshi-kantha stitch lines and a river.
 */
(function (U) {
  'use strict';
  var TS = window.TS, E = TS.engine, V = TS.voice;
  var svg = U.svg;

  /* ======================= Animated parcel background ======================= */
  function drawBackground() {
    var host = document.getElementById('bg'); if (!host) return;
    var W = 1400, H = 1000, cols = 9, rows = 7, seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var pts = [];
    for (var r = 0; r <= rows; r++) { pts[r] = []; for (var c = 0; c <= cols; c++) {
      var jx = (c === 0 || c === cols) ? 0 : (rnd() - .5) * 90, jy = (r === 0 || r === rows) ? 0 : (rnd() - .5) * 80;
      pts[r][c] = [c * W / cols + jx, r * H / rows + jy];
    } }
    var polys = '';
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c + 1], e = pts[r + 1][c];
      var glow = rnd() < 0.22 ? ' glow' : '';
      if (rnd() < 0.35) { // split some parcels like real dag subdivisions
        var mid = [(a[0] + b[0]) / 2 + (rnd() - .5) * 30, (a[1] + b[1]) / 2], mid2 = [(e[0] + d[0]) / 2 + (rnd() - .5) * 30, (e[1] + d[1]) / 2];
        polys += poly([a, mid, mid2, e], glow) + poly([mid, b, d, mid2], rnd() < .2 ? ' glow' : '');
      } else polys += poly([a, b, d, e], glow);
    }
    function poly(p, cls) { return '<polygon class="parcel' + cls + '" points="' + p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '"/>'; }
    var river = 'M-50,780 C220,700 380,860 620,760 S1000,600 1460,690';
    host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' + polys +
      '<path class="river" d="' + river + '"/><path class="river-line" d="' + river + '"/>' +
      '<path class="stitch" d="M-20,120 C300,60 600,200 900,110 S1300,40 1460,140"/>' +
      '<path class="stitch" d="M-20,430 C260,380 560,500 880,420 S1260,330 1460,420"/></svg>';
  }

  U.drawBackground = drawBackground;
})(window.TS.ui);
