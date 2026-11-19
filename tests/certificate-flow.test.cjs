const assert=require('node:assert/strict'),C=require('../certificate-requests.js');
const now='2026-11-20T10:00:00.000Z';
const exc={courseId:'c1',courseName:'Экскаватор',finalScore:85},kov={courseId:'c2',courseName:'Ковш',finalScore:72};
const base={studentId:'s1',studentName:'Э. Халиун',printName:'Энхбаяр Халиун',delivery:'pickup',courses:[exc],payment:{method:'qpay'}};
// Price comes from the courses, never from a teacher or manager: 1 ХММ course = 25,000₮, 2 courses = 50,000₮.
assert.equal(C.priceOf('Экскаватор'),25000);
let one=C.create([],base,now).request;assert.equal(one.fee,25000);assert.equal(one.items.length,1);
let two=C.create([],{...base,courses:[exc,kov]},now).request;assert.equal(two.fee,50000);assert.deepEqual(two.items.map(i=>i.fee),[25000,25000]);
// Ordering rules
assert.throws(()=>C.create([],{...base,courses:[{...exc,finalScore:60}]},now),/тэнцсэний дараа/);
assert.throws(()=>C.create([],{...base,courses:[{...exc,finalScore:null}]},now),/тэнцсэний дараа/);
assert.throws(()=>C.create([],{...base,courses:[]},now),/сонгоно/);
assert.throws(()=>C.create([],{...base,courses:[exc,exc]},now),/давхар/);
assert.throws(()=>C.create([],{...base,printName:'Э'},now),/бүтэн/);
assert.throws(()=>C.create([],{...base,delivery:'post',address:''},now),/хаяг/);
assert.throws(()=>C.create([],{...base,payment:{method:'x'}},now),/аргаа/);
// Ordering and paying is one step: the request goes straight to the manager's review.
let {list,request}=C.create([],base,now);
assert.equal(request.status,'payment_review');assert.equal(request.payment.method,'qpay');assert.match(request.id,/^CERT-[A-Z0-9]{6}$/);
assert.throws(()=>C.create(list,base,now),/аль хэдийн/);
assert.equal(C.create(list,{...base,courses:[kov]},now).request.fee,25000);
// Roles and order of steps
assert.throws(()=>C.move(list,request.id,'confirmed','student',{},now),/боломжгүй/);
assert.throws(()=>C.move(list,request.id,'printing','manager',{},now),/боломжгүй/);
// Manager returns with a reason, student pays again
assert.throws(()=>C.move(list,request.id,'ordered','manager',{note:''},now),/шалтгаан/);
list=C.move(list,request.id,'ordered','manager',{note:'Гүйлгээ олдсонгүй'},now);
assert.equal(list[0].payment,null);assert.equal(C.lastNote(list[0]),'Гүйлгээ олдсонгүй');assert(C.returned(list[0]));
list=C.move(list,request.id,'payment_review','student',{method:'transfer',reference:'TX1'},now);
// Confirmation needs all three checks
assert.throws(()=>C.move(list,request.id,'confirmed','manager',{checks:{fee:true,tuition:true}},now),/Гурван/);
list=C.move(list,request.id,'confirmed','manager',{checks:{fee:true,tuition:true,exam:true},by:'Д. Энхжин'},now);
for(const to of ['printing','ready','delivered'])list=C.move(list,request.id,to,'manager',{},now);
assert.deepEqual(list[0].history.map(h=>h.status),['ordered','payment_review','ordered','payment_review','confirmed','printing','ready','delivered']);
assert.equal(C.active(list,'s1','c1'),null);
console.log('PASS: certificate price per course (25k each, 50k for two), exam gate, order+pay in one step, role-checked steps, return with reason, three-point confirmation, print and hand-over');
