import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {compactBiped} from './compact-fox-biped.mjs';
import {refitBipedQuiver} from './refit-fox-biped-quiver.mjs';
import {NOCK,RELEASE,smooth} from '../public/meshy-fox-preview/fox-motion.mjs';

// Anatomical arms for the biped's resting, travelling and reaction clips.
// The original retarget mapped the prior proxy's hands 0.65x toward the chest;
// with the biped's longer arms that folds each elbow ~100 degrees and the
// outward pole raises the upper arm to the horizontal (a T-pose chicken wing),
// while Idle bent the elbows backwards. Arms are instead built in the chest
// frame from three angles: abduction from the side, forward flexion and an
// elbow that only flexes forward. Motion comes from the prior form's arm
// angles relative to its own idle, so timing and character are kept and the
// clip ends meet the same rest pose. Walk adds a counter-swing taken from the
// biped's own thighs; Run keeps its authored pump with the arms brought in.
// Shots rest in the same pose before the quiver reach and after the follow-
// through; their raise, nock, draw and release keep the weapon contacts, as do
// the tucked acrobatics.
export const ARMS={rest:{abd:17,flex:7,bend:36,inward:9},abd:[12,72],bend:[16,128],walkSwing:.55,runAbd:[15,30]};
const RAD=Math.PI/180,X=new T.Vector3(1,0,0),Z=new T.Vector3(0,0,1),DOWN=new T.Vector3(0,-1,0);

// Unit upper-arm and forearm directions in bind-world (chest delta) axes.
export function armVectors(sign,{abd,flex,bend,inward}){
 const u=DOWN.clone().applyAxisAngle(Z,sign*abd*RAD).applyAxisAngle(X,-flex*RAD),hint=Z.clone().addScaledVector(new T.Vector3(0,1,0),Math.max(0,u.z)).normalize(),axis=u.clone().cross(hint).normalize();
 const f=u.clone().applyAxisAngle(axis,bend*RAD).add(new T.Vector3(-sign*Math.sin(inward*RAD),0,0)).normalize();
 return {u,f};
}
export function armAngles(sign,u,f){return {abd:Math.asin(Math.max(-1,Math.min(1,sign*u.x)))/RAD,flex:Math.atan2(u.z,-u.y)/RAD,bend:u.angleTo(f)/RAD};}

export async function refineBipedArms({file='public/meshy-fox-preview/fox-biped.glb',evidence='docs/evidence/fox-natural-arms',refit=true}={}){
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
 const glb=readGLB(file),g=glb.json;if(g.asset.extras.naturalArms)throw Error('Arms already refined; start with the natural-stance asset.');
 async function load(f){const b=fs.readFileSync(f);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
 const asset=await load(file),source=await load('public/meshy-fox-preview/fox-biped-source.glb'),reference=await load('public/meshy-fox-preview/fox-animated.glb'),m=asset.scene,bind=source.scene,old=reference.scene,mix=new T.AnimationMixer(m),oldMix=new T.AnimationMixer(old);
 const node=n=>m.getObjectByName(n),pos=o=>o.getWorldPosition(new T.Vector3()),q=o=>o.getWorldQuaternion(new T.Quaternion()).normalize(),update=()=>m.updateMatrixWorld(true),setQ=(o,v)=>{o.quaternion.copy(q(o.parent).invert().multiply(v)).normalize();o.updateMatrixWorld(true)};
 bind.updateMatrixWorld(true);old.updateMatrixWorld(true);
 const chest=node('smartrigSpine2'),bindChest=q(bind.getObjectByName('smartrigSpine2')),oldChest=old.getObjectByName('Chest'),oldBindChest=q(oldChest),bow=node('Bow_Right_Hand'),ids=new Map(g.nodes.map((n,i)=>[n.name,i]));
 const sides=[['Right','R',-1],['Left','L',1]].map(([side,short,sign])=>{const get=n=>node('smartrig'+side+n),upper=get('Arm'),fore=get('ForeArm'),hand=get('Hand');return {side,short,sign,upper,fore,hand,paw:node('RoundHand_'+short),grip:node('RoundHand_'+short+'_Grip'),thigh:get('UpLeg'),knee:get('Leg'),l1:pos(upper).distanceTo(pos(fore)),l2:pos(fore).distanceTo(pos(hand)),neutralHand:bind.getObjectByName(hand.name).quaternion.clone(),old:['UpperArm','Forearm','Hand'].map(n=>old.getObjectByName(`${n}_${short}`))};});
 const delta=()=>q(chest).multiply(bindChest.clone().invert()),oldDelta=()=>q(oldChest).multiply(oldBindChest.clone().invert());
 const oldAngles=s=>{const inv=oldDelta().invert(),[a,b,c]=s.old.map(pos);return armAngles(s.sign,b.clone().sub(a).applyQuaternion(inv).normalize(),c.clone().sub(b).applyQuaternion(inv).normalize());};
 const curAngles=s=>{const inv=delta().invert(),a=pos(s.upper),b=pos(s.fore),c=pos(s.hand);return armAngles(s.sign,b.clone().sub(a).applyQuaternion(inv).normalize(),c.clone().sub(b).applyQuaternion(inv).normalize());};
 const thighFlex=s=>{const inv=q(node('smartrigHips')).invert(),d=pos(s.knee).sub(pos(s.thigh)).applyQuaternion(inv);return Math.atan2(d.z,-d.y)/RAD;};
 function solve(s,target,pole){const start=pos(s.upper),d=Math.max(Math.abs(s.l1-s.l2)+.0001,Math.min(s.l1+s.l2-.0001,target.distanceTo(start))),dir=target.clone().sub(start).normalize(),along=(s.l1*s.l1-s.l2*s.l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,s.l1*s.l1-along*along)),perp=pole.clone().sub(start);perp.addScaledVector(dir,-perp.dot(dir)).normalize();const elbow=start.clone().addScaledVector(dir,along).addScaledVector(perp,height);
  setQ(s.upper,new T.Quaternion().setFromUnitVectors(pos(s.fore).sub(start).normalize(),elbow.clone().sub(start).normalize()).multiply(q(s.upper)));setQ(s.fore,new T.Quaternion().setFromUnitVectors(pos(s.hand).sub(pos(s.fore)).normalize(),target.clone().sub(pos(s.fore)).normalize()).multiply(q(s.fore)));return pos(s.hand).distanceTo(target);}
 // Pose one arm from model angles; the round paw follows the forearm with a
 // slight relaxed droop, palm facing the body.
 function pose(s,angles){const C=delta(),{u,f}=armVectors(s.sign,angles),start=pos(s.upper),elbow=start.clone().addScaledVector(u.clone().applyQuaternion(C),s.l1),wrist=elbow.clone().addScaledVector(f.clone().applyQuaternion(C),s.l2),error=solve(s,wrist,elbow);
  s.hand.quaternion.copy(s.neutralHand);update();const y=f.clone().multiplyScalar(.7).addScaledVector(DOWN,.3).normalize().applyQuaternion(C),z=new T.Vector3(-s.sign,0,0).applyQuaternion(C);z.addScaledVector(y,-z.dot(y)).normalize();setQ(s.paw,new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3().crossVectors(y,z).normalize(),y,z)));return error;}
 const shots=new Set(asset.animations.filter(c=>{mix.stopAllAction();mix.clipAction(c).play();mix.setTime(Math.min(NOCK+.05,c.duration-1e-6));update();return c.duration>RELEASE&&node('Arrow_Nock_and_Flight').getWorldScale(new T.Vector3()).x>.1}).map(c=>c.name));
 sides.forEach(s=>{mix.stopAllAction();oldMix.stopAllAction();oldMix.clipAction(reference.animations.find(c=>c.name==='Idle')).play();oldMix.setTime(0);old.updateMatrixWorld(true);s.oldRest=oldAngles(s);});
 const objects=[...sides.flatMap(s=>[s.upper,s.fore,s.hand,s.paw]),bow],report={rest:ARMS.rest,clips:[],maxArmError:0,maxAbduction:0,minElbowBend:180,backwardElbowFrames:0};
 for(const clip of asset.animations){
  if(/Side_Flip|Forward_Vault/.test(clip.name))continue;
  const walk=clip.name==='Walk',run=clip.name==='Run',shot=shots.has(clip.name),ready=shot||/^Bow_Attack_(Enter|Exit)$/.test(clip.name),oldClip=reference.animations.find(c=>c.name===clip.name);
  if(!oldClip&&!run&&!ready)throw Error(`Prior form has no ${clip.name}`);
  const animation=g.animations.find(a=>a.name===clip.name),times=Float32Array.from([...new Set(Array.from({length:Math.ceil(clip.duration*120)+1},(_,i)=>Math.fround(Math.min(i/120,clip.duration))))]),tracks=new Map(objects.map(o=>[o,{translation:[],rotation:[]}]));
  mix.stopAllAction();mix.clipAction(clip).setLoop(T.LoopOnce,1).play();oldMix.stopAllAction();if(oldClip)oldMix.clipAction(oldClip).setLoop(T.LoopOnce,1).play();
  let clipError=0,clipAbd=0,clipBend=180;
  for(const t of times){
   const sample=Math.min(t,clip.duration-1e-7);mix.setTime(sample);update();if(oldClip&&!ready){oldMix.setTime(sample);old.updateMatrixWorld(true);}
   // The mixer skips unchanged hold keys; restore sampled values after each edit.
   const sampled=objects.map(o=>[o,o.position.clone(),o.quaternion.clone()]),bowQ=q(bow);
   // Shots blend each arm out before its action: the drawing arm before the
   // quiver reach, the bow arm before the raise.
   const weights=shot?[Math.max(1-smooth(.12,.42,t),smooth(1.75,2.10,t)),Math.max(1-smooth(0,.16,t),smooth(1.80,2.12,t))]:[1,1];
   const swing=walk?(thighFlex(sides[0])-thighFlex(sides[1]))/2:0;
   for(const s of sides){
    let a;
    if(run){const c=curAngles(s);a={...c,abd:Math.max(ARMS.runAbd[0],Math.min(ARMS.runAbd[1],ARMS.rest.abd+(c.abd-46)*.3)),inward:ARMS.rest.inward};}
    else if(ready)a={...ARMS.rest};
    else{const o=oldAngles(s),r=ARMS.rest;a={abd:r.abd+(o.abd-s.oldRest.abd)*.8,flex:r.flex+(o.flex-s.oldRest.flex)+s.sign*ARMS.walkSwing*swing,bend:r.bend+(o.bend-s.oldRest.bend)+(walk?.3*Math.max(0,s.sign*swing*ARMS.walkSwing):0),inward:r.inward};}
    a.abd=Math.max(ARMS.abd[0],Math.min(ARMS.abd[1],a.abd));a.bend=Math.max(ARMS.bend[0],Math.min(ARMS.bend[1],a.bend));
    clipError=Math.max(clipError,pose(s,a));
   }
   // The bow keeps its authored carry orientation, held at the new grip.
   bow.position.copy(bow.parent.worldToLocal(pos(sides[0].grip)));setQ(bow,bowQ);update();
   if(shot){const right=new Set([sides[0].upper,sides[0].fore,sides[0].hand,sides[0].paw,bow]);for(const [o,p,r]of sampled){const w=weights[right.has(o)?0:1];o.position.lerp(p,1-w);o.quaternion.slerp(r,1-w).normalize();}update();}
   for(const s of sides){const c=curAngles(s);clipAbd=Math.max(clipAbd,c.abd);clipBend=Math.min(clipBend,c.bend);const inv=delta().invert(),u=pos(s.fore).sub(pos(s.upper)).applyQuaternion(inv).normalize(),f=pos(s.hand).sub(pos(s.fore)).applyQuaternion(inv).normalize(),d=f.clone().addScaledVector(u,-f.dot(u));if(weights[0]===1&&weights[1]===1&&d.length()>.1&&d.z<-.02)report.backwardElbowFrames++;}
   for(const [o,v]of tracks){v.translation.push(...o.position);v.rotation.push(...o.quaternion.normalize());}
   for(const [o,p,r]of sampled){o.position.copy(p);o.quaternion.copy(r);}
  }
  const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];
  for(const [o,values]of tracks)for(const [key,data]of Object.entries(values)){const id=ids.get(o.name),sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(data),key==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path===key));animation.channels.push({sampler,target:{node:id,path:key}});}
  report.clips.push({clip:clip.name,maxArmError:clipError,maxAbduction:clipAbd,minElbowBend:clipBend});report.maxArmError=Math.max(report.maxArmError,clipError);report.maxAbduction=Math.max(report.maxAbduction,clipAbd);report.minElbowBend=Math.min(report.minElbowBend,clipBend);
  console.log('Arms',clip.name,clipError.toFixed(5),clipAbd.toFixed(1),clipBend.toFixed(1));
 }
 g.asset.extras.naturalArms={...report,method:'Chest-frame abduction/flexion/forward-only elbow model driven by the prior form arm angles relative to its idle; Walk counter-swing from the thighs; Run pump kept with arms brought in; bow carry orientation kept at the new grip.'};
 glb.write(file);compactBiped(file);
 if(evidence){fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(`${evidence}/build.json`,JSON.stringify(report,null,2)+'\n');}
 if(refit){await refitBipedQuiver({clips:report.clips.map(c=>c.clip),output:evidence||undefined});compactBiped(file);}
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await refineBipedArms());
