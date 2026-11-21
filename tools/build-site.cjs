// Builds the public site from site-src/content.cjs:  node tools/build-site.cjs
// Output: index.html (home) and surgalt/<slug>.html (one real URL per course, for search and Facebook ads).
// Static HTML on purpose: fast on phones, readable by search engines, no framework.
// v4 look: the design system and proportions of НАЙМАН САР (naimansar.com, source gamu666/octa-sar-website) —
// Apple-style system typography, pill navigation, 24px cards with 12px gaps, centred tiles — in black & white only:
// no gradients, no accent colour, photos shown in black & white (Pexels stock, see assets/photos/CREDITS.md).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const C = require(path.join(root, 'site-src', 'content.cjs'));
const VERSION = 'site15';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => new Intl.NumberFormat('en-US').format(n) + '₮';
const day = iso => { const [, m, d] = iso.split('-').map(Number); return m + ' сарын ' + d; };
// Sample (unconfirmed) values carry class="s" so they can be found and replaced before launch (shown only with ?draft).
const S = (src, text) => src && src.confirmed ? esc(text) : '<span class="s">' + esc(text) + '</span>';
const track = id => C.tracks.find(t => t.id === id);
const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
// Headings whose words rise into place (site.css .w/.wi). The heading keeps its whole text as aria-label and the word
// spans are aria-hidden, so screen readers hear one phrase. Parts alternate plain / emphasised; the emphasis is the
// naimansar.com italic serif. Georgia has no Ө/Ү, so emphasised words must not contain those letters.
function rise(parts) {
  let i = 0;
  return parts.map((t, k) => String(t).trim().split(/\s+/).filter(Boolean)
    .map(w => `<span class="w"><span class="wi" style="--i:${i++}">${k % 2 ? `<em>${esc(w)}</em>` : esc(w)}</span></span>`).join(' '))
    .filter(Boolean).join(' ');
}
const H = (tag, id, ...parts) => `<${tag} id="${id}" aria-label="${esc(parts.join(' ').replace(/\s+/g, ' ').trim())}"><span aria-hidden="true">${rise(parts)}</span></${tag}>`;

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
  return `<img class="ph${o.cls ? ' ' + o.cls : ''}" src="${p.src}" srcset="${p.srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}"${o.priority ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${o.pos ? ` style="object-position:${o.pos}"` : ''}>`;
}

const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></symbol>
<symbol id="i-msg" viewBox="0 0 24 24"><path d="M12 3C7 3 3 6.7 3 11.3c0 2.6 1.3 4.9 3.3 6.4V21l3.1-1.7c.8.2 1.7.3 2.6.3 5 0 9-3.7 9-8.3S17 3 12 3Z"/><path d="m7.5 13 3-3 2.5 2 3.5-3.5"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-ig" viewBox="0 0 24 24"><rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.1"/><circle cx="12" cy="12" r="4.05"/><circle cx="17.55" cy="6.65" r=".6"/></symbol>
<symbol id="i-fb" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25"/><path d="M13.3 20.7v-6.4h2.4l.4-2.6h-2.8V10c0-.8.3-1.3 1.4-1.3h1.5V6.4a17 17 0 0 0-2.2-.1c-2.2 0-3.6 1.3-3.6 3.7v1.7H8v2.6h2.4v6.4"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25"/><circle cx="12" cy="9.5" r="3.1"/><path d="M6.45 18.15c1.23-2.55 3.08-3.82 5.55-3.82s4.32 1.27 5.55 3.82"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
<symbol id="i-cap" viewBox="0 0 24 24"><path d="M21.4 10.9a1 1 0 0 0 0-1.8l-8.6-3.9a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0Z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></symbol>
<symbol id="i-brief" viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="13.5" rx="2.5"/><path d="M16 20.5V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v15.5"/></symbol>
</svg>`;

// page: "home" or the course slug; site.js counts views and clicks per page for the CRM's website card.
function head(title, desc, rel, bodyClass, heroPhoto, page) {
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
<meta name="theme-color" content="#000000">
<link rel="icon" href="${rel}assets/favicon.svg">
<link rel="preload" as="image" href="${p.src}" imagesrcset="${p.srcset}" imagesizes="100vw" fetchpriority="high">
<link rel="stylesheet" href="${rel}site.css?v=${VERSION}">
<script defer src="${rel}site.js?v=${VERSION}"></script>
<script type="application/ld+json">${JSON.stringify(org)}</script>
</head>
<body class="${bodyClass}" data-page="${page}">`;
}

// Pill navigation (naimansar.com layout): brand · section links · social, sign-in, register.
function header(rel, home) {
  const h = home ? '' : rel + 'index.html';
  return `<a class="skip" href="#main">Үндсэн агуулга руу</a>
<header class="hdr" data-hdr>
 <div class="hdr-pill">
  <a class="brand" href="${rel}index.html" aria-label="THE RISE нүүр хуудас"><img src="${rel}assets/figma/rise.png" alt="THE RISE" width="99" height="33"></a>
  <nav class="nav" id="site-menu" aria-label="Үндсэн цэс">
   <a href="${h}#surgalt">Сургалтууд</a><a href="${h}#davuu">Давуу тал</a><a href="${h}#yavts">Суралцах явц</a><a href="${h}#une">Үнэ</a><a href="${h}#asuult">Асуулт</a>
   <span class="nav-login"><a href="${rel}staff.html#student">${icon('cap')}Сурагч нэвтрэх</a><a href="${rel}staff.html">${icon('brief')}Ажилтан нэвтрэх</a></span>
  </nav>
  <div class="hdr-act">
   <a class="hicon social" href="${C.org.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon('fb')}</a>
   <a class="hicon social" href="${C.org.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('ig')}</a>
   <div class="login" data-login>
    <button class="login-btn" type="button" aria-expanded="false" aria-controls="login-menu">${icon('user')}<span>Нэвтрэх</span></button>
    <div class="login-menu" id="login-menu" hidden>
     <a href="${rel}staff.html#student">${icon('cap')}<span><strong>Сурагч</strong><small>Хичээл, хуваарь, төлбөр, сертификат</small></span></a>
     <a href="${rel}staff.html">${icon('brief')}<span><strong>Ажилтан</strong><small>Багш, менежер, удирдлагын самбар</small></span></a>
    </div>
   </div>
   <a class="nav-cta" href="#burtguuleh">Бүртгүүлэх</a>
   <button class="menu" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Цэс">${icon('menu', 'i i-open')}${icon('close', 'i i-close')}</button>
  </div>
 </div>
</header>`;
}

// One course as a centred photo tile (Apple / naimansar tile proportions).
function tile(c, rel) {
  const s = c.sample, url = `${rel}surgalt/${c.slug}.html`;
  return `<article class="tile" data-track="${c.track}" data-reveal>
 ${img(c.image, c.alt, '(max-width: 900px) 100vw, 50vw', { rel, cls: 'tile-bg', pos: c.imagePos })}
 <span class="veil" aria-hidden="true"></span>
 <div class="tile-copy">
  <p class="eyebrow">${esc(track(c.track).full)}</p>
  <h3>${esc(c.name)}</h3>
  <p class="tile-sub">${esc(c.description)}</p>
  <p class="tile-meta"><span>Хугацаа <b>${S(s, s.days + ' хоног')}</b></span><span>Үнэ <b>${S(s, money(s.price))}</b>-өөс</span><span>Эхлэх <b>${S(s, day(s.next))}</b></span></p>
  <div class="actions"><a class="btn white" href="${url}">Дэлгэрэнгүй</a><a class="btn outline-white" href="${url}#burtguuleh">Бүртгүүлэх</a></div>
 </div>
</article>`;
}

function helpTile() {
  return `<article class="tile tile-help" data-reveal>
 <div class="tile-copy">
  <p class="eyebrow">Зөвлөгөө</p>
  <h3>Аль сургалт танд тохирох вэ?</h3>
  <p class="tile-sub">Менежертэй ярилцаад өөрийн цаг, зорилгод тохирох сургалтаа сонгоорой.</p>
  <div class="actions"><a class="btn" href="tel:${C.org.tel}">${icon('phone')}${C.org.phone}</a><a class="btn outline" href="${C.org.messenger}" target="_blank" rel="noopener">${icon('msg')}Messenger</a></div>
 </div>
</article>`;
}

// Registration without a request step (owner request 2026-11-21): the visitor answers whether a manager already
// looks after them and picks that manager (or a branch), picks the course, builds their own weekly schedule, takes the
// account data from e-Mongolia (name, register number and photo without typing errors) and signs the training contract
// with GSign — two separate services (owner, 2026-11-22). site.js fills the manager and branch lists from Supabase
// (web_registration_options) and sends the result to register_web, which puts the lead straight into the chosen
// manager's CRM list. e-Mongolia and GSign are not connected yet: their steps explain exactly which data will be taken
// and how the contract is signed, their buttons stay disabled with "Удахгүй" next to an "Алгасах" choice (owner
// request), and the visitor gives a name and phone number — nothing on the page imitates e-Mongolia or a signature.
function form(rel, selected) {
  const courses = C.tracks.map(t => C.courses.filter(c => c.track === t.id).map(c => `<label class="acct-course"><input type="radio" name="course" value="${c.slug}" data-name="${esc(c.name)}"${c.slug === selected ? ' checked' : ''}><strong>${esc(c.name)}</strong><span>${esc(t.full)}</span></label>`).join('')).join('');
  const contact = `<div class="actions start"><a class="btn" href="tel:${C.org.tel}">${icon('phone')}Залгах</a><a class="btn outline" href="${C.org.messenger}" target="_blank" rel="noopener">${icon('msg')}Messenger</a></div>`;
  const soon = (mark, label, cls = '') => `<button class="btn${cls} acct-provider" type="button" disabled aria-disabled="true"><span class="mark" aria-hidden="true">${mark}</span>${label}<span class="acct-soon">Удахгүй</span></button>`;
  return `<form class="leadform acct" id="lead-form" novalidate data-reveal>
 <ol class="acct-steps" aria-hidden="true"><li class="on">Менежер</li><li>Сургалт</li><li>Хуваарь</li><li>e-Mongolia</li><li>Холбоо</li><li>Гэрээ</li></ol>
 <div class="acct-step" data-step="1">
  <h3>Таныг хариуцсан менежер байгаа юу?</h3>
  <p>Танд зөвлөсөн менежер байвал шууд сонгоорой. Байхгүй бол салбараа сонгоход тэр салбарын менежер хариуцна.</p>
  <div class="acct-seg" role="radiogroup" aria-label="Хариуцсан менежер"><label><input type="radio" name="has" value="yes">Тийм, байгаа</label><label><input type="radio" name="has" value="no">Үгүй</label></div>
  <div class="acct-pick" data-pick="yes" hidden>
   <label class="acct-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" name="managerQuery" placeholder="Менежерийн нэрээр хайх" aria-label="Менежер хайх" autocomplete="off" enterkeyhint="search"></label>
   <div class="acct-managers" role="radiogroup" aria-label="Менежерүүд"></div>
   <p class="acct-empty" data-nomatch hidden>Ийм нэртэй менежер олдсонгүй.</p>
  </div>
  <div class="acct-pick" data-pick="no" hidden>
   <p class="acct-legend">Аль салбарт суралцах вэ?</p>
   <div class="acct-seg three" role="radiogroup" aria-label="Салбар" data-branches></div>
  </div>
  <p class="acct-empty" data-status role="status" hidden></p>
  <p class="err" role="alert" hidden></p>
  <div class="acct-row"><button class="btn" type="button" data-next>Үргэлжлүүлэх</button></div>
 </div>
 <div class="acct-step" data-step="2" hidden>
  <h3>Сургалтаа сонгоно уу</h3>
  <div class="acct-courses" role="radiogroup" aria-label="Сургалт">${courses}</div>
  <p class="err" role="alert" hidden></p>
  <div class="acct-row"><button class="btn outline" type="button" data-back>Буцах</button><button class="btn" type="button" data-next>Үргэлжлүүлэх</button></div>
 </div>
 <div class="acct-step" data-step="3" hidden>
  <h3>Өөрийн хуваариа гаргана уу</h3>
  <p>Суралцах өдрүүдээ сонгоод өдөр бүрийн цагаа өөрөө тохируулна.</p>
  <div class="acct-days" role="group" aria-label="Суралцах өдрүүд"></div>
  <div class="acct-slots"></div>
  <p class="acct-sum" data-sum hidden></p>
  <button class="acct-link" type="button" data-same hidden>Эхний өдрийн цагийг бүх өдөрт хэрэглэх</button>
  <p class="err" role="alert" hidden></p>
  <div class="acct-row"><button class="btn outline" type="button" data-back>Буцах</button><button class="btn" type="button" data-next>Үргэлжлүүлэх</button></div>
 </div>
 <div class="acct-step" data-step="4" hidden>
  <h3>e-Mongolia-аас мэдээллээ авах</h3>
  <p>Данс нээхэд овог, нэр, регистрийн дугаараа гараар бичихгүй. e-Mongolia-аас шууд авснаар алдаагүй бүртгэгдэнэ. Бид зөвхөн дараах 3 мэдээллийг авна:</p>
  <ul class="acct-gives"><li><span>Регистрийн дугаар</span></li><li><span>Овог, нэр</span></li><li><span>Иргэний бүртгэлийн зураг<small>Таны дансны зураг болж, сурагчийн үнэмлэх, сертификатад хэвлэгдэнэ</small></span></li></ul>
  <p class="acct-fine">Үүнээс өөр мэдээлэл авахгүй. 18 нас хүрээгүй бол эцэг, эх эсвэл асран хамгаалагч нь өөрийн e-Mongolia-аар нэвтэрч, гэрээнд GSign-аар гарын үсэг зурна.</p>
  ${soon('e', 'e-Mongolia-аар нэвтрэх')}
  <p class="err" role="alert" hidden></p>
  <div class="acct-row"><button class="btn outline" type="button" data-back>Буцах</button><button class="btn" type="button" data-next>Алгасах</button></div>
 </div>
 <div class="acct-step" data-step="5" hidden>
  <h3>Холбоо барих мэдээлэл</h3>
  <p>Менежер тантай энэ утсаар холбогдоно.</p>
  <label>Овог, нэр<input name="name" autocomplete="name" required maxlength="60" placeholder="Таны нэр"></label>
  <label>Утасны дугаар<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" required pattern="[0-9]{8}" maxlength="12" placeholder="8 оронтой дугаар"></label>
  <label class="hp" aria-hidden="true">Вэб хуудас<input name="website" tabindex="-1" autocomplete="off"></label>
  <p class="err" role="alert" hidden></p>
  <div class="acct-row"><button class="btn outline" type="button" data-back>Буцах</button><button class="btn" type="button" data-next>Үргэлжлүүлэх</button></div>
 </div>
 <div class="acct-step" data-step="6" hidden>
  <h3>Сургалтын гэрээ</h3>
  <p>Гэрээгээ GSign цахим гарын үсгээр онлайнаар байгуулна. Салбар дээр ирэх шаардлагагүй.</p>
  <article class="acct-contract"><strong>Гэрээний гол мэдээлэл</strong><dl><dt>Суралцагч</dt><dd data-c-name></dd><dt>Сургалт</dt><dd data-c-course></dd><dt>Хуваарь</dt><dd data-c-plan></dd><dt data-c-who>Хариуцах менежер</dt><dd data-c-manager></dd><dt>Төлбөр</dt><dd>Гэрээний хавсралтаар</dd></dl></article>
  <div class="acct-sign">${soon('G', 'GSign-аар гарын үсэг зурах')}</div>
  <p class="acct-fine">Алгасвал менежер тантай холбогдож гэрээг байгуулна.</p>
  <p class="err" role="alert" hidden></p>
  <div class="acct-row"><button class="btn outline" type="button" data-back>Буцах</button><button class="btn" type="submit">Алгасаад бүртгүүлэх</button></div>
 </div>
 <div class="done" hidden tabindex="-1">
  <strong>${icon('check')}Бүртгэгдлээ</strong>
  <p data-done-text></p>
  <ul class="acct-next"><li data-done-manager></li><li data-done-course></li><li data-done-plan></li><li class="wait">e-Mongolia-аас мэдээлэл авах — алгассан</li><li class="wait">GSign гэрээ — менежер тантай байгуулна</li></ul>
  ${contact}
 </div>
 <div class="done fail" hidden tabindex="-1">
  <strong>Бүртгэл илгээгдсэнгүй</strong>
  <p data-fail-text>Холболт тасарсан байж магадгүй. Дахин оролдох эсвэл доорх аль нэгээр холбогдоорой.</p>
  ${contact}
 </div>
 <p class="fine">Аль хэдийн суралцаж байгаа бол <a href="${rel}staff.html#student">сурагчийн самбартаа нэвтэрнэ үү</a>.</p>
</form>`;
}

function faqSection(cls) {
  return `<section class="faq-sec ${cls}" id="asuult" aria-labelledby="faq-title">
 <div class="shell">
  <div class="sec-h" data-reveal><p class="eyebrow">Түгээмэл асуулт</p>${H('h2', 'faq-title', 'Асуулт байна уу?')}</div>
  <div class="faq" data-reveal>${C.faq.map(f => `<details><summary>${esc(f.q)}<span class="pm" aria-hidden="true"></span></summary><p>${S(f.sample, f.sample.a)}</p></details>`).join('')}</div>
  <p class="faq-more">Хариулт олдохгүй бол <a href="${C.org.messenger}" target="_blank" rel="noopener">Messenger-ээр бичээрэй</a>.</p>
 </div>
</section>`;
}

// Dark call-out with the registration form (naimansar.com .ap-callout proportions).
function callout(rel, selected) {
  return `<section class="callout" id="burtguuleh" data-theme="dark" aria-labelledby="enroll-title">
 <div class="callout-copy" data-reveal>
  <p class="eyebrow">THE RISE-д бүртгүүлэх</p>
  ${H('h2', 'enroll-title', 'Ирээдүйгээ өнөөдрөөс бүтээ.')}
  <p class="lead">Хариуцах менежер, сургалт, хуваариа өөрөө сонгоод шууд бүртгүүлээрэй.</p>
 </div>
 ${form(rel, selected)}
 <ul class="contacts"><li>${icon('phone')}<a href="tel:${C.org.tel}">${C.org.phone}</a></li><li>${icon('msg')}<a href="${C.org.messenger}" target="_blank" rel="noopener">Messenger</a></li><li>${icon('pin')}<span>${esc(C.org.address)}</span></li></ul>
</section>`;
}

function footer(rel, home) {
  const h = home ? '' : rel + 'index.html';
  return `<footer class="foot" id="holboo">
 <div class="shell">
  <div class="fgrid">
   <div class="foot-brand"><a href="${rel}index.html" aria-label="THE RISE нүүр хуудас"><img src="${rel}assets/figma/rise.png" alt="THE RISE" width="99" height="33"></a><p class="tagline">Таны өсөлт — бидний зорилго.</p><p>${esc(C.org.intro)}</p></div>
   <div><h4>Сургалт</h4><ul>${C.courses.map(c => `<li><a href="${rel}surgalt/${c.slug}.html">${esc(c.name)}</a></li>`).join('')}</ul></div>
   <div><h4>Холбоо барих</h4><ul><li><a href="tel:${C.org.tel}">${C.org.phone}</a></li><li><a href="${C.org.messenger}" target="_blank" rel="noopener">Messenger</a></li><li>${esc(C.org.address)}</li></ul></div>
   <div><h4>Нэвтрэх</h4><ul><li><a href="${rel}staff.html#student">Сурагч</a></li><li><a href="${rel}staff.html">Ажилтан</a></li><li><a href="${h}#burtguuleh">Бүртгүүлэх</a></li></ul></div>
  </div>
  <div class="foot-meta"><span>Улаанбаатар, Монгол Улс</span><span class="socials"><a href="${C.org.instagram}" target="_blank" rel="noopener">Instagram ↗</a><a href="${C.org.facebook}" target="_blank" rel="noopener">Facebook · ${C.org.followers} ↗</a></span><span>© ${new Date().getFullYear()} ${esc(C.org.name)}</span></div>
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

// Student-portal preview, drawn in plain HTML (black & white, no personal data).
const portalMock = `<div class="mock" aria-hidden="true">
 <div class="mock-bar"><i></i><i></i><i></i><span>Миний сургалт</span></div>
 <div class="mock-body">
  <p class="mock-h">Өнөөдөр</p>
  <div class="mock-row on"><b>10:00</b><span>Онолын хичээл<small>Аюулгүй ажиллагаа</small></span></div>
  <div class="mock-row"><b>14:00</b><span>Машин дээрх дадлага<small>Экскаватор</small></span></div>
  <p class="mock-h">Сургалтын явц</p>
  <div class="mock-track"><i></i></div>
 </div>
</div>`;

function home() {
  const rel = '', n = C.courses.length, count = id => C.courses.filter(c => c.track === id).length;
  const rows = C.courses.map(c => `<tr><th scope="row"><a href="surgalt/${c.slug}.html">${esc(c.name)}</a><small>${esc(track(c.track).full)}</small></th><td class="num">${S(c.sample, money(c.sample.price))}</td><td>${S(c.sample, c.sample.days + ' хоног')}</td><td>${S(c.sample, c.sample.schedule)}</td><td>${S(c.sample, day(c.sample.next))}</td></tr>`).join('');
  const principles = [
    ['01', 'Дадлага · Техник', 'Бодит техник дээр дадлага', 'Онолоо машины бүхээгт бататгаж, ажилдаа шууд хэрэглэх ур чадвар болгоно.', img('practice-operator-cab', 'Хүнд машины бүхээгт удирдлагын хөшүүрэг барьсан оператор', '(max-width: 900px) 100vw, 560px', { pos: '50% 30%' })],
    ['02', 'Аюулгүй ажиллагаа', 'Аюулгүй ажиллагаа эхний өдрөөс', 'Техник ашиглах аюулгүй ажиллагааны дүрэм, дадлыг сургалтын эхнээс эзэмшинэ.', img('safety-hard-hats', 'Барилгын талбай дээрх хамгаалалтын малгайнууд', '(max-width: 900px) 100vw, 560px')],
    ['03', 'Гоо сайхан · Нарийвчлал', 'Нарийн ур чадвар', 'Маникюр, сормуусны сургалтад загвар, үйлчлүүлэгч дээр дадлага хийнэ.', img('beauty-lash-artist', 'Сормуусны мастер үйлчлүүлэгчтэй ажиллаж буй нь', '(max-width: 900px) 100vw, 560px')],
    ['04', 'Систем · Самбар', 'Сурагчийн самбар', 'Хуваарь, хичээл, сургалтын явц, төлбөр, сертификатаа утаснаасаа нэг дор харна.', portalMock]
  ];
  const studentFeatures = ['Өнөөдрийн хичээл, хуваарь', 'Сургалтын явц, ирц', 'Төлбөрийн мэдээлэл', 'Төгсөлт, сертификат'];
  const staffFeatures = ['Өдрийн ажил, даалгавар', 'Зорилго, орлогын явц', 'Баг, сурагчдын мэдээлэл', 'Чат, мэдэгдэл'];
  return head('THE RISE — Хүнд машин, гоо сайхны мэргэжлийн сургалт', 'Экскаватор, дамп, ковш оператор, маникюр, сормуусны сургалт. Үнэ, хугацаа, хуваарь ил тод. Бодит дадлага, сертификат.', rel, 'home', 'hero-mining-shovel', 'home') + `
${header(rel, true)}
<main id="main">
 <section class="hero" data-theme="dark" aria-labelledby="hero-title">
  ${img('hero-mining-shovel', 'Бүрэнхий үеийн уурхайд ажиллаж буй том экскаватор', '100vw', { cls: 'hero-bg', priority: true, pos: '38% 50%' })}
  <span class="veil" aria-hidden="true"></span>
  <div class="hero-copy">
   <p class="eyebrow">THE RISE · Мэргэжлийн сургалтын төв · Улаанбаатар</p>
   ${H('h1', 'hero-title', 'Таны өсөлт —', 'бидний зорилго.')}
   <p class="hero-desc">Хүнд машин механизм, гоо сайхны мэргэжлийн сургалт.<span>Онол, бодит дадлага, сертификат — танхим болон онлайнаар.</span></p>
   <div class="actions"><a class="btn white" href="#surgalt">Сургалт сонгох</a><a class="btn outline-white" href="#burtguuleh">Бүртгүүлэх</a></div>
  </div>
 </section>

 <section class="statement" id="tuhai" aria-labelledby="about-title">
  <div class="statement-in" data-reveal>
   <p class="eyebrow">Бидний тухай</p>
   ${H('h2', 'about-title', 'Мэргэжлийг дадлагаар эзэмшинэ.')}
   <p class="lead">THE RISE нь хүнд машин механизм болон гоо сайхны чиглэлээр онол, бодит дадлагыг хослуулсан мэргэжлийн сургалт явуулдаг.<span>Үнэ, хугацаа, хуваарь сургалт бүр дээр ил тод. Төгсөлтийн шалгалтад тэнцээд сертификатаа авна.</span></p>
  </div>
  <dl class="stats shell" data-reveal>
   <div><dt>${n}</dt><dd>мэргэжлийн сургалт</dd></div>
   <div><dt>${C.tracks.length} чиглэл</dt><dd>хүнд машин, гоо сайхан</dd></div>
   <div><dt>Онол + дадлага</dt><dd>бодит техник, загвар дээр</dd></div>
   <div><dt>Танхим · онлайн</dt><dd>хоёр хэлбэрээр</dd></div>
  </dl>
 </section>

 <section class="tiles-sec" id="surgalt" aria-labelledby="courses-title">
  <div class="sec-h shell" data-reveal>
   <p class="eyebrow">Сургалтууд</p>${H('h2', 'courses-title', 'Өөрийн замаа сонго.')}
   <div class="chips" role="group" aria-label="Чиглэлээр шүүх"><button type="button" data-filter="all" aria-pressed="true">Бүгд <span>${n}</span></button>${C.tracks.map(t => `<button type="button" data-filter="${t.id}" aria-pressed="false">${esc(t.full)} <span>${count(t.id)}</span></button>`).join('')}</div>
  </div>
  <div class="tiles">${C.courses.map(c => tile(c, rel)).join('')}${helpTile()}</div>
 </section>

 <section class="principles" id="davuu" aria-labelledby="why-title">
  <div class="sec-h shell" data-reveal><p class="eyebrow">Яагаад THE RISE</p>${H('h2', 'why-title', 'Дөрвөн давуу тал.')}</div>
  <div class="card-grid shell">${principles.map(([no, meta, title, text, visual]) => `
   <article class="pcard" data-reveal>
    <div class="pcard-meta"><span>${no}</span><span>${meta}</span></div>
    <div class="pcard-visual">${visual}</div>
    <div class="pcard-copy"><h3>${title}</h3><p>${text}</p></div>
   </article>`).join('')}
  </div>
 </section>

 <section class="steps-sec" id="yavts" aria-labelledby="steps-title">
  <div class="sec-h shell" data-reveal><p class="eyebrow">Суралцах явц</p>${H('h2', 'steps-title', 'Бүртгэлээс сертификат хүртэл.')}</div>
  <ol class="steps shell">${C.steps.map(([a, b], i) => `<li class="step" data-reveal><span class="num">0${i + 1}</span><h3>${esc(a)}</h3><p>${esc(b)}</p></li>`).join('')}</ol>
 </section>

 <section class="price-sec" id="une" aria-labelledby="price-title">
  <div class="sec-h shell" data-reveal><p class="eyebrow">Үнэ ба хуваарь</p>${H('h2', 'price-title', 'Ил тод үнэ, хуваарь.')}</div>
  <div class="shell"><div class="table" data-reveal><table><thead><tr><th scope="col">Сургалт</th><th scope="col">Үнэ (-аас)</th><th scope="col">Хугацаа</th><th scope="col">Цаг</th><th scope="col">Дараагийн анги</th></tr></thead><tbody>${rows}</tbody></table></div></div>
 </section>

 <section class="portal-sec" id="nevtreh" aria-labelledby="portal-title">
  <div class="sec-h shell" data-reveal><p class="eyebrow">Нэвтрэх · Бүртгүүлэх</p>${H('h2', 'portal-title', 'Өөрийн самбартаа нэвтэр.')}</div>
  <div class="ptiles">
   <article class="ptile light" data-reveal>
    <p class="eyebrow">Сурагч</p>
    <h3>Миний сургалт</h3>
    <p class="tile-sub">Сургалтад бүртгэлтэй бол сурагчийн код эсвэл утасны дугаараараа нэвтэрнэ.</p>
    <div class="actions"><a class="btn" href="staff.html#student">Сурагч нэвтрэх</a><a class="btn outline" href="#burtguuleh">Шинээр бүртгүүлэх</a></div>
    <ul class="plist">${studentFeatures.map(x => `<li>${icon('check')}${x}</li>`).join('')}</ul>
   </article>
   <article class="ptile dark" data-reveal>
    <p class="eyebrow">Ажилтан</p>
    <h3>Ажлын самбар</h3>
    <p class="tile-sub">Багш, менежер, салбарын болон ерөнхий удирдлагын самбар.</p>
    <div class="actions"><a class="btn white" href="staff.html">Ажилтан нэвтрэх</a></div>
    <ul class="plist">${staffFeatures.map(x => `<li>${icon('check')}${x}</li>`).join('')}</ul>
   </article>
  </div>
 </section>

 ${faqSection('gray')}

 ${callout(rel, '')}
</main>
` + footer(rel, true);
}

function coursePage(c) {
  const rel = '../', s = c.sample, t = track(c.track), p = C.policy.sample;
  const others = C.courses.filter(x => x.slug !== c.slug && x.track === c.track).concat(C.courses.filter(x => x.track !== c.track)).slice(0, 3);
  const facts = c.track === 'heavy'
    ? [['Үнэ', money(s.price) + ' -аас'], ['Хугацаа', s.days + ' хоног'], ['Онол / машин дээр', s.theory + ' / ' + s.practice + ' цаг'], ['Дараагийн анги', day(s.next)]]
    : [['Үнэ', money(s.price) + ' -аас'], ['Хугацаа', s.days + ' хоног'], ['Материал', s.materials], ['Дараагийн анги', day(s.next)]];
  const practice = c.track === 'heavy' ? `Талбайн дадлага — ${S(s, s.machine)}` : 'Загвар, үйлчлүүлэгч дээрх дадлага';
  return head(`${c.name} сургалт — THE RISE`, `${c.description} Үнэ, хугацаа, хуваарь, бүртгэл.`, rel, 'course ' + c.track, c.image, c.slug) + `
${header(rel, false)}
<main id="main">
 <section class="hero hero-course" data-theme="dark" aria-labelledby="course-title">
  ${img(c.image, c.alt, '100vw', { rel, cls: 'hero-bg', priority: true, pos: c.imagePos })}
  <span class="veil" aria-hidden="true"></span>
  <div class="hero-copy">
   <a class="back" href="../index.html#surgalt">${icon('back')}Бүх сургалт</a>
   <p class="eyebrow">${esc(t.full)}</p>
   ${H('h1', 'course-title', c.name)}
   <p class="hero-desc">${esc(c.description)}</p>
   <div class="actions"><a class="btn white" href="#burtguuleh">Бүртгүүлэх</a><a class="btn outline-white" href="tel:${C.org.tel}">${icon('phone')}Залгах</a></div>
  </div>
 </section>

 <section class="facts" aria-label="Гол мэдээлэл">
  <dl class="stats shell">${facts.map(([k, v]) => `<div><dt>${S(s, v)}</dt><dd>${k}</dd></div>`).join('')}</dl>
 </section>

 <section class="program" aria-labelledby="program-title">
  <div class="sec-h shell" data-reveal><p class="eyebrow">Хөтөлбөр</p>${H('h2', 'program-title', 'Юу сурах вэ.')}</div>
  <div class="cbody shell">
   <ol class="topics" data-reveal>${c.topics.map(x => `<li>${esc(x)}</li>`).join('')}<li>${practice}</li><li>Төгсөлтийн шалгалт → сертификат</li></ol>
   <aside class="side" data-reveal><h3>Хуваарь</h3><p>${S(s, s.schedule)}</p><h3>Шаардлага</h3><p>${S(p, p.requirements)}</p><h3>Төлбөр</h3><p>Хувааж төлөх: ${S(p, p.installments)}</p><a class="btn white" href="${C.org.messenger}" target="_blank" rel="noopener">${icon('msg')}Messenger-ээр асуух</a></aside>
  </div>
 </section>

 ${faqSection('')}

 ${callout(rel, c.slug)}

 <section class="others-sec" aria-labelledby="others-title">
  <div class="sec-h shell" data-reveal><p class="eyebrow">Бусад сургалт</p>${H('h2', 'others-title', 'Өөр сонголтууд.')}</div>
  <div class="tiles three">${others.map(o => tile(o, rel)).join('')}</div>
 </section>
</main>
` + footer(rel, false);
}

fs.mkdirSync(path.join(root, 'surgalt'), { recursive: true });
fs.writeFileSync(path.join(root, 'index.html'), home());
for (const c of C.courses) fs.writeFileSync(path.join(root, 'surgalt', c.slug + '.html'), coursePage(c));
const samples = (fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/class="s"/g) || []).length;
console.log('Built index.html + ' + C.courses.length + ' course pages. Sample values marked on home: ' + samples + ' (visible with ?draft)');
