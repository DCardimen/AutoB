import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report={checks:[],errors:[]};
try{
 for(const offline of (process.env.SOURCE_ONLY? [false]:[false,true])){
  const tag=offline?'offline':'source',context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out+'/relic-start-video',size:{width:1440,height:1000}}}),page=await context.newPage(),requests=[];
  if(offline)await page.route('**/*',route=>{if(route.request().isNavigationRequest())return route.continue();if(/^https?:/.test(route.request().url())){requests.push(route.request().url());return route.abort();}return route.continue();});
  page.on('pageerror',e=>report.errors.push(tag+': '+e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>sessionStorage.setItem('fang-feather-intro','seen'));
  await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.waitForFunction(()=>window.starfall);
  await page.reload();await page.locator('[data-action="confirm-run"]').waitFor();assert.equal(await page.evaluate(()=>starfall.state.profile.lesserOpeningRelics),undefined,'unconfirmed team reload is not a reset');
  await page.locator('[data-action="confirm-run"]').click();await page.locator('[data-opening-relic]').first().waitFor();
  const offers=await page.evaluate(()=>starfall.state.run.openingRelic.choices);assert.equal(offers.length,2);assert.equal(await page.evaluate(()=>starfall.state.run.relics.length),0);
  await page.keyboard.press('Escape');assert.ok(await page.locator('.modal[data-kind="opening-relic"]').isVisible(),'explicit skip keeps a deliberate optional choice');
  await page.locator('.opening-relic-art').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.waitForTimeout(350);await page.screenshot({path:`${out}/relic-${tag}-opening.png`});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.screenshot({path:`${out}/relic-${tag}-opening-${width}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.setViewportSize({width:1440,height:1000});await page.reload();await page.locator('[data-opening-relic]').first().waitFor();assert.deepEqual(await page.evaluate(()=>starfall.state.run.openingRelic.choices),offers,'reload preserves offers');
  await page.locator('[data-opening-relic]').first().click();await page.locator(`[data-relic-received="${offers[0]}"]`).waitFor();await page.waitForTimeout(260);await page.screenshot({path:`${out}/relic-${tag}-flight.png`});
  assert.equal(await page.evaluate(()=>starfall.state.run.relics.length),1);await page.locator('.relic-receive-flight').waitFor({state:'detached'});await page.screenshot({path:`${out}/relic-${tag}-arrival.png`});
  await page.reload();await page.waitForFunction(()=>window.starfall);assert.equal(await page.locator('[data-opening-relic]').count(),0);assert.equal(await page.locator(`[data-relic-preview="${offers[0]}"]`).count(),1);
  await page.locator(`[data-relic-preview="${offers[0]}"]`).hover();assert.ok(await page.locator('.relic-effect-panel').isVisible());await page.keyboard.press('Escape');
  await page.evaluate(()=>{starfall.state.run.gearInventory=[{uid:'wrong-bow',id:'briar-longbow'},{uid:'wrong-sword',id:'venom-sabre'},{uid:'right-maul',id:'siege-maul'}];});
  await page.locator('.arena-dock [data-action="companions"]').click();await page.locator('[data-party-select="1"]').click();
  await page.locator('[data-gear-equip="wrong-sword"]').click();assert.ok(await page.evaluate(()=>starfall.state.run.gearInventory.some(g=>g.uid==='wrong-sword')));assert.ok(await page.locator('.gear-compatibility.incompatible').count());
  await page.locator('[data-gear-equip="right-maul"]').click();assert.ok(await page.evaluate(()=>starfall.state.run.team[1].equipment.includes('siege-maul')));await page.screenshot({path:`${out}/relic-${tag}-affinities.png`});await page.locator('.modal-close').click();
  await page.locator('[data-action="battle"]').click();await page.waitForFunction(()=>starfall.state.phase==='battle');await page.waitForTimeout(700);
  await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(0))b.damageUnit(u,1e6,b.living(1)[0],null,1,'status');b.step(.04);});await page.waitForFunction(()=>starfall.state.phase==='reward');
  assert.equal(await page.evaluate(()=>starfall.state.profile.lesserOpeningRelics),true,'real stage-one loss records penalty');
  await page.locator('.modal-close').click();await page.locator('#new-run').click();await page.locator('[data-action="confirm-run"]').click();await page.locator('[data-opening-relic]').first().waitFor();
  assert.ok(await page.evaluate(()=>starfall.state.run.openingRelic.lesser));await page.waitForTimeout(400);await page.screenshot({path:`${out}/relic-${tag}-lesser.png`});
  const lesser=await page.evaluate(()=>starfall.state.run.openingRelic.choices);await page.reload();await page.locator('[data-opening-relic]').first().waitFor();assert.deepEqual(await page.evaluate(()=>starfall.state.run.openingRelic.choices),lesser);
  await page.locator('[data-action="skip-opening-relic"]').click();assert.equal(await page.evaluate(()=>starfall.state.run.relics.length),0);await page.locator('[data-action="battle"]').click();await page.waitForFunction(()=>starfall.state.phase==='battle');
  await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,1e6,b.living(0)[0],null,1,'status');b.step(.04);});await page.waitForFunction(()=>starfall.state.phase==='reward');assert.equal(await page.evaluate(()=>starfall.state.profile.lesserOpeningRelics),true,'one win does not yet restore normal blessings');assert.equal(await page.locator('[data-upgrade^="boon:"]').count(),0,'no second opening relic after stage one');
  // Elite selection is optional too; reload must preserve a skipped upgrade.
  await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('starfall-menagerie-v1'));state.reward.relicChoices=['bloodglass-crown','venomous-diadem'];state.reward.loot.claimed=true;state.upgradeChosen=null;localStorage.setItem('starfall-menagerie-v1',JSON.stringify(state));});await page.reload();await page.locator('[data-upgrade="skip-relic"]').click();assert.ok(await page.locator('[data-action="continue"]').isEnabled());await page.reload();assert.ok(await page.locator('[data-action="continue"]').isEnabled());assert.equal(await page.evaluate(()=>starfall.state.run.relics.length),0);
  // Complete two more real battle outcomes; no first-world guardian is needed.
  for(const expectedWins of [2,3]){
   await page.evaluate(depth=>{const state=JSON.parse(localStorage.getItem('starfall-menagerie-v1'));state.phase='prep';state.run.depth=depth;state.node=state.run.route[depth].find(n=>n.type==='battle')||{...state.node,depth,type:'battle'};state.run.encounterType='battle';state.reward=null;state.upgradeChosen=null;state.committed=false;localStorage.setItem('starfall-menagerie-v1',JSON.stringify(state));},expectedWins-1);await page.reload();await page.waitForFunction(()=>window.starfall);await page.locator('[data-action="battle"]').click();
   await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,1e6,b.living(0)[0],null,1,'status');b.step(.04);});await page.waitForFunction(()=>starfall.state.phase==='reward');assert.equal(await page.evaluate(()=>starfall.state.run.wins),expectedWins);assert.equal(await page.evaluate(()=>starfall.state.profile.lesserOpeningRelics),expectedWins<3);
  }
  await page.locator('.modal-close').click();await page.locator('#new-run').click();await page.locator('[data-action="confirm-run"]').click();assert.equal(await page.evaluate(()=>starfall.state.run.openingRelic.lesser),false,'restart after three arena wins restores full offers before the first world ends');
  await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('starfall-menagerie-v1'));state.profile.reducedMotion=true;localStorage.setItem('starfall-menagerie-v1',JSON.stringify(state));});await page.reload();await page.locator('[data-opening-relic]').first().click();assert.equal(await page.locator('.relic-receive-flight').count(),0);assert.equal(await page.evaluate(()=>starfall.state.run.relics.length),1);
  if(offline)assert.deepEqual(requests,[]);report.checks.push(`${tag}: saved two-choice start; one grant and flight; 320/390 layouts; compatible equipment; real stage-one loss; persistent lesser offers; optional first and elite relics; reload; three-win reset recovery before first-world completion; reduced motion`);
  const video=page.video();await context.close();await video.saveAs(`public/relic-start-${tag}.webm`);
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(out+'/weapon-relic-browser.json',JSON.stringify(report,null,2));await browser.close();}
