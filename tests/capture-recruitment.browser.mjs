import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';

const executablePath=process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts',report={checks:[],errors:[]};
fs.mkdirSync(out,{recursive:true});
try{
 for(const offline of [false,true])for(const scenario of ['open','reserve','unlock','retreat','old-save']){
  const context=await browser.newContext({viewport:{width:scenario==='reserve'?390:1440,height:1050}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const run=makeRun(83,['aurel','brakk']);run.relics=[];run.teamCapacity=scenario==='open'?3:2;run.wins=scenario==='unlock'?1:0;run.route=generateRoute(run);const node=run.route[0][0];
  const foes=[{...creature('nyra',7),balanceVersion:17,evolution:1,evolutionPath:'wild',nature:'Savant',genes:{hp:.9,atk:.8,speed:1.2,cd:.85},enemyRelics:['venom-clasp'],equipment:['prism-focus'],equipmentQuality:1,equipmentRolls:[{quality:.77,rarity:'Rare',sourceName:'Wild Nyra'}]},{...creature('syl'),balanceVersion:17}];
  const oldResult={success:true,uid:foes[0].uid,attempt:1,creature:{...foes[0],bond:3}};
  const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes,phase:scenario==='old-save'?'reward':'prep',profile:{owned:['aurel','brakk','nyra'],bonds:{nyra:3},runs:1,tutorial:true}};
  if(scenario==='old-save'){saved.run.captureReservation={uid:oldResult.uid,result:oldResult};saved.reward={won:true,gold:0,xp:0,time:10,tacticalCapture:oldResult};}
  await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));},saved);
  await page.clock.install();await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);await page.clock.runFor(200);
  if(scenario!=='old-save'){
   await page.locator('.arena-dock [data-action="capture-kit"]').click();await page.locator('#kit-capture-target').selectOption(foes[0].uid);await page.locator('.modal-close').click();
   await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();
   await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.units){u.speed=0;u.attackTimer=9999;u.dodgeCooldown=9999;Object.values(u.cooldowns).forEach(cd=>cd.remaining=9999);}const t=b.living(1)[0];t.hp=t.maxHp*.2;b.random=()=>0;b.attemptCapture();});
   assert.equal(await page.evaluate(()=>starfall.state.battle.units.filter(u=>u.roundAlly&&u.side===0).length),1);
   assert.equal(await page.evaluate(()=>starfall.state.run.bench.length),0);
   assert.equal(await page.evaluate(()=>starfall.state.run.team.length),2);
   await page.locator('[data-action="pause"]').click();await page.clock.runFor(2600);
   await page.evaluate(retreat=>{const b=starfall.state.battle;for(const u of b.living(retreat?0:1))b.damageUnit(u,100000,b.living(retreat?1:0)[0],null,1,'status');b.step(.04);},scenario==='retreat');
   await page.clock.runFor(2400);assert.equal(await page.evaluate(()=>starfall.state.phase),'reward');
   assert.match(await page.locator('.capture-outcome').textContent(),scenario==='reserve'?/joined your reserves/:/joined an open team slot/);
  }
  const expectedDestination=['reserve','old-save'].includes(scenario)?'reserve':'team';
  const award=await page.evaluate(()=>{const s=starfall.state,r=s.run,result=s.reward?.tacticalCapture||r.captureReservation.result;return {claim:r.captureRecruitments[result.uid],team:r.team,bench:r.bench,gold:r.gold};});
  assert.equal(award.claim.destination,expectedDestination);
  const caught=[...award.team,...award.bench].find(c=>c.uid===award.claim.uid);
  assert.equal(caught.id,'nyra');assert.equal(caught.level,7);assert.equal(caught.evolution,1);assert.equal(caught.nature,'Savant');assert.deepEqual(caught.boundRelics,['venom-clasp']);assert.equal(caught.equipmentRolls[0].quality,.77);assert.equal(caught.equipmentRolls[0].rarity,'Rare');assert.equal(caught.bond,scenario==='old-save'?3:4);
  if(expectedDestination==='team'){assert.equal(award.bench.length,0);assert.equal(award.team.length,scenario==='retreat'?2:3);assert.equal(new Set(award.team.map(c=>c.seat)).size,award.team.length);}
  else{assert.match(await page.locator('.capture-outcome').textContent(),/joined your reserves/);assert.equal(award.team.length,2);assert.equal(award.bench.length,1);await page.locator('.modal-close').click();await page.locator('.arena-dock [data-action="companions"]').click();assert.equal(await page.locator('.reserve-card').count(),1);}
  await page.reload();await page.waitForFunction(()=>window.starfall);await page.clock.runFor(300);
  assert.equal(await page.evaluate(()=>[...starfall.state.run.team,...starfall.state.run.bench].filter(c=>c.id==='nyra').length),1);
  assert.equal(await page.evaluate(()=>starfall.state.run.gold),award.gold);
  assert.equal(await page.evaluate(()=>Object.values(starfall.state.run.captureRecruitments)[0].uid),award.claim.uid);
  if(!offline&&scenario==='reserve')await page.screenshot({path:out+'/capture-recruitment-reserve.png',fullPage:true});
  report.checks.push(`${offline?'Offline':'Source'} ${scenario}: captured ally, permanent ${expectedDestination} recruitment, retained individual/equipment data, saved once across reload`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(out+'/capture-recruitment-browser.json',JSON.stringify(report,null,2));await browser.close();}
