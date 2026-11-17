/* ============================================================
   월하사주 · saju-plus.js
   - 정밀 궁합: 두 사람의 사주팔자 8글자씩(총 16글자) 비교
   - 10년 대운: 대운수·순역행·10년 간지·십성·12운성
   - 2027 길일: 목적별(계약·이직·이사) 일진 길흉 추출
   ※ 의존: saju-engine.js, saju-2027.js (2027 월지 계산에만 사용)
   ============================================================ */
(function (global) {
  'use strict';

  const E = global.SajuEngine;
  const ELEM = E.ELEMENTS;                 // ['목','화','토','금','수']
  const STEMS = E.STEMS, BRANCHES = E.BRANCHES;
  const STEMS_KO = E.STEMS_KO, BRANCHES_KO = E.BRANCHES_KO;
  const ANIMALS = ['쥐', '소', '범', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  const SIZI = ['자시', '축시', '인시', '묘시', '진시', '사시', '오시', '미시', '신시', '유시', '술시', '해시'];

  /* ---------- 천간·지지 관계 ---------- */
  const STEM_COMBINE = { 0: 5, 5: 0, 1: 6, 6: 1, 2: 7, 7: 2, 3: 8, 8: 3, 4: 9, 9: 4 }; // 甲己 乙庚 丙辛 丁壬 戊癸
  const STEM_COMBINE_NAME = { 0: '甲己合土', 5: '甲己合土', 1: '乙庚合金', 6: '乙庚合金', 2: '丙辛合水', 7: '丙辛合水', 3: '丁壬合木', 8: '丁壬合木', 4: '戊癸合火', 9: '戊癸合火' };
  const STEM_CLASH = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3 };                    // 甲庚 乙辛 丙壬 丁癸

  const CLASH = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
  const COMBINE = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const HARM = [7, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9, 8];
  const BREAK = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2];
  const HYUNG = [[0, 3], [1, 7], [1, 10], [7, 10], [2, 5], [2, 8], [5, 8], [4, 4], [6, 6], [9, 9], [11, 11]];
  const SAMHAP = [
    { code: '수', branches: [8, 0, 4], name: '申子辰 수국' },
    { code: '화', branches: [2, 6, 10], name: '寅午戌 화국' },
    { code: '금', branches: [5, 9, 1], name: '巳酉丑 금국' },
    { code: '목', branches: [11, 3, 7], name: '亥卯未 목국' }
  ];
  const CHEONEUL = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];

  function isHyung(a, b) {
    return HYUNG.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
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
  function samhapGroupOf(b) {
    for (let i = 0; i < SAMHAP.length; i++) if (SAMHAP[i].branches.indexOf(b) >= 0) return SAMHAP[i];
    return null;
  }
  function sameSamhap(a, b) {
    const g = samhapGroupOf(a);
    return !!g && g.branches.indexOf(b) >= 0 && a !== b;
  }
  function branchesOf(chart) {
    const p = chart.pillars;
    return [p.year.branch, p.month.branch, p.day.branch].concat(p.hour ? [p.hour.branch] : []);
  }
  function timeLabel(chart) {
    const h = chart.input.hour;
    if (h === null || h === undefined || h === '') return '시간 모름';
    const br = Math.floor((((+h + (+chart.input.minute || 0) / 60) + 0.5) % 24) / 2) % 12;
    return SIZI[br] + ' (' + (E.HOUR_RANGE[br] || '') + ')';
  }
  function monthRange(year, month) {
    return new Date(year, month, 0).getDate();
  }
  function addMonths(y, m, d, add) {
    const base = new Date(y, m - 1, d);
    const ty = y + Math.floor((m - 1 + add) / 12);
    const tm = ((m - 1 + add) % 12 + 12) % 12 + 1;
    const last = monthRange(ty, tm);
    return { y: ty, m: tm, d: Math.min(base.getDate(), last) };
  }
  function dateFromTerm(t) { return new Date(Date.UTC(t.y, t.m - 1, t.d, t.h || 0, t.mi || 0)); }

  /* ============================================================
     1) 정밀 궁합 — 두 사람 8글자씩 16글자
     ============================================================ */
  const CP_TEXT = {
    gab: {
      head: '두 사람의 일간이 천간합(天干合)으로 묶였습니다',
      body: '일간끼리 합을 한다는 건, 처음 만난 자리에서 이미 서로의 말투와 속도가 맞아떨어지는 사주입니다. 한 사람이 말을 꺼내기 전에 다른 사람이 고개를 끄덕이는 사이예요. 다만 합은 둘이 한 덩어리가 되는 자리라, 한쪽이 지나치게 맞춰 주다가 속이 상하는 일이 생깁니다. 그럴 때는 “나는 이게 좀 불편해”를 늦지 않게 말해 주세요. 이 사주는 그 한마디면 다시 붙습니다.',
      short: '일간합 — 말투와 속도가 처음부터 맞는 사이'
    },
    chung: {
      head: '두 사람의 일간이 천간충(天干沖)으로 부딪힙니다',
      body: '일간이 충을 하면 서로가 서로를 자극합니다. 좋게 말하면 서로를 깨우는 사이, 나쁘게 말하면 같은 자리에서 계속 부딪히는 사이입니다. 이 관계는 편안함보다 자극으로 오래 갑니다. 대신 말이 날카로워지는 순간이 잦으니, 다툼이 시작되면 결론을 그날 내려고 하지 마세요. 하루를 두고 다시 말하면 이 사주의 충은 오히려 관계를 단단하게 만듭니다.',
      short: '일간충 — 자극으로 끌리는 대신 말이 세지는 사이'
    },
    same: {
      head: '두 사람의 일간이 같은 글자입니다',
      body: '일간이 같다는 건 거울을 마주 보는 사주입니다. 상대의 표정을 읽는 속도가 빠르고, 설명하지 않아도 아는 부분이 많습니다. 그만큼 서로의 약점도 정확히 알고, 기분이 상하면 똑같은 방식으로 삐칩니다. 한 사람이 먼저 “지금 내가 예민한 거 알아”라고 말해 주면 이 관계는 금이 가지 않습니다.',
      short: '같은 일간 — 거울처럼 닮아 편하지만 같이 삐치는 사이'
    },
    saeng: {
      head: '한 사람의 기운이 다른 사람을 살립니다',
      body: '일간의 오행이 상생으로 이어집니다. 한 사람이 밀고 나가면 다른 사람이 받아 키우는 구조라, 함께 있으면 일이 굴러갑니다. 살리는 쪽이 늘 내주고 사는 쪽이 늘 받으면 한쪽만 지치니, 받는 사람이 먼저 “고맙다”를 말하는 습관을 들이면 이 사주는 오래갑니다.',
      short: '오행 상생 — 한 사람이 다른 사람을 키워 주는 사이'
    },
    geuk: {
      head: '두 사람의 기운이 서로를 제어합니다',
      body: '일간의 오행이 극(剋)으로 맞물립니다. 끌림은 분명한데, 생활의 속도와 돈 쓰는 방식이 달라 부딪히기 쉬운 사주입니다. 이 관계는 “너는 왜 그래”를 “너는 그렇구나”로 바꾸는 데서 판이 뒤집힙니다. 상대를 내 기준으로 고치려는 순간이 이 사주가 가장 크게 흔들리는 자리입니다.',
      short: '오행 상극 — 끌리지만 기준이 달라 조율이 필요한 사이'
    },
    bi: {
      head: '두 사람의 기운이 같은 방향을 봅니다',
      body: '일간의 오행이 같아 취향과 생활 리듬이 비슷합니다. 같이 있으면 편하고 결정이 빠릅니다. 다만 둘 다 같은 자리에서 물러서지 않으면 그 자리에서 오래 막힙니다. 한 사람이 “이번엔 네 말대로”를 먼저 꺼내는 것만으로 판이 풀립니다.',
      short: '같은 오행 — 취향이 맞아 편하게 가는 사이'
    }
  };

  const JI_TEXT = {
    합: '일지끼리 육합(六合)했습니다. 일지는 부부의 자리라, 두 사람이 한집에 살면 생활의 리듬이 빨리 맞습니다. 잠자는 시간, 밥 먹는 시간, 돈을 쓰는 감각이 자연스럽게 겹칩니다. 이런 사주는 오래 떨어져 있으면 오히려 마음이 식으니, 자주 얼굴을 보고 사는 편이 관계에 낫습니다.',
    충: '일지끼리 충(沖)합니다. 부부의 자리가 부딪히는 사주라 같이 살면 사소한 생활 습관에서 마찰이 생깁니다. 대신 이 충은 “한 곳에 오래 못 있는 힘”이라, 두 사람이 여행과 이동을 자주 하면 오히려 관계가 좋아집니다. 같은 집에 살더라도 각자의 방과 시간을 꼭 두세요.',
    형: '일지끼리 형(刑)합니다. 가까울수록 서로를 눌러 대는 자리라, 말이 서운하게 나가는 순간이 생깁니다. 이 사주는 감정이 올라올 때 말을 반 박자 늦추는 것만으로 절반이 해결됩니다. 특히 돈과 가족 문제는 그 자리에서 결론 내지 마세요.',
    파: '일지끼리 파(破)합니다. 맺은 약속이 중간에 어긋나는 자리라, 두 사람 사이에 일정과 돈이 걸린 일은 문자로 남겨 두는 편이 안전합니다. 대신 이 파는 “묶인 것을 풀어내는 힘”이기도 해서, 서로의 답답한 부분을 말로 풀면 오히려 가벼워집니다.',
    해: '일지끼리 해(害)합니다. 말과 마음이 어긋나 서운함이 쌓이는 자리입니다. 이 사주는 참는 쪽이 손해를 봅니다. 작은 서운함도 그날 말로 꺼내는 습관을 들이면 해의 작용은 거의 사라집니다.',
    복음: '일지가 같은 글자입니다. 생활 방식이 닮아 편하지만, 둘 다 고집이 같은 방향으로 서면 물러서는 사람이 없습니다. 한 사람이 먼저 밖으로 나가 바람을 쐬고 오는 것만으로 판이 풀립니다.',
    반합: '일지가 같은 삼합(三合)의 반쪽입니다. 정식 합은 아니어도 방향이 같아, 함께 있으면 일이 자연스럽게 굴러갑니다. 두 사람이 같은 취미나 같은 목표를 하나 두면 이 반합이 완성됩니다.',
    무관: '일지끼리 특별한 합도 충도 없습니다. 나쁜 사주는 아니고, 관계의 온도가 두 사람의 노력에 따라 정해지는 사주입니다. 서로의 생활 시간을 존중하는 것만으로 오래갑니다.'
  };

  function compatScore(A, Bc) {
    const aStem = A.dayMaster.stem, bStem = Bc.dayMaster.stem;
    const aEl = ELEM.indexOf(A.dayMaster.elem), bEl = ELEM.indexOf(Bc.dayMaster.elem);
    const aJi = A.pillars.day.branch, bJi = Bc.pillars.day.branch;

    let score = 56;
    const parts = [];

    /* 일간 */
    let ganKey;
    if (STEM_COMBINE[aStem] === bStem) { score += 12; ganKey = 'gab'; parts.push({ k: '일간합', v: '+12' }); }
    else if (STEM_CLASH[aStem] === bStem) { score -= 12; ganKey = 'chung'; parts.push({ k: '일간충', v: '-12' }); }
    else if (aStem === bStem) { score += 3; ganKey = 'same'; parts.push({ k: '같은 일간', v: '+3' }); }
    else {
      const r = E.relation(aEl, bEl);
      if (r === '식상') { score += 7; ganKey = 'saeng'; parts.push({ k: '일간 상생', v: '+7' }); }
      else if (r === '재성') { score += 5; ganKey = 'geuk'; parts.push({ k: '일간 재성', v: '+5' }); }
      else if (r === '관성') { score += 4; ganKey = 'geuk'; parts.push({ k: '일간 관성', v: '+4' }); }
      else if (r === '인성') { score += 6; ganKey = 'saeng'; parts.push({ k: '일간 인성', v: '+6' }); }
      else { score += 1; ganKey = 'bi'; parts.push({ k: '같은 오행', v: '+1' }); }
    }

    /* 일지 */
    const jr = relOf(aJi, bJi);
    let jiKey;
    if (jr.indexOf('합') >= 0) { score += 14; jiKey = '합'; parts.push({ k: '일지 육합', v: '+14' }); }
    else if (jr.indexOf('충') >= 0) { score -= 12; jiKey = '충'; parts.push({ k: '일지 충', v: '-12' }); }
    else if (jr.indexOf('형') >= 0) { score -= 6; jiKey = '형'; parts.push({ k: '일지 형', v: '-6' }); }
    else if (jr.indexOf('파') >= 0) { score -= 5; jiKey = '파'; parts.push({ k: '일지 파', v: '-5' }); }
    else if (jr.indexOf('해') >= 0) { score -= 4; jiKey = '해'; parts.push({ k: '일지 해', v: '-4' }); }
    else if (jr.indexOf('복음') >= 0) { score += 3; jiKey = '복음'; parts.push({ k: '일지 복음', v: '+3' }); }
    else if (sameSamhap(aJi, bJi)) { score += 9; jiKey = '반합'; parts.push({ k: '일지 반합', v: '+9' }); }
    else { jiKey = '무관'; }

    /* 16글자 지지 관계 총람 (일지끼리는 위에서 이미 봤으므로 제외) */
    const aBr = branchesOf(A), bBr = branchesOf(Bc);
    const allBr = aBr.concat(bBr);
    const tally = { 합: 0, 충: 0, 형: 0, 파: 0, 해: 0, 반합: 0 };
    aBr.forEach((x, xi) => bBr.forEach((y, yi) => {
      if (xi === 2 && yi === 2) return;
      const r = relOf(x, y);
      let hit = false;
      r.forEach(t => { if (tally[t] !== undefined) { tally[t] += 1; hit = true; } });
      if (!hit && sameSamhap(x, y)) tally['반합'] += 1;
    }));
    const samhapDone = SAMHAP.filter(g => g.branches.every(x => allBr.indexOf(x) >= 0));
    let tallyPts = Math.min(tally['합'] * 2 + tally['반합'] * 1.5, 9);
    tallyPts -= Math.min(tally['충'] * 2.5, 10);
    tallyPts -= Math.min(tally['형'] * 1.2, 5);
    tallyPts -= Math.min((tally['파'] + tally['해']) * 1, 4);
    if (samhapDone.length) tallyPts += 7;
    score += Math.round(tallyPts);
    if (Math.round(tallyPts) !== 0) parts.push({ k: '지지 관계', v: (Math.round(tallyPts) > 0 ? '+' : '') + Math.round(tallyPts) });

    /* 서로에게 필요한 오행 */
    const aNeedY = A.yongsin.elem, aNeedH = A.yongsin.hee;
    const bNeedY = Bc.yongsin.elem, bNeedH = Bc.yongsin.hee;
    const helperOf = el => ELEM[(ELEM.indexOf(el) + 4) % 5];   // 그 오행을 살리는 기운(수생목)
    const toB = Math.round((Bc.pct[aNeedY] || 0) + (Bc.pct[aNeedH] || 0) * 0.6 + (Bc.pct[helperOf(aNeedY)] || 0) * 0.3);
    const toA = Math.round((A.pct[bNeedY] || 0) + (A.pct[bNeedH] || 0) * 0.6 + (A.pct[helperOf(bNeedY)] || 0) * 0.3);
    const fillPts = Math.max(-6, Math.min(9, Math.round((toB - 18) * 0.45))) +
      Math.max(-6, Math.min(9, Math.round((toA - 18) * 0.45)));
    score += fillPts;
    if (fillPts !== 0) parts.push({ k: '오행 보완', v: (fillPts > 0 ? '+' : '') + fillPts });

    return {
      score: Math.max(34, Math.min(98, Math.round(score))),
      ganKey: ganKey, jiRel: jr, jiKey: jiKey,
      tally: tally, samhap: samhapDone,
      fill: {
        aNeed: aNeedY, aNeedHee: aNeedH, bHasA: Bc.pct[aNeedY] || 0, bHasAhee: Bc.pct[aNeedH] || 0,
        bNeed: bNeedY, bNeedHee: bNeedH, aHasB: A.pct[bNeedY] || 0, aHasBhee: A.pct[bNeedH] || 0
      },
      parts: parts
    };
  }

  function gradeOf(score) {
    if (score >= 92) return { key: 'soul', label: '천생연분', line: '두 사람의 여덟 글자가 서로를 거의 다 받아 주는 드문 자리' };
    if (score >= 84) return { key: 'great', label: '손잡으면 오래 가는 인연', line: '부딪히는 자리보다 맞물리는 자리가 훨씬 많은 사주' };
    if (score >= 75) return { key: 'good', label: '잘 맞는 인연', line: '노력이 그대로 쌓이는 사주 — 시간이 편으로 서는 관계' };
    if (score >= 66) return { key: 'ok', label: '맞춰 가면 좋아지는 인연', line: '다른 점이 많지만 그 다른 점이 서로의 빈자리를 채우는 사주' };
    if (score >= 57) return { key: 'mid', label: '다른 결의 두 사람', line: '끌림은 있으나 생활의 속도를 맞추는 일이 먼저인 사주' };
    return { key: 'low', label: '시간이 필요한 인연', line: '서로의 결이 달라 이해가 먼저 서야 하는 사주' };
  }

  function marriageYears(A, Bc, fromYear, toYear) {
    const out = [];
    for (let y = fromYear; y <= toYear; y++) {
      const i = ((y - 1984) % 60 + 60) % 60;
      const ys = i % 10, yb = i % 12;
      const each = [A, Bc].map(ch => {
        const spouseGroup = ch.input.gender === 'female' ? '관성' : '재성';
        const g = E.tenGod(ch.dayMaster.stem, ys);
        const grp = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' }[g];
        let s = 0;
        if (grp === spouseGroup) s += 10;
        const r = relOf(ch.pillars.day.branch, yb);
        if (r.indexOf('합') >= 0) s += 10;
        else if (sameSamhap(ch.pillars.day.branch, yb)) s += 6;
        else if (r.indexOf('충') >= 0) s -= 8;
        else if (r.indexOf('형') >= 0) s -= 4;
        return s;
      });
      const tot = each[0] + each[1];
      out.push({ year: y, hanja: STEMS[ys] + BRANCHES[yb], ko: STEMS_KO[ys] + BRANCHES_KO[yb], a: each[0], b: each[1], total: tot });
    }
    return out.sort((x, y) => y.total - x.total);
  }

  function buildCompat(A, Bc, opts) {
    opts = opts || {};
    const nowYear = new Date().getFullYear();
    const sc = compatScore(A, Bc);
    const grade = gradeOf(sc.score);
    const cp = CP_TEXT[sc.ganKey];
    const jt = JI_TEXT[sc.jiKey] || JI_TEXT['무관'];
    const aName = A.input.name || '나', bName = Bc.input.name || '상대';
    const aOwn = A.input.name ? A.input.name + ' 님' : '나';
    const bOwn = Bc.input.name ? Bc.input.name + ' 님' : '상대';
    const aSubj = A.input.name ? A.input.name + ' 님이' : '내가';
    const bSubj = Bc.input.name ? Bc.input.name + ' 님이' : '상대가';
    const aJi = A.pillars.day, bJi = Bc.pillars.day;
    const aEl = A.dayMaster.elem, bEl = Bc.dayMaster.elem;

    /* 오행 보완 문장 */
    const fill = sc.fill;
    let fillText;
    if (fill.bHasA >= 20) fillText = '상대의 사주에 ' + aOwn + '에게 필요한 ' + fill.aNeed + '(' + { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' }[fill.aNeed] + ') 기운이 넉넉히 있습니다. ' + aSubj + ' 혼자 할 때 막히던 일이 이 사람과 함께하면 풀리는 이유가 여기에 있습니다.';
    else if (fill.bHasA >= 12) fillText = '상대의 사주에도 ' + aOwn + '에게 필요한 ' + fill.aNeed + ' 기운이 조금 있습니다. 결정적인 도움은 아니지만, ' + aSubj + ' 지칠 때 곁에서 숨을 고르게 해 주는 정도는 됩니다.';
    else fillText = '상대의 사주에 ' + aOwn + '에게 필요한 ' + fill.aNeed + ' 기운은 많지 않습니다. ' + aOwn + '에게 필요한 기운은 이 사람이 아니라 생활에서 채워야 합니다 — ' + (fill.aNeed === '목' ? '아침 산책과 새로 시작하는 취미' : fill.aNeed === '화' ? '햇빛을 쬐는 시간과 사람을 만나는 자리' : fill.aNeed === '토' ? '규칙적인 끼니와 익숙한 공간' : fill.aNeed === '금' ? '정리와 마감, 그리고 단호한 거절' : '물가를 걷는 시간과 충분한 잠') + '이 두 사람 사이에서 ' + (A.input.name ? A.input.name + ' 님을' : '나를') + ' 지켜 줍니다.';
    if (fill.aHasB >= 20) fillText += ' 반대로 ' + bOwn + '도 ' + aOwn + '에게서 ' + fill.bNeed + ' 기운을 받고 있습니다. 서로에게 필요한 것을 주고받는, 드문 짝입니다.';
    else if (fill.aHasB < 12) fillText += ' ' + bOwn + '에게 필요한 ' + fill.bNeed + ' 기운도 ' + aOwn + '에게서 크게 나오지는 않습니다. 그래서 두 사람 모두 상대에게 모든 걸 기대하지 않는 편이 오래갑니다.';

    /* 속궁합 — 일지·오행 온도 */
    const jiElA = aJi.branchElem, jiElB = bJi.branchElem;
    let bedText;
    if (sc.jiRel.indexOf('합') >= 0) bedText = '일지가 합을 하니 살결의 온도와 생활의 리듬이 빨리 맞습니다. 이 사주는 말보다 몸이 먼저 가까워지는 사이이고, 잠자리에서 정한 것이 다음 날에도 그대로 남습니다. 다만 익숙해지는 속도가 빨라 설렘을 관리하지 않으면 2~3년 뒤 무뎌지기 쉬우니, 한 달에 한 번은 둘만의 자리를 새로 만드세요.';
    else if (sc.jiRel.indexOf('충') >= 0) bedText = '일지가 충을 하니 끌림이 강한 대신 리듬이 자주 어긋납니다. 한 사람이 원할 때 다른 사람은 지쳐 있는 날이 많습니다. 이 사주는 눈치로 맞추려 하면 서운함이 쌓입니다. “오늘은 피곤해”를 서운함 없이 말할 수 있는 사이가 되는 것이 이 관계의 속궁합을 살리는 길입니다.';
    else if (sc.jiRel.indexOf('형') >= 0) bedText = '일지가 형을 하니 가까울수록 서로를 조이는 자리입니다. 애정이 강한 만큼 표현이 투정으로 나가기 쉽습니다. 이 사주는 잠자리 앞에서 그날의 서운함을 꺼내지 않는 규칙 하나만 세워도 관계가 부드러워집니다.';
    else bedText = '일지에 큰 합도 충도 없어 두 사람의 온도는 서로가 만드는 대로 갑니다. ' + (jiElA === jiElB ? '두 사람 모두 ' + jiElA + '의 결이라 같은 온도에서 편안함을 느낍니다.' : '한 사람은 ' + jiElA + ', 다른 사람은 ' + jiElB + '의 결이라 온도가 다릅니다. 서로의 속도를 재지 말고 물어보는 편이 훨씬 낫습니다.') + (jiElA === '수' || jiElB === '수' ? ' 특히 물의 결이 섞여 있어 감정이 깊어지면 말수가 줄어드니, 침묵을 서운함으로 읽지 마세요.' : ' 특히 불의 결이 섞여 있어 감정이 올라오면 말이 앞서니, 그 순간엔 안고 있는 편이 낫습니다.');

    /* 결혼 시기 */
    const my = marriageYears(A, Bc, nowYear + 1, nowYear + 6);
    const best = my.slice(0, 3).filter(x => x.total > 0);
    const marriageText = best.length
      ? best.map(x => '<b>' + x.year + '년(' + x.hanja + ')</b> — ' + (x.total >= 16 ? '두 사람의 배우자 자리가 함께 열리는 해입니다. 이 해에 약속을 정하면 오래 갑니다.' : x.total >= 10 ? '한 사람의 인연의 문이 확실히 열리고 다른 사람도 무리는 아닌 해입니다.' : '한쪽이 조금 더 준비되어 있는 해입니다. 이 해에 대화를 시작해 두면 다음 해가 편합니다.')).join(' ')
      : '향후 7년 안에 두 사람의 배우자 자리가 동시에 크게 열리는 해는 뚜렷하지 않습니다. 그래서 이 사주는 날짜보다 “지금 함께 있는 시간”이 결혼을 만듭니다. 서두르지 않아도 됩니다.';

    /* 다툼·화해 달 */
    const months = (global.SAJU_2027 && global.SAJU_2027.months) ? global.SAJU_2027.months() : [];
    const fightM = [], peaceM = [];
    months.forEach(m => {
      const r1 = relOf(aJi.branch, m.branch), r2 = relOf(bJi.branch, m.branch);
      const bad = r1.indexOf('충') >= 0 || r2.indexOf('충') >= 0 || r1.indexOf('형') >= 0 || r2.indexOf('형') >= 0;
      const good = (r1.indexOf('합') >= 0 || r2.indexOf('합') >= 0) && !bad;
      if (bad) fightM.push(m.no);
      if (good) peaceM.push(m.no);
    });
    const fightText = fightM.length
      ? '2027년에는 ' + fightM.map(n => n + '월').join(' · ') + '에 두 사람의 부부 자리가 흔들립니다. 이 달에는 이사·계약·큰 지출처럼 판을 바꾸는 결정을 겹쳐 두지 마세요. 같은 달에 두 가지가 겹치면 사소한 말이 크게 번집니다.'
      : '2027년에는 두 사람의 부부 자리를 직접 치는 달이 없습니다. 대신 말이 앞서는 달을 스스로 조심하면 됩니다.';
    const peaceText = peaceM.length
      ? '반대로 ' + peaceM.map(n => n + '월').join(' · ') + '에 두 사람 사이의 문이 열립니다. 이 달에 미뤄 둔 이야기를 꺼내면 대개 부드럽게 풀립니다. 특히 화해가 필요한 일이 있다면 이 달의 낮 시간을 쓰세요.'
      : '2027년에는 두 사람의 일지가 같이 합하는 달이 뚜렷하지 않습니다. 그래서 이 사주는 날을 기다리기보다 먼저 말을 꺼내는 쪽이 이깁니다.';

    /* 핵심 케미 3줄 */
    const chem = [];
    chem.push({ t: '일간', d: cp.short + ' (' + aJi.stemName + aEl + ' · ' + bJi.stemName + bEl + ')' });
    chem.push({ t: '일지 (' + aJi.branchName + '·' + bJi.branchName + ')', d: { 합: '부부 자리가 육합 — 생활의 리듬이 빨리 맞습니다', 충: '부부 자리가 충 — 가까울수록 부딪히고, 떨어져 있으면 그리운 사이', 형: '부부 자리가 형 — 가까울수록 조이지만 정은 깊은 사이', 파: '부부 자리가 파 — 약속이 어긋나기 쉬워 문서로 남기는 사이', 해: '부부 자리가 해 — 서운함을 쌓으면 멀어지는 사이', 복음: '부부 자리가 같음 — 취향이 닮아 편한 사이', 반합: '부부 자리가 반합 — 방향이 같아 함께 굴러가는 사이', 무관: '부부 자리에 큰 합충 없음 — 두 사람이 만드는 사이' }[sc.jiKey] });
    chem.push({ t: '오행', d: fill.bHasA >= 20 ? '상대가 내게 필요한 ' + fill.aNeed + ' 기운을 채워 줍니다' : (fill.aHasB >= 20 ? '내가 상대에게 필요한 ' + fill.bNeed + ' 기운을 줍니다' : '서로의 빈 기운은 생활에서 따로 채워야 합니다') });

    const crossText = (function () {
      const t = sc.tally;
      const bits = [];
      if (t['합']) bits.push('합 ' + t['합'] + '자리');
      if (t['충']) bits.push('충 ' + t['충'] + '자리');
      if (t['형']) bits.push('형 ' + t['형'] + '자리');
      if (t['파'] + t['해']) bits.push('파·해 ' + (t['파'] + t['해']) + '자리');
      let s = bits.length ? '두 사람의 여덟 글자를 마주 세워 지지끼리 짝을 지어 보면 ' + bits.join(', ') + '가 나옵니다. ' : '두 사람의 여덟 글자를 마주 세워 보면 지지끼리 크게 부딪히는 자리는 없습니다. ';
      if (sc.samhap.length) s += '게다가 두 사람의 지지를 합치면 ' + sc.samhap.map(g => g.name).join(', ') + '이 완성됩니다. 이건 두 사람이 함께 있을 때 각자 혼자일 때보다 큰일을 해낼 수 있는 구조라는 뜻입니다. ';
      else s += '그래서 이 관계는 판이 크게 흔들리기보다 두 사람이 만드는 속도만큼 갑니다. ';
      return s;
    })();

    return {
      score: sc.score, grade: grade, chem: chem, parts: sc.parts, tally: sc.tally,
      a: A, b: Bc, names: { a: aName, b: bName },
      say: {
        open: '두 사람의 여덟 글자를 나란히 세워 놓고 한참 봤습니다. 궁합은 좋고 나쁨을 가르는 게 아니라, 두 사람이 어디서 부딪히고 어디서 편해지는지를 미리 짚어 두는 일입니다. 아래부터 하나씩 말씀드릴게요.',
        gan: cp.head + '. ' + cp.body,
        ji: jt,
        cross: crossText,
        bed: bedText,
        fill: fillText,
        marriage: marriageText,
        fight: fightText,
        peace: peaceText
      },
      fightMonths: fightM, peaceMonths: peaceM,
      marriageYears: my.slice(0, 3)
    };
  }

  /* ============================================================
     2) 10년 대운
     ============================================================ */
  const DECADE = {
    비견: { key: '내 이름으로 서는 10년', money: '돈은 같이 벌고 같이 나누는 자리에 들어옵니다. 동업·공동 프로젝트가 열리지만, 배분을 처음에 글로 남기지 않으면 그 돈이 사람을 상하게 합니다.', work: '남 밑에 있기 답답해지는 시기입니다. 내 이름을 걸고 하는 일, 작게라도 내 몫의 결정권이 있는 자리로 옮겨 가기 좋습니다.', life: '이 10년은 몸이 곧 자본입니다. 사람을 많이 만나느라 잠을 줄이면 다음 대운에 그 값이 옵니다.' },
    겁재: { key: '나누고 지키는 법을 배우는 10년', money: '돈이 들어오는 만큼 나가는 길도 함께 열립니다. 보증·동업·큰 지출이 겹치는 시기라, 통장을 하나 분리해 두는 것만으로 결과가 달라집니다.', work: '경쟁이 붙는 시기입니다. 남과 같은 판에서 겨루기보다 내가 잘하는 한 가지를 더 깊게 파는 쪽이 이깁니다.', life: '이 10년에 사람을 잘못 고르면 10년이 흔들립니다. 돈이 오가는 자리의 사람은 천천히 보세요.' },
    식신: { key: '내가 만든 것이 밖으로 나가는 10년', money: '기술·콘텐츠·요리·돌봄처럼 손으로 만든 것이 수입이 됩니다. 벌이가 안정적이니 저축 비율을 정해 두면 이 시기에 자산이 한 번 뜁니다.', work: '표현과 결과물이 평가받는 시기입니다. 직장 안에서도 내 이름이 붙는 일을 하나 만들어 두세요.', life: '편안함이 이 시기의 복이자 함정입니다. 마감과 규칙을 스스로 정해 두지 않으면 좋은 흐름을 놓칩니다.' },
    상관: { key: '정해진 것을 뜯어고치는 10년', money: '아이디어로 돈을 만드는 시기입니다. 다만 벌이보다 씀씀이가 앞서기 쉬워, 수입의 30%는 손대지 않는 계좌로 먼저 옮기세요.', work: '기획·개선·발표에서 재능이 드러납니다. 조직에 오래 몸을 담그기보다 내 방식이 통하는 자리로 옮기는 편이 낫습니다.', life: '이 10년은 말이 관계를 만듭니다. 윗사람 앞에서 결론부터 말하는 습관 하나가 이 시기의 성패를 가릅니다.' },
    편재: { key: '판이 넓어지고 돈의 길이 열리는 10년', money: '큰돈이 움직이는 시기입니다. 새 거래·부업·투자처럼 한 번에 크게 가는 자리가 열리지만, 손에 쥔 돈은 그 자리에서 묶어야 남습니다.', work: '영업·사업·해외처럼 판을 넓히는 일이 어울립니다. 직장에 있더라도 외부와 닿는 일을 맡으세요.', life: '이 10년은 사람이 재물입니다. 다만 조건만 보고 만난 사람은 조건이 어긋나면 먼저 떠납니다.' },
    정재: { key: '쌓은 것이 숫자로 확인되는 10년', money: '꾸준한 벌이와 정산이 결과로 남는 시기입니다. 부동산·적금처럼 쌓이는 자산을 이때 잡아 두면 다음 대운이 편합니다.', work: '관리·재무·운영처럼 정확함이 평가받는 자리에 어울립니다. 승진보다 자리를 깊게 만드는 쪽이 유리합니다.', life: '안정이 최고의 복인 시기입니다. 다만 안정에 기대어 새 길을 미루면 10년 뒤에 그 값이 옵니다.' },
    편관: { key: '무거운 책임을 지고 버티는 10년', money: '돈이 크게 들어오기보다 지켜지는 시기입니다. 대출·보증·큰 결제는 이 10년 안에 몰지 마세요.', work: '평가와 압박이 몰리지만 버티면 인정이 남습니다. 특히 조직에서 책임 있는 자리를 맡으면 이 10년이 경력의 뼈대가 됩니다.', life: '몸이 먼저 신호를 보내는 시기입니다. 잠과 검진을 일정에 먼저 넣으세요. 이 10년의 건강이 다음 10년의 속도를 정합니다.' },
    정관: { key: '공식의 자리에서 이름이 오르는 10년', money: '조직·자격·평판이 재물의 발판이 됩니다. 크게 벌기보다 안정적으로 오르는 시기라, 자격과 직함에 투자하세요.', work: '승진·시험·계약·공직처럼 공식의 자리에서 결과가 나옵니다. 이 10년에 잡은 자리가 오래갑니다.', life: '남의 시선을 의식해 하고 싶은 말을 삼키는 시기입니다. 한 달에 한 번은 내 마음을 소리 내어 말하는 연습을 하세요.' },
    편인: { key: '안으로 들어가 다시 세우는 10년', money: '큰 벌이보다 정리와 절약이 재물을 지킵니다. 공부·자격에 쓴 돈이 5년 뒤 수입으로 돌아오는 시기입니다.', work: '전문성·연구·기술처럼 혼자 깊어지는 일이 어울립니다. 이 시기에 만든 결과물이 다음 대운의 명함이 됩니다.', life: '생각이 길어져 결정을 미루기 쉽습니다. 기한을 정해 두고 작게라도 시작하는 습관이 이 10년의 숙제입니다.' },
    정인: { key: '배움과 도움이 나를 키우는 10년', money: '부동산·지식·자격처럼 쌓이는 자산이 재물이 됩니다. 급하게 벌기보다 오래 가는 것을 고르세요.', work: '교육·상담·연구처럼 사람을 품는 자리에 어울립니다. 이 시기에 만난 어른 한 사람이 10년을 줄여 줍니다.', life: '받은 도움을 당연하게 여기면 이 시기의 복이 빠져나갑니다. 고맙다는 말을 자주 하는 사람이 이 대운을 다 씁니다.' }
  };

  const STAGE_ADJ = { 장생: 6, 목욕: -1, 관대: 5, 건록: 6, 제왕: 8, 쇠: -2, 병: -6, 사: -5, 묘: -3, 절: -7, 태: 1, 양: 2 };
  const GOD_ADJ = { 비견: 1, 겁재: -5, 식신: 4, 상관: 0, 편재: 3, 정재: 5, 편관: -3, 정관: 5, 편인: -4, 정인: 3 };

  function daeunScore(chart, stemEl, branchEl, stage, stemGod, branchGod) {
    const yong = chart.yongsin.elem, hee = chart.yongsin.hee;
    const helper = ELEM[(ELEM.indexOf(yong) + 4) % 5];      // 용신을 살리는 기운
    const strongest = ELEM.slice().sort((x, y) => (chart.pct[y] || 0) - (chart.pct[x] || 0))[0];
    let s = 52;
    [stemEl, branchEl].forEach(el => {
      if (el === yong) s += 9;
      else if (el === hee) s += 5;
      else if (el === helper) s += 3;
      else if (el === strongest) s -= 4;
    });
    s += STAGE_ADJ[stage] || 0;
    s += (GOD_ADJ[stemGod] || 0) + Math.round((GOD_ADJ[branchGod] || 0) * 0.6);
    return Math.max(24, Math.min(96, Math.round(s)));
  }

  function buildDaeun(chart, opts) {
    opts = opts || {};
    const input = chart.input;
    const gender = input.gender || 'male';
    const yearStem = chart.pillars.year.stem;
    const yang = !E.stemIsYin(yearStem);
    const forward = (yang && gender === 'male') || (!yang && gender === 'female');
    const dirText = forward ? '순행(順行)' : '역행(逆行)';
    const dirWhy = (yang ? '양(陽)' : '음(陰)') + '의 해에 태어난 ' + (gender === 'female' ? '여성' : '남성') + '이라 대운이 ' + (forward ? '앞으로' : '뒤로') + ' 흐릅니다';

    /* 대운수 — 절입까지의 날수 3일=1년. 음력 입력도 양력 생일로 셈한다 */
    const bY = input.solarYear || input.year, bM = input.solarMonth || input.month, bD = input.solarDay || input.day;
    const bH = (input.hour === null || input.hour === undefined || input.hour === '') ? 12 : +input.hour;
    const bMi = +input.minute || 0;
    const birth = new Date(Date.UTC(bY, bM - 1, bD, bH, bMi));
    const prevTerm = chart.month.startAt ? dateFromTerm(chart.month.startAt) : null;
    const nextTerm = chart.month.nextAt ? dateFromTerm(chart.month.nextAt) : null;
    let days = 0;
    if (forward && nextTerm) days = (nextTerm - birth) / 86400000;
    else if (!forward && prevTerm) days = (birth - prevTerm) / 86400000;
    if (!isFinite(days) || days <= 0) days = 3;
    const totalMonths = Math.max(1, Math.round(days * 4));   // 1일 = 4개월
    const suYears = Math.floor(totalMonths / 12), suMonths = totalMonths % 12;
    const suText = suYears + '년 ' + suMonths + '개월';

    const mIdx = chart.pillars.month.index;
    const list = [];
    for (let k = 1; k <= 8; k++) {
      const idx = ((mIdx + (forward ? k : -k)) % 60 + 60) % 60;
      const stem = idx % 10, branch = idx % 12;
      const startAdd = totalMonths + (k - 1) * 120;
      const start = addMonths(bY, bM, bD, startAdd);
      const end = addMonths(bY, bM, bD, startAdd + 120);
      const stemGod = E.tenGod(chart.dayMaster.stem, stem);
      const branchGod = E.tenGod(chart.dayMaster.stem, E.branchMainStem(branch));
      const stage = E.stageOf(chart.dayMaster.stem, branch);
      const stemEl = E.stemElem(stem), branchEl = E.branchElem(branch);
      const score = daeunScore(chart, stemEl, branchEl, stage, stemGod, branchGod);
      list.push({
        no: k, stem: stem, branch: branch,
        hanja: STEMS[stem] + BRANCHES[branch], ko: STEMS_KO[stem] + BRANCHES_KO[branch],
        stemKo: STEMS_KO[stem], branchKo: BRANCHES_KO[branch],
        stemEl: stemEl, branchEl: branchEl,
        stemGod: stemGod, branchGod: branchGod, stage: stage,
        ageFrom: start.y - bY + 1, ageTo: start.y - bY + 10,
        yearFrom: start.y, yearTo: end.y,
        startLabel: start.y + '.' + (start.m < 10 ? '0' + start.m : start.m),
        score: score,
        favorite: (stemEl === chart.yongsin.elem || branchEl === chart.yongsin.elem) ? 'yong'
          : (stemEl === chart.yongsin.hee || branchEl === chart.yongsin.hee) ? 'hee' : ''
      });
    }

    const now = new Date();
    const nowAge = now.getFullYear() - bY + 1;
    let current = null;
    list.forEach(d => { if (nowAge >= d.ageFrom && nowAge <= d.ageTo) current = d; });

    const hasYong = list.some(d => d.favorite === 'yong');
    const hasHee = list.some(d => d.favorite === 'hee');
    const goldScore = d => d.score + (d.ageFrom >= 25 && d.ageFrom <= 59 ? 8 : d.ageFrom >= 60 && d.ageFrom <= 69 ? 2 : 0);
    const ranked = list.slice().sort((x, y) => goldScore(y) - goldScore(x));
    const golden = ranked.slice(0, 2).sort((x, y) => x.ageFrom - y.ageFrom);
    const caution = list.slice().sort((x, y) => x.score - y.score)[0];
    const goldenNote = hasYong
      ? '이 사주는 내게 필요한 ' + chart.yongsin.elem + ' 기운이 대운에 직접 들어오는 10년이 있습니다. 그 10년이 인생의 황금기입니다.'
      : hasHee
        ? '내게 필요한 ' + chart.yongsin.elem + ' 기운이 대운에 직접 오지는 않지만, 이를 도와주는 ' + chart.yongsin.hee + ' 기운이 들어오는 10년이 있습니다. 그 시기가 힘이 실리는 황금기입니다.'
        : '이 사주는 큰 기운이 대운에서 크게 터지지 않는 구조입니다. 그래서 황금기는 “기운이 몰려오는 때”가 아니라 “내가 쌓은 것이 힘을 받는 때”입니다. 아래 표에서 형(刑)과 십성이 가장 좋은 자리를 황금기로 잡았습니다.';

    function line(d) {
      const dec = DECADE[d.stemGod] || DECADE['비견'];
      const yongHit = d.favorite === 'yong' ? '이 10년에는 내게 필요한 ' + chart.yongsin.elem + ' 기운이 대운에 들어옵니다. ' + (d.stage === '제왕' || d.stage === '건록' || d.stage === '관대' ? '여기에 힘의 자리까지 겹쳐, 미뤄 둔 일을 이 안에 밀어붙이면 됩니다.' : '기운이 도와주니 혼자 버티지 말고 사람과 자리를 함께 쓰세요.') : d.favorite === 'hee' ? '내 편에 서 주는 ' + chart.yongsin.hee + ' 기운이 들어오는 10년입니다. 결정적인 도움은 아니지만 버티는 힘이 붙습니다.' : '이 10년은 내게 필요한 기운이 크게 들어오지는 않습니다. 새로 벌이기보다 지키고 다지는 쪽이 남습니다.';
      return {
        key: d.stemGod + ' 대운 · ' + dec.key,
        money: dec.money,
        work: dec.work,
        life: dec.life,
        flow: (E.STAGE_DEEP[d.stage] || '') + '. ' + yongHit
      };
    }

    const open = '대운은 10년마다 바뀌는 큰 물길입니다. ' + dirWhy + '. 대운수가 ' + suText + '이라 ' + list[0].yearFrom + '년 ' + list[0].ageFrom + '세부터 첫 대운이 열리고, 이 표의 마지막 대운이 ' + list[list.length - 1].yearTo + '년에 끝납니다. 지금은 ' + (current ? current.ageFrom + '세~' + current.ageTo + '세의 ' + current.hanja + ' 대운, ' + line(current).key + ' 안에 있습니다.' : '첫 대운이 열리기 전이라 아직 부모와 환경의 그릇 안에 있는 시기입니다.');

    return {
      forward: forward, dirText: dirText, dirWhy: dirWhy,
      su: { years: suYears, months: suMonths, text: suText, days: Math.round(days * 10) / 10 },
      list: list, current: current, golden: golden, caution: caution,
      nowAge: nowAge, open: open, goldenNote: goldenNote, hasYong: hasYong, hasHee: hasHee,
      say: (d) => line(d)
    };
  }

  /* ============================================================
     3) 2027 길일 (계약·이직·이사)
     ============================================================ */
  const HANJA_EL = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
  const GOD_GOOD = { 정재: '정재일', 정관: '정관일', 식신: '식신일', 편재: '편재일', 정인: '정인일' };
  const JIK = ['建', '除', '滿', '平', '定', '執', '破', '危', '成', '收', '開', '閉'];
  const JIK_KO = { 建: '건', 除: '제', 滿: '만', 平: '평', 定: '정', 執: '집', 破: '파', 危: '위', 成: '성', 收: '수', 開: '개', 閉: '폐' };
  const JIK_LUCK = { 除: 3, 滿: 2, 定: 4, 成: 5, 開: 4 };
  const JIK_RISK = { 破: 5, 危: 2, 閉: 3 };
  /* 황도(黃道) 12신 — 월지마다 청룡이 서는 지지가 정해져 있다 */
  const HWANG_START = [8, 10, 0, 2, 4, 6, 8, 10, 0, 2, 4, 6];   // 子→申 丑→戌 寅→子 …
  const SIN_NAME = ['청룡', '명당', '천형', '주작', '금궤', '천덕', '백호', '옥당', '천뢰', '현무', '사명', '구진'];
  const SIN_GOOD = [0, 1, 4, 5, 7, 10];                          // 청룡·명당·금궤·천덕·옥당·사명
  const TIPS = {
    contract: [
      '도장은 오전 11시에서 오후 1시 사이, 해가 가장 높은 때에 찍으세요. 이 시간대가 서류의 기운을 가장 곧게 세웁니다.',
      '계약서에 금액과 날짜를 손으로 한 번 더 적어 두세요. 이 사주는 숫자를 눈으로 확인할 때 실수를 막습니다.',
      '상대가 서두르게 하면 그 자리에서 한 번 멈추세요. 좋은 날일수록 서두르는 쪽이 손해를 봅니다.'
    ],
    job: [
      '면접은 오전 10시~11시에 잡으세요. 이 사주는 하루가 길어질수록 말이 무거워집니다.',
      '첫 질문에 결론부터 말하세요. 이 사주의 강점은 설명이 아니라 단정입니다.',
      '입사 서류는 하루 전에 다 끝내 두세요. 당일 준비는 이 사주에게 늘 발목을 잡습니다.'
    ],
    move: [
      '이삿날은 오전에 시작해 해가 지기 전에 마무리하세요. 밤에 들어가는 이사는 이 사주에 남는 기운이 좋지 않습니다.',
      '새집 문을 열 때 가장 먼저 불을 켜고 물을 한 번 끓이세요. 새 자리에 화(火)와 수(水)를 먼저 들이는 순서입니다.',
      '개업이라면 첫 손님을 맞기 전에 금전함 자리를 정하고, 그 자리만은 나중에 옮기지 마세요.'
    ]
  };

  function dayIndex60(y, m, d) {
    return ((E.jdn(y, m, d) - 2433191) % 60 + 60) % 60;
  }

  function buildGilil(chart, year, opts) {
    opts = opts || {};
    year = year || 2027;
    const dayStem = chart.dayMaster.stem, dayBranch = chart.pillars.day.branch;
    const yong = chart.yongsin.elem, hee = chart.yongsin.hee;
    const cheoneul = CHEONEUL[dayStem];
    const groups = { contract: [], job: [], move: [], risk: [] };

    const yearStart = dayIndex60(year, 1, 1);
    for (let m = 1; m <= 12; m++) {
      const last = monthRange(year, m);
      for (let d = 1; d <= last; d++) {
        const idx = dayIndex60(year, m, d);
        const stem = idx % 10, branch = idx % 12;
        const stemEl = E.stemElem(stem), branchEl = E.branchElem(branch);
        const gs = E.tenGod(dayStem, stem);
        const gb = E.tenGod(dayStem, E.branchMainStem(branch));
        const jr = relOf(dayBranch, branch);
        const half = sameSamhap(dayBranch, branch);
        const tags = [];
        let luck = 0;

        /* 절기월 · 12직(建除) · 황도일 */
        const lam = E.sunLongitude(E.toJD(year, m, d, 12) - 9 / 24);
        const mBranch = (2 + Math.floor(((((lam - 315) + 360) % 360)) / 30)) % 12;
        const jik = JIK[((branch - mBranch) % 12 + 12) % 12];
        const sinIdx = ((branch - HWANG_START[mBranch]) % 12 + 12) % 12;
        const sin = SIN_NAME[sinIdx];
        luck += JIK_LUCK[jik] || 0;
        const jikBad = JIK_RISK[jik] || 0;
        if (sinIdx === 0) tags.push('청룡황도일');
        else if (SIN_GOOD.indexOf(sinIdx) >= 0) tags.push('황도일');
        if (SIN_GOOD.indexOf(sinIdx) >= 0) luck += 4;

        if (cheoneul.indexOf(branch) >= 0) { tags.push('천을귀인일'); luck += 10; }
        if (jr.indexOf('합') >= 0) { tags.push('일지 육합'); luck += 9; }
        else if (half) { tags.push('일지 반합'); luck += 7; }
        if (branchEl === yong) { tags.push('용신일'); luck += 8; }
        else if (branchEl === hee) { tags.push('희신일'); luck += 4; }
        if (stemEl === yong) luck += 5;
        else if (stemEl === hee) luck += 2;
        if (GOD_GOOD[gs]) tags.push(GOD_GOOD[gs]);
        if (GOD_GOOD[gb] && tags.indexOf(GOD_GOOD[gb]) < 0) tags.push('지지 ' + GOD_GOOD[gb]);

        const bad = [];
        let risk = 0;
        if (jr.indexOf('충') >= 0) { bad.push('일지 충일'); risk += 10; }
        if (gs === '상관' && (gb === '정관' || gb === '편관')) { bad.push('상관견관일'); risk += 8; }
        if (gs === '겁재') { bad.push('겁재일'); risk += 4; }
        if (jr.indexOf('형') >= 0) { bad.push('일지 형일'); risk += 3; }
        if (jr.indexOf('파') >= 0) { bad.push('일지 파일'); risk += 4; }
        if (jr.indexOf('해') >= 0) { bad.push('일지 해일'); risk += 2; }
        if (jikBad) { bad.push(JIK_KO[jik] + '일'); risk += jikBad; }
        if (sin === '천형' || sin === '주작' || sin === '백호') risk += 3;

        const base = 44;
        const contract = base + luck + (gs === '정재' ? 7 : gs === '정관' ? 6 : gs === '식신' ? 4 : gs === '편재' ? 3 : 0)
          + (gb === '정재' ? 4 : gb === '정관' ? 3 : 0) - (gs === '상관' && (gb === '정관' || gb === '편관') ? 16 : 0)
          - (gs === '겁재' ? 9 : 0) - (jr.indexOf('충') >= 0 ? 18 : 0) - (jr.indexOf('형') >= 0 ? 8 : 0)
          - (jr.indexOf('파') >= 0 ? 10 : 0) - (jr.indexOf('해') >= 0 ? 5 : 0) - jikBad * 2;
        const job = base + luck + (gs === '정관' ? 9 : gs === '편관' ? 4 : 0)
          + (gb === '정관' ? 4 : 0) - (gs === '상관' ? 6 : 0) - (gs === '겁재' ? 6 : 0)
          - (jr.indexOf('충') >= 0 ? 14 : 0) - (jr.indexOf('형') >= 0 ? 7 : 0) - (jr.indexOf('파') >= 0 ? 7 : 0) - jikBad;
        const move = base + luck + (gs === '식신' ? 7 : gs === '편재' ? 6 : gs === '정재' ? 4 : 0)
          - (jr.indexOf('충') >= 0 ? 13 : 0) - (jr.indexOf('형') >= 0 ? 8 : 0) - (jr.indexOf('파') >= 0 ? 10 : 0)
          - (jr.indexOf('해') >= 0 ? 5 : 0) - jikBad * 2;

        const day = {
          y: year, m: m, d: d, idx: idx, stem: stem, branch: branch,
          hanja: STEMS[stem] + BRANCHES[branch], ko: STEMS_KO[stem] + BRANCHES_KO[branch],
          animal: ANIMALS[branch], tags: tags, bad: bad, luck: luck, risk: risk,
          jik: jik, jikKo: JIK_KO[jik], sin: sin, mBranch: mBranch,
          contract: Math.max(0, Math.min(100, contract)),
          job: Math.max(0, Math.min(100, job)),
          move: Math.max(0, Math.min(100, move)),
          weekday: ['일', '월', '화', '수', '목', '금', '토'][new Date(year, m - 1, d).getDay()]
        };
        ['contract', 'job', 'move'].forEach(k => groups[k].push(day));
        groups.risk.push(day);
      }
    }

    function pick(list, key, n) {
      const usedM = {}, usedG = {};
      const out = [];
      let floor = 66;
      const sorted = list.slice().sort((a, b) => (b[key] - a[key]) || (a.m - b.m) || (a.d - b.d));
      while (out.length < n && floor >= 56) {
        sorted.forEach(d => {
          if (out.length >= n) return;
          if (d[key] < floor) return;
          if (usedM[d.m]) return;
          if ((usedG[d.hanja] || 0) >= 2) return;
          usedM[d.m] = 1; usedG[d.hanja] = (usedG[d.hanja] || 0) + 1;
          out.push(d);
        });
        floor -= 2;
      }
      return out.sort((a, b) => (a.m - b.m) || (a.d - b.d));
    }

    const picks = {
      contract: pick(groups.contract, 'contract', 3),
      job: pick(groups.job, 'job', 3),
      move: pick(groups.move, 'move', 3)
    };
    const avoid = (function () {
      const usedM = {}, usedR = {};
      const out = [];
      groups.risk.slice().sort((a, b) => (b.risk - a.risk) || (a.m - b.m)).forEach(d => {
        if (out.length >= 4) return;
        if (d.risk < 7) return;
        const r0 = d.bad[0] || '';
        if (usedM[d.m] || (usedR[r0] || 0) >= 2) return;
        usedM[d.m] = 1; usedR[r0] = (usedR[r0] || 0) + 1;
        out.push(d);
      });
      return out.sort((a, b) => (a.m - b.m) || (a.d - b.d));
    })();

    const monthStat = [];
    for (let m = 1; m <= 12; m++) {
      const all = groups.contract.filter(d => d.m === m);
      const good = all.filter(d => d.contract >= 68 || d.job >= 68 || d.move >= 68).length;
      const risky = all.filter(d => d.risk >= 7).length;
      monthStat.push({ m: m, good: good, risky: risky, days: all });
    }

    return {
      year: year, picks: picks, avoid: avoid, monthStat: monthStat, groups: groups,
      open: year + '년 달력을 내 여덟 글자에 하나씩 대 보았습니다. 좋은 날은 하늘과 땅의 글자가 내 일간·일지와 맞물려 힘이 실리는 날이고, 피할 날은 반대로 내 자리와 부딪히는 날입니다. 같은 계약이라도 어느 날 도장을 찍느냐에 따라 남는 것이 달라집니다.',
      tips: TIPS
    };
  }

  global.SAJU_PLUS = {
    buildCompat: buildCompat, buildDaeun: buildDaeun, buildGilil: buildGilil,
    relOf: relOf, addMonths: addMonths, timeLabel: timeLabel,
    SIZI: SIZI, DECADE: DECADE, TIPS: TIPS
  };
})(typeof window !== 'undefined' ? window : globalThis);
