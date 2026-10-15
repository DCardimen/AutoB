import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',report={checks:[],errors:[],samples:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 for(const offline of [false,true])for(const size of [100,250]){
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),url=base+(offline?'/Starfall-Menagerie.html':'/index.html'),requests=[];
  page.on('pageerror',e=>report.errors.push(e.message));
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('Starfall-Menagerie.html')}):(requests.push(r.request().url()),r.abort()));
  const run=makeRun(137,['aurel'],{native:true});run.team=['aurel','brakk','emberhound','pyrehorn','syl','nyra'].map(id=>({...creature(id,5),equipment:[],relics:[]}));run.relics=[];run.teamCapacity=6;run.route=generateRoute(run);
  const foes=['brom','grum','mireclaw','onyxscarab','rowan','moonjelly'].map(id=>({...creature(id,5),equipment:[],relics:[]}));
  await page.addInitScript(saved=>{sessionStorage.setItem('fang-feather-intro','seen');localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));},{version:7,run,node:run.route[0][0],foes,phase:'prep',profile:{owned:run.team.map(u=>u.id),tutorial:true,tuning:{spriteSize:size}}});
  await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto(url);await page.waitForFunction(()=>window.starfall);await page.locator('[data-action="battle"]').click();
  let minimum=Infinity,windups=0,recoveries=0,impacts=0,recoils=0;
  for(let i=0;i<100;i++){
   await page.clock.runFor(100);
   const sample=await page.evaluate(()=>{const b=starfall.state.battle,alive=b.units.filter(u=>u.hp>0&&!u.captured);let clearance=Infinity;for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++)clearance=Math.min(clearance,Math.hypot(alive[i].x-alive[j].x,alive[i].y-alive[j].y)-alive[i].radius-alive[j].radius);return {clearance,time:b.time,windups:alive.filter(u=>u.nativeAction&&!u.nativeAction.released).length,recoveries:alive.filter(u=>u.nativeAction?.released).length,impacts:b.effects.filter(e=>e.type==='impact'&&e.victimUid&&e.groundRadius>0).length,recoils:alive.filter(u=>u.nativeActor.hitTime>0||u.stagger>0||u.nativeKnockdown>0).length,metrics:b.metrics,finite:alive.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)),spread:new Set(alive.map(u=>Math.round(u.y/10))).size};});
   assert.ok(sample.finite);minimum=Math.min(minimum,sample.clearance);windups+=sample.windups;recoveries+=sample.recoveries;impacts+=sample.impacts;recoils+=sample.recoils;
   if(i===44||i===74){await page.locator('#battle-canvas').screenshot({path:`playtest-artifacts/weighted-combat-${offline?'offline':'source'}-${size}-${i}.png`});report.samples.push({build:offline?'offline':'source',size,...sample});}
  }
  assert.ok(minimum>-.2,`body penetration ${minimum} at ${size}%`);assert.ok(windups>0&&recoveries>0&&impacts>0&&recoils>0,JSON.stringify({windups,recoveries,impacts,recoils}));
  const metrics=await page.evaluate(()=>starfall.state.battle.metrics);assert.ok(metrics.bladeContacts>0);assert.ok(metrics.physicalHits>0);
  if(offline)assert.deepEqual(requests,[]);
  report.checks.push({build:offline?'offline':'source',size,minimumClearance:minimum,windups,recoveries,impacts,recoils,bladeContacts:metrics.bladeContacts,dodges:metrics.dodges,whiffs:metrics.whiffs});await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({checks:report.checks,errors:report.errors},null,2));
}finally{fs.writeFileSync('playtest-artifacts/combat-spacing-browser.json',JSON.stringify(report,null,2));await browser.close();}
