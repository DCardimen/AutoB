import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {NATIVE_POSES} from '../native-poses.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const movie=await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{nativePosePixels,NATIVE_POSES}=await import('/native-poses.js');
  const canvas=document.createElement('canvas');canvas.width=1664;canvas.height=710;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),spec=pixelSpec('brakk'),chunks=[],stream=canvas.captureStream(24),recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:4500000});
  const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
  const start=performance.now();recorder.start();
  const draw=now=>{const t=(now-start)/1000,index=Math.min(16,Math.floor(t/1.2)),phase=(t%1.2)/1.2,state=NATIVE_POSES[index];c.fillStyle='#183139';c.fillRect(0,0,1664,710);c.fillStyle='#e7dfc2';c.font='16px monospace';c.fillText(`Brakk / ${state} / all eight facings / forms 0, 1, 2 / native + enlarged`,12,20);
   for(let evolution=0;evolution<3;evolution++)for(let dir=0;dir<8;dir++){const pixels=nativePosePixels(spec,{id:'brakk',evolution,evolutionPath:'wild'},state,phase,dir),x=dir*208,y=evolution*226+32;sc.putImageData(new ImageData(pixels,64,64),0,0);c.drawImage(cell,x,y,144,144);c.drawImage(cell,x+140,y+142);}
   if(t<1.2*NATIVE_POSES.length)requestAnimationFrame(draw);else recorder.stop();
  };requestAnimationFrame(draw);return done;
 });
 fs.writeFileSync(`${out}/brakk-all-motion.webm`,Buffer.from(movie,'base64'));
 await page.route('**/brakk-review.webm',r=>r.fulfill({contentType:'video/webm',body:fs.readFileSync(`${out}/brakk-all-motion.webm`)}));
 const frames=await page.evaluate(async()=>{
  const {NATIVE_POSES}=await import('/native-poses.js'),video=document.createElement('video');video.muted=true;video.src='/brakk-review.webm';await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});
  const canvas=document.createElement('canvas');canvas.width=1664;canvas.height=710;const c=canvas.getContext('2d'),frames=[];await video.play();
  for(const [i,state]of NATIVE_POSES.entries()){const time=await new Promise(resolve=>{const sample=(_,m)=>m.mediaTime>=i*1.2+.6?resolve(m.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);});c.drawImage(video,0,0);frames.push({state,time,png:canvas.toDataURL().split(',')[1]});}video.pause();return frames;
 });
 for(const frame of frames)fs.writeFileSync(`${out}/brakk-motion-${frame.state}.png`,Buffer.from(frame.png,'base64'));
 assert.equal(frames.length,NATIVE_POSES.length);assert.deepEqual(errors,[]);
 fs.writeFileSync(`${out}/brakk-motion-video.json`,JSON.stringify({frames:frames.map(({state,time})=>({state,time})),errors},null,2));console.log('Decoded normal-speed Brakk: 17 motion states, all eight facings and three forms');
}finally{await browser.close();}
