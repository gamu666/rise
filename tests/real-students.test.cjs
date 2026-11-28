// Real student figures (owner request 2026-11-28 "бодит тоо холбох", phase 1: the employee's own screens). The six
// sample students, the sample revenue chart, the fixed 78/98/50 goal rings, the sample receipts and the typed-in
// 8/12 and 26/40 enrolment counts are gone: everything comes from the employee's CRM enrolments (leads marked Элссэн).
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const manager = read('manager.js'), crm = read('manager-crm.js'), income = read('manager-recent-income.js'), goals = read('manager-goals.js');

// no sample people or figures left in the employee's own screens
for (const name of ['Батбаатар Ананд', 'Наранбаатар Номин', 'Даваадорж Тэмүүлэн', 'Алтангэрэл Саруул', 'Ганболд Билгүүн', 'Отгонбаяр Мишээл'])
  assert.ok(!manager.includes(name), 'sample student removed: ' + name);
assert.ok(!/ДЕ0000000/.test(manager) && !/course:'Дамп',registered:'2026\.10\.05'/.test(manager), 'no invented register numbers or second enrolment');
assert.ok(!/const demo=\[1500000/.test(goals) && !goals.includes('[78,98,50]'), 'no sample revenue chart or fixed goal rings');
assert.ok(!/const preview=Array\.from/.test(income) && !income.includes('[250000,180000,350000'), 'no sample receipts');
assert.ok(!/current:8|current:26/.test(manager), 'week and month enrolments are counted, not typed in');

// where the real list comes from: the signed-in employee's own enrolments, cached for the tab, drawn again once
assert.ok(/sessionStorage\.getItem\('rise-real-v1'\)/.test(manager) && /c\.uid===uid/.test(manager), 'manager.js reads the cache only for the signed-in user');
assert.ok(/\.eq\('owner_id', me\.id\)\.eq\('status', 'enrolled'\)/.test(crm), 'own leads marked Элссэн');
assert.ok(/sessionStorage\.getItem\('rise-real-drawn'\) !== me\.id/.test(crm) && /!window\.RISE_REAL_STUDENTS && changed && list\.length/.test(crm), 'one redraw per tab, only when real rows exist');
assert.ok(/selected=students\[0\]\?\.id\|\|''/.test(manager), 'an empty list does not stop the page');

// mapping: nothing invented — no end date, group or register number; the one recorded payment is the history
const src = crm.slice(crm.indexOf('  const ymd ='), crm.indexOf('  (async () => {'));
const toStudent = new Function(`const ZONE = 'Asia/Ulaanbaatar';\n${src}\nreturn toStudent;`)();
const s = toStudent({ id: '0f8e2c1a-9b7d-4c3e-8a1f-2b3c4d5e6f70', name: 'Бат Болд', phone: '99112233', course: 'Экскаватор оператор', amount: 450000, enrolled_at: '2026-11-27T17:30:00Z' });
assert.equal(s.id, 'CRM-0F8E2C1A9B');
assert.equal(s.registered, '2026.11.28', 'Ulaanbaatar date (UTC+8)');
assert.deepEqual([s.ends, s.group, s.rd, s.total, s.paid], ['', '', '', 450000, 450000]);
assert.deepEqual(s.payments, [{ amount: 450000, recordedAt: '2026-11-27T17:30:00Z' }]);
assert.equal(toStudent({ id: 'x', name: 'Нэр', amount: null, enrolled_at: '2026-11-27T01:00:00Z' }).payments.length, 0, 'no payment without an amount');

// screens built on the real list
assert.ok(/const tuition=\(\)=>students\.filter/.test(income), 'recent income lists the recorded tuition');
assert.ok(/goalOwn=typeof students!=='undefined'\?students\.slice\(\):\[\]/.test(goals) && /const goalTargets=\{revenue:\[1000000,3000000,8000000\]/.test(goals), 'goal chart and rings use own enrolments and the default targets');
assert.ok(/function goalCurrent\(key\)/.test(manager) && /currentInput\.readOnly=true/.test(manager), 'goal dialog edits the target only');
console.log('PASS: own enrolments replace sample students, chart, rings, receipts and typed-in counts; nothing invented; empty list safe');
