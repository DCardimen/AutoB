import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from './lib/glb.mjs';
import {bipedTailAudit,clearBipedTail} from '../public/meshy-fox-preview/biped-tail.mjs';
import {fitBipedQuiver} from '../public/meshy-fox-preview/biped-quiver.mjs';

export async function refineBipedRun(){
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
 const file='public/meshy-fox-preview/fox-biped.glb',b=fs.readFileSync(file),asset=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''),glb=readGLB(file),g=glb.json,m=asset.scene,mesh=m.getObjectByName('Biped_Fox'),audit=bipedTailAudit(mesh),mix=new T.AnimationMixer(m),clip=asset.animations.find(c=>c.name==='Run'),animation=g.animations.find(a=>a.name==='Run'),bone=n=>m.getObjectByName(n),pos=o=>o.getWorldPosition(new T.Vector3()),q=o=>o.getWorldQuaternion(new T.Quaternion()),update=()=>{m.updateMatrixWorld(true);mesh.skeleton.update()},setQ=(o,r)=>{o.quaternion.copy(q(o.parent).invert().multiply(r));o.updateMatrixWorld(true)};
 mix.clipAction(asset.animations.find(c=>c.name==='Idle')).play();mix.setTime(0);update();
 const footQ=Object.fromEntries(['Left','Right'].map(s=>[s,q(bone('smartrig'+s+'Foot'))]));
 mix.stopAllAction();mix.clipAction(clip).setLoop(T.LoopOnce,1).play();
 const nodeIds=new Map(g.nodes.map((n,i)=>[n.name,i])),objects=[...mesh.skeleton.bones,bone('Biped_Motion_Root'),bone('Quiver')],tracks=new Map(objects.map(o=>[o,{rotation:[],translation:[]}])) ,times=Float32Array.from(Array.from({length:Math.ceil(clip.duration*120)+1},(_,i)=>Math.min(i/120,clip.duration))),up=new T.Vector3(1,0,0),p=new T.Vector3();let maxLegError=0,maxTailCorrection=0;
 const sourceTracks=objects.map(o=>({o,q:clip.tracks.find(t=>t.name===o.name+'.quaternion')?.createInterpolant(),p:clip.tracks.find(t=>t.name===o.name+'.position')?.createInterpolant()}));
 for(const t of times){
  const sample=Math.min(t,clip.duration-1e-7);mix.setTime(sample);for(const s of sourceTracks){if(s.q)s.o.quaternion.fromArray(s.q.evaluate(sample));if(s.p)s.o.position.fromArray(s.p.evaluate(sample));}update();
  const phase=t/clip.duration,hips=bone('smartrigHips'),world=pos(hips);world.y=.300+.006*(1-Math.cos(phase*Math.PI*4))/2;hips.position.copy(hips.parent.worldToLocal(world));update();
  const spine=bone('smartrigSpine');setQ(spine,new T.Quaternion().setFromAxisAngle(up,.17).multiply(q(spine)));
  const neck=bone('smartrigNeck');setQ(neck,new T.Quaternion().setFromAxisAngle(up,-.09).multiply(q(neck)));
  for(const side of ['Right','Left']){
   const phaseLeg=(phase+(side==='Left'?.5:0))%1,support=.42,stride=.095,stance=phaseLeg<support,u=stance?phaseLeg/support:(phaseLeg-support)/(1-support),smooth=u*u*u*(10+u*(-15+6*u)),tangent=-2*stride*(1-support)/support,z=stance?stride*(1-2*u):-stride+tangent*u+(2*stride-tangent)*smooth,lift=stance?0:.085*Math.sin(Math.PI*u)**2;
   const a=bone('smartrig'+side+'UpLeg'),c=bone('smartrig'+side+'Foot'),k=bone('smartrig'+side+'Leg'),start=pos(a),target=new T.Vector3(side==='Right'?-.079:.079,.063+lift,z),l1=pos(k).distanceTo(start),l2=pos(c).distanceTo(pos(k)),delta=target.clone().sub(start),d=Math.min(l1+l2-.0002,delta.length()),dir=delta.normalize(),along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),pole=new T.Vector3(0,0,1).addScaledVector(dir,-dir.z).normalize(),elbow=start.clone().addScaledVector(dir,along).addScaledVector(pole,height);
   setQ(a,new T.Quaternion().setFromUnitVectors(pos(k).sub(start).normalize(),elbow.sub(start).normalize()).multiply(q(a)));
   setQ(k,new T.Quaternion().setFromUnitVectors(pos(c).sub(pos(k)).normalize(),target.clone().sub(pos(k)).normalize()).multiply(q(k)));
   setQ(c,new T.Quaternion().setFromAxisAngle(up,stance?.16*Math.max(0,(u-.65)/.35):.45*Math.sin(Math.PI*u)).multiply(footQ[side]));maxLegError=Math.max(maxLegError,pos(c).distanceTo(target));
  }
  update();audit.skin.update();let low=Infinity;for(const id of audit.unique){audit.skin.vertex(id,p).applyMatrix4(mesh.matrixWorld);low=Math.min(low,p.y)}const anySupport=phase%1<.42||(phase+.5)%1<.42;if(anySupport||low<.002)bone('Biped_Motion_Root').position.y+=.002-low;update();
  maxTailCorrection=Math.max(maxTailCorrection,clearBipedTail(audit,bone('Bone_019'),update));fitBipedQuiver(bone('Quiver'),mesh,audit);
  for(const [o,v]of tracks){v.rotation.push(...o.quaternion);v.translation.push(...o.position)}
 }
 const input=glb.append(times,'SCALAR');g.accessors[input].min=[0];g.accessors[input].max=[clip.duration];
 for(const [o,track]of tracks){const id=nodeIds.get(o.name);for(const [key,values]of Object.entries(track)){const sampler=animation.samplers.push({input,output:glb.append(Float32Array.from(values),key==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'})-1;animation.channels=animation.channels.filter(c=>!(c.target.node===id&&c.target.path===key));animation.channels.push({sampler,target:{node:id,path:key}})}}
 g.asset.extras.run={reference:'User-provided Legolas running reference',duration:clip.duration,support:.42,stride:.095,footLift:.085,spineLean:.17,headCounterLean:-.09,hipBounce:.006,maxLegError,maxTailCorrection,method:'Narrow alternating foot placement, long rear push, tucked recovery and steady forward-leaning torso. Original rig and mesh; downloaded Running is not used.'};glb.write(file);console.log('Reference run',g.asset.extras.run);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await refineBipedRun();
