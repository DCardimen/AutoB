import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';
const out='docs/evidence/expedition-confirm';fs.mkdirSync(out,{recursive:true});const report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{for(const offline of [false,true])for(const width of [1900,1024,390,320]){
 const context=await browser.newContext({viewport:{width,height:935}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const run=makeRun(447,['aurel','brakk']);run.route=generateRoute(run);const node=run.route[0][0];
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['aurel','brakk','cinderfox','mossguard','nyra','syl','pyrehorn'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+(offline?'/Starfall-Menagerie.html':''));
 const newRun=page.locator('#new-run');assert.ok(await newRun.evaluate(el=>!!el.closest('.header')));assert.ok((await newRun.boundingBox()).y<120);const before=await page.evaluate(()=>starfall.state.run.seed);
 await newRun.click();assert.equal(await page.evaluate(()=>starfall.state.run.seed),before);
 const confirm=page.locator('[data-action="confirm-run"]');assert.match(await confirm.innerText(),/Confirm expedition/);assert.ok(await confirm.evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.team-select-layout').getBoundingClientRect().top));
 await page.evaluate(()=>window.keptCard=document.querySelector('[data-starter="brakk"] canvas'));
 await page.locator('[data-starter="aurel"]').click();assert.ok(await page.evaluate(()=>keptCard===document.querySelector('[data-starter="brakk"] canvas')));await page.locator('[data-starter="aurel"]').click();
 await page.locator('[data-action="close"]').click();assert.equal(await page.evaluate(()=>starfall.state.run.seed),before);await newRun.click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({c:el.className,x:el.getBoundingClientRect().x,w:el.getBoundingClientRect().width})).filter(r=>r.x+r.w>innerWidth+1&&r.w>0).slice(0,15))));assert.ok(await page.locator('.team-select').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.waitForTimeout(450);await page.screenshot({path:`${out}/${offline?'offline':'source'}-${width}.png`});
 await confirm.click();assert.notEqual(await page.evaluate(()=>starfall.state.run.seed),before);assert.equal(await page.locator('.team-select').count(),0);assert.deepEqual(errors,[]);report.push({offline,width,headerAction:true,confirmAboveCatalogue:true,cancelPreservesRun:true,stablePortraits:true,confirmStartsRun:true,noOverflow:true,errors});await context.close();
}}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
