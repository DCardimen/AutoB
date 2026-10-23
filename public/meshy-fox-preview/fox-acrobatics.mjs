import {FoxActor} from './fox-actor.mjs';

// One continuous performance through the real runtime, including its root
// motion and cross-fades. Durations include the first stance entry.
export const ACROBATICS=[['run',1.25],['dash',.75],['sideFlipLeft',1.0],['vault',1.10],['jumpShot',2.75],['slideShot',2.25],['crouchVolley',2.75],['sideFlipRight',1.0],['duck',.75],['run',1.1],['runStopTurnLeft',1.0],['idle',1.0]];
export class FoxAcrobatics {
 constructor(asset,options){this.sequence=options?.sequence||ACROBATICS;this.actor=new FoxActor(asset,options);this.index=0;this.elapsed=0;this.time=0;this.done=false;this.actor.model.position.set(0,0,0);this.actor.model.rotation.set(0,0,0);this.actor.play(this.sequence[0][0]);this.actor.pose();}
 step(dt){if(this.done)return;this.elapsed+=dt;this.time+=dt;while(this.elapsed>=this.sequence[this.index][1]){this.elapsed-=this.sequence[this.index][1];if(++this.index===this.sequence.length){this.done=true;return;}this.actor.play(this.sequence[this.index][0]);}this.actor.step(dt);}
 get duration(){return this.sequence.reduce((s,[,d])=>s+d,0);}
}
