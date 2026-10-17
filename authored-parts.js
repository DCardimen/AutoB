import {armRegistration,capePixel} from './companion-anatomy.js';
import {authoredArmArt} from './authored-arm-skin.js';
const key=(x,y)=>y*64+x;
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segment(p,a,z){const dx=z.x-a.x,dy=z.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),q=mix(a,z,t);return {distance:Math.hypot(p.x-q.x,p.y-q.y),t};}
function armMaterial(identity,p){
 const [r,g,b]=p.rgb,range=Math.max(r,g,b)-Math.min(r,g,b);
 if(identity==='knight')return !(r>g*1.65&&g<b*2);
 if(['orc','goblin','minotaur'].includes(identity))return !(r>g*1.5&&r>b*1.4);
 if(['elf','fox'].includes(identity))return !(r>g*1.25&&g>b*1.4&&p.y<32);
 if(['caster','frostelf'].includes(identity))return !(range<60&&Math.min(r,g,b)>110);
 if(identity==='skeleton')return !(b>r*1.05&&b>g*1.1);
 return true;
}
// Generate independent indexed parts once from the registered bind frame.
// No palette is created and no animated pose is used for ownership.
export function authoredParts(asset,identity,stage,dir){
 if(asset.parts)return asset.parts;
 const registration=armRegistration(identity,stage,dir);if(!registration)return null;
 const grid=new Map(asset.pixels.map(p=>[key(p.x,p.y),p])),hands={},profiles=new Map(),mask=new Set();
 for(const side of [-1,1]){
  const socket=registration.hands[side],near=asset.pixels.filter(p=>Math.hypot(p.x-socket.x,p.y-socket.y)<=3).sort((a,b)=>Math.hypot(a.x-socket.x,a.y-socket.y)-Math.hypot(b.x-socket.x,b.y-socket.y));
  const sample=near[0];if(!sample)continue;
  hands[side]={...sample};
  const root=registration.roots[side],end={x:sample.x,y:sample.y},joint=mix(root,end,.5);
  const pixels=asset.pixels.filter(p=>{
   if(p.y<registration.neck+1||side*(p.x-32)<registration.torso*.53)return false;
   if(Math.hypot(p.x-end.x,p.y-end.y)<=registration.lower*.8)return true;
   if(!armMaterial(identity,p))return false;
   const region=segment(p,root,end),radius=registration.upper+(registration.lower-registration.upper)*region.t;
   return region.distance<=radius;
  });
  const profile={side,root,joint,end,pixels,grid:new Map(pixels.map(p=>[key(p.x,p.y),p]))};
  profiles.set(side,profile);for(const p of pixels)mask.add(key(p.x,p.y));
 }
 // The juvenile orc's west-facing far sleeve is only one source column.
 // Keep its reviewed connected ownership; a shoulder capsule would also
 // select the jacket that occludes this arm.
 if(identity==='orc'&&stage===0&&dir===4){
  const far=authoredArmArt(asset,hands).profiles.get(1);
  if(far){profiles.set(1,far);mask.clear();for(const arm of profiles.values())for(const p of arm.pixels)mask.add(key(p.x,p.y));}
 }
 const retained=asset.pixels.filter(p=>!mask.has(key(p.x,p.y))),bodyGrid=new Map(retained.map(p=>[key(p.x,p.y),p])),repairs=[];
 // A complete tapered trunk exists independently of the arms. Extend the
 // same row's jacket/armor texture into the source area covered by a sleeve.
 // This includes genuinely occluded pixels absent from the flattened master.
 for(let y=registration.neck+1;y<=registration.pelvis;y++){
  const t=(y-registration.neck)/(registration.pelvis-registration.neck),half=registration.torso*(t<.25?.75+t:.99-(t-.25)*.23);
  const row=retained.filter(p=>p.y===y&&Math.abs(p.x-32)<=registration.torso*.55);if(!row.length)continue;
  for(let x=Math.ceil(32-half);x<=Math.floor(32+half);x++){
   if(bodyGrid.has(key(x,y)))continue;
   if(identity==='skeleton'&&!mask.has(key(x,y)))continue; // authored rib gaps stay hollow
   const side=Math.sign(x-32)||1,candidates=row.filter(p=>side*(p.x-32)>=0).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)),sample=candidates[0]||row[0];
   const pixel={...sample,x,y,bodyUnderlay:true};bodyGrid.set(key(x,y),pixel);repairs.push(pixel);
  }
 }
 const body=[...retained,...repairs],head=body.filter(p=>p.y<=registration.neck),torso=body.filter(p=>p.y>registration.neck&&p.y<=registration.pelvis),legs=body.filter(p=>p.y>registration.pelvis);
 const cape=body.filter(p=>capePixel(identity,p,registration)),capeMask=new Set(cape.map(p=>key(p.x,p.y)));
 return asset.parts={registration,hands,arms:{profiles,mask},body,head,torso,legs,cape,capeMask,repairs};
}

export function connectAuthoredArm(profile,root,goal,preferredJoint,scale){
 const upper=Math.hypot(profile.joint.x-profile.root.x,profile.joint.y-profile.root.y)*scale,lower=Math.hypot(profile.end.x-profile.joint.x,profile.end.y-profile.joint.y)*scale;
 const dx=goal.x-root.x,dy=goal.y-root.y,distance=Math.hypot(dx,dy)||.001,d=Math.min(distance,(upper+lower)*.999),axis={x:dx/distance,y:dy/distance},end={x:root.x+axis.x*d,y:root.y+axis.y*d};
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along)),base={x:root.x+axis.x*along,y:root.y+axis.y*along};
 const side=(preferredJoint.x-base.x)*-axis.y+(preferredJoint.y-base.y)*axis.x>=0?1:-1,joint={x:base.x-axis.y*height*side,y:base.y+axis.x*height*side};
 return {root,joint,end};
}
