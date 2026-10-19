import test from 'node:test';
import assert from 'node:assert/strict';
import {authoredSourceFrame,paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {authoredParts,MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {PixelBrush,spritePoint} from '../prototype-pixel-art.js';

test('independently marked cape folds, orange hems and coat tails retain their original owner and shade',()=>{
 const landmarks=[['knight',1,2,13,34,43],['knight',1,2,49,35,34],['knight',1,2,47,33,45],['knight',1,3,48,34,34],['knight',1,3,49,34,43],['knight',1,3,24,30,43],['knight',2,2,13,33,43],['knight',2,2,51,35,43],['goblin',1,3,46,31,31],['dwarf',2,3,45,34,42]];
 for(const [id,stage,dir,x,y,index]of landmarks){const source=authoredSourceFrame(id,dir,stage),parts=authoredParts(source,id,stage,dir),k=y*64+x,p=source.pixels.find(p=>p.x===x&&p.y===y),owner=parts.ownership.get(k);assert.equal(p.index,index);assert.ok(!parts.arms.mask.has(k));assert.equal(parts.layers[owner].find(p=>p.x===x&&p.y===y)?.index,index);}
 // The old fixture called these gray pixels "cape" by material. The SW
 // source-grid review locates them on the OUTLINE OF THE FORWARD GLOVE;
 // Sable's trailing cloak is on the opposite (right) side in this facing.
 const sable=authoredParts(authoredSourceFrame('rogue',3,2),'rogue',2,3);
 for(const [x,y,index]of [[12,28,40],[13,28,39]]){assert.ok(sable.arms.mask.has(y*64+x));assert.equal(sable.arms.profiles.get(-1).grid.get(y*64+x).index,index);}
});

test('all original visible pixels retain an explicit saved owner, and moving limbs have no frozen source copy',()=>{
 let original=0,background=0;
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const source=authoredSourceFrame(id,dir,stage),parts=authoredParts(source,id,stage,dir);assert.ok(parts.authoredLayers);
  for(const p of source.pixels){const k=p.y*64+p.x,owner=parts.ownership.get(k),pixel=parts.layers[owner]?.find(q=>q.x===p.x&&q.y===p.y);assert.equal(pixel?.index,p.index);assert.equal(pixel.color,source.colors[p.index]);original++;}
  for(const arm of parts.arms.profiles.values())if(!arm.occluded)for(const p of arm.pixels)for(const still of parts.body.filter(q=>q.x===p.x&&q.y===p.y))assert.ok(still.bodyUnderlay,'a separate reconstructed body/cape may sit here; the source limb may not');
  for(const p of parts.clothing.repairs){assert.ok(p.clothingUnderlay);assert.equal(p.color,source.colors[p.index]);assert.ok(parts.clothing.materials.has(p.index));background++;}
 }
 assert.ok(original>100000);assert.ok(background>1000);console.log(JSON.stringify({originalVisiblePixels:original,hiddenGarmentPixels:background}));
});

test('complete independent torso and cape surfaces remain opaque with arms hidden in every actual art form and full motion cycle',()=>{
 let poses=0,probes=0;
 for(const id of MELEE_ARM_FAMILIES){const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);
  for(let stage=0;stage<3;stage++)for(const evolutionPath of ['wild','warden'])for(const state of NATIVE_POSES)for(const phase of [.13,.49,.78])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath},state,phase),brush=new PixelBrush(),angle=dir*Math.PI/4;rig.dir=dir;rig.artStage=stage;
   paintAtlasCharacter(brush,rig.id,rig,p=>spritePoint(p,angle));poses++;assert.equal(brush.clipped,0);assert.equal(rig.artStage,stage,'review the requested art, including unused authored mature forms');
   for(const [name,pixels]of [['body',rig.artParts.underbody],['cape-back',rig.artParts.layers['cape-back']],['cape-front',rig.artParts.layers['cape-front']]])for(const p of pixels){const q=rig.artLayerProject(name,p.x,p.y),x=Math.round(q.x),y=Math.round(q.y);probes++;assert.equal(brush.data[(y*64+x)*4+3],255,`${id}/${stage}/${state}/${phase}/${dir}: ${name} hole at ${p.x},${p.y}`);}
  }
 }assert.equal(poses,17136);assert.ok(probes>5000000);console.log(JSON.stringify({clothedBodyPoses:poses,opaqueSurfaceProbes:probes}));
});
