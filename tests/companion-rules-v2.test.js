import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,buyCreature,BY_ID,deployReserve,Battle} from '../game.js';
import {initializeCompanion} from '../wearer-relics.js';
import {recruitOffer,buyRecruit} from '../expedition-rules.js';
import {equipmentSlots,equipmentSlotViews,equipGear,armorReduction,CREATURE_GEAR,gearCompatibility,equipmentSlotType} from '../creature-equipment.js';
import {updateAuras} from '../aura-stones.js';
import {focusKnockoutRisk} from '../capture-tracker.js';
import {nativeMuzzle} from '../native-combat.js';
import {PIXEL_SPECIES} from '../native-content.js';
test('both shop recruitment paths give every Legendary the five modern categories immediately',()=>{
 for(const s of Object.values(BY_ID).filter(s=>s.rarity==='Legendary')){
  const run=makeRun(9,['aurel','brakk'],{manualSkills:true});run.gold=10000;
  assert.ok(buyCreature(run,s.id));const c=run.bench.at(-1);assert.equal(equipmentSlots(c),5,s.id);assert.deepEqual(equipmentSlotViews(c).map(s=>s.type),['Weapon','Armor','Ring','Boots','Accessory']);assert.equal(c.equipmentVersion,2);
  const offer=recruitOffer(run,9,[s.id])[0];assert.ok(buyRecruit(run,offer));assert.equal(equipmentSlots(offer),5);assert.equal(offer.skillsVersion,2);
  run.teamCapacity=3;assert.ok(deployReserve(run,0));
  for(const type of ['Weapon','Armor','Ring','Boots','Accessory']){
   const gear=CREATURE_GEAR.find(g=>equipmentSlotType(g)===type&&gearCompatibility(c,g).allowed);assert.ok(gear,`${s.id}: compatible ${type}`);const uid=`legendary:${s.id}:${type}`;run.gearInventory.push({id:gear.id,uid,quality:1.1});assert.ok(equipGear(run,2,uid),`${s.id}: equip ${type}`);
  }
  assert.equal(c.equipment.length,5);assert.ok(equipmentSlotViews(c).every(slot=>slot.gear&&slot.roll.quality===1.1));
 }
});
test('modern companion initialization repairs old shop recruits once and preserves ownership and rolls',()=>{
 const run=makeRun(9,['aurel','brakk']),c=creature('solara');c.equipment=['ruby-vigor-ring','ruby-vigor-ring'];c.equipmentRolls=[{quality:1.1,rarity:'Epic'},{quality:.8,fromCapture:true}];run.bench=[c];const count=run.gearInventory.length;
 initializeCompanion(run,c);assert.equal(equipmentSlots(c),5);assert.equal(c.equipment.length,1);assert.equal(c.equipmentRolls[0].quality,1.1);assert.equal(run.gearInventory.length,count+1);assert.equal(run.gearInventory.at(-1).quality,.8);assert.equal(run.gearInventory.at(-1).fromCapture,true);
 const before=JSON.stringify(run);initializeCompanion(run,c);assert.equal(JSON.stringify(run),before);run.teamCapacity=3;assert.ok(deployReserve(run,0));run.gearInventory.push({id:'sapphire-flow-ring',uid:'replacement',quality:1.2});assert.ok(equipGear(run,2,'replacement'));assert.equal(c.equipmentRolls[0].quality,1.2);assert.equal(equipmentSlots(c),5);
});
test('negative armor has smooth bounded amplification; positive Guardian protection stays unchanged',()=>{
 assert.equal(armorReduction(100),.5);assert.equal(armorReduction(100,'Guardian'),140/240);assert.equal(armorReduction(-20),-1/6);assert.equal(armorReduction(-20,'Guardian'),-1/6);assert.equal(armorReduction(-100),-.5);
 for(const value of [-1e12,-500,-100,-1,0,1,100,1e12])assert.ok(Number.isFinite(armorReduction(value))&&Math.abs(armorReduction(value))<1);
});
test('Corrosion can cross zero and restores armor exactly when the aura leaves',()=>{
 const source={...creature('zephyr'),side:0,hp:100,x:0,y:0,relics:[{id:'aura-corrosion',tier:1}]},target={...creature('aurel'),side:1,hp:100,x:20,y:0,armor:7};
 updateAuras([source,target]);assert.ok(target.armor<0);const armor=target.armor;for(let i=0;i<30;i++)updateAuras([source,target]);assert.equal(target.armor,armor);target.x=1000;updateAuras([source,target]);assert.equal(target.armor,7);target.armor=-12;updateAuras([target]);assert.equal(target.armor,-12);
});
test('negative armor increases connected damage without recording negative mitigation or changing status damage',()=>{
 const run=makeRun(9,['aurel','brakk']),b=new Battle(run,[creature('brakk')],9,{visuals:false}),source=b.units[0],target=b.units.find(u=>u.side===1);target.armor=-100;target.shield=0;target.hp=target.maxHp=1000;source.role='Ranger';source.x=1000;target.x=0;
 assert.equal(b.damageUnit(target,100,source,null,0,'physical'),150);assert.equal(b.metrics.armorAmplified,50);assert.equal(b.metrics.armorPrevented,0);assert.ok(target.damageMitigated>=0);assert.equal(b.damageUnit(target,100,source,null,0,'status'),100);
 target.armorBuff=100;target.armorBuffTime=3;assert.equal(b.damageUnit(target,100,source,null,0,'physical'),100);
});
test('capture warning includes negative armor amplification and temporary armor buffs',()=>{
 const allies=[{hp:100,atk:60}],target={id:'brakk',hp:100,maxHp:100,shield:0,armor:0};const neutral=focusKnockoutRisk(allies,target,.5);target.armor=-100;const vulnerable=focusKnockoutRisk(allies,target,.5);assert.ok(vulnerable>neutral);target.armorBuff=100;target.armorBuffTime=3;assert.equal(focusKnockoutRisk(allies,target,.5),neutral);
});
test('skill beams retain the directional authored muzzle in every family, facing and evolution form',()=>{
 for(const spec of PIXEL_SPECIES)for(const path of ['wild','warden'])for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  const run=makeRun(9,[spec.id],{starterBudget:23,native:true});run.native=true;const actorBattle=new Battle(run,[creature('brakk')],9,{visuals:true}),actor=actorBattle.units[0];actor.evolution=evolution;actor.evolutionPath=path;actor.x=400;actor.y=400;
  const strike={source:actor,skillId:'morrow-utility',dx:Math.cos(dir*Math.PI/4),dy:Math.sin(dir*Math.PI/4),reach:300,beam:true,target:actorBattle.units.at(-1),hitUids:[],maxTargets:1,scale:1,power:1};
  const expected=nativeMuzzle(actor,{x:actor.x+strike.dx*strike.reach,y:actor.y+strike.dy*strike.reach}),before=JSON.stringify(actor.equipment);actorBattle.resolveStrike(strike);const effect=actorBattle.effects.find(e=>e.type==='beam');assert.ok(effect,spec.id);assert.equal(effect.x,expected.x);assert.equal(effect.y,expected.y+14);assert.equal(effect.originZ,expected.z);assert.equal(JSON.stringify(actor.equipment),before);
 }
});
