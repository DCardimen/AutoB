import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {bipedTailAudit,bipedTailClear,clearBipedTail} from '../public/meshy-fox-preview/biped-tail.mjs';
import {BIPED_CLIPS} from '../public/meshy-fox-preview/biped-motion.mjs';

// Follow the same connected safe hinge region through time. Independent pose
// projection can choose different sides of a garment and then interpolate
// through it; carry the previous hinge forward before approaching rest.
export async function stabilizeBipedTail(){
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
 const file='public/meshy-fox-preview/fox-biped.glb',bytes=fs.readFileSync(file),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),glb=readGLB(file),g=glb.json,m=asset.scene,mesh=m.getObjectByName('Biped_Fox'),root=m.getObjectByName('Bone_019'),id=g.nodes.findIndex(n=>n.name===root.name),mix=new T.AnimationMixer(m),audit=bipedTailAudit(mesh),rest=new T.Quaternion(...g.nodes[id].rotation),report={method:'Continuous previous-pose hinge planning, with 1 mm separation; source socket seam only is excluded',fps:120,samples:0,projected:0,maxStep:0,clips:[]},update=()=>{m.updateMatrixWorld(true);mesh.skeleton.update()},store=q=>q.fromArray(Float32Array.from(q));
 for(const clip of asset.animations){
  if(process.env.BIPED_CLIP&&process.env.BIPED_CLIP!==clip.name)continue;
  const info=Object.values(BIPED_CLIPS).find(c=>c.name===clip.name),animation=g.animations.find(a=>a.name===clip.name),regular=Array.from({length:Math.ceil(clip.duration*report.fps)+1},(_,i)=>Math.min(i/report.fps,clip.duration)),times=Float32Array.from([...new Set([...regular,...glb.read(animation.samplers[0].input)].map(Math.fround))].sort((a,b)=>a-b)),values=[];let previous=null,first=null,projected=0,maxStep=0;
  mix.stopAllAction();mix.clipAction(clip).setLoop(T.LoopOnce,1).play();
  const valid=q=>{root.quaternion.copy(q);update();return bipedTailClear(audit,.001)};
  for(const t of times){
   mix.setTime(Math.min(t,clip.duration-1e-7));const desired=first?first.clone():rest.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.08));let chosen;
   if(!previous){chosen=store(desired);if(!valid(chosen)){clearBipedTail(audit,root,update,.0015);chosen=store(root.quaternion.clone());if(!valid(chosen))throw Error(clip.name+' initial clearance');}}
   else{
    const angle=previous.angleTo(desired),candidate=store(previous.clone().slerp(desired,Math.min(1,.025/Math.max(.00001,angle))));
    if(valid(candidate))chosen=candidate;else if(valid(previous))chosen=previous.clone();
    else{
     projected++;report.projected++;
     search:for(const radius of [.025,.05,.08,.12,.18,.26,.38,.55,.8,1.05])for(let i=0;i<16;i++){
      const direction=i*Math.PI/8,offset=new T.Quaternion().setFromEuler(new T.Euler(Math.cos(direction)*radius,0,Math.sin(direction)*radius)),trial=store(previous.clone().multiply(offset));if(valid(trial)){chosen=trial;break search;}
     }
     if(!chosen)throw Error(`${clip.name} continuous hinge has no clear pose at ${t}`);
    }
   }
   if(t===times[times.length-1]&&info.loop){if(!valid(first))throw Error(clip.name+' loop endpoint');chosen=first.clone();}
   if(previous)maxStep=Math.max(maxStep,previous.angleTo(chosen));else first=chosen.clone();previous=chosen.clone();values.push(...chosen);report.samples++;
  }
  const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];const sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(values),'VEC4'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path==='rotation'));animation.channels.push({sampler,target:{node:id,path:'rotation'}});report.maxStep=Math.max(report.maxStep,maxStep);report.clips.push({clip:clip.name,projected,maxStep,samples:times.length});console.log('Continuous tail',clip.name,projected,maxStep);
 }
 g.asset.extras.continuousTailClearance={fps:report.fps,maxStep:report.maxStep,margin:.001,method:report.method};glb.write(file);fs.writeFileSync('docs/evidence/fox-biped1/tail-continuous.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await stabilizeBipedTail();
