import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync(out,{recursive:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const result=await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{starterReactionPixels,starterReactionProfile,starterReactionPose}=await import('/starter-reactions.js');
  const ids=['aurel','brakk','syl','nyra','cinderfox','mossguard','brookfin','voltwing','bloomkin','duskcap','cogwalker','runespider'],cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),sheets=[];
  for(const id of ids){
   const spec=pixelSpec(id),canvas=document.createElement('canvas');canvas.width=1088;canvas.height=480;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,1088,480);
   for(let i=0;i<16;i++){
    const p=i/15,pixels=starterReactionPixels(spec,p);sc.putImageData(new ImageData(pixels,64,64),0,0);const x=i%8*136,y=Math.floor(i/8)*240;
    c.drawImage(cell,x,y+18,128,128);c.drawImage(cell,x+32,y+154);c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(`${id} ${p.toFixed(2)}`,x+2,y+12);
   }sheets.push({id,png:canvas.toDataURL().split(',')[1]});
  }
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=690;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const stream=canvas.captureStream(24),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:3500000});
  const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
  const start=performance.now();recorder.start();
  const draw=now=>{
   const time=(now-start)/1000,cycle=time%2;c.fillStyle='#183139';c.fillRect(0,0,1280,690);c.fillStyle='#e7dfc2';c.font='16px monospace';c.fillText('First-form greetings / normal speed / native + enlarged',16,22);
   ids.forEach((id,i)=>{const spec=pixelSpec(id),profile=starterReactionProfile(spec),p=Math.min(1,cycle*1000/profile.duration),pixels=starterReactionPixels(spec,p),pose=starterReactionPose(spec,p),x=i%4*320+35,y=Math.floor(i/4)*218+32;sc.putImageData(new ImageData(pixels,64,64),0,0);
    // Include the same planted-origin whole-sprite motion used by the menu.
    const place=(x,y,size)=>{c.save();c.translate(x+size/2+pose.x*size/64,y+size*.96+pose.y*size/64);c.rotate(pose.roll);c.drawImage(cell,-size/2,-size*.96,size,size);c.restore();};place(x,y,160);place(x+180,y+96,64);
    c.fillStyle='#e7dfc2';c.font='13px monospace';c.fillText(`${spec.name}: ${profile.kind}`,x,y+184);});
   if(time<4.2)requestAnimationFrame(draw);else recorder.stop();
  };requestAnimationFrame(draw);return {sheets,movie:await done};
 });
 for(const s of result.sheets)fs.writeFileSync(`${out}/reaction-cycle-${s.id}.png`,Buffer.from(s.png,'base64'));
 fs.writeFileSync(`${out}/starter-reactions.webm`,Buffer.from(result.movie,'base64'));
 // Decode the recorded bytes in a real video element at normal playback speed.
 await page.route('**/reaction-review.webm',r=>r.fulfill({contentType:'video/webm',body:fs.readFileSync(`${out}/starter-reactions.webm`)}));
 const playback=await page.evaluate(async()=>{
  const video=document.createElement('video');video.muted=true;video.src='/reaction-review.webm';await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=690*4;const c=canvas.getContext('2d'),times=[];await video.play();
  for(const [i,time]of [.15,.3,.6,.85].entries()){times.push(await new Promise(resolve=>{const sample=(_,m)=>m.mediaTime>=time?resolve(m.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);}));c.drawImage(video,0,i*690);}video.pause();return {times,width:video.videoWidth,height:video.videoHeight,png:canvas.toDataURL().split(',')[1]};
 });
 assert.deepEqual([playback.width,playback.height],[1280,690]);assert.equal(playback.times.length,4);assert.deepEqual(errors,[]);
 fs.writeFileSync(`${out}/starter-reactions-playback.png`,Buffer.from(playback.png,'base64'));fs.writeFileSync(`${out}/starter-reactions-video.json`,JSON.stringify({times:playback.times,width:playback.width,height:playback.height,errors},null,2));
 console.log('Twelve first-form reaction sheets, normal-speed video and four decoded native/enlarged frames');
}finally{await browser.close();}
