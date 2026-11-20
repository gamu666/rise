// Builds the public site from site-src/content.cjs:  node tools/build-site.cjs
// Output: index.html (home) and surgalt/<slug>.html (one real URL per course, for search and Facebook ads).
// Static HTML on purpose: fast on phones, readable by search engines, no framework.
// v5 look: apple.com structure measured 2026-11-19 (research/apple-design-study-2026-11-19.md) — 44px global nav,
// full-width units with copy on a plain surface and the photo below it (never text over a darkened photo),
// square 2-up tiles with 12px gutters, two-tone section headlines, horizontal card scrollers.
// Colour stays black & white with no gradients (owner's rule); photos are Pexels stock shown in black & white.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const C = require(path.join(root, 'site-src', 'content.cjs'));
const VERSION = 'site13';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => new Intl.NumberFormat('en-US').format(n) + '₮';
const day = iso => { const [, m, d] = iso.split('-').map(Number); return m + ' сарын ' + d; };
// Sample (unconfirmed) values carry class="s" so they can be found and replaced before launch (shown only with ?draft).
const S = (src, text) => src && src.confirmed ? esc(text) : '<span class="s">' + esc(text) + '</span>';
const track = id => C.tracks.find(t => t.id === id);
const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const more = (label, href, attrs = '') => `<a class="more" href="${href}"${attrs}>${label}<span aria-hidden="true">›</span></a>`;
// Keep an em dash on the line of the word before it, so no line ever starts with "—" on narrow screens.
const nb = s => String(s ?? '').replace(/ — /g, ' — ');
// Schedules break only at " · ", never inside "Орой 18:30" or "Амралтын өдөр".
const keep = s => String(s ?? '').split(' · ').map(p => p.replace(/ /g, ' ')).join(' · ');

// Photo files in assets/photos: [small width, large width, intrinsic width, intrinsic height of the large file].
const PHOTOS = {
  'hero-mining-shovel': [1200, 2400, 2400, 1600],
  'course-excavator': [800, 1600, 1600, 1068],
  'course-dump-truck': [800, 1600, 1600, 1067],
  'course-wheel-loader': [800, 1600, 1600, 1067],
  'course-manicure': [800, 1600, 1600, 1067],
  'course-lash': [800, 1600, 1600, 1067],
  'practice-operator-cab': [700, 1200, 1200, 1766],
  'safety-hard-hats': [800, 1400, 1400, 933],
  'beauty-lash-artist': [800, 1600, 1600, 1067],
  'excavator-sunset': [800, 1600, 1600, 1067]
};
const photoSet = (name, rel) => { const [s, b] = PHOTOS[name], base = rel + 'assets/photos/' + name; return { src: `${base}-${s}.jpg`, srcset: `${base}-${s}.jpg ${s}w, ${base}-${b}.jpg ${b}w` }; };
function img(name, alt, sizes, o = {}) {
  const [, , w, h] = PHOTOS[name], p = photoSet(name, o.rel || '');
  return `<img class="ph" src="${p.src}" srcset="${p.srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}"${o.priority ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${o.pos ? ` style="object-position:${o.pos}"` : ''}>`;
}

const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></symbol>
<symbol id="i-msg" viewBox="0 0 24 24"><path d="M12 3C7 3 3 6.7 3 11.3c0 2.6 1.3 4.9 3.3 6.4V21l3.1-1.7c.8.2 1.7.3 2.6.3 5 0 9-3.7 9-8.3S17 3 12 3Z"/><path d="m7.5 13 3-3 2.5 2 3.5-3.5"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M5 9h14M5 15h14"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25"/><circle cx="12" cy="9.5" r="3.1"/><path d="M6.45 18.15c1.23-2.55 3.08-3.82 5.55-3.82s4.32 1.27 5.55 3.82"/></symbol>
<symbol id="i-prev" viewBox="0 0 24 24"><path d="M14.5 6.5 9 12l5.5 5.5"/></symbol>
<symbol id="i-next" viewBox="0 0 24 24"><path d="M9.5 6.5 15 12l-5.5 5.5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
<symbol id="i-cap" viewBox="0 0 24 24"><path d="M21.4 10.9a1 1 0 0 0 0-1.8l-8.6-3.9a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0Z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></symbol>
<symbol id="i-brief" viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="13.5" rx="2.5"/><path d="M16 20.5V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v15.5"/></symbol>
</svg>`;

function head(title, desc, rel, bodyClass, heroPhoto) {
  const org = { '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: C.org.name, telephone: C.org.phone, address: C.org.address, sameAs: [C.org.facebook, C.org.instagram] };
  const p = photoSet(heroPhoto, rel);
  return `<!doctype html>
<html lang="mn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="mn_MN">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta name="theme-color" content="#161617">
<link rel="icon" href="${rel}assets/favicon.svg">
<link rel="preload" as="image" href="${p.src}" imagesrcset="${p.srcset}" imagesizes="100vw" fetchpriority="high">
<link rel="stylesheet" href="${rel}site.css?v=${VERSION}">
<script defer src="${rel}site.js?v=${VERSION}"></script>
<script type="application/ld+json">${JSON.stringify(org)}</script>
</head>
<body class="${bodyClass}">`;
}

// apple.com-style global nav: one 44px dark bar, 12px links, sign-in menu and a small register pill.
function header(rel, home) {
  const h = home ? '' : rel + 'index.html';
  return `<a class="skip" href="#main">Үндсэн агуулга руу</a>
<header class="gn" data-hdr>
 <div class="gn-in">
  <a class="gn-logo" href="${rel}index.html" aria-label="THE RISE нүүр хуудас"><img src="${rel}assets/figma/rise.png" alt="THE RISE" width="72" height="24"></a>
  <nav class="gn-links" id="site-menu" aria-label="Үндсэн цэс">
   <a href="${h}#hund-mashin">Хүнд машин</a><a href="${h}#goo-saikhan">Гоо сайхан</a><a href="${h}#une">Үнэ ба хуваарь</a><a href="${h}#yagaad">Яагаад THE RISE</a><a href="${h}#asuult">Асуулт</a>
   <span class="gn-login-links"><a href="${rel}staff.html#student">${icon('cap')}Сурагч нэвтрэх</a><a href="${rel}staff.html">${icon('brief')}Ажилтан нэвтрэх</a></span>
  </nav>
  <div class="gn-act">
   <div class="login" data-login>
    <button class="gn-btn login-btn" type="button" aria-expanded="false" aria-controls="login-menu">${icon('user')}<span>Нэвтрэх</span></button>
    <div class="login-menu" id="login-menu" hidden>
     <a href="${rel}staff.html#student">${icon('cap')}<span><strong>Сурагч</strong><small>Хичээл, хуваарь, төлбөр, сертификат</small></span></a>
     <a href="${rel}staff.html">${icon('brief')}<span><strong>Ажилтан</strong><small>Багш, менежер, удирдлагын самбар</small></span></a>
    </div>
   </div>
   <a class="gn-cta" href="#burtguuleh">Бүртгүүлэх</a>
   <button class="gn-btn menu" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Цэс">${icon('menu', 'i i-open')}${icon('close', 'i i-close')}</button>
  </div>
 </div>
</header>`;
}

// Shared bits ---------------------------------------------------------------------------------------------------
const meta = c => `<p class="meta">${S(c.sample, c.sample.days + ' хоног')} · ${S(c.sample, money(c.sample.price))}-өөс · Эхлэх ${S(c.sample, day(c.sample.next))}</p>`;

// A course promo tile: headline, one line, two actions on a plain surface; the photo sits underneath.
function tile(c, rel, tone) {
  const url = `${rel}surgalt/${c.slug}.html`;
  return `<article class="tile ${tone}" data-reveal>
 <div class="copy">
  <h3>${esc(c.name)}</h3>
  <p class="sub">${esc(c.tagline)}</p>
  ${meta(c)}
  <div class="ctas"><a class="btn${tone === 'dark' ? ' on-dark' : ''}" href="${url}">Дэлгэрэнгүй</a><a class="btn alt${tone === 'dark' ? ' on-dark' : ''}" href="${url}#burtguuleh">Бүртгүүлэх</a></div>
 </div>
 <figure class="media">${img(c.image, c.alt, '(max-width: 734px) 100vw, 50vw', { rel, pos: c.imagePos })}</figure>
</article>`;
}

// apple.com "Explore the lineup" card for the course scrollers.
function lineupCard(c, rel) {
  const url = `${rel}surgalt/${c.slug}.html`;
  return `<li class="lcard">
 <a class="lcard-media" href="${url}" tabindex="-1" aria-hidden="true">${img(c.image, '', '(max-width: 734px) 80vw, 372px', { rel, pos: c.imagePos })}</a>
 <p class="lcard-track">${esc(track(c.track).full)}</p>
 <h3><a href="${url}">${esc(c.name)}</a></h3>
 <p class="lcard-sub">${esc(c.tagline)}</p>
 <p class="lcard-price">${S(c.sample, money(c.sample.price))}-өөс · ${S(c.sample, c.sample.days + ' хоног')}</p>
 <div class="ctas"><a class="btn sm" href="${url}">Дэлгэрэнгүй</a>${more('Бүртгүүлэх', url + '#burtguuleh')}</div>
</li>`;
}

// Horizontal scroller with apple.com's round previous / next buttons.
function scroller(id, label, items, cls = '') {
  return `<div class="scroller ${cls}" data-scroller>
 <ul class="track" id="${id}" role="list" aria-label="${esc(label)}" tabindex="0">${items}</ul>
 <div class="scroller-nav"><button type="button" class="pager" data-dir="-1" aria-controls="${id}" aria-label="Өмнөх">${icon('prev')}</button><button type="button" class="pager" data-dir="1" aria-controls="${id}" aria-label="Дараах">${icon('next')}</button></div>
</div>`;
}

// Section headline. With `rest` it is two-tone (first sentence ink, second grey — apple.com Store pattern); used on
// at most two sections per page so it does not become a formula. Without `rest` it is one short ink headline.
const headline = (id, strong, rest, link) => `<div class="sh" data-reveal><h2 id="${id}"><span>${esc(nb(strong))}</span>${rest ? ' ' + esc(nb(rest)) : ''}</h2>${link || ''}</div>`;

function form(rel, selected) {
  const opts = C.tracks.map(t => `<optgroup label="${esc(t.full)}">` + C.courses.filter(c => c.track === t.id).map(c => `<option value="${c.slug}"${c.slug === selected ? ' selected' : ''}>${esc(c.name)}</option>`).join('') + '</optgroup>').join('');
  return `<form class="leadform" id="lead-form" novalidate data-reveal>
 <label>Овог, нэр<input name="name" autocomplete="name" required maxlength="60" placeholder="Таны нэр"></label>
 <label>Утасны дугаар<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" required pattern="[0-9]{8}" maxlength="8" placeholder="8 оронтой дугаар"></label>
 <div class="two"><label>Сургалт<select name="course" required>${selected ? '' : '<option value="" selected disabled>Сонгоно уу</option>'}${opts}</select></label>
 <label>Цаг<select name="time"><option>Өдөр</option><option>Орой</option><option>Амралтын өдөр</option></select></label></div>
 <p class="err" role="alert" hidden></p>
 <button class="btn wide" type="submit">Хүсэлт илгээх</button>
 <div class="done" hidden tabindex="-1">
  <strong>${icon('check')}Мэдээлэл тань бэлэн боллоо</strong>
  <p>Онлайн хүсэлт хараахан менежерт шууд очдоггүй. Доорх аль нэгээр нь илгээж баталгаажуулна уу.</p>
  <div class="ctas start"><a class="btn" href="tel:${C.org.tel}">${icon('phone')}Залгах</a><a class="btn alt" href="${C.org.messenger}" target="_blank" rel="noopener">${icon('msg')}Messenger</a></div>
 </div>
 <p class="fine">Аль хэдийн суралцаж байгаа бол <a href="${rel}staff.html#student">сурагчийн самбартаа нэвтэрнэ үү</a>.</p>
</form>`;
}

// FAQ on the shared 1260px shell: headline column on the left, accordion on the right (one column on phones).
function faq(cls) {
  return `<section class="sec faq-sec ${cls}" id="asuult" aria-labelledby="faq-title">
 <div class="shell faq-in">
  <div class="faq-head" data-reveal>
   <h2 id="faq-title">Түгээмэл асуулт.</h2>
   <p>Хариулт олдохгүй бол бидэнтэй холбогдоорой.</p>
   ${more('Messenger-ээр асуух', C.org.messenger, ' target="_blank" rel="noopener"')}
  </div>
  <div class="faq" data-reveal>${C.faq.map(f => `<details><summary>${esc(f.q)}<span class="pm" aria-hidden="true"></span></summary><p>${S(f.sample, f.sample.a)}</p></details>`).join('')}</div>
 </div>
</section>`;
}

// Dark registration unit: headline, what happens next and contacts on the left, the form card on the right.
// Phones and tablets stack it as headline → form → steps → contacts so the form comes first.
function enroll(rel, selected) {
  return `<section class="unit dark enroll" id="burtguuleh" aria-labelledby="enroll-title">
 <div class="enroll-in">
  <div class="enroll-copy" data-reveal>
   <h2 id="enroll-title">Бүртгүүлэх.</h2>
   <p class="sub">Нэр, утсаа үлдээгээд хуваарь, төлбөрөө менежертэй тохирно.</p>
  </div>
  ${form(rel, selected)}
  <div class="enroll-steps" data-reveal>
   <h3 class="flow-h">Суралцах явц</h3>
   <ol class="flow">${C.steps.map(([a, b], i) => `<li><span class="num">${i + 1}</span><div><strong>${esc(nb(a))}</strong><p>${esc(nb(b))}</p></div></li>`).join('')}</ol>
  </div>
  <ul class="contacts"><li>${icon('phone')}<a href="tel:${C.org.tel}">${C.org.phone}</a></li><li>${icon('msg')}<a href="${C.org.messenger}" target="_blank" rel="noopener">Messenger</a></li><li>${icon('pin')}<span>${esc(C.org.address)}</span></li></ul>
 </div>
</section>`;
}

function footer(rel, home) {
  const h = home ? '' : rel + 'index.html';
  return `<footer class="ft" id="holboo">
 <div class="shell">
  <p class="ft-note">Сургалтын үнэ, хугацаа, анги эхлэх өдөр өөрчлөгдөж болно. Бүртгүүлэхээсээ өмнө менежерээс лавлана уу.</p>
  <div class="ft-dir">
   <div><h3>Хүнд машин</h3><ul>${C.courses.filter(c => c.track === 'heavy').map(c => `<li><a href="${rel}surgalt/${c.slug}.html">${esc(c.name)}</a></li>`).join('')}</ul></div>
   <div><h3>Гоо сайхан</h3><ul>${C.courses.filter(c => c.track === 'beauty').map(c => `<li><a href="${rel}surgalt/${c.slug}.html">${esc(c.name)}</a></li>`).join('')}</ul></div>
   <div><h3>Нэвтрэх</h3><ul><li><a href="${rel}staff.html#student">Сурагч</a></li><li><a href="${rel}staff.html">Ажилтан</a></li><li><a href="${h}#burtguuleh">Бүртгүүлэх</a></li></ul></div>
   <div><h3>Холбоо барих</h3><ul><li><a href="tel:${C.org.tel}">${C.org.phone}</a></li><li><a href="${C.org.messenger}" target="_blank" rel="noopener">Messenger</a></li><li><a href="${C.org.facebook}" target="_blank" rel="noopener">Facebook</a></li><li><a href="${C.org.instagram}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
  </div>
  <div class="ft-legal"><span>© ${new Date().getFullYear()} ${esc(C.org.name)}. Таны өсөлт — бидний зорилго.</span><span>${esc(C.org.address)}</span></div>
 </div>
</footer>
<div class="bar" aria-label="Холбоо барих">
 <a href="tel:${C.org.tel}">${icon('phone')}Залгах</a><a href="${C.org.messenger}" target="_blank" rel="noopener">${icon('msg')}Messenger</a><a class="go" href="#burtguuleh">Бүртгүүлэх</a>
</div>
${sprite}
</body>
</html>
`;
}

// Student-portal preview drawn in plain HTML (black & white, no personal data).
const portalMock = `<div class="mock" aria-hidden="true">
 <div class="mock-top"><b>Өнөөдөр</b><span>Пүрэв</span></div>
 <div class="mock-row on"><b>10:00</b><span>Онолын хичээл<small>Аюулгүй ажиллагаа</small></span></div>
 <div class="mock-row"><b>14:00</b><span>Машин дээрх дадлага<small>Экскаватор</small></span></div>
 <p class="mock-h">Сургалтын явц</p>
 <div class="mock-track"><i></i></div>
</div>`;

// Staff-dashboard preview for the dark tile: generic feature labels only — no names, counts or amounts.
const staffMock = `<div class="mock night" aria-hidden="true">
 <div class="mock-top"><b>Өнөөдөр</b><span>Ажилтны самбар</span></div>
 <div class="mock-row on">${icon('check')}<span>Даалгавар<small>Удирдлагаас ирсэн</small></span></div>
 <div class="mock-row">${icon('msg')}<span>Багийн чат<small>Шинэ мессеж</small></span></div>
 <p class="mock-h">Сарын зорилго</p>
 <div class="mock-track"><i></i></div>
</div>`;

// Certificate drawn in HTML for the last "why" card: logo, title and blank lines only — no name, number or date.
const certMock = rel => `<div class="cert" aria-hidden="true">
 <div class="cert-in">
  <img src="${rel}assets/figma/rise.png" alt="" width="72" height="24">
  <p class="cert-k">Сертификат</p>
  <p class="cert-c">Мэргэжлийн сургалт төгссөн</p>
  <i class="cert-l"></i>
  <div class="cert-f"><i class="cert-seal"></i><i class="cert-sig"></i></div>
 </div>
</div>`;

function home() {
  const rel = '', byTrack = id => C.courses.filter(c => c.track === id), heavy = byTrack('heavy'), beauty = byTrack('beauty');
  const [lead, ...restHeavy] = heavy;
  // data-label feeds the stacked phone layout of the table (site.css, max-width 734px).
  const rows = C.courses.map(c => `<tr><th scope="row"><a href="surgalt/${c.slug}.html">${esc(c.name)}</a><small>${esc(track(c.track).full)}</small></th><td class="num" data-label="Эхлэх үнэ">${S(c.sample, money(c.sample.price))}</td><td data-label="Хугацаа">${S(c.sample, c.sample.days + ' хоног')}</td><td data-label="Цаг">${S(c.sample, keep(c.sample.schedule))}</td><td data-label="Дараагийн анги">${S(c.sample, day(c.sample.next))}</td></tr>`).join('');
  const why = [
    ['Дадлага', 'Бодит машин дээр сурна.', 'Онолын хичээлээ машины бүхээгт бататгана.', img('practice-operator-cab', 'Хүнд машины бүхээгт удирдлагын хөшүүрэг барьсан оператор', '(max-width: 734px) 80vw, 372px', { pos: '50% 28%' })],
    ['Аюулгүй ажиллагаа', 'Эхний өдрөөс дүрэм, дадал.', 'Техник ашиглах аюулгүй ажиллагааг бүх сургалтын эхэнд үзнэ.', img('safety-hard-hats', 'Барилгын талбай дээрх хамгаалалтын малгайнууд', '(max-width: 734px) 80vw, 372px')],
    ['Гоо сайхан', 'Загвар дээр гараа суулгана.', 'Маникюр, сормуусны сургалтад загвар, үйлчлүүлэгч дээр дадлага хийнэ.', img('beauty-lash-artist', 'Сормуусны мастер үйлчлүүлэгчтэй ажиллаж буй нь', '(max-width: 734px) 80vw, 372px')],
    ['Сурагчийн самбар', 'Хуваарь, явц, төлбөр — утсандаа.', 'Бүртгүүлсний дараа өөрийн самбартаа нэвтэрч хичээлээ хянана.', portalMock],
    ['Сертификат', 'Шалгалтад тэнцээд авна.', 'Төгсөлтийн шалгалтын дараа THE RISE-ийн сертификат олгоно.', certMock(rel)]
  ].map(([eyebrow, title, text, visual]) => `<li class="wcard"><p class="eyebrow">${eyebrow}</p><h3>${esc(nb(title))}</h3><p>${esc(nb(text))}</p><div class="wcard-visual">${visual}</div></li>`).join('');
  return head('THE RISE — Хүнд машин, гоо сайхны мэргэжлийн сургалт', 'Экскаватор, дамп, ковш оператор, маникюр, сормуусны сургалт. Үнэ, хугацаа, хуваарь ил тод. Бодит дадлага, сертификат.', rel, 'home', 'hero-mining-shovel') + `
${header(rel, true)}
<main id="main">
 <section class="unit dark hero" aria-labelledby="hero-title">
  <div class="copy">
   <h1 id="hero-title">${nb('Таны өсөлт — бидний зорилго.')}</h1>
   <p class="sub">Хүнд машин механизм, гоо сайхны мэргэжлийн сургалт.</p>
   <div class="ctas"><a class="btn on-dark" href="#hund-mashin">Сургалтууд үзэх</a><a class="btn alt on-dark" href="#burtguuleh">Бүртгүүлэх</a></div>
  </div>
  <figure class="media">${img('hero-mining-shovel', 'Бүрэнхий үеийн уурхайд ажиллаж буй том экскаватор', '100vw', { priority: true, pos: '45% 58%' })}</figure>
 </section>

 <section class="unit light" id="hund-mashin" aria-labelledby="heavy-title">
  <div class="copy" data-reveal>
   <p class="kicker">Хүнд машин механизм</p>
   <h2 id="heavy-title">${esc(lead.name)}</h2>
   <p class="sub">${esc(lead.tagline)}</p>
   ${meta(lead)}
   <div class="ctas"><a class="btn" href="surgalt/${lead.slug}.html">Дэлгэрэнгүй</a><a class="btn alt" href="surgalt/${lead.slug}.html#burtguuleh">Бүртгүүлэх</a></div>
  </div>
  <figure class="media">${img(lead.image, lead.alt, '100vw', { pos: lead.imagePos })}</figure>
 </section>

 <div class="tiles" aria-label="Хүнд машины бусад сургалт">
  ${restHeavy.map((c, i) => tile(c, rel, i % 2 ? 'light' : 'dark')).join('')}
 </div>
 <div class="tiles" id="goo-saikhan" aria-label="Гоо сайхны сургалт">
  ${beauty.map((c, i) => tile(c, rel, i % 2 ? 'dark' : 'light')).join('')}
 </div>

 <section class="sec" id="une" aria-labelledby="price-title">
  <div class="shell">
   ${headline('price-title', 'Үнэ ба хуваарь.', '', more('Бүртгүүлэх', '#burtguuleh'))}
   <div class="table" data-reveal><table><thead><tr><th scope="col">Сургалт</th><th scope="col">Эхлэх үнэ</th><th scope="col">Хугацаа</th><th scope="col">Цаг</th><th scope="col">Дараагийн анги</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>
 </section>

 <section class="sec gray" id="yagaad" aria-labelledby="why-title">
  <div class="shell">${headline('why-title', 'Яагаад THE RISE.', 'Онол, дадлага, сертификат — нэг дор.')}</div>
  ${scroller('why-track', 'Яагаад THE RISE', why, 'why')}
 </section>

 <div class="tiles portal" id="nevtreh">
  <article class="tile light" data-reveal>
   <div class="copy">
    <h3>Сурагч</h3>
    <p class="sub">Хичээл, хуваарь, төлбөр, сертификатаа нэг дороос.</p>
    <div class="ctas"><a class="btn" href="staff.html#student">Сурагч нэвтрэх</a><a class="btn alt" href="#burtguuleh">Бүртгүүлэх</a></div>
   </div>
   <div class="media pane">${portalMock}</div>
  </article>
  <article class="tile dark" data-reveal>
   <div class="copy">
    <h3>Ажилтан</h3>
    <p class="sub">Багш, менежер, удирдлагын самбар.</p>
    <div class="ctas"><a class="btn on-dark" href="staff.html">Ажилтан нэвтрэх</a></div>
   </div>
   <div class="media pane">${staffMock}</div>
  </article>
 </div>

 ${faq('')}

 ${enroll(rel, '')}
</main>
` + footer(rel, true);
}

function coursePage(c) {
  const rel = '../', s = c.sample, t = track(c.track), p = C.policy.sample;
  const others = C.courses.filter(x => x.slug !== c.slug && x.track === c.track).concat(C.courses.filter(x => x.track !== c.track));
  const facts = c.track === 'heavy'
    ? [[s.days + ' хоног', 'Сургалтын хугацаа'], [s.theory + ' / ' + s.practice + ' цаг', 'Онол / машин дээр'], [money(s.price), 'Эхлэх үнэ'], [day(s.next), 'Дараагийн анги']]
    : [[s.days + ' хоног', 'Сургалтын хугацаа'], [s.materials, 'Материал'], [money(s.price), 'Эхлэх үнэ'], [day(s.next), 'Дараагийн анги']];
  const practice = c.track === 'heavy' ? `Талбайн дадлага — ${S(s, s.machine)}` : 'Загвар, үйлчлүүлэгч дээрх дадлага';
  return head(`${c.name} сургалт — THE RISE`, `${c.description} Үнэ, хугацаа, хуваарь, бүртгэл.`, rel, 'course ' + c.track, c.image) + `
${header(rel, false)}
<main id="main">
 <section class="unit dark hero" aria-labelledby="course-title">
  <div class="copy">
   <p class="kicker">${esc(t.full)}</p>
   <h1 id="course-title">${esc(c.name)}</h1>
   <p class="sub">${esc(c.tagline)}</p>
   <div class="ctas"><a class="btn on-dark" href="#burtguuleh">Бүртгүүлэх</a><a class="btn alt on-dark" href="tel:${C.org.tel}">${icon('phone')}Залгах</a></div>
  </div>
  <figure class="media">${img(c.image, c.alt, '100vw', { rel, priority: true, pos: c.imagePos })}</figure>
 </section>

 <section class="sec" aria-labelledby="facts-title">
  <div class="shell">
   ${headline('facts-title', 'Гол мэдээлэл.', '')}
   <p class="lede" data-reveal>${esc(c.description)}</p>
   <dl class="facts" data-reveal>${facts.map(([v, k]) => `<div><dt>${k}</dt><dd>${S(s, v)}</dd></div>`).join('')}</dl>
  </div>
 </section>

 <section class="sec gray" aria-labelledby="program-title">
  <div class="shell">
   ${headline('program-title', 'Хөтөлбөр.', 'Онолоос төгсөлтийн шалгалт хүртэл.')}
   <div class="cbody" data-reveal>
    <ol class="topics">${c.topics.map(x => `<li><span>${esc(x)}</span></li>`).join('')}<li><span>${practice}</span></li><li><span>Төгсөлтийн шалгалт, сертификат</span></li></ol>
    <dl class="side"><div><dt>Хуваарь</dt><dd>${S(s, keep(s.schedule))}</dd></div><div><dt>Шаардлага</dt><dd>${S(p, p.requirements)}</dd></div><div><dt>Төлбөр</dt><dd>Хувааж төлөх: ${S(p, p.installments)}</dd></div><div class="side-link">${more('Messenger-ээр асуух', C.org.messenger, ' target="_blank" rel="noopener"')}</div></dl>
   </div>
  </div>
 </section>

 ${faq('')}

 ${enroll(rel, c.slug)}

 <section class="sec gray" aria-labelledby="others-title">
  <div class="shell">${headline('others-title', 'Бусад сургалтууд.', 'Өөрт тохирохыг нь сонго.')}</div>
  ${scroller('others-track', 'Бусад сургалтууд', others.map(o => lineupCard(o, rel)).join(''), 'lineup')}
 </section>
</main>
` + footer(rel, false);
}

fs.mkdirSync(path.join(root, 'surgalt'), { recursive: true });
fs.writeFileSync(path.join(root, 'index.html'), home());
for (const c of C.courses) fs.writeFileSync(path.join(root, 'surgalt', c.slug + '.html'), coursePage(c));
const samples = (fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/class="s"/g) || []).length;
console.log('Built index.html + ' + C.courses.length + ' course pages. Sample values marked on home: ' + samples + ' (visible with ?draft)');
