// First-form menu greetings use the visible authored family, not its physics proxy.
import {nativePoseRig} from './native-poses.js';
import {solveLimb} from './prototype-rig.js';
import {paintCharacterPixels} from './prototype-pixel-art.js';
import {PORTRAIT_PROFILES} from './portrait-expressions.js';
const groups={
 owl:['owl'],
 nuzzle:['feralfox','wolf','cat','lion'],
 perk:['rabbit','rodent'],
 nod:['bear','rhino','turtle','stag','troll','drake'],
 swish:['fish','serpent'],
 flutter:['faerie','fairy','harpy','bat','phoenix','moth'],
 wobble:['jelly','mushroom','clam','squid'],
 skitter:['spider','beetle','mantis','crab','centipede'],
 salute:['knight','goblin','dwarf','minotaur','rogue','skeleton'],
 wave:['orc'],
 bow:['elf','fox'],
 magic:['caster','frostelf'],
 chime:['mech'],
};
const byDesign=Object.fromEntries(Object.entries(groups).flatMap(([kind,designs])=>designs.map(design=>[design,kind])));
const glyphs={owl:'♡',nuzzle:'♥',perk:'♥',nod:'♡',swish:'◦',flutter:'✧',wobble:'♡',skitter:'✧',salute:'✦',wave:'♥',bow:'✧',magic:'✦',chime:'✧'};
export function starterReactionProfile(spec){
 const design=spec.nativeDesign||spec.nativeRig,kind=byDesign[design],profile=PORTRAIT_PROFILES[design];
 if(!kind||!profile)throw new Error('Missing authored greeting: '+design);
 return {kind,duration:profile.duration,glyph:glyphs[kind],gesture:profile.gesture,mood:profile.mood};
}
export function starterReactionPose(spec,progress){
 const {kind}=starterReactionProfile(spec),p=Math.max(0,Math.min(1,progress));
 // Hold only the existing pre-release windup. It raises the held weapon near
 // its shoulder without attacking, swapping hands or introducing a new grip.
 if(kind==='salute'||kind==='bow'){
  const t=Math.min(1,p/.25,(1-p)/.35),greet=t*t*(3-2*t);
  return {state:'attack',phase:(kind==='salute'?.34:.30)*greet,x:0,y:0,roll:0};
 }
 if(kind==='magic')return {state:'cast',phase:p,x:0,y:0,roll:0};
 return {state:'idle',phase:.25,x:0,y:0,roll:0};
}

export function starterReactionRig(spec,progress,height=1){
 const profile=starterReactionProfile(spec),pose=starterReactionPose(spec,progress),p=Math.max(0,Math.min(1,progress)),t=Math.min(1,p/.25,(1-p)/.35),greet=t*t*(3-2*t);
 let rig=nativePoseRig(spec,{id:spec.id},pose.state,pose.phase,height);
 if(profile.kind==='wave'||profile.kind==='salute'&&rig.weapon?.kind==='sword'){
  rig=nativePoseRig(spec,{id:spec.id},'idle',.25,height);
  const side=profile.kind==='wave'?(rig.weapon.hand==='left'?1:-1):(rig.weapon.hand==='left'?-1:1),arm=rig.arms.find(a=>a.side===side),root=arm.root;
  const target=profile.kind==='wave'?{x:root.x+4,y:root.y-8,z:root.z+16}:{x:root.x+4,y:root.y+side*4,z:root.z+9};
  if(profile.kind==='wave')target.y+=Math.sin(p*Math.PI*8)*greet*3;
  const end={x:arm.end.x+(target.x-arm.end.x)*greet,y:arm.end.y+(target.y-arm.end.y)*greet,z:arm.end.z+(target.z-arm.end.z)*greet};
  const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  Object.assign(arm,solveLimb(root,end,length(root,arm.joint),length(arm.joint,arm.end),{x:-.5,y:side,z:-.5}));
  if(profile.kind==='wave')rig.portraitWave={side,weight:greet};
  else{
   rig.portraitGreeting=greet;
   const weapon=rig.weapon,len=length(weapon.grip,weapon.tip),axis={x:-.72,y:side*.55,z:.42},n=Math.hypot(axis.x,axis.y,axis.z),old={x:(weapon.tip.x-weapon.grip.x)/len,y:(weapon.tip.y-weapon.grip.y)/len,z:(weapon.tip.z-weapon.grip.z)/len};
   const blended={x:old.x+(axis.x/n-old.x)*greet,y:old.y+(axis.y/n-old.y)*greet,z:old.z+(axis.z/n-old.z)*greet},norm=Math.hypot(blended.x,blended.y,blended.z);
   weapon.grip={...arm.end};weapon.tip={x:arm.end.x+blended.x/norm*len,y:arm.end.y+blended.y/norm*len,z:arm.end.z+blended.z/norm*len};weapon.axis={x:blended.x/norm,y:blended.y/norm,z:blended.z/norm};weapon.active=false;
  }
 }
 rig.portraitMenu={progress:p};
 if(rig.weapon)rig.weapon.active=false;
 return rig;
}
export function starterReactionPixels(spec,progress,height=1){
 const rig=starterReactionRig(spec,progress,height),pixels=paintCharacterPixels(rig.id,rig,Math.PI/2);
 if(starterReactionProfile(spec).kind!=='owl')return pixels;
 const result=owlHeadTiltPixels(pixels,progress,owlPortraitLandmarks(rig));result.clipped=pixels.clipped;return result;
}

export function owlPortraitLandmarks(rig){
 const {scale,fit}=rig.artSourceTransform,sy=scale.height/.9*fit,sx=scale.width/1.08*fit,head=rig.artAnchors.head;
 return {cx:head.x-scale.width*fit,eyeY:head.y-2.75*sy,neckY:Math.round(head.y+6.25*sy),sx,sy};
}
// Only tilt the painted head. Eyes stay open, and body/feet stay planted.
export function owlHeadTiltPixels(source,progress,landmarks={cx:32,eyeY:20,neckY:29,sx:1,sy:1}){
 const input=new Uint8ClampedArray(source),p=Math.max(0,Math.min(1,progress));
 const {cx:centerX,neckY,sy:scaleY}=landmarks;
 const out=new Uint8ClampedArray(input),angle=Math.sin(p*Math.PI*2)*Math.sin(p*Math.PI)*.11;
 for(let y=0;y<neckY;y++)for(let x=0;x<64;x++){
  const pivotY=neckY-2*scaleY,weight=Math.min(1,(neckY-y)/(6*scaleY)),a=angle*weight,dx=x-centerX,dy=y-pivotY;
  const sx=Math.round(centerX+dx*Math.cos(a)+dy*Math.sin(a)),sy=Math.round(pivotY-dx*Math.sin(a)+dy*Math.cos(a)),i=(y*64+x)*4;
  if(sx>=0&&sx<64&&sy>=0&&sy<neckY)out.set(input.subarray((sy*64+sx)*4,(sy*64+sx)*4+4),i);
  else if(sy<0||sx<0||sx>=64)out.fill(0,i,i+4);
 }
 return out;
}
