// Figma 58:585: 1433 × 950. Icons intentionally corrected to match each destination.
(()=>{
 // Browser translation of Figma GLASS (radius 0, refraction 1, depth 45).
 // Figma's proprietary dispersion/splay renderer has no identical CSS primitive.
 const displacement='<svg xmlns="http://www.w3.org/2000/svg" width="270" height="94"><defs><linearGradient id="x"><stop stop-color="rgb(104,128,0)"/><stop offset=".056" stop-color="rgb(128,128,0)"/><stop offset=".944" stop-color="rgb(128,128,0)"/><stop offset="1" stop-color="rgb(152,128,0)"/></linearGradient><linearGradient id="t" x2="0" y2="1"><stop stop-color="rgb(128,104,0)"/><stop offset="1" stop-color="rgb(128,128,0)"/></linearGradient><linearGradient id="b" x2="0" y2="1"><stop stop-color="rgb(128,128,0)"/><stop offset="1" stop-color="rgb(128,152,0)"/></linearGradient></defs><rect width="270" height="94" fill="url(#x)"/><path d="M15 0h240v15H15z" fill="url(#t)"/><path d="M15 79h240v15H15z" fill="url(#b)"/></svg>';
 const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');defs.setAttribute('width','0');defs.setAttribute('height','0');defs.setAttribute('aria-hidden','true');defs.style.position='absolute';defs.innerHTML='<defs><filter id="task-glass-refraction" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="data:image/svg+xml,'+encodeURIComponent(displacement)+'" width="100%" height="100%" preserveAspectRatio="none" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" scale="45" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';document.body.append(defs);
 const rail=document.querySelector('.framed-rail');
 const glyphs={"profile":"<path d=\"m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z\" fill=\"currentColor\" fill-opacity=\".12\"/><path d=\"m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z\"/>","goal":"<circle cx=\"11\" cy=\"13\" r=\"8\" fill=\"currentColor\" fill-opacity=\".12\"/><path d=\"M19 12a8 8 0 1 1-7-7\"/><path d=\"M15 3v6h6M11 13l9-9\"/><circle cx=\"11\" cy=\"13\" r=\"3\"/>","students":"<path d=\"M3 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1\" fill=\"currentColor\" fill-opacity=\".12\"/><circle cx=\"9.5\" cy=\"7\" r=\"3.5\"/><path d=\"M3 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1M17 4a3.5 3.5 0 0 1 0 7M20.5 20v-1a5 5 0 0 0-3-4.6\"/>","ranking":"<path d=\"m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z\" fill=\"currentColor\" fill-opacity=\".12\"/><path d=\"m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z\"/>","chat":"<path d=\"M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.3-4A8.5 8.5 0 1 1 21 11.5Z\" fill=\"currentColor\" fill-opacity=\".12\"/><path d=\"M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.3-4A8.5 8.5 0 1 1 21 11.5Z\"/><path d=\"M8 10h8M8 14h5\"/>","notif":"<path d=\"M5 17c1.4-1.6 2-3.3 2-6V9a5 5 0 0 1 10 0v2c0 2.7.6 4.4 2 6Z\" fill=\"currentColor\" fill-opacity=\".12\"/><path d=\"M5 17c1.4-1.6 2-3.3 2-6V9a5 5 0 0 1 10 0v2c0 2.7.6 4.4 2 6ZM10 21h4M12 2v2\"/>","files":"<path d=\"M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z\" fill=\"currentColor\" fill-opacity=\".12\"/><path d=\"M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM3 11h18\"/>"};
 const labels={profile:'Нүүр',goal:'Зорилго',students:'Сурагчид',ranking:'Багийн амжилт',chat:'Зурвас',notif:'Мэдэгдэл',files:'Файлууд'};
 const menu=document.createElement('div');menu.className='figma-menu';rail.append(menu);
 for(const key of Object.keys(labels)){
  let button=rail.querySelector('[data-hub="'+key+'"]');
  if(!button){button=document.createElement('button');button.dataset.hub=key;button.type='button';button.onclick=()=>{workspaceSelect('profile');document.querySelector('.ai-home').hidden=true;document.querySelector('.file-home').hidden=false;menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b===button)))};}
  const badge=button.querySelector('.hub-badge');
  button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="stroke-width:1.8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+glyphs[key]+'</svg><span class="nav-label">'+labels[key]+'</span>';
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
 const swipe=document.createElement('div');swipe.className='logout-swipe';swipe.innerHTML='<span class="logout-copy" aria-hidden="true"><small>СИСТЕМЭЭС</small><strong>ГАРАХ</strong></span><div class="logout-thumb" role="slider" tabindex="0" aria-label="Системээс гарахын тулд баруун тийш чирнэ үү" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Баруун тийш чирж гарна"><img class="logout-knob" src="assets/figma/logout-knob.svg" alt=""><span class="logout-arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span></div>';
 account.querySelector('.reference-logout').replaceWith(swipe);
 const thumb=swipe.querySelector('.logout-thumb');let dragging=false,startX=0,startPosition=0,dragScale=1,position=0,done=false;
 const travel=81;
 function setSwipe(x){position=Math.max(0,Math.min(travel,x));swipe.style.setProperty('--swipe-x',position+'px');swipe.style.setProperty('--swipe-progress',position/travel);document.body.style.setProperty('--logout-blur',(position/travel*28)+'px');document.body.style.setProperty('--logout-opacity',String(1-position/travel));thumb.setAttribute('aria-valuenow',String(Math.round(position/travel*100)))}
 function resetSwipe(){dragging=false;swipe.classList.remove('is-dragging');document.body.classList.remove('logout-dragging');setSwipe(0)}
 function completeSwipe(){if(done)return;done=true;setSwipe(travel);thumb.setAttribute('aria-valuetext','Системээс гарч байна');setTimeout(()=>document.querySelector('#logout').click(),180)}
 thumb.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dragging=true;startX=e.clientX;startPosition=position;dragScale=thumb.getBoundingClientRect().width/thumb.offsetWidth;document.body.classList.add('logout-dragging');thumb.setPointerCapture(e.pointerId);swipe.classList.add('is-dragging')});
 thumb.addEventListener('pointermove',e=>{if(dragging)setSwipe(startPosition+(e.clientX-startX)/dragScale)});
 thumb.addEventListener('pointerup',()=>{if(!dragging)return;if(position>=travel*.95)completeSwipe();else resetSwipe()});
 thumb.addEventListener('pointercancel',resetSwipe);thumb.addEventListener('lostpointercapture',()=>{if(!done&&dragging)resetSwipe()});
 thumb.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End','Escape','Enter',' '].includes(e.key))return;e.preventDefault();if(e.key==='Escape'||e.key==='Home')resetSwipe();else if(e.key==='ArrowRight')setSwipe(position+travel/10);else if(e.key==='ArrowLeft')setSwipe(position-travel/10);else if(e.key==='End')setSwipe(travel);else if(position>=travel*.95)completeSwipe();thumb.setAttribute('aria-valuetext',position>=travel*.95?'Enter дарж системээс гарна':'Баруун тийш чирж гарна')});
 thumb.addEventListener('blur',()=>{if(!dragging&&!done)resetSwipe()});
 const home=document.createElement('section');home.className='ai-home';home.innerHTML='<div class="ai-welcome"><h1>Тавтай морил, Тэмүүлэн!</h1><p>Өнөөдрийн ажилд тань юугаар туслах вэ?</p></div><form class="ai-composer"><label class="sr-only" for="rise-ai-prompt">RISE AI-д бичих</label><textarea id="rise-ai-prompt" rows="1" placeholder="Асуултаа асуугаарай, эсвэл хийх ажлаа бичээрэй…" required></textarea><button type="submit" aria-label="Илгээх"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form><p class="ai-status" role="status"></p>';
 document.querySelector('#hub-profile').append(home);
 const prompt=home.querySelector('textarea'),sendButton=home.querySelector('button[type=submit]');const syncSend=()=>{sendButton.disabled=!prompt.value.trim()};prompt.addEventListener('input',syncSend);syncSend();
 home.querySelector('form').onsubmit=e=>{e.preventDefault();if(!prompt.value.trim())return;home.querySelector('.ai-status').textContent='AI үйлчилгээ хараахан холбогдоогүй байна. Таны бичсэн зүйл илгээгдээгүй.'};
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
