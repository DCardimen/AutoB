import test from 'node:test';
import assert from 'node:assert/strict';
import {authoredSourceFrame,paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {authoredParts,MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {PixelBrush,spritePoint} from '../prototype-pixel-art.js';

test('the marked cape folds, orange hems and coat tails remain clothing, not moving arms',()=>{
 // Original source coordinates, independently checked against the user's
 // marked front/SW knight and the other authored garments. PR66 extracted
 // every one of these into a moving forearm.
 const landmarks=[['knight',1,2,13,34,43],['knight',1,2,49,35,34],['knight',1,2,47,33,45],['knight',1,3,48,34,34],['knight',1,3,49,34,43],['knight',1,3,24,30,43],['knight',2,2,13,33,43],['knight',2,2,51,35,43],['goblin',1,3,46,31,31],['rogue',2,3,12,28,40],['rogue',2,3,13,28,39],['dwarf',2,3,45,34,42]];
 for(const [id,stage,dir,x,y,index]of landmarks){
  const source=authoredSourceFrame(id,dir,stage),parts=authoredParts(source,id,stage,dir),k=y*64+x,p=source.pixels.find(p=>p.x===x&&p.y===y);
  assert.equal(p.index,index);assert.ok(!parts.arms.mask.has(k),`${id}/${stage}/${dir}: clothing cannot travel with a cuff`);
  assert.equal(parts.body.find(p=>p.x===x&&p.y===y)?.index,index,'the original garment and its exact authored shade remain');
 }
});

test('all melee garment materials retain original source pixels and source-indexed underpainting in every facing',()=>{
 let original=0,background=0;
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const source=authoredSourceFrame(id,dir,stage),parts=authoredParts(source,id,stage,dir),body=new Map(parts.body.map(p=>[p.y*64+p.x,p]));
  for(const p of parts.clothing.pixels){const k=p.y*64+p.x;assert.ok(!parts.arms.mask.has(k),'cloth has no arm owner');assert.equal(body.get(k)?.index,p.index);assert.equal(p.color,source.colors[p.index]);original++;}
  for(const p of parts.clothing.repairs){assert.ok(p.clothingUnderlay);assert.ok(parts.clothing.materials.has(p.index));assert.equal(p.color,source.colors[p.index]);assert.ok(parts.arms.mask.has(p.y*64+p.x),'repair only the background exposed by a moving foreground limb');background++;}
  if(!['knight','goblin','rogue'].includes(id))assert.equal(parts.clothing.repairs.length,0,'a loincloth, scarf or vest is not a new cape');
 }
 assert.ok(original>10000);assert.ok(background>1000);console.log(JSON.stringify({originalGarmentPixels:original,hiddenGarmentPixels:background}));
});

test('original cloth and exposed garment backgrounds stay opaque through complete motion without an arm hiding a cutout',()=>{
 let poses=0,probes=0;
 for(const id of MELEE_ARM_FAMILIES){
  const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);
  for(let evolution=0;evolution<3;evolution++)for(const evolutionPath of ['wild','warden'])for(const state of NATIVE_POSES)for(const phase of [.13,.49,.78])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath},state,phase),brush=new PixelBrush(),angle=dir*Math.PI/4;rig.dir=dir;
   paintAtlasCharacter(brush,rig.id,rig,p=>spritePoint(p,angle));poses++;assert.equal(brush.clipped,0,'the complete clothed body fits');
   const clothes=[...rig.artParts.clothing.pixels,...rig.artParts.clothing.repairs];
   for(const p of clothes){const q=rig.artSourceProject(p.x,p.y),x=Math.round(q.x),y=Math.round(q.y);probes++;assert.equal(brush.data[(y*64+x)*4+3],255,`${id}/${evolution}/${evolutionPath}/${state}/${phase}/${dir}: garment cutout at ${p.x},${p.y}`);}
  }
 }
 console.log(JSON.stringify({clothedBodyPoses:poses,opaqueGarmentProbes:probes}));
});
