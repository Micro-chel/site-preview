/* Avelis «Кришталь» — inner pages (DA-4). Small and calm: no scroll choreography here.
   - the header turns solid once the page moves;
   - endless loops (medicine rings) run only while the page scrolls and the ring is in view;
   - a review screenshot opens whole in the site's lightbox (main.js closes it). */
(function () {
  'use strict';
  var doc = document.documentElement;

  var hdr = document.querySelector('.site-header');
  function solid() { if (hdr) hdr.classList.toggle('is-solid', scrollY > 24); }
  addEventListener('scroll', solid, { passive: true }); solid();

  var loops = document.querySelectorAll('.prep-card__ring'), idle = null;
  if ('IntersectionObserver' in window && loops.length) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('in-view', e.isIntersecting); }); });
    [].forEach.call(loops, function (el) { io.observe(el); });
    addEventListener('scroll', function () {
      doc.classList.add('is-scrolling'); clearTimeout(idle);
      idle = setTimeout(function () { doc.classList.remove('is-scrolling'); }, 700);
    }, { passive: true });
  }

  // long articles (css/b-article.css): the contents stay open beside the text on wide screens, folded above it on narrow ones;
  // the section being read is marked in the contents; on narrow screens a jump folds the contents back
  var toc = document.querySelector('.art-toc');
  if (toc) {
    // «wide» = the block itself is ≥ 1000 px (b-article.css switches by a container query: embeds sit in narrower columns)
    var art = toc.closest('.art') || doc, wide = { matches: false };
    var fit = function () {
      var w = art.clientWidth >= 1000;
      if (w !== wide.matches || !fit.done) { wide.matches = w; if (box) box.open = w; fit.done = true; }
    };
    var box = toc.querySelector('details');
    fit(); addEventListener('resize', fit);
    var links = [].slice.call(toc.querySelectorAll('a[href^="#"]')), heads = [];
    links.forEach(function (a) {
      var h = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (h) heads.push({ a: a, h: h });
      a.addEventListener('click', function () { if (box && !wide.matches) box.open = false; });
    });
    if (heads.length) {
      var on = null, tick = false;
      var mark = function () {
        tick = false;
        var cur = null, line = innerHeight * 0.3;
        heads.forEach(function (x) { if (x.h.getBoundingClientRect().top <= line) cur = x; });
        if (cur !== on) { if (on) on.a.classList.remove('is-on'); on = cur; if (on) on.a.classList.add('is-on'); }
      };
      addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(mark); } }, { passive: true });
      mark();
    }
  }

  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('.lightbox__img'), opener = null;
    var openSingle = function (src, alt, from) {
      opener = from;
      lb.classList.add('is-single', 'is-open');
      lb.setAttribute('aria-hidden', 'false');
      lbImg.src = src; lbImg.alt = alt || '';
      document.body.style.overflow = 'hidden';
      var x = lb.querySelector('.lightbox__close'); if (x) x.focus();
    };
    [].forEach.call(document.querySelectorAll('.review-card'), function (card) {
      var img = card.querySelector('.review-card__img'); if (!img) return;
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', img.alt);
      var go = function () { openSingle(img.getAttribute('src').replace('-480.', '-900.'), img.alt, card); };
      card.addEventListener('click', go);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    new MutationObserver(function () {
      if (!lb.classList.contains('is-open') && lb.classList.contains('is-single')) {
        lb.classList.remove('is-single');
        if (opener) { opener.focus(); opener = null; }
      }
    }).observe(lb, { attributes: true, attributeFilter: ['class'] });
  }
})();
