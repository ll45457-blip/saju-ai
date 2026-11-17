/* ============================================================
   월하사주 · app.js  (의존: data.js, saju-engine.js)
   ============================================================ */
(function () {
  'use strict';

  const D = window.SAJU_DATA, E = window.SajuEngine;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const won = n => n.toLocaleString('ko-KR');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => (n < 10 ? '0' + n : '' + n);

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const K_PROFILE = 'wolha_profile_v1';
  const K_HISTORY = 'wolha_history_v1';

  const state = {
    view: 'home',
    profile: store.get(K_PROFILE, null),
    history: store.get(K_HISTORY, []),
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
      '<span class="topic-glyph">' + t.hanja + '</span>' +
      '<span class="topic-label">' + esc(t.label) + '</span>' +
      '</button>'
    )).join('');
    $('#topicGrid').addEventListener('click', e => {
      const b = e.target.closest('.topic'); if (!b) return;
      const t = D.TOPICS.find(x => x.id === b.dataset.topic);
      if (t.id === 'today') { showView('today'); return; }
      if (t.id === 'free') { showView('home'); $('#freeGrid').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
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
      return '<li class="rank-item" data-q="' + esc(r.q) + '" data-cat="' + r.cat + '" data-char="' + c.id + '">' +
        '<span class="rank-no">' + (i + 1) + '</span>' +
        '<img class="rank-avatar" src="' + c.img + '" alt="" loading="lazy" />' +
        '<span class="rank-main"><span class="rank-q">' + esc(r.q) + '</span>' +
        '<span class="rank-meta"><b>' + won(r.count) + '명이 확인</b><span class="rank-trend">' + r.trend + '</span></span></span>' +
        '</li>';
    }).join('');
    $('#rankingList').addEventListener('click', e => {
      const li = e.target.closest('.rank-item'); if (!li) return;
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
      '<div class="th-term">절기 ' + esc(t.termName) + (t.termStart ? ' · ' + esc(t.termName) + ' ' + E.formatTermTime(t.termStart) : '') + ' · 태양 황경 ' + t.termLong + '°</div>' +
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
      '<div class="block"><div class="rp-title"><span>오늘 조심할 점</span></div><div class="rp-caution">' + esc(godC.avoid) + ' — 특히 ' + esc(godC.head) + '라는 흐름 안에서는 이것이 하루의 기운을 새게 합니다.</div></div>' +
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
        '<div class="th-term">절기 ' + esc(t.termName) + ' · 태양 황경 ' + t.termLong + '°</div></div>' +
        '<div class="arch-empty" style="margin-top:16px">생년월일을 등록하면<br /><b>오늘의 일진이 내 사주와 만나는 자리</b>까지 계산해 드려요.<br /><button class="btn-gold" id="todayGoProfile">생년월일 입력하기</button></div>';
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
      '<div class="rp-id"><b>' + esc(p.name || '익명의 발견자') + '</b><span>' + (p.gender === 'female' ? '여성' : '남성') + ' · ' + p.year + '.' + pad(p.month) + '.' + pad(p.day) + (p.hasTime ? ' ' + pad(p.hour) + ':' + pad(p.minute || 0) : ' · 시간 모름') + '</span></div>' +
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
    let hourOpts = '<option value="">태어난 시간 모름</option>' + SIZI.map(s => '<option value="' + s.v + '">' + s.l + '</option>').join('');
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
        $('#bfNote').textContent = '계산 중 문제가 생겼어요: ' + err.message; $('#bfNote').classList.add('warn'); return;
      }
      if ($('#bfRemember').checked) {
        state.profile = input; store.set(K_PROFILE, input);
        renderTodayWidget(); renderAskProfile();
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

  /* ---------------- 리포트 생성 ---------------- */
  function openReportSheet(o) {
    const c = charById(o.charId);
    const chart = o.chart;
    const today = o.reading ? o.reading.today : null;
    const html = reportHTML({ chart: chart, char: c, question: o.question, category: o.category, today: today, typeLabel: o.typeLabel });

    openSheet(c.name + '의 리포트', html, null);

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

    /* 사주팔자 표 */
    const pillars = chart.pillars;
    const noTime = !pillars.hour;
    const pl = (label, p, day, god) => {
      if (!p) return '<div class="pl" style="opacity:.35"><span class="pl-label">' + label + '</span><div class="hz">·</div><span class="ko">시간 모름</span></div>';
      return '<div class="pl' + (day ? ' is-day' : '') + '"><span class="pl-label">' + label + '</span>' +
        '<div class="hz">' + p.stemName + '<br />' + p.branchName + '</div>' +
        '<span class="ko">' + p.stemKo + p.branchKo + '</span>' +
        '<div class="el">' + p.stemElem + '·' + p.branchElem + ' / ' + p.animal + '</div>' +
        (god ? '<div class="god">' + god + '</div>' : '') + '</div>';
    };
    const pillarsHTML = '<div class="pillars' + (noTime ? ' no-time' : '') + '">' +
      pl('년주', pillars.year, false, chart.gods.yearStem) +
      pl('월주', pillars.month, false, chart.gods.monthStem) +
      pl('일주', pillars.day, true, '일간') +
      pl('시주', pillars.hour, false, chart.gods.hourStem) +
      '</div>' +
      '<div class="rp-id" style="margin-top:9px"><span>' + chart.ganji + '</span><span>' + chart.ganjiKo + '</span>' +
      (noTime ? '<span class="pill">시간 미입력 · 3주 계산</span>' : '') + '</div>';

    /* 오행 차트 */
    const totalW = ELEMENTS_TOTAL(chart);
    const elemHTML = '<div class="elem-chart">' + E.ELEMENTS.map(el => {
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

    /* 타고난 결 */
    const natureHTML = '<p class="rp-lead"><span class="em">' + esc(dm.key) + ' · ' + esc(dm.name) + '</span>의 사주입니다.</p>' +
      '<p class="rp-para">' + esc(dm.text) + '</p>' +
      '<p class="rp-para"><strong>' + esc(group.name) + '이 강한 구조</strong> — ' + esc(group.trait) + '</p>' +
      '<p class="rp-para">' + esc(C.strength[chart.strength]) + ' ' + esc(chart.yongsin.reason) + '. 그래서 <strong>' + chart.yongsin.elem + '(' + E.ELEMENTS_HANJA[E.ELEMENTS.indexOf(chart.yongsin.elem)] + ')</strong> 오행이 도움이 되며, ' + esc(chart.yongsin.care) + '</p>';

    /* 질문 답 */
    const coreHTML = '<p class="rp-lead">' + esc(catCopy.reflect) + '</p>' +
      '<p class="rp-para"><strong>' + esc(c.name) + '의 읽기</strong> — ' + esc(catCopy.via[dominantGodGroup(chart)]) + '</p>' +
      '<p class="rp-para">' + esc(c.categoryLine[cat] || c.categoryLine.fate) + '</p>';

    /* 시기 */
    const timingHTML = '<ul class="rp-list">' + catCopy.timing.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>';

    /* 지금 할 일 */
    const adviceHTML = '<ul class="rp-list advice">' + catCopy.advice.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>';

    /* 조심 */
    const cautionHTML = '<div class="rp-caution">' + esc(catCopy.caution) + '</div>' +
      (reading ? '<div class="rp-caution" style="margin-top:8px">오늘은 <b>' + reading.god + '의 날</b> — ' + esc(todayGod.head) + '. ' + esc(reading.note) + '</div>' : '');

    /* 행운 */
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

    return '' +
      '<div class="rp-top"><img class="rp-ava" src="' + c.img + '" alt="' + esc(c.name) + '" />' +
      '<div class="rp-who"><b>' + esc(c.name) + ' <small style="font-size:9px;letter-spacing:.2em;color:var(--ink-3)">' + esc(c.hanja) + '</small></b>' +
      '<span>' + esc(c.role) + ' · ' + chart.dayMaster.hanja + chart.dayMaster.elem + ' ' + chart.strengthKo + '</span></div>' +
      '<span class="rp-stamp">' + esc(D.BRAND.name) + ' 정통 蟠</span></div>' +

      (o.question ? '<div class="rp-question"><b>질문</b>' + esc(o.question) + '</div>' : '') +

      '<div class="rp-title"><span>1. 사주팔자</span></div>' + pillarsHTML +
      '<div class="rp-title"><span>2. 오행 분포</span></div>' + elemHTML +
      '<div class="rp-title"><span>3. 십신 분포</span></div>' + godHTML +
      '<div class="rp-title"><span>4. 타고난 결</span></div>' + natureHTML +
      '<div class="rp-title"><span>5. 질문에 대한 답</span></div>' + coreHTML +
      '<div class="rp-title"><span>6. 시기와 흐름</span></div>' + timingHTML +
      '<div class="rp-title"><span>7. 지금 할 일</span></div>' + adviceHTML +
      '<div class="rp-title"><span>8. 조심할 점</span></div>' + cautionHTML +
      '<div class="rp-title"><span>9. 행운 포인트</span></div>' + luckyHTML +

      '<div class="rp-actions"><button class="btn-ghost" id="rpClose">닫기</button><button class="btn-gold" id="rpSave">보관함 저장</button></div>' +
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
      return '<button class="free-card" data-key="' + f.key + '" data-cat="' + f.cat + '" data-char="' + c.id + '">' +
        '<span class="free-glyph">' + f.hanja + '</span>' +
        '<span class="free-name">' + esc(f.label) + '</span>' +
        '<span class="free-desc">' + esc(f.desc) + '</span>' +
        '<span class="free-badge">무료</span></button>';
    }).join('');
    $('#freeGrid').addEventListener('click', e => {
      const b = e.target.closest('.free-card'); if (!b) return;
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
      '<button class="menu-item" data-q="' + esc(t.question) + '" data-cat="' + t.cat + '"><span class="mi-icon">' + t.hanja + '</span>' + esc(t.label) + '<span class="mi-sub">' + esc(t.desc) + '</span></button>'
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
      '<button class="menu-item" data-m="today"><span class="mi-icon">今</span>오늘의 운세<span class="mi-sub">무료</span></button>' +
      '<button class="menu-item" data-m="archive"><span class="mi-icon">庫</span>보관함<span class="mi-sub">내 사주 · 기록</span></button>' +
      '<button class="menu-item" data-m="profile"><span class="mi-icon">生</span>내 사주 등록·수정<span class="mi-sub">생년월일</span></button>' +
      c + '</div>');
    $('#sheetBody').onclick = e => {
      const m = e.target.closest('[data-m]'), ch = e.target.closest('[data-char]');
      if (m) {
        closeSheet();
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

  /* ---------------- 시작 ---------------- */
  function init() {
    const B = D.BRAND;
    $$('[data-brand]').forEach(n => n.textContent = B.name);
    $$('[data-brand-hanja]').forEach(n => n.textContent = B.hanja);
    document.title = B.name + ' · ' + B.tagline;
    $('#footLine').textContent = B.tagline + ' — ' + B.intro;
    $('#footNote').textContent = '© ' + new Date().getFullYear() + ' ' + B.name + ' ' + B.version + ' · ' + B.footer;

    renderHero(); renderTopics(); renderHomeChips(); renderRanking(); renderMasters(); renderTodayWidget(); renderFreeGrid();
    renderAskChars(); bindMisc();
    if (E.selfTest) {
      const bad = E.selfTest().filter(l => l.startsWith('FAIL'));
      if (bad.length) console.warn('[월하사주] 엔진 검증 실패:\n' + bad.join('\n'));
    }
  }

  init();
})();
