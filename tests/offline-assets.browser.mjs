import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {journeyFixture} from './journey-fixture.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:3000',report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 for(const offline of [false,true]){
  const {page,context,errors,requests}=await journeyFixture(browser,{base,offline});
  const assets=await page.evaluate(async()=>{
   const fonts=[];
   for(const family of ['DM Sans','DM Serif Display']){
    const loaded=await document.fonts.load(`400 12px "${family}"`);
    fonts.push({family,loaded:loaded.length>0&&loaded.every(font=>font.status==='loaded')});
   }
   const icons=[...document.querySelectorAll('.main-nav button>span')].map(el=>getComputedStyle(el).backgroundImage);
   const src=icons[0].match(/^url\(["']?(.*?)["']?\)$/)?.[1];
   if(!src)throw Error('Arena icon atlas did not resolve');
   const img=new Image();img.src=src;await img.decode();
   const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);
   return {fonts,sharedAtlas:icons.every(url=>url===icons[0]),blob:src.startsWith('blob:'),width:c.width,height:c.height,png:c.toDataURL().split(',')[1]};
  });
  assert.ok(assets.fonts.every(font=>font.loaded),'authored fonts load in both builds');
  assert.ok(assets.sharedAtlas,'navigation icons share the atlas');
  assert.equal(assets.blob,offline);
  const hash=crypto.createHash('sha256').update(Buffer.from(assets.png,'base64')).digest('hex');
  delete assets.png;
  if(offline){assert.equal(hash,report[0].hash,'offline atlas pixels exactly match source');assert.ok(requests.every(url=>url===base+'/Starfall-Menagerie.html'));}
  assert.deepEqual(errors,[]);report.push({offline,...assets,hash});await context.close();
 }
 console.log(JSON.stringify(report,null,2));
}finally{fs.mkdirSync('playtest-artifacts',{recursive:true});fs.writeFileSync('playtest-artifacts/offline-assets.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
