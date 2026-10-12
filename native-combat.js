import {nativeFormRig,formProfile} from './native-forms.js';
import {PROTOTYPE_BY_ID,makePrototypeUnit} from './prototype-engine.js';
import {characterRig,weaponTipAt,plantFeet,locomotionStride} from './prototype-rig.js';
import {stepCape,createRagdoll,stepRagdoll} from './prototype-dynamics.js';
import {NATIVE_BOSS_RIGS,nativeEvolution} from './native-content.js';
export const NATIVE_BOUNDS={left:70,right:930,top:110,bottom:805};
export function actorId(spec,unit={}){return spec.nativeRig||(unit.boss?NATIVE_BOSS_RIGS[spec.id]:null);}
export function nativeSpawn(spec,unit,side,index){
 const d=unit.deployment||{row:index%3,column:index>=3?1:spec.range>100?0:2};
 return side===0?{x:[155,230,305][d.column],y:[220,435,650][d.row]+(index>=3?22:-12)}:{x:(spec.range>100?825:710)+(index>=3?28:-25),y:[220,435,650][index%3]+(index>=3?22:-12)};
}
export function initializeNative(u,spec){
 const id=actorId(spec,u);if(!id)return;
 u.nativeActor=makePrototypeUnit(id,u.side,0,u.x,u.y);u.nativeActor.uid=u.uid;u.nativeActor.family=spec;u.nativeActor.stride=formProfile(spec,u).stride||u.nativeActor.stride;
 u.facing=u.side?Math.PI:0;u.meleeCount=0;u.nativeActor.facing=u.facing;u.nativeActor.moveFacing=u.facing;
 u.maxPoise+=(nativeEvolution(u).poise||0);
}
export function nativeAction(u,angle,windup,recovery,options={}){
 if(!u.nativeActor)return;
 const a=u.nativeActor;a.transitionFoot={gait:a.gait,moving:a.moving,runBlend:a.runBlend,sprintBlend:a.sprintBlend,time:u.nativeClock||0,duration:Math.min(.2,windup*.65)};
 u.nativeAction={elapsed:0,windup,duration:windup+recovery,angle,style:options.style||'overhead',charged:!!options.charged,anticipation:options.charged?3:options.heavy?2:1,released:false,...options};
 u.facing=angle;u.nativeActor.facing=angle;u.nativeActor.groundFeet=null;
}
export function advanceNative(u,dt,time){
 const a=u.nativeActor;if(!a)return;
 const velocity=Math.hypot(u.velocityX,u.velocityY),speed=u.speed||80;
 a.stopTime=Math.max(0,(a.stopTime||0)-dt);a.turnTime=Math.max(0,(a.turnTime||0)-dt);a.turnCooldown=Math.max(0,(a.turnCooldown||0)-dt);
 if((a.previousSpeed||0)>35&&velocity<(a.previousSpeed||0)*.65&&!u.nativeAction)a.stopTime=.24;
 a.acceleration=Math.max(-1,Math.min(1,(velocity-(a.previousSpeed||0))/(dt*390)));a.previousSpeed=velocity;u.nativeClock=time;
 a.hp=u.hp;a.x=u.x;a.y=u.y;a.vx=u.velocityX;a.vy=u.velocityY;a.ix=u.impulseX;a.iy=u.impulseY;
 a.speed=speed;a.run=speed*1.65;a.sprint=speed*2.15;a.stamina=u.stamina;
 a.runBlend+=(Math.max(0,Math.min(1,(velocity-speed)/(a.run-speed)))-a.runBlend)*Math.min(1,dt*10);
 a.sprintBlend+=(Math.max(0,Math.min(1,(velocity-a.run)/(a.sprint-a.run)))-a.sprintBlend)*Math.min(1,dt*10);
 const change=(target)=>Math.atan2(Math.sin(target-u.facing),Math.cos(target-u.facing));
 const target=u.nativeAction?.angle??(velocity>4?Math.atan2(u.velocityY,u.velocityX):u.targetMemory?Math.atan2(u.targetMemory.y-u.y,u.targetMemory.x-u.x):u.facing);
 const turn=change(target);if(Math.abs(turn)>.9&&a.turnCooldown<=0&&!u.nativeAction){a.turnTime=.32;a.turnCooldown=.6;}u.facing+=Math.max(-dt*6,Math.min(dt*6,turn));a.facing=u.facing;
 a.moveFacing=velocity>4?Math.atan2(u.velocityY,u.velocityX):a.moveFacing;a.turning=Math.abs(turn);
 a.gait+=Math.hypot(u.x-(u.px??u.x),u.y-(u.py??u.y))/locomotionStride(a.stride,a.runBlend,a.sprintBlend,a.id);
 a.moving=u.actionLock>0?0:Math.min(1,velocity/(a.run||1));
 a.hitTime=u.nativeAction?.charged?0:Math.min(.13,u.hitAnim||0);a.stagger=u.stagger||0;
 a.roll=u.rollTime>0?{kind:'dodge',elapsed:.25-u.rollTime,duration:.25,dx:u.rollX,dy:u.rollY}:u.dashMotion?{kind:'dash',elapsed:Math.max(0,u.dashDuration-u.dashAnim),duration:u.dashDuration,dx:u.dashMotion.x,dy:u.dashMotion.y}:null;
 if(u.stagger>0&&!u.nativeAction?.charged)u.nativeAction=null;
 if(u.nativeAction){u.nativeAction.elapsed+=dt;u.nativeAction.released=u.nativeAction.elapsed>=u.nativeAction.windup;if(u.nativeAction.elapsed>=u.nativeAction.duration)u.nativeAction=null;}
 a.action=u.nativeAction;a.casts=!!u.nativeAction?.casting||a.id==='caster'||a.id==='jelly';
 a.deathTime=u.deathTime||0;a.knockdown=u.nativeKnockdown||0;a.getup=u.nativeGetup||0;
 if(a.knockdown>0&&!a.ragdoll)a.ragdoll=createRagdoll(a.id,characterRig(a.id,"hit",.25),{x:-65,y:24});
 if(u.hp>0&&!a.knockdown&&!a.getup)a.ragdoll=null;
 if(u.hp<=0&&!a.ragdoll)a.ragdoll=createRagdoll(a.id,characterRig(a.id,'hit',.2),{x:-60,y:20});
 if(a.ragdoll){for(let left=dt;left>1e-7;left-=1/120)stepRagdoll(a.ragdoll,Math.min(left,1/120));}
 for(let left=dt;left>1e-7;left-=1/120)stepCape(a,Math.min(left,1/120));
 plantFeet(a,dt);

}
export function nativeBladePoint(u,strike,phase){
 const rig=nativeFormRig(u.nativeActor.family,u,characterRig(u.nativeActor.id,'attack',phase,'windup',{swing:strike.style,charged:strike.charged})),angle=Math.atan2(strike.dy,strike.dx),tip=rig.weapon?.tip||(u.nativeActor.id==='wolf'?{...rig.head,x:rig.head.x+16,z:rig.head.z-3}:rig.head);
 const point={x:tip.x*Math.cos(angle)-tip.y*Math.sin(angle),y:tip.x*Math.sin(angle)+tip.y*Math.cos(angle),z:tip.z};
 return {x:u.x+point.x,y:u.y+point.y,z:point.z};
}
export function nativeHeavy(u){return ['knight','orc'].includes(u.nativeActor?.id);}
export function nativeMuzzle(u,target){
 if(!u.nativeActor)return {x:u.x,y:u.y-15,z:45};
 const id=u.nativeActor.id,angle=Math.atan2(target.y-u.y,target.x-u.x),rig=nativeFormRig(u.nativeActor.family,u,characterRig(id,['caster','jelly'].includes(id)?'cast':'attack',1,'windup'));
 const hand=['elf','fox'].includes(id)?rig.weapon.grip:rig.weapon?.tip||rig.head;
 return {x:u.x+hand.x*Math.cos(angle)-hand.y*Math.sin(angle),y:u.y+hand.x*Math.sin(angle)+hand.y*Math.cos(angle)-14,z:hand.z};
}
export function finishNativeVisuals(battle,dt){
 if(!battle?.units?.some(u=>u.nativeActor))return;
 for(const u of battle.units){const a=u.nativeActor;if(!a)continue;a.hp=u.hp;a.action=null;a.moving=0;a.roll=null;a.stopTime=Math.max(0,(a.stopTime||0)-dt);a.turnTime=Math.max(0,(a.turnTime||0)-dt);if(u.hp<=0){u.deathTime+=dt;a.deathTime=u.deathTime;if(!a.ragdoll)a.ragdoll=createRagdoll(a.id);if(a.ragdoll.time<2)for(let left=dt;left>1e-7;left-=1/120)stepRagdoll(a.ragdoll,Math.min(left,1/120));}for(let left=dt;left>1e-7;left-=1/120)stepCape({...a,vx:0,vy:0},Math.min(left,1/120));}
}
