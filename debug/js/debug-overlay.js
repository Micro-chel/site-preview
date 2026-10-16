/* Avelis test build only: an on-screen log of what moves the page (supervisor, 16.10). Not for the live site. */
(function () {
  var t0 = performance.now(), lines = [], box = null, H = innerHeight;
  function T() { return ((performance.now() - t0) / 1000).toFixed(1) + 's'; }
  function log(s) {
    lines.push(T() + ' ' + s);
    if (lines.length > 14) lines.shift();
    if (box) box.textContent = 'DEBUG · y=' + Math.round(scrollY) + ' · w=' + innerWidth + '\n' + lines.join('\n');
  }
  function caller() {
    try {
      var st = (new Error()).stack.split('\n');
      for (var i = 1; i < st.length; i++) {
        var l = st[i];
        if (!l || l.indexOf('debug-overlay') >= 0) continue;
        var m = l.match(/(js\/[\w.\-\/]+\.js)[^:]*:(\d+)/);
        if (m) return m[1].replace('js/vendor/', '') + ':' + m[2];
      }
    } catch (e) {}
    return '?';
  }
  // programmatic scrolls and who asked for them
  var oTo = window.scrollTo;
  window.scrollTo = function (a, b) {
    var y = a && typeof a === 'object' ? a.top : b, c = caller();
    if (c.indexOf('ScrollTrigger') < 0) log('JS-ПРОКРУТКА → ' + Math.round(y) + ' (' + c + ')');
    return oTo.apply(this, arguments);
  };
  var oBy = window.scrollBy;
  window.scrollBy = function () { log('scrollBy (' + caller() + ')'); return oBy.apply(this, arguments); };
  var oIV = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function () { log('scrollIntoView ' + (this.id || this.className) + ' (' + caller() + ')'); return oIV.apply(this, arguments); };
  // jumps: more than a screen within one scroll event (a finger cannot do that)
  var lastY = scrollY, lastT = performance.now();
  addEventListener('scroll', function () {
    var y = scrollY, t = performance.now();
    if (Math.abs(y - lastY) > H * 1.2 && t - lastT < 100) log('СКАЧОК ' + Math.round(lastY) + '→' + Math.round(y) + ' за ' + Math.round(t - lastT) + 'мс');
    lastY = y; lastT = t;
  }, { passive: true });
  // width change rebuilds the story; zoom changes the visual viewport
  var lw = innerWidth;
  addEventListener('resize', function () { if (innerWidth !== lw) log('ШИРИНА ' + lw + '→' + innerWidth + ' (сцена перестраивается)'); lw = innerWidth; H = innerHeight; });
  if (window.visualViewport) visualViewport.addEventListener('resize', function () { if (Math.abs(visualViewport.scale - 1) > 0.01) log('МАСШТАБ ×' + visualViewport.scale.toFixed(2)); });
  // taps on links and buttons (a scroll start can count as a tap)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button');
    if (a) log('НАЖАТИЕ ' + String(a.getAttribute('href') || a.textContent || a.className).trim().slice(0, 28));
  }, true);
  // frames stuck longer than 100 ms
  (function f(t, l) { if (l && t - l > 100) log('ЗАВИС ' + Math.round(t - l) + 'мс при y=' + Math.round(scrollY)); requestAnimationFrame(function (n) { f(n, t); }); })(performance.now());
  // scene recalculation by the animation library
  var hk = setInterval(function () { if (window.ScrollTrigger) { clearInterval(hk); ScrollTrigger.addEventListener('refresh', function () { log('пересчёт сцены'); }); } }, 50);
  document.addEventListener('DOMContentLoaded', function () {
    box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:6px;top:70px;z-index:2147483647;max-width:72vw;margin:0;padding:6px 8px;font:10px/1.35 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.74);border-radius:8px;pointer-events:none;white-space:pre-wrap';
    document.body.appendChild(box);
    log('старт, ширина ' + innerWidth + ', высота ' + innerHeight);
    // viewport units and the tall sections: if any of them changes while the toolbars slide, the page below jumps
    var probes = {};
    ['svh', 'lvh', 'dvh', 'vh'].forEach(function (u) {
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:100' + u + ';visibility:hidden;pointer-events:none';
      document.body.appendChild(d); probes[u] = d;
    });
    function snap() {
      var st = document.getElementById('hm-ch'), hero = document.querySelector('.hm-hero');
      return { svh: probes.svh.offsetHeight, lvh: probes.lvh.offsetHeight, vh: probes.vh.offsetHeight,
               'История': st ? st.offsetHeight : 0, '1-й экран': hero ? hero.offsetHeight : 0 };
    }
    var prev = snap();
    log('100svh=' + prev.svh + ' 100lvh=' + prev.lvh + ' 100vh=' + prev.vh + ' dvh=' + probes.dvh.offsetHeight + ' История=' + prev['История']);
    setInterval(function () {
      var s = snap(), ch = [];
      for (var k in s) if (s[k] !== prev[k]) ch.push(k + ' ' + prev[k] + '→' + s[k]);
      if (ch.length) log('ВЫСОТА: ' + ch.join(', ') + ' (окно ' + innerHeight + ')');
      prev = s;
    }, 100);
    setInterval(function () { box.textContent = 'DEBUG · y=' + Math.round(scrollY) + ' · w=' + innerWidth + '\n' + lines.join('\n'); }, 300);
    // chapter changes in the home story (phone and desktop)
    var stops = document.querySelectorAll('#hm-stage .hm-stop'), names = ['Консультація', 'Біля дверей', 'Тиждень 1', 'Місяць', 'Результат'];
    if (stops.length && window.MutationObserver) {
      var cur = -1;
      new MutationObserver(function () {
        for (var i = 0; i < stops.length; i++) if (stops[i].classList.contains('is-on') && i !== cur) { cur = i; log('глава → ' + (names[i] || i)); }
      }).observe(document.getElementById('hm-stage') || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  });
})();
