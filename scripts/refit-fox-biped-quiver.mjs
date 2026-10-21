import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {bipedTailAudit} from '../public/meshy-fox-preview/biped-tail.mjs';
import {fitBipedQuiver} from '../public/meshy-fox-preview/biped-quiver.mjs';

// Refit the mount after the tucked acrobatic body/arm poses. The tube stays
// against the garment while its lower cap clears the pelvis-bound rear belt.
export async function refitBipedQuiver(){
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
 const file='public/meshy-fox-preview/fox-biped.glb',bytes=fs.readFileSync(file),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),glb=readGLB(file),g=glb.json,m=asset.scene,mesh=m.getObjectByName('Biped_Fox'),quiver=m.getObjectByName('Quiver'),id=g.nodes.findIndex(n=>n.name==='Quiver'),audit=bipedTailAudit(mesh),mix=new T.AnimationMixer(m),report=[];
 for(const clip of asset.animations.filter(c=>['Side_Flip_Left','Side_Flip_Right','Forward_Vault'].includes(c.name))){
  const animation=g.animations.find(a=>a.name===clip.name),track=clip.tracks.find(t=>t.name==='Quiver.position').createInterpolant(),times=Float32Array.from(Array.from({length:Math.ceil(clip.duration*120)+1},(_,i)=>Math.min(i/120,clip.duration))),values=[];let maxShift=0,maxGap=0;
  mix.stopAllAction();mix.clipAction(clip).setLoop(T.LoopOnce,1).play();
  for(const t of times){const sample=Math.min(t,clip.duration-1e-7);mix.setTime(sample);quiver.position.fromArray(track.evaluate(sample));m.updateMatrixWorld(true);mesh.skeleton.update();audit.update();const fit=fitBipedQuiver(quiver,mesh,audit);maxShift=Math.max(maxShift,Math.abs(fit.shift));maxGap=Math.max(maxGap,fit.gap);values.push(...quiver.position)}
  const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];const sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(values),'VEC3'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path==='translation'));animation.channels.push({sampler,target:{node:id,path:'translation'}});report.push({clip:clip.name,maxShift,maxGap});console.log('Quiver refit',clip.name,maxShift,maxGap);
 }
 g.asset.extras.acrobaticQuiverRefit=report;glb.write(file);fs.writeFileSync('docs/evidence/fox-biped1/quiver-refit.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await refitBipedQuiver();
