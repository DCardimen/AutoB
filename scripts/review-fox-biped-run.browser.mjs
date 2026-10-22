import fs from 'node:fs';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';
const out='docs/evidence/fox-biped1',browser=await launchReviewBrowser();
try{
 const page=await browser.newPage({viewport:{width:900,height:800}});await page.goto('http://127.0.0.1:3117/public/meshy-fox-preview/animated.html');await page.waitForFunction(()=>window.foxBiped?.ready);
 await page.evaluate(()=>{const a=foxBiped;a.pause();a.action('Run');a.yaw(0);a.renderer.setSize(640,640,false);a.camera.aspect=1;a.camera.position.set(2.4,.75,.2);a.camera.lookAt(0,.55,0);a.camera.updateProjectionMatrix()});
 const video=webmWriter(`${out}/reference-run.webm`,{fps:30,bitrate:'1600k'});
 for(let i=0;i<90;i++)video.write(Buffer.from(await page.evaluate(t=>{const a=foxBiped;a.seek(t%.64);a.renderer.render(a.scene,a.camera);return a.renderer.domElement.toDataURL('image/jpeg',.88).split(',')[1]},i/30),'base64'));await video.finish();
 const png=await page.evaluate(()=>{const a=foxBiped,s=320,c=document.createElement('canvas');c.width=s*4;c.height=(s+24)*2;const ctx=c.getContext('2d');a.renderer.setSize(s,s,false);for(let i=0;i<8;i++){a.seek(i*.64/8);a.renderer.render(a.scene,a.camera);const x=i%4*s,y=Math.floor(i/4)*(s+24);ctx.fillStyle='#202d32';ctx.fillRect(x,y,s,s+24);ctx.drawImage(a.renderer.domElement,x,y+24);ctx.fillStyle='white';ctx.font='14px system-ui';ctx.fillText('Run '+(i*.64/8).toFixed(2)+'s',x+8,y+17);}return c.toDataURL().split(',')[1]});fs.writeFileSync(`${out}/reference-run-phases.png`,Buffer.from(png,'base64'));console.log('Reference run side-view cycle and 1x video captured');
}finally{await browser.close()}
