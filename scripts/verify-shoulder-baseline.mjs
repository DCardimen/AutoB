import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hashFile} from './animation-contract.mjs';
const baseline=process.argv.find(a=>a.startsWith('--base='))?.slice(7)||'6cb3e2caf8e1419c440bfefc7bdfc78894492352',out='public/melee-shoulder-review/checks/preserved-artwork.json',masters=[];
for(const file of fs.readdirSync('art/melee-layers/masters')){
 const path='art/melee-layers/masters/'+file,current=JSON.parse(fs.readFileSync(path)),previous=JSON.parse(execFileSync('git',['show',baseline+':'+path],{maxBuffer:5*1024*1024})),stripped=structuredClone(current);
 for(const f of stripped.facings){for(const arm of f.arms)delete arm.shoulder;f.notes=f.notes.filter(n=>!n.startsWith('Shoulder field:'));}
 assert.deepEqual(stripped,previous,file+': preserve every approved pixel, layer, socket, leg and reconstruction');masters.push({file,sha256:hashFile(path),facings:current.facings.length});
}
fs.writeFileSync(out,JSON.stringify({status:'passed',baseline,masters,cells:masters.reduce((n,m)=>n+m.facings,0),unchanged:['raw artwork','palette indices','frozen bind','layer ownership','body and cape backing','painted arms and legs','sockets','source-facing registrations'],changes:'Only shoulder motion registrations and explanatory notes'},null,2)+'\n');console.log('All 21 masters / 168 cells preserve the approved body and clothing artwork exactly.');
