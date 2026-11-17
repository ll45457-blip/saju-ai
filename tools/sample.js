var E = window.SajuEngine, RX = window.SAJU_RX, D = window.SAJU_DATA;
var people = [
  { name: '김민수', gender: 'male', year: 1995, month: 8, day: 15, hour: 12, minute: 0 },
  { name: '박서연', gender: 'female', year: 2002, month: 11, day: 3, hour: 0, minute: 30 },
  { name: '이승현', gender: 'male', year: 2001, month: 2, day: 23, hour: 8, minute: 0 }
];
people.forEach(function (p) {
  var c = E.buildChart(p);
  var core = RX.core(c, 'exam'), t = RX.timing(c, 'exam');
  console.log('===== ' + p.name + ' (' + c.ganji + ') — 시험');
  console.log('[14 lead] ' + core.lead);
  core.paras.forEach(function (x, i) { console.log('[14-' + (i + 2) + '] ' + x); });
  console.log('[15] ' + t.items.join('\n[15] '));
  console.log('[15 para] ' + t.para);
  RX.advice(c, 'exam').forEach(function (x, i) { console.log('[16-' + (i + 1) + '] ' + x); });
  RX.caution(c, 'exam').forEach(function (x, i) { console.log('[17-' + (i + 1) + '] ' + x); });
  console.log('[18] ' + RX.lucky(c).map(function (o) { return o.k + ': ' + o.v; }).join(' | '));
  console.log('');
});
