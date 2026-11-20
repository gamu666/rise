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

  // Registration form.
  const LEAD_URL = 'https://lwgxvtkhetkelmihaynt.supabase.co/rest/v1/rpc/submit_web_lead';
  const LEAD_KEY = 'sb_publishable_S6UNtZDweK06zFymdMexYQ_s59ljSXH';
  const form = document.querySelector('#lead-form');
  if (!form) return;
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
      const res = await fetch(LEAD_URL, {
        method: 'POST', signal: stop.signal,
        headers: { apikey: LEAD_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_name: name.value.trim(), p_phone: phone.value, p_course: course.selectedOptions[0]?.textContent.trim() || '', p_time: form.elements.time.value })
      });
      clearTimeout(timer);
      ok = res.ok && (await res.json()) === true;
    } catch { ok = false; }
    sending = false; send.disabled = false; send.textContent = label;
    if (ok) { send.hidden = true; done.hidden = false; done.focus(); }
    else { fail.hidden = false; fail.focus(); }
  });
})();
