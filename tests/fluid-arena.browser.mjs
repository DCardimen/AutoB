import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';
const out=process.env.FLUID_ARENA_OUT||'playtest-artifacts/fluid-arena';fs.mkdirSync(out,{recursive:true});const report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{for(const offline of [false,true])for(const [width,height]of [[2560,1440],[1900,935],[1366,768],[1024,768],[390,844]]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const run=makeRun(337,['aurel','brakk']);run.route=generateRoute(run);const node=run.route[0][0];
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['aurel','brakk'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+(offline?'/Starfall-Menagerie.html':''));await page.locator('.arena-viewport').waitFor();await page.waitForTimeout(250);
 const layout=await page.evaluate(()=>{const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};};return {app:bounds('#app'),arena:bounds('.arena-viewport'),dock:bounds('.arena-control'),rosterInSidebar:!!document.querySelector('.side-column .arena-roster-deck'),scroll:document.documentElement.scrollWidth};});
 assert.ok(layout.scroll<=width+1);assert.ok(layout.dock.bottom<=height+1,'tools stay within viewport');assert.equal(layout.rosterInSidebar,width>=1101);
 if(width>=1101)assert.ok(layout.app.w>=width-1,'desktop uses the browser width');if(width===1900)assert.ok(layout.arena.h>=640,'desktop recovers battlefield height');
 assert.equal(await page.locator('[data-ally-order]').count(),2);await page.screenshot({path:`${out}/${offline?'offline':'source'}-${width}.png`});
 if(width===1900){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.ok(await page.locator('.arena-frame .arena-roster-deck').count());await page.setViewportSize({width,height});await page.waitForTimeout(200);assert.ok(await page.locator('.side-column .arena-roster-deck').count());}
 await page.locator('[data-action="battle"]').click();await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>starfall.state.phase),'battle');assert.equal(await page.locator('.side-column #live-roster').count(),width>=1101?1:0);assert.ok(await page.locator('#live-roster .live-unit-card').count()>0);
 if(width===1900)await page.screenshot({path:`${out}/${offline?'offline':'source'}-battle.png`});assert.deepEqual(errors,[]);report.push({offline,width,height,...layout,liveCombat:true,errors});await context.close();
}}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
