import fs from 'node:fs';
import * as T from 'three';
import {readGLB} from './lib/glb.mjs';
import {addEquipment} from './lib/fox-equipment.mjs';
import {addSimplePaws} from './lib/fox-simple-paws.mjs';
import {addChibiBlink} from './lib/fox-blink-head.mjs';
import {foxExpressions} from '../public/meshy-fox-preview/fox-expressions.mjs';
import {PinnedCloth} from './lib/fox-dynamics.mjs';
import {KayKitMotion} from './lib/kaykit-motion.mjs';
import {CLIPS,smooth,lerp,blinkAt,attackAt,footCycle,isShooting,tailSwishAngle} from '../public/meshy-fox-preview/fox-motion.mjs';

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
const gripR=new T.Vector3(-.095,-.025,-.025),gripL=new T.Vector3(.130,0,0),handAttackR=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
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
function solveIK(aName,bName,endName,target,pole,preferredUp,iteration=false,extension=0){
 const a=B(aName),b=B(bName),end=B(endName),start=a.getWorldPosition(new T.Vector3()),lenA=rest.get(bName).p.length(),lenB=rest.get(endName).p.length()+extension,delta=target.clone().sub(start),distance=delta.length(),clamped=Math.min(lenA+lenB-.00005,Math.max(Math.abs(lenA-lenB)+.00005,distance)),dir=delta.normalize();
 const along=(lenA*lenA-lenB*lenB+clamped*clamped)/(2*clamped),height=Math.sqrt(Math.max(0,lenA*lenA-along*along)),perp=pole.clone().sub(start).addScaledVector(dir,-pole.clone().sub(start).dot(dir)).normalize(),elbow=start.clone().addScaledVector(dir,along).addScaledVector(perp,height);
 const restDir=rest.get(bName).p.clone().normalize(),aDir=elbow.clone().sub(start).normalize();setGlobalQuaternion(a,preferredUp?frameQuaternion(restDir,aDir,preferredUp):new T.Quaternion().setFromUnitVectors(restDir,aDir));
 const bPos=b.getWorldPosition(new T.Vector3()),bDir=target.clone().sub(bPos).normalize();setGlobalQuaternion(b,preferredUp?frameQuaternion(rest.get(endName).p.clone().normalize(),bDir,preferredUp):new T.Quaternion().setFromUnitVectors(rest.get(endName).p.clone().normalize(),bDir));
 const error=end.getWorldPosition(new T.Vector3()).addScaledVector(bDir,extension).distanceTo(target);if(iteration)metrics.maxSolverIterationError=Math.max(metrics.maxSolverIterationError,error);else{metrics.maxIKError=Math.max(metrics.maxIKError,error);if(error>(metrics.ikByClip[activePose.mode]?.error||0))metrics.ikByClip[activePose.mode]={error,limb:aName,time:activePose.t,distance,reach:lenA+lenB};}return error;
}
function arm(side,palm,q,pole,bowFrame=null,gripInfluence=1){
 if(side==='L'){
  solveIK('UpperArm_L','Forearm_L','Hand_L',palm,pole,new T.Vector3(1,0,0),false,.130);
  const dir=B('Hand_L').getWorldPosition(new T.Vector3()).sub(B('Forearm_L').getWorldPosition(new T.Vector3())).normalize();
  q=frameQuaternion(new T.Vector3(1,0,0),dir,new T.Vector3(1,0,0));
  if(bowFrame){const stringAxis=new T.Vector3(0,1,0).applyQuaternion(bowFrame),z=stringAxis.addScaledVector(dir,-stringAxis.dot(dir)).normalize(),up=z.clone().cross(dir).normalize();q.slerp(frameQuaternion(new T.Vector3(1,0,0),dir,up),gripInfluence);setGlobalQuaternion(B('Forearm_L'),frameQuaternion(rest.get('Hand_L').p.clone().normalize(),dir,new T.Vector3(0,1,0).applyQuaternion(q)));}
  setGlobalQuaternion(B('Hand_L'),q);
  metrics.maxGripError=Math.max(metrics.maxGripError,B('Hand_L').localToWorld(gripL.clone()).distanceTo(palm));return q;
 }

 const grip=side==='R'?gripR:gripL,forward=new T.Vector3(side==='R'?-1:1,0,0);let yaw=side==='R'?0:Math.PI;
 for(let i=0;i<16;i++){
  const wrist=palm.clone().sub(grip.clone().applyQuaternion(q)),up=new T.Vector3(0,1,0).applyQuaternion(q);solveIK(`UpperArm_${side}`,`Forearm_${side}`,`Hand_${side}`,wrist,pole,up,true);
  const dir=B('Hand_'+side).getWorldPosition(new T.Vector3()).sub(B('Forearm_'+side).getWorldPosition(new T.Vector3())).normalize();
  let next;
  if(bowFrame){const local=dir.clone().applyQuaternion(bowFrame.clone().invert());const desired=side==='R'?Math.atan2(local.z,-local.x):Math.atan2(-local.z,local.x);yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*.65;next=frameQuaternion(forward,dir,new T.Vector3(side==='R'?-1:1,0,0)).slerp(bowFrame.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw)).multiply(handAttackR),gripInfluence);}
  else next=frameQuaternion(forward,dir,new T.Vector3(side==='R'?-1:1,0,0));
  q.slerp(next,.65).normalize();
 }
 const wrist=palm.clone().sub(grip.clone().applyQuaternion(q));solveIK(`UpperArm_${side}`,`Forearm_${side}`,`Hand_${side}`,wrist,pole,new T.Vector3(0,1,0).applyQuaternion(q));setGlobalQuaternion(B('Hand_'+side),q);
 const dir=B('Hand_'+side).getWorldPosition(new T.Vector3()).sub(B('Forearm_'+side).getWorldPosition(new T.Vector3())).normalize(),wristAngle=dir.angleTo(forward.clone().applyQuaternion(q));if(wristAngle>metrics.maxWristAngle){metrics.maxWristAngle=wristAngle;metrics.worstWrist={...activePose,side};}metrics.maxGripError=Math.max(metrics.maxGripError,B('Hand_'+side).localToWorld(grip.clone()).distanceTo(palm));return q;
}
function naturalArms(mode,t){
 const idle=kaykit.sample('Idle_A',t/CLIPS[mode].duration),move=mode==='run'?kaykit.sample('Running_A',t/CLIPS.run.duration):mode==='walk'?kaykit.sample('Walking_A',t/CLIPS.walk.duration):null,result={};
 for(const side of ['R','L']){
  const sign=side==='R'?-1:1,source=idle.arms[side],upper=source.upper.clone(),lower=source.lower.clone();
  // Fit the stocky fox: keep elbows close and palms facing the thighs. The
  // imported motion supplies the bend and swing, not its mannequin arm length.
  upper.x*=.65;upper.z*=.50;lower.x*=.85;lower.z*=.50;upper.normalize();lower.normalize();
  if(move){const angle=t/CLIPS[mode].duration*Math.PI*2+(side==='R'?0:Math.PI),swing=-(mode==='run'?.40:.23)*Math.cos(angle);upper.z=swing;lower.z=.12+swing*.72;upper.normalize();lower.normalize();}

  const chestQ=B('Chest').getWorldQuaternion(new T.Quaternion());upper.applyQuaternion(chestQ);lower.applyQuaternion(chestQ);
  const shoulder=B('UpperArm_'+side).getWorldPosition(new T.Vector3()),elbow=shoulder.clone().addScaledVector(upper,rest.get('Forearm_'+side).p.length()),wrist=elbow.clone().addScaledVector(lower,rest.get('Hand_'+side).p.length()),q=frameQuaternion(new T.Vector3(sign,0,0),lower,new T.Vector3(sign,0,0));
  const palm=wrist.clone().add((side==='R'?gripR:gripL).clone().applyQuaternion(q));
  result[side]={palm,q,pole:elbow.clone().addScaledVector(upper,.04)};
 }
 return result;
}
function composePose(mode,t,cloth){
 activePose={mode,t};
 for(const [name,{p,q}]of rest){B(name).position.copy(p);B(name).quaternion.copy(q);}let rootY=-.008,rootX=0,rootZ=0;
 const phase=t/CLIPS[mode].duration*Math.PI*2,a=attackAt(t),shooting=isShooting(mode),moving=mode==='walk'||mode==='run'||mode.startsWith('shoot'),dash=mode==='dash';
 if(moving)rootY=-.032+.003*Math.cos(phase*(shooting?6:2));
 if(mode==='run'||mode==='walk'){B('Pelvis').rotation.y=-.025*Math.sin(phase);B('Spine').rotation.y=.05*Math.sin(phase);B('Chest').rotation.x=mode==='run'?.045:.018;}
 if(mode==='idle')rootY+=.0018*Math.sin(phase);
 if(shooting){const protract=smooth(.12,.46,t)*(1-smooth(1.50,2.12,t));B('Clavicle_R').position.z+=.075*protract;B('Clavicle_L').position.z+=.075*protract;rootY-=.010*a.aim;B('Chest').rotation.x=.025*a.aim;B('Head').rotation.x=-.025*a.aim;}
 const dodge=mode.startsWith('dodge'),dodgeSign=mode==='dodgeLeft'?-1:1,dodgeProgress=smooth(.10,.45,t),dodgeEnvelope=smooth(0,.12,t)*(1-smooth(.4,.75,t));
 if(dodge){rootX=dodgeSign*.30*dodgeProgress;rootY-=.045*dodgeEnvelope;rootZ=-.03*dodgeEnvelope;B('Chest').rotation.z=-dodgeSign*.16*dodgeEnvelope;B('Head').rotation.z=dodgeSign*.06*dodgeEnvelope;}
 if(dash){const burst=smooth(.04,.32,t),tuck=smooth(0,.10,t)*(1-smooth(.32,.70,t));rootZ=.65*burst;rootY-=.045*tuck;B('Chest').rotation.x=.15*tuck;B('Head').rotation.x=-.07*tuck;}
 if(mode==='hit'){const recoil=smooth(0,.12,t)*(1-smooth(.18,.95,t));rootZ=-.065*recoil;rootY-=.025*recoil;B('Chest').rotation.x=-.20*recoil;B('Head').rotation.x=.12*recoil;}
 if(mode==='death'){const fall=smooth(.15,1.2,t);rootY=lerp(-.008,.25,fall);B('Root').rotation.x=-1.5*fall;rootZ=-.19*fall;}
 B('Root').position.set(rootX,rootY,rootZ);root.updateMatrixWorld(true);
 for(const side of ['R','L']){
  if(mode==='death'){const fall=smooth(.15,1.2,t);const bounce=t>1.1?Math.sin((t-1.1)*12)*Math.exp(-(t-1.1)*5)*.13:0;B('Thigh_'+side).rotation.x=(-1.0+bounce)*fall;B('Thigh_'+side).rotation.z=(side==='R'?-.10:.10)*fall;B('Shin_'+side).rotation.x=.85*fall;B('Foot_'+side).rotation.x=.12*fall;continue;}
  const target=world.get('Foot_'+side).clone(),cycle=moving?footCycle(shooting?'run':mode,shooting?t*.72/(2.2/3):t,side):{z:0,y:0,support:true};
  if(mode==='shootLeft'||mode==='shootRight')target.x+=cycle.z*(mode==='shootLeft'?-1:1);else target.z+=cycle.z*(mode==='shootBackward'?-1:1);target.y+=cycle.y;
  if(dash){const step=smooth(side==='R'?.04:.12,side==='R'?.36:.48,t);target.z+=rootZ+(side==='R'?1:-1)*.045*Math.sin(Math.PI*step);target.y+=.065*Math.sin(Math.PI*step);}
  if(dodge){const lead=(dodgeSign>0)===(side==='L'),start=lead?.10:.20,end=lead?.35:.52,step=smooth(start,end,t);target.x+=dodgeSign*.30*step;target.y+=.048*Math.sin(Math.PI*step);target.z+=rootZ*.35;}
  if(mode==='death'){target.y+=.14*smooth(.2,1.1,t);target.z-=.12*smooth(.2,1.1,t);}
  solveIK(`Thigh_${side}`,`Shin_${side}`,`Foot_${side}`,target,new T.Vector3(side==='R'?-.23:.23,.30,.8));setGlobalQuaternion(B('Foot_'+side),new T.Quaternion());
 }
 const natural=naturalArms(mode,t),offset=new T.Vector3(rootX,rootY,rootZ);
 if(dodge){natural.L.pole.x+=.10*dodgeEnvelope;natural.R.pole.x-=.10*dodgeEnvelope;}
 let bowPosition=natural.R.palm.clone().sub(offset),bowFrame=natural.R.q.clone().multiply(handAttackR.clone().invert()),qR=natural.R.q.clone(),leftPalm=natural.L.palm.clone().sub(offset),qL=natural.L.q.clone();
 let stringDraw=0;
 if(shooting){
  const engaged=smooth(.12,.46,t)*(1-smooth(1.50,2.12,t));
  // Forward is +Z. The canonical arrow travels -X, so rotate the entire
  // coupled bow/string/arrow frame 90 degrees rather than moving either hand
  // independently. A short draw fits this fox's chest and compact arms.
  const forwardBow=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-.35));
  // Cant around the arrow axis, keeping both limbs beside the large muzzle.
  bowPosition.lerp(new T.Vector3(-.06,.70,.47),engaged);
  // Lift the turned bow in front of the tunic before bringing it to aim.
  bowPosition.z+=.11*Math.sin(Math.PI*engaged);
  stringDraw=a.draw;
  const carryPole=natural.R.pole.clone().lerp(new T.Vector3(-.30,.65,.16).add(offset),engaged);
  qR=arm('R',bowPosition.clone().add(offset),qR,carryPole);
  bowFrame=qR.clone().multiply(handAttackR.clone().invert()).slerp(forwardBow,engaged);
  const nock=bowPosition.clone().add(new T.Vector3(lerp(.10,.14,stringDraw),.025,0).applyQuaternion(bowFrame));
  const influence=smooth(.25,.46,t)*(1-smooth(1.45,2.12,t));
  const reach=smooth(.08,.25,t)*(1-smooth(1.55,2.12,t));leftPalm.z=lerp(leftPalm.z,.30,reach);leftPalm.y=lerp(leftPalm.y,.65,reach);
  const drawPoint=nock.clone();
  if(t>=1.18)drawPoint.copy(new T.Vector3(-.06,.70,.47).add(new T.Vector3(.14,.025,0).applyQuaternion(forwardBow)).add(new T.Vector3(.10*smooth(1.18,1.35,t),0,.02*smooth(1.18,1.35,t))));
  leftPalm.lerp(drawPoint,influence);
 }

 if(dodge){bowPosition.x-=.045*dodgeEnvelope;bowPosition.y+=.06*dodgeEnvelope;bowPosition.z+=.04*dodgeEnvelope;leftPalm.x+=.035*dodgeEnvelope;leftPalm.y+=.07*dodgeEnvelope;leftPalm.z+=.08*dodgeEnvelope;}
 bowPosition.add(new T.Vector3(rootX,rootY,rootZ));leftPalm.add(new T.Vector3(rootX,rootY,rootZ));
 {
  const attackInfluence=shooting?smooth(.12,.46,t)*(1-smooth(1.50,2.12,t)):0;
  qR=arm('R',bowPosition,qR,natural.R.pole.clone().lerp(new T.Vector3(-.30,.65,.16).add(offset),attackInfluence),bowFrame);
  qL=arm('L',leftPalm,qL,natural.L.pole.clone().lerp(new T.Vector3(.95,.58,.25).lerp(new T.Vector3(.34,.70,.38),attackInfluence).add(offset),shooting?smooth(.04,.20,t)*(1-smooth(1.65,2.12,t)):0),shooting?bowFrame:null,shooting?smooth(.37,.46,t)*(1-smooth(1.40,1.55,t)):0);
 }
 // Tail response contains phase lag plus inertial impulses from each action.
 const speed=mode==='run'||mode.startsWith('shoot')?1:mode==='walk'?.5:0,tailDrive=(dodge?dodgeSign*dodgeEnvelope:0)+(shooting?.25*a.aim:0);
 for(let i=0;i<6;i++){const b=B(`Tail_${String(i).padStart(2,'0')}`);b.rotation.set((.025+.020*speed)*Math.sin(phase-i*.5),(.012+.025*speed)*Math.sin(phase*(shooting?3:1)-i*.55)+tailDrive*.06*(i/5)-(mode==='death'&&i===0?.65*smooth(.15,1.2,t):0),(.025+.025*speed)*Math.sin(phase-i*.6)+(mode==='death'&&i===0?.55*smooth(.15,1.2,t):0));if(mode!=='death'&&i===0)b.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.32+.22*speed));if(mode==='idle')b.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),tailSwishAngle(t,i)));}
 const rotations=cloth.rotations();for(let c=0;c<3;c++)for(let r=0;r<2;r++)B(`Cape${c}_${r}`).quaternion.copy(r?rotations[c][r-1].clone().invert().multiply(rotations[c][r]):rotations[c][r]);
 root.updateMatrixWorld(true);
 const bowQ=bowFrame,localBowQ=B('Hand_R').getWorldQuaternion(new T.Quaternion()).invert().multiply(bowQ);objects[gear.bowRoot].quaternion.copy(localBowQ);root.updateMatrixWorld(true);
 if(mode==='death'){rootY=groundFall();bowPosition.copy(B('Hand_R').localToWorld(gripR.clone()));}
 const arrowNock=bowPosition.clone().add(new T.Vector3(lerp(.10,.14,stringDraw),.025,0).applyQuaternion(bowQ));let arrowScale=shooting&&t>.46&&t<1.6?1:0;
 if(shooting&&t>=1.18)arrowNock.copy(new T.Vector3(-.06,.70,.47).add(new T.Vector3(.14,.025,0).applyQuaternion(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-.35)))).add(offset)).add(new T.Vector3(0,(t-1.18)*.03,(t-1.18)*3.7));
 objects[gear.arrow].quaternion.copy(bowQ);
 objects[gear.arrow].position.copy(arrowNock);objects[gear.arrow].scale.setScalar(arrowScale);
 const age=isShooting(mode)?t-1.18:-1,flair=age>=0&&age<.14?Math.sin(Math.PI*age/.14):0;
 objects[gear.flare].quaternion.copy(bowQ);objects[gear.flare].position.copy(bowPosition).add(new T.Vector3(-.035,.025,0).applyQuaternion(bowQ));objects[gear.flare].scale.setScalar(flair*(1+age*5));
 for(let i=0;i<gear.sparks.length;i++){const spark=objects[gear.sparks[i]],angle=i*Math.PI*2/5;spark.position.copy(bowPosition).add(new T.Vector3(-age*.4,.025+Math.sin(angle)*Math.max(0,age)*.45,Math.cos(angle)*Math.max(0,age)*.45).applyQuaternion(bowQ));spark.scale.setScalar(flair);}
 return {stringDraw,blink:blinkAt(t,mode),bowPosition,arrowNock,root:[rootX,rootY,rootZ],flair,stage:shooting?a.stage:mode};
}

g.animations=[];
for(const [mode,info]of Object.entries(CLIPS)){
 const frameCount=Math.ceil(info.duration*60)+1,times=Float32Array.from({length:frameCount},(_,i)=>Math.min(i/60,info.duration)),cloth=new PinnedCloth(clothColumns),frames=[];
 // Pre-roll six complete periods with the same periodic force as the bake.
 const steps=(frameCount-1)*2,dt=info.duration/steps;
 function stepCloth(i){const phase=(i%steps)/steps*Math.PI*2,time=(i%steps)/steps*info.duration;cloth.step(dt,phase,mode==='run'?.7*Math.sin(phase*2):isShooting(mode)&&time>1.18&&time<1.3?-1.2:0,mode.startsWith('dodge')?Math.sin(phase):0);}
 for(let i=0;i<steps*6;i++)stepCloth(i);
 const tracks=new Map(),add=(node,path,value)=>{const key=node+':'+path;if(!tracks.has(key))tracks.set(key,{node,path,width:value.length,values:[]});tracks.get(key).values.push(...value);};
 for(let frame=0;frame<frameCount;frame++){
  const t=times[frame];if(frame)for(let sub=0;sub<2;sub++)stepCloth((frame-1)*2+sub);metrics.maxClothLengthError=Math.max(metrics.maxClothLengthError,cloth.error());
  const state=composePose(mode,t,cloth);frames.push({time:t,stage:state.stage,draw:state.stringDraw,blink:state.blink});
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
fs.mkdirSync('docs/evidence/meshy-fox-natural-motion',{recursive:true});fs.writeFileSync('docs/evidence/meshy-fox-natural-motion/build.json',JSON.stringify(metrics,null,2));
glb.write('public/meshy-fox-preview/fox-animated.glb');console.log(JSON.stringify({bones:skin.joints.length,...metrics}));
