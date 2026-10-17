import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {states,validateVideoManifest,verifiedVideo,acquireLock,hashFile} from '../scripts/animation-contract.mjs';
import {png,decodePng} from '../scripts/animation-artifacts.mjs';
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'animation-quality-'));
function clean(folder){const target=fs.realpathSync(folder),parent=fs.realpathSync(os.tmpdir());assert.equal(path.dirname(target).toLowerCase(),parent.toLowerCase());assert.ok(path.basename(target).startsWith('animation-quality-'));fs.rmSync(target,{recursive:true,force:true});}
function manifest(videoHash){return {forms:3,directions:8,fps:12,width:240,height:64,families:1,positions:[{identity:'test',forms:[0,1,2].map(stage=>({stage,x:stage*72,y:0}))}],states,clipped:[],timeline:Array.from({length:72},(_,i)=>({dir:Math.floor(i/9),state:states[i%9],start:i,end:i+1})),duration:72,frames:864,renderedPoses:2592,videoHash,inputs:{runtime:'registered-source-hash'}};}

test('movie acceptance rejects omitted facings, missing idle/turn/stop, clipped poses and inconsistent timing',()=>{
 const valid=manifest('a'.repeat(64));assert.equal(validateVideoManifest(valid),valid);
 for(const mutate of [m=>m.timeline.pop(),m=>m.timeline[0].state='walk',m=>m.timeline[0].dir=7,m=>m.timeline[0].end=.5,m=>m.clipped.push({pixels:1}),m=>m.frames++,m=>m.positions[0].forms[2].x=240]){
  const broken=structuredClone(valid);mutate(broken);assert.throws(()=>validateVideoManifest(broken));
 }
});
test('movie cache requires matching bytes, source inputs, complete coverage and a review player',()=>{
 const folder=temp();try{
  const video=path.join(folder,'all-companions.mp4');fs.writeFileSync(video,'exact encoded bytes');const m=manifest(hashFile(video)),file=path.join(folder,'video-manifest.json');fs.writeFileSync(file,JSON.stringify(m));fs.writeFileSync(path.join(folder,'review.html'),'player');
  assert.ok(verifiedVideo(folder,m.inputs));assert.equal(verifiedVideo(folder,{runtime:'changed'}),null);
  fs.writeFileSync(video,'corrupted');assert.equal(verifiedVideo(folder,m.inputs),null);fs.writeFileSync(video,'exact encoded bytes');
  m.timeline.pop();fs.writeFileSync(file,JSON.stringify(m));assert.equal(verifiedVideo(folder,m.inputs),null);
  fs.writeFileSync(file,JSON.stringify(manifest(hashFile(video))));fs.unlinkSync(path.join(folder,'review.html'));assert.equal(verifiedVideo(folder,m.inputs),null);
 }finally{clean(folder);}
});
test('PNG validation checks actual decoded pixels and rejects corruption or truncation',()=>{
 const rgba=new Uint8ClampedArray([1,2,3,255,7,8,9,0]),bytes=png(2,1,rgba),decoded=decodePng(bytes);assert.equal(decoded.width,2);assert.deepEqual(decoded.rgba,rgba);
 const corrupt=Buffer.from(bytes);corrupt[45]^=1;assert.throws(()=>decodePng(corrupt));assert.throws(()=>decodePng(bytes.subarray(0,bytes.length-3)));
});
test('animation output lock rejects a live owner and recovers an abandoned process',()=>{
 const folder=temp(),file=path.join(folder,'encoding.lock');try{const release=acquireLock(file);assert.throws(()=>acquireLock(file),/already owns/);release();assert.ok(!fs.existsSync(file));fs.writeFileSync(file,'2147483647');acquireLock(file)();assert.ok(!fs.existsSync(file));}finally{clean(folder);}
});
test('a failed encoder preserves the last movie and releases its output lock',()=>{
 const folder=temp();try{
  const video=path.join(folder,'all-companions.mp4');fs.writeFileSync(video,'previous review');
  const result=spawnSync(process.execPath,['scripts/review-companion-animation.mjs','--out='+folder],{env:{...process.env,FFMPEG_PATH:path.join(folder,'missing-encoder')},encoding:'utf8',windowsHide:true,timeout:20000});
  assert.equal(result.error,undefined);assert.notEqual(result.status,0);assert.match(result.stderr,/ENOENT/);assert.equal(fs.readFileSync(video,'utf8'),'previous review');assert.ok(!fs.existsSync(path.join(folder,'encoding.lock')));assert.ok(!fs.existsSync(path.join(folder,'video-manifest.json')));
 }finally{clean(folder);}
});
test('an independent stage reports its own result without claiming complete pipeline approval',()=>{
 const folder=temp();try{
  const result=spawnSync(process.execPath,['scripts/animation-pipeline.mjs','--stage=1','--out='+folder],{encoding:'utf8',windowsHide:true,timeout:20000});assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(fs.readFileSync(path.join(folder,'stage-1.json'),'utf8'));assert.equal(report.status,'passed');assert.equal(report.completePipeline,false);assert.deepEqual(report.stages.map(s=>s.status),['passed',...Array(6).fill('not-run')]);assert.ok(!fs.existsSync(path.join(folder,'pipeline.lock')));assert.ok(!fs.existsSync(path.join(folder,'pipeline.json')));
 }finally{clean(folder);}
});
