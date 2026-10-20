import * as T from 'three';
import {execFileSync} from 'node:child_process';

export function addChibiBlink(glb,bones,sourcePositions,positions,normals,sourceIndices,sourceUV,headPosition){
 const {json:g,append}=glb,head=[],body=[],eye=[],other=[];
 function inEye(i){const x=sourcePositions[i*3],y=sourcePositions[i*3+1],z=sourcePositions[i*3+2];return z>.15&&Math.hypot((Math.abs(x)-.169)/.105,(y-1.137)/.125)<1.28;}
 for(let n=0;n<sourceIndices.length;n+=3){const tri=Array.from(sourceIndices.subarray(n,n+3));if(tri.every(i=>sourcePositions[i*3+1]>.99)){head.push(...tri);(tri.some(inEye)?eye:other).push(...tri);}else body.push(...tri);}
 const primitive=g.meshes[0].primitives[0];primitive.indices=append(new Uint16Array(body),'SCALAR',5123,34963);
 const local=Float32Array.from(positions,(v,i)=>v-headPosition[i%3]),attrs={POSITION:append(local,'VEC3',5126,34962),NORMAL:append(normals,'VEC3',5126,34962),TEXCOORD_0:append(sourceUV,'VEC2',5126,34962)};
 // Subdivide only the eye patch so source eyebrow/fur texture survives as
 // vertex colours. Original open eyes and all other head triangles stay exact.
 const patchP=[],patchN=[],patchUV=[],sourcePoints=[];
 function surface(x,y){return .335-1.5*x*x-.75*(y-1.15)*(y-1.15);}
 function vertex(tri,a,b){
  const w=[1-a-b,a,b],p=new T.Vector3(),n=new T.Vector3(),uv=[0,0];
  for(let k=0;k<3;k++){p.addScaledVector(new T.Vector3().fromArray(sourcePositions,tri[k]*3),w[k]);n.addScaledVector(new T.Vector3().fromArray(normals,tri[k]*3),w[k]);uv[0]+=sourceUV[tri[k]*2]*w[k];uv[1]+=sourceUV[tri[k]*2+1]*w[k];}
  const r=Math.hypot((Math.abs(p.x)-.169)/.105,(p.y-1.137)/.125),blend=p.z>.15?Math.min(1,Math.max(0,(1.28-r)/.3)):0;
  sourcePoints.push(p.clone());p.z=p.z*(1-blend)+surface(p.x,p.y)*blend;n.lerp(new T.Vector3(3*p.x,1.5*(p.y-1.15),1).normalize(),blend).normalize();
  patchP.push(p.x-headPosition[0],p.y-.096-headPosition[1],p.z-headPosition[2]);patchN.push(...n.toArray());patchUV.push(uv);
 }
 const divisions=6;
 for(let i=0;i<eye.length;i+=3){const tri=eye.slice(i,i+3);for(let a=0;a<divisions;a++)for(let b=0;b<divisions-a;b++){
  vertex(tri,a/divisions,b/divisions);vertex(tri,(a+1)/divisions,b/divisions);vertex(tri,a/divisions,(b+1)/divisions);
  if(a+b<divisions-1){vertex(tri,(a+1)/divisions,b/divisions);vertex(tri,(a+1)/divisions,(b+1)/divisions);vertex(tri,a/divisions,(b+1)/divisions);}
 }}
 const samples=JSON.parse(execFileSync('python',['scripts/lib/sample-glb-texture.py'],{input:JSON.stringify({file:'public/meshy-fox-preview/fox-repaired.glb',uvs:patchUV}),maxBuffer:16*1024*1024}));
 const convert=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)},colors=new Float32Array(patchP.length);
 sourcePoints.forEach((p,i)=>{
  let rgb=samples.slice(i*3,i*3+3).map(convert);
  const r=Math.hypot((Math.abs(p.x)-.169)/.105,(p.y-1.137)/.125);
  if(p.z>.15&&r<1.18&&p.y<1.245){const t=Math.max(0,Math.min(1,(p.y-1.088)/.035));rgb=[1,.938,.855].map((v,k)=>v*(1-t)+[.991,.1356,.016][k]*t);}
  colors.set(rgb,i*3);
 });
 const eyeMaterial=g.materials.push({name:'Closed eye fur',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:.85}})-1;
 const openMesh=g.meshes.push({name:'OpenHead',primitives:[{attributes:attrs,indices:append(new Uint16Array(head),'SCALAR',5123,34963),material:0}]})-1;
 const closedMesh=g.meshes.push({name:'ClosedHead',primitives:[{attributes:attrs,indices:append(new Uint16Array(other),'SCALAR',5123,34963),material:0},{attributes:{POSITION:append(new Float32Array(patchP),'VEC3',5126,34962),NORMAL:append(new Float32Array(patchN),'VEC3',5126,34962),COLOR_0:append(colors,'VEC3',5126,34962)},material:eyeMaterial}]})-1;
 const open=g.nodes.push({name:'Head_Open',mesh:openMesh,scale:[1,1,1]})-1,closed=g.nodes.push({name:'Head_Closed',mesh:closedMesh,scale:[0,0,0]})-1;
 g.nodes[bones.get('Head')].children??=[];g.nodes[bones.get('Head')].children.push(open,closed);
 // Standard two-state chibi blink. No eyelid decal or face deformation.
 const p=[],ns=[];
 function frontZ(x,y){return surface(x,y);}
 for(const sign of [-1,1]){
  const pts=[];for(let i=0;i<=20;i++){const u=-1+2*i/20,x=sign*.169+u*.064,y=1.135+.010*(1-u*u),z=frontZ(x,y)+.006;pts.push(new T.Vector3(x-headPosition[0],y-.096-headPosition[1],z-headPosition[2]));}
  const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.003,6,false);const non=tube.toNonIndexed();p.push(...non.attributes.position.array);ns.push(...non.attributes.normal.array);
 }
 const lineMaterial=g.materials.push({name:'Chibi closed eye line',pbrMetallicRoughness:{baseColorFactor:[.003,.0015,.0007,1],metallicFactor:0,roughnessFactor:.9}})-1;
 const lineMesh=g.meshes.push({name:'ClosedEyeLines',primitives:[{attributes:{POSITION:append(new Float32Array(p),'VEC3',5126,34962),NORMAL:append(new Float32Array(ns),'VEC3',5126,34962)},material:lineMaterial}]})-1,line=g.nodes.push({name:'Closed_Eye_Lines',mesh:lineMesh})-1;g.nodes[closed].children=[line];
 return {open,closed,line};
}
