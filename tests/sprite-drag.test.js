import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature} from '../game.js';
import {canLoadoutDrop,applyLoadoutDrop} from '../loadout-interactions.js';

test('slot highlights use real equipment rules and never change live ownership',()=>{
 const run=makeRun(88,['aurel','brakk']);run.team.push({...creature('voltwing'),seat:2,balanceVersion:17,equipmentVersion:2,equipment:[]});
 run.gearInventory=[{uid:'fang',id:'jade-fang'},{uid:'ring',id:'ruby-vigor-ring'}];
 const before=JSON.stringify(run),fang={kind:'gear',uid:'fang',id:'jade-fang'};
 assert.equal(canLoadoutDrop(run,fang,{index:0,gearType:'Weapon',gearSlot:-1}),false);
 assert.equal(canLoadoutDrop(run,fang,{index:2,gearType:'Weapon',gearSlot:-1}),true);
 assert.equal(canLoadoutDrop(run,fang,{index:2,gearType:'Ring',gearSlot:-1}),false);
 assert.equal(canLoadoutDrop(run,{kind:'gear',uid:'ring',id:'ruby-vigor-ring'},{index:0,gearType:'Ring',gearSlot:-1}),true);
 assert.equal(JSON.stringify(run),before);
 assert.equal(canLoadoutDrop(run,fang,null),false);
});

test('companion drops move the individual and its items, keeping team seats distinct',()=>{
 const run=makeRun(89,['aurel','brakk']),first=run.team[0],second=run.team[1];
 first.equipment=['sunsteel-edge'];const payload={kind:'companion',uid:first.uid},before=JSON.stringify(run);
 assert.equal(canLoadoutDrop(run,payload,{index:1}),true);
 assert.equal(canLoadoutDrop(run,payload,{index:0}),false);
 assert.equal(canLoadoutDrop(run,payload,{index:1,gearType:'Weapon'}),false);
 assert.equal(JSON.stringify(run),before);
 assert.equal(applyLoadoutDrop(run,payload,{index:1}),true);
 assert.equal(run.team[1],first);assert.equal(run.team[0],second);
 assert.deepEqual(run.team.map(c=>c.seat),[0,1]);assert.deepEqual(run.team[1].equipment,['sunsteel-edge']);
});
