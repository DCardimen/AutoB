import fs from 'node:fs';
import {NATIVE_SPECIES,lineageLimit} from '../native-content.js';
import {nativePosePixels} from '../native-poses.js';
function mask(p){const points=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(p[(y*64+x)*4+3])points.push([x,y]);const minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),w=Math.max(...points.map(p=>p[0]))-minX+1,h=Math.max(...points.map(p=>p[1]))-minY+1;return new Set(points.map(([x,y])=>Math.floor((x-minX)*32/w)+':'+Math.floor((y-minY)*32/h)));}
const change=(a,b)=>{const A=mask(a),B=mask(b);return 1-[...A].filter(p=>B.has(p)).length/new Set([...A,...B]).size;};
const report=NATIVE_SPECIES.filter(s=>lineageLimit({id:s.id})).map(s=>{const stages=[];for(let evolution=1;evolution<=lineageLimit({id:s.id});evolution++){const facings=[1,2,3,5].map(dir=>change(nativePosePixels(s,{id:s.id,evolution:evolution-1,evolutionPath:'wild'},'idle',.25,dir),nativePosePixels(s,{id:s.id,evolution,evolutionPath:'wild'},'idle',.25,dir)));stages.push({evolution,mean:facings.reduce((a,b)=>a+b,0)/facings.length,facings});}return {id:s.id,stages};});
fs.writeFileSync('playtest-artifacts/v3-evolution-silhouettes.json',JSON.stringify(report,null,2));
for(const r of report)console.log(r.id,r.stages.map(s=>`${s.evolution}: ${s.mean.toFixed(3)}`).join(', '));
