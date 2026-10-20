import * as T from 'three';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';

export function addClosedHands(glb,bones){
 const {json:g,append}=glb,n=64,size=.24,center=[.075,-.015,-.025],mc=new MarchingCubes(n,new T.MeshStandardMaterial(),false,false,30000);mc.isolation=.0000123;
 const paths=[];
 for(const z of [.028,-.007,-.042,-.077])paths.push({radius:.0145,p:[[.130,.002,z],[.130,-.030,z],[.112,-.055,z],[.080,-.055,z],[.067,-.034,z],[.075,-.013,z]]});
 paths.push({radius:.019,p:[[.052,.012,.055],[.078,-.010,.055],[.105,-.046,.025]]});
 function capsule(x,y,z,a,b,r){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/(dx*dx+dy*dy+dz*dz)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t,z-a[2]-dz*t)-r;}
 function softMin(a,b,k=.003){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
 for(let iz=0;iz<n;iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){
  const x=(ix/n*2-1)*size/2+center[0],y=(iy/n*2-1)*size/2+center[1],z=(iz/n*2-1)*size/2+center[2],r=.018,q=[Math.abs(x-.065)-(.0525-r),Math.abs(y-.006)-(.0275-r),Math.abs(z+.025)-(.080-r)];
  let d=Math.hypot(...q.map(v=>Math.max(0,v)))+Math.min(Math.max(...q),0)-r;
  for(const path of paths)for(let i=1;i<path.p.length;i++)d=softMin(d,capsule(x,y,z,path.p[i-1],path.p[i],path.radius));
  mc.field[iz*n*n+iy*n+ix]=-d;
 }
 const baseField=mc.field.slice();
 const mat=g.materials.push({name:'Closed leather gloves',pbrMetallicRoughness:{baseColorFactor:[...new T.Color('#533723').toArray(),1],roughnessFactor:.59,metallicFactor:0}})-1;
 const result={};
 for(const [side,sign]of [['R',-1],['L',1]]){
  for(let iz=0;iz<n;iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){
   const x=(ix/n*2-1)*size/2+center[0],y=(iy/n*2-1)*size/2+center[1],z=(iz/n*2-1)*size/2+center[2],radius=Math.hypot(x-.095,y+.025),index=iz*n*n+iy*n+ix;
   let d=-baseField[index];
   if(side==='L'){
    d=softMin(d,Math.max(radius-.023,Math.abs(z+.025)-.064));
    // A narrow finger groove receives the changing string angle throughout
    // the draw. The string rests in this opening instead of cutting skin.
    for(const ray of [[0.2698,-0.4486,-0.852],[0.2882,-0.4858,-0.8252],[0.3095,-0.537,-0.7848],[0.326,-0.5937,-0.7357],[0.3324,-0.6497,-0.6836],[0.3268,-0.7013,-0.6335],[0.3104,-0.7461,-0.589],[0.2872,-0.7828,-0.552],[0.2621,-0.8107,-0.5236],[0.2409,-0.8293,-0.5043],[0.229,-0.8384,-0.4947],[0.2278,-0.8392,-0.4938],[0.2278,-0.8392,-0.4938],[0.2278,-0.8392,-0.4938]]){
     const start=[.095,-.025,.077],end=start.map((v,k)=>v+ray[k]*.20);d=Math.max(d,-capsule(x,y,z,start,end,.0048));
    }
   }
   // Real empty channels: bow handle in the right fist, string/arrow in left.
   d=Math.max(d,(side==='R'?.0155:.0045)-radius);mc.field[index]=-d;
  }
  mc.update();const keep=[];for(let i=0;i<mc.count*3;i+=9){const a=new T.Vector3().fromArray(mc.geometry.attributes.position.array,i),b=new T.Vector3().fromArray(mc.geometry.attributes.position.array,i+3),c=new T.Vector3().fromArray(mc.geometry.attributes.position.array,i+6);if(b.sub(a).cross(c.sub(a)).lengthSq()>0)for(let k=0;k<9;k++)keep.push(i+k);}
  const baseP=Float32Array.from(keep,i=>mc.geometry.attributes.position.array[i]),baseN=Float32Array.from(keep,i=>mc.geometry.attributes.normal.array[i]);
  const p=new Float32Array(baseP.length),normals=new Float32Array(baseN.length),colors=new Float32Array(baseP.length);
  for(let i=0;i<baseP.length;i+=3){const xyz=[baseP[i]*size/2+center[0],baseP[i+1]*size/2+center[1],baseP[i+2]*size/2+center[2]];p.set([sign*xyz[0],xyz[1],xyz[2]],i);new T.Vector3(sign*baseN[i],baseN[i+1],baseN[i+2]).normalize().toArray(normals,i);const grain=.976+.024*Math.sin(xyz[0]*340)*Math.sin(xyz[2]*290);colors.set([grain,grain,grain],i);}
  // Mirroring geometry needs reversed winding as well as reflected normals.
  if(sign<0)for(let i=0;i<p.length;i+=9)for(const array of [p,normals,colors])for(let k=0;k<3;k++){const v=array[i+3+k];array[i+3+k]=array[i+6+k];array[i+6+k]=v;}
  // Weld the marching-cubes lattice before export. Collapsing coincident
  // samples together preserves the closed surface instead of deleting slivers.
  const uniqueP=[],uniqueN=[],uniqueC=[],indices=[],weld=new Map(),faces=new Set();
  for(let i=0;i<p.length;i+=9){const tri=[];for(let k=0;k<9;k+=3){const xyz=[p[i+k],p[i+k+1],p[i+k+2]].map(v=>Math.round(v*1e5)/1e5),key=xyz.join(',');let id=weld.get(key);if(id===undefined){id=uniqueP.length/3;weld.set(key,id);uniqueP.push(...xyz);uniqueN.push(0,0,0);uniqueC.push(...colors.subarray(i+k,i+k+3));}for(let n=0;n<3;n++)uniqueN[id*3+n]+=normals[i+k+n];tri.push(id);}
   if(new Set(tri).size<3)continue;const key=[...tri].sort((a,b)=>a-b).join(',');if(faces.has(key))continue;faces.add(key);indices.push(...tri);
  }
  for(let i=0;i<uniqueN.length;i+=3)new T.Vector3().fromArray(uniqueN,i).normalize().toArray(uniqueN,i);
  const mesh=g.meshes.push({name:`ClosedGlove_${side}`,primitives:[{attributes:{POSITION:append(new Float32Array(uniqueP),'VEC3',5126,34962),NORMAL:append(new Float32Array(uniqueN),'VEC3',5126,34962),COLOR_0:append(new Float32Array(uniqueC),'VEC3',5126,34962)},indices:append(new Uint16Array(indices),'SCALAR',5123,34963),material:mat}]})-1;
  const node=g.nodes.push({name:`Closed_Glove_${side}`,mesh})-1;g.nodes[bones.get('Hand_'+side)].children??=[];g.nodes[bones.get('Hand_'+side)].children.push(node);result[side]=node;
 }
 return result;
}
