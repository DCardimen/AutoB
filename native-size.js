import {getTuning} from './tuning.js';
// Bodies, grips, mouths and collision volumes share this readable world scale.
export const BASE_CREATURE_SCALE=.4;
export const MIN_CREATURE_TYPE_FACTOR=.7;
export const MAX_CREATURE_TYPE_FACTOR=1.5;
const sizes={aurel:1,brakk:1.3,syl:1,nyra:1,emberhound:1,rowan:.95,cogwalker:2.5,runespider:1.2,moonjelly:2,brom:.9,grit:.7,morrow:1,grum:2,tarka:1.7,nix:.9,zephyr:1.15,luma:.7,vesper:1.1,sable:1,eira:1.05,solara:2};
export function creatureTypeFactor(spec,c={}){return Math.max(MIN_CREATURE_TYPE_FACTOR,Math.min(MAX_CREATURE_TYPE_FACTOR,(spec.bodySize||sizes[spec.id]||1)*(c.evolution?(c.evolution===2?1.65:1.35):1)));}
export function creatureWorldScale(spec,c={},tuning=getTuning()){const factor=creatureTypeFactor(spec,c),size=typeof tuning==='number'?tuning:tuning.spriteSize/100*(factor<=.9?tuning.smallSize/100:factor>=1.2?tuning.largeSize/100:1);return BASE_CREATURE_SCALE*factor*size;}
export function nativeEntityBounds(spec,c,bounds,size){const scale=creatureWorldScale(spec,c,size),height=120*scale;return {...bounds,left:bounds.left+90*scale,right:bounds.right-90*scale,top:Math.max(bounds.top,(height+25-75)/.58)};}
