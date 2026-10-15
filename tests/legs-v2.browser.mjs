import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeRun,creature,generateRoute} from '../game.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report={checks:[],errors:[]};
fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),url=base+(offline?'/Starfall-Menagerie.html':'/index.html'),requests=[];
  page.on('pageerror',e=>report.errors.push(e.message));
  if(offline)await page.route('**/*',r=>r.request().url()===url?r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('Starfall-Menagerie.html')}):(requests.push(r.request().url()),r.abort()));
  const run=makeRun(72,['aurel']);run.team=[['frostursa',2],['pyrehorn',0],['flintback',0],['mireclaw',2],['stormdrake',2],['cogwalker',0]].map(([id,evolution])=>({...creature(id),evolution,evolutionPath:'wild',equipment:[]}));run.teamCapacity=6;run.route=generateRoute(run);const node=run.route[0][0];
  const foes=['runespider','orchimantis','onyxscarab','ironscolopendra','nightmaw','crownstag'].map(id=>({...creature(id),evolution:2,evolutionPath:'wild',equipment:[]}));
  await page.addInitScript(saved=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved)),{version:7,run,node,foes,phase:'prep',profile:{owned:run.team.map(c=>c.id),tutorial:true,tuning:{spriteSize:250}}});
  await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto(url);await page.waitForFunction(()=>window.starfall);await page.locator('[data-action="battle"]').click();
  for(const strideLength of [50,150,100]){
   await page.locator('#settings').click();const slider=page.locator('[data-tuning="strideLength"]');await slider.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},strideLength);
   assert.equal(await page.locator('[data-tuning-value="strideLength"]').textContent(),strideLength+'%');
   assert.ok(await page.evaluate(value=>starfall.state.battle.units.every(u=>u.nativeActor.strideLength===value),strideLength));
   await page.locator('.modal [data-action="close"]').last().click();await page.clock.runFor(700);
   assert.ok(await page.evaluate(()=>starfall.state.battle.units.every(u=>Number.isFinite(u.nativeActor.gait)&&Number.isFinite(u.x)&&Number.isFinite(u.y))));
  }
  await page.locator('[data-action="pause"]').click();if(!offline)await page.screenshot({path:'playtest-artifacts/legs-v2-live-arena.png'});
  const before=await page.locator('#battle-canvas').evaluate(c=>c.toDataURL());await page.locator('[data-action="pause"]').click();await page.clock.runFor(400);assert.notEqual(await page.locator('#battle-canvas').evaluate(c=>c.toDataURL()),before,'native combat animates with authored limb skinning');
  if(!offline){
   const audit=await page.evaluate(async()=>{const {spriteSample}=await import('/prototype-sprites.js'),{characterRig}=await import('/prototype-rig.js');return starfall.state.battle.units.filter(u=>u.hp>0).map(u=>{const a=u.nativeActor,s=spriteSample(a,starfall.state.battle.time),rig=characterRig(a.id,s.state,s.phase,s.stage,{...s,stride:a.stride});return {id:u.id,clamped:rig.legs.filter(l=>l.clamped).length};});});
   assert.ok(audit.every(u=>u.clamped===0),JSON.stringify(audit));
  }
  await page.locator('#settings').click();await page.locator('[data-action="reset-tuning"]').click();assert.equal(await page.locator('[data-tuning="strideLength"]').inputValue(),'100');
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  if(offline)assert.deepEqual(requests,[]);
  report.checks.push(`${offline?'Offline':'Source'}: 12 live creatures including evolved crab, drake and stag, both-team stride updates at 50/150/100%, animated combat, reset and phone layouts${offline?', zero external dependencies':''}`);await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/legs-v2-browser.json',JSON.stringify(report,null,2));await browser.close();}
