// Directional melee shoulders: the reconstructed torso stays hidden.
// The previous failures were blank/striped torso chunks in quarter and profile
// views, far arms erased by the hidden fill, resting arms bent off their
// painted position and loose outline dots left behind by a swinging arm.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MELEE_ARM_FAMILIES,authoredParts} from '../authored-parts.js';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {migrateFacing} from '../scripts/migrate-melee-arm-fragments.mjs';

const families=[...MELEE_ARM_FAMILIES],forms=[0,1,2],dirs=[0,1,2,3,4,5,6,7];
const specFor=identity=>PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===identity&&!s.pixelConverted);
const pose=(identity,stage,state,phase,dir)=>{const spec=specFor(identity),rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,phase);rig.artStage=stage;const pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);return {rig,pixels};};
const partsFor=(identity,stage,dir)=>authoredParts(authoredSourceFrame(identity,dir,stage),identity,stage,dir);

test('reconstructed backing never covers back-cape artwork that the source shows',()=>{
 for(const identity of families)for(const stage of forms)for(const dir of dirs){
  const parts=partsFor(identity,stage,dir);
  for(const p of parts.underbody)assert.notEqual(parts.ownership.get(p.y*64+p.x),'cape-back',`${identity}/${stage}/${dir} backing over visible cape at ${p.x},${p.y}`);
 }
});

test('saved masters contain no stranded outline islands next to an arm',()=>{
 for(const file of fs.readdirSync('art/melee-layers/masters').filter(f=>f.endsWith('.json'))){
  const master=JSON.parse(fs.readFileSync('art/melee-layers/masters/'+file,'utf8'));
  master.facings.forEach((facing,dir)=>assert.deepEqual(migrateFacing(facing),[],`${file}/${dir}: run scripts/migrate-melee-arm-fragments.mjs`));
 }
});

test('resting hands and elbows sit exactly on their painted bind positions in every facing',()=>{
 for(const identity of families)for(const stage of forms)for(const dir of dirs)for(const phase of [0,.5]){
  const {rig}=pose(identity,stage,'idle',phase,dir),context=`${identity}/${stage}/${dir}/${phase}`;
  for(const arm of rig.arms){
   const profile=rig.artArmSkin.art.profiles.get(rig.artArmScreens[arm.side]);
   for(const [point,source]of [[arm.end,profile.end],[arm.joint,profile.joint]]){
    const actual=rig.artLimbPoints.get(point),bind=rig.artLayerProject('body',source.x,source.y);
    assert.ok(Math.hypot(actual.x-bind.x,actual.y-bind.y)<.05,`${context}: arm ${arm.side} left its painted position`);
   }
  }
 }
});

test('hidden torso fill stays hidden at rest and is only a sliver during swings',()=>{
 // Render each pose with and without the reconstructed backing. Every pixel
 // that differs is backing the player can see. The previous release showed
 // up to 57 such pixels at rest and 49 in one swing frame.
 const visible=(identity,stage,state,phase,dir)=>{
  const parts=partsFor(identity,stage,dir),saved=parts.underbody,a=pose(identity,stage,state,phase,dir).pixels;
  parts.underbody=[];let b;try{b=pose(identity,stage,state,phase,dir).pixels;}finally{parts.underbody=saved;}
  let count=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])count++;return count;
 };
 for(const identity of families)for(const stage of forms)for(const dir of dirs)for(const [state,phase]of [['idle',0],['attack',.3],['attack',.5],['attack',.7],['slash',.4]]){
  const count=visible(identity,stage,state,phase,dir);
  assert.ok(count<=16,`${identity}/${stage}/${dir}/${state}/${phase}: ${count} backing pixels visible`);
 }
});
