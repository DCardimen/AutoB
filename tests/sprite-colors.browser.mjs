import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';
import {NATIVE_STARTERS} from '../native-content.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3032',report={checks:[],errors:[],externalRequests:[]};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
fs.mkdirSync('playtest-artifacts',{recursive:true});
async function fixture(offline=false){
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),run=makeRun(3,NATIVE_STARTERS);run.route=generateRoute(run);const node=run.route[0][0],foes=encounter(run,node.type,node.seed),{random,...data}=run;
 p.on('pageerror',e=>report.errors.push(e.stack));
 await p.addInitScript(saved=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved)),{version:7,run:data,profile:{owned:[...NATIVE_STARTERS],tutorial:true,sound:false},phase:'prep',node,foes});
 const url=offline?base+'/palette-offline':base;
 if(offline)await p.route('**/*',route=>{if(route.request().url()===url)return route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('Starfall-Menagerie.html')});report.externalRequests.push(route.request().url());return route.abort();});
 await p.clock.install();await p.goto(url);await p.clock.runFor(300);assert.match(await p.locator('.local-label').textContent(),/V17\.1/);return p;
}
async function checkRoster(p,label){
 await p.locator('[data-action="roster"]').first().click();
 for(const id of ['glacier','lunacrest'])for(const form of ['0','1','2']){
  await p.locator('[data-roster="family"]').selectOption(id);await p.locator('[data-roster="form"]').selectOption(form);await p.locator('[data-roster="state"]').selectOption('run');await p.clock.runFor(250);
  const counts=await p.locator('#roster-canvas').evaluate(c=>{const data=c.getContext('2d').getImageData(0,13,192,165).data,n=[0,0];for(let y=0;y<165;y++)for(let x=0;x<192;x++){const i=(y*192+x)*4,[r,g,b]=data.subarray(i,i+3);if(b>g*.95&&b>r*1.15&&g>r*1.1)n[y<82?0:1]++;}return n;});
  assert.ok(counts[0]>30&&counts[1]>30,`${label} ${id} form ${form}: upper and lower body share the blue variant (${counts})`);
 }
 await p.locator('#roster-canvas').screenshot({path:`playtest-artifacts/palette-${label}-roster.png`});report.checks.push(`${label}: actual roster shows consistent upper/lower colors for both blue variants in all three forms`);
 await p.locator('.modal-backdrop').click({position:{x:2,y:2}});
 await p.locator('[data-action="battle"]').click();await p.clock.runFor(9000);const metrics=await p.evaluate(()=>starfall.state.battle?.metrics);assert.ok(metrics.bladeContacts>0&&metrics.skills>0);report.checks.push(`${label}: battle animates and records physical hits and skills`);
}
try{
 let p=await fixture();await checkRoster(p,'source');
 const sheet=await p.evaluate(async()=>{
  const {PIXEL_SPECIES,pixelSpec}=await import('/native-content.js'),{nativePosePixels}=await import('/native-poses.js');const out=document.createElement('canvas'),ctx=out.getContext('2d'),cell=document.createElement('canvas');cell.width=cell.height=64;const brush=cell.getContext('2d');const ids=['aurel','brakk','syl','nyra','rowan','mossguard','glacier','lunacrest','canopyowl','floebear'];out.width=1152;out.height=ids.length*156+30;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#15252a';ctx.fillRect(0,0,out.width,out.height);ctx.font='13px monospace';ctx.fillStyle='#efdcaf';ctx.fillText('V17.1 · consistent palettes · run · eight directions · boots equipped',12,20);ids.forEach((id,row)=>{ctx.fillStyle='#efdcaf';ctx.fillText(id,8,row*156+47);for(let dir=0;dir<8;dir++){const pixels=nativePosePixels(pixelSpec(id),{id,evolution:row>4?1:0,evolutionPath:'wild',equipment:['windstep-boots']},'run',.25,dir);brush.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,dir*144,55+row*156,128,128);}});
  let frames=0;for(const spec of PIXEL_SPECIES)for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++)for(const state of ['idle','run','attack']){const pixels=nativePosePixels(spec,{id:spec.id,evolution,evolutionPath:'wild',equipment:['windstep-boots']},state,.25,dir);if(pixels.clipped)throw new Error(`${spec.id} ${evolution} ${dir} ${state}: clipping`);frames++;}
  return {frames,png:out.toDataURL().split(',')[1]};
 });fs.writeFileSync('public/sprite-palette-fix-directions.png',Buffer.from(sheet.png,'base64'));report.frames=sheet.frames;report.checks.push(`Source browser renders ${sheet.frames} equipped frames across all 89 families, three forms, eight facings and idle/run/attack without clipping`);await p.close();
 p=await fixture(true);await checkRoster(p,'offline');await p.close();
 p=await browser.newPage();p.on('pageerror',e=>report.errors.push(e.stack));const trainingUrl=base+'/palette-training-offline';await p.route('**/*',route=>{if(route.request().url()===trainingUrl)return route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('Starfall-Training-Glade.html')});report.externalRequests.push(route.request().url());return route.abort();});await p.clock.install();await p.goto(trainingUrl);await p.clock.runFor(500);await p.locator('[data-scene="movement"]').click();await p.locator('[data-pace="sprint"]').click();const before=await p.locator('#prototype-canvas').evaluate(c=>c.toDataURL());await p.clock.runFor(1200);assert.notEqual(await p.locator('#prototype-canvas').evaluate(c=>c.toDataURL()),before);await p.close();report.checks.push('Exact standalone Training Glade renders and animates sprinting with the shared palette correction');
 assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.errors,[]);report.checks.push('Both distributed HTML files work without any external requests or browser errors');console.log(JSON.stringify({...report,frames:sheet.frames},null,2));
}finally{fs.writeFileSync('playtest-artifacts/sprite-colors-browser.json',JSON.stringify(report,null,2));await browser.close();}
