/* ============================================================
   오행 · 십신 판정 일관성 검증
   python3 tools/runjs.py tools/verify-elem.js
   · 오행 최다(strongest)와 최소(weakest)가 퍼센티지·글자수와 항상 맞는지
   · 최다 === 최소 로 뒤집히는 경우가 0건인지
   · 본문이 "가장 얇다"고 말하는 오행이 실제 최다 오행이 아닌지
   · 십신 개수(N개) 표기가 실제 개수와 같은지
   ============================================================ */
var E = window.SajuEngine, P = window.SAJU_PLUS, D = window.SAJU_DATA, W = window.WOLHA_APP;
if (W.grantAll) W.grantAll();      // 유료 본문까지 포함해 문장 전체를 검사한다

function clean(h) { return String(h).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' '); }
var GODS = ['비겁', '식상', '재성', '관성', '인성'];
var ELS = ['목', '화', '토', '금', '수'];
var fails = [], nCharts = 0, nTexts = 0;

function fail(msg) { if (fails.length < 40) fails.push(msg); else if (fails.length === 40) fails.push('… (이하 생략)'); }

function checkChart(c) {
  nCharts++;
  var tag = c.ganji + ' / ' + c.input.year + '-' + c.input.month + '-' + c.input.day + ' h' + c.input.hour;
  var pct = c.pct, cnt = c.counts;
  var maxPct = Math.max.apply(null, ELS.map(function (e) { return pct[e]; }));
  var minPct = Math.min.apply(null, ELS.map(function (e) { return pct[e]; }));
  var ext = E.elemExtremes(c);

  /* 1) 최다·최소가 퍼센티지와 일치하고 서로 다르다 */
  if (ext.strong === ext.weak) fail('최다=최소 동일: ' + tag + ' → ' + ext.strong);
  if (pct[ext.strong] !== maxPct) fail('최다 퍼센트 불일치: ' + tag + ' → ' + ext.strong + ' ' + pct[ext.strong] + '% (최대 ' + maxPct + '%)');
  if (pct[ext.weak] !== minPct) fail('최소 퍼센트 불일치: ' + tag + ' → ' + ext.weak + ' ' + pct[ext.weak] + '% (최소 ' + minPct + '%)');
  /* 2) 0% 오행이 있으면 그것이 최소여야 한다 */
  ELS.forEach(function (el) {
    if (cnt[el] === 0 && pct[ext.weak] !== 0) fail('0% 오행이 있는데 최소가 다른 오행: ' + tag + ' → ' + ext.weak + ' ' + pct[ext.weak] + '%');
  });

  /* 3) 심층 본문 판정도 같은 결론인지 */
  var dx = E.deepRead(c);
  if (dx.thinEl !== ext.weak) fail('본문 최소 오행 불일치: ' + tag + ' → ' + dx.thinEl + ' ≠ ' + ext.weak);
  if (dx.strongEl !== ext.strong) fail('본문 최다 오행 불일치: ' + tag + ' → ' + dx.strongEl + ' ≠ ' + ext.strong);

  /* 4) 문장 검사 — 본문 전체를 만든다 */
  var texts = [];
  ['money', 'love', 'health', 'work', 'fate', 'reunion', 'exam'].forEach(function (cat) {
    texts.push(clean(W.reportHTML({ chart: c, char: W.charById('hwanggeum'), question: '지금 궁금한 걸 봐 주세요', category: cat, typeLabel: '질문즉답' })));
  });
  var y27 = window.SAJU_2027.build(c);
  D.Y2027.items.forEach(function (it) { texts.push(clean(W.y2027HTML(it, c, y27))); });
  texts.push(clean(W.daeunHTML(c, P.buildDaeun(c))));
  texts.push(clean(W.gililHTML(c, P.buildGilil(c, 2027))));
  texts.push(clean(W.todayHTML(E.getToday(), E.todayReading(c), true, c)));

  var gMax = GODS.slice().sort(function (a, b) { return c.godGroups[b] - c.godGroups[a]; })[0];
  var gMin = GODS.slice().sort(function (a, b) { return c.godGroups[a] - c.godGroups[b]; })[0];
  var gMaxN = c.godGroups[gMax], gMinN = c.godGroups[gMin];

  texts.forEach(function (t) {
    nTexts++;
    var m, re;
    /* "가장 얇" 문장 안에 최다 오행이 들어 있으면 모순 */
    t.replace(/[^.]*가장 얇[^.]*\./g, function (sn) {
      if (sn.indexOf(ext.strong + ' 기운') >= 0 || sn.indexOf(ext.strong + '(') >= 0) fail('최다 오행을 가장 얇다고 씀: ' + tag + ' → ' + sn.slice(0, 90));
      return sn;
    });
    /* 오행 퍼센티지 표기 */
    re = /(.)?(목|화|토|금|수)\s*(\d+)%/g;
    while ((m = re.exec(t))) {
      if (m[1] === '지' || m[1] === '중') continue;   // '지금 20%', '중화 50%' 제외
      if (+m[3] !== pct[m[2]]) fail('오행 퍼센트 표기 불일치: ' + tag + ' → ' + m[0] + ' (실제 ' + pct[m[2]] + ')');
    }
    /* 오행 글자 수 표기 */
    re = /(.)?(목|화|토|금|수)\s*(\d+)자/g;
    while ((m = re.exec(t))) {
      if (m[1] === '지') continue;
      if (+m[3] !== cnt[m[2]]) fail('오행 글자수 표기 불일치: ' + tag + ' → ' + m[0] + ' (실제 ' + cnt[m[2]] + ')');
    }
    /* 십신 개수 표기 */
    re = /(비겁|식상|재성|관성|인성)\s*(\d+)\s*개/g;
    while ((m = re.exec(t))) {
      if (+m[2] !== c.godGroups[m[1]]) fail('십신 개수 표기 불일치: ' + tag + ' → ' + m[0] + ' (실제 ' + c.godGroups[m[1]] + ')');
    }
    /* 십신 최다·최소 서술 */
    /* 십신 최다·최소 서술 — 동률이면 후보 중 하나를 골라도 맞으므로 개수로 비교한다 */
    re = /가장 두터운\s*(비겁|식상|재성|관성|인성)/g;
    while ((m = re.exec(t))) { if (c.godGroups[m[1]] !== gMaxN) fail('십신 최다 서술 불일치: ' + tag + ' → ' + m[1] + ' ' + c.godGroups[m[1]] + '개 (최다 ' + gMaxN + '개)'); }
    re = /가장 얇은\s*(비겁|식상|재성|관성|인성)/g;
    while ((m = re.exec(t))) { if (c.godGroups[m[1]] !== gMinN) fail('십신 최소 서술 불일치: ' + tag + ' → ' + m[1] + ' ' + c.godGroups[m[1]] + '개 (최소 ' + gMinN + '개)'); }
    re = /결핍된\s*(비겁|식상|재성|관성|인성)/g;
    while ((m = re.exec(t))) { if (c.godGroups[m[1]] !== gMinN) fail('십신 결핍 서술 불일치: ' + tag + ' → ' + m[1]); }
    /* "X가 비어" 서술은 실제 0개일 때만 */
    re = /(비겁|식상|재성|관성|인성)[이가]?\s*비어/g;
    while ((m = re.exec(t))) { if (c.godGroups[m[1]] !== 0) fail('십신 비어 있음 오표기: ' + tag + ' → ' + m[1] + ' ' + c.godGroups[m[1]] + '개'); }
    re = /(목|화|토|금|수)\s*기운이 아예 비어/g;
    while ((m = re.exec(t))) { if (cnt[m[1]] !== 0) fail('오행 비어 있음 오표기: ' + tag + ' → ' + m[1] + ' ' + cnt[m[1]] + '자'); }
  });
}

/* 표본: 1986~2006년 · 매달 3일 간격 · 시간 2종(미입력 포함) — 약 800사주 */
for (var y = 1990; y <= 2006; y += 4) {
  for (var m = 1; m <= 12; m += 1) {
    for (var d = 2; d <= 27; d += 12) {
      [null, 9].forEach(function (h) {
        checkChart(E.buildChart({ name: '검증', gender: (d % 2 ? 'male' : 'female'), year: y, month: m, day: d, hour: h, minute: 20 }));
      });
    }
  }
}

console.log('검증 사주 ' + nCharts + '건 · 검사 문장 묶음 ' + nTexts + '개');
console.log('오행 최다===최소 불일치 및 서술 모순: ' + (fails.length ? fails.length + '건' : '0건'));
if (fails.length) fails.forEach(function (f) { console.log('  ✗ ' + f); });
console.log(fails.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
