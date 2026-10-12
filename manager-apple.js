// Motion is confined to the workspace; My Tasks is intentionally untouched.
(()=>{
 const root=document.querySelector('.work-hub'),rail=root.querySelector('.framed-rail');
 const labels={profile:'Миний орон зай',students:'Сурагчид',goal:'Зорилго',revenue:'Орлого',ranking:'Багийн амжилт',chat:'Chat',notif:'Мэдэгдэл'};
 rail.querySelectorAll('button[data-hub]').forEach(b=>{if(!labels[b.dataset.hub])return;const label=document.createElement('span');label.className='apple-nav-label';label.textContent=labels[b.dataset.hub];b.append(label)});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const lens=document.createElement('span');lens.className='apple-nav-lens';lens.setAttribute('aria-hidden','true');rail.append(lens);
 function positionLens(){const b=rail.querySelector('[data-hub][aria-selected=true]');if(!b)return;const r=b.getBoundingClientRect(),parent=rail.getBoundingClientRect();lens.style.transform=`translateY(${r.top-parent.top}px)`}
 new ResizeObserver(positionLens).observe(rail);
 new MutationObserver(positionLens).observe(rail,{subtree:true,attributes:true,attributeFilter:['aria-selected']});positionLens();
 const activeAnimations=new WeakMap();
 function reveal(el,kind='page'){
  if(!el||reduced.matches||document.hidden)return;
  activeAnimations.get(el)?.cancel();
  const frames=kind==='menu'?[{transform:'translateY(-4px) scale(.94)',opacity:.55},{transform:'translateY(1px) scale(1.008)',opacity:1,offset:.72},{transform:'none',opacity:1}]:[{transform:'translateY(9px)',opacity:.7},{transform:'none',opacity:1}];
  const anim=el.animate(frames,{duration:kind==='menu'?290:320,easing:'cubic-bezier(.22,1,.36,1)'});activeAnimations.set(el,anim);
 }
 const oldShow=workspaceShow;
 workspaceShow=function(id){const current=root.querySelector('.browser-stage>.hub-view:not([hidden])');oldShow(id);const next=document.getElementById(id);if(current!==next)reveal(next)};
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'&&!record.target.hidden&&record.target.matches('.filter-popover'))reveal(record.target,'menu');
  }
 });
 observer.observe(root,{subtree:true,attributes:true,attributeFilter:['hidden']});
 root.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;b.classList.add('apple-pressed')});
 const release=()=>root.querySelectorAll('.apple-pressed').forEach(b=>b.classList.remove('apple-pressed'));
 document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){root.querySelectorAll('.filter-popover:not([hidden])').forEach(p=>p.hidden=true)}});
 root.querySelectorAll('.browser-stage,.browser-roster #student-list').forEach(scroller=>scroller.addEventListener('scroll',()=>scroller.classList.toggle('apple-scrolled',scroller.scrollTop>4),{passive:true}));
 // A newly selected record changes in place, rather than moving the whole window.
 const oldStudents=renderStudents;let previous=selected;
 renderStudents=function(){const changed=selected!==previous;oldStudents();if(changed){previous=selected;reveal(root.querySelector('.student-hero'));reveal(root.querySelector('.student-detail'))}};
})();
