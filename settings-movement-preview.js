import {PIXEL_SPECIES} from './native-content.js';
import {creatureTypeFactor,creatureWorldScale} from './native-size.js';
import {creature,stats} from './game.js';
import {initializeNative,advanceNative} from './native-combat.js';
import {movementPace,steerMovement} from './movement-tuning.js';
import {animationState} from './prototype-engine.js';
import {DEFAULT_TUNING} from './tuning.js';
export const PREVIEW_SWAP_SECONDS=5;
const groups=[['Small',s=>creatureTypeFactor(s)<=.9],['Regular',s=>creatureTypeFactor(s)>.9&&creatureTypeFactor(s)<1.2],['Large',s=>creatureTypeFactor(s)>=1.2]];
export class SettingsMovementPreview{
 constructor({now=0,random=Math.random}={}){this.random=random;this.started=now;this.last=now;this.batch=-1;this.examples=[];this.update(now,{});}
 swap(batch,tuning){
  const previous=this.examples;this.batch=batch;
  this.examples=groups.map(([category,match],i)=>{
   const pool=PIXEL_SPECIES.filter(s=>!s.boss&&match(s)),fresh=pool.filter(s=>s.id!==previous[i]?.spec.id),available=fresh.length?fresh:pool,spec=available[Math.min(available.length-1,Math.floor(this.random()*available.length))];
   const model={...creature(spec.id),balanceVersion:17},st=stats(model,[model]),u={...model,...st,side:0,x:350,y:430,px:350,py:430,hp:st.hp,maxHp:st.hp,velocityX:0,velocityY:0,impulseX:0,impulseY:0,stamina:100,actionLock:0,stagger:0,hitAnim:0,rollTime:0,mass:1,radius:spec.bodyRadius||22,shield:0,maxPoise:20,tuning};
   initializeNative(u,spec,tuning);u.x=u.px=350;u.y=u.py=430;
   return {category,spec,unit:u,origin:{x:u.x,y:u.y},state:'idle'};
  });
 }
 update(now,tuning){
  tuning={...DEFAULT_TUNING,...tuning};
  const elapsed=Math.max(0,now-this.started),batch=Math.floor((elapsed+1e-8)/PREVIEW_SWAP_SECONDS);
  if(batch!==this.batch)this.swap(batch,tuning);
  let remaining=Math.max(0,Math.min(.1,now-this.last));this.last=now;
  const phase=elapsed%PREVIEW_SWAP_SECONDS;
  // Each five-second cast demonstrates travel, a tight turn and braking.
  const distance=phase<.8?60:phase<1.7?240:phase<2.7?440:phase<4?240:0,heading=phase<2.7?0:Math.PI;
  while(remaining>1e-7){const dt=Math.min(remaining,1/60);remaining-=dt;
   for(const e of this.examples){const u=e.unit;u.tuning=tuning;u.nativeScale=creatureWorldScale(e.spec,u,tuning);u.nativeActor.rigScale=u.nativeScale;
    const speed=u.speed*(tuning.movementSpeed??100)/100*movementPace(distance,u.stamina,tuning),v=steerMovement(u.velocityX,u.velocityY,distance?Math.cos(heading):0,distance?Math.sin(heading):0,speed,1,dt,tuning);
    u.px=u.x;u.py=u.y;u.velocityX=v.x;u.velocityY=v.y;u.x+=v.x*dt;u.y+=v.y*dt;advanceNative(u,dt,elapsed,false);e.state=animationState(u.nativeActor);
   }
  }
  return this.examples;
 }
}
