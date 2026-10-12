import {PROTOTYPE_BY_ID,ANIMATION_STATES} from './prototype-engine.js';
import {characterRig} from './prototype-rig.js';
import {previewRagdoll} from './prototype-dynamics.js';
import {paintCharacterPixels,CELL} from './prototype-pixel-art.js';
export const DIRECTIONS=['e','se','s','sw','w','nw','n','ne'];
export const FRAME_COUNTS=8;
export const LOOP_STATES=['idle','walk','run','sprint','turn'];
export const FPS={idle:6,walk:10,run:14,sprint:18,turn:12,attack:12,cast:10,dash:24,dodge:24,hit:30,stagger:18,knockdown:10,getup:18,stop:24,death:10};
export function exportPixels(id,state,phase,dir){
 const spec=PROTOTYPE_BY_ID[id];let stage='',time=phase;
 if(['attack','cast'].includes(state)){const split=spec.windup/(spec.windup+spec.recovery);stage=phase<split?'windup':'recovery';time=phase<split?phase/split:(phase-split)/(1-split);}
 const rig=['death','knockdown','getup'].includes(state)?previewRagdoll(id,phase,state==='getup'):characterRig(id,state,time,stage,{stride:spec.stride});
 return paintCharacterPixels(id,rig,dir*Math.PI/4);
}
export function exportAtlas(id){
 const canvas=document.createElement('canvas'),columns=16,frames=ANIMATION_STATES.length*8*FRAME_COUNTS;canvas.width=columns*CELL;canvas.height=Math.ceil(frames/columns)*CELL;const c=canvas.getContext('2d'),animations=[],issues=[];let index=0;
 for(const state of ANIMATION_STATES)for(let dir=0;dir<8;dir++){
   const cells=[];
   for(let frame=0;frame<FRAME_COUNTS;frame++){
     const phase=frame/(LOOP_STATES.includes(state)?FRAME_COUNTS:FRAME_COUNTS-1),pixels=exportPixels(id,state,phase,dir),x=(index%columns)*CELL,y=Math.floor(index/columns)*CELL;
     if(pixels.clipped)issues.push({state,dir,frame,clipped:pixels.clipped});
     c.putImageData(new ImageData(pixels,CELL,CELL),x,y);cells.push({x,y,width:CELL,height:CELL});index++;
   }
   animations.push({name:state+'_'+DIRECTIONS[dir],state,direction:DIRECTIONS[dir],fps:FPS[state],loop:LOOP_STATES.includes(state),frames:cells});
 }
 return {image:canvas.toDataURL('image/png'),id,cell:[64,64],pivot:[32,44],width:canvas.width,height:canvas.height,animations,issues};
}
