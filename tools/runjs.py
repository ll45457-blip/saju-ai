#!/usr/bin/env python3
"""Node가 없는 환경에서 saju-ai JS를 그대로 돌리기 위한 실행기.
   사용: python3 tools/runjs.py tools/verify-diff.js
   quickjs(파이썬 바인딩)로 엔진 파일을 수정 없이 실행한다."""
import sys, os, quickjs

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
script = sys.argv[1]
logs = []

ctx = quickjs.Context()
ctx.add_callable('__log', lambda s: logs.append(str(s)))
ctx.eval("""
var window = globalThis;
var console = { log: function(){ var a=[].slice.call(arguments).join(' '); __log(a); },
                warn: function(){ var a=[].slice.call(arguments).join(' '); __log(a); },
                error: function(){ var a=[].slice.call(arguments).join(' '); __log(a); } };
""")

ctx.eval("""
window.__WOLHA_TEST__ = true;
window.document = {
  querySelector: function(){ return node(); },
  querySelectorAll: function(){ return []; },
  addEventListener: function(){},
  createElement: function(){ return node(); },
  body: { style: {} },
  documentElement: { style: {} },
  title: ''
};
function node() {
  return { addEventListener: function(){}, removeEventListener: function(){}, appendChild: function(){},
    classList: { add: function(){}, remove: function(){}, toggle: function(){}, contains: function(){ return false; } },
    style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '',
    querySelector: function(){ return node(); }, querySelectorAll: function(){ return []; },
    setAttribute: function(){}, remove: function(){}, scrollIntoView: function(){}, focus: function(){}, click: function(){} };
}
window.localStorage = { getItem: function(){ return null; }, setItem: function(){} };
window.requestAnimationFrame = function(f){ if (f) f(); };
window.scrollTo = function(){};
window.print = function(){};
window.matchMedia = function(){ return { matches: false, addEventListener: function(){} }; };
""")
for f in ['data.js', 'saju-engine.js', 'saju-2027.js', 'saju-plus.js', 'saju-rx.js', 'app.js']:
    p = os.path.join(root, f)
    if not os.path.exists(p):
        continue
    try:
        ctx.eval(open(p, encoding='utf-8').read())
    except Exception as e:
        print('LOAD ERROR', f, e)
        raise
ctx.eval(open(script, encoding='utf-8').read())
for line in logs:
    print(line)
