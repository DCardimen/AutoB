import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,SPECIES,generateRoute,xpNeeded} from '../game.js';
import {AURA_STONES,auraSlots} from '../aura-stones.js';
const out='docs/evidence/postmatch-quick-equip';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report=[];
async function drag(page,source,target){await source.scrollIntoViewIfNeeded();const a=await source.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+12,a.y+a.height/2+9,{steps:5});await target.scrollIntoViewIfNeeded();const b=await target.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:16});await page.mouse.up();await page.waitForTimeout(650);}
try{for(const offline of [false,true])for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000},...(width===1440&&!offline?{recordVideo:{dir:out,size:{width,height:1000}}}:{})}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
 const run=makeRun(812,['aurel','brakk']),s=SPECIES.find(s=>auraSlots({id:s.id})===1),stone=AURA_STONES.find(a=>a.role===s.role);run.team[1]=creature(s.id);run.team[1].balanceVersion=17;run.team[1].equipmentVersion=2;run.team[1].relics=[{uid:'old-stone',id:stone.id,tier:4}];run.team[0].equipment=['sunsteel-edge'];run.team[0].equipmentRolls=[{uid:'old-blade',quality:.5}];run.route=generateRoute(run);
 const growth=run.team.map(c=>({...c,before:{level:c.level,xp:0,needed:xpNeeded(c.level)},after:{level:c.level,xp:10,needed:xpNeeded(c.level)},amount:10,levels:0})),reward={won:true,gold:31,xp:10,time:22,growth,levels:[],loot:{key:'quick-test',claimed:false,drops:[{id:'blade-reward',kind:'gear',gear:'sunsteel-edge',quality:1.2,rarity:'Epic'},{id:'stone-reward',kind:'stone',stone:stone.id,tier:1},{id:'coins-reward',kind:'gold',amount:12}]}},lastReport={units:run.team.map(c=>({...c,side:0,maxHp:300,atk:30,armor:10})),growth,killLedger:[],metrics:{}};
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes:[creature('brakk')],phase:'reward',reward,lastReport,profile:{owned:run.team.map(c=>c.id),tutorial:true,reducedMotion:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+(offline?'/Starfall-Menagerie.html':''));await page.locator('[data-reward-loot="blade-reward"]').waitFor();
 const blade=page.locator('[data-reward-loot="blade-reward"]'),rows=page.locator('[data-reward-companion]');assert.equal(await rows.count(),2);assert.equal(await rows.nth(0).locator('[data-gear-type]').count(),5);
 assert.ok(await page.locator('[data-reward-quick="blade-reward"]').evaluate(el=>el.classList.contains('grade-upgrade')));
 await blade.hover();assert.equal(await rows.nth(0).getAttribute('data-reward-grade'),'upgrade');assert.ok(await rows.nth(0).locator('[data-gear-type="Weapon"]').evaluate(el=>el.classList.contains('loadout-compatible')));
 assert.ok(await rows.evaluateAll(rows=>rows.every(row=>row.querySelector('.quick-attachments').getBoundingClientRect().top>=row.querySelector('.growth-info').getBoundingClientRect().bottom)),'compact fields sit below the companion information');
 if(width>900){const l=await rows.nth(0).boundingBox(),r=await blade.boundingBox();assert.ok(l.x<r.x,'companion targets sit to the left of rewards');}
 await page.screenshot({path:`${out}/${offline?'offline':'source'}-${width}-hover.png`});
 await drag(page,blade,rows.nth(0).locator('[data-gear-type="Weapon"]'));
 assert.equal(await page.evaluate(()=>starfall.state.run.team[0].equipmentRolls[0].quality),1.2);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('starfall-menagerie-v1')).reward.loot.claimed),false);assert.ok(await page.locator('[data-reward-loot="blade-reward"]').getAttribute('data-loot-claimed')==='true');
 await page.locator('[data-reward-quick="stone-reward"]').click();assert.equal(await page.evaluate(()=>starfall.state.run.team[1].relics[0].tier),1);
 await page.reload();await page.locator('[data-reward-companion]').first().waitFor();assert.equal(await page.evaluate(()=>starfall.state.run.team[0].equipmentRolls[0].quality),1.2);assert.equal(await page.evaluate(()=>starfall.state.run.team[1].relics[0].tier),1);
 await page.locator('[data-action="claim-loot"]').click();await page.locator('.loot-cache.collected').waitFor();assert.equal(await page.evaluate(()=>starfall.state.run.gearInventory.filter(g=>g.uid==='blade-reward').length),0);assert.equal(await page.evaluate(()=>starfall.state.run.inventory.filter(g=>g.uid==='stone-reward').length),0);
 assert.equal(await page.locator('.drag-sprite,.loadout-drag-ghost').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.deepEqual(errors,[]);
 await page.screenshot({path:`${out}/${offline?'offline':'source'}-${width}-equipped.png`});report.push({offline,width,compactSlots:5,hoverGrades:true,dragUpgrade:true,quickStoneUpgrade:true,individualClaim:true,reload:true,noDuplication:true,noOverflow:true,errors});const video=page.video();await context.close();if(video)await video.saveAs(out+'/quick-equip-normal-speed.webm');
}}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
