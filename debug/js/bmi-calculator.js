/* BMI calculator (/kalkulyator-imt.html and the short form on /skhudnennia.html).
   Spec: seo-content/specs/bmi-whtr-spec.md — BMI (WHO), waist-to-height ratio (NICE NG246 1.9.14), scenario BMI × WHtR,
   under 18 / 65+ / athletic notes, call to action without drugs. Removed (spec §5): GLP-1 «threshold» hints,
   «WHO 22–27 for 65+», Devine ideal weight, activity multipliers and the one-number calorie estimate.
   Every limit, threshold and text is in CONFIG; evaluate() is pure (tools/qa/calc_tests.js). */
(function (root) {
  'use strict';

  var CONFIG = {
    height: { min: 120, max: 230 },      // the same ranges in all S2 widgets
    weight: { min: 35, max: 300 },
    waist: { min: 40, max: 200 },
    adultAge: 18,                        // §4.1
    seniorAge: 65,                       // §4.2
    // WHO adult classes, upper bounds. All thresholds compare the SHOWN values: BMI 0.1, WHtR 0.01, half-up
    tiers: [['under', 18.5], ['normal', 25], ['over', 30], ['ob1', 35], ['ob2', 40], ['ob3', Infinity]],
    tones: { under: 'info', normal: 'ok', over: 'warn', ob1: 'alert', ob2: 'alert', ob3: 'alert' },
    normRange: [18.5, 24.9],             // «Норма за ІМТ»: lowest..highest weight (0.1 kg) whose shown BMI is in range
    whtr: { healthy: 0.40, increased: 0.50, high: 0.60, maxBmi: 35 },   // §2
    scenario: { under: 18.5, over: 25, obese: 30, s5: 35, s6: 40 },     // §3 (S3a 25–29.9, S3b 30–34.9)
    cta: { under: 18.5, bmi: 25, whtr: 0.50 },                          // §4.4: S0 (booking first), BMI >= 25, WHtR >= 0.50
    // waist risk, cm: warn from IDF (>= 80 / >= 94), high above WHO 2008 (> 88 / > 102) — spec §5.7
    waistRisk: { female: [80, 88], male: [94, 102] },
    scale: [15, 45],
    // §1: the WHO class table of the page text (.art-table): rows found by their first cell
    tableRows: [
      ['under', /^(менше|меньше)\s*18[,.]5/i],
      ['normal', /^18[,.]5\s*[–-]\s*24[,.]9/],
      ['over', /^25([,.]0)?\s*[–-]\s*29[,.]9/],
      ['ob1', /^30([,.]0)?\s*[–-]\s*34[,.]9/],
      ['ob2', /^35([,.]0)?\s*[–-]\s*39[,.]9/],
      ['ob3', /^40\b/]
    ],
    links: { quiz: '/quiz.html', kcal: '/skhudnennia/kalkulyator-kalorii.html', bmi: '/kalkulyator-imt.html' },
    formId: 'bmi',
    storageKey: 'avelis_bmi_last',       // BMI and time only (spec §5.8: never waist or age)
    text: {
      uk: {
        // the names of the WHO table in the page text (kalkulyator-imt.md), the same in the quiz
        cat: { under: 'недостатня маса тіла', normal: 'нормальна маса тіла', over: 'надлишкова маса (передожиріння)',
               ob1: 'ожиріння I ступеня', ob2: 'ожиріння II ступеня', ob3: 'ожиріння III ступеня' },
        kg: 'кг', range: 'Норма за ІМТ',
        delta: 'Зміна з попереднього розрахунку: {diff} ІМТ',
        whtr: 'Співвідношення талії до зросту',
        whtr_rule: 'NICE: тримайте талію меншою за половину зросту (менше 0,5).',
        whtr_cat: {
          lt40: 'Менше 0,40: NICE окремої категорії не задає.',
          healthy: "0,40–0,49: здоровий рівень жиру на животі, ризики не підвищені (NICE).",
          increased: "0,50–0,59: надлишок жиру на животі, ризики діабету 2 типу, гіпертензії і серцево-судинних хвороб підвищені (NICE).",
          high: '0,60 і більше: значний надлишок жиру на животі, ризики ще вищі (NICE).'
        },
        W_BMI35: 'За ІМТ 35 і вище NICE це співвідношення не використовує: оцінку дає ІМТ.',
        err_waist: 'Вкажіть обхват талії від 40 до 200 см',
        waist: 'Обхват талії',
        waist_risk: { ok: 'Нижче порогу IDF', warn: 'Надлишок жиру на животі за IDF (≥ 80 / ≥ 94 см)',
                      high: 'Суттєво підвищений ризик (ВООЗ 2008: понад 88 / 102 см)' },
        S: {
          S0: ['Недостатня маса тіла', 'Схуднення в такому разі не рекомендоване; зверніться до лікаря.'],
          S1: ['Обидва показники в нормі', 'ІМТ відповідає нормі за ВООЗ, а співвідношення 0,40–0,49 за NICE означає, що ризики не підвищені. Мета — зберегти вагу і талію.'],
          S2: ['ІМТ у нормі, талія — ні', 'Нормальний ІМТ не виключає надлишку жиру на животі (NICE), а ризики діабету 2 типу, гіпертензії і серцево-судинних хвороб підвищені. Обговоріть з лікарем, які обстеження потрібні.'],
          S3a: ['ІМТ підвищений, талія в нормі', "Так буває за великої м'язової маси; надлишку жиру на животі за цим показником немає. Стежте за вагою і талією, а за супутніх хвороб обговоріть результат з лікарем."],
          S3b: ['ІМТ підвищений, талія в нормі', 'ІМТ {bmi}: за ВООЗ це ожиріння I ступеня, навіть якщо талія в нормі. План варто обговорити з лікарем.'],
          S4: ['Обидва показники підвищені', "У такому разі NHS радить звернутися до лікаря: він оцінить, чи вплинула вага на здоров'я."],
          S5: ['ІМТ 35 і вище', 'За такого ІМТ співвідношення талії до зросту не використовують; план варто обговорити з ендокринологом.'],
          S6: ['ІМТ 40 і вище', 'За ІМТ 40 і вище надлишок жиру вважається підтвердженим без додаткових вимірювань (комісія The Lancet Diabetes & Endocrinology, 2025). План варто складати з лікарем.']
        },
        S_NOWAIST: 'Додайте обхват талії: разом з ІМТ він точніше показує ризики (NICE).',
        S3b_nowaist: 'ІМТ {bmi}: за ВООЗ це ожиріння I ступеня. План варто обговорити з лікарем.',  // 30 <= BMI < 35, no waist
        S_NOWAIST_LINK: 'Калькулятор ІМТ і талії',          // the short form on «Схуднення» has no waist field
        extra060: 'Співвідношення 0,6 і більше: NICE оцінює ризики як ще вищі.',
        U18: 'Калькулятор розрахований на дорослих. У дітей і підлітків вагу оцінюють за ІМТ для віку і статі (ВООЗ) або центильними кривими (NICE); зверніться до педіатра.',
        // age is optional (supervisor 31.10): without it this line goes under the result; U18 / A65 only with an age
        ADULT_ONLY: 'Калькулятор розрахований на дорослих 18 років і старших; у дітей і підлітків ІМТ оцінюють за віковими таблицями.',
        A65: 'Після 65 років NICE радить тлумачити ІМТ обережно, з урахуванням хвороб, фізичної функції і можливого захисного ефекту трохи вищого ІМТ. Окремої норми для цього віку ВООЗ і NICE не встановлюють.',
        ATH: "За великої м'язової маси ІМТ може завищувати кількість жиру (NICE). Орієнтуйтеся на співвідношення талії до зросту: воно придатне і для вас.",
        kcal: 'Добова норма калорій', kcal_link: 'Калькулятор калорій',   // spec §5.3: link instead of the estimate
        cta_quiz: 'Пройти тест на схуднення', cta_book: 'Записатися на консультацію'
      },
      ru: {
        cat: { under: 'недостаточная масса тела', normal: 'нормальная масса тела', over: 'избыточная масса (предожирение)',
               ob1: 'ожирение I степени', ob2: 'ожирение II степени', ob3: 'ожирение III степени' },
        kg: 'кг', range: 'Норма по ИМТ',
        delta: 'Изменение с прошлого расчёта: {diff} ИМТ',
        whtr: 'Соотношение талии к росту',
        whtr_rule: 'NICE: держите талию меньше половины роста (меньше 0,5).',
        whtr_cat: {
          lt40: 'Меньше 0,40: NICE отдельной категории не задаёт.',
          healthy: '0,40–0,49: здоровый уровень жира на животе, риски не повышены (NICE).',
          increased: '0,50–0,59: избыток жира на животе, риски диабета 2 типа, гипертензии и сердечно-сосудистых болезней повышены (NICE).',
          high: '0,60 и больше: значительный избыток жира на животе, риски ещё выше (NICE).'
        },
        W_BMI35: 'При ИМТ 35 и выше NICE это соотношение не использует: оценку даёт ИМТ.',
        err_waist: 'Укажите обхват талии от 40 до 200 см',
        waist: 'Обхват талии',
        waist_risk: { ok: 'Ниже порога IDF', warn: 'Избыток жира на животе по IDF (≥ 80 / ≥ 94 см)',
                      high: 'Существенно повышенный риск (ВОЗ 2008: больше 88 / 102 см)' },
        S: {
          S0: ['Недостаточная масса тела', 'Похудение в таком случае не рекомендуется; обратитесь к врачу.'],
          S1: ['Оба показателя в норме', 'ИМТ соответствует норме по ВОЗ, а соотношение 0,40–0,49 по NICE означает, что риски не повышены. Цель — сохранить вес и талию.'],
          S2: ['ИМТ в норме, талия — нет', 'Нормальный ИМТ не исключает избытка жира на животе (NICE), а риски диабета 2 типа, гипертензии и сердечно-сосудистых болезней повышены. Обсудите с врачом, какие обследования нужны.'],
          S3a: ['ИМТ повышен, талия в норме', 'Так бывает при большой мышечной массе; избытка жира на животе по этому показателю нет. Следите за весом и талией, а при сопутствующих болезнях обсудите результат с врачом.'],
          S3b: ['ИМТ повышен, талия в норме', 'ИМТ {bmi}: по ВОЗ это ожирение I степени, даже если талия в норме. План стоит обсудить с врачом.'],
          S4: ['Оба показателя повышены', 'В таком случае NHS советует обратиться к врачу: он оценит, повлиял ли вес на здоровье.'],
          S5: ['ИМТ 35 и выше', 'При таком ИМТ соотношение талии к росту не используют; план стоит обсудить с эндокринологом.'],
          S6: ['ИМТ 40 и выше', 'При ИМТ 40 и выше избыток жира считается подтверждённым без дополнительных измерений (комиссия The Lancet Diabetes & Endocrinology, 2025). План стоит составлять с врачом.']
        },
        S_NOWAIST: 'Добавьте обхват талии: вместе с ИМТ он точнее показывает риски (NICE).',
        S3b_nowaist: 'ИМТ {bmi}: по ВОЗ это ожирение I степени. План стоит обсудить с врачом.',
        S_NOWAIST_LINK: 'Калькулятор ИМТ и талии',
        extra060: 'Соотношение 0,6 и больше: NICE оценивает риски как ещё более высокие.',
        U18: 'Калькулятор рассчитан на взрослых. У детей и подростков вес оценивают по ИМТ для возраста и пола (ВОЗ) или центильным кривым (NICE); обратитесь к педиатру.',
        ADULT_ONLY: 'Калькулятор рассчитан на взрослых 18 лет и старше; у детей и подростков ИМТ оценивают по возрастным таблицам.',
        A65: 'После 65 лет NICE советует толковать ИМТ осторожно, с учётом болезней, физической функции и возможного защитного эффекта чуть более высокого ИМТ. Отдельной нормы для этого возраста ВОЗ и NICE не устанавливают.',
        ATH: 'При большой мышечной массе ИМТ может завышать количество жира (NICE). Ориентируйтесь на соотношение талии к росту: оно подходит и для вас.',
        kcal: 'Суточная норма калорий', kcal_link: 'Калькулятор калорий',
        cta_quiz: 'Пройти тест на похудение', cta_book: 'Записаться на консультацию'
      }
    }
  };
  var C = CONFIG;

  function round1(x) { return Math.floor(x * 10 + 0.5 + 1e-9) / 10; }
  function round2(x) { return Math.floor(x * 100 + 0.5 + 1e-9) / 100; }
  /** lowest (dir 1) / highest (dir -1) weight, 0.1 kg steps, whose shown BMI reaches `bmi` */
  function weightFor(bmi, heightCm, dir) {
    var m2 = Math.pow(heightCm / 100, 2), w = round1((bmi - 0.2 * dir) * m2);
    while (dir > 0 ? round1(w / m2) < bmi : round1(w / m2) > bmi) w = round1(w + 0.1 * dir);
    return w;
  }

  /** inp: {sex: 'female'|'male', height, weight, age: number|null, waist: number|null, body: string|null}
      -> null (no valid height/weight) or everything the result panel shows */
  function evaluate(inp) {
    var h = inp.height, w = inp.weight;
    if (!(h >= C.height.min && h <= C.height.max && w >= C.weight.min && w <= C.weight.max)) return null;
    var m = h / 100;
    var bmi = round1(w / (m * m));
    var tier = C.tiers.filter(function (t) { return bmi < t[1]; })[0][0];
    var r = { bmi: bmi, tier: tier, tone: C.tones[tier], u18: inp.age != null && inp.age >= 0 && inp.age < C.adultAge,
              norm: [weightFor(C.normRange[0], h, 1), weightFor(C.normRange[1], h, -1)], noAge: inp.age == null,
              whtr: null, whtrCat: null, waistErr: false, scenario: null, extra060: false, a65: false, ath: false,
              cta: false, waistRisk: null };
    if (inp.waist != null) {
      if (inp.waist >= C.waist.min && inp.waist <= C.waist.max) r.whtr = round2(inp.waist / h);
      else r.waistErr = true;
    }
    if (r.u18) return r;                                              // §4.1: nothing for adults
    if (r.whtr != null && bmi < C.whtr.maxBmi) {
      r.whtrCat = r.whtr < C.whtr.healthy ? 'lt40' : r.whtr < C.whtr.increased ? 'healthy' : r.whtr < C.whtr.high ? 'increased' : 'high';
    }
    var S = C.scenario, hi = r.whtr != null && r.whtr >= C.whtr.increased;
    if (bmi < S.under) r.scenario = 'S0';
    else if (bmi >= S.s6) r.scenario = 'S6';
    else if (bmi >= S.s5) r.scenario = 'S5';
    else if (r.whtr == null) r.scenario = bmi < S.obese ? 'S_NOWAIST' : 'S_NOWAIST30';   // + S3b_nowaist at 30–34.9
    else if (bmi < S.over) r.scenario = hi ? 'S2' : 'S1';
    else r.scenario = hi ? 'S4' : bmi < S.obese ? 'S3a' : 'S3b';
    r.extra060 = (r.scenario === 'S2' || r.scenario === 'S4') && r.whtr >= C.whtr.high;
    r.a65 = inp.age != null && inp.age >= C.seniorAge;
    r.ath = inp.body === 'athletic';
    r.cta = bmi < C.cta.under || bmi >= C.cta.bmi || (r.whtr != null && r.whtr >= C.cta.whtr);
    if (inp.waist != null && !r.waistErr) {
      var t = C.waistRisk[inp.sex === 'male' ? 'male' : 'female'];
      r.waistRisk = inp.waist < t[0] ? 'ok' : inp.waist > t[1] ? 'high' : 'warn';
    }
    return r;
  }

  var api = { CONFIG: CONFIG, evaluate: evaluate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.AvelisBmi = api;

  var form = document.getElementById('bmi-form');
  if (!form) return;

  var heightInput = document.getElementById('bmi-height');
  var weightInput = document.getElementById('bmi-weight');
  var ageInput = document.getElementById('bmi-age');
  var waistInput = document.getElementById('bmi-waist');
  var bodyTypeSelect = document.getElementById('bmi-body-type');
  var resultPanel = document.getElementById('bmi-result');
  var valueEl = document.getElementById('bmi-value');
  var categoryEl = document.getElementById('bmi-category');
  var hintEl = document.getElementById('bmi-hint');
  var extrasEl = document.getElementById('bmi-extras');
  var deltaEl = document.getElementById('bmi-delta');
  var markerEl = document.getElementById('bmi-scale-marker');

  function lang() {
    var l = root.AVELIS_LANG || document.documentElement.lang;
    return l === 'ru' ? 'ru' : 'uk';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(n, d) { return n.toFixed(d).replace('.', ','); }
  function href(path) { return lang() === 'ru' ? '/ru' + path : path; }
  function val(el) {
    if (!el || el.value === '') return null;
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isNaN(v) ? null : v;
  }

  // WHO class rows: the old [data-bmi-tier] block, or the table of the generated text matched by its first cells
  function tierRows() {
    [].forEach.call(document.querySelectorAll('.art-table table'), function (table) {
      var rows = [].slice.call(table.querySelectorAll('tbody tr'));
      var hits = rows.map(function (tr) {
        var cell = tr.querySelector('td, th');
        var txt = cell ? cell.textContent.replace(/\s+/g, ' ').trim() : '';
        var m = C.tableRows.filter(function (p) { return p[1].test(txt); })[0];
        return m ? m[0] : null;
      });
      if (hits.filter(Boolean).length >= C.tableRows.length - 1) {
        rows.forEach(function (tr, i) { if (hits[i]) tr.setAttribute('data-bmi-tier', hits[i]); });
      }
    });
    return document.querySelectorAll('[data-bmi-tier]');
  }
  var categoryRows = tierRows();

  function highlightTiers(tierId) {
    [].forEach.call(categoryRows, function (row) {
      var active = row.getAttribute('data-bmi-tier') === tierId;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function saveResult(bmi) {
    try {
      var prev = JSON.parse(localStorage.getItem(C.storageKey) || 'null');
      localStorage.setItem(C.storageKey, JSON.stringify({ bmi: bmi, at: Date.now() }));
      return prev && typeof prev.bmi === 'number' ? prev.bmi : null;
    } catch (e) {
      return null;
    }
  }

  function row(label, value, tone) {
    return '<div class="bmi-extra' + (tone ? ' bmi-extra--' + tone : '') + '"><span class="bmi-extra__label">' + esc(label) +
      '</span>' + value + '</div>';
  }
  function note(text, cls) { return '<p class="bmi-extra__note' + (cls ? ' ' + cls : '') + '">' + text + '</p>'; }

  function calculate() {
    var T = C.text[lang()];
    var checked = form.querySelector('input[name="gender"]:checked');
    var r = evaluate({
      sex: checked ? checked.value : 'female', height: val(heightInput), weight: val(weightInput),
      age: val(ageInput), waist: val(waistInput), body: bodyTypeSelect ? bodyTypeSelect.value : null
    });
    if (!r) {
      resultPanel.hidden = true;
      highlightTiers('');
      return;
    }
    valueEl.textContent = num(r.bmi, 1);
    var extras = [];
    if (r.u18) {
      categoryEl.textContent = '';
      categoryEl.className = 'bmi-result__category';
      if (hintEl) hintEl.textContent = T.U18;
      highlightTiers('');
    } else {
      categoryEl.textContent = T.cat[r.tier].charAt(0).toUpperCase() + T.cat[r.tier].slice(1);
      categoryEl.className = 'bmi-result__category bmi-result__category--' + r.tone;
      var sc = /^S_NOWAIST/.test(r.scenario) ? null : T.S[r.scenario];
      if (hintEl) {
        hintEl.innerHTML = sc
          ? '<strong class="bmi-scenario__title">' + esc(sc[0]) + '</strong> ' + esc(sc[1].replace('{bmi}', num(r.bmi, 1))) +
            (r.extra060 ? ' ' + esc(T.extra060) : '')
          : esc(T.S_NOWAIST) + (waistInput ? '' : ' <a href="' + esc(href(C.links.bmi)) + '">' + esc(T.S_NOWAIST_LINK) + '</a>') +
            (r.scenario === 'S_NOWAIST30' ? ' ' + esc(T.S3b_nowaist.replace('{bmi}', num(r.bmi, 1))) : '');
      }
      if (r.whtr != null) {
        extras.push(row(T.whtr, '<strong>' + num(r.whtr, 2) + '</strong>',
          r.whtrCat === 'increased' ? 'warn' : r.whtrCat === 'high' ? 'alert' : r.whtrCat === 'healthy' ? 'ok' : ''));
        extras.push(note(esc(r.whtrCat ? T.whtr_cat[r.whtrCat] : T.W_BMI35)));
        extras.push(note(esc(T.whtr_rule), 'bmi-extra__note--small'));
      }
      if (r.waistRisk) extras.push(row(T.waist, '<span>' + esc(T.waist_risk[r.waistRisk]) + '</span>',
        { ok: 'ok', warn: 'warn', high: 'alert' }[r.waistRisk]));
      extras.push(row(T.range, '<strong>' + num(r.norm[0], 1) + '–' + num(r.norm[1], 1) + ' ' + esc(T.kg) + '</strong>'));
      extras.push(row(T.kcal, '<a href="' + esc(href(C.links.kcal)) + '">' + esc(T.kcal_link) + '</a>'));
      if (r.a65) extras.push(note(esc(T.A65)));
      if (r.ath) extras.push(note(esc(T.ATH)));
      if (r.noAge) extras.push(note(esc(T.ADULT_ONLY), 'bmi-extra__note--small'));
      if (r.cta) {
        var quiz = function (cls) { return '<a class="' + cls + '" href="' + esc(href(C.links.quiz)) + '">' + esc(T.cta_quiz) + '</a>'; };
        var book = function (cls) {
          return '<button type="button" class="' + cls + '" data-modal="booking" data-form-id="' + C.formId + '">' + esc(T.cta_book) + '</button>';
        };
        extras.push('<div class="bmi-actions">' + (r.scenario === 'S0' ? book('btn') + quiz('btn btn--outline')
          : quiz('btn') + book('btn btn--outline')) + '</div>');
      }
      highlightTiers(r.tier);
    }
    if (r.waistErr) extras.unshift(note(esc(T.err_waist), 'bmi-extra__note--error'));
    if (extrasEl) extrasEl.innerHTML = extras.join('');

    var prevBmi = saveResult(r.bmi);
    if (deltaEl) {
      if (prevBmi !== null && Math.abs(prevBmi - r.bmi) >= 0.1) {
        var diff = Math.round((r.bmi - prevBmi) * 10) / 10;
        deltaEl.textContent = T.delta.replace('{diff}', (diff > 0 ? '+' : '') + num(diff, 1));
        deltaEl.hidden = false;
      } else {
        deltaEl.hidden = true;
      }
    }
    if (markerEl) {
      var lo = C.scale[0], hi = C.scale[1];
      markerEl.style.left = ((Math.max(lo, Math.min(hi, r.bmi)) - lo) / (hi - lo)) * 100 + '%';
      markerEl.setAttribute('aria-valuenow', String(r.bmi));
    }
    resultPanel.hidden = false;
    resultPanel.classList.remove('bmi-result--animate');
    void resultPanel.offsetWidth;
    resultPanel.classList.add('bmi-result--animate');
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

  if (heightInput && weightInput && heightInput.value && weightInput.value) calculate();
})(typeof window !== 'undefined' ? window : this);
