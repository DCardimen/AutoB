import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CLIPS,NOCK,RELEASE} from '../public/meshy-fox-preview/fox-motion.mjs';
import {FoxActor} from '../public/meshy-fox-preview/fox-actor.mjs';
import {FoxAcrobatics,ACROBATICS} from '../public/meshy-fox-preview/fox-acrobatics.mjs';
import {readGLB} from '../scripts/lib/glb.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-animated.glb');
const load=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
const asset=await load(),model=asset.scene,mixer=new T.AnimationMixer(model),node=n=>model.getObjectByName(n),W=n=>node(n).getWorldPosition(new T.Vector3());
function pose(mode,t){mixer.stopAllAction();mixer.clipAction(asset.animations.find(c=>c.name===CLIPS[mode].name)).setLoop(T.LoopOnce,1).play();mixer.setTime(Math.min(t,CLIPS[mode].duration-1e-6));model.updateMatrixWorld(true);node('FoxMesh').skeleton.update();}

test('the complete tail registers behind the pelvis and its proximal fur has no thigh ownership',()=>{
 pose('idle',0);const root=node('Tail_00'),pelvis=node('Pelvis');assert.equal(root.parent,pelvis);
 const socket=pelvis.worldToLocal(W('Tail_00'));assert.ok(Math.abs(socket.x)<1e-6&&socket.z<-.22&&socket.y>.07,`sacral socket ${socket.toArray()}`);
 const glb=readGLB('public/meshy-fox-preview/fox-animated.glb'),g=glb.json,p=g.meshes[0].primitives[0],j=glb.read(p.attributes.JOINTS_0),w=glb.read(p.attributes.WEIGHTS_0),names=g.skins[0].joints.map(id=>g.nodes[id].name),src=readGLB('public/meshy-fox-preview/fox-repaired.glb'),sp=src.read(src.json.meshes[0].primitives[0].attributes.POSITION);
 let checked=0;for(let i=0;i<sp.length/3;i++){let tail=0,thigh=0;for(let k=0;k<4;k++){if(names[j[i*4+k]].startsWith('Tail_'))tail+=w[i*4+k];if(/Thigh|Shin|Foot/.test(names[j[i*4+k]]))thigh+=w[i*4+k];}if(tail>.5){assert.ok(thigh<1e-7,`tail vertex ${i} follows leg`);checked++;}}
 assert.ok(checked>500,`full tail coverage: ${checked}`);
});

test('the sniff lifts the nose pad without extending the muzzle or moving the mouth',()=>{
 const glb=readGLB('public/meshy-fox-preview/fox-animated.glb'),g=glb.json,head=g.meshes.find(m=>m.name==='FoxHead'),target=head.primitives[0].targets[head.extras.targetNames.indexOf('Nose_Sniff')],delta=glb.read(target.POSITION),source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),p=source.read(source.json.meshes[0].primitives[0].attributes.POSITION);let lifted=0;
 for(let i=0;i<delta.length;i+=3){assert.equal(delta[i+2],0,'no forward extrusion');if(p[i+1]<1.0)assert.ok(Math.hypot(...delta.slice(i,i+3))<1e-9,'mouth stays still');lifted=Math.max(lifted,delta[i+1]);}assert.ok(lifted>.002&&lifted<=.00261);
});

test('jump shots and flips leave the ground, keep the head clear, and land upright',()=>{
 for(const mode of ['jumpShot','sideFlipLeft','sideFlipRight','vault']){
  pose(mode,0);const ground=W('Foot_L').y;let air=0;
  for(let f=0;f<=Math.round(CLIPS[mode].duration*60);f++){pose(mode,f/60);air=Math.max(air,Math.min(W('Foot_L').y,W('Foot_R').y)-ground);if(mode.startsWith('sideFlip')){const head=node('Fox_Head');for(const id of new Set(head.geometry.index.array)){const p=head.getVertexPosition(id,new T.Vector3()).applyMatrix4(head.matrixWorld);assert.ok(p.y>=-.001,`${mode} head hits the floor at ${f/60}`);}}}
  assert.ok(air>.25,`${mode} really airborne ${air}`);pose(mode,CLIPS[mode].duration);assert.ok(Math.abs(W('Foot_L').y-ground)<1e-5,'returns to the sole height');assert.ok(new T.Vector3(0,1,0).applyQuaternion(node('Chest').getWorldQuaternion(new T.Quaternion())).y>.99,'upright landing');
 }
 for(const [mode,axis,distance]of [['slideShot','z',.72],['vault','z',.78],['sideFlipLeft','x',-.70],['sideFlipRight','x',.70]]){pose(mode,CLIPS[mode].duration);assert.ok(Math.abs(node('Root').position[axis]-distance)<1e-5,`${mode} physical travel`);}
});

test('all acrobatic shots keep their arrow on the string, a horizontal bow and distinct multi-arrow flight',()=>{
 for(const mode of ['jumpShot','slideShot','crouchVolley'])for(let f=Math.ceil((NOCK+.02)*120);f<RELEASE*120;f++){
  pose(mode,f/120);const bow=node('Bow_Right_Hand'),draw=node('BowStringDraw').morphTargetInfluences[0],nock=bow.localToWorld(new T.Vector3(.10+.13*draw,.025,0)),hand=node('Hand_L').localToWorld(new T.Vector3(.13,0,0));assert.ok(nock.distanceTo(hand)<.0006,`${mode} string contact`);assert.ok(W('Arrow_Nock_and_Flight').distanceTo(nock)<.0006,`${mode} arrow contact`);
 }
 pose('crouchVolley',1.15);const tangent=new T.Vector3(0,1,0).applyQuaternion(node('Bow_Right_Hand').getWorldQuaternion(new T.Quaternion()));assert.ok(Math.abs(tangent.x)>.9,'bow rolled sideways');
 const names=['Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third'];for(const name of names)assert.ok(node(name).scale.x>.999);const before=names.map(W);pose('crouchVolley',RELEASE+.25);for(let i=0;i<3;i++)assert.ok(W(names[i]).z-before[i].z>.5,'every arrow flies');assert.ok(W(names[1]).distanceTo(W(names[2]))>.1,'volley fans out');
});

test('runtime commits acrobatic travel and blends into crouched volleys and back',async()=>{
 const actor=new FoxActor(await load());for(const mode of ['sideFlipLeft','vault','sideFlipRight']){actor.play(mode);for(let i=0;i<Math.ceil((CLIPS[mode].duration+.35)*60);i++)actor.step(1/60);assert.equal(actor.mode,'idle');}
 assert.ok(Math.abs(actor.model.position.x)<.001&&Math.abs(actor.model.position.z-.78)<.001,'root motion survives the handover');
 actor.play('crouchVolley');for(let i=0;i<220;i++)actor.step(1/60);actor.play('run');for(let i=0;i<80;i++)actor.step(1/60);actor.stop();for(let i=0;i<80;i++)actor.step(1/60);assert.equal(actor.mode,'idle');
});

test('the visible acrobatic combo performs every requested move through the runtime',async()=>{
 const routine=new FoxAcrobatics(await load());for(let i=0;i<Math.ceil(routine.duration*60)+1;i++)routine.step(1/60);assert.ok(routine.done);for(const [mode]of ACROBATICS)assert.ok(routine.actor.history.some(h=>h.mode===mode),mode);assert.equal(routine.actor.mode,'idle');
});
