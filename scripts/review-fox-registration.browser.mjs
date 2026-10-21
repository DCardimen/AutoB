import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launchReviewBrowser} from './lib/review-browser.mjs';
const out='docs/evidence/meshy-fox-archer-v3',browser=await launchReviewBrowser();
try{
 const page=await browser.newPage();
 for(const [oldFile,newFile,name]of [['idle-eight-views.png','idle-eight-views.png','v2-v3-registration'],['nose-sniff-front.png','nose-sniff-front.png','v2-v3-sniff']]){
  const sources=[`docs/evidence/meshy-fox-archer-v2/${oldFile}`,`${out}/${newFile}`].map(p=>'data:image/png;base64,'+fs.readFileSync(p).toString('base64'));
  const result=await page.evaluate(async sources=>{const images=await Promise.all(sources.map(async src=>{const im=new Image();im.src=src;await im.decode();return im;}));const c=document.createElement('canvas');c.width=images[0].width;c.height=images.reduce((s,im)=>s+im.height+28,0);const g=c.getContext('2d');g.fillStyle='#172127';g.fillRect(0,0,c.width,c.height);let y=0;for(const [i,im]of images.entries()){g.fillStyle='#edf1e6';g.font='18px system-ui';g.fillText(i?'V3: pelvis socket, independent tail skin, nose-pad lift':'V2 reference',12,y+20);g.drawImage(im,0,y+28);y+=im.height+28;}return c.toDataURL().split(',')[1];},sources);fs.writeFileSync(`${out}/${name}.png`,Buffer.from(result,'base64'));
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:1100});await page.goto((process.env.BASE_URL||'http://127.0.0.1:3117')+'/public/meshy-fox-preview/animated.html');await page.waitForFunction(()=>window.foxAnimation?.ready);await page.locator('#acro').click();await page.waitForTimeout(700);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/mobile-combo.png`,fullPage:true});
 for(const time of [2.4,8,10.5]){const src='data:image/png;base64,'+fs.readFileSync(`${out}/combo-decoded-${time}.png`).toString('base64'),enlarged=await page.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width*2;c.height=im.height*2;c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL().split(',')[1];},src);fs.writeFileSync(`${out}/combo-decoded-${time}-enlarged.png`,Buffer.from(enlarged,'base64'));}
 assert.deepEqual(errors,[]);console.log('Original/current registration and sniff sheets, enlarged decoded combo frames, and mobile playback reviewed');
}finally{await browser.close();}
