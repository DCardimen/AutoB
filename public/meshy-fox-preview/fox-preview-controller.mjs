import * as T from 'three';
import {foxExpressions} from './fox-expressions.mjs';
import {AIM,BOW,CLIPS,isShooting,isTurn,settlesToIdle,tailSwishAngle} from './fox-motion.mjs';

// Preview behavior layered after the portable clip. This keeps gait direction,
// upper-body aim, and the ambient tail clock independent of one another.
export class FoxPreviewController {
 constructor(model){this.model=model;this.bone=name=>model.getObjectByName(name);this.up=new T.Vector3(0,1,0);this.base=[];this.morphBase=[];this.expressionMeshes=[];for(const name of ['Head_Open','Head_Closed'])this.bone(name).traverse(o=>{if(o.isMesh&&o.morphTargetInfluences?.length===3)this.expressionMeshes.push(o);});}
 // Restore before sampling the mixer. Three may skip an unchanged channel;
 // without this, repeated scrubbing would accumulate the procedural turn.
 restore(){for(const [o,p,q]of this.base){o.position.copy(p);o.quaternion.copy(q);}this.base=[];for(const [o,w]of this.morphBase)o.morphTargetInfluences.splice(0,w.length,...w);this.morphBase=[];}
 apply({mode,clipTime,ambientTime,target=null,look=null,weights=null}){
  const {model}=this;
  if(mode==='death')return;
  const expressions=foxExpressions(ambientTime,mode);for(const o of this.expressionMeshes){this.morphBase.push([o,[...o.morphTargetInfluences]]);o.morphTargetInfluences.splice(0,3,...expressions);}
  for(const name of ['Spine','Chest','Neck','Head',...Array.from({length:6},(_,i)=>`Tail_${String(i).padStart(2,'0')}`),'Arrow_Nock_and_Flight','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)]){
   const o=this.bone(name);this.base.push([o,o.position.clone(),o.quaternion.clone()]);
  }
  for(let i=0;i<6;i++){
   const tail=this.bone(`Tail_${String(i).padStart(2,'0')}`);
   tail.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(this.up,tailSwishAngle(ambientTime,i)-(mode==='idle'?tailSwishAngle(clipTime,i):settlesToIdle(mode)?tailSwishAngle(0,i):0)));
  }
  model.updateMatrixWorld(true);
  if(!target)return;
  // Weights blend the tracking styles continuously: track fades the whole
  // chain in, aim moves the trunk's share onto the bow line, and turn hands
  // the trunk to a turning clip. Defaults follow the mode, so a scrubbed
  // viewer and a cross-fading runtime see the same pose at full weight.
  const w={track:1,aim:isShooting(mode)?1:0,turn:isTurn(mode)?1:0,...weights};
  const spine=this.bone('Spine'),chest=this.bone('Chest'),neck=this.bone('Neck'),head=this.bone('Head');
  const localTarget=model.worldToLocal(target.clone());
  const pivot=model.worldToLocal(chest.getWorldPosition(new T.Vector3()));
  const angle=Math.atan2(localTarget.x-pivot.x,localTarget.z-pivot.z);
  // Looking around, the gaze leads and the trunk follows with smaller shares,
  // so the head never swivels alone on a still body.
  const lookYaw=T.MathUtils.clamp(angle,-1.1,1.1);
  // Aiming, spine and chest share the turn about one vertical axis through
  // both pivots, so the bow, string and loose arrow turn as one rigid frame.
  // The arrow runs beside that axis, so solve for the yaw that puts its own
  // line, not the pivot's, through the target. While nocked and aimed the
  // arrow node carries that line; it is a direct child of the model, so its
  // local transform stays valid at zero scale (a world decomposition would
  // not). Before nocking and after the loose it sits on the carried bow or
  // down-range, so the fixed full-draw line (parallel to +Z through the nock)
  // is used instead.
  const nocked=isShooting(mode)&&clipTime>=.46&&clipTime<1.6,arrow=this.bone('Arrow_Nock_and_Flight');
  const along=nocked?arrow.position.clone().sub(pivot):new T.Vector3(AIM.grip[0]+BOW.nockY*Math.sin(AIM.cant)-pivot.x,0,0),direction=nocked?new T.Vector3(-1,0,0).applyQuaternion(arrow.quaternion):new T.Vector3(0,0,1);
  const range=Math.hypot(localTarget.x-pivot.x,localTarget.z-pivot.z),offset=along.x*direction.z-along.z*direction.x;
  const aimYaw=T.MathUtils.clamp(angle-Math.atan2(direction.x,direction.z)-Math.asin(T.MathUtils.clamp(offset/Math.max(range,1e-6),-1,1)),-.6,.6);
  // During a turn the clip turns the trunk; only the neck joins the gaze.
  const relative=this.relativeYaw(chest,target),turnYaw=.3*T.MathUtils.clamp(Math.atan2(Math.sin(relative),Math.cos(relative)),-1.1,1.1);
  const trunk=w.track*(1-w.turn),spineYaw=trunk*((1-w.aim)*.10*lookYaw+w.aim*.35*aimYaw),chestYaw=trunk*((1-w.aim)*.16*lookYaw+w.aim*.65*aimYaw);
  this.turnAboutUp(spine,spineYaw);this.turnAboutUp(chest,chestYaw);
  // Loose arrow/effects are scene children; rotate them around the same chest
  // pivot as the held equipment, so release and trajectory agree with aim.
  const q=new T.Quaternion().setFromAxisAngle(this.up,spineYaw+chestYaw);
  for(const name of ['Arrow_Nock_and_Flight','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)]){
   const o=this.bone(name);o.position.sub(pivot).applyQuaternion(q).add(pivot);o.quaternion.premultiply(q);
  }
  this.turnAboutUp(neck,w.track*((1-w.turn)*(1-w.aim)*.24*lookYaw+w.turn*turnYaw));
  // The head takes the remaining, smallest rotation onto the gaze point.
  // Keeping the clip's own tilt preserves the archer's lean toward the string.
  const gaze=look||target,forward=new T.Vector3(0,0,1).applyQuaternion(head.getWorldQuaternion(new T.Quaternion())),toward=gaze.clone().sub(head.getWorldPosition(new T.Vector3())).normalize();
  const turnHead=new T.Quaternion().setFromUnitVectors(forward,toward),limit=.75,amount=2*Math.acos(Math.min(1,Math.abs(turnHead.w)));
  if(amount>limit)turnHead.slerp(new T.Quaternion(),1-limit/amount);
  turnHead.slerp(new T.Quaternion(),1-w.track);this.rotateInWorld(head,turnHead);
 }
 // Yaw from a bone's facing to the target, about the vertical.
 relativeYaw(o,target){const f=new T.Vector3(0,0,1).applyQuaternion(o.getWorldQuaternion(new T.Quaternion())),d=target.clone().sub(o.getWorldPosition(new T.Vector3()));return Math.atan2(d.x,d.z)-Math.atan2(f.x,f.z);}
 rotateInWorld(o,q){const parent=o.parent.getWorldQuaternion(new T.Quaternion());o.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));this.model.updateMatrixWorld(true);}
 turnAboutUp(o,angle){this.rotateInWorld(o,new T.Quaternion().setFromAxisAngle(this.up,angle));}
}

export function travelVelocity(mode){
 return new T.Vector3(...(CLIPS[mode]?.velocity||[0,0,0]));
}
