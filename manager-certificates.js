// Manager side of the certificate order flow (shared store: certificate-requests.js).
// Browser-local only: confirming a payment here does not move money or reach a printer; it records the manager's check.
// Scope note: every manager page sees all requests in this browser — branch/manager scoping needs the backend.
(()=>{
 const C=window.RISE_CERTS,menu=document.querySelector('.figma-menu');
 if(!C||!menu)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>new Intl.NumberFormat('en-US').format(n)+'₮';
 // Timestamps (ISO) are shown as the Ulaanbaatar calendar day; plain YYYY-MM-DD values stay as entered.
 const day=v=>{const s=String(v||'');const d=s.includes('T')&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date(s)):s.slice(0,10);return d.replaceAll('-','.');};
 const me=()=>document.querySelector('#manager-name')?.textContent.trim()||'Менежер';
 // Final exam result as entered by the teacher (teacher.js student details).
 const finalExam=(studentId,courseId)=>{try{const w=JSON.parse(localStorage.getItem('rise-teacher-workspace-v1')||'{}');return (Array.isArray(w.exams)?w.exams:[]).find(x=>x.studentId===studentId&&x.courseId===courseId&&x.exam==='final')||null;}catch{return null;}};
 const ACTION={confirmed:['printing','Хэвлэлтэд илгээх'],printing:['ready','Хэвлэгдсэн — авахад бэлэн'],ready:['delivered','Гардуулсан']};
 const TABS=[['review','Шалгах',r=>r.status==='payment_review'],['print','Хэвлэх',r=>r.status==='confirmed'||r.status==='printing'],['handover','Олгох',r=>r.status==='ready'],['all','Бүгд',()=>true]];
 const needs=r=>['payment_review','confirmed','printing','ready'].includes(r.status);
 const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" fill="currentColor" fill-opacity=".12"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>';

 const trigger=document.createElement('button');trigger.type='button';trigger.id='certificate-requests-toggle';trigger.setAttribute('aria-label','Сертификатын захиалга');trigger.setAttribute('aria-haspopup','dialog');
 trigger.innerHTML=icon+'<span class="nav-label">Сертификат</span><span class="hub-unread" hidden></span>';
 (menu.querySelector('#attendance-toggle')||menu.querySelector('[data-hub="notif"]')||menu.lastElementChild).after(trigger);
 // Full centre page when employee-center-pages.js is loaded; otherwise a modal dialog.
 const center=window.RISE_CENTER;
 const dialog=document.createElement(center?'div':'dialog');dialog.id='certificate-requests';dialog.setAttribute('aria-labelledby','certificate-requests-title');
 if(center){dialog.setAttribute('role','region');trigger.removeAttribute('aria-haspopup');center.host('certificates').append(dialog);}else document.body.append(dialog);
 const isOpen=()=>center?!dialog.closest('.center-page')?.hidden:dialog.open;
 let tab='review';
 function badge(){const n=C.read().filter(needs).length,b=trigger.querySelector('.hub-unread');b.hidden=!n;b.textContent=n;b.setAttribute('aria-label',n+' захиалга хүлээгдэж байна');}
 function card(r){
  const items=C.itemsOf(r).map(i=>({...i,exam:finalExam(r.studentId,i.courseId)})),passed=items.every(i=>i.exam&&i.exam.score>=C.PASS_SCORE),returned=C.returned(r);
  const examText=items.map(i=>i.courseName+' '+(i.exam?i.exam.score+'%':'—')).join(', ');
  let body='';
  if(r.status==='payment_review')body='<div class="cert-pay">Төлсөн: <b>'+esc(C.METHODS[r.payment?.method]||'—')+'</b> · '+esc(day(r.payment?.paidAt))+(r.payment?.reference?' · Гүйлгээ: <b>'+esc(r.payment.reference)+'</b>':'')+'</div>'
   +'<form class="cert-confirm" data-id="'+esc(r.id)+'"><fieldset><legend>Баталгаажуулахаас өмнө шалгана</legend>'
   +'<label><input type="checkbox" name="fee"> Хураамж '+money(r.fee)+' орсон (данс / касс шалгасан)</label>'
   +'<label><input type="checkbox" name="tuition"> Сургалтын төлбөр бүрэн төлөгдсөн</label>'
   +'<label class="'+(passed?'':'is-blocked')+'"><input type="checkbox" name="exam" '+(passed?'checked disabled':'disabled')+'> Төгсөлтийн шалгалт: '+esc(examText)+(passed?' · тэнцсэн (багш оруулсан)':' · тэнцээгүй эсвэл дүн алга')+'</label></fieldset>'
   +'<div class="cert-actions"><button type="submit" class="cert-primary">Төлбөр баталгаажуулах</button><button type="button" class="cert-secondary" data-return>Буцаах</button></div>'
   +'<div class="cert-return" hidden><label>Буцаах шалтгаан (сурагчид харагдана)<textarea name="note" maxlength="300" placeholder="Жишээ: гүйлгээ дансанд ороогүй байна"></textarea></label><button type="button" class="cert-danger" data-return-send>Сурагч руу буцаах</button></div><p class="cert-error" role="status"></p></form>';
  else if(ACTION[r.status])body='<div class="cert-actions"><button type="button" class="cert-primary" data-step="'+ACTION[r.status][0]+'" data-id="'+esc(r.id)+'">'+ACTION[r.status][1]+'</button></div><p class="cert-error" role="status"></p>';
  else if(r.status==='ordered')body='<p class="cert-wait">'+(returned?'Сурагч руу буцаасан: '+esc(C.lastNote(r))+'. ':'')+'Сурагч дахин төлөхийг хүлээж байна.</p>';
  const last=r.history[r.history.length-1];
  return '<article class="cert-card"><header><div><strong>'+esc(r.studentName||r.studentId)+'</strong><span>'+esc(r.id)+'</span></div><span class="cert-status is-'+r.status+'">'+esc(C.LABEL[r.status])+'</span></header>'
   +'<ul class="cert-items">'+items.map(i=>'<li><span>'+esc(i.courseName)+' сертификат</span><b>'+money(i.fee)+'</b></li>').join('')+'<li class="is-total"><span>Нийт · '+items.length+' сертификат</span><b>'+money(r.fee)+'</b></li></ul>'
   +'<dl><div><dt>Хэвлэх нэр</dt><dd>'+esc(r.printName)+'</dd></div><div><dt>Хүлээн авах</dt><dd>'+esc(C.DELIVERY[r.delivery])+(r.address?' — '+esc(r.address):'')+'</dd></div><div><dt>Сүүлд</dt><dd>'+esc(day(last.at)+' · '+(last.by||''))+'</dd></div></dl>'+body+'</article>';
 }
 function render(){
  const list=C.read(),counts=Object.fromEntries(TABS.map(([k,,f])=>[k,list.filter(f).length])),show=list.filter(TABS.find(t=>t[0]===tab)[2]).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  dialog.innerHTML='<header class="cert-head"><div><span class="cert-eyebrow">СУРАГЧДЫН ЗАХИАЛГА</span><h2 id="certificate-requests-title">Сертификат</h2></div><button type="button" class="cert-close" aria-label="Хаах"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></header>'
   +'<div class="cert-tabs" role="group" aria-label="Шүүлтүүр">'+TABS.map(([k,l])=>'<button type="button" data-tab="'+k+'" aria-pressed="'+(tab===k)+'">'+l+(counts[k]?' <span>'+counts[k]+'</span>':'')+'</button>').join('')+'</div>'
   +'<div class="cert-list">'+(show.length?show.map(card).join(''):'<p class="cert-empty">'+(tab==='review'?'Төлбөр шалгах захиалга алга.':tab==='print'?'Хэвлэх захиалга алга.':tab==='handover'?'Олгох сертификат алга.':'Захиалга алга.')+'</p>')+'</div>'
   +'<p class="cert-foot">Энэ хөтөч дээрх бүртгэл. Мөнгө хүлээн авах, хэвлэх үйлчилгээ холбогдоогүй — алхам бүр таны шалгасныг тэмдэглэнэ.</p>';
  if(center)dialog.querySelector('.cert-close').remove();else dialog.querySelector('.cert-close').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();});
  const commit=(id,to,details,errorNode)=>{try{C.write(C.move(C.read(),id,to,'manager',{...details,by:me()},new Date().toISOString()));render();badge();window.dispatchEvent(new CustomEvent('rise-data-change',{detail:{key:C.KEY}}));}catch(err){errorNode.textContent=err.message;}};
  dialog.querySelectorAll('form.cert-confirm').forEach(f=>{const err=f.querySelector('.cert-error');
   f.onsubmit=e=>{e.preventDefault();commit(f.dataset.id,'confirmed',{checks:{fee:f.elements.fee.checked,tuition:f.elements.tuition.checked,exam:f.elements.exam.checked}},err);};
   f.querySelector('[data-return]').onclick=()=>{f.querySelector('.cert-return').hidden=false;f.elements.note.focus();};
   f.querySelector('[data-return-send]').onclick=()=>commit(f.dataset.id,'ordered',{note:f.elements.note.value},err);});
  dialog.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>commit(b.dataset.id,b.dataset.step,{},b.closest('.cert-card').querySelector('.cert-error')));
 }
 function openDialog(){if(isOpen())return;const list=C.read();tab=list.some(TABS[0][2])?'review':list.some(TABS[1][2])?'print':list.some(TABS[2][2])?'handover':'all';render();if(center)center.show('certificates',trigger);else dialog.showModal();}
 trigger.onclick=openDialog;window.RISE_OPEN_CERTIFICATES=openDialog;
 if(!center)dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 addEventListener('storage',e=>{if(e.key===C.KEY){badge();if(isOpen())render();window.dispatchEvent(new CustomEvent('rise-data-change',{detail:{key:C.KEY}}));}});
 badge();
})();
