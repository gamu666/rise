// Certificate order workflow shared by the student, manager and teacher pages.
// Browser-local store only (localStorage 'rise-certificate-requests-v1'): no payment provider, printing service,
// courier or server authority is connected. Real use needs a backend that owns these records and permissions.
//
// Flow: the teacher records a passed final exam -> the student orders one certificate per passed course and pays
//       in the same step (payment_review; the manager gets a notification) -> the manager checks the payment,
//       tuition and exam results and confirms (confirmed) or returns it with a reason (ordered: student pays again)
//       -> sends it to print (printing) -> printed, ready to collect/post (ready) -> handed over (delivered).
((root)=>{
 const KEY='rise-certificate-requests-v1';
 // Price per certificate, by training track. One course = one certificate; the total is the sum.
 // Confirmed by the school owner (2026-11-15): ХММ and Гоо сайхан are both 25,000₮ per certificate.
 const PRICES=[{track:'ХММ',match:/экскаватор|ковш|дамп|оператор|хүнд машин/i,price:25000},{track:'Гоо сайхан',match:/маникюр|сормуус|гоо сайхан|beauty/i,price:25000}];
 const DEFAULT_PRICE=25000;
 const priceOf=courseName=>(PRICES.find(p=>p.match.test(courseName||''))||{price:DEFAULT_PRICE}).price;
 const PASS_SCORE=70;
 const STEPS=[['ordered','Захиалсан'],['payment_review','Төлбөр шалгаж байна'],['confirmed','Баталгаажсан'],['printing','Хэвлэж байна'],['ready','Авахад бэлэн'],['delivered','Гардуулсан']];
 const LABEL=Object.fromEntries(STEPS);
 const METHODS={qpay:'QPay',card:'Карт',transfer:'Дансаар шилжүүлэх',cash:'Бэлэн — ресепшн'};
 const DELIVERY={pickup:'Сургууль дээрээс авах',post:'Шуудангаар хүргүүлэх'};
 const MOVES={ordered:{student:['payment_review']},payment_review:{manager:['confirmed','ordered']},confirmed:{manager:['printing']},printing:{manager:['ready']},ready:{manager:['delivered']}};
 const text=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 function ref(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';const r=root.crypto?.getRandomValues?root.crypto.getRandomValues(new Uint8Array(6)):Array.from({length:6},()=>Math.floor(Math.random()*256));for(const n of r)s+=a[n%a.length];return 'CERT-'+s;}
 const itemsOf=r=>Array.isArray(r?.items)?r.items:[];
 // A course in a request that is not delivered yet blocks ordering it again.
 const active=(list,studentId,courseId)=>list.find(r=>r.studentId===studentId&&r.status!=='delivered'&&itemsOf(r).some(i=>i.courseId===courseId))||null;
 function payment(d,now){const method=METHODS[d?.method]?d.method:'';if(!method)throw Error('Төлбөрийн аргаа сонгоно уу.');return {method,reference:text(d.reference,60),paidAt:now};}
 function create(list,input,now){
  const studentId=text(input.studentId,80),printName=text(input.printName,80),delivery=DELIVERY[input.delivery]?input.delivery:'',address=text(input.address,300),studentName=text(input.studentName,80);
  const courses=(Array.isArray(input.courses)?input.courses:[]).map(c=>({courseId:text(c.courseId,80),courseName:text(c.courseName,80),finalScore:c.finalScore}));
  if(!studentId)throw Error('Сурагч тодорхойгүй байна.');
  if(!courses.length)throw Error('Сертификат авах сургалтаа сонгоно уу.');
  for(const c of courses){if(!c.courseId)throw Error('Сургалт тодорхойгүй байна.');if(!(c.finalScore>=PASS_SCORE))throw Error(c.courseName+': төгсөлтийн шалгалтад тэнцсэний дараа захиална.');if(active(list,studentId,c.courseId))throw Error(c.courseName+': захиалга аль хэдийн үүссэн байна.');}
  if(new Set(courses.map(c=>c.courseId)).size!==courses.length)throw Error('Нэг сургалтыг давхар сонгосон байна.');
  if(printName.length<3)throw Error('Сертификат дээр хэвлэх нэрээ бүтэн бичнэ үү.');
  if(!delivery)throw Error('Хүлээн авах аргаа сонгоно уу.');
  if(delivery==='post'&&address.length<8)throw Error('Шуудангийн хаягаа дэлгэрэнгүй бичнэ үү.');
  const pay=payment(input.payment,now);
  const items=courses.map(c=>({courseId:c.courseId,courseName:c.courseName,finalScore:c.finalScore,fee:priceOf(c.courseName)}));
  const by=studentName||'Сурагч';
  const request={id:ref(),studentId,studentName,items,printName,delivery,address:delivery==='post'?address:'',fee:items.reduce((n,i)=>n+i.fee,0),status:'payment_review',createdAt:now,updatedAt:now,payment:pay,checks:null,history:[{status:'ordered',at:now,by},{status:'payment_review',at:now,by}]};
  return {list:[...list,request],request};
 }
 function move(list,id,to,actor,details,now){
  const r=list.find(x=>x.id===id);if(!r)throw Error('Захиалга олдсонгүй.');
  if(!(MOVES[r.status]?.[actor]||[]).includes(to))throw Error('Энэ алхмыг хийх боломжгүй.');
  const d=details||{},next={...r,status:to,updatedAt:now};let note='';
  if(r.status==='ordered')next.payment=payment(d,now);
  if(r.status==='payment_review'&&to==='ordered'){note=text(d.note,300);if(note.length<3)throw Error('Буцаах шалтгаанаа бичнэ үү.');next.payment=null;}
  if(r.status==='payment_review'&&to==='confirmed'){const c=d.checks||{};if(!(c.fee&&c.tuition&&c.exam))throw Error('Гурван нөхцөлийг бүгдийг шалгаж тэмдэглэнэ үү.');next.checks={fee:true,tuition:true,exam:true};}
  next.history=[...r.history,{status:to,at:now,by:text(d.by,80)||(actor==='manager'?'Менежер':'Сурагч'),...(note?{note}:{})}];
  return list.map(x=>x.id===id?next:x);
 }
 const lastNote=r=>[...(r?.history||[])].reverse().find(h=>h.note)?.note||'';
 const returned=r=>r?.status==='ordered'&&r.history.some(h=>h.note);
 const courseNames=r=>itemsOf(r).map(i=>i.courseName).join(', ');
 function read(){try{const v=JSON.parse(root.localStorage?.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(r=>r&&typeof r.id==='string'&&LABEL[r.status]&&Array.isArray(r.history)&&Array.isArray(r.items)):[];}catch{return [];}}
 function write(list){root.localStorage.setItem(KEY,JSON.stringify(list));}
 const api={KEY,PRICES,priceOf,PASS_SCORE,STEPS,LABEL,METHODS,DELIVERY,active,create,move,lastNote,returned,courseNames,itemsOf,read,write};
 root.RISE_CERTS=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
