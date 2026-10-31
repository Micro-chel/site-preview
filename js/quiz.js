/* Weight-loss test (/quiz.html). Spec: seo-content/specs/quiz-spec.md — 9–10 questions, route to exactly three levels,
   red flags -> level 3, no drug names or drug pages anywhere in the result, no forecasts. Answers live only in this
   page (no storage, no analytics) until the optional form after the result is sent (form-quiz -> api/telegram.php).
   The intro card (H1 = quiz.intro.title, written by the content generator) stays on i18n.js keys; everything else —
   questions, rules, thresholds, texts — is in CONFIG; route() is pure (tools/qa/calc_tests.js). */
(function (root) {
  'use strict';

  var CONFIG = {
    height: { min: 120, max: 230, def: 168 },          // Q3 (ranges the same in all S2 widgets)
    weight: { min: 35, max: 300, def: 80 },            // Q4
    waist: { min: 40, max: 200 },                      // Q5
    // all thresholds compare the SHOWN values: BMI 0.1, WHtR 0.01, half-up (spec ed. 2, §0.5)
    bmiUnder: 18.5,                                    // R3_under (WHO)
    bmiSevere: 40,                                     // R3_bmi40 (NICE 1.18.1)
    bmiObese: 30,                                      // R2_bmi30
    bmiOver: 25,                                       // R2_65, R2_nowaist (25 <= BMI < 30 without waist)
    whtrHigh: 0.50,                                    // R2_whtr (NICE 1.9.14)
    whtrMaxBmi: 35,                                    // WHtR used only below BMI 35
    whtrCats: [0.40, 0.50, 0.60],                      // NICE classes: lt40 / healthy / increased / high
    bmiTiers: [18.5, 25, 30, 35, 40],                  // WHO classes for «ІМТ {bmi} — {категорія}»
    maxReasons: 5,
    // order = order of the reason lines; level 3 first
    rules3: ['R3_u18', 'R3_under', 'R3_bmi40', 'R3_preg', 'R3_bf', 'R3_panc', 'R3_mtc', 'R3_t1d', 'R3_kidney', 'R3_liver',
             'R3_gi', 'R3_ed', 'R3_hypo', 'R3_wl'],
    rules2: ['R2_bmi30', 'R2_whtr', 'R2_comorb', 'R2_nowaist', 'R2_meds', 'R2_65'],
    steps: [
      { id: 'age', type: 'one', options: ['u18', '18_39', '40_64', '65p'] },
      { id: 'sex', type: 'one', options: ['f', 'm'] },
      { id: 'height', type: 'num' },
      { id: 'weight', type: 'num' },
      { id: 'waist', type: 'waist' },
      { id: 'comorb', type: 'many', options: ['t2d', 'htn', 'lip', 'osa', 'cvd', 'nafld', 'joint', 'pcos', 'none'], femaleOnly: ['pcos'] },
      { id: 'meds', type: 'many', options: ['ins', 'su', 'wl', 'ster', 'psy', 'none'] },
      { id: 'flags', type: 'many', options: ['panc', 'mtc', 'men2', 't1d', 'kidney', 'liver', 'gi', 'ed', 'none'] },
      { id: 'repro', type: 'many', options: ['preg', 'plan', 'bf', 'none'], only: 'f' },
      { id: 'binge', type: 'one', options: ['yes', 'no'] }
    ],
    links: {
      plan: '/skhudnennia/yak-pochaty-skhudnennia.html',
      prepare: '/blog/pidhotovka-do-konsultatsii-endokrynologa.html',
      measure: '/kalkulyator-imt.html',
      privacy: '/polityka-konfidentsiinosti.html'
    },
    u18Booking: false,           // [РЕШЕНИЕ ВЛАДЕЛЬЦА: чи консультує клініка підлітків до 18 років] — no booking until then
    formId: 'quiz',              // booking buttons of the result
    text: {
      uk: {
        progress: 'Питання {n} з {N}', back: '← Назад', next: 'Далі →', finish: 'Отримати результат →',
        q: {
          age: 'Скільки вам років?', sex: 'Ваша стать', height: 'Ваш зріст, см', weight: 'Ваша вага, кг',
          waist: 'Обхват талії, см', comorb: 'Що з переліченого лікар у вас виявляв?', meds: 'Які ліки ви зараз приймаєте?',
          flags: 'Чи було у вас колись таке?', repro: 'Чи стосується вас зараз?',
          binge: "Чи буває, що за короткий час (до 2 годин) ви з'їдаєте значно більше, ніж зазвичай, і відчуваєте, що не можете зупинитися, щонайменше раз на тиждень протягом останніх 3 місяців?"
        },
        opt: {
          age: { u18: 'До 18', '18_39': '18–39', '40_64': '40–64', '65p': '65 і більше' },
          sex: { f: 'Жінка', m: 'Чоловік' },
          comorb: { t2d: 'Діабет 2 типу або переддіабет', htn: 'Підвищений тиск', lip: 'Підвищений холестерин чи тригліцериди',
                    osa: 'Апное сну (зупинки дихання уві сні)', cvd: 'Хвороби серця чи судин', nafld: 'Жирова хвороба печінки',
                    joint: 'Біль у колінах чи кульшових суглобах, що обмежує рух', pcos: 'Синдром полікістозних яєчників',
                    none: 'Нічого з переліченого' },
          meds: { ins: 'Інсулін', su: 'Таблетки від діабету, що стимулюють вироблення інсуліну (сульфонілсечовина)',
                  wl: 'Інші ліки для зниження ваги', ster: 'Глюкокортикоїди (стероїдні гормони) у таблетках тривалий час',
                  psy: 'Антидепресанти, антипсихотики або протисудомні', none: 'Нічого з цього' },
          flags: { panc: 'Панкреатит (запалення підшлункової залози)', mtc: 'Медулярний рак щитоподібної залози у вас або кровних родичів',
                   men2: 'Синдром MEN2 у вас або в родині', t1d: 'Діабет 1 типу', kidney: 'Тяжка хвороба нирок (ниркова недостатність, діаліз)',
                   liver: 'Тяжке порушення функції печінки', gi: 'Тяжка хвороба шлунка чи кишечника, зокрема гастропарез',
                   ed: 'Розлад харчової поведінки (анорексія, булімія, компульсивне переїдання) зараз або раніше', none: 'Нічого з цього' },
          repro: { preg: 'Вагітність', plan: 'Плануєте вагітність', bf: 'Годую груддю', none: 'Нічого з цього' },
          binge: { yes: 'Так', no: 'Ні' }
        },
        cm: 'см', kg: 'кг', bmi_live: 'ІМТ: {bmi}',
        waist_unknown: 'Не знаю / не можу виміряти',
        waist_hint: 'Посередині між нижнім ребром і верхнім краєм тазової кістки, наприкінці звичайного видиху',
        waist_how: 'Як виміряти',
        eyebrow: 'Ваш маршрут',
        level: { 1: 'Самостійні зміни способу життя', 2: 'Консультація рекомендована', 3: "Консультація обов'язкова" },
        level_text: {
          1: "Тест не знайшов підстав для консультації: ІМТ і талія не вказують на підвищений ризик, а супутніх станів, ліків чи обмежень ви не вказали. Почніть зі змін харчування, руху і сну; якщо з'являться нові симптоми або вага зростатиме, пройдіть тест знову чи зверніться до лікаря.",
          '1_nowaist': 'ІМТ у нормі, а супутніх станів, ліків чи обмежень ви не вказали. Талію не виміряно, тому надлишок жиру на животі тест не оцінив: навіть за нормального ІМТ він підвищує ризики (NICE), тож виміряйте талію і пройдіть тест знову.',
          2: 'Ваші відповіді показують фактори, які варто оцінити з лікарем. Ендокринолог перевірить супутні стани і допоможе скласти план; будь-яке лікування обговорюють лише після консультації.',
          3: 'У ваших відповідях є стан, за якого будь-який план схуднення, від дієти до ліків, має обрати лікар. Це не діагноз і не заборона худнути: лікар оцінить ризики і запропонує безпечний підхід.',
          u18: 'Тест розрахований на дорослих. Вагу дітей і підлітків оцінюють за віковими таблицями, тож зверніться до педіатра або дитячого ендокринолога.'
        },
        bmi_line: 'ІМТ {bmi} — {cat}',
        bmi_cat: ['недостатня маса тіла', 'нормальна маса тіла', 'надлишкова маса (передожиріння)', 'ожиріння I ступеня',
                  'ожиріння II ступеня', 'ожиріння III ступеня'],
        whtr_line: 'Співвідношення талії до зросту {whtr} — {cat}',
        whtr_none: 'Співвідношення талії до зросту: не виміряно',
        whtr_35: 'Співвідношення талії до зросту {whtr} — за ІМТ 35+ не використовують',
        whtr_cat: ['NICE окремої категорії не задає', 'здоровий рівень жиру на животі, ризики не підвищені',
                   "надлишок жиру на животі, ризики для здоров'я підвищені", 'значний надлишок жиру на животі, ризики ще вищі'],
        why: 'Чому такий результат',
        reason: {
          R3_under: 'ІМТ {bmi}, нижче 18,5: недостатня маса тіла за ВООЗ', R3_bmi40: 'ІМТ {bmi}: 40 і вище',
          R3_preg: 'Вагітність або її планування', R3_bf: 'Годування груддю', R3_panc: 'Панкреатит у минулому',
          R3_mtc: 'Медулярний рак щитоподібної залози або MEN2 у вас чи в родині', R3_t1d: 'Діабет 1 типу',
          R3_kidney: 'Тяжка хвороба нирок', R3_liver: 'Тяжке порушення функції печінки', R3_gi: 'Тяжка хвороба шлунка чи кишечника',
          R3_ed: 'Ознаки розладу харчової поведінки (опитувальник не ставить діагноз)',
          R3_hypo: 'Інсулін або таблетки, що стимулюють вироблення інсуліну: дози може знадобитися змінювати',
          R3_wl: 'Ви вже приймаєте інші ліки для зниження ваги',
          R2_bmi30: 'ІМТ {bmi}: ожиріння за класифікацією ВООЗ', R2_whtr: 'Талія — половина зросту або більше ({whtr})',
          R2_comorb: 'Супутній стан, який лікар має врахувати в плані',
          R2_nowaist: 'ІМТ {bmi}, а талію не виміряно: без неї ризик оцінити не можна',
          R2_meds: 'Ліки, що можуть впливати на вагу: не відміняйте їх самі',
          R2_65: 'Вік 65+ і ІМТ від 25: ІМТ у цьому віці тлумачать обережно'
        },
        btn_plan: 'План першого тижня', btn_book: 'Записатися на консультацію', btn_prepare: 'Як підготуватися до консультації',
        not_diagnosis: 'Результат тесту не є діагнозом і не замінює консультацію лікаря.',
        form_title: "Хочете, щоб спеціаліст зв'язався з вами?",
        form_sub: "Необов'язково. Ми надішлемо клініці ваше ім'я, телефон і короткий підсумок відповідей.",
        form_submit: 'Обговорити результат з лікарем',
        form_privacy: 'Відповіді тесту обробляються у вашому браузері й не надсилаються, доки ви не відправите цю форму. Політика конфіденційності: {link}',
        form_privacy_link: 'Політика конфіденційності'
      },
      ru: {
        progress: 'Вопрос {n} из {N}', back: '← Назад', next: 'Далее →', finish: 'Получить результат →',
        q: {
          age: 'Сколько вам лет?', sex: 'Ваш пол', height: 'Ваш рост, см', weight: 'Ваш вес, кг',
          waist: 'Обхват талии, см', comorb: 'Что из перечисленного у вас находил врач?', meds: 'Какие лекарства вы сейчас принимаете?',
          flags: 'Было ли у вас когда-нибудь такое?', repro: 'Касается ли вас сейчас?',
          binge: 'Бывает ли, что за короткое время (до 2 часов) вы съедаете значительно больше обычного и чувствуете, что не можете остановиться, хотя бы раз в неделю в течение последних 3 месяцев?'
        },
        opt: {
          age: { u18: 'До 18', '18_39': '18–39', '40_64': '40–64', '65p': '65 и больше' },
          sex: { f: 'Женщина', m: 'Мужчина' },
          comorb: { t2d: 'Диабет 2 типа или предиабет', htn: 'Повышенное давление', lip: 'Повышенный холестерин или триглицериды',
                    osa: 'Апноэ сна (остановки дыхания во сне)', cvd: 'Болезни сердца или сосудов', nafld: 'Жировая болезнь печени',
                    joint: 'Боль в коленях или тазобедренных суставах, ограничивающая движение', pcos: 'Синдром поликистозных яичников',
                    none: 'Ничего из перечисленного' },
          meds: { ins: 'Инсулин', su: 'Таблетки от диабета, стимулирующие выработку инсулина (сульфонилмочевина)',
                  wl: 'Другие лекарства для снижения веса', ster: 'Глюкокортикоиды (стероидные гормоны) в таблетках длительно',
                  psy: 'Антидепрессанты, антипсихотики или противосудорожные', none: 'Ничего из этого' },
          flags: { panc: 'Панкреатит (воспаление поджелудочной железы)', mtc: 'Медуллярный рак щитовидной железы у вас или кровных родственников',
                   men2: 'Синдром MEN2 у вас или в семье', t1d: 'Диабет 1 типа', kidney: 'Тяжёлая болезнь почек (почечная недостаточность, диализ)',
                   liver: 'Тяжёлое нарушение функции печени', gi: 'Тяжёлая болезнь желудка или кишечника, в том числе гастропарез',
                   ed: 'Расстройство пищевого поведения (анорексия, булимия, компульсивное переедание) сейчас или раньше', none: 'Ничего из этого' },
          repro: { preg: 'Беременность', plan: 'Планируете беременность', bf: 'Кормлю грудью', none: 'Ничего из этого' },
          binge: { yes: 'Да', no: 'Нет' }
        },
        cm: 'см', kg: 'кг', bmi_live: 'ИМТ: {bmi}',
        waist_unknown: 'Не знаю / не могу измерить',
        waist_hint: 'Посередине между нижним ребром и верхним краем тазовой кости, в конце обычного выдоха',
        waist_how: 'Как измерить',
        eyebrow: 'Ваш маршрут',
        level: { 1: 'Самостоятельные изменения образа жизни', 2: 'Консультация рекомендована', 3: 'Консультация обязательна' },
        level_text: {
          1: 'Тест не нашёл оснований для консультации: ИМТ и талия не указывают на повышенный риск, а сопутствующих состояний, лекарств или ограничений вы не указали. Начните с изменений питания, движения и сна; если появятся новые симптомы или вес будет расти, пройдите тест снова или обратитесь к врачу.',
          '1_nowaist': 'ИМТ в норме, а сопутствующих состояний, лекарств или ограничений вы не указали. Талия не измерена, поэтому избыток жира на животе тест не оценил: даже при нормальном ИМТ он повышает риски (NICE), так что измерьте талию и пройдите тест снова.',
          2: 'Ваши ответы показывают факторы, которые стоит оценить с врачом. Эндокринолог проверит сопутствующие состояния и поможет составить план; любое лечение обсуждают только после консультации.',
          3: 'В ваших ответах есть состояние, при котором любой план похудения, от диеты до лекарств, должен выбрать врач. Это не диагноз и не запрет худеть: врач оценит риски и предложит безопасный подход.',
          u18: 'Тест рассчитан на взрослых. Вес детей и подростков оценивают по возрастным таблицам, поэтому обратитесь к педиатру или детскому эндокринологу.'
        },
        bmi_line: 'ИМТ {bmi} — {cat}',
        bmi_cat: ['недостаточная масса тела', 'нормальная масса тела', 'избыточная масса (предожирение)', 'ожирение I степени',
                  'ожирение II степени', 'ожирение III степени'],
        whtr_line: 'Соотношение талии к росту {whtr} — {cat}',
        whtr_none: 'Соотношение талии к росту: не измерено',
        whtr_35: 'Соотношение талии к росту {whtr} — при ИМТ 35+ не используют',
        whtr_cat: ['NICE отдельной категории не задаёт', 'здоровый уровень жира на животе, риски не повышены',
                   'избыток жира на животе, риски для здоровья повышены', 'значительный избыток жира на животе, риски ещё выше'],
        why: 'Почему такой результат',
        reason: {
          R3_under: 'ИМТ {bmi}, ниже 18,5: недостаточная масса тела по ВОЗ', R3_bmi40: 'ИМТ {bmi}: 40 и выше',
          R3_preg: 'Беременность или её планирование', R3_bf: 'Грудное вскармливание', R3_panc: 'Панкреатит в прошлом',
          R3_mtc: 'Медуллярный рак щитовидной железы или MEN2 у вас или в семье', R3_t1d: 'Диабет 1 типа',
          R3_kidney: 'Тяжёлая болезнь почек', R3_liver: 'Тяжёлое нарушение функции печени', R3_gi: 'Тяжёлая болезнь желудка или кишечника',
          R3_ed: 'Признаки расстройства пищевого поведения (опросник не ставит диагноз)',
          R3_hypo: 'Инсулин или таблетки, стимулирующие выработку инсулина: дозы может понадобиться менять',
          R3_wl: 'Вы уже принимаете другие лекарства для снижения веса',
          R2_bmi30: 'ИМТ {bmi}: ожирение по классификации ВОЗ', R2_whtr: 'Талия — половина роста или больше ({whtr})',
          R2_comorb: 'Сопутствующее состояние, которое врач должен учесть в плане',
          R2_nowaist: 'ИМТ {bmi}, а талия не измерена: без неё риск оценить нельзя',
          R2_meds: 'Лекарства, которые могут влиять на вес: не отменяйте их сами',
          R2_65: 'Возраст 65+ и ИМТ от 25: ИМТ в этом возрасте толкуют осторожно'
        },
        btn_plan: 'План первой недели', btn_book: 'Записаться на консультацию', btn_prepare: 'Как подготовиться к консультации',
        not_diagnosis: 'Результат теста не является диагнозом и не заменяет консультацию врача.',
        form_title: 'Хотите, чтобы специалист связался с вами?',
        form_sub: 'Необязательно. Мы отправим в клинику ваше имя, телефон и краткую сводку ответов.',
        form_submit: 'Обсудить результат с врачом',
        form_privacy: 'Ответы теста обрабатываются в вашем браузере и не отправляются, пока вы не отправите эту форму. Политика конфиденциальности: {link}',
        form_privacy_link: 'Политика конфиденциальности'
      }
    }
  };
  var C = CONFIG;

  function round(x, d) { var f = Math.pow(10, d); return Math.floor(x * f + 0.5 + 1e-9) / f; }
  function num(x, d) { return round(x, d).toFixed(d).replace('.', ','); }
  function has(list, v) { return (list || []).indexOf(v) >= 0; }
  function some(list) { return (list || []).some(function (v) { return v !== 'none'; }); }

  /** a: {age, sex, height, weight, waist: number|null, comorb: [], meds: [], flags: [], repro: [], binge}
      -> {level: 1|2|3, u18, bmi, whtr, whtrUsed, rules: [codes, level 3 first], nowaist} */
  function route(a) {
    if (a.age === 'u18') {        // the test ends after Q1: no BMI, no WHtR (spec ed. 2, §2)
      return { level: 3, u18: true, bmi: null, whtr: null, whtrUsed: false, rules: ['R3_u18'], nowaist: false };
    }
    var m = a.height / 100;
    var bmi = round(a.weight / (m * m), 1);
    var whtr = a.waist != null ? round(a.waist / a.height, 2) : null;
    var whtrUsed = whtr != null && bmi < C.whtrMaxBmi;
    var hit = {
      R3_under: bmi < C.bmiUnder,
      R3_bmi40: bmi >= C.bmiSevere,
      R3_preg: has(a.repro, 'preg') || has(a.repro, 'plan'),
      R3_bf: has(a.repro, 'bf'),
      R3_panc: has(a.flags, 'panc'),
      R3_mtc: has(a.flags, 'mtc') || has(a.flags, 'men2'),
      R3_t1d: has(a.flags, 't1d'),
      R3_kidney: has(a.flags, 'kidney'),
      R3_liver: has(a.flags, 'liver'),
      R3_gi: has(a.flags, 'gi'),
      R3_ed: has(a.flags, 'ed') || a.binge === 'yes',
      R3_hypo: has(a.meds, 'ins') || has(a.meds, 'su'),
      R3_wl: has(a.meds, 'wl'),
      R2_bmi30: bmi >= C.bmiObese,
      R2_whtr: whtrUsed && whtr >= C.whtrHigh,
      R2_comorb: some(a.comorb),                                            // at any BMI (supervisor 31.10)
      R2_nowaist: a.waist == null && bmi >= C.bmiOver && bmi < C.bmiObese,  // BMI 25–29.9, waist not measured
      R2_meds: has(a.meds, 'ster') || has(a.meds, 'psy'),
      R2_65: a.age === '65p' && bmi >= C.bmiOver
    };
    var r3 = C.rules3.filter(function (k) { return hit[k]; });
    var r2 = C.rules2.filter(function (k) { return hit[k]; });
    var level = r3.length ? 3 : r2.length ? 2 : 1;
    return { level: level, u18: false, bmi: bmi, whtr: whtr, whtrUsed: whtrUsed, rules: r3.concat(r2),
             nowaist: level === 1 && a.waist == null };
  }

  function bmiCat(bmi) {
    for (var i = 0; i < C.bmiTiers.length; i++) if (bmi < C.bmiTiers[i]) return i;
    return C.bmiTiers.length;
  }
  function whtrCat(w) {
    for (var i = 0; i < C.whtrCats.length; i++) if (w < C.whtrCats[i]) return i;
    return C.whtrCats.length;
  }
  function fill(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }
  function reasonLines(res, T) {
    var v = { bmi: res.bmi != null ? num(res.bmi, 1) : '', whtr: res.whtr != null ? num(res.whtr, 2) : '' };
    return res.rules.filter(function (k) { return T.reason[k]; }).slice(0, C.maxReasons).map(function (k) { return fill(T.reason[k], v); });
  }

  /** the clinic's summary (UA, no drug names): sent only with the optional form */
  function summary(a, res) {
    var T = C.text.uk;
    var list = function (id) {
      var xs = (a[id] || []).filter(function (x) { return x !== 'none'; }).map(function (x) { return T.opt[id][x]; });
      return xs.length ? xs.join(', ') : 'немає';
    };
    if (res.u18) return ['Рівень: L3 (до 18 років, тест завершено після першого питання)', 'Вік: ' + T.opt.age.u18].join('\n');
    return [
      'Рівень: L' + res.level + ' (' + T.level[res.level] + ')',
      'ІМТ: ' + num(res.bmi, 1) + '; талія/зріст: ' + (res.whtr != null ? num(res.whtr, 2) : 'не виміряно'),
      'Вік: ' + T.opt.age[a.age] + '; стать: ' + (a.sex === 'm' ? 'чоловік' : 'жінка'),
      'Причини: ' + (reasonLines(res, T).join('; ') || '—'),
      'Супутні стани: ' + list('comorb') + '; ліки: ' + list('meds')
    ].join('\n');
  }

  var api = { CONFIG: CONFIG, route: route, summary: summary };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.AvelisQuiz = api;

  var app = document.getElementById('quiz-app');
  if (!app) return;

  function lang() {
    var l = root.AVELIS_LANG || document.documentElement.lang;
    return l === 'ru' ? 'ru' : 'uk';
  }
  function T() { return C.text[lang()]; }
  function t(key) { return root.AvelisI18n ? root.AvelisI18n.t(key) : key; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function href(path) { return lang() === 'ru' ? '/ru' + path : path; }
  function applyStatic() { if (root.AvelisI18n && root.AvelisI18n.applyStatic) root.AvelisI18n.applyStatic(); }

  var state = { step: -1, a: freshAnswers() };
  function freshAnswers() {
    return { age: '', sex: '', height: C.height.def, weight: C.weight.def, waist: null, waistUnknown: false,
             comorb: [], meds: [], flags: [], repro: [], binge: '' };
  }
  function steps() {
    return C.steps.filter(function (s) { return !s.only || s.only === state.a.sex || (!state.a.sex && s.only === 'f'); });
  }

  function renderIntro() {
    app.innerHTML =
      '<div class="quiz-card quiz-card--intro">' +
        '<div class="quiz-intro__icon" aria-hidden="true">🧠</div>' +
        '<h1 class="t-title-2 quiz-intro__title" data-i18n="quiz.intro.title"></h1>' +
        '<p class="t-text-2 quiz-intro__lead" data-i18n="quiz.intro.lead"></p>' +
        '<p class="quiz-intro__meta" data-i18n="quiz.intro.meta"></p>' +
        '<button type="button" class="btn quiz-intro__btn" id="quiz-start" data-i18n="quiz.intro.start"></button>' +
        '<ul class="quiz-badges">' +
          '<li data-i18n="quiz.intro.badge1"></li>' +
          '<li data-i18n="quiz.intro.badge3"></li>' +
        '</ul>' +
      '</div>';
    applyStatic();
    document.getElementById('quiz-start').addEventListener('click', function () {
      state.a = freshAnswers();
      state.step = 0;
      renderStep();
    });
  }

  function optionBtn(value, label, selected, multi) {
    return '<button type="button" class="quiz-option' + (selected ? ' is-selected' : '') + '" data-value="' + esc(value) + '" ' +
      (multi ? 'role="checkbox" aria-checked="' + selected + '"' : 'aria-pressed="' + selected + '"') + '><span>' + esc(label) + '</span></button>';
  }

  function stepValid(s) {
    var a = state.a;
    if (s.type === 'one') return !!a[s.id];
    if (s.type === 'many') return a[s.id].length > 0;
    if (s.type === 'num') return a[s.id] >= C[s.id].min && a[s.id] <= C[s.id].max;
    if (s.type === 'waist') return a.waistUnknown || (a.waist != null && a.waist >= C.waist.min && a.waist <= C.waist.max);
    return false;
  }

  function renderStep() {
    var L = T(), list = steps(), s = list[state.step], a = state.a;
    var last = state.step === list.length - 1;
    var pct = Math.round(((state.step + 1) / list.length) * 100);
    var body = '';
    if (s.type === 'one' || s.type === 'many') {
      var opts = s.options.filter(function (o) { return !(s.femaleOnly && has(s.femaleOnly, o) && a.sex !== 'f'); });
      body = '<div class="quiz-options' + (opts.length === 2 ? ' quiz-options--2' : '') + '"' + (s.type === 'many' ? ' role="group"' : '') + '>' +
        opts.map(function (o) {
          return optionBtn(o, L.opt[s.id][o], s.type === 'one' ? a[s.id] === o : has(a[s.id], o), s.type === 'many');
        }).join('') + '</div>';
    } else if (s.type === 'num') {
      var R = C[s.id], unit = s.id === 'height' ? L.cm : L.kg;
      body = '<div class="quiz-range">' +
          '<div class="quiz-range__head"><input class="quiz-num" type="number" id="quiz-num" min="' + R.min + '" max="' + R.max +
          '" step="1" value="' + a[s.id] + '" inputmode="numeric" aria-labelledby="quiz-q"> ' + esc(unit) + '</div>' +
          '<input type="range" id="quiz-range" min="' + R.min + '" max="' + R.max + '" step="1" value="' + a[s.id] + '" aria-label="' + esc(L.q[s.id]) + '">' +
          '<div class="quiz-range__scale"><span>' + R.min + '</span><span>' + R.max + '</span></div>' +
          (s.id === 'weight' ? '<p class="quiz-range__hint" id="quiz-bmi-live"></p>' : '') +
        '</div>';
    } else if (s.type === 'waist') {
      body = '<div class="quiz-range quiz-waist">' +
          '<div class="quiz-range__head"><input class="quiz-num" type="number" id="quiz-num" min="' + C.waist.min + '" max="' + C.waist.max +
          '" step="0.1" inputmode="decimal" aria-labelledby="quiz-q" value="' + (a.waist != null ? a.waist : '') + '"' +
          (a.waistUnknown ? ' disabled' : '') + '> ' + esc(L.cm) + '</div>' +
          '<label class="quiz-check"><input type="checkbox" id="quiz-waist-unknown"' + (a.waistUnknown ? ' checked' : '') + '><span>' + esc(L.waist_unknown) + '</span></label>' +
          '<p class="quiz-range__hint">' + esc(L.waist_hint) + '. <a href="' + esc(href(C.links.measure)) + '" target="_blank" rel="noopener">' + esc(L.waist_how) + '</a></p>' +
        '</div>';
    }
    app.innerHTML =
      '<div class="quiz-shell">' +
        '<div class="quiz-progress" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
        '<p class="quiz-progress__label">' + esc(fill(L.progress, { n: state.step + 1, N: list.length })) + '</p>' +
        '<button type="button" class="quiz-back" id="quiz-back">' + esc(L.back) + '</button>' +
        '<div class="quiz-card" data-step="' + s.id + '">' +
          '<h2 class="t-title-3 quiz-step__title" id="quiz-q">' + esc(L.q[s.id]) + '</h2>' + body +
          '<button type="button" class="btn btn--block quiz-next" id="quiz-next">' + esc(last ? L.finish : L.next) + '</button>' +
        '</div>' +
      '</div>';

    var next = document.getElementById('quiz-next');
    function sync() { next.disabled = !stepValid(s); }

    if (s.type === 'one' || s.type === 'many') {
      [].forEach.call(app.querySelectorAll('.quiz-option'), function (btn) {
        btn.addEventListener('click', function () {
          var v = btn.getAttribute('data-value');
          if (s.type === 'one') {
            if (s.id === 'sex' && a.sex !== v) { a.comorb = a.comorb.filter(function (x) { return x !== 'pcos'; }); a.repro = []; }
            a[s.id] = v;
          } else if (has(a[s.id], v)) {
            a[s.id] = a[s.id].filter(function (x) { return x !== v; });
          } else {
            a[s.id] = v === 'none' ? ['none'] : a[s.id].filter(function (x) { return x !== 'none'; }).concat([v]);
          }
          [].forEach.call(app.querySelectorAll('.quiz-option'), function (b) {
            var on = s.type === 'one' ? a[s.id] === b.getAttribute('data-value') : has(a[s.id], b.getAttribute('data-value'));
            b.classList.toggle('is-selected', on);
            b.setAttribute(s.type === 'one' ? 'aria-pressed' : 'aria-checked', String(on));
          });
          sync();
        });
      });
    } else if (s.type === 'num') {
      var field = document.getElementById('quiz-num'), range = document.getElementById('quiz-range');
      var live = function () {
        var el = document.getElementById('quiz-bmi-live');
        if (el && stepValid(s)) el.textContent = fill(L.bmi_live, { bmi: num(route(a).bmi, 1) });
        else if (el) el.textContent = '';
      };
      field.addEventListener('input', function () {
        a[s.id] = field.value === '' ? NaN : Number(field.value);
        if (stepValid(s)) range.value = a[s.id];
        live(); sync();
      });
      range.addEventListener('input', function () { a[s.id] = Number(range.value); field.value = range.value; live(); sync(); });
      live();
    } else if (s.type === 'waist') {
      var w = document.getElementById('quiz-num'), unknown = document.getElementById('quiz-waist-unknown');
      w.addEventListener('input', function () { a.waist = w.value === '' ? null : Number(w.value); sync(); });
      unknown.addEventListener('change', function () {
        a.waistUnknown = unknown.checked;
        w.disabled = unknown.checked;
        if (unknown.checked) { a.waist = null; w.value = ''; }
        sync();
      });
    }
    sync();

    document.getElementById('quiz-back').addEventListener('click', function () {
      if (state.step > 0) { state.step -= 1; renderStep(); }
      else { state.step = -1; renderIntro(); }
    });
    next.addEventListener('click', function () {
      if (!stepValid(s)) return;
      if (last || (s.id === 'age' && a.age === 'u18')) { state.step = list.length; renderResult(); }
      else { state.step += 1; renderStep(); }
    });
  }

  function renderResult() {
    var L = T(), a = state.a;
    var res = route({ age: a.age, sex: a.sex, height: a.height, weight: a.weight, waist: a.waistUnknown ? null : a.waist,
                      comorb: a.comorb, meds: a.meds, flags: a.flags, repro: a.sex === 'f' ? a.repro : [], binge: a.binge });
    var text = res.u18 ? L.level_text.u18 : res.nowaist ? L.level_text['1_nowaist'] : L.level_text[res.level];
    var metrics = '';
    if (!res.u18) {     // adult categories are not shown to under-18s (bmi-whtr-spec §4.1)
      var w = res.whtr == null ? L.whtr_none
        : res.whtrUsed ? fill(L.whtr_line, { whtr: num(res.whtr, 2), cat: L.whtr_cat[whtrCat(res.whtr)] })
        : fill(L.whtr_35, { whtr: num(res.whtr, 2) });
      metrics = '<ul class="quiz-result__metrics"><li>' + esc(fill(L.bmi_line, { bmi: num(res.bmi, 1), cat: L.bmi_cat[bmiCat(res.bmi)] })) +
        '</li><li>' + esc(w) + '</li></ul>';
    }
    var reasons = reasonLines(res, L);
    var book = '<button type="button" class="btn" data-modal="booking" data-form-id="' + C.formId + '">' + esc(L.btn_book) + '</button>';
    var actions;
    if (res.level === 1) {
      actions = '<a class="btn" href="' + esc(href(C.links.plan)) + '">' + esc(L.btn_plan) + '</a>' + book.replace('class="btn"', 'class="btn btn--outline"');
    } else {
      actions = (res.u18 && !C.u18Booking ? '' : book) +
        '<a class="btn btn--outline" href="' + esc(href(C.links.prepare)) + '">' + esc(L.btn_prepare) + '</a>';
    }
    var privacy = esc(L.form_privacy).replace('{link}', '<a href="' + esc(href(C.links.privacy)) + '" target="_blank" rel="noopener">' +
      esc(L.form_privacy_link) + '</a>');

    app.innerHTML =
      '<div class="quiz-result" data-level="' + res.level + '">' +
        '<div class="quiz-card quiz-card--result">' +
          '<p class="quiz-result__eyebrow">' + esc(L.eyebrow) + '</p>' +
          '<h2 class="t-title-2 quiz-result__title">' + esc(L.level[res.level]) + '</h2>' +
          '<p class="t-text-2 quiz-result__text">' + esc(text) + '</p>' +
          metrics +
          (reasons.length ? '<div class="quiz-reasons"><p class="quiz-reasons__title">' + esc(L.why) + '</p><ul>' +
            reasons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
          '<div class="quiz-result__actions">' + actions + '</div>' +
          '<p class="quiz-result__privacy">' + esc(L.not_diagnosis) + '</p>' +
        '</div>' +
        '<div class="quiz-card quiz-card--form">' +
          '<h3 class="t-title-4">' + esc(L.form_title) + '</h3>' +
          '<p class="t-text-3">' + esc(L.form_sub) + '</p>' +
          '<form class="form" id="form-quiz" novalidate>' +
            '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<input type="hidden" name="quizSummary" id="quiz-summary-field">' +
            '<label class="form__row"><span class="t-text-4 form__label" data-i18n="form.name"></span>' +
              '<input type="text" name="name" class="form__input t-text-3" autocomplete="name"></label>' +
            '<label class="form__row"><span class="t-text-4 form__label"><span class="form__req">*</span> <span data-i18n="form.phone"></span></span>' +
              '<input type="tel" name="phone" class="form__input t-text-3" required autocomplete="tel"></label>' +
            '<label class="form__check"><input type="checkbox" name="consent" required><span class="form__check-box"></span>' +
              '<span class="t-text-3" data-i18n-html="form.consent"></span></label>' +
            '<button type="submit" class="btn btn--block">' + esc(L.form_submit) + '</button>' +
          '</form>' +
          '<p class="form__ok" hidden data-i18n="form.ok"></p>' +
          '<p class="quiz-result__privacy">' + privacy + '</p>' +
        '</div>' +
      '</div>';
    applyStatic();

    var sum = summary(a.waistUnknown ? Object.assign({}, a, { waist: null }) : a, res);
    document.getElementById('quiz-summary-field').value = sum;
    var form = document.getElementById('form-quiz');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      data.append('formId', 'form-quiz');
      data.append('pageUrl', window.location.href);
      data.append('question', sum);
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = t('btn.sending');
      fetch((root.AVELIS_ROOT || '') + 'api/telegram.php', { method: 'POST', body: data })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (out) {
          if (!out || !out.ok) throw new Error('fail');
          form.hidden = true;
          var ok = form.parentElement.querySelector('.form__ok');
          if (ok) ok.hidden = false;
        })
        .catch(function () { alert(t('form.error')); })
        .finally(function () { btn.disabled = false; btn.textContent = L.form_submit; });
    });
  }

  function init() { if (state.step < 0) renderIntro(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('avelis:langchange', function () {
    if (state.step < 0) renderIntro();
    else if (state.step >= steps().length) renderResult();
    else renderStep();
  });
})(typeof window !== 'undefined' ? window : this);
