import {nativeFormRig,formProfile} from './native-forms.js';
import {PROTOTYPE_BY_ID,makePrototypeUnit} from './prototype-engine.js';
import {characterRig,weaponTipAt,plantFeet,locomotionStride} from './prototype-rig.js';
import {stepCape,createRagdoll,stepRagdoll} from './prototype-dynamics.js';
import {NATIVE_BOSS_RIGS,nativeEvolution,pixelSpec} from './native-content.js';
import {nativeRigFor,capeSpecification} from './grand-designs.js';
import {creatureWorldScale,nativeEntityBounds} from './native-size.js';
import {stepPhysicalCape} from './native-cloth.js';
import {equipmentEffects} from './creature-equipment.js';
import {spriteSample} from './prototype-sprites.js';
import {ragdollRig} from './prototype-dynamics.js';
import {advanceCombatTexts} from './combat-text.js';
import {CREATURE_ATTACK_EFFECTS} from './creature-attacks.js';
export const NATIVE_BOUNDS={left:170,right:832,top:230,bottom:740};
export function actorId(spec,unit={}){return nativeRigFor(pixelSpec(spec.id)||spec,unit)||(unit.boss?NATIVE_BOSS_RIGS[spec.id]:null);}
export function nativeSpawn(spec,unit,side,index){
 if(unit.deploymentPosition){const bounds=nativeEntityBounds(pixelSpec(spec.id)||spec,unit,NATIVE_BOUNDS),p=unit.deploymentPosition;return {x:Math.max(bounds.left+6,Math.min(bounds.right-6,p.x)),y:Math.max(bounds.top+6,Math.min(bounds.bottom-6,p.y))};}
 const d=unit.deployment||{row:index%3,column:index>=3?1:spec.range>100?0:2};
 const position=side===0?{x:[245,305,365][d.column],y:[300,470,640][d.row]+(index>=3?22:-12)}:{x:(spec.range>100?757:647)+(index>=3?28:-25),y:[300,470,640][index%3]+(index>=3?22:-12)};
 const size=creatureWorldScale(pixelSpec(spec.id)||spec,unit),bounds=nativeEntityBounds(pixelSpec(spec.id)||spec,unit,NATIVE_BOUNDS),radius=(spec.bodyRadius||22)*size;return {x:Math.max(bounds.left+radius,Math.min(bounds.right-radius,position.x)),y:Math.max(bounds.top+radius,Math.min(bounds.bottom-radius,position.y))};
}
export function initializeNative(u,spec,tuning){
 spec=pixelSpec(spec.id)||spec;const id=actorId(spec,u);if(!id)return;
 u.nativeAttackEffect=CREATURE_ATTACK_EFFECTS[spec.nativeDesign||spec.nativeRig];
 u.nativeScale=creatureWorldScale(spec,u,tuning);u.radius*=u.nativeScale;u.range=spec.range>100?u.range:u.range*u.nativeScale;u.mass*=Math.max(.5,u.nativeScale);u.entityBounds=nativeEntityBounds(spec,u,NATIVE_BOUNDS,tuning);u.y=Math.max(u.y,u.entityBounds.top+u.radius);u.py=u.y;
 u.nativeActor=makePrototypeUnit(id,u.side,0,u.x,u.y);u.nativeActor.uid=u.uid;u.nativeActor.family=spec;u.nativeActor.creature=u;u.nativeActor.rigScale=u.nativeScale;u.nativeActor.stride=formProfile(spec,u).stride||u.nativeActor.stride;
 u.facing=u.side?Math.PI:0;u.meleeCount=0;u.nativeActor.facing=u.facing;u.nativeActor.moveFacing=u.facing;
 const gear=equipmentEffects(u);u.maxPoise+=(nativeEvolution(u).poise||0)+gear.poise;u.shield+=gear.shield;
}
export function nativeAction(u,angle,windup,recovery,options={}){
 if(!u.nativeActor)return;
 const a=u.nativeActor;a.transitionFoot={gait:a.gait,moving:a.moving,runBlend:a.runBlend,sprintBlend:a.sprintBlend,time:u.nativeClock||0,duration:Math.min(.2,windup*.65)};
 u.nativeAction={elapsed:0,windup,duration:windup+recovery,angle,style:options.style||'overhead',charged:!!options.charged,anticipation:options.charged?3:options.heavy?2:1,released:false,...options};
 u.facing=angle;u.nativeActor.facing=angle;u.nativeActor.groundFeet=null;
}
export function advanceNative(u,dt,time,visuals=true,actionDt=dt){
 const a=u.nativeActor;if(!a)return;
 const velocity=Math.hypot(u.velocityX,u.velocityY),speed=u.speed||80;
 a.stopTime=Math.max(0,(a.stopTime||0)-dt);a.turnTime=Math.max(0,(a.turnTime||0)-dt);a.turnCooldown=Math.max(0,(a.turnCooldown||0)-dt);
 if((a.previousSpeed||0)>35&&velocity<(a.previousSpeed||0)*.65&&!u.nativeAction)a.stopTime=.24;
 a.acceleration=Math.max(-1,Math.min(1,(velocity-(a.previousSpeed||0))/(dt*390)));a.previousSpeed=velocity;u.nativeClock=time;
 a.hp=u.hp;a.x=u.x;a.y=u.y;a.vx=u.velocityX;a.vy=u.velocityY;a.ix=u.impulseX;a.iy=u.impulseY;
 const tuning=u.tuning||{},movement=(tuning.movementSpeed??100)/100,gaitPace=(tuning.gaitPace??100)/100,turnSpeed=(tuning.turnSpeed??100)/100;
 a.speed=speed*movement;a.run=a.speed*1.65;a.sprint=a.speed*2.15;a.stamina=u.stamina;a.capeMotion=(tuning.capeMotion??100)/100;
 a.runBlend+=(Math.max(0,Math.min(1,(velocity-speed)/(a.run-speed)))-a.runBlend)*Math.min(1,dt*10);
 a.sprintBlend+=(Math.max(0,Math.min(1,(velocity-a.run)/(a.sprint-a.run)))-a.sprintBlend)*Math.min(1,dt*10);
 const change=(target)=>Math.atan2(Math.sin(target-u.facing),Math.cos(target-u.facing));
 const target=u.nativeAction?.angle??(velocity>4?Math.atan2(u.velocityY,u.velocityX):u.targetMemory?Math.atan2(u.targetMemory.y-u.y,u.targetMemory.x-u.x):u.facing);
 const turn=change(target);if(Math.abs(turn)>.9&&a.turnCooldown<=0&&!u.nativeAction){a.turnTime=.32;a.turnCooldown=.6;}u.facing+=Math.max(-dt*6*turnSpeed,Math.min(dt*6*turnSpeed,turn));a.facing=u.facing;
 a.moveFacing=velocity>4?Math.atan2(u.velocityY,u.velocityX):a.moveFacing;a.turning=Math.abs(turn);
 const direction=Math.round(a.facing/(Math.PI/4));a.spriteDirection??=((direction%8)+8)%8;
 if(Math.abs(Math.atan2(Math.sin(a.facing-a.spriteDirection*Math.PI/4),Math.cos(a.facing-a.spriteDirection*Math.PI/4)))>.59)a.spriteDirection=((direction%8)+8)%8;
 const distance=Math.hypot(u.x-(u.px??u.x),u.y-(u.py??u.y)),stride=locomotionStride(a.stride,a.runBlend,a.sprintBlend,a.id)*Math.max(.55,u.nativeScale||1);
 // A small world sprite must not run through ten pose cycles every second.
 if(!u.nativeAction&&!a.roll&&u.stagger<=0&&u.hp>0)a.gait+=gaitPace*Math.min(distance/stride,dt*(2.4+a.runBlend*.6+a.sprintBlend*.6));
 a.moving+=( (u.actionLock>0?0:Math.min(1,velocity/(a.run||1)))-a.moving)*(1-Math.exp(-dt*12));
 a.hitTime=u.nativeAction?.charged?0:Math.min(.13,u.hitAnim||0);a.stagger=u.stagger||0;
 a.roll=u.rollTime>0?{kind:u.dodgeStyle==='barrel'||u.dodgeStyle==='sidestep'?'dash':'dodge',elapsed:.25-u.rollTime,duration:.25,dx:u.rollX,dy:u.rollY}:u.dashMotion?{kind:'dash',elapsed:Math.max(0,u.dashDuration-u.dashAnim),duration:u.dashDuration,dx:u.dashMotion.x,dy:u.dashMotion.y}:null;
 if(u.stagger>0&&!u.nativeAction?.charged)u.nativeAction=null;
 if(u.nativeAction){u.nativeAction.elapsed+=actionDt;u.nativeAction.released=u.nativeAction.elapsed>=u.nativeAction.windup;if(u.nativeAction.elapsed>=u.nativeAction.duration)u.nativeAction=null;}
 a.action=u.nativeAction;a.casts=!!u.nativeAction?.casting||a.id==='caster'||a.id==='jelly';
 a.deathTime=u.deathTime||0;a.knockdown=u.nativeKnockdown||0;a.getup=u.nativeGetup||0;
 if(!visuals)return;
 if(a.knockdown>0&&!a.ragdoll)a.ragdoll=createRagdoll(a.id,characterRig(a.id,"hit",.25),{x:-65,y:24});
 if(u.hp>0&&!a.knockdown&&!a.getup)a.ragdoll=null;
 if(u.hp<=0&&!a.ragdoll)a.ragdoll=createRagdoll(a.id,characterRig(a.id,'hit',.2),{x:-60,y:20});
 if(a.ragdoll){for(let left=dt;left>1e-7;left-=1/120)stepRagdoll(a.ragdoll,Math.min(left,1/120));}
 const cloth=capeSpecification(a.family,u),sample=spriteSample(a,time),clothRig=a.ragdoll?ragdollRig(a.ragdoll,a.getup>0?1-a.getup/.45:0):characterRig(a.id,sample.state,sample.phase,sample.stage,{...sample,stride:a.stride});
 for(let left=dt;left>1e-7;left-=1/60){const step=Math.min(left,1/60);stepCape(a,step);stepPhysicalCape(a,clothRig,cloth,step);}
 plantFeet(a,dt);

}
export function nativeBladePoint(u,strike,phase){
 const rig=nativeFormRig(u.nativeActor.family,u,characterRig(u.nativeActor.id,'attack',phase,'windup',{swing:strike.style,charged:strike.charged})),angle=Math.atan2(strike.dy,strike.dx),tip=rig.creatureAttack?.contact||rig.weapon?.tip||(u.nativeActor.id==='wolf'?{...rig.head,x:rig.head.x+16,z:rig.head.z-3}:rig.head);
 const point={x:tip.x*Math.cos(angle)-tip.y*Math.sin(angle),y:tip.x*Math.sin(angle)+tip.y*Math.cos(angle),z:tip.z};
 const scale=u.nativeScale||1;return {x:u.x+point.x*scale,y:u.y+point.y*scale,z:point.z*scale};
}
export function nativeHeavy(u){return ['knight','orc'].includes(u.nativeActor?.id);}
export function nativeBodyHeight(u){
 if(!u?.nativeActor)return 45;const rig=nativeFormRig(u.nativeActor.family,u,characterRig(u.nativeActor.id,'idle',0));return rig.body.z*(u.nativeScale||1);
}
export function nativeMuzzle(u,target){
 if(!u.nativeActor)return {x:u.x,y:u.y-15,z:45};
 const id=u.nativeActor.id,angle=Math.atan2(target.y-u.y,target.x-u.x),rig=nativeFormRig(u.nativeActor.family,u,characterRig(id,['caster','jelly'].includes(id)?'cast':'attack',1,'windup'));
 const hand=['elf','fox'].includes(id)?rig.weapon.grip:rig.creatureAttack?.contact||rig.weapon?.tip||rig.head;
 const scale=u.nativeScale||1;return {x:u.x+(hand.x*Math.cos(angle)-hand.y*Math.sin(angle))*scale,y:u.y+(hand.x*Math.sin(angle)+hand.y*Math.cos(angle))*scale-14,z:hand.z*scale};
}
export function finishNativeVisuals(battle,dt){
 if(!battle?.units?.some(u=>u.nativeActor))return;advanceCombatTexts(battle,dt);
 for(const u of battle.units){const a=u.nativeActor;if(!a)continue;a.hp=u.hp;a.action=null;a.moving=0;a.roll=null;a.stopTime=Math.max(0,(a.stopTime||0)-dt);a.turnTime=Math.max(0,(a.turnTime||0)-dt);if(u.hp<=0){u.deathTime+=dt;a.deathTime=u.deathTime;if(!a.ragdoll)a.ragdoll=createRagdoll(a.id);if(a.ragdoll.time<2)for(let left=dt;left>1e-7;left-=1/120)stepRagdoll(a.ragdoll,Math.min(left,1/120));}a.vx=a.vy=0;for(let left=dt;left>1e-7;left-=1/120){const step=Math.min(left,1/120);stepCape(a,step);stepPhysicalCape(a,a.ragdoll?ragdollRig(a.ragdoll):characterRig(a.id,'idle',a.gait%1),capeSpecification(a.family,u),step);}}
}
