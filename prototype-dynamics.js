import {characterRig,mix,ease} from './prototype-rig.js';
const copy=p=>({x:p.x,y:p.y,z:p.z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
// Constrained 3D particles: gravity, floor collisions and fixed anatomical
// lengths. Coordinates remain local to the creature's ground position.
export function createRagdoll(id,rig=characterRig(id),impulse={x:-90,y:24}){
  const points={},links=[];
  function point(name,p,mass=1){const floor=name==='head'?(id==='wolf'?9:['mech','spider'].includes(id)?12:id==='jelly'?6:15):name==='body'?15:name==='pelvis'?6:3;points[name]={...copy(p),floor,previous:{x:p.x-impulse.x/120*(name==='head'?1.2:0.5),y:p.y-impulse.y/120,z:p.z+(name==='head'?0.4:0)},mass};}
  function link(a,b){links.push({a,b,length:distance(points[a],points[b])});}
  point('pelvis',rig.pelvis,2.5);point('body',rig.body,2);point('head',rig.head,1.2);link('pelvis','body');link('body','head');
  rig.legs.forEach((l,i)=>{point('root'+i,l.root);point('knee'+i,l.joint);if(l.hock)point('hock'+i,l.hock);point('foot'+i,l.end);link('pelvis','root'+i);link('root'+i,'knee'+i);link('knee'+i,l.hock?'hock'+i:'foot'+i);if(l.hock)link('hock'+i,'foot'+i);});
  rig.arms.forEach((a,i)=>{point('shoulder'+i,a.root);point('elbow'+i,a.joint);point('hand'+i,a.end);link('body','shoulder'+i);link('shoulder'+i,'elbow'+i);link('elbow'+i,'hand'+i);});
  return {id,points,links,base:rig,time:0};
}
export function stepRagdoll(d,dt){
  d.time+=dt;
  for(const p of Object.values(d.points)){
    const old=copy(p),vx=(p.x-p.previous.x)*0.985,vy=(p.y-p.previous.y)*0.985,vz=(p.z-p.previous.z)*0.985;
    p.x+=vx;p.y+=vy;p.z+=vz-700*dt*dt;p.previous=old;
    if(p.z<p.floor){p.z=p.floor;p.previous.z=p.floor+vz*0.12;p.previous.x=p.x-vx*0.66;p.previous.y=p.y-vy*0.66;}
  }
  for(let iteration=0;iteration<12;iteration++)for(const l of d.links){
    const a=d.points[l.a],b=d.points[l.b],n=distance(a,b)||1,correction=(n-l.length)/n,wa=1/a.mass,wb=1/b.mass;
    const dx=(b.x-a.x)*correction,dy=(b.y-a.y)*correction,dz=(b.z-a.z)*correction;
    a.x+=dx*wa/(wa+wb);a.y+=dy*wa/(wa+wb);a.z=Math.max(a.floor,a.z+dz*wa/(wa+wb));
    b.x-=dx*wb/(wa+wb);b.y-=dy*wb/(wa+wb);b.z=Math.max(b.floor,b.z-dz*wb/(wa+wb));
  }
}
export function ragdollRig(d,recover=0){
  const base=d.base,idle=characterRig(d.id,'idle',0),p=d.points,get=(name,target)=>{const q={x:p[name].x-p.pelvis.x,y:p[name].y-p.pelvis.y,z:p[name].z};return recover?mix(q,target,ease(recover)):q;};
  const rig={...base,ragdoll:true,state:recover?'getup':'death',death:recover?1-recover:Math.min(1,d.time/0.4),phase:Math.min(1,d.time),pelvis:get('pelvis',idle.pelvis),body:get('body',idle.body),head:get('head',idle.head),lean:0,sideLean:0,torsoYaw:0};
  rig.legs=base.legs.map((l,i)=>({...l,root:get('root'+i,idle.legs[i].root),joint:get('knee'+i,idle.legs[i].joint),hock:l.hock?get('hock'+i,idle.legs[i].hock):null,end:get('foot'+i,idle.legs[i].end)}));
  rig.arms=base.arms.map((a,i)=>({...a,root:get('shoulder'+i,idle.arms[i].root),joint:get('elbow'+i,idle.arms[i].joint),end:get('hand'+i,idle.arms[i].end)}));
  if(rig.weapon){const original=base.weapon,grip=rig.arms.length?rig.arms.find(a=>a.side===(['elf','fox'].includes(d.id)?-1:1)).end:rig.head;rig.weapon={...original,grip,axis:{x:1,y:0,z:0},tip:{x:grip.x+original.length,y:grip.y,z:grip.z}};}
  if(rig.shield)rig.shield={grip:rig.arms.find(a=>a.side===-1).end};
  rig.tail={x:rig.pelvis.x-27,y:rig.pelvis.y,z:rig.pelvis.z+2};
  if(d.id==='jelly')rig.squash=1+Math.min(1,d.time)*2*(1-recover);
  return rig;
}
const previewCache=new Map();
export function previewRagdoll(id,phase,recover=false){
  const key=id+':'+phase.toFixed(7)+':'+recover;if(previewCache.has(key))return previewCache.get(key);
  const d=createRagdoll(id,characterRig(id,'idle',0));for(let i=0;i<Math.round(Math.min(1,phase)*100);i++)stepRagdoll(d,1/120);
  if(recover)for(let i=0;i<100;i++)stepRagdoll(d,1/120);
  const rig=ragdollRig(d,recover?phase:0);previewCache.set(key,rig);if(previewCache.size>512)previewCache.delete(previewCache.keys().next().value);return rig;
}
export function stepCape(u,dt){
  if(!u.cape)u.cape=[{angle:0,velocity:0},{angle:0,velocity:0},{angle:0,velocity:0}];
  const drive=Math.min(1.5,Math.hypot(u.vx,u.vy)/u.run),turn=Math.sin(u.moveFacing-u.facing);
  u.cape.forEach((panel,i)=>{const target=drive*0.7+turn*(i-1)*0.35+Math.sin(u.gait*Math.PI*2-i*0.6)*drive*0.14;panel.velocity+=(target-panel.angle)*65*dt;panel.velocity*=Math.exp(-8*dt);panel.angle+=panel.velocity*dt;});
}

export function impactImpulse(u){const c=Math.cos(u.facing),s=Math.sin(u.facing);return {x:(u.ix*c+u.iy*s)*0.65,y:(-u.ix*s+u.iy*c)*0.65};}
