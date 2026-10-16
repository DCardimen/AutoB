import test from 'node:test';
import assert from 'node:assert/strict';
import {AURA_STONES,AURA_BY_ID,auraSlots,auraStone,auraTierPower,assignEnemyStones,enemyStoneDrops,updateAuras,tickAuras,migrateAuraStones} from '../aura-stones.js';
import {makeRun,creature,stats,Battle,equipRelic,relicSlots,encounter,settleCaptureRecruitment,generateShop} from '../game.js';
import {claimLoot,makeLoot,attachCaptureLoot} from '../expedition-rules.js';
import {applyLoadoutDrop} from '../loadout-interactions.js';
const ids={Guardian:'cogwalker',Striker:'tarka',Ranger:'zephyr',Support:'eira'};
function unit(id,side,x=100){const c=creature(id,3);c.balanceVersion=17;return {...c,side,x,y:100,hp:500,maxHp:1000,atk:100,armor:30,speed:100,range:100,attackSpeed:1,actionSpeed:1,staminaRecharge:20,maxPoise:100,hpRegen:0,dodge:0,shield:0,stamina:0,cooldowns:{one:{remaining:10},two:{remaining:20}}};}
test('30 unique role auras; exact rarity slots, no evolution extras, four exponential power tiers',()=>{
 assert.equal(AURA_STONES.length,30);assert.equal(new Set(AURA_STONES.map(s=>s.id)).size,30);
 for(const [id,count]of [['aurel',0],['nyra',1],['cogwalker',2],['tarka',3],['moonjelly',4]])for(const evolution of [0,1,2])assert.equal(relicSlots({...creature(id),balanceVersion:17,evolution}),count);
 for(const tier of [1,2,3,4])assert.equal(auraTierPower({tier}),1.2**(4-tier));
});
for(const stone of AURA_STONES)test(stone.name+' obeys range, role and current tier in real effects',()=>{
 const wearer=unit(ids[stone.role],0),ally=unit('aurel',0,110),enemy=unit('brakk',1,110),far=unit('aurel',0,900);wearer.relics=[{id:stone.id,uid:'s',tier:1}];const units=[wearer,ally,enemy,far];
 updateAuras(units);const e=stone.effect,p=auraTierPower({tier:1}),target=stone.target==='allies'?ally:enemy;
 if(!e.interval){for(const [key,value]of Object.entries(e)){if(['atk','speed','attackSpeed','actionSpeed','staminaRecharge'].includes(key)){const base=key==='staminaRecharge'?20:['atk','speed'].includes(key)?100:1;assert.ok(Math.abs(target[key]-base*(1+value*p))<1e-8);}else if(['armor','range','maxPoise','hpRegen','dodge'].includes(key)){const base={armor:30,range:100,maxPoise:100,hpRegen:0,dodge:0}[key];assert.ok(Math.abs(target[key]-Math.max(0,base+value*p))<1e-8);}else {const f={cooldownRate:'auraCooldownRate',healingReceived:'auraHealingReceived',healingPower:'auraHealingPower',damageTaken:'auraDamageTaken',crit:'auraCrit'}[key];assert.ok(Math.abs(target[f]-(key==='crit'?value*p:1+value*p))<1e-8);}}
 const before=target.atk;for(let i=0;i<100;i++)updateAuras(units);assert.ok(Math.abs(target.atk-before)<1e-8);wearer.hp=0;updateAuras(units);assert.equal(ally.atk,100);assert.equal(enemy.atk,100);assert.equal(far.atk,100);
 }else {const b={units,time:0,metrics:{},heal:(t,amount)=>t.hp=Math.min(t.maxHp,t.hp+amount),cleanse:t=>t.poison=0};ally.poison=2;tickAuras(b);assert.equal(ally.hp,500);b.time=e.interval;tickAuras(b);if(e.currentHPHeal)assert.ok(ally.hp>500);if(e.shieldPulse)assert.ok(ally.shield>0);if(e.haste)assert.ok(ally.haste>0);if(e.cooldownReset)assert.equal(wearer.cooldowns.two.remaining,0);if(e.stamina)assert.ok(units.some(u=>u.stamina>0));if(e.cleanse)assert.equal(ally.poison,0);assert.equal(far.hp,500);assert.equal(enemy.hp,500);const saved=JSON.stringify(units);tickAuras(b);assert.equal(JSON.stringify(units),saved);}
});
test('duplicate aura uses strongest tier and leaves precisely when target exits or allegiance changes',()=>{
 const a=unit('tarka',0),b=unit('tarka',0),target=unit('aurel',0,110);a.relics=[{id:'aura-valor',tier:4}];b.relics=[{id:'aura-valor',tier:1}];updateAuras([a,b,target]);assert.ok(Math.abs(target.atk-120.736)<1e-8);target.x=900;updateAuras([a,b,target]);assert.equal(target.atk,100);target.x=110;target.side=1;updateAuras([a,b,target]);assert.equal(target.atk,100);
});
test('cross-role and common equip rejected atomically; tier survives transfers and migration',()=>{
 const run=makeRun(8,['aurel','brakk']);run.team=[unit('nyra',0),unit('cogwalker',0)];run.inventory=[{uid:'s',id:'aura-wellspring',tier:1}];let before=JSON.stringify(run);assert.equal(equipRelic(run,1,'s'),false);assert.equal(JSON.stringify(run),before);assert.ok(equipRelic(run,0,'s'));assert.equal(run.team[0].relics[0].tier,1);before=JSON.stringify(run);assert.equal(applyLoadoutDrop(run,{kind:'gem',fromIndex:0,slot:0,uid:'s',id:'aura-wellspring'},{index:1}),false);assert.equal(JSON.stringify(run),before);run.team[0].id='aurel';migrateAuraStones(run);assert.equal(run.inventory[0].uid,'s');assert.equal(run.inventory[0].tier,1);assert.equal(run.team[0].relics.length,0);before=JSON.stringify(run);migrateAuraStones(run);assert.equal(JSON.stringify(run),before);
});
test('carrier rates, early caps, enemy-derived tiers, boss three, and exact tier loot claims',()=>{
 let normal=0,elite=0;for(let seed=0;seed<10000;seed++){const n=unit('cogwalker',1),e={...unit('cogwalker',1),elite:true,eliteTier:2};assignEnemyStones(n,seed);assignEnemyStones(e,seed);normal+=!!n.relics.length;elite+=!!e.relics.length;assert.ok(e.relics.length<=1);if(e.relics.length)assert.equal(e.relics[0].tier,2);const saved=JSON.stringify(e);assignEnemyStones(e,seed+999);assert.equal(JSON.stringify(e),saved);}
 assert.ok(Math.abs(normal/10000-.2)<.015);assert.ok(Math.abs(elite/10000-.6)<.015);
 const run=makeRun(1,['aurel','brakk']),boss={...unit('cogwalker',1),boss:true,hp:0};assignEnemyStones(boss,1,8);assert.equal(boss.relics.length,3);assert.ok(boss.relics.every(g=>g.tier===1));assert.equal(enemyStoneDrops(boss,'boss').length,3);const cache=makeLoot(run,'boss',[boss],8);assert.equal(cache.drops.filter(d=>d.kind==='stone').length,3);assert.ok(claimLoot(run,cache));assert.ok(run.inventory.every(g=>g.tier===1));assert.equal(claimLoot(run,cache),false);
 const result={uid:'captured-aura',success:true,creature:{...boss,id:'ironscolopendra',boss:false}};settleCaptureRecruitment(run,result);const reward={};attachCaptureLoot(reward,result);assert.equal(reward.loot.drops.filter(d=>d.kind==='stone').length,3);assert.ok(claimLoot(run,reward.loot));assert.ok(run.inventory.at(-1).fromCapture);
});
test('common mobs can drop unequippable loot; opening elites avoid rarity spikes; shops use regular prices',()=>{
 const run=makeRun(7,['aurel','brakk']);let drops=0;for(let seed=0;seed<1000;seed++)drops+=makeLoot(run,'battle',[{...unit('aurel',1),hp:0}],seed).drops.some(d=>d.kind==='stone');assert.ok(Math.abs(drops/1000-.2)<.05);
 for(let seed=0;seed<120;seed++){const foes=encounter(run,'elite',seed);assert.equal(foes.length,2);assert.ok(foes.every(c=>auraSlots(c)<=2));}
 const stock=generateShop(run,7);assert.ok(stock.personal.every(id=>AURA_BY_ID[id]&&AURA_BY_ID[id].cost<200));
});
test('battle applies area factors to actual healing, damage, and cooldown progression',()=>{
 const run=makeRun(83,['aurel','brakk']);run.team=[unit('eira',0),unit('aurel',0)];run.team[0].relics=[{id:'aura-lifelight',tier:4}];const b=new Battle(run,[creature('brakk')],83,{visuals:false});const [u,a,t]=b.units;u.x=a.x=100;u.y=a.y=100;a.hp=100;a.maxHp=1000;u.relics=[{id:'aura-lifelight',tier:4}];updateAuras(b.units);const plain={...u,relics:[],auraHealingPower:1};const old=a.hp;b.heal(a,100,u,null,false);const boost=a.hp-old;a.hp=old;b.heal(a,100,plain,null,false);assert.ok(Math.abs(boost/(a.hp-old)-1.18)<.001);
 u.relics=[{id:'aura-clarity',tier:4}];updateAuras(b.units);assert.ok(Math.abs(u.auraCooldownRate-1.14)<1e-9);t.x=100;t.y=100;u.relics=[{id:'aura-drought',tier:4}];updateAuras(b.units);assert.equal(t.auraHealingReceived,.78);
});
