// A short, locally synthesized income chime. No controls, downloads or service calls.
(()=>{
 const card=document.querySelector('.recent-income');if(!card)return;
 let audio=null,master=null,lastPlayed=-Infinity;
 function prepare(){
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!audio){audio=new Audio();master=audio.createGain();master.gain.value=.18;master.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}
 }
 function chime(){
  if(document.hidden||!audio||audio.state!=='running'||audio.currentTime-lastPlayed<1.5)return false;
  const start=audio.currentTime+.015;lastPlayed=audio.currentTime;
  [523.25,659.25,783.99,1046.5].forEach((frequency,i)=>{
   const at=start+i*.12;
   [[1,.22],[2,.035]].forEach(([harmonic,volume])=>{const tone=audio.createOscillator(),gain=audio.createGain();tone.type='sine';tone.frequency.value=frequency*harmonic;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.85);tone.connect(gain);gain.connect(master);tone.onended=()=>{tone.disconnect();gain.disconnect();};tone.start(at);tone.stop(at+.9);});
  });return true;
 }
 // Browsers require a real interaction before allowing audio. Priming is silent.
 const unlock=event=>{if(event.isTrusted)prepare();};document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
 window.RISE_INCOME_CHIME=chime;
})();
