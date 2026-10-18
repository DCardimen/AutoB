import test from 'node:test';
import assert from 'node:assert/strict';
import {MELEE_ARM_FAMILIES,authoredParts,occludedMeleeArm} from '../authored-parts.js';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';

test('side-view evolved grips use the actual hand rather than cape or belt samples',()=>{
 for(const [id,stage,x,y]of [['knight',1,28,34],['knight',2,32,32],['orc',1,29,33],['orc',2,42,35],['goblin',1,34,31],['goblin',2,38,30],['rogue',1,27,29],['rogue',2,30,33]]){
  const asset=authoredSourceFrame(id,4,stage),parts=authoredParts(asset,id,stage,4),arm=parts.arms.profiles.get(1);
  assert.deepEqual(arm.end,{x,y},id+'/'+stage);
  assert.ok(arm.grid.has(y*64+x),'the actual glove is present');
  if(id==='orc'||id==='goblin'&&stage===2){const [r,g,b]=arm.grid.get(y*64+x).rgb;assert.ok(g>r*.9&&g>b*1.3,'grip is on the painted green hand');}
  if(id==='goblin'&&stage===1)assert.equal(arm.grid.get(y*64+x).color,'#905d2a','the leather glove, not the red cape sample');
 }
});

test('concealed rear rogue arms use original indexed arm art without cutting holes in the cloak',()=>{
 for(let stage=0;stage<3;stage++)for(const dir of [5,6,7]){
  const asset=authoredSourceFrame('rogue',dir,stage),parts=authoredParts(asset,'rogue',stage,dir),front=authoredParts(authoredSourceFrame('rogue',2,stage),'rogue',stage,2);
  for(const side of [-1,1])if(occludedMeleeArm('rogue',dir,side)){
   const arm=parts.arms.profiles.get(side),original=front.arms.profiles.get(side);
   assert.equal(arm.sourceDir,2);assert.equal(arm.pixels.length,original.pixels.length);
   arm.pixels.forEach((p,i)=>{assert.equal(p.index,original.pixels[i].index);assert.equal(p.color,asset.colors[p.index]);});
  }
  if(dir===6)for(const p of asset.pixels)assert.ok(parts.body.some(q=>q.x===p.x&&q.y===p.y&&q.index===p.index),'complete authored rear cloak retained');
 }
});

test('relaxed profile-view hands stay on their authored side even when both hands are left of the chest',()=>{
 for(const id of ['aurel','sable']){
  const spec=PIXEL_SPECIES.find(s=>s.id===id),rig=nativePoseRig(spec,{id,evolution:1,evolutionPath:'wild'},'idle',.25);paintCharacterPixels(rig.id,rig,Math.PI);
  const arm=rig.arms.find(a=>rig.artArmScreens[a.side]===1),source=rig.artArmSkin.art.profiles.get(1).end,expected=rig.artSourceProject(source.x,source.y),actual=rig.artProject(arm.end);
  assert.ok(Math.hypot(actual.x-expected.x,actual.y-expected.y)<1,id+': do not force the registered hand across the torso');
  assert.ok(actual.x<rig.artAnchors.body.x,id+': original profile stance');
 }
});

test('all 168 melee sources keep moving arm ownership separate from torso repairs and feet',()=>{
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const source=authoredSourceFrame(id,dir,stage),parts=authoredParts(source,id,stage,dir),body=new Map(parts.body.map(p=>[p.y*64+p.x,p]));
  for(const arm of parts.arms.profiles.values())if(!arm.occluded)for(const p of arm.pixels){
   const still=body.get(p.y*64+p.x);assert.ok(!still||still.bodyUnderlay,'original sleeve/hand never stays in the body');
   assert.ok(p.y<parts.registration.pelvis,'feet stay on the authored leg path');
  }
  for(const p of parts.repairs){const row=parts.bodyRows.get(p.y);assert.ok(row&&p.x>=row.left&&p.x<=row.right,'a fill cannot recreate the outside arm silhouette');}
 }
});

test('a tall falling troll keeps its complete cuff inside the cell without shrinking the arm',()=>{
 const spec=PIXEL_SPECIES.find(s=>s.id==='mossguard'),rig=nativePoseRig(spec,{id:spec.id,evolution:2,evolutionPath:'wild'},'death',.43,1.1),pixels=paintCharacterPixels(rig.id,rig,Math.PI);
 assert.equal(pixels.clipped,0);assert.equal(rig.artCellFit,1,'translate the complete pose at its original size');
 assert.ok(rig.artCellShift.y<0&&rig.artCellShift.y>-3,'the complete pose moves up to retain its original cuff');
 const reused=paintCharacterPixels(rig.id,rig,0),fresh=nativePoseRig(spec,{id:spec.id,evolution:2,evolutionPath:'wild'},'death',.43,1.1);
 assert.deepEqual([...reused],[...paintCharacterPixels(fresh.id,fresh,0)],'cell fitting never carries an offset into another facing');
});

test('every melee companion and available evolution has its complete source asset and paints a substantial sprite in all facings',()=>{
 const specs=PIXEL_SPECIES.filter(s=>MELEE_ARM_FAMILIES.has(s.nativeDesign));assert.equal(specs.length,12);
 for(const spec of specs)for(let evolution=0;evolution<=spec.evolutionLimit;evolution++)for(const evolutionPath of ['wild','warden'])for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath},'attack',.49),image=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),source=authoredSourceFrame(spec.nativeDesign,dir,rig.artStage);
  assert.ok(source.pixels.length>200,spec.id+': source cell exists');
  assert.ok(image.filter((_,i)=>i%4===3&&image[i]).length>200,spec.id+': actual rendered companion is present');
  assert.equal(image.clipped,0,spec.id+': no missing cell-edge artwork');
 }
});
