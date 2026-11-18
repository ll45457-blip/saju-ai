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

  /* 달마다의 구체 장면 */
  const REL_SCENE = {
    충: '부딪혀 자리가 바뀌는 달입니다. 이사·이직·계약 변경처럼 판을 옮기는 일이 이 무렵 몰립니다.',
    합: '묶여 하나가 되는 달입니다. 사람과 거래가 맺어지고, 미뤄 둔 약속이 이때 성사됩니다.',
    형: '서로 눌리는 달입니다. 말과 서류에서 마찰이 생기고 가족·동료와의 감정이 올라옵니다.',
    파: '맺은 것이 깨지는 달입니다. 서명과 합의를 미루고 구두 약속은 남기지 마세요.',
    해: '말과 마음이 어긋나는 달입니다. 가까운 사람과의 오해가 생기니 얼굴을 보고 말하세요.',
    복음: '같은 기운이 겹치는 달입니다. 판단이 강해지는 대신 고집도 함께 세집니다.'
  };
  const MINE_SCENE = {
    충: '내 일지와 부딪히니 일정 변경과 이동이 생깁니다. 계약 날짜와 큰 결제는 이 달에 두지 마세요.',
    합: '내 일지와 합하니 사람을 만나고 약속을 잡기에 좋습니다. 이 달에 맺은 인연은 오래 갑니다.',
    형: '내 생활의 자리와 눌리니 가족·동거·가까운 사람과의 마찰이 올라옵니다. 말을 반 박자 늦추세요.',
    파: '내 자리가 흔들리는 달입니다. 이사·이별·약속 파기 같은 일이 생기면 감정보다 순서를 보세요.',
    해: '내 자리와 어긋나 혼자만 손해 보는 느낌이 드는 달입니다. 서운함을 쌓아 두지 말고 그때 말하세요.',
    복음: '내 일지와 같은 기운이 겹쳐 의욕과 고집이 함께 올라가는 달입니다. 결정을 하나로 좁히세요.'
  };

  /* 달마다의 생활 장면 — 십성에 따라 그 달에 실제로 벌어지는 일
     같은 사주 안에서 같은 십성이 두 번 오면 두 번째 달은 다른 장면을 쓴다(rank로 순환) */
  const MONTH_SCENE = {
    비견: [
      '같이 일하는 사람과 내 몫을 견주는 일이 생기는 달입니다. 회의에서 내가 낸 아이디어가 다른 사람 이름으로 정리되는 장면이 나오면, 그때가 이 달의 신호입니다.',
      '내 몫을 둘러싼 계산이 말로 드러나는 달입니다. “이건 누가 맡았지”가 나오면 그 자리에서 내가 한 일을 한 줄로 남기세요. 말로만 한 일은 이 달에 다른 사람 몫으로 정리되기 쉽습니다.'
    ],
    겁재: [
      '지인이 밥을 먹다 “요즘 뭐 벌어?” 하고 묻고, 그 자리에서 “같이 해 보자”는 말이 따라붙는 달입니다. 돈이 오가는 약속은 그 자리에서 금액을 정하세요.',
      '오랜 지인에게서 연락이 오고 그 끝에 돈 이야기가 붙는 달입니다. 함께 쓰는 자리에서는 먼저 금액을 말하는 쪽이 편합니다. 말하지 않고 넘긴 돈은 이 달에 돌아오지 않습니다.'
    ],
    식신: [
      '만들어 둔 초안을 처음으로 남에게 보여 주는 달입니다. 반응이 없어도 다음 편을 만들어야 이 달의 흐름을 살립니다.',
      '손에 익은 일이 갑자기 평가받는 달입니다. 누군가 내 물건이나 글을 보고 “이거 어떻게 했어?”라고 물으면 그때 정리해서 보여 주세요. 그 한 번이 다음 달의 일이 됩니다.'
    ],
    상관: [
      '회의에서 “이건 이렇게 하는 게 낫지 않나”가 목까지 올라오는 달입니다. 그 말을 짧게 하면 개선으로 남고, 길게 하면 관계가 긁힙니다.',
      '정해진 방식이 답답하게 느껴지는 달입니다. 위에서 정한 순서가 비효율적으로 보이면 사람을 탓하지 말고 더 나은 순서를 한 장으로 만들어 보여 주세요. 말로 하면 반항으로 남고 문서로 하면 개선으로 남습니다.'
    ],
    편재: [
      '새 거래와 부업, 투자 이야기가 들어오는 달입니다. 금액이 커 보일수록 하루 묶어 두면 새는 돈이 줄어듭니다.',
      '큰돈 이야기가 먼저 들려오는 달입니다. 지인이 새 사업이나 투자 이야기를 꺼내면 그 자리에서 수익 구조를 두 문장으로 설명해 달라고 하세요. 설명이 길어지면 이 달의 기회는 아닙니다.'
    ],
    정재: [
      '정산서와 통장을 정리하는 달입니다. 밀린 영수증과 구독을 한 번에 정리하면 다음 분기가 훨씬 가벼워집니다.',
      '월급날 이후 며칠이 이 달의 성적을 정합니다. 카드값과 구독료를 한 번에 확인하고 그중 하나는 끊으세요. 이 달에 끊은 하나가 내년까지 남습니다.'
    ],
    편관: [
      '갑작스러운 지시와 평가가 몰리는 달입니다. 야근이 길어지는 주에는 검진과 수면을 먼저 달력에 넣으세요.',
      '맡지 않았던 일이 갑자기 얹히는 달입니다. 거절하지 않고 다 받으면 이 달 말에 몸이 먼저 신호를 보냅니다. 받되 기한을 다시 정해서 받으세요.'
    ],
    정관: [
      '면접과 보고, 계약처럼 격식이 있는 자리가 생기는 달입니다. 서류의 숫자는 두 번 확인하세요.',
      '공식 문서에 내 이름이 오르내리는 달입니다. 계약서·이력서·지원서처럼 남는 서류를 이 달에 정리해 두면 다음 분기에 그대로 쓰입니다.'
    ],
    편인: [
      '공부와 정리에 몰입하는 달입니다. 다만 결정을 미루기 쉬워, 기한을 종이에 먼저 적어 두세요.',
      '혼자 있는 시간이 길어지는 달입니다. 자료를 모으다 하루가 다 가기 쉬우니, 오전에 한 가지만 정해 끝내고 나머지는 내일로 넘기세요.'
    ],
    정인: [
      '어른의 조언이나 자격 이야기가 들어오는 달입니다. 망설이지 말고 도움을 청하는 쪽이 몇 달을 줄입니다.',
      '배움의 문이 열리는 달입니다. 누군가의 조언이나 강의가 눈에 들어오면 그 자리에서 질문 하나를 준비하세요. 질문이 있는 사람에게 이 달의 도움은 오래 남습니다.'
    ]
  };
  const MONTH_TIP = {
    추진: [
      '이 달에 미뤄 둔 연락과 지원, 제안을 꺼내세요.',
      '기다리던 답이 오는 달입니다. 먼저 물어보면 대개 흔쾌히 받아들여집니다.',
      '한 번 더 밀어 보세요. 지난달에 막혔던 곳이 이 달에는 열립니다.',
      '숨겨 둔 계획 하나를 밖으로 꺼내기 좋은 달입니다. 말해 두면 사람이 붙습니다.',
      '이 달에 보낸 제안은 답이 늦어도 살아 있습니다. 한 번 보내고 기다려 보세요.',
      '미뤄 둔 지원서와 견적, 문의를 이 달에 처리하세요. 같은 일도 반응이 다릅니다.'
    ],
    균형: [
      '이 달은 이미 벌인 일을 끝내는 데 쓰세요. 새 일은 다음 달로 넘겨도 늦지 않습니다.',
      '반은 진행하고 반은 확인에 쓰세요. 이 달의 결정은 하루만 두고 보면 답이 보입니다.',
      '새 일보다 마무리에 힘이 실리는 달입니다. 미뤄 둔 정산과 정리를 이 달에 끝내세요.',
      '한 걸음은 나가되 확정은 다음 달로 미루세요. 이 달에는 조건을 확인하는 쪽이 이깁니다.',
      '되는 일 하나와 미룰 일 하나를 나눠 보세요. 둘 다 잡으면 이 달은 어느 쪽도 끝나지 않습니다.',
      '이 달에 받은 제안은 답을 미루되 기한은 정해 두세요. 기한 없는 보류가 가장 손해입니다.'
    ],
    방어: [
      '새로 벌이지 말고 정리에 쓰세요. 큰 결제와 계약은 이 달을 비켜 두는 편이 낫습니다.',
      '이 달은 지키는 쪽이 남습니다. 새 약속은 잡지 말고 이미 한 약속만 지키세요.',
      '속도를 낮추세요. 이 달에 급하게 정한 일은 두 번 손이 갑니다.',
      '큰돈이 오가는 자리는 이 달을 피하세요. 대신 집 안팎을 정리해 두면 다음 달이 가벼워집니다.',
      '이 달의 말실수를 조심하세요. 결정을 서두르지 말고 문서로 남겨 두면 나중에 편합니다.',
      '누군가 재촉하면 하루를 두세요. 이 달의 재촉은 대개 상대의 사정입니다.'
    ]
  };

  const Y_INFO = {
    year: YEAR, stem: Y_STEM, branch: Y_BRANCH,
    hanja: '丁未', ko: '정미', animal: '양',
    stemElem: '화', branchElem: '토',
    headline: '丁未年 · 붉은 양의 해',
    tagline: '정(丁)의 촛불이 미(未)의 밭에 앉은 해 — 불어 키우고 흙에 여무는 해'
  };

  function animalOf(b) { return ANIMALS[b] + '띠'; }
  function flatRel(arr) { return arr.map(r => E.REL_SIT[r] || r).join(', '); }
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

    /* 올해의 천간·지지가 내 사주에 들어오는 방식 */
    const yearRead = (function () {
      const me = E.ELEMENTS.indexOf(dm.elem);
      const stemRel = E.relation(me, 1);   // 丁 = 화
      const branchRel = E.relation(me, 2); // 未 = 토
      const stemFav = E.ELEMENTS[1] === yongEl ? 'yong' : (E.ELEMENTS[1] === heeEl ? 'hee' : '');
      const branchFav = E.ELEMENTS[2] === yongEl ? 'yong' : (E.ELEMENTS[2] === heeEl ? 'hee' : '');
      const relText = {
        비겁: '나와 같은 기운이 겹칩니다. 의욕과 경쟁심이 함께 올라가고 사람 사이의 자리다툼이 생기기 쉽습니다. 대신 내 이름으로 시작하는 일은 힘을 받습니다.',
        식상: '내가 만들어 내놓는 기운이 들어옵니다. 표현과 결과물이 밖으로 나가는 해라 콘텐츠·영업·제안이 결실을 맺습니다.',
        재성: '돈의 기운이 직접 들어옵니다. 버는 일이 늘고 그만큼 지출의 유혹도 함께 커집니다.',
        관성: '책임과 평가의 기운이 들어옵니다. 직장·시험·계약처럼 공식의 자리에서 결과가 나오는 대신 몸과 마음의 압박도 함께 옵니다.',
        인성: '배움과 보호의 기운이 들어옵니다. 공부·자격·문서에 유리한 해이고 대신 결정이 늦어지기 쉽습니다.'
      };
      const favCount = (stemFav ? 1 : 0) + (branchFav ? 1 : 0);
      const verdict = favCount === 2
        ? '두 기운 모두 내게 유리해, 2027년은 판을 키우기에 좋은 해입니다.'
        : favCount === 1
          ? '한쪽은 내게 유리하고 한쪽은 부담이라, 벌이와 정리를 함께 가져가야 하는 해입니다.'
          : '두 기운 모두 내 용신과 멀어, 새로 벌이기보다 정리하며 힘을 아끼는 편이 나은 해입니다.';
      const tail = '지지 未(토)는 내게 ' + branchRel + ' 기운입니다. ' + relText[branchRel] + ' ' + verdict;
      return {
        stemRel: stemRel, branchRel: branchRel, favCount: favCount, tail: tail,
        text: '올해 천간 丁(화)은 내게 ' + stemRel + ' 기운, 지지 未(토)는 ' + branchRel + ' 기운입니다. ' + relText[stemRel] + (branchRel !== stemRel ? ' ' + relText[branchRel] : '') + ' ' + verdict
      };
    })();

    /* 내 지지 ↔ 未 */
    const yearHits = [];
    pool.forEach((b, i) => {
      const r = relOf(Y_BRANCH, b);
      if (r.length) yearHits.push({ label: labels[i], branch: b, name: E.BRANCHES[b] + '(' + ANIMALS_SHORT[b] + ')', rel: r });
    });
    const samhapYear = samhapWith(Y_BRANCH, pool);

    /* 12개월 월운 — 같은 십성·같은 판정이 다시 와도 문장이 겹치지 않게 순번을 센다 */
    const sceneRank = {}, tipRank = {};
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
      if (base.branchElem === yongEl) { score += 8; elemNote = '용신 ' + yongEl + ' 기운이 실린 달'; }
      else if (base.branchElem === heeEl) { score += 4; elemNote = '희신 ' + heeEl + ' 기운의 도움'; }
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
      fix = base.no + '월(' + base.hanja + ') ' + dm.hanja + '(' + dm.ko + ') 일간에게는 ' + fix;

      const relTxt = [
        relYear.length ? '未와 ' + relYear.join('·') : '',
        relMine.length ? '내 일지와 ' + relMine.join('·') : ''
      ].filter(Boolean).join(', ') || '충·합 없음';
      const verdict = score >= 62 ? '추진' : (score >= 48 ? '균형' : '방어');
      const sceneIdx = sceneRank[god] || 0;
      sceneRank[god] = sceneIdx + 1;
      const tipIdx = tipRank[verdict] || 0;
      tipRank[verdict] = tipIdx + 1;

      const line = '<b>' + base.no + '월(' + base.hanja + ')</b> — ' + god + ' · ' + stage + ' · ' + relTxt + '. '
        + (ACTION[god] || '평소의 일') + '에 힘이 실리는 달, '
        + (verdict === '추진' ? '<b>밀어붙여도 좋습니다.</b>' : verdict === '균형' ? '절반은 진행하고 절반은 확인하세요.' : '<b>확인과 방어가 먼저입니다.</b>')
        + (elemNote ? ' (' + elemNote + ')' : '');

      /* ---- 심층 문장 (유료 본문) ---- */
      const gs = E.GOD_SIT[god], bs = E.GOD_SIT[branchGod];
      const story = [];
      const v = base.no % 3;
      const headV = [
        base.no + '월(' + base.hanja + ', ' + base.startLabel + ' 절입' + ') — 하늘에는 ' + base.stemKo + base.stemElem + '(' + god + '), 땅에는 ' + base.branchKo + base.branchElem + ' — ' + branchGod + ' 자리가 앉는 달입니다.',
        base.no + '월(' + base.hanja + ', ' + base.startLabel + ' 절입' + ') — 천간은 ' + base.stemKo + base.stemElem + '(' + god + '), 지지는 ' + base.branchKo + base.branchElem + '라 ' + branchGod + ' 자리가 깔립니다.',
        base.no + '월(' + base.hanja + ', ' + base.startLabel + ' 절입' + ') — 이 달의 간지는 ' + base.stemKo + base.stemElem + '(' + god + ') 위에 ' + base.branchKo + base.branchElem + '(' + branchGod + ')' + E.josa(branchGod, '이', '가').slice(branchGod.length) + ' 앉았습니다.'
      ];
      story.push(headV[v] + ' 내 일간 ' + dm.hanja + '에게 ' + E.josa(god, '은', '는') + ' ' + gs.sit + '이고, 이 달의 주제는 ' + gs.scene + '입니다.');
      const secondV = [
        base.no + '월 ' + E.josaHan(base.hanja, base.ko, '은', '는') + ' 월지 본기의 ' + branchGod + '까지 겹쳐 ' + E.josa(bs.sit, '이', '가') + ' 한 겹 더해지고, ' + dm.hanja + ' 일간의 12운성은 ' + stage + ' — ' + E.STAGE_DEEP[stage] + '.',
        base.no + '월의 월지 본기는 ' + E.josa(branchGod, '이', '가') + ' 한 겹 더 얹힙니다 — ' + bs.sit + '. ' + dm.hanja + '(' + dm.ko + ') 일간의 운성은 ' + stage + ', ' + E.STAGE_DEEP[stage] + '.',
        '게다가 ' + base.no + '월 ' + base.hanja + '의 지지는 ' + branchGod + ' 자리라 ' + E.josa(bs.sit, '이', '가') + ' 함께 걸립니다. ' + dm.hanja + ' 일간의 운성은 ' + stage + ' — ' + E.STAGE_DEEP[stage] + '.'
      ];
      story.push(secondV[v]);
      const noYearV = [
        base.no + '월(' + base.hanja + ')은 2027년 未토와 충·합이 없습니다. ' + dm.hanja + ' 일간에게 이 달은 해의 기운이 흔들지 않고 월운 자체로만 움직입니다.',
        '올해의 未토는 ' + base.no + '월 ' + E.josaHan(base.hanja, base.ko, '을', '를') + ' 건드리지 않습니다. ' + dm.hanja + ' 일간의 흐름은 이 달의 간지로만 결정되고 해의 기운은 잠잠합니다.',
        '未토와 ' + base.no + '월 ' + base.hanja + ' 사이에는 아무 작용이 없습니다. ' + dm.hanja + '(' + dm.ko + ') 일간에게 이 달은 해의 도움도 방해도 없이 제 몫으로 굴러갑니다.'
      ];
      story.push(relYear.length
        ? base.no + '월 ' + E.josaHan(base.hanja, base.ko, '은', '는') + ' ' + dm.hanja + '(' + dm.ko + ') 일간에게 2027년 未토와 ' + flatRel(relYear) + ' 관계입니다. ' + REL_SCENE[relYear[0]] + (relYear.length > 1 ? ' 여기에 ' + relYear.slice(1).map(r => (E.REL_SIT[r] || r)).join(' · ') + '까지 겹쳐 같은 방향의 부담이 한 번 더 옵니다.' : '')
        : noYearV[v]);
      const noMineV = [
        E.josaHan(chart.pillars.day.hanja, chart.pillars.day.branchKo, '과', '와') + '는 부딪히지도 붙지도 않아, ' + base.no + '월에는 생활의 리듬을 그대로 지킬 수 있습니다.',
        '내 일지 ' + chart.pillars.day.hanja + '(' + chart.pillars.day.branchKo + ') 쪽과 ' + base.no + '월 ' + E.josaHan(base.hanja, base.ko, '은', '는') + ' 아무 작용이 없습니다. 생활의 큰 틀은 흔들리지 않으니 평소대로 가시면 됩니다.',
        base.no + '월은 내 자리(' + chart.pillars.day.hanja + ')와 조용한 달입니다 — 크게 얻을 것도 잃을 것도 없이 담담하게 지나갑니다.'
      ];
      story.push(relMine.length
        ? '내 일지 ' + chart.pillars.day.hanja + ' 쪽과 ' + base.no + '월 ' + E.josaHan(base.hanja, base.ko, '은', '는') + ' ' + flatRel(relMine) + ' — ' + MINE_SCENE[relMine[0]] + (relMine.length > 1 ? ' ' + relMine.slice(1).map(r => (E.REL_SIT[r] || r)).join(' · ') + '까지 겹쳐 마음 쓸 일이 한 가지 더 생깁니다.' : '')
        : noMineV[v]);
      if (base.branchElem === yongEl) story.push(base.no + '월 ' + base.hanja + '의 월지가 용신 ' + E.josa(yongEl, '과', '와') + ' 같은 기운이라 ' + dm.hanja + ' 일간인 내가 편해집니다. 같은 일을 해도 피로가 덜하고 판단이 빨라집니다.');
      else if (base.branchElem === heeEl) story.push(base.no + '월에는 희신 ' + heeEl + ' 기운이 실려 ' + dm.hanja + ' 일간의 주변에 도움이 따라옵니다. 누군가의 소개나 제안이 실제 이익으로 이어집니다.');
      else if (base.branchElem === dm.elem) story.push('내 기운(' + dm.elem + ')이 ' + base.no + '월 ' + base.hanja + '에 겹치는 달이라 ' + dm.hanja + '(' + dm.ko + ') 일간은 의욕은 앞서는데 결과는 늦습니다. 혼자 결정하기보다 한 번 검토를 거치세요.');
      const PUSH = ['밀어붙이면 됩니다. ', '앞으로 나가셔도 됩니다. ', '힘을 실어도 좋습니다. ', '이 달의 문은 열려 있습니다. ', '미루지 말고 오늘 정하세요. '];
      const BAL = ['절반만 나가고 나머지 절반은 확인에 쓰세요. ', '한 걸음 나가고 한 걸음 멈추는 때입니다. ', '서두르지 말고 확인하며 가세요. ', '되는 만큼만 하고 나머지는 조건을 보세요. ', '확인할 것과 결정할 것을 나눠 두세요. '];
      const DEF = ['지키는 쪽이 이깁니다. ', '새로 벌이기보다 정리에 쓰는 편이 좋습니다. ', '물러서서 확인하는 것이 정답입니다. ', '오늘은 접어 두는 편이 낫습니다. ', '멈춰 서서 한 번 더 계산하세요. '];
      const OPEN = PUSH[base.no % 3];
      const verdictLine = verdict === '추진' ? PUSH[tipIdx % PUSH.length] : (verdict === '균형' ? BAL[tipIdx % BAL.length] : DEF[tipIdx % DEF.length]);
      story.push(base.no + '월 ' + base.hanja + ' — ' + dm.hanja + ' 일간에게 이 달은 ' + verdictLine + gs.tip + '.'
        + (verdict === '방어' && score < 48 ? ' 이런 달에 큰 결정을 하면 대개 일이 두 번 꼬입니다. 한 번 접어 두는 것도 실력입니다.' : ''));
      /* 생활 장면 — 그 달에 실제로 겪을 일과 바로 할 일 */
      const LEAD = ['생활로 옮기면 이렇습니다. ', '이 달을 하루로 바꿔 보면, ', '이 달의 생활 장면은 이렇습니다. '];
      if (base.no === 1) LEAD[base.no % 3] = E.plain('월운') + '은 ' + E.plain('절입') + '을 기준으로 달이 바뀌니, 매달 첫 주에 그 달 계획을 세우세요. ';
      const sceneBank = MONTH_SCENE[god] || MONTH_SCENE.정인;
      const tipBank = MONTH_TIP[verdict];
      story.push(LEAD[base.no % 3] + sceneBank[sceneIdx % sceneBank.length] + ' ' + tipBank[tipIdx % tipBank.length]
        + ' 이 달의 흐름은 ' + score + '점이고, 내 일지 ' + E.josaHan(chart.pillars.day.branchName + '(' + chart.pillars.day.branchKo + ')', chart.pillars.day.branchKo, '과', '와') + '는 ' + (relMine.length ? relMine.join('·') : '아무 작용도 없는 자리') + '입니다.');

      const PUSH_T = ['흐름이 순해 미뤄 둔 일을 꺼내기 좋습니다.', '막혀 있던 일이 풀리는 달입니다.', '이 달에 건 일은 대개 붙습니다.', '지난달에 미뤄 둔 답장을 이 달에 보내면 결과가 따라옵니다.', '먼저 나서는 쪽이 이 달의 몫을 가져갑니다.'];
      const BAL_T = ['나머지 절반은 확인과 정리에 두면 이 달이 손해 없이 지나갑니다.', '결정은 한 번 미루세요. 확인하는 쪽이 남는 장사입니다.', '계획만 세워 두고 실행은 다음 달로 넘겨도 늦지 않습니다.', '금액과 날짜를 다시 확인한 뒤에 움직이세요. 그 하루가 이 달을 지킵니다.', '큰 결정보다 정리와 점검에 힘이 실리는 달입니다.'];
      const DEF_T = ['새로 벌이지 말고 확인과 정리에 쓰세요.', '속도를 늦추세요. 이 달에 벌인 일은 대개 손이 더 갑니다.', '숨을 고르는 달입니다. 미뤄 둔 정리부터 하세요.', '이 달에 서명과 결제는 한 번 미루세요. 되돌리는 데 두 배가 듭니다.', '판을 키우기보다 흠집을 막는 달입니다.'];
      const pick = verdict === '추진'
        ? base.no + '월 ' + base.hanja + '에는 ' + (ACTION[god] || '평소의 일') + '에 힘이 실립니다. ' + (relMine.indexOf('합') >= 0 ? '내 일지와 합해 사람이 붙으니 미뤄 둔 연락과 제안을 이 달에 꺼내세요.' : relYear.indexOf('합') >= 0 ? '올해의 未토와 합해 거래와 계약이 맺어지기 좋습니다.' : PUSH_T[tipIdx % PUSH_T.length])
        : verdict === '균형'
          ? base.no + '월 ' + base.hanja + '에는 ' + E.josa(ACTION[god] || '평소의 일', '은', '는') + ' 절반만 진행하세요. ' + BAL_T[tipIdx % BAL_T.length]
          : (negs.length ? flatRel(negs) + ' 관계가 겹쳐 ' : '기운이 빠지는 달이라 ') + DEF_T[tipIdx % DEF_T.length] + ' ' + E.josa(ACTION[god] || '평소의 일', '은', '는') + ' 이 달에 새로 시작하지 마세요. (일지 ' + chart.pillars.day.hanja + ' · ' + (relMine.length ? relMine.join('·') : '무관') + ')';

      return {
        no: base.no, idx: base.idx, hanja: base.hanja, ko: base.ko,
        stemKo: base.stemKo, branchKo: base.branchKo, startLabel: base.startLabel,
        stemElem: base.stemElem, branchElem: base.branchElem, animal: base.animal,
        god: god, godGroup: E.GOD_GROUP[god], branchGod: branchGod, stage: stage,
        relYear: relYear, relMine: relMine, relYearBr: relYearBr,
        score: score, grade: grade, gradeKey: gradeKey, tag: tag,
        line: line, fix: fix, action: ACTION[god] || '', verdict: verdict,
        story: story, pick: pick,
        scene: sceneBank[sceneIdx % sceneBank.length], tip: tipBank[tipIdx % tipBank.length]
      };
    }).sort((a, b) => a.no - b.no);

    const ranked = ms.slice().sort((a, b) => b.score - a.score);
    const good = ranked.slice(0, 3);
    const warn = ranked.slice(-3).reverse();

    const half = (from, to, label) => {
      const arr = ms.filter(m => m.no >= from && m.no <= to);
      const best = arr.slice().sort((a, b) => b.score - a.score)[0];
      const worst = arr.slice().sort((a, b) => a.score - b.score)[0];
      const avg = Math.round(arr.reduce((s, m) => s + m.score, 0) / arr.length);
      const good = arr.filter(m => m.score >= 62).map(m => m.no + '월');
      const warn = arr.filter(m => m.score < 52).map(m => m.no + '월');
      const story = [
        E.josa(label, '은', '는') + ' 평균 ' + avg + '점입니다. 가장 힘이 실리는 달은 ' + best.no + '월(' + best.hanja + ') — ' + best.god + ' · ' + E.josa(best.stage, '으로', '로') + ', ' + best.pick,
        '반대로 가장 낮은 달은 ' + worst.no + '월(' + worst.hanja + ') ' + worst.score + '점입니다. ' + worst.pick,
        '큰 결정(계약·이직·이사·큰 결제)은 ' + (good.length ? good.join(' · ') : best.no + '월') + '에 몰아 두고, 점검과 정리·건강검진은 ' + (warn.length ? warn.join(' · ') : worst.no + '월') + '에 두세요. ' +
        (from === 1 ? '1~2월에 한 해 계획을 확정해 두면 봄의 흔들림을 절반으로 줄일 수 있습니다.' : '9~10월에 미뤄 둔 일을 한 번 정리하고, 12월에는 새로운 시작보다 결산에 힘을 쓰세요.')
      ];
      return { arr: arr, best: best, worst: worst, avg: avg, goodMonths: good, warnMonths: warn, story: story };
    };

    /* 삼재 */
    const samjae = (function () {
      if (SAMJAE_2027.indexOf(yearBr) >= 0) {
        return {
          is: true, stage: '날삼재', stageNo: 3,
          head: animalOf(yearBr) + ' · 2027년은 ' + E.plain('삼재') + '의 마지막 해(날삼재)',
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
        head: animalOf(yearBr) + ' · 2027년 ' + E.plain('삼재') + '는 해당 없음',
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
      if (g.재성 === 0) out.push({ title: '들어오는 길이 좁은 그릇', why: '재성이 원국에 없어 — 벌이의 통로가 하나뿐입니다', fix: '수입원을 하나 더 만들되 손에 익은 기술(식상)에서 파생시키세요. 새 분야는 실패 확률이 큽니다.' });
      if (g.재성 >= 3) out.push({ title: '손이 커지는 그릇', why: '재성 ' + g.재성 + '개 — 기회도 많지만 나가는 길도 많습니다', fix: '수입의 10%는 손대지 않는 계좌로 자동이체. 들어온 돈은 48시간 묶어 두는 규칙을 쓰세요.' });
      if (g.식상 <= 1 && g.인성 >= 2) out.push({ title: '생각이 길어 실행이 늦는 구멍', why: '인성 ' + g.인성 + '개' + (g.식상 ? ' · 식상 ' + g.식상 + '개' : ' · 식상은 원국에 없음') + ' — 준비만 하다 때를 놓칩니다', fix: '완벽해지기 전에 팔아 보세요. 초안·샘플을 먼저 내놓는 것이 이 사주의 지름길입니다.' });
      if (chart.strength === 'weak') out.push({ title: '체력·건강 유지비로 새는 돈', why: '신약 구조 — ' + dm.hanja + ' 일간의 몸이 지출의 하수구가 됩니다', fix: '병원비·휴식비는 아끼지 말고, 대신 밤 문화·과식 지출을 줄이세요. ' + chart.pillars.day.hanja + ' 일지의 ' + chart.gods.dayBranch + '이 그 지출을 키웁니다.' });
      if (c.토 >= 3) out.push({ title: '고정비·집·차로 새는 돈', why: '토(土) ' + c.토 + '자 — 자리를 잡는 지출이 큽니다', fix: '구독·관리비·할부를 한 장에 적어 보세요. 고정비 3개를 끊으면 그대로 저축이 됩니다.' });
      if (c.수 >= 3) out.push({ title: '구독·충동·유흥으로 새는 돈', why: '수(水) ' + c.수 + '자 — 흘러가는 지출이 많습니다', fix: '결제 전 하루 묵히기, 구독은 분기마다 정리하기. 이 두 가지로 새는 돈이 절반이 됩니다.' });
      if (c.화 >= 3) out.push({ title: '관계·모임·선물로 새는 돈', why: '화(火) ' + c.화 + '자 — 사람을 향한 지출이 뜨겁습니다', fix: '모임은 월 2회로 정하고 선물은 금액 상한을 먼저 정하세요.' });
      if (!out.length) out.push({ title: '새는 곳이 적은 그릇', why: '오행과 십신이 고르게 놓였습니다', fix: '문제는 막는 힘보다 버는 힘입니다. 수입의 통로를 하나 더 여는 데 집중하세요.' });
      while (out.length < 2) out.push({ title: '결제 습관의 구멍', why: '지출 기록이 없는 것이 가장 큰 구멍입니다 — ' + dm.hanja + dm.elem + ' ' + chart.strengthKo + '인 사주에서 ' + c.수 + '수·' + c.화 + '화가 그 습관을 만듭니다', fix: '한 달만 결제 내역을 한 파일에 모아 보세요. 보이는 순간 새는 곳이 줄어듭니다. ' + chart.ganji + ' 기준으로는 고정비부터 확인하세요.' });
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
      yearGod: yearGod, yearGodGroup: E.GOD_GROUP[yearGod], yearRead: yearRead,
      yearHits: yearHits, samhapYear: samhapYear,
      months: ms, good: good, warn: warn,
      half1: half(1, 6, '상반기'), half2: half(7, 12, '하반기'),
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
