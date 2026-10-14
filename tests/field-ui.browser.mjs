import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateRoute,encounter,rng} from '../game.js';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const checks=[],errors=[];
fs.mkdirSync('playtest-artifacts',{recursive:true});
for(const offline of [false,true]){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const external=[];
 if(offline){const body=fs.readFileSync('Starfall-Menagerie.html');await page.route('**/*',r=>r.request().url()===base+'/offline-field'?r.fulfill({contentType:'text/html',body}):(external.push(r.request().url()),r.abort()));}
 await page.goto(offline?base+'/offline-field':base);await page.waitForFunction(()=>window.starfall?.state?.run);
 await page.evaluate(()=>{const s=starfall.state;const saved=JSON.parse(localStorage.getItem('starfall-menagerie-v1'));saved.profile.tutorial=true;saved.run.team.forEach(c=>{c.level=12;c.training=20});localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));});await page.reload();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width>700?1000:844});await page.waitForTimeout(200);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow at '+width);
  assert.equal(await page.locator('.field-world').count(),3);
  assert.ok((await page.locator('.field-world').first().getAttribute('style')).includes(offline?'blob:':'/public/ui/world'));
 }
 await page.setViewportSize({width:390,height:844});await page.locator('[data-creature="0"]').click();await page.locator('[data-detail-tab="equipment"]').click();await page.locator('[data-detail-tab="ai"]').click();await page.locator('[data-action="close"]').first().click();
 await page.locator('[data-planet-preview="2"]').click();assert.ok(await page.locator('.field-world-preview').isVisible());await page.locator('[data-action="close"]').first().click();
 await page.screenshot({path:'playtest-artifacts/field-'+(offline?'offline':'source')+'-mobile.png',fullPage:true});
 await page.clock.install();await page.locator('[data-speed="3"]').click();await page.locator('[data-action="battle"]').click();
 assert.equal(await page.locator('.field-journey').getAttribute('data-field-phase'),'battle');
 await page.locator('[data-action="pause"]').click();const pausedTime=await page.evaluate(()=>starfall.state.battle.time);await page.clock.runFor(2000);assert.equal(await page.evaluate(()=>starfall.state.battle.time),pausedTime);await page.locator('[data-action="pause"]').click();
 for(let i=0;i<100;i++){if(await page.evaluate(()=>starfall.state.phase!=='battle'))break;await page.clock.runFor(1000);}
 assert.equal(await page.evaluate(()=>starfall.state.phase),'reward');await page.clock.runFor(3000);
 if(!await page.locator('[data-upgrade]').count())await page.locator('[data-action="reward"]').click();
 await page.locator('[data-upgrade]').first().click();
 const loot=page.locator('[data-action="claim-loot"]');if(await loot.count())await loot.click();
 await page.locator('[data-action="continue"]').click();
 assert.equal(await page.evaluate(()=>starfall.state.phase),'map');
 assert.ok(await page.locator('.biome-route').evaluate(el=>getComputedStyle(el).backgroundImage.includes('world-0')||getComputedStyle(el).backgroundImage.includes('blob:')));
 await page.screenshot({path:'playtest-artifacts/field-'+(offline?'offline':'source')+'-route.png',fullPage:true});
 const available=page.locator('.route-node.available[data-node]');assert.ok(await available.count());
 await available.first().click();assert.ok(['prep','shop','event','rest'].includes(await page.evaluate(()=>starfall.state.phase)));
 if(await page.locator('.modal-close').count())await page.locator('.modal-close').first().click();
 await page.reload();assert.ok(await page.locator('.field-world.current').isVisible());

 for(const planet of [1,2]){
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')));
  saved.run.planet=planet;saved.run.depth=0;saved.run.complete=false;saved.run.path=[];saved.run.random=rng(saved.run.seed+planet*771);
  saved.run.route=generateRoute(saved.run);saved.node=saved.run.route[0][0];saved.foes=encounter(saved.run,saved.node.type,saved.node.seed);saved.phase='prep';saved.committed=false;delete saved.reward;delete saved.run.random;
  await page.evaluate(s=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(s)),saved);await page.reload();
  assert.equal(await page.locator('.field-world.current').getAttribute('data-planet-preview'),String(planet));
  await page.locator('[data-view="map"]').click();
  assert.ok(await page.locator('.biome-route').evaluate((el,p)=>getComputedStyle(el).backgroundImage.includes('world-'+p)||getComputedStyle(el).backgroundImage.includes('blob:'),planet));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'playtest-artifacts/field-'+(offline?'offline':'source')+'-world-'+planet+'.png',fullPage:true});
 }


 for(const phase of ['shop','event','rest']){
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')));
  saved.phase=phase;saved.node={...saved.node,type:phase,event:0};saved.foes=[];saved.shopStock=null;saved.committed=true;
  await page.evaluate(s=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(s)),saved);await page.reload();
  assert.ok(await page.locator('.modal').isVisible());
  assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'modal overflow: '+phase);
  await page.screenshot({path:'playtest-artifacts/field-'+(offline?'offline':'source')+'-'+phase+'.png',fullPage:true});
 }
 await page.locator('[data-action="close"]').first().click();await page.locator('[data-view="collection"]').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('#settings').click();assert.ok(await page.locator('.settings-modal').isVisible());
 await page.locator('[data-action="close"]').first().click();
 if(offline)assert.deepEqual(external,[]);
 checks.push((offline?'Offline':'Source')+': 320/390/768/1440px, creature tabs, world previews, battle/pause, reward/cache, route selection, save reload, all three world paintings, outpost/event/rest menus, menagerie/settings'+(offline?', zero external requests':''));
 await context.close();
}
assert.deepEqual(errors,[]);
await browser.close();
fs.writeFileSync('tests/reports/field-ui-v3.json',JSON.stringify({checks,errors},null,2)+'\n');
console.log(JSON.stringify({checks,errors},null,2));
