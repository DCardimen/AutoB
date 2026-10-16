import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,creature,Battle,BY_ID,captureChance} from '../game.js';
import {captureTrackerState,focusKnockoutRisk} from '../capture-tracker.js';

test('threshold forecast uses engine odds and opening combat stats without mutating the run',()=>{
 const run=makeRun(73,['aurel','brakk']),foes=[creature('syl')];
 run.captureOrder={uid:foes[0].uid,threshold:.15,tool:'scout',mode:'mercy'};
 const preview=new Battle(JSON.parse(JSON.stringify(run)),structuredClone(foes),73,{visuals:false}),before=JSON.stringify(run);
 const state=captureTrackerState(run,foes,'prep',null,preview);
 assert.equal(state.rarity,BY_ID[foes[0].id].rarity);
 assert.equal(state.maxHp,preview.units.find(c=>c.uid===state.uid).maxHp);
 assert.equal(state.thresholdChance,captureChance(run,{...foes[0],capturePreparation:{healthFraction:.15,status:false,tool:'scout',mode:'mercy'}}));
 assert.equal(JSON.stringify(run),before);
 run.captureOrder.threshold=.75;
 assert.ok(captureTrackerState(run,foes,'prep',null,preview).thresholdChance<state.thresholdChance);
});

test('focus estimate responds to health, armor, shields, living allies and restraint',()=>{
 const team=[{hp:100,atk:40},{hp:100,atk:30}],target={id:'syl',maxHp:300,armor:0};
 const risk=(allies=team,t=target,hp=.25,mode='mercy')=>focusKnockoutRisk(allies,t,hp,mode);
 assert.ok(risk(team,target,.1)>risk());
 assert.ok(risk([...team,{hp:100,atk:70}])>risk());
 assert.ok(risk(team,{...target,armor:100})<risk());
 assert.ok(risk(team,{...target,shield:50})<risk());
 assert.ok(risk(team,target,.25,'swift')>risk());
 assert.equal(risk([...team,{hp:0,atk:1000}]),risk());
 assert.equal(risk([]),0);
 for(const hp of [0,.01,.25,1])assert.ok(risk(team,target,hp)>=0&&risk(team,target,hp)<=1);
});

test('live forecast uses surviving allies, current statuses and lower-than-threshold HP',()=>{
 const run=makeRun(7,['aurel','brakk']),foes=[creature('syl')];
 run.captureOrder={uid:foes[0].uid,threshold:.25,tool:'scout',mode:'mercy'};
 const battle=new Battle(run,foes,7,{visuals:false}),target=battle.units.find(c=>c.side===1);
 target.poison=2;target.hp=target.maxHp*.1;
 const state=captureTrackerState(run,foes,'battle',battle);
 assert.equal(state.riskFraction,.1);
 assert.equal(state.thresholdChance,captureChance(run,{...target,capturePreparation:{healthFraction:.25,status:true,tool:'scout',mode:'mercy'}}));
 battle.units.filter(c=>c.side===0).forEach(c=>c.hp=0);
 assert.equal(captureTrackerState(run,foes,'battle',battle).knockoutRisk,0);
});

