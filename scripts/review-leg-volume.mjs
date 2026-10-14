import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const label=process.argv[2]||'after',base=process.env.BASE_URL||'http://127.0.0.1:3000';
fs.mkdirSync('playtest-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const result=await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels,SPRITE_ART_REVISION}=await import('/prototype-pixel-art.js');
  const rows=[['brakk',0,'idle',true],['brakk',0,'run',false],['brakk',1,'run',true],['aurel',0,'idle',true],['aurel',0,'sprint',false],['aurel',2,'run',true],['brom',0,'walk',true],['tarka',0,'run',false],['syl',0,'run',true],['nyra',0,'walk',true]];
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=rows.length*154;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10242c';ctx.fillRect(0,0,canvas.width,canvas.height);
  const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),poses=[];
  rows.forEach(([id,evolution,state,directions],row)=>{ctx.fillStyle='#e4dfc2';ctx.font='12px monospace';ctx.fillText(`${id} stage ${evolution} / ${state} / ${directions?'8 views':'gait phases'}`,4,row*154+13);for(let col=0;col<8;col++){
   const dir=directions?col:1,phase=directions?.25:col/8,spec=pixelSpec(id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
   sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,col*128,row*154+20,128,128);poses.push({id,evolution,state,phase,dir,clipped:pixels.clipped,volumeLegs:rig.artLegVolumes?.length||0});
  }});
  return {png:canvas.toDataURL().split(',')[1],poses,artRevision:SPRITE_ART_REVISION};
 });
 assert.deepEqual(errors,[]);fs.writeFileSync(`playtest-artifacts/leg-volume-${label}.png`,Buffer.from(result.png,'base64'));fs.writeFileSync(`playtest-artifacts/leg-volume-${label}.json`,JSON.stringify({artRevision:result.artRevision,poses:result.poses,errors},null,2)+'\n');
 if(label==='after'){
  assert.ok(result.poses.every(p=>p.clipped===0));
  const movie=await page.evaluate(async()=>{
   const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=560;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),stream=canvas.captureStream(30),chunks=[];
   const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});
   const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:mime}));};});
   const actors=[['brakk',0],['aurel',0],['brom',0],['brakk',1],['aurel',2],['tarka',0]],start=performance.now();recorder.start();
   function frame(now){
    const elapsed=(now-start)/1000,state=elapsed<3.2?'walk':elapsed<6.4?'run':'sprint',phase=(elapsed*(state==='walk'?1.15:state==='run'?1.7:2.2))%1,dir=Math.floor(elapsed/1.2)%8;
    ctx.fillStyle='#10242c';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#e4dfc2';ctx.font='18px monospace';ctx.fillText(`Rounded legs / ${state} / normal speed`,18,28);
    actors.forEach(([id,evolution],i)=>{const spec=pixelSpec(id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4),x=(i%3)*320+64,y=Math.floor(i/3)*248+52;sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.fillStyle='#08161d';ctx.beginPath();ctx.ellipse(x+96,y+153,40,9,0,0,Math.PI*2);ctx.fill();ctx.drawImage(cell,x,y,192,192);ctx.fillStyle='#d9dfc7';ctx.font='14px monospace';ctx.fillText(`${spec.name} / stage ${evolution}`,x,y+212);});
    if(elapsed<9.6)requestAnimationFrame(frame);else recorder.stop();
   }
   requestAnimationFrame(frame);return done;
  });
  fs.writeFileSync('public/leg-volume-preview.webm',Buffer.from(movie,'base64'));
  const playback=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.style.cssText='position:fixed;inset:0;z-index:999999;width:960px;height:560px';document.body.append(video);video.src='/public/leg-volume-preview.webm';video.preload='auto';await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error('Preview video failed to decode'));});
   const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight*3;const ctx=canvas.getContext('2d');
   const decodedTimes=[];await video.play();
   // MediaRecorder WebM may have no seek index. Decode sequentially and sample
   // presented video frames so a seek cannot silently reuse the first frame.
   for(const [row,time]of [1,4.3,7.7].entries()){
    const actual=await new Promise(resolve=>{const sample=(now,meta)=>meta.mediaTime>=time?resolve(meta.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);});
    decodedTimes.push(actual);ctx.drawImage(video,0,row*video.videoHeight);
   }
   video.pause();return {width:video.videoWidth,height:video.videoHeight,decodedTimes,png:canvas.toDataURL().split(',')[1]};
  });
  assert.deepEqual([playback.width,playback.height],[960,560]);
  fs.writeFileSync('playtest-artifacts/leg-volume-motion.png',Buffer.from(playback.png,'base64'));
  fs.writeFileSync('tests/reports/leg-volume.json',JSON.stringify({artRevision:result.artRevision,poses:result.poses,normalSpeedPreview:'public/leg-volume-preview.webm',playback:{width:playback.width,height:playback.height,decodedTimes:playback.decodedTimes},errors},null,2)+'\n');
 }
 console.log(`${label}: ${result.poses.filter(p=>p.clipped).length} clipped poses`);
}finally{await browser.close();}
