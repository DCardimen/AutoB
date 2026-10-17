import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';

const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const report={checks:[],errors:[]};
fs.mkdirSync('playtest-artifacts',{recursive:true});
async function fixture(offline=false,fresh=false){
 const context=await browser.newContext({viewport:{width:1672,height:941}}),page=await context.newPage();
 if(offline)await context.route('**/*',route=>route.request().isNavigationRequest()?route.continue():route.abort());
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 if(!fresh){
  const run=makeRun(77,['aurel','brakk'],{chaosCleared:3});run.route=generateRoute(run);const node=run.route[0][0];run.encounterType=node.type;
  const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['cinderfox','mossguard','brookfin','voltwing','pyrehorn','bloomkin','aurel','brakk','nyra','syl','duskcap'],chaosCleared:3,chaosUnlocked:20,tutorial:true,bonds:{cinderfox:5},eliteCaptures:[{id:'brakk',sourceUid:'test-elite',eliteModifier:'bloodtempo-lowest-level',nature:'Fleet',genes:{hp:1,atk:1.1,speed:1.2,cd:1}}]}};
  await page.addInitScript(saved=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved)),saved);
 }
 await page.clock.install();await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);await page.clock.runFor(300);
 if(!fresh)await page.locator('#new-run').click();
 await page.locator('.team-select').waitFor();await page.clock.runFor(100);
 return {page,context};
}
try{
 const first=await fixture(false,true);
 assert.equal(await first.page.locator('.team-select').count(),1,'first visit opens team selection');
 assert.ok(await first.page.locator('[data-difficulty="chaos"]').isDisabled());
 assert.match(await first.page.locator('.starter-budget').textContent(),/2 \/ 2.*2 \/ 3/s);
 await first.page.locator('[data-starter="aurel"]').click();await first.page.locator('[data-starter="brakk"]').click();
 assert.ok(await first.page.locator('[data-action="confirm-run"]').isDisabled(),'empty party cannot begin');
 await first.page.locator('[data-starter="pyrehorn"]').click();await first.page.locator('[data-starter="bloomkin"]').click();
 assert.equal(await first.page.locator('[data-starter="bloomkin"]').getAttribute('aria-pressed'),'false','point budget rejects an unaffordable companion');
 await first.page.locator('[data-starter="cinderfox"]').click();
 await first.page.locator('[data-action="confirm-run"]').click();
 assert.equal(await first.page.locator('.team-select').count(),0);
 assert.equal(await first.page.evaluate(()=>starfall.state.run.team.length),2);
 await first.context.close();report.checks.push('Fresh visit: team selection, locked Chaos, two places / three points, begin expedition');
 for(const offline of [false,true]){
  const {page,context}=await fixture(offline);
  await page.locator('[data-difficulty="chaos"]').click();await page.locator('#chaos-tier').selectOption('4');
  assert.equal(await page.locator('.chaos-rules li').count(),4);
  assert.match(await page.locator('.starter-budget').textContent(),/2 \/ 3.*2 \/ 6/s);
  assert.match(await page.locator('[data-starter="cinderfox"]').textContent(),/Ember.*Fire.*attacks burn/s);
  assert.match(await page.locator('[data-starter="mossguard"]').textContent(),/Grove.*Grass.*regenerate/s);
  assert.match(await page.locator('[data-starter="brookfin"]').textContent(),/Tide.*Water.*18% max HP/s);
  assert.ok(await page.locator('.starter-card').first().evaluate(el=>{const card=getComputedStyle(el),stage=el.querySelector('.starter-portrait').getBoundingClientRect(),sprite=el.querySelector('canvas').getBoundingClientRect();return card.backgroundColor.startsWith('rgb(')&&Math.abs(stage.bottom-sprite.bottom-5)<1&&sprite.top-stage.top>20;}),'opaque card and sprite grounded below its headroom');
  assert.ok(await page.locator('.team-companion-tools').evaluate(el=>{const section=el.closest('.team-companions').getBoundingClientRect(),tools=el.getBoundingClientRect(),grid=document.querySelector('.companion-scroll').getBoundingClientRect();return tools.top>section.top&&tools.bottom<=grid.top;}),'filters sit at the top of the companion section');
  const backgrounds=new Set();
  for(const type of ['ember','grove','tide','storm','void']){
   await page.locator('#starter-type-filter').selectOption(type);await page.clock.runFor(150);
   assert.ok(await page.locator('.starter-choice').evaluateAll((els,type)=>els.length>0&&els.every(el=>el.dataset.element===type),type));
   backgrounds.add(await page.locator('.starter-card .starter-portrait').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage));
   if(!offline){const card=page.locator('.starter-choice').first();await card.scrollIntoViewIfNeeded();await page.clock.runFor(200);await page.screenshot({path:`playtest-artifacts/team-select-type-${type}.png`,clip:await card.boundingBox()});}
  }
  assert.equal(backgrounds.size,5,'every elemental type uses different supplied scenery');
  await page.locator('#starter-type-filter').selectOption('all');await page.locator('#starter-cost-filter').selectOption('2');
  assert.ok(await page.locator('.starter-card .starter-cost').evaluateAll(els=>els.length>0&&els.every(el=>el.textContent==='2 PT')));
  await page.locator('#starter-type-filter').selectOption('grove');assert.equal(await page.locator('.starter-card').count(),1,'cost and type filters combine');
  await page.locator('#starter-cost-filter').selectOption('6');assert.equal(await page.locator('.starter-card').count(),0);assert.ok(await page.locator('.starter-no-results').isVisible());
  await page.locator('.starter-no-results [data-action="starter-reset-filters"]').click();
  await page.locator('#starter-sort').selectOption('cost-desc');
  const descending=await page.locator('.starter-card .starter-cost').evaluateAll(els=>els.map(el=>Number(el.textContent.split(' ')[0])));assert.deepEqual(descending,[...descending].sort((a,b)=>b-a));
  await page.locator('#starter-sort').selectOption('cost');const ascending=await page.locator('.starter-card .starter-cost').evaluateAll(els=>els.map(el=>Number(el.textContent.split(' ')[0])));assert.deepEqual(ascending,[...ascending].sort((a,b)=>a-b));
  await page.locator('#starter-sort').selectOption('type');assert.equal(await page.locator('.starter-choice').first().getAttribute('data-element'),'ember');
  await page.locator('#starter-sort').selectOption('name');const names=await page.locator('.starter-card>strong').allTextContents();assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
  await page.locator('#starter-sort').selectOption('featured');assert.match(await page.locator('.starter-budget').textContent(),/2 \/ 3.*2 \/ 6/s);
  const idle=page.locator('.starter-card [data-starter-idle="cinderfox"]');
  const idleFrames=new Set();for(let i=0;i<24;i++){await page.clock.runFor(125);idleFrames.add(await idle.evaluate(c=>c.toDataURL()));}assert.ok(idleFrames.size>1,'front-facing idle animates through a full cycle');
  const prefix=offline?'team-select-offline':'team-select';
  await page.screenshot({path:`playtest-artifacts/${prefix}-desktop.png`});
  assert.ok(await page.locator('[data-action="confirm-run"]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'begin button fits desktop');
  assert.equal(await page.locator('.team-foliage').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  await page.locator('.team-field-notes summary').click();assert.match(await page.locator('.team-field-notes').textContent(),/level 1.*20 tiers.*3 starlight/s);
  await page.locator('#chaos-tier').selectOption('20');assert.equal(await page.locator('.chaos-rules li').count(),20);
  assert.ok(await page.locator('.chaos-rules ol').evaluate(el=>el.scrollHeight>el.clientHeight),'twenty rules scroll without growing the panel');
  await page.locator('.chaos-rules ol').evaluate(el=>el.scrollTop=el.scrollHeight);
  assert.ok(await page.locator('.chaos-rules li').last().isVisible());
  await page.locator('#chaos-tier').selectOption('4');
  await page.locator('[data-elite-starter="brakk"]').selectOption('test-elite');
  assert.match(await page.locator('.elite-starter-picker').textContent(),/20% basic attack speed/);
  assert.equal(await page.locator('[data-elite-starter="brakk"]').inputValue(),'test-elite');
  assert.equal(await page.locator('.team-field-notes').evaluate(el=>el.open),true,'notes remain open across changes');
  await page.locator('[data-starter="cinderfox"]').click();
  assert.equal(await page.locator('[data-starter="mossguard"]').getAttribute('aria-pressed'),'false','fourth companion rejected');
  await page.locator('[data-starter="mossguard"]').click();assert.equal(await page.locator('[data-starter="mossguard"]').getAttribute('aria-pressed'),'false');
  await page.locator('[data-party-remove="aurel"]').click();await page.locator('[data-starter="pyrehorn"]').click();
  assert.match(await page.locator('.team-synergy-preview').textContent(),/Ember 3 \/ 4.*ACTIVE/s);
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(300);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile has no horizontal overflow');
  await page.locator('.challenge-scroll').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:`playtest-artifacts/${prefix}-mobile.png`});
  await page.locator('[data-action="confirm-run"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:`playtest-artifacts/${prefix}-mobile-party.png`});
  await page.locator('[data-action="confirm-run"]').click();await page.clock.runFor(300);
  const inherited=await page.evaluate(()=>starfall.state.run.team.find(c=>c.id==='brakk'));
  assert.equal(inherited.eliteModifier,'bloodtempo-lowest-level');assert.equal(inherited.eliteOriginUid,'test-elite');assert.equal(inherited.level,1);assert.equal(inherited.genes.speed,1.2);
  assert.equal(await page.evaluate(()=>starfall.state.run.chaos),4);
  if(await page.locator('[data-action="skip-opening-relic"]').count())await page.locator('[data-action="skip-opening-relic"]').click();
  await page.locator('[data-action="battle"]').click();await page.clock.runFor(2200);
  assert.equal(await page.evaluate(()=>starfall.state.phase),'battle');
  assert.ok(await page.evaluate(()=>starfall.state.battle.units.some(c=>c.id==='brakk'&&c.side===0)));
  report.checks.push(`${offline?'Offline':'Source'}: five opaque elemental backgrounds, grounded front idle, section-top cost/type filters, combined filters/empty state, cost/type/name sorting, category bonuses, party limits/removal, active synergy, 20 scrollable Chaos rules, preserved notes, elite selection and inherited bonus, desktop/mobile, live combat`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/team-select-browser.json',JSON.stringify(report,null,2));await browser.close();}
