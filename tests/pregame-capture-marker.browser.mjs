import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';
import {nativeSpawn} from '../native-combat.js';
import {pixelSpec} from '../native-content.js';
import {arenaCamera} from '../arena-camera.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3022',out='docs/evidence/pregame-capture-marker';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={checks:[],errors:[]};
try{
 for(const offline of [false,true])for(const [width,height]of [[1440,900],[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const run=makeRun(83,['aurel','brakk']);run.route=generateRoute(run);const foes=[creature('nyra'),creature('nyra')];
  await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes,phase:'prep',profile:{owned:['aurel','brakk'],tutorial:true}});
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.locator('.arena-dock').waitFor();
  const marker=page.locator('#pregame-capture-marker');assert.ok(await marker.isHidden());
  async function select(i){const r=await page.locator('#battle-canvas').boundingBox(),cam=arenaCamera(r.width,r.height),pos=nativeSpawn(pixelSpec(foes[i].id),foes[i],1,i);await page.mouse.click(r.x+(pos.x-cam.x)*cam.scale,r.y+(pos.y*.58+70-cam.y)*cam.scale);}
  await select(0);await marker.waitFor();assert.equal(await marker.getAttribute('data-target-uid'),foes[0].uid);assert.match(await marker.getAttribute('aria-label'),/Nyra at 25% HP/);
  await page.evaluate(()=>window.captureMarkerNode=document.querySelector('.capture-lock-spin'));
  const before=await page.locator('.capture-lock-spin').evaluate(el=>getComputedStyle(el).transform);await page.waitForTimeout(250);assert.notEqual(await page.locator('.capture-lock-spin').evaluate(el=>getComputedStyle(el).transform),before);assert.ok(await page.evaluate(()=>captureMarkerNode===document.querySelector('.capture-lock-spin')),'RAF preserves the running animation');
  assert.equal(await marker.evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  await select(1);assert.equal(await marker.getAttribute('data-target-uid'),foes[1].uid,'same-species enemies track by UID');await select(0);assert.equal(await marker.getAttribute('data-target-uid'),foes[0].uid);await select(1);
  await page.locator('#capture-tracker [data-action="capture-kit"]').first().click();await page.locator('#kit-capture-threshold').selectOption('15');await page.locator('.modal [data-action="close"]').last().click();assert.match(await marker.getAttribute('aria-label'),/15% HP/);
  if(!offline)await page.screenshot({path:`${out}/marker-${width}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1));
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.capture-lock-spin').evaluate(el=>getComputedStyle(el).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>document.body.classList.add('gentle-ui'));assert.equal(await page.locator('.capture-lock-badge').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.locator('[data-action="clear-capture"]').click();assert.ok(await marker.isHidden());await select(0);assert.ok(await marker.isVisible());
  await page.reload();await marker.waitFor();assert.equal(await marker.getAttribute('data-target-uid'),foes[0].uid);
  await page.locator('[data-action="battle"]').click();await page.waitForFunction(()=>document.querySelector('#pregame-capture-marker')?.hasAttribute('hidden'));assert.ok(await marker.isHidden());
  report.checks.push({offline,width,height,uidSwitch:true,animated:true,reducedMotion:true,clears:true,persists:true,hidesInBattle:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
