// Figma 58:585: 1433 × 950. Icons intentionally corrected to match each destination.
(()=>{
 const rail=document.querySelector('.framed-rail');
 const glyphs={profile:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',goal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',students:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2"/>',ranking:'<path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v7M8 21h8"/>',chat:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 2v-7a8.5 8.5 0 1 1 18-3.5Z"/><path d="M8 9h8M8 13h5"/>',notif:'<path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3v-4M10 21h4"/>',files:'<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>'};
 const labels={profile:'Нүүр',goal:'Зорилго',students:'Сурагчид',ranking:'Багийн амжилт',chat:'Зурвас',notif:'Мэдэгдэл',files:'Файлууд'};
 const menu=document.createElement('div');menu.className='figma-menu';rail.append(menu);
 for(const key of Object.keys(labels)){
  let button=rail.querySelector('[data-hub="'+key+'"]');
  if(!button){button=document.createElement('button');button.dataset.hub=key;button.type='button';button.onclick=()=>{workspaceSelect('profile');document.querySelector('.ai-home').hidden=true;document.querySelector('.file-home').hidden=false;menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b===button)))};}
  const badge=button.querySelector('.hub-badge');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+glyphs[key]+'</svg><span class="nav-label">'+labels[key]+'</span>';
  if(badge)button.append(badge);
  button.setAttribute('aria-label',labels[key]);menu.append(button);
 }
 rail.querySelector('[data-hub=revenue]').hidden=true;
 const brand=rail.querySelector('.brand');brand.replaceChildren();const logo=new Image();logo.src='assets/figma/rise.png';logo.alt='THE RISE';brand.append(logo);
 const home=document.createElement('section');home.className='ai-home';home.innerHTML='<div class="ai-welcome"><h1>Тавтай морил, Тэмүүлэн!</h1><p>Өнөөдрийн ажилд тань юугаар туслах вэ?</p></div><form class="ai-composer"><label class="sr-only" for="rise-ai-prompt">RISE AI-д бичих</label><textarea id="rise-ai-prompt" rows="1" placeholder="Асуултаа асуугаарай, эсвэл хийх ажлаа бичээрэй…" required></textarea><button type="submit" aria-label="Илгээх"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form><p class="ai-status" role="status"></p>';
 document.querySelector('#hub-profile').append(home);
 home.querySelector('form').onsubmit=e=>{e.preventDefault();home.querySelector('.ai-status').textContent='AI үйлчилгээ хараахан холбогдоогүй байна. Таны бичсэн зүйл илгээгдээгүй.'};
 const files=document.createElement('section');files.className='file-home';files.hidden=true;files.innerHTML='<h1>Файлууд</h1><p>Файлын хэсгийг дараагийн шатанд холбоно.</p>';document.querySelector('#hub-profile').append(files);
 const select=workspaceSelect;workspaceSelect=function(key){select(key);home.hidden=false;files.hidden=true};selectHub=workspaceSelect;
 const tasks=document.querySelector('.tasks-column');tasks.querySelector('h2').childNodes.forEach(n=>{if(n.nodeType===3)n.textContent='Миний ажлууд '});
 const add=document.querySelector('#add-self-task');add.textContent='Шинэ ажил үүсгэх';tasks.insertBefore(add,tasks.querySelector('.task-stack'));
 const backgrounds=['purple','green','pink','blue','orange'];const decorated=new WeakSet();
 function decorate(){document.querySelectorAll('.task-card').forEach((card,index)=>{
  card.style.setProperty('--task-image','url("assets/figma/task-'+backgrounds[index%backgrounds.length]+'.jpg")');
  if(decorated.has(card))return;decorated.add(card);
  const actions=card.querySelector('.task-actions');const field=card.querySelector('.task-reply')||document.createElement('textarea');field.className='task-reply';field.rows=2;field.placeholder='Тэмдэглэл бичих…';field.setAttribute('aria-label','Ажлын тэмдэглэл');field.value=taskData[card.dataset.task]?.note||'';actions.prepend(field);
  card.addEventListener('click',e=>{if(e.target.closest('button,textarea,input,a'))return;card.querySelector('.task-expand').click()});
  actions.addEventListener('click',e=>{if(!e.target.closest('[data-action]'))return;const id=card.dataset.task;taskData[id]={...taskData[id],note:field.value};saveLocal('rise-manager-task-states',taskData)},true);
 });}
 decorate();new MutationObserver(decorate).observe(document.querySelector('.task-stack'),{childList:true});
 document.querySelector('#save-task-note').addEventListener('click',()=>{document.querySelectorAll('.task-card').forEach(card=>{const field=card.querySelector('.task-reply');if(field)field.value=taskData[card.dataset.task]?.note||''})});
})();
