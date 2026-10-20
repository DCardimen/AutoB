import fs from 'node:fs';
import * as T from 'three';

// Animation-only extraction of Kay Lousberg's CC0 Rig_Medium. No mannequin
// geometry is transferred. Sample world directions, then fit the fox's lengths.
export class KayKitMotion {
 constructor(){
  this.clips=new Map();
  for(const file of ['General','MovementBasic','MovementAdvanced','CombatRanged']){
   const data=JSON.parse(fs.readFileSync(`assets/fox-animation-sources/kaykit/${file}.json`));
   const objects=data.nodes.map(n=>{const o=new T.Object3D();o.name=n.name;return o;});
   data.nodes.forEach((n,i)=>n.children?.forEach(c=>objects[i].add(objects[c])));
   const root=new T.Object3D();data.roots.forEach(i=>root.add(objects[i]));
   for(const c of data.clips)this.clips.set(c.name,{...c,data,objects,root,duration:Math.max(...c.tracks.flatMap(t=>t.times))});
  }
 }
 sample(name,phase,mirror=false){
  const c=this.clips.get(name);if(!c)throw Error(`Missing KayKit clip ${name}`);
  c.data.nodes.forEach((n,i)=>{c.objects[i].position.fromArray(n.translation||[0,0,0]);c.objects[i].quaternion.fromArray(n.rotation||[0,0,0,1]);c.objects[i].scale.fromArray(n.scale||[1,1,1]);});
  const time=Math.max(0,Math.min(1,phase))*c.duration;
  for(const t of c.tracks){let j=0;while(j<t.times.length-2&&time>t.times[j+1])j++;const k=Math.min(j+1,t.times.length-1),u=t.interpolation==='STEP'?0:Math.min(1,Math.max(0,(time-t.times[j])/Math.max(1e-8,t.times[k]-t.times[j]))),o=c.objects[t.node],w=t.path==='rotation'?4:3;
   const loop=/^(Idle_|Walking_|Running_)/.test(name);
   if(t.path==='rotation'){
    o.quaternion.fromArray(t.values,j*w).normalize().slerp(new T.Quaternion().fromArray(t.values,k*w).normalize(),u).normalize();
    // Distribute the source export's small endpoint drift across the cycle.
    if(loop){const correction=new T.Quaternion().fromArray(t.values,t.values.length-4).normalize().invert().multiply(new T.Quaternion().fromArray(t.values).normalize());o.quaternion.multiply(new T.Quaternion().slerp(correction,time/c.duration)).normalize();}
   }else if(t.path==='translation'||t.path==='scale'){
    const v=o[t.path==='translation'?'position':'scale'];v.fromArray(t.values,j*w).lerp(new T.Vector3().fromArray(t.values,k*w),u);
    if(loop)v.addScaledVector(new T.Vector3().fromArray(t.values).sub(new T.Vector3().fromArray(t.values,t.values.length-3)),time/c.duration);
   }
  }
  c.root.updateMatrixWorld(true);const positions=new Map(c.objects.map(o=>[o.name,o.getWorldPosition(new T.Vector3())]));
  const point=n=>{const name=mirror?n.replace(/\.([lr])$/,(_,s)=>'.'+(s==='l'?'r':'l')):n,p=positions.get(name).clone();if(mirror)p.x*=-1;return p;};
  const arms={};for(const side of ['R','L']){const s=side.toLowerCase(),shoulder=point('upperarm.'+s),elbow=point('lowerarm.'+s),wrist=point('wrist.'+s);arms[side]={upper:elbow.clone().sub(shoulder).normalize(),lower:wrist.clone().sub(elbow).normalize()};}
  return {arms,point};
 }
}
