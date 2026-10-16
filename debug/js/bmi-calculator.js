(function () {
  'use strict';

  var form = document.getElementById('bmi-form');
  if (!form) return;

  var STORAGE_KEY = 'avelis_bmi_last';

  var heightInput = document.getElementById('bmi-height');
  var weightInput = document.getElementById('bmi-weight');
  var ageInput = document.getElementById('bmi-age');
  var waistInput = document.getElementById('bmi-waist');
  var activitySelect = document.getElementById('bmi-activity');
  var bodyTypeSelect = document.getElementById('bmi-body-type');
  var genderInputs = form.querySelectorAll('input[name="gender"]');

  var resultPanel = document.getElementById('bmi-result');
  var valueEl = document.getElementById('bmi-value');
  var categoryEl = document.getElementById('bmi-category');
  var hintEl = document.getElementById('bmi-hint');
  var extrasEl = document.getElementById('bmi-extras');
  var deltaEl = document.getElementById('bmi-delta');
  var markerEl = document.getElementById('bmi-scale-marker');
  var ctaBox = document.getElementById('bmi-cta');
  var categoryRows = document.querySelectorAll('[data-bmi-tier]');

  var ACTIVITY = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very: 1.9
  };

  var TIERS = [
    { id: 'under', min: 0, max: 18.5 },
    { id: 'normal', min: 18.5, max: 25 },
    { id: 'over', min: 25, max: 30 },
    { id: 'ob1', min: 30, max: 35 },
    { id: 'ob2', min: 35, max: 40 },
    { id: 'ob3', min: 40, max: Infinity }
  ];

  function t(key) {
    return window.AvelisI18n ? window.AvelisI18n.t(key) : key;
  }

  function getGender() {
    var checked = form.querySelector('input[name="gender"]:checked');
    return checked ? checked.value : 'female';
  }

  function getCategory(bmi) {
    if (bmi < 18.5) return { key: 'bmi.cat.under', tone: 'info', tier: 'under' };
    if (bmi < 25) return { key: 'bmi.cat.normal', tone: 'ok', tier: 'normal' };
    if (bmi < 30) return { key: 'bmi.cat.over', tone: 'warn', tier: 'over' };
    if (bmi < 35) return { key: 'bmi.cat.ob1', tone: 'alert', tier: 'ob1' };
    if (bmi < 40) return { key: 'bmi.cat.ob2', tone: 'alert', tier: 'ob2' };
    return { key: 'bmi.cat.ob3', tone: 'alert', tier: 'ob3' };
  }

  function getHintKey(bmi, age) {
    if (age >= 65 && bmi >= 22 && bmi <= 27) return 'bmi.hint.senior_ok';
    if (bmi < 18.5) return 'bmi.hint.under';
    if (bmi < 27) return 'bmi.hint.low'; // clinic threshold: therapy from BMI 27 (owner, 2026-10-08)
    if (bmi < 30) return 'bmi.hint.over';
    return 'bmi.hint.obese';
  }

  function devineWeight(heightCm, gender) {
    var inches = heightCm / 2.54;
    var base = gender === 'male' ? 50 : 45.5;
    return Math.round((base + 2.3 * (inches - 60)) * 10) / 10;
  }

  function bmrMifflin(weight, height, age, gender) {
    if (!age || age < 10 || age > 120) return null;
    if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }

  function waistRisk(waist, gender) {
    if (!waist) return null;
    if (gender === 'female') {
      if (waist < 80) return { key: 'bmi.waist.ok_f', tone: 'ok' };
      if (waist < 88) return { key: 'bmi.waist.warn_f', tone: 'warn' };
      return { key: 'bmi.waist.high_f', tone: 'alert' };
    }
    if (waist < 94) return { key: 'bmi.waist.ok_m', tone: 'ok' };
    if (waist < 102) return { key: 'bmi.waist.warn_m', tone: 'warn' };
    return { key: 'bmi.waist.high_m', tone: 'alert' };
  }

  function scalePosition(bmi) {
    var min = 15;
    var max = 45;
    var clamped = Math.max(min, Math.min(max, bmi));
    return ((clamped - min) / (max - min)) * 100;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function highlightTiers(tierId) {
    categoryRows.forEach(function (row) {
      var active = row.getAttribute('data-bmi-tier') === tierId;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function saveResult(bmi) {
    try {
      var prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bmi: bmi, at: Date.now() }));
      return prev && typeof prev.bmi === 'number' ? prev.bmi : null;
    } catch (e) {
      return null;
    }
  }

  function calculate() {
    var height = parseFloat(heightInput.value, 10);
    var weight = parseFloat(weightInput.value, 10);
    var age = ageInput && ageInput.value ? parseInt(ageInput.value, 10) : null;
    var waist = waistInput && waistInput.value ? parseFloat(waistInput.value, 10) : null;
    var gender = getGender();
    var activity = activitySelect && activitySelect.value ? activitySelect.value : 'sedentary';

    if (!height || !weight || height < 100 || height > 250 || weight < 30 || weight > 300) {
      resultPanel.hidden = true;
      if (ctaBox) ctaBox.hidden = true;
      highlightTiers('');
      return;
    }

    var meters = height / 100;
    var bmi = weight / (meters * meters);
    var rounded = Math.round(bmi * 10) / 10;
    var cat = getCategory(rounded);
    var ideal = devineWeight(height, gender);
    var normalMin = Math.round(18.5 * meters * meters * 10) / 10;
    var normalMax = Math.round(24.9 * meters * meters * 10) / 10;

    valueEl.textContent = formatNum(rounded.toFixed(1));
    categoryEl.textContent = t(cat.key);
    categoryEl.className = 'bmi-result__category bmi-result__category--' + cat.tone;
    if (hintEl) hintEl.innerHTML = t(getHintKey(rounded, age || 0));

    var extras = [];
    extras.push('<div class="bmi-extra"><span class="bmi-extra__label">' + t('bmi.extra.ideal') + '</span><strong>' + formatNum(ideal.toFixed(1)) + ' ' + t('bmi.unit.kg') + '</strong></div>');
    extras.push('<div class="bmi-extra"><span class="bmi-extra__label">' + t('bmi.extra.range') + '</span><strong>' + formatNum(normalMin.toFixed(1)) + '–' + formatNum(normalMax.toFixed(1)) + ' ' + t('bmi.unit.kg') + '</strong></div>');

    if (age >= 65) {
      extras.push('<p class="bmi-extra__note">' + t('bmi.extra.age_note') + '</p>');
    }

    var waistInfo = waistRisk(waist, gender);
    if (waistInfo) {
      extras.push('<div class="bmi-extra bmi-extra--' + waistInfo.tone + '"><span class="bmi-extra__label">' + t('bmi.extra.waist') + '</span><span>' + t(waistInfo.key) + '</span></div>');
    }

    var bmr = bmrMifflin(weight, height, age, gender);
    if (bmr && ACTIVITY[activity]) {
      var tdee = Math.round(bmr * ACTIVITY[activity]);
      extras.push('<div class="bmi-extra"><span class="bmi-extra__label">' + t('bmi.extra.tdee') + '</span><strong>~' + tdee + ' ' + t('bmi.unit.kcal') + '</strong></div>');
    }

    if (extrasEl) extrasEl.innerHTML = extras.join('');

    var prevBmi = saveResult(rounded);
    if (deltaEl) {
      if (prevBmi !== null && Math.abs(prevBmi - rounded) >= 0.1) {
        var diff = Math.round((rounded - prevBmi) * 10) / 10;
        var sign = diff > 0 ? '+' : '';
        deltaEl.textContent = t('bmi.delta').replace('{diff}', sign + formatNum(diff.toFixed(1)));
        deltaEl.hidden = false;
      } else {
        deltaEl.hidden = true;
      }
    }

    if (markerEl) {
      markerEl.style.left = scalePosition(rounded) + '%';
      markerEl.setAttribute('aria-valuenow', String(rounded));
    }

    highlightTiers(cat.tier);
    resultPanel.hidden = false;
    resultPanel.classList.remove('bmi-result--animate');
    void resultPanel.offsetWidth;
    resultPanel.classList.add('bmi-result--animate');

    if (ctaBox) {
      ctaBox.hidden = false;
      ctaBox.classList.toggle('bmi-cta--highlight', rounded >= 25);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });

  form.addEventListener('change', calculate);
  form.addEventListener('input', function (e) {
    if (e.target === heightInput || e.target === weightInput) return;
    if (heightInput.value && weightInput.value) calculate();
  });

  genderInputs.forEach(function (input) {
    input.addEventListener('change', calculate);
  });

  var advToggle = document.getElementById('bmi-adv-toggle');
  var advPanel = document.getElementById('bmi-adv-panel');
  if (advToggle && advPanel) {
    advToggle.addEventListener('click', function () {
      var open = advPanel.hidden;
      advPanel.hidden = !open;
      advToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  window.addEventListener('avelis:lang-change', calculate);

  if (heightInput && weightInput && heightInput.value && weightInput.value) {
    calculate();
  }
})();
