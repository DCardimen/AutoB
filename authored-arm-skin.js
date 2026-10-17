// Brakk's first-form painted sleeves, forearms and fists, kept as one pair.
// Source-connected pixels supply both shape and material; no cylinder mesh.
const key=(x,y)=>y*64+x;
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const unit=v=>{const n=Math.hypot(v.x,v.y)||1;return {x:v.x/n,y:v.y/n};};

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
  const upperNear=(at(arm.root).depth+at(arm.joint).depth)/2>=at(rig.body).depth,lowerNear=at(arm.end).depth>=at(rig.body).depth;
  const segments=[[profile.root,profile.joint,root,joint,upperNear],[profile.joint,profile.end,joint,end,lowerNear]],thickness=fit*scale.width;
  const sourceAxis=unit(sub(profile.end,profile.root));
  const partFor=p=>dot(sub(p,profile.joint),sourceAxis)<0?0:1;
  const mapped=new Map();
  for(const p of profile.pixels){
   const part=partFor(p),[a,z,pa,pz,isNear]=segments[part];if(isNear!==near)continue;
   const source=sub(z,a),length=Math.hypot(source.x,source.y)||1,axis=unit(source),target=unit(sub(pz,pa)),offset=sub(p,a),along=dot(offset,axis),t=Math.max(0,Math.min(1,along/length)),across=offset.x*-axis.y+offset.y*axis.x,tail=along-t*length,point=mix(pa,pz,t);
   const q={x:point.x+(target.x*tail-target.y*across)*thickness,y:point.y+(target.y*tail+target.x*across)*thickness};
   mapped.set(key(p.x,p.y),{...p,q,color:colors[p.index]});brush.dot(q.x,q.y,colors[p.index]);
   if(Math.hypot(p.x-profile.end.x,p.y-profile.end.y)<=1.65){rig.artGripPixels??=new Map();if(!rig.artGripPixels.has(arm.side))rig.artGripPixels.set(arm.side,[]);rig.artGripPixels.get(arm.side).push({x:q.x,y:q.y,color:colors[p.index],near:isNear});}
  }
  for(const p of mapped.values())for(const [dx,dy]of [[1,0],[0,1],[1,1],[-1,1]]){
   const other=mapped.get(key(p.x+dx,p.y+dy));if(other)brush.line(p.q,other.q,p.color);
  }
  // Inverse samples restore the cuff's texture after source adjacency bridges
  // keep the elbow and shoulder connected through a bend.
  if(!mapped.size)continue;
  const points=[...mapped.values()].map(p=>p.q),left=Math.floor(Math.min(...points.map(p=>p.x))),right=Math.ceil(Math.max(...points.map(p=>p.x))),top=Math.floor(Math.min(...points.map(p=>p.y))),bottom=Math.ceil(Math.max(...points.map(p=>p.y)));
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)for(let part=0;part<2;part++){
   const [a,z,pa,pz,isNear]=segments[part];if(isNear!==near)continue;
   const target=sub(pz,pa),length=Math.hypot(target.x,target.y)||1,axis=unit(target),offset={x:x-pa.x,y:y-pa.y},along=dot(offset,axis),t=Math.max(0,Math.min(1,along/length)),across=(offset.x*-axis.y+offset.y*axis.x)/thickness,tail=(along-t*length)/thickness,sourceAxis=unit(sub(z,a)),base=mix(a,z,t),sx=Math.round(base.x+sourceAxis.x*tail-sourceAxis.y*across),sy=Math.round(base.y+sourceAxis.y*tail+sourceAxis.x*across),pixel=profile.grid.get(key(sx,sy));
   if(pixel&&partFor(pixel)===part)brush.dot(x,y,colors[pixel.index]);
  }
 }
}
// The original fingers cover the handle at the grip, so a broad guard or
// hammer shaft cannot erase the painted fist after the arm has been drawn.
export function paintAuthoredGrips(brush,rig,near){for(const pixels of rig.artGripPixels?.values()||[])for(const pixel of pixels)if(pixel.near===near)brush.dot(pixel.x,pixel.y,pixel.color);}
