import test from 'node:test';
import assert from 'node:assert/strict';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels,spritePoint} from '../prototype-pixel-art.js';
const melee=PIXEL_SPECIES.filter(s=>['knight','orc'].includes(s.nativeRig));

test('resting melee weapons hang down from their hands instead of crossing the chest',()=>{
 for(const id of ['brakk','brom','tarka','aurel','sable','mossguard'])for(const evolution of [0,1,2])for(const state of ['idle','walk','run','sprint'])for(let dir=0;dir<8;dir++){
  const spec=PIXEL_SPECIES.find(s=>s.id===id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,.25);
  const pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  if(['cannon','gauntlet'].includes(rig.gear))continue;
  const arm=rig.arms.find(a=>a.side===1),hand=rig.artProject(arm.end),grip=rig.artProject(rig.weapon.grip),tip=rig.artProject(rig.weapon.tip);
  assert.deepEqual(hand,grip,id+' connected resting grip');
  assert.ok(tip.y-grip.y>Math.abs(tip.x-grip.x),id+' downward resting weapon');
  assert.equal(pixels.clipped,0,id+' complete carry silhouette');
 }
});

test('Brakk rests both hands below his shoulders on opposite sides of his torso',()=>{
 const spec=PIXEL_SPECIES.find(s=>s.id==='brakk');
 for(const evolution of [0,1,2])for(const evolutionPath of ['wild','warden'])for(const dir of [1,2,3]){
  const rig=nativePoseRig(spec,{id:'brakk',evolution,evolutionPath},'idle',.25);
  paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  const hands=rig.arms.map(a=>rig.artProject(a.end)),body=rig.artAnchors.body;
  assert.ok(Math.min(...hands.map(h=>h.x))<body.x-3,'left resting hand');
  assert.ok(Math.max(...hands.map(h=>h.x))>body.x+3,'right resting hand');
  for(const arm of rig.arms)assert.ok(rig.artProject(arm.end).y>rig.artArmRoots[arm.side].y+3,'relaxed arm');
 }
});
test('melee silhouettes retain the complete weapon and limbs during swings, dodges, hits and falls',()=>{
 for(const spec of melee)for(const evolution of [0,1,2])for(const evolutionPath of evolution?['wild','warden']:['wild'])for(const [state,phase]of [['sprint',0],['sprint',.43],['slash',.46],['slash',.62],['charge',.46],['charge',.62],['dodge',.5],['hit',.5],['death',.7]])for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  assert.equal(pixels.clipped,0,spec.id+' '+evolution+' '+state+' '+dir);
 }
});
test('active melee contacts keep their physical direction and the weapon remains in its wielding hand',()=>{
 for(const spec of melee)for(const evolution of [0,1,2])for(const [state,phase]of [['attack',.46],['attack',.58],['slash',.46],['slash',.58],['charge',.46],['charge',.58]])for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),angle=dir*Math.PI/4;
  paintCharacterPixels(spec.nativeRig,rig,angle);
  const arm=rig.arms.find(a=>a.side===(rig.weapon.hand==='left'?-1:1)),hand=rig.artProject(arm.end),grip=rig.artProject(rig.weapon.grip),tip=rig.artProject(rig.weapon.tip),a=spritePoint(rig.weapon.grip,angle),z=spritePoint(rig.weapon.tip,angle);
  assert.ok(Math.hypot(hand.x-grip.x,hand.y-grip.y)<1e-7,spec.id+' wielding grip');
  const dx=tip.x-grip.x,dy=tip.y-grip.y,px=z.x-a.x,py=z.y-a.y;
  assert.ok(Math.abs(dx*py-dy*px)<1e-7,spec.id+' active contact direction');
  assert.ok(dx*px+dy*py>0,spec.id+' active contact orientation');
 }
});
