import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeRun,creature,generateRoute} from '../game.js';
import {PIXEL_SPECIES} from '../native-content.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts/companion-animation-live';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report=[];
try{for(const offline of [false,true])for(const evolution of [0,1,2]){
 const context=await browser.newContext({viewport:{width:1900,height:1100}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));const url=base+(offline?'/Starfall-Menagerie.html':'/index.html');
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()&&r.request().url()===url?r.continue():(requests.push(r.request().url()),r.abort()));
 const run=makeRun(291,['aurel']);run.teamCapacity=6;
 const companion=(id,i,side)=>({...creature(id),evolution,evolutionPath:'wild',equipment:[],deploymentPosition:{x:side?520+(i>=3?35:0):430-(i>=3?35:0),y:320+i%3*100}});
 run.team=['aurel','brakk','brom','tarka','cinderfox','stormdrake'].map((id,i)=>companion(id,i,0));run.route=generateRoute(run);
 const foes=['orchimantis','mireclaw','morrow','eira',PIXEL_SPECIES.find(s=>s.nativeDesign==='moth').id,'grum'].map((id,i)=>companion(id,i,1));
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes,phase:'prep',profile:{owned:run.team.map(c=>c.id),tutorial:true,tuning:{spriteSize:200}}});
 await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto(url);await page.waitForFunction(()=>window.starfall);
 await page.locator('[data-action="battle"]').click();const states=new Set();let animated=false,previous='';
 for(let i=0;i<8;i++){
  await page.clock.runFor(500);const sample=await page.evaluate(()=>({phase:starfall.state.phase,units:starfall.state.battle.units.map(u=>({id:u.id,x:u.x,y:u.y,gait:u.nativeActor?.gait,action:u.nativeActor?.action?.released?'recovery':u.nativeActor?.action?'windup':'travel'})),canvas:document.querySelector('#battle-canvas').toDataURL()}));
  assert.equal(sample.phase,'battle');assert.ok(sample.units.every(u=>[u.x,u.y,u.gait].every(Number.isFinite)));
  sample.units.forEach(u=>states.add(u.action));if(previous&&sample.canvas!==previous)animated=true;previous=sample.canvas;
 }
 assert.ok(animated);assert.ok(states.has('windup')||states.has('recovery'),'actual actions appear in live combat');
 const metrics=await page.evaluate(()=>starfall.state.battle.metrics);assert.ok(metrics.bladeContacts>0,'weapons/natural attacks connect in the delivered combat flow');
 await page.locator('[data-action="pause"]').click();await page.screenshot({path:`${out}/${offline?'offline':'source'}-form-${evolution}.png`});
 assert.deepEqual(errors,[]);if(offline)assert.deepEqual(requests,[]);
 report.push({offline,evolution,families:run.team.map(c=>c.id).concat(foes.map(c=>c.id)),states:[...states],bladeContacts:metrics.bladeContacts,animated,errors,requests});await context.close();
}}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
