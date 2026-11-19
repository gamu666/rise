// Menu items that used to open small popups (Мэдэгдэл, Цаг бүртгэл, Сертификат) open as full pages
// in the central workspace, the same way Файлууд does. Pages live inside #hub-profile next to .ai-home/.file-home.
(()=>{
 const profile=document.querySelector('#hub-profile'),menu=document.querySelector('.figma-menu');
 if(!profile||!menu||typeof workspaceSelect!=='function')return;
 const pages=new Map();let current=null;
 function host(key){if(!pages.has(key)){const page=document.createElement('section');page.className='center-page';page.dataset.page=key;page.hidden=true;profile.append(page);pages.set(key,page)}return pages.get(key)}
 function hideAll(){pages.forEach(p=>p.hidden=true);current=null}
 // Any other menu choice (Нүүр, Зорилго, Файлууд…) hides the centre pages first.
 const select=workspaceSelect;workspaceSelect=function(key){hideAll();return select(key)};selectHub=workspaceSelect;
 function show(key,button){
  workspaceSelect('profile');
  profile.querySelector('.ai-home')?.setAttribute('hidden','');
  const files=profile.querySelector('.file-home');if(files)files.hidden=true;
  const page=host(key);page.hidden=false;current=key;
  menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  return page;
 }
 window.RISE_CENTER={host,show,hideAll,current:()=>current};
})();
