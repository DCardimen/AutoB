// All coordinates are normalized to the original painting. Effects are clipped
// to environmental features; the source art and creature layers stay intact.
export const AMBIENT_SCENES={
 rewards:{moon:null,water:[[[.10,.31],[.15,.33],[.20,.64],[.12,.61]],[[.27,.39],[.30,.40],[.32,.62],[.27,.60]],[[.425,.33],[.45,.34],[.46,.48],[.43,.47]],[[.36,.54],[.50,.55],[.49,.77],[.37,.74]],[[.235,.73],[.26,.74],[.27,.95],[.23,.93]],[[.64,.37],[.67,.38],[.69,.55],[.64,.55]]],mist:[[.25,.65,.20,.06],[.49,.79,.23,.07],[.69,.46,.14,.04]],sky:.29},
 grove:{moon:[.88,.09,.045],water:[[[.69,.38],[.71,.38],[.70,.52],[.67,.51]]],mist:[[.55,.50,.18,.035],[.50,.70,.25,.045]],sky:.22},
 night:{moon:[.73,.095,.085],mist:[[.46,.52,.31,.05],[.60,.73,.28,.04]],sky:.25},
 cinder:{lava:[[[.285,.09],[.30,.14],[.31,.22],[.32,.25]],[[.46,.39],[.47,.45],[.47,.48]],[[.06,.59],[.17,.63],[.26,.63],[.37,.64]],[[.38,.51],[.53,.52],[.63,.50],[.75,.48]],[[.01,.91],[.12,.94],[.17,1]]],mist:[[.49,.66,.30,.05],[.73,.53,.23,.05]],sky:.20},
 astral:{stars:true,moon:null,mist:[[.39,.52,.31,.05],[.65,.66,.26,.05]],sky:.30},
 glade:{lanterns:[[.15,.14],[.79,.17],[.10,.70],[.90,.70]],mist:[[.50,.12,.26,.035]]},
 sky:{stars:true,sky:.70,moon:[.80,.14,.07],mist:[[.26,.22,.22,.045]]}
};
const TAU=Math.PI*2;
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function glow(c,x,y,rx,ry,color,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.globalAlpha*=alpha;c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
export function coverGeometry(w,h,iw,ih,px=.5,py=.5){const scale=Math.max(w/iw,h/ih);return {x:(w-iw*scale)*px,y:(h-ih*scale)*py,w:iw*scale,h:ih*scale};}
export function paintAmbient(c,theme,time,{width=1002,height=654,image=null,positionY=.5,cover=true}={}){
 const scene=AMBIENT_SCENES[theme];if(!scene)return;
 c.save();const g=image?.naturalWidth&&cover?coverGeometry(width,height,image.naturalWidth,image.naturalHeight,.5,positionY):{x:0,y:0,w:width,h:height};c.translate(g.x,g.y);c.scale(g.w,g.h);
 for(const [i,points]of (scene.water||[]).entries()){
  c.save();polygon(c,points);c.clip();
  // A subpixel shimmer of the painted water, followed by travelling glints.
  if(image?.naturalWidth){c.globalAlpha=.26;c.drawImage(image,0,Math.sin(time*2+i)*.003,1,1);c.globalAlpha=1;}
  const ys=points.map(p=>p[1]),xs=points.map(p=>p[0]),top=Math.min(...ys),bottom=Math.max(...ys),left=Math.min(...xs),right=Math.max(...xs);
  for(let n=0;n<6;n++){const y=top+((time*.13+n*.17+i*.13)%1)*(bottom-top),x=left+(n+.5)/6*(right-left);const streak=c.createLinearGradient(0,y,0,y+.05);streak.addColorStop(0,'#d4faff00');streak.addColorStop(.65,'#e2fcff77');streak.addColorStop(1,'#d4faff00');c.fillStyle=streak;c.fillRect(x,y,.0018,.05);}
  c.restore();
 }
 for(const [i,line]of (scene.lava||[]).entries()){
  c.save();c.lineCap='round';c.strokeStyle=`rgba(255,178,87,${.16+.08*Math.sin(time*1.3+i)})`;c.lineWidth=.003;c.beginPath();line.forEach(([x,y],n)=>n?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  // Slow embers stay inside the painted volcanic sky and lava valleys.
  for(let n=0;n<3;n++){const f=(time*.05+n*.31+i*.12)%1,a=line[Math.min(line.length-2,Math.floor(f*(line.length-1)))],b=line[Math.min(line.length-1,Math.floor(f*(line.length-1))+1)],v=f*(line.length-1)%1;glow(c,a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v,.012,.008,'#ffca75',.22);}
  c.restore();
 }
 for(const [i,[x,y,rx,ry]]of (scene.mist||[]).entries())glow(c,x+Math.sin(time*.055+i)*.012,y+Math.sin(time*.08+i)*.002,rx,ry,theme==='cinder'?'#b79b9a':'#b6dce9',.08+.025*Math.sin(time*.24+i));
 if(scene.moon){const [x,y,r]=scene.moon;glow(c,x+Math.sin(time*.04)*.0015,y,r*2.8,r*3.7,'#a7d9f6',.07+.025*Math.sin(time*.45));}
 if(scene.sky){
  // Very thin drifting cloud veils; mountains and buildings never translate.
  for(let i=0;i<2;i++)glow(c,.35+i*.22+Math.sin(time*.035+i)*.015,scene.sky*.47+i*.025,.18,.014,'#bdd4df',.045);
 }
 if(scene.stars||theme==='night'||theme==='grove')for(let i=0;i<16;i++){
  const x=.15+((i*137)%701)/1000,y=.035+((i*67)%173)/1000,twinkle=Math.pow(Math.max(0,Math.sin(time*(.35+i%3*.1)+i*1.7)),6);
  c.save();c.globalAlpha=.12+twinkle*.55;c.fillStyle=theme==='astral'?'#e7c9ff':'#dcf4ff';c.fillRect(x,y,.0015,.002);if(twinkle>.5){c.globalAlpha*=.6;c.fillRect(x-.002,y+.0006,.0055,.0008);c.fillRect(x+.0004,y-.003,.0007,.008);}c.restore();
 }
 for(const [i,[x,y]]of (scene.lanterns||[]).entries()){
  glow(c,x,y,.032,.045,'#ffbc59',.15+.045*Math.sin(time*7+i)+.025*Math.sin(time*11+i*2));
  const f=(time*.2+i*.31)%1;glow(c,x+Math.sin(time+i)*.003,y-f*.025,.002,.004,'#ffe09b',(1-f)*.3);
 }
 c.restore();
}
