import test from 'node:test';
import assert from 'node:assert/strict';
import {creature,makeRun,BY_ID,gainXP,xpNeeded,evolveCreature,Battle,awardCapture} from '../game.js';
import {NATIVE_SPECIES} from '../native-content.js';
import {SKILLS,initializeSkills,chooseSkill,loadoutFor,regularSkillIds,cooldownSkillSlots,prepareEnemySkills} from '../skills.js';
const levelTo=(c,level)=>{while(c.level<level)gainXP(c,xpNeeded(c.level)-c.xp);};
const learnAll=c=>{while(c.pendingSkills.length){const o=c.pendingSkills[0];assert.ok(chooseSkill(c,o.key,o.options[0]));}};
test('every evolvable native family receives one separate bonus per stage on both paths',()=>{
 for(const s of NATIVE_SPECIES)for(const path of ['wild','warden']){
  const run=makeRun(9,['aurel','brakk'],{manualSkills:true});run.team=[creature(s.id,10)];const c=run.team[0];initializeSkills(c);learnAll(c);run.gold=10000;
  const regular=[...regularSkillIds(c)];
  for(let stage=1;stage<=(s.evolutionLimit??2);stage++){
   assert.ok(evolveCreature(run,0,path).success,s.id+' '+path+' '+stage);assert.equal(c.pendingSkills.length,0);assert.deepEqual(regularSkillIds(c),regular);assert.equal(c.chosenEvolutionSkills.length,stage);assert.equal(loadoutFor(s,c.level,c).active.length,4+stage);assert.ok(c.chosenEvolutionSkills.every(id=>SKILLS[id].path===path));
  }
 }
});
test('an accomplishment evolution at level three leaves its earned spell offer untouched',()=>{
 const run=makeRun(9,['aurel','brakk'],{manualSkills:true});const c=creature('brom',3);initializeSkills(c);c.accomplishments={shielded:180};run.team=[c];run.gold=1000;const offers=JSON.stringify(c.pendingSkills);
 assert.ok(evolveCreature(run,0,'warden').success);assert.equal(JSON.stringify(c.pendingSkills),offers);assert.equal(cooldownSkillSlots(c),2);learnAll(c);assert.equal(regularSkillIds(c).length,2);assert.equal(loadoutFor(BY_ID[c.id],c.level,c).active.length,3);
});
test('old shared-cap saves recover displaced spells, selected/archived bonuses and missing level offers idempotently',()=>{
 const c=creature('aurel',8);Object.assign(c,{skillsVersion:2,manualSkills:true,evolution:2,evolutionPath:'warden',learnedSkills:['learn-cinderfall-1'],chosenEvolutionSkills:['evolve-aurel-wild-1'],archivedSkills:['learn-root-snare-2','learn-aegis-call-1'],pendingSkills:[{key:'evolution:2',kind:'evolution',stage:2,selected:'evolve-aurel-wild-2',options:['evolve-aurel-wild-2','evolve-aurel-warden-2']}],skillChoicesThrough:8});
 initializeSkills(c,{migrate:true});assert.equal(regularSkillIds(c).length,4);assert.deepEqual(c.chosenEvolutionSkills,['evolve-aurel-wild-1','evolve-aurel-wild-2']);assert.equal(c.pendingSkills.length,0);assert.equal(c.archivedSkills.length,0);const saved=JSON.stringify(c);initializeSkills(c,{migrate:true});assert.equal(JSON.stringify(c),saved);
 const missing=creature('eira',7);Object.assign(missing,{skillsVersion:2,manualSkills:true,evolution:1,evolutionPath:'warden',learnedSkills:[],chosenEvolutionSkills:[],archivedSkills:['evolve-eira-warden-1'],pendingSkills:[{key:'level:5',kind:'level',level:5,options:['learn-cinderfall-1','learn-root-snare-1','learn-aegis-call-1']}],skillChoicesThrough:7});
 initializeSkills(missing,{migrate:true});assert.deepEqual(missing.pendingSkills.map(o=>o.level),[3,5,7]);assert.deepEqual(missing.chosenEvolutionSkills,['evolve-eira-warden-1']);learnAll(missing);assert.equal(regularSkillIds(missing).length,4);assert.equal(loadoutFor(BY_ID[missing.id],7,missing).active.length,5);
});
test('regular over-cap or replacement requests remain atomic despite free evolution bonuses',()=>{
 const c=creature('aurel',8);initializeSkills(c);learnAll(c);c.evolution=2;c.evolutionPath='wild';initializeSkills(c);c.pendingSkills.push({key:'extra',kind:'level',level:7,options:['learn-soul-siphon-1']});const before=JSON.stringify(c);
 assert.equal(chooseSkill(c,'extra','learn-soul-siphon-1'),false);assert.equal(chooseSkill(c,'extra','learn-soul-siphon-1',c.learnedSkills[0]),false);assert.equal(JSON.stringify(c),before);assert.equal(regularSkillIds(c).length,4);
});
test('migration keeps an upgraded active spell and refreshes conflicting offers without duplicating its archived base',()=>{
 const c=creature('aurel',8);Object.assign(c,{skillsVersion:2,manualSkills:true,evolution:1,evolutionPath:'wild',learnedSkills:['learn-root-snare-2','learn-cinderfall-1'],chosenEvolutionSkills:['evolve-aurel-wild-1'],archivedSkills:['learn-root-snare-1'],pendingSkills:[{key:'level:7',kind:'level',level:7,options:['learn-root-snare-2','learn-aegis-call-1','learn-cinderfall-1']}],skillChoicesThrough:8});
 initializeSkills(c);assert.equal(regularSkillIds(c).filter(id=>SKILLS[id].baseId==='root-snare').length,1);assert.ok(c.archivedSkills.includes('learn-root-snare-1'));assert.equal(c.pendingSkills.length,1);assert.ok(c.pendingSkills[0].options.every(id=>!['root-snare','cinderfall','aurel'].includes(SKILLS[id].baseId||id)));learnAll(c);assert.equal(regularSkillIds(c).length,4);
});
test('evolved enemies and captures retain all six real cooldowns and both bonuses',()=>{
 const enemy=creature('eira',8);enemy.evolution=2;enemy.evolutionPath='warden';prepareEnemySkills(enemy,77);assert.equal(enemy.pendingSkills.length,0);assert.equal(regularSkillIds(enemy).length,4);assert.equal(enemy.chosenEvolutionSkills.length,2);const snapshot=JSON.stringify(enemy);prepareEnemySkills(enemy,99);assert.equal(JSON.stringify(enemy),snapshot);
 const run=makeRun(9,['aurel','brakk'],{manualSkills:true}),caught=awardCapture(run,enemy);initializeSkills(caught);assert.deepEqual(caught.learnedSkills,enemy.learnedSkills);assert.deepEqual(caught.chosenEvolutionSkills,enemy.chosenEvolutionSkills);assert.equal(caught.pendingSkills.length,0);run.team=[caught];const b=new Battle(run,[creature('brakk',8)],9,{visuals:false});assert.equal(Object.keys(b.units[0].cooldowns).length,6);for(let i=0;i<300&&!b.done;i++)b.step(.04);assert.ok(b.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.atk)));
});
