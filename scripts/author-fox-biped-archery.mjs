import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {compactBiped} from './compact-fox-biped.mjs';

// An archery set authored for the biped's own proportions and the game's
// timing. The game shoots on a 0.26 s windup, then recovers for 0.24 s; the
// retargeted 2.2 s shot could only be sped up, and it drew at the chest with
// the bow arm folded across the body. These clips are posed directly:
// - Bow_Ready      combat-ready hold: arrow on the string, bow low in front.
// - Bow_Draw       0.26 s: bow rises onto the aim line while the string comes
//                  to an anchor under the chin, bow arm extended, draw elbow up.
// - Bow_Release    0.24 s: the string snaps forward, the drawing paw flicks
//                  back past the jaw, the bow arm holds through the shot.
// - Bow_Reload     0.55 s: paw to the quiver mouth, pull an arrow, bring it
//                  round and nock it while the bow lowers to ready.
// - Bow_Nock      0.30 s: rapid fire; the paw brings a spare arrow it holds
//                  from the anchor straight onto the string, no quiver trip.
// - Bow_Ready_Enter / Bow_Ready_Exit: from rest into the ready hold and back.
// - Victory        the bow raised overhead, then lowered to rest.
// Arms use the canonical elbow hinge and neutral wrists of the arm pass; the
// round paws hold the bow and the string with the authored grip of the full
// draw. Legs stay at rest; the runtime foot layer plants the stance.
export const ARCHERY={draw:.26,release:.24,reload:.55,nock:.30,enter:.70,exit:.70,victory:1.6,ready:2,fps:120,twist:.56,cant:.18,arrowLength:.405*.65,
 // Quiver trips: at the mouth, arrow out, arrow on the string (Exit: arrow
 // off the string, back in the quiver, paw leaving it).
 lag:.2,pull:.075,reloadPhases:[.15,.21,.48],enterPhases:[.24,.32,.60],exitPhases:[.22,.28]};
const RAD=Math.PI/180,UP=new T.Vector3(0,1,0),Z=new T.Vector3(0,0,1),Y=new T.Vector3(0,1,0);
const smooth=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*x*(x*(6*x-15)+10);};
const frame=(d,h)=>{const x=d.clone().normalize(),y=h.clone().addScaledVector(x,-h.dot(x)).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,new T.Vector3().crossVectors(x,y)));};
const basis=(x,y)=>{x=x.clone().normalize();y=y.clone().addScaledVector(x,-y.dot(x)).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,new T.Vector3().crossVectors(x,y)));};

export async function authorBipedArchery({file='public/meshy-fox-preview/fox-biped.glb',evidence='docs/evidence/fox-next-level'}={}){
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
 const glb=readGLB(file),g=glb.json;if(g.asset.extras.archery)throw Error('Archery already authored; start with the natural-arms asset.');
 async function load(f){const b=fs.readFileSync(f);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
 const asset=await load(file),source=await load('public/meshy-fox-preview/fox-biped-source.glb'),m=asset.scene,bind=source.scene,mix=new T.AnimationMixer(m);bind.updateMatrixWorld(true);
 const node=n=>m.getObjectByName(n),pos=o=>o.getWorldPosition(new T.Vector3()),q=o=>o.getWorldQuaternion(new T.Quaternion()).normalize(),update=()=>m.updateMatrixWorld(true),setQ=(o,v)=>{o.quaternion.copy(q(o.parent).invert().multiply(v)).normalize();o.updateMatrixWorld(true)};
 const ids=new Map(g.nodes.map((n,i)=>[n.name,i])),clip=n=>asset.animations.find(c=>c.name===n),root=node('Biped_Motion_Root'),bow=node('Bow_Right_Hand'),arrow=node('Arrow_Nock_and_Flight');
 const sides=Object.fromEntries([['Right','R'],['Left','L']].map(([side,short])=>{const get=n=>node('smartrig'+side+n),bget=n=>bind.getObjectByName('smartrig'+side+n),bu=pos(bget('ForeArm')).sub(pos(bget('Arm'))).normalize(),bf=pos(bget('Hand')).sub(pos(bget('ForeArm'))).normalize();
  return [side,{side,sign:side==='Right'?-1:1,upper:get('Arm'),fore:get('ForeArm'),hand:get('Hand'),paw:node('RoundHand_'+short),grip:node('RoundHand_'+short+'_Grip'),neutral:bget('Hand').quaternion.clone(),bindUpper:frame(bu,bu.clone().cross(Z)).invert().multiply(q(bget('Arm'))),bindFore:frame(bf,bf.clone().cross(Z)).invert().multiply(q(bget('ForeArm'))),l1:pos(get('Arm')).distanceTo(pos(get('ForeArm'))),l2:pos(get('ForeArm')).distanceTo(pos(get('Hand')))}];}));
 const sample=(name,t)=>{mix.stopAllAction();const a=mix.clipAction(clip(name)).setLoop(T.LoopOnce,1);a.clampWhenFinished=true;a.play();mix.setTime(Math.min(t,clip(name).duration-1e-7));update();};
 // Grips measured from the authored full draw: each paw's rotation in the
 // bow's frame, and where the string sits on the drawing paw.
 sample('Bow_Attack',1.12);const bowFull=q(bow),gripR=bowFull.clone().invert().multiply(q(sides.Right.paw)),gripL=bowFull.clone().invert().multiply(q(sides.Left.paw)),arrowGrip=q(arrow).invert().multiply(q(sides.Left.paw));
 // The relaxed rest of the arm pass, for entering and leaving the set.
 const objects=[...new Set([...clip('Bow_Attack').tracks.map(t=>t.name.split('.')[0])])].map(node).filter(Boolean),track=o=>clip('Bow_Attack').tracks.filter(t=>t.name.startsWith(o.name+'.'));
 const nockOf=(bq,bp,draw)=>new T.Vector3((.10+.13*draw)*.65,.025*.65,0).applyQuaternion(bq).add(bp);
 // Two-bone arm to a wrist target, canonical hinge, neutral wrist, paw set.
 function arm(s,wrist,pawQ,pole){const a=pos(s.upper),dir=wrist.clone().sub(a),dist=Math.max(Math.abs(s.l1-s.l2)+1e-4,Math.min(s.l1+s.l2-1e-4,dir.length()));dir.normalize();const along=(s.l1*s.l1-s.l2*s.l2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,s.l1*s.l1-along*along)),raw=pole.clone().addScaledVector(dir,-pole.dot(dir)),strength=raw.length();let side=raw.normalize();
  // Within a clip the elbow side follows its last frame and drifts toward the
  // pole (about 0.04 s), so a folded arm whose ideal side swings never jumps;
  // near a clip end it settles fully onto the pole.
  if(s.lastSide){const last=s.lastSide.clone().addScaledVector(dir,-s.lastSide.dot(dir)).normalize(),w=Math.max(ARCHERY.lag*smooth(.05,.4,strength),s.settle||0);side=last.multiplyScalar(1-w).addScaledVector(side,w).normalize();}if(s.commit){s.lastSide=side.clone();s.minReach=Math.min(s.minReach,dist/(s.l1+s.l2));s.minPole=Math.min(s.minPole,strength);}
  const elbow=a.clone().addScaledVector(dir,along).addScaledVector(side,h),hand=a.clone().addScaledVector(dir,dist);
  // The hinge comes from the pole side the elbow is placed toward (behind or
  // outside the arm), so its sign never flips; for a hanging arm it equals
  // the arm pass's canonical forward-flexion axis.
  const u=elbow.clone().sub(a).normalize(),f=hand.clone().sub(elbow).normalize(),hinge=side.clone().cross(dir).normalize();
  setQ(s.upper,frame(u,hinge).multiply(s.bindUpper));setQ(s.fore,frame(f,hinge).multiply(s.bindFore));s.hand.quaternion.copy(s.neutral);update();setQ(s.paw,pawQ);return pos(s.hand).distanceTo(wrist);}
 // Place a paw so its grip point lands on a target.
 const reachGrip=(s,target,pawQ,pole)=>{let wrist=target.clone();s.commit=false;for(let i=0;i<6;i++){arm(s,wrist,pawQ,pole);wrist.add(target.clone().sub(pos(s.grip)));}s.commit=true;return arm(s,wrist,pawQ,pole)+pos(s.grip).distanceTo(target);};
 const turnUp=(o,angle)=>{const pq=q(o.parent);o.quaternion.premultiply(pq.clone().invert().multiply(new T.Quaternion().setFromAxisAngle(UP,angle)).multiply(pq));update();};
 const R=v=>v.clone().applyMatrix4(root.matrixWorld);// root-frame point to world
 // Key poses in the root frame (fox faces +Z, aim along +Z).
 function body(k){// k: 0 relaxed .. 1 aiming twist; the head turns back onto the aim
  turnUp(node('smartrigSpine1'),.40*ARCHERY.twist*k);turnUp(node('smartrigSpine2'),.60*ARCHERY.twist*k);turnUp(node('smartrigNeck'),-.45*ARCHERY.twist*k);turnUp(node('smartrigHead'),-.55*ARCHERY.twist*k);}
 const aimDir=()=>Z.clone().applyQuaternion(q(root));
 function aimBow(draw){const d=aimDir(),head=pos(node('smartrigHead')),anchor=head.clone().add(new T.Vector3(.035,-.045,.135).applyQuaternion(q(root))),grip=anchor.clone().addScaledVector(d,(.10+.13*draw)*.65),x=d.clone().negate(),y=UP.clone().applyAxisAngle(d,-ARCHERY.cant);return {grip,bowQ:basis(x,y),anchor};}
 function readyBow(){const d=aimDir(),s=pos(sides.Right.upper),grip=s.clone().add(new T.Vector3(.07,-.17,.13).applyQuaternion(q(root))),dir=d.clone().applyAxisAngle(new T.Vector3(1,0,0).applyQuaternion(q(root)),.85),x=dir.clone().negate(),y=UP.clone().applyAxisAngle(dir,-.5);return {grip,bowQ:basis(x,y)};}
 // An arrow held by its nock points from the paw into the quiver mouth, and
 // turns toward the goal rotation as the clip moves it to the string.
 // Its frame takes the quiver's sideways axis as reference, never parallel to
 // an arrow (world up is, when the shaft stands in the near-vertical quiver).
 const quiverArrow=(mouth,goal,k)=>at=>{const d=mouth.clone().sub(at).addScaledVector(quiverAxis(),-.05),q0=basis(d.normalize().negate(),new T.Vector3(1,0,0).applyQuaternion(q(node('Quiver'))));return goal?q0.slerp(goal,k):q0;};
 // The quiver mouth sits 16 cm behind the drawing shoulder, tucked under the
 // big head. A straight path to it runs through the shoulder and folds the
 // arm flat, where the elbow has no direction and flips. Paths to and from it
 // are arcs around the shoulder: direction and distance are interpolated
 // separately (a quadratic on the sphere through a control direction outside
 // the head), so the arm's reach stays between its endpoints' values.
 const arc=(from,to,via,u)=>{const s=pos(sides.Left.upper),L=sides.Left.l1+sides.Left.l2,a=from.clone().sub(s),c=to.clone().sub(s),b=new T.Vector3(...via.dir).normalize().applyQuaternion(q(root)).multiplyScalar(via.reach*L);
  const ra=a.length(),rb=b.length(),rc=c.length(),turn=(x,y,k)=>x.clone().applyQuaternion(new T.Quaternion().slerp(new T.Quaternion().setFromUnitVectors(x,y),k));
  a.normalize();b.normalize();c.normalize();const d=turn(turn(a,b,u),turn(b,c,u),u),r=(1-u)*(1-u)*ra+2*u*(1-u)*rb+u*u*rc;return s.addScaledVector(d.normalize(),r);};
 // Control directions from the drawing shoulder (root frame) and reach.
 const VIA={quiver:{dir:[.6,.75,.3],reach:.80},string:{dir:[.75,.05,.65],reach:.85}};
 const quiverMouth=()=>{const quiver=node('Quiver');return quiver.localToWorld(new T.Vector3(0,.205/2+.03,0));},quiverAxis=()=>UP.clone().applyQuaternion(q(node('Quiver')));
 const poles={Right:()=>new T.Vector3(-.4,-.6,-.2).applyQuaternion(q(root)).normalize()};
 // Elbow directions (root frame) at the key poses: hanging at rest, out and
 // back on the string, up and out with the forearm folded back over the
 // shoulder at the quiver (as an archer reaches a back quiver). From rest the
 // elbow swivels down, forward, then up as the paw rises past the cheek.
 // Poles turn between keys in time with the paw, and each path keeps the paw
 // well away from its pole's line, so the elbow never loses its side.
 const POLE={rest:[.6,-.6,-.4],raise:[.3,-.2,.95],string:[.7,.1,-.6],quiver:[.6,.75,.2]};
 const pole=(...keys)=>{const k=typeof keys.at(-1)==='number'?keys.pop():0,v=keys.map(n=>new T.Vector3(...POLE[n]).normalize()),turn=(x,y,u)=>x.clone().applyQuaternion(new T.Quaternion().slerp(new T.Quaternion().setFromUnitVectors(x,y),u));
  const p=v.length===1?v[0]:v.length===2?turn(v[0],v[1],k):turn(turn(v[0],v[1],k),turn(v[1],v[2],k),k);return p.normalize().applyQuaternion(q(root));};
 // One frame of the set. phase describes the pose to build from the base.
 function pose(spec){
  const {twist=0,bowFrom,bowTo,bowK=0,drawFrom=0,drawTo=0,drawK=0,left=null,arrowShown=false,arrowFree=null,gripK=1}=spec;
  if(!spec.twisted)body(twist);const B0=bowFrom(),B1=bowTo(),grip=B0.grip.clone().lerp(B1.grip,bowK),bowQ=B0.bowQ.clone().slerp(B1.bowQ,bowK),draw=drawFrom+(drawTo-drawFrom)*drawK;
  // The bow paw blends from its relaxed rest rotation onto the bow grip.
  const pawR=gripK<1?restPose.pawR.clone().slerp(bowQ.clone().multiply(gripR),gripK):bowQ.clone().multiply(gripR),errR=reachGrip(sides.Right,grip,pawR,poles.Right());const bq=q(bow);bow.position.copy(bow.parent.worldToLocal(grip.clone()));setQ(bow,bowQ);update();
  const nock=nockOf(bowQ,grip,draw);let errL=0;
  if(left){const target=left.at??nock,pawQ=left.pawQ??bowQ.clone().multiply(gripL);errL=reachGrip(sides.Left,target,pawQ,left.pole??pole('string'));}
  else errL=reachGrip(sides.Left,nock,bowQ.clone().multiply(gripL),pole('string'));
  if(arrowShown){if(arrowFree){const at=pos(sides.Left.grip);arrow.position.copy(arrow.parent.worldToLocal(at));setQ(arrow,typeof arrowFree==='function'?arrowFree(at):arrowFree);}else{arrow.position.copy(arrow.parent.worldToLocal(nock));setQ(arrow,bowQ);}arrow.scale.setScalar(.65);}else arrow.scale.setScalar(0);
  update();return {draw,errR,errL};
 }
 // A trip to the quiver: from start over the shoulder to the mouth (by T1),
 // pull an arrow out along the quiver (T2), bring it round outside the
 // shoulder onto the string (T3); nocked after. Exit plays it backwards.
 function quiverTrip(t,{start,startQ,startPole,via,T1,T2,T3,nock,nockQ}){
  const mouth=quiverMouth(),axis=quiverAxis(),lift=mouth.clone().addScaledVector(axis,ARCHERY.pull),inQuiver=quiverArrow(mouth,null,0);
  if(t<T1){const k=smooth(0,T1,t);return {arrowShown:false,left:{at:arc(start,mouth,via,k),pawQ:startQ.clone().slerp(inQuiver(mouth).multiply(arrowGrip),k),pole:pole(...startPole,'quiver',k)}};}
  if(t<T2){const at=mouth.clone().addScaledVector(axis,ARCHERY.pull*smooth(T1,T2,t));return {arrowShown:true,arrowFree:inQuiver,left:{at,pawQ:inQuiver(at).multiply(arrowGrip),pole:pole('quiver')}};}
  // Out of the quiver, the arrow turns from its pulled-out rotation to the
  // string's; it no longer pivots at the mouth.
  if(t<T3){const k=smooth(T2,T3,t),turned=inQuiver(lift).slerp(nockQ,k);return {arrowShown:true,arrowFree:()=>turned.clone(),left:{at:arc(lift,nock,VIA.string,k),pawQ:turned.clone().multiply(arrowGrip),pole:pole('quiver','string',k)}};}
  return {arrowShown:true,left:null};
 }
 let restPose=null;
 const set={
  Bow_Ready:{duration:ARCHERY.ready,loop:true,at:t=>({twist:.15,bowFrom:readyBow,bowTo:readyBow,arrowShown:true,drawFrom:0,drawTo:0,breathe:t})},
  Bow_Draw:{duration:ARCHERY.draw,at:t=>{const k=smooth(0,ARCHERY.draw,t),lift=smooth(0,.16,t);return {twist:.15+.85*k,bowFrom:readyBow,bowTo:()=>aimBow(1),bowK:lift,drawFrom:0,drawTo:1,drawK:smooth(.05,ARCHERY.draw,t),arrowShown:true};}},
  Bow_Release:{duration:ARCHERY.release,at:t=>{const flick=smooth(0,.06,t),back=1-smooth(.10,ARCHERY.release,t);const A=aimBow(1);
   return {twist:1,bowFrom:()=>aimBow(1),bowTo:()=>aimBow(1),drawFrom:1,drawTo:0,drawK:smooth(0,.025,t),arrowShown:false,left:{at:A.anchor.clone().addScaledVector(aimDir(),-.07*flick*back-.02).add(new T.Vector3(.04*flick,.05*flick*back,0).applyQuaternion(q(root))),pawQ:A.bowQ.clone().multiply(gripL)}};}},
  // Reload: from the anchor over the shoulder to the quiver, pull an arrow out
  // along the quiver, bring it round outside the shoulder and nock it while
  // the bow lowers to ready.
  Bow_Reload:{duration:ARCHERY.reload,at:t=>{const [T1,T2,T3]=ARCHERY.reloadPhases,mouth=quiverMouth(),bowK=smooth(0,.30,t),B=readyBow(),A=aimBow(1);
   const g=quiverTrip(t,{start:A.anchor.clone().addScaledVector(aimDir(),-.02).add(new T.Vector3(.04,0,0).applyQuaternion(q(root))),startQ:A.bowQ.clone().multiply(gripL),startPole:['string'],via:VIA.quiver,T1,T2,T3,nock:nockOf(B.bowQ,B.grip,0),nockQ:B.bowQ});
   return {twist:1-.85*bowK,bowFrom:()=>aimBow(1),bowTo:readyBow,bowK,drawFrom:0,drawTo:0,...g};}},
  // Rapid fire: from the release anchor straight onto the string with a spare
  // arrow already in the paw, while the bow lowers to ready.
  Bow_Nock:{duration:ARCHERY.nock,at:t=>{const bowK=smooth(0,ARCHERY.nock,t),k=smooth(0,ARCHERY.nock-.04,t),A=aimBow(1),B=readyBow(),start=A.anchor.clone().addScaledVector(aimDir(),-.02).add(new T.Vector3(.04,0,0).applyQuaternion(q(root))),nock=nockOf(B.bowQ,B.grip,0);
   const bulge=new T.Vector3(.05,0,.03).applyQuaternion(q(root)).multiplyScalar(Math.sin(Math.PI*k)),held=A.bowQ.clone().slerp(B.bowQ,k);
   return {twist:1-.85*bowK,bowFrom:()=>aimBow(1),bowTo:readyBow,bowK,arrowShown:t>.03,arrowFree:k<1?()=>held.clone():null,left:k<1?{at:start.lerp(nock,k).add(bulge),pawQ:held.clone().multiply(gripL)}:null};}},
  Bow_Ready_Enter:{duration:ARCHERY.enter,at:t=>{const [T1,T2,T3]=ARCHERY.enterPhases,B=readyBow(),bk=smooth(.08,.5,t);
   const g=quiverTrip(t,{start:restPose.left,startQ:restPose.pawL,startPole:['rest','raise'],via:VIA.quiver,T1,T2,T3,nock:nockOf(B.bowQ,B.grip,0),nockQ:B.bowQ});
   return {twist:.15*bk,bowFrom:()=>restPose.bow,bowTo:readyBow,bowK:bk,gripK:bk,...g};}},
  // Exit is the trip backwards: the arrow goes back in the quiver and the paw
  // returns to rest.
  Bow_Ready_Exit:{duration:ARCHERY.exit,at:t=>{const [e1,e2]=ARCHERY.exitPhases,B=readyBow(),bk=smooth(.05,.45,t),d=ARCHERY.exit;
   const g=quiverTrip(d-t,{start:restPose.left,startQ:restPose.pawL,startPole:['rest','raise'],via:VIA.quiver,T1:d-e2,T2:d-e1,T3:d,nock:nockOf(B.bowQ,B.grip,0),nockQ:B.bowQ});
   return {twist:.15*(1-bk),bowFrom:readyBow,bowTo:()=>restPose.bow,bowK:bk,gripK:1-bk,...g};}},
  Victory:{duration:ARCHERY.victory,at:t=>{const up=smooth(0,.35,t)*(1-smooth(1.05,1.5,t)),s=pos(sides.Right.upper),high={grip:s.clone().add(new T.Vector3(.03,.20,.07).applyQuaternion(q(root))),bowQ:basis(new T.Vector3(-1,0,0).applyQuaternion(q(root)),UP.clone())},pump=Math.sin(Math.PI*smooth(.15,.75,t));
   return {twist:0,bowFrom:()=>restPose.bow,bowTo:()=>high,bowK:up,gripK:up,arrowShown:false,left:{at:restPose.left.clone().lerp(pos(sides.Left.upper).add(new T.Vector3(.10,.12,.12).applyQuaternion(q(root))),.85*pump),pawQ:restPose.pawL,pole:pole('rest')}};}},
 };
 // Base: Idle, hips square to the aim; the chest twist is authored here and
 // the planted stance comes from the runtime foot layer.
 sample('Idle',0);restPose={bow:{grip:pos(sides.Right.grip),bowQ:q(bow)},left:pos(sides.Left.grip),pawL:q(sides.Left.paw),pawR:q(sides.Right.paw)};
 const base=new Map();sample('Idle',0);for(const o of objects)base.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()});
 sample('Idle',0);const idleUpper=new Map();for(const o of objects)idleUpper.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()});
 const upperNames=/^(smartrigSpine1|smartrigSpine2|smartrigNeck|smartrigHead|smartrig(Left|Right)(Shoulder|Arm|ForeArm|Hand)|Bone_03[3-8]|RoundHand_[LR]|Biped_Hand_[LR]_Socket)$/;
 const report={clips:[],maxGripError:0,maxDrawError:0};
 for(const [name,spec]of Object.entries(set)){
  const times=Float32Array.from(Array.from({length:Math.ceil(spec.duration*ARCHERY.fps-1e-9)+1},(_,i)=>Math.fround(Math.min(spec.duration,i/ARCHERY.fps)))),tracks=new Map(objects.map(o=>[o,{translation:[],rotation:[],scale:[]}])),morph={draw:[],flex:[]};
  let errR=0,errL=0;for(const side of Object.values(sides)){side.lastSide=null;side.minReach=1;side.minPole=1;}
  for(const t of times){
   for(const o of objects){const b=upperNames.test(o.name)?idleUpper.get(o):base.get(o);o.position.copy(b.p);o.quaternion.copy(b.q);o.scale.copy(b.s);}
   for(const n of ['Arrow_Second','Arrow_Third','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)])node(n)?.scale.setScalar(0);
   sockets();update();
   // Clip ends return the elbow to its pole, so neighbouring clips meet.
   for(const side of Object.values(sides))side.settle=spec.loop?0:smooth(.75*spec.duration,spec.duration,t);
   // The chest turns first, so every target (anchor, quiver mouth, arcs
   // round the shoulder) is measured on the turned body.
   body(spec.at(t).twist??0);const at={...spec.at(t),twisted:true},r=pose(at);errR=Math.max(errR,r.errR);errL=Math.max(errL,r.errL);morph.draw.push(r.draw);morph.flex.push(r.draw);
   for(const [o,v]of tracks){const qq=o.quaternion.clone().normalize(),pv=v.rotation.length?new T.Quaternion().fromArray(v.rotation,v.rotation.length-4):null;if(pv&&pv.dot(qq)<0)qq.set(-qq.x,-qq.y,-qq.z,-qq.w);v.translation.push(...o.position);v.rotation.push(...qq.toArray());v.scale.push(...o.scale);}
  }
  if(spec.loop)for(const v of tracks.values()){const n=times.length-1;for(const key of ['translation','rotation','scale']){const w=key==='rotation'?4:3;for(let k=0;k<w;k++)v[key][n*w+k]=v[key][k];}}
  const animation={name,samplers:[],channels:[]},input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[spec.duration];
  // A skinned mesh node ignores its own transform; only bones move it.
  for(const [o,v]of tracks)for(const [key,data]of Object.entries(v)){const id=ids.get(o.name);if(id===undefined||g.nodes[id].skin!==undefined)continue;animation.channels.push({sampler:animation.samplers.push({input,output:glb.append(Float32Array.from(data),key==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'})-1,target:{node:id,path:key}});}
  for(const [n,values]of [['Bow_String',morph.draw],['Longbow',morph.flex]]){const id=ids.get(n);if(id===undefined)continue;animation.channels.push({sampler:animation.samplers.push({input,output:glb.append(Float32Array.from(values),'SCALAR'),interpolation:'LINEAR'})-1,target:{node:id,path:'weights'}});}
  g.animations.push(animation);report.clips.push({name,duration:spec.duration,maxBowGripError:errR,maxDrawGripError:errL,minDrawArmReach:sides.Left.minReach,minDrawPoleStrength:sides.Left.minPole});report.maxGripError=Math.max(report.maxGripError,errR);report.maxDrawError=Math.max(report.maxDrawError,errL);console.log('Archery',name,errR.toFixed(4),errL.toFixed(4),'min reach',sides.Left.minReach.toFixed(2),'min pole',sides.Left.minPole.toFixed(2));
 }
 function sockets(){for(const n of ['Biped_Hand_R_Socket','Biped_Hand_L_Socket']){const o=node(n),r=g.nodes[ids.get(n)].rotation;if(r)o.quaternion.fromArray(r);}}
 g.asset.extras.archery={...ARCHERY,...report,method:'Posed directly on the biped: chin anchor, extended bow arm, quiver reload; canonical elbow hinge, neutral wrists, round paws on the authored full-draw grip.'};
 glb.write(file);compactBiped(file);
 if(evidence){fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(`${evidence}/archery-build.json`,JSON.stringify(report,null,2)+'\n');}
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await authorBipedArchery());
