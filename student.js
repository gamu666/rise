// Browser-local student portal. No payment gateway, AI, live-class service or server authentication.
// Icons: Lucide (ISC License, lucide.dev), inlined so the page needs no icon font or network request.
(()=>{
 if(sessionStorage.getItem('rise-demo-level')!=='student'){location.replace('staff.html');return;}
 const M=window.RISE_STUDENT_MODEL,me=M.profile,courses=me.courses,$=s=>document.querySelector(s);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paths={
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  book:'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  user:'<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  cap:'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  bell:'<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  play:'<polygon points="6 3 20 12 6 21 6 3"/>',
  file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  close:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  calendar:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  next:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  card:'<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  qr:'<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  phone:'<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  external:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
 };
 const icon=(n,cls)=>'<svg class="student-icon'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[n]+'</svg>';

 // Dates are Asia/Ulaanbaatar calendar days in YYYY-MM-DD form.
 const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date());
 const WEEKDAYS=['Ням','Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба'];
 const utc=d=>new Date(d+'T00:00:00Z');
 const longDate=d=>{const t=utc(d);return (t.getUTCMonth()+1)+'-р сарын '+t.getUTCDate()+', '+WEEKDAYS[t.getUTCDay()];};
 // ISO timestamps are shown as the Ulaanbaatar calendar day; plain YYYY-MM-DD values stay as entered.
 const shortDate=v=>{const s=String(v??'');const day=s.includes('T')&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date(s)):s.slice(0,10);const d=M.date(day);return d?d.replaceAll('-','.'):'—';};
 const daysUntil=d=>Math.round((utc(d)-utc(today()))/86400000);
 const relative=d=>{const n=daysUntil(d);return n===0?'Өнөөдөр':n===1?'Маргааш':n===2?'Нөгөөдөр':n===-1?'Өчигдөр':n<0?(-n)+' хоногийн өмнө':n+' хоногийн дараа';};
 const addDays=(d,n)=>new Date(utc(d).getTime()+n*86400000).toISOString().slice(0,10);
 const monthDay=d=>(utc(d).getUTCMonth()+1)+'-р сарын '+utc(d).getUTCDate();
 const money=n=>new Intl.NumberFormat('en-US').format(n)+'₮';

 const read=(key,fallback)=>{try{const data=JSON.parse(localStorage.getItem(key)||'null');return data??fallback;}catch{return fallback;}};
 const array=key=>{const v=read(key,[]);return Array.isArray(v)?v:[];};
 const object=key=>{const v=read(key,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};
 const workspace=()=>{const v=object('rise-teacher-workspace-v1');for(const k of ['lessons','schedule','attendance'])if(!Array.isArray(v[k]))v[k]=[];return v;};
 // Real records first; preview data (student-preview-data.js) only fills a section that has no real data yet.
 const P=window.RISE_STUDENT_PREVIEW?.(today(),me)||{};
 const lessons=()=>{const real=M.visibleLessons(workspace());return real.length?real:(P.lessons||[]);};
 const records=()=>({...(lessons()[0]?.preview?P.progress:{}),...(object('rise-student-progress-v1')[me.id]||{})});
 const schedule=()=>{const real=workspace().schedule.filter(s=>M.belongs(s?.courseId));return (real.length?real:(P.schedule||[])).map(s=>({...s,day:M.date(s?.date)})).filter(s=>s.day).sort((a,b)=>(a.day+(a.time||'')).localeCompare(b.day+(b.time||'')));};
 const attendance=()=>{const real=workspace().attendance.filter(a=>a.studentId===me.id&&M.belongs(a.courseId));return real.length?real:(P.attendance||[]);};
 function enrollment(c){const portal=object('rise-student-portal-records-v1')[me.id],added=array('rise-added-students').find(s=>s.id===me.id),record=portal||added,entries=Array.isArray(record?.enrollments)?record.enrollments:record?[record]:[];return entries.find(e=>e.courseId===c.id||e.course===c.name)||P.enrollments?.[c.id]||{};}
 const program=c=>P.programs?.[c.id]||null;
 // Teacher-entered practice hours and exam results (teacher.js student details). Real records replace the preview.
 const practiceDone=c=>{const real=(workspace().practice||[]).filter(p=>p.studentId===me.id&&p.courseId===c.id);return real.length?real.reduce((n,p)=>n+(Number(p.hours)||0),0):program(c)?.practice?.done??null;};
 const examResult=(c,exam)=>(workspace().exams||[]).find(x=>x.studentId===me.id&&x.courseId===c.id&&x.exam===exam)||null;
 function finance(){const entries=courses.map(enrollment);if(!entries.length||!entries.every(e=>M.amount(e.total)!==null&&M.amount(e.paid)!==null))return null;const total=entries.reduce((n,e)=>n+e.total,0),paid=entries.reduce((n,e)=>n+e.paid,0),dueDate=entries.map(e=>M.date(e.dueDate)).filter(Boolean).sort()[0]||null;return {total,paid,due:Math.max(0,total-paid),percent:total?Math.min(100,Math.round(paid/total*100)):100,dueDate};}
 const paymentRows=()=>courses.flatMap(c=>(Array.isArray(enrollment(c).payments)?enrollment(c).payments:[]).filter(p=>M.amount(p.amount)!==null).map(p=>({...p,course:c.name})));
 // Certificate: eligible once the teacher records a passed final exam; the order flow lives in certificate-requests.js.
 const C=window.RISE_CERTS;
 const finalScore=c=>examResult(c,'final')?.score??null;
 const certEligible=c=>finalScore(c)!==null&&finalScore(c)>=C.PASS_SCORE;
 const myRequest=c=>C.read().filter(r=>r.studentId===me.id&&C.itemsOf(r).some(i=>i.courseId===c.id)).at(-1)||null;
 const orderable=()=>courses.filter(c=>certEligible(c)&&!myRequest(c));
 const graduated=()=>courses.filter(c=>certEligible(c)||myRequest(c));
 const courseName=id=>courses.find(c=>c.id===id)?.name||'';
 const firstName=me.name.split(' ').at(-1)||me.name;
 const photo=c=>'assets/student-portal/'+(/маникюр|сормуус|гоо сайхан|beauty/iu.test(c?.name||'')?'beauty':/экскаватор|ковш|дамп|оператор/iu.test(c?.name||'')?'machinery':'campus')+'.jpg';
 // Neutral person icon instead of a photo (no real or stock faces in the portal).
 const avatarUrl='assets/person.svg';
 const KIND={theory:['Онол','is-theory'],practice:['Дадлага','is-practice'],exam:['Шалгалт','is-exam']};
 const kindOf=s=>KIND[s.kind]||['Хичээл','is-theory'];
 // Course day N of M from the program (or the enrollment dates when no program exists).
 function courseDay(c){const e=enrollment(c),p=program(c),start=p?.start||M.date(e.registered),end=p?.end||M.date(e.ends);if(!start||!end)return null;const total=Math.round((utc(end)-utc(start))/86400000)+1,day=Math.min(total,Math.max(0,Math.round((utc(today())-utc(start))/86400000)+1));return {day,total,start,end};}

 const page=$('#student-content'),dialog=$('#student-dialog'),titleNode=$('#student-title'),subNode=$('#student-date'),backNode=$('#student-back');
 let view='home',chosen=null,filter='all',query='',toastTimer,cleanup=[];
 // Schedule card: first day of the visible 7-day window and the selected day (null = pick automatically).
 let schedStart=null,schedDay=null;
 function toast(text){const n=$('.student-toast');n.textContent=text;n.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.hidden=true,3200);}
 function persist(key,value){localStorage.setItem(key,JSON.stringify(value));}
 const empty=(name,title,copy)=>'<div class="student-empty"><span class="student-empty-icon">'+icon(name)+'</span><strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p></div>';
 const meter=(p,label)=>'<div class="student-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'" aria-label="'+esc(label||'Хичээлийн ахиц')+'" style="--progress:'+p+'%"><i></i></div>';
 const kind=l=>(l.type==='video'?'Видео':'Унших материал')+(l.minutes?' · '+l.minutes+' мин':'');

 function open(title,html,wide){if(dialog.open)return false;dialog.classList.toggle('is-wide',wide===true);dialog.innerHTML='<header><h2>'+esc(title)+'</h2><button class="student-close" aria-label="Хаах">'+icon('close')+'</button></header>'+html;dialog.querySelector('.student-close').onclick=()=>dialog.close();dialog.showModal();return true;}
 dialog.addEventListener('close',()=>{if(!dialog.open)cleanup.splice(0).forEach(fn=>fn());});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 function navigate(next,id){view=next;chosen=id||null;query='';filter='all';render();scrollTo(0,0);}
 const nav=()=>[['home','Нүүр','home','Нүүр'],['courses','Сургалт','book','Миний сургалт'],['payments','Төлбөр','wallet','Төлбөр'],...(graduated().length?[['certificates','Сертификат','cap','Сертификат']]:[]),['profile','Профайл','user','Миний мэдээлэл']];

 function courseCard(c){const p=M.progress(lessons(),records(),c.id),d=courseDay(c);return '<button class="student-course" data-course="'+esc(c.id)+'"><span class="student-thumb" style="background-image:url('+photo(c)+')"></span><span class="student-course-copy"><strong>'+esc(c.name)+'</strong><small>'+esc(c.group)+(d?' · '+d.day+'/'+d.total+' дахь өдөр':'')+'</small>'+meter(p.percent,c.name+' — хичээлийн ахиц')+'<small>'+p.done+' / '+p.total+' хичээл үзсэн</small></span>'+icon('chevron','student-chevron')+'</button>';}

 // Dashboard order: when/where is my next class, what do I study now, where am I in the course, what is left.
 // Week strip: every day is a button; the panel below lists the selected day's sessions.
 function scheduleCard(){
  const now=today(),all=schedule(),days=[...new Set(all.map(s=>s.day))].sort();
  if(!schedStart)schedStart=now;
  if(!schedDay)schedDay=all.some(s=>s.day===now)?now:(days.find(d=>d>=now&&d<addDays(schedStart,7))||now);
  const minStart=days.length&&days[0]<now?days[0]:now,maxStart=days.length?days[days.length-1]:now;
  const SHORT=['Ня','Да','Мя','Лх','Пү','Ба','Бя'],week=Array.from({length:7},(_,i)=>addDays(schedStart,i));
  const strip='<div class="student-week" role="group" aria-label="Өдөр сонгох">'+week.map(d=>{const items=all.filter(s=>s.day===d),k=items[0]?kindOf(items[0])[1]:'';return '<button type="button" data-sched-day="'+d+'" class="'+(d===now?'is-today ':'')+k+'" aria-pressed="'+(d===schedDay)+'" aria-label="'+esc(longDate(d)+(items.length?' — '+items.map(s=>kindOf(s)[0]).join(', '):' — хичээлгүй'))+'"><small>'+(d===now?'<span class="is-long">Өнөөдөр</span><span class="is-short">Өнөө</span>':SHORT[utc(d).getUTCDay()])+'</small><b>'+utc(d).getUTCDate()+'</b><i></i></button>';}).join('')+'</div>';
  const legend='<div class="student-legend"><span class="is-theory"><i></i>Онол</span><span class="is-practice"><i></i>Дадлага</span><span class="is-exam"><i></i>Шалгалт</span></div>';
  const items=all.filter(s=>s.day===schedDay),rel=relative(schedDay),title=(['Өнөөдөр','Маргааш','Нөгөөдөр','Өчигдөр'].includes(rel)?rel+' · ':'')+WEEKDAYS[utc(schedDay).getUTCDay()]+', '+monthDay(schedDay);
  const next=all.find(s=>s.day>schedDay);
  const agenda=items.length
   ?'<ul class="student-agenda">'+items.map(s=>'<li class="'+kindOf(s)[1]+'"><span class="student-agenda-time">'+esc(s.time||'—')+'</span><span class="student-agenda-copy"><span class="student-kind '+kindOf(s)[1]+'">'+kindOf(s)[0]+'</span><strong>'+esc(s.title||kindOf(s)[0])+'</strong>'+(s.location?'<small class="student-with-icon">'+icon('pin')+esc(s.location)+'</small>':'')+'</span></li>').join('')+'</ul>'
   :'<div class="student-agenda-empty"><p>Энэ өдөр хичээлгүй.</p>'+(next?'<button type="button" class="student-text-link" data-sched-day="'+next.day+'">Дараагийн хичээл: '+esc(relative(next.day)+' · '+next.time)+icon('chevron')+'</button>':'')+'</div>';
  return '<section class="student-card student-schedule"><header class="student-card-head"><h2>Хичээлийн хуваарь</h2><div class="student-week-nav"><button type="button" class="student-icon-button" data-sched-week="-1" aria-label="Өмнөх 7 хоног"'+(schedStart<=minStart?' disabled':'')+'>'+icon('back')+'</button><span>'+esc(shortDate(week[0]).slice(5)+' – '+shortDate(week[6]).slice(5))+'</span><button type="button" class="student-icon-button" data-sched-week="1" aria-label="Дараагийн 7 хоног"'+(schedStart>=maxStart?' disabled':'')+'>'+icon('next')+'</button></div></header>'
   +strip+legend+'<div class="student-agenda-head"><h3>'+esc(title)+'</h3>'+(items.length?'<span>'+items.length+' хичээл</span>':'')+'</div>'+agenda+'</section>';
 }
 function resumeCard(){
  const all=lessons(),rec=records(),done=all.filter(l=>rec[l.id]?.complete===true).length,next=all.find(l=>!rec[l.id]?.complete),c=courses.find(c=>c.id===next?.courseId)||courses[0],percent=all.length?Math.round(done/all.length*100):0;
  if(!all.length)return '<section class="student-card student-resume"><span class="student-thumb" style="background-image:url('+photo(c)+')"></span><div class="student-resume-copy"><span class="student-label">Онлайн хичээл</span><strong>Багш хичээлээ оруулахад энд гарна</strong></div></section>';
  return '<section class="student-card student-resume"><span class="student-thumb is-lg" style="background-image:url('+photo(c)+')"></span><div class="student-resume-copy"><span class="student-label">'+(next?(done?'Үргэлжлүүлэх':'Эхлэх'):'Бүх хичээлээ үзсэн')+'</span><strong>'+esc((next||all[all.length-1]).title)+'</strong><small>'+esc(((next||all[0]).section||'')+' · '+kind(next||all[0]))+'</small>'+meter(percent)+'<small>'+done+' / '+all.length+' хичээл үзсэн</small></div><button class="student-button student-primary" data-lesson="'+esc((next||all[0]).id)+'">'+icon((next||all[0]).type==='video'?'play':'file')+(next?'Үзэх':'Дахин үзэх')+'</button></section>';
 }
 // Course path: theory -> safety test -> practice on the machine -> final exam -> certificate + ID.
 function journeyCard(c,wide){
  const p=program(c),d=courseDay(c),e=enrollment(c),f=M.amount(e.total)!==null&&M.amount(e.paid)!==null?Math.max(0,e.total-e.paid):null;
  if(!p||!d)return '<section class="student-card student-journey"><header class="student-card-head"><h2>Сургалтын явц</h2></header><p class="student-quiet">Сургалтын хөтөлбөр гарахад энд харагдана.</p></section>';
  const result=s=>s.id==='safety'||s.id==='final'?examResult(c,s.id):null;
  const state=s=>{const r=result(s);if(r)return r.score>=70?'is-done':'is-now';return d.day>s.to?'is-done':d.day>=s.from?'is-now':'';};
  const copyOf=s=>{const r=result(s);return r?r.score+'% · '+(r.score>=70?'Тэнцсэн':'Тэнцээгүй — дахин шалгуулна'):s.copy;};
  const when=s=>s.from===s.to?shortDate(new Date(utc(d.start).getTime()+(s.from-1)*86400000).toISOString()):(s.from+'–'+s.to+'-р өдөр');
  const steps=p.stages.map(s=>'<li class="'+state(s)+'"><span class="student-step">'+(state(s)==='is-done'?icon('check'):'')+'</span><span><strong>'+esc(s.title)+(state(s)==='is-now'?' <em>Одоо</em>':'')+'</strong><small>'+esc(when(s)+' · '+copyOf(s))+'</small></span></li>').join('')
   +(()=>{const r=myRequest(c);return '<li class="'+(r?.status==='delivered'?'is-done':r||certEligible(c)?'is-now':'')+'"><span class="student-step">'+icon('cap')+'</span><span><strong>Сертификат + үнэмлэх'+(certEligible(c)&&!r?' <em>Захиалах</em>':'')+'</strong><small>'+esc(r?C.LABEL[r.status]+' · '+r.id:certEligible(c)?'Төгсөлтийн шалгалтад тэнцсэн — одоо захиална':f>0?'Төгсөлтийн шалгалтад тэнцэж, сургалтын төлбөр бүрэн бол · '+money(f)+' үлдсэн':'Төгсөлтийн шалгалтад тэнцсэний дараа захиална')+'</small>'+(r||certEligible(c)?'<button class="student-text-link" data-nav="certificates">Сертификат'+icon('chevron')+'</button>':'')+'</span></li>';})();
  return '<section class="student-card student-journey'+(wide?' is-wide':'')+'"><header class="student-card-head"><h2>Сургалтын явц</h2><span>'+d.day+' / '+d.total+' дахь өдөр</span></header>'+meter(Math.round(d.day/d.total*100),'Сургалтын хугацааны явц')+'<ol>'+steps+'</ol></section>';
 }
 function statCards(){
  const f=finance(),att=attendance(),present=att.filter(a=>a.present).length,c=courses[0],req=program(c)?.practice?.required,done=practiceDone(c),pr=req&&done!==null?{required:req,done}:null;
  // Compact list: one row per figure, each with what it means and what to do.
  const row=(name,label,main,sub,extra,cls)=>'<li class="'+(cls||'')+'"><span class="student-status-icon">'+icon(name)+'</span><span class="student-status-copy"><small>'+label+'</small><strong>'+main+'</strong><span>'+sub+'</span>'+(extra||'')+'</span></li>';
  const dueSoon=f&&f.due>0&&f.dueDate&&daysUntil(f.dueDate)<=7;
  return '<section class="student-card student-status"><header class="student-card-head"><h2>Миний байдал</h2></header><ul>'
   +(f?row('wallet','Төлбөрийн үлдэгдэл',f.due>0?money(f.due):'Бүрэн төлсөн',f.due>0?(f.dueDate?relative(f.dueDate)+' төлөх · '+monthDay(f.dueDate):'Нийт '+money(f.total)):'Нийт '+money(f.total),f.due>0?'<button class="student-text-link" data-nav="payments">Төлөх'+icon('chevron')+'</button>':'',dueSoon?'is-alert':''):row('wallet','Төлбөр','—','Мэдээлэл ирээгүй'))
   +(att.length?row('calendar','Ирц',Math.round(present/att.length*100)+'%',att.length+' хичээлээс '+present+'-д ирсэн',meter(Math.round(present/att.length*100),'Ирцийн хувь')):row('calendar','Ирц','—','Бүртгэл эхлээгүй'))
   +(pr?row('clock','Дадлагын цаг',pr.done+' / '+pr.required+' цаг',pr.done?'Машин дээр ажилласан':'Дадлага 15-р өдрөөс эхэлнэ',meter(Math.min(100,Math.round(pr.done/pr.required*100)),'Дадлагын цаг')):'')
   +'</ul></section>';
 }
 function home(){
  return certBanner()+'<div class="student-home">'+(document.documentElement.classList.contains('is-ultrawide')
   ?'<div class="student-home-main">'+scheduleCard()+'</div><div class="student-home-side">'+statCards()+resumeCard()+'</div><div class="student-home-side">'+journeyCard(courses[0])+'</div></div>'
   :'<div class="student-home-main">'+scheduleCard()+'</div>'+'<div class="student-home-side">'+statCards()+'</div></div><div class="student-home-wide">'+resumeCard()+journeyCard(courses[0],true)+'</div>')+(courses.length>1?'<header class="student-section-head"><h2>Миний сургалтууд</h2></header><div class="student-course-grid">'+courses.map(courseCard).join('')+'</div>':'');
 }
 const courseResults=()=>courses.filter(c=>c.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(courseCard).join('')||empty('book','Сургалт олдсонгүй','Хайлтаа өөрчилнө үү.');
 function courseView(){
  const c=chosen?courses.find(c=>c.id===chosen):courses.length===1?courses[0]:null;
  if(!c)return '<div class="student-course-grid" id="student-course-results">'+courseResults()+'</div>';
  const own=lessons().filter(l=>l.courseId===c.id),rec=records(),p=M.progress(lessons(),rec,c.id),nextId=own.find(l=>!rec[l.id]?.complete)?.id,list=own.filter(l=>filter==='all'||l.type===filter),groups=[];
  for(const l of list){const name=l.section||'Ерөнхий';let g=groups.find(g=>g.name===name);if(!g)groups.push(g={name,items:[]});g.items.push(l);}
  const row=l=>{const done=rec[l.id]?.complete===true;return '<button class="student-lesson'+(done?' is-done':'')+(l.id===nextId?' is-next':'')+'" data-lesson="'+esc(l.id)+'"><span class="student-lesson-icon">'+icon(done?'check':l.type==='video'?'play':'file')+'</span><span class="student-lesson-copy"><strong>'+esc(l.title)+'</strong><small>'+kind(l)+(done?' · Үзсэн':'')+'</small></span>'+(l.id===nextId?'<span class="student-tag">Дараагийн</span>':'')+icon('chevron','student-chevron')+'</button>';};
  return '<div class="student-course-layout"><div><section class="student-card student-course-head"><span class="student-thumb is-lg" style="background-image:url('+photo(c)+')"></span><div><strong>'+p.done+' / '+p.total+' хичээл үзсэн</strong>'+meter(p.percent)+'<small>Онлайн хичээлийг өөрийн хурдаар үзээрэй. Танхим, дадлагын цагийг хуваариас харна.</small></div></section>'
   +(own.length?'<div class="student-segment" role="group" aria-label="Хичээлийн төрөл">'+[['all','Бүгд'],['video','Видео'],['file','Материал']].map(([id,label])=>'<button data-filter="'+id+'" aria-pressed="'+(filter===id)+'">'+label+'</button>').join('')+'</div>':'')
   +(groups.length?groups.map(g=>'<section class="student-lesson-group"><h2>'+esc(g.name)+'</h2>'+g.items.map(row).join('')+'</section>').join(''):own.length?empty('file','Энэ төрлийн хичээл алга','Өөр төрлийг сонгоно уу.'):empty('book','Хичээл хараахан нэмэгдээгүй','Багшийн бэлэн болгосон хичээлүүд энд харагдана.'))
   +'</div><aside>'+journeyCard(c)+'</aside></div>';
 }
 function paymentsView(){
  const f=finance(),rows=paymentRows();
  if(!f)return '<section class="student-card">'+empty('wallet','Төлбөрийн мэдээлэл хараахан ирээгүй','Менежер таны бүртгэлийг баталгаажуулсны дараа төлбөр, үлдэгдэл энд харагдана.')+'</section>';
  const summary='<section class="student-card student-balance"><small>'+(f.due>0?'Төлөх үлдэгдэл':'Төлбөр')+'</small><strong class="student-amount'+(f.due>0?'':' student-ok')+'">'+(f.due>0?money(f.due):icon('check')+'Бүрэн төлсөн')+'</strong>'+(f.due>0&&f.dueDate?'<span class="student-due'+(daysUntil(f.dueDate)<=7?' is-alert':'')+'">'+icon('calendar')+esc(longDate(f.dueDate)+' хүртэл · '+relative(f.dueDate).toLowerCase())+'</span>':'')+meter(f.percent,'Төлбөрийн явц')+'<p>Нийт '+money(f.total)+'-ийн '+money(f.paid)+' төлөгдсөн</p>'+(f.due>0?'<button class="student-button student-primary" data-pay>'+icon('card')+'Төлбөр төлөх</button>':'')+'</section>';
  const perCourse=courses.length>1?'<header class="student-section-head"><h2>Сургалт тус бүрээр</h2></header><section class="student-card student-list">'+courses.map(c=>{const e=enrollment(c);return '<div class="student-row"><span><strong>'+esc(c.name)+'</strong><small>'+money(e.paid)+' төлсөн</small></span><b>'+money(e.total)+'</b></div>';}).join('')+'</section>':'';
  const history='<header class="student-section-head"><h2>Төлөлтийн түүх</h2></header>'+(rows.length?'<section class="student-card student-list">'+rows.map(r=>'<div class="student-row"><span class="student-row-icon is-ok">'+icon('check')+'</span><span><strong>'+esc(shortDate(r.recordedAt||r.date))+'</strong><small>'+esc((r.method||'Арга тодорхойгүй')+(courses.length>1?' · '+r.course:''))+'</small></span><b>'+money(r.amount)+'</b></div>').join('')+'</section>':'<section class="student-card">'+empty('wallet','Төлөлтийн задаргаа ирээгүй','Баталгаажсан төлөлтийн огноо, дүн, төлсөн арга энд харагдана.')+'</section>');
  return summary+perCourse+history;
 }
 function profileView(){
  const requests=array('rise-student-leave-requests-v1').filter(r=>r.studentId===me.id&&M.belongs(r.courseId)),e=enrollment(courses[0]);
  const state={pending:['Хүлээгдэж байна',''],approved:['Зөвшөөрсөн',' is-ok'],rejected:['Татгалзсан',' is-danger']};
  return '<section class="student-card student-profile"><img class="student-avatar-lg" src="'+avatarUrl+'" alt=""><div><h2>'+esc(me.name)+'</h2><p>'+courses.map(c=>esc(c.name+' · '+c.group)).join('<br>')+'</p>'+(e.manager?'<p>Хариуцсан менежер: '+esc(e.manager)+'</p>':'')+'</div></section>'
   +statCards()
   +'<header class="student-section-head"><h2>Чөлөөний хүсэлт</h2><button class="student-button" data-leave>'+icon('calendar')+'Чөлөө хүсэх</button></header>'
   +(requests.length?'<section class="student-card student-list">'+requests.map(r=>{const [label,cls]=state[r.status]||state.pending;return '<div class="student-row is-top"><span><strong>'+esc(shortDate(r.start)+' — '+shortDate(r.end))+'</strong><small>'+esc(courseName(r.courseId))+' · '+esc(r.reason)+'</small>'+(r.note?'<small>Багшийн тайлбар: '+esc(r.note)+'</small>':'')+'</span><span class="student-tag'+cls+'">'+label+'</span></div>';}).join('')+'</section>':'<section class="student-card"><p class="student-quiet">Хүсэлт илгээгээгүй. Хичээлээ тасалбал урьдчилан чөлөө хүснэ үү — хариуцсан багш шийдвэрлэнэ.</p></section>')
   +'<button class="student-button student-logout" data-logout>'+icon('logout')+'Системээс гарах</button>';
 }
 // Status tracker shared by every request card.
 function certTracker(r){const at=C.STEPS.findIndex(([k])=>k===r.status);return '<ol class="student-cert-steps">'+C.STEPS.map(([k,label],i)=>{const h=k==='ordered'?r.history[0]:[...r.history].reverse().find(x=>x.status===k);return '<li class="'+(i<at||r.status==='delivered'?'is-done':i===at?'is-now':'')+'"><span class="student-step">'+(i<at||r.status==='delivered'?icon('check'):'')+'</span><span><strong>'+label+'</strong>'+(h&&i<=at?'<small>'+esc(shortDate(h.at)+(h.by?' · '+h.by:''))+'</small>':'')+'</span></li>';}).join('')+'</ol>';}
 const payMethods=(name)=>'<fieldset class="student-choice is-pay"><legend>Төлбөрийн арга</legend>'+Object.entries(C.METHODS).map(([k,v],i)=>'<label><input type="radio" name="'+(name||'method')+'" value="'+k+'"'+(i===0?' checked':'')+'><span>'+v+'</span></label>').join('')+'</fieldset>';
 const payNote='<p class="student-quiet">Төлбөрийн систем хараахан холбогдоогүй тул бодит гүйлгээ хийгдэхгүй — сонгосон аргаар төлсөнийг менежер шалгаж баталгаажуулна.</p>';
 // One order covers every passed course that has not been ordered; one course = one certificate.
 function orderCard(list){
  const total=list.reduce((n,c)=>n+C.priceOf(c.name),0),due=list.map(c=>{const e=enrollment(c);return M.amount(e.total)!==null&&M.amount(e.paid)!==null?Math.max(0,e.total-e.paid):0;}).reduce((a,b)=>a+b,0);
  return '<section class="student-card student-cert"><header class="student-card-head"><h2>Сертификат захиалах</h2><span>Төгсөлтийн шалгалтад тэнцсэн</span></header>'
   +'<form data-cert-order><fieldset class="student-cert-items"><legend>Сургалт (сургалт бүрд 1 сертификат)</legend>'+list.map(c=>'<label><input type="checkbox" name="course" value="'+esc(c.id)+'" data-price="'+C.priceOf(c.name)+'" checked><span><strong>'+esc(c.name)+'</strong><small>Төгсөлтийн шалгалт '+finalScore(c)+'%</small></span><b>'+money(C.priceOf(c.name))+'</b></label>').join('')+'</fieldset>'
   +'<label>Сертификат дээр хэвлэх нэр<input name="printName" required maxlength="80" value="'+esc(me.name)+'"><small>Овог, нэрээ бүтнээр, зөв бичнэ үү. Хэвлэсний дараа засах боломжгүй.</small></label>'
   +'<fieldset class="student-choice"><legend>Хүлээн авах</legend>'+Object.entries(C.DELIVERY).map(([k,v],i)=>'<label><input type="radio" name="delivery" value="'+k+'"'+(i===0?' checked':'')+'><span>'+v+'</span></label>').join('')+'</fieldset>'
   +'<label class="student-address" hidden>Шуудангийн хаяг<textarea name="address" maxlength="300" placeholder="Аймаг/дүүрэг, хороо, байр, тоот, утас"></textarea></label>'
   +payMethods()
   +(due>0?'<p class="student-warn">Сургалтын төлбөр '+money(due)+' үлдсэн байна. Менежер баталгаажуулахаас өмнө бүрэн төлөгдсөн байх ёстой.</p>':'')
   +'<div class="student-fee-row"><span>Нийт төлөх</span><strong data-cert-total>'+money(total)+'</strong></div>'
   +'<p class="student-form-error" role="status"></p><button class="student-button student-primary" type="submit">'+icon('card')+'<span data-cert-pay>'+money(total)+' төлөх</span></button>'+payNote+'</form></section>';
 }
 function requestCard(r){
  const note=C.returned(r)?'<p class="student-warn is-danger">Менежер буцаасан: '+esc(C.lastNote(r))+'</p>':'';
  let action='';
  if(r.status==='ordered')action='<div class="student-pay-box"><strong>Дахин төлөх: '+money(r.fee)+'</strong><form data-cert-paid="'+esc(r.id)+'">'+payMethods()+'<label>Гүйлгээний дугаар / тайлбар (заавал биш)<input name="reference" maxlength="60"></label><p class="student-form-error" role="status"></p><button class="student-button student-primary" type="submit">'+icon('card')+money(r.fee)+' төлөх</button>'+payNote+'</form></div>';
  if(r.status==='payment_review')action='<p class="student-quiet">Төлбөр ('+esc(C.METHODS[r.payment?.method]||'')+') менежерт очлоо. Шалгаж баталгаажуулахад энд мэдэгдэнэ.</p>';
  if(r.status==='confirmed'||r.status==='printing')action='<p class="student-quiet">"'+esc(r.printName)+'" нэрээр хэвлэнэ.</p>';
  if(r.status==='ready')action='<p class="student-ok-box">'+(r.delivery==='post'?'Шуудангаар илгээхэд бэлэн: '+esc(r.address):'Сургуулийн ресепшнээс иргэний үнэмлэхээ авчирч авна уу.')+'</p>';
  if(r.status==='delivered')action='<p class="student-ok-box">Гардуулсан. Баяр хүргэе!</p>';
  return '<section class="student-card student-cert"><header class="student-card-head"><h2>'+esc(C.courseNames(r))+'</h2><span class="student-tag'+(r.status==='delivered'||r.status==='ready'?' is-ok':'')+'">'+esc(C.LABEL[r.status])+'</span></header><div class="student-cert-meta"><span>Захиалга <b>'+esc(r.id)+'</b></span><span>'+C.itemsOf(r).length+' сертификат · <b>'+money(r.fee)+'</b></span><span>'+esc(C.DELIVERY[r.delivery])+'</span></div>'+note+certTracker(r)+action+'</section>';
 }
 function certificateView(){
  const own=C.read().filter(r=>r.studentId===me.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))),open=orderable(),waiting=courses.filter(c=>!certEligible(c)&&!myRequest(c));
  return (open.length?orderCard(open):'')+own.map(requestCard).join('')+(waiting.length&&(open.length||own.length)?'<section class="student-card"><p class="student-quiet">'+esc(waiting.map(c=>c.name).join(', '))+': төгсөлтийн шалгалтын дүн гарсны дараа захиална.</p></section>':'')||'<section class="student-card">'+empty('cap','Сертификат нээгдээгүй','Төгсөлтийн шалгалтын дүн гарсны дараа энд захиална.')+'</section>';
 }
 // Banner on the home page as soon as an exam result makes a certificate orderable.
 function certBanner(){const open=orderable();if(!open.length)return '';const total=open.reduce((n,c)=>n+C.priceOf(c.name),0);return '<section class="student-cert-banner"><span class="student-tile">'+icon('cap')+'</span><div><strong>Баяр хүргэе! Төгсөлтийн шалгалтад тэнцлээ.</strong><small>'+esc(open.map(c=>c.name).join(', '))+' · '+open.length+' сертификат · '+money(total)+'</small></div><button class="student-button student-primary" data-nav="certificates">Захиалах</button></section>';}
 function bindCertificate(){
  page.querySelectorAll('form[data-cert-order]').forEach(f=>{const box=f.querySelector('.student-address');f.querySelectorAll('[name=delivery]').forEach(i=>i.onchange=()=>box.hidden=f.elements.delivery.value!=='post');
   const sync=()=>{const sum=[...f.querySelectorAll('[name=course]:checked')].reduce((n,i)=>n+Number(i.dataset.price),0);f.querySelector('[data-cert-total]').textContent=money(sum);f.querySelector('[data-cert-pay]').textContent=money(sum)+' төлөх';};f.querySelectorAll('[name=course]').forEach(i=>i.onchange=sync);
   f.onsubmit=e=>{e.preventDefault();const picked=[...f.querySelectorAll('[name=course]:checked')].map(i=>courses.find(c=>c.id===i.value)).filter(Boolean);try{const {list}=C.create(C.read(),{studentId:me.id,studentName:me.name,courses:picked.map(c=>({courseId:c.id,courseName:c.name,finalScore:finalScore(c)})),printName:f.elements.printName.value,delivery:f.elements.delivery.value,address:f.elements.address.value,payment:{method:f.elements.method.value}},new Date().toISOString());C.write(list);render();toast('Төлбөр менежерт илгээгдлээ. Баталгаажуулахад мэдэгдэнэ.');}catch(err){f.querySelector('[role=status]').textContent=err.message;}};});
  page.querySelectorAll('form[data-cert-paid]').forEach(f=>f.onsubmit=e=>{e.preventDefault();try{C.write(C.move(C.read(),f.dataset.certPaid,'payment_review','student',{method:f.elements.method.value,reference:f.elements.reference.value,by:me.name},new Date().toISOString()));render();toast('Төлбөр менежерт илгээгдлээ.');}catch(err){f.querySelector('[role=status]').textContent=err.message;}});
 }
 const views={home,courses:courseView,payments:paymentsView,profile:profileView,certificates:certificateView};
 function render(){
  if(view==='certificates'&&!graduated().length)view='home';
  const items=nav(),course=view==='courses'?(chosen?courses.find(c=>c.id===chosen):courses.length===1?courses[0]:null):null;
  if(view==='courses'&&chosen&&!course)chosen=null;
  $('.student-nav').innerHTML=items.map(([id,label,n])=>'<button data-nav="'+id+'"'+(id===view?' aria-current="page"':'')+'>'+icon(n)+'<span>'+label+'</span></button>').join('');
  backNode.hidden=!(course&&chosen&&courses.length>1);
  titleNode.textContent=course?course.name:view==='home'?'Сайн уу, '+firstName+'!':items.find(n=>n[0]===view)?.[3]||'Миний сургалт';
  const d=courseDay(courses[0]);
  subNode.textContent=course?course.group+(courseDay(course)?' · '+courseDay(course).day+'/'+courseDay(course).total+' дахь өдөр':''):view==='home'?longDate(today())+(d&&d.day>0?' · Сургалтын '+d.day+'-р өдөр':''):'';subNode.hidden=!subNode.textContent;
  page.className='is-'+view;page.innerHTML=views[view]();bindCertificate();
  const search=$('#student-search');if(search)search.oninput=()=>{query=search.value;$('#student-course-results').innerHTML=courseResults();};
 }
 function completeLesson(id){const lesson=lessons().find(l=>l.id===id);if(!lesson)return;try{const all=object('rise-student-progress-v1');all[me.id]={...(all[me.id]||{}),[id]:{complete:true,completedAt:new Date().toISOString()}};persist('rise-student-progress-v1',all);render();toast('Хичээлийн ахиц хадгалагдлаа.');}catch{toast('Ахиц хадгалж чадсангүй.');}}
 function mediaGet(id){return new Promise((resolve,reject)=>{const r=indexedDB.open('rise-teacher-media-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onerror=()=>reject(Error('Файлын сан нээгдсэнгүй.'));r.onsuccess=()=>{const db=r.result,tx=db.transaction('files','readonly'),q=tx.objectStore('files').get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('Файл уншсангүй.'));tx.oncomplete=()=>db.close();};});}
 async function preview(id){
  const l=lessons().find(l=>l.id===id);if(!l)return;
  const own=lessons().filter(x=>x.courseId===l.courseId),following=own[own.findIndex(x=>x.id===id)+1];
  if(!open(l.title,'<p class="student-dialog-meta">'+esc(courseName(l.courseId)+' · '+(l.section||'Ерөнхий')+' · '+kind(l))+'</p>'+(l.description?'<p class="student-dialog-copy">'+esc(l.description)+'</p>':'')+'<div id="student-media"></div><div class="student-dialog-actions"></div>',true))return;
  const host=dialog.querySelector('#student-media'),actions=dialog.querySelector('.student-dialog-actions');let objectURL;
  if(following)actions.innerHTML='<button class="student-button" data-lesson="'+esc(following.id)+'">Дараагийн хичээл'+icon('next')+'</button>';
  if(l.preview&&!l.url&&!l.blobId){host.innerHTML='<div class="student-media-placeholder" style="background-image:url('+photo(courses.find(c=>c.id===l.courseId))+')"><span>'+icon(l.type==='video'?'play':'file')+'</span></div><p class="student-quiet">Багш энэ хичээлийн '+(l.type==='video'?'бичлэгийг':'материалыг')+' оруулахад энд тоглоно.</p>';return;}
  try{
   let url=l.url;
   if(l.blobId){const blob=await mediaGet(l.blobId);if(!blob)throw Error('Энэ төхөөрөмж дээр материал олдсонгүй.');objectURL=URL.createObjectURL(blob);url=objectURL;}
   else{const parsed=new URL(url);if(parsed.protocol!=='https:')throw Error('Материалын холбоос тохирохгүй байна.');}
   if(!dialog.open||!host.isConnected){if(objectURL)URL.revokeObjectURL(objectURL);return;}
   if(objectURL)cleanup.push(()=>URL.revokeObjectURL(objectURL));
   let loaded=false;
   if(l.type==='video'){const v=document.createElement('video');v.src=url;v.controls=true;v.preload='metadata';v.setAttribute('aria-label',l.title);v.onloadeddata=()=>loaded=true;v.onended=()=>{if(loaded)completeLesson(id);};v.onerror=()=>{host.insertAdjacentHTML('beforeend','<p class="student-form-error">Видео ачаалсангүй. Багшдаа мэдэгдэнэ үү.</p>');};host.append(v);}
   else{
    if(l.blobId&&(/pdf/i.test(l.mime)||/\.pdf$/i.test(l.fileName))){const f=document.createElement('iframe');f.src=url;f.title=l.title;host.append(f);}
    else if(l.blobId&&/^image\//.test(l.mime)){const img=document.createElement('img');img.src=url;img.alt=l.title;host.append(img);}
    const a=document.createElement('a');a.className='student-button student-primary';a.href=url;a.innerHTML=icon('external')+'Материал нээх';a.target='_blank';a.rel='noopener noreferrer';host.append(a);
    const done=document.createElement('button');done.className='student-button';const mark=()=>{done.innerHTML=icon('check')+'Уншиж дууссан';done.disabled=true;};
    if(records()[id]?.complete===true)mark();else{done.innerHTML=icon('check')+'Уншиж дууслаа';done.onclick=()=>{completeLesson(id);mark();};}
    actions.prepend(done);
   }
  }catch(e){host.innerHTML='<p class="student-form-error">'+esc(e.message)+'</p>';}
 }
 function payment(){
  if(!open('Төлбөр төлөх','<p class="student-dialog-copy">Төлбөр төлөх сувгаа сонгоно уу.</p><div class="student-payment-methods">'+[['qpay','QPay / QR','Банкны апп','qr'],['card','Карт','Банкны карт','card'],['loan','Зээлийн апп','Үе шаттай холбогдоно','phone']].map(([id,title,copy,n])=>'<button data-method="'+id+'" aria-pressed="false"><span class="student-tile">'+icon(n)+'</span><span><strong>'+title+'</strong><small>'+copy+'</small></span></button>').join('')+'</div><p class="student-payment-note" role="status">Төлбөрийн үйлчилгээ хараахан холбогдоогүй тул одоогоор гүйлгээ хийх боломжгүй. Төлбөр төлсөн гэж бүртгэхгүй.</p>'))return;
  dialog.querySelectorAll('[data-method]').forEach(b=>b.onclick=()=>{dialog.querySelectorAll('[data-method]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));dialog.querySelector('[role=status]').textContent=({qpay:'QPay холболт хийгдээгүй. Бодит нэхэмжлэл болон QR хараахан үүсэхгүй.',card:'Картын төлбөрийн үйлчилгээ холбогдоогүй. Картын мэдээлэл оруулах, хадгалахгүй.',loan:'Зээлийн аппуудыг дараагийн шатанд холбоно. Одоогоор зээлийн хүсэлт үүсгэхгүй.'})[b.dataset.method];});
 }
 function leave(){
  if(!open('Чөлөө хүсэх','<form>'+(courses.length>1?'<label>Сургалт<select name="courseId">'+courses.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select></label>':'<input type="hidden" name="courseId" value="'+esc(courses[0].id)+'">')+'<div class="student-form-row"><label>Эхлэх огноо<input type="date" name="start" min="'+today()+'" required></label><label>Дуусах огноо<input type="date" name="end" min="'+today()+'" required></label></div><label>Шалтгаан<textarea name="reason" maxlength="500" required></textarea></label><p role="status" class="student-form-error"></p><button class="student-button student-primary" type="submit">Хүсэлт илгээх</button></form>'))return;
  const f=dialog.querySelector('form');f.elements.start.onchange=()=>f.elements.end.min=f.elements.start.value||today();
  f.onsubmit=e=>{e.preventDefault();const courseId=f.elements.courseId.value,start=f.elements.start.value,end=f.elements.end.value,reason=f.elements.reason.value.trim();if(!M.belongs(courseId)||start<today()||end<start||!reason)return;try{const rows=array('rise-student-leave-requests-v1');if(rows.some(r=>r.studentId===me.id&&r.courseId===courseId&&r.start===start&&r.end===end&&r.status==='pending'))throw Error('Энэ хугацааны хүсэлт хүлээгдэж байна.');rows.push({id:crypto.randomUUID(),studentId:me.id,courseId,start,end,reason,status:'pending',createdAt:new Date().toISOString()});persist('rise-student-leave-requests-v1',rows);dialog.close();render();toast('Хүсэлт хадгалагдлаа. Багшийн шийдвэр хүлээж байна.');}catch(err){f.querySelector('[role=status]').textContent=err.message;}};
 }
 function notices(){
  const leaves=array('rise-student-leave-requests-v1').filter(r=>r.studentId===me.id&&M.belongs(r.courseId)&&r.status!=='pending').map(r=>({at:r.decidedAt||r.createdAt||'',html:'<div class="student-row is-top"><span><strong>Чөлөөний хүсэлт</strong><small>'+esc(shortDate(r.start)+' — '+shortDate(r.end))+'</small><small>'+esc(r.note||r.reason)+'</small></span><span class="student-tag'+(r.status==='approved'?' is-ok':' is-danger')+'">'+(r.status==='approved'?'Зөвшөөрсөн':'Татгалзсан')+'</span></div>'}));
  // Manager steps on my certificate requests.
  const certs=C.read().filter(r=>r.studentId===me.id).flatMap(r=>r.history.filter(h=>h.status!=='ordered'||h.note).filter(h=>h.status!=='payment_review').map(h=>({at:h.at,html:'<div class="student-row is-top"><span><strong>Сертификат · '+esc(C.courseNames(r))+'</strong><small>'+esc(h.note?'Буцаасан: '+h.note:C.LABEL[h.status])+'</small><small>'+esc(shortDate(h.at)+' · '+r.id)+'</small></span><span class="student-tag'+(h.note?' is-danger':' is-ok')+'">'+esc(h.note?'Буцаасан':C.LABEL[h.status])+'</span></div>'})));
  const rows=[...leaves,...certs].sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  open('Мэдэгдэл',rows.length?'<div class="student-list">'+rows.map(r=>r.html).join('')+'</div>':empty('bell','Шинэ мэдэгдэл алга','Чөлөөний шийдвэр, сертификатын явц энд харагдана.'));
 }
 const clearSession=()=>['rise-demo-name','rise-demo-level','rise-demo-new-login'].forEach(k=>sessionStorage.removeItem(k));

 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.schedDay){schedDay=b.dataset.schedDay;if(schedDay<schedStart||schedDay>=addDays(schedStart,7))schedStart=schedDay;render();page.querySelector('.student-agenda-head')?.scrollIntoView({block:'nearest'});}
  else if(b.dataset.schedWeek){schedStart=addDays(schedStart,7*Number(b.dataset.schedWeek));const items=schedule().map(s=>s.day).filter(d=>d>=schedStart&&d<addDays(schedStart,7));schedDay=items[0]||schedStart;render();}
  else if(b.dataset.nav)navigate(b.dataset.nav);
  else if(b.dataset.course)navigate('courses',b.dataset.course);
  else if(b.dataset.filter){filter=b.dataset.filter;render();}
  else if(b.dataset.lesson){if(dialog.open){cleanup.splice(0).forEach(fn=>fn());dialog.close();}preview(b.dataset.lesson);}
  else if(b.hasAttribute('data-pay'))payment();
  else if(b.hasAttribute('data-leave'))leave();
  else if(b.hasAttribute('data-logout')){clearSession();location.href='staff.html';}
 });
 $('#student-notices').innerHTML=icon('bell');$('#student-notices').onclick=notices;
 $('#student-name').textContent=me.name;$('#student-avatar').style.backgroundImage='url('+avatarUrl+')';
 backNode.innerHTML=icon('back')+'Миний сургалтууд';
 $('#student-logout').innerHTML=icon('logout');$('#student-logout').onclick=clearSession;
 addEventListener('storage',e=>{if(e.key?.startsWith('rise-')){if(dialog.open)dialog.close();render();}});
 // Large monitors: same rule as the staff pages (manager-responsive.js) — grow the 1920×1080 layout
 // proportionally; on ultrawide screens the extra width opens a third home column instead of empty margins.
 function fitScreen(){const w=innerWidth,h=innerHeight,s=w>1920&&h>1080?Math.min(2,w/1920,h/1080):1,root=document.documentElement;root.style.setProperty('--student-scale',String(s));const wide=w/s>=2200;if(root.classList.contains('is-ultrawide')!==wide){root.classList.toggle('is-ultrawide',wide);if(view==='home')render();}}addEventListener('resize',()=>requestAnimationFrame(fitScreen),{passive:true});
 fitScreen();render();
})();
