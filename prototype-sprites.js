import { PROTOTYPE_BY_ID, animationState, directionalFrame, clamp } from './prototype-engine.js';
import { characterRig, localFootContacts } from './prototype-rig.js';
import { initializeCharacterRenderer, renderCharacterFrame, characterRendererStats, queueCharacter } from './prototype-renderer.js';
export const FRAME_SIZE=256;
const ROOT_Y=194,RASTER_SCALE=0.5,MAX_FRAMES=192,frames=new Map();
let ready=false,failed=false;
export function spritesReady(){
  if(!ready&&!failed){try{initializeCharacterRenderer();ready=true;}catch(error){failed=true;window.dispatchEvent(new CustomEvent('prototype-render-error',{detail:error.message}));}}
  return ready;
}
function poseFrame(spec,state,phase,angle,stage='',options={}){
  const rig=characterRig(spec.id,state,phase,stage,{...options,stride:spec.stride});
  return renderCharacterFrame(spec.id,rig,angle);
}
export function spriteSample(u,time=0,override=null){
  const state=override?.state||animationState(u),dir=directionalFrame(u.facing||0),angleIndex=((Math.round((u.facing||0)/(Math.PI/128))%256)+256)%256;
  let phase=0,stage='',count=['walk','run','sprint'].includes(state)?64:24;
  if(override)phase=override.phase;
  else if(['walk','run','sprint'].includes(state))phase=((u.gait%1)+1)%1;
  else if(state==='attack'||state==='cast'){
    const a=u.action;
    if(a&&!a.released){stage='windup';phase=a.elapsed/a.windup;count=32;}
    else{stage='recovery';phase=a?(a.elapsed-a.windup)/(a.duration-a.windup):0;count=32;}
  }else if(state==='death'){phase=Math.min(1,u.deathTime/0.95);count=32;}
  else if(state==='dodge'||state==='dash')phase=u.roll?u.roll.elapsed/u.roll.duration:0;
  else if(state==='hit')phase=1-u.hitTime/0.13;
  else if(state==='stagger')phase=1-u.stagger/0.46;
  else phase=time*0.65%1;
  if(override&&(state==='attack'||state==='cast')){
    if(override.stage)stage=override.stage;
    else{stage=phase<0.5?'windup':'recovery';phase=phase<0.5?phase*2:(phase-0.5)*2;}
    count=32;
  }
  const index=clamp(Math.floor(phase*count),0,count-1),foot=u.transitionFoot,weight=foot&&!override?Math.max(0,1-(time-foot.time)/0.2):0;
  const transition=weight>0&&foot.moving>0.1?{gait:foot.gait%1,weight,motion:Math.min(1,foot.moving/0.5),runBlend:foot.runBlend||0,sprintBlend:foot.sprintBlend||0}:null;
  const motion=override?1:Math.round(clamp((u.moving||0)/0.5,0,1)*8)/8;
  const runBlend=override?(['run','sprint'].includes(state)?1:0):Math.round(clamp(u.runBlend||0,0,1)*12)/12;
  const sprintBlend=override?(state==='sprint'?1:0):Math.round(clamp(u.sprintBlend||0,0,1)*12)/12;
  const acceleration=override?0:Math.round((u.acceleration||0)*8)/8;
  const feet=override?null:localFootContacts({...u,facing:angleIndex*Math.PI/128})?.map(f=>({x:Math.round(f.x*2)/2,y:Math.round(f.y*2)/2,z:Math.round(f.z*2)/2,angle:Math.round(f.angle*8)/8}));
  const movementAngle=override?0:Math.round(Math.atan2(Math.sin((u.moveFacing??u.facing)-u.facing),Math.cos((u.moveFacing??u.facing)-u.facing))*8)/8;
  const rollAngle=u.roll?Math.atan2(u.roll.dy,u.roll.dx)-(u.facing||0):state==='dodge'?Math.PI/2:0;
  const key=[u.id,state,angleIndex,stage,index,motion,runBlend,sprintBlend,acceleration,movementAngle,rollAngle,transition?transition.gait+':'+transition.weight:'',feet?JSON.stringify(feet):''].join(':');
  return {state,dir,angleIndex,index,phase:['walk','run','sprint'].includes(state)?index/count:index/(count-1),stage,transition,motion,runBlend,sprintBlend,acceleration,movementAngle,rollAngle,feet,key};
}
export function drawPrototypeSprite(c,u,x,y,time=0,scale=1,override=null){
  if(!spritesReady())return;
  const s=spriteSample(u,time,override);
  if(queueCharacter(u.id,characterRig(u.id,s.state,s.phase,s.stage,{...s,stride:PROTOTYPE_BY_ID[u.id].stride}),s.angleIndex*Math.PI/128,x,y,scale,c.getTransform()))return;
  let frame=frames.get(s.key);
  if(!frame){frame=poseFrame(PROTOTYPE_BY_ID[u.id],s.state,s.phase,s.angleIndex*Math.PI/128,s.stage,s);frames.set(s.key,frame);if(frames.size>MAX_FRAMES)frames.delete(frames.keys().next().value);}
  c.save();c.globalAlpha*=u.hp<=0?0.82:1;c.imageSmoothingEnabled=false;
  c.drawImage(frame,x-FRAME_SIZE*scale/2,y-ROOT_Y*scale,FRAME_SIZE*scale,FRAME_SIZE*scale);c.restore();
}
export function spriteCacheStats(){return {frames:frames.size,maxFrames:MAX_FRAMES,sourceReady:spritesReady(),frameSize:FRAME_SIZE,rasterScale:RASTER_SCALE,rigVersion:5,directionalArt:{columns:8,characters:5,connectedModels:5},renderer:characterRendererStats()};}
export function prototypeDirectionFrames(id,state='idle',phase=0.25){
  return Array.from({length:8},(_,dir)=>{const canvas=document.createElement('canvas');canvas.width=FRAME_SIZE;canvas.height=FRAME_SIZE;drawPrototypeSprite(canvas.getContext('2d'),{id,facing:dir*Math.PI/4,hp:1,gait:0},FRAME_SIZE/2,ROOT_Y,0,1,{state,phase});return canvas.toDataURL();});
}
export function prototypePortrait(id){
  const canvas=document.createElement('canvas');canvas.width=100;canvas.height=120;
  drawPrototypeSprite(canvas.getContext('2d'),{id,facing:Math.PI/4,hp:1,gait:0},50,119,0,0.92);return canvas.toDataURL();
}
