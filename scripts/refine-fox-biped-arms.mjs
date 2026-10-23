import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {compactBiped} from './compact-fox-biped.mjs';
import {refitBipedQuiver} from './refit-fox-biped-quiver.mjs';
import {NOCK,RELEASE} from '../public/meshy-fox-preview/fox-motion.mjs';

// Anatomical arms for the biped. The original retarget mapped the prior
// proxy's hands 0.65x toward the chest; with the biped's longer arms that
// folds each elbow ~100 degrees and the outward pole raises the upper arm to
// the horizontal (a T-pose chicken wing), while Idle bent the elbows
// backwards. Arms are instead built in the chest frame from abduction,
// forward flexion and an elbow that only flexes forward, with the bone roll
// taken from that elbow hinge rather than inherited, so a sleeve never flips.
// Motion comes from the prior form's arm angles relative to its own idle, so
// timing is kept and clip ends meet one rest pose. On top of that:
// - the bow arm and the empty arm rest differently: the bow arm bends to carry
//   the weapon, the free paw hangs looser and a little back;
// - Idle breathes through the arms;
// - the forearm lags and settles behind the upper arm, and the arms trail the
//   body through turns (overlapping action);
// - Walk counter-swings from the thighs and Run keeps its pump, the free arm
//   fuller than the bow arm;
// - shots rest in the same pose before the quiver reach and after the
//   follow-through, eased with C2 blends; raise, nock, draw and release keep
//   their weapon contacts;
// - the bow keeps one carry orientation that swings with its arm.
// Finally every arm, paw and bow track is scanned for one-frame snaps (IK
// elbow flips, roll flips, the drawing paw jumping to the quiver), which are
// eased into over a short lead-in, leaving every pose after the snap intact.
export const ARMS={
 rest:{Right:{abd:15,flex:7,bend:38,inward:8},Left:{abd:14,flex:-3,bend:31,inward:5}},
 abd:[11,72],bend:[14,128],
 swing:{Right:.40,Left:.75},runPump:{Right:.80,Left:1.10},runAbd:[15,30],
 breath:{period:4,abd:1.0,flex:.8,bend:1.8},
 overlap:{hz:2.6,damping:.45,gain:.55},turnLag:{tau:.12,flex:3.0,abd:1.5},
 pop:{degrees:12,lead:.15},carry:{tilt:.55,follow:.4},
};
const RAD=Math.PI/180,X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0),Z=new T.Vector3(0,0,1),DOWN=new T.Vector3(0,-1,0);
const smoother=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*x*(x*(6*x-15)+10);};

// Unit upper-arm and forearm directions and the elbow hinge, in bind-world
// (chest delta) axes. The forearm turns about the hinge toward the front.
export function armVectors(sign,{abd,flex,bend,inward}){
 const u=DOWN.clone().applyAxisAngle(Z,sign*abd*RAD).applyAxisAngle(X,-flex*RAD),hint=Z.clone().addScaledVector(Y,Math.max(0,u.z)).normalize(),axis=u.clone().cross(hint).normalize();
 const f=u.clone().applyAxisAngle(axis,bend*RAD).add(new T.Vector3(-sign*Math.sin(inward*RAD),0,0)).normalize();
 return {u,f,axis};
}
export function armAngles(sign,u,f){return {abd:Math.asin(Math.max(-1,Math.min(1,sign*u.x)))/RAD,flex:Math.atan2(u.z,-u.y)/RAD,bend:u.angleTo(f)/RAD};}
const frame=(d,h)=>{const x=d.clone().normalize(),y=h.clone().addScaledVector(x,-h.dot(x)).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,new T.Vector3().crossVectors(x,y)));};

// Ease one-frame snaps in sampled local tracks, per group of channels that
// move together (one arm, its paw, socket and held bow). Each snap is
// approached over a short lead-in ending exactly on the post-snap pose; when
// the lead-in would enter a protected interval (a nocked string hold) the
// snap is instead eased out over the frames after it.
export function easePops(times,channels,{groups=[channels.map((_,i)=>i)],protect=[],degrees=ARMS.pop.degrees,lead=ARMS.pop.lead}={}){
 const n=times.length,inside=t=>protect.some(([a,b])=>t>=a&&t<=b);let count=0;
 const jump=(c,i)=>(c.rotation&&new T.Quaternion().fromArray(c.rotation,(i-1)*4).angleTo(new T.Quaternion().fromArray(c.rotation,i*4))>degrees*RAD)||(c.translation&&new T.Vector3().fromArray(c.translation,(i-1)*3).distanceTo(new T.Vector3().fromArray(c.translation,i*3))>.02);
 const blend=(group,from,to,a,b)=>{for(const k of group){const c=channels[k];for(let j=a;j<b;j++){const w=smoother(times[from],times[to],times[j]);
  if(c.rotation){const p=new T.Quaternion().fromArray(c.rotation,from*4),q2=new T.Quaternion().fromArray(c.rotation,to*4);p.slerp(q2,w).normalize().toArray(c.rotation,j*4);}
  if(c.translation){const p=new T.Vector3().fromArray(c.translation,from*3),q2=new T.Vector3().fromArray(c.translation,to*3);p.lerp(q2,w).toArray(c.translation,j*3);}}}};
 for(const group of groups)for(let i=1;i<n;i++){
  if(!group.some(k=>jump(channels[k],i))||inside(times[i]))continue;
  // Larger snaps get longer lead-ins, at most ~450 degrees per second.
  const size=Math.max(...group.map(k=>channels[k].rotation?new T.Quaternion().fromArray(channels[k].rotation,(i-1)*4).angleTo(new T.Quaternion().fromArray(channels[k].rotation,i*4))/RAD:0)),span=Math.min(.35,Math.max(lead,size/450));
  let s=i;while(s>1&&times[i]-times[s-1]<=span&&!inside(times[s-1]))s--;
  if(times[i]-times[s-1]>=span*.6||!inside(times[s-1])){blend(group,s-1,i,s,i);count++;continue;}
  let e=i;while(e<n-1&&times[e+1]-times[i-1]<=span)e++;blend(group,i-1,e,i,e);count++;i=e;
 }
 return count;
}

export async function refineBipedArms({file='public/meshy-fox-preview/fox-biped.glb',evidence='docs/evidence/fox-fluid-combat',refit=true}={}){
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
 const glb=readGLB(file),g=glb.json;if(g.asset.extras.naturalArms)throw Error('Arms already refined; start with the natural-stance asset.');
 async function load(f){const b=fs.readFileSync(f);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
 const asset=await load(file),source=await load('public/meshy-fox-preview/fox-biped-source.glb'),reference=await load('public/meshy-fox-preview/fox-animated.glb'),m=asset.scene,bind=source.scene,old=reference.scene,mix=new T.AnimationMixer(m),oldMix=new T.AnimationMixer(old);
 const node=n=>m.getObjectByName(n),pos=o=>o.getWorldPosition(new T.Vector3()),q=o=>o.getWorldQuaternion(new T.Quaternion()).normalize(),update=()=>m.updateMatrixWorld(true),setQ=(o,v)=>{o.quaternion.copy(q(o.parent).invert().multiply(v)).normalize();o.updateMatrixWorld(true)};
 bind.updateMatrixWorld(true);old.updateMatrixWorld(true);
 const chest=node('smartrigSpine2'),bindChest=q(bind.getObjectByName('smartrigSpine2')),oldChest=old.getObjectByName('Chest'),oldBindChest=q(oldChest),bow=node('Bow_Right_Hand'),ids=new Map(g.nodes.map((n,i)=>[n.name,i]));
 const sides=[['Right','R',-1],['Left','L',1]].map(([side,short,sign])=>{const get=n=>node('smartrig'+side+n),bget=n=>bind.getObjectByName('smartrig'+side+n),upper=get('Arm'),fore=get('ForeArm'),hand=get('Hand'),bu=pos(bget('ForeArm')).sub(pos(bget('Arm'))).normalize(),bf=pos(bget('Hand')).sub(pos(bget('ForeArm'))).normalize();
  return {side,short,sign,upper,fore,hand,paw:node('RoundHand_'+short),grip:node('RoundHand_'+short+'_Grip'),thigh:get('UpLeg'),knee:get('Leg'),l1:pos(upper).distanceTo(pos(fore)),l2:pos(fore).distanceTo(pos(hand)),neutralHand:bget('Hand').quaternion.clone(),rest:ARMS.rest[side],
   // Bind frames: the elbow hinge in the T-pose is the axis that turns the forearm toward the front.
   bindUpper:frame(bu,bu.clone().cross(Z)).invert().multiply(q(bget('Arm'))),bindFore:frame(bf,bf.clone().cross(Z)).invert().multiply(q(bget('ForeArm'))),old:['UpperArm','Forearm','Hand'].map(n=>old.getObjectByName(`${n}_${short}`))};});
 const delta=()=>q(chest).multiply(bindChest.clone().invert()),oldDelta=()=>q(oldChest).multiply(oldBindChest.clone().invert());
 const oldAngles=s=>{const inv=oldDelta().invert(),[a,b,c]=s.old.map(pos);return armAngles(s.sign,b.clone().sub(a).applyQuaternion(inv).normalize(),c.clone().sub(b).applyQuaternion(inv).normalize());};
 const curAngles=s=>{const inv=delta().invert(),a=pos(s.upper),b=pos(s.fore),c=pos(s.hand);return armAngles(s.sign,b.clone().sub(a).applyQuaternion(inv).normalize(),c.clone().sub(b).applyQuaternion(inv).normalize());};
 const thighFlex=s=>{const inv=q(node('smartrigHips')).invert(),d=pos(s.knee).sub(pos(s.thigh)).applyQuaternion(inv);return Math.atan2(d.z,-d.y)/RAD;};
 // Pose one arm from model angles with the hinge-defined roll; the round paw
 // follows the forearm with a relaxed droop. The bow paw faces the body; the
 // free paw turns a little back toward the thigh.
 function pose(s,angles){const C=delta(),{u,f,axis}=armVectors(s.sign,angles),uW=u.applyQuaternion(C),fW=f.applyQuaternion(C),hW=axis.applyQuaternion(C);
  setQ(s.upper,frame(uW,hW).multiply(s.bindUpper));setQ(s.fore,frame(fW,hW).multiply(s.bindFore));s.hand.quaternion.copy(s.neutralHand);update();
  const y=fW.clone().multiplyScalar(.7).addScaledVector(DOWN.clone().applyQuaternion(C),.3).normalize(),z=new T.Vector3(-s.sign,0,s.side==='Left'?-.35:0).normalize().applyQuaternion(C);z.addScaledVector(y,-z.dot(y)).normalize();
  setQ(s.paw,new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3().crossVectors(y,z).normalize(),y,z)));
  const elbow=pos(s.upper).addScaledVector(uW,s.l1),wrist=elbow.clone().addScaledVector(fW,s.l2);return pos(s.hand).distanceTo(wrist);}
 // Every clip shares one bone-roll convention: the upper arm and forearm are
 // rebuilt from their actual joint positions about the elbow hinge, signed by
 // the anatomical forward-flexion axis of the model (and equal to it as the
 // arm straightens), so the roll is a function of the pose alone. The wrist
 // stays neutral and the round paw keeps its world rotation, so the held bow,
 // paws and string pinch do not move. Without this a blend between clips whose forearm rolls differ by
 // half a turn flips in one frame.
 function rehinge(s){const C=delta(),inv=C.clone().invert(),a=pos(s.upper),b=pos(s.fore),c=pos(s.hand),u=b.clone().sub(a).normalize(),f=c.clone().sub(b).normalize(),bend=u.angleTo(f)/RAD,pawQ=q(s.paw);
  const uc=u.clone().applyQuaternion(inv),hint=Z.clone().addScaledVector(Y,Math.max(0,uc.z)).normalize(),r=uc.cross(hint).normalize().applyQuaternion(C),h=u.clone().cross(f);
  if(h.length()>1e-6){h.normalize();if(h.dot(r)<0)h.negate();h.lerp(r,1-smoother(3,15,bend)).normalize();}else h.copy(r);
  setQ(s.upper,frame(u,h).multiply(s.bindUpper));setQ(s.fore,frame(f,h).multiply(s.bindFore));s.hand.quaternion.copy(s.neutralHand);update();setQ(s.paw,pawQ);}
 const shots=new Set(asset.animations.filter(c=>{mix.stopAllAction();mix.clipAction(c).play();mix.setTime(Math.min(NOCK+.05,c.duration-1e-6));update();return c.duration>RELEASE&&node('Arrow_Nock_and_Flight').getWorldScale(new T.Vector3()).x>.1}).map(c=>c.name));
 sides.forEach(s=>{mix.stopAllAction();oldMix.stopAllAction();oldMix.clipAction(reference.animations.find(c=>c.name==='Idle')).play();oldMix.setTime(0);old.updateMatrixWorld(true);s.oldRest=oldAngles(s);});
 // The hand sockets carry their own tracks from the rigid-mount pass; the arms
 // own them here, so a socket turn is never hidden inside the bow's local track.
 const sockets=['Biped_Hand_R_Socket','Biped_Hand_L_Socket'].map(node),socketRest=sockets.map(o=>new T.Quaternion(...g.nodes[ids.get(o.name)].rotation));
 const objects=[...sides.flatMap(s=>[s.upper,s.fore,s.hand,s.paw]),...sockets,bow],report={rest:ARMS.rest,clips:[],maxArmError:0,maxAbduction:0,minElbowBend:180,backwardElbowFrames:0,easedSnaps:0};
 const loops=new Set(['Idle','Walk','Run']);
 for(const clip of asset.animations){
  const name=clip.name,walk=name==='Walk',run=name==='Run',idle=name==='Idle',shot=shots.has(name),acro=/Side_Flip|Forward_Vault/.test(name),ready=shot||/^Bow_Attack_(Enter|Exit)$/.test(name),oldClip=reference.animations.find(c=>c.name===name);
  if(!oldClip&&!run&&!ready&&!acro)throw Error(`Prior form has no ${name}`);
  const animation=g.animations.find(a=>a.name===name),times=Float32Array.from([...new Set(Array.from({length:Math.ceil(clip.duration*120)+1},(_,i)=>Math.fround(Math.min(i/120,clip.duration))))]),dt=1/120;
  mix.stopAllAction();mix.clipAction(clip).setLoop(T.LoopOnce,1).play();oldMix.stopAllAction();if(oldClip)oldMix.clipAction(oldClip).setLoop(T.LoopOnce,1).play();
  const sample=t=>{const at=Math.min(t,clip.duration-1e-7);mix.setTime(at);update();if(oldClip&&!ready&&!acro){oldMix.setTime(at);old.updateMatrixWorld(true);}};
  // 1. Plan the model angles and the chest yaw for every frame.
  const plan=[],yaw=[];
  for(const t of times){sample(t);const f=Z.clone().applyQuaternion(delta());yaw.push(Math.atan2(f.x,f.z));
   const swing=walk?(thighFlex(sides[0])-thighFlex(sides[1]))/2:0;
   plan.push(sides.map(s=>{const r=s.rest;
    if(acro)return {...r};
    if(run){const c=curAngles(s);return {...c,abd:ARMS.rest[s.side].abd+(c.abd-46)*.3,inward:r.inward};}
    if(ready)return {...r};
    const o=oldAngles(s);return {abd:r.abd+(o.abd-s.oldRest.abd)*.8,flex:r.flex+(o.flex-s.oldRest.flex)+s.sign*ARMS.swing[s.side]*swing,bend:r.bend+(o.bend-s.oldRest.bend)+(walk?.3*Math.max(0,s.sign*swing*ARMS.swing[s.side]):0),inward:r.inward};}));}
  // 2. Time effects on the planned angles.
  {
   if(run)for(const [k,s]of sides.entries()){const mean=plan.reduce((a,p)=>a+p[k].flex,0)/plan.length;for(const p of plan)p[k].flex=mean+(p[k].flex-mean)*ARMS.runPump[s.side];}
   // The source Run snaps its bow arm twice a cycle; low-pass its angles
   // around the loop before posing, so the pump stays one smooth swing.
   if(run)for(const [k]of sides.entries())for(const key of ['abd','flex','bend']){const n=plan.length-1;let v=plan.map(p=>p[k][key]);for(let pass=0;pass<3;pass++)v=v.map((_,i)=>{let sum=0;for(let j=-6;j<=6;j++)sum+=v[((i+j)%n+n)%n];return sum/13;});plan.forEach((p,i)=>p[k][key]=v[i%n]);}
   if(idle){const w=2*Math.PI/ARMS.breath.period,b=ARMS.breath;plan.forEach((p,i)=>p.forEach((a,k)=>{const t=times[i],s=Math.sin(w*t+k*.3)-Math.sin(k*.3);a.abd+=b.abd*s;a.flex+=b.flex*s;a.bend+=-b.bend*s+.8*Math.sin(2*w*t);}));}
   // Turn inertia: the arms trail the chest's yaw rate through a short lag.
   // One-shot clips meet the shared rest pose at both ends, so their time
   // effects fade in and out with the clip.
   const env=t=>loops.has(name)?1:smoother(0,.12,t)*(1-smoother(clip.duration-.18,clip.duration,t));
   const rate=yaw.map((y,i)=>i?Math.atan2(Math.sin(y-yaw[i-1]),Math.cos(y-yaw[i-1]))/dt:0),cycles=loops.has(name)?2:1;let lag=0;
   for(let pass=0;pass<cycles;pass++)plan.forEach((p,i)=>{lag+=(rate[i]-lag)*Math.min(1,dt/ARMS.turnLag.tau);if(pass===cycles-1)p.forEach((a,k)=>{a.flex+=env(times[i])*sides[k].sign*ARMS.turnLag.flex*lag;a.abd+=env(times[i])*ARMS.turnLag.abd*Math.abs(lag);});});
   // Overlap: the forearm follows the upper arm's swing through a damped
   // spring, so it trails a swing and settles after a stop. Loops spin the
   // spring through one cycle first, so the seam stays closed.
   for(const [k]of sides.entries()){const omega=2*Math.PI*ARMS.overlap.hz,zeta=ARMS.overlap.damping,flex=plan.map(p=>p[k].flex);let x=flex[0],v=0;
    const passes=loops.has(name)?2:1;for(let pass=0;pass<passes;pass++)for(let i=0;i<flex.length;i++){v+=(omega*omega*(flex[i]-x)-2*zeta*omega*v)*dt;x+=v*dt;if(pass===passes-1)plan[i][k].bend-=env(times[i])*ARMS.overlap.gain*(flex[i]-x);}}
   for(const p of plan)for(const a of p){a.abd=Math.max(ARMS.abd[0],Math.min(ARMS.abd[1],a.abd));a.bend=Math.max(ARMS.bend[0],Math.min(ARMS.bend[1],a.bend));}
  }
  // The lowered side carry of the natural stance, in the chest frame, tilting
  // with the bow arm's swing.
  const carryQ=i=>{const C=delta(),tilt=ARMS.carry.tilt+ARMS.carry.follow*(plan[i][0].flex-sides[0].rest.flex)*RAD,y=new T.Vector3(0,Math.cos(tilt),Math.sin(tilt)).applyQuaternion(C),x=new T.Vector3(-1,0,0).applyQuaternion(C),z=new T.Vector3().crossVectors(x,y).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
  // 3. Pose, blend with the clip where a shot needs its contacts, record.
  const tracks=new Map(objects.map(o=>[o,{translation:[],rotation:[]}]));let clipError=0,clipAbd=0,clipBend=180;
  // The drawing paw goes straight from rest to the quiver mouth: before the
  // arrow appears it blends toward the clip's pose at that moment, not
  // through the prior ready pose behind the hip, where the tail is.
  const leftGroup=new Set([sides[1].upper,sides[1].fore,sides[1].hand,sides[1].paw,sockets[1]]),REACH=.30;let reach=null;
  if(shot){sample(REACH);reach=new Map([...leftGroup].map(o=>[o,[o.position.clone(),o.quaternion.clone()]]));}
  times.forEach((t,i)=>{
   sample(t);
   // The mixer skips unchanged hold keys; restore sampled values after each edit.
   const sampled=objects.map(o=>[o,o.position.clone(),o.quaternion.clone()]);
   const acroW=Math.max(1-smoother(0,.18,t),smoother(clip.duration-.28,clip.duration,t)),weights=acro?[acroW,acroW]:shot?[Math.max(1-smoother(.10,.45,t),smoother(1.70,2.12,t)),Math.max(1-smoother(.16,.42,t),smoother(1.75,2.15,t))]:[1,1];
   sockets.forEach((o,k)=>o.quaternion.copy(socketRest[k]));for(const [k,s]of sides.entries())clipError=Math.max(clipError,pose(s,plan[i][k]));
   bow.position.copy(bow.parent.worldToLocal(pos(sides[0].grip)));setQ(bow,carryQ(i));update();
   if(weights[0]<1||weights[1]<1){const right=new Set([sides[0].upper,sides[0].fore,sides[0].hand,sides[0].paw,sockets[0],bow]);for(const [o,p,r]of sampled){const w=weights[right.has(o)?0:1],[sp,sr]=reach&&t<REACH&&leftGroup.has(o)?reach.get(o):[p,r];o.position.lerp(sp,1-w);o.quaternion.slerp(sr,1-w).normalize();}update();}
   const bowW=acro?carryQ(i):q(bow),bowP=pos(bow);
   for(const s of sides)rehinge(s);update();
   // Sockets hold their rest rotation in every clip; the bow keeps the world
   // transform chosen above (acrobatics: the chest-frame carry throughout).
   {const at=acro?pos(sides[0].grip):bowP;sockets.forEach((o,k)=>o.quaternion.copy(socketRest[k]));update();bow.position.copy(bow.parent.worldToLocal(at));setQ(bow,bowW);update();}
   for(const s of sides){const c=curAngles(s);if(!acro){clipAbd=Math.max(clipAbd,c.abd);clipBend=Math.min(clipBend,c.bend);}const inv=delta().invert(),u=pos(s.fore).sub(pos(s.upper)).applyQuaternion(inv).normalize(),f=pos(s.hand).sub(pos(s.fore)).applyQuaternion(inv).normalize(),d=f.clone().addScaledVector(u,-f.dot(u));if(weights[0]===1&&weights[1]===1&&d.length()>.1&&d.z<-.02)report.backwardElbowFrames++;}
   for(const [o,v]of tracks){const r=o.quaternion.clone().normalize(),prev=v.rotation.length?new T.Quaternion().fromArray(v.rotation,v.rotation.length-4):null;if(prev&&prev.dot(r)<0)r.set(-r.x,-r.y,-r.z,-r.w);v.translation.push(...o.position);v.rotation.push(...r.toArray());}
   for(const [o,p,r]of sampled){o.position.copy(p);o.quaternion.copy(r);}
  });
  // 4. Ease any remaining one-frame snaps.
  const eased=easePops(times,[...tracks.values()],{groups:[[0,1,2,3,8,10],[4,5,6,7,9]],protect:shot?[[NOCK,RELEASE]]:[]});report.easedSnaps+=eased;
  // Loops close exactly: any residual at the seam is spread over the cycle.
  if(loops.has(name))for(const v of tracks.values()){const n=times.length-1,first=new T.Quaternion().fromArray(v.rotation,0),last=new T.Quaternion().fromArray(v.rotation,n*4),fix=last.clone().invert().multiply(first),p0=new T.Vector3().fromArray(v.translation,0),p1=new T.Vector3().fromArray(v.translation,n*3);
   for(let i=1;i<=n;i++){const w=times[i]/times[n];new T.Quaternion().fromArray(v.rotation,i*4).multiply(new T.Quaternion().slerp(fix,w)).normalize().toArray(v.rotation,i*4);new T.Vector3().fromArray(v.translation,i*3).addScaledVector(p0.clone().sub(p1),w).toArray(v.translation,i*3);}}
  const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];
  for(const [o,values]of tracks)for(const [key,data]of Object.entries(values)){const id=ids.get(o.name),sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(data),key==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path===key));animation.channels.push({sampler,target:{node:id,path:key}});}
  report.clips.push({clip:name,maxArmError:clipError,maxAbduction:clipAbd,minElbowBend:clipBend,easedSnaps:eased});report.maxArmError=Math.max(report.maxArmError,clipError);if(!shot){report.maxAbduction=Math.max(report.maxAbduction,clipAbd);report.minElbowBend=Math.min(report.minElbowBend,clipBend);}
  console.log('Arms',name,clipError.toFixed(5),clipAbd.toFixed(1),clipBend.toFixed(1),'snaps',eased);
 }
 g.asset.extras.naturalArms={...report,method:'Chest-frame abduction/flexion/forward-only elbow model with hinge-defined bone roll, driven by the prior form arm angles relative to its idle; asymmetric bow and free arm rest; Idle breathing; forearm overlap spring and turn lag; Walk counter-swing from the thighs; Run pump kept with arms brought in; C2 shot hand-offs; one-frame snaps eased. Maxima exclude the shots, whose draw keeps the authored contacts.'};
 glb.write(file);compactBiped(file);
 if(evidence){fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(`${evidence}/build.json`,JSON.stringify(report,null,2)+'\n');}
 if(refit){await refitBipedQuiver({clips:report.clips.map(c=>c.clip),output:evidence||undefined});compactBiped(file);}
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await refineBipedArms());
