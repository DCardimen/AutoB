import {armRegistration,capePixel,authoredClothing,completeClothing} from './companion-anatomy.js';
const key=(x,y)=>y*64+x;
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const MELEE_ARM_FAMILIES=new Set(['knight','orc','dwarf','troll','goblin','minotaur','rogue']);
function meleeOverlay(identity,p){
 const [r,g,b]=p.rgb;
 // A cape crosses the shoulder as well as the lower jacket. The generic
 // cape classifier's neck/width gates are unsuitable for arm extraction.
 return ['knight','goblin','orc'].includes(identity)?r>g*1.8&&g<b*1.5:identity==='rogue'?b>r*1.08:false;
}
export function occludedMeleeArm(identity,dir,side){return identity==='rogue'&&(dir===6||dir===5&&side===1||dir===7&&side===-1);}
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
function torsoOccluder(identity,p,registration){
 if(capePixel(identity,p,registration))return true;
 const [r,g,b]=p.rgb,range=Math.max(r,g,b)-Math.min(r,g,b),lum=(r+g+b)/3;
 return p.y>19&&p.y<42&&(['caster','frostelf'].includes(identity)?range<55&&lum>105:['elf','dwarf'].includes(identity)?r>g*1.1&&g>b*1.4&&r>110:identity==='orc'?lum<65&&range<35:identity==='fox'?r>g*1.55&&g>b*1.5&&r>140:false);
}
function torsoEnvelope(pixels,identity,registration,profiles){
 const arms=[...profiles.values()],top=Math.min(...arms.map(a=>a.root.y))-2;
 if(MELEE_ARM_FAMILIES.has(identity)){
  // The chest ends at the jacket side, not at the resting fist. In
  // particular, the source outline around a hand is not a body landmark.
  const rows=new Map(),shoulder=Math.min(...Object.values(registration.roots).map(p=>p.y))+2;
  for(let y=top;y<=registration.pelvis;y++){
   const taper=clamp((y-shoulder)/(registration.pelvis-shoulder||1),0,1),radius=registration.torso*(1-.22*taper);
   rows.set(y,{left:Math.ceil(32-radius),right:Math.floor(32+radius)});
  }
  return rows;
 }
 // Follow the actual painted side outline around the removed sleeve. A
 // generic chest radius still leaves a hollow strip inside that outline.
 const radius=Math.max(registration.torso+registration.upper*2,...arms.flatMap(a=>a.pixels.map(p=>Math.abs(p.x-32)+2)));
 let bottom=registration.pelvis;
 while(bottom>top+4&&!pixels.some(p=>p.y===bottom&&Math.abs(p.x-32)<=2))bottom--;
 // The shoulder caps, jacket sides and waist describe the occluded trunk.
 // A radius around the center alone cuts away its sides with the sleeves.
 const points=pixels.filter(p=>p.y>=top&&p.y<=bottom&&Math.abs(p.x-32)<=radius&&!capePixel(identity,p,registration)).map(p=>({x:p.x,y:p.y}));
 points.sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),hull=[];
 for(const p of points){while(hull.length>1&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}
 const lower=hull.length;
 for(let i=points.length-2;i>=0;i--){const p=points[i];while(hull.length>lower&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}
 hull.pop();const rows=new Map();
 for(let y=top;y<=bottom;y++){
  const intersections=[];
  for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length];if(y<Math.min(a.y,b.y)||y>Math.max(a.y,b.y))continue;if(a.y===b.y)intersections.push(a.x,b.x);else intersections.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));}
  if(intersections.length)rows.set(y,{left:Math.ceil(Math.min(...intersections)),right:Math.floor(Math.max(...intersections))});
 }
 return rows;
}
// Generate independent indexed parts once from the registered bind frame.
// No palette is created and no animated pose is used for ownership.
export function authoredParts(asset,identity,stage,dir){
 if(asset.parts)return asset.parts;
 const registration=armRegistration(identity,stage,dir);if(!registration)return null;
 const clothing=authoredClothing(asset,identity,stage,dir,registration);
 const grid=new Map(asset.pixels.map(p=>[key(p.x,p.y),p])),hands={},profiles=new Map(),mask=new Set();
 for(const side of [-1,1]){
  if(occludedMeleeArm(identity,dir,side)){
   // The rear cloak contains no painted hand. Preserve that entire cloak,
   // and use the same form's authored front arm beneath it. Translate its
   // indexed skin to the fixed concealed socket; depth decides when a hand
   // emerges. Cutting a blue "arm" out of the cape erased costume artwork.
   const sourceDir=2,source=authoredParts(asset.sourceFrame(sourceDir),identity,stage,sourceDir).arms.profiles.get(side),end=registration.hands[side],dx=end.x-source.end.x,dy=end.y-source.end.y;
   const translate=p=>({...p,x:p.x+dx,y:p.y+dy}),pixels=source.pixels.map(translate),profile={...source,root:translate(source.root),joint:translate(source.joint),end:{...end},pixels,grid:new Map(pixels.map(p=>[key(p.x,p.y),p])),occluded:true,sourceDir};
   profiles.set(side,profile);hands[side]={...profile.grid.get(key(end.x,end.y))};continue;
  }
  const socket=registration.hands[side],near=asset.pixels.filter(p=>Math.hypot(p.x-socket.x,p.y-socket.y)<=3).sort((a,b)=>Math.hypot(a.x-socket.x,a.y-socket.y)-Math.hypot(b.x-socket.x,b.y-socket.y));
  const sample=near[0];if(!sample)continue;
  hands[side]={...sample};
  const root=registration.roots[side],end={x:sample.x,y:sample.y},joint=mix(root,end,.5);
  const candidates=asset.pixels.filter(p=>{
   if(clothing.mask.has(key(p.x,p.y)))return false;
   if(p.y<root.y-1||p.y>end.y+registration.lower)return false;
   if(Math.hypot(p.x-end.x,p.y-end.y)<=registration.lower)return true;
   if(MELEE_ARM_FAMILIES.has(identity)&&meleeOverlay(identity,p))return false;
   if(!(MELEE_ARM_FAMILIES.has(identity)&&side*(end.x-32)<registration.torso*.25)&&side*(p.x-32)<registration.torso*.25)return false;
   if(!armMaterial(identity,p))return false;
   const region=segment(p,root,end),radius=registration.upper+(registration.lower-registration.upper)*region.t;
   return region.distance<=radius+.6;
  });
  // Ownership includes the source outline and enclosed cuff shading. Color
  // tests alone left dark sleeve fragments in the torso, visible on a swing.
  const selected=new Map(candidates.filter(p=>!mask.has(key(p.x,p.y))).map(p=>[key(p.x,p.y),p]));
  for(const p of candidates)for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
   const q=grid.get(key(p.x+dx,p.y+dy));if(!q||mask.has(key(q.x,q.y))||q.y<root.y-1||q.y>end.y+registration.lower||side*(q.x-32)<registration.torso*.25)continue;
   if(clothing.mask.has(key(q.x,q.y))||MELEE_ARM_FAMILIES.has(identity)&&meleeOverlay(identity,q))continue;
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
 if(MELEE_ARM_FAMILIES.has(identity)){
  // Complete the painted sleeve/hand INCLUDING its outside outline. Keep
  // the established inner shoulder pivot; outline ownership must not
  // change the physical reach or choose a different wielding hand.
  const rows=torsoEnvelope(asset.pixels,identity,registration,profiles);
  for(const profile of profiles.values()){
   if(profile.occluded)continue;
   const {side,end}=profile,root=registration.roots[side];
   for(const p of asset.pixels){
    if(mask.has(key(p.x,p.y))||p.y<root.y-2||p.y>Math.min(registration.pelvis-1,end.y+Math.ceil(registration.lower)+1)||side*(p.x-32)<registration.torso*.25)continue;
    if(p.y>end.y&&Math.abs(p.x-32)<=registration.torso)continue; // inner thigh/hip, below the fist
    if(clothing.mask.has(key(p.x,p.y))||meleeOverlay(identity,p))continue;
    const row=rows.get(p.y),outside=!row||p.x<row.left||p.x>row.right,hand=Math.hypot(p.x-end.x,p.y-end.y)<=registration.lower+1.5;
    if(!hand&&!outside)continue;
    profile.pixels.push(p);profile.grid.set(key(p.x,p.y),p);mask.add(key(p.x,p.y));
   }
  }
 }
 const retained=asset.pixels.filter(p=>!mask.has(key(p.x,p.y))),bodyGrid=new Map(retained.map(p=>[key(p.x,p.y),p])),repairs=[];
 const bodyRows=torsoEnvelope(retained,identity,registration,profiles);
 // Paint an entire independent chest beneath the arm holes, not just the
 // narrow central column. Reflect a patch of the surviving same-row torso
 // into each opening so folds/armor have width instead of repeated stripes.
 for(const [y,{left,right}]of bodyRows){
  const row=retained.filter(p=>p.y===y&&Math.abs(p.x-32)<=registration.torso*.7);if(!row.length)continue;
  const seed=row.reduce((a,b)=>Math.abs(a.x-32)<Math.abs(b.x-32)?a:b);let innerLeft=seed.x,innerRight=seed.x;
  while(bodyGrid.has(key(innerLeft-1,y))&&innerLeft>32-registration.torso)innerLeft--;
  while(bodyGrid.has(key(innerRight+1,y))&&innerRight<32+registration.torso)innerRight++;
  for(let x=left;x<=right;x++){
   if(bodyGrid.has(key(x,y)))continue;
   if(identity==='skeleton'&&!mask.has(key(x,y)))continue; // authored rib gaps stay hollow
   const reflected=x<innerLeft?innerLeft+(innerLeft-x-1):x>innerRight?innerRight-(x-innerRight-1):x,donorX=clamp(reflected,innerLeft,innerRight);
   const sample=bodyGrid.get(key(donorX,y))||row.reduce((a,b)=>Math.abs(a.x-donorX)<Math.abs(b.x-donorX)?a:b);
   const pixel={...sample,x,y,bodyUnderlay:true};bodyGrid.set(key(x,y),pixel);repairs.push(pixel);
  }
 }
 const underbody=[];
 // Hair and capes may cross the trunk too. Its own indexed material must
 // still exist underneath those moving overlays, not borrow their motion.
 const material=retained.filter(p=>p.y>registration.neck&&p.y<=registration.pelvis&&!torsoOccluder(identity,p,registration)&&Math.abs(p.x-32)<=registration.torso);
 for(const [y,{left,right}]of bodyRows)for(let x=left;x<=right;x++){
  if(identity==='skeleton'&&!bodyGrid.has(key(x,y)))continue;
  let sample=bodyGrid.get(key(x,y));
  if(!sample||torsoOccluder(identity,sample,registration))sample=material.reduce((a,b)=>!a||Math.abs(b.y-y)*3+Math.abs(b.x-x)<Math.abs(a.y-y)*3+Math.abs(a.x-x)?b:a,null);
  if(sample)underbody.push({...sample,x,y,bodyUnderlay:true});
 }
 const body=[...retained,...repairs],head=body.filter(p=>p.y<=registration.neck),torso=body.filter(p=>p.y>registration.neck&&p.y<=registration.pelvis),legs=body.filter(p=>p.y>registration.pelvis);
 const garment=completeClothing(clothing,mask);
 const cape=body.filter(p=>clothing.mask.has(key(p.x,p.y))||capePixel(identity,p,registration)),capeMask=new Set([...cape,...garment.repairs].map(p=>key(p.x,p.y)));
 return asset.parts={registration,hands,arms:{profiles,mask},body,head,torso,legs,cape,capeMask,clothing:garment,repairs,bodyRows,underbody};
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
