import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';
const out='docs/evidence/loadout-hover';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report=[];
const markers=page=>page.evaluate(()=>[...document.querySelectorAll('.loadout-compatible,.loadout-incompatible')].map(el=>({tag:el.tagName,index:el.dataset.loadoutDrop,gear:el.dataset.gearType,stone:el.dataset.relicSlot,pack:el.dataset.packKind,fit:el.classList.contains('loadout-compatible')})));
try{for(const offline of [false,true])for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const run=makeRun(83,['aurel','brakk']);run.team=['nyra','eira','brakk','voltwing'].map((id,i)=>({...creature(id),seat:i,balanceVersion:17,equipmentVersion:2,equipment:[],relics:i?[]:[{uid:'worn',id:'aura-wellspring',tier:2}]}));run.teamCapacity=4;run.route=generateRoute(run);run.gearInventory=[{uid:'fang',id:'jade-fang'},{uid:'ring',id:'ruby-vigor-ring'}];run.inventory=[{uid:'stone',id:'aura-renewal',tier:1}];
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes:[creature('brakk')],phase:'prep',profile:{owned:run.team.map(c=>c.id),tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto('http://127.0.0.1:3000'+(offline?'/Starfall-Menagerie.html':''));await page.locator('.arena-dock [data-action="companions"]').click();
 for(const kind of ['gear','gem']){await page.locator(`[data-pack-kind="${kind}"]`).hover();await page.waitForTimeout(1700);}
 const before=await page.evaluate(()=>JSON.stringify(starfall.state.run));
 for(const uid of ['fang','ring','stone']){
  const source=page.locator(`[data-pouch-item="${uid}"]`);await source.hover();const preview=await markers(page);assert.ok(preview.some(m=>m.fit));assert.equal(await page.locator('.loadout-sprite-ghost,.dragging').count(),0);assert.equal(await page.locator('body.carrying-sprite').count(),0);
  if(uid==='fang'){assert.ok(preview.some(m=>m.index==='3'&&m.gear==='Weapon'&&m.fit));assert.ok(preview.some(m=>m.index==='0'&&m.gear==='Weapon'&&!m.fit));}
  if(uid==='stone'){assert.ok(preview.some(m=>m.index==='1'&&m.stone==='0'&&m.fit));assert.ok(preview.some(m=>m.index==='0'&&m.stone==='0'&&!m.fit));assert.ok(preview.some(m=>m.index==='2'&&!m.fit));assert.ok(await page.locator('[data-pouch-companion="1"]').evaluate(el=>el.classList.contains('loadout-compatible')));}
  if(uid==='stone')assert.ok(preview.filter(m=>m.gear).every(m=>!m.fit),'stones highlight Aura sockets rather than equipment sockets');
  if(!offline&&uid!=='ring')await page.screenshot({path:`${out}/${uid}-${width}.png`});
  const box=await source.boundingBox();await page.mouse.down();await page.mouse.move(box.x+box.width/2+14,box.y+box.height/2,{steps:3});await page.locator('.loadout-sprite-ghost').waitFor();assert.deepEqual(await markers(page),preview,'hover and drag use identical compatibility');
  await page.keyboard.press('Escape');await page.mouse.up();await page.mouse.move(1,1);await page.waitForTimeout(550);assert.equal(await page.locator('.loadout-compatible,.loadout-incompatible,.loadout-sprite-ghost').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run)),before);
 }
 const ring=page.locator('[data-pouch-item="ring"]');await ring.focus();assert.ok((await markers(page)).some(m=>m.fit));await page.locator('.modal-close').focus();assert.equal((await markers(page)).length,0);await page.locator('.modal-close').click();assert.equal((await markers(page)).length,0);assert.deepEqual(errors,[]);report.push({offline,width,hoverMatchesDrag:true,weaponAffinity:true,stoneRoleAndFullSlots:true,companionStrip:true,noMutationOrGhost:true,keyboardFocus:true,cleanup:true,errors});await context.close();
}}
finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
