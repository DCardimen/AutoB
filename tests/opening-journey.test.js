import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,BY_ID} from '../game.js';
import {prepareOpeningRelics,openingRelicFit,chooseFirstRelic} from '../opening-relics.js';
import {learningJourney,journeyStep,completeJourneyStep,rewardStepsHTML,nextSpellMilestone,fieldNotesHTML} from '../opening-journey.js';

test('opening offers suit different parties, include combat power, remain distinct and survive reload',()=>{
 for(const team of [['aurel','brakk'],['syl','rowan'],['nyra','syl'],['brom'],['grit']])for(let seed=0;seed<200;seed++){
  const run=makeRun(seed,team,{starterBudget:23}),offer=prepareOpeningRelics(run,{},BY_ID);
  assert.equal(offer.choices.length,2);assert.equal(new Set(offer.choices).size,2);
  const fits=offer.choices.map(id=>openingRelicFit(id,run.team,BY_ID));
  assert.ok(fits.every(f=>f.eligible));assert.ok(fits.some(f=>!['economy','capture'].includes(f.kind)));assert.notEqual(fits[0].kind,fits[1].kind);
  assert.deepEqual(prepareOpeningRelics(JSON.parse(JSON.stringify(run)),{},BY_ID),offer);
  assert.ok(chooseFirstRelic(run,offer.choices[0]));assert.equal(chooseFirstRelic(run,offer.choices[1]),false);
 }
});
test('existing saved offers remain intact and explain an inactive party bonus',()=>{
 const run=makeRun(3,['brakk']);run.openingRelic={choices:['seed','banner'],decision:null,lesser:false};
 const before=JSON.stringify(run.openingRelic);prepareOpeningRelics(run,{},BY_ID);assert.equal(JSON.stringify(run.openingRelic),before);
 assert.equal(openingRelicFit('seed',run.team,BY_ID).eligible,false);assert.match(openingRelicFit('seed',run.team,BY_ID).detail,/inactive/);
 assert.equal(openingRelicFit('banner',run.team,BY_ID).eligible,false);
});
test('first-journey guidance follows actions, expires during combat and stays dismissed across saves',()=>{
 const profile={},run={wins:0};assert.equal(journeyStep(profile,run,'prep').id,'ready');completeJourneyStep(profile,'ready');
 assert.equal(journeyStep(profile,run,'prep'),null);assert.equal(journeyStep(profile,run,'battle',2).id,'combat');assert.equal(journeyStep(profile,run,'battle',8),null);
 completeJourneyStep(profile,'combat');assert.equal(journeyStep(JSON.parse(JSON.stringify(profile)),run,'battle',1),null);
 run.wins=1;assert.equal(journeyStep(profile,run,'map').id,'route');assert.equal(journeyStep(profile,run,'prep').id,'capture');run.captureOrder={uid:'target'};assert.equal(journeyStep(profile,run,'prep'),null);
 for(const id of ['route','capture','rewards'])completeJourneyStep(profile,id);assert.equal(profile.tutorial,true);assert.equal(learningJourney(profile,run),false);
 assert.equal(completeJourneyStep(profile,'unknown'),false);
});
test('experienced and skipped players receive no automatic guide; replay is explicit',()=>{
 assert.equal(learningJourney({tutorial:true},{wins:0}),false);assert.equal(learningJourney({best:7},{wins:0}),false);
 assert.equal(learningJourney({guideReplay:true},{wins:7}),true);
});
test('reward checklist reflects both independent blockers and becomes ready exactly when complete',()=>{
 assert.match(rewardStepsHTML({won:true,hasLoot:true,claimed:false,chosen:false}),/Pack spoils/);
 assert.match(rewardStepsHTML({won:true,hasLoot:true,claimed:true,chosen:false}),/Then continue/);
 assert.match(rewardStepsHTML({won:true,hasLoot:true,claimed:false,chosen:true}),/Then continue/);
 assert.match(rewardStepsHTML({won:true,hasLoot:true,claimed:true,chosen:true}),/Ready for the next encounter/);
 assert.ok(!rewardStepsHTML({won:false,hasLoot:false}).includes('Choose an upgrade'));
});
test('progression reports actual remaining EXP and queued choices; help describes current rules',()=>{
 assert.equal(nextSpellMilestone({level:1,xp:12},level=>level*40),'Level 3: new spell choice · 108 EXP away');
 assert.match(nextSpellMilestone({level:3,pendingSkills:[{}]},()=>40),/waiting/);assert.equal(nextSpellMilestone({level:8},()=>40),'');
 const help=fieldNotesHTML();assert.match(help,/each further second gradually adds 4% damage/);assert.match(help,/negative armor increases/);assert.match(help,/Aura Stones return to the pack/);assert.match(help,/expedition relics are kept/);
 assert.ok(!help.includes('3× damage and healing'));
});
