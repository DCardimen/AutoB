import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {AUTHORED_SPRITES as H0} from '../authored-sprite-data.js';
import {AUTHORED_SPRITES_STAGE1 as H1} from '../authored-sprite-stage1-data.js';
import {AUTHORED_SPRITES_STAGE2 as H2} from '../authored-sprite-stage2-data.js';
import {AUTHORED_BODIES as B0} from '../authored-body-data.js';
import {AUTHORED_BODIES_STAGE1 as B1} from '../authored-body-stage1-data.js';
import {AUTHORED_BODIES_STAGE2 as B2} from '../authored-body-stage2-data.js';
import {AUTHORED_FAMILIES as F0} from '../authored-family-data.js';
import {AUTHORED_FAMILIES_STAGE1 as F1} from '../authored-family-stage1-data.js';
import {AUTHORED_FAMILIES_STAGE2 as F2} from '../authored-family-stage2-data.js';
import {AUTHORED_LEGACY as L0} from '../authored-legacy-data.js';
import {AUTHORED_LEGACY_STAGE1 as L1} from '../authored-legacy-stage1-data.js';
import {AUTHORED_LEGACY_STAGE2 as L2} from '../authored-legacy-stage2-data.js';
import {NATIVE_SPECIES,PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {LEGACY_PIXEL_SPECIES} from '../pixel-legacy.js';
import {nativePoseRig} from '../native-poses.js';
import {nativeRigFor,grandDesign} from '../grand-designs.js';
import {paintCharacterPixels,spritePoint} from '../prototype-pixel-art.js';
const stages=[{...H0,...B0,...F0},{...H1,...B1,...F1},{...H2,...B2,...F2}],hash=p=>createHash('sha256').update(p).digest('hex');
test('29 complete juvenile, mature and apex identities retain eight distinct full-cell facings',()=>{
 assert.equal(Object.keys(stages[0]).length,29);
 for(const id of Object.keys(stages[0])){
  const designs=[];
  for(let stage=0;stage<3;stage++){
   const a=stages[stage][id];assert.ok(a,id+' stage '+stage);assert.equal(a.frames.length,8);assert.equal(new Set(a.frames).size,8,id+' eight directions');assert.equal(a.weaponless,true);
   for(const frame of a.frames){assert.equal(frame.length,8192);let opaque=0;for(let i=0;i<4096;i++){const index=parseInt(frame.slice(i*2,i*2+2),16);assert.ok(index<a.palette.length);if(index)opaque++;}assert.ok(opaque>100,id+' full body');}
   designs.push(hash(a.frames.join('')));
  }assert.equal(new Set(designs).size,3,id+' needs three complete designs');
 }
});
test('evolution preserves species anatomy and never substitutes extra heads for a new stage',()=>{
 for(const spec of NATIVE_SPECIES)for(const evolution of [1,2]){const c={id:spec.id,evolution,evolutionPath:'wild'},g=grandDesign(spec,c);assert.equal(nativeRigFor(spec,c),spec.nativeRig,spec.id);assert.equal(g.extraHeads,undefined);const rig=nativePoseRig(spec,c);assert.equal(rig.artStage,spec.evolutionLimit===1?2:evolution);}
});
test('older collection names retain their actual anatomy and complete developmental art',()=>{
 for(const [id,design]of Object.entries({thornstag:'stag',veilspider:'spider',wickmoth:'moth',coalcrab:'crab',canopyowl:'owl',sparkhare:'rabbit',pearlsquid:'squid',brineclam:'clam',lumenjelly:'jelly'}))assert.equal(LEGACY_PIXEL_SPECIES.find(s=>s.id===id).nativeDesign,design);
 assert.equal(new Set(LEGACY_PIXEL_SPECIES.map(s=>s.id)).size,60);
 for(const id of Object.keys(L0)){assert.equal(new Set([L0,L1,L2].map(a=>a[id].frames.join(''))).size,3);for(const data of [L0,L1,L2]){assert.equal(data[id].frames.length,8);assert.equal(new Set(data[id].frames).size,8);for(const frame of data[id].frames)assert.equal(frame.length,8192);}}
});
function opaqueNear(pixels,p){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=Math.round(p.x)+dx,y=Math.round(p.y)+dy;if(x>=0&&x<64&&y>=0&&y<64&&pixels[(y*64+x)*4+3])return y*64+x;}return -1;}
function component(pixels,start){const seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++){const n=queue[i],x=n%64,y=Math.floor(n/64);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*64+xx;if(xx<0||xx>=64||yy<0||yy>=64||seen.has(k)||!pixels[k*4+3])continue;seen.add(k);queue.push(k);}}return seen;}
test('visible hands remain joined to shoulders at the actual weapon and shield grips',()=>{
 for(const id of PIXEL_SPECIES.filter(s=>['knight','orc','elf','caster','fox'].includes(s.nativeRig)).map(s=>s.id))for(const evolution of [0,1,2])for(const state of ['idle','walk','run','attack','cast'])for(const phase of [.25,.8])for(let dir=0;dir<8;dir++){
  const spec=pixelSpec(id),c={id,evolution,evolutionPath:'wild'},rig=nativePoseRig(spec,c,state,phase),angle=dir*Math.PI/4,pixels=paintCharacterPixels(nativeRigFor(spec,c),rig,angle);
  for(const arm of rig.arms){const end=rig.artProject(arm.end),root=rig.artArmRoots[arm.side],start=opaqueNear(pixels,end),goal=opaqueNear(pixels,root);assert.ok(start>=0&&goal>=0,`${id} ${evolution} ${state} ${dir}: visible arm endpoints`);const connected=component(pixels,start);assert.ok(connected.has(goal),`${id} ${state} ${dir}: connected shoulder/hand`);const torso=opaqueNear(pixels,rig.artAnchors.body);assert.ok(torso>=0&&connected.has(torso),`${id} ${evolution} ${state} ${dir}: arm connected to torso`);}
  for(const held of [rig.weapon,rig.shield].filter(Boolean))assert.ok(opaqueNear(pixels,(held===rig.shield?rig.artShieldProject(held.grip):rig.artProject(held.grip)))>=0,id+' held grip');
 }
});
test('hair and textured cape move independently while the face and body pose remain fixed',()=>{
 const spec=pixelSpec('nyra'),rig=nativePoseRig(spec,{id:'nyra'},'idle',.25),a=structuredClone(rig),b=structuredClone(rig);a.phase=.1;b.phase=.6;
 const A=paintCharacterPixels('caster',a,Math.PI/4),B=paintCharacterPixels('caster',b,Math.PI/4);assert.notEqual(hash(A),hash(B),'flowing hair');
 const changed=structuredClone(rig);for(const col of changed.capeMesh)for(let row=2;row<col.length;row++)col[row].x+=12*(row/(col.length-1));
 assert.notEqual(hash(paintCharacterPixels('caster',structuredClone(rig),Math.PI*1.5)),hash(paintCharacterPixels('caster',changed,Math.PI*1.5)),'cloth skin follows the physical cape');
});
