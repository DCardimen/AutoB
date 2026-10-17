import test from 'node:test';
import assert from 'node:assert/strict';
import {ARM_ANATOMY,NATURAL_ANATOMY,naturalHeadWeight} from '../companion-anatomy.js';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {states} from '../scripts/animation-contract.mjs';

test('painted natural heads and necks retain positive area through every facing, form and motion state',()=>{
 let poses=0,quads=0,minArea=Infinity;
 for(const [identity,anatomy]of Object.entries(NATURAL_ANATOMY)){
  const design=identity==='fairy'?'faerie':identity,spec=PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design);assert.ok(spec,identity);
  for(let evolution=0;evolution<3;evolution++)for(let dir=0;dir<8;dir++){
   const artStage=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'idle',.25).artStage??evolution;
   const source=authoredSourceFrame(identity,dir,artStage),grid=new Set(source.pixels.map(p=>p.y*64+p.x));
   const patches=source.pixels.filter(p=>p.x<63&&p.y<63&&p.y<=anatomy.heads[artStage][3]&&naturalHeadWeight(identity,artStage,dir,p.x,p.y)>=.05&&grid.has(p.y*64+p.x+1)&&grid.has((p.y+1)*64+p.x));
   assert.ok(patches.length,identity+': visible head/neck samples');
   for(const state of states)for(const phase of [.2,.45,.8]){
    const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);assert.equal(pixels.clipped,0);poses++;
    for(const p of patches){
     const a=rig.artSourceProject(p.x,p.y),b=rig.artSourceProject(p.x+1,p.y),c=rig.artSourceProject(p.x,p.y+1);
     const area=((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/(rig.artSourceTransform.fit**2);quads++;minArea=Math.min(minArea,area);
     assert.ok(area>0,`${identity} form ${evolution} dir ${dir} ${state} ${phase} source ${p.x},${p.y}: painted skin folded (${area})`);
    }
   }
  }
 }
 console.log(JSON.stringify({naturalFamilies:Object.keys(NATURAL_ANATOMY).length,poses,quads,minArea}));
});

test('humanoid head and collar skin retains positive area through every form, facing and motion',()=>{
 let poses=0,quads=0,minArea=Infinity;
 for(const identity of Object.keys(ARM_ANATOMY)){
  const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>s.nativeDesign===identity);assert.ok(spec);
  for(let evolution=0;evolution<3;evolution++)for(let dir=0;dir<8;dir++){
   const artStage=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'idle',.25).artStage??evolution,source=authoredSourceFrame(identity,dir,artStage),neck=ARM_ANATOMY[identity][artStage].neck,grid=new Set(source.pixels.map(p=>p.y*64+p.x));
   const patches=source.pixels.filter(p=>p.x<63&&p.y<=neck+2&&grid.has(p.y*64+p.x+1)&&grid.has((p.y+1)*64+p.x));
   for(const state of states)for(const phase of [.2,.45,.8]){
    const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);assert.equal(pixels.clipped,0);poses++;
    for(const p of patches){const a=rig.artSourceProject(p.x,p.y),b=rig.artSourceProject(p.x+1,p.y),c=rig.artSourceProject(p.x,p.y+1),area=((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/(rig.artSourceTransform.fit**2);quads++;minArea=Math.min(minArea,area);assert.ok(area>0,`${identity} ${evolution} ${dir} ${state} ${phase} ${p.x},${p.y}: collar folded (${area})`);}
   }
  }
 }
 console.log(JSON.stringify({humanoidFamilies:12,poses,quads,minArea}));
});

test('limbless and flying bodies retain a visible fall instead of remaining upright',()=>{
 for(const identity of ['serpent','fairy']){
  const design=identity==='fairy'?'faerie':identity,spec=PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design);
  const rig=nativePoseRig(spec,{id:spec.id,evolution:1,evolutionPath:'wild'},'death',.8),pixels=paintCharacterPixels(spec.nativeRig,rig,Math.PI/4);
  const a=rig.artSourceProject(30,29),b=rig.artSourceProject(30,35);
  assert.ok(Math.abs(b.x-a.x)>Math.abs(b.y-a.y)*.5,identity+': torso falls instead of remaining upright');assert.equal(pixels.clipped,0);
 }
});

test('natural fall silhouettes settle progressively without spinning or jumping on entry',()=>{
 for(const identity of ['serpent','fairy','wolf','crab'])for(let dir=0;dir<8;dir++){
  const design=identity==='fairy'?'faerie':identity,spec=PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design);let previous=0;
  for(const phase of [0,.02,.05,.1,.25,.5,.8,1]){
   const rig=nativePoseRig(spec,{id:spec.id,evolution:1,evolutionPath:'wild'},'death',phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4),tilt=Math.abs(rig.artSourceTransform.fallAngle);
   assert.ok(tilt>=previous-1e-10&&tilt<Math.PI/2,identity+': coherent fall arc');if(phase===0)assert.equal(tilt,0);if(phase===.02)assert.ok(tilt<.02,identity+': no first-frame flip');assert.equal(pixels.clipped,0);previous=tilt;
  }
 }
});

test('rooted mushroom caps preserve their painted width instead of inheriting jelly squash',()=>{
 const spec=PIXEL_SPECIES.find(s=>s.nativeDesign==='mushroom'&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>s.nativeDesign==='mushroom');
 for(let evolution=0;evolution<3;evolution++)for(let dir=0;dir<8;dir++){
  const source=authoredSourceFrame('mushroom',dir,evolution),rows=new Map();
  for(const p of source.pixels)if(p.y<25&&p.rgb[0]>p.rgb[1]*1.5&&p.rgb[0]>p.rgb[2]*1.5){if(!rows.has(p.y))rows.set(p.y,[]);rows.get(p.y).push(p);}
  const row=[...rows.values()].sort((a,b)=>(Math.max(...b.map(p=>p.x))-Math.min(...b.map(p=>p.x)))-(Math.max(...a.map(p=>p.x))-Math.min(...a.map(p=>p.x))))[0];assert.ok(row);
  const left=row.reduce((a,b)=>a.x<b.x?a:b),right=row.reduce((a,b)=>a.x>b.x?a:b);
  for(const [state,phase]of [['idle',.25],['idle',.75],['death',.8]]){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase);paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);const a=rig.artSourceProject(left.x,left.y),b=rig.artSourceProject(right.x,right.y),width=Math.hypot(b.x-a.x,b.y-a.y)/(rig.artSourceTransform.fit*rig.artSourceTransform.scale.width);
   assert.ok(Math.abs(width-(right.x-left.x))<.2,'painted cap retains its source width');
  }
 }
});
