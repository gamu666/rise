// Keep the compact Figma density within the actual browser content area.
// A short desktop viewport must shrink the UI rather than crop a full-height canvas.
(()=>{
 let frame=0;
 function fit(){
  frame=0;
  const w=document.documentElement.clientWidth,h=window.innerHeight;
  const scale=w>760?Math.max(.7,Math.min(1,w/1433,h/950)):1;
  document.documentElement.style.setProperty('--dashboard-scale',String(scale));
  document.documentElement.style.setProperty('--dashboard-height',(h/scale)+'px');
 }
 fit();
 window.addEventListener('resize',()=>{if(!frame)frame=requestAnimationFrame(fit)},{passive:true});
})();
