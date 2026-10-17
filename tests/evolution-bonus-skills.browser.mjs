import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {makeRun,creature,generateRoute,gainXP,xpNeeded} from '../game.js';
const out='docs/evidence/evolution-bonus-skills';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report=[];
async function inspect(page){await page.locator('.arena-dock [data-action="companions"]').click();await page.locator('[data-action="inspect-selected"]').click();}
async function assertSlots(page,bonuses){
 await page.locator('[data-detail-tab="skills"]').click();await page.waitForTimeout(500);assert.equal(await page.locator('[data-skill-kind="regular"]').count(),4);assert.equal(await page.locator('.evolution-skill-bonuses [data-skill-kind="evolution"]').count(),bonuses);assert.match(await page.locator('.ability-heading').first().innerText(),/4 \/ 4 REGULAR SPELLS/);assert.equal(await page.locator('[data-replace-skill],[data-learn-skill]').count(),0);
}
try{for(const offline of [false,true])for(const width of [1440,390])for(const migration of [false,true]){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:!offline&&width===1440&&!migration?{dir:'playtest-artifacts/evolution-bonus-skills',size:{width:1440,height:900}}:undefined}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const run=makeRun(83,['aurel','brakk'],{manualSkills:true}),c=run.team[0];while(c.level<8)gainXP(c,xpNeeded(c.level)-c.xp);run.gold=1000;run.route=generateRoute(run);run.expeditionStarted=true;run.openingRelic={decision:'test'};
 if(migration)Object.assign(c,{evolutionSkillsVersion:undefined,evolution:2,evolutionPath:'warden',learnedSkills:['learn-cinderfall-1','learn-root-snare-2'],chosenEvolutionSkills:['evolve-aurel-warden-1'],archivedSkills:['learn-aegis-call-1'],pendingSkills:[{key:'evolution:2',kind:'evolution',stage:2,selected:'evolve-aurel-warden-2',options:['evolve-aurel-wild-2','evolve-aurel-warden-2']}],skillChoicesThrough:8});
 const foe=creature('brakk',8);foe.genes={hp:1,atk:1,speed:1,cd:1,...foe.genes,hp:25};
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes:[foe],phase:'prep',profile:{owned:['aurel','brakk'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto(offline?pathToFileURL(path.resolve('Starfall-Menagerie.html')).href:(process.env.BASE_URL||'http://127.0.0.1:3000'));
 let regular;
 if(!migration){
  await page.locator('[data-learn-skill]').first().waitFor();assert.equal(await page.locator('[data-learn-skill]').count(),3);const choices=await page.locator('[data-learn-skill]').evaluateAll(es=>es.map(e=>e.dataset.learnSkill));await page.reload();await page.locator('[data-learn-skill]').first().waitFor();assert.deepEqual(await page.locator('[data-learn-skill]').evaluateAll(es=>es.map(e=>e.dataset.learnSkill)),choices);
  for(let i=0;i<3;i++)await page.locator('[data-learn-skill]').first().click();await page.waitForTimeout(200);regular=await page.evaluate(()=>[...starfall.state.run.team[0].learnedSkills]);assert.equal(regular.length,3);
  await inspect(page);await page.locator('[data-evolve="warden"]').click();await page.locator('[data-action="evolution-back"]').click();await assertSlots(page,1);assert.deepEqual(await page.evaluate(()=>starfall.state.run.team[0].learnedSkills),regular);
  if(!offline)await page.screenshot({path:`${out}/first-evolution-${width}.png`});await page.locator('[data-detail-tab="overview"]').click();await page.locator('[data-evolve="warden"]').click();await page.locator('[data-action="evolution-back"]').click();await assertSlots(page,2);
 }else{await inspect(page);await assertSlots(page,2);regular=await page.evaluate(()=>[...starfall.state.run.team[0].learnedSkills]);assert.equal(regular.length,3);}
 assert.equal(await page.evaluate(()=>starfall.state.run.team[0].pendingSkills.length),0);assert.deepEqual(await page.evaluate(()=>starfall.state.run.team[0].learnedSkills),regular);
 if(!offline){await page.locator('.evolution-skill-bonuses').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${migration?'migrated':'second-evolution'}-${width}.png`});}
 await page.reload();await inspect(page);await assertSlots(page,2);assert.deepEqual(await page.evaluate(()=>starfall.state.run.team[0].learnedSkills),regular);assert.deepEqual(await page.evaluate(()=>starfall.state.run.team[0].chosenEvolutionSkills),['evolve-aurel-warden-1','evolve-aurel-warden-2']);
 await page.locator('.modal-close').click();await page.locator('[data-action="battle"]').click();await page.waitForFunction(()=>starfall.state.phase==='battle');await page.waitForTimeout(2000);
 assert.equal(await page.evaluate(()=>Object.keys(starfall.state.battle.units[0].cooldowns).length),6);assert.ok(await page.evaluate(()=>starfall.state.battle.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.atk))));
 const casts=await page.evaluate(()=>{const b=starfall.state.battle,u=b.units[0],target=b.units.find(v=>v.side!==u.side);for(const id of u.chosenEvolutionSkills)b.cast(u,id,target,1,false,true);return u.chosenEvolutionSkills.every(id=>id in u.cooldowns);});assert.ok(casts);
 if(!offline&&!migration)await page.screenshot({path:`${out}/combat-${width}.png`});assert.deepEqual(errors,[]);report.push({offline,width,migration,regularSpells:4,evolutionBonuses:2,automaticGrant:true,regularChoicesPreserved:true,noReplacementPrompt:true,separateMenuSection:true,persistence:true,liveCooldowns:6,bonusCasts:true,errors});const video=page.video();await context.close();if(video)await video.saveAs(out+'/evolution-bonuses-normal-speed.webm');
}}
finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
