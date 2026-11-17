var E = window.SajuEngine;
var c = E.buildChart({ name: 'A', gender: 'male', year: 1995, month: 8, day: 15, hour: 0, minute: 30 });
var r = E.todayReading(c);
console.log('reading keys: ' + Object.keys(r).join(','));
try { var s = JSON.stringify({ chart: c, reading: r }); console.log('ok len=' + s.length); }
catch (e) { console.log('THROW: ' + e.message); }
