// Цаг бүртгэл as a full page in the centre, with real records (owner request 2026-11-21). Staff press
// "Би ирлээ / Би явлаа" and the server clock is stored (supabase/schema.sql: public.attendance, public.punch());
// leaders also see their branch's attendance; the general director does not punch and only watches everyone.
// It replaces the earlier presentation-only popover (manager pages) and the browser-only log (teacher page);
// leave requests keep working through their existing views.
(() => {
  const teacher = document.body.classList.contains('teacher-page');
  const host = teacher ? document.querySelector('.teacher-main') : document.querySelector('#hub-profile');
  const trigger = () => document.querySelector(teacher ? '#teacher-time-toggle' : '#attendance-toggle');
  if (!host) return;

  // ───────────── helpers
  const ZONE = 'Asia/Ulaanbaatar';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date());
  const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const weekday = d => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;
  const clock = iso => iso ? new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) : '— : —';
  const DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
  const dayTitle = d => { const [y, m, dd] = d.split('-').map(Number); return `${y} оны ${m} сарын ${dd}, ${DAYS[weekday(d)]}`; };
  const shortDay = d => `${Number(d.slice(5, 7))}/${Number(d.slice(8))} ${DAYS[weekday(d)].slice(0, 2)}`;
  const minutes = (r, d) => !r?.check_in ? 0 : Math.max(0, Math.round(((r.check_out ? Date.parse(r.check_out) : d === today() ? Date.now() : Date.parse(r.check_in)) - Date.parse(r.check_in)) / 60000));
  const hm = n => n ? `${Math.floor(n / 60)} ц ${n % 60} мин` : '—';
  const short = name => String(name || '').replace(/^Салбар\s*\d+\s*·\s*/, '').trim();
  const initials = name => short(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const ROLE = { general_director: 'Ерөнхий захирал', branch_director: 'Салбарын захирал', senior_manager: 'Ахлах менежер', manager: 'Менежер', teacher: 'Багш' };
  const range = p => { const t = today(); return p === 'day' ? [t, t] : p === 'week' ? [addDays(t, -weekday(t)), t] : [t.slice(0, 8) + '01', t]; };

  // ───────────── page
  const page = document.createElement('section');
  page.className = 'att-page'; page.hidden = true; page.setAttribute('aria-label', 'Цаг бүртгэл');
  host.append(page);
  const S = { me: null, tab: 'mine', period: 'day', teamPeriod: 'day', branch: '', mine: [], team: [], people: [], problem: '', busy: false, note: '' };
  const lvl = () => S.me?.level ?? 0;
  const LOCAL_TABS = ['leave', 'approvals']; // these views keep their own browser-local data and need no server load
  // views borrowed from the old popover; kept by reference because every render replaces the page's markup
  let leaveView = null, approvalView = null, teacherCurrent = [];

  function show() {
    if (teacher) {
      host.querySelector('#teacher-content')?.setAttribute('hidden', '');
      host.querySelector('.teacher-page-head')?.setAttribute('hidden', '');
      // the teacher menu marks its open item with aria-current="page"; remember it so closing can give it back
      if (trigger()?.getAttribute('aria-current') !== 'page') teacherCurrent = [...document.querySelectorAll('.teacher-nav [aria-current=page]')];
      teacherCurrent.forEach(b => b.removeAttribute('aria-current'));
      trigger()?.setAttribute('aria-current', 'page');
    } else {
      if (typeof workspaceSelect === 'function') workspaceSelect('profile');
      host.querySelectorAll(':scope > .ai-home, :scope > .file-home, :scope > .crm-home').forEach(x => { x.hidden = true; });
      document.querySelectorAll('.figma-menu button').forEach(b => b.setAttribute('aria-selected', String(b === trigger())));
    }
    page.hidden = false;
    load();
  }
  function hide() {
    if (page.hidden) return;
    page.hidden = true;
    if (teacher) {
      host.querySelector('#teacher-content')?.removeAttribute('hidden'); host.querySelector('.teacher-page-head')?.removeAttribute('hidden');
      trigger()?.removeAttribute('aria-current');
      teacherCurrent.forEach(b => { if (b.isConnected) b.setAttribute('aria-current', 'page'); }); teacherCurrent = [];
    } else trigger()?.setAttribute('aria-selected', 'false');
  }
  // the menu item opens this page instead of the old popover / dialog
  document.addEventListener('click', e => {
    const t = trigger();
    if (t && t.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); show(); return; }
    if (teacher && e.target.closest('.teacher-nav button, .teacher-brand, [data-teacher-notices], .teacher-notifications')) hide();
  }, true);
  if (!teacher && typeof workspaceSelect === 'function') {
    const previous = workspaceSelect;
    workspaceSelect = function (key) { const r = previous.apply(this, arguments); page.hidden = true; trigger()?.setAttribute('aria-selected', 'false'); return r; };
    if (typeof selectHub !== 'undefined') selectHub = workspaceSelect;
  }

  // ───────────── data
  async function load() {
    if (!window.RISE) { S.problem = 'offline'; return render(); }
    try {
      S.me = S.me || await RISE.profile();
      if (!S.me) { S.problem = 'session'; return render(); }
      if (lvl() >= 4 && S.tab === 'mine') S.tab = 'team'; else if (S.tab === 'team' && lvl() < 2) S.tab = 'mine';
      S.problem = '';
      if (S.tab === 'mine') await loadMine(); else if (S.tab === 'team') await loadTeam();
    } catch (e) { console.error(e); S.problem = 'offline'; }
    render();
  }
  async function loadMine() {
    const [from] = range('month'), start = from < addDays(today(), -weekday(today())) ? from : addDays(today(), -weekday(today()));
    const { data, error } = await RISE.sb.from('attendance').select('*').eq('user_id', S.me.id).gte('day', start).lte('day', today()).order('day', { ascending: false });
    if (error) throw error; S.mine = data || [];
  }
  async function loadTeam() {
    const [from, to] = range(S.teamPeriod);
    const [people, rows] = await Promise.all([
      RISE.sb.from('profiles').select('id,display_name,role,level,branch_id,active,hidden').eq('active', true),
      RISE.sb.from('attendance').select('*').gte('day', from).lte('day', to)
    ]);
    if (rows.error) throw rows.error;
    S.people = (people.data || []).filter(p => !p.hidden && p.id !== S.me.id && p.level < 4 && (lvl() >= 4 || (p.branch_id === S.me.branch_id && p.level < lvl())));
    S.team = rows.data || [];
  }
  async function punch(kind) {
    if (S.busy) return; S.busy = true; render();
    const { data, error } = await RISE.sb.rpc('punch', { p_kind: kind });
    S.busy = false;
    if (error) { S.note = error.message || 'Бүртгэж чадсангүй.'; render(); return; }
    S.note = kind === 'in' ? 'Ирсэн цаг бүртгэгдлээ.' : 'Явсан цаг бүртгэгдлээ.';
    S.mine = [data, ...S.mine.filter(r => r.day !== data.day)];
    if (typeof toast === 'function') toast(S.note);
    render();
  }

  // ───────────── views
  function render() {
    const tabs = [lvl() < 4 && ['mine', 'Миний цаг'], lvl() >= 2 && ['team', lvl() >= 4 ? 'Ажилтнуудын ирц' : 'Багийн ирц'], leaveAvailable() && ['leave', teacher ? 'Чөлөө, сурагчийн хүсэлт' : 'Чөлөөний хүсэлт'], approvalsAvailable() && ['approvals', 'Ирсэн хүсэлтүүд']].filter(Boolean);
    const body = S.tab === 'leave' ? '<div class="att-leave"></div>' : S.tab === 'approvals' ? '<div class="att-approvals"></div>'
      : S.problem ? problemHtml() : !S.me ? '<p class="att-empty">Ачаалж байна…</p>' : S.tab === 'team' ? teamHtml() : mineHtml();
    page.innerHTML = `<header class="att-head"><div><span class="att-eyebrow">${lvl() >= 4 || S.tab === 'team' || S.tab === 'approvals' ? 'ИРЦИЙН ХЯНАЛТ' : 'МИНИЙ АЖЛЫН ЦАГ'}</span><h1>Цаг бүртгэл</h1><p>${esc(dayTitle(today()))}</p></div>
      ${tabs.length > 1 ? `<div class="att-pills" role="group" aria-label="Цаг бүртгэлийн хэсэг">${tabs.map(([k, t]) => `<button type="button" data-tab="${k}" aria-pressed="${S.tab === k}">${t}</button>`).join('')}</div>` : ''}</header>
      <div class="att-body">${body}</div>`;
    page.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; S.note = ''; if (LOCAL_TABS.includes(S.tab)) render(); else load(); });
    page.querySelector('[data-act=retry]')?.addEventListener('click', load);
    page.querySelector('[data-act=signin]')?.addEventListener('click', () => { try { localStorage.removeItem('rise-auth'); ['rise-demo-name', 'rise-demo-level', 'rise-demo-new-login'].forEach(k => sessionStorage.removeItem(k)); } catch {} location.href = 'staff.html'; });
    page.querySelectorAll('[data-punch]').forEach(b => b.onclick = () => punch(b.dataset.punch));
    page.querySelectorAll('[data-period]').forEach(b => b.onclick = () => { S.period = b.dataset.period; render(); });
    page.querySelectorAll('[data-team-period]').forEach(b => b.onclick = () => { S.teamPeriod = b.dataset.teamPeriod; load(); });
    const br = page.querySelector('[data-branch]'); if (br) br.onchange = () => { S.branch = br.value; render(); };
    page.querySelector('[data-act=refresh]')?.addEventListener('click', load);
    if (S.tab === 'leave') mountLeave(page.querySelector('.att-leave'));
    if (S.tab === 'approvals') mountApprovals(page.querySelector('.att-approvals'));
  }
  const problemHtml = () => S.problem === 'session'
    ? '<div class="att-empty"><strong>Нэвтрэх хугацаа дууссан</strong><span>Цаг бүртгүүлэхийн тулд дахин нэвтэрнэ үү.</span><button type="button" class="att-btn dark" data-act="signin">Дахин нэвтрэх</button></div>'
    : '<div class="att-empty"><strong>Мэдээллийг ачаалж чадсангүй</strong><span>Интернэт холболтоо шалгаад дахин оролдоно уу.</span><button type="button" class="att-btn" data-act="retry">Дахин оролдох</button></div>';

  function mineHtml() {
    const t = today(), row = S.mine.find(r => r.day === t), [from] = range(S.period), rows = S.mine.filter(r => r.day >= from);
    const total = rows.reduce((n, r) => n + minutes(r, r.day), 0), days = rows.filter(r => r.check_in).length;
    const status = !row ? 'Өнөөдөр ирц бүртгүүлээгүй байна.' : !row.check_out ? `Ажил дээр · ${hm(minutes(row, t))}` : `Өнөөдөр ${hm(minutes(row, t))} ажилласан.`;
    return `<section class="att-card att-today">
        <div class="att-clock"><div><span>Ирсэн цаг</span><strong>${clock(row?.check_in)}</strong></div><div><span>Явсан цаг</span><strong>${clock(row?.check_out)}</strong></div></div>
        <p class="att-status">${esc(S.note || status)}</p>
        <div class="att-actions"><button type="button" class="att-btn dark" data-punch="in" ${row?.check_in || S.busy ? 'disabled' : ''}>Би ирлээ</button><button type="button" class="att-btn" data-punch="out" ${!row?.check_in || S.busy ? 'disabled' : ''}>Би явлаа</button></div>
      </section>
      <div class="att-row"><div class="att-pills" role="group" aria-label="Хугацаа">${[['day', 'Өнөөдөр'], ['week', '7 хоног'], ['month', 'Энэ сар']].map(([k, t]) => `<button type="button" data-period="${k}" aria-pressed="${S.period === k}">${t}</button>`).join('')}</div></div>
      <div class="att-kpis"><article><span>Нийт ажилласан</span><strong>${hm(total)}</strong></article><article><span>Ирсэн өдөр</span><strong>${days} өдөр</strong></article></div>
      <section class="att-card"><div class="att-table" role="table" aria-label="Цагийн бүртгэл"><div class="att-tr att-th" role="row"><span>Огноо</span><span>Ирсэн</span><span>Явсан</span><span>Нийт</span></div>
        ${rows.length ? rows.map(r => `<div class="att-tr" role="row"><span>${esc(shortDay(r.day))}</span><span>${clock(r.check_in)}</span><span>${r.check_out ? clock(r.check_out) : r.day === t ? 'Ажил дээр' : 'Бүртгээгүй'}</span><span>${hm(minutes(r, r.day))}</span></div>`).join('') : '<p class="att-empty">Энэ хугацаанд бүртгэл алга.</p>'}</div></section>`;
  }

  function teamHtml() {
    const t = today(), gd = lvl() >= 4, period = S.teamPeriod;
    const people = S.people.filter(p => !S.branch || String(p.branch_id) === S.branch)
      .sort((a, b) => (a.branch_id || 0) - (b.branch_id || 0) || b.level - a.level || String(a.display_name).localeCompare(String(b.display_name), 'mn'));
    const rowsOf = id => S.team.filter(r => r.user_id === id), todayOf = id => S.team.find(r => r.user_id === id && r.day === t);
    const here = people.filter(p => todayOf(p.id)?.check_in && !todayOf(p.id)?.check_out).length, left = people.filter(p => todayOf(p.id)?.check_out).length, absent = people.length - here - left;
    const state = r => !r?.check_in ? '<span class="att-tag">Ирээгүй</span>' : !r.check_out ? '<span class="att-tag on">Ажил дээр</span>' : '<span class="att-tag off">Явсан</span>';
    const head = period === 'day' ? '<span>Ажилтан</span><span>Ирсэн</span><span>Явсан</span><span>Төлөв</span>' : '<span>Ажилтан</span><span>Ирсэн өдөр</span><span>Нийт цаг</span><span>Өнөөдөр</span>';
    const line = p => { const rs = rowsOf(p.id), now = todayOf(p.id); const who = `<span class="att-who"><i>${esc(initials(p.display_name))}</i><span><strong>${esc(short(p.display_name))}</strong><small>${esc(ROLE[p.role] || '')}${gd && p.branch_id ? ' · Салбар ' + p.branch_id : ''}</small></span></span>`;
      return period === 'day' ? `<div class="att-tr" role="row">${who}<span>${clock(now?.check_in)}</span><span>${clock(now?.check_out)}</span><span>${state(now)}</span></div>`
        : `<div class="att-tr" role="row">${who}<span>${rs.filter(r => r.check_in).length} өдөр</span><span>${hm(rs.reduce((n, r) => n + minutes(r, r.day), 0))}</span><span>${state(now)}</span></div>`; };
    return `<div class="att-row"><div class="att-pills" role="group" aria-label="Хугацаа">${[['day', 'Өнөөдөр'], ['week', '7 хоног'], ['month', 'Энэ сар']].map(([k, x]) => `<button type="button" data-team-period="${k}" aria-pressed="${period === k}">${x}</button>`).join('')}</div>
        <span class="att-grow"></span>${gd ? `<select data-branch aria-label="Салбар"><option value="">Бүх салбар</option>${[...new Set(S.people.map(p => p.branch_id).filter(Boolean))].sort((a, b) => a - b).map(b => `<option value="${b}" ${S.branch === String(b) ? 'selected' : ''}>Салбар ${b}</option>`).join('')}</select>` : ''}
        <button type="button" class="att-btn small" data-act="refresh">Шинэчлэх</button></div>
      <div class="att-kpis three"><article><span>Ажил дээр</span><strong>${here}</strong></article><article><span>Явсан</span><strong>${left}</strong></article><article><span>Ирээгүй</span><strong>${absent}</strong></article></div>
      <section class="att-card"><div class="att-table team" role="table" aria-label="Ажилтнуудын ирц"><div class="att-tr att-th" role="row">${head}</div>
        ${people.length ? people.map(line).join('') : '<p class="att-empty">Ажилтан олдсонгүй.</p>'}</div></section>`;
  }

  // leave requests: the manager pages keep their existing views (own requests; directors also decide incoming ones),
  // the teacher page its existing dialog. They stay the browser-local workflow of manager-leave-store.js.
  function leaveAvailable() { return teacher ? !!trigger() : !!(leaveView || document.querySelector('#attendance-leave-view')); }
  function approvalsAvailable() { return !teacher && !!(approvalView || document.querySelector('#attendance-popover .attendance-approval-view')); }
  function mountApprovals(box) {
    approvalView = approvalView || document.querySelector('#attendance-popover .attendance-approval-view');
    const open = document.querySelector('#attendance-popover .attendance-mode-tabs [data-mode=approvals]');
    if (!box || !approvalView) return;
    box.append(approvalView);
    if (open?.onclick) open.onclick(); else approvalView.hidden = false; // draws the queue (manager-director-views.js)
  }
  function mountLeave(box) {
    if (!box) return;
    if (!teacher) { leaveView = leaveView || document.querySelector('#attendance-leave-view'); if (!leaveView) return; leaveView.hidden = false; box.append(leaveView); return; }
    box.innerHTML = '<div class="att-empty"><strong>Чөлөө ба сурагчийн хүсэлт</strong><span>Өөрийн чөлөө хүсэх, сурагчдын хүсэлтийг шийдвэрлэх цонхыг нээнэ.</span><div class="att-actions"><button type="button" class="att-btn dark" data-old="leave">Чөлөө хүсэх</button><button type="button" class="att-btn" data-old="students">Сурагчийн хүсэлт</button></div></div>';
    box.querySelectorAll('[data-old]').forEach(b => b.onclick = () => { const t = trigger(); t?.onclick?.(); requestAnimationFrame(() => document.querySelector(`[data-support-tab="${b.dataset.old}"]`)?.click()); });
  }

  // the old popover stays closed for good on manager pages
  if (!teacher) document.querySelector('#attendance-popover')?.addEventListener('beforetoggle', e => { if (e.newState === 'open') e.preventDefault(); });
})();
