/* ============================================================
   월하사주 · app.js  (의존: data.js, saju-engine.js)
   ============================================================ */
(function () {
  'use strict';

  const D = window.SAJU_DATA, E = window.SajuEngine, Y27 = window.SAJU_2027;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const won = n => n.toLocaleString('ko-KR');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => (n < 10 ? '0' + n : '' + n);
  const ELCLS = { 목: 'e-mok', 화: 'e-hwa', 토: 'e-to', 금: 'e-geum', 수: 'e-su' };
  const STAGE_NOTE = { 장생: '시작과 생기', 목욕: '감정의 파동', 관대: '사회적 성장', 건록: '자립과 실력', 제왕: '힘의 정점', 쇠: '완만한 하강', 병: '점검과 회복', 사: '비움과 정리', 묘: '저장과 축적', 절: '전환점', 태: '잉태와 준비', 양: '보호와 성장' };

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const K_PROFILE = 'wolha_profile_v1';
  const K_HISTORY = 'wolha_history_v1';
  const K_TRIAL = 'wolha_trial_v1';

  const state = {
    view: 'home',
    profile: store.get(K_PROFILE, null),
    history: store.get(K_HISTORY, []),
    unlocked: store.get(K_TRIAL, {}),
    askChar: D.CHARACTERS[0].id,
    askTopic: null,
    heroTimer: null,
    pending: null   // {question, category, charId, type, title} → 생년월일 확인 후 실행
  };

  /* ---------------- 유틸 ---------------- */
  const charById = id => D.CHARACTERS.find(c => c.id === id) || D.CHARACTERS[0];

  function categoryOf(text) {
    const t = (text || '') + ' ';
    const has = arr => arr.some(w => t.includes(w));
    if (has(['속마음', '생각할까', '어떻게 생각', '마음'])) return 'heart';
    if (has(['재회', '다시 만날', '연락 올', '연락이 올', '헤어진'])) return 'reunion';
    if (has(['재물', '돈', '부업', '투자', '수익', '월급'])) return 'money';
    if (has(['이직', '직업', '사업', '승진', '회사', '일을'])) return 'work';
    if (has(['시험', '합격', '공부', '자격'])) return 'exam';
    if (has(['건강', '몸'])) return 'health';
    if (has(['연애', '썸', '고백', '사귈', '결혼', '애정', '짝사랑'])) return 'love';
    return 'fate';
  }

  function charForCategory(cat) {
    return { love: 'yeonhwa', reunion: 'yeonhwa', heart: 'yeonhwa', money: 'hwanggeum', work: 'baekho', exam: 'baekho', health: 'cheongwol', fate: 'cheongwol', today: 'geumbangul' }[cat] || 'yeonhwa';
  }

  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ---------------- 시트 ---------------- */
  let sheetOnClose = null;
  function openSheet(title, html, onClose) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheetBody').onclick = null;
    $('#sheet').hidden = false; $('#dim').hidden = false;
    $('#sheetBody').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    sheetOnClose = onClose || null;
  }
  function closeSheet() {
    $('#sheet').hidden = true; $('#dim').hidden = true;
    document.body.style.overflow = '';
    const f = sheetOnClose; sheetOnClose = null;
    if (f) f();
  }
  $('#sheetClose').addEventListener('click', closeSheet);
  $('#dim').addEventListener('click', closeSheet);

  /* ---------------- 라우팅 ---------------- */
  function showView(name) {
    state.view = name;
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.nav === name));
    if (name === 'today') renderTodayPage();
    if (name === 'ask') { renderAskChips(); renderAskProfile(); }
    if (name === 'archive') renderArchive();
    window.scrollTo({ top: 0 });
  }

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); showView(nav.dataset.nav); }
  });

  /* ---------------- 홈: 히어로 ---------------- */
  function renderHero() {
    const track = $('#heroTrack'), dots = $('#heroDots');
    track.innerHTML = D.CHARACTERS.map((c, i) => (
      '<div class="hero-slide" data-char="' + c.id + '" role="button" aria-label="' + esc(c.name) + '에게 질문하기">' +
      '<img src="' + c.img + '" alt="' + esc(c.name) + '" loading="' + (i ? 'lazy' : 'eager') + '" />' +
      (c.badge ? '<span class="hero-badge">' + esc(c.badge) + '</span>' : '') +
      '<div class="hero-body">' +
      '<div class="hero-fields">' + c.fields.map(f => '<span>' + esc(f) + '</span>').join('') + '</div>' +
      '<h3 class="hero-name">' + esc(c.name) + '<small>' + esc(c.hanja) + '</small></h3>' +
      '<p class="hero-tag">' + esc(c.tagline) + '</p>' +
      '<span class="hero-cta">바로 질문하기</span>' +
      '<span class="hero-price"><s>' + won(c.listPrice) + '원</s> <b>' + won(c.price) + '원</b></span>' +
      '</div></div>'
    )).join('');
    dots.innerHTML = D.CHARACTERS.map((_, i) => '<i' + (i === 0 ? ' class="on"' : '') + '></i>').join('');

    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / (track.scrollWidth / D.CHARACTERS.length));
      $$('i', dots).forEach((d, j) => d.classList.toggle('on', j === Math.min(i, D.CHARACTERS.length - 1)));
    }, { passive: true });

    let paused = false;
    track.addEventListener('pointerdown', () => { paused = true; });
    track.addEventListener('pointerup', () => { paused = false; });
    state.heroTimer = setInterval(() => {
      if (paused || state.view !== 'home') return;
      const w = track.scrollWidth / D.CHARACTERS.length;
      const next = track.scrollLeft + w >= track.scrollWidth - 10 ? 0 : track.scrollLeft + w;
      track.scrollTo({ left: next, behavior: 'smooth' });
    }, 4600);

    track.addEventListener('click', e => {
      const s = e.target.closest('.hero-slide');
      if (s) openProduct(s.dataset.char);
    });
  }

  /* ---------------- 홈: 주제 그리드 ---------------- */
  function renderTopics() {
    $('#topicGrid').innerHTML = D.TOPICS.map(t => (
      '<button class="topic" data-topic="' + t.id + '" aria-label="' + esc(t.label) + '">' +
      '<span class="topic-glyph">' + t.icon + '</span>' +
      '<span class="topic-label">' + esc(t.label) + '</span>' +
      '</button>'
    )).join('');
    $('#topicGrid').addEventListener('click', e => {
      const b = e.target.closest('.topic'); if (!b) return;
      const t = D.TOPICS.find(x => x.id === b.dataset.topic);
      if (t.id === 'today') { showView('today'); return; }
      if (t.id === 'newyear' && Y27) { y2027Open('newyear'); return; }
      if (t.id === 'free') { showView('home'); $('#freeGrid').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (t.id === 'match' || t.id === 'wedding' || t.id === 'reunion') { openCompatForm({ topic: t }); return; }
      if (t.id === 'classic') { openDaeun(); return; }
      openAskWithTopic(t);
    });
  }

  /* ---------------- 홈: 무료 질문 ---------------- */
  function renderHomeChips() {
    $('#homeChips').innerHTML = D.CHIPS.home.map(q => '<button type="button" class="chip">' + esc(q) + '</button>').join('');
    $('#homeChips').addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      $('#homeAskInput').value = c.textContent;
      $('#homeAskForm').requestSubmit();
    });
    $('#homeAskForm').addEventListener('submit', e => {
      e.preventDefault();
      const q = $('#homeAskInput').value.trim();
      if (!q) { $('#homeAskInput').focus(); return; }
      askFlow({ question: q, type: 'qna' });
    });
  }

  /* ---------------- 홈: TOP5 ---------------- */
  function renderRanking() {
    $('#rankingList').innerHTML = D.RANKING.map((r, i) => {
      const c = charById(r.charId);
      return '<li class="rank-item" data-q="' + esc(r.q) + '" data-cat="' + r.cat + '" data-char="' + c.id + '"' + (r.y ? ' data-y="' + r.y + '"' : '') + '>' +
        '<span class="rank-no">' + (i + 1) + '</span>' +
        '<img class="rank-avatar" src="' + c.img + '" alt="" loading="lazy" />' +
        '<span class="rank-main"><span class="rank-q">' + esc(r.q) + '</span>' +
        '<span class="rank-meta"><b>' + won(r.count) + '명이 확인</b><span class="rank-trend">' + r.trend + '</span></span></span>' +
        '</li>';
    }).join('');
    $('#rankingList').addEventListener('click', e => {
      const li = e.target.closest('.rank-item'); if (!li) return;
      if (li.dataset.y) { if (Y27) y2027Open(li.dataset.y); return; }
      askFlow({ question: li.dataset.q, category: li.dataset.cat, charId: li.dataset.char, type: 'qna' });
    });
  }

  /* ---------------- 홈: 도사 카드 ---------------- */
  function renderMasters() {
    $('#masterList').innerHTML = D.CHARACTERS.map(c => {
      const off = Math.round((1 - c.price / c.listPrice) * 100);
      return '<div class="master" data-char="' + c.id + '" role="button">' +
        '<div class="master-thumb"><img src="' + c.img + '" alt="' + esc(c.name) + '" loading="lazy" />' +
        (off > 0 ? '<span class="discount">' + off + '%</span>' : '') + '</div>' +
        '<div class="master-info">' +
        '<div><div class="master-top"><span class="master-name">' + esc(c.name) + '</span><span class="master-hanja">' + esc(c.hanja) + '</span></div>' +
        '<div class="master-fields">' + c.fields.join(' · ') + '</div>' +
        '<div class="master-sample">“' + esc(c.sample.q) + '”<br />→ ' + esc(c.sample.a) + '</div></div>' +
        '<div class="master-bottom">' +
        '<span class="master-price"><s>' + won(c.listPrice) + '</s><b>' + won(c.price) + '원</b></span>' +
        '<button class="master-go" data-go="' + c.id + '">바로 질문하기</button>' +
        '</div></div></div>';
    }).join('');
    $('#masterList').addEventListener('click', e => {
      const g = e.target.closest('[data-go]');
      if (g) { const c = charById(g.dataset.go); openAskWithChar(c.id); return; }
      const m = e.target.closest('.master');
      if (m) openProduct(m.dataset.char);
    });
  }

  /* ---------------- 상품 상세 ---------------- */
  function openProduct(id) {
    const c = charById(id);
    const off = Math.round((1 - c.price / c.listPrice) * 100);
    const html =
      '<div class="prod-hero"><img src="' + c.img + '" alt="' + esc(c.name) + '" />' +
      '<div class="ph-txt"><b>' + esc(c.name) + ' <small style="font-size:10px;letter-spacing:.2em;color:var(--ink-3)">' + esc(c.hanja) + '</small></b>' +
      '<span>' + esc(c.role) + ' · ⭐ ' + c.rating + ' · 리뷰 ' + won(c.reviews) + '</span></div></div>' +
      '<div class="prod-price"><b>' + won(c.price) + '원</b><s>' + won(c.listPrice) + '원</s>' + (off ? '<em>' + off + '% 할인</em>' : '') + '</div>' +
      '<p class="prod-desc">' + esc(c.intro) + '</p>' +
      '<ul class="prod-list">' + c.strengths.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
      '<div class="rp-actions"><button class="btn-ghost" id="prodClose">닫기</button><button class="btn-gold" id="prodAsk">' + esc(c.name) + '에게 질문하기</button></div>';
    openSheet(c.name + ' · 질문즉답', html);
    $('#prodClose').addEventListener('click', closeSheet);
    $('#prodAsk').addEventListener('click', () => { closeSheet(); openAskWithChar(c.id); });
  }

  /* ---------------- 오늘의 운세 위젯/페이지 ---------------- */
  function todayHTML(t, r, full) {
    const godC = D.COPY.todayGod[r.god] || {};
    const lucky = r.lucky;
    const kw = r.keywords.map(k => '<span class="pill">' + esc(k) + '</span>').join(' ');
    const gauges = [
      { l: '총운', v: r.total }, { l: '애정', v: r.love }, { l: '재물', v: r.money }, { l: '직장', v: r.work }
    ].map(g => '<div class="gauge"><span>' + g.l + '</span><span class="gbar"><i style="width:' + g.v + '%"></i></span><b>' + g.v + '</b></div>').join('');

    if (!full) {
      return '<div class="today-card" id="todayCard" role="button" tabindex="0">' +
        '<div class="today-top"><span class="today-date"><b>' + t.dateStr + '</b> ' + t.weekday + '요일 · ' + esc(t.termName) + ' 절기</span></div>' +
        '<div class="today-ganji"><strong>' + t.pillar.hanja + '</strong><span>' + t.pillar.ko + '일 · ' + esc(ELEMENTS_HANJA_LABEL(r.element)) + '의 기운</span></div>' +
        '<p class="today-line">' + esc(r.note) + '</p>' +
        '<div class="today-foot"><div class="score-ring" style="--v:' + r.total + '"><b>' + r.total + '<small>점</small></b></div>' +
        '<div class="today-cta">' + kw + '<button class="btn-ghost" data-nav="today">오늘의 운세 전체 보기 →</button></div>' +
        '</div></div>';
    }
    return '<div class="today-hero">' +
      '<div class="th-date">' + t.dateStr + ' ' + t.weekday + '요일</div>' +
      '<div class="th-ganji">' + t.pillar.hanja + '</div>' +
      '<div class="th-sub">' + t.pillar.ko + '일 · ' + esc(ELEMENTS_HANJA_LABEL(r.element)) + '의 날</div>' +
      '<div class="th-term">절기 ' + esc(t.termName) + (t.termStart ? ' · ' + esc(t.termName) + ' ' + E.formatTermTime(t.termStart) + ' (근사)' : '') + ' · 태양 황경 ' + t.termLong + '°</div>' +
      '<div class="score-ring th-score" style="--v:' + r.total + '"><b>' + r.total + '<small>점</small></b></div>' +
      '</div>' +
      '<div class="block"><div class="rp-title"><span>오늘의 총운 ' + r.total + '점</span></div>' +
      '<p class="rp-lead">' + esc(godC.head) + '. ' + esc(godC.body) + '</p>' +
      '<p class="rp-para">' + esc(r.myNote || '') + '</p></div>' +
      '<div class="block"><div class="rp-title"><span>운세 게이지</span></div><div class="gauge-list">' + gauges + '</div></div>' +
      '<div class="block"><div class="rp-title"><span>행운 포인트</span></div><div class="lucky-grid">' +
      '<div class="lucky-item"><span>행운의 색</span><b>' + lucky.color + '</b></div>' +
      '<div class="lucky-item"><span>행운의 숫자</span><b>' + lucky.number + '</b></div>' +
      '<div class="lucky-item"><span>길한 방위</span><b>' + lucky.direction + '</b></div>' +
      '<div class="lucky-item"><span>좋은 시간</span><b>' + lucky.time + '</b></div>' +
      '<div class="lucky-item"><span>행운 아이템</span><b>' + lucky.item + '</b></div>' +
      '<div class="lucky-item"><span>조심할 것</span><b>' + esc(godC.avoid) + '</b></div>' +
      '</div></div>' +
      '<div class="block"><div class="rp-title"><span>키워드</span></div><div class="chips wrap">' + kw + '</div></div>' +
      '<div class="block"><div class="rp-title"><span>오늘 조심할 점</span></div><div class="rp-caution">' + esc(godC.avoid) + ' — 특히 “' + esc(godC.head) + '”이라는 흐름 안에서는 이것이 하루의 기운을 새게 합니다.</div></div>' +
      '<div class="block" style="text-align:center"><button class="btn-ghost" data-nav="ask">' + esc(D.CHARACTERS[0].name) + '에게 오늘의 고민 물어보기 →</button></div>';
  }

  function ELEMENTS_HANJA_LABEL(el) { return el + '(' + (D ? { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' }[el] : '') + ')'; }

  function renderTodayWidget() {
    const t = E.getToday();
    if (!state.profile) {
      $('#todayWidgetWrap').innerHTML =
        '<div class="block-head"><h2>오늘의 운세</h2><span class="block-sub">' + t.dateStr + '</span></div>' +
        '<div class="today-card" data-nav="ask" role="button">' +
        '<div class="today-top"><span class="today-date"><b>' + t.dateStr + '</b> ' + t.weekday + '요일</span><span class="pill">무료</span></div>' +
        '<div class="today-ganji"><strong>' + t.pillar.hanja + '</strong><span>' + t.pillar.ko + '일</span></div>' +
        '<p class="today-line">생년월일을 등록하면 오늘의 일진이 내 사주와 어떻게 맞물리는지 알려 드려요.</p>' +
        '<div class="today-foot"><div class="score-ring" style="--v:100;background:conic-gradient(var(--gold) 100%, rgba(255,255,255,.08) 0)"><b style="font-size:15px">今</b></div>' +
        '<div class="today-cta"><button class="btn-gold">내 사주로 무료로 보기</button></div></div></div>';
      return;
    }
    const chart = E.buildChart(state.profile);
    const r = E.todayReading(chart, t);
    r.myNote = '나의 일간 ' + chart.dayMaster.hanja + '(' + chart.dayMaster.ko + ') ' + chart.dayMaster.elem + '과 오늘 일진 ' + t.pillar.hanja + '이 만나면 ' + r.god + '의 자리가 됩니다. ' + (r.combine ? '특히 일지끼리 합(合)하는 날이라 인연과 약속이 따라오기 쉽습니다.' : r.clash ? '일지가 오늘 지지와 충(沖)하는 날이라 무리한 이동과 계약은 조심하세요.' : '큰 충돌 없이 흘러가는 날입니다.');
    $('#todayWidgetWrap').innerHTML =
      '<div class="block-head"><h2>오늘의 운세</h2><span class="block-sub">' + t.dateStr + '</span></div>' +
      todayHTML(t, r, false);
    $('#todayCard').addEventListener('click', () => showView('today'));
  }

  function renderTodayPage() {
    const t = E.getToday();
    const wrap = $('#todayPage');
    if (!state.profile) {
      wrap.innerHTML = '<div class="today-hero"><div class="th-date">' + t.dateStr + ' ' + t.weekday + '요일</div>' +
        '<div class="th-ganji">' + t.pillar.hanja + '</div><div class="th-sub">' + t.pillar.ko + '일</div>' +
        '<div class="th-term">절기 ' + esc(t.termName) + (t.termStart ? ' · ' + esc(t.termName) + ' ' + E.formatTermTime(t.termStart) + ' (근사)' : '') + '</div></div>' +
        '<div class="arch-empty" style="margin-top:16px">생년월일을 등록하면<br /><b>오늘의 일진이 내 사주와 만나는 자리</b>까지 읽어 드려요.<br /><button class="btn-gold" id="todayGoProfile">생년월일 입력하기</button></div>';
      $('#todayGoProfile').addEventListener('click', () => openBirthForm({ title: '오늘의 운세', onDone: () => showView('today') }));
      return;
    }
    const chart = E.buildChart(state.profile);
    const r = E.todayReading(chart, t);
    r.myNote = '나의 일간 ' + chart.dayMaster.hanja + '(' + chart.dayMaster.ko + ') ' + chart.dayMaster.elem + '과 오늘 일진 ' + t.pillar.hanja + '이 만나 ' + r.god + '의 자리입니다. ' + (r.combine ? '일지가 합(合)하는 날로, 만남과 약속에 힘이 실립니다.' : r.clash ? '일지가 충(沖)하는 날로, 계약·이동·약속 변경은 조심스럽게.' : '큰 자극 없이 흘러가니 평소의 리듬을 지키면 충분합니다.');
    wrap.innerHTML = todayHTML(t, r, true) +
      '<div class="block" style="margin-top:18px"><div class="rp-note">' + esc(D.REPORT.solarNote) + ' · ' + esc(D.REPORT.mockNote) + '</div></div>';
  }

  /* ---------------- 보관함 ---------------- */
  function saveHistory(entry) {
    entry.id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
    entry.savedAt = new Date().toISOString();
    state.history.unshift(entry);
    if (state.history.length > 60) state.history.length = 60;
    store.set(K_HISTORY, state.history);
  }

  function renderArchive() {
    renderProfileCard($('#archiveProfile'));
    const list = $('#archiveList');
    $('#archiveCount').textContent = state.history.length ? state.history.length + '건' : '';
    if (!state.history.length) {
      list.innerHTML = '<div class="arch-empty">아직 본 사주가 없어요.<br /><b>무료 사주 6종</b>이나 <b>질문즉답</b>부터 시작해 보세요.<br /><button class="btn-gold" data-nav="home">홈으로 가기</button></div>';
      return;
    }
    list.innerHTML = state.history.map(h => {
      const c = charById(h.charId);
      return '<div class="arch-card" data-id="' + h.id + '" role="button">' +
        '<img src="' + c.img + '" alt="" loading="lazy" />' +
        '<div class="arch-main"><div class="arch-title">' + esc(h.title) + '</div>' +
        '<div class="arch-meta"><span class="arch-type">' + esc(h.typeLabel) + '</span><span>' + esc(c.name) + '</span><span>' + esc(h.dateLabel) + '</span></div></div>' +
        '<button class="arch-del" data-del="' + h.id + '" aria-label="삭제">×</button></div>';
    }).join('');
    list.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        const id = del.dataset.del;
        state.history = state.history.filter(h => h.id !== id);
        store.set(K_HISTORY, state.history);
        renderArchive(); showToast('삭제했어요');
        return;
      }
      const card = e.target.closest('.arch-card');
      if (card) {
        const h = state.history.find(x => x.id === card.dataset.id);
        if (h) reopenReport(h);
      }
    };
  }

  function reopenReport(h) {
    if (h.kind === 'compat' && h.partner) {
      try { compatSheet(E.buildChart(h.chart), E.buildChart(h.partner)); } catch (e) { showToast('이 기록을 다시 열 수 없어요'); }
      return;
    }
    if (h.kind === 'daeun') { try { daeunSheet(E.buildChart(h.chart)); } catch (e) { showToast('이 기록을 다시 열 수 없어요'); } return; }
    if (h.kind === 'gilil') { try { gililSheet(E.buildChart(h.chart)); } catch (e) { showToast('이 기록을 다시 열 수 없어요'); } return; }
    if (h.kind === 'y2027' && Y27) { y2027Sheet(h.y, h.chart); return; }
    if (h.kind === 'today') {
      const c = charById(h.charId);
      openSheet('오늘의 운세 기록', '<div class="rp-top"><img class="rp-ava" src="' + c.img + '" alt="" /><div class="rp-who"><b>' + esc(h.dateLabel) + ' 운세</b><span>보관함에 저장된 기록</span></div></div>' +
        '<div class="rp-question"><b>그날의 총운</b>' + esc(h.title) + '</div>' +
        '<p class="rp-para">' + esc(h.summary || '') + '</p>' +
        '<div class="rp-note">운세 기록은 그날의 일진 기준입니다. 오늘의 운세는 홈 위젯에서 다시 확인하세요.</div>');
      return;
    }
    openReportSheet({
      chart: h.chart, reading: h.reading || null, question: h.question || '', category: h.category,
      charId: h.charId, title: h.title, typeLabel: h.typeLabel, silent: true
    });
  }

  /* ---------------- 프로필 카드 ---------------- */
  function renderProfileCard(target) {
    const p = state.profile;
    if (!p) {
      target.innerHTML = '<div class="arch-empty">저장된 사주 프로필이 없어요.<br />생년월일만 있으면 <b>60갑자 사주팔자</b>를 세워 드립니다.<br /><button class="btn-gold" id="goBirth">내 사주 등록하기</button></div>';
      const b = $('#goBirth'); if (b) b.addEventListener('click', () => openBirthForm({}));
      return;
    }
    const c = E.buildChart(p);
    target.innerHTML = '<div class="arch-profile">' +
      '<div class="rp-id"><b>' + esc(p.name || '익명의 발견자') + '</b><span>' + (p.gender === 'female' ? '여성' : '남성') + ' · ' + p.year + '.' + pad(p.month) + '.' + pad(p.day) + (p.hour != null && p.hour !== '' ? ' ' + pad(p.hour) + ':' + pad(p.minute || 0) : ' · 시간 모름') + '</span></div>' +
      '<div class="preview-mini">' + c.pillars.year.hanja + ' ' + c.pillars.month.hanja + ' <b style="color:var(--gold-lt)">' + c.pillars.day.hanja + '</b>' + (c.pillars.hour ? ' ' + c.pillars.hour.hanja : '') +
      '<small>' + c.ganjiKo + (c.pillars.hour ? '' : ' · 시주 제외') + '</small></div>' +
      '<div class="stat-row" style="margin-top:10px">' +
      '<div class="stat"><span>일간</span><b class="gold">' + c.dayMaster.hanja + ' ' + c.dayMaster.elem + '</b></div>' +
      '<div class="stat"><span>신강/신약</span><b>' + c.strengthKo + '</b></div>' +
      '<div class="stat"><span>용신 오행</span><b class="gold">' + c.yongsin.elem + '</b></div>' +
      '</div>' +
      '<div class="rp-actions"><button class="btn-ghost" id="editBirth">정보 수정</button><button class="btn-ghost" id="resetAll">전체 초기화</button></div>' +
      '</div>';
    $('#editBirth').addEventListener('click', () => openBirthForm({ title: '정보 수정' }));
    $('#resetAll').addEventListener('click', () => {
      if (confirm('저장된 프로필과 본 사주 내역을 모두 지울까요?')) {
        state.profile = null; state.history = [];
        localStorage.removeItem(K_PROFILE); localStorage.removeItem(K_HISTORY);
        renderArchive(); renderAskProfile(); renderTodayWidget();
        showToast('초기화했어요');
      }
    });
  }

  function renderAskProfile() {
    const t = $('#askProfile');
    if (!state.profile) {
      t.innerHTML = '<div class="arch-empty">아직 사주가 없어요. 질문을 보내면 <b>생년월일</b>을 먼저 확인합니다.</div>';
      return;
    }
    renderProfileCard(t);
  }

  /* ---------------- 생년월일 폼 ---------------- */
  const SIZI = [
    { v: 0, l: '자시 (23:30~01:30)' }, { v: 2, l: '축시 (01:30~03:30)' }, { v: 4, l: '인시 (03:30~05:30)' },
    { v: 6, l: '묘시 (05:30~07:30)' }, { v: 8, l: '진시 (07:30~09:30)' }, { v: 10, l: '사시 (09:30~11:30)' },
    { v: 12, l: '오시 (11:30~13:30)' }, { v: 14, l: '미시 (13:30~15:30)' }, { v: 16, l: '신시 (15:30~17:30)' },
    { v: 18, l: '유시 (17:30~19:30)' }, { v: 20, l: '술시 (19:30~21:30)' }, { v: 22, l: '해시 (21:30~23:30)' }
  ];

  function birthFormHTML(p) {
    const y = p ? p.year : 1995, m = p ? p.month : 1, d = p ? p.day : 1;
    let hourOpts = '<option value=""' + (!p || p.hour == null ? ' selected' : '') + '>태어난 시간 모름</option>' + SIZI.map(s => '<option value="' + s.v + '"' + (p && +p.hour === s.v ? ' selected' : '') + '>' + s.l + '</option>').join('');
    return '<form class="form-grid" id="birthForm" autocomplete="off">' +
      '<div class="field"><label for="bfName">이름 또는 별명</label><input id="bfName" maxlength="12" placeholder="예) 승현" value="' + esc(p && p.name || '') + '" /></div>' +
      '<div class="field"><label>성별</label><div class="seg" id="bfGender">' +
      '<button type="button" data-g="male"' + (!p || p.gender === 'male' ? ' class="is-on"' : '') + '>남성</button>' +
      '<button type="button" data-g="female"' + (p && p.gender === 'female' ? ' class="is-on"' : '') + '>여성</button></div></div>' +
      '<div class="field"><label>생년월일 (양력)</label><div class="field-row">' +
      '<select id="bfY">' + rangeOpts(1930, 2026, y, '년') + '</select>' +
      '<select id="bfM">' + rangeOpts(1, 12, m, '월') + '</select>' +
      '<select id="bfD">' + rangeOpts(1, 31, d, '일') + '</select></div></div>' +
      '<div class="field"><label for="bfH">태어난 시간</label><select id="bfH">' + hourOpts + '</select></div>' +
      '<div class="checkline"><input type="checkbox" id="bfRemember" checked /><label for="bfRemember">이 기기에 사주 프로필 저장 (보관함에서 다시 보기)</label></div>' +
      '<div class="form-note" id="bfNote">' + esc(D.REPORT.noTimeNote) + ' ' + esc(D.REPORT.timeNote) + '</div>' +
      '<button class="btn-gold wide" type="submit">사주 세우기</button>' +
      '</form>';
  }
  function rangeOpts(a, b, sel, unit) {
    let s = '';
    for (let i = a; i <= b; i++) s += '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + i + unit + '</option>';
    return s;
  }

  function openBirthForm(opts) {
    opts = opts || {};
    openSheet(opts.title || '생년월일 확인', birthFormHTML(state.profile));
    const gender = state.profile ? state.profile.gender : 'male';
    let g = gender;
    $('#bfGender').addEventListener('click', e => {
      const b = e.target.closest('button[data-g]'); if (!b) return;
      g = b.dataset.g;
      $$('#bfGender button').forEach(x => x.classList.toggle('is-on', x === b));
    });
    $('#birthForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = {
        name: $('#bfName').value.trim(),
        gender: g,
        year: +$('#bfY').value, month: +$('#bfM').value, day: +$('#bfD').value,
        hour: $('#bfH').value === '' ? null : +$('#bfH').value,
        minute: $('#bfH').value === '' ? 0 : 30
      };
      const day = new Date(input.year, input.month - 1, input.day);
      if (day.getMonth() + 1 !== input.month || day.getDate() !== input.day) {
        $('#bfNote').textContent = '존재하지 않는 날짜예요. 다시 확인해 주세요.'; $('#bfNote').classList.add('warn'); return;
      }
      let chart;
      try { chart = E.buildChart(input); } catch (err) {
        $('#bfNote').textContent = '날짜를 세다가 문제가 생겼어요: ' + err.message; $('#bfNote').classList.add('warn'); return;
      }
      if ($('#bfRemember').checked) {
        state.profile = input; store.set(K_PROFILE, input);
        renderTodayWidget(); renderAskProfile();
        if ($('#archiveProfile')) renderArchive();
      }
      closeSheet();
      if (opts.onDone) opts.onDone(chart);
      else runPending(chart);
    });
  }

  /* ---------------- 질문 흐름 ---------------- */
  function askFlow(pending) {
    const cat = pending.category || categoryOf(pending.question);
    const charId = pending.charId || state.askChar || charForCategory(cat);
    state.pending = { question: pending.question, category: cat, charId: charId, type: pending.type || 'qna', title: pending.title || pending.question };
    if (!state.profile) openBirthForm({ title: '생년월일 확인', onDone: runPending });
    else runPending(E.buildChart(state.profile));
  }

  function runPending(chart) {
    const p = state.pending; state.pending = null;
    if (!p) return;
    const c = charById(p.charId);
    const reading = E.todayReading(chart);
    openReportSheet({ chart: chart, reading: reading, question: p.question, category: p.category, charId: p.charId, title: p.title, typeLabel: p.type === 'free' ? '무료' : '질문즉답' });
  }

  /* ---------------- 유료 잠금 퍼널 (맛보기 → 블러 잠금 → 체험판 해제 → PDF) ---------------- */
  function payCardHTML(o) {
    const off = o.list && o.price ? Math.round((1 - o.price / o.list) * 100) : 0;
    return '<div class="pay-card">' +
      '<span class="pay-kicker">여기서부터 심층 풀이</span>' +
      '<b class="pay-c-title">' + o.label + '</b>' +
      '<p class="pay-c-desc">' + o.desc + '</p>' +
      '<div class="pay-c-price"><s>' + won(o.list) + '원</s><b>' + won(o.price) + '원</b>' + (off > 0 ? '<em>' + off + '% 할인</em>' : '') + '</div>' +
      '<button type="button" class="btn-gold wide pay-unlock">지금은 체험판 무료 해제하기</button>' +
      '<span class="pay-c-note">결제 없이 이 기기에서 바로 열립니다<br />해제 후 <b>📄 PDF 저장 · 인쇄</b>까지</span>' +
      '</div>';
  }

  function payWrapHTML(o) {
    const open = !!state.unlocked[o.kind];
    return '<div class="pay-wrap' + (open ? ' is-open' : ' is-locked') + '" data-pay="' + o.kind + '">' +
      '<div class="pay-body">' + o.inner + '</div>' +
      (open ? '' : payCardHTML(o)) +
      '</div>';
  }

  function pdfBarHTML() {
    return '<div class="rp-toolbar"><button type="button" class="pdf-btn" data-pdf hidden>📄 PDF로 저장 / 인쇄하기</button></div>';
  }

  function bindPay(root, kind) {
    const show = () => $$('[data-pdf]', root).forEach(b => { b.hidden = false; });
    const wrap = root.querySelector('.pay-wrap');
    if (!wrap) { show(); return; }
    if (wrap.classList.contains('is-open')) { show(); return; }
    const un = wrap.querySelector('.pay-unlock');
    if (!un) { show(); return; }
    un.addEventListener('click', () => {
      state.unlocked[kind] = true;
      store.set(K_TRIAL, state.unlocked);
      wrap.classList.remove('is-locked');
      wrap.classList.add('is-open');
      const card = wrap.querySelector('.pay-card');
      if (card) card.remove();
      show();
      showToast('체험판이 열렸어요 · 전체 풀이와 PDF 저장을 쓰실 수 있습니다');
    });
  }

  function bindPdf(root) {
    $$('[data-pdf]', root).forEach(b => b.addEventListener('click', () => window.print()));
  }

  /* ---------------- 리포트 생성 ---------------- */
  function ensureChart(chart) {
    if (!chart) return chart;
    if (chart.sinsal && chart.gwisin && chart.yinyang && chart.stages) return chart;
    if (chart.input) { try { return E.buildChart(chart.input); } catch (e) { return chart; } }
    if (chart.year && chart.month && chart.day) { try { return E.buildChart(chart); } catch (e) { return chart; } }
    return chart;
  }

  function openReportSheet(o) {
    const c = charById(o.charId);
    const chart = ensureChart(o.chart);
    const today = o.reading ? o.reading.today : null;
    const html = reportHTML({ chart: chart, char: c, question: o.question, category: o.category, today: today, typeLabel: o.typeLabel });

    openSheet(c.name + '의 리포트', html, null);
    bindPay($('#sheetBody'), 'report');
    bindPdf($('#sheetBody'));
    const goto = $('#rpTo2027');
    if (goto) goto.addEventListener('click', () => { closeSheet(); y2027Open('newyear', chart); });

    const closeBtn = $('#rpClose');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    const saveBtn = $('#rpSave');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      saveHistory({
        kind: 'report', typeLabel: o.typeLabel, title: o.title, question: o.question,
        category: o.category, charId: o.charId, chart: chart, reading: o.reading || null,
        dateLabel: (new Date().getMonth() + 1) + '월 ' + new Date().getDate() + '일',
        summary: reportSummary(chart, o.category)
      });
      showToast(D.REPORT.savedToast);
      saveBtn.disabled = true; saveBtn.textContent = '보관함에 저장됨';
    });
    if (!o.silent) { /* 자동 저장 대신 수동 저장 버튼 제공 */ }
  }

  function reportSummary(chart, cat) {
    return chart.dayMaster.ko + '(' + chart.dayMaster.hanja + ') ' + chart.dayMaster.elem + ' 일간 · ' + chart.strengthKo + ' · 용신 ' + chart.yongsin.elem;
  }

  function reportHTML(o) {
    const c = o.char, chart = o.chart, cat = o.category;
    const C = D.COPY;
    const dm = C.dayMaster[chart.dayMaster.stem];
    const group = C.godGroup[dominantGodGroup(chart)];
    const catCopy = C.category[cat] || C.category.fate;
    const reading = o.reading;
    const todayGod = reading ? D.COPY.todayGod[reading.god] : null;
    const dx = E.deepRead(chart);

    /* 사주팔자 표 */
    const pillars = chart.pillars;
    const noTime = !pillars.hour;
    const pl = (label, p, day, god, stage, sinsal) => {
      if (!p) return '<div class="pl is-empty"><span class="pl-label">' + label + '</span><div class="hz">·</div><span class="ko">시간 모름</span></div>';
      return '<div class="pl' + (day ? ' is-day' : '') + '">' +
        '<span class="pl-label">' + label + '</span>' +
        '<div class="hz"><b class="' + ELCLS[p.stemElem] + '">' + p.stemName + '</b><b class="' + ELCLS[p.branchElem] + '">' + p.branchName + '</b></div>' +
        '<span class="ko">' + p.stemKo + p.branchKo + '</span>' +
        '<div class="el-chips"><i class="elc ' + ELCLS[p.stemElem] + '">' + p.stemElem + '</i><i class="elc ' + ELCLS[p.branchElem] + '">' + p.branchElem + '</i><em>' + p.animal + '</em></div>' +
        '<div class="pl-tags">' +
        (god ? '<span class="tg tg-god">' + god + '</span>' : '') +
        (stage ? '<span class="tg tg-un">' + stage + '</span>' : '') +
        (sinsal ? '<span class="tg tg-sal">' + sinsal + '</span>' : '') +
        '</div></div>';
    };
    const pillarsHTML = '<div class="pillars' + (noTime ? ' no-time' : '') + '">' +
      pl('년주', pillars.year, false, chart.gods.yearStem, chart.stages.year, chart.sinsal.year) +
      pl('월주', pillars.month, false, chart.gods.monthStem, chart.stages.month, chart.sinsal.month) +
      pl('일주', pillars.day, true, '일간', chart.stages.day, chart.sinsal.day) +
      pl('시주', pillars.hour, false, chart.gods.hourStem, chart.stages.hour, chart.sinsal.hour) +
      '</div>' +
      '<div class="pl-legend">한자 위·아래 = 천간·지지 / 색 = 오행(목 청록 · 화 적홍 · 토 황금 · 금 은회 · 수 남색)<br />배지 = 십성 · 십이운성 · 십이신살(년지 삼합 기준)</div>' +
      '<div class="rp-id" style="margin-top:9px"><span>' + chart.ganji + '</span><span>' + chart.ganjiKo + '</span>' +
      (noTime ? '<span class="pill">시간 미입력 · 세 기둥으로 봄</span>' : '') + '</div>';

    /* 오행 차트 */
    const totalW = ELEMENTS_TOTAL(chart);
    const elemCards = '<div class="el-cards">' + E.ELEMENTS.map(el =>
      '<div class="el-card ' + ELCLS[el] + '"><b>' + el + '</b><i>' + E.ELEMENTS_HANJA[E.ELEMENTS.indexOf(el)] + '</i>' +
      '<span>' + chart.pct[el] + '%</span><em>' + chart.counts[el] + '자</em></div>').join('') + '</div>';
    const elemHTML = elemCards + '<div class="elem-chart">' + E.ELEMENTS.map(el => {
      const v = chart.pct[el];
      const n = chart.counts[el];
      return '<div class="elem-row"><span class="elem-name">' + el + '</span>' +
        '<span class="elem-bar"><i style="width:' + Math.max(v, 2) + '%;background:linear-gradient(90deg,' + E.ELEMENT_COLOR[el] + '55,' + E.ELEMENT_COLOR[el] + ')"></i></span>' +
        '<span class="elem-val"><b>' + v + '%</b> · ' + n + '자</span></div>';
    }).join('') + '</div>' +
      '<div class="stat-row">' +
      '<div class="stat"><span>일간</span><b class="gold">' + chart.dayMaster.hanja + ' (' + chart.dayMaster.ko + ') ' + chart.dayMaster.elem + '</b></div>' +
      '<div class="stat"><span>형세</span><b>' + chart.strengthKo + ' (' + chart.strengthRatio + ')</b></div>' +
      '<div class="stat"><span>용신</span><b class="gold">' + chart.yongsin.elem + ' · 희신 ' + chart.yongsin.hee + '</b></div></div>' +
      (chart.missing.length ? '<div class="rp-caution" style="margin-top:10px">' + esc(C.missing[chart.missing[0]]) + '</div>' : '');

    /* 십신 분포 */
    const godHTML = '<div class="elem-chart">' + Object.keys(chart.godGroups).map(g => {
      const v = chart.godGroups[g], max = 7;
      return '<div class="elem-row"><span class="elem-name" style="font-family:var(--sans);font-size:11px">' + g + '</span>' +
        '<span class="elem-bar"><i style="width:' + Math.max(Math.round(v / max * 100), 2) + '%;background:linear-gradient(90deg,#9C7A2255,#D4AF37)"></i></span>' +
        '<span class="elem-val"><b>' + v + '</b>개</span></div>';
    }).join('') + '</div>';

    /* 음양 비율 */
    const yy = chart.yinyang;
    const yinyangHTML = '<div class="yy-wrap">' +
      '<div class="yy-bar"><i style="width:' + yy.yangPct + '%"></i><b>' + yy.yinPct + '%</b></div>' +
      '<div class="yy-legend"><span>양 ' + yy.yangPct + '%</span><span>음 ' + yy.yinPct + '%</span></div>' +
      '<div class="yy-list">' + yy.list.map(x => '<i class="' + (x.yin ? 'yin' : 'yang') + '">' + x.name + ' ' + x.char + '</i>').join('') + '</div>' +
      '<p class="rp-note" style="margin-top:6px">' + esc(yy.note) + '</p></div>';

    /* 십이운성 */
    const stageList = [['년지', chart.stages.year], ['월지', chart.stages.month], ['일지', chart.stages.day]]
      .concat(chart.stages.hour ? [['시지', chart.stages.hour]] : []);
    const unseongHTML = '<div class="mini-grid">' + stageList.map(s =>
      '<div class="mini-item"><span>' + s[0] + '</span><b>' + s[1] + '</b><em>' + (STAGE_NOTE[s[1]] || '') + '</em></div>').join('') + '</div>' +
      '<p class="rp-para">십이운성은 일간의 기운이 그 자리에서 어느 단계에 있는지를 보여 줍니다. <strong>' + chart.stages.month + '</strong>의 달지와 <strong>' + chart.stages.day + '</strong>의 일지는 이 사주가 사람들 앞에서 어떤 모습으로 서는지를 말해 줍니다.</p>';

    /* 귀인 */
    const gw = chart.gwisin;
    const gwRow = (label, char, hits) => '<div class="gw-row"><span>' + label + '</span><b>' + (char || '') + '</b><em>' +
      (hits && hits.length ? hits.join(' · ') : '사주에 없음') + '</em></div>';
    const gwisinHTML = '<div class="gw-wrap">' +
      gwRow('천을귀인', gw.cheoneul.chars.join(' · '), gw.cheoneul.hits) +
      gwRow('천덕귀인', gw.cheondeok.char, gw.cheondeok.hits) +
      gwRow('월덕귀인', gw.woldeok.char, gw.woldeok.hits) + '</div>' +
      '<p class="rp-para">귀인은 막힌 일을 풀어 주는 자리입니다. 사주에 앉아 있으면 그 자리의 띠·사람·달이 도움으로 들어옵니다.</p>';

    /* 십이신살 */
    const sinsalList = [['년주', chart.sinsal.year], ['월주', chart.sinsal.month], ['일주', chart.sinsal.day]]
      .concat(chart.sinsal.hour ? [['시주', chart.sinsal.hour]] : []);
    const sinsalHTML = '<div class="mini-grid">' + sinsalList.map(s =>
      '<div class="mini-item"><span>' + s[0] + '</span><b>' + s[1] + '</b><em>' + (s[1].indexOf('도화') >= 0 ? '사람을 끄는 힘' : s[1] === '역마살' ? '움직이는 기운' : s[1] === '화개살' ? '혼자 깊어지는 자리' : '') + '</em></div>').join('') + '</div>' +
      '<p class="rp-note" style="margin-top:6px">십이신살은 년지 삼합을 기준으로 봅니다(겁살·재살·천살·지살·년살·월살·망신·장성·반안·역마·육해·화개).</p>';
    const natureHTML = '<p class="rp-lead"><span class="em">' + esc(dm.key) + ' · ' + esc(dm.name) + '</span>의 사주입니다.</p>' +
      '<p class="rp-para">' + esc(dm.text) + '</p>' +
      '<p class="rp-para"><strong>' + esc(group.name) + '이 강한 구조</strong> — ' + esc(group.trait) + '</p>' +
      '<p class="rp-para">' + esc(C.strength[chart.strength]) + ' ' + esc(chart.yongsin.reason) + '. 그래서 <strong>' + chart.yongsin.elem + '(' + E.ELEMENTS_HANJA[E.ELEMENTS.indexOf(chart.yongsin.elem)] + ')</strong> 오행이 도움이 되며, ' + esc(chart.yongsin.care) + '</p>';

    /* 질문 답 — 자세히 */
    const coreHTML = '<p class="rp-lead">여기서부터는 앞에서 짚은 것들을 겹쳐서 보겠습니다. ' + esc(catCopy.label) + '에 대한 답은 이렇게 정리됩니다.</p>' +
      '<p class="rp-para"><strong>' + esc(c.name) + '의 읽기</strong> — ' + esc(catCopy.via[dominantGodGroup(chart)]) + '</p>' +
      '<p class="rp-para">' + esc(c.categoryLine[cat] || c.categoryLine.fate) + '</p>' +
      '<p class="rp-para">정리하면, 중심 기운은 ' + chart.yongsin.elem + '(용신)이고 ' + esc(dx.style) + '에 가까운 사주이니, 이 문제도 ' + (dx.style.indexOf('조직') >= 0 ? '조직 안에서 자리를 넓히는 방식' : dx.style.indexOf('사업') >= 0 || dx.style.indexOf('제작') >= 0 ? '내가 만든 것과 이름을 걸고 나가는 방식' : '내 판단과 몸을 앞세우는 방식') + '으로 풀어야 결과가 남습니다. ' + esc(catCopy.timing[0]) + '</p>';

    const timingHTML = '<ul class="rp-list">' + catCopy.timing.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<p class="rp-para">시기를 정할 때는 감이 아니라 달력으로 정하세요. 2027 정미년의 좋은 달과 조심할 달은 아래 2027 리포트에서 달 단위로 짚어 드립니다.</p>';

    const adviceHTML = '<ul class="rp-list advice">' +
      catCopy.advice.map(a => '<li>' + esc(a) + '</li>').join('') +
      dx.money.tips.slice(0, 2).map(a => '<li>' + esc(a) + '</li>').join('') +
      '</ul>';

    const leak = E.moneyLeaks(chart)[0];
    const cautionHTML = '<div class="rp-caution">' + esc(catCopy.caution) + '</div>' +
      '<div class="rp-caution" style="margin-top:8px">돈과 사람에서 먼저 조심하세요 — ' + esc(leak.title) + '. ' + esc(leak.fix) + '</div>' +
      (reading ? '<div class="rp-caution" style="margin-top:8px">오늘은 <b>' + reading.god + '의 날</b> — ' + esc(todayGod.head) + '. ' + esc(reading.note) + '</div>' : '');

    /* 행운 (무료 마무리) */
    const lk = chart.yongsin.elem;
    const L = E.LUCKY[lk];
    const luckyHTML = '<div class="lucky-grid">' +
      '<div class="lucky-item"><span>도움이 되는 오행</span><b>' + lk + ' · ' + L.color + '</b></div>' +
      '<div class="lucky-item"><span>행운의 숫자</span><b>' + L.number.join(' · ') + '</b></div>' +
      '<div class="lucky-item"><span>길한 방위</span><b>' + L.dir + '</b></div>' +
      '<div class="lucky-item"><span>좋은 시간</span><b>' + L.time + '</b></div>' +
      '<div class="lucky-item"><span>행운 아이템</span><b>' + L.item + '</b></div>' +
      '<div class="lucky-item"><span>' + esc(c.name) + '의 한마디</span><b style="font-size:11px;line-height:1.5">' + esc(c.closing) + '</b></div>' +
      '</div>';

    const deepBlock = sec => sec.paras.map(p => '<p class="rp-para">' + esc(p) + '</p>').join('') +
      '<ul class="rp-list advice">' + sec.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      (sec.voice ? '<p class="rp-voice">' + esc(sec.voice) + '</p>' : '');

    const paidInner =
      '<div class="rp-title"><span>9. 여덟 글자의 뼈대</span></div>' +
      '<p class="rp-para">' + esc(dx.nature[0]) + '</p>' +
      '<p class="rp-para">' + esc(dx.nature[1]) + '</p>' +
      '<p class="rp-para">' + esc(dx.nature[2]) + '</p>' +
      '<div class="rp-title"><span>10. 재물 — 그릇과 돈의 습관</span></div>' + deepBlock(dx.money) +
      '<div class="rp-title"><span>11. 일과 직장 — 어디서 힘이 나는가</span></div>' + deepBlock(dx.work) +
      '<div class="rp-title"><span>12. 연애·관계 — 반복되는 패턴</span></div>' + deepBlock(dx.love) +
      '<div class="rp-title"><span>13. 건강과 체력 — 약한 자리</span></div>' + deepBlock(dx.health) +
      '<div class="rp-title"><span>14. 질문에 대한 답</span></div>' + coreHTML +
      '<div class="rp-title"><span>15. 시기와 흐름</span></div>' + timingHTML +
      '<div class="rp-title"><span>16. 지금 할 일</span></div>' + adviceHTML +
      '<div class="rp-title"><span>17. 조심할 점</span></div>' + cautionHTML;

    return '' +
      '<div class="rp-top"><img class="rp-ava" src="' + c.img + '" alt="' + esc(c.name) + '" />' +
      '<div class="rp-who"><b>' + esc(c.name) + ' <small style="font-size:9px;letter-spacing:.2em;color:var(--ink-3)">' + esc(c.hanja) + '</small></b>' +
      '<span>' + esc(c.role) + ' · ' + chart.dayMaster.hanja + chart.dayMaster.elem + ' ' + chart.strengthKo + '</span></div>' +
      '<span class="rp-stamp">' + esc(D.BRAND.name) + ' 정통 만세력</span></div>' +
      pdfBarHTML() +
      '<p class="rp-voice">' + esc(dx.voice.open) + '</p>' +

      (o.question ? '<div class="rp-question"><b>질문</b>' + esc(o.question) + '</div>' : '') +

      '<div class="y27-free"><span class="y27-free-kicker">무료 공개</span>' +
      '<div class="rp-title"><span>1. 사주팔자 · 만세력</span></div>' + pillarsHTML +
      '<div class="rp-title"><span>2. 오행 분포 · 음양</span></div>' + elemHTML +
      '<div class="rp-title"><span>3. 음양 비율</span></div>' + yinyangHTML +
      '<div class="rp-title"><span>4. 십신 분포</span></div>' + godHTML +
      '<div class="rp-title"><span>5. 십이운성</span></div>' + unseongHTML +
      '<div class="rp-title"><span>6. 십이신살</span></div>' + sinsalHTML +
      '<div class="rp-title"><span>7. 귀인</span></div>' + gwisinHTML +
      '<div class="rp-title"><span>8. 타고난 결</span></div>' + natureHTML +
      '</div>' +

      '<div class="rp-title"><span>질문 요약</span></div>' +
      '<p class="rp-lead">' + esc(catCopy.reflect) + '</p>' +

      payWrapHTML({
        kind: 'report', price: c.price, list: c.listPrice,
        label: esc(c.name) + ' 심층 리포트 전체 열기',
        desc: '재물 · 직장 · 연애 · 건강 네 갈래의 심층 풀이, 질문에 대한 깊은 답, 시기별 행동 지침까지 — 이 사주 하나만 놓고 쓴 본문입니다.',
        inner: paidInner
      }) +

      '<div class="rp-title"><span>18. 행운 포인트</span></div>' + luckyHTML +
      '<div class="rp-cta"><b>2027 정미년, 내 12개월은?</b><span>2027년 월운표와 좋은 달·조심할 달을 같은 사주로 이어서 풀어 드립니다.</span><button class="btn-gold wide" id="rpTo2027">2027 정미년 12개월 신년운세 →</button></div>' +

      '<div class="rp-actions"><button class="btn-ghost" id="rpClose">닫기</button><button class="btn-ghost" data-pdf hidden>📄 PDF 저장</button><button class="btn-gold" id="rpSave">보관함 저장</button></div>' +
      '<div class="rp-note">' + esc(D.REPORT.solarNote) + ' · ' + esc(D.REPORT.noTimeNote) + '<br />' + esc(D.REPORT.mockNote) + ' ' + esc(D.BRAND.footer) + '</div>';
  }

  function ELEMENTS_TOTAL(chart) {
    return E.ELEMENTS.reduce((s, el) => s + chart.counts[el], 0);
  }

  function dominantGodGroup(chart) {
    const g = chart.godGroups;
    let best = '비겁', max = -1;
    Object.keys(g).forEach(k => { if (g[k] > max) { max = g[k]; best = k; } });
    return best;
  }

  /* ---------------- 사주질문 페이지 ---------------- */
  function renderAskChars() {
    $('#askChars').innerHTML = D.CHARACTERS.map(c => (
      '<button class="char-pick" data-id="' + c.id + '">' +
      '<img src="' + c.img + '" alt="' + esc(c.name) + '" loading="lazy" />' +
      '<div class="cp-name">' + esc(c.name) + '</div>' +
      '<div class="cp-field">' + esc(c.fields[0]) + ' · ' + esc(c.fields[1]) + '</div></button>'
    )).join('');
    $('#askChars').addEventListener('click', e => {
      const b = e.target.closest('.char-pick'); if (!b) return;
      state.askChar = b.dataset.id;
      $$('#askChars .char-pick').forEach(x => x.classList.toggle('is-on', x.dataset.id === b.dataset.id));
    });
    $('#askChars').firstElementChild.classList.add('is-on');
  }

  function renderAskChips() {
    const topic = state.askTopic || 'qna';
    const chips = (D.CHIPS.topics[topic] || []).concat(D.CHIPS.ask);
    const uniq = Array.from(new Set(chips)).slice(0, 8);
    $('#askChips').innerHTML = uniq.map(q => '<button class="chip">' + esc(q) + '</button>').join('');
    $('#askChips').onclick = e => {
      const c = e.target.closest('.chip'); if (!c) return;
      $('#askInput').value = c.textContent;
      $('#askInput').dispatchEvent(new Event('input'));
      $('#askSubmit').focus();
    };
  }

  function openAskWithChar(charId) {
    state.askChar = charId;
    showView('ask');
    requestAnimationFrame(() => {
      $$('#askChars .char-pick').forEach(x => x.classList.toggle('is-on', x.dataset.id === charId));
      $('#askInput').focus();
      $('#compose').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function openAskWithTopic(topic) {
    state.askTopic = topic.id;
    state.askChar = charForCategory(topic.cat || 'fate');
    showView('ask');
    requestAnimationFrame(() => {
      $$('#askChars .char-pick').forEach(x => x.classList.toggle('is-on', x.dataset.id === state.askChar));
      if (topic.question) { $('#askInput').value = topic.question; $('#askInput').dispatchEvent(new Event('input')); }
      renderAskChips();
      $('#compose').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function renderFreeGrid() {
    $('#freeGrid').innerHTML = D.FREE_SAJU.map(f => {
      const c = charById(f.charId);
      return '<button class="free-card" data-key="' + f.key + '" data-cat="' + f.cat + '" data-char="' + c.id + '" data-y="' + (f.y || '') + '">' +
        '<span class="free-glyph">' + (f.icon || f.hanja) + '</span>' +
        '<span class="free-name">' + esc(f.label) + '</span>' +
        '<span class="free-desc">' + esc(f.desc) + '</span>' +
        '<span class="free-badge">무료</span></button>';
    }).join('');
    $('#freeGrid').addEventListener('click', e => {
      const b = e.target.closest('.free-card'); if (!b) return;
      if (b.dataset.y && Y27) { y2027Open(b.dataset.y); return; }
      const f = D.FREE_SAJU.find(x => x.key === b.dataset.key);
      askFlow({
        question: f.title + ' — ' + f.desc,
        category: f.cat, charId: f.charId, type: 'free',
        title: '무료 사주 · ' + f.label
      });
    });
  }

  /* ---------------- 검색 / 메뉴 ---------------- */
  function openSearch() {
    const items = D.TOPICS.filter(t => t.question).map(t =>
      '<button class="menu-item" data-q="' + esc(t.question) + '" data-cat="' + t.cat + '"><span class="mi-icon">' + t.icon + '</span>' + esc(t.label) + '<span class="mi-sub">' + esc(t.desc) + '</span></button>'
    ).join('');
    openSheet('무엇이 궁금하세요', '<div class="search-box"><input id="searchInput" placeholder="주제 검색: 연애, 재물, 이직…" /></div><div class="menu-list" id="searchList">' + items + '</div>');
    const list = $('#searchList');
    $('#searchInput').addEventListener('input', e => {
      const v = e.target.value.trim();
      $$('.menu-item', list).forEach(m => {
        m.style.display = !v || m.textContent.includes(v) ? '' : 'none';
      });
    });
    list.addEventListener('click', e => {
      const m = e.target.closest('.menu-item'); if (!m) return;
      closeSheet();
      askFlow({ question: m.dataset.q, category: m.dataset.cat, type: 'qna' });
    });
  }

  function openMenu() {
    const c = D.CHARACTERS.map(x => '<button class="menu-item" data-char="' + x.id + '"><span class="mi-icon">道</span>' + esc(x.name) + '<span class="mi-sub">' + esc(x.fields[0]) + '</span></button>').join('');
    openSheet('전체 메뉴',
      '<div class="menu-list">' +
      '<button class="menu-item" data-m="y2027"><span class="mi-icon">🎍</span>2027 정미년 특별관<span class="mi-sub">12개월 · 삼재</span></button>' +
      '<button class="menu-item" data-m="compat"><span class="mi-icon">🧩</span>정밀 궁합 · 두 사람<span class="mi-sub">16글자 비교</span></button>' +
      '<button class="menu-item" data-m="daeun"><span class="mi-icon">🧭</span>10년 대운<span class="mi-sub">전성기 · 조심할 10년</span></button>' +
      '<button class="menu-item" data-m="gilil"><span class="mi-icon">📅</span>2027 길일<span class="mi-sub">계약 · 이직 · 이사</span></button>' +
      '<button class="menu-item" data-m="today"><span class="mi-icon">今</span>오늘의 운세<span class="mi-sub">무료</span></button>' +
      '<button class="menu-item" data-m="archive"><span class="mi-icon">庫</span>보관함<span class="mi-sub">내 사주 · 기록</span></button>' +
      '<button class="menu-item" data-m="profile"><span class="mi-icon">生</span>내 사주 등록·수정<span class="mi-sub">생년월일</span></button>' +
      c + '</div>');
    $('#sheetBody').onclick = e => {
      const m = e.target.closest('[data-m]'), ch = e.target.closest('[data-char]');
      if (m) {
        closeSheet();
        if (m.dataset.m === 'y2027') { showView('home'); const b = $('#y2027Block'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        if (m.dataset.m === 'compat') openCompatForm({});
        if (m.dataset.m === 'daeun') openDaeun();
        if (m.dataset.m === 'gilil') openGilil();
        if (m.dataset.m === 'today') showView('today');
        if (m.dataset.m === 'archive') showView('archive');
        if (m.dataset.m === 'profile') openBirthForm({ title: '내 사주 등록' });
      } else if (ch) {
        closeSheet(); openProduct(ch.dataset.char);
      }
    };
  }

  /* ---------------- 무료 6종 / 기타 이벤트 ---------------- */
  function bindMisc() {
    $('#btnSearch').addEventListener('click', openSearch);
    $('#btnMenu').addEventListener('click', openMenu);
    $('#askInput').addEventListener('input', e => { $('#askCount').textContent = e.target.value.length + ' / 300'; });
    $('#askSubmit').addEventListener('click', () => {
      const q = $('#askInput').value.trim();
      if (!q) { $('#askInput').focus(); return; }
      askFlow({ question: q, type: 'qna', charId: state.askChar });
    });
  }

  /* ================= 2027 정미년 특별관 ================= */
  function renderY2027() {
    const box = $('#y27Grid'); if (!box || !Y27) return;
    const lead = $('#y27Lead'); if (lead) lead.textContent = D.Y2027.lead;
    box.innerHTML = D.Y2027.items.map(it => {
      const price = it.price
        ? '<b>' + won(it.price) + '원</b><s>' + won(it.list) + '원</s>'
        : '<b class="free">무료</b><s>' + won(it.list) + '원</s>';
      return '<button class="y27-card" data-y="' + it.id + '">' +
        '<span class="y27-badge">' + esc(it.badge) + '</span>' +
        '<span class="y27-icon">' + it.icon + '</span>' +
        '<span class="y27-title">' + esc(it.title) + '</span>' +
        '<span class="y27-sub">' + esc(it.sub) + '</span>' +
        '<span class="y27-price">' + price + '</span></button>';
    }).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-y]'); if (!b) return;
      y2027Open(b.dataset.y);
    });
  }

  function y2027Open(kind, chart) {
    const item = D.Y2027.items.find(x => x.id === kind); if (!item) return;
    const go = c => y2027Sheet(kind, c);
    if (chart) { go(chart); return; }
    if (!state.profile) { openBirthForm({ title: '2027 정미년 · 생년월일 확인', onDone: go }); return; }
    go(E.buildChart(state.profile));
  }

  function y2027Sheet(kind, chart, opts) {
    opts = opts || {};
    const item = D.Y2027.items.find(x => x.id === kind); if (!item) return;
    const chart2 = ensureChart(chart);
    const y = Y27.build(chart2);
    openSheet(item.title, y2027HTML(item, chart2, y));
    bindPay($('#sheetBody'), item.id);
    bindPdf($('#sheetBody'));
    const cl = $('#y27Close'); if (cl) cl.addEventListener('click', closeSheet);
    const hm = $('#y27Home');
    if (hm) hm.addEventListener('click', () => {
      closeSheet(); showView('home');
      const b = $('#y2027Block'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const sv = $('#y27Save');
    if (sv) sv.addEventListener('click', () => {
      saveHistory({
        kind: 'y2027', y: kind, typeLabel: '2027 정미년', title: item.title,
        question: '', category: item.kind === 'moneyleak' || item.kind === 'calendar' ? 'money' : item.kind === 'reunion' ? 'reunion' : 'fate',
        charId: item.charId, chart: chart,
        dateLabel: (new Date().getMonth() + 1) + '월 ' + new Date().getDate() + '일',
        summary: Y27.summary(chart, kind)
      });
      showToast(D.REPORT.savedToast);
      sv.disabled = true; sv.textContent = '보관함에 저장됨';
    });
  }

  /* ---- 2027 리포트 조각 (유료 심층) ---- */
  function y27Row(m) {
    return '<div class="y27-tr ' + m.gradeKey + '">' +
      '<span class="c-no">' + m.no + '월</span>' +
      '<span class="c-gz"><b>' + m.hanja + '</b><i>' + m.startLabel + '</i></span>' +
      '<span class="c-god">' + m.god + '<i>' + m.branchGod + '</i></span>' +
      '<span class="c-stage">' + m.stage + '</span>' +
      '<span class="c-rel">' + (m.relYear.length ? m.relYear.join('·') : '–') + '</span>' +
      '<span class="c-bar"><i style="width:' + m.score + '%"></i><em>' + m.score + '</em></span></div>';
  }

  function y27Table(y) {
    return '<div class="y27-table">' +
      '<div class="y27-tr th"><span>월</span><span>간지</span><span>십성</span><span>운성</span><span>未 관계</span><span>흐름</span></div>' +
      y.months.map(y27Row).join('') + '</div>' +
      '<p class="rp-note" style="margin-top:6px">간지 아래 날짜는 절입(節入)일 · 십성 큰 글씨는 월간, 작은 글씨는 월지 본기 기준 · 흐름 100점 만점</p>';
  }

  function y27Picks(y) {
    const card = (m, cls) => '<div class="y27-pick ' + cls + '">' +
      '<b>' + m.no + '월 <small>' + m.hanja + '</small></b>' +
      '<span>' + m.god + ' · ' + m.stage + ' · ' + (m.relYear.length ? m.relYear.join('·') : '충합 없음') + '</span>' +
      '<em>' + m.tag + ' ' + m.score + '</em>' +
      '<p>' + m.pick + '</p></div>';
    const block = (list, cls, cap) => !list.length ? '' : '<div class="y27-pick-group"><span class="y27-pick-cap">' + cap + '</span><div class="y27-picks">' +
      list.map(m => card(m, cls)).join('') + '</div></div>';
    return '<div class="y27-pick-wrap">' +
      block(y.good, 'good', '좋은 달 — 힘을 싣기 좋은 달') +
      block(y.warn, 'bad', '조심할 달 — 방어가 필요한 달') + '</div>';
  }

  function y27Lines(arr) {
    return '<div class="y27-lines">' + arr.map(m =>
      '<div class="y27-line ' + m.gradeKey + '">' +
      '<div class="y27-line-head"><b>' + m.no + '월 <small>' + m.hanja + '</small></b>' +
      '<span>' + m.god + ' · ' + m.stage + '</span><em class="y27-score">' + m.tag + ' ' + m.score + '</em></div>' +
      (m.story || [m.line]).map(s => '<p>' + s + '</p>').join('') +
      '<p class="y27-fix">방어 · ' + esc(m.fix) + '</p></div>').join('') + '</div>';
  }

  function y27Half(h, label) {
    return '<div class="y27-half"><div class="y27-half-head"><b>' + label + '</b><span>평균 ' + h.avg + '점 · 최고 ' + h.best.no + '월 · 최저 ' + h.worst.no + '월</span></div>' +
      (h.story ? h.story.map(p => '<p class="rp-para">' + p + '</p>').join('') : '') +
      y27Lines(h.arr) + '</div>';
  }

  function y27RelText(rel) {
    const map = { 충: '부딪히고 바뀌는 자리 — 이동·계약 변동', 합: '묶이고 맺어지는 자리 — 인연·거래 성사', 형: '서로 눌리는 자리 — 말·서류 마찰', 파: '깨지는 자리 — 약속·관계 어긋남', 해: '어긋나는 자리 — 오해와 소모', 복음: '같은 기운이 겹친 자리 — 판단이 강해짐' };
    return rel.map(r => map[r] || r).join(' / ');
  }

  function y27YearRel(y) {
    const hits = y.yearHits;
    return (hits.length
      ? '<div class="y27-hits">' + hits.map(h => '<div class="y27-hit"><b>' + h.label + ' ' + h.name + '</b><em>' + h.rel.join('·') + '</em><span>' + y27RelText(h.rel) + '</span></div>').join('') + '</div>'
      : '<div class="rp-caution">내 지지와 未토 사이에 충·합·형·파가 없습니다. 2027년은 내 사주를 크게 흔드는 해가 아니라 쌓은 것을 그대로 쓰는 해입니다.</div>') +
      (y.samhapYear ? '<p class="rp-para">내 지지가 未와 <b>' + y.samhapYear + '국</b>을 이룹니다 — 이 해에 판이 크게 움직입니다.</p>' : '');
  }

  function y27Lucky(chart) {
    const lk = chart.yongsin.elem, L = E.LUCKY[lk];
    return '<div class="lucky-grid">' +
      '<div class="lucky-item"><span>도움이 되는 오행</span><b>' + lk + ' · ' + L.color + '</b></div>' +
      '<div class="lucky-item"><span>행운의 숫자</span><b>' + L.number.join(' · ') + '</b></div>' +
      '<div class="lucky-item"><span>길한 방위</span><b>' + L.dir + '</b></div>' +
      '<div class="lucky-item"><span>좋은 시간</span><b>' + L.time + '</b></div>' +
      '<div class="lucky-item"><span>2027년 키워드</span><b>오행 ' + chart.yongsin.elem + '를 채우는 한 해</b></div>' +
      '<div class="lucky-item"><span>피할 것</span><b style="font-size:11px;line-height:1.5">' + esc(chart.yongsin.care) + '</b></div></div>';
  }

  function y27RiskMonths(y) {
    const risk = y.months.filter(m => m.relYear.concat(m.relMine).some(r => ['충', '형', '파', '해'].indexOf(r) >= 0));
    if (!risk.length) return '<div class="rp-caution">내 일지와 부딪히는 달이 없습니다. 올해는 흔들림 없이 갈 수 있는 해입니다.</div>';
    return '<div class="y27-table">' +
      '<div class="y27-tr th"><span>월</span><span>간지</span><span>십성</span><span>운성</span><span>관계</span><span>흐름</span></div>' +
      risk.map(y27Row).join('') + '</div>' +
      y27Lines(risk);
  }

  function y27Track(name, months, cls) {
    return '<div class="y27-track ' + cls + '"><span>' + name + '</span><div class="y27-chips">' +
      (months.length ? months.map(mo => '<i>' + mo + '월</i>').join('') : '<i class="none">해당 달 없음</i>') + '</div></div>';
  }

  function y27Share(title, sub) {
    return '<div class="y27-share"><b>' + title + '</b><p>' + sub + '</p><em>#월하사주 #2027정미년</em></div>';
  }

  /* ---- 무료 맛보기: 만세력 미니 표 + 핵심 경고/기회 1~2문단 ---- */
  function y27Mini(chart) {
    const p = chart.pillars;
    const cell = (label, pl) => '<div class="mini-pl' + (label === '일주' ? ' is-day' : '') + '"><span>' + label + '</span>' +
      '<b class="' + ELCLS[pl.stemElem] + '">' + pl.stemName + '</b><b class="' + ELCLS[pl.branchElem] + '">' + pl.branchName + '</b></div>';
    const yy = chart.yinyang;
    return '<div class="y27-mini">' +
      '<div class="mini-pls">' + cell('년주', p.year) + cell('월주', p.month) + cell('일주', p.day) +
      (p.hour ? cell('시주', p.hour) : '<div class="mini-pl is-empty"><span>시주</span><b>·</b><b>·</b></div>') + '</div>' +
      '<div class="y27-mini-row">' +
      '<span>일간 <b>' + chart.dayMaster.hanja + ' ' + chart.dayMaster.elem + '</b></span>' +
      '<span>형세 <b>' + chart.strengthKo + ' ' + chart.strengthRatio + '%</b></span>' +
      '<span>용신 <b>' + chart.yongsin.elem + '</b></span>' +
      '<span>음양 <b>' + yy.yangPct + ':' + yy.yinPct + '</b></span>' +
      '</div></div>';
  }

  function y27Preview(item, chart, y) {
    const dm = chart.dayMaster;
    const gs = E.GOD_SIT[y.yearGod];
    const out = [];
    out.push('<p class="rp-lead">2027 정미년의 하늘은 丁(음화), 땅은 未(음토)입니다. 내 일간 ' + dm.hanja + '(' + dm.ko + dm.elem + ')에게 올해 천간 丁은 ' + y.yearGod + ' 자리 — ' + gs.sit + '입니다. ' + (y.yearRead.tail || y.yearRead.text) + '</p>');
    if (item.kind === 'newyear') {
      out.push('<p class="rp-para">이 사주에서 2027년이 가장 힘을 주는 달은 <b>' + y.good[0].no + '월(' + y.good[0].hanja + ') ' + y.good[0].score + '점</b>입니다. ' + y.good[0].pick + ' 반대로 가장 조심할 달은 <b>' + y.warn[0].no + '월(' + y.warn[0].hanja + ') ' + y.warn[0].score + '점</b> — ' + y.warn[0].pick + '</p>');
    } else if (item.kind === 'samjae') {
      out.push('<p class="rp-para"><b>' + y.samjae.head + '</b>. ' + y.samjae.body.split('. ')[0] + '.</p>');
    } else if (item.kind === 'calendar') {
      out.push('<p class="rp-para">2027년 이 사주에서 재물의 달은 <b>' + (y.focus.money.months.join(' · ') || '해당 없음') + '</b>, 이직·직장의 달은 <b>' + (y.focus.job.months.join(' · ') || '해당 없음') + '</b>, 1인 사업·부업의 달은 <b>' + (y.focus.biz.months.join(' · ') || '해당 없음') + '</b>입니다. 달마다 왜 그런지, 무엇을 먼저 해야 하는지는 아래 심층 풀이에서 하나씩 짚습니다.</p>');
    } else if (item.kind === 'reunion') {
      out.push('<p class="rp-para">' + y.reunion.head + '. 연락의 문이 열리는 달은 <b>' + (y.reunion.open.join(' · ') || '없음') + '</b>, 부딪히기 쉬운 달은 <b>' + (y.reunion.rough.join(' · ') || '없음') + '</b>입니다. 아래에서는 그 사람의 속마음과 첫 연락의 문장을 함께 짚습니다.</p>');
    }
    return out.join('');
  }

  function y27PayDesc(kind) {
    return {
      newyear: '12개월 월운 전체 풀이 · 좋은 달과 조심할 달의 이유 · 상·하반기 실전 배치',
      samjae: '내 지지별 충·형·파 판정 · 삼재 방어 3원칙 · 부딪히는 달 전체',
      calendar: '재물·이직·1인 사업 세 트랙의 달별 심층 풀이와 움직일 시기',
      reunion: '속마음 심층 · 연락이 오는 달의 이유 · 첫 연락 문장'
    }[kind] || '심층 풀이 전체';
  }

  function y2027HTML(item, chart, y) {
    const dm = chart.dayMaster;
    const heart = D.COPY.category.heart;
    const groupKey = dominantGodGroup(chart);
    const paid = !!(item.price && item.price > 0);
    const head = '<div class="y27-head">' +
      '<span class="y27-seal">2027<b>丁未</b></span>' +
      '<div class="y27-head-txt"><b>' + item.icon + ' ' + esc(item.title) + '</b>' +
      '<span>' + dm.hanja + '(' + dm.ko + dm.elem + ') 일간 · ' + chart.pillars.year.hanja + ' ' +
      chart.pillars.month.hanja + ' ' + chart.pillars.day.hanja + (chart.pillars.hour ? ' ' + chart.pillars.hour.hanja : '') + '</span>' +
      '<em class="y27-tag">' + (item.price ? won(item.price) + '원' : '무료') + ' · ' + esc(item.badge) + '</em></div></div>' +
      pdfBarHTML() +
      '<p class="rp-voice">2027년 책력과 내 여덟 글자를 나란히 놓고 달마다 짚어 봤습니다. 좋은 달이 반짝하고 오는 해는 아니에요. 대신 이 해는 버티는 사람이 이깁니다. 달마다 왜 그런지, 무엇을 조심해야 하는지 하나씩 말씀드릴게요.</p>';

    const preview = paid
      ? '<div class="y27-free"><span class="y27-free-kicker">무료 맛보기 · 여덟 글자로 먼저 짚어 봄</span>' +
      y27Mini(chart) + y27Preview(item, chart, y) + '</div>'
      : '<div class="y27-free"><span class="y27-free-kicker">전체 무료 공개</span>' + y27Mini(chart) + '</div>' +
      '<p class="rp-lead">2027 정미년의 천간 <b>丁(음화)</b>과 지지 <b>未(음토)</b>가 내 사주와 만나면, 천간은 내게 <b>' + y.yearGod + '</b>의 자리가 됩니다. ' +
      '아래는 이 사주팔자에 2027년의 절기를 하나씩 맞춰 본 풀이입니다.</p>';

    let body = '';

    if (item.kind === 'newyear') {
      body =
        '<div class="rp-title"><span>한눈에 · 좋은 달 3 / 조심할 달 3</span></div>' + y27Picks(y) +
        '<div class="rp-title"><span>2027년 12개월 월운표</span></div>' + y27Table(y) +
        '<div class="rp-title"><span>상반기 1~6월 실전 풀이</span></div>' + y27Half(y.half1, '상반기') +
        '<div class="rp-title"><span>하반기 7~12월 실전 풀이</span></div>' + y27Half(y.half2, '하반기') +
        '<div class="rp-title"><span>내 사주와 未토</span></div>' + y27YearRel(y) +
        y27Share('내 2027 최고의 달은 ‘' + y.good[0].no + '월’, 조심할 달은 ‘' + y.warn[0].no + '월’',
          dm.ko + dm.elem + ' 일간 · 정미년 未토와 ' + (y.yearHits.length ? y.yearHits[0].rel.join('·') : '별다른 작용 없음') + ' · 좋은 달 ' + y.good.map(m => m.no + '월').join('·'));
    }

    if (item.kind === 'samjae') {
      body =
        '<div class="rp-title"><span>삼재 판정</span></div>' +
        '<div class="y27-samjae ' + (y.samjae.is ? 'on' : 'off') + '"><b>' + esc(y.samjae.head) + '</b><p>' + esc(y.samjae.body) + '</p>' +
        '<ul class="rp-list advice">' + y.samjae.todo.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
        '<div class="rp-title"><span>내 지지 ↔ 未 분석</span></div>' + y27YearRel(y) +
        '<div class="rp-title"><span>2027년 충·형이 오는 달</span></div>' + y27RiskMonths(y) +
        '<div class="rp-title"><span>방어 3원칙</span></div>' +
        '<ul class="rp-list advice"><li><b>돈은 묶고 계약은 미루기</b> — 새 보증·동업·큰 대출은 2028년으로 넘기세요.</li>' +
        '<li><b>몸을 먼저 챙기기</b> — 삼재는 몸과 사람에서 옵니다. 수면·검진을 일정에 먼저 넣으세요.</li>' +
        '<li><b>문서로 남기기</b> — 구두 약속은 그 해에 흔들립니다. 돈과 일은 반드시 글로 남기세요.</li></ul>' +
        y27Share('2027년 내 삼재 판정 — ' + y.samjae.stage, esc(y.samjae.head));
    }

    if (item.kind === 'moneyleak') {
      const dm2 = chart.dayMaster;
      body =
        '<div class="rp-title"><span>돈 새는 구멍 ' + y.leaks.length + '곳</span></div>' +
        '<div class="y27-leaks">' + y.leaks.map((l, i) => '<div class="y27-leak"><span class="lv">' + (i + 1) + '순위</span><b>' + esc(l.title) + '</b><em>' + esc(l.why) + '</em><p>' + esc(l.fix) + '</p></div>').join('') + '</div>' +
        '<div class="rp-title"><span>돈이 들어오는 길</span></div>' +
        '<p class="rp-para">이 사주는 <b>' + dm2.elem + ' 일간 · ' + chart.strengthKo + '</b> 구조로, 재물은 ' +
        (chart.godGroups.재성 >= 2 ? '재성 ' + chart.godGroups.재성 + '개로 직접 들어오는 길이 있습니다. 벌이의 그릇은 충분하니 지키는 장치가 관건입니다.' : chart.godGroups.재성 === 1 ? '재성 1개로 길이 하나입니다. 그 하나를 넓히는 데 집중해야 합니다.' : '재성이 비어 있어 직접 벌이보다 기술·콘텐츠(식상)로 우회해 들어옵니다.') +
        '</p>' +
        '<ul class="rp-list advice">' + E.deepRead(chart).money.tips.slice(0, 2).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
        '<div class="rp-title"><span>귀인 띠</span></div>' +
        '<div class="y27-guin">' + y.guin.list.map(g => '<div class="y27-guin-item ' + (g.here ? 'on' : '') + '"><b>' + g.animal + '</b><span>' + g.char + '</span><em>' + (g.here ? '내 사주에 있음 — 가장 가까운 귀인' : '이 띠의 사람·달이 도움') + '</em></div>').join('') + '</div>' +
        '<p class="rp-para">' + esc(y.guin.note) + ' 2027년에 부딪히기 쉬운 띠는 <b>' + esc(y.guin.avoidAnimal) + '(' + y.guin.avoidChar + ')</b>입니다. 큰 결정을 함께할 때는 한 번 더 확인하세요.</p>' +
        '<div class="rp-title"><span>2027년 돈이 들어오는 달</span></div>' +
        (y.focus.money.months.length ? '<div class="y27-chips big">' + y.focus.money.months.map(mo => '<i>' + mo + '월</i>').join('') + '</div>' +
          y27Lines(y.months.filter(m => y.focus.money.months.indexOf(m.no) >= 0)) : '<div class="rp-caution">월간 기준 재성의 달이 없습니다. 대신 월지 재성운이 오는 달에 정산·계약을 몰아 두세요.</div>') +
        y27Share('내 사주 돈 새는 구멍 1순위는 “' + esc(y.leaks[0].title) + '”',
          esc(y.guin.note) + ' · 조심할 띠 ' + esc(y.guin.avoidAnimal) + ' · 2027 돈 들어오는 달 ' + y.focus.money.months.join('·'));
    }

    if (item.kind === 'sal') {
      body =
        '<div class="rp-title"><span>내 특수살 판정</span></div>' +
        '<div class="y27-sal">' + y.sal.map(s => '<div class="y27-sal-card ' + (s.on ? 'on' : 'off') + '"><span>' + s.name + '</span><b>' + (s.on ? '있음' : '없음') + '</b><em>' + (s.on ? '내 ' + s.where.join(' · ') + '에 ' + s.branchName : s.branchName + '가 있어야 성립') + '</em></div>').join('') + '</div>' +
        '<div class="rp-title"><span>살마다의 의미</span></div>' +
        y.sal.map(s => '<p class="rp-para"><strong>' + s.name + ' ' + (s.on ? '○' : '×') + '</strong> — ' + esc(s.meaning) + ' ' + esc(s.use) + '</p>').join('') +
        '<div class="rp-title"><span>2027년 未와의 작용</span></div>' +
        '<ul class="rp-list">' + y.sal.map(s => {
          const rel = Y27.relOf(7, s.branch);
          return '<li><b>' + s.name + '</b> 자리 ' + s.branchName + ' — 未와 ' + (rel.length ? rel.join('·') : '특별한 작용 없음') + (rel.indexOf('합') >= 0 ? ' (2027년에 이 살이 열립니다)' : rel.indexOf('충') >= 0 ? ' (이 살이 흔들리는 해, 감정 소모 주의)' : '') + '</li>';
        }).join('') + '</ul>' +
        y27Share('내 특수살은 ' + (y.sal.filter(s => s.on).map(s => s.name).join('·') || '없음'), y.sal.map(s => s.name + ' ' + (s.on ? '○' : '×')).join(' · '));
    }

    if (item.kind === 'calendar') {
      const pickLines = mo => y.months.filter(m => mo.indexOf(m.no) >= 0);
      body =
        '<div class="rp-title"><span>3개 트랙 한눈에</span></div>' +
        y27Track('재물 (편재·정재)', y.focus.money.months, 'money') +
        y27Track('이직·직장 (정관·편관)', y.focus.job.months, 'job') +
        y27Track('1인 사업·부업 (식신·상관)', y.focus.biz.months, 'biz') +
        '<div class="rp-title"><span>2027년 12개월 월운표</span></div>' + y27Table(y) +
        '<div class="rp-title"><span>재물 트랙 — 언제 돈을 움직일까</span></div>' +
        (y.focus.money.months.length ? y27Lines(pickLines(y.focus.money.months)) : '<div class="rp-caution">월간 재성의 달이 없습니다. 정산·계약은 조심할 달을 피해 잡으세요.</div>') +
        '<div class="rp-title"><span>이직 트랙 — 언제 움직일까</span></div>' +
        (y.focus.job.months.length ? y27Lines(pickLines(y.focus.job.months)) : '<div class="rp-caution">월간 관성의 달이 없습니다. 이직은 준비를 길게, 지원은 다음 해로 미루는 편이 낫습니다.</div>') +
        '<div class="rp-title"><span>1인 사업·부업 트랙</span></div>' +
        (y.focus.biz.months.length ? y27Lines(pickLines(y.focus.biz.months)) : '<div class="rp-caution">식상의 달이 약합니다. 새 일을 벌이기보다 손에 익은 일을 키우세요.</div>') +
        '<div class="rp-title"><span>2027년 주의할 달</span></div>' + y27Picks({ good: [], warn: y.warn }) +
        y27Share('재물 ' + (y.focus.money.months.join('·') || '–') + ' / 이직 ' + (y.focus.job.months.join('·') || '–'), '2027 정미년 · ' + dm.ko + ' ' + dm.elem + ' 일간 기준');
    }

    if (item.kind === 'reunion') {
      const dx2 = E.deepRead(chart);
      body =
        '<div class="rp-title"><span>2027 인연의 문</span></div>' +
        '<div class="y27-samjae ' + (y.reunion.yearOpen ? 'on' : 'off') + '"><b>' + esc(y.reunion.head) + '</b><p>' +
        '내 일지 <b>' + chart.pillars.day.hanja + '(' + chart.pillars.day.animal + ')</b>과 2027년 未토는 ' + (y.reunion.yearOpen ? '육합' : y.reunion.yearRough ? '충' : '특별한 합·충이 없는') + ' 관계입니다. ' +
        (y.reunion.yearOpen ? '합은 묶이는 자리라, 끊긴 인연이 다시 이어지기 좋은 해입니다.' : y.reunion.yearRough ? '충은 부딪히는 자리라, 미련이 정리되고 새 사람이 들어오는 해입니다.' : '그래서 2027년의 재회는 해의 기운보다 달의 타이밍이 결정합니다.') + '</p></div>' +
        '<div class="rp-title"><span>속마음 읽기 — 이 사주가 사랑할 때</span></div>' +
        '<p class="rp-lead">' + esc(heart.reflect) + '</p>' +
        dx2.love.paras.map(p => '<p class="rp-para">' + esc(p) + '</p>').join('') +
        '<p class="rp-para"><strong>' + esc(groupKey) + ' 구조</strong> — ' + esc(heart.via[groupKey] || '') + '</p>' +
        '<div class="rp-title"><span>연락이 올 달 · 마찰 달</span></div>' +
        '<div class="y27-track open"><span>인연의 문이 열리는 달</span><div class="y27-chips">' + (y.reunion.open.length ? y.reunion.open.map(mo => '<i>' + mo + '월</i>').join('') : '<i class="none">해당 달 없음</i>') + '</div></div>' +
        '<div class="y27-track bad"><span>부딪히기 쉬운 달</span><div class="y27-chips">' + (y.reunion.rough.length ? y.reunion.rough.map(mo => '<i>' + mo + '월</i>').join('') : '<i class="none">해당 달 없음</i>') + '</div></div>' +
        (y.reunion.open.length ? y27Lines(y.months.filter(m => y.reunion.open.indexOf(m.no) >= 0)) : '') +
        '<div class="rp-title"><span>첫 연락의 문장</span></div>' +
        '<ul class="rp-list advice"><li>“요즘 어떻게 지내? 문득 생각나서.” — 용건 없이 안부만. 답이 오면 두 번째 대화로 넘어가세요.</li>' +
        '<li>“전에 네가 좋아하던 ○○, 아직 하니?” — 그 사람의 취향을 기억한 한 문장이 가장 안전합니다.</li>' +
        '<li>“급한 건 아니야. 시간 될 때 답 줘.” — 문을 열어 두는 문장이 재회 확률을 높입니다.</li></ul>' +
        '<div class="rp-caution">밤 11시 이후 연락과 긴 문자는 재회 확률을 낮춥니다. 낮의 짧은 안부가 길을 엽니다.</div>' +
        y27Share(y.reunion.head, '내 일지 ' + chart.pillars.day.hanja + ' · 2027년에 문이 열리는 달 ' + (y.reunion.open.join('·') || '없음'));
    }

    return head + preview +
      (paid ? payWrapHTML({
        kind: item.id, price: item.price, list: item.list,
        label: esc(item.title) + ' 전체 열기', desc: y27PayDesc(item.kind), inner: body
      }) : body) +
      '<div class="rp-title"><span>행운 포인트</span></div>' + y27Lucky(chart) +
      '<div class="rp-actions"><button class="btn-ghost" id="y27Close">닫기</button><button class="btn-ghost" id="y27Home">2027 전체 보기</button><button class="btn-ghost" data-pdf hidden>📄 PDF 저장</button><button class="btn-gold" id="y27Save">보관함 저장</button></div>' +
      '<div class="rp-note">' + esc(D.REPORT.solarNote) + ' · 2027년 월운은 24절기 절입 기준입니다.<br />' + esc(D.REPORT.mockNote) + ' ' + esc(D.BRAND.footer) + '</div>';
  }

  /* ================= 정밀 궁합 · 10년 대운 · 2027 길일 ================= */
  const P = window.SAJU_PLUS;
  const K_PARTNER = 'wolha_partner_v1';
  const WHY = {
    '천을귀인일': '천을귀인(天乙貴人)이 내리는 날 — 막힌 일을 풀어 줄 사람이 그 자리에 나타나기 쉬운 날입니다.',
    '일지 육합': '내 일지와 육합(六合)하는 날 — 맺고 묶이는 힘이 있어 약속이 오래갑니다.',
    '일지 반합': '내 일지와 반합(半合)하는 날 — 힘은 절반이지만 방향이 맞으면 통합니다.',
    '정재일': '정재(正財)의 날 — 숫자와 서류가 깔끔하게 맞습니다.',
    '정관일': '정관(正官)의 날 — 공식 자리에서 이름이 오르기 좋습니다.',
    '식신일': '식신(食神)의 날 — 말과 손이 잘 풀립니다.',
    '편재일': '편재(偏財)의 날 — 예상 밖의 길이 열리지만 씀씀이도 함께 커집니다.',
    '정인일': '정인(印星)의 날 — 문서와 윗사람의 도움이 붙습니다.'
  };
  const BADWHY = {
    '일지 충일': '내 일지와 정면으로 부딪히는 날 — 계약·이사·큰 결제를 피하세요.',
    '상관견관일': '상관견관(傷官見官) — 말과 서류가 어긋나기 쉬운 날입니다.',
    '겁재일': '겁재(劫財)의 날 — 돈이 오가는 자리에서 손실이 생기기 쉽습니다.',
    '일지 형일': '형(刑)이 드는 날 — 가까운 사람과 마찰이 생깁니다.',
    '일지 파일': '파(破)가 드는 날 — 맺은 약속이 어긋나기 쉽습니다.',
    '일지 해일': '해(害)가 드는 날 — 말과 마음이 어긋납니다.'
  };

  function renderPlus() {
    const box = $('#plusGrid'); if (!box || !P) return;
    const cards = [
      { id: 'compat', icon: '🧩', tag: '2인 입력', title: '정밀 궁합', sub: '두 사람 여덟 글자 · 결혼·재회까지' },
      { id: 'daeun', icon: '🧭', tag: '평생 흐름', title: '10년 대운', sub: '내 인생 전성기 · 조심할 10년' },
      { id: 'gilil', icon: '📅', tag: '2027', title: '계약·이직·이사 길일', sub: '도장 찍을 날과 피할 날' }
    ];
    box.innerHTML = cards.map(c => '<button class="plus-card" data-plus="' + c.id + '">' +
      '<span class="plus-icon">' + c.icon + '</span>' +
      '<span class="plus-tag">' + c.tag + '</span>' +
      '<span class="plus-title">' + c.title + '</span>' +
      '<span class="plus-sub">' + c.sub + '</span></button>').join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-plus]'); if (!b) return;
      if (b.dataset.plus === 'compat') openCompatForm({});
      else if (b.dataset.plus === 'daeun') openDaeun();
      else if (b.dataset.plus === 'gilil') openGilil();
    });
  }

  /* ---- 정밀 궁합: 두 사람 입력 ---- */
  function personFieldsHTML(key, title, p) {
    const y = p && p.year ? p.year : 1995, m = p && p.month ? p.month : 1, d = p && p.day ? p.day : 1;
    const hourOpts = '<option value=""' + (!p || p.hour == null || p.hour === '' ? ' selected' : '') + '>태어난 시간 모름</option>' +
      SIZI.map(s => '<option value="' + s.v + '"' + (p && +p.hour === s.v ? ' selected' : '') + '>' + s.l + '</option>').join('');
    return '<div class="pf-block">' +
      '<div class="pf-title">' + title + '</div>' +
      '<div class="field"><label>이름 또는 별명</label><input id="pf' + key + 'Name" maxlength="12" placeholder="' + (key === 'B' ? '상대 이름' : '내 이름') + '" value="' + esc(p && p.name || '') + '" /></div>' +
      '<div class="field"><label>성별</label><div class="seg" id="pf' + key + 'Gender">' +
      '<button type="button" data-g="male"' + (!p || p.gender !== 'female' ? ' class="is-on"' : '') + '>남성</button>' +
      '<button type="button" data-g="female"' + (p && p.gender === 'female' ? ' class="is-on"' : '') + '>여성</button></div></div>' +
      '<div class="field"><label>생년월일 (양력)</label><div class="field-row">' +
      '<select id="pf' + key + 'Y">' + rangeOpts(1930, 2026, y, '년') + '</select>' +
      '<select id="pf' + key + 'M">' + rangeOpts(1, 12, m, '월') + '</select>' +
      '<select id="pf' + key + 'D">' + rangeOpts(1, 31, d, '일') + '</select></div></div>' +
      '<div class="field"><label>태어난 시간</label><select id="pf' + key + 'H">' + hourOpts + '</select></div>' +
      '</div>';
  }

  function compatFormHTML(pa, pb) {
    return '<form class="form-grid cp-form" id="compatForm" autocomplete="off">' +
      '<p class="pf-note">두 사람의 생년월일시로 사주팔자를 여덟 글자씩 세워, 열여섯 글자를 나란히 놓고 봅니다. 상대의 시간을 모르면 비워 두셔도 됩니다 — 큰 흐름은 그대로 읽힙니다.</p>' +
      personFieldsHTML('A', '나', pa) + personFieldsHTML('B', '상대', pb) +
      '<div class="form-note" id="cpNote">' + esc(D.REPORT.solarNote) + '</div>' +
      '<button class="btn-gold wide" type="submit">두 사람 궁합 보기</button>' +
      '<button type="button" class="btn-ghost wide" id="cpSolo">상대 생년월일 없이 내 사주만으로 보기</button>' +
      '</form>';
  }

  function openCompatForm(opts) {
    opts = opts || {};
    const pa = state.profile || null;
    const pb = store.get(K_PARTNER, null);
    openSheet('정밀 궁합 · 두 사람', compatFormHTML(pa, pb));
    let gA = pa && pa.gender ? pa.gender : 'male';
    let gB = pb && pb.gender ? pb.gender : 'female';
    const bindSeg = (key, set) => {
      const el = $('#pf' + key + 'Gender'); if (!el) return;
      el.addEventListener('click', e => {
        const b = e.target.closest('button[data-g]'); if (!b) return;
        set(b.dataset.g);
        $$('#pf' + key + 'Gender button').forEach(x => x.classList.toggle('is-on', x === b));
      });
    };
    bindSeg('A', v => { gA = v; });
    bindSeg('B', v => { gB = v; });
    const solo = $('#cpSolo');
    if (solo) solo.addEventListener('click', () => {
      closeSheet();
      if (opts.topic) openAskWithTopic(opts.topic);
      else openBirthForm({});
    });
    $('#compatForm').addEventListener('submit', e => {
      e.preventDefault();
      const read = key => ({
        name: $('#pf' + key + 'Name').value.trim(),
        gender: key === 'A' ? gA : gB,
        year: +$('#pf' + key + 'Y').value, month: +$('#pf' + key + 'M').value,
        day: +$('#pf' + key + 'D').value,
        hour: $('#pf' + key + 'H').value === '' ? null : +$('#pf' + key + 'H').value,
        minute: $('#pf' + key + 'H').value === '' ? 0 : 30
      });
      const a = read('A'), b = read('B');
      for (const p of [a, b]) {
        const dt = new Date(p.year, p.month - 1, p.day);
        if (dt.getMonth() + 1 !== p.month || dt.getDate() !== p.day) {
          $('#cpNote').textContent = '존재하지 않는 날짜가 섞여 있어요. 두 사람의 생년월일을 다시 확인해 주세요.';
          $('#cpNote').classList.add('warn');
          return;
        }
      }
      let ca, cb;
      try { ca = E.buildChart(a); cb = E.buildChart(b); }
      catch (err) { $('#cpNote').textContent = '글자를 세다가 문제가 생겼어요: ' + err.message; return; }
      store.set(K_PARTNER, b);
      if (!state.profile) { state.profile = a; store.set(K_PROFILE, a); renderTodayWidget(); }
      closeSheet();
      compatSheet(ca, cb);
    });
  }

  /* ---- 정밀 궁합 리포트 ---- */
  function cpCell(label, p, isDay) {
    if (!p) return '<div class="cp-cell is-empty"><span class="cp-lbl">' + label + '</span><div class="cp-gz"><b>·</b></div><i>모름</i></div>';
    return '<div class="cp-cell' + (isDay ? ' is-day' : '') + '">' +
      '<span class="cp-lbl">' + label + '</span>' +
      '<div class="cp-gz"><b class="' + ELCLS[p.stemElem] + '">' + p.stemName + '</b><b class="' + ELCLS[p.branchElem] + '">' + p.branchName + '</b></div>' +
      '<i>' + p.ko + ' · ' + p.animal + '</i></div>';
  }

  function cpRow(chart, who) {
    const p = chart.pillars;
    return '<div class="cp-row">' +
      '<div class="cp-who"><b>' + esc(chart.input.name || who) + '</b><span>' + (chart.input.gender === 'female' ? '여' : '남') + ' · ' + chart.input.year + '.' + pad(chart.input.month) + '.' + pad(chart.input.day) + '</span><span>' + esc(P.timeLabel(chart).split(' ')[0]) + '</span></div>' +
      cpCell('년', p.year) + cpCell('월', p.month) + cpCell('일', p.day, true) + cpCell('시', p.hour) + '</div>';
  }

  function compatHTML(res) {
    const A = res.a, B = res.b;
    const t = res.tally || {};
    const chips = [];
    if (t['합']) chips.push('합 ' + t['합']);
    if (t['반합']) chips.push('반합 ' + t['반합']);
    if (t['충']) chips.push('충 ' + t['충']);
    if (t['형']) chips.push('형 ' + t['형']);
    if ((t['파'] || 0) + (t['해'] || 0)) chips.push('파·해 ' + (t['파'] + t['해']));

    const head = '<div class="cp-top">' +
      '<div class="cp-top-txt"><b>정밀 궁합 · 두 사람의 여덟 글자</b>' +
      '<span>' + esc(res.names.a) + ' ' + A.pillars.day.hanja + ' · ' + esc(res.names.b) + ' ' + B.pillars.day.hanja + '</span></div></div>' +
      '<div class="cp-scorebox"><div class="score-ring cp-ring" style="--v:' + res.score + '"><b>' + res.score + '<small>점</small></b></div>' +
      '<div class="cp-grade"><b>' + esc(res.grade.label) + '</b><span>' + esc(res.grade.line) + '</span></div></div>' +
      pdfBarHTML() +
      '<p class="rp-voice">' + esc(res.say.open) + '</p>';

    const free = '<div class="y27-free"><span class="y27-free-kicker">무료 맛보기 · 열여섯 글자를 나란히</span>' +
      '<div class="cp-table">' +
      '<div class="cp-row cp-head"><div class="cp-who">　</div><div class="cp-lbl-c">년</div><div class="cp-lbl-c">월</div><div class="cp-lbl-c">일</div><div class="cp-lbl-c">시</div></div>' +
      cpRow(A, '나') + cpRow(B, '상대') + '</div>' +
      '<div class="cp-chem">' + res.chem.map(c => '<div class="cp-chem-item"><b>' + esc(c.t) + '</b><span>' + esc(c.d) + '</span></div>').join('') + '</div>' +
      (chips.length ? '<div class="cp-parts">' + chips.map(c => '<i>' + esc(c) + '</i>').join('') + '<em>두 사람 지지 16자리 관계</em></div>' : '') +
      '</div>';

    const fM = res.fightMonths.length ? res.fightMonths.map(n => n + '월').join(' · ') : '없음';
    const pM = res.peaceMonths.length ? res.peaceMonths.map(n => n + '월').join(' · ') : '없음';
    const rx = [
      '싸움이 길어지면 그 자리에서 결론을 내지 마세요. 이 궁합은 하루를 두고 다시 말할 때 풀립니다.',
      res.fightMonths.length ? '2027년 ' + fM + '에는 두 사람의 자리가 흔들립니다. 이 달에는 이사·계약·큰 지출을 겹쳐 두지 마세요.' : '2027년에는 두 사람의 자리를 직접 치는 달이 없습니다. 대신 말이 앞서는 순간을 스스로 조심하세요.',
      '두 사람 사이에 오가는 돈은 금액과 날짜를 문자로 남기세요. 이 습관 하나가 이 궁합을 오래 가게 합니다.',
      '서운함은 그날 안에 꺼내세요. 참아 둔 것이 다음 날 두 배로 돌아오는 사주입니다.',
      '한 달에 한 번은 두 사람만의 자리를 새로 만드세요. 익숙함이 이 관계에서 가장 큰 적입니다.'
    ];

    const body =
      '<div class="rp-title"><span>일간 — 두 사람의 중심</span></div><p class="rp-lead">' + esc(res.say.gan) + '</p>' +
      '<div class="rp-title"><span>일지 — 부부의 자리</span></div><p class="rp-para">' + esc(res.say.ji) + '</p>' +
      '<div class="rp-title"><span>열여섯 글자의 지지 관계</span></div><p class="rp-para">' + esc(res.say.cross) + '</p>' +
      '<div class="rp-title"><span>서로에게 필요한 오행</span></div><p class="rp-para">' + esc(res.say.fill) + '</p>' +
      '<div class="rp-title"><span>속궁합 — 살결의 온도</span></div><p class="rp-para">' + esc(res.say.bed) + '</p>' +
      '<div class="rp-title"><span>결혼 시기</span></div><p class="rp-para">' + res.say.marriage + '</p>' +
      '<div class="rp-title"><span>다툼과 화해의 달</span></div>' +
      '<div class="y27-track bad"><span>부딪히기 쉬운 달</span><div class="y27-chips">' + (res.fightMonths.length ? res.fightMonths.map(n => '<i>' + n + '월</i>').join('') : '<i class="none">없음</i>') + '</div></div>' +
      '<div class="y27-track open"><span>화해의 문이 열리는 달</span><div class="y27-chips">' + (res.peaceMonths.length ? res.peaceMonths.map(n => '<i>' + n + '월</i>').join('') : '<i class="none">없음</i>') + '</div></div>' +
      '<p class="rp-para">' + esc(res.say.fight) + '</p><p class="rp-para">' + esc(res.say.peace) + '</p>' +
      '<div class="rp-title"><span>두 사람의 처방전</span></div><ul class="rp-list advice">' + rx.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>' +
      '<div class="rp-title"><span>점수 구성</span></div><div class="cp-parts detail">' + res.parts.map(p => '<i class="' + (p.v.charAt(0) === '+' ? 'up' : 'down') + '">' + esc(p.k) + ' ' + esc(p.v) + '</i>').join('') + '</div>';

    return head + free +
      payWrapHTML({ kind: 'compat', price: 29900, list: 59000, label: '두 사람의 심층 궁합 전체 열기', desc: '일간·일지·16글자 관계 · 속궁합 · 결혼 시기 · 다툼과 화해의 달 · 처방전', inner: body }) +
      '<div class="rp-actions"><button class="btn-ghost" id="cpClose">닫기</button><button class="btn-ghost" id="cpAgain">상대 바꿔 보기</button><button class="btn-ghost" data-pdf hidden>📄 PDF 저장</button><button class="btn-gold" id="cpSave">보관함 저장</button></div>' +
      '<div class="rp-note">' + esc(D.REPORT.solarNote) + ' · 두 사람의 생년월일시로 세운 사주팔자를 마주 놓고 본 풀이입니다.<br />' + esc(D.BRAND.footer) + '</div>';
  }

  function compatSheet(A, B) {
    const res = P.buildCompat(A, B);
    const title = '정밀 궁합 · ' + (A.input.name || '나') + ' · ' + (B.input.name || '상대');
    openSheet(title, compatHTML(res));
    bindPay($('#sheetBody'), 'compat');
    bindPdf($('#sheetBody'));
    const cl = $('#cpClose'); if (cl) cl.addEventListener('click', closeSheet);
    const ag = $('#cpAgain'); if (ag) ag.addEventListener('click', () => { closeSheet(); openCompatForm({}); });
    const sv = $('#cpSave');
    if (sv) sv.addEventListener('click', () => {
      saveHistory({
        kind: 'compat', typeLabel: '정밀 궁합', charId: 'yeonhwa', category: 'love',
        title: (A.input.name || '나') + ' · ' + (B.input.name || '상대') + ' 궁합', question: '',
        chart: A.input, partner: B.input,
        dateLabel: (new Date().getMonth() + 1) + '월 ' + new Date().getDate() + '일',
        summary: res.score + '점 · ' + res.grade.label
      });
      showToast(D.REPORT.savedToast);
      sv.disabled = true; sv.textContent = '보관함에 저장됨';
    });
  }

  /* ---- 10년 대운 ---- */
  function openDaeun(chart) {
    const go = c => daeunSheet(c);
    if (chart) { go(chart); return; }
    if (!state.profile) { openBirthForm({ title: '대운 · 생년월일 확인', onDone: go }); return; }
    go(E.buildChart(state.profile));
  }

  function daeunRow(x, cur) {
    return '<div class="du-tr' + (cur ? ' is-now' : '') + '">' +
      '<span class="du-age"><b>' + x.ageFrom + '~' + x.ageTo + '</b><i>' + x.startLabel + '</i></span>' +
      '<span class="du-gz"><b class="' + ELCLS[x.stemEl] + '">' + E.STEMS[x.stem] + '</b><b class="' + ELCLS[x.branchEl] + '">' + E.BRANCHES[x.branch] + '</b></span>' +
      '<span class="du-god">' + x.stemGod + '<i>' + x.branchGod + '</i></span>' +
      '<span class="du-st">' + x.stage + '</span>' +
      '<span class="du-bar"><i style="width:' + x.score + '%"></i><em>' + x.score + '</em></span></div>';
  }

  function daeunHTML(c, d) {
    const dm = c.dayMaster;
    const head = '<div class="du-top">' +
      '<div><b>' + esc(c.input.name || '나의') + ' 대운</b><span>' + c.ganji + ' · ' + dm.hanja + '(' + dm.ko + dm.elem + ') 일간 · ' + esc(c.strengthKo) + '</span></div>' +
      '<em>' + d.dirText + ' · 대운수 ' + d.su.text + '</em></div>' +
      pdfBarHTML() +
      '<p class="rp-voice">' + esc(d.open) + '</p>';

    const free = '<div class="y27-free"><span class="y27-free-kicker">무료 맛보기 · 10년마다 바뀌는 큰 물길</span>' +
      '<div class="du-table">' +
      '<div class="du-tr th"><span>나이</span><span>간지</span><span>십성</span><span>운성</span><span>흐름</span></div>' +
      d.list.map(x => daeunRow(x, d.current && d.current.no === x.no)).join('') + '</div>' +
      '<p class="rp-note" style="margin-top:6px">나이는 세는나이 · 시작은 그 대운이 열린 해와 달 · 십성 큰 글씨는 대운 천간, 작은 글씨는 대운 지지 · 흐름 100점 만점</p>' +
      '<div class="du-high">' + d.golden.map((g, gi) => '<div class="du-hi"><span>' + (gi === 0 ? '인생 전성기' : '두 번째 전성기') + '</span><b>' + g.ageFrom + '~' + g.ageTo + '세 · ' + g.hanja + '</b><i>' + g.yearFrom + '~' + g.yearTo + '년</i><p>' + esc(d.say(g).key) + ' — ' + esc(d.say(g).flow) + '</p></div>').join('') + '</div>' +
      '<div class="du-low"><span>조심해서 넘길 10년</span><b>' + d.caution.ageFrom + '~' + d.caution.ageTo + '세 · ' + d.caution.hanja + '</b><i>' + d.caution.stemGod + ' 대운 · ' + d.caution.stage + '</i><p>' + esc(d.say(d.caution).life) + '</p></div>' +
      '<p class="rp-para" style="margin-top:10px">' + esc(d.goldenNote) + '</p></div>';

    const body =
      '<div class="rp-title"><span>지금 내 대운</span></div>' +
      (d.current
        ? '<div class="du-now"><b>' + d.current.ageFrom + '~' + d.current.ageTo + '세 · ' + d.current.hanja + ' ' + d.current.ko + '</b><span>' + d.current.stemGod + ' · ' + d.current.branchGod + ' · ' + d.current.stage + ' · ' + d.current.yearFrom + '~' + d.current.yearTo + '년</span><p>' + esc(d.say(d.current).flow) + '</p><p>' + esc(d.say(d.current).money) + '</p><p>' + esc(d.say(d.current).work) + '</p></div>'
        : '<div class="rp-caution">첫 대운이 열리기 전입니다. 이 시기는 내 사주보다 부모와 환경의 그릇이 먼저 작동합니다. 아래 표에서 첫 대운이 열리는 해를 보세요.</div>') +
      '<div class="rp-title"><span>10년마다의 재물 · 커리어 · 인생 전략</span></div>' +
      d.list.map(x => {
        const s = d.say(x);
        return '<div class="du-card' + (d.current && d.current.no === x.no ? ' is-now' : '') + '">' +
          '<div class="du-card-head"><b>' + x.ageFrom + '~' + x.ageTo + '세</b><span>' + x.hanja + ' ' + x.ko + ' · ' + x.yearFrom + '~' + x.yearTo + '</span><em>' + s.key + '</em></div>' +
          '<p>' + esc(s.flow) + '</p>' +
          '<p><strong>재물</strong> ' + esc(s.money) + '</p>' +
          '<p><strong>커리어</strong> ' + esc(s.work) + '</p>' +
          '<p><strong>사는 법</strong> ' + esc(s.life) + '</p></div>';
      }).join('') +
      '<div class="rp-title"><span>대운을 쓰는 순서</span></div>' +
      '<ul class="rp-list advice"><li>대운이 바뀌는 해에는 새 일을 벌이지 말고, 그 전 1년에 정리와 준비를 끝내 두세요.</li>' +
      '<li>힘이 실리는 대운에는 벌이고, 눌리는 대운에는 지키세요. 사주는 이 순서만 지켜도 크게 다칩니다.</li>' +
      '<li>대운은 10년이지만 실제 변화는 그 안의 세운(해)에서 옵니다. 좋은 대운이라도 해가 나쁘면 그해는 조심하세요.</li></ul>';

    return head + free +
      payWrapHTML({ kind: 'daeun', price: 24900, list: 49000, label: '10년 대운 전체 풀이 열기', desc: '대운 8개의 재물·커리어·인생 전략 · 지금 대운의 의미 · 대운을 쓰는 순서', inner: body }) +
      '<div class="rp-actions"><button class="btn-ghost" id="duClose">닫기</button><button class="btn-ghost" id="duAgain">내 정보 수정</button><button class="btn-ghost" data-pdf hidden>📄 PDF 저장</button><button class="btn-gold" id="duSave">보관함 저장</button></div>' +
      '<div class="rp-note">' + esc(D.REPORT.solarNote) + ' · 대운수는 출생 시각에서 절입까지의 날수를 3일=1년으로 셈했습니다.<br />' + esc(D.BRAND.footer) + '</div>';
  }

  function daeunSheet(chart) {
    const c = ensureChart(chart);
    const d = P.buildDaeun(c);
    openSheet('10년 대운 · ' + (c.input.name || '나의') + ' 인생 흐름', daeunHTML(c, d));
    bindPay($('#sheetBody'), 'daeun');
    bindPdf($('#sheetBody'));
    const cl = $('#duClose'); if (cl) cl.addEventListener('click', closeSheet);
    const ag = $('#duAgain'); if (ag) ag.addEventListener('click', () => { closeSheet(); openBirthForm({ title: '내 정보 수정' }); });
    const sv = $('#duSave');
    if (sv) sv.addEventListener('click', () => {
      saveHistory({
        kind: 'daeun', typeLabel: '10년 대운', charId: 'cheongwol', category: 'fate',
        title: '10년 대운 · ' + (c.input.name || '나'), question: '', chart: c.input,
        dateLabel: (new Date().getMonth() + 1) + '월 ' + new Date().getDate() + '일',
        summary: d.dirText + ' · 대운수 ' + d.su.text + ' · 전성기 ' + d.golden.map(g => g.ageFrom + '세').join('·')
      });
      showToast(D.REPORT.savedToast);
      sv.disabled = true; sv.textContent = '보관함에 저장됨';
    });
  }

  /* ---- 2027 길일 ---- */
  function openGilil(chart) {
    const go = c => gililSheet(c);
    if (chart) { go(chart); return; }
    if (!state.profile) { openBirthForm({ title: '2027 길일 · 생년월일 확인', onDone: go }); return; }
    go(E.buildChart(state.profile));
  }

  function glWhy(day, chart, key) {
    const out = [];
    day.tags.forEach(t => {
      if (t === '용신일') out.push('내게 필요한 ' + chart.yongsin.elem + ' 기운이 지지로 들어오는 날 — 몸과 판단이 가볍습니다.');
      else if (t === '희신일') out.push('내 편에 서 주는 ' + chart.yongsin.hee + ' 기운이 들어오는 날입니다.');
      else if (WHY[t]) out.push(WHY[t]);
      else if (t.indexOf('지지 ') === 0 && WHY[t.slice(3)]) out.push('지지가 ' + WHY[t.slice(3)]);
    });
    if (!out.length) out.push('내 일간·일지와 크게 부딪히지 않는 날입니다. 무리만 하지 않으면 됩니다.');
    return out.slice(0, 3);
  }

  function glPickCard(day, key, chart, idx, compact) {
    const label = { contract: '계약·매매', job: '이직·면접', move: '이사·개업' }[key];
    const tips = P.TIPS[key];
    const why = glWhy(day, chart, key);
    return '<div class="gl-pick' + (compact ? ' is-mini' : '') + '"><div class="gl-pick-head"><b>' + day.m + '월 ' + day.d + '일 <small>(' + day.weekday + ')</small></b>' +
      '<span>' + day.hanja + '(' + day.ko + ') · ' + day.jikKo + '일</span><em>' + label + ' ' + day[key] + '점</em></div>' +
      '<ul class="gl-why">' + why.slice(0, compact ? 2 : 3).map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>' +
      (compact ? '' : '<p class="gl-tip">' + esc(tips[idx % tips.length]) + '</p>') + '</div>';
  }

  function glMonthCards(g) {
    return '<div class="gl-months">' + g.monthStat.map(mo => {
      const good = mo.days.filter(d => Math.max(d.contract, d.job, d.move) >= 64)
        .sort((a, b) => Math.max(b.contract, b.job, b.move) - Math.max(a.contract, a.job, a.move)).slice(0, 4)
        .sort((a, b) => a.d - b.d);
      const risk = mo.days.filter(d => d.risk >= 7).sort((a, b) => b.risk - a.risk).slice(0, 2).sort((a, b) => a.d - b.d);
      return '<div class="gl-month' + (good.length ? ' has' : '') + '"><b>' + mo.m + '월</b>' +
        '<div class="gl-days">' + (good.length ? good.map(d => '<i>' + d.d + '</i>').join('') : '<i class="none">–</i>') + '</div>' +
        (risk.length ? '<span class="gl-risk">피할 날 ' + risk.map(d => d.d + '일').join(' · ') + '</span>' : '<span class="gl-risk none">피할 날 없음</span>') +
        '</div>';
    }).join('') + '</div>';
  }

  function gililHTML(c, g) {
    const dm = c.dayMaster;
    const head = '<div class="du-top">' +
      '<div><b>2027 정미년 · 나만의 길일</b><span>' + dm.hanja + '(' + dm.ko + dm.elem + ') 일간 · 일지 ' + c.pillars.day.hanja + '(' + c.pillars.day.animal + ') · 용신 ' + c.yongsin.elem + '</span></div>' +
      '<em>계약 · 이직 · 이사</em></div>' +
      pdfBarHTML() +
      '<p class="rp-voice">' + esc(g.open) + '</p>';

    const free = '<div class="y27-free"><span class="y27-free-kicker">무료 맛보기 · 12개월 길일 달력</span>' +
      glMonthCards(g) +
      '<p class="rp-note" style="margin-top:8px">금색 숫자는 계약·이직·이사 중 하나라도 힘이 실리는 날입니다. 아래 심층 풀이에서 목적별 날짜와 이유를 하나씩 짚습니다.</p>' +
      '<div class="gl-first">' + ['contract', 'job', 'move'].map(k => g.picks[k][0] ? glPickCard(g.picks[k][0], k, c, 0, true) : '').join('') + '</div>' +
      '</div>';

    const purposeBlock = (key, title, desc) => '<div class="rp-title"><span>' + title + '</span></div>' +
      '<p class="rp-para">' + desc + '</p>' +
      g.picks[key].map((d, i) => glPickCard(d, key, c, i)).join('');

    const body =
      purposeBlock('contract', '① 계약 · 매매', '도장을 찍는 날은 서류의 운이 아니라 사람의 운을 봅니다. 아래 날들은 내 일지와 맺어지고, 정재·천을이 함께 오는 날입니다.') +
      purposeBlock('job', '② 이직 · 면접', '면접과 지원은 정관(正官)이 서는 날에 이름이 오릅니다. 상관이 관을 보는 날은 말이 앞서니 비켜 두세요.') +
      purposeBlock('move', '③ 이사 · 개업', '이사는 내 자리가 옮겨지는 일이라 일지와 부딪히는 날을 가장 조심합니다. 문을 여는 날은 식신·재성이 함께 오는 날이 좋습니다.') +
      '<div class="rp-title"><span>2027년에 피할 날</span></div>' +
      '<div class="gl-avoid-wrap">' + g.avoid.map(d => '<div class="gl-avoid"><b>' + d.m + '월 ' + d.d + '일 (' + d.weekday + ') ' + d.hanja + '</b><span>' + d.bad.map(b => BADWHY[b] || b).join(' ') + '</span></div>').join('') + '</div>' +
      '<div class="rp-title"><span>달마다의 길일과 피할 날</span></div>' + glMonthCards(g) +
      '<div class="rp-title"><span>도장 찍을 때의 팁</span></div>' +
      '<ul class="rp-list advice">' + P.TIPS.contract.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<div class="rp-caution">길일은 “이 날이면 무조건 된다”는 뜻이 아닙니다. 같은 계약이라도 준비가 덜 된 날은 그 날의 기운을 쓰지 못합니다. 서류와 조건을 먼저 끝내 두고, 그 위에 날을 얹으세요.</div>';

    return head + free +
      payWrapHTML({ kind: 'gilil', price: 14900, list: 29000, label: '2027 길일 전체 열기', desc: '목적별 추천일과 이유 · 피할 날 · 달마다의 길일 · 도장 찍을 때의 팁', inner: body }) +
      '<div class="rp-actions"><button class="btn-ghost" id="glClose">닫기</button><button class="btn-ghost" id="glAgain">내 정보 수정</button><button class="btn-ghost" data-pdf hidden>📄 PDF 저장</button><button class="btn-gold" id="glSave">보관함 저장</button></div>' +
      '<div class="rp-note">' + esc(D.REPORT.solarNote) + ' · 2027년 일진은 60갑자 순환으로 계산했습니다.<br />' + esc(D.BRAND.footer) + '</div>';
  }

  function gililSheet(chart) {
    const c = ensureChart(chart);
    const g = P.buildGilil(c, 2027);
    openSheet('2027 길일 · 계약·이직·이사', gililHTML(c, g));
    bindPay($('#sheetBody'), 'gilil');
    bindPdf($('#sheetBody'));
    const cl = $('#glClose'); if (cl) cl.addEventListener('click', closeSheet);
    const ag = $('#glAgain'); if (ag) ag.addEventListener('click', () => { closeSheet(); openBirthForm({ title: '내 정보 수정' }); });
    const sv = $('#glSave');
    if (sv) sv.addEventListener('click', () => {
      saveHistory({
        kind: 'gilil', typeLabel: '2027 길일', charId: 'baekho', category: 'work',
        title: '2027 계약·이직·이사 길일', question: '', chart: c.input,
        dateLabel: (new Date().getMonth() + 1) + '월 ' + new Date().getDate() + '일',
        summary: '계약 ' + (g.picks.contract[0] ? (g.picks.contract[0].m + '월 ' + g.picks.contract[0].d + '일') : '–') + ' · 이직 ' + (g.picks.job[0] ? (g.picks.job[0].m + '월 ' + g.picks.job[0].d + '일') : '–') + ' · 이사 ' + (g.picks.move[0] ? (g.picks.move[0].m + '월 ' + g.picks.move[0].d + '일') : '–')
      });
      showToast(D.REPORT.savedToast);
      sv.disabled = true; sv.textContent = '보관함에 저장됨';
    });
  }

  /* ---------------- 시작 ---------------- */
  function init() {
    const B = D.BRAND;
    $$('[data-brand]').forEach(n => n.textContent = B.name);
    $$('[data-brand-hanja]').forEach(n => n.textContent = B.hanja);
    document.title = B.name + ' · ' + B.tagline;
    $('#footLine').textContent = B.tagline + ' — ' + B.intro;
    $('#footNote').textContent = '© ' + new Date().getFullYear() + ' ' + B.name + ' ' + B.version + ' · ' + B.footer;

    renderHero(); renderTopics(); renderY2027(); renderPlus(); renderHomeChips(); renderRanking(); renderMasters(); renderTodayWidget(); renderFreeGrid();
    renderAskChars(); bindMisc();
    if (E.selfTest) {
      const bad = E.selfTest().filter(l => l.startsWith('FAIL'));
      if (bad.length) console.warn('[월하사주] 엔진 검증 실패:\n' + bad.join('\n'));
    }
  }

  init();
})();
