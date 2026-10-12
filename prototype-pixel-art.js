import {paintGrandPixels} from './grand-pixels.js';
import {paintCapeMesh} from './native-cloth.js';
import {projectRig,characterRig} from './prototype-rig.js';
import {drawNativeFace,FACE_VIEWS} from './prototype-faces.js';
export const CELL=64,PIVOT={x:32,y:44},PIXEL_WORLD=3;
export const SPRITE_ART_REVISION=2;
const OUT='#192328';
export const PIXEL_PALETTES={
 crab:{skin:['#496b63','#7daca0','#c6d9be'],cloth:['#385c69','#5b95aa','#a9d1db'],metal:['#324d52','#668d8c','#b0c8bd','#e5e0b9'],hair:['#364c58','#638e99','#abd5ce']},
 centipede:{skin:['#3b454e','#6f8f96','#b7d0c4'],cloth:['#4d4540','#9b8054','#d2ba76'],metal:['#37434b','#6c8790','#b3b9b2','#e0daba'],hair:['#43516d','#87acba','#d0e5d9']},
 knight:{skin:['#82563d','#c18b60','#efd09e'],cloth:['#552b35','#a4433e','#df7955'],metal:['#43545c','#8b9b99','#c9cfc0','#f0e3ba'],hair:['#722c30','#bd473b','#f18a51']},
 orc:{skin:['#3e5939','#7c9d49','#b7ca73'],cloth:['#3d322b','#805d3d','#bf9055'],metal:['#344c53','#708483','#b7c3ad','#e4ddae'],hair:['#242c2b','#3d4733','#6c7348']},
 elf:{skin:['#976c50','#d5a479','#f4d3a1'],cloth:['#203d37','#397653','#71a467'],metal:['#48534d','#899882','#c9cba1','#edd698'],hair:['#95703d','#c8a153','#f0cc7a']},
 caster:{skin:['#976674','#d3a8a0','#f1d7b6'],cloth:['#382d58','#69528d','#9b76bd'],metal:['#3a5061','#648aa1','#b6d6dd','#e8ead4'],hair:['#647081','#a6acb8','#e6ded3']},
 fox:{skin:['#97532f','#d48b3d','#f0b863'],cloth:['#1f3e37','#3b7450','#79a367'],metal:['#5c5544','#a89969','#d2c19a','#eee0b5'],hair:['#97532f','#d48b3d','#f0b863']},
 wolf:{skin:['#954e31','#cd7c38','#edae58'],cloth:['#642c35','#a64140','#dd674d'],metal:['#5e5541','#a9a070','#dbcf9f','#f3deba'],hair:['#8f4a31','#c77a39','#edab55']},
 mech:{skin:['#4e473b','#9b7043','#d8a85e'],cloth:['#36484d','#647b7b','#a1ad9b'],metal:['#3c4549','#6b797d','#b4bcac','#e3d3a5'],hair:['#354b58','#63979e','#a5e6e3']},
 spider:{skin:['#312b43','#76648e','#b6a1c4'],cloth:['#2b233b','#50345f','#8b5496'],metal:['#483957','#786089','#bea1cd','#e9c7eb'],hair:['#372844','#725395','#c190df']},
 jelly:{skin:['#185674','#358ca2','#72c8ce'],cloth:['#174d68','#278ba1','#7ce0df'],metal:['#356b8c','#67a9bf','#a6e8e0','#e0faf0'],hair:['#195673','#428fa8','#86d9df']},
 serpent:{skin:['#244f53','#498981','#a2c7a0'],cloth:['#33476b','#6989a4','#abd1d0'],metal:['#4a787b','#8eb8b0','#c6d9bd','#ecedd0'],hair:['#274d6f','#5294b0','#b0dfd5']},
 flyer:{skin:['#68554b','#b89a75','#e2c49b'],cloth:['#304c61','#5f92aa','#b3d9ce'],metal:['#425970','#7897a6','#c5d1c5','#f0dfae'],hair:['#52527c','#9497bd','#d1d6dc']},
};
const colors=new Map();function rgba(c){if(!colors.has(c))colors.set(c,[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16),255]);return colors.get(c);}
class PixelBrush{
 constructor(){this.data=new Uint8ClampedArray(CELL*CELL*4);this.clipped=0;this.data.clipSamples=[];}
 dot(x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=CELL||y>=CELL){this.clipped++;if(this.data.clipSamples.length<12)this.data.clipSamples.push({x,y,c});return;}this.data.set(rgba(c),(y*CELL+x)*4);}
 rect(x,y,w,h,c){for(let j=Math.round(y);j<Math.round(y+h);j++)for(let i=Math.round(x);i<Math.round(x+w);i++)this.dot(i,j,c);}
 oval(x,y,rx,ry,c){x=Math.round(x);y=Math.round(y);for(let j=Math.floor(y-ry);j<=Math.ceil(y+ry);j++)for(let i=Math.floor(x-rx);i<=Math.ceil(x+rx);i++)if(((i-x)/(rx||1))**2+((j-y)/(ry||1))**2<=1)this.dot(i,j,c);}
 line(a,b,c,r=0){let x=Math.round(a.x),y=Math.round(a.y),tx=Math.round(b.x),ty=Math.round(b.y),dx=Math.abs(tx-x),sx=x<tx?1:-1,dy=-Math.abs(ty-y),sy=y<ty?1:-1,err=dx+dy;for(let k=0;k<160;k++){this.oval(x,y,r||0.6,r||0.6,c);if(x===tx&&y===ty)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}}
 poly(vertices,c){vertices=vertices.map(p=>({x:Math.round(p.x),y:Math.round(p.y)}));const xs=vertices.map(p=>p.x),ys=vertices.map(p=>p.y);for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}if(inside)this.dot(x,y,c);}}
 rotated(layer,center,angle){const cos=Math.cos(angle),sin=Math.sin(angle);for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){const dx=x-center.x,dy=y-center.y,sx=Math.round(center.x+dx*cos+dy*sin),sy=Math.round(center.y-dx*sin+dy*cos);if(sx<0||sy<0||sx>=CELL||sy>=CELL)continue;const src=(sy*CELL+sx)*4;if(layer.data[src+3])this.data.set(layer.data.subarray(src,src+4),(y*CELL+x)*4);}for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(layer.data[(y*CELL+x)*4+3]){const dx=x-center.x,dy=y-center.y,tx=Math.round(center.x+dx*cos-dy*sin),ty=Math.round(center.y+dx*sin+dy*cos);if(tx<0||ty<0||tx>=CELL||ty>=CELL)this.clipped++;}this.clipped+=layer.clipped;}
 outlined(points,c){this.poly(points,c);points.forEach((p,i)=>this.line(p,points[(i+1)%points.length],OUT));}
}
export function spritePoint(p,angle){const s=projectRig(p,angle);return {x:PIVOT.x+s.x/PIXEL_WORLD,y:PIVOT.y+s.y/PIXEL_WORLD,depth:s.depth};}
export function paintCharacterPixels(id,rig,angle){
 let b=new PixelBrush();const p=rig.palette||PIXEL_PALETTES[id],dir=((Math.round(angle/(Math.PI/4))%8)+8)%8,front=dir===2,back=!FACE_VIEWS[dir].eyes.length,side=FACE_VIEWS[dir].sign,at=q=>spritePoint(q,angle);
 rig.dir=dir;rig.back=back;const body=at(rig.body),pelvis=at(rig.pelvis),head=at(rig.head),moving=['walk','run','sprint','turn','stop'].includes(rig.state),dead=rig.death>0;
 const bind=rig.ragdoll?characterRig(id,'idle',0):null;let headRoll=0;if(bind){const h=at(bind.head),c=at(bind.body),rest=Math.atan2(h.x-c.x,-(h.y-c.y)),current=Math.atan2(head.x-body.x,-(head.y-body.y));headRoll=Math.round(Math.atan2(Math.sin(current-rest),Math.cos(current-rest))/(Math.PI/12))*(Math.PI/12);}
 if(['knight','orc','elf','caster','fox'].includes(id)){if(rig.ragdoll){const dx=head.x-body.x,dy=head.y-body.y,len=Math.hypot(dx,dy)||1;head.x+=dx/len*2;head.y+=dy/len*2;}else head.y-=2;}
 if(rig.state==='idle')head.y+=Math.round(Math.sin(rig.phase*Math.PI*2)*0.7);
 function outlinedOval(x,y,rx,ry,color){b.oval(x,y,rx+1,ry+1,OUT);b.oval(x,y,rx,ry,color);}
 function segment(a,c,width,color,highlight){const x=at(a),y=at(c);b.line(x,y,OUT,width+1);b.line(x,y,color,width);if(highlight)b.line({x:x.x-1,y:x.y-1},{x:y.x-1,y:y.y-1},highlight,0);}
 function leg(l){
  const animal=['wolf','spider','crab','centipede'].includes(id),metal=['knight','mech'].includes(id),upper=id==='orc'?2.1:id==='mech'?1.7:animal?1:1.4,lower=animal?1:id==='orc'?1.8:1.3;
  segment(l.root,l.joint,upper,animal?p.skin[0]:id==='orc'?p.skin[0]:p.cloth[0],animal?p.skin[1]:id==='orc'?p.skin[1]:p.cloth[1]);
  segment(l.joint,l.hock||l.end,lower,metal?p.metal[0]:animal?p.skin[0]:p.cloth[0],metal?p.metal[1]:animal?p.skin[1]:p.cloth[1]);
  if(l.hock)segment(l.hock,l.end,.8,p.skin[0],p.skin[1]);
  const f=at(l.end);
  if(id==='mech'){for(const part of [l.root,l.joint]){const j=at(part);outlinedOval(j.x,j.y,1.6,1.6,p.metal[0]);b.dot(j.x-1,j.y-1,p.skin[2]);}}
  if(animal){outlinedOval(f.x+.5,f.y,id==='spider'?1.1:2,id==='spider'?.7:1.2,id==='wolf'?p.skin[1]:p.skin[0]);if(id==='wolf')b.line({x:f.x,y:f.y-1},{x:f.x+1,y:f.y-1},p.skin[2]);}
  else {const w=id==='orc'?2.7:id==='mech'?2.5:2.3;b.outlined([{x:f.x-w,y:f.y-2},{x:f.x+w-1,y:f.y-2},{x:f.x+w+1,y:f.y},{x:f.x+w,y:f.y+2},{x:f.x-w,y:f.y+2}],metal?p.metal[0]:'#49382e');b.rect(f.x-w+1,f.y-1,w*1.5,2,metal?p.metal[1]:'#826648');b.line({x:f.x-w+1,y:f.y-1},{x:f.x+w-1,y:f.y-1},metal?p.metal[2]:'#bfa278');b.line({x:f.x-w,y:f.y+2},{x:f.x+w,y:f.y+2},OUT);}
 }

 const sorted=rig.legs.slice().sort((a,c)=>at(a.root).depth-at(c.root).depth),far=sorted.filter(l=>at(l.root).depth<0),near=sorted.filter(l=>at(l.root).depth>=0);
 far.forEach(leg);
 paintGrandPixels(b,rig,at,p,"far");paintCapeMesh(b,rig,at,p,"far");
 if(id==='crab'||id==='centipede'){
  const segments=rig.segments||[rig.body];for(const q of segments){const a=at(q);outlinedOval(a.x,a.y,id==='crab'?9:4.5,id==='crab'?6:4,p.skin[0]);b.oval(a.x-1,a.y-1,id==='crab'?7:3.5,id==='crab'?4:3,p.skin[1]);b.line({x:a.x-3,y:a.y-2},{x:a.x+2,y:a.y-2},p.skin[2]);}
  if(id==='crab')for(const side of [-1,1]){const root={...rig.body,x:rig.body.x+7,y:side*11},end={...root,x:root.x+22+Math.sin(rig.phase*6.28)*3,y:side*22,z:root.z-3};segment(root,end,2,p.skin[0],p.skin[1]);const q=at(end);b.outlined([{x:q.x-3,y:q.y-3},{x:q.x+3,y:q.y-5},{x:q.x+5,y:q.y+1},{x:q.x,y:q.y+3},{x:q.x-3,y:q.y}],p.skin[1]);b.line({x:q.x,y:q.y-2},{x:q.x+3,y:q.y+1},p.skin[0]);}
  drawNativeFace(b,id,head,dir,p,rig);paintGrandPixels(b,rig,at,p,'body');near.forEach(leg);paintGrandPixels(b,rig,at,p,'head');paintCapeMesh(b,rig,at,p,'near');b.data.clipped=b.clipped;return b.data;
 }
 if(id==='serpent'){
  for(const [i,q]of [...rig.segments].reverse().entries()){const t=at(q),r=2+Math.min(3,i*.4);outlinedOval(t.x,t.y,r,r*.65,p.skin[0]);b.oval(t.x-1,t.y-1,Math.max(1,r-1),Math.max(1,r*.65-1),p.skin[1]);b.dot(t.x,t.y-2,p.skin[2]);}
  segment(rig.body,rig.head,2,p.skin[0],p.skin[1]);paintGrandPixels(b,rig,at,p,'body');drawNativeFace(b,id,head,dir,p,rig);
  if(rig.form){for(const s of [-1,1]){const q={x:head.x+s*6,y:head.y+3};b.line(head,q,p.skin[1],1);if(rig.formPath==='wild')drawNativeFace(b,id,q,dir,p,{...rig,form:0});else b.outlined([{x:q.x,y:q.y-3},{x:q.x+s*3,y:q.y},{x:q.x,y:q.y+4}],p.metal[2]);}}
  paintGrandPixels(b,rig,at,p,'head');paintCapeMesh(b,rig,at,p,'near');b.data.clipped=b.clipped;return b.data;
 }
 if(id==='flyer'){
  for(const wing of rig.wings){const qs=wing.map(at);b.outlined(qs,p.cloth[0]);b.poly([qs[0],qs[1],qs[2]],p.cloth[1]);b.line(qs[0],qs[2],p.cloth[2]);if(rig.design==='bat')b.line(qs[1],qs[3],p.skin[0]);else for(let i=0;i<4;i++){const t=i/4;b.line({x:qs[1].x+(qs[2].x-qs[1].x)*t,y:qs[1].y+(qs[2].y-qs[1].y)*t},qs[3],p.cloth[2]);}}
  if(rig.grand)for(const wing of rig.wings){const qs=wing.map(at);for(let i=1;i<=3;i++){const t=i/4;b.line({x:qs[0].x+(qs[1].x-qs[0].x)*t,y:qs[0].y+(qs[1].y-qs[0].y)*t},{x:qs[3].x+(qs[2].x-qs[3].x)*t,y:qs[3].y+(qs[2].y-qs[3].y)*t},p.metal[2],1);}}
  outlinedOval(body.x,body.y,rig.design==='faerie'?3:5,5,p.skin[0]);b.oval(body.x-1,body.y-1,3,4,p.cloth[1]);segment(rig.body,rig.head,2,p.skin[0],p.skin[1]);
  for(const s of [-1,1]){b.line({x:body.x+s*2,y:body.y+3},{x:body.x+s*3,y:body.y+7},p.metal[2]);b.dot(body.x+s*4,body.y+7,p.metal[3]);}
  paintGrandPixels(b,rig,at,p,'body');drawNativeFace(b,id,head,dir,p,rig);if(rig.form){b.outlined([{x:body.x-3,y:body.y-1},{x:body.x+3,y:body.y-1},{x:body.x+5,y:body.y+8},{x:body.x,y:body.y+5},{x:body.x-5,y:body.y+8}],rig.formPath==='warden'?p.metal[1]:p.cloth[2]);}
  paintGrandPixels(b,rig,at,p,'head');paintCapeMesh(b,rig,at,p,'near');b.data.clipped=b.clipped;return b.data;
 }
 // Cloth panels are attached at the shoulders. Spring state from the simulation
 // adds delayed lift and lateral swing; the preview uses the same gait rhythm.
 if(!rig.capeMesh&&['knight','elf','caster','fox'].includes(id)){
   const wind=(rig.cape?.map(v=>typeof v==='number'?v:v.angle)||[0,1,2].map(i=>(moving?0.7:0.06)+Math.sin(rig.phase*Math.PI*2-i*0.65)*(moving?0.2:0.04)));
   const root=at({...rig.body,x:rig.body.x-5,z:rig.body.z+6}),rear=at({...rig.pelvis,x:rig.pelvis.x-12-(wind[1]||0)*12,z:rig.pelvis.z-7+(wind[1]||0)*9});
   for(let i=0;i<3;i++){const dx=(i-1)*3,tip={x:rear.x+dx+(wind[i]||0)*Math.sin(angle)*4,y:rear.y+(i===1?2:0)};b.outlined([{x:root.x+dx-2,y:root.y},{x:root.x+dx+2,y:root.y},{x:tip.x+2,y:tip.y},{x:tip.x-2,y:tip.y}],p.cloth[i===1?1:0]);b.line({x:root.x+dx,y:root.y+2},{x:tip.x,y:tip.y-1},p.cloth[2]);}
 }
 if(id==='jelly'){
   const actionPulse=Math.sin(rig.phase*Math.PI),squash=(rig.squash||1)*(['dodge','dash'].includes(rig.state)?1+.26*actionPulse:rig.state==='stop'?1+.17*actionPulse:1),rx=8*squash,ry=9/squash,x=body.x,y=Math.min(54,body.y+2);
   outlinedOval(x,y,rx,ry,p.skin[0]);b.oval(x-1,y-1,Math.max(1,rx-1),Math.max(1,ry-1),p.skin[1]);b.oval(x-2,y-3,Math.max(1,rx-3),Math.max(1,ry-4),p.skin[2]);
   b.line({x:x-rx+3,y:y-ry+4},{x:x-rx+5,y:y-ry+2},p.metal[3],1);b.oval(x+3,y-ry+4,1,1,p.metal[2]);
   if(!dead){const pearl=at({...rig.body,x:rig.body.x+8,z:rig.body.z+1});b.oval(pearl.x,pearl.y,2,1,p.skin[0]);b.dot(pearl.x-1,pearl.y-1,p.metal[2]);}
   if(!back&&!dead){for(const dx of FACE_VIEWS[dir].eyes){b.rect(Math.round(x)+dx,y-2,1,2,OUT);b.dot(Math.round(x)+dx,y-3,p.metal[3]);}b.dot(Math.round(x)+FACE_VIEWS[dir].sign*2,y+2,p.metal[3]);}
   for(let i=0;i<3;i++)b.oval(x+(i-1)*6,y+ry-1,2,1,p.skin[1]);
   if(rig.form){const crownY=y-ry-2;for(const dx of [-5,0,5]){b.line({x:x+dx,y:crownY+2},{x:x+dx,y:crownY-2},p.metal[1]);b.dot(x+dx,crownY-3,p.metal[3]);}if(rig.formPath==='warden')for(const s of [-1,1])b.outlined([{x:x+s*rx,y:y},{x:x+s*(rx+3),y:y+4},{x:x+s*rx,y:y+7}],p.cloth[2]);else for(const s of [-1,1])outlinedOval(x+s*(rx+3),y-3,2,2,p.metal[2]);}
   if(rig.state==='cast'||rig.state==='attack'){const q=at(rig.weapon.tip);outlinedOval(q.x,q.y,2+Math.round(rig.phase*2),2,p.metal[2]);b.dot(q.x-1,q.y-1,p.metal[3]);}
   paintGrandPixels(b,rig,at,p,'head');paintCapeMesh(b,rig,at,p,'near');b.data.clipped=b.clipped;return b.data;
 }
 if(id==='mech'||id==='spider'||id==='wolf'){
   const rx=id==='wolf'?Math.hypot((27+(rig.spine||0))*Math.cos(angle),14*Math.sin(angle))/3:7,ry=id==='wolf'?4+Math.abs(Math.sin(angle))*2:5;
   outlinedOval(body.x,body.y,id==='mech'?9:rx,id==='mech'?7:ry,id==='mech'?p.metal[0]:p.skin[0]);b.oval(body.x-1,body.y-1,rx-1,ry-1,p.skin[1]);b.oval(body.x-3,body.y-2,rx-3,Math.max(1,ry-3),p.skin[2]);
   if(id==='mech'){
     b.outlined([{x:body.x-8,y:body.y-4},{x:body.x-4,y:body.y-7},{x:body.x+5,y:body.y-6},{x:body.x+9,y:body.y-2},{x:body.x+7,y:body.y+5},{x:body.x-6,y:body.y+5},{x:body.x-9,y:body.y}],p.skin[0]);b.poly([{x:body.x-7,y:body.y-3},{x:body.x-3,y:body.y-6},{x:body.x+4,y:body.y-5},{x:body.x+7,y:body.y-2},{x:body.x+5,y:body.y+3},{x:body.x-6,y:body.y+3}],p.skin[1]);b.poly([{x:body.x-6,y:body.y-3},{x:body.x-3,y:body.y-5},{x:body.x+2,y:body.y-4},{x:body.x+3,y:body.y-2},{x:body.x-3,y:body.y}],p.skin[2]);b.rect(body.x-3,body.y+2,6,2,p.metal[0]);for(const dx of [-2,0,2])b.dot(body.x+dx,body.y+2,p.metal[1]);
     b.line({x:body.x-5,y:body.y-3},{x:body.x+2,y:body.y-4},p.skin[2]);
     for(const dx of [-4,3])for(const dy of [-2,2])b.dot(body.x+dx,body.y+dy,p.metal[3]);
     const muzzle=at(rig.weapon.tip),grip=at(rig.weapon.grip);b.line(grip,muzzle,OUT,2.5);b.line(grip,muzzle,p.metal[0],1.5);b.line({x:grip.x-1,y:grip.y-1},{x:muzzle.x-1,y:muzzle.y-1},p.metal[2]);outlinedOval(muzzle.x,muzzle.y,1.5,1.5,p.metal[0]);b.dot(muzzle.x,muzzle.y,p.hair[2]);
     drawNativeFace(b,id,head,dir,p,rig);
     const antenna=at({...rig.body,z:rig.body.z+20});b.line({x:body.x,y:body.y-5},antenna,p.metal[1]);b.dot(antenna.x,antenna.y,p.skin[2]);
   }else if(id==='spider'){
     drawNativeFace(b,id,head,dir,p,rig);
     b.outlined([{x:body.x,y:body.y-4},{x:body.x+2,y:body.y-1},{x:body.x,y:body.y+2},{x:body.x-2,y:body.y-1}],p.hair[1]);b.dot(body.x,body.y-1,p.hair[2]);
   }else{
     const tail=at(rig.tail),tip=at({...rig.tail,x:rig.tail.x-15,y:Math.sin(rig.phase*Math.PI*2)*6,z:rig.tail.z+5});b.line(tail,tip,OUT,2);b.line(tail,tip,p.skin[1],1);b.oval(tip.x,tip.y,2,1,p.metal[3]);
     segment({...rig.body,x:rig.body.x+15,z:rig.body.z+3},rig.head,2.5,p.skin[0],p.skin[1]);
     const torsoBrush=b;if(rig.ragdoll)b=new PixelBrush();
     drawNativeFace(b,id,head,dir,p,rig);
     if(rig.ragdoll){torsoBrush.rotated(b,head,headRoll);b=torsoBrush;}
   }
   if(rig.form){
     const armor=rig.formPath==='warden';
     if(id==='mech'){b.outlined([{x:body.x-7,y:body.y-3},{x:body.x,y:body.y-7},{x:body.x+6,y:body.y-2},{x:body.x+5,y:body.y+4},{x:body.x-7,y:body.y+3}],armor?p.metal[1]:p.cloth[1]);const q=at(rig.weapon.tip);for(const s of [-1,1])b.line({x:head.x,y:head.y+s*2},{x:q.x,y:q.y+s*(armor?2:4)},p.metal[2],1);}
     else if(id==='spider'){for(const s of [-1,1])b.outlined([{x:body.x+s*4,y:body.y-1},{x:body.x+s*9,y:body.y-5},{x:body.x+s*7,y:body.y+2}],armor?p.metal[2]:p.cloth[2]);b.line({x:head.x-4,y:head.y+2},{x:head.x-5,y:head.y+7},p.metal[3]);b.line({x:head.x+4,y:head.y+2},{x:head.x+5,y:head.y+7},p.metal[3]);}
     else{for(let i=-1;i<=1;i++)b.outlined([{x:body.x+i*4-2,y:body.y-3},{x:body.x+i*4,y:body.y-(armor?5:8)},{x:body.x+i*4+2,y:body.y-3}],armor?p.metal[1]:p.cloth[2]);b.line({x:body.x-5,y:body.y},{x:body.x+5,y:body.y},armor?p.metal[3]:p.cloth[1],1);}
   }
   paintGrandPixels(b,rig,at,p,'body');near.forEach(leg);paintGrandPixels(b,rig,at,p,'head');paintCapeMesh(b,rig,at,p,'near');b.data.clipped=b.clipped;return b.data;
 }
 function drawArm(arm){
  const metal=id==='knight',skin=id==='orc',root=at(arm.root);
  segment(arm.root,arm.joint,skin?2.2:1.6,metal?p.metal[0]:skin?p.skin[0]:p.cloth[0],metal?p.metal[1]:skin?p.skin[1]:p.cloth[1]);
  segment(arm.joint,arm.end,skin?1.6:1.2,metal?p.metal[0]:p.skin[0],metal?p.metal[1]:p.skin[1]);
  if(metal){outlinedOval(root.x,root.y,2.7,2,p.metal[0]);b.oval(root.x-1,root.y-1,1.7,1,p.metal[2]);}else if(!skin){b.oval(root.x,root.y,1.8,1.5,p.cloth[1]);b.dot(root.x-1,root.y-1,p.cloth[2]);}
  const h=at(arm.end);outlinedOval(h.x,h.y,1.5,1.4,metal?p.metal[1]:p.skin[1]);
 }

 function gearLayer(grip){const depth=at(grip).depth;return depth<body.depth-0.5?'far':depth<head.depth?'middle':'near';}
 function drawGear(layer){drawGearPart(b,id,rig,angle,p,at,outlinedOval,rig.weapon&&gearLayer(rig.weapon.grip)===layer,rig.shield&&gearLayer(rig.shield.grip)===layer);}
 rig.arms.filter(a=>at(a.root).depth<body.depth).forEach(drawArm);
 drawGear('far');
 segment(rig.body,rig.head,1.4,p.skin[0],p.skin[1]);
 // A substantial jacket/cuirass sits between the attached jaw and short legs.
 const width=id==='orc'?8:id==='knight'?6.5:5.8;
 b.outlined([{x:body.x-width+1,y:body.y-4},{x:body.x-3,y:body.y-6},{x:body.x+3,y:body.y-6},{x:body.x+width-1,y:body.y-4},{x:body.x+width,y:body.y+2},{x:pelvis.x+width-1,y:pelvis.y+2},{x:pelvis.x-width+1,y:pelvis.y+2},{x:body.x-width,y:body.y+2}],id==='orc'?p.skin[0]:id==='knight'?p.metal[0]:p.cloth[0]);
 const fill=id==='orc'?p.skin[1]:id==='knight'?p.metal[1]:p.cloth[1],light=id==='orc'?p.skin[2]:id==='knight'?p.metal[2]:p.cloth[2];
 b.poly([{x:body.x-width+2,y:body.y-3},{x:body.x-1,y:body.y-5},{x:body.x+width-2,y:body.y-3},{x:pelvis.x+width-2,y:pelvis.y},{x:pelvis.x-width+2,y:pelvis.y}],fill);
 b.line({x:body.x-width+2,y:body.y-3},{x:body.x,y:body.y-4},light);
 if(id==='orc'){for(const s of [-1,1])b.oval(body.x+s*3,body.y-2,2,2,p.skin[2]);b.line({x:body.x-1,y:body.y+1},{x:body.x+2,y:body.y+1},p.skin[0]);const belt=at({...rig.pelvis,z:rig.pelvis.z+5});b.line({x:belt.x-6,y:belt.y},{x:belt.x+6,y:belt.y+2},p.cloth[0],1);b.line({x:body.x-5,y:body.y-4},{x:body.x+5,y:body.y+3},p.cloth[1],1);b.dot(body.x-3,body.y-2,p.metal[3]);}
 if(id==='knight'){b.outlined([{x:body.x-3,y:body.y-2},{x:body.x+2,y:body.y-2},{x:pelvis.x+2,y:pelvis.y+4},{x:pelvis.x-3,y:pelvis.y+4}],p.cloth[0]);b.poly([{x:body.x-2,y:body.y-1},{x:body.x,y:body.y-1},{x:pelvis.x,y:pelvis.y+3},{x:pelvis.x-2,y:pelvis.y+3}],p.cloth[1]);if(!back){b.rect(body.x-1,body.y+1,1,4,p.metal[3]);b.rect(body.x-2,body.y+2,3,1,p.metal[3]);}}
 if(id==='caster'){b.outlined([{x:body.x-5,y:body.y},{x:body.x+5,y:body.y},{x:pelvis.x+7,y:pelvis.y+6},{x:pelvis.x+3,y:pelvis.y+7},{x:pelvis.x-6,y:pelvis.y+6}],p.cloth[0]);b.poly([{x:body.x-3,y:body.y+1},{x:body.x+2,y:body.y+1},{x:pelvis.x+4,y:pelvis.y+5},{x:pelvis.x-4,y:pelvis.y+5}],p.cloth[1]);b.line({x:body.x-2,y:body.y+1},{x:pelvis.x-3,y:pelvis.y+5},p.cloth[2]);b.line({x:pelvis.x-5,y:pelvis.y+5},{x:pelvis.x+5,y:pelvis.y+5},p.metal[2]);}
 if(id==='elf'||id==='fox'){b.line({x:body.x-4,y:body.y-3},{x:pelvis.x+3,y:pelvis.y+1},'#75563a',1);b.line({x:body.x-3,y:body.y-3},{x:pelvis.x+3,y:pelvis.y},'#b09257');if(!back)b.outlined([{x:pelvis.x+3,y:pelvis.y},{x:pelvis.x+6,y:pelvis.y},{x:pelvis.x+6,y:pelvis.y+3},{x:pelvis.x+3,y:pelvis.y+3}],'#805c3d');}
 b.line({x:pelvis.x-5,y:pelvis.y},{x:pelvis.x+5,y:pelvis.y},'#342e28',1);b.rect(pelvis.x-1,pelvis.y-1,2,2,p.metal[2]);
 if(rig.design==='skeleton'){for(const dy of [-2,0,2])b.line({x:body.x-3,y:body.y+dy},{x:body.x+3,y:body.y+dy},p.skin[2]);b.line({x:body.x,y:body.y-3},{x:body.x,y:body.y+3},p.skin[0]);}
 if(rig.form){const armor=rig.formPath==='warden',r=rig.form===2?4:3;for(const s of [-1,1])b.outlined([{x:body.x+s*3,y:body.y-4},{x:body.x+s*(3+r),y:body.y-3},{x:body.x+s*(4+r),y:body.y},{x:body.x+s*3,y:body.y+1}],armor?p.metal[1]:p.cloth[1]);b.line({x:body.x-2,y:body.y-3},{x:body.x+2,y:body.y-3},p.metal[3]);}
 near.forEach(leg);
 rig.arms.filter(a=>at(a.root).depth>=body.depth).forEach(drawArm);
 drawGear('middle');
 if(id==='fox'&&!rig.grand?.tailFan){const tail=at({...rig.pelvis,x:rig.pelvis.x-12,y:Math.sin(rig.phase*Math.PI*2)*6,z:rig.pelvis.z-4});b.line({x:pelvis.x,y:pelvis.y+2},tail,OUT,3);b.line({x:pelvis.x,y:pelvis.y+2},tail,p.skin[1],2);b.oval(tail.x,tail.y,2,2,p.metal[3]);}
 paintGrandPixels(b,rig,at,p,'body');paintCapeMesh(b,rig,at,p,'near');
 const torsoBrush=b;if(rig.ragdoll)b=new PixelBrush();
 drawNativeFace(b,id,head,dir,p,rig);
 if(rig.form&&['knight','orc','elf','caster','wolf','fox'].includes(rig.design)){const armor=rig.formPath==='warden';for(const s of [-1,1])b.line({x:head.x+s*4,y:head.y-5},{x:head.x+s*(armor?7:8),y:head.y-(armor?7:10)},armor?p.metal[2]:p.cloth[2],1);}
 if(rig.ragdoll){torsoBrush.rotated(b,head,headRoll);b=torsoBrush;}
 drawGear('near');
 paintGrandPixels(b,rig,at,p,'head');b.data.clipped=b.clipped;return b.data;
}
function drawGearPart(b,id,rig,angle,p,at,outlinedOval,weapon,shield){
 if(weapon&&rig.weapon){
   const g=at(rig.weapon.grip),tip=at(rig.weapon.tip);
   if(['elf','fox'].includes(id)){
     const top=at({...rig.weapon.grip,x:rig.weapon.grip.x-6,z:rig.weapon.grip.z+24}),bottom=at({...rig.weapon.grip,x:rig.weapon.grip.x-6,z:rig.weapon.grip.z-24}),mid=g;
     b.line(top,mid,OUT,1);b.line(mid,bottom,OUT,1);b.line(top,mid,'#8c683d');b.line(mid,bottom,'#8c683d');b.dot(top.x,top.y,'#c8b17d');b.dot(bottom.x,bottom.y,'#c8b17d');
     const pull=rig.arms.find(a=>a.side===1);if(rig.state==='attack'&&rig.bowString?.draw>0.05){b.line(top,at(pull.end),p.metal[3]);b.line(at(pull.end),bottom,p.metal[3]);}else b.line(top,bottom,p.metal[3]);
     if(rig.bowString?.draw>0.4)b.line(at(pull.end),{x:g.x+Math.cos(angle)*7,y:g.y+Math.sin(angle)*4},p.metal[2]);
   }else if(id==='caster'){
     b.line(g,tip,OUT,1);b.line(g,tip,'#8a6342');const collar={x:g.x+(tip.x-g.x)*.8,y:g.y+(tip.y-g.y)*.8};b.oval(collar.x,collar.y,1,1,p.metal[2]);b.outlined([{x:tip.x,y:tip.y-3},{x:tip.x+2,y:tip.y},{x:tip.x,y:tip.y+3},{x:tip.x-2,y:tip.y}], '#4a95b0');b.rect(tip.x-1,tip.y-2,2,3,'#8bd2d4');b.dot(tip.x-1,tip.y-2,'#e6f3d9');
     if(rig.state==='cast'){const q=Math.round(rig.phase*3);for(const dx of [-4-q,4+q])b.dot(tip.x+dx,tip.y-2,'#a393e9');b.dot(tip.x,tip.y-2-Math.min(2,q),'#dfd9f7');}
   }else{
     const dx=tip.x-g.x,dy=tip.y-g.y,len=Math.hypot(dx,dy)||1,tx=dx/len,ty=dy/len,nx=-ty,ny=tx;
     const q=(along,across)=>({x:g.x+tx*along+nx*across,y:g.y+ty*along+ny*across});
     b.line(q(-2,0),tip,OUT,1);b.line(q(-2,0),tip,id==='orc'?'#9a744d':p.metal[0]);b.line(q(-2,-.5),q(2,-.5),'#b6a077');
     if(rig.gear==='cannon'){b.line(g,tip,OUT,3);b.line(g,tip,p.metal[1],2);b.line(g,tip,p.metal[2],1);b.oval(tip.x,tip.y,2,2,p.cloth[2]);}
     else if(['royal-hammer','great-axe','sunblade','moonblade','branch-club','gauntlet'].includes(rig.gear)){b.outlined([q(2,-2),q(len-2,-4),q(len+2,0),q(len-2,4),q(2,2)],p.metal[1]);b.line(q(3,-1),tip,p.metal[3],1);if(rig.gear==='great-axe'||rig.gear==='royal-hammer')b.outlined([q(len-5,-6),q(len+2,-6),q(len+4,5),q(len-5,5)],p.metal[2]);}
     else if(rig.gear==='hammer'||rig.gear==='club'){
       const r=rig.gear==='hammer'?3:2;b.outlined([q(len-3,-r),q(len+1,-r),q(len+2,r),q(len-3,r)],rig.gear==='hammer'?p.metal[1]:p.cloth[1]);b.line(q(len-2,-r),q(len+1,-r),p.metal[3]);
     }else if(rig.gear==='knife'||rig.gear==='rapier'){
       b.line(q(1,0),tip,p.metal[3],rig.gear==='knife'?1:0);b.line(q(2,-2),q(2,2),p.metal[1]);
     }else if(id==='orc'){
       const blade=(along,across)=>({x:tip.x+tx*along+nx*across,y:tip.y+ty*along+ny*across});
       b.outlined([blade(-4,-2),blade(-5,-5),blade(-2,-6),blade(1,-5),blade(2,-2),blade(0,2),blade(-2,3),blade(-3,1)],p.metal[0]);b.poly([blade(-4,-3),blade(-3,-5),blade(-1,-5),blade(1,-3),blade(0,1),blade(-2,2)],p.metal[1]);b.line(blade(-3,-5),blade(0,-4),p.metal[3]);b.line(blade(0,-4),blade(1,-1),p.metal[2]);
     }else{b.outlined([q(3,-1.4),q(len-3,-1.1),q(len,0),q(len-3,1.1),q(3,1.4)],p.metal[1]);b.line(q(4,-.7),tip,p.metal[3]);b.line(q(2,-2.5),q(2,2.5),p.metal[0],1);b.line(q(2,-2),q(2,2),p.metal[2]);b.oval(q(-2,0).x,q(-2,0).y,1,1,p.metal[1]);}
   }
   for(const hand of rig.arms.filter(a=>a.side===(rig.weapon.hand==='left'?-1:1)||id==='orc')){const h=at(hand.end);outlinedOval(h.x,h.y,1.2,1.2,id==='knight'?p.metal[1]:p.skin[1]);b.dot(h.x-1,h.y-1,id==='knight'?p.metal[3]:p.skin[2]);}
 }
 if(shield&&rig.shield){
  const q=at(rig.shield.grip),w=1.5+Math.abs(Math.sin(angle))*2.5;
  b.outlined([{x:q.x-w,y:q.y-4},{x:q.x+w,y:q.y-4},{x:q.x+w,y:q.y+2},{x:q.x,y:q.y+5},{x:q.x-w,y:q.y+2}],p.metal[2]);
  b.poly([{x:q.x-w+1,y:q.y-3},{x:q.x+w-1,y:q.y-3},{x:q.x+w-1,y:q.y+1},{x:q.x,y:q.y+4},{x:q.x-w+1,y:q.y+1}],rig.back?'#614735':p.cloth[0]);
  if(rig.back){b.line({x:q.x,y:q.y-2},{x:q.x,y:q.y+2},'#b28f61',1);b.rect(q.x-1,q.y,2,1,p.metal[0]);}
  else if(w>2){b.poly([{x:q.x-w+2,y:q.y-2},{x:q.x,y:q.y-2},{x:q.x,y:q.y+3},{x:q.x-w+2,y:q.y+1}],p.cloth[1]);b.line({x:q.x,y:q.y-2},{x:q.x,y:q.y+2},p.metal[3]);b.line({x:q.x-2,y:q.y},{x:q.x+2,y:q.y},p.metal[3]);}
 }
}
