import {drawFamilyFace} from './native-faces.js';
// Feature positions are authored per facing, never interpolated across a face.
// +X is forward and +Y is anatomical right; these layouts share that convention.
export const FACE_VIEWS=[
 {view:'profile',sign:1,eyes:[4],nose:7},
 {view:'quarter',sign:1,eyes:[0,5],nose:5},
 {view:'front',sign:0,eyes:[-3,3],nose:0},
 {view:'quarter',sign:-1,eyes:[-5,0],nose:-5},
 {view:'profile',sign:-1,eyes:[-4],nose:-7},
 {view:'rear-quarter',sign:-1,eyes:[],nose:0},
 {view:'back',sign:0,eyes:[],nose:0},
 {view:'rear-quarter',sign:1,eyes:[],nose:0},
];
export const FACE_IDENTITIES={knight:'gold visor and red crest',orc:'amber eyes, square jaw and ivory tusks',elf:'green eyes, swept blonde fringe and pointed ears',caster:'violet eyes, silver bob and blue circlet',fox:'amber eyes, dark ear tips and cream muzzle',wolf:'brown eyes, folded ears and cream jowls',mech:'single turquoise lens and brass brow',spider:'six violet eyes and paired ivory fangs',jelly:'navy eyes and pearl smile'};
const OUT='#20272a';
export function drawNativeFace(b,id,center,dir,p,rig){
 if(drawFamilyFace(b,center,dir,p,rig,FACE_VIEWS))return;
 const hx=Math.round(center.x),hy=Math.round(center.y),v=FACE_VIEWS[dir],back=!v.eyes.length,profile=v.view==='profile',quarter=v.view==='quarter',sign=v.sign,dead=rig.death>0;
 const oval=(x,y,rx,ry,c)=>{b.oval(x,y,rx+1,ry+1,OUT);b.oval(x,y,rx,ry,c);};
 const eye=(dx,color,far=false)=>{
  const x=hx+dx,y=hy;
  if(dead||['hit','stagger'].includes(rig.state)){b.rect(x-1,y,far?1:2,1,OUT);return;}
  b.rect(x-1,y-1,far?1:2,2,OUT);if(!far){b.dot(x-1,y-1,color);b.dot(x,y,p.skin[0]);}
 };
 if(id==='wolf'){
  oval(hx,hy,profile?6:5,5,p.skin[0]);b.oval(hx-1,hy-1,profile?5:4,4,p.skin[1]);b.oval(hx-2,hy-3,3,2,p.skin[2]);
  // Folded, asymmetric ears distinguish the hound from the upright-eared fox.
  const ears=profile?[-sign*4]:[-4,4];
  for(const dx of ears){b.outlined([{x:hx+dx-2,y:hy-4},{x:hx+dx+2,y:hy-4},{x:hx+dx+1,y:hy+1},{x:hx+dx-1,y:hy+2}],p.skin[0]);b.line({x:hx+dx,y:hy-3},{x:hx+dx,y:hy},p.skin[1]);}
  if(!back){const mx=hx+(profile?sign*5:quarter?sign*3:0),my=hy+3;oval(mx,my,profile?3:4,2,p.metal[2]);b.rect(mx+(profile?sign*2:quarter?sign:0)-1,my-1,2,1,OUT);b.dot(mx,my+1,p.skin[0]);v.eyes.forEach((dx,i)=>eye(profile?dx:dx*0.8,'#e8c385',quarter&&i===(sign>0?0:1)));}
  b.line({x:hx-3,y:hy+5},{x:hx+3,y:hy+5},p.cloth[1]);b.dot(hx+2,hy+6,p.metal[3]);return;
 }
 if(id==='mech'){
  b.outlined([{x:hx-5,y:hy-4},{x:hx+3,y:hy-4},{x:hx+5,y:hy-1},{x:hx+4,y:hy+4},{x:hx-4,y:hy+4}],p.skin[1]);b.line({x:hx-4,y:hy-3},{x:hx+2,y:hy-3},p.skin[2]);
  if(back){b.rect(hx-2,hy-1,4,3,p.metal[0]);b.line({x:hx-1,y:hy-1},{x:hx-1,y:hy+1},p.metal[2]);}
  else{const x=hx+(profile?sign*3:quarter?sign*2:0);oval(x,hy,2,2,p.metal[0]);b.oval(x,hy,1.5,1.5,p.hair[1]);b.dot(x-1,hy-1,p.hair[2]);}
  return;
 }
 if(id==='spider'){
  oval(hx,hy,profile?5:6,4,p.skin[0]);b.oval(hx-1,hy-1,4,3,p.skin[1]);
  if(!back){const eyes=profile?[sign*3]:quarter?[sign,sign*3,sign*5]:[-4,-2,0,2,4];for(const dx of eyes){b.dot(hx+dx,hy,p.hair[2]);if(Math.abs(dx)<=2)b.dot(hx+dx,hy-2,p.metal[3]);}for(const dx of profile?[sign*4]:[-2+sign,2+sign]){b.line({x:hx+dx,y:hy+2},{x:hx+dx+sign,y:hy+5},OUT,1);b.dot(hx+dx+sign,hy+4,p.metal[2]);}}
  else b.line({x:hx-3,y:hy-2},{x:hx+2,y:hy-2},p.hair[0]);return;
 }
 const rx=id==='orc'?9:id==='fox'?7:7,ry=dead?6:8;
 if(id==='knight'){
  oval(hx,hy,rx,ry,p.metal[0]);b.oval(hx-1,hy-1,rx-1,ry-1,p.metal[1]);b.oval(hx-2,hy-3,rx-3,3,p.metal[2]);
  if(back){b.line({x:hx+sign*2,y:hy-6},{x:hx+sign*2,y:hy+5},p.metal[2]);b.rect(hx-3,hy+4,6,2,p.metal[0]);b.dot(hx-4,hy+2,p.metal[3]);b.dot(hx+4,hy+2,p.metal[3]);}
  else{
   const x=hx+(profile?sign*3:quarter?sign*2:0),width=profile?5:quarter?8:10;b.rect(x-Math.floor(width/2),hy-1,width,3,OUT);
   v.eyes.forEach(dx=>b.dot(hx+dx,hy,p.metal[3]));b.line({x:hx+v.nose,y:hy-2},{x:hx+v.nose,y:hy+5},p.metal[3]);
   const vents=profile?[sign*4]:[-3+sign*2,3+sign*2];vents.forEach(dx=>{b.dot(hx+dx,hy+4,p.metal[0]);b.dot(hx+dx,hy+5,p.metal[0]);});
  }
  b.line({x:hx-4,y:hy-5},{x:hx+2,y:hy-6},p.metal[3]);const wave=Math.round(Math.sin(rig.phase*Math.PI*2)*(['run','sprint'].includes(rig.state)?1:0));
  b.outlined([{x:hx-1,y:hy-7},{x:hx+1,y:hy-12},{x:hx+4+wave,y:hy-15},{x:hx+5+wave,y:hy-11},{x:hx+1,y:hy-8}],p.hair[1]);b.line({x:hx+1,y:hy-12},{x:hx+3+wave,y:hy-13},p.hair[2]);return;
 }
 // Small bevels make a clear jaw instead of scattering highlights on an oval.
 b.outlined([{x:hx-rx,y:hy-4},{x:hx-rx+3,y:hy-7},{x:hx+rx-3,y:hy-7},{x:hx+rx,y:hy-4},{x:hx+rx,y:hy+3},{x:hx+rx-3,y:hy+7},{x:hx-rx+3,y:hy+7},{x:hx-rx,y:hy+3}],p.skin[1]);
 b.oval(hx-2,hy-3,rx-3,3,p.skin[2]);b.line({x:hx-rx+1,y:hy+2},{x:hx-rx+3,y:hy+5},p.skin[0]);
 if(id==='orc'){
  for(const s of [-1,1])b.outlined([{x:hx+s*8,y:hy-2},{x:hx+s*12,y:hy-3},{x:hx+s*9,y:hy+2}],p.skin[0]);
  b.rect(hx-2,hy-10,4,4,p.hair[0]);b.rect(hx-1,hy-10,2,2,p.hair[1]);
  if(back){b.line({x:hx-3,y:hy+2},{x:hx+3,y:hy+2},p.skin[0]);return;}
  v.eyes.forEach((dx,i)=>{eye(dx,'#efcd68',quarter&&i===(sign>0?0:1));b.rect(hx+dx-2,hy-3,3,1,p.skin[0]);});
  b.rect(hx+v.nose,hy+2,profile?1:2,1,p.skin[0]);const mx=hx+(profile?sign*4:quarter?sign*2:0);b.line({x:mx-3,y:hy+5},{x:mx+3,y:hy+5},p.skin[0]);
  for(const dx of profile?[sign*5]:[-4+sign,4+sign]){b.rect(hx+dx,hy+3,1,3,p.metal[3]);b.dot(hx+dx,hy+2,p.metal[2]);}return;
 }
 if(id==='fox'){
  for(const s of [-1,1]){b.outlined([{x:hx+s*6,y:hy-3},{x:hx+s*6,y:hy-12},{x:hx+s*2,y:hy-6}],p.skin[0]);b.line({x:hx+s*5,y:hy-6},{x:hx+s*5,y:hy-9},p.skin[2]);}
  if(back){b.oval(hx,hy+3,4,2,p.skin[0]);return;}
  const mx=hx+(profile?sign*5:quarter?sign*3:0);b.oval(mx,hy+3,profile?3:5,3,p.metal[2]);b.oval(mx+(profile?sign*2:0),hy+1,1,1,OUT);b.dot(mx,hy+4,p.skin[0]);v.eyes.forEach((dx,i)=>eye(dx,'#f2d077',quarter&&i===(sign>0?0:1)));return;
 }
 const silver=id==='caster';
 // Back hair is a continuous cap. Rear views never retain eyes or a mouth.
 if(back){b.oval(hx,hy-1,rx-1,ry-1,p.hair[1]);b.line({x:hx-4,y:hy-4},{x:hx+2,y:hy-5},p.hair[2]);for(const dx of [-4,0,4])b.line({x:hx+dx,y:hy},{x:hx+dx-sign,y:hy+5},p.hair[0]);}
 else{
  b.outlined([{x:hx-7,y:hy-1},{x:hx-6,y:hy-5},{x:hx-3,y:hy-8},{x:hx+3,y:hy-8},{x:hx+6,y:hy-5},{x:hx+6,y:hy-2},{x:hx+3-sign,y:hy-4},{x:hx-sign,y:hy-2},{x:hx-3,y:hy-4}],p.hair[1]);
  b.line({x:hx-4,y:hy-5},{x:hx+2,y:hy-6},p.hair[2]);v.eyes.forEach((dx,i)=>eye(dx,silver?'#b497de':'#75ae6b',quarter&&i===(sign>0?0:1)));
  b.dot(hx+v.nose,hy+2,p.skin[0]);b.rect(hx+(profile?sign*4:quarter?sign*2:0)-1,hy+4,2,1,p.skin[0]);
 }
 if(silver){for(const dx of profile?[-sign*5]:[-6,6]){b.line({x:hx+dx,y:hy-2},{x:hx+dx,y:hy+5},p.hair[0],1);b.line({x:hx+dx,y:hy-2},{x:hx+dx,y:hy+3},p.hair[2]);}if(!back){b.line({x:hx-4,y:hy-4},{x:hx+4,y:hy-4},p.metal[2]);b.dot(hx+sign*2,hy-4,'#5aafd2');}}
 else{
  for(const s of profile?[-sign]:[-1,1])b.line({x:hx+s*6,y:hy+1},{x:hx+s*10,y:hy},p.skin[2]);
  const bx=hx-(sign||1)*5;for(let i=0;i<4;i++){b.rect(bx+(i%2),hy+3+i*2,2,2,p.hair[i%2?0:1]);}b.dot(bx+1,hy+11,p.cloth[2]);
 }
}
