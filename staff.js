if(window.RISE_CONFIG.staffLoginUrl){const real=document.querySelector('#production-login');real.href=window.RISE_CONFIG.staffLoginUrl;real.hidden=false}
document.querySelector('#demo-login').addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#staff-name').value.trim();if(!name)return;const match=/^lvl([0-4])$/i.exec(name),level=match?Number(match[1]):1;const labels={0:'Багш',1:'Менежер',2:'Ахлах менежер',3:'Салбарын захирал',4:'Ерөнхий захирал'};sessionStorage.setItem('rise-demo-name',match?labels[level]:name);sessionStorage.setItem('rise-demo-new-login','1');sessionStorage.setItem('rise-demo-level',String(level));location.href=({0:'teacher.html',1:'manager.html',2:'senior-manager.html',3:'branch-director.html',4:'general-director.html'})[level]});
const scene=document.querySelector('.character-scene');
const password=document.querySelector('#staff-password');
const visibility=document.querySelector('#password-toggle');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const cast=[...scene.querySelectorAll('.character')].map((el,i)=>({el,face:el.querySelector('.face'),eyes:[...el.querySelectorAll('.eye i')],i,x:0,y:0,lean:0,vx:0,vy:0,vl:0}));
let pointer={x:innerWidth*.55,y:innerHeight*.45}, active=false, frame=0, last=0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function wake(){if(!frame)frame=requestAnimationFrame(animate)}
function animate(now){
 frame=0;const dt=Math.min(2,(now-last)/16.67||1);last=now;let moving=false;
 const bounds=scene.getBoundingClientRect();
 for(const c of cast){
  const cx=bounds.left+bounds.width*(c.i===0?.43:c.i===1?.66:c.i===2?.31:.91);
  const cy=bounds.top+bounds.height*(c.i===0?.2:c.i===1?.4:c.i===2?.8:.67);
  let dx=active?clamp((pointer.x-cx)/360,-1,1):0;
  let dy=active?clamp((pointer.y-cy)/300,-1,1):0;
  if(password.type==='text'){dx=[-.9,-1,-.6,.8][c.i];dy=[-.5,-.4,.1,-.1][c.i]}
  const tx=dx*[15,10,13,9][c.i],ty=dy*[8,7,6,5][c.i];
  const tl=-dx*[11,7,3,9][c.i]+(password.type==='text'?[8,6,-2,-4][c.i]:0);
  const stiffness=[.07,.1,.065,.085][c.i];
  for(const [key,vkey,target] of [['x','vx',tx],['y','vy',ty],['lean','vl',tl]]){
   if(reducedMotion.matches){c[key]=target;c[vkey]=0}else{c[vkey]=(c[vkey]+(target-c[key])*stiffness*dt)*Math.pow(.72,dt);c[key]+=c[vkey]*dt}
   if(Math.abs(target-c[key])>.025||Math.abs(c[vkey])>.025)moving=true;
  }
  c.el.style.transform=`skewX(${c.lean}deg) scaleY(${1-Math.abs(c.lean)*.0015})`;
  c.face.style.transform=`translate(${c.x}px,${c.y}px) rotate(${-c.lean*.22}deg)`;
  for(const eye of c.eyes)eye.style.transform=`translate(${dx*2.4}px,${dy*2.3}px)`;
  if(c.i===0)c.el.style.clipPath=password.type==='text'?'polygon(0 0,100% 0,87% 46%,100% 72%,100% 100%,0 100%,0 72%,12% 46%)':'polygon(0 0,100% 0,100% 46%,100% 72%,100% 100%,0 100%,0 72%,0 46%)';
 }
 if(moving)frame=requestAnimationFrame(animate);
}
document.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};active=true;wake()});
document.documentElement.addEventListener('pointerleave',()=>{active=false;wake()});
for(const input of document.querySelectorAll('#demo-login input')){
 input.addEventListener('focus',()=>{scene.classList.add('attentive');if(input===password)scene.classList.add('typing');const r=input.getBoundingClientRect();pointer={x:r.left+r.width*.5,y:r.top+r.height*.5};active=true;wake()});
 input.addEventListener('blur',()=>{scene.classList.remove('typing','attentive');wake()});
 input.addEventListener('input',()=>{scene.classList.remove('responding');void scene.offsetWidth;scene.classList.add('responding');wake()});
}
visibility.addEventListener('click',()=>{
 const revealed=password.type==='password';password.type=revealed?'text':'password';
 scene.classList.toggle('revealed',revealed);
 visibility.setAttribute('aria-pressed',String(revealed));
 visibility.setAttribute('aria-label',revealed?'Нууц үг нуух':'Нууц үг харуулах');wake();
});
// Independent blinks; suspend when the page is hidden or motion is reduced.
let blinkTimer;
function blink(){
 if(!document.hidden&&!reducedMotion.matches){const c=cast[Math.floor(Math.random()*cast.length)];c.el.classList.add('blinking');setTimeout(()=>c.el.classList.remove('blinking'),150)}
 blinkTimer=setTimeout(blink,2200+Math.random()*2200);
}
blinkTimer=setTimeout(blink,2600);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(blinkTimer);cancelAnimationFrame(frame);frame=0}else{blinkTimer=setTimeout(blink,2600);wake()}});
reducedMotion.addEventListener('change',wake);

