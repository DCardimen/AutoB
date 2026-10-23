import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';
const out=process.env.BIPED_REVIEW_OUT||'docs/evidence/fox-biped1';fs.mkdirSync(out,{recursive:true});
const assetSHA256=createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-biped.glb')).digest('hex');
const browser=await launchReviewBrowser(),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1000,height:800}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:3117')+'/public/meshy-fox-preview/animated.html');await page.waitForFunction(()=>window.foxBiped?.ready);
 const clips=await page.evaluate(()=>{foxBiped.pause();return foxBiped.asset.animations.map(c=>({name:c.name,duration:c.duration}))});
 for(const clip of clips){
  const image=await page.evaluate(clip=>{
   const a=foxBiped;a.pause();const size=320,c=document.createElement('canvas');c.width=size*4;c.height=(size+24)*2;const ctx=c.getContext('2d');a.renderer.setSize(size,size,false);a.camera.aspect=1;a.camera.position.set(0,.9,3.5);a.camera.lookAt(0,.65,.1);a.camera.updateProjectionMatrix();
   const t=clip.name.includes('Shot')||clip.name.includes('Volley')||clip.name.startsWith('Bow_Attack')?Math.min(1.15,clip.duration*.55):clip.duration*.47;
   for(let i=0;i<8;i++){a.action(clip.name);a.yaw(i*Math.PI/4);a.seek(t);a.renderer.render(a.scene,a.camera);const x=i%4*size,y=Math.floor(i/4)*(size+24);ctx.fillStyle='#202d32';ctx.fillRect(x,y,size,size+24);ctx.drawImage(a.renderer.domElement,x,y+24);ctx.fillStyle='white';ctx.font='14px system-ui';ctx.fillText(clip.name+' · '+['S','SE','E','NE','N','NW','W','SW'][i],x+8,y+17);}return c.toDataURL().split(',')[1];
  },clip);fs.writeFileSync(`${out}/${clip.name}-eight-views.png`,Buffer.from(image,'base64'));
 }
 const writer=webmWriter(`${out}/all-actions.webm`,{fps:30,bitrate:'1400k'}),chapters=[];let elapsed=0;
 for(const clip of clips){
  const duration=clip.duration;chapters.push({...clip,start:elapsed,reviewDuration:duration});
  await page.evaluate(name=>{const a=foxBiped;a.action(name);a.yaw(0);a.renderer.setSize(640,640,false);a.camera.aspect=1;a.camera.position.set(1.8,1.1,3.5);a.camera.lookAt(0,.65,.15);a.camera.updateProjectionMatrix()},clip.name);
  for(let i=0;i<Math.ceil(duration*30);i++)writer.write(Buffer.from(await page.evaluate(t=>{const a=foxBiped;a.seek(t);a.renderer.render(a.scene,a.camera);return a.renderer.domElement.toDataURL('image/jpeg',.86).split(',')[1]},Math.min(i/30,clip.duration-1e-6)),'base64'));
  elapsed+=Math.ceil(duration*30)/30;
 }
 await writer.finish();
 await page.evaluate(()=>{foxBiped.combo(true);foxBiped.renderer.setSize(640,640,false);foxBiped.camera.aspect=1;foxBiped.camera.updateProjectionMatrix()});
 const comboDuration=await page.evaluate(()=>foxBiped.routine.duration),combo=webmWriter(`${out}/acrobatic-combo.webm`,{fps:30,bitrate:'1400k'});
 for(let i=0;i<Math.ceil(comboDuration*30);i++)combo.write(Buffer.from(await page.evaluate(()=>{const a=foxBiped;a.stepCombo(1/60);a.stepCombo(1/60);a.renderer.render(a.scene,a.camera);return a.renderer.domElement.toDataURL('image/jpeg',.86).split(',')[1]}),'base64'));
 await combo.finish();const history=await page.evaluate(()=>foxBiped.routine.actor.history);
 const marks=[.4,2.3,3.4,5.1,7.9,10.3,12.4,15.3],data=fs.readFileSync(`${out}/acrobatic-combo.webm`).toString('base64');
 const decoded=await page.evaluate(async([data,marks])=>{const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j});const frames=[];for(const t of marks){await new Promise(r=>{v.onseeked=r;v.currentTime=t});const c=document.createElement('canvas');c.width=c.height=640;c.getContext('2d').drawImage(v,0,0);frames.push({t,image:c.toDataURL().split(',')[1]})}v.currentTime=0;await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalSpeed=v.playbackRate===1&&v.currentTime-start>.8;v.pause();return {frames,normalSpeed}},[data,marks]);
 for(const f of decoded.frames)fs.writeFileSync(`${out}/decoded-${f.t}.png`,Buffer.from(f.image,'base64'));
 const sheet=await page.evaluate(async frames=>{const c=document.createElement('canvas');c.width=1280;c.height=688;const ctx=c.getContext('2d');ctx.fillStyle='#202d32';ctx.fillRect(0,0,c.width,c.height);for(const [i,f]of frames.entries()){const im=new Image();im.src='data:image/png;base64,'+f.image;await im.decode();const x=i%4*320,y=Math.floor(i/4)*344;ctx.drawImage(im,x,y+24,320,320);ctx.fillStyle='white';ctx.font='14px system-ui';ctx.fillText(f.t+'s',x+8,y+17)}return c.toDataURL().split(',')[1]},decoded.frames);fs.writeFileSync(`${out}/decoded-combo-sheet.png`,Buffer.from(sheet,'base64'));
 const enlarged=await page.evaluate(async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=c.height=1280;c.getContext('2d').drawImage(im,0,0,1280,1280);return c.toDataURL().split(',')[1]},decoded.frames[4].image);fs.writeFileSync(`${out}/decoded-volley-enlarged.png`,Buffer.from(enlarged,'base64'));
 await page.selectOption('#action','Idle');await page.locator('#acro').click();await page.waitForTimeout(120);assert.ok(await page.evaluate(()=>foxBiped.routine&&foxBiped.routine.time>0));await page.selectOption('#action','Walk');assert.equal(await page.evaluate(()=>foxBiped.routine),null);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${out}/mobile-viewer.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(assetSHA256,createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-biped.glb')).digest('hex'),'asset must stay unchanged throughout review');
 const report={assetSHA256,clips,facings:['S','SE','E','NE','N','NW','W','SW'],fps:30,chapters,comboDuration,history,normalSpeedPlayback:decoded.normalSpeed,errors};fs.writeFileSync(`${out}/browser-review.json`,JSON.stringify(report,null,2)+'\n');assert.deepEqual(errors,[]);assert.ok(decoded.normalSpeed);console.log('44 clips / eight facings; full cycles and runtime combo recorded, decoded, and played at 1x; mobile and UI pass');
}finally{await browser.close()}
