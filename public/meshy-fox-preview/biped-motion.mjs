import {CLIPS,smooth} from './fox-motion.mjs';

export const BIPED_CLIPS={...CLIPS,
 run:{...CLIPS.run,velocity:[0,0,2*.095/(.42*CLIPS.run.duration)]},
 jumpForwardShot:{...CLIPS.jumpShot,name:'Jump_Shot_Forward',loop:false,jumpTravel:.72},
 jumpBackwardShot:{...CLIPS.jumpShot,name:'Jump_Shot_Backward',loop:false,jumpTravel:-.64}
};
export const JUMP={launch:.78,flight:.60,gravity:9.81,settle:.16};
JUMP.land=JUMP.launch+JUMP.flight;JUMP.impulse=JUMP.gravity*JUMP.flight/2;JUMP.height=JUMP.impulse**2/(2*JUMP.gravity);
export function jumpPhysics(t){
 const air=t-JUMP.launch,elapsed=Math.max(0,Math.min(JUMP.flight,air)),height=t>JUMP.launch&&t<JUMP.land?JUMP.impulse*air-.5*JUMP.gravity*air*air:0;
 const anticipation=smooth(.48,.65,t)*(1-smooth(.70,JUMP.launch,t)),landing=smooth(JUMP.land,JUMP.land+.055,t)*(1-smooth(JUMP.land+.065,JUMP.land+.31,t));
 const airShare=JUMP.flight/(JUMP.flight+.5*JUMP.settle),s=Math.max(0,Math.min(JUMP.settle,t-JUMP.land)),travel=airShare*elapsed/JUMP.flight+airShare/JUMP.flight*(s-.5*s*s/JUMP.settle);
 return {height,velocity:t>=JUMP.launch&&t<JUMP.land?JUMP.impulse-JUMP.gravity*air:0,compression:Math.max(anticipation,landing),travel,airborne:t>JUMP.launch&&t<JUMP.land};
}
const pulse=(t,start,duration)=>t>start&&t<start+duration?Math.sin((t-start)/duration*Math.PI)**2:0;
export function noseTwitch(t){t=(t%8+8)%8;return [Math.max(pulse(t,2,.17),pulse(t,2.39,.14),pulse(t,5.10,.17)),Math.max(pulse(t,2.20,.15),pulse(t,5.31,.18))];}
export const BIPED_ACROBATICS=[['run',1.25],['dash',.75],['sideFlipLeft',1],['vault',1.1],['jumpForwardShot',2.75],['slideShot',2.25],['crouchVolley',2.75],['jumpBackwardShot',2.75],['sideFlipRight',1],['duck',.75],['run',1.1],['runStopTurnLeft',1],['idle',1]];
