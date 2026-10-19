import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PIXEL_SPECIES} from '../native-content.js';
import {MELEE_ARM_FAMILIES} from '../authored-parts.js';
const base=process.env.REVIEW_URL||'http://127.0.0.1:3054/public/melee-layer-review',errors=[],badResponses=[],links=new Set();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={pages:0,movieSelections:0,enlargedSelections:0,links:0,errors,badResponses};
try{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push([r.status(),r.url()]);});
 const pages=['index.html','combat.html',...PIXEL_SPECIES.filter(s=>MELEE_ARM_FAMILIES.has(s.nativeDesign)).map(s=>'companions/'+s.id+'.html'),'wild/review.html','warden/review.html'];
 for(const file of pages){await page.goto(base+'/'+file);if(file==='index.html')await page.waitForFunction(()=>document.querySelector('#meaning').textContent.includes('exact art'));await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));report.pages++;for(const href of await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.href)))if(href.startsWith(base+'/'))links.add(href.split('#')[0]);
  if(file.startsWith('companions/')){const names=await page.locator('#case option').evaluateAll(os=>os.map(o=>o.value));for(const name of names){await page.locator('#case').selectOption(name);await page.waitForFunction(n=>{const v=document.querySelector('video');return v.src.endsWith(n+'.mp4')&&v.readyState>=1;},name);const meta=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration}));assert.deepEqual(meta,{width:672,height:256,duration:6});report.movieSelections++;}}
  if(file.endsWith('/review.html')){await page.waitForFunction(()=>document.querySelector('video').readyState>=2);const hashes=new Set();for(const value of await page.locator('#family option').evaluateAll(os=>os.map(o=>o.value))){const old=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.locator('#family').selectOption(value);if(value!=='0')await page.waitForFunction(last=>document.querySelector('canvas').toDataURL()!==last,old);const hash=await page.locator('canvas').evaluate(c=>c.toDataURL());hashes.add(hash);report.enlargedSelections++;}assert.equal(hashes.size,7);}
  assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)),[]);
 }
 assert.equal(report.movieSelections,104);assert.equal(report.enlargedSelections,14);for(const link of links){if(link===base+'/checks/review-browser.json')continue;const r=await fetch(link);assert.ok(r.ok,`${r.status}: ${link}`);await r.arrayBuffer();report.links++;}assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
}finally{await browser.close();}
report.links++;fs.writeFileSync((process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/melee-layer-review')+'/checks/review-browser.json',JSON.stringify({status:'passed',...report},null,2)+'\n');const published=await fetch(base+'/checks/review-browser.json');assert.ok(published.ok);assert.equal((await published.json()).status,'passed');console.log(JSON.stringify(report));
