/* ============================================================
   월하사주 · saju-engine.js
   한국 정통 만세력 계산 엔진 (사주팔자 · 오행 · 십신 · 12운성 · 일진)
   - 일주 : 율리우스일(JDN) 기반 60갑자 (기준 1949-10-01 甲子)
   - 년주 : 태양 황경 315°(입춘) 기준 절입 계산
   - 월주 : 태양 황경 30° 구간 = 24절기 절입, 오호둔법 천간
   - 시주 : 12시진(30분 기준) + 오자둔법 천간
   - 표준시 : KST(UTC+9)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 기본 상수 ---------- */
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const BRANCH_ANIMALS = ['쥐', '소', '범', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  const ELEMENTS = ['목', '화', '토', '금', '수'];
  const ELEMENTS_HANJA = ['木', '火', '土', '金', '水'];
  const ELEMENT_COLOR = { 목: '#6FBF9A', 화: '#E8756A', 토: '#D9B26A', 금: '#C9CBD6', 수: '#6E8CE0' };

  const STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];      // 甲乙木 丙丁火 戊己土 庚辛金 壬癸水
  const BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]; // 子水 丑土 寅木 …
  const STEM_IS_YIN = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
  const BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]; // 지지 본기(정기)
  const BRANCH_ANIMAL_KO = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];

  const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
  const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯

  // 십이신살 — 년지 삼합 기준, 각 국의 절지(絶地)에서 시작
  const SINSAL = ['겁살', '재살', '천살', '지살', '년살(도화)', '월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살'];
  const SINSAL_START = { 2: 11, 6: 11, 10: 11, 8: 5, 0: 5, 4: 5, 5: 2, 9: 2, 1: 2, 11: 8, 3: 8, 7: 8 };

  // 천덕귀인 (월지 기준 — 값은 천간 또는 지지 한자)
  const CHEONDEOK = { 2: '丁', 3: '申', 4: '壬', 5: '辛', 6: '亥', 7: '甲', 8: '癸', 9: '寅', 10: '丙', 11: '乙', 0: '巳', 1: '庚' };
  // 월덕귀인 (월지 삼합 기준 천간)
  const WOLDEAK = { 2: 2, 6: 2, 10: 2, 8: 8, 0: 8, 4: 8, 5: 6, 9: 6, 1: 6, 11: 0, 3: 0, 7: 0 };

  // 24절기 (황경 315° 입춘부터 15° 간격)
  const TERMS = [
    '입춘', '우수', '경칩', '춘분', '청명', '곡우',
    '입하', '소만', '망종', '하지', '소서', '대서',
    '입추', '처서', '백로', '추분', '한로', '상강',
    '입동', '소설', '대설', '동지', '소한', '대한'
  ];
  const MONTH_NAMES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  const MONTH_NAMES_KO = ['인월', '묘월', '진월', '사월', '오월', '미월', '신월', '유월', '술월', '해월', '자월', '축월'];
  const MONTH_START_TERM = ['입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한'];

  const LUCKY = {
    목: { color: '청록색·연두색', item: '화분·나무 소품', number: [3, 8], dir: '동쪽', time: '아침 7~9시', taste: '신맛' },
    화: { color: '주홍·자주색', item: '향초·붉은 소품', number: [2, 7], dir: '남쪽', time: '한낮 11~13시', taste: '쓴맛' },
    토: { color: '베이지·황토색', item: '도자기·흙 소품', number: [5, 10], dir: '중앙', time: '오후 1~3시', taste: '단맛' },
    금: { color: '흰색·은색', item: '금속 액세서리', number: [4, 9], dir: '서쪽', time: '저녁 17~19시', taste: '매운맛' },
    수: { color: '남색·검정', item: '유리·물 소품', number: [1, 6], dir: '북쪽', time: '밤 21~23시', taste: '짠맛' }
  };

  /* ---------- 천문 계산 ---------- */
  function toJD(y, m, d, hours) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + (hours || 0) / 24;
  }

  function jdn(y, m, d) {
    const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
      - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  function jdToDate(jdLocal) {
    const jd = jdLocal + 0.5;
    const z = Math.floor(jd), f = jd - z;
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524, c = Math.floor((b - 122.1) / 365.25),
      d0 = Math.floor(365.25 * c), e = Math.floor((b - d0) / 30.6001);
    const day = b - d0 - Math.floor(30.6001 * e);
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    let hours = f * 24;
    let h = Math.floor(hours), mi = Math.round((hours - h) * 60);
    if (mi === 60) { mi = 0; h += 1; }
    return { y: year, m: month, d: day, h: h, mi: mi };
  }

  // 태양 겉보기 황경 (Meeus 저정밀, 오차 ~0.01°)
  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mr = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
      + 0.000289 * Math.sin(3 * Mr);
    const omega = 125.04 - 1934.136 * T;
    let lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    return ((lambda % 360) + 360) % 360;
  }

  function norm180(x) { return ((x + 540) % 360) - 180; }

  // 목표 황경에 태양이 도달하는 순간(UT JD)을 찾는다 — 전후 w일을 훑는다
  function findTermJD(targetLong, approxJD, windowDays) {
    const w = windowDays || 40;
    const f = jd => norm180(sunLongitude(jd) - targetLong);
    let a = approxJD - w, fa = f(a);
    for (let i = 1; i <= w * 4; i++) {
      const b = a + 0.5, fb = f(b);
      if (fa <= 0 && fb > 0) {
        let lo = a, hi = b;
        for (let k = 0; k < 42; k++) {
          const mid = (lo + hi) / 2;
          if (f(mid) > 0) hi = mid; else lo = mid;
        }
        return (lo + hi) / 2;
      }
      a = b; fa = fb;
    }
    return null;
  }

  /* ---------- 오행 · 십신 ---------- */
  function relation(meEl, otherEl) {
    if (meEl === otherEl) return '비겁';
    if ((meEl + 1) % 5 === otherEl) return '식상';
    if ((meEl + 2) % 5 === otherEl) return '재성';
    if ((otherEl + 2) % 5 === meEl) return '관성';
    return '인성';
  }

  function tenGod(dayStem, otherStem) {
    const me = STEM_ELEM[dayStem], other = STEM_ELEM[otherStem];
    const same = STEM_IS_YIN[dayStem] === STEM_IS_YIN[otherStem];
    const rel = relation(me, other);
    switch (rel) {
      case '비겁': return same ? '비견' : '겁재';
      case '식상': return same ? '식신' : '상관';
      case '재성': return same ? '편재' : '정재';
      case '관성': return same ? '편관' : '정관';
      default: return same ? '편인' : '정인';
    }
  }

  function pillar(stem, branch) {
    return {
      stem: stem, branch: branch,
      stemName: STEMS[stem], branchName: BRANCHES[branch],
      stemKo: STEMS_KO[stem], branchKo: BRANCHES_KO[branch],
      hanja: STEMS[stem] + BRANCHES[branch],
      ko: STEMS_KO[stem] + BRANCHES_KO[branch],
      ganji: STEMS[stem] + BRANCHES[branch] + '(' + STEMS_KO[stem] + BRANCHES_KO[branch] + ')',
      stemElem: ELEMENTS[STEM_ELEM[stem]],
      branchElem: ELEMENTS[BRANCH_ELEM[branch]],
      animal: BRANCH_ANIMAL_KO[branch],
      index: (() => { for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i; return -1; })()
    };
  }

  /* ---------- 오늘 날짜 ---------- */
  function todayParts(now) {
    const d = now || new Date();
    // 브라우저 시간대와 무관하게 KST 기준
    const kst = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + 9 * 3600000);
    return { y: kst.getFullYear(), m: kst.getMonth() + 1, d: kst.getDate(), h: kst.getHours(), mi: kst.getMinutes() };
  }

  function getToday(now) {
    const t = todayParts(now);
    return describeDay(t.y, t.m, t.d);
  }

  function describeDay(y, m, d) {
    const dayIndex = ((jdn(y, m, d) - 2433191) % 60 + 60) % 60;
    const p = pillar(dayIndex % 10, dayIndex % 12);
    const jdLocal = toJD(y, m, d, 12);
    const lam = sunLongitude(jdLocal - 9 / 24);
    const termIdx = Math.floor((((lam - 315) + 360) % 360) / 15);
    const termStartLong = 315 + termIdx * 15;
    const startJD = findTermJD(termStartLong, jdLocal - 9 / 24, 20);
    return {
      y: y, m: m, d: d,
      dateStr: y + '년 ' + m + '월 ' + d + '일',
      dayIndex: dayIndex,
      pillar: p,
      ganji: p.ganji,
      termName: TERMS[termIdx],
      termLong: termStartLong % 360,
      termStart: startJD ? jdToDate(startJD + 9 / 24) : null,
      weekday: ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()]
    };
  }

  function formatTermTime(o) {
    if (!o) return '';
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return o.m + '월 ' + o.d + '일 ' + pad(o.h) + ':' + pad(o.mi);
  }

  /* ---------- 사주 구성 ---------- */
  function buildChart(input) {
    const y = +input.year, m = +input.month, d = +input.day;
    const hasTime = input.hour !== null && input.hour !== undefined && input.hour !== '';
    const hour = hasTime ? +input.hour : null;
    const minute = input.minute ? +input.minute : 0;

    // 1) 일주
    const dayIdx60 = ((jdn(y, m, d) - 2433191) % 60 + 60) % 60;
    const dayStem = dayIdx60 % 10, dayBranch = dayIdx60 % 12;

    // 2) 태양 황경 → 절기 월
    const jdLocal = toJD(y, m, d, hasTime ? hour + minute / 60 : 12);
    const lam = sunLongitude(jdLocal - 9 / 24);
    const monthIdx = Math.floor(((((lam - 315) + 360) % 360)) / 30); // 0=寅월
    const monthBranch = (2 + monthIdx) % 12; // 寅=2

    // 3) 년주 (입춘 기준)
    const sajuYear = monthIdx === 11 ? y - 1 : y;
    const yearIdx60 = ((sajuYear - 1984) % 60 + 60) % 60;
    const yearStem = yearIdx60 % 10, yearBranchIdx = yearIdx60 % 12;

    // 4) 월주 (오호둔법)
    const firstMonthStem = (yearStem * 2 + 2) % 10;
    const monthStem = (firstMonthStem + monthIdx) % 10;

    // 5) 시주 (오자둔법)
    let hourBranch = null, hourStem = null, timeRange = '';
    if (hasTime) {
      hourBranch = Math.floor((((hour + minute / 60) + 0.5) % 24) / 2) % 12;
      hourStem = (dayStem * 2 + hourBranch) % 10;
      timeRange = HOUR_RANGE[hourBranch];
    }

    const P = {
      year: pillar(yearStem, yearBranchIdx),
      month: pillar(monthStem, monthBranch),
      day: pillar(dayStem, dayBranch),
      hour: hasTime ? pillar(hourStem, hourBranch) : null
    };

    // 6) 오행 집계
    const entries = [];
    const push = (el, weight, label, kind) => entries.push({ el: el, weight: weight, label: label, kind: kind });
    push(STEM_ELEM[yearStem], 0.9, '년간', 'stem');
    push(STEM_ELEM[monthStem], 1.2, '월간', 'stem');
    push(STEM_ELEM[dayStem], 1.0, '일간', 'stem');
    push(BRANCH_ELEM[yearBranchIdx], 0.8, '년지', 'branch');
    push(BRANCH_ELEM[monthBranch], 3.0, '월지', 'branch');
    push(BRANCH_ELEM[dayBranch], 1.6, '일지', 'branch');
    if (hasTime) {
      push(STEM_ELEM[hourStem], 0.9, '시간', 'stem');
      push(BRANCH_ELEM[hourBranch], 0.8, '시지', 'branch');
    }

    const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    const scores = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    entries.forEach(e => {
      counts[ELEMENTS[e.el]] += 1;
      scores[ELEMENTS[e.el]] += e.weight;
    });
    const totalChars = entries.length;
    const pct = {};
    ELEMENTS.forEach(el => { pct[el] = Math.round(scores[el] / entries.reduce((s, e) => s + e.weight, 0) * 100); });

    const dayEl = STEM_ELEM[dayStem];
    const dayElemName = ELEMENTS[dayEl];

    // 7) 신강/신약
    let support = 0, drain = 0;
    entries.forEach(e => {
      if (e.label === '일간') return;
      const rel = relation(dayEl, e.el);
      if (rel === '비겁' || rel === '인성') support += e.weight;
      else drain += e.weight;
    });
    const ratio = support / (support + drain);
    let strength, strengthKo;
    if (ratio >= 0.56) { strength = 'strong'; strengthKo = '신강'; }
    else if (ratio <= 0.44) { strength = 'weak'; strengthKo = '신약'; }
    else { strength = 'balanced'; strengthKo = '중화'; }

    // 8) 용신
    const yongsin = pickYongsin(dayEl, strength, counts, scores);

    // 9) 십신 (천간·지지)
    const gods = {
      yearStem: tenGod(dayStem, yearStem),
      monthStem: tenGod(dayStem, monthStem),
      hourStem: hasTime ? tenGod(dayStem, hourStem) : null,
      yearBranch: tenGod(dayStem, BRANCH_MAIN_STEM[yearBranchIdx]),
      monthBranch: tenGod(dayStem, BRANCH_MAIN_STEM[monthBranch]),
      dayBranch: tenGod(dayStem, BRANCH_MAIN_STEM[dayBranch]),
      hourBranch: hasTime ? tenGod(dayStem, BRANCH_MAIN_STEM[hourBranch]) : null
    };

    // 10) 십신 분포
    const godGroups = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    [gods.yearStem, gods.monthStem, gods.hourStem].filter(Boolean).forEach(g => { godGroups[GOD_GROUP[g]] += 1; });
    [gods.yearBranch, gods.monthBranch, gods.dayBranch, gods.hourBranch].filter(Boolean).forEach(g => { godGroups[GOD_GROUP[g]] += 1; });

    // 11) 12운성
    const stages = {
      year: stageOf(dayStem, yearBranchIdx),
      month: stageOf(dayStem, monthBranch),
      day: stageOf(dayStem, dayBranch),
      hour: hasTime ? stageOf(dayStem, hourBranch) : null
    };

    // 12) 월 절입 정보
    const termStartLong = 315 + monthIdx * 30;
    const startJD = findTermJD(termStartLong, jdLocal - 9 / 24, 40);
    const nextStartJD = findTermJD(315 + ((monthIdx + 1) % 12) * 30, jdLocal - 9 / 24, 45);

    const missing = ELEMENTS.filter(el => counts[el] === 0);

    /* 13) 십이신살 (년지 삼합 기준) */
    const sinsalStart = SINSAL_START[yearBranchIdx];
    const sinsalOf = b => SINSAL[((b - sinsalStart) % 12 + 12) % 12];
    const sinsal = {
      year: sinsalOf(yearBranchIdx),
      month: sinsalOf(monthBranch),
      day: sinsalOf(dayBranch),
      hour: hasTime ? sinsalOf(hourBranch) : null
    };

    /* 14) 귀인 (천을·천덕·월덕) */
    const pillarList = [['년주', P.year], ['월주', P.month], ['일주', P.day]].concat(P.hour ? [['시주', P.hour]] : []);
    const matchStem = stemIdx => {
      const hits = [];
      pillarList.forEach(([n, p]) => { if (p.stem === stemIdx) hits.push(n + ' ' + STEMS[stemIdx]); });
      pillarList.forEach(([n, p]) => {
        if (BRANCH_MAIN_STEM[p.branch] === stemIdx) hits.push(n + ' ' + BRANCHES[p.branch] + '(정기 ' + STEMS[stemIdx] + ')');
      });
      return hits;
    };
    const matchBranch = branchIdx => {
      const hits = [];
      pillarList.forEach(([n, p]) => { if (p.branch === branchIdx) hits.push(n + ' ' + BRANCHES[branchIdx]); });
      return hits;
    };
    const CHEONEUL_STEM = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];
    const cheondeokChar = CHEONDEOK[monthBranch];
    const woldeokStem = WOLDEAK[monthBranch];
    const gwisinOf = ch => {
      const sf = STEMS.indexOf(ch), bf = BRANCHES.indexOf(ch);
      return (sf >= 0 ? matchStem(sf) : []).concat(bf >= 0 ? matchBranch(bf) : []);
    };
    const gwisin = {
      cheondeok: { char: cheondeokChar, label: '천덕귀인', hits: gwisinOf(cheondeokChar) },
      woldeok: { char: STEMS[woldeokStem], label: '월덕귀인', hits: matchStem(woldeokStem) },
      cheoneul: {
        label: '천을귀인',
        chars: CHEONEUL_STEM[dayStem].map(b => BRANCHES[b]),
        hits: CHEONEUL_STEM[dayStem].reduce((a, b) => a.concat(matchBranch(b)), [])
      }
    };

    /* 15) 음양 비율 (지지는 본기·정기 천간의 음양으로 계산) */
    const yyList = [
      { name: '년간', char: STEMS[yearStem], yin: !!STEM_IS_YIN[yearStem] },
      { name: '년지', char: BRANCHES[yearBranchIdx], yin: !!STEM_IS_YIN[BRANCH_MAIN_STEM[yearBranchIdx]] },
      { name: '월간', char: STEMS[monthStem], yin: !!STEM_IS_YIN[monthStem] },
      { name: '월지', char: BRANCHES[monthBranch], yin: !!STEM_IS_YIN[BRANCH_MAIN_STEM[monthBranch]] },
      { name: '일간', char: STEMS[dayStem], yin: !!STEM_IS_YIN[dayStem] },
      { name: '일지', char: BRANCHES[dayBranch], yin: !!STEM_IS_YIN[BRANCH_MAIN_STEM[dayBranch]] }
    ];
    if (hasTime) {
      yyList.push({ name: '시간', char: STEMS[hourStem], yin: !!STEM_IS_YIN[hourStem] });
      yyList.push({ name: '시지', char: BRANCHES[hourBranch], yin: !!STEM_IS_YIN[BRANCH_MAIN_STEM[hourBranch]] });
    }
    const yinCount = yyList.filter(x => x.yin).length;
    const yangCount = yyList.length - yinCount;
    const yinyang = {
      list: yyList, yang: yangCount, yin: yinCount,
      yangPct: Math.round(yangCount / yyList.length * 100),
      yinPct: 100 - Math.round(yangCount / yyList.length * 100),
      note: '지지는 본기(정기) 천간의 음양으로 계산합니다'
    };

    return {
      input: {
        name: input.name || '',
        gender: input.gender || '',
        year: y, month: m, day: d,
        hour: hour, minute: minute, hasTime: hasTime,
        solar: input.solar !== false
      },
      pillars: P,
      ganji: P.year.hanja + ' ' + P.month.hanja + ' ' + P.day.hanja + (P.hour ? ' ' + P.hour.hanja : ''),
      ganjiKo: P.year.ko + ' ' + P.month.ko + ' ' + P.day.ko + (P.hour ? ' ' + P.hour.ko : ''),
      dayMaster: {
        stem: dayStem,
        hanja: STEMS[dayStem],
        ko: STEMS_KO[dayStem],
        elem: dayElemName,
        elemHanja: ELEMENTS_HANJA[dayEl],
        yang: !STEM_IS_YIN[dayStem],
        yinYang: STEM_IS_YIN[dayStem] ? '음' : '양'
      },
      counts: counts,
      pct: pct,
      missing: missing,
      strength: strength,
      strengthKo: strengthKo,
      strengthRatio: Math.round(ratio * 100),
      yongsin: yongsin,
      gods: gods,
      godGroups: godGroups,
      stages: stages,
      sinsal: sinsal,
      gwisin: gwisin,
      yinyang: yinyang,
      timeRange: timeRange,
      month: {
        idx: monthIdx,
        branch: MONTH_NAMES[monthIdx],
        nameKo: MONTH_NAMES_KO[monthIdx],
        startTerm: MONTH_START_TERM[monthIdx],
        startAt: startJD ? jdToDate(startJD + 9 / 24) : null,
        nextTerm: MONTH_START_TERM[(monthIdx + 1) % 12],
        nextAt: nextStartJD ? jdToDate(nextStartJD + 9 / 24) : null
      },
      year: {
        sajuYear: sajuYear,
        hanja: P.year.hanja,
        ko: P.year.ko,
        animal: P.year.animal
      },
      solarLongitude: Math.round(lam * 10) / 10
    };
  }

  const HOUR_RANGE = [
    '23:30~01:30', '01:30~03:30', '03:30~05:30', '05:30~07:30',
    '07:30~09:30', '09:30~11:30', '11:30~13:30', '13:30~15:30',
    '15:30~17:30', '17:30~19:30', '19:30~21:30', '21:30~23:30'
  ];

  const GOD_GROUP = {
    비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상',
    편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성'
  };

  function stageOf(dayStem, branchIdx) {
    const start = STAGE_START[dayStem];
    const dir = STEM_IS_YIN[dayStem] ? -1 : 1;
    const idx = ((branchIdx - start) * dir % 12 + 12) % 12;
    return STAGES[idx];
  }

  function pickYongsin(dayEl, strength, counts, scores) {
    const el = i => ELEMENTS[(dayEl + i) % 5];
    const sik = el(1), jae = el(2), gwan = el(3), insung = el(4);
    if (strength === 'strong') {
      const primary = gwan;
      const secondary = counts[gwan] >= 2 ? jae : (counts[jae] >= 2 ? sik : jae);
      return {
        elem: primary, hee: secondary,
        reason: '기운이 강한 사주라 기운을 덜어내고 눌러 주는 오행이 필요합니다',
        care: '에너지가 넘치는 만큼 몰아붙이기보다 속도를 조절하는 편이 좋습니다'
      };
    }
    if (strength === 'weak') {
      return {
        elem: insung, hee: el(0),
        reason: '기운이 약한 사주라 나를 살려 주는 오행의 도움이 필요합니다',
        care: '혼자 밀어붙이기보다 사람과 환경의 도움을 받을 때 길이 열립니다'
      };
    }
    const scarce = ELEMENTS.slice().sort((a, b) => counts[a] - counts[b])[0];
    const scarceIdx = ELEMENTS.indexOf(scarce);
    return {
      elem: scarce, hee: ELEMENTS[(scarceIdx + 4) % 5],
      reason: '오행이 고르게 놓여 있어 가장 적은 기운을 채워 주면 흐름이 매끄러워집니다',
      care: '균형이 좋은 사주라 어느 한쪽으로 치우치지 않는 판단이 힘을 발휘합니다'
    };
  }

  /* ---------- 오늘의 운세 ---------- */
  const GOD_FORTUNE = {
    비견: { score: 4, love: 2, money: 0, work: 4, note: '내 힘이 드러나는 날, 동료와의 협업에서 실마리가 보입니다' },
    겁재: { score: -4, love: -4, money: -8, work: -2, note: '돈과 말이 오가는 자리에서 손실이 생기기 쉬운 날입니다' },
    식신: { score: 8, love: 7, money: 6, work: 5, note: '표현이 자연스럽게 통해 사람의 마음을 얻는 날입니다' },
    상관: { score: 1, love: 6, money: 2, work: -6, note: '하고 싶은 말이 앞서 나가 윗사람과 부딪히기 쉽습니다' },
    편재: { score: 5, love: 6, money: 9, work: 2, note: '예상하지 못한 곳에서 돈의 기회가 스칩니다' },
    정재: { score: 7, love: 4, money: 8, work: 6, note: '차근차근 쌓은 것이 결과로 확인되는 날입니다' },
    편관: { score: -6, love: -3, money: -4, work: 6, note: '압박과 책임이 몰리지만 버티면 인정을 받습니다' },
    정관: { score: 6, love: 5, money: 4, work: 9, note: '공식적인 자리에서 신뢰를 얻기 좋은 날입니다' },
    편인: { score: -2, love: -2, money: -1, work: 3, note: '생각이 많아져 혼자만의 시간이 필요한 날입니다' },
    정인: { score: 5, love: 4, money: 3, work: 5, note: '배움과 조언이 귀하게 작용하는 날, 어른의 말을 들어보세요' }
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }

  const CLASH = { 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 0, 7: 1, 8: 2, 9: 3, 10: 4, 11: 5 };
  const COMBINE = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };

  function todayReading(chart, today) {
    const t = today || getToday();
    const dayStem = chart.dayMaster.stem;
    const dEl = STEM_ELEM[dayStem];
    const tStemEl = STEM_ELEM[t.pillar.index % 10];
    const god = tenGod(dayStem, t.pillar.index % 10);
    const base = GOD_FORTUNE[god] || { score: 0, love: 0, money: 0, work: 0, note: '' };
    const yongEl = ELEMENTS.indexOf(chart.yongsin.elem);
    const heeEl = ELEMENTS.indexOf(chart.yongsin.hee);

    let bonus = 0;
    if (tStemEl === yongEl) bonus += 12;
    else if (tStemEl === heeEl) bonus += 7;
    else if (relation(dEl, tStemEl) === '관성') bonus += 2;

    const myDayBranch = chart.pillars.day.branch;
    const tBranch = t.pillar.index % 12;
    let clash = false, combine = false;
    if (CLASH[myDayBranch] === tBranch) { clash = true; bonus -= 10; }
    if (COMBINE[myDayBranch] === tBranch) { combine = true; bonus += 8; }

    const seed = hash(t.y + '-' + t.m + '-' + t.d + ':' + chart.ganji + ':' + chart.input.name);
    const noise = (seed % 9) - 4;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const total = clamp(50 + base.score + bonus + noise, 30, 97);
    const love = clamp(52 + base.love + (combine ? 9 : 0) + (clash ? -7 : 0) + ((seed >> 3) % 9) - 4, 28, 97);
    const money = clamp(50 + base.money + (tStemEl === yongEl ? 8 : 0) + ((seed >> 6) % 9) - 4, 28, 97);
    const work = clamp(52 + base.work + ((seed >> 9) % 9) - 4, 28, 97);

    const lucky = LUCKY[chart.yongsin.elem];
    const luckyNo = lucky.number[seed % lucky.number.length];

    return {
      today: t,
      god: god,
      godGroup: GOD_GROUP[god],
      element: ELEMENTS[tStemEl],
      branchElement: ELEMENTS[BRANCH_ELEM[tBranch]],
      clash: clash,
      combine: combine,
      total: total,
      love: love,
      money: money,
      work: work,
      note: base.note,
      lucky: {
        color: lucky.color,
        number: luckyNo,
        direction: lucky.dir,
        time: lucky.time,
        item: lucky.item,
        taste: lucky.taste
      },
      keywords: todayKeywords(total, god, clash, combine)
    };
  }

  function todayKeywords(total, god, clash, combine) {
    const k = [];
    if (total >= 80) k.push('기회포착');
    if (total >= 70) k.push('추진력');
    if (combine) k.push('인연의 합');
    if (clash) k.push('속도조절');
    if (GOD_GROUP[god] === '재성') k.push('재물운');
    if (GOD_GROUP[god] === '관성') k.push('책임과 인정');
    if (GOD_GROUP[god] === '식상') k.push('표현력');
    if (GOD_GROUP[god] === '인성') k.push('배움');
    if (GOD_GROUP[god] === '비겁') k.push('동료·협업');
    if (!k.length) k.push('무난한 하루');
    return k.slice(0, 3);
  }

  /* ---------- 공개 API ---------- */
  const api = {
    STEMS, STEMS_KO, BRANCHES, BRANCHES_KO, ELEMENTS, ELEMENTS_HANJA, ELEMENT_COLOR,
    TEN_GODS, STAGES, TERMS, MONTH_NAMES, MONTH_NAMES_KO, GOD_GROUP, LUCKY, HOUR_RANGE, SINSAL,
    jdn, toJD, sunLongitude, jdToDate, findTermJD, formatTermTime,
    buildChart, getToday, describeDay, todayReading, tenGod, relation, stageOf, hash,
    stemElem: s => ELEMENTS[STEM_ELEM[s]],
    branchElem: b => ELEMENTS[BRANCH_ELEM[b]],
    branchMainStem: b => BRANCH_MAIN_STEM[b],
    stemIsYin: s => !!STEM_IS_YIN[s]
  };

  global.SajuEngine = api;

  /* ---------- 자체 검증 (콘솔: SajuEngine.selfTest()) ---------- */
  api.selfTest = function () {
    const out = [];
    const check = (label, got, want) => out.push((got === want ? 'OK  ' : 'FAIL') + ' ' + label + ' → ' + got + (got === want ? '' : ' (기대 ' + want + ')'));
    check('2026-11-17 일진', describeDay(2026, 11, 17).pillar.hanja, '乙未');
    check('2026-11-17 일진 한글', describeDay(2026, 11, 17).pillar.ko, '을미');
    check('1949-10-01 일진', describeDay(1949, 10, 1).pillar.hanja, '甲子');
    check('2000-01-01 일진', describeDay(2000, 1, 1).pillar.hanja, '戊午');
    check('2024-01-01 일진', describeDay(2024, 1, 1).pillar.hanja, '甲子');
    const c1 = buildChart({ year: 1995, month: 7, day: 20, hour: 10 });
    check('1995-07-20 년주', c1.pillars.year.hanja, '乙亥');
    check('1995-07-20 월주', c1.pillars.month.hanja, '癸未');
    const c2 = buildChart({ year: 2026, month: 2, day: 3, hour: 12 });
    check('2026-02-03(입춘 전) 년주', c2.pillars.year.hanja, '乙巳');
    const c3 = buildChart({ year: 2026, month: 2, day: 5, hour: 12 });
    check('2026-02-05(입춘 후) 년주', c3.pillars.year.hanja, '丙午');
    const c4 = buildChart({ year: 2026, month: 11, day: 17, hour: 23, minute: 45 });
    check('2026-11-17 23:45 시주', c4.pillars.hour.hanja, '丙子'); // 생일 그대로 계산(조자시 미적용) 유파 기준
    const c5 = buildChart({ year: 2001, month: 2, day: 23, hour: 8 });
    check('2001-02-23 진시 년주', c5.pillars.year.hanja, '辛巳');
    check('2001-02-23 진시 월주', c5.pillars.month.hanja, '庚寅');
    check('2001-02-23 진시 일주', c5.pillars.day.hanja, '丁巳');
    check('2001-02-23 진시 시주', c5.pillars.hour.hanja, '甲辰');
    check('2001-02-23 일간 음양', c5.dayMaster.yinYang, '음');
    check('2001-02-23 양 비율', c5.yinyang.yangPct, 75);
    check('2001-02-23 음 비율', c5.yinyang.yinPct, 25);
    check('2001-02-23 월지 십이신살(寅)', c5.sinsal.month, '겁살');
    check('2001-02-23 일지 십이신살(巳)', c5.sinsal.day, '지살');
    check('2001-02-23 월덕귀인', c5.gwisin.woldeok.char, '丙');
    return out;
  };

})(typeof window !== 'undefined' ? window : globalThis);
