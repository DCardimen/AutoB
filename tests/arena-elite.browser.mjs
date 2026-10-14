import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,encounter,BY_ID} from '../game.js';
import {eliteModifierForSeed,assignEliteModifier} from '../elite-modifiers.js';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',report={checks:[],errors:[]};fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1585,height:1050}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  const seed=Array.from({length:3000},(_,i)=>i).find(n=>eliteModifierForSeed(n).id==='bloodtempo-lowest-level'),run=makeRun(83,['aurel','brakk']);run.relics=[];run.route=generateRoute(run);const node=run.route[0][0];node.type='elite';node.seed=seed;run.encounterType='elite';
  const foes=[{...creature('brakk',1),nature:'Fleet',genes:{hp:1,atk:1.1,speed:1.2,cd:1}},{...creature('syl',5)}];assignEliteModifier(foes,seed,BY_ID);
  const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes,phase:'prep',profile:{owned:['aurel','brakk','syl'],runs:1,tutorial:true}};
  await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));},saved);
  await page.clock.install();await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);await page.clock.runFor(200);
  assert.ok(await page.locator('.arena-control').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'desktop frame includes its controls in the viewport');
  assert.match(await page.locator('.elite-encounter').textContent(),/Bloodtempo Underdog.*20% basic attack speed/);
  const frames=await page.locator('#battle-canvas').evaluate(c=>c.toDataURL());await page.clock.runFor(350);assert.notEqual(await page.locator('#battle-canvas').evaluate(c=>c.toDataURL()),frames,'idle and flame animate');
  assert.equal(await page.locator('.arena-frame #ally-orders select').count(),2);assert.equal(await page.locator('.arena-frame #enemy-overheads [data-head-uid]').count(),2);
  assert.ok(await page.evaluate(()=>{const frame=document.querySelector('.arena-frame').getBoundingClientRect(),canvas=document.querySelector('#battle-canvas').getBoundingClientRect();return [...document.querySelectorAll('.roster-commands')].every(el=>{const r=el.getBoundingClientRect();return r.left>=frame.left&&r.right<=frame.right&&r.bottom<=frame.bottom&&r.top>=canvas.bottom;});}));
  await page.locator('#enemy-overheads .roster-commands [data-enemy-inspect]').first().click();await page.locator('.modal').waitFor();assert.match(await page.locator('.modal').textContent(),/Bloodtempo Underdog/);await page.locator('[data-action="close"]').first().click();
  await page.locator('[data-view="map"]').first().click();assert.match(await page.locator('.elite-stage-preview').textContent(),/20% basic attack speed to the lowest-level opponent/);
  assert.match(await page.locator(`[data-field-node="${node.id}"]`).getAttribute('title'),/20% basic attack speed/);
  await page.locator('[data-field-scout]').click();assert.match(await page.locator('.modal .elite-stage-preview').textContent(),/20% basic attack speed/);await page.locator('[data-action="close"]').first().click();
  if(!offline)await page.locator('.encounter-sheet').screenshot({path:'playtest-artifacts/arena-elite-stage.png'});
  await page.locator('[data-view="arena"]').first().click();
  if(!offline){await page.mouse.move(0,0);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'playtest-artifacts/arena-ui-desktop.png',fullPage:false});}
  await page.locator(`[data-enemy-capture="${foes[0].uid}"]`).click();await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();
  assert.equal(await page.locator('#live-roster [data-live-unit]').count(),4);assert.equal(await page.locator('#live-roster [data-roster-panel="1"] .roster-commands [data-enemy-inspect]').count(),2);
  await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.units){u.speed=0;u.attackTimer=9999;u.dodgeCooldown=9999;Object.values(u.cooldowns).forEach(cd=>cd.remaining=9999);}const t=b.living(1)[0];t.hp=t.maxHp*.2;b.random=()=>0;b.attemptCapture();});
  await page.locator('[data-action="pause"]').click();await page.clock.runFor(2700);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')).profile.eliteCaptures.length),1);
  await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,100000,b.living(0)[0],null,1,'status');b.step(.04);});await page.clock.runFor(2400);
  assert.equal(await page.evaluate(()=>starfall.state.phase),'reward');assert.equal(await page.evaluate(()=>starfall.state.run.team.concat(starfall.state.run.bench).find(c=>c.captureSourceUid).eliteModifier),'bloodtempo-lowest-level');
  await page.reload();await page.waitForFunction(()=>window.starfall);await page.clock.runFor(200);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')).profile.eliteCaptures.length),1);
  if(await page.locator('.modal-close').count())await page.locator('.modal-close').first().click();
  assert.ok(await page.locator('#new-run').isVisible());
  await page.locator('[data-view="collection"]').first().click();assert.equal(await page.locator('[data-hunted-individual]').count(),1);
  await page.locator('[data-hunted-individual]').click();await page.locator('[data-elite-starter="brakk"]').selectOption(foes[0].uid);await page.locator('[data-action="confirm-run"]').click();await page.clock.runFor(200);
  const inherited=await page.evaluate(()=>starfall.state.run.team.find(c=>c.id==='brakk'));assert.equal(inherited.eliteModifier,'bloodtempo-lowest-level');assert.equal(inherited.eliteOriginUid,foes[0].uid);assert.equal(inherited.nature,'Fleet');assert.equal(inherited.genes.speed,1.2);assert.equal(inherited.level,1);
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(4500);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(!offline)await page.locator('.arena-panel').screenshot({path:'playtest-artifacts/arena-ui-mobile.png'});
  report.checks.push(`${offline?'Offline':'Source'}: in-frame controls, inspection, visible stage mutation, animated flames/idles, combat capture, permanent individual archive, reload idempotence, next-run choice and mobile layout`);await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/arena-elite-browser.json',JSON.stringify(report,null,2));await browser.close();}
