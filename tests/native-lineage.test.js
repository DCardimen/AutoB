import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {NATIVE_SPECIES,NATIVE_POOLS,NATIVE_STARTERS,lineageLimit,lineageProgress,settleNativeGrowth} from '../native-content.js';
import {ROSTER_BATCH} from '../native-batch.js';
import {nativePosePixels,NATIVE_POSES} from '../native-poses.js';
import {makeRun as legacyMakeRun,creature,evolutionOffer,evolveCreature,relicSlots,skillDefinition,Battle,stats,encounter,rewardBattle} from '../game.js';
import {starterBudget,unlockChaos,traitFor} from '../tactics.js';
const hash=p=>createHash('sha256').update(p).digest('hex');

test('released batch includes separate serpentine and flying bodies, weaker recruits and habitat conditions',()=>{
 assert.equal(ROSTER_BATCH.length,12);assert.equal(new Set(ROSTER_BATCH.map(s=>s.nativeDesign)).size,12);
 assert.ok(stats(creature('grit'),[]).hp<stats(creature('runespider'),[]).hp);
 assert.ok(stats(creature('grit'),[]).atk<stats(creature('runespider'),[]).atk);
 for(const spec of ROSTER_BATCH){assert.ok(NATIVE_POOLS[spec.habitat].includes(spec.id));assert.ok(traitFor(creature(spec.id)));}
 for(let seed=0;seed<24;seed++){const run=makeRun(seed,NATIVE_STARTERS);run.planet=1;run.depth=4;assert.ok(encounter(run,'battle',seed).every(c=>!['tarka','solara'].includes(c.id)));}
 const run=makeRun(1,NATIVE_STARTERS);run.planet=1;run.depth=4;run.legendaryLure=true;
 assert.ok(encounter(run,'capture',5).some(c=>c.id==='solara'));
});
test('families have one, two or three total forms; final-form families never spend gold on evolution',()=>{
 const run=makeRun(7,NATIVE_STARTERS);run.gold=500;
 for(const [id,limit]of [['solara',0],['grit',1],['brom',2]]){
  run.team[0]=creature(id,12);assert.equal(lineageLimit(run.team[0]),limit);
  for(let stage=0;stage<limit;stage++){const sockets=relicSlots(run.team[0]);assert.ok(evolveCreature(run,0,'wild').success);assert.equal(relicSlots(run.team[0]),sockets+1);}
  const gold=run.gold;assert.equal(evolveCreature(run,0,'wild').success,false);assert.equal(run.gold,gold);
 }
 const old=creature('brakk',8);old.evolution=2;old.evolutionPath='warden';assert.equal(lineageLimit(old),2);assert.equal(relicSlots(old),3);
});
test('a combat accomplishment unlocks an early transformation while retaining identity and support links',()=>{
 const run=makeRun(7,NATIVE_STARTERS);run.team[0]=creature('brom',3);run.gold=100;
 const c=run.team[0],uid=c.uid;c.relics=[{uid:'kept',id:'quick-shard',link:'brom'}];
 assert.equal(evolutionOffer(run,c).ready,false);c.accomplishments={shielded:180};assert.ok(lineageProgress(c).ready);
 assert.equal(evolutionOffer(run,c).route,'accomplishment');assert.ok(evolveCreature(run,0,'warden').success);assert.equal(c.uid,uid);assert.equal(c.relics[0].link,'brom');assert.equal(skillDefinition(c,'brom').shield,85);
});
test('actual combat settlement awards native growth once and practice cannot mutate the parent run',()=>{
 const run=makeRun(17,NATIVE_STARTERS);const battle=new Battle(run,[creature('grit')],17);
 while(!battle.done)battle.step(.1);assert.ok(settleNativeGrowth(run,battle));
 assert.ok(run.team.some(c=>c.accomplishments.damage>0));const before=JSON.stringify(run.team);assert.equal(settleNativeGrowth(run,battle),false);assert.equal(JSON.stringify(run.team),before);
 const loaded=JSON.parse(JSON.stringify(run));assert.equal(settleNativeGrowth(loaded,battle),false);
 const unearned=makeRun(9,NATIVE_STARTERS);assert.equal(settleNativeGrowth(unearned,new Battle(unearned,[creature('grit')],9)),false);
});
test('an evolved signature changes the real skill and its connected combat effect',()=>{
 const run=makeRun(11,NATIVE_STARTERS);run.team=[creature('brom',5)];run.team[0].evolution=1;run.team[0].evolutionPath='warden';
 const b=new Battle(run,[creature('grit',5)],11),u=b.units[0],t=b.units[1];u.x=t.x-30;u.y=t.y;u.shield=0;
 b.cast(u,'brom',t,1,false,true);assert.ok(u.shield>=85);assert.equal(skillDefinition(u,'brom').shield,85);
 const a=creature('morrow',5);a.evolution=1;a.evolutionPath='wild';assert.equal(skillDefinition(a,'morrow').targets,3);assert.equal(skillDefinition(a,'auto-morrow').root,.4);
});
test('a genuine retry after a defeat earns fresh accomplishments while repeated settlement does not',()=>{
 const run=makeRun(9,NATIVE_STARTERS);run.team=[creature('grit')];
 const first=new Battle(run,[creature('tarka',8)],9);while(!first.done)first.step(.1);assert.equal(first.winner,1);rewardBattle(run,'boss',false,first);
 const endured=run.team[0].accomplishments.damageTaken;const second=new Battle(run,[creature('tarka',8)],9);while(!second.done)second.step(.1);rewardBattle(run,'boss',false,second);
 assert.ok(run.team[0].accomplishments.damageTaken>endured);const total=run.team[0].accomplishments.damageTaken;assert.equal(settleNativeGrowth(run,second),false);assert.equal(run.team[0].accomplishments.damageTaken,total);
});
test('every Chaos clear grants one permanent point, without duplicate rewards',()=>{
 const profile={};assert.equal(starterBudget(profile),3);unlockChaos(profile,makeRun(1));assert.equal(starterBudget(profile),3);
 unlockChaos(profile,makeRun(1,undefined,{difficulty:'chaos',chaos:1}));assert.equal(starterBudget(profile),4);
 unlockChaos(profile,makeRun(1,undefined,{difficulty:'chaos',chaos:1}));assert.equal(starterBudget(profile),4);
 unlockChaos(profile,makeRun(1,undefined,{difficulty:'chaos',chaos:20}));assert.equal(starterBudget(JSON.parse(JSON.stringify(profile))),23);
});
test('new family art stays recognizable across forms and every required pose fits its 64-pixel cell',()=>{
 const identities=[];
 for(const s of ROSTER_BATCH){const c={id:s.id};identities.push(hash(nativePosePixels(s,c,'idle',.25,1)));
  for(const state of NATIVE_POSES)for(let dir=0;dir<8;dir++)for(const phase of [0,.3,.7,1]){
   const pixels=nativePosePixels(s,c,state,phase,dir);assert.equal(pixels.clipped,0,`${s.id} ${state} ${dir}`);assert.ok(pixels.some((v,i)=>i%4===3&&v===255));
  }
  if(lineageLimit(c)>0){const base=nativePosePixels(s,c,'idle',.25,1),evolved=nativePosePixels(s,{...c,evolution:1,evolutionPath:'wild'},'idle',.25,1);assert.notEqual(hash(base),hash(evolved));}
 }
 assert.equal(new Set(identities).size,12);
});

function makeRun(seed,ids,options={}){return legacyMakeRun(seed,ids,{...options,rulesVersion:11});}
