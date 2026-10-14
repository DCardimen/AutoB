import test from 'node:test';
import assert from 'node:assert/strict';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativePosePixels} from '../native-poses.js';

// Ordinary boots change movement stats, never the outfit, fur or skin palette.
test('equipping boots never dyes the lower half of an authored creature',()=>{
 for(const {id} of PIXEL_SPECIES)for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  const spec=pixelSpec(id),c={id,evolution,evolutionPath:'wild'},plain=nativePosePixels(spec,c,'idle',.25,dir),equipped=nativePosePixels(spec,{...c,equipment:['windstep-boots']},'idle',.25,dir);
  assert.deepEqual(equipped,plain,`${id}, stage ${evolution}, direction ${dir}: ordinary equipment must preserve authored colors`);
 }
});

import {authoredMaterialColors} from '../authored-sprite-renderer.js';
import {AUTHORED_SPRITES as H0} from '../authored-sprite-data.js';
import {AUTHORED_SPRITES_STAGE1 as H1} from '../authored-sprite-stage1-data.js';
import {AUTHORED_SPRITES_STAGE2 as H2} from '../authored-sprite-stage2-data.js';
import {AUTHORED_FAMILIES as F0} from '../authored-family-data.js';
import {AUTHORED_FAMILIES_STAGE1 as F1} from '../authored-family-stage1-data.js';
import {AUTHORED_FAMILIES_STAGE2 as F2} from '../authored-family-stage2-data.js';
import {AUTHORED_LEGACY as L0} from '../authored-legacy-data.js';
import {AUTHORED_LEGACY_STAGE1 as L1} from '../authored-legacy-stage1-data.js';
import {AUTHORED_LEGACY_STAGE2 as L2} from '../authored-legacy-stage2-data.js';
import {AUTHORED_BODIES as B0} from '../authored-body-data.js';
import {AUTHORED_BODIES_STAGE1 as B1} from '../authored-body-stage1-data.js';
import {AUTHORED_BODIES_STAGE2 as B2} from '../authored-body-stage2-data.js';
import {nativePoseRig} from '../native-poses.js';
const stages=[{...H0,...F0,...L0,...B0},{...H1,...F1,...L1,...B1},{...H2,...F2,...L2,...B2}];

test('native designs and their complete evolved art keep their exact authored swatches with equipment',()=>{
 for(const [stage,atlases]of stages.entries())for(const [identity,art]of Object.entries(atlases)){
  const colors=art.palette.map(c=>'#'+c),rig={form:stage,equipment:['sunsteel-edge','mooncloth-mantle'],palette:{skin:['#ff00ff','#ff00ff','#ff00ff'],cloth:['#00ffff','#00ffff','#00ffff']}};
  assert.deepEqual(authoredMaterialColors(identity,colors,rig),colors,identity+' stage '+stage);
 }
});

test('variant colors are independent of equipment; white fur, eyes, hair and skin keep their authored accents',()=>{
 for(const id of ['mossguard','glacier','lunacrest','canopyowl','floebear','bloomkin','riptalon'])for(let stage=0;stage<3;stage++){
  const spec=pixelSpec(id),plain=nativePoseRig(spec,{id,evolution:stage,evolutionPath:'wild'}),equipped=nativePoseRig(spec,{id,evolution:stage,evolutionPath:'wild',equipment:['mooncloth-mantle','sunsteel-edge']}),identity=spec.nativeDesign==='faerie'?'fairy':spec.nativeDesign,art=stages[stage][identity],colors=art.palette.map(c=>'#'+c),mapped=authoredMaterialColors(identity,colors,plain);
  assert.deepEqual(authoredMaterialColors(identity,colors,equipped),mapped,id+' equipment must not change the species palette');
  colors.forEach((color,i)=>{const rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16));if(Math.min(...rgb)>230||Math.max(...rgb)<30)assert.equal(mapped[i],color,id+' white accents and dark pupils');});
 }
 const colors=['#000000','#fff6e3','#fcd9b6','#e6ded3','#718e38'];
 const fairy=authoredMaterialColors('fairy',colors,{artVariant:'bloomkin',artVariantPalette:{cloth:['#203f58','#527c9c','#9fd4d6']}});
 assert.deepEqual(fairy.slice(0,4),colors.slice(0,4),'outlines, white highlights, warm face and pale hair');assert.notEqual(fairy[4],colors[4],'whole green costume material still varies');
});

test('elemental variants color both upper and lower body through all eight facings and three forms',()=>{
 for(const id of ['glacier','lunacrest','canopyowl'])for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++)for(const state of ['idle','run','attack']){
  const pixels=nativePosePixels(pixelSpec(id),{id,evolution,evolutionPath:'wild'},state,.25,dir),occupied=[];
  for(let i=0;i<4096;i++)if(pixels[i*4+3])occupied.push(Math.floor(i/64));
  const split=(Math.min(...occupied)+Math.max(...occupied))/2,counts=[0,0];
  for(let i=0;i<4096;i++){const [r,g,b,a]=pixels.subarray(i*4,i*4+4);if(!a)continue;const primary=id==='canopyowl'?g>r*1.08&&g>b*1.05:b>g*.95&&b>r*1.15&&g>r*1.1;if(primary)counts[Math.floor(i/64)<split?0:1]++;}
  assert.ok(counts[0]>=12&&counts[1]>=12,`${id} ${evolution} ${dir} ${state}: both halves must carry the variant material (${counts})`);
 }
});
