import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ARM_ANATOMY,NATURAL_ANATOMY,armRegistration,mouthRegistration} from '../companion-anatomy.js';
import {authoredIdentities,authoredSourceFrame} from '../authored-sprite-renderer.js';
import {QUADRUPEDS} from '../creature-leg-volume.js';
import {hashFile} from './animation-contract.mjs';
const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/animation-quality');fs.mkdirSync(out,{recursive:true});
const families=[];
for(const identity of authoredIdentities){
 const natural=NATURAL_ANATOMY[identity],arms=ARM_ANATOMY[identity];assert.ok(natural||arms,identity+': reviewed anatomy');assert.ok(!(natural&&arms));
 if(natural?.plan==='quadruped')assert.ok(QUADRUPEDS.has(identity));
 const forms=[];
 for(let stage=0;stage<3;stage++){
  const facings=[];
  for(let dir=0;dir<8;dir++){
   const source=authoredSourceFrame(identity,dir,stage);assert.ok(source.pixels.length>0);
   for(const p of source.pixels){assert.ok(p.x>=0&&p.x<64&&p.y<64&&(p.y>=0||p.crownRepair&&p.y>=-9),identity+': registered source extent');assert.equal(source.colors[p.index],p.color);}
   const registration=armRegistration(identity,stage,dir),mouth=mouthRegistration(identity,stage,dir);
   if(registration){assert.ok(registration.neck<registration.pelvis);for(const hand of Object.values(registration.hands)){assert.ok(Number.isFinite(hand.x+hand.y));assert.ok(source.pixels.some(p=>Math.hypot(p.x-hand.x,p.y-hand.y)<=3),identity+': directional source hand');}}
   if(natural){assert.equal(natural.heads.length,3);assert.ok(natural.heads[stage].every(Number.isFinite));}
   facings.push({dir,sourcePixels:source.pixels.length,paletteIndices:source.colors.length,virtualCrownPixels:source.pixels.filter(p=>p.y<0).length,registration:registration||natural,mouth});
  }
  forms.push({stage,facings});
 }
 families.push({identity,plan:natural?.plan||'weapon-bearing biped',exception:natural?.exception||null,forms});
}
const report={status:'passed',sourceRegistration:hashFile('companion-anatomy.js'),families:families.length,forms:3,directions:8,sourceFrames:families.length*24,inventory:families};
fs.writeFileSync(path.join(out,'anatomy.json'),JSON.stringify(report,null,2)+'\n');console.log(`Reviewed registration inventory: ${report.families} families / ${report.sourceFrames} source frames.`);
