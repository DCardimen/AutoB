import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as T from 'three';
import {readGLB} from './lib/glb.mjs';
import {addEquipment} from './lib/fox-equipment.mjs';
import {addSimplePaws} from './lib/fox-simple-paws.mjs';
import {addFoxFace} from './lib/fox-face.mjs';
import {foxExpressions} from '../public/meshy-fox-preview/fox-expressions.mjs';
import {PinnedCloth} from './lib/fox-dynamics.mjs';
import {KayKitMotion} from './lib/kaykit-motion.mjs';
import {CLIPS,BOW,AIM,ARROW,QUIVER,DODGE,DASH,NOCK,BOW_ANGLES,READY_CANT,RELEASE,STANCE,TAIL_REST,nockOffset,smooth,lerp,spring,blinkAt,angerAt,attackAt,footCycle,isShooting,isTurn,isAttackLoop,isRunStop,settlesToIdle,tailSwishAngle} from '../public/meshy-fox-preview/fox-motion.mjs';

const EVIDENCE='docs/evidence/meshy-fox-archer-v3';
const glb=readGLB('public/meshy-fox-preview/fox-repaired.glb'),g=glb.json,{read,append}=glb;
const body=g.meshes[0].primitives[0],originalPositions=Float32Array.from(read(body.attributes.POSITION)),oldNormals=Float32Array.from(read(body.attributes.NORMAL)),oldJ=Uint16Array.from(read(body.attributes.JOINTS_0)),oldW=Float32Array.from(read(body.attributes.WEIGHTS_0));
const originalIndices=Uint16Array.from(read(body.indices)),sourceUV=Float32Array.from(read(body.attributes.TEXCOORD_0));
const skin=g.skins[0],boneNodes=new Map(skin.joints.map(id=>[g.nodes[id].name,id])),oldJointNames=skin.joints.map(id=>g.nodes[id].name),oldWorld=new Map();
function walk(id,p=new T.Vector3()){const node=g.nodes[id],v=p.clone().add(new T.Vector3(...node.translation||[0,0,0]));oldWorld.set(id,v);for(const c of node.children||[])walk(c,v);}for(const id of g.scenes[0].nodes)walk(id);
const HEIGHT=.096;
// The uploaded tail was modelled beside the left thigh. Move the complete
// painted tail (and every bind joint) onto the sacrum, behind the belt.
// This is a rigid registration repair, preserving its length and thickness.
const TAIL_SOCKET_SHIFT=new T.Vector3(-.035,.10,-.10);
const kaykit=new KayKitMotion();
function yMap(y){return y<.2?y:y<.52?.2+(y-.2)*.7:y-HEIGHT;}
function xMap(x){const a=Math.abs(x),sign=Math.sign(x);return sign*(a<=.13?a:a<.275?.13+(a-.13)*(.07/.145):a<.635?.20+(a-.275)*.75:a-.165);}
function regionWeight(vertex,predicate){let sum=0;for(let k=0;k<4;k++)if(predicate(oldJointNames[oldJ[vertex*4+k]]))sum+=oldW[vertex*4+k];return sum;}
function setInfluences(vertex,list){const sorted=[...list].filter(([,w])=>w>1e-7).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=sorted.reduce((s,[,w])=>s+w,0);for(let k=0;k<4;k++){oldJ[vertex*4+k]=sorted[k]?.[0]||0;oldW[vertex*4+k]=(sorted[k]?.[1]||0)/sum;}}
// The source's front/lower tail fluff extends toward z=-.10. The first repair
// left that surface on the left thigh; include the complete visible bulb.
let correctedTailVertices=0;
for(let v=0;v<originalPositions.length/3;v++){
 const [x,y,z]=originalPositions.subarray(v*3,v*3+3),gate=smooth(.285,.31,x)*smooth(.02,-.06,z)*smooth(.20,.25,y)*(1-smooth(.70,.77,y));if(gate<=0)continue;
 const centres=g.extras.foxRigRepair.tailPoints;let n=0;while(n<4&&x>centres[n+1][0])n++;const t=smooth(centres[n][0],centres[n+1][0],x),list=new Map();for(let k=0;k<4;k++)list.set(oldJ[v*4+k],(list.get(oldJ[v*4+k])||0)+oldW[v*4+k]*(1-gate));
 for(const [name,w]of [[`Tail_${String(n).padStart(2,'0')}`,1-t],[`Tail_${String(n+1).padStart(2,'0')}`,t]]){const id=oldJointNames.indexOf(name);list.set(id,(list.get(id)||0)+w*gate);}
 if(regionWeight(v,n=>n.startsWith('Tail_'))<.999)correctedTailVertices++;setInfluences(v,list);
}
// The tunic's gold hem trim beside the tail root carried up to a fifth tail
// weight, so every swing of the tail dragged the trim with it. Costume-coloured
// vertices hand their tail weight to the pelvis; tail fur keeps its weights.
const vertexColour=JSON.parse(execFileSync('python',['scripts/lib/sample-glb-texture.py'],{input:JSON.stringify({file:'public/meshy-fox-preview/fox-repaired.glb',uvs:Array.from({length:sourceUV.length/2},(_,i)=>[sourceUV[i*2],sourceUV[i*2+1]])}),maxBuffer:64*1024*1024}));
const costume=v=>{const [r,gr,b]=vertexColour.slice(v*3,v*3+3);return (gr>r*1.15&&gr>b&&gr>40)||(r>150&&gr>110&&b<110&&r<gr*1.5);};
// The proximal orange fur was still weighted to the thigh. Include that
// complete bridge in the tail, while keeping the green/gold tunic on pelvis.
for(let v=0;v<originalPositions.length/3;v++){
 const [x,y,z]=originalPositions.subarray(v*3,v*3+3),tail=regionWeight(v,n=>n.startsWith('Tail_'));
 if(costume(v)||tail<=.01||x<.07||z>-.12||y<.28||y>.70)continue;
 const centres=g.extras.foxRigRepair.tailPoints;let i=0;while(i<4&&x>centres[i+1][0])i++;const t=smooth(centres[i][0],centres[i+1][0],x);
 setInfluences(v,[[oldJointNames.indexOf(`Tail_${String(i).padStart(2,'0')}`),1-t],[oldJointNames.indexOf(`Tail_${String(i+1).padStart(2,'0')}`),t]]);
}
let hemVertices=0;const pelvisJoint=oldJointNames.indexOf('Pelvis');
for(let v=0;v<originalPositions.length/3;v++){const tail=regionWeight(v,n=>n.startsWith('Tail_'));if(tail<=0||tail>=.5||!costume(v))continue;hemVertices++;const list=new Map();for(let k=0;k<4;k++){const id=oldJointNames[oldJ[v*4+k]].startsWith('Tail_')?pelvisJoint:oldJ[v*4+k];list.set(id,(list.get(id)||0)+oldW[v*4+k]);}setInfluences(v,list);}
// A tail-owned vertex cannot inherit even a small thigh/boot influence.
// Residual weights here were the visible leg attachment during crouching.
for(let v=0;v<originalPositions.length/3;v++)if(regionWeight(v,n=>n.startsWith('Tail_'))>.5){const list=[];for(let k=0;k<4;k++)if(oldJointNames[oldJ[v*4+k]].startsWith('Tail_'))list.push([oldJ[v*4+k],oldW[v*4+k]]);setInfluences(v,list);}
const position=new Float32Array(originalPositions.length),normal=new Float32Array(oldNormals.length);
for(let i=0;i<position.length/3;i++){
 const x=originalPositions[i*3],y=originalPositions[i*3+1],z=originalPositions[i*3+2],arm=regionWeight(i,n=>/arm|hand|clavicle/i.test(n)),tail=regionWeight(i,n=>n.startsWith('Tail_'));
 position.set([lerp(x,xMap(x),arm)+TAIL_SOCKET_SHIFT.x*tail,lerp(yMap(y),y-HEIGHT,tail)+TAIL_SOCKET_SHIFT.y*tail,z+arm*.065+TAIL_SOCKET_SHIFT.z*tail],i*3);
 const ax=Math.abs(x),dx=ax<.13?1:ax<.275?.07/.145:ax<.635?.75:1,dy=y>.2&&y<.52?.7:1;
 new T.Vector3(oldNormals[i*3]/lerp(1,dx,arm),oldNormals[i*3+1]/lerp(dy,1,tail),oldNormals[i*3+2]).normalize().toArray(normal,i*3);
}
body.attributes.POSITION=append(position,'VEC3',5126,34962);body.attributes.NORMAL=append(normal,'VEC3',5126,34962);
// Refit bones to the shortened mesh, with shoulder pivots inside the tunic.
const world=new Map();for(const [name,id]of boneNodes){const p=oldWorld.get(id).clone();p.y=name.startsWith('Tail_')?p.y-HEIGHT:yMap(p.y);if(name.startsWith('Tail_'))p.add(TAIL_SOCKET_SHIFT);if(/arm|hand|clavicle/i.test(name)){p.x=xMap(p.x);p.z+=.065;}world.set(name,p);}
function addBone(name,parent,p){const id=g.nodes.push({name,translation:[0,0,0]})-1;boneNodes.set(name,id);world.set(name,new T.Vector3(...p));const parentID=boneNodes.get(parent);g.nodes[parentID].children??=[];g.nodes[parentID].children.push(id);skin.joints.push(id);return id;}
const clothColumns=[];
for(let c=0;c<3;c++){
 const x=(c-1)*.13,points=[[x,.83-HEIGHT,-.10],[x,.75-HEIGHT,-.145],[x*.9,.665-HEIGHT,-.11]];clothColumns.push(points);
 points.forEach((p,i)=>addBone(`Cape${c}_${i}`,i?`Cape${c}_${i-1}`:'Chest',p));
}
const jointIndex=new Map(skin.joints.map((id,i)=>[g.nodes[id].name,i])),weights=new Float32Array(oldW),joints=new Uint16Array(oldJ);
function merge(a,b,t){const m=new Map();for(const [id,w]of a)m.set(id,(m.get(id)||0)+w*(1-t));for(const [id,w]of b)m.set(id,(m.get(id)||0)+w*t);return [...m];}
for(let i=0;i<position.length/3;i++){
 const [x,y,z]=originalPositions.subarray(i*3,i*3+3),ax=Math.abs(x);let list=Array.from({length:4},(_,k)=>[oldJ[i*4+k],oldW[i*4+k]]);
 const cape=smooth(-.065,-.115,z)*smooth(.64,.68,y)*(1-smooth(.81,.86,y))*(1-smooth(.21,.26,ax));
 if(cape>0){const cx=Math.max(0,Math.min(2,x/.13+1)),c0=Math.floor(cx),c1=Math.min(2,c0+1),ct=cx-c0,row=y>.75?0:1,rt=y>.75?1-smooth(.75,.83,y):1-smooth(.665,.75,y);const b=[];for(const [c,cw]of [[c0,1-ct],[c1,ct]])for(const [r,rw]of [[row,1-rt],[row+1,rt]])b.push([jointIndex.get(`Cape${c}_${r}`),cw*rw]);list=merge(list,b,cape);}
 list=list.filter(([,w])=>w>1e-6).sort((a,b)=>b[1]-a[1]).slice(0,4);const sum=list.reduce((s,[,w])=>s+w,0);for(let k=0;k<4;k++){joints[i*4+k]=list[k]?.[0]||0;weights[i*4+k]=(list[k]?.[1]||0)/sum;}
}
body.attributes.JOINTS_0=append(joints,'VEC4',5123,34962);body.attributes.WEIGHTS_0=append(weights,'VEC4',5126,34962);
const parents=new Map();g.nodes.forEach((n,i)=>n.children?.forEach(c=>parents.set(c,i)));
for(const [name,id]of boneNodes){const parentName=g.nodes[parents.get(id)]?.name,p=world.get(name),parent=world.get(parentName)||new T.Vector3();g.nodes[id].translation=p.clone().sub(parent).toArray();}
const inverseBinds=new Float32Array(skin.joints.length*16);skin.joints.forEach((id,i)=>new T.Matrix4().makeTranslation(...world.get(g.nodes[id].name).toArray()).invert().toArray(inverseBinds,i*16));skin.inverseBindMatrices=append(inverseBinds,'MAT4');
const visibleBodyIndices=[];for(let i=0;i<originalIndices.length;i+=3){const tri=Array.from(originalIndices.subarray(i,i+3));if(tri.some(v=>Math.abs(originalPositions[v*3])>.670&&originalPositions[v*3+1]>.72&&originalPositions[v*3+1]<.94))continue;visibleBodyIndices.push(...tri);}
const face=addFoxFace(glb,boneNodes,originalPositions,position,normal,new Uint16Array(visibleBodyIndices),sourceUV,world.get('Head').toArray()),hands=addSimplePaws(glb,boneNodes),gear=addEquipment(glb,boneNodes,world);
const objects=g.nodes.map(n=>{const o=new T.Object3D();o.name=n.name;o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);return o;});
g.nodes.forEach((n,i)=>n.children?.forEach(c=>objects[i].add(objects[c])));const root=objects[0],B=name=>objects[boneNodes.get(name)],rest=new Map([...boneNodes].map(([name,id])=>[name,{p:objects[id].position.clone(),q:objects[id].quaternion.clone()}]));
// Hand-frame reference axes follow the turning root; identity in other clips.
const frameYaw=new T.Quaternion(),up=new T.Vector3(0,1,0),gripR=new T.Vector3(-.095,-.025,-.025),gripL=new T.Vector3(.130,0,0),handAttackR=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
const metrics={maxIKError:0,maxSolverIterationError:0,maxGripError:0,maxWristAngle:0,maxClothLengthError:0,correctedTailVertices,hemVertices,shoulderHalfWidth:world.get('UpperArm_L').x,armScale:.75,legScale:.70,clips:{},ikByClip:{}};let activePose={};
const bodyVertices=[...new Set(visibleBodyIndices)],inverseRest=skin.joints.map(id=>new T.Matrix4().makeTranslation(...world.get(g.nodes[id].name).toArray()).invert());
function groundFall(){
 const transforms=skin.joints.map((id,i)=>objects[id].matrixWorld.clone().multiply(inverseRest[i]));let min=Infinity;
 for(const i of bodyVertices){const p=new T.Vector3().fromArray(position,i*3),v=new T.Vector3();for(let k=0;k<4;k++)if(weights[i*4+k])v.addScaledVector(p.clone().applyMatrix4(transforms[joints[i*4+k]]),weights[i*4+k]);min=Math.min(min,v.y);}
 for(const id of [hands.R,hands.L,gear.bow,gear.string,gear.quiver]){objects[id].traverse(o=>{const n=g.nodes[objects.indexOf(o)];if(n?.mesh===undefined)return;for(const primitive of g.meshes[n.mesh].primitives){const p=read(primitive.attributes.POSITION);for(let i=0;i<p.length;i+=3)min=Math.min(min,new T.Vector3().fromArray(p,i).applyMatrix4(o.matrixWorld).y);}});}
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
 if(process.env.DIST_LOG===activePose.mode&&aName==='UpperArm_L'&&!iteration)console.error('D',activePose.t.toFixed(3),(distance/(lenA+lenB)).toFixed(3));const error=end.getWorldPosition(new T.Vector3()).addScaledVector(bDir,extension).distanceTo(target);if(iteration)metrics.maxSolverIterationError=Math.max(metrics.maxSolverIterationError,error);else{metrics.maxIKError=Math.max(metrics.maxIKError,error);if(error>(metrics.ikByClip[activePose.mode]?.error||0))metrics.ikByClip[activePose.mode]={error,limb:aName,time:activePose.t,distance,reach:lenA+lenB};}return error;
}
function arm(side,palm,q,pole,bowFrame=null,gripInfluence=1,forearmInfluence=1){
 if(side==='L'){
  solveIK('UpperArm_L','Forearm_L','Hand_L',palm,pole,new T.Vector3(1,0,0).applyQuaternion(frameYaw),false,.130);
  const dir=B('Hand_L').getWorldPosition(new T.Vector3()).sub(B('Forearm_L').getWorldPosition(new T.Vector3())).normalize();
  // Archer clips take the paw's roll from the forearm's own twist: a fixed
  // sideways hint runs parallel to the forearm whenever the arm reaches out
  // to the side (carrying an arrow from the quiver) and would flip the paw.
  q=frameQuaternion(new T.Vector3(1,0,0),dir,new T.Vector3(1,0,0).applyQuaternion(frameYaw));if(bowFrame)q.slerp(frameQuaternion(new T.Vector3(1,0,0),dir,new T.Vector3(0,1,0).applyQuaternion(B('Forearm_L').getWorldQuaternion(new T.Quaternion()))),forearmInfluence);
  if(bowFrame){const stringAxis=new T.Vector3(0,1,0).applyQuaternion(bowFrame),z=stringAxis.addScaledVector(dir,-stringAxis.dot(dir)).normalize(),up=z.clone().cross(dir).normalize();q.slerp(frameQuaternion(new T.Vector3(1,0,0),dir,up),gripInfluence);setGlobalQuaternion(B('Forearm_L'),B('Forearm_L').getWorldQuaternion(new T.Quaternion()).slerp(frameQuaternion(rest.get('Hand_L').p.clone().normalize(),dir,new T.Vector3(0,1,0).applyQuaternion(q)),forearmInfluence));}
  setGlobalQuaternion(B('Hand_L'),q);
  const gripError=B('Hand_L').localToWorld(gripL.clone()).distanceTo(palm);metrics.maxGripError=Math.max(metrics.maxGripError,gripError);const clip=(metrics.armByClip??={})[activePose.mode]??={grip:0,wrist:0};if(gripError>clip.grip)Object.assign(clip,{grip:gripError,gripAt:activePose.t,gripSide:'L'});return q;
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
 const dir=B('Hand_'+side).getWorldPosition(new T.Vector3()).sub(B('Forearm_'+side).getWorldPosition(new T.Vector3())).normalize(),wristAngle=dir.angleTo(forward.clone().applyQuaternion(q));if(wristAngle>metrics.maxWristAngle){metrics.maxWristAngle=wristAngle;metrics.worstWrist={...activePose,side};}const gripError=B('Hand_'+side).localToWorld(grip.clone()).distanceTo(palm);metrics.maxGripError=Math.max(metrics.maxGripError,gripError);const clip=(metrics.armByClip??={})[activePose.mode]??={grip:0,wrist:0};if(gripError>clip.grip)Object.assign(clip,{grip:gripError,gripAt:activePose.t,gripSide:side});if(wristAngle>clip.wrist)Object.assign(clip,{wrist:wristAngle,wristAt:activePose.t,wristSide:side});return q;
}
function naturalArms(mode,t){
 const idle=kaykit.sample('Idle_A',settlesToIdle(mode)||mode==='attackEnter'?0:t/CLIPS[mode].duration),move=mode==='run'?kaykit.sample('Running_A',t/CLIPS.run.duration):mode==='walk'?kaykit.sample('Walking_A',t/CLIPS.walk.duration):null,result={};
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
   // The bow paw swings a little wider so the bow clears the leg.
   upper.set(sign*(side==='R'?.82:.55),-Math.cos(theta),Math.sin(theta)).normalize();lower.set(sign*.15,-Math.cos(theta+flex),Math.sin(theta+flex)).normalize();
  }else if(move){const angle=t/CLIPS[mode].duration*Math.PI*2+(side==='R'?0:Math.PI);let swing=-.23*Math.cos(angle);
   // Walking has a long stance, so half the pendulum follows the opposite
   // paw's real travel; each arm peaks with the contralateral footfall.
   swing=.5*swing+.5*.23*footCycle('walk',t,side==='R'?'L':'R').z/.055;upper.z=swing;lower.z=.12+swing*.72;upper.normalize();lower.normalize();}
  // Braking from a run, both arms carry forward on their momentum and settle.
  if(isRunStop(mode)){const carry=smooth(0,.09,t)*(1-smooth(.20,.55,t));upper.z+=.50*carry;lower.z+=.85*carry;upper.normalize();lower.normalize();}

  const chestQ=B('Chest').getWorldQuaternion(new T.Quaternion());upper.applyQuaternion(chestQ);lower.applyQuaternion(chestQ);
  const shoulder=B('UpperArm_'+side).getWorldPosition(new T.Vector3()),elbow=shoulder.clone().addScaledVector(upper,rest.get('Forearm_'+side).p.length()),wrist=elbow.clone().addScaledVector(lower,rest.get('Hand_'+side).p.length()),q=frameQuaternion(new T.Vector3(sign,0,0),lower,new T.Vector3(sign,0,0).applyQuaternion(frameYaw));
  const palm=wrist.clone().add((side==='R'?gripR:gripL).clone().applyQuaternion(q));
  result[side]={palm,q,pole:elbow.clone().addScaledVector(upper,.04)};
 }
 return result;
}

// v2 timing helpers. A front-loaded burst (zero speed at both ends, peak at a
// quarter) gives dodges and dashes their snap; bump is a 0-1-0 arc.
const burst=x=>{x=Math.max(0,Math.min(1,x));return 1-(1-x)**4*(1+4*x);};
const bump=(a,b,x)=>Math.sin(Math.PI*smooth(a,b,x));
// A gentler (cubic) ease: a half-turn's head lead peaks a fifth slower.
const soft=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const tilt=angle=>new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle);
const aimFrameFor=cant=>new T.Quaternion().setFromAxisAngle(up,Math.PI/2).multiply(tilt(cant));
const bowVariant=mode=>CLIPS[mode].bow==='sideways'?'canted':CLIPS[mode].bow||'canted',gripKey=mode=>CLIPS[mode].crouch?'crouched':bowVariant(mode),fullGrips={};
const quiverAxis=new T.Vector3(...QUIVER.axis).normalize(),quiverMouth=new T.Vector3(...QUIVER.mouth),chestRest=world.get('Chest');
// A point on the quiver axis, `along` past the mouth, in the chest's frame.
const quiverLocal=along=>quiverMouth.clone().addScaledVector(quiverAxis,along).sub(chestRest);
const colliders=[{a:quiverMouth.clone().addScaledVector(quiverAxis,-QUIVER.length),b:quiverMouth.clone(),radius:QUIVER.radius+.035}];
const bezier=(a,c,b,s)=>a.clone().multiplyScalar((1-s)*(1-s)).addScaledVector(c,2*s*(1-s)).addScaledVector(b,s*s);
const cubic=(a,c,d,b,s)=>a.clone().multiplyScalar((1-s)**3).addScaledVector(c,3*s*(1-s)**2).addScaledVector(d,3*s*s*(1-s)).addScaledVector(b,s**3);
// Readiness of the standing archer: 1 throughout the shot loops and moving
// shots; the enter and exit clips ramp it in and out, foot by foot.
function archerRamps(mode,t){
 if(isShooting(mode))return {wind:1,bow:1,hand:1,front:1,rear:1};
 if(mode==='attackEnter')return {wind:smooth(.04,.42,t),bow:smooth(.05,.44,t),hand:smooth(.03,.40,t),front:smooth(.02,.22,t),rear:smooth(.14,.38,t)};
 if(mode==='attackExit')return {wind:1-smooth(.08,.48,t),bow:1-smooth(.02,.40,t),hand:1-smooth(0,.36,t),front:1-smooth(.22,.46,t),rear:1-smooth(.04,.26,t)};
 return null;
}
let idleCape=null,attackCape=null;
function composePose(mode,t,cloth){
 activePose={mode,t};frameYaw.identity();
 for(const [name,{p,q}]of rest){B(name).position.copy(p);B(name).quaternion.copy(q);}let rootY=-.008,rootX=0,rootZ=0;
 const info=CLIPS[mode],D=info.duration,u=t/D,turn=info.turn||0,quick=!!info.quick,stop=isRunStop(mode),pivot=stop&&!!turn,enter=mode==='attackEnter',exit=mode==='attackExit';
 const phase=settlesToIdle(mode)||enter?0:u*Math.PI*2,shooting=isShooting(mode),ramps=archerRamps(mode,t),archer=!!ramps,standing=isAttackLoop(mode)||enter||exit;
 const aT=enter||exit?0:t,a=attackAt(aT),moving=mode==='walk'||mode==='run'||mode.startsWith('shoot'),dash=mode==='dash'||mode==='dashBack';
 if(moving)rootY=-.032+.003*Math.cos(phase*(shooting?4:2));
 if(mode==='run'||mode==='walk'){const run=mode==='run',pelvis=-(run?.06:.025)*Math.sin(phase),spine=(run?.10:.05)*Math.sin(phase),lean=run?.10:.018,tilt=run?.05:0;
  // v2: the weight shifts over each support paw, with a matching hip roll.
  const shift=run?-.005*Math.sin(phase+2*Math.PI*.06):-.007*Math.sin(phase-2*Math.PI*.07);rootX=shift;
  B('Pelvis').rotation.set(tilt,pelvis,-2.5*shift);B('Spine').rotation.set(0,spine,1.5*shift);B('Chest').rotation.x=lean;
  // Gaze stabilization: neck and head absorb nine tenths of the trunk's yaw and lean.
  B('Neck').rotation.set(-.4*(lean+tilt),-.4*(pelvis+spine),0);B('Head').rotation.set(-.5*(lean+tilt),-.5*(pelvis+spine),0);
  // The run sinks at each mid-stance and rises through the flight phase.
  if(run)rootY=-.060-.008*Math.cos(2*phase-2*Math.PI*.4);}
 // A run stop starts at the run's crouch. The planted paw brakes, the trunk
 // leans back over it and sinks to absorb the stop, then rises into Idle's
 // first frame. Braking into a pivot stops shorter and harder.
 const slideTime=pivot?.26:.30,stopEnd=CLIPS.run.velocity[2]*slideTime/2;let stopBrace=0;
 if(stop){const slide=Math.min(t,slideTime);rootZ=CLIPS.run.velocity[2]*(slide-slide*slide/(2*slideTime));stopBrace=smooth(.02,.13,t)*(1-smooth(.26,.56,t));
  rootY=lerp(-.045,-.008,smooth(.26,pivot?.70:.58,t))-.022*smooth(.03,.17,t)*(1-smooth(.28,.60,t));B('Pelvis').rotation.x=-.09*stopBrace;B('Chest').rotation.x=-.11*stopBrace;B('Head').rotation.x=.11*stopBrace;}
 // Idle breathes and slowly shifts its weight from paw to paw.
 if(mode==='idle'){rootY+=.0018*Math.sin(phase);rootX=.004*Math.sin(phase);B('Pelvis').rotation.z=-.012*Math.sin(phase);}
 let hipTwist=0;
 if(archer){
  const s=ramps.wind,travel=info.travel,twist=.80*s,bowUp=a.raise*(1-a.recover),reaching=a.reach*(1-a.carry);
  // Archer's wind-up: the bow shoulder leads toward the target. The chest
  // turn is shared by every shot so both shoulders meet the same aim line.
  // Standing, the hips stay square over the split stance. Moving, they turn
  // toward the travel direction while the chest keeps the aim.
  hipTwist=standing?0:.06*s+.22*Math.sin(travel)*Math.sign(Math.cos(travel)||1);
  B('Pelvis').rotation.y=hipTwist;B('Spine').rotation.y=.45*(twist-hipTwist);B('Chest').rotation.set(.025*a.aim-.03*reaching,.55*(twist-hipTwist),0);
  // Neck and head unwind the twist so the face stays on the target line and
  // the left eye sights along the arrow, with a slight tilt toward the string.
  B('Neck').rotation.y=-.42*twist;B('Head').rotation.set(-.025*a.aim+.03*reaching,-.58*twist,.06*a.aim);
  // The bow shoulder pushes forward while the bow is up. The draw shoulder
  // rolls back and up to reach the quiver, settles back as it pulls, creeps
  // back under back tension at anchor and snaps back on the loose.
  B('Clavicle_R').position.z+=.075*bowUp;B('Clavicle_L').position.z+=.075*bowUp*(1-.70*a.aim)-.006*a.hold-.025*a.follow-.09*reaching;B('Clavicle_L').position.y+=.075*reaching;
  rootY-=.010*a.aim+(standing?.022*s:0);
  // A crouched shot sinks the hips straight down over the planted paws, so the
  // upper body, bow line and draw keep the standing shot's geometry.
  if(info.crouch)rootY-=info.crouch*s;
 }
 // A duck: a quick drop under a swing, head down and back up, paws planted.
 if(mode==='duck'){const low=smooth(0,.10,t)*(1-smooth(.34,.68,t));rootY-=.11*low;rootZ-=.02*low;B('Pelvis').rotation.x+=.12*low;B('Chest').rotation.x+=.26*low;B('Head').rotation.x-=.22*low;}
 // Acrobatic shots preserve the coupled bow/string/paws. Flight has a
 // compression, takeoff, hang and soft landing; the legs tuck independently.
 let air=0,roll=0;
 if(info.acro==='jump'){const flight=smooth(.48,.86,t)*(1-smooth(1.30,1.74,t));air=.34*flight;rootY+=air-.035*bump(.22,.58,t)-.035*bump(1.64,1.94,t);}
 if(info.acro==='slide'){const low=smooth(.08,.38,t)*(1-smooth(1.65,2.12,t));rootZ=.72*smooth(.10,1.72,t);rootY-=.045*low;}
 if(info.acro==='flip'||info.acro==='vault'){const f=smooth(.12,D-.14,t),flight=Math.sin(Math.PI*f);air=(info.flip?.88:.58)*flight;rootY+=air-.025*bump(0,.14,t)-.025*bump(D-.18,D,t);if(info.flip){rootX=info.flip*.70*f;roll=-info.flip*Math.PI*2*f;B('Root').rotation.z=roll;const cy=world.get('Pelvis').y;rootX+=Math.sin(roll)*cy;rootY+=(1-Math.cos(roll))*cy;}else{rootZ=.78*f;B('Chest').rotation.x=.32*flight;B('Head').rotation.x=-.22*flight;}}
 // Turns are led by the gaze: head, then chest, then hips. v2 turns are
 // quicker, with a small counter-move before the hips go and a slight
 // overshoot that settles; each relative yaw still returns to zero, so the
 // final frame is Idle rotated by `turn`. A braking pivot starts its turn once
 // the slide has bitten.
 const tu=pivot?Math.max(0,(t-.22)/(D-.22)):u,snap=quick||pivot;
 const turnHead=(snap?soft(0,.64,tu):smooth(0,.38,tu))+(snap?.02:.04)*bump(snap?.55:.30,snap?.95:.85,tu),turnChest=smooth(snap?.08:.05,snap?.66:.60,tu)+.06*bump(.45,1,tu),turnHips=smooth(snap?.08:.10,snap?.74:.76,tu)+.045*bump(.55,1,tu)-.03*bump(0,.16,tu);
 if(turn){
  B('Root').rotation.y=turn*turnHips;frameYaw.setFromAxisAngle(up,turn*turnHips);B('Spine').rotation.y=.5*turn*(turnChest-turnHips);B('Chest').rotation.y=.5*turn*(turnChest-turnHips);
  B('Neck').rotation.y=.4*turn*(turnHead-turnChest);B('Head').rotation.y=.6*turn*(turnHead-turnChest);B('Head').rotation.x+=.035*bump(0,snap?.6:.75,tu);
  rootY-=(snap?.024:.012)*Math.sin(Math.PI*tu);
 }
 // v2 dodges: a short dip, then a front-loaded burst sideways about two and a
 // half times faster than v1, a low lean into the move and a sprung landing.
 const dodge=mode.startsWith('dodge'),dodgeSign=mode==='dodgeLeft'?-1:1,dodgeProgress=burst((t-.03)/.27),dodgeEnvelope=smooth(0,.06,t)*(1-smooth(.30,.64,t));
 if(dodge){rootX=dodgeSign*DODGE*dodgeProgress-dodgeSign*.012*bump(0,.07,t);rootY-=.030*dodgeEnvelope+.030*bump(0,.10,t)+.035*bump(.24,.56,t)-.022*bump(.07,.27,t);rootZ=-.03*dodgeEnvelope;
  B('Pelvis').rotation.z=-dodgeSign*.10*dodgeEnvelope;B('Chest').rotation.z=-dodgeSign*.22*dodgeEnvelope;B('Head').rotation.z=dodgeSign*.12*dodgeEnvelope;}
 // A dash forward bursts and tucks; a dash away is a shorter hop leaning back
 // from the threat, the head counter-pitched so the gaze stays level on it.
 const dashDistance=DASH[mode]||0,dashSign=Math.sign(dashDistance);
 if(dash){const travelled=burst((t-.03)/.25),tuck=smooth(0,.07,t)*(1-smooth(.24,.50,t));rootZ=dashDistance*travelled;rootY-=.05*tuck;B('Chest').rotation.x=(dashSign>0?.18:-.12)*tuck;B('Head').rotation.x=(dashSign>0?-.09:.07)*tuck;}
 if(mode==='hit'){const recoil=smooth(0,.06,t)*(1-smooth(.14,.80,t));rootZ=-.065*recoil;rootY-=.025*recoil;B('Chest').rotation.x=-.20*recoil;B('Head').rotation.x=.12*recoil;}
 if(mode==='death'){const fall=smooth(.15,1.2,t);rootY=lerp(-.008,.25,fall);B('Root').rotation.x=-1.5*fall;rootZ=-.19*fall;}
 B('Root').position.set(rootX,rootY,rootZ);root.updateMatrixWorld(true);
 for(const side of ['R','L']){
  if(mode==='death'){const fall=smooth(.15,1.2,t);const bounce=t>1.1?Math.sin((t-1.1)*12)*Math.exp(-(t-1.1)*5)*.13:0;B('Thigh_'+side).rotation.x=(-1.0+bounce)*fall;B('Thigh_'+side).rotation.z=(side==='R'?-.10:.10)*fall;B('Shin_'+side).rotation.x=.85*fall;B('Foot_'+side).rotation.x=.12*fall;continue;}
  const target=world.get('Foot_'+side).clone(),cycle=moving?footCycle(shooting?'walk':mode,shooting?t/1.1:t,side):{z:0,y:0,support:true};
  // Moving shots step along their own travel direction in model space.
  const travel=info.travel;if(travel!==undefined){target.x+=cycle.z*Math.sin(travel);target.z+=cycle.z*Math.cos(travel);}else target.z+=cycle.z;target.y+=cycle.y;
  let lift=0;
  if(stop){
   // The bow-side paw lands ahead and holds; the other swings through beside it.
   if(side==='R'){const land=smooth(0,.07,t);target.z+=lerp(.03,stopEnd,land);target.y+=.02*(1-land);}
   else{const swing=smooth(.10,.36,t);target.z+=lerp(-.03,stopEnd,swing);lift=.05*Math.sin(Math.PI*swing)+.03*(1-smooth(0,.10,t));}
  }
  if(dash){const step=side==='R'?burst((t-.02)/.23):burst((t-.05)/.28);target.z+=dashDistance*step+(side==='R'?1:-1)*.04*dashSign*Math.sin(Math.PI*step);lift=.07*Math.sin(Math.PI*step);}
  if(dodge){const lead=(dodgeSign>0)===(side==='L'),step=lead?burst((t-.02)/.24):burst((t-.06)/.28);target.x+=dodgeSign*DODGE*step;lift=.065*Math.sin(Math.PI*step);target.z+=rootZ*.35;}
  if(mode==='death'){target.y+=.14*smooth(.2,1.1,t);target.z-=.12*smooth(.2,1.1,t);}
  // Toes follow the travel direction a little further than the hips.
  let footYaw=shooting&&travel!==undefined?1.2*(hipTwist-.06):0;
  if(standing){
   // Archer's stance: the front paw (STANCE.front) steps onto the target line
   // and points at the target; the rear paw steps back and turns out to its
   // own side. The stance holds through every shot of the loop; the enter and
   // exit clips step each paw in and out.
   const front=side===STANCE.front,out=side==='L'?1:-1,step=front?ramps.front:ramps.rear;
   target.add(new T.Vector3(...(front?[-out*.06,0,.095]:[out*.015,0,-.11])).multiplyScalar(step));lift=.045*Math.sin(Math.PI*step);footYaw=out*(front?.08:1.48)*step;
  }
  if(turn){
   // Each paw rotates about the turn centre in one or two lifted steps; the
   // paw on the turning side leads.
   const lead=turn>0?'L':'R',trail=lead==='L'?'R':'L',steps=snap?[[lead,0,.32,.02,.34],[trail,0,1,.14,.64],[lead,.32,1,.34,.72]]:Math.abs(turn)>1?[[lead,0,.40,.04,.32],[trail,0,1,.22,.58],[lead,.40,1,.48,.82]]:[[lead,0,1,.06,.40],[trail,0,1,.32,.72]];
   let share=0,turnLift=0;for(const [foot,from,to,start,end]of steps)if(foot===side&&tu>=start){const f=smooth(start,end,tu);share=lerp(from,to,f);turnLift+=(snap?.055:.045)*Math.sin(Math.PI*f);}
   const centre=new T.Vector3(0,0,stop?rootZ:0);target.sub(centre).applyAxisAngle(up,turn*share).add(centre);lift=Math.max(lift,turnLift);footYaw=turn*share;
  }
  target.y+=lift;
  if(info.acro==='jump'){target.y+=air;target.z-=.015*(air/.34);}
  if(info.acro==='slide')target.z+=rootZ;
  if(info.acro==='flip'||info.acro==='vault'){const f=smooth(.12,D-.14,t),flight=Math.sin(Math.PI*f);target.sub(world.get('Pelvis')).add(new T.Vector3(0,.10*flight,.045*flight));if(info.flip)target.applyAxisAngle(new T.Vector3(0,0,1),roll);target.add(world.get('Pelvis')).add(new T.Vector3(info.flip?info.flip*.70*f:rootX,air,rootZ));footYaw=0;}
  // The knee aims ahead of the paw; it travels with a sliding stop's root.
  const pole=new T.Vector3(side==='R'?-.23:.23,.30,.8).applyAxisAngle(up,footYaw);if(info.acro==='flip')pole.sub(world.get('Pelvis')).applyAxisAngle(new T.Vector3(0,0,1),roll).add(world.get('Pelvis')).add(new T.Vector3(info.flip*.70*smooth(.12,D-.14,t),air,rootZ));else if(info.acro==='vault')pole.add(new T.Vector3(rootX,air,rootZ));else if(stop)pole.z+=rootZ;
  solveIK(`Thigh_${side}`,`Shin_${side}`,`Foot_${side}`,target,pole);setGlobalQuaternion(B('Foot_'+side),info.acro==='flip'?new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),roll):new T.Quaternion().setFromAxisAngle(up,footYaw));
 }
 const natural=naturalArms(mode,t),offset=new T.Vector3(rootX,rootY,rootZ);
 if(dodge){natural.L.pole.x+=.10*dodgeEnvelope;natural.R.pole.x-=.10*dodgeEnvelope;}
 // A sharp turn leads with the chest and a braking stop throws the arms
 // forward; either way the carried bow swings out from the hip.
 if(turn||stop){const shoulder=B('UpperArm_R').getWorldPosition(new T.Vector3()),reach=.97*(rest.get('Forearm_R').p.length()+rest.get('Hand_R').p.length()),before=natural.R.palm.distanceTo(shoulder),brake=stop?.04*smooth(0,.10,t)*(1-smooth(.30,.62,t)):0;natural.R.palm.add(new T.Vector3(-brake,0,0).applyQuaternion(B('Chest').getWorldQuaternion(new T.Quaternion())));natural.R.palm.add(new T.Vector3(-.08*bump(0,.85,tu),0,.03*bump(0,.85,tu)).applyQuaternion(B('Chest').getWorldQuaternion(new T.Quaternion())));const out=natural.R.palm.clone().sub(shoulder),limit=Math.max(reach,before);if(out.length()>limit)natural.R.palm.copy(shoulder).addScaledVector(out.normalize(),limit);}
 let bowPosition=natural.R.palm.clone().sub(offset),bowFrame=natural.R.q.clone().multiply(handAttackR.clone().invert()),qR=natural.R.q.clone(),leftPalm=natural.L.palm.clone().sub(offset),qL=natural.L.q.clone(),poleR=natural.R.pole.clone(),poleL=natural.L.pole.clone(),gripInfluence=0;
 let stringDraw=0;
 // Forward is +Z. The canonical arrow travels -X, so the coupled bow/string/
 // arrow frame turns 90 degrees; the cant tips the upper limb out from the cheek.
 const crouch=info.crouch||0,full=fullGrips[gripKey(mode)]||new T.Vector3(...AIM.grip),aimFrame=aimFrameFor(BOW_ANGLES[bowVariant(mode)]),releaseNock=full.clone().add(new T.Vector3(BOW.fullDraw,BOW.nockY,0).applyQuaternion(aimFrame));
 const chestPoint=v=>B('Chest').localToWorld(v.clone());
 if(archer){
  // Between shots the bow rests low and forward, arrow line tipped down, at
  // the shared ready cant. Raised, it rolls to its own cant for the shot.
  // After the loose a sprung drop throws it low with a bounce, then it comes
  // back up to ready for the next arrow.
  // The bow arm's cycle is one swing about the shoulder: lowered at ready,
  // raised and pushed straight to full draw, thrown down by the sprung drop
  // after the loose, and recovered to ready. Off the string the bow takes its
  // orientation from the relaxed paw (as when carried), so the wrist stays
  // in line; raised, it turns onto the aim line at its cant; after the loose
  // it falls back into the paw as the drop lands, tipping forward a little.
  // Every bow angle shares the ready pose (from the canted grip), so a change
  // of angle at the loop boundary is seamless.
  const shoulder=B('UpperArm_R').getWorldPosition(new T.Vector3()).sub(offset),reference=crouch?full:fullGrips.canted||full,toReady=reference.clone().sub(shoulder),readyHinge=up.clone().cross(toReady).normalize();
  // Ready holds the bow low and to the left, its upper tip well under the chin.
  const readyGrip=shoulder.clone().addScaledVector(toReady.clone().applyAxisAngle(readyHinge,.50),Math.min(.93,.245/toReady.length())).add(new T.Vector3(.10,-.04,0));
  {const out=readyGrip.clone().sub(shoulder),reachR=rest.get('Forearm_R').p.length()+rest.get('Hand_R').p.length();if(out.length()>.93*reachR)readyGrip.copy(shoulder).addScaledVector(out.normalize(),.93*reachR);}
  const pushed=smooth(NOCK,1.12,aT),released=aT>=RELEASE,sprung=released?spring(aT-RELEASE):0;
  const cant=released?BOW_ANGLES[bowVariant(mode)]:lerp(READY_CANT,BOW_ANGLES[bowVariant(mode)],smooth(.90,1.12,aT));
  let grip;
  if(!released)grip=readyGrip.clone().lerp(full.clone().add(new T.Vector3(...AIM.setup)),a.raise).lerp(full,pushed);
  else{const toFull=full.clone().sub(shoulder),hinge=up.clone().cross(toFull).normalize(),outward=new T.Vector3(full.x,0,full.z-.035).normalize(),armReach=rest.get('Forearm_R').p.length()+rest.get('Hand_R').p.length();grip=shoulder.clone().addScaledVector(toFull.applyAxisAngle(hinge,.42*sprung),1-.04*Math.min(1,sprung)).addScaledVector(outward,.04*Math.min(1,sprung));const reachOut=grip.clone().sub(shoulder),limit=Math.max(.95*armReach,toFull.length()*(1-.04*Math.min(1,sprung)));if(reachOut.length()>limit)grip.copy(shoulder).addScaledVector(reachOut.normalize(),limit);grip.lerp(readyGrip,a.recover);}
  grip.y-=.012*a.follow;
  // Rising to the shot and coming back to ready, the bow travels on an arc
  // forward, so its upper limb passes clear of the muzzle; coming back, the
  // grip stays inside the bow arm's reach.
  const arc=Math.sin(Math.PI*Math.min(1,1.4*a.raise))*(released?0:1)+Math.sin(Math.PI*Math.max(0,1.4*a.recover-.4));grip.z+=(released?.07:.10+Math.max(0,(fullGrips.canted?.z??full.z)-full.z))*arc;grip.x+=.03*arc;
  {const reachR=rest.get('Forearm_R').p.length()+rest.get('Hand_R').p.length(),toFull=full.distanceTo(shoulder),limit=Math.max(.94*reachR,toFull*(1-.04*Math.min(1,sprung))),out=grip.clone().sub(shoulder);if(released&&out.length()>limit)grip.copy(shoulder).addScaledVector(out.normalize(),limit);}
  poleR=natural.R.pole.clone().lerp(new T.Vector3(-.45,.45,.30).add(offset),ramps.bow*(.45+.55*a.raise*(1-a.recover)));
  // Entering or leaving, the bow travels between the carry and ready, lifted
  // clear in front of the tunic on the way.
  if(ramps.bow<1){const arc=Math.sin(Math.PI*ramps.bow);bowPosition.lerp(grip,ramps.bow);bowPosition.z+=.12*arc;bowPosition.add(new T.Vector3(-.12*arc,0,0).applyQuaternion(B('Chest').getWorldQuaternion(new T.Quaternion())));}else bowPosition=grip;
  qR=arm('R',bowPosition.clone().add(offset),qR,poleR);
  // The bow turns onto its shot frame early in the raise and keeps it until
  // late in the recovery, so its upper limb stays up and clear of the muzzle.
  const engaged=(released?(1-Math.min(1,sprung))*(1-smooth(.55,1,a.recover)):smooth(0,.45,a.raise))*ramps.bow;
  bowFrame=qR.clone().multiply(handAttackR.clone().invert()).slerp(aimFrameFor(cant),engaged);
  if(released)bowFrame.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.18*Math.min(sprung,1.2)*(1-a.recover)));
  stringDraw=a.draw;
  // The draw paw: from ready it reaches out past the left shoulder and back
  // to the quiver, grips a nock, draws the arrow up the quiver's axis until
  // the head clears the mouth, swings it forward over the shoulder and lays
  // it on the string; then the draw, the loose and the follow-through along
  // the jaw, and back to ready.
  const readyL=chestPoint(new T.Vector3(.46,-.20,.16)).sub(offset),outside=chestPoint(new T.Vector3(.74,-.04,-.06)).sub(offset),grab=chestPoint(quiverLocal(QUIVER.stickOut)).sub(offset),drawn=chestPoint(quiverLocal(ARROW.length+.005)).sub(offset),over=chestPoint(new T.Vector3(.66,.10,.28)).sub(offset),front=chestPoint(new T.Vector3(.40,.12,.52)).sub(offset);
  const nock=bowPosition.clone().add(new T.Vector3(nockOffset(stringDraw),BOW.nockY,0).applyQuaternion(bowFrame));
  let palm;
  if(aT<.28)palm=bezier(readyL,outside,grab,a.reach);
  else if(aT<.46)palm=grab.clone().lerp(drawn,a.pull);
  // The carry ends just behind the string on the archer's side, and the paw
  // slides forward onto the nock already rolled to pinch it.
  else if(aT<NOCK){const behind=nock.clone().add(new T.Vector3(.06,0,0).applyQuaternion(bowFrame));palm=aT<.74?cubic(drawn,over,front,behind,a.carry):behind.lerp(nock,a.nockIn);}
  else{palm=nock.clone();if(aT>=RELEASE)palm.copy(releaseNock).add(new T.Vector3(.12,.01,-.06).multiplyScalar(smooth(RELEASE,RELEASE+.16,aT)));}
  // Recovery carries the paw out sideways at shoulder height, elbow still up
  // as at the draw, then down to ready at the flank.
  if(a.recover>0)palm=bezier(palm,chestPoint(new T.Vector3(.46,.07,.30)).sub(offset),readyL,a.recover);
  leftPalm.lerp(palm,ramps.hand);
  // Elbow guides for the draw arm, always taken square to the current
  // shoulder-to-paw line, so a guide never falls along the arm and swaps the
  // elbow or flips the sleeve. On the string the elbow comes back and up
  // behind the arrow line.
  const shoulderL=B('UpperArm_L').getWorldPosition(new T.Vector3()),line=leftPalm.clone().add(offset).sub(shoulderL),chestQ=B('Chest').getWorldQuaternion(new T.Quaternion()),across=d=>d.addScaledVector(line,-d.dot(line)/Math.max(line.lengthSq(),1e-9));
  // Off the string the elbow keeps one guide, out, down and a little back from the
  // wound-up chest. The paw's path from ready, out past the shoulder to the
  // quiver, up out of it and forward to the bow never comes within about 35
  // degrees of that direction, so the guide never falls along the arm and the
  // elbow cannot swap sides or flip the sleeve. Below the shoulder it would
  // press the sleeve into the chest; above it, into the oversized head.
  // While the paw is behind the shoulder (late in the reach, the grab and the
  // draw out of the quiver) that guide turns to point forward and out, which
  // keeps the hanging sleeve off the back; it turns back for the carry. The
  // turning guide stays at least about 45 degrees off each arm line it meets.
  const chestX=new T.Vector3(1,0,0).applyQuaternion(chestQ),forward=new T.Vector3(0,0,1).applyQuaternion(chestQ),side=across(new T.Vector3(0,-.5,0).addScaledVector(chestX,.7).addScaledVector(forward,-.35)).normalize();
  const behind=across(new T.Vector3(0,-.3,0).addScaledVector(chestX,.6).addScaledVector(forward,.5)).normalize();
  // Guides are blended as directions square to the arm line, turned on the
  // shortest arc, so a blend can never collapse onto the line and flip.
  const toward=p=>across(p.clone().add(offset).sub(shoulderL)).normalize(),turnTo=(from,to,w)=>w<=0?from:from.clone().applyQuaternion(new T.Quaternion().slerp(new T.Quaternion().setFromUnitVectors(from,to),w));
  const raised=across(turnTo(side,behind,smooth(0,.16,aT)*(1-smooth(.40,.66,aT)))).normalize();
  let elbow=turnTo(raised,toward(new T.Vector3(.34,.70,.38)),smooth(.74,.82,aT));elbow=turnTo(elbow,toward(new T.Vector3(1.3,.76,-.08)),a.aim);
  // After the loose the elbow stays up as at the draw while the paw moves out,
  // and only turns to the side as the paw comes down to ready.
  elbow=across(turnTo(elbow,side,smooth(1.60,1.95,aT))).normalize();
  poleL.lerp(shoulderL.clone().addScaledVector(line,.5).addScaledVector(elbow,.30),ramps.hand);
  gripInfluence=smooth(.64,.74,aT)*(1-smooth(RELEASE+.15,RELEASE+.30,aT));
 }
 if(dodge){bowPosition.x-=.045*dodgeEnvelope;bowPosition.y+=.06*dodgeEnvelope;bowPosition.z+=.04*dodgeEnvelope;leftPalm.x+=.035*dodgeEnvelope;leftPalm.y+=.07*dodgeEnvelope;leftPalm.z+=.08*dodgeEnvelope;}
 bowPosition.add(offset);leftPalm.add(offset);
 qR=arm('R',bowPosition,qR,poleR,bowFrame);
 // The draw forearm rolls with the paw on the string; entering and leaving
 // the stance that roll ramps in and out, so the enter starts on Idle.
 qL=arm('L',leftPalm,qL,poleL,archer?bowFrame:null,gripInfluence,archer?ramps.hand:1);
 // Tail. The root bone holds the authored junction with the belt; the tail is
 // carried straight out behind on the next bones (TAIL_REST), and the gait
 // sway, inertial impulses and turn lag all act past the junction.
 // Entering and leaving the stance, the tail blends between Idle's settings
 // and the shot loop's, so both ends meet their neighbours exactly.
 const stanceBlend=enter||exit?ramps.wind:null,speed=stanceBlend!==null?stanceBlend:mode==='run'||shooting?1:mode==='walk'?.5:0,tailDrive=(dodge?dodgeSign*dodgeEnvelope:0)+(shooting?.25*a.aim:0),turnLag=turn?-turn*(snap?.45:.9)*(turnHips-smooth(.30,1,tu)):0,fall=mode==='death'?smooth(.15,1.2,t):0;
 for(let i=1;i<6;i++){const b=B(`Tail_${String(i).padStart(2,'0')}`),k=i/5,[pitch,yaw]=TAIL_REST[i];
  b.rotation.set(pitch*(1-fall)+(.025+.020*speed)*Math.sin(phase-i*.5)+.30*stopBrace*(.3+.7*k)+(mode==='run'&&i===1?.06:0),yaw*(1-fall)+(.012+.025*speed)*Math.sin(phase*(shooting?3:1)-i*.55)+tailDrive*.06*k+turnLag*(.25+.15*k)-(i===1?.5*hipTwist:0)-(i===1?.35*fall:0),(.025+.025*speed)*Math.sin(phase-i*.6)+(i===1?.50*fall:0));
  if(i===1)b.rotation.z+=.12*(1-fall);
  if(mode==='idle'||settlesToIdle(mode)||enter)b.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(up,tailSwishAngle(mode==='idle'?t:0,i)*(stanceBlend!==null?1-stanceBlend:1)));}
 const rotations=cloth.rotations();for(let c=0;c<3;c++)for(let r=0;r<2;r++)B(`Cape${c}_${r}`).quaternion.copy(r?rotations[c][r-1].clone().invert().multiply(rotations[c][r]):rotations[c][r]);
 // Turns, stops and the attack exit start and end on Idle's first frame, so
 // the cape keeps that drape and only swings out behind the turning or braking
 // chest; the exit hands the shot loop's drape back to it. Entering the stance
 // goes the other way.
 const capeFrom=exit?attackCape:enter?idleCape:null,capeTo=exit?idleCape:enter?attackCape:null;
 if(settlesToIdle(mode)&&idleCape){const swing=new T.Quaternion().setFromAxisAngle(up,-turn*.55*(turnChest-smooth(.25,1,tu))).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.30*stopBrace));for(let c=0;c<3;c++)for(let r=0;r<2;r++){const name=`Cape${c}_${r}`;B(name).quaternion.copy(exit&&attackCape?attackCape.get(name).clone().slerp(idleCape.get(name),smooth(0,D,t)):idleCape.get(name));if(!r)B(name).quaternion.premultiply(swing);}}
 else if(enter&&capeFrom&&capeTo)for(let c=0;c<3;c++)for(let r=0;r<2;r++){const name=`Cape${c}_${r}`;B(name).quaternion.copy(capeFrom.get(name).clone().slerp(capeTo.get(name),smooth(0,D,t)));}
 root.updateMatrixWorld(true);
 const bowQ=bowFrame,localBowQ=B('Hand_R').getWorldQuaternion(new T.Quaternion()).invert().multiply(bowQ);objects[gear.bowRoot].quaternion.copy(localBowQ);root.updateMatrixWorld(true);
 if(mode==='death'){rootY=groundFall();bowPosition.copy(B('Hand_R').localToWorld(gripR.clone()));}
 // The loose arrow: in the draw paw from the grab to the nock (aligned with
 // the quiver while it is drawn out, then swung behind, out to the side and
 // forward onto the bow), on the string until the loose, then in flight.
 let arrowNock=bowPosition.clone().add(new T.Vector3(nockOffset(stringDraw),BOW.nockY,0).applyQuaternion(bowQ)),arrowQ=bowQ.clone(),arrowScale=0;
 const inFlight=shooting&&aT>=RELEASE;
 if(shooting&&a.inHand){
  const chestQ=B('Chest').getWorldQuaternion(new T.Quaternion()),axis=quiverAxis.clone().applyQuaternion(chestQ),toward=(x,y,z)=>new T.Vector3(x,y,z).normalize().applyQuaternion(chestQ);
  const inQuiver=frameQuaternion(new T.Vector3(-1,0,0),axis.clone().negate(),toward(0,0,1)),behind=frameQuaternion(new T.Vector3(-1,0,0),toward(.55,.45,-.7),toward(1,0,0)),outward=frameQuaternion(new T.Vector3(-1,0,0),toward(1,-.15,-.45),up);
  const s=a.carry;arrowQ=s<=0?inQuiver:s<.22?inQuiver.clone().slerp(behind,smooth(0,.22,s)):s<.70?behind.clone().slerp(outward,smooth(.22,.70,s)):outward.clone().slerp(bowQ,smooth(.70,1,s));
  arrowNock=B('Hand_L').localToWorld(gripL.clone());arrowScale=1;
 }else if(shooting&&a.nocked)arrowScale=1;
 // Once loosed, the arrow and its glint keep the aim line, not the falling bow.
 if(inFlight){arrowNock.copy(releaseNock).add(offset).add(new T.Vector3(0,(aT-RELEASE)*.03,(aT-RELEASE)*3.7));arrowQ=aimFrame;arrowScale=aT<RELEASE+.40?1:0;}
 objects[gear.arrow].quaternion.copy(arrowQ);objects[gear.arrow].position.copy(arrowNock);objects[gear.arrow].scale.setScalar(arrowScale);
 // Double shot: a second arrow rides 3 cm up the string from the first,
 // fanned slightly in the bow's plane, and flies its own diverging line.
 const fan=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-.045),second=objects[gear.arrowSecond];
 if(info.double&&arrowScale>0){if(inFlight){const q2=aimFrame.clone().multiply(fan),age2=aT-RELEASE;second.quaternion.copy(q2);second.position.copy(releaseNock).add(offset).add(new T.Vector3(0,.032,0).applyQuaternion(aimFrame)).addScaledVector(new T.Vector3(-1,0,0).applyQuaternion(q2),3.7*age2).add(new T.Vector3(0,.03*age2,0));}else{second.quaternion.copy(arrowQ).multiply(fan);second.position.copy(arrowNock).add(new T.Vector3(0,.032,0).applyQuaternion(arrowQ));}second.scale.setScalar(1);}
 else{second.position.copy(arrowNock);second.quaternion.copy(arrowQ);second.scale.setScalar(0);}
 const third=objects[gear.arrowThird];third.position.copy(arrowNock);third.quaternion.copy(arrowQ);third.scale.setScalar(info.triple?arrowScale:0);
 if(info.triple&&arrowScale){const fan3=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.045);third.quaternion.copy(inFlight?aimFrame:arrowQ).multiply(fan3);if(inFlight){const age3=aT-RELEASE;third.position.copy(releaseNock).add(offset).add(new T.Vector3(0,-.032,0).applyQuaternion(aimFrame)).addScaledVector(new T.Vector3(-1,0,0).applyQuaternion(third.quaternion),3.7*age3).add(new T.Vector3(0,.03*age3,0));}else third.position.add(new T.Vector3(0,-.032,0).applyQuaternion(arrowQ));}
 const age=shooting?aT-RELEASE:-1,flair=age>=0&&age<.14?Math.sin(Math.PI*age/.14):0,shotQ=inFlight?aimFrame:bowQ;
 objects[gear.flare].quaternion.copy(shotQ);objects[gear.flare].position.copy(bowPosition).add(new T.Vector3(-.035,.025,0).applyQuaternion(shotQ));objects[gear.flare].scale.setScalar(flair*(1+age*5));
 for(let i=0;i<gear.sparks.length;i++){const spark=objects[gear.sparks[i]],angle=i*Math.PI*2/5;spark.position.copy(bowPosition).add(new T.Vector3(-age*.4,.025+Math.sin(angle)*Math.max(0,age)*.45,Math.cos(angle)*Math.max(0,age)*.45).applyQuaternion(shotQ));spark.scale.setScalar(flair);}
 // Sideways shooting rolls the connected shoulder girdle, both arms, bow,
 // string and arrows as one unit about the aim axis. The head counter-rolls.
 // This retains the proven grip anatomy instead of breaking either wrist.
 if(info.bow==='sideways'){
  const amount=-.82*smooth(.62,1.08,aT)*(1-smooth(1.45,1.98,aT)),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),amount),chest=B('Chest'),pivot=chest.getWorldPosition(new T.Vector3()),headQ=B('Head').getWorldQuaternion(new T.Quaternion());
  setGlobalQuaternion(chest,q.clone().multiply(chest.getWorldQuaternion(new T.Quaternion())));setGlobalQuaternion(B('Head'),headQ);
  for(const id of [gear.arrow,gear.arrowSecond,gear.arrowThird,gear.flare,...gear.sparks]){objects[id].position.sub(pivot).applyQuaternion(q).add(pivot);objects[id].quaternion.premultiply(q);}
  root.updateMatrixWorld(true);
 }
 return {stringDraw,blink:blinkAt(t,mode),anger:angerAt(mode,t),bowPosition,arrowNock,root:[rootX,rootY,rootZ],flair,stage:shooting?a.stage:mode};
}

// Slide each bow angle's full-draw grip along the aim line until the bow arm
// is all but locked: these short segments only read as straight close to
// full reach.
for(const [variant,mode]of [['canted','attack'],['upright','attackUpright'],['tilted','attackTilted']]){/* fit across the hold */
 const saved=structuredClone(metrics),reach=rest.get('Forearm_R').p.length()+rest.get('Hand_R').p.length();fullGrips[variant]=new T.Vector3(...AIM.grip);
 // The upright bow's anchor sits a little further in; its grip moves 2 cm out
 // so the draw forearm clears the hood collar.
 if(variant==='upright')fullGrips[variant].x+=.02;
 // Fit across the whole anchor hold; the bow paw's twist settles per frame.
 const extension=t=>{composePose(mode,t,new PinnedCloth(clothColumns));return B('Hand_R').getWorldPosition(new T.Vector3()).distanceTo(B('UpperArm_R').getWorldPosition(new T.Vector3()))/reach;};
 let near=.10,far=.70;for(let i=0;i<18;i++){fullGrips[variant].z=(near+far)/2;if(Math.max(...[1.12,1.15,1.18,1.22,1.245].map(extension))>.988)far=fullGrips[variant].z;else near=fullGrips[variant].z;}fullGrips[variant].z=near;
 for(const key of Object.keys(metrics))if(!(key in saved))delete metrics[key];Object.assign(metrics,saved);metrics.aimGrip={...metrics.aimGrip,[variant]:fullGrips[variant].toArray()};
}
// The crouched shot is the canted one moved straight down with the hips (grips
// are relative to the root, so lowering the root carries them down).
fullGrips.crouched=fullGrips.canted.clone();metrics.aimGrip.crouched=fullGrips.crouched.toArray();
g.animations=[];let clothPushes=0;
// FOX_ONLY bakes a comma-separated subset (Idle and Bow_Attack are always
// baked, for the cape drapes) into FOX_OUT, for quick tuning runs.
const only=process.env.FOX_ONLY?.split(',');
for(const [mode,info]of Object.entries(CLIPS)){
 if(only&&!['idle','attack',...only].includes(mode))continue;
 // Shot clips are sampled at 120 Hz: the draw paw's fast carry from the quiver
 // then interpolates tightly enough that the arrow stays in the paw between keys.
 const rate=isShooting(mode)?120:60,frameCount=Math.ceil(info.duration*rate)+1,times=Float32Array.from({length:frameCount},(_,i)=>Math.min(i/rate,info.duration)),cloth=new PinnedCloth(clothColumns,colliders),frames=[];
 // Pre-roll six complete periods with the same periodic force as the bake.
 const steps=(frameCount-1)*2,dt=info.duration/steps;
 function stepCloth(i){const phase=(i%steps)/steps*Math.PI*2,time=(i%steps)/steps*info.duration;cloth.step(dt,phase,mode==='run'?.7*Math.sin(phase*2):isShooting(mode)&&time>RELEASE&&time<RELEASE+.12?-1.2:0,mode.startsWith('dodge')?Math.sin(phase):0);}
 for(let i=0;i<steps*6;i++)stepCloth(i);
 const tracks=new Map(),add=(node,path,value)=>{const key=node+':'+path;if(!tracks.has(key))tracks.set(key,{node,path,width:value.length,values:[]});tracks.get(key).values.push(...value);};
 for(let frame=0;frame<frameCount;frame++){
  const t=times[frame];if(frame)for(let sub=0;sub<2;sub++)stepCloth((frame-1)*2+sub);metrics.maxClothLengthError=Math.max(metrics.maxClothLengthError,cloth.error());
  const state=composePose(mode,t,cloth);
  if(!frame&&mode==='idle')idleCape=new Map(Array.from({length:6},(_,i)=>`Cape${i>>1}_${i&1}`).map(name=>[name,B(name).quaternion.clone()]));
  if(!frame&&mode==='attack')attackCape=new Map(Array.from({length:6},(_,i)=>`Cape${i>>1}_${i&1}`).map(name=>[name,B(name).quaternion.clone()]));
  frames.push({time:t,stage:state.stage,draw:state.stringDraw,blink:state.blink});
  for(const [name,id]of boneNodes){add(id,'rotation',objects[id].quaternion.toArray());if(name==='Root'||name.startsWith('Clavicle'))add(id,'translation',objects[id].position.toArray());}
  const age=isShooting(mode)?t-RELEASE:-1,recoil=age>=0?.025*Math.sin(age*80)*Math.exp(-age*20):0;
  // Face: idle's ear twitches and sniffs, anger while shooting, and blinks
  // as morph weights, which cross-fade safely.
  add(face.face,'weights',[...(mode==='idle'?foxExpressions(t,mode):[0,0,0]),state.anger,.9*state.anger]);add(face.lids,'weights',[state.blink,state.anger*(1-state.blink)]);
  add(gear.bowRoot,'rotation',objects[gear.bowRoot].quaternion.toArray());add(gear.string,'weights',[state.stringDraw+recoil]);add(gear.bow,'weights',[state.stringDraw+recoil]);add(gear.arrow,'rotation',objects[gear.arrow].quaternion.toArray());add(gear.flare,'rotation',objects[gear.flare].quaternion.toArray());
  add(gear.arrowSecond,'rotation',objects[gear.arrowSecond].quaternion.toArray());
  add(gear.arrowThird,'rotation',objects[gear.arrowThird].quaternion.toArray());
  for(const id of [gear.arrow,gear.arrowSecond,gear.arrowThird,gear.flare,...gear.sparks]){add(id,'translation',objects[id].position.toArray());add(id,'scale',objects[id].scale.toArray());}
 }
 clothPushes+=cloth.pushes;
 // Match the seam of repeated actions; one-shot clips retain their final pose.
 if(info.loop)for(const track of tracks.values()){const width=track.width;const error=Math.max(...Array.from({length:width},(_,k)=>Math.abs(track.values[k]-track.values[track.values.length-width+k])));const isEffect=[gear.arrow,gear.arrowSecond,gear.arrowThird,gear.flare,...gear.sparks].includes(track.node);if(!isEffect&&error>1e-4)throw Error(`Visible loop seam ${mode} ${g.nodes[track.node].name} ${track.path}: ${error}`);for(let k=0;k<width;k++)track.values[track.values.length-width+k]=track.values[k];}
 const input=append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[info.duration];const clip={name:info.name,samplers:[],channels:[],extras:{loop:info.loop,mode,velocity:info.velocity}};
 for(const track of tracks.values()){const width=track.path==='rotation'?'VEC4':track.path==='weights'?'SCALAR':'VEC3',output=append(new Float32Array(track.values),width),sampler=clip.samplers.push({input,output,interpolation:'LINEAR'})-1;clip.channels.push({sampler,target:{node:track.node,path:track.path}});}
 g.animations.push(clip);metrics.clips[mode]={duration:info.duration,frames:frameCount};
}
metrics.clothColliderPushes=clothPushes;
// Open the portable asset in the finished relaxed pose, even in viewers that
// do not start an animation. Inverse binds still retain the authored bind pose.
for(const channel of g.animations[0].channels){const sampler=g.animations[0].samplers[channel.sampler],width=channel.target.path==='rotation'?4:channel.target.path==='weights'?(g.meshes[g.nodes[channel.target.node].mesh].weights?.length||1):3;g.nodes[channel.target.node][channel.target.path]=Array.from(read(sampler.output).subarray(0,width));}
g.extras.foxAnimated={version:3,scope:'Base fox 3D preview only',source:'fox-repaired.glb',proportions:{shoulderHalfWidth:.20,armLengthScale:.75,legLengthScale:.70,heightOffset:HEIGHT},handedness:{bow:'right',draw:'left'},equipment:gear,face,hands,clips:CLIPS,metrics};
g.asset.generator='AutoB model-specific chibi rig and animation bake (archer v3)';
if(!only){fs.mkdirSync(EVIDENCE,{recursive:true});fs.writeFileSync(`${EVIDENCE}/build.json`,JSON.stringify(metrics,null,2));}
glb.write(process.env.FOX_OUT||'public/meshy-fox-preview/fox-animated.glb');console.log(JSON.stringify({bones:skin.joints.length,maxIKError:metrics.maxIKError,worstIK:Object.entries(metrics.ikByClip).filter(([,v])=>v.error>1e-6).map(([k,v])=>`${k} ${v.limb} ${v.time.toFixed(3)} ${v.error.toFixed(4)}`),maxGripError:metrics.maxGripError,maxWristAngle:metrics.maxWristAngle,cloth:metrics.maxClothLengthError,clothColliderPushes:clothPushes,hemVertices,aimGrip:metrics.aimGrip}));
