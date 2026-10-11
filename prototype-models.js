import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { characterRig, RIGS } from './prototype-rig.js';

// All geometry uses the simulation's coordinates: X forward, Y lateral, Z up.
// No painted image bounds participate in anatomy or model scale.
const V=p=>new T.Vector3(p.x||0,p.y||0,p.z||0),Z=new T.Vector3(0,0,1);
const models=new Map(),materials=new Map();
const palettes={
  knight:{skin:0x493c36,cloth:0x792d35,metal:0x889da5,edge:0xd0af68,leather:0x332c25},
  orc:{skin:0x6d8250,cloth:0x4c3730,metal:0x535c60,edge:0xb69b67,leather:0x38271d},
  elf:{skin:0xcaa582,cloth:0x335542,metal:0x6b816e,edge:0xc0a367,leather:0x493828},
  caster:{skin:0xb89b90,cloth:0x55506e,metal:0x6d8791,edge:0xb9a887,leather:0x393444},
  wolf:{skin:0xa66b3c,cloth:0x57402d,metal:0x86715c,edge:0xdfc99f,leather:0x302619},
};
function mat(color,kind='cloth'){
  const key=color+':'+kind;if(materials.has(key))return materials.get(key);
  const m=new T.MeshStandardMaterial({color,roughness:kind==='metal'?0.56:kind==='skin'?0.88:0.94,metalness:kind==='metal'?0.32:0,flatShading:false});
  // Object-space pigment variation keeps the surface from looking like plastic.
  m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 pigmentPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\npigmentPosition = position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 pigmentPosition;').replace('#include <color_fragment>',`#include <color_fragment>\nfloat grain = sin(dot(pigmentPosition,vec3(28.9,41.7,19.3))) * sin(dot(pigmentPosition,vec3(53.2,7.1,37.4)));\ndiffuseColor.rgb *= 0.97 + 0.025 * grain;`);
  };m.customProgramCacheKey=()=>kind;materials.set(key,m);return m;
}
function mesh(parent,geometry,color,kind='cloth'){const m=new T.Mesh(geometry,mat(color,kind));parent.add(m);return m;}
function ball(parent,p,s,color,kind='cloth',segments=20){const m=mesh(parent,new T.SphereGeometry(1,segments,12),color,kind);m.position.copy(V(p));m.scale.set(...s);return m;}
function tube(parent,points,r,color,kind='cloth'){
  const curve=new T.CatmullRomCurve3(points.map(V)),m=mesh(parent,new T.TubeGeometry(curve,Math.max(8,points.length*5),r,8,false),color,kind);return m;
}
function rod(parent,a,b,r1,r2,color,kind='metal'){
  const from=V(a),to=V(b),m=mesh(parent,new T.CylinderGeometry(r2,r1,from.distanceTo(to),12),color,kind);
  m.position.copy(from).add(to).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return m;
}
function box(parent,p,size,color,kind='metal'){
  const m=mesh(parent,new T.BoxGeometry(...size),color,kind);m.position.copy(V(p));return m;
}
function rings(parent,sections,color,kind='metal',sides=20){
  const positions=[],indices=[];
  for(const s of sections)for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2;positions.push(s.x+Math.cos(a)*s.rx,s.y+Math.sin(a)*s.ry,s.z);}
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;indices.push(a,b,c,b,d,c);}
  // Cap ends so shoulders/armor remain solid from every angle.
  for(const j of [0,sections.length-1]){const s=sections[j],n=positions.length/3;positions.push(s.x,s.y,s.z);for(let i=0;i<sides;i++)indices.push(n,j*sides+(j===0?(i+1)%sides:i),j*sides+(j===0?i:(i+1)%sides));}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(parent,g,color,kind);
}
function boneAt(parent,p){const b=new T.Bone();b.position.copy(V(p));parent.add(b);return b;}
function makeSegments(rig){
  const result=[{name:'pelvis',a:rig.pelvis,b:{...rig.pelvis,z:rig.pelvis.z+12}},
    {name:'chest',a:rig.body,b:{...rig.body,z:rig.body.z+16}},
    {name:'head',a:rig.head,b:{...rig.head,z:rig.head.z+8}}];
  for(const l of rig.legs){result.push({name:'thigh'+l.index,a:l.root,b:l.joint},{name:'shin'+l.index,a:l.joint,b:l.hock||l.end});if(l.hock)result.push({name:'hock'+l.index,a:l.hock,b:l.end});result.push({name:'foot'+l.index,a:l.end,b:{...l.end,x:l.end.x+8}});}
  for(const a of rig.arms)result.push({name:'arm'+a.side,a:a.root,b:a.joint},{name:'forearm'+a.side,a:a.joint,b:a.end},{name:'hand'+a.side,a:a.end,b:{...a.end,z:a.end.z+4}});
  return result;
}
// Smooth-union implicit sculpture. The skin is one welded surface, including
// neck/torso and all limb roots, with continuous bone weights at the joins.
function organicSkin(parent,id,bind,bones,index){
  const p=palettes[id],wolf=id==='wolf',shapes=[];
  const ell=(c,r,b)=>shapes.push({c:V(c),r:new T.Vector3(...r),bone:index[b],ell:true});
  const cap=(a,b,r,bone)=>shapes.push({a:V(a),b:V(b),r,bone:index[bone]});
  const d=RIGS[id];
  if(wolf){
    ell(bind.body,[26,9.5,12],'chest');ell({...bind.body,x:-16,z:bind.body.z-1},[13,10,12],'pelvis');
    cap({...bind.body,x:16,z:bind.body.z+4},bind.head,8,'head');ell(bind.head,[11,8.5,10],'head');
    ell({...bind.head,x:bind.head.x+10,z:bind.head.z-4},[11,5.5,5.5],'head');
  }else{
    ell({...bind.pelvis,z:bind.pelvis.z+3},[8,d.stance+3,10],'pelvis');
    ell({...bind.body,z:bind.body.z-2},[id==='orc'?11:7.5,d.shoulder*0.74,17],'chest');
    cap({...bind.body,z:bind.body.z+12},{...bind.head,z:bind.head.z-5},id==='orc'?6:3.5,'head');
    ell({...bind.head,x:bind.head.x+0.4},id==='orc'?[10,11.5,12.5]:id==='knight'?[8,8.4,10.5]:[7.8,7.7,10.5],'head');
  }
  for(const l of bind.legs){
    cap(l.root,l.joint,wolf?l.front?4:5.5:id==='orc'?7:4.7,'thigh'+l.index);
    cap(l.joint,l.hock||l.end,wolf?3.1:id==='orc'?5.3:3.5,'shin'+l.index);
    if(l.hock)cap(l.hock,l.end,2.6,'hock'+l.index);
    ell({...l.end,x:l.end.x+3,z:3.5},wolf?[6,4,3.5]:[7,id==='orc'?5:3.5,4],'foot'+l.index);
  }
  for(const a of bind.arms){cap({...bind.body,z:a.root.z-5},a.root,id==='orc'?7:4.5,'chest');cap(a.root,a.joint,id==='orc'?7:4,'arm'+a.side);cap(a.joint,a.end,id==='orc'?5:3.3,'forearm'+a.side);ell(a.end,[id==='orc'?4.7:3.2,3.3,4.5],'hand'+a.side);}
  const distance=(s,x,y,z)=>{
    if(s.ell){const dx=(x-s.c.x)/s.r.x,dy=(y-s.c.y)/s.r.y,dz=(z-s.c.z)/s.r.z;return (Math.hypot(dx,dy,dz)-1)*Math.min(s.r.x,s.r.y,s.r.z);}
    const ax=x-s.a.x,ay=y-s.a.y,az=z-s.a.z,bx=s.b.x-s.a.x,by=s.b.y-s.a.y,bz=s.b.z-s.a.z,t=Math.max(0,Math.min(1,(ax*bx+ay*by+az*bz)/(bx*bx+by*by+bz*bz||1)));
    return Math.hypot(ax-bx*t,ay-by*t,az-bz*t)-s.r;
  };
  const field=(x,y,z)=>{let a=1000;for(const s of shapes){const b=distance(s,x,y,z),h=Math.max(2.4-Math.abs(a-b),0)/2.4;a=Math.min(a,b)-h*h*0.6;}return a;};
  const step=2.5,xMin=-40,xMax=52,yMin=-38,yMax=38,zMin=-3,zMax=125;
  const nx=Math.ceil((xMax-xMin)/step),ny=Math.ceil((yMax-yMin)/step),nz=Math.ceil((zMax-zMin)/step),values=new Float32Array((nx+1)*(ny+1)*(nz+1));
  const at=(x,y,z)=>((z*(ny+1)+y)*(nx+1)+x);
  for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)values[at(x,y,z)]=field(xMin+x*step,yMin+y*step,zMin+z*step);
  const positions=[],indices=[],skinIndices=[],weights=[],colors=[],vertexMap=new Map(),color=new T.Color(p.skin),cloth=new T.Color(p.cloth);
  const vertex=v=>{
    const key=v.map(n=>Math.round(n*10000)).join(',');if(vertexMap.has(key))return vertexMap.get(key);
    const i=positions.length/3;positions.push(...v);vertexMap.set(key,i);
    const contributions=new Map();for(const s of shapes){const dd=distance(s,...v),w=Math.exp(-Math.max(0,dd)*0.65);contributions.set(s.bone,(contributions.get(s.bone)||0)+w);}
    const top=[...contributions].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((a,b)=>a+b[1],0);
    for(let j=0;j<4;j++){skinIndices.push(top[j]?.[0]||0);weights.push((top[j]?.[1]||0)/sum);}
    const face=v[2]>bind.head.z-14,skin=id==='knight'&&face?new T.Color(p.metal):id==='orc'||wolf||face?color:cloth;const shade=0.88+0.12*Math.cos(v[2]*0.1);colors.push(skin.r*shade,skin.g*shade,skin.b*shade);return i;
  };
  const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const f=corners.map(c=>values[at(x+c[0],y+c[1],z+c[2])]);if(f.every(n=>n>=0)||f.every(n=>n<0))continue;
    const points=corners.map(c=>[xMin+(x+c[0])*step,yMin+(y+c[1])*step,zMin+(z+c[2])*step]);
    for(const t of tetra){const inside=t.filter(i=>f[i]<0),outside=t.filter(i=>f[i]>=0);if(!inside.length||!outside.length)continue;
      const cross=(a,b)=>points[a].map((n,j)=>n+(points[b][j]-n)*f[a]/(f[a]-f[b]));
      const polygon=[];for(const a of inside)for(const b of outside)polygon.push(cross(a,b));
      if(polygon.length===4)[polygon[2],polygon[3]]=[polygon[3],polygon[2]];
      for(let j=1;j<polygon.length-1;j++){
        const a=polygon[0],b=polygon[j],c=polygon[j+1],ab=V({x:b[0]-a[0],y:b[1]-a[1],z:b[2]-a[2]}),ac=V({x:c[0]-a[0],y:c[1]-a[1],z:c[2]-a[2]}),n=ab.cross(ac),center=a.map((v,i)=>(v+b[i]+c[i])/3);
        const grad=new T.Vector3(field(center[0]+0.1,center[1],center[2])-field(center[0]-0.1,center[1],center[2]),field(center[0],center[1]+0.1,center[2])-field(center[0],center[1]-0.1,center[2]),field(center[0],center[1],center[2]+0.1)-field(center[0],center[1],center[2]-0.1));
        indices.push(vertex(a),vertex(n.dot(grad)>0?b:c),vertex(n.dot(grad)>0?c:b));
      }
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  const material=mat(0xffffff,'skin').clone();material.vertexColors=true;
  const skin=new T.SkinnedMesh(g,material);skin.add(...bones);skin.bind(new T.Skeleton(bones));skin.frustumCulled=false;parent.add(skin);return skin;
}

function armorSegment(bone,length,radius,p,knight,leg=false){
  if(knight){
    rings(bone,[{x:0,y:0,z:-2,rx:radius*0.8,ry:radius*0.9},{x:0,y:0,z:length*0.25,rx:radius*1.15,ry:radius},{x:0,y:0,z:length*0.8,rx:radius*0.87,ry:radius*0.82},{x:0,y:0,z:length+1,rx:radius*0.72,ry:radius*0.78}],p.metal,'metal');
    for(const z of [0,length*0.85])rings(bone,[{x:0,y:0,z:z-0.6,rx:radius+0.4,ry:radius+0.4},{x:0,y:0,z:z+0.6,rx:radius+0.4,ry:radius+0.4}],p.edge,'metal');
    tube(bone,[{x:radius*0.9,y:-1,z:2},{x:radius*1.08,y:0,z:length*0.4},{x:radius*0.85,y:0,z:length-2}],0.45,p.edge,'metal');
  }else{
    rings(bone,[{x:0,y:0,z:length*0.37,rx:radius*1.12,ry:radius*1.12},{x:0,y:0,z:length*0.94,rx:radius*0.85,ry:radius*0.9}],leg?p.leather:p.metal,leg?'cloth':'metal');
    for(const z of [length*0.45,length*0.8])rings(bone,[{x:0,y:0,z:z-0.9,rx:radius*1.14,ry:radius*1.14},{x:0,y:0,z:z+0.9,rx:radius*1.14,ry:radius*1.14}],p.edge,'metal');
  }
}
function face(head,id,p){
  const orc=id==='orc',wide=orc?11:7.8,front=orc?9.2:7;
  for(const sign of [-1,1]){
    ball(head,{x:front,y:sign*wide*0.39,z:2},[0.55,1.3,0.65],0xd5c6a3,'skin');
    ball(head,{x:front+0.5,y:sign*wide*0.37,z:2},[0.3,0.5,0.58],orc?0xd2a53e:0x668474,'skin');
    ball(head,{x:front+0.72,y:sign*wide*0.37,z:2},[0.12,0.22,0.42],0x182022);
    tube(head,[{x:front,y:sign*wide*0.2,z:4},{x:front+0.4,y:sign*wide*0.38,z:4.2},{x:front-0.5,y:sign*wide*0.6,z:3.5}],0.65,orc?0x3a472d:0x675140);
  }
  ball(head,{x:front+0.7,y:0,z:-0.5},[2.2,1.5,2.8],p.skin,'skin');
  tube(head,[{x:front-0.1,y:-2.1,z:-4},{x:front+1.2,y:0,z:-4.6},{x:front-0.1,y:2.1,z:-4}],0.5,orc?0x3d4c32:0x875e56,'skin');
  if(orc){
    ball(head,{x:7,y:0,z:-7},[7,8,4.5],p.skin,'skin');
    for(const side of [-1,1]){
      rod(head,{x:9,y:side*5,z:-6},{x:12,y:side*5,z:0},1.9,0.15,0xe4d8b5,'skin');
      const ear=mesh(head,new T.ConeGeometry(3.8,13,4),p.skin,'skin');ear.position.set(-1,side*13,-1);ear.rotation.x=side*Math.PI/2;
    }
    tube(head,[{x:-1,y:0,z:10},{x:-4,y:0,z:15},{x:-8,y:0,z:12}],3,0x2c3327);
  }else if(id==='elf'){
    for(const side of [-1,1]){const ear=mesh(head,new T.ConeGeometry(2.2,11,6),p.skin,'skin');ear.position.set(-1,side*9,0);ear.rotation.x=side*Math.PI/2;}
  }
}
function humanoidDetails(model,id){
  const {nodes,palette:p,bind}=model,knight=id==='knight',orc=id==='orc',caster=id==='caster',d=RIGS[id],chest=nodes.chest,head=nodes.head,pelvis=nodes.pelvis;
  rings(chest,[{x:0,y:0,z:-16,rx:orc?10:7.7,ry:d.stance+4},{x:0,y:0,z:-7,rx:orc?12:9,ry:d.shoulder*0.66},{x:0,y:0,z:7,rx:orc?12:9.7,ry:d.shoulder*0.9},{x:0,y:0,z:13,rx:orc?9:7.4,ry:d.shoulder*0.65}],knight?p.metal:p.cloth,knight?'metal':'cloth');
  // Raised collar shares the chest bone and meets the continuous neck skin.
  rings(chest,[{x:0,y:0,z:11,rx:5.3,ry:6},{x:0,y:0,z:15,rx:4.8,ry:5.4}],p.edge,'metal');
  rings(pelvis,[{x:0,y:0,z:3,rx:9,ry:d.stance+5},{x:0,y:0,z:7,rx:9.4,ry:d.stance+5}],p.leather);
  box(pelvis,{x:10,y:0,z:5},[1.5,5,5],p.edge);box(pelvis,{x:11,y:0,z:5},[0.5,3,3],p.leather);
  for(const a of bind.arms){
    const upper=nodes['arm'+a.side],fore=nodes['forearm'+a.side],hand=nodes['hand'+a.side];
    ball(upper,{x:0,y:0,z:1},orc?[9,10,7]:[6,7,5],p.metal,'metal');
    armorSegment(fore,a.lower,orc?5.5:3.7,p,knight);
    if(knight)armorSegment(upper,a.upper,4.5,p,true);
    ball(hand,{x:0,y:0,z:0},[orc?4.3:3,3,4],knight?p.metal:p.leather,knight?'metal':'cloth');
    if(orc)for(let i=0;i<3;i++)rod(upper,{x:0,y:(i-1)*5,z:4},{x:2,y:(i-1)*5,z:12+i%2*3},2,0,0xc2b79b,'metal');
  }
  for(const l of bind.legs){
    armorSegment(nodes['shin'+l.index],l.lower,orc?5.5:3.7,p,knight,true);
    if(knight)armorSegment(nodes['thigh'+l.index],l.upper,5,p,true,true);
    ball(nodes['shin'+l.index],{x:0,y:0,z:-0.5},[4.8,4.9,4.3],p.metal,'metal');
    const foot=nodes['foot'+l.index];ball(foot,{x:3,y:0,z:1},[8,orc?5:3.8,3.6],knight?p.metal:p.leather,knight?'metal':'cloth');
    ball(foot,{x:3,y:0,z:-1.8},[8,orc?5:3.8,1.2],p.leather);
  }
  if(knight){
    ball(head,{x:-0.5,y:0,z:1},[9.2,9.7,12.4],p.metal,'metal');
    ball(head,{x:7.5,y:0,z:1},[3,8.6,8.9],0x81959e,'metal');
    for(const side of [-1,1]){
      tube(head,[{x:10.6,y:side*0.8,z:4},{x:10.4,y:side*4,z:4.5},{x:9.3,y:side*7,z:3.8}],0.65,0x17242b);
      for(let i=0;i<3;i++)ball(head,{x:10.5-i*0.1,y:side*(1.8+i*1.2),z:-3},[0.16,0.34,1],0x263940);
      for(const z of [-6,7])ball(head,{x:8.5,y:side*6.5,z},[0.65,0.65,0.65],p.edge,'metal');
    }
    tube(head,[{x:9.5,y:0,z:9},{x:11.2,y:0,z:1},{x:9.6,y:0,z:-6}],0.7,p.edge,'metal');
    tube(head,[{x:4,y:0,z:12},{x:-3,y:0,z:14},{x:-8,y:0,z:8}],1.2,p.edge,'metal');
    for(let i=0;i<9;i++)tube(head,[{x:3-i*0.8,y:(i%3-1)*0.7,z:13},{x:-2-i*0.9,y:(i%3-1)*1.1,z:23-i*0.2},{x:-10-i*0.9,y:0,z:18-i*0.45},{x:-13-i*0.8,y:0,z:8-i*0.2}],0.75+i%2*0.25,i%2?0x9e3439:0xc04d48);
    const tabard=rings(chest,[{x:9.7,y:0,z:9,rx:0.8,ry:6},{x:10.5,y:0,z:-7,rx:0.8,ry:6.5},{x:9.7,y:0,z:-20,rx:0.8,ry:7}],p.cloth);model.tabard=tabard;
    tube(chest,[{x:11.5,y:0,z:6},{x:11.5,y:0,z:-5}],0.7,p.edge,'metal');tube(chest,[{x:11.5,y:-3,z:1},{x:11.5,y:3,z:1}],0.7,p.edge,'metal');
    for(const side of [-1,1]){
      tube(chest,[{x:9.5,y:side*7,z:9},{x:10.3,y:side*8,z:-4},{x:9.5,y:side*7,z:-11}],0.5,p.edge,'metal');
      for(let i=0;i<3;i++)tube(chest,[{x:10,y:side*(8+i*1.8),z:6-i*2},{x:10.5,y:side*(9+i),z:3-i*2},{x:10,y:side*(10+i),z:2-i*2}],0.28,p.edge,'metal');
    }
  }else{
    face(head,id,p);
    if(orc){
      tube(chest,[{x:12,y:-16,z:10},{x:13,y:0,z:-2},{x:10,y:12,z:-15}],2.4,p.leather);
      for(let i=0;i<6;i++)ball(chest,{x:14,y:-12+i*4,z:8-i*3},[0.8,1,1],p.edge,'metal');
      for(const side of [-1,1])ball(pelvis,{x:-1,y:side*9,z:1},[8,7,4],0x59483a);
    }else{
      const hair=caster?0x403644:0xb39a61;
      ball(head,{x:-2,y:0,z:6},[7.8,8.3,7],hair);
      for(const side of [-1,1])for(let i=0;i<4;i++)tube(head,[{x:2-i*1.6,y:side*7,z:5},{x:-3-i*0.8,y:side*8.5,z:-2},{x:-5-i*0.5,y:side*7.5,z:-13}],1.2,hair);
      for(const side of [-1,1])tube(chest,[{x:8,y:side*11,z:8},{x:9,y:side*6,z:0},{x:9,y:side*5,z:-11}],0.6,p.edge,'metal');
      if(caster){
        const hood=rings(head,[{x:-3,y:0,z:-8,rx:8.9,ry:10},{x:-3,y:0,z:3,rx:8.5,ry:10},{x:-3,y:0,z:12,rx:5,ry:6},{x:-3,y:0,z:14,rx:0.8,ry:1}],0xc0b9a1);model.hood=hood;
        // Open facial aperture remains in front of the hood's x=5.5 surface.
        for(const side of [-1,1])tube(head,[{x:4,y:side*5,z:10},{x:6,y:side*8,z:3},{x:5,y:side*8,z:-7}],0.8,p.edge,'metal');
        ball(chest,{x:10,y:0,z:5},[1.5,3,3],0x65b5c7,'metal');
      }else{
        tube(head,[{x:4,y:-6,z:8},{x:7,y:0,z:9},{x:4,y:6,z:8}],0.6,p.edge,'metal');
        ball(head,{x:7.5,y:0,z:8.5},[0.6,1.2,1.4],0x538a78,'metal');
        model.quiver=new T.Group();chest.add(model.quiver);model.quiver.position.set(-10,-7,1);model.quiver.rotation.x=-0.22;
        rod(model.quiver,{x:0,y:0,z:-12},{x:0,y:0,z:11},3.8,4.3,p.leather,'cloth');
        for(let i=0;i<4;i++){rod(model.quiver,{x:(i%2)*2-1,y:Math.floor(i/2)*2-1,z:-5},{x:(i%2)*2-1,y:Math.floor(i/2)*2-1,z:19+i%2},0.3,0.3,0xc9b48a,'cloth');ball(model.quiver,{x:(i%2)*2-1,y:Math.floor(i/2)*2-1,z:16+i%2},[0.6,1.1,3],0xb2b5a4);}
      }
      // Short split cloak, attached to the spine, with animated cloth ribs.
      model.cloak=[];
      for(let i=0;i<5;i++){
        const strip=new T.Group();chest.add(strip);strip.position.set(-7,(i-2)*4,9);
        rings(strip,[{x:0,y:0,z:0,rx:1,ry:2.4},{x:-3,y:0,z:-18,rx:0.8,ry:3},{x:-5,y:0,z:caster?-48:-36,rx:0.5,ry:3.6}],caster?0x79718b:0x355a45);model.cloak.push(strip);
      }
    }
  }
}
function wolfDetails(model){
  const {nodes,palette:p}=model,head=nodes.head;
  ball(head,{x:18,y:0,z:-4},[3.2,4.3,3],0x302c29,'skin');
  for(const side of [-1,1]){
    const ear=mesh(head,new T.ConeGeometry(4,13,5),p.skin,'skin');ear.position.set(-2,side*7,11);ear.rotation.x=0;ear.rotation.z=-0.17;ear.rotation.x=Math.PI/2;
    // Cone geometry points along +Y, rotate to +Z, then splay outward.
    ear.rotation.x=Math.PI/2;ear.rotation.y=side*0.18;
    ball(head,{x:7,y:side*6,z:3},[1.9,1.1,1.1],0xdeb36a,'skin');ball(head,{x:8,y:side*6,z:3},[0.55,0.6,0.8],0x171c16);
    tube(head,[{x:12,y:side*4,z:-7},{x:6,y:side*6,z:-7},{x:2,y:side*7,z:-6}],0.6,0x423b32);
    ball(head,{x:5,y:side*6,z:-6},[8,3,3.5],p.edge,'skin');
  }
  model.tail=new T.Group();nodes.pelvis.add(model.tail);model.tail.position.set(-19,0,6);
  tube(model.tail,[{x:0,y:0,z:0},{x:-9,y:0,z:3},{x:-18,y:0,z:6},{x:-25,y:0,z:2}],3.8,p.skin,'skin');
  tube(model.tail,[{x:-20,y:0,z:5},{x:-27,y:0,z:1}],3,p.edge,'skin');
  // Neck ruff follows the shoulder contour instead of a row of rounded beads.
  for(let i=0;i<9;i++){const a=i/8*Math.PI*2;const tuft=mesh(nodes.chest,new T.ConeGeometry(3,7,5),i%2?0x775139:0x886040,'skin');tuft.position.set(14+Math.sin(a)*3,Math.cos(a)*8,Math.sin(a)*8);tuft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-0.8,Math.cos(a)*0.3,Math.sin(a)*0.3).normalize());}
  for(const l of model.bind.legs){
    const foot=nodes['foot'+l.index];ball(foot,{x:3,y:0,z:-0.7},[6,3.8,2.9],p.edge,'skin');
    for(let i=-1;i<=1;i++)ball(foot,{x:6,y:i*1.8,z:-1.2},[2.5,0.9,1.3],p.edge,'skin');
  }
}
function weapon(model,id){
  const p=model.palette,g=new T.Group();model.root.add(g);model.weapon=g;
  if(id==='knight'){
    rod(g,{x:0,y:0,z:-9},{x:0,y:0,z:5},1.2,1.3,p.leather,'cloth');
    rod(g,{x:0,y:-7,z:5},{x:0,y:7,z:5},0.9,0.9,p.edge);ball(g,{x:0,y:0,z:-10},[2,2,2],p.edge,'metal');
    const shape=new T.Shape();shape.moveTo(-3,5);shape.lineTo(-3,36);shape.lineTo(0,45);shape.lineTo(3,36);shape.lineTo(3,5);shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:0.6,bevelThickness:0.3});geo.rotateX(Math.PI/2);geo.rotateZ(Math.PI/2);mesh(g,geo,0xc0c9c7,'metal');
    tube(g,[{x:0.8,y:0,z:7},{x:0.8,y:0,z:36},{x:0,y:0,z:44}],0.35,0xe4e0ca,'metal');
    model.shield=new T.Group();model.root.add(model.shield);
    const s=new T.Shape();s.moveTo(-9,14);s.quadraticCurveTo(0,17,9,14);s.lineTo(8,-5);s.quadraticCurveTo(5,-12,0,-16);s.quadraticCurveTo(-7,-10,-8,-5);s.closePath();
    const sg=new T.ExtrudeGeometry(s,{depth:2,bevelEnabled:true,bevelSize:0.8,bevelThickness:0.5,bevelSegments:2});sg.rotateX(Math.PI/2);sg.rotateZ(Math.PI/2);mesh(model.shield,sg,p.edge,'metal');
    box(model.shield,{x:2.5,y:0,z:1},[0.6,13,22],p.cloth);box(model.shield,{x:3,y:0,z:1},[0.5,1.6,17],p.edge);box(model.shield,{x:3,y:0,z:4},[0.5,8,1.6],p.edge);
  }else if(id==='orc'){
    rod(g,{x:0,y:0,z:-17},{x:0,y:0,z:44},1.8,1.4,p.leather,'cloth');
    for(const z of [-12,-7,3,9,24])rod(g,{x:0,y:0,z:z-0.9},{x:0,y:0,z:z+0.9},2.1,2.1,p.edge);
    const s=new T.Shape();s.moveTo(-1,26);s.lineTo(-14,29);s.quadraticCurveTo(-22,37,-15,46);s.lineTo(-1,40);s.lineTo(4,38);s.lineTo(4,30);s.closePath();
    const geo=new T.ExtrudeGeometry(s,{depth:3,bevelEnabled:true,bevelThickness:0.8,bevelSize:0.6,bevelSegments:2});geo.rotateX(Math.PI/2);geo.rotateZ(Math.PI/2);mesh(g,geo,p.metal,'metal');
    rod(g,{x:0,y:-15,z:30},{x:0,y:-15,z:45},0.65,0.65,0xbac4bd);
  }else if(id==='elf'){
    tube(g,[{x:0,y:0,z:-25},{x:7,y:0,z:-18},{x:7,y:0,z:-9},{x:0,y:0,z:0},{x:7,y:0,z:9},{x:7,y:0,z:18},{x:0,y:0,z:25}],1.4,p.leather);
    for(const z of [-15,15])ball(g,{x:7,y:0,z},[1.8,1.6,2],p.edge,'metal');
    model.string=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xdbcdad}));g.add(model.string);
    model.nocked=rod(g,{x:-24,y:0,z:0},{x:21,y:0,z:0},0.3,0.3,0xddceab,'cloth');model.nocked.userData.dynamic=true;
  }else if(id==='caster'){
    rod(g,{x:0,y:0,z:-22},{x:0,y:0,z:34},1.2,1.5,p.leather,'cloth');
    for(const side of [-1,1])tube(g,[{x:0,y:side*2,z:30},{x:0,y:side*5,z:35},{x:0,y:side*4,z:43},{x:0,y:0,z:46}],0.8,p.edge,'metal');
    const crystal=mesh(g,new T.OctahedronGeometry(4.7),0x79bed1,'metal');crystal.position.z=43;crystal.scale.set(0.8,0.8,1.4);model.crystal=crystal;
  }
}
function batchRigidDetails(node){
  for(const child of node.children.slice())if(!child.isMesh&&!child.isLine)batchRigidDetails(child);
  const batches=new Map();
  for(const child of node.children)if(child.isMesh&&!child.isSkinnedMesh&&!child.userData.dynamic){const key=child.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);}
  for(const meshes of batches.values())if(meshes.length>1){
    const geometries=meshes.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.deleteAttribute('uv');g.applyMatrix4(m.matrix);return g;});
    const combined=new T.Mesh(mergeGeometries(geometries,false),meshes[0].material);node.add(combined);
    for(const m of meshes)node.remove(m);for(const g of geometries)g.dispose();
  }
}
export function createCharacterModel(id){
  if(models.has(id))return models.get(id);
  const bind=characterRig(id,'idle',0.25),segments=makeSegments(bind),root=new T.Group(),bones=[],nodes={},index={};
  for(const s of segments){index[s.name]=bones.length;const bone=boneAt(root,s.a);bone.name=s.name;bones.push(bone);nodes[s.name]=bone;}
  root.updateMatrixWorld(true);
  const skin=organicSkin(root,id,bind,bones,index),model={id,root,skin,nodes,bind,segments,palette:palettes[id]};
  if(id==='wolf')wolfDetails(model);else{humanoidDetails(model,id);weapon(model,id);}
  batchRigidDetails(root);
  skin.name='skin';model.accessories={};
  for(const [name,bone] of Object.entries(nodes)){const a=new T.Group();a.name='parts-'+name;const children=bone.children.slice();bone.add(a);for(const child of children)a.add(child);model.accessories[name]=a;}
  for(const name of ['weapon','shield','tail','string','nocked','crystal'])if(model[name])model[name].name='detail-'+name;
  model.cloak?.forEach((strip,i)=>strip.name='cloak-'+i);
  root.userData={id,skinned:true,vertices:skin.geometry.attributes.position.count,bones:bones.length};models.set(id,model);return model;
}
export function cloneCharacterModel(id){
  const original=createCharacterModel(id),root=cloneSkeleton(original.root),model={...original,root,nodes:{},accessories:{},skin:root.getObjectByName('skin')};
  root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.set(1,1,1);
  for(const name of Object.keys(original.nodes)){model.nodes[name]=root.getObjectByName(name);model.accessories[name]=root.getObjectByName('parts-'+name);}
  for(const name of ['weapon','shield','tail','string','nocked','crystal'])model[name]=root.getObjectByName('detail-'+name);
  if(model.string)model.string.geometry=model.string.geometry.clone();
  model.cloak=original.cloak?.map((_,i)=>root.getObjectByName('cloak-'+i));return model;
}
export function poseCharacterModel(model,rig){
  const current=makeSegments(rig);
  for(let i=0;i<current.length;i++){
    const s=current[i],bind=model.segments[i],b=model.nodes[s.name];b.position.copy(V(s.a));
    const before=V(bind.b).sub(V(bind.a)).normalize(),after=V(s.b).sub(V(s.a)).normalize();b.quaternion.setFromUnitVectors(before,after);
    // Segment accessories were authored along +Z, independently of bind bone.
    const parts=model.accessories[s.name];parts.quaternion.setFromUnitVectors(Z,before);
    if(s.name.startsWith('foot')){const foot=rig.legs[Number(s.name.slice(4))]?.foot;b.quaternion.setFromEuler(new T.Euler(0,foot?.pitch||0,foot?.angle||0,'ZYX'));parts.quaternion.identity();}
    if(s.name==='head'){b.quaternion.setFromEuler(new T.Euler(-(rig.sideLean||0)*0.25,rig.lean*0.25,0,'ZYX'));parts.quaternion.identity();}
    if(s.name==='chest'){b.quaternion.setFromEuler(new T.Euler(-(rig.sideLean||0),rig.lean,rig.torsoYaw||0,'ZYX'));parts.quaternion.identity();}
    if(s.name==='pelvis'){b.quaternion.setFromAxisAngle(Z,-(rig.torsoYaw||0)*0.4);parts.quaternion.identity();}
  }
  if(model.cloak)model.cloak.forEach((strip,i)=>{strip.rotation.y=-rig.lean*0.45+Math.sin(rig.phase*Math.PI*2-i*0.25)*(['walk','run','sprint'].includes(rig.state)?0.055:0.015);});
  if(model.tail)model.tail.rotation.z=Math.sin(rig.phase*Math.PI*2-0.7)*0.2;
  if(model.weapon&&rig.weapon){
    model.weapon.position.copy(V(rig.weapon.grip));model.weapon.quaternion.setFromUnitVectors(Z,V(rig.weapon.axis));
    if(model.string){const draw=rig.bowString?.draw||0;model.string.geometry.setFromPoints([new T.Vector3(0,0,25),new T.Vector3(-draw*24,0,0),new T.Vector3(0,0,-25)]);model.nocked.visible=draw>0.05&&rig.stage==='windup';}
    if(model.shield){model.shield.position.copy(V(rig.shield.grip));model.shield.rotation.z=-0.25;}
  }
  model.root.updateMatrixWorld(true);model.skin.skeleton.update();
}
export function characterModelStats(){return [...models.values()].map(m=>({id:m.id,...m.root.userData,triangles:m.skin.geometry.index.count/3}));}
