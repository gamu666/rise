if(window.RISE_CONFIG.staffLoginUrl){const real=document.querySelector('#production-login');real.href=window.RISE_CONFIG.staffLoginUrl;real.hidden=false}
document.querySelector('#demo-login').addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#staff-name').value.trim();if(!name)return;sessionStorage.setItem('rise-demo-name',name);location.href='manager.html'});
