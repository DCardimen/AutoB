import {projectRig} from './prototype-rig.js';

const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),mul=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const unit=a=>mul(a,1/(Math.hypot(a.x,a.y,a.z)||1)),mix=(a,b,t)=>add(a,mul(sub(b,a),t));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// Closed, rounded solid limbs projected from the same 3D joints as movement.
// Each face carries a material sample and a surface normal; it is never a
// rotated rectangular strip from the source bitmap.
export function buildLegVolumes(rig,profiles,rest,angle,scale,colors){
 const faces=[],legs=[];
 const light=unit({x:-.45*Math.cos(angle)+.55*Math.sin(angle),y:.45*Math.sin(angle)+.55*Math.cos(angle),z:.8});
 for(let index=0;index<rig.legs.length;index++){
  const leg=rig.legs[index],bind=rest.legs[index],profile=profiles[index];
  const ankleY=44+(profile.ankleY-45)*scale.height,hipY=44+(profile.hipY-45)*scale.height,centerX=32+(profile.centerX-32)*scale.width;
  const vertical=(ankleY-hipY)/Math.max(4,(bind.root.z-bind.end.z)/3),horizontal=1.12;
  const position=q=>({x:(q.x-bind.end.x)*horizontal,y:(q.y-bind.end.y)*horizontal,z:(q.z-bind.end.z)*vertical});
  const project=q=>{const p=projectRig(q,angle);return {x:centerX+p.x/3,y:ankleY+p.y/3,depth:p.depth/3+projectRig(bind.end,angle).depth/3};};
  const hip=position(leg.root),knee=position(leg.joint),ankle=position(leg.end),thigh=profile.radius*3*scale.width,calf=thigh*.83;
  const face=(vertices,material,u,v,part)=>{
   const normal=unit(cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0]))),brightness=clamp(.48+.48*dot(normal,light),0,1),ramp=profile.bands[material]?.[clamp(Math.floor(v*3),0,2)]||profile.materials[material];
   const shade=clamp(Math.round(brightness*(ramp.length-1)),0,ramp.length-1);
   faces.push({vertices:vertices.map(project),color:colors[ramp[shade]],shadowColor:colors[ramp[0]],normal,brightness,leg:index,part});
  };
  const tube=(a,z,r0,r1,material,part)=>{
   const axis=unit(sub(z,a)),side=unit(cross(axis,Math.abs(axis.z)<.85?{x:0,y:0,z:1}:{x:0,y:1,z:0})),front=cross(side,axis),rings=[];
   for(const [t,bloat]of [[0,.78],[.25,1.08],[.75,.97],[1,.78]]){
    const center=mix(a,z,t),radius=(r0+(r1-r0)*t)*bloat;
    rings.push(Array.from({length:8},(_,i)=>add(center,add(mul(side,Math.cos(i*Math.PI/4)*radius),mul(front,Math.sin(i*Math.PI/4)*radius)))));
   }
   for(let r=0;r<3;r++)for(let s=0;s<8;s++){
    const n=(s+1)%8,a0=rings[r][s],a1=rings[r][n],z0=rings[r+1][s],z1=rings[r+1][n];
    face([a0,z0,z1],material,s/8,(r+.5)/3,part);face([a0,z1,a1],material,s/8,(r+.5)/3,part);
   }
   for(let s=0;s<8;s++){const n=(s+1)%8;face([a,rings[0][s],rings[0][n]],material,s/8,0,part);face([z,rings[3][n],rings[3][s]],material,s/8,1,part);}
  };
  tube(hip,knee,thigh,thigh*.83,'thigh','thigh');
  tube(knee,ankle,calf,calf*.73,'calf','calf');
  // A rounded knee cap turns with the bent shin instead of leaving a seam.
  const kneeAxis=unit(sub(ankle,knee));tube(add(knee,mul(kneeAxis,-1.3)),add(knee,mul(kneeAxis,1.3)),calf*1.06,calf*1.06,'calf','knee');
  // A bevelled boot has a top, toe, heel and sole. Pitch comes from the planted
  // heel/toe gait; yaw remains tied to the foot's ground-facing direction.
  const yaw=leg.foot?.angle||0,pitch=leg.foot?.pitch||0,cs=Math.cos(yaw),sn=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const bootLength=clamp(profile.bootLength,4.5,8)*1.5*scale.width,bootWidth=thigh*.83,bootHeight=thigh*.68*scale.height/scale.width;
  const boot=(x,y,z)=>{const px=x*cp+z*sp,pz=-x*sp+z*cp;return add(ankle,{x:px*cs-y*sn,y:px*sn+y*cs,z:pz});};
  const outline=[[-bootLength*.35,-bootWidth*.7],[bootLength*.5,-bootWidth],[bootLength*.7,-bootWidth*.65],[bootLength*.7,bootWidth*.65],[bootLength*.5,bootWidth],[-bootLength*.35,bootWidth*.7]];
  const bottom=outline.map(([x,y])=>boot(x,y,-bootHeight*.25)),rim=outline.map(([x,y])=>boot(x,y,0)),top=outline.map(([x,y])=>boot(x*.84,y*.8,bootHeight));
  for(let s=0;s<6;s++){const n=(s+1)%6;
   face([bottom[s],bottom[n],rim[n]],'sole',s/6,1,'sole');face([bottom[s],rim[n],rim[s]],'sole',s/6,1,'sole');
   face([rim[s],rim[n],top[n]],'boot',s/6,.6,'boot');face([rim[s],top[n],top[s]],'boot',s/6,.6,'boot');
   face([boot(0,0,bootHeight),top[s],top[n]],'boot',s/6,0,'boot');face([boot(0,0,-bootHeight*.25),bottom[n],bottom[s]],'sole',s/6,1,'sole');
  }
  legs.push({index,hip:project(hip),knee:project(knee),ankle:project(ankle),radius:profile.radius*scale.width,footPitch:pitch,planted:Boolean(leg.foot?.planted),solidParts:['thigh','calf','knee','boot','sole']});
 }
 return {faces,legs};
}

export function paintLegVolumes(brush,rig){
 if(!rig.artLegFaces?.length)return;
 const depth=new Float32Array(4096).fill(-Infinity),pixels=new Array(4096),shadows=new Array(4096),owner=new Int8Array(4096).fill(-1),outline='#192328';
 for(const face of rig.artLegFaces){
  const [a,b,c]=face.vertices,area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<.01)continue;
  const minX=Math.floor(Math.min(a.x,b.x,c.x)),maxX=Math.ceil(Math.max(a.x,b.x,c.x)),minY=Math.floor(Math.min(a.y,b.y,c.y)),maxY=Math.ceil(Math.max(a.y,b.y,c.y));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const px=x+.5,py=y+.5,w1=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area,w2=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area,w3=1-w1-w2;
   if(w1<-.001||w2<-.001||w3<-.001)continue;
   const z=w1*a.depth+w2*b.depth+w3*c.depth;
   if(x<0||y<0||x>=64||y>=64){brush.dot(x,y,face.color);continue;}
   const n=y*64+x;if(z>=depth[n]){depth[n]=z;pixels[n]=face.color;shadows[n]=face.shadowColor||face.color;owner[n]=face.leg;}
  }
 }
 // A one-pixel silhouette keeps the native art crisp; internal overlap is
 // resolved by real depth, so the far calf cannot paint over the near boot.
 for(let n=0;n<4096;n++)if(pixels[n]){const x=n%64,y=Math.floor(n/64);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx<0||xx>=64||yy<0||yy>=64||!pixels[yy*64+xx])brush.dot(xx,yy,outline);}}
 for(let n=0;n<4096;n++)if(pixels[n]){
  const x=n%64,y=Math.floor(n/64),occluded=[-1,1,-64,64].some(offset=>{const m=n+offset;return m>=0&&m<4096&&Math.abs(m%64-x)<=1&&pixels[m]&&owner[m]!==owner[n]&&depth[m]>depth[n]+.15;});
  brush.dot(x,y,occluded?shadows[n]:pixels[n]);
 }
 rig.artLegDepth=depth;
}
