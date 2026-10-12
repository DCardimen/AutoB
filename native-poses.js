import {characterRig} from './prototype-rig.js';
import {previewRagdoll} from './prototype-dynamics.js';
import {nativeFormRig,formProfile} from './native-forms.js';
import {paintCharacterPixels} from './prototype-pixel-art.js';

export const NATIVE_POSES=['idle','walk','run','sprint','turn','stop','attack','slash','charge','cast','dash','dodge','hit','stagger','knockdown','getup','death'];
export function nativePoseRig(spec,c,state='idle',phase=.25,height=1){
 const profile=formProfile(spec,c),stage=['attack','slash','charge','cast'].includes(state)?(phase<.5?'windup':'recovery'):'';
 const posePhase=stage?(phase<.5?phase*2:(phase-.5)*2):phase;
 const rig=['knockdown','getup','death'].includes(state)?previewRagdoll(spec.nativeRig,phase,state==='getup'):characterRig(spec.nativeRig,state,posePhase,stage,{stride:profile.stride||undefined});
 return nativeFormRig(spec,c,rig,height);
}
export function nativePosePixels(spec,c,state,phase,dir,height=1){return paintCharacterPixels(spec.nativeRig,nativePoseRig(spec,c,state,phase,height),dir*Math.PI/4);}
