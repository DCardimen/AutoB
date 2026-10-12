import test from 'node:test';import assert from 'node:assert/strict';
import {makeRun,creature,Battle,BY_ID,SPECIES,generateRoute,encounter,evolveCreature,stats,personalRelic,equipRelic,linkRelic,generateShop} from '../game.js';
import {NATIVE_SPECIES,NATIVE_STARTERS,NATIVE_POOLS,nativeEvolution} from '../native-content.js';
import {NATIVE_BOUNDS,nativeMuzzle,finishNativeVisuals} from '../native-combat.js';
function fixture(id='aurel',enemy='brakk'){
 const run=makeRun(731,NATIVE_STARTERS);run.team=[creature(id,3)];const b=new Battle(run,[creature(enemy,3)],731),u=b.units[0],t=b.units[1];
 for(const [i,v]of b.units.entries()){v.x=v.px=350+i*50;v.y=v.py=400;v.attackTimer=999;v.dodgeCooldown=999;v.speed=0;for(const c of Object.values(v.cooldowns))c.remaining=999;}
 return {run,b,u,t};
}
test('native runs keep six unique starters and nine complete native family loadouts',()=>{
 assert.equal(NATIVE_SPECIES.length,9);const run=makeRun(1,NATIVE_STARTERS);assert.ok(run.native);assert.equal(new Set(run.team.map(c=>c.id)).size,6);assert.equal(SPECIES.length,69);assert.equal(makeRun(1).native,false);
 for(const s of NATIVE_SPECIES){assert.ok(s.nativeRig&&s.evolvedName&&s.trait);assert.ok(NATIVE_POOLS.some(ids=>ids.includes(s.id)));}
});
test('native encounters and shops recruit native families, while legacy runs retain their original pools',()=>{
 for(const native of [false,true])for(let planet=0;planet<3;planet++)for(const type of ['battle','elite','capture','boss']){
  const run=makeRun(11,native?NATIVE_STARTERS:undefined);run.planet=planet;run.depth=3;run.route=generateRoute(run);
  for(const foe of encounter(run,type,551))if(!foe.boss)assert.equal(!!BY_ID[foe.id].nativeRig,native);
  const shop=generateShop(run,77);if(native)assert.ok(BY_ID[shop.creature].nativeRig&&BY_ID[shop.legendary].nativeRig);
 }
});
test('native blade contact preserves gem damage and actual committed misses',()=>{
 const plain=fixture(),linked=fixture();const gem=personalRelic('scorch-fang');linked.run.inventory.push(gem);assert.ok(equipRelic(linked.run,0,gem.uid));assert.ok(linkRelic(linked.run,0,0,linked.u.loadout.auto));linked.u.relics=linked.run.team[0].relics;
 for(const f of [plain,linked]){f.b.cast(f.u,f.u.loadout.auto,f.t);while(f.b.time<.5)f.b.step(.04);assert.ok(f.b.metrics.bladeContacts>0);}
 assert.ok(linked.u.damage>plain.u.damage*1.2);
 const miss=fixture();miss.b.cast(miss.u,miss.u.loadout.auto,miss.t);miss.t.y=miss.t.py=650;while(miss.b.time<.5)miss.b.step(.04);assert.equal(miss.t.hp,miss.t.maxHp);assert.ok(miss.b.metrics.whiffs>0);
});
test('native charged strikes withstand impact while taking damage, including lethal hits',()=>{
 const {b,u,t}=fixture();u.meleeCount=2;b.cast(u,u.loadout.auto,t);assert.ok(u.nativeAction.charged);const action=u.nativeAction,hp=u.hp;u.poise=999;b.hit(u,60,t,t.loadout.auto,1,false,'physical');assert.ok(u.hp<hp);assert.equal(u.nativeAction,action);assert.equal(u.stagger,0);assert.equal(u.root,0);assert.equal(b.metrics.armorResists,1);
 b.damageUnit(u,99999,t,t.loadout.auto);assert.equal(u.hp,0);
});
test('native projectiles start at held weapons and ragdolls keep settling after a win',()=>{
 const {b,u,t}=fixture('syl');const muzzle=nativeMuzzle(u,t);b.projectile(u,t,u.loadout.auto,1);assert.equal(b.projectiles[0].x,muzzle.x);assert.equal(b.projectiles[0].y,muzzle.y);assert.ok(b.projectiles[0].originZ>30);
 b.damageUnit(t,99999,u,u.loadout.auto);b.step(.04);assert.ok(b.done);finishNativeVisuals(b,1/30);const time=t.nativeActor.ragdoll.time;finishNativeVisuals(b,1/30);assert.ok(t.nativeActor.ragdoll.time>time);
});
test('family evolution makes distinct tactical changes without dropping gems or identity',()=>{
 for(const [id,path]of [['aurel','wild'],['brakk','warden'],['syl','warden'],['nyra','wild'],['runespider','wild'],['moonjelly','warden']]){
  const run=makeRun(3,NATIVE_STARTERS);run.team[0]=creature(id,5);run.gold=200;const uid=run.team[0].uid;assert.ok(evolveCreature(run,0,path).success);assert.equal(run.team[0].uid,uid);assert.ok(Object.keys(nativeEvolution(run.team[0])).length>2);assert.ok(stats(run.team[0],run.team).hp>BY_ID[id].hp);
 }
});
test('native battles remain finite and use the expanded courtyard bounds',()=>{
 for(let seed=0;seed<8;seed++){const run=makeRun(seed,NATIVE_STARTERS),b=new Battle(run,encounter(run,'elite',seed),seed);while(!b.done)b.step(.1);assert.ok(b.time<=90.1);assert.ok(b.metrics.skills>0);assert.ok(b.metrics.bladeContacts>0);for(const u of b.units)assert.ok(Number.isFinite(u.x)&&u.y<=NATIVE_BOUNDS.bottom);}
});
