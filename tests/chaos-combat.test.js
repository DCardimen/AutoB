import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,Battle,stats,encounter,SPECIES} from '../game.js';
import {starterBudget,starterSlots} from '../tactics.js';
import {capacity,unlockSlots,chooseLegendaryPact,newCasualty,makeLoot,claimLoot} from '../expedition-rules.js';
import {CHAOS_RELICS,CHAOS_GEAR} from '../combat-expansion.js';
import {EXPEDITION_RELICS,compileRelics,relicEvent} from '../run-relics.js';
import {CREATURE_GEAR,equipmentEffects,equipmentDescription} from '../creature-equipment.js';

const fresh=(seed=61,options={})=>makeRun(seed,['aurel','brakk'],options);
const arena=(relics=[])=>{
  const run=fresh();run.relics=relics;
  const b=new Battle(run,[creature('nyra'),creature('morrow')],17,{visuals:false});
  return {run,b,u:b.units[0],a:b.units[1],t:b.units[2],other:b.units[3]};
};

test('every cleared Chaos tier grants a point, and Chaos 3 opens the third initial place',()=>{
  for(let tier=0;tier<=20;tier++)assert.equal(starterBudget({chaosCleared:tier}),3+tier);
  assert.equal(starterSlots({chaosCleared:2}),2);assert.equal(starterSlots({chaosCleared:3}),3);
  const r=makeRun(1,['aurel','brakk','nyra'],{chaosCleared:3});
  assert.equal(r.team.length,3);assert.equal(capacity(r),3);
  assert.equal(capacity(fresh(2,{difficulty:'chaos',chaos:3})),3);
  assert.throws(()=>makeRun(1,['solara']),/point budget/);
});

test('new runs get exactly one seeded relic with variation across seeds',()=>{
  const relics=new Set();
  for(let seed=1;seed<=40;seed++){const r=fresh(seed);assert.equal(r.relics.length,1);assert.equal(r.relics[0],fresh(seed).startingRelic);assert.ok(EXPEDITION_RELICS.some(x=>x.id===r.relics[0]));relics.add(r.relics[0]);}
  assert.ok(relics.size>20);
});

test('all 30 relics and 50 pieces of equipment have unique IDs and usable descriptions',()=>{
  assert.equal(CHAOS_RELICS.length,30);assert.equal(CHAOS_GEAR.length,50);
  assert.equal(CHAOS_RELICS.filter(r=>r.tier==='jackpot').length,5);
  assert.equal(CHAOS_RELICS.filter(r=>r.tier==='comfort').length,5);
  assert.equal(new Set(EXPEDITION_RELICS.map(r=>r.id)).size,EXPEDITION_RELICS.length);
  assert.equal(new Set(CREATURE_GEAR.map(r=>r.id)).size,CREATURE_GEAR.length);
  for(const g of CHAOS_GEAR)assert.ok(equipmentDescription(g).length>20,g.id);
});

test('basic attack, action, dash recovery and stamina stats change independently',()=>{
  const c={...creature('brakk'),balanceVersion:17,equipment:[]},base=stats(c,[c]);
  assert.equal(base.staminaRecharge,26);
  assert.ok(stats({...creature('aurel'),balanceVersion:17},[c]).staminaRecharge<base.staminaRecharge);
  assert.ok(stats(c,[c],['quicksilver-pulse']).attackSpeed>base.attackSpeed);
  assert.equal(stats(c,[c],['quicksilver-pulse']).actionSpeed,base.actionSpeed);
  assert.ok(stats(c,[c],['metronome-soul']).actionSpeed>base.actionSpeed);
  assert.equal(stats(c,[c],['metronome-soul']).attackSpeed,base.attackSpeed);
  assert.equal(stats(c,[c],['slipstream-knot']).dashCooldown,.75);
  assert.ok(stats(c,[c],['lung-of-the-storm']).staminaRecharge>base.staminaRecharge);
  c.equipment=['tempo-rapier','rift-sandals','sprinters-bellows'];
  const gear=equipmentEffects(c);assert.ok(gear.attackSpeed>1&&gear.dashCooldown<1&&gear.regenStamina>1);
});

test('action speed advances real cooldowns and stamina uses the displayed recharge rate',()=>{
  const {b,u}=arena(['metronome-soul','lung-of-the-storm']);u.hp=u.maxHp;u.stamina=20;
  u.actionLock=0;u.rollTime=0;u.dodgeCooldown=100;u.attackTimer=100;
  const cd=Object.values(u.cooldowns)[0];cd.remaining=10;
  const stamina=u.stamina;b.advance(.04);
  assert.ok(Math.abs(cd.remaining-(10-.04*u.actionSpeed))<1e-8);
  assert.ok(Math.abs(u.stamina-stamina-.04*u.staminaRecharge)<1e-8);
});

test('dodge relics refund actual dodge recovery without resetting skill cooldowns',()=>{
  const {b,u}=arena(['second-step']);u.dodgeCooldown=3;
  relicEvent(b,u,'dodge');assert.equal(u.dodgeCooldown,2.2);
  relicEvent(b,u,'dodge');assert.equal(u.dodgeCooldown,2.2,'internal cooldown prevents a second refund');
});

test('roles execute physical rolls, sidesteps, blinks and protected barrel dodges with real cooldown modifiers',()=>{
  for(const [id,style]of [['aurel','barrel'],['brakk','roll'],['syl','sidestep'],['nyra','blink']]){
    const r=makeRun(5,[id]);r.relics=['slipstream-knot'];
    const b=new Battle(r,[creature('brakk')],17,{visuals:false}),[u,t]=b.units;
    u.x=400;u.y=400;t.x=410;t.y=400;u.actionLock=0;u.dodgeCooldown=0;u.stamina=100;
    const from={x:u.x,y:u.y},shield=u.shield;
    const strike=b.beginStrike(t,u,t.loadout.auto);strike.remaining=.12;
    assert.ok(b.threatFor(u),id+' is inside a committed threat');b.reactToThreat(u,.4);
    assert.equal(u.dodgeStyle,style);assert.equal(u.rollCount,1,id);assert.equal(u.stamina,70);
    assert.ok(Math.abs(u.dodgeCooldown-(3.1-u.dodge*4)*.75)<1e-8);
    if(style==='blink'){assert.ok(Math.hypot(u.x-from.x,u.y-from.y)>30);assert.equal(u.rollTime,0);assert.ok(b.effects.some(e=>e.type==='blink'));}
    else assert.equal(u.rollTime,.25);
    if(style==='barrel'){assert.ok(u.shield>shield);assert.ok(u.barrelHits instanceof Set);}
  }
});

test('Sovereign’s Seat sacrifices exactly one place and grants the chosen Legendary once',()=>{
  const r=fresh();r.relics=['sovereigns-seat'];const original=r.team.map(c=>c.uid);
  const chosen=chooseLegendaryPact(r,'solara');assert.equal(chosen.id,'solara');assert.equal(capacity(r),1);
  assert.equal(r.team.length,1);assert.ok(r.bench.some(c=>c.uid===original[1]));assert.ok(r.bench.includes(chosen));
  assert.equal(chooseLegendaryPact(r,'solara'),false);r.wins=11;unlockSlots(r);assert.equal(capacity(r),5);
  const full=fresh();full.relics=['sovereigns-seat'];full.bench=Array.from({length:12},()=>creature('nyra'));
  assert.equal(chooseLegendaryPact(full,'solara'),false);assert.equal(capacity(full),2);assert.equal(full.legendaryPact,undefined);
});

test('casualties preserve expedition relics and recover bound and socketed relics exactly once',()=>{
  const r=makeRun(4,['aurel']);r.relics=['chrono-throne','polite-pebble'];r.team[0].boundRelics=['glass-dancer'];
  const socket={uid:'kept-socket',id:'quick-shard'};r.team[0].relics=[socket];const inventory=r.inventory.length;
  const result=newCasualty(r,'one',9);assert.equal(result.destroyedRelic,null);
  assert.deepEqual(r.relics,['chrono-throne','polite-pebble','glass-dancer']);assert.equal(r.inventory.length,inventory+1);
  assert.ok(r.inventory.includes(socket));assert.deepEqual(result.destroyedItems,['reliquary-plate']);
  newCasualty(r,'one',9);assert.equal(r.inventory.length,inventory+1);assert.equal(r.relics.length,3);
});

test('round-one rolls reach every rarity and role, across seeds and outside the biome pool',()=>{
  const r=fresh(),seen=new Set(),roles=new Set(),rarities=new Set();
  for(let seed=1;seed<=4000;seed++)for(const c of encounter(r,'battle',seed)){seen.add(c.id);roles.add(c.role);rarities.add(SPECIES.find(s=>s.id===c.id).rarity);}
  assert.equal(rarities.size,5);assert.equal(roles.size,4);assert.ok(seen.size>SPECIES.length*.9);
  assert.deepEqual(encounter(r,'battle',33).map(c=>c.id),encounter(r,'battle',33).map(c=>c.id));
});

test('weakest-first targets current HP and manual focus expires, respects taunts and adapts to distance',()=>{
  const {run,b,u,t,other}=arena();run.stance='weakest';u.x=300;u.y=300;t.x=390;t.y=300;other.x=420;other.y=300;
  t.hp=30;other.hp=80;assert.equal(b.target(u),t);
  assert.ok(b.focusEnemy(other.uid));assert.equal(b.target(u),other);
  t.taunt=1;assert.equal(b.target(u),t);t.taunt=0;
  b.time=9;assert.equal(b.target(u),t);
  b.time=0;other.x=900;assert.equal(b.target(u),t);
  other.hp=0;assert.equal(b.focusEnemy(other.uid),false);
});

test('capturing switches allegiance for this battle, clears hostile commitments, before round-end roster recruitment',()=>{
  const r=fresh();r.relics=[];const foes=[creature('nyra'),creature('morrow')];
  r.captureOrder={uid:foes[0].uid,threshold:.25,tool:'scout',mode:'mercy'};
  const b=new Battle(r,foes,1,{visuals:false}),target=b.units[2],ally=b.units[0];
  target.hp=target.maxHp*.2;target.burn=3;b.random=()=>0;
  b.queue.push({source:target,ttl:1});b.projectiles.push({source:target});ally.targetMemory=target;
  const before=JSON.stringify([r.team,r.bench]);b.attemptCapture();
  assert.ok(b.captureResult.success);assert.equal(target.side,0);assert.equal(target.roundAlly,true);assert.ok(target.hp>0);
  assert.equal(target.burn,0);assert.equal(b.living(1).length,1);assert.ok(b.living(0).includes(target));
  assert.notEqual(b.target(ally),target);assert.equal(b.queue.length,0);assert.equal(b.projectiles.length,0);
  assert.equal(JSON.stringify([r.team,r.bench]),before);b.attemptCapture();assert.equal(b.metrics.captures,1);
  target.hp=0;assert.equal(makeLoot(r,'battle',[target],1).drops.some(d=>d.sourceId===target.id),false);
});

test('offensive cast relics cannot burn an allied healing target',()=>{
  const {b,u,a}=arena(['kindling-script']);compileRelics(b,u);
  relicEvent(b,u,'cast',{target:a,skillId:u.loadout.active[0]});assert.equal(a.burn,0);
});

test('a borrowed capture inherits the player’s speed relics and cannot be hit by queued friendly attacks',()=>{
  const r=fresh();r.relics=['chrono-throne'];const foes=[creature('nyra'),creature('morrow')];
  r.captureOrder={uid:foes[0].uid,threshold:.25,tool:'scout'};
  const b=new Battle(r,foes,17,{visuals:false}),t=b.units[2];t.hp=t.maxHp*.2;
  b.queue.push({source:b.units[0],target:t,single:true,ttl:1});b.random=()=>0;b.attemptCapture();
  assert.ok(t.actionSpeed>1.5);assert.ok(t.staminaRecharge>20);assert.equal(b.queue.length,0);
});

test('capturing the last enemy finishes the lattice before settling victory',()=>{
  const r=fresh(),foe=creature('nyra');r.relics=[];r.captureOrder={uid:foe.uid,threshold:.25,tool:'scout'};
  const b=new Battle(r,[foe],17,{visuals:false}),t=b.units.at(-1);t.hp=t.maxHp*.2;b.random=()=>0;
  b.advance(.04);assert.ok(b.captureScene);assert.equal(b.done,false);
  for(let i=0;i<70&&!b.done;i++)b.step(.04);
  assert.equal(b.captureScene,null);assert.equal(b.done,true);assert.equal(b.winner,0);
});

test('capture control remains available when permanent reserves are full',()=>{
  const {run,b,t}=arena();run.bench=Array.from({length:12},()=>creature('nyra'));
  b.capturePlan={uid:t.uid,threshold:.25,tool:'scout'};b.captureSettled=true;b.captureResult={success:false};b.captureAttempts=1;
  b.random=()=>0;t.hp=t.maxHp*.2;assert.equal(b.retryCapture(t.uid,'scout').ok,true);
  assert.equal(t.side,0);assert.equal(run.bench.length,12);
});

test('loot settlement remains idempotent after the collection animation',()=>{
  const r=fresh(),gold=r.gold,gearCount=r.gearInventory.length,cache={key:'test',drops:[{id:'coin',kind:'gold',amount:30},{id:'sword',kind:'gear',gear:'tempo-rapier'}]};
  assert.ok(claimLoot(r,cache));assert.equal(r.gold,gold+30);assert.equal(r.gearInventory.length,gearCount+1);
  assert.equal(claimLoot(r,cache),false);assert.equal(r.gold,gold+30);assert.equal(r.gearInventory.length,gearCount+1);
});
