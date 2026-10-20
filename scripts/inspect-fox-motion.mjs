import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBVH} from 'three-mesh-bvh';
import validator from 'gltf-validator';
import {readGLB} from './lib/glb.mjs';
import {FoxPreviewController} from '../public/meshy-fox-preview/fox-preview-controller.mjs';

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const file='public/meshy-fox-preview/fox-animated.glb',bytes=fs.readFileSync(file),glb=readGLB(file),g=glb.json;
const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
const model=asset.scene,mixer=new T.AnimationMixer(model),node=n=>model.getObjectByName(n),body=node('Mesh_0')||(()=>{let b;model.traverse(o=>{if(o.isSkinnedMesh)b=o;});return b;})();
const source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),srcP=source.read(source.json.meshes[0].primitives[0].attributes.POSITION),srcJ=glb.read(g.meshes[0].primitives[0].attributes.JOINTS_0),srcW=glb.read(g.meshes[0].primitives[0].attributes.WEIGHTS_0),srcNames=g.skins[0].joints.map(id=>g.nodes[id].name);
const controller=new FoxPreviewController(model),tracking=process.argv.includes('--tracking');
function regionIndices(test){const indices=[];for(let i=0;i<body.geometry.index.count;i+=3){const tri=[0,1,2].map(k=>body.geometry.index.getX(i+k));if(tri.every(v=>test(v,srcP[v*3],srcP[v*3+1],srcP[v*3+2])))indices.push(...tri);}return indices;}
const regions={rightForearm:regionIndices((i,x,y)=>x<-.43&&y>.72&&y<.94),leftForearm:regionIndices((i,x,y)=>x>.43&&y>.72&&y<.94),torso:regionIndices((i,x,y)=>Math.abs(x)<.24&&y>.40&&y<.93),legs:regionIndices((i,x,y)=>y<.44&&[0,1,2,3].reduce((s,k)=>s+(/^(Thigh|Shin|Foot)_/.test(srcNames[srcJ[i*4+k]])?srcW[i*4+k]:0),0)>.8),tail:regionIndices(i=>[0,1,2,3].reduce((s,k)=>s+(srcNames[srcJ[i*4+k]].startsWith('Tail_')?srcW[i*4+k]:0),0)>.9)};
function geometry(mesh,indices){const a=mesh.geometry,index=indices||a.index?.array||Array.from({length:a.attributes.position.count},(_,i)=>i),p=new Float32Array(index.length*3),v=new T.Vector3();index.forEach((id,i)=>{mesh.getVertexPosition(id,v).applyMatrix4(mesh.matrixWorld).toArray(p,i*3);});return new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(p,3));}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible||Math.abs(p.scale.x*p.scale.y*p.scale.z)<1e-9)return false;return true;}
const report={assetSHA256:createHash('sha256').update(bytes).digest('hex'),sampling:process.argv.includes('--quick')?'diagnostic every twelfth frame':'every exported frame, 60 Hz',frames:0,nonFinite:0,bounds:{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},maxBowGripError:0,maxDrawContactError:0,collisions:{},collisionExamples:{},clips:{}};
regions.tailBulb=regionIndices((i,x)=>x>.31&&[0,1,2,3].reduce((sum,k)=>sum+(srcNames[srcJ[i*4+k]].startsWith('Tail_')?srcW[i*4+k]:0),0)>.99);
const pairs=[['rightPawString','Simple_Paw_R','Bow_String'],['tailBulbTorso','tailBulb','torso'],['tailBulbHead','tailBulb','head'],['rightForearmTorso','rightForearm','torso'],['leftForearmTorso','leftForearm','torso'],['stringTorso','Bow_String','torso'],['stringHead','Bow_String','head'],['rightFistBow','Simple_Paw_R','Longbow'],['leftFistString','Simple_Paw_L','Bow_String'],['leftFistArrow','Simple_Paw_L','Arrow_Nock_and_Flight'],['fists','Simple_Paw_R','Simple_Paw_L'],['rightFistTorso','Simple_Paw_R','torso'],['leftFistTorso','Simple_Paw_L','torso'],['tailLegs','tail','legs'],['bowTorso','Longbow','torso'],['bowHead','Longbow','head']];
const allMeshes=[];model.traverse(o=>{if(o.isMesh)allMeshes.push(o);});
for(const clip of asset.animations.filter(c=>!process.argv.some(v=>v.startsWith('--clip='))||c.name===process.argv.find(v=>v.startsWith('--clip=')).slice(7))){
 mixer.stopAllAction();mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1).play();const stats={frames:0};report.clips[clip.name]=stats;
 console.log('Checking '+clip.name);
 for(let f=0;f<=Math.ceil(clip.duration*60);f+=process.argv.includes('--quick')?12:1){
  const time=Math.min(clip.duration-1e-6,f/60);controller.restore();mixer.setTime(time);model.updateMatrixWorld(true);if(tracking){const angle=.35*Math.sin(time*2.2);controller.apply({mode:g.animations.find(c=>c.name===clip.name).extras.mode,clipTime:time,ambientTime:time+6,target:new T.Vector3(Math.sin(angle)*3,1.03,Math.cos(angle)*3)});}body.skeleton.update();report.frames++;stats.frames++;
  const cache=new Map();
  function geo(name){if(cache.has(name))return cache.get(name);let result;if(regions[name])result=geometry(body,regions[name]);else{const meshes=[];if(name==='head'){for(const n of ['Head_Open','Head_Closed'])node(n).traverse(o=>{if(o.isMesh&&visible(o))meshes.push(o);});}else node(name).traverse(o=>{if(o.isMesh&&visible(o))meshes.push(o);});const p=meshes.flatMap(o=>Array.from(geometry(o).attributes.position.array));result=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(p,3));}if(!result.index)result.setIndex(Array.from({length:result.attributes.position.count},(_,i)=>i));cache.set(name,result);return result;}
  for(const mesh of allMeshes)if(visible(mesh)){const a=geometry(mesh).attributes.position;for(let i=0;i<a.count;i++){const v=[a.getX(i),a.getY(i),a.getZ(i)];if(!v.every(Number.isFinite))report.nonFinite++;if(!stats.lowest||v[1]<stats.lowest.y)stats.lowest={y:v[1],mesh:mesh.name,time};for(let k=0;k<3;k++){report.bounds.min[k]=Math.min(report.bounds.min[k],v[k]);report.bounds.max[k]=Math.max(report.bounds.max[k],v[k]);}}}
  const rightPalm=node('Hand_R').localToWorld(new T.Vector3(-.095,-.025,-.025)),bow=node('Bow_Right_Hand').getWorldPosition(new T.Vector3());report.maxBowGripError=Math.max(report.maxBowGripError,rightPalm.distanceTo(bow));
  if(/^(Bow_Attack|Shoot_)/.test(clip.name)&&time>=.48&&time<1.18){const draw=node('BowStringDraw').morphTargetInfluences[0],nock=node('Bow_Right_Hand').localToWorld(new T.Vector3(.10+(.14-.10)*draw,.025,0)),left=node('Hand_L').localToWorld(new T.Vector3(.130,0,0));report.maxDrawContactError=Math.max(report.maxDrawContactError,nock.distanceTo(left));}
  // Surface tests on unrelated parts; cuff/hand and shoulder joint joins are
  // intentionally excluded. Test every exported frame, not metadata bounds.
  for(const [name,a,b]of pairs){const ga=geo(a),gb=geo(b);if(gb.attributes.position.count)gb.boundsTree??=new MeshBVH(gb);const hit=ga.attributes.position.count&&gb.attributes.position.count&&(ga.boundsTree??=new MeshBVH(ga)).intersectsGeometry(gb,new T.Matrix4());if(hit){stats.collisions??={};(stats.collisions[name]??=[]).push(time);report.collisions[name]=(report.collisions[name]||0)+1;if(!report.collisionExamples[name]){let contact;ga.boundsTree.bvhcast(gb.boundsTree,new T.Matrix4(),{intersectsTriangles:(a,b)=>{if(a.intersectsTriangle(b)){contact={a:[a.a.toArray(),a.b.toArray(),a.c.toArray()],b:[b.a.toArray(),b.b.toArray(),b.c.toArray()]};return true;}return false;}});report.collisionExamples[name]={clip:clip.name,time,contact};}}}
  for(const geometry of cache.values()){geometry.boundsTree?.dispose?.();geometry.dispose();}
 }
}
const validation=await validator.validateBytes(new Uint8Array(bytes),{uri:file,maxIssues:30});report.gltf=validation.issues;
fs.writeFileSync(`docs/evidence/meshy-fox-natural-motion/${tracking?'runtime':'export'}-review.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({frames:report.frames,collisions:report.collisions,maxBowGripError:report.maxBowGripError,maxDrawContactError:report.maxDrawContactError,gltfErrors:report.gltf.numErrors}));if(!process.argv.includes('--quick')&&(report.nonFinite||report.bounds.min[1]<-.001||Object.keys(report.collisions).length||report.maxDrawContactError>1e-5||report.gltf.numErrors))process.exitCode=1;
