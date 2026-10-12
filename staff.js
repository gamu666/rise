if(window.RISE_CONFIG.staffLoginUrl){const real=document.querySelector('#production-login');real.href=window.RISE_CONFIG.staffLoginUrl;real.hidden=false}
document.querySelector('#demo-login').addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#staff-name').value.trim();if(!name)return;sessionStorage.setItem('rise-demo-name',name);sessionStorage.setItem('rise-demo-new-login','1');location.href='manager.html'});
const scene=document.querySelector('.character-scene');
const password=document.querySelector('#staff-password');
const visibility=document.querySelector('#password-toggle');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let gazeFrame=0;
document.addEventListener('pointermove',event=>{
 if(reducedMotion.matches||password.type==='text')return;
 cancelAnimationFrame(gazeFrame);
 gazeFrame=requestAnimationFrame(()=>{
  const bounds=scene.getBoundingClientRect();
  const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left-bounds.width/2)/400));
  const y=Math.max(-1,Math.min(1,(event.clientY-bounds.top-bounds.height/2)/350));
  scene.style.setProperty('--look-x',`${x*12}px`);
  scene.style.setProperty('--look-y',`${y*8}px`);
  scene.style.setProperty('--lean',`${-x*5}deg`);
 });
});
document.addEventListener('pointerleave',()=>{scene.style.setProperty('--look-x','0px');scene.style.setProperty('--look-y','0px');scene.style.setProperty('--lean','0deg')});
password.addEventListener('focus',()=>scene.classList.add('typing'));
password.addEventListener('blur',()=>scene.classList.remove('typing'));
visibility.addEventListener('click',()=>{
 const revealed=password.type==='password';
 password.type=revealed?'text':'password';
 scene.classList.toggle('revealed',revealed);
 visibility.setAttribute('aria-pressed',String(revealed));
 visibility.setAttribute('aria-label',revealed?'Нууц үг нуух':'Нууц үг харуулах');
});
