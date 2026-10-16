import {UI_ART} from './ui-art-assets.js';

// Authored sheets use irregular columns. Rectangles retain their original
// resolution and alpha instead of slicing off the larger rarity flourishes.
const edges=[0,323,650,999,1368,1745,2172];
const levels={Common:0,Uncommon:1,Rare:2,Epic:4,Legendary:5};
const images=new Map();
function atlas(key){
 if(typeof Image==='undefined')return null;
 if(!images.has(key)){const im=new Image();im.src=UI_ART[key];images.set(key,im);}
 return images.get(key);
}
export function auraProfile(rarity,{side=0,battle=false,elite=false}={}){
 const tier=Math.min(5,(levels[rarity]??0)+(elite?1:0));
 return {tier,row:side?1:0,opacity:(.5+tier*.065)*(battle?.2:1),radius:18+tier*1.6,flairSize:8+tier*1.6};
}
export function auraOrbit(time,{radius=24,phase=0,reducedMotion=false}={}){
 const angle=reducedMotion?Math.PI/2:time*.85+phase;
 return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.38,visible:Math.sin(angle)>1e-6,angle};
}
export function paintRarityRing(c,x,y,profile,scale=1){
 const image=atlas('aura-rings');if(!image?.complete||!image.naturalWidth)return;
 scale=Math.max(.65,scale);const {tier,row,opacity,radius}=profile,w=(radius*2+12)*scale,h=w*.53;
 c.save();c.globalAlpha*=opacity;c.imageSmoothingEnabled=true;
 c.drawImage(image,edges[tier],row*362,edges[tier+1]-edges[tier],362,x-w/2,y-h/2,w,h);c.restore();
}
export function paintRarityFlair(c,x,y,time,profile,scale=1,{phase=0,reducedMotion=false}={}){
 const image=atlas('aura-flair');if(!image?.complete||!image.naturalWidth)return;
 scale=Math.max(.65,scale);const {tier,row,opacity,radius,flairSize}=profile;
 if(!auraOrbit(time,{radius:radius*scale,phase,reducedMotion}).visible)return;
 // The central authored star/flame is an orbiting sprite. The rear half is
 // never painted, including its trail; nothing shines through the creature.
 const centers=[161,489,829,1192,1567,2030],tops=[133,105,65,20,15,0],widths=[78,92,100,110,124,136];
 const sw=widths[tier],sh=185-tops[tier],sx=centers[tier]-sw/2,sy=row*362+tops[tier];
 for(let tail=reducedMotion?0:2;tail>=0;tail--){
  const p=auraOrbit(time-tail*.075,{radius:radius*scale,phase,reducedMotion});if(!p.visible)continue;
  const w=flairSize*scale*(1-tail*.15),h=w*sh/sw;
  c.save();c.globalAlpha*=opacity*(tail?(.2-tail*.035):1);c.imageSmoothingEnabled=true;
  c.drawImage(image,sx,sy,sw,sh,x+p.x-w/2,y+p.y-h+3*scale,w,h);c.restore();
 }
}
