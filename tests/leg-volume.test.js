import test from 'node:test';
import assert from 'node:assert/strict';
import {pixelSpec} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels,spritePoint} from '../prototype-pixel-art.js';
import {paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {paintLegVolumes} from '../leg-volume.js';

// Exercise the legacy solid-volume diagnostic explicitly; production sprites
// now use their complete authored legs and boots.
const volumeRig=(...args)=>Object.assign(nativePoseRig(...args),{debugLegVolumes:true});

test('the near leg hides the far leg independently of face submission order',()=>{
 const triangle=(leg,depth,color)=>({leg,color,vertices:[{x:20,y:20,depth},{x:27,y:20,depth},{x:20,y:27,depth}]}),far=triangle(0,0,'#553322'),near=triangle(1,4,'#ccaa77');
 for(const faces of [[far,near],[near,far]]){
  const dots=new Map(),brush={dot:(x,y,color)=>dots.set(`${x},${y}`,color)},rig={artLegFaces:faces};
  paintLegVolumes(brush,rig);assert.equal(dots.get('22,22'),'#ccaa77');assert.equal(rig.artLegDepth[22*64+22],4);
 }
});

test('diagnostic humanoid volumes retain solid thigh, knee, calf, boot and sole surfaces in every view',()=>{
 for(const id of ['brakk','aurel','brom','tarka','syl','nyra'])for(const evolution of [0,1,2])for(const state of ['idle','walk','run','sprint'])for(let dir=0;dir<8;dir++){
  const spec=pixelSpec(id),rig=volumeRig(spec,{id,evolution,evolutionPath:'wild'},state,.25),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  assert.equal(rig.artLegVolumes.length,2);
  for(let index=0;index<2;index++){
   const faces=rig.artLegFaces.filter(f=>f.leg===index),vertices=faces.flatMap(f=>f.vertices);
   assert.deepEqual(new Set(faces.map(f=>f.part)),new Set(['thigh','calf','knee','boot','sole']));
   assert.ok(Math.max(...vertices.map(v=>v.depth))-Math.min(...vertices.map(v=>v.depth))>2,'real thickness along camera depth');
   assert.ok(Math.max(...faces.map(f=>f.brightness))-Math.min(...faces.map(f=>f.brightness))>.3,'surface lighting turns around the volume');
   assert.ok(rig.artLegVolumes[index].radius>=1.8,'chunky silhouette across facings');
  }
  assert.equal(pixels.clipped,0,`${id} ${evolution} ${state} ${dir}`);
 }
});

test('boot yaw changes its toe, side and sole projection without shifting the leg joints',()=>{
 const spec=pixelSpec('brakk'),a=volumeRig(spec,{id:'brakk'},'walk',.3),b=structuredClone(a);
 b.legs[0].foot.angle=Math.PI/2;
 paintCharacterPixels('orc',a,Math.PI/4);paintCharacterPixels('orc',b,Math.PI/4);
 assert.deepEqual(a.artLegVolumes.map(l=>[l.hip,l.knee,l.ankle]),b.artLegVolumes.map(l=>[l.hip,l.knee,l.ankle]));
 const boots=r=>r.artLegFaces.filter(f=>f.leg===0&&f.part==='boot').map(f=>f.vertices);
 assert.notDeepEqual(boots(a),boots(b),'a solid boot turns around its ankle');
});

test('rendering thick legs preserves anatomical joints and planted foot physics',()=>{
 for(const id of ['aurel','brakk','syl','nyra','brom','tarka'])for(const state of ['walk','run','sprint','dodge','attack'])for(const phase of [.1,.43,.8]){
  const spec=pixelSpec(id),rig=volumeRig(spec,{id},state,phase),before=structuredClone(rig.legs);
  paintCharacterPixels(spec.nativeRig,rig,Math.PI/4);assert.deepEqual(rig.legs,before,'rendering must not move the simulation foot anchors');
 }
});

test('leg proportions follow the short and tall character-height settings',()=>{
 for(const id of ['aurel','brakk','brom','tarka','syl','nyra']){
  const spec=pixelSpec(id),short=volumeRig(spec,{id},'idle',.25,.85),tall=volumeRig(spec,{id},'idle',.25,1.1);
  paintCharacterPixels(spec.nativeRig,short,Math.PI/2);paintCharacterPixels(spec.nativeRig,tall,Math.PI/2);
  for(let i=0;i<2;i++){
   const length=l=>Math.hypot(l.ankle.x-l.hip.x,l.ankle.y-l.hip.y);
   assert.ok(length(tall.artLegVolumes[i])>length(short.artLegVolumes[i])*1.15,id+' leg height follows the body');
  }
 }
});

test('the body remains filled at the hips when the leg mesh is hidden',()=>{
 class BodyBrush{
  constructor(){this.data=new Uint8ClampedArray(64*64*4);}
  dot(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&x<64&&y>=0&&y<64)this.data.set([...c.slice(1).match(/../g).map(v=>parseInt(v,16)),255],(y*64+x)*4);}
  rect(x,y,w,h,c){for(let j=Math.round(y);j<Math.round(y+h);j++)for(let i=Math.round(x);i<Math.round(x+w);i++)this.dot(i,j,c);}
  line(a,z,c){const n=Math.max(1,Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)*2));for(let i=0;i<=n;i++)this.dot(a.x+(z.x-a.x)*i/n,a.y+(z.y-a.y)*i/n,c);}
 }
 let checks=0;
 for(const id of ['aurel','brakk','brom','tarka'])for(const phase of [.1,.4,.8])for(const dir of [1,2,3]){
  const spec=pixelSpec(id),rig=volumeRig(spec,{id},'run',phase),brush=new BodyBrush();rig.dir=dir;
  paintAtlasCharacter(brush,spec.nativeRig,rig,q=>spritePoint(q,dir*Math.PI/4));
  for(const p of rig.artHipRepairs){assert.equal(brush.data[(Math.round(p.y)*64+Math.round(p.x))*4+3],255,'covered pelvis detail survives leg motion');checks++;}
 }
 assert.ok(checks>100);
});
