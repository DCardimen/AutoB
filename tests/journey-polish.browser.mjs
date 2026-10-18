import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {journeyFixture,winJourney} from './journey-fixture.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report={checks:[],errors:[]};
const fit=async(page,label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' fits viewport '+JSON.stringify(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed';}).map(e=>[e.className,e.getBoundingClientRect().right]).slice(0,20)}))));
try{
 for(const offline of [false,true]){
  const tag=offline?'offline':'source',{page,context,errors,requests}=await journeyFixture(browser,{base,offline});
  await page.waitForTimeout(400);await fit(page,tag);
  const arena=await page.locator('.arena-viewport').boundingBox();assert.ok(arena.width>1100,'broad stage matches reference composition');
  assert.equal(await page.locator('.arena-dock button').count(),5);assert.ok(!await page.locator('.formation-section').isVisible());assert.ok(!await page.locator('.tactical-toolbar').isVisible());
  assert.equal(await page.locator('.prep-roster-stamina').count(),3);assert.ok(await page.locator('.arena-roster-deck').evaluate(el=>innerWidth>=1101?el.closest('.side-column')&&el.getBoundingClientRect().bottom<=innerHeight+1:el.getBoundingClientRect().bottom<=document.querySelector('.arena-control').getBoundingClientRect().top+1),'complete roster stays within the sidebar or above the dock');
  const relic=page.locator('[data-relic-preview="venom-clasp"]');await relic.hover();await page.waitForTimeout(220);
  const panel=page.locator('.relic-effect-panel');assert.ok(await panel.isVisible());assert.ok((await panel.textContent()).includes('poison 1s'));assert.ok(await panel.locator('em').count());
  const box=await panel.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=1672);await panel.hover();await page.waitForTimeout(200);assert.ok(await panel.isVisible(),'hover panel stays open');await page.screenshot({path:out+`/journey-${tag}-relic.png`});await page.keyboard.press('Escape');assert.equal(await panel.count(),0);
  await relic.focus();assert.ok(await panel.isVisible(),'keyboard focus reveals effects');await page.keyboard.press('Escape');
  await page.locator('.arena-dock [data-action="companions"]').click();await page.locator('[data-party-select="0"]').click();await page.locator('.equipment-pouch').hover();await page.locator('.equipment-pouch[data-pouch-opened="true"]').waitFor();await page.locator('.modal [data-gear-equip="journey-venom"]').click();assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('venom-sabre')));await page.locator('.modal-close').click();
  await page.locator('.arena-dock [data-action="formation"]').click();await page.locator('.modal [data-stance="weakest"]').click();assert.equal(await page.evaluate(()=>starfall.state.run.stance),'weakest');assert.ok(await page.locator('.modal .tactical-toolbar').isVisible());await page.locator('.modal-close').click();
  await page.screenshot({path:out+`/journey-${tag}-arena.png`});
  const a=await page.locator('.ambient>.background-motion').evaluate(c=>c.toDataURL());await page.waitForTimeout(300);assert.notEqual(await page.locator('.ambient>.background-motion').evaluate(c=>c.toDataURL()),a,'background visibly animates');
  for(const width of [768,390,320]){await page.setViewportSize({width,height:844});await fit(page,tag+width);await page.screenshot({path:out+`/journey-${tag}-arena-${width}.png`});}
  await page.setViewportSize({width:1672,height:941});await page.locator('[data-action="battle"]').click();await page.waitForTimeout(400);assert.ok(await page.locator('.expedition-relic-bar').evaluate(el=>el.getBoundingClientRect().top>=64),'relics remain above live arena');
  await page.evaluate(()=>{const b=starfall.state.battle,u=b.living(0)[0],t=b.living(1)[0];b.damageUnit(t,30,u,u.loadout.auto,0,'hit',false,true);u.hp-=20;b.heal(u,14,u);});await page.waitForTimeout(100);await page.screenshot({path:out+`/journey-${tag}-damage.png`});
  await page.locator('[data-action="pause"]').click();const time=await page.evaluate(()=>starfall.state.battle.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>starfall.state.battle.time),time,'pause freezes feedback clock');await page.locator('[data-action="pause"]').click();
  await winJourney(page);await page.waitForFunction(()=>document.querySelector('.reward-flight-xp')?.style.opacity>0);
  const routes=await page.locator('.reward-flight').evaluateAll(tokens=>tokens.map(t=>({kind:t.className,source:t.dataset.source,destination:t.dataset.destination,uid:t.dataset.character})));
  assert.ok(routes.some(t=>t.kind.includes('gold')&&t.source==='chest'&&t.destination==='knapsack'));assert.equal(new Set(routes.filter(t=>t.kind.includes('xp')).map(t=>t.uid)).size,3);
  assert.ok(await page.locator('.loot-drop').first().evaluate(el=>el.getAnimations().length>0),'cards travel from chest');await page.screenshot({path:out+`/journey-${tag}-reveal.png`});
  await page.locator('.rewards-layout.rewards-revealed').waitFor();assert.ok(await page.locator('.rewards-landscape').evaluate((el,offline)=>getComputedStyle(el).backgroundImage.includes(offline?'blob:':'/public/ui/uploaded/rewards-backdrop'),offline),'full background resolves in source and offline');assert.equal(await page.locator('.growth-row.xp-arrived').count(),3);assert.equal(await page.locator('.knapsack-art .pack-frame').count(),12);assert.equal(await page.locator('.knapsack-art').getAttribute('data-frame'),'11');await page.screenshot({path:out+`/journey-${tag}-rewards.png`});
  await page.locator('[data-upgrade]').first().click();assert.ok(await page.locator('.rewards-layout').evaluate(el=>el.classList.contains('rewards-revealed')),'upgrade does not replay opening');
  await page.locator('[data-action="claim-loot"]').click();await page.waitForFunction(()=>document.querySelector('.reward-flight-card')?.style.opacity>0);
  assert.equal(await page.locator('.reward-flight-card[data-destination="knapsack"] .flying-reward-card').count(),3);await page.screenshot({path:out+`/journey-${tag}-collect.png`});
  const inventory=await page.evaluate(()=>JSON.stringify([starfall.state.run.gold,starfall.state.run.captureTools,starfall.state.run.gearInventory,starfall.state.run.relics]));
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')).reward.loot.claimed),'collection saves before flight');
  await page.reload();await page.waitForFunction(()=>window.starfall);assert.equal(await page.evaluate(()=>JSON.stringify([starfall.state.run.gold,starfall.state.run.captureTools,starfall.state.run.gearInventory,starfall.state.run.relics])),inventory,'reload during collection cannot lose or duplicate loot');
  assert.ok(await page.locator('[data-action="continue"]').isEnabled());
  for(const width of [768,390,320]){await page.setViewportSize({width,height:844});await fit(page,'reward'+width);assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.locator('.reward-screen').evaluate(el=>el.scrollTop=0);await page.screenshot({path:out+`/journey-${tag}-rewards-${width}.png`});}
  await page.locator('[data-action="continue"]').click();assert.equal(await page.evaluate(()=>starfall.state.phase),'map');
  await page.setViewportSize({width:1672,height:941});await page.locator('.biome-route>.background-motion:not(.stage-background-buffer)').waitFor();
  for(const world of [0,1,2]){await page.locator(`[data-planet-preview="${world}"]:visible`).first().click();await page.waitForTimeout(250);const motion=page.locator('.field-world-preview>.background-motion:not(.stage-background-buffer)'),sample=el=>el instanceof HTMLVideoElement?el.currentTime:el.toDataURL(),before=await motion.evaluate(sample);await page.waitForTimeout(300);assert.notEqual(await motion.evaluate(sample),before);await page.screenshot({path:out+`/journey-${tag}-world-${world}.png`});await page.locator('.modal-close').click();}

  if(offline)assert.ok(requests.every(url=>url.endsWith('/Starfall-Menagerie.html')),'offline makes only document navigations');
  await page.locator('.brand').click();await page.locator('#new-run').click();assert.ok(await page.locator('.team-select-layout').evaluate(el=>el.getBoundingClientRect().height>250),'night background never displaces team controls');await page.screenshot({path:out+`/journey-${tag}-team-select.png`});
  report.errors.push(...errors);report.checks.push(`${tag}: reference layout, relic hover/focus, equipment, 320/390/768px layouts, live combat/pause, chest/card/gold/EXP destinations, exactly-once save, three animated worlds`);await context.close();console.log(report.checks.at(-1));
 }
 for(const offline of [false,true]){
  const {page,context,errors}=await journeyFixture(browser,{base,offline,reduced:true,width:390,height:844});await page.locator('[data-relic-preview="fangs"]').tap();assert.ok(await page.locator('.relic-effect-panel').isVisible(),'touch reveals relic effect');await page.keyboard.press('Escape');
  await page.locator('[data-action="battle"]').click();await winJourney(page);await page.waitForTimeout(200);assert.equal(await page.locator('.reward-flight').count(),0);assert.ok(await page.locator('.rewards-layout.rewards-revealed').isVisible());await page.locator('[data-action="claim-loot"]').click();await page.locator('.loot-cache.collected').waitFor();await page.screenshot({path:out+`/journey-${offline?'offline':'source'}-gentle.png`});
  report.errors.push(...errors);report.checks.push(`${offline?'offline':'source'}: touch relics and reduced motion reward collection`);await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log('Journey polish browser checks passed');
}finally{fs.writeFileSync(out+'/journey-browser.json',JSON.stringify(report,null,2));await browser.close();}
