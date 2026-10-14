import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TUNING,normalizeTuning,TUNING_OPTIONS} from '../tuning.js';
import {movementPace,steerMovement} from '../movement-tuning.js';
import {SettingsMovementPreview} from '../settings-movement-preview.js';
import {makeRun,creature,Battle,rng} from '../game.js';
import {advanceNative} from '../native-combat.js';
import {creatureTypeFactor} from '../native-size.js';
const ids=['steeringAgility','cornerSlowdown','runStartDistance','sprintStartDistance','gaitBlendSpeed'];
test('five movement controls and stride length extend settings to 19 and migrate older saved preferences',()=>{
 assert.equal(TUNING_OPTIONS.length,19);const old=normalizeTuning({movementSpeed:150,turnSpeed:200});
 for(const id of ids){assert.equal(old[id],100);assert.ok(TUNING_OPTIONS.some(o=>o.id===id&&o.group==='Movement patterns'));}
 assert.equal(old.movementSpeed,150);assert.equal(normalizeTuning({cornerSlowdown:-1}).cornerSlowdown,0);assert.equal(normalizeTuning({steeringAgility:999}).steeringAgility,250);
});
test('run and sprint distances change actual movement pace, preserving stamina and threshold ordering',()=>{
 for(const d of [0,90,180,181,320,321,700])for(const stamina of [20,55,100])assert.equal(movementPace(d,stamina,DEFAULT_TUNING),d>320&&stamina>55?2.15:d>180?1.65:1);
 assert.equal(movementPace(120,100,{runStartDistance:50}),1.65);assert.equal(movementPace(240,100,{runStartDistance:200}),1);
 assert.equal(movementPace(250,100,{sprintStartDistance:50}),2.15);assert.equal(movementPace(400,100,{sprintStartDistance:200}),1.65);
 assert.equal(movementPace(200,100,{runStartDistance:200,sprintStartDistance:50}),1);assert.equal(movementPace(500,20,{}),1.65);assert.equal(movementPace(500,100,{},false),1.65);
});
test('steering agility changes momentum redirection while corner slowdown changes turning speed independently',()=>{
 const slow=steerMovement(100,0,0,1,100,1,.04,{steeringAgility:25}),fast=steerMovement(100,0,0,1,100,1,.04,{steeringAgility:250});assert.ok(Math.atan2(fast.y,fast.x)>Math.atan2(slow.y,slow.x));
 const none=steerMovement(100,0,0,1,100,1,1,{cornerSlowdown:0}),normal=steerMovement(100,0,0,1,100,1,1,{}),heavy=steerMovement(100,0,0,1,100,1,1,{cornerSlowdown:200});assert.equal(none.y,100);assert.equal(normal.y,70);assert.equal(heavy.y,40);
 assert.deepEqual(steerMovement(100,0,1,0,100,1,.04,{cornerSlowdown:200}),{x:100,y:0});
 assert.equal(steerMovement(100,0,0,0,100,1,1,{steeringAgility:250}).x,0,'stopping still uses braking');
});
test('movement transitions change the live native gait blend, including scaled movement speed',()=>{
 const unit=(blend,movement=100)=>{const run=makeRun(37,['aurel']);run.relics=[];const b=new Battle(run,[creature('brakk')],31,{visuals:false}),u=b.units[0];u.speed=100;u.velocityX=165*movement/100;u.velocityY=0;u.px=u.x-u.velocityX*.04;u.py=u.y;u.tuning={...DEFAULT_TUNING,gaitBlendSpeed:blend,movementSpeed:movement};advanceNative(u,.04,.04,false);return u;};
 const slow=unit(25),fast=unit(250);assert.ok(fast.nativeActor.runBlend>slow.nativeActor.runBlend);assert.ok(fast.nativeActor.moving>slow.nativeActor.moving);
 assert.ok(Math.abs(unit(100,50).nativeActor.runBlend-.4)<1e-10,'half-speed movement still reaches the proper run blend');
});
test('changing run distance changes real battle travel for a closing creature',()=>{
 const travel=runStartDistance=>{const run=makeRun(37,['brakk']);run.relics=[];run.team[0].equipment=[];const b=new Battle(run,[creature('aurel')],31,{visuals:false}),[u,t]=b.units;b.terrain=[];b.setTuning({...DEFAULT_TUNING,runStartDistance,sprintStartDistance:200});
  u.x=u.px=300;u.y=u.py=430;t.x=t.px=550;t.y=t.py=430;u.speed=100;t.speed=0;
  for(const a of b.units){a.attackTimer=a.dodgeCooldown=999;for(const cd of Object.values(a.cooldowns))cd.remaining=999;}
  for(let i=0;i<20;i++)b.step(.04);return u.x-300;
 };
 assert.ok(travel(50)>travel(200)*1.3,'early running must close on the opponent faster than the walking preference');
});
test('settings examples keep their size groups and replace every creature after exactly five seconds',()=>{
 const p=new SettingsMovementPreview({now:100,random:rng(37)}),first=p.examples.map(e=>e.spec.id);p.update(104.999,DEFAULT_TUNING);assert.deepEqual(p.examples.map(e=>e.spec.id),first);p.update(105,DEFAULT_TUNING);assert.ok(p.examples.every((e,i)=>e.spec.id!==first[i]));assert.equal(p.batch,1);
 assert.ok(creatureTypeFactor(p.examples[0].spec)<=.9);assert.ok(creatureTypeFactor(p.examples[1].spec)>.9&&creatureTypeFactor(p.examples[1].spec)<1.2);assert.ok(creatureTypeFactor(p.examples[2].spec)>=1.2);
 const second=p.examples.map(e=>e.spec.id);p.update(110,DEFAULT_TUNING);assert.ok(p.examples.every((e,i)=>e.spec.id!==second[i]));assert.equal(p.batch,2);
});
test('examples demonstrate real walk/run/sprint/turn/stop transitions without editing the expedition',()=>{
 const run=makeRun(31,['aurel','brakk']),before=JSON.stringify(run),p=new SettingsMovementPreview({now:0,random:rng(19)}),states=new Set();
 for(let step=1;step<500;step++){p.update(step/100,DEFAULT_TUNING);for(const e of p.examples){states.add(e.state);assert.ok(Number.isFinite(e.unit.x)&&Number.isFinite(e.unit.nativeActor.gait));}}
 for(const state of ['walk','run','sprint','turn','stop'])assert.ok(states.has(state),state+' must be demonstrated');assert.equal(JSON.stringify(run),before);
});
