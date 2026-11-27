// THE RISE public site: pill header (light/dark by the section under it, active link), sign-in menu, mobile menu,
// course filter, scroll reveal, registration form.
// The form posts to Supabase public.submit_web_lead — the only call the publishable (public) key may make — and the
// request lands in the staff CRM (Харилцагч) as an unassigned lead. "Хүлээн авлаа" shows only after the server answers
// true; any failure shows phone / Messenger instead, so delivery is never claimed without confirmation.
(() => {
  // ?draft shows which values are still samples (class="s"); visitors never see the marker.
  if (/[?&]draft\b/.test(location.search)) document.body.classList.add('draft');

  const hdr = document.querySelector('[data-hdr]');
  const themed = [...document.querySelectorAll('[data-theme]')];
  const navLinks = [...document.querySelectorAll('.nav > a[href*="#"]')];
  const targets = navLinks.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  let ticking = false;
  const sync = () => {
    ticking = false;
    if (!hdr) return;
    // Header colours follow the section behind the pill: white on dark photos, ink on light pages.
    const y = 32;
    const dark = themed.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    hdr.classList.toggle('light', !dark);
    // Active section link (same rule as naimansar.com: the last section whose top passed 42% of the viewport).
    const marker = Math.min(innerHeight * .42, 360);
    let current = null;
    targets.forEach(t => { if (t.getBoundingClientRect().top <= marker) current = t.id; });
    navLinks.forEach(a => a.classList.toggle('is-active', a.hash.slice(1) === current));
  };
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } };
  sync();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);

  // Mobile menu.
  const menu = document.querySelector('.menu'), links = document.querySelector('#site-menu');
  const setMenu = open => {
    if (!menu || !links || !hdr) return;
    hdr.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Цэс хаах' : 'Цэс');
  };
  if (menu && links) {
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', e => { if (hdr && !hdr.contains(e.target)) setMenu(false); });
    matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  // Sign-in menu (student / staff).
  const login = document.querySelector('[data-login]');
  const loginBtn = login?.querySelector('.login-btn'), loginMenu = login?.querySelector('.login-menu');
  const setLogin = open => {
    if (!loginBtn || !loginMenu) return;
    loginMenu.hidden = !open;
    loginBtn.setAttribute('aria-expanded', String(open));
  };
  if (loginBtn && loginMenu) {
    loginBtn.addEventListener('click', () => {
      const open = loginMenu.hidden;
      setLogin(open);
      if (open) loginMenu.querySelector('a')?.focus();
    });
    document.addEventListener('click', e => { if (!login.contains(e.target)) setLogin(false); });
    loginMenu.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const items = [...loginMenu.querySelectorAll('a')], i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (loginMenu && !loginMenu.hidden) { setLogin(false); loginBtn.focus(); }
    if (menu?.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });

  // Course filter. The advice tile always stays; it spans both columns when it would otherwise sit alone.
  const filters = document.querySelectorAll('[data-filter]');
  const help = document.querySelector('#surgalt .tile-help');
  const layoutHelp = () => {
    if (!help) return;
    const shown = document.querySelectorAll('#surgalt .tile[data-track]:not([hidden])').length;
    help.classList.toggle('span2', shown % 2 === 0);
  };
  filters.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    filters.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll('#surgalt .tile').forEach(t => { t.classList.remove('pre'); if (t.dataset.track) t.hidden = f !== 'all' && t.dataset.track !== f; });
    layoutHelp();
  }));
  layoutHelp();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero: while it scrolls away the photo drifts slower than the page and the copy lifts and fades (site.css reads --hp).
  const hero = document.querySelector('.hero');
  if (hero && !reduced) {
    let frame = 0;
    const drift = () => { frame = 0; const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1))); hero.style.setProperty('--hp', p.toFixed(4)); };
    addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(drift); }, { passive: true });
    drift();
  }

  // Reveal on scroll. Only elements that start below the fold are hidden first, so nothing visible ever blinks,
  // and without IntersectionObserver or with reduced motion everything simply stays visible.
  // Blocks side by side in one row enter left to right (--d); a single column enters without delay.
  const reveal = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.remove('pre');
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveal.forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      const row = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
      const perRow = row.filter(x => x.offsetTop === row[0].offsetTop).length || 1;
      el.style.setProperty('--d', (row.indexOf(el) % perRow) * 90 + 'ms');
      el.classList.add('pre');
      io.observe(el);
    });
    addEventListener('hashchange', () => {
      const t = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (!t) return;
      t.classList.remove('pre');
      t.querySelectorAll('.pre').forEach(el => el.classList.remove('pre'));
    });
  }

  // Supabase public functions: the publishable key may call only submit_web_lead and track_web.
  const API = 'https://lwgxvtkhetkelmihaynt.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_S6UNtZDweK06zFymdMexYQ_s59ljSXH';
  const rpc = (fn, args, signal) => fetch(API + fn, { method: 'POST', signal, headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });

  // Interest counter for the staff CRM (Вэб сайт card): a page view once per tab, and clicks on Бүртгүүлэх, phone and
  // Messenger, counted per page (home or the course slug in body[data-page]). Only "+1 for this page and event today"
  // is sent: no cookie, no visitor id, nothing about the person. Staff devices (signed in now, or ever signed in on
  // staff.html, which sets rise-notrack) and automated browsers are not counted, so the numbers are real visitors.
  const page = document.body.dataset.page || 'home';
  let quiet = !!navigator.webdriver;
  try { quiet = quiet || !!localStorage.getItem('rise-notrack') || !!localStorage.getItem('rise-auth'); } catch { /* storage blocked: count */ }
  const track = (event, src) => { if (!quiet) rpc('track_web', src ? { p_event: event, p_page: page, p_src: src } : { p_event: event, p_page: page }).catch(() => {}); };
  // Where the visit came from (owner request 2026-11-27): only a category is sent with the view — facebook, instagram,
  // google, search (another search engine), site (another website) or direct (typed address, bookmark, or an app that
  // hides it) — never the address itself. The first page of a tab decides it and later pages of that tab keep it; a
  // move between this site's own pages without a remembered source sends none.
  const sourceOf = () => {
    const q = new URLSearchParams(location.search), utm = (q.get('utm_source') || '').toLowerCase();
    if (q.has('fbclid') || /^(fb|facebook|messenger)/.test(utm)) return 'facebook';
    if (/^(ig|instagram)/.test(utm)) return 'instagram';
    if (q.has('gclid') || /^google/.test(utm)) return 'google';
    let host = '';
    try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch { /* odd referrer: direct */ }
    if (!host) return 'direct';
    if (host === location.hostname) return null;
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com|m\.me)$/.test(host)) return 'facebook';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
    if (/(^|\.)(bing\.com|yandex\.[a-z]+|duckduckgo\.com|yahoo\.com|baidu\.com|ecosia\.org)$/.test(host)) return 'search';
    return 'site';
  };
  let seen = false, src = null;
  try { seen = sessionStorage.getItem('rise-seen-' + page) === '1'; sessionStorage.setItem('rise-seen-' + page, '1'); } catch { /* storage blocked: count the view */ }
  try { src = sessionStorage.getItem('rise-src') || sourceOf(); if (src) sessionStorage.setItem('rise-src', src); } catch { src = sourceOf(); }
  if (!seen) track('view', src);
  document.addEventListener('click', e => {
    const href = e.target.closest?.('a[href]')?.getAttribute('href') || '';
    if (href.startsWith('tel:')) track('call');
    else if (/^https:\/\/m\.me\//.test(href)) track('messenger');
    else if (/#burtguuleh$/.test(href)) track('register');
  }, true);

  // Registration form. The site15 form is the one without a request step; a page cached from before site15 still has
  // the one-screen form (name, phone, course, day/evening) and keeps posting to submit_web_lead, so a cached page never
  // falls back to a native GET that would put the person's name and phone in the address.
  const form = document.querySelector('#lead-form');
  if (!form) return;
  if (form.classList.contains('acct')) registration(form); else legacyForm(form);

  function legacyForm(form) {
    // A page cached from before site13 has a single .done block (it asks the visitor to call) and no bot-trap field;
    // that block then serves as the failure notice too, so old HTML with this script never throws or over-claims.
    const err = form.querySelector('.err'), done = form.querySelector('.done:not(.fail)'), fail = form.querySelector('.done.fail') || done;
    const send = form.querySelector('button[type=submit]'), label = send.textContent;
    let sending = false;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (sending) return;
      const name = form.elements.name, phone = form.elements.phone, course = form.elements.course;
      fail.hidden = true;
      phone.value = phone.value.replace(/\D/g, '');
      const problems = [];
      [name, phone, course].forEach(f => f.removeAttribute('aria-invalid'));
      if (name.value.trim().length < 2) { problems.push('Нэрээ бичнэ үү.'); name.setAttribute('aria-invalid', 'true'); }
      if (!/^[0-9]{8}$/.test(phone.value)) { problems.push('Утасны дугаар 8 оронтой байна.'); phone.setAttribute('aria-invalid', 'true'); }
      if (!course.value) { problems.push('Сургалтаа сонгоно уу.'); course.setAttribute('aria-invalid', 'true'); }
      err.hidden = !problems.length; err.textContent = problems.join(' ');
      if (problems.length) { form.querySelector('[aria-invalid=true]')?.focus(); return; }
      // A filled bot-trap field means a script, not a person: send nothing and claim nothing.
      if (form.elements.website?.value) { fail.hidden = false; return; }
      sending = true; send.disabled = true; send.textContent = 'Илгээж байна…';
      let ok = false;
      try {
        const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 15000);
        const res = await rpc('submit_web_lead', { p_name: name.value.trim(), p_phone: phone.value, p_course: course.selectedOptions[0]?.textContent.trim() || '', p_time: form.elements.time.value }, stop.signal);
        clearTimeout(timer);
        ok = res.ok && (await res.json()) === true;
      } catch { ok = false; }
      sending = false; send.disabled = false; send.textContent = label;
      if (ok) { send.hidden = true; done.hidden = false; done.focus(); }
      else { fail.hidden = false; fail.focus(); }
    });
  }

  // Registration without a request step (owner request 2026-11-21): own manager (or a branch) → course → own weekly
  // schedule → account data from e-Mongolia → contact → training contract signed with GSign. The lists come from Supabase
  // web_registration_options (display name, position and branch only); register_web puts the lead straight into the
  // chosen manager's CRM list, or unassigned into the chosen branch. e-Mongolia and GSign are not connected yet: their
  // buttons stay disabled ("Удахгүй") beside "Алгасах", and the visitor types a name and phone instead — nothing
  // imitates a verification or a signature. "Бүртгэгдлээ" shows only after the server answered true; otherwise phone /
  // Messenger are offered.
  function registration(form) {
    const $ = s => form.querySelector(s), $$ = s => [...form.querySelectorAll(s)];
    const steps = $$('.acct-step'), marks = $$('.acct-steps li'), done = $('.done:not(.fail)'), fail = $('.done.fail');
    const DAYS = [['Да', 'Даваа'], ['Мя', 'Мягмар'], ['Лх', 'Лхагва'], ['Пү', 'Пүрэв'], ['Ба', 'Баасан'], ['Бя', 'Бямба'], ['Ня', 'Ням']];
    const TIMES = Array.from({ length: 27 }, (_, i) => String(8 + Math.floor(i / 2)).padStart(2, '0') + (i % 2 ? ':30' : ':00')); // 08:00 … 21:00
    const ROLE = { manager: 'Менежер', senior_manager: 'Ахлах менежер' };
    const S = { at: 1, plan: new Map(), managers: [], branches: [], loaded: false };
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const mins = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const initials = n => String(n).split(/[\s.·-]+/).filter(w => /^\p{Lu}/u.test(w)).map(w => w[0]).join('').slice(0, 2) || String(n).trim().charAt(0).toUpperCase();
    const branchName = id => S.branches.find(b => b.id === id)?.name || '';
    const has = () => $('[name=has]:checked')?.value || '';
    const manager = () => S.managers.find(m => m.id === $('[name=manager]:checked')?.value);
    const branch = () => Number($('[name=branch]:checked')?.value) || null;
    const course = () => $('[name=course]:checked');

    // The manager and branch lists load once, on the first touch of the form; a failure can be retried.
    let loading = null;
    const load = () => loading || (loading = (async () => {
      const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 15000);
      try {
        const res = await rpc('web_registration_options', {}, stop.signal);
        const data = res.ok ? await res.json() : null;
        if (!Array.isArray(data?.managers) || !Array.isArray(data?.branches)) throw new Error('bad answer');
        S.managers = data.managers; S.branches = data.branches; S.loaded = true;
      } catch { S.loaded = false; }
      clearTimeout(timer);
      if (!S.loaded) loading = null;
      drawLists(); status();
    })());
    form.addEventListener('pointerdown', load, { once: true });
    form.addEventListener('focusin', load, { once: true });

    function drawLists() {
      if (!S.loaded) return;
      $('.acct-managers').innerHTML = S.managers.map(m => `<label class="acct-manager"><input type="radio" name="manager" value="${esc(m.id)}"><i aria-hidden="true">${esc(initials(m.name))}</i><span><strong>${esc(m.name)}</strong><small>${esc(ROLE[m.role] || ROLE.manager)} · ${esc(branchName(m.branch))}</small></span></label>`).join('');
      $('[data-branches]').innerHTML = S.branches.map(b => `<label><input type="radio" name="branch" value="${esc(b.id)}">${esc(b.name)}</label>`).join('');
      filter();
    }
    function status() {
      const el = $('[data-status]'), waiting = has() && !S.loaded;
      el.hidden = !waiting;
      if (waiting) el.innerHTML = loading ? 'Жагсаалт ачаалж байна…' : 'Жагсаалт ачаалсангүй. <button class="acct-link" type="button" data-retry>Дахин оролдох</button>';
    }
    // Managers still named with a position placeholder are not listed (the server leaves them out), so the list can be
    // empty: the visitor is then pointed to the branch choice instead of an empty search.
    function filter() {
      const none = S.loaded && !S.managers.length, q = form.elements.managerQuery.value.trim().toLocaleLowerCase('mn');
      let shown = 0;
      $$('.acct-manager').forEach(l => { const on = !q || l.textContent.toLocaleLowerCase('mn').includes(q); l.hidden = !on; shown += on; });
      $('.acct-search').hidden = none;
      const msg = $('[data-nomatch]');
      msg.textContent = none ? 'Менежерүүдийн нэр жагсаалтад хараахан ороогүй байна. “Үгүй”-г сонгоод салбараа сонгоно уу.' : 'Ийм нэртэй менежер олдсонгүй.';
      msg.hidden = !S.loaded || shown > 0;
    }
    form.elements.managerQuery.addEventListener('input', filter);
    form.addEventListener('change', e => { if (['manager', 'branch', 'course'].includes(e.target.name)) say(''); });
    $$('[name=has]').forEach(r => r.addEventListener('change', () => {
      $$('[data-pick]').forEach(p => { p.hidden = p.dataset.pick !== has(); });
      say('');
      load().then(() => { if (has() === 'yes' && S.managers.length && matchMedia('(pointer: fine)').matches) form.elements.managerQuery.focus(); });
      status();
    }));

    // Own weekly schedule: any days, own hours for each day.
    $('.acct-days').innerHTML = DAYS.map(([s, l], i) => `<label title="${l}"><input type="checkbox" value="${i}" aria-label="${l}">${s}</label>`).join('');
    const options = sel => TIMES.map(t => `<option${t === sel ? ' selected' : ''}>${t}</option>`).join('');
    const ordered = () => [...S.plan.keys()].sort((a, b) => a - b);
    function drawSlots() {
      const days = ordered();
      $('.acct-slots').innerHTML = days.map(d => { const p = S.plan.get(d); return `<div class="acct-slot${mins(p.to) <= mins(p.from) ? ' bad' : ''}" data-day="${d}"><strong>${DAYS[d][1]}</strong><select data-edge="from" aria-label="${DAYS[d][1]} эхлэх цаг">${options(p.from)}</select><span>–</span><select data-edge="to" aria-label="${DAYS[d][1]} дуусах цаг">${options(p.to)}</select></div>`; }).join('');
      const total = days.reduce((n, d) => { const p = S.plan.get(d); return n + Math.max(0, mins(p.to) - mins(p.from)); }, 0);
      const sum = $('[data-sum]'); sum.hidden = !days.length;
      sum.innerHTML = `<span>7 хоногт <strong>${days.length} өдөр</strong></span><span>Нийт <strong>${Math.floor(total / 60)} цаг${total % 60 ? ' ' + (total % 60) + ' мин' : ''}</strong></span>`;
      $('[data-same]').hidden = days.length < 2;
    }
    $('.acct-days').addEventListener('change', e => {
      const d = Number(e.target.value), last = S.plan.get(ordered().at(-1));
      if (e.target.checked) S.plan.set(d, { from: last?.from || '10:00', to: last?.to || '12:00' }); else S.plan.delete(d);
      drawSlots(); say('');
    });
    $('.acct-slots').addEventListener('change', e => {
      const row = e.target.closest('[data-day]'); if (!row) return;
      S.plan.get(Number(row.dataset.day))[e.target.dataset.edge] = e.target.value;
      drawSlots(); say('');
    });
    $('[data-same]').addEventListener('click', () => { const first = S.plan.get(ordered()[0]); ordered().forEach(d => S.plan.set(d, { ...first })); drawSlots(); say(''); });
    const plan = () => ordered().map(d => ({ d, from: S.plan.get(d).from, to: S.plan.get(d).to }));
    const planText = () => {
      const days = ordered(), first = S.plan.get(days[0]);
      const same = days.every(d => S.plan.get(d).from === first.from && S.plan.get(d).to === first.to);
      return same ? `${days.map(d => DAYS[d][0]).join(', ')} · ${first.from}–${first.to}` : days.map(d => `${DAYS[d][0]} ${S.plan.get(d).from}–${S.plan.get(d).to}`).join(', ');
    };
    const managerText = () => { const m = manager(); return m ? `${m.name} · ${branchName(m.branch)}` : ''; };

    // Steps.
    const say = text => { const e = steps[S.at - 1].querySelector('.err'); e.textContent = text; e.hidden = !text; return !text; };
    function show(n) {
      S.at = n;
      steps.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
      marks.forEach((m, i) => { m.classList.toggle('on', i + 1 === n); m.classList.toggle('past', i + 1 < n); });
      if (n === 6) {
        const mine = has() === 'yes';
        $('[data-c-name]').textContent = form.elements.name.value.trim();
        $('[data-c-course]').textContent = course().dataset.name;
        $('[data-c-plan]').textContent = planText();
        $('[data-c-who]').textContent = mine ? 'Хариуцах менежер' : 'Салбар';
        $('[data-c-manager]').textContent = mine ? managerText() : branchName(branch());
      }
      const h = steps[n - 1].querySelector('h3'); h.tabIndex = -1; h.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top;
      if (top < 80) scrollBy({ top: top - 80, behavior: reduced ? 'auto' : 'smooth' });
    }
    function check() {
      if (S.at === 1) {
        if (!has()) return say('Хариуцсан менежер байгаа эсэхээ сонгоно уу.');
        if (!S.loaded) { load(); status(); return say('Жагсаалт ачаалагдаж дуусаагүй байна. Түр хүлээгээд дахин дарна уу.'); }
        if (has() === 'yes') return manager() ? say('') : say(S.managers.length ? 'Менежерээ жагсаалтаас сонгоно уу.' : '“Үгүй”-г сонгоод салбараа сонгоно уу.');
        return branch() ? say('') : say('Суралцах салбараа сонгоно уу.');
      }
      if (S.at === 2) return course() ? say('') : say('Сургалтаа сонгоно уу.');
      if (S.at === 3) {
        if (!S.plan.size) return say('Дор хаяж нэг өдөр сонгоно уу.');
        return [...S.plan.values()].every(p => mins(p.to) > mins(p.from)) ? say('') : say('Дуусах цаг эхлэх цагаас хойш байх ёстой.');
      }
      // Step 4 (e-Mongolia) can only be skipped for now; step 5 asks for the name and phone number instead.
      if (S.at === 5) return contactOk();
      return true;
    }
    // Until e-Mongolia is connected the visitor types the name and phone number that verification will supply later.
    function contactOk() {
      const name = form.elements.name, phone = form.elements.phone;
      phone.value = phone.value.replace(/\D/g, '');
      [name, phone].forEach(f => f.removeAttribute('aria-invalid'));
      const problems = [];
      if (name.value.trim().length < 2) { problems.push('Нэрээ бичнэ үү.'); name.setAttribute('aria-invalid', 'true'); }
      if (!/^[0-9]{8}$/.test(phone.value)) { problems.push('Утасны дугаар 8 оронтой байна.'); phone.setAttribute('aria-invalid', 'true'); }
      say(problems.join(' '));
      if (problems.length) form.querySelector('[aria-invalid=true]')?.focus();
      return !problems.length;
    }
    form.addEventListener('click', e => {
      if (e.target.closest('[data-retry]')) { load(); status(); }
      else if (e.target.closest('[data-back]')) { say(''); fail.hidden = true; show(S.at - 1); }
      else if (e.target.closest('[data-next]') && check()) show(S.at + 1);
    });

    // Send. Enter in the search box (or any earlier step) never sends. Spaces and dashes typed into the phone number
    // drop out as they are typed, so "9911 2233" fits the 8-digit field.
    form.elements.phone.addEventListener('input', e => { const v = e.target.value.replace(/\D/g, ''); if (v !== e.target.value) e.target.value = v; });
    const send = $('button[type=submit]'), label = send.textContent;
    let sending = false;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (sending) return;
      // Enter in the name or phone field moves on to the contract step; only the contract step ("Алгасаад бүртгүүлэх") sends.
      if (S.at === 5) { if (check()) show(6); return; }
      if (S.at !== 6) return;
      const name = form.elements.name, phone = form.elements.phone;
      fail.hidden = true;
      // A filled bot-trap field means a script, not a person: send nothing and claim nothing.
      if (form.elements.website?.value) { fail.hidden = false; return; }
      sending = true; send.disabled = true; send.textContent = 'Илгээж байна…';
      let ok = false, reason = '';
      try {
        const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 15000);
        const res = await rpc('register_web', { p_name: name.value.trim(), p_phone: phone.value, p_course: course().dataset.name, p_manager: has() === 'yes' ? manager().id : null, p_branch: has() === 'yes' ? null : branch(), p_schedule: plan() }, stop.signal);
        clearTimeout(timer);
        ok = res.ok && (await res.json()) === true;
        if (!res.ok) reason = String((await res.json().catch(() => null))?.message || '');
      } catch { ok = false; }
      sending = false; send.disabled = false; send.textContent = label;
      if (ok) {
        const mine = has() === 'yes';
        $('[data-done-text]').textContent = mine ? 'Таны бүртгэл сонгосон менежерт тань шууд очлоо. Гэрээ, төлбөрийн нөхцөлөө тохирохоор тантай холбогдоно.' : 'Таны бүртгэл сонгосон салбарт очлоо. Тэр салбарын менежер тантай холбогдож гэрээ, төлбөрийн нөхцөлөө тохирно.';
        $('[data-done-manager]').textContent = mine ? 'Хариуцах менежер: ' + managerText() : 'Салбар: ' + branchName(branch());
        $('[data-done-course]').textContent = 'Сургалт: ' + course().dataset.name;
        $('[data-done-plan]').textContent = 'Хуваарь: ' + planText();
        steps.forEach(s => { s.hidden = true; });
        marks.forEach(m => { m.classList.remove('on'); m.classList.add('past'); });
        done.hidden = false; done.focus();
      } else {
        // The server's own Mongolian message (wrong phone, manager no longer listed…) when there is one.
        $('[data-fail-text]').textContent = /[А-Яа-яӨөҮүЁё]/.test(reason) ? reason : 'Холболт тасарсан байж магадгүй. Дахин оролдох эсвэл доорх аль нэгээр холбогдоорой.';
        fail.hidden = false; fail.focus();
      }
    });
  }
})();
