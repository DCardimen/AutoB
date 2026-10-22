import * as T from 'three';
import {readGLB} from './lib/glb.mjs';
import {BIPED_CLIPS} from '../public/meshy-fox-preview/biped-motion.mjs';

// Close the restrained wave at each loop seam. Root clearance is planned
// separately through time by stabilize-fox-biped-tail.mjs.
export function bakeBipedTailWave(){
 const file='public/meshy-fox-preview/fox-biped.glb',glb=readGLB(file),g=glb.json;
 for(const [mode,info]of Object.entries(BIPED_CLIPS)){
  const animation=g.animations.find(a=>a.name===info.name),times=Float32Array.from(Array.from({length:Math.ceil(info.duration*120)+1},(_,i)=>Math.min(i/120,info.duration))),duration=times[times.length-1],input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[duration];
  for(let i=1;i<5;i++){
   const id=g.nodes.findIndex(n=>n.name==='Bone_'+String(19-i).padStart(3,'0')),rest=new T.Quaternion(...g.nodes[id].rotation),values=[];
   for(const t of times){const phase=info.loop?t/duration*Math.PI*2:t*3;values.push(...rest.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.025*Math.sin(phase-i*.45))))}
   const sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(values),'VEC4'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path==='rotation'));animation.channels.push({sampler,target:{node:id,path:'rotation'}});
  }
 }
 delete g.asset.extras.portableTailClearance;g.asset.extras.tailWave={fps:120,amplitude:.025,loopClosure:'Exact periodic phase for looping clips; four connected distal joints.'};glb.write(file);
}
