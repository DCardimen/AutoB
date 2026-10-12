import {createRagdoll,ragdollRig,stepRagdoll} from './prototype-dynamics.js';
import {characterRig,projectRig} from './prototype-rig.js';
import {nativeFormRig} from './native-forms.js';
import {nativeRigFor} from './grand-designs.js';
import {creatureWorldScale,nativeEntityBounds} from './native-size.js';
import {pixelSpec} from './native-content.js';
import {NATIVE_BOUNDS,nativeSpawn} from './native-combat.js';
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
function heldStep(d,dt,key){const pin=d.pin,points=d.points;d.time+=dt;for(const [name,p]of Object.entries(points)){if(name===key){Object.assign(p,pin);p.previous={...pin};continue;}const old={x:p.x,y:p.y,z:p.z},vx=(p.x-p.previous.x)*.985,vy=(p.y-p.previous.y)*.985,vz=(p.z-p.previous.z)*.985;p.x+=vx;p.y+=vy;p.z=Math.max(p.floor,p.z+vz-700*dt*dt);p.previous=old;}for(let i=0;i<14;i++)for(const l of d.links){const a=points[l.a],b=points[l.b],len=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)||1,k=(len-l.length)/len,wa=l.a===key?0:1/a.mass,wb=l.b===key?0:1/b.mass;for(const axis of ['x','y','z']){const c=(b[axis]-a[axis])*k;if(wa)a[axis]+=c*wa/(wa+wb);if(wb)b[axis]-=c*wb/(wa+wb);}a.z=Math.max(a.floor,a.z);b.z=Math.max(b.floor,b.z);Object.assign(points[key],pin);}}
export class DeploymentPhysics{
 constructor(){this.held=null;this.drops=new Map();}
 begin(c,index,pointer,height=1){const spec=pixelSpec(c.id),id=nativeRigFor(spec,c),scale=creatureWorldScale(spec,c),position=nativeSpawn(spec,c,0,index),source=characterRig(id,'idle',.25),d=createRagdoll(id,source,{x:0,y:0}),formed=nativeFormRig(spec,c,source,height),candidates=[];
 const add=(key,p)=>{const q=projectRig(p,0);candidates.push({key,distance:Math.hypot(pointer.x-position.x-q.x*scale,pointer.y-(position.y*.58+75+q.y*scale))});};
 add('head',formed.head);add('body',formed.body);add('pelvis',formed.pelvis);formed.legs.forEach((l,i)=>{add('foot'+i,l.end);add('knee'+i,l.joint);});formed.arms.forEach((a,i)=>add('hand'+i,a.end));
 if(source.weapon){const p=source.weapon.tip;d.points.weapon={...p,previous:{...p},floor:3,mass:1};const arm=source.arms.findIndex(a=>a.side===(['elf','fox'].includes(id)?-1:1)),anchor=arm>=0?'hand'+arm:'head';d.links.push({a:anchor,b:'weapon',length:Math.hypot(p.x-d.points[anchor].x,p.y-d.points[anchor].y,p.z-d.points[anchor].z)});add('weapon',formed.weapon.tip);}
 const nearest=candidates.sort((a,b)=>a.distance-b.distance)[0];if(nearest.distance>Math.max(18,26*scale))return false;
 const p=d.points[nearest.key];d.pin={x:p.x,y:p.y,z:p.z+45/Math.max(.5,scale)};this.held={c,index,spec,id,scale,d,key:nearest.key,pointer:{...pointer},position,height};this.drops.delete(c.uid);return true;}
 move(pointer){if(!this.held)return;const h=this.held,dx=limit((pointer.x-h.pointer.x)/h.scale,-45,45),dy=limit((pointer.y-h.pointer.y)/(h.scale*.58),-45,45);for(const [key,p] of Object.entries(h.d.points)){if(key===h.key)continue;p.x-=dx;p.y-=dy;p.previous.x-=dx;p.previous.y-=dy;}h.pointer={...pointer};}
 rig(state){
  const rig=ragdollRig(state.d);rig.death=0;rig.state='pickup';
  if(state.d.points.weapon&&rig.weapon){const p=state.d.points.weapon,pelvis=state.d.points.pelvis;rig.weapon.tip={x:p.x-pelvis.x,y:p.y-pelvis.y,z:p.z};}
  const points=new Set([rig.head,rig.body,rig.pelvis,rig.tail,...rig.legs.flatMap(l=>[l.root,l.joint,l.hock,l.end]),...rig.arms.flatMap(a=>[a.root,a.joint,a.end]),rig.weapon?.grip,rig.weapon?.tip,rig.shield?.grip,...(rig.wings||[]).flat(),...(rig.segments||[])] .filter(Boolean));
  const offset=Math.max(0,Math.max(...[...points].map(p=>p.z))-75);if(offset)for(const p of points)p.z-=offset;
  return rig;
 }

 update(dt){if(this.held){const h=this.held;for(let left=dt;left>0;left-=1/120)heldStep(h.d,Math.min(left,1/120),h.key);const rig=nativeFormRig(h.spec,h.c,this.rig(h),h.height),key=h.key,p=key==='head'?rig.head:key==='body'?rig.body:key==='pelvis'?rig.pelvis:key==='weapon'?rig.weapon.tip:key.startsWith('foot')?rig.legs[+key.slice(4)].end:key.startsWith('knee')?rig.legs[+key.slice(4)].joint:rig.arms[+key.slice(4)].end,q=projectRig(p,0);h.position={x:h.pointer.x-q.x*h.scale,y:(h.pointer.y-75-q.y*h.scale)/.58};}
 for(const [uid,state]of this.drops){state.elapsed+=dt;for(let left=dt;left>0;left-=1/120)stepRagdoll(state.d,Math.min(left,1/120));if(state.elapsed>1.15)this.drops.delete(uid);}}
 release(){const h=this.held;if(!h)return null;const bounds=nativeEntityBounds(h.spec,h.c,NATIVE_BOUNDS),r=22*h.scale;h.position.x=limit(h.position.x,bounds.left+r,Math.min(450,bounds.right-r));h.position.y=limit(h.position.y,bounds.top+r,bounds.bottom-r);h.c.deploymentPosition={...h.position};delete h.d.pin;h.elapsed=0;this.drops.set(h.c.uid,h);this.held=null;return h.c;}
 preview(c){const state=this.held?.c.uid===c.uid?this.held:this.drops.get(c.uid);if(!state)return c;const recover=state.elapsed>0.65?Math.min(1,(state.elapsed-.65)/.5):0;let rig=this.rig(state);if(recover)rig=ragdollRig(state.d,recover);rig.death=0;return {...c,deploymentPosition:state.position,deploymentRig:rig};}
}
