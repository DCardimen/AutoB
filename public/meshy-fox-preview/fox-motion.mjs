// Archer v2 motion timing, shared by the bake, the runtime actor and the tests.
export const CLIPS={idle:{name:'Idle',duration:8,loop:true},walk:{name:'Walk',duration:1,loop:true},run:{name:'Run',duration:.64,loop:true},attack:{name:'Bow_Attack',duration:2.2,loop:true,bow:'canted'},dodgeLeft:{name:'Dodge_Left',duration:.80,loop:false},dodgeRight:{name:'Dodge_Right',duration:.80,loop:false},dash:{name:'Dash_Forward',duration:.70,loop:false},shootForward:{name:'Shoot_Forward',duration:2.2,loop:true},shootBackward:{name:'Shoot_Backward',duration:2.2,loop:true},shootLeft:{name:'Shoot_Strafe_Left',duration:2.2,loop:true},shootRight:{name:'Shoot_Strafe_Right',duration:2.2,loop:true},hit:{name:'Hit_Reaction',duration:1.0,loop:false},death:{name:'Fall_and_Death',duration:2.4,loop:false},turnLeft45:{name:'Turn_Left_45',duration:.42,loop:false,turn:Math.PI/4},turnRight45:{name:'Turn_Right_45',duration:.42,loop:false,turn:-Math.PI/4},turnLeft90:{name:'Turn_Left_90',duration:.60,loop:false,turn:Math.PI/2},turnRight90:{name:'Turn_Right_90',duration:.60,loop:false,turn:-Math.PI/2},dashBack:{name:'Dash_Back',duration:.66,loop:false}};
// Bow-space string geometry: the nock sits at brace height and reaches a real
// anchor at full draw; the limb tips flex toward the archer by `flex`.
export const BOW={brace:.10,fullDraw:.23,flex:.030,nockY:.025};
export const nockOffset=draw=>BOW.brace+(BOW.fullDraw-BOW.brace)*draw;
// The loose arrow, nock at its origin and the head along -X.
export const ARROW={length:.405,tip:-.38};
// Model-space aim line; +Z is the target direction. It runs under the left
// eye, so the fox sights down the arrow, and clear of the hood collar. The
// bake fits the grip's depth to a near-locked bow arm; set-up is an offset
// from that grip. The cant tips the upper limb away from the cheek.
export const AIM={grip:[.22,.74,.50],setup:[0,-.03,-.07],cant:.50};
// Bow angles for the standing shot. Every variant shares the between-shot
// ready pose (cant READY_CANT), so a change of angle at a loop boundary is
// seamless; the bow rolls to its own cant while it is raised.
export const BOW_ANGLES={upright:.08,canted:.50,tilted:.68},READY_CANT=.30;
// Back quiver, rest coordinates. It lies diagonally across the back with the
// mouth behind the draw (left) shoulder; the exposed nocks sit `stickOut`
// above the mouth along `axis`, so a pull of length-stickOut clears the head.
export const QUIVER={mouth:[.160,.737,-.214],axis:[.78,.62,.09],length:.205,radius:.040,stickOut:.20};
// v2 dodge and dash travel (model units), covered in a front-loaded burst.
export const DODGE=.42,DASH={dash:.65,dashBack:-.50};
// The paw stepped toward the target in the archer's stance.
export const STANCE={front:'L'};
// The loose: every shot releases at this moment of its 2.2 s cycle.
export const RELEASE=1.25;
// The arrow sits on the string from NOCK until the loose.
export const NOCK=.82;
// Four diagonal shooting gaits complete eight travel directions, which the
// runtime blends by the travel direction relative to the facing.
Object.assign(CLIPS,{shootForwardLeft:{name:'Shoot_Forward_Left',duration:2.2,loop:true},shootForwardRight:{name:'Shoot_Forward_Right',duration:2.2,loop:true},shootBackwardLeft:{name:'Shoot_Backward_Left',duration:2.2,loop:true},shootBackwardRight:{name:'Shoot_Backward_Right',duration:2.2,loop:true},
 quickTurnLeft:{name:'Quick_Turn_Left_180',duration:.62,loop:false,turn:Math.PI,quick:true},quickTurnRight:{name:'Quick_Turn_Right_180',duration:.62,loop:false,turn:-Math.PI,quick:true},runStop:{name:'Run_Stop',duration:.62,loop:false,stop:true},
 // v2: the standing shot is entered and left through its own clips, so the
 // split stance holds through any number of shots in between.
 attackEnter:{name:'Bow_Attack_Enter',duration:.50,loop:false,enter:true},attackExit:{name:'Bow_Attack_Exit',duration:.55,loop:false,exit:true},
 attackUpright:{name:'Bow_Attack_Upright',duration:2.2,loop:true,bow:'upright'},attackTilted:{name:'Bow_Attack_Tilted',duration:2.2,loop:true,bow:'tilted'},
 // v2: braking out of a run straight into a pivot, ending on Idle turned.
 runStopTurnLeft:{name:'Run_Stop_Turn_Left_180',duration:.90,loop:false,stop:true,turn:Math.PI},runStopTurnRight:{name:'Run_Stop_Turn_Right_180',duration:.90,loop:false,stop:true,turn:-Math.PI},
 runStopTurnLeft90:{name:'Run_Stop_Turn_Left_90',duration:.72,loop:false,stop:true,turn:Math.PI/2},runStopTurnRight90:{name:'Run_Stop_Turn_Right_90',duration:.72,loop:false,stop:true,turn:-Math.PI/2},
 // Toward the agile archer: a shot from a crouch (paws planted, knees bent),
 // two arrows nocked and loosed together, and a quick duck under a swing.
 attackCrouched:{name:'Bow_Attack_Crouched',duration:2.2,loop:true,bow:'canted',crouch:.075},attackDouble:{name:'Bow_Attack_Double',duration:2.2,loop:true,bow:'canted',double:true},
 duck:{name:'Duck',duration:.70,loop:false,settle:true}});
// Model-space travel direction of each moving shot (yaw from +Z; +X is the fox's left).
for(const [mode,travel]of Object.entries({shootForward:0,shootForwardRight:Math.PI/4,shootRight:Math.PI/2,shootBackwardRight:3*Math.PI/4,shootBackward:Math.PI,shootBackwardLeft:-3*Math.PI/4,shootLeft:-Math.PI/2,shootForwardLeft:-Math.PI/4}))CLIPS[mode].travel=travel;
Object.assign(CLIPS,{
 jumpShot:{name:'Jump_Shot',duration:2.2,loop:true,bow:'tilted',acro:'jump',double:true},
 slideShot:{name:'Slide_Shot',duration:2.2,loop:false,bow:'sideways',acro:'slide',crouch:.09,double:true},
 crouchVolley:{name:'Crouch_Volley',duration:2.2,loop:true,bow:'sideways',crouch:.095,double:true,triple:true},
 sideFlipLeft:{name:'Side_Flip_Left',duration:.95,loop:false,acro:'flip',flip:-1,settle:true},
 sideFlipRight:{name:'Side_Flip_Right',duration:.95,loop:false,acro:'flip',flip:1,settle:true},
 vault:{name:'Forward_Vault',duration:1.05,loop:false,acro:'vault',settle:true}
});
BOW_ANGLES.sideways=1.32;
export const ATTACKS=['attack','attackUpright','attackTilted','attackCrouched','attackDouble','crouchVolley'];
export const ACROBATIC_SHOTS=['jumpShot','slideShot'];
// The bow-angle loops share one ready pose; the crouched loop holds lower.
export const BOW_LOOPS=['attack','attackUpright','attackTilted','attackDouble'];
export const isAttackLoop=mode=>ATTACKS.includes(mode)||ACROBATIC_SHOTS.includes(mode);
export const isTurn=mode=>!!CLIPS[mode]?.turn;
// Clips that start and end on Idle's first frame (a turn ends on it rotated).
export const settlesToIdle=mode=>isTurn(mode)||!!CLIPS[mode]?.stop||!!CLIPS[mode]?.exit||!!CLIPS[mode]?.settle;
export const isRunStop=mode=>!!CLIPS[mode]?.stop;
// v2 eases are quintic (smootherstep): zero velocity and acceleration at both
// ends, so every hand-over starts and settles without a jolt.
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*t*(t*(t*6-15)+10)};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
// Underdamped step response: 0 before `age` 0, a quick fall that overshoots
// about a third and settles. Used for the bow's drop after the loose.
export function spring(age,frequency=3.1,damping=.36){if(age<=0)return 0;const w=2*Math.PI*frequency,d=w*Math.sqrt(1-damping*damping);return 1-Math.exp(-damping*w*age)*(Math.cos(d*age)+damping/Math.sqrt(1-damping*damping)*Math.sin(d*age));}

// A quick, small blink: about 60 ms to close, a two-frame hold and 100 ms to
// open, centred on `centre`.
export function blinkPulse(t,centre){return smooth(centre-.06,centre,t)*(1-smooth(centre+.03,centre+.13,t));}
// Ambient blinks at irregular 2.6-5.4 s intervals, with an occasional double.
const BLINKS=[];{let at=1.4;for(let i=0;i<4000;i++){BLINKS.push(at);if(i%4===2)BLINKS.push(at+.26);at+=2.6+((i*53)%29)/10;}}
const BLINK_SPAN=BLINKS.at(-1)+3;
export function blinkSchedule(time){
 const t=((time%BLINK_SPAN)+BLINK_SPAN)%BLINK_SPAN;let lo=0,hi=BLINKS.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(BLINKS[mid]<t-.2)lo=mid+1;else hi=mid;}
 let value=0;for(let i=lo;i<Math.min(BLINKS.length,lo+3);i++)value=Math.max(value,blinkPulse(t,BLINKS[i]));return value;
}
// Blinks baked into each portable clip (the runtime uses the ambient clock).
export function blinkAt(t,mode){
 const d=CLIPS[mode].duration,loop=CLIPS[mode].loop,phase=loop?((t%d)+d)%d:t;if(mode==='death')return smooth(.8,1.15,t);
 // A looping clip's pulses wrap around its seam.
 const pulse=centre=>loop?Math.max(blinkPulse(phase,centre),blinkPulse(phase+d,centre),blinkPulse(phase-d,centre)):blinkPulse(phase,centre);
 if(mode==='idle')return Math.max(pulse(2.75),pulse(6.3),pulse(6.56));
 const centre=mode==='walk'?.78:mode==='run'?.40:isAttackLoop(mode)||mode.startsWith('shoot')?1.85:mode==='hit'?.10:isTurn(mode)?.12:null;return centre===null?0:pulse(centre);
}
// Aggression on the face while shooting: brows drawn down, lids narrowed and
// ears pinned back.
export function angerAt(mode,t){if(isAttackLoop(mode)||mode.startsWith('shoot'))return 1;if(mode==='attackEnter')return smooth(0,.30,t);if(mode==='attackExit')return 1-smooth(.05,.45,t);return 0;}

// The standing shot cycle. The draw paw reaches over the left shoulder to the
// quiver, pulls an arrow up and out, carries it forward and nocks it while
// the bow rises; then the push-pull draw, the hold, the loose at RELEASE, a
// sprung bow drop, and the recovery to the ready pose that opens the cycle.
export function attackAt(t){
 const R=RELEASE,release=smooth(R,R+.022,t),reach=smooth(.02,.28,t),pull=smooth(.32,.46,t),carry=smooth(.46,.74,t),nockIn=smooth(.74,NOCK,t),raise=smooth(.28,.74,t),recover=smooth(1.62,2.08,t);
 // The push-pull extension, released again by the recovery, so the cycle seals.
 const aim=smooth(NOCK,1.12,t)*(1-recover);
 const hold=smooth(1.12,R,t)*(1-release),follow=smooth(R,R+.12,t)*(1-smooth(R+.22,R+.62,t)),drop=spring(t-R)*(1-recover);
 return {aim,raise,reach,pull,carry,nockIn,recover,draw:aim*(1-release),release,releaseAge:t-R,hold,follow,drop,stance:1,engaged:t>=.28&&t<R,
  // The arrow is in the paw from the grab until it is nocked, then on the string.
  inHand:t>=.28&&t<NOCK,nocked:t>=NOCK&&t<R,
  stage:t<.28?'Reach':t<.46?'Draw arrow':t<NOCK?'Nock':t<1.12?'Draw':t<R?'Aim':t<R+.14?'Release':t<1.62?'Bow drop':'Recover'};
}
// Walking keeps a long stance; running has a flight phase (each paw down 38%
// of the cycle), a longer stride and a high knee lift that clears the ground
// quickly, so both paws are visibly up in flight.
export const GAIT={walk:{support:.64,stride:.055,lift:.025},run:{support:.38,stride:.085,lift:.075}};
export function footCycle(mode,t,side){
 const duration=CLIPS[mode].duration,p=((t/duration+(side==='R'?0:.5))%1+1)%1,{support,stride,lift}=GAIT[mode];
 if(p<support)return {z:lerp(stride,-stride,p/support),y:0,support:true,p};
 const u=(p-support)/(1-support),s5=u*u*u*(10+u*(-15+6*u)),tangent=-2*stride*(1-support)/support;
 return {z:-stride+tangent*u+(2*stride-tangent)*s5,y:mode==='run'?lift*Math.sin(Math.PI*u)**2:lift*64*u**3*(1-u)**3,support:false,p};
}

export const isShooting=mode=>isAttackLoop(mode)||mode.startsWith('shoot');
// Each deterministic interval lies in [6,10] seconds; the swish returns to rest.
export function tailSwish(time,index=0){
 let start=0,cycle=0,duration=8;
 while(time>=start+duration){start+=duration;cycle++;duration=6+((cycle*37)%41)/10;}
 const local=time-start-index*.075,begin=duration-3.2;
 if(local<begin||local>=duration-.5)return 0;
 const u=(local-begin)/2.7;
 return Math.sin(u*Math.PI)**2;
}

// In-place gait velocity: cancels the planted foot's local stance travel.
for(const mode of ['walk','run']){const {support,stride}=GAIT[mode];CLIPS[mode].velocity=[0,0,2*stride/(support*CLIPS[mode].duration)];}
// Shooting while moving creeps on a planted walking stride, two per draw
// cycle, at about half the running speed so the aim stays steady.
const shootingSpeed=.11/(.64*1.1);
for(const info of Object.values(CLIPS))if(info.travel!==undefined)info.velocity=[shootingSpeed*Math.sin(info.travel),0,shootingSpeed*Math.cos(info.travel)];

// v2 tail: the root bone keeps the authored junction with the belt and hem
// (rotating it sheared that seam through the tunic). The tail is carried
// straight out behind by bending the bones past the junction, and every sway
// lives on those bones too.
export const TAIL_REST=[[0,0],[.05,.64],[.05,.54],[-.02,.44],[-.04,.22],[0,.06]];
// Lateral sway down the tail with a lag; its periods divide the 8 s idle loop.
export const tailSway=(time,index=0)=>index?(.20*Math.sin(2*Math.PI*time/4-index*.45)+.07*Math.sin(2*Math.PI*time/1.6+1.3-index*.6)+.04*Math.sin(2*Math.PI*time/(8/3)+.7-index*.35))*(index===1?1:.40):0;
export const tailSwishAngle=(time,index=0)=>index?(index===1?.55:.10)*tailSwish(time,index)+tailSway(time,index):0;
