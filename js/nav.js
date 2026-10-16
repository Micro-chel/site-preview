(function () {
  'use strict';

  function syncHeaderHeight() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    document.documentElement.style.setProperty('--site-header-bottom', header.offsetHeight + 'px');
  }

  function setNavOpen(nav, toggle, open) {
    nav.classList.toggle('is-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  }

  var nav = document.querySelector('.site-nav');
  if (nav) {
    var toggle = nav.querySelector('.site-nav__toggle');
    var panel = nav.querySelector('.site-nav__panel');

    if (panel && !nav.querySelector('.site-nav__backdrop')) {
      var backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'site-nav__backdrop';
      backdrop.setAttribute('aria-label', 'Закрити меню');
      nav.insertBefore(backdrop, panel);

      backdrop.addEventListener('click', function () {
        setNavOpen(nav, toggle, false);
      });
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        setNavOpen(nav, toggle, !nav.classList.contains('is-open'));
      });
    }

    nav.querySelectorAll('.site-nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 959px)').matches) {
          setNavOpen(nav, toggle, false);
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNavOpen(nav, toggle, false);
      }
    });
  }

  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);

  function getPhoneHref() {
    var link = document.querySelector('.header__phone[href^="tel:"]');
    if (link) return link.getAttribute('href');
    var footerPhone = document.querySelector('.site-footer a[href^="tel:"]');
    if (footerPhone) return footerPhone.getAttribute('href');
    var c = window.AVELIS_CONTACTS;
    return c && c.phone ? 'tel:' + c.phone.replace(/[^\d+]/g, '') : 'tel:+380989709700';
  }

  function initFabCall() {
    if (document.querySelector('.fab-call') || !window.matchMedia('(max-width: 959px)').matches) return;

    var href = getPhoneHref();
    var fab = document.createElement('a');
    fab.className = 'fab-call';
    fab.href = href;
    fab.setAttribute('aria-label', 'Зателефонувати');
    fab.innerHTML =
      '<span class="fab-call__ring" aria-hidden="true"></span>' +
      '<span class="fab-call__ring fab-call__ring--2" aria-hidden="true"></span>' +
      '<span class="fab-call__ring fab-call__ring--3" aria-hidden="true"></span>' +
      '<span class="fab-call__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.27-.27.36-.66.24-1.01-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.65 3 4.19C3 13.08 10.92 21 19.81 21c.54 0 .99-.45.99-.99v-3.69c0-.54-.45-.99-.99-.99z"/>' +
        '</svg>' +
      '</span>';

    fab.addEventListener('click', function () {
      if (navigator.vibrate) navigator.vibrate([35, 40, 35]);
    });

    document.body.appendChild(fab);
  }

  initFabCall();
  window.addEventListener('resize', function () {
    syncHeaderHeight();
    var fab = document.querySelector('.fab-call');
    if (window.matchMedia('(max-width: 959px)').matches) {
      if (!fab) initFabCall();
    } else if (fab) {
      fab.remove();
    }
    if (nav && nav.classList.contains('is-open') && window.matchMedia('(min-width: 960px)').matches) {
      setNavOpen(nav, nav.querySelector('.site-nav__toggle'), false);
    }
  });
})();
