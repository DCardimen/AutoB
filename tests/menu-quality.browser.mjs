import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeRun,creature,generateRoute,encounter,SPECIES} from '../game.js';
import {CREATURE_GEAR} from '../creature-equipment.js';
import {AURA_STONES} from '../aura-stones.js';
const out=process.env.MENU_REVIEW_OUT||'playtest-artifacts/pass-three/menus';fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
async function fits(page,selector){assert.ok(await page.locator(selector).evaluate(el=>el.scrollWidth<=el.clientWidth+1),selector+' has no horizontal overflow');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
try{for(const offline of process.env.MENU_SOURCE_ONLY?[false]:[false,true])for(const width of [1440,768,390]){
 const label=`${offline?'offline':'source'}-${width}`,context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,recordVideo:width===390?{dir:out,size:{width,height:900}}:undefined}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.team.push({...creature('nyra'),seat:2});run.bench=[creature('syl')];run.route=generateRoute(run);run.expeditionStarted=true;run.openingRelic={decision:'test'};run.gold=1500;
 run.gearInventory=CREATURE_GEAR.slice(0,16).map((g,i)=>({uid:'gear'+i,id:g.id,quality:1}));run.inventory=AURA_STONES.slice(0,12).map((g,i)=>({uid:'stone'+i,id:g.id,tier:i%4+1}));
 const node=run.route[0][0],owned=['aurel','brakk','syl','rowan','nyra','solara','mossguard'];
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned,tutorial:true,bonds:{syl:5,aurel:2},reducedMotion:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():(requests.push(r.request().url()),r.abort()));
 await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.waitForFunction(()=>window.starfall);
 assert.ok(await page.locator('.brand-mark img').evaluate(img=>img.complete&&img.naturalWidth>0),'shared logo loads');
 if(offline){assert.equal(await page.locator('[data-offline-logo]').count(),1,'intro has finished; header still uses the shared embedded logo');assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'),await page.locator('.brand-mark img').getAttribute('src'),'favicon reuses the embedded logo');}else assert.equal((await page.request.get(new URL(await page.locator('link[rel="icon"]').getAttribute('href'),base).href)).status(),200,'favicon resolves');
 await page.locator('[data-view="collection"]').first().click();await page.locator('#collection-search').waitFor();await fits(page,'#view');
 assert.equal(await page.locator('.codex-card').count(),SPECIES.length);assert.ok(!(await page.locator('.codex-card').first().getAttribute('class')).includes('locked'));
 await page.locator('#collection-search').fill('Brakk');assert.equal(await page.locator('.codex-card').count(),1);assert.equal(await page.locator('.codex-card strong').innerText(),'Brakk');assert.equal(await page.evaluate(()=>document.activeElement.id),'collection-search');
 await page.locator('#collection-search').fill('this family does not exist');await page.locator('.collection-empty').waitFor();await page.locator('[data-action="reset-collection"]').click();
 await page.locator('[data-filter="owned"]').click();assert.equal(await page.locator('.codex-card').count(),(await page.evaluate(()=>starfall.state.profile.owned)).filter(id=>SPECIES.some(s=>s.id===id)).length);
 await page.locator('#collection-sort').selectOption('bond');assert.equal(await page.locator('.codex-card').first().getAttribute('data-codex'),'syl');
 await page.locator('#collection-sort').selectOption('rarity');assert.equal(await page.locator('.codex-card').first().getAttribute('data-codex'),'solara');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${label}-menagerie.png`});
 await page.locator('[data-codex="solara"]').click();await page.locator('.modal').waitFor();await fits(page,'.modal');await page.locator('.modal-close').click();
 await page.locator('[data-view="arena"]').first().click();await page.locator('[data-action="companions"]').first().click();await page.locator('.companions-layout').waitFor();await fits(page,'.modal');
 if(width<1051){
  await page.locator('[data-companion-jump="pack"]').click();assert.ok(await page.locator('.inventory-sidebar').evaluate(el=>el.getBoundingClientRect().top>=0&&el.getBoundingClientRect().top<innerHeight-100),'pouches reached without scrolling through every equipment field');
  await page.locator('[data-companion-jump="reserves"]').click();assert.ok(await page.locator('.reserve-panel').evaluate(el=>el.getBoundingClientRect().top>=0&&el.getBoundingClientRect().top<innerHeight-80),'reserves shortcut is reachable');
  await page.locator('[data-companion-jump="equipment"]').click();
 }
 if(width===390){assert.ok(await page.locator('.modal-close').evaluate(el=>{const b=el.getBoundingClientRect();return b.top>=0&&b.top<80;}),'close stays visible after section jumps');const slots=page.locator('.character-attachments .equipment-slot');assert.equal(await slots.count(),5);const first=await slots.nth(0).boundingBox(),second=await slots.nth(1).boundingBox();assert.ok(Math.abs(first.y-second.y)<2&&second.x>first.x,'phone equipment uses compact paired fields');}
 await page.screenshot({path:`${out}/${label}-companions.png`});await page.locator('.modal-close').click();
 // Enter an actual outpost through the saved encounter phase, preserving its
 // normal stock generator and purchase handlers rather than a static mock.
 await page.evaluate(()=>{const key='starfall-menagerie-v1',saved=JSON.parse(localStorage.getItem(key));saved.phase='shop';saved.node.type='shop';saved.shopStock=null;localStorage.setItem(key,JSON.stringify(saved));});await page.reload();await page.locator('.modal[data-kind="shop"]').waitFor();await fits(page,'.modal');
 await page.screenshot({path:`${out}/${label}-shop-top.png`});
 const gold=await page.evaluate(()=>starfall.state.run.gold),tools=await page.evaluate(()=>starfall.state.run.orbs);await page.locator('[data-action="buy-orb"]').click();assert.ok(await page.evaluate(()=>starfall.state.run.gold)<gold);assert.equal(await page.evaluate(()=>starfall.state.run.orbs),tools+1);
 await page.screenshot({path:`${out}/${label}-shop.png`});await page.locator('[data-action="field-care"]').first().click();assert.match(await page.locator('.modal[data-kind="care"]').innerText(),/deployed starter/);assert.equal(await page.locator('[data-action="hospital-upgrade"]').count(),0);
 assert.deepEqual(errors,[]);if(offline)assert.deepEqual(requests,[]);
 report.push({label,search:true,sort:true,emptyRecovery:true,companionShortcuts:true,realPurchase:true,sharedLogo:true,noOverflow:true,errors,requests});
 const video=page.video();await context.close();if(video)await video.saveAs(`${out}/${label}.webm`);
}}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
