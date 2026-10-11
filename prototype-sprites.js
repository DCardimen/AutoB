import { PROTOTYPE_BY_ID, animationState, directionalFrame, clamp, gaitFoot } from './prototype-engine.js';

// Original modular artwork is articulated here, then baked into immutable sprite frames.
// Cached frames play in the arena; source parts are never stretched as a whole character.
const TAU=Math.PI*2;
export const FRAME_SIZE=176;
const ROOT_Y=139;
const parts=new Image();parts.src='/public/prototype-parts.png';
const trims=new Map(),frames=new Map();
let sourcePixels=null;
export function spritesReady(){return !!(parts.complete&&parts.naturalWidth);}
parts.addEventListener('load',()=>{
  const canvas=document.createElement('canvas');canvas.width=parts.width;canvas.height=parts.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(parts,0,0);sourcePixels=c.getImageData(0,0,parts.width,parts.height).data;
  trims.clear();frames.clear();window.dispatchEvent(new Event('prototype-art-ready'));
});
parts.addEventListener('error',()=>window.dispatchEvent(new Event('prototype-art-error')));
function sourcePart(row,column){
  const key=row+':'+column;if(trims.has(key))return trims.get(key);
  const x0=Math.floor(column*parts.width/9),x1=Math.floor((column+1)*parts.width/9),y0=Math.floor(row*parts.height/5),y1=Math.floor((row+1)*parts.height/5);
  let left=x1,right=x0,top=y1,bottom=y0;
  if(sourcePixels)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(sourcePixels[(y*parts.width+x)*4+3]>90){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const part=right>left?{x:left,y:top,w:right-left+1,h:bottom-top+1}:{x:x0,y:y0,w:x1-x0,h:y1-y0};
  trims.set(key,part);return part;
}
function part(c,row,col,x,y,w,h,angle=0,pivotX=0.5,pivotY=0.5,flip=false){
  const s=sourcePart(row,col);c.save();c.translate(x,y);c.rotate(angle);if(flip)c.scale(-1,1);
  c.drawImage(parts,s.x,s.y,s.w,s.h,-w*pivotX,-h*pivotY,w,h);c.restore();
}
function limb(c,row,col,a,b,width,flip=false){
  const d=Math.hypot(b.x-a.x,b.y-a.y);
  part(c,row,col,a.x,a.y,width,d+3,Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2,0.5,0.02,flip);
}
function projected(x,y,z,angle){return {x:x*Math.cos(angle)-y*Math.sin(angle),y:(x*Math.sin(angle)+y*Math.cos(angle))*0.58-z};}
function legKnee(hip,foot,length=23){
  const dx=foot.x-hip.x,dz=foot.z-hip.z,d=Math.hypot(dx,dz)||1,mid=Math.min(d,length*2-0.01)/2;
  const h=Math.sqrt(Math.max(0,length*length-mid*mid));
  return {x:(hip.x+foot.x)/2-dz/d*h,y:hip.y,z:(hip.z+foot.z)/2+dx/d*h};
}
function footPose(phase,stride,moving,running){
  const foot=gaitFoot(phase,stride,running);return {x:foot.x,z:foot.z*moving};
}
function shield(c,x,y,scale=1){
  c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#313a44';c.strokeStyle='#c8a569';c.lineWidth=2;
  c.beginPath();c.moveTo(-9,-12);c.lineTo(9,-12);c.lineTo(8,3);c.lineTo(0,13);c.lineTo(-8,3);c.closePath();c.fill();c.stroke();
  c.fillStyle='#9e3942';c.fillRect(-5,-8,10,9);c.fillStyle='#d6b46d';c.fillRect(-1,-8,2,16);c.restore();
}
function poseFrame(spec,state,phase,angle,stage='',transition=null){
  const canvas=document.createElement('canvas');canvas.width=FRAME_SIZE;canvas.height=FRAME_SIZE;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;
  c.translate(FRAME_SIZE/2,ROOT_Y);
  const wolf=spec.id==='wolf',heavy=spec.id==='orc',moving=['walk','run'].includes(state),running=state==='run';
  const back=Math.sin(angle)<-0.3,flip=Math.cos(angle)<-0.05;
  const gait=phase,breath=Math.sin(phase*TAU)*0.55;
  let crouch=0,lean=0,thrust=0,anticipation=0,armLift=0,hipX=0;
  if(state==='attack'||state==='cast'){
    if(stage==='windup'){anticipation=Math.sin(phase*Math.PI/2);lean=-anticipation*(heavy?0.1:0.06);crouch=anticipation*2;armLift=anticipation;}
    else{thrust=Math.exp(-phase*3.7);lean=thrust*(heavy?0.19:0.1);hipX=thrust*4;crouch=thrust*1.5;}
  }
  if(state==='hit'){lean=-Math.sin(phase*Math.PI)*0.12;crouch=2;hipX=-Math.sin(phase*Math.PI)*3;}
  if(state==='stagger'){lean=-0.15*Math.sin(phase*Math.PI);crouch=7;armLift=-0.5;}
  if(state==='dash'){lean=0.3;hipX=6;crouch=7;}
  if(state==='dodge'){lean=-0.28*Math.sin(phase*Math.PI);crouch=12*Math.sin(phase*Math.PI);hipX=-4;}
  if(state==='turn'){lean=Math.sin(phase*TAU)*0.035;}
  if(state==='death'){
    const p=clamp(phase,0,1),ease=p*p*(3-2*p);
    c.translate(0,ease*3);c.rotate((flip?-1:1)*ease*1.28);c.translate(0,ease*16);
    crouch=ease*5;lean=0.1;
  }
  if(!moving)c.translate(0,-breath);
  c.rotate(lean*(flip?-1:1));
  const row=spec.row,hipZ=(wolf?28:heavy?32:38)-crouch,shoulderZ=(wolf?35:63)-crouch;
  const P=(x,y,z)=>projected(x+hipX,y,z,angle);
  const legPairs=wolf?[{base:18,side:-7,offset:0},{base:-17,side:-7,offset:0.5},{base:18,side:7,offset:0.5},{base:-17,side:7,offset:0}]:[{base:0,side:-7,offset:0},{base:0,side:7,offset:0.5}];
  const limbs=legPairs.map((l,i)=>{
    const f=moving?footPose(gait+l.offset,spec.stride,1,running):{x:state==='dash'?(i%2?13:-13):state==='dodge'?(i%2?8:-8):0,z:0};
    if(transition&&!moving){const old=footPose(transition.gait+l.offset,spec.stride,1,false);f.x=f.x*(1-transition.weight)+old.x*transition.weight;f.z=f.z*(1-transition.weight)+old.z*transition.weight;}
    const hip={x:l.base,y:l.side,z:hipZ},foot={x:l.base+f.x,y:l.side+(wolf?0:2),z:f.z};
    return {hip:P(hip.x,hip.y,hip.z),knee:legKnee(hip,foot,wolf?18:heavy?18:21.5),foot:P(foot.x,foot.y,foot.z),localFoot:foot,depth:P(0,l.side,0).y,front:wolf?l.base>0:true};
  }).sort((a,b)=>a.depth-b.depth);
  for(const l of limbs){
    const k=P(l.knee.x,l.knee.y,l.knee.z),width=heavy?16:spec.id==='knight'?11:wolf?10:9;
    limb(c,row,wolf&&l.front?4:6,l.hip,k,width,flip);
    limb(c,row,wolf&&l.front?5:7,k,l.foot,width+(heavy?1:0),flip);
  }
  if(wolf){
    const tail=P(-28,0,32),tip=P(-47,Math.sin(phase*TAU)*5,40);
    part(c,row,8,tail.x,tail.y,34,24,Math.atan2(tip.y-tail.y,tip.x-tail.x)-Math.PI,0.15,0.5,flip);
    const torso=P(0,0,34-crouch),head=P(30,0,42-crouch+(thrust?3:0));
    part(c,row,3,torso.x,torso.y,55,31,Math.sin(angle)*0.06,0.5,0.5,flip);
    part(c,row,back?1:0,head.x,head.y,29,31,-anticipation*0.12+thrust*0.12,0.5,0.6,flip);
  }else{
    const torso=P(0,0,(heavy?50:52)-crouch),shoulderWidth=heavy?20:spec.id==='knight'?14:12;
    const arms=[-1,1].map(side=>{
      const shoulder=P(0,side*shoulderWidth,shoulderZ),reach=(side===1?1:0.45);
      let handX=4,handZ=35-crouch,handY=side*(shoulderWidth+4);
      if(moving){handX=Math.sin((gait+(side<0?0.5:0))*TAU)*8;handZ+=Math.cos(gait*TAU)*1.5;}
      if(state==='attack'){
        if(spec.id==='elf'){handX=side===1?27:8-anticipation*8;handZ=53+anticipation*5;handY=side*9;}
        else{handX=-anticipation*14*reach+thrust*31*reach;handZ+=anticipation*30*reach+thrust*7;handY+=thrust*6*side;}
      }
      if(state==='cast'){handX=14+thrust*12;handZ=54+armLift*15;handY=side*12;}
      if(state==='dash'||state==='dodge'){handX=-18;handZ=43;}
      const hand=P(handX,handY,handZ),elbow={x:shoulder.x+(hand.x-shoulder.x)*0.44+(side<0?-3:3),y:shoulder.y+(hand.y-shoulder.y)*0.52+4};
      return {side,shoulder,hand,elbow,depth:P(0,side*shoulderWidth,0).y};
    }).sort((a,b)=>a.depth-b.depth);
    const drawArm=(a)=>{limb(c,row,4,a.shoulder,a.elbow,heavy?13:10,flip);limb(c,row,5,a.elbow,a.hand,heavy?12:8,flip);};
    drawArm(arms[0]);
    const bodyWidth=heavy?52:spec.id==='knight'?35:31;
    part(c,row,back?3:2,torso.x,torso.y,bodyWidth*(0.82+Math.abs(Math.sin(angle))*0.18),heavy?43:35,0,0.5,0.48,flip);
    drawArm(arms[1]);
    const hand=arms.find(a=>a.side===1).hand;
    if(spec.id==='knight'){
      const left=arms.find(a=>a.side===-1).hand;shield(c,left.x,left.y,0.85);
      const tip=P((anticipation?-7:24+thrust*15),19,anticipation?103:67-thrust*14);
      const sourceAngle=Math.atan2(-0.72,-0.72),desired=Math.atan2(tip.y-hand.y,tip.x-hand.x);
      part(c,row,8,hand.x,hand.y,46,46,desired-sourceAngle,0.85,0.86);
    }else if(spec.id==='orc'){
      const tip=P(-10*anticipation+24+thrust*19,18,anticipation?105:69-thrust*28);
      part(c,row,8,hand.x,hand.y,54,51,Math.atan2(tip.y-hand.y,tip.x-hand.x)+Math.PI/4,0.14,0.86);
    }else if(spec.id==='elf'){
      part(c,row,8,hand.x,hand.y,43,48,-0.3*(flip?-1:1),0.45,0.5,flip);
      if(state==='attack'&&stage==='windup'){
        c.strokeStyle='#d6cdb3';c.lineWidth=0.7;c.beginPath();c.moveTo(hand.x-3,hand.y-17);c.lineTo(hand.x-8-anticipation*6,hand.y);c.lineTo(hand.x+5,hand.y+18);c.stroke();
        c.strokeStyle='#f4e4ba';c.beginPath();c.moveTo(hand.x-8,hand.y);c.lineTo(hand.x+24*(flip?-1:1),hand.y-1);c.stroke();
      }
    }else{
      part(c,row,8,hand.x,hand.y,40,62,-0.08,0.23,0.86,flip);
      if(state==='cast'){
        c.fillStyle='#b8f5ff';c.shadowColor='#72cfe8';c.shadowBlur=9;c.beginPath();c.arc(hand.x+8,hand.y-42,2+anticipation*3,0,TAU);c.fill();c.shadowBlur=0;
      }
    }
    const head=P(2+thrust*2,0,78-crouch);
    part(c,row,back?1:0,head.x,head.y,heavy?33:spec.id==='knight'?29:27,heavy?33:31,anticipation*-0.06+thrust*0.05,0.5,0.58,flip);
  }
  // Bake into a reduced pixel grid once; draw those frames with nearest-neighbor scaling.
  const low=document.createElement('canvas');low.width=88;low.height=88;
  low.getContext('2d').drawImage(canvas,0,0,88,88);
  const final=document.createElement('canvas');final.width=FRAME_SIZE;final.height=FRAME_SIZE;
  const f=final.getContext('2d');f.imageSmoothingEnabled=false;f.drawImage(low,0,0,FRAME_SIZE,FRAME_SIZE);
  return final;
}
export function spriteSample(u,time=0,override=null){
  const state=override?.state||animationState(u),dir=directionalFrame(u.facing||0);
  let phase=0,stage='',count=['walk','run'].includes(state)?12:8;
  if(override)phase=override.phase;
  else if(state==='walk'||state==='run')phase=u.gait%1;
  else if(state==='attack'||state==='cast'){
    const a=u.action;
    if(a&&!a.released){stage='windup';phase=a.elapsed/a.windup;count=7;}
    else{stage='recovery';phase=a?(a.elapsed-a.windup)/(a.duration-a.windup):0;count=9;}
  }else if(state==='death'){phase=Math.min(1,u.deathTime/0.85);count=12;}
  else if(state==='dodge'||state==='dash')phase=u.roll?u.roll.elapsed/u.roll.duration:0;
  else if(state==='hit')phase=1-u.hitTime/0.13;
  else if(state==='stagger')phase=1-u.stagger/0.46;
  else phase=time*0.65%1;
  if(override&&(state==='attack'||state==='cast')){
    stage=phase<0.5?'windup':'recovery';phase=phase<0.5?phase*2:(phase-0.5)*2;
  }
  const index=clamp(Math.floor(phase*count),0,count-1);
  const foot=u.transitionFoot,weight=foot&&!override?Math.max(0,1-(time-foot.time)/0.14):0;
  const transition=weight>0&&foot.moving>0.1?{gait:Math.floor((foot.gait%1)*12)/12,weight:Math.ceil(weight*4)/4}:null;
  return {state,dir,index,phase:index/(count-1),stage,transition,key:`${u.id}:${state}:${dir}:${stage}:${index}${transition?':'+transition.gait+':'+transition.weight:''}`};
}
export function drawPrototypeSprite(c,u,x,y,time=0,scale=1,override=null){
  if(!spritesReady())return;
  const s=spriteSample(u,time,override);
  let frame=frames.get(s.key);
  if(!frame){frame=poseFrame(PROTOTYPE_BY_ID[u.id],s.state,s.phase,s.dir*Math.PI/4,s.stage,s.transition);frames.set(s.key,frame);if(frames.size>420)frames.delete(frames.keys().next().value);}
  const alpha=u.hp<=0?0.7:1;
  c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;
  c.drawImage(frame,x-FRAME_SIZE*scale/2,y-ROOT_Y*scale,FRAME_SIZE*scale,FRAME_SIZE*scale);c.restore();
}
export function spriteCacheStats(){return {frames:frames.size,maxFrames:420,sourceReady:spritesReady(),frameSize:FRAME_SIZE};}
export function prototypePortrait(id){
  const c=document.createElement('canvas');c.width=100;c.height=110;
  const u={id,facing:Math.PI/4,hp:1,deathTime:0,moving:0,gait:0};
  drawPrototypeSprite(c.getContext('2d'),u,50,109,0,1.08);return c.toDataURL();
}
