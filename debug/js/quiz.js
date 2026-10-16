(function () {
  'use strict';

  var root = document.getElementById('quiz-app');
  if (!root) return;

  function t(key, vars) {
    var s = window.AvelisI18n ? window.AvelisI18n.t(key) : key;
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : '';
    });
  }

  var state = {
    step: -1,
    goal: '',
    pain: '',
    gender: 'female',
    ageGroup: '',
    height: 170,
    currentWeight: 85,
    targetWeight: 70,
    diabetes: '',
    pregnant: '',
    breastfeeding: '',
    stopFactor: false
  };

  var STEPS = ['goal', 'pain', 'gender', 'age', 'height', 'currentWeight', 'targetWeight', 'medical'];

  function painsForGoal(goal) {
    var map = {
      weight_loss: ['wl1', 'wl2', 'wl3'],
      appetite: ['ap1', 'ap2', 'ap3'],
      health: ['hl1', 'hl2', 'hl3'],
      maintain: ['mt1', 'mt2', 'mt3']
    };
    return map[goal] || map.weight_loss;
  }

  function calcBmi(weight, heightCm) {
    var h = heightCm / 100;
    return weight / (h * h);
  }

  function formatBmi(v) {
    return (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  }

  function estimateMonths(current, target) {
    var delta = Math.max(0, current - target);
    if (delta <= 0) return 0;
    var weeks = Math.ceil(delta / (current * 0.007));
    return Math.max(1, Math.ceil(weeks / 4));
  }

  function recommendProgram() {
    if (state.stopFactor) {
      return {
        id: 'consult',
        titleKey: 'quiz.result.consult_title',
        textKey: 'quiz.result.consult_text',
        href: (window.AVELIS_HOME || '/') + '#contacts',
        ctaKey: 'quiz.result.consult_cta'
      };
    }

    var bmi = calcBmi(state.currentWeight, state.height);
    var delta = state.currentWeight - state.targetWeight;
    var goal = state.goal;

    if (goal === 'maintain') {
      return {
        id: 'support',
        titleKey: 'quiz.result.support_title',
        textKey: 'quiz.result.support_text',
        href: 'preparaty/mounjaro.html',
        ctaKey: 'quiz.result.support_cta'
      };
    }

    if (bmi >= 35 || (state.pain === 'wl3' && bmi >= 30)) {
      return {
        id: 'mounjaro',
        titleKey: 'quiz.result.mounjaro_title',
        textKey: 'quiz.result.mounjaro_text',
        href: 'preparaty/mounjaro.html',
        ctaKey: 'quiz.result.mounjaro_cta'
      };
    }

    if (bmi >= 30 || delta >= 12) {
      return {
        id: 'mounjaro',
        titleKey: 'quiz.result.mounjaro_title',
        textKey: 'quiz.result.mounjaro_text',
        href: 'preparaty/mounjaro.html',
        ctaKey: 'quiz.result.mounjaro_cta'
      };
    }

    if (bmi >= 27 || delta >= 7) {
      return {
        id: 'ozempic',
        titleKey: 'quiz.result.ozempic_title',
        textKey: 'quiz.result.ozempic_text',
        href: 'preparaty/ozempic.html',
        ctaKey: 'quiz.result.ozempic_cta'
      };
    }

    return {
      id: 'ozempic',
      titleKey: 'quiz.result.ozempic_title',
      textKey: 'quiz.result.ozempic_text',
      href: 'preparaty/ozempic.html',
      ctaKey: 'quiz.result.ozempic_cta'
    };
  }

  function progressPct() {
    if (state.step < 0) return 0;
    if (state.step >= STEPS.length) return 100;
    return Math.round(((state.step + 1) / STEPS.length) * 100);
  }

  function setHtml(el, key, html) {
    if (!el) return;
    if (html) {
      el.setAttribute('data-i18n-html', key);
      el.innerHTML = t(key);
    } else {
      el.setAttribute('data-i18n', key);
      el.textContent = t(key);
    }
  }

  function renderIntro() {
    root.innerHTML =
      '<div class="quiz-card quiz-card--intro">' +
        '<div class="quiz-intro__icon" aria-hidden="true">🧠</div>' +
        '<h1 class="t-title-2 quiz-intro__title" data-i18n="quiz.intro.title"></h1>' +
        '<p class="t-text-2 quiz-intro__lead" data-i18n="quiz.intro.lead"></p>' +
        '<p class="quiz-intro__meta" data-i18n="quiz.intro.meta"></p>' +
        '<button type="button" class="btn quiz-intro__btn" id="quiz-start" data-i18n="quiz.intro.start"></button>' +
        '<ul class="quiz-badges">' +
          '<li data-i18n="quiz.intro.badge1"></li>' +
          '<li data-i18n="quiz.intro.badge2"></li>' +
          '<li data-i18n="quiz.intro.badge3"></li>' +
        '</ul>' +
      '</div>';
    if (window.AvelisI18n && window.AvelisI18n.applyStatic) window.AvelisI18n.applyStatic();
    document.getElementById('quiz-start').addEventListener('click', function () {
      state.step = 0;
      renderStep();
    });
  }

  function optionBtn(value, labelKey, selected) {
    return (
      '<button type="button" class="quiz-option' + (selected ? ' is-selected' : '') + '" data-value="' + value + '">' +
        '<span data-i18n="' + labelKey + '"></span>' +
      '</button>'
    );
  }

  function renderShell(titleKey, bodyHtml, showBack) {
    var pct = progressPct();
    return (
      '<div class="quiz-shell">' +
        '<div class="quiz-progress" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
        '<p class="quiz-progress__label">' + t('quiz.progress', { current: state.step + 1, total: STEPS.length }) + '</p>' +
        (showBack ? '<button type="button" class="quiz-back" id="quiz-back" data-i18n="quiz.back">←</button>' : '') +
        '<div class="quiz-card">' +
          '<h2 class="t-title-3 quiz-step__title" data-i18n="' + titleKey + '"></h2>' +
          bodyHtml +
          '<button type="button" class="btn btn--block quiz-next" id="quiz-next" disabled data-i18n="quiz.next"></button>' +
        '</div>' +
      '</div>'
    );
  }

  function bindOptions(onPick) {
    root.querySelectorAll('.quiz-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll('.quiz-option').forEach(function (b) { b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        onPick(btn.getAttribute('data-value'));
        var next = document.getElementById('quiz-next');
        if (next) next.disabled = false;
      });
    });
  }

  function bindRange(id, onInput, format) {
    var input = document.getElementById(id);
    var out = document.getElementById(id + '-out');
    if (!input) return;
    function sync() {
      var v = Number(input.value);
      if (out) out.textContent = format ? format(v) : String(v);
      onInput(v);
      var next = document.getElementById('quiz-next');
      if (next) next.disabled = false;
    }
    input.addEventListener('input', sync);
    sync();
  }

  function renderStep() {
    var stepId = STEPS[state.step];
    var html = '';
    var titleKey = 'quiz.step.' + stepId + '.title';

    if (stepId === 'goal') {
      html = '<div class="quiz-options">' +
        optionBtn('weight_loss', 'quiz.goal.weight_loss', state.goal === 'weight_loss') +
        optionBtn('appetite', 'quiz.goal.appetite', state.goal === 'appetite') +
        optionBtn('health', 'quiz.goal.health', state.goal === 'health') +
        optionBtn('maintain', 'quiz.goal.maintain', state.goal === 'maintain') +
      '</div>';
    } else if (stepId === 'pain') {
      html = '<div class="quiz-options">' +
        painsForGoal(state.goal).map(function (id) {
          return optionBtn(id, 'quiz.pain.' + id, state.pain === id);
        }).join('') +
      '</div>';
    } else if (stepId === 'gender') {
      html = '<div class="quiz-options quiz-options--2">' +
        optionBtn('female', 'quiz.gender.female', state.gender === 'female') +
        optionBtn('male', 'quiz.gender.male', state.gender === 'male') +
      '</div>';
    } else if (stepId === 'age') {
      html = '<div class="quiz-options quiz-options--2">' +
        ['18-30', '31-45', '46-60', '60+'].map(function (v) {
          return optionBtn(v, 'quiz.age.' + v.replace('+', 'plus'), state.ageGroup === v);
        }).join('') +
      '</div>';
    } else if (stepId === 'height') {
      html =
        '<div class="quiz-range">' +
          '<div class="quiz-range__head"><span data-i18n="quiz.height.label"></span><strong id="quiz-height-out">' + state.height + '</strong></div>' +
          '<input type="range" id="quiz-height" min="140" max="210" step="1" value="' + state.height + '">' +
          '<div class="quiz-range__scale"><span>140</span><span>210</span></div>' +
        '</div>';
    } else if (stepId === 'currentWeight') {
      html =
        '<div class="quiz-range">' +
          '<div class="quiz-range__head"><span data-i18n="quiz.weight.current"></span><strong id="quiz-current-out">' + state.currentWeight + ' ' + t('quiz.kg') + '</strong></div>' +
          '<input type="range" id="quiz-current" min="50" max="180" step="1" value="' + state.currentWeight + '">' +
          '<div class="quiz-range__scale"><span>50</span><span>180</span></div>' +
          '<p class="quiz-range__hint" id="quiz-bmi-preview"></p>' +
        '</div>';
    } else if (stepId === 'targetWeight') {
      var maxTarget = Math.max(45, state.currentWeight - 1);
      if (state.targetWeight >= state.currentWeight) state.targetWeight = maxTarget;
      html =
        '<div class="quiz-range">' +
          '<div class="quiz-range__head"><span data-i18n="quiz.weight.target"></span><strong id="quiz-target-out">' + state.targetWeight + ' ' + t('quiz.kg') + '</strong></div>' +
          '<input type="range" id="quiz-target" min="45" max="' + maxTarget + '" step="1" value="' + state.targetWeight + '">' +
          '<div class="quiz-range__scale"><span>45</span><span>' + maxTarget + '</span></div>' +
          '<p class="quiz-range__hint" id="quiz-forecast-preview"></p>' +
        '</div>';
    } else if (stepId === 'medical') {
      html = '<div class="quiz-medical">';
      html += '<p class="quiz-medical__q" data-i18n="quiz.medical.diabetes"></p><div class="quiz-options quiz-options--2">' +
        optionBtn('no', 'quiz.medical.no', state.diabetes === 'no') +
        optionBtn('yes', 'quiz.medical.yes', state.diabetes === 'yes') +
      '</div>';
      if (state.gender === 'female') {
        html += '<p class="quiz-medical__q" data-i18n="quiz.medical.pregnant"></p><div class="quiz-options quiz-options--2">' +
          optionBtn('no', 'quiz.medical.no', state.pregnant === 'no') +
          optionBtn('yes', 'quiz.medical.yes', state.pregnant === 'yes') +
        '</div>';
        html += '<p class="quiz-medical__q" data-i18n="quiz.medical.breastfeeding"></p><div class="quiz-options quiz-options--2">' +
          optionBtn('no', 'quiz.medical.no', state.breastfeeding === 'no') +
          optionBtn('yes', 'quiz.medical.yes', state.breastfeeding === 'yes') +
        '</div>';
      }
      html += '</div>';
    }

    root.innerHTML = renderShell(titleKey, html, state.step > 0);
    if (window.AvelisI18n && window.AvelisI18n.applyStatic) window.AvelisI18n.applyStatic();

    var nextBtn = document.getElementById('quiz-next');
    var backBtn = document.getElementById('quiz-back');

    if (stepId === 'goal') {
      bindOptions(function (v) { state.goal = v; state.pain = ''; });
      if (state.goal) nextBtn.disabled = false;
    } else if (stepId === 'pain') {
      bindOptions(function (v) { state.pain = v; });
      if (state.pain) nextBtn.disabled = false;
    } else if (stepId === 'gender') {
      bindOptions(function (v) { state.gender = v; });
      nextBtn.disabled = false;
    } else if (stepId === 'age') {
      bindOptions(function (v) { state.ageGroup = v; });
      if (state.ageGroup) nextBtn.disabled = false;
    } else if (stepId === 'height') {
      bindRange('quiz-height', function (v) { state.height = v; }, function (v) { return v + ' ' + t('quiz.cm'); });
      nextBtn.disabled = false;
    } else if (stepId === 'currentWeight') {
      bindRange('quiz-current', function (v) {
        state.currentWeight = v;
        var bmi = calcBmi(v, state.height);
        var el = document.getElementById('quiz-bmi-preview');
        if (el) el.textContent = t('quiz.bmi_preview', { bmi: formatBmi(bmi) });
      }, function (v) { return v + ' ' + t('quiz.kg'); });
      var bmiEl = document.getElementById('quiz-bmi-preview');
      if (bmiEl) bmiEl.textContent = t('quiz.bmi_preview', { bmi: formatBmi(calcBmi(state.currentWeight, state.height)) });
      nextBtn.disabled = false;
    } else if (stepId === 'targetWeight') {
      bindRange('quiz-target', function (v) {
        state.targetWeight = v;
        var months = estimateMonths(state.currentWeight, v);
        var el = document.getElementById('quiz-forecast-preview');
        if (el) {
          el.textContent = months
            ? t('quiz.forecast_preview', { delta: state.currentWeight - v, months: months })
            : t('quiz.forecast_maintain');
        }
      }, function (v) { return v + ' ' + t('quiz.kg'); });
      nextBtn.disabled = false;
    } else if (stepId === 'medical') {
      var medPick = function (field) {
        return function (v) {
          state[field] = v;
          state.stopFactor = state.pregnant === 'yes' || state.breastfeeding === 'yes';
          checkMedicalComplete();
        };
      };
      var groups = root.querySelectorAll('.quiz-medical .quiz-options');
      var fields = ['diabetes'];
      if (state.gender === 'female') fields.push('pregnant', 'breastfeeding');
      groups.forEach(function (group, i) {
        group.querySelectorAll('.quiz-option').forEach(function (btn) {
          btn.addEventListener('click', function () {
            group.querySelectorAll('.quiz-option').forEach(function (b) { b.classList.remove('is-selected'); });
            btn.classList.add('is-selected');
            medPick(fields[i])(btn.getAttribute('data-value'));
          });
        });
      });
      function checkMedicalComplete() {
        var ok = state.diabetes !== '';
        if (state.gender === 'female') ok = ok && state.pregnant !== '' && state.breastfeeding !== '';
        nextBtn.disabled = !ok;
      }
      checkMedicalComplete();
      nextBtn.textContent = t('quiz.finish');
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (state.step > 0) {
          state.step -= 1;
          renderStep();
        } else {
          state.step = -1;
          renderIntro();
        }
      });
    }

    nextBtn.addEventListener('click', function () {
      if (stepId === 'medical') {
        renderLoading();
        window.setTimeout(renderResult, 1400);
        return;
      }
      state.step += 1;
      renderStep();
    });
  }

  function renderLoading() {
    root.innerHTML =
      '<div class="quiz-card quiz-card--loading">' +
        '<div class="quiz-loader" aria-hidden="true"></div>' +
        '<h2 class="t-title-3" data-i18n="quiz.loading.title"></h2>' +
        '<p class="t-text-3" data-i18n="quiz.loading.sub"></p>' +
      '</div>';
    if (window.AvelisI18n && window.AvelisI18n.applyStatic) window.AvelisI18n.applyStatic();
  }

  function renderResult() {
    var rec = recommendProgram();
    var bmi = calcBmi(state.currentWeight, state.height);
    var delta = Math.max(0, state.currentWeight - state.targetWeight);
    var months = estimateMonths(state.currentWeight, state.targetWeight);
    var summary = [
      t('quiz.summary.goal') + ': ' + t('quiz.goal.' + state.goal),
      t('quiz.summary.bmi') + ': ' + formatBmi(bmi),
      t('quiz.summary.weight') + ': ' + state.currentWeight + ' → ' + state.targetWeight + ' ' + t('quiz.kg'),
      t('quiz.summary.program') + ': ' + t(rec.titleKey)
    ].join('\n');

    root.innerHTML =
      '<div class="quiz-result">' +
        '<div class="quiz-card quiz-card--result">' +
          '<p class="quiz-result__eyebrow" data-i18n="quiz.result.eyebrow"></p>' +
          '<h2 class="t-title-2 quiz-result__title" data-i18n="' + rec.titleKey + '"></h2>' +
          '<p class="t-text-2 quiz-result__text" data-i18n="' + rec.textKey + '"></p>' +
          '<ul class="quiz-result__stats">' +
            '<li><strong>' + formatBmi(bmi) + '</strong><span data-i18n="quiz.result.stat_bmi"></span></li>' +
            (delta > 0
              ? '<li><strong>-' + delta + ' ' + t('quiz.kg') + '</strong><span data-i18n="quiz.result.stat_goal"></span></li>' +
                '<li><strong>~' + months + '</strong><span data-i18n="quiz.result.stat_time"></span></li>'
              : '<li><strong>✓</strong><span data-i18n="quiz.result.stat_maintain"></span></li>') +
          '</ul>' +
          '<div class="quiz-result__actions">' +
            '<a class="btn" href="' + rec.href + '" data-i18n="' + rec.ctaKey + '"></a>' +
            '<button type="button" class="btn btn--outline" data-modal="booking" data-i18n="btn.book_consult"></button>' +
          '</div>' +
        '</div>' +
        '<div class="quiz-card quiz-card--form">' +
          '<h3 class="t-title-4" data-i18n="quiz.form.title"></h3>' +
          '<p class="t-text-3" data-i18n="quiz.form.sub"></p>' +
          '<form class="form" id="form-quiz" novalidate>' +
            '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<input type="hidden" name="quizSummary" id="quiz-summary-field">' +
            '<label class="form__row"><span class="t-text-4 form__label" data-i18n="form.name"></span>' +
              '<input type="text" name="name" class="form__input t-text-3" autocomplete="name"></label>' +
            '<label class="form__row"><span class="t-text-4 form__label"><span class="form__req">*</span> <span data-i18n="form.phone"></span></span>' +
              '<input type="tel" name="phone" class="form__input t-text-3" required autocomplete="tel"></label>' +
            '<label class="form__check"><input type="checkbox" name="consent" required><span class="form__check-box"></span>' +
              '<span class="t-text-3" data-i18n-html="form.consent"></span></label>' +
            '<button type="submit" class="btn btn--block" data-i18n="quiz.form.submit"></button>' +
          '</form>' +
          '<p class="form__ok" hidden data-i18n="form.ok"></p>' +
          '<p class="quiz-result__privacy" data-i18n="quiz.form.privacy"></p>' +
        '</div>' +
      '</div>';

    if (window.AvelisI18n && window.AvelisI18n.applyStatic) window.AvelisI18n.applyStatic();

    var field = document.getElementById('quiz-summary-field');
    if (field) field.value = summary;

    var form = document.getElementById('form-quiz');
    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        var data = new FormData(form);
        data.append('formId', 'form-quiz');
        data.append('pageUrl', window.location.href);
        data.append('question', summary);
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = t('btn.sending');
        }
        fetch((window.AVELIS_ROOT || '') + 'api/telegram.php', { method: 'POST', body: data })
          .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
          .then(function (res) {
            if (!res || !res.ok) throw new Error('fail');
            form.hidden = true;
            var ok = form.parentElement.querySelector('.form__ok');
            if (ok) ok.hidden = false;
          })
          .catch(function () { alert(t('form.error')); })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = t('quiz.form.submit');
            }
          });
      });
    }
  }

  function init() {
    if (state.step < 0) renderIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('avelis:langchange', function () {
    if (state.step < 0) renderIntro();
    else if (state.step >= STEPS.length) renderResult();
    else renderStep();
  });
})();
