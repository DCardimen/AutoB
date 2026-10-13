import {drawNativeFace} from './prototype-faces.js';
import {paintAtlasHead} from './authored-sprite-renderer.js';
const O='#192328';
export function paintGrandPixels(b,rig,at,p,layer){
 // Mature and apex atlases contain their complete evolved bodies and costumes.
 // Keep optional owned equipment marks, but never paste generic evolution parts.
 if(rig.authoredEvolution){
  if(layer==='body'&&rig.equipment?.includes('prism-focus')){const q=at(rig.weapon?.tip||rig.head);b.oval(q.x,q.y,1,1,p.metal[3]);}
  return;
 }
 if(layer==='body'){
  const body=at(rig.body),mark=rig.pixelMark;
  if(mark!==undefined){const x=body.x+(mark%2?2:-2),y=body.y+1;b.rect(x,y,2,2,p.cloth[0]);b.dot(x,y,p.cloth[2]);}
  if(rig.equipment?.includes('reliquary-plate'))for(const s of [-1,1])b.outlined([{x:body.x+s*4,y:body.y-4},{x:body.x+s*8,y:body.y-3},{x:body.x+s*8,y:body.y},{x:body.x+s*4,y:body.y+1}],p.metal[2]);
  if(rig.equipment?.includes('prism-focus')){const q=at(rig.weapon?.tip||rig.head);b.outlined([{x:q.x,y:q.y-3},{x:q.x+2,y:q.y},{x:q.x,y:q.y+3},{x:q.x-2,y:q.y}],p.hair[2]);}
 }
 const g=rig.grand;if(!g)return;const h=rig.artAnchors?{...rig.artAnchors.head}:at(rig.head),body=rig.artAnchors?{...rig.artAnchors.body}:at(rig.body),stage=rig.form||1,light=p.metal[3],gold=p.cloth[2];
 if(rig.artAnchors){h.y=Math.max(g.crest==='hat'?19:16,h.y);body.y=Math.min(46,body.y);}
 if(layer==='far'){
  if(g.motif==='demon')for(const side of [-1,1]){
   const q=(x,y)=>({x:body.x+side*x,y:body.y+y});
   b.outlined([q(7,-2),q(13,-9),q(27,-18),q(23,-4),q(13,4)],p.metal[0]);
   b.poly([q(10,-3),q(14,-8),q(25,-15),q(21,-5),q(13,1)],p.metal[1]);
   b.line(q(12,-6),q(25,-15),p.metal[3]);b.line(q(12,-3),q(21,-7),p.cloth[2]);
  }
  if(stage===2&&!rig.ragdoll){for(const side of [-1,1]){const q=at({...rig.body,x:rig.body.x-26,y:side*49,z:rig.body.z+22});q.y=Math.min(52,q.y);b.outlined([{x:q.x,y:q.y-4},{x:q.x+3,y:q.y},{x:q.x,y:q.y+4},{x:q.x-3,y:q.y}],p.cloth[1]);b.dot(q.x,q.y,light);b.line(q,{x:q.x,y:q.y+8},gold);}}
  if(g.halo){const r=stage===2?12:10,pts=Array.from({length:8},(_,i)=>({x:h.x+Math.cos(i*Math.PI/4)*r,y:h.y+Math.sin(i*Math.PI/4)*r*.7-2}));for(let i=0;i<8;i++){b.line(pts[i],pts[(i+1)%8],O,1);b.line(pts[i],pts[(i+1)%8],light);}for(const q of pts)b.dot(q.x,q.y,gold);}
  const fold=rig.ragdoll ? .45+.55*(1-(rig.death||0)):1;
  if(g.wings&&rig.id!=='flyer')for(const side of [-1,1]){
   const root=at({...rig.body,x:rig.body.x-6,y:rig.body.y+side*7,z:rig.body.z+9}),joint=at({...rig.body,x:rig.body.x-15,y:side*38*fold,z:rig.body.z+17}),tip=at({...rig.body,x:rig.body.x-23,y:side*65*fold,z:rig.body.z+7+Math.sin(rig.phase*Math.PI*2)*8});tip.y=Math.min(stage===2?42:48,tip.y);
   b.outlined([root,joint,tip,{x:tip.x-side*2,y:tip.y+13},{x:root.x,y:root.y+5}],p.cloth[0]);b.poly([root,joint,tip],['angel','dryad','frostregent'].includes(g.motif)?p.metal[2]:p.cloth[1]);for(let i=0;i<6;i++){const t=i/6;b.line({x:root.x+(tip.x-root.x)*t,y:root.y+(tip.y-root.y)*t},{x:tip.x+(root.x-tip.x)*t*.7,y:tip.y+12-i},['angel','frostregent'].includes(g.motif)?light:gold,1);}
   if(stage===2&&!rig.ragdoll){b.outlined([root,{x:tip.x-side*3,y:tip.y+12},{x:tip.x-side*8,y:tip.y+19},{x:root.x,y:root.y+7}],p.cloth[1]);b.line({x:tip.x-side*3,y:tip.y+12},{x:tip.x-side*8,y:tip.y+19},light,1);}
  }
  if(g.tailFan){const root=at(rig.pelvis);for(let i=0;i<g.tailFan;i++){const s=(i-(g.tailFan-1)/2),tip=at({...rig.pelvis,x:rig.pelvis.x-26-Math.abs(s)*3,y:s*11+Math.sin(rig.phase*6.28+i)*4,z:rig.pelvis.z+3+Math.abs(s)*5});b.line(root,tip,O,3);b.line(root,tip,p.skin[1],2);b.oval(tip.x,tip.y,2,2,light);}}
 }
 if(layer==='body'){
  if(stage===2){for(const s of [-1,1])b.outlined([{x:body.x+s*5,y:body.y-4},{x:body.x+s*11,y:body.y-8},{x:body.x+s*10,y:body.y+3},{x:body.x+s*4,y:body.y+8}],p.cloth[1]);b.line({x:body.x,y:body.y},{x:body.x,y:body.y+11},light,1);}
  if(!['hydra','cerberus','spiderqueen','solarlion'].includes(g.motif)){
   b.outlined([{x:body.x-7,y:body.y-6},{x:body.x+7,y:body.y-6},{x:body.x+9,y:body.y+2},{x:body.x+5,y:body.y+6},{x:body.x-5,y:body.y+6},{x:body.x-9,y:body.y+2}],p.metal[0]);
   b.poly([{x:body.x-5,y:body.y-4},{x:body.x+5,y:body.y-4},{x:body.x+6,y:body.y+2},{x:body.x,y:body.y+5},{x:body.x-6,y:body.y+2}],p.metal[1]);b.poly([{x:body.x-5,y:body.y-3},{x:body.x-1,y:body.y-4},{x:body.x,y:body.y+3},{x:body.x-4,y:body.y+1}],p.metal[2]);b.line({x:body.x-4,y:body.y-4},{x:body.x+4,y:body.y-4},light);b.line({x:body.x+4,y:body.y-1},{x:body.x+3,y:body.y+3},p.metal[0]);for(const dx of [-5,5])b.dot(body.x+dx,body.y,p.metal[3]);b.outlined([{x:body.x,y:body.y-3},{x:body.x+2,y:body.y},{x:body.x,y:body.y+3},{x:body.x-2,y:body.y}],gold);b.dot(body.x,body.y-1,light);
  }else{for(let i=-2;i<=2;i++)b.outlined([{x:body.x+i*3-2,y:body.y-2},{x:body.x+i*3,y:body.y-8-Math.abs(i)},{x:body.x+i*3+2,y:body.y+1}],p.cloth[1]);}
 }
 if(layer==='head'){
  if(g.extraHeads){for(const side of g.extraHeads===4?[-1.8,-.8,.8,1.8]:[-1,1]){const q=at({...rig.head,x:rig.head.x-7,y:rig.head.y+side*18,z:rig.head.z-3}),root=at({...rig.body,x:rig.body.x+10,z:rig.body.z+3});b.line(root,q,O,2);b.line(root,q,p.skin[1],1);if(!paintAtlasHead(b,rig.id,rig,q))drawNativeFace(b,rig.id,q,rig.dir,p,{...rig,grand:null,form:0});}}
  if(g.crest==='crown'||g.crest==='reactor'||g.crest==='pearl'){
   const y=h.y-7;b.outlined([{x:h.x-8,y},{x:h.x-8,y:y-6},{x:h.x-4,y:y-2},{x:h.x,y:y-8},{x:h.x+4,y:y-2},{x:h.x+8,y:y-6},{x:h.x+8,y},{x:h.x-8,y}],p.metal[1]);b.line({x:h.x-6,y:y-1},{x:h.x+6,y:y-1},light);for(const dx of [-5,0,5])b.dot(h.x+dx,y-2,gold);
  }else if(g.crest==='horns'||g.crest==='antlers'||g.crest==='fins')for(const side of [-1,1]){
   const a={x:h.x+side*8,y:h.y-5},joint={x:h.x+side*17,y:Math.max(4,h.y-10)},z={x:h.x+side*19,y:Math.max(1,h.y-18)};
   b.line(a,joint,O,2);b.line(joint,z,O,1);b.line(a,joint,p.metal[1],1);b.line(joint,z,light);b.line({x:a.x-1,y:a.y-1},{x:joint.x-1,y:joint.y-1},p.metal[2]);
   if(g.crest==='antlers'){b.line(joint,{x:h.x+side*25,y:Math.max(2,h.y-13)},light,1);b.line(joint,{x:h.x+side*12,y:Math.max(1,h.y-19)},p.metal[2]);}
  }else if(g.crest==='hat'){
   b.outlined([{x:h.x-10,y:h.y-5},{x:h.x-6,y:h.y-8},{x:h.x-3,y:h.y-18},{x:h.x+3,y:h.y-14},{x:h.x+7,y:h.y-6},{x:h.x+10,y:h.y-5}],p.cloth[0]);
   b.poly([{x:h.x-5,y:h.y-8},{x:h.x-3,y:h.y-16},{x:h.x+1,y:h.y-13},{x:h.x+4,y:h.y-7}],p.cloth[1]);
   b.line({x:h.x-4,y:h.y-9},{x:h.x-3,y:h.y-15},p.cloth[2]);b.line({x:h.x-7,y:h.y-6},{x:h.x+7,y:h.y-6},p.metal[2]);b.dot(h.x+2,h.y-8,light);
  }
  else if(g.crest==='flame'){for(let i=-2;i<=2;i++)b.outlined([{x:h.x+i*3-2,y:h.y-4},{x:h.x+i*3,y:h.y-13+Math.abs(i)*2},{x:h.x+i*3+2,y:h.y-4}],i%2?p.skin[2]:gold);}
  if(['runetitan','scarabking'].includes(g.motif)){b.outlined([{x:h.x-7,y:h.y-5},{x:h.x+7,y:h.y-5},{x:h.x+8,y:h.y+3},{x:h.x+4,y:h.y+7},{x:h.x-5,y:h.y+7},{x:h.x-8,y:h.y+3}],p.metal[1]);b.line({x:h.x-5,y:h.y-4},{x:h.x+4,y:h.y-4},light);if(!rig.back){b.rect(h.x-5,h.y-1,10,3,O);b.rect(h.x-3,h.y,6,1,gold);}else b.rect(h.x-3,h.y,6,3,p.metal[0]);}
 }
}
