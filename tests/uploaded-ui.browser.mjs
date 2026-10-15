import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,encounter} from '../game.js';

const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const report={checks:[],errors:[]};fs.mkdirSync('playtest-artifacts',{recursive:true});

async function fixture({offline=false,reduced=false,won=null}={}){
 const context=await browser.newContext({viewport:{width:1672,height:941},reducedMotion:reduced?'reduce':'no-preference'});
 const page=await context.newPage();page.setDefaultTimeout(60000);
 const requests=[];page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.team.push({...creature('voltwing',1),seat:2,balanceVersion:15,equipment:[],relics:[]});run.route=generateRoute(run);run.captureTools={scout:5,runic:2,astral:1,mythic:1};run.orbs=9;
 run.gearInventory=[{uid:'art-venom',id:'venom-sabre'},{uid:'art-boots',id:'windstep-boots'}];
 const node=run.route[0][0];node.type='elite';run.encounterType='elite';
 const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['aurel','brakk','voltwing'],tutorial:true,reducedMotion:reduced}};
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},saved);
 if(offline)await page.route('**/*',route=>route.request().isNavigationRequest()?route.continue():route.abort());
 await page.clock.install();await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);await page.clock.runFor(500);
 if(won!==null){await page.locator('[data-action="battle"]').click();await settle(page,won);}
 return {page,context,requests};
}
async function settle(page,won=true){
 await page.evaluate(won=>{const b=starfall.state.battle;for(const u of b.living(won?1:0))b.damageUnit(u,1e6,b.living(won?0:1)[0],null,1,'status');b.step(.04);},won);
 await page.clock.runFor(2500);assert.equal(await page.evaluate(()=>starfall.state.phase),'reward');await page.locator('.reward-screen').waitFor();
}
async function fit(page,width){
 await page.setViewportSize({width,height:844});await page.clock.runFor(150);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`page fits ${width}px`);
 assert.ok(await page.locator('.modal').evaluate(el=>el.getBoundingClientRect().width<=innerWidth+1),`dialog fits ${width}px`);
 assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`dialog content fits ${width}px: ${JSON.stringify(await page.locator('.modal').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,overflow:[...el.querySelectorAll('*')].map(e=>({cls:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth+1).slice(0,12)})))}`);
}
async function loaded(page){
 assert.ok(await page.locator('.modal').evaluate(async root=>{const images=[...root.querySelectorAll('img.uploaded-art')];await Promise.all(images.map(img=>img.decode()));return images.every(img=>img.naturalWidth>0);}));
}
try {
 for(const offline of [false,true]){
  console.log(offline?'Checking offline UI':'Checking source UI');
  const {page,context,requests}=await fixture({offline});
  assert.ok(await page.locator('.arena-control').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1));
  assert.equal(await page.locator('.arena-dock button').count(),5);
  const before=await page.locator('#battle-canvas').evaluate(c=>c.toDataURL());await page.clock.runFor(600);assert.notEqual(await page.locator('#battle-canvas').evaluate(c=>c.toDataURL()),before);
  await page.locator('.arena-dock [data-action="companions"]').click();await loaded(page);
  assert.equal(await page.locator('.party-overview [data-party-select]').count(),3);
  await page.locator('[data-party-select="1"]').click();
  await page.locator('.modal [data-gear-equip="art-venom"]').click();
  assert.ok(await page.evaluate(()=>starfall.state.run.team[1].equipment.includes('venom-sabre')));
  assert.equal(await page.locator('.modal[data-kind="companions"]').count(),1,'equip stays in companion management');
  await page.locator('.companion-equipment [data-gear-remove="1"]').click();
  assert.equal(await page.evaluate(()=>starfall.state.run.gearInventory.filter(g=>g.id==='venom-sabre').length),1);
  const returnedUid=await page.evaluate(()=>starfall.state.run.gearInventory.find(g=>g.id==='venom-sabre').uid);
  const from=page.locator(`.modal [data-gear-equip="${returnedUid}"]`),to=page.locator('[data-party-select="0"]');await from.dragTo(to);
  assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('venom-sabre')),'drag equips the recipient');
  await page.locator('.modal-close').click();
  console.log('Companion equipment checks passed');
  await page.locator('.arena-dock [data-action="capture-kit"]').click();
  assert.equal(await page.locator('.capture-tool-card').count(),4);await loaded(page);
  const uid=await page.evaluate(()=>starfall.state.foes[0].uid);
  await page.locator('#kit-capture-target').selectOption(uid);
  await page.locator('.modal [data-capture-method="runic"]').click();
  await page.locator('#kit-capture-threshold').selectOption('35');
  assert.deepEqual(await page.evaluate(()=>({uid:starfall.state.run.captureOrder.uid,tool:starfall.state.run.captureOrder.tool,threshold:starfall.state.run.captureOrder.threshold})),{uid,tool:'runic',threshold:.35});
  await page.locator('.modal [data-auto-capture]').check();assert.ok(await page.evaluate(()=>starfall.state.run.autoCaptureRetry));
  await page.locator('.modal-close').click();
  console.log('Capture planning checks passed');
  await page.locator('.arena-dock [data-action="intel"]').click();
  for(const tab of ['builds','log','rules','briefing']){await page.locator(`[data-intel-tab="${tab}"]`).click();assert.equal(await page.locator(`[data-intel-tab="${tab}"]`).getAttribute('aria-pressed'),'true');}
  for(const width of [768,390,320])await fit(page,width);
  await page.locator('.modal-close').click();await page.setViewportSize({width:1672,height:941});
  await page.locator('[data-action="battle"]').click();
  await page.clock.runFor(800);
  assert.equal(await page.locator('#live-roster [data-live-unit]').count(),6);
  await settle(page,true);await loaded(page);
  console.log('Combat and reward loading passed');
  assert.equal(await page.locator('.chest-frame').count(),12);
  assert.equal(await page.locator('.growth-row').count(),3);
  assert.ok(await page.locator('[data-action="continue"]').isDisabled());
  const drops=await page.locator('.loot-drop').count();assert.ok(drops>0);
  assert.equal(await page.locator('.loot-medallion img').count(),drops);
  await page.locator('[data-loot-inspect="0"]').click();assert.ok(await page.locator('.loot-detail img').isVisible());await page.locator('[data-action="return-rewards"]').click();
  await page.locator('.rewards-expedition [data-action="report"]').click();
  await page.locator('[data-recap-metric="healed"]').click();await page.locator('[data-recap-side="1"]').click();assert.ok(await page.locator('#battle-recap svg').count()>0);
  await page.locator('[data-action="return-rewards"]').click();
  await page.locator('[data-upgrade]').first().click();
  await page.locator('[data-action="claim-loot"]').click();await page.clock.runFor(1900);
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')).reward.loot.claimed));
  await page.locator('.loot-cache.collected').waitFor();
  assert.ok(await page.locator('[data-action="continue"]').isEnabled());
  const inventory=await page.evaluate(()=>JSON.stringify([starfall.state.run.gold,starfall.state.run.captureTools,starfall.state.run.gearInventory,starfall.state.run.relics]));
  await page.reload();await page.waitForFunction(()=>window.starfall);await page.clock.runFor(300);
  assert.equal(await page.evaluate(()=>JSON.stringify([starfall.state.run.gold,starfall.state.run.captureTools,starfall.state.run.gearInventory,starfall.state.run.relics])),inventory);
  assert.ok(await page.locator('[data-action="claim-loot"]').isDisabled());
  for(const width of [768,390,320]){await fit(page,width);await page.locator('.reward-screen').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`playtest-artifacts/uploaded-${offline?'offline':'source'}-rewards-${width}.png`,animations:'disabled'});await page.locator('.rewards-expedition .growth-row').first().scrollIntoViewIfNeeded();assert.ok(await page.locator('.rewards-expedition .growth-row').first().isVisible());}
  await page.locator('[data-action="continue"]').click();assert.equal(await page.evaluate(()=>starfall.state.phase),'map');
  if(offline)assert.deepEqual(requests,[base+'/Starfall-Menagerie.html',base+'/Starfall-Menagerie.html'],'offline requires only navigation requests');
  report.checks.push(`${offline?'Offline':'Source'}: responsive arena, animated idles, companion selection, equipment click/remove/drag, capture tool/target/threshold, auto retry, four intel tabs, live combat, chest/card/EXP art, inspection, performance chart, persistent single grant and journey continuation`);
  await context.close();
 }
 for(const won of [true,false]){
  const {page,context}=await fixture({reduced:true,won});
  assert.equal(await page.locator('.rewards-layout').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0,'reduced motion removes result animations');
  if(won)assert.equal(await page.locator('.frame-11').evaluate(el=>getComputedStyle(el).opacity),'1');
  else{assert.equal(await page.locator('.reward-upgrades').count(),0);assert.equal(await page.locator('[data-action="claim-loot"]').count(),0);assert.ok(await page.locator('.casualty-result').isVisible());assert.ok(await page.locator('[data-action="continue"]').isEnabled());}
  await fit(page,320);await page.screenshot({path:`playtest-artifacts/uploaded-${won?'gentle':'defeat'}-320.png`,animations:'disabled'});await context.close();
 }
 report.checks.push('Reduced-motion victory uses the open chest immediately; defeat shows the saved casualty without grants or upgrade prompts; both fit 320px');
 {
  const {page,context}=await fixture({won:true});await page.locator('[data-upgrade]').first().click();
  await page.locator('[data-action="claim-loot"]').click();
  const granted=await page.evaluate(()=>JSON.stringify([starfall.state.run.gold,starfall.state.run.captureTools,starfall.state.run.gearInventory,starfall.state.run.relics]));
  await page.reload();await page.waitForFunction(()=>window.starfall);await page.clock.runFor(250);
  assert.equal(await page.evaluate(()=>JSON.stringify([starfall.state.run.gold,starfall.state.run.captureTools,starfall.state.run.gearInventory,starfall.state.run.relics])),granted,'reload during the flight retains exactly the committed grant');
  assert.ok(await page.locator('[data-action="claim-loot"]').isDisabled());await context.close();
 }
 report.checks.push('Reload during collection retains the committed grant without duplication');
 for(const success of [true,false]){
  const {page,context}=await fixture({reduced:true});
  await page.locator('.arena-dock [data-action="capture-kit"]').click();await page.locator('#kit-capture-target').selectOption(await page.evaluate(()=>starfall.state.foes[0].uid));await page.locator('.modal-close').click();await page.locator('[data-action="battle"]').click();
  await page.evaluate(success=>{const b=starfall.state.battle;for(const u of b.units){u.speed=0;u.attackTimer=9999;u.dodgeCooldown=9999;Object.values(u.cooldowns).forEach(cd=>cd.remaining=9999);}const target=b.units.find(u=>u.uid===b.capturePlan.uid);target.hp=target.maxHp*.1;b.random=()=>success?0:.999;b.attemptCapture();},success);
  await page.clock.runFor(2800);await settle(page,true);
  assert.ok(await page.locator('.capture-outcome.'+(success?'success':'failed')).isVisible());
  await page.screenshot({path:`playtest-artifacts/uploaded-capture-${success?'success':'failed'}.png`,animations:'disabled'});await context.close();
 }
 report.checks.push('Real successful and failed lattice attempts produce the corresponding post-match art and outcome');
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/uploaded-ui-browser.json',JSON.stringify(report,null,2));await browser.close();}
