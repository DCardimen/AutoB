import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
﻿import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
export function islands(pixels,cut){
 const remaining=new Set();for(let i=0;i<4096;i++)if(pixels[i*4+3])remaining.add(i);
 const groups=[];while(remaining.size){const first=remaining.values().next().value,queue=[first];remaining.delete(first);for(let i=0;i<queue.length;i++){const k=queue[i],x=k%64,y=Math.floor(k/64);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&remaining.delete(n))queue.push(n);}}groups.push(queue);}
 groups.sort((a,b)=>b.length-a.length);return groups.slice(1).filter(g=>g.length>=3&&g.some(k=>Math.floor(k/64)>=cut));
}
export function auditLegConnections(){
const issues=[],designs=new Set();let count=0;
for(const spec of PIXEL_SPECIES){if(designs.has(spec.nativeDesign)||!['wolf','mech','spider','crab','centipede'].includes(spec.nativeRig))continue;designs.add(spec.nativeDesign);
 for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  const base=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'idle',.25),p=paintCharacterPixels(base.id,base,dir*Math.PI/4),cut=base.artLegRegistration.cutY,allowed=islands(p,cut).length;
  for(const state of ['idle','walk','run','sprint'])for(let step=0;step<8;step++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,step/8),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),detached=islands(pixels,rig.artLegRegistration.cutY);count++;
   if(detached.length>allowed)issues.push({id:spec.id,evolution,dir,state,phase:step/8,allowed,detached:detached.map(g=>({size:g.length,x:g[0]%64,y:Math.floor(g[0]/64)}))});
  }
 }
}
return {count,issueCount:issues.length,issues};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const report=auditLegConnections();fs.mkdirSync('playtest-artifacts',{recursive:true});fs.writeFileSync('playtest-artifacts/legs-v3-connectivity.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,issues:report.issues.slice(0,5)},null,2));if(report.issueCount)process.exitCode=1;}
