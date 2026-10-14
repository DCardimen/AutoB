import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const label=process.argv[2]||'after',base=process.env.BASE_URL||'http://127.0.0.1:3000';
const executablePath=process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const result=await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
  const ids=['emberhound','cinderfox','nightmaw','frostursa','pyrehorn','crownstag','flintback','stormdrake','orchimantis','mireclaw','onyxscarab','runespider','ironscolopendra','cogwalker','nix','zephyr','vesper','pearlsquid','brineclam','moonjelly'];
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=ids.length*150;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10242c';ctx.fillRect(0,0,canvas.width,canvas.height);
  const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),poses=[];
  for(const [row,id]of ids.entries()){
   ctx.fillStyle='#e4dfc2';ctx.font='12px monospace';ctx.fillText(`${id} / idle views, then windup > contact > recovery`,4,row*150+13);
   for(let col=0;col<8;col++){
    const state=col<3?'idle':'attack',dir=col<3?[0,2,5][col]:1,phase=col<3?.25:[.12,.34,.48,.58,.92][col-3],spec=pixelSpec(id),rig=nativePoseRig(spec,{id},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
    sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,col*128,row*150+20,128,128);poses.push({id,state,phase,dir,legs:rig.legs.length,volumeLegs:rig.artLegVolumes?.length||0,attack:rig.creatureAttack?.category,clipped:pixels.clipped});
   }
  }
  const focus=document.createElement('canvas');focus.width=1024;focus.height=450;const fc=focus.getContext('2d');for(const [i,row]of [0,8,9].entries())fc.drawImage(canvas,0,row*150,1024,150,0,i*150,1024,150);
  return {png:canvas.toDataURL().split(',')[1],focus:focus.toDataURL().split(',')[1],poses};
 });
 fs.writeFileSync(`playtest-artifacts/creature-anatomy-${label}.png`,Buffer.from(result.png,'base64'));
 fs.writeFileSync(`playtest-artifacts/creature-anatomy-focus-${label}.png`,Buffer.from(result.focus,'base64'));
 const report={poses:result.poses,errors};fs.writeFileSync(`playtest-artifacts/creature-anatomy-${label}.json`,JSON.stringify(report,null,2));
 assert.deepEqual(errors,[]);if(label==='after'){
  assert.ok(result.poses.every(p=>p.clipped===0));assert.ok(result.poses.filter(p=>p.legs>2).every(p=>p.volumeLegs===p.legs));
  const movie=await page.evaluate(async()=>{
   const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
   const ids=['emberhound','orchimantis','mireclaw','nightmaw','frostursa','pyrehorn','runespider','ironscolopendra','nix'];
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=780;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),stream=canvas.captureStream(24),chunks=[];
   const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2000000});
   const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:mime}));};});
   const start=performance.now();recorder.start();
   function frame(now){
    const t=(now-start)/1000,dir=Math.floor(t/1.2)%8,state=t<2.4?'walk':'attack',phase=state==='walk'?t%1:((t-2.4)%1.2)/1.2;
    ctx.fillStyle='#10242c';ctx.fillRect(0,0,960,780);ctx.fillStyle='#e4dfc2';ctx.font='18px monospace';ctx.fillText('Solid legs / natural attacks / eight views',18,24);
    for(const [i,id]of ids.entries()){const spec=pixelSpec(id),rig=nativePoseRig(spec,{id},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4),x=i%3*320+64,y=Math.floor(i/3)*245+35;sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,x,y,192,192);ctx.fillStyle='#e4dfc2';ctx.font='13px monospace';ctx.fillText(`${spec.name} / ${rig.creatureAttack?.category||state}`,i%3*320+8,y+212);}
    if(t<9.6)requestAnimationFrame(frame);else recorder.stop();
   }requestAnimationFrame(frame);return done;
  });
  fs.writeFileSync('public/creature-anatomy-preview.webm',Buffer.from(movie,'base64'));
  const playback=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.src='/public/creature-anatomy-preview.webm';await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=1560;const ctx=canvas.getContext('2d'),times=[];await video.play();
   for(const [row,time]of [1.2,4.0].entries()){times.push(await new Promise(resolve=>{const sample=(now,meta)=>meta.mediaTime>=time?resolve(meta.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);}));ctx.drawImage(video,0,row*780);}
   video.pause();return {width:video.videoWidth,height:video.videoHeight,times,png:canvas.toDataURL().split(',')[1]};
  });
  assert.deepEqual([playback.width,playback.height],[960,780]);assert.ok(playback.times[1]>playback.times[0]+2);
  fs.writeFileSync('playtest-artifacts/creature-anatomy-playback.png',Buffer.from(playback.png,'base64'));report.preview={path:'public/creature-anatomy-preview.webm',width:playback.width,height:playback.height,decodedTimes:playback.times};
  fs.writeFileSync('tests/reports/creature-anatomy.json',JSON.stringify(report,null,2));
 }
 console.log(`${label}: ${result.poses.length} poses, ${result.poses.filter(p=>p.clipped).length} clipped`);
}finally{await browser.close();}
