// Local preview adapter. All access must be enforced by an authenticated backend before real use.
((root)=>{
 const profile={id:'demo-student-0-0',name:'Э. Халиун',courses:[{id:'excavator-a',name:'Экскаватор',group:'ХММ · 10А'}]};
 const date=value=>typeof value==='string'&&/^\d{4}[-.]\d{2}[-.]\d{2}$/.test(value)?value.replaceAll('.','-'):null;
 const amount=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
 const belongs=(id,p=profile)=>p.courses.some(c=>c.id===id);
 const visibleLessons=(workspace,p=profile)=>(workspace.lessons||[]).filter(l=>l&&belongs(l.courseId,p)&&l.status==='ready');
 function completion(enrollment,now){const total=amount(enrollment?.total),paid=amount(enrollment?.paid),end=date(enrollment?.ends);return total!==null&&paid!==null&&paid>=total&&end!==null&&Number.isFinite(Date.parse(end))&&end<=now;}
 function progress(lessons,records,courseId){const own=lessons.filter(l=>l.courseId===courseId),done=own.filter(l=>records[l.id]?.complete===true).length;return {done,total:own.length,percent:own.length?Math.round(done/own.length*100):0};}
 const api={profile,date,amount,belongs,visibleLessons,completion,progress};root.RISE_STUDENT_MODEL=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
