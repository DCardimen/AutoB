// Native-pixel melee silhouettes. Grip is (0,0); shaft, guard and blade
// share one local frame so a turning or swinging hand cannot detach.
export function paintMeleeWeapon(b,rig,p,grip,tip,outline='#192328'){
 const kind=rig.gear||rig.weapon.kind,dx=tip.x-grip.x,dy=tip.y-grip.y,length=Math.hypot(dx,dy)||1,tx=dx/length,ty=dy/length,nx=-ty,ny=tx;
 const q=(a,n)=>({x:grip.x+tx*a+nx*n,y:grip.y+ty*a+ny*n});
 const sun=rig.equipment?.includes('sunsteel-edge')||kind==='sunblade';
 const steel=sun?['#6c513c','#bd995b','#e8cf91','#fff2c9']:['#344e5c','#738e9b','#b8cfce','#eaf3e5'];
 const wood=['#44312c','#815737','#c49b62'],gold='#d0ae70',edge=steel[3],shadow=steel[0],face=steel[1];
 const poly=(points,color)=>b.poly(points.map(([a,n])=>q(a,n)),color);
 const shape=(points,color)=>b.outlined(points.map(([a,n])=>q(a,n)),color);
 const line=(a,n,z,m,color,r=0)=>b.line(q(a,n),q(z,m),color,r);
 const dot=(a,n,color)=>{const v=q(a,n);b.dot(v.x,v.y,color);};
 const haft=(end)=>{line(-2,0,end,0,outline,1.05);line(-2,0,end,0,wood[1],.65);line(-1,-.5,end-1,-.5,wood[2]);for(let a=-1;a<=2;a+=2)line(a,-.8,a,.8,wood[0]);dot(-2,0,gold);};
 if(kind==='cannon'){line(0,0,length,0,outline,3);line(0,0,length,0,face,2);line(1,-1,length-1,-1,steel[2]);shape([[length-2,-2],[length+1,-2],[length+1,2],[length-2,2]],shadow);dot(length,0,'#a6ded4');return;}
 if(kind==='gauntlet'){shape([[-1,-2],[length-2,-3],[length+1,-2],[length+1,2],[length-2,3],[-1,2]],shadow);poly([[0,-1],[length-2,-2],[length,0],[length-1,2],[0,1]],face);line(1,-1,length-2,-2,edge);line(length-1,-2,length-1,2,steel[2]);return;}
 if(['hammer','royal-hammer'].includes(kind)){
  haft(length-1);const h=kind==='royal-hammer'?4.2:3.5;
  shape([[length-4,-h],[length,-h],[length+2,-h+1],[length+2,h-1],[length,h],[length-4,h]],shadow);
  poly([[length-3,-h+1],[length,-h+1],[length,0],[length-3,0]],steel[2]);
  poly([[length-3,0],[length,0],[length,h-1],[length-3,h-1]],face);
  line(length-3,-h,length,-h,edge);line(length+1,-h+1,length+1,h-1,steel[2]);line(length-4,-h+1,length-4,h-1,gold);
  dot(length-1,0,kind==='royal-hammer'?'#9dd5d2':gold);return;
 }
 if(['club','branch-club'].includes(kind)){
  haft(3);shape([[2,-1],[length-4,-2.5],[length-1,-3],[length+1,-1],[length+1,1],[length-1,3],[length-4,2.5],[2,1]],wood[0]);
  poly([[3,-.4],[length-3,-1.7],[length,-1],[length,1],[length-3,1.7],[3,.6]],wood[1]);
  line(4,-.8,length-3,-1.8,wood[2]);line(length-5,0,length-2,.5,wood[0]);dot(length-2,-1,gold);return;
 }
 if(['axe','great-axe'].includes(kind)){
  haft(length);const h=kind==='great-axe'?6:5.5;
  // A crescent cheek and polished cutting edge; the shaft remains readable.
  shape([[length-4,-1],[length-5,-h+1],[length-2,-h],[length+1,-h+1],[length+2,-2],[length,1],[length-3,2]],shadow);
  poly([[length-4,-2],[length-3,-h+1],[length-1,-h+1],[length,-2],[length-1,0],[length-3,1]],face);
  line(length-2,-h,length+1,-h+1,edge);line(length+1,-h+1,length+2,-2,steel[2]);line(length+2,-2,length,1,edge);
  line(length-4,-1,length-2,0,gold);dot(length-2,-2,steel[2]);
  if(kind==='great-axe'){shape([[length-3,1],[length-4,h-1],[length-1,h],[length+1,h-1],[length+1,2],[length-1,0]],shadow);poly([[length-3,2],[length-2,h-1],[length,h-1],[length,2]],face);line(length-1,h,length+1,h-1,edge);}
  return;
 }
 const knife=kind==='knife',rapier=kind==='rapier',moon=kind==='moonblade',wide=kind==='sunblade'||moon;
 haft(2);
 const guard=rapier?2.6:knife?1.7:wide?3.2:2.8,base=knife?1.5:rapier?1.1:wide?2.3:2;
 shape([[2,-base],[length-3,-base*.65],[length,0],[length-3,base*.65],[2,base]],shadow);
 poly([[3,-base+.3],[length-3,-base*.4],[length-.5,0],[3,0]],edge);
 poly([[3,0],[length-.5,0],[length-3,base*.65],[3,base-.2]],steel[2]);
 line(3,0,length-2,0,face);
 line(2,-guard,2,guard,outline,1);line(2,-guard+.4,2,guard-.4,gold,.55);dot(2,-guard,edge);dot(2,guard,shadow);
 if(rapier){const center=q(1,0);b.oval(center.x,center.y,1.5,1.5,shadow);dot(1,-1,gold);}
 if(wide)dot(3,0,moon?'#99d9d7':'#e5b86c');
}

export function meleeWeaponBounds(rig,grip,tip){
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 const include=(x,y,rx=0,ry=rx)=>{minX=Math.min(minX,Math.round(x)-Math.ceil(rx));maxX=Math.max(maxX,Math.round(x)+Math.ceil(rx));minY=Math.min(minY,Math.round(y)-Math.ceil(ry));maxY=Math.max(maxY,Math.round(y)+Math.ceil(ry));};
 const brush={dot:(x,y)=>include(x,y),oval:(x,y,rx,ry)=>include(x,y,rx,ry),line:(a,z,c,r=.6)=>{include(a.x,a.y,r||.6);include(z.x,z.y,r||.6);},poly:vertices=>vertices.forEach(v=>include(v.x,v.y)),outlined:vertices=>vertices.forEach(v=>include(v.x,v.y,.6))};
 paintMeleeWeapon(brush,rig,null,grip,tip);
 return {minX,minY,maxX,maxY};
}
