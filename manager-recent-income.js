// Recent income is based on dated, locally recorded payment confirmations only.
(()=>{
 const viewport=document.querySelector('.task-viewport');if(!viewport)return;
 const key='rise-income-receipts';let receipts=loadLocal(key,[]);if(!Array.isArray(receipts))receipts=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=new Intl.DateTimeFormat('mn-MN',{timeZone:'Asia/Ulaanbaatar',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
 const dateKey=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(d);
 const card=document.createElement('section');card.className='recent-income';card.setAttribute('aria-label','Сүүлийн орлого');viewport.prepend(card);
 const dialog=document.createElement('dialog');dialog.className='recent-income-dialog';dialog.setAttribute('aria-labelledby','recent-income-title');document.body.append(dialog);
 // Visual preview requested by the user; never persisted as payment receipts.
 const preview=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));d.setHours(11+i%7,20,0,0);return {name:students[i%students.length].name,course:['Экскаватор','Маникюр','Нягтлан'][i%3],kind:'Сургалтын төлбөр',amount:[250000,180000,350000,120000,275000,300000,150000][i%7],recordedAt:d.toISOString()}}).reverse();
 const active=()=>{const rows=receipts.filter(r=>r&&!r.voided&&Number(r.amount)>0&&Number.isFinite(Date.parse(r.recordedAt))).sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));return receipts.length?rows:preview};
 function portrait(r){const at=Math.max(0,students.findIndex(s=>s.name===r.name))%6;return '<span class="receipt-avatar student-illustration" style="--avatar-x:'+((at%3)*50)+'%;--avatar-y:'+(Math.floor(at/3)*100)+'%" aria-hidden="true"></span>'}
 function showAll(){const rows=active();dialog.innerHTML='<button class="dialog-close" type="button" aria-label="Хаах">×</button><h2 id="recent-income-title">Сүүлийн орлого</h2><div class="receipt-list">'+(rows.length?rows.map(r=>'<article>'+portrait(r)+'<div><strong>'+esc(r.name)+'</strong><small>'+esc(r.course)+' · '+esc(r.kind)+'</small><time datetime="'+esc(r.recordedAt)+'">'+esc(fmt.format(new Date(r.recordedAt)))+'</time></div><b>+'+money(Number(r.amount))+'</b></article>').join(''):'<p class="receipt-empty">Орлого бүртгэгдээгүй байна.</p>')+'</div>';dialog.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.showModal()}
 function render(){const rows=active(),last=rows[0],today=new Date(),days=Array.from({length:14},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-(13-i));return dateKey(d)}),totals=days.map(d=>rows.filter(r=>dateKey(new Date(r.recordedAt))===d).reduce((sum,r)=>sum+Number(r.amount),0)),max=Math.max(1,...totals);
  card.innerHTML='<header><h2><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7z"/></svg>Сүүлийн орлого</h2><button type="button" class="recent-income-all">Бүгд ›</button></header><div class="income-spark" aria-label="Сүүлийн 14 хоногийн орлого">'+totals.map((n,i)=>'<span style="--income-height:'+Math.max(3,n/max*38)+'px" data-empty="'+(n===0)+'" title="'+days[i]+' · '+money(n)+'"></span>').join('')+'</div><footer><div class="income-latest">'+(last?portrait(last)+'<span><strong>'+esc(last.name)+'</strong><time datetime="'+esc(last.recordedAt)+'">'+esc(fmt.format(new Date(last.recordedAt)))+'</time></span>':'<span class="income-empty">Орлого бүртгэгдээгүй байна</span>')+'</div><strong class="income-amount">'+(last?'+'+money(Number(last.amount)):'—')+'</strong></footer>';
  card.querySelector('button').onclick=showAll;
 }
 function persist(){saveLocal(key,receipts);render();if(dialog.open){dialog.close();showAll()}}
 // Existing payment form remains the source of truth; capture before/after its save handler.
 document.querySelector('#certificate-payment-form').addEventListener('submit',()=>{
  if(!certificateStudent)return;const student={...certificateStudent},paymentKey=certificateKey(student),before={...certificatePayments[paymentKey]};
  queueMicrotask(()=>{const after=certificatePayments[paymentKey];if(!after||!Number.isInteger(after.fee)||after.fee<0)return;
   const existing=receipts.find(r=>r.paymentKey===paymentKey&&!r.voided);
   if(after.paid&&after.fee>0&&!before.paid&&!existing){receipts.push({id:'receipt-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),paymentKey,studentId:student.id,name:student.name,course:student.course,kind:'Сертификатын төлбөр',amount:after.fee,recordedAt:new Date().toISOString()});persist()}
   else if(existing&&(!after.paid||after.fee!==before.fee)){if(!after.paid||after.fee===0)existing.voided=true;else existing.amount=after.fee;existing.updatedAt=new Date().toISOString();persist()}
  });
 },true);
 window.addEventListener('storage',e=>{if(e.key===key){try{const data=JSON.parse(e.newValue||'[]');receipts=Array.isArray(data)?data:[];render()}catch{}}});
 render();
})();
