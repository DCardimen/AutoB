import {clothPoint,tailPoint} from './model.mjs';
const lerp=(a,b,t)=>a+(b-a)*t;
export function prepareKit(image,metadata){
 const parts={};
 for(const [name,p]of Object.entries(metadata.parts)){
  const canvas=document.createElement('canvas');canvas.width=p.w;canvas.height=p.h;
  canvas.getContext('2d').drawImage(image,p.x,p.y,p.w,p.h,0,0,p.w,p.h);
  parts[name]={...p,image:canvas,pixels:canvas.getContext('2d').getImageData(0,0,p.w,p.h).data};
 }
 // Blink only the painted eye regions. The open head supplies the immutable
 // ears, fur outline and muzzle, even if a generated closed-head crop differs.
 const open=parts['head-open'],closed=parts['head-closed'],eyes=document.createElement('canvas');eyes.width=open.w;eyes.height=open.h;
 const ec=eyes.getContext('2d');ec.drawImage(open.image,0,0);ec.imageSmoothingEnabled=false;
 for(const [left,right]of [[.06,.28],[.35,.69]]){
  ec.save();ec.beginPath();ec.rect(left*open.w,.5*open.h,(right-left)*open.w,.31*open.h);ec.clip();ec.drawImage(closed.image,0,0,open.w,open.h);ec.restore();
 }
 const eyePixels=ec.getImageData(0,0,open.w,open.h);for(let n=3;n<eyePixels.data.length;n+=4)eyePixels.data[n]=open.pixels[n];ec.putImageData(eyePixels,0,0);
 parts['head-closed']={...open,image:eyes,pixels:eyePixels.data};
 const bow=parts.bow,scale=30/bow.h,grip=bow.grip;
 const offset=p=>({x:(p.x-grip.x)*scale,y:(p.y-grip.y)*scale});
 return {form:metadata.form,parts,bowProfile:{top:offset(bow.top),bottom:offset(bow.bottom)},palette:metadata.palette.map(hex=>hex.match(/../g).map(v=>parseInt(v,16))),colorCache:new Map()};
}
function fit(ctx,part,x,y,w,h){
 const scale=Math.min(w/part.w,h/part.h);ctx.drawImage(part.image,x-part.w*scale/2,y-part.h*scale/2,part.w*scale,part.h*scale);
}
function bone(ctx,part,a,b){
 const root=part.root||{x:part.w*.5,y:part.h*.12},tip=part.tip||{x:part.w*.5,y:part.h*.84},length=Math.hypot(tip.x-root.x,tip.y-root.y),scale=Math.hypot(b.x-a.x,b.y-a.y)/length;
 ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(tip.y-root.y,tip.x-root.x));ctx.scale(scale,scale);ctx.drawImage(part.image,-root.x,-root.y);ctx.restore();
}
let meshSurface,meshContext,meshFrame;
function triangle(out,part,s0,s1,s2,p0,p1,p2){
 const denom=(p1.y-p2.y)*(p0.x-p2.x)+(p2.x-p1.x)*(p0.y-p2.y);if(Math.abs(denom)<1e-8)return;
 const left=Math.max(0,Math.floor(Math.min(p0.x,p1.x,p2.x))),right=Math.min(63,Math.ceil(Math.max(p0.x,p1.x,p2.x))),top=Math.max(0,Math.floor(Math.min(p0.y,p1.y,p2.y))),bottom=Math.min(63,Math.ceil(Math.max(p0.y,p1.y,p2.y)));
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const xx=x+.5,yy=y+.5,a=((p1.y-p2.y)*(xx-p2.x)+(p2.x-p1.x)*(yy-p2.y))/denom,b=((p2.y-p0.y)*(xx-p2.x)+(p0.x-p2.x)*(yy-p2.y))/denom,c=1-a-b;
  if(a<-.00001||b<-.00001||c<-.00001)continue;
  const sx=Math.max(0,Math.min(part.w-1,Math.floor(a*s0.x+b*s1.x+c*s2.x))),sy=Math.max(0,Math.min(part.h-1,Math.floor(a*s0.y+b*s1.y+c*s2.y))),source=(sy*part.w+sx)*4,target=(y*64+x)*4;
  if(part.pixels[source+3]<128)continue;for(let k=0;k<4;k++)out[target+k]=part.pixels[source+k];
 }
}
function mesh(ctx,part,cols,rows,map){
 if(!meshSurface){meshSurface=document.createElement('canvas');meshSurface.width=meshSurface.height=64;meshContext=meshSurface.getContext('2d');meshFrame=meshContext.createImageData(64,64);}
 const output=meshFrame.data;output.fill(0);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const uv=[[x/cols,y/rows],[(x+1)/cols,y/rows],[x/cols,(y+1)/rows],[(x+1)/cols,(y+1)/rows]],s=uv.map(([u,v])=>({x:u*part.w,y:v*part.h})),p=uv.map(([u,v])=>map(u,v));
  triangle(output,part,s[0],s[1],s[2],p[0],p[1],p[2]);triangle(output,part,s[1],s[3],s[2],p[1],p[3],p[2]);
 }
 meshContext.putImageData(meshFrame,0,0);ctx.drawImage(meshSurface,0,0);
}
function calf(ctx,part,knee,ankle,foot){
 // A separate ankle keeps the authored boot flat and full-width even when
 // the shin folds almost horizontally during the recovery half-stride.
 const rootV=.12,ankleV=.68,scale=3/(part.h*(1-ankleV)),cx=part.w*.5,dx=ankle.x-knee.x,dy=ankle.y-knee.y,d=Math.hypot(dx,dy)||1;
 mesh(ctx,part,4,9,(u,v)=>{
  const offset=(u*part.w-cx)*scale;
  if(v>=ankleV)return {x:ankle.x+offset,y:ankle.y+(v-ankleV)*part.h*scale};
  const t=(v-rootV)/(ankleV-rootV),blend=Math.max(0,Math.min(1,(v-.4)/.28));
  let nx=lerp(dy/d,1,blend),ny=lerp(-dx/d,0,blend),n=Math.hypot(nx,ny)||1;nx/=n;ny/=n;
  return {x:lerp(knee.x,ankle.x,t)+nx*offset,y:lerp(knee.y,ankle.y,t)+ny*offset};
 });
}
function bow(ctx,part,pose){
 const scale=30/part.h,grip=part.grip||{x:part.w*.25,y:part.h*.5};
 ctx.drawImage(part.image,pose.bow.grip.x-grip.x*scale,pose.bow.grip.y-grip.y*scale,part.w*scale,part.h*scale);
 // Both endpoints and draw point come from the same physical bow pose.
 ctx.strokeStyle='#dfd8b1';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(pose.bow.top.x,pose.bow.top.y);ctx.lineTo(pose.bow.draw.x,pose.bow.draw.y);ctx.lineTo(pose.bow.bottom.x,pose.bow.bottom.y);ctx.stroke();
}
function arrow(ctx,part,from,toward,length=18){
 const angle=Math.atan2(toward.y-from.y,toward.x-from.x),scale=length/part.w;
 ctx.save();ctx.translate(from.x,from.y);ctx.rotate(angle-Math.PI);ctx.drawImage(part.image,-part.w*scale,-part.h*scale/2,part.w*scale,part.h*scale);ctx.restore();
}
export function renderCharacter(ctx,kit,pose,sim,{guides=false}={}){
 const p=kit.parts;ctx.clearRect(0,0,64,64);ctx.imageSmoothingEnabled=false;
 // All tails are separate painted instances; no tail is baked into the torso.
 for(const tail of sim.tails)mesh(ctx,p.tail,8,3,(u,v)=>tailPoint(tail,u,v,kit.form));
 mesh(ctx,p.cape,4,6,(u,v)=>clothPoint(sim,u,v));
 fit(ctx,p.quiver,39,27+pose.bodyY,8,16);
 const far=pose.legs[1],near=pose.legs[0];
 bone(ctx,p['thigh-left'],far.root,far.joint);calf(ctx,p['calf-left'],far.joint,far.end,far.foot);
 bone(ctx,p['thigh-right'],near.root,near.joint);calf(ctx,p['calf-right'],near.joint,near.end,near.foot);
 bone(ctx,p['upper-left'],pose.arms.left.root,pose.arms.left.joint);bone(ctx,p['fore-left'],pose.arms.left.joint,pose.arms.left.end);
 fit(ctx,p.torso,32,36.5+pose.bodyY,19,17);
 fit(ctx,p[pose.blink?'head-closed':'head-open'],pose.head.x,pose.head.y,27,28);
 bow(ctx,p.bow,pose);
 if(pose.attack&&pose.shotTime>.34&&pose.shotTime<1.05)arrow(ctx,p.arrow,pose.arms.left.end,{x:pose.bow.grip.x,y:pose.bow.grip.y-.5});
 bone(ctx,p['upper-right'],pose.arms.right.root,pose.arms.right.joint);bone(ctx,p['fore-right'],pose.arms.right.joint,pose.arms.right.end);
 // The left fingers must stay visibly attached to the drawn string.
 if(pose.drawAmount>.02)bone(ctx,p['fore-left'],pose.arms.left.joint,pose.arms.left.end);
 if(pose.releaseAge>=0&&pose.releaseAge<.085){const t=pose.releaseAge/.085,r=2.5*(1-t),g=pose.bow.grip;ctx.strokeStyle='#ffe0a0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(g.x-r,g.y);ctx.lineTo(g.x+r,g.y);ctx.moveTo(g.x,g.y-r);ctx.lineTo(g.x,g.y+r);ctx.stroke();}
 // The review renderer resolves transformed edge samples back to the kit's
 // shared indexed palette; motion does not invent new costume materials.
 const frame=ctx.getImageData(0,0,64,64),pixels=frame.data;
 for(let n=0;n<pixels.length;n+=4){
  if(pixels[n+3]<128){pixels.fill(0,n,n+4);continue;}
  const key=(pixels[n]<<16)|(pixels[n+1]<<8)|pixels[n+2];let color=kit.colorCache.get(key);
  if(!color){let cost=Infinity;for(const c of kit.palette){const d=(pixels[n]-c[0])**2+(pixels[n+1]-c[1])**2+(pixels[n+2]-c[2])**2;if(d<cost){cost=d;color=c;}}kit.colorCache.set(key,color);}
  for(let k=0;k<3;k++)pixels[n+k]=color[k];pixels[n+3]=255;
 }
 ctx.putImageData(frame,0,0);
 if(guides){
  ctx.strokeStyle='#89e7ea';ctx.fillStyle='#fff4cc';ctx.lineWidth=.35;
  for(const b of [...pose.legs,pose.arms.left,pose.arms.right]){ctx.beginPath();ctx.moveTo(b.root.x,b.root.y);ctx.lineTo(b.joint.x,b.joint.y);ctx.lineTo(b.end.x,b.end.y);if(b.foot)ctx.lineTo(b.foot.x,b.foot.y);ctx.stroke();for(const q of [b.root,b.joint,b.end])ctx.fillRect(q.x-.5,q.y-.5,1,1);}
  for(const tail of sim.tails){ctx.beginPath();tail.nodes.forEach((n,i)=>i?ctx.lineTo(n.x,n.y):ctx.moveTo(n.x,n.y));ctx.stroke();}
  for(const n of sim.cloth)ctx.fillRect(n.x-.25,n.y-.25,.5,.5);
 }
}
export function renderScene(canvas,buffer,pose,kit){
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
 const scale=canvas.width/80,ox=8*scale,oy=0;
 ctx.globalAlpha=.18;ctx.fillStyle='#84918f';ctx.beginPath();ctx.ellipse(40*scale,54*scale,15*scale,1.5*scale,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.drawImage(buffer,ox,oy,64*scale,64*scale);
 if(pose.releaseAge>=0&&pose.releaseAge<.35){
  const {nock,velocity}=pose.releasedArrow,age=pose.releaseAge,from={x:nock.x+velocity.x*age,y:nock.y+velocity.y*age};
  ctx.save();ctx.translate(ox,0);ctx.scale(scale,scale);arrow(ctx,kit.parts.arrow,from,{x:from.x+velocity.x,y:from.y+velocity.y});ctx.restore();
 }
}
