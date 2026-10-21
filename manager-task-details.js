// Task history uses existing cards/local records. No cross-account delivery is implied.
(()=>{
 const host=document.querySelector('.tasks-column');if(!host)return;
 const level=Number(window.RISE_CONFIG?.staffLevel||1),heading=host.querySelector('h2');
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
 const details=el('button','task-history-toggle','Дэлгэрэнгүй');details.type='button';details.setAttribute('aria-expanded','false');details.setAttribute('aria-controls','task-history-back');heading.append(details);
 const back=el('section','task-history-back');back.id='task-history-back';back.hidden=true;back.setAttribute('aria-label','Task-ийн дэлгэрэнгүй');
 const top=el('header','task-history-heading'),title=el('h2','','Task-ийн дэлгэрэнгүй'),close=el('button','task-history-return','← Буцах');close.type='button';top.append(title,close);
 const states=el('div','task-history-tabs'),periods=el('div','task-history-tabs'),list=el('div','task-history-list');states.setAttribute('role','group');states.setAttribute('aria-label','Task-ийн төлөв');periods.setAttribute('role','group');periods.setAttribute('aria-label','Task-ийн хугацаа');
 let state=level===1?'done':'active',period='day';
 const selfName=()=>document.querySelector('#manager-name')?.textContent||'Би';
 function records(){
  const stored=loadLocal('rise-manager-task-states',{}),personal=loadLocal('rise-self-tasks',[]);
  const incoming=[...host.querySelectorAll('.task-card[data-task]')].map(card=>{const id=card.dataset.task,saved=stored[id]||{},base=personal.find(t=>t.id===id)||{};return {id:'in:'+id,title:base.title||card.querySelector('h3')?.textContent,description:base.description||card.querySelector('p')?.textContent||'',sender:base.sender||(card.querySelector('.task-head small')?.textContent.trim()==='My Task'?selfName():card.querySelector('.task-head h3')?.textContent),recipient:selfName(),direction:'Хүлээн авсан',state:saved.state==='done'?'done':saved.state==='cancel'?'cancel':'active',createdAt:base.createdAt,completedAt:saved.completedAt,due:saved.due||base.due,note:saved.note};});
  let outgoing=[];try{outgoing=JSON.parse(sessionStorage.getItem('rise-demo-outgoing-lvl'+level)||'[]');}catch{}if(!Array.isArray(outgoing))outgoing=[];
  return [...incoming,...(level>1?outgoing.map(t=>({...t,id:'out:'+t.id,sender:selfName(),direction:'Илгээсэн',state:t.state==='done'||t.completedAt?'done':t.state==='cancel'?'cancel':'active'})):[])];
 }
 const dayKey=value=>{if(!value||!Number.isFinite(new Date(value).getTime()))return null;return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ulaanbaatar'}).format(new Date(value));};
 function range(){const end=dayKey(Date.now()),start=new Date(end+'T00:00:00Z');if(period==='week')start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);if(period==='month')start.setUTCDate(1);return {start:start.toISOString().slice(0,10),end};}
 function render(){
  states.replaceChildren();(level===1?[['done','Дуусгасан task-ууд']]:[['done','Дуусгасан task-ууд'],['active','Идэвхтэй task-ууд']]).forEach(([key,text])=>{const b=el('button','',text);b.type='button';b.setAttribute('aria-pressed',String(state===key));b.onclick=()=>{state=key;render();};states.append(b);});
  periods.replaceChildren();[['day','Өнөөдөр'],['week','7 хоног'],['month','Энэ сар']].forEach(([key,text])=>{const b=el('button','',text);b.type='button';b.setAttribute('aria-pressed',String(period===key));b.onclick=()=>{period=key;render();};periods.append(b);});
  const bounds=range(),rows=records().filter(r=>r.state===state).filter(r=>{const key=dayKey(state==='done'?r.completedAt:r.createdAt);return !key||key>=bounds.start&&key<=bounds.end;}).sort((a,b)=>(Date.parse(b.completedAt||b.createdAt)||0)-(Date.parse(a.completedAt||a.createdAt)||0));
  list.replaceChildren();if(!rows.length){list.append(el('p','task-history-empty','Энэ хугацаанд '+(state==='done'?'дуусгасан':'идэвхтэй')+' task алга.'));return;}
  rows.forEach(r=>{const card=el('article','task-history-record'),badge=el('span','task-history-direction',r.direction),name=el('h3','',r.title||'Task'),people=el('dl','task-history-people');[['Хэнээс',r.sender||'Бүртгэгдээгүй'],['Хэнд',r.recipient||'Бүртгэгдээгүй']].forEach(([label,value])=>{people.append(el('dt','',label),el('dd','',value));});card.append(badge,name,people,el('p','',r.description));if(r.due)card.append(el('small','','Дуусгах: '+r.due));const date=dayKey(state==='done'?r.completedAt:r.createdAt);card.append(el('small','',date?(state==='done'?'Дууссан: ':'Үүсгэсэн: ')+date:'Огноо бүртгэгдээгүй'));if(r.note)card.append(el('p','task-history-note',r.note));list.append(card);});
 }
 function flip(open){host.classList.toggle('task-history-open',open);back.hidden=!open;details.setAttribute('aria-expanded',String(open));[...host.children].filter(n=>n!==back).forEach(n=>{n.inert=open;});if(open){render();close.focus();}else details.focus();}
 details.onclick=()=>flip(true);close.onclick=()=>flip(false);back.addEventListener('keydown',e=>{if(e.key==='Escape')flip(false);});
 back.append(top,states,periods,list);host.append(back);addEventListener('rise-data-change',()=>{if(!back.hidden)render();});addEventListener('storage',()=>{if(!back.hidden)render();});
})();
