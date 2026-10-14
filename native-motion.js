// Fixed-step combat stays deterministic. Only presentation blends the preceding
// and current poses, so a 25 Hz simulation does not dictate display cadence.
const scalars=['x','y','facing','gait','moving','runBlend','sprintBlend','acceleration','moveFacing','stopTime','turnTime','hitTime','stagger','deathTime','knockdown','getup'];
const copyPoints=cols=>cols?.map(col=>col.map(p=>({...p})));
export function snapshotNativeMotion(u){const a=u.nativeActor;if(!a)return;u.previousNativeMotion={x:u.x,y:u.y,actor:Object.fromEntries(scalars.map(k=>[k,a[k]])),action:a.action?{...a.action}:null,feet:a.groundFeet?.map(p=>({...p})),cape:copyPoints(a.capeMesh),ragdoll:a.ragdoll?{time:a.ragdoll.time,points:Object.fromEntries(Object.entries(a.ragdoll.points).map(([k,p])=>[k,{x:p.x,y:p.y,z:p.z}]))}:null};}
const mix=(a,b,t)=>a+(b-a)*t;
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export function interpolatedNativeUnit(u,alpha=1){const prev=u.previousNativeMotion,a=u.nativeActor;if(!prev||!a)return u;alpha=Math.max(0,Math.min(1,alpha));const actor={...a};
 for(const key of scalars){const x=prev.actor[key],y=a[key];if(Number.isFinite(x)&&Number.isFinite(y))actor[key]=['facing','moveFacing'].includes(key)?angle(x,y,alpha):mix(x,y,alpha);}
 if(a.action){actor.action={...a.action};const old=prev.action&&prev.action.elapsed<=a.action.elapsed?prev.action.elapsed:0;actor.action.elapsed=mix(old,a.action.elapsed,alpha);actor.action.released=actor.action.elapsed>=actor.action.windup;}
 else if(prev.action&&prev.action.elapsed<prev.action.duration){actor.action={...prev.action,elapsed:mix(prev.action.elapsed,prev.action.duration,alpha),released:true};}
 if(a.groundFeet&&prev.feet?.length===a.groundFeet.length)actor.groundFeet=a.groundFeet.map((p,i)=>({...p,x:mix(prev.feet[i].x,p.x,alpha),y:mix(prev.feet[i].y,p.y,alpha),z:mix(prev.feet[i].z,p.z,alpha)}));
 if(a.capeMesh&&prev.cape?.length===a.capeMesh.length){actor.capeMesh=a.capeMesh.map((col,i)=>col.map((p,j)=>{const old=prev.cape[i]?.[j]||p;return {...p,x:mix(old.x,p.x,alpha),y:mix(old.y,p.y,alpha),z:mix(old.z,p.z,alpha)};}));actor.capeMeshKey=actor.capeMesh.map(col=>col.map(p=>[p.x,p.y,p.z].map(v=>Math.round(v/1.5)).join(',')).join(';')).join('|');}
 if(a.ragdoll&&prev.ragdoll){actor.ragdoll={...a.ragdoll,time:mix(prev.ragdoll.time,a.ragdoll.time,alpha),points:Object.fromEntries(Object.entries(a.ragdoll.points).map(([key,p])=>{const old=prev.ragdoll.points[key]||p;return [key,{...p,x:mix(old.x,p.x,alpha),y:mix(old.y,p.y,alpha),z:mix(old.z,p.z,alpha)}];}))};}
 return {...u,x:mix(prev.x,u.x,alpha),y:mix(prev.y,u.y,alpha),facing:actor.facing,nativeActor:actor};
}
