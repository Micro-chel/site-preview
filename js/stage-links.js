/* Show only (tools/design/da4/stage.py): root links → this copy or the live site. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/js\/stage-links\.js.*$/, '');
  var SHOW = ["index.html", "kontakty.html", "skhudnennia.html", "preparaty/index.html", "preparaty/mounjaro.html", "preparaty/ozempic.html", "preparaty/retatrutid.html", "quiz.html", "kalkulyator-imt.html", "pro-kliniku.html", "blog/index.html", "blog/tirzepatid-mounjaro.html", "blog/semaglutid-ozempic.html", "polityka-konfidentsiinosti.html", "umovy-vykorystannia.html", "ru/index.html", "ru/kontakty.html", "ru/skhudnennia.html", "ru/preparaty/index.html", "ru/preparaty/mounjaro.html", "ru/preparaty/ozempic.html", "ru/preparaty/retatrutid.html", "ru/quiz.html", "ru/kalkulyator-imt.html", "ru/pro-kliniku.html", "ru/blog/index.html", "ru/blog/tirzepatid-mounjaro.html", "ru/blog/semaglutid-ozempic.html", "ru/polityka-konfidentsiinosti.html", "ru/umovy-vykorystannia.html", "404.html"];
  function map(p) {
    var h = p.indexOf('#'), hash = h < 0 ? '' : p.slice(h), path = h < 0 ? p : p.slice(0, h);
    var rel = path.replace(/^\//, '');
    if (rel === '' || /\/$/.test(rel)) rel += 'index.html';
    return SHOW.indexOf(rel) >= 0 ? [BASE + rel + hash, false] : ['https://avelis.clinic' + p, true];
  }
  function fixSet(v) { return v.split(',').map(function (s) { s = s.trim(); return s.charAt(0) === '/' ? BASE + s.slice(1) : s; }).join(', '); }
  function fix(root) {
    if (!root.querySelectorAll) return;
    [].forEach.call(root.querySelectorAll('a[href^="/"]'), function (a) {
      var r = map(a.getAttribute('href'));
      a.setAttribute('href', r[0]);
      if (r[1]) { a.target = '_blank'; a.rel = 'noopener'; }
    });
    [].forEach.call(root.querySelectorAll('img[src^="/"],source[srcset^="/"],img[srcset^="/"]'), function (el) {
      if ((el.getAttribute('src') || '').charAt(0) === '/') el.setAttribute('src', BASE + el.getAttribute('src').slice(1));
      if ((el.getAttribute('srcset') || '').charAt(0) === '/') el.setAttribute('srcset', fixSet(el.getAttribute('srcset')));
    });
  }
  fix(document);
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'attributes') fix(m.target.parentNode || document);
      else [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { fix(n); if (n.parentNode) fix(n.parentNode); } });
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'src', 'srcset'] });
})();
