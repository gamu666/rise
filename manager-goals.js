// Figma 82:124. Shared tasks remain mounted when navigating.
(()=>{
 const stage=document.querySelector('.browser-stage');
 const view=document.createElement('section');view.id='hub-goals-design';view.className='hub-view goals-design';view.hidden=true;stage.append(view);
 const notch=document.createElement('button');notch.type='button';notch.className='rise-notch';notch.hidden=true;notch.setAttribute('aria-label','RISE AI — Нүүр рүү очих');
 notch.innerHTML='<span class="ai-face" aria-hidden="true"><i></i><i></i><em class="ai-alert"></em></span><span class="notch-summary">Өнөөдрийн зорилгоо хамтдаа биелүүлье.</span><span class="notch-details"><strong>RISE AI</strong><span>Асуултаа асууж, ажлаа төлөвлөхийн тулд дарна уу.</span><small>AI ажлын талбар руу →</small></span>';
 document.querySelector('.main-column').append(notch);
 notch.onclick=()=>{workspaceSelect('profile');document.querySelector('#rise-ai-prompt').focus()};
 notch.onpointermove=e=>{const r=notch.getBoundingClientRect();notch.style.setProperty('--look-x',Math.max(-3,Math.min(3,(e.clientX-r.left-r.width/2)/35))+'px');notch.style.setProperty('--look-y',Math.max(-2,Math.min(2,(e.clientY-r.top-r.height/2)/15))+'px')};
 notch.onpointerleave=()=>{notch.style.setProperty('--look-x','0px');notch.style.setProperty('--look-y','0px')};
 let reactionTimer;document.querySelector('.task-stack').addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(!['done','cancel'].includes(action))return;clearTimeout(reactionTimer);notch.dataset.reaction=action;notch.querySelector('.notch-summary').textContent=action==='done'?'Ажлын төлөв шинэчлэгдлээ. Сайн ажиллалаа!':'Ажлын төлөв шинэчлэгдлээ.';reactionTimer=setTimeout(()=>{delete notch.dataset.reaction;notch.querySelector('.notch-summary').textContent='Өнөөдрийн зорилгоо хамтдаа биелүүлье.'},2400)});
 let period='week',metric='revenue',chosen=1,all=false;
 const labels={today:'ӨНӨӨДӨР',week:'7 ХОНОГ',month:'ЭНЭ САР'},metrics={revenue:'Орлогоор харах',tasks:'Таскаар харах',students:'Сурагчдын тоогоор харах'};
 // Explicit preview fixture: source chart has no connected transaction dataset.
 const demo=[1500000,1100000,810000,885000,720000,0,0];
 const names=['Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба','Ням'];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const previewDays=Array.from({length:31},(_,i)=>{const day=i+1,weekday=(day+2)%7,amount=day>=12&&day<=18?demo[day-12]:weekday<5?demo[weekday]:0;const count=amount?[5,4,3,3,2][weekday]:0;return {day,amount,count,tasks:amount?[4,3,2,4,3][weekday]:0}});
 function buckets(){return period==='today'?[previewDays.filter(d=>d.day===16)]:period==='week'?previewDays.filter(d=>d.day>=12&&d.day<=18).map(d=>[d]):Array.from({length:5},(_,i)=>previewDays.filter(d=>Math.floor((d.day-1)/7)===i))}
 function values(){return buckets().map(ds=>ds.reduce((sum,d)=>sum+(metric==='revenue'?d.amount:metric==='tasks'?d.tasks:d.count),0))}
 function render(){
 const nums=values(),max=Math.max(...nums,1),suffix=metric==='revenue'?'₮':metric==='tasks'?'ажил':'сурагч';
 const cardDates=['10.16.2026','10.12–10.16.2026','10.01–10.31.2026'];
 view.innerHTML='<div class="goal-periods" role="group" aria-label="Зорилгын хугацаа">'+Object.keys(labels).map((p,i)=>'<button data-period="'+p+'" aria-pressed="'+(p===period)+'"><span class="goal-ring" style="--progress:'+([78,98,50][i])+'%;--ring:'+(['#00ff6a','#2f00ff','#00ff6a'][i])+'"><b>'+[78,98,50][i]+'%</b></span><span><strong>'+labels[p]+'</strong><small>'+cardDates[i]+'</small></span></button>').join('')+'</div><div class="goal-connector '+period+'"></div><div class="goal-chart-panel"><div class="goal-chart"></div><div class="goal-metrics" role="group" aria-label="Зорилгын үзүүлэлт">'+Object.keys(metrics).map(m=>'<button data-metric="'+m+'" aria-pressed="'+(m===metric)+'">'+metrics[m]+'</button>').join('')+'</div></div><div class="goal-details"><header><h2></h2><button class="goal-all">'+(all?'Сонгосон хэсэг':'Бүгдийг харах')+'</button></header><div class="goal-records"></div><p class="goal-demo">Загварын жишээ өгөгдөл · бодит тайлан холбогдоогүй</p></div>';
 const chart=view.querySelector('.goal-chart');
 const periodCards=[...view.querySelectorAll('[data-period]')];
 periodCards.forEach((card,i)=>{const ring=card.querySelector('.goal-ring');ring.style.removeProperty('--progress');ring.style.removeProperty('--ring');const base=new Image();base.src='assets/figma/goal-ring-base.svg';base.alt='';base.className='goal-ring-base';const arc=new Image();arc.src='assets/figma/goal-ring-'+['today','week','month'][i]+'.svg';arc.alt='';arc.className='goal-ring-arc';ring.prepend(base,arc)});
 function alignGoalSurface(){const active=view.querySelector('[data-period][aria-pressed="true"]'),connector=view.querySelector('.goal-connector');if(!active||view.hidden)return;const a=active.getBoundingClientRect(),v=view.getBoundingClientRect();connector.style.left=(a.left-v.left)+'px';connector.style.width=a.width+'px'}
 requestAnimationFrame(alignGoalSurface);
 if(period==='month'){
 const points=nums.map((n,i)=>[25+i*77,215-n/max*190]);
 chart.innerHTML='<svg viewBox="0 0 370 240" preserveAspectRatio="none" role="img" aria-label="Сарын үзүүлэлт долоо хоногоор"><path d="M20 5V220H365" fill="none" stroke="#bbb"/><polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#2f00ff" stroke-width="3" stroke-linejoin="round"/></svg><div class="goal-line-points">'+points.map((p,i)=>'<button data-point="'+i+'" style="left:'+(p[0]/370*100)+'%;top:'+(p[1]/240*100)+'%" aria-label="'+(i+1)+'-р долоо хоног: '+nums[i]+' '+suffix+'" aria-pressed="'+(i===chosen)+'"></button>').join('')+'</div><div class="goal-line-labels">'+nums.map((_,i)=>'<span aria-current="'+(i===chosen)+'">'+(i+1)+'-р 7 хоног</span>').join('')+'</div>';
 }else if(period==='today'){
 chart.innerHTML='<div class="goal-today"><small>ӨНӨӨДРИЙН ГҮЙЦЭТГЭЛ</small><strong>'+nums[0].toLocaleString()+' '+suffix+'</strong><div><span style="width:78%"></span></div><p>Зорилгын биелэлт 78%</p></div>';
 }else chart.innerHTML='<div class="goal-axis">'+[max,max*2/3,max/3,0].map(n=>'<span>'+(metric==='revenue'?(n===0?'0':n>=1e6?(n/1e6).toFixed(1)+'m':Math.round(n/1000)+'k'):Math.round(n))+'</span>').join('')+'</div><div class="goal-bars">'+nums.map((n,i)=>'<button data-point="'+i+'" aria-pressed="'+(chosen===i)+'" aria-label="'+names[i]+': '+n+' '+suffix+'"><span style="height:'+Math.max(23,n/max*216)+'px"></span><small>'+['Да','Мя','Лха','Пү','Ба','Бя','Ня'][i]+'</small></button>').join('')+'</div>';
 view.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;chosen=period==='week'?1:0;all=false;render()});
 view.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;render()});
 view.querySelectorAll('[data-point]').forEach(b=>b.onclick=()=>{chosen=Number(b.dataset.point);all=false;render()});
 view.querySelector('.goal-all').onclick=()=>{all=!all;render()};
 const title=period==='today'?'Өнөөдрийн':period==='month'?(chosen+1)+'-р долоо хоногийн':names[chosen]+' гарагийн';
 view.querySelector('h2').textContent=(all?labels[period]+' —':title)+' '+({revenue:'орлогын',tasks:'ажлын',students:'сурагчдын'}[metric])+' дэлгэрэнгүй';
 const rows=view.querySelector('.goal-records');
 const days=all?buckets().flat():buckets()[chosen];
 if(metric==='tasks'){
 rows.innerHTML='<div class="goal-table-head"><span>Он сар</span><span>Дууссан ажил</span></div>'+days.map(d=>'<div class="goal-task-record"><span>2026.10.'+String(d.day).padStart(2,'0')+'</span><strong>'+d.tasks+' ажил</strong></div>').join('');
 }else{
 const records=days.flatMap(d=>Array.from({length:d.count},(_,i)=>({initial:'Б',name:['Б. Бат','А. Саруул','Н. Номин','Д. Болд','О. Мишээл'][i],course:'Нягтлан',total:Math.ceil(d.amount/d.count/50000)*50000,paid:Math.floor(d.amount/d.count)+(i===0?d.amount%d.count:0),registered:'2026.10.'+String(d.day).padStart(2,'0')})));
 rows.innerHTML='<div class="goal-table-head"><span>Нэр</span><span>Сургалт</span><span>Төлбөр</span><span>Төлсөн</span><span>Он сар</span></div>'+records.map(s=>'<div class="goal-table-row"><span><i>'+esc(s.initial)+'</i>'+esc(s.name)+'</span><span>'+esc(s.course)+'</span><span>'+Number(s.total).toLocaleString()+'₮</span><strong>'+Number(s.paid).toLocaleString()+'₮</strong><span>'+esc(s.registered)+'</span></div>').join('');
 if(!records.length)rows.insertAdjacentHTML('beforeend','<p class="goal-demo">Энэ хугацаанд бүртгэл алга.</p>');
 }
 }
 const oldSelect=workspaceSelect;workspaceSelect=function(key){oldSelect(key);view.hidden=key!=='goal';notch.hidden=key!=='goal';if(key==='goal'){document.querySelectorAll('.browser-stage>.hub-view').forEach(v=>v.hidden=v!==view);render()}document.querySelectorAll('.figma-menu [data-hub]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.hub===key)))};selectHub=workspaceSelect;
 document.querySelectorAll('.figma-menu [data-hub]').forEach(b=>{if(b.dataset.hub!=='files')b.onclick=()=>workspaceSelect(b.dataset.hub)});
 window.addEventListener('rise-data-change',()=>{if(!view.hidden)render()});
 new ResizeObserver(()=>{if(view.hidden)return;const a=view.querySelector('[data-period][aria-pressed="true"]')?.getBoundingClientRect(),v=view.getBoundingClientRect(),c=view.querySelector('.goal-connector');if(a&&c){c.style.left=(a.left-v.left)+'px';c.style.width=a.width+'px'}}).observe(view);
 // Source uses three solid status dots, each 13px inside a 17px outline.
 const decorateActions=()=>document.querySelectorAll('.task-actions').forEach(actions=>{
  const order=[['cancel','red'],['more','yellow'],['done','green']];
  order.forEach(([action,color])=>{const button=actions.querySelector('[data-action="'+action+'"]');if(!button||button.dataset.figmaDot)return;button.dataset.figmaDot=color;button.innerHTML='<img class="task-dot-ring" src="assets/figma/task-action-ring.svg" alt=""><img class="task-dot-fill" src="assets/figma/task-action-'+color+'.svg" alt="">';actions.append(button)});
 });decorateActions();new MutationObserver(decorateActions).observe(document.querySelector('.task-stack'),{childList:true});
})();
