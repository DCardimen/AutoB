import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {makeRun,creature,generateRoute} from '../game.js';
import {CREATURE_GEAR} from '../creature-equipment.js';
import {AURA_STONES} from '../aura-stones.js';
const out='docs/evidence/compact-pouches';fs.mkdirSync(out,{recursive:true});
const offlineOnly=process.argv.includes('--offline-only');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report=offlineOnly?JSON.parse(fs.readFileSync(out+'/browser.json','utf8')).filter(r=>!r.offline):[];
async function point(page,locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};}
async function begin(page,source){const p=await point(page,source);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+14,p.y-8,{steps:3});await page.locator('.loadout-sprite-ghost:not(.settling)').waitFor();}
async function drop(page,target){const p=await point(page,target);await page.mouse.move(p.x,p.y,{steps:6});await page.mouse.up();}
async function clean(page){await page.waitForTimeout(800);assert.equal(await page.locator('.loadout-sprite-ghost,.drop-art-pending,.dragging,.loadout-target,.loadout-compatible,.loadout-incompatible').count(),0);}
try{for(const offline of offlineOnly?[true]:[false,true])for(const width of [1440,390]){
 const mobile=width===390,context=await browser.newContext({viewport:{width,height:900},hasTouch:mobile,recordVideo:!offline&&!mobile?{dir:'playtest-artifacts/compact-pouches/videos',size:{width:1440,height:900}}:undefined}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 const run=makeRun(83,['aurel','brakk']);run.team=['moonjelly','eira','voltwing'].map((id,i)=>({...creature(id),seat:i,balanceVersion:17,equipmentVersion:2,equipment:[],relics:i?[]:[{uid:'worn',id:'aura-wellspring',tier:2}]}));run.teamCapacity=3;run.route=generateRoute(run);run.expeditionStarted=true;run.openingRelic={decision:'test'};
 run.gearInventory=[{uid:'ring',id:'ruby-vigor-ring',quality:1.17,rarity:'Epic',fromCapture:true},...CREATURE_GEAR.slice(0,25).filter(g=>g.id!=='ruby-vigor-ring').map((g,i)=>({uid:'gear'+i,id:g.id}))];
 run.inventory=AURA_STONES.slice(0,22).filter(g=>g.id!=='aura-wellspring').map((g,i)=>({uid:'stone'+i,id:g.id,tier:i%4+1}));
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');document.addEventListener('pointerdown',e=>window.testPointer=e.pointerId);},{version:7,run,node:run.route[0][0],foes:[{...creature('brakk',10),balanceVersion:17,equipmentVersion:2,genes:{hp:30,atk:1,speed:1}}],phase:'prep',profile:{owned:run.team.map(c=>c.id),tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()&&r.request().url().startsWith('file:')?r.continue():r.abort());
 await page.goto(offline?pathToFileURL(path.resolve('Starfall-Menagerie.html')).href:(process.env.BASE_URL||'http://127.0.0.1:3000'));
 if(mobile)await page.locator('.arena-dock [data-action="companions"]').tap();else await page.locator('.arena-dock [data-action="companions"]').click();
 await page.mouse.move(1,1);
 assert.equal(await page.locator('.inventory-pouch[data-pouch-opened="false"]').count(),2);
 assert.equal(await page.locator('.pouch-pile[inert][aria-hidden="true"]').count(),2);
 await page.waitForTimeout(400);await page.screenshot({path:`${out}/${offline?'offline':'source'}-closed-${width}.png`});
 const motion=[];
 for(const kind of ['gear','gem']){
  const bag=page.locator(`[data-pack-kind="${kind}"]`);await bag.scrollIntoViewIfNeeded();
  if(mobile){const p=await point(page,bag.locator('[data-open-pouch]'));await page.touchscreen.tap(p.x,p.y);}else await bag.hover();
  assert.equal(await bag.getAttribute('data-pouch-opened'),'true');
  await page.waitForTimeout(180);const a=await bag.locator('.pouch-item').first().evaluate(el=>el.style.getPropertyValue('--scatter-x'));
  await page.waitForTimeout(180);const b=await bag.locator('.pouch-item').first().evaluate(el=>el.style.getPropertyValue('--scatter-x'));
  assert.notEqual(a,b,'physics moves the packed items');motion.push({kind,a,b});
  await page.waitForTimeout(1300);assert.equal(await bag.locator('.pouch-pile').getAttribute('inert'),null);assert.equal(await bag.locator('.pouch-bag-art').evaluate(el=>el.complete&&el.naturalWidth>0),true);
  assert.equal(await bag.locator('.pouch-item').first().evaluate(el=>el.style.getPropertyValue('--scatter-x')),'');
  assert.equal(await bag.locator('.pouch-bag-art').getAttribute('src'),await page.locator('.equipment-pouch .pouch-emblem').getAttribute('src'),'hold the authored open frame');
 }
 await page.mouse.move(1,1);assert.equal(await page.locator('.inventory-pouch[data-pouch-opened="true"]').count(),2,'bags latch open after leaving');
 const sockets=await page.locator('.companion-equipment .aura-slot').evaluateAll(els=>els.map(el=>({w:el.clientWidth,h:el.clientHeight,y:el.offsetTop})));
 assert.equal(sockets.length,4);assert.ok(sockets.every(r=>r.h<=90));assert.equal(new Set(sockets.map(r=>r.y)).size,1,'four Aura slots fit on one row');
 assert.ok(await page.locator('.stone-pouch .pouch-pile').evaluate(el=>el.clientHeight<=120));
 if(!mobile){const rects=await page.locator('.equipment-pouch,.stone-pouch').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));assert.ok(rects[1].top>=rects[0].bottom&&rects[1].bottom<innerHeightForTest(width));}
 const ring=page.locator('[data-gear-equip="ring"]'),ringSlot=page.locator('.companion-equipment [data-gear-type="Ring"]');
 const before=await page.evaluate(()=>JSON.stringify({gear:starfall.state.run.gearInventory,team:starfall.state.run.team}));
 for(const interruption of ['miss','escape','pointercancel','capture','blur','buttons','removed','close']){
  await begin(page,ring);
  if(interruption==='miss'){await page.mouse.move(2,2);await page.mouse.up();}
  if(interruption==='escape'){await page.keyboard.press('Escape');await page.mouse.up();}
  if(interruption==='pointercancel')await ring.evaluate(el=>el.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:window.testPointer})));
  if(interruption==='capture')await ring.evaluate(el=>el.releasePointerCapture(window.testPointer));
  if(interruption==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  if(interruption==='buttons')await ring.evaluate(el=>el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:window.testPointer,pointerType:'mouse',buttons:0})));
  if(interruption==='removed'){await ring.evaluate(el=>el.remove());await page.waitForTimeout(100);await page.locator('.modal-close').evaluate(el=>el.click());await page.locator('.arena-dock [data-action="companions"]').click();await page.locator('.equipment-pouch').hover();await page.waitForTimeout(1700);}
  if(interruption==='close'){await page.locator('.modal-close').evaluate(el=>el.click());await page.locator('.arena-dock [data-action="companions"]').click();await page.locator('.equipment-pouch').hover();await page.waitForTimeout(1700);}
  await page.mouse.up();await clean(page);assert.equal(await page.evaluate(()=>JSON.stringify({gear:starfall.state.run.gearInventory,team:starfall.state.run.team})),before,interruption+' preserves inventory');
 }
 await page.locator('.stone-pouch').hover();await page.waitForTimeout(1700);
 await begin(page,ring);await drop(page,ringSlot);await page.locator('.loadout-sprite-ghost.settling').waitFor();
 await page.evaluate(()=>document.querySelector('.loadout-sprite-ghost').getAnimations()[0].pause());await clean(page);
 assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('ruby-vigor-ring')));
 assert.equal(await page.evaluate(()=>starfall.state.run.team[0].equipmentRolls.find(g=>g.id==='ruby-vigor-ring').quality),1.17);
 const worn=page.locator('.companion-equipment [data-gear-type="Ring"]');
 await begin(page,worn);await drop(page,page.locator('.stone-pouch'));await clean(page);assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('ruby-vigor-ring')),'wrong pouch rejects equipment');
 await begin(page,worn);await drop(page,page.locator('.equipment-pouch'));await clean(page);assert.equal(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('ruby-vigor-ring')),false);
 // A genuine click immediately after a cancelled drag must still equip.
 const returnedUid=await page.evaluate(()=>starfall.state.run.gearInventory.find(g=>g.id==='ruby-vigor-ring').uid);
 await page.locator(`[data-gear-equip="${returnedUid}"]`).click();assert.ok(await page.evaluate(()=>starfall.state.run.team[0].equipment.includes('ruby-vigor-ring')));assert.equal(await page.locator('.modal').getAttribute('data-kind'),'companions');
 await page.locator('.companion-equipment [data-unequip="0"]').click();assert.equal(await page.locator('.modal').getAttribute('data-kind'),'companions');assert.equal(await page.locator('.inventory-pouch[data-pouch-opened="true"]').count(),2);
 const stone=page.locator('[data-equip="worn"]');await page.locator('.stone-pouch [data-pouch-pile]').evaluate(el=>el.scrollTop=el.scrollHeight);await stone.scrollIntoViewIfNeeded();await stone.click();assert.equal(await page.evaluate(()=>starfall.state.run.team[0].relics[0].tier),2);
 await page.locator('.companion-equipment').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${offline?'offline':'source'}-open-${width}.png`});
 if(mobile){await page.locator('.stone-pouch').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${offline?'offline':'source'}-pouches-${width}.png`});}
 await page.locator('.modal-close').click();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.arena-dock [data-action="companions"]').click();
 await page.locator('.stone-pouch [data-open-pouch]').focus();assert.equal(await page.locator('.stone-pouch').getAttribute('data-pouch-opened'),'true');assert.equal(await page.locator('.stone-pouch.pouch-opening').count(),0);assert.equal(await page.locator('.stone-pouch .pouch-item').first().evaluate(el=>el.style.getPropertyValue('--scatter-x')),'');
 await page.locator('.modal-close').click();await page.locator('[data-action="battle"],[data-action="begin-encounter"]').first().click();await page.waitForFunction(()=>starfall.state.phase==='battle');await page.waitForTimeout(1200);assert.equal(await page.locator('.loadout-sprite-ghost,.drop-art-pending').count(),0);
 await page.screenshot({path:`${out}/${offline?'offline':'source'}-combat-${width}.png`});assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 report.push({offline,width,motion,compactAuraRow:true,independentPouches:true,interruptedDrags:8,pausedSettlementCleanup:true,qualityAndTierPreserved:true,keyboardReducedMotion:true,combatClean:true,errors,failed});
 const video=page.video();await context.close();if(video)await video.saveAs(out+'/pouches-and-drag-normal-speed.webm');
}}
finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
function innerHeightForTest(){return 900;}
