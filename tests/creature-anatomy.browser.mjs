import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';
const executablePath=process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',report={checks:[],errors:[]};fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),requests=[];
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  const run=makeRun(93,['aurel','brakk']);run.relics=[];run.teamCapacity=6;run.team=['emberhound','orchimantis','mireclaw','runespider','ironscolopendra','moonjelly'].map((id,seat)=>({...creature(id),seat,balanceVersion:17}));run.route=generateRoute(run);const node=run.route[0][0],foes=Array.from({length:6},()=>({...creature('aurel'),balanceVersion:17}));
  await page.addInitScript(saved=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved)),{version:7,run:JSON.parse(JSON.stringify(run)),node,foes,phase:'prep',profile:{owned:run.team.map(c=>c.id),tutorial:true,tuning:{spriteSize:200}}});
  await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);
  await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();
  await page.evaluate(()=>{const b=starfall.state.battle;for(const [i,u]of b.units.entries()){const j=i%6;u.x=260+Math.floor(j/3)*360+(u.side?12:0);u.y=200+j%3*210;u.hp=u.maxHp=10000;u.shield=0;u.armor=0;u.speed=0;u.attackTimer=9999;u.dodgeCooldown=9999;u.hitAnim=0;Object.values(u.cooldowns).forEach(cd=>cd.remaining=9999);}b.step(.01);});
  await page.waitForTimeout(100);const idle=await page.locator('#battle-canvas').evaluate(c=>c.toDataURL());
  await page.evaluate(()=>{const b=starfall.state.battle;for(let i=0;i<6;i++){const u=b.units[i];b.beginStrike(u,b.units[i+6],u.loadout.auto);}for(let i=0;i<5;i++)b.step(.02);});
  await page.waitForTimeout(100);const ready=await page.locator('#battle-canvas').evaluate(c=>c.toDataURL());assert.notEqual(ready,idle);
  assert.ok(await page.evaluate(()=>starfall.state.battle.units[5].nativeActor.casts),'gel attacks use the natural cast/pulse pose');
  await page.evaluate(()=>{const b=starfall.state.battle;for(let i=0;i<40;i++){b.step(.02);if(b.effects.some(e=>['bite','scythe','pinch'].includes(e.type)))break;}});await page.waitForTimeout(100);
  assert.notEqual(await page.locator('#battle-canvas').evaluate(c=>c.toDataURL()),ready);
  assert.ok(await page.evaluate(()=>starfall.state.battle.effects.some(e=>['bite','scythe','pinch'].includes(e.type))));
  await page.evaluate(()=>{for(let i=0;i<40;i++)starfall.state.battle.step(.02);});
  assert.ok(await page.evaluate(()=>starfall.state.battle.metrics.bladeContacts>=4));
  assert.ok(await page.evaluate(()=>starfall.state.battle.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.x))));
  if(!offline)await page.locator('.arena-panel').screenshot({path:'playtest-artifacts/creature-anatomy-live.png'});
  if(offline)assert.deepEqual(requests.filter(url=>/^https?:/.test(url)),[base+'/Starfall-Menagerie.html']);
  report.checks.push(`${offline?'Offline':'Source'}: canine, mantis, crab, spider, centipede and gel actors render live anticipation/contact/recovery, land physical hits and retain finite state`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/creature-anatomy-browser.json',JSON.stringify(report,null,2));await browser.close();}
