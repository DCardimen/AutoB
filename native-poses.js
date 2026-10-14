import {nativeRigFor} from './grand-designs.js';
import {characterRig} from './prototype-rig.js';
import {previewRagdoll} from './prototype-dynamics.js';
import {nativeFormRig,formProfile} from './native-forms.js';
import {paintCharacterPixels} from './prototype-pixel-art.js';
import {getTuning} from './tuning.js';

export const NATIVE_POSES=['idle','walk','run','sprint','turn','stop','attack','slash','charge','cast','dash','dodge','hit','stagger','knockdown','getup','death'];
export function nativePoseRig(spec,c,state='idle',phase=.25,height=1){
 // Pixel idle animation advances in deliberate frames, independent of timer jitter.
 if(state==='idle')phase=Math.round(phase*16)/16;
 const id=nativeRigFor(spec,c),profile=formProfile(spec,c),stage=['attack','slash','charge','cast'].includes(state)?(phase<.5?'windup':'recovery'):'';
 const posePhase=stage?(phase<.5?phase*2:(phase-.5)*2):phase;
 const rig=['knockdown','getup','death'].includes(state)?previewRagdoll(id,phase,state==='getup'):characterRig(id,state,posePhase,stage,{stride:profile.stride||undefined,strideLength:c.tuning?.strideLength??getTuning().strideLength,design:spec.nativeDesign});
 return nativeFormRig(spec,c,rig,height);
}
export function nativePosePixels(spec,c,state,phase,dir,height=1){return paintCharacterPixels(nativeRigFor(spec,c),nativePoseRig(spec,c,state,phase,height),dir*Math.PI/4);}
