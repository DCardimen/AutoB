import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Battle,makeRun,encounter} from '../game.js';

// Records a real game fight for the 3D preview: Rowan (seat 1, with the
// Copper Practice Bow a Ranger starts with) against the Unseasoned level 1
// Brakk the first-world encounter builder rolls. The game's own Battle runs
// headless at its fixed 0.04 s step; every decision (movement, facing,
// shots, the Fan, Brakk's strikes and Sundering Rush, sidesteps, knockback,
// staggers, damage and the knockout) is the engine's. The 3D scene only
// replays it, so the preview shows what the game would do.
export const SKIRMISH={seed:7,foeId:'brakk',step:.04,limit:60};

export function recordGameSkirmish({seed=SKIRMISH.seed,limit=SKIRMISH.limit}={}){
 const run=makeRun(seed,['aurel','rowan']),rowan=run.team.find(c=>c.id==='rowan');run.team=[rowan];
 let foe=null,encounterSeed=0;for(let i=1;i<1000&&!foe;i++){const f=encounter(run,'battle',i).find(c=>c.id===SKIRMISH.foeId);if(f){foe=f;encounterSeed=i;}}
 const battle=new Battle(run,[foe],seed,{visuals:false}),units=[0,1].map(side=>battle.units.find(u=>u.side===side));
 const round=(v,d=2)=>Math.round(v*10**d)/10**d,events=[],frames=[],actions=new Map(),actionSerial=[0,0],seenProjectiles=new Map(),seenStrikes=new Set(),rolls=units.map(u=>u.rollCount||0);
 // Damage, from the engine's own hit path.
 const hit=battle.hit.bind(battle);battle.hit=(target,amount,source,skillId,...rest)=>{const before=target.hp,result=hit(target,amount,source,skillId,...rest);if(before!==target.hp)events.push({t:round(battle.time,3),type:'damage',target:target.side,source:source?.side??null,skill:skillId??null,amount:round(before-target.hp),hp:round(target.hp)});return result;};
 // Shots, from the engine's projectile spawn (a close arrow can spawn and land within one step).
 const fire=battle.projectile.bind(battle);battle.projectile=(...args)=>{const before=battle.projectiles.length,result=fire(...args);for(const p of battle.projectiles.slice(before))if(!seenProjectiles.has(p.key)){seenProjectiles.set(p.key,p);events.push({t:round(battle.time,3),type:'shot',key:p.key,source:p.source.side,skill:p.skillId??null,x:round(p.x),y:round(p.y),vx:round(p.vx),vy:round(p.vy),speed:round(Math.hypot(p.vx,p.vy))});}return result;};
 const describe=u=>({id:u.id,name:u.name||u.id,hp:round(u.hp),maxHp:round(u.maxHp),atk:round(u.atk),armor:round(u.armor),range:round(u.range),speed:round(u.speed),attackInterval:round(1/u.attackSpeed,3),radius:round(u.radius),scale:u.nativeScale,mass:u.mass,maxPoise:u.maxPoise,dodgeStyle:u.dodgeStyle||null,equipment:(run.team.includes(rowan)&&u.side===0?rowan.equipment:foe.equipment)||[]});
 const header={source:'game.js Battle (headless, visuals off)',rulesVersion:run.rulesVersion,seed,encounterSeed,step:SKIRMISH.step,bounds:battle.bounds,units:units.map(describe),foeTraining:foe.encounterTraining||null};
 const frame=()=>({t:round(battle.time,3),u:units.map((u,side)=>{const a=u.nativeAction;let id=0;if(a){if(!actions.has(a))actions.set(a,++actionSerial[side]);id=actions.get(a);}
  return {x:round(u.x),y:round(u.y),f:round(u.facing??0,3),vx:round(u.velocityX||0),vy:round(u.velocityY||0),hp:round(Math.max(0,u.hp)),st:round(u.stamina||0,1),roll:round(u.rollTime||0,3),stg:round(u.stagger||0,3),kd:round(u.nativeKnockdown||0,3),dash:u.dashMotion?round(u.dashMotion.speed||0):0,
   a:a?{id,el:round(a.elapsed,3),w:round(a.windup,3),d:round(a.duration,3),style:a.style,ch:!!a.charged,hv:!!a.heavy,cast:!!a.casting,skill:a.skillId||null,rel:!!a.released}:null};})});
 frames.push(frame());
 while(!battle.done&&battle.time<limit){
  battle.advance(SKIRMISH.step);
  for(const p of battle.projectiles)if(!seenProjectiles.has(p.key)){seenProjectiles.set(p.key,p);events.push({t:round(battle.time,3),type:'shot',key:p.key,source:p.source.side,skill:p.skillId??null,x:round(p.x),y:round(p.y),vx:round(p.vx),vy:round(p.vy),speed:round(Math.hypot(p.vx,p.vy))});}
  for(const [key,p]of seenProjectiles)if((p.dead||!battle.projectiles.includes(p))&&!p.recorded){p.recorded=true;events.push({t:round(battle.time,3),type:'shotEnd',key,x:round(p.x),y:round(p.y)});}
  for(const s of battle.strikes)if(!seenStrikes.has(s.key)){seenStrikes.add(s.key);events.push({t:round(battle.time,3),type:'strike',key:s.key,source:s.source.side,skill:s.skillId??null,charged:!!s.charged,heavy:!!s.heavy,windup:round(s.total,3),recovery:round(s.recovery,3),reach:round(s.reach),arc:round(s.arc,3),style:s.style||null,dx:round(s.dx,3),dy:round(s.dy,3)});}
  units.forEach((u,side)=>{if((u.rollCount||0)>rolls[side]){rolls[side]=u.rollCount;events.push({t:round(battle.time,3),type:'dodge',unit:side,style:u.dodgeStyle||null,dx:round(u.rollX,3),dy:round(u.rollY,3)});}});
  frames.push(frame());
 }
 for(const [side,u]of units.entries())if(u.hp<=0)events.push({t:round(battle.time,3),type:'defeated',unit:side});
 events.sort((a,b)=>a.t-b.t);
 return {...header,winner:battle.winner,duration:round(battle.time,3),events,frames};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out='public/meshy-fox-preview/game-skirmish.json',r=recordGameSkirmish();
 fs.writeFileSync(out,JSON.stringify(r)+'\n');
 const count=type=>r.events.filter(e=>e.type===type).length;
 console.log(JSON.stringify({out,duration:r.duration,winner:r.winner,units:r.units.map(u=>({id:u.id,hp:u.hp,atk:u.atk,attackInterval:u.attackInterval})),shots:count('shot'),strikes:count('strike'),dodges:count('dodge'),damage:count('damage')}));
}
