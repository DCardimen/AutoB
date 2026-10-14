import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),base=process.env.BASE_URL||'http://127.0.0.1:3000',report={checks:[],errors:[]};fs.mkdirSync('playtest-artifacts',{recursive:true});
const values={steeringAgility:175,cornerSlowdown:0,runStartDistance:75,sprintStartDistance:160,gaitBlendSpeed:200};
async function names(page){return page.locator('[data-tuning-example]').evaluateAll(els=>els.map(el=>el.dataset.previewId));}
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),requests=[];
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});page.on('request',r=>requests.push(r.url()));
  const run=makeRun(21,['aurel','brakk']);run.route=generateRoute(run);const node=run.route[0][0],saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['aurel','brakk'],tutorial:true,tuning:{turnSpeed:150}}};
  await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));},saved);
  await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);
  const original=await page.evaluate(()=>JSON.stringify(starfall.state.run));await page.locator('#settings').click();assert.equal(await page.locator('[data-tuning]').count(),18);
  assert.equal(await page.locator('.tuning-group').filter({has:page.locator('[data-tuning="steeringAgility"]')}).locator('[data-tuning]').count(),5);
  const first=await names(page),picture=await page.locator('#tuning-preview').evaluate(c=>c.toDataURL());await page.clock.runFor(1200);assert.notEqual(await page.locator('#tuning-preview').evaluate(c=>c.toDataURL()),picture);
  await page.clock.runFor(3700);assert.deepEqual(await names(page),first,'examples stay for the full five seconds');await page.clock.runFor(200);const second=await names(page);assert.ok(second.every((id,i)=>id!==first[i]));
  await page.clock.runFor(5000);assert.ok((await names(page)).every((id,i)=>id!==second[i]));assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run)),original,'examples never alter the expedition');
  await page.locator('[data-tuning="steeringAgility"]').click();await page.locator('[data-tuning="steeringAgility"]').press('ArrowRight');assert.notEqual(await page.evaluate(()=>starfall.state.profile.tuning.steeringAgility),100,'new sliders accept pointer and keyboard input');
  for(const [id,value]of Object.entries(values)){await page.locator(`[data-tuning="${id}"]`).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);assert.equal(await page.locator(`[data-tuning-value="${id}"]`).textContent(),value+'%');}
  if(!offline)await page.screenshot({path:'playtest-artifacts/settings-movement-desktop.png'});
  await page.locator('.modal [data-action="close"]').last().click();await page.reload();await page.waitForFunction(()=>window.starfall);
  for(const [id,value]of Object.entries(values))assert.equal(await page.evaluate(id=>starfall.state.profile.tuning[id],id),value);
  await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();const paused=await page.evaluate(()=>starfall.state.battle.time);
  await page.locator('#settings').click();const combatFirst=await names(page);await page.clock.runFor(5100);assert.ok((await names(page)).every((id,i)=>id!==combatFirst[i]));assert.equal(await page.evaluate(()=>starfall.state.battle.time),paused);
  assert.ok(await page.evaluate(()=>starfall.state.battle.units.every(u=>u.tuning.steeringAgility===175&&u.tuning.runStartDistance===75)));
  await page.locator('[data-action="reset-tuning"]').click();assert.ok(await page.evaluate(()=>Object.values(starfall.state.profile.tuning).every(v=>v===100)));assert.ok(await page.locator('[data-tuning]').evaluateAll(els=>els.every(el=>Number(el.value)===100)));
  await page.locator('.modal [data-action="close"]').last().click();await page.clock.runFor(200);assert.equal(await page.evaluate(()=>starfall.state.battle.time),paused,'closing preserves an already paused battle');
  await page.locator('[data-action="pause"]').click();await page.clock.runFor(200);assert.ok(await page.evaluate(()=>starfall.state.battle.time)>paused);
  await page.locator('#settings').click();const autoPaused=await page.evaluate(()=>starfall.state.battle.time);await page.clock.runFor(300);assert.equal(await page.evaluate(()=>starfall.state.battle.time),autoPaused);
  for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.clock.runFor(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));if(!offline&&width===390)await page.screenshot({path:'playtest-artifacts/settings-movement-mobile.png'});}
  await page.locator('.modal [data-action="close"]').last().click();await page.clock.runFor(200);assert.ok(await page.evaluate(()=>starfall.state.battle.time)>autoPaused,'closing resumes a previously running battle');
  if(offline)assert.deepEqual(requests.filter(url=>/^https?:/.test(url)),[base+'/Starfall-Menagerie.html',base+'/Starfall-Menagerie.html']);
  report.checks.push(`${offline?'Offline':'Source'}: 18 sliders, five movement patterns, repeated five-second creature swaps, animated examples, unchanged expedition, persistence/reset, both-team tuning, pause/resume and 320/390px layout`);await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/settings-movement-browser.json',JSON.stringify(report,null,2));await browser.close();}
