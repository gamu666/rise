// Зурвас in the right column of every staff dashboard (owner request 2026-11-21: it replaces the dark task column and
// the Зурвас menu item). Real messages through Supabase — supabase/schema.sql: conversations, conversation_members,
// messages, my_conversations(), start_direct(), create_group(), mark_read() — with row level security deciding who
// may read and write. Everyone gets the all-staff channel and their branch channel; anyone can start a direct chat
// or a group. New messages arrive live (Supabase realtime). The older in-page chat kept messages in one browser only.
(() => {
  const host = document.querySelector('.task-viewport') || document.querySelector('.teacher-right');
  if (!host) return;

  // ───────────── helpers
  const ZONE = 'Asia/Ulaanbaatar';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayOf = iso => new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE }).format(new Date(iso));
  const clock = iso => new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const today = () => dayOf(new Date().toISOString());
  const yesterday = () => dayOf(new Date(Date.now() - 864e5).toISOString());
  const dayLabel = d => d === today() ? 'Өнөөдөр' : d === yesterday() ? 'Өчигдөр' : `${Number(d.slice(5, 7))} сарын ${Number(d.slice(8))}`;
  const listTime = iso => { if (!iso) return ''; const d = dayOf(iso); return d === today() ? clock(iso) : d === yesterday() ? 'Өчигдөр' : `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`; };
  const short = name => String(name || '').replace(/^Салбар\s*\d+\s*·\s*/, '').trim();
  const initials = name => short(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const ROLE = { general_director: 'Ерөнхий захирал', branch_director: 'Салбарын захирал', senior_manager: 'Ахлах менежер', manager: 'Менежер', teacher: 'Багш' };
  const ICON = {
    plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="m15 18-6-6 6-6"/>', send: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    channel: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    group: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 4.5a3 3 0 0 1 0 6M18 14a4 4 0 0 1 3 4v1"/>'
  };
  const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${ICON[k]}</svg>`;
  const notify = text => { if (typeof toast === 'function') toast(text); };

  // ───────────── panel
  const panel = document.createElement('aside');
  panel.className = 'side-chat'; panel.setAttribute('aria-label', 'Зурвас');
  panel.innerHTML = `<header class="side-chat-head"><h2>Зурвас</h2><span class="side-chat-total" hidden></span>
      <button type="button" class="side-chat-icon" data-act="new" aria-label="Шинэ яриа эхлүүлэх" title="Шинэ яриа">${svg('plus')}</button></header>
    <div class="side-chat-home">
      <label class="side-chat-search">${svg('search')}<input type="search" placeholder="Хайх" aria-label="Яриа хайх"></label>
      <div class="side-chat-list" role="list"><div class="side-chat-empty">Ачаалж байна…</div></div>
    </div>
    <section class="side-chat-thread" hidden aria-label="Яриа">
      <div class="side-chat-thread-head"><button type="button" class="side-chat-icon" data-act="back" aria-label="Яриануудын жагсаалт руу буцах">${svg('back')}</button><span class="side-chat-thread-who"></span></div>
      <div class="side-chat-msgs" role="log" aria-live="polite"></div>
      <p class="side-chat-note" role="alert" hidden></p>
      <form class="side-chat-compose"><textarea rows="1" maxlength="4000" placeholder="Зурвас бичих…" aria-label="Зурвас"></textarea><button type="submit" class="side-chat-send" aria-label="Илгээх" disabled>${svg('send')}</button></form>
    </section>`;
  host.append(panel);
  const $ = s => panel.querySelector(s);
  const home = $('.side-chat-home'), list = $('.side-chat-list'), search = $('.side-chat-search input'), thread = $('.side-chat-thread');
  const msgsBox = $('.side-chat-msgs'), who = $('.side-chat-thread-who'), form = $('.side-chat-compose'), input = form.querySelector('textarea'), sendBtn = form.querySelector('button'), note = $('.side-chat-note');

  // ───────────── state
  const S = { me: null, people: new Map(), convs: [], msgs: new Map(), open: null, problem: '' };
  const person = id => S.people.get(id);
  const nameOf = id => short(person(id)?.display_name) || 'Ажилтан';
  const title = c => c.kind === 'direct' ? nameOf(c.other_id) : c.kind === 'all' ? 'Бүх ажилтан' : c.kind === 'branch' ? (c.title || `Салбар ${c.branch_id}`) : (c.title || 'Бүлэг');
  const subtitle = c => c.kind === 'direct' ? (ROLE[person(c.other_id)?.role] || '') : c.kind === 'all' ? 'Байгууллагын суваг' : c.kind === 'branch' ? 'Салбарын суваг' : `${c.members || ''} гишүүн`;
  const avatar = (c, small) => c.kind === 'direct'
    ? `<span class="side-chat-av${small ? ' s' : ''}" aria-hidden="true">${esc(initials(person(c.other_id)?.display_name))}</span>`
    : `<span class="side-chat-av ch${small ? ' s' : ''}" aria-hidden="true">${svg(c.kind === 'group' ? 'group' : 'channel')}</span>`;

  async function load() {
    if (!window.RISE) { S.problem = 'offline'; return drawList(); }
    try {
      S.me = await RISE.profile();
      if (!S.me) { S.problem = 'session'; return drawList(); }
      const [people, convs] = await Promise.all([
        RISE.sb.from('profiles').select('id,display_name,role,level,branch_id,active,hidden'),
        RISE.sb.rpc('my_conversations')
      ]);
      if (convs.error) throw convs.error;
      S.people = new Map((people.data || []).map(p => [p.id, p]));
      S.convs = (convs.data || []).slice().sort((a, b) => String(b.last_message_at).localeCompare(String(a.last_message_at)));
      S.problem = '';
      subscribe();
    } catch (e) { console.error(e); S.problem = 'offline'; }
    drawList(); drawTotal();
    if (S.open) openThread(S.open, true);
  }
  async function reloadConvs() {
    const { data, error } = await RISE.sb.rpc('my_conversations');
    if (error) return;
    const opened = S.open;
    S.convs = (data || []).slice().sort((a, b) => String(b.last_message_at).localeCompare(String(a.last_message_at)));
    if (opened) { const c = S.convs.find(x => x.id === opened); if (c) c.unread = 0; }
    drawList(); drawTotal();
  }

  // ───────────── list
  function drawTotal() {
    const n = S.convs.reduce((t, c) => t + (c.id === S.open ? 0 : Number(c.unread) || 0), 0), b = $('.side-chat-total');
    b.textContent = n > 99 ? '99+' : String(n); b.hidden = !n; b.setAttribute('aria-label', n + ' уншаагүй зурвас');
  }
  function drawList() {
    if (S.problem) {
      list.innerHTML = S.problem === 'session'
        ? '<div class="side-chat-empty">Зурвас харахын тулд дахин нэвтэрнэ үү.<br><button type="button" class="library-upload" data-act="signin">Дахин нэвтрэх</button></div>'
        : '<div class="side-chat-empty">Зурвасыг ачаалж чадсангүй.<br><button type="button" class="library-upload" data-act="retry">Дахин оролдох</button></div>';
      return;
    }
    const q = search.value.trim().toLowerCase();
    const shown = S.convs.filter(c => !q || (title(c) + ' ' + subtitle(c)).toLowerCase().includes(q));
    list.innerHTML = shown.map(c => `<button type="button" role="listitem" class="side-chat-row${c.id === S.open ? ' on' : ''}${c.unread && c.id !== S.open ? ' unread' : ''}" data-conv="${c.id}">
        ${avatar(c)}<span class="side-chat-copy"><strong>${esc(title(c))}</strong><small>${esc(c.last_message_preview || subtitle(c))}</small></span>
        <span class="side-chat-meta"><time>${esc(c.last_message_preview ? listTime(c.last_message_at) : '')}</time>${c.unread && c.id !== S.open ? `<span class="side-chat-badge">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}</span>
      </button>`).join('') || `<div class="side-chat-empty">${q ? 'Тохирох яриа олдсонгүй.' : 'Яриа алга. + дарж эхлүүлнэ үү.'}</div>`;
  }
  list.addEventListener('click', e => {
    const row = e.target.closest('[data-conv]'); if (row) return openThread(row.dataset.conv);
    if (e.target.closest('[data-act=retry]')) { list.innerHTML = '<div class="side-chat-empty">Ачаалж байна…</div>'; load(); }
    if (e.target.closest('[data-act=signin]')) { try { localStorage.removeItem('rise-auth'); ['rise-demo-name', 'rise-demo-level', 'rise-demo-new-login'].forEach(k => sessionStorage.removeItem(k)); } catch {} location.href = 'staff.html'; }
  });
  search.addEventListener('input', drawList);

  // ───────────── thread
  async function loadMessages(cid, before) {
    let q = RISE.sb.from('messages').select('*').eq('conversation_id', cid).order('id', { ascending: false }).limit(60);
    if (before) q = q.lt('id', before);
    const { data, error } = await q; if (error) throw error;
    const got = (data || []).slice().reverse(), cur = S.msgs.get(cid) || [];
    S.msgs.set(cid, before ? got.concat(cur) : got);
    return got.length;
  }
  function msgHtml(m, prev) {
    const sep = !prev || dayOf(prev.created_at) !== dayOf(m.created_at) ? `<div class="side-chat-day">${esc(dayLabel(dayOf(m.created_at)))}</div>` : '';
    if (m.kind === 'system') return sep + `<div class="side-chat-sys">${esc(m.body)} · ${clock(m.created_at)}</div>`;
    const mine = m.sender_id === S.me.id, c = S.convs.find(x => x.id === m.conversation_id);
    const showWho = !mine && c && c.kind !== 'direct' && (!prev || prev.sender_id !== m.sender_id || prev.kind === 'system' || sep);
    const body = m.deleted_at ? '<i>Устгагдсан зурвас</i>' : m.kind === 'task' ? `<b>ДААЛГАВАР</b>${esc(m.body)}` : esc(m.body);
    return sep + `<div class="side-chat-msg${mine ? ' mine' : ''}${m.kind === 'task' ? ' task' : ''}">${showWho ? `<span class="who">${esc(nameOf(m.sender_id))}</span>` : ''}<p>${body}</p><time>${clock(m.created_at)}${m.edited_at ? ' · засварласан' : ''}</time></div>`;
  }
  function paint(cid, toBottom) {
    if (S.open !== cid) return;
    const items = S.msgs.get(cid) || [], atBottom = msgsBox.scrollHeight - msgsBox.scrollTop - msgsBox.clientHeight < 80;
    msgsBox.innerHTML = (items.length >= 60 ? '<button type="button" class="side-chat-older">Өмнөх зурвас</button>' : '')
      + (items.length ? items.map((m, i) => msgHtml(m, items[i - 1])).join('') : '<div class="side-chat-empty">Анхны зурвасаа бичээрэй.</div>');
    if (toBottom || atBottom) msgsBox.scrollTop = msgsBox.scrollHeight;
  }
  msgsBox.addEventListener('click', async e => {
    if (!e.target.closest('.side-chat-older')) return;
    const cid = S.open, items = S.msgs.get(cid) || [], h = msgsBox.scrollHeight;
    try { await loadMessages(cid, items[0]?.id); } catch {}
    paint(cid); msgsBox.scrollTop = msgsBox.scrollHeight - h;
  });
  async function openThread(cid, quiet) {
    const c = S.convs.find(x => x.id === cid); if (!c) return;
    S.open = cid; note.hidden = true;
    who.innerHTML = `${avatar(c, true)}<span class="side-chat-copy"><strong>${esc(title(c))}</strong><small>${esc(subtitle(c))}</small></span>`;
    home.hidden = true; thread.hidden = false;
    input.value = drafts.get(cid) || ''; grow(); sendBtn.disabled = !input.value.trim();
    msgsBox.innerHTML = '<div class="side-chat-empty">Ачаалж байна…</div>';
    try { if (!S.msgs.has(cid)) await loadMessages(cid); } catch (e) { msgsBox.innerHTML = '<div class="side-chat-empty">Зурвасыг ачаалж чадсангүй.</div>'; return; }
    paint(cid, true);
    if (c.unread) { c.unread = 0; RISE.sb.rpc('mark_read', { p_conversation: cid }); }
    drawTotal();
    if (!quiet) input.focus({ preventScroll: true });
  }
  function closeThread() { if (S.open) drafts.set(S.open, input.value); S.open = null; thread.hidden = true; home.hidden = false; drawList(); drawTotal(); }
  panel.addEventListener('click', e => {
    if (e.target.closest('[data-act=back]')) closeThread();
    if (e.target.closest('[data-act=new]')) newChat();
  });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape' && !thread.hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); closeThread(); } });

  // ───────────── composer
  const drafts = new Map();
  const grow = () => { input.style.height = '38px'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; };
  input.addEventListener('input', () => { grow(); sendBtn.disabled = !input.value.trim(); if (S.open) drafts.set(S.open, input.value); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!sendBtn.disabled) form.requestSubmit(); } });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = input.value.trim(), cid = S.open; if (!body || !cid) return;
    sendBtn.disabled = true; note.hidden = true;
    const { data, error } = await RISE.sb.from('messages').insert({ conversation_id: cid, body }).select().single();
    if (error) { note.textContent = /security|permission/i.test(error.message || '') ? 'Энэ ярианд бичих эрх алга.' : 'Илгээгдсэнгүй. Холболтоо шалгаад дахин оролдоно уу.'; note.hidden = false; sendBtn.disabled = false; return; }
    input.value = ''; drafts.delete(cid); grow();
    addMessage(data, true);
  });

  function addMessage(m, mineJustSent) {
    const items = S.msgs.get(m.conversation_id);
    if (items && !items.some(x => x.id === m.id)) items.push(m);
    const c = S.convs.find(x => x.id === m.conversation_id);
    if (c) {
      c.last_message_at = m.created_at; c.last_message_preview = m.kind === 'system' ? m.body : String(m.body).slice(0, 140);
      S.convs.sort((a, b) => String(b.last_message_at).localeCompare(String(a.last_message_at)));
    }
    if (S.open === m.conversation_id) {
      paint(m.conversation_id, mineJustSent || m.sender_id === S.me.id);
      if (m.sender_id !== S.me.id && document.visibilityState === 'visible') RISE.sb.rpc('mark_read', { p_conversation: m.conversation_id });
    }
    if (thread.hidden) drawList();
    drawTotal();
  }

  // ───────────── live updates
  let live = false;
  function subscribe() {
    if (live || !RISE.sb.channel) return; live = true;
    RISE.sb.channel('side-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: m }) => {
        const c = S.convs.find(x => x.id === m.conversation_id);
        if (!c) return reloadConvs();
        const seen = S.open === m.conversation_id && document.visibilityState === 'visible';
        if (!seen && m.sender_id !== S.me.id) { c.unread = (Number(c.unread) || 0) + 1; if (m.kind !== 'system') notify(`${title(c) === nameOf(m.sender_id) ? '' : title(c) + ' · '}${nameOf(m.sender_id)}: ${String(m.body).slice(0, 70)}`); }
        addMessage(m);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, ({ new: m }) => {
        const items = S.msgs.get(m.conversation_id); if (!items) return;
        const i = items.findIndex(x => x.id === m.id); if (i >= 0) { items[i] = m; paint(m.conversation_id); }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${S.me.id}` }, reloadConvs)
      .subscribe();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.open) { const c = S.convs.find(x => x.id === S.open); if (c) { c.unread = 0; RISE.sb.rpc('mark_read', { p_conversation: S.open }); drawTotal(); } } });

  // ───────────── new conversation: one person → direct chat, two or more → a named group
  const dialog = document.createElement('dialog');
  dialog.className = 'side-chat-dialog'; dialog.setAttribute('aria-labelledby', 'side-chat-new-title');
  document.body.append(dialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  function newChat() {
    if (!S.me) return;
    const people = [...S.people.values()].filter(p => p.id !== S.me.id && p.active && p.hidden === S.me.hidden)
      .sort((a, b) => (a.branch_id || 0) - (b.branch_id || 0) || b.level - a.level || String(a.display_name).localeCompare(String(b.display_name), 'mn'));
    const picked = new Set();
    dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="Хаах">×</button><h2 id="side-chat-new-title">Шинэ яриа</h2>
      <p class="crm-dialog-meta">Нэг хүн сонговол хувийн яриа, олныг сонговол бүлэг үүснэ.</p>
      <form novalidate><label class="side-chat-search">${svg('search')}<input type="search" placeholder="Нэр, албан тушаалаар хайх" aria-label="Хүн хайх"></label>
      <div class="side-chat-people" role="group" aria-label="Хүмүүс"></div>
      <label class="side-chat-title" hidden>Бүлгийн нэр<input name="group" maxlength="80" placeholder="Бүлгийн нэр"></label>
      <p class="crm-error" role="alert" hidden></p>
      <button type="submit" class="save-button" disabled>Эхлүүлэх</button></form>`;
    const f = dialog.querySelector('form'), q = f.querySelector('input[type=search]'), box = f.querySelector('.side-chat-people'), go = f.querySelector('.save-button'), err = f.querySelector('.crm-error'), titleWrap = f.querySelector('.side-chat-title');
    const role = p => [ROLE[p.role], p.branch_id ? `Салбар ${p.branch_id}` : ''].filter(Boolean).join(' · ');
    const draw = () => {
      const s = q.value.trim().toLowerCase();
      box.innerHTML = people.filter(p => !s || (p.display_name + ' ' + role(p)).toLowerCase().includes(s)).map(p => `<label class="side-chat-person"><input type="checkbox" value="${p.id}" ${picked.has(p.id) ? 'checked' : ''}><span class="side-chat-av s" aria-hidden="true">${esc(initials(p.display_name))}</span><span class="side-chat-copy"><strong>${esc(short(p.display_name))}</strong><small>${esc(role(p))}</small></span></label>`).join('') || '<div class="side-chat-empty">Олдсонгүй</div>';
    };
    box.addEventListener('change', e => { const i = e.target; if (!i.matches('input[type=checkbox]')) return; i.checked ? picked.add(i.value) : picked.delete(i.value); titleWrap.hidden = picked.size < 2; go.disabled = !picked.size; go.textContent = picked.size > 1 ? 'Бүлэг үүсгэх' : 'Эхлүүлэх'; });
    q.addEventListener('input', draw); draw();
    dialog.querySelector('.dialog-close').onclick = () => dialog.close();
    f.onsubmit = async e => {
      e.preventDefault(); err.hidden = true;
      const ids = [...picked], group = f.elements.group; if (!ids.length) return;
      if (ids.length > 1 && !group.value.trim()) { err.textContent = 'Бүлгийн нэр оруулна уу.'; err.hidden = false; group.focus(); return; }
      go.disabled = true;
      const res = ids.length === 1 ? await RISE.sb.rpc('start_direct', { p_other: ids[0] }) : await RISE.sb.rpc('create_group', { p_title: group.value.trim(), p_members: ids });
      go.disabled = false;
      if (res.error) { err.textContent = res.error.message || 'Яриа эхлүүлж чадсангүй.'; err.hidden = false; return; }
      dialog.close(); await reloadConvs(); openThread(res.data);
    };
    dialog.showModal(); q.focus();
  }

  // ───────────── older entry points (menu, notifications) now open this panel
  function focusPanel() { panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); (thread.hidden ? search : input).focus({ preventScroll: true }); }
  if (typeof workspaceSelect === 'function') {
    const previous = workspaceSelect;
    workspaceSelect = function (key) { if (key === 'chat') return focusPanel(); return previous.apply(this, arguments); };
    if (typeof selectHub !== 'undefined') selectHub = workspaceSelect;
  }
  document.addEventListener('click', e => {
    const entry = e.target.closest('[data-hub=chat],.teacher-nav [data-view=messages]');
    if (entry && !panel.contains(entry)) { e.preventDefault(); e.stopImmediatePropagation(); focusPanel(); }
  }, true);

  load();
})();
