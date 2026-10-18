import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {decodePng} from './animation-artifacts.mjs';
import {hashFile} from './animation-contract.mjs';
import {authoredIdentities,authoredSourceFrame} from '../authored-sprite-renderer.js';

export function verifyParts(folder){
 const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
 assert.equal(manifest.schema,2);assert.equal(manifest.families,authoredIdentities.length);assert.equal(manifest.entries.length,authoredIdentities.length*3);
 const seen=new Set();let images=0,frames=0,emptyParts=0;
 for(const entry of manifest.entries){
  assert.ok(authoredIdentities.includes(entry.identity));assert.ok([0,1,2].includes(entry.stage));const key=entry.identity+':'+entry.stage;assert.ok(!seen.has(key));seen.add(key);
  const order=['head','torso','legs','cape','left-arm','right-arm'],layers={};
  assert.deepEqual(Object.keys(entry.files).sort(),['original','assembled',...order].sort());
  for(const [name,record]of Object.entries(entry.files)){
   assert.equal(path.basename(record.file),record.file,'export stays inside its folder');const file=path.join(folder,record.file);assert.equal(hashFile(file),record.sha256,file);
   const decoded=decodePng(fs.readFileSync(file));assert.equal(decoded.width,512);assert.equal(decoded.height,64);layers[name]=decoded.rgba;images++;
  }
  const assembled=new Uint8ClampedArray(512*64*4);for(const name of order)for(let n=0;n<assembled.length;n+=4)if(layers[name][n+3])assembled.set(layers[name].subarray(n,n+4),n);
  assert.deepEqual(assembled,layers.assembled,key+': decoded layers reassemble exactly');
  assert.deepEqual(entry.frames.map(f=>f.dir),[0,1,2,3,4,5,6,7]);
  for(const frame of entry.frames){
   const source=authoredSourceFrame(entry.identity,frame.dir,entry.stage),palette=new Set(source.colors.map(c=>c.slice(1))),{fit,ox,oy}=frame.exportTransform;
   const expected=new Uint8ClampedArray(512*64*4);
   for(const p of source.pixels){const x=Math.round(32+(p.x-32+ox)*fit)+frame.dir*64,y=Math.round(44+(p.y-44+oy)*fit);expected.set([...p.rgb,255],(y*512+x)*4);}
   for(const [name,rgba]of Object.entries(layers)){let count=0;for(let y=0;y<64;y++)for(let x=frame.dir*64;x<(frame.dir+1)*64;x++){const n=(y*512+x)*4;if(rgba[n+3]){count++;assert.equal(rgba[n+3],255);assert.ok(palette.has(Buffer.from(rgba.subarray(n,n+3)).toString('hex')),key+': original palette');}if(name==='original')assert.deepEqual([...rgba.subarray(n,n+4)],[...expected.subarray(n,n+4)],key+': source artwork preserved');}
    assert.equal(frame.partCounts[name],count,key+': actual '+name+' coverage');if(!count){assert.ok(frame.absenceReasons[name]?.length>10,key+': empty '+name+' explained');emptyParts++;}
   }
   frames++;
  }
 }
 return {status:'passed',families:manifest.families,forms:3,directions:8,images,frames,emptyParts,reassembly:'Decoded pixels match',palette:'Original indexed materials only'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/companion-parts');const result=verifyParts(folder);fs.writeFileSync(path.join(folder,'validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
