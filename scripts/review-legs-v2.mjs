import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const label=process.argv[2]||'final',base=process.env.BASE_URL||'http://127.0.0.1:3000';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const result=await page.evaluate(async label=>{
  const {pixelSpec,PIXEL_SPECIES}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
  const groups=[['Heavy bodies',['frostursa','pyrehorn','flintback','cogwalker']],['Paws and hooves',['emberhound','nightmaw','crownstag','stormdrake']],['Segmented legs',['orchimantis','onyxscarab','runespider','ironscolopendra']],['Humanoids',['brakk','aurel','brom','tarka']]],sheets=[],poses=[];
  const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d');
  for(const [name,ids]of groups){
   const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=ids.length*244;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10242c';c.fillRect(0,0,canvas.width,canvas.height);
   for(const [row,id]of ids.entries())for(let col=0;col<6;col++){
    const dir=col<3?[0,2,5][col]:1,state=col<3?'idle':col===3?'walk':col===4?'run':'sprint',spec=pixelSpec(id),rig=nativePoseRig(spec,{id},state,.25),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
    sc.putImageData(new ImageData(pixels,64,64),0,0);c.drawImage(cell,col*256+32,row*244+20,192,192);c.fillStyle='#e4dfc2';c.font='13px monospace';c.fillText(`${spec.name} / ${state} / ${dir}`,col*256+8,row*244+231);
    poses.push({id,state,dir,clipped:pixels.clipped,legs:rig.artLegVolumes});
   }
   sheets.push({name,png:canvas.toDataURL().split(',')[1]});
  }
  if(label==='final'){
   const families=[...new Map(PIXEL_SPECIES.map(s=>[s.nativeDesign||s.nativeRig,s])).values()];
   for(let start=0;start<families.length;start+=10){
    const rows=families.slice(start,start+10),canvas=document.createElement('canvas');canvas.width=1152;canvas.height=rows.length*150;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10242c';c.fillRect(0,0,canvas.width,canvas.height);
    for(const [row,spec]of rows.entries())for(let col=0;col<9;col++){
     const evolution=Math.floor(col/3),dir=[0,2,5][col%3],rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:evolution===1?'warden':'wild'},'walk',.18),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
     sc.putImageData(new ImageData(pixels,64,64),0,0);c.drawImage(cell,col*128,row*150,128,128);c.fillStyle='#e4dfc2';c.font='10px monospace';c.fillText(`${spec.nativeDesign||spec.nativeRig} ${evolution}/${dir}`,col*128+2,row*150+143);poses.push({id:spec.id,evolution,state:'walk',dir,clipped:pixels.clipped});
    }
    sheets.push({name:'families-'+(start/10+1),png:canvas.toDataURL().split(',')[1]});
   }
  }
  return {sheets,poses,families:new Set(PIXEL_SPECIES.map(s=>s.nativeDesign||s.nativeRig)).size};
 },label);
 for(const sheet of result.sheets)fs.writeFileSync(`playtest-artifacts/legs-v2-${label}-${sheet.name.toLowerCase().replaceAll(' ','-')}.png`,Buffer.from(sheet.png,'base64'));
 assert.deepEqual(errors,[]);assert.ok(result.poses.every(p=>p.clipped===0));
 fs.writeFileSync(`playtest-artifacts/legs-v2-${label}.json`,JSON.stringify({poses:result.poses,families:result.families,errors},null,2));
 console.log(`${label}: ${result.poses.length} enlarged poses, ${result.families} anatomy families, no clipping or page errors`);
 if(label==='final'){
  const movie=await page.evaluate(async()=>{
   const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
   const ids=['frostursa','pyrehorn','brakk','emberhound','runespider','ironscolopendra'],canvas=document.createElement('canvas');canvas.width=960;canvas.height=580;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
   const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),stream=canvas.captureStream(24),chunks=[],mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2200000});
   const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:mime}));};});
   const start=performance.now();recorder.start();
   const draw=now=>{const time=(now-start)/1000,state=time<3.2?'walk':time<6.4?'run':'sprint',phase=(time*(state==='walk'?1.15:state==='run'?1.8:2.4))%1,dir=Math.floor(time/1.2)%8;
    c.fillStyle='#10242c';c.fillRect(0,0,960,580);c.fillStyle='#e4dfc2';c.font='18px monospace';c.fillText(`Fang & Feather / Legs V2 / ${state} / normal speed`,18,28);
    ids.forEach((id,i)=>{const spec=pixelSpec(id),rig=nativePoseRig(spec,{id},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),x=i%3*320+64,y=Math.floor(i/3)*255+42;sc.putImageData(new ImageData(pixels,64,64),0,0);c.fillStyle='#08161d';c.beginPath();c.ellipse(x+96,y+(rig.artLegRegistration?.soleY||44)*3,45,8,0,0,Math.PI*2);c.fill();c.drawImage(cell,x,y,192,192);c.fillStyle='#e4dfc2';c.font='14px monospace';c.fillText(spec.name,x,y+214);});
    if(time<9.6)requestAnimationFrame(draw);else recorder.stop();
   };requestAnimationFrame(draw);return done;
  });
  fs.writeFileSync('public/legs-v2-preview.webm',Buffer.from(movie,'base64'));
  const playback=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.src='/public/legs-v2-preview.webm';await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});const canvas=document.createElement('canvas');canvas.width=960;canvas.height=1740;const c=canvas.getContext('2d'),times=[];await video.play();
   for(const [i,time]of [1.1,4.2,7.4].entries()){times.push(await new Promise(resolve=>{const sample=(now,meta)=>meta.mediaTime>=time?resolve(meta.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);}));c.drawImage(video,0,i*580);}video.pause();return {times,width:video.videoWidth,height:video.videoHeight,png:canvas.toDataURL().split(',')[1]};
  });
  assert.deepEqual([playback.width,playback.height],[960,580]);assert.ok(playback.times[2]>playback.times[0]+5);
  fs.writeFileSync('playtest-artifacts/legs-v2-motion-playback.png',Buffer.from(playback.png,'base64'));
  fs.writeFileSync('playtest-artifacts/legs-v2-video.json',JSON.stringify({path:'public/legs-v2-preview.webm',times:playback.times,width:playback.width,height:playback.height,errors},null,2));
 }
}finally{await browser.close();}
