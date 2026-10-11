import { locomotionPose } from './prototype-motion.js';
// Anatomical poses shared by the renderer and physical weapon contacts.
const TAU=Math.PI*2;
const bound=(n,a,b)=>Math.max(a,Math.min(b,n));
export const ease=p=>{p=bound(p,0,1);return p*p*(3-2*p);};
const point=(x=0,y=0,z=0)=>({x,y,z});
const plus=(a,b)=>point(a.x+b.x,a.y+b.y,a.z+b.z);
const times=(a,s)=>point(a.x*s,a.y*s,a.z*s);
const minus=(a,b)=>point(a.x-b.x,a.y-b.y,a.z-b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const length=a=>Math.hypot(a.x,a.y,a.z);
const unit=a=>times(a,1/(length(a)||1));
export const mix=(a,b,t)=>plus(times(a,1-t),times(b,t));
export const RIGS={
  knight:{hip:44,thigh:21,shin:21,stance:7,shoulder:14,arm:16,forearm:15,bodyW:37,bodyH:32,headW:38,headH:36,legW:14,calfW:12,armW:12,footW:17},
  orc:{hip:35,thigh:18,shin:18,stance:10,shoulder:18,arm:18,forearm:17,bodyW:54,bodyH:34,headW:43,headH:36,legW:20,calfW:17,armW:17,footW:22},
  elf:{hip:44,thigh:21,shin:21,stance:6.5,shoulder:13,arm:17,forearm:16,bodyW:33,bodyH:32,headW:37,headH:35,legW:13,calfW:11,armW:10,footW:16},
  caster:{hip:41,thigh:20,shin:20,stance:7,shoulder:14,arm:16,forearm:15,bodyW:35,bodyH:33,headW:39,headH:36,legW:15,calfW:12,armW:12,footW:17},
  wolf:{hip:29,thigh:18.5,shin:18.5,hock:9,stance:7,bodyW:61,bodyH:31,headW:43,headH:34,legW:11,calfW:8,footW:13},
};

export function projectRig(p,angle){return {x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:(p.x*Math.sin(angle)+p.y*Math.cos(angle))*0.58-p.z,depth:p.x*Math.sin(angle)+p.y*Math.cos(angle)};}

// Solve the joint in 3D with a pole vector; no segment is stretched to reach.
export function solveLimb(root,target,upper,lower,pole=point(1,0,0)){
  const delta=minus(target,root),raw=length(delta),dir=unit(raw>1e-7?delta:point(0,0,-1));
  const distance=bound(raw,Math.abs(upper-lower)+0.001,upper+lower-0.001);
  const end=plus(root,times(dir,distance));
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  let normal=minus(pole,times(dir,dot(pole,dir)));
  if(length(normal)<1e-5)normal=minus(point(0,1,0),times(dir,dir.y));
  normal=unit(normal);
  const joint=plus(plus(root,times(dir,along)),times(normal,Math.sqrt(Math.max(0,upper*upper-along*along))));
  return {root,joint,end,upper,lower,clamped:Math.abs(raw-distance)>0.01};
}

export function locomotionStride(stride,run=0,sprint=0,id='knight'){
  // Human running covers more ground per cycle, rather than accelerating a
  // walking cycle to an implausible number of footfalls. Quadrupeds keep their
  // own shorter, faster trot/gallop cadence.
  return stride*(1+(id==='wolf'?0.08:0.35)*run+(id==='wolf'?0.36:0.45)*sprint);
}
export function footSoleLift(id,pitch,ankleZ=3){
  const s=Math.sin(pitch),c=Math.cos(pitch);
  // Shared rounded sole dimensions used by the models. Raise the ankle around
  // heel/toe support so rotating a planted shoe cannot push it into the floor.
  const profiles=id==='wolf'?[[3,-0.7,6,2.9],[6,-1.2,2.5,1.3]]:[[3,1,8,3.6],[3,-1.8,8,1.2]];
  const bottom=Math.min(...profiles.map(([x,z,rx,rz])=>-x*s+z*c-Math.hypot(rx*s,rz*c)));
  return Math.max(0,-ankleZ-bottom);
}
export function legLayout(id,run=0,sprint=0){
  if(id!=='wolf')return [{x:0,y:-RIGS[id].stance,offset:0},{x:0,y:RIGS[id].stance,offset:0.5}];
  return [{x:18,y:-7,offset:0,front:true},{x:-18,y:-7,offset:0.75-0.25*run+0.08*sprint,front:false},
    {x:18,y:7,offset:0.5-0.38*sprint,front:true},{x:-18,y:7,offset:0.25*(1-run)-0.3*sprint,front:false}];
}
export function rigFoot(phase,stride,running=false,sprinting=0){
  const run=typeof running==='number'?bound(running,0,1):running?1:0;
  const sprint=bound(sprinting,0,1),duty=0.62-0.16*run-0.08*sprint,p=((phase%1)+1)%1,half=stride*duty/2;
  if(p<duty){
    const contact=p/duty;
    const pitch=-0.16*(1-ease(contact/0.17))+0.28*ease((contact-0.77)/0.23);
    return {x:half-p*stride,z:0,pitch,planted:true,duty};
  }
  const t=(p-duty)/(1-duty);
  return {x:-half+2*half*ease(t),z:Math.sin(Math.PI*t)**1.35*(8+run*5+sprint*5),pitch:0.28*(1-ease(t))-0.16*ease(t),planted:false,duty};
}

function weaponMotion(id,phase,stage){
  const heavy=id==='orc',hip=RIGS[id].hip,rest=point(heavy?10:9,heavy?10:14,hip+(heavy?18:7)),restTilt=heavy?1.1:0.22;
  const raised=point(heavy?-8:-11,heavy?3:13,hip+(heavy?36:33));
  const contact=point(heavy?22:21,heavy?2:12,hip+(heavy?15:9));
  const follow=point(25,heavy?-8:-4,hip+(heavy?2:-1));
  if(stage==='windup'){
    if(phase<0.72){const t=ease(phase/0.72);return {hand:mix(rest,raised,t),tilt:restTilt+(-1.05-restTilt)*t,active:false,weight:t};}
    const t=ease((phase-0.72)/0.28);return {hand:mix(raised,contact,t),tilt:-1.05+(1.53+1.05)*t,active:true,weight:1-t*0.4};
  }
  if(stage==='recovery'){
    if(phase<0.26){const t=ease(phase/0.26);return {hand:mix(contact,follow,t),tilt:1.53+(2.1-1.53)*t,active:true,weight:0.6*(1-t)};}
    const t=ease((phase-0.26)/0.74);return {hand:mix(follow,rest,t),tilt:2.1+(restTilt-2.1)*t,active:false,weight:0};
  }
  return {hand:rest,tilt:restTilt,active:false,weight:0};
}

export function characterRig(id,state='idle',phase=0,stage='',options={}){
  const d=RIGS[id],wolf=id==='wolf',heavy=id==='orc',moving=['walk','run','sprint'].includes(state),running=state==='run'||state==='sprint';
  const motion=moving?(options.motion??1):0,gait=phase;
  const runBlend=options.runBlend??(running?1:0);
  const sprintBlend=options.sprintBlend??(state==='sprint'?1:0);
  const stride=locomotionStride(options.stride||(wolf?72:heavy?82:76),runBlend,sprintBlend,id);
  const layout=legLayout(id,runBlend,sprintBlend);
  const breath=Math.sin(phase*TAU)*0.25;
  const authored=locomotionPose(id,gait,runBlend,sprintBlend);
  const bob=moving?authored.bob*motion:breath;
  let crouch=moving?(wolf?6+runBlend+sprintBlend:heavy?8+runBlend*1.5+sprintBlend:7+runBlend*1.5+sprintBlend)*motion:0,shift=0,sideShift=0,sideLean=0;
  const rollAngle=options.rollAngle??(state==='dodge'?Math.PI/2:0);
  let lean=moving?(0.04+runBlend*0.09+sprintBlend*0.1+(options.acceleration||0)*0.04+authored.pitch)*motion:0;
  let torsoYaw=moving?authored.yaw*motion:0;
  const wm=weaponMotion(id,phase,(state==='attack'?stage:''));
  if(state==='attack'&&(id==='knight'||heavy)){
    torsoYaw=stage==='recovery'?0.22*(1-ease(phase)):phase<0.72?-0.2*ease(phase/0.72):-0.2+0.42*ease((phase-0.72)/0.28);
    crouch+=wm.weight*(heavy?4:2);
    const swing=ease((phase-0.72)/0.28);
    shift=stage==='recovery'?3*(1-ease(phase)):wm.active?-2+5*swing:-wm.weight*2;
    lean=stage==='recovery'?0.08*(1-ease(phase)):wm.active?-0.055+0.135*swing:-wm.weight*0.055;
  }
  if(state==='attack'&&id==='elf'){crouch=1.5*(stage==='windup'?ease(phase):1-ease(phase));shift=1.2;}
  if(state==='attack'&&wolf){
    const swing=ease((phase-0.72)/0.28);
    shift=stage==='recovery'?5*(1-ease(phase)):phase<0.72?-3*ease(phase/0.72):-3+8*swing;
    crouch=stage==='recovery'?1.5*(1-ease(phase)):1.5*ease(phase);
  }
  if(state==='cast')crouch=2*Math.sin(phase*Math.PI);
  if(state==='dash'){const pulse=Math.sin(phase*Math.PI);crouch=7*pulse;lean=0.22*pulse;shift=7*pulse;}
  if(state==='dodge'){const pulse=Math.sin(phase*Math.PI);crouch=15*pulse;lean=0.13*Math.cos(rollAngle)*pulse;sideLean=0.12*Math.sin(rollAngle)*pulse;shift=4*Math.cos(rollAngle)*pulse;sideShift=3*Math.sin(rollAngle)*pulse;}
  if(state==='hit'){crouch=2*Math.sin(phase*Math.PI);shift=-4*Math.sin(phase*Math.PI);lean=-0.1*Math.sin(phase*Math.PI);torsoYaw=-0.08*Math.sin(phase*Math.PI);}
  if(state==='stagger'){crouch=8*Math.sin(phase*Math.PI);shift=-3*Math.sin(phase*Math.PI);lean=-0.16*Math.sin(phase*Math.PI);torsoYaw=-0.13*Math.sin(phase*Math.PI);}
  if(state==='turn'){shift=Math.sin(phase*TAU)*1.5;crouch=1.5;lean=Math.sin(phase*TAU)*0.04;}
  if(state==='death'){crouch=ease(phase/0.5)*(wolf?12:24);shift=-4*ease(phase);}
  let hipHeight=d.hip-crouch+bob;
  let pelvis=point(shift,authored.sway*motion+sideShift,hipHeight);
  let body=point(shift+lean*14,pelvis.y*0.55+sideLean*14,wolf?hipHeight+7:hipHeight+14);
  let head=point(wolf?24+shift:shift+lean*22+1,pelvis.y*0.3+sideLean*22,wolf?hipHeight+10:hipHeight+35-bob*0.65);
  const transition=options.transition&&!moving?options.transition:null;
  const prior=transition?characterRig(id,transition.sprintBlend>0.35?'sprint':transition.runBlend>0.4?'run':'walk',transition.gait,'',{stride:options.stride,motion:transition.motion??1,runBlend:transition.runBlend||0,sprintBlend:transition.sprintBlend||0}):null;
  if(prior){const w=transition.weight;pelvis=mix(pelvis,prior.pelvis,w);body=mix(body,prior.body,w);head=mix(head,prior.head,w);hipHeight=pelvis.z;lean=lean*(1-w)+prior.lean*w;torsoYaw=torsoYaw*(1-w)+prior.torsoYaw*w;}
  const shoulderZ=hipHeight+24,shoulderX=body.x;
  if(wolf&&state==='attack')head.x+=stage==='recovery'?6*(1-ease(phase/0.35)):6*ease((phase-0.72)/0.28);
  const movementAngle=options.movementAngle||0;
  const legs=layout.map((l,i)=>{
    let foot=rigFoot(gait+l.offset,stride,runBlend,sprintBlend);
    if(!moving){const pulse=Math.sin(phase*Math.PI),action=state==='dash'||state==='dodge';foot={x:(i%2?1:-1)*(2+(action?(state==='dash'?9:7)*pulse:0)),z:state==='dash'?pulse*(i%2?5:2):0,pitch:action?-0.12*pulse:0,planted:state!=='dash'||pulse<0.05};}
    if(state==='dodge'){const pulse=Math.sin(phase*Math.PI),side=Math.sign(l.y),lead=side*Math.sin(rollAngle)>0;foot.x=(i%2?2:-2)+side*7*pulse*Math.cos(rollAngle);foot.lateral=side*7*pulse*Math.sin(rollAngle);foot.z=lead?3*pulse:0;foot.planted=!lead||pulse<0.05;}
    if(state==='turn'){foot.x+=Math.sin((phase+l.offset)*TAU)*3;foot.z=Math.max(0,Math.sin((phase+l.offset)*TAU))*3;}
    if(prior){const old=prior.legs[i],t=transition.weight;foot.x=foot.x*(1-t)+(old.end.x-l.x)*t;foot.z=foot.z*(1-t)+(old.end.z-3)*t;foot.pitch=foot.pitch*(1-t)+old.foot.pitch*t;}
    const root=point(pelvis.x+l.x,pelvis.y+l.y,hipHeight+(wolf&&l.front?1:0));
    const ground=options.feet?.[i]||point(l.x+foot.x*Math.cos(movementAngle)*(moving?motion:1),l.y+(foot.lateral||0)+foot.x*Math.sin(movementAngle)*(moving?motion:1),foot.z*(moving?motion:1)+3);
    const soleLift=footSoleLift(id,foot.pitch,ground.z),target={...ground,z:ground.z+soleLift};
    const pole=point(wolf&&l.front?-1:1,0,0);
    const hock=wolf&&!l.front?plus(target,point(-d.hock*0.65,0,d.hock*Math.sqrt(1-0.65**2))):null;
    const solved=solveLimb(root,hock||target,wolf&&l.front?17:d.thigh,wolf&&l.front?18:d.shin,pole);
    return {...solved,hock:hock?solved.end:null,hockLength:hock?d.hock:0,end:hock?plus(solved.end,minus(target,hock)):solved.end,
      side:l.y,front:l.front,foot:{...foot,position:target,ground,soleLift,angle:options.feet?.[i]?.angle||0},index:i};
  });
  const arms=[];let weapon=null,shield=null,bowString=null;
  if(!wolf){
    let right=point(8,d.shoulder+1,hipHeight+8),left=point(6,-d.shoulder-1,hipHeight+9),tilt=0.22;
    const swing=moving?authored.arm*motion:0;
    const elbowLift=(runBlend*4+sprintBlend*5)*motion;
    if(id==='knight'){right=point(9+swing,14,hipHeight+7+elbowLift);left=point(7-swing*0.7,-17,hipHeight+17+elbowLift*0.4);tilt=0.22-runBlend*0.35-sprintBlend*0.2;}
    if(heavy){right=point(10,10,hipHeight+18);left=point(5,-5,hipHeight+12);}
    if(id==='elf'){right=point(7+swing,13,hipHeight+6+elbowLift);left=point(14-swing*0.5,-11,hipHeight+14+elbowLift*0.5);bowString={draw:0};}
    if(id==='caster'){right=point(11+swing*0.3,15,hipHeight+14+elbowLift*0.4);left=point(5-swing,-15,hipHeight+9+elbowLift);}
    if(moving){right.x+=shoulderX;left.x+=shoulderX;}
    if(heavy){tilt=state==='attack'?tilt:1.1+Math.sin(gait*TAU)*motion*0.08;left=plus(right,times(point(Math.sin(tilt),0,Math.cos(tilt)),-11));}
    if(state==='attack'&&(id==='knight'||heavy)){
      right={...wm.hand};tilt=wm.tilt;
      if(heavy)left=plus(right,times(point(Math.sin(tilt),0,Math.cos(tilt)),-11));
      else left=point(7,-17,hipHeight+20);
    }
    if(id==='elf'&&state==='attack'){
      const raise=stage==='windup'?ease(phase/0.2):1-ease(Math.max(0,(phase-0.25)/0.75));
      const pull=stage==='windup'?ease((phase-0.2)/0.8):1-ease(Math.min(1,phase*6));
      left=mix(left,point(25,-7,hipHeight+22),raise);
      right=mix(right,point(left.x-pull*24,left.y,left.z),raise);bowString={draw:pull};tilt=0;
    }
    if(state==='cast'){
      const channel=stage==='windup'?ease(phase):1-ease(phase);
      right=point(14,12,hipHeight+22+channel*8);left=point(13+channel*9,-12,hipHeight+23+channel*4);tilt=-0.08;
    }
    if(state==='dash'||state==='dodge'){const pulse=Math.sin(phase*Math.PI);right.x=right.x*(1-pulse)-8*pulse;left.x=left.x*(1-pulse)-6*pulse;right.z+=6*pulse;left.z+=4*pulse;tilt=tilt*(1-pulse)-0.25*pulse;}
    if(prior){const w=transition.weight;right=mix(right,prior.arms.find(a=>a.side===1).end,w);left=mix(left,prior.arms.find(a=>a.side===-1).end,w);tilt=tilt*(1-w)+prior.weapon.tilt*w;}
    for(const [side,target] of [[-1,left],[1,right]]){
      const root=point(shoulderX-side*d.shoulder*Math.sin(torsoYaw),body.y+side*d.shoulder*Math.cos(torsoYaw),shoulderZ);
      const solved=solveLimb(root,target,d.arm,d.forearm,point(-0.6,side*0.7,-0.7));
      arms.push({...solved,side});
    }
    const r=arms.find(a=>a.side===1).end,l=arms.find(a=>a.side===-1).end;
    const grip=id==='elf'?l:r,axis=point(Math.sin(tilt),0,Math.cos(tilt));
    const reach=id==='knight'?45:heavy?48:id==='elf'?27:43;
    const roll=heavy?(state!=='attack'?0.85:stage==='windup'?0.85*(1-ease(phase/0.5)):0.85*ease((phase-0.26)/0.74)):0;
    weapon={kind:id==='knight'?'sword':heavy?'axe':id==='elf'?'bow':'staff',grip,axis,tip:plus(grip,times(axis,reach)),length:reach,tilt,roll,active:state==='attack'&&wm.active};
    if(heavy){const hand=arms.find(a=>a.side===-1),target=plus(grip,times(axis,-11));Object.assign(hand,solveLimb(hand.root,target,d.arm,d.forearm,point(-0.5,-0.7,-0.7)));}
    if(id==='knight')shield={grip:l};
  }
  return {id,state,phase,stage,dimensions:d,pelvis,body,head,legs,arms,weapon,shield,bowString,lean,sideLean,torsoYaw,crouch,death:state==='death'?ease(phase):0,tail:point(-27+shift,0,hipHeight+9)};
}

export function weaponContactPath(id,angle){
  const points=[];
  for(let i=0;i<=10;i++){
    points.push(weaponTipAt(id,0.72+i*0.028,angle));
  }
  return points;
}

export function weaponTipAt(id,phase,angle){
  const rig=characterRig(id,'attack',phase,'windup');
  const p=id==='wolf'?point(rig.head.x+16,rig.head.y,rig.head.z-3):rig.weapon.tip;
  return {x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:p.x*Math.sin(angle)+p.y*Math.cos(angle),z:p.z};
}

// Plant contacts are stored in WORLD coordinates, so rotating the torso or
// changing velocity does not drag a supporting boot across the courtyard.
export function plantFeet(u,dt){
  if(u.hp<=0||u.roll||u.stagger>0){u.groundFeet=null;return;}
  const speed=Math.hypot(u.vx,u.vy),moving=speed>4&&!u.action;
  const motion=bound((u.moving||0)/0.5,0,1),runBlend=u.runBlend||0,sprintBlend=u.sprintBlend||0;
  const rig=characterRig(u.id,moving?(sprintBlend>0.35?'sprint':runBlend>0.4?'run':'walk'):'idle',u.gait%1,'',{stride:u.stride,motion,runBlend,sprintBlend,acceleration:u.acceleration,movementAngle:Math.atan2(Math.sin(u.moveFacing-u.facing),Math.cos(u.moveFacing-u.facing))});
  const layout=legLayout(u.id,runBlend,sprintBlend),stride=locomotionStride(u.stride,runBlend,sprintBlend,u.id);
  const world=p=>({x:u.x+p.x*Math.cos(u.facing)-p.y*Math.sin(u.facing),y:u.y+p.x*Math.sin(u.facing)+p.y*Math.cos(u.facing)});
  if(!u.groundFeet)u.groundFeet=rig.legs.map(leg=>({...world(leg.end),z:leg.end.z-leg.foot.soleLift,angle:u.facing,planted:leg.foot.planted,serial:0}));
  for(let i=0;i<rig.legs.length;i++){
    const leg=rig.legs[i],f=u.groundFeet[i],goal=world(leg.end),phase=((u.gait+layout[i].offset)%1+1)%1;
    if(!moving){
      // Complete one recovery step at a time on stopping, rather than dragging
      // two planted feet into an idle stance or snapping a stretched knee.
      if(!u.action&&f.planted&&!u.groundFeet.some(other=>other.settling)&&Math.hypot(goal.x-f.x,goal.y-f.y)>7){f.settling={x:f.x,y:f.y,elapsed:0};f.planted=false;}
      if(f.settling){
        f.settling.elapsed+=dt;const t=Math.min(1,f.settling.elapsed/0.19),blend=ease(t);
        f.x=f.settling.x+(goal.x-f.settling.x)*blend;f.y=f.settling.y+(goal.y-f.settling.y)*blend;f.z=3+Math.sin(t*Math.PI)*4;f.angle=u.facing;
        if(t>=1){f.settling=null;f.z=3;f.planted=true;f.serial++;}
      }else if(!f.planted){f.x+=(goal.x-f.x)*Math.min(1,dt*15);f.y+=(goal.y-f.y)*Math.min(1,dt*15);f.z+=(3-f.z)*Math.min(1,dt*22);if(f.z<3.05){f.z=3;f.planted=true;f.serial++;}}
    }else if(leg.foot.planted){
      f.settling=null;
      if(!f.planted){f.planted=true;f.z=3;f.serial++;}
    }else{
      f.settling=null;
      if(f.planted){f.start={x:f.x,y:f.y};f.planted=false;}
      const duty=leg.foot.duty,t=bound((phase-duty)/(1-duty),0,1),remaining=(1-phase)*stride/speed;
      const half=stride*duty/2,base=layout[i].x;
      const lateral=leg.side,local=point(base+half,lateral,0),landing=world(local);
      landing.x+=u.vx*remaining;landing.y+=u.vy*remaining;
      const start=f.start||f,blend=ease(t);f.x=start.x+(landing.x-start.x)*blend;f.y=start.y+(landing.y-start.y)*blend;f.z=3+Math.sin(t*Math.PI)**1.35*(8+runBlend*5+sprintBlend*5);f.angle=u.moveFacing;
    }
    const root=world(leg.root),reach=leg.upper+leg.lower-0.2;
    const hockOffset=leg.hock?world(minus(leg.hock,leg.end)):null;
    const targetX=f.x+(hockOffset?hockOffset.x-u.x:0),targetY=f.y+(hockOffset?hockOffset.y-u.y:0),targetZ=f.z+footSoleLift(u.id,leg.foot.pitch,f.z)+(leg.hock?leg.hock.z-leg.end.z:0);
    if(Math.hypot(targetX-root.x,targetY-root.y,targetZ-leg.root.z)>reach){
      // A collision or sharp reversal can force a support change. Replant it
      // explicitly rather than lengthening a shin to keep an impossible anchor.
      f.x=goal.x;f.y=goal.y;f.z=leg.end.z-leg.foot.soleLift;f.angle=u.facing;f.serial++;
    }
  }
}

export function localFootContacts(u){
  if(!u.groundFeet)return null;
  return u.groundFeet.map(f=>{
    const x=f.x-u.x,y=f.y-u.y;
    return {x:x*Math.cos(u.facing)+y*Math.sin(u.facing),y:-x*Math.sin(u.facing)+y*Math.cos(u.facing),z:f.z,angle:Math.atan2(Math.sin(f.angle-u.facing),Math.cos(f.angle-u.facing))};
  });
}
