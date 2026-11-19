// Period rings: keep the drawn arc equal to the percentage printed inside each ring (manager-goals.js writes the text).
(()=>{
 const sync=()=>document.querySelectorAll('.goal-periods .goal-ring').forEach(ring=>{const m=/(-?\d+(?:\.\d+)?)\s*%/.exec(ring.textContent||'');const v=m?Math.max(0,Math.min(100,Number(m[1]))):0;if(ring.style.getPropertyValue('--pct')!==String(v))ring.style.setProperty('--pct',String(v));});
 let queued=0;new MutationObserver(()=>{if(!queued)queued=requestAnimationFrame(()=>{queued=0;sync();});}).observe(document.body,{childList:true,subtree:true,characterData:true});
 sync();
})();