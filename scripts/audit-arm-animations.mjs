import fs from 'node:fs';
import path from 'node:path';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {runtimeFiles,fingerprint} from './animation-contract.mjs';
import assert from 'node:assert/strict';

const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/arm-audit.json';
fs.mkdirSync(path.dirname(out),{recursive:true});
const inputs=fingerprint(runtimeFiles()),failures=[],counts={poses:0,arms:0,sourcePixels:0};let failureCount=0;
const merge=process.argv.find(a=>a.startsWith('--merge='))?.slice(8);
if(merge){
 const files=fs.readdirSync(merge).filter(f=>/^shard-\d+-of-\d+\.json$/.test(f)),reports=files.map(f=>JSON.parse(fs.readFileSync(merge+'/'+f,'utf8'))),first=reports[0];assert.ok(first,'completed shards');assert.equal(reports.length,first.shard.count);
 const indices=new Set(),species=[];for(const report of reports){assert.deepEqual(report.inputs,inputs);assert.equal(report.shard.count,reports.length);assert.ok(!indices.has(report.shard.index));indices.add(report.shard.index);assert.equal(report.status,'passed');assert.equal(report.failureCount,0);assert.deepEqual(report.states,first.states);assert.deepEqual(report.phases,first.phases);species.push(...report.species);for(const key of Object.keys(counts))counts[key]+=report.counts[key];}
 assert.deepEqual([...species].sort(),PIXEL_SPECIES.map(s=>s.id).sort(),'exactly one shard owns every roster entry');assert.equal(counts.poses,302600);
 const result={...first,shard:undefined,shards:reports.length,species:PIXEL_SPECIES.map(s=>s.id),counts,inputs};fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({counts,failures:0,shards:reports.length}));process.exit(0);
}
const split=process.argv.find(a=>a.startsWith('--shard='))?.slice(8).split('/').map(Number)||[0,1],shard={index:split[0],count:split[1]};assert.ok(Number.isInteger(shard.index)&&Number.isInteger(shard.count)&&shard.index>=0&&shard.index<shard.count&&shard.count<=16);
const specs=PIXEL_SPECIES.filter((_,i)=>i%shard.count===shard.index);
for(const spec of specs)for(const evolution of [0,1,2])for(const evolutionPath of evolution?['wild','warden']:['wild'])for(const state of NATIVE_POSES)for(let dir=0;dir<8;dir++)for(const phase of [0,.23,.49,.73,.99]){
 const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),context={id:spec.id,evolution,evolutionPath,state,dir,phase};counts.poses++;
 const fail=(kind,detail)=>{failureCount++;if(failures.length<1000)failures.push({...context,kind,...detail});};
 if(pixels.clipped)fail('cell',{clipped:pixels.clipped,samples:pixels.clipSamples});
 if(rig.arms.length&&!rig.artArmSkin){fail('missing-authored-arms',{});continue;}
 const body=new Set((rig.artArmSkin?.bodyPixels||[]).filter(p=>!p.bodyUnderlay).map(p=>p.y*64+p.x));
 for(const arm of rig.arms){
  counts.arms++;
  const p=rig.artArmSkin.art.profiles.get(rig.artArmScreens[arm.side]),root=rig.artArmRoots[arm.side],joint=rig.artProject(arm.joint),end=rig.artProject(arm.end),scale=rig.artCreatureFit*(rig.artArmSkin.scale.width+rig.artArmSkin.scale.height)/2;
  for(const [a,z,sa,sz,part]of [[root,joint,p.root,p.joint,'upper'],[joint,end,p.joint,p.end,'lower']]){
   const length=Math.hypot(z.x-a.x,z.y-a.y),expected=Math.hypot(sz.x-sa.x,sz.y-sa.y)*scale;if(Math.abs(length-expected)>1e-6)fail('length',{side:arm.side,part,length,expected,root,joint,end});
  }
  for(const source of p.pixels){counts.sourcePixels++;if(body.has(source.y*64+source.x))fail('frozen-source',{side:arm.side,source});}
 }
 if(rig.weapon&&rig.arms.length){const arm=rig.arms.find(a=>a.side===(rig.weapon.hand==='left'?-1:1)),hand=rig.artProject(arm.end),grip=rig.artProject(rig.weapon.grip);if(Math.hypot(hand.x-grip.x,hand.y-grip.y)>1e-7)fail('grip',{hand,grip});}
 if(counts.poses%10000===0)console.log(JSON.stringify({poses:counts.poses,failures:failureCount,id:spec.id}));
}
assert.deepEqual(fingerprint(runtimeFiles()),inputs,'rerun the audit after changing animation sources');
fs.writeFileSync(out,JSON.stringify({status:failureCount?'failed':'passed',inputs,shard,counts,species:specs.map(s=>s.id),armFamilies:Object.keys(ARM_ANATOMY),states:NATIVE_POSES,phases:[0,.23,.49,.73,.99],forms:[0,1,2],paths:['wild','warden'],directions:8,failureCount,failures},null,2)+'\n');
console.log(JSON.stringify({counts,failures:failureCount,first:failures.slice(0,5)}));process.exitCode=failureCount?1:0;
