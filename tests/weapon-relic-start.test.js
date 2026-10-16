import {relicIllustration} from '../relic-illustrations.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,SPECIES,RELICS,Battle,stats,rewardBattle} from '../game.js';
import {CREATURE_GEAR,GEAR_BY_ID,equipGear,enemyEquipment,reconcileEquipment,gearCompatibility,equipmentAffinity,gearWeaponClass} from '../creature-equipment.js';
import {applyLoadoutDrop} from '../loadout-interactions.js';
import {prepareOpeningRelics,chooseFirstRelic,skipFirstRelic,recordRunReset,recordOpeningBattle,LESSER_RELICS} from '../opening-relics.js';
import {PACT_RELICS} from '../relic-pacts.js';
import {relicEvent} from '../run-relics.js';
import {combatEffectDescription} from '../item-effects.js';
import {RELIC_ART,UI_ART} from '../ui-art.js';

test('every weapon has an explicit class; all families obey their equipment identity',()=>{
 for(const g of CREATURE_GEAR.filter(g=>g.slot==='Weapon'))assert.ok(gearWeaponClass(g),g.id);
 for(const s of SPECIES)for(let evolution=0;evolution<=2;evolution++){
  const c={id:s.id,evolution};for(const g of CREATURE_GEAR){const yes=gearCompatibility(c,g).allowed;if(yes&&gearWeaponClass(g))assert.equal(gearWeaponClass(g),equipmentAffinity(c),s.id+': '+g.id);if(equipmentAffinity(c)==='fang'&&yes)assert.ok(['Fang','Jewelry'].includes(g.slot)||gearWeaponClass(g)==='fang');}
 }
 for(const [id,affinity]of [['syl','bow'],['rowan','bow'],['morrow','bow'],['grit','sword'],['sable','sword'],['brakk','two-handed'],['emberhound','fang'],['nyra','staff'],['cogwalker','cannon']])assert.equal(equipmentAffinity({id}),affinity);
});
test('clicks, replacement drops and reciprocal swaps reject wrong weapons atomically',()=>{
 const r=makeRun(3,['aurel','syl']);r.team.forEach(c=>c.equipment=[]);r.gearInventory=[{id:'venom-sabre',uid:'sword',quality:.72},{id:'briar-longbow',uid:'bow'}];
 let before=JSON.stringify(r);assert.equal(equipGear(r,1,'sword'),false);assert.equal(JSON.stringify(r),before);
 assert.ok(equipGear(r,0,'sword'));assert.ok(equipGear(r,1,'bow'));before=JSON.stringify(r);
 assert.equal(applyLoadoutDrop(r,{kind:'gear',id:'venom-sabre',fromIndex:0,slot:0},{index:1,gearSlot:0}),false);assert.equal(JSON.stringify(r),before);
 // Destination accepts armor, but its bow cannot be swapped back to a sword user.
 r.team[0].equipment=['reliquary-plate'];r.team[1].equipment=['briar-longbow'];before=JSON.stringify(r);
 assert.equal(applyLoadoutDrop(r,{kind:'gear',id:'reliquary-plate',fromIndex:0,slot:0},{index:1,gearSlot:0}),false);assert.equal(JSON.stringify(r),before);
});
test('old saves return incompatible worn gear once, preserving every roll and reserve',()=>{
 const r=makeRun(4,['syl']);r.team[0].equipment=['venom-sabre'];r.team[0].equipmentRolls=[{quality:.63,rarity:'Rare',sourceName:'Original drop'}];r.bench=[{...creature('emberhound'),equipment:['windstep-boots'],equipmentRolls:[{quality:.91}]}];
 assert.equal(reconcileEquipment(r),2);assert.equal(r.team[0].equipment.length,0);assert.equal(r.bench[0].equipment.length,0);assert.equal(r.gearInventory.find(g=>g.id==='venom-sabre').quality,.63);assert.equal(r.gearInventory.find(g=>g.id==='venom-sabre').sourceName,'Original drop');const before=JSON.stringify(r);assert.equal(reconcileEquipment(r),0);assert.equal(JSON.stringify(r),before);
});
test('starter gear and enemy builds are usable by their actual families',()=>{
 for(const id of ['aurel','brakk','syl','emberhound','nyra','cogwalker','moonjelly'])for(let seed=1;seed<=20;seed++){
  const r=makeRun(seed,[id],{starterBudget:20});assert.equal(r.relics.length,0);assert.ok(r.team[0].equipment.every(g=>gearCompatibility(r.team[0],GEAR_BY_ID[g]).allowed));assert.ok(r.gearInventory.every(g=>gearCompatibility(r.team[0],GEAR_BY_ID[g.id]).allowed));
 }
 for(const s of SPECIES)for(let evolution=0;evolution<=2;evolution++){const c={...creature(s.id),evolution};enemyEquipment(c,13+evolution);assert.equal(new Set(c.equipment).size,c.equipment.length);assert.ok(c.equipment.every(id=>gearCompatibility(c,GEAR_BY_ID[id]).allowed),s.id);}
});
test('two distinct first offers are seeded, saved, optional and granted exactly once',()=>{
 const pairs=new Set();for(let seed=0;seed<80;seed++){
  const r=makeRun(seed,['aurel']),offer=prepareOpeningRelics(r,{});assert.equal(offer.choices.length,2);assert.equal(new Set(offer.choices).size,2);assert.ok(offer.choices.every(id=>RELICS.some(x=>x.id===id)));pairs.add(offer.choices.join());const loaded=JSON.parse(JSON.stringify(r));assert.deepEqual(prepareOpeningRelics(loaded,{}),offer);assert.equal(chooseFirstRelic(r,'not-offered'),false);assert.ok(chooseFirstRelic(r,offer.choices[0]));assert.equal(chooseFirstRelic(r,offer.choices[1]),false);assert.equal(skipFirstRelic(r),false);assert.equal(r.relics.length,1);
 }assert.ok(pairs.size>25);
 const r=makeRun(8,['syl']);prepareOpeningRelics(r,{});assert.ok(skipFirstRelic(r));assert.equal(r.relics.length,0);assert.equal(chooseFirstRelic(r,r.openingRelic.choices[0]),false);
});
test('three arena wins restore normal relic starts, including manual resets before the first world ends',()=>{
 const profile={},placeholder=makeRun(1,['aurel']);recordRunReset(profile,placeholder);assert.equal(profile.lesserOpeningRelics,undefined);
 prepareOpeningRelics(placeholder,profile);skipFirstRelic(placeholder);recordRunReset(profile,placeholder);assert.equal(profile.lesserOpeningRelics,true);
 const next=makeRun(2,['aurel']),offer=prepareOpeningRelics(next,JSON.parse(JSON.stringify(profile)));assert.ok(offer.lesser);assert.ok(offer.choices.every(id=>LESSER_RELICS.some(r=>r.id===id)));
 for(const wins of [1,2]){rewardBattle(next,'battle',true);assert.equal(next.wins,wins);recordOpeningBattle(profile,next,true);assert.equal(profile.lesserOpeningRelics,true);recordRunReset(profile,next);assert.equal(profile.lesserOpeningRelics,true);}
 next.planet=0;next.depth=2;rewardBattle(next,'battle',true);assert.equal(next.wins,3);recordOpeningBattle(profile,next,true);assert.equal(profile.lesserOpeningRelics,false);recordRunReset(profile,next);assert.equal(profile.lesserOpeningRelics,false);recordOpeningBattle(profile,next,false);assert.equal(profile.lesserOpeningRelics,false);
 const recovered=makeRun(3,['aurel']);assert.equal(prepareOpeningRelics(recovered,JSON.parse(JSON.stringify(profile))).lesser,false);
 recovered.wins=0;recordOpeningBattle(profile,recovered,false);assert.equal(profile.lesserOpeningRelics,true);
});
test('all 15 major pacts compile a substantial benefit and a substantial drawback',()=>{
 assert.equal(PACT_RELICS.length,15);const r=makeRun(91,['aurel']);r.team[0].equipment=[];const plain=stats(r.team[0],r.team,[]);
 for(const relic of PACT_RELICS){
  const b=new Battle({...r,relics:[relic.id]},[creature('brakk')],91,{visuals:false}),u=b.units[0],e=u.curioStats;
  const description=combatEffectDescription(relic,r);assert.ok(description.length>30);assert.ok(UI_ART[RELIC_ART[relic.id]]);
  const downside=Object.entries(e).some(([k,v])=>['hp','atk','speed','healing','regenStamina'].includes(k)&&v<=.8||k==='cd'&&v>=1.3);assert.ok(downside,relic.id+' has a meaningful drawback');
  if(relic.hook==='flat'){const benefit=Object.entries(e).some(([k,v])=>['hp','atk','speed','healing','attackSpeed'].includes(k)&&v>=1.4||k==='cd'&&v<=.65||k==='shield'&&v>=100);assert.ok(benefit,relic.id+' boosts actual compiled stats');}
  if(e.hp<1)assert.ok(u.maxHp<plain.hp);if(e.atk<1)assert.ok(u.atk<plain.atk);
 }
});
test('dangerous hit/cast/dodge pacts execute real effects, beyond their descriptions',()=>{
 const r=makeRun(91,['aurel']);r.team[0].equipment=[];
 for(const id of ['venomous-diadem','ashen-heart','vampires-vow','burdened-aegis','waning-veil','starved-comet','mirror-of-thorns']){
  const b=new Battle({...r,relics:[id]},[creature('brakk'),creature('nyra')],91,{visuals:false}),[u,t,z]=b.units;u.hp=u.maxHp*.5;u.armor=t.armor=0;u.x=t.x=z.x=400;u.y=t.y=z.y=400;const hp=u.hp,thp=t.hp,zhp=z.hp;
  if(id==='venomous-diadem'||id==='ashen-heart'||id==='vampires-vow')relicEvent(b,u,'hit',{target:t,def:{auto:true},dealt:20});
  if(id==='venomous-diadem')assert.equal(t.poison,4);if(id==='ashen-heart')assert.equal(t.burn,4);if(id==='vampires-vow')assert.ok(u.hp>hp);
  if(id==='burdened-aegis'){const shield=u.shield;relicEvent(b,u,'cast',{target:t});assert.equal(u.shield-shield,40);}
  if(id==='waning-veil'){relicEvent(b,u,'dodge');assert.equal(u.evade,3);}
  if(id==='starved-comet'){for(let i=0;i<3;i++)relicEvent(b,u,'hit',{target:t,def:{auto:true},dealt:1});assert.ok(z.hp<zhp);}
  if(id==='mirror-of-thorns'){relicEvent(b,u,'hurt',{source:t,target:t,dealt:20});assert.ok(t.hp<thp);}
 }
});

test('relic illustrations keep stable semantic identities independent of catalog order',()=>{
 for(const id of ['clock','prism','venom-clasp','winter-talon','mirror-of-thorns']){const r=RELICS.find(r=>r.id===id);assert.equal(RELIC_ART[id],relicIllustration({...r}));}
 assert.equal(RELIC_ART.clock,'relic-4-20');assert.equal(RELIC_ART['venom-clasp'],'relic-4-06');assert.equal(RELIC_ART['winter-talon'],'animal-02');assert.equal(RELIC_ART['mirror-of-thorns'],'relic-4-02');
 assert.equal(relicIllustration({id:'future-poison',hook:'hit',effect:{poison:2}}),'relic-4-06');
});
