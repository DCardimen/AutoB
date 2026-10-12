import {evolutionMechanic} from '../tactics.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {makeRun,creature,Battle,BY_ID,eventForRun,EVENTS} from '../game.js';
import {NATIVE_STARTERS} from '../native-content.js';
import {evaluateOrders,terrainFor,firstTerrainHit,terrainSteering,confineTerrain,orderGoal,chooseOpeningBoon} from '../native-tactics.js';
import {practiceBattle,practiceResult} from '../practice.js';
function setup(ids=['nyra','aurel'],foes=['brakk']){const run=makeRun(11,NATIVE_STARTERS);run.team=ids.map(id=>creature(id));const b=new Battle(run,foes.map(id=>creature(id)),1);for(const u of b.units){u.attackTimer=999;u.dodgeCooldown=999;u.speed=0;for(const cd of Object.values(u.cooldowns))cd.remaining=999;}return {run,b};}
function tick(b,seconds){for(let i=0;i<Math.ceil(seconds/.04);i++)b.step(.04);}
test('two conditional orders respect priority and exclude uninterruptible charges',()=>{
 const u={hp:20,maxHp:100,rules:[{when:'selfHurt',do:'retreat'},{when:'wounded',do:'execute'}]},enemy={hp:10,maxHp:100,nativeAction:{released:false,charged:false}};
 assert.equal(evaluateOrders(u,[u],[enemy]).response,'retreat');u.hp=100;assert.equal(evaluateOrders(u,[u],[enemy]).response,'execute');u.rules=[{when:'channel',do:'interrupt'}];assert.equal(evaluateOrders(u,[u],[enemy]).response,'interrupt');enemy.nativeAction.charged=true;assert.equal(evaluateOrders(u,[u],[enemy]),null);
});
test('formation hold, escort and flank orders produce different physical goals',()=>{
 const u={id:'aurel',x:300,y:350,hp:100,maxHp:100,range:55,nativeHome:{x:300,y:350},order:'hold'},enemy={x:490,y:350};assert.equal(orderGoal(u,enemy,[u],[enemy]).x,300);
 u.order='flank';assert.notEqual(orderGoal(u,enemy,[u],[enemy]).y,350);u.order='escort';const ally={id:'nyra',x:200,y:300,hp:20,maxHp:100};const goal=orderGoal(u,enemy,[u,ally],[enemy]);assert.ok(goal.x>ally.x&&goal.x<enemy.x);
});
test('solid terrain steers bodies around a pillar and keeps collider positions outside it',()=>{
 const terrain=[{x:450,y:350,r:34}],u={x:350,y:350,radius:17},goal={x:650,y:350};assert.ok(firstTerrainHit(u,goal,terrain));const safe=terrainSteering(u,goal,terrain);assert.ok(safe.y!==goal.y);u.x=450;confineTerrain(u,terrain);assert.ok(Math.hypot(u.x-450,u.y-350)>=51);assert.equal(terrainFor({native:false,depth:3},1).length,0);assert.equal(terrainFor({native:true,depth:0},1).length,0);assert.equal(terrainFor({native:true,depth:2},1).length,2);
});
test('a pillar blocks an aimed projectile before it reaches the hostile body',()=>{
 const {b}=setup(['rowan'],['aurel']),[u,t]=b.units;u.x=u.px=350;u.y=u.py=350;t.x=t.px=650;t.y=t.py=350;b.terrain=[{id:'cover',x:470,y:350,r:40}];b.projectile(u,t,u.loadout.auto,1);tick(b,1);assert.equal(t.hp,t.maxHp);assert.equal(b.metrics.terrainBlocks,1);assert.equal(b.projectiles.length,0);
});
test('a native heal resolves after its windup; breaking poise cancels the pending effect',()=>{
 const normal=setup(),interrupted=setup();for(const {b}of [normal,interrupted]){const [u,ally,foe]=b.units;ally.hp=ally.maxHp*.5;b.cast(u,u.id,foe);assert.ok(b.queue.some(q=>q.nativeCast));assert.equal(ally.hp,ally.maxHp*.5);}
 tick(normal.b,.32);assert.equal(normal.b.units[1].hp,normal.b.units[1].maxHp*.5);tick(normal.b,.12);assert.ok(normal.b.units[1].hp>normal.b.units[1].maxHp*.5);
 const [u,ally,foe]=interrupted.b.units;u.poise=100;interrupted.b.applyImpact(u,foe,65,true);tick(interrupted.b,.7);assert.equal(ally.hp,ally.maxHp*.5);assert.equal(interrupted.b.metrics.interruptedSkills,1);
});
test('healers reserve pending healing instead of preparing two heals for an already-covered ally',()=>{
 const {b}=setup(['nyra','nyra','aurel']);const [a,c,ally,enemy]=b.units;ally.hp=ally.maxHp*.7;b.cast(a,a.id,enemy);assert.equal(b.shouldCast(c,c.id),false);
});
test('a living heavy-hit knockdown enters a recoverable physical fall',()=>{
 const {b}=setup(['aurel'],['brakk']),[u,t]=b.units;b.applyImpact(t,u,100,true);assert.ok(t.nativeKnockdown>0);tick(b,.08);assert.ok(t.nativeActor.ragdoll);tick(b,.64);assert.ok(t.nativeGetup>0);tick(b,.5);assert.equal(t.nativeActor.ragdoll,null);assert.ok(t.hp>0);
});
test('opening doctrines are mutually exclusive and cannot duplicate a relic after reload',()=>{
 const run=makeRun(2,NATIVE_STARTERS);assert.equal(chooseOpeningBoon(run,'thorn-crown'),false);run.wins=1;assert.equal(chooseOpeningBoon(run,'thorn-crown'),true);assert.equal(chooseOpeningBoon(run,'glass-cannon'),false);const loaded=JSON.parse(JSON.stringify(run));assert.equal(chooseOpeningBoon(loaded,'thorn-crown'),false);assert.equal(loaded.relics.filter(id=>id==='thorn-crown').length,1);
});
test('practice comparisons use real combat and leave the parent expedition unchanged',()=>{
 const run=makeRun(4,NATIVE_STARTERS),before=JSON.stringify(run);for(const kind of ['moving','shielded','clustered']){const b=practiceBattle(run,kind,true);tick(b,6);assert.ok(b.time>5);assert.ok(b.metrics.skills>0);assert.ok(practiceResult(b).damage>=0);assert.equal(JSON.stringify(run),before);}
});
test('native recruitment events display and award the same released family',()=>{
 const run=makeRun(1,NATIVE_STARTERS);for(let i=0;i<EVENTS.length;i++){const e=eventForRun(run,i);for(const c of e.choices)if(c.creature)assert.ok(BY_ID[c.creature].nativeRig);}
});

test('native recruits keep animated bodies when deployed beside legacy creatures',()=>{
 const run=makeRun(13,['aurel','mossguard','brookfin','voltwing','pyrehorn','bloomkin']),b=new Battle(run,[creature('nightmaw')],13),u=b.units[0];assert.equal(b.native,false);assert.ok(u.nativeActor);const gait=u.nativeActor.gait;tick(b,.6);assert.ok(u.nativeActor.gait>gait);
});
test('an empty expedition cannot start an invalid practice comparison',()=>{const run=makeRun(4,NATIVE_STARTERS);run.team=[];assert.equal(practiceBattle(run),null);});

test('the common axe specialist can damage health through a full shield',()=>{const {b}=setup(['brakk'],['aurel']),[u,t]=b.units;t.shield=500;const hp=t.hp;b.hit(t,u.atk*2.2,u,u.id,1,false,'physical');assert.ok(t.hp<hp);assert.ok(t.shield>0);});

test("family evolution tradeoffs are visible before the player commits",()=>{const c=creature("aurel",5);assert.match(evolutionMechanic(c,"Guardian","wild"),/Dawn Reaver.*2×/);assert.match(evolutionMechanic(c,"Guardian","warden"),/Oathkeeper.*20 stamina/);});
