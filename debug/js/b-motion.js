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

  function pinned() {
  // ---------- the story: each stop owns a slice proportional to data-w ----------
    var stops = gsap.utils.toArray('.hm-stop'), N = stops.length;
    var W = stops.map(function (s) { return +s.dataset.w || 1; });
    var T = W.reduce(function (a, b) { return a + b; }, 0);
    var A = [], L = [], acc = 0;
    W.forEach(function (w) { A.push(acc / T); L.push(w / T); acc += w; });

    var r2 = document.getElementById('rail2'), dots = r2.querySelectorAll('.rail__stop');
    var cv = document.getElementById('hm-frost'), frost = getFrost(cv);

    // the free band (client edits 3b): cards, chat and result keep 12px under the header and 22px over the rail on every window;
    // both are measured, so wrapped rail labels or a taller header move the band with them
    var stage = document.getElementById('hm-stage'), railBox = stage.querySelector('.hm-rail2'), head = document.querySelector('.site-header');
    // each scene is framed by what it is about (21.10, Windows laptops 1280×585: «Тиждень 1» showed her face, the pen in her hands
    // went under the rail). data-subject = face + action (x1,y1,x2,y2, shares of the picture): with the chapter's slow zoom at its
    // largest it lies whole in the free band — under the header, over the rail, clear of the cards (right of them or above them,
    // whichever lets it be bigger). The picture covers the stage when that allows; otherwise it steps back (smaller, more of the
    // photo seen) and its edges inside the stage melt into the frost. data-face keeps the face high and the hair in frame.
    var ZOOM = 1.1, PAD = 10;
    var frame = function (img) {
      var sb = (img.dataset.subject || '').split(',').map(Number), f = (img.dataset.face || '').split(',').map(Number);
      var box = img.offsetParent, iw = +img.getAttribute('width'), ih = +img.getAttribute('height');
      if (sb.length < 4 || !box || !iw || !ih) return;
      var bR = box.getBoundingClientRect(), SW = box.clientWidth, SH = box.clientHeight; if (!SW || !SH) return;
      var hb = parseFloat(stage.style.getPropertyValue('--hb')) || 76, rail = railBox.getBoundingClientRect().top - bR.top;
      var cards = [].map.call(img.parentNode.querySelectorAll('.hm-plate, .hm-doc, .hm-ship'), function (c) { return c.getBoundingClientRect(); })
        .filter(function (r) { return r.width; });
      var cR = cards.length ? Math.max.apply(0, cards.map(function (r) { return r.right; })) - bR.left : 0;
      var cT = cards.length ? Math.min.apply(0, cards.map(function (r) { return r.top; })) - bR.top : SH;
      var sw = (sb[2] - sb[0]) * iw * ZOOM, sh = (sb[3] - sb[1]) * ih * ZOOM;
      // two free zones: right of the cards, or full width above them
      var zones = [[cR + PAD, hb + PAD, SW - PAD, rail - PAD], [PAD, hb + PAD, SW - PAD, Math.min(rail, cT) - PAD]].map(function (z) {
        return { z: z, k: Math.min((z[2] - z[0]) / sw, (z[3] - z[1]) / sh) };
      }).sort(function (p, q) { return q.k - p.k; });
      var z = zones[0].z, k0 = Math.max(SW / iw, (SH - hb) / ih), k = Math.min(k0, zones[0].k), dw = iw * k, dh = ih * k;
      var clamp = function (v, lo, hi) { return lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)); };
      // wished position: the old face framing (face in the upper third, hair in, CSS object-position across), kept to the stage...
      if (img.dataset.op0 === undefined) img.dataset.op0 = parseFloat(getComputedStyle(img).objectPosition) / 100;
      // a picture that stepped back hugs the right edge (she stands right, the cards left) and the header
      var X = dw < SW ? SW - dw : clamp(-(+img.dataset.op0) * (dw - SW), SW - dw, 0);
      var Y = dh < SH - hb ? hb : clamp(f.length > 2 ? hb + Math.max(.34 * (SH - hb) - f[1] * dh, 8 - f[2] * dh) : hb, SH - dh, hb);
      // ...then the subject wins: its centre is moved until the zoomed subject sits inside the zone
      var cx = (sb[0] + sb[2]) / 2, cy = (sb[1] + sb[3]) / 2, hx = sw * k / 2, hy = sh * k / 2;
      X = clamp(X + cx * dw, z[0] + hx, z[2] - hx) - cx * dw;
      Y = clamp(Y + cy * dh, z[1] + hy, z[3] - hy) - cy * dh;
      // a gap of a few px is not worth a melting edge: the picture closes it
      if (X > 0 && X <= 4) X = 0; if (X + dw < SW && X + dw >= SW - 4) X = SW - dw;
      if (Y > hb && Y <= hb + 4) Y = hb; if (Y + dh < SH && Y + dh >= SH - 4) Y = SH - dh;
      // whole pixels: a fractional box under the rail's live blur shimmers by a shade at rest
      X = Math.round(X); Y = Math.round(Y); dw = Math.round(dw); dh = Math.round(dh);
      var box4 = { left: X + 'px', top: Y + 'px', width: dw + 'px', height: dh + 'px', right: 'auto', bottom: 'auto', maxWidth: 'none', maxHeight: 'none',
        transformOrigin: Math.round(cx * dw) + 'px ' + Math.round(cy * dh) + 'px' };   // the zoom grows around the subject's centre
      Object.assign(img.style, box4, { objectPosition: '50% 50%' });
      // edges that end inside the stage melt into the frost — painted by a veil over the picture, not a mask on it:
      // a masked picture under the rail's live blur shimmers at rest on a real GPU (Brave/Metal, 21.10)
      var veil = img.nextElementSibling && img.nextElementSibling.classList.contains('scene-veil') ? img.nextElementSibling : null;
      if (!veil) { veil = document.createElement('i'); veil.className = 'scene-veil'; veil.setAttribute('aria-hidden', 'true'); img.after(veil); }
      var g = [], gs = [], gp = [], fw = Math.round(Math.min(dw, dh) * .12) + 'px';
      var fade = function (side, on, size, pos) { if (on) { g.push('var(--veil-' + side + ')'); gs.push(size); gp.push(pos); } };
      fade('l', X > 0, fw + ' 100%', 'left top'); fade('r', X + dw < SW, fw + ' 100%', 'right top');
      fade('t', Y > hb, '100% ' + fw, 'left top'); fade('b', Y + dh < SH, '100% ' + fw, 'left bottom');
      Object.assign(veil.style, box4, { backgroundImage: g.join(','), backgroundSize: gs.join(','), backgroundPosition: gp.join(','), display: g.length ? '' : 'none' });
    };
    var band = function () {
      var hb = head ? Math.max(0, head.getBoundingClientRect().bottom) : 76, sh = stage.clientHeight, rb = sh - railBox.offsetTop + 22;
      stage.style.setProperty('--hb', Math.round(hb) + 'px');
      stage.style.setProperty('--rb', Math.round(rb) + 'px');
      stage.style.setProperty('--av', Math.max(200, Math.round(sh - hb - 12 - rb)) + 'px');
      [].forEach.call(stage.querySelectorAll('.hm-stop .scene-img'), frame);
    };
    band();
    var bandRO = window.ResizeObserver ? new ResizeObserver(band) : null;
    if (bandRO) { bandRO.observe(stage); bandRO.observe(railBox); if (head) bandRO.observe(head); }
    undo.push(function () {
      if (bandRO) bandRO.disconnect();
      ['--hb', '--rb', '--av'].forEach(function (v) { stage.style.removeProperty(v); });
      [].forEach.call(stage.querySelectorAll('.hm-stop .scene-img'), function (img) {
        ['objectPosition', 'transformOrigin', 'left', 'top', 'width', 'height', 'right', 'bottom', 'maxWidth', 'maxHeight'].forEach(function (p) { img.style[p] = ''; });
        var v = img.nextElementSibling; if (v && v.classList.contains('scene-veil')) v.remove();
        delete img.dataset.op0;
      });
    });
    if (frost) cv.style.webkitMaskImage = cv.style.maskImage = 'radial-gradient(ellipse 68% 74% at 50% 46%, transparent 46%, #000 92%)';

    stops.forEach(function (s, i) {
      gsap.set(s, { autoAlpha: i ? 0 : 1, zIndex: i + 1 });
      var plate = s.querySelector('.hm-plate'); if (plate) gsap.set(plate, { autoAlpha: i ? 0 : 1, y: i ? 12 : 0 });
      var ship = s.querySelector('.hm-ship'); if (ship) gsap.set(ship, { autoAlpha: 0, y: 12 });
      var dc = s.querySelector('.hm-doc'); if (dc) gsap.set(dc, { autoAlpha: 0, y: 10 });
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
      var veil = s.querySelector('.scene-veil');
      if (img) tl.fromTo([img, veil].filter(Boolean), { scale: 1.1 }, { scale: 1, duration: l * .45 }, a);
      if (dc) tl.to(dc, { autoAlpha: 1, y: 0, duration: l * .07, ease: 'power2.out' }, a + l * .08);
      if (chat) {
        // the chat comes over the same photo: it softens (blur + a light veil) and stays whole, the heroine in frame
        // (client edits 3, 20.10: no cropping to the half without her — that left an empty half of the screen)
        var c = a + l * .36, out = l * (phone ? .035 : .05);
        if (!phone) gsap.set(img, { filter: 'blur(0px) brightness(1) saturate(1)' });
        tl.to(img, phone ? { autoAlpha: .35, duration: out } : { filter: 'blur(9px) brightness(1.06) saturate(.85)', duration: out, ease: 'power2.inOut' }, c);
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
        // plates that share one place (all chapters stand left since client edits 3b; tablets share one column): the new one starts
        // only once the old is at 0 — never two texts at once
        var qo = turns ? q * .6 : q, ti = turns ? T + qo * (clash && !phone ? 1 : .3) : T;
        inAt = chat ? T + qo : T;   // the photo starts the moment the messages reach 0
        // the old illustration mark leaves with the old text, so two marks never stack
        tl.to([plate, dc, chat, illu].filter(Boolean), { autoAlpha: 0, y: phone ? 0 : -16, duration: qo }, T)
          .set(next, { autoAlpha: 1 }, ti);
        // phones: plates are full width, so the new text comes in only after the old has gone (ti)
        var nps = [np, nship].filter(Boolean);
        if (nps.length) tl.to(nps, turns ? { autoAlpha: 1, y: 0, duration: qo * .5 } : { autoAlpha: 1, y: 0, duration: q, ease: 'power2.out' }, ti);
        if (ni) tl.fromTo([ni, next.querySelector('.scene-veil')].filter(Boolean), phone ? { autoAlpha: 0 } : { autoAlpha: 0, filter: 'blur(6px)' }, phone ? { autoAlpha: 1, duration: .006 } : { autoAlpha: 1, filter: 'blur(0px)', duration: .006 }, inAt);
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

    // from the first screen into the story (client edits 3b, p.1): the first scene opens as a rounded window on the frost and
    // grows to the full screen exactly when the stage pins; the first-screen photo fades and sinks, the chapter's cards and
    // the rail come in over the last third. Only before the pin — the chapters' timeline is untouched.
    var s0 = stops[0], col0 = s0.querySelector('.hm-col'), heroPh = document.querySelector('.hm-hero__photo');
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#hm-ch', start: 'top bottom', end: 'top top', scrub: .5 } })
      .fromTo(stage, { clipPath: 'inset(7% 6% 0% 6% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0)
      .fromTo(s0.querySelector('.scene-img'), { yPercent: -8 }, { yPercent: 0, duration: 1 }, 0)
      .fromTo(heroPh, { autoAlpha: 1, yPercent: 0 }, { autoAlpha: .25, yPercent: 12, duration: 1 }, 0)
      .fromTo([col0, railBox], { autoAlpha: 0 }, { autoAlpha: 1, duration: .26, ease: 'power2.out', stagger: .06 }, .7)
      .fromTo([col0, r2], { y: 28 }, { y: 0, duration: .26, ease: 'power2.out', stagger: .06 }, .7);

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
