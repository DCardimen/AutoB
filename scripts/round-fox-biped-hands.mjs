import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {readGLB} from './lib/glb.mjs';
import {compactBiped} from './compact-fox-biped.mjs';

// Explicit user-requested anatomy replacement: one rounded orange hand mass
// and a fused thumb nub. The source forearms, wrist cuffs and body stay intact.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const file='public/meshy-fox-preview/fox-biped.glb',glb=readGLB(file),g=glb.json;
if(g.asset.extras.roundHands)throw Error('Rounded hands already installed; start with the fingered biped asset.');
async function load(file){const b=fs.readFileSync(file);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const asset=await load(file),source=await load('public/meshy-fox-preview/fox-biped-source.glb'),m=asset.scene,mix=new T.AnimationMixer(m),bind=source.scene;
bind.updateMatrixWorld(true);m.updateMatrixWorld(true);
const pos=o=>o.getWorldPosition(new T.Vector3()),quat=o=>o.getWorldQuaternion(new T.Quaternion()).normalize(),node=n=>m.getObjectByName(n),ids=new Map(g.nodes.map((n,i)=>[n.name,i]));
const primitive=g.meshes[0].primitives[0],j=glb.read(primitive.attributes.JOINTS_0),w=glb.read(primitive.attributes.WEIGHTS_0),positions=glb.read(primitive.attributes.POSITION),names=g.skins[0].joints.map(id=>g.nodes[id].name),keep=[],removed=[];
const sourceMesh=bind.getObjectByName('Biped_Fox'),wristPlanes=['Right','Left'].map(s=>bind.getObjectByName('smartrig'+s+'Hand').matrixWorld.clone().invert().multiply(sourceMesh.matrixWorld));
const handCorner=(i,matrix)=>{const p=new T.Vector3().fromArray(positions,i*3).applyMatrix4(matrix);return p.y>.005&&p.y<.18&&Math.hypot(p.x,p.z)<.10;};
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},attributes=Object.fromEntries(Object.entries(primitive.attributes).map(([k,id])=>[k,{id,data:glb.read(id),extra:[],width:widths[g.accessors[id].type]}])),morphs=primitive.targets.map(target=>Object.fromEntries(Object.entries(target).map(([k,id])=>[k,{id,data:glb.read(id),extra:[],width:3}]))),edgeCache=new Map();
let boundaryVertices=0;
function boundary(a,b,t){
 const key=[Math.min(a,b),Math.max(a,b)].join(',');if(edgeCache.has(key))return edgeCache.get(key);
 const id=positions.length/3+boundaryVertices++;edgeCache.set(key,id);
 for(const [name,attr]of [...Object.entries(attributes),...morphs.flatMap(Object.entries)]){
  let values=Array.from({length:attr.width},(_,k)=>attr.data[a*attr.width+k]*(1-t)+attr.data[b*attr.width+k]*t);
  if(name==='JOINTS_0'||name==='WEIGHTS_0'){
   const weights=new Map();for(const [v,factor]of [[a,1-t],[b,t]])for(let k=0;k<4;k++)weights.set(j[v*4+k],(weights.get(j[v*4+k])||0)+w[v*4+k]*factor);
   const top=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((s,v)=>s+v[1],0);while(top.length<4)top.push([0,0]);values=name==='JOINTS_0'?top.map(v=>v[0]):top.map(v=>v[1]/sum);
  }else if(name==='NORMAL'&&attr===attributes.NORMAL)values=new T.Vector3(...values).normalize().toArray();
  attr.extra.push(...values);
 }
 return id;
}
const original=primitive.indices===undefined?Array.from({length:positions.length/3},(_,i)=>i):Array.from(glb.read(primitive.indices));
for(let i=0;i<original.length;i+=3){
 const tri=original.slice(i,i+3),matrix=wristPlanes.find(matrix=>tri.some(id=>handCorner(id,matrix)));
 if(!matrix){keep.push(...tri);continue;}removed.push(...tri);
 const poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],ay=new T.Vector3().fromArray(positions,a*3).applyMatrix4(matrix).y-.005,by=new T.Vector3().fromArray(positions,b*3).applyMatrix4(matrix).y-.005;if(ay<=0)poly.push(a);if((ay<=0)!==(by<=0))poly.push(boundary(a,b,ay/(ay-by)));}
 for(let k=1;k<poly.length-1;k++)keep.push(poly[0],poly[k],poly[k+1]);
}
for(const [name,attr]of Object.entries(attributes)){const data=new attr.data.constructor(attr.data.length+attr.extra.length);data.set(attr.data);data.set(attr.extra,attr.data.length);primitive.attributes[name]=glb.append(data,g.accessors[attr.id].type,g.accessors[attr.id].componentType,34962);}
for(const [i,target]of morphs.entries())for(const [name,attr]of Object.entries(target)){const data=new Float32Array(attr.data.length+attr.extra.length);data.set(attr.data);data.set(attr.extra,attr.data.length);primitive.targets[i][name]=glb.append(data,'VEC3',5126,34962);}
primitive.indices=glb.append(Uint32Array.from(keep),'SCALAR',5125,34963);
const material=g.materials.push({name:'Rounded orange fox hands',pbrMetallicRoughness:{baseColorFactor:[...new T.Color('#fa5f1d').toArray(),1],metallicFactor:0,roughnessFactor:.86}})-1;
const frames={};
for(const [side,short,sign]of [['Right','R',1],['Left','L',-1]]){
 const hand=node('smartrig'+side+'Hand'),fore=node('smartrig'+side+'ForeArm'),bindHand=bind.getObjectByName(hand.name),bindFore=bind.getObjectByName(fore.name),bindChest=bind.getObjectByName('smartrigSpine2');
 const mc=new MarchingCubes(52,new T.MeshStandardMaterial(),false,false,30000),size=.18,centre=new T.Vector3(0,.045,0);mc.isolation=0;
 const ellipsoid=(p,c,r)=>{const q=p.clone().sub(c);return (Math.hypot(q.x/r.x,q.y/r.y,q.z/r.z)-1)*Math.min(r.x,r.y,r.z);};
 const softMin=(a,b,k=.009)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
 for(let z=0;z<52;z++)for(let y=0;y<52;y++)for(let x=0;x<52;x++){
  const p=new T.Vector3(x/52*size-size/2,y/52*size-size/2,z/52*size-size/2).add(centre);
  const palm=ellipsoid(p,new T.Vector3(0,.050,0),new T.Vector3(.040,.048,.035));
  const wrist=ellipsoid(p,new T.Vector3(0,.006,0),new T.Vector3(.040,.026,.037));
  const thumb=ellipsoid(p,new T.Vector3(sign*.035,.049,-.022),new T.Vector3(.020,.024,.020));
  mc.field[z*52*52+y*52+x]=-softMin(softMin(palm,wrist),thumb);
 }
 mc.update();const p=new Float32Array(mc.count*3),n=new Float32Array(mc.count*3);
 for(let i=0;i<p.length;i+=3){new T.Vector3().fromArray(mc.geometry.attributes.position.array,i).multiplyScalar(size/2).add(centre).toArray(p,i);new T.Vector3().fromArray(mc.geometry.attributes.normal.array,i).normalize().toArray(n,i);}
 const mesh=g.meshes.push({name:'RoundHand_'+short,primitives:[{attributes:{POSITION:glb.append(p,'VEC3',5126,34962),NORMAL:glb.append(n,'VEC3',5126,34962)},material}]})-1;
 const mountId=g.nodes.push({name:'RoundHand_'+short,mesh})-1;g.nodes[ids.get(hand.name)].children??=[];g.nodes[ids.get(hand.name)].children.push(mountId);
 const grip=short==='R'?[-.00437788094,.05818041931,.01674912649]:[-.03230581484,.05798890293,-.02475843605];
 const gripId=g.nodes.push({name:'RoundHand_'+short+'_Grip',translation:grip})-1;g.nodes[mountId].children=[gripId];
 const socket=node('Biped_Hand_'+short+'_Socket');
 frames[side]={hand,fore,mountId,socket,socketRest:socket.quaternion.clone(),bindForeQ:quat(bindFore),bindChestQ:quat(bindChest),bindDir:pos(bindHand).sub(pos(bindFore)).normalize(),relative:bindHand.quaternion.clone()};
}
let maxWristMovement=0,maxGripMovement=0;
for(const clip of asset.animations){
 mix.stopAllAction();mix.clipAction(clip).setLoop(T.LoopOnce,1).play();const animation=g.animations.find(a=>a.name===clip.name),times=Float32Array.from([...new Set(Array.from({length:Math.ceil(clip.duration*120)+1},(_,i)=>Math.fround(Math.min(i/120,clip.duration))))]),tracks=Object.fromEntries(Object.entries(frames).map(([s,f])=>[s,{fore:[],mount:[],socket:[],original:clip.tracks.find(t=>t.name===f.fore.name+'.quaternion').createInterpolant()}]));
 for(const t of times){
  const sample=Math.min(t,clip.duration-1e-7);mix.setTime(sample);for(const [s,f]of Object.entries(frames)){f.fore.quaternion.fromArray(tracks[s].original.evaluate(sample));f.socket.quaternion.copy(f.socketRest);}m.updateMatrixWorld(true);
  const snapshots=Object.fromEntries(Object.entries(frames).map(([s,f])=>[s,{wrist:pos(f.hand),q:quat(f.hand),socketQ:quat(f.socket)}]));
  for(const [s,f]of Object.entries(frames)){
   const before=snapshots[s],delta=quat(node('smartrigSpine2')).multiply(f.bindChestQ.clone().invert()),targetDir=before.wrist.clone().sub(pos(f.fore)).normalize(),foreQ=new T.Quaternion().setFromUnitVectors(f.bindDir.clone().applyQuaternion(delta),targetDir).multiply(delta).multiply(f.bindForeQ).normalize();
   f.fore.quaternion.copy(quat(f.fore.parent).invert().multiply(foreQ)).normalize();f.hand.quaternion.copy(f.relative);m.updateMatrixWorld(true);
   const mountQ=quat(f.hand).invert().multiply(before.q).normalize(),socketQ=quat(f.hand).invert().multiply(before.socketQ).normalize();tracks[s].fore.push(...f.fore.quaternion);tracks[s].mount.push(...mountQ);tracks[s].socket.push(...socketQ);
   maxWristMovement=Math.max(maxWristMovement,before.wrist.distanceTo(pos(f.hand)));
   const localGrip=new T.Vector3(...g.nodes[g.nodes[f.mountId].children[0]].translation),oldGrip=localGrip.clone().applyQuaternion(before.q).add(before.wrist),newGrip=localGrip.applyQuaternion(quat(f.hand).multiply(mountQ)).add(pos(f.hand));maxGripMovement=Math.max(maxGripMovement,oldGrip.distanceTo(newGrip));
  }
 }
 const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];
 for(const [s,f]of Object.entries(frames))for(const [id,values]of [[ids.get(f.fore.name),tracks[s].fore],[f.mountId,tracks[s].mount],[ids.get(f.socket.name),tracks[s].socket]]){const sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(values),'VEC4'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path==='rotation'));animation.channels.push({sampler,target:{node:id,path:'rotation'}});}
 // Removed finger surfaces have no animated role in the replacement hands.
 animation.channels=animation.channels.filter(c=>!/^smartrig(Right|Left)Hand(Middle|Ring|Pinky|Thumb)/.test(g.nodes[c.target.node].name));
 console.log('Round hands',clip.name);
}
g.asset.extras.roundHands={style:'One rounded orange mass with a fused thumb nub per hand; no individual fingers.',removedSourceTriangles:removed.length/3,retainedSourceTriangles:keep.length/3,removedSourceCorners:removed,boundaryVertices,maxWristMovement,maxGripMovement,forearm:'Shortest-arc authored bind orientation removes axial pronation from the skinned forearms. Rigid hand mounts retain grip orientation.'};
delete g.asset.extras.hands;
glb.write(file);compactBiped();fs.mkdirSync('docs/evidence/fox-rounded-hands',{recursive:true});fs.writeFileSync('docs/evidence/fox-rounded-hands/build.json',JSON.stringify({...g.asset.extras.roundHands,removedSourceCorners:undefined},null,2)+'\n');
console.log({maxWristMovement,maxGripMovement,removedTriangles:removed.length/3});
