import {SKILLS} from './skills.js';
import {skillVisual} from './skill-visuals.js';
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const profiles=new Map();
export function effectProfile(id,sourceId){const key=id+':'+(sourceId||'');if(!profiles.has(key))profiles.set(key,skillVisual(SKILLS[id]||{id,species:sourceId}));return profiles.get(key);}
const line=(c,x1,y1,x2,y2)=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
const diamond=(c,x,y,r)=>{c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.55,y);c.lineTo(x,y+r);c.lineTo(x-r*.55,y);c.closePath();c.fill();};
function leaf(c,x,y,r,angle){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(0,-r,r,0);c.quadraticCurveTo(0,r,-r,0);c.fill();c.restore();}
function halo(c,x,y,r,p,alpha=.3){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,p.color+'88');g.addColorStop(.45,p.color+'33');g.addColorStop(1,p.color+'00');c.save();c.globalAlpha*=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function sigil(c,x,y,r,p,phase,{reduced=false,alpha=1}={}){
 c.save();c.translate(x,y);c.scale(1,.58);c.globalAlpha*=alpha;c.lineWidth=1.2;c.strokeStyle=p.color;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.strokeStyle=p.light;c.globalAlpha*=.7;c.beginPath();c.arc(0,0,r*.82,.1,TAU-.1);c.stroke();
 const spin=reduced?0:phase*.2;c.fillStyle=p.light;
 for(let i=0;i<6;i++){const a=i*TAU/6+spin,rr=r*.91;c.save();c.translate(Math.cos(a)*rr,Math.sin(a)*rr);c.rotate(a);c.fillRect(-2,-1,4,2);c.restore();}
 c.restore();
}
function motes(c,x,y,r,p,age,{reduced=false,count=7,rise=0}={}){
 for(let i=0;i<(reduced?3:count);i++){
  const a=i*2.399+(p.seed%31)*.1,rr=r*(.35+age*.8),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.58-age*rise;
  c.fillStyle=i%3?p.color:p.light;
  if(p.element==='grove')leaf(c,xx,yy,2+i%2,a+age);else if(p.element==='tide')diamond(c,xx,yy,2+i%3);else if(p.element==='void'){c.beginPath();c.arc(xx,yy,1.4+i%2,0,TAU);c.fill();}else c.fillRect(Math.round(xx),Math.round(yy),2+i%2,2+i%2);
 }
}
export function paintSkillHazard(c,h,screen,time,{reduced=false,intensity=1}={}){
 const p=effectProfile(h.skillId,h.source?.id),q=screen(h.x,h.y),progress=clamp(1-h.ttl/h.total,0,1);
 c.save();c.globalAlpha=clamp(intensity,.35,1);c.translate(q.x,q.y);c.scale(1,.58);
 // The danger edge is the real world radius; decorative art stays inside it.
 c.fillStyle=p.dark+'40';c.beginPath();c.arc(0,0,h.r,0,TAU);c.fill();c.lineWidth=1.5;c.strokeStyle=h.source?.side?'#e6a487':'#c4dca1';c.globalAlpha=1;c.stroke();c.globalAlpha=clamp(intensity,0,1);
 c.strokeStyle=p.color;c.setLineDash([7,6]);c.beginPath();c.arc(0,0,h.r*.9,-Math.PI/2,-Math.PI/2+TAU*progress);c.stroke();c.setLineDash([]);
 c.fillStyle=p.color+'55';for(let i=0;i<8;i++){const a=i*TAU/8+(reduced?0:time*.12);diamond(c,Math.cos(a)*h.r*.65,Math.sin(a)*h.r*.65,3);}
 c.restore();return true;
}
export function paintSkillProjectile(c,p,screen,z,time,{reduced=false,intensity=1}={}){
 const v=effectProfile(p.skillId,p.source?.id),q=screen(p.x,p.y+14),angle=Math.atan2(p.vy*.58,p.vx),power=1+v.quality*.035+v.stage*.08;
 c.save();c.globalAlpha=1;
 for(let i=0;i<p.trail.length;i++){const t=p.trail[i],s=screen(t.x,t.y+14),f=(i+1)/p.trail.length;c.globalAlpha=clamp(intensity,0,1)*f*.35;c.fillStyle=v.color;c.fillRect(s.x-1,s.y-z,2+f*2,2+f*2);}
 c.globalAlpha=1;c.translate(q.x,q.y-z);c.rotate(angle);c.scale(power,power);
 if(p.nativeArrow&&(v.auto||['bow','salvo'].includes(v.shape))){
  c.fillStyle='#ac8055';c.fillRect(-12,-1,18,2);c.fillStyle='#e3d6ad';c.beginPath();c.moveTo(8,0);c.lineTo(1,-3);c.lineTo(1,3);c.closePath();c.fill();c.strokeStyle='#b6cbad';c.lineWidth=1;line(c,-11,-3,-6,0);line(c,-11,3,-6,0);
 }else{
  if(intensity>0)halo(c,0,0,v.auto?11:17,v,.8*intensity);c.fillStyle=v.color;
  if(v.shape==='cannon'){c.fillRect(-7,-3,13,6);c.fillStyle=v.light;c.fillRect(3,-2,4,4);}
  else if(v.element==='tide'){c.save();c.rotate(Math.PI/2);diamond(c,0,0,v.auto?6:9);c.fillStyle=v.light;diamond(c,0,0,4);c.restore();}
  else if(v.element==='grove'){leaf(c,0,0,v.auto?7:10,0);c.strokeStyle=v.light;c.lineWidth=1;line(c,-5,0,5,0);}
  else if(v.element==='ember'){c.beginPath();c.moveTo(8,0);c.quadraticCurveTo(1,-7,-10,-3);c.lineTo(-6,0);c.lineTo(-10,3);c.quadraticCurveTo(1,7,8,0);c.fill();c.fillStyle=v.light;c.fillRect(1,-1,4,2);}
  else if(v.element==='void'){c.beginPath();c.arc(0,0,6,0,TAU);c.fill();c.fillStyle=v.ink;c.beginPath();c.arc(-2,-2,4,0,TAU);c.fill();c.strokeStyle=v.light;c.lineWidth=1;c.beginPath();c.arc(0,0,8,-1,1);c.stroke();}
  else{c.beginPath();c.moveTo(9,0);c.lineTo(0,-5);c.lineTo(2,-1);c.lineTo(-8,-2);c.lineTo(-1,5);c.lineTo(-2,1);c.closePath();c.fill();c.strokeStyle=v.light;c.lineWidth=1;line(c,0,0,7,0);}
  if(!reduced&&intensity>.1&&p.skill){c.strokeStyle=v.color;c.lineWidth=1;c.beginPath();c.ellipse(-2,0,11,6,0,time*2,time*2+Math.PI);c.stroke();}
 }
 c.restore();return true;
}
export function paintSkillImpact(c,e,q,height,{reduced=false}={}){
 if(!e.skillId||SKILLS[e.skillId]?.auto||e.blocked)return;
 const p=effectProfile(e.skillId,e.sourceId),age=clamp(1-e.ttl/e.max,0,1);
 c.save();c.globalAlpha*=.75*(1-age);motes(c,q.x,q.y-height*.62,10+e.r*.25,p,age,{reduced,count:6});c.restore();
}
export function paintSkillEffect(c,e,q,screen,height,time,{reduced=false,heightScale=1}={}){
 if(!e.skillId||!['cast','heal','shield','ring','nova','lightning','beam','breath','telegraph'].includes(e.type))return false;
 const p=effectProfile(e.skillId,e.sourceId),age=clamp(1-e.ttl/(e.max||.5),0,1),fade=1-age,boost=1+p.quality*.04+p.stage*.1;
 c.save();
 if(e.type==='telegraph'){c.restore();return true;}// The hazard renderer owns its exact ground edge.
 if(e.tx!==undefined){
  const target=screen(e.tx,e.ty),start={x:q.x,y:q.y-(e.originZ===undefined?height*.65:e.originZ*heightScale)},end={x:target.x,y:target.y-(e.targetZ===undefined?height*.65:e.targetZ*heightScale)},dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy)||1;
  c.lineJoin='round';c.lineCap='round';
  if(e.type==='breath'){
   const nx=-dy/length,ny=dx/length,spread=Math.min(35,(e.r||70)*.35);c.fillStyle=p.color+'35';c.beginPath();c.moveTo(start.x,start.y);c.quadraticCurveTo(end.x+nx*spread,end.y+ny*spread,end.x,end.y);c.quadraticCurveTo(end.x-nx*spread,end.y-ny*spread,start.x,start.y);c.fill();
   for(let i=1;i<=7;i++){const t=((i/8+age*.4)%1),x=start.x+dx*t,y=start.y+dy*t;c.fillStyle=i%2?p.color:p.light;if(p.element==='grove')leaf(c,x,y,2+t*3,i);else diamond(c,x,y,2+t*3);}
  }else{
   const points=[];for(let i=0;i<=9;i++){const t=i/9,jitter=i===0||i===9?0:e.type==='lightning'?Math.sin(i*9+p.seed+Math.floor(age*5))*7:Math.sin(t*TAU-age*5)*3;points.push({x:start.x+dx*t-dy/length*jitter,y:start.y+dy*t+dx/length*jitter});}
   const stroke=(color,width,alpha)=>{c.strokeStyle=color;c.lineWidth=width;c.globalAlpha*=alpha;c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();c.globalAlpha/=alpha;};
   stroke(p.dark,Math.min(12,e.width||5)+4,.6);stroke(p.color,Math.min(6,e.width||3),.85);stroke(p.light,1.2,1);
   if(!reduced){const t=(age*1.7)%1;c.fillStyle=p.light;diamond(c,start.x+dx*t,start.y+dy*t,3);}
  }
 }else if(e.type==='cast'){
  sigil(c,q.x,q.y,clamp((e.r||45)*.65*boost,22,45)*(1+age*.15),p,age,{reduced,alpha:.75});
  halo(c,q.x,q.y-height*.55,22*boost,p,.3*fade);motes(c,q.x,q.y-8,18,p,age,{reduced,rise:height*.6,count:6});
  if(p.stage){c.strokeStyle=p.light;c.lineWidth=1.2;c.beginPath();c.arc(q.x,q.y-height*.7,18+age*12,-Math.PI*.8,-Math.PI*.2);c.stroke();}
 }else if(e.type==='shield'){
  const x=q.x,y=q.y-height*.55,r=clamp((e.r||38)*.55*boost,17,32);halo(c,x,y,r*1.4,p,.25);
  c.fillStyle=p.dark+'32';c.strokeStyle=p.color;c.lineWidth=1.7;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.8,y-r*.55);c.lineTo(x+r*.65,y+r*.5);c.quadraticCurveTo(x+r*.4,y+r,x,y+r*1.2);c.quadraticCurveTo(x-r*.4,y+r,x-r*.65,y+r*.5);c.lineTo(x-r*.8,y-r*.55);c.closePath();c.fill();c.stroke();c.strokeStyle=p.light;c.lineWidth=1;line(c,x-r*.55,y-r*.4,x,y-r*.75);line(c,x,y-r*.75,x+r*.55,y-r*.4);
 }else if(e.type==='heal'){
  const x=q.x,y=q.y-height*.5-age*12;c.fillStyle=p.color;halo(c,x,y,23,p,.4);
  for(let i=0;i<4;i++)leaf(c,x+Math.cos(i*Math.PI/2)*6,y+Math.sin(i*Math.PI/2)*6,5,i*Math.PI/2);c.fillStyle=p.light;diamond(c,x,y,5);motes(c,q.x,q.y-4,17,p,age,{reduced,rise:height*.7,count:5});
 }else if(e.type==='ring'||e.type==='nova'){
  const r=(e.r||70)*(.4+.6*age),x=q.x,y=q.y;
  sigil(c,x,y,r,p,age,{reduced,alpha:fade*.85});
  if(p.shape==='roots'){
   c.strokeStyle=p.color;c.lineWidth=2;for(let i=0;i<6;i++){const a=i*TAU/6,xx=x+Math.cos(a)*r*.65,yy=y+Math.sin(a)*r*.58*.65,stem=(12+age*18)*fade;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx-8,yy-stem*.5,xx+3,yy-stem);c.stroke();c.fillStyle=p.light;leaf(c,xx+2,yy-stem*.7,4,a);}
  }else if(p.shape==='frost'){
   c.fillStyle=p.color;for(let i=0;i<7;i++){const a=i*TAU/7;diamond(c,x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.58*.65,Math.max(2,14*fade));}
  }else if(p.shape==='meteor'&&e.type==='nova'){
   halo(c,x,y-height*.2,Math.min(95,r),p,.6*fade);c.fillStyle=p.light;diamond(c,x,y-height*.2,14*fade);motes(c,x,y,Math.min(r*.8,95),p,age,{reduced,count:10,rise:25});
  }else if(p.shape==='gravity'){c.strokeStyle=p.color;c.lineWidth=2;c.beginPath();c.ellipse(x,y-height*.45,24*(1-age*.5),10,age*.4,0,TAU);c.stroke();halo(c,x,y-height*.4,30,p,.35);}
  else if(['nova','heal','ward','shell'].includes(p.shape)){halo(c,x,y-height*.4,clamp(r*.4,25,80),p,.25*fade);motes(c,x,y-10,Math.min(90,r*.6),p,age,{reduced,count:p.stage?12:8,rise:20});}
  else{c.save();c.translate(x,y);c.scale(1,.58);c.strokeStyle=p.light;c.lineWidth=2;for(let i=0;i<5;i++){const a=i*TAU/5+(p.seed%13)*.1;c.beginPath();c.arc(0,0,r*.87,a,a+.35);c.stroke();}c.restore();motes(c,x,y,Math.min(r*.65,90),p,age,{reduced,count:8});}
 }
 c.restore();return true;
}
