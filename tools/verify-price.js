/* ============================================================
   가격 표기 통일 검증 — 래피드 3티어(5,900 / 14,900 / 29,000)와
   사이트의 모든 가격 라벨·결제 카드 기본값이 일치하는지 확인한다.
   python3 tools/runjs.py tools/verify-price.js
   ============================================================ */
var E = window.SajuEngine, P = window.SAJU_PLUS, D = window.SAJU_DATA, W = window.WOLHA_APP;

var fails = 0, checks = 0;
function must(label, cond) { checks++; if (!cond) { fails++; console.log('  ✗ ' + label); } }
function has(h, s) { return String(h).indexOf(s) >= 0; }
/* 브라우저에서는 toLocaleString('ko-KR')이 쉼표를 넣지만 quickjs에는 Intl이 없어 그대로 나온다 */
function won(n) { return n.toLocaleString('ko-KR'); }
function priceText(n) { return won(n) + '원'; }
function noOld(h, where) {
  /* 14,900 안에 '4,900'이 들어 있으므로 새 가격을 먼저 걷어 내고 옛 가격만 찾는다 */
  var z = String(h).replace(/14900/g, '').replace(/14,900/g, '');
  [priceText(4900), priceText(6900), priceText(9900), '4,900', '6,900', '9,900'].forEach(function (s) {
    must(where + ' 에 옛 가격 「' + s + '」 없음', !has(z, s));
  });
}

/* ---------- 1) 데이터 라벨 ---------- */
console.log('[데이터 라벨]');
D.CHARACTERS.forEach(function (c) {
  must('도사 「' + c.name + '」 가격 = 5,900원', c.price === 5900);
});
var T2 = D.Y2027.items.filter(function (x) { return x.id === 'newyear'; })[0];
must('2027 신년운세 카드 = 14,900원', T2.price === 14900);
['samjae', 'calendar', 'reunion'].forEach(function (id) {
  var it = D.Y2027.items.filter(function (x) { return x.id === id; })[0];
  must('2027 「' + it.title + '」 카드 = 5,900원', it.price === 5900);
});
['moneyleak', 'sal'].forEach(function (id) {
  var it = D.Y2027.items.filter(function (x) { return x.id === id; })[0];
  must('2027 「' + it.title + '」 무료 유지', it.price === 0);
});

/* ---------- 2) 결제 카드 기본 티어 · 금액 ---------- */
console.log('[결제 카드]');
var c = E.buildChart({ name: '김검증', gender: 'female', year: 1995, month: 8, day: 15, hour: 12, minute: 0 });
var c2 = E.buildChart({ name: '이상대', gender: 'male', year: 1993, month: 3, day: 9, hour: 7 });
W.state.unlocked = [];

function tierOf(html) {
  var m = /data-pay="[^"]+" data-price="(\d+)" data-tier="(t\d)"/.exec(html);
  return m ? { price: +m[1], tier: m[2] } : null;
}

var rL = W.reportHTML({ chart: c, char: W.charById('hwanggeum'), question: '요즘 고민이 있어요', category: 'money', typeLabel: '질문즉답' });
var t = tierOf(rL);
must('기본 리포트 결제 카드 = T1 5,900원', !!t && t.tier === 't1' && t.price === 5900);
must('기본 리포트 카드에 ' + priceText(5900) + ' 표기', has(rL, priceText(5900)));
must('기본 리포트 카드에 ' + priceText(14900) + ' / ' + priceText(29000) + ' 안내', has(rL, priceText(14900)) && has(rL, priceText(29000)));
must('기본 리포트 카드에 3개 티어', (rL.match(/role="radio"/g) || []).length === 3);
noOld(rL, '기본 리포트 결제 카드');

var y = window.SAJU_2027.build(c);
var yL = W.y2027HTML(T2, c, y);
t = tierOf(yL);
must('2027 신년운세 결제 카드 = T2 14,900원', !!t && t.tier === 't2' && t.price === 14900);
must('2027 신년운세 카드 가격 라벨 ' + priceText(14900), has(yL, priceText(14900)));
noOld(yL, '2027 신년운세 결제 카드');

var res = P.buildCompat(c, c2);
var cpL = W.compatHTML(res);
t = tierOf(cpL);
must('궁합 결제 카드 = T3 29,000원 (전체 열람 기본)', !!t && t.tier === 't3' && t.price === 29000);
must('궁합 카드에 ' + priceText(29000) + ' 표기', has(cpL, priceText(29000)));
must('궁합 카드 T3 에 전체 열람 스코프 안내', has(cpL, '궁합 · 대운 · 길일까지 전체 열람'));
noOld(cpL, '궁합 결제 카드');

var d = P.buildDaeun(c);
var duL = W.daeunHTML(c, d);
t = tierOf(duL);
must('대운 결제 카드 = T3 29,000원', !!t && t.tier === 't3' && t.price === 29000);
noOld(duL, '대운 결제 카드');

var g = P.buildGilil(c, 2027);
var glL = W.gililHTML(c, g);
t = tierOf(glL);
must('길일 결제 카드 = T3 29,000원', !!t && t.tier === 't3' && t.price === 29000);
noOld(glL, '길일 결제 카드');

/* 2027 삼재/재물/재회 = 기본 리포트 스코프 → T1 */
var sam = D.Y2027.items.filter(function (x) { return x.id === 'samjae'; })[0];
t = tierOf(W.y2027HTML(sam, c, y));
must('2027 삼재 결제 카드 = T1 5,900원', !!t && t.tier === 't1' && t.price === 5900);

/* ---------- 3) 열람 코드 스코프와 티어 매칭 ---------- */
console.log('[코드 ↔ 티어]');
var CO = window.WOLHA_CODES;
function scopeOf(pre) { return CO.PRODUCTS[pre].scope; }
must('T1 코드(WLRP) = report 스코프', scopeOf('WLRP') === 'report');
must('T2 코드(WL27) = y2027 스코프', scopeOf('WL27') === 'y2027');
must('T3 코드(WLALL) = all 스코프 (궁합·대운·길일 포함)', scopeOf('WLALL') === 'all');

console.log('검사 ' + checks + '건 · 실패 ' + fails + '건');
console.log(fails === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
