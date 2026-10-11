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
  knight:{hip:52,thigh:25,shin:25,stance:7,shoulder:15,arm:18,forearm:17,bodyW:37,bodyH:38,headW:29,headH:29,legW:14,calfW:12,armW:12,footW:17},
  orc:{hip:45,thigh:22,shin:22,stance:10,shoulder:21,arm:20,forearm:19,bodyW:54,bodyH:46,headW:35,headH:34,legW:20,calfW:17,armW:17,footW:22},
  elf:{hip:52,thigh:25,shin:25,stance:6.5,shoulder:13,arm:18,forearm:17,bodyW:33,bodyH:37,headW:27,headH:28,legW:13,calfW:11,armW:10,footW:16},
  caster:{hip:50,thigh:24,shin:24,stance:7,shoulder:14,arm:17,forearm:16,bodyW:35,bodyH:40,headW:30,headH:30,legW:15,calfW:12,armW:12,footW:17},
  wolf:{hip:34,thigh:19,shin:18,stance:7,bodyW:61,bodyH:31,headW:35,headH:27,legW:10,calfW:8,footW:12},
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

export function rigFoot(phase,stride,running=false){
  const run=typeof running==='number'?bound(running,0,1):running?1:0;
  const duty=0.58-0.15*run,p=((phase%1)+1)%1,half=stride*duty/2;
  if(p<duty)return {x:half-p*stride,z:0,pitch:0,planted:true};
  const t=(p-duty)/(1-duty);
  return {x:-half+2*half*ease(t),z:Math.sin(Math.PI*t)*(7+run*4),pitch:Math.sin(Math.PI*t)*0.35,planted:false};
}

function weaponMotion(id,phase,stage){
  const heavy=id==='orc',rest=point(heavy?10:9,heavy?4:14,heavy?63:59);
  const raised=point(heavy?-8:-11,heavy?3:13,heavy?81:85);
  const contact=point(heavy?22:21,heavy?2:12,heavy?60:61);
  const follow=point(heavy?25:25,heavy?-8:-4,heavy?47:51);
  if(stage==='windup'){
    if(phase<0.72){const t=ease(phase/0.72);return {hand:mix(rest,raised,t),tilt:0.22+(-1.05-0.22)*t,active:false,weight:t};}
    const t=ease((phase-0.72)/0.28);return {hand:mix(raised,contact,t),tilt:-1.05+(1.53+1.05)*t,active:true,weight:1-t*0.4};
  }
  if(stage==='recovery'){
    if(phase<0.26){const t=ease(phase/0.26);return {hand:mix(contact,follow,t),tilt:1.53+(2.1-1.53)*t,active:true,weight:0.6*(1-t)};}
    const t=ease((phase-0.26)/0.74);return {hand:mix(follow,rest,t),tilt:2.1+(0.22-2.1)*t,active:false,weight:0};
  }
  return {hand:rest,tilt:0.22,active:false,weight:0};
}

export function characterRig(id,state='idle',phase=0,stage='',options={}){
  const d=RIGS[id],wolf=id==='wolf',heavy=id==='orc',moving=state==='walk'||state==='run',running=state==='run';
  const motion=moving?(options.motion??1):0,gait=phase;
  const runBlend=options.runBlend??(running?1:0);
  const breath=Math.sin(phase*TAU)*0.25;
  const bob=moving?(running?1.2:0.55)*Math.cos(gait*TAU*2)*motion:breath;
  let crouch=moving?(wolf?4.5:6+runBlend)*motion:0,shift=0,lean=0;
  const wm=weaponMotion(id,phase,(state==='attack'?stage:''));
  if(state==='attack'&&(id==='knight'||heavy)){
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
  if(state==='dash'){crouch=10;lean=0.2;shift=7;}
  if(state==='dodge'){crouch=15*Math.sin(phase*Math.PI);lean=-0.13*Math.sin(phase*Math.PI);shift=-4;}
  if(state==='hit'){crouch=2*Math.sin(phase*Math.PI);shift=-4*Math.sin(phase*Math.PI);}
  if(state==='stagger'){crouch=8*Math.sin(phase*Math.PI);shift=-3*Math.sin(phase*Math.PI);}
  if(state==='turn'){shift=Math.sin(phase*TAU)*1.5;crouch=1.5;lean=Math.sin(phase*TAU)*0.04;}
  if(state==='death'){crouch=ease(phase/0.5)*(wolf?12:24);shift=-4*ease(phase);}
  const hipHeight=d.hip-crouch+bob;
  const pelvis=point(shift,Math.sin(gait*TAU)*motion*0.6,hipHeight);
  const body=point(shift+lean*14,0,wolf?hipHeight+7:hipHeight+18);
  const shoulderZ=hipHeight+32;
  const head=point(wolf?24+shift:shift+lean*22+1,0,wolf?hipHeight+10:hipHeight+49-bob*0.65);
  if(wolf&&state==='attack')head.x+=stage==='recovery'?6*(1-ease(phase/0.35)):6*ease((phase-0.72)/0.28);
  const movementAngle=options.movementAngle||0;
  const layout=wolf?[{x:18,y:-7,offset:0,front:true},{x:-18,y:-7,offset:0.5,front:false},{x:18,y:7,offset:0.5,front:true},{x:-18,y:7,offset:0,front:false}]:[{x:0,y:-d.stance,offset:0},{x:0,y:d.stance,offset:0.5}];
  const legs=layout.map((l,i)=>{
    let foot=rigFoot(gait+l.offset,options.stride||(wolf?72:heavy?82:76),runBlend);
    if(!moving)foot={x:state==='dash'?(i%2?11:-11):state==='dodge'?(i%2?9:-9):(i%2?2:-2),z:0,pitch:0,planted:true};
    if(state==='turn'){foot.x+=Math.sin((phase+l.offset)*TAU)*3;foot.z=Math.max(0,Math.sin((phase+l.offset)*TAU))*3;}
    if(options.transition&&!moving){const old=rigFoot(options.transition.gait+l.offset,options.stride||76,false),t=options.transition.weight;foot.x=foot.x*(1-t)+old.x*t;foot.z=old.z*t;}
    const root=point(pelvis.x+l.x,l.y,hipHeight+(wolf&&l.front?1:0));
    const target=options.feet?.[i]||point(l.x+foot.x*Math.cos(movementAngle)*(moving?motion:1),l.y+foot.x*Math.sin(movementAngle)*(moving?motion:1),foot.z*(moving?motion:1)+3);
    const pole=point(wolf&&l.front?-1:1,0,0);
    const solved=solveLimb(root,target,wolf&&l.front?17:d.thigh,wolf&&l.front?18:d.shin,pole);
    return {...solved,side:l.y,front:l.front,foot:{...foot,position:solved.end,angle:options.feet?.[i]?.angle||0},index:i};
  });
  const arms=[];let weapon=null,shield=null,bowString=null;
  if(!wolf){
    let right=point(8,d.shoulder+1,hipHeight+8),left=point(6,-d.shoulder-1,hipHeight+9),tilt=0.22;
    const swing=moving?Math.sin(gait*TAU)*6*motion:0;
    if(id==='knight'){right=point(9+swing,14,hipHeight+7);left=point(7,-17,hipHeight+17);}
    if(heavy){right=point(10,4,hipHeight+18);left=point(5,-5,hipHeight+12);}
    if(id==='elf'){right=point(7+swing,13,hipHeight+6);left=point(14-swing*0.25,-11,hipHeight+14);}
    if(id==='caster'){right=point(11,15,hipHeight+14);left=point(5-swing,-15,hipHeight+9);}
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
    if(state==='dash'||state==='dodge'){right.x=-8;left.x=-6;right.z+=6;left.z+=4;tilt=-0.25;}
    for(const [side,target] of [[-1,left],[1,right]]){
      const root=point(pelvis.x,side*d.shoulder,shoulderZ);
      const solved=solveLimb(root,target,d.arm,d.forearm,point(-0.6,side*0.7,-0.7));
      arms.push({...solved,side});
    }
    const r=arms.find(a=>a.side===1).end,l=arms.find(a=>a.side===-1).end;
    const grip=id==='elf'?l:r,axis=point(Math.sin(tilt),0,Math.cos(tilt));
    const reach=id==='knight'?45:heavy?48:id==='elf'?27:43;
    weapon={kind:id==='knight'?'sword':heavy?'axe':id==='elf'?'bow':'staff',grip,axis,tip:plus(grip,times(axis,reach)),length:reach,tilt,active:state==='attack'&&wm.active};
    if(heavy){const hand=arms.find(a=>a.side===-1),target=plus(grip,times(axis,-11));Object.assign(hand,solveLimb(hand.root,target,d.arm,d.forearm,point(-0.5,-0.7,-0.7)));}
    if(id==='knight')shield={grip:l};
  }
  return {id,state,phase,stage,dimensions:d,pelvis,body,head,legs,arms,weapon,shield,bowString,lean,crouch,death:state==='death'?ease(phase):0,tail:point(-27+shift,0,hipHeight+9)};
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
  const motion=bound((u.moving||0)/0.5,0,1),runBlend=bound(((u.moving||0)-0.55)/0.35,0,1);
  const rig=characterRig(u.id,moving?(u.moving>0.72?'run':'walk'):'idle',u.gait%1,'',{stride:u.stride,motion,runBlend,movementAngle:Math.atan2(Math.sin(u.moveFacing-u.facing),Math.cos(u.moveFacing-u.facing))});
  const world=p=>({x:u.x+p.x*Math.cos(u.facing)-p.y*Math.sin(u.facing),y:u.y+p.x*Math.sin(u.facing)+p.y*Math.cos(u.facing)});
  if(!u.groundFeet)u.groundFeet=rig.legs.map(leg=>({...world(leg.end),z:leg.end.z,angle:u.facing,planted:leg.foot.planted,serial:0}));
  for(let i=0;i<rig.legs.length;i++){
    const leg=rig.legs[i],f=u.groundFeet[i],goal=world(leg.end),phase=((u.gait+(u.id==='wolf'?[0,0.5,0.5,0][i]:i*0.5))%1+1)%1;
    if(!moving){
      if(!f.planted){f.x+=(goal.x-f.x)*Math.min(1,dt*15);f.y+=(goal.y-f.y)*Math.min(1,dt*15);f.z+=(3-f.z)*Math.min(1,dt*22);if(f.z<3.05){f.z=3;f.planted=true;f.serial++;}}
    }else if(leg.foot.planted){
      if(!f.planted){f.planted=true;f.z=3;f.serial++;}
    }else{
      if(f.planted){f.start={x:f.x,y:f.y};f.planted=false;}
      const duty=0.58-0.15*runBlend,t=bound((phase-duty)/(1-duty),0,1),remaining=(1-phase)*u.stride/speed;
      const half=u.stride*duty/2,base=u.id==='wolf'?(i%2===0?18:-18):0;
      const lateral=leg.side,local=point(base+half,lateral,0),landing=world(local);
      landing.x+=u.vx*remaining;landing.y+=u.vy*remaining;
      const start=f.start||f,blend=ease(t);f.x=start.x+(landing.x-start.x)*blend;f.y=start.y+(landing.y-start.y)*blend;f.z=3+Math.sin(t*Math.PI)*(7+runBlend*4);f.angle=u.moveFacing;
    }
    const root=world(leg.root),reach=leg.upper+leg.lower-0.2;
    if(Math.hypot(f.x-root.x,f.y-root.y,f.z-leg.root.z)>reach){
      // A collision or sharp reversal can force a support change. Replant it
      // explicitly rather than lengthening a shin to keep an impossible anchor.
      f.x=goal.x;f.y=goal.y;f.z=leg.end.z;f.angle=u.facing;f.serial++;
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
