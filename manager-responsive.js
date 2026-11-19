// Keep the compact Figma density within the actual browser content area.
// A short desktop viewport must shrink the UI rather than crop a full-height canvas.
(()=>{
 let frame=0;
 function fit(){
  frame=0;
  const w=document.documentElement.clientWidth,h=window.innerHeight;
  // Large monitors (QHD, 4K, 34–38" ultrawide): grow the whole 1920×1080 layout proportionally so text and
  // controls keep the same physical size instead of shrinking into the middle. Extra ultrawide width still
  // goes to the two gaps between the edge rails and the bounded workspace.
  const up=w>1920&&h>1080?Math.min(2,w/1920,h/1080):1;
  const scale=w>760?(up>1?up:Math.max(.7,Math.min(1,w/1433,h/950))):1;
  document.documentElement.style.setProperty('--dashboard-scale',String(scale));
  document.documentElement.style.setProperty('--dashboard-height',(h/scale)+'px');
 }
 fit();
 window.addEventListener('resize',()=>{if(!frame)frame=requestAnimationFrame(fit)},{passive:true});
})();
