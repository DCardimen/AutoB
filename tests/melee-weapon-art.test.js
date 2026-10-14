import test from 'node:test';
import assert from 'node:assert/strict';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels,spritePoint} from '../prototype-pixel-art.js';
const melee=PIXEL_SPECIES.filter(s=>['knight','orc'].includes(s.nativeRig));
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
