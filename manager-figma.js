// Figma 58:585: 1433 × 950. Icons intentionally corrected to match each destination.
(()=>{
 // Browser translation of Figma GLASS (radius 0, refraction 1, depth 45).
 // Figma's proprietary dispersion/splay renderer has no identical CSS primitive.
 const displacement='<svg xmlns="http://www.w3.org/2000/svg" width="270" height="94"><defs><linearGradient id="x"><stop stop-color="rgb(104,128,0)"/><stop offset=".056" stop-color="rgb(128,128,0)"/><stop offset=".944" stop-color="rgb(128,128,0)"/><stop offset="1" stop-color="rgb(152,128,0)"/></linearGradient><linearGradient id="t" x2="0" y2="1"><stop stop-color="rgb(128,104,0)"/><stop offset="1" stop-color="rgb(128,128,0)"/></linearGradient><linearGradient id="b" x2="0" y2="1"><stop stop-color="rgb(128,128,0)"/><stop offset="1" stop-color="rgb(128,152,0)"/></linearGradient></defs><rect width="270" height="94" fill="url(#x)"/><path d="M15 0h240v15H15z" fill="url(#t)"/><path d="M15 79h240v15H15z" fill="url(#b)"/></svg>';
 const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');defs.setAttribute('width','0');defs.setAttribute('height','0');defs.setAttribute('aria-hidden','true');defs.style.position='absolute';defs.innerHTML='<defs><filter id="task-glass-refraction" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="data:image/svg+xml,'+encodeURIComponent(displacement)+'" width="100%" height="100%" preserveAspectRatio="none" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" scale="45" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';document.body.append(defs);
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
 // Source dividers (55:417 / 55:451), not extra panel borders.
 for(const name of ['top','bottom']){const line=document.createElement('span');line.className='sidebar-rule sidebar-rule-'+name;line.setAttribute('aria-hidden','true');rail.append(line)}
 const account=document.querySelector('.workspace-account');
 const profileButton=account.querySelector('.profile');
 const role=profileButton.querySelector('small');role.textContent='Сургалтын Менежер';role.parentElement.prepend(role);
 if(!loadLocal('rise-profile-photo',null))profileButton.querySelector('img').src='assets/figma/profile-avatar.png';
 const online=document.createElement('span');online.className='profile-online';online.setAttribute('aria-hidden','true');profileButton.append(online);
 document.querySelector('.profile-menu').append(account.querySelector('.workspace-appearance'));
 const swipe=document.createElement('div');swipe.className='logout-swipe';swipe.innerHTML='<span class="logout-copy" aria-hidden="true"><small>СИСТЕМЭЭС</small><strong>ГАРАХ</strong></span><div class="logout-thumb" role="slider" tabindex="0" aria-label="Системээс гарахын тулд баруун тийш чирнэ үү" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Баруун тийш чирж гарна"><img class="logout-knob" src="assets/figma/logout-knob.svg" alt=""><span class="logout-arrow"><img class="arrow-shaft" src="assets/figma/logout-arrow-shaft.svg" alt=""><img class="arrow-upper" src="assets/figma/logout-arrow-upper.svg" alt=""><img class="arrow-lower" src="assets/figma/logout-arrow-lower.svg" alt=""></span></div>';
 account.querySelector('.reference-logout').replaceWith(swipe);
 const thumb=swipe.querySelector('.logout-thumb');let dragging=false,startX=0,position=0,done=false;
 const travel=81;
 function setSwipe(x){position=Math.max(0,Math.min(travel,x));swipe.style.setProperty('--swipe-x',position+'px');swipe.style.setProperty('--swipe-progress',position/travel);thumb.setAttribute('aria-valuenow',String(Math.round(position/travel*100)))}
 function resetSwipe(){dragging=false;swipe.classList.remove('is-dragging');setSwipe(0)}
 function completeSwipe(){if(done)return;done=true;setSwipe(travel);thumb.setAttribute('aria-valuetext','Системээс гарч байна');document.querySelector('#logout').click()}
 thumb.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dragging=true;startX=e.clientX-position;thumb.setPointerCapture(e.pointerId);swipe.classList.add('is-dragging')});
 thumb.addEventListener('pointermove',e=>{if(dragging)setSwipe(e.clientX-startX)});
 thumb.addEventListener('pointerup',()=>{if(!dragging)return;if(position>=travel*.95)completeSwipe();else resetSwipe()});
 thumb.addEventListener('pointercancel',resetSwipe);thumb.addEventListener('lostpointercapture',()=>{if(!done&&dragging)resetSwipe()});
 thumb.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End','Escape','Enter',' '].includes(e.key))return;e.preventDefault();if(e.key==='Escape'||e.key==='Home')resetSwipe();else if(e.key==='ArrowRight')setSwipe(position+travel/10);else if(e.key==='ArrowLeft')setSwipe(position-travel/10);else if(e.key==='End')setSwipe(travel);else if(position>=travel*.95)completeSwipe();thumb.setAttribute('aria-valuetext',position>=travel*.95?'Enter дарж системээс гарна':'Баруун тийш чирж гарна')});
 thumb.addEventListener('blur',()=>{if(!dragging&&!done)resetSwipe()});
 const home=document.createElement('section');home.className='ai-home';home.innerHTML='<div class="ai-welcome"><h1>Тавтай морил, Тэмүүлэн!</h1><p>Өнөөдрийн ажилд тань юугаар туслах вэ?</p></div><form class="ai-composer"><label class="sr-only" for="rise-ai-prompt">RISE AI-д бичих</label><textarea id="rise-ai-prompt" rows="1" placeholder="Асуултаа асуугаарай, эсвэл хийх ажлаа бичээрэй…" required></textarea><button type="submit" aria-label="Илгээх"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form><p class="ai-status" role="status"></p>';
 document.querySelector('#hub-profile').append(home);
 home.querySelector('form').onsubmit=e=>{e.preventDefault();home.querySelector('.ai-status').textContent='AI үйлчилгээ хараахан холбогдоогүй байна. Таны бичсэн зүйл илгээгдээгүй.'};
 const files=document.createElement('section');files.className='file-home';files.hidden=true;files.innerHTML='<h1>Файлууд</h1><p>Файлын хэсгийг дараагийн шатанд холбоно.</p>';document.querySelector('#hub-profile').append(files);
 const select=workspaceSelect;workspaceSelect=function(key){select(key);home.hidden=false;files.hidden=true};selectHub=workspaceSelect;
 const tasks=document.querySelector('.tasks-column');tasks.querySelector('h2').childNodes.forEach(n=>{if(n.nodeType===3)n.textContent='Миний ажлууд '});
 tasks.querySelector('.task-monocle').src='assets/figma/monocle.png';
 const add=document.querySelector('#add-self-task');add.textContent='Шинэ ажил үүсгэх';tasks.insertBefore(add,tasks.querySelector('.task-stack'));
 const stack=document.querySelector('.task-stack');
 // The first three demo records occupy the three slots shown in the source.
 ['call','test','poster'].forEach(id=>{const card=stack.querySelector('[data-task="'+id+'"]');if(card)stack.prepend(card)});
 const callAvatar=stack.querySelector('[data-task=call] .check-symbol');if(callAvatar){callAvatar.classList.add('avatar');callAvatar.innerHTML='<img src="assets/figma/call-avatar.png" alt="">'}
 const backgrounds=['purple','green','pink','blue','orange'];const decorated=new WeakSet();
 const demoAges={poster:2*3600000,test:4*3600000,call:86400000};
 const demoEpoch=Number(sessionStorage.getItem('rise-task-demo-epoch'))||Date.now();sessionStorage.setItem('rise-task-demo-epoch',String(demoEpoch));
 function updateTimes(){stack.querySelectorAll('.task-card').forEach(card=>{const time=card.querySelector('time');if(!time)return;const saved=selfTasks.find(t=>t.id===card.dataset.task);const created=saved?.createdAt||(card.dataset.task.startsWith('self-')?Number(card.dataset.task.slice(5)):demoEpoch-(demoAges[card.dataset.task]||86400000));const age=Math.max(0,Date.now()-created);time.dateTime=new Date(created).toISOString();time.textContent=age<60000?'Саяхан':age<3600000?Math.floor(age/60000)+'м өмнө':age<86400000?Math.floor(age/3600000)+'ц өмнө':Math.floor(age/86400000)+'ө өмнө';time.title=new Intl.DateTimeFormat('mn-MN',{timeZone:'Asia/Ulaanbaatar',dateStyle:'medium',timeStyle:'short'}).format(new Date(created))})}
 function decorate(){document.querySelectorAll('.task-card').forEach((card,index)=>{
  card.style.setProperty('--task-image','url("assets/figma/task-'+backgrounds[index%backgrounds.length]+'.jpg")');
  card.dataset.tone=backgrounds[index%backgrounds.length];
  if(decorated.has(card))return;decorated.add(card);
  const actions=card.querySelector('.task-actions');const field=card.querySelector('.task-reply')||document.createElement('textarea');field.className='task-reply';field.rows=1;field.placeholder='Тайлбар бичих...';field.setAttribute('aria-label','Ажлын тэмдэглэл');field.value=taskData[card.dataset.task]?.note||'';actions.prepend(field);
  card.addEventListener('click',e=>{if(e.target.closest('button,textarea,input,a'))return;card.querySelector('.task-expand').click()});
  actions.addEventListener('click',e=>{if(!e.target.closest('[data-action]'))return;const id=card.dataset.task;taskData[id]={...taskData[id],note:field.value};saveLocal('rise-manager-task-states',taskData)},true);
 });updateTimes();}
 decorate();new MutationObserver(decorate).observe(document.querySelector('.task-stack'),{childList:true});
 setInterval(updateTimes,60000);
 document.querySelector('#save-task-note').addEventListener('click',()=>{document.querySelectorAll('.task-card').forEach(card=>{const field=card.querySelector('.task-reply');if(field)field.value=taskData[card.dataset.task]?.note||''})});
})();
