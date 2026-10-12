export const BASE_CREATURE_SCALE=.5;
const sizes={aurel:1,brakk:1.3,syl:1,nyra:1,emberhound:1,rowan:.95,cogwalker:2.5,runespider:1.2,moonjelly:2,brom:.9,grit:.7,morrow:1,grum:2,tarka:1.7,nix:.9,zephyr:1.15,luma:.7,vesper:1.1,sable:1,eira:1.05,solara:2};
export function creatureTypeFactor(spec,c={}){return Math.max(.7,Math.min(4,(spec.bodySize||sizes[spec.id]||1)*(c.evolution?(c.evolution===2?1.65:1.35):1)));}
export function creatureWorldScale(spec,c={}){return BASE_CREATURE_SCALE*creatureTypeFactor(spec,c);}
export function nativeEntityBounds(spec,c,bounds){const scale=creatureWorldScale(spec,c),height=120*scale;return {...bounds,left:Math.max(bounds.left,90*scale),right:Math.min(bounds.right,1002-90*scale),top:Math.max(bounds.top,(height+25-75)/.58)};}
