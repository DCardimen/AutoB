import fs from 'node:fs';
import * as T from 'three';
import {readGLB} from './lib/glb.mjs';
import {addEquipment} from './lib/fox-equipment.mjs';
import {addSimplePaws} from './lib/fox-simple-paws.mjs';
import {addChibiBlink} from './lib/fox-blink-head.mjs';
import {foxExpressions} from '../public/meshy-fox-preview/fox-expressions.mjs';
import {PinnedCloth} from './lib/fox-dynamics.mjs';
import {KayKitMotion} from './lib/kaykit-motion.mjs';
import {CLIPS,BOW,AIM,STANCE,nockOffset,smooth,lerp,blinkAt,attackAt,footCycle,isShooting,isTurn,settlesToIdle,tailSwishAngle} from '../public/meshy-fox-preview/fox-motion.mjs';

const glb=readGLB('public/meshy-fox-preview/fox-repaired.glb'),g=glb.json,{read,append}=glb;
const body=g.meshes[0].primitives[0],originalPositions=Float32Array.from(read(body.attributes.POSITION)),oldNormals=Float32Array.from(read(body.attributes.NORMAL)),oldJ=Uint16Array.from(read(body.attributes.JOINTS_0)),oldW=Float32Array.from(read(body.attributes.WEIGHTS_0));
const originalIndices=Uint16Array.from(read(body.indices)),sourceUV=Float32Array.from(read(body.attributes.TEXCOORD_0));
const skin=g.skins[0],boneNodes=new Map(skin.joints.map(id=>[g.nodes[id].name,id])),oldJointNames=skin.joints.map(id=>g.nodes[id].name),oldWorld=new Map();
function walk(id,p=new T.Vector3()){const node=g.nodes[id],v=p.clone().add(new T.Vector3(...node.translation||[0,0,0]));oldWorld.set(id,v);for(const c of node.children||[])walk(c,v);}for(const id of g.scenes[0].nodes)walk(id);
const HEIGHT=.096;
const kaykit=new KayKitMotion();
function yMap(y){return y<.2?y:y<.52?.2+(y-.2)*.7:y-HEIGHT;}
function xMap(x){const a=Math.abs(x),sign=Math.sign(x);return sign*(a<=.13?a:a<.275?.13+(a-.13)*(.07/.145):a<.635?.20+(a-.275)*.75:a-.165);}
function regionWeight(vertex,predicate){let sum=0;for(let k=0;k<4;k++)if(predicate(oldJointNames[oldJ[vertex*4+k]]))sum+=oldW[vertex*4+k];return sum;}
// The source's front/lower tail fluff extends toward z=-.10. The first repair
// left that surface on the left thigh; include the complete visible bulb.
let correctedTailVertices=0;
for(let v=0;v<originalPositions.length/3;v++){
 const [x,y,z]=originalPositions.subarray(v*3,v*3+3),gate=smooth(.285,.31,x)*smooth(.02,-.06,z)*smooth(.20,.25,y)*(1-smooth(.70,.77,y));if(gate<=0)continue;
 const centres=g.extras.foxRigRepair.tailPoints;let n=0;while(n<4&&x>centres[n+1][0])n++;const t=smooth(centres[n][0],centres[n+1][0],x),list=new Map();for(let k=0;k<4;k++)list.set(oldJ[v*4+k],(list.get(oldJ[v*4+k])||0)+oldW[v*4+k]*(1-gate));
 for(const [name,w]of [[`Tail_${String(n).padStart(2,'0')}`,1-t],[`Tail_${String(n+1).padStart(2,'0')}`,t]]){const id=oldJointNames.indexOf(name);list.set(id,(list.get(id)||0)+w*gate);}
 const sorted=[...list].filter(([,w])=>w>1e-7).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=sorted.reduce((s,[,w])=>s+w,0);if(regionWeight(v,n=>n.startsWith('Tail_'))<.999)correctedTailVertices++;for(let k=0;k<4;k++){oldJ[v*4+k]=sorted[k]?.[0]||0;oldW[v*4+k]=(sorted[k]?.[1]||0)/sum;}
}
const position=new Float32Array(originalPositions.length),normal=new Float32Array(oldNormals.length);
for(let i=0;i<position.length/3;i++){
 const x=originalPositions[i*3],y=originalPositions[i*3+1],z=originalPositions[i*3+2],arm=regionWeight(i,n=>/arm|hand|clavicle/i.test(n)),tail=regionWeight(i,n=>n.startsWith('Tail_'));
 position.set([lerp(x,xMap(x),arm),lerp(yMap(y),y-HEIGHT,tail),z+arm*.065],i*3);
 const ax=Math.abs(x),dx=ax<.13?1:ax<.275?.07/.145:ax<.635?.75:1,dy=y>.2&&y<.52?.7:1;
 new T.Vector3(oldNormals[i*3]/lerp(1,dx,arm),oldNormals[i*3+1]/lerp(dy,1,tail),oldNormals[i*3+2]).normalize().toArray(normal,i*3);
}
body.attributes.POSITION=append(position,'VEC3',5126,34962);body.attributes.NORMAL=append(normal,'VEC3',5126,34962);
// Refit bones to the shortened mesh, with shoulder pivots inside the tunic.
const world=new Map();for(const [name,id]of boneNodes){const p=oldWorld.get(id).clone();p.y=name.startsWith('Tail_')?p.y-HEIGHT:yMap(p.y);if(/arm|hand|clavicle/i.test(name)){p.x=xMap(p.x);p.z+=.065;}world.set(name,p);}
function addBone(name,parent,p){const id=g.nodes.push({name,translation:[0,0,0]})-1;boneNodes.set(name,id);world.set(name,new T.Vector3(...p));const parentID=boneNodes.get(parent);g.nodes[parentID].children??=[];g.nodes[parentID].children.push(id);skin.joints.push(id);return id;}
const clothColumns=[];
for(let c=0;c<3;c++){
 const x=(c-1)*.13,points=[[x,.83-HEIGHT,-.10],[x,.75-HEIGHT,-.145],[x*.9,.665-HEIGHT,-.11]];clothColumns.push(points);
 points.forEach((p,i)=>addBone(`Cape${c}_${i}`,i?`Cape${c}_${i-1}`:'Chest',p));
}
const jointIndex=new Map(skin.joints.map((id,i)=>[g.nodes[id].name,i])),weights=new Float32Array(oldW),joints=new Uint16Array(oldJ);
function merge(a,b,t){const m=new Map();for(const [id,w]of a)m.set(id,(m.get(id)||0)+w*(1-t));for(const [id,w]of b)m.set(id,(m.get(id)||0)+w*t);return [...m];}
for(let i=0;i<position.length/3;i++){
 const [x,y,z]=originalPositions.subarray(i*3,i*3+3),ax=Math.abs(x),side=x<0?'R':'L';let list=Array.from({length:4},(_,k)=>[oldJ[i*4+k],oldW[i*4+k]]);
 const cape=smooth(-.065,-.115,z)*smooth(.64,.68,y)*(1-smooth(.81,.86,y))*(1-smooth(.21,.26,ax));
 if(cape>0){const cx=Math.max(0,Math.min(2,x/.13+1)),c0=Math.floor(cx),c1=Math.min(2,c0+1),ct=cx-c0,row=y>.75?0:1,rt=y>.75?1-smooth(.75,.83,y):1-smooth(.665,.75,y);const b=[];for(const [c,cw]of [[c0,1-ct],[c1,ct]])for(const [r,rw]of [[row,1-rt],[row+1,rt]])b.push([jointIndex.get(`Cape${c}_${r}`),cw*rw]);list=merge(list,b,cape);}
 list=list.filter(([,w])=>w>1e-6).sort((a,b)=>b[1]-a[1]).slice(0,4);const sum=list.reduce((s,[,w])=>s+w,0);for(let k=0;k<4;k++){joints[i*4+k]=list[k]?.[0]||0;weights[i*4+k]=(list[k]?.[1]||0)/sum;}
}
body.attributes.JOINTS_0=append(joints,'VEC4',5123,34962);body.attributes.WEIGHTS_0=append(weights,'VEC4',5126,34962);
const parents=new Map();g.nodes.forEach((n,i)=>n.children?.forEach(c=>parents.set(c,i)));
for(const [name,id]of boneNodes){const parentName=g.nodes[parents.get(id)]?.name,p=world.get(name),parent=world.get(parentName)||new T.Vector3();g.nodes[id].translation=p.clone().sub(parent).toArray();}
const inverseBinds=new Float32Array(skin.joints.length*16);skin.joints.forEach((id,i)=>new T.Matrix4().makeTranslation(...world.get(g.nodes[id].name).toArray()).invert().toArray(inverseBinds,i*16));skin.inverseBindMatrices=append(inverseBinds,'MAT4');
const visibleBodyIndices=[];for(let i=0;i<originalIndices.length;i+=3){const tri=Array.from(originalIndices.subarray(i,i+3));if(tri.some(v=>Math.abs(originalPositions[v*3])>.670&&originalPositions[v*3+1]>.72&&originalPositions[v*3+1]<.94))continue;visibleBodyIndices.push(...tri);}
const blinkRig=addChibiBlink(glb,boneNodes,originalPositions,position,normal,new Uint16Array(visibleBodyIndices),sourceUV,world.get('Head').toArray()),hands=addSimplePaws(glb,boneNodes),gear=addEquipment(glb,boneNodes,world);
const objects=g.nodes.map(n=>{const o=new T.Object3D();o.name=n.name;o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);return o;});
g.nodes.forEach((n,i)=>n.children?.forEach(c=>objects[i].add(objects[c])));const root=objects[0],B=name=>objects[boneNodes.get(name)],rest=new Map([...boneNodes].map(([name,id])=>[name,{p:objects[id].position.clone(),q:objects[id].quaternion.clone()}]));
// Hand-frame reference axes follow the turning root; identity in other clips.
const frameYaw=new T.Quaternion(),up=new T.Vector3(0,1,0),gripR=new T.Vector3(-.095,-.025,-.025),gripL=new T.Vector3(.130,0,0),handAttackR=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
const metrics={maxIKError:0,maxSolverIterationError:0,maxGripError:0,maxWristAngle:0,maxClothLengthError:0,correctedTailVertices,shoulderHalfWidth:world.get('UpperArm_L').x,armScale:.75,legScale:.70,clips:{},ikByClip:{}};let activePose={};
const bodyVertices=[...new Set(visibleBodyIndices)],inverseRest=skin.joints.map(id=>new T.Matrix4().makeTranslation(...world.get(g.nodes[id].name).toArray()).invert());
function groundFall(){
 const transforms=skin.joints.map((id,i)=>objects[id].matrixWorld.clone().multiply(inverseRest[i]));let min=Infinity;
 for(const i of bodyVertices){const p=new T.Vector3().fromArray(position,i*3),v=new T.Vector3();for(let k=0;k<4;k++)if(weights[i*4+k])v.addScaledVector(p.clone().applyMatrix4(transforms[joints[i*4+k]]),weights[i*4+k]);min=Math.min(min,v.y);}
 for(const id of [hands.R,hands.L,gear.bow,gear.string]){objects[id].traverse(o=>{const n=g.nodes[objects.indexOf(o)];if(n?.mesh===undefined)return;for(const primitive of g.meshes[n.mesh].primitives){const p=read(primitive.attributes.POSITION);for(let i=0;i<p.length;i+=3)min=Math.min(min,new T.Vector3().fromArray(p,i).applyMatrix4(o.matrixWorld).y);}});}
 B('Root').position.y+=.003-min;root.updateMatrixWorld(true);return B('Root').position.y;
}
function frameQuaternion(sourceDir,targetDir,targetUp){function basis(x,up){x=x.clone().normalize();let y=up.clone().addScaledVector(x,-up.dot(x));if(y.lengthSq()<1e-5)y=new T.Vector3(0,0,1).addScaledVector(x,-x.z);y.normalize();return new T.Matrix4().makeBasis(x,y,x.clone().cross(y).normalize());}return new T.Quaternion().setFromRotationMatrix(basis(targetDir,targetUp).multiply(basis(sourceDir,new T.Vector3(0,1,0)).transpose()));}
function setGlobalQuaternion(o,q){const parent=o.parent?.getWorldQuaternion(new T.Quaternion())||new T.Quaternion();o.quaternion.copy(parent.invert().multiply(q));o.updateMatrixWorld(true);}
// Minimal swing measured in the turning root's frame, so a turned pose is the
// rest pose rotated rather than gaining twist about each bone's own axis.
function minimalTurn(from,to){const inverse=frameYaw.clone().invert();return frameYaw.clone().multiply(new T.Quaternion().setFromUnitVectors(from,to.clone().applyQuaternion(inverse)));}
function solveIK(aName,bName,endName,target,pole,preferredUp,iteration=false,extension=0){
 const a=B(aName),b=B(bName),end=B(endName),start=a.getWorldPosition(new T.Vector3()),lenA=rest.get(bName).p.length(),lenB=rest.get(endName).p.length()+extension,delta=target.clone().sub(start),distance=delta.length(),clamped=Math.min(lenA+lenB-.00005,Math.max(Math.abs(lenA-lenB)+.00005,distance)),dir=delta.normalize();
 const along=(lenA*lenA-lenB*lenB+clamped*clamped)/(2*clamped),height=Math.sqrt(Math.max(0,lenA*lenA-along*along)),perp=pole.clone().sub(start).addScaledVector(dir,-pole.clone().sub(start).dot(dir)).normalize(),elbow=start.clone().addScaledVector(dir,along).addScaledVector(perp,height);
 const restDir=rest.get(bName).p.clone().normalize(),aDir=elbow.clone().sub(start).normalize();
 // The draw arm's twist follows its elbow hinge (the normal of the shoulder,
 // elbow and wrist plane), which equals the rest-pose up for a forward bend and
 // is never parallel to the upper arm. A fixed hint flips the sleeve whenever
 // the arm reaches out along it. Near straight, the hinge is undefined, so the
 // fixed hint takes over.
 if(aName==='UpperArm_L'&&preferredUp){const hinge=target.clone().sub(elbow).normalize().cross(aDir),bend=smooth(.04,.20,hinge.length());preferredUp=preferredUp.clone().lerp(hinge.normalize(),bend).normalize();}
 setGlobalQuaternion(a,preferredUp?frameQuaternion(restDir,aDir,preferredUp):minimalTurn(restDir,aDir));
 const bPos=b.getWorldPosition(new T.Vector3()),bDir=target.clone().sub(bPos).normalize();setGlobalQuaternion(b,preferredUp?frameQuaternion(rest.get(endName).p.clone().normalize(),bDir,preferredUp):minimalTurn(rest.get(endName).p.clone().normalize(),bDir));
 const error=end.getWorldPosition(new T.Vector3()).addScaledVector(bDir,extension).distanceTo(target);if(iteration)metrics.maxSolverIterationError=Math.max(metrics.maxSolverIterationError,error);else{metrics.maxIKError=Math.max(metrics.maxIKError,error);if(error>(metrics.ikByClip[activePose.mode]?.error||0))metrics.ikByClip[activePose.mode]={error,limb:aName,time:activePose.t,distance,reach:lenA+lenB};}return error;
}
function arm(side,palm,q,pole,bowFrame=null,gripInfluence=1){
 if(side==='L'){
  solveIK('UpperArm_L','Forearm_L','Hand_L',palm,pole,new T.Vector3(1,0,0).applyQuaternion(frameYaw),false,.130);
  const dir=B('Hand_L').getWorldPosition(new T.Vector3()).sub(B('Forearm_L').getWorldPosition(new T.Vector3())).normalize();
  q=frameQuaternion(new T.Vector3(1,0,0),dir,new T.Vector3(1,0,0).applyQuaternion(frameYaw));
  if(bowFrame){const stringAxis=new T.Vector3(0,1,0).applyQuaternion(bowFrame),z=stringAxis.addScaledVector(dir,-stringAxis.dot(dir)).normalize(),up=z.clone().cross(dir).normalize();q.slerp(frameQuaternion(new T.Vector3(1,0,0),dir,up),gripInfluence);setGlobalQuaternion(B('Forearm_L'),frameQuaternion(rest.get('Hand_L').p.clone().normalize(),dir,new T.Vector3(0,1,0).applyQuaternion(q)));}
  setGlobalQuaternion(B('Hand_L'),q);
  metrics.maxGripError=Math.max(metrics.maxGripError,B('Hand_L').localToWorld(gripL.clone()).distanceTo(palm));return q;
 }

 const grip=side==='R'?gripR:gripL,forward=new T.Vector3(side==='R'?-1:1,0,0),hint=forward.clone().applyQuaternion(frameYaw);let yaw=side==='R'?0:Math.PI;
 for(let i=0;i<16;i++){
  const wrist=palm.clone().sub(grip.clone().applyQuaternion(q)),up=new T.Vector3(0,1,0).applyQuaternion(q);solveIK(`UpperArm_${side}`,`Forearm_${side}`,`Hand_${side}`,wrist,pole,up,true);
  const dir=B('Hand_'+side).getWorldPosition(new T.Vector3()).sub(B('Forearm_'+side).getWorldPosition(new T.Vector3())).normalize();
  let next;
  if(bowFrame){const local=dir.clone().applyQuaternion(bowFrame.clone().invert());const desired=side==='R'?Math.atan2(local.z,-local.x):Math.atan2(-local.z,local.x);yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*.65;next=frameQuaternion(forward,dir,hint).slerp(bowFrame.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw)).multiply(handAttackR),gripInfluence);}
  else next=frameQuaternion(forward,dir,hint);
  q.slerp(next,.65).normalize();
 }
 const wrist=palm.clone().sub(grip.clone().applyQuaternion(q));solveIK(`UpperArm_${side}`,`Forearm_${side}`,`Hand_${side}`,wrist,pole,new T.Vector3(0,1,0).applyQuaternion(q));setGlobalQuaternion(B('Hand_'+side),q);
 const dir=B('Hand_'+side).getWorldPosition(new T.Vector3()).sub(B('Forearm_'+side).getWorldPosition(new T.Vector3())).normalize(),wristAngle=dir.angleTo(forward.clone().applyQuaternion(q));if(wristAngle>metrics.maxWristAngle){metrics.maxWristAngle=wristAngle;metrics.worstWrist={...activePose,side};}metrics.maxGripError=Math.max(metrics.maxGripError,B('Hand_'+side).localToWorld(grip.clone()).distanceTo(palm));return q;
}
function naturalArms(mode,t){
 const idle=kaykit.sample('Idle_A',settlesToIdle(mode)?0:t/CLIPS[mode].duration),move=mode==='run'?kaykit.sample('Running_A',t/CLIPS.run.duration):mode==='walk'?kaykit.sample('Walking_A',t/CLIPS.walk.duration):null,result={};
 for(const side of ['R','L']){
  const sign=side==='R'?-1:1,source=idle.arms[side],upper=source.upper.clone(),lower=source.lower.clone();
  // Fit the stocky fox: keep elbows close and palms facing the thighs. The
  // imported motion supplies the bend and swing, not its mannequin arm length.
  upper.x*=.65;upper.z*=.50;lower.x*=.85;lower.z*=.50;upper.normalize();lower.normalize();
  if(mode==='run'){
   // Running arms pump from the shoulder with the elbow held near a right
   // angle, against the opposite paw. The bow paw swings less with a
   // straighter elbow, keeping its forearm below level so the bow stays upright.
   const angle=t/CLIPS.run.duration*Math.PI*2+(side==='R'?0:Math.PI),theta=-(side==='R'?.42:.62)*Math.cos(angle),flex=side==='R'?.90:1.45;
   upper.set(sign*.55,-Math.cos(theta),Math.sin(theta)).normalize();lower.set(sign*.15,-Math.cos(theta+flex),Math.sin(theta+flex)).normalize();
  }else if(move){const angle=t/CLIPS[mode].duration*Math.PI*2+(side==='R'?0:Math.PI);let swing=-.23*Math.cos(angle);
   // Walking has a long stance, so half the pendulum follows the opposite
   // paw's real travel; each arm peaks with the contralateral footfall.
   swing=.5*swing+.5*.23*footCycle('walk',t,side==='R'?'L':'R').z/.055;upper.z=swing;lower.z=.12+swing*.72;upper.normalize();lower.normalize();}
  // Braking from a run, both arms carry forward on their momentum and settle.
  if(mode==='runStop'){const carry=smooth(0,.10,t)*(1-smooth(.22,.62,t));upper.z+=.45*carry;lower.z+=.8*carry;upper.normalize();lower.normalize();}

  const chestQ=B('Chest').getWorldQuaternion(new T.Quaternion());upper.applyQuaternion(chestQ);lower.applyQuaternion(chestQ);
  const shoulder=B('UpperArm_'+side).getWorldPosition(new T.Vector3()),elbow=shoulder.clone().addScaledVector(upper,rest.get('Forearm_'+side).p.length()),wrist=elbow.clone().addScaledVector(lower,rest.get('Hand_'+side).p.length()),q=frameQuaternion(new T.Vector3(sign,0,0),lower,new T.Vector3(sign,0,0).applyQuaternion(frameYaw));
  const palm=wrist.clone().add((side==='R'?gripR:gripL).clone().applyQuaternion(q));
  result[side]={palm,q,pole:elbow.clone().addScaledVector(upper,.04)};
 }
 return result;
}
function composePose(mode,t,cloth){
 activePose={mode,t};frameYaw.identity();
 for(const [name,{p,q}]of rest){B(name).position.copy(p);B(name).quaternion.copy(q);}let rootY=-.008,rootX=0,rootZ=0;
 const turn=CLIPS[mode].turn||0,quick=!!CLIPS[mode].quick,stop=mode==='runStop',u=t/CLIPS[mode].duration,phase=settlesToIdle(mode)?0:u*Math.PI*2,a=attackAt(t),shooting=isShooting(mode),moving=mode==='walk'||mode==='run'||mode.startsWith('shoot'),dash=mode==='dash'||mode==='dashBack',dashSign=mode==='dashBack'?-1:1;
 if(moving)rootY=-.032+.003*Math.cos(phase*(shooting?4:2));
 if(mode==='run'||mode==='walk'){const run=mode==='run',pelvis=-(run?.06:.025)*Math.sin(phase),spine=(run?.10:.05)*Math.sin(phase),lean=run?.10:.018,tilt=run?.05:0;B('Pelvis').rotation.set(tilt,pelvis,0);B('Spine').rotation.y=spine;B('Chest').rotation.x=lean;
  // Gaze stabilization: neck and head absorb nine tenths of the trunk's yaw and lean.
  B('Neck').rotation.set(-.4*(lean+tilt),-.4*(pelvis+spine),0);B('Head').rotation.set(-.5*(lean+tilt),-.5*(pelvis+spine),0);
  // The run sinks at each mid-stance and rises through the flight phase.
  if(run)rootY=-.050-.012*Math.cos(2*phase-2*Math.PI*.4);}
 // A run stop: it starts at the run's crouch, the planted paw brakes, the trunk
 // leans back over it and sinks to absorb the stop, then rises into Idle's
 // first frame.
 const stopSlide=.36,stopEnd=CLIPS.run.velocity[2]*stopSlide/2,stopBrace=stop?smooth(.03,.16,t)*(1-smooth(.30,.70,t)):0;
 if(stop){const slide=Math.min(t,stopSlide);rootZ=CLIPS.run.velocity[2]*(slide-slide*slide/(2*stopSlide));rootY=lerp(-.045,-.008,smooth(.30,.70,t))-.020*smooth(.04,.20,t)*(1-smooth(.32,.72,t));B('Pelvis').rotation.x=-.06*stopBrace;B('Chest').rotation.x=-.12*stopBrace;B('Head').rotation.x=.10*stopBrace;}
 if(mode==='idle')rootY+=.0018*Math.sin(phase);
 let hipTwist=0;
 if(shooting){
  const protract=smooth(.12,.46,t)*(1-smooth(1.50,2.12,t)),still=mode==='attack',s=a.stance;
  // Archer's wind-up: the bow shoulder leads toward the target. The chest
  // turn is shared by every shot so both shoulders meet the same aim line.
  // Standing, the hips stay square over the split stance. Moving, they turn
  // toward the travel direction while the chest keeps the aim.
  const twist=.80*s,travel=CLIPS[mode].travel;hipTwist=still?0:.06*s+.22*Math.sin(travel)*Math.sign(Math.cos(travel)||1);
  B('Pelvis').rotation.y=hipTwist;B('Spine').rotation.y=.45*(twist-hipTwist);B('Chest').rotation.set(.025*a.aim,.55*(twist-hipTwist),0);
  // Neck and head unwind the twist so the face stays on the target line and
  // the left eye sights along the arrow, with a slight tilt toward the string.
  B('Neck').rotation.y=-.42*twist;B('Head').rotation.set(-.025*a.aim,-.58*twist,.06*a.aim);
  // The bow shoulder pushes forward; the draw shoulder settles back as it
  // pulls, creeps back under back tension at anchor and snaps back on release.
  B('Clavicle_R').position.z+=.075*protract;B('Clavicle_L').position.z+=.075*protract*(1-.70*a.aim)-.006*a.hold-.025*a.follow;
  rootY-=.010*a.aim+(still?.022*s:0);
 }
 // Turns are led by the gaze: head, then chest, then hips. Each segment's
 // relative yaw returns to zero, so the final frame is Idle rotated by `turn`.
 // A quick pivot compresses the same sequence for an escape, with the chest
 // and hips nearly together so the carried bow and tail stay clear of the body.
 const turnHead=quick?smooth(0,.55,u):smooth(0,.55,u),turnChest=quick?smooth(.03,.76,u):smooth(.10,.80,u),turnHips=quick?smooth(.04,.80,u):smooth(.15,.92,u);
 if(turn){
  B('Root').rotation.y=turn*turnHips;frameYaw.setFromAxisAngle(up,turn*turnHips);B('Spine').rotation.y=.5*turn*(turnChest-turnHips);B('Chest').rotation.y=.5*turn*(turnChest-turnHips);
  B('Neck').rotation.y=.4*turn*(turnHead-turnChest);B('Head').rotation.set(.035*Math.sin(Math.PI*turnHead),.6*turn*(turnHead-turnChest),0);
  rootY-=(quick?.022:.010)*Math.sin(Math.PI*u);
 }
 const dodge=mode.startsWith('dodge'),dodgeSign=mode==='dodgeLeft'?-1:1,dodgeProgress=smooth(.10,.45,t),dodgeEnvelope=smooth(0,.12,t)*(1-smooth(.4,.75,t));
 if(dodge){rootX=dodgeSign*.30*dodgeProgress;rootY-=.045*dodgeEnvelope;rootZ=-.03*dodgeEnvelope;B('Chest').rotation.z=-dodgeSign*.16*dodgeEnvelope;B('Head').rotation.z=dodgeSign*.06*dodgeEnvelope;}
 // A dash away is a shorter hop with the trunk leaning back from the threat;
 // the head counter-pitches so the gaze stays level on it.
 if(dash){const burst=smooth(.04,.32,t),tuck=smooth(0,.10,t)*(1-smooth(.32,.70,t));rootZ=(dashSign>0?.65:-.50)*burst;rootY-=.045*tuck;B('Chest').rotation.x=(dashSign>0?.15:-.10)*tuck;B('Head').rotation.x=(dashSign>0?-.07:.06)*tuck;}
 if(mode==='hit'){const recoil=smooth(0,.12,t)*(1-smooth(.18,.95,t));rootZ=-.065*recoil;rootY-=.025*recoil;B('Chest').rotation.x=-.20*recoil;B('Head').rotation.x=.12*recoil;}
 if(mode==='death'){const fall=smooth(.15,1.2,t);rootY=lerp(-.008,.25,fall);B('Root').rotation.x=-1.5*fall;rootZ=-.19*fall;}
 B('Root').position.set(rootX,rootY,rootZ);root.updateMatrixWorld(true);
 for(const side of ['R','L']){
  if(mode==='death'){const fall=smooth(.15,1.2,t);const bounce=t>1.1?Math.sin((t-1.1)*12)*Math.exp(-(t-1.1)*5)*.13:0;B('Thigh_'+side).rotation.x=(-1.0+bounce)*fall;B('Thigh_'+side).rotation.z=(side==='R'?-.10:.10)*fall;B('Shin_'+side).rotation.x=.85*fall;B('Foot_'+side).rotation.x=.12*fall;continue;}
  const target=world.get('Foot_'+side).clone(),cycle=moving?footCycle(shooting?'walk':mode,shooting?t/1.1:t,side):{z:0,y:0,support:true};
  // Moving shots step along their own travel direction in model space.
  const travel=CLIPS[mode].travel;if(travel!==undefined){target.x+=cycle.z*Math.sin(travel);target.z+=cycle.z*Math.cos(travel);}else target.z+=cycle.z;target.y+=cycle.y;
  if(stop){
   // The bow-side paw lands ahead and holds; the other swings through beside it.
   if(side==='R'){const land=smooth(0,.08,t);target.z+=lerp(.03,stopEnd,land);target.y+=.02*(1-land);}
   else{const swing=smooth(.12,.46,t);target.z+=lerp(-.03,stopEnd,swing);target.y+=.05*Math.sin(Math.PI*swing)+.03*(1-smooth(0,.12,t));}
  }
  if(dash){const step=smooth(side==='R'?.04:.12,side==='R'?.36:.48,t);target.z+=rootZ+(side==='R'?1:-1)*.045*Math.sin(Math.PI*step);target.y+=.065*Math.sin(Math.PI*step);}
  if(dodge){const lead=(dodgeSign>0)===(side==='L'),start=lead?.10:.20,end=lead?.35:.52,step=smooth(start,end,t);target.x+=dodgeSign*.30*step;target.y+=.048*Math.sin(Math.PI*step);target.z+=rootZ*.35;}
  if(mode==='death'){target.y+=.14*smooth(.2,1.1,t);target.z-=.12*smooth(.2,1.1,t);}
  // Toes follow the travel direction a little further than the hips.
  let footYaw=shooting&&travel!==undefined?1.2*(hipTwist-.06*a.stance):0;
  if(mode==='attack'){
   // Archer's stance: the front paw (STANCE.front) steps onto the target line
   // and points at the target; the rear paw steps back and turns out to its
   // own side. Each is one lifted step in, and one back during recovery.
   const front=side===STANCE.front,out=side==='L'?1:-1,set=front?smooth(.04,.24,t):smooth(.16,.38,t),unset=front?smooth(1.84,2.06,t):smooth(1.62,1.86,t),step=set*(1-unset);
   target.add(new T.Vector3(...(front?[-out*.06,0,.095]:[out*.015,0,-.11])).multiplyScalar(step));target.y+=.045*(Math.sin(Math.PI*set)+Math.sin(Math.PI*unset));footYaw=out*(front?.08:1.48)*step;
  }
  if(turn){
   // Each paw rotates about the turn centre in one or two lifted steps; the
   // paw on the turning side leads.
   const lead=turn>0?'L':'R',trail=lead==='L'?'R':'L',steps=quick?[[lead,0,.30,0,.28],[trail,0,1,.16,.70],[lead,.30,1,.38,.80]]:Math.abs(turn)>1?[[lead,0,.40,.08,.36],[trail,0,1,.28,.64],[lead,.40,1,.56,.90]]:[[lead,0,1,.10,.45],[trail,0,1,.40,.80]];
   let share=0,lift=0;for(const [foot,from,to,start,end]of steps)if(foot===side&&u>=start){const f=smooth(start,end,u);share=lerp(from,to,f);lift+=(quick?.055:.045)*Math.sin(Math.PI*f);}
   target.applyAxisAngle(up,turn*share);target.y+=lift;footYaw=turn*share;
  }
  // The knee aims ahead of the paw; it travels with a sliding stop's root.
  solveIK(`Thigh_${side}`,`Shin_${side}`,`Foot_${side}`,target,new T.Vector3(side==='R'?-.23:.23,.30,.8+(stop?rootZ:0)).applyAxisAngle(up,footYaw));setGlobalQuaternion(B('Foot_'+side),new T.Quaternion().setFromAxisAngle(up,footYaw));
 }
 const natural=naturalArms(mode,t),offset=new T.Vector3(rootX,rootY,rootZ);
 if(dodge){natural.L.pole.x+=.10*dodgeEnvelope;natural.R.pole.x-=.10*dodgeEnvelope;}
 let bowPosition=natural.R.palm.clone().sub(offset),bowFrame=natural.R.q.clone().multiply(handAttackR.clone().invert()),qR=natural.R.q.clone(),leftPalm=natural.L.palm.clone().sub(offset),qL=natural.L.q.clone();
 let stringDraw=0;
 // Forward is +Z. The canonical arrow travels -X, so the coupled bow/string/
 // arrow frame turns 90 degrees; the cant tips the upper limb out from the cheek.
 const aimFrame=new T.Quaternion().setFromAxisAngle(up,Math.PI/2).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),AIM.cant)),releaseNock=fullGrip.clone().add(new T.Vector3(BOW.fullDraw,BOW.nockY,0).applyQuaternion(aimFrame));
 if(shooting){
  const engaged=smooth(.12,.46,t)*(1-smooth(1.50,2.12,t));
  // Set-up raises the bow at partial extension; the draw then pushes the bow
  // arm straight while the string paw pulls back to anchor.
  const aimGrip=fullGrip.clone().add(new T.Vector3(...AIM.setup)).lerp(fullGrip,a.aim);aimGrip.y-=.015*a.follow;aimGrip.z-=.02*a.follow;
  // The carried bow swings out from the hip while the trunk is wound up.
  bowPosition.x-=.12*a.stance;bowPosition.z+=.08*a.stance;bowPosition.lerp(aimGrip,engaged);
  // Lift the turned bow in front of the tunic before bringing it to aim.
  bowPosition.z+=.08*Math.sin(Math.PI*engaged);
  stringDraw=a.draw;
  const carryPole=natural.R.pole.clone().lerp(new T.Vector3(-.45,.45,.30).add(offset),engaged);
  qR=arm('R',bowPosition.clone().add(offset),qR,carryPole);
  // After the loose, the bow tips forward about its grip in the relaxed paw.
  const shotFrame=aimFrame.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.20*a.follow));
  bowFrame=qR.clone().multiply(handAttackR.clone().invert()).slerp(shotFrame,engaged);
  const nock=bowPosition.clone().add(new T.Vector3(nockOffset(stringDraw),BOW.nockY,0).applyQuaternion(bowFrame));
  const influence=smooth(.25,.46,t)*(1-smooth(1.45,2.12,t));
  const reach=smooth(.08,.25,t)*(1-smooth(1.55,2.12,t));leftPalm.lerp(new T.Vector3(.27,.67,.36),reach);
  // The string paw closes on the nock from the archer's side, fingertips
  // first, so the cord meets the pinch channel instead of the paw's back.
  const drawPoint=nock.clone().add(new T.Vector3(.07*(1-smooth(.34,.46,t)),0,0).applyQuaternion(bowFrame));
  // The released string paw slides back along the jaw, out of the string path.
  if(t>=1.18)drawPoint.copy(releaseNock).add(new T.Vector3(.12,.01,-.06).multiplyScalar(smooth(1.18,1.34,t)));
  leftPalm.lerp(drawPoint,influence);
 }

 if(dodge){bowPosition.x-=.045*dodgeEnvelope;bowPosition.y+=.06*dodgeEnvelope;bowPosition.z+=.04*dodgeEnvelope;leftPalm.x+=.035*dodgeEnvelope;leftPalm.y+=.07*dodgeEnvelope;leftPalm.z+=.08*dodgeEnvelope;}
 bowPosition.add(new T.Vector3(rootX,rootY,rootZ));leftPalm.add(new T.Vector3(rootX,rootY,rootZ));
 {
  const attackInfluence=shooting?smooth(.12,.46,t)*(1-smooth(1.50,2.12,t)):0;
  // The bow elbow rolls down and out of the string path; the draw elbow
  // swings back and up behind the arrow line as the draw completes.
  qR=arm('R',bowPosition,qR,natural.R.pole.clone().lerp(new T.Vector3(-.45,.45,.30).add(offset),attackInfluence),bowFrame);
  qL=arm('L',leftPalm,qL,natural.L.pole.clone().lerp(new T.Vector3(.95,.58,.25).lerp(new T.Vector3(.34,.70,.38),attackInfluence).lerp(new T.Vector3(1.2,.72,-.10),shooting?a.aim:0).add(offset),shooting?smooth(.04,.20,t)*(1-smooth(1.65,2.12,t)):0),shooting?bowFrame:null,shooting?smooth(.37,.46,t)*(1-smooth(1.40,1.55,t)):0);
 }
 // Tail response contains phase lag plus inertial impulses from each action.
 // Turning, the tail trails the hips and catches up as they settle; braking
 // from a run flicks it up.
 const speed=mode==='run'||mode.startsWith('shoot')?1:mode==='walk'?.5:0,tailDrive=(dodge?dodgeSign*dodgeEnvelope:0)+(shooting?.25*a.aim:0),turnLag=-turn*(quick?.45:.9)*(turnHips-smooth(.30,1,u));
 for(let i=0;i<6;i++){const b=B(`Tail_${String(i).padStart(2,'0')}`);b.rotation.set((.025+.020*speed)*Math.sin(phase-i*.5)+.30*stopBrace*(.3+.7*i/5),(.012+.025*speed)*Math.sin(phase*(shooting?3:1)-i*.55)+tailDrive*.06*(i/5)+turnLag*(.25+.15*i/5)-(mode==='death'&&i===0?.65*smooth(.15,1.2,t):0),(.025+.025*speed)*Math.sin(phase-i*.6)+(mode==='death'&&i===0?.55*smooth(.15,1.2,t):0));// The tail counterbalances the archer's hip twist, staying behind the stance.
  if(mode!=='death'&&i===0)b.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.32+.22*speed-.5*hipTwist));if(mode==='idle'||settlesToIdle(mode))b.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),tailSwishAngle(mode==='idle'?t:0,i)));}
 const rotations=cloth.rotations();for(let c=0;c<3;c++)for(let r=0;r<2;r++)B(`Cape${c}_${r}`).quaternion.copy(r?rotations[c][r-1].clone().invert().multiply(rotations[c][r]):rotations[c][r]);
 // Turns and the run stop start and end on Idle's first frame, so the cape
 // keeps that drape and only swings out behind the turning or braking chest.
 if(settlesToIdle(mode)){const swing=turn?new T.Quaternion().setFromAxisAngle(up,-turn*.55*(turnChest-smooth(.25,1,u))):new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.30*stopBrace);for(let c=0;c<3;c++)for(let r=0;r<2;r++){const name=`Cape${c}_${r}`;B(name).quaternion.copy(idleCape.get(name));if(!r)B(name).quaternion.premultiply(swing);}}
 root.updateMatrixWorld(true);
 const bowQ=bowFrame,localBowQ=B('Hand_R').getWorldQuaternion(new T.Quaternion()).invert().multiply(bowQ);objects[gear.bowRoot].quaternion.copy(localBowQ);root.updateMatrixWorld(true);
 if(mode==='death'){rootY=groundFall();bowPosition.copy(B('Hand_R').localToWorld(gripR.clone()));}
 const arrowNock=bowPosition.clone().add(new T.Vector3(nockOffset(stringDraw),BOW.nockY,0).applyQuaternion(bowQ)),released=shooting&&t>=1.18;let arrowScale=shooting&&t>.46&&t<1.6?1:0;
 // Once loosed, the arrow and its glint keep the aim line, not the tipping bow.
 if(released)arrowNock.copy(releaseNock).add(offset).add(new T.Vector3(0,(t-1.18)*.03,(t-1.18)*3.7));
 const shotQ=released?aimFrame:bowQ;objects[gear.arrow].quaternion.copy(shotQ);
 objects[gear.arrow].position.copy(arrowNock);objects[gear.arrow].scale.setScalar(arrowScale);
 const age=isShooting(mode)?t-1.18:-1,flair=age>=0&&age<.14?Math.sin(Math.PI*age/.14):0;
 objects[gear.flare].quaternion.copy(shotQ);objects[gear.flare].position.copy(bowPosition).add(new T.Vector3(-.035,.025,0).applyQuaternion(shotQ));objects[gear.flare].scale.setScalar(flair*(1+age*5));
 for(let i=0;i<gear.sparks.length;i++){const spark=objects[gear.sparks[i]],angle=i*Math.PI*2/5;spark.position.copy(bowPosition).add(new T.Vector3(-age*.4,.025+Math.sin(angle)*Math.max(0,age)*.45,Math.cos(angle)*Math.max(0,age)*.45).applyQuaternion(shotQ));spark.scale.setScalar(flair);}
 return {stringDraw,blink:blinkAt(t,mode),bowPosition,arrowNock,root:[rootX,rootY,rootZ],flair,stage:shooting?a.stage:mode};
}

// Slide the full-draw grip along the aim line until the bow arm is all but
// locked: these short segments only read as straight close to full reach.
const fullGrip=new T.Vector3(...AIM.grip);
{
 const saved=structuredClone(metrics),reach=rest.get('Forearm_R').p.length()+rest.get('Hand_R').p.length();
 // Fit across the whole anchor hold; the bow paw's twist settles per frame.
 const extension=t=>{composePose('attack',t,new PinnedCloth(clothColumns));return B('Hand_R').getWorldPosition(new T.Vector3()).distanceTo(B('UpperArm_R').getWorldPosition(new T.Vector3()))/reach;};
 let near=.30,far=.70;for(let i=0;i<18;i++){fullGrip.z=(near+far)/2;if(Math.max(...[1.02,1.06,1.10,1.14,1.18].map(extension))>.988)far=fullGrip.z;else near=fullGrip.z;}fullGrip.z=near;
 Object.assign(metrics,saved,{aimGrip:fullGrip.toArray()});
}
g.animations=[];let idleCape=null;
for(const [mode,info]of Object.entries(CLIPS)){
 const frameCount=Math.ceil(info.duration*60)+1,times=Float32Array.from({length:frameCount},(_,i)=>Math.min(i/60,info.duration)),cloth=new PinnedCloth(clothColumns),frames=[];
 // Pre-roll six complete periods with the same periodic force as the bake.
 const steps=(frameCount-1)*2,dt=info.duration/steps;
 function stepCloth(i){const phase=(i%steps)/steps*Math.PI*2,time=(i%steps)/steps*info.duration;cloth.step(dt,phase,mode==='run'?.7*Math.sin(phase*2):isShooting(mode)&&time>1.18&&time<1.3?-1.2:0,mode.startsWith('dodge')?Math.sin(phase):0);}
 for(let i=0;i<steps*6;i++)stepCloth(i);
 const tracks=new Map(),add=(node,path,value)=>{const key=node+':'+path;if(!tracks.has(key))tracks.set(key,{node,path,width:value.length,values:[]});tracks.get(key).values.push(...value);};
 for(let frame=0;frame<frameCount;frame++){
  const t=times[frame];if(frame)for(let sub=0;sub<2;sub++)stepCloth((frame-1)*2+sub);metrics.maxClothLengthError=Math.max(metrics.maxClothLengthError,cloth.error());
  const state=composePose(mode,t,cloth);if(mode==='idle'&&!frame)idleCape=new Map(Array.from({length:6},(_,i)=>`Cape${i>>1}_${i&1}`).map(name=>[name,B(name).quaternion.clone()]));frames.push({time:t,stage:state.stage,draw:state.stringDraw,blink:state.blink});
  for(const [name,id]of boneNodes){add(id,'rotation',objects[id].quaternion.toArray());if(name==='Root'||name.startsWith('Clavicle'))add(id,'translation',objects[id].position.toArray());}
  const age=isShooting(mode)?t-1.18:-1,recoil=age>=0?.025*Math.sin(age*80)*Math.exp(-age*20):0;
  for(const id of [blinkRig.open,blinkRig.closed])add(id,'weights',mode==='idle'?foxExpressions(t,mode):[0,0,0]);
  add(gear.bowRoot,'rotation',objects[gear.bowRoot].quaternion.toArray());const closed=state.blink>.5;add(blinkRig.open,'scale',closed?[0,0,0]:[1,1,1]);add(blinkRig.closed,'scale',closed?[1,1,1]:[0,0,0]);add(gear.string,'weights',[state.stringDraw+recoil]);add(gear.bow,'weights',[state.stringDraw+recoil]);add(gear.arrow,'rotation',objects[gear.arrow].quaternion.toArray());add(gear.flare,'rotation',objects[gear.flare].quaternion.toArray());
  for(const id of [gear.arrow,gear.flare,...gear.sparks]){add(id,'translation',objects[id].position.toArray());add(id,'scale',objects[id].scale.toArray());}
 }
 // Match the seam of repeated actions; one-shot clips retain their final pose.
 if(info.loop)for(const track of tracks.values()){const width=track.width;const error=Math.max(...Array.from({length:width},(_,k)=>Math.abs(track.values[k]-track.values[track.values.length-width+k])));const isEffect=[gear.arrow,gear.flare,...gear.sparks].includes(track.node);if(!isEffect&&error>1e-4)throw Error(`Visible loop seam ${mode} ${g.nodes[track.node].name} ${track.path}: ${error}`);for(let k=0;k<width;k++)track.values[track.values.length-width+k]=track.values[k];}
 const input=append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[info.duration];const clip={name:info.name,samplers:[],channels:[],extras:{loop:info.loop,mode,velocity:info.velocity}};
 for(const track of tracks.values()){const width=track.path==='rotation'?'VEC4':track.path==='weights'?'SCALAR':'VEC3',output=append(new Float32Array(track.values),width),sampler=clip.samplers.push({input,output,interpolation:track.path==='scale'&&[blinkRig.open,blinkRig.closed].includes(track.node)?'STEP':'LINEAR'})-1;clip.channels.push({sampler,target:{node:track.node,path:track.path}});}
 g.animations.push(clip);metrics.clips[mode]={duration:info.duration,frames:frameCount};
}
// Open the portable asset in the finished relaxed pose, even in viewers that
// do not start an animation. Inverse binds still retain the authored bind pose.
for(const channel of g.animations[0].channels){const sampler=g.animations[0].samplers[channel.sampler],width=channel.target.path==='rotation'?4:channel.target.path==='weights'?(g.meshes[g.nodes[channel.target.node].mesh].weights?.length||1):3;g.nodes[channel.target.node][channel.target.path]=Array.from(read(sampler.output).subarray(0,width));}
g.extras.foxAnimated={scope:'Base fox 3D preview only',source:'fox-repaired.glb',proportions:{shoulderHalfWidth:.20,armLengthScale:.75,legLengthScale:.70,heightOffset:HEIGHT},handedness:{bow:'right',draw:'left'},equipment:gear,blinkRig,hands,clips:CLIPS,metrics};
g.asset.generator='AutoB model-specific chibi rig and animation bake';
fs.mkdirSync('docs/evidence/meshy-fox-archer-stance',{recursive:true});fs.writeFileSync('docs/evidence/meshy-fox-archer-stance/build.json',JSON.stringify(metrics,null,2));
glb.write('public/meshy-fox-preview/fox-animated.glb');console.log(JSON.stringify({bones:skin.joints.length,...metrics}));
