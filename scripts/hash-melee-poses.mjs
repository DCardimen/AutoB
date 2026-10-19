import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
const output={};
for(const id of MELEE_ARM_FAMILIES){const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++)for(const state of NATIVE_POSES)for(const phase of [.13,.49,.78]){const r=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,phase);r.artStage=stage;const pixels=paintCharacterPixels(r.id,r,dir*Math.PI/4);output[`${id}/${stage}/${dir}/${state}/${phase}`]=createHash('sha256').update(pixels).digest('hex');}}
const file='playtest-artifacts/layer-masters/pixel-baseline.json';
if(process.argv.includes('--compare')){const baseline=JSON.parse(fs.readFileSync(file,'utf8'));let unchanged=0,intentional=0;for(const [key,value]of Object.entries(output)){if(process.argv.includes('--rogue-cloth-review')&&key.startsWith('rogue/')){if(value!==baseline[key])intentional++;continue;}assert.equal(value,baseline[key],key);unchanged++;}console.log(JSON.stringify({unchangedCompletePoses:unchanged,intentionallyChangedRoguePoses:intentional,reason:intentional?'Blue cloak underpainting, source-only floor exclusion and individually registered boots; other families unchanged.':'Lossless layer packing'}));}else{fs.writeFileSync(file,JSON.stringify(output));console.log(`Frozen ${Object.keys(output).length} complete pose rasters before packing.`);}
