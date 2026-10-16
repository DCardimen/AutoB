import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,Battle,captureChance} from '../game.js';
import {nativeBodyHeight} from '../native-combat.js';
import {arenaCamera} from '../arena-camera.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3020',out='playtest-artifacts/equipment-capture';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report={checks:[],errors:[]};
async function fit(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
try{
 // Every team selection retains its actual image/canvas/backdrop and focus.
 for(const offline of (process.env.SOURCE_ONLY?[false]:[false,true])){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('fang-feather-intro','seen'));
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
  await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.locator('[data-starter="aurel"]').waitFor();await page.waitForTimeout(500);
  await page.evaluate(()=>window.savedNodes=[document.querySelector('.modal-backdrop'),document.querySelector('.modal'),document.querySelector('[data-starter="brakk"] canvas'),document.querySelector('.team-select>.background-motion')]);
  for(const id of ['aurel','aurel','brakk','brakk']){await page.locator(`[data-starter="${id}"]`).click();assert.ok(await page.evaluate(()=>savedNodes.every((el,i)=>el===[document.querySelector('.modal-backdrop'),document.querySelector('.modal'),document.querySelector('[data-starter="brakk"] canvas'),document.querySelector('.team-select>.background-motion')][i])));assert.equal(await page.locator('.modal-backdrop').evaluate(el=>getComputedStyle(el).opacity),'1');}
  report.checks.push(`${offline?'Offline':'Source'} team choices keep identical dialog, portraits, background and full opacity`);await context.close();
 }
 for(const offline of (process.env.SOURCE_ONLY?[false]:[false,true]))for(const retreat of (process.env.CHECK_MOBILE?[true]:[false,true])){
  console.log('Checking equipment/capture',offline?'offline':'source',retreat?'retreat':'victory');
  const width=retreat?390:1440,context=await browser.newContext({viewport:{width,height:1050},...(offline||retreat?{}:{recordVideo:{dir:out,size:{width:1440,height:1050}}})}),page=await context.newPage();page.setDefaultTimeout(30000);
  const requests=[];page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`)});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.relics=[];run.team.push({...creature('voltwing'),seat:2,balanceVersion:17,equipmentVersion:2,equipment:[]});run.route=generateRoute(run);
  run.gearInventory=[{uid:'fang',id:'jade-fang'},{uid:'spear',id:'thorn-halberd'},{uid:'ring',id:'ruby-vigor-ring'},{uid:'new-armor',id:'bramble-coat',quality:1.12},{uid:'bow',id:'briar-longbow'}];
  const node=run.route[0][0],foes=[{...creature('nyra',7),equipmentVersion:2,balanceVersion:17,equipment:['prism-focus'],equipmentQuality:.7,equipmentRolls:[{quality:1.1,rarity:'Rare'}]}, {...creature('syl',5),equipmentVersion:2,balanceVersion:17,equipment:[]}];
  const saved={version:7,run,node,foes,phase:'prep',profile:{owned:['aurel','brakk','voltwing','nyra'],tutorial:true}};
  await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},saved);
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
  await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.waitForFunction(()=>window.starfall);await page.locator('.arena-dock').waitFor();
  if(process.env.CHECK_MOBILE){console.log(await page.evaluate(()=>({scrollY,height:innerHeight,rects:['.header','#app','#view','.arena-grid','.arena-panel','.arena-control','.arena-dock'].map(s=>({s,rect:JSON.stringify(document.querySelector(s).getBoundingClientRect())}))})));await page.screenshot({path:out+'/mobile-before.png'});}await page.locator('.arena-dock [data-action="companions"]').click();await fit(page);
  assert.equal(await page.locator('.companion-equipment .equipment-slot').count(),5);
  assert.equal(await page.locator('[data-gear-equip="fang"]').getAttribute('aria-disabled'),'true');assert.ok(await page.locator('[data-gear-equip="fang"]').evaluate(el=>el.classList.contains('unusable-equipment')));
  const before=await page.evaluate(()=>JSON.stringify(starfall.state.run.team[0].equipment));await page.locator('[data-gear-equip="fang"]').click({force:true});assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run.team[0].equipment)),before);
  await page.locator('[data-gear-equip="spear"]').click();await page.locator('[data-gear-equip="ring"]').click();await page.locator('[data-gear-equip="new-armor"]').click();
  assert.ok(await page.evaluate(()=>['thorn-halberd','ruby-vigor-ring','bramble-coat'].every(id=>starfall.state.run.team[0].equipment.includes(id))));assert.ok(await page.evaluate(()=>starfall.state.run.gearInventory.some(g=>g.id==='reliquary-plate')));
  await page.locator('[data-party-select="2"]').click();assert.equal(await page.locator('[data-gear-equip="fang"]').getAttribute('aria-disabled'),'false');await page.locator('[data-gear-equip="fang"]').click();assert.ok(await page.evaluate(()=>starfall.state.run.team[2].equipment.includes('jade-fang')));assert.equal(await page.locator('.party-overview .quick-equipment button').count(),15);assert.ok(await page.locator('.quick-equipment .item-art,.equipment-slot .item-art,.inventory-equipment .item-art').evaluateAll(imgs=>imgs.every(img=>{const r=img.getBoundingClientRect(),b=img.closest('button').getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1})), 'equipment illustrations stay inside their respective cards');
  if(!offline)await page.screenshot({path:`${out}/equipment-${width}.png`,fullPage:true});await page.locator('.modal-close').click();
  // Target the actual painted canvas enemy using the uniform camera transform.
  const state=await page.evaluate(()=>({run:starfall.state.run,foes:starfall.state.foes,node:starfall.state.node}));const preview=new Battle(state.run,state.foes,node.seed,{visuals:false}),target=preview.units.find(u=>u.uid===foes[0].uid);
  const rect=await page.locator('#battle-canvas').boundingBox(),camera=arenaCamera(rect.width,rect.height);await page.evaluate(()=>window.canvasBefore=document.querySelector('#battle-canvas'));
  await page.mouse.click(rect.x+(target.x-camera.x)*camera.scale,rect.y+(target.y*.58+75-nativeBodyHeight(target)/2-camera.y)*camera.scale);
  assert.equal(await page.evaluate(()=>starfall.state.run.captureOrder.uid),foes[0].uid);assert.ok(await page.evaluate(()=>canvasBefore===document.querySelector('#battle-canvas')));
  await page.locator('#capture-tracker').waitFor();assert.equal(await page.locator('[data-capture-percent]').textContent(),'100.0%');
  assert.equal(await page.locator('#capture-tracker').evaluate(el=>!!el.closest('.arena-viewport')),false);
  await page.locator('[data-action="clear-capture"]').click();assert.ok(await page.locator('#capture-tracker').isHidden());
  if(width>900)await page.locator(`.opponent-thumb[data-foe-uid="${foes[0].uid}"]`).click();else await page.mouse.click(rect.x+(target.x-camera.x)*camera.scale,rect.y+(target.y*.58+75-nativeBodyHeight(target)/2-camera.y)*camera.scale);assert.ok(await page.locator('#capture-tracker').isVisible());
  if(!offline)await page.screenshot({path:`${out}/capture-plan-${width}.png`,fullPage:true});
  await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();
  await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.units){u.speed=0;u.attackTimer=9999;u.dodgeCooldown=9999;Object.values(u.cooldowns).forEach(cd=>cd.remaining=9999)}const t=b.units.find(u=>u.uid===b.capturePlan.uid);t.hp=t.maxHp*.4;});
  await page.waitForTimeout(150);assert.equal(await page.locator('[data-capture-percent]').textContent(),'40.0%');
  const current=await page.evaluate(()=>({run:starfall.state.run,target:starfall.state.battle.units.find(u=>u.uid===starfall.state.battle.capturePlan.uid)}));const expected=captureChance(current.run,{...current.target,capturePreparation:{healthFraction:.4,status:false,mode:'mercy',tool:'scout'}});assert.equal(await page.locator('[data-capture-chance]').textContent(),Math.round(expected*100)+'%');
  // Exercise the real damage queue in both directions without changing the capture.
  await page.evaluate(()=>{const b=starfall.state.battle,a=b.units[0],e=b.living(1)[1];b.damageUnit(a,13,e,null,0,'status');b.damageUnit(e,16,a,null,0,'status');});
  if(!offline&&!retreat)await page.screenshot({path:`${out}/damage-colors.png`,fullPage:true});
  const hpText=await page.locator('[data-capture-percent]').textContent();await page.waitForTimeout(200);assert.equal(await page.locator('[data-capture-percent]').textContent(),hpText);
  await page.evaluate(()=>{const b=starfall.state.battle,t=b.units.find(u=>u.uid===b.capturePlan.uid);t.hp=t.maxHp*.2;b.random=()=>0;b.attemptCapture();});await page.locator('[data-action="pause"]').click();await page.waitForTimeout(2700);
  assert.equal(await page.locator('[data-capture-status]').textContent(),'Captured! \u00b7 Attempt 1 / 3');
  await page.evaluate(retreat=>{const b=starfall.state.battle;for(const u of [...b.living(retreat?0:1)])b.damageUnit(u,1e6,b.living(retreat?1:0)[0],null,1,'status');b.step(.04);},retreat);
  await page.locator('.reward-screen').waitFor();await page.waitForTimeout(3200);
  assert.equal(await page.locator('.loot-drop[data-from-capture="true"]').count(),1);assert.match(await page.locator('.loot-drop[data-from-capture="true"]').textContent(),/FROM CAPTURE/);
  assert.equal(await page.evaluate(()=>[...starfall.state.run.team,...starfall.state.run.bench].find(c=>c.id==='nyra').equipment.length),0);
  if(!offline)await page.screenshot({path:`${out}/capture-rewards-${width}.png`,fullPage:true});
  const count=await page.evaluate(()=>starfall.state.run.gearInventory.length);await page.locator('[data-action="claim-loot"]').click();
  await page.waitForFunction(()=>document.querySelector('.reward-flight-card')&&document.querySelector('.loot-drop.card-departed'));
  assert.ok(await page.locator('.loot-drop.card-departed').first().evaluate(el=>getComputedStyle(el).visibility==='hidden'));assert.ok(await page.locator('.reward-flight-card').count()>0);
  await page.locator('.loot-cache.collected').waitFor();assert.equal(await page.locator('.loot-drop').count(),0);assert.equal(await page.evaluate(()=>starfall.state.run.gearInventory.length),count+1);
  assert.ok(await page.evaluate(()=>{const g=starfall.state.run.gearInventory.find(g=>g.fromCapture);return g.id==='prism-focus'&&Math.abs(g.quality-.77)<1e-9}));
  await page.reload();await page.waitForFunction(()=>window.starfall);await page.locator('.reward-screen').waitFor();assert.equal(await page.locator('.loot-drop').count(),0);assert.equal(await page.evaluate(()=>starfall.state.run.gearInventory.filter(g=>g.fromCapture).length),1);await fit(page);
  if(offline)assert.deepEqual([...new Set(requests)],[base+'/Starfall-Menagerie.html']);
  report.checks.push(`${offline?'Offline':'Source'} ${width}px ${retreat?'retreat':'victory'}: five slots, shade/compatibility, safe replacement, canvas & thumbnail targeting, live/pause odds, capture gear shown/claimed once, card disappears on departure and after reload`);
  const video=page.video();await context.close();if(video)await video.saveAs(out+'/equipment-capture-normal-speed.webm');
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));await browser.close();}
