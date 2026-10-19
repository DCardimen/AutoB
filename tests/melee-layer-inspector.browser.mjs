import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.BASE_URL||'http://127.0.0.1:3054',root=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/melee-layer-review',out=root+'/checks',browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],badResponses=[];fs.mkdirSync(out,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push(r.status()+' '+r.url());});await page.goto(base+'/'+root+'/index.html');await page.waitForFunction(()=>document.querySelector('#meaning').textContent.includes('exact art'));
 await page.locator('#pause').click();await page.locator('#phase').fill('0.49');
 const ids=await page.locator('#family option').evaluateAll(es=>es.map(e=>e.value));let cases=0;
 for(const id of ids)for(const stage of [0,1,2])for(let dir=0;dir<8;dir++){
  await page.locator('#family').selectOption(id);await page.locator('#form').selectOption(String(stage));await page.locator('#direction').selectOption(String(dir));await page.waitForFunction(({id,stage,dir})=>document.querySelector('#meaning').textContent.startsWith(`${id} · exact art ${stage} · facing ${dir}.`),{id,stage,dir});
  assert.ok(await page.locator('#animated').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((n,i)=>i%4===3&&n>0)));cases++;
  if(['rogue','troll'].includes(id)&&stage===2&&dir===2){await page.locator('#layers input[value="left-arm"]').uncheck();await page.locator('#layers input[value="right-arm"]').uncheck();await page.screenshot({path:`${root}/${id}-evolved-limbs-hidden.png`});await page.locator('#layers input[value="left-arm"]').check();await page.locator('#layers input[value="right-arm"]').check();}
 }
 let shoulderComparisons=0;
 if(await page.locator('#shoulders').count())for(const id of ['troll','orc','dwarf','minotaur'])for(let dir=0;dir<8;dir++){
  await page.locator('#family').selectOption(id);await page.locator('#form').selectOption('2');await page.locator('#direction').selectOption(String(dir));await page.waitForFunction(({id,dir})=>document.querySelector('#meaning').textContent.startsWith(`${id} · exact art 2 · facing ${dir}.`),{id,dir});
  const moving=await page.locator('#animated').evaluate(c=>c.toDataURL());await page.locator('#shoulders').uncheck();await page.waitForFunction(last=>document.querySelector('#animated').toDataURL()!==last,moving);const fixed=await page.locator('#animated').evaluate(c=>c.toDataURL());await page.locator('#shoulders').check();await page.waitForFunction(last=>document.querySelector('#animated').toDataURL()!==last,fixed);shoulderComparisons++;
 }
 assert.equal(cases,168);assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);const report={status:'passed',cases,shoulderComparisons,errors,badResponses};fs.writeFileSync(out+'/inspector-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
