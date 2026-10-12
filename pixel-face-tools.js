// Integer, opaque clusters shared by the hero and creature face artists.
export const FACE_OUTLINE='#192328';
export function faceShape(b,x,y,rx,ry,p,sign=0,back=false){
 const O=FACE_OUTLINE;
 b.outlined([{x:x-rx,y:y-3},{x:x-rx+2,y:y-ry},{x:x+rx-2,y:y-ry},{x:x+rx,y:y-3},{x:x+rx,y:y+3},{x:x+rx-3,y:y+ry},{x:x-rx+3,y:y+ry},{x:x-rx,y:y+3}],p.skin[0]);
 b.poly([{x:x-rx+1,y:y-3},{x:x-rx+3,y:y-ry+1},{x:x+rx-2,y:y-ry+1},{x:x+rx-1,y:y-2},{x:x+rx-1,y:y+2},{x:x+rx-3,y:y+ry-1},{x:x-rx+3,y:y+ry-1},{x:x-rx+1,y:y+2}],p.skin[1]);
 b.poly([{x:x-rx+2,y:y-3},{x:x-rx+3,y:y-ry+2},{x:x+1,y:y-ry+1},{x:x+3,y:y-3},{x:x+1,y:y-1},{x:x-rx+2,y:y-1}],p.skin[2]);
 b.line({x:x+rx-1,y:y},{x:x+rx-2,y:y+4},p.skin[0]);
 if(!back)b.line({x:x-2+sign,y:y+ry-1},{x:x+2+sign,y:y+ry-1},p.skin[0]);
}
export function faceEyes(b,x,y,v,color,p,state,death){
 if(!v.eyes.length)return;
 for(const [i,dx]of v.eyes.entries()){
  const far=v.view==='quarter'&&i===(v.sign>0?0:1),xx=x+dx;
  if(death>0||['hit','stagger'].includes(state)){b.rect(xx-1,y,far?1:2,1,FACE_OUTLINE);continue;}
  b.rect(xx-1,y-1,far?1:2,3,FACE_OUTLINE);
  if(!far){b.dot(xx-1,y-1,p.metal[3]);b.dot(xx,y,color);}
 }
}
export function hairShape(b,x,y,v,p,{long=false,silver=false}={}){
 const back=!v.eyes.length,s=v.sign,rx=v.view==='profile'?6:7;
 if(back){
  b.outlined([{x:x-rx,y:y-3},{x:x-rx+2,y:y-7},{x:x-2,y:y-9},{x:x+3,y:y-8},{x:x+rx,y:y-4},{x:x+rx,y:y+4},{x:x+rx-2,y:y+6},{x:x-4,y:y+6},{x:x-rx,y:y+3}],p.hair[0]);
  b.poly([{x:x-rx+1,y:y-3},{x:x-rx+3,y:y-6},{x:x+2,y:y-7},{x:x+rx-1,y:y-3},{x:x+rx-1,y:y+3},{x:x+3,y:y+5},{x:x-rx+2,y:y+3}],p.hair[1]);
  b.poly([{x:x-rx+2,y:y-3},{x:x-rx+3,y:y-5},{x:x+1,y:y-6},{x:x+3,y:y-4},{x:x,y:y-3}],p.hair[2]);
  b.line({x:x+3+s,y:y+1},{x:x+2+s,y:y+4},p.hair[0]);
 }else{
  b.outlined([{x:x-rx,y:y},{x:x-rx,y:y-4},{x:x-3,y:y-8},{x:x+2,y:y-8},{x:x+rx,y:y-5},{x:x+rx,y:y-1},{x:x+4-s,y:y-3},{x:x+1-s,y:y-2},{x:x-2,y:y-3},{x:x-4,y:y-1}],p.hair[0]);
  b.poly([{x:x-rx+1,y:y-1},{x:x-rx+1,y:y-4},{x:x-3,y:y-7},{x:x+2,y:y-7},{x:x+rx-1,y:y-4},{x:x+rx-1,y:y-2},{x:x+3-s,y:y-4},{x:x-s,y:y-3},{x:x-2,y:y-4},{x:x-4,y:y-2}],p.hair[1]);
  b.poly([{x:x-5,y:y-4},{x:x-3,y:y-6},{x:x,y:y-6},{x:x+2,y:y-5},{x:x-1,y:y-4}],p.hair[2]);
  const sides=v.view==='profile'?[-s*5]:[-6,6];
  for(const dx of sides){b.rect(x+dx-1,y-1,2,long?7:5,p.hair[0]);b.rect(x+dx-1,y,1,long?5:3,p.hair[silver?2:1]);}
 }
}
