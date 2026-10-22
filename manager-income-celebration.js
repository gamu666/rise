// Celebrate new local payment confirmations, never preview rows or page loads.
(()=>{
 const card=document.querySelector('.recent-income');if(!card)return;
 const key='rise-income-receipts',read=()=>{try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows:[];}catch{return [];}};
 const valid=r=>r&&typeof r.id==='string'&&r.id&&!r.voided&&Number.isFinite(Number(r.amount))&&Number(r.amount)>0&&Number.isFinite(Date.parse(r.recordedAt));
 const seen=new Set(read().filter(r=>r?.id).map(r=>r.id));
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let queued=false,timer=null,layer=null;
 const status=document.createElement('span');status.className='income-celebration-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');card.after(status);
 function stop(){clearTimeout(timer);layer?.remove();layer=null;card.classList.remove('income-celebrating','income-celebrating-still');}
 function celebrate(rows){
  stop();if(document.hidden)return;
  try{window.RISE_INCOME_CHIME?.();}catch{} // Audio failure must never block the receipt UI.
  const total=rows.reduce((n,r)=>n+Number(r.amount),0);status.textContent=(rows.length>1?rows.length+' шинэ орлого':'Шинэ орлого')+' · +'+new Intl.NumberFormat('mn-MN').format(total)+'₮';
  if(motion.matches){card.classList.add('income-celebrating-still');timer=setTimeout(stop,1800);return;}
  layer=document.createElement('div');layer.className='income-celebration';layer.setAttribute('aria-hidden','true');
  const sheen=document.createElement('span');sheen.className='income-celebration-sheen';layer.append(sheen);
  const colors=['#00bd68','#f6ad21','#ae78ff','#36a9e8'];
  // Three small radial bursts, confined to the existing card's clipping boundary.
  [18,51,83].forEach((x,burst)=>{const group=document.createElement('span');group.className='income-firework';group.style.setProperty('--burst-x',x+'%');group.style.setProperty('--burst-y',(burst===1?31:48)+'%');group.style.setProperty('--burst-delay',(burst*190)+'ms');
   for(let i=0;i<14;i++){const spark=document.createElement('i'),angle=(i/14)*Math.PI*2,distance=27+(i%3)*8;spark.className='income-firework-spark';spark.style.setProperty('--spark-x',Math.cos(angle)*distance+'px');spark.style.setProperty('--spark-y',Math.sin(angle)*distance+'px');spark.style.setProperty('--spark-color',colors[(i+burst)%colors.length]);spark.style.setProperty('--spark-rotation',Math.round(angle*180/Math.PI)+'deg');group.append(spark);}layer.append(group);
  });
  for(let i=0;i<12;i++){const confetti=document.createElement('i');confetti.className='income-confetti';confetti.style.setProperty('--confetti-left',(5+i*8)+'%');confetti.style.setProperty('--confetti-delay',(360+(i%4)*100)+'ms');confetti.style.setProperty('--confetti-drift',((i%2?1:-1)*(10+i%3*5))+'px');confetti.style.setProperty('--spark-color',colors[i%colors.length]);layer.append(confetti);}
  card.append(layer);card.classList.add('income-celebrating');timer=setTimeout(stop,2700);
 }
 function check(){queued=false;const fresh=[];read().forEach(r=>{if(valid(r)&&!seen.has(r.id))fresh.push(r);if(r?.id)seen.add(r.id);});if(fresh.length)celebrate(fresh);}
 function schedule(){if(queued)return;queued=true;queueMicrotask(check);}
 addEventListener('rise-data-change',event=>{if(event.detail?.key===key)schedule();});
 addEventListener('storage',event=>{if(event.key===key)schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 motion.addEventListener('change',stop);
})();
