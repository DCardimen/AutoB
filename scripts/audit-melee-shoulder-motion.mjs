import fs from 'node:fs';
import assert from 'node:assert/strict';
import {MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {fingerprint,runtimeFiles} from './animation-contract.mjs';
let poses=0,maxStep=0,worst;const inputs=fingerprint(runtimeFiles());
for(const id of MELEE_ARM_FAMILIES)for(const stage of [0,1,2])for(let dir=0;dir<8;dir++)for(const state of ['walk','sprint','attack']){
 const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);let previous;
 for(let i=0;i<=64;i++){
  const rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,i/64);rig.artStage=stage;const pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);poses++;assert.equal(pixels.clipped,0);
  const values=rig.artShoulderSkin.motions.map(m=>m.theta);
  if(previous)for(let j=0;j<values.length;j++){const delta=Math.abs(values[j]-previous[j]);if(delta>maxStep){maxStep=delta;worst={id,stage,dir,state,phase:i/64,side:j,delta};}assert.ok(delta<.35,JSON.stringify({id,stage,dir,state,phase:i/64,side:j,delta}));}previous=values;
 }
}
assert.deepEqual(fingerprint(runtimeFiles()),inputs);const report={status:'passed',inputs,poses,states:['walk','sprint','attack'],samplesPerCycle:65,maxAngularStep:maxStep,worst,angularStepLimit:.35,explanation:'Dense timing check rejects elbow-branch/angle-wrap shoulder snaps; direct branch-invariance and fine-phase continuity are also unit-tested.'};fs.writeFileSync('public/melee-shoulder-review/checks/shoulder-timing.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,poses,maxStep,worst}));
