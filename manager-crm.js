// Харилцагч (CRM) inside the staff dashboards. It opens like Файлууд: a menu button that shows a page in the workspace.
// Managers work their own and unassigned leads; leaders (ахлах менежер, салбарын захирал, ерөнхий захирал) also assign
// leads and see the website and Facebook figures. Data lives in Supabase (supabase/schema.sql: leads, lead_events,
// crm_stats) behind row level security — this page only mirrors those rules. Website registrations arrive here already
// assigned to the manager the visitor chose, or unassigned in the chosen branch (source "Вэб сайт").
// Views (owner request 2026-11-22: more sections, more ways to look at the same leads, charts and analysis):
//   Жагсаалт — cards · Хүснэгт — sortable table · Самбар — pipeline board, drag a card to change its status ·
//   Шинжилгээ — figures and charts computed from the leads this account may see · Маркетинг (leaders) — website and
//   Facebook figures from crm_stats. Every number comes from the real rows; nothing is sample data.
(() => {
  const menu = document.querySelector('.figma-menu'), hub = document.querySelector('#hub-profile');
  if (!menu || !hub) return;

  // ───────────── helpers
  const ZONE = 'Asia/Ulaanbaatar';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date());
  const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
  const dayOf = iso => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date(iso));
  const clock = iso => new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const fmtDay = d => { const t = today(); if (d === t) return 'Өнөөдөр'; if (d === addDays(t, -1)) return 'Өчигдөр'; const [y, m, dd] = d.split('-').map(Number); return `${m} сарын ${dd}` + (y !== Number(t.slice(0, 4)) ? `, ${y}` : ''); };
  const md = d => { const [, m, dd] = d.split('-').map(Number); return m + '/' + dd; };
  const when = iso => { const d = dayOf(iso); return d === today() ? 'Өнөөдөр ' + clock(iso) : fmtDay(d); };
  const stamp = iso => fmtDay(dayOf(iso)) + ' ' + clock(iso);
  const money = n => new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0)) + '₮';
  const compactMoney = n => { const v = Math.round(Number(n) || 0); return v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M₮' : v >= 1e4 ? Math.round(v / 1e3) + 'K₮' : money(v); };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const short = name => String(name || '').replace(/^Салбар\s*\d+\s*·\s*/, '').trim();
  const initials = name => short(name).split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const say = text => { if (typeof toast === 'function') toast(text); };
  const median = list => { if (!list.length) return null; const s = [...list].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const hoursText = h => h == null ? '—' : h < 1 ? Math.max(1, Math.round(h * 60)) + ' мин' : h < 48 ? (Math.round(h * 10) / 10) + ' цаг' : Math.round(h / 24) + ' хоног';

  const COURSES = ['Экскаватор оператор', 'Дамп оператор', 'Ковш оператор', 'Маникюр', 'Сормуус'];
  const SOURCES = { facebook: 'Facebook', messenger: 'Messenger', instagram: 'Instagram', web: 'Вэб сайт', phone: 'Утас', walk_in: 'Биеэр ирсэн', referral: 'Танилаар', other: 'Бусад' };
  const STATUS = { new: 'Шинэ', contacted: 'Холбогдсон', interested: 'Сонирхсон', enrolled: 'Элссэн', lost: 'Татгалзсан' };
  const OPEN = ['new', 'contacted', 'interested'];
  const ROLE = { general_director: 'Ерөнхий захирал', branch_director: 'Салбарын захирал', senior_manager: 'Ахлах менежер', manager: 'Менежер', teacher: 'Багш' };
  const DAYS = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'], DAYS_LONG = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>';
  // Chart colours (validated with the dataviz palette checker against the white card): two series, the funnel's
  // ordinal blue steps, and the heat map's sequential blue ramp. Text never takes these colours.
  const C = { leads: '#2a78d6', enrolled: '#eb6834', funnel: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab'], heat: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'] };

  // ───────────── menu button + page (same pattern as Файлууд in manager-figma.js)
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.hub = 'crm'; button.setAttribute('aria-label', 'Харилцагч'); button.setAttribute('aria-selected', 'false');
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="stroke-width:1.8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9.5" cy="8" r="3.5" fill="currentColor" fill-opacity=".12"/><circle cx="9.5" cy="8" r="3.5"/><path d="M3 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1M19 8v6M16 11h6"/></svg><span class="nav-label">Харилцагч</span><span class="hub-unread" hidden></span>';
  (menu.querySelector('[data-hub="students"]') || menu.lastElementChild).after(button);
  const page = document.createElement('section');
  page.className = 'crm-home'; page.hidden = true; page.setAttribute('aria-label', 'Харилцагч');
  hub.append(page);

  function show() {
    if (typeof workspaceSelect === 'function') workspaceSelect('profile');
    hub.querySelectorAll(':scope > .ai-home, :scope > .file-home').forEach(x => { x.hidden = true; });
    page.hidden = false;
    menu.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b === button)));
    render();
  }
  button.addEventListener('click', e => { e.stopPropagation(); show(); });
  if (typeof workspaceSelect === 'function') {
    const previous = workspaceSelect;
    workspaceSelect = function (key) { previous(key); page.hidden = true; };
    if (typeof selectHub !== 'undefined') selectHub = workspaceSelect;
  }

  // ───────────── state and data
  const S = { me: null, people: new Map(), leads: [], view: 'list', filter: 'open', q: '', branch: '', sort: { key: 'created', dir: -1 }, who: 'all', range: 'd30', statsBranch: '', problem: '' };
  const lvl = () => S.me?.level ?? 0;
  const leader = () => lvl() >= 2;
  const nameOf = id => S.people.get(id)?.display_name || '—';
  const branchName = b => b ? 'Салбар ' + b : 'Салбаргүй';
  // People this account may give a lead to: itself, and lower positions in its branch (the general director: everyone).
  const owners = () => [...S.people.values()].filter(p => p.active && !p.hidden && p.level >= 1 && (p.id === S.me.id || (p.level < lvl() && (lvl() === 4 || p.branch_id === S.me.branch_id))))
    .sort((a, b) => (a.branch_id || 0) - (b.branch_id || 0) || b.level - a.level || a.display_name.localeCompare(b.display_name, 'mn'));

  async function load() {
    if (!window.RISE) { S.problem = 'offline'; return; }
    try {
      S.me = await RISE.profile();
      if (!S.me) { S.problem = 'session'; return; }
      if (S.me.level < 1) { S.problem = 'role'; return; }
      const [people, leads] = await Promise.all([
        RISE.sb.from('profiles').select('id,display_name,role,level,branch_id,active,hidden').eq('active', true),
        RISE.sb.from('leads').select('*').order('created_at', { ascending: false }).limit(1000)
      ]);
      if (leads.error) throw leads.error;
      S.people = new Map((people.data || []).map(p => [p.id, p]));
      S.leads = leads.data || [];
      S.problem = '';
      subscribe();
    } catch (e) { console.error(e); S.problem = 'offline'; }
    badge(); if (!page.hidden) render();
  }

  let live = false;
  function subscribe() {
    if (live || !RISE.sb.channel) return; live = true;
    RISE.sb.channel('crm-leads').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, ({ eventType, new: n, old: o }) => {
      if (eventType === 'DELETE') S.leads = S.leads.filter(l => l.id !== o.id);
      else {
        const i = S.leads.findIndex(l => l.id === n.id);
        // A website registration names its manager since 2026-11-21: that manager is told too, not only the branch.
        if (i < 0) { S.leads.unshift(n); if (n.source === 'web' && (!n.owner_id || n.owner_id === S.me?.id)) say('Вэб сайтаас шинэ бүртгэл: ' + n.name); }
        else S.leads[i] = n;
      }
      badge(); if (!page.hidden && !dialog.open && !dragging) render();
    }).subscribe();
  }

  // New leads waiting for this person: their own new leads plus unassigned ones. Same red count as Мэдэгдэл.
  function badge() {
    const b = button.querySelector('.hub-unread'), n = S.me ? S.leads.filter(l => l.status === 'new' && (l.owner_id === S.me.id || !l.owner_id)).length : 0;
    b.textContent = n > 99 ? '99+' : String(n); b.hidden = !n; b.setAttribute('aria-label', n + ' шинэ харилцагч');
  }

  // ───────────── page
  const VIEWS = () => [['list', 'Жагсаалт'], ['table', 'Хүснэгт'], ['board', 'Самбар'], ['insights', 'Шинжилгээ']].concat(leader() ? [['marketing', 'Маркетинг']] : []);
  function render() {
    charts = [];
    if (S.problem || !S.me) { page.innerHTML = problemHtml(); page.querySelector('[data-act=signin]')?.addEventListener('click', signInAgain); page.querySelector('[data-act=retry]')?.addEventListener('click', () => { page.innerHTML = loadingHtml(); load(); }); if (!S.me && !S.problem) page.innerHTML = loadingHtml(); return; }
    const views = VIEWS();
    if (!views.some(([k]) => k === S.view)) S.view = 'list';
    const head = `<header class="library-header"><div><span class="library-eyebrow">ХАРИЛЦАГЧИЙН БҮРТГЭЛ</span><h1>Харилцагч</h1><p>${leader() ? 'Сургалтад сонирхсон хүмүүс, хариуцагч, элсэлт, шинжилгээ, маркетинг.' : 'Сургалтад сонирхсон хүмүүстэй холбогдож, элсэлт болгоно.'}</p></div><button type="button" class="library-upload" data-act="new"><span>+</span> Харилцагч нэмэх</button></header>`;
    const tabs = `<div class="library-categories crm-views" role="group" aria-label="Харагдац">${views.map(([k, v]) => `<button type="button" data-view="${k}" aria-pressed="${S.view === k}">${v}</button>`).join('')}</div>`;
    const body = S.view === 'insights' ? insightsHtml() : S.view === 'marketing' ? marketingShell() : S.view === 'board' ? boardHtml() : listHtml(S.view === 'table');
    page.innerHTML = head + tabs + body;
    page.querySelector('[data-act=new]').onclick = () => openLead(null);
    page.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; render(); });
    if (S.view === 'insights') { wireFilters(); drawInsights(); }
    else if (S.view === 'marketing') loadMarketing();
    else if (S.view === 'board') wireBoard();
    else wireList();
  }
  const loadingHtml = () => '<div class="library-empty crm-empty"><h2>Ачаалж байна…</h2></div>';
  function problemHtml() {
    if (S.problem === 'session') return '<div class="library-empty crm-empty"><h2>Нэвтрэх хугацаа дууссан</h2><p>Харилцагчийн мэдээллийг харахын тулд дахин нэвтэрнэ үү.</p><button type="button" class="library-upload" data-act="signin">Дахин нэвтрэх</button></div>';
    if (S.problem === 'role') return '<div class="library-empty crm-empty"><h2>Харилцагчийн бүртгэл менежер, удирдлагад нээлттэй</h2></div>';
    if (S.problem === 'offline') return '<div class="library-empty crm-empty"><h2>Мэдээллийг ачаалж чадсангүй</h2><p>Интернэт холболтоо шалгаад дахин оролдоно уу.</p><button type="button" class="library-upload" data-act="retry">Дахин оролдох</button></div>';
    return loadingHtml();
  }
  function signInAgain() { try { localStorage.removeItem('rise-auth'); ['rise-demo-name', 'rise-demo-level', 'rise-demo-new-login'].forEach(k => sessionStorage.removeItem(k)); } catch {} location.href = 'staff.html'; }

  // ───────────── list and table (one filter bar, two layouts)
  const FILTERS = [['open', 'Идэвхтэй'], ['mine', 'Минийх'], ['free', 'Хариуцагчгүй'], ['enrolled', 'Элссэн'], ['lost', 'Татгалзсан'], ['all', 'Бүгд']];
  const matches = (l, f) => f === 'all' ? true : f === 'open' ? OPEN.includes(l.status) : f === 'mine' ? l.owner_id === S.me.id : f === 'free' ? !l.owner_id : l.status === f;
  const inBranch = l => !S.branch || (S.branch === 'null' ? l.branch_id == null : String(l.branch_id) === S.branch);
  const searchText = l => (l.name + ' ' + (l.phone || '') + ' ' + (l.course || '') + ' ' + (l.note || '')).toLowerCase();
  const branchSelect = () => lvl() === 4 ? `<select data-branch aria-label="Салбар"><option value="">Бүх салбар</option>${[1, 2, 3].map(b => `<option value="${b}" ${S.branch === String(b) ? 'selected' : ''}>Салбар ${b}</option>`).join('')}<option value="null" ${S.branch === 'null' ? 'selected' : ''}>Салбаргүй</option></select>` : '';
  const toolbar = () => `<div class="library-toolbar"><label class="library-search">${searchIcon}<input type="search" data-q placeholder="Нэр, утас, сургалтаар хайх…" aria-label="Харилцагч хайх" value="${esc(S.q)}"></label>${branchSelect()}</div>`;
  const COLS = [['name', 'Нэр'], ['phone', 'Утас'], ['course', 'Сургалт'], ['source', 'Эх сурвалж'], ['status', 'Төлөв'], ['owner', 'Хариуцагч'], ['created', 'Бүртгэсэн'], ['amount', 'Төлбөр']];
  const sortValue = (l, k) => k === 'owner' ? (l.owner_id ? short(nameOf(l.owner_id)) : '') : k === 'created' ? l.created_at : k === 'amount' ? Number(l.amount || 0)
    : k === 'status' ? Object.keys(STATUS).indexOf(l.status) : k === 'source' ? (SOURCES[l.source] || l.source || '') : String(l[k] || '').toLowerCase();
  function listHtml(asTable) {
    const scope = S.leads.filter(inBranch), q = S.q.trim().toLowerCase();
    const shown = scope.filter(l => matches(l, S.filter) && (!q || searchText(l).includes(q)));
    const empty = `<div class="library-empty"><h2>${S.leads.length ? 'Тохирох харилцагч олдсонгүй' : 'Харилцагч бүртгэгдээгүй байна'}</h2><p>${S.leads.length ? 'Шүүлт эсвэл хайлтаа өөрчилж үзээрэй.' : 'Facebook, утас, вэб сайтаар холбогдсон хүмүүсийг “Харилцагч нэмэх” товчоор оруулна. Вэб сайтаар бүртгүүлсэн хүмүүс энд автоматаар орж ирнэ.'}</p></div>`;
    let content;
    if (asTable) {
      const { key, dir } = S.sort;
      const rows = shown.slice().sort((a, b) => { const x = sortValue(a, key), y = sortValue(b, key); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
      content = rows.length ? `<div class="crm-table-wrap crm-grid-wrap"><table class="crm-table crm-grid"><thead><tr>${COLS.map(([k, v]) => `<th scope="col" aria-sort="${key === k ? (dir > 0 ? 'ascending' : 'descending') : 'none'}"${k === 'amount' ? ' class="num"' : ''}><button type="button" data-sort="${k}">${v}<span aria-hidden="true">${key === k ? (dir > 0 ? ' ↑' : ' ↓') : ''}</span></button></th>`).join('')}</tr></thead>
        <tbody>${rows.map(l => `<tr data-lead="${l.id}" tabindex="0"><td><strong>${esc(l.name)}</strong></td><td>${esc(l.phone || '—')}</td><td>${esc(l.course || '—')}</td><td>${esc(SOURCES[l.source] || l.source)}</td><td><span class="crm-status s-${l.status}">${STATUS[l.status]}</span></td><td>${l.owner_id ? esc(short(nameOf(l.owner_id))) : '<span class="crm-muted">Хариуцагчгүй</span>'}</td><td>${esc(when(l.created_at))}</td><td class="num">${l.amount ? money(l.amount) : '—'}</td></tr>`).join('')}</tbody></table></div>` : empty;
    } else {
      content = shown.map(l => `<button type="button" class="crm-row" data-lead="${l.id}">
      <span class="crm-avatar s-${l.status}" aria-hidden="true">${esc(initials(l.name))}</span>
      <span class="crm-copy"><strong>${esc(l.name)}</strong><span>${esc([l.course, SOURCES[l.source] || l.source, when(l.created_at)].filter(Boolean).join(' · '))}</span></span>
      ${l.owner_id ? `<span class="crm-owner">${esc(short(nameOf(l.owner_id)))}</span>` : '<span class="crm-owner free">Хариуцагчгүй</span>'}
      <span class="crm-status s-${l.status}">${STATUS[l.status]}${l.status === 'enrolled' && l.amount ? ' · ' + money(l.amount) : ''}</span>
    </button>`).join('') || empty;
    }
    const enrolled = scope.filter(l => l.status === 'enrolled');
    return toolbar() + `<div class="library-categories" role="group" aria-label="Шүүлт">${FILTERS.map(([k, label]) => `<button type="button" data-filter="${k}" aria-pressed="${S.filter === k}">${label} ${scope.filter(l => matches(l, k)).length}</button>`).join('')}</div>
      <div class="library-results crm-results" aria-live="polite">${content}</div>
      <footer class="library-footer"><span>${scope.length} харилцагч · ${enrolled.length} элссэн${enrolled.length ? ' · ' + money(enrolled.reduce((n, l) => n + Number(l.amount || 0), 0)) : ''}</span><span>Шинэчлэгдэх бүрд автоматаар орж ирнэ</span></footer>`;
  }
  function wireSearch() {
    const q = page.querySelector('[data-q]');
    q.oninput = () => { S.q = q.value; const pos = q.selectionStart; render(); const n = page.querySelector('[data-q]'); n.focus(); n.setSelectionRange(pos, pos); };
    const br = page.querySelector('[data-branch]'); if (br) br.onchange = () => { S.branch = br.value; render(); };
  }
  function wireList() {
    wireSearch();
    page.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; render(); });
    page.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { const k = b.dataset.sort; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : (k === 'created' || k === 'amount' ? -1 : 1) }; render(); });
    page.querySelectorAll('[data-lead]').forEach(r => {
      r.onclick = () => openLead(S.leads.find(l => l.id === r.dataset.lead));
      if (r.tagName === 'TR') r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.click(); } };
    });
  }

  // ───────────── pipeline board: one column per status; a card dragged to another column changes the lead's status
  // (the database logs it in the history). Moving to Элссэн opens the lead, because an enrolment needs its payment.
  const WHO = [['all', 'Бүгд'], ['mine', 'Минийх'], ['free', 'Хариуцагчгүй']];
  const age = iso => { const n = daysBetween(dayOf(iso), today()); return n <= 0 ? 'Өнөөдөр' : n + ' хоног'; };
  let dragging = false;
  function boardHtml() {
    const q = S.q.trim().toLowerCase();
    const scope = S.leads.filter(inBranch).filter(l => S.who === 'all' || (S.who === 'mine' ? l.owner_id === S.me.id : !l.owner_id)).filter(l => !q || searchText(l).includes(q));
    const card = l => `<button type="button" class="crm-lead-card" draggable="true" data-lead="${l.id}" aria-label="${esc(l.name)}, ${STATUS[l.status]}"><strong>${esc(l.name)}</strong><span>${esc([l.course, SOURCES[l.source] || l.source].filter(Boolean).join(' · '))}</span>
      <span class="crm-lead-foot"><span>${esc(age(l.created_at))}${l.status === 'enrolled' && l.amount ? ' · ' + money(l.amount) : ''}</span>${l.owner_id ? `<i title="${esc(short(nameOf(l.owner_id)))}">${esc(initials(nameOf(l.owner_id)))}</i>` : '<i class="free" title="Хариуцагчгүй">?</i>'}</span></button>`;
    const cols = Object.keys(STATUS).map(st => {
      const items = scope.filter(l => l.status === st), sum = items.reduce((n, l) => n + Number(l.amount || 0), 0);
      return `<section class="crm-col" data-col="${st}" aria-label="${STATUS[st]}"><header><span class="crm-col-dot s-${st}" aria-hidden="true"></span><h3>${STATUS[st]}</h3><b>${items.length}</b></header>
        ${st === 'enrolled' && sum ? `<p class="crm-col-sum">${money(sum)}</p>` : ''}
        <div class="crm-col-list">${items.slice(0, 60).map(card).join('') || '<p class="crm-col-empty">Хоосон</p>'}${items.length > 60 ? `<p class="crm-col-empty">Бусад ${items.length - 60} нь Жагсаалтад</p>` : ''}</div></section>`;
    }).join('');
    return toolbar() + `<div class="library-categories" role="group" aria-label="Хэнийх">${WHO.map(([k, v]) => `<button type="button" data-who="${k}" aria-pressed="${S.who === k}">${v}</button>`).join('')}</div>
      <div class="library-results crm-board-wrap"><div class="crm-board">${cols}</div></div>
      <footer class="library-footer"><span>${scope.length} харилцагч · ${scope.filter(l => OPEN.includes(l.status)).length} идэвхтэй</span><span>Картыг өөр багана руу чирж төлөвийг солино</span></footer>`;
  }
  function wireBoard() {
    wireSearch();
    page.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { S.who = b.dataset.who; render(); });
    page.querySelectorAll('.crm-lead-card').forEach(c => {
      c.onclick = () => openLead(S.leads.find(l => l.id === c.dataset.lead));
      c.ondragstart = e => { dragging = true; e.dataTransfer.setData('text/plain', c.dataset.lead); e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); };
      c.ondragend = () => { dragging = false; c.classList.remove('dragging'); page.querySelectorAll('.crm-col.over').forEach(x => x.classList.remove('over')); };
    });
    page.querySelectorAll('.crm-col').forEach(col => {
      col.ondragover = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('over'); };
      col.ondragleave = e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); };
      col.ondrop = e => { e.preventDefault(); dragging = false; col.classList.remove('over'); moveLead(e.dataTransfer.getData('text/plain'), col.dataset.col); };
    });
  }
  async function moveLead(id, status) {
    const l = S.leads.find(x => x.id === id);
    if (!l || l.status === status) return;
    if (status === 'enrolled') { openLead(l, { status }); return; }
    const before = l.status; l.status = status; render();
    const { data, error } = await RISE.sb.from('leads').update({ status }).eq('id', id).select().single();
    if (error) { l.status = before; render(); say(problemText(error)); return; }
    Object.assign(l, data); badge(); if (!dialog.open) render(); say(l.name + ': ' + STATUS[status]);
  }

  // ───────────── add / edit dialog (uses the dashboard's shared dialog styles)
  const dialog = document.createElement('dialog');
  dialog.className = 'crm-dialog'; dialog.setAttribute('aria-labelledby', 'crm-dialog-title');
  document.body.append(dialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (!page.hidden) render(); });

  // opt.note / opt.problem reopen a just-created lead whose note could not be saved, with the text kept;
  // opt.status presets the status (a card dropped on Элссэн).
  function openLead(l, opt = {}) {
    const editing = !!l, isLeader = leader(), people = isLeader ? owners() : [];
    const claim = editing && !l.owner_id && !isLeader;
    const meta = editing ? [SOURCES[l.source] || l.source, when(l.created_at), l.created_by ? 'Бүртгэсэн: ' + short(nameOf(l.created_by)) : 'Вэб сайтаас', l.preferred_time ? 'Тохиромжтой цаг: ' + l.preferred_time : ''].filter(Boolean).join(' · ') : 'Шинэ харилцагч бүртгэх';
    const status = opt.status || l?.status || 'new';
    dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="Хаах">×</button>
      <h2 id="crm-dialog-title">${editing ? esc(l.name) : 'Харилцагч нэмэх'}</h2><p class="crm-dialog-meta">${esc(meta)}</p>
      <form class="crm-form" novalidate>
        <div class="crm-two"><label>Овог, нэр<input name="name" required maxlength="120" value="${esc(l?.name)}" autocomplete="off"></label>
        <label>Утас<input name="phone" type="tel" inputmode="tel" maxlength="20" value="${esc(l?.phone)}" placeholder="8 оронтой"></label></div>
        <div class="crm-two"><label>Сургалт<select name="course"><option value="">Сонгоогүй</option>${COURSES.concat(l?.course && !COURSES.includes(l.course) ? [l.course] : []).map(c => `<option ${l?.course === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label>Эх сурвалж<select name="source">${Object.entries(SOURCES).map(([k, v]) => `<option value="${k}" ${(l?.source || 'facebook') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
        <div class="crm-two"><label>Төлөв<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Төлбөр (элссэн бол)<input name="amount" type="number" min="0" step="1000" inputmode="numeric" value="${esc(l?.amount ?? '')}" placeholder="₮"></label></div>
        ${isLeader ? `<label>Хариуцагч<select name="owner"><option value="">Хариуцагчгүй</option>${people.map(p => `<option value="${p.id}" ${l?.owner_id === p.id ? 'selected' : ''}>${esc(short(p.display_name))} — ${ROLE[p.role] || ''}${lvl() === 4 && p.branch_id ? ' · ' + branchName(p.branch_id) : ''}</option>`).join('')}</select></label>` : ''}
        <label>${editing ? 'Шинэ тэмдэглэл' : 'Тэмдэглэл'}<textarea name="note" rows="3" maxlength="2000" placeholder="Юу ярилцсан, дараагийн алхам…">${esc(opt.note)}</textarea></label>
        ${editing ? '<section class="crm-history" aria-label="Түүх"><h3>Түүх</h3><ol class="crm-history-list"><li class="crm-history-empty">Ачаалж байна…</li></ol></section>' : ''}
        <p class="crm-error" role="alert" hidden></p>
        <div class="crm-actions">${editing && l.phone ? `<a class="crm-secondary" href="tel:${esc(String(l.phone).replace(/[^\d+]/g, ''))}">Залгах</a>` : ''}${claim ? '<button type="button" class="crm-secondary" data-act="claim">Би хариуцъя</button>' : ''}${editing && isLeader ? '<button type="button" class="crm-secondary danger" data-act="delete">Устгах</button>' : ''}</div>
        <button type="submit" class="save-button">${editing ? 'Хадгалах' : 'Нэмэх'}</button>
      </form>`;
    const form = dialog.querySelector('form'), error = dialog.querySelector('.crm-error');
    const fail = text => { error.textContent = text; error.hidden = false; };
    dialog.querySelector('.dialog-close').onclick = () => dialog.close();
    const busy = on => form.querySelectorAll('button').forEach(b => { b.disabled = on; });
    async function save(extra = {}) {
      error.hidden = true;
      // The note is not a lead column any more: it becomes a new history entry, so earlier notes stay.
      const note = form.note.value.trim();
      const row = { name: form.name.value.trim(), phone: form.phone.value.replace(/[^\d+ ]/g, '').trim() || null, course: form.course.value || null, source: form.source.value, status: form.status.value, amount: form.amount.value === '' ? null : Number(form.amount.value), ...extra };
      if (!row.name) return fail('Нэрээ бичнэ үү.');
      if (row.phone && !/^[0-9+ ]{6,20}$/.test(row.phone)) return fail('Утасны дугаараа шалгана уу.');
      if (row.status === 'enrolled' && !row.amount) return fail('Элссэн бол төлбөрийн дүнг оруулна уу.');
      if (isLeader && !('owner_id' in extra)) {
        const owner = form.owner.value || null;
        row.owner_id = owner;
        if (owner) row.branch_id = S.people.get(owner)?.branch_id ?? null;
      }
      busy(true);
      const q = editing ? RISE.sb.from('leads').update(row).eq('id', l.id).select().single() : RISE.sb.from('leads').insert(row).select().single();
      const { data, error: err } = await q;
      if (err) { busy(false); return fail(problemText(err)); }
      const keep = lead => { const i = S.leads.findIndex(x => x.id === lead.id); if (i >= 0) S.leads[i] = lead; else S.leads.unshift(lead); badge(); };
      if (note) {
        const { error: nerr } = await RISE.sb.from('lead_events').insert({ lead_id: data.id, kind: 'note', body: note });
        if (nerr) {
          busy(false); keep(data);
          const problem = 'Харилцагч хадгалагдсан ч тэмдэглэл хадгалагдсангүй. ' + problemText(nerr);
          if (!editing) { dialog.close(); openLead(data, { note, problem }); return; }
          return fail(problem);
        }
        data.note = note;
      }
      busy(false); keep(data);
      dialog.close(); say(editing ? 'Хадгаллаа.' : 'Харилцагч нэмэгдлээ.');
    }
    form.onsubmit = e => { e.preventDefault(); save(); };
    dialog.querySelector('[data-act=claim]')?.addEventListener('click', () => save({ owner_id: S.me.id, branch_id: S.me.branch_id }));
    dialog.querySelector('[data-act=delete]')?.addEventListener('click', async () => {
      if (!confirm(l.name + ' харилцагчийг устгах уу? Буцаах боломжгүй.')) return;
      busy(true);
      const { error: err } = await RISE.sb.from('leads').delete().eq('id', l.id);
      busy(false);
      if (err) return fail(problemText(err));
      S.leads = S.leads.filter(x => x.id !== l.id); badge(); dialog.close(); say('Устгалаа.');
    });
    dialog.showModal();
    if (opt.problem) { fail(opt.problem); form.note.focus(); } else if (opt.status === 'enrolled') form.amount.focus(); else form.name.focus();
    if (editing) loadHistory(l, dialog.querySelector('.crm-history-list'));
  }

  // ───────────── history: notes (kept, never overwritten) plus status and owner changes logged by the database
  const ownerLabel = id => id ? short(nameOf(id)) : 'Хариуцагчгүй';
  async function loadHistory(l, list) {
    const { data, error } = await RISE.sb.from('lead_events').select('*').eq('lead_id', l.id).order('created_at', { ascending: false }).limit(200);
    if (!list.isConnected) return;
    if (error) { list.innerHTML = '<li class="crm-history-empty">Түүх ачаалсангүй.</li>'; return; }
    const items = (data || []).concat([{ kind: 'created', created_at: l.created_at, author_id: l.created_by, web: l.source === 'web' }]);
    const draw = all => {
      list.innerHTML = (all ? items : items.slice(0, 3)).map(eventHtml).join('')
        + (!all && items.length > 3 ? `<li class="crm-history-more-row"><button type="button" class="crm-secondary crm-history-more">Бүх түүх (${items.length})</button></li>` : '');
      list.querySelector('.crm-history-more')?.addEventListener('click', () => draw(true));
    };
    draw(false);
  }
  function eventHtml(e) {
    const who = e.author_id ? short(nameOf(e.author_id)) : e.kind === 'note' ? 'Өмнөх тэмдэглэл' : e.kind === 'created' && e.web ? 'Вэб сайтаас' : '—';
    const text = e.kind === 'note' ? `<p class="crm-event-note">${esc(e.body)}</p>`
      : e.kind === 'status' ? `<p>Төлөв: ${esc(STATUS[e.from_value] || e.from_value)} → ${esc(STATUS[e.to_value] || e.to_value)}</p>`
      : e.kind === 'owner' ? `<p>Хариуцагч: ${esc(ownerLabel(e.from_value))} → ${esc(ownerLabel(e.to_value))}</p>`
      : '<p>Бүртгэгдсэн</p>';
    return `<li class="crm-event ${e.kind}">${text}<span class="crm-event-meta">${esc(who)} · ${esc(stamp(e.created_at))}</span></li>`;
  }
  function problemText(err) {
    const m = String(err?.message || err || '');
    if (/row-level security|permission/i.test(m)) return 'Энэ үйлдлийг хийх эрх алга.';
    if (/fetch|network/i.test(m)) return 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.';
    if (/JWT|expired|session/i.test(m)) return 'Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.';
    return m || 'Хадгалж чадсангүй. Дахин оролдоно уу.';
  }

  // ───────────── shared filter row for Шинжилгээ and Маркетинг: one row above everything it scopes
  const RANGES = [['d7', '7 хоног'], ['d30', '30 хоног'], ['d90', '90 хоног'], ['month', 'Энэ сар'], ['all', 'Бүгд']];
  const RANGE_LABEL = { d7: '7 хоног', d30: '30 хоног', d90: '90 хоног', month: 'энэ сар', all: 'бүх хугацаа' };
  function span(key) {
    const t = today();
    if (key === 'all') { const oldest = S.leads.length ? dayOf(S.leads[S.leads.length - 1].created_at) : t; return [oldest < t ? oldest : t, t]; }
    return [key === 'month' ? t.slice(0, 8) + '01' : addDays(t, 1 - ({ d7: 7, d30: 30, d90: 90 })[key]), t];
  }
  function filtersHtml() {
    const branches = lvl() === 4 ? `<select data-stats-branch aria-label="Салбар"><option value="">Бүх салбар</option>${[1, 2, 3].map(b => `<option value="${b}" ${S.statsBranch === String(b) ? 'selected' : ''}>Салбар ${b}</option>`).join('')}</select>` : '';
    return `<div class="crm-stats-bar"><div class="library-categories" role="group" aria-label="Хугацаа">${RANGES.map(([k, v]) => `<button type="button" data-range="${k}" aria-pressed="${S.range === k}">${v}</button>`).join('')}</div>${branches}</div>`;
  }
  function wireFilters() {
    page.querySelectorAll('[data-range]').forEach(b => b.onclick = () => { S.range = b.dataset.range; render(); });
    const sel = page.querySelector('[data-stats-branch]'); if (sel) sel.onchange = () => { S.statsBranch = sel.value; render(); };
  }

  // ───────────── Шинжилгээ: everything is computed here from the leads this account may see (row level security),
  // so a manager sees their own work and a leader their branch or all branches.
  function insightData() {
    const [from, to] = span(S.range), n = daysBetween(from, to) + 1, pFrom = addDays(from, -n), pTo = addDays(from, -1);
    const scope = S.leads.filter(l => lvl() !== 4 || !S.statsBranch || String(l.branch_id) === S.statsBranch);
    const inR = (iso, a, b) => { if (!iso) return false; const d = dayOf(iso); return d >= a && d <= b; };
    const created = scope.filter(l => inR(l.created_at, from, to)), prevCreated = scope.filter(l => inR(l.created_at, pFrom, pTo));
    const enrolledIn = (a, b) => scope.filter(l => l.status === 'enrolled' && inR(l.enrolled_at || l.updated_at, a, b));
    const enrolled = enrolledIn(from, to), prevEnrolled = enrolledIn(pFrom, pTo);
    const sum = list => list.reduce((t, l) => t + Number(l.amount || 0), 0);
    const reply = list => list.filter(l => l.contacted_at).map(l => (Date.parse(l.contacted_at) - Date.parse(l.created_at)) / 36e5).filter(h => h >= 0);
    return { from, to, n, scope, created, prevCreated, enrolled, prevEnrolled, revenue: sum(enrolled), prevRevenue: sum(prevEnrolled), reply: reply(created), prevReply: reply(prevCreated),
      open: scope.filter(l => OPEN.includes(l.status)), stale: scope.filter(l => l.status === 'new' && Date.now() - Date.parse(l.created_at) > 3 * 864e5) };
  }
  // Delta against the period of the same length just before (none for "Бүгд"). Up is good for counts and money,
  // down is good for reply time; the arrow and the words carry the direction, not colour alone.
  function delta(cur, prev, { lowerBetter = false, unit = '' } = {}) {
    if (S.range === 'all' || prev == null || cur == null) return '';
    const d = Math.round((cur - prev) * 10) / 10;
    if (!d) return '<small class="crm-delta">Өмнөх үетэй адил</small>';
    const good = lowerBetter ? d < 0 : d > 0;
    const since = S.range === 'month' ? 'өмнөх ижил хугацаанаас' : `өмнөх ${RANGE_LABEL[S.range]}оос`;
    return `<small class="crm-delta ${good ? 'up' : 'down'}"><span aria-hidden="true">${d > 0 ? '▲' : '▼'}</span> ${d > 0 ? '+' : '−'}${unit === '₮' ? compactMoney(Math.abs(d)) : Math.abs(d) + unit} ${since}</small>`;
  }
  function insightsHtml() {
    const D = insightData(), conv = pct(D.created.filter(l => l.status === 'enrolled').length, D.created.length);
    const prevConv = pct(D.prevCreated.filter(l => l.status === 'enrolled').length, D.prevCreated.length);
    const mReply = median(D.reply), mPrevReply = median(D.prevReply);
    const tile = (label, value, note) => `<article class="crm-kpi"><span>${label}</span><strong>${value}</strong>${note}</article>`;
    const kpis = `<div class="crm-kpis crm-kpis-6">
      ${tile('Шинэ харилцагч', D.created.length, delta(D.created.length, D.prevCreated.length) || `<small>${fmtDay(D.from)}-аас хойш</small>`)}
      ${tile('Элсэлт', D.enrolled.length, delta(D.enrolled.length, D.prevEnrolled.length) || '<small>Энэ хугацаанд элссэн</small>')}
      ${tile('Хөрвөлт', conv + '%', D.created.length ? (delta(conv, D.prevCreated.length ? prevConv : null, { unit: '%' }) || '<small>Шинэ харилцагчаас элссэн</small>') : '<small>Шинэ харилцагч алга</small>')}
      ${tile('Орлого', `<span class="crm-full">${money(D.revenue)}</span><span class="crm-compact" aria-hidden="true">${compactMoney(D.revenue)}</span>`, delta(D.revenue, D.prevRevenue, { unit: '₮' }) || `<small>${D.enrolled.length ? 'Дундаж ' + money(D.revenue / D.enrolled.length) : 'Элсэлт бүртгэгдээгүй'}</small>`)}
      ${tile('Анхны холбоо', hoursText(mReply), mReply != null && mPrevReply != null ? delta(Math.round(mReply * 10) / 10, Math.round(mPrevReply * 10) / 10, { lowerBetter: true, unit: ' цаг' }) : '<small>Холбогдох дундаж (медиан) хугацаа</small>')}
      ${tile('Идэвхтэй харилцагч', D.open.length, `<small>${D.stale.length ? D.stale.length + ' нь 3+ хоног холбогдоогүй' : 'Бүгд хөдөлгөөнтэй'}</small>`)}
    </div>`;
    const scopeNote = `<p class="crm-scope">${lvl() === 4 ? (S.statsBranch ? branchName(Number(S.statsBranch)) : 'Бүх салбар') : lvl() >= 2 ? branchName(S.me.branch_id) : 'Таны болон хариуцагчгүй харилцагч'} · ${D.scope.length} харилцагчаас тооцов${S.leads.length >= 1000 ? ' (сүүлийн 1000)' : ''}</p>`;
    if (!D.scope.length) return filtersHtml() + `<div class="library-results crm-stats">${scopeNote}<div class="library-empty crm-empty"><h2>Харилцагч бүртгэгдээгүй байна</h2><p>Харилцагч нэмэгдэх тусам энд график, шинжилгээ гарна.</p></div></div>`;
    return filtersHtml() + `<div class="library-results crm-stats crm-insights" aria-live="polite">${scopeNote}${kpis}
      <section class="crm-card"><div class="crm-card-head"><h3>Харилцагч ба элсэлт</h3><span class="crm-legend"><span><i class="line" style="background:${C.leads}"></i>Шинэ харилцагч</span><span><i class="line" style="background:${C.enrolled}"></i>Элсэлт</span></span></div>
        <div class="crm-chart" data-chart="trend" tabindex="0" aria-label="Харилцагч ба элсэлтийн график. Сум товчоор өдөр сонгоно."></div>${trendTable(D)}</section>
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Борлуулалтын юүлүүр</h3><span>энэ хугацаанд ирсэн харилцагч</span></div>${funnelHtml(D)}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Хариу өгсөн хурд</h3><span>бүртгэгдсэнээс анх холбогдох хүртэл</span></div>${replyHtml(D)}</section>
      </div>
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Эх сурвалж</h3><span>харилцагч · элсэлт · хөрвөлт</span></div>${rankHtml(D.created, l => SOURCES[l.source] || l.source)}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Сургалт</h3><span>харилцагч · элсэлт · хөрвөлт</span></div>${rankHtml(D.created, l => l.course || 'Сонгоогүй')}</section>
      </div>
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Хэзээ хандаж байна</h3><span>гараг × цаг, Улаанбаатарын цагаар</span></div>${heatHtml(D)}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Хүссэн хичээлийн цаг</h3><span>вэбээр өөрөө хуваариа гаргасан хүмүүс</span></div>${wishHtml(D)}</section>
      </div>
      ${leader() ? `<section class="crm-card"><div class="crm-card-head"><h3>Хариуцагчаар</h3><span>орлогоор эрэмбэлсэн</span></div>${teamHtml(D)}</section>` : ''}
      ${lvl() === 4 && !S.statsBranch ? `<section class="crm-card"><div class="crm-card-head"><h3>Салбаруудаар</h3><span>энэ хугацаанд ирсэн харилцагч</span></div>${branchHtml(D)}</section>` : ''}
    </div>`;
  }

  // Daily buckets (weekly past 120 days) for the trend chart and its table twin.
  function trendBuckets(D) {
    const step = D.n > 120 ? 7 : 1, out = [];
    for (let i = 0; i < D.n; i += step) { const a = addDays(D.from, i), b = addDays(D.from, Math.min(D.n - 1, i + step - 1)); out.push({ a, b, leads: 0, enrolled: 0 }); }
    const at = d => out.findIndex(x => d >= x.a && d <= x.b);
    D.created.forEach(l => { const i = at(dayOf(l.created_at)); if (i >= 0) out[i].leads++; });
    D.enrolled.forEach(l => { const i = at(dayOf(l.enrolled_at || l.updated_at)); if (i >= 0) out[i].enrolled++; });
    return out.map(x => ({ ...x, short: md(x.a), long: x.a === x.b ? fmtDay(x.a) : fmtDay(x.a) + ' – ' + fmtDay(x.b) }));
  }
  function trendTable(D) {
    const rows = trendBuckets(D).filter(x => x.leads || x.enrolled);
    return `<details class="crm-data"><summary>Тоогоор харах</summary>${rows.length ? `<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Өдөр</th><th>Шинэ харилцагч</th><th>Элсэлт</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x.long)}</td><td>${x.leads}</td><td>${x.enrolled}</td></tr>`).join('')}</tbody></table></div>` : '<p class="crm-none">Энэ хугацаанд бүртгэл алга</p>'}</details>`;
  }
  function funnelHtml(D) {
    const all = D.created, total = all.length;
    if (!total) return '<p class="crm-none">Энэ хугацаанд шинэ харилцагч алга</p>';
    // The database stamps contacted_at on the first status change away from "Шинэ", so every worked lead counts as reached.
    const reached = [all.length, all.filter(l => l.contacted_at || l.status !== 'new').length, all.filter(l => ['interested', 'enrolled'].includes(l.status)).length, all.filter(l => l.status === 'enrolled').length];
    const names = ['Ирсэн', 'Холбогдсон', 'Сонирхсон', 'Элссэн'];
    return `<div class="crm-funnel">${names.map((name, i) => `<div class="crm-funnel-row" tabindex="0" aria-label="${name}: ${reached[i]} (${pct(reached[i], total)}%)"><span class="crm-funnel-label">${name}</span><span class="crm-funnel-track"><i style="width:${Math.max(reached[i] ? 2 : 0, pct(reached[i], total))}%;background:${C.funnel[i]}"></i></span><b>${reached[i]}</b><small>${pct(reached[i], total)}%</small></div>`).join('')}</div>
      <p class="crm-note">Татгалзсан: ${all.filter(l => l.status === 'lost').length} · Хүлээгдэж буй: ${all.filter(l => l.status === 'new').length}</p>`;
  }
  function replyHtml(D) {
    const bins = [['1 цагт', h => h < 1], ['1–4 цаг', h => h >= 1 && h < 4], ['4–24 цаг', h => h >= 4 && h < 24], ['1+ хоног', h => h >= 24]];
    const counts = bins.map(([, f]) => D.reply.filter(f).length).concat(D.created.filter(l => !l.contacted_at && l.status === 'new').length);
    const labels = bins.map(([n]) => n).concat('Хүлээгдэж буй');
    if (!D.created.length) return '<p class="crm-none">Энэ хугацаанд шинэ харилцагч алга</p>';
    return columnsHtml(labels, counts, i => i === labels.length - 1 ? '#c9c5d0' : C.leads, (l, v) => `${l}: ${v} харилцагч`)
      + `<p class="crm-note">Дундаж (медиан): ${hoursText(median(D.reply))}${D.reply.length ? ' · ' + D.reply.length + ' харилцагчид холбогдсон' : ''}</p>`;
  }
  // Ranked bars, one colour (one series); the value sits at the tip.
  function rankHtml(list, keyOf) {
    if (!list.length) return '<p class="crm-none">Энэ хугацаанд шинэ харилцагч алга</p>';
    const groups = new Map();
    list.forEach(l => { const k = keyOf(l), g = groups.get(k) || { name: k, leads: 0, enrolled: 0 }; g.leads++; if (l.status === 'enrolled') g.enrolled++; groups.set(k, g); });
    const rows = [...groups.values()].sort((a, b) => b.leads - a.leads || b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'mn')), max = rows[0].leads;
    return `<div class="crm-ranks">${rows.map(r => `<div class="crm-hbar2" tabindex="0" aria-label="${esc(r.name)}: ${r.leads} харилцагч, ${r.enrolled} элссэн"><span class="crm-hbar2-name">${esc(r.name)}</span><span class="crm-track"><i style="width:${Math.max(2, r.leads / max * 100)}%;background:${C.leads}"></i></span><b>${r.leads}</b><small>${r.enrolled} элссэн · ${pct(r.enrolled, r.leads)}%</small></div>`).join('')}</div>`;
  }
  function columnsHtml(labels, values, colorOf, aria) {
    const max = Math.max(1, ...values);
    return `<div class="crm-cols" style="--n:${labels.length}">${labels.map((l, i) => `<div class="crm-col-bar" tabindex="0" aria-label="${esc(aria(l, values[i]))}"><b>${values[i]}</b><span class="crm-col-track"><i style="height:${values[i] ? Math.max(3, values[i] / max * 100) : 0}%;background:${colorOf(i)}"></i></span><small>${esc(l)}</small></div>`).join('')}</div>`;
  }
  // Weekday × time-of-day heat map: one hue light→dark (sequential); exact counts in the table twin and on focus.
  const SLOTS = [['00–09', 0, 9], ['09–12', 9, 12], ['12–15', 12, 15], ['15–18', 15, 18], ['18–21', 18, 21], ['21–24', 21, 24]];
  const ubParts = iso => { const p = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(iso)); return [['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.find(x => x.type === 'weekday').value), Number(p.find(x => x.type === 'hour').value) % 24]; };
  function heatHtml(D) {
    if (!D.created.length) return '<p class="crm-none">Энэ хугацаанд шинэ харилцагч алга</p>';
    const grid = DAYS.map(() => SLOTS.map(() => 0));
    D.created.forEach(l => { const [d, h] = ubParts(l.created_at), s = SLOTS.findIndex(([, a, b]) => h >= a && h < b); if (d >= 0 && s >= 0) grid[d][s]++; });
    const max = Math.max(1, ...grid.flat()), step = v => v ? Math.min(C.heat.length - 1, Math.ceil(v / max * C.heat.length) - 1) : -1;
    const cell = (v, d, s) => { const k = step(v); return `<span class="crm-heat-cell${k >= 0 ? '' : ' zero'}" tabindex="0" style="${k >= 0 ? 'background:' + C.heat[k] : ''}" title="${DAYS_LONG[d]} ${SLOTS[s][0]}: ${v}" aria-label="${DAYS_LONG[d]} ${SLOTS[s][0]}: ${v} харилцагч"></span>`; };
    const busiest = grid.flatMap((r, d) => r.map((v, s) => [v, d, s])).sort((a, b) => b[0] - a[0])[0];
    return `<div class="crm-heat" role="img" aria-label="Гараг, цагаар харилцагч ирсэн тоо"><span></span>${SLOTS.map(([n]) => `<small>${n}</small>`).join('')}${grid.map((r, d) => `<small>${DAYS[d]}</small>${r.map((v, s) => cell(v, d, s)).join('')}`).join('')}</div>
      <div class="crm-heat-key"><span>Цөөн</span>${C.heat.map(c => `<i style="background:${c}"></i>`).join('')}<span>Олон</span></div>
      <p class="crm-note">Хамгийн их: ${DAYS_LONG[busiest[1]]} ${SLOTS[busiest[2]][0]} (${busiest[0]})</p>
      <details class="crm-data"><summary>Тоогоор харах</summary><div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Гараг</th>${SLOTS.map(([n]) => `<th>${n}</th>`).join('')}</tr></thead><tbody>${grid.map((r, d) => `<tr><td>${DAYS_LONG[d]}</td>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  }
  // Study times people asked for when they built their own schedule on the website (leads.schedule).
  function wishHtml(D) {
    const withPlan = D.created.filter(l => Array.isArray(l.schedule) && l.schedule.length);
    if (!withPlan.length) return '<p class="crm-none">Энэ хугацаанд вэбээр хуваариа гаргаж бүртгүүлсэн хүн алга. Вэбээр бүртгүүлэх бүрд хүссэн өдөр, цаг нь энд гарна.</p>';
    const days = DAYS.map(() => 0), parts = [0, 0, 0];
    withPlan.forEach(l => l.schedule.forEach(e => { const d = Number(e.d), h = Number(String(e.from || '').slice(0, 2)); if (d >= 0 && d < 7) days[d]++; if (!Number.isNaN(h)) parts[h < 12 ? 0 : h < 17 ? 1 : 2]++; }));
    const all = parts.reduce((a, b) => a + b, 0) || 1;
    return columnsHtml(DAYS, days, () => C.leads, (l, v) => `${DAYS_LONG[DAYS.indexOf(l)]}: ${v} хүн`)
      + `<div class="crm-split" role="img" aria-label="Өглөө ${parts[0]}, өдөр ${parts[1]}, орой ${parts[2]}">${['Өглөө', 'Өдөр', 'Орой'].map((n, i) => parts[i] ? `<span style="flex:${parts[i]};background:${C.funnel[i + 1]}" title="${n}: ${parts[i]}">${pct(parts[i], all) >= 18 ? n + ' ' + pct(parts[i], all) + '%' : ''}</span>` : '').join('')}</div>
      <p class="crm-note">Өглөө (12-оос өмнө) ${parts[0]} · Өдөр (12–17) ${parts[1]} · Орой (17-оос хойш) ${parts[2]} · ${withPlan.length} хүн</p>`;
  }
  function teamHtml(D) {
    const rows = new Map(), row = id => rows.get(id) || rows.set(id, { id, leads: 0, contacted: 0, enrolled: 0, revenue: 0, reply: [] }).get(id);
    D.created.forEach(l => { const r = row(l.owner_id || ''); r.leads++; if (l.contacted_at || l.status !== 'new') r.contacted++; if (l.contacted_at) r.reply.push((Date.parse(l.contacted_at) - Date.parse(l.created_at)) / 36e5); });
    D.enrolled.forEach(l => { const r = row(l.owner_id || ''); r.enrolled++; r.revenue += Number(l.amount || 0); });
    const list = [...rows.values()].sort((a, b) => b.revenue - a.revenue || b.enrolled - a.enrolled || b.leads - a.leads);
    if (!list.length) return '<p class="crm-none">Энэ хугацаанд мэдээлэл алга</p>';
    const top = Math.max(1, ...list.map(r => r.revenue));
    return `<div class="crm-table-wrap"><table class="crm-table crm-team"><thead><tr><th>Хариуцагч</th><th>Шинэ</th><th>Холбогдсон</th><th>Элссэн</th><th>Хөрвөлт</th><th>Хариу</th><th>Орлого</th></tr></thead><tbody>
      ${list.map(r => `<tr><td><span class="crm-team-name">${r.id ? `<span class="crm-avatar small" aria-hidden="true">${esc(initials(nameOf(r.id)))}</span>${esc(short(nameOf(r.id)))}` : '<span class="crm-muted">Хариуцагчгүй</span>'}</span></td><td>${r.leads}</td><td>${pct(r.contacted, r.leads)}%</td><td>${r.enrolled}</td><td>${pct(r.enrolled, r.leads)}%</td><td>${hoursText(median(r.reply))}</td><td><span class="crm-team-money"><i style="width:${r.revenue ? Math.max(2, Math.round(r.revenue / top * 40)) : 0}px;background:${C.enrolled}"></i>${money(r.revenue)}</span></td></tr>`).join('')}</tbody></table></div>`;
  }
  function branchHtml(D) {
    const rows = [1, 2, 3, null].map(b => { const c = D.created.filter(l => (l.branch_id ?? null) === b), e = D.enrolled.filter(l => (l.branch_id ?? null) === b); return { b, leads: c.length, enrolled: e.length, conv: pct(c.filter(l => l.status === 'enrolled').length, c.length), revenue: e.reduce((t, l) => t + Number(l.amount || 0), 0) }; }).filter(r => r.b != null || r.leads || r.enrolled);
    const max = Math.max(1, ...rows.map(r => r.leads));
    return `<div class="crm-ranks">${rows.map(r => `<div class="crm-hbar2" tabindex="0" aria-label="${esc(branchName(r.b))}: ${r.leads} харилцагч, ${r.enrolled} элсэлт, ${money(r.revenue)}"><span class="crm-hbar2-name">${esc(branchName(r.b))}</span><span class="crm-track"><i style="width:${r.leads ? Math.max(2, r.leads / max * 100) : 0}%;background:${C.leads}"></i></span><b>${r.leads}</b><small>${r.enrolled} элсэлт · ${r.conv}% · ${compactMoney(r.revenue)}</small></div>`).join('')}</div>`;
  }

  // Line charts drawn at the card's real width: 2px lines, a 10% wash under the first series, solid hairline grid, one
  // y axis, a crosshair that snaps to the nearest point and a tooltip listing every series (←/→ moves it from the
  // keyboard). Every chart on the page is kept in `charts` and redrawn when the card changes width.
  let charts = [];
  function lineChart(box, points, series) {
    if (!box || !points.length) return;
    const c = { box, points, series, w: 0 };
    charts.push(c); drawLine(c);
  }
  function drawInsights() {
    // A part of the morning / day / evening bar keeps its label only if the label fits inside; the line under the bar
    // always lists all three, so nothing is lost when a narrow part goes unlabelled.
    page.querySelectorAll('.crm-split span').forEach(s => { if (s.scrollWidth > s.clientWidth + 1) s.textContent = ''; });
    const b = trendBuckets(insightData());
    lineChart(page.querySelector('[data-chart=trend]'), b, [{ name: 'Шинэ харилцагч', color: C.leads, values: b.map(x => x.leads) }, { name: 'Элсэлт', color: C.enrolled, values: b.map(x => x.enrolled) }]);
  }
  function niceTicks(max) {
    const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw || 1)), step = Math.max(1, [1, 2, 5, 10].map(m => m * mag).find(s => s >= raw) || mag * 10);
    const out = []; for (let v = 0; v < max + step; v += step) { out.push(Math.round(v)); if (v >= max) break; }
    return out;
  }
  const tick = v => v >= 10000 ? Math.round(v / 1000) + 'K' : new Intl.NumberFormat('en-US').format(v);
  function drawLine(c) {
    const { box, points, series } = c;
    if (!box.isConnected) return;
    const n = points.length, ticks = niceTicks(Math.max(1, ...series.flatMap(s => s.values))), top = ticks[ticks.length - 1];
    const W = Math.max(180, Math.floor(box.clientWidth)), H = 220, L = 14 + 6 * Math.max(...ticks.map(t => tick(t).length)), R = 10, T = 14, B = 26;
    c.w = W;
    const x = i => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = v => T + (H - T - B) * (1 - v / top);
    const line = v => v.map((val, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join('');
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 56))));
    const xl = points.map((p, i) => i % every === 0 || i === n - 1 ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(p.short)}</text>` : '').join('');
    // inline size: the dashboard's global "svg{width:14px;height:14px}" (manager-measured.css) would shrink the chart
    box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:${W}px;height:${H}px" aria-hidden="true">
      ${ticks.map(t => `<line class="g" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="yt" x="${L - 6}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end">${tick(t)}</text>`).join('')}
      <g class="xt">${xl}</g>
      <path d="${line(series[0].values)}L${x(n - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z" fill="${series[0].color}" fill-opacity=".1"/>
      ${series.map(s => n === 1 ? `<circle cx="${x(0)}" cy="${y(s.values[0])}" r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>` : `<path d="${line(s.values)}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
      <line class="ch" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
      ${series.map(s => `<circle class="dot" r="4" fill="${s.color}" stroke="#fff" stroke-width="2" visibility="hidden"/>`).join('')}
      <rect class="hit" x="${L - 8}" y="0" width="${W - L - R + 16}" height="${H}" fill="transparent"/></svg><div class="crm-tip" hidden></div>`;
    const svg = box.querySelector('svg'), tip = box.querySelector('.crm-tip'), ch = svg.querySelector('.ch'), dots = [...svg.querySelectorAll('.dot')];
    let cur = n - 1;
    const showAt = i => {
      cur = i; const px = x(i);
      ch.setAttribute('x1', px); ch.setAttribute('x2', px); ch.setAttribute('visibility', 'visible');
      dots.forEach((d, k) => { d.setAttribute('cx', px); d.setAttribute('cy', y(series[k].values[i])); d.setAttribute('visibility', 'visible'); });
      tip.replaceChildren();
      const head = document.createElement('strong'); head.textContent = points[i].long; tip.append(head);
      series.forEach(s => { const r = document.createElement('span'), key = document.createElement('i'), v = document.createElement('b'); key.style.background = s.color; v.textContent = new Intl.NumberFormat('en-US').format(s.values[i]); r.append(key, v, document.createTextNode(' ' + s.name)); tip.append(r); });
      tip.hidden = false;
      const tw = tip.offsetWidth; tip.style.left = Math.min(Math.max(0, px - tw / 2), W - tw) + 'px';
    };
    const hide = () => { ch.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); tip.hidden = true; };
    const index = clientX => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.round((clientX - r.left - L) / ((W - L - R) / Math.max(1, n - 1))))); };
    svg.querySelector('.hit').addEventListener('pointermove', e => showAt(index(e.clientX)));
    svg.addEventListener('pointerleave', () => { if (document.activeElement !== box) hide(); });
    box.onfocus = () => showAt(cur); box.onblur = hide;
    box.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); showAt(Math.max(0, Math.min(n - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)))); } };
  }
  // Charts follow the card's width (window resize, side panel opening, phone rotation).
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (page.hidden) return; charts.forEach(c => { if (c.box.isConnected && Math.abs(c.box.clientWidth - c.w) > 8) drawLine(c); }); }).observe(page);

  // ───────────── Маркетинг (leaders): content research. Website traffic comes from web_daily_stats (anonymous daily
  // counters per page) and crm_stats; the Facebook page from fb_page_daily and fb_posts, filled every day by the fb-sync
  // Edge Function once the page is connected (supabase/FACEBOOK.md). The findings are sentences computed from those
  // numbers — nothing is estimated or made up, and a finding needs enough data before it is said.
  const WEB_PAGES = { home: 'Нүүр хуудас', ekskavator: 'Экскаватор оператор', damp: 'Дамп оператор', kovsh: 'Ковш оператор', manikyur: 'Маникюр', sormuus: 'Сормуус' };
  const TOPICS = [['Экскаватор', /экскаватор/i], ['Дамп', /дамп/i], ['Ковш', /ковш/i], ['Маникюр', /маникюр|хумс/i], ['Сормуус', /сормуус/i]];
  const MEDIA = { photo: 'Зураг', added_photos: 'Зураг', video: 'Видео', added_video: 'Видео', video_inline: 'Видео', reel: 'Reel', link: 'Холбоос', share: 'Холбоос', album: 'Цомог', status: 'Текст', mobile_status_update: 'Текст', shared_story: 'Хуваалцсан', event: 'Арга хэмжээ' };
  const weekdayOf = d => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;
  const num = v => new Intl.NumberFormat('en-US').format(Math.round(Number(v) || 0));
  function marketingShell() { return filtersHtml() + '<div class="library-results crm-stats" aria-live="polite"><div class="library-empty crm-empty"><h2>Ачаалж байна…</h2></div></div>'; }
  async function loadMarketing() {
    wireFilters();
    let [from, to] = span(S.range); if (daysBetween(from, to) > 400) from = addDays(to, -400);
    const n = daysBetween(from, to) + 1, prevFrom = S.range === 'all' ? from : addDays(from, -n);
    const box = page.querySelector('.crm-stats');
    const [stats, web, fbDays, fbPosts] = await Promise.all([
      RISE.sb.rpc('crm_stats', { p_from: from, p_to: to, p_branch: lvl() === 4 && S.statsBranch ? Number(S.statsBranch) : null }),
      RISE.sb.rpc('web_daily_stats', { p_from: prevFrom, p_to: to }),
      RISE.sb.from('fb_page_daily').select('*').gte('day', prevFrom).lte('day', to).order('day', { ascending: true }),
      RISE.sb.from('fb_posts').select('*').order('created_at', { ascending: false }).limit(300)
    ]);
    if (!box.isConnected) return;
    if (stats.error) { box.innerHTML = `<div class="library-empty crm-empty"><h2>Статистик ачаалсангүй</h2><p>${esc(problemText(stats.error))}</p></div>`; return; }
    const M = { from, to, n, prevFrom, d: stats.data || {}, web: web.error ? null : (web.data || []), fbDays: fbDays.error ? [] : (fbDays.data || []), fbPosts: fbPosts.error ? [] : (fbPosts.data || []) };
    M.W = webSeries(M); M.F = fbSeries(M);
    box.innerHTML = marketingHtml(M);
    drawMarketing(M);
  }
  const inCur = (M, d) => d >= M.from && d <= M.to, inPrev = (M, d) => S.range !== 'all' && d >= M.prevFrom && d < M.from;
  // Daily points (weekly past 120 days) from M.from to M.to.
  function periodPoints(M) {
    const step = M.n > 120 ? 7 : 1, out = [];
    for (let i = 0; i < M.n; i += step) { const a = addDays(M.from, i), b = addDays(M.from, Math.min(M.n - 1, i + step - 1)); out.push({ a, b, short: md(a), long: a === b ? fmtDay(a) : fmtDay(a) + ' – ' + fmtDay(b) }); }
    return out;
  }
  function webSeries(M) {
    if (!M.web) return null;
    const total = (pred, key) => M.web.filter(r => pred(M, r.day)).reduce((t, r) => t + (Number(r[key]) || 0), 0);
    const keys = ['view', 'register', 'call', 'messenger'], cur = {}, prev = {};
    keys.forEach(k => { cur[k] = total(inCur, k); prev[k] = total(inPrev, k); });
    const points = periodPoints(M).map(p => ({ ...p, view: 0, register: 0 }));
    M.web.filter(r => inCur(M, r.day)).forEach(r => { const p = points.find(x => r.day >= x.a && r.day <= x.b); if (p) { p.view += Number(r.view) || 0; p.register += Number(r.register) || 0; } });
    const wd = DAYS.map(() => ({ views: 0, days: 0 }));
    for (let i = 0; i < M.n; i++) wd[weekdayOf(addDays(M.from, i))].days++;
    M.web.filter(r => inCur(M, r.day)).forEach(r => { wd[weekdayOf(r.day)].views += Number(r.view) || 0; });
    return { cur, prev, points, weekday: wd.map(x => x.days ? Math.round(x.views / x.days * 10) / 10 : 0) };
  }
  function fbSeries(M) {
    const sum = (list, k) => list.reduce((t, r) => t + (Number(r[k]) || 0), 0), keys = ['reach', 'impressions', 'engagements', 'page_views', 'new_follows'];
    const cur = M.fbDays.filter(r => inCur(M, r.day)), prev = M.fbDays.filter(r => inPrev(M, r.day)), T = {}, P = {};
    keys.forEach(k => { T[k] = sum(cur, k); P[k] = prev.length ? sum(prev, k) : null; });
    const points = periodPoints(M).map(p => ({ ...p, reach: 0, engagements: 0 }));
    cur.forEach(r => { const p = points.find(x => r.day >= x.a && r.day <= x.b); if (p) { p.reach += Number(r.reach) || 0; p.engagements += Number(r.engagements) || 0; } });
    const followers = [...M.fbDays].reverse().find(r => r.followers != null)?.followers ?? null;
    const posts = M.fbPosts.filter(p => p.created_at && inCur(M, dayOf(p.created_at))).map(p => ({ ...p, eng: (p.reactions || 0) + (p.comments || 0) + (p.shares || 0) }));
    return { days: cur.length, T, P, points, followers, posts, any: M.fbDays.length > 0 || M.fbPosts.length > 0 };
  }
  // A KPI tile with the change against the previous period of the same length.
  const mTile = (label, value, cur, prev, note, opt) => `<article class="crm-kpi"><span>${label}</span><strong>${value}</strong>${delta(cur, prev, opt) || `<small>${note}</small>`}</article>`;
  function marketingHtml(M) {
    const d = M.d, w = d.web || {}, Wd = M.W, fb = d.facebook || {}, F = M.F;
    const webLeads = (w.leads || []).reduce((t, x) => t + (Number(x.leads) || 0), 0), ctr = Wd ? pct(Wd.cur.register, Wd.cur.view) : 0;
    const src = d.by_source || [], maxS = Math.max(1, ...src.map(s => s.leads));
    const web = Wd ? `<div class="crm-kpis">
        ${mTile('Вэб хуудас үзэлт', num(Wd.cur.view), Wd.cur.view, Wd.prev.view, 'Нэг цонхонд дахин нээх нь тоологдохгүй')}
        ${mTile('“Бүртгүүлэх” дарсан', num(Wd.cur.register), Wd.cur.register, Wd.prev.register, Wd.cur.view ? ctr + '% нь үзээд дарсан' : 'Үзэлт алга')}
        ${mTile('Вэбээр бүртгүүлсэн', webLeads, null, null, Wd.cur.register ? pct(webLeads, Wd.cur.register) + '% нь дарсныхаа дараа бүртгүүлсэн' : 'Энэ хугацаанд')}
        ${mTile('Залгах · Messenger', Wd.cur.call + ' · ' + Wd.cur.messenger, Wd.cur.call + Wd.cur.messenger, Wd.prev.call + Wd.prev.messenger, 'Вэбээс дарсан тоо')}
      </div>
      <section class="crm-card"><div class="crm-card-head"><h3>Өдөр тутмын хандалт</h3><span class="crm-legend"><span><i class="line" style="background:${C.leads}"></i>Үзэлт</span><span><i class="line" style="background:${C.enrolled}"></i>“Бүртгүүлэх” дарсан</span></span></div>
        ${Wd.cur.view || Wd.cur.register ? '<div class="crm-chart" data-chart="web" tabindex="0" aria-label="Вэб сайтын өдөр тутмын үзэлт. Сум товчоор өдөр сонгоно."></div>' : '<p class="crm-none">Энэ хугацаанд үзэлт бүртгэгдээгүй байна.</p>'}
        <details class="crm-data"><summary>Тоогоор харах</summary><div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Өдөр</th><th>Үзэлт</th><th>“Бүртгүүлэх” дарсан</th></tr></thead><tbody>${Wd.points.filter(p => p.view || p.register).map(p => `<tr><td>${esc(p.long)}</td><td>${p.view}</td><td>${p.register}</td></tr>`).join('') || '<tr><td colspan="3">Үзэлт алга</td></tr>'}</tbody></table></div></details></section>
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Гарагаар</h3><span>өдөрт дунджаар хэдэн үзэлт</span></div>${columnsHtml(DAYS, Wd.weekday, () => C.leads, (l, v) => `${DAYS_LONG[DAYS.indexOf(l)]}: дунджаар ${v} үзэлт`)}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Дүгнэлт</h3><span>энэ хугацааны тооноос</span></div>${findingsHtml(webFindings(M))}</section>
      </div>` : `<section class="crm-card"><p class="crm-none">Өдөр тутмын хандалтын тоо ачаалсангүй. Доорх нь энэ хугацааны нийт дүн.</p></section>`;
    return `<h2 class="crm-section">Вэб сайтын хандалт</h2>${web}${pagesHtml(w)}
      <section class="crm-card"><div class="crm-card-head"><h3>Бүх эх сурвалж</h3><span>харилцагч · элсэлт</span></div>${src.length ? `<div class="crm-ranks">${src.map(s => `<div class="crm-hbar2"><span class="crm-hbar2-name">${esc(SOURCES[s.source] || s.source)}</span><span class="crm-track"><i style="width:${Math.max(2, s.leads / maxS * 100)}%;background:${C.leads}"></i></span><b>${s.leads}</b><small>${s.enrolled} элссэн · ${pct(s.enrolled, s.leads)}%</small></div>`).join('')}</div>` : '<p class="crm-none">Мэдээлэл алга</p>'}</section>
      <h2 class="crm-section">Facebook пэйж · контент</h2>${fbHtml(F, fb)}`;
  }
  function findingsHtml(list) { return list.length ? `<ul class="crm-findings">${list.map(t => `<li>${t}</li>`).join('')}</ul>` : '<p class="crm-none">Дүгнэлт гаргахад хангалттай мэдээлэл хараахан алга.</p>'; }
  // Website findings: each sentence is said only when there is enough data behind it.
  function pageRows(w) {
    const pages = new Map((w.pages || []).map(p => [p.page, p])), byCourse = new Map((w.leads || []).map(x => [x.course, x]));
    return [...new Set(Object.keys(WEB_PAGES).concat([...pages.keys()]))].map(s => { const p = pages.get(s) || {}, name = WEB_PAGES[s] || s, x = byCourse.get(name) || {}; return { slug: s, name, view: Number(p.view) || 0, register: Number(p.register) || 0, call: Number(p.call) || 0, messenger: Number(p.messenger) || 0, leads: Number(x.leads) || 0, enrolled: Number(x.enrolled) || 0 }; });
  }
  function webFindings(M) {
    const out = [], Wd = M.W, rows = pageRows(M.d.web || {}), courses = rows.filter(r => r.slug !== 'home'), all = rows.reduce((t, r) => t + r.view, 0);
    if (!Wd || !all) return out;
    const top = [...courses].sort((a, b) => b.view - a.view)[0];
    if (top?.view) out.push(`<b>${esc(top.name)}</b> хуудас хамгийн их үзэгдсэн: ${num(top.view)} үзэлт, сургалтын хуудсуудын нийт үзэлтийн ${pct(top.view, courses.reduce((t, r) => t + r.view, 0))}%.`);
    const rated = courses.filter(r => r.view >= 20), avg = pct(rated.reduce((t, r) => t + r.register, 0), rated.reduce((t, r) => t + r.view, 0));
    const best = [...rated].sort((a, b) => b.register / b.view - a.register / a.view)[0];
    if (best && rated.length > 1) out.push(`<b>${esc(best.name)}</b> хуудсыг үзсэн хүмүүсийн ${pct(best.register, best.view)}% нь “Бүртгүүлэх” дарсан — хамгийн өндөр (дундаж ${avg}%).`);
    const weak = rated.filter(r => pct(r.register, r.view) * 2 < avg && r.view >= 40).sort((a, b) => b.view - a.view)[0];
    if (weak) out.push(`<b>${esc(weak.name)}</b> хуудас ${num(weak.view)} удаа үзэгдсэн ч ${pct(weak.register, weak.view)}% нь л “Бүртгүүлэх” дарсан — дунджаас 2 дахин бага.`);
    const days = Wd.weekday, peak = days.indexOf(Math.max(...days)), low = days.indexOf(Math.min(...days));
    if (M.n >= 14 && days[peak] > 0 && days[peak] !== days[low]) out.push(`Сайт <b>${DAYS_LONG[peak]}</b> гарагт хамгийн их үзэгддэг (өдөрт дунджаар ${days[peak]}), ${DAYS_LONG[low]} гарагт хамгийн бага (${days[low]}).`);
    if (S.range !== 'all' && Wd.prev.view) { const ch = Math.round((Wd.cur.view - Wd.prev.view) / Wd.prev.view * 100); out.push(`Үзэлт өмнөх ижил хугацаанаас ${ch >= 0 ? ch + '% өссөн' : Math.abs(ch) + '% буурсан'} (${num(Wd.prev.view)} → ${num(Wd.cur.view)}).`); }
    if (Wd.cur.call + Wd.cur.messenger) out.push(`Сайтаас ${Wd.cur.call} удаа утсаар залгах, ${Wd.cur.messenger} удаа Messenger товч дарсан.`);
    return out;
  }
  function pagesHtml(w) {
    const rows = pageRows(w).sort((a, b) => b.view - a.view || b.leads - a.leads || a.name.localeCompare(b.name, 'mn')), max = Math.max(1, ...rows.map(r => r.view));
    return `<section class="crm-card crm-web"><div class="crm-card-head"><h3>Хуудас бүрээр</h3><span>үзэлт · дарсан хувь · бүртгэл</span></div>
      <div class="crm-ranks">${rows.map(r => `<div class="crm-hbar2" tabindex="0" aria-label="${esc(r.name)}: ${r.view} үзэлт, ${r.register} удаа бүртгүүлэх дарсан, ${r.leads} бүртгэл"><span class="crm-hbar2-name">${esc(r.name)}</span><span class="crm-track"><i style="width:${r.view ? Math.max(2, r.view / max * 100) : 0}%;background:${C.leads}"></i></span><b>${num(r.view)}</b><small>${r.register} дарсан (${pct(r.register, r.view)}%)${r.slug === 'home' ? '' : ' · ' + r.leads + ' бүртгэл · ' + r.enrolled + ' элссэн'}</small></div>`).join('')}</div>
      <details class="crm-data"><summary>Тоогоор харах</summary><div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Хуудас</th><th>Үзсэн</th><th>“Бүртгүүлэх” дарсан</th><th>Дарсан %</th><th>Залгах</th><th>Messenger</th><th>Бүртгэл</th><th>Элссэн</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.view}</td><td>${r.register}</td><td>${pct(r.register, r.view)}%</td><td>${r.call}</td><td>${r.messenger}</td><td>${r.slug === 'home' ? '—' : r.leads}</td><td>${r.slug === 'home' ? '—' : r.enrolled}</td></tr>`).join('')}</tbody></table></div></details>
      <p class="crm-web-note">Бүх салбарын нийт. Бүртгэл нь тухайн сургалтыг сонгож вэбээр бүртгүүлсэн хүмүүс. Нэг цонхонд хуудсыг дахин нээх, сэргээх нь нэмж тоологдохгүй; ажилтны төхөөрөмж тоологдохгүй.</p>
    </section>`;
  }
  // Facebook page content: reach and engagement per day, then the posts themselves — which posts, topics, posting
  // days and times and kinds of content reach more people and get more reactions.
  function fbHtml(F, fb) {
    const status = fb.status?.message ? `<p class="crm-note">${esc(fb.status.message)}${fb.status.updated_at ? ' · ' + esc(when(fb.status.updated_at)) : ''}</p>` : '';
    if (!F.any) return `<section class="crm-card"><div class="crm-card-head"><h3>Пэйж холбогдоогүй байна</h3></div>
      <p class="crm-none">Facebook пэйжийг нэг удаа холбоход энд өдөр бүр автоматаар гарна:</p>
      <ul class="crm-findings plain"><li>Хүрээ, үзэлт, оролцоо, шинэ дагагч — өдрөөр, өмнөх үетэй харьцуулж</li><li>Нийтлэл бүр хэдэн хүнд хүрч, хэдэн reaction, сэтгэгдэл, хуваалцалт авсан</li><li>Аль сургалтын сэдэв, аль төрлийн контент (зураг, видео, reel) илүү үзэгддэг</li><li>Аль гараг, аль цагт нийтлэхэд илүү хүрээтэй байдаг</li></ul>
      ${status}<a class="crm-link" href="https://github.com/gamu666/rise/blob/main/supabase/FACEBOOK.md" target="_blank" rel="noopener">Холбох заавар</a></section>`;
    const T = F.T, P = F.P, er = T.reach ? Math.round(T.engagements / T.reach * 1000) / 10 : null, per = P.reach ? Math.round(P.engagements / P.reach * 1000) / 10 : null;
    const kpis = `<div class="crm-kpis crm-kpis-6">
      ${mTile('Хүрээ', num(T.reach), T.reach, P.reach, 'Пэйжийн контент хүрсэн хүн')}
      ${mTile('Үзэлт', num(T.impressions), T.impressions, P.impressions, 'Контент нийт харагдсан удаа')}
      ${mTile('Оролцоо', num(T.engagements), T.engagements, P.engagements, 'Reaction, сэтгэгдэл, хуваалцалт, дарсан')}
      ${mTile('Оролцооны хувь', er == null ? '—' : er + '%', er, per, 'Хүрсэн хүнээс оролцсон', { unit: '%' })}
      ${mTile('Пэйж үзэлт', num(T.page_views), T.page_views, P.page_views, 'Пэйж рүү орж үзсэн')}
      ${mTile('Шинэ дагагч', num(T.new_follows), T.new_follows, P.new_follows, F.followers != null ? 'Нийт ' + num(F.followers) + ' дагагч' : 'Энэ хугацаанд')}
    </div>`;
    const charts = F.days ? `<div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Хүрээ</h3><span>өдөрт хүрсэн хүн</span></div><div class="crm-chart" data-chart="fb-reach" tabindex="0" aria-label="Facebook хүрээ өдрөөр. Сум товчоор өдөр сонгоно."></div></section>
        <section class="crm-card"><div class="crm-card-head"><h3>Оролцоо</h3><span>өдөрт</span></div><div class="crm-chart" data-chart="fb-eng" tabindex="0" aria-label="Facebook оролцоо өдрөөр. Сум товчоор өдөр сонгоно."></div></section>
      </div>` : '';
    return kpis + charts + postsHtml(F) + status;
  }
  function postsHtml(F) {
    const posts = F.posts;
    if (!posts.length) return '<section class="crm-card"><p class="crm-none">Энэ хугацаанд нийтлэл алга.</p></section>';
    const hasReach = posts.some(p => p.reach != null);
    const score = p => hasReach && p.reach != null ? p.reach : p.eng, unit = hasReach ? 'хүрээ' : 'оролцоо';
    const top = [...posts].sort((a, b) => b.eng - a.eng || (b.reach || 0) - (a.reach || 0)).slice(0, 6);
    const group = (keyOf) => { const m = new Map(); posts.forEach(p => { keyOf(p).forEach(k => { const g = m.get(k) || { name: k, posts: 0, eng: 0, reach: 0, reached: 0 }; g.posts++; g.eng += p.eng; if (p.reach != null) { g.reach += p.reach; g.reached++; } m.set(k, g); }); }); return [...m.values()].map(g => ({ ...g, avgEng: Math.round(g.eng / g.posts * 10) / 10, avgReach: g.reached ? Math.round(g.reach / g.reached) : null })); };
    const topics = group(p => { const t = TOPICS.filter(([, re]) => re.test(p.message || '')).map(([name]) => name); return t.length ? t : ['Бусад']; }).sort((a, b) => (hasReach ? (b.avgReach || 0) - (a.avgReach || 0) : b.avgEng - a.avgEng));
    const types = group(p => [MEDIA[p.media_type] || (p.media_type ? p.media_type : 'Тодорхойгүй')]).sort((a, b) => (hasReach ? (b.avgReach || 0) - (a.avgReach || 0) : b.avgEng - a.avgEng));
    const avg = (list, f) => list.length ? Math.round(list.reduce((t, p) => t + f(p), 0) / list.length * 10) / 10 : 0;
    const byDay = DAYS.map((_, k) => avg(posts.filter(p => ubParts(p.created_at)[0] === k), score));
    const bySlot = SLOTS.map(([, a, b]) => avg(posts.filter(p => { const h = ubParts(p.created_at)[1]; return h >= a && h < b; }), score));
    const ranks = (list) => { const max = Math.max(1, ...list.map(g => hasReach ? g.avgReach || 0 : g.avgEng)); return `<div class="crm-ranks">${list.map(g => { const v = hasReach ? g.avgReach || 0 : g.avgEng; return `<div class="crm-hbar2" tabindex="0" aria-label="${esc(g.name)}: ${g.posts} нийтлэл, дунджаар ${v} ${unit}"><span class="crm-hbar2-name">${esc(g.name)}</span><span class="crm-track"><i style="width:${v ? Math.max(2, v / max * 100) : 0}%;background:${C.leads}"></i></span><b>${num(v)}</b><small>${g.posts} нийтлэл · дунджаар ${g.avgEng} оролцоо</small></div>`; }).join('')}</div>`; };
    return `<section class="crm-card"><div class="crm-card-head"><h3>Шилдэг нийтлэл</h3><span>оролцоогоор${hasReach ? ' · хүрээ, оролцооны хувь' : ''}</span></div>
        ${top.map(p => `<div class="crm-post"><span class="crm-copy"><strong>${esc(p.message || 'Зураг, видео нийтлэл')}</strong><span>${esc(fmtDay(dayOf(p.created_at)))} · ${p.reach != null ? num(p.reach) + ' хүрээ · ' : ''}${p.reactions} reaction · ${p.comments} сэтгэгдэл · ${p.shares} хуваалцсан${p.reach ? ' · ' + Math.round(p.eng / p.reach * 1000) / 10 + '% оролцоо' : ''}</span></span>${p.permalink ? `<a href="${esc(p.permalink)}" target="_blank" rel="noopener">Нээх</a>` : ''}</div>`).join('')}</section>
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Сэдвээр</h3><span>нийтлэл тутамд дунджаар ${unit}</span></div>${ranks(topics)}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Контентын төрлөөр</h3><span>нийтлэл тутамд дунджаар ${unit}</span></div>${ranks(types)}</section>
      </div>
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Нийтэлсэн гараг</h3><span>нийтлэл тутамд дунджаар ${unit}</span></div>${columnsHtml(DAYS, byDay, () => C.leads, (l, v) => `${DAYS_LONG[DAYS.indexOf(l)]}: дунджаар ${v} ${unit}`)}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Нийтэлсэн цаг</h3><span>нийтлэл тутамд дунджаар ${unit}</span></div>${columnsHtml(SLOTS.map(([s]) => s), bySlot, () => C.leads, (l, v) => `${l}: дунджаар ${v} ${unit}`)}</section>
      </div>
      <section class="crm-card"><div class="crm-card-head"><h3>Дүгнэлт</h3><span>${posts.length} нийтлэлээс</span></div>${findingsHtml(fbFindings(F, { topics, types, byDay, bySlot, unit: hasReach ? 'хүрээтэй' : 'оролцоотой', hasReach }))}</section>`;
  }
  function fbFindings(F, A) {
    const out = [], T = F.T, posts = F.posts;
    if (T.reach) out.push(`Хүрсэн хүмүүсийн <b>${Math.round(T.engagements / T.reach * 1000) / 10}%</b> нь контенттой харилцсан (reaction, сэтгэгдэл, хуваалцалт, дарсан).`);
    if (S.range !== 'all' && F.P.reach) { const ch = Math.round((T.reach - F.P.reach) / F.P.reach * 100); out.push(`Хүрээ өмнөх ижил хугацаанаас ${ch >= 0 ? ch + '% өссөн' : Math.abs(ch) + '% буурсан'}.`); }
    const best = [...posts].sort((a, b) => b.eng - a.eng)[0];
    if (best?.eng) out.push(`Хамгийн их оролцоо авсан нийтлэл: “${esc((best.message || 'Зураг, видео нийтлэл').slice(0, 70))}${(best.message || '').length > 70 ? '…' : ''}” — ${best.eng} оролцоо${best.reach ? ', ' + num(best.reach) + ' хүнд хүрсэн' : ''}.`);
    const topics = A.topics.filter(g => g.posts >= 2 && g.name !== 'Бусад');
    if (topics.length >= 2) out.push(`<b>${esc(topics[0].name)}</b> сэдэвтэй нийтлэлүүд дунджаар хамгийн их ${A.unit} (${num(A.hasReach ? topics[0].avgReach : topics[0].avgEng)}), ${esc(topics[topics.length - 1].name)} хамгийн бага (${num(A.hasReach ? topics[topics.length - 1].avgReach : topics[topics.length - 1].avgEng)}).`);
    const types = A.types.filter(g => g.posts >= 2 && g.name !== 'Тодорхойгүй');
    if (types.length >= 2) out.push(`<b>${esc(types[0].name)}</b> төрлийн контент дунджаар хамгийн их ${A.unit}.`);
    if (posts.length >= 6) {
      const dayCounts = DAYS.map((_, k) => posts.filter(p => ubParts(p.created_at)[0] === k).length), slotCounts = SLOTS.map(([, a, b]) => posts.filter(p => { const h = ubParts(p.created_at)[1]; return h >= a && h < b; }).length);
      const d = A.byDay.map((v, k) => dayCounts[k] >= 2 ? v : -1), s = A.bySlot.map((v, k) => slotCounts[k] >= 2 ? v : -1);
      const bd = d.indexOf(Math.max(...d)), bs = s.indexOf(Math.max(...s));
      if (d[bd] > 0) out.push(`<b>${DAYS_LONG[bd]}</b> гарагт нийтэлсэн контент дунджаар хамгийн их ${A.unit}.`);
      if (s[bs] > 0) out.push(`<b>${SLOTS[bs][0]}</b> цагийн хооронд нийтэлсэн контент дунджаар хамгийн их ${A.unit}.`);
    }
    return out;
  }
  function drawMarketing(M) {
    if (M.W) lineChart(page.querySelector('[data-chart=web]'), M.W.points, [{ name: 'Үзэлт', color: C.leads, values: M.W.points.map(p => p.view) }, { name: '“Бүртгүүлэх” дарсан', color: C.enrolled, values: M.W.points.map(p => p.register) }]);
    if (M.F.days) {
      lineChart(page.querySelector('[data-chart=fb-reach]'), M.F.points, [{ name: 'Хүрээ', color: C.leads, values: M.F.points.map(p => p.reach) }]);
      lineChart(page.querySelector('[data-chart=fb-eng]'), M.F.points, [{ name: 'Оролцоо', color: C.leads, values: M.F.points.map(p => p.engagements) }]);
    }
  }

  load();
})();
