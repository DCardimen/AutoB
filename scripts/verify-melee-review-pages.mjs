import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=process.env.REVIEW_URL||'http://127.0.0.1:3050';
const out='public/melee-arm-review',expected=JSON.parse(fs.readFileSync(out+'/checks/individual-combat.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const errors=[],mediaRangeCancellations=[],links=new Set(),pages=[],movies=[],families=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 // Chrome cancels a media range after satisfying preload or replacing the selection.
 // Every such URL must still pass its HEAD/range and decoded-metadata checks below.
 page.on('requestfailed',r=>{if(r.resourceType()==='media'&&r.failure()?.errorText==='net::ERR_ABORTED')mediaRangeCancellations.push(r.url());else errors.push(r.url()+': '+r.failure()?.errorText);});
 const queue=['/index.html'],visited=new Set();
 while(queue.length){
  const route=queue.shift();if(visited.has(route))continue;visited.add(route);
  const response=await page.goto(root+route);assert.equal(response.status(),200,route);
  await page.locator('img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode()));for(const i of images)if(!i.naturalWidth||!i.naturalHeight)throw new Error('Missing image '+i.src);});
  const found=await page.locator('a[href],img[src],video[src]').evaluateAll(nodes=>nodes.map(n=>n.href||n.src));
  for(const url of found){assert.equal(new URL(url).origin,new URL(root).origin);links.add(url);if(new URL(url).pathname.endsWith('.html'))queue.push(new URL(url).pathname);}
  if(route.startsWith('/companions/')){
   assert.equal(await page.locator('table tr').count(),6,route+' five-factor table');
   const names=await page.locator('#case option').evaluateAll(nodes=>nodes.map(n=>n.value));
   for(const name of names){
    await page.selectOption('#case',name);
    await page.waitForFunction(()=>{const v=document.querySelector('#movie');return v.readyState>=2&&v.videoWidth===672&&v.videoHeight===256&&Math.abs(v.duration-6)<.1;});
    const record=await page.evaluate(()=>{const v=document.querySelector('#movie');return {name:document.querySelector('#case').value,width:v.videoWidth,height:v.videoHeight,duration:v.duration,url:v.currentSrc,game:document.querySelector('#game').href,contact:document.querySelector('#contact').href};});
    assert.ok(record.url.endsWith('/'+name+'.mp4'));assert.ok(record.game.endsWith('/'+name+'-game.png'));assert.ok(record.contact.endsWith('/'+name+'-contact.png'));
    movies.push(record);for(const url of [record.url,record.game,record.contact])links.add(url);
   }
   await page.selectOption('#case',names[0]);
  }
  if(route.endsWith('/review.html')){
   await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
   const ids=await page.locator('#family option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,id:n.textContent})));
   assert.equal(ids.length,7);
   for(const family of ids){
    await page.selectOption('#family',family.value);
    await page.evaluate(async()=>{const v=document.querySelector('video');const done=new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));v.currentTime=v.currentTime===7.8?7.9:7.8;await done;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
    const opaque=await page.locator('canvas').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n;});
    assert.ok(opaque>1000,route+' '+family.id+' enlarged view');families.push({page:route,id:family.id,opaque});
   }
  }
  if(['/index.html','/companions/aurel.html','/companions/sable.html','/companions/grum.html'].includes(route))await page.screenshot({path:'playtest-artifacts/melee-arms/page-'+route.split('/').pop().replace('.html','.png'),fullPage:true});
  pages.push({route,images:await page.locator('img').count()});
 }
 assert.equal(pages.length,15);assert.equal(movies.length,104);
 assert.deepEqual(movies.map(c=>c.name).sort(),expected.cases.map(c=>c.name).sort());
 const checked=[];
 for(const url of links){
  const r=await fetch(url,{method:'HEAD'});assert.equal(r.status,200,url);assert.ok(Number(r.headers.get('content-length'))>0,url);checked.push({path:new URL(url).pathname,status:r.status});
  if(url.endsWith('.mp4')){const range=await fetch(url,{headers:{Range:'bytes=0-31'}});assert.equal(range.status,206,url+' scrubbing');assert.equal((await range.arrayBuffer()).byteLength,32);}
 }
 assert.deepEqual(errors,[]);assert.ok(mediaRangeCancellations.every(url=>links.has(url)));
 const report={status:'passed',inputs:expected.inputs,pages,links:checked,movies,families,errors,mediaRangeCancellations};
 fs.writeFileSync(out+'/checks/review-browser.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:'passed',pages:pages.length,links:links.size,individualMovies:movies.length,enlargedFamilyViews:families.length,errors}));
}finally{await browser.close();}
