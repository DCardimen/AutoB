import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runtimeFiles,fingerprint,hashFile,stages,acquireLock} from './animation-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/animation-pipeline');fs.mkdirSync(out,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--stage='))?.slice(8);
if(selected&&!stages.some(s=>String(s.id)===selected))throw Error('--stage must be 1 through 7');
const release=acquireLock(path.join(out,'pipeline.lock'));process.on('exit',release);
const inputs=()=>[...runtimeFiles(),...['scripts','tests'].flatMap(dir=>fs.readdirSync(dir).filter(f=>/\.(mjs|js)$/.test(f)).map(f=>dir+'/'+f))].sort();
const report={schema:2,revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).stdout.trim(),inputs:fingerprint(inputs()),scope:selected?'stage':'pipeline',completePipeline:false,coverage:{families:41,forms:3,directions:8},stages:stages.map(s=>({...s,status:'not-run'})),checks:[],status:'running'};
const save=()=>fs.writeFileSync(path.join(out,selected?'stage-'+selected+'.json':'pipeline.json'),JSON.stringify(report,null,2)+'\n');
let ownedServer,currentStage;save();
async function ensureServer(){
 const base=process.env.BASE_URL||'http://127.0.0.1:3000';process.env.BASE_URL=base;
 const available=async()=>{try{const response=await fetch(base+'/companion-anatomy.js',{signal:AbortSignal.timeout(2000)});if(!response.ok)return false;const hash=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');assert.equal(hash,hashFile('companion-anatomy.js'),'BASE_URL serves a different checkout');return true;}catch(error){if(error.code==='ERR_ASSERTION')throw error;return false;}};
 if(await available())return;
 const url=new URL(base);if(!['localhost','127.0.0.1'].includes(url.hostname))throw Error('BASE_URL is unavailable: '+base);
 const fd=fs.openSync(path.join(out,'server.log'),'w');try{ownedServer=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:url.port||'3000'},windowsHide:true,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}
 let failure;ownedServer.on('error',error=>{failure=error;});
 for(let attempt=0;attempt<50;attempt++){if(failure)throw failure;if(await available())return;await new Promise(resolve=>setTimeout(resolve,200));}
 throw Error('Local game server did not start; see server.log');
}
async function run(name,args,env={}){
 const logfile=path.join(out,name+'.log'),entry={stage:currentStage,name,command:['node',...args],status:'running',log:path.relative(root,logfile)};
 report.checks.push(entry);save();console.log('Stage '+currentStage+': '+name);const fd=fs.openSync(logfile,'w'),start=Date.now();
 try{
  const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,...env},windowsHide:true,stdio:['ignore',fd,fd]});
  entry.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  if(entry.exitCode!==0)throw Error(name+' failed; see '+logfile);entry.status='passed';
 }catch(error){entry.status='failed';entry.error=error.message;throw error;}finally{fs.closeSync(fd);entry.seconds=(Date.now()-start)/1000;save();}
}
const checks={
 1:async()=>{await run('inventory',['scripts/audit-companion-anatomy.mjs','--out='+out]);},
 2:async()=>{
  await run('parts',['scripts/build-companion-parts.mjs','--out='+path.join(out,'parts')]);
  await run('parts-repeat',['scripts/build-companion-parts.mjs','--out='+path.join(out,'parts-repeat')]);
  assert.equal(hashFile(path.join(out,'parts','manifest.json')),hashFile(path.join(out,'parts-repeat','manifest.json')),'Parts are reproducible');
  await run('decoded-parts',['scripts/verify-companion-parts.mjs','--out='+path.join(out,'parts')]);
  await run('part-materials',['--test','tests/companion-material-ownership.test.js']);
  report.partsManifest=hashFile(path.join(out,'parts','manifest.json'));report.reproducible=true;
 },
 3:()=>run('sockets',['--test','tests/companion-parts.test.js','tests/brakk-arms.test.js','tests/arm-animation.test.js','tests/torso-fill.test.js']),
 4:()=>run('locomotion',['--test','tests/gaits-carry.test.js','tests/legs-v3.test.js','tests/legs-v2.test.js','tests/creature-anatomy.test.js']),
 5:()=>run('secondary-motion',['--test','tests/companion-deformation.test.js','tests/prototype-rig.test.js','tests/sprite-art-v2.test.js']),
 6:()=>run('actions',['--test','tests/melee-weapon-art.test.js','tests/swing-body.test.js','tests/combat-spacing.test.js']),
 7:async()=>{
  await run('pipeline-contracts',['--test','tests/animation-pipeline.test.js']);
  await run('cell-tests',['--test','--test-name-pattern=every pixel family|raised weapons|grand evolution|cloth anchors|weapon contacts','tests/grand-forms.test.js']);
  await run('standalone',['scripts/build-standalone.mjs']);await run('prototype',['scripts/build-prototype.mjs']);
  for(const file of ['Starfall-Menagerie.html','Starfall-Training-Glade.html'])assert.ok(fs.statSync(file).size<100*1024*1024,file+' fits repository size limit');
  await ensureServer();
  await run('readability-contracts',['--test','tests/readable-combat.test.js']);
  await run('opening-pacing',['scripts/check-combat-pacing.mjs','--out='+path.join(out,'opening-pacing.json')]);
  await run('default-combat-readability',['tests/readable-combat.browser.mjs'],{PASS_ONE_OUT:path.join(out,'default-combat')});
  await run('source-offline-combat',['tests/companion-animation.browser.mjs']);
  await run('live-legs',['tests/legs-v2.browser.mjs']);await run('live-prototype',['tests/prototype.browser.mjs']);
  await run('source-sheets',['scripts/review-gaits-carry.mjs','quality']);await run('natural-sheets',['scripts/review-legs-v3.mjs','quality']);await run('body-sheets',['scripts/review-swing-body.mjs','quality']);
  await run('motion-video',['scripts/review-companion-animation.mjs','--out='+path.join(out,'video')]);
  await run('decoded-video',['scripts/verify-animation-video.mjs','--out='+path.join(out,'video')]);
  report.outputs=fingerprint(['Starfall-Menagerie.html','Starfall-Training-Glade.html']);
 },
};
try{
 if(process.argv.includes('--recover-source')){assert.ok(!selected||selected==='1','Source recovery belongs to stage 1');currentStage=1;await run('recover-source',['scripts/repair-anatomy-imports.mjs']);await run('sync-atlases',['scripts/sync-authored-atlases.mjs']);report.inputs=fingerprint(inputs());save();}
 for(const stage of report.stages){if(selected&&String(stage.id)!==selected)continue;currentStage=stage.id;stage.status='running';save();await checks[stage.id]();assert.deepEqual(fingerprint(inputs()),report.inputs,'Animation inputs changed during verification; rerun against stable source');stage.status='passed';save();}
 report.status='passed';report.completePipeline=!selected&&report.stages.every(s=>s.status==='passed');save();console.log('Animation '+report.scope+' passed. Visual approval still requires reviewing the sheets and decoded movie.');
}catch(error){report.status='failed';report.error=error.message;const stage=report.stages.find(s=>s.id===currentStage);if(stage)stage.status='failed';save();throw error;}finally{ownedServer?.kill();release();}
