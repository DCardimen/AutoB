import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from '../scripts/lib/glb.mjs';
import {CLIPS,NOCK,RELEASE} from '../public/meshy-fox-preview/fox-motion.mjs';
import {BIPED_CLIPS,JUMP,jumpPhysics} from '../public/meshy-fox-preview/biped-motion.mjs';
import {BipedSkin} from '../public/meshy-fox-preview/biped-skin.mjs';
const source=readGLB('public/meshy-fox-preview/fox-biped-source.glb'),final=readGLB('public/meshy-fox-preview/fox-biped.glb');
const primitive=g=>g.json.meshes[0].primitives[0];
const digest=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
function imageDigest(bytes,g,id){const v=g.bufferViews[g.images[id].bufferView],offset=28+bytes.readUInt32LE(12)+(v.byteOffset||0);return digest(bytes.subarray(offset,offset+v.byteLength));}
test('the replacement is the newly supplied biped, with its authored geometry and material data',()=>{
 assert.equal(final.json.asset.extras.source,'Meshy_AI_fox_ranger_riggable_t_biped (1)');
 // The hand replacement adds only clipped wrist-edge vertices. All original
 // body/costume vertex data remains byte-identical before that appended edge.
 for(const name of ['POSITION','NORMAL','TEXCOORD_0']){const original=source.read(primitive(source).attributes[name]);assert.equal(digest(final.read(primitive(final).attributes[name]).subarray(0,original.length)),digest(original),name);}
 assert.equal(final.json.accessors[primitive(final).attributes.POSITION].count,250614+final.json.asset.extras.roundHands.boundaryVertices);
 const sb=fs.readFileSync('public/meshy-fox-preview/fox-biped-source.glb'),fb=fs.readFileSync('public/meshy-fox-preview/fox-biped.glb');for(const [i,image]of source.json.images.entries()){assert.equal(final.json.images[i].name,image.name);assert.equal(imageDigest(fb,final.json,i),imageDigest(sb,source.json,i),'authored texture bytes');}
 assert.equal(final.json.skins[0].joints.length,69);
});
test('tail fur has no thigh influence, and remains on its original hips-attached chain',()=>{
 const g=final.json,p=primitive(final),j=final.read(p.attributes.JOINTS_0),w=final.read(p.attributes.WEIGHTS_0),names=g.skins[0].joints.map(i=>g.nodes[i].name);let covered=0;
 for(let i=0;i<w.length/4;i++){let tail=0,legs=0,sum=0;for(let k=0;k<4;k++){sum+=w[i*4+k];if(/^Bone_01[5-9]$/.test(names[j[i*4+k]]))tail+=w[i*4+k];if(/UpLeg|Leg|Foot|Toe/.test(names[j[i*4+k]]))legs+=w[i*4+k];}assert.ok(Math.abs(sum-1)<1e-6);if(tail>.5){assert.ok(legs<1e-7,`tail ${i} inherits a leg`);covered++;}}
 assert.ok(covered>10000);const root=g.nodes.findIndex(n=>n.name==='Bone_019'),hips=g.nodes.find(n=>n.name==='smartrigHips');assert.ok(hips.children.includes(root));
 // Source brown leather and bright gold trim were incorrectly auto-weighted
 // to the tail/thigh, causing the rear garment to fold through itself.
 for(const i of [110285,104405,102783,103157,103355,105727,103900]){let pelvis=0;for(let k=0;k<4;k++)if(names[j[i*4+k]]==='smartrigHips')pelvis+=w[i*4+k];assert.ok(pelvis>.9999,`rear costume ${i} must follow the pelvis`);}
 assert.ok(g.asset.extras.tailWeights.attachmentVertices>0);assert.ok(g.asset.extras.tailWeights.attachmentVertices<2000,'bounded original socket seam');
});
test('all archer actions are portable and the downloaded Running motion is not added',()=>{
 const names=new Set(final.json.animations.map(a=>a.name));assert.ok(!names.has('Meshy_Running'));assert.equal(names.size,44);for(const c of Object.values(BIPED_CLIPS))assert.ok(names.has(c.name),c.name);
 for(const a of final.json.animations)for(const sampler of a.samplers){const times=final.read(sampler.input);for(let i=1;i<times.length;i++)assert.ok(times[i]>times[i-1],`${a.name}: strictly increasing exported key times`);}
 for(const a of final.json.animations)for(const c of a.channels){assert.ok(final.json.nodes[c.target.node],`${a.name}: valid target`);const values=final.read(a.samplers[c.sampler].output);for(const value of values)assert.ok(Number.isFinite(value));if(c.target.path==='rotation')for(let i=0;i<values.length;i+=4)assert.ok(Math.abs(Math.hypot(...values.slice(i,i+4))-1)<.0001,`${a.name}: unit rotation`);}
 const run=final.json.animations.find(c=>c.name==='Run'),times=final.read(run.samplers[0].input);assert.ok(Math.abs(times[times.length-1]-CLIPS.run.duration)<1e-6);

});

globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-biped.glb'),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),model=asset.scene,mixer=new T.AnimationMixer(model);
const originalBytes=fs.readFileSync('public/meshy-fox-preview/fox-biped-source.glb'),originalAsset=await new GLTFLoader().parseAsync(originalBytes.buffer.slice(originalBytes.byteOffset,originalBytes.byteOffset+originalBytes.byteLength),'');originalAsset.scene.updateMatrixWorld(true);
test('cached collision skinning agrees with Three on the actual authored mesh',()=>{
 const mesh=model.getObjectByName('Biped_Fox'),skin=new BipedSkin(mesh);for(const name of ['Idle','Run','Crouch_Volley','Side_Flip_Left']){mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name);mixer.clipAction(clip).play();mixer.setTime(name==='Idle'?2.08:clip.duration*.43);model.updateMatrixWorld(true);mesh.skeleton.update();skin.update();for(let i=0;i<mesh.geometry.attributes.position.count;i+=997){const expected=mesh.getVertexPosition(i,new T.Vector3()),actual=skin.vertex(i,new T.Vector3());assert.ok(expected.distanceTo(actual)<1e-6,`${name} vertex ${i}: ${expected.distanceTo(actual)}`);}}
});
test('every nocked arrow remains in contact with the new bow string through the complete shot set',()=>{
 let worst=0;const bow=model.getObjectByName('Bow_Right_Hand'),string=model.getObjectByName('BowStringDraw'),arrow=model.getObjectByName('Arrow_Nock_and_Flight');
 for(const [mode,c]of Object.entries(BIPED_CLIPS)){if(!c.bow&&!mode.startsWith('shoot')&&mode!=='attack')continue;const clip=asset.animations.find(a=>a.name===c.name);mixer.stopAllAction();mixer.clipAction(clip).play();for(let t=NOCK+.02;t<RELEASE;t+=1/60){mixer.setTime(t);model.updateMatrixWorld(true);const draw=string.morphTargetInfluences[0],nock=bow.localToWorld(new T.Vector3(.10+.13*draw,.025,0)),error=nock.distanceTo(arrow.getWorldPosition(new T.Vector3()));worst=Math.max(worst,error);assert.ok(error<.002,`${mode} ${t}: ${error}m`);const pinch=model.getObjectByName('RoundHand_L_Grip').getWorldPosition(new T.Vector3());assert.ok(pinch.distanceTo(nock)<.002,`${mode} ${t} rounded left string grip ${pinch.distanceTo(nock)}m`);const grip=model.getObjectByName('RoundHand_R_Grip').getWorldPosition(new T.Vector3());assert.ok(grip.distanceTo(bow.getWorldPosition(new T.Vector3()))<.002,`${mode} ${t} rounded bow grip`);}}
 console.log('Maximum new-rig arrow/string error',worst);
});

test('round orange hands replace the finger surfaces and keep neutral connected wrists',()=>{
 const sourceModel=originalAsset.scene;
 const meta=final.json.asset.extras.roundHands;assert.ok(meta.removedSourceTriangles>5000);assert.ok(meta.boundaryVertices<500);assert.ok(meta.maxWristMovement<.000001);assert.ok(meta.maxGripMovement<.000001);
 const rendered=new Set(final.read(primitive(final).indices)),raw=final.read(primitive(final).attributes.POSITION),sourceMesh=sourceModel.getObjectByName('Biped_Fox');
 for(const side of ['Right','Left']){const transform=sourceModel.getObjectByName('smartrig'+side+'Hand').matrixWorld.clone().invert().multiply(sourceMesh.matrixWorld);for(const id of rendered){const p=new T.Vector3().fromArray(raw,id*3).applyMatrix4(transform);if(p.y<.18&&Math.hypot(p.x,p.z)<.10)assert.ok(p.y<=.005001,`${side}: source finger/palm surface remains rendered`);}}
 for(const short of ['R','L']){const paw=model.getObjectByName('RoundHand_'+short);assert.ok(paw.isMesh);assert.ok(paw.material.color.r>paw.material.color.g*3);assert.equal(paw.children.length,1,'only a grip socket; no separate fingers');paw.geometry.computeBoundingBox();const size=paw.geometry.boundingBox.getSize(new T.Vector3());assert.ok(size.x>.085&&size.x<.12);assert.ok(size.y>.10&&size.y<.13);assert.ok(size.z>.065&&size.z<.09);}
 for(const clip of asset.animations){assert.ok(!clip.tracks.some(t=>/^smartrig(Right|Left)Hand(Middle|Ring|Pinky|Thumb)/.test(t.name)));mixer.stopAllAction();mixer.clipAction(clip).play();for(const share of [.1,.47,.8]){mixer.setTime(clip.duration*share);model.updateMatrixWorld(true);for(const [side,short]of [['Right','R'],['Left','L']]){const name='smartrig'+side+'Hand',hand=model.getObjectByName(name),bind=sourceModel.getObjectByName(name),paw=model.getObjectByName('RoundHand_'+short);assert.ok(hand.quaternion.angleTo(bind.quaternion)<.003,`${clip.name} ${side} wrist kink`);assert.ok(paw.getWorldPosition(new T.Vector3()).distanceTo(hand.getWorldPosition(new T.Vector3()))<.000001,`${clip.name} ${side} disconnected hand`);}}}
});
test('the nose twitch is visible, sideways and attached, with an unmoved mouth',()=>{
 const p=primitive(final),positions=final.read(p.attributes.POSITION);assert.equal(p.targets.length,2);
 for(const target of p.targets){const delta=final.read(target.POSITION);let max=0,moved=0;for(let i=0;i<delta.length;i+=3){assert.equal(delta[i+1],0,'no forward extrusion');if(positions[i+2]<=.660)assert.equal(Math.hypot(...delta.slice(i,i+3)),0,'mouth stays still');max=Math.max(max,Math.abs(delta[i]));if(delta[i])moved++;}assert.ok(max>.0069&&max<=.00701);assert.ok(moved>100);}
});
test('all three jump shots launch explosively, fall under gravity immediately after the apex, and land',()=>{
 assert.equal(JUMP.gravity,9.81);assert.ok(jumpPhysics(.65).compression>.9);assert.ok(jumpPhysics(JUMP.land+.06).compression>.9);
 const mesh=model.getObjectByName('Biped_Fox'),skin=new BipedSkin(mesh),p=mesh.geometry.attributes.position.array,feet=[];for(let i=0;i<p.length/3;i+=1)if(p[i*3+2]<.15)feet.push(i);
 for(const name of ['Jump_Shot','Jump_Shot_Forward','Jump_Shot_Backward']){
  mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name);mixer.clipAction(clip).setLoop(T.LoopOnce,1).play();
  for(const time of [.65,.78,.9,1.08,1.25,1.38,1.44,1.72]){mixer.setTime(time);model.updateMatrixWorld(true);mesh.skeleton.update();skin.update();let sole=Infinity;const v=new T.Vector3();for(const id of feet){skin.vertex(id,v).applyMatrix4(mesh.matrixWorld);sole=Math.min(sole,v.y);}assert.ok(Math.abs(sole-(.002+jumpPhysics(time).height))<.004,`${name} at ${time}: sole ${sole}`);}
 }
 const apex=JUMP.launch+JUMP.flight/2;assert.ok(jumpPhysics(apex+.01).velocity<0);assert.ok(jumpPhysics(apex+.02).height<jumpPhysics(apex+.01).height);
 assert.ok(jumpPhysics(2.2).travel>.9999);assert.equal(jumpPhysics(JUMP.land).height,0);
});

test('the reference run has narrow alternating strides, supported boots and a closed cycle',()=>{
 const info=final.json.asset.extras.run;assert.ok(info.maxLegError<.001);assert.ok(info.spineLean>.15);assert.equal(info.support,.42);
 const clip=asset.animations.find(c=>c.name==='Run'),mesh=model.getObjectByName('Biped_Fox'),skin=new BipedSkin(mesh),p=mesh.geometry.attributes.position.array,feet=[];for(let i=0;i<p.length/3;i++)if(p[i*3+2]<.15)feet.push(i);
 mixer.stopAllAction();const action=mixer.clipAction(clip).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();let minZ=Infinity,maxZ=-Infinity;const v=new T.Vector3(),begin=new Map();
 for(let f=0;f<=64;f++){
  const t=clip.duration*f/64;mixer.setTime(t);model.updateMatrixWorld(true);mesh.skeleton.update();skin.update();let sole=Infinity;for(const id of feet){skin.vertex(id,v).applyMatrix4(mesh.matrixWorld);sole=Math.min(sole,v.y)}assert.ok(sole>-.001,`sole penetrates at ${t}`);if(f/64%1<.42||(f/64+.5)%1<.42)assert.ok(sole<.006,`support at ${t}: ${sole}`);
  for(const side of ['Right','Left']){const foot=model.getObjectByName('smartrig'+side+'Foot').getWorldPosition(v);assert.ok(Math.abs(foot.x)<.09);minZ=Math.min(minZ,foot.z);maxZ=Math.max(maxZ,foot.z);}
  if(f===0)for(const b of mesh.skeleton.bones)begin.set(b.name,b.quaternion.clone());if(f===64)for(const b of mesh.skeleton.bones)assert.ok(begin.get(b.name).angleTo(b.quaternion)<.003,b.name+' loop seam');
 }assert.ok(maxZ-minZ>.18);assert.ok(BIPED_CLIPS.run.velocity[2]>.7);
});

function stancePose(name,t){mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name),action=mixer.clipAction(clip).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.setTime(Math.min(t,clip.duration-1e-7));model.updateMatrixWorld(true);return clip;}
const world=n=>model.getObjectByName(n).getWorldPosition(new T.Vector3());
test('idle arms hang beside the thighs with soft elbows and a lowered bow clear of the floor',()=>{
 for(const t of [0,1,2.08,4,6.3,7.99]){stancePose('Idle',t);for(const side of ['Right','Left']){const shoulder=world('smartrig'+side+'Arm'),elbow=world('smartrig'+side+'ForeArm'),hand=world('smartrig'+side+'Hand');assert.ok(shoulder.y-hand.y>.21,'arms down');assert.ok(Math.abs(hand.x-shoulder.x)<.05,'hands beside the body');assert.ok(Math.abs(elbow.x-shoulder.x)<.04,'elbows do not flare out');assert.ok(hand.y<world('smartrigHips').y-.05,'hands at thigh height');}
  const bow=model.getObjectByName('Bow_Right_Hand');let low=Infinity;bow.traverse(o=>{if(!o.isMesh)return;for(let i=0;i<o.geometry.attributes.position.count;i++){const p=new T.Vector3().fromBufferAttribute(o.geometry.attributes.position,i).applyMatrix4(o.matrixWorld);low=Math.min(low,p.y);}});assert.ok(low>.005,`lowered bow touches floor: ${low}`);
 }
});

test('standing attacks keep both authored boots flat, planted and staggered like the prior form',()=>{
 const mesh=model.getObjectByName('Biped_Fox'),skin=new BipedSkin(mesh),raw=mesh.geometry.attributes.position.array,boots={Right:[],Left:[]};for(const id of new Set(mesh.geometry.index.array))if(raw[id*3+2]<.13)boots[raw[id*3]<0?'Right':'Left'].push(id);
 for(const name of ['Bow_Attack','Bow_Attack_Upright','Bow_Attack_Tilted','Bow_Attack_Double','Bow_Attack_Crouched']){let initial;for(let f=0;f<=60;f++){stancePose(name,2.2*f/60);skin.update();const feet=['Right','Left'].map(s=>world('smartrig'+s+'Foot'));if(!initial)initial=feet.map(v=>v.clone());for(const [i,side]of ['Right','Left'].entries()){assert.ok(feet[i].distanceTo(initial[i])<.0002,`${name} ${side} sliding`);let low=Infinity;const p=new T.Vector3();for(const id of boots[side]){skin.vertex(id,p).applyMatrix4(mesh.matrixWorld);low=Math.min(low,p.y);}assert.ok(Math.abs(low-.002)<.001,`${name} ${side} hovering/penetrating ${low}`);const foot=model.getObjectByName('smartrig'+side+'Foot'),bind=originalAsset.scene.getObjectByName(foot.name),up=new T.Vector3(0,1,0).applyQuaternion(bind.getWorldQuaternion(new T.Quaternion()).invert()).applyQuaternion(foot.getWorldQuaternion(new T.Quaternion()));assert.ok(up.y>.999,'flat authored sole orientation');}assert.ok(feet[1].z-feet[0].z>.12&&feet[1].z-feet[0].z<.15,'modest prior-form stagger');}}
});

test('stance entry and exit meet the new idle and planted attack without pose discontinuities',()=>{
 const names=['smartrigHips','smartrigRightLeg','smartrigLeftLeg','smartrigRightFoot','smartrigLeftFoot','smartrigRightHand','smartrigLeftHand','RoundHand_R_Grip','RoundHand_L_Grip','Bow_Right_Hand'];
 for(const [a,ta,b,tb]of [['Idle',0,'Bow_Attack_Enter',0],['Bow_Attack_Enter',.5,'Bow_Attack',0],['Bow_Attack',0,'Bow_Attack_Exit',0],['Bow_Attack_Exit',.55,'Idle',0]]){stancePose(a,ta);const before=names.map(world);stancePose(b,tb);for(const [i,name]of names.entries())assert.ok(world(name).distanceTo(before[i])<.001,`${a} -> ${b}: ${name} jumps ${world(name).distanceTo(before[i])}`);}
});
