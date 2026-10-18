import {paintAmbient} from './ambient-art.js';
import {UI_ART} from './ui-art-assets.js';
import {stageBackgroundLoop} from './stage-background-loop.js';

const scenes=new Map(),images=new Map();let lastFrame=-Infinity;
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries){const scene=scenes.get(e.target);if(scene)scene.visible=e.isIntersecting;}}):null;
function releaseScene(host,scene){
 observer?.unobserve(host);
 if(scene.loop)scene.loop.destroy();
 scenes.delete(host);
}
// Some browsers require a gesture even for muted playback. Retry once the
// player interacts, while leaving the authored poster visible if play fails.
if(typeof document!=='undefined'){
 const retry=()=>{for(const scene of scenes.values()){scene.playBlocked=false;scene.loop?.resetBlocked();}};
 document.addEventListener('pointerdown',retry,{passive:true});document.addEventListener('keydown',retry);
 // Animation frames stop in background tabs; pause at the visibility event.
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const scene of scenes.values())scene.loop?.pause();});
}
function source(key){if(!key)return null;if(!images.has(key)){const img=new Image();img.src=UI_ART[key];images.set(key,img);}return images.get(key);}
export function decorateAmbientBackgrounds(root=document){
 for(const [host,scene]of scenes)if(!host.isConnected)releaseScene(host,scene);
 const planet=Math.min(2,+document.body.dataset.planet||0),theme=['grove','cinder','astral'][planet];
 const definitions=[['.ambient','sky',null,.5,.45],['.header','sky',null,.5,.35],['.rewards-landscape','rewards','rewards-backdrop',.5,1],['.team-select','night',null,.5,1],['.field-world',null,null,.34,.7],['.biome-route',theme,'world-'+planet,.5,.85],['.field-world-preview',null,null,.5,1],['.encounter-art',theme,'world-'+planet,.5,.7],['.collection-banner',theme,'world-'+planet,.3,.5],['.modal:not(.reward-screen):not(.team-select)',theme,'world-'+planet,.35,.18]];
 for(const [selector,kind,key,positionY,opacity]of definitions)for(const host of root.querySelectorAll(selector)){
  // Selection patches replace inline attributes, so restore the containing
  // block even when its decoded background player/canvas is being retained.
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  if(scenes.has(host))continue;host.querySelector(':scope>.background-motion')?.remove();
  const route=host.matches('.field-world-preview')?host.style.backgroundImage:host.closest('.reference-map')?.style.getPropertyValue('--route-art')||'',routeWorld=[0,1,2].find(i=>route.includes(UI_ART['world-'+i])||i===0&&route.includes(UI_ART['stage-grasslands']));
  const i=host.matches('.field-world')?[...document.querySelectorAll('.field-world')].indexOf(host)%3:routeWorld??planet;
  if(host.matches('.rewards-landscape')||i===0&&host.matches('.biome-route')){
   const rewards=host.matches('.rewards-landscape');
   const loop=stageBackgroundLoop(host,{src:UI_ART[rewards?'rewards-valley-video':'stage-grasslands-video'],poster:UI_ART[rewards?'rewards-backdrop':'stage-grasslands']});host.classList.add('ambient-host');
   scenes.set(host,{loop,get video(){return loop.video;},visible:!observer,playPending:false,playBlocked:false});observer?.observe(host);continue;
  }
  const canvas=document.createElement('canvas');canvas.className='background-motion';canvas.setAttribute('aria-hidden','true');canvas.style.opacity=opacity;
  host.classList.add('ambient-host');host.prepend(canvas);
  const grasslands=i===0&&host.matches('.biome-route,.field-world,.field-world-preview,.encounter-art');
  scenes.set(host,{canvas,theme:grasslands?'grasslands':host.matches('.biome-route,.encounter-art,.field-world-preview')?['grove','cinder','astral'][i]:kind||['grove','cinder','astral'][i],image:source(grasslands?'stage-grasslands':host.matches('.biome-route,.encounter-art,.field-world,.field-world-preview')?'world-'+i:key),positionY,visible:!observer});observer?.observe(host);
 }
}
export function tickAmbientBackgrounds(now,{reducedMotion=false}={}){
 if(now-lastFrame<50)return;lastFrame=now;
 for(const [host,s]of scenes){
  if(!host.isConnected){releaseScene(host,s);continue;}
  if(s.video){
   const visible=s.visible&&host.getBoundingClientRect().width>0;
   if(reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden||!visible){s.loop.pause();continue;}
   if(s.video.paused&&!s.video.hidden&&!s.playPending&&!s.playBlocked){
    s.playPending=true;s.video.play().catch(error=>{if(error.name!=='AbortError')s.playBlocked=true;}).finally(()=>{s.playPending=false;});
   }
   s.loop.tick(now);
   continue;
  }
  if(reducedMotion||document.hidden){if(!s.still){s.canvas.getContext('2d').clearRect(0,0,s.canvas.width,s.canvas.height);s.still=true;}continue;}
  s.still=false;if(!s.visible)continue;
  const w=host.clientWidth,h=host.clientHeight;if(!w||!h)continue;
  const scale=Math.min(1.25,900/w,700/h),cw=Math.round(w*scale),ch=Math.round(h*scale);
  if(s.canvas.width!==cw||s.canvas.height!==ch){s.canvas.width=cw;s.canvas.height=ch;}
  const c=s.canvas.getContext('2d');c.clearRect(0,0,cw,ch);paintAmbient(c,s.theme,now/1000,{width:cw,height:ch,image:s.image,positionY:s.positionY});
 }
}
