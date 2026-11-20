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
  assert.ok(html.includes(`<option value="${c.slug}" selected>`), c.slug + ' form preselects its course');
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
// The form's one network call goes to the public submit_web_lead function with the publishable key — never a secret
// key — and "received" is shown only when the server answered true.
assert.equal((js.match(/fetch\(/g) || []).length, 1, 'one network call');
assert.ok(!/XMLHttpRequest|sendBeacon|localStorage/.test(js), 'no other channel, no browser-only copy');
assert.ok(/'https:\/\/[a-z]+\.supabase\.co\/rest\/v1\/rpc\/submit_web_lead'/.test(js), 'posts to submit_web_lead');
assert.ok(/'sb_publishable_\w+'/.test(js) && !/sb_secret_|service_role/.test(js), 'publishable key only');
assert.ok(/ok = res\.ok && \(await res\.json\(\)\) === true;/.test(js), 'success requires the server to answer true');
assert.ok(/if \(ok\) \{[^}]*done\.hidden = false[^}]*\}\s*else \{[^}]*fail\.hidden = false/.test(js), 'received only when ok, otherwise contact options');
console.log('PASS: site build, ' + C.courses.length + ' course pages, sample markers, confirmed-only form');
