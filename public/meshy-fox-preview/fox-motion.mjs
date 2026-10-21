export const CLIPS={idle:{name:'Idle',duration:8,loop:true},walk:{name:'Walk',duration:1,loop:true},run:{name:'Run',duration:.64,loop:true},attack:{name:'Bow_Attack',duration:2.2,loop:true},dodgeLeft:{name:'Dodge_Left',duration:1.25,loop:false},dodgeRight:{name:'Dodge_Right',duration:1.25,loop:false},dash:{name:'Dash_Forward',duration:.85,loop:false},shootForward:{name:'Shoot_Forward',duration:2.2,loop:true},shootBackward:{name:'Shoot_Backward',duration:2.2,loop:true},shootLeft:{name:'Shoot_Strafe_Left',duration:2.2,loop:true},shootRight:{name:'Shoot_Strafe_Right',duration:2.2,loop:true},hit:{name:'Hit_Reaction',duration:1.2,loop:false},death:{name:'Fall_and_Death',duration:2.4,loop:false},turnLeft45:{name:'Turn_Left_45',duration:.62,loop:false,turn:Math.PI/4},turnRight45:{name:'Turn_Right_45',duration:.62,loop:false,turn:-Math.PI/4},turnLeft90:{name:'Turn_Left_90',duration:.95,loop:false,turn:Math.PI/2},turnRight90:{name:'Turn_Right_90',duration:.95,loop:false,turn:-Math.PI/2},dashBack:{name:'Dash_Back',duration:.85,loop:false}};
// Bow-space string geometry: the nock sits at brace height and reaches a real
// anchor at full draw; the limb tips flex toward the archer by `flex`.
export const BOW={brace:.10,fullDraw:.23,flex:.030,nockY:.025};
export const nockOffset=draw=>BOW.brace+(BOW.fullDraw-BOW.brace)*draw;
// Model-space aim line; +Z is the target direction. It runs under the left
// eye, so the fox sights down the arrow, and clear of the hood collar. The
// bake fits the grip's depth to a near-locked bow arm; set-up is an offset
// from that grip. The cant tips the upper limb away from the cheek.
export const AIM={grip:[.22,.74,.50],setup:[0,-.03,-.03],cant:.50};
// Four diagonal shooting gaits complete eight travel directions, which the
// runtime blends by the travel direction relative to the facing.
Object.assign(CLIPS,{shootForwardLeft:{name:'Shoot_Forward_Left',duration:2.2,loop:true},shootForwardRight:{name:'Shoot_Forward_Right',duration:2.2,loop:true},shootBackwardLeft:{name:'Shoot_Backward_Left',duration:2.2,loop:true},shootBackwardRight:{name:'Shoot_Backward_Right',duration:2.2,loop:true},
 quickTurnLeft:{name:'Quick_Turn_Left_180',duration:.75,loop:false,turn:Math.PI,quick:true},quickTurnRight:{name:'Quick_Turn_Right_180',duration:.75,loop:false,turn:-Math.PI,quick:true},runStop:{name:'Run_Stop',duration:.75,loop:false,stop:true}});
// Model-space travel direction of each moving shot (yaw from +Z; +X is the fox's left).
for(const [mode,travel]of Object.entries({shootForward:0,shootForwardRight:Math.PI/4,shootRight:Math.PI/2,shootBackwardRight:3*Math.PI/4,shootBackward:Math.PI,shootBackwardLeft:-3*Math.PI/4,shootLeft:-Math.PI/2,shootForwardLeft:-Math.PI/4}))CLIPS[mode].travel=travel;
// The paw stepped toward the target in the archer's stance.
export const STANCE={front:'L'};
export const isTurn=mode=>!!CLIPS[mode]?.turn;
// Clips that start and end on Idle's first frame.
export const settlesToIdle=mode=>isTurn(mode)||!!CLIPS[mode]?.stop;
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
export function blinkAt(t,mode){const d=CLIPS[mode].duration,phase=((t%d)+d)%d,center=mode==='idle'?2.75:mode==='walk'?.78:mode==='run'?.52:mode==='attack'?1.9:mode==='hit'?.18:mode==='death'?1.1:isTurn(mode)?.16:.42;if(mode==='death')return smooth(.8,1.15,t);return smooth(center-.085,center,phase)*(1-smooth(center+.025,center+.12,phase));}
export function attackAt(t){
 const aim=smooth(.45,1.02,t),recover=smooth(1.43,2.12,t),nock=smooth(.12,.34,t),release=smooth(1.18,1.215,t);
 // Stance winds up before the bow rises and unwinds after it lowers. Hold is
 // the back-tension creep at anchor; follow is the release follow-through.
 const stance=smooth(.06,.42,t)*(1-smooth(1.62,2.12,t)),hold=smooth(1.02,1.18,t)*(1-release),follow=smooth(1.18,1.30,t)*(1-smooth(1.42,1.95,t));
 return {aim:aim*(1-recover),nock:nock*(1-recover),draw:aim*(1-release),release,releaseAge:t-1.18,engaged:t>=.2&&t<1.18,stance,hold,follow,stage:t<.2?'Ready':t<.45?'Nock':t<1.02?'Draw':t<1.18?'Aim':t<1.32?'Release':t<1.7?'Follow-through':'Recover'};
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

export const isShooting=mode=>mode==='attack'||mode.startsWith('shoot');
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

// The uploaded tail curls toward +X. Rotate its root through the rear arc to
// produce a real left/right sweep, rather than only bobbing that sideways tip.
// Under the occasional swish runs a constant, layered sway that travels down
// the tail with a lag; its periods divide the 8 s idle loop.
export const tailSway=(time,index=0)=>.30*Math.sin(2*Math.PI*time/4-index*.45)+.11*Math.sin(2*Math.PI*time/1.6+1.3-index*.6)+.06*Math.sin(2*Math.PI*time/(8/3)+.7-index*.35);
export const tailSwishAngle=(time,index=0)=>(index===0?1.25:.032)*tailSwish(time,index)+tailSway(time,index)*(index===0?1:.40);
