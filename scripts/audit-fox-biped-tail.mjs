import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bipedTailAudit} from '../public/meshy-fox-preview/biped-tail.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const fps=240,bytes=fs.readFileSync('public/meshy-fox-preview/fox-biped.glb'),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),model=asset.scene,mesh=model.getObjectByName('Biped_Fox'),audit=bipedTailAudit(mesh),mixer=new T.AnimationMixer(model),report={fps,attachmentSeam:asset.parser.json.asset.extras.tailWeights,clips:[],intersections:[],samples:0};
for(const clip of asset.animations){
 mixer.stopAllAction();mixer.clipAction(clip).setLoop(T.LoopOnce,1).play();let count=0;
 for(let frame=0;frame<=Math.ceil(clip.duration*fps);frame++){
  const time=Math.min(frame/fps,clip.duration-1e-6);mixer.setTime(time);model.updateMatrixWorld(true);mesh.skeleton.update();
  if(audit.intersects())report.intersections.push({clip:clip.name,time});count++;report.samples++;
 }
 report.clips.push({clip:clip.name,samples:count});console.log(clip.name,report.intersections.filter(x=>x.clip===clip.name).length);
}
fs.mkdirSync('docs/evidence/fox-biped1',{recursive:true});fs.writeFileSync('docs/evidence/fox-biped1/tail-audit.json',JSON.stringify(report,null,2)+'\n');
assert.equal(report.intersections.length,0,JSON.stringify(report.intersections.slice(0,10)));console.log(`${report.samples} exported/interpolated surface samples: zero intersections outside the connected socket seam`);
