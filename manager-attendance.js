// Presentation only. No attendance records, network checks or payroll data are created.
(()=>{
 const menu=document.querySelector('.figma-menu');
 const files=menu?.querySelector('[data-hub="files"]');
 if(!files)return;
 const trigger=document.createElement('button');
 trigger.type='button';trigger.id='attendance-toggle';
 trigger.setAttribute('aria-label','Цаг бүртгэл');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','attendance-popover');
 trigger.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2M8 2h8"/></svg><span class="nav-label">Цаг бүртгэл</span>';
 files.after(trigger);
 const panel=document.createElement('section');panel.id='attendance-popover';panel.setAttribute('popover','auto');panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','attendance-heading');
 panel.innerHTML=`<header class="attendance-head"><div><span class="attendance-eyebrow">МИНИЙ АЖЛЫН ЦАГ</span><h2 id="attendance-heading">Цаг бүртгэл</h2></div><button type="button" class="attendance-close" aria-label="Цаг бүртгэл хаах"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></header>
 <div class="attendance-date"></div><div class="attendance-clock"><div><span>Ирсэн цаг</span><strong>— : —</strong></div><div><span>Явсан цаг</span><strong>— : —</strong></div></div>
 <div class="attendance-actions"><button type="button" data-punch="in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v16h-6M3 12h12m-4-4 4 4-4 4"/></svg>Би ирлээ</button><button type="button" data-punch="out"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H4v16h6m1-8h10m-4-4 4 4-4 4"/></svg>Би явлаа</button></div>
 <div class="attendance-periods" role="group" aria-label="Цагийн тайлангийн хугацаа"><button type="button" data-period="day" aria-pressed="true">Өдөр</button><button type="button" data-period="week" aria-pressed="false">7 хоног</button><button type="button" data-period="month" aria-pressed="false">Сар</button></div>
 <div class="attendance-summary"><div><span>Нийт ажилласан цаг</span><strong>— <small>цаг</small></strong></div><div><span>Ирц бүртгүүлсэн өдөр</span><strong>— <small>өдөр</small></strong></div></div>
 <div class="attendance-chart" aria-label="Цаг бүртгэлийн график — мэдээлэл алга"></div>
 <div class="attendance-history"><span class="attendance-history-title">Өнөөдрийн бүртгэл</span><div class="attendance-table-head"><span>Огноо</span><span>Ирсэн</span><span>Явсан</span><span>Нийт цаг</span></div><p>Энэ хугацаанд цагийн бүртгэл алга.</p></div>`;
 document.body.append(panel);
 const labels={day:['Өнөөдрийн бүртгэл',['Ирсэн','Явсан']],week:['Энэ 7 хоногийн бүртгэл',['Да','Мя','Лх','Пү','Ба','Бя','Ня']],month:['Энэ сарын бүртгэл',['1–7','8–14','15–21','22–28','29–31']]};
 function period(key){panel.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===key)));panel.querySelector('.attendance-history-title').textContent=labels[key][0];const chart=panel.querySelector('.attendance-chart');chart.replaceChildren();labels[key][1].forEach(label=>{const item=document.createElement('div');const bar=document.createElement('i');const text=document.createElement('span');text.textContent=label;item.append(bar,text);chart.append(item)});}
 function position(){panel.style.width=Math.min(440,innerWidth-32)+'px';}
 trigger.addEventListener('click',()=>{panel.togglePopover();});
 panel.addEventListener('toggle',e=>{const open=e.newState==='open';trigger.setAttribute('aria-expanded',String(open));if(open){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ulaanbaatar',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());const date=Object.fromEntries(parts.map(p=>[p.type,p.value]));panel.querySelector('.attendance-date').textContent=`${date.year} оны ${date.month} сарын ${date.day}`;position();}});
 panel.querySelector('.attendance-close').onclick=()=>{panel.hidePopover();trigger.focus()};
 panel.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>period(b.dataset.period));
 addEventListener('resize',()=>{if(panel.matches(':popover-open'))position()});
 period('day');
})();