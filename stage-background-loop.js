// Keep a decoded player moving through the wrap. A native `loop` alone can
// expose a decoder seek or the opening keyframe while the final picture waits.
export function stageBackgroundLoop(host,{src,poster}){
 const tracks=[0,1].map(i=>{const v=document.createElement('video');v.className='background-motion '+(i?'stage-background-buffer':'stage-background-video');v.setAttribute('aria-hidden','true');v.tabIndex=-1;v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.poster=poster;v.src=src;v.style.opacity=i?'0':'1';host.prepend(v);return v;});
 let active=tracks[0],incoming=tracks[1],phase='idle',fadeEnd=0,disposed=false,blocked=false;
 function promote(){active.pause();active.style.transition='none';active.style.opacity='0';incoming.style.transition='none';incoming.style.opacity='1';[active,incoming]=[incoming,active];active.classList.replace('stage-background-buffer','stage-background-video');incoming.classList.replace('stage-background-video','stage-background-buffer');active.dataset.loopHandoffs=String((Number(incoming.dataset.loopHandoffs)||0)+1);phase='idle';incoming.currentTime=0;}
 for(const v of tracks)v.addEventListener('error',()=>{for(const track of tracks){track.hidden=true;track.pause();}});
 return {
  get video(){return active;},get videos(){return tracks;},resetBlocked(){blocked=false;},
  tick(now){
   if(disposed||blocked||active.paused||active.hidden||!Number.isFinite(active.duration))return;
   if(phase==='idle'&&active.currentTime>=active.duration-.9&&incoming.readyState>=2){
    phase='warming';incoming.currentTime=0;incoming.style.transition='none';incoming.style.opacity='0';
    // Incoming stays above the outgoing image; outgoing stays fully opaque.
    // Complementary opacities would expose the poster and produce a dark dip.
    host.insertBefore(active,host.firstChild);host.insertBefore(incoming,active.nextSibling);
    incoming.play().then(()=>{if(disposed||phase!=='warming')return;phase='blending';incoming.style.transition='opacity 600ms linear';incoming.style.opacity='1';fadeEnd=performance.now()+600;}).catch(()=>{blocked=true;phase='idle';});
   // The compositor starts its transition after the style change is painted,
   // sometimes a frame later than play() resolves. Do not snap the final few
   // percent of opacity by promoting solely against the JavaScript clock.
   }else if(phase==='blending'&&now>=fadeEnd&&Number(getComputedStyle(incoming).opacity)>=.999)promote();
  },
  pause(){if(phase==='blending')promote();else if(phase==='warming'){phase='idle';incoming.pause();incoming.style.opacity='0';}for(const v of tracks)v.pause();},
  destroy(){disposed=true;for(const v of tracks){v.pause();v.removeAttribute('src');v.load();v.remove();}},
 };
}
