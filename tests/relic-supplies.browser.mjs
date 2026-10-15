import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';

const executablePath=process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts',report={checks:[],errors:[]};
fs.mkdirSync(out,{recursive:true});
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const run=makeRun(73,['aurel','brakk']);run.relics=['clockwork-orchard'];run.team.forEach(c=>c.equipment=[]);run.route=generateRoute(run);const node=run.route[0][0],foes=[creature('nyra'),creature('syl')];
  await page.addInitScript(({run,node,foes})=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify({version:7,run,node,foes,phase:'prep',profile:{owned:['aurel','brakk'],runs:1,tutorial:false}}));},{run:JSON.parse(JSON.stringify(run)),node,foes});
  await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);
  await page.locator('.arena-dock [data-action="companions"]').click();
  assert.equal(await page.locator('.modal .equipment-tray [data-gear-equip]').count(),3);
  assert.match(await page.locator('.relic-pack-link').textContent(),/0/);
  assert.ok(await page.locator('.modal .equipment-tray [data-gear-equip]').evaluateAll(els=>els.every(el=>el.querySelector('.visible-gear-effect')?.textContent.length>10)));
  assert.ok(await page.evaluate(()=>document.querySelector('.modal .equipment-tray').getBoundingClientRect().top>=document.querySelector('.modal .team-grid').getBoundingClientRect().bottom));
  assert.ok(await page.locator('.companion-equipment').isVisible(),'tutorial equipment is available in companion management');
  const equipped=await page.locator('.modal .equipment-tray [data-gear-equip]').first().getAttribute('data-gear-equip');
  await page.locator('.modal .equipment-tray [data-gear-equip]').first().click();
  assert.equal(await page.locator('.modal .equipment-tray [data-gear-equip]').count(),2);
  assert.ok(await page.evaluate(uid=>starfall.state.run.team[0].equipmentRolls.some(g=>g?.uid===uid),equipped));
  const saved=await page.evaluate(()=>JSON.stringify(starfall.state.run.gearInventory));await page.reload();await page.waitForFunction(()=>window.starfall);
  assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run.gearInventory)),saved);
  await page.locator('[data-action="battle"]').click();await page.locator('[data-live-unit]').first().waitFor();await page.locator('[data-action="pause"]').click();
  for(const [time,damage,healing,actions]of [[0,'1.00','0%','1.00'],[30,'1.00','0%','1.00'],[31,'1.04','1%','1.01'],[40,'1.40','10%','1.10'],[80,'3.00','50%','1.50'],[130,'3.00','100%','1.50']]){
   await page.evaluate(time=>starfall.state.battle.time=time,time);
   await page.waitForFunction(({damage,healing,actions})=>document.querySelector('#enrage-damage').textContent.startsWith(damage)&&document.querySelector('#enrage-healing').textContent.includes(healing)&&document.querySelector('#enrage-actions').textContent.startsWith(actions),{damage,healing,actions});
  }
  const before=await page.evaluate(()=>starfall.state.battle.time);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>starfall.state.battle.time),before);
  await page.evaluate(()=>{const b=starfall.state.battle,u=b.units[0],t=b.living(1)[0];b.time=40;t.hp=t.maxHp=100000;t.shield=0;t.rollTime=0;t.invulnerable=0;u.designState={};u.crit=0;b.random=()=>.99;for(let i=0;i<4;i++)b.hit(t,1,u,u.loadout.auto,1,true,'physical');});
  await page.waitForFunction(()=>document.querySelector('[data-live-unit]')?.textContent.includes('Seeds 1/3'),null,{timeout:5000}).catch(async error=>{console.log(await page.evaluate(()=>({state:starfall.state.battle.units[0].designState,relics:starfall.state.run.relics,text:document.querySelector('[data-live-unit]').textContent})));throw error;});
  if(!offline){await page.locator('#enrage-strip').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.locator('#enrage-strip').screenshot({path:out+'/relic-supplies-topper.png'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/relic-supplies-desktop.png',fullPage:true});}
  for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+'px enrage topper must fit');}
  if(!offline)await page.screenshot({path:out+'/relic-supplies-mobile.png',fullPage:true});
  report.checks.push(`${offline?'Offline':'Source'}: three visible Common starter equipment pieces, empty personal relic bag, working tutorial/equip, persisted seed, gradual enrage values and pause, live relic counter, 320/390/768px overflow checks`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(out+'/relic-supplies-browser.json',JSON.stringify(report,null,2));await browser.close();}
