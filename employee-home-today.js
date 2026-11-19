// Home (Нүүр): today's overview first — income vs target, open tasks, balances, pending items — then a short
// "Өнөөдөр анхаарах" list. Reads the data the dashboard already uses (goal figures, student list, certificate
// store, unread counts); it creates no records. Branch/general director homes show counts only, never student names.
(()=>{
 const home=document.querySelector('#hub-profile .ai-home');if(!home||typeof workspaceSelect!=='function')return;
 const level=Number(sessionStorage.getItem('rise-demo-level'))||1,namesAllowed=level<=2;
 const money=n=>new Intl.NumberFormat('en-US').format(Math.round(Number(n)||0))+'₮';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const todayISO=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date());
 const icon={income:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',tasks:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',wallet:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h2M3 10h18"/>',bell:'<path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3z"/><path d="M10 20h4"/>',cert:'<path d="M12 3 2 8l10 5 10-5z"/><path d="M6 10.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',arrow:'<path d="m9 6 6 6-6 6"/>'};
 const svg=p=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';

 const section=document.createElement('section');section.className='home-today';section.setAttribute('aria-label','Өнөөдрийн тойм');
 section.innerHTML='<div class="home-today-stats"></div><div class="home-today-body"><div class="home-attention"><h2>Өнөөдөр анхаарах</h2><ul></ul></div><div class="home-today-actions"></div></div>';
 home.querySelector('.ai-welcome')?.after(section);
 const quick=home.querySelector('.home-quick-actions');if(quick)section.querySelector('.home-today-actions').append(quick);
 home.classList.add('has-today');

 function studentScope(){const context=window.RISE_GOAL_OWNER_CONTEXT?.();const list=(namesAllowed?(window.RISE_GOAL_SELF_STUDENTS?.()||(typeof students!=='undefined'?students:[])):(context?.students||(typeof students!=='undefined'?students:[])));return Array.isArray(list)?list:[]}
 function certPending(){try{return (window.RISE_CERTS?.read()||[]).filter(r=>['payment_review','confirmed','printing','ready'].includes(r.status))}catch{return []}}
 function render(){
  const goal=window.RISE_GOAL_TODAY?.(),rev=goal?.revenue;
  const cards=[...document.querySelectorAll('.task-stack .task-card')],open=cards.filter(c=>!c.classList.contains('finished')&&!c.classList.contains('cancelled')),done=cards.filter(c=>c.classList.contains('finished')).length,overdue=cards.filter(c=>c.classList.contains('is-overdue')).length;
  const list=studentScope(),debtors=list.filter(s=>Number(s.total)>Number(s.paid)).map(s=>({...s,left:Number(s.total)-Number(s.paid)})).sort((a,b)=>b.left-a.left),debt=debtors.reduce((n,s)=>n+s.left,0);
  const unread=typeof hubUnread!=='undefined'?Number(hubUnread.notif)||0:0,certs=certPending(),review=certs.filter(r=>r.status==='payment_review').length;
  const stat=(key,label,value,note,target,ic,tone)=>'<button type="button" class="home-stat'+(tone?' is-'+tone:'')+'" data-go="'+target+'"><span class="home-stat-icon">'+svg(icon[ic])+'</span><span class="home-stat-label">'+label+'</span><strong>'+value+'</strong><small>'+note+'</small></button>';
  section.querySelector('.home-today-stats').innerHTML=
   stat('income','Өнөөдрийн орлого',rev?money(rev.value):'—',rev?esc(rev.caption):'Мэдээлэл алга','goal','income',rev&&rev.pct>=100?'good':'')
  +stat('tasks','Нээлттэй ажил',String(open.length),done+' дууссан'+(overdue?' · '+overdue+' хугацаа хэтэрсэн':''),'planner','tasks',overdue?'warn':'')
  +stat('debt','Төлбөрийн үлдэгдэл',debtors.length+' сурагч',debtors.length?money(debt)+' үлдсэн':'Бүгд төлсөн','students','wallet',debtors.length?'warn':'')
  +stat('pending','Хүлээгдэж буй',String(unread+certs.length),unread+' мэдэгдэл · '+certs.length+' сертификат','notif','bell','');
  const items=[];
  if(review)items.push({ic:'cert',tone:'warn',title:'Сертификатын төлбөр шалгах',meta:review+' захиалга хүлээж байна',go:'cert'});
  if(overdue)items.push({ic:'clock',tone:'warn',title:'Хугацаа хэтэрсэн ажил',meta:overdue+' ажил — баруун талын жагсаалтад улаанаар тэмдэглэсэн',go:'planner'});
  if(namesAllowed)debtors.slice(0,3).forEach(s=>items.push({ic:'wallet',title:s.name,meta:'Үлдэгдэл '+money(s.left)+' · '+(s.course||''),student:s.id}));
  else if(debtors.length)items.push({ic:'wallet',title:'Төлбөрийн үлдэгдэлтэй '+debtors.length+' сурагч',meta:'Нийт '+money(debt)+' · дэлгэрэнгүйг Сурагчид хэсгээс',go:'students'});
  if(namesAllowed){const soon=list.filter(s=>{const e=String(s.ends||'').replaceAll('.','-');if(!e)return false;const days=(Date.parse(e)-Date.parse(todayISO))/864e5;return days>=0&&days<=3}).slice(0,2);soon.forEach(s=>items.push({ic:'clock',title:s.name,meta:'Сургалт '+String(s.ends).slice(5)+'-нд дуусна · '+(s.course||''),student:s.id}))}
  if(unread)items.push({ic:'bell',title:unread+' уншаагүй мэдэгдэл',meta:'Орлого, хурал, даалгаврын мэдээ',go:'notif'});
  const ul=section.querySelector('.home-attention ul');
  ul.innerHTML=items.length?items.slice(0,6).map(i=>'<li><button type="button" class="home-attention-item'+(i.tone?' is-'+i.tone:'')+'"'+(i.student?' data-open-student="'+esc(i.student)+'"':' data-go="'+i.go+'"')+'><span class="home-attention-icon">'+svg(icon[i.ic])+'</span><span class="home-attention-copy"><strong>'+esc(i.title)+'</strong><small>'+esc(i.meta)+'</small></span>'+svg(icon.arrow)+'</button></li>').join(''):'<li class="home-attention-empty">Өнөөдөр яаралтай зүйл алга. Сайхан ажиллаарай!</li>';
 }
 section.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;const go=b.dataset.go;if(go==='cert'){window.RISE_OPEN_CERTIFICATES?.();return}if(go==='notif'){document.querySelector('.figma-menu [data-hub=notif]')?.click();return}workspaceSelect(go)});

 // Overdue marker for the task rail (own tasks with a due date before today that are not finished).
 function markOverdue(){const data=typeof taskData!=='undefined'?taskData:{},own=typeof selfTasks!=='undefined'?selfTasks:[];document.querySelectorAll('.task-stack .task-card').forEach(card=>{const id=card.dataset.task,due=data[id]?.due??own.find(t=>t.id===id)?.due;const late=!!due&&due<todayISO&&!card.classList.contains('finished')&&!card.classList.contains('cancelled');card.classList.toggle('is-overdue',late);})}
 const stack=document.querySelector('.task-stack');let queued=0;const refresh=()=>{if(queued)return;queued=requestAnimationFrame(()=>{queued=0;markOverdue();render()})};
 if(stack)new MutationObserver(refresh).observe(stack,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 const select=workspaceSelect;workspaceSelect=function(key){const r=select(key);if(key==='profile')refresh();return r};selectHub=workspaceSelect;
 addEventListener('rise-data-change',refresh);addEventListener('storage',refresh);
 markOverdue();render();
})();
