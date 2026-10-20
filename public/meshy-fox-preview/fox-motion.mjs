export const CLIPS={idle:{name:'Idle',duration:4,loop:true},walk:{name:'Walk',duration:1,loop:true},run:{name:'Run',duration:.64,loop:true},attack:{name:'Bow_Attack',duration:2.2,loop:true},dodgeLeft:{name:'Dodge_Left',duration:1.25,loop:false},dodgeRight:{name:'Dodge_Right',duration:1.25,loop:false},hit:{name:'Hit_Reaction',duration:1.2,loop:false},death:{name:'Fall_and_Death',duration:2.4,loop:false}};
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
export function blinkAt(t,mode){const d=CLIPS[mode].duration,phase=((t%d)+d)%d,center=mode==='idle'?2.75:mode==='walk'?.78:mode==='run'?.52:mode==='attack'?1.9:mode==='hit'?.18:mode==='death'?1.1:.42;if(mode==='death')return smooth(.8,1.15,t);return smooth(center-.085,center,phase)*(1-smooth(center+.025,center+.12,phase));}
export function attackAt(t){
 const aim=smooth(.45,1.02,t),recover=smooth(1.43,2.12,t),nock=smooth(.12,.34,t),release=smooth(1.18,1.215,t);
 return {aim:aim*(1-recover),nock:nock*(1-recover),draw:aim*(1-release),release,releaseAge:t-1.18,engaged:t>=.2&&t<1.18,stage:t<.2?'Ready':t<.45?'Nock':t<1.02?'Draw':t<1.18?'Aim':t<1.32?'Release':t<1.7?'Follow-through':'Recover'};
}
export function footCycle(mode,t,side){
 const duration=CLIPS[mode].duration,p=((t/duration+(side==='R'?0:.5))%1+1)%1,support=mode==='walk'?.64:.58,stride=mode==='walk'?.055:.095,lift=mode==='walk'?.025:.052;
 if(p<support)return {z:lerp(stride,-stride,p/support),y:0,support:true,p};
 const u=(p-support)/(1-support);return {z:lerp(-stride,stride,smooth(0,1,u)),y:lift*Math.sin(Math.PI*u),support:false,p};
}
