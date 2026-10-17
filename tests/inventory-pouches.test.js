import test from 'node:test';
import assert from 'node:assert/strict';
import {pouchScatter,stepPouchPhysics,inventoryPouchHTML} from '../inventory-pouches.js';
import {makeRun,creature} from '../game.js';
import {applyLoadoutDrop,canLoadoutDrop} from '../loadout-interactions.js';

test('scatter is stable, restrained, and does not mutate packed items',()=>{
 const items=Array.from({length:40},(_,i)=>({uid:'item'+i})),before=JSON.stringify(items);
 const scatter=items.map(i=>pouchScatter(i.uid));
 assert.deepEqual(items.map(i=>pouchScatter(i.uid)),scatter);assert.equal(JSON.stringify(items),before);
 for(const p of scatter){assert.ok(Math.abs(p.x)<=3&&Math.abs(p.y)<=3&&Math.abs(p.angle)<=9);}
 assert.ok(new Set(scatter.map(p=>p.angle)).size>10);
});
test('burst physics stays finite and inside the pouch, then converges to grab positions',()=>{
 const bodies=Array.from({length:24},(_,i)=>({x:140,y:60,tx:30+(i%6)*44,ty:30+Math.floor(i/6)*44,vx:(i-12)*18,vy:-110,r:20}));
 for(let frame=0;frame<240;frame++){
  stepPouchPhysics(bodies,{width:280,height:210},frame===2?5:1/60);
  for(const b of bodies){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));assert.ok(b.x>=20&&b.x<=260&&b.y>=20&&b.y<=190);}
 }
 for(const b of bodies)assert.ok(Math.hypot(b.tx-b.x,b.ty-b.y)<.5);
});
test('closed pouches hide inactive items from keyboard and escape names and descriptions',()=>{
 const html=inventoryPouchHTML({kind:'gear',title:'Equipment',index:0,items:[{uid:'a"b',name:'A < B',meta:'Ring',description:'"quoted" & safe',art:'<img>',usable:false}]});
 assert.match(html,/inert aria-hidden="true"/);assert.match(html,/data-pack-kind="gear"/);assert.match(html,/data-open-pouch aria-expanded="false"/);
 assert.match(html,/A &lt; B/);assert.match(html,/a&quot;b/);assert.match(html,/aria-disabled="true"/);assert.doesNotMatch(html,/ disabled/);
});
test('separate pouches reject the wrong item atomically and preserve rolls and stone tiers',()=>{
 const run=makeRun(83,['aurel','brakk']);run.team=[{...creature('eira'),balanceVersion:17,equipmentVersion:2,equipment:['ruby-vigor-ring'],equipmentRolls:[{id:'ruby-vigor-ring',uid:'ring',quality:1.17,rarity:'Epic',fromCapture:true}],relics:[{uid:'stone',id:'aura-wellspring',tier:1}]}];
 run.gearInventory=[];run.inventory=[];
 const gear={kind:'gear',id:'ruby-vigor-ring',fromIndex:0,slot:0},gem={kind:'gem',id:'aura-wellspring',uid:'stone',fromIndex:0,slot:0},before=JSON.stringify(run);
 assert.equal(canLoadoutDrop(run,gear,{pack:true,packKind:'gem'}),false);assert.equal(applyLoadoutDrop(run,gem,{pack:true,packKind:'gear'}),false);assert.equal(JSON.stringify(run),before);
 assert.ok(applyLoadoutDrop(run,gear,{pack:true,packKind:'gear'}));assert.equal(run.gearInventory[0].quality,1.17);assert.equal(run.gearInventory[0].rarity,'Epic');assert.equal(run.gearInventory[0].fromCapture,true);
 assert.ok(applyLoadoutDrop(run,gem,{pack:true,packKind:'gem'}));assert.equal(run.inventory[0].uid,'stone');assert.equal(run.inventory[0].tier,1);
});
