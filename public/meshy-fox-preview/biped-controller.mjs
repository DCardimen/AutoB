import * as T from 'three';
import {bipedTailAudit,clearBipedTail} from './biped-tail.mjs';
import {noseTwitch} from './biped-motion.mjs';
import {fitBipedQuiver} from './biped-quiver.mjs';
import {NOCK,RELEASE,isShooting,isTurn} from './fox-motion.mjs';

// Effects the trunk carries: the loose arrows and release flash are children
// of the motion root, so they turn with the bow about the same chest pivot.
const CARRIED=['Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)];
// The biped's full-draw arrow line in motion-root space: parallel to +Z,
// beside the chest (measured from Bow_Attack at full draw).
const DRAW_LINE_X=.135;

// Runtime layer after the portable biped clips: nose twitch, an optional
// look/aim toward a target, then the tail and quiver clearances. Looking
// around, the gaze leads and the trunk follows with smaller shares; aiming,
// the spine and chest share one vertical turn so the bow, string and arrow
// stay rigid while the arrow line swings onto the target.
export class BipedController{
 // Facing of a bone in the world, from its measured rest axis.
 headForward(){return this.facing.get('smartrigHead').clone().applyQuaternion(this.bone('smartrigHead').getWorldQuaternion(new T.Quaternion()));}
 constructor(model){this.model=model;this.bone=n=>model.getObjectByName(n);this.mesh=this.bone('Biped_Fox');this.tail=this.bone('Bone_019');this.quiver=this.bone('Quiver');this.root=this.bone('Biped_Motion_Root');this.audit=bipedTailAudit(this.mesh);this.saved=null;this.base=[];this.up=new T.Vector3(0,1,0);
  // SmartRig bone axes are not the body's: measure each facing in the rest pose.
  model.updateMatrixWorld(true);const facing=new T.Vector3(0,0,1).applyQuaternion(model.getWorldQuaternion(new T.Quaternion()));this.facing=new Map(['smartrigSpine2','smartrigHead'].map(n=>[n,facing.clone().applyQuaternion(this.bone(n).getWorldQuaternion(new T.Quaternion()).invert())]));}
 restore(){if(this.saved){this.tail.quaternion.copy(this.saved);this.saved=null;}if(this.face){this.mesh.morphTargetInfluences.splice(0,2,...this.face);this.face=null;}if(this.mount){this.quiver.position.copy(this.mount);this.mount=null;}for(const [o,p,q]of this.base){o.position.copy(p);o.quaternion.copy(q);}this.base=[];}
 apply({mode,clipTime=0,ambientTime,target=null,look=null,weights=null,resolve=true}){
  this.face=[...this.mesh.morphTargetInfluences];this.mesh.morphTargetInfluences.splice(0,2,...(mode==='idle'?noseTwitch(ambientTime):[0,0]));
  if(target&&mode!=='death')this.look(mode,clipTime,target,look,weights);
  // The tail clears the tunic whenever the trunk is turned; the quiver rides
  // the chest socket through that turn, and is refitted while clips blend. A
  // fit that finds no clearance (the paw inside the quiver mouth mid-draw)
  // keeps the baked mount.
  if(resolve||target){this.saved=this.tail.quaternion.clone();try{clearBipedTail(this.audit,this.tail,()=>{this.model.updateMatrixWorld(true);this.mesh.skeleton.update()});}catch(e){this.tailMisses=(this.tailMisses||0)+1;this.tail.quaternion.copy(this.saved);this.model.updateMatrixWorld(true);}}
  if(resolve){this.mount=this.quiver.position.clone();try{fitBipedQuiver(this.quiver,this.mesh,this.audit);}catch(e){this.quiverMisses=(this.quiverMisses||0)+1;this.quiver.position.copy(this.mount);}}
 }
 look(mode,clipTime,target,look,weights){
  const spine=this.bone('smartrigSpine1'),chest=this.bone('smartrigSpine2'),neck=this.bone('smartrigNeck'),head=this.bone('smartrigHead'),root=this.root;
  for(const o of [spine,chest,neck,head,...CARRIED.map(this.bone)])if(o)this.base.push([o,o.position.clone(),o.quaternion.clone()]);
  this.model.updateMatrixWorld(true);
  const w={track:1,aim:isShooting(mode)?1:0,turn:isTurn(mode)?1:0,...weights};
  // The trunk's look turn fades out as the target passes behind, as the
  // head's does below, instead of swinging to the other side.
  const local=p=>root.worldToLocal(p.clone()),aim=local(target),pivot=local(chest.getWorldPosition(new T.Vector3())),angle=Math.atan2(aim.x-pivot.x,aim.z-pivot.z),rear=Math.min(1,Math.max(0,(Math.abs(angle)-1.9)/.5)),lookYaw=T.MathUtils.clamp(angle,-1.1,1.1)*(1-rear*rear*(3-2*rear));
  // Solve for the yaw that puts the arrow's own line, not the pivot's,
  // through the target: the nocked arrow while it is on the string, else the
  // fixed full-draw line.
  const arrow=this.bone('Arrow_Nock_and_Flight'),nocked=w.aim>.5&&clipTime>=NOCK&&clipTime<RELEASE+.35;
  const along=nocked?arrow.position.clone().sub(pivot):new T.Vector3(DRAW_LINE_X-pivot.x,0,0),direction=nocked?new T.Vector3(-1,0,0).applyQuaternion(arrow.quaternion):new T.Vector3(0,0,1);
  const range=Math.hypot(aim.x-pivot.x,aim.z-pivot.z),offset=along.x*direction.z-along.z*direction.x,aimYaw=T.MathUtils.clamp(angle-Math.atan2(direction.x,direction.z)-Math.asin(T.MathUtils.clamp(offset/Math.max(range,1e-6),-1,1)),-.6,.6);
  const relative=this.relativeYaw(chest,target),turnYaw=.3*T.MathUtils.clamp(Math.atan2(Math.sin(relative),Math.cos(relative)),-1.1,1.1);
  const trunk=w.track*(1-w.turn),spineYaw=trunk*((1-w.aim)*.10*lookYaw+w.aim*.35*aimYaw),chestYaw=trunk*((1-w.aim)*.16*lookYaw+w.aim*.65*aimYaw);
  this.turnAboutUp(spine,spineYaw);this.turnAboutUp(chest,chestYaw);
  // Carried effects turn about the same pivot, in the motion root's frame;
  // their local transforms stay valid at zero scale.
  const upLocal=this.up.clone().applyQuaternion(root.getWorldQuaternion(new T.Quaternion()).invert()),q=new T.Quaternion().setFromAxisAngle(upLocal,spineYaw+chestYaw);
  for(const name of CARRIED){const o=this.bone(name);if(!o)continue;o.position.sub(pivot).applyQuaternion(q).add(pivot);o.quaternion.premultiply(q);}
  this.turnAboutUp(neck,w.track*((1-w.turn)*(1-w.aim)*.24*lookYaw+w.turn*turnYaw));
  // The head takes the remaining, smallest rotation onto the gaze point,
  // keeping the clip's own tilt (the archer's lean toward the string).
  const gaze=look||target,forward=this.facing.get(head.name).clone().applyQuaternion(head.getWorldQuaternion(new T.Quaternion())),toward=gaze.clone().sub(head.getWorldPosition(new T.Vector3())).normalize();
  const turnHead=new T.Quaternion().setFromUnitVectors(forward,toward),limit=.75,amount=2*Math.acos(Math.min(1,Math.abs(turnHead.w)));
  if(amount>limit)turnHead.slerp(new T.Quaternion(),1-limit/amount);
  // A target passing behind the head fades out instead of flipping sides.
  const off=forward.angleTo(toward),behind=Math.min(1,Math.max(0,(off-1.9)/.5)),keep=w.track*(1-behind*behind*(3-2*behind));
  turnHead.slerp(new T.Quaternion(),1-keep);this.rotateInWorld(head,turnHead);
 }
 relativeYaw(o,target){const f=this.facing.get(o.name).clone().applyQuaternion(o.getWorldQuaternion(new T.Quaternion())),d=target.clone().sub(o.getWorldPosition(new T.Vector3()));return Math.atan2(d.x,d.z)-Math.atan2(f.x,f.z);}
 rotateInWorld(o,q){const parent=o.parent.getWorldQuaternion(new T.Quaternion());o.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));this.model.updateMatrixWorld(true);}
 turnAboutUp(o,angle){this.rotateInWorld(o,new T.Quaternion().setFromAxisAngle(this.up,angle));}
}
