// Students: Figma 94:351, reference canvas 1433 × 950.
(()=>{
 const bg=document.createElement('div');bg.className='students-bg';bg.setAttribute('aria-hidden','true');bg.innerHTML='<img src="assets/figma/students/19da9.svg" alt=""><img src="assets/figma/students/ff954.svg" alt="">';document.querySelector('.os-shell').prepend(bg);
 const view=document.querySelector('#hub-students'),legacy=document.querySelector('#student-detail');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const toolbar=document.createElement('div');toolbar.className='students-toolbar';
 toolbar.innerHTML='<label class="students-query"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg><input type="search" aria-label="Нэр, дугаараар хайх" placeholder="Нэр, дугаараар хайх"></label><select aria-label="Сургалтын төрлөөр шүүх"><option value="">Сургалтын төрөл</option></select><select aria-label="Төгсөх он сараар шүүх"><option value="">Он сараар хайх</option></select><select aria-label="Төлбөрийн төлөвөөр шүүх"><option value="all">Төлбөрийн төлөв</option><option value="paid">Бүрэн төлсөн</option><option value="unpaid">Үлдэгдэлтэй</option></select><button class="students-clear" type="button" aria-label="Шүүлтүүр цэвэрлэх">⊗ <span>Шүүлтүүр цэвэрлэх</span></button><button class="students-add" type="button" aria-label="Суралцагч бүртгэх" title="Суралцагч бүртгэх">+</button>';
 const search=toolbar.querySelector('input'),[course,month,payment]=toolbar.querySelectorAll('select');
 const roster=document.createElement('div');roster.className='students-roster';roster.setAttribute('aria-label','Сурагчид');
 const meta=document.createElement('div');meta.className='students-meta';
 const panels=document.createElement('div');panels.className='students-panels';
 const profile=document.createElement('article');profile.className='students-profile';
 const summary=document.createElement('article');summary.className='students-payment';
 panels.append(profile,summary);
 const details=document.createElement('details');details.className='students-expanded';
 const title=document.createElement('summary');title.textContent='Бүртгэл, сургалт, сертификатын дэлгэрэнгүй';details.append(title,legacy);
 view.replaceChildren(toolbar,roster,meta,panels,details);
 const query=document.querySelector('#student-search');
 const oldRender=renderStudents;
 function matched(){const q=query.value.trim().toLocaleLowerCase('mn');return students.filter(s=>(s.name+' '+s.phone+' '+s.rd).toLocaleLowerCase('mn').includes(q)&&(!courseFilter.value||studentEnrollments(s).some(e=>e.course===courseFilter.value))&&(!monthFilter.value||s.ends.startsWith(monthFilter.value))&&(filter!=='unpaid'||s.paid<s.total)&&(filter!=='paid'||s.paid>=s.total)&&(filter!=='graduating'||s.ends.startsWith('2026.10')))}
 function name(s){const parts=s.name.trim().split(/\s+/);return esc(parts.slice(0,-1).join(' '))+' <strong>'+esc(parts.at(-1))+'</strong>'}
 function avatar(s,large=false){return '<span class="students-avatar '+(large?'large':'')+'" aria-hidden="true">'+esc(s.initial||s.name[0])+'</span>'}
 function progress(s){return s.total>0?Math.floor(Math.max(0,Math.min(1,s.paid/s.total))*100):100}
 function paint(){
  const records=matched();if(!records.some(s=>s.id===selected))selected=records[0]?.id;
  search.value=query.value;course.value=courseFilter.value;month.value=monthFilter.value;payment.value=['paid','unpaid'].includes(filter)?filter:'all';
  roster.replaceChildren();
  records.forEach(s=>{const b=document.createElement('button');b.type='button';b.className='students-card';b.setAttribute('aria-pressed',String(s.id===selected));b.setAttribute('aria-label',s.name+' · '+progress(s)+'% төлсөн');
   b.innerHTML=avatar(s)+'<span class="students-card-info"><span class="students-card-name">'+name(s)+'</span><span class="students-progress" role="progressbar" aria-label="Төлсөн төлбөр" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+progress(s)+'" title="'+esc(money(s.paid)+' / '+money(s.total))+'"><span style="width:'+progress(s)+'%"></span></span></span><span class="students-tags">'+studentEnrollments(s).map(e=>'<span>'+esc(e.course)+'</span>').join('')+'</span>';
   b.onclick=()=>{selected=s.id;renderStudents()};roster.append(b)
  });
  meta.textContent=records.length+' сурагч · Жишээ өгөгдөл';
  if(!records.length){roster.innerHTML='<p class="students-empty">Тохирох сурагч олдсонгүй.<br>Хайлт эсвэл шүүлтүүрээ өөрчлөөрэй.</p>';profile.hidden=summary.hidden=details.hidden=true;return}
  profile.hidden=summary.hidden=details.hidden=false;
  const s=students.find(s=>s.id===selected),entries=studentEnrollments(s),entry=entries.find(e=>e.course===selectedCourses[s.id])||entries[0];
  profile.innerHTML='<div class="students-cover" aria-hidden="true"><img src="assets/figma/students/975ce.png" alt=""></div>'+avatar(s,true)+'<h1>'+name(s)+'</h1><div class="students-contact"><span>+976</span> <strong>'+esc(s.phone)+'</strong></div><div class="students-profile-footer"><span>'+esc(s.id)+'</span><span>'+esc(entry.course)+'</span></div>';
  summary.innerHTML='<header><h2>Төлбөрийн мэдээлэл</h2><span class="students-percent">'+progress(s)+'%</span></header><div class="students-progress" aria-hidden="true"><span style="width:'+progress(s)+'%"></span></div><dl><div><dt>Нийт төлбөр</dt><dd>'+money(s.total)+'</dd></div><div><dt>Төлсөн</dt><dd>'+money(s.paid)+'</dd></div><div><dt>Үлдэгдэл</dt><dd>'+money(Math.max(0,s.total-s.paid))+'</dd></div></dl><p class="students-paid-state">'+(s.paid>=s.total?'✓ Төлбөр бүрэн төлөгдсөн':'Төлбөрийн үлдэгдэлтэй')+'</p><button type="button" class="students-open-details">Дэлгэрэнгүй харах →</button>';
  summary.querySelector('button').onclick=()=>{details.open=true;details.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'})};
 }
 // Keep the original enrollment, graduation and certificate event handlers.
 renderStudents=function(){oldRender();paint()};
 function refreshOptions(){const prev=course.value;course.replaceChildren(new Option('Сургалтын төрөл',''),...Array.from(new Set(students.flatMap(s=>studentEnrollments(s).map(e=>e.course)))).map(c=>new Option(c,c)));course.value=prev;const m=month.value;month.replaceChildren(new Option('Он сараар хайх',''),...Array.from(new Set(students.map(s=>s.ends.slice(0,7)))).sort().map(v=>new Option(v.replace('.',' / '),v)));month.value=m;for(const option of month.options){if(!Array.from(monthFilter.options).some(o=>o.value===option.value))monthFilter.append(new Option(option.textContent,option.value))}for(const option of course.options){if(!Array.from(courseFilter.options).some(o=>o.value===option.value))courseFilter.append(new Option(option.textContent,option.value))}}
 function update(){query.value=search.value;courseFilter.value=course.value;monthFilter.value=month.value;filter=payment.value;renderStudents()}
 search.addEventListener('input',update);[course,month,payment].forEach(e=>e.addEventListener('change',update));
 toolbar.querySelector('.students-clear').onclick=()=>{search.value=course.value=month.value='';payment.value='all';update();search.focus()};
 toolbar.querySelector('.students-add').onclick=()=>workspaceSelect('register');
 const select=workspaceSelect;workspaceSelect=function(key){select(key);const isStudents=key==='students',isRegister=key==='register';document.querySelector('.work-hub').classList.toggle('register-open',isRegister);if(isRegister)document.querySelector('.figma-menu [data-hub=students]')?.setAttribute('aria-selected','true');if(isStudents){refreshOptions();renderStudents()}const notch=document.querySelector('.rise-notch');notch.hidden=!['students','goal'].includes(key);if(isStudents)notch.querySelector('.notch-summary').textContent='Сурагчдын мэдээллээ хамтдаа хяная.';else if(key==='goal')notch.querySelector('.notch-summary').textContent='Өнөөдрийн зорилгоо хамтдаа биелүүлье.'};selectHub=workspaceSelect;
 window.addEventListener('rise-data-change',e=>{if(!['rise-added-students','rise-graduation-dates','rise-selected-courses','rise-certificate-payments','rise-certificate-orders'].includes(e.detail?.key))return;queueMicrotask(()=>{refreshOptions();if(workspaceSection==='students'&&!document.querySelector('.work-hub').classList.contains('register-open'))renderStudents()})});
 document.querySelector('#registration-form').addEventListener('submit',()=>{if(document.querySelector('#registration-form').elements.name.value==='')workspaceSelect('students')});
 refreshOptions();paint();
})();
