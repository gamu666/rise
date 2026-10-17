// Avatar UI states report local interactions and real browser connectivity only.
(()=>{
 const notch=document.querySelector('.rise-notch'),home=document.querySelector('.ai-home');if(!notch||!home)return;
 const homeFace=document.createElement('span');homeFace.className='rise-home-face';homeFace.setAttribute('aria-hidden','true');homeFace.innerHTML='<i></i><i></i>';home.prepend(homeFace);
 const icons={reading:'<path d="M8 4c-3-2-5-2-7-1v11c2-1 4-1 7 1m0-11c3-2 5-2 7-1v11c-2-1-4-1-7 1V4Z"/>',offline:'<path d="m2 2 12 12M2 6a10 10 0 0 1 3-2m4 0a10 10 0 0 1 5 2M4 9a6 6 0 0 1 3-1m4 1 1 1M7 12l1 1 1-1"/>',loading:'<path d="M14 8a6 6 0 1 1-6-6"/>'};
 const tick='<svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7"/></svg>';
 for(const host of [notch,home]){const face=host===notch?host.querySelector('.ai-face'):homeFace;const badge=document.createElement('span');badge.className='ai-face-badge';badge.setAttribute('aria-hidden','true');face.append(badge);const activity=document.createElement('span');activity.className='ai-activity';activity.setAttribute('role','status');activity.setAttribute('aria-live','polite');host.append(activity)}
 let timer;let state='idle';
 function setState(next,label){if(!navigator.onLine)next='offline';state=next;for(const host of [notch,home]){host.dataset.aiState=next;host.querySelector('.ai-face-badge').innerHTML=next==='success'?tick:'!';const a=host.querySelector('.ai-activity');a.innerHTML=icons[next]?'<svg viewBox="0 0 16 16" aria-hidden="true">'+icons[next]+'</svg>':'';a.setAttribute('aria-label',label||({reading:'Бичвэрийг уншиж байна',offline:'Интернет холболт тасарсан',loading:'Ажиллаж байна'}[next]||''))}if(next==='offline'){notch.dataset.mood='calm';notch.querySelector('.notch-summary').textContent='Интернет холболт тасарсан.'}else if(next==='reading')notch.dataset.mood='thinking';}
 function restore(){clearTimeout(timer);setState('idle');notch.dataset.mood='idle';const section=document.querySelector('.work-hub').dataset.section;notch.querySelector('.notch-summary').textContent=section==='students'?'Сурагчдын мэдээллээ хамтдаа хяная.':'Өнөөдрийн зорилгоо хамтдаа биелүүлье.'}
 function flash(next,ms=2400){clearTimeout(timer);setState(next);timer=setTimeout(restore,ms)}
 window.addEventListener('offline',()=>setState('offline'));window.addEventListener('online',()=>{flash('success');notch.querySelector('.notch-summary').textContent='Интернет холболт сэргэлээ.'});
 const prompt=document.querySelector('#rise-ai-prompt');prompt.addEventListener('input',()=>{if(prompt.value.trim())flash('reading',900);else restore()});prompt.addEventListener('blur',()=>{if(state==='reading')restore()});
 home.querySelector('form').addEventListener('submit',()=>{flash('warning');notch.dataset.mood='calm'});
 document.querySelector('.task-stack').addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='done')flash('success');else if(action==='cancel')restore()});
 // The future service can supply its actual loading/reading lifecycle through this event.
 window.addEventListener('rise-ai-state',e=>{if(['idle','reading','loading','warning','success'].includes(e.detail?.state))setState(e.detail.state,e.detail.label)});
 let frame=0;document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||frame)return;const x=e.clientX,y=e.clientY;frame=requestAnimationFrame(()=>{frame=0;const r=homeFace.getBoundingClientRect();home.style.setProperty('--look-x',Math.max(-3,Math.min(3,(x-r.left-r.width/2)/innerWidth*8))+'px');home.style.setProperty('--look-y',Math.max(-2,Math.min(2,(y-r.top-r.height/2)/innerHeight*5))+'px')})},{passive:true});
 setState(navigator.onLine?'idle':'offline');
})();
