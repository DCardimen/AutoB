import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';
const directory='docs/evidence/meshy-fox-archer-v3',browser=await launchReviewBrowser(),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1000,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.BASE_URL||'http://127.0.0.1:3117')+'/public/meshy-fox-preview/animated.html');await page.waitForFunction(()=>window.foxAnimation?.ready);
 const duration=await page.evaluate(()=>{const a=foxAnimation;a.combo(true);a.renderer.setSize(768,768,false);a.camera.aspect=1;a.camera.updateProjectionMatrix();return a.routine.duration;});
 const writer=webmWriter(`${directory}/acrobatic-combo.webm`,{fps:30,bitrate:'1800k'});
 for(let i=0;i<Math.ceil(duration*30);i++)writer.write(Buffer.from(await page.evaluate(()=>{const a=foxAnimation;a.stepCombo(1/60);a.stepCombo(1/60);a.renderer.render(a.scene,a.camera);const out=document.createElement('canvas');out.width=out.height=768;const c=out.getContext('2d');c.drawImage(a.renderer.domElement,0,0);c.font='19px system-ui';c.fillStyle='#edf1e6';c.fillText(document.querySelector('#stage').textContent,20,32);return out.toDataURL('image/jpeg',.88).split(',')[1];}),'base64'));
 await writer.finish();const history=await page.evaluate(()=>foxAnimation.routine.actor.history);
 const marks=[.7,2.4,3.6,5.5,8.0,10.5,12.4,14.9],data=fs.readFileSync(`${directory}/acrobatic-combo.webm`).toString('base64');
 const decoded=await page.evaluate(async([data,marks])=>{const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});const frames=[];for(const t of marks){await new Promise(r=>{v.onseeked=r;v.currentTime=t;});const c=document.createElement('canvas');c.width=c.height=768;c.getContext('2d').drawImage(v,0,0);frames.push({time:t,image:c.toDataURL().split(',')[1]});}v.currentTime=0;await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalSpeed=v.playbackRate===1&&v.currentTime-start>.8;v.pause();return {frames,normalSpeed};},[data,marks]);
 for(const frame of decoded.frames)fs.writeFileSync(`${directory}/combo-decoded-${frame.time}.png`,Buffer.from(frame.image,'base64'));
 const sheet=await page.evaluate(async frames=>{const c=document.createElement('canvas');c.width=1024;c.height=560;const g=c.getContext('2d');g.fillStyle='#202d32';g.fillRect(0,0,c.width,c.height);for(const [i,f]of frames.entries()){const im=new Image();im.src='data:image/png;base64,'+f.image;await im.decode();const x=i%4*256,y=Math.floor(i/4)*280;g.drawImage(im,x,y+24,256,256);g.fillStyle='#fff';g.font='16px system-ui';g.fillText(`${f.time}s`,x+10,y+19);}return c.toDataURL().split(',')[1];},decoded.frames);fs.writeFileSync(`${directory}/combo-decoded-sheet.png`,Buffer.from(sheet,'base64'));
 const report={assetSHA256:createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-animated.glb')).digest('hex'),errors,duration,fps:30,normalSpeedPlayback:decoded.normalSpeed,history};fs.writeFileSync(`${directory}/combo-review.json`,JSON.stringify(report,null,2));assert.deepEqual(errors,[]);assert.ok(decoded.normalSpeed);for(const mode of ['run','dash','sideFlipLeft','sideFlipRight','vault','jumpShot','slideShot','crouchVolley','duck','runStopTurnLeft'])assert.ok(history.some(h=>h.mode===mode),mode);console.log('Acrobatic runtime combo recorded, decoded and played at normal speed');
 // Test the visible entry point and return to the ordinary action viewer.
 await page.locator('#acro').click();await page.waitForTimeout(100);await page.selectOption('#action','walk');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>foxAnimation.mode),'walk');assert.deepEqual(errors,[]);
}finally{await browser.close();}
