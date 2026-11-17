/* ============================================================
   전수 비교 검증 — 서로 다른 사주에 같은 문장이 나오는지 확인
   실행: node tools/verify-diff.js  (node가 없으면 python3 tools/runjs.py tools/verify-diff.js)
   ============================================================ */
var E = window.SajuEngine, P = window.SAJU_PLUS, Y27 = window.SAJU_2027, RX = window.SAJU_RX;

var people = [
  { name: '김민수', gender: 'male', year: 1995, month: 8, day: 15, hour: 12, minute: 0 },
  { name: '박서연', gender: 'female', year: 2002, month: 11, day: 3, hour: 0, minute: 30 },
  { name: '최지우', gender: 'female', year: 2001, month: 2, day: 23, hour: 8, minute: 0 }
];
var CATS = ['love', 'reunion', 'heart', 'money', 'work', 'exam', 'health', 'fate'];

function clean(s) {
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function reportText(c) {
  var dx = E.deepRead(c), out = [], cat, i, rx;
  dx.nature.forEach(function (p) { out.push(p); });
  ['money', 'work', 'love', 'health'].forEach(function (k) {
    dx[k].paras.forEach(function (p) { out.push(p); });
    RX.tips(c, k).forEach(function (p) { out.push(p); });
  });
  for (i = 0; i < CATS.length; i++) {
    cat = CATS[i];
    rx = RX.core(c, cat); out.push(rx.lead); rx.paras.forEach(function (p) { out.push(p); });
    rx = RX.timing(c, cat); rx.items.forEach(function (p) { out.push(p); }); out.push(rx.para);
    RX.advice(c, cat).forEach(function (p) { out.push(p); });
    RX.caution(c, cat).forEach(function (p) { out.push(p); });
    RX.lucky(c).forEach(function (o) { out.push(o.k + ' ' + o.v); });
  }

  return out.map(clean).filter(Boolean);
}

function otherText(c) {
  var out = [], f = RX.facts(c), y = Y27.build(c), d = P.buildDaeun(c), i;
  /* 2027 6종 */
  y.months.forEach(function (m) { (m.story || [m.line]).forEach(function (s) { out.push(s); }); out.push(m.fix); out.push(m.pick); });
  ['newyear', 'samjae', 'moneyleak', 'sal', 'calendar', 'reunion'].forEach(function (k) {
    var r = RX.y27(f, k, y);
    if (r.rules) r.rules.forEach(function (s) { out.push(s); });
    if (r.todo) r.todo.forEach(function (s) { out.push(s); });
    if (r.lines) r.lines.forEach(function (s) { out.push(s); });
    if (r.note) out.push(r.note);
  });
  y.sal.forEach(function (s) { out.push(RX.salLine(c, s)); });
  y.leaks.forEach(function (s) { out.push(s.why); out.push(s.fix); });
  out.push(y.guin.note);
  /* 대운 */
  d.list.forEach(function (x) {
    var s = RX.daeunCard(c, x);
    ['key', 'flow', 'money', 'work', 'life'].forEach(function (k) { out.push(s[k]); });
  });
  [0, 1, 2].forEach(function (idx) {
    out.push(RX.gililTip(c, 'contract', idx));
    out.push(RX.gililTip(c, 'job', idx));
    out.push(RX.gililTip(c, 'move', idx));
  });
  RX.daeunTips(c).forEach(function (s) { out.push(s); });
  /* 오늘 */
  var r = E.todayReading(c);
  var t = RX.today(f, r);
  out.push(t.head); out.push(t.body); out.push(t.do); out.push(t.avoid); out.push(t.note);
  /* 2027 행운 */
  RX.lucky(c).forEach(function (o) { out.push(o.k + ' ' + o.v); });
  return out.map(clean).filter(Boolean);
}

var charts = people.map(function (p) { return E.buildChart(p); });
var texts = charts.map(function (c) { return reportText(c); });
var others = charts.map(function (c) { return otherText(c); });

var bad = 0, checked = 0;
function compare(name, sets) {
  for (var a = 0; a < sets.length; a++) {
    for (var b = a + 1; b < sets.length; b++) {
      var map = {};
      sets[a].forEach(function (s) { map[s] = 1; });
      sets[b].forEach(function (s) {
        checked++;
        if (map[s]) {
          bad++;
          console.log('DUP [' + name + '] ' + people[a].name + ' ↔ ' + people[b].name + ' : ' + s.slice(0, 90));
        }
      });
    }
  }
}
compare('리포트 9~18', texts);
compare('2027·대운·길일·오늘', others);

/* 궁합: (김·박) vs (이·박) — 같은 박서연을 기준으로 상대만 바꿔 비교 */
var res1 = P.buildCompat(charts[0], charts[1]);
var res2 = P.buildCompat(charts[2], charts[1]);
var c1 = [RX.compat(res1).open, res1.say.gan, res1.say.ji, res1.say.cross, res1.say.fill, res1.say.bed, res1.say.marriage, res1.say.fight, res1.say.peace].concat(RX.compat(res1).rx);
var c2 = [RX.compat(res2).open, res2.say.gan, res2.say.ji, res2.say.cross, res2.say.fill, res2.say.bed, res2.say.marriage, res2.say.fight, res2.say.peace].concat(RX.compat(res2).rx);
c1 = c1.map(clean); c2 = c2.map(clean);
var m = {}; c1.forEach(function (s) { m[s] = 1; });
c2.forEach(function (s) { checked++; if (m[s]) { bad++; console.log('DUP [궁합] ' + s.slice(0, 90)); } });

/* 같은 주제(황금도사=재물) 16번 영역 집중 확인 */
CATS.forEach(function (cat) {
  var sets = charts.map(function (c) { return RX.advice(c, cat).map(clean); });
  var seen = {}, dup = 0;
  sets.forEach(function (arr) { arr.forEach(function (s) { if (seen[s]) dup++; seen[s] = 1; }); });
  console.log('[' + cat + '] 지금 할 일 문장 ' + sets[0].length + '개씩 · 중복 ' + dup + '건');
});

console.log('---');
console.log('비교한 문장 ' + checked + '쌍 · 동일 문장 ' + bad + '건');
people.forEach(function (p, i) {
  console.log(p.name + ': 리포트 ' + texts[i].length + '문장, 기타 ' + others[i].length + '문장');
});
console.log(bad === 0 ? 'RESULT: PASS — 동일 문장 0건' : 'RESULT: FAIL');
