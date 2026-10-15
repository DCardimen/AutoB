import {sweepCircle} from './arena.js';
export const ORDERS={advance:{name:'Advance',desc:'Close to attack range; ranged units kite nearby threats.'},hold:{name:'Hold',desc:'Defend within 105 ground units of the deployment cell.'},flank:{name:'Flank',desc:'Approach an occupied frontline from the side.'},escort:{name:'Escort',desc:'Screen the weakest ally and threaten attackers approaching them.'}};
export const CONDITIONS={none:'No condition',selfHurt:'Self below 35% HP',allyHurt:'An ally below 35% HP',channel:'Enemy winding up an interruptible attack',shield:'Enemy has a shield',wounded:'Enemy below 30% HP'};
export const RESPONSES={retreat:'Retreat',protect:'Protect weakest ally',interrupt:'Pressure the channel',breaker:'Break shields',execute:'Finish wounded enemies'};
export const OPENING_BOONS=['thorn-crown','glass-cannon','storm-relay'];
export function chooseOpeningBoon(run,id){
 if(!run.native||run.wins!==1||run.openingBoon||!OPENING_BOONS.includes(id)||run.relics.includes(id))return false;
 run.relics.push(id);run.openingBoon=id;return true;
}
export function evaluateOrders(u,allies,enemies){
 for(const rule of (u.rules||[]).slice(0,2)){
  const match=rule?.when==='selfHurt'?u.hp/u.maxHp<.35:rule?.when==='allyHurt'?allies.some(a=>a.hp/a.maxHp<.35):rule?.when==='channel'?enemies.some(e=>e.nativeAction&&!e.nativeAction.released&&!e.nativeAction.charged):rule?.when==='shield'?enemies.some(e=>e.shield>0):rule?.when==='wounded'?enemies.some(e=>e.hp/e.maxHp<.3):false;
  if(match&&RESPONSES[rule.do])return {response:rule.do,condition:CONDITIONS[rule.when],text:RESPONSES[rule.do]};
 }
 return null;
}
export function terrainFor(run,seed){
 if((run.rulesVersion||0)>=15||!run.native||run.depth===0||(run.encounterType!=='boss'&&seed%3===0))return [];
 const shift=(seed%5-2)*12;
 return [{id:'north-pillar',x:478+shift,y:305,r:34},{id:'south-pillar',x:554-shift,y:594,r:38}];
}
export function firstTerrainHit(start,end,terrain,radius=0){
 let first=null;for(const rock of terrain){const t=sweepCircle(start,end,rock,rock.r+radius);if(t!==null&&(!first||t<first.t))first={t,rock};}return first;
}
export function terrainSteering(u,goal,terrain){
 const blocked=firstTerrainHit(u,goal,terrain,(u.radius||17)+9);if(!blocked)return goal;
 const rock=blocked.rock,padding=rock.r+(u.radius||17)+26,side=u.nativeAvoidSide||(u.nativeAvoidSide=u.y<rock.y?-1:1),direction=goal.x>=u.x?1:-1;
 return {x:rock.x-direction*padding,y:rock.y+side*padding};
}
export function confineTerrain(u,terrain){
 for(const rock of terrain){const dx=u.x-rock.x,dy=u.y-rock.y,d=Math.hypot(dx,dy),radius=rock.r+(u.radius||17)+.2;if(d>=radius)continue;const angle=d>.001?Math.atan2(dy,dx):Math.PI/2;u.x=rock.x+Math.cos(angle)*radius;u.y=rock.y+Math.sin(angle)*radius;}
}
export function orderGoal(u,target,allies,enemies,response){
 const nearest=enemies.slice().sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
 if(response?.response==='retreat'&&nearest)return {x:u.x+(u.x-nearest.x)*3,y:u.y+(u.y-nearest.y)*3,intent:'Retreating · low health'};
 if((u.order==='escort'||response?.response==='protect')&&allies.length){const ally=allies.slice().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],threat=enemies.slice().sort((a,b)=>Math.hypot(a.x-ally.x,a.y-ally.y)-Math.hypot(b.x-ally.x,b.y-ally.y))[0];if(ally!==u&&threat){const d=Math.hypot(threat.x-ally.x,threat.y-ally.y)||1;return {x:ally.x+(threat.x-ally.x)/d*65,y:ally.y+(threat.y-ally.y)/d*65,intent:'Escorting '+ally.id};}}
 if(u.order==='hold'&&u.nativeHome&&Math.hypot(target.x-u.nativeHome.x,target.y-u.nativeHome.y)>105+(u.range||50))return {...u.nativeHome,intent:'Holding the deployment lane'};
 if(u.order==='flank'&&Math.hypot(target.x-u.x,target.y-u.y)>u.range+10&&Math.hypot(target.x-u.x,target.y-u.y)<230)return {x:target.x+(u.side?35:-35)*(u.balanceVersion>=15?u.nativeScale||.15:1),y:target.y+(u.y<target.y?-70:70)*(u.balanceVersion>=15?u.nativeScale||.15:1),intent:'Flanking the occupied front'};
 return null;
}

// Reserve reachable ground positions instead of steering every attacker into a target's center.
export function combatApproach(u,target,units,bounds){
 const alive=units.filter(a=>a.hp>0&&!a.captured&&a!==u&&a!==target),distance=Math.hypot(u.x-target.x,u.y-target.y),ranged=u.range>100;
 const gap=u.radius+target.radius+.8,reach=ranged?u.range*.78:Math.max(gap,u.range*.88);
 const current=Math.atan2(u.y-target.y,u.x-target.x),previous=u.engagement;
 // A fighter already in a clear attack position plants its feet through cooldown/recovery.
 const crowded=alive.some(a=>Math.hypot(a.x-u.x,a.y-u.y)<u.radius+a.radius+1);
 if(!crowded&&distance>=gap-.2&&distance<=reach+.3&&(!ranged||distance>=u.range*.55)){
  u.engagement={targetUid:target.uid,angle:current,x:u.x,y:u.y};return {x:u.x,y:u.y,intent:ranged?'Holding firing range':'Holding striking range'};
 }
 let best=null;
 for(let i=0;i<24;i++){
  const angle=current+i*Math.PI/12,x=target.x+Math.cos(angle)*reach,y=target.y+Math.sin(angle)*reach,b=u.entityBounds||bounds;
  if(b&&(x<b.left+u.radius||x>b.right-u.radius||y<b.top+u.radius||y>b.bottom-u.radius))continue;
  let score=Math.hypot(x-u.x,y-u.y);
  if(previous?.targetUid===target.uid)score+=Math.abs(Math.atan2(Math.sin(angle-previous.angle),Math.cos(angle-previous.angle)))*8;
  for(const a of alive){
   const clearance=u.radius+a.radius+2,d=Math.hypot(x-a.x,y-a.y);
   if(d<clearance)score+=(clearance-d)*18+35;
   if(a.side===u.side&&a.engagement?.targetUid===target.uid){const reserved=Math.hypot(x-a.engagement.x,y-a.engagement.y);if(reserved<clearance)score+=(clearance-reserved)*12;}
  }
  if(!best||score<best.score)best={x,y,angle,score};
 }
 if(!best)return null;
 u.engagement={targetUid:target.uid,angle:best.angle,x:best.x,y:best.y};
 return {x:best.x,y:best.y,intent:ranged?'Finding a clear firing position':'Approaching an open striking position'};
}
export function avoidCombatBodies(u,vx,vy,units){
 const length=Math.hypot(vx,vy);if(length<.001)return {x:vx,y:vy};
 let x=vx,y=vy;
 for(const a of units){
  if(a===u||a.hp<=0||a.captured||u.range<=100&&a===u.targetMemory)continue;
  const dx=a.x-u.x,dy=a.y-u.y,d=Math.hypot(dx,dy)||.001,nx=dx/d,ny=dy/d,gap=u.radius+a.radius+2;
  const along=dx*vx/length+dy*vy/length,across=dx*(-vy)/length+dy*vx/length;
  if(along<=0||along>gap+Math.min(38,Math.hypot(u.velocityX||0,u.velocityY||0)*.22+12)||Math.abs(across)>gap)continue;
  const closeness=Math.max(0,Math.min(1,(gap+14-d)/14)),closing=Math.max(0,x*nx+y*ny);
  x-=nx*closing*closeness;y-=ny*closing*closeness;
  // Keep a stable passing side even when the obstacle is directly ahead.
  const side=Math.abs(across)>.5?(across>0?-1:1):(String(u.uid)<String(a.uid)?1:-1);
  x+=-ny*side*closeness*.65;y+=nx*side*closeness*.65;
 }
 return {x,y};
}
