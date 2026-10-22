import {tailCentre} from './fox-tail-profile.mjs';

// Independent measurements of the exported surface, intersecting its actual
// triangles with axial planes (not sampling construction-profile metadata).
export function measureFoxTail(glb){
 const g=glb.json,a=g.meshes[0].primitives[0],p=glb.read(a.attributes.POSITION),j=glb.read(a.attributes.JOINTS_0),w=glb.read(a.attributes.WEIGHTS_0),index=glb.read(a.indices),names=g.skins[0].joints.map(i=>g.nodes[i].name),tail=[];
 for(let v=0;v<p.length/3;v++){let t=0;for(let k=0;k<4;k++)if(names[j[v*4+k]].startsWith('Tail_'))t+=w[v*4+k];tail.push(t>.999);}
 const sections=[.14,.20,.27,.35,.42,.50,.58,.64].map(x=>{
  const c=tailCentre(x),r=[0,0,0,0];
  for(let i=0;i<index.length;i+=3){const tri=Array.from(index.subarray(i,i+3));if(!tri.every(v=>tail[v]))continue;for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],ax=p[a*3]+.035,bx=p[b*3]+.035;if((ax<=x&&bx>x)||(bx<=x&&ax>x)){const t=(x-ax)/(bx-ax),dy=p[a*3+1]+t*(p[b*3+1]-p[a*3+1])-.004-c.y,dz=p[a*3+2]+t*(p[b*3+2]-p[a*3+2])+.10-c.z;r[dy>=0?0:1]=Math.max(r[dy>=0?0:1],Math.abs(dy));r[dz>=0?2:3]=Math.max(r[dz>=0?2:3],Math.abs(dz));}}}
  return {x,upper:r[0],lower:r[1],front:r[2],back:r[3],height:r[0]+r[1],width:r[2]+r[3],yImbalance:Math.abs(r[0]-r[1]),zImbalance:Math.abs(r[2]-r[3])};
 });
 return {sections,tailVertexCount:tail.filter(Boolean).length,xMin:Math.min(...tail.flatMap((t,v)=>t?[p[v*3]]:[])),xMax:Math.max(...tail.flatMap((t,v)=>t?[p[v*3]]:[]))};
}
