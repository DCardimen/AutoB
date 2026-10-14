import test from 'node:test';
import assert from 'node:assert/strict';
import {pixelSpec,PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {CREATURE_ATTACK_CATEGORIES} from '../creature-attacks.js';
import {nativeBladePoint} from '../native-combat.js';
import {Battle,makeRun,creature} from '../game.js';
import {creatureLegArt} from '../creature-leg-volume.js';
import {AUTHORED_SPRITES} from '../authored-sprite-data.js';
import {AUTHORED_BODIES} from '../authored-body-data.js';
import {AUTHORED_FAMILIES} from '../authored-family-data.js';
import {AUTHORED_LEGACY} from '../authored-legacy-data.js';

test('every multi-legged family has a shaded closed model for every walking leg',()=>{
 for(const spec of PIXEL_SPECIES.filter(s=>['wolf','spider','mech','crab','centipede'].includes(s.nativeRig)))for(const evolution of [0,1,2]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'run',.3),before=structuredClone(rig.legs);
  const pixels=paintCharacterPixels(spec.nativeRig,rig,Math.PI/4);
  assert.equal(rig.artLegVolumes.length,rig.legs.length,spec.id);
  assert.equal(rig.legs.length,spec.nativeDesign==='mantis'?4:spec.nativeRig==='wolf'?4:spec.nativeRig==='mech'?6:spec.nativeRig==='centipede'?12:8);
  for(const volume of rig.artLegVolumes){
   const faces=rig.artLegFaces.filter(f=>f.leg===volume.index);
   assert.ok(faces.length>=200,'closed thigh, calf, knee and foot surfaces');
   assert.ok(faces.some(f=>['paw','hoof','plate-foot','tip'].includes(f.part)));
   assert.ok(Math.max(...faces.map(f=>f.brightness))-Math.min(...faces.map(f=>f.brightness))>.3);
   assert.ok(faces.every(f=>f.vertices.every(v=>Number.isFinite(v.depth))));
  }
  assert.deepEqual(rig.legs,before,'painting does not move anatomical joints');assert.equal(pixels.clipped,0,spec.id+' evolved legs');
 }
});
test('all natural attack categories are distinct and attack poses remain inside the sprite in every facing',()=>{
 assert.equal(new Set(Object.values(CREATURE_ATTACK_CATEGORIES)).size,Object.keys(CREATURE_ATTACK_CATEGORIES).length);
 const designs=new Set();
 for(const spec of PIXEL_SPECIES){if(designs.has(spec.nativeDesign)||!CREATURE_ATTACK_CATEGORIES[spec.nativeDesign])continue;designs.add(spec.nativeDesign);
  for(const evolution of [0,1,2])for(const phase of [.12,.34,.49,.58,.95])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:evolution===1?'warden':'wild'},'attack',phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
   assert.equal(rig.creatureAttack.category,CREATURE_ATTACK_CATEGORIES[spec.nativeDesign]);
   assert.equal(pixels.clipped,0,`${spec.id} ${evolution} attack ${phase} facing ${dir}: ${JSON.stringify(pixels.clipSamples)}`);
  }
 }
 assert.ok(designs.size>=25);
});
test('canine jaws open before impact, snap at contact, close on recovery and stay hidden on rear views',()=>{
 const spec=pixelSpec('emberhound'),ready=nativePoseRig(spec,{id:spec.id},'attack',.34),contact=nativePoseRig(spec,{id:spec.id},'attack',.5),rest=nativePoseRig(spec,{id:spec.id},'attack',.99);
 assert.ok(ready.creatureAttack.jaw>5);assert.ok(contact.creatureAttack.jaw<ready.creatureAttack.jaw*.25);assert.equal(rest.creatureAttack.jaw,0);
 assert.ok(contact.creatureAttack.contact.x>ready.creatureAttack.contact.x+10);
 for(let dir=0;dir<8;dir++){const rig=nativePoseRig(spec,{id:spec.id},'attack',.34);paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);assert.equal(Boolean(rig.artJawOpen),dir<5);}
});
test('mantises have four walking legs and two separate scythes with a wide crossing slash',()=>{
 const spec=pixelSpec('orchimantis'),ready=nativePoseRig(spec,{id:spec.id},'attack',.34),contact=nativePoseRig(spec,{id:spec.id},'attack',.5);
 assert.equal(ready.legs.length,4);assert.equal(ready.creatureAppendages.length,2);assert.ok(ready.creatureAppendages.every(a=>a.kind==='scythe'));
 for(const rig of [ready,contact])for(const arm of rig.creatureAppendages){const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);assert.ok(Math.abs(length(arm.root,arm.joint)-22)<1e-6);assert.ok(Math.abs(length(arm.joint,arm.end)-20)<1e-6);}
 for(let i=0;i<2;i++){assert.ok(contact.creatureAppendages[i].tip.x>ready.creatureAppendages[i].tip.x+20);assert.ok(contact.creatureAppendages[i].end.z<ready.creatureAppendages[i].end.z-8);}
});
test('crabs pinch, cats rake, horned creatures ram, and segmented predators use mandibles',()=>{
 const pose=id=>nativePoseRig(pixelSpec(id),{id},'attack',.49);
 assert.ok(pose('mireclaw').creatureAppendages.every(a=>a.kind==='pincer'));
 assert.ok(pose('ironscolopendra').creatureAppendages.every(a=>a.kind==='fang'));
 const cat=pose('nightmaw'),rest=nativePoseRig(pixelSpec('nightmaw'),{id:'nightmaw'},'idle',.25);
 assert.ok(cat.legs.some((l,i)=>l.front&&l.end.x>rest.legs[i].end.x+15));
 assert.notEqual(pose('pyrehorn').creatureAttack.category,pose('crownstag').creatureAttack.category);
});
test('natural attacks use their animated tips for physical hits and never apply duplicate contact damage',()=>{
 for(const id of ['emberhound','orchimantis','runespider','nightmaw','frostursa','mireclaw','crownstag']){
  const run=makeRun(31,['aurel']);run.team=[creature(id)];run.relics=[];const b=new Battle(run,[creature('aurel')],31,{visuals:false}),[u,t]=b.units;
  u.x=400;u.y=400;t.x=410;t.y=400;t.shield=t.armor=0;const strike=b.beginStrike(u,t,u.loadout.auto),before=t.hp;
  b.nativeContact(strike,0,.6);assert.equal(t.hp,before,'no hit during anticipation');
  b.nativeContact(strike,.72,1);assert.equal(strike.hitUids.length,1,id+' connects');const after=t.hp;assert.ok(after<before);
  b.nativeContact(strike,.72,1);assert.equal(t.hp,after,'one damage application per victim');
  const rig=nativePoseRig(pixelSpec(id),{id},'attack',.5),tip=nativeBladePoint(u,strike,1);assert.ok(Number.isFinite(tip.z));assert.ok(rig.creatureAttack.contact);
 }
});
test('painted feet are removed and the single solid leg set ends at the original soles',()=>{
 const atlases={...AUTHORED_SPRITES,...AUTHORED_BODIES,...AUTHORED_FAMILIES,...AUTHORED_LEGACY};
 for(const [id,identity]of [['emberhound','wolf'],['orchimantis','mantis'],['mireclaw','crab'],['runespider','spider'],['onyxscarab','beetle'],['ironscolopendra','centipede']])for(let dir=0;dir<8;dir++){
  const atlas=atlases[identity],colors=atlas.palette.map(c=>'#'+c),pixels=[];
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const index=parseInt(atlas.frames[dir].slice((y*64+x)*2,(y*64+x)*2+2),16);if(index)pixels.push({x,y,index,rgb:colors[index].slice(1).match(/../g).map(c=>parseInt(c,16))});}
  const spec=pixelSpec(id),rig=nativePoseRig(spec,{id},'idle',.25);rig.dir=dir;
  const art=creatureLegArt({pixels},rig,colors),lastRow=pixels.filter(p=>p.y===art.bottom);
  assert.ok(lastRow.every(p=>art.mask.has(p.y*64+p.x)),id+' must remove the original painted sole pixels');
  paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  assert.ok(Math.max(...rig.artLegFaces.flatMap(f=>f.vertices.map(v=>v.y)))<=rig.artLegRegistration.soleY+2.2,id+' models must not hang below the old feet');
 }
});
test('registered legs stay inside the cell during movement, dodges and falls',()=>{
 for(const id of ['emberhound','orchimantis','mireclaw','runespider','onyxscarab','ironscolopendra'])for(const evolution of [0,2])for(const state of ['run','dodge','death','knockdown','getup'])for(const dir of [0,2,4,6]){
  const spec=pixelSpec(id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,.5),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
  assert.equal(pixels.clipped,0,`${id} ${evolution} ${state} ${dir}`);
 }
});
