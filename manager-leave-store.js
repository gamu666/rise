// Browser-local workflow adapter. Replace with authenticated API calls for shared staff use.
(()=>{
 const key='rise-leave-requests-v1';
 const read=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(r=>r&&typeof r.id==='string'&&typeof r.reason==='string'):[];}catch{return [];}};
 const write=rows=>{localStorage.setItem(key,JSON.stringify(rows));window.dispatchEvent(new Event('rise-leave-change'));};
 const identity=()=>({name:document.querySelector('#manager-name')?.textContent?.trim()||'Ажилтан',level:Number(window.RISE_CONFIG?.staffLevel||1),branch:window.RISE_CONFIG?.staffBranch||'Салбар 1'});
 const permitted=r=>{const me=identity();return (me.level===4&&r.level<4)||(me.level===3&&r.level<3&&r.branch===me.branch);};
 window.RISE_LEAVES={read,identity,permitted,
  submit(data){const me=identity();if(![1,2,3].includes(me.level))throw Error('Чөлөө хүсэх эрхгүй.');const days=Math.round((Date.parse(data.end+'T00:00:00Z')-Date.parse(data.start+'T00:00:00Z'))/86400000)+1;if(!Number.isFinite(days)||days<1||!data.reason.trim())throw Error('Огноо, шалтгаанаа шалгана уу.');const rows=read();if(rows.some(r=>r.name===me.name&&r.level===me.level&&r.branch===me.branch&&r.start===data.start&&r.end===data.end&&r.status==='pending'))throw Error('Энэ хугацааны хүсэлт хүлээгдэж байна.');const record={id:crypto.randomUUID(),...me,start:data.start,end:data.end,days,reason:data.reason.trim(),status:'pending',createdAt:new Date().toISOString()};write([record,...rows]);return record;},
  decide(id,status,note){const rows=read(),r=rows.find(r=>r.id===id);if(!r||!permitted(r)||r.status!=='pending')throw Error('Энэ хүсэлтийг шийдвэрлэх боломжгүй.');if(!['approved','rejected'].includes(status))throw Error('Шийдвэр буруу байна.');if(status==='rejected'&&!note.trim())throw Error('Татгалзсан шалтгаанаа бичнэ үү.');Object.assign(r,{status,note:note.trim(),decidedAt:new Date().toISOString(),decidedBy:identity().name});write(rows);},
  mine(){const me=identity();return read().filter(r=>r.name===me.name&&r.level===me.level&&r.branch===me.branch);}
 };
 addEventListener('storage',e=>{if(e.key===key)window.dispatchEvent(new Event('rise-leave-change'));});
})();

