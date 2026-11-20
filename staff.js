if(window.RISE_CONFIG.staffLoginUrl){const real=document.querySelector('#production-login');real.href=window.RISE_CONFIG.staffLoginUrl;real.hidden=false}
// Staff sign-in: real Supabase account. First sign-in asks for a personal password before the work app opens.
const staffForm=document.querySelector('#demo-login'),firstForm=document.querySelector('#first-password');
function showError(form,text){const box=form.querySelector('.login-error');box.textContent=text||'';box.hidden=!text;}
function busy(form,on){const b=form.querySelector('.login-submit');b.disabled=on;b.dataset.label??=b.textContent;b.textContent=on?'Түр хүлээнэ үү…':b.dataset.label;}
// Signed-in staff open their own position's dashboard (the established design); the account decides the page.
let current=null;
function openApp(p=current){const pages={0:'teacher.html',1:'manager.html',2:'senior-manager.html',3:'branch-director.html',4:'general-director.html'};sessionStorage.setItem('rise-demo-name',p.display_name);sessionStorage.setItem('rise-demo-level',String(p.level));sessionStorage.setItem('rise-demo-new-login','1');location.replace(pages[p.level]||'manager.html');}
staffForm.addEventListener('submit',async e=>{e.preventDefault();showError(staffForm,'');if(!window.RISE){showError(staffForm,'Систем ачаалагдсангүй. Хуудсаа дахин ачаална уу.');return;}busy(staffForm,true);try{const p=await RISE.signIn(staffForm.elements.name.value,document.querySelector('#staff-password').value);current=p;if(p.must_change_password){staffForm.hidden=true;firstForm.hidden=false;firstForm.querySelector('input').focus();}else openApp(p);}catch(err){showError(staffForm,err.message);}finally{busy(staffForm,false);}});
firstForm.addEventListener('submit',async e=>{e.preventDefault();showError(firstForm,'');const a=document.querySelector('#new-password').value,b=document.querySelector('#new-password-2').value;if(a!==b){showError(firstForm,'Хоёр нууц үг таарахгүй байна.');return;}busy(firstForm,true);try{await RISE.changePassword(a);openApp();}catch(err){showError(firstForm,err.message);}finally{busy(firstForm,false);}});
// Already signed in on this device: go straight to the work app.
// Same browser session still open: go back to the dashboard. After the dashboard's logout (session keys cleared) end the account session too.
addEventListener('DOMContentLoaded',async()=>{if(location.hash==='#student'||!window.RISE)return;try{const p=await RISE.profile();if(!p)return;if(sessionStorage.getItem('rise-demo-level')!==null&&!p.must_change_password)openApp(p);else await RISE.signOut();}catch{}});
// Student sign-in (preview): any code opens the single preview student profile; no credential is checked.
document.querySelector('#student-login').addEventListener('submit',e=>{e.preventDefault();if(!document.querySelector('#student-id').value.trim())return;sessionStorage.setItem('rise-demo-name','Сурагч');sessionStorage.setItem('rise-demo-level','student');sessionStorage.setItem('rise-demo-new-login','1');location.href='student.html';});
// Employee / student switch. #student in the address opens the student tab (e.g. links from the student pages).
const main=document.querySelector('.login-main'),tabs=[...document.querySelectorAll('.login-switch [role=tab]')],forms={staff:document.querySelector('#demo-login'),student:document.querySelector('#student-login')};
function setRole(role,focus){main.dataset.role=role;tabs.forEach(t=>{const on=t.dataset.role===role;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;});Object.entries(forms).forEach(([k,f])=>f.hidden=k!==role);document.querySelectorAll('[data-copy]').forEach(n=>n.hidden=n.dataset.copy!==role);password=forms[role].querySelector('input[type=password],input.is-revealed');if(scene)scene.classList.toggle('revealed',password.type==='text');document.title=(role==='student'?'Сурагчийн нэвтрэх':'Ажилтны нэвтрэх')+' — THE RISE';history.replaceState(null,'',role==='student'?'#student':location.pathname+location.search);if(focus)forms[role].querySelector('input').focus();if(typeof wake==='function')wake();}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>setRole(t.dataset.role,false));t.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const n=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];setRole(n.dataset.role,false);n.focus();});});
document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#staff-name').value=b.dataset.quick;forms.staff.requestSubmit();}));
// Large monitors: grow proportionally like the dashboards (1920×1080 base, max 2×).
function fitScreen(){const s=innerWidth>1920&&innerHeight>1080?Math.min(2,innerWidth/1920,innerHeight/1080):1;document.documentElement.style.setProperty('--login-scale',String(s));}
fitScreen();addEventListener('resize',()=>requestAnimationFrame(fitScreen),{passive:true});
const scene=document.querySelector('.character-scene');
let password=document.querySelector('#staff-password');
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
for(const input of document.querySelectorAll('.login-form input')){
 input.addEventListener('focus',()=>{scene.classList.add('attentive');if(input.closest('.password-field'))scene.classList.add('typing');const r=input.getBoundingClientRect();pointer={x:r.left+r.width*.5,y:r.top+r.height*.5};active=true;wake()});
 input.addEventListener('blur',()=>{scene.classList.remove('typing','attentive');wake()});
 input.addEventListener('input',()=>{scene.classList.remove('responding');void scene.offsetWidth;scene.classList.add('responding');wake()});
}
// Each password field has its own show/hide button; the characters look away while a password is visible.
for(const visibility of document.querySelectorAll('.password-toggle')){
 visibility.addEventListener('click',()=>{
  const field=visibility.previousElementSibling,revealed=field.type==='password';field.type=revealed?'text':'password';field.classList.toggle('is-revealed',revealed);password=field;
  scene.classList.toggle('revealed',revealed);
  visibility.setAttribute('aria-pressed',String(revealed));
  visibility.setAttribute('aria-label',revealed?'Нууц үг нуух':'Нууц үг харуулах');wake();
 });
}
// Independent blinks; suspend when the page is hidden or motion is reduced.
let blinkTimer;
function blink(){
 if(!document.hidden&&!reducedMotion.matches){const c=cast[Math.floor(Math.random()*cast.length)];c.el.classList.add('blinking');setTimeout(()=>c.el.classList.remove('blinking'),150)}
 blinkTimer=setTimeout(blink,2200+Math.random()*2200);
}
blinkTimer=setTimeout(blink,2600);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(blinkTimer);cancelAnimationFrame(frame);frame=0}else{blinkTimer=setTimeout(blink,2600);wake()}});
reducedMotion.addEventListener('change',wake);
if(location.hash==='#student')setRole('student',false);
