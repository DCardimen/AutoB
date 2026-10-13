import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const output=process.argv[2]||'public/sprite-art-v3-preview.webm',ffmpeg=process.env.FFMPEG_PATH||(process.platform==='win32'?'playtest-artifacts/browser-runtime/ffmpeg-1011/ffmpeg-win64.exe':'/usr/bin/ffmpeg');
const encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libvpx','-deadline','realtime','-cpu-used','4','-b:v','2500k','-pix_fmt','yuv420p','-y',output],{stdio:['pipe','ignore','pipe']});
let errors='';encoder.stderr.on('data',d=>errors+=d);const complete=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error(errors)));});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/chromium'),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:960}}),base=process.env.BASE_URL||'http://127.0.0.1:3021';await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto(base+'/prototype.html');await page.clock.runFor(100);await page.waitForFunction(()=>prototypeLab.state.artLoaded);
 async function capture(selector,seconds,caption,review=false){for(let frame=0;frame<seconds*30;frame++){
  await page.clock.runFor(1000/30);if(review)await page.evaluate(t=>window.drawMotionReview(t),frame/30);
  const data=await page.locator(selector).evaluate((c,caption)=>{const out=document.createElement('canvas');out.width=1002;out.height=654;const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#14231f';ctx.fillRect(0,0,1002,654);ctx.drawImage(c,0,0);ctx.fillStyle='#14231fec';ctx.fillRect(8,8,986,30);ctx.fillStyle='#e9d9ae';ctx.font='14px monospace';ctx.fillText(caption,16,29);return out.toDataURL('image/jpeg',1).split(',')[1];},caption);
  if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
  if(review&&[0,45,90,135].includes(frame))await page.locator(selector).screenshot({path:`playtest-artifacts/v3-motion-frame-${frame}.png`});
 }console.log(caption);}
 await page.locator('[data-scene="movement"]').click();await page.locator('[data-pace="walk"]').click();await capture('#prototype-canvas',3,'ART V3 · planted walking cycles, turning, trailing hair and cloth');
 await page.locator('[data-pace="sprint"]').click();await capture('#prototype-canvas',3,'ART V3 · sprinting, leg articulation and body weight');
 await page.locator('[data-scene="battle"]').click();await capture('#prototype-canvas',6,'ART V3 · actual combat · weapons share the physical hand grip');
 await page.goto(base+'/index.html');await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{nativeRigFor}=await import('/grand-designs.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');const canvas=document.createElement('canvas');canvas.id='motion-review';canvas.width=1002;canvas.height=654;document.body.replaceChildren(canvas);document.body.style.margin='0';const ctx=canvas.getContext('2d'),cell=document.createElement('canvas');cell.width=cell.height=64;const brush=cell.getContext('2d');ctx.imageSmoothingEnabled=false;
  window.drawMotionReview=t=>{ctx.fillStyle='#172a28';ctx.fillRect(0,0,1002,654);for(let row=0;row<3;row++){ctx.fillStyle='#d7cba2';ctx.font='14px monospace';ctx.fillText(['WALK · juvenile','RUN · mature','ATTACK / CAST · apex'][row],10,row*200+60);['aurel','brakk','syl','nyra','rowan'].forEach((id,col)=>{const spec=pixelSpec(id),c={id,evolution:row,evolutionPath:'wild'},state=row===0?'walk':row===1?'run':id==='nyra'?'cast':'attack',phase=t*(row===1?1.5:1)%1,dir=[1,2,3,5,7][Math.floor(t)%5],rig=nativePoseRig(spec,c,state,phase);rig.artStage=row;const pixels=paintCharacterPixels(nativeRigFor(spec,c),rig,dir*Math.PI/4);if(pixels.clipped)throw Error(`${id} ${row} ${state} clipped`);brush.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,col*200+20,row*200+70,160,160);});}};
 });await capture('#motion-review',6,'ART V3 · complete evolving bodies, articulated hands, hair and cape motion',true);
 encoder.stdin.end();await complete;fs.writeFileSync('playtest-artifacts/v3-motion-recording.json',JSON.stringify({output,seconds:18,fps:30,frames:540,source:'rebuilt live renderer and physical Training Glade',encoder:'VP8',errors},null,2));console.log('Saved '+output);
}finally{await browser.close();if(!encoder.stdin.destroyed)encoder.stdin.destroy();}
