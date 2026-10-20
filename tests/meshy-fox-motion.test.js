import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBVH} from 'three-mesh-bvh';
import validator from 'gltf-validator';
import {readGLB} from '../scripts/lib/glb.mjs';

globalThis.self=globalThis;
// CPU geometry tests do not render textures; browser review decodes them.
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-animated.glb'),glb=readGLB('public/meshy-fox-preview/fox-animated.glb'),g=glb.json;
const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),''),model=asset.scene,mixer=new T.AnimationMixer(model),node=n=>model.getObjectByName(n);
model.updateMatrixWorld(true);
const defaultDirections=['R','L'].map(s=>new T.Vector3(s==='R'?-1:1,0,0).applyQuaternion(node('Hand_'+s).getWorldQuaternion(new T.Quaternion()))),defaultArrowScale=node('Arrow_Nock_and_Flight').scale.clone();
function action(name){mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name);mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1).play();model.rotation.y=0;return clip;}
function seek(t){mixer.setTime(t);model.updateMatrixWorld(true);node('FoxMesh').skeleton.update();}

test('default asset opens with hands down and the loose projectile hidden',()=>{
 assert.ok(defaultDirections.every(d=>d.y<-.8));assert.equal(defaultArrowScale.lengthSq(),0);
});

test('portable export has complete normalized clips and closed loop endpoints',async()=>{
 const result=await validator.validateBytes(new Uint8Array(bytes),{maxIssues:10});assert.equal(result.issues.numErrors,0);
 assert.deepEqual(asset.animations.map(c=>c.name),['Idle','Walk','Run','Bow_Attack','Dodge_Left','Dodge_Right','Hit_Reaction','Fall_and_Death']);
 for(const clip of g.animations)for(const channel of clip.channels){const sampler=clip.samplers[channel.sampler],values=glb.read(sampler.output),width=channel.target.path==='rotation'?4:channel.target.path==='weights'?1:3;assert.ok([...values].every(Number.isFinite));if(width===4)for(let i=0;i<values.length;i+=4)assert.ok(Math.abs(Math.hypot(...values.subarray(i,i+4))-1)<1e-6);if(clip.extras.loop)for(let k=0;k<width;k++)assert.ok(Math.abs(values[k]-values[values.length-width+k])<1e-6);}
});

test('right bow grip and left string nock remain attached after export in eight views',()=>{
 let max=0;
 for(const clip of asset.animations){action(clip.name);for(let i=0;i<80;i++){seek(i/80*clip.duration);for(let view=0;view<8;view++){model.rotation.y=view*Math.PI/4;model.updateMatrixWorld(true);const grip=node('Hand_R').localToWorld(new T.Vector3(-.095,-.025,-.025)),bow=node('Bow_Right_Hand').getWorldPosition(new T.Vector3());assert.ok(grip.distanceTo(bow)<1e-7);if(clip.name==='Bow_Attack'&&i/80*clip.duration>=.48&&i/80*clip.duration<1.18){const draw=node('BowStringDraw').morphTargetInfluences[0],nock=node('Bow_Right_Hand').localToWorld(new T.Vector3(.055+.545*draw,.025,0)),left=node('Hand_L').localToWorld(new T.Vector3(.095,-.025,.077));max=Math.max(max,nock.distanceTo(left));}}model.rotation.y=0;}}
 assert.ok(max<.0006,`interpolated nock separation ${max}`);
});

test('both gloves are closed continuous surfaces without degenerate faces',()=>{
 for(const side of ['R','L']){const mesh=node('Closed_Glove_'+side),p=mesh.geometry.attributes.position,edges=new Map(),keys=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(','));
  assert.equal(mesh.parent.name,'Hand_'+side);
  for(let i=0;i<mesh.geometry.index.count;i+=3){const tri=[0,1,2].map(k=>mesh.geometry.index.getX(i+k));const a=new T.Vector3().fromBufferAttribute(p,tri[0]),b=new T.Vector3().fromBufferAttribute(p,tri[1]),c=new T.Vector3().fromBufferAttribute(p,tri[2]);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-22);for(const [a,b]of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]]){const key=[keys[a],keys[b]].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}}
  assert.ok([...edges.values()].every(n=>n===2),'glove must be watertight after welding shared positions');
 }
});

test('bow and string use actual open grip channels throughout all animation frames',()=>{
 const gloves=Object.fromEntries(['R','L'].map(s=>{const mesh=node('Closed_Glove_'+s),geo=mesh.geometry.clone();return [s,{mesh,bvh:new MeshBVH(geo)}];}));
 const failures=[];
 for(const clip of asset.animations){action(clip.name);for(let f=0;f<Math.ceil(clip.duration*60);f++){const t=f/60;seek(t);for(const [side,gear]of [['R','Recurve_Bow'],['L','Bow_String']])node(gear).traverse(mesh=>{if(!mesh.isMesh)return;const geo=mesh.geometry.clone(),p=geo.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){mesh.getVertexPosition(i,v);p.setXYZ(i,v.x,v.y,v.z);}geo.boundsTree=new MeshBVH(geo);const matrix=gloves[side].mesh.matrixWorld.clone().invert().multiply(mesh.matrixWorld);if(gloves[side].bvh.intersectsGeometry(geo,matrix))failures.push(`${clip.name} ${t.toFixed(3)} ${side}`);geo.dispose();});}}
 assert.deepEqual(failures,[]);
});

test('walk and run alternate lifted feet while support soles remain level and grounded',()=>{
 const body=node('FoxMesh'),p=body.geometry.attributes.position,j=body.geometry.attributes.skinIndex,w=body.geometry.attributes.skinWeight,bones=body.skeleton.bones;
 const soles={R:[],L:[]};for(let i=0;i<p.count;i++)for(const s of ['R','L'])if(p.getY(i)<.025&&[0,1,2,3].some(k=>bones[j.getComponent(i,k)].name==='Foot_'+s&&w.getComponent(i,k)>.99))soles[s].push(i);
 assert.ok(soles.R.length>20&&soles.L.length>20);
 for(const name of ['Walk','Run']){const clip=action(name);let liftedR=0,liftedL=0;for(let f=0;f<100;f++){seek(f/100*clip.duration);for(const s of ['R','L']){const ankle=node('Foot_'+s).getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,1,0).applyQuaternion(node('Foot_'+s).getWorldQuaternion(new T.Quaternion()));assert.ok(normal.y>.9999);if(ankle.y>.135){if(s==='R')liftedR++;else liftedL++;}else if(Math.abs(ankle.y-.125)<1e-4){const y=Math.min(...soles[s].map(i=>body.getVertexPosition(i,new T.Vector3()).applyMatrix4(body.matrixWorld).y));assert.ok(y>-.001&&y<.003,`${name} ${s} sole ${y}`);}}}assert.ok(liftedR>10&&liftedL>10);}
});

test('blink swaps only the eyes; the open and closed head are never visible together',()=>{
 action('Idle');let open=0,closed=0;for(let i=0;i<240;i++){seek(i/60);const a=node('Head_Open').scale.x,b=node('Head_Closed').scale.x;assert.equal(a+b,1);if(a)open++;else closed++;}assert.ok(open>220&&closed>=5);assert.equal(node('Closed_Eye_Lines').parent.name,'Head_Closed');
});

test('dodges retain their landing displacement and cloth/tail remain animated',()=>{
 for(const [name,sign]of [['Dodge_Left',-1],['Dodge_Right',1]]){const clip=action(name);seek(clip.duration-1e-6);assert.ok(Math.abs(node('Root').position.x-sign*.3)<1e-6);}
 action('Run');seek(.1);const first=node('Tail_05').getWorldPosition(new T.Vector3()),cloth=node('Cape1_1').quaternion.clone();seek(.4);assert.ok(first.distanceTo(node('Tail_05').getWorldPosition(new T.Vector3()))>.01);assert.ok(cloth.angleTo(node('Cape1_1').quaternion)>.001);
});

test('complete front and lower tail fluff belongs to tail bones rather than the thigh',()=>{
 const source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),original=source.read(source.json.meshes[0].primitives[0].attributes.POSITION),primitive=g.meshes[0].primitives[0],p=glb.read(primitive.attributes.POSITION),j=glb.read(primitive.attributes.JOINTS_0),w=glb.read(primitive.attributes.WEIGHTS_0),names=g.skins[0].joints.map(id=>g.nodes[id].name);let count=0;
 for(let i=0;i<original.length;i+=3){const [x,y,z]=original.subarray(i,i+3);if(x>.31&&y>.25&&y<.70&&z<-.06){const v=i/3,total=[0,1,2,3].reduce((sum,k)=>sum+(names[j[v*4+k]].startsWith('Tail_')?w[v*4+k]:0),0);assert.ok(total>.99999);assert.ok(Math.abs(p[i+1]-(y-.096))<1e-7,'tail silhouette keeps the source shape');count++;}}
 assert.equal(count,424,'all 424 vertices in the inspected tail-bulb region are covered');
});
