/* ============================================================
   월하사주 · saju-2027.js  (2027 정미년 전문 리포트 엔진)
   - 2027년 1월~12월 월운(절입 기준 · 오호둔법) 12개월 월운표
   - 각 달의 천간·지지 십성, 12운성, 정미년 未토와의 충·합·형·파·해
   - 삼재 · 충살 판정, 천을귀인 띠, 도화·홍염·역마, 재물/이직/사업 타이밍
   ※ 의존: saju-engine.js
   ============================================================ */
(function (global) {
  'use strict';
  const E = global.SajuEngine;

  const YEAR = 2027;
  const Y_STEM = 3;   // 丁
  const Y_BRANCH = 7; // 未
  const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  const ANIMALS_SHORT = ['쥐', '소', '범', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  /* ---------- 지지 관계 ---------- */
  const CLASH = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];          // 沖
  const COMBINE = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];        // 六合
  const HARM = [7, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9, 8];           // 六害
  const BREAK = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2];          // 六破
  const HYUNG_PAIRS = [[0, 3], [1, 7], [1, 10], [7, 10], [2, 5], [2, 8], [5, 8], [4, 4], [6, 6], [9, 9], [11, 11]];
  const SAMHAP = [
    { code: '수', branches: [8, 0, 4] },
    { code: '화', branches: [2, 6, 10] },
    { code: '금', branches: [5, 9, 1] },
    { code: '목', branches: [11, 3, 7] }
  ];
  const DOHWA = { 수: 9, 화: 3, 금: 6, 목: 0 };
  const YEOKMA = { 수: 2, 화: 8, 금: 11, 목: 5 };
  const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];
  const CHEONEUL = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];
  const SAMJAE_2027 = [8, 0, 4]; // 申·子·辰 띠의 삼재 마지막 해(未)

  const GOD_SCORE = { 비견: 2, 겁재: -7, 식신: 7, 상관: 1, 편재: 6, 정재: 8, 편관: -5, 정관: 7, 편인: -2, 정인: 6 };
  const REL_SCORE = { 충: -15, 형: -9, 파: -6, 해: -5, 합: 9, 삼합: 11, 복음: 2 };

  const ACTION = {
    편재: '수입·협상·새 거래',
    정재: '정산·계약·자산 정리',
    편관: '어려운 과제·승부',
    정관: '면접·보고·공식 일',
    식신: '창작·제안·콘텐츠',
    상관: '기획·발표·개선',
    편인: '공부·문서·정리',
    정인: '배움·상담·자격',
    비견: '내 일 밀어붙이기',
    겁재: '정보 수집·사람 만나기'
  };
  const FIX = {
    충: '이동·계약·큰 결제는 이 달을 비켜 두세요. 일정은 미리 확정해 두면 흔들리지 않습니다.',
    형: '사람 문제로 번지기 쉬운 달입니다. 소송·분쟁·가족 갈등은 감정이 아니라 문서로 정리하세요.',
    파: '서명과 합의를 미루세요. 구두 약속은 남기지 말고 계약서는 한 번 더 읽으세요.',
    해: '가까운 사람과의 오해가 생기기 쉽습니다. 짧게라도 얼굴을 보고 말하는 편이 안전합니다.',
    겁재: '지인과의 동업·보증·큰 지출은 이 달만큼은 미루세요.',
    편관: '무리한 승부수는 금물입니다. 건강검진과 휴식을 일정에 먼저 넣어 두세요.',
    편인: '생각만 길어지기 쉽습니다. 결정 기한을 정해 두고 작게라도 실행하세요.'
  };

  const Y_INFO = {
    year: YEAR, stem: Y_STEM, branch: Y_BRANCH,
    hanja: '丁未', ko: '정미', animal: '양',
    stemElem: '화', branchElem: '토',
    headline: '丁未年 · 붉은 양의 해',
    tagline: '정(丁)의 촛불이 미(未)의 밭에 앉은 해 — 불어 키우고 흙에 여무는 해'
  };

  function animalOf(b) { return ANIMALS[b] + '띠'; }
  function isHyung(a, b) {
    return HYUNG_PAIRS.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  }
  function relOf(a, b) {
    const out = [];
    if (CLASH[a] === b) out.push('충');
    if (COMBINE[a] === b) out.push('합');
    if (isHyung(a, b)) out.push('형');
    if (BREAK[a] === b) out.push('파');
    if (HARM[a] === b) out.push('해');
    if (a === b) out.push('복음');
    return out;
  }
  function samhapWith(branch, pool) {
    let hit = null;
    SAMHAP.forEach(g => {
      if (g.branches.indexOf(branch) < 0) return;
      const others = g.branches.filter(x => x !== branch);
      if (others.every(o => pool.indexOf(o) >= 0)) hit = g.code;
    });
    return hit;
  }
  function groupOf(branch) {
    const g = SAMHAP.find(x => x.branches.indexOf(branch) >= 0);
    return g ? g.code : '목';
  }

  /* ---------- 2027년 양력 1~12월의 절기 월 ---------- */
  let MONTH_CACHE = null;
  function months() {
    if (MONTH_CACHE) return MONTH_CACHE;
    const out = [];
    for (let mn = 1; mn <= 12; mn++) {
      const jdMid = E.toJD(YEAR, mn, 15, 12) - 9 / 24;
      const lam = E.sunLongitude(jdMid);
      const monthIdx = Math.floor(((((lam - 315) + 360) % 360)) / 30); // 0=寅월
      const branch = (2 + monthIdx) % 12;
      const sajuYear = monthIdx === 11 ? YEAR - 1 : YEAR;             // 축월은 전년 사주년
      const yearStem = ((sajuYear - 1984) % 60 + 60) % 60 % 10;
      const firstMonthStem = (yearStem * 2 + 2) % 10;
      const stem = (firstMonthStem + monthIdx) % 10;
      const termLong = 315 + monthIdx * 30;
      const jd = E.findTermJD(termLong, jdMid, 22);
      const st = jd ? E.jdToDate(jd + 9 / 24) : null;
      out.push({
        no: mn, idx: monthIdx, stem: stem, branch: branch,
        hanja: E.STEMS[stem] + E.BRANCHES[branch],
        ko: E.STEMS_KO[stem] + E.BRANCHES_KO[branch],
        stemKo: E.STEMS_KO[stem], branchKo: E.BRANCHES_KO[branch],
        stemElem: E.stemElem(stem), branchElem: E.branchElem(branch),
        animal: ANIMALS_SHORT[branch],
        startLabel: st ? (st.m + '/' + st.d) : '',
        yearHanja: E.STEMS[yearStem] + E.BRANCHES[(2 + 11) % 12]
      });
    }
    MONTH_CACHE = out;
    return out;
  }

  /* ---------- 본체 ---------- */
  function build(chart) {
    const dm = chart.dayMaster;
    const dayBr = chart.pillars.day.branch;
    const yearBr = chart.pillars.year.branch;
    const pool = [chart.pillars.year.branch, chart.pillars.month.branch, chart.pillars.day.branch]
      .concat(chart.pillars.hour ? [chart.pillars.hour.branch] : []);
    const labels = ['년지', '월지', '일지'].concat(chart.pillars.hour ? ['시지'] : []);

    const yearGod = E.tenGod(dm.stem, Y_STEM);
    const yongEl = chart.yongsin.elem, heeEl = chart.yongsin.hee;

    /* 내 지지 ↔ 未 */
    const yearHits = [];
    pool.forEach((b, i) => {
      const r = relOf(Y_BRANCH, b);
      if (r.length) yearHits.push({ label: labels[i], branch: b, name: E.BRANCHES[b] + '(' + ANIMALS_SHORT[b] + ')', rel: r });
    });
    const samhapYear = samhapWith(Y_BRANCH, pool);

    /* 12개월 월운 */
    const ms = months().map(base => {
      const god = E.tenGod(dm.stem, base.stem);
      const branchMain = E.branchMainStem(base.branch);
      const branchGod = E.tenGod(dm.stem, branchMain);
      const stage = E.stageOf(dm.stem, base.branch);
      const relYear = relOf(Y_BRANCH, base.branch);       // 정미년 未토와의 관계
      const relMine = relOf(base.branch, dayBr);          // 내 일지와의 관계
      const relYearBr = relOf(base.branch, yearBr);

      let score = 54;
      score += (GOD_SCORE[god] || 0);
      relMine.forEach(r => { score += (REL_SCORE[r] || 0); });
      relYear.forEach(r => { score += Math.round((REL_SCORE[r] || 0) * 0.5); });
      if (!relMine.length && samhapWith(base.branch, pool)) score += 5;

      let elemNote = '';
      if (base.branchElem === yongEl) { score += 8; elemNote = '용신 ' + yongEl + '이 실린 달'; }
      else if (base.branchElem === heeEl) { score += 4; elemNote = '희신 ' + heeEl + '의 도움'; }
      else if (base.branchElem === dm.elem) { score -= 2; elemNote = '내 기운이 겹쳐 판단이 강해지는 달'; }

      score = Math.max(12, Math.min(97, score));
      let gradeKey, grade, tag;
      if (score >= 74) { gradeKey = 'good'; grade = '아주 좋은 달'; tag = '최고'; }
      else if (score >= 62) { gradeKey = 'soft'; grade = '순한 달'; tag = '순풍'; }
      else if (score >= 48) { gradeKey = 'mid'; grade = '무난한 달'; tag = '무난'; }
      else if (score >= 36) { gradeKey = 'warn'; grade = '주의할 달'; tag = '주의'; }
      else { gradeKey = 'bad'; grade = '조심할 달'; tag = '조심'; }

      const negs = relYear.concat(relMine).filter(r => ['충', '형', '파', '해'].indexOf(r) >= 0);
      let fix = negs.length ? FIX[negs[0]] : (['겁재', '편관', '편인'].indexOf(god) >= 0 ? FIX[god] : '');
      if (!fix) fix = '급하게 벌이기보다 이 달에 정한 한 가지를 끝내는 편이 좋습니다.';

      const relTxt = relYear.length ? '未와 ' + relYear.join('·') : '未와 특별한 작용 없음';
      const verdict = score >= 62 ? '추진' : (score >= 48 ? '균형' : '방어');

      const line = '<b>' + base.no + '월(' + base.hanja + ')</b> — ' + god + ' · ' + stage + ' · ' + relTxt + '. '
        + (ACTION[god] || '평소의 일') + '에 힘이 실리는 달, '
        + (verdict === '추진' ? '<b>밀어붙여도 좋습니다.</b>' : verdict === '균형' ? '절반은 진행하고 절반은 확인하세요.' : '<b>확인과 방어가 먼저입니다.</b>')
        + (elemNote ? ' (' + elemNote + ')' : '');

      return {
        no: base.no, idx: base.idx, hanja: base.hanja, ko: base.ko,
        stemKo: base.stemKo, branchKo: base.branchKo, startLabel: base.startLabel,
        stemElem: base.stemElem, branchElem: base.branchElem, animal: base.animal,
        god: god, godGroup: E.GOD_GROUP[god], branchGod: branchGod, stage: stage,
        relYear: relYear, relMine: relMine, relYearBr: relYearBr,
        score: score, grade: grade, gradeKey: gradeKey, tag: tag,
        line: line, fix: fix, action: ACTION[god] || '', verdict: verdict
      };
    }).sort((a, b) => a.no - b.no);

    const ranked = ms.slice().sort((a, b) => b.score - a.score);
    const good = ranked.slice(0, 3);
    const warn = ranked.slice(-3).reverse();

    const half = (from, to) => {
      const arr = ms.filter(m => m.no >= from && m.no <= to);
      const best = arr.slice().sort((a, b) => b.score - a.score)[0];
      const worst = arr.slice().sort((a, b) => a.score - b.score)[0];
      const avg = Math.round(arr.reduce((s, m) => s + m.score, 0) / arr.length);
      return { arr: arr, best: best, worst: worst, avg: avg };
    };

    /* 삼재 */
    const samjae = (function () {
      if (SAMJAE_2027.indexOf(yearBr) >= 0) {
        return {
          is: true, stage: '날삼재', stageNo: 3,
          head: animalOf(yearBr) + ' · 2027년은 삼재의 마지막 해(날삼재)',
          body: '申·子·辰 띠는 2025 사년(들삼재) → 2026 오년(눌삼재) → 2027 미년(날삼재)으로 삼재 3년을 보냅니다. 마지막 해는 남은 것을 정리하는 해입니다. 새로 크게 벌이기보다 새는 곳을 막고 몸과 문서를 정돈하면, 삼재가 끝나는 2028년부터 판이 넓어집니다.',
          todo: ['새 보증·동업·큰 대출은 2028년으로 미루기', '기존 계약서·세금·보험 서류 정리', '건강검진 1회, 수면 시간 고정']
        };
      }
      if (yearBr === Y_BRANCH) {
        return {
          is: false, stage: '본명년', stageNo: 0,
          head: animalOf(yearBr) + ' · 2027년은 내 띠의 해(본명년)',
          body: '삼재는 아니지만 내 띠의 해를 맞는 본명년입니다. 본명년에는 일이 크게 벌어지기 쉬워, 결정의 크기를 한 단계 줄이는 것이 전통적인 대응입니다.',
          todo: ['큰 결정은 서두르지 않기', '경조사·이동이 늘어나니 체력 관리', '기부·나눔으로 기운 돌리기']
        };
      }
      return {
        is: false, stage: '삼재 아님', stageNo: -1,
        head: animalOf(yearBr) + ' · 2027년 삼재는 해당 없음',
        body: '2027 정미년은 申·子·辰 띠(쥐·원숭이·용)의 삼재 마지막 해입니다. ' + animalOf(yearBr) + '인 당신은 올해 삼재에 들지 않습니다. 다만 삼재가 아니어도 지지의 충·형은 따로 작용하니 아래 지지 분석을 함께 보세요.',
        todo: ['삼재 대신 내 지지의 충·형 확인', '2027년은 확장보다 정리에 유리', '좋은 달에 큰 일을 몰아 두기']
      };
    })();

    /* 특수살 */
    const sal = (function () {
      const g = groupOf(dayBr);
      const dh = DOHWA[g], ym = YEOKMA[g], hy = HONGYEOM[dm.stem];
      const where = b => labels.filter((l, i) => pool[i] === b);
      const mk = (key, name, branch, meaning, use) => ({
        key: key, name: name, on: pool.indexOf(branch) >= 0,
        branch: branch, branchName: E.BRANCHES[branch] + '(' + ANIMALS_SHORT[branch] + ')',
        where: where(branch), meaning: meaning, use: use
      });
      return [
        mk('dohwa', '도화살', dh,
          '도화(桃花)는 사람을 끄는 힘입니다. 얼굴보다 분위기와 말투에서 나오는 매력으로, 모르는 사람도 먼저 말을 걸어 옵니다.',
          '사람을 만나는 일(영업·서비스·콘텐츠·방송)에서 무기가 됩니다. 다만 감정에 휘둘리는 관계가 늘어나 선을 긋는 연습이 필요합니다.'),
        mk('hongyeom', '홍염살', hy,
          '홍염(紅艶)은 은근히 스며드는 매력입니다. 도화보다 조용하지만 한 번 마음을 준 사람을 오래 붙잡습니다.',
          '연애에서 상대가 먼저 다가오는 편입니다. 다만 애매한 호의를 오래 끌면 진짜 인연을 놓칩니다.'),
        mk('yeokma', '역마살', ym,
          '역마(驛馬)는 움직이는 기운입니다. 한곳에 오래 머무는 것보다 이동·이사·출장에서 운이 트입니다.',
          '이직·유학·해외·유통처럼 움직임이 있는 일이 맞습니다. 다만 쉬지 않고 움직이면 몸이 먼저 지칩니다.')
      ];
    })();

    /* 돈 새는 구멍 */
    const leaks = (function () {
      const g = chart.godGroups, c = chart.counts, out = [];
      if (g.비겁 >= 2) out.push({ title: '사람 사이에서 새는 돈', why: '비겁 ' + g.비겁 + '개 — 내 편과 나누는 자리가 많습니다', fix: '동업·보증·공동 결제는 금액을 미리 문서로 정하고, 경조사비는 월 예산을 따로 두세요.' });
      if (g.재성 === 0) out.push({ title: '들어오는 길이 좁은 그릇', why: '재성 0개 — 벌이의 통로가 하나뿐입니다', fix: '수입원을 하나 더 만들되 손에 익은 기술(식상)에서 파생시키세요. 새 분야는 실패 확률이 큽니다.' });
      if (g.재성 >= 3) out.push({ title: '손이 커지는 그릇', why: '재성 ' + g.재성 + '개 — 기회도 많지만 나가는 길도 많습니다', fix: '수입의 10%는 손대지 않는 계좌로 자동이체. 들어온 돈은 48시간 묶어 두는 규칙을 쓰세요.' });
      if (g.식상 <= 1 && g.인성 >= 2) out.push({ title: '생각이 길어 실행이 늦는 구멍', why: '인성 ' + g.인성 + '개 · 식상 ' + g.식상 + '개 — 준비만 하다 때를 놓칩니다', fix: '완벽해지기 전에 팔아 보세요. 초안·샘플을 먼저 내놓는 것이 이 사주의 지름길입니다.' });
      if (chart.strength === 'weak') out.push({ title: '체력·건강 유지비로 새는 돈', why: '신약 구조 — 몸이 지출의 하수구가 됩니다', fix: '병원비·휴식비는 아끼지 말고, 대신 밤 문화·과식 지출을 줄이세요.' });
      if (c.토 >= 3) out.push({ title: '고정비·집·차로 새는 돈', why: '토(土) ' + c.토 + '자 — 자리를 잡는 지출이 큽니다', fix: '구독·관리비·할부를 한 장에 적어 보세요. 고정비 3개를 끊으면 그대로 저축이 됩니다.' });
      if (c.수 >= 3) out.push({ title: '구독·충동·유흥으로 새는 돈', why: '수(水) ' + c.수 + '자 — 흘러가는 지출이 많습니다', fix: '결제 전 하루 묵히기, 구독은 분기마다 정리하기. 이 두 가지로 새는 돈이 절반이 됩니다.' });
      if (c.화 >= 3) out.push({ title: '관계·모임·선물로 새는 돈', why: '화(火) ' + c.화 + '자 — 사람을 향한 지출이 뜨겁습니다', fix: '모임은 월 2회로 정하고 선물은 금액 상한을 먼저 정하세요.' });
      if (!out.length) out.push({ title: '새는 곳이 적은 그릇', why: '오행과 십신이 고르게 놓였습니다', fix: '문제는 막는 힘보다 버는 힘입니다. 수입의 통로를 하나 더 여는 데 집중하세요.' });
      while (out.length < 2) out.push({ title: '결제 습관의 구멍', why: '지출 기록이 없는 것이 가장 큰 구멍입니다', fix: '한 달만 결제 내역을 한 파일에 모아 보세요. 보이는 순간 새는 곳이 줄어듭니다.' });
      return out.slice(0, 3);
    })();

    const guin = (function () {
      const list = CHEONEUL[dm.stem].map(b => ({ branch: b, animal: animalOf(b), here: pool.indexOf(b) >= 0, char: E.BRANCHES[b] }));
      const avoid = CLASH[dayBr];
      return {
        list: list, avoidAnimal: animalOf(avoid), avoidBranch: avoid, avoidChar: E.BRANCHES[avoid],
        note: '일간 ' + dm.hanja + '(' + dm.ko + ') 기준 천을귀인은 ' + list.map(x => animalOf(x.branch)).join(' · ') + '입니다.'
      };
    })();

    /* 재물·이직·1인 사업 트랙 */
    const track = arr => ms.filter(m => arr.indexOf(m.god) >= 0).map(m => m.no);
    const focus = {
      money: { months: track(['편재', '정재']), label: '재물' },
      job: { months: track(['정관', '편관']), label: '이직·직장' },
      biz: { months: track(['식신', '상관']), label: '1인 사업' }
    };

    /* 재회·인연 */
    const reunion = (function () {
      const open = [], rough = [];
      ms.forEach(m => {
        const b = months()[m.no - 1].branch;
        if (COMBINE[dayBr] === b) open.push(m.no);
        if (CLASH[dayBr] === b) rough.push(m.no);
      });
      const yearOpen = COMBINE[dayBr] === Y_BRANCH;
      const yearRough = CLASH[dayBr] === Y_BRANCH;
      return {
        open: open, rough: rough, yearOpen: yearOpen, yearRough: yearRough,
        head: yearOpen ? '2027년은 내 일지가 未와 합하는 해 — 인연의 문이 열린 해'
          : yearRough ? '2027년은 내 일지가 未와 충하는 해 — 관계가 정리되는 해'
            : '2027년은 인연의 문이 크게 열리지도 닫히지도 않는 해'
      };
    })();

    return {
      info: Y_INFO, chart: chart,
      yearGod: yearGod, yearGodGroup: E.GOD_GROUP[yearGod],
      yearHits: yearHits, samhapYear: samhapYear,
      months: ms, good: good, warn: warn,
      half1: half(1, 6), half2: half(7, 12),
      samjae: samjae, sal: sal, leaks: leaks, guin: guin,
      focus: focus, reunion: reunion
    };
  }

  function summary(chart, kind) {
    const y = build(chart);
    const g = y.good.map(m => m.no + '월').join('·');
    const w = y.warn.map(m => m.no + '월').join('·');
    if (kind === 'newyear') return '2027 정미년 · 좋은 달 ' + g + ' / 조심할 달 ' + w;
    if (kind === 'samjae') return y.samjae.head;
    if (kind === 'moneyleak') return '돈 새는 구멍 1순위 — ' + y.leaks[0].title;
    if (kind === 'sal') return y.sal.filter(s => s.on).map(s => s.name).join('·') || '특수살 없음';
    if (kind === 'calendar') return '재물 ' + (y.focus.money.months.join('·') || '-') + ' / 이직 ' + (y.focus.job.months.join('·') || '-') + ' / 사업 ' + (y.focus.biz.months.join('·') || '-');
    return y.reunion.head;
  }

  global.SAJU_2027 = { info: Y_INFO, months: months, build: build, summary: summary, relOf: relOf, ANIMALS: ANIMALS };
})(typeof window !== 'undefined' ? window : globalThis);
