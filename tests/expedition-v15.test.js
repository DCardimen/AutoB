import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,Battle,encounter,captureChance,rollCapture,awardCapture,rewardBattle,generateShop,generateRoute,stats,personalRelic,equipRelic,linkRelic} from '../game.js';
import {NATIVE_STARTERS,pixelSpec} from '../native-content.js';
import {starterBudget,starterPoints} from '../tactics.js';
import {CAPTURERS,unlockSlots,capacity} from '../expedition-rules.js';
import {CREATURE_GEAR,equipmentSlots,equipmentEffects,armorReduction,claimEvolutionGear} from '../creature-equipment.js';
import {EXPANDED_GEAR} from '../equipment-catalog.js';
import {AI_RELICS,tacticalTarget} from '../ai-relics.js';
import {compileRelics,relicEvent,relicTick,relicDamageFactor,relicReduction} from '../run-relics.js';
import {terrainFor} from '../native-tactics.js';
import {advanceNative,nativeBladePoint} from '../native-combat.js';
import {characterRig} from '../prototype-rig.js';
import {nativeFormRig} from '../native-forms.js';
import {applyLoadoutDrop} from '../loadout-interactions.js';
import {STATUS_AILMENTS,activeAilments,annotateAilments} from '../status-ailments.js';
const fixture=()=>{const r=makeRun(11,NATIVE_STARTERS),b=new Battle(r,[creature('brakk',3)],11,{visuals:false}),[u,a,t]=b.units;u.x=400;u.y=400;a.x=415;a.y=400;t.x=420;t.y=400;return {r,b,u,a,t};};

test('new runs enforce a three-point budget independently of their two team places',()=>{
 assert.equal(starterBudget({}),3);assert.equal(starterBudget({chaosCleared:1}),4);assert.equal(starterBudget({chaosCleared:8}),11);assert.equal(starterBudget({chaosCleared:20}),23);
 assert.equal(starterPoints('Legendary',5),4);const run=makeRun(3,NATIVE_STARTERS);assert.equal(run.rulesVersion,17);assert.equal(run.team.length,2);
 assert.throws(()=>makeRun(3,['solara','aurel']),/point budget/);assert.equal(makeRun(3,['nyra']).team.length,1);assert.equal(capacity(makeRun(3,['nyra'])),2);
 assert.equal(makeRun(3,['solara','aurel'],{starterBudget:8}).team.length,2);
});
test('the third monster place unlocks after two wins, with later places still earned',()=>{const r=makeRun(4,NATIVE_STARTERS);r.wins=1;assert.equal(unlockSlots(r),0);r.wins=2;assert.equal(unlockSlots(r),1);assert.equal(capacity(r),3);r.wins=5;assert.equal(unlockSlots(r),1);r.wins=11;unlockSlots(r);assert.equal(capacity(r),6);});
test('a growing party can reach its first outpost through a common room and buy recruits at local encounter level',()=>{for(let seed=1;seed<=32;seed++){const r=makeRun(seed,NATIVE_STARTERS),route=generateRoute(r),shop=route[3].find(n=>n.type==='shop');assert.ok(shop);assert.ok(route[2].some(n=>n.type==='battle'&&n.children.includes(shop.id)));assert.ok(route.flat().every(n=>n.depth===7||n.children.length>=1&&n.children.length<=4));r.depth=3;assert.ok(generateShop(r,seed).recruits.every(c=>c.level===2));}});
test('common captures are accessible while rare creatures keep a meaningful health and tool gamble',()=>{
 const r=makeRun(4,NATIVE_STARTERS),target=(id,hp,tool='scout')=>({...creature(id),capturePreparation:{tool,healthFraction:hp,mode:'mercy'}});
 assert.equal(captureChance(r,target('aurel',.25)),.9);assert.equal(captureChance(r,target('nyra',.25)),.85);
 assert.ok(captureChance(r,target('cogwalker',.05))>captureChance(r,target('cogwalker',.75))*2.5);
 assert.ok(captureChance(r,target('cogwalker',.25,'mythic'))>captureChance(r,target('cogwalker',.25)));
 const before=r.orbs;assert.match(rollCapture(r,creature('brakk')).reason,/before battle/);assert.equal(r.orbs,before);
});
test('a planned capturer no longer protects a target from lethal hits or captures its corpse',()=>{const {r}=fixture(),foe=creature('brakk');r.captureOrder={uid:foe.uid,threshold:.05,tool:'scout',mode:'mercy'};const b=new Battle(r,[foe],7,{visuals:false}),u=b.units[0],t=b.units.at(-1);b.damageUnit(t,t.maxHp*10,u,u.loadout.auto,1,'physical');assert.equal(t.hp,0);b.attemptCapture();assert.equal(b.captureResult.success,false);assert.match(b.captureResult.reason,/Knocked out/);assert.equal(b.metrics.captures,0);});
test('preselected captures resolve once and retain the individual’s equipment and quality',()=>{const {r}=fixture(),foe=encounter(r,'battle',12)[0];r.captureOrder={uid:foe.uid,threshold:.25,tool:'runic',mode:'mercy'};const b=new Battle(r,[foe],7,{visuals:false}),t=b.units.at(-1);t.hp=t.maxHp*.2;b.random=()=>0;b.attemptCapture();assert.equal(b.captureResult.success,true);assert.ok(b.captureScene);const caught=awardCapture(r,b.captureResult.creature);assert.deepEqual(caught.equipment,foe.equipment);assert.equal(caught.equipmentQuality,1);assert.deepEqual(equipmentEffects(caught),equipmentEffects(foe));b.attemptCapture();assert.equal(b.metrics.captures,1);});
test('150 equipment features are distinct, character-wide and use real supported hooks',()=>{assert.equal(EXPANDED_GEAR.length,150);assert.equal(new Set(EXPANDED_GEAR.map(g=>g.id)).size,150);assert.equal(new Set(EXPANDED_GEAR.map(g=>JSON.stringify([g.hook,g.effect]))).size,150);assert.equal(CREATURE_GEAR.length,203);for(const g of EXPANDED_GEAR){assert.ok(['hit','hurt','dodge','cast','heal','kill','death','tick','fatal','flat'].includes(g.hook));assert.equal(g.skillId,undefined);}const c={...creature('aurel'),balanceVersion:15,equipment:['sunsteel-edge']};assert.equal(equipmentSlots(c),3);assert.ok(Math.abs(equipmentEffects(c).attack-1.08)<1e-9);assert.equal(claimEvolutionGear({team:[c],gearInventory:[]},0,'prism-focus'),false);c.evolution=1;assert.equal(equipmentSlots(c),4);});
test('equipment changes actual hits, defensive counters, cooldown recovery and wearer protection',()=>{
 const {b,u,a,t}=fixture();u.equipment=['venom-sabre','warding-bell','tempo-soles'];compileRelics(b,u);for(let i=0;i<3;i++)b.hit(t,1,u,u.loadout.auto,1,true,'physical');assert.ok(t.poison>0);const shield=u.shield,allyShield=a.shield;relicEvent(b,u,'cast',{target:t,skillId:u.loadout.active[0]});assert.ok(u.shield>shield);assert.equal(a.shield,allyShield);const cd=Object.values(u.cooldowns)[0];cd.remaining=6;relicEvent(b,u,'dodge');assert.ok(cd.remaining<6);
 u.equipment=['riposte-harness'];compileRelics(b,u);u.shield=0;const hp=t.hp;b.damageUnit(u,10,t,t.loadout.auto,0,'physical');assert.ok(t.hp<hp);
});
test('every new equipment feature has a observable effect in its appropriate combat situation',()=>{
 for(const gear of EXPANDED_GEAR){
  const {b,u,a,t}=fixture();u.equipment=[gear.id];compileRelics(b,u);const e=gear.effect;
  u.hp=u.maxHp*(e.condition==='healthy'?.9:.25);a.hp=a.maxHp*.15;u.shield=40;u.stamina=10;u.motion=e.condition==='still'?0:1;u.burn=u.poison=u.root=2;u.lastRelicCast=b.time;
  t.burn=t.poison=t.bleed=t.slow=t.root=t.exposed=t.haste=t.evade=.1;t.hp=t.maxHp*.2;t.shield=50;t.nativeAction={released:false,charged:false};Object.values(u.cooldowns).forEach(cd=>cd.remaining=10);
  b.units.push({...t,uid:'gear-secondary',x:425,y:415,burn:0,poison:0,bleed:0});
  if(e.condition==='alone')a.x=900;if(e.condition==='far')t.x=750;if(e.condition==='flanked')b.units.push({...t,uid:'flanker',x:410});
  if(gear.hook==='flat'){const c={...b.run.team[0],equipment:[gear.id]},plain={...c,equipment:[]},withGear=stats(c,[c]),without=stats(plain,[plain]);if(e.regenStamina)assert.ok(equipmentEffects(c).regenStamina>1,gear.id);else assert.notDeepEqual(withGear,without,gear.id);continue;}
  if(e.damage){assert.ok(relicDamageFactor(b,u,t,{auto:true})>1,gear.id);continue;}
  if(e.reduction){assert.ok(relicReduction(b,u,t)<1,gear.id);continue;}
  if(gear.hook==='fatal'){u.hp=0;b.defeat(u,t,t.loadout.auto);assert.ok(u.hp>0,gear.id);continue;}
  const snapshot=()=>JSON.stringify({units:b.units.map(c=>[c.hp,c.shield,c.poison,c.burn,c.bleed,c.root,c.slow,c.wither,c.exposed,c.haste,c.evade,c.armorBuff,c.stamina,c.dodgeCooldown,c.impulseX,c.impulseY,c.statusWard,c.taunt]),cooldowns:Object.values(u.cooldowns).map(cd=>cd.remaining),queued:b.queue.length});
  const before=snapshot();for(let i=0;i<(e.every||1);i++)relicEvent(b,u,gear.hook,{target:t,source:t,dealt:10,real:10,excess:20,def:{auto:true},skillId:u.loadout.active[0],kind:'physical'});
  assert.notEqual(snapshot(),before,`${gear.id} must change actual state rather than only record a proc`);
 }
});
test('armor has diminishing returns, benefits guardians more and leaves poison dangerous',()=>{assert.ok(armorReduction(40,'Guardian')>armorReduction(40,'Striker'));assert.ok(armorReduction(80)-armorReduction(40)<armorReduction(40));const {b,u,t}=fixture();u.shield=0;u.armor=100;u.role='Guardian';const hp=u.hp;b.damageUnit(u,20,t,t.loadout.auto,0,'physical',false);const direct=hp-u.hp,after=u.hp;b.damageUnit(u,20,t,t.loadout.auto,0,'status',false);assert.ok(direct<20);assert.equal(after-u.hp,20);assert.ok(b.metrics.armorPrevented>0);});
test('enemies have limited coherent equipment/relic builds and stronger late item quality',()=>{const r=makeRun(5,NATIVE_STARTERS),early=encounter(r,'battle',5);assert.ok(early.every(c=>c.equipment.length===1&&c.enemyRelics.length));assert.ok(early.every(c=>c.relicBuild===early[0].relicBuild));r.planet=2;r.depth=5;r.difficulty='chaos';r.chaos=15;const late=encounter(r,'elite',5);assert.ok(late.every(c=>c.equipment.length===2));assert.ok(late[0].enemyRelics.length>early[0].enemyRelics.length);assert.ok(late[0].equipmentQuality>early[0].equipmentQuality);assert.deepEqual(terrainFor(r,5),[]);});
test('AI relics coordinate focus fire and reserve interrupts instead of adding flat stats',()=>{assert.equal(AI_RELICS.length,12);const {b,u,a,t}=fixture(),other={...t,uid:'other',x:410,hp:200,maxHp:200,side:1};b.units.push(other);u.aiEffects={focusFire:true};a.targetMemory=t;assert.equal(tacticalTarget(b,u,[t,other]),t);u.aiEffects={interrupt:true};other.nativeAction={released:false,charged:false};assert.equal(tacticalTarget(b,u,[t,other]),other);other.nativeAction.charged=true;assert.equal(tacticalTarget(b,u,[t,other]),null);});
test('equipment and skill drag/drop preserve items, reject incompatible links and change priorities',()=>{const r=makeRun(4,['aurel','grit']),c=r.team[0];r.gearInventory=[{uid:'new',id:'venom-sabre'}];assert.ok(applyLoadoutDrop(r,{kind:'gear',uid:'new',id:'venom-sabre'},{index:0}));assert.equal(r.gearInventory.length,0);assert.ok(applyLoadoutDrop(r,{kind:'gear',id:'venom-sabre',fromIndex:0,slot:1},{index:1}));assert.ok(r.team[1].equipment.includes('venom-sabre'));assert.equal(c.equipment.includes('venom-sabre'),false);r.inventory=[personalRelic('quick-shard')];const item=r.inventory[0];assert.ok(applyLoadoutDrop(r,{kind:'gem',id:item.id,uid:item.uid},{index:0}));const count=c.relics.length;assert.equal(applyLoadoutDrop(r,{kind:'gem',id:item.id,uid:item.uid,fromIndex:0,slot:0},{index:0,skill:'nonexistent'}),false);assert.equal(c.relics.length,count);
 c.level=8;const b=new Battle(r,[creature('brakk')],4,{visuals:false}),skills=b.units[0].loadout.active;assert.ok(applyLoadoutDrop(r,{kind:'skill',id:skills[1],fromIndex:0},{index:0,skill:skills[0]}));const next=new Battle(r,[creature('brakk')],4,{visuals:false});assert.equal(next.units[0].loadout.active[0],skills[1]);
});
test('elite rewards and shops offer two expensive relics; status help matches real ailments',()=>{const r=makeRun(3,NATIVE_STARTERS),stock=generateShop(r,22);assert.equal(stock.relics.length,2);assert.equal(rewardBattle(r,'elite',true).relicChoices.length,2);assert.ok(STATUS_AILMENTS.bleed.desc.includes('9.6'));assert.deepEqual(activeAilments({burn:2,poison:0}).map(a=>a.id),['burn']);assert.match(annotateAilments('Poisoned and rooted'),/title=/);});
test('ordinary gear rewards expose the expanded equipment pool without granting an item automatically',()=>{const ids=[];for(let seed=1;seed<=40;seed++){const r=makeRun(seed,NATIVE_STARTERS);r.wins=2;const before=r.gearInventory.length,result=rewardBattle(r,'battle',true);assert.equal(r.gearInventory.length,before);if(result.equipmentReward){assert.ok(CREATURE_GEAR.some(g=>g.id===result.equipmentReward));ids.push(result.equipmentReward);}}assert.ok(ids.length>10&&ids.length<40);assert.ok(new Set(ids).size>10);});
test('movement cadence is bounded at the new tiny scale and grips remain connected in every direction',()=>{const {u}=fixture();u.velocityX=180;u.velocityY=0;u.nativeAction=null;u.stagger=0;const previous=u.nativeActor.gait;u.px=u.x-180*.04;advanceNative(u,.04,1,false);assert.ok(u.nativeActor.gait-previous<=.04*3.6);for(const id of ['aurel','brakk','syl','nyra','rowan','brom','grit','morrow','grum'])for(const pose of ['idle','attack']){const spec=pixelSpec(id),rig=nativeFormRig(spec,{id},characterRig(spec.nativeRig,pose,.8,'windup'));if(rig.weapon&&rig.arms.length)assert.ok(rig.arms.some(a=>Math.hypot(a.end.x-rig.weapon.grip.x,a.end.y-rig.weapon.grip.y,a.end.z-rig.weapon.grip.z)<.001),id);}});
