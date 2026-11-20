// THE RISE · work app. One page, hash routes, Supabase data with realtime updates.
// Permissions are enforced by Row Level Security in supabase/schema.sql; the UI only mirrors them.
(() => {
'use strict';
if (!window.RISE) { location.replace('staff.html'); return; }
const { sb, ROLE_LABEL } = window.RISE;

// ───────────────────────── helpers
const $ = (s, el = document) => el.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ZONE = 'Asia/Ulaanbaatar';
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date());
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const fmtDay = d => { if (!d) return ''; const [y, m, dd] = d.split('-').map(Number); const t = today(); if (d === t) return 'Өнөөдөр'; if (d === addDays(t, 1)) return 'Маргааш'; if (d === addDays(t, -1)) return 'Өчигдөр'; return `${m} сарын ${dd}` + (y !== Number(t.slice(0, 4)) ? `, ${y}` : ''); };
const fmtTime = iso => new Intl.DateTimeFormat('mn-MN', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
const dayOf = iso => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date(iso));
const ago = iso => { const d = dayOf(iso); return d === today() ? fmtTime(iso) : fmtDay(d); };
const money = n => new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0)) + '₮';
const initials = name => { const parts = String(name || '?').replace(/Салбар \d+ ·\s*/, '').trim().split(/\s+/); return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'; };
const av = (p, cls = '') => `<span class="av ${cls} t${(p?.level ?? 0) % 4}" aria-hidden="true">${esc(initials(p?.display_name))}</span>`;
const ICON = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
  tasks: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  team: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h1A5.5 5.5 0 0 1 15 18.5V20"/><path d="M16 4.5a3 3 0 0 1 0 6M18 13.5a5 5 0 0 1 3 4.5V20"/>',
  leads: '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/><path d="m20.2 18.2 1.8 1.8"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  accounts: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.5a3.6 3.6 0 0 1 6.4 0M14 10h4M14 13.5h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/>', back: '<path d="m15 5-7 7 7 7"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M2 2l8 8M10 2 2 10"/>', group: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M10.5 19a5.5 5.5 0 0 1 11 0"/>'
};
const svg = (name, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${ICON[name]}</svg>`;
const closeX = `<button class="x" type="button" data-close aria-label="Хаах"><svg viewBox="0 0 12 12">${ICON.x}</svg></button>`;

const COURSES = ['Экскаватор оператор', 'Дамп оператор', 'Ковш оператор', 'Маникюр', 'Сормуус'];
const SOURCES = { facebook: 'Facebook', messenger: 'Messenger', instagram: 'Instagram', web: 'Вэб сайт', phone: 'Утас', walk_in: 'Биеэр ирсэн', referral: 'Танилаар', other: 'Бусад' };
const LSTATUS = { new: ['Шинэ', 'info'], contacted: ['Холбогдсон', ''], interested: ['Сонирхсон', 'warn'], enrolled: ['Элссэн', 'ok'], lost: ['Татгалзсан', 'bad'] };

// ───────────────────────── state
const S = { me: null, people: new Map(), branches: new Map(), tasks: [], convs: [], leads: [], route: 'home', conv: null, msgs: new Map(), chatOpen: false, taskTab: null, taskFilter: 'active', teamBranch: 'all', leadFilter: 'open', statsPeriod: 'month', statsBranch: null };
const person = id => S.people.get(id);
const nameOf = id => person(id)?.display_name || 'Ажилтан';
const lvl = () => S.me.level;
const canAssign = p => !!p && p.active && lvl() >= 2 && p.level < lvl() && (lvl() === 4 || p.branch_id === S.me.branch_id) && p.hidden === S.me.hidden;
const branchName = b => b ? (S.branches.get(b)?.name || 'Салбар ' + b) : 'Бүх салбар';
const roleLine = p => p ? (ROLE_LABEL[p.role] || '') + (p.branch_id ? ' · ' + branchName(p.branch_id) : '') : '';

// ───────────────────────── toast & dialog
function toast(text, action) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { action.run(); t.remove(); }; t.append(b); }
  $('#toasts').append(t); setTimeout(() => t.remove(), action ? 7000 : 3600);
}
const dlg = $('#dlg');
function openDialog(html, onMount) {
  $('#dlg-body').innerHTML = html;
  dlg.querySelectorAll('[data-close]').forEach(b => b.onclick = () => dlg.close());
  if (!dlg.open) dlg.showModal();
  onMount?.($('#dlg-body'));
  const first = $('#dlg-body').querySelector('input:not([type=hidden]),textarea,select');
  first?.focus();
}
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
function formError(root, text) { let e = root.querySelector('.err'); if (!e) { e = document.createElement('p'); e.className = 'err'; e.setAttribute('role', 'alert'); root.querySelector('form')?.prepend(e); } e.textContent = text; e.hidden = !text; }
async function guard(btn, fn) { if (btn) btn.disabled = true; try { return await fn(); } finally { if (btn) btn.disabled = false; } }
const errText = e => RISE.message(e?.message ? e : String(e));

// ───────────────────────── data loading
async function loadPeople() {
  const [{ data: ppl, error }, { data: br }] = await Promise.all([
    sb.from('profiles').select('id,login,display_name,role,level,branch_id,phone,active,hidden').order('level', { ascending: false }).order('display_name'),
    sb.from('branches').select('*').order('id')
  ]);
  if (error) throw error;
  S.people = new Map(ppl.map(p => [p.id, p])); S.branches = new Map((br || []).map(b => [b.id, b]));
}
async function loadTasks() {
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data, error } = await sb.from('tasks').select('*').or(`status.eq.todo,updated_at.gte.${since}`).order('created_at', { ascending: false }).limit(800);
  if (error) throw error; S.tasks = data;
}
async function loadConvs() { const { data, error } = await sb.rpc('my_conversations'); if (error) throw error; S.convs = data || []; }
async function loadLeads() {
  if (lvl() < 1) { S.leads = []; return; }
  const { data, error } = await sb.from('leads').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) throw error; S.leads = data;
}

// ───────────────────────── badges & navigation
const NAV = [
  ['home', 'Нүүр', 0], ['tasks', 'Даалгавар', 0], ['chat', 'Чат', 0], ['team', 'Баг', 0],
  ['leads', 'Харилцагч', 1], ['stats', 'Статистик', 2], ['accounts', 'Данс', 4]
];
const unreadTotal = () => S.convs.reduce((n, c) => n + (c.unread || 0), 0);
const unseenTasks = () => S.tasks.filter(t => t.assignee === S.me.id && t.created_by !== S.me.id && !t.seen_at && t.status === 'todo').length;
function renderNav() {
  const counts = { chat: unreadTotal(), tasks: unseenTasks(), leads: S.leads.filter(l => l.status === 'new' && (l.owner_id === S.me.id || !l.owner_id)).length };
  $('#nav').innerHTML = NAV.filter(n => lvl() >= n[2]).map(([id, label]) =>
    `<a href="#/${id}" ${S.route === id ? 'aria-current="page"' : ''} ${['stats', 'accounts'].includes(id) ? 'class="more-only"' : ''}>${svg(id)}<span>${label}</span>${counts[id] ? `<span class="badge">${counts[id] > 99 ? '99+' : counts[id]}</span>` : ''}</a>`).join('');
  $('#me-link').toggleAttribute('aria-current', S.route === 'profile');
  if (S.route === 'profile') $('#me-link').setAttribute('aria-current', 'page');
  const total = counts.chat + counts.tasks;
  document.title = (total ? `(${total}) ` : '') + 'THE RISE — Ажлын систем';
}
function renderMe() {
  $('#me-av').outerHTML = av(S.me, 's').replace('class="av', 'id="me-av" class="av');
  $('#me-name').textContent = S.me.display_name; $('#me-role').textContent = roleLine(S.me);
}

// ───────────────────────── router
const VIEWS = {};
function route() {
  const [r, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const allowed = { home: 0, tasks: 0, chat: 0, team: 0, profile: 0, leads: 1, stats: 2, accounts: 4 };
  S.route = r in allowed && lvl() >= allowed[r] ? r : 'home';
  if (S.route !== r) { history.replaceState(null, '', '#/' + S.route); }
  if (S.route === 'chat') { S.conv = arg || S.conv; S.chatOpen = !!arg; }
  render();
  $('#main').focus({ preventScroll: true });
  scrollTo(0, 0);
}
function render() { renderNav(); VIEWS[S.route](); renderRail(); }
addEventListener('hashchange', route);

// ───────────────────────── tasks
const isDone = t => t.status === 'done';
const overdue = t => t.status === 'todo' && t.due_date && (t.due_date < today() || (t.due_date === today() && t.due_time && t.due_time.slice(0, 5) < fmtTime(new Date().toISOString())));
const byDue = (a, b) => (a.due_date || '9999') .localeCompare(b.due_date || '9999') || (a.due_time || '99').localeCompare(b.due_time || '99') || b.created_at.localeCompare(a.created_at);
function dueChip(t) {
  if (!t.due_date) return '';
  const label = fmtDay(t.due_date) + (t.due_time ? ' ' + t.due_time.slice(0, 5) : '');
  if (isDone(t)) return `<span class="chip">${esc(label)}</span>`;
  if (overdue(t)) return `<span class="chip bad">Хоцорсон · ${esc(label)}</span>`;
  if (t.due_date === today()) return `<span class="chip warn">${esc(label)}</span>`;
  return `<span class="chip">${esc(label)}</span>`;
}
function taskCard(t) {
  const mine = t.assignee === S.me.id, from = t.created_by !== S.me.id ? nameOf(t.created_by) : null, to = t.assignee !== S.me.id ? nameOf(t.assignee) : null;
  const who = from && to ? `${esc(from)} → ${esc(to)}` : from ? 'Өгсөн: ' + esc(from) : to ? 'Хэнд: ' + esc(to) : 'Өөрийн';
  const unseen = mine && !t.seen_at && t.created_by !== S.me.id;
  return `<article class="task ${isDone(t) ? 'done' : ''}" data-task="${t.id}">
    ${mine && t.status !== 'cancelled' ? `<button class="tick" type="button" data-tick="${t.id}" aria-label="${isDone(t) ? 'Дахин нээх' : 'Дууссан гэж тэмдэглэх'}">${svg('check')}</button>` : `<span class="av s ch" aria-hidden="true">${esc(initials(nameOf(t.assignee)))}</span>`}
    <div class="grow"><h3>${esc(t.title)}</h3>${t.description ? `<p>${esc(t.description)}</p>` : ''}
      <div class="meta">${t.priority ? '<span class="chip dark">Яаралтай</span>' : ''}${dueChip(t)}${t.status === 'cancelled' ? '<span class="chip">Цуцлагдсан</span>' : ''}<span>${who}</span>${!mine && t.seen_at && t.status === 'todo' ? '<span>· Үзсэн</span>' : ''}</div></div>
    ${unseen ? '<span class="new-dot" title="Шинэ"></span>' : ''}</article>`;
}
async function setStatus(id, status) {
  const t = S.tasks.find(x => x.id === id); if (!t) return;
  const prev = t.status; t.status = status; render();
  const { error } = await sb.from('tasks').update({ status }).eq('id', id);
  if (error) { t.status = prev; render(); toast(errText(error)); return; }
  toast(status === 'done' ? 'Дууссан гэж тэмдэглэлээ.' : status === 'cancelled' ? 'Даалгаврыг цуцаллаа.' : 'Дахин нээлээ.', status === 'done' ? { label: 'Буцаах', run: () => setStatus(id, 'todo') } : null);
}
async function markSeen(ids) {
  ids = ids.filter(id => { const t = S.tasks.find(x => x.id === id); return t && !t.seen_at && t.assignee === S.me.id; });
  if (!ids.length) return;
  const now = new Date().toISOString();
  S.tasks.forEach(t => { if (ids.includes(t.id)) t.seen_at = now; });
  await sb.from('tasks').update({ seen_at: now }).in('id', ids);
  renderNav();
}
document.addEventListener('click', e => {
  const tick = e.target.closest('[data-tick]');
  if (tick) { e.stopPropagation(); const t = S.tasks.find(x => x.id === tick.dataset.tick); if (t) setStatus(t.id, isDone(t) ? 'todo' : 'done'); return; }
  const card = e.target.closest('[data-task]');
  if (card) taskDetail(card.dataset.task);
});
function assignables() { return [...S.people.values()].filter(canAssign).sort((a, b) => b.level - a.level || (a.branch_id || 0) - (b.branch_id || 0) || a.display_name.localeCompare(b.display_name)); }
function taskForm(t, preset) {
  const editing = !!t, options = assignables();
  const sel = preset || t?.assignee || S.me.id;
  const groups = {};
  options.forEach(p => { const g = branchName(p.branch_id); (groups[g] ||= []).push(p); });
  openDialog(`<div class="dlg-head"><div><h2>${editing ? 'Даалгавар засах' : 'Шинэ даалгавар'}</h2>${editing ? '' : `<p>${options.length ? 'Өөртөө эсвэл багийн гишүүнд өгнө.' : 'Өөрийн ажлын жагсаалтад нэмнэ.'}</p>`}</div>${closeX}</div>
    <form id="task-form">
      <label class="field"><span>Гарчиг</span><input class="input" name="title" required maxlength="200" value="${esc(t?.title)}" placeholder="Юу хийх вэ?"></label>
      <label class="field"><span>Тайлбар</span><textarea class="input" name="description" maxlength="4000" rows="3" placeholder="Нэмэлт мэдээлэл (заавал биш)">${esc(t?.description)}</textarea></label>
      ${options.length && (!editing || t.created_by === S.me.id) ? `<label class="field"><span>Хэнд</span><select class="input" name="assignee"><option value="${S.me.id}">Өөртөө</option>${Object.entries(groups).map(([g, ps]) => `<optgroup label="${esc(g)}">${ps.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.display_name)} — ${esc(ROLE_LABEL[p.role])}</option>`).join('')}</optgroup>`).join('')}</select></label>` : ''}
      <div class="row"><label class="field"><span>Дуусах өдөр</span><input class="input" type="date" name="due_date" value="${esc(t?.due_date || '')}" min="${editing ? '' : today()}"></label>
      <label class="field"><span>Цаг</span><input class="input" type="time" name="due_time" value="${esc(t?.due_time?.slice(0, 5) || '')}"></label></div>
      <label class="check"><input type="checkbox" name="priority" ${t?.priority ? 'checked' : ''}> Яаралтай</label>
      <div class="dlg-foot"><button class="btn alt" type="button" data-close>Болих</button><button class="btn" type="submit">${editing ? 'Хадгалах' : 'Нэмэх'}</button></div>
    </form>`, root => {
    root.querySelector('form').onsubmit = async e => {
      e.preventDefault(); const f = e.target, btn = f.querySelector('[type=submit]');
      const row = { title: f.title.value.trim(), description: f.description.value.trim(), due_date: f.due_date.value || null, due_time: f.due_time.value || null, priority: f.priority.checked ? 1 : 0 };
      if (f.assignee) row.assignee = f.assignee.value; else if (!editing) row.assignee = S.me.id;
      if (!row.title) return formError(root, 'Гарчиг оруулна уу.');
      if (row.due_time && !row.due_date) row.due_date = today();
      await guard(btn, async () => {
        const q = editing ? sb.from('tasks').update(row).eq('id', t.id).select().single() : sb.from('tasks').insert(row).select().single();
        const { data, error } = await q;
        if (error) return formError(root, errText(error));
        const i = S.tasks.findIndex(x => x.id === data.id); if (i >= 0) S.tasks[i] = data; else S.tasks.unshift(data);
        dlg.close(); render();
        toast(editing ? 'Хадгаллаа.' : data.assignee === S.me.id ? 'Даалгавар нэмлээ.' : `${nameOf(data.assignee)}-д илгээлээ.`);
      });
    };
  });
}
function taskDetail(id) {
  const t = S.tasks.find(x => x.id === id); if (!t) return;
  if (t.assignee === S.me.id) markSeen([id]);
  const creator = t.created_by === S.me.id, assignee = t.assignee === S.me.id, other = creator ? t.assignee : t.created_by;
  openDialog(`<div class="dlg-head"><div><h2>${esc(t.title)}</h2><p>${t.priority ? 'Яаралтай · ' : ''}${isDone(t) ? 'Дууссан' : t.status === 'cancelled' ? 'Цуцлагдсан' : 'Хийгдэж байна'}</p></div>${closeX}</div>
    ${t.description ? `<p style="white-space:pre-wrap;margin:0 0 16px">${esc(t.description)}</p>` : ''}
    <dl class="kv"><dt>Өгсөн</dt><dd>${esc(nameOf(t.created_by))}</dd><dt>Хариуцагч</dt><dd>${esc(nameOf(t.assignee))}</dd>
    <dt>Хугацаа</dt><dd>${t.due_date ? esc(fmtDay(t.due_date) + (t.due_time ? ' ' + t.due_time.slice(0, 5) : '')) : 'Тохируулаагүй'}</dd>
    <dt>Үүсгэсэн</dt><dd>${esc(fmtDay(dayOf(t.created_at)) + ' ' + fmtTime(t.created_at))}</dd>
    ${t.created_by !== t.assignee ? `<dt>Үзсэн</dt><dd>${t.seen_at ? esc(fmtDay(dayOf(t.seen_at)) + ' ' + fmtTime(t.seen_at)) : 'Хараахан үзээгүй'}</dd>` : ''}
    ${t.completed_at ? `<dt>Дууссан</dt><dd>${esc(fmtDay(dayOf(t.completed_at)) + ' ' + fmtTime(t.completed_at))}</dd>` : ''}</dl>
    <div class="dlg-foot">
      ${creator && t.status !== 'cancelled' ? `<button class="btn danger" data-act="cancel">Цуцлах</button><button class="btn alt" data-act="edit">Засах</button>` : ''}
      ${creator && t.status === 'cancelled' ? `<button class="btn danger" data-act="delete">Устгах</button>` : ''}
      ${other !== S.me.id ? `<button class="btn alt" data-act="chat">${svg('chat')} Чат</button>` : ''}
      ${assignee && t.status === 'todo' ? `<button class="btn" data-act="done">${svg('check')} Дууссан</button>` : ''}
      ${assignee && t.status !== 'todo' ? `<button class="btn alt" data-act="reopen">Дахин нээх</button>` : ''}
    </div>`, root => {
    root.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
      const a = b.dataset.act;
      if (a === 'edit') return taskForm(t);
      if (a === 'chat') { dlg.close(); return openDirect(other); }
      if (a === 'delete') { await guard(b, async () => { const { error } = await sb.from('tasks').delete().eq('id', t.id); if (error) return toast(errText(error)); S.tasks = S.tasks.filter(x => x.id !== t.id); dlg.close(); render(); toast('Устгалаа.'); }); return; }
      dlg.close(); setStatus(t.id, a === 'done' ? 'done' : a === 'cancel' ? 'cancelled' : 'todo');
    });
  });
}
VIEWS.tasks = () => {
  const me = S.me.id, leader = lvl() >= 2;
  const tabs = [['inbox', 'Надад', t => t.assignee === me && t.created_by !== me], ['own', 'Өөрийн', t => t.assignee === me && t.created_by === me]];
  if (leader) tabs.push(['sent', 'Илгээсэн', t => t.created_by === me && t.assignee !== me], ['team', 'Багийн', t => t.created_by !== me && t.assignee !== me]);
  if (!S.taskTab || !tabs.some(x => x[0] === S.taskTab)) S.taskTab = 'inbox';
  const [, , test] = tabs.find(x => x[0] === S.taskTab);
  const rows = S.tasks.filter(test).filter(t => S.taskFilter === 'active' ? t.status === 'todo' : t.status !== 'todo').sort(S.taskFilter === 'active' ? byDue : (a, b) => b.updated_at.localeCompare(a.updated_at));
  const count = f => S.tasks.filter(f).filter(t => t.status === 'todo').length;
  $('#view').innerHTML = `<div class="page-head"><div><h1>Даалгавар</h1><p>${leader ? 'Өөрийн болон багийнхаа ажлыг нэг дороос.' : 'Танд ирсэн болон өөрийн ажил.'}</p></div><button class="btn" id="new-task">${svg('plus')} Шинэ даалгавар</button></div>
    <div class="toolbar"><div class="seg" role="group" aria-label="Төрөл">${tabs.map(([id, label, f]) => `<button data-tab="${id}" aria-pressed="${S.taskTab === id}">${label}${count(f) ? ' · ' + count(f) : ''}</button>`).join('')}</div><span class="grow"></span>
    <div class="seg" role="group" aria-label="Төлөв"><button data-filter="active" aria-pressed="${S.taskFilter === 'active'}">Идэвхтэй</button><button data-filter="closed" aria-pressed="${S.taskFilter !== 'active'}">Хаагдсан</button></div></div>
    <div id="task-list">${rows.length ? rows.map(taskCard).join('') : `<div class="card empty"><strong>${S.taskFilter === 'active' ? 'Идэвхтэй даалгавар алга' : 'Хаагдсан даалгавар алга'}</strong>${S.taskTab === 'inbox' ? 'Удирдлагаас ирсэн даалгавар энд харагдана.' : S.taskTab === 'sent' ? 'Багийнхандаа өгсөн даалгавар энд харагдана.' : ''}</div>`}</div>`;
  $('#new-task').onclick = () => taskForm();
  $('#view').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.taskTab = b.dataset.tab; VIEWS.tasks(); });
  $('#view').querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { S.taskFilter = b.dataset.filter; VIEWS.tasks(); });
  if (S.taskTab === 'inbox') markSeen(rows.map(t => t.id));
};
function renderRail() {
  const rail = $('#rail'); if (!rail) return;
  const mine = S.tasks.filter(t => t.assignee === S.me.id && t.status === 'todo').sort(byDue);
  const late = mine.filter(overdue), todays = mine.filter(t => !overdue(t) && t.due_date === today()), rest = mine.filter(t => !overdue(t) && t.due_date !== today());
  const sec = (title, list) => list.length ? `<div class="rail-sec">${title}</div>${list.slice(0, 8).map(taskCard).join('')}` : '';
  rail.innerHTML = `<h2>Миний ажил <button class="icon-btn" id="rail-add" aria-label="Шинэ даалгавар">${svg('plus')}</button></h2>
    ${mine.length ? sec('Хоцорсон', late) + sec('Өнөөдөр', todays) + sec('Дараа', rest) : '<div class="empty"><strong>Бүгд дууссан</strong>Шинэ ажил нэмэх бол + дарна уу.</div>'}`;
  $('#rail-add').onclick = () => taskForm();
}

// ───────────────────────── chat
const convTitle = c => c.kind === 'direct' ? nameOf(c.other_id) : c.kind === 'all' ? 'Бүх ажилтан' : c.title || 'Бүлэг';
const convSub = c => c.kind === 'direct' ? roleLine(person(c.other_id)) : c.kind === 'branch' ? 'Салбарын суваг' : c.kind === 'all' ? 'Байгууллагын суваг' : `${c.members} гишүүн`;
const convAv = c => c.kind === 'direct' ? av(person(c.other_id)) : `<span class="av ch" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7">${c.kind === 'group' ? ICON.group : ICON.chat}</svg></span>`;
async function openDirect(id) {
  const { data, error } = await sb.rpc('start_direct', { p_other: id });
  if (error) return toast(errText(error));
  await loadConvs(); location.hash = '#/chat/' + data;
}
async function loadMessages(cid, before) {
  let q = sb.from('messages').select('*').eq('conversation_id', cid).order('id', { ascending: false }).limit(60);
  if (before) q = q.lt('id', before);
  const { data, error } = await q; if (error) throw error;
  const list = data.reverse(); const cur = S.msgs.get(cid) || [];
  S.msgs.set(cid, before ? list.concat(cur) : list);
  return list.length;
}
function msgHtml(m, prev) {
  const mine = m.sender_id === S.me.id, sep = !prev || dayOf(prev.created_at) !== dayOf(m.created_at) ? `<div class="day-sep">${esc(fmtDay(dayOf(m.created_at)))}</div>` : '';
  if (m.kind === 'system') return sep + `<div class="sysmsg">${esc(m.body)} · ${fmtTime(m.created_at)}</div>`;
  const showWho = !mine && (!prev || prev.sender_id !== m.sender_id || prev.kind === 'system' || sep);
  let inner;
  if (m.kind === 'task') {
    const t = S.tasks.find(x => x.id === m.task_id);
    const st = !t ? '' : isDone(t) ? '<span class="chip ok">Дууссан</span>' : t.status === 'cancelled' ? '<span class="chip">Цуцлагдсан</span>' : overdue(t) ? '<span class="chip bad">Хоцорсон</span>' : '<span class="chip info">Хийгдэж байна</span>';
    inner = `<div class="taskmsg"><div class="k">ДААЛГАВАР</div><h4>${esc(m.body)}</h4><div class="meta" style="display:flex;gap:6px;flex-wrap:wrap">${st}${t ? dueChip(t) : ''}</div>
      ${t ? `<div class="actions"><button class="btn sm alt" data-task="${t.id}">Дэлгэрэнгүй</button>${t.assignee === S.me.id && t.status === 'todo' ? `<button class="btn sm" data-tick="${t.id}">Дууссан</button>` : ''}</div>` : ''}</div>`;
  } else inner = `<div class="bubble">${esc(m.body)}</div>`;
  return sep + `<div class="msg ${mine ? 'mine' : ''} ${m.deleted_at ? 'deleted' : ''}" data-mid="${m.id}">${showWho ? `<span class="who">${esc(nameOf(m.sender_id))}</span>` : ''}${inner}<span class="at">${fmtTime(m.created_at)}${m.edited_at ? ' · засварласан' : ''}</span></div>`;
}
VIEWS.chat = () => {
  const q = (S.chatQuery || '').toLowerCase();
  const list = S.convs.filter(c => !q || convTitle(c).toLowerCase().includes(q));
  const c = S.convs.find(x => x.id === S.conv);
  $('#view').innerHTML = `<div class="chat ${S.chatOpen && c ? 'open' : ''}">
    <section class="chat-list" aria-label="Яриа"><div class="head"><label class="search"><span class="sr">Хайх</span>${svg('search')}<input class="input" id="chat-q" type="search" placeholder="Хайх" value="${esc(S.chatQuery || '')}"></label>
      <button class="icon-btn" id="new-chat" aria-label="Шинэ яриа">${svg('plus')}</button></div>
      <div class="convs">${list.map(x => `<button class="conv" data-conv="${x.id}" aria-current="${x.id === S.conv}">${convAv(x)}<span class="grow"><strong class="trunc">${esc(convTitle(x))}</strong><small class="trunc">${esc(x.last_message_preview || convSub(x))}</small></span><time>${x.last_message_preview ? ago(x.last_message_at) : ''}</time>${x.unread ? `<span class="badge">${x.unread}</span>` : ''}</button>`).join('') || '<div class="empty small">Яриа олдсонгүй</div>'}</div></section>
    <section class="thread" aria-label="Зурвас">${c ? `<div class="thread-head"><button class="icon-btn back" id="chat-back" aria-label="Буцах">${svg('back')}</button>${convAv(c)}<div class="grow"><strong>${esc(convTitle(c))}</strong><small>${esc(convSub(c))}</small></div>
      ${c.kind === 'direct' && canAssign(person(c.other_id)) ? `<button class="btn sm alt" id="chat-task">${svg('tasks')} Даалгавар өгөх</button>` : ''}</div>
      <div class="msgs" id="msgs"><div class="empty small">Ачаалж байна…</div></div>
      <form class="composer" id="composer"><label class="sr" for="msg-text">Зурвас</label><textarea id="msg-text" rows="1" maxlength="4000" placeholder="Зурвас бичих…"></textarea><button class="send" aria-label="Илгээх">${svg('send')}</button></form>`
      : '<div class="empty" style="margin:auto"><strong>Яриа сонгоно уу</strong>Зүүн талын жагсаалтаас, эсвэл + дарж шинэ яриа эхлүүлнэ.</div>'}</section></div>`;
  const qi = $('#chat-q'); qi.oninput = () => { S.chatQuery = qi.value; const pos = qi.selectionStart; VIEWS.chat(); const n = $('#chat-q'); n.focus(); n.setSelectionRange(pos, pos); };
  $('#new-chat').onclick = newChatDialog;
  $('#view').querySelectorAll('[data-conv]').forEach(b => b.onclick = () => { location.hash = '#/chat/' + b.dataset.conv; });
  if (!c) return;
  $('#chat-back').onclick = () => { S.chatOpen = false; location.hash = '#/chat'; };
  if ($('#chat-task')) $('#chat-task').onclick = () => taskForm(null, c.other_id);
  const ta = $('#msg-text');
  ta.addEventListener('input', () => { ta.style.height = '44px'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#composer').requestSubmit(); } });
  $('#composer').onsubmit = async e => {
    e.preventDefault(); const body = ta.value.trim(); if (!body) return;
    ta.value = ''; ta.style.height = '44px';
    const { data, error } = await sb.from('messages').insert({ conversation_id: c.id, body }).select().single();
    if (error) { ta.value = body; return toast(errText(error)); }
    addMessage(data);
  };
  showThread(c.id);
};
async function showThread(cid) {
  if (!S.msgs.has(cid)) { try { await loadMessages(cid); } catch (e) { toast(errText(e)); } }
  paintThread(cid, true);
  const c = S.convs.find(x => x.id === cid);
  if (c?.unread) { c.unread = 0; renderNav(); sb.rpc('mark_read', { p_conversation: cid }); const b = $(`[data-conv="${cid}"] .badge`); b?.remove(); }
  if (window.matchMedia('(min-width:761px)').matches) $('#msg-text')?.focus();
}
function paintThread(cid, toBottom) {
  const box = $('#msgs'); if (!box || S.conv !== cid) return;
  const list = S.msgs.get(cid) || [], atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = (list.length >= 60 ? '<button class="btn sm ghost" id="older" style="align-self:center">Өмнөх зурвас</button>' : '') +
    (list.length ? list.map((m, i) => msgHtml(m, list[i - 1])).join('') : '<div class="empty small" style="margin:auto">Анхны зурвасаа бичээрэй.</div>');
  if (toBottom || atBottom) box.scrollTop = box.scrollHeight;
  const older = $('#older'); if (older) older.onclick = async () => { const h = box.scrollHeight; const n = await loadMessages(cid, list[0].id); paintThread(cid); box.scrollTop = box.scrollHeight - h; if (!n) older.remove(); };
}
function addMessage(m) {
  const list = S.msgs.get(m.conversation_id);
  if (list && !list.some(x => x.id === m.id)) list.push(m);
  const c = S.convs.find(x => x.id === m.conversation_id);
  if (c) { c.last_message_at = m.created_at; c.last_message_preview = m.body.slice(0, 140); S.convs.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at)); }
  if (S.route === 'chat' && S.conv === m.conversation_id) {
    paintThread(m.conversation_id, m.sender_id === S.me.id);
    if (m.sender_id !== S.me.id && document.visibilityState === 'visible') sb.rpc('mark_read', { p_conversation: m.conversation_id });
    const listEl = $('.convs'); if (listEl) { /* refresh preview without losing the thread */ const keep = $('#msg-text')?.value; VIEWS.chat(); if (keep) $('#msg-text').value = keep; }
  }
}
function newChatDialog() {
  const people = [...S.people.values()].filter(p => p.id !== S.me.id && p.active && p.hidden === S.me.hidden);
  openDialog(`<div class="dlg-head"><div><h2>Шинэ яриа</h2><p>Нэг хүнийг сонгож шууд чат, олныг сонгож бүлэг үүсгэнэ.</p></div>${closeX}</div>
    <form id="nc"><label class="search field"><span class="sr">Хайх</span>${svg('search')}<input class="input" id="nc-q" type="search" placeholder="Нэр, албан тушаал, салбар"></label>
    <div class="list" id="nc-list" style="max-height:320px;overflow:auto"></div>
    <label class="field" id="nc-title-wrap" hidden><span>Бүлгийн нэр</span><input class="input" name="title" maxlength="80" placeholder="Жишээ нь: Маркетингийн баг"></label>
    <div class="dlg-foot"><button class="btn alt" type="button" data-close>Болих</button><button class="btn" type="submit" id="nc-go" disabled>Эхлүүлэх</button></div></form>`, root => {
    const picked = new Set(), listEl = root.querySelector('#nc-list'), q = root.querySelector('#nc-q');
    const paint = () => {
      const s = q.value.toLowerCase();
      listEl.innerHTML = people.filter(p => !s || (p.display_name + ' ' + roleLine(p)).toLowerCase().includes(s)).map(p => `<label class="item" style="cursor:pointer"><input type="checkbox" value="${p.id}" ${picked.has(p.id) ? 'checked' : ''} style="width:18px;height:18px;accent-color:#1d1d1f">${av(p, 's')}<span class="grow"><strong class="trunc" style="display:block">${esc(p.display_name)}</strong><small class="muted">${esc(roleLine(p))}</small></span></label>`).join('') || '<div class="empty small">Олдсонгүй</div>';
      listEl.querySelectorAll('input').forEach(i => i.onchange = () => { i.checked ? picked.add(i.value) : picked.delete(i.value); root.querySelector('#nc-title-wrap').hidden = picked.size < 2; root.querySelector('#nc-go').disabled = !picked.size; root.querySelector('#nc-go').textContent = picked.size > 1 ? 'Бүлэг үүсгэх' : 'Эхлүүлэх'; });
    };
    q.oninput = paint; paint();
    root.querySelector('form').onsubmit = async e => {
      e.preventDefault(); const ids = [...picked];
      if (ids.length === 1) { dlg.close(); return openDirect(ids[0]); }
      const title = e.target.title.value.trim(); if (!title) return formError(root, 'Бүлгийн нэр оруулна уу.');
      const { data, error } = await sb.rpc('create_group', { p_title: title, p_members: ids });
      if (error) return formError(root, errText(error));
      dlg.close(); await loadConvs(); location.hash = '#/chat/' + data;
    };
  });
}

// ───────────────────────── team
VIEWS.team = () => {
  const all = [...S.people.values()].filter(p => p.active && p.hidden === S.me.hidden);
  const gd = lvl() === 4;
  const scope = gd ? S.teamBranch : 'all';
  const q = (S.teamQuery || '').toLowerCase();
  const shown = all.filter(p => (scope === 'all' || p.branch_id === Number(scope) || (p.level === 4 && scope === 'all')) && (!q || (p.display_name + ' ' + p.login + ' ' + roleLine(p)).toLowerCase().includes(q)));
  const groups = new Map();
  shown.sort((a, b) => b.level - a.level || a.display_name.localeCompare(b.display_name, 'mn')).forEach(p => { const k = p.branch_id || 0; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
  const card = p => `<article class="card person"><div class="top">${av(p, 'l')}<div class="grow" style="min-width:0"><strong class="trunc">${esc(p.display_name)}</strong><small>${esc(ROLE_LABEL[p.role])}${p.phone ? ' · ' + esc(p.phone) : ''}</small></div></div>
    <div class="acts">${p.id !== S.me.id ? `<button class="btn sm alt" data-dm="${p.id}">${svg('chat')} Зурвас</button>` : '<span class="chip">Та</span>'}${canAssign(p) ? `<button class="btn sm alt" data-assign="${p.id}">${svg('tasks')} Даалгавар</button>` : ''}</div></article>`;
  $('#view').innerHTML = `<div class="page-head"><div><h1>Баг</h1><p>${all.length} ажилтан · албан тушаалаар эрэмбэлсэн</p></div></div>
    <div class="toolbar">${gd ? `<div class="seg" role="group" aria-label="Салбар"><button data-b="all" aria-pressed="${scope === 'all'}">Бүх салбар</button>${[...S.branches.values()].map(b => `<button data-b="${b.id}" aria-pressed="${String(scope) === String(b.id)}">${esc(b.name)}</button>`).join('')}</div>` : ''}
    <span class="grow"></span><label class="search" style="width:min(320px,100%)"><span class="sr">Хайх</span>${svg('search')}<input class="input" id="team-q" type="search" placeholder="Нэр, албан тушаал" value="${esc(S.teamQuery || '')}"></label></div>
    ${[...groups.entries()].sort((a, b) => a[0] - b[0]).map(([b, ps]) => `<div class="branch-head"><h2>${b ? esc(branchName(b)) : 'Удирдлага'}</h2><span class="muted small">${ps.length}</span></div><div class="people">${ps.map(card).join('')}</div>`).join('') || '<div class="card empty"><strong>Олдсонгүй</strong></div>'}`;
  $('#view').querySelectorAll('[data-b]').forEach(b => b.onclick = () => { S.teamBranch = b.dataset.b; VIEWS.team(); });
  const qi = $('#team-q'); qi.oninput = () => { S.teamQuery = qi.value; VIEWS.team(); const n = $('#team-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  $('#view').querySelectorAll('[data-dm]').forEach(b => b.onclick = () => openDirect(b.dataset.dm));
  $('#view').querySelectorAll('[data-assign]').forEach(b => b.onclick = () => taskForm(null, b.dataset.assign));
};

// ───────────────────────── CRM leads
const statusChip = s => `<span class="chip ${LSTATUS[s][1]}">${LSTATUS[s][0]}</span>`;
VIEWS.leads = () => {
  const f = S.leadFilter, q = (S.leadQuery || '').toLowerCase();
  const visible = S.leads.filter(l => (f === 'all' || (f === 'open' ? ['new', 'contacted', 'interested'].includes(l.status) : f === 'mine' ? l.owner_id === S.me.id : f === 'free' ? !l.owner_id : l.status === f))
    && (!q || (l.name + ' ' + (l.phone || '') + ' ' + (l.course || '')).toLowerCase().includes(q)));
  const n = s => S.leads.filter(l => l.status === s).length;
  $('#view').innerHTML = `<div class="page-head"><div><h1>Харилцагч</h1><p>Сургалтад сонирхсон хүмүүс ба элсэлт.</p></div><button class="btn" id="new-lead">${svg('plus')} Харилцагч нэмэх</button></div>
    <div class="toolbar"><div class="seg" role="group" aria-label="Шүүлт">${[['open', 'Идэвхтэй'], ['free', 'Хариуцагчгүй'], ['mine', 'Минийх'], ['enrolled', 'Элссэн · ' + n('enrolled')], ['lost', 'Татгалзсан'], ['all', 'Бүгд']].map(([k, l]) => `<button data-lf="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
    <span class="grow"></span><label class="search" style="width:min(300px,100%)"><span class="sr">Хайх</span>${svg('search')}<input class="input" id="lead-q" type="search" placeholder="Нэр, утас, сургалт" value="${esc(S.leadQuery || '')}"></label></div>
    <div class="card" style="padding:4px 8px">${visible.length ? `<div class="scroll-x"><table class="table"><thead><tr><th>Нэр</th><th>Сургалт</th><th>Эх сурвалж</th><th>Хариуцагч</th><th>Төлөв</th><th class="num">Огноо</th></tr></thead><tbody>
      ${visible.map(l => `<tr class="click" data-lead="${l.id}"><td><strong>${esc(l.name)}</strong><br><span class="muted small">${esc(l.phone || '')}</span></td><td>${esc(l.course || '—')}</td><td>${esc(SOURCES[l.source] || l.source)}</td><td>${l.owner_id ? esc(nameOf(l.owner_id)) : '<span class="chip info">Хариуцагчгүй</span>'}</td><td>${statusChip(l.status)}${l.status === 'enrolled' && l.amount ? `<br><span class="small muted">${money(l.amount)}</span>` : ''}</td><td class="num small muted">${esc(ago(l.created_at))}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty"><strong>Харилцагч алга</strong>Facebook, утас, вэбээр холбогдсон хүмүүсийг энд нэмнэ.</div>'}</div>`;
  $('#new-lead').onclick = () => leadForm();
  $('#view').querySelectorAll('[data-lf]').forEach(b => b.onclick = () => { S.leadFilter = b.dataset.lf; VIEWS.leads(); });
  const qi = $('#lead-q'); qi.oninput = () => { S.leadQuery = qi.value; VIEWS.leads(); const x = $('#lead-q'); x.focus(); x.setSelectionRange(x.value.length, x.value.length); };
  $('#view').querySelectorAll('[data-lead]').forEach(r => r.onclick = () => leadForm(S.leads.find(l => l.id === r.dataset.lead)));
};
function leadForm(l) {
  const editing = !!l, owners = [S.me, ...assignables().filter(p => p.level >= 1)];
  openDialog(`<div class="dlg-head"><div><h2>${editing ? esc(l.name) : 'Харилцагч нэмэх'}</h2>${editing ? `<p>${esc(SOURCES[l.source])} · ${esc(fmtDay(dayOf(l.created_at)))}${l.created_by ? ' · ' + esc(nameOf(l.created_by)) : ''}</p>` : ''}</div>${closeX}</div>
    <form id="lead-form">
      <div class="row"><label class="field"><span>Нэр</span><input class="input" name="name" required maxlength="120" value="${esc(l?.name)}"></label>
      <label class="field"><span>Утас</span><input class="input" name="phone" inputmode="tel" maxlength="20" value="${esc(l?.phone)}" placeholder="8 оронтой"></label></div>
      <div class="row"><label class="field"><span>Сургалт</span><select class="input" name="course"><option value="">Сонгоогүй</option>${COURSES.map(c => `<option ${l?.course === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span>Эх сурвалж</span><select class="input" name="source">${Object.entries(SOURCES).map(([k, v]) => `<option value="${k}" ${(l?.source || 'facebook') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
      <div class="row"><label class="field"><span>Төлөв</span><select class="input" name="status">${Object.entries(LSTATUS).map(([k, v]) => `<option value="${k}" ${(l?.status || 'new') === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
      <label class="field"><span>Төлбөр (элссэн бол)</span><input class="input" name="amount" type="number" min="0" step="1000" value="${esc(l?.amount ?? '')}" placeholder="₮"></label></div>
      ${lvl() >= 2 ? `<label class="field"><span>Хариуцагч</span><select class="input" name="owner"><option value="">Хариуцагчгүй</option>${owners.map(p => `<option value="${p.id}" ${l?.owner_id === p.id ? 'selected' : ''}>${esc(p.display_name)}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Тэмдэглэл</span><textarea class="input" name="note" rows="3" maxlength="2000">${esc(l?.note)}</textarea></label>
      <div class="dlg-foot">${editing && lvl() >= 2 ? '<button class="btn danger" type="button" id="lead-del">Устгах</button>' : ''}${editing && !l.owner_id && lvl() === 1 ? '<button class="btn alt" type="button" id="lead-claim">Би хариуцъя</button>' : ''}<button class="btn alt" type="button" data-close>Болих</button><button class="btn" type="submit">${editing ? 'Хадгалах' : 'Нэмэх'}</button></div>
    </form>`, root => {
    const f = root.querySelector('form');
    const save = async (extra = {}) => {
      const row = { name: f.name.value.trim(), phone: f.phone.value.replace(/[^\d+ ]/g, '').trim() || null, course: f.course.value || null, source: f.source.value, status: f.status.value, amount: f.amount.value === '' ? null : Number(f.amount.value), note: f.note.value.trim() || null, ...extra };
      if (f.owner) row.owner_id = f.owner.value || null;
      if (!row.name) return formError(root, 'Нэр оруулна уу.');
      if (row.status === 'enrolled' && !row.amount) return formError(root, 'Элссэн бол төлбөрийн дүнг оруулна уу.');
      const q = editing ? sb.from('leads').update(row).eq('id', l.id).select().single() : sb.from('leads').insert(row).select().single();
      const { data, error } = await q; if (error) return formError(root, errText(error));
      const i = S.leads.findIndex(x => x.id === data.id); if (i >= 0) S.leads[i] = data; else S.leads.unshift(data);
      dlg.close(); render(); toast(editing ? 'Хадгаллаа.' : 'Харилцагч нэмлээ.');
    };
    f.onsubmit = e => { e.preventDefault(); guard(f.querySelector('[type=submit]'), () => save()); };
    root.querySelector('#lead-claim')?.addEventListener('click', () => save({ owner_id: S.me.id, branch_id: S.me.branch_id }));
    root.querySelector('#lead-del')?.addEventListener('click', async () => {
      if (!confirm('Энэ харилцагчийг устгах уу?')) return;
      const { error } = await sb.from('leads').delete().eq('id', l.id); if (error) return formError(root, errText(error));
      S.leads = S.leads.filter(x => x.id !== l.id); dlg.close(); render(); toast('Устгалаа.');
    });
  });
}

// ───────────────────────── statistics (leaders)
function periodRange(p) {
  const t = today();
  if (p === 'today') return [t, t];
  if (p === 'week') return [addDays(t, -6), t];
  if (p === 'month') return [t.slice(0, 8) + '01', t];
  return [addDays(t, -89), t];
}
VIEWS.stats = async () => {
  const gd = lvl() === 4, [from, to] = periodRange(S.statsPeriod);
  $('#view').innerHTML = `<div class="page-head"><div><h1>Статистик</h1><p>${gd ? 'Бүх салбарын' : esc(branchName(S.me.branch_id)) + '-ын'} харилцагч, элсэлт, орлого ба Facebook хуудас.</p></div></div>
    <div class="toolbar"><div class="seg" role="group" aria-label="Хугацаа">${[['today', 'Өнөөдөр'], ['week', '7 хоног'], ['month', 'Энэ сар'], ['quarter', '90 хоног']].map(([k, v]) => `<button data-p="${k}" aria-pressed="${S.statsPeriod === k}">${v}</button>`).join('')}</div>
    ${gd ? `<div class="seg" role="group" aria-label="Салбар"><button data-sb="" aria-pressed="${!S.statsBranch}">Бүх салбар</button>${[...S.branches.values()].map(b => `<button data-sb="${b.id}" aria-pressed="${S.statsBranch === b.id}">${esc(b.name)}</button>`).join('')}</div>` : ''}</div>
    <div id="stats-body"><div class="card empty"><div class="spinner" style="margin:auto"></div></div></div>`;
  $('#view').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { S.statsPeriod = b.dataset.p; VIEWS.stats(); });
  $('#view').querySelectorAll('[data-sb]').forEach(b => b.onclick = () => { S.statsBranch = b.dataset.sb ? Number(b.dataset.sb) : null; VIEWS.stats(); });
  const { data, error } = await sb.rpc('crm_stats', { p_from: from, p_to: to, p_branch: gd ? S.statsBranch : null });
  const body = $('#stats-body'); if (!body || S.route !== 'stats') return;
  if (error) { body.innerHTML = `<div class="card empty"><strong>Статистик ачаалсангүй</strong>${esc(errText(error))}</div>`; return; }
  const T = data.totals, conv = T.leads ? Math.round(T.enrolled / T.leads * 100) : 0;
  const days = data.by_day || [], maxD = Math.max(1, ...days.map(d => Math.max(d.leads, d.enrolled)));
  const step = Math.max(1, Math.ceil(days.length / 10));
  const src = data.by_source || [], maxS = Math.max(1, ...src.map(s => s.leads));
  const people = (data.by_person || []).slice(0, 12), fb = data.facebook || {};
  body.innerHTML = `<div class="grid g4">
      <div class="card kpi"><span>Шинэ харилцагч</span><strong>${T.leads}</strong><small>${T.uncontacted} нь холбогдоогүй хүлээж байна</small></div>
      <div class="card kpi"><span>Элсэлт</span><strong>${T.enrolled}</strong><small>Хөрвөлт ${conv}%</small></div>
      <div class="card kpi"><span>Орлого (элсэлтээр)</span><strong>${money(T.revenue)}</strong><small>${T.enrolled ? 'Дундаж ' + money(T.revenue / T.enrolled) : 'Элсэлт бүртгэгдээгүй'}</small></div>
      <div class="card kpi"><span>Анхны холбоо</span><strong>${T.avg_contact_hours == null ? '—' : T.avg_contact_hours + ' цаг'}</strong><small>Харилцагчтай холбогдох дундаж хугацаа</small></div></div>
    ${days.length > 1 ? `<div class="card" style="margin-top:16px"><div class="toolbar" style="margin:0 0 6px"><strong>Өдөр тутам</strong><span class="grow"></span><span class="legend"><span><i></i>Харилцагч</span><span><i class="e"></i>Элсэлт</span></span></div>
      <div class="bars">${days.map(d => `<div class="b" title="${esc(d.day)}: ${d.leads} харилцагч, ${d.enrolled} элсэлт"><i style="height:${d.leads / maxD * 100}%"></i><i class="e" style="height:${d.enrolled / maxD * 100}%"></i></div>`).join('')}</div>
      <div class="bars-x">${days.map((d, i) => `<span>${i % step === 0 ? Number(d.day.slice(8)) : ''}</span>`).join('')}</div></div>` : ''}
    <div class="grid g2" style="margin-top:16px">
      <div class="card"><strong>Эх сурвалж</strong><div style="margin-top:10px">${src.length ? src.map(s => `<div class="hbar"><span class="trunc">${esc(SOURCES[s.source] || s.source)}</span><span class="track"><i style="width:${s.leads / maxS * 100}%"></i></span><span class="num">${s.leads} / ${s.enrolled}</span></div>`).join('') + '<p class="small muted" style="margin:8px 0 0">харилцагч / элсэлт</p>' : '<div class="empty small">Мэдээлэл алга</div>'}</div></div>
      <div class="card"><strong>Сургалтаар</strong>${(data.by_course || []).length ? `<table class="table" style="margin-top:6px"><thead><tr><th>Сургалт</th><th class="num">Харилцагч</th><th class="num">Элсэлт</th><th class="num">Орлого</th></tr></thead><tbody>${data.by_course.map(c => `<tr><td>${esc(c.course)}</td><td class="num">${c.leads}</td><td class="num">${c.enrolled}</td><td class="num">${money(c.revenue)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty small">Мэдээлэл алга</div>'}</div></div>
    <div class="grid ${data.by_branch ? 'g2' : ''}" style="margin-top:16px">
      <div class="card"><strong>Менежерүүдийн гүйцэтгэл</strong><p class="small muted" style="margin:2px 0 8px">Орлогоор эрэмбэлсэн</p><div class="podium">${people.length ? people.map((p, i) => `<div class="rank"><span class="n">${i + 1}</span>${av(person(p.id) || { display_name: p.name, level: 1 }, 's')}<span class="grow trunc">${esc(p.name)}<br><span class="small muted">${esc(ROLE_LABEL[p.role])}${gd && !S.statsBranch ? ' · ' + esc(branchName(p.branch)) : ''}</span></span><span class="num small">${p.enrolled} элсэлт<br><strong>${money(p.revenue)}</strong></span></div>`).join('') : '<div class="empty small">Менежер алга</div>'}</div></div>
      ${data.by_branch ? `<div class="card"><strong>Салбаруудаар</strong><table class="table" style="margin-top:6px"><thead><tr><th>Салбар</th><th class="num">Харилцагч</th><th class="num">Элсэлт</th><th class="num">Орлого</th></tr></thead><tbody>${data.by_branch.map(b => `<tr><td>${esc(b.name)}</td><td class="num">${b.leads}</td><td class="num">${b.enrolled}</td><td class="num">${money(b.revenue)}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>
    <h2 class="sec">Facebook хуудас</h2>
    ${fb.connected ? `<div class="grid g4"><div class="card kpi"><span>Дагагч</span><strong>${fb.followers ?? '—'}</strong><small>+${fb.new_follows} энэ хугацаанд</small></div><div class="card kpi"><span>Хүрээ (reach)</span><strong>${fb.reach}</strong><small>Хүрсэн хүний тоо</small></div><div class="card kpi"><span>Оролцоо</span><strong>${fb.engagements}</strong><small>Reaction, сэтгэгдэл, хуваалцалт</small></div><div class="card kpi"><span>Хуудас үзэлт</span><strong>${fb.page_views}</strong><small>${fb.status?.updated_at ? 'Шинэчилсэн ' + esc(ago(fb.status.updated_at)) : ''}</small></div></div>
      <div class="card" style="margin-top:16px"><strong>Шилдэг нийтлэлүүд</strong><div class="list" style="margin-top:6px">${(fb.top_posts || []).map(p => `<div class="item"><span class="grow"><span class="trunc" style="display:block">${esc(p.message || 'Зураг/видео нийтлэл')}</span><span class="small muted">${esc(fmtDay(dayOf(p.created_at)))} · ${p.reactions} reaction · ${p.comments} сэтгэгдэл · ${p.shares} хуваалцсан</span></span>${p.permalink ? `<a class="btn sm alt" href="${esc(p.permalink)}" target="_blank" rel="noopener">Нээх</a>` : ''}</div>`).join('') || '<div class="empty small">Энэ хугацаанд нийтлэл алга</div>'}</div></div>`
      : `<div class="card"><strong>Facebook хуудас холбогдоогүй байна</strong><p class="muted" style="margin:6px 0 0">${fb.status?.message ? esc(fb.status.message) : 'Хуудасны дагагч, хүрээ, оролцоо, шилдэг нийтлэлийг өдөр бүр автоматаар татна. Холбохын тулд хуудасны админ нэг удаа Page token үүсгэж Supabase-д хадгална.'}</p><p style="margin:10px 0 0"><a class="btn sm alt" href="https://github.com/gamu666/rise/blob/main/supabase/FACEBOOK.md" target="_blank" rel="noopener">Холбох заавар</a></p></div>`}`;
};

// ───────────────────────── accounts (general director)
VIEWS.accounts = async () => {
  $('#view').innerHTML = `<div class="page-head"><div><h1>Данс</h1><p>Ажилтны нэвтрэх эрх, албан тушаал, нууц үг.</p></div><button class="btn" id="new-acc">${svg('plus')} Данс нээх</button></div><div id="acc-body"><div class="card empty"><div class="spinner" style="margin:auto"></div></div></div>`;
  $('#new-acc').onclick = () => accountForm();
  const { data, error } = await sb.rpc('admin_accounts');
  const body = $('#acc-body'); if (!body || S.route !== 'accounts') return;
  if (error) { body.innerHTML = `<div class="card empty"><strong>Ачаалсангүй</strong>${esc(errText(error))}</div>`; return; }
  S.accounts = data;
  body.innerHTML = `<div class="card" style="padding:4px 8px"><div class="scroll-x"><table class="table"><thead><tr><th>Нэр</th><th>Нэвтрэх нэр</th><th>Албан тушаал</th><th>Салбар</th><th>Төлөв</th><th class="num">Сүүлд нэвтэрсэн</th></tr></thead><tbody>
    ${data.map(a => `<tr class="click" data-acc="${a.id}"><td><strong>${esc(a.display_name)}</strong></td><td><code>${esc(a.login)}</code></td><td>${esc(ROLE_LABEL[a.role])}</td><td>${esc(branchName(a.branch_id))}</td>
      <td>${!a.active ? '<span class="chip bad">Хаалттай</span>' : a.must_change_password ? '<span class="chip warn">Анхны нууц үгтэй</span>' : '<span class="chip ok">Идэвхтэй</span>'}</td><td class="num small muted">${a.last_sign_in_at ? esc(ago(a.last_sign_in_at)) : 'Нэвтрээгүй'}</td></tr>`).join('')}</tbody></table></div></div>`;
  body.querySelectorAll('[data-acc]').forEach(r => r.onclick = () => accountForm(S.accounts.find(a => a.id === r.dataset.acc)));
};
function roleBranchFields(a) {
  return `<div class="row"><label class="field"><span>Албан тушаал</span><select class="input" name="role">${Object.entries(ROLE_LABEL).map(([k, v]) => `<option value="${k}" ${a?.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="field"><span>Салбар</span><select class="input" name="branch">${[...S.branches.values()].map(b => `<option value="${b.id}" ${a?.branch_id === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label></div>`;
}
function showSecret(title, login, pwd) {
  openDialog(`<div class="dlg-head"><div><h2>${esc(title)}</h2><p>Энэ нууц үгийг зөвхөн одоо харуулна. Ажилтанд өгөөд хаана уу — анх нэвтрэхэд өөрийн нууц үгээр солино.</p></div>${closeX}</div>
    <dl class="kv" style="margin-bottom:12px"><dt>Нэвтрэх нэр</dt><dd><code>${esc(login)}</code></dd></dl><div class="secret"><span id="secret-v">${esc(pwd)}</span><button class="btn sm alt" id="copy">Хуулах</button></div>
    <div class="dlg-foot"><button class="btn" data-close>Болсон</button></div>`, root => {
    root.querySelector('#copy').onclick = async () => { try { await navigator.clipboard.writeText(`${login}\n${pwd}`); toast('Хууллаа.'); } catch { toast('Хуулж чадсангүй — гараар бичнэ үү.'); } };
  });
}
function accountForm(a) {
  const editing = !!a;
  openDialog(`<div class="dlg-head"><div><h2>${editing ? esc(a.display_name) : 'Шинэ данс'}</h2>${editing ? `<p>Нэвтрэх нэр: <code>${esc(a.login)}</code></p>` : '<p>Нууц үгийг систем үүсгэж нэг удаа харуулна.</p>'}</div>${closeX}</div>
    <form id="acc-form"><label class="field"><span>Овог нэр</span><input class="input" name="name" required maxlength="80" value="${esc(a?.display_name)}" placeholder="Жишээ нь: Б. Болд"></label>
    ${editing ? '' : '<label class="field"><span>Нэвтрэх нэр</span><input class="input" name="login" required maxlength="32" pattern="[a-z0-9][a-z0-9._-]{1,31}" placeholder="s1.menejer9" autocapitalize="off" spellcheck="false"></label>'}
    ${roleBranchFields(a)}
    ${editing ? `<label class="check"><input type="checkbox" name="active" ${a.active ? 'checked' : ''} ${a.id === S.me.id ? 'disabled' : ''}> Нэвтрэх эрх нээлттэй</label>` : ''}
    <div class="dlg-foot">${editing && a.id !== S.me.id ? '<button class="btn danger" type="button" id="reset">Нууц үг шинэчлэх</button>' : ''}<button class="btn alt" type="button" data-close>Болих</button><button class="btn" type="submit">${editing ? 'Хадгалах' : 'Үүсгэх'}</button></div></form>`, root => {
    const f = root.querySelector('form');
    const syncBranch = () => { f.branch.disabled = f.role.value === 'general_director'; }; f.role.onchange = syncBranch; syncBranch();
    f.onsubmit = e => { e.preventDefault(); guard(f.querySelector('[type=submit]'), async () => {
      const branch = f.role.value === 'general_director' ? null : Number(f.branch.value);
      if (editing) {
        const { error } = await sb.rpc('admin_update_account', { p_user: a.id, p_name: f.name.value.trim(), p_role: f.role.value, p_branch: branch, p_active: a.id === S.me.id ? true : f.active.checked });
        if (error) return formError(root, errText(error));
        dlg.close(); await loadPeople(); if (a.id === S.me.id) { S.me = person(S.me.id) || S.me; renderMe(); } render(); toast('Хадгаллаа.');
      } else {
        const login = f.login.value.trim().toLowerCase();
        const { data, error } = await sb.rpc('admin_create_account', { p_login: login, p_name: f.name.value.trim(), p_role: f.role.value, p_branch: branch });
        if (error) return formError(root, errText(error));
        await loadPeople(); render(); showSecret('Данс нээгдлээ', login, data);
      }
    }); };
    root.querySelector('#reset')?.addEventListener('click', async ev => {
      if (!confirm(`${a.display_name}-ийн нууц үгийг шинэчлэх үү? Одоо нэвтэрсэн төхөөрөмжөөс гаргана.`)) return;
      await guard(ev.target, async () => { const { data, error } = await sb.rpc('admin_reset_password', { p_user: a.id }); if (error) return formError(root, errText(error)); showSecret('Шинэ түр нууц үг', a.login, data); if (S.route === 'accounts') VIEWS.accounts(); });
    });
  });
}

// ───────────────────────── profile
VIEWS.profile = () => {
  const me = S.me;
  $('#view').innerHTML = `<div class="page-head"><div><h1>Профайл</h1><p>Өөрийн мэдээлэл ба нууц үг.</p></div><button class="btn alt" id="logout">Системээс гарах</button></div>
    <div class="grid g2">
      <div class="card"><div class="person" style="padding:0"><div class="top">${av(me, 'l')}<div><strong style="font-size:19px">${esc(me.display_name)}</strong><small>${esc(roleLine(me))}</small></div></div></div>
        <form id="me-form" style="margin-top:20px"><label class="field"><span>Овог нэр</span><input class="input" name="name" required maxlength="80" value="${esc(me.display_name)}"></label>
        <label class="field"><span>Утас</span><input class="input" name="phone" inputmode="tel" maxlength="20" value="${esc(me.phone || '')}" placeholder="8 оронтой"></label>
        <dl class="kv" style="margin:4px 0 16px"><dt>Нэвтрэх нэр</dt><dd><code>${esc(me.login)}</code></dd></dl>
        <button class="btn" type="submit">Хадгалах</button></form></div>
      <div class="card"><strong style="font-size:17px">Нууц үг солих</strong><p class="small muted" style="margin:4px 0 16px">8-аас дээш тэмдэгт, үсэг ба тоо хольж бичнэ.</p>
        <form id="pw-form"><label class="field"><span>Одоогийн нууц үг</span><input class="input" type="password" name="current" required autocomplete="current-password"></label>
        <label class="field"><span>Шинэ нууц үг</span><input class="input" type="password" name="next" required minlength="8" autocomplete="new-password"></label>
        <label class="field"><span>Дахин бичих</span><input class="input" type="password" name="again" required minlength="8" autocomplete="new-password"></label>
        <button class="btn" type="submit">Нууц үг солих</button></form></div></div>
    <div class="card more-links" style="margin-top:16px"><div class="list">${NAV.filter(n => lvl() >= n[2]).map(([id, label]) => `<a class="item" href="#/${id}" style="text-decoration:none">${svg(id, 'width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"')}<span class="grow">${label}</span><span class="muted">›</span></a>`).join('')}</div></div>`;
  $('#logout').onclick = async () => { await RISE.signOut(); location.replace('staff.html'); };
  $('#me-form').onsubmit = e => { e.preventDefault(); const f = e.target; guard(f.querySelector('button'), async () => {
    const { data, error } = await sb.rpc('update_my_profile', { p_display_name: f.name.value.trim(), p_phone: f.phone.value.trim() || null });
    if (error) return toast(errText(error));
    S.me = data; S.people.set(data.id, { ...S.people.get(data.id), ...data }); renderMe(); render(); toast('Хадгаллаа.');
  }); };
  $('#pw-form').onsubmit = e => { e.preventDefault(); const f = e.target; guard(f.querySelector('button'), async () => {
    if (f.next.value !== f.again.value) return toast('Хоёр шинэ нууц үг таарахгүй байна.');
    try { await RISE.changePassword(f.next.value, f.current.value); f.reset(); toast('Нууц үг солигдлоо.'); } catch (err) { toast(err.message); }
  }); };
};

// ───────────────────────── home
VIEWS.home = async () => {
  const me = S.me, mine = S.tasks.filter(t => t.assignee === me.id && t.status === 'todo').sort(byDue);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', hour12: false }).format(new Date()));
  const hello = hour < 12 ? 'Өглөөний мэнд' : hour < 18 ? 'Өдрийн мэнд' : 'Оройн мэнд';
  const t0 = today(), wd = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'][new Date(t0 + 'T12:00:00Z').getUTCDay()];
  const dateLabel = `${Number(t0.slice(5, 7))} сарын ${Number(t0.slice(8))}, ${wd} гараг`;
  const sent = S.tasks.filter(t => t.created_by === me.id && t.assignee !== me.id && t.status === 'todo');
  const myLeads = S.leads.filter(l => l.owner_id === me.id), monthStart = today().slice(0, 8) + '01';
  const enrolledMonth = myLeads.filter(l => l.status === 'enrolled' && l.enrolled_at && dayOf(l.enrolled_at) >= monthStart);
  const recent = S.convs.filter(c => c.last_message_preview).slice(0, 4);
  $('#view').innerHTML = `<div class="page-head"><div><h1>${hello}, ${esc(me.display_name.replace(/^Салбар \d+ · /, ''))}</h1><p>${esc(dateLabel)}${me.display_name === ROLE_LABEL[me.role] ? '' : ' · ' + esc(roleLine(me))}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="h-task">${svg('plus')} Даалгавар</button>${lvl() >= 1 ? `<button class="btn alt" id="h-lead">${svg('plus')} Харилцагч</button>` : ''}</div></div>
    <div class="grid g4">
      <a class="card kpi" href="#/tasks" style="text-decoration:none"><span>Миний идэвхтэй ажил</span><strong>${mine.length}</strong><small>${mine.filter(overdue).length ? `<span class="chip bad">${mine.filter(overdue).length} хоцорсон</span>` : mine.filter(t => t.due_date === today()).length + ' нь өнөөдөр'}</small></a>
      <a class="card kpi" href="#/chat" style="text-decoration:none"><span>Уншаагүй зурвас</span><strong>${unreadTotal()}</strong><small>${S.convs.filter(c => c.unread).length} ярианд</small></a>
      ${lvl() >= 2 ? `<a class="card kpi" href="#/tasks" style="text-decoration:none"><span>Багт өгсөн ажил</span><strong>${sent.length}</strong><small>${sent.filter(overdue).length} хоцорсон · ${sent.filter(t => !t.seen_at).length} үзээгүй</small></a>` : `<a class="card kpi" href="#/leads" style="text-decoration:none"><span>Миний харилцагч</span><strong>${myLeads.filter(l => ['new', 'contacted', 'interested'].includes(l.status)).length}</strong><small>${myLeads.filter(l => l.status === 'new').length} нь шинэ</small></a>`}
      ${lvl() >= 1 ? `<a class="card kpi" href="#/${lvl() >= 2 ? 'stats' : 'leads'}" style="text-decoration:none"><span>Энэ сарын элсэлт</span><strong id="h-enr">${lvl() >= 2 ? '…' : enrolledMonth.length}</strong><small id="h-rev">${lvl() >= 2 ? '' : money(enrolledMonth.reduce((n, l) => n + Number(l.amount || 0), 0))}</small></a>` : `<a class="card kpi" href="#/team" style="text-decoration:none"><span>Баг</span><strong>${[...S.people.values()].filter(p => p.branch_id === me.branch_id && p.active && !p.hidden).length}</strong><small>${esc(branchName(me.branch_id))}</small></a>`}
    </div>
    <div class="grid g2" style="margin-top:16px">
      <div class="card"><div class="toolbar" style="margin:0 0 8px"><strong>Ойрын ажил</strong><span class="grow"></span><a class="btn sm ghost" href="#/tasks">Бүгд ›</a></div>
        ${mine.length ? mine.slice(0, 5).map(taskCard).join('') : '<div class="empty"><strong>Идэвхтэй ажил алга</strong>Шинэ ажил ирэхэд энд харагдана.</div>'}</div>
      <div class="card"><div class="toolbar" style="margin:0 0 8px"><strong>Сүүлийн зурвас</strong><span class="grow"></span><a class="btn sm ghost" href="#/chat">Чат ›</a></div>
        <div class="list">${recent.length ? recent.map(c => `<a class="item" href="#/chat/${c.id}" style="text-decoration:none">${convAv(c)}<span class="grow"><strong class="trunc" style="display:block">${esc(convTitle(c))}</strong><span class="small muted trunc" style="display:block">${esc(c.last_message_preview)}</span></span>${c.unread ? `<span class="badge">${c.unread}</span>` : `<span class="small muted">${esc(ago(c.last_message_at))}</span>`}</a>`).join('') : '<div class="empty"><strong>Зурвас алга</strong>Баг руу орж хамт олонтойгоо чатлаарай.</div>'}</div></div>
    </div>`;
  $('#h-task').onclick = () => taskForm();
  $('#h-lead')?.addEventListener('click', () => leadForm());
  if (lvl() >= 2) {
    const { data } = await sb.rpc('crm_stats', { p_from: today().slice(0, 8) + '01', p_to: today(), p_branch: null });
    if (data && $('#h-enr')) { $('#h-enr').textContent = data.totals.enrolled; $('#h-rev').textContent = money(data.totals.revenue) + ' · ' + (lvl() === 4 ? 'бүх салбар' : branchName(me.branch_id)); }
  }
};

// ───────────────────────── realtime
let refreshTimer;
function softRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(async () => { try { await loadConvs(); } catch {} if (S.route === 'chat') { const keep = $('#msg-text')?.value; const focus = document.activeElement?.id === 'msg-text'; VIEWS.chat(); if (keep) $('#msg-text').value = keep; if (focus) $('#msg-text')?.focus(); } else render(); }, 250); }
function subscribe() {
  sb.channel('rise-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, ({ eventType, new: n, old: o }) => {
      if (eventType === 'DELETE') { S.tasks = S.tasks.filter(t => t.id !== o.id); }
      else { const i = S.tasks.findIndex(t => t.id === n.id), isNew = i < 0, prev = isNew ? null : S.tasks[i].status; if (isNew) S.tasks.unshift(n); else S.tasks[i] = n;
        if (isNew && n.assignee === S.me.id && n.created_by !== S.me.id) toast(`Шинэ даалгавар: ${n.title}`, { label: 'Нээх', run: () => taskDetail(n.id) });
        else if (!isNew && n.created_by === S.me.id && n.assignee !== S.me.id && n.status === 'done' && prev !== 'done') toast(`${nameOf(n.assignee)} дуусгалаа: ${n.title}`); }
      if (S.route === 'chat') { renderNav(); renderRail(); const c = S.convs.find(x => x.id === S.conv); if (c) paintThread(c.id); } else if (!dlg.open || S.route !== 'tasks') render();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: m }) => {
      const open = S.route === 'chat' && S.conv === m.conversation_id && document.visibilityState === 'visible';
      if (!open && m.sender_id !== S.me.id) { const c = S.convs.find(x => x.id === m.conversation_id); if (c) c.unread = (c.unread || 0) + 1;
        if (m.kind !== 'system') toast(`${nameOf(m.sender_id)}: ${m.body.slice(0, 80)}`, { label: 'Хариулах', run: () => { location.hash = '#/chat/' + m.conversation_id; } }); }
      if (!S.convs.some(c => c.id === m.conversation_id)) return softRefresh();
      addMessage(m); renderNav(); if (S.route === 'home') VIEWS.home();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, ({ new: m }) => {
      const list = S.msgs.get(m.conversation_id); if (!list) return; const i = list.findIndex(x => x.id === m.id); if (i >= 0) { list[i] = m; paintThread(m.conversation_id); }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${S.me.id}` }, softRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, ({ eventType, new: n, old: o }) => {
      if (lvl() < 1) return;
      if (eventType === 'DELETE') S.leads = S.leads.filter(l => l.id !== o.id);
      else { const i = S.leads.findIndex(l => l.id === n.id); if (i < 0) S.leads.unshift(n); else S.leads[i] = n; }
      if (S.route === 'leads' && !dlg.open) VIEWS.leads(); renderNav();
    })
    .subscribe();
}
// Coming back to the tab after a while: reload everything once so nothing is stale.
let hiddenAt = 0;
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 60000) { try { await Promise.all([loadTasks(), loadConvs(), loadLeads()]); render(); } catch {} }
  if (S.route === 'chat' && S.conv) sb.rpc('mark_read', { p_conversation: S.conv });
});

// ───────────────────────── boot
(async function boot() {
  try {
    const me = await RISE.profile();
    if (!me) { await RISE.signOut(); location.replace('staff.html'); return; }
    if (me.must_change_password) { location.replace('staff.html'); return; }
    S.me = me;
    await loadPeople();
    await Promise.all([loadTasks(), loadConvs(), loadLeads()]);
    renderMe(); subscribe();
    document.documentElement.classList.remove('auth-pending'); $('#boot').remove();
    route();
  } catch (e) {
    console.error(e);
    document.documentElement.classList.remove('auth-pending');
    $('#boot').innerHTML = `<div class="card empty" style="max-width:420px"><strong>Систем ачаалсангүй</strong>${esc(errText(e))}<div style="margin-top:14px;display:flex;gap:8px;justify-content:center"><button class="btn" onclick="location.reload()">Дахин оролдох</button><button class="btn alt" id="boot-out">Гарах</button></div></div>`;
    $('#boot-out').onclick = async () => { await RISE.signOut(); location.replace('staff.html'); };
  }
  sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace('staff.html'); });
})();
})();
