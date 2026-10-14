import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';

const executablePath=process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[]};
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  const run=makeRun(73,['aurel','brakk']);run.relics=[];run.teamCapacity=6;
  run.team=['aurel','brakk','nyra','syl','cogwalker','solara'].map((id,i)=>({...creature(id,8),balanceVersion:17,evolution:2,evolutionPath:'wild',seat:i}));
  run.route=generateRoute(run);const node=run.route[0][0];
  const foes=['solara','cogwalker','morrow','tarka','brom','nix'].map(id=>({...creature(id,3),enemyRelics:['prism-plate']}));
  await page.addInitScript(({run,node,foes})=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify({version:7,run,node,foes,phase:'prep',profile:{owned:run.team.map(c=>c.id),runs:1,tutorial:true,tuning:{spriteSize:200,smallSize:150,largeSize:150}}}));},{run:JSON.parse(JSON.stringify(run)),node,foes});
  await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:width>700?1050:844});
   await page.locator('#ally-orders label').last().waitFor();
   assert.equal(await page.locator('#ally-orders label').count(),6);
   assert.equal(await page.locator('#enemy-overheads [data-head-uid]').count(),6);
   assert.ok(await page.evaluate(()=>{
    const canvas=document.querySelector('#battle-canvas').getBoundingClientRect();
    return [...document.querySelectorAll('#ally-orders label,#enemy-overheads button')].every(el=>{const r=el.getBoundingClientRect();return r.bottom<=canvas.top||r.top>=canvas.bottom||r.right<=canvas.left||r.left>=canvas.right;});
   }),width+'px: preparation controls must never intersect the sprite canvas');
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(el).position!=='fixed').filter(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX))return false;return true;}).slice(0,30).map(el=>({tag:el.tagName,cls:el.className,right:Math.round(el.getBoundingClientRect().right),overflow:getComputedStyle(el).overflowX,text:el.textContent.slice(0,100),parent:el.parentElement.className})));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+'px: no page overflow '+JSON.stringify(overflow));
   if(!offline&&[390,1440].includes(width))await page.locator('.arena-panel').screenshot({path:`${out}/live-roster-prep-${width}.png`});
  }
  await page.locator('[data-action="battle"]').click();await page.locator('#live-roster [data-live-unit]').first().waitFor();
  await page.locator('[data-action="pause"]').click();
  assert.equal(await page.locator('#live-roster [data-live-unit]').count(),6);
  assert.ok(await page.locator('#live-roster').evaluate(el=>Math.abs(el.getBoundingClientRect().bottom-innerHeight)<=1));
  const first=await page.evaluate(()=>{
   const b=starfall.state.battle,u=b.units[0];window.hudOriginalCard=document.querySelector('[data-live-unit]');
   u.hp=123;u.maxHp=500;u.stamina=28;Object.values(u.cooldowns)[0].remaining=8;return u.uid;
  });
  const card=page.locator(`[data-live-unit="${first}"]`);
  await page.waitForFunction(()=>document.querySelector('[data-hud-hp]')?.textContent==='123 / 500');
  assert.equal(await card.locator('[data-hud-stamina]').textContent(),'28 / 100');
  assert.match(await card.locator('[data-hud-skill]').first().textContent(),/8\.0s/);
  assert.ok(await page.evaluate(()=>window.hudOriginalCard===document.querySelector('[data-live-unit]')));
  await card.locator('[data-live-inspect]').click();await page.locator('.modal[aria-label="creature"]').waitFor();
  await page.locator('[data-action="close"]').first().click();
  await page.evaluate(()=>{const b=starfall.state.battle;b.units[0].hp=0;const t=b.living(1)[0];t.hp=t.maxHp*.2;b.capturePlan={uid:t.uid,threshold:.25,tool:'scout'};b.random=()=>0;b.attemptCapture();});
  await page.waitForFunction(()=>document.querySelectorAll('#live-roster [data-live-unit]').length===7);
  assert.ok(await card.evaluate(el=>el.classList.contains('knocked-out')));
  assert.match(await page.locator('#live-roster').textContent(),/ROUND ALLY/);
  if(!offline)await page.screenshot({path:`${out}/live-roster-desktop.png`});
  await page.locator('[data-roster-side="1"]').click();assert.equal(await page.locator('#live-roster [data-live-unit]').count(),5);
  await page.locator('#live-roster [data-enemy-focus]').first().click();assert.ok(await page.evaluate(()=>starfall.state.battle.focusUid));
  await page.locator('[data-roster-side="0"]').click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('.arena-viewport').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await page.locator('.live-roster-cards').evaluate(el=>el.scrollWidth>el.clientWidth));
  if(!offline)await page.screenshot({path:`${out}/live-roster-mobile.png`});
  await page.locator('.live-roster-cards').evaluate(el=>el.scrollLeft=el.scrollWidth);
  assert.ok(await page.locator('.live-roster-cards').evaluate(el=>el.scrollLeft>0));
  report.checks.push(`${offline?'Offline':'Source'}: six evolved allies and six enemies; sprite-safe prep controls at 320/390/768/1440px; fixed HUD, live HP/stamina/cooldowns, stable DOM, inspection, knockouts, captured ally membership, enemy focus and phone scrolling`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(out+'/live-roster-browser.json',JSON.stringify(report,null,2));await browser.close();}
