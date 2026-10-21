import * as T from 'three';
import {FoxActor} from './fox-actor.mjs';
import {ARROW,RELEASE,isAttackLoop,isShooting,isTurn,smooth} from './fox-motion.mjs';

// Scripted skirmish with a blank training dummy. The simulation advances in
// fixed 60 Hz steps and touches no DOM, so a recording, the page and a
// headless test all see the same fight.
export const STEP=1/60,DURATION=34,HITS_TO_FELL=7;
const ARROW_SPEED=9,up=new T.Vector3(0,1,0);
export function createCombat(asset,scene,camera=new T.PerspectiveCamera(38,16/9,.01,80)){
const actor=new FoxActor(asset),fox=actor.model;scene.add(fox);
// Standing volleys cycle the three bow angles while the stance holds.
actor.bowAngles=['attack','attackUpright','attackTilted'];
fox.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
const clipArrow=fox.getObjectByName('Arrow_Nock_and_Flight');

// A blank dummy: plain capsule body and head, chest at the archer's arrow line.
const dummy=new T.Group(),skin=new T.MeshStandardMaterial({color:'#c9c4b8',roughness:.8}),bodyMesh=new T.Mesh(new T.CapsuleGeometry(.17,.55,6,16),skin),headMesh=new T.Mesh(new T.SphereGeometry(.15,20,14),skin);
bodyMesh.position.y=.62;headMesh.position.y=1.12;const tilt=new T.Group();tilt.add(bodyMesh,headMesh);dummy.add(tilt);for(const m of [bodyMesh,headMesh]){m.castShadow=true;m.receiveShadow=true;}
const post=new T.Mesh(new T.CylinderGeometry(.03,.05,.3,10),new T.MeshStandardMaterial({color:'#6d5a45',roughness:.9}));post.position.y=.15;post.castShadow=true;dummy.add(post);scene.add(dummy);
const CHEST=.70,RADIUS=.17;

const state={time:0,shots:[],arrows:[],events:[],track:[],lead:new T.Vector3(),enemyVelocity:new T.Vector3(),flinch:0,defeated:-1,task:0,taskStart:0,label:'Watch'};
// Enemy path: approach, cross the archer's front, charge, then circle and close.
function enemyPlan(t){
 const p=new T.Vector3();
 if(t<3)p.set(3.2,0,4.2).lerp(new T.Vector3(1.6,0,3.2),t/3);
 // During the held standing volley it drifts across within the trunk's aim arc.
 else if(t<8.5)p.set(1.6,0,3.2).lerp(new T.Vector3(.1,0,3.1),smooth(3,8.5,t));
 else return null; // later phases react to the archer's position
 return p;
}
function enemyStep(dt){
 const t=state.time,planned=enemyPlan(t),before=dummy.position.clone();
 if(state.defeated>=0){}
 else if(planned)dummy.position.copy(planned);
 else{
  const toFox=fox.position.clone().sub(dummy.position).setY(0),d=toFox.length();
  // It charges until the archer dashes off, then pursues slower than a run.
  // Each phase eases into its stand-off distance instead of stopping dead.
  if(t<15.5)dummy.position.addScaledVector(toFox.normalize(),(t<9.3?1.05:.22)*smooth(.8,1.2,d)*dt);
  else if(t<21){const r=dummy.position.clone().sub(fox.position).setY(0);const radius=r.length(),angle=Math.atan2(r.x,r.z)+.32*dt,target=lerpR(radius,2.6,dt);dummy.position.set(fox.position.x+Math.sin(angle)*target,0,fox.position.z+Math.cos(angle)*target);}
  else dummy.position.addScaledVector(toFox.normalize(),.45*smooth(1.5,1.9,d)*dt);
 }
 // A low-passed velocity feeds the lead aim, so it does not flicker.
 state.enemyVelocity.lerp(dummy.position.clone().sub(before).multiplyScalar(1/dt),.12);
 dummy.lookAt(fox.position.x,0,fox.position.z);
 state.flinch=Math.max(0,state.flinch-dt*2.5);const fall=state.defeated>=0?Math.min(1,(t-state.defeated)/.6):0;
 tilt.rotation.x=-(.35*Math.sin(Math.PI*Math.min(1,1-state.flinch))*state.flinch)-1.45*fall*fall;
 skin.emissive.setScalar(.55*state.flinch*state.flinch);
}
const lerpR=(a,b,dt)=>a+(b-a)*Math.min(1,dt*1.2);
const enemyChest=()=>dummy.position.clone().setY(CHEST),enemyHead=()=>dummy.position.clone().setY(1.12);
const yawTo=p=>actor.yawToward(p),distance=()=>fox.position.distanceTo(dummy.position);

// Archer behaviour: each task starts its clips and reports when it is done.
// Archer behaviour: each task starts its clips, may steer every step, and
// reports when it is done. Kiting re-aims its travel direction continuously.
const faceYaw=()=>yawTo(dummy.position),awayYaw=()=>faceYaw()+Math.PI;
const kiteFor=(label,direction)=>({label,start(){actor.turnTo(faceYaw(),['idle']);this.kiting=false;this.shots=state.shots.length;},update(){if(!this.kiting&&actor.mode==='idle'){this.kiting=true;}if(this.kiting)actor.kite(direction());},done(){return this.kiting&&isShooting(actor.mode)&&state.shots.length>this.shots&&actor.time>2.12;}});
const tasks=[
 {label:'Watch the approach',start(){actor.play('idle');},done:t=>t>1.2},
 {label:'Turn to face',start(){actor.turnTo(faceYaw(),['idle']);},done:()=>actor.mode==='idle'},
 {label:'Standing volley, three bow angles',start(){actor.play('attack');},done:()=>state.shots.length>=3&&actor.time>2.1},
 {label:'Hold and track',start(){actor.play('idle');},done:()=>state.time>8.6&&actor.mode==='idle'},
 {label:'Dash away',start(){actor.turnTo(faceYaw(),['dashBack','idle']);},done:()=>actor.mode==='idle'&&actor.history.at(-2)?.mode==='dashBack'},
 // Backing off at an angle that swings across the rear: the legs blend the
 // backward and diagonal steps as the direction moves.
 {...kiteFor('Kite back, shooting',()=>awayYaw()+.75*Math.sin((state.time-state.taskStart)*1.6)),start(){this.kiting=true;this.shots=state.shots.length;}},
 {label:'Quick turn and run away',start(){actor.turnTo(awayYaw(),['run'],{quick:true});},done:(t,s)=>actor.mode==='run'&&t-s>3.0},
 {label:'Brake and pivot to fight',start(){actor.stopAndTurn(faceYaw());},done:()=>actor.mode==='idle'},
 kiteFor('Turn and circle-strafe',()=>faceYaw()-Math.PI/2),
 kiteFor('Strafe back diagonally',()=>faceYaw()+Math.PI*.65),
 // Dash in, re-face the dummy, then take the stance for the last shot.
 {label:'Dash in, final shot',start(){actor.turnTo(faceYaw(),['dash']);this.faced=false;},update(){if(!this.faced&&actor.mode==='idle'&&actor.history.at(-2)?.mode==='dash'){this.faced=true;actor.turnTo(faceYaw(),['attack']);}},done:()=>isAttackLoop(actor.mode)&&actor.time>2.12},
 {label:'Settle',start(){actor.play('idle');},done:()=>false},
];
function archerStep(){
 const task=tasks[state.task];task.update?.();
 if(task.done(state.time,state.taskStart)&&state.task<tasks.length-1){state.task++;state.taskStart=state.time;tasks[state.task].start();state.label=tasks[state.task].label;state.events.push({time:state.time,task:state.label});}
}

// Loose arrows leave from the clip's own release transform and fly straight.
const flight=new T.Group();scene.add(flight);
function spawnArrow(){
 const mesh=clipArrow.clone(true);mesh.scale.setScalar(1);clipArrow.getWorldPosition(mesh.position);clipArrow.getWorldQuaternion(mesh.quaternion);flight.add(mesh);
 const direction=new T.Vector3(-1,0,0).applyQuaternion(mesh.quaternion);
 state.arrows.push({mesh,direction,age:0,stuck:false,hit:false});const toward=state.lead.clone().sub(mesh.position);state.shots.push({time:state.time,mode:actor.mode,origin:mesh.position.toArray(),aim:direction.toArray(),aimErrorDegrees:Math.atan2(Math.abs(direction.x*toward.z-direction.z*toward.x),direction.x*toward.x+direction.z*toward.z)*180/Math.PI,heightError:mesh.position.y-state.lead.y});
}
function arrowsStep(dt){
 for(const a of state.arrows){
  if(a.stuck)continue;a.age+=dt;
  const tip=new T.Vector3(ARROW.tip-.0275,0,0).applyQuaternion(a.mesh.quaternion).add(a.mesh.position),move=a.direction.clone().multiplyScalar(ARROW_SPEED*dt);
  // Swept tip against the dummy's capsule axis.
  const axisA=dummy.position.clone().setY(.35),axisB=dummy.position.clone().setY(.95),seg=new T.Line3(tip,tip.clone().add(move)),onSeg=new T.Vector3(),onAxis=new T.Vector3();
  closestPoints(seg,new T.Line3(axisA,axisB),onSeg,onAxis);
  if(state.defeated<0&&onSeg.distanceTo(onAxis)<RADIUS){
   const travel=onSeg.distanceTo(tip)+.05;a.mesh.position.addScaledVector(a.direction,travel);a.stuck=true;a.hit=true;
   tilt.attach(a.mesh);state.flinch=1;const shot=state.shots[state.arrows.indexOf(a)];shot.hit={time:state.time,height:onSeg.y,miss:onSeg.distanceTo(onAxis)};
   if(state.shots.filter(s=>s.hit).length>=HITS_TO_FELL&&state.defeated<0)state.defeated=state.time+.15;continue;
  }
  a.mesh.position.add(move);if(a.age>2)a.mesh.visible=false;
 }
}
function closestPoints(s1,s2,p1,p2){
 const d1=s1.delta(new T.Vector3()),d2=s2.delta(new T.Vector3()),r=s1.start.clone().sub(s2.start),a=d1.dot(d1),e=d2.dot(d2),f=d2.dot(r);let s=0,t=0;
 const c=d1.dot(r),b=d1.dot(d2),den=a*e-b*b;s=den>1e-9?T.MathUtils.clamp((b*f-c*e)/den,0,1):0;t=(b*s+f)/e;
 if(t<0){t=0;s=T.MathUtils.clamp(-c/a,0,1);}else if(t>1){t=1;s=T.MathUtils.clamp((b-c)/a,0,1);}
 p1.copy(s1.start).addScaledVector(d1,s);p2.copy(s2.start).addScaledVector(d2,t);
}

let lastClipTime=0,lastMode='idle';
function step(){
 enemyStep(STEP);archerStep();
 // Aim leads the moving dummy by the arrow's flight time; the gaze follows its head.
 const flightTime=distance()/ARROW_SPEED;state.lead.copy(enemyChest()).addScaledVector(state.enemyVelocity,flightTime);
 actor.target=isShooting(actor.mode)?state.lead.clone():enemyHead();actor.look=isShooting(actor.mode)?null:enemyHead();
 actor.step(STEP);
 if(isShooting(actor.mode)&&isShooting(lastMode)&&lastClipTime<RELEASE&&actor.time>=RELEASE)spawnArrow();
 if(isShooting(actor.mode)&&actor.time>=RELEASE)clipArrow.scale.setScalar(0);
 lastClipTime=actor.time;lastMode=actor.mode;
 arrowsStep(STEP);state.time+=STEP;
 // Gaze record: angle between the face and the dummy's head while it is in view.
 // Measured against the gaze target in use (the aim point while shooting),
 // whenever it lies within reach of the body's facing, turns included.
 const head=fox.getObjectByName('Head'),forward=new T.Vector3(0,0,1).applyQuaternion(head.getWorldQuaternion(new T.Quaternion())),to=actor.target.clone().sub(head.getWorldPosition(new T.Vector3())).normalize();
 const facing=new T.Vector3(0,0,1).applyQuaternion(fox.getObjectByName('Root').getWorldQuaternion(new T.Quaternion())).setY(0).normalize(),offAxis=Math.acos(T.MathUtils.clamp(facing.dot(to.clone().setY(0).normalize()),-1,1));
 const headYaw=Math.atan2(forward.x,forward.z),last=state.track.at(-1),changed=state.events.at(-1)?.time??0,mode=actor.history.at(-1)?.at??0;
 state.track.push({time:state.time,mode:actor.mode,error:forward.angleTo(to),offAxis,headYaw,swing:last?Math.abs(Math.atan2(Math.sin(headYaw-last.headYaw),Math.cos(headYaw-last.headYaw))):0,settled:state.time-Math.max(changed,mode)>.6&&actor.weights.track>.98});
}

// Camera frames the fight side-on: perpendicular to the archer-dummy line,
// staying on whichever side it is already on, so neither hides the other.
const look=new T.Vector3(),eye=new T.Vector3();let cameraReady=false;
function frameCamera(dt){
 const mid=fox.position.clone().lerp(dummy.position,.45).setY(.55),axis=dummy.position.clone().sub(fox.position).setY(0),span=Math.max(1.6,axis.length());axis.normalize();
 let side=new T.Vector3(axis.z,0,-axis.x);const facing=new T.Vector3(Math.sin(fox.rotation.y),0,Math.cos(fox.rotation.y));
 if(cameraReady?side.dot(eye.clone().sub(look))<0:side.dot(facing)<0)side.negate();
 const distance=1.9+span*.85,wantEye=mid.clone().addScaledVector(side,distance*.86).addScaledVector(axis,-distance*.18).add(new T.Vector3(0,distance*.48,0));
 if(!cameraReady){look.copy(mid);eye.copy(wantEye);cameraReady=true;}else{look.lerp(mid,Math.min(1,dt*3));eye.lerp(wantEye,Math.min(1,dt*1.6));}
 camera.position.copy(eye);camera.lookAt(look);
}
function reset(){
 for(const a of state.arrows)a.mesh.removeFromParent();Object.assign(state,{time:0,shots:[],arrows:[],events:[],track:[],flinch:0,defeated:-1,task:0,taskStart:0,label:tasks[0].label});
 state.enemyVelocity.set(0,0,0);fox.position.set(0,0,0);fox.rotation.set(0,-.35,0);dummy.position.copy(enemyPlan(0));actor.reset();actor.target=null;actor.look=null;tasks[0].start();cameraReady=false;lastClipTime=0;lastMode='idle';
 actor.pose();frameCamera(0);
}
function simulate(seconds){reset();while(state.time<seconds-1e-9){step();frameCamera(STEP);}}
function summary(){
 const inView=state.track.filter(s=>s.offAxis<1.0&&!isTurn(s.mode)&&!['dash','dashBack'].includes(s.mode));
 // Settled: at least 0.6 s after a task or clip change, so the deliberate
 // smoothing of a new look target is not counted as tracking error.
 const settled=inView.filter(s=>s.settled);
 return {time:state.time,task:state.label,shots:state.shots.length,hits:state.shots.filter(s=>s.hit).length,shotsDetail:state.shots,events:state.events,history:actor.history.map(h=>({mode:h.mode,at:h.at})),
  gaze:{samples:inView.length,meanDegrees:inView.reduce((s,v)=>s+v.error,0)/Math.max(1,inView.length)*180/Math.PI,p95Degrees:[...inView].sort((a,b)=>a.error-b.error)[Math.floor(inView.length*.95)]?.error*180/Math.PI,settledSamples:settled.length,settledP95Degrees:[...settled].sort((a,b)=>a.error-b.error)[Math.floor(settled.length*.95)]?.error*180/Math.PI,maxSwingDegreesPerFrame:Math.max(...state.track.map(s=>s.swing))*180/Math.PI},
  defeated:state.defeated};
}
return {actor,fox,dummy,state,reset,simulate,summary,step:()=>{step();frameCamera(STEP);},frameCamera,camera,get focus(){return look;}};
}
