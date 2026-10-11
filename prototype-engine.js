import { sweepCircle } from './arena.js';
import { characterRig, weaponContactPath, weaponTipAt, rigFoot, plantFeet, locomotionStride } from './prototype-rig.js';

// Milestone 1's isolated deterministic arena. All positions are ground coordinates.
export const PROTOTYPE_CHARACTERS = [
  {id:'knight',name:'Aurel · Knight',role:'Vanguard',mass:1.9,hp:420,speed:90,run:180,reach:64,damage:40,windup:0.32,recovery:0.36,cooldown:1.2,radius:19,stride:76,color:'#e7ba74',weapon:'sword',row:0},
  {id:'orc',name:'Brakk · Orc',role:'Brawler',mass:2.6,hp:470,speed:78,run:157,reach:72,damage:59,windup:0.48,recovery:0.46,cooldown:1.5,radius:23,stride:82,color:'#b3c985',weapon:'axe',row:1},
  {id:'elf',name:'Syl · Elf archer',role:'Marksman',mass:0.8,hp:235,speed:110,run:215,reach:340,damage:31,windup:0.27,recovery:0.28,cooldown:1.08,radius:15,stride:76,color:'#b8daa0',weapon:'bow',row:2},
  {id:'caster',name:'Nyra · Caster',role:'Arcanist',mass:1,hp:255,speed:92,run:178,reach:290,damage:45,windup:0.54,recovery:0.4,cooldown:1.7,radius:16,stride:76,color:'#a8d9ed',weapon:'staff',row:3},
  {id:'wolf',name:'Ember · Wolf',role:'Pursuer',mass:1.15,hp:285,speed:130,run:240,reach:53,damage:29,windup:0.23,recovery:0.23,cooldown:0.88,radius:17,stride:72,color:'#e3a879',weapon:'claws',row:4},
];
export const PROTOTYPE_BY_ID=Object.fromEntries(PROTOTYPE_CHARACTERS.map(x=>[x.id,x]));
for(const spec of PROTOTYPE_CHARACTERS)spec.sprint=Math.round(spec.run*(spec.id==='wolf'?1.4:spec.id==='orc'?1.3:1.35));
export const ANIMATION_STATES=['idle','walk','run','sprint','turn','attack','cast','dash','dodge','hit','stagger','death'];
export const ARENA_LIMITS={left:70,right:930,top:110,bottom:805};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function groundToScreen(x,y){return {x,y:y*0.58+75};}
export function screenToGround(x,y){return {x,y:(y-75)/0.58};}
export function directionalFrame(angle){return ((Math.round(angle/(Math.PI/4))%8)+8)%8;}
export function gaitFoot(phase,stride,running=false){
  return rigFoot(phase,stride,running);
}
export function makePrototypeUnit(id,side=0,index=0,x=200,y=300){
  const spec=PROTOTYPE_BY_ID[id];
  if(!spec)throw new Error('Unknown prototype character');
  return {uid:`${side}-${id}-${index}`,id,side,...spec,x,y,px:x,py:y,hp:spec.hp,maxHp:spec.hp,
    facing:side?Math.PI:0,previousFacing:side?Math.PI:0,vx:0,vy:0,ix:0,iy:0,
    gait:0.25,travel:0,moving:0,runBlend:0,sprintBlend:0,acceleration:0,sprintRequested:false,sprintActive:false,sprintExhausted:false,moveFacing:side?Math.PI:0,aimFacing:null,action:null,actionSerial:0,attackCooldown:0.25+index*0.12,
    stamina:100,poise:0,stagger:0,hitTime:0,roll:null,dodgeCooldown:0.7+index*0.1,
    deathTime:0,turning:0,target:null,manualUntil:0,order:null,intention:'ready',
    hits:0,misses:0,damageDealt:0,dodges:0,interrupts:0,lastState:'idle'};
}
export function actionProgress(u){return u.action?clamp(u.action.elapsed/u.action.duration,0,1):0;}
export function animationState(u){
  if(u.hp<=0)return 'death';
  if(u.stagger>0)return 'stagger';
  if(u.hitTime>0)return 'hit';
  if(u.roll)return u.roll.kind;
  if(u.action)return u.id==='caster'?'cast':'attack';
  if(u.sprintBlend>0.35)return 'sprint';
  if(u.runBlend>0.4)return 'run';
  if(u.moving>0.07)return 'walk';
  if(u.turning>0.8)return 'turn';
  return 'idle';
}
export function meleeConnects(source,target,angle,reach,arc=0.68){
  const dx=target.x-source.x,dy=target.y-source.y,d=Math.hypot(dx,dy);
  return d<=reach+target.radius&&d>0&&(dx*Math.cos(angle)+dy*Math.sin(angle))/d>=Math.cos(arc+Math.asin(Math.min(0.6,target.radius/d)));
}
export class PrototypeArena {
  constructor(mode='battle'){
    this.mode=mode;this.locomotion='auto';this.time=0;this.accumulator=0;this.alpha=0;this.done=false;this.winner=null;
    this.units=[];this.projectiles=[];this.particles=[];this.effects=[];this.audio=[];this.events=[];
    this.shake=0;this.serial=0;this.metrics={hits:0,misses:0,rolls:0,avoided:0,interrupts:0,projectiles:0,contacts:0,knockouts:0};
    for(let side=0;side<(mode==='battle'?2:1);side++)
      PROTOTYPE_CHARACTERS.forEach((s,i)=>{
        const x=mode==='battle'?(side?760:240)+(i>1?(side?70:-70):0):170+i*163;
        const y=mode==='battle'?230+i*110:420;
        const u=makePrototypeUnit(s.id,side,i,x,y);
        if(mode==='movement'){
          u.trackPhase=i*0.4;u.x=175+i*160+Math.cos(u.trackPhase)*59;u.y=400+Math.sin(u.trackPhase)*150;u.px=u.x;u.py=u.y;
          u.facing=Math.atan2(Math.cos(u.trackPhase)*150,-Math.sin(u.trackPhase)*59);u.previousFacing=u.facing;u.moveFacing=u.facing;
        }
        this.units.push(u);
      });
  }
  living(side){return this.units.filter(u=>u.hp>0&&(side===undefined||u.side===side));}
  setLocomotion(pace){
    if(!['auto','walk','run','sprint'].includes(pace))return false;
    this.locomotion=pace;
    for(const u of this.units){u.sprintRequested=false;if(pace==='sprint')u.sprintExhausted=u.stamina<25;}
    return true;
  }
  setSprint(uid,on){
    const u=this.units.find(u=>u.uid===uid&&u.hp>0);
    if(!u||this.done||!['battle','movement'].includes(this.mode))return false;
    if(on&&u.stamina<25)return false;
    u.sprintRequested=Boolean(on);if(on)u.sprintExhausted=false;
    return true;
  }
  event(type,u,detail={}){
    const event={type,time:this.time,uid:u.uid,id:u.id,...detail};
    this.events.push(event);if(this.events.length>300)this.events.shift();
    if(['contact','release','death'].includes(type))this.audio.push({type:type==='contact'?(u.id==='orc'?'crit':'hit'):type==='release'?'skill':'death',element:u.id==='orc'||u.id==='wolf'?'ember':u.id==='elf'?'grove':u.id==='caster'?'storm':'tide',time:this.time});
  }
  moveOrder(uid,point){
    const u=this.units.find(u=>u.uid===uid&&u.hp>0);if(!u)return false;
    u.order={x:clamp(point.x,85,915),y:clamp(point.y,130,785)};u.manualUntil=this.time+6;return true;
  }
  attack(u,target){
    if(!u||!target||u.hp<=0||target.hp<=0||u.action||u.roll||u.stagger>0||u.stamina<10)return false;
    const angle=Math.atan2(target.y-u.y,target.x-u.x);
    u.aimFacing=angle;
    if(Math.abs(angleDelta(u.facing,angle))>0.5)return false;
    u.transitionFoot={gait:u.gait,moving:u.moving,runBlend:u.runBlend,sprintBlend:u.sprintBlend,time:this.time};
    u.action={elapsed:0,windup:u.windup,duration:u.windup+u.recovery,angle,aim:{x:target.x,y:target.y},targetUid:target.uid,targetDodges:target.dodges,released:false,impactHold:0,hitUids:[],key:++this.serial};
    u.stamina-=10;u.intention=u.id==='caster'?'channeling':u.id==='elf'?'drawing bow':'committed strike';
    this.event('windup',u,{targetUid:target.uid,angle});return true;
  }
  roll(u,angle,kind='dodge'){
    if(!u||u.hp<=0||u.action||u.roll||u.stagger>0||u.stamina<30||u.dodgeCooldown>0)return false;
    u.roll={elapsed:0,duration:kind==='dash'?0.34:0.29,dx:Math.cos(angle),dy:Math.sin(angle),kind};
    u.stamina-=30;u.dodgeCooldown=2.8;u.dodges++;this.metrics.rolls++;this.event(kind,u);return true;
  }
  hit(target,source,damage,kind='melee',contactHeight=null,contactPoint=null){
    if(target.hp<=0)return;
    const dx=target.x-source.x,dy=target.y-source.y,d=Math.hypot(dx,dy)||1;
    const path=kind==='melee'?weaponContactPath(source.id,0):null;
    const arc=path?path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-path[i].x,p.y-path[i].y),0):0;
    const weaponMass=source.id==='orc'?3.4:source.id==='knight'?1.5:1;
    const impulse=kind==='spell'?65:kind==='melee'?clamp(arc/(source.windup*0.28)*weaponMass*0.035,75,230):80;
    const force=impulse/target.mass;
    if(kind==='melee'&&source.action)source.action.impactHold=source.id==='orc'?0.055:0.032;
    target.ix+=dx/d*force;target.iy+=dy/d*force;target.hitTime=0.13;
    target.poise+=damage*(source.id==='orc'?1.05:0.62);
    if(target.poise>50+target.mass*15){
      target.poise=0;target.stagger=0.46;
      if(target.action&&!target.action.released){target.action=null;target.interrupts++;this.metrics.interrupts++;this.event('interrupt',target,{sourceUid:source.uid});}
      target.roll=null;
    }
    target.hp=Math.max(0,target.hp-damage);source.hits++;source.damageDealt+=damage;this.metrics.hits++;
    this.event('contact',source,{targetUid:target.uid,damage,kind,point:contactPoint,targetPosition:{x:target.x,y:target.y,radius:target.radius}});
    this.effects.push({kind:'impact',x:contactPoint?.x??target.x,y:contactPoint?.y??target.y,z:contactHeight??(source.id==='wolf'?28:52),age:0,duration:0.26,color:source.color,heavy:source.id==='orc'});
    this.effects.push({kind:'number',x:target.x,y:target.y,z:76,age:0,duration:0.8,text:Math.round(damage),color:'#f4e8c9'});
    this.shake=Math.min(3,this.shake+(source.id==='orc'?1.7:0.45));
    for(let i=0;i<(source.id==='orc'?12:5);i++){
      const a=i*2.399+this.serial*0.17,speed=30+(i%4)*24;
      this.particles.push({x:target.x,y:target.y,z:30,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,vz:45+(i%3)*20,age:0,duration:0.35+i%3*0.08,color:source.color});
    }
    if(target.hp<=0){
      target.action=null;target.roll=null;target.deathTime=0;target.moving=0;target.lastState='death';this.metrics.knockouts++;this.event('death',target,{sourceUid:source.uid});
    }
  }
  swingContact(u,from,to){
    const a=u.action;if(!a||['elf','caster'].includes(u.id)||to<0.72||from>=1)return;
    const before=weaponTipAt(u.id,Math.max(0.72,from),a.angle),after=weaponTipAt(u.id,Math.min(1,to),a.angle);
    const start={x:u.x+before.x,y:u.y+before.y},end={x:u.x+after.x,y:u.y+after.y},limit=u.id==='orc'?2:1;
    for(const target of this.living(1-u.side)){
      if(a.hitUids.length>=limit)break;
      if(a.hitUids.includes(target.uid)||!meleeConnects(u,target,a.angle,u.reach,u.id==='orc'?0.85:0.65))continue;
      const fraction=sweepCircle(start,end,target,target.radius+(u.id==='orc'?8:4));
      if(fraction===null)continue;
      const contact={x:start.x+(end.x-start.x)*fraction,y:start.y+(end.y-start.y)*fraction,z:before.z+(after.z-before.z)*fraction};
      a.hitUids.push(target.uid);this.hit(target,u,u.damage,'melee',contact.z,contact);
    }
  }
  release(u){
    const a=u.action;if(!a||a.released)return;a.released=true;
    if(u.id==='elf'||u.id==='caster'){
      const rig=characterRig(u.id,u.id==='elf'?'attack':'cast',1,'windup'),hand=u.id==='elf'?rig.weapon.grip:rig.weapon.tip;
      const sx=u.x+hand.x*Math.cos(a.angle)-hand.y*Math.sin(a.angle),sy=u.y+hand.x*Math.sin(a.angle)+hand.y*Math.cos(a.angle);
      const dx=a.aim.x-sx,dy=a.aim.y-sy,d=Math.hypot(dx,dy)||1,speed=u.id==='elf'?560:360;
      this.projectiles.push({key:++this.serial,x:sx,y:sy,px:sx,py:sy,vx:dx/d*speed,vy:dy/d*speed,source:u,damage:u.damage,z:hand.z,originZ:hand.z,kind:u.id==='elf'?'arrow':'spell',age:0,ttl:2.5,targetUid:a.targetUid,targetDodges:a.targetDodges,passTime:d/speed});
      this.metrics.projectiles++;this.event('release',u,{actionKey:a.key,kind:u.id==='elf'?'arrow':'spell'});
    }else{
      if(!a.hitUids.length){this.metrics.misses++;u.misses++;this.event('miss',u,{actionKey:a.key});
        const target=this.units.find(t=>t.uid===a.targetUid);if(target&&target.dodges>a.targetDodges){this.metrics.avoided++;this.event('evade',target,{sourceUid:u.uid});}
      }
    }
  }
  threat(u){
    const candidates=[];
    for(const e of this.living(1-u.side))if(e.action&&!e.action.released&&e.id!=='elf'&&e.id!=='caster'){
      if(e.action.hitUids.includes(u.uid)||e.action.hitUids.length>=(e.id==='orc'?2:1))continue;
      const left=e.action.windup-e.action.elapsed;
      if(left>0.04&&left<0.19&&meleeConnects(e,u,e.action.angle,e.reach+8))candidates.push({angle:e.action.angle+Math.PI/2,deadline:left,key:e.action.key,source:e});
    }
    for(const p of this.projectiles)if(p.source.side!==u.side){
      const t=sweepCircle(p,{x:p.x+p.vx*0.2,y:p.y+p.vy*0.2},u,u.radius+4);
      if(t!==null)candidates.push({angle:Math.atan2(p.vy,p.vx)+Math.PI/2,deadline:t*0.2,key:p.key,source:p.source});
    }
    return candidates.sort((a,b)=>a.deadline-b.deadline)[0]||null;
  }
  target(u){
    return this.living(1-u.side).sort((a,b)=>{
      const sa=distance(u,a)+(u.id==='wolf'&&['elf','caster'].includes(a.id)?-85:0);
      const sb=distance(u,b)+(u.id==='wolf'&&['elf','caster'].includes(b.id)?-85:0);return sa-sb;
    })[0];
  }
  confine(u){
    u.x=clamp(u.x,ARENA_LIMITS.left+u.radius,ARENA_LIMITS.right-u.radius);
    u.y=clamp(u.y,ARENA_LIMITS.top+u.radius,ARENA_LIMITS.bottom-u.radius);
  }
  separate(){
    const units=this.living();
    for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
      const a=units[i],b=units[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),gap=a.radius+b.radius;
      if(d>=gap)continue;
      const nx=d>0.001?dx/d:1,ny=d>0.001?dy/d:0,wa=1/a.mass,wb=1/b.mass,p=gap-d;
      a.x-=nx*p*wa/(wa+wb);a.y-=ny*p*wa/(wa+wb);b.x+=nx*p*wb/(wa+wb);b.y+=ny*p*wb/(wa+wb);this.metrics.contacts++;
      this.confine(a);this.confine(b);
    }
  }
  advance(dt){
    this.time+=dt;this.shake=Math.max(0,this.shake-dt*12);
    for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.duration);
    for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=210*dt;}
    this.particles=this.particles.filter(p=>p.age<p.duration);
    for(const u of this.units){
      u.px=u.x;u.py=u.y;u.previousFacing=u.facing;
      if(u.hp<=0){u.deathTime+=dt;u.x+=u.ix*dt;u.y+=u.iy*dt;u.ix*=Math.exp(-6*dt);u.iy*=Math.exp(-6*dt);this.confine(u);continue;}
      u.hitTime=Math.max(0,u.hitTime-dt);u.stagger=Math.max(0,u.stagger-dt);u.dodgeCooldown=Math.max(0,u.dodgeCooldown-dt);
      u.attackCooldown-=dt;u.poise=Math.max(0,u.poise-dt*10);
      if(this.done){u.moving*=Math.exp(-8*dt);continue;}
      if(u.action){
        const action=u.action,previous=action.elapsed;
        if(action.impactHold>0)action.impactHold=Math.max(0,action.impactHold-dt);else action.elapsed+=dt;
        if(action.elapsed>previous)this.swingContact(u,previous/action.windup,action.elapsed/action.windup);
        const aim=angleDelta(u.facing,u.action.angle);u.facing+=clamp(aim,-dt*7,dt*7);
        if(u.action.elapsed>=u.action.windup)this.release(u);
        if(u.action.elapsed>=u.action.duration){u.action=null;u.attackCooldown=u.cooldown;u.transitionFoot={gait:u.gait,moving:0,time:this.time};}
      }
      let desiredX=0,desiredY=0,running=false;
      if(this.mode==='movement'){
        const derivative=Math.hypot(Math.sin(u.trackPhase)*59,Math.cos(u.trackPhase)*150);
        u.trackPhase+=Math.hypot(u.vx,u.vy)*dt/(derivative||1);
        const angle=u.trackPhase;
        const goal={x:175+PROTOTYPE_BY_ID[u.id].row*160+Math.cos(angle)*59,y:400+Math.sin(angle)*150};
        const tx=-Math.sin(angle)*59/(derivative||1)+(goal.x-u.x)*0.024,ty=Math.cos(angle)*150/(derivative||1)+(goal.y-u.y)*0.024,normal=Math.max(1,Math.hypot(tx,ty));
        desiredX=tx/normal;desiredY=ty/normal;
        running=this.locomotion==='run'||this.locomotion==='sprint'||(this.locomotion==='auto'&&Math.sin(this.time*0.7)>0.2);u.intention=running?'running circuit':'walking circuit';
        if(u.order&&this.time<u.manualUntil){
          const d=distance(u,u.order),arrival=Math.min(1,d/45);
          desiredX=d>3?(u.order.x-u.x)/(d||1)*arrival:0;desiredY=d>3?(u.order.y-u.y)/(d||1)*arrival:0;u.intention='following your order';
        }
      }else if(this.mode==='battle'){
        const target=this.target(u);u.target=target?.uid||null;
        if(target){
          const dist=distance(u,target);let goal=target;
          if(u.order&&this.time<u.manualUntil){goal=u.order;u.intention='following your order';}
          else if(['elf','caster'].includes(u.id)&&dist<135){goal={x:u.x+(u.x-target.x)*2,y:u.y+(u.y-target.y)*2};u.intention='creating distance';}
          else u.intention=dist>u.reach?'closing distance':'ready to strike';
          const dg=distance(u,goal);
          if((goal!==target&&dg>7)||(goal===target&&dist>u.reach*0.87)){
            const arrival=goal!==target?Math.min(1,dg/45):1;
            desiredX=(goal.x-u.x)/(dg||1)*arrival;desiredY=(goal.y-u.y)/(dg||1)*arrival;running=goal===target&&dist>170;
          }
          if(goal===target)u.aimFacing=Math.atan2(target.y-u.y,target.x-u.x);
          if(goal===target&&dist<=u.reach&&u.attackCooldown<=0&&!u.action)this.attack(u,target);
          if(!u.action&&!u.roll){
            const threat=this.threat(u);
            if(threat){
              const sign=u.y<455?-1:1;
              if(this.roll(u,threat.angle+(sign<0?Math.PI:0))){u.intention='escaping an aimed attack';u.lastThreat=threat.key;}
            }
          }
        }
      }
      const busy=u.action||u.roll||u.stagger>0;
      if(busy){desiredX=0;desiredY=0;}
      const wantsSprint=u.sprintRequested||(this.mode==='movement'&&this.locomotion==='sprint');
      if(u.stamina<=8&&wantsSprint)u.sprintExhausted=true;
      u.sprintActive=Boolean(wantsSprint&&!u.sprintExhausted&&!busy&&Math.hypot(desiredX,desiredY)>0.1);
      if(wantsSprint&&u.sprintExhausted)running=false;
      if(u.sprintActive)u.intention='sprinting';
      else if(wantsSprint&&u.sprintExhausted)u.intention='catching breath';
      u.stamina=clamp(u.stamina+dt*(busy?8:u.sprintActive?-20:u.moving>0.1?15:22),0,100);
      if(!busy&&(Math.hypot(desiredX,desiredY)>0.1||u.aimFacing!==null)){
        const steering=Math.hypot(desiredX,desiredY)>0.1;
        const a=steering?(Math.hypot(u.vx,u.vy)>20?Math.atan2(u.vy,u.vx):Math.atan2(desiredY,desiredX)):u.aimFacing,change=angleDelta(u.facing,a);
        u.facing+=clamp(change,-dt*(u.mass>2?5:7.5),dt*(u.mass>2?5:7.5));u.turning=Math.abs(change);
      }else u.turning*=Math.exp(-10*dt);
      const targetSpeed=u.sprintActive?u.sprint:running?u.run:u.speed;
      const previousSpeed=Math.hypot(u.vx,u.vy),turn=previousSpeed>8&&Math.hypot(desiredX,desiredY)>0.1?Math.abs(angleDelta(Math.atan2(u.vy,u.vx),Math.atan2(desiredY,desiredX))):0;
      const cornerSpeed=1-(u.sprintActive?0.48:0.25)*Math.sin(Math.min(Math.PI/2,turn));
      const accelerationLimit=(u.mass>2?260:390)*(u.sprintActive?0.85:1),brakingLimit=u.mass>2?400:600;
      const tx=desiredX*targetSpeed*cornerSpeed,ty=desiredY*targetSpeed*cornerSpeed,deltaX=tx-u.vx,deltaY=ty-u.vy,deltaSpeed=Math.hypot(deltaX,deltaY);
      const limit=(Math.hypot(tx,ty)<previousSpeed?brakingLimit:accelerationLimit)*dt,blend=Math.min(1,limit/(deltaSpeed||1));
      u.vx+=deltaX*blend;u.vy+=deltaY*blend;
      const actualSpeed=Math.hypot(u.vx,u.vy);
      u.acceleration+=(clamp((actualSpeed-previousSpeed)/(dt*accelerationLimit),-1,1)-u.acceleration)*Math.min(1,dt*10);
      const gaitBlend=1-Math.exp(-dt*10);
      u.runBlend+=(clamp((actualSpeed-u.speed)/(u.run-u.speed),0,1)-u.runBlend)*gaitBlend;
      u.sprintBlend+=(clamp((actualSpeed-u.run)/(u.sprint-u.run),0,1)-u.sprintBlend)*gaitBlend;
      if(u.roll){
        const roll=u.roll;roll.elapsed+=dt;const p=roll.elapsed/roll.duration,speed=(roll.kind==='dash'?480:440)*(0.62+0.38*Math.sin(Math.PI*clamp(p,0,1)))*(u.mass>2?0.84:1);
        u.x+=roll.dx*speed*dt;u.y+=roll.dy*speed*dt;
        if(roll.elapsed>=roll.duration){u.roll=null;u.vx=0;u.vy=0;}
      }else if(!u.action&&u.stagger<=0){
        const move=Math.hypot(u.vx,u.vy)*dt;u.x+=u.vx*dt;u.y+=u.vy*dt;
        u.travel+=move;u.gait+=move/locomotionStride(u.stride,u.runBlend,u.sprintBlend,u.id);
      }
      const speed=Math.hypot(u.vx,u.vy);
      if(speed>3)u.moveFacing=Math.atan2(u.vy,u.vx);
      u.moving+=(busy?0:clamp(speed/u.run,0,1)-u.moving)*(1-Math.exp(-dt*12));
      if(busy)u.moving*=Math.exp(-12*dt);
      u.x+=u.ix*dt;u.y+=u.iy*dt;u.ix*=Math.exp(-5*dt);u.iy*=Math.exp(-5*dt);this.confine(u);
      u.lastState=animationState(u);
    }
    this.separate();
    for(const u of this.units)plantFeet(u,dt);
    for(const p of this.projectiles){
      p.age+=dt;p.ttl-=dt;
      p.z=p.originZ+(52-p.originZ)*clamp(p.age/p.passTime,0,1);
      const start={x:p.x,y:p.y},end={x:p.x+p.vx*dt,y:p.y+p.vy*dt};
      let hit=null,t=Infinity;
      for(const target of this.living(1-p.source.side)){
        const fraction=sweepCircle({x:start.x-target.px,y:start.y-target.py},{x:end.x-target.x,y:end.y-target.y},{x:0,y:0},target.radius+(p.kind==='spell'?8:3));
        if(fraction!==null&&fraction<t){t=fraction;hit=target;}
      }
      p.px=p.x;p.py=p.y;p.x=end.x;p.y=end.y;
      if(hit){this.hit(hit,p.source,p.damage,p.kind==='spell'?'spell':'arrow',p.z);p.ttl=0;}
      if(!hit&&!p.avoidChecked&&p.age>=p.passTime+0.08){
        p.avoidChecked=true;const target=this.units.find(u=>u.uid===p.targetUid);
        if(target?.hp>0&&target.dodges>p.targetDodges&&target.lastThreat===p.key){this.metrics.avoided++;this.event('evade',target,{sourceUid:p.source.uid});}
      }
      if(p.ttl<=0&&!hit){p.source.misses++;this.metrics.misses++;this.event('miss',p.source,{kind:p.kind});}
    }
    this.projectiles=this.projectiles.filter(p=>p.ttl>0);
    if(this.mode==='battle'&&!this.done&&(!this.living(0).length||!this.living(1).length)){
      this.done=true;this.winner=this.living(0).length?0:1;this.projectiles=[];
      for(const u of this.living()){u.action=null;u.roll=null;u.vx=0;u.vy=0;}
      this.event('finished',this.units[0]);
    }
  }
  step(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    this.accumulator+=Math.min(dt,0.1);
    while(this.accumulator+1e-9>=1/120){this.advance(1/120);this.accumulator=Math.max(0,this.accumulator-1/120);}
    this.alpha=this.accumulator*120;
  }
}
