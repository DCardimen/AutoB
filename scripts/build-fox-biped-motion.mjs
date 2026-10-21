import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {addEquipment} from './lib/fox-equipment.mjs';
import {CLIPS,smooth} from '../public/meshy-fox-preview/fox-motion.mjs';
import {bipedTailAudit,clearBipedTail} from '../public/meshy-fox-preview/biped-tail.mjs';
import {repairBipedTailWeights} from './lib/fox-biped-tail-weights.mjs';
import {addBipedNose} from './lib/fox-biped-nose.mjs';
import {addBipedDust} from './lib/fox-biped-dust.mjs';
import {fitBipedQuiver} from './lib/fox-biped-quiver.mjs';
import {BIPED_CLIPS,JUMP,jumpPhysics,noseTwitch} from '../public/meshy-fox-preview/biped-motion.mjs';
import {bakeBipedTailWave} from './bake-fox-biped-tail-wave.mjs';
import {refineBipedRun} from './refine-fox-biped-run.mjs';
import {stabilizeBipedTail} from './stabilize-fox-biped-tail.mjs';
import {compactBiped} from './compact-fox-biped.mjs';
import {refineBipedHands} from './refine-fox-biped-hands.mjs';
import {refitBipedQuiver} from './refit-fox-biped-quiver.mjs';

globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
async function load(file){const b=fs.readFileSync(file);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const sourceFile='public/meshy-fox-preview/fox-biped-source.glb',glb=readGLB(sourceFile),g=glb.json;
g.asset.extras.tailWeights=repairBipedTailWeights(glb,sourceFile);g.asset.extras.nose=addBipedNose(glb);glb.write('playtest-artifacts/fox-biped-weights.glb');
const original=await load('public/meshy-fox-preview/fox-animated.glb'),fresh=await load('playtest-artifacts/fox-biped-weights.glb'),old=original.scene,model=fresh.scene;
const motionNode=g.nodes.push({name:'Biped_Motion_Root',children:[...g.scenes[0].nodes]})-1;g.scenes[0].nodes=[motionNode];
const motion=new T.Group();motion.name='Biped_Motion_Root';for(const o of [...model.children])motion.add(o);model.add(motion);
const aliases={Pelvis:'smartrigHips',Spine:'smartrigSpine',Chest:'smartrigSpine2',Neck:'smartrigNeck',Head:'smartrigHead'};
for(const [side,word]of [['L','Left'],['R','Right']])for(const [a,b]of [['Clavicle','Shoulder'],['UpperArm','Arm'],['Forearm','ForeArm'],['Hand','Hand'],['Thigh','UpLeg'],['Shin','Leg'],['Foot','Foot'],['Toe','ToeBase']])aliases[`${a}_${side}`]=`smartrig${word}${b}`;
const bone=n=>model.getObjectByName(aliases[n]||n),oldBone=n=>old.getObjectByName(n),pos=o=>o.getWorldPosition(new T.Vector3()),quat=o=>o.getWorldQuaternion(new T.Quaternion());
model.updateMatrixWorld(true);old.updateMatrixWorld(true);
const rest=new Map(),oldRest=new Map();for(const [a,b]of Object.entries(aliases)){const o=bone(a);if(o&&oldBone(a)){rest.set(a,{q:quat(o),p:o.position.clone(),s:o.scale.clone()});oldRest.set(a,quat(oldBone(a)));}}
const body=bone('Biped_Fox'),originalBones=[];model.traverse(o=>{if(o.isBone)originalBones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()])});
const nodes=new Map(g.nodes.map((n,i)=>[n.name,i])),equipmentBones=new Map(),world=new Map();
// Equipment is in meters. Neutral-orientation sockets compensate for the
// authored SmartRig local axes, while the original gloves and fingers remain.
for(const name of ['Hand_R','Hand_L','Chest']){
 const parent=bone(name),socket=new T.Object3D();socket.name=`Biped_${name}_Socket`;socket.quaternion.copy(quat(parent).invert().multiply(oldRest.get(name)));parent.add(socket);
 const id=g.nodes.push({name:socket.name,rotation:socket.quaternion.toArray()})-1;g.nodes[nodes.get(parent.name)].children??=[];g.nodes[nodes.get(parent.name)].children.push(id);nodes.set(socket.name,id);equipmentBones.set(name,id);world.set(name,pos(parent));
}
model.updateMatrixWorld(true);
const quiverMount=model.getObjectByName('Biped_Chest_Socket').worldToLocal(new T.Vector3(.10,.51,-.13));
const equipment=addEquipment(glb,equipmentBones,new Map([['Chest',new T.Vector3(0,.714,.035)]]));
const dustNames=addBipedDust(glb,motionNode);
g.nodes[equipment.arrow].scale=[0,0,0];
g.nodes.forEach((n,i)=>nodes.set(n.name,i));
// Attach the same geometry to the authored hands, with a uniform weapon size.
const SCALE=.65;
for(const id of [equipment.bowRoot,equipment.quiver]){
 const n=g.nodes[id];n.translation=n.translation.map(v=>v*SCALE);n.scale=[SCALE,SCALE,SCALE];
}
g.nodes[equipment.quiver].translation=quiverMount.toArray();
// Load only the added equipment via a temporary GLB, so Three's sampled
// hierarchy and the final portable asset use exactly the same local frames.
glb.write('playtest-artifacts/fox-biped-working.glb');
const complete=await load('playtest-artifacts/fox-biped-working.glb'),target=complete.scene;
// Keep our source rig instance for solving; copy gear objects from parsed asset.
for(const name of ['Biped_Hand_R_Socket','Biped_Hand_L_Socket','Biped_Chest_Socket']){
 const from=target.getObjectByName(name),to=model.getObjectByName(name);for(const child of [...from.children])to.add(child);
}
for(const name of ['Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)]){
 motion.add(target.getObjectByName(name));const id=nodes.get(name);g.scenes[0].nodes=g.scenes[0].nodes.filter(n=>n!==id);g.nodes[motionNode].children.push(id);
}
for(const name of dustNames)motion.add(target.getObjectByName(name));
const gearNames=['Bow_Right_Hand','Quiver','Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)];
const sampleNodes=[motion,...originalBones.map(([o])=>o),...gearNames.map(n=>model.getObjectByName(n)),...dustNames.map(n=>model.getObjectByName(n))];
const mixer=new T.AnimationMixer(old),outAnimations=[],audit=bipedTailAudit(body);
// The supplied chibi has shorter hip-to-knee clearance than the old proxy.
// Use its verified shallow crouch for the slide/volley and tucked aerial legs,
// rather than forcing the old proxy's deeply folded pelvis through the tunic.
const crouchSource=old.clone(true),crouchMixer=new T.AnimationMixer(crouchSource);
crouchMixer.clipAction(original.animations.find(c=>c.name===CLIPS.attackCrouched.name)).play();
const fittedLowerBody=new Set(['slideShot','crouchVolley','sideFlipLeft','sideFlipRight','vault']);
const update=()=>{model.updateMatrixWorld(true);body.skeleton.update()};
const tailRest=new T.Quaternion();
function setWorldQ(o,q){o.quaternion.copy(quat(o.parent).invert().multiply(q));o.updateMatrixWorld(true)}
function solve(side,wrist,pole,handQ){
 const a=bone(`UpperArm_${side}`),b=bone(`Forearm_${side}`),c=bone(`Hand_${side}`),start=pos(a),len1=pos(b).distanceTo(start),len2=pos(c).distanceTo(pos(b)),delta=wrist.clone().sub(start),distance=delta.length(),d=Math.min(len1+len2-.0001,Math.max(Math.abs(len1-len2)+.0001,distance)),dir=delta.normalize(),along=(len1*len1-len2*len2+d*d)/(2*d),height=Math.sqrt(Math.max(0,len1*len1-along*along)),perp=pole.clone().sub(start).addScaledVector(dir,-pole.clone().sub(start).dot(dir)).normalize(),elbow=start.clone().addScaledVector(dir,along).addScaledVector(perp,height);
 setWorldQ(a,new T.Quaternion().setFromUnitVectors(pos(b).sub(start).normalize(),elbow.clone().sub(start).normalize()).multiply(quat(a)));
 setWorldQ(b,new T.Quaternion().setFromUnitVectors(pos(c).sub(pos(b)).normalize(),wrist.clone().sub(pos(b)).normalize()).multiply(quat(b)));
 setWorldQ(c,handQ);return pos(c).distanceTo(wrist);
}
let maxWristError=0,maxTailCorrection=0,correctedFrames=0,maxQuiverShift=0,maxQuiverGap=0,minQuiverGap=Infinity;
for(const [mode,spec]of Object.entries(BIPED_CLIPS)){
 const clip=original.animations.find(c=>c.name===(spec.jumpTravel!==undefined?CLIPS.jumpShot.name:spec.name));if(!clip)throw Error(`Missing ${spec.name}`);
 mixer.stopAllAction();mixer.clipAction(clip).play();
 const regular=Array.from({length:Math.round(spec.duration*60)+1},(_,i)=>Math.min(i/60,spec.duration));regular[regular.length-1]=spec.duration;
 if(spec.acro==='jump')regular.push(.48,.65,.70,JUMP.launch-.025,JUMP.launch,JUMP.launch+JUMP.flight/2,JUMP.land,JUMP.land+.055,JUMP.land+.065,JUMP.land+JUMP.settle,JUMP.land+.31);
 const times=Float32Array.from(regular.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-6));
 const tracks=new Map(sampleNodes.map(o=>[o,{translation:[],rotation:[],scale:[]}])),morphs=new Map();
 for(const t of times){
  for(const [o,p,q,s]of originalBones){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s)}motion.position.set(0,0,0);motion.quaternion.identity();model.updateMatrixWorld(true);
  mixer.setTime(Math.min(t,spec.duration-1e-6));old.updateMatrixWorld(true);
  const jumping=spec.acro==='jump',physics=jumping?jumpPhysics(t):null;
  if(fittedLowerBody.has(mode)||jumping){crouchMixer.setTime(t%CLIPS.attackCrouched.duration);crouchSource.updateMatrixWorld(true);}
  motion.position.copy(oldBone('Root').position).multiplyScalar(.8);motion.quaternion.copy(oldBone('Root').quaternion);model.updateMatrixWorld(true);
  if(jumping){motion.position.y=0;motion.position.z=(spec.jumpTravel||0)*physics.travel;}
  if(mode==='slideShot'||mode==='crouchVolley')motion.position.y=crouchSource.getObjectByName('Root').position.y*.8;
  for(const [a]of rest){const o=bone(a),core=/^(Pelvis|Spine|Chest|Neck|Thigh_|Shin_|Foot_|Toe_)/.test(a),fitted=fittedLowerBody.has(mode)&&core,rotation=fitted?quat(oldBone('Root')).multiply(quat(crouchSource.getObjectByName(a))):quat(oldBone(a));if(jumping&&core)rotation.slerp(quat(crouchSource.getObjectByName(a)),physics.compression);const delta=rotation.multiply(oldRest.get(a).clone().invert());setWorldQ(o,delta.multiply(rest.get(a).q));}
  const oldChest=pos(oldBone('Chest')),newChest=pos(bone('Chest')),map=p=>p.clone().sub(oldChest).multiplyScalar(SCALE).add(newChest);
  for(const side of ['R','L']){
   const hand=bone(`Hand_${side}`),desired=map(pos(oldBone(`Hand_${side}`))),q=quat(hand),pole=map(pos(oldBone(`Forearm_${side}`)));
   const error=solve(side,desired,pole,q);maxWristError=Math.max(maxWristError,error);
  }
  // Keep authored tail centered at the pelvis. Flex past its root only.
  bone('Bone_019').quaternion.multiply(tailRest);
  for(let i=1;i<=4;i++){const o=bone(`Bone_${String(19-i).padStart(3,'0')}`);if(o)o.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.025*Math.sin(t*3-i*.45)));}
  model.updateMatrixWorld(true);
  for(const name of gearNames){const o=model.getObjectByName(name),from=oldBone(name);if(name==='Bow_Right_Hand'||name==='Quiver'){if(name==='Quiver')o.position.copy(quiverMount);else o.position.copy(from.position).multiplyScalar(SCALE);o.quaternion.copy(from.quaternion);continue;}o.position.copy(motion.worldToLocal(map(pos(from))));o.quaternion.copy(quat(motion).invert().multiply(from.quaternion));o.scale.copy(from.scale).multiplyScalar(SCALE);}
  // The bow's local frame is fixed to the original right glove. Flex and
  // string-draw morphs follow the source action and every arrow shares it.
  body.morphTargetInfluences.splice(0,2,...(mode==='idle'?noseTwitch(t):[0,0]));
  model.traverse(o=>{if(o.morphTargetInfluences){const from=oldBone(o.name);if(from?.morphTargetInfluences)o.morphTargetInfluences.splice(0,o.morphTargetInfluences.length,...from.morphTargetInfluences);if(!morphs.has(o))morphs.set(o,[]);morphs.get(o).push(...o.morphTargetInfluences)}});
  model.updateMatrixWorld(true);
  const oldArrow=oldBone('Arrow_Nock_and_Flight'),oldBow=oldBone('Bow_Right_Hand'),oldDraw=oldBone('BowStringDraw').morphTargetInfluences[0],oldNock=oldBow.localToWorld(new T.Vector3(.10+.13*oldDraw,.025,0));
  if(oldArrow.scale.x>.5&&pos(oldArrow).distanceTo(oldNock)<.003){
   const bow=model.getObjectByName('Bow_Right_Hand'),draw=model.getObjectByName('BowStringDraw').morphTargetInfluences[0],nock=bow.localToWorld(new T.Vector3(.10+.13*draw,.025,0)),delta=nock.clone().sub(map(pos(oldArrow)));
   for(const name of ['Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third']){const o=model.getObjectByName(name);o.position.copy(motion.worldToLocal(pos(o).add(delta)));}
   const q=quat(bone('Hand_L')),pinchOffset=new T.Vector3(.13*SCALE,0,0).applyQuaternion(quat(model.getObjectByName('Biped_Hand_L_Socket')));solve('L',nock.clone().sub(pinchOffset),map(pos(oldBone('Forearm_L'))),q);
  }
  // Preserve deliberate aerial height; only correct floor penetration.
  update();audit.skin.update();let low=Infinity;const p=new T.Vector3();for(const v of audit.unique){audit.skin.vertex(v,p);p.applyMatrix4(body.matrixWorld);low=Math.min(low,p.y)}
  const beforeGroundY=motion.position.y;
  if(jumping){motion.position.y+=.002-low+physics.height;model.updateMatrixWorld(true);}
  else if(low<.002){motion.position.y+=.002-low;model.updateMatrixWorld(true);}
  let correction;try{correction=clearBipedTail(audit,bone('Bone_019'),update);}catch(e){throw Error(`${mode} at ${t}: ${e.message}`)}if(correction){correctedFrames++;maxTailCorrection=Math.max(maxTailCorrection,correction);}
  const fit=fitBipedQuiver(model.getObjectByName('Quiver'),body,audit);maxQuiverShift=Math.max(maxQuiverShift,Math.abs(fit.shift));maxQuiverGap=Math.max(maxQuiverGap,fit.gap);minQuiverGap=Math.min(minQuiverGap,fit.gap);
  const reach=spec.bow||mode.startsWith('shoot')?smooth(.04,.18,t)*(1-smooth(.48,.82,t)):0;
  if(reach){
   const originalNock=oldBone('Quiver').localToWorld(new T.Vector3(0,.205/2+.20,0)),actualNock=model.getObjectByName('Quiver').localToWorld(new T.Vector3(0,.205/2+.20,0)),mapped=map(originalNock).add(new T.Vector3(0,motion.position.y-beforeGroundY,0)),offset=actualNock.sub(mapped).multiplyScalar(reach),left=bone('Hand_L');
   solve('L',pos(left).add(offset),pos(bone('Forearm_L')),quat(left));update();
   for(const name of ['Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third']){const o=model.getObjectByName(name);o.position.copy(motion.worldToLocal(pos(o).add(offset)));}
   clearBipedTail(audit,bone('Bone_019'),update);fitBipedQuiver(model.getObjectByName('Quiver'),body,audit);
  }
  for(const [i,name]of dustNames.entries()){
   const o=model.getObjectByName(name);o.scale.setScalar(0);if(!jumping)continue;
   const event=t<JUMP.land?JUMP.launch-.025:JUMP.land,u=(t-event)/(t<JUMP.land?.19:.28);if(u<0||u>1)continue;
   const angle=i*Math.PI/4,spread=.025+.13*u,groundZ=(spec.jumpTravel||0)*jumpPhysics(event).travel;
   o.position.copy(motion.worldToLocal(new T.Vector3(Math.cos(angle)*spread,.012+.016*Math.sin(Math.PI*u),groundZ+Math.sin(angle)*spread*.65)));o.scale.setScalar(Math.sin(Math.PI*u)*(t<JUMP.land?1:1.35));
  }
  for(const [o,track]of tracks){track.translation.push(...o.position);track.rotation.push(...o.quaternion);track.scale.push(...o.scale);}
 }
 const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[spec.duration];
 const animation={name:spec.name,samplers:[],channels:[]};
 function channel(id,path,values,type){if(values.some(v=>!Number.isFinite(v)))throw Error(`${spec.name}: nonfinite ${g.nodes[id].name}.${path}`);const output=glb.append(Float32Array.from(values),type),sampler=animation.samplers.push({input,output,interpolation:'LINEAR'})-1;animation.channels.push({sampler,target:{node:id,path}});}
 for(const [o,track]of tracks){const id=nodes.get(o.name)??(o===motion?motionNode:undefined);if(id===undefined)throw Error(o.name);for(const [path,values]of Object.entries(track))channel(id,path,values,path==='rotation'?'VEC4':'VEC3');}
 const morphed=new Set();for(const [o,values]of morphs){let p=o,id;while(p&&(id=nodes.get(p.name))===undefined)p=p.parent;if(id===undefined)throw Error(`Missing morph node ${o.name}`);if(!morphed.has(id)){channel(id,'weights',values,'SCALAR');morphed.add(id);}}
 outAnimations.push(animation);console.log(spec.name);
}
g.animations=outAnimations;g.asset.extras.scope='Base fox biped (1), reference-refined Run and archer actions. Downloaded Running motion is not added.';g.asset.extras.retarget={source:'fox-animated.glb v3',running:'Existing Run refined toward the user-provided Legolas reference; downloaded Running motion is not added.',method:'Authored bind axes, two-bone wrist IK, fitted chibi crouch, and pelvis-pinned tail. Original mesh and fingers retained.',weaponScale:SCALE,maxWristError,maxTailCorrection,correctedFrames,maxQuiverShift,minQuiverGap,maxQuiverGap};g.asset.extras.jump=JUMP;
glb.write('public/meshy-fox-preview/fox-biped.glb');console.log(JSON.stringify({clips:g.animations.length,maxWristError,output:'public/meshy-fox-preview/fox-biped.glb'}));
await refineBipedRun();await refineBipedHands();await refitBipedQuiver();bakeBipedTailWave();await stabilizeBipedTail();compactBiped();
await import('./round-fox-biped-hands.mjs');
await import('./refine-fox-biped-stances.mjs');
