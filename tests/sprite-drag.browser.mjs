import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3022',out='playtest-artifacts/sprite-drag';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={checks:[],errors:[]};
async function drag(page,source,target,inspect){
 const pouch=source.locator("xpath=ancestor::*[@data-pack-kind]");if(await pouch.count()&&await pouch.getAttribute("data-pouch-opened")==="false"){await pouch.hover();await page.waitForTimeout(1700);}
 await source.scrollIntoViewIfNeeded();const s=await source.boundingBox();await page.mouse.move(s.x+s.width/2,s.y+s.height/2);await page.mouse.down();await page.mouse.move(s.x+s.width/2+12,s.y+s.height/2-8,{steps:3});
 await page.locator('.loadout-sprite-ghost').waitFor();assert.equal(await page.locator('.loadout-sprite-ghost img,.loadout-sprite-ghost canvas').count(),1,'drag only the sprite');
 if(inspect)await inspect();await target.scrollIntoViewIfNeeded();const t=await target.boundingBox();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:8});await page.mouse.up();
}
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:offline?undefined:{dir:out,size:{width:1440,height:1000}}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.team.push({...creature('voltwing'),seat:2,balanceVersion:17,equipmentVersion:2,equipment:[]});run.bench=[{...creature('nyra'),balanceVersion:17,equipmentVersion:2,equipment:[]}];run.route=generateRoute(run);run.inventory=[{uid:'gem',id:'ward-stone'}];run.gearInventory=[{uid:'ring',id:'ruby-vigor-ring'},{uid:'fang',id:'jade-fang'}];
  await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes:[{...creature('syl'),balanceVersion:17,equipmentVersion:2,equipment:[]}],phase:'prep',profile:{owned:['aurel','brakk','voltwing','nyra'],tutorial:true}});
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.locator('.arena-dock').waitFor();
  await page.waitForTimeout(700);if(!offline)await page.screenshot({path:out+'/arena-framing.png'});
  await page.locator('.arena-dock [data-action="companions"]').click();
  await page.locator(".equipment-pouch").hover();await page.waitForTimeout(1700);
  const cancelledBefore=await page.evaluate(()=>JSON.stringify(starfall.state.run)),cancelSource=page.locator('[data-gear-equip="ring"]');await cancelSource.scrollIntoViewIfNeeded();const cb=await cancelSource.boundingBox();await page.mouse.move(cb.x+cb.width/2,cb.y+cb.height/2);await page.mouse.down();await page.mouse.move(cb.x+cb.width/2+12,cb.y+cb.height/2,{steps:3});await page.locator('.loadout-sprite-ghost').waitFor();await page.keyboard.press('Escape');await page.waitForTimeout(550);await page.mouse.up();assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run)),cancelledBefore);assert.equal(await page.locator('.loadout-sprite-ghost').count(),0);assert.ok(await page.locator('.modal').isVisible());
  await drag(page,page.locator('[data-gear-equip="ring"]'),page.locator('.companion-equipment .equipment-slot[data-gear-type="Ring"]'),async()=>{
   assert.ok(await page.locator('.companion-equipment [data-gear-type="Ring"]').evaluate(el=>el.classList.contains('loadout-compatible')));
   assert.ok(await page.locator('.companion-equipment [data-gear-type="Weapon"]').evaluate(el=>el.classList.contains('loadout-incompatible')));
   if(!offline)await page.screenshot({path:out+'/ring-grab.png'});
  });
  assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('ruby-vigor-ring')));await page.locator('.loadout-sprite-ghost.settling').waitFor();
  if(!offline)await page.screenshot({path:out+'/ring-falling.png'});await page.waitForTimeout(600);assert.equal(await page.locator('.loadout-sprite-ghost').count(),0);
  const before=await page.evaluate(()=>JSON.stringify(starfall.state.run));
  await drag(page,page.locator('[data-gear-equip="fang"]'),page.locator('.companion-equipment [data-gear-type="Weapon"]'),async()=>{
   assert.ok(await page.locator('.party-overview [data-loadout-drop="2"][data-gear-type="Weapon"]').evaluate(el=>el.classList.contains('loadout-compatible')));
   assert.ok(await page.locator('.companion-equipment [data-gear-type="Weapon"]').evaluate(el=>el.classList.contains('loadout-incompatible')));
  });assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run)),before);await page.waitForTimeout(300);
  await drag(page,page.locator('[data-gear-equip="fang"]'),page.locator('.party-overview [data-loadout-drop="2"][data-gear-type="Weapon"]'));
  assert.ok(await page.evaluate(()=>starfall.state.run.team[2].equipment.includes('jade-fang')));await page.waitForTimeout(600);
  const first=await page.evaluate(()=>starfall.state.run.team[0].uid);
  await drag(page,page.locator('[data-party-select="0"]'),page.locator('[data-party-select="1"]'));
  assert.equal(await page.evaluate(()=>starfall.state.run.team[1].uid),first);await page.waitForTimeout(600);
  await drag(page,page.locator('.reserve-card').first(),page.locator('[data-party-select="0"]'));
  assert.equal(await page.evaluate(()=>starfall.state.run.team[0].id),'nyra');await page.waitForTimeout(600);
  assert.equal(await page.locator('.loadout-compatible,.loadout-target,.drop-art-pending').count(),0);
  if(!offline)await page.screenshot({path:out+'/completed-loadouts.png'});
  await page.locator('[data-action="inspect-selected"]').click();await page.locator('[data-detail-tab="equipment"]').click();
  await drag(page,page.locator('[data-equip="gem"]'),page.locator('.relic-slot:not(.equipped)').first());
  assert.equal(await page.evaluate(()=>starfall.state.run.team[0].relics[0].uid),'gem');await page.waitForTimeout(600);
  assert.equal(await page.locator('.modal-close').count(),1,'drop refresh retains close icon and footer');await page.locator('.modal [data-action="close"]').last().click();await page.locator('.arena-dock [data-action="companions"]').click();
  await page.setViewportSize({width:390,height:844});await page.locator('[data-party-select="1"]').click();
  const source=page.locator('.party-overview [data-loadout-drop="1"][data-gear-type="Ring"]');await source.scrollIntoViewIfNeeded();const sb=await source.boundingBox(),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sb.x+sb.width/2,y:sb.y+sb.height/2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sb.x+sb.width/2+15,y:sb.y+sb.height/2+12}]});
  await page.locator('.loadout-sprite-ghost').waitFor();const target=page.locator('.party-overview [data-loadout-drop="0"][data-gear-type="Ring"]');await target.scrollIntoViewIfNeeded();const tb=await target.boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tb.x+tb.width/2,y:tb.y+tb.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('ruby-vigor-ring')));await page.waitForTimeout(600);
  if(!offline)await page.screenshot({path:out+'/touch-loadout.png'});report.checks.push((offline?'Offline':'Source')+': personal relic sprite drop and real phone touch equipment transfer');
  await page.locator('.modal-close').click();
  for(const width of [390,320]){await page.setViewportSize({width,height:width===320?568:844});await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),'arena needs no page scrolling');if(!offline)await page.screenshot({path:out+'/arena-'+width+'.png'});}
  const video=page.video();await context.close();if(video)await video.saveAs(out+'/sprite-drag-normal-speed.webm');report.checks.push((offline?'Offline':'Source')+': sprite-only mouse drags, legal slots, invalid return, cross-companion fang equip, companion swap and reserve swap');
 }
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
