const iconSvg=content=>`<svg viewBox="0 0 24 24" aria-hidden="true">${content}</svg>`;
document.querySelectorAll('.task-actions .more').forEach(b=>b.innerHTML=iconSvg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'));
document.querySelectorAll('.task-actions .cancel,.dialog-close').forEach(b=>b.innerHTML=iconSvg('<path d="m7 7 10 10M17 7 7 17"/>'));
document.querySelectorAll('.task-actions .done').forEach(b=>b.innerHTML=iconSvg('<path d="m5 12 4 4L19 7"/>'));
document.querySelectorAll('.check-symbol').forEach(b=>b.innerHTML=iconSvg('<circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/>'));
const themeControl=document.createElement('div');themeControl.className='theme-switch';themeControl.innerHTML='<button type="button" role="switch" aria-label="Бараан горим" aria-checked="false"><span></span></button>';document.querySelector('.profile-wrap').before(themeControl);
let theme='light';document.documentElement.dataset.theme=theme;
themeControl.addEventListener('click',()=>{theme=theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;themeControl.querySelector('button').setAttribute('aria-checked',String(theme==='dark'))});
