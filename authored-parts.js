import {armRegistration,capePixel} from './companion-anatomy.js';
const key=(x,y)=>y*64+x;
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segment(p,a,z){const dx=z.x-a.x,dy=z.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),q=mix(a,z,t);return {distance:Math.hypot(p.x-q.x,p.y-q.y),t};}
function armMaterial(identity,p){
 const [r,g,b]=p.rgb,range=Math.max(r,g,b)-Math.min(r,g,b);
 if(identity==='knight')return !(r>g*1.65&&g<b*2);
 if(['orc','goblin'].includes(identity))return !(r>g*1.5&&r>b*1.4);
 // Minotaur fur is warm brown, not a red cloak. Its gold/ochre midtones
 // have distinct green over blue; retain those painted upper-arm pixels.
 if(identity==='minotaur')return !(r>g*1.5&&g<b*1.25);
 if(identity==='elf')return !(r>g*1.25&&g>b*1.4&&r>135);
 if(identity==='fox')return !(r>g*1.55&&g>b*1.5&&r>140);
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
  const candidates=asset.pixels.filter(p=>{
   if(p.y<root.y-1||p.y>end.y+registration.lower)return false;
   if(Math.hypot(p.x-end.x,p.y-end.y)<=registration.lower)return true;
   if(side*(p.x-32)<registration.torso*.25)return false;
   if(!armMaterial(identity,p))return false;
   const region=segment(p,root,end),radius=registration.upper+(registration.lower-registration.upper)*region.t;
   return region.distance<=radius+.6;
  });
  // Ownership includes the source outline and enclosed cuff shading. Color
  // tests alone left dark sleeve fragments in the torso, visible on a swing.
  const selected=new Map(candidates.map(p=>[key(p.x,p.y),p]));
  for(const p of candidates)for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
   const q=grid.get(key(p.x+dx,p.y+dy));if(!q||q.y<root.y-1||q.y>end.y+registration.lower||side*(q.x-32)<registration.torso*.25)continue;
   const region=segment(q,root,end),radius=registration.upper+(registration.lower-registration.upper)*region.t;
   if(region.distance<=radius+.8&&Math.max(...q.rgb)<100)selected.set(key(q.x,q.y),q);
  }
  const pixels=[...selected.values()];
  // The socket itself must be painted and touch the retained torso. The
  // nominal source shoulder can lie in transparent space in profile views.
  const contacts=pixels.filter(p=>p.y<=root.y+1&&[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>{const q=grid.get(key(p.x+dx,p.y+dy));return q&&!selected.has(key(q.x,q.y))&&Math.abs(q.x-32)<=Math.abs(p.x-32);}));
  // The articulation is the INNER cuff edge, where it joins the trunk,
  // rather than the outer silhouette beside the hand. An outer-edge pivot
  // incorrectly shortens a foreshortened arm and makes two-hand IK infeasible.
  contacts.sort((a,b)=>Math.abs(a.x-32)-Math.abs(b.x-32)||Math.abs(a.y-root.y)-Math.abs(b.y-root.y));
  const cuff=contacts[0]||pixels.reduce((a,b)=>Math.hypot(a.x-root.x,a.y-root.y)<Math.hypot(b.x-root.x,b.y-root.y)?a:b);
  // Pivot one source sample inside the jacket, on the BODY side of that
  // seam. The visible cuff is the surface of the shoulder, not its joint.
  // This retains the foreshortened upper arm under its original occluder.
  const inside=[[-side,0],[0,-1],[0,1]].map(([dx,dy])=>grid.get(key(cuff.x+dx,cuff.y+dy))).find(p=>p&&!selected.has(key(p.x,p.y))&&Math.abs(p.x-32)<=Math.abs(cuff.x-32)),attached={x:inside?.x??cuff.x,y:inside?.y??cuff.y};
  const profile={side,root:attached,joint:mix(attached,end,.5),end,pixels,grid:new Map(pixels.map(p=>[key(p.x,p.y),p]))};
  profiles.set(side,profile);for(const p of pixels)mask.add(key(p.x,p.y));
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
 const dx=goal.x-root.x,dy=goal.y-root.y,distance=Math.hypot(dx,dy)||.001,d=Math.min(distance,upper+lower),axis={x:dx/distance,y:dy/distance},end={x:root.x+axis.x*d,y:root.y+axis.y*d};
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along)),base={x:root.x+axis.x*along,y:root.y+axis.y*along};
 // Keep the elbow on its authored bend branch. Selecting a branch from a
 // crossing animated elbow snapped the whole sleeve to the other side.
 const side=-profile.side,joint={x:base.x-axis.y*height*side,y:base.y+axis.x*height*side};
 return {root,joint,end};
}

export function constrainHeldGrip(goal,constraints,bounds){
 // The nearest feasible point lies on one boundary, or at an intersection
 // of two boundaries. Solve those explicitly: alternating projections can
 // leave an arm stretched at nearly tangent reach circles even after many
 // iterations, which becomes visible as an elbow pop in the next frame.
 const candidates=[{...goal}],valid=p=>constraints.every(c=>Math.hypot(p.x-c.center.x,p.y-c.center.y)<=c.radius+1e-9)&&(!bounds||p.x>=bounds.minX-1e-9&&p.x<=bounds.maxX+1e-9&&p.y>=bounds.minY-1e-9&&p.y<=bounds.maxY+1e-9);
 for(const c of constraints){const dx=goal.x-c.center.x,dy=goal.y-c.center.y,d=Math.hypot(dx,dy)||1;candidates.push({x:c.center.x+dx/d*c.radius,y:c.center.y+dy/d*c.radius});}
 for(let i=0;i<constraints.length;i++)for(let j=i+1;j<constraints.length;j++){
  const a=constraints[i],b=constraints[j],dx=b.center.x-a.center.x,dy=b.center.y-a.center.y,d=Math.hypot(dx,dy);if(!d||d>a.radius+b.radius||d<Math.abs(a.radius-b.radius))continue;
  const along=(a.radius*a.radius-b.radius*b.radius+d*d)/(2*d),height=Math.sqrt(Math.max(0,a.radius*a.radius-along*along)),x=a.center.x+dx/d*along,y=a.center.y+dy/d*along;
  for(const sign of [-1,1])candidates.push({x:x-dy/d*height*sign,y:y+dx/d*height*sign});
 }
 if(bounds){
  candidates.push({x:clamp(goal.x,bounds.minX,bounds.maxX),y:clamp(goal.y,bounds.minY,bounds.maxY)});
  for(const x of [bounds.minX,bounds.maxX])for(const y of [bounds.minY,bounds.maxY])candidates.push({x,y});
  for(const c of constraints){
   for(const x of [bounds.minX,bounds.maxX]){const h=c.radius*c.radius-(x-c.center.x)**2;if(h>=0)for(const sign of [-1,1])candidates.push({x,y:c.center.y+sign*Math.sqrt(h)});}
   for(const y of [bounds.minY,bounds.maxY]){const h=c.radius*c.radius-(y-c.center.y)**2;if(h>=0)for(const sign of [-1,1])candidates.push({x:c.center.x+sign*Math.sqrt(h),y});}
  }
 }
 const feasible=candidates.filter(valid).sort((a,b)=>Math.hypot(a.x-goal.x,a.y-goal.y)-Math.hypot(b.x-goal.x,b.y-goal.y));if(feasible.length)return feasible[0];
 const result={...goal};
 for(let i=0;i<80;i++){
  let error=0;
  for(const {center,radius}of constraints){const dx=result.x-center.x,dy=result.y-center.y,distance=Math.hypot(dx,dy);if(distance>radius){const amount=distance-radius;result.x-=dx/distance*amount;result.y-=dy/distance*amount;error=Math.max(error,amount);}}
  if(bounds){const x=clamp(result.x,bounds.minX,bounds.maxX),y=clamp(result.y,bounds.minY,bounds.maxY);error=Math.max(error,Math.abs(x-result.x),Math.abs(y-result.y));result.x=x;result.y=y;}
  if(error<1e-9)break;
 }
 return result;
}
