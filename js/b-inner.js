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
