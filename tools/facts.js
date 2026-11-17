/* 세 사주 지표 출력 — node 없이 tools/runjs.py로 실행 */
var E = window.SajuEngine, P = window.SAJU_PLUS, Y27 = window.SAJU_2027;
var people = [
  { name: '김민수', gender: 'male', year: 1995, month: 8, day: 15, hour: 12, minute: 0 },
  { name: '박서연', gender: 'female', year: 2002, month: 11, day: 3, hour: 0, minute: 30 },
  { name: '최지우', gender: 'female', year: 2001, month: 2, day: 23, hour: 8, minute: 0 }
];
people.forEach(function (p) {
  var c = E.buildChart(p);
  var d = P.buildDaeun(c);
  var y = Y27.build(c);
  console.log('==== ' + p.name + ' ' + c.ganji + ' ' + c.ganjiKo);
  console.log('일간 ' + c.dayMaster.hanja + c.dayMaster.ko + c.dayMaster.elem + ' | 형세 ' + c.strengthKo + ' ' + c.strengthRatio + ' | 용신 ' + c.yongsin.elem + ' 희신 ' + c.yongsin.hee);
  console.log('counts ' + JSON.stringify(c.counts) + ' pct ' + JSON.stringify(c.pct) + ' missing ' + c.missing.join(','));
  console.log('godGroups ' + JSON.stringify(c.godGroups));
  console.log('gods ' + JSON.stringify(c.gods));
  console.log('stages ' + JSON.stringify(c.stages) + ' sinsal ' + JSON.stringify(c.sinsal));
  console.log('천을 ' + c.gwisin.cheoneul.chars.join('·') + ' hits ' + c.gwisin.cheoneul.hits.join(',') + ' | 천덕 ' + c.gwisin.cheondeok.char + ' | 월덕 ' + c.gwisin.woldeok.char);
  console.log('음양 ' + c.yinyang.yangPct + ':' + c.yinyang.yinPct);
  console.log('대운 ' + d.dirText + ' ' + d.su.text + ' | current ' + (d.current ? (d.current.hanja + ' ' + d.current.stemGod + '/' + d.current.branchGod + ' ' + d.current.stage + ' ' + d.current.ageFrom + '~' + d.current.ageTo) : 'none'));
  console.log('2027 good ' + y.good.map(function (m) { return m.no + '월'; }).join(',') + ' warn ' + y.warn.map(function (m) { return m.no + '월'; }).join(',') + ' | ' + y.samjae.head);
  console.log('2027 sal ' + y.sal.map(function (s) { return s.name + (s.on ? '○' : '×'); }).join(' ') + ' | reunion open ' + y.reunion.open.join(',') + ' rough ' + y.reunion.rough.join(','));
  console.log('');
});
