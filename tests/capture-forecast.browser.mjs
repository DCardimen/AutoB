import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,BY_ID,captureChance} from '../game.js';
const out='docs/evidence/capture-forecast';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={checks:[],errors:[]};
try{
for(const offline of [false,true])for(const [width,height]of [[1440,900],[390,844],[320,568]]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const run=makeRun(83,['aurel','brakk']);run.route=generateRoute(run);const node=run.route[0][0],foes=[creature('nyra',7),creature('syl',5)];
 run.captureOrder={uid:foes[0].uid,threshold:.25,mode:'mercy',tool:'scout'};
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node,foes,phase:'prep',profile:{owned:['aurel','brakk'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
 await page.goto('http://127.0.0.1:3021/'+(offline?'Starfall-Menagerie.html':'index.html'));await page.locator('#capture-tracker').waitFor();
 assert.equal(await page.locator('[data-capture-rarity]').textContent(),BY_ID.nyra.rarity);
 const odds=captureChance(run,{...foes[0],capturePreparation:{healthFraction:.25,status:false,mode:'mercy',tool:'scout'}});
 assert.equal(await page.locator('[data-capture-threshold-chance]').textContent(),Math.round(odds*100)+'%');
 assert.match(await page.locator('[data-capture-risk]').textContent(),/^~\d+%$/);
 await page.locator('#capture-tracker [data-action="capture-kit"]').first().click();
 await page.locator('#kit-capture-threshold').selectOption('5');
 assert.match(await page.locator('.capture-kit-odds').textContent(),/capture at 5% HP/);
 await page.locator('.modal [data-action="close"]').last().click();
 assert.equal(await page.locator('[data-capture-threshold-label]').textContent(),'Capture at 5% HP');
 await page.locator('#capture-tracker [data-action="capture-tracker-toggle"]').click();assert.ok(await page.locator('[data-capture-rarity]').isVisible());
 await page.locator('#capture-tracker [data-action="capture-tracker-toggle"]').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1),'no page scroll');
 assert.ok(await page.locator('#capture-tracker').evaluate(el=>!el.closest('.arena-viewport')&&el.scrollWidth<=el.clientWidth+1));
 assert.ok(await page.evaluate(()=>{const a=document.querySelector('#ally-orders').getBoundingClientRect(),t=document.querySelector('#capture-tracker').getBoundingClientRect();return innerWidth>900||a.bottom<=t.top+1;}),'tracker does not overlap companions');
 if(!offline)await page.screenshot({path:`${out}/capture-${width}.png`});
 await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();
 await page.evaluate(()=>{const b=starfall.state.battle,t=b.units.find(c=>c.uid===b.capturePlan.uid);t.hp=t.maxHp*.03;t.poison=2;});
 await page.waitForFunction(()=>document.querySelector('[data-capture-risk-label]').textContent.includes('3% HP'));
 assert.ok(await page.locator('[data-capture-risk]').isVisible());
 report.checks.push({offline,width,height,rarity:BY_ID.nyra.rarity,liveRisk:await page.locator('[data-capture-risk]').textContent()});await context.close();
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
