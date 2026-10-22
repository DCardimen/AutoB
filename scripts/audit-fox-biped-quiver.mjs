import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bipedTailAudit} from '../public/meshy-fox-preview/biped-tail.mjs';
const out=process.env.BIPED_REVIEW_OUT||'docs/evidence/fox-biped1';fs.mkdirSync(out,{recursive:true});
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-biped.glb'),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),model=asset.scene,body=model.getObjectByName('Biped_Fox'),mixer=new T.AnimationMixer(model),audit=bipedTailAudit(body),meshes=model.getObjectByName('Quiver_Body').children.slice(0,4),indices=[];let count=0;
for(const mesh of meshes){for(const id of mesh.geometry.index.array)indices.push(count+id);count+=mesh.geometry.attributes.position.count;}
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));geometry.setIndex(indices);
const report={fps:60,offset:'half-frame between baked keys',distance:'witnessed upper bound on closest surface gap',samples:0,intersections:[],minGap:Infinity,maxGap:0,clips:[]},point=new T.Vector3();
for(const clip of asset.animations){
 mixer.stopAllAction();mixer.clipAction(clip).setLoop(T.LoopOnce,1).play();let samples=0,maxGap=0;
 for(let f=0;f<=Math.ceil(clip.duration*60);f++){
  const time=Math.min((f+.5)/60,clip.duration-1e-6);mixer.setTime(time);model.updateMatrixWorld(true);body.skeleton.update();audit.update();let i=0;
  for(const mesh of meshes)for(let v=0;v<mesh.geometry.attributes.position.count;v++){point.fromBufferAttribute(mesh.geometry.attributes.position,v).applyMatrix4(mesh.matrixWorld);geometry.attributes.position.setXYZ(i++,point.x,point.y,point.z);}geometry.computeBoundingBox();if(geometry.boundsTree)geometry.boundsTree.refit();else geometry.boundsTree=new MeshBVH(geometry);
  const matrix=body.matrixWorld.clone().invert(),closest={};if(audit.parts[1].bvh.intersectsGeometry(geometry,matrix))report.intersections.push({clip:clip.name,time});audit.parts[1].bvh.closestPointToGeometry(geometry,matrix,closest,{},.0015,.006);if(closest.distance===undefined)audit.parts[1].bvh.closestPointToGeometry(geometry,matrix,closest,{},.0015,.2);report.minGap=Math.min(report.minGap,closest.distance);report.maxGap=Math.max(report.maxGap,closest.distance);maxGap=Math.max(maxGap,closest.distance);samples++;report.samples++;
 }
 report.clips.push({clip:clip.name,samples,maxGap});console.log(clip.name,maxGap);
}
fs.writeFileSync(`${out}/quiver-audit.json`,JSON.stringify(report,null,2)+'\n');assert.equal(report.intersections.length,0,JSON.stringify(report.intersections.slice(0,10)));assert.ok(report.maxGap<.006,`quiver gap ${report.maxGap}m`);console.log(`${report.samples} samples: quiver touches clothing without surface intersections`);
