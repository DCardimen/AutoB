const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
// Saved art-space envelopes contain the painted deltoid/pauldron. A shared
// continuous field bends cloth, armor and the independent backing together.
// It never extracts a new limb or invents a shoulder from the physics proxy.
export function shoulderInfluence(s,x,y){
 const [l,r,t,b]=s.bounds,fade=s.fade??2;
 let w=smooth((x-l)/fade)*smooth((r-x)/fade)*smooth((y-t)/fade)*smooth((b-y)/fade);
 if(s.protect){const [pl,pr,pt,pb]=s.protect,dx=Math.max(pl-x,0,x-pr),dy=Math.max(pt-y,0,y-pb);w*=smooth(Math.hypot(dx,dy)/2);}
 return w;
}
export function meleeShoulderSkin(parts,rig,unanchor){
 const motions=[];
 if(rig.state==='idle'||rig.ragdoll||rig.suppressShoulders)return {motions,project:p=>p};
 for(const arm of rig.arms){
  const side=rig.artArmScreens[arm.side],profile=parts.arms.profiles.get(side),s=profile?.shoulder;
  if(!s||profile.occluded)continue;
  // Two legal elbow branches can share the same wrist. Drive the shoulder
  // from that stable reach, not an elbow angle which can flip or wrap at pi.
  // Lateral reach rolls the cap; shortening/lifting the reach raises it.
  // Both terms are continuous even when a folded wrist crosses the socket.
  const origin=unanchor(rig.artArmRoots[arm.side]),wrist=unanchor(rig.artLimbPoints.get(arm.end)),[rx,ry]=s.rest;
  const vx=wrist.x-origin.x,vy=wrist.y-origin.y,length2=rx*rx+ry*ry;
  const deflection=(rx*vy-ry*vx)/length2+side*.5*((rx*vx+ry*vy)/length2-1);
  const theta=.8*s.follow*Math.tanh(deflection);
  motions.push({side,source:s,origin,theta,cos:Math.cos(theta),sin:Math.sin(theta)});
 }
 return {motions,project(p,x,y){
  let dx=0,dy=0,total=0;
  for(const m of motions){const weight=shoulderInfluence(m.source,x,y);if(!weight)continue;const u=p.x-m.origin.x,v=p.y-m.origin.y;dx+=(u*m.cos-v*m.sin-u)*weight;dy+=(u*m.sin+v*m.cos-v)*weight;total+=weight;}
  if(total>1){dx/=total;dy/=total;}
  const limit=parts.shoulderLimit??2.5,length=Math.hypot(dx,dy),bound=length?limit*Math.tanh(length/limit)/length:1;
  return {x:p.x+dx*bound,y:p.y+dy*bound};
 }};
}
