import {projectRig} from './prototype-rig.js';
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),mul=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const unit=a=>mul(a,1/(Math.hypot(a.x,a.y,a.z)||1)),mix=(a,b,t)=>add(a,mul(sub(b,a),t));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Anatomical material samples retain the authored fur/shell/metal colors.
export function creatureLegArt(asset,rig,colors){
 const design=rig.design||rig.id,arthropod=['spider','crab','mantis','beetle','centipede','mech'].includes(design);
 const bottom=Math.max(...asset.pixels.map(p=>p.y));
 const legHeight=({mantis:12,spider:14,beetle:9,centipede:10,crab:10,mech:9,turtle:5,rhino:7,rabbit:7,rodent:7})[design]||9;
 const cut=bottom-legHeight,mask=new Set(),repairs=[];
 const sign=rig.dir<2?1:rig.dir>2&&rig.dir<5?-1:0,faceX=32+sign*8;
 for(const p of asset.pixels)if(p.y>=cut){
  const core=design==='spider'?Math.abs(p.x-faceX)<8&&p.y<bottom-1:arthropod?Math.abs(p.x-faceX)<6&&p.y<cut+4:Math.abs(p.x-32)<4&&p.y<cut+3;
  if(!core)mask.add(p.y*64+p.x);
 }
 if(['mantis','crab'].includes(design))for(const p of asset.pixels)
  if(Math.abs(p.x-32)>(design==='mantis'?8:13)&&p.y>=30&&p.y<cut+3)mask.add(p.y*64+p.x);
 const ramp=(pixels,fallback)=>{
  const shades=pixels.map(p=>({color:colors[p.index],rgb:p.rgb})).filter(p=>Math.max(...p.rgb)>45&&Math.min(...p.rgb)<235);
  const groups=new Map();for(const p of shades){const [r,g,b]=p.rgb,hi=Math.max(r,g,b),lo=Math.min(r,g,b),key=hi-lo<38?'neutral':r>=g&&r>=b?'warm':g>=b?'green':'blue';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  const dominant=[...groups.values()].sort((a,b)=>b.length-a.length)[0];if(!dominant?.length)return fallback;
  const tones=[...new Map(dominant.map(p=>[p.color,p])).values()].sort((a,b)=>a.rgb.reduce((n,v)=>n+v)-b.rgb.reduce((n,v)=>n+v));
  return [.1,.45,.75,.95].map(t=>tones[Math.round((tones.length-1)*t)].color);
 };
 const fallback=rig.palette?.[design==='mech'?'metal':'skin']||['#394342','#78877a','#c6c9a8'],samples=asset.pixels.filter(p=>mask.has(p.y*64+p.x));
 const material=ramp(samples.length?samples:asset.pixels,fallback),feet=ramp(samples.filter(p=>p.y>=bottom-3),material);
 // Restore the upper leg sockets from the adjoining body texture, never
 // from background pixels; movement cannot expose a transparent belly seam.
 const grid=new Map(asset.pixels.map(p=>[p.y*64+p.x,p]));
 for(const p of samples)if(p.y<=cut&&Math.abs(p.x-32)<10){const source=grid.get((cut-1)*64+p.x);if(source)repairs.push({...p,index:source.index,rgb:source.rgb});}
 const soles=samples.filter(p=>p.y>=bottom-2),footPixels=soles.length?soles:samples;
 return {mask,repairs,material,feet,arthropod,coverY:cut-1,bottom,cut,
  left:Math.min(...footPixels.map(p=>p.x)),right:Math.max(...footPixels.map(p=>p.x)),
  sockets:asset.pixels.filter(p=>p.y===cut-1).map(p=>p.x)};
}

export function buildCreatureLegVolumes(rig,rest,angle,art){
 const faces=[],legs=[],design=rig.design||rig.id;
 const plated=['mech','beetle','crab'].includes(design),thin=['spider','centipede','mantis'].includes(design),hoof=['stag','rhino'].includes(design);
 const radius=design==='centipede'?2.7:thin?3.7:plated?5.5:design==='bear'?6:5.1;
 const light=unit({x:-.45*Math.cos(angle)+.55*Math.sin(angle),y:.45*Math.sin(angle)+.55*Math.cos(angle),z:.8});
 // Register the solid anatomy to the original atlas sockets and soles.
 // Adding raw proxy-rig legs underneath the artwork produces doubled legs.
 const raw=q=>{const p=projectRig(q,angle);return {x:32+p.x/3,y:44+p.y/3,depth:p.depth/3};};
 const ends=rest.legs.map(l=>raw(l.end)),hips=rest.legs.map(l=>raw(l.root));
 const left=Math.min(...ends.map(p=>p.x)),right=Math.max(...ends.map(p=>p.x)),bottom=Math.max(...ends.map(p=>p.y));
 const height=ends.reduce((n,p)=>n+p.y,0)/ends.length-hips.reduce((n,p)=>n+p.y,0)/hips.length;
 const sx=clamp((art.right-art.left-3)/Math.max(4,right-left),.65,1.8),sy=clamp((art.bottom-art.cut-2)/Math.max(4,height),.45,1.65);
 const centerX=(art.left+art.right)/2,center=(left+right)/2;
 const registered=q=>{const p=raw(q);return {x:centerX+(p.x-center)*sx,y:art.bottom-1.5+(p.y-bottom)*sy,depth:p.depth};};
 const bodyDrift=sub(raw(rig.body),raw(rest.body));
 for(const [index,leg]of rig.legs.entries()){
  const bindRoot=registered(rest.legs[index].root),root=registered(leg.root);
  const socket=art.sockets.reduce((best,x)=>Math.abs(x-bindRoot.x)<Math.abs(best-bindRoot.x)?x:best,art.sockets[0]??bindRoot.x);
  const correction={x:socket+bodyDrift.x-root.x,y:art.cut-1+bodyDrift.y-root.y};
  const project=q=>{
   const p=registered(q),toRoot=Math.hypot(q.x-leg.root.x,q.y-leg.root.y,q.z-leg.root.z),toFoot=Math.hypot(q.x-leg.end.x,q.y-leg.end.y,q.z-leg.end.z),weight=toFoot/(toRoot+toFoot||1);
   return {x:p.x+correction.x*weight,y:p.y+correction.y*weight,depth:p.depth};
  };
  const knee=art.arthropod?leg.joint:mix(mix(leg.root,leg.hock||leg.end,.5),leg.joint,.35);
  const layer=projectRig(leg.root,angle).depth>=projectRig(rig.body,angle).depth?'near':'far';
  const face=(vertices,part,material=art.material)=>{
   const normal=unit(cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0]))),brightness=clamp(.5+dot(normal,light)*.48,0,1);
   faces.push({vertices:vertices.map(project),color:material[clamp(Math.round(brightness*(material.length-1)),0,material.length-1)],shadowColor:material[0],normal,brightness,leg:index,layer,part,raised:leg.front&&['cat','lion','bear','rabbit'].includes(design)&&rig.creatureAttack?.active});
  };
  const tube=(a,z,r0,r1,part)=>{
   const axis=unit(sub(z,a)),side=unit(cross(axis,Math.abs(axis.z)<.85?{x:0,y:0,z:1}:{x:0,y:1,z:0})),front=cross(side,axis),rings=[];
   for(const [t,bloat]of [[0,.75],[.3,plated?1.12:1],[.75,.9],[1,.7]]){const center=mix(a,z,t),r=(r0+(r1-r0)*t)*bloat;rings.push(Array.from({length:8},(_,i)=>add(center,add(mul(side,Math.cos(i*Math.PI/4)*r),mul(front,Math.sin(i*Math.PI/4)*r)))));}
   for(let j=0;j<3;j++)for(let i=0;i<8;i++){const n=(i+1)%8;face([rings[j][i],rings[j+1][i],rings[j+1][n]],part);face([rings[j][i],rings[j+1][n],rings[j][n]],part);}
   for(let i=0;i<8;i++){const n=(i+1)%8;face([a,rings[0][i],rings[0][n]],part);face([z,rings[3][n],rings[3][i]],part);}
  };
  tube(leg.root,knee,radius,radius*.8,'thigh');
  tube(knee,leg.hock||leg.end,radius*.8,radius*.55,'calf');
  if(leg.hock)tube(leg.hock,leg.end,radius*.6,radius*.46,'hock');
  tube(add(knee,{x:0,y:0,z:-1.5}),add(knee,{x:0,y:0,z:1.5}),radius*.92,radius*.92,'knee');
  const yaw=leg.foot?.angle||0,pitch=leg.foot?.pitch||0,cs=Math.cos(yaw),sn=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const foot=thin?'tip':hoof?'hoof':plated?'plate-foot':'paw',rx=thin?radius*.7:radius*1.2,ry=radius*.9,rz=thin?1.3:radius*.65;
  const local=(x,y,z)=>{const xx=x*cp+z*sp,zz=-x*sp+z*cp;return add(leg.end,{x:xx*cs-y*sn,y:xx*sn+y*cs,z:zz});};
  const rings=[[-.7,.55],[0,1],[.7,.65]].map(([z,r])=>Array.from({length:8},(_,i)=>local(Math.cos(i*Math.PI/4)*rx*r+radius*.35,Math.sin(i*Math.PI/4)*ry*r,z*rz)));
  for(let j=0;j<2;j++)for(let i=0;i<8;i++){const n=(i+1)%8;face([rings[j][i],rings[j+1][i],rings[j+1][n]],foot,art.feet);face([rings[j][i],rings[j+1][n],rings[j][n]],foot,art.feet);}
  for(let i=0;i<8;i++){const n=(i+1)%8;face([local(radius*.35,0,rz),rings[2][i],rings[2][n]],foot,art.feet);face([local(radius*.35,0,-rz),rings[0][n],rings[0][i]],foot,art.feet);}
  legs.push({index,hip:project(leg.root),knee:project(knee),ankle:project(leg.end),hock:leg.hock&&project(leg.hock),radius:radius/3,planted:Boolean(leg.foot?.planted),footPitch:pitch,layer,solidParts:['thigh','calf','knee',...(leg.hock?['hock']:[]),foot]});
 }
 return {faces,legs};
}
