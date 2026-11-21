// Харилцагч (CRM) inside the staff dashboards. It opens like Файлууд: a menu button that shows a page in the workspace.
// Managers work their own and unassigned leads; leaders (ахлах менежер, салбарын захирал, ерөнхий захирал) also assign
// leads and see statistics. Data lives in Supabase (supabase/schema.sql: leads, crm_stats) behind row level security —
// this page only mirrors those rules. Website registrations arrive here as unassigned leads (source "Вэб сайт").
(() => {
  const menu = document.querySelector('.figma-menu'), hub = document.querySelector('#hub-profile');
  if (!menu || !hub) return;

  // ───────────── helpers
  const ZONE = 'Asia/Ulaanbaatar';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date());
  const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const dayOf = iso => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date(iso));
  const clock = iso => new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const fmtDay = d => { const t = today(); if (d === t) return 'Өнөөдөр'; if (d === addDays(t, -1)) return 'Өчигдөр'; const [y, m, dd] = d.split('-').map(Number); return `${m} сарын ${dd}` + (y !== Number(t.slice(0, 4)) ? `, ${y}` : ''); };
  const when = iso => { const d = dayOf(iso); return d === today() ? 'Өнөөдөр ' + clock(iso) : fmtDay(d); };
  const stamp = iso => fmtDay(dayOf(iso)) + ' ' + clock(iso);
  const money = n => new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0)) + '₮';
  const short = name => String(name || '').replace(/^Салбар\s*\d+\s*·\s*/, '').trim();
  const initials = name => short(name).split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const say = text => { if (typeof toast === 'function') toast(text); };

  const COURSES = ['Экскаватор оператор', 'Дамп оператор', 'Ковш оператор', 'Маникюр', 'Сормуус'];
  const SOURCES = { facebook: 'Facebook', messenger: 'Messenger', instagram: 'Instagram', web: 'Вэб сайт', phone: 'Утас', walk_in: 'Биеэр ирсэн', referral: 'Танилаар', other: 'Бусад' };
  const STATUS = { new: 'Шинэ', contacted: 'Холбогдсон', interested: 'Сонирхсон', enrolled: 'Элссэн', lost: 'Татгалзсан' };
  const OPEN = ['new', 'contacted', 'interested'];
  const ROLE = { general_director: 'Ерөнхий захирал', branch_director: 'Салбарын захирал', senior_manager: 'Ахлах менежер', manager: 'Менежер', teacher: 'Багш' };
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>';

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
  const S = { me: null, people: new Map(), leads: [], view: 'list', filter: 'open', q: '', branch: '', period: 'month', statsBranch: '', problem: '' };
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
      badge(); if (!page.hidden && !dialog.open) render();
    }).subscribe();
  }

  // New leads waiting for this person: their own new leads plus unassigned ones. Same red count as Мэдэгдэл.
  function badge() {
    const b = button.querySelector('.hub-unread'), n = S.me ? S.leads.filter(l => l.status === 'new' && (l.owner_id === S.me.id || !l.owner_id)).length : 0;
    b.textContent = n > 99 ? '99+' : String(n); b.hidden = !n; b.setAttribute('aria-label', n + ' шинэ харилцагч');
  }

  // ───────────── page
  function render() {
    if (S.problem || !S.me) { page.innerHTML = problemHtml(); page.querySelector('[data-act=signin]')?.addEventListener('click', signInAgain); page.querySelector('[data-act=retry]')?.addEventListener('click', () => { page.innerHTML = loadingHtml(); load(); }); if (!S.me && !S.problem) page.innerHTML = loadingHtml(); return; }
    const head = `<header class="library-header"><div><span class="library-eyebrow">ХАРИЛЦАГЧИЙН БҮРТГЭЛ</span><h1>Харилцагч</h1><p>${leader() ? 'Сургалтад сонирхсон хүмүүс, хариуцагч, элсэлт, статистик.' : 'Сургалтад сонирхсон хүмүүстэй холбогдож, элсэлт болгоно.'}</p></div><button type="button" class="library-upload" data-act="new"><span>+</span> Харилцагч нэмэх</button></header>`;
    const tabs = leader() ? `<div class="library-categories crm-views" role="group" aria-label="Харагдац"><button type="button" data-view="list" aria-pressed="${S.view === 'list'}">Жагсаалт</button><button type="button" data-view="stats" aria-pressed="${S.view === 'stats'}">Статистик</button></div>` : '';
    page.innerHTML = head + tabs + (leader() && S.view === 'stats' ? statsShell() : listHtml());
    page.querySelector('[data-act=new]').onclick = () => openLead(null);
    page.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; render(); });
    if (leader() && S.view === 'stats') loadStats(); else wireList();
  }
  const loadingHtml = () => '<div class="library-empty crm-empty"><h2>Ачаалж байна…</h2></div>';
  function problemHtml() {
    if (S.problem === 'session') return '<div class="library-empty crm-empty"><h2>Нэвтрэх хугацаа дууссан</h2><p>Харилцагчийн мэдээллийг харахын тулд дахин нэвтэрнэ үү.</p><button type="button" class="library-upload" data-act="signin">Дахин нэвтрэх</button></div>';
    if (S.problem === 'role') return '<div class="library-empty crm-empty"><h2>Харилцагчийн бүртгэл менежер, удирдлагад нээлттэй</h2></div>';
    if (S.problem === 'offline') return '<div class="library-empty crm-empty"><h2>Мэдээллийг ачаалж чадсангүй</h2><p>Интернэт холболтоо шалгаад дахин оролдоно уу.</p><button type="button" class="library-upload" data-act="retry">Дахин оролдох</button></div>';
    return loadingHtml();
  }
  function signInAgain() { try { localStorage.removeItem('rise-auth'); ['rise-demo-name', 'rise-demo-level', 'rise-demo-new-login'].forEach(k => sessionStorage.removeItem(k)); } catch {} location.href = 'staff.html'; }

  const FILTERS = [['open', 'Идэвхтэй'], ['mine', 'Минийх'], ['free', 'Хариуцагчгүй'], ['enrolled', 'Элссэн'], ['lost', 'Татгалзсан'], ['all', 'Бүгд']];
  const matches = (l, f) => f === 'all' ? true : f === 'open' ? OPEN.includes(l.status) : f === 'mine' ? l.owner_id === S.me.id : f === 'free' ? !l.owner_id : l.status === f;
  const inBranch = l => !S.branch || (S.branch === 'null' ? l.branch_id == null : String(l.branch_id) === S.branch);
  function listHtml() {
    const scope = S.leads.filter(inBranch), q = S.q.trim().toLowerCase();
    const shown = scope.filter(l => matches(l, S.filter) && (!q || (l.name + ' ' + (l.phone || '') + ' ' + (l.course || '') + ' ' + (l.note || '')).toLowerCase().includes(q)));
    const branches = lvl() === 4 ? `<select data-branch aria-label="Салбар"><option value="">Бүх салбар</option>${[1, 2, 3].map(b => `<option value="${b}" ${S.branch === String(b) ? 'selected' : ''}>Салбар ${b}</option>`).join('')}<option value="null" ${S.branch === 'null' ? 'selected' : ''}>Салбаргүй</option></select>` : '';
    const rows = shown.map(l => `<button type="button" class="crm-row" data-lead="${l.id}">
      <span class="crm-avatar s-${l.status}" aria-hidden="true">${esc(initials(l.name))}</span>
      <span class="crm-copy"><strong>${esc(l.name)}</strong><span>${esc([l.course, SOURCES[l.source] || l.source, when(l.created_at)].filter(Boolean).join(' · '))}</span></span>
      ${l.owner_id ? `<span class="crm-owner">${esc(short(nameOf(l.owner_id)))}</span>` : '<span class="crm-owner free">Хариуцагчгүй</span>'}
      <span class="crm-status s-${l.status}">${STATUS[l.status]}${l.status === 'enrolled' && l.amount ? ' · ' + money(l.amount) : ''}</span>
    </button>`).join('');
    const enrolled = scope.filter(l => l.status === 'enrolled');
    return `<div class="library-toolbar"><label class="library-search">${searchIcon}<input type="search" data-q placeholder="Нэр, утас, сургалтаар хайх…" aria-label="Харилцагч хайх" value="${esc(S.q)}"></label>${branches}</div>
      <div class="library-categories" role="group" aria-label="Шүүлт">${FILTERS.map(([k, label]) => `<button type="button" data-filter="${k}" aria-pressed="${S.filter === k}">${label} ${scope.filter(l => matches(l, k)).length}</button>`).join('')}</div>
      <div class="library-results crm-results" aria-live="polite">${rows || `<div class="library-empty"><h2>${S.leads.length ? 'Тохирох харилцагч олдсонгүй' : 'Харилцагч бүртгэгдээгүй байна'}</h2><p>${S.leads.length ? 'Шүүлт эсвэл хайлтаа өөрчилж үзээрэй.' : 'Facebook, утас, вэб сайтаар холбогдсон хүмүүсийг “Харилцагч нэмэх” товчоор оруулна. Вэб сайтаар бүртгүүлсэн хүмүүс энд автоматаар орж ирнэ.'}</p></div>`}</div>
      <footer class="library-footer"><span>${scope.length} харилцагч · ${enrolled.length} элссэн${enrolled.length ? ' · ' + money(enrolled.reduce((n, l) => n + Number(l.amount || 0), 0)) : ''}</span><span>Шинэчлэгдэх бүрд автоматаар орж ирнэ</span></footer>`;
  }
  function wireList() {
    const q = page.querySelector('[data-q]');
    q.oninput = () => { S.q = q.value; const pos = q.selectionStart; render(); const n = page.querySelector('[data-q]'); n.focus(); n.setSelectionRange(pos, pos); };
    page.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; render(); });
    const br = page.querySelector('[data-branch]'); if (br) br.onchange = () => { S.branch = br.value; render(); };
    page.querySelectorAll('[data-lead]').forEach(r => r.onclick = () => openLead(S.leads.find(l => l.id === r.dataset.lead)));
  }

  // ───────────── add / edit dialog (uses the dashboard's shared dialog styles)
  const dialog = document.createElement('dialog');
  dialog.className = 'crm-dialog'; dialog.setAttribute('aria-labelledby', 'crm-dialog-title');
  document.body.append(dialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (!page.hidden) render(); });

  // opt.note / opt.problem reopen a just-created lead whose note could not be saved, with the text kept.
  function openLead(l, opt = {}) {
    const editing = !!l, isLeader = leader(), people = isLeader ? owners() : [];
    const claim = editing && !l.owner_id && !isLeader;
    const meta = editing ? [SOURCES[l.source] || l.source, when(l.created_at), l.created_by ? 'Бүртгэсэн: ' + short(nameOf(l.created_by)) : 'Вэб сайтаас', l.preferred_time ? 'Тохиромжтой цаг: ' + l.preferred_time : ''].filter(Boolean).join(' · ') : 'Шинэ харилцагч бүртгэх';
    dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="Хаах">×</button>
      <h2 id="crm-dialog-title">${editing ? esc(l.name) : 'Харилцагч нэмэх'}</h2><p class="crm-dialog-meta">${esc(meta)}</p>
      <form class="crm-form" novalidate>
        <div class="crm-two"><label>Овог, нэр<input name="name" required maxlength="120" value="${esc(l?.name)}" autocomplete="off"></label>
        <label>Утас<input name="phone" type="tel" inputmode="tel" maxlength="20" value="${esc(l?.phone)}" placeholder="8 оронтой"></label></div>
        <div class="crm-two"><label>Сургалт<select name="course"><option value="">Сонгоогүй</option>${COURSES.concat(l?.course && !COURSES.includes(l.course) ? [l.course] : []).map(c => `<option ${l?.course === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label>Эх сурвалж<select name="source">${Object.entries(SOURCES).map(([k, v]) => `<option value="${k}" ${(l?.source || 'facebook') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
        <div class="crm-two"><label>Төлөв<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(l?.status || 'new') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
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
    if (opt.problem) { fail(opt.problem); form.note.focus(); } else form.name.focus();
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

  // ───────────── statistics (leaders)
  const PERIODS = [['today', 'Өнөөдөр'], ['week', '7 хоног'], ['month', 'Энэ сар'], ['quarter', '90 хоног']];
  function range(p) { const t = today(); return p === 'today' ? [t, t] : p === 'week' ? [addDays(t, -6), t] : p === 'month' ? [t.slice(0, 8) + '01', t] : [addDays(t, -89), t]; }
  function statsShell() {
    const branches = lvl() === 4 ? `<select data-stats-branch aria-label="Салбар"><option value="">Бүх салбар</option>${[1, 2, 3].map(b => `<option value="${b}" ${S.statsBranch === String(b) ? 'selected' : ''}>Салбар ${b}</option>`).join('')}</select>` : '';
    return `<div class="crm-stats-bar"><div class="library-categories" role="group" aria-label="Хугацаа">${PERIODS.map(([k, v]) => `<button type="button" data-period="${k}" aria-pressed="${S.period === k}">${v}</button>`).join('')}</div>${branches}</div>
      <div class="library-results crm-stats" aria-live="polite"><div class="library-empty crm-empty"><h2>Ачаалж байна…</h2></div></div>`;
  }
  async function loadStats() {
    page.querySelectorAll('[data-period]').forEach(b => b.onclick = () => { S.period = b.dataset.period; render(); });
    const sel = page.querySelector('[data-stats-branch]'); if (sel) sel.onchange = () => { S.statsBranch = sel.value; render(); };
    const [from, to] = range(S.period), box = page.querySelector('.crm-stats');
    const { data, error } = await RISE.sb.rpc('crm_stats', { p_from: from, p_to: to, p_branch: lvl() === 4 && S.statsBranch ? Number(S.statsBranch) : null });
    if (!box.isConnected) return;
    if (error) { box.innerHTML = `<div class="library-empty crm-empty"><h2>Статистик ачаалсангүй</h2><p>${esc(problemText(error))}</p></div>`; return; }
    box.innerHTML = statsHtml(data);
  }
  function statsHtml(d) {
    const T = d.totals || {}, conv = T.leads ? Math.round(T.enrolled / T.leads * 100) : 0;
    const days = d.by_day || [], maxD = Math.max(1, ...days.map(x => Math.max(x.leads, x.enrolled))), step = Math.max(1, Math.ceil(days.length / 10));
    const src = d.by_source || [], maxS = Math.max(1, ...src.map(s => s.leads));
    const ppl = (d.by_person || []).slice(0, 12), fb = d.facebook || {}, all = lvl() === 4 && !S.statsBranch;
    const kpi = (label, value, note) => `<article class="crm-kpi"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
    return `<div class="crm-kpis">
        ${kpi('Шинэ харилцагч', T.leads ?? 0, (T.uncontacted ?? 0) + ' нь холбогдоогүй хүлээж байна')}
        ${kpi('Элсэлт', T.enrolled ?? 0, 'Хөрвөлт ' + conv + '%')}
        ${kpi('Орлого (элсэлтээр)', money(T.revenue), T.enrolled ? 'Дундаж ' + money(T.revenue / T.enrolled) : 'Элсэлт бүртгэгдээгүй')}
        ${kpi('Анхны холбоо', T.avg_contact_hours == null ? '—' : T.avg_contact_hours + ' цаг', 'Холбогдох дундаж хугацаа')}
      </div>
      ${days.length > 1 ? `<section class="crm-card"><div class="crm-card-head"><h3>Өдөр тутам</h3><span class="crm-legend"><span><i></i>Харилцагч</span><span><i class="e"></i>Элсэлт</span></span></div>
        <div class="crm-bars">${days.map(x => `<div title="${esc(x.day)}: ${x.leads} харилцагч, ${x.enrolled} элсэлт"><i style="height:${x.leads / maxD * 100}%"></i><i class="e" style="height:${x.enrolled / maxD * 100}%"></i></div>`).join('')}</div>
        <div class="crm-bars-x">${days.map((x, i) => `<span>${i % step === 0 ? Number(x.day.slice(8)) : ''}</span>`).join('')}</div></section>` : ''}
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Эх сурвалж</h3><span>харилцагч / элсэлт</span></div>${src.length ? src.map(s => `<div class="crm-hbar"><span>${esc(SOURCES[s.source] || s.source)}</span><span class="crm-track"><i style="width:${s.leads / maxS * 100}%"></i></span><b>${s.leads} / ${s.enrolled}</b></div>`).join('') : '<p class="crm-none">Мэдээлэл алга</p>'}</section>
        <section class="crm-card"><div class="crm-card-head"><h3>Сургалтаар</h3></div>${(d.by_course || []).length ? `<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Сургалт</th><th>Харилцагч</th><th>Элсэлт</th><th>Орлого</th></tr></thead><tbody>${d.by_course.map(c => `<tr><td>${esc(c.course)}</td><td>${c.leads}</td><td>${c.enrolled}</td><td>${money(c.revenue)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="crm-none">Мэдээлэл алга</p>'}</section>
      </div>
      ${webHtml(d.web)}
      <div class="crm-two-cards">
        <section class="crm-card"><div class="crm-card-head"><h3>Менежерүүд</h3><span>орлогоор эрэмбэлсэн</span></div>${ppl.length ? ppl.map((p, i) => `<div class="crm-rank"><b>${i + 1}</b><span class="crm-avatar small" aria-hidden="true">${esc(initials(p.name))}</span><span class="crm-copy"><strong>${esc(short(p.name))}</strong><span>${ROLE[p.role] || ''}${all ? ' · ' + branchName(p.branch) : ''}</span></span><span class="crm-rank-num">${p.enrolled} элсэлт<strong>${money(p.revenue)}</strong></span></div>`).join('') : '<p class="crm-none">Менежер алга</p>'}</section>
        ${d.by_branch ? `<section class="crm-card"><div class="crm-card-head"><h3>Салбаруудаар</h3></div><div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Салбар</th><th>Харилцагч</th><th>Элсэлт</th><th>Орлого</th></tr></thead><tbody>${d.by_branch.map(b => `<tr><td>${esc(b.name)}</td><td>${b.leads}</td><td>${b.enrolled}</td><td>${money(b.revenue)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
      </div>
      <section class="crm-card"><div class="crm-card-head"><h3>Facebook хуудас</h3>${fb.status?.updated_at ? `<span>шинэчилсэн ${esc(when(fb.status.updated_at))}</span>` : ''}</div>
        ${fb.connected ? `<div class="crm-kpis">${kpi('Дагагч', fb.followers ?? '—', '+' + (fb.new_follows || 0) + ' энэ хугацаанд')}${kpi('Хүрээ', fb.reach || 0, 'Хүрсэн хүний тоо')}${kpi('Оролцоо', fb.engagements || 0, 'Reaction, сэтгэгдэл, хуваалцалт')}${kpi('Хуудас үзэлт', fb.page_views || 0, 'Энэ хугацаанд')}</div>
          ${(fb.top_posts || []).map(p => `<div class="crm-post"><span class="crm-copy"><strong>${esc(p.message || 'Зураг, видео нийтлэл')}</strong><span>${esc(fmtDay(dayOf(p.created_at)))} · ${p.reactions} reaction · ${p.comments} сэтгэгдэл · ${p.shares} хуваалцсан</span></span>${p.permalink ? `<a href="${esc(p.permalink)}" target="_blank" rel="noopener">Нээх</a>` : ''}</div>`).join('')}`
          : `<p class="crm-none">${esc(fb.status?.message || 'Хуудас холбогдоогүй байна. Хуудасны админ нэг удаа Page token үүсгэж Supabase-д хадгалахад дагагч, хүрээ, оролцоо, шилдэг нийтлэл өдөр бүр автоматаар орж ирнэ.')}</p><a class="crm-link" href="https://github.com/gamu666/rise/blob/main/supabase/FACEBOOK.md" target="_blank" rel="noopener">Холбох заавар</a>`}
      </section>`;
  }

  // Website interest (public.web_daily via crm_stats.web): course page views and "Бүртгүүлэх" clicks counted by the
  // public site without any visitor id, next to the web requests and enrolments for the same course.
  const WEB_PAGES = { home: 'Нүүр хуудас', ekskavator: 'Экскаватор оператор', damp: 'Дамп оператор', kovsh: 'Ковш оператор', manikyur: 'Маникюр', sormuus: 'Сормуус' };
  function webHtml(w) {
    if (!w) return '';
    const pages = new Map((w.pages || []).map(p => [p.page, p])), byCourse = new Map((w.leads || []).map(x => [x.course, x]));
    const total = key => (w.pages || []).reduce((n, p) => n + (Number(p[key]) || 0), 0), home = pages.get('home') || {};
    const slugs = [...new Set(Object.keys(WEB_PAGES).concat([...pages.keys()]))].filter(s => s !== 'home');
    const rows = slugs.map(s => { const p = pages.get(s) || {}, name = WEB_PAGES[s] || s, x = byCourse.get(name) || {}; return { name, view: p.view || 0, register: p.register || 0, leads: x.leads || 0, enrolled: x.enrolled || 0 }; })
      .sort((a, b) => b.view - a.view || b.leads - a.leads || a.name.localeCompare(b.name, 'mn'));
    return `<section class="crm-card crm-web"><div class="crm-card-head"><h3>Вэб сайт</h3><span>бүх салбар · ${total('view')} үзэлт</span></div>
      <div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Сургалтын хуудас</th><th>Үзсэн</th><th>Бүртгүүлэх дарсан</th><th>Бүртгэл</th><th>Элссэн</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.view}</td><td>${r.register}</td><td>${r.leads}</td><td>${r.enrolled}</td></tr>`).join('')}</tbody></table></div>
      <p class="crm-web-note">Нүүр хуудас ${home.view || 0} удаа нээгдэж, ${home.register || 0} удаа “Бүртгүүлэх” дарсан. Бүх хуудаснаас ${total('call')} удаа залгах, ${total('messenger')} удаа Messenger товч дарсан. Бүртгэл нь тухайн сургалтыг сонгож вэбээр бүртгүүлсэн хүмүүс. Нэг цонхонд хуудсыг дахин нээх, сэргээх нь нэмж тоологдохгүй.</p>
    </section>`;
  }

  load();
})();
