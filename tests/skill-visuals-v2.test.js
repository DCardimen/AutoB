import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS} from '../skills.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {skillVisual,skillIconData,skillIconSVG,SPELL_PALETTES} from '../skill-visuals.js';
import {effectProfile} from '../skill-vfx.js';

test('every released skill has finite, deterministic v2 art and a matching combat palette',()=>{
 for(const skill of Object.values(SKILLS)){
  const before=JSON.stringify(skill),p=skillVisual(skill),svg=skillIconSVG(skill);
  assert.equal(p.version,2);assert.ok(SPELL_PALETTES[p.element],skill.id);assert.ok(Number.isFinite(p.seed));
  assert.match(svg,/<svg/);assert.doesNotMatch(svg,/undefined|NaN|Infinity/);assert.equal(skillIconData(skill),skillIconData(skill));
  assert.equal(effectProfile(skill.id,'aurel').element,p.element,skill.id);assert.equal(effectProfile(skill.id,'nyxwing').shape,p.shape,skill.id);
  assert.equal(JSON.stringify(skill),before,'rendering must not mutate skill mechanics');
 }
});
test('emblems describe the action and authored weapon instead of the missing type field',()=>{
 for(const [id,shape] of Object.entries({'auto-syl':'bow','auto-cogwalker':'cannon','auto-nyra':'staff','auto-emberhound':'fang','aurel':'ward','root-snare':'roots','soul-siphon':'drain','duskcap':'poison','frostursa':'frost','cinderfall':'meteor'}))assert.equal(skillVisual(SKILLS[id]).shape,shape,id);
 for(const spec of PIXEL_SPECIES){for(const id of [spec.id,'auto-'+spec.id,spec.id+'-utility'])if(SKILLS[id])assert.equal(skillVisual(SKILLS[id]).element,spec.element,id);}
});
test('learned qualities retain spell identity and evolution bonuses have their own path/stage crest',()=>{
 for(const base of ['root-snare','nyra','morrow-utility','soul-siphon']){
  const p=skillVisual(SKILLS[base]),icons=new Set();
  for(let q=0;q<4;q++){const skill=SKILLS[`learn-${base}-${q}`],v=skillVisual(skill);assert.equal(v.element,p.element);assert.equal(v.shape,p.shape);assert.equal(v.seed,p.seed);assert.equal(v.quality,q);icons.add(skillIconData(skill));}
  assert.equal(icons.size,4);
 }
 for(const path of ['wild','warden'])for(const stage of [1,2]){const p=skillVisual(SKILLS[`evolve-syl-${path}-${stage}`]);assert.equal(p.stage,stage);assert.equal(p.path,path);assert.equal(p.family,'syl');assert.equal(p.element,'grove');}
 assert.notEqual(skillIconData(SKILLS['evolve-syl-wild-1']),skillIconData(SKILLS['evolve-syl-warden-1']));
});
