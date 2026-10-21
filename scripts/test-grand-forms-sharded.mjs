import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PIXEL_SPECIES} from '../native-content.js';

// Preserve the original test and every assertion. Only independent species
// traversals are distributed; fixed-character checks still run in each shard.
const source=fs.readFileSync('tests/grand-forms.test.js','utf8'),count=8,out='docs/evidence/meshy-fox-archer-v3',loops=/for\(const (\w+) of PIXEL_SPECIES\)/g;
assert.equal([...source.matchAll(loops)].length,3,'review sharding if the roster loops change');
const groups=Array.from({length:count},(_,k)=>PIXEL_SPECIES.filter((_,i)=>i%count===k).map(s=>s.id));assert.equal(new Set(groups.flat()).size,PIXEL_SPECIES.length);assert.equal(groups.flat().length,89);
const results=await Promise.all(groups.map(async(species,k)=>{
 const file=path.resolve(`tests/.fox-v3-grand-forms-shard-${k}.mjs`),log=`${out}/grand-forms-shard-${k}.txt`;
 assert.equal(path.dirname(file),path.resolve('tests'));
 const text=source.replace(loops,(_,name)=>`for(const ${name} of PIXEL_SPECIES.filter((_, index)=>index % ${count} === ${k}))`);fs.writeFileSync(file,text);
 try{
  const result=await new Promise((resolve,reject)=>{const stream=fs.createWriteStream(log),child=spawn(process.execPath,['--test',file],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});child.on('error',reject);child.on('close',code=>stream.end(()=>resolve({shard:k,species,code,log})));});console.log(`Grand forms shard ${k}: ${result.code===0?'PASS':'FAIL'}`);return result;
 }finally{fs.unlinkSync(file);}
}));
const report={source:'tests/grand-forms.test.js',sourceSHA256:createHash('sha256').update(source).digest('hex'),species:89,shards:count,originalAssertionsUnchanged:true,results};fs.writeFileSync(`${out}/grand-forms-sharded.json`,JSON.stringify(report,null,2));assert.ok(results.every(r=>r.code===0),'all roster shards must pass');
