/* ============================================================
   월하사주 · saju-rx.js — 처방 엔진
   리포트의 모든 문장을 여덟 글자(일간·신강/신약·용신·십성·일지·신살·귀인)에서
   직접 생성한다. 같은 주제라도 사주가 다르면 문장이 겹치지 않는다.
   의존: saju-engine.js, saju-2027.js(월운), saju-plus.js(대운)
   ============================================================ */
window.SAJU_RX = (function () {
  'use strict';

  var E = window.SajuEngine, P = window.SAJU_PLUS, Y27 = window.SAJU_2027;
  var D = window.SAJU_DATA;
  var ORDER = ['비겁', '식상', '재성', '관성', '인성'];
  var HANJA = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

  /* ---------------- 일간 10종 ---------------- */
  var DM = {
    0: { key: '甲木', ko: '갑', img: '곧게 뻗는 큰 나무', gift: '한번 정한 방향을 끝까지 미는 힘', shadow: '줄기가 굵어 잘 휘지 못하고, 맞는 말도 꺾어 하지 못해 손해를 봅니다',
      body: '오늘 안에 결정 하나를 끝내고, 그 결정을 남에게 설명할 두 문장을 미리 적어 두세요', study: '큰 단원을 통째로 세우고 아래로 내려오는 공부', money: '한 번에 크게 벌기보다 오래 자라는 자산', social: '내가 먼저 길을 열어야 사람이 따라오는 자리', item: '나무 몸통의 펜' },
    1: { key: '乙木', ko: '을', img: '바위를 감아 오르는 덩굴', gift: '기댈 곳을 찾아 끝까지 감고 올라가는 끈기', shadow: '기댈 곳이 없으면 방향을 잃고 남의 속도에 휩쓸립니다',
      body: '하루 한 번, 진행 상황을 누군가에게 말로 보고하는 자리를 만드세요', study: '남에게 설명하며 감아 올라가는 공부', money: '작은 수입을 여러 갈래로 이어 붙이는 구조', social: '한 사람을 깊게 붙드는 쪽', item: '덩굴 무늬 손수건' },
    2: { key: '丙火', ko: '병', img: '한낮의 태양', gift: '가리지 않고 비추는 힘으로 사람을 모으는 자리', shadow: '밝은 만큼 기복이 크고 화가 그대로 드러나 관계에 금이 갑니다',
      body: '오늘의 감정을 오전에 한 번 정리하고, 저녁 약속은 일부러 하나만 잡으세요', study: '소리 내어 설명하며 밝히는 공부', money: '이름을 걸고 드러내야 돈이 붙는 구조', social: '무대에 서는 자리', item: '붉은 계열의 작은 노트' },
    3: { key: '丁火', ko: '정', img: '어둠을 밝히는 촛불', gift: '섬세하게 곁을 살피고 조용히 사람을 살리는 힘', shadow: '자신을 태워 남을 밝히다 먼저 식어 버립니다',
      body: '하루의 마지막 한 시간은 아무에게도 쓰지 말고 내 회복에 먼저 배정하세요', study: '짧게 집중하고 자주 끄는 공부', money: '손기술과 세밀함이 값이 되는 구조', social: '한 사람을 오래 살피는 쪽', item: '은은한 향초' },
    4: { key: '戊土', ko: '무', img: '움직이지 않는 산', gift: '중심을 잡고 맡은 일을 끝까지 지키는 힘', shadow: '변화의 신호를 늦게 알아채고 고집이 되어 사람을 놓칩니다',
      body: '한 달에 한 번, 지금 하는 일이 맞는지 스스로에게 묻는 시간을 달력에 먼저 박아 두세요', study: '한 과목을 오래 파는 공부', money: '부동산·고정자산처럼 자리를 잡는 재물', social: '오래 보는 사람과 깊게', item: '도자기 컵' },
    5: { key: '己土', ko: '기', img: '무엇이든 받아 키우는 텃밭', gift: '실속과 현실 감각으로 작은 이익을 오래 모으는 힘', shadow: '속을 드러내지 않아 가까운 사람도 진심을 모릅니다',
      body: '이번 주에 고마웠던 사람 하나에게 이유를 붙여 말로 전하세요', study: '정리 노트를 남에게 보여 주는 공부', money: '작게 여러 번 들어오는 재물을 모으는 구조', social: '챙기는 쪽', item: '작은 화분' },
    6: { key: '庚金', ko: '경', img: '단칼에 결판내는 강철', gift: '어려운 판을 뚫는 추진력과 결단', shadow: '직선적인 말이 사람을 베어 실력보다 인상으로 손해를 봅니다',
      body: '말을 꺼내기 전에 한 문장을 삼키고 결론만 남겨 말하세요', study: '기출을 베어 내는 공부', money: '정산과 계약에서 강한 재물', social: '실력으로 증명하는 쪽', item: '금속 볼펜' },
    7: { key: '辛金', ko: '신', img: '다듬어질수록 빛나는 보석', gift: '정교한 감각과 완성도로 앞서는 힘', shadow: '예민한 자존심이 방해가 되어 사소한 말에 오래 마음을 씁니다',
      body: '완성 기준을 80%로 낮춰 두고 나머지 20%는 다음 판으로 넘기세요', study: '오답을 정교하게 다듬는 공부', money: '기술과 감각이 값이 되는 재물', social: '취향이 맞는 사람과만 깊게', item: '은색 액세서리' },
    8: { key: '壬水', ko: '임', img: '모든 것을 받아들이는 바다', gift: '큰 그림을 그리고 막힌 곳을 돌아 흐르는 지혜', shadow: '방향을 정하지 않으면 시작만 많고 끝이 적어집니다',
      body: '벌인 일을 세 개 이하로 줄이고, 각각 끝낼 날짜를 적으세요', study: '전체 지도를 먼저 그리는 공부', money: '흐름을 읽어 옮기는 재물', social: '판을 넓히는 쪽', item: '유리 물병' },
    9: { key: '癸水', ko: '계', img: '스며드는 이슬과 시냇물', gift: '분위기를 먼저 읽고 사람 마음을 알아채는 감수성', shadow: '생각이 많아 결정의 순간에 뒷걸음칩니다',
      body: '결정 기한을 오늘 안으로 정하고, 그 시간에 답이 안 나오면 작은 쪽으로 정하세요', study: '밤에 조용히 필기하는 공부', money: '새는 돈을 막는 절약형 재물', social: '조용히 스며드는 쪽', item: '작은 유리병' }
  };

  /* ---------------- 용신 5행의 생활 처방 ---------------- */
  var YONG = {
    목: { act: '아침 7시 전에 창을 열고 20분 걷고, 새 일은 오전에 시작하세요', place: '동쪽 창가·공원·서점', time: '오전 7~9시',
      study: '새 단원은 아침에 열고 저녁에는 복습만 하세요', money: '새 수입원은 아침 시간에 협의를 잡으세요', social: '먼저 말을 거는 쪽이 유리합니다', body: '눈과 힘줄을 쓰고 스트레칭으로 풀어 주세요', item: '화분·나무 소품' },
    화: { act: '해가 있을 때 사람을 만나고 발표·약속은 낮에 잡으세요', place: '남쪽·밝은 카페·무대', time: '한낮 11~13시',
      study: '소리 내어 설명하며 외우세요', money: '이름을 걸고 파는 일에 힘을 싣으세요', social: '무대에 서는 자리가 맞습니다', body: '심장과 혈압을 식히는 저녁 루틴을 두세요', item: '향초·붉은 소품' },
    토: { act: '끼니 시간을 고정하고 책상과 서류를 한 번 정리하세요', place: '중앙·익숙한 공간·집', time: '오후 1~3시',
      study: '같은 자리, 같은 시간에 앉는 것이 답입니다', money: '고정 수입과 자산을 쌓는 쪽으로 움직이세요', social: '오래 보는 사람을 곁에 두세요', body: '위와 소화기를 따뜻하게 다스리세요', item: '도자기·흙 소품' },
    금: { act: '마감 시간을 정하고 미룬 것 하나를 끊어 내세요', place: '서쪽·정리된 방', time: '저녁 17~19시',
      study: '오답과 요약으로 쳐내며 정리하세요', money: '정산·계약·자격으로 버는 쪽이 맞습니다', social: '선을 긋고 관계를 정리하세요', body: '폐와 피부를 위해 긴 호흡을 쓰세요', item: '금속 액세서리' },
    수: { act: '잠을 7시간으로 고정하고 하루 15분 기록하세요', place: '북쪽·물가·조용한 방', time: '밤 21~23시',
      study: '밤에 필기하고 아침에 확인하세요', money: '저축 자동이체와 현금흐름 관리가 먼저입니다', social: '한 사람과 깊게 오래 가세요', body: '신장·허리와 수면을 지키세요', item: '유리·물 소품' }
  };

  /* ---------------- 신강·신약·중화 ---------------- */
  var STR = {
    strong: { label: '신강', read: '기운이 넘쳐 밀어붙이는 힘이 세고, 내 판단을 끝까지 가져가려는 마음이 강합니다',
      act: '일정의 20%는 비워 두고, 결정을 하나 내리면 남에게 검토받는 절차를 붙이세요 — 기운을 덜어내는 것이 이 사주의 처방입니다',
      risk: '힘이 세서 주변의 말이 작게 들리고, 혼자 다 짊어지다 결정적인 순간에 힘이 빠집니다' },
    weak: { label: '신약', read: '혼자 밀면 쉽게 지치지만 사람과 환경이 받쳐 주면 두세 배의 결과가 나오는 구조입니다',
      act: '혼자 하려던 일 하나를 골라 이번 주에 사람에게 맡기거나 함께 하세요 — 이 사주는 빌리는 힘이 곧 실력입니다',
      risk: '의지가 약해서가 아니라 기운이 얇아, 여럿의 요구를 다 받다가 내 일을 놓칩니다' },
    balanced: { label: '중화', read: '크게 치솟지도 가라앉지도 않아 오래 버티는 힘이 있습니다',
      act: '스스로 기한과 상금을 걸어 판을 키우세요 — 자극이 없으면 이 균형은 정체가 됩니다',
      risk: '무리 없이 적응하는 대신 강한 무기가 없어 대우가 늦게 따라옵니다' }
  };

  /* ---------------- 주된 십성 / 얇은 십성 ---------------- */
  var GMAIN = {
    비겁: { read: '나와 같은 기운이 겹쳐 주관이 또렷하고 내 편과 내 자리에 강합니다', act: '내 이름이 걸린 일을 하나 정해 성과를 숫자로 남기세요',
      risk: '자존심이 상하면 판을 뒤집고 싶어지고, 같이 쓰는 돈에서 새는 자리가 생깁니다' },
    식상: { read: '표현과 창작의 기운이 좋아 말과 결과물로 자신을 증명합니다', act: '만들어 둔 것 하나를 이번 주에 밖으로 내놓으세요',
      risk: '하고 싶은 말을 참지 못해 윗사람과의 자리에서 관계를 긁습니다' },
    재성: { read: '현실 감각이 좋고 눈앞의 이익과 손해를 빠르게 계산합니다', act: '들어오는 돈과 나가는 돈을 한 장에 적어 비교하세요',
      risk: '손에 쥔 것이 적어 보이면 마음이 먼저 초조해져 판단이 급해집니다' },
    관성: { read: '책임과 규율의 기운이 있어 맡은 자리를 지키는 힘이 있습니다', act: '맡은 일의 기준을 문서로 정하고 그 기준으로 평가받으세요',
      risk: '남의 시선을 의식해 하고 싶은 말을 삼키고, 몸에 긴장이 쌓입니다' },
    인성: { read: '배움과 보호의 기운이 좋아 생각이 깊고 사람을 품는 자리가 어울립니다', act: '배운 것 하나를 가르치거나 글로 정리해 밖으로 꺼내세요',
      risk: '생각이 길어져 결정을 미루고, 준비만 하다 때를 놓칩니다' }
  };

  var GLACK = {
    비겁: { read: '비겁이 얇아 내 편이 적고, 힘을 모아 줄 사람을 스스로 만들어야 합니다', act: '같은 목표를 가진 사람 한 명을 이번 달 안에 만나 약속을 하나 만드세요' },
    식상: { read: '식상이 얇아 만들어 내놓는 통로가 좁습니다', act: '머릿속에만 있던 것을 글로 한 장 써서 남에게 보여 주세요' },
    재성: { read: '재성이 얇아 돈이 직접 들어오는 통로가 좁습니다', act: '지금 가진 기술에서 파생되는 작은 유료 일을 하나 만들어 보세요' },
    관성: { read: '관성이 얇아 규율과 평가의 자리가 약합니다', act: '스스로 기한과 기준을 정해 남에게 공개하세요' },
    인성: { read: '인성이 얇아 배움과 보호의 자리가 비어 있습니다', act: '자격이나 스승 하나를 정해 정기적으로 배우는 자리를 만드세요' }
  };

  /* ---------------- 일지 십성 ---------------- */
  var JGOD = {
    비견: { read: '내 자리에 나와 같은 기운이 앉아 결정을 내가 하려는 마음이 강합니다', act: '내가 정한 것을 먼저 말하고 시작하세요' },
    겁재: { read: '내 자리에 나눠야 하는 기운이 앉아 사람과 돈이 함께 움직입니다', act: '돈이 오가는 약속은 금액을 먼저 정하세요' },
    식신: { read: '내 자리에 만들어 내는 기운이 앉아 손과 말로 결과를 남기는 일이 편합니다', act: '완성 전에 먼저 보여 주세요' },
    상관: { read: '내 자리에 뜯어고치는 기운이 앉아 정해진 것을 견디기 어렵습니다', act: '아이디어는 크게, 말은 짧게 하세요' },
    편재: { read: '내 자리에 판 밖의 돈이 앉아 한 번에 크게 움직이는 자리가 편합니다', act: '들어온 돈은 그 자리에서 묶어 두세요' },
    정재: { read: '내 자리에 쌓는 돈이 앉아 꾸준함이 결과가 되는 일이 맞습니다', act: '정산일을 정해 두세요' },
    편관: { read: '내 자리에 무거운 책임이 앉아 압박을 받을수록 단단해집니다', act: '반박보다 대응을 먼저 하세요' },
    정관: { read: '내 자리에 공식의 자리가 앉아 격식과 신뢰가 힘이 됩니다', act: '서류와 숫자를 정확히 다루세요' },
    편인: { read: '내 자리에 혼자 깊어지는 기운이 앉아 생각이 길어지기 쉽습니다', act: '결정 기한을 먼저 정하세요' },
    정인: { read: '내 자리에 배움과 보호가 앉아 도움을 받는 자리가 편합니다', act: '도움을 청하는 쪽이 빠릅니다' }
  };

  /* ---------------- 십이신살 ---------------- */
  var SAL = {
    '겁살': { read: '겁살은 내 것을 지키는 자리', act: '계약과 보증은 반드시 서면으로 남기세요', risk: '급한 돈 거래에서 손실이 나는 자리' },
    '재살': { read: '재살은 스스로를 옥죄는 살', act: '일정에 여백을 두고 스스로를 몰지 마세요', risk: '과로와 자기 검열' },
    '천살': { read: '천살은 하늘의 뜻을 기다리는 살이라 혼자 밀면 막힙니다', act: '사람과 때를 빌리세요', risk: '무리한 단독 결정' },
    '지살': { read: '지살은 땅에 발을 붙이는 살이라 자리를 옮기면 기운이 살아납니다', act: '이사·출장·자리 변경이 이 사주의 약입니다', risk: '한자리에 오래 눌러앉는 것' },
    '년살(도화)': { read: '도화는 사람을 끄는 힘', act: '사람을 만나는 일에 이 힘을 쓰세요', risk: '감정에 휘둘리는 관계' },
    '월살': { read: '월살은 달이 가려지는 살이라 의욕이 흐려지는 때가 옵니다', act: '큰 결정은 달이 차오르는 때로 미루세요', risk: '우울과 미룸' },
    '망신살': { read: '망신살은 드러나는 살이라 말과 행동이 곧 평판이 됩니다', act: '공적인 자리에서 말을 한 번 더 확인하세요', risk: '말실수와 즉흥적 공개' },
    '장성살': { read: '장성살은 앞에 서는 살이라 지휘하는 자리에서 힘이 납니다', act: '대표·리더 자리를 맡으세요', risk: '독선' },
    '반안살': { read: '반안살은 좋은 자리에 오르는 살', act: '윗자리에 앉는 자리를 노리세요', risk: '자리만 믿는 태만' },
    '역마살': { read: '역마는 움직이는 살이라 이동에서 운이 트입니다', act: '이동이 있는 일을 잡으세요', risk: '쉬지 않고 움직여 몸이 먼저 지치는 것' },
    '육해살': { read: '육해살은 남의 일로 소모되는 살', act: '남의 부탁은 경계를 정해 받으세요', risk: '대신 지다가 내 일을 놓치는 것' },
    '화개살': { read: '화개는 혼자 깊어지는 살이라 몰입에서 힘이 나옵니다', act: '혼자 몰입하는 시간을 확보하세요', risk: '사람을 피하고 고립되는 것' }
  };

  /* ---------------- 사주 사실 정리 ---------------- */
  function facts(chart) {
    if (chart.__rx) return chart.__rx;
    var g = chart.godGroups, c = chart.counts, dm = chart.dayMaster;
    var dom = ORDER[0], domN = -1;
    ORDER.forEach(function (k) { if (g[k] > domN) { domN = g[k]; dom = k; } });
    var lack = ORDER[0], lackN = 99;
    ORDER.forEach(function (k) { if (g[k] < lackN) { lackN = g[k]; lack = k; } });
    if (lack === dom) {
      var alt = ORDER.filter(function (k) { return k !== dom; }).sort(function (a, b) { return g[a] - g[b]; })[0];
      lack = alt; lackN = g[alt];
    }
    var dIdx = E.ELEMENTS.indexOf(dm.elem);
    function relEl(grp) { return E.ELEMENTS[(dIdx + ORDER.indexOf(grp)) % 5]; }

    var salHits = [];
    [['년지', chart.sinsal.year], ['월지', chart.sinsal.month], ['일지', chart.sinsal.day]]
      .concat(chart.sinsal.hour ? [['시지', chart.sinsal.hour]] : [])
      .forEach(function (s) { if (SAL[s[1]]) salHits.push({ name: s[1], where: s[0] }); });
    var daySal = chart.sinsal.day && SAL[chart.sinsal.day] ? chart.sinsal.day : (salHits[0] ? salHits[0].name : '지살');

    /* 오행 최다·최소는 엔진의 단일 판정(elemExtremes)을 쓴다 — 화면 퍼센티지와 같은 결론 */
    var ext = E.elemExtremes ? E.elemExtremes(chart) : null;
    var strongEl = ext ? ext.strong : E.ELEMENTS.slice().sort(function (a, b) { return chart.pct[b] - chart.pct[a]; })[0];
    var thinEl = ext ? ext.weak : E.ELEMENTS.slice().sort(function (a, b) { return chart.pct[a] - chart.pct[b]; })[0];
    var cheon = chart.gwisin.cheoneul;

    var f = {
      name: (chart.input && chart.input.name) || '',
      chart: chart,
      stem: dm.stem, dmh: dm.hanja, dmk: dm.ko, dme: dm.elem, dmKey: dm.hanja + dm.elem,
      ganji: chart.ganji, ganjiKo: chart.ganjiKo,
      yong: chart.yongsin.elem, hee: chart.yongsin.hee,
      strongKey: chart.strength, strong: chart.strengthKo, ratio: chart.strengthRatio,
      dom: dom, domN: domN, lack: lack, lackN: lackN,
      domEl: relEl(dom), lackEl: relEl(lack),
      jaeEl: relEl('재성'), gwanEl: relEl('관성'), sikEl: relEl('식상'), inEl: relEl('인성'), biEl: relEl('비겁'),
      dayB: chart.pillars.day.branchName, dayBk: chart.pillars.day.branchKo,
      dayBranch: chart.pillars.day.branch,
      dayG: chart.gods.dayBranch, dayStage: chart.stages.day,
      monB: chart.pillars.month.branchName, monBk: chart.pillars.month.branchKo,
      monG: chart.gods.monthBranch, monStage: chart.stages.month,
      hourB: chart.pillars.hour ? chart.pillars.hour.branchName : '',
      sal: daySal, salHits: salHits,
      cheonChars: cheon.chars.join('·'), cheonHit: cheon.hits.length > 0,
      cheonWhere: cheon.hits.join(' · '),
      cheondeok: chart.gwisin.cheondeok, woldeok: chart.gwisin.woldeok,
      strongEl: strongEl, thinEl: thinEl,
      pct: chart.pct, counts: c, groups: g,
      yinPct: chart.yinyang.yinPct, yangPct: chart.yinyang.yangPct,
      daeun: null,
      dayBranchEl: chart.pillars.day.branchElem,
      stageName: chart.stages.day
    };
    f.dm = DM[f.stem];
    f.y = YONG[f.yong];
    f.str = STR[f.strongKey];
    f.domT = GMAIN[f.dom];
    f.lackT = GLACK[f.lack];
    f.jg = JGOD[f.dayG];
    f.salT = SAL[f.sal];
    try { f.daeun = P.buildDaeun(chart).current; } catch (e) { f.daeun = null; }
    chart.__rx = f;
    return f;
  }

  function asF(x) { return (x && x.chart) ? x : facts(x); }
  function pick(list, seed) { return list[Math.abs(seed) % list.length]; }
  function seed(chart, tag) { return E.hash(chart.ganji + '|' + tag + '|' + chart.strengthKo); }
  /* 개수 표기 — 0은 목록에 넣지 않고 '비어 있다'로 따로 말한다 */
  function zeroSafe(f, k) { return f.groups[k] > 0 ? k + ' ' + f.groups[k] + '개' : null; }
  function liveList(f, keys) { return keys.map(function (k) { return zeroSafe(f, k); }).filter(Boolean).join(' · '); }
  function emptyList(f, keys) { return keys.filter(function (k) { return f.groups[k] === 0; }); }
  function thinPhrase(f) {
    return f.lackN === 0 ? '원국에 아예 없는 ' + f.lack
      : f.lackN === 1 ? '한 자리뿐인 ' + f.lack
      : '가장 얇은 ' + f.lack + ' ' + f.lackN + '개';
  }
  function josa(w, a, b) { return E.josa(w, a, b); }

  /* ---------------- 주제별 처방 ---------------- */
  var TOPIC = {
    love: {
      label: '연애·인연', yx: 'social',
      ans: [
        function (f) { return '일간 ' + f.dmKey + '에 ' + f.strong + '이고, 용신이 ' + f.yong + '인 사주의 연애는 ' + f.dm.social + '입니다. 상대를 고르는 기준도 조건보다 ' + (f.yong === '수' ? '대화의 깊이' : f.yong === '목' ? '새로 시작하는 사람의 기세' : f.yong === '화' ? '표현이 분명한 태도' : f.yong === '토' ? '생활이 정돈된 태도' : '선이 분명한 태도') + '에 두세요. 이 사주는 그 결이 맞는 사람에게 오래 갑니다.'; },
        function (f) { return '일지 ' + f.dayB + '(' + f.dayBk + ')에 ' + f.dayG + '이 앉은 자리가 이 사주의 배우자궁입니다. ' + f.jg.read + '. 그래서 연애의 답은 상대를 바꾸는 데 있지 않습니다. ' + f.jg.act + '. '; }
      ],
      god: function (f) { var live = liveList(f, ['관성', '재성']); var tot = f.groups.관성 + f.groups.재성; return '인연의 통로는 ' + (live || '비어 있음') + '입니다. ' + (tot === 0 ? '관성(책임·평가의 기운)과 재성(돈·결과물의 기운)이 모두 원국에 없어, 관계는 기다린다고 오지 않고 내가 벌여야 열립니다.' : (f.groups.관성 === 0 ? '관성(책임·평가의 기운)은 원국에 없으니 상대가 나를 골라 주기를 기다리면 늦습니다. ' : '') + (f.groups.재성 === 0 ? '재성(돈·결과물의 기운)도 없어 관계가 생활로 이어지기까지 시간이 걸립니다. ' : '')) + '이 사주는 ' + (tot === 0 ? '먼저 움직이지 않으면 아무 일도 일어나지 않는 쪽' : f.groups.재성 > f.groups.관성 ? '내가 챙기고 표현할 때 관계가 깊어지는 쪽' : f.groups.관성 > f.groups.재성 ? '상대가 나를 선택하는 방식으로 관계가 시작되는 쪽' : '주고받는 속도가 비슷해 먼저 나서는 쪽이 판을 잡는 쪽') + '입니다.'; },
      verdict: function (f) { return '정리하면 ' + f.dm.img + '의 결에 ' + f.yong + ' 기운을 채우는 만남이 답입니다. ' + SAL[f.sal].read + '. 이 사주에서는 ' + SAL[f.sal].act + '.'; },
      step: [
        function (f) { return '이번 주에 마음이 가는 사람에게 ' + YONG[f.yong].time + ' 안에 짧은 안부를 한 번 보내세요 — 용신 ' + E.josa(f.yong, '이', '가') + ' 살아나는 시간대라 말이 부드럽게 닿습니다'; },
        function (f) { return f.jg.act + '. ' + f.dayG + '이 일지에 앉은 사주는 이 한 걸음이 관계의 온도를 바꿉니다'; },
        function (f) { return '만남의 자리는 ' + YONG[f.yong].place + ' 쪽으로 잡으세요. ' + f.yong + ' 기운이 있는 공간에서 이 사주의 말이 잘 통해집니다'; }
      ],
      cau: [
        function (f) { return GMAIN[f.dom].risk + ' — 연애에서도 ' + f.dom + ' ' + f.domN + '개가 먼저 나서면 상대가 물러납니다'; },
        function (f) { return f.sal === '년살(도화)' ? '도화가 ' + (f.salHits.filter(function (s) { return s.name === f.sal; })[0] || {}).where + '에 앉아 있어 호의가 쉽게 생깁니다. 호의와 약속을 구분하지 않으면 진짜 인연이 흐려집니다' : SAL[f.sal].risk + '. 이것이 관계의 걸림돌이 됩니다'; }
      ]
    },
    reunion: {
      label: '재회·연락', yx: 'social',
      ans: [
        function (f) { return '재회는 마음의 크기보다 때와 방식이 결과를 바꿉니다. 이 사주는 ' + f.dmKey + ' 일간에 ' + f.dayG + '이 일지에 앉아 ' + (f.dayG === '편관' || f.dayG === '정관' ? '한번 끊긴 관계를 쉽게 되돌리지 못하는 구조' : f.dayG === '정인' || f.dayG === '편인' ? '상대의 기억을 오래 품는 구조' : '다시 손을 내미는 데 자존심이 걸리는 구조') + '입니다. 그래서 연락은 감정이 아니라 형식으로 시작해야 합니다.'; },
        function (f) { return '일지 ' + f.dayB + '와 2027년 未토는 ' + relLabel(f) + '입니다. ' + (relHas(f, '합') ? '합은 묶이는 자리라 끊긴 인연이 다시 이어지기 좋은 해입니다.' : relHas(f, '충') ? '충은 부딪히는 자리라 미련이 정리되고 새 사람이 들어오는 해입니다.' : '해의 기운이 크게 작용하지 않으니 달의 타이밍이 결과를 가릅니다.') + ' ' + f.dm.img + '의 사주는 기다리기보다 한 번의 분명한 안부에서 방향이 정해집니다.'; }
      ],
      god: function (f) { var tot = f.groups.관성 + f.groups.재성; var live = liveList(f, ['관성', '재성']); return (tot ? '이 사주에서 인연의 통로는 ' + tot + '개(' + live + ')입니다. ' : '이 사주는 인연의 통로가 비어 있습니다. ') + (tot === 0 ? '관성(책임·평가의 기운)과 재성(돈·결과물의 기운)이 모두 원국에 없어, 먼저 움직이지 않으면 아무 일도 일어나지 않습니다.' : '통로가 있어 한 번의 접촉이 관계로 이어질 수 있습니다. 다만 ' + thinPhrase(f) + ' 자리가 약해 ' + GLACK[f.lack].act + '.'); },
      verdict: function (f) { return '정리하면 재회의 답은 “기다림”이 아니라 ' + YONG[f.yong].social + '입니다. ' + (f.cheonHit ? '사주 ' + f.cheonWhere + '에 천을귀인이 앉아 있어, 결정적인 순간에 중간에서 말을 전해 줄 사람이 생깁니다.' : '천을귀인 자리(' + f.cheonChars + ')가 사주에 없어 중간에서 다리를 놓아 줄 사람은 내가 먼저 만들어야 합니다.'); },
      step: [
        function (f) { return '첫 연락은 ' + YONG[f.yong].time + '에 짧게 하세요. ' + f.yong + ' 기운이 열리는 시간이라 상대가 부담을 덜 느낍니다'; },
        function (f) { return '용건은 두 번째 대화로 미루고, 첫 문장은 ' + (f.dayG === '정인' || f.dayG === '편인' ? '그 사람이 좋아하던 것 하나를 기억했다는 말' : '안부 한 줄') + '로 끝내세요 — ' + f.dayB + ' 일지의 ' + f.dayG + ' 결에 맞는 방식입니다'; },
        function (f) { return '재회 전에 그때의 문제를 세 줄로 적어 보세요. ' + f.dom + ' ' + f.domN + '개인 이 사주는 같은 자리로 돌아가면 같은 방식으로 부딪힙니다'; }
      ],
      cau: [
        function (f) { return '밤 11시 이후의 긴 문자는 이 사주에서 관계를 한 단계 뒤로 물립니다 — ' + E.josa(f.dmKey, '은', '는') + ' ' + f.dm.shadow + '. 그 결이 나오면 감정이 앞서 말이 길어집니다'; },
        function (f) { return SAL[f.sal].risk + '. 이것이 재회의 변수입니다. ' + SAL[f.sal].act + ' ' + f.sal + '이 ' + (f.salHits[0] ? f.salHits[0].where : '사주') + '에 걸려 있습니다'; }
      ]
    },
    heart: {
      label: '상대의 속마음', yx: 'social',
      ans: [
        function (f) { return '상대의 마음은 이 사주가 사람을 읽는 방식과 겹쳐 보입니다. 일간 ' + f.dmKey + '에 ' + f.dom + '이 ' + f.domN + '개인 사주는 ' + GMAIN[f.dom].read + '. 그래서 상대의 침묵을 ' + (f.dom === '인성' ? '생각이 길어지는 신호로 읽으세요. 답이 없는 것이 아니라 정리 중인 것입니다' : f.dom === '관성' ? '책임을 재는 신호로 읽으세요. 가볍게 답하지 않는 사람일 뿐입니다' : f.dom === '식상' ? '표현이 앞서는 신호로 읽으세요. 말이 많은 날이 마음이 큰 날입니다' : f.dom === '재성' ? '현실 조건을 계산하는 신호로 읽으세요. 조건이 정리되어야 마음이 움직입니다' : '주도권을 재는 신호로 읽으세요. 먼저 답하기를 기다리는 쪽입니다') + '.'; },
        function (f) { return '일지 ' + f.dayB + '의 ' + f.dayG + '과 그 자리의 오행 ' + f.dayBranchEl + '을 보면, 이 사주는 ' + (f.jg.read) + '. 상대에게 확인하고 싶은 마음이 클수록 ' + f.jg.act + '. 이 습관이 실제 답을 앞당깁니다.'; }
      ],
      god: function (f) { var live = liveList(f, ['인성', '식상']); return '이 사주가 마음을 읽는 통로는 ' + (live || '인성·식상 모두 비어 있음') + '입니다. ' + (f.groups.인성 > f.groups.식상 ? '읽는 힘은 좋은데 표현이 늦어, 상대는 이 사주가 마음이 없는 줄 압니다.' : f.groups.식상 > f.groups.인성 ? '표현이 먼저 나가 상대의 속도보다 반 박자 앞섭니다. 한 번 멈추면 오히려 깊어집니다.' : '읽기와 표현의 균형이 좋아, 확인하는 한마디가 관계를 정리합니다.') + ' ' + (f.lackN === 0 ? f.lack + ' 자리는 원국에 아예 없습니다. ' + GLACK[f.lack].act + '.' : thinPhrase(f) + ' 자리를 의식하세요 — ' + GLACK[f.lack].act + '.'); },
      verdict: function (f) { return '결론은 상대의 마음이 아니라 ' + f.dmKey + '의 ' + f.yong + ' 기운을 채우는 데서 갈립니다. ' + YONG[f.yong].act + ' — 이걸 한 주만 지켜 보면 ' + f.dayB + ' 일지의 ' + f.dayG + '이 상대의 반응을 바꿉니다.'; },
      step: [
        function (f) { return '말로 확인하려 하지 말고 ' + YONG[f.yong].place + '에서 만남의 자리를 한 번 만드세요 — 이 사주는 대화보다 분위기에서 마음이 드러납니다'; },
        function (f) { return '연락 빈도를 지금의 절반으로 줄여 보세요. ' + f.dom + ' ' + f.domN + '개인 사주는 기다릴 때 상대 쪽에서 먼저 움직입니다'; },
        function (f) { return '내 마음을 한 번은 분명히 표현하세요. ' + f.dayB + ' 일지의 ' + f.dayG + '은 흐리는 쪽을 더 오래 앓습니다'; }
      ],
      cau: [
        function (f) { return '제3자를 통해 마음을 확인하는 방식은 ' + f.dmKey + ' 사주에서 신뢰를 가장 빨리 잃는 길입니다'; },
        function (f) { return f.cheonHit ? '사주에 ' + f.cheonWhere + ' 천을귀인이 있어 도움은 들어옵니다. 다만 귀인에게 모든 판단을 맡기면 내 몫의 결정이 사라집니다' : '천을귀인 ' + f.cheonChars + '이 사주에 없어, 판단을 남에게 맡기면 답이 늦어집니다'; }
      ]
    },
    money: {
      label: '재물', yx: 'money',
      ans: [
        function (f) { return '재물의 답은 액수가 아니라 통로와 구멍입니다. ' + f.dmKey + ' 일간에 ' + f.strong + '이고, 이 사주의 재성(돈·결과물의 기운)은 ' + (f.groups.재성 ? f.groups.재성 + '개 — 오행 ' + f.jaeEl : '원국에 없습니다. 재성 오행인 ' + f.jaeEl) + '(' + HANJA[f.jaeEl] + ')입니다. ' + (f.groups.재성 === 0 ? '재성이 원국에 없어 돈이 직접 들어오는 문이 새겨지지 않았습니다. 만들어 파는 일을 먼저 해야 돈이 붙습니다.' : f.groups.재성 >= 3 ? '재성이 여러 개 겹쳐 기회는 많지만 손도 함께 커지는 구조입니다.' : '재성이 자리를 잡고 있어 벌이의 그릇은 충분합니다. 문제는 지키는 장치입니다.') + ' 용신 ' + f.yong + ' 기운이 이 사주의 돈길입니다.'; },
        function (f) { return '일지 ' + f.dayB + '에 앉은 ' + f.dayG + '이 돈을 다루는 방식입니다. ' + f.jg.read + '. ' + f.jg.act + ' — 재성 ' + (f.groups.재성 ? f.groups.재성 + '개(오행 ' + f.jaeEl + ')' : '자리는 원국에 없지만') + ' 이 방식으로 움직이면 새는 돈이 줄어듭니다.'; },
      ],
      god: function (f) { var live = liveList(f, ['식상', '인성', '비겁']); var miss = emptyList(f, ['식상', '인성', '비겁']); return (live ? '이 사주에서 돈이 들어오는 길은 ' + live + '입니다.' : '식상·인성·비겁 자리가 모두 비어 있어, 돈은 재성(재물 그 자체)에서만 움직입니다.') + ' ' + (f.groups.식상 >= 2 ? '기술과 콘텐츠로 만들어 파는 길이 가장 넓습니다.' : f.groups.인성 >= 2 ? '자격과 문서, 쌓이는 자산이 돈이 되는 구조입니다.' : f.groups.비겁 >= 2 ? '사람이 곧 매출입니다. 다만 같이 쓰는 돈에서 새기 쉽습니다.' : '한 우물을 오래 파서 두터워지는 구조입니다.') + ' ' + (miss.length ? miss.join('·') + ' 자리는 원국에 없으니 억지로 만들기보다 있는 길을 넓히는 쪽이 빠릅니다.' : '세 자리가 모두 살아 있어 어느 길로도 열 수 있으니, 가장 두터운 쪽부터 밀면 됩니다.'); },
      verdict: function (f) { return '정리하면 이 사주의 돈은 ' + f.yong + ' 기운을 채우는 생활에서 먼저 늘어납니다. ' + YONG[f.yong].money + '. ' + (f.cheonHit ? '여기에 ' + f.cheonWhere + '의 천을귀인이 겹쳐, 소개와 연결이 실제 수입으로 이어지는 자리가 있습니다.' : '귀인은 사주에 없으니 소개를 기다리지 말고 먼저 만나야 합니다.'); },
      step: [
        function (f) { return E.moneyLeaks(f.chart)[0].fix + ' — 이 사주의 1순위 구멍은 “' + E.moneyLeaks(f.chart)[0].title + '”입니다'; },
        function (f) { return '수입의 10%를 ' + f.yong + ' 기운의 자산(' + YONG[f.yong].item + ' 같은 결)으로 자동이체하세요. 용신이 ' + f.yong + '인 사주는 그 방향의 저축이 가장 잘 남습니다'; },
        function (f) { return '이번 달에 ' + f.jaeEl + ' 재성 통로를 하나만 늘리세요. ' + f.dom + ' ' + f.domN + '개 구조라 두 개를 동시에 벌이면 둘 다 어설퍼집니다'; }
      ],
      cau: [
        function (f) { return (f.groups.재성 ? '재성이 ' + f.groups.재성 + '개인 이 사주는 ' : '재성이 원국에 없는 이 사주는 ') + (f.groups.재성 >= 3 ? '들어온 만큼 나가는 길도 넓어, 통장을 분리하지 않으면 남는 것이 없습니다' : f.groups.재성 === 0 ? '벌이가 막히면 곧바로 생활이 흔들립니다. 고정 수입 하나를 먼저 지키세요' : '큰 지출 한 번이 몇 달을 되돌립니다. 결제 전 하루를 두세요'); },
        function (f) { return '용신 ' + E.josa(f.yong, '이', '가') + ' ' + f.pct[f.yong] + '%뿐인 사주는 돈을 ' + YONG[f.yong].place + ' 쪽으로 쓸 때 남습니다 — ' + f.dmKey + '의 지출 습관을 한 번 점검하세요'; }
      ]
    },
    work: {
      label: '직업·사업', yx: 'money',
      ans: [
        function (f) { var live = liveList(f, ['관성', '식상', '재성', '인성', '비겁']); var miss = emptyList(f, ['관성', '식상', '재성', '인성', '비겁']); return '일의 답은 이 사주가 어디서 힘이 나는지에 달려 있습니다. 여덟 글자는 ' + live + '로 짜여 있고, ' + f.dmKey + ' 일간에 ' + f.strong + '인 형세가 겹쳐 ' + (f.groups.관성 >= 2 ? '조직과 자격이 힘이 되는 자리' : f.groups.식상 >= 2 ? '만들어 내놓는 일에서 성과가 나는 자리' : f.groups.비겁 >= 2 ? '내 이름으로 판을 여는 자리' : f.groups.재성 >= 2 ? '성과가 숫자로 남는 자리' : '한 우물을 깊게 파는 자리') + '입니다. ' + (miss.length ? miss.join('·') + ' 자리는 비어 있으니 그 자리는 스스로 기준을 세워 채워야 합니다.' : '다섯 자리가 다 있어 어느 쪽으로도 설 수 있으니, 두터운 쪽을 먼저 고르세요.'); },
        function (f) { return '월지 ' + f.monB + '(' + f.monBk + ')의 ' + f.monG + '과 12운성 ' + f.monStage + '이 사회에서 서는 자리이고, 일지 ' + f.dayB + '의 ' + f.dayG + '이 일을 대하는 방식입니다. ' + f.jg.read + '. 그래서 ' + f.jg.act + '. 이 습관이 이 사주의 승진 조건입니다.'; }
      ],
      god: function (f) { var ph = thinPhrase(f); return E.josa(ph, '이', '가') + ' 일의 약점입니다. ' + (f.lackN === 0 ? '' : GLACK[f.lack].read + '. ') + GLACK[f.lack].act + '. 가장 두터운 ' + f.dom + ' ' + f.domN + '개는 무기이자 습관이라, ' + GMAIN[f.dom].act + '를 의식적으로 해야 균형이 잡힙니다.'; },
      verdict: function (f) { return f.strongKey === 'weak' ? '지금 당장의 독립은 권하지 않습니다. ' + f.dmKey + ' ' + f.strong + ' — ' + STR.weak.read + ' — 재직 중에 부업으로 6개월 검증하고, 본업 월급의 30%를 세 번 연속 벌어 보면 그때 나가도 늦지 않습니다.' : f.strongKey === 'strong' ? '결정권이 있는 자리로 옮기는 것이 맞습니다. ' + STR.strong.read + ' — 다만 사람을 크게 쓰는 확장은 한 박자 늦추세요. 인건비가 매출보다 먼저 늘어나는 순간이 가장 위험합니다.' : '한 자리에서 깊어지는 쪽이 이 사주에 맞습니다. ' + STR.balanced.read + ' — 3년을 한 분야에 두면 대우가 따라옵니다.'; },
      step: [
        function (f) { return '이직을 생각한다면 지금은 조건을 모으는 단계로 쓰세요. ' + f.monB + ' 월지의 ' + f.monG + '이 말하는 자리로 옮겨야 오래 갑니다'; },
        function (f) { return '성과 하나를 문서로 남기세요. ' + f.dmKey + ' 사주는 말보다 기록이 평가를 바꿉니다'; },
        function (f) { return '이번 주에 ' + f.dom + ' ' + f.domN + '개를 한 번 덜어내세요 — 회의 하나, 약속 하나를 정리하면 판단이 살아납니다'; }
      ],
      cau: [
        function (f) { return '감정으로 사표를 던지는 방식은 ' + f.dmKey + ' 사주에서 가장 비싼 실수입니다. ' + f.dm.shadow + '. 그 결이 바로 그 순간에 나옵니다'; },
        function (f) { return (f.groups.관성 ? '관성이 ' + f.groups.관성 + '개인 이 사주는 ' : '관성이 원국에 없는 이 사주는 ') + (f.groups.관성 === 0 ? '평가와 규율의 자리가 비어 있어 스스로 기준을 세우지 않으면 일이 흐려집니다' : '윗사람과의 인연이 곧 승진의 문입니다. 관계를 한 번 정리하세요'); }
      ]
    },
    exam: {
      label: '시험·공부', yx: 'study',
      ans: [
        function (f) { var live = liveList(f, ['인성', '관성', '식상']); var miss = emptyList(f, ['인성', '관성', '식상']); return '공부의 답은 재능이 아니라 리듬입니다. 이 사주는 ' + f.dmKey + ' 일간에 ' + f.strong + '이고, ' + live + '로 짜여 있습니다. ' + (f.groups.인성 >= 2 ? '인성이 두터워 문서운이 강합니다. 늦게 시작해도 오래 가는 쪽입니다.' : f.groups.인성 === 0 ? '인성(배움·보호의 기운)이 원국에 없어 배움의 자리가 좁습니다. 혼자 읽기보다 설명과 반복으로 채워야 합니다.' : '인성이 한 자리 있어 꾸준함이 성적을 만듭니다.') + (miss.length ? ' ' + miss.join('·') + ' 자리는 비어 있으니 의식해서 채우세요.' : '') + ' 용신 ' + f.yong + '의 시간을 공부 시간으로 쓰는 것이 핵심입니다.'; },
        function (f) { return '일간 ' + f.dmKey + '에는 ' + E.josa(f.dm.study, '이', '가') + ' 맞습니다. ' + f.dm.shadow + '. 그래서 ' + f.dm.body + '. 이 습관을 공부에도 그대로 적용하세요. 일지 ' + f.dayB + '의 ' + f.dayG + '도 같은 방향을 가리킵니다.'; }
      ],
      god: function (f) { return (f.groups.식상 ? '집중을 방해하는 자리는 ' + f.sikEl + ' 식상 ' + f.groups.식상 + '개입니다. ' + (f.groups.식상 >= 2 ? '표현이 앞서 필기가 산만해집니다. 한 단원을 끝낸 뒤에 정리하세요.' : '표현이 적어 머릿속에만 쌓입니다. 소리 내어 설명하며 외우세요.') : '식상(표현의 기운)이 원국에 없어 배운 것이 머릿속에만 쌓입니다. 소리 내어 설명하며 외우세요.') + ' 가장 두터운 ' + f.dom + ' ' + f.domN + '개는 공부에도 그대로 나옵니다. ' + GMAIN[f.dom].act + ' — 이 태도를 시험 공부에 옮기면 됩니다.'; },
      verdict: function (f) { return '정리하면 합격의 문은 ' + f.yong + ' 기운이 살아나는 ' + YONG[f.yong].time + '에 열립니다. ' + YONG[f.yong].study + '. ' + f.dmKey + ' 사주는 벼락치기보다 ' + E.josa(f.dm.study, '이', '가') + ' 점수를 만듭니다.'; },
      step: [
        function (f) { return '공부 시작 시간을 ' + YONG[f.yong].time + '로 고정하세요 — 용신 ' + E.josa(f.yong, '이', '가') + ' 가장 살아나는 시간이고, 이 사주는 그 시간에 앉은 날과 안 앉은 날의 차이가 큽니다'; },
        function (f) { return f.dm.study + ' 방식으로 오늘 한 단원만 끝내세요. ' + E.josa(f.dmKey, '은', '는') + ' 방식이 틀리면 시간만 늘고 점수는 서지 않습니다'; },
        function (f) { return f.strongKey === 'weak' ? '혼자 4시간보다 둘이 2시간이 이 사주에 맞습니다. 스터디 하나를 이번 주에 구하세요' : '혼자 2시간을 방해 없이 확보하세요. ' + E.josa(f.dmKey, '은', '는') + ' 밀어붙일 때 집중이 살아납니다'; }
      ],
      cau: [
        function (f) { return '잠을 줄이는 공부는 ' + f.dmKey + ' 사주에서 성적을 깎습니다. ' + f.thinEl + ' 기운이 ' + f.pct[f.thinEl] + '%로 얇아 밤을 새면 그 자리가 먼저 무너집니다'; },
        function (f) { return f.sal === '화개살' ? '화개가 ' + (f.salHits[0] ? f.salHits[0].where : '사주') + '에 앉아 혼자 몰입은 강하지만 사람을 끊으면 오히려 막힙니다. 하루 한 번은 설명할 사람을 만나세요' : '시험 기간에는 ' + f.sal + '의 작용이 ' + (f.salHits[0] ? f.salHits[0].where : '사주') + '에서 먼저 나타납니다 — ' + f.dmKey + '의 집중은 이 자리에서 흔들립니다'; }
      ]
    },
    health: {
      label: '건강·생활', yx: 'body',
      ans: [
        function (f) { return '몸의 답은 오행의 얇은 자리에서 나옵니다. 이 사주는 ' + E.josa(f.thinEl, '이', '가') + ' ' + f.pct[f.thinEl] + '%로 가장 얇고 ' + E.josa(f.strongEl, '이', '가') + ' ' + f.pct[f.strongEl] + '%로 두텁습니다. ' + f.dmKey + ' 일간에 ' + f.strong + '이라 ' + (f.strongKey === 'weak' ? '기운을 쓰는 일이 많으면 회복이 늦습니다.' : f.strongKey === 'strong' ? '기운이 넘쳐 열과 긴장으로 나타납니다.' : '큰 병보다 쌓인 피로가 문제입니다.') + ' 약한 자리는 ' + E.ELEM_DEEP[f.thinEl].organ + '입니다.'; },
        function (f) { return '일지 ' + f.dayB + '의 12운성은 ' + f.dayStage + ' — ' + E.STAGE_DEEP[f.dayStage] + '. 그래서 이 사주는 ' + (['병', '사', '묘', '절'].indexOf(f.dayStage) >= 0 ? '생활 자체를 조금 비워야 몸이 회복됩니다. 일정을 줄이는 것이 약보다 먼저입니다.' : '생활 리듬을 크게 흔들지 않는 것이 최선입니다. 갑작스러운 무리는 다음 주에 청구서로 옵니다.') + ' ' + f.dm.img + '의 결은 ' + f.dm.gift + '이지만, 반대로 ' + f.dm.shadow + '.'; }
      ],
      god: function (f) { return '체력을 쓰는 방식은 ' + f.dom + ' ' + f.domN + '개가 정합니다. ' + GMAIN[f.dom].read + ' — 그래서 ' + GMAIN[f.dom].risk + '. ' + (f.lackN === 0 ? f.lack + ' 자리는 원국에 아예 없어 ' + GLACK[f.lack].act + '.' : thinPhrase(f) + ' 자리는 ' + GLACK[f.lack].read + '.') + ' 몸에서는 이 자리가 먼저 신호를 보냅니다.'; },
      verdict: function (f) { return '정리하면 회복법은 약이 아니라 순서입니다. ' + YONG[f.yong].body + '. ' + E.ELEM_DEEP[f.thinEl].care + '부터 시작하세요. 증상이 반복되면 사주 해석보다 진료가 먼저입니다.'; },
      step: [
        function (f) { return '잠자는 시간을 ' + YONG[f.yong].time + ' 기준으로 당겨 고정하세요. 용신 ' + f.yong + '의 시간이 이 사주의 회복 시간입니다'; },
        function (f) { return E.ELEM_DEEP[f.thinEl].care + ' — ' + f.thinEl + ' ' + f.pct[f.thinEl] + '%인 이 사주가 가장 먼저 채워야 할 자리입니다'; },
        function (f) { return '하루 15분 걷기를 ' + f.strongEl + ' 기운을 식히는 방향(' + YONG[f.yong].place.split('·')[0] + ')으로 하세요'; }
      ],
      cau: [
        function (f) { return E.josa(f.strongEl, '이', '가') + ' ' + f.pct[f.strongEl] + '%로 넘쳐 ' + E.ELEM_DEEP[f.strongEl].over + ' — 이 사주의 피로는 이 자리에서 시작됩니다'; },
        function (f) { return f.strongKey === 'weak' ? '신약한 몸으로 무리한 일정을 소화하면 ' + f.thinEl + ' 자리가 먼저 상합니다. 하루를 통째로 쉬는 편이 약보다 낫습니다' : '기운이 강해 몸이 보내는 신호를 늦게 알아챕니다. 검진 일정을 먼저 달력에 넣으세요'; }
      ]
    },
    fate: {
      label: '인생 흐름', yx: 'act',
      ans: [
        function (f) { return '여덟 글자를 세워 보면 ' + f.ganji + '(' + f.ganjiKo + ')에 일간 ' + f.dmKey + ', ' + f.strong + ', 용신 ' + f.yong + '입니다. ' + f.dm.img + '의 결은 ' + f.dm.gift + '이고, 반대로 ' + f.dm.shadow + '. 지금의 고민은 이 결이 세상과 부딪히는 자리에서 생깁니다.'; },
        function (f) { return '질문의 답은 이 사주의 중심 ' + f.dom + '(' + f.domN + '개)과 ' + thinPhrase(f) + ' 사이에 있습니다. ' + GMAIN[f.dom].read + '. ' + (f.lackN === 0 ? '' : GLACK[f.lack].read + '. ') + '그래서 ' + GMAIN[f.dom].act + '. 그리고 ' + GLACK[f.lack].act + ' — 두 가지를 함께 가져가야 합니다.'; }
      ],
      god: function (f) { return '일지 ' + f.dayB + '에 앉은 ' + f.dayG + '이 답의 형식을 정합니다. ' + f.jg.read + '. ' + f.jg.act + '. 여기에 ' + SAL[f.sal].read + '. 여기에 ' + SAL[f.sal].act + '.'; },
      verdict: function (f) { return '정리하면 이 사주의 답은 오행 ' + f.yong + '(' + HANJA[f.yong] + ')를 채우는 선택입니다. ' + YONG[f.yong].act + '. ' + (f.daeun ? '지금은 ' + f.daeun.hanja + ' ' + f.daeun.stemGod + ' 대운(' + f.daeun.ageFrom + '~' + f.daeun.ageTo + '세) 안이라, 이 선택이 다음 10년의 방향을 정합니다.' : '아직 첫 대운 전이라 부모와 환경의 그릇이 먼저 작동하는 시기입니다.'); },
      step: [
        function (f) { return '이번 달 안에 ' + YONG[f.yong].act + '. 이걸 21일만 반복해 보세요. 용신 ' + E.josa(f.yong, '이', '가') + ' ' + f.pct[f.yong] + '%인 이 사주는 그 반복이 판단의 바닥을 바꿉니다'; },
        function (f) { return f.dm.body + '. ' + f.dayG + '이 일지에 앉은 사주라 이 한 습관이 결정의 속도를 바꿉니다'; },
        function (f) { return f.lackT.act + '. ' + (f.lackN === 0 ? f.lack + '이 원국에 아예 없는' : f.lack + '이 ' + f.lackN + '개로 얇은') + ' 이 사주가 가장 먼저 채워야 할 자리입니다'; }
      ],
      cau: [
        function (f) { return f.dm.shadow + ' — 이 결이 결정적인 순간에 나오면 그 판은 되돌리기 어렵습니다'; },
        function (f) { return '가장 많은 ' + f.dom + ' ' + f.domN + '개를 믿고 밀면 ' + f.lack + '이 얇은 자리에서 일이 새어 나갑니다. ' + f.lackT.read; }
      ]
    }
  };

  function relLabel(f) {
    var rel = Y27 ? Y27.relOf(7, f.dayBranch) : [];
    return rel.length ? rel.map(function (r) { return E.plain(r); }).join('·') : '충·합이 없는';
  }
  function relHas(f, k) {
    var rel = Y27 ? Y27.relOf(7, f.dayBranch) : [];
    return rel.indexOf(k) >= 0;
  }

  /* ---------------- 14. 질문에 대한 답 ---------------- */
  function core(chart, cat) {
    var f = asF(chart);
    var t = TOPIC[cat] || TOPIC.fate;
    var s = seed(f.chart, 'core' + cat);
    var lead = '질문하신 ' + t.label + '의 답부터 정리합니다. 여덟 글자는 ' + f.ganji + '이고, 일간은 ' + f.dmKey + '(' + f.dmk + f.dme + '), 형세는 ' + f.strong + ', 용신은 ' + f.yong + ', 희신은 ' + f.hee + '입니다. 그래서 답도 일반론이 아니라 이 여덟 글자 위에서 내리겠습니다.';
    var paras = [
      pick(t.ans, s)(f),
      t.god(f),
      t.verdict(f)
    ];
    return { lead: lead, paras: paras };
  }

  /* ---------------- 15. 시기와 흐름 ---------------- */
  function timing(chart, cat) {
    var f = asF(chart);
    var t = TOPIC[cat] || TOPIC.fate;
    var items = [];
    var d = f.daeun;
    if (d) {
      items.push('지금은 ' + d.hanja + '(' + d.ko + ') ' + d.stemGod + '·' + d.branchGod + ' ' + E.plain('대운') + '의 ' + d.stage + ' 자리(' + d.ageFrom + '~' + d.ageTo + '세, ' + d.yearFrom + '~' + d.yearTo + '년)입니다. ' + E.STAGE_DEEP[d.stage] + '. 내 일간 ' + f.dmKey + '에 ' + E.josa(d.stemGod, '이', '가') + ' 들어온 10년이니, ' + t.label + '의 결정은 이 대운의 속도에 맞춰야 합니다.');
    } else {
      items.push('아직 첫 대운이 열리기 전입니다. 이 시기는 내 사주보다 부모와 환경의 그릇이 먼저 작동합니다. 일간 ' + f.dmKey + '의 결대로 ' + f.dm.body + '를 먼저 지키세요.');
    }
    var y = null;
    try { y = Y27 ? Y27.build(f.chart) : null; } catch (e) { y = null; }
    if (y) {
      var gods = { money: ['편재', '정재'], work: ['정관', '편관'], exam: ['정인', '편인', '정관'], love: ['정재', '편관', '정관'], reunion: ['정재', '정관'], heart: ['정재', '정관'], health: ['편인', '정인'], fate: [] }[cat] || [];
      var hit = y.months.filter(function (m) { return gods.indexOf(m.god) >= 0 || gods.indexOf(m.branchGod) >= 0; });
      var yMon = y.months.filter(function (m) { return m.stemElem === f.yong || m.branchElem === f.yong; });
      var openList = hit.length ? hit.map(function (m) { return m.no + '월(' + m.hanja + ')'; }).join(' · ') : '뚜렷하지 않음';
      items.push('2027 정미년 ' + E.plain('월운') + '에서 ' + t.label + '의 문이 열리는 달은 ' + (hit.length ? openList + '입니다.' : '뚜렷하지 않습니다.') + ' 이 사주의 일지 ' + E.josaHan(f.dayB + '(' + f.dayBk + ')', f.dayBk, '은', '는') + ' 2027년 未토와 ' + relLabel(f) + ' 관계입니다. 그중 ' + (y.good[0].no) + '월(' + y.good[0].hanja + ')이 흐름 점수 ' + y.good[0].score + '점으로 가장 높습니다.');
      items.push('용신 ' + E.josa(f.yong, '이', '가') + ' 들어오는 달은 ' + (yMon.length ? yMon.map(function (m) { return m.no + '월'; }).join(' · ') : '없음') + '이고, 피해야 할 달은 ' + y.warn.map(function (m) { return m.no + '월'; }).join(' · ') + '입니다. ' + f.dmKey + ' 사주는 이 달들에 큰 결정을 몰아 두고, 나머지 달은 ' + (f.strongKey === 'weak' ? '체력과 사람을 정비하는 데' : '검토와 정리에') + ' 쓰면 됩니다.');
    } else {
      items.push('시기는 이 사주의 월지 ' + f.monB + '(' + f.monG + ')가 움직이는 절기를 기준으로 잡습니다. 다음 절입은 ' + (f.chart.month.nextAt ? (f.chart.month.nextAt.m + '월 ' + f.chart.month.nextAt.d + '일') : '확인 필요') + '입니다.');
    }
    return {
      items: items,
      para: '큰 결정은 날짜로 정해 두세요. 좋은 달이 나왔다면 그 달 첫째 주에 할 일을 하나만 적고, 그날은 비워 두는 것이 이 사주의 방식입니다. ' +
        '시기를 정할 때는 감이 아니라 달력으로 정하세요. 이 사주는 ' + f.yong + ' 기운이 들어오는 달에 결정하고, ' + (f.strongKey === 'strong' ? '힘이 넘치는 달에는 일을 벌이되 사람을 크게 쓰는 결정은 한 달 미루는' : f.strongKey === 'weak' ? '기운이 빠지는 달에는 새 일을 벌이지 않고 이미 벌인 것을 끝내는' : '흐름이 고른 만큼 기한을 스스로 정해 밀어붙이는') + ' 방식이 가장 안전합니다.'
    };
  }

  /* ---------------- 16. 지금 할 일 ---------------- */
  function advice(chart, cat) {
    var f = asF(chart);
    var t = TOPIC[cat] || TOPIC.fate;
    var out = [];
    out.push('일간 ' + f.dmKey + '의 처방 — ' + f.dm.body + '. ' + f.jg.act + '. ' + t.label + '에서는 이 한 가지를 이번 주 안에 끝내세요.');
    out.push('용신 ' + f.yong + '(' + HANJA[f.yong] + ') — 이 사주의 답입니다. ' + YONG[f.yong].act + '. ' + (t.yx === 'act' ? '' : YONG[f.yong][t.yx] + '. ') + f.yong + ' 기운이 지금 ' + f.pct[f.yong] + '%뿐이라, 이걸 늘리는 속도가 곧 ' + t.label + '의 속도입니다.');
    out.push(f.str.act + '. 제 기운이 ' + f.ratio + '%인 ' + f.strong + ' 사주라 ' + (f.strongKey === 'strong' ? '덜어내는 만큼 결과가 남습니다.' : f.strongKey === 'weak' ? '빌리는 만큼 결과가 커집니다.' : '스스로 건 자극만큼 판이 커집니다.'));
    var ph = thinPhrase(f); out.push((f.lackN === 0 ? ph + ' 자리를 새로 만드는 일' : E.josa(ph, '을', '를') + ' 채우는 일') + ' — ' + f.lackT.act + '. ' + f.lackT.read + '. 이 자리를 한 달만 의식해도 ' + t.label + '의 막힘이 풀립니다.');
    out.push(pick(t.step, seed(f.chart, 'adv' + cat))(f) + '.');
    return out;
  }

  /* ---------------- 17. 조심할 점 ---------------- */
  function caution(chart, cat) {
    var f = asF(chart);
    var t = TOPIC[cat] || TOPIC.fate;
    var out = [];
    out.push('가장 많은 ' + f.dom + ' ' + f.domN + '개의 그늘 — ' + f.domT.risk + '. ' + t.label + '에서 이 습관이 나오면 판이 한 번 뒤집힙니다.');
    out.push(E.josa(f.strongEl, '이', '가') + ' ' + f.pct[f.strongEl] + '%로 넘쳐 ' + E.ELEM_DEEP[f.strongEl].over + '. 이 사주의 과열은 ' + E.ELEM_DEEP[f.strongEl].organ + '에서 먼저 신호를 보냅니다.');
    out.push('이 사주의 ' + f.sal + '은 ' + SAL[f.sal].risk + ' 쪽으로 작용합니다. ' + (f.salHits[0] ? f.salHits[0].where : '사주') + '에 걸려 있으니 ' + SAL[f.sal].act + '.');
    out.push(pick(t.cau, seed(f.chart, 'cau' + cat))(f) + '.');
    out.push(f.cheonHit ? E.plain('천을귀인') + '은 ' + f.cheonWhere + '에 앉아 있습니다. 결정적인 순간에는 그 자리의 사람에게 먼저 물으세요.' : '천을귀인 자리(' + f.cheonChars + ')가 사주에 앉지 않았습니다. 막혔을 때 하늘을 기다리기보다 그 띠의 사람을 먼저 찾으세요.');
    return out;
  }

  /* ---------------- 18. 행운 포인트 ---------------- */
  function lucky(chart) {
    var f = asF(chart);
    var L = E.LUCKY[f.yong];
    var n1 = L.number[0], n2 = ((f.stem + 1) * (f.dayBranch + 3)) % 9 + 1;
    var n3 = ((f.pct[f.yong] + f.ratio) % 9) + 1;
    var nums = [n1, n2, n3].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var dirByB = { 목: '동쪽', 화: '남쪽', 토: '중앙', 금: '서쪽', 수: '북쪽' }[f.chart.pillars.day.branchElem];
    return [
      { k: '도움이 되는 오행', v: f.yong + '(' + HANJA[f.yong] + ') · 희신 ' + f.hee + ' · ' + L.color },
      { k: '행운의 숫자', v: nums.join(' · ') },
      { k: '길한 방위', v: L.dir + ' / 일지 ' + f.dayB + '의 ' + dirByB },
      { k: '좋은 시간', v: L.time + ' / ' + E.HOUR_RANGE[f.dayBranch] },
      { k: '행운 아이템', v: L.item + ' · ' + f.dm.item },
      { k: '피할 것', v: E.ELEM_DEEP[f.strongEl].over + ' (' + f.strongEl + ' ' + f.pct[f.strongEl] + '% · ' + f.dmKey + ')' }
    ];
  }

  /* ---------------- 10~13 심층 팁 (일상 장면 → 바로 할 일) ---------------- */
  function tips(chart, kind) {
    var f = asF(chart);
    if (kind === 'money') {
      return [
        '월급날(정산일) 밤, 통장을 열어 비상금 계좌로 자동이체부터 걸어 두세요. ' + f.dmKey + ' 사주는 남는 돈을 모으는 방식이 아니라 먼저 빼 두는 방식이 통합니다 — 재성 ' + f.jaeEl + ' ' + f.pct[f.jaeEl] + '%인 이 사주는 그 한 번의 순서로 1년이 달라집니다.',
        '큰 결제는 장바구니에 담고 다음 날 아침에 다시 보세요. 밤에 누른 결제가 이 사주에서 가장 자주 후회로 남습니다 — ' + f.dmKey + ' 사주는 밤에 판단이 부드러워지고 아침에 후회하는 쪽입니다. 결제 앱은 잠들기 30분 전에 닫아 두세요.',
        (f.groups.재성 ? '재성 ' + f.groups.재성 + '개 · ' : '재성 없이 ') + f.jaeEl + ' ' + f.pct[f.jaeEl] + '% 구조라 ' + (f.groups.재성 >= 3 ? '수입이 늘면 지출도 같이 늘어납니다. 생활비를 먼저 고정하고 남은 돈을 움직이세요.' : f.groups.재성 === 0 ? '큰 벌이보다 손에 익은 기술에서 작은 유료 일을 먼저 만드세요. 그 한 건이 통로를 뚫습니다.' : '통장을 둘로 나누고 하나는 카드도 앱도 연결하지 마세요. 손이 닿지 않아야 남습니다.'),
        (f.groups.비겁 >= 2 ? '모임에서 한턱내는 날이 이 사주에서 가장 비싼 날입니다. 비겁 ' + f.groups.비겁 + '개 — 지인과의 동업·보증·공동 결제는 금액과 날짜를 문자로 남기세요.' : '새 수입원은 하나만 여세요. ' + f.dom + ' ' + f.domN + '개 구조라 두 개를 동시에 벌이면 둘 다 어설퍼집니다.')
      ];
    }
    if (kind === 'work') {
      return [
        '이직을 생각한다면 이번 주엔 공고를 세 개만 모아 조건을 나란히 적어 보세요. 일지 ' + f.dayB + '의 ' + f.dayG + '이 말하는 자리로 옮겨야 오래 갑니다.',
        '이번 달 성과 하나를 문서 한 장으로 남기세요. 회의록에 “내가 맡은 것·숫자로 줄인 것”을 한 줄씩 적어 두면, ' + f.dmKey + ' 사주는 그 기록이 평가를 바꿉니다.',
        (f.groups.관성 ? '윗사람과의 관계를 한 번 정리하세요. 관성 ' + f.groups.관성 + '개인 이 사주는 ' + (f.groups.관성 >= 2 ? '윗사람과의 인연이 곧 승진의 문입니다. 보고는 결론부터, 하루 먼저 하세요.' : '윗사람과의 거리가 곧 스트레스의 크기입니다. 보고는 짧게, 선은 분명히 하세요.') : '윗사람과의 선을 내가 먼저 그어야 스트레스가 줄어듭니다. 관성(책임·평가의 기운)이 원국에 없으니 기준은 문서로 남기고 보고는 짧게 하세요.'),
        '사표는 감정이 아니라 날짜로 정하세요. ' + f.dm.img + '의 결은 ' + f.dm.shadow + ' — 그 결이 나오는 순간 결심이 앞섭니다. 결심한 날 바로 던지지 말고 사흘을 두세요.'
      ];
    }
    if (kind === 'love') {
      var dohwa = f.salHits.filter(function (s) { return s.name === '년살(도화)'; }).length > 0;
      return [
        '이번 주에 마음이 가는 사람에게 ' + YONG[f.yong].time + ' 안에 짧은 안부를 한 번 보내세요. ' + f.yong + ' 기운이 살아나는 시간대라 말이 부드럽게 닿습니다 — ' + f.dayB + ' 일지의 ' + E.josa(f.dayG, '은', '는') + ' 기다리는 쪽에 서면 그대로 흐려지는 자리입니다.',
        '상대의 말보다 반복되는 행동을 세어 보세요. 약속 시간에 늘 일찍 오는지, 연락이 하루씩 밀리는지 — ' + f.dmKey + ' 사주는 ' + f.dm.shadow + ' — 그 결 때문에 말 한마디에 흔들리기 쉽습니다.',
        (dohwa ? '도화가 ' + f.salHits.filter(function (s) { return s.name === '년살(도화)'; })[0].where + '에 앉아 호의가 잦습니다. 호의와 약속을 구분하세요. 약속은 날짜가 정해진 것만 약속입니다.' : '도화가 ' + f.dayB + ' 일지에 앉지 않았습니다. ' + f.dmKey + '의 매력은 ' + f.yong + ' 기운(' + YONG[f.yong].place + ')에서 만들어지니, 그 자리에서 만남을 잡으세요.'),
        '상대를 시험하는 말로 확신을 얻으려 하면 ' + f.dom + ' ' + f.domN + '개인 이 사주에서는 관계가 한 단계 뒤로 물립니다. 묻고 싶은 게 있으면 질문 하나로 바로 물으세요.'
      ];
    }
    if (kind === 'health') {
      return [
        '잠자는 시간을 먼저 고정하고 나머지 일정을 그 위에 얹으세요. ' + f.dmKey + ' 사주에 용신 ' + f.yong + '의 시간(' + YONG[f.yong].time + ')이 회복 시간입니다.',
        E.ELEM_DEEP[f.thinEl].care + ' — ' + E.josa(f.thinEl, '이', '가') + ' ' + f.pct[f.thinEl] + '%로 가장 얇은 자리라, 이 한 가지만 매일 해도 다음 달 몸이 다릅니다.',
        '카페인 섭취는 오후 4시 이전으로 제한하고, 밤 각성을 피하세요. 음양 ' + f.yangPct + ':' + f.yinPct + '의 ' + f.dmKey + ' 사주는 밤의 각성이 다음 날 기운을 크게 깎습니다.',
        '한 달에 하루는 일정을 통째로 비우세요. ' + f.dayStage + '의 일지에 ' + f.dom + ' ' + f.domN + '개의 그늘이 겹치는 시기에는 비운 날이 체력을 만듭니다.'
      ];
    }
    return [];
  }

  /* ---------------- 오늘의 운세 ---------------- */
  function today(chart, r) {
    var f = asF(chart);
    var gc = (D.COPY.todayGod && D.COPY.todayGod[r.god]) || { head: r.god + '의 날', body: '', do: '', avoid: '' };
    var head = f.dmKey + ' 일간에 ' + r.god + '이 들어오는 날';
    var body = gc.body + ' 여기에 일간 ' + f.dmKey + '의 결(' + f.dm.img + ')이 겹쳐, ' +
      (r.clash ? '일지 ' + f.dayB + '와 오늘 지지가 ' + E.plain('충') + '하니 이동과 계약은 한 번 미루세요.' : r.combine ? '일지 ' + f.dayB + '와 오늘 지지가 ' + E.plain('합') + '하니 약속과 만남이 실제 이익으로 이어집니다.' : '일지 ' + f.dayB + '(' + f.dayBk + ') 쪽과 부딪히지 않아 평소의 리듬대로 가면 됩니다.') +
      ' ' + (r.element === f.yong ? '오늘 천간이 용신 ' + f.yong + ' 기운과 같아 판단이 가볍습니다.' : r.element === f.hee ? '희신 ' + f.hee + ' 기운이 실려 주변의 도움이 따라옵니다.' : '오늘의 기운은 용신 ' + f.yong + '에서 멀어, 결정은 한 번 검토를 거치세요.');
    return {
      head: head,
      body: body,
      do: gc.do + ' · ' + YONG[f.yong].act,
      avoid: gc.avoid + ' · ' + SAL[f.sal].risk,
      note: '일간 ' + f.dmKey + ' 기준으로 ' + r.god + '은 ' + (r.godGroup === '재성' ? '돈의 자리' : r.godGroup === '관성' ? '책임과 평가의 자리' : r.godGroup === '식상' ? '표현의 자리' : r.godGroup === '인성' ? '배움의 자리' : '나와 같은 편의 자리') + '입니다. 용신 ' + f.yong + ' 기준으로 ' + (r.total >= 70 ? '흐름이 좋은 날입니다.' : r.total >= 55 ? '무난하게 쓸 수 있는 날입니다.' : '속도를 낮추는 편이 좋은 날입니다.')
    };
  }

  /* ---------------- 궁합 처방전 ---------------- */
  var CP_OPEN = [
    function (fa, fb, n) { return '두 사람의 여덟 글자를 나란히 놓고 봤습니다. ' + n.a + ' 님은 ' + fa.dmKey + ' ' + fa.strong + '에 용신 ' + fa.yong + ', ' + n.b + ' 님은 ' + fb.dmKey + ' ' + fb.strong + '에 용신 ' + fb.yong + '입니다. 궁합은 좋고 나쁨을 가르는 일이 아니라, 두 사람이 어디서 맞물리고 어디서 부딪히는지를 미리 짚어 두는 일입니다.'; },
    function (fa, fb, n) { return n.a + ' 님의 ' + fa.dmKey + ' 일간과 ' + n.b + ' 님의 ' + fb.dmKey + ' 일간을 먼저 마주 세웠습니다. 한 사람은 ' + fa.strong + '이고 다른 사람은 ' + fb.strong + '이라 버티는 방식이 다르고, 필요한 기운도 ' + fa.yong + '과 ' + fb.yong + '으로 갈립니다. 이 차이가 두 사람 사이의 편한 자리와 어긋나는 자리를 만듭니다.'; },
    function (fa, fb, n) { return '두 사람의 일지를 가운데 두고 열여섯 글자를 봤습니다. ' + n.a + ' 님은 ' + fa.dayB + ' 일지에 ' + fa.dayG + '을 앉혔고, ' + n.b + ' 님은 ' + fb.dayB + ' 일지에 ' + fb.dayG + '을 앉혔습니다. 궁합은 이 두 자리가 어떻게 만나는지에서 절반이 정해집니다.'; },
    function (fa, fb, n, res) { return '한 문장으로 먼저 답하면 이 궁합은 ‘' + res.grade.label + '’ 쪽입니다. ' + res.grade.line + '. ' + n.a + ' 님의 ' + fa.dmKey + '과 ' + n.b + ' 님의 ' + fb.dmKey + '이 만든 결과이니, 왜 그렇게 나오는지 아래에 하나씩 적었습니다.'; }
  ];

  /* 일지 십성 문장을 남의 사주로 말할 때 — '내 자리에'를 빼고 3인칭으로 */
  function jgThird(read) {
    return String(read).replace(/^내 자리에 /, '').replace(/나와 같은/g, '자기와 같은').replace(/내 자리/g, '그 자리').replace(/내가 /g, '자기가 ');
  }

  function compat(res) {
    var A = res.a, B = res.b;
    var fa = facts(A), fb = facts(B);
    var names = { a: (A.input.name || '나'), b: (B.input.name || '상대') };
    var pairKey = A.ganji + '>' + B.ganji;
    function pickv(arr, tag) { return arr[Math.abs(E.hash(pairKey + '|' + tag)) % arr.length]; }
    var open = pickv(CP_OPEN, 'open')(fa, fb, names, res);

    var fMonths = res.fightMonths.map(function (n) { return n + '월'; }).join(' · ');
    var sameJG = fa.dayG === fb.dayG;
    var rx = [
      '일간의 짝 — ' + E.josa(fa.dmKey, '과', '와') + ' ' + E.josa(fb.dmKey, '이', '가') + ' 만나면 ' + (fa.dme === fb.dme ? '같은 ' + fa.dme + ' 기운끼리라 속도가 비슷하고 결정이 빠릅니다. 대신 둘 다 같은 자리에서 물러서지 않으면 그 자리에서 막힙니다.' : '한쪽은 ' + fa.dme + ', 다른 쪽은 ' + fb.dme + '의 결이라 생활의 리듬이 다릅니다. 서로의 속도를 재지 말고 물어보는 편이 낫습니다.') + ' ' + names.a + ' 님의 ' + fa.dayG + '과 ' + names.b + ' 님의 ' + E.josa(fb.dayG, '이', '가') + ' 일지에 앉아, 다툼은 늘 이 두 자리에서 시작됩니다. ' + pickv([
        '이 두 자리를 미리 알아 두면 다툼이 왔을 때 “또 이 자리구나” 하고 한 발 물러설 수 있습니다.',
        '그래서 두 사람이 싸울 때는 내용보다 순서를 보세요. 누가 먼저 말했는지가 이 사주에서는 결론보다 중요합니다.',
        '이 자리만 피하면 두 사람 사이의 큰 문제는 대개 지나갑니다. 나머지는 취향 차이입니다.',
        '말이 세지는 순간이 이 두 자리의 신호입니다. 그때 한 문장만 삼키면 그날은 넘어갑니다.'
      ], 'gan' + fa.dayG + fb.dayG),
      res.fightMonths.length ? '2027년 ' + fMonths + '에는 두 사람의 자리가 흔들립니다. ' + (res.fightMonths.length >= 4 ? '흔들리는 달이 여러 번 오는 해라, 판을 바꾸는 결정은 한 달에 하나만 두세요.' : '이 달에는 이사·계약·큰 지출을 겹쳐 두지 마세요.') + ' 특히 ' + fa.dmKey + '의 결(' + fa.dm.shadow + ')이 이 달에 그대로 나옵니다.' : '2027년에는 두 사람의 자리를 직접 치는 달이 없습니다. 대신 ' + fa.dmKey + '의 말이 앞서는 순간을 스스로 조심하세요.',
      '돈 — ' + (A.godGroups.비겁 + B.godGroups.비겁 >= 3
        ? '두 사람 모두 비겁(내 편·동료의 기운)이 두터워 같이 쓰는 돈에서 쉽게 새어 나갑니다. 더치페이와 공동 결제는 금액을 먼저 정하고 문자로 남기세요.'
        : A.godGroups.재성 + B.godGroups.재성 >= 3
          ? '두 사람 모두 재성(돈을 세는 기운)이 있어 계산은 빠른데, 그만큼 서로의 지출을 눈치껏 평가합니다. ' + names.a + ' 님의 ' + fa.dom + ' ' + fa.domN + '개와 ' + names.b + ' 님의 ' + fb.dom + ' ' + fb.domN + '개가 방식이 달라, 기준을 하나로 정해야 다툼이 줄어듭니다.'
          : '두 사람 사이에 오가는 돈은 금액과 날짜를 문자로 남기세요. 한 사람이 ' + fa.dom + ' ' + fa.domN + '개, 다른 사람이 ' + fb.dom + ' ' + fb.domN + '개라 지출의 기준이 다릅니다.'),
      sameJG
        ? '서운함 — 두 사람 다 일지 ' + fa.dayB + '(' + fa.dayBk + ')에 ' + E.josa(fa.dayG, '이', '가') + ' 앉아, 서운함이 쌓이는 방식도 같습니다. ' + jgThird(fa.jg.read) + '. 그래서 한 사람이 참으면 다른 사람도 같이 참다가 둘 다 같은 날 터집니다. 누가 먼저인지 따지지 말고 그날 안에 꺼내세요.'
        : '서운함 — ' + names.a + ' 님은 일지 ' + fa.dayB + '(' + fa.dayBk + ')에 ' + E.josa(fa.dayG, '을', '를') + ' 앉혔습니다. ' + jgThird(fa.jg.read) + '. ' + names.b + ' 님은 일지 ' + fb.dayB + '(' + fb.dayBk + ')에 ' + E.josa(fb.dayG, '을', '를') + ' 앉혔습니다. ' + jgThird(fb.jg.read) + '. ' + pickv([
          '그래서 참아 둔 것이 다음 날 두 배로 돌아옵니다. 그날 안에 꺼내세요.',
          '이 조합은 말이 늦으면 마음이 먼저 식습니다. 짧게라도 그 자리에서 확인하세요.',
          '서운함이 생기면 “나는 이게 서운했어”로 시작하세요. 이 두 사람은 그 문장에 약합니다.',
          '두 사람은 서운함을 오래 기억하는 쪽이라, 그날의 말 한마디가 다음 계절까지 갑니다.'
        ], 'srw' + fa.dayG + fb.dayG),
      pickv([
        '한 달에 한 번은 ' + fa.yong + '·' + fb.yong + ' 기운이 있는 자리(' + YONG[fa.yong].place + ')에서 두 사람만의 시간을 만드세요. 이 두 사주는 익숙함보다 새로운 자리에서 다시 붙습니다.',
        '한 달에 한 번은 ' + names.a + ' 님의 ' + fa.yong + ' 자리(' + YONG[fa.yong].place + ')와 ' + names.b + ' 님의 ' + fb.yong + ' 자리(' + YONG[fb.yong].place + ') 중 한 곳을 골라 두 사람만의 시간을 만드세요. 고르는 사람이 그날의 분위기를 잡게 됩니다.',
        '한 달에 한 번은 ' + E.josa(YONG[fa.yong].time, '이나', '나') + ' ' + YONG[fb.yong].time + '처럼 두 사람의 기운이 살아나는 시간에 만나세요. 같은 장소라도 그 시간대에 앉으면 이 사주는 훨씬 부드러워집니다.',
        '한 달에 한 번은 두 사람이 각자 좋아하는 것을 하나씩 준비해 오세요 — ' + names.a + ' 님은 ' + fa.yong + ' 기운(' + YONG[fa.yong].item + '), ' + names.b + ' 님은 ' + fb.yong + ' 기운(' + YONG[fb.yong].item + '). 이 두 사주는 나누는 자리에서 다시 붙습니다.'
      ], 'month' + fa.yong + fb.yong)
    ];
    return { open: open, rx: rx };
  }

  /* ---------------- 대운 카드 보강 ---------------- */
  function daeunTail(c, x, field) {
    var f = facts(c);
    var base = f.dmKey + ' 일간에 ' + x.hanja + '(' + x.ko + ') ' + x.stemGod + '·' + x.branchGod + ' ' + x.stage;
    if (field === 'flow') return '이 10년은 ' + base + ' 자리이고, 용신 ' + E.josa(f.yong, '과', '와') + '는 ' + (x.stemEl === f.yong || x.branchEl === f.yong ? '같은 방향이라 힘이 실립니다.' : x.stemEl === f.hee || x.branchEl === f.hee ? '희신으로 이어져 버티는 힘이 붙습니다.' : '거리가 있어 새로 벌이기보다 지키는 쪽이 남습니다.');
    if (field === 'money') return '이 대운에서는 ' + f.jaeEl + ' 재성 ' + f.groups.재성 + '개가 ' + x.branchGod + ' 자리와 만나 ' + (x.branchGod === '편재' || x.branchGod === '정재' ? '돈의 문이 직접 열립니다.' : '직접 열리지는 않아도 ' + f.yong + ' 기운을 채우면 새는 돈이 줄어듭니다.');
    if (field === 'work') return '일에서는 ' + f.monB + ' 월지의 ' + E.josa(f.monG, '과', '와') + ' 이 대운의 ' + x.stemGod + E.josa(x.stemGod, '이', '가').slice(x.stemGod.length) + ' 겹쳐 ' + (x.stemGod === '정관' || x.stemGod === '편관' ? '조직과 평가의 자리가 커집니다.' : x.stemGod === '식신' || x.stemGod === '상관' ? '만들어 내놓는 일이 성과로 남습니다.' : '내 자리를 다지는 시기입니다.');
    return '사는 법은 ' + (f.strongKey === 'weak' ? '사람을 곁에 두는 것' : f.strongKey === 'strong' ? '일정을 비우는 것' : '기한을 스스로 거는 것') + '이 답이고, 이 10년에는 ' + f.thinEl + ' 기운(' + f.pct[f.thinEl] + '%)을 채우는 습관이 그 일을 도와줍니다.';
  }

  function daeunTips(c) {
    var f = facts(c);
    return [
      '대운이 바뀌는 해에는 새 일을 벌이지 말고 그 전 1년에 정리와 준비를 끝내 두세요. 이사·이직·계약은 그 전 해 12월까지 마무리해 두면 새 10년이 훨씬 가볍게 열립니다 — ' + f.dmKey + ' 사주는 준비가 끝난 판에서 가장 강합니다.',
      '힘이 실리는 대운에는 벌이고 눌리는 대운에는 지키세요. ' + f.dmKey + ' 사주는 용신 ' + E.josa(f.yong, '이', '가') + ' 대운에 들어오는 10년이 그 신호입니다.',
      '대운은 10년이지만 실제 변화는 그 안의 해에서 옵니다. ' + f.dayB + ' 일지와 부딪히는 해에는 좋은 대운이라도 그해는 한 박자 늦추세요.',
      '새 10년이 시작되는 해 1월에 그 10년의 목표를 한 장으로 적어 두세요. ' + f.dmKey + ' 사주는 글로 남긴 목표에만 오래 매달립니다.'
    ];
  }

  /* ---------------- 2027 길일 팁 ---------------- */
  function gililTip(c, key, idx) {
    var f = facts(c);
    var base = (P.TIPS[key] || [])[0] || '';
    var mine = {
      contract: [
        '도장은 ' + YONG[f.yong].time + '에 찍으세요. ' + f.dmKey + ' 사주에 용신 ' + E.josa(f.yong, '이', '가') + ' 살아나는 시간이라 서류의 기운이 곧게 섭니다.',
        '계약서에 금액과 날짜를 손으로 한 번 더 적으세요. ' + f.dmKey + ' 사주는 숫자를 눈으로 확인할 때 실수를 막습니다.',
        '상대가 서두르게 하면 그 자리에서 한 번 멈추세요. ' + E.josa(f.dmKey, '은', '는') + ' ' + f.dm.shadow + '. 그래서 밀리면 그대로 넘어갑니다.'
      ],
      job: [
        '면접은 ' + YONG[f.yong].time + '에 잡으세요. ' + f.dmKey + ' 사주는 그 시간대에 말이 가장 가볍습니다.',
        '첫 질문에 결론부터 말하세요. ' + f.dmKey + '의 강점은 설명이 아니라 단정입니다.',
        '서류는 하루 전에 끝내 두세요. ' + f.monG + '이 월지에 앉은 이 사주는 당일 준비에 늘 발목을 잡힙니다.'
      ],
      move: [
        '이삿날은 오전에 시작해 해가 지기 전에 마무리하세요. ' + f.dmKey + ' 사주는 밤에 들어가는 이사가 남는 기운이 좋지 않습니다.',
        '새집에 들어가면 ' + f.yong + ' 기운을 먼저 들이세요 — ' + YONG[f.yong].item + '을 먼저 놓고 불을 켜세요. ' + E.josa(f.dmKey, '은', '는') + ' 문을 여는 순서에 그 해의 기운이 실립니다.',
        '개업이라면 첫 손님 전에 금전함 자리를 정하고, 그 자리만은 나중에 옮기지 마세요. ' + f.dayB + ' 일지의 ' + f.dayG + '이 재물 자리를 지킵니다.'
      ]
    };
    var arr = mine[key] || [];
    return arr[idx % arr.length] || base;
  }

  /* ---------------- 2027 특별관 보강 ---------------- */
  function y27(chart, kind, y) {
    var f = asF(chart);
    var out = {};
    if (kind === 'samjae') {
      out.rules = [
        '돈은 묶고 계약은 미루기 — ' + f.dmKey + '에게 2027년은 ' + (y.samjae.is ? '삼재의 마지막 해라 남은 것을 정리하는 때' : '삼재는 아니지만 ' + (f.lackN === 0 ? f.lack + '이 없어' : f.lack + '이 ' + f.lackN + '개로 얇아') + ' 확장보다 정리가 맞는 때') + '입니다.',
        '몸을 먼저 챙기기 — ' + E.josa(f.strongEl, '이', '가') + ' ' + f.pct[f.strongEl] + '%로 넘치는 사주라 ' + E.ELEM_DEEP[f.strongEl].organ + '에 부담이 먼저 옵니다. 수면과 검진을 일정에 먼저 넣으세요.',
        '문서로 남기기 — 일지 ' + f.dayB + '의 ' + f.dayG + ' 결은 구두 약속을 기억하지 못합니다. 돈과 일은 반드시 글로 남기세요.'
      ];
      out.todo = y.samjae.todo.map(function (t, i) {
        return t + ' (' + f.dmKey + ' · ' + (i === 0 ? '재성(오행 ' + f.jaeEl + ') ' + f.groups.재성 + '개 기준' : i === 1 ? '인성(오행 ' + f.inEl + ') ' + f.groups.인성 + '개 기준' : '일지 ' + f.dayB + ' ' + f.dayStage + ' 기준') + ')';
      });
    }
    if (kind === 'reunion') {
      var lines = [
        '“요즘 어떻게 지내? ' + (f.dayG === '정인' || f.dayG === '편인' ? '문득 네가 좋아하던 것 생각나서' : '그냥 한 번 생각나서') + '.” — 용건 없이 안부만. ' + f.dmKey + ' 사주는 이 문장이 가장 안전합니다.',
        '“' + (f.sal === '화개살' ? '전에 같이 보던 그 작품, 아직 보고 있어?' : f.sal === '역마살' ? '요즘 어디 다녀? 나는 ' + YONG[f.yong].place.split('·')[0] + ' 쪽에 있어.' : '전에 네가 좋아하던 그거, 아직 유효해?') + '” — ' + f.dmKey + ' 일간에 ' + '일지 ' + f.dayB + '(' + f.dayBk + ')' + E.josa(f.dayBk, '을', '를') + ' 둔 이 사주는 취향을 기억한 한 문장에서 마음이 움직입니다.',
        '“급한 건 아니야. 시간 될 때 답 줘.” — ' + f.dayG + '이 일지에 앉은 사주는 문을 열어 두는 문장에서 상대가 움직입니다.'
      ];
      out.lines = lines;
      out.note = '밤 11시 이후 연락과 긴 문자는 ' + f.dmKey + ' 사주에서 재회 확률을 낮춥니다. ' + YONG[f.yong].time + '의 짧은 안부가 길을 엽니다.';
    }
    return out;
  }

  /* ---------------- 대운 카드 (사주별 문장) ---------------- */
  var DEC = {
    '비견': { key: '내 이름으로 서는 10년',
      money: function (f, x) { return x.hanja + ' 10년의 돈은 같이 벌고 같이 나누는 자리에서 들어옵니다. ' + f.dmKey + '에 재성 ' + f.groups.재성 + '개인 이 사주는 ' + x.ageFrom + '세 무렵부터 배분을 글로 남기지 않으면 그 돈이 사람을 상하게 합니다.'; },
      work: function (f, x) { return '남 밑에 있기 답답해지는 시기입니다. ' + E.josaHan(x.hanja, x.ko, '이', '가') + ' ' + x.stemGod + E.josa(x.stemGod, '으로', '로').slice(x.stemGod.length) + ' 서는 ' + x.ageFrom + '~' + x.ageTo + '세에는 내 이름을 걸고 작게라도 결정권이 있는 자리로 옮기세요.'; },
      life: function (f, x) { return '이 10년은 몸이 곧 자본입니다. ' + f.dmKey + '의 ' + f.yong + ' 기운이 ' + f.pct[f.yong] + '%인 만큼 사람을 많이 만나느라 잠을 줄이면 그 값이 다음 대운에 옵니다.'; } },
    '겁재': { key: '나누고 지키는 법을 배우는 10년',
      money: function (f, x) { return '돈이 들어오는 만큼 나가는 길도 함께 열립니다. ' + x.hanja + ' 대운에 재성 ' + f.groups.재성 + '개가 겹치니 통장을 하나 분리해 두는 것만으로 결과가 달라집니다.'; },
      work: function (f, x) { return '경쟁이 붙는 시기입니다. ' + x.ageFrom + '세부터 남과 같은 판에서 겨루기보다 ' + E.josa(f.dmKey, '이', '가') + ' 잘하는 한 가지를 더 깊게 파는 쪽이 이깁니다.'; },
      life: function (f, x) { return '이 10년에 사람을 잘못 고르면 10년이 흔들립니다. 비겁이 ' + f.groups.비겁 + '개인 이 사주는 돈이 오가는 자리의 사람을 천천히 보세요.'; } },
    '식신': { key: '내가 만든 것이 밖으로 나가는 10년',
      money: function (f, x) { return x.hanja + ' 대운에는 기술·콘텐츠·요리·돌봄처럼 손으로 만든 것이 수입이 됩니다. 식상 ' + f.groups.식상 + '개인 이 사주는 저축 비율을 정해 두면 ' + x.yearFrom + '년 무렵 자산이 한 번 뜁니다.'; },
      work: function (f, x) { return '표현과 결과물이 평가받는 시기입니다. ' + x.ageFrom + '~' + x.ageTo + '세의 직장에서도 내 이름이 붙는 일을 하나 만들어 두세요.'; },
      life: function (f, x) { return '편안함이 이 시기의 복이자 함정입니다. ' + f.dmKey + '에게는 마감과 규칙을 스스로 정해 두는 것이 그 흐름을 놓치지 않는 방법입니다.'; } },
    '상관': { key: '정해진 것을 뜯어고치는 10년',
      money: function (f, x) { return '아이디어로 돈을 만드는 시기입니다. ' + x.hanja + ' 대운에 식상이 ' + f.groups.식상 + '개인 이 사주는 벌이보다 씀씀이가 앞서기 쉬워 수입의 30%를 먼저 묶어야 합니다.'; },
      work: function (f, x) { return '기획·개선·발표에서 재능이 드러납니다. ' + x.ageFrom + '세 전후로 조직에 오래 몸을 담그기보다 내 방식이 통하는 자리로 옮기는 편이 낫습니다.'; },
      life: function (f, x) { return '이 10년은 말이 관계를 만듭니다. ' + E.josa(f.dmKey, '이', '가') + ' 윗사람 앞에서 결론부터 말하는 습관 하나가 ' + x.yearTo + '년까지의 성패를 가릅니다.'; } },
    '편재': { key: '판이 넓어지고 돈의 길이 열리는 10년',
      money: function (f, x) { return '큰돈이 움직이는 시기입니다. ' + x.hanja + ' 대운에 ' + f.jaeEl + ' 재성 ' + f.groups.재성 + '개가 열리니 새 거래·부업·투자에서 손에 쥔 돈은 그 자리에서 묶어야 남습니다.'; },
      work: function (f, x) { return '영업·사업·해외처럼 판을 넓히는 일이 어울립니다. ' + x.ageFrom + '세에 직장에 있더라도 외부와 닿는 일을 맡으세요.'; },
      life: function (f, x) { return '이 10년은 사람이 재물입니다. ' + E.josa(f.dmKey, '은', '는') + ' 조건만 보고 만난 사람에게 조건이 어긋날 때 먼저 떠나는 쪽이라, 사람을 고르는 기준을 먼저 세우세요.'; } },
    '정재': { key: '쌓은 것이 숫자로 확인되는 10년',
      money: function (f, x) { return '꾸준한 벌이와 정산이 결과로 남는 시기입니다. ' + x.hanja + ' 대운에 재성 ' + f.groups.재성 + '개인 이 사주는 부동산·적금처럼 쌓이는 자산을 ' + x.ageFrom + '세 무렵 잡아 두면 다음 대운이 편합니다.'; },
      work: function (f, x) { return '관리·재무·운영처럼 정확함이 평가받는 자리에 어울립니다. ' + x.yearTo + '년까지는 승진보다 자리를 깊게 만드는 쪽이 유리합니다.'; },
      life: function (f, x) { return '안정이 최고의 복인 시기입니다. 다만 ' + E.josa(f.dmKey, '은', '는') + ' 안정에 기대어 새 길을 미루면 10년 뒤에 그 값이 옵니다.'; } },
    '편관': { key: '무거운 책임을 지고 버티는 10년',
      money: function (f, x) { return '돈이 크게 들어오기보다 지켜지는 시기입니다. ' + x.hanja + ' 대운에는 대출·보증·큰 결제를 몰지 말고 ' + f.jaeEl + ' 재성 ' + f.groups.재성 + '개를 지키는 데 쓰세요.'; },
      work: function (f, x) { return '평가와 압박이 몰리지만 버티면 인정이 남습니다. ' + x.ageFrom + '세에 책임 있는 자리를 맡으면 ' + x.yearTo + '년까지 경력의 뼈대가 됩니다.'; },
      life: function (f, x) { return '몸이 먼저 신호를 보내는 시기입니다. ' + E.josa(f.dmKey, '은', '는') + ' 잠과 검진을 일정에 먼저 넣으세요. 이 10년의 건강이 다음 10년의 속도를 정합니다.'; } },
    '정관': { key: '공식의 자리에서 이름이 오르는 10년',
      money: function (f, x) { return '조직·자격·평판이 재물의 발판이 됩니다. ' + x.hanja + ' 대운에 관성 ' + f.groups.관성 + '개인 이 사주는 크게 벌기보다 안정적으로 오르는 시기라 자격과 직함에 투자하세요.'; },
      work: function (f, x) { return '승진·시험·계약·공직처럼 공식의 자리에서 결과가 나옵니다. ' + x.ageFrom + '세에 잡은 자리가 오래갑니다.'; },
      life: function (f, x) { return '남의 시선을 의식해 하고 싶은 말을 삼키는 시기입니다. ' + E.josa(f.dmKey, '은', '는') + ' 한 달에 한 번 내 마음을 소리 내어 말하는 연습을 하세요.'; } },
    '편인': { key: '안으로 들어가 다시 세우는 10년',
      money: function (f, x) { return '큰 벌이보다 정리와 절약이 재물을 지킵니다. ' + x.hanja + ' 대운에 공부·자격에 쓴 돈이 ' + x.yearTo + '년 이후 수입으로 돌아옵니다.'; },
      work: function (f, x) { return '전문성·연구·기술처럼 혼자 깊어지는 일이 어울립니다. ' + x.ageFrom + '세에 만든 결과물이 다음 대운의 명함이 됩니다.'; },
      life: function (f, x) { return '생각이 길어져 결정을 미루기 쉽습니다. ' + E.josa(f.dmKey, '은', '는') + ' 기한을 정해 두고 작게라도 시작하는 습관이 이 10년의 숙제입니다.'; } },
    '정인': { key: '배움과 도움이 나를 키우는 10년',
      money: function (f, x) { return '부동산·지식·자격처럼 쌓이는 자산이 재물이 됩니다. ' + x.hanja + ' 대운에는 급하게 벌기보다 오래 가는 것을 고르세요. 인성 ' + f.groups.인성 + '개인 이 사주에 맞는 방식입니다.'; },
      work: function (f, x) { return '교육·상담·연구처럼 사람을 품는 자리에 어울립니다. ' + x.ageFrom + '세에 만난 어른 한 사람이 10년을 줄여 줍니다.'; },
      life: function (f, x) { return '받은 도움을 당연하게 여기면 이 시기의 복이 빠져나갑니다. ' + E.josa(f.dmKey, '이', '가') + ' 고맙다는 말을 자주 하는 만큼 이 대운을 다 씁니다.'; } }
  };

  /* ---------------- 대운의 일상 장면 (10년을 생활로 옮긴 문장) ----------------
     십성마다 겪을 장면이 다르고, 나이·일지·오행 자리를 함께 넣어 다른 사주와 겹치지 않게 쓴다 */
  var DAILY_DAEUN = {
    '비견': {
      money: function (f, x) { return '장면으로 옮기면 ' + x.ageFrom + '세 무렵 처음으로 남과 돈을 나누는 자리가 생깁니다. 그 자리에서 현금을 바로 나누지 말고 계좌로 보내고 메모를 한 줄 남기세요 — ' + f.dmKey + ' 사주는 기록이 없으면 그 돈을 다시 잃습니다.'; },
      work: function (f, x) { return '출근길에 “이 일을 왜 내가 이 방식으로 해야 하지”가 반복해서 떠오르는 시기입니다. ' + f.dayB + ' 일지의 ' + f.dayG + ' 결이 그 신호이고, 답은 사표가 아니라 내가 결정하는 일을 하나 만드는 쪽입니다.'; },
      life: function (f, x) { return '점심시간에 누가 계산할지로 기분이 상하는 날이 이 10년에 생깁니다. 그날 바로 “다음엔 내가 낼게”로 끝내세요 — ' + f.dmKey + ' 사주의 ' + x.hanja + ' 대운은 작은 셈이 쌓여 관계를 만듭니다.'; }
    },
    '겁재': {
      money: function (f, x) { return '지인이 “같이 해 보자”고 하는 제안이 이 10년에 두세 번 옵니다. 그 자리에서 금액과 기간을 먼저 물으세요 — 재성 ' + f.groups.재성 + '개인 이 사주는 나누는 자리에서 새는 돈이 가장 큽니다.'; },
      work: function (f, x) { return x.ageFrom + '세 전후로 같은 자리에서 나보다 늦게 온 사람이 먼저 올라가는 장면을 봅니다. 그때 비교에 쓰는 에너지를 한 가지 기술을 더 깊게 파는 데 쓰면 이 대운이 뒤집힙니다.'; },
      life: function (f, x) { return '모임 뒤 정산이 어긋나 서운해지는 날이 이 10년에 생깁니다. 그날 밤 문자로 “오늘 얼마였지?”를 보내는 쪽이 오래 갑니다 — ' + x.hanja + ' 대운의 ' + f.dmKey + ' 사주는 참으면 두 배로 돌아옵니다.'; }
    },
    '식신': {
      money: function (f, x) { return '만들어 둔 초안이 처음으로 값을 받는 달이 이 10년 안에 옵니다. 금액이 작아도 두 번째, 세 번째를 내놓는 사람이 이 대운을 다 씁니다 — 식상 ' + f.groups.식상 + '개인 이 사주가 그렇습니다.'; },
      work: function (f, x) { return '회의에서 “이건 제가 만들었습니다”를 한 번은 말하게 되는 시기입니다. 말하지 않으면 그 결과물은 팀 이름으로 남습니다 — ' + x.ageFrom + '세에 그 한마디를 아끼지 마세요.'; },
      life: function (f, x) { return '마감이 없는 주가 이어지면 저녁이 그냥 비어 버리는 시기입니다. 목요일 저녁에 다음 주 마감을 하나 정해 두세요 — ' + f.dayB + ' 일지의 ' + f.dayG + ' 결이 그 마감에 반응합니다.'; }
    },
    '상관': {
      money: function (f, x) { return '회사에서 쓰던 아이디어가 주말 부수입이 되는 시기입니다. 첫 정산이 들어온 날, 다음 작업에 쓸 돈을 먼저 떼어 두세요 — ' + x.hanja + ' 대운의 ' + f.dmKey + ' 사주는 손에 남은 돈을 다 씁니다.'; },
      work: function (f, x) { return '회의에서 “이건 이렇게 하는 게 낫지 않나”가 목까지 올라오는 시기입니다. 그 말을 결론부터 짧게 하면 개선으로 남고, 길게 하면 관계를 긁습니다.'; },
      life: function (f, x) { return '윗사람 앞에서 한마디 잘못한 날 밤에 잠이 얕아지는 시기입니다. 그날 저녁에 짧게 정리해 사과 한 줄을 남기세요 — 그 한 줄이 다음 해의 평판을 정합니다.'; }
    },
    '편재': {
      money: function (f, x) { return '새 거래와 부업 제안이 이 10년에 몰립니다. 서명하기 전 그 자리에서 “정산일이 언제인가”만 확인하세요 — ' + x.hanja + ' 대운의 ' + f.dmKey + ' 사주는 그 한 줄에서 갈립니다.'; },
      work: function (f, x) { return '바깥 사람을 만나는 자리가 생기는 시기입니다. ' + x.ageFrom + '세에 외부 미팅을 스스로 잡으세요 — 이 대운의 기회는 회의실 밖에서 옵니다.'; },
      life: function (f, x) { return '여행지나 모임에서 인연이 생기고 돌아와 연락이 끊기는 일이 이 10년에 반복됩니다. 돌아온 다음 날 한 통 연락을 넣으세요 — ' + f.dayB + ' 일지의 ' + f.dayG + ' 결은 그 한 통에 움직입니다.'; }
    },
    '정재': {
      money: function (f, x) { return '이름 붙인 통장이 하나씩 늘어나는 10년입니다. 적금·연금·전세 자금 중 하나를 골라 ' + x.ageFrom + '세에 만들고, 그 통장만은 앱에 연결하지 마세요 — 재성 ' + f.groups.재성 + '개인 이 사주의 돈은 눈에 안 보여야 남습니다.'; },
      work: function (f, x) { return '정산일과 서류 마감이 몰리는 시기입니다. ' + x.yearFrom + '년에 업무 순서표를 한 장 만들어 붙여 두세요 — ' + f.dmKey + ' 사주는 순서가 눈에 보이면 실수가 줄어듭니다.'; },
      life: function (f, x) { return '월급이 들어오는 날과 카드값이 나가는 날이 같은 하루로 겹치는 10년입니다. 그날 저녁에 생활비를 확인하는 습관을 들이세요 — ' + x.hanja + ' 대운은 그 루틴으로 유지됩니다.'; }
    },
    '편관': {
      money: function (f, x) { return '보증을 서 달라는 부탁이 이 10년에 한두 번 옵니다. 그 자리에서 “며칠 생각해 볼게”로 답하고 그대로 미루세요 — ' + f.dmKey + ' 사주의 ' + x.hanja + ' 대운은 거절이 재물을 지킵니다.'; },
      work: function (f, x) { return '책임이 얹히고 평가가 몰리는 시기입니다. ' + x.ageFrom + '세에 맡은 자리를 거절하지 마세요 — 버틴 사람에게 인정이 남습니다. 다만 야근이 이어지는 주엔 검진을 먼저 잡으세요.'; },
      life: function (f, x) { return '목과 어깨가 먼저 굳고 아침에 일어나는 게 무거워지는 시기입니다. ' + x.yearFrom + '년부터 분기마다 검진 날짜를 미리 잡아 두세요 — ' + f.dayB + ' 일지의 ' + f.dayG + ' 결은 몸으로 먼저 말합니다.'; }
    },
    '정관': {
      money: function (f, x) { return '연봉 협상 자리에서 직함과 자격이 값을 만드는 시기입니다. 제안이 오면 숫자보다 직함을 먼저 확인하세요 — ' + x.hanja + ' 대운의 ' + f.dmKey + ' 사주는 그 자리가 오래갑니다.'; },
      work: function (f, x) { return '면접과 보고, 계약이 몰리는 시기입니다. ' + x.ageFrom + '세에 보는 시험은 준비 기간을 넉넉히 두세요 — 서류 숫자 하나가 결과를 바꿉니다.'; },
      life: function (f, x) { return '하고 싶은 말을 삼키는 저녁이 이 10년에 늘어납니다. 한 달에 한 번, 가까운 사람에게 오늘 서운했던 것을 말로 꺼내 보세요 — ' + x.yearTo + '년의 몸이 그 말에 달려 있습니다.'; }
    },
    '편인': {
      money: function (f, x) { return '자격 공부에 낸 돈이 몇 해 뒤 수입으로 돌아오는 시기입니다. ' + x.ageFrom + '세에 시작한 공부는 끝까지 마치세요 — 중간에 접으면 그 수입도 같이 끊깁니다.'; },
      work: function (f, x) { return '회의보다 혼자 앉아 있는 시간이 결과를 만드는 시기입니다. ' + x.yearFrom + '년에 결과물 하나를 문서로 남겨 두세요 — 그것이 다음 자리의 명함이 됩니다.'; },
      life: function (f, x) { return '밤에 결정을 미루는 버릇이 굳는 시기입니다. ' + x.ageFrom + '세부터 밤 열한 시 이후 결정을 하지 않는 규칙을 두세요 — ' + f.dayB + ' 일지의 ' + f.dayG + ' 결이 그 규칙을 도와줍니다.'; }
    },
    '정인': {
      money: function (f, x) { return '부동산·지식·자격 중 하나가 이 10년의 재산이 됩니다. ' + x.yearFrom + '년에 미뤄 둔 공부나 계약을 실제로 시작하세요 — 인성 ' + f.groups.인성 + '개인 이 사주는 시작이 늦으면 값이 오릅니다.'; },
      work: function (f, x) { return '어른의 조언 한마디가 방향을 바꾸는 시기입니다. ' + x.ageFrom + '세에 만난 사람에게 “배울 게 있으면 알려 달라”고 먼저 말해 보세요.'; },
      life: function (f, x) { return '도움을 받고도 고맙다는 말을 미루는 날이 이 10년에 생깁니다. 받은 그날 문자로 한 줄 남기세요 — ' + f.dmKey + ' 사주의 ' + x.hanja + ' 대운은 그 한 줄로 이어집니다.'; }
    }
  };

  function daeunCard(chart, x) {
    var f = asF(chart);
    var dec = DEC[x.stemGod] || DEC['비견'];
    var fav = (x.stemEl === f.yong || x.branchEl === f.yong) ? '이 10년에는 내게 필요한 ' + f.yong + ' 기운이 대운에 직접 들어옵니다. ' + (x.stage === '제왕' || x.stage === '건록' || x.stage === '관대' ? '힘의 자리까지 겹쳐, 미뤄 둔 일을 이 안에 밀어붙이면 됩니다.' : '기운이 도와주니 혼자 버티지 말고 사람과 자리를 함께 쓰세요.')
      : (x.stemEl === f.hee || x.branchEl === f.hee) ? '내 편에 서 주는 ' + f.hee + ' 기운이 들어오는 10년입니다. 결정적인 도움은 아니지만 버티는 힘이 붙습니다.'
        : '이 10년은 내게 필요한 기운이 크게 들어오지는 않습니다. 새로 벌이기보다 지키고 다지는 쪽이 남습니다.';
    var dd = DAILY_DAEUN[x.stemGod] || DAILY_DAEUN['비견'];
    return {
      key: x.hanja + ' ' + x.stemGod + ' 대운 · ' + dec.key,
      flow: (E.STAGE_DEEP[x.stage] || '') + '. ' + x.hanja + '의 ' + x.stemGod + '·' + x.branchGod + E.josa(x.branchGod, '이', '가').slice(x.branchGod.length) + ' ' + f.dmKey + ' 일간에 앉아 ' + fav,
      money: dec.money(f, x) + ' ' + dd.money(f, x),
      work: dec.work(f, x) + ' ' + dd.work(f, x),
      life: dec.life(f, x) + ' ' + dd.life(f, x)
    };
  }

  /* 용신 처방 (care 문장을 사주별로) */
  function yongCare(chart) {
    var f = asF(chart);
    return chart.yongsin.care + '. ' + f.dmKey + ' 일간에 ' + f.strong + '인 이 사주는 ' + E.josa(f.yong, '이', '가') + ' ' + f.pct[f.yong] + '%여서, ' + YONG[f.yong].act + ' — 이것이 곧 처방입니다.';
  }

  /* '卯(토끼)' 처럼 한자(독음)로 적힌 이름에 독음 기준 조사를 붙인다 */
  function nameJosa(name, withC, withoutC) {
    var t = String(name || '');
    var m = t.match(/\(([^)]*)\)/);
    var read = m ? m[1] : t;
    return t + E.josa(read, withC, withoutC).slice(read.length);
  }

  /* 2027 특수살 — 판정과 문장을 한 줄로 */
  function salLine(chart, s) {
    var f = asF(chart);
    return s.meaning + ' ' + s.use + ' 이 사주에서는 ' + (s.on
      ? '내 ' + s.where.join(' · ') + '에 ' + nameJosa(s.branchName, '이', '가') + ' 앉아 ' + f.dmKey + '의 결에 실제로 살아 있습니다.'
      : nameJosa(s.branchName, '이', '가') + ' 사주에 없어 작용이 서지 않습니다. 대신 ' + f.yong + ' 기운을 채우는 쪽이 같은 역할을 합니다.');
  }

  /* 공개 API */
  return {
    facts: facts, core: core, timing: timing, advice: advice, caution: caution,
    lucky: lucky, tips: tips, today: today, compat: compat,
    daeunTail: daeunTail, daeunTips: daeunTips, gililTip: gililTip, y27: y27, daeunCard: daeunCard, salLine: salLine, yongCare: yongCare,
    DM: DM, YONG: YONG, TOPIC: TOPIC, SAL: SAL
  };
})();
