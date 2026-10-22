import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from '../scripts/lib/glb.mjs';
import {measureFoxTail} from '../scripts/lib/fox-tail-measurements.mjs';

const file='public/meshy-fox-preview/fox-animated.glb',current=readGLB(file),source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),g=current.json,a=g.meshes[0].primitives[0],p=current.read(a.attributes.POSITION),original=source.read(source.json.meshes[0].primitives[0].attributes.POSITION),j=current.read(a.attributes.JOINTS_0),w=current.read(a.attributes.WEIGHTS_0),names=g.skins[0].joints.map(id=>g.nodes[id].name),measure=measureFoxTail(current);
const baseline=new Float32Array(original.length);for(let i=0;i<original.length;i+=3)baseline.set([original[i]-.035,original[i+1]+.004,original[i+2]-.10],i);
const before=measureFoxTail({...current,read:id=>id===a.attributes.POSITION?baseline:current.read(id)});

test('the tail keeps every longitudinal coordinate and all of its original tip reach',()=>{
 let count=0;for(let v=0;v<p.length/3;v++){let tail=0;for(let k=0;k<4;k++)if(names[j[v*4+k]].startsWith('Tail_'))tail+=w[v*4+k];if(tail>.999){assert.ok(Math.abs(p[v*3]-(original[v*3]-.035))<1e-7);count++;}}
 assert.equal(count,589);assert.ok(Math.abs(measure.xMin-before.xMin)<1e-7&&Math.abs(measure.xMax-before.xMax)<1e-7);
});

test('exported sections have even flanks and a narrow base that grows into the fox-tail body',()=>{
 for(const section of measure.sections){assert.ok(section.yImbalance<.006,`uneven height at ${section.x}: ${section.yImbalance}`);assert.ok(section.zImbalance<.004,`uneven flanks at ${section.x}: ${section.zImbalance}`);}
 const growing=measure.sections.slice(0,5);for(let i=1;i<growing.length;i++){assert.ok(growing[i].height>growing[i-1].height);assert.ok(growing[i].width>growing[i-1].width);}
 assert.ok(growing[0].height<.2*growing.at(-1).height&&growing[0].width<.1*growing.at(-1).width,'skinny base, full fluffy body');
 const old=before.sections.reduce((s,r)=>s+r.zImbalance,0),now=measure.sections.reduce((s,r)=>s+r.zImbalance,0);assert.ok(now<.10*old,'removes the one-sided bulk');
});

test('the painted palette, texture, UVs and material definitions are retained',()=>{
 assert.deepEqual(current.read(a.attributes.TEXCOORD_0),source.read(source.json.meshes[0].primitives[0].attributes.TEXCOORD_0));assert.deepEqual(g.materials[0],source.json.materials[0]);
 const image=(name,glb,id)=>{const bytes=fs.readFileSync(name),view=glb.json.bufferViews[glb.json.images[id].bufferView],offset=28+bytes.readUInt32LE(12)+(view.byteOffset||0);return bytes.subarray(offset,offset+view.byteLength);};
 for(let i=0;i<source.json.images.length;i++)assert.deepEqual(image(file,current,i),image('public/meshy-fox-preview/fox-repaired.glb',source,i));
 const normal=current.read(a.attributes.NORMAL);for(let v=0;v<normal.length;v+=3)assert.ok(Math.abs(Math.hypot(...normal.subarray(v,v+3))-1)<1e-5,'refitted normals are finite and unit length');
});

test('the slimmer tail and fallen body retain real floor contact throughout the fall',async()=>{
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});const bytes=fs.readFileSync(file),asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),''),mixer=new T.AnimationMixer(asset.scene),clip=asset.animations.find(c=>c.name==='Fall_and_Death'),meshes=[];
 asset.scene.traverse(o=>{if(o.isMesh)meshes.push({mesh:o,ids:o.geometry.index?[...new Set(o.geometry.index.array)]:Array.from({length:o.geometry.attributes.position.count},(_,i)=>i)});});mixer.clipAction(clip).setLoop(T.LoopOnce,1).play();
 for(let f=0;f<=Math.round(clip.duration*60);f++){mixer.setTime(Math.min(f/60,clip.duration-1e-6));asset.scene.updateMatrixWorld(true);let lowest=Infinity;for(const {mesh,ids}of meshes){let hidden=false;for(let o=mesh;o;o=o.parent)if(!o.visible||Math.abs(o.scale.x*o.scale.y*o.scale.z)<1e-9)hidden=true;if(hidden)continue;if(mesh.isSkinnedMesh)mesh.skeleton.update();for(const id of ids)lowest=Math.min(lowest,mesh.getVertexPosition(id,new T.Vector3()).applyMatrix4(mesh.matrixWorld).y);}assert.ok(lowest>=-.001&&lowest<.006,`floor contact ${lowest} at ${f/60}`);}
});
