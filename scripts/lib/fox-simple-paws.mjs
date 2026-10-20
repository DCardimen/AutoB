import * as T from 'three';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';

export function addSimplePaws(glb,bones){
 const {json:g,append}=glb,n=56,size=.24,center=[.075,-.015,-.025],mc=new MarchingCubes(n,new T.MeshStandardMaterial(),false,false,30000);mc.isolation=.0000123;
 // A single rounded finger mass and small thumb. No added leather shell,
 // individual finger tubes, seams or artificial knuckle detail.
 const paths=[{radius:.022,p:[[.053,.012,.030],[.083,-.006,.038],[.100,-.031,.018]]}];
 function capsule(x,y,z,a,b,r){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/(dx*dx+dy*dy+dz*dz)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t,z-a[2]-dz*t)-r;}
 function softMin(a,b,k=.003){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
 for(let iz=0;iz<n;iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){
  const x=(ix/n*2-1)*size/2+center[0],y=(iy/n*2-1)*size/2+center[1],z=(iz/n*2-1)*size/2+center[2],q=[(x-.065)/.061,(y+.006)/.037,(z+.025)/.060];
  let d=(Math.hypot(...q)-1)*.037;
  for(const path of paths)for(let i=1;i<path.p.length;i++)d=softMin(d,capsule(x,y,z,path.p[i-1],path.p[i],path.radius));
  mc.field[iz*n*n+iy*n+ix]=-d;
 }
 const baseField=mc.field.slice();
 // Exact orange sampled from the uploaded forearm texture (250,95,29).
 const mat=g.materials.push({name:'Simple fox fur paws',pbrMetallicRoughness:{baseColorFactor:[...new T.Color('#fa5f1d').toArray(),1],roughnessFactor:.85,metallicFactor:0}})-1;
 const result={};
 for(const [side,sign]of [['R',-1],['L',1]]){
  for(let iz=0;iz<n;iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){
   const x=(ix/n*2-1)*size/2+center[0],y=(iy/n*2-1)*size/2+center[1],z=(iz/n*2-1)*size/2+center[2],radius=Math.hypot(x-.095,y+.025),index=iz*n*n+iy*n+ix;
   let d=-baseField[index];
   if(side==='L'){
    d=softMin(d,capsule(x,y,z,[.104,-.012,.026],[.126,-.004,.012],.012));
    d=Math.max(d,.006-Math.hypot(x-.130,y,z));
    for(const ray of [[.137,.251,-.958],[.151,.277,.949],[.124,.276,-.953],[.151,.337,.929],[.077,.357,-.931],[.123,.568,.814],[.065,.356,-.932],[.112,.610,.785]])d=Math.max(d,-capsule(x,y,z,[.130,0,0],[.130+ray[0]*.10,ray[1]*.10,ray[2]*.10],.006));
   }else d=Math.max(d,.0155-radius);
   mc.field[index]=-d;
  }
  mc.update();const keep=[];for(let i=0;i<mc.count*3;i+=9){const a=new T.Vector3().fromArray(mc.geometry.attributes.position.array,i),b=new T.Vector3().fromArray(mc.geometry.attributes.position.array,i+3),c=new T.Vector3().fromArray(mc.geometry.attributes.position.array,i+6);if(b.sub(a).cross(c.sub(a)).lengthSq()>0)for(let k=0;k<9;k++)keep.push(i+k);}
  const baseP=Float32Array.from(keep,i=>mc.geometry.attributes.position.array[i]),baseN=Float32Array.from(keep,i=>mc.geometry.attributes.normal.array[i]);
  const p=new Float32Array(baseP.length),normals=new Float32Array(baseN.length),colors=new Float32Array(baseP.length);
  for(let i=0;i<baseP.length;i+=3){const xyz=[baseP[i]*size/2+center[0],baseP[i+1]*size/2+center[1],baseP[i+2]*size/2+center[2]];p.set([sign*xyz[0],xyz[1],xyz[2]],i);new T.Vector3(sign*baseN[i],baseN[i+1],baseN[i+2]).normalize().toArray(normals,i);const grain=1;colors.set([grain,grain,grain],i);}
  // Mirroring geometry needs reversed winding as well as reflected normals.
  if(sign<0)for(let i=0;i<p.length;i+=9)for(const array of [p,normals,colors])for(let k=0;k<3;k++){const v=array[i+3+k];array[i+3+k]=array[i+6+k];array[i+6+k]=v;}
  // Weld the marching-cubes lattice before export. Collapsing coincident
  // samples together preserves the closed surface instead of deleting slivers.
  const uniqueP=[],uniqueN=[],uniqueC=[],indices=[],weld=new Map(),faces=new Set();
  for(let i=0;i<p.length;i+=9){const tri=[];for(let k=0;k<9;k+=3){const xyz=[p[i+k],p[i+k+1],p[i+k+2]].map(v=>Math.round(v*1e5)/1e5),key=xyz.join(',');let id=weld.get(key);if(id===undefined){id=uniqueP.length/3;weld.set(key,id);uniqueP.push(...xyz);uniqueN.push(0,0,0);uniqueC.push(...colors.subarray(i+k,i+k+3));}for(let n=0;n<3;n++)uniqueN[id*3+n]+=normals[i+k+n];tri.push(id);}
   if(new Set(tri).size<3)continue;const key=[...tri].sort((a,b)=>a-b).join(',');if(faces.has(key))continue;faces.add(key);indices.push(...tri);
  }
  for(let i=0;i<uniqueN.length;i+=3)new T.Vector3().fromArray(uniqueN,i).normalize().toArray(uniqueN,i);
  const mesh=g.meshes.push({name:`SimplePaw_${side}`,primitives:[{attributes:{POSITION:append(new Float32Array(uniqueP),'VEC3',5126,34962),NORMAL:append(new Float32Array(uniqueN),'VEC3',5126,34962),COLOR_0:append(new Float32Array(uniqueC),'VEC3',5126,34962)},indices:append(new Uint16Array(indices),'SCALAR',5123,34963),material:mat}]})-1;
  const node=g.nodes.push({name:`Simple_Paw_${side}`,mesh})-1;g.nodes[bones.get('Hand_'+side)].children??=[];g.nodes[bones.get('Hand_'+side)].children.push(node);result[side]=node;
 }
 return result;
}
