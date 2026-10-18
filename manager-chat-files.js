// Files stay on this device; message records contain only attachment metadata.
const RiseChatFiles=(()=>{
 let database;const urls=new Set();
 function open(){if(!database)database=new Promise((resolve,reject)=>{const request=indexedDB.open('rise-chat-files',1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});return database}
 async function transact(mode,operation){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode),request=operation(tx.objectStore('files'));let value;request.onsuccess=()=>{value=request.result};tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
 async function put(file){const id=crypto.randomUUID();await transact('readwrite',store=>store.put(file,id));return {id,name:file.name,type:file.type,size:file.size}}
 const get=id=>transact('readonly',store=>store.get(id));
 const remove=id=>transact('readwrite',store=>store.delete(id));
 function release(){urls.forEach(url=>URL.revokeObjectURL(url));urls.clear()}
 function node(file,onRemove){const box=document.createElement('div');box.className='chat-attachment';const link=document.createElement('a');link.className='chat-attachment-download';link.download=file.name;link.setAttribute('aria-label',file.name+' — Татах');const icon=document.createElement('span');icon.className='chat-file-icon';icon.textContent='↧';const info=document.createElement('span'),name=document.createElement('strong'),size=document.createElement('small');name.textContent=file.name;size.textContent=(file.size>=1048576?(file.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(file.size/1024))+' KB');info.append(name,size);link.append(icon,info);box.append(link);
  get(file.id).then(blob=>{if(!blob||!box.isConnected)return;const url=URL.createObjectURL(blob);urls.add(url);link.href=url;if(/^image\/(png|jpeg|gif|webp|avif|bmp)$/.test(file.type)){const img=document.createElement('img');img.src=url;img.alt=file.name;img.className='chat-attachment-image';icon.replaceWith(img)}}).catch(()=>{size.textContent='Файлыг нээх боломжгүй'});
  if(onRemove){const removeButton=document.createElement('button');removeButton.type='button';removeButton.className='chat-remove-attachment';removeButton.setAttribute('aria-label','Хавсралт хасах: '+file.name);removeButton.textContent='×';removeButton.onclick=onRemove;box.append(removeButton)}return box;
 }
 return {put,get,remove,release,node};
})();
