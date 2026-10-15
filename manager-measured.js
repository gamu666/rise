// The light workspace uses one navigation column and a generous content canvas.
// Existing student, goal, notification and task actions remain the source of truth.
(()=>{
 const hub=document.querySelector('.work-hub');
 const shell=document.querySelector('.os-shell');
 function fitCanvas(){const scale=Math.min(innerWidth/1081,innerHeight/709);shell.style.setProperty('--canvas-scale',scale);shell.dataset.scale=scale.toFixed(6)}
 addEventListener('resize',fitCanvas);fitCanvas();
 const labels={profile:'Нүүр',students:'Суралцагчид',goal:'Зорилго',revenue:'Орлого',ranking:'Багийн амжилт',chat:'Зурвас',notif:'Мэдэгдэл'};
 document.querySelectorAll('.framed-rail [data-hub]').forEach(b=>{if(!labels[b.dataset.hub])return;const label=document.createElement('span');label.className='nav-label';label.textContent=labels[b.dataset.hub];b.setAttribute("aria-label",labels[b.dataset.hub]);b.append(label)});
 // A true three-region application shell: navigation / workspace / tasks.
 const rail=document.querySelector('.framed-rail');
 document.querySelector('.workspace').prepend(rail);
 const account=document.createElement('div');account.className='workspace-account';
 const appearance=document.createElement('div');appearance.className='workspace-appearance';
 appearance.innerHTML='<span>Өнгөний горим</span>';
 appearance.append(document.querySelector('.theme-switch'));
 account.append(document.querySelector('.profile-wrap'),appearance); const logout=document.createElement('button');logout.className='reference-logout';logout.textContent='Системээс гарах';logout.onclick=()=>document.querySelector('#logout').click();account.append(logout);
 rail.append(account);
 const utility=document.createElement('div');utility.className='reference-utility';const search=document.createElement('button');search.textContent='⌕  Суралцагч хайх';search.onclick=()=>{workspaceSelect('students');document.querySelector('#student-search').focus()};const notices=document.createElement('button');notices.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3v-4M9 20h6"/></svg>';notices.setAttribute('aria-label','Мэдэгдэл');notices.onclick=()=>workspaceSelect('notif');utility.append(search,notices);document.querySelector('.task-viewport').prepend(utility);
 const rightSummary=document.createElement('div');rightSummary.className='reference-right-summary';document.querySelector('.task-viewport').insertBefore(rightSummary,document.querySelector('.tasks-column'));
 const oldSelect=workspaceSelect;
 workspaceSelect=function(key){oldSelect(key);hub.dataset.section=workspaceSection;if(workspaceSection==='profile')renderBrandOverview()};
 selectHub=workspaceSelect;
 const brand=document.querySelector('.framed-rail .brand');
 brand.querySelector('.brand-symbol').innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 23V9h8c8 0 8 10 0 10h-2l8 4h-7l-3-4v4zm4-8h4c3 0 3-3 0-3h-4z"/></svg>';
 const wordmark=document.createElement('span');wordmark.className='rise-wordmark';wordmark.textContent='THE RISE';brand.append(wordmark);
 const overview=document.createElement('section');overview.className='brand-overview';document.querySelector('#hub-profile').append(overview);
 function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
 function jump(key,choice){workspaceSelect(key);if(choice)workspaceOptions.querySelector('[data-choice="'+choice+'"]')?.click()}
 function renderBrandOverview(){
  overview.replaceChildren();
  rightSummary.replaceChildren();const highlight=el('button','reference-highlight');highlight.onclick=()=>jump('goal','today');highlight.append(el('small','','Өнөөдрийн зорилго'),el('strong','','Өдрийн ажлаа төлөвлөе'),el('span','','Зорилго харах →'));rightSummary.append(highlight);const month=el('button','reference-month');month.onclick=()=>jump('goal','month');const caption=el('span');caption.append(el('strong','','Сарын гүйцэтгэл'),el('small','',goals.month.current+' / '+goals.month.target+' элсэлт'));const ring=el('span','reference-ring',Math.round(goals.month.current/goals.month.target*100)+'%');ring.style.setProperty('--progress',Math.min(100,goals.month.current/goals.month.target*100)+'%');month.append(caption,ring);rightSummary.append(month);
  const paid=students.reduce((n,s)=>n+s.paid,0);
  const head=el('header','ref-head');const welcome=el('div','ref-welcome');welcome.append(el('h1','','Нүүр'),el('p','','Тавтай морил!'));head.append(welcome);
  [['Төвлөрсөн төлбөр',money(paid),'revenue'],['Суралцагч',students.length+' хүн','students']].forEach(([label,value,key])=>{const b=el('button','ref-stat');b.onclick=()=>jump(key,key==='revenue'?'all':undefined);b.append(el('strong','',value),el('small','',label));head.append(b)});overview.append(head);
  const activity=el('section','ref-activity');const ah=el('div','ref-section-head');ah.append(el('h2','','Миний орлого'));const more=el('button','brand-link','Бүгдийг харах ›');more.onclick=()=>jump('revenue','all');ah.append(more);activity.append(ah);
  const activityBody=el('div','ref-activity-body');const graph=el('div','ref-graph');const plot=el('div','brand-plot');
  const dates=[...new Set(students.map(s=>s.registered))].sort().slice(-7);const values=dates.map(d=>students.filter(s=>s.registered===d).reduce((n,s)=>n+s.paid,0));const max=Math.max(500000,Math.ceil(Math.max(0,...values)/500000)*500000);
  const axis=el('div','brand-chart-axis');[max,max*.75,max*.5,max*.25].forEach(v=>axis.append(el('span','',String(v/1000))));plot.append(axis);
  dates.forEach((d,i)=>{const col=el('div','brand-bar-column');const track=el('div','brand-bar-track');const bar=el('button','brand-bar'+(values[i]===Math.max(...values)?' is-peak':''));bar.type='button';bar.style.height=(values[i]/max*100)+'%';bar.setAttribute('aria-label',d+' · '+money(values[i]));bar.title=d+' · '+money(values[i]);bar.onclick=()=>jump('revenue','all');track.append(bar);col.append(track,el('small','',d.slice(5)));plot.append(col)});graph.append(plot,el('p','ref-chart-note','Мян. ₮ · Бүртгэлийн огноогоор · Жишээ өгөгдөл'));activityBody.append(graph);
  const goalsSide=el('div','ref-goal-list');[['Энэ 7 хоног',goals.week.current,goals.week.target,'week'],['Энэ сар',goals.month.current,goals.month.target,'month']].forEach(([name,current,target,key])=>{const b=el('button','ref-goal');b.onclick=()=>jump('goal',key);b.append(el('span','ref-goal-date',name),el('strong','',current+' / '+target+' элсэлт'),el('small','',Math.round(current/target*100)+'% биелсэн'));goalsSide.append(b)});activityBody.append(goalsSide);activity.append(activityBody);overview.append(activity);
  const people=el('section','ref-people');const ph=el('div','ref-section-head');ph.append(el('h2','','Миний суралцагчид'));const all=el('button','brand-link','Бүгдийг харах ›');all.onclick=()=>jump('students');ph.append(all);people.append(ph);const peopleRow=el('div','ref-people-row');students.slice(0,4).forEach((s,i)=>{const b=el('button','ref-person');b.onclick=()=>{selected=s.id;jump('students')};const avatar=el('span','ref-person-avatar',s.initial);avatar.style.setProperty('--person-tone',['#c5d6e3','#e4cfc3','#d4cde4','#c5d9ce'][i]);b.append(avatar,el('strong','',s.name),el('small','',s.course));peopleRow.append(b)});const add=el('button','ref-add-person','+');add.title='Суралцагч бүртгэх';add.setAttribute('aria-label','Суралцагч бүртгэх');add.onclick=()=>jump('register');peopleRow.append(add);people.append(peopleRow);overview.append(people);
  const courses=el('section','ref-courses');const ch=el('div','ref-section-head');ch.append(el('h2','','Сургалтууд'));const browse=el('button','brand-link','Бүгд ›');browse.onclick=()=>jump('students');ch.append(browse);courses.append(ch);const row=el('div','ref-course-row');const names=[...new Set(students.map(s=>s.course))].slice(0,3);names.forEach((name,i)=>{const b=el('button','ref-course');b.onclick=()=>{jump('students');const filter=document.querySelector('#student-course');filter.value=name;filter.dispatchEvent(new Event('change',{bubbles:true}))};const art=el('span','ref-course-art');art.append(el('small','',name));art.append(el('span','ref-course-symbol',['↗','✧','⌘'][i]));b.append(art,el('strong','',name),el('small','',students.filter(s=>s.course===name).length+' суралцагч'));row.append(b)});courses.append(row);overview.append(courses);
 }
 window.addEventListener('rise-data-change',()=>{if(workspaceSection==='profile')queueMicrotask(renderBrandOverview)});
 // Light is the first-visit default; previously selected appearance remains respected.
 const observer=new MutationObserver(()=>{if(workspaceSection==='profile')renderBrandOverview()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 workspaceSelect('profile');
})();
