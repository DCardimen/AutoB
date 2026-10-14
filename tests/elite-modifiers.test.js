import test from 'node:test';
import assert from 'node:assert/strict';
import {ELITE_MODIFIERS,eliteModifierForSeed,assignEliteModifier,applyEliteStats,rememberEliteCapture,inheritEliteStarter,idleRhythm} from '../elite-modifiers.js';
import {makeRun,creature,encounter,encounterInfo,stats,BY_ID,Battle,settleCaptureRecruitment} from '../game.js';
import {nativeSpawn,NATIVE_BOUNDS} from '../native-combat.js';
import {pixelSpec} from '../native-content.js';
import {creatureWorldScale} from '../native-size.js';

test('50 unique elite mutations have distinct names, magnitudes and recipient rules',()=>{
 assert.equal(ELITE_MODIFIERS.length,50);assert.equal(new Set(ELITE_MODIFIERS.map(m=>m.id)).size,50);assert.equal(new Set(ELITE_MODIFIERS.map(m=>m.name)).size,50);
 assert.equal(new Set(ELITE_MODIFIERS.map(m=>m.stat+':'+m.amount+':'+m.target)).size,50);
 const seen=new Set();for(let seed=0;seed<1500;seed++)seen.add(eliteModifierForSeed(seed).id);assert.equal(seen.size,50);
});
test('every elite encounter has exactly one seeded mutation, matching stage scouting and reload',()=>{
 const run=makeRun(311,['aurel']);
 for(let seed=0;seed<80;seed++){
  const foes=encounter(run,'elite',seed),buffed=foes.filter(c=>c.eliteModifier);
  assert.equal(buffed.length,1);assert.equal(buffed[0].eliteModifier,encounterInfo(run,{type:'elite',seed}).eliteModifier.id);
  const repeat=encounter(run,'elite',seed);assert.equal(foes.findIndex(c=>c.eliteModifier),repeat.findIndex(c=>c.eliteModifier));
  const copy=JSON.parse(JSON.stringify(foes));assignEliteModifier(copy,seed,BY_ID);assert.deepEqual(copy,foes);
 }
 assert.ok(encounter(run,'battle',31).every(c=>!c.eliteModifier));
});
test('lowest-level, lowest-health, highest-attack and fastest rules select their actual recipient',()=>{
 const foes=[{id:'a',level:4},{id:'b',level:1},{id:'c',level:3}],species={a:{hp:200,atk:20,speed:100},b:{hp:300,atk:80,speed:40},c:{hp:100,atk:30,speed:60}},expected={'lowest-level':'b','lowest-health':'c','highest-attack':'b',fastest:'a'};
 for(const [target,id]of Object.entries(expected)){
  const seed=Array.from({length:1000},(_,i)=>i).find(seed=>eliteModifierForSeed(seed).target===target);
  assert.equal(assignEliteModifier(structuredClone(foes),seed,species).creature.id,id);
 }
});
test('all 50 mutations affect real combat stats once, including skill and dash cooldowns',()=>{
 const c=creature('aurel',4),plain=stats(c,[c]);
 for(const m of ELITE_MODIFIERS){const mutant={...c,eliteModifier:m.id},st=stats(mutant,[mutant]);
  assert.ok(Math.abs(st[m.stat]-(m.flat?plain[m.stat]+m.amount:plain[m.stat]*(1+m.amount)))<1e-8,m.id);
  if(m.stat==='cd')assert.ok(Math.abs(st.cdFactor-plain.cdFactor*(1+m.amount))<1e-8);
  assert.deepEqual(stats(mutant,[mutant]),st,'repeat inspection never stacks the buff');
 }
 assert.deepEqual(applyEliteStats({...plain},{eliteModifier:'invalid'}),plain);
});
test('capturing a mutated opponent retains its buff in combat, recruitment, saves and future starters',()=>{
 const run=makeRun(771,['aurel']);run.relics=[];const target={...creature('brakk',5),nature:'Fleet',genes:{hp:.9,atk:1.2,speed:1.1,cd:1},eliteModifier:'bloodtempo-lowest-level'};
 const b=new Battle(run,[target],31,{visuals:false}),u=b.units[1];u.hp=u.maxHp*.2;b.random=()=>0;b.capturePlan={uid:u.uid,threshold:.25,tool:'scout'};b.attemptCapture();
 assert.equal(b.captureResult.success,true);assert.equal(b.captureResult.creature.eliteModifier,target.eliteModifier);assert.equal(u.side,0);
 assert.equal(u.attackSpeed,stats(u,b.living(0),[]).attackSpeed);
 const claim=settleCaptureRecruitment(run,b.captureResult),caught=[...run.team,...run.bench].find(c=>c.uid===claim.uid);assert.equal(caught.eliteModifier,target.eliteModifier);
 const profile={};rememberEliteCapture(profile,b.captureResult);rememberEliteCapture(profile,b.captureResult);assert.equal(profile.eliteCaptures.length,1);
 const saved=JSON.parse(JSON.stringify(profile)),starter=creature('brakk');assert.ok(inheritEliteStarter(starter,saved,u.uid));assert.equal(starter.level,1);assert.equal(starter.eliteModifier,target.eliteModifier);assert.equal(starter.nature,'Fleet');assert.deepEqual(starter.genes,target.genes);assert.notEqual(starter.genes,saved.eliteCaptures[0].genes);
 assert.equal(inheritEliteStarter(creature('aurel'),saved,u.uid),false,'individual cannot transfer to another species');
 const different={...b.captureResult,uid:'another-individual'};rememberEliteCapture(profile,different);assert.equal(profile.eliteCaptures.length,2,'same-species captures remain distinct individuals');
 assert.equal(rememberEliteCapture(profile,{...b.captureResult,success:false}),null);
});
test('individual idle rhythms are stable and differ on both teams',()=>{
 const units=Array.from({length:12},(_,i)=>({id:'aurel',uid:'idle-'+i,side:i%2})),rhythms=units.map(idleRhythm);
 assert.equal(new Set(rhythms.map(r=>r.offset)).size,12);assert.ok(new Set(rhythms.map(r=>r.rate)).size>8);assert.deepEqual(idleRhythm(units[0]),rhythms[0]);
});
test('spawned and previously dragged creatures fit within the arena border at maximum size',()=>{
 for(const id of ['aurel','cogwalker','solara','runespider'])for(const side of [0,1])for(let seat=0;seat<6;seat++){
  const spec=pixelSpec(id),c={...creature(id,8),evolution:2},p=nativeSpawn(spec,c,side,seat),scale=creatureWorldScale(spec,c);
  assert.ok(p.x-90*scale>=NATIVE_BOUNDS.left);assert.ok(p.x+90*scale<=NATIVE_BOUNDS.right);assert.ok(p.y>=NATIVE_BOUNDS.top&&p.y<=NATIVE_BOUNDS.bottom);
  const clamped=nativeSpawn(spec,{...c,deploymentPosition:{x:-500,y:5000}},side,seat);assert.ok(clamped.x>=NATIVE_BOUNDS.left&&clamped.y<=NATIVE_BOUNDS.bottom);
 }
});
