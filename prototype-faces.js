import {drawFamilyFace} from './native-faces.js';
import {paintAuthoredFace} from './authored-pixel-art.js';
import {FACE_OUTLINE as OUT,faceShape,faceEyes,hairShape} from './pixel-face-tools.js';
// A facing owns its features. Rear views never borrow front-facing eyes.
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
export function drawNativeFace(b,id,center,dir,p,rig){
 if(paintAuthoredFace(b,id,center,dir,p,rig))return;
 if(drawFamilyFace(b,center,dir,p,rig,FACE_VIEWS))return;
 const x=Math.round(center.x),y=Math.round(center.y),v=FACE_VIEWS[dir],back=!v.eyes.length,profile=v.view==='profile',quarter=v.view==='quarter',s=v.sign,dead=rig.death>0;
 const oval=(x,y,rx,ry,c)=>{b.oval(x,y,rx+1,ry+1,OUT);b.oval(x,y,rx,ry,c);},eyes=color=>faceEyes(b,x,y,v,color,p,rig.state,rig.death);
 if(id==='knight'){
  const rx=profile?6:7;
  b.outlined([{x:x-rx,y:y-3},{x:x-rx+1,y:y-6},{x:x-3,y:y-8},{x:x+2,y:y-8},{x:x+rx,y:y-5},{x:x+rx,y:y+4},{x:x+rx-2,y:y+7},{x:x-rx+2,y:y+7},{x:x-rx,y:y+4}],p.metal[0]);
  b.poly([{x:x-rx+1,y:y-3},{x:x-rx+2,y:y-5},{x:x-3,y:y-7},{x:x+2,y:y-7},{x:x+rx-1,y:y-4},{x:x+rx-1,y:y+3},{x:x+3,y:y+5},{x:x-rx+1,y:y+3}],p.metal[1]);
  b.poly([{x:x-rx+2,y:y-4},{x:x-3,y:y-6},{x:x,y:y-6},{x:x+2,y:y-3},{x:x-1,y:y-2},{x:x-rx+2,y:y-2}],p.metal[2]);
  b.line({x:x-rx+3,y:y-5},{x:x,y:y-6},p.metal[3]);
  if(back){b.line({x:x+s*2,y:y-5},{x:x+s*2,y:y+3},p.metal[0]);b.rect(x-3,y+4,6,2,p.metal[0]);b.rect(x-2,y+4,4,1,p.metal[1]);for(const dx of [-5,5])b.dot(x+dx,y+1,p.metal[2]);}
  else{
   const faceX=x+(profile?s*3:quarter?s:0),w=profile?5:quarter?9:11;
   b.rect(faceX-Math.floor(w/2),y-1,w,3,OUT);
   for(const dx of v.eyes){b.dot(x+dx,y,p.metal[3]);if(!profile)b.dot(x+dx,y+1,p.skin[0]);}
   b.rect(faceX-(profile?1:3),y+2,profile?3:6,2,p.skin[0]);b.line({x:faceX-1,y:y+2},{x:faceX+1,y:y+2},p.skin[1]);
   b.line({x:x+(profile?s*6:quarter?s*4:0),y:y-2},{x:x+(profile?s*6:quarter?s*4:0),y:y+4},p.metal[2]);
   b.line({x:x-rx+1,y:y+5},{x:x+rx-1,y:y+5},p.metal[0]);b.dot(x-rx+2,y+5,p.metal[2]);
  }
  // A thick feather cluster, attached to the helmet ridge.
  const wave=Math.round(Math.sin(rig.phase*Math.PI*2)*(['run','sprint'].includes(rig.state)?1:0));
  b.outlined([{x:x-1,y:y-7},{x:x-1,y:y-10},{x:x+1+wave,y:y-13},{x:x+4+wave,y:y-14},{x:x+5+wave,y:y-11},{x:x+3,y:y-10},{x:x+2,y:y-7}],p.hair[0]);
  b.poly([{x:x,y:y-8},{x:x,y:y-10},{x:x+2+wave,y:y-12},{x:x+4+wave,y:y-13},{x:x+4+wave,y:y-11},{x:x+2,y:y-9}],p.hair[1]);b.line({x:x+1,y:y-10},{x:x+3+wave,y:y-12},p.hair[2]);return;
 }
 if(id==='orc'){
  faceShape(b,x,y,profile?7:9,7,p,s,back);
  for(const side of profile?[-s]:[-1,1]){b.outlined([{x:x+side*8,y:y-2},{x:x+side*11,y:y-2},{x:x+side*9,y:y+1},{x:x+side*7,y:y+2}],p.skin[0]);b.dot(x+side*9,y-1,p.skin[1]);}
  b.rect(x-2,y-10,4,3,p.hair[0]);b.rect(x-1,y-9,2,2,p.hair[1]);
  if(back){b.line({x:x-4,y:y+4},{x:x+4,y:y+4},p.skin[0]);b.rect(x-1,y+5,2,2,p.skin[1]);return;}
  eyes('#dcca77');for(const dx of v.eyes)b.line({x:x+dx-2,y:y-3},{x:x+dx+1,y:y-2},p.skin[0]);
  const mx=x+(profile?s*5:quarter?s*2:0);b.rect(mx-2,y+4,5,2,p.skin[0]);b.line({x:mx-1,y:y+4},{x:mx+2,y:y+4},'#cdc498');
  for(const dx of profile?[s*5]:[-4+s,4+s]){b.rect(x+dx,y+2,2,3,p.metal[2]);b.dot(x+dx,y+1,p.metal[3]);}
  b.dot(x+(profile?s*6:s*2),y+2,p.skin[0]);return;
 }
 if(id==='wolf'||id==='fox'){
  const dog=id==='wolf',rx=profile?6:dog?5:7;
  oval(x,y,rx,dog?5:6,p.skin[0]);b.oval(x-1,y-1,rx-1,dog?4:5,p.skin[1]);b.oval(x-2,y-3,3,2,p.skin[2]);
  for(const side of profile?[-s]:[-1,1]){
   const dx=side*(dog?4:5);
   if(dog){b.outlined([{x:x+dx-2,y:y-4},{x:x+dx+2,y:y-4},{x:x+dx+2,y:y+1},{x:x+dx,y:y+3},{x:x+dx-2,y:y}],p.skin[0]);b.line({x:x+dx,y:y-3},{x:x+dx+1,y:y},p.skin[1]);}
   else{b.outlined([{x:x+dx-side*2,y:y-4},{x:x+dx+side,y:y-12},{x:x+dx+side*2,y:y-4}],p.skin[0]);b.poly([{x:x+dx,y:y-6},{x:x+dx+side,y:y-9},{x:x+dx+side,y:y-5}],p.skin[2]);}
  }
  if(back){b.line({x:x-3,y:y+4},{x:x+3,y:y+4},p.skin[0]);return;}
  const mx=x+(profile?s*5:quarter?s*3:0);b.poly([{x:mx-4,y:y+2},{x:mx-2,y:y+1},{x:mx+3,y:y+1},{x:mx+4,y:y+3},{x:mx+2,y:y+5},{x:mx-2,y:y+5},{x:mx-4,y:y+3}],p.metal[2]);b.line({x:mx-2,y:y+4},{x:mx+2,y:y+4},p.skin[0]);b.rect(mx-1+(profile?s:0),y+1,2,1,OUT);eyes(dog?'#b89658':'#e6bf61');return;
 }
 if(id==='mech'){
  b.outlined([{x:x-5,y:y-4},{x:x+3,y:y-5},{x:x+6,y:y-2},{x:x+5,y:y+4},{x:x-4,y:y+4},{x:x-6,y:y}],p.skin[0]);b.poly([{x:x-4,y:y-3},{x:x+2,y:y-4},{x:x+4,y:y-1},{x:x+3,y:y+3},{x:x-3,y:y+3}],p.skin[1]);b.line({x:x-3,y:y-3},{x:x+1,y:y-3},p.skin[2]);
  if(back){b.rect(x-3,y-1,6,3,p.metal[0]);for(const dx of [-2,0,2])b.rect(x+dx,y,1,2,p.metal[1]);}
  else{const q=x+(profile?s*3:quarter?s*2:0);oval(q,y,2,2,p.metal[0]);b.oval(q,y,1.5,1.5,p.hair[1]);b.dot(q-1,y-1,p.hair[2]);b.dot(x-4,y+2,p.metal[2]);}return;
 }
 if(id==='spider'){
  oval(x,y,profile?5:6,4,p.skin[0]);b.oval(x-1,y-1,4,3,p.skin[1]);b.line({x:x-3,y:y-2},{x:x+1,y:y-3},p.skin[2]);
  if(back){b.line({x:x-3,y:y-1},{x:x+2,y:y+1},p.hair[0]);return;}
  const positions=profile?[[s*3,-1],[s*4,1]]:quarter?[[s*1,-2],[s*3,-1],[s*5,0],[s*2,1]]:[[-4,-1],[-2,-2],[2,-2],[4,-1],[-2,1],[2,1]];
  for(const [dx,dy]of positions){b.dot(x+dx,y+dy,OUT);b.dot(x+dx,y+dy-1,p.hair[2]);}
  for(const dx of profile?[s*4]:[-2+s,2+s]){b.line({x:x+dx,y:y+2},{x:x+dx+s,y:y+5},OUT,1);b.line({x:x+dx,y:y+3},{x:x+dx+s,y:y+4},p.metal[2]);}return;
 }
 const silver=id==='caster',rx=profile?6:7;
 faceShape(b,x,y,rx,7,p,s,back);
 if(!silver)for(const side of profile?[-s]:[-1,1]){b.outlined([{x:x+side*5,y:y-1},{x:x+side*10,y:y-2},{x:x+side*6,y:y+2}],p.skin[0]);b.line({x:x+side*6,y:y},{x:x+side*8,y:y-1},p.skin[2]);}
 hairShape(b,x,y,v,p,{long:!silver,silver});
 if(!back){eyes(silver?'#9276ad':'#547c45');b.dot(x+(profile?s*6:quarter?s*3:0),y+2,p.skin[0]);b.rect(x+(profile?s*4:quarter?s*2:0)-1,y+4,2,1,p.skin[0]);}
 if(silver){if(!back){b.line({x:x-4,y:y-3},{x:x+4,y:y-3},p.metal[0]);b.line({x:x-3,y:y-3},{x:x+3,y:y-3},p.metal[2]);b.dot(x+s*2,y-3,'#4b99b7');b.dot(x+s*2,y-4,'#b6e5e0');}}
 else{const bx=x-(s||1)*5;for(let i=0;i<3;i++){b.rect(bx+(i%2),y+4+i*2,2,2,p.hair[i%2?0:1]);}b.rect(bx,y+10,2,1,p.cloth[2]);}
}
