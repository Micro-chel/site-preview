/* Avelis home — DA-3b: the client's story (approved mock-up v3) on the real page.
   In the story the route line fills with scroll, then forks in
   «pen or programme» and runs down the safety promises.
   In chapters with real messages the heroine's photo melts away first: her face and real words never share a screen.
   Reduced motion or no GSAP: every stop and chat is a plain block in reading order (the CSS default). */
(function () {
  'use strict';
  var doc = document.documentElement;

  // ---------- header turns solid once the page moves ----------
  var hdr = document.querySelector('.site-header');
  function solid() { if (hdr) hdr.classList.toggle('is-solid', scrollY > 24); }
  addEventListener('scroll', solid, { passive: true }); solid();

  // ---------- before / after (drag, tap, keyboard; works without motion too) ----------
  var cmp = document.getElementById('cmp'), range = document.getElementById('cmp-r');
  var imgB = document.getElementById('cmp-b'), imgA = document.getElementById('cmp-a');
  function setX(v) { if (cmp) cmp.style.setProperty('--x', v + '%'); }
  if (cmp && range) {
    range.addEventListener('input', function () { setX(range.value); });
    setX(range.value);
    var data = {};
    [].forEach.call(document.querySelectorAll('.hm-res__data [data-k]'), function (el) { data[el.dataset.k] = el.textContent; });
    var picks = [].slice.call(document.querySelectorAll('.hm-pick button'));
    picks.forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.dataset.r;
        picks.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        cmp.style.setProperty('--ar', b.dataset.w + '/' + b.dataset.h);
        imgB.width = imgA.width = +b.dataset.w; imgB.height = imgA.height = +b.dataset.h;
        var root = window.AVELIS_ROOT || '/';
        imgB.src = root + 'images/story-result-' + r + '-before-c.webp'; imgA.src = root + 'images/story-result-' + r + '-after-c.webp';
        imgB.alt = data[r + '-b'] || ''; imgA.alt = data[r + '-a'] || '';
        document.getElementById('hm-kg').textContent = data[r + '-kg'] || '';
        document.getElementById('hm-time').textContent = data[r + '-t'] || '';
        range.value = 50; setX(50);
      });
    });
    // phones: the line follows the finger; a vertical swipe over the photos still scrolls the page
    // (.cmp is touch-action:pan-y, the invisible range takes no touches there — see b-home.css)
    var drag = null;
    var follow = function (e) {
      var r = cmp.getBoundingClientRect(), v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      range.value = Math.round(v); setX(v.toFixed(1));
    };
    cmp.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || !matchMedia('(max-width: 760px)').matches) return;
      drag = { x: e.clientX, y: e.clientY, on: false }; cmp.dataset.touched = '1';
    });
    cmp.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.on && Math.abs(e.clientX - drag.x) > 6 && Math.abs(e.clientX - drag.x) > Math.abs(e.clientY - drag.y)) drag.on = true;
      if (drag.on) follow(e);
    });
    cmp.addEventListener('pointerup', function (e) { if (drag && !drag.on) follow(e); drag = null; });
    cmp.addEventListener('pointercancel', function () { drag = null; });
  }

  // ---------- original screenshots (chat «Оригінал», review cards): the site's lightbox, single image ----------
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
    [].forEach.call(document.querySelectorAll('.hm-src'), function (b) {
      b.addEventListener('click', function () {
        var same = document.querySelector('.review-card__img[src="' + b.dataset.src.replace('-900.', '-480.') + '"]');
        openSingle(b.dataset.src, same ? same.alt : '', b);
      });
    });
    // a real review is never left cut mid-sentence: the card opens the whole screenshot
    [].forEach.call(document.querySelectorAll('.review-card'), function (card) {
      var img = card.querySelector('.review-card__img'); if (!img) return;
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', img.alt);
      var go = function () { openSingle(img.getAttribute('src').replace('-480.', '-900.'), img.alt, card); };
      card.addEventListener('click', go);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    // main.js closes the lightbox; we only drop single mode and give focus back
    new MutationObserver(function () {
      if (!lb.classList.contains('is-open') && lb.classList.contains('is-single')) {
        lb.classList.remove('is-single');
        if (opener) { opener.focus(); opener = null; }
      }
    }).observe(lb, { attributes: true, attributeFilter: ['class'] });
  }

  // ---------- endless loops (route dash, medicine rings) run only while scrolling and in view: at rest nothing repaints ----------
  var loops = document.querySelectorAll('.rail__doc, .prep-card__ring'), idle = null;
  if ('IntersectionObserver' in window && loops.length) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('in-view', e.isIntersecting); }); });
    [].forEach.call(loops, function (el) { io.observe(el); });
    addEventListener('scroll', function () {
      doc.classList.add('is-scrolling'); clearTimeout(idle);
      idle = setTimeout(function () { doc.classList.remove('is-scrolling'); }, 700);
    }, { passive: true });
  }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger || !document.getElementById('hm-ch')) return;
  gsap.registerPlugin(ScrollTrigger);
  doc.classList.add('is-live');
  // the mode follows the current width, not the width at load: narrowing the window, rotating a phone or split view
  // tear the story down and build it again (see «rebuild» below)
  var mq = matchMedia('(max-width: 760px)'), phone = mq.matches;
  var undo = [];           // non-GSAP changes of the current build, reverted on teardown
  var frostInst;           // one WebGL frost for the page, reused across builds
  function getFrost(cv) {
    if (frostInst === undefined) { try { frostInst = window.Frost ? Frost.create(cv, { seed: 23 }) : null; } catch (e) { frostInst = null; } }
    return frostInst;
  }

  // ---------- first screen: the photo settles ----------
  // (the route card under the first screen was removed 16.10 — the user; r1 stays optional for the chapter links below)
  var r1 = document.getElementById('rail1');
  gsap.from('.hm-hero__photo .scene-img', phone ? { autoAlpha: 0, duration: .8, ease: 'expo.out' } : { scale: 1.06, filter: 'blur(10px)', duration: 1.6, ease: 'expo.out', clearProps: 'filter' });

  // ---------- phones (≤760): the story is a plain list of steps on the route line (16.10) ----------
  // Nothing is pinned or driven by scroll there: every chapter's text is in the page, the first screen's stops are plain
  // anchors and the result is a normal block (b-home.css). Only computers build the pinned story below.

  // horizontal extent of the heroine on screen for this crop (data-face is in image coordinates); returns the clip that keeps
  // only the half of the photo without her, plus where the illustration mark can sit in that half
  function faceFree(img) {
    if (!img || !img.dataset.face) return null;
    var f = img.dataset.face.split(',').map(Number), r = img.getBoundingClientRect();
    // before the photo is decoded naturalWidth is 0, and img.width/height are the rendered box (not the photo):
    // fall back to the width/height attributes, which carry the photo's own proportions
    var ar = (img.naturalWidth / img.naturalHeight) || (+img.getAttribute('width') / +img.getAttribute('height')) || 2400 / 1340;
    var Wr = Math.max(r.width, r.height * ar), px = (parseFloat(getComputedStyle(img).objectPosition) || 50) / 100;
    var off = (Wr - r.width) * px, x0 = (f[0] * Wr - off) / r.width, x1 = (f[1] * Wr - off) / r.width;
    if (x0 + x1 > 1) return { clip: 'inset(0% ' + Math.min(100, (1 - x0) * 100 + 3).toFixed(1) + '% 0% 0%)', illu: '14px', from: 0, to: x0 - .03 };
    return { clip: 'inset(0% 0% 0% ' + Math.min(100, x1 * 100 + 3).toFixed(1) + '%)', illu: 'calc(' + (x1 * 100 + 4).toFixed(1) + '% + 0px)', from: x1 + .03, to: 1 };
  }

  // the crop is measured at build time; a photo still loading is checked again once decoded (and rebuilt if it differs)
  function settle(img, clip) {
    var id = buildId, again = function () { var z = buildId === id && faceFree(img); if (z && z.clip !== clip) rebuild(true); };
    (img.decode ? img.decode() : Promise.reject()).then(again, function () { img.addEventListener('load', again, { once: true }); });
  }

  function pinned() {
  // ---------- the story: each stop owns a slice proportional to data-w ----------
    var stops = gsap.utils.toArray('.hm-stop'), N = stops.length;
    var W = stops.map(function (s) { return +s.dataset.w || 1; });
    var T = W.reduce(function (a, b) { return a + b; }, 0);
    var A = [], L = [], acc = 0;
    W.forEach(function (w) { A.push(acc / T); L.push(w / T); acc += w; });

    var r2 = document.getElementById('rail2'), dots = r2.querySelectorAll('.rail__stop');
    var cv = document.getElementById('hm-frost'), frost = getFrost(cv);
    if (frost) cv.style.webkitMaskImage = cv.style.maskImage = 'radial-gradient(ellipse 68% 74% at 50% 46%, transparent 46%, #000 92%)';

    stops.forEach(function (s, i) {
      gsap.set(s, { autoAlpha: i ? 0 : 1, zIndex: i + 1 });
      var plate = s.querySelector('.hm-plate'); if (plate) gsap.set(plate, { autoAlpha: i ? 0 : 1, y: i ? 40 : 0 });
      var ship = s.querySelector('.hm-ship'); if (ship) gsap.set(ship, { autoAlpha: 0, y: 40 });
      var dc = s.querySelector('.hm-doc'); if (dc) gsap.set(dc, { autoAlpha: 0, y: 20 });
      var chat = s.querySelector('.hm-chat'); if (chat) gsap.set(chat, { autoAlpha: 0 });
      // phones: a message not shown yet takes no room, so the panel grows message by message and is never an empty field
      gsap.set(s.querySelectorAll('.hm-msg'), phone ? { autoAlpha: 0, y: 18, display: 'none' } : { autoAlpha: 0, y: 18 });
    });
    gsap.set('.hm-fact > *:not([hidden])', { autoAlpha: 0, y: 24 });

    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    var curtain = { x: 100 };
    stops.forEach(function (s, i) {
      var a = A[i], l = L[i];
      var img = s.querySelector('.scene-img'), illu = s.querySelector('.illu');
      var plate = s.querySelector('.hm-plate'), dc = s.querySelector('.hm-doc'), chat = s.querySelector('.hm-chat');
      if (img) tl.fromTo(img, { scale: 1.1 }, { scale: 1, duration: l * .45 }, a);
      if (dc) tl.to(dc, { autoAlpha: 1, y: 0, duration: l * .07, ease: 'power2.out' }, a + l * .08);
      if (chat) {
        // the heroine leaves before anyone real speaks: her photo reaches 0 exactly when the panel and the first message arrive
        var c = a + l * .36, out = l * (phone ? .035 : .05), z = faceFree(img);
        if (z && !(img.complete && img.naturalWidth)) settle(img, z.clip);
        if (z) {
          // the photo keeps its face-free half (computed from data-face for this crop): the scene stays, her face goes
          gsap.set(img, { clipPath: 'inset(0% 0% 0% 0%)' });
          tl.to(img, { clipPath: z.clip, duration: out, ease: 'power2.inOut' }, c)
            .to(illu, { autoAlpha: 0, duration: out * .3 }, c)
            .set(illu, { left: z.illu, right: 'auto' }, c + out * .3)
            .to(illu, { autoAlpha: 1, duration: out * .3 }, c + out * .7);
        } else {
          tl.to(img, phone ? { autoAlpha: 0, duration: out } : { autoAlpha: 0, filter: 'blur(20px)', duration: out }, c)
            .to(illu, { autoAlpha: 0, duration: out * .6 }, c);
        }
        // phones: the plate makes room for the chat only once the first message is readable (no empty frame)
        if (phone) tl.to([plate, dc].filter(Boolean), { autoAlpha: 0, y: 20, duration: l * .02 }, c + out + l * .03);
        tl.to(chat, { autoAlpha: 1, duration: l * .03 }, c + out);
        // messages follow each other closely, so the panel is never a big empty field
        [].forEach.call(s.querySelectorAll('.hm-msg'), function (m, k) {
          var at0 = c + out + l * k * .035;
          if (phone) tl.set(m, { display: 'block' }, at0);
          tl.to(m, { autoAlpha: 1, y: 0, duration: l * .03, ease: 'power2.out' }, at0);
        });
      }
      var res = s.classList.contains('hm-stop--result');
      if (res) {
        tl.to(curtain, { x: 50, duration: l * .4, ease: 'power2.inOut', onUpdate: function () { setX(curtain.x); range.value = Math.round(curtain.x); } }, a + l * .05);
        setX(100);
      }
      if (i < N - 1) {
        // hand-over without an empty frame: the next chapter's text arrives while the old text leaves (different places on screen);
        // after a chapter with real messages the next scene photo (her face) starts only once the messages are at 0.
        var next = stops[i + 1], T = a + l - .03, q = .012;
        var np = next.querySelector('.hm-plate'), ni = next.querySelector('.scene-img'), inAt;
        // the result's numbers sit where the last chat was: the chat leaves first, the numbers follow at once
        // where the old text and the new one share screen space, they take turns instead of crossing
        var hit = function (x, y) { if (!x || !y) return false; var a1 = x.getBoundingClientRect(), b1 = y.getBoundingClientRect(); return a1.left < b1.right && b1.left < a1.right && a1.top < b1.bottom && b1.top < a1.bottom; };
        var nship = next.querySelector('.hm-ship');
        var clash = [plate, dc, chat].some(function (o) { return hit(o, np) || hit(o, nship); });
        var toRes = next.classList.contains('hm-stop--result'), turns = toRes || phone || clash;
        var qo = turns ? q * .6 : q, ti = turns ? T + qo * .3 : T;
        inAt = chat ? T + qo : T;   // the photo starts the moment the messages reach 0
        // the old illustration mark leaves with the old text, so two marks never stack
        tl.to([plate, dc, chat, chat ? null : illu].filter(Boolean), { autoAlpha: 0, y: phone ? 0 : -16, duration: qo }, T)
          .set(next, { autoAlpha: 1 }, ti);
        // phones: plates are full width, so the new text comes in only after the old has gone (ti)
        var nps = [np, nship].filter(Boolean);
        if (nps.length) tl.to(nps, turns ? { autoAlpha: 1, y: 0, duration: qo * .5 } : { autoAlpha: 1, y: 0, duration: q, ease: 'power2.out' }, ti);
        if (ni) tl.fromTo(ni, phone ? { autoAlpha: 0 } : { autoAlpha: 0, filter: 'blur(6px)' }, phone ? { autoAlpha: 1, duration: .006 } : { autoAlpha: 1, filter: 'blur(0px)', duration: .006 }, inAt);
        var nl = next.querySelector('.illu'); if (nl) tl.fromTo(nl, { autoAlpha: 0 }, { autoAlpha: 1, duration: .006 }, inAt);
        if (toRes) tl.to('.hm-fact > *:not([hidden])', { autoAlpha: 1, y: 0, duration: q, ease: 'power2.out' }, T + qo);
        tl.set(s, { autoAlpha: 0 }, inAt + .02);
      }
    });
    tl.to({}, { duration: .001 }, .999);

    // cold chain: frost grows on the doorstep chapter, holds, then melts wet
    var fa = A[1], fl = L[1];
    function frostAt(p) {
      var a = 0, w = 0, t = (p - fa) / fl;
      if (t > -.15 && t < .25) a = (t + .15) / .4;
      else if (t >= .25 && t < .62) a = 1;
      else if (t >= .62 && t < 1.05) { a = 1 - (t - .62) / .43; w = .9; }
      return { amount: a * a * (3 - 2 * a) * .95, wet: w };
    }

    var st = ScrollTrigger.create({
      trigger: '#hm-ch', start: 'top top', end: 'bottom bottom', scrub: phone ? .4 : .7, animation: tl,
      onUpdate: function (self) {
        var p = self.progress, here = 0;
        for (var i = 0; i < N; i++) if (p >= A[i]) here = i;
        var pos = here + Math.min(1, (p - A[here]) / L[here]);
        r2.style.setProperty('--p', Math.max(0, Math.min(1, (pos - .5) / (N - 1))).toFixed(4));
        for (var j = 0; j < N; j++) { dots[j].classList.toggle('is-on', j <= here); dots[j].classList.toggle('is-here', j === here); }
        if (frost) { var q = Math.round(p * 600) / 600; if (q !== frostAt.last) { frostAt.last = q; frost.set(frostAt(q)).render(); } }
      }
    });

    // the first screen's stops jump into the story at their own slice
    if (r1) [].forEach.call(r1.querySelectorAll('a'), function (lnk, i) {
      var go = function (e) { e.preventDefault(); scrollTo({ top: st.start + (A[i] + L[i] * .02) * (st.end - st.start) + 2, behavior: 'smooth' }); };
      lnk.addEventListener('click', go);
      undo.push(function () { lnk.removeEventListener('click', go); });
    });
  }
  var story = null, builtW = 0, buildId = 0;
  function teardown() {
    if (story) story.revert();             // every tween, ScrollTrigger and inline style GSAP set in this build
    story = null;
    while (undo.length) undo.pop()();
    var r2 = document.getElementById('rail2'); if (r2) r2.style.removeProperty('--p');
    [].forEach.call(document.querySelectorAll('#rail2 .rail__stop'), function (d) { d.classList.remove('is-on', 'is-here'); });
    var cv = document.getElementById('hm-frost'); if (cv) cv.style.webkitMaskImage = cv.style.maskImage = '';
    if (frostInst) frostInst.set({ amount: 0, wet: 0 }).render();
    if (cmp && range) { range.value = 50; setX(50); }
  }
  function build() {
    phone = mq.matches; builtW = innerWidth; buildId++;
    story = gsap.context(function () { if (!phone) pinned(); });
  }
  build();
  var rt = null;
  function rebuild(force) {
    force = force === true;
    clearTimeout(rt);
    rt = setTimeout(function () {
      // phones change height while the address bar slides: only a real width change (or rotation) rebuilds
      if (!force && innerWidth === builtW && mq.matches === phone) return;
      var y = scrollY, h = document.documentElement.scrollHeight;
      teardown(); build(); ScrollTrigger.refresh();
      // keep the reader at the same share of the page
      scrollTo(0, Math.round(y / h * document.documentElement.scrollHeight));
    }, 150);
  }
  addEventListener('resize', rebuild);
  addEventListener('orientationchange', rebuild);
  if (mq.addEventListener) mq.addEventListener('change', rebuild);

  // ---------- the route goes on: it forks into two formats, then runs down the safety promises ----------
  var fork = document.querySelector('.fork');
  if (fork) {
    var fs = { v: 1 };
    fork.style.setProperty('--fork', 1);
    gsap.to(fs, { v: 0, ease: 'none', onUpdate: function () { fork.style.setProperty('--fork', fs.v.toFixed(3)); },
      scrollTrigger: { trigger: '.pen-vs-program__stage', start: 'top 85%', end: 'top 45%', scrub: .5 } });
  }
  var sg = document.querySelector('.safety__grid');
  if (sg) {
    var ss = { p: 0 };
    sg.style.setProperty('--p', 0);
    gsap.to(ss, { p: 1, ease: 'none', onUpdate: function () { sg.style.setProperty('--p', ss.p.toFixed(3)); },
      scrollTrigger: { trigger: sg, start: 'top 75%', end: 'bottom 55%', scrub: .5 } });
  }

  // phones: the story's route line fills down to the result as you read — the safety list's fill (17.10, the client).
  // The line is measured from the first node to the bottom of the before/after; nothing is pinned. Reduced motion never gets here: the line stays whole.
  var stage = document.getElementById('hm-stage'), st4 = document.getElementById('st-4');
  if (stage && st4 && cmp && gsap.matchMedia) {
    gsap.matchMedia().add('(max-width: 760px)', function () {
      var measure = function () { stage.style.setProperty('--rl', Math.max(0, cmp.getBoundingClientRect().bottom - stage.getBoundingClientRect().top - 14) + 'px'); };
      measure();
      var ro = window.ResizeObserver ? new ResizeObserver(measure) : null; if (ro) ro.observe(stage);
      var rs = { p: 0 };
      stage.style.setProperty('--p', 0);
      gsap.to(rs, { p: 1, ease: 'none', onUpdate: function () { stage.style.setProperty('--p', rs.p.toFixed(3)); },
        scrollTrigger: { trigger: stage, start: 'top 75%', endTrigger: cmp, end: 'bottom 55%', scrub: .5 } });
      return function () { if (ro) ro.disconnect(); stage.style.removeProperty('--rl'); stage.style.removeProperty('--p'); };
    });
  }

  // fonts and lazy scenes change heights below the story: keep the trigger ranges true
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
