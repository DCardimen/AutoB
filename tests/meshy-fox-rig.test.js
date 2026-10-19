import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {Vector3,Matrix4,Quaternion} from 'three';

const bytes=fs.readFileSync(new URL('../public/meshy-fox-preview/fox-repaired.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength)),bin=bytes.subarray(28+jsonLength);
function read(id){const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView],C=({5126:Float32Array,5123:Uint16Array,5121:Uint8Array})[a.componentType];return new C(bin.buffer,bin.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count*({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16})[a.type]);}
const primitive=gltf.meshes[0].primitives[0],p=read(primitive.attributes.POSITION),j=read(primitive.attributes.JOINTS_0),w=read(primitive.attributes.WEIGHTS_0),skin=gltf.skins[0],ibm=read(skin.inverseBindMatrices);
const names=skin.joints.map(i=>gltf.nodes[i].name),old=gltf.extras.foxRigRepair.originalRig;
function weights(vertex,predicate){let total=0;for(let k=0;k<4;k++)if(predicate(names[j[vertex*4+k]]))total+=w[vertex*4+k];return total;}
function matrices(){const result=[];function visit(id,parent=new Matrix4()){const n=gltf.nodes[id],local=new Matrix4().compose(new Vector3(...n.translation||[0,0,0]),new Quaternion(...n.rotation||[0,0,0,1]),new Vector3(...n.scale||[1,1,1]));result[id]=parent.clone().multiply(local);for(const child of n.children||[])visit(child,result[id]);}for(const root of gltf.scenes[0].nodes)visit(root);return result;}

test('complete normalized weights preserve the exact rest pose',()=>{
  const world=matrices();let maxRestError=0;
  for(let i=0;i<p.length/3;i++){
    const point=new Vector3().fromArray(p,i*3),deformed=new Vector3();let sum=0;
    for(let k=0;k<4;k++){const wt=w[i*4+k],joint=j[i*4+k];assert.ok(Number.isFinite(wt)&&wt>=0&&joint<names.length);sum+=wt;const m=world[skin.joints[joint]].clone().multiply(new Matrix4().fromArray(ibm,joint*16));deformed.addScaledVector(point.clone().applyMatrix4(m),wt);}
    assert.ok(Math.abs(sum-1)<1e-6);maxRestError=Math.max(maxRestError,point.distanceTo(deformed));
  }
  assert.ok(maxRestError<2e-7,`rest error ${maxRestError}`);
});

test('tail is a connected pelvis chain with exclusive distal weights',()=>{
  const tail=names.filter(n=>n.startsWith('Tail_'));assert.equal(tail.length,6);
  tail.forEach((name,i)=>{const node=skin.joints[names.indexOf(name)],parent=i?skin.joints[names.indexOf(tail[i-1])]:skin.joints[names.indexOf('Pelvis')];assert.ok(gltf.nodes[parent].children.includes(node));});
  let checked=0;for(let i=0;i<p.length/3;i++){const [x,y,z]=p.subarray(i*3,i*3+3);if(x>.3&&y>.29&&y<.67&&z<-.16){assert.ok(weights(i,n=>n.startsWith('Tail_'))>.99999);checked++;}}
  assert.ok(checked>250,`only ${checked} distal vertices`);
});

test('arm motion cannot pull ears or tail; leg motion cannot pull the tail bulb',()=>{
  let head=0,tail=0;for(let i=0;i<p.length/3;i++){const [x,y,z]=p.subarray(i*3,i*3+3);if(y>.99){assert.equal(weights(i,n=>/Arm|Hand|Clavicle|Tail/.test(n)),0);head++;}if(x>.3&&y>.29&&y<.67&&z<-.16){assert.equal(weights(i,n=>/Arm|Hand|Clavicle|Thigh|Shin|Foot/.test(n)),0);tail++;}}
  assert.ok(head>2500&&tail>250);
});

test('anatomical hand identities and rigid glove skinning are stable',()=>{
  for(const [side,sign]of [['R',-1],['L',1]]){assert.ok(gltf.nodes[skin.joints[names.indexOf('Hand_'+side)]].translation[0]*sign>0);let checked=0;for(let i=0;i<p.length/3;i++){const [x,y]=p.subarray(i*3,i*3+3);if(x*sign>.69&&y>.74&&y<.93){assert.ok(weights(i,n=>n==='Hand_'+side)>.99999);checked++;}}assert.ok(checked>400);}
});

test('source geometry attributes and original rig data remain recoverable',()=>{
  assert.equal(crypto.createHash('sha256').update(bin.subarray(0,38363624)).digest('hex'),'be2cad394625c78d44c5c669b883ba7c2ed46b47fef7d392e9af23aa23cb18c5');
  for(const key of ['POSITION','NORMAL','TEXCOORD_0'])assert.equal(primitive.attributes[key],old.attributes[key]);
  assert.equal(old.skins[0].joints.length,35);assert.equal(p.length/3,12572);assert.equal(read(primitive.indices).length/3,10353);
  assert.equal(gltf.images.length,3);assert.equal(gltf.extras.foxRigRepair.sourceSHA256,'a8b9f02c6eb810e26b02c0e46b43cbb38e1983b65fc3a8b16c6fafbab8f5bbd0');
});

test('embedded articulation clips are normalized and loop without a jump',()=>{
  assert.deepEqual(gltf.animations.map(a=>a.name),['Relaxed_Tail_Sway_Preview','Joint_Check_Preview']);
  for(const clip of gltf.animations)for(const sampler of clip.samplers){const time=read(sampler.input),q=read(sampler.output);assert.equal(time[0],0);assert.equal(time.at(-1),4);for(let i=0;i<q.length;i+=4)assert.ok(Math.abs(Math.hypot(...q.subarray(i,i+4))-1)<1e-6);for(let k=0;k<4;k++)assert.ok(Math.abs(q[k]-q[q.length-4+k])<1e-6);}
});
