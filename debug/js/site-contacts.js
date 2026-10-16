(function () {
  'use strict';

  var defaults = window.AVELIS_CONTACTS || {
    phone: '+380989709700',
    phoneDisplay: '+38 (098) 970-97-00',
    instagram: 'https://www.instagram.com/avelis.clinic/',
    telegram: '',
    whatsapp: 'https://wa.me/380989709700',
    viber: 'viber://chat?number=380989709700'
  };

  var SOCIAL_KEYS = ['instagram', 'telegram', 'whatsapp', 'viber'];

  function normalizePhone(phone) {
    return String(phone || '').replace(/[^\d+]/g, '');
  }

  function digitsOnly(phone) {
    return normalizePhone(phone).replace(/\D/g, '');
  }

  function whatsappFromPhone(phone) {
    var digits = digitsOnly(phone);
    return digits ? 'https://wa.me/' + digits : '';
  }

  function viberFromPhone(phone) {
    var digits = digitsOnly(phone);
    return digits ? 'viber://chat?number=' + digits : '';
  }

  function applySocialLink(key, url) {
    document.querySelectorAll('[data-social="' + key + '"]').forEach(function (el) {
      if (url) {
        el.href = url;
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });
  }

  function applyContacts(opts) {
    opts = opts || {};
    var phone = opts.phone || defaults.phone;
    var phoneDisplay = opts.phoneDisplay || defaults.phoneDisplay;
    var telHref = 'tel:' + normalizePhone(phone);
    var social = {
      instagram: opts.instagram || defaults.instagram,
      telegram: opts.telegram != null ? opts.telegram : defaults.telegram,
      whatsapp: opts.whatsapp || whatsappFromPhone(phone) || defaults.whatsapp,
      viber: opts.viber || viberFromPhone(phone) || defaults.viber
    };

    document.querySelectorAll('.header__phone, .contacts__phone').forEach(function (el) {
      el.href = telHref;
      el.textContent = phoneDisplay;
    });

    document.querySelectorAll('.site-footer a[href^="tel:"]').forEach(function (el) {
      el.href = telHref;
      el.textContent = phoneDisplay;
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
      try {
        var data = JSON.parse(script.textContent);
        var isArray = Array.isArray(data);
        var nodes = isArray ? data : [data];
        var changed = false;
        nodes.forEach(function (node) {
          if (node && node.telephone) {
            node.telephone = normalizePhone(phone);
            changed = true;
          }
        });
        if (changed) {
          script.textContent = JSON.stringify(isArray ? nodes : nodes[0], null, 2);
        }
      } catch (e) { /* ignore invalid JSON-LD */ }
    });

    SOCIAL_KEYS.forEach(function (key) {
      applySocialLink(key, social[key]);
    });
  }

  function applyFromSettingsMap(map) {
    if (!map) return;
    applyContacts({
      phone: map.phone || defaults.phone,
      phoneDisplay: map.phone_display || defaults.phoneDisplay,
      instagram: map.instagram_url || defaults.instagram,
      telegram: map.telegram_url || defaults.telegram,
      whatsapp: map.whatsapp_url || whatsappFromPhone(map.phone || defaults.phone),
      viber: map.viber_url || viberFromPhone(map.phone || defaults.phone)
    });
  }

  window.AvelisSiteContacts = {
    apply: applyContacts,
    applyFromSettingsMap: applyFromSettingsMap
  };

  function init() {
    applyContacts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
