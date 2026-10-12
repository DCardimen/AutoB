import {pixelSpec} from './native-content.js';
import {nativePortrait,renderNativeBattle} from './native-art.js';
export function creatureImage(id,unit={}){return nativePortrait(typeof id==='object'?id:{...unit,id});}
export function drawCreature(ctx,id,x,y,size,time=0,unit={}){const portrait=creatureImage(id,unit);const img=new Image();img.src=portrait;if(img.complete)ctx.drawImage(img,x-size/2,y-size/2,size,size);}
export function renderBattle(ctx,width,height,battle,planet,time,team=[],foes=[]){
 const ids=[...team,...foes,...(battle?.units||[])].map(c=>c.id);const species=Object.fromEntries(ids.map(id=>[id,pixelSpec(id)]));
 renderNativeBattle(ctx,width,height,battle,planet,time,team,foes,species);
}
