// Isolated one-facing art/rig study. This module is not loaded by the game.
export const CELL=64;
export const FORMS=['rowan','mature','moontrail'];
export const PARTS=['head-open','head-closed','torso','upper-right','fore-right','upper-left','fore-left','thigh-right','calf-right','thigh-left','calf-left','cape','tail','bow','quiver','arrow'];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const point=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function ik(root,end,upper,lower,bend=-1){
 const dx=end.x-root.x,dy=end.y-root.y,actual=Math.hypot(dx,dy)||.001,d=clamp(actual,Math.abs(upper-lower)+.001,upper+lower-.001),ux=dx/actual,uy=dy/actual;
 const a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
 return {root:{...root},joint:{x:root.x+ux*a-uy*h*bend,y:root.y+uy*a+ux*h*bend},end:{x:root.x+ux*d,y:root.y+uy*d},upper,lower};
}
function foot(phase,stride){
 const p=((phase%1)+1)%1,stance=.62;
 if(p<stance)return {x:mix(-stride/2,stride/2,p/stance),y:0,support:true};
 const q=(p-stance)/(1-stance);return {x:mix(stride/2,-stride/2,smooth(q)),y:-5.2*Math.sin(q*Math.PI),support:false};
}
export function poseAt(action,time,{stride=1,bowProfile=null}={}){
 const moving=action==='run',attack=action==='attack',phase=time/ .57,breath=Math.sin(time*2.8)*.15;
 const bodyY=moving?Math.sin(phase*Math.PI*4)*.2:breath;
 const hipR={x:28,y:43+bodyY},hipL={x:35,y:43+bodyY},shoulderR={x:25,y:33+bodyY},shoulderL={x:36,y:33+bodyY};
 const feet=[{x:28,y:53,support:true},{x:35,y:53,support:true}];
 if(moving){for(let side=0;side<2;side++){const f=foot(phase+side*.5,8*stride);feet[side]={x:[28,35][side]+f.x,y:53+f.y,support:f.support};}}
 let right={x:22,y:40+bodyY},left={x:40,y:40+bodyY},draw=0,attackPhase='Relaxed idle',releaseAge=-1;
 const shotTime=((time%2.35)+2.35)%2.35;
 if(moving){right={x:21+Math.sin(phase*Math.PI*2)*.6,y:37+bodyY};left={x:39+Math.sin(phase*Math.PI*2)*2,y:39+Math.cos(phase*Math.PI*2)*1.3};attackPhase='Run · alternating support';}
 if(attack){
  const raise=smooth(shotTime/.25),recover=smooth((shotTime-1.23)/.42),aim={x:17,y:31};
  right=point(point(right,aim,raise),right,recover);
  if(shotTime<.25)attackPhase='Anticipation · plant & raise';
  else if(shotTime<.43)attackPhase='Nock · left hand to string';
  else if(shotTime<.85)attackPhase='Draw · left hand to cheek';
  else if(shotTime<1.05)attackPhase='Aim · full draw';
  else if(shotTime<1.13)attackPhase='Release · string snap';
  else if(shotTime<1.4)attackPhase='Follow-through · tail wave';
  else attackPhase='Recovery · cloth & tail settle';
  draw=smooth((shotTime-.43)/.42)*(1-smooth((shotTime-1.05)/.055));
  const nock={x:22,y:31},cheek={x:29,y:28},recoil={x:32,y:27};
  const setup=smooth((shotTime-.15)/.28);
  left=point(left,point(nock,cheek,smooth((shotTime-.43)/.42)),setup);
  if(shotTime>=1.05)left=point(left,recoil,smooth((shotTime-1.05)/.06));
  if(shotTime>=1.25)left=point(left,{x:40,y:40+bodyY},recover);
  if(shotTime>=1.05)releaseAge=shotTime-1.05;
 }
 const nearArm=ik(shoulderR,right,7,8,-1),farArm=ik(shoulderL,left,7,8,1);
 const bowGrip={...nearArm.end},topOffset=bowProfile?.top||{x:4,y:-15},bottomOffset=bowProfile?.bottom||{x:4,y:15};
 const top={x:bowGrip.x+topOffset.x,y:bowGrip.y+topOffset.y},bottom={x:bowGrip.x+bottomOffset.x,y:bowGrip.y+bottomOffset.y};
 const engaged=attack&&shotTime>=.43&&shotTime<1.05,stringDraw=engaged?{...farArm.end}:point(top,bottom,.5);
 const blinkPhase=time%3.5,blink=!attack&&!moving&&blinkPhase>2.85&&blinkPhase<3.0;
 const legs=[hipR,hipL].map((hip,i)=>({...ik(hip,{x:feet[i].x,y:feet[i].y-3},6,5,1),foot:{x:feet[i].x,y:feet[i].y}}));
 const releaseGrip=ik(shoulderR,{x:17,y:31},7,8,-1).end,releaseNock=ik(shoulderL,{x:29,y:28},7,8,1).end,releaseRest={x:releaseGrip.x,y:releaseGrip.y-.5};
 const dx=releaseRest.x-releaseNock.x,dy=releaseRest.y-releaseNock.y,d=Math.hypot(dx,dy);
 const releasedArrow={nock:releaseNock,rest:releaseRest,velocity:{x:dx/d*125,y:dy/d*125}};
 return {action,time,moving,attack,phase,bodyY,feet,legs,arms:{right:nearArm,left:farArm},bow:{hand:'right',drawHand:'left',grip:bowGrip,top,bottom,draw:stringDraw,drawAmount:draw,engaged},drawAmount:draw,attackPhase,shotTime,releaseAge,releasedArrow,blink,tailRoot:{x:35,y:42+bodyY},capeRoot:{x:34,y:29+bodyY},head:{x:29,y:19+bodyY*.8}};
}

const node=(x,y,pinned=false)=>({x,y,px:x,py:y,pinned});
function link(a,b,rest=distance(a,b),stiffness=1){return {a,b,rest,stiffness};}
function solve(links){for(const l of links){const dx=l.b.x-l.a.x,dy=l.b.y-l.a.y,d=Math.hypot(dx,dy)||1,e=(d-l.rest)/d*l.stiffness;let wa=l.a.pinned?0:1,wb=l.b.pinned?0:1,s=wa+wb;if(!s)continue;wa/=s;wb/=s;l.a.x+=dx*e*wa;l.a.y+=dy*e*wa;l.b.x-=dx*e*wb;l.b.y-=dy*e*wb;}}
function integrate(n,dt,fx,fy,damping=.98){if(n.pinned)return;const vx=(n.x-n.px)*damping,vy=(n.y-n.py)*damping;n.px=n.x;n.py=n.y;n.x+=vx+fx*dt*dt;n.y+=vy+fy*dt*dt;}
function pin(n,x,y){n.x=n.px=x;n.y=n.py=y;}
export function createDynamics(form='rowan'){
 const cols=5,rows=7,cloth=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const u=x/(cols-1),v=y/(rows-1);cloth.push(node(34+u*(6+v*6)+v*3,29+v*19,y===0));}
 const clothLinks=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const n=cloth[y*cols+x];if(x)clothLinks.push(link(n,cloth[y*cols+x-1]));if(y)clothLinks.push(link(n,cloth[(y-1)*cols+x]));if(x&&y)clothLinks.push(link(n,cloth[(y-1)*cols+x-1],undefined,.7));if(y>1)clothLinks.push(link(n,cloth[(y-2)*cols+x],undefined,.45));}
 const angles=form==='moontrail'?[-1.2,-.8,-.4,0,.4]:[-.1],length=form==='mature'?22:form==='moontrail'?21:20;
 const tails=angles.map((angle,index)=>{
  const nodes=Array.from({length:7},(_,i)=>node(35+Math.cos(angle)*length*i/6,42+Math.sin(angle)*length*i/6,i===0));
  return {nodes,angle,index,length,links:nodes.slice(1).map((n,i)=>link(nodes[i],n,length/6))};
 });
 return {form,cols,rows,cloth,clothLinks,tails,accumulator:0,clock:0};
}
export function stepDynamics(sim,pose,elapsed,wind=1){
 // Fixed substeps and bounded catch-up prevent a hidden tab from exploding.
 for(let x=0;x<sim.cols;x++)pin(sim.cloth[x],pose.capeRoot.x+x/(sim.cols-1)*6,pose.capeRoot.y);
 for(const tail of sim.tails)pin(tail.nodes[0],pose.tailRoot.x,pose.tailRoot.y);
 sim.accumulator=Math.min(.05,sim.accumulator+clamp(elapsed,0,.05));
 const dt=1/120;
 while(sim.accumulator>=dt){
  sim.accumulator-=dt;sim.clock+=dt;
  const speed=pose.moving?1:0,gust=wind*(7+Math.sin(sim.clock*2.1)*5+speed*48);
  for(let x=0;x<sim.cols;x++)pin(sim.cloth[x],pose.capeRoot.x+x/(sim.cols-1)*6,pose.capeRoot.y);
  for(let i=sim.cols;i<sim.cloth.length;i++){
   const n=sim.cloth[i],u=(i%sim.cols)/(sim.cols-1),v=Math.floor(i/sim.cols)/(sim.rows-1),restX=pose.capeRoot.x+u*(6+v*6)+v*3,restY=pose.capeRoot.y+v*19;
   integrate(n,dt,gust+(restX-n.x)*18+Math.sin(sim.clock*5+i*.7)*7,22+(restY-n.y)*5,.985);
  }
  for(let pass=0;pass<7;pass++)solve(sim.clothLinks);
  for(const n of sim.cloth)if(!n.pinned){n.x=clamp(n.x,31,56);n.y=clamp(n.y,29,55);}
  for(const tail of sim.tails){
   pin(tail.nodes[0],pose.tailRoot.x,pose.tailRoot.y);
   const release=pose.releaseAge>=0?Math.exp(-pose.releaseAge*5)*Math.sin(pose.releaseAge*15-tail.index*.38):0;
   for(let i=1;i<tail.nodes.length;i++){
    const n=tail.nodes[i],t=i/6,wave=Math.sin(sim.clock*(pose.moving?8:2.8)-i*.55-tail.index*.45);
    const angle=tail.angle+wave*(pose.moving?.17:.065)*t+release*.22*t;
    const tx=pose.tailRoot.x+Math.cos(angle)*tail.length*t,ty=pose.tailRoot.y+Math.sin(angle)*tail.length*t;
    integrate(n,dt,(tx-n.x)*60+gust*.09,(ty-n.y)*60+wave*4,.972);
   }
   for(let pass=0;pass<8;pass++)solve(tail.links);
   for(const n of tail.nodes)if(!n.pinned){n.x=clamp(n.x,30,57);n.y=clamp(n.y,18,55);}
   for(let pass=0;pass<4;pass++)solve(tail.links);
  }
 }
 return sim;
}
export function clothPoint(sim,u,v){
 const fx=clamp(u,0,1)*(sim.cols-1),fy=clamp(v,0,1)*(sim.rows-1),x=Math.min(sim.cols-2,Math.floor(fx)),y=Math.min(sim.rows-2,Math.floor(fy));
 return point(point(sim.cloth[y*sim.cols+x],sim.cloth[y*sim.cols+x+1],fx-x),point(sim.cloth[(y+1)*sim.cols+x],sim.cloth[(y+1)*sim.cols+x+1],fx-x),fy-y);
}
export function tailPoint(tail,u,v,form){
 const f=clamp(u,0,1)*6,i=Math.min(5,Math.floor(f)),p=point(tail.nodes[i],tail.nodes[i+1],f-i),a=tail.nodes[Math.max(0,i-1)],b=tail.nodes[Math.min(6,i+2)],d=distance(a,b)||1;
 const width=(form==='moontrail'?9:form==='mature'?13:12)*(v-.5);
 return {x:p.x-(b.y-a.y)/d*width,y:p.y+(b.x-a.x)/d*width};
}
export function dynamicsErrors(sim,pose){
 const lengths=sim.tails.flatMap(t=>t.links.map(l=>Math.abs(distance(l.a,l.b)-l.rest)));
 return {tailRoot:Math.max(...sim.tails.map(t=>distance(t.nodes[0],pose.tailRoot))),tailLength:Math.max(...lengths),capeRoot:Math.max(...sim.cloth.slice(0,sim.cols).map((n,i)=>distance(n,{x:pose.capeRoot.x+i/(sim.cols-1)*6,y:pose.capeRoot.y}))),bowGrip:distance(pose.bow.grip,pose.arms.right.end)};
}
