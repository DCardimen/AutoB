// Brakk's first-form painted sleeves, forearms and fists, kept as one pair.
// Source-connected pixels supply both shape and material; no cylinder mesh.
const key=(x,y)=>y*64+x;
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const unit=v=>{const n=Math.hypot(v.x,v.y)||1;return {x:v.x/n,y:v.y/n};};
function skinProjection(profile,root,joint,end,fit,scale){
 const axis=unit(sub(profile.end,profile.root)),length=Math.hypot(profile.end.x-profile.root.x,profile.end.y-profile.root.y)||1,hinge=dot(sub(profile.joint,profile.root),axis),thickness=fit*scale.width;
 const upper=unit(sub(joint,root)),lower=unit(sub(end,joint)),upperAngle=Math.atan2(upper.y,upper.x),bend=Math.atan2(upper.x*lower.y-upper.y*lower.x,dot(upper,lower)),blend=Math.min(1.5,length*.2);
 const warp=(x,y)=>{
  const offset={x:x-profile.root.x,y:y-profile.root.y},along=dot(offset,axis),across=offset.x*-axis.y+offset.y*axis.x;
  const first=along<=hinge,a=first?root:joint,z=first?joint:end,t=first?along/(hinge||1):(along-hinge)/(length-hinge||1),center=mix(a,z,t);
  const w=Math.max(0,Math.min(1,(along-hinge+blend)/(blend*2))),theta=upperAngle+bend*w*w*(3-2*w);
  return {x:center.x-Math.sin(theta)*across*thickness,y:center.y+Math.cos(theta)*across*thickness};
 };
 return {warp,axis,length};
}
export function authoredArmBounds(rig){
 const {art,fit,scale}=rig.artArmSkin,points=[];
 for(const arm of rig.arms){
  const profile=art.profiles.get(rig.artArmScreens[arm.side]);if(!profile)continue;
  const root=rig.artArmRoots[arm.side],joint=rig.artProject(arm.joint),end=rig.artProject(arm.end);
  profile.skinPadding??=Math.max(...profile.pixels.map(p=>{
   const dx=profile.end.x-profile.root.x,dy=profile.end.y-profile.root.y,t=Math.max(0,Math.min(1,((p.x-profile.root.x)*dx+(p.y-profile.root.y)*dy)/(dx*dx+dy*dy||1)));
   return Math.hypot(p.x-profile.root.x-dx*t,p.y-profile.root.y-dy*t)+1;
  }));
  const pad=profile.skinPadding*fit*Math.max(scale.width,scale.height);
  if([root,joint,end].every(p=>p.x-pad>=1&&p.x+pad<=62&&p.y-pad>=1&&p.y+pad<=62))continue;
  const {warp}=skinProjection(profile,root,joint,end,fit,scale);
  for(const p of profile.pixels)for(const [dx,dy]of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]])points.push(warp(p.x+dx,p.y+dy));
 }
 return points;
}

export function authoredArmArt(asset,hands){
 if(asset.armArt)return asset.armArt;
 const grid=new Map(asset.pixels.map(p=>[key(p.x,p.y),p])),profiles=new Map(),mask=new Set();
 for(const side of [-1,1]){
  const hand=hands[side];if(!hand)continue;
  const region=p=>p.y>=27&&p.y<=38&&side*(p.x-32)>6&&Math.abs(p.x-hand.x)<=6;
  const material=p=>{const [r,g,b]=p.rgb;return (g>r*.95&&g>b*1.18)||(Math.max(r,g,b)-Math.min(r,g,b)<65&&Math.min(r,g,b)>105);};
  const candidates=new Map(asset.pixels.filter(p=>region(p)&&material(p)).map(p=>[key(p.x,p.y),p]));
  const start=[...candidates.values()].sort((a,b)=>Math.hypot(a.x-hand.x,a.y-hand.y)-Math.hypot(b.x-hand.x,b.y-hand.y))[0];
  if(!start)continue;
  const seen=new Set([key(start.x,start.y)]),queue=[start];
  // The painted cuff and green fist are sometimes separated by one dark
  // outline pixel. Traverse that source outline instead of leaving the old
  // cuff behind in the body layer while the rest of the arm waves.
  for(let i=0;i<queue.length;i++)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const k=key(queue[i].x+dx,queue[i].y+dy),p=candidates.get(k);if(p&&!seen.has(k)){seen.add(k);queue.push(p);}
  }
  // Include the original one-pixel outline around this connected sleeve/hand,
  // but never cut a rectangular strip through the jacket or opposite limb.
  const pixels=new Map(queue.map(p=>[key(p.x,p.y),p]));
  for(const p of queue)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const q=grid.get(key(p.x+dx,p.y+dy));if(q&&region(q))pixels.set(key(q.x,q.y),q);
  }
  const top=Math.min(...queue.map(p=>p.y)),cuff=queue.filter(p=>p.y<=top+1),root={x:cuff.reduce((n,p)=>n+p.x,0)/cuff.length,y:top};
  const end={x:hand.x,y:hand.y},joint=mix(root,end,.5);
  const profile={side,root,joint,end,pixels:[...pixels.values()],grid:pixels};
  profiles.set(side,profile);for(const p of profile.pixels)mask.add(key(p.x,p.y));
 }
 return asset.armArt={profiles,mask};
}

export function paintAuthoredArms(brush,rig,near,at){
 const {art,colors,fit,scale}=rig.artArmSkin;
 for(const arm of rig.arms){
  const profile=art.profiles.get(rig.artArmScreens[arm.side]);if(!profile)continue;
  const root=rig.artArmRoots[arm.side],joint=rig.artProject(arm.joint),end=rig.artProject(arm.end);
  const {warp,axis,length}=skinProjection(profile,root,joint,end,fit,scale);
  const depths=[at(arm.root).depth,at(arm.joint).depth,at(arm.end).depth],bodyDepth=at(rig.body).depth;
  const mapped=new Map();
  for(const p of profile.pixels){
   const along=dot(sub(p,profile.root),axis),t=Math.max(0,Math.min(1,along/length)),depth=t<.5?depths[0]+(depths[1]-depths[0])*t*2:depths[1]+(depths[2]-depths[1])*(t-.5)*2;
   mapped.set(key(p.x,p.y),{...p,q:warp(p.x,p.y),near:depth>=bodyDepth,color:colors[p.index]});
  }
  rig.artArmPixels??=new Map();if(!rig.artArmPixels.has(arm.side))rig.artArmPixels.set(arm.side,mapped);
  for(const p of mapped.values()){
   if(p.near!==near)continue;
   // Adjacent source pixels share exactly the same warped cell corners.
   // The old independent rigid halves left holes or loose source strips at
   // the elbow. This continuous indexed mesh retains the painted width.
   const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([dx,dy])=>warp(p.x+dx,p.y+dy));
   brush.poly(corners,p.color);brush.dot(p.q.x,p.q.y,p.color);
   for(const [dx,dy]of [[1,0],[0,1],[1,1],[-1,1]]){
    const other=mapped.get(key(p.x+dx,p.y+dy));if(!other)continue;
    if(dx&&dy&&(mapped.has(key(p.x+dx,p.y))||mapped.has(key(p.x,p.y+dy))))continue;
    if(Math.max(Math.abs(Math.round(other.q.x)-Math.round(p.q.x)),Math.abs(Math.round(other.q.y)-Math.round(p.q.y)))>1)brush.line(p.q,other.q,p.color);
   }
   if(Math.hypot(p.x-profile.end.x,p.y-profile.end.y)<=1.65){rig.artGripPixels??=new Map();if(!rig.artGripPixels.has(arm.side))rig.artGripPixels.set(arm.side,[]);rig.artGripPixels.get(arm.side).push({x:p.q.x,y:p.q.y,color:p.color,near:p.near});}
  }
 }
}
// The original fingers cover the handle at the grip, so a broad guard or
// hammer shaft cannot erase the painted fist after the arm has been drawn.
export function paintAuthoredGrips(brush,rig,near){for(const pixels of rig.artGripPixels?.values()||[])for(const pixel of pixels)if(pixel.near===near)brush.dot(pixel.x,pixel.y,pixel.color);}
