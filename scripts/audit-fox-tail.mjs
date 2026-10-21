import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FoxTailClearance} from '../public/meshy-fox-preview/fox-tail-clearance.mjs';
import {FoxPreviewController} from '../public/meshy-fox-preview/fox-preview-controller.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-animated.glb'),a=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),''),m=a.scene.getObjectByName('FoxMesh'),mixer=new T.AnimationMixer(a.scene),controller=new FoxPreviewController(a.scene);
const g=m.geometry,clear=new FoxTailClearance(g.attributes.position.array,g.index.array,g.attributes.skinIndex.array,g.attributes.skinWeight.array,m.skeleton.bones.map(b=>b.name),(id,out)=>m.getVertexPosition(id,out));
const collisions=[];let samples=0;const coverage=[];
for(const clip of a.animations){mixer.stopAllAction();mixer.clipAction(clip).play();const mode=Object.entries((await import('../public/meshy-fox-preview/fox-motion.mjs')).CLIPS).find(([,v])=>v.name===clip.name)[0];let hits=0;
 for(let f=0;f<Math.ceil(clip.duration*60);f++)for(const clock of [null,0,6]){controller.restore();mixer.setTime(f/60);a.scene.updateMatrixWorld(true);if(clock!==null)controller.apply({mode,clipTime:f/60,ambientTime:f/60+clock,target:new T.Vector3(Math.sin(f/60)*1.5,1.03,3)});m.skeleton.update();samples++;if(clear.intersects()){hits++;if(collisions.length<30)collisions.push([mode,f/60,clock]);}}
 coverage.push({mode,clip:clip.name,intersections:hits});console.log(clip.name,hits);
}
const report={assetSHA256:createHash('sha256').update(bytes).digest('hex'),fps:60,samples,clocks:['portable clip','runtime ambient','runtime swish + moving target'],coverage,collisions};fs.writeFileSync((process.env.FOX_EVIDENCE_DIR||'docs/evidence/meshy-fox-archer-v3')+'/tail-surface-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({samples,collisions}));assert.equal(collisions.length,0,'tail intersects costume, limbs or boots');
