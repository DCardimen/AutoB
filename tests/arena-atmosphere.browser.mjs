import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute} from '../game.js';
import {nativeSpawn} from '../native-combat.js';
import {nativePoseRig} from '../native-poses.js';
import {pixelSpec} from '../native-content.js';
import {paintCharacterPixels,PIVOT} from '../prototype-pixel-art.js';
import {creatureWorldScale} from '../native-size.js';
import {arenaCamera} from '../arena-camera.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3020',out='playtest-artifacts/atmosphere-v2';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report={checks:[],errors:[]};
function saveFixture({phase='prep',type='elite',reduced=false}={}){
 const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.team.push({...creature('voltwing',5),seat:2,balanceVersion:17,equipmentVersion:2,equipment:[]});run.relics=['fangs'];run.route=generateRoute(run);run.captureTools={scout:5,runic:2,astral:2,mythic:3};run.orbs=12;
 const node=run.route[0][0];node.type=type;run.encounterType=type;
 const foes=[{...creature('solara',7),balanceVersion:17,equipmentVersion:2,equipment:['silver-fang'],equipmentQuality:.8}, {...creature('nyra',7),balanceVersion:17,equipmentVersion:2,equipment:[]}];
 return {version:7,run,node:phase==='map'?null:node,foes:phase==='map'?[]:foes,phase,profile:{owned:['aurel','brakk','voltwing','cogwalker'],tutorial:true,reducedMotion:reduced}};
}
async function open({offline=false,saved=saveFixture(),record=false}={}){
 const context=await browser.newContext({viewport:{width:1440,height:900},...(record?{recordVideo:{dir:out,size:{width:1440,height:900}}}:{})}),page=await context.newPage();page.setDefaultTimeout(30000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`)});
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},saved);
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.waitForFunction(()=>window.starfall);return {page,context};
}
async function fitArena(page,width,height){await page.setViewportSize({width,height});await page.waitForTimeout(180);
 const result=await page.evaluate(()=>{const buttons=[...document.querySelectorAll('.arena-dock button')];return {scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],screen:[innerWidth,innerHeight],buttons:buttons.map(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:el.dataset.action,inside:r.top>=0&&r.bottom<=innerHeight+1,clickable:top?.closest('button')===el}})}});
 assert.ok(result.scroll[0]<=width+1&&result.scroll[1]<=height+1,JSON.stringify(result));assert.ok(result.buttons.every(b=>b.inside&&b.clickable),JSON.stringify(result));
}
try{
 const {page:proof,context:proofContext}=await open();
 const proofResult=await proof.evaluate(async()=>{
  const {auraProfile,auraOrbit,paintRarityRing,paintRarityFlair}=await import('/rarity-aura.js'),{UI_ART}=await import('/ui-art-assets.js');
  await Promise.all(['aura-flair','aura-rings'].map(async key=>{const im=new Image();im.src=UI_ART[key];await im.decode()}));
  const c=document.createElement('canvas');c.width=c.height=150;const ctx=c.getContext('2d'),profile=auraProfile('Legendary');paintRarityRing(ctx,75,100,profile,1);await new Promise(r=>setTimeout(r,150));ctx.clearRect(0,0,150,150);paintRarityRing(ctx,75,100,profile,1);const ringA=c.toDataURL();ctx.clearRect(0,0,150,150);paintRarityRing(ctx,75,100,profile,1);const ringB=c.toDataURL();
  ctx.clearRect(0,0,150,150);paintRarityFlair(ctx,75,100,Math.PI*1.5/.85,profile,1);const rear=ctx.getImageData(0,0,150,150).data.some((v,i)=>i%4===3&&v>0);
  paintRarityFlair(ctx,75,100,Math.PI*.5/.85,profile,1);await new Promise(r=>setTimeout(r,150));paintRarityFlair(ctx,75,100,Math.PI*.5/.85,profile,1);const front=ctx.getImageData(0,0,150,150).data.some((v,i)=>i%4===3&&v>0);
  const {drawNativeUnit,nativeUnitHit}=await import('/native-art.js'),{SPECIES}=await import('/game.js'),{PIXEL_SPECIES}=await import('/native-content.js'),{nativeSpawn}=await import('/native-combat.js'),{creatureWorldScale}=await import('/native-size.js'),{PIVOT}=await import('/prototype-pixel-art.js');
  const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d');let checked=0;
  for(const spec of PIXEL_SPECIES)for(let evolution=0;evolution<=2;evolution++)for(let dir=0;dir<8;dir++){
   const u={id:spec.id,level:8,evolution,evolutionPath:'wild',side:0,facing:dir*Math.PI/4,deploymentPosition:{x:270,y:220}},p=nativeSpawn(spec,u,0,0),scale=3*creatureWorldScale(spec,u);sc.clearRect(0,0,64,64);drawNativeUnit(sc,u,spec,PIVOT.x,PIVOT.y,0,1);const pixels=sc.getImageData(0,0,64,64).data;let n=-1;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>180){n=(i-3)/4;break;}if(n<0)throw new Error('No authored pixels: '+spec.id);
   const x=n%64,y=Math.floor(n/64);if(!nativeUnitHit(u,spec,{x:p.x+(x-PIVOT.x)*scale,y:p.y*.58+75+(y-PIVOT.y)*scale},0,0))throw new Error('Unclickable top pixel: '+spec.id+' '+evolution+' '+dir);checked++;
  }
  return {ringStationary:ringA===ringB,rearInvisible:!rear,frontVisible:front,checked,expected:PIXEL_SPECIES.length*3*8};
 });assert.ok(proofResult.ringStationary&&proofResult.rearInvisible&&proofResult.frontVisible,JSON.stringify(proofResult));assert.equal(proofResult.checked,proofResult.expected);console.log(proofResult);report.checks.push(`Actual alpha hit masks cover ${proofResult.checked} family/form/facing top-edge cases; aura ring fixed, rear flair 0 pixels, front flair visible`);await proofContext.close();
 for(const offline of [false,true]){
  console.log('Checking atmosphere',offline?'offline':'source');const {page,context}=await open({offline,record:!offline});
  for(const [w,h]of [[1440,900],[1280,720],[390,844],[320,568]])await fitArena(page,w,h);
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(300);await page.screenshot({path:`${out}/${offline?'offline':'source'}-auras-prep.png`});
  const high=await page.evaluate(()=>{const c=starfall.state.run.team[0];c.deploymentPosition={x:210,y:220};return c;});await page.waitForTimeout(100);
  const spec=pixelSpec(high.id),rig=nativePoseRig(spec,high,'idle',.25),pixels=paintCharacterPixels(rig.id,rig,0);let best=Infinity,hit=0;
  for(let n=0;n<4096;n++)if(pixels[n*4+3]>180){const distance=Math.hypot(n%64-32,Math.floor(n/64)-26);if(distance<best){best=distance;hit=n}}
  const spawn=nativeSpawn(spec,high,0,0),scale=3*creatureWorldScale(spec,high),rect=await page.locator('#battle-canvas').boundingBox(),camera=arenaCamera(rect.width,rect.height),x=rect.x+(spawn.x+(hit%64-PIVOT.x)*scale-camera.x)*camera.scale,y=rect.y+(spawn.y*.58+75+(Math.floor(hit/64)-PIVOT.y)*scale-camera.y)*camera.scale;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+70,y+25,{steps:10});await page.waitForTimeout(100);await page.mouse.up();assert.ok(await page.evaluate(()=>starfall.state.run.team[0].deploymentPosition.x>225),'high companion remains selectable and draggable');

  await page.locator('.arena-dock [data-action="companions"]').click();await page.locator('[data-party-select="0"]').click();await page.locator('[data-action="inspect-selected"]').click();await page.locator('[data-stat-preview="atk"]').hover();await page.locator('[data-stat-preview="atk"] .stat-level-preview').waitFor();assert.match(await page.locator('[data-stat-preview="atk"] .stat-level-preview').textContent(),/Level 2:/);await page.waitForTimeout(350);await page.screenshot({path:`${out}/${offline?'offline':'source'}-level-preview.png`});await page.locator('.modal-close').click();
  await page.locator('.arena-dock [data-action="capture-kit"]').click();const uid=await page.evaluate(()=>starfall.state.foes[0].uid);await page.locator('#kit-capture-target').selectOption(uid);await page.locator('[data-capture-method="mythic"]').click();await page.locator('.modal-close').click();
  assert.equal(await page.locator('#capture-tracker').evaluate(el=>!!el.closest('.arena-viewport')),false);assert.ok(await page.locator('#capture-tracker').evaluate(el=>el.getBoundingClientRect().height<190),JSON.stringify(await page.locator('#capture-tracker').evaluate(el=>({height:el.getBoundingClientRect().height,children:[...el.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().height>30).map(e=>({tag:e.tagName,cls:e.className,height:e.getBoundingClientRect().height}))}))));await page.locator('[data-action="capture-tracker-toggle"]').click();assert.ok(await page.locator('#capture-tracker').evaluate(el=>el.getBoundingClientRect().height<60));await page.locator('[data-action="capture-tracker-toggle"]').click();
  for(const [w,h]of [[1440,900],[390,844],[320,568]])await fitArena(page,w,h);await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(200);
  await page.locator('[data-action="battle"]').click();await page.locator('[data-action="pause"]').click();for(const [w,h]of [[1440,900],[390,844],[320,568]])await fitArena(page,w,h);await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(200);await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.units){u.speed=0;u.attackTimer=9999;u.dodgeCooldown=9999;Object.values(u.cooldowns).forEach(cd=>cd.remaining=9999)}const t=b.units.find(u=>u.uid===b.capturePlan.uid);t.hp=t.maxHp*.2;b.random=()=>0;b.attemptCapture();});await page.locator('[data-action="pause"]').click();await page.locator('.capture-celebration[data-rarity="Legendary"]').waitFor();await page.waitForTimeout(450);await page.screenshot({path:`${out}/${offline?'offline':'source'}-legendary-capture.png`});assert.equal(await page.locator('#capture-feedback').textContent(),'');await page.waitForTimeout(3100);
  await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,1e6,b.living(0)[0],null,1,'status');b.step(.04)});await page.locator('.reward-screen').waitFor();await page.waitForTimeout(550);
  const blends=await page.locator('.reward-chest .chest-frame').evaluateAll(imgs=>imgs.map(img=>+getComputedStyle(img).opacity));assert.ok(blends.some(n=>n>0&&n<1),JSON.stringify(blends));assert.equal(await page.locator('.summit-foliage').count(),2);await page.waitForTimeout(2900);await page.screenshot({path:`${out}/${offline?'offline':'source'}-mountaintop-rewards.png`,fullPage:true});
  assert.ok(await page.locator('.loot-drop .loot-medallion img').evaluateAll(imgs=>imgs.every(img=>{const r=img.getBoundingClientRect(),p=img.closest('.loot-drop').getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1&&r.top>=p.top-1&&r.bottom<=p.bottom+1})));
  await page.locator('[data-action="claim-loot"]').click();await page.locator('.loot-cache.collected').waitFor();const option=page.locator('[data-upgrade^="relic:"]').first(),id=(await option.getAttribute('data-upgrade')).split(':')[1];await option.click();await page.locator(`[data-relic-received="${id}"]`).waitFor();await page.waitForTimeout(1600);await page.locator('[data-action="continue"]').click();await page.locator('.reference-map').waitFor();assert.equal(await page.locator(`[data-relic-preview="${id}"]`).getAttribute('data-new-relic'),'true');
  assert.ok(await page.locator('.reference-map').evaluate(el=>el.style.getPropertyValue('--route-art').length>10));await page.waitForTimeout(2500);await page.screenshot({path:`${out}/${offline?'offline':'source'}-grasslands-relic-arrival.png`,fullPage:true});
  const stage=page.locator('[data-field-node].available').first();const stageId=await stage.getAttribute('data-field-node');await page.evaluate(()=>window.routeCanvas=document.querySelector('.biome-route>.background-motion'));await stage.click();assert.equal(await page.evaluate(()=>starfall.state.phase),'map');assert.equal(await page.locator(`[data-field-node="${stageId}"]`).getAttribute('aria-pressed'),'true');assert.ok(await page.evaluate(()=>routeCanvas===document.querySelector('.biome-route>.background-motion')));await page.waitForTimeout(800);await page.locator(`[data-field-node="${stageId}"]`).click();await page.waitForTimeout(400);assert.ok(await page.locator('.biome-route').evaluate(el=>getComputedStyle(el).transform!=='none'));await page.waitForTimeout(1100);assert.notEqual(await page.evaluate(()=>starfall.state.phase),'map');
  report.checks.push(`${offline?'Offline':'Source'}: no-scroll arena at four sizes, unobstructed controls, compact external capture box, next-level tooltip, faint battle auras, legendary celebration, blended chest, summit foliage, contained reward art, relic flight and map arrival, restored animated grasslands, two-click route lock and gradual zoom`);
  const video=page.video();await context.close();if(video)await video.saveAs(out+'/atmosphere-normal-speed.webm');
 }
 // Every encounter kind locks on the first click and enters only on the second.
 for(const type of ['battle','elite','capture','boss','shop','event','rest']){
  const {page,context}=await open({saved:saveFixture({phase:'map',type,reduced:true})});const stage=page.locator('[data-field-node].available').first();await stage.click();assert.equal(await page.evaluate(()=>starfall.state.phase),'map',type+' first click');await page.locator('[data-field-node].route-locked').click();await page.waitForFunction(()=>starfall.state.phase!=='map');assert.equal(await page.evaluate(()=>starfall.state.node.type),type);await context.close();
 }
 report.checks.push('All seven encounter types require first-click lock and second-click entry, including reduced motion');assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));await browser.close()}
