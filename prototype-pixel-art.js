import {projectRig,characterRig} from './prototype-rig.js';
import {drawNativeFace,FACE_VIEWS} from './prototype-faces.js';
export const CELL=64,PIVOT={x:32,y:44},PIXEL_WORLD=3;
const OUT='#20272a';
export const PIXEL_PALETTES={
 knight:{skin:['#845e48','#c78d62','#f0c48c'],cloth:['#662936','#a33b42','#e05b4d'],metal:['#495966','#8796a0','#c3c8ae','#f0e1b1'],hair:['#7d2332','#bc3c40','#ec694e']},
 orc:{skin:['#3e5736','#6e913f','#a2bc57'],cloth:['#40352f','#75533b','#ad794a'],metal:['#374650','#788a8c','#bcc3aa','#e0d5a8'],hair:['#222c2d','#374337','#536049']},
 elf:{skin:['#976c50','#d5a479','#f4d3a1'],cloth:['#203d37','#397653','#71a467'],metal:['#48534d','#899882','#c9cba1','#edd698'],hair:['#95703d','#c8a153','#f0cc7a']},
 caster:{skin:['#976674','#d3a8a0','#f1d7b6'],cloth:['#382d58','#69528d','#9b76bd'],metal:['#3a5061','#648aa1','#b6d6dd','#e8ead4'],hair:['#647081','#a6acb8','#e6ded3']},
 fox:{skin:['#97532f','#d48b3d','#f0b863'],cloth:['#1f3e37','#3b7450','#79a367'],metal:['#5c5544','#a89969','#d2c19a','#eee0b5'],hair:['#97532f','#d48b3d','#f0b863']},
 wolf:{skin:['#954e31','#cd7c38','#edae58'],cloth:['#642c35','#a64140','#dd674d'],metal:['#5e5541','#a9a070','#dbcf9f','#f3deba'],hair:['#8f4a31','#c77a39','#edab55']},
 mech:{skin:['#4e473b','#9b7043','#d8a85e'],cloth:['#36484d','#647b7b','#a1ad9b'],metal:['#3c4549','#6b797d','#b4bcac','#e3d3a5'],hair:['#354b58','#63979e','#a5e6e3']},
 spider:{skin:['#2d253f','#55436b','#8972a0'],cloth:['#2b233b','#50345f','#8b5496'],metal:['#483957','#786089','#bea1cd','#e9c7eb'],hair:['#372844','#725395','#c190df']},
 jelly:{skin:['#185674','#358ca2','#72c8ce'],cloth:['#174d68','#278ba1','#7ce0df'],metal:['#356b8c','#67a9bf','#a6e8e0','#e0faf0'],hair:['#195673','#428fa8','#86d9df']},
};
const colors=new Map();function rgba(c){if(!colors.has(c))colors.set(c,[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16),255]);return colors.get(c);}
class PixelBrush{
 constructor(){this.data=new Uint8ClampedArray(CELL*CELL*4);this.clipped=0;}
 dot(x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=CELL||y>=CELL){this.clipped++;return;}this.data.set(rgba(c),(y*CELL+x)*4);}
 rect(x,y,w,h,c){for(let j=Math.round(y);j<Math.round(y+h);j++)for(let i=Math.round(x);i<Math.round(x+w);i++)this.dot(i,j,c);}
 oval(x,y,rx,ry,c){for(let j=Math.floor(y-ry);j<=Math.ceil(y+ry);j++)for(let i=Math.floor(x-rx);i<=Math.ceil(x+rx);i++)if(((i-x)/(rx||1))**2+((j-y)/(ry||1))**2<=1)this.dot(i,j,c);}
 line(a,b,c,r=0){let x=Math.round(a.x),y=Math.round(a.y),tx=Math.round(b.x),ty=Math.round(b.y),dx=Math.abs(tx-x),sx=x<tx?1:-1,dy=-Math.abs(ty-y),sy=y<ty?1:-1,err=dx+dy;for(let k=0;k<160;k++){this.oval(x,y,r||0.6,r||0.6,c);if(x===tx&&y===ty)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}}
 poly(vertices,c){const xs=vertices.map(p=>p.x),ys=vertices.map(p=>p.y);for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}if(inside)this.dot(x,y,c);}}
 rotated(layer,center,angle){const cos=Math.cos(angle),sin=Math.sin(angle);for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){const dx=x-center.x,dy=y-center.y,sx=Math.round(center.x+dx*cos+dy*sin),sy=Math.round(center.y-dx*sin+dy*cos);if(sx<0||sy<0||sx>=CELL||sy>=CELL)continue;const src=(sy*CELL+sx)*4;if(layer.data[src+3])this.data.set(layer.data.subarray(src,src+4),(y*CELL+x)*4);}for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(layer.data[(y*CELL+x)*4+3]){const dx=x-center.x,dy=y-center.y,tx=Math.round(center.x+dx*cos-dy*sin),ty=Math.round(center.y+dx*sin+dy*cos);if(tx<0||ty<0||tx>=CELL||ty>=CELL)this.clipped++;}this.clipped+=layer.clipped;}
 outlined(points,c){this.poly(points,c);points.forEach((p,i)=>this.line(p,points[(i+1)%points.length],OUT));}
}
export function spritePoint(p,angle){const s=projectRig(p,angle);return {x:PIVOT.x+s.x/PIXEL_WORLD,y:PIVOT.y+s.y/PIXEL_WORLD,depth:s.depth};}
export function paintCharacterPixels(id,rig,angle){
 let b=new PixelBrush();const p=PIXEL_PALETTES[id],dir=((Math.round(angle/(Math.PI/4))%8)+8)%8,front=dir===2,back=!FACE_VIEWS[dir].eyes.length,side=FACE_VIEWS[dir].sign,at=q=>spritePoint(q,angle);
 const body=at(rig.body),pelvis=at(rig.pelvis),head=at(rig.head),moving=['walk','run','sprint','turn','stop'].includes(rig.state),dead=rig.death>0;
 const bind=rig.ragdoll?characterRig(id,'idle',0):null;let headRoll=0;if(bind){const h=at(bind.head),c=at(bind.body),rest=Math.atan2(h.x-c.x,-(h.y-c.y)),current=Math.atan2(head.x-body.x,-(head.y-body.y));headRoll=Math.round(Math.atan2(Math.sin(current-rest),Math.cos(current-rest))/(Math.PI/12))*(Math.PI/12);}
 if(rig.state==='idle')head.y+=Math.round(Math.sin(rig.phase*Math.PI*2)*0.7);
 function outlinedOval(x,y,rx,ry,color){b.oval(x,y,rx+1,ry+1,OUT);b.oval(x,y,rx,ry,color);}
 function segment(a,c,width,color,highlight){const x=at(a),y=at(c);b.line(x,y,OUT,width+1);b.line(x,y,color,width);if(highlight)b.line({x:x.x-1,y:x.y-1},{x:y.x-1,y:y.y-1},highlight,0);}
 function leg(l){segment(l.root,l.joint,id==='orc'?2:id==='mech'?1.7:1,p.skin[0],p.skin[1]);segment(l.joint,l.hock||l.end,id==='orc'?1.7:1,id==='knight'||id==='mech'?p.metal[1]:p.skin[1],p.metal[2]);if(l.hock)segment(l.hock,l.end,0.7,p.skin[0],p.skin[1]);const f=at(l.end);outlinedOval(f.x+0.5,f.y, id==='spider'?1:id==='mech'?2.3:2,id==='spider'?0.6:1,id==='wolf'?p.metal[3]:p.metal[0]);b.dot(f.x+1,f.y-1,p.metal[2]);}
 const sorted=rig.legs.slice().sort((a,c)=>at(a.root).depth-at(c.root).depth),far=sorted.filter(l=>at(l.root).depth<0),near=sorted.filter(l=>at(l.root).depth>=0);
 far.forEach(leg);
 // Cloth panels are attached at the shoulders. Spring state from the simulation
 // adds delayed lift and lateral swing; the preview uses the same gait rhythm.
 if(['knight','elf','caster','fox'].includes(id)){
   const wind=(rig.cape?.map(v=>typeof v==='number'?v:v.angle)||[0,1,2].map(i=>(moving?0.7:0.06)+Math.sin(rig.phase*Math.PI*2-i*0.65)*(moving?0.2:0.04)));
   const root=at({...rig.body,x:rig.body.x-5,z:rig.body.z+6}),rear=at({...rig.pelvis,x:rig.pelvis.x-12-(wind[1]||0)*12,z:rig.pelvis.z-7+(wind[1]||0)*9});
   for(let i=0;i<3;i++){const dx=(i-1)*3,tip={x:rear.x+dx+(wind[i]||0)*Math.sin(angle)*4,y:rear.y+(i===1?2:0)};b.outlined([{x:root.x+dx-2,y:root.y},{x:root.x+dx+2,y:root.y},{x:tip.x+2,y:tip.y},{x:tip.x-2,y:tip.y}],p.cloth[i===1?1:0]);b.line({x:root.x+dx,y:root.y+2},{x:tip.x,y:tip.y-1},p.cloth[2]);}
 }
 if(id==='jelly'){
   const squash=rig.squash||1,rx=8*squash,ry=9/squash,x=body.x,y=Math.min(54,body.y+2);
   outlinedOval(x,y,rx,ry,p.skin[0]);b.oval(x-1,y-1,Math.max(1,rx-1),Math.max(1,ry-1),p.skin[1]);b.oval(x-2,y-3,Math.max(1,rx-3),Math.max(1,ry-4),p.skin[2]);
   b.line({x:x-rx+3,y:y-ry+4},{x:x-rx+5,y:y-ry+2},p.metal[3],1);b.oval(x+3,y-ry+4,1,1,p.metal[2]);
   if(!dead){const pearl=at({...rig.body,x:rig.body.x+8,z:rig.body.z+1});b.oval(pearl.x,pearl.y,2,1,p.skin[0]);b.dot(pearl.x-1,pearl.y-1,p.metal[2]);}
   if(!back&&!dead){for(const dx of FACE_VIEWS[dir].eyes){b.rect(Math.round(x)+dx,y-2,1,2,OUT);b.dot(Math.round(x)+dx,y-3,p.metal[3]);}b.dot(Math.round(x)+FACE_VIEWS[dir].sign*2,y+2,p.metal[3]);}
   for(let i=0;i<3;i++)b.oval(x+(i-1)*6,y+ry-1,2,1,p.skin[1]);
   if(rig.state==='cast'||rig.state==='attack'){const q=at(rig.weapon.tip);outlinedOval(q.x,q.y,2+Math.round(rig.phase*2),2,p.metal[2]);b.dot(q.x-1,q.y-1,p.metal[3]);}
   b.data.clipped=b.clipped;return b.data;
 }
 if(id==='mech'||id==='spider'||id==='wolf'){
   const rx=id==='wolf'?Math.hypot((27+(rig.spine||0))*Math.cos(angle),14*Math.sin(angle))/3:7,ry=id==='wolf'?4+Math.abs(Math.sin(angle))*2:5;
   outlinedOval(body.x,body.y,rx,ry,id==='mech'?p.metal[0]:p.skin[0]);b.oval(body.x-1,body.y-1,rx-1,ry-1,p.skin[1]);b.oval(body.x-3,body.y-2,rx-3,Math.max(1,ry-3),p.skin[2]);
   if(id==='mech'){
     b.outlined([{x:body.x-6,y:body.y-4},{x:body.x+4,y:body.y-5},{x:body.x+7,y:body.y},{x:body.x+4,y:body.y+5},{x:body.x-6,y:body.y+3}],p.skin[1]);
     b.line({x:body.x-5,y:body.y-3},{x:body.x+2,y:body.y-4},p.skin[2]);
     for(const dx of [-4,3])for(const dy of [-2,2])b.dot(body.x+dx,body.y+dy,p.metal[3]);
     const muzzle=at(rig.weapon.tip),grip=at(rig.weapon.grip);b.line(grip,muzzle,OUT,2);b.line(grip,muzzle,p.metal[1],1);b.dot(muzzle.x,muzzle.y,p.hair[2]);
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
   near.forEach(leg);b.data.clipped=b.clipped;return b.data;
 }
 function drawArm(arm){segment(arm.root,arm.joint,id==='orc'?2:1.2,id==='knight'?p.metal[1]:id==='orc'?p.skin[1]:p.cloth[1],id==='knight'?p.metal[2]:p.cloth[2]);segment(arm.joint,arm.end,1,id==='knight'?p.metal[0]:p.skin[0],p.skin[1]);const h=at(arm.end);outlinedOval(h.x,h.y,1.2,1.2,id==='knight'?p.metal[2]:p.skin[1]);}
 function gearLayer(grip){const depth=at(grip).depth;return depth<body.depth-0.5?'far':depth<head.depth?'middle':'near';}
 function drawGear(layer){drawGearPart(b,id,rig,angle,p,at,outlinedOval,rig.weapon&&gearLayer(rig.weapon.grip)===layer,rig.shield&&gearLayer(rig.shield.grip)===layer);}
 rig.arms.filter(a=>at(a.root).depth<body.depth).forEach(drawArm);
 drawGear('far');
 // Compact human torsos, stout boots and connected short forearms.
 outlinedOval(body.x,body.y, id==='orc'?6:4.5,5,p.cloth[0]);b.oval(body.x-1,body.y-1,id==='orc'?5:3.5,4,id==='knight'?p.metal[1]:p.cloth[1]);
 b.line({x:body.x-3,y:body.y-3},{x:body.x+2,y:body.y-3},id==='knight'?p.metal[3]:p.cloth[2]);
 if(id==='orc'){b.oval(body.x-3,body.y-1,2,2,p.skin[1]);b.oval(body.x+3,body.y-1,2,2,p.skin[1]);b.line({x:body.x-5,y:body.y-3},{x:body.x+4,y:body.y+2},p.cloth[2],1);}
 if(id==='knight'){b.outlined([{x:body.x-2,y:body.y-2},{x:body.x+2,y:body.y-2},{x:pelvis.x+2,y:pelvis.y+3},{x:pelvis.x-2,y:pelvis.y+3}],p.cloth[1]);b.line({x:body.x,y:body.y},{x:body.x,y:body.y+3},p.metal[3]);}
 if(id==='caster'){b.outlined([{x:body.x-4,y:body.y},{x:body.x+4,y:body.y},{x:pelvis.x+6,y:pelvis.y+5},{x:pelvis.x-6,y:pelvis.y+5}],p.cloth[1]);b.line({x:body.x-1,y:body.y},{x:pelvis.x-2,y:pelvis.y+4},p.cloth[2]);b.line({x:pelvis.x-5,y:pelvis.y+4},{x:pelvis.x+5,y:pelvis.y+4},p.metal[3]);}
 b.line({x:pelvis.x-4,y:pelvis.y-1},{x:pelvis.x+4,y:pelvis.y-1},p.metal[0],1);b.rect(pelvis.x-1,pelvis.y-2,2,2,p.metal[3]);
 near.forEach(leg);
 rig.arms.filter(a=>at(a.root).depth>=body.depth).forEach(drawArm);
 drawGear('middle');
 if(id==='fox'){const tail=at({...rig.pelvis,x:rig.pelvis.x-12,y:Math.sin(rig.phase*Math.PI*2)*6,z:rig.pelvis.z-4});b.line({x:pelvis.x,y:pelvis.y+2},tail,OUT,3);b.line({x:pelvis.x,y:pelvis.y+2},tail,p.skin[1],2);b.oval(tail.x,tail.y,2,2,p.metal[3]);}
 const torsoBrush=b;if(rig.ragdoll)b=new PixelBrush();
 drawNativeFace(b,id,head,dir,p,rig);
 if(rig.ragdoll){torsoBrush.rotated(b,head,headRoll);b=torsoBrush;}
 drawGear('near');
 b.data.clipped=b.clipped;return b.data;
}
function drawGearPart(b,id,rig,angle,p,at,outlinedOval,weapon,shield){
 if(weapon&&rig.weapon){
   const g=at(rig.weapon.grip),tip=at(rig.weapon.tip);
   if(['elf','fox'].includes(id)){
     const top=at({...rig.weapon.grip,z:rig.weapon.grip.z+24}),bottom=at({...rig.weapon.grip,z:rig.weapon.grip.z-24}),mid={x:g.x+Math.cos(angle)*3,y:g.y+Math.sin(angle)*1.5};
     b.line(top,mid,OUT,1);b.line(mid,bottom,OUT,1);b.line(top,mid,p.cloth[2]);b.line(mid,bottom,p.cloth[2]);
     const pull=rig.arms.find(a=>a.side===1);if(rig.state==='attack'&&rig.bowString?.draw>0.05){b.line(top,at(pull.end),p.metal[3]);b.line(at(pull.end),bottom,p.metal[3]);}else b.line(top,bottom,p.metal[3]);
     if(rig.bowString?.draw>0.4)b.line(at(pull.end),{x:g.x+Math.cos(angle)*7,y:g.y+Math.sin(angle)*4},p.metal[2]);
   }else if(id==='caster'){
     b.line(g,tip,OUT,1);b.line(g,tip,p.metal[1]);b.outlined([{x:tip.x,y:tip.y-3},{x:tip.x+2,y:tip.y},{x:tip.x,y:tip.y+3},{x:tip.x-2,y:tip.y}], '#68bccf');b.dot(tip.x-1,tip.y-1,'#d3f2e5');
     if(rig.state==='cast'){const q=Math.round(rig.phase*3);for(const dx of [-4-q,4+q])b.dot(tip.x+dx,tip.y-2,'#a393e9');b.dot(tip.x,tip.y-2-Math.min(2,q),'#dfd9f7');}
   }else{
     const dx=tip.x-g.x,dy=tip.y-g.y,len=Math.hypot(dx,dy)||1,tx=dx/len,ty=dy/len,nx=-ty,ny=tx;
     const q=(along,across)=>({x:g.x+tx*along+nx*across,y:g.y+ty*along+ny*across});
     b.line(q(-2,0),tip,OUT,1);b.line(q(-2,0),tip,id==='orc'?p.cloth[2]:p.metal[2]);
     if(id==='orc'){
       const blade=(along,across)=>({x:tip.x+tx*along+nx*across,y:tip.y+ty*along+ny*across});
       b.outlined([blade(-2,-1),blade(-3,-4),blade(0,-5),blade(2,-4),blade(2,1),blade(0,2)],p.metal[1]);b.line(blade(-2,-4),blade(1,-4),p.metal[3]);
     }else{b.line(q(2,-2),q(2,2),p.metal[3]);b.line(q(3,0),tip,p.metal[2]);b.dot(tip.x,tip.y,p.metal[3]);}
   }
   for(const hand of rig.arms.filter(a=>a.side===(rig.weapon.hand==='left'?-1:1)||id==='orc')){const h=at(hand.end);outlinedOval(h.x,h.y,1.2,1.2,id==='knight'?p.metal[1]:p.skin[1]);b.dot(h.x-1,h.y-1,id==='knight'?p.metal[3]:p.skin[2]);}
 }
 if(shield&&rig.shield){const q=at(rig.shield.grip);b.outlined([{x:q.x-4,y:q.y-4},{x:q.x+4,y:q.y-4},{x:q.x+4,y:q.y+2},{x:q.x,y:q.y+5},{x:q.x-4,y:q.y+2}],p.metal[2]);b.poly([{x:q.x-3,y:q.y-3},{x:q.x+3,y:q.y-3},{x:q.x+3,y:q.y+1},{x:q.x,y:q.y+4},{x:q.x-3,y:q.y+1}],p.cloth[1]);b.line({x:q.x,y:q.y-2},{x:q.x,y:q.y+2},p.metal[3]);b.line({x:q.x-2,y:q.y},{x:q.x+2,y:q.y},p.metal[3]);}
}
