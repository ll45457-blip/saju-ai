/* ============================================================
   유료 본문 DOM 잠금 검증 (F12·소스 보기로 유료 본문이 새지 않는지)
   python3 tools/runjs.py tools/verify-lock.js
   잠금 상태 HTML에 유료 본문이 없고, 열람 코드로 풀린 뒤에만 나타나는지 확인한다.
   ============================================================ */
var E = window.SajuEngine, P = window.SAJU_PLUS, D = window.SAJU_DATA, W = window.WOLHA_APP;

function clean(h) { return String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '); }
var fails = 0, checks = 0;

function lock() { W.state.unlocked = []; }
function open() { W.grantAll(); }

function must(label, cond) {
  checks++;
  if (!cond) { fails++; console.log('  ✗ ' + label); }
}
function has(html, s) { return String(html).indexOf(s) >= 0; }

var c = E.buildChart({ name: '김검증', gender: 'female', year: 1995, month: 8, day: 15, hour: 12, minute: 0 });
var dx = E.deepRead(c);
var RX = window.SAJU_RX;

/* ---------- 1) 기본 리포트 ---------- */
lock();
var rL = W.reportHTML({ chart: c, char: W.charById('hwanggeum'), question: '요즘 고민이 있어요', category: 'money', typeLabel: '질문즉답' });
open();
var rO = W.reportHTML({ chart: c, char: W.charById('hwanggeum'), question: '요즘 고민이 있어요', category: 'money', typeLabel: '질문즉답' });

console.log('[기본 리포트]');
must('잠금 상태가 is-locked', has(rL, 'is-locked'));
must('유료 9번 제목이 잠금 DOM에 없음', !has(rL, '9. 여덟 글자의 뼈대'));
['10. 재물', '11. 일과 직장', '12. 연애', '13. 건강과 체력', '14. 질문에 대한 답', '15. 시기와 흐름', '16. 지금 할 일', '17. 조심할 점'].forEach(function (t) {
  must('유료 제목 「' + t + '」 잠금 DOM에 없음', !has(rL, t));
});
must('유료 앵커 id 가 잠금 DOM에 없음', !has(rL, 'id="rp-money"') && !has(rL, 'id="rp-love"') && !has(rL, 'id="rp-health"') && !has(rL, 'id="rp-todo"'));
must('9번 본문(dx.nature[1])이 잠금 DOM에 없음', !has(rL, dx.nature[1].slice(0, 40)));
must('재물 본문이 잠금 DOM에 없음', !has(rL, dx.money.paras[0].slice(0, 40)));
must('건강 본문이 잠금 DOM에 없음', !has(rL, dx.health.paras[0].slice(0, 40)));
must('질문 답변 본문이 잠금 DOM에 없음', !has(rL, RX.core(c, 'money').paras[0].slice(0, 40)));
must('잠금 티저는 있음', has(rL, 'pay-teaser'));
must('결제 카드(가격)는 잠금 상태에 있음', has(rL, '원</b>') && has(rL, 'pay-latpeed'));
must('상단 3줄 총평은 무료', has(rL, '핵심 총평 3줄') && has(rO, '핵심 총평 3줄'));
must('목차 점프 버튼은 무료', has(rL, 'data-jump="rp-manse"') && has(rL, 'data-jump="rp-todo"'));
must('부적 카드 버튼은 무료', has(rL, 'id="rpBuch"') && has(rO, 'id="rpBuch"'));
must('만세력·오행 섹션은 무료', has(rL, '1. 사주팔자 · 만세력') && has(rL, '2. 오행 분포 · 음양'));
must('잠금 상태에 18번 행운 포인트는 무료 공개', has(rL, '18. 행운 포인트'));

/* 열람 후 */
['9. 여덟 글자의 뼈대', '10. 재물', '12. 연애', '13. 건강과 체력', '16. 지금 할 일', '17. 조심할 점'].forEach(function (t) {
  must('열람 후 「' + t + '」 본문이 나타남', has(rO, t));
});
must('열람 후 재물 본문이 들어감', has(rO, dx.money.paras[0]));
must('열람 후 결제 카드가 사라짐', !has(rO, 'pay-card'));
must('열람 후 앵커 id 가 생김', has(rO, 'id="rp-money"') && has(rO, 'id="rp-todo"'));

/* ---------- 2) 2027 신년운세 ---------- */
console.log('[2027 신년운세]');
var item = D.Y2027.items.filter(function (x) { return x.id === 'newyear'; })[0];
var y = window.SAJU_2027.build(c);
lock();
var yL = W.y2027HTML(item, c, y);
open();
var yO = W.y2027HTML(item, c, y);
must('2027 잠금: 12개월 월운표 없음', !has(yL, '12개월 월운표'));
must('2027 잠금: 좋은 달 3 없음', !has(yL, '한눈에 · 좋은 달 3'));
must('2027 잠금: 결제 카드 있음', has(yL, 'pay-latpeed'));
must('2027 잠금: 무료 맛보기(미니 만세력) 있음', has(yL, 'y27-mini'));
must('2027 열람 후 월운표 있음', has(yO, '12개월 월운표') && has(yO, '좋은 달 3'));

/* ---------- 3) 정밀 궁합 ---------- */
console.log('[정밀 궁합]');
var c2 = E.buildChart({ name: '이상대', gender: 'male', year: 1993, month: 3, day: 9, hour: 7 });
var res = P.buildCompat(c, c2);
lock();
var cL = W.compatHTML(res);
open();
var cO = W.compatHTML(res);
must('궁합 잠금: 속궁합 본문 없음', !has(cL, '속궁합 —') && !has(cL, res.say.bed.slice(0, 30)));
must('궁합 잠금: 일간 해석 본문 없음', !has(cL, res.say.gan.slice(0, 30)));
must('궁합 잠금: 결혼 시기 없음', !has(cL, '결혼 시기</span>'));
must('궁합 잠금: 결제 카드 있음', has(cL, 'pay-latpeed'));
must('궁합 열람 후 속궁합 있음', has(cO, '속궁합 —') && has(cO, res.say.bed));

/* ---------- 4) 10년 대운 ---------- */
console.log('[10년 대운]');
var d = P.buildDaeun(c);
lock();
var dL = W.daeunHTML(c, d);
open();
var dO = W.daeunHTML(c, d);
must('대운 잠금: 지금 내 대운 구간 없음', !has(dL, '지금 내 대운'));
must('대운 잠금: 10년 카드(재물·커리어) 없음', !has(dL, 'du-card'));
must('대운 잠금: 결제 카드 있음', has(dL, 'pay-latpeed'));
must('대운 열람 후 지금 내 대운 있음', has(dO, '지금 내 대운') && has(dO, 'du-card'));

/* ---------- 5) 2027 길일 ---------- */
console.log('[2027 길일]');
var g = P.buildGilil(c, 2027);
lock();
var gL = W.gililHTML(c, g);
open();
var gO = W.gililHTML(c, g);
must('길일 잠금: 목적별 추천일 없음', !has(gL, '계약 · 매매') && !has(gL, 'gl-avoid-wrap'));
must('길일 잠금: 무료 달력은 있음', has(gL, 'gl-months'));
must('길일 잠금: 결제 카드 있음', has(gL, 'pay-latpeed'));
must('길일 열람 후 추천일 있음', has(gO, '계약 · 매매') && has(gO, 'gl-avoid-wrap'));

console.log('검사 ' + checks + '건 · 실패 ' + fails + '건');
console.log(fails === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
