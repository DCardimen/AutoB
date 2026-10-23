import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {compactBiped} from './compact-fox-biped.mjs';
import {refitBipedQuiver} from './refit-fox-biped-quiver.mjs';
import {smooth} from '../public/meshy-fox-preview/fox-motion.mjs';
import {BipedSkin} from '../public/meshy-fox-preview/biped-skin.mjs';

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const file='public/meshy-fox-preview/fox-biped.glb',glb=readGLB(file),g=glb.json;
if(g.asset.extras.naturalStances)throw Error('Stances already refined; start with the rounded-hand asset.');
async function load(file){const b=fs.readFileSync(file);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const asset=await load(file),source=await load('public/meshy-fox-preview/fox-biped-source.glb'),reference=await load('public/meshy-fox-preview/fox-animated.glb'),m=asset.scene,bind=source.scene,old=reference.scene,mix=new T.AnimationMixer(m),oldMix=new T.AnimationMixer(old);
const node=n=>m.getObjectByName(n),pos=o=>o.getWorldPosition(new T.Vector3()),q=o=>o.getWorldQuaternion(new T.Quaternion()).normalize(),setQ=(o,v)=>{o.quaternion.copy(q(o.parent).invert().multiply(v)).normalize();o.updateMatrixWorld(true);},update=()=>m.updateMatrixWorld(true);
bind.updateMatrixWorld(true);const mesh=node('Biped_Fox'),skin=new BipedSkin(mesh),chest=node('smartrigSpine2'),bindChestQ=q(bind.getObjectByName(chest.name)),frames={};
function sample(asset,mixer,name,t){mixer.stopAllAction();const a=mixer.clipAction(asset.animations.find(c=>c.name===name)).setLoop(T.LoopOnce,1);a.clampWhenFinished=true;a.play();mixer.setTime(Math.min(t,a.getClip().duration-1e-7));asset.scene.updateMatrixWorld(true);}
sample(asset,mix,'Idle',0);sample(reference,oldMix,'Idle',0);
for(const [side,short,sign]of [['Right','R',-1],['Left','L',1]]){
 const get=n=>node('smartrig'+side+n),rest=n=>bind.getObjectByName('smartrig'+side+n),upper=get('Arm'),fore=get('ForeArm'),hand=get('Hand'),thigh=get('UpLeg'),knee=get('Leg'),foot=get('Foot'),paw=node('RoundHand_'+short),grip=node('RoundHand_'+short+'_Grip');
 frames[side]={side,short,sign,upper,fore,hand,thigh,knee,foot,paw,grip,upperQ:q(rest('Arm')),foreQ:q(rest('ForeArm')),upperDir:pos(rest('ForeArm')).sub(pos(rest('Arm'))).normalize(),lowerDir:pos(rest('Hand')).sub(pos(rest('ForeArm'))).normalize(),neutralHand:rest('Hand').quaternion.clone(),footQ:q(foot),idleFoot:pos(foot),oldIdleFoot:pos(old.getObjectByName('Foot_'+short)),oldIdleFootQ:q(old.getObjectByName('Foot_'+short)),toes:mesh.skeleton.bones.filter(b=>b.name.startsWith('smartrig'+side+'Toe')),boot:[]};
}
const raw=mesh.geometry.attributes.position.array,rendered=new Set(mesh.geometry.index.array);for(const id of rendered)if(raw[id*3+2]<.13)frames[raw[id*3]<0?'Right':'Left'].boot.push(id);
const legClips=new Set(['Bow_Attack','Bow_Attack_Upright','Bow_Attack_Tilted','Bow_Attack_Double','Bow_Attack_Crouched','Bow_Attack_Enter','Bow_Attack_Exit']);
const settling=/^(Bow_Attack_(Enter|Exit)|Dodge_|Dash_|Hit_Reaction|Turn_|Quick_Turn_|Run_Stop|Duck$|Side_Flip_|Forward_Vault)/;
const objects=[...mesh.skeleton.bones.filter(b=>!/^smartrig(Right|Left)Hand(Middle|Ring|Pinky|Thumb)/.test(b.name)),...['RoundHand_R','RoundHand_L','Bow_Right_Hand','Biped_Motion_Root','Biped_Hand_R_Socket','Biped_Hand_L_Socket','Biped_Chest_Socket','Quiver'].map(node)],ids=new Map(g.nodes.map((n,i)=>[n.name,i])),shared={},report={reference:'Prior fox-animated.glb Idle and planted standing bow stance',clips:[],maximumLegError:0,maximumArmError:0,maximumSupportLowering:0};
const snapshot=()=>objects.map(o=>({o,p:o.position.clone(),q:o.quaternion.clone()}));
function meet(pose,weight){if(!pose||!weight)return;for(const s of pose){s.o.position.lerp(s.p,weight);s.o.quaternion.slerp(s.q,weight).normalize();}update();}
function solve(a,b,c,target,pole){const start=pos(a),l1=start.distanceTo(pos(b)),l2=pos(b).distanceTo(pos(c)),delta=target.clone().sub(start),d=Math.max(Math.abs(l1-l2)+.0001,Math.min(l1+l2-.0001,delta.length())),dir=delta.normalize(),along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),perp=pole.clone().sub(start);perp.addScaledVector(dir,-perp.dot(dir)).normalize();const elbow=start.clone().addScaledVector(dir,along).addScaledVector(perp,height);setQ(a,new T.Quaternion().setFromUnitVectors(pos(b).sub(start).normalize(),elbow.clone().sub(start).normalize()).multiply(q(a)));setQ(b,new T.Quaternion().setFromUnitVectors(pos(c).sub(pos(b)).normalize(),target.clone().sub(pos(b)).normalize()).multiply(q(b)));return pos(c).distanceTo(target);}
for(const clip of asset.animations){
 const legs=legClips.has(clip.name),arms=clip.name==='Idle'||settling.test(clip.name);if(!legs&&!arms)continue;
 sample(asset,mix,clip.name,0);sample(reference,oldMix,clip.name,0);
 const original=objects.map(o=>({o,p:clip.tracks.find(t=>t.name===o.name+'.position')?.createInterpolant(),r:clip.tracks.find(t=>t.name===o.name+'.quaternion')?.createInterpolant(),restP:o.position.clone(),restQ:o.quaternion.clone()})),animation=g.animations.find(a=>a.name===clip.name),times=Float32Array.from([...new Set(Array.from({length:Math.ceil(clip.duration*120)+1},(_,i)=>Math.fround(Math.min(i/120,clip.duration))))]),tracks=new Map(objects.map(o=>[o,{translation:[],rotation:[]}])) ;
 for(const t of times){
  const sampleTime=Math.min(t,clip.duration-1e-7);mix.setTime(sampleTime);oldMix.setTime(sampleTime);old.updateMatrixWorld(true);for(const s of original){s.o.position.copy(s.restP);s.o.quaternion.copy(s.restQ);if(s.p)s.o.position.fromArray(s.p.evaluate(sampleTime));if(s.r)s.o.quaternion.fromArray(s.r.evaluate(sampleTime));}update();
  if(legs){
   const legWeight=clip.name==='Bow_Attack_Enter'?smooth(0,.35,t):clip.name==='Bow_Attack_Exit'?1-smooth(.10,clip.duration,t):1,targets=new Map();let lower=0;
   for(const f of Object.values(frames)){const offset=pos(old.getObjectByName('Foot_'+f.short)).sub(f.oldIdleFoot).multiplyScalar(.65),target=f.idleFoot.clone().add(offset);target.y=f.idleFoot.y+Math.max(0,offset.y);targets.set(f,{offset,target});const start=pos(f.thigh),length=start.distanceTo(pos(f.knee))+pos(f.knee).distanceTo(pos(f.foot)),dy=start.y-target.y,horizontal=(start.x-target.x)**2+(start.z-target.z)**2,maximum=length-(.0001+.003*legWeight),allowed=Math.sqrt(Math.max(0,maximum*maximum-horizontal));lower=Math.max(lower,dy-allowed);}
   if(lower>0){node('Biped_Motion_Root').position.y-=lower;report.maximumSupportLowering=Math.max(report.maximumSupportLowering,lower);update();}
   for(const f of Object.values(frames)){
    const oldFoot=old.getObjectByName('Foot_'+f.short),{offset,target}=targets.get(f);
    const delta=q(oldFoot).multiply(f.oldIdleFootQ.clone().invert()),axis=new T.Vector3(0,0,1).applyQuaternion(delta),yaw=Math.max(-.18,Math.min(.18,Math.atan2(axis.x,axis.z))),footQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw).multiply(f.footQ),pole=pos(f.knee).lerp(pos(f.thigh).add(new T.Vector3(0,-.10,.25)),legWeight);
    for(let i=0;i<3;i++){
     const error=solve(f.thigh,f.knee,f.foot,target,pole);if(i===2)report.maximumLegError=Math.max(report.maximumLegError,error);setQ(f.foot,footQ);for(const toe of f.toes)toe.quaternion.copy(bind.getObjectByName(toe.name).quaternion);update();skin.update();let sole=Infinity;const p=new T.Vector3();for(const id of f.boot){skin.vertex(id,p).applyMatrix4(mesh.matrixWorld);sole=Math.min(sole,p.y);}if(i<2)target.y+=.002+Math.max(0,offset.y)-sole;
    }
   }
  }
  let weight=clip.name==='Idle'?1:0;
  if(arms&&clip.name!=='Idle'){
   if(clip.name==='Bow_Attack_Enter')weight=1-smooth(0,.27,t);
   else if(clip.name==='Bow_Attack_Exit')weight=smooth(.20,clip.duration,t);
   else weight=Math.max(1-smooth(0,Math.min(.18,clip.duration*.22),t),smooth(clip.duration-Math.min(.23,clip.duration*.30),clip.duration,t));
  }
  if(weight>0){
   const poseDelta=q(chest).multiply(bindChestQ.clone().invert()),bow=node('Bow_Right_Hand'),bowQ=q(bow);
   for(const f of Object.values(frames)){
    const shoulder=pos(f.upper),target=shoulder.clone().add(new T.Vector3(f.sign*.034,-.226,.020).applyQuaternion(poseDelta)),wrist=pos(f.hand).lerp(target,weight),pole=shoulder.clone().add(new T.Vector3(f.sign*.016,-.12,.080).applyQuaternion(poseDelta)),originalPawQ=q(f.paw);
    report.maximumArmError=Math.max(report.maximumArmError,solve(f.upper,f.fore,f.hand,wrist,pole));
    // Restore the authored neutral wrist; the simple rigid hand turns inward.
    f.hand.quaternion.copy(f.neutralHand);update();const y=new T.Vector3(0,-1,.035).normalize().applyQuaternion(poseDelta),z=new T.Vector3(-f.sign,0,0).applyQuaternion(poseDelta);z.addScaledVector(y,-z.dot(y)).normalize();const x=new T.Vector3().crossVectors(y,z).normalize(),palmQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));setQ(f.paw,originalPawQ.slerp(palmQ,weight));
   }
   const y=new T.Vector3(0,Math.cos(.55),Math.sin(.55)).applyQuaternion(poseDelta),x=new T.Vector3(-1,0,0).applyQuaternion(poseDelta),z=new T.Vector3().crossVectors(x,y).normalize(),carryQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));bow.position.copy(bow.parent.worldToLocal(pos(frames.Right.grip)));setQ(bow,bowQ.slerp(carryQ,weight));update();
  }
  if(clip.name==='Bow_Attack_Enter'){meet(shared.Idle,1-smooth(0,.13,t));meet(shared.Attack,smooth(.32,clip.duration,t));}
  if(clip.name==='Bow_Attack_Exit'){meet(shared.Attack,1-smooth(0,.15,t));meet(shared.Idle,smooth(clip.duration-.20,clip.duration,t));}
  if(clip.name==='Bow_Attack_Enter'||clip.name==='Bow_Attack_Exit'){
   update();skin.update();let sole=Infinity;const p=new T.Vector3();for(const f of Object.values(frames))for(const id of f.boot){skin.vertex(id,p).applyMatrix4(mesh.matrixWorld);sole=Math.min(sole,p.y);}node('Biped_Motion_Root').position.y+=Math.max(0,.002-sole);update();
  }
  if(t===0&&clip.name==='Idle')shared.Idle=snapshot();if(t===0&&clip.name==='Bow_Attack')shared.Attack=snapshot();
  for(const [o,values]of tracks){values.translation.push(...o.position);values.rotation.push(...o.quaternion.normalize());}
 }
 const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];for(const [o,values]of tracks)for(const [path,data]of Object.entries(values)){const id=ids.get(o.name),sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(data),path==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path===path));animation.channels.push({sampler,target:{node:id,path}});}
 report.clips.push({clip:clip.name,legs,arms});console.log('Natural stance',clip.name);
}
g.asset.extras.naturalStances={...report,method:'Prior-form foot offsets, flat authored boots, forward knee poles, relaxed arms beside thighs and a lowered side bow. Idle transitions ease into the same rest pose.'};glb.write(file);compactBiped();fs.mkdirSync('docs/evidence/fox-natural-stances',{recursive:true});fs.writeFileSync('docs/evidence/fox-natural-stances/build.json',JSON.stringify(report,null,2)+'\n');console.log(report);
await refitBipedQuiver({clips:report.clips.filter(c=>c.arms&&c.clip!=='Idle').map(c=>c.clip),output:'docs/evidence/fox-natural-stances'});compactBiped();
