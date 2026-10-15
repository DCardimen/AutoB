import {paintAmbient} from './ambient-art.js';
import {UI_ART} from './ui-art-assets.js';

const scenes=new Map(),images=new Map();let lastFrame=-Infinity;
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries){const scene=scenes.get(e.target);if(scene)scene.visible=e.isIntersecting;}}):null;
function source(key){if(!key)return null;if(!images.has(key)){const img=new Image();img.src=UI_ART[key];images.set(key,img);}return images.get(key);}
export function decorateAmbientBackgrounds(root=document){
 const planet=Math.min(2,+document.body.dataset.planet||0),theme=['grove','cinder','astral'][planet];
 const definitions=[['.ambient','sky',null,.5,.45],['.header','sky',null,.5,.35],['.rewards-landscape','rewards','rewards-backdrop',.5,1],['.team-select','night',null,.5,1],['.field-world',null,null,.34,.7],['.biome-route',theme,'world-'+planet,.5,.85],['.field-world-preview',null,null,.5,1],['.encounter-art',theme,'world-'+planet,.5,.7],['.collection-banner',theme,'world-'+planet,.3,.5],['.modal:not(.reward-screen):not(.team-select)',theme,'world-'+planet,.35,.18]];
 for(const [selector,kind,key,positionY,opacity]of definitions)for(const host of root.querySelectorAll(selector)){
  if(scenes.has(host))continue;host.querySelector(':scope>.background-motion')?.remove();
  const route=host.matches('.field-world-preview')?host.style.backgroundImage:host.closest('.reference-map')?.style.getPropertyValue('--route-art')||'',routeWorld=[0,1,2].find(i=>route.includes(UI_ART['world-'+i]));
  const i=host.matches('.field-world')?[...document.querySelectorAll('.field-world')].indexOf(host)%3:routeWorld??planet;
  const canvas=document.createElement('canvas');canvas.className='background-motion';canvas.setAttribute('aria-hidden','true');canvas.style.opacity=opacity;
  if(getComputedStyle(host).position==='static')host.style.position='relative';host.classList.add('ambient-host');host.prepend(canvas);
  scenes.set(host,{canvas,theme:host.matches('.biome-route,.encounter-art,.field-world-preview')?['grove','cinder','astral'][i]:kind||['grove','cinder','astral'][i],image:source(host.matches('.biome-route,.encounter-art,.field-world,.field-world-preview')?'world-'+i:key),positionY,visible:!observer});observer?.observe(host);
 }
}
export function tickAmbientBackgrounds(now,{reducedMotion=false}={}){
 if(now-lastFrame<50)return;lastFrame=now;
 for(const [host,s]of scenes){
  if(!host.isConnected){observer?.unobserve(host);scenes.delete(host);continue;}
  if(reducedMotion||document.hidden){if(!s.still){s.canvas.getContext('2d').clearRect(0,0,s.canvas.width,s.canvas.height);s.still=true;}continue;}
  s.still=false;if(!s.visible)continue;
  const w=host.clientWidth,h=host.clientHeight;if(!w||!h)continue;
  const scale=Math.min(1.25,900/w,700/h),cw=Math.round(w*scale),ch=Math.round(h*scale);
  if(s.canvas.width!==cw||s.canvas.height!==ch){s.canvas.width=cw;s.canvas.height=ch;}
  const c=s.canvas.getContext('2d');c.clearRect(0,0,cw,ch);paintAmbient(c,s.theme,now/1000,{width:cw,height:ch,image:s.image,positionY:s.positionY});
 }
}
