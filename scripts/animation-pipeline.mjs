import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/animation-pipeline');fs.mkdirSync(out,{recursive:true});
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputs=['companion-anatomy.js','authored-parts.js','authored-arm-skin.js','authored-sprite-renderer.js','creature-leg-volume.js','creature-attacks.js','native-combat.js','native-forms.js','prototype-rig.js','prototype-pixel-art.js',...fs.readdirSync(root).filter(f=>/^authored-.*-data\.js$/.test(f))];
const report={schema:1,revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).stdout.trim(),inputs:Object.fromEntries(inputs.map(file=>[file,hash(file)])),coverage:{families:41,forms:3,directions:8},checks:[],status:'running'};
const save=()=>fs.writeFileSync(path.join(out,'pipeline.json'),JSON.stringify(report,null,2)+'\n');
let ownedServer;
async function ensureServer(){
 const base=process.env.BASE_URL||'http://127.0.0.1:3000';process.env.BASE_URL=base;
 const available=async()=>{try{const response=await fetch(base,{signal:AbortSignal.timeout(2000)});return response.ok;}catch{return false;}};
 if(await available())return;
 const url=new URL(base);if(!['localhost','127.0.0.1'].includes(url.hostname))throw Error('BASE_URL is unavailable: '+base);
 const fd=fs.openSync(path.join(out,'server.log'),'w');ownedServer=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:url.port||'3000'},windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 for(let attempt=0;attempt<50;attempt++){if(await available())return;await new Promise(resolve=>setTimeout(resolve,200));}
 throw Error('Local game server did not start; see server.log');
}
async function run(name,args){
 const logfile=path.join(out,name+'.log'),command=['node',...args],files=Object.fromEntries(args.filter(arg=>!arg.startsWith('-')&&fs.existsSync(arg)&&fs.statSync(arg).isFile()).map(file=>[file,hash(file)]));
 console.log(name);const fd=fs.openSync(logfile,'w'),start=Date.now();
 const child=spawn(process.execPath,args,{cwd:root,env:process.env,windowsHide:true,stdio:['ignore',fd,fd]});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});fs.closeSync(fd);
 report.checks.push({name,command,files,exitCode:code,seconds:(Date.now()-start)/1000,log:path.relative(root,logfile)});save();
 if(code)throw Error(`${name} failed; see ${logfile}`);
}
try{
 if(process.argv.includes('--recover-source')){await run('recover-source',['scripts/repair-anatomy-imports.mjs']);await run('sync-atlases',['scripts/sync-authored-atlases.mjs']);report.inputs=Object.fromEntries(inputs.map(file=>[file,hash(file)]));save();}
 await run('parts',['scripts/build-companion-parts.mjs',`--out=${path.join(out,'parts')}`]);
 await run('parts-repeat',['scripts/build-companion-parts.mjs',`--out=${path.join(out,'parts-repeat')}`]);
 if(hash(path.join(out,'parts','manifest.json'))!==hash(path.join(out,'parts-repeat','manifest.json')))throw Error('Parts are not reproducible');
 report.partsManifest=hash(path.join(out,'parts','manifest.json'));report.reproducible=true;save();
 await run('anatomy-tests',['--test','tests/companion-parts.test.js','tests/brakk-arms.test.js','tests/gaits-carry.test.js','tests/legs-v3.test.js','tests/legs-v2.test.js','tests/creature-anatomy.test.js','tests/melee-weapon-art.test.js','tests/swing-body.test.js','tests/prototype-rig.test.js','tests/sprite-art-v2.test.js','tests/combat-spacing.test.js']);
 await run('cell-tests',['--test','--test-name-pattern=every pixel family|raised weapons|grand evolution|cloth anchors|weapon contacts','tests/grand-forms.test.js']);
 await run('standalone',['scripts/build-standalone.mjs']);
 await run('prototype',['scripts/build-prototype.mjs']);
 for(const file of ['Starfall-Menagerie.html','Starfall-Training-Glade.html'])if(fs.statSync(file).size>=100*1024*1024)throw Error(`${file} exceeds the repository's 100 MiB limit`);
 await ensureServer();
 await run('source-offline-combat',['tests/companion-animation.browser.mjs']);
 await run('live-legs',['tests/legs-v2.browser.mjs']);
 await run('live-prototype',['tests/prototype.browser.mjs']);
 await run('source-sheets',['scripts/review-gaits-carry.mjs','final']);
 await run('natural-sheets',['scripts/review-legs-v3.mjs','final']);
 await run('body-sheets',['scripts/review-swing-body.mjs','final']);
 await run('motion-video',['scripts/review-companion-animation.mjs',`--out=${path.join(out,'video')}`,'--reuse']);
 await run('decoded-video',['scripts/verify-animation-video.mjs',`--out=${path.join(out,'video')}`]);
 report.outputs=Object.fromEntries(['Starfall-Menagerie.html','Starfall-Training-Glade.html'].map(file=>[file,hash(file)]));report.status='passed';save();console.log(`Animation pipeline passed. Review ${path.join(out,'video','review.html')} before accepting the art.`);
}catch(error){report.status='failed';report.error=error.message;save();throw error;}finally{ownedServer?.kill();}
