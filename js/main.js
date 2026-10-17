(function () {
  'use strict';

  function tr(key) {
    return window.AvelisI18n ? window.AvelisI18n.t(key) : key;
  }

  // Calls are made 08:00-20:00 Kyiv time. At night the "we will call you in 5 minutes" promise
  // is replaced with messenger links (support in messengers is 24/7). Added 2026-10-08.
  function kyivHour() {
    try {
      return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hour: '2-digit', hourCycle: 'h23' }).format(new Date()), 10);
    } catch (e) {
      return new Date().getHours();
    }
  }

  function applyNightMode() {
    var h = kyivHour();
    if (h >= 8 && h < 20) return;
    var c = window.AVELIS_CONTACTS || {};
    var links = [['Telegram', c.telegram], ['Instagram', c.instagram], ['WhatsApp', c.whatsapp]]
      .filter(function (l) { return l[1]; });
    document.querySelectorAll('[data-i18n="modal.book_sub"]').forEach(function (el) {
      el.setAttribute('data-i18n', 'modal.book_sub_night');
      el.textContent = tr('modal.book_sub_night');
      var next = el.nextElementSibling;
      if (next && next.classList.contains('modal__night-links')) return;
      var box = document.createElement('p');
      box.className = 'modal__night-links';
      box.innerHTML = links.map(function (l) {
        return '<a href="' + l[1] + '" target="_blank" rel="noopener noreferrer">' + l[0] + '</a>';
      }).join('');
      el.parentNode.insertBefore(box, el.nextSibling);
    });
  }

  // Phone mask "+380 XX XXX XX XX" for Ukrainian numbers; a number typed with another
  // country code ("+48...", "+49...") is left as is.
  function formatUaPhone(value) {
    var d = value.replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('380') === 0) d = d.slice(3);
    else if ('380'.indexOf(d) === 0) d = '';
    else if (d.indexOf('80') === 0 && d.length >= 11) d = d.slice(2);
    if (d.charAt(0) === '0') d = d.slice(1); // local format 0XX... or typed after the +380 prefix
    d = d.slice(0, 9);
    var out = '+380 ';
    if (d.length) out += d.slice(0, 2);
    if (d.length > 2) out += ' ' + d.slice(2, 5);
    if (d.length > 5) out += ' ' + d.slice(5, 7);
    if (d.length > 7) out += ' ' + d.slice(7, 9);
    return out;
  }

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.matches && el.matches('input[type="tel"]') && !el.value) el.value = '+380 ';
  });

  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (el.matches && el.matches('input[type="tel"]') && el.value.trim() === '+380') {
      el.value = '';
      el.setCustomValidity('');
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.matches || !el.matches('input[type="tel"]')) return;
    var v = el.value;
    if (!v.trim()) { el.setCustomValidity(''); return; }
    var plus = v.lastIndexOf('+');
    if (plus > 0) v = el.value = v.slice(plus); // "+380 +48..." -> "+48..."
    var d = v.replace(/\D/g, '');
    if (/^\s*(\+|00)/.test(v) && !(d.replace(/^00/, '').indexOf('380') === 0 && d.replace(/^00/, '').length > 3)) {
      // international entry: "+", "+38" while typing, or another country code - leave as typed
      var foreign = d.length >= 3 && '380'.indexOf(d) !== 0;
      el.setCustomValidity(foreign && d.length >= 8 ? '' : tr('form.phone_invalid'));
      return;
    }
    el.value = formatUaPhone(v);
    el.setCustomValidity(/^\+380 \d{2} \d{3} \d{2} \d{2}$/.test(el.value) ? '' : tr('form.phone_invalid'));
  });

  var modals = {};
  var modalsLoading = null;
  var boundForms = {};

  function refreshModals() {
    modals.booking = document.getElementById('modal-booking');
    modals.question = document.getElementById('modal-question');
  }

  refreshModals();

  function openModal(id) {
    var modal = modals[id];
    if (!modal) {
      ensureModalsLoaded(function () { openModal(id); });
      return;
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function ensureModalsLoaded(cb) {
    refreshModals();
    if (modals.booking) {
      if (cb) cb();
      return Promise.resolve();
    }
    if (modalsLoading) {
      if (cb) modalsLoading.then(cb);
      return modalsLoading;
    }
    var root = window.AVELIS_ROOT || '';
    modalsLoading = fetch(root + 'partials/modals.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
        refreshModals();
        if (window.AvelisI18n && window.AvelisI18n.applyStatic) window.AvelisI18n.applyStatic();
        applyNightMode();
        bindForm('form-booking');
        bindForm('form-question');
      })
      .catch(function () {});
    if (cb) modalsLoading.then(cb);
    return modalsLoading;
  }

  document.addEventListener('click', function (e) {
    var modalBtn = e.target.closest('[data-modal]');
    if (!modalBtn) return;
    e.preventDefault();
    openModal(modalBtn.getAttribute('data-modal'));
  });

  document.addEventListener('click', function (e) {
    var closeEl = e.target.closest('[data-close]');
    if (!closeEl) return;
    var modal = closeEl.closest('.modal');
    if (modal) closeModal(modal);
  });

  ensureModalsLoaded();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal.is-open').forEach(closeModal);
    var lb = document.getElementById('lightbox');
    if (lb) {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });

  function bindForm(id) {
    if (boundForms[id]) return;
    var form = document.getElementById(id);
    if (!form) return;
    boundForms[id] = true;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      data.append('formId', id);
      data.append('pageUrl', window.location.href);

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.oldText = submitBtn.textContent || '';
        submitBtn.textContent = tr('btn.sending');
      }

      fetch((window.AVELIS_ROOT || '') + 'api/telegram.php', {
        method: 'POST',
        body: data
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false }; });
      }).then(function (res) {
        if (!res || !res.ok) throw new Error('send failed');
        form.hidden = true;
        var ok = form.parentElement.querySelector('.form__ok');
        if (ok) ok.hidden = false;
      }).catch(function () {
        alert(tr('form.error'));
      }).finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          var isBooking = id === 'form-booking';
          submitBtn.textContent = submitBtn.dataset.oldText || tr(isBooking ? 'btn.book' : 'btn.send');
        }
      });
    });
  }

  bindForm('form-booking');
  bindForm('form-question');
  applyNightMode();

  function bindFaqAccordion(root) {
    if (!root) return;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq__q');
      if (!btn || !root.contains(btn)) return;
      var item = btn.closest('.faq__item');
      if (!item) return;
      var isOpen = item.classList.contains('is-open');

      root.querySelectorAll('.faq__item.is-open').forEach(function (open) {
        open.classList.remove('is-open');
        var q = open.querySelector('.faq__q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  bindFaqAccordion(document.getElementById('faq-list'));
  bindFaqAccordion(document.getElementById('bmi-faq-list'));

  var track = document.querySelector('.reviews__track');
  var slides = document.querySelectorAll('.reviews__slide');
  var prevBtn = document.getElementById('reviews-prev');
  var nextBtn = document.getElementById('reviews-next');
  var dotsWrap = document.getElementById('reviews-dots');

  var reviewsRefreshDots = null;

  if (track && slides.length) {
    var index = 0;
    var perView = 1;

    function getPerView() {
      return window.innerWidth >= 600 ? 2 : 1;
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView);
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      var count = maxIndex() + 1;
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'reviews__dot' + (i === index ? ' is-active' : '');
        dot.setAttribute('aria-label', tr('a11y.slide') + ' ' + (i + 1));
        dot.addEventListener('click', function (j) {
          return function () {
            index = j;
            update();
          };
        }(i));
        dotsWrap.appendChild(dot);
      }
    }

    function update() {
      perView = getPerView();
      if (index > maxIndex()) index = maxIndex();
      var slideWidth = track.parentElement.offsetWidth / perView;
      track.style.transform = 'translateX(-' + (index * slideWidth) + 'px)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.reviews__dot').forEach(function (d, i) {
          d.classList.toggle('is-active', i === index);
        });
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        index = index <= 0 ? maxIndex() : index - 1;
        update();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        index = index >= maxIndex() ? 0 : index + 1;
        update();
      });
    }

    window.addEventListener('resize', function () {
      buildDots();
      update();
    });

    buildDots();
    update();

    reviewsRefreshDots = buildDots;

    setInterval(function () {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
    }, 5000);
  }

  var doctorsTrack = document.querySelector('.about-doctors__track');
  var doctorsSlides = document.querySelectorAll('.about-doctors__slide');
  var doctorsPrev = document.getElementById('about-doctors-prev');
  var doctorsNext = document.getElementById('about-doctors-next');
  var doctorsDots = document.getElementById('about-doctors-dots');
  var doctorsViewport = document.querySelector('.about-doctors__viewport');
  var doctorsRefreshDots = null;

  if (doctorsTrack && doctorsSlides.length) {
    var doctorsIndex = 0;
    var doctorsAutoplayTimer = null;
    var DOCTORS_AUTOPLAY_MS = 2500;
    var doctorsRoot = document.getElementById('about-doctors');

    function doctorsMaxIndex() {
      return Math.max(0, doctorsSlides.length - 1);
    }

    function stopDoctorsAutoplay() {
      if (doctorsAutoplayTimer) {
        clearInterval(doctorsAutoplayTimer);
        doctorsAutoplayTimer = null;
      }
    }

    function startDoctorsAutoplay() {
      if (doctorsSlides.length <= 1) return;
      stopDoctorsAutoplay();
      doctorsAutoplayTimer = setInterval(function () {
        stepDoctors(1, true);
      }, DOCTORS_AUTOPLAY_MS);
    }

    function resetDoctorsAutoplay() {
      stopDoctorsAutoplay();
      startDoctorsAutoplay();
    }

    function buildDoctorsDots() {
      if (!doctorsDots) return;
      doctorsDots.innerHTML = '';
      for (var i = 0; i < doctorsSlides.length; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'about-doctors__dot' + (i === doctorsIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', tr('a11y.slide') + ' ' + (i + 1));
        dot.addEventListener('click', function (j) {
          return function () {
            doctorsIndex = j;
            updateDoctors();
            resetDoctorsAutoplay();
          };
        }(i));
        doctorsDots.appendChild(dot);
      }
    }

    function updateDoctors() {
      if (doctorsIndex > doctorsMaxIndex()) doctorsIndex = doctorsMaxIndex();
      var slideWidth = doctorsTrack.parentElement.offsetWidth;
      doctorsTrack.style.transform = 'translateX(-' + (doctorsIndex * slideWidth) + 'px)';
      if (doctorsDots) {
        doctorsDots.querySelectorAll('.about-doctors__dot').forEach(function (d, i) {
          d.classList.toggle('is-active', i === doctorsIndex);
        });
      }
    }

    function stepDoctors(delta, fromAutoplay) {
      doctorsIndex += delta;
      if (doctorsIndex < 0) doctorsIndex = doctorsMaxIndex();
      if (doctorsIndex > doctorsMaxIndex()) doctorsIndex = 0;
      updateDoctors();
      if (!fromAutoplay) resetDoctorsAutoplay();
    }

    if (doctorsPrev) {
      doctorsPrev.addEventListener('click', function () { stepDoctors(-1); });
    }
    if (doctorsNext) {
      doctorsNext.addEventListener('click', function () { stepDoctors(1); });
    }

    if (doctorsViewport) {
      var touchStartX = 0;
      doctorsViewport.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
        stopDoctorsAutoplay();
      }, { passive: true });
      doctorsViewport.addEventListener('touchend', function (e) {
        var diff = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) >= 40) stepDoctors(diff < 0 ? 1 : -1);
        resetDoctorsAutoplay();
      }, { passive: true });
    }

    if (doctorsRoot) {
      doctorsRoot.addEventListener('mouseenter', stopDoctorsAutoplay);
      doctorsRoot.addEventListener('mouseleave', startDoctorsAutoplay);
      doctorsRoot.addEventListener('focusin', stopDoctorsAutoplay);
      doctorsRoot.addEventListener('focusout', function (e) {
        if (!doctorsRoot.contains(e.relatedTarget)) startDoctorsAutoplay();
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopDoctorsAutoplay();
      else startDoctorsAutoplay();
    });

    window.addEventListener('resize', function () {
      updateDoctors();
    });

    buildDoctorsDots();
    updateDoctors();
    doctorsRefreshDots = buildDoctorsDots;
    startDoctorsAutoplay();
    // autoplay only while the slider is on screen: an off-screen carousel must not repaint the page every 2.5 s
    if (doctorsRoot && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) startDoctorsAutoplay(); else stopDoctorsAutoplay();
      }).observe(doctorsRoot);
    }
  }

  var galleryTrack = document.querySelector('.gallery__track');
  var gallerySlides = document.querySelectorAll('.gallery__slide');
  var galleryPrev = document.getElementById('gallery-prev');
  var galleryNext = document.getElementById('gallery-next');
  var galleryDots = document.getElementById('gallery-dots');
  var galleryViewport = document.querySelector('.gallery__viewport');
  var galleryRefreshDots = null;

  if (galleryTrack && gallerySlides.length) {
    var galleryIndex = 0;
    var galleryPerView = 1;

    function galleryMaxIndex() {
      return Math.max(0, gallerySlides.length - galleryPerView);
    }

    function getGalleryPerView() {
      return window.innerWidth >= 600 ? 2 : 1;
    }

    function buildGalleryDots() {
      if (!galleryDots) return;
      galleryDots.innerHTML = '';
      var count = galleryMaxIndex() + 1;
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gallery__dot' + (i === galleryIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', tr('a11y.slide') + ' ' + (i + 1));
        dot.addEventListener('click', function (j) {
          return function () {
            galleryIndex = j;
            updateGallery();
          };
        }(i));
        galleryDots.appendChild(dot);
      }
    }

    function updateGallery() {
      galleryPerView = getGalleryPerView();
      if (galleryIndex > galleryMaxIndex()) galleryIndex = galleryMaxIndex();
      var slideWidth = galleryTrack.parentElement.offsetWidth / galleryPerView;
      galleryTrack.style.transform = 'translateX(-' + (galleryIndex * slideWidth) + 'px)';
      if (galleryDots) {
        galleryDots.querySelectorAll('.gallery__dot').forEach(function (d, i) {
          d.classList.toggle('is-active', i === galleryIndex);
        });
      }
    }

    function stepGallery(delta) {
      galleryIndex += delta;
      if (galleryIndex < 0) galleryIndex = galleryMaxIndex();
      if (galleryIndex > galleryMaxIndex()) galleryIndex = 0;
      updateGallery();
    }

    if (galleryPrev) {
      galleryPrev.addEventListener('click', function () { stepGallery(-1); });
    }
    if (galleryNext) {
      galleryNext.addEventListener('click', function () { stepGallery(1); });
    }

    if (galleryViewport) {
      var galleryTouchStartX = 0;
      galleryViewport.addEventListener('touchstart', function (e) {
        galleryTouchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      galleryViewport.addEventListener('touchend', function (e) {
        var diff = e.changedTouches[0].clientX - galleryTouchStartX;
        if (Math.abs(diff) < 40) return;
        stepGallery(diff < 0 ? 1 : -1);
      }, { passive: true });
    }

    window.addEventListener('resize', function () {
      buildGalleryDots();
      updateGallery();
    });

    buildGalleryDots();
    updateGallery();
    galleryRefreshDots = buildGalleryDots;
  }

  window.addEventListener('avelis:lang-change', function () {
    if (reviewsRefreshDots) reviewsRefreshDots();
    if (doctorsRefreshDots) doctorsRefreshDots();
    if (galleryRefreshDots) galleryRefreshDots();
  });

  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('.lightbox__img');
    var galleryCards = document.querySelectorAll('.gallery__card');
    var urls = Array.from(galleryCards).map(function (btn) {
      return btn.getAttribute('data-gallery-src') || (btn.querySelector('img') && btn.querySelector('img').src) || '';
    });
    var lightboxIndex = 0;

    function showLightbox(i) {
      lightboxIndex = i;
      lightboxImg.src = urls[i];
      var card = galleryCards[i];
      var img = card && card.querySelector('img');
      lightboxImg.alt = (img && img.getAttribute('alt')) || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    galleryCards.forEach(function (item, i) {
      item.addEventListener('click', function () {
        showLightbox(i);
      });
    });

    lightbox.querySelector('.lightbox__close').addEventListener('click', function () {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });

    lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () {
      if (!urls.length) return;
      lightboxIndex = (lightboxIndex - 1 + urls.length) % urls.length;
      lightboxImg.src = urls[lightboxIndex];
    });

    lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () {
      if (!urls.length) return;
      lightboxIndex = (lightboxIndex + 1) % urls.length;
      lightboxImg.src = urls[lightboxIndex];
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  initReveal();

  // Reviews carousel
  var reviewsTrack = document.querySelector('.reviews-carousel__track');
  var reviewsCards = document.querySelectorAll('.review-card');
  var reviewsPrev = document.getElementById('reviews-prev');
  var reviewsNext = document.getElementById('reviews-next');
  var reviewsViewport = document.querySelector('.reviews-carousel__viewport');

  if (reviewsTrack && reviewsCards.length) {
    var reviewsIndex = 0;
    var reviewsPerView = 1;

    function reviewsMaxIndex() {
      return Math.max(0, reviewsCards.length - reviewsPerView);
    }

    function getReviewsPerView() {
      if (window.innerWidth >= 900) return 3;
      if (window.innerWidth >= 600) return 2;
      return 1;
    }

    function updateReviews() {
      reviewsPerView = getReviewsPerView();
      if (reviewsIndex > reviewsMaxIndex()) reviewsIndex = reviewsMaxIndex();
      var cardWidth = reviewsCards[0].offsetWidth;
      var gap = 24;
      var slideWidth = cardWidth + gap;
      reviewsTrack.style.transform = 'translateX(-' + (reviewsIndex * slideWidth) + 'px)';
    }

    function stepReviews(delta) {
      reviewsIndex += delta;
      if (reviewsIndex < 0) reviewsIndex = reviewsMaxIndex();
      if (reviewsIndex > reviewsMaxIndex()) reviewsIndex = 0;
      updateReviews();
    }

    if (reviewsPrev) {
      reviewsPrev.addEventListener('click', function () { stepReviews(-1); });
    }
    if (reviewsNext) {
      reviewsNext.addEventListener('click', function () { stepReviews(1); });
    }

    if (reviewsViewport) {
      var reviewsTouchStartX = 0;
      reviewsViewport.addEventListener('touchstart', function (e) {
        reviewsTouchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      reviewsViewport.addEventListener('touchend', function (e) {
        var diff = e.changedTouches[0].clientX - reviewsTouchStartX;
        if (Math.abs(diff) >= 40) stepReviews(diff < 0 ? 1 : -1);
      }, { passive: true });
    }

    window.addEventListener('resize', function () {
      updateReviews();
      setTimeout(equalizeReviewHeights, 100);
    });

    // Equalize heights of review cards
    function equalizeReviewHeights() {
      var maxHeight = 0;
      var maxAllowedHeight = window.innerWidth >= 900 ? 350 : 600;
      
      reviewsCards.forEach(function (card) {
        var img = card.querySelector('.review-card__img');
        if (img) {
          card.style.height = 'auto';
          img.style.height = 'auto';
          var height = img.offsetHeight;
          if (height > maxHeight && height <= maxAllowedHeight) maxHeight = height;
        }
      });
      
      if (maxHeight > 0) {
        reviewsCards.forEach(function (card) {
          card.style.height = maxHeight + 'px';
          var img = card.querySelector('.review-card__img');
          if (img) img.style.height = '100%';
        });
      }
    }

    // Load images and then equalize heights
    var imagesLoaded = 0;
    var totalImages = reviewsCards.length;
    
    reviewsCards.forEach(function (card) {
      var img = card.querySelector('.review-card__img');
      if (img) {
        if (img.complete) {
          imagesLoaded++;
        } else {
          img.addEventListener('load', function () {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
              equalizeReviewHeights();
            }
          });
        }
      }
    });

    // Wait a bit for images to load, then equalize
    setTimeout(function () {
      equalizeReviewHeights();
    }, 500);

    updateReviews();
  }
})();
