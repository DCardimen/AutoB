const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
export function previewCape(rig,spec){
 if(!spec)return null;const moving=['walk','run','sprint','dash','turn','stop'].includes(rig.state),drive=moving?1:0;
 return Array.from({length:spec.columns},(_,col)=>Array.from({length:spec.rows},(_,row)=>{
  const t=row/(spec.rows-1),wave=Math.sin(rig.phase*Math.PI*2-row*.7+col*.3),turn=rig.state==='turn'?Math.sin(rig.phase*Math.PI)*12:0;
  return {x:rig.body.x-5-t*(12+drive*20+wave*6*t),y:rig.body.y+(col/(spec.columns-1)-.5)*spec.width*(.75+Math.sin(t*Math.PI/2)*.5)+turn*t,z:Math.max(3,rig.body.z+7-t*spec.length+Math.abs(col-(spec.columns-1)/2)*t*t*3+drive*Math.sin(Math.PI*t)*8)};
 }));
}
export function stepPhysicalCape(actor,rig,spec,dt){
 if(!spec){actor.capeCloth=null;return;}
 const scale=actor.rigScale||1,baseX=actor.x/scale,baseY=actor.y/scale,cos=Math.cos(actor.facing),sin=Math.sin(actor.facing),world=p=>({x:baseX+p.x*cos-p.y*sin,y:baseY+p.x*sin+p.y*cos,z:p.z});
 const rest=previewCape({...rig,state:'idle',phase:0},spec),stamp=spec.width+':'+spec.length;
 if(actor.capeCloth?.stamp!==stamp)actor.capeCloth={stamp,grid:rest.map(col=>col.map(p=>{const q=world(p);return {...q,px:q.x,py:q.y,pz:q.z};}))};
 const flow=actor.capeMotion??1,grid=actor.capeCloth.grid,drive=limit(Math.hypot(actor.vx,actor.vy)/(actor.run||150),0,1.5)*flow,wind=actor.gait*6.28,fx=-cos*(28*flow+drive*130),fy=-sin*(28*flow+drive*130);
 for(let col=0;col<spec.columns;col++)for(let row=1;row<spec.rows;row++){
  const p=grid[col][row],x=p.x,y=p.y,z=p.z,t=row/(spec.rows-1),flutter=Math.sin(wind-row*.75+col*.45)*drive*50;
  p.x+=(p.x-p.px)*Math.pow(.92,dt*120)+(fx-sin*flutter)*dt*dt;p.y+=(p.y-p.py)*Math.pow(.92,dt*120)+(fy+cos*flutter)*dt*dt;p.z+=(p.z-p.pz)*Math.pow(.92,dt*120)+(-230+drive*45)*dt*dt;p.px=x;p.py=y;p.pz=z;
  if(p.z<3){p.z=3;p.pz=3;p.px=p.x+(p.px-p.x)*.55;p.py=p.y+(p.py-p.y)*.55;}
 }
 const constrain=(a,b,len,anchored)=>{const d=dist(a,b)||1,k=(d-len)/d,weight=anchored?1:.5;for(const key of ['x','y','z']){const change=(b[key]-a[key])*k*weight;if(!anchored)a[key]+=change;b[key]-=change;}a.z=Math.max(3,a.z);b.z=Math.max(3,b.z);};
 for(let iteration=0;iteration<9;iteration++){
  for(let col=0;col<spec.columns;col++){Object.assign(grid[col][0],world(rest[col][0]));for(let row=1;row<spec.rows;row++)constrain(grid[col][row-1],grid[col][row],dist(rest[col][row-1],rest[col][row]),row===1);}
  for(let col=1;col<spec.columns;col++)for(let row=1;row<spec.rows;row++)constrain(grid[col-1][row],grid[col][row],dist(rest[col-1][row],rest[col][row]),false);
 }
 actor.capeMesh=grid.map(col=>col.map(p=>{const x=p.x-baseX,y=p.y-baseY;return {x:limit(x*cos+y*sin,-61,40),y:limit(-x*sin+y*cos,-45,45),z:p.z};}));
 actor.capeMeshKey=actor.capeMesh.map(col=>col.map(p=>[p.x,p.y,p.z].map(v=>Math.round(v*2)/2).join(',')).join(';')).join('|');
}
export function paintCapeMesh(b,rig,at,p,layer){
 if(!rig.capeMesh)return;const grid=rig.capeMesh,body=at(rig.body);
 for(let col=0;col<grid.length-1;col++)for(let row=0;row<grid[col].length-1;row++){
  const points=[grid[col][row],grid[col+1][row],grid[col+1][row+1],grid[col][row+1]].map(at),depth=points.reduce((n,q)=>n+q.depth,0)/4;
  if((depth>body.depth?'near':'far')!==layer)continue;
  b.poly(points,p.cloth[col===1||col===2?1:0]);if(col===0||col===grid.length-2){b.line(points[col===0?0:1],points[col===0?3:2],"#20272a",1);b.line(points[col===0?0:1],points[col===0?3:2],p.metal[2]);}
  if(row===0)b.line(points[0],points[1],p.cloth[2]);
  if(row===grid[col].length-2){b.line(points[2],points[3],"#20272a",1);b.line(points[2],points[3],p.metal[2]);}
 }
}
