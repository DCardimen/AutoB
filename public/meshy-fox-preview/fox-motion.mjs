export const CLIPS={idle:{name:'Idle',duration:8,loop:true},walk:{name:'Walk',duration:1,loop:true},run:{name:'Run',duration:.72,loop:true},attack:{name:'Bow_Attack',duration:2.2,loop:true},dodgeLeft:{name:'Dodge_Left',duration:1.25,loop:false},dodgeRight:{name:'Dodge_Right',duration:1.25,loop:false},dash:{name:'Dash_Forward',duration:.85,loop:false},shootForward:{name:'Shoot_Forward',duration:2.2,loop:true},shootBackward:{name:'Shoot_Backward',duration:2.2,loop:true},shootLeft:{name:'Shoot_Strafe_Left',duration:2.2,loop:true},shootRight:{name:'Shoot_Strafe_Right',duration:2.2,loop:true},hit:{name:'Hit_Reaction',duration:1.2,loop:false},death:{name:'Fall_and_Death',duration:2.4,loop:false}};
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
export function blinkAt(t,mode){const d=CLIPS[mode].duration,phase=((t%d)+d)%d,center=mode==='idle'?2.75:mode==='walk'?.78:mode==='run'?.52:mode==='attack'?1.9:mode==='hit'?.18:mode==='death'?1.1:.42;if(mode==='death')return smooth(.8,1.15,t);return smooth(center-.085,center,phase)*(1-smooth(center+.025,center+.12,phase));}
export function attackAt(t){
 const aim=smooth(.45,1.02,t),recover=smooth(1.43,2.12,t),nock=smooth(.12,.34,t),release=smooth(1.18,1.215,t);
 return {aim:aim*(1-recover),nock:nock*(1-recover),draw:aim*(1-release),release,releaseAge:t-1.18,engaged:t>=.2&&t<1.18,stage:t<.2?'Ready':t<.45?'Nock':t<1.02?'Draw':t<1.18?'Aim':t<1.32?'Release':t<1.7?'Follow-through':'Recover'};
}
export function footCycle(mode,t,side){
 const duration=CLIPS[mode].duration,p=((t/duration+(side==='R'?0:.5))%1+1)%1,support=mode==='walk'?.64:.58,stride=mode==='walk'?.055:.065,lift=mode==='walk'?.025:.058;
 if(p<support)return {z:lerp(stride,-stride,p/support),y:0,support:true,p};
 const u=(p-support)/(1-support);return {z:lerp(-stride,stride,smooth(0,1,u)),y:lift*Math.sin(Math.PI*u),support:false,p};
}

export const isShooting=mode=>mode==='attack'||mode.startsWith('shoot');
// Each deterministic interval lies in [6,10] seconds; the swish returns to rest.
export function tailSwish(time,index=0){
 let start=0,cycle=0,duration=8;
 while(time>=start+duration){start+=duration;cycle++;duration=6+((cycle*37)%41)/10;}
 const local=time-start-index*.075,begin=duration-2.5;
 if(local<begin||local>=duration-.6)return 0;
 const u=(local-begin)/1.9;
 return Math.sin(u*Math.PI)**2;
}

// In-place gait velocity: cancels the planted foot's local stance travel.
CLIPS.walk.velocity=[0,0,.11/.64];
CLIPS.run.velocity=[0,0,.13/(.58*.72)];
const shootingSpeed=.13/(.58*(2.2/3));
CLIPS.shootForward.velocity=[0,0,shootingSpeed];
CLIPS.shootBackward.velocity=[0,0,-shootingSpeed];
CLIPS.shootLeft.velocity=[-shootingSpeed,0,0];
CLIPS.shootRight.velocity=[shootingSpeed,0,0];

// The uploaded tail curls toward +X. Rotate its root through the rear arc to
// produce a real left/right sweep, rather than only bobbing that sideways tip.
export const tailSwishAngle=(time,index=0)=>(index===0?1.8:.025)*tailSwish(time,index);
