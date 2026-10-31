/* Shared parts of the calculators on «Схуднення» pages (calc-term, calc-kcal): the exclusion screen, the input
   form with its checks, number formatting. Specs: seo-content/specs/calc-kcal-spec.md §1, calc-term-spec.md §1–2.
   Nothing is stored or sent: values live in the page only. Texts and limits: CONFIG below. */
(function (root) {
  'use strict';

  var CONFIG = {
    // §1 exclusion screen: order = order of the reason line (the first ticked item wins).
    // `ins` covers insulin and sulfonylurea (spec ed. 2, Addendum 2)
    exclusions: ['preg', 'bf', 'ed', 'ins'],
    adultAge: 18,                       // age below this -> exclusion screen, M_U18
    text: {
      uk: {
        question: 'Чи стосується вас щось із переліку?',
        preg: 'Вагітність',
        bf: 'Годування груддю',
        ed: 'Розлад харчової поведінки зараз або в минулому (анорексія, булімія, компульсивне переїдання)',
        ins: 'Діабет, який лікують інсуліном або препаратами сульфонілсечовини',
        none: 'Нічого з переліченого',
        next: 'Далі',
        excluded: 'Розрахунок не для вас. У вашій ситуації норму калорій і безпечний темп має визначити лікар.',
        reason: {
          preg: 'Під час вагітності потреба в енергії зростає, і формула для дорослих її не враховує.',
          bf: 'Під час годування груддю організм витрачає додаткову енергію на вироблення молока.',
          ed: 'За розладу харчової поведінки низькокалорійні дієти спершу оцінює фахівець.',
          ins: 'Зі зниженням ваги потреба в цукрознижувальних ліках змінюється, і дози коригує лікар.',
          u18: 'Калькулятор розрахований на дорослих. Вагу дітей і підлітків оцінюють за віковими таблицями, тож зверніться до педіатра.'
        },
        book: 'Записатися на консультацію',
        change: 'Змінити відповідь'
      },
      ru: {
        question: 'Касается ли вас что-то из списка?',
        preg: 'Беременность',
        bf: 'Грудное вскармливание',
        ed: 'Расстройство пищевого поведения сейчас или в прошлом (анорексия, булимия, компульсивное переедание)',
        ins: 'Диабет, который лечат инсулином или препаратами сульфонилмочевины',
        none: 'Ничего из перечисленного',
        next: 'Далее',
        excluded: 'Расчёт не для вас. В вашей ситуации норму калорий и безопасный темп должен определить врач.',
        reason: {
          preg: 'Во время беременности потребность в энергии растёт, и формула для взрослых её не учитывает.',
          bf: 'Во время грудного вскармливания организм тратит дополнительную энергию на выработку молока.',
          ed: 'При расстройстве пищевого поведения низкокалорийные диеты сначала оценивает специалист.',
          ins: 'При снижении веса потребность в сахароснижающих лекарствах меняется, и дозы корректирует врач.',
          u18: 'Калькулятор рассчитан на взрослых. Вес детей и подростков оценивают по возрастным таблицам, поэтому обратитесь к педиатру.'
        },
        book: 'Записаться на консультацию',
        change: 'Изменить ответ'
      }
    }
  };

  // ---------------------------------------------------------------- numbers (pure, tested in tools/qa/calc_tests.js)

  function roundHalfUp(x, digits) {
    var f = Math.pow(10, digits || 0);
    return Math.floor(x * f + 0.5 + 1e-9) / f;
  }
  function ceilEps(x) { return Math.ceil(x - 1e-9); }
  function floorTo(x, step) { return Math.floor(x / step + 1e-9) * step; }
  function ceilTo(x, step) { return Math.ceil(x / step - 1e-9) * step; }
  function ceilToTenth(x) { return Math.ceil(x * 10 - 1e-9) / 10; }
  /** decimal comma; digits fixed (BMI 1, WHtR 2) or trimmed (weights: 9 and 4,5) */
  function fmt(x, digits, trim) {
    var r = roundHalfUp(x, digits);
    var s = r.toFixed(digits);
    if (trim && digits > 0) s = s.replace(/\.?0+$/, '');
    return s.replace('.', ',');
  }
  function parseNum(v) {
    if (v == null) return NaN;
    var s = String(v).trim().replace(',', '.');
    return s === '' ? NaN : Number(s);
  }
  function bmiOf(weight, heightCm) {
    var h = heightCm / 100;
    return weight / (h * h);
  }
  /** smallest weight (0.1 kg steps) whose shown BMI (0.1, half-up) is >= bmi; largest whose shown BMI is <= bmi */
  function minWeightFor(bmi, heightCm) {
    var w = Math.floor((bmi - 0.2) * Math.pow(heightCm / 100, 2) * 10) / 10;
    while (roundHalfUp(bmiOf(w, heightCm), 1) < bmi) w = roundHalfUp(w + 0.1, 1);
    return w;
  }
  function maxWeightFor(bmi, heightCm) {
    var w = Math.ceil((bmi + 0.2) * Math.pow(heightCm / 100, 2) * 10) / 10;
    while (roundHalfUp(bmiOf(w, heightCm), 1) > bmi) w = roundHalfUp(w - 0.1, 1);
    return w;
  }

  var api = {
    CONFIG: CONFIG, roundHalfUp: roundHalfUp, ceilEps: ceilEps, floorTo: floorTo, ceilTo: ceilTo,
    ceilToTenth: ceilToTenth, fmt: fmt, parseNum: parseNum, bmiOf: bmiOf, minWeightFor: minWeightFor, maxWeightFor: maxWeightFor
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  // ---------------------------------------------------------------- page helpers

  function lang() {
    var l = root.AVELIS_LANG || document.documentElement.lang;
    return l === 'ru' ? 'ru' : 'uk';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fill(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }
  /** a site page in the page language: /skhudnennia/x.html -> /ru/skhudnennia/x.html on RU pages */
  function pageUrl(path) {
    return lang() === 'ru' ? '/ru' + path : path;
  }
  function bookBtn(label, formId, cls) {
    return '<button type="button" class="btn' + (cls ? ' ' + cls : '') + '" data-modal="booking" data-form-id="' +
      esc(formId) + '">' + esc(label) + '</button>';
  }
  function linkBtn(label, path, cls) {
    return '<a class="btn' + (cls ? ' ' + cls : '') + '" href="' + esc(pageUrl(path)) + '">' + esc(label) + '</a>';
  }

  /**
   * Mount a calculator into `el`: exclusion screen -> form -> result.
   * opts: {formId, fields: [{name, kind: 'number'|'radio', min, max, step, int, label, error, options: [{value, label}]}],
   *        submit: label, compute(values) -> result HTML}. Field texts come already in the page language.
   */
  function mount(el, opts) {
    var T = CONFIG.text[lang()];
    var uid = 'calc-' + opts.formId;
    el.innerHTML =
      '<div class="bmi-calc-card calc">' +
        '<div class="calc-step calc-excl">' +
          '<p class="calc-q" id="' + uid + '-q">' + esc(T.question) + '</p>' +
          '<div class="calc-checks" role="group" aria-labelledby="' + uid + '-q">' +
            CONFIG.exclusions.concat(['none']).map(function (k) {
              return '<label class="calc-check"><input type="checkbox" value="' + k + '"><span>' + esc(T[k]) + '</span></label>';
            }).join('') +
          '</div>' +
          '<button type="button" class="btn calc-next" disabled>' + esc(T.next) + '</button>' +
        '</div>' +
        '<form class="bmi-form calc-step calc-form" novalidate hidden>' +
          '<div class="bmi-form__grid calc-grid">' + opts.fields.map(fieldHtml).join('') + '</div>' +
          '<button type="submit" class="btn btn--block bmi-submit">' + esc(opts.submit) + '</button>' +
          '<button type="button" class="calc-link calc-back">' + esc(T.change) + '</button>' +
        '</form>' +
        '<div class="bmi-result calc-result" hidden aria-live="polite"></div>' +
      '</div>';

    function fieldHtml(f) {
      var id = uid + '-' + f.name;
      if (f.kind === 'radio') {
        return '<fieldset class="bmi-field calc-field calc-field--choice"><legend class="bmi-field__label">' + esc(f.label) + '</legend>' +
          '<div class="calc-choices">' + f.options.map(function (o) {
            return '<label class="calc-choice"><input type="radio" name="' + id + '" value="' + esc(o.value) + '"><span>' + esc(o.label) + '</span></label>';
          }).join('') + '</div><span class="calc-error" hidden></span></fieldset>';
      }
      return '<label class="bmi-field calc-field"><span class="bmi-field__label">' + esc(f.label) + '</span>' +
        '<input class="bmi-field__input" type="number" name="' + id + '" min="' + f.min + '" max="' + f.max + '" step="' +
        (f.step || 1) + '" inputmode="' + (f.int ? 'numeric' : 'decimal') + '">' +
        '<span class="calc-error" hidden></span></label>';
    }

    var excl = el.querySelector('.calc-excl');
    var form = el.querySelector('.calc-form');
    var out = el.querySelector('.calc-result');
    var boxes = [].slice.call(excl.querySelectorAll('input[type="checkbox"]'));
    var next = excl.querySelector('.calc-next');

    boxes.forEach(function (b) {
      b.addEventListener('change', function () {
        if (b.checked && b.value === 'none') boxes.forEach(function (o) { if (o !== b) o.checked = false; });
        if (b.checked && b.value !== 'none') boxes.forEach(function (o) { if (o.value === 'none') o.checked = false; });
        next.disabled = !boxes.some(function (o) { return o.checked; });
      });
    });

    function show(step) {
      excl.hidden = step !== 'excl';
      form.hidden = step !== 'form';
      if (step !== 'result') out.hidden = true;
    }
    function excluded(reasonKey) {
      show('result');
      out.innerHTML =
        '<p class="calc-result__title">' + esc(T.excluded) + '</p>' +
        '<p class="calc-note">' + esc(T.reason[reasonKey]) + '</p>' +
        '<div class="calc-actions">' + bookBtn(T.book, opts.formId) +
        '<button type="button" class="calc-link calc-again">' + esc(T.change) + '</button></div>';
      out.hidden = false;
      out.querySelector('.calc-again').addEventListener('click', function () { show('excl'); });
    }

    next.addEventListener('click', function () {
      var ticked = CONFIG.exclusions.filter(function (k) {
        return boxes.some(function (b) { return b.checked && b.value === k; });
      });
      if (ticked.length) excluded(ticked[0]);
      else show('form');
    });
    form.querySelector('.calc-back').addEventListener('click', function () { show('excl'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = {}, ok = true;
      opts.fields.forEach(function (f) {
        var err, v;
        if (f.kind === 'radio') {
          var c = form.querySelector('input[name="' + uid + '-' + f.name + '"]:checked');
          v = c ? c.value : '';
          err = !v;
        } else {
          v = parseNum(form.querySelector('input[name="' + uid + '-' + f.name + '"]').value);
          err = isNaN(v) || (f.int && Math.floor(v) !== v) || v > f.max || (v < f.min && !(f.name === 'age' && v >= 0));
        }
        values[f.name] = v;
        var box = form.querySelector('[name="' + uid + '-' + f.name + '"]').closest('.calc-field').querySelector('.calc-error');
        box.textContent = err ? f.error : '';
        box.hidden = !err;
        if (err) ok = false;
      });
      // an age under 18 is not a typo: it leads to the exclusion screen (M_U18), whatever else is filled in
      if (!isNaN(values.age) && values.age >= 0 && values.age < CONFIG.adultAge && Math.floor(values.age) === values.age) {
        excluded('u18');
        return;
      }
      if (!ok) { out.hidden = true; return; }
      out.innerHTML = opts.compute(values);
      out.hidden = false;
    });
  }

  root.AvelisCalcCommon = {
    CONFIG: CONFIG, fmt: fmt, parseNum: parseNum, bmiOf: bmiOf, minWeightFor: minWeightFor, maxWeightFor: maxWeightFor,
    roundHalfUp: roundHalfUp, ceilEps: ceilEps,
    floorTo: floorTo, ceilTo: ceilTo, ceilToTenth: ceilToTenth, lang: lang, esc: esc, fill: fill, pageUrl: pageUrl,
    bookBtn: bookBtn, linkBtn: linkBtn, mount: mount
  };
})(typeof window !== 'undefined' ? window : this);
