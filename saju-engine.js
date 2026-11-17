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

  /* ---------- 음력 ↔ 양력 (한국 음력 · KST 기준) ----------
     · 삭(朔)이 드는 날이 그 달 1일
     · 동지(황경 270°)가 든 달이 11월
     · 열세 달이 드는 해에서 중기(中氣)가 없는 첫 달이 윤달
     삭 시각은 Meeus, Astronomical Algorithms 49장으로 계산합니다. */
  const SIZI_NAMES = ['자시', '축시', '인시', '묘시', '진시', '사시', '오시', '미시', '신시', '유시', '술시', '해시'];
  const KST_OFF = 9 / 24;
  const MAJOR_TERMS = [
    [270, 12, 21], [300, 1, 20], [330, 2, 19], [0, 3, 20], [30, 4, 20], [60, 5, 21],
    [90, 6, 21], [120, 7, 22], [150, 8, 23], [180, 9, 23], [210, 10, 23], [240, 11, 22]
  ];
  const LUNAR_CACHE = { m11: {}, term: {}, cycle: {}, year: {} };

  function newMoonJD(k) {
    const T = k / 1236.85;
    const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    const rad = Math.PI / 180;
    const M = (2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3) * rad;
    const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * rad;
    const F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * rad;
    const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * rad;
    const s = Math.sin;
    jde += -0.40720 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F)
      + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M)
      - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M)
      - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F)
      - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(Om) - 0.00007 * s(Mp + 2 * M)
      + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F)
      + 0.00003 * s(2 * Mp + 2 * F) - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F)
      - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
    return jde;
  }

  function kstJDN(jd) { const o = jdToDate(jd + KST_OFF); return jdn(o.y, o.m, o.d); }

  function winterSolsticeJDN(year) {
    const jd = findTermJD(270, toJD(year, 12, 21, 0) - KST_OFF, 6);
    if (jd == null) return null;
    return kstJDN(jd);
  }

  // 그 해 11월(동짓달) 초하루 — 동지가 든 날이나 그 직전의 삭일
  function lunarMonth11Start(year) {
    if (LUNAR_CACHE.m11[year] != null) return LUNAR_CACHE.m11[year];
    const sj = winterSolsticeJDN(year);
    if (sj == null) return null;
    const k0 = Math.floor((toJD(year, 12, 10, 0) - 2451550.09766) / 29.530588861);
    let best = null;
    for (let k = k0 - 2; k <= k0 + 2; k++) {
      const s = kstJDN(newMoonJD(k));
      if (s <= sj && (best == null || s > best)) best = s;
    }
    LUNAR_CACHE.m11[year] = best;
    return best;
  }

  // 그 해의 중기(中氣) 12개 — 양력 날짜(JDN)
  function majorTermJDNs(year) {
    if (LUNAR_CACHE.term[year]) return LUNAR_CACHE.term[year];
    const out = [];
    MAJOR_TERMS.forEach(t => {
      const jd = findTermJD(t[0], toJD(year, t[1], t[2], 0) - KST_OFF, 6);
      if (jd != null) out.push(kstJDN(jd));
    });
    LUNAR_CACHE.term[year] = out;
    return out;
  }

  // 11월(동짓달)부터 다음 해 11월 전까지의 달 목록 — 12개 또는 13개(윤달 포함)
  function solarMonthCycle(year) {
    if (LUNAR_CACHE.cycle[year]) return LUNAR_CACHE.cycle[year];
    const s1 = lunarMonth11Start(year), s2 = lunarMonth11Start(year + 1);
    if (s1 == null || s2 == null || s2 <= s1) return [];
    const k0 = Math.floor((toJD(year, 12, 1, 0) - 2451550.09766) / 29.530588861) - 1;
    const starts = [];
    for (let k = k0; k < k0 + 26; k++) {
      const s = kstJDN(newMoonJD(k));
      if (s >= s1 && s < s2 && starts.indexOf(s) < 0) starts.push(s);
      if (s >= s2) break;
    }
    starts.sort((a, b) => a - b);
    const n = starts.length;
    const terms = majorTermJDNs(year).concat(majorTermJDNs(year + 1));
    let leapIdx = -1;
    if (n === 13) {
      for (let i = 1; i < n; i++) {
        const end = (i + 1 < n) ? starts[i + 1] : s2;
        const has = terms.some(t => t >= starts[i] && t < end);
        if (!has) { leapIdx = i; break; }
      }
    }
    const out = [];
    let num = 11;
    for (let i = 0; i < n; i++) {
      const leap = (i === leapIdx);
      if (i > 0 && !leap) num = (num === 12) ? 1 : num + 1;
      out.push({ num: num, leap: leap, start: starts[i], end: (i + 1 < n) ? starts[i + 1] : s2 });
    }
    LUNAR_CACHE.cycle[year] = out;
    return out;
  }

  // 음력 (년)의 달 목록 — 1월부터 12월(윤달 포함하면 13개)
  function lunarYearMonths(ly) {
    if (LUNAR_CACHE.year[ly]) return LUNAR_CACHE.year[ly];
    const a = solarMonthCycle(ly - 1), b = solarMonthCycle(ly);
    const firstOf = arr => {
      for (let i = 0; i < arr.length; i++) if (arr[i].num === 1 && !arr[i].leap) return i;
      return -1;
    };
    const i1 = firstOf(a), i2 = firstOf(b);
    if (i1 < 0 || i2 < 0) return [];
    const out = a.slice(i1).concat(b.slice(0, i2));
    LUNAR_CACHE.year[ly] = out;
    return out;
  }

  function lunarLeapMonths(ly) {
    return lunarYearMonths(ly).filter(m => m.leap).map(m => m.num);
  }

  // 음력 날짜 → 양력 날짜. 그 달·그 날이 없으면 Error
  function lunarToSolar(ly, lm, ld, leap) {
    const Y = +ly, M = +lm, D = +ld;
    if (!(Y > 1800 && Y < 2200) || !(M >= 1 && M <= 12) || !(D >= 1 && D <= 30)) throw new Error('음력 날짜 범위를 확인해 주세요');
    const months = lunarYearMonths(Y);
    if (!months.length) throw new Error('음력을 계산할 수 없는 해입니다');
    let found = null;
    months.forEach(m => { if (m.num === M && !!m.leap === !!leap) found = m; });
    if (!found) throw new Error('음력 ' + Y + '년 ' + M + '월' + (leap ? '(윤달)' : '') + '은 없는 달입니다');
    const j = found.start + (D - 1);
    if (j >= found.end) throw new Error('음력 ' + M + '월에는 ' + D + '일이 없습니다');
    const o = jdnToYmd(j);
    return { y: o.y, m: o.m, d: o.d };
  }

  function solarToLunar(y, m, d) {
    const j = jdn(+y, +m, +d);
    for (let t = 0; t < 2; t++) {
      const ly = +y - t;
      const months = lunarYearMonths(ly);
      for (let i = 0; i < months.length; i++) {
        const mm = months[i];
        if (j >= mm.start && j < mm.end) return { y: ly, m: mm.num, d: j - mm.start + 1, leap: mm.leap };
      }
    }
    throw new Error('음력으로 바꿀 수 없는 날짜입니다');
  }

  // JDN → 양력 (음력 계산 전용, JD 역산)
  function jdnToYmd(j) {
    const a = j + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor(1461 * d / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);
    return { y: year, m: month, d: day };
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
    /* 양력·음력 입력을 모두 받아 계산은 양력으로 합니다.
       input.calendar === 'lunar' 이면 실제 음력→양력 변환을 거칩니다. */
    const calendar = (input.calendar === 'lunar' || input.solar === false) ? 'lunar' : 'solar';
    const leapIn = calendar === 'lunar' && !!input.leap;
    const birthYear = +input.year, birthMonth = +input.month, birthDay = +input.day;
    let solar = { y: birthYear, m: birthMonth, d: birthDay };
    if (calendar === 'lunar') solar = lunarToSolar(birthYear, birthMonth, birthDay, leapIn);
    const y = solar.y, m = solar.m, d = solar.d;
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
      note: '지지는 본기(정기) 천간의 음양을 따릅니다'
    };

    return {
      input: {
        name: input.name || '',
        gender: input.gender || '',
        calendar: calendar,
        leap: leapIn,
        year: birthYear, month: birthMonth, day: birthDay,
        solarYear: y, solarMonth: m, solarDay: d,
        hour: hour, minute: minute, hasTime: hasTime,
        solar: calendar === 'solar'
      },
      sizi: hasTime ? { index: hourBranch, name: SIZI_NAMES[hourBranch], range: timeRange } : null,
      calendar: calendar,
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

  /* ============================================================
     심층 풀이 엔진 — 계산값을 문장으로 옮기는 층
     기본 리포트와 2027 유료 리포트의 심층 구간이 함께 사용합니다.
     ============================================================ */
  const ELEM_DEEP = {
    목: { name: '나무', organ: '간과 눈, 힘줄', gift: '새로운 것을 시작하고 사람을 끌어오는 힘', over: '벌여 놓고 끝내지 못한 일이 쌓입니다', lack: '시작하는 힘이 아쉬워 새 일을 벌일 때 누군가의 등을 빌려야 합니다', care: '아침에 창을 열어 바깥 공기를 먼저 들이는 것', job: '교육·출판·기획·콘텐츠·원예' },
    화: { name: '불', organ: '심장과 혈압, 눈', gift: '분위기를 밝히고 사람의 시선을 모으는 힘', over: '감정이 먼저 올라와 말이 앞서고 몸에 열이 오릅니다', lack: '드러내고 표현하는 힘이 약해 잘해 놓고도 인정받지 못합니다', care: '해가 있는 시간에 몸을 움직이고 밤에는 불을 낮추는 것', job: '방송·영업·요식·마케팅' },
    토: { name: '흙', organ: '위와 비장, 소화기', gift: '중심을 잡고 오래 버티는 힘, 사람을 받아들이는 그릇', over: '고집과 미련이 되어 움직여야 할 때를 놓칩니다', lack: '중심을 잡는 힘이 아쉬워 일이 벌어지면 중간에 흔들립니다', care: '끼니 시간을 어기지 않고 따뜻한 것을 먼저 먹는 것', job: '부동산·유통·중개·행정' },
    금: { name: '쇠', organ: '폐와 피부, 대장', gift: '끊고 정리하는 결단과 정확함', over: '칼같은 말로 사람을 베고 몸이 뻣뻣해집니다', lack: '끊고 정리하는 결단이 늦어 안고 갈 일이 많아집니다', care: '잠들기 전 방을 정리하고 숨을 길게 쉬는 것', job: '금융·법률·의료·제조' },
    수: { name: '물', organ: '신장과 방광, 허리', gift: '흐름을 읽고 돌아가는 지혜, 생각의 깊이', over: '생각이 많아 결정이 늦고 몸이 차고 무거워집니다', lack: '쉬어 가는 지혜가 아쉬워 앞만 보고 달리다 지칩니다', care: '물을 자주 마시고 하루 한 번은 물가를 걷는 것', job: '무역·물류·여행·IT·상담' }
  };

  const GOD_SIT = {
    비견: { sit: '나와 같은 기운이 나란히 서는 자리', scene: '내 이름으로 결정하고 내 힘으로 밀어붙이는 일', tip: '혼자 결정해야 하는 일을 이 달에 몰아 두세요', risk: '같은 편과의 자존심 경쟁' },
    겁재: { sit: '내 몫을 나눠야 하는 자리', scene: '사람과 돈이 함께 움직이고 비교가 생기는 판', tip: '돈이 오가는 약속은 금액과 날짜를 문서로 남기세요', risk: '지인과의 동업과 보증' },
    식신: { sit: '내 속에서 만들어 낸 것을 세상에 내놓는 자리', scene: '콘텐츠·제안·요리·돌봄처럼 손과 말로 결과가 남는 일', tip: '완성 전에 먼저 내놓으세요. 반응이 다음 문장을 만들어 줍니다', risk: '편안함에 기대어 마감을 미루는 것' },
    상관: { sit: '정해진 것을 뜯어고치고 싶어지는 자리', scene: '기획을 뒤집거나 문제를 지적하는 일, 말이 힘을 갖는 자리', tip: '아이디어는 크게, 말은 짧게. 윗사람 앞에서는 결론부터 말하세요', risk: '날카로운 지적이 관계를 긁는 것' },
    편재: { sit: '판 밖에서 돈의 길이 열리는 자리', scene: '새 거래·영업·투자·부업처럼 한 번에 크게 움직이는 일', tip: '들어온 돈은 그 자리에서 묶으세요. 손에 쥐고 있으면 나갑니다', risk: '즉흥 결제와 큰 승부수' },
    정재: { sit: '쌓아 둔 것이 숫자로 확인되는 자리', scene: '정산·계약·월급·살림처럼 꾸준함이 결과가 되는 일', tip: '이 달에 계약서와 통장을 한 번 정리하면 1년이 편해집니다', risk: '안정에 기대어 새 길을 미루는 것' },
    편관: { sit: '무거운 책임이 어깨에 얹히는 자리', scene: '갑작스러운 지시·평가·경쟁·건강검진처럼 버텨야 하는 일', tip: '반박보다 대응입니다. 일정과 몸을 먼저 확보하면 인정으로 돌아옵니다', risk: '감정적 반발과 과로' },
    정관: { sit: '공식의 자리에서 이름이 오르는 자리', scene: '면접·보고·승진·계약·관공서처럼 격식이 있는 일', tip: '단정한 옷과 정확한 숫자. 이 달의 평가는 오래 남습니다', risk: '지각이나 서류 누락 같은 사소한 실수' },
    편인: { sit: '안으로 들어가 혼자 정리하는 자리', scene: '공부·문서·기획·수리처럼 머릿속에서 일이 익는 시기', tip: '결정 기한을 먼저 정하세요. 이 자리는 생각이 길어지면 때를 놓칩니다', risk: '사람을 피하고 결론을 미루는 것' },
    정인: { sit: '배움과 도움이 밖에서 들어오는 자리', scene: '자격·상담·어른의 조언·오래된 인연이 힘이 되는 시기', tip: '도움을 청하세요. 이 달의 한마디가 몇 달을 줄여 줍니다', risk: '받은 도움을 당연하게 여기는 것' }
  };

  const STAGE_DEEP = {
    장생: '처음 태어나 기운이 트이는 자리 — 시작은 잘 붙지만 아직 단단하지 않습니다',
    목욕: '감정이 물결처럼 오르내리는 자리 — 관계와 취향이 흔들리기 쉬운 때입니다',
    관대: '사회로 나가 이름을 얻는 자리 — 배운 것을 꺼내 쓰면 사람이 따라옵니다',
    건록: '내 힘으로 밥벌이를 세우는 자리 — 실력이 곧 수입이 되는 때입니다',
    제왕: '힘이 정점에 서는 자리 — 밀면 크게 되지만 오만해지면 반동이 옵니다',
    쇠: '기세가 한 걸음 내려앉는 자리 — 새로 벌이기보다 지키는 편이 이깁니다',
    병: '몸과 마음이 점검을 요구하는 자리 — 쉬어야 다음이 있습니다',
    사: '비우고 정리하는 자리 — 끝내야 할 것을 끝내면 자리가 비워집니다',
    묘: '저장하고 갈무리하는 자리 — 겉으로 드러나지 않아도 안이 차오릅니다',
    절: '흐름이 끊기고 방향을 바꾸는 자리 — 전환의 문턱입니다',
    태: '잉태하고 준비하는 자리 — 아직 보이지 않지만 이미 시작되었습니다',
    양: '보호받으며 자라는 자리 — 혼자보다 누군가의 울타리 안에서 큽니다'
  };

  const REL_SIT = {
    충: '자리가 부딪혀 바뀌는 충(沖)',
    합: '묶여 하나로 맺어지는 합(合)',
    형: '서로 눌러 마찰을 만드는 형(刑)',
    파: '맺은 것이 깨지는 파(破)',
    해: '말과 마음이 어긋나는 해(害)',
    복음: '같은 기운이 겹쳐 판단이 세지는 복음(伏吟)'
  };

  const LOVE_SIT = {
    비견: '닮은 사람, 친구처럼 편한 사람에게 끌립니다. 둘 다 주도권을 원해 결정을 미루다 흐지부지되는 흐름이 반복되기 쉬운 자리입니다.',
    겁재: '처음엔 강하게 끌리지만 시간이 지나면 경쟁하는 사이가 되기 쉽습니다. 상대의 조건과 내 조건을 재는 순간 마음이 먼저 식습니다.',
    식신: '함께 있으면 편안한 사람, 밥과 대화가 잘 맞는 사람에게 끌립니다. 이 사주의 연애는 설렘보다 대화의 맛으로 오래 갑니다.',
    상관: '재미있고 말 잘하는 사람에게 끌리고 나도 표현을 아끼지 않습니다. 다만 농담이 지나치면 상대의 자존심에 오래 남습니다.',
    편재: '설레는 사람, 새롭고 활동적인 사람에게 끌립니다. 한 사람에게 오래 머무는 것보다 판을 넓히는 쪽이 편하게 느껴집니다.',
    정재: '성실하고 생활이 정돈된 사람에게 끌립니다. 설렘보다 생활의 리듬이 맞는지로 마음을 결정하는 자리입니다.',
    편관: '강한 사람, 나를 끌고 가는 사람에게 끌립니다. 다만 압박이 사랑으로 오해되는 관계는 오래 버티기 어렵습니다.',
    정관: '예의 있고 책임감 있는 사람에게 끌립니다. 결혼을 전제로 관계를 보는 쪽이라 시작은 늦어도 오래갑니다.',
    편인: '이해하기 어려운 사람, 남과 다른 사람에게 끌립니다. 상대의 세계를 들여다보느라 정작 내 마음을 말하지 못합니다.',
    정인: '나를 편안하게 해 주는 사람, 어른스러운 사람에게 끌립니다. 보호받는 느낌을 사랑으로 느끼는 자리입니다.'
  };

  /* 돈 새는 구멍 (기본 리포트 · 2027 리포트 공용) */
  function moneyLeaks(chart) {
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
  }

  /* ---------- 심층 풀이 본문 ---------- */
  function hasBatchim(w) {
    const ch = String(w).trim().slice(-1).charCodeAt(0);
    return ch >= 0xAC00 && ch <= 0xD7A3 && (ch - 0xAC00) % 28 !== 0;
  }
  function josa(w, withC, withoutC) { return w + (hasBatchim(w) ? withC : withoutC); }

  function deepRead(chart) {
    const dm = chart.dayMaster;
    const dIdx = ELEMENTS.indexOf(dm.elem);
    const GROUPS = ['비겁', '식상', '재성', '관성', '인성'];
    const relName = el => GROUPS[((ELEMENTS.indexOf(el) - dIdx) + 5) % 5];
    const elOf = r => ELEMENTS[(dIdx + GROUPS.indexOf(r)) % 5];
    const c = chart.counts, pct = chart.pct, g = chart.godGroups;
    const yong = chart.yongsin.elem, hee = chart.yongsin.hee;
    const L = LUCKY[yong];
    const H = ELEMENTS_HANJA;

    /* 나를 받쳐 주는 자리 / 쓰는 자리 */
    const sup = [], drain = [];
    [['year', '년주'], ['month', '월주'], ['day', '일주'], ['hour', '시주']].forEach(function (pair) {
      const p = chart.pillars[pair[0]]; if (!p) return;
      if (pair[0] !== 'day') {
        const rs = relName(p.stemElem);
        (rs === '비겁' || rs === '인성' ? sup : drain).push(pair[1] + ' ' + p.stemName + '(' + p.stemElem + ')');
      }
      const rb = relName(p.branchElem);
      (rb === '비겁' || rb === '인성' ? sup : drain).push(pair[1] + ' ' + p.branchName + '(' + p.branchElem + ')');
    });
    const top = arr => arr.slice(0, 3).join(' · ');

    const strengthBody = chart.strength === 'strong'
      ? '밀어붙이는 힘이 세고 내 판단을 끝까지 가져가려는 마음이 강합니다. 반대로 도움을 청하는 데 인색해, 혼자 다 짊어지다 결정적인 순간에 힘이 빠지는 일이 생깁니다.'
      : chart.strength === 'weak'
        ? '혼자 밀면 쉽게 지치지만 사람과 환경이 받쳐 주면 두세 배의 결과가 나옵니다. 이 사주의 운은 늘 \'누구와 함께하느냐\'에서 갈립니다.'
        : '크게 치솟지도 가라앉지도 않아 오래 버티는 힘이 있습니다. 대신 스스로 강한 자극을 걸어야 판이 커지는 사주입니다.';

    const nature = [
      '일간 ' + dm.hanja + '(' + dm.ko + ') ' + dm.elem + ' — ' + ELEM_DEEP[dm.elem].name + '의 기운으로 태어났습니다. 여덟 글자에서 나를 받쳐 주는 쪽은 ' + top(sup) + ', 나를 쓰는 쪽은 ' + top(drain) + '입니다. 이 배치로 기운은 ' + chart.strengthKo + '(' + chart.strengthRatio + '%)입니다. ' + strengthBody +
      ' 월지 ' + chart.pillars.month.branchName + '(' + chart.pillars.month.branchKo + ')의 자리는 ' + chart.stages.month + ' — ' + STAGE_DEEP[chart.stages.month] + '.',
      (function () {
        const strongEl = ELEMENTS.slice().sort((a, b) => pct[b] - pct[a])[0];
        const thinEl = ELEMENTS.slice().sort((a, b) => pct[a] - pct[b])[0];
        const yy = chart.yinyang;
        return '오행은 ' + ELEMENTS.map(el => el + ' ' + pct[el] + '%').join(', ') + '로 놓여 있습니다. ' + strongEl + ' 기운이 가장 두터운데, 이 기운은 ' + ELEM_DEEP[strongEl].gift + '입니다. 다만 넘치면 ' + ELEM_DEEP[strongEl].over + '. ' +
          (chart.missing.length ? thinEl + ' 기운이 아예 비어 있어 ' : thinEl + ' 기운이 ' + pct[thinEl] + '%로 가장 얇아 ') + ELEM_DEEP[thinEl].lack + '. ' +
          '음양은 양 ' + yy.yangPct + '% · 음 ' + yy.yinPct + '%로 ' + (yy.yangPct >= 65 ? '행동이 생각보다 앞서는 사람입니다. 몸이 먼저 나가고 마음이 뒤따라옵니다.' : yy.yinPct >= 65 ? '생각과 감정이 먼저 움직이는 사람입니다. 안에서 정리된 뒤에야 밖으로 나옵니다.' : '행동과 생각의 속도가 비슷해 판단이 흔들리지 않습니다.') + '';
      })(),
      '이 사주의 중심은 ' + yong + '(' + H[ELEMENTS.indexOf(yong)] + ')입니다. ' + chart.yongsin.reason + '. 일상에서는 색으로 ' + L.color + ', 맛으로 ' + L.taste + ', 방향으로 ' + L.dir + ', 시간으로는 ' + josa(L.time, '을', '를') + ' 권합니다. 옷과 소품, 식탁, 책상 배치, 약속 시간까지 이 결로 맞춰 보세요. 일로는 ' + ELEM_DEEP[yong].job + ' 쪽이 물이 잘 흐르는 길입니다. 희신 ' + hee + '도 함께 쓰면 좋은데, 결정을 내릴 때 ' + yong + '·' + hee + ' 기운이 강한 사람을 곁에 두면 판단이 흔들리지 않습니다. ' + chart.yongsin.care + '.'
    ];

    /* ---- 재물 ---- */
    const jae = elOf('재성');
    const posMap = {
      년주: '년주에 앉은 재성은 집안과 초년의 배경에서 돈의 감각을 물려받았다는 표시입니다.',
      월주: '월주에 앉은 재성은 사회와 직장이라는 판이 곧 수입의 바닥이 된다는 표시입니다.',
      일주: '일주에 앉은 재성은 내 손으로 직접 만지고 결정할 때 돈이 늘어난다는 표시입니다.',
      시주: '시주에 앉은 재성은 부업과 노후의 자리에 재물이 있다는 표시로, 뒤로 갈수록 두터워집니다.'
    };
    const jaePos = [];
    [['year', '년주'], ['month', '월주'], ['day', '일주'], ['hour', '시주']].forEach(function (pair) {
      const p = chart.pillars[pair[0]]; if (!p) return;
      if (p.stemElem === jae || p.branchElem === jae) jaePos.push(pair[1]);
    });
    let moneyP1;
    if (g.재성 === 0) moneyP1 = '재성이 여덟 글자 안에 하나도 없습니다. 이는 돈이 없다는 뜻이 아니라, 돈이 직접 들어오는 통로가 원국에 새겨지지 않았다는 뜻입니다. 재성은 내가 만든 결과물이 지나가며 남기는 자리이므로, 이 사주는 만들고 파는 일을 먼저 해야 돈이 붙습니다.';
    else if (g.재성 >= 3) moneyP1 = '재성이 ' + g.재성 + '개로 겹쳐 있습니다. 돈이 보이는 창구가 여러 개라는 뜻이라 기회는 많지만, 손도 함께 커져 들어온 만큼 나가는 구조가 되기 쉽습니다.';
    else if (chart.strength === 'strong') moneyP1 = '재성 ' + g.재성 + '개에 신강한 몸입니다. 벌수록 담을 수 있는 그릇이라 돈이 들어와도 감당할 힘이 있습니다. 문제는 벌이가 아니라 지키는 장치입니다.';
    else if (chart.strength === 'weak') moneyP1 = '재성 ' + g.재성 + '개인데 몸은 신약합니다. 눈앞의 돈은 보이는데 혼자 쥐려 하면 몸과 시간이 먼저 상하는 그릇입니다. 손으로 붙잡기보다 통장과 사람에게 맡기는 방식이 맞습니다.';
    else moneyP1 = '재성 ' + g.재성 + '개가 중화된 몸에 놓였습니다. 한 번에 크게 벌기보다 한 우물을 오래 파서 두툼해지는 그릇입니다.';
    if (jaePos.length) moneyP1 += ' ' + (posMap[jaePos[0]] || '');
    moneyP1 += ' 이 사주에서 재성은 ' + jae + '(' + H[ELEMENTS.indexOf(jae)] + ')이고, 일지 ' + chart.pillars.day.branchName + '의 ' + chart.gods.dayBranch + '이 돈을 다루는 방식입니다.';

    const channels = [
      ['식상', g.식상, '기술과 콘텐츠로 만들어 파는 일이 주된 길입니다 — 글·영상·강의·제작·요리처럼 결과물이 남는 수입이 여기서 나옵니다.', '글·영상·강의·제작처럼 결과물이 남는 수입이 나오는 자리'],
      ['관성', g.관성, '조직과 자격이 만드는 안정이 주된 길입니다 — 월급·계약·평가가 재물의 바닥을 받쳐 줍니다.', '월급·계약·평가가 재물의 바닥을 받쳐 주는 자리'],
      ['비겁', g.비겁, '사람이 곧 매출인 사주입니다 — 영업·중개·모임·동업에서 돈이 붙습니다.', '영업·중개·모임·동업에서 돈이 붙는 자리'],
      ['인성', g.인성, '지식과 자산이 재물이 되는 사주입니다 — 자격·부동산·문서·브랜드가 쌓여 돈이 됩니다.', '자격·부동산·문서·브랜드가 쌓여 돈이 되는 자리']
    ].sort((a, b) => b[1] - a[1]);
    const moneyP2 = '이 사주로 돈이 들어오는 길은 ' + channels[0][0] + '(' + channels[0][1] + '개)과 ' + channels[1][0] + '(' + channels[1][1] + '개)입니다. ' + channels[0][2] + ' ' + josa('두 번째 길인 ' + channels[1][0], '은', '는') + ' ' + channels[1][3] + '입니다. ' +
      (g.식상 >= 2 ? '특히 만들고 내놓는 일을 미루지 마세요. 이 사주는 완성도보다 먼저 내놓는 쪽이 돈이 됩니다.' : '새 수입원을 만들 때는 이미 손에 익은 일에서 한 걸음만 확장하세요. 낯선 분야는 이 사주에서 오래 가지 못합니다.');

    const leak = moneyLeaks(chart)[0];
    const moneyP3 = '돈이 새는 첫 번째 구멍은 \'' + leak.title + '\'입니다. ' + leak.why + '. ' + leak.fix;
    const moneyTips = [
      '들어온 돈의 10%를 손대지 않는 계좌로 먼저 옮기세요. 이 사주는 남는 돈을 모으는 방식이 아니라 먼저 떼어 두는 방식이 통합니다.',
      '큰 지출은 하루를 묵혀 결정하세요. 그 하루가 새는 돈을 막습니다.'
    ];
    if (g.비겁 >= 2) moneyTips.push('지인과의 동업·보증·공동 결제는 금액과 날짜를 문서로 남기세요. 이 사주에서 가장 크게 새는 자리입니다.');
    else moneyTips.push('새 수입원은 하나만 여세요. 두 개를 동시에 벌이면 둘 다 어설퍼집니다.');
    if (g.재성 >= 3) moneyTips.push('수입이 늘어난 달에는 생활비를 먼저 고정하세요. 재성이 많은 사주는 수입만큼 지출도 같이 늘어납니다.');
    else moneyTips.push('월급·정산일 다음 날에 고정비를 한 장에 적어 보세요. 이 사주는 보이는 순간 지출이 줄어듭니다.');

    /* ---- 일·직장 ---- */
    let style;
    if (g.관성 >= 2 && g.인성 >= 2) style = { key: '조직·전문직형', text: '조직 안에서 자격과 경력으로 자리를 넓히는 사주입니다. 공무·공공·금융·의료·법률·교육처럼 자격이 곧 신뢰가 되는 판에서 오래 갑니다. 함부로 자리를 버리면 재물의 발판도 함께 사라지니, 옮길 때는 반드시 다음 자격을 먼저 확보하세요.' };
    else if (g.식상 >= 2 && g.재성 >= 2) style = { key: '만들어 파는 사업형', text: '내가 만든 것을 시장에 내놓을 때 성과가 나는 사주입니다. 콘텐츠·제작·유통·서비스처럼 만드는 사람과 파는 사람이 한 몸이 되는 일이 맞습니다. 다만 혼자 다 하려 하면 몸이 먼저 지치니, 결제와 배송 같은 반복 업무는 사야 합니다.' };
    else if (g.식상 >= 2) style = { key: '제작·기획형', text: '기획하고 만들고 설명하는 일에서 힘이 나는 사주입니다. 기획·마케팅·교육·콘텐츠·디자인이 맞고, 정해진 틀을 그대로 반복하는 자리는 당신을 지치게 합니다. 성과를 숫자로 남기는 습관을 들이면 대우가 빠르게 달라집니다.' };
    else if (g.관성 >= 2) style = { key: '조직·관리형', text: '책임과 규율이 힘이 되는 사주입니다. 관리·운영·영업관리·총무처럼 사람과 일정을 정리하는 자리에서 신뢰를 얻습니다. 다만 평가를 지나치게 의식해 하고 싶은 말을 삼키면 승진의 문이 늦게 열립니다.' };
    else if (g.비겁 >= 2) style = { key: '자립·영업형', text: '내 힘으로 판을 여는 사주입니다. 영업·중개·프리랜서·동업처럼 내 이름이 걸린 일에서 강합니다. 다만 혼자 결정하는 습관이 커지면 협업이 어려워지니, 성과 배분을 처음에 글로 정해 두세요.' };
    else style = { key: '균형·운영형', text: '한쪽으로 치우치지 않아 어떤 판에도 무리 없이 적응하는 사주입니다. 다만 강한 무기가 하나는 있어야 대우가 따라오니, 가장 잘하는 일 하나를 골라 3년을 파세요.' };
    const workP1 = '이 사주는 ' + style.key + '에 가깝습니다 — 관성 ' + g.관성 + ' · 식상 ' + g.식상 + ' · 재성 ' + g.재성 + ' · 인성 ' + g.인성 + ' · 비겁 ' + g.비겁 + '의 배치가 그렇게 말합니다. ' + style.text;
    const workP2 = '사회로 나가는 자리인 월지 ' + chart.pillars.month.branchName + '의 십성은 ' + chart.gods.monthBranch + ' — ' + josa(GOD_SIT[chart.gods.monthBranch].sit, '으로', '로') + ', 12운성으로는 ' + josa(chart.stages.month, '이라', '라') + ' ' + STAGE_DEEP[chart.stages.month] + '. 일지 ' + chart.pillars.day.branchName + '의 ' + josa(chart.gods.dayBranch, '은', '는') + ' 내가 일을 대하는 방식입니다 — ' + josa(GOD_SIT[chart.gods.dayBranch].scene, '을', '를') + ' 자연스럽게 여긴다는 뜻이고, 반대로 ' + GOD_SIT[chart.gods.dayBranch].risk + '이 반복되면 일이 두 배로 늘어납니다.';
    const workP3 = chart.strength === 'weak'
      ? '지금 당장의 창업은 권하지 않습니다. 이 사주는 혼자 버티는 힘이 약해, 준비 없이 나가면 몸과 자금이 동시에 빠집니다. 대신 재직 중에 부업으로 6개월 검증하세요. 기준은 하나면 충분합니다 — 본업 월급의 30%를 부업으로 세 번 연속 벌어 보는 것. 그 기준을 넘기면 그때 나가도 늦지 않습니다.'
      : '결정권이 있는 자리로 옮기는 것이 맞습니다. 이 사주는 남의 지시만 받는 자리에 오래 있으면 기운이 새고, 책임을 맡으면 오히려 단단해집니다. 다만 사람을 크게 쓰는 확장은 한 박자 늦추세요 — 매출보다 인건비가 먼저 늘어나는 순간이 가장 위험합니다.';
    const workTips = [
      '이직을 생각한다면 지금은 조건을 모으는 단계로 쓰세요. 연봉 숫자보다 3년 뒤의 자리를 보세요.',
      '한 가지 성과를 문서로 남기세요. 이 사주는 말보다 기록이 평가를 바꿉니다.',
      '윗사람과의 관계를 한 번 정리하세요. 이 사주는 윗사람과의 인연이 곧 승진의 문입니다.',
      '사표는 감정이 아니라 날짜로 정하세요. 감정으로 던진 사표가 이 사주에서 가장 비싼 실수입니다.'
    ];

    /* ---- 연애·관계 ---- */
    const partnerGroup = chart.input && chart.input.gender === 'female' ? '관성' : '재성';
    const partnerEl = elOf(partnerGroup);
    const pn = g[partnerGroup];
    const pPos = [];
    [['year', '년주'], ['month', '월주'], ['day', '일주'], ['hour', '시주']].forEach(function (pair) {
      const p = chart.pillars[pair[0]]; if (!p) return;
      if (p.stemElem === partnerEl || p.branchElem === partnerEl) pPos.push(pair[1]);
    });
    const loveP1 = '배우자궁인 일지 ' + chart.pillars.day.branchName + '(' + chart.pillars.day.branchKo + ')에 ' + josa(chart.gods.dayBranch, '이', '가') + ' 앉았습니다. ' + LOVE_SIT[chart.gods.dayBranch] + ' 여기에 12운성 ' + chart.stages.day + '이 겹쳐 ' + STAGE_DEEP[chart.stages.day] + '.';
    const loveP2 = (pn === 0
      ? '이 사주는 ' + partnerGroup + '이 비어 있어 인연이 저절로 굴러 들어오는 통로가 없습니다. 대신 소개·모임·일을 통해 만나야 하고, 그 자리에서 먼저 이름을 남기는 쪽이 유리합니다.'
      : '이 사주에서 인연은 ' + partnerGroup + '(' + pn + '개)으로 들어옵니다' + (pPos.length ? ' — ' + pPos.join(' · ') + '에 앉아 있어 ' + (partnerGroup === '재성' ? '내가 챙기고 표현할 때 관계가 깊어집니다' : '상대가 나를 선택하는 쪽으로 관계가 시작됩니다') : '') + '. ' + (partnerGroup === '재성' ? '다만 조건을 재는 인상이 비치면 상대의 마음이 먼저 닫히니, 물질적 표현보다 시간을 쓰세요.' : '다만 책임을 앞세우면 상대가 부담을 느끼니, 가벼운 대화의 자리를 먼저 만드세요.'));
    const sal = chart.sinsal;
    const hasDohwa = ['year', 'month', 'day', 'hour'].some(k => sal[k] && sal[k].indexOf('도화') >= 0);
    const hasYeokma = ['year', 'month', 'day', 'hour'].some(k => sal[k] && sal[k].indexOf('역마') >= 0);
    const hasHwagae = ['year', 'month', 'day', 'hour'].some(k => sal[k] && sal[k].indexOf('화개') >= 0);
    const loveP3 = (hasDohwa ? '매력의 결에 도화(桃花)가 있습니다 — 처음 만난 사람도 먼저 말을 걸어 오고, 사람을 만나는 일에서 이 힘이 곧 무기입니다. ' : '도화(桃花)는 사주에 없습니다. 대신 ') + (hasYeokma ? '역마가 함께 있어 낯선 곳, 여행지, 새로 시작한 판에서 인연이 붙습니다. ' : '') + (hasHwagae ? '화개가 있어 혼자 깊어지는 시간이 필요하고, 그 시간이 사람을 끄는 힘이 됩니다. ' : '') + (chart.godGroups.식상 >= 2 ? '표현이 자연스러워 마음을 숨기지 못하고, 그 솔직함이 오히려 상대를 움직입니다.' : '감정을 아껴 표현하는 편이라 마음이 있어도 상대가 알아채기 어렵습니다. 마음이 있으면 한 번은 말로 꺼내세요.');
    const loveTips = [
      '먼저 연락하는 쪽이 되세요. 이 사주에서는 기다림보다 가벼운 안부가 효과적입니다.',
      '상대의 말보다 반복되는 행동을 보세요. 그 패턴이 관계의 답입니다.',
      '확신을 얻으려고 상대를 시험하는 말은 관계를 한 단계 뒤로 물립니다.'
    ];

    /* ---- 건강 ---- */
    const thinEl = ELEMENTS.slice().sort((a, b) => c[a] - c[b])[0];
    const strongEl = ELEMENTS.slice().sort((a, b) => c[b] - c[a])[0];
    const weakStages = [['년지', chart.stages.year], ['월지', chart.stages.month], ['일지', chart.stages.day]].concat(chart.stages.hour ? [['시지', chart.stages.hour]] : []).filter(s => ['병', '사', '묘', '절'].indexOf(s[1]) >= 0);
    const healthP1 = '몸의 약한 자리는 ' + thinEl + '(' + H[ELEMENTS.indexOf(thinEl)] + ') — ' + ELEM_DEEP[thinEl].organ + '입니다. ' + (chart.missing.indexOf(thinEl) >= 0 ? '이 오행이 아예 비어 있어 회복이 남보다 느린 자리입니다. ' : '가장 얇게 놓인 자리라 피로가 먼저 도착합니다. ') + '반대로 ' + strongEl + ' 기운이 넘쳐 ' + ELEM_DEEP[strongEl].over + '. ' + (weakStages.length ? weakStages[0][0] + '가 ' + weakStages[0][1] + ' 자리에 있어 그 자리의 기운이 상하기 쉽습니다 — ' + (weakStages[0][0] === '년지' ? '초년의 습관' : weakStages[0][0] === '월지' ? '사회생활' : weakStages[0][0] === '일지' ? '생활과 관계' : '노후와 부업') + '에서 무리가 쌓이면 몸으로 옵니다.' : '');
    const healthP2 = '이 사주의 회복법은 약이 아니라 순서입니다. ' + ELEM_DEEP[thinEl].care + '부터 시작해 보세요. ' + (thinEl === '수' ? '물을 자주, 조금씩. 잠들기 전 30분은 화면을 내려놓으세요.' : thinEl === '목' ? '아침 햇빛을 10분 쬐고, 몸을 옆으로 길게 늘이는 스트레칭을 하세요.' : thinEl === '화' ? '해가 있을 때 15분 걷고, 밤에는 방을 어둡게 두세요.' : thinEl === '토' ? '끼니를 거르지 말고, 식후 10분 걷기를 습관으로 두세요.' : '숨을 길게 쉬는 운동(걷기·수영)과 잠들기 전 방 정리가 이 사주의 보약입니다.') + ' 몸이 보내는 신호는 대개 ' + ELEM_DEEP[thinEl].organ + '에서 먼저 옵니다. 그 자리가 반복해서 아프면 사주 해석보다 진료가 먼저입니다.';
    const healthTips = [
      '잠자는 시간을 먼저 고정하고 나머지 일정을 맞추세요. 이 사주는 수면이 기본값입니다.',
      '증상이 반복되면 참지 말고 검진을 받으세요. 이 내용은 참고용입니다.',
      '카페인은 오후 2시 이후로 미루지 마세요. 이 사주는 밤의 각성이 다음 날 기운을 크게 깎습니다.',
      '한 달에 하루는 일정을 비우세요. 비운 날이 다음 달의 체력을 만듭니다.'
    ];

    const voice = {
      open: '여덟 글자를 다 세우고 한참 들여다봤습니다. 같은 날 태어나도 시진 하나로 다른 사람이 되는데, 이 사주는 ' + dm.elem + ' 일간에 ' + chart.strengthKo + '한 뼈대가 먼저 눈에 들어옵니다. 급한 마음에 결론부터 궁금하시겠지만, 순서대로 가야 제대로 보입니다. 아래로 한 장씩 넘기면서 읽어 보세요.',
      money: '제가 사주를 볼 때 늘 드리는 말이 있습니다. 버는 법을 아는 사람은 많은데, 지키는 법을 아는 사람은 드물어요. 이 사주는 그 둘 사이에서 갈립니다. 통장 하나만 더 파세요. 이름 붙여서, 손대지 않는 계좌로요. 그거 하나로 1년 뒤가 달라집니다.',
      work: '일 이야기는 늘 조심스럽습니다. 사주가 대신 결정해 줄 수는 없으니까요. 다만 한 가지만 말씀드리면, 이 사주는 남이 정해 준 자리에 오래 있으면 병이 납니다. 지금 자리에서 결정권을 하나라도 더 쥐어 보세요. 그게 이직보다 먼저입니다.',
      love: '연애는 사주보다 사람이 먼저입니다. 그래도 이 사주를 보면 늘 같은 자리에서 넘어지더군요. 좋아하는 마음을 아끼다가 때를 놓치는 것. 다음에 마음이 가는 사람이 생기면, 한 번은 먼저 말해 보세요. 그 한마디가 이 사주의 숙제를 풉니다.',
      health: '몸은 거짓말을 안 합니다. 사주에서 약한 자리는 대개 스무 살 무렵부터 신호를 보내는데, 젊어서는 그걸 무시하고 삽니다. 지금부터라도 잠을 먼저 챙기세요. 다른 건 다 미뤄도 잠은 못 미룹니다.'
    };

    return {
      nature: nature,
      voice: voice,
      money: { paras: [moneyP1, moneyP2, moneyP3], tips: moneyTips, voice: voice.money },
      work: { paras: [workP1, workP2, workP3], tips: workTips, voice: voice.work },
      love: { paras: [loveP1, loveP2, loveP3], tips: loveTips, voice: voice.love },
      health: { paras: [healthP1, healthP2], tips: healthTips, voice: voice.health },
      style: style.key,
      yong: yong, hee: hee, thinEl: thinEl, strongEl: strongEl
    };
  }

  /* ---------- 공개 API ---------- */
  const api = {
    STEMS, STEMS_KO, BRANCHES, BRANCHES_KO, ELEMENTS, ELEMENTS_HANJA, ELEMENT_COLOR,
    TEN_GODS, STAGES, TERMS, MONTH_NAMES, MONTH_NAMES_KO, GOD_GROUP, LUCKY, HOUR_RANGE, SINSAL,
    jdn, toJD, sunLongitude, jdToDate, findTermJD, formatTermTime,
    newMoonJD, jdnToYmd, lunarToSolar, solarToLunar, lunarLeapMonths, lunarYearMonths, SIZI_NAMES,
    buildChart, getToday, describeDay, todayReading, tenGod, relation, stageOf, hash,
    deepRead, moneyLeaks, josa, ELEM_DEEP, GOD_SIT, STAGE_DEEP, REL_SIT, LOVE_SIT,
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
    // 음력 변환 (한국천문연구원 음양력 기준과 대조한 값)
    const l1 = lunarToSolar(1995, 8, 15, false);
    check('음력 1995-08-15 → 양력', l1.y + '-' + l1.m + '-' + l1.d, '1995-9-9');
    const l2 = lunarToSolar(2026, 1, 1, false);
    check('음력 2026-01-01 → 양력(설날)', l2.y + '-' + l2.m + '-' + l2.d, '2026-2-17');
    const l3 = lunarToSolar(2027, 8, 15, false);
    check('음력 2027-08-15 → 양력(추석)', l3.y + '-' + l3.m + '-' + l3.d, '2027-9-15');
    const l4 = lunarToSolar(2025, 6, 1, true);
    check('음력 2025 윤6-01 → 양력', l4.y + '-' + l4.m + '-' + l4.d, '2025-7-25');
    check('2025 윤달', lunarLeapMonths(2025).join(','), '6');
    check('2027 윤달 없음', lunarLeapMonths(2027).length, 0);
    const lr = solarToLunar(1995, 9, 9);
    check('양력 1995-09-09 → 음력', lr.m + '-' + lr.d, '8-15');
    const c6 = buildChart({ year: 1995, month: 8, day: 15, hour: 12, calendar: 'lunar' });
    check('음력 1995-08-15 건 사주(양력 9/9과 동일)', c6.pillars.day.hanja, buildChart({ year: 1995, month: 9, day: 9, hour: 12 }).pillars.day.hanja);
    return out;
  };

})(typeof window !== 'undefined' ? window : globalThis);
