/* ============================================================
   실제 앱 렌더링 문자열 비교 — 기본 리포트(9~18)·2027 6종·궁합·대운·길일·오늘
   node tools/verify-app.js  (node가 없으면 python3 tools/runjs.py tools/verify-app.js)
   ============================================================ */
var E = window.SajuEngine, P = window.SAJU_PLUS, RX = window.SAJU_RX, D = window.SAJU_DATA;

var people = [
  { name: '김민수', gender: 'male', year: 1995, month: 8, day: 15, hour: 12, minute: 0 },
  { name: '박서연', gender: 'female', year: 2002, month: 11, day: 3, hour: 0, minute: 30 },
  { name: '이승현', gender: 'male', year: 2001, month: 2, day: 23, hour: 8, minute: 0 }
];
var CATS = ['money', 'exam', 'love', 'reunion', 'work', 'fate'];
var charts = people.map(function (p) { return E.buildChart(p); });
var W = window.WOLHA_APP;

function clean(html) {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
/* 해석 문장만 뽑는다 — 결제카드·버튼·법적 고지·섹션 제목 같은 공통 UI는 제외 */
function textOf(html) {
  var out = [], m, re;
  function add(t) { t = clean(t); if (t.length > 8) out.push(t); }
  re = /<p class="(?:rp-para|rp-lead|rp-voice)">([\s\S]*?)<\/p>/g;
  while ((m = re.exec(html))) add(m[1]);
  re = /<ul class="rp-list(?: advice)?">([\s\S]*?)<\/ul>/g;
  while ((m = re.exec(html))) {
    var inner = m[1], li;
    var re2 = /<li[^>]*>([\s\S]*?)<\/li>/g;
    while ((li = re2.exec(inner))) add(li[1]);
  }
  re = /<div class="rp-caution"[^>]*>([\s\S]*?)<\/div>/g;
  while ((m = re.exec(html))) add(m[1]);
  re = /<p class="gl-tip">([\s\S]*?)<\/p>/g;
  while ((m = re.exec(html))) add(m[1]);
  re = /<p>([\s\S]*?)<\/p>/g;
  while ((m = re.exec(html))) add(m[1]);
  re = /<div class="lucky-item"><span>[^<]*<\/span><b[^>]*>([\s\S]*?)<\/b><\/div>/g;
  while ((m = re.exec(html))) add(m[1]);
  re = /<div class="cp-chem-item"><b>[^<]*<\/b><span>([\s\S]*?)<\/span><\/div>/g;
  while ((m = re.exec(html))) add(m[1]);
  return out;
}

var reportSets = charts.map(function (c) {
  var out = [];
  CATS.forEach(function (cat) {
    var html = W.reportHTML({ chart: c, char: W.charById('hwanggeum'), question: '지금 제일 궁금한 걸 봐 주세요', category: cat, typeLabel: '질문즉답' });
    out = out.concat(textOf(html));
  });
  return out;
});

var y27Set = charts.map(function (c) {
  var out = [];
  D.Y2027.items.forEach(function (it) {
    out = out.concat(textOf(W.y2027HTML(it, c, window.SAJU_2027.build(c))));
  });
  return out;
});

var daeunSet = charts.map(function (c) { return textOf(W.daeunHTML(c, P.buildDaeun(c))); });
var gililSet = charts.map(function (c) { return textOf(W.gililHTML(c, P.buildGilil(c, 2027))); });
var todaySet = charts.map(function (c) { return textOf(W.todayHTML(E.getToday(), E.todayReading(c), true, c)); });
var compatSet = [
  textOf(W.compatHTML(P.buildCompat(charts[0], charts[1]))),
  textOf(W.compatHTML(P.buildCompat(charts[2], charts[1])))
];

var total = 0, dup = 0;
function cmp(name, sets) {
  for (var a = 0; a < sets.length; a++) {
    for (var b = a + 1; b < sets.length; b++) {
      var map = {};
      sets[a].forEach(function (s) { map[s] = 1; });
      sets[b].forEach(function (s) {
        total++;
        if (map[s]) { dup++; console.log('DUP [' + name + '] ' + s.slice(0, 100)); }
      });
    }
  }
}
cmp('기본 리포트', reportSets);
cmp('2027 6종', y27Set);
cmp('10년 대운', daeunSet);
cmp('2027 길일', gililSet);
cmp('오늘의 운세', todaySet);
cmp('정밀 궁합', compatSet);

console.log('---');
console.log('렌더링 문장 ' + total + '쌍 비교 · 동일 ' + dup + '건');
['기본 리포트', '2027 6종', '대운', '길일', '오늘', '궁합'].forEach(function (n, i) {
  var arr = [reportSets, y27Set, daeunSet, gililSet, todaySet, compatSet][i];
  console.log(n + ': ' + arr.map(function (a) { return a.length; }).join(' / ') + ' 문장');
});
/* 16번 영역만 따로 */
var adv = charts.map(function (c, i) {
  return RX.advice(c, 'exam');
});
var seen = {}, dupAdv = 0;
adv.forEach(function (arr) { arr.forEach(function (s) { if (seen[s]) dupAdv++; seen[s] = 1; }); });
console.log('16. 지금 할 일(시험 주제) 중복 ' + dupAdv + '건');
console.log(dup === 0 && dupAdv === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
