// Public site: build output matches content, one page per course, no empty placeholders, form that claims delivery
// only after the server confirms it.
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'tools', 'build-site.cjs')], { stdio: 'pipe' });
const C = require(path.join(root, 'site-src', 'content.cjs'));
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const titles = new Set();
for (const c of C.courses) {
  const file = path.join(root, 'surgalt', c.slug + '.html');
  assert.ok(fs.existsSync(file), 'missing course page ' + c.slug);
  const html = fs.readFileSync(file, 'utf8');
  const title = /<title>(.*?)<\/title>/.exec(html)[1];
  assert.ok(!titles.has(title), 'duplicate title ' + title); titles.add(title);
  assert.ok(html.includes(`<input type="radio" name="course" value="${c.slug}" data-name="${c.name}" checked>`), c.slug + ' form preselects its course');
  assert.ok(html.includes(`data-page="${c.slug}">`), c.slug + ' page names itself for the website counter');
  assert.ok(home.includes(`surgalt/${c.slug}.html`), 'home links to ' + c.slug);
  // Unconfirmed sample values must stay marked so they cannot be mistaken for confirmed data.
  if (!c.sample.confirmed) assert.ok(html.includes('<span class="s">'), c.slug + ' marks sample values');
}
for (const html of [home, ...C.courses.map(c => fs.readFileSync(path.join(root, 'surgalt', c.slug + '.html'), 'utf8'))]) {
  assert.ok(!/\[(үнэ|N|огноо|нөхцөл)\b/.test(html), 'no empty [placeholder] left');
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'one h1 per page');
  assert.ok(html.includes('pattern="[0-9]{8}"') && html.includes('type="tel"'), 'phone field is an 8-digit tel input');
  assert.ok(html.includes('<div class="done fail" hidden'), 'form has a failure block with phone / Messenger');
  assert.ok(/<label class="hp" aria-hidden="true">[^<]*<input name="website" tabindex="-1"/.test(html), 'bot-trap field is hidden from people');
}
// v3: stock photography with srcset (no old AI images), student + staff sign-in entry points, no test/demo wording on screen.
const pages = [home, ...C.courses.map(c => fs.readFileSync(path.join(root, 'surgalt', c.slug + '.html'), 'utf8'))];
const visible = html => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ');
for (const html of pages) {
  assert.ok(!/assets\/(student-portal\/|hero\.png|machinery\.png|beauty\.png)/.test(html), 'public pages use the stock photos in assets/photos');
  for (const [, file] of html.matchAll(/assets\/photos\/([\w-]+\.jpg)/g)) assert.ok(fs.existsSync(path.join(root, 'assets', 'photos', file)), 'photo exists: ' + file);
  assert.ok(html.includes('staff.html#student"') && /href="(\.\.\/)?staff\.html"/.test(html), 'student and staff sign-in links on every page');
  assert.ok(!/туршилт|\btest\b|\bdemo\b|жишээ/i.test(visible(html)), 'no test/demo/sample wording visible');
}
assert.ok(!/Туршилт|Жишээ|value="lvl/.test(fs.readFileSync(path.join(root, 'staff.html'), 'utf8')), 'sign-in page shows no test wording or internal level markers');
// v4 (owner request): black & white only, no gradients, no web-font download.
const css = fs.readFileSync(path.join(root, 'site.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
assert.ok(!/gradient/i.test(css), 'public site CSS uses no gradients');
assert.ok(!/#(6d28d9|a21caf|ec4899|f2a900|0071e3)/i.test(css), 'public site CSS has no accent colours');
for (const html of pages) assert.ok(!/fonts\.googleapis/.test(html), 'system fonts only');
const js = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
// All network calls go through one helper to the two public Supabase functions with the publishable key — never a
// secret key. The form shows "received" only when the server answered true; the website counter sends only the page
// and the event (no cookie, no visitor id).
assert.ok(home.includes('data-page="home">'), 'home page names itself for the website counter');
assert.equal((js.match(/fetch\(/g) || []).length, 1, 'one network helper');
assert.ok(!/XMLHttpRequest|sendBeacon|document\.cookie|localStorage\.setItem/.test(js), 'no other channel, no cookie, no browser-only copy');
assert.ok(/localStorage\.getItem\('rise-notrack'\)/.test(js) && /if \(!quiet\) rpc\('track_web'/.test(js), 'staff devices are not counted');
assert.ok(/localStorage\.setItem\('rise-notrack','1'\)/.test(fs.readFileSync(path.join(root, 'staff.js'), 'utf8')), 'staff sign-in marks the device');
assert.ok(/const API = 'https:\/\/[a-z]+\.supabase\.co\/rest\/v1\/rpc\/';/.test(js), 'calls Supabase functions');
assert.deepEqual([...new Set([...js.matchAll(/rpc\('(\w+)'/g)].map(m => m[1]))].sort(), ['register_web', 'submit_web_lead', 'track_web', 'web_registration_options'], 'only the public functions');
assert.ok(/rpc\('track_web', \{ p_event: event, p_page: page \}\)/.test(js), 'counter sends only page and event');
assert.ok(/'sb_publishable_\w+'/.test(js) && !/sb_secret_|service_role/.test(js), 'publishable key only');
assert.ok(/ok = res\.ok && \(await res\.json\(\)\) === true;/.test(js), 'success requires the server to answer true');
assert.ok(/if \(ok\) \{[^}]*done\.hidden = false[^}]*\}\s*else \{[^}]*fail\.hidden = false/.test(js), 'received only when ok, otherwise contact options');
// Registration without a request step (owner request 2026-11-21): own manager or branch → course → own schedule →
// e-Mongolia → contact → contract. No "хүсэлт" wording in the form; e-Mongolia's step says exactly which 3 data
// are taken; e-Mongolia / GSign buttons stay disabled ("Удахгүй") next to "Алгасах" because they are not connected,
// and nothing claims a verification or a signature; the lead goes to register_web with the chosen manager and
// schedule, and "Бүртгэгдлээ" appears only after true.
for (const html of pages) {
  const f = /<form class="leadform acct" id="lead-form"[\s\S]*?<\/form>/.exec(html);
  assert.ok(f, 'every page has the step form');
  assert.equal((f[0].match(/class="acct-step"/g) || []).length, 6, 'six steps');
  assert.ok(f[0].includes('Таныг хариуцсан менежер байгаа юу?') && f[0].includes('name="has" value="yes"') && f[0].includes('name="has" value="no"'), 'starts with the own-manager question');
  assert.ok(f[0].includes('class="acct-days"') && f[0].includes('data-branches') && f[0].includes('class="acct-managers"'), 'own schedule, branch and manager pickers');
  assert.ok(!/хүсэлт/i.test(visible(f[0])), 'no request wording in the form');
  assert.ok(f[0].includes('зөвхөн дараах 3 мэдээллийг авна') && ['Регистрийн дугаар', 'Овог, нэр', 'Иргэний бүртгэлийн зураг'].every(x => f[0].includes(x)) && f[0].includes('Үүнээс өөр мэдээлэл авахгүй.'), 'says exactly which data e-Mongolia hands over');
  const providers = f[0].match(/<button class="btn( outline)? acct-provider"[^>]*>[\s\S]*?<\/button>/g) || [];
  // e-Mongolia supplies the account data, GSign signs the contract: two separate services (owner, 2026-11-22)
  assert.equal(providers.length, 2, 'one e-Mongolia button for the account data, one GSign button for the contract');
  assert.ok(providers[0].includes('e-Mongolia') && providers[1].includes('GSign') && !/e-Mongolia-аар зурах/.test(f[0]) && f[0].includes('GSign цахим гарын үсгээр'), 'the contract is signed with GSign only');
  assert.ok(providers.every(b => / disabled aria-disabled="true"/.test(b) && b.includes('Удахгүй')), 'not connected yet: every provider button is disabled and marked Удахгүй');
  assert.ok(f[0].includes('data-next>Алгасах</button>') && f[0].includes('type="submit">Алгасаад бүртгүүлэх</button>'), 'verification and signing can be skipped');
  assert.ok(!/Баталгаажсан|Данс нээгдлээ|гарын үсэг зурсан|-аар зурсан/i.test(visible(html)), 'nothing claims a verification or a signature');
}
const reg = js.slice(js.indexOf('function registration('));
assert.ok(/rpc\('web_registration_options', \{\}, stop\.signal\)/.test(reg), 'manager list comes from Supabase, never a hard-coded roster');
assert.ok(!/Энхжин|Тэнүүн|Энэрэн|Золбоо/.test(js), 'no demo roster names in the public script');
assert.ok(/rpc\('register_web', \{ p_name: [^}]*p_manager: [^}]*p_branch: [^}]*p_schedule: plan\(\) \}/.test(reg), 'sends the chosen manager or branch and the schedule');
assert.equal((reg.match(/done\.hidden = false/g) || []).length, 1, 'one place shows success');
assert.ok(reg.indexOf('ok = res.ok && (await res.json()) === true;') < reg.indexOf('if (ok) {') && reg.indexOf('if (ok) {') < reg.indexOf('done.hidden = false') && reg.indexOf('done.hidden = false') < reg.indexOf('fail.hidden = false; fail.focus();'), 'success only after the server answered true');
const mig = fs.readFileSync(path.join(root, 'supabase', 'migrations', '2026-11-21-web-registration.sql'), 'utf8');
const opts = mig.slice(mig.indexOf('function public.web_registration_options'), mig.indexOf('function public.register_web'));
assert.ok(!/'login'|'phone'|avatar/.test(opts), 'the public list carries no login, phone or photo');
assert.ok(/p\.active and not p\.hidden and p\.role in \('manager', 'senior_manager'\)/.test(mig), 'only active, visible managers are listed and accepted');
assert.ok(/p\.display_name !~ '\^Салбар \[0-9\]\+ · '/.test(opts), 'accounts still named with the seeded placeholder are not listed publicly');
assert.ok(/msg\.textContent = none \?/.test(reg) && /\$\('\.acct-search'\)\.hidden = none;/.test(reg), 'an empty manager list points the visitor to the branch choice');
assert.ok(/grant execute on function public\.register_web\(text, text, text, uuid, smallint, jsonb\) to anon, authenticated;/.test(mig), 'anon may register');
console.log('PASS: site build, ' + C.courses.length + ' course pages, sample markers, step registration form, confirmed-only success');
