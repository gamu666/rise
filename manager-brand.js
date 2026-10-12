// The light workspace uses one navigation column and a generous content canvas.
// Existing student, goal, notification and task actions remain the source of truth.
(()=>{
 const hub=document.querySelector('.work-hub');
 const oldSelect=workspaceSelect;
 workspaceSelect=function(key){oldSelect(key);hub.dataset.section=workspaceSection;if(workspaceSection==='profile')renderBrandOverview()};
 selectHub=workspaceSelect;
 const brand=document.querySelector('.framed-rail .brand');
 const wordmark=document.createElement('span');wordmark.className='rise-wordmark';wordmark.innerHTML='<b>THE RISE</b><small>TEAM WORKSPACE</small>';brand.append(wordmark);
 const footer=document.createElement('div');footer.className='rise-rail-footer';footer.innerHTML='<span>THE RISE / АЖИЛТАН</span><small>Нэг баг. Нэг зорилго.</small>';document.querySelector('.framed-rail').append(footer);
 const overview=document.createElement('section');overview.className='brand-overview';document.querySelector('#hub-profile').append(overview);
 function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
 function jump(key,choice){workspaceSelect(key);if(choice)workspaceOptions.querySelector('[data-choice="'+choice+'"]')?.click()}
 function renderBrandOverview(){
  overview.replaceChildren();
  const header=el('header','brand-page-head');const intro=el('div');intro.append(el('span','brand-kicker','МИНИЙ ОРОН ЗАЙ'),el('h1','', 'Өнөөдрийн тойм'),el('p','','Суралцагчид, орлого, багийн ахиц — нэг дор.'));const date=el('span','brand-date',new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date()).replaceAll('-', '.'));header.append(intro,date);overview.append(header);
  const progress=el('div','brand-goals');
  const daily=Math.round(((dailyPlan.ads?1:0)+Math.min(4,dailyPlan.posts))/5*100);
  [['Өнөөдөр',daily,'Зар ба нийтлэл','today'],['Энэ 7 хоног',Math.round(goals.week.current/goals.week.target*100),goals.week.current+' / '+goals.week.target+' элсэлт','week'],['Энэ сар',Math.round(goals.month.current/goals.month.target*100),goals.month.current+' / '+goals.month.target+' элсэлт','month']].forEach(([name,percent,caption,key],i)=>{const b=el('button','brand-goal');b.type='button';b.onclick=()=>jump('goal',key);const ring=el('span','brand-ring',percent+'%');ring.style.setProperty('--progress',Math.min(100,percent)+'%');ring.style.setProperty('--ring-color',['#4b9ad5','#7664d8','#59a68b'][i]);const text=el('span');text.append(el('strong','',name),el('small','',caption));b.append(ring,text,el('span','brand-chevron','↗'));progress.append(b)});overview.append(progress);
  const paid=students.reduce((n,s)=>n+s.paid,0),remaining=students.reduce((n,s)=>n+s.total-s.paid,0);
  const chart=el('article','brand-income brand-surface');const chartHead=el('div','brand-card-head');const title=el('div');title.append(el('span','brand-kicker','ТӨВЛӨРҮҮЛСЭН ТӨЛБӨР'),el('h2','brand-total',money(paid)));const more=el('button','brand-link','Дэлгэрэнгүй ↗');more.onclick=()=>jump('revenue','all');chartHead.append(title,more);chart.append(chartHead);
  const plot=el('div','brand-plot');const latest=[...students].sort((a,b)=>b.registered.localeCompare(a.registered))[0]?.registered||'2026.10.01';const anchor=new Date(latest.replaceAll('.','-')+'T12:00:00');const months=Array.from({length:6},(_,i)=>{const d=new Date(anchor.getFullYear(),anchor.getMonth()-5+i,1);return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')});const values=months.map(m=>students.filter(s=>s.registered.startsWith(m)).reduce((n,s)=>n+s.paid,0));const max=Math.max(1,...values);months.forEach((m,i)=>{const col=el('div','brand-bar-column');col.append(el('span','brand-bar-value',values[i]>=1000000?(values[i]/1000000).toFixed(1)+' сая':values[i]>=1000?Math.round(values[i]/1000)+' мян.':'0₮'));const track=el('div','brand-bar-track');const bar=el('div','brand-bar');bar.style.height=Math.max(2,values[i]/max*100)+'%';track.append(bar);col.append(track,el('small','',m.slice(5)+' сар'));plot.append(col)});chart.append(plot,el('p','brand-chart-note',months[0]+' — '+months.at(-1)+' · Жишээ бүртгэлийн төлбөр'));overview.append(chart);
  const lower=el('div','brand-lower');const roster=el('article','brand-surface brand-recent');const rh=el('div','brand-card-head');rh.append(el('h2','','Сүүлийн бүртгэл'));const all=el('button','brand-link','Бүгд ↗');all.onclick=()=>jump('students');rh.append(all);roster.append(rh);
  [...students].sort((a,b)=>b.registered.localeCompare(a.registered)).slice(0,3).forEach(s=>{const row=el('button','brand-person');row.onclick=()=>{selected=s.id;jump('students')};const info=el('span');info.append(el('strong','',s.name),el('small','',s.course));row.append(el('span','brand-initial',s.initial),info,el('span','brand-person-date',s.registered));roster.append(row)});
  const balance=el('article','brand-surface brand-balance');balance.append(el('span','brand-kicker','ТӨЛБӨРИЙН ХЯНАЛТ'),el('h2','',money(remaining)),el('p','',students.filter(s=>s.paid<s.total).length+' суралцагч төлбөрийн үлдэгдэлтэй'));const check=el('button','brand-link','Суралцагчдыг харах ↗');check.onclick=()=>jump('students');balance.append(check,el('small','brand-award','🥉 Хүрэл медаль · Өмнөх сарын жишээ шагнал'));lower.append(roster,balance);overview.append(lower);
 }
 window.addEventListener('rise-data-change',()=>{if(workspaceSection==='profile')queueMicrotask(renderBrandOverview)});
 // Light is the first-visit default; previously selected appearance remains respected.
 const observer=new MutationObserver(()=>{if(workspaceSection==='profile')renderBrandOverview()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 workspaceSelect('profile');
})();
