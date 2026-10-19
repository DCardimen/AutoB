// The wielding hand is anatomical and never changes with facing or gait.
// It previously followed where each source sprite happened to draw its
// weapon, so a companion swapped hands while turning.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {rightHandScreen} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels,spritePoint} from '../prototype-pixel-art.js';

const specs=Object.keys(ARM_ANATOMY).map(identity=>PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===identity&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===identity)).filter(Boolean);

test('the right hand is on the viewer\'s left in camera-facing frames and on the right in away-facing frames',()=>{
 // Rest-pose physical shoulders confirm the rule wherever they separate on screen.
 const spec=specs[0];
 for(const dir of [1,2,3,5,6,7]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution:0,evolutionPath:'wild'},'idle',0),at=q=>spritePoint(q,dir*Math.PI/4);
  const right=rig.arms.find(a=>a.side===1),left=rig.arms.find(a=>a.side===-1);
  assert.equal(Math.sign(at(right.root).x-at(left.root).x),rightHandScreen(dir),`facing ${dir}`);
 }
});

test('every armed companion keeps each physical arm on its own painted arm in all facings and forms',()=>{
 for(const spec of specs)for(const evolution of [0,1,2])for(const state of ['idle','walk','run','attack'])for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,.25),context=`${spec.id}/${evolution}/${state}/${dir}`;
  rig.artStage=evolution;paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
  for(const arm of rig.arms)assert.equal(rig.artArmScreens[arm.side],arm.side*rightHandScreen(dir),`${context}: arm ${arm.side} painted as the other hand`);
  if(rig.weapon){
   const wield=rig.weapon.hand==='left'?-1:1;
   assert.equal(rig.artWeaponIdentity.screenSide,wield*rightHandScreen(dir),`${context}: weapon carried in the other hand`);
  }
 }
});

test('melee weapons are always wielded in the right hand',()=>{
 for(const spec of specs){
  const rig=nativePoseRig(spec,{id:spec.id,evolution:0,evolutionPath:'wild'},'idle',0);
  if(rig.weapon&&['sword','axe'].includes(rig.weapon.kind))assert.equal(rig.weapon.hand,'right',spec.id);
 }
});
