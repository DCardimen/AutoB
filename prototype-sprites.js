import { PROTOTYPE_CHARACTERS, PROTOTYPE_BY_ID, animationState, directionalFrame, clamp } from './prototype-engine.js';
import {ragdollRig,previewRagdoll} from './prototype-dynamics.js';
import {CELL,PIVOT,PIXEL_WORLD} from './prototype-pixel-art.js';
import { characterRig, localFootContacts } from './prototype-rig.js';
import { initializeCharacterRenderer, renderCharacterFrame, characterRendererStats, queueCharacter } from './prototype-renderer.js';
export const FRAME_SIZE=CELL;
const ROOT_Y=PIVOT.y,RASTER_SCALE=1,MAX_FRAMES=192,frames=new Map();
let ready=false,failed=false;
export function spritesReady(){
  if(!ready&&!failed){try{initializeCharacterRenderer();ready=true;}catch(error){failed=true;window.dispatchEvent(new CustomEvent('prototype-render-error',{detail:error.message}));}}
  return ready;
}
function poseFrame(spec,state,phase,angle,stage='',options={}){
  const rig=characterRig(spec.id,state,phase,stage,{...options,stride:spec.stride});
  return renderCharacterFrame(spec.id,['death','knockdown','getup'].includes(state)?previewRagdoll(spec.id,phase,state==='getup'):rig,angle);
}
export function spriteSample(u,time=0,override=null){
  const state=override?.state||animationState(u),dir=directionalFrame(u.facing||0),angleIndex=dir;
  let phase=0,stage='',count=['walk','run','sprint'].includes(state)?16:12;
  if(override)phase=override.phase;
  else if(['walk','run','sprint'].includes(state))phase=((u.gait%1)+1)%1;
  else if(state==='attack'||state==='cast'){
    const a=u.action;
    if(a&&!a.released){stage='windup';phase=a.elapsed/a.windup;count=16;}
    else{stage='recovery';phase=a?(a.elapsed-a.windup)/(a.duration-a.windup):0;count=16;}
  }else if(state==='death'){phase=Math.min(1,u.deathTime/0.95);count=16;}
  else if(state==='dodge'||state==='dash')phase=u.roll?u.roll.elapsed/u.roll.duration:0;
  else if(state==='hit')phase=1-u.hitTime/0.13;
  else if(state==='stagger')phase=1-u.stagger/0.46;
  else if(state==='knockdown')phase=1-u.knockdown/0.65;
  else if(state==='getup')phase=1-u.getup/0.45;
  else if(state==='stop')phase=1-u.stopTime/0.24;
  else if(state==='turn')phase=u.turnTime>0?1-u.turnTime/0.32:time%1;
  else phase=time*0.65%1;
  if(override&&(state==='attack'||state==='cast')){
    if(override.stage)stage=override.stage;
    else{stage=phase<0.5?'windup':'recovery';phase=phase<0.5?phase*2:(phase-0.5)*2;}
    count=16;
  }
  const index=clamp(Math.floor(phase*count),0,count-1),foot=u.transitionFoot,weight=foot&&!override?Math.max(0,1-(time-foot.time)/0.2):0;
  const transition=weight>0&&foot.moving>0.1?{gait:foot.gait%1,weight,motion:Math.min(1,foot.moving/0.5),runBlend:foot.runBlend||0,sprintBlend:foot.sprintBlend||0}:null;
  const motion=override?1:Math.round(clamp((u.moving||0)/0.5,0,1)*8)/8;
  const runBlend=override?(['run','sprint'].includes(state)?1:0):Math.round(clamp(u.runBlend||0,0,1)*12)/12;
  const sprintBlend=override?(state==='sprint'?1:0):Math.round(clamp(u.sprintBlend||0,0,1)*12)/12;
  const acceleration=override?0:Math.round((u.acceleration||0)*8)/8;
  const feet=override?null:localFootContacts({...u,facing:angleIndex*Math.PI/4})?.map(f=>({x:Math.round(f.x*2)/2,y:Math.round(f.y*2)/2,z:Math.round(f.z*2)/2,angle:Math.round(f.angle*8)/8}));
  const movementAngle=override?0:Math.round(Math.atan2(Math.sin((u.moveFacing??u.facing)-u.facing),Math.cos((u.moveFacing??u.facing)-u.facing))*8)/8;
  const rollAngle=u.roll?Math.atan2(u.roll.dy,u.roll.dx)-(u.facing||0):state==='dodge'?Math.PI/2:0;
  const cape=override?null:u.cape?.map(p=>Math.round(p.angle*8)/8);
  const key=[u.id,state,angleIndex,stage,index,motion,runBlend,sprintBlend,acceleration,movementAngle,rollAngle,transition?transition.gait+':'+transition.weight:'',feet?JSON.stringify(feet):'',cape?cape.join(','):''].join(':');
  return {state,dir,angleIndex,index,phase:['walk','run','sprint'].includes(state)?index/count:index/(count-1),stage,transition,motion,runBlend,sprintBlend,acceleration,movementAngle,rollAngle,feet,cape,key};
}
export function drawPrototypeSprite(c,u,x,y,time=0,scale=1,override=null){
  if(!spritesReady())return;
  const s=spriteSample(u,time,override);
  let rig=characterRig(u.id,s.state,s.phase,s.stage,{...s,stride:PROTOTYPE_BY_ID[u.id].stride});rig.cape=s.cape;
  if(u.ragdoll&&!override)rig=ragdollRig(u.ragdoll,u.getup>0?1-u.getup/0.45:0);
  else if(override&&['death','knockdown','getup'].includes(s.state))rig=previewRagdoll(u.id,s.phase,s.state==='getup');
  if(queueCharacter(u.id,rig,s.angleIndex*Math.PI/4,x,y,scale,c.getTransform()))return;
  let frame=frames.get(s.key);
  if(!frame){frame=poseFrame(PROTOTYPE_BY_ID[u.id],s.state,s.phase,s.angleIndex*Math.PI/4,s.stage,s);frames.set(s.key,frame);if(frames.size>MAX_FRAMES)frames.delete(frames.keys().next().value);}
  c.save();c.globalAlpha*=u.hp<=0?0.82:1;c.imageSmoothingEnabled=false;
  const drawScale=scale*PIXEL_WORLD;
  c.drawImage(frame,Math.round(x-FRAME_SIZE*drawScale/2),Math.round(y-ROOT_Y*drawScale),FRAME_SIZE*drawScale,FRAME_SIZE*drawScale);c.restore();
}
export function spriteCacheStats(){return {frames:frames.size,maxFrames:MAX_FRAMES,sourceReady:spritesReady(),frameSize:FRAME_SIZE,rasterScale:RASTER_SCALE,rigVersion:6,directionalArt:{columns:8,characters:PROTOTYPE_CHARACTERS.length,nativeCell:[64,64]},renderer:characterRendererStats()};}
export function prototypeDirectionFrames(id,state='idle',phase=0.25){
  return Array.from({length:8},(_,dir)=>{const canvas=document.createElement('canvas');canvas.width=FRAME_SIZE;canvas.height=FRAME_SIZE;drawPrototypeSprite(canvas.getContext('2d'),{id,facing:dir*Math.PI/4,hp:1,gait:0},FRAME_SIZE/2,ROOT_Y,0,1/PIXEL_WORLD,{state,phase});return canvas.toDataURL();});
}
export function prototypePortrait(id){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  drawPrototypeSprite(canvas.getContext('2d'),{id,facing:Math.PI/4,hp:1,gait:0},64,88,0,2/3);return canvas.toDataURL();
}
