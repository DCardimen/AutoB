import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,encounter} from '../game.js';

const out='playtest-artifacts';fs.mkdirSync(out,{recursive:true});
const executablePath=process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true});
const report={checks:[],errors:[]};
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
async function openFixture({mobile=false,phase='prep',pact=false,offline=false}={}){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1050}});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  const run=makeRun(61,['aurel','brakk'],{chaosCleared:3});run.route=generateRoute(run);run.relics=pact?['sovereigns-seat']:['metronome-soul','lung-of-the-storm'];
  run.team[1].equipment=['tempo-rapier','rift-sandals'];run.gearInventory=[{uid:'new-wand',id:'clockwork-wand'}];
  const node=run.route[0][0],foes=encounter(run,'battle',node.seed);run.encounterType='battle';
  await page.addInitScript(({run,node,foes,phase})=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify({version:7,run,node,foes,phase,profile:{owned:['aurel','brakk','nyra','solara'],chaosCleared:3,chaosUnlocked:4,runs:1,tutorial:true}}));},{run:JSON.parse(JSON.stringify(run)),node:phase==='map'?null:node,foes:phase==='map'?[]:foes,phase});
  await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));
  await page.waitForFunction(()=>window.starfall);return {page,context};
}

try{
  const {page,context}=await openFixture();
  await page.locator('[data-creature="0"]').click();
  await page.locator('.stat-grid').waitFor();
  assert.match(await page.locator('.stat-grid').textContent(),/BASIC ATTACK SPEED.*STAMINA RECHARGE/);
  await page.waitForTimeout(400);await page.screenshot({path:out+'/chaos-character-stats.png'});
  await page.locator('[data-action="close"]').first().click();
  await page.locator('[data-stance="weakest"]').click();assert.equal(await page.evaluate(()=>starfall.state.run.stance),'weakest');
  assert.ok(await page.locator('.visible-gear-effect').count()>1);
  await page.locator('[data-action="battle"]').click();
  await page.waitForFunction(()=>starfall.state.battle);
  await page.evaluate(()=>{const b=starfall.state.battle;b.units.forEach(u=>{u.hp=u.maxHp=10000;});});
  await page.locator('[data-enemy-focus]').first().click();
  assert.ok(await page.evaluate(()=>starfall.state.battle.focusUid));
  await page.waitForTimeout(1000);
  assert.match(await page.locator('[data-vital-stamina]').first().textContent(),/STAMINA \d+\/100/);
  await page.screenshot({path:out+'/chaos-combat-desktop.png'});
  report.checks.push('Character stats, visible equipment effects, weakest-first, live stamina, and click-to-focus work in browser');
  // Freeze a real battle at capture milestones, with deterministic odds for repeatability.
  await page.evaluate(()=>{
    const b=starfall.state.battle,t=b.living(1)[0];b.random=()=>0;t.hp=t.maxHp*.2;
    b.capturePlan={uid:t.uid,threshold:.25,tool:'mythic',mode:'mercy'};b.captureSettled=false;
    b.attemptCapture();
  });
  assert.ok(await page.evaluate(()=>starfall.state.battle.captureResult.success));
  assert.equal(await page.evaluate(()=>starfall.state.battle.units.filter(u=>u.roundAlly&&u.side===0).length),1);
  assert.equal(await page.evaluate(()=>starfall.state.run.bench.length),0);
  await page.waitForTimeout(700);await page.screenshot({path:out+'/chaos-capture-lattice.png'});
  await page.waitForTimeout(1300);await page.screenshot({path:out+'/chaos-capture-allegiance.png'});
  report.checks.push('Epic capture changes allegiance immediately and defers persistent recruitment until round end');
  await context.close();

  const pact=await openFixture({pact:true});
  await pact.page.locator('[data-action="legendary-pact"]').click();
  await pact.page.locator('[data-pact-creature="solara"]').click();
  assert.equal(await pact.page.evaluate(()=>starfall.state.run.legendaryPact),'solara');
  assert.equal(await pact.page.evaluate(()=>starfall.state.run.bench.filter(c=>c.id==='solara').length),1);
  await pact.page.reload();assert.equal(await pact.page.evaluate(()=>starfall.state.run.legendaryPact),'solara');
  assert.equal(await pact.page.locator('[data-action="legendary-pact"]').count(),0);
  report.checks.push('Legendary choice UI persists one slot sacrifice and exactly one chosen companion after reload');
  await pact.context.close();

  const mobile=await openFixture({mobile:true});
  await mobile.page.locator('[data-creature="1"]').click();await mobile.page.waitForTimeout(400);await mobile.page.screenshot({path:out+'/chaos-character-mobile.png'});
  assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mobile.page.locator('[data-detail-tab="equipment"]').click();
  assert.ok(await mobile.page.locator('.equipment-panel').isVisible());
  await mobile.page.waitForTimeout(400);await mobile.page.screenshot({path:out+'/chaos-equipment-mobile.png'});
  await mobile.page.locator('[data-action="close"]').first().click();
  await mobile.page.locator('[data-view="collection"]').first().click();await mobile.page.locator('[data-action="new-run"]').first().click();
  assert.match(await mobile.page.locator('.starter-budget').textContent(),/\/ 3 companions/);
  assert.match(await mobile.page.locator('.starter-budget').textContent(),/\/ 6 starter points/);
  report.checks.push('390px character/equipment menus fit; Chaos 3 selection exposes three companions and six points');
  await mobile.context.close();

  const map=await openFixture({phase:'map'});
  await map.page.locator('[data-field-node]:not([disabled])').first().click();
  await map.page.waitForFunction(()=>starfall.state.phase==='prep'&&starfall.state.view==='arena');
  report.checks.push('Selected stage zooms and transitions to arena preparation');await map.context.close();

  const loot=await openFixture();
  await loot.page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('starfall-menagerie-v1'));data.phase='reward';data.upgradeChosen='gold';data.reward={gold:0,xp:0,time:10,win:true,loot:{key:'browser-loot',claimed:false,drops:[{id:'gold',kind:'gold',amount:25},{id:'gear',kind:'gear',gear:'tempo-rapier'}]}};localStorage.setItem('starfall-menagerie-v1',JSON.stringify(data));});
  await loot.page.reload();await loot.page.waitForFunction(()=>window.starfall);
  const before=await loot.page.evaluate(()=>({gold:starfall.state.run.gold,gear:starfall.state.run.gearInventory.length}));
  await loot.page.locator('[data-action="claim-loot"]').click();
  await loot.page.waitForSelector('.loot-flying-token');await loot.page.screenshot({path:out+'/chaos-loot-flight.png'});
  await loot.page.waitForFunction(()=>starfall.state.run.gold>160);
  assert.equal(await loot.page.evaluate(()=>starfall.state.run.gold),before.gold+25);
  assert.equal(await loot.page.evaluate(()=>starfall.state.run.gearInventory.length),before.gear+1);
  assert.ok(await loot.page.locator('[data-action="claim-loot"]').isDisabled());
  report.checks.push('Loot visibly flies into totals, then settles gold/equipment exactly once');await loot.context.close();

  const offline=await openFixture({offline:true});
  await offline.page.locator('[data-creature="0"]').click();
  assert.match(await offline.page.locator('.stat-grid').textContent(),/STAMINA RECHARGE/);
  report.checks.push('Rebuilt offline game includes the new gameplay and UI');await offline.context.close();
  assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{
  fs.writeFileSync(out+'/chaos-combat-browser.json',JSON.stringify(report,null,2));await browser.close();
}
