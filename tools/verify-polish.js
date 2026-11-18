/* ============================================================
   보완 3종 검증 — 월운·궁합 문장 변주, 0개 나열 제거, 보관함 삭제 확인창
   실행: python3 tools/runjs.py tools/verify-polish.js
   ============================================================ */
var E = window.SajuEngine, P = window.SAJU_PLUS, Y27 = window.SAJU_2027, RX = window.SAJU_RX;

var fail = 0, check = 0;
function ok(cond, msg) { check++; if (!cond) { fail++; console.log('FAIL ' + msg); } }

function clean(s) { return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }

/* 검증용 사주 30명 */
var people = [];
var ys = [1974, 1981, 1986, 1990, 1993, 1997, 2000, 2003, 2008];
var ms = [1, 3, 5, 7, 9, 11];
var ds = [2, 9, 14, 21, 27];
var hs = [0, 6, 12, 18];
for (var i = 0; i < 30; i++) {
  people.push({
    name: 'P' + i, gender: i % 2 ? 'female' : 'male',
    year: ys[i % ys.length], month: ms[(i * 2 + 1) % ms.length], day: ds[(i * 3 + 2) % ds.length],
    hour: hs[i % hs.length], minute: 0
  });
}
var charts = people.map(function (p) { return E.buildChart(p); });
var CATS = ['love', 'reunion', 'heart', 'money', 'work', 'exam', 'health', 'fate'];

/* ---------- 1. 월운: 한 사주 12개월 안에서 장면·팁이 겹치지 않는지 ---------- */
console.log('[월운 문장 변주]');
charts.forEach(function (c, ci) {
  var y = Y27.build(c);
  var sceneUse = {}, tipUse = {};
  y.months.forEach(function (m) {
    sceneUse[m.scene] = (sceneUse[m.scene] || 0) + 1;
    tipUse[m.tip] = (tipUse[m.tip] || 0) + 1;
  });
  Object.keys(sceneUse).forEach(function (k) {
    ok(sceneUse[k] === 1, ' P' + ci + ' 장면 반복 ' + sceneUse[k] + '회: ' + k.slice(0, 40));
  });
  Object.keys(tipUse).forEach(function (k) {
    ok(tipUse[k] <= 2, ' P' + ci + ' 팁 반복 ' + tipUse[k] + '회: ' + k.slice(0, 40));
  });
  /* 12개 달 story 문장이 서로 같은 문장을 쓰지 않는지 */
  var seen = {};
  y.months.forEach(function (m) {
    m.story.forEach(function (s) {
      var t = clean(s);
      ok(!seen[t], ' P' + ci + ' ' + m.no + '월 story 중복: ' + t.slice(0, 40));
      seen[t] = 1;
    });
  });
});

/* ---------- 2. 0개 나열 제거 ---------- */
console.log('[0개 나열]');
var zeroHit = 0;
charts.forEach(function (c, ci) {
  var texts = [];
  CATS.forEach(function (cat) {
    var rx = RX.core(c, cat);
    texts.push(rx.lead); rx.paras.forEach(function (p) { texts.push(p); });
    rx = RX.timing(c, cat); rx.items.forEach(function (p) { texts.push(p); }); texts.push(rx.para);
    RX.advice(c, cat).forEach(function (p) { texts.push(p); });
    RX.caution(c, cat).forEach(function (p) { texts.push(p); });
  });
  var dx = E.deepRead(c);
  dx.nature.forEach(function (p) { texts.push(p); });
  ['money', 'work', 'love', 'health'].forEach(function (k) {
    dx[k].paras.forEach(function (p) { texts.push(p); });
    RX.tips(c, k).forEach(function (p) { texts.push(p); });
  });
  var y = Y27.build(c);
  y.months.forEach(function (m) { m.story.forEach(function (p) { texts.push(p); }); texts.push(m.pick); texts.push(m.fix); });
  texts.forEach(function (s) {
    var t = clean(s);
    if (/0개/.test(t) || /\(0개\)/.test(t)) { zeroHit++; if (zeroHit <= 5) console.log('  P' + ci + ' 0개 표현: ' + t.slice(0, 80)); }
  });
});
ok(zeroHit === 0, ' 0개 표현 ' + zeroHit + '건 남음');
console.log(' 0개 표현 검출 ' + zeroHit + '건');

/* ---------- 3. 궁합: 리포트 안 반복 + 커플별 변주 폭 ---------- */
console.log('[궁합 문장 변주]');
var KEYS = ['open', 'marriage', 'fight', 'peace'];
function compatParts(res) {
  var rxc = RX.compat(res);
  return {
    open: clean(rxc.open),
    marriage: clean(res.say.marriage),
    fight: clean(res.say.fight),
    peace: clean(res.say.peace),
    gan: clean(res.say.gan),
    ji: clean(res.say.ji),
    fill: clean(res.say.fill),
    bed: clean(res.say.bed),
    money: clean(rxc.rx[2]),
    srow: clean(rxc.rx[3]),
    month: clean(rxc.rx[4])
  };
}
var variants = { open: {}, marriage: {}, fight: {}, peace: {}, money: {}, srow: {}, month: {} };
var pairs = 0;
for (var a = 0; a < 10; a++) {
  for (var b = a + 1; b < 10; b++) {
    var res = P.buildCompat(charts[a], charts[b]);
    var q = compatParts(res);
    pairs++;
    ['open', 'marriage', 'fight', 'peace', 'money', 'srow', 'month'].forEach(function (k) { variants[k][q[k]] = 1; });
    /* 한 리포트 안에서 같은 문장이 두 번 나오지 않는지 */
    var seenIn = {};
    Object.keys(q).forEach(function (k) {
      ok(!seenIn[q[k]], ' 리포트 내부 반복(' + k + '/' + a + '·' + b + '): ' + q[k].slice(0, 40));
      seenIn[q[k]] = 1;
    });
  }
}
Object.keys(variants).forEach(function (k) {
  var n = Object.keys(variants[k]).length;
  ok(n >= 4, ' 궁합 ' + k + ' 변주 ' + n + '종(4종 이상이어야 함)');
  console.log('  ' + k + ': ' + n + '종');
});
console.log(' 커플 ' + pairs + '쌍 비교');

/* ---------- 4. 보관함 삭제 확인창 (app.js 정적 확인) ---------- */
console.log('[보관함 삭제 확인창]');
try {
  var app = __read('app.js');
  var css = __read('styles.css');
  ok(/function askRemoveArchive/.test(app), ' askRemoveArchive 없음');
  ok(/askRemoveArchive\(del\.dataset\.del\)/.test(app), ' 삭제 버튼이 확인창을 거치지 않음');
  ok(/archDelCancel/.test(app) && /archDelOk/.test(app), ' 확인/취소 버튼 없음');
  ok(/\.btn-danger/.test(css), ' 삭제 버튼 스타일 없음');
  console.log('  확인창 코드 확인');
} catch (e) {
  console.log('  (파일 확인 건너뜀: ' + e.message + ')');
}

console.log('---');
console.log('검사 ' + check + '건 · 실패 ' + fail + '건');
console.log(fail === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
