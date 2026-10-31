/* Calorie calculator (`::widget calc-kcal::`, /skhudnennia/kalkulyator-kalorii.html).
   Spec: seo-content/specs/calc-kcal-spec.md. Mifflin–St Jeor × FAO PAL, ±10 %, NHS −600 kcal, floor 1200/1500.
   Result = a range, never one number. Nothing stored or sent. Every number and text is in CONFIG; compute() is pure. */
(function (root) {
  'use strict';

  var CONFIG = {
    fields: {                                     // §2
      age: { min: 18, max: 100, int: true },
      height: { min: 120, max: 230, step: 0.1 },
      weight: { min: 35, max: 300, step: 0.1 }
    },
    mifflin: { w: 10, h: 6.25, a: 5, male: 5, female: -161 },     // Mifflin–St Jeor 1990
    pal: { sed: 1.55, act: 1.75, vig: 2.25 },                      // FAO/WHO/UNU 2004 §5.3.2, Table 5.1 / 5.3
    spread: 0.10,                                                  // ±10 % (Frankenfield 2013, FAO 5.4.1)
    deficit: 600,                                                  // NHS «Calories and weight loss»
    floor: { female: 1200, male: 1500 },                           // derived from AHA/ACC/TOS 2013
    roundStep: 50,                                                 // lower bound down, upper bound up to 50
    reeStep: 10,                                                   // REE shown to 10
    bmiUnder: 18.5, bmiNormalTop: 25, bmiObese: 30, seniorAge: 65,
    mifflinMaxAge: 79,                                             // N_79: the formula was derived on 19–78 years
    links: { term: '/skhudnennia/kalkulyator-stroku-skhudnennia.html', bmi: '/kalkulyator-imt.html' },
    formId: 'calc-kcal',
    text: {
      uk: {
        sex: 'Стать', female: 'Жінка', male: 'Чоловік', age: 'Вік, років', height: 'Зріст, см', weight: 'Вага, кг',
        pal: 'Рівень активності',
        pal_sed: 'Малорухливий або легка активність: робота без значних фізичних зусиль, транспорт, без регулярних тренувань, дозвілля здебільшого сидячи',
        pal_act: 'Активний або помірно активний: сидяча робота і щодня близько години помірних чи інтенсивних вправ (біг, велосипед, спорт) або робота з постійним рухом, як на будівництві',
        pal_vig: 'Високоактивний: кілька годин важкої фізичної праці або близько 2 годин плавання чи танців щодня за несидячої роботи',
        err_sex: 'Оберіть стать', err_age: 'Вкажіть вік від 18 до 100 років', err_height: 'Вкажіть зріст від 120 до 230 см',
        err_weight: 'Вкажіть вагу від 35 до 300 кг', err_pal: 'Оберіть рівень активності',
        submit: 'Розрахувати калорії',
        maint: 'Підтримка ваги: {lo}–{hi} ккал на добу',
        loss: 'Для схуднення: {lo}–{hi} ккал на добу (мінус 600 ккал, NHS)',
        loss_floor: 'Для схуднення: не нижче {floor} ккал',
        small: 'Витрата в спокої за формулою Міффліна–Сан Жеора: {ree} ккал; коефіцієнт активності {pal} (FAO/WHO/UNU)',
        N_ACCURACY: 'Діапазон ±10 % покриває типову похибку формули: у 3 з 4 людей з ожирінням вона помиляється не більше ніж на 10 %. Розкид усередині рівня активності додає ще до ±8–10 %, тож звіряйте розрахунок із тим, як змінюється вага протягом кількох тижнів.',
        N_FLOOR_PART: 'Нижню межу ми підняли до {floor} ккал: нижче цього рівня калькулятор раціон не пропонує, його варто складати лише з лікарем.',
        N_FLOOR_BOTH: 'Ваша розрахункова норма невелика, і дефіцит 600 ккал опустив би раціон нижче {floor} ккал. Не опускайтеся нижче цього рівня; темп схуднення обговоріть з лікарем.',
        N_UNDER: 'Ваш ІМТ {bmi}, нижче 18,5: за ВООЗ це недостатня маса тіла, тож раціон для схуднення не розраховуємо. Зверніться до лікаря.',
        N_NORMAL_BMI: 'Ваш ІМТ у межах норми. Перш ніж худнути, перевірте співвідношення талії до зросту: NICE радить тримати талію меншою за половину зросту.',
        N_NORMAL_BMI_LINK: 'Калькулятор ІМТ і талії',
        N_DOCTOR_BMI30: 'Ваш ІМТ {bmi}: це ожиріння за класифікацією ВООЗ. План краще скласти з ендокринологом, який оцінить супутні стани.',
        N_65: 'Після 65 років план харчування для схуднення краще обговорити з лікарем: NICE звертає увагу на ризик недостатнього харчування в старшому віці.',
        N_79: 'Формулу Міффліна–Сан Жеора виводили на людях 19–78 років, тож для вашого віку розрахунок ще менш точний.',
        btn_term: 'Розрахувати строк схуднення', btn_book: 'Записатися на консультацію'
      },
      ru: {
        sex: 'Пол', female: 'Женщина', male: 'Мужчина', age: 'Возраст, лет', height: 'Рост, см', weight: 'Вес, кг',
        pal: 'Уровень активности',
        pal_sed: 'Малоподвижный или лёгкая активность: работа без больших физических усилий, транспорт, без регулярных тренировок, досуг сидя',
        pal_act: 'Активный или умеренно активный: сидячая работа и ежедневно около часа умеренных или интенсивных упражнений (бег, велосипед, спорт) либо работа в движении, как на стройке',
        pal_vig: 'Высокоактивный: несколько часов тяжёлого труда или около 2 часов плавания или танцев в день при несидячей работе',
        err_sex: 'Выберите пол', err_age: 'Укажите возраст от 18 до 100 лет', err_height: 'Укажите рост от 120 до 230 см',
        err_weight: 'Укажите вес от 35 до 300 кг', err_pal: 'Выберите уровень активности',
        submit: 'Рассчитать калории',
        maint: 'Поддержание веса: {lo}–{hi} ккал в сутки',
        loss: 'Для похудения: {lo}–{hi} ккал в сутки (минус 600 ккал, NHS)',
        loss_floor: 'Для похудения: не ниже {floor} ккал',
        small: 'Расход в покое по формуле Миффлина–Сан Жеора: {ree} ккал; коэффициент активности {pal} (FAO/WHO/UNU)',
        N_ACCURACY: 'Диапазон ±10 % покрывает типичную погрешность формулы: у 3 из 4 людей с ожирением она ошибается не больше чем на 10 %. Разброс внутри уровня активности добавляет ещё до ±8–10 %, поэтому сверяйте расчёт с тем, как меняется вес в течение нескольких недель.',
        N_FLOOR_PART: 'Нижнюю границу мы подняли до {floor} ккал: ниже этого уровня калькулятор рацион не предлагает, его стоит составлять только с врачом.',
        N_FLOOR_BOTH: 'Ваша расчётная норма невелика, и дефицит 600 ккал опустил бы рацион ниже {floor} ккал. Не опускайтесь ниже этого уровня; темп похудения обсудите с врачом.',
        N_UNDER: 'Ваш ИМТ {bmi}, ниже 18,5: по ВОЗ это недостаточная масса тела, поэтому рацион для похудения не рассчитываем. Обратитесь к врачу.',
        N_NORMAL_BMI: 'Ваш ИМТ в пределах нормы. Прежде чем худеть, проверьте соотношение талии к росту: NICE советует держать талию меньше половины роста.',
        N_NORMAL_BMI_LINK: 'Калькулятор ИМТ и талии',
        N_DOCTOR_BMI30: 'Ваш ИМТ {bmi}: это ожирение по классификации ВОЗ. План лучше составить с эндокринологом, который оценит сопутствующие состояния.',
        N_65: 'После 65 лет план питания для похудения лучше обсудить с врачом: NICE обращает внимание на риск недостаточного питания в старшем возрасте.',
        N_79: 'Формулу Миффлина–Сан Жеора выводили на людях 19–78 лет, поэтому для вашего возраста расчёт ещё менее точный.',
        btn_term: 'Рассчитать срок похудения', btn_book: 'Записаться на консультацию'
      }
    }
  };

  var common = (typeof module === 'object' && module.exports) ? require('./calc-common.js') : root.AvelisCalcCommon;
  var C = CONFIG;

  /** v: {sex: 'female'|'male', age, height, weight, pal: 'sed'|'act'|'vig'} -> numbers, branch K0–K3, notes */
  function compute(v) {
    var m = C.mifflin;
    var ree = m.w * v.weight + m.h * v.height - m.a * v.age + (v.sex === 'male' ? m.male : m.female);
    var pal = C.pal[v.pal];
    var tee = ree * pal;
    var mLo = tee * (1 - C.spread), mHi = tee * (1 + C.spread);
    var lLo = mLo - C.deficit, lHi = mHi - C.deficit;
    var floor = C.floor[v.sex === 'male' ? 'male' : 'female'];
    var bmi = common.roundHalfUp(common.bmiOf(v.weight, v.height), 1);
    var down = function (x) { return common.floorTo(x, C.roundStep); };
    var up = function (x) { return common.ceilTo(x, C.roundStep); };
    var r = {
      ree: ree, tee: tee, pal: pal, bmi: bmi, floor: floor,
      maintLo: down(mLo), maintHi: up(mHi), notes: [], booking: false
    };
    if (bmi < C.bmiUnder) { r.branch = 'K0'; r.notes.push('N_UNDER'); r.booking = true; }
    else if (lLo >= floor) { r.branch = 'K1'; r.lossLo = down(lLo); r.lossHi = up(lHi); }
    else if (lHi >= floor) { r.branch = 'K2'; r.lossLo = floor; r.lossHi = up(lHi); r.notes.push('N_FLOOR_PART'); }
    else { r.branch = 'K3'; r.notes.push('N_FLOOR_BOTH'); r.booking = true; }
    if (bmi >= C.bmiUnder && bmi < C.bmiNormalTop) r.notes.push('N_NORMAL_BMI');
    if (bmi >= C.bmiObese) { r.notes.push('N_DOCTOR_BMI30'); r.booking = true; }
    if (v.age >= C.seniorAge) { r.notes.push('N_65'); r.booking = true; }
    if (v.age >= C.mifflinMaxAge) r.notes.push('N_79');
    r.notes.push('N_ACCURACY');
    return r;
  }

  var api = { CONFIG: CONFIG, compute: compute };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.AvelisCalcKcal = api;

  function render(v) {
    var T = C.text[common.lang()], f = common.fmt, esc = common.esc, fill = common.fill;
    var r = compute(v);
    var p = function (s, cls) { return '<p class="' + (cls || 'calc-note') + '">' + esc(s) + '</p>'; };
    var html = p(fill(T.maint, { lo: r.maintLo, hi: r.maintHi }), 'calc-result__title');
    if (r.branch === 'K1' || r.branch === 'K2') html += p(fill(T.loss, { lo: r.lossLo, hi: r.lossHi }), 'calc-result__title');
    else if (r.branch === 'K3') html += p(fill(T.loss_floor, { floor: r.floor }), 'calc-result__title');
    r.notes.forEach(function (n) {
      if (n === 'N_ACCURACY') return;
      var s = fill(T[n], { floor: r.floor, bmi: f(r.bmi, 1) });
      if (n === 'N_NORMAL_BMI') {
        html += '<p class="calc-note">' + esc(s) + ' <a href="' + esc(common.pageUrl(C.links.bmi)) + '">' + esc(T.N_NORMAL_BMI_LINK) + '</a></p>';
      } else {
        html += p(s, /DOCTOR|_65|UNDER|FLOOR_BOTH/.test(n) ? 'calc-note calc-note--doctor' : n === 'N_79' ? 'calc-small' : 'calc-note');
      }
    });
    html += p(T.N_ACCURACY, 'calc-small');
    html += p(fill(T.small, { ree: Math.round(r.ree / C.reeStep) * C.reeStep, pal: f(r.pal, 2) }), 'calc-small');
    return html + '<div class="calc-actions">' + common.linkBtn(T.btn_term, C.links.term, 'btn--outline') +
      (r.booking ? common.bookBtn(T.btn_book, C.formId) : '') + '</div>';
  }

  function init() {
    var T = C.text[common.lang()];
    [].forEach.call(document.querySelectorAll('.art-widget[data-widget="calc-kcal"]'), function (el) {
      var num = function (n) {
        var f = C.fields[n];
        return { name: n, kind: 'number', min: f.min, max: f.max, step: f.step, int: f.int, label: T[n], error: T['err_' + n] };
      };
      common.mount(el, {
        formId: C.formId, submit: T.submit, compute: render,
        fields: [
          { name: 'sex', kind: 'radio', label: T.sex, error: T.err_sex,
            options: [{ value: 'female', label: T.female }, { value: 'male', label: T.male }] },
          num('age'), num('height'), num('weight'),
          { name: 'pal', kind: 'radio', label: T.pal, error: T.err_pal,
            options: ['sed', 'act', 'vig'].map(function (k) { return { value: k, label: T['pal_' + k] }; }) }
        ]
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
