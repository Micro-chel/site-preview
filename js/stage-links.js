/* Show only (tools/design/da4/stage.py): root links → this copy or the live site. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/js\/stage-links\.js.*$/, '');
  var SHOW = ["index.html", "skhudnennia.html", "kalkulyator-imt.html", "quiz.html", "pro-kliniku.html", "kontakty.html", "polityka-konfidentsiinosti.html", "umovy-vykorystannia.html", "preparaty/index.html", "preparaty/mounjaro.html", "preparaty/ozempic.html", "preparaty/retatrutid.html", "blog/index.html", "blog/tirzepatid-mounjaro.html", "blog/semaglutid-ozempic.html", "blog/chomu-ne-khudnu-na-glp-1.html", "blog/glp-1-vzaiemodii-operatsii.html", "blog/kharchuvannia-na-glp-1.html", "blog/miazy-na-glp-1.html", "blog/mounjaro-chy-ozempic.html", "blog/mounjaro-pobichni-efekty.html", "blog/mounjaro-rezultaty-doslidzhennia.html", "blog/ozempic-pobichni-efekty.html", "blog/ozempic-rezultaty-doslidzhennia.html", "blog/pidhotovka-do-konsultatsii-endokrynologa.html", "blog/plato-na-glp-1.html", "blog/retatrutyd-status-doslidzhen.html", "blog/vaga-pislia-vidminy-glp-1.html", "blog/yak-koloty-mounjaro-dozuvannia.html", "blog/yak-koloty-ozempic-dozuvannia.html", "blog/zberigannia-oryginalnist-ozempic-mounjaro.html", "skhudnennia/iniektsii-glp-1.html", "skhudnennia/kalkulyator-kalorii.html", "skhudnennia/kalkulyator-stroku-skhudnennia.html", "skhudnennia/kharchuvannia-dlia-skhudnennia.html", "skhudnennia/likuvannia-ozhyrinnia.html", "skhudnennia/medykamentozne-likuvannia-ozhyrinnia.html", "skhudnennia/postiino-khochetsia-yisty.html", "skhudnennia/vaha-stoit-na-mistsi.html", "skhudnennia/yak-pochaty-skhudnennia.html", "ru/index.html", "ru/skhudnennia.html", "ru/kalkulyator-imt.html", "ru/quiz.html", "ru/pro-kliniku.html", "ru/kontakty.html", "ru/polityka-konfidentsiinosti.html", "ru/umovy-vykorystannia.html", "ru/preparaty/index.html", "ru/preparaty/mounjaro.html", "ru/preparaty/ozempic.html", "ru/preparaty/retatrutid.html", "ru/blog/index.html", "ru/blog/tirzepatid-mounjaro.html", "ru/blog/semaglutid-ozempic.html", "ru/blog/chomu-ne-khudnu-na-glp-1.html", "ru/blog/glp-1-vzaiemodii-operatsii.html", "ru/blog/kharchuvannia-na-glp-1.html", "ru/blog/miazy-na-glp-1.html", "ru/blog/mounjaro-chy-ozempic.html", "ru/blog/mounjaro-pobichni-efekty.html", "ru/blog/mounjaro-rezultaty-doslidzhennia.html", "ru/blog/ozempic-pobichni-efekty.html", "ru/blog/ozempic-rezultaty-doslidzhennia.html", "ru/blog/pidhotovka-do-konsultatsii-endokrynologa.html", "ru/blog/plato-na-glp-1.html", "ru/blog/retatrutyd-status-doslidzhen.html", "ru/blog/vaga-pislia-vidminy-glp-1.html", "ru/blog/yak-koloty-mounjaro-dozuvannia.html", "ru/blog/yak-koloty-ozempic-dozuvannia.html", "ru/blog/zberigannia-oryginalnist-ozempic-mounjaro.html", "ru/skhudnennia/iniektsii-glp-1.html", "ru/skhudnennia/kalkulyator-kalorii.html", "ru/skhudnennia/kalkulyator-stroku-skhudnennia.html", "ru/skhudnennia/kharchuvannia-dlia-skhudnennia.html", "ru/skhudnennia/likuvannia-ozhyrinnia.html", "ru/skhudnennia/medykamentozne-likuvannia-ozhyrinnia.html", "ru/skhudnennia/postiino-khochetsia-yisty.html", "ru/skhudnennia/vaha-stoit-na-mistsi.html", "ru/skhudnennia/yak-pochaty-skhudnennia.html", "404.html"];
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
