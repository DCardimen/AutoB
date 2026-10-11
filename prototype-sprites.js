import { PROTOTYPE_BY_ID, animationState, directionalFrame, clamp } from './prototype-engine.js';
import { characterRig, projectRig, localFootContacts } from './prototype-rig.js';

export const FRAME_SIZE=256;
const ROOT_Y=194,RASTER_SCALE=1.5,MAX_FRAMES=192,TAU=Math.PI*2;
const parts=new Image();parts.src='/public/prototype-parts.png';
const heads=new Image();heads.src='/public/prototype-heads-8.png';
const bodies=new Image();bodies.src='/public/prototype-bodies-8.png';
const limbs=new Image();limbs.src='/public/prototype-limbs-v3.png';
const weapons=new Image();weapons.src='/public/prototype-weapons-v2.png';
const source=(image,columns,rows)=>({image,columns,rows,trims:new Map()});
const partSource=source(parts,9,5),headSource=source(heads,8,5),bodySource=source(bodies,8,5),limbSource=source(limbs,6,5),weaponSource=source(weapons,4,1);
const sources=[partSource,headSource,bodySource,limbSource,weaponSource],frames=new Map();
export function spritesReady(){return sources.every(s=>s.pixels&&s.image.complete&&s.image.naturalWidth);}
for(const s of sources){
  s.image.addEventListener('load',()=>{
    const canvas=document.createElement('canvas');canvas.width=s.image.width;canvas.height=s.image.height;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(s.image,0,0);s.pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
    s.trims.clear();frames.clear();window.dispatchEvent(new Event('prototype-art-ready'));
  });
  s.image.addEventListener('error',()=>window.dispatchEvent(new Event('prototype-art-error')));
}
function crop(s,row,col){
  const key=row+':'+col;if(s.trims.has(key))return s.trims.get(key);
  const {image,columns,rows,pixels}=s,x0=Math.floor(col*image.width/columns),x1=Math.floor((col+1)*image.width/columns),y0=Math.floor(row*image.height/rows),y1=Math.floor((row+1)*image.height/rows);
  let left=x1,right=x0,top=y1,bottom=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*image.width+x)*4+3]>90){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const cut={x:left,y:top,w:right-left+1,h:bottom-top+1};s.trims.set(key,cut);return cut;
}
function art(c,s,row,col,x,y,width,height,rotation=0,pivotX=0.5,pivotY=0.5,flip=false){
  const cut=crop(s,row,col);c.save();c.translate(x,y);c.rotate(rotation);if(flip)c.scale(-1,1);
  c.drawImage(s.image,cut.x,cut.y,cut.w,cut.h,-width*pivotX,-height*pivotY,width,height);c.restore();
}
function directionArt(c,s,row,dir,p,maxWidth,height,pivotY=0.5,rotation=0){
  const cut=crop(s,row,dir),width=Math.min(maxWidth,height*cut.w/cut.h);
  art(c,s,row,dir,p.x,p.y,width,height,rotation,0.5,pivotY);
}
function segment(c,row,col,a,b,width,flip=false){
  const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
  // A shaded anatomical bridge sits beneath the painted part. Transparent
  // padding in a source piece can no longer disconnect the shared joint.
  bridge(c,row,a,b,width*0.42);
  // Artwork has a vertical bone axis and excludes the boot. The overlap hides
  // seams without squeezing an entire bent limb into one line.
  const height=distance+8;
  art(c,limbSource,row,col,a.x,a.y,width,height,Math.atan2(dy,dx)-Math.PI/2,0.5,4/height,flip);
}
const jointColors=[['#bbc1bd','#4e5b65','#28343d'],['#91a65b','#627841','#344527'],['#a2ad74','#5c7048','#35472e'],['#dbd3bd','#968c82','#534f56'],['#c88248','#9c582e','#5e351e']];
function bridge(c,row,a,b,width){
  const colors=jointColors[row],g=c.createLinearGradient(a.x-width/2,a.y,b.x+width/2,b.y);
  g.addColorStop(0,colors[0]);g.addColorStop(0.5,colors[1]);g.addColorStop(1,colors[2]);
  c.strokeStyle=g;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
}
function joint(c,row,p,width){
  const colors=jointColors[row],g=c.createLinearGradient(p.x-width/2,p.y-width/3,p.x+width/2,p.y+width/3);
  g.addColorStop(0,colors[0]);g.addColorStop(0.45,colors[1]);g.addColorStop(1,colors[2]);
  c.fillStyle=g;c.beginPath();c.ellipse(p.x,p.y,width*0.28,width*0.24,0,0,TAU);c.fill();
}
function shield(c,p,angle){
  c.save();c.translate(p.x,p.y);c.scale(0.72+Math.abs(Math.sin(angle))*0.28,1);
  const metal=c.createLinearGradient(-12,0,11,0);metal.addColorStop(0,'#c7c8b4');metal.addColorStop(0.35,'#526477');metal.addColorStop(0.6,'#879ba5');metal.addColorStop(1,'#253a43');
  c.fillStyle=metal;c.strokeStyle='#d5b76c';c.lineWidth=1.6;c.beginPath();c.moveTo(-11,-15);c.quadraticCurveTo(0,-19,11,-15);c.lineTo(9,5);c.quadraticCurveTo(5,13,0,16);c.quadraticCurveTo(-8,9,-10,3);c.closePath();c.fill();c.stroke();
  const red=c.createLinearGradient(-7,-12,8,9);red.addColorStop(0,'#c4534f');red.addColorStop(1,'#642e31');c.fillStyle=red;c.beginPath();c.moveTo(-7,-12);c.lineTo(7,-12);c.lineTo(6,4);c.lineTo(0,11);c.lineTo(-6,4);c.closePath();c.fill();
  c.strokeStyle='#edcf86';c.lineWidth=1.2;c.beginPath();c.moveTo(0,-10);c.lineTo(0,8);c.moveTo(-4,-5);c.lineTo(4,-5);c.stroke();c.restore();
}
const weaponParts={sword:{col:0,pivotX:0.5,pivotY:0.86},axe:{col:1,pivotX:0.75,pivotY:0.84},bow:{col:2,pivotX:0.82,pivotY:0.52},staff:{col:3,pivotX:0.5,pivotY:0.65}};
function drawWeapon(c,rig,angle){
  const w=rig.weapon;if(!w)return;
  const grip=projectRig(w.grip,angle),tip=projectRig(w.tip,angle),meta=weaponParts[w.kind],cut=crop(weaponSource,0,meta.col);
  const height=Math.hypot(tip.x-grip.x,tip.y-grip.y)/meta.pivotY,width=height*cut.w/cut.h;
  art(c,weaponSource,0,meta.col,grip.x,grip.y,width,height,Math.atan2(tip.y-grip.y,tip.x-grip.x)+Math.PI/2,meta.pivotX,meta.pivotY);
  if(rig.bowString){
    const amount=rig.bowString.draw;
    const top=projectRig({...w.grip,z:w.grip.z+25},angle),bottom=projectRig({...w.grip,z:w.grip.z-25},angle);
    const pull=projectRig({...w.grip,x:w.grip.x-amount*24},angle);
    c.strokeStyle='#e6d1a5';c.lineWidth=0.75;c.beginPath();c.moveTo(top.x,top.y);c.lineTo(pull.x,pull.y);c.lineTo(bottom.x,bottom.y);c.stroke();
    if(amount>0.08&&rig.stage==='windup'){const end=projectRig({...w.grip,x:w.grip.x+21},angle);c.strokeStyle='#e5d8b7';c.beginPath();c.moveTo(pull.x,pull.y);c.lineTo(end.x,end.y);c.stroke();}
  }
  if(rig.state==='cast'){
    c.fillStyle='#ddfbff';c.shadowColor='#76ddf4';c.shadowBlur=5;
    c.beginPath();c.arc(tip.x,tip.y,1.8+Math.sin(rig.phase*Math.PI)*2,0,TAU);c.fill();c.shadowBlur=0;
  }
}
function weaponTrail(c,id,state,phase,stage,angle,options){
  if(state!=='attack'||!['knight','orc'].includes(id)||(stage==='windup'&&phase<0.77)||(stage==='recovery'&&phase>0.27))return;
  c.save();c.lineCap='round';
  for(let i=4;i>=1;i--){
    const a=characterRig(id,state,Math.max(0,phase-i*0.018),stage,options),b=characterRig(id,state,Math.max(0,phase-(i-1)*0.018),stage,options);
    const p=projectRig(a.weapon.tip,angle),q=projectRig(b.weapon.tip,angle);
    c.globalAlpha=(5-i)*0.065;c.strokeStyle=id==='orc'?'#ebc67b':'#d2e6ee';c.lineWidth=id==='orc'?5:3;
    c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();
  }c.restore();
}
function poseFrame(spec,state,phase,angle,stage='',options={}){
  const canvas=document.createElement('canvas');canvas.width=FRAME_SIZE*RASTER_SCALE;canvas.height=FRAME_SIZE*RASTER_SCALE;
  const c=canvas.getContext('2d');c.scale(RASTER_SCALE,RASTER_SCALE);c.translate(FRAME_SIZE/2,ROOT_Y);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const rig=characterRig(spec.id,state,phase,stage,{...options,stride:spec.stride}),d=rig.dimensions,dir=directionalFrame(angle),flip=Math.cos(angle)<0,wolf=spec.id==='wolf';
  if(rig.death){c.translate(rig.death*(flip?9:-9),rig.death*2);c.rotate((flip?-1:1)*rig.death*1.45);}
  const project=p=>projectRig(p,angle);
  const legs=rig.legs.slice().sort((a,b)=>project(a.root).depth-project(b.root).depth);
  for(const leg of legs){
    const root=project(leg.root),knee=project(leg.joint),end=project(leg.end),hock=leg.hock?project(leg.hock):end;
    if(!wolf)bridge(c,spec.row,project({...rig.pelvis,z:rig.pelvis.z+4}),root,d.legW*0.45);
    joint(c,spec.row,knee,d.calfW);joint(c,spec.row,end,d.calfW*0.7);
    if(leg.hock)joint(c,spec.row,hock,d.calfW*0.8);
    segment(c,spec.row,wolf&&leg.front?2:0,root,knee,d.legW,flip);
    segment(c,spec.row,wolf&&leg.front?3:1,knee,hock,d.calfW,flip);
    if(leg.hock)segment(c,spec.row,1,hock,end,d.calfW*0.7,flip);
    const footAngle=angle+leg.foot.angle,front=Math.abs(Math.sin(footAngle))>0.68,width=d.footW*(front?0.76:1),height=wolf?7:10;
    art(c,limbSource,spec.row,front?5:4,end.x,end.y,width,height,leg.foot.pitch*Math.cos(footAngle),0.45,wolf?0.6:0.7,Math.cos(footAngle)<0&&!front);
  }
  weaponTrail(c,spec.id,state,phase,stage,angle,{...options,stride:spec.stride});
  if(wolf){
    const tail=project(rig.tail),tip=project({...rig.tail,x:rig.tail.x-20,y:Math.sin(phase*TAU-0.7)*4,z:rig.tail.z+4});
    art(c,partSource,spec.row,8,tail.x,tail.y,27,18,Math.atan2(tip.y-tail.y,tip.x-tail.x)-Math.atan2(-0.55,-0.65),0.8,0.75);
    const body=project(rig.body);
    const bodyWidth=26+Math.abs(Math.cos(angle))*35;
    directionArt(c,bodySource,spec.row,dir,body,bodyWidth,d.bodyH);
    const neck=project({...rig.body,x:18}),jaw=project({...rig.head,z:rig.head.z-3});
    c.strokeStyle='#8b4a27';c.lineWidth=11;c.lineCap='round';c.beginPath();c.moveTo(neck.x,neck.y);c.lineTo(jaw.x,jaw.y);c.stroke();
    directionArt(c,headSource,spec.row,dir,project(rig.head),d.headW,d.headH,0.6);
  }else{
    const arms=rig.arms.slice().sort((a,b)=>project(a.root).depth-project(b.root).depth);
    const armedSide=spec.id==='elf'?-1:1;
    const drawArm=a=>{
      bridge(c,spec.row,project({...rig.body,z:a.root.z-2}),project(a.root),d.armW*0.45);
      joint(c,spec.row,project(a.root),d.armW*0.8);joint(c,spec.row,project(a.joint),d.armW*0.7);
      segment(c,spec.row,2,project(a.root),project(a.joint),d.armW,flip);
      if(a.side===armedSide)drawWeapon(c,rig,angle);
      segment(c,spec.row,3,project(a.joint),project(a.end),d.armW*0.85,flip);
      if(a.side===-1&&rig.shield)shield(c,project(rig.shield.grip),angle);
    };
    drawArm(arms[0]);
    const neck=project({...rig.body,z:rig.body.z+d.bodyH*0.36}),jaw=project({...rig.head,z:rig.head.z-d.headH*0.3});
    bridge(c,spec.row,neck,jaw,spec.id==='orc'?7:6);
    directionArt(c,bodySource,spec.row,dir,project(rig.body),d.bodyW,d.bodyH,0.5,rig.lean*Math.cos(angle));
    drawArm(arms[1]);
    directionArt(c,headSource,spec.row,dir,project(rig.head),d.headW,d.headH,0.55,rig.lean*Math.cos(angle)*0.2);
  }
  return canvas;
}
export function spriteSample(u,time=0,override=null){
  const state=override?.state||animationState(u),dir=directionalFrame(u.facing||0),angleIndex=((Math.round((u.facing||0)/(Math.PI/32))%64)+64)%64;
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
  const transition=weight>0&&foot.moving>0.1?{gait:Math.floor((foot.gait%1)*48)/48,weight:Math.ceil(weight*8)/8}:null;
  const motion=override?1:Math.round(clamp((u.moving||0)/0.5,0,1)*8)/8;
  const runBlend=override?(['run','sprint'].includes(state)?1:0):Math.round(clamp(u.runBlend||0,0,1)*12)/12;
  const sprintBlend=override?(state==='sprint'?1:0):Math.round(clamp(u.sprintBlend||0,0,1)*12)/12;
  const acceleration=override?0:Math.round((u.acceleration||0)*8)/8;
  const feet=override?null:localFootContacts({...u,facing:angleIndex*Math.PI/32})?.map(f=>({x:Math.round(f.x*2)/2,y:Math.round(f.y*2)/2,z:Math.round(f.z*2)/2,angle:Math.round(f.angle*8)/8}));
  const movementAngle=override?0:Math.round(Math.atan2(Math.sin((u.moveFacing??u.facing)-u.facing),Math.cos((u.moveFacing??u.facing)-u.facing))*8)/8;
  const key=[u.id,state,angleIndex,stage,index,motion,runBlend,sprintBlend,acceleration,movementAngle,transition?transition.gait+':'+transition.weight:'',feet?JSON.stringify(feet):''].join(':');
  return {state,dir,angleIndex,index,phase:['walk','run','sprint'].includes(state)?index/count:index/(count-1),stage,transition,motion,runBlend,sprintBlend,acceleration,movementAngle,feet,key};
}
export function drawPrototypeSprite(c,u,x,y,time=0,scale=1,override=null){
  if(!spritesReady())return;
  const s=spriteSample(u,time,override);let frame=frames.get(s.key);
  if(!frame){frame=poseFrame(PROTOTYPE_BY_ID[u.id],s.state,s.phase,s.angleIndex*Math.PI/32,s.stage,s);frames.set(s.key,frame);if(frames.size>MAX_FRAMES)frames.delete(frames.keys().next().value);}
  c.save();c.globalAlpha*=u.hp<=0?0.82:1;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(frame,x-FRAME_SIZE*scale/2,y-ROOT_Y*scale,FRAME_SIZE*scale,FRAME_SIZE*scale);c.restore();
}
export function spriteCacheStats(){return {frames:frames.size,maxFrames:MAX_FRAMES,sourceReady:spritesReady(),frameSize:FRAME_SIZE,rasterScale:RASTER_SCALE,rigVersion:3,directionalArt:{columns:8,characters:5,heads:40,bodies:40}};}
export function prototypeDirectionFrames(id,state='idle',phase=0.25){
  return Array.from({length:8},(_,dir)=>{const canvas=document.createElement('canvas');canvas.width=FRAME_SIZE;canvas.height=FRAME_SIZE;drawPrototypeSprite(canvas.getContext('2d'),{id,facing:dir*Math.PI/4,hp:1,gait:0},FRAME_SIZE/2,ROOT_Y,0,1,{state,phase});return canvas.toDataURL();});
}
export function prototypePortrait(id){
  const canvas=document.createElement('canvas');canvas.width=100;canvas.height=120;
  drawPrototypeSprite(canvas.getContext('2d'),{id,facing:Math.PI/4,hp:1,gait:0},50,119,0,0.92);return canvas.toDataURL();
}
