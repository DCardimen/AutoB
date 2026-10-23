import * as T from 'three';
import {CLIPS,ATTACKS,isAttackLoop,isShooting,isTurn,settlesToIdle,smooth} from './fox-motion.mjs';
import {FoxPreviewController,travelVelocity} from './fox-preview-controller.mjs';

const up=new T.Vector3(0,1,0);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// The eight moving shots, in travel order around the facing (yaw from +Z).
export const KITE=['shootForward','shootForwardRight','shootRight','shootBackwardRight','shootBackward','shootBackwardLeft','shootLeft','shootForwardLeft'];
// Cross-fade lengths. Turns, run stops and the stance exit already end on
// Idle's first frame, so they hand over to Idle almost at once; the stance
// enter ends on the shot loop's first frame, and every shot loop shares that
// ready pose, so those hand-overs are near instant too. Runs and aim changes
// blend longer.
export function fadeLength(from,to){
 if(CLIPS[from]?.acro||CLIPS[to]?.acro)return .30;
 if(from==='crouchVolley'||to==='crouchVolley')return .30;
 // The crouched loop holds lower than the others, so changing to or from it blends.
 if(isAttackLoop(from)&&isAttackLoop(to)&&!!CLIPS[from].crouch!==!!CLIPS[to].crouch)return .30;
 if(from==='attackEnter'&&isAttackLoop(to)&&CLIPS[to].crouch)return .30;
 if(from==='attackEnter'&&isAttackLoop(to)||isAttackLoop(from)&&isAttackLoop(to))return .06;
 if(settlesToIdle(from))return to==='idle'||settlesToIdle(to)?.10:.20;
 if(isAttackLoop(from)&&to==='attackExit')return .22;
 if(to==='dash'||to==='dashBack')return .14;
 if(isShooting(from)!==isShooting(to))return .28;
 if(from==='run'||to==='run')return .24;
 if(to==='runStop'||isTurn(to))return .14;
 return .22;
}
// A style weight moves to a new target along a timed smoothstep: it starts
// and settles with zero speed and bounded acceleration, so a change never
// kicks the trunk on its first frame.
function ease(weights,key,target,duration,dt){
 const change=weights.changes[key]??={from:weights[key],to:weights[key],elapsed:duration};
 if(target!==change.to)Object.assign(change,{from:weights[key],to:target,elapsed:0});
 change.elapsed+=dt;weights[key]=change.from+(change.to-change.from)*smooth(0,duration,change.elapsed);
}

// Runtime layer over the portable clips: cross-fades between actions, blended
// directional kiting, root motion committed into the model transform, queued
// turns and a smoothed look-at. Every state is a pure function of the fixed
// steps taken, so playback repeats.
export class FoxActor {
 constructor(asset,{controller=null,rootName='Root',clips=CLIPS}={}){
  this.clips=clips;this.model=asset.scene;this.mixer=new T.AnimationMixer(this.model);this.controller=controller||new FoxPreviewController(this.model);
  this.root=this.model.getObjectByName(rootName);
  // A second action set plays the outgoing pose of a cross-fade, so a clip
  // can fade into itself (one turn into the next) at two different times.
  this.actions=new Map();this.outgoing=new Map();this.rootEnd=new Map();this.rootTurns=new Map();
  for(const [mode,info]of Object.entries(this.clips)){
   const clip=asset.animations.find(c=>c.name===info.name),action=this.mixer.clipAction(clip);action.setLoop(info.loop?T.LoopRepeat:T.LoopOnce,Infinity);action.clampWhenFinished=true;this.actions.set(mode,action);
   const ghost=this.mixer.clipAction(clip.clone());ghost.setLoop(action.loop,Infinity);ghost.clampWhenFinished=true;this.outgoing.set(mode,ghost);
   // Ground displacement a one-shot clip leaves on the root, committed when it ends.
   const track=clip.tracks.find(t=>t.name===rootName+'.position');let end=new T.Vector3();if(track&&!info.loop){const v=track.values,n=v.length;end=new T.Vector3(v[n-3],0,v[n-1]);}
   this.rootEnd.set(mode,end);
   const turning=clip.tracks.find(t=>t.name===rootName+'.quaternion');if(turning)this.rootTurns.set(mode,turning.createInterpolant());
  }
  this.target=null;this.look=null;this.onFinish=null;this.bowAngles=null;this.reset();
 }
 reset(){
  this.mode='idle';this.mix=new Map([['idle',1]]);this.time=0;this.previous=null;this.queue=[];this.ambient=0;this.history=[{mode:'idle',at:0}];this.shots=0;
  // Look-at state: the gaze acquires a new point quickly, the trunk follows
  // more slowly, and the style weights blend between tracking behaviours.
  this.gaze={point:null,yaw:null};this.trunk={point:null,yaw:null};this.weights={track:0,aim:0,turn:0,anger:0,changes:{}};
 }
 shooting(mode){return isShooting(mode)||!!this.clips[mode]?.bow;}
 attackLoop(mode){return isAttackLoop(mode)||this.clips[mode]?.jumpTravel!==undefined;}
 get duration(){return this.clips[this.mode].duration;}
 // Begin a clip (or a blend of clips sharing one cycle), keeping the outgoing
 // pose for a cross-fade whose length suits the transition.
 start(mode,mix=new Map([[mode,1]])){
  // A clip replaced within a few frames of starting keeps the cross-fade it
  // began with: its outgoing pose is still most of what is on screen, so a
  // fresh fade from the barely started clip would jump.
  const fresh=this.previous&&this.previous.age<this.previous.length&&this.time<.05;
  if(fresh)this.previous.length=Math.max(this.previous.length,fadeLength(this.mode,mode));
  else this.previous={mix:this.mix,time:this.time,age:0,length:fadeLength(this.mode,mode),offset:new T.Vector3(),yaw:0};
  // A moving shot taken up from outside the shot cycle starts in the last
  // moment of its still ready hold, so the cross-fade settles before the paw
  // sets off for the quiver.
  const from=this.mode;this.mode=mode;this.mix=mix;this.time=mode.startsWith('shoot')&&!this.shooting(from)?this.clips[mode].duration-.12:0;this.history.push({mode,at:this.ambient});
 }
 get inStance(){return this.attackLoop(this.mode)||this.mode==='attackEnter';}
 // The standing shot is entered once and held: the stance steps in through
 // Bow_Attack_Enter, holds through any number of shots (bowAngles, if set,
 // cycles the bow angle shot by shot) and steps out through Bow_Attack_Exit
 // before anything else done standing. Moving off blends straight out of it.
 play(mode,then=null){
  then=then?[...then]:[];
  if(mode==='attack'&&this.bowAngles)mode=this.bowAngles[this.shots%this.bowAngles.length];
  if(this.attackLoop(mode)&&!this.inStance){this.queue=[mode,...then];this.start('attackEnter');return;}
  const standing=!this.attackLoop(mode)&&!this.shooting(mode)&&!['run','walk','dash','dashBack','dodgeLeft','dodgeRight','duck','hit','death'].includes(mode);
  if(this.inStance&&standing){this.queue=mode==='idle'?then:[mode,...then];this.start('attackExit');return;}
  // Stepping out of the stance finishes before anything else done standing.
  if(this.mode==='attackExit'&&standing){this.queue=mode==='idle'?then:[mode,...then];return;}
  this.queue=then;if(mode!==this.mode||this.mix.size>1||!this.clips[mode].loop)this.start(mode);
 }
 // Move while shooting toward a world direction: the two nearest of the
 // eight moving shots blend by angle, so the legs step along any direction.
 kite(worldYaw){
  const sector=(((wrap(worldYaw-this.model.rotation.y)/(Math.PI/4))%8)+8)%8,i=Math.floor(sector)%8,f=sector-Math.floor(sector),mix=new Map([[KITE[i],1-f]]);
  if(f>1e-6)mix.set(KITE[(i+1)%8],f);const dominant=f>.5?KITE[(i+1)%8]:KITE[i];
  this.queue=[];
  if([...this.mix.keys()].every(m=>KITE.includes(m))){this.mix=mix;if(this.mode!==dominant){this.mode=dominant;this.history.push({mode:dominant,at:this.ambient});}}
  else this.start(dominant,mix);
 }
 // A running fox brakes through the stop clip; a standing archer steps out of
 // the stance; anything else settles to Idle.
 stop(then=[]){if(this.mix.has('run'))this.play('runStop',['idle',...then]);else this.play(then[0]||'idle',then.slice(1));}
 // Queue 90/45 degree turns toward a world yaw; any small remainder is left
 // to the look-at chain, which covers well beyond half a turn step. A quick
 // turn pivots half a circle at once, for an escape.
 turnTo(yaw,then=[],{quick=false}={}){
  let delta=wrap(yaw-this.model.rotation.y);const steps=[];
  if(quick&&Math.abs(delta)>2.4){steps.push(delta>0?'quickTurnLeft':'quickTurnRight');delta-=Math.sign(delta)*Math.PI;}
  while(Math.abs(delta)>=Math.PI/2-.2){steps.push(delta>0?'turnLeft90':'turnRight90');delta-=Math.sign(delta)*Math.PI/2;}
  if(Math.abs(delta)>=Math.PI/8)steps.push(delta>0?'turnLeft45':'turnRight45');
  if(!steps.length){this.play(then[0]||'idle',then.slice(1));return 0;}
  this.play(steps[0],[...steps.slice(1),...then]);return steps.length;
 }
 // Running, brake straight into a pivot toward a world yaw (half or quarter
 // turn), ending on Idle; otherwise stop, then turn.
 stopAndTurn(yaw,then=[]){
  if(!this.mix.has('run')){this.stop();return this.turnTo(yaw,then);}
  const delta=wrap(yaw-this.model.rotation.y);
  if(Math.abs(delta)>2.4)this.play(delta>0?'runStopTurnLeft':'runStopTurnRight',['idle',...then]);
  else if(Math.abs(delta)>1.0)this.play(delta>0?'runStopTurnLeft90':'runStopTurnRight90',['idle',...then]);
  else this.play('runStop',['idle',...then]);
 }
 yawToward(point){const d=point.clone().sub(this.model.position);return Math.atan2(d.x,d.z);}
 // Finishing a one-shot clip moves the model by its root displacement (and
 // turn), so the next clip starts from the same ground position.
 finish(){
  const mode=this.mode,end=this.rootEnd.get(mode).clone().applyAxisAngle(up,this.model.rotation.y),turn=this.clips[mode].turn||0;
  this.model.position.add(end);this.model.rotation.y=wrap(this.model.rotation.y+turn);
  let next=this.queue.shift()||'idle';
  // A queued shot is taken from the stance: enter it first.
  if(this.attackLoop(next)&&mode!=='attackEnter'){this.queue.unshift(next);next='attackEnter';}
  this.start(next);
  // The held outgoing pose is now expressed relative to the moved model.
  this.previous.offset.copy(this.rootEnd.get(mode));this.previous.yaw=turn;this.onFinish?.(mode,next);
 }
 // Yaw of the body's facing, including a turning clip's root rotation.
 facingYaw(){const z=new T.Vector3(0,0,1).applyQuaternion(this.root.getWorldQuaternion(new T.Quaternion()));return Math.atan2(z.x,z.z);}
 bearing(point){return wrap(this.yawToward(point)-this.facingYaw());}
 velocity(mix){const v=new T.Vector3();for(const [mode,weight]of mix)v.addScaledVector(new T.Vector3(...(this.clips[mode]?.velocity||[0,0,0])),weight);return v;}
 // Second-order follow of the target's world yaw around the fox, with
 // feed-forward: smooth target motion (a few tenths of a radian per second)
 // is tracked without lag, while a jump (a new target, or a different point
 // on it) becomes a quick turn of the head. The yaw is held within the neck's
 // reach of the facing, over the shoulder the target was last seen past, a
 // glance back, so a change of side sweeps round through the front rather
 // than flipping. Distance and height are taken as is.
 follow(state,raw,omega,dt,reach=1.9){
  if(!raw){state.point=null;state.yaw=null;return null;}
  const facing=this.facingYaw();let bearing=this.bearing(raw);
  // The glance-back side changes only while the target is in reach; one that
  // passes straight behind keeps the last side instead of flipping the head.
  if(Math.abs(bearing)<=reach||state.side===undefined)state.side=Math.sign(bearing)||1;
  if(Math.abs(bearing)>reach)bearing=state.side*reach;
  const yaw=facing+bearing;
  if(state.yaw==null){state.yaw=yaw;state.raw=yaw;state.rate=0;}
  let feed=wrap(yaw-state.raw)/dt;if(Math.abs(feed)>1.5)feed=0;state.raw=yaw;state.yaw+=feed*dt;
  // Keep the followed yaw on the reachable side of the facing.
  state.yaw=facing+T.MathUtils.clamp(wrap(state.yaw-facing),-reach,reach);
  state.rate+=(omega*omega*wrap(yaw-state.yaw)-2*omega*state.rate)*dt;state.yaw+=state.rate*dt;
  const distance=Math.hypot(raw.x-this.model.position.x,raw.z-this.model.position.z);
  state.point=new T.Vector3(this.model.position.x+Math.sin(state.yaw)*distance,raw.y,this.model.position.z+Math.cos(state.yaw)*distance);return state.point;
 }
 step(dt){
  this.ambient+=dt;this.time+=dt;
  if(this.previous){this.previous.age+=dt;if([...this.previous.mix.keys()].every(m=>this.clips[m].loop))this.previous.time+=dt;if(this.previous.age>=this.previous.length)this.previous=null;}
  if(!this.clips[this.mode].loop&&this.time>=this.duration){const leftover=this.time-this.duration;this.time=this.duration;this.finish();this.time=leftover;}
  // A shot loop wraps at its ready pose; a new bow angle takes over there.
  if(this.attackLoop(this.mode)&&this.time>=this.duration){this.shots++;const next=this.bowAngles?.[this.shots%this.bowAngles.length];if(next&&next!==this.mode&&!this.queue.length){const leftover=this.time-this.duration;this.start(next);this.time=leftover;}}
  if(this.clips[this.mode].loop)this.time%=this.duration;
  // Travelling gaits carry the model with their planted-foot velocity, which
  // blends through the cross-fade instead of jumping.
  const w=this.previous?smooth(0,this.previous.length,this.previous.age):1,velocity=this.velocity(this.mix).multiplyScalar(w);
  if(this.previous)velocity.addScaledVector(this.velocity(this.previous.mix),1-w);
  this.model.position.add(velocity.multiplyScalar(dt).applyAxisAngle(up,this.model.rotation.y));
  // While kiting the body keeps turning to face the target, at a walking
  // pace, so a circling enemy stays inside the trunk's aim range.
  if(this.target&&[...this.mix.keys()].every(m=>KITE.includes(m))){const bearing=wrap(this.yawToward(this.target)-this.model.rotation.y);this.model.rotation.y=wrap(this.model.rotation.y+T.MathUtils.clamp(2*bearing,-.5,.5)*dt);}
  // Tracking fades in on a new target and out while it is beyond reach behind.
  const W=this.weights,visible=this.target&&Math.abs(this.bearing(this.target))<2.5;ease(W,'track',visible?1:0,visible?.5:.35,dt);ease(W,'aim',this.shooting(this.mode)?1:0,.45,dt);ease(W,'turn',isTurn(this.mode)?1:0,.35,dt);
  // The face hardens as the stance is taken and relaxes after it is left.
  const angry=this.shooting(this.mode)||this.mode==='attackEnter';ease(W,'anger',angry?1:0,angry?.25:.40,dt);
  // The clips are posed first, so the look state reads the current facing
  // (a just-committed turn would otherwise count twice for one frame).
  this.poseClips();this.follow(this.gaze,this.look||this.target,13,dt);this.follow(this.trunk,this.target,8,dt);this.applyLook();
 }
 pose(){this.poseClips();this.applyLook();}
 poseClips(){
  const {mixer,model}=this;this.controller.restore();
  const w=this.previous?smooth(0,this.previous.length,this.previous.age):1;
  const drive=(actions,mix,time,scale)=>{for(const [mode,action]of actions){const weight=(mix?.get(mode)||0)*scale;if(weight<1e-6){action.enabled=false;continue;}action.enabled=true;action.play();action.time=Math.min(time,this.clips[mode].duration-1e-6);action.setEffectiveWeight(weight);}};
  drive(this.actions,this.mix,this.time,w);drive(this.outgoing,this.previous?.mix,this.previous?.time??0,1-w);
  mixer.update(0);
  if(this.previous){
   // Remove the committed displacement from the outgoing pose's share.
   this.root.position.addScaledVector(this.previous.offset,-(1-w));
   // A committed turn leaves the outgoing root half a turn (or a quarter)
   // away. Blend the root rotation explicitly, outgoing first re-expressed in
   // the turned frame, on the shortest path; the mixer's own blend of two
   // roots 180 degrees apart could go the other way round and spin the body.
   if(this.previous.yaw){const outgoing=this.rootRotation(this.previous.mix,this.previous.time).premultiply(new T.Quaternion().setFromAxisAngle(up,-this.previous.yaw));this.root.quaternion.copy(outgoing.slerp(this.rootRotation(this.mix,this.time),w));}
  }
  model.updateMatrixWorld(true);
 }
 // The root's own rotation in a clip mix at a moment.
 rootRotation(mix,time){const q=new T.Quaternion();let total=0;for(const [mode,weight]of mix){const i=this.rootTurns.get(mode);if(!i||weight<1e-6)continue;const v=i.evaluate(Math.min(time,this.clips[mode].duration-1e-6)),r=new T.Quaternion(v[0],v[1],v[2],v[3]);total+=weight;q.slerp(r,weight/total);}return q;}
 applyLook(){
  // Both follows track smooth motion without lag, so the aim needs no raw
  // target; a swapped target point is crossed smoothly instead of kicking.
  const target=this.target?this.trunk.point:null;
  this.controller.apply({mode:this.mode,clipTime:this.time,ambientTime:this.ambient,target,look:this.gaze.point,weights:this.weights,resolve:!!this.previous||this.mix.size>1});
  this.model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 }
}
export {travelVelocity};
