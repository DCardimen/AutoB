import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,SPECIES,settleCaptureRecruitment,captureChance} from '../game.js';
import {equipGear,GEAR_BY_ID,equipmentSlots,equipmentEffects,enemyEquipment,reconcileEquipment,equipmentSlotType,gearCompatibility} from '../creature-equipment.js';
import {applyLoadoutDrop} from '../loadout-interactions.js';
import {attachCaptureLoot,claimLoot} from '../expedition-rules.js';
import {captureTrackerState} from '../capture-tracker.js';
import {combatTextPresentation,queueCombatText} from '../combat-text.js';

test('five categories replace atomically, retain rolls, and double modern equipment effects',()=>{
 const r=makeRun(88,['aurel','brakk']),c=r.team[0];assert.equal(equipmentSlots(c),5);
 c.equipment=['sunsteel-edge'];c.equipmentRolls=[{quality:.8,rarity:'Epic',sourceName:'Old foe'}];
 r.gearInventory=[{uid:'new',id:'venom-sabre',quality:1.12,rarity:'Legendary'}];
 assert.ok(equipGear(r,0,'new'));assert.deepEqual(c.equipment,['venom-sabre']);
 assert.equal(c.equipmentRolls[0].quality,1.12);assert.equal(r.gearInventory[0].quality,.8);assert.equal(r.gearInventory[0].sourceName,'Old foe');
 for(const [i,id]of ['reliquary-plate','ruby-vigor-ring','windstep-boots','prism-focus'].entries()){r.gearInventory.push({uid:'slot'+i,id});assert.ok(equipGear(r,0,'slot'+i));}
 assert.equal(new Set(c.equipment.map(id=>equipmentSlotType(GEAR_BY_ID[id]))).size,5);
 assert.equal(equipmentEffects({...c,equipment:['sunsteel-edge'],equipmentRolls:[]}).attack,1.16);
 assert.equal(equipmentEffects({...c,equipmentVersion:1,equipment:['sunsteel-edge'],equipmentRolls:[]}).attack,1.08);
 const before=JSON.stringify(r);assert.equal(applyLoadoutDrop(r,{kind:'gear',uid:r.gearInventory[0].uid,id:'sunsteel-edge'},{index:0,gearType:'Ring'}),false);assert.equal(JSON.stringify(r),before);
});

test('migration preserves duplicate and incompatible items once with rolled data',()=>{
 const r=makeRun(9,['aurel','brakk']),c=r.team[0];delete c.equipmentVersion;
 c.equipment=['sunsteel-edge','venom-sabre','jade-fang'];c.equipmentRolls=[{quality:.7},{quality:.8,fromCapture:true},{quality:1.2}];
 const count=r.gearInventory.length;assert.equal(reconcileEquipment(r),2);assert.deepEqual(c.equipment,['sunsteel-edge']);
 assert.equal(r.gearInventory.length,count+2);assert.equal(r.gearInventory.at(-2).quality,.8);assert.equal(r.gearInventory.at(-2).fromCapture,true);assert.equal(reconcileEquipment(r),0);
});

test('enemies carry one item, elites/bosses two distinct usable categories in every family',()=>{
 for(const s of SPECIES)for(const type of ['normal','elite','boss'])for(const evolution of [0,1,2]){
  const c=enemyEquipment({...creature(s.id),role:s.role,evolution,[type]:true},83,7,2);
  assert.equal(c.equipment.length,type==='normal'?1:2,s.id+' '+type);
  assert.equal(new Set(c.equipment.map(id=>equipmentSlotType(GEAR_BY_ID[id]))).size,c.equipment.length);
  assert.ok(c.equipment.every(id=>gearCompatibility(c,GEAR_BY_ID[id]).allowed));
 }
 for(const id of ['emberhound','voltwing','onyxscarab'])assert.ok(gearCompatibility({id},GEAR_BY_ID['jade-fang']).allowed);
 for(const id of ['aurel','brakk'])assert.ok(gearCompatibility({id},GEAR_BY_ID['thorn-halberd']).allowed);
 assert.equal(gearCompatibility({id:'syl'},GEAR_BY_ID['thorn-halberd']).allowed,false);
});

test('capture gear is postgame loot once, including retreat; reload cannot duplicate grants',()=>{
 for(const won of [false,true]){
  const r=makeRun(93,['aurel','brakk']),enemy={...creature('nyra',5),equipment:['prism-focus'],equipmentQuality:.7,equipmentRolls:[{quality:1.1,rarity:'Rare'}]},result={success:true,uid:enemy.uid,creature:enemy};
  const recruitment=settleCaptureRecruitment(r,result),reward={won};assert.equal(r.bench[0].equipment.length,0);
  assert.ok(attachCaptureLoot(reward,result));assert.equal(reward.loot.drops.length,1);assert.equal(attachCaptureLoot(reward,result),false);
  const saved=JSON.parse(JSON.stringify({r,reward,result}));assert.deepEqual(settleCaptureRecruitment(saved.r,saved.result),recruitment);
  assert.equal(attachCaptureLoot(saved.reward,saved.result),false);const count=saved.r.gearInventory.length;
  assert.ok(claimLoot(saved.r,saved.reward.loot));assert.equal(saved.r.gearInventory.length,count+1);
  const item=saved.r.gearInventory.at(-1);assert.ok(Math.abs(item.quality-.77)<1e-9);assert.equal(item.fromCapture,true);assert.equal(item.id,'prism-focus');assert.equal(item.sourceUid,enemy.uid);
  assert.equal(claimLoot(saved.r,saved.reward.loot),false);
 }
});

test('tracker reports exact current engine odds, threshold progress, and terminal outcomes by UID',()=>{
 const r=makeRun(73),foes=[creature('syl'),creature('syl')];r.captureOrder={uid:foes[1].uid,threshold:.25,tool:'scout',mode:'mercy'};
 assert.equal(captureTrackerState(r,foes,'prep').uid,foes[1].uid);
 const target={...foes[1],hp:40,maxHp:100,poison:2},b={run:r,units:[target],capturePlan:r.captureOrder,captureAttempts:0};
 const state=captureTrackerState(r,foes,'battle',b);
 assert.equal(state.fraction,.4);assert.ok(Math.abs(state.progress-.8)<1e-9);
 assert.equal(state.chance,captureChance(r,{...target,capturePreparation:{healthFraction:.4,status:true,mode:'mercy',tool:'scout'}}));
 b.captureResult={uid:target.uid,success:true,chance:.91};assert.equal(captureTrackerState(r,foes,'battle',b).chance,.91);
 b.captureResult={uid:target.uid,success:false};b.captureAttempts=1;r.selectedCapturer='mythic';assert.equal(captureTrackerState(r,foes,'battle',b).tool,'mythic');assert.equal(captureTrackerState(r,foes,'battle',b).canRetry,true);b.captureScene={};assert.equal(captureTrackerState(r,foes,'battle',b).canRetry,false);b.captureScene=null;b.captureResult=null;target.hp=0;assert.match(captureTrackerState(r,foes,'battle',b).status,/Knocked out/);
 assert.equal(captureTrackerState(r,foes,'reward',b),null);
});

test('all enemy damage including crits and status is crimson; friendly damage is gold and smaller',()=>{
 const b={time:0,combatTexts:[],textSerial:0},u={uid:'victim',x:0,y:0,side:0};
 for(const kind of ['hit','crit','status']){
  queueCombatText(b,u,15,kind,{side:1});queueCombatText(b,{...u,side:1},15,kind,{side:0});
  const [enemy,friendly]=b.combatTexts.slice(-2).map(t=>combatTextPresentation(t,{reducedMotion:true}));
  assert.equal(enemy.bottom,'#ff526e');assert.notEqual(enemy.bottom,friendly.bottom);assert.notEqual(enemy.top,friendly.top);assert.ok(enemy.size<=21);
 }
 assert.equal(combatTextPresentation({kind:'heal',amount:5,max:1,ttl:1,sourceSide:1}).bottom,'#80e4ac');
});
