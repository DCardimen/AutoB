import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,Battle,settleCaptureRecruitment,rewardBattle,settleDefeat} from '../game.js';
import {capacity} from '../expedition-rules.js';

function fixture(){
 const run=makeRun(83,['aurel','brakk']);run.relics=[];
 const enemy={...creature('nyra',7),evolution:1,evolutionPath:'wild',nature:'Savant',genes:{hp:.9,atk:.8,speed:1.2,cd:.85},enemyRelics:['venom-clasp'],equipment:['prism-focus'],equipmentQuality:.7,equipmentRolls:[{rarity:'Rare',quality:1.1,sourceName:'Wild Nyra'}]};
 run.captureOrder={uid:enemy.uid,threshold:.25,tool:'scout',mode:'mercy'};
 const battle=new Battle(run,[enemy,creature('syl')],83,{visuals:false}),target=battle.units[2];
 target.hp=target.maxHp*.2;battle.random=()=>0;battle.attemptCapture();
 battle.captureResult.creature.bond=3;
 return {run,battle,target,result:battle.captureResult};
}
test('a successful combat capture recruits into a free unlocked team place after round settlement',()=>{
 const {run,target,result}=fixture();assert.equal(target.side,0);assert.equal(run.team.length,2);assert.equal(run.bench.length,0);
 run.teamCapacity=3;const award=settleCaptureRecruitment(run,result),caught=run.team[2];
 assert.equal(award.destination,'team');assert.equal(run.bench.length,0);assert.equal(caught.id,'nyra');assert.equal(caught.seat,2);assert.equal(caught.captureSourceUid,target.uid);assert.notEqual(caught.uid,target.uid);
 assert.equal(caught.level,7);assert.equal(caught.evolution,1);assert.equal(caught.evolutionPath,'wild');assert.equal(caught.nature,'Savant');assert.deepEqual(caught.genes,result.creature.genes);assert.deepEqual(caught.boundRelics,['venom-clasp']);assert.deepEqual(caught.equipment,['prism-focus']);assert.equal(caught.equipmentQuality,1);assert.ok(Math.abs(caught.equipmentRolls[0].quality-.77)<1e-9);assert.equal(caught.equipmentRolls[0].rarity,'Rare');assert.equal(caught.bond,3);assert.equal(caught.roundAlly,undefined);
});
test('a full active team keeps the capture in reserves without replacing anyone',()=>{
 const {run,result}=fixture(),before=run.team.map(c=>c.uid);const award=settleCaptureRecruitment(run,result);
 assert.equal(capacity(run),2);assert.equal(award.destination,'reserve');assert.deepEqual(run.team.map(c=>c.uid),before);assert.equal(run.bench.length,1);assert.equal(run.bench[0].uid,award.uid);
});
test('a place unlocked by this victory is available to the new capture',()=>{
 const {run,battle,result}=fixture();run.wins=1;const reward=rewardBattle(run,'battle',true,battle);assert.equal(reward.slotsAdded,1);
 assert.equal(settleCaptureRecruitment(run,result).destination,'team');assert.equal(run.team.length,3);
});
test('capture recruitment follows retreat casualty settlement, filling the actual vacancy',()=>{
 const {run,battle,result}=fixture();rewardBattle(run,'battle',false,battle);const loss=settleDefeat(run,'retreat',83);assert.ok(loss.lost);
 const remaining=run.team[0].uid,award=settleCaptureRecruitment(run,result);assert.equal(award.destination,'team');assert.equal(run.team.length,2);assert.ok(run.team.some(c=>c.uid===remaining));assert.ok(!run.team.some(c=>c.uid===loss.uid));
});
test('saved recruitment is idempotent for roster, identity and capture economy rewards',()=>{
 const {run,result}=fixture();run.relics=['beast-ledger'];const gold=run.gold;const award=settleCaptureRecruitment(run,result);assert.equal(run.gold,gold+35);
 const saved=JSON.parse(JSON.stringify({run,result}));assert.deepEqual(settleCaptureRecruitment(saved.run,saved.result),award);assert.equal(saved.run.bench.length,1);assert.equal(saved.run.gold,run.gold);assert.equal(saved.run.bench[0].uid,award.uid);
 saved.run.bench=[];settleCaptureRecruitment(saved.run,saved.result);assert.equal(saved.run.bench.length,0,'a later removed companion must not be resurrected by an old capture');
});
test('duplicate same-family captures are distinct individuals keyed by target identity',()=>{
 const {run,result}=fixture();const first=settleCaptureRecruitment(run,result);const second=settleCaptureRecruitment(run,{...result,uid:'another-wild-nyra'});assert.notEqual(first.uid,second.uid);assert.equal(run.bench.length,2);
});
test('full reserves retain a successful capture and failed captures award nothing',()=>{
 const {run,result}=fixture();run.bench=Array.from({length:12},()=>creature('aurel'));settleCaptureRecruitment(run,result);assert.equal(run.bench.length,13);assert.equal(run.bench[12].id,'nyra');
 const before=JSON.stringify(run);assert.equal(settleCaptureRecruitment(run,{...result,success:false,uid:'failed'}),null);assert.equal(JSON.stringify(run),before);
});
test('a saved mid-fight success remains only one battle ally on replay, then recruits once',()=>{
 const {run,result}=fixture();run.captureReservation={uid:result.uid,result,attempts:1,history:[result]};
 const loaded=JSON.parse(JSON.stringify(run));const replay=new Battle(loaded,[{...creature('nyra',7),uid:result.uid},creature('syl')],83,{visuals:false});replay.units[2].hp=1;replay.attemptCapture();
 assert.equal(replay.units.filter(u=>u.roundAlly).length,1);assert.equal(loaded.bench.length,0);assert.equal(loaded.team.length,2);
 settleCaptureRecruitment(loaded,replay.captureResult);settleCaptureRecruitment(loaded,result);assert.equal(loaded.bench.length,1);
});
