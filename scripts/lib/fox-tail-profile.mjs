import {Vector3} from 'three';

const CENTRES=[[.035,.515,-.115],[.13,.50,-.20],[.265,.475,-.25],[.405,.47,-.27],[.54,.485,-.27],[.675,.49,-.26],[.7168113,.499,-.27]];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function tailCentre(x){let i=0;while(i<CENTRES.length-2&&x>CENTRES[i+1][0])i++;const a=CENTRES[i],b=CENTRES[i+1],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return new Vector3(x,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}

// Trim the larger half of each authored section to match its smaller half.
// Invertible flank compression retains the painted mesh, fur facets, UVs and
// longitudinal coordinates. It does not project them onto a replacement tube.
export function createFoxTailProfile(points,triangles){
 const first=.035,step=.01,sections=Array.from({length:70},(_,i)=>{
  const x=first+i*step,extent=[.003,.003,.003,.003];
  for(const p of points)if(Math.abs(p.x-x)<.035){const c=tailCentre(p.x),dy=p.y-c.y,dz=p.z-c.z;extent[dy>=0?0:1]=Math.max(extent[dy>=0?0:1],Math.abs(dy));extent[dz>=0?2:3]=Math.max(extent[dz>=0?2:3],Math.abs(dz));}
  const exact=[0,0,0,0],c=tailCentre(x);
  for(const tri of triangles)for(let edge=0;edge<3;edge++){const a=tri[edge],b=tri[(edge+1)%3];if((a.x<=x&&b.x>x)||(b.x<=x&&a.x>x)){const t=(x-a.x)/(b.x-a.x),dy=a.y+(b.y-a.y)*t-c.y,dz=a.z+(b.z-a.z)*t-c.z;exact[dy>=0?0:1]=Math.max(exact[dy>=0?0:1],Math.abs(dy));exact[dz>=0?2:3]=Math.max(exact[dz>=0?2:3],Math.abs(dz));}}
  if(exact.every(v=>v>.001))return exact;
  return extent;
 });
 return (x,y,z,weight=1)=>{
  const u=Math.max(0,Math.min(sections.length-1,(x-first)/step)),i=Math.floor(u),a=sections[i],b=sections[Math.min(i+1,sections.length-1)],r=a.map((v,k)=>v+(b[k]-v)*(u-i)),c=tailCentre(x),dy=y-c.y,dz=z-c.z;
  const taper=.24+.76*smooth(.075,.405,x),ry=Math.min(r[0],r[1])*taper,rz=Math.min(r[2],r[3])*taper,blend=weight*smooth(.035,.075,x);
  return new Vector3(x,y+(dy*ry/r[dy>=0?0:1]-dy)*blend,z+(dz*rz/r[dz>=0?2:3]-dz)*blend);
 };
}
