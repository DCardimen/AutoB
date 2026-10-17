import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,SPECIES,creature} from '../game.js';
import {AURA_STONES,auraSlots} from '../aura-stones.js';
import {claimLoot,lootDropClaimed} from '../expedition-rules.js';
import {rewardDropPayload,rewardRecommendation,applyRewardLoadoutDrop} from '../reward-loadout.js';

test('quick equip claims only that drop; collect/reload/transfer never duplicate it',()=>{
 const run=makeRun(113,['aurel','aurel']),drop={id:'drop-blade',kind:'gear',gear:'sunsteel-edge',quality:1.2},cache={key:'quick',drops:[drop,{id:'coins',kind:'gold',amount:17}],claimed:false};
 run.team.forEach(c=>{c.equipment=[];c.equipmentRolls=[];});
 assert.equal(rewardRecommendation(run,cache,drop,{index:0}).grade,'upgrade');
 assert.ok(applyRewardLoadoutDrop(run,cache,rewardDropPayload(run,drop),{index:0}));
 assert.equal(run.team[0].equipmentRolls[0].uid,drop.id);assert.equal(cache.claimed,false);assert.ok(lootDropClaimed(run,cache,drop.id));
 assert.ok(applyRewardLoadoutDrop(run,cache,rewardDropPayload(run,drop),{index:1}));
 assert.equal(run.team[0].equipment.length,0);assert.equal(run.team[1].equipmentRolls[0].quality,1.2);
 const gold=run.gold;assert.ok(claimLoot(run,cache));assert.equal(run.gold,gold+17);assert.ok(cache.claimed);
 const saved=JSON.parse(JSON.stringify({run,cache}));assert.equal(claimLoot(saved.run,saved.cache),false);
 assert.equal([...run.gearInventory,...run.team.flatMap(c=>c.equipmentRolls)].filter(g=>g?.uid===drop.id).length,1);
});
test('invalid reward drops are atomic and do not claim; stronger and weaker rolls compare actual stats',()=>{
 const run=makeRun(114,['aurel','brakk']),c=run.team[0];c.equipment=['sunsteel-edge'];c.equipmentRolls=[{uid:'old',quality:.7}];
 const drop={id:'upgrade',kind:'gear',gear:'sunsteel-edge',quality:1.2},cache={key:'upgrade',drops:[drop]};
 const before=JSON.stringify({run,cache});assert.equal(applyRewardLoadoutDrop(run,cache,rewardDropPayload(run,drop),{index:0,gearType:'Boots'}),false);assert.equal(JSON.stringify({run,cache}),before);
 assert.equal(rewardRecommendation(run,cache,drop,{index:0}).grade,'upgrade');
 assert.ok(applyRewardLoadoutDrop(run,cache,rewardDropPayload(run,drop),{index:0}));assert.equal(run.team[0].equipmentRolls[0].quality,1.2);assert.equal(run.gearInventory.at(-1).quality,.7);
 const weaker={...drop,id:'weak',quality:.5},second={key:'weak',drops:[weaker]};assert.equal(rewardRecommendation(run,second,weaker,{index:0}).grade,'worse');
 const trade={id:'trade',kind:'gear',gear:'venom-sabre',quality:1},third={key:'trade',drops:[trade]};assert.equal(rewardRecommendation(run,third,trade,{index:0}).grade,'maybe');
});
test('full aura field accepts stronger same-aura tier; wrong role/common are unavailable without a grant',()=>{
 const species=SPECIES.find(s=>auraSlots({id:s.id})===1),run=makeRun(115,['aurel','brakk']);run.team[0]=creature(species.id);run.team[0].balanceVersion=17;run.team[0].equipmentVersion=2;
 const stone=AURA_STONES.find(s=>s.role===species.role),drop={id:'stone-upgrade',kind:'stone',stone:stone.id,tier:1},cache={key:'stone',drops:[drop]};
 run.team[0].relics=[{uid:'old-aura',id:stone.id,tier:4}];assert.equal(rewardRecommendation(run,cache,drop,{index:0}).grade,'upgrade');
 assert.ok(applyRewardLoadoutDrop(run,cache,rewardDropPayload(run,drop),{index:0,relicSlot:0}));assert.equal(run.team[0].relics[0].tier,1);assert.equal(run.inventory.at(-1).uid,'old-aura');
 const weak={...drop,id:'weak-aura',tier:4},second={key:'weak-stone',drops:[weak]};assert.equal(rewardRecommendation(run,second,weak,{index:0}).grade,'worse');
 const common=SPECIES.find(s=>!auraSlots({id:s.id}));run.team[1]=creature(common.id);const before=JSON.stringify({run,cache:second});assert.equal(applyRewardLoadoutDrop(run,second,rewardDropPayload(run,weak),{index:1}),false);assert.equal(JSON.stringify({run,cache:second}),before);
});
