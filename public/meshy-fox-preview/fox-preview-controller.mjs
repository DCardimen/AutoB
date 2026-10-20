import * as T from 'three';
import {CLIPS,isShooting,tailSwishAngle} from './fox-motion.mjs';

// Preview behavior layered after the portable clip. This keeps gait direction,
// upper-body aim, and the ambient tail clock independent of one another.
export class FoxPreviewController {
 constructor(model){this.model=model;this.bone=name=>model.getObjectByName(name);this.up=new T.Vector3(0,1,0);this.base=[];}
 // Restore before sampling the mixer. Three may skip an unchanged channel;
 // without this, repeated scrubbing would accumulate the procedural turn.
 restore(){for(const [o,p,q]of this.base){o.position.copy(p);o.quaternion.copy(q);}this.base=[];}
 apply({mode,clipTime,ambientTime,target=null}){
  const {model}=this;
  if(mode==='death')return;
  for(const name of ['Chest','Head',...Array.from({length:6},(_,i)=>`Tail_${String(i).padStart(2,'0')}`),'Arrow_Nock_and_Flight','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)]){
   const o=this.bone(name);this.base.push([o,o.position.clone(),o.quaternion.clone()]);
  }
  for(let i=0;i<6;i++){
   const tail=this.bone(`Tail_${String(i).padStart(2,'0')}`);
   tail.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(this.up,tailSwishAngle(ambientTime,i)-(mode==='idle'?tailSwishAngle(clipTime,i):0)));
  }
  model.updateMatrixWorld(true);
  if(!target)return;
  const chest=this.bone('Chest'),head=this.bone('Head');
  const localTarget=model.worldToLocal(target.clone());
  const pivot=model.worldToLocal(chest.getWorldPosition(new T.Vector3()));
  const angle=Math.atan2(localTarget.x-pivot.x,localTarget.z-pivot.z);
  if(isShooting(mode)){
   const yaw=T.MathUtils.clamp(angle,-.45,.45),q=new T.Quaternion().setFromAxisAngle(this.up,yaw);
   chest.quaternion.premultiply(q);
   // Loose arrow/effects are scene children; rotate them around the same chest
   // pivot as the held equipment, so release and trajectory agree with aim.
   for(const name of ['Arrow_Nock_and_Flight','Release_Flair',...Array.from({length:5},(_,i)=>`Release_Spark_${i}`)]){
    const o=this.bone(name);o.position.sub(pivot).applyQuaternion(q).add(pivot);o.quaternion.premultiply(q);
   }
   model.updateMatrixWorld(true);
  }
  const headPosition=head.getWorldPosition(new T.Vector3());
  const direction=target.clone().sub(headPosition).normalize().applyQuaternion(head.parent.getWorldQuaternion(new T.Quaternion()).invert());
  const yaw=T.MathUtils.clamp(Math.atan2(direction.x,direction.z),-.45,.45);
  const pitch=T.MathUtils.clamp(-Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),-.15,.15);
  head.quaternion.setFromEuler(new T.Euler(pitch,yaw,0,'YXZ'));
  model.updateMatrixWorld(true);
 }
}

export function travelVelocity(mode){
 return new T.Vector3(...(CLIPS[mode]?.velocity||[0,0,0]));
}
