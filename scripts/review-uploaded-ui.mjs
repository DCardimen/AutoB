import {chromium} from 'playwright';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter,creature} from '../game.js';

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const base=process.env.BASE_URL||'http://127.0.0.1:3017',errors=[];
fs.mkdirSync('playtest-artifacts',{recursive:true});
try {
 const context=await browser.newContext({viewport:{width:1672,height:941},recordVideo:{dir:'playtest-artifacts/uploaded-ui-video',size:{width:1672,height:941}}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const run=makeRun(83,['aurel','brakk','voltwing']);run.route=generateRoute(run);run.captureTools={scout:5,runic:2,astral:1,mythic:1};run.orbs=9;run.teamCapacity=3;run.gearInventory=[{uid:'art-venom',id:'venom-sabre'},{uid:'art-mantle',id:'mooncloth-mantle'},{uid:'art-boots',id:'windstep-boots'}];
 run.team.push({...creature('voltwing',1),seat:2,balanceVersion:15,equipment:[],relics:[]});
 const node=run.route[0][0];node.type='elite';run.encounterType='elite';
 const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['aurel','brakk','voltwing'],tutorial:true}};
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},saved);
 await page.clock.install();await page.goto(base);await page.waitForFunction(()=>window.starfall);await page.clock.runFor(1800);
 await page.screenshot({path:'playtest-artifacts/uploaded-arena-desktop.png',animations:'disabled'});
 for(const action of ['companions','capture-kit','intel']){
  await page.locator(`.arena-dock [data-action="${action}"]`).click();await page.clock.runFor(400);await page.screenshot({path:`playtest-artifacts/uploaded-${action}-desktop.png`,animations:'disabled'});await page.locator('.modal-close').click();
 }
 await page.locator('[data-action="battle"]').first().click();await page.clock.runFor(1700);await page.screenshot({path:'playtest-artifacts/uploaded-live-combat.png'});
 await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,1e6,b.living(0)[0],null,1,'status');b.step(.04);});await page.clock.runFor(2500);
 await new Promise(resolve=>setTimeout(resolve,2200));
 await page.screenshot({path:'playtest-artifacts/uploaded-rewards-desktop.png',animations:'disabled'});
 await page.locator('.rewards-expedition [data-action="report"]').click();await page.clock.runFor(400);await page.screenshot({path:'playtest-artifacts/uploaded-comparison-desktop.png'});await page.locator('[data-action="return-rewards"]').click();
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.clock.runFor(2000);await page.locator('.reward-screen').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`playtest-artifacts/uploaded-rewards-${width}.png`,animations:'disabled'});await page.locator('.rewards-expedition').scrollIntoViewIfNeeded();await page.screenshot({path:`playtest-artifacts/uploaded-rewards-growth-${width}.png`,animations:'disabled'});}
 console.log(JSON.stringify({errors,phase:await page.evaluate(()=>starfall.state.phase)},null,2));
 await context.close();
} finally {fs.writeFileSync('playtest-artifacts/uploaded-ui-errors.json',JSON.stringify(errors,null,2));await browser.close();}
