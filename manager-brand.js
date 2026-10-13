// The light workspace uses one navigation column and a generous content canvas.
// Existing student, goal, notification and task actions remain the source of truth.
(()=>{
 const hub=document.querySelector('.work-hub');
 // A true three-region application shell: navigation / workspace / tasks.
 const rail=document.querySelector('.framed-rail');
 document.querySelector('.workspace').prepend(rail);
 const account=document.createElement('div');account.className='workspace-account';
 const appearance=document.createElement('div');appearance.className='workspace-appearance';
 appearance.innerHTML='<span>Харагдах горим</span>';
 appearance.append(document.querySelector('.theme-switch'));
 account.append(appearance,document.querySelector('.profile-wrap'));
 rail.append(account);
 const oldSelect=workspaceSelect;
 workspaceSelect=function(key){oldSelect(key);hub.dataset.section=workspaceSection;if(workspaceSection==='profile')renderBrandOverview()};
 selectHub=workspaceSelect;
 const brand=document.querySelector('.framed-rail .brand');
 const wordmark=document.createElement('span');wordmark.className='rise-wordmark';wordmark.innerHTML='<b>THE RISE</b><small>TEAM WORKSPACE</small>';brand.append(wordmark);
 const overview=document.createElement('section');overview.className='brand-overview';document.querySelector('#hub-profile').append(overview);
 function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
 function jump(key,choice){workspaceSelect(key);if(choice)workspaceOptions.querySelector('[data-choice="'+choice+'"]')?.click()}
 function renderBrandOverview(){
  overview.replaceChildren();
  const paid=students.reduce((n,s)=>n+s.paid,0);
  const head=el('header','ref-head');const welcome=el('div','ref-welcome');welcome.append(el('h1','','Миний орон зай'),el('p','','Тавтай морил!'));head.append(welcome);
  [['Төвлөрсөн төлбөр',money(paid),'revenue'],['Суралцагч',students.length+' хүн','students']].forEach(([label,value,key])=>{const b=el('button','ref-stat');b.onclick=()=>jump(key,key==='revenue'?'all':undefined);b.append(el('strong','',value),el('small','',label));head.append(b)});overview.append(head);
  const activity=el('section','ref-activity');const ah=el('div','ref-section-head');ah.append(el('h2','','Миний орлого'));const more=el('button','brand-link','Бүгдийг харах ›');more.onclick=()=>jump('revenue','all');ah.append(more);activity.append(ah);
  const activityBody=el('div','ref-activity-body');const graph=el('div','ref-graph');const plot=el('div','brand-plot');
  const dates=[...new Set(students.map(s=>s.registered))].sort().slice(-7);const values=dates.map(d=>students.filter(s=>s.registered===d).reduce((n,s)=>n+s.paid,0));const max=Math.max(500000,Math.ceil(Math.max(0,...values)/500000)*500000);
  const axis=el('div','brand-chart-axis');[max,max*.75,max*.5,max*.25].forEach(v=>axis.append(el('span','',v>=1000000?(v/1000000).toFixed(1)+'с':Math.round(v/1000)+'м')));plot.append(axis);
  dates.forEach((d,i)=>{const col=el('div','brand-bar-column');const track=el('div','brand-bar-track');const bar=el('button','brand-bar'+(values[i]===Math.max(...values)?' is-peak':''));bar.type='button';bar.style.height=(values[i]/max*100)+'%';bar.setAttribute('aria-label',d+' · '+money(values[i]));bar.title=d+' · '+money(values[i]);bar.onclick=()=>jump('revenue','all');track.append(bar);col.append(track,el('small','',d.slice(5)));plot.append(col)});graph.append(plot,el('p','ref-chart-note','Бүртгэлийн огноогоор · Жишээ өгөгдөл'));activityBody.append(graph);
  const goalsSide=el('div','ref-goal-list');[['Энэ 7 хоног',goals.week.current,goals.week.target,'week'],['Энэ сар',goals.month.current,goals.month.target,'month']].forEach(([name,current,target,key])=>{const b=el('button','ref-goal');b.onclick=()=>jump('goal',key);b.append(el('span','ref-goal-date',name),el('strong','',current+' / '+target+' элсэлт'),el('small','',Math.round(current/target*100)+'% биелсэн'));goalsSide.append(b)});activityBody.append(goalsSide);activity.append(activityBody);overview.append(activity);
  const people=el('section','ref-people');const ph=el('div','ref-section-head');ph.append(el('h2','','Миний суралцагчид'));const all=el('button','brand-link','Бүгдийг харах ›');all.onclick=()=>jump('students');ph.append(all);people.append(ph);const peopleRow=el('div','ref-people-row');students.slice(0,4).forEach((s,i)=>{const b=el('button','ref-person');b.onclick=()=>{selected=s.id;jump('students')};const avatar=el('span','ref-person-avatar',s.initial);avatar.style.setProperty('--person-tone',['#c5d6e3','#e4cfc3','#d4cde4','#c5d9ce'][i]);b.append(avatar,el('strong','',s.name),el('small','',s.course));peopleRow.append(b)});const add=el('button','ref-add-person','+');add.title='Суралцагч бүртгэх';add.setAttribute('aria-label','Суралцагч бүртгэх');add.onclick=()=>jump('register');peopleRow.append(add);people.append(peopleRow);overview.append(people);
  const courses=el('section','ref-courses');const ch=el('div','ref-section-head');ch.append(el('h2','','Сургалтууд'));const browse=el('button','brand-link','Бүгд ›');browse.onclick=()=>jump('students');ch.append(browse);courses.append(ch);const row=el('div','ref-course-row');const names=[...new Set(students.map(s=>s.course))].slice(0,3);names.forEach((name,i)=>{const b=el('button','ref-course');b.onclick=()=>jump('students');const art=el('span','ref-course-art');art.append(el('small','',name));art.append(el('span','ref-course-symbol',['↗','✧','⌘'][i]));b.append(art,el('strong','',name),el('small','',students.filter(s=>s.course===name).length+' суралцагч'));row.append(b)});courses.append(row);overview.append(courses);
 }
 window.addEventListener('rise-data-change',()=>{if(workspaceSection==='profile')queueMicrotask(renderBrandOverview)});
 // Light is the first-visit default; previously selected appearance remains respected.
 const observer=new MutationObserver(()=>{if(workspaceSection==='profile')renderBrandOverview()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 workspaceSelect('profile');
})();
