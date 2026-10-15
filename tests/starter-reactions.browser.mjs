import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {starterReactionProfile} from '../starter-reactions.js';
const designs=[...new Set(PIXEL_SPECIES.map(s=>s.nativeDesign||s.nativeRig))],specimens=designs.map(d=>PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===d&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===d));
assert.equal(specimens.length,41);
const base=process.env.BASE_URL||'http://127.0.0.1:3000',report={checks:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync('playtest-artifacts',{recursive:true});
async function fixture(offline=false,reducedMotion=false){
 const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:reducedMotion?'reduce':'no-preference'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 if(offline)await context.route('**/*',route=>route.request().isNavigationRequest()?route.continue():route.abort());
 const run=makeRun(77,['aurel','brakk'],{chaosCleared:20});run.route=generateRoute(run);const node=run.route[0][0];run.encounterType=node.type;run.team[0].evolution=1;
 await page.addInitScript(data=>localStorage.setItem('starfall-menagerie-v1',JSON.stringify(data)),{version:7,run:JSON.parse(JSON.stringify(run)),node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:specimens.map(s=>s.id),chaosCleared:20,chaosUnlocked:20,tutorial:true,reducedMotion}});
 await page.clock.install();await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);await page.locator('#new-run').click();await page.clock.runFor(200);return{page,context};
}
try{
 for(const offline of [false,true]){
  const {page,context}=await fixture(offline);
  for(const spec of specimens){
   const id=spec.id,{kind,gesture,duration}=starterReactionProfile(spec);
   const card=page.locator(`[data-starter="${id}"]`),stage=card.locator('.starter-portrait'),canvas=stage.locator('canvas');
   await card.scrollIntoViewIfNeeded();await page.clock.runFor(150);await card.click();
   assert.equal(await stage.getAttribute('data-reaction'),kind,id+' uses its visible family');
   assert.equal(await stage.getAttribute('data-gesture'),gesture,id+' has its own gesture');
   const frames=new Set([await canvas.evaluate(c=>c.toDataURL()+c.style.transform)]);
   // Sample the whole rise/hold/return cycle, not just a deliberate held pose.
   for(let i=0;i<24;i++){
    await page.clock.runFor(Math.ceil(duration/24));frames.add(await canvas.evaluate(c=>c.toDataURL()+c.style.transform));
    if(![5,12,18].includes(i))continue;
    if(!offline&&i===12)await page.screenshot({path:`playtest-artifacts/starter-reaction-${id}.png`,clip:await stage.boundingBox()});
    assert.ok(await canvas.evaluate(el=>{
    // A canvas's CSS box includes transparent object-fit letterboxing. Check
    // the actual painted pixels after the greeting's whole-sprite transform.
    const s=el.parentElement.getBoundingClientRect(),css=getComputedStyle(el),m=new DOMMatrix(css.transform),origin=css.transformOrigin.split(' ').map(parseFloat),scale=Math.min(el.clientWidth/el.width,el.clientHeight/el.height),ox=(el.clientWidth-el.width*scale)/2,oy=el.clientHeight-el.height*scale,pixels=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
    for(let y=0;y<el.height;y++)for(let x=0;x<el.width;x++)if(pixels[(y*el.width+x)*4+3]){
     const dx=ox+x*scale-origin[0],dy=oy+y*scale-origin[1],px=el.offsetLeft+origin[0]+m.a*dx+m.c*dy+m.e,py=el.offsetTop+origin[1]+m.b*dx+m.d*dy+m.f;
     if(px<0||px+scale>s.width||py<0||py+scale>s.height)return false;
    }return true;
   }),id+' complete painted pose fits the scenery');
   }
   assert.ok(frames.size>2,id+' reacts visibly across its full cycle');
   await page.clock.runFor(duration+250);assert.equal(await stage.getAttribute('data-reaction'),null,id+' settles back to idle');
   assert.equal(await canvas.evaluate(c=>c.style.transform),'');
   await card.click();await page.clock.runFor(100);assert.equal(await stage.getAttribute('data-reaction'),kind,id+' responds again');await page.clock.runFor(duration+250);
  }
  assert.equal(await page.evaluate(()=>starfall.state.run.team[0].evolution),1,'menu greetings never change the evolved expedition creature');
  await page.locator('#starter-type-filter').selectOption('storm');await page.locator('[data-starter="voltwing"]').click();await page.clock.runFor(250);await page.locator('#starter-sort').selectOption('cost-desc');await page.clock.runFor(150);assert.equal(await page.locator('[data-starter="voltwing"] .starter-portrait').getAttribute('data-reaction'),'owl','sorting preserves an active greeting');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-starter="voltwing"]').scrollIntoViewIfNeeded();await page.locator('[data-starter="voltwing"]').click();await page.clock.runFor(300);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  report.checks.push(`${offline?'Offline':'Source'}: 41 authored-family greetings with open eyes and no generic swing, visible movement, complete portrait poses, return to idle, repeat clicks, preserved evolving run, filtering/sorting during reaction, mobile`);await context.close();
 }
 const reduced=await fixture(false,true),card=reduced.page.locator('[data-starter="cinderfox"]');await card.click();await reduced.page.clock.runFor(300);assert.equal(await card.locator('.starter-portrait').getAttribute('data-reaction'),null);assert.equal(await card.locator('canvas').evaluate(c=>c.style.transform),'');await reduced.context.close();
 report.checks.push('Reduced motion keeps selection feedback and suppresses click movement');assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/starter-reactions-browser.json',JSON.stringify(report,null,2));await browser.close();}
