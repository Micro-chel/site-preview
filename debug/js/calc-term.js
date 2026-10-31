/* Weight-loss term calculator (`::widget calc-term::`, /skhudnennia/kalkulyator-stroku-skhudnennia.html).
   Spec: seo-content/specs/calc-term-spec.md. Result = a range of two dates, never one. Nothing stored or sent.
   Every limit, threshold and text is in CONFIG; compute() is pure (tools/qa/calc_tests.js). */
(function (root) {
  'use strict';

  var CONFIG = {
    fields: {                                     // §2
      weight: { min: 35, max: 300, step: 0.1 },
      target: { min: 30, max: 300, step: 0.1 },
      height: { min: 120, max: 230, step: 0.1 },
      age: { min: 18, max: 100, int: true }
    },
    paceFast: 1.0,                // kg/week, NHS 0,5–1 kg/week (R4 §5)
    paceSlow: 0.5,
    weekMonths: 4.35,             // weeks per month, caption «≈ N міс.» only
    bmiUnder: 18.5,               // WHO underweight (E2, E3)
    stagePct: 10,                 // N1: goal above 10 % of the weight -> first stage
    stageLo: 0.05, stageHi: 0.10, // NIDDK first goal 5–10 %
    slowdownWeeks: 26,            // N2: slow bound beyond 26 weeks (NHLBI 1998: after 6 months the rate declines)
    bmiObese: 30, bmiSevere: 40,  // N3, N4
    bigGoalPct: 15,               // N5: product threshold (spec: for the doctors to approve)
    seniorAge: 65,                // N6
    // one doctor message, N4 > N5 > N3; N5 with BMI >= 30 -> N_DOCTOR_BIG30 (spec ed. 2, §4). BMI thresholds compare
    // the shown value (0.1, half-up)
    links: { kcal: '/skhudnennia/kalkulyator-kalorii.html' },
    formId: 'calc-term',
    text: {
      uk: {
        weight: 'Поточна вага, кг', target: 'Бажана вага, кг', height: 'Зріст, см', age: 'Вік, років',
        err_weight: 'Вкажіть вагу від 35 до 300 кг', err_target: 'Вкажіть бажану вагу від 30 до 300 кг',
        err_height: 'Вкажіть зріст від 120 до 230 см', err_age: 'Вкажіть вік від 18 до 100 років',
        submit: 'Розрахувати строк',
        title: 'Мінус {goal} кг: {w1}–{w2} тижнів',
        months: '≈ {m1}–{m2} міс.',
        dates: 'Орієнтовно з {d1} до {d2}',
        R_PACE: 'Розрахунок за темпом 0,5–1 кг на тиждень, який радить NHS. Раніша дата відповідає 1 кг на тиждень, пізніша 0,5 кг; щоб тримати темп, раціон і активність переглядають у міру схуднення.',
        R_WATER: "У перші тижні вага часто падає швидше через воду, пов'язану з глікогеном; далі темп повільніший.",
        N_STAGE: 'Перший етап: мінус {s_lo}–{s_hi} кг (5–10 % ваги), приблизно {w1}–{w2} тижнів. NIDDK радить починати саме з такої цілі на 6 місяців.',
        N_SLOWDOWN: 'Частина шляху припадає на період після 6 місяців, коли темп зазвичай сповільнюється. Реальний строк може бути довшим за пізнішу дату.',
        N_DOCTOR_BMI30: 'Ваш ІМТ {bmi}: це ожиріння за класифікацією ВООЗ. План краще скласти з ендокринологом, який оцінить супутні стани.',
        N_DOCTOR_BMI40: "Ваш ІМТ {bmi}. За такого ІМТ план схуднення варто складати з лікарем: він оцінить стан здоров'я і всі доступні підходи.",
        N_DOCTOR_BIG: 'Ціль більша за 15 % ваги. Почніть з першого етапу, а повний план зручніше скласти з ендокринологом.',
        N_DOCTOR_BIG30: 'Ваш ІМТ {bmi}: це ожиріння за ВООЗ. Ціль більша за 15 % ваги: почніть з першого етапу, а повний план складіть з ендокринологом.',
        N_65: "Після 65 років ІМТ тлумачать обережно, а схуднення може супроводжуватися втратою м'язів і нестачею поживних речовин. Обговоріть ціль з лікарем.",
        M_NO_LOSS: 'Бажана вага не менша за поточну, тож строк схуднення не рахуємо. Добову норму для утримання ваги покаже калькулятор калорій.',
        M_UNDER_NOW: 'Ваш ІМТ {bmi}, нижче 18,5: за ВООЗ це недостатня маса тіла. Схуднення в такому разі не рекомендоване, зверніться до лікаря.',
        M_UNDER_TARGET: 'На бажаній вазі ІМТ буде {bmi_t}, нижче 18,5: за ВООЗ це недостатня маса тіла. Для вашого зросту нижня межа норми близько {min} кг; обговоріть ціль з лікарем.',
        btn_kcal: 'Розрахувати калорії', btn_book: 'Записатися на консультацію'
      },
      ru: {
        weight: 'Текущий вес, кг', target: 'Желаемый вес, кг', height: 'Рост, см', age: 'Возраст, лет',
        err_weight: 'Укажите вес от 35 до 300 кг', err_target: 'Укажите желаемый вес от 30 до 300 кг',
        err_height: 'Укажите рост от 120 до 230 см', err_age: 'Укажите возраст от 18 до 100 лет',
        submit: 'Рассчитать срок',
        title: 'Минус {goal} кг: {w1}–{w2} недель',
        months: '≈ {m1}–{m2} мес.',
        dates: 'Ориентировочно с {d1} до {d2}',
        R_PACE: 'Расчёт при темпе 0,5–1 кг в неделю, который рекомендует NHS. Более ранняя дата соответствует 1 кг в неделю, более поздняя — 0,5 кг; чтобы держать темп, рацион и активность пересматривают по мере похудения.',
        R_WATER: 'В первые недели вес часто падает быстрее из-за воды, связанной с гликогеном; дальше темп медленнее.',
        N_STAGE: 'Первый этап: минус {s_lo}–{s_hi} кг (5–10 % веса), примерно {w1}–{w2} недель. NIDDK советует начинать именно с такой цели на 6 месяцев.',
        N_SLOWDOWN: 'Часть пути приходится на период после 6 месяцев, когда темп обычно замедляется. Реальный срок может быть дольше более поздней даты.',
        N_DOCTOR_BMI30: 'Ваш ИМТ {bmi}: это ожирение по классификации ВОЗ. План лучше составить с эндокринологом, который оценит сопутствующие состояния.',
        N_DOCTOR_BMI40: 'Ваш ИМТ {bmi}. При таком ИМТ план похудения стоит составлять с врачом: он оценит состояние здоровья и все доступные подходы.',
        N_DOCTOR_BIG: 'Цель больше 15 % веса. Начните с первого этапа, а полный план удобнее составить с эндокринологом.',
        N_DOCTOR_BIG30: 'Ваш ИМТ {bmi}: это ожирение по ВОЗ. Цель больше 15 % веса: начните с первого этапа, а полный план составьте с эндокринологом.',
        N_65: 'После 65 лет ИМТ толкуют осторожно, а похудение может сопровождаться потерей мышц и нехваткой питательных веществ. Обсудите цель с врачом.',
        M_NO_LOSS: 'Желаемый вес не меньше текущего, поэтому срок похудения не считаем. Суточную норму для удержания веса покажет калькулятор калорий.',
        M_UNDER_NOW: 'Ваш ИМТ {bmi}, ниже 18,5: по ВОЗ это недостаточная масса тела. Похудение в таком случае не рекомендуется, обратитесь к врачу.',
        M_UNDER_TARGET: 'При желаемом весе ИМТ будет {bmi_t}, ниже 18,5: по ВОЗ это недостаточная масса тела. Для вашего роста нижняя граница нормы около {min} кг; обсудите цель с врачом.',
        btn_kcal: 'Рассчитать калории', btn_book: 'Записаться на консультацию'
      }
    }
  };

  var common = (typeof module === 'object' && module.exports) ? require('./calc-common.js') : root.AvelisCalcCommon;
  var C = CONFIG;

  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

  /** values: {weight, target, height, age}; today: Date. -> {code, ...numbers, notes: [codes], doctor: code|null} */
  function compute(v, today) {
    var r1 = function (x) { return common.roundHalfUp(x, 1); };
    var hm = v.height / 100;
    var bmi = r1(common.bmiOf(v.weight, v.height));
    var bmiT = r1(common.bmiOf(v.target, v.height));
    var goal = r1(v.weight - v.target);
    var goalPct = goal / v.weight * 100;
    if (v.target >= v.weight) return { code: 'M_NO_LOSS', bmi: bmi };                          // E1
    if (bmi < C.bmiUnder) return { code: 'M_UNDER_NOW', bmi: bmi };                            // E2
    if (bmiT < C.bmiUnder) return { code: 'M_UNDER_TARGET', bmi: bmi, bmiT: bmiT, min: common.minWeightFor(C.bmiUnder, v.height) }; // E3
    var w1 = common.ceilEps(goal / C.paceFast), w2 = common.ceilEps(goal / C.paceSlow);
    var res = {
      code: 'OK', bmi: bmi, goal: goal, goalPct: goalPct, weeksFast: w1, weeksSlow: w2,
      dateFast: addDays(today, w1 * 7), dateSlow: addDays(today, w2 * 7),
      monthsFast: Math.round(w1 / C.weekMonths * 2) / 2, monthsSlow: Math.round(w2 / C.weekMonths * 2) / 2,
      notes: [], doctor: null
    };
    if (goalPct > C.stagePct) {                                                                  // N1
      res.stageLo = r1(v.weight * C.stageLo);
      res.stageHi = r1(v.weight * C.stageHi);
      res.stageW1 = common.ceilEps(res.stageLo / C.paceFast);
      res.stageW2 = common.ceilEps(res.stageHi / C.paceSlow);
      res.notes.push('N_STAGE');
    }
    if (w2 > C.slowdownWeeks) res.notes.push('N_SLOWDOWN');                                     // N2
    if (bmi >= C.bmiSevere) res.doctor = 'N_DOCTOR_BMI40';                                      // N4
    else if (goalPct > C.bigGoalPct) res.doctor = bmi >= C.bmiObese ? 'N_DOCTOR_BIG30' : 'N_DOCTOR_BIG'; // N5 (+N3)
    else if (bmi >= C.bmiObese) res.doctor = 'N_DOCTOR_BMI30';                                  // N3
    if (v.age >= C.seniorAge) res.notes.push('N_65');                                           // N6
    res.booking = !!res.doctor || v.age >= C.seniorAge;                                          // §5.8
    return res;
  }

  var api = { CONFIG: CONFIG, compute: compute };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.AvelisCalcTerm = api;

  function render(v) {
    var L = common.lang(), T = C.text[L], f = common.fmt, esc = common.esc, fill = common.fill;
    var r = compute(v, new Date());
    var p = function (s, cls) { return '<p class="' + (cls || 'calc-note') + '">' + esc(s) + '</p>'; };
    var kcal = common.linkBtn(T.btn_kcal, C.links.kcal, 'btn--outline');
    var book = common.bookBtn(T.btn_book, C.formId);
    if (r.code === 'M_NO_LOSS') return p(T.M_NO_LOSS, 'calc-result__title') + '<div class="calc-actions">' + kcal + '</div>';
    if (r.code === 'M_UNDER_NOW') return p(fill(T.M_UNDER_NOW, { bmi: f(r.bmi, 1) }), 'calc-result__title') + '<div class="calc-actions">' + book + '</div>';
    if (r.code === 'M_UNDER_TARGET') {
      return p(fill(T.M_UNDER_TARGET, { bmi_t: f(r.bmiT, 1), min: f(r.min, 1) }), 'calc-result__title') +
        '<div class="calc-actions">' + book + '</div>';
    }
    var date = new Intl.DateTimeFormat(L === 'ru' ? 'ru-RU' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    var html = p(fill(T.title, { goal: f(r.goal, 1, true), w1: r.weeksFast, w2: r.weeksSlow }), 'calc-result__title') +
      p(fill(T.months, { m1: f(r.monthsFast, 1, true), m2: f(r.monthsSlow, 1, true) }), 'calc-result__sub') +
      p(fill(T.dates, { d1: date.format(r.dateFast), d2: date.format(r.dateSlow) }), 'calc-result__dates') +
      p(T.R_PACE, 'calc-small');
    if (r.notes.indexOf('N_STAGE') >= 0) {
      html += p(fill(T.N_STAGE, { s_lo: f(r.stageLo, 1, true), s_hi: f(r.stageHi, 1, true), w1: r.stageW1, w2: r.stageW2 }));
    }
    if (r.notes.indexOf('N_SLOWDOWN') >= 0) html += p(T.N_SLOWDOWN);
    if (r.doctor) html += p(fill(T[r.doctor], { bmi: f(r.bmi, 1) }), 'calc-note calc-note--doctor');
    if (r.notes.indexOf('N_65') >= 0) html += p(T.N_65, 'calc-note calc-note--doctor');
    html += p(T.R_WATER, 'calc-small');
    return html + '<div class="calc-actions">' + kcal + (r.booking ? book : '') + '</div>';
  }

  function init() {
    var L = common.lang(), T = C.text[L];
    [].forEach.call(document.querySelectorAll('.art-widget[data-widget="calc-term"]'), function (el) {
      common.mount(el, {
        formId: C.formId, submit: T.submit, compute: render,
        fields: ['weight', 'target', 'height', 'age'].map(function (n) {
          var f = C.fields[n];
          return { name: n, kind: 'number', min: f.min, max: f.max, step: f.step, int: f.int, label: T[n], error: T['err_' + n] };
        })
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
