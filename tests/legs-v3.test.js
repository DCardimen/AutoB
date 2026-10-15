import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {auditLegConnections} from '../scripts/audit-legs-v3.mjs';

const natural=PIXEL_SPECIES.filter(s=>['wolf','mech','spider','crab','centipede'].includes(s.nativeRig));
const families=[...new Map(natural.map(s=>[s.nativeDesign||s.nativeRig,s])).values()];

test('13,056 rendered idle and gait poses introduce no detached lower-limb clusters',()=>{
 const report=auditLegConnections();
 fs.mkdirSync('playtest-artifacts',{recursive:true});fs.writeFileSync('playtest-artifacts/legs-v3-connectivity.json',JSON.stringify(report,null,2));
 assert.equal(report.count,13056);
 assert.equal(report.issueCount,0,JSON.stringify(report.issues.slice(0,10)));
});

test('natural bodies and legs use exactly the same authored palette through every form and facing',()=>{
 for(const spec of natural)for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'idle',.25),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
  const palette=new Set(rig.artLegSkin.palette.map(c=>c.slice(1).toLowerCase()));
  for(let i=0;i<4096;i++)if(pixels[i*4+3]){
   const color=[0,1,2].map(k=>pixels[i*4+k].toString(16).padStart(2,'0')).join('');
   assert.ok(palette.has(color),`${spec.id} ${evolution} ${dir}: ${color} is not in the authored palette`);
  }
  assert.equal(rig.artLegFaces,undefined,'no procedural replacement legs or resting claws');
 }
});

test('idle retains the authored stance and motion cannot exceed the source limb proportions',()=>{
 for(const spec of families)for(const evolution of [0,2])for(const state of ['idle','walk','sprint','attack'])for(const phase of [0,.25,.5,.75]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),before=structuredClone(rig.legs);
  paintCharacterPixels(rig.id,rig,Math.PI/4);
  assert.deepEqual(rig.legs,before,'art never changes combat IK or contacts');
  for(const limb of rig.artLegSkin.limbs){
   if(state==='idle')assert.deepEqual(limb.delta,{x:0,y:0},'resting feet do not spread or shuffle');
   assert.ok(Math.abs(limb.delta.x)<=5&&Math.abs(limb.delta.y)<=3.1,'travel is limited by the original limb length');
  }
 }
});

test('every evolved crab crown has a tapered top and clear cell margins',()=>{
 const spec=pixelSpec('mireclaw');
 for(const evolution of [1,2])for(let dir=0;dir<8;dir++)for(const phase of [0,.25,.75]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'idle',phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),rows=[];
  for(let y=0;y<64;y++){let count=0;for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3])count++;if(count)rows.push({y,count});}
  assert.ok(rows[0].y>=2&&rows.at(-1).y<=61,`${evolution} ${dir}: crown and feet have headroom`);
  assert.ok(rows[0].count<Math.max(...rows.slice(1,4).map(r=>r.count))*.8,`${evolution} ${dir}: top is tapered, not a flat crop (${rows[0].count})`);
 }
});

test('stride tuning remains visible in the authored limbs, including short many-legged anatomies',()=>{
 for(const id of ['mireclaw','cogwalker','runespider','crownstag']){
  const spec=pixelSpec(id),travel=[];
  for(const strideLength of [50,150]){
   let total=0;
   for(let step=0;step<16;step++){
    const rig=nativePoseRig(spec,{id,tuning:{strideLength}},'run',step/16);
    paintCharacterPixels(rig.id,rig,Math.PI/4);
    total+=rig.artLegSkin.limbs.reduce((sum,l)=>sum+Math.abs(l.delta.x),0);
   }
   travel.push(total);
  }
  assert.ok(travel[1]>travel[0]*1.15,`${id}: long strides should visibly exceed short strides (${travel})`);
 }
});

test('apex stag hooves end in separate warm toes instead of a moving blue ground platform',()=>{
 const spec=pixelSpec('crownstag');
 for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution:2,evolutionPath:'wild'},'idle',.25),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
  let bottom=0;for(let i=0;i<4096;i++)if(pixels[i*4+3])bottom=Math.max(bottom,Math.floor(i/64));
  let run=0;
  for(let x=0;x<64;x++){
   const i=(bottom*64+x)*4;
   if(!pixels[i+3]){run=0;continue;}
   assert.ok(++run<=10,`facing ${dir}: no continuous ground strip under the feet`);
   assert.ok(pixels[i+2]<=pixels[i],`facing ${dir}: hoof tips use warm authored material`);
  }
 }
});
