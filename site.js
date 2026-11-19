// THE RISE public site: pill header (light/dark by the section under it, active link), sign-in menu, mobile menu,
// course filter, scroll reveal, registration form.
// The form has no server yet: a valid request is kept in this browser only (rise-web-leads-v1) and the visitor is
// asked to confirm by phone or Messenger. Nothing is sent anywhere — do not claim delivery until a backend exists.
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

  // Reveal on scroll. Only elements that start below the fold are hidden first, so nothing visible ever blinks,
  // and without IntersectionObserver or with reduced motion everything simply stays visible.
  const reveal = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.remove('pre');
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveal.forEach((el, i) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('pre');
      el.style.transitionDelay = (i % 2) * 80 + 'ms';
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
  const form = document.querySelector('#lead-form');
  if (!form) return;
  const err = form.querySelector('.err'), done = form.querySelector('.done');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.elements.name, phone = form.elements.phone, course = form.elements.course;
    phone.value = phone.value.replace(/\D/g, '');
    const problems = [];
    [name, phone, course].forEach(f => f.removeAttribute('aria-invalid'));
    if (name.value.trim().length < 2) { problems.push('Нэрээ бичнэ үү.'); name.setAttribute('aria-invalid', 'true'); }
    if (!/^[0-9]{8}$/.test(phone.value)) { problems.push('Утасны дугаар 8 оронтой байна.'); phone.setAttribute('aria-invalid', 'true'); }
    if (!course.value) { problems.push('Сургалтаа сонгоно уу.'); course.setAttribute('aria-invalid', 'true'); }
    err.hidden = !problems.length; err.textContent = problems.join(' ');
    if (problems.length) { form.querySelector('[aria-invalid=true]')?.focus(); return; }
    const lead = { id: 'web-' + Date.now(), name: name.value.trim(), phone: phone.value, course: course.value, time: form.elements.time.value, createdAt: new Date().toISOString(), source: location.pathname };
    try { const list = JSON.parse(localStorage.getItem('rise-web-leads-v1') || '[]'); list.push(lead); localStorage.setItem('rise-web-leads-v1', JSON.stringify(list.slice(-200))); } catch { /* storage blocked: still show contact options */ }
    form.querySelector('button[type=submit]').hidden = true;
    done.hidden = false; done.focus();
  });
})();
