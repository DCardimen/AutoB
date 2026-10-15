import test from 'node:test';
import assert from 'node:assert/strict';
import {starterReactionProfile,starterReactionPose,starterReactionRig,starterReactionPixels,owlReactionPixels} from '../starter-reactions.js';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativePoseRig,nativePosePixels} from '../native-poses.js';
const designs=[...new Map(PIXEL_SPECIES.map(spec=>[spec.nativeDesign||spec.nativeRig,spec])).values()];
const colors=p=>new Set(Array.from({length:4096},(_,i)=>p[i*4+3]?Array.from(p.subarray(i*4,i*4+4)).join(','):null).filter(Boolean));

test('greetings follow authored anatomy instead of a reused physics rig',()=>{
 for(const [id,kind]of Object.entries({voltwing:'owl',cinderfox:'nuzzle',mossguard:'nod',brookfin:'swish',pyrehorn:'nod',bloomkin:'flutter',aurel:'salute',brakk:'wave',syl:'bow',rowan:'bow',nyra:'magic',cogwalker:'chime',duskcap:'wobble',runespider:'skitter'}))assert.equal(starterReactionProfile(pixelSpec(id)).kind,kind,id);
 assert.notEqual(starterReactionProfile(pixelSpec('cinderfox')).kind,starterReactionProfile(pixelSpec('rowan')).kind,'animal fox and armed fox-person have different greetings');
});

test('weapon greetings remain pre-release, retain identity and keep their physical hand attachment',()=>{
 for(const spec of designs.filter(s=>['salute','bow'].includes(starterReactionProfile(s).kind)))for(let i=0;i<=24;i++){
  const pose=starterReactionPose(spec,i/24),rig=starterReactionRig(spec,i/24);
  assert.equal(rig.weapon.active,false,spec.id+' never swings at the player');
  const hand=rig.arms.find(a=>a.side===(rig.weapon.hand==='left'?-1:1));
  assert.ok(Math.hypot(hand.end.x-rig.weapon.grip.x,hand.end.y-rig.weapon.grip.y,hand.end.z-rig.weapon.grip.z)<.001,spec.id+' grip stays in its original hand');
 }
});

test('all first-form greetings stay inside the source cell in the selectable head-on facing',()=>{
 for(const spec of designs)for(let i=0;i<=16;i++){
  const pose=starterReactionPose(spec,i/16),pixels=starterReactionPixels(spec,i/16);
  assert.equal(pixels.clipped,0,`${spec.nativeDesign} sample ${i}`);
 }
});

test('owl blink and connected head tilt preserve the painted palette, body and planted feet',()=>{
 const spec=pixelSpec('voltwing'),source=new Uint8ClampedArray(nativePosePixels(spec,{id:'voltwing'},'idle',.25,2)),palette=colors(source);
 const open=owlReactionPixels(source,0),blink=owlReactionPixels(source,.28);
 assert.deepEqual(open,source);assert.notDeepEqual(blink,source,'eyes visibly close');
 for(let i=0;i<=32;i++){
  const frame=owlReactionPixels(source,i/32);
  assert.deepEqual(frame.subarray(29*64*4),source.subarray(29*64*4),'body, wings and feet are unchanged');
  assert.ok([...colors(frame)].every(color=>palette.has(color)),'eyelids use existing feather/eye swatches');
  for(let x=0;x<64;x++)assert.equal(frame[x*4+3],0,'complete head fits below the cell edge');
 }
});
