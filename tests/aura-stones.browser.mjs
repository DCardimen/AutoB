import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AURA_BY_ID} from '../aura-stones.js';
import {makeRun,creature,generateRoute,generateShop} from '../game.js';
const out='docs/evidence/aura-stones';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={checks:[],errors:[]};
try{
 for(const offline of [false,true])for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const run=makeRun(83,['aurel','brakk']);run.team[0]={...creature('nyra'),balanceVersion:17,equipmentVersion:2,equipment:[],seat:0};run.route=generateRoute(run);run.inventory=[{uid:'good',id:'aura-wellspring',tier:1},{uid:'bad',id:'aura-valor',tier:2}];
  await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes:[creature('brakk')],phase:'prep',profile:{owned:['aurel','brakk','nyra'],tutorial:true}});
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+(offline?'/Starfall-Menagerie.html':''));await page.locator('.arena-dock').waitFor();await page.locator('.arena-dock [data-action="companions"]').click();
  const bad=page.locator('[data-equip="bad"]');assert.equal(await bad.getAttribute('aria-disabled'),'true');await bad.click({force:true});assert.equal(await page.evaluate(()=>starfall.state.run.inventory.length),2);assert.equal(await page.locator('.aura-equip-pulse').count(),0);
  await page.locator('[data-equip="good"]').click();await page.locator('.aura-equip-pulse').waitFor();assert.equal(await page.locator('.aura-equip-pulse').count(),1);assert.equal(await page.locator('.aura-equip-pulse').getAttribute('data-companion-uid'),run.team[0].uid);assert.equal(await page.evaluate(()=>starfall.state.run.team[0].relics[0].tier),1);await page.waitForTimeout(1300);
  assert.equal(await page.locator('.aura-equip-pulse').count(),0);await page.locator('.aura-slot.equipped').scrollIntoViewIfNeeded();assert.match(await page.locator('.aura-slot.equipped').innerText(),/Tier I/);assert.match(await page.locator('.aura-slot.equipped').innerText(),/5.2 HP/);if(!offline)await page.screenshot({path:`${out}/loadout-${width}.png`});
  await page.reload();await page.locator('.arena-dock').waitFor();assert.equal(await page.evaluate(()=>starfall.state.run.team[0].relics[0].tier),1);assert.equal(await page.locator('#aura-range-preview ellipse').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  if(!offline)await page.screenshot({path:`${out}/range-${width}.png`});await page.locator('[data-action="battle"]').click();await page.waitForTimeout(1200);assert.ok(await page.evaluate(()=>starfall.state.battle.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.maxHp))));assert.ok(await page.evaluate(()=>starfall.state.battle.units[0].hpRegen>5));const shopRun=makeRun(84,['aurel','brakk']);shopRun.gold=2000;shopRun.route=generateRoute(shopRun);const stock=generateShop(shopRun,84),id=stock.personal[0],cost=AURA_BY_ID[id].cost;
  await page.evaluate(saved=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved)),JSON.parse(JSON.stringify({version:7,run:shopRun,node:{...shopRun.route[0][0],type:'shop'},foes:[],phase:'shop',shopStock:stock,profile:{owned:['aurel','brakk'],tutorial:true}})));await page.reload();const buy=page.locator(`[data-action="buy-personal-${id}"]`);await buy.waitFor();assert.match(await buy.innerText(),new RegExp(String(cost)));await buy.click();assert.equal(await page.evaluate(()=>starfall.state.run.gold),2000-cost);assert.equal(await page.evaluate(()=>starfall.state.run.inventory[0].tier),4);await page.reload();assert.ok(await page.locator(`[data-action="buy-personal-${id}"]`).isDisabled());
  report.checks.push({offline,width,shopPricing:true,roleRestriction:true,tierPersists:true,singlePulse:true,radiusPreview:true,liveCombat:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
