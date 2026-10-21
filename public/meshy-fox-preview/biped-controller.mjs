import {bipedTailAudit,clearBipedTail} from './biped-tail.mjs';
import {noseTwitch} from './biped-motion.mjs';
import {fitBipedQuiver} from './biped-quiver.mjs';
export class BipedController{
 constructor(model){this.model=model;this.mesh=model.getObjectByName('Biped_Fox');this.tail=model.getObjectByName('Bone_019');this.quiver=model.getObjectByName('Quiver');this.audit=bipedTailAudit(this.mesh);this.saved=null;}
 restore(){if(this.saved){this.tail.quaternion.copy(this.saved);this.saved=null;}if(this.face){this.mesh.morphTargetInfluences.splice(0,2,...this.face);this.face=null;}if(this.mount){this.quiver.position.copy(this.mount);this.mount=null;}}
 apply({mode,ambientTime,resolve=true}){this.face=[...this.mesh.morphTargetInfluences];this.mesh.morphTargetInfluences.splice(0,2,...(mode==='idle'?noseTwitch(ambientTime):[0,0]));if(resolve){this.saved=this.tail.quaternion.clone();clearBipedTail(this.audit,this.tail,()=>{this.model.updateMatrixWorld(true);this.mesh.skeleton.update()});this.mount=this.quiver.position.clone();fitBipedQuiver(this.quiver,this.mesh,this.audit);}}
}
