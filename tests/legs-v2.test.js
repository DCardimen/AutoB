import test from 'node:test';
import assert from 'node:assert/strict';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativeRigFor} from '../grand-designs.js';
import {characterRig,locomotionStride} from '../prototype-rig.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {sampleLegMaterial} from '../leg-anatomy.js';
import {normalizeTuning,setTuning} from '../tuning.js';
import {makeRun,Battle,creature} from '../game.js';
import {advanceNative} from '../native-combat.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const families=[...new Map(PIXEL_SPECIES.map(s=>[s.nativeDesign||s.nativeRig,s])).values()];

test('every anatomy retains reachable, fixed-length legs at both stride extremes throughout three gait cycles',()=>{
 for(const spec of families)for(const strideLength of [50,100,150])for(const state of ['walk','run','sprint'])for(let step=0;step<64;step++){
  const rig=characterRig(nativeRigFor(spec),state,step/64,'',{design:spec.nativeDesign,strideLength});
  for(const leg of rig.legs){
   assert.equal(leg.clamped,false,`${spec.id} ${state} ${strideLength} ${step}`);
   assert.ok(Math.abs(distance(leg.root,leg.joint)-leg.upper)<1e-7);
   assert.ok(Math.abs(distance(leg.joint,leg.hock||leg.end)-leg.lower)<1e-7);
   if(leg.hock)assert.ok(Math.abs(distance(leg.hock,leg.end)-leg.hockLength)<1e-7);
   if(leg.foot.planted)assert.ok(Math.abs(leg.end.z-leg.foot.soleLift-3)<1e-7,'plant stays on the floor');
  }
 }
});

test('heavy animals retain authored limb widths and textured materials in each facing and evolution',()=>{
 for(const id of ['frostursa','pyrehorn','flintback','cogwalker','sunlion'])for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  const spec=pixelSpec(id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},'run',.31),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  assert.equal(pixels.clipped,0,id);assert.equal(rig.artLegSkin.mode,'authored');
  assert.ok(rig.artLegSkin.limbs.some(l=>l.width>=3),'heavy bodies retain their original broad limbs');
  assert.ok(rig.artLegSkin.limbs.every(l=>[l.hip,l.ankle].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
  assert.ok(rig.artNaturalPalette.every(c=>rig.artLegSkin.palette.includes(c)),'attack appendages use the authored material');
 }
});
test('material selection rejects neighboring crystals and outline pixels without recoloring white fur',()=>{
 const colors=['#000000','#292b31','#686b76','#a9aab3','#e2e1e5','#fff8f2','#087feb','#30b8ff'];
 const pixels=Array.from({length:80},(_,i)=>({index:i<60?2+i%4:i<70?1:6+i%2})),ramp=sampleLegMaterial({colors},pixels,pixels.slice(0,60));
 assert.ok(ramp.every(i=>i>=2&&i<=5));
 assert.ok(ramp.some(i=>i>=4),'white fur retains its light authored tones');
});

test('all 89 collection families retain unclipped legs through movement, dodging and falls in eight views and three forms',()=>{
 for(const spec of PIXEL_SPECIES)for(const evolution of [0,1,2])for(const [state,phase]of [['walk',.12],['run',.31],['sprint',.72],['dodge',.5],['death',.5]])for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:evolution===1?'warden':'wild'},state,phase),pixels=paintCharacterPixels(nativeRigFor(spec,{evolution}),rig,dir*Math.PI/4);
  assert.equal(pixels.clipped,0,`${spec.id} ${evolution} ${state} ${dir}`);
  if(rig.legs.length>2)assert.equal(rig.artLegSkin.mode,'authored',spec.id+' retains its original visible anatomy');else if(rig.legs.length)assert.equal(rig.artLegSkin.mode,'authored',spec.id+' retains its painted boots and clothing');
 }
});

test('stride length migrates, clamps, resets and changes steps without changing combat travel or stats',()=>{
 assert.equal(normalizeTuning({}).strideLength,100);assert.equal(normalizeTuning({strideLength:1}).strideLength,50);assert.equal(normalizeTuning({strideLength:999}).strideLength,150);
 const run=makeRun(28,['aurel']),battle=new Battle(run,[creature('brakk')],28,{visuals:false}),u=battle.units[0],initial={speed:u.speed,range:u.range,radius:u.radius,damage:u.atk};
 const short=locomotionStride(u.nativeActor.stride,0,0,u.nativeActor.id,{strideLength:50}),long=locomotionStride(u.nativeActor.stride,0,0,u.nativeActor.id,{strideLength:150});assert.ok(long>short*2);
 for(const value of [50,150,100]){battle.setTuning({strideLength:value});assert.ok(battle.units.every(c=>c.nativeActor.strideLength===value));assert.deepEqual({speed:u.speed,range:u.range,radius:u.radius,damage:u.atk},initial);}
 const sample=value=>{battle.setTuning({strideLength:value});u.velocityX=100;u.velocityY=0;u.px=u.x-2;u.py=u.y;u.nativeActor.gait=0;advanceNative(u,.02,1,false);return u.nativeActor.gait;};
 assert.ok(sample(50)>sample(150),'short steps use a faster cycle, even at the small-sprite cadence limit');
 setTuning({strideLength:150});const spec=pixelSpec('aurel'),wide=nativePoseRig(spec,{id:spec.id},'run',.1);setTuning({strideLength:50});const narrow=nativePoseRig(spec,{id:spec.id},'run',.1);setTuning({});
 assert.ok(Math.abs(wide.legs[0].end.x)>Math.abs(narrow.legs[0].end.x),'roster poses use the same slider');
});
