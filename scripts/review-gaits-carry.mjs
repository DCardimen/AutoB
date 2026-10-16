import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const label=process.argv[2]||'first',base=process.env.BASE_URL||'http://127.0.0.1:3000';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const result=await page.evaluate(async()=>{
  const modules=await Promise.all(['/authored-sprite-data.js','/authored-body-data.js','/authored-family-data.js','/authored-legacy-data.js','/authored-sprite-stage1-data.js','/authored-body-stage1-data.js','/authored-family-stage1-data.js','/authored-legacy-stage1-data.js','/authored-sprite-stage2-data.js','/authored-body-stage2-data.js','/authored-family-stage2-data.js','/authored-legacy-stage2-data.js'].map(url=>import(url)));
  const stages=[0,1,2].map(stage=>Object.assign({},...modules.slice(stage*4,stage*4+4).map(m=>Object.values(m)[0])));
  const {PIXEL_SPECIES}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js'),{atlasIdentity}=await import('/authored-sprite-renderer.js');
  const designs=['wolf','feralfox','cat','lion','bear','rhino','stag','rabbit','rodent','turtle','knight','orc','elf','caster','fox','dwarf','goblin','troll','skeleton','minotaur','rogue','frostelf','faerie','beetle','mech','spider','crab','centipede'],sheets=[];
  for(const design of designs){
   const spec=PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design),canvas=document.createElement('canvas');canvas.width=1536;canvas.height=3*408;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);
   const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d');
   for(let evolution=0;evolution<3;evolution++)for(let dir=0;dir<8;dir++){
    const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'idle',.25),identity=atlasIdentity(rig.id,rig),atlas=stages[rig.artStage][identity],pixels=new Uint8ClampedArray(64*64*4);
    for(let i=0;i<4096;i++){const n=parseInt(atlas.frames[dir].slice(i*2,i*2+2),16);if(n)pixels.set([...atlas.palette[n].match(/../g).map(v=>parseInt(v,16)),255],i*4);}
    sc.putImageData(new ImageData(pixels,64,64),0,0);c.drawImage(cell,dir*192,evolution*408+18,192,192);
    const current=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);sc.putImageData(new ImageData(current,64,64),0,0);c.drawImage(cell,dir*192,evolution*408+212,192,192);
    c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(`${identity} stage ${evolution} dir ${dir} ORIGINAL`,dir*192+3,evolution*408+13);
   }
   sheets.push({design,png:canvas.toDataURL().split(',')[1]});
  }
  const critical=['emberhound','cinderfox','nightmaw','sunlion','frostursa','pyrehorn','crownstag','rabbit','rodent','turtle','aurel','brakk','syl','nyra','rowan','brom','tarka','sable','eira','grit','grum','morrow','luma'];
  const poses=[];
  for(const id of critical){
   const spec=PIXEL_SPECIES.find(s=>s.id===id)||PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>s.nativeDesign===id);if(!spec)throw new Error('Missing review species '+id);
   const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=8*210;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);
   const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d');
   for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const state=row<2?'idle':row<4?'walk':row<6?'run':'sprint',phase=col/8,evolution=row%2?2:0,dir=row%2?6:1;
    const rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
    sc.putImageData(new ImageData(pixels,64,64),0,0);c.drawImage(cell,col*192,row*210+16,192,192);c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(`${id} ${state} s${evolution} ${phase}`,col*192+2,row*210+12);
    poses.push({id,state,evolution,dir,phase,clipped:pixels.clipped,skin:rig.artLegSkin,weapon:rig.artWeaponIdentity});
   }
   sheets.push({design:id+'-motion',png:canvas.toDataURL().split(',')[1]});
  }
  return {sheets,poses};
 });
 for(const s of result.sheets)fs.writeFileSync(`playtest-artifacts/gaits-carry-${label}-${s.design}.png`,Buffer.from(s.png,'base64'));
 fs.writeFileSync(`playtest-artifacts/gaits-carry-${label}.json`,JSON.stringify(result.poses,null,2));
 assert.equal(result.poses.filter(p=>p.clipped).length,0);assert.deepEqual(errors,[]);
 console.log(`${label}: ${result.sheets.length} source and motion sheets; ${result.poses.length} animated poses; ${result.poses.filter(p=>p.clipped).length} clipped`);
 if(label==='final'){
  for(const design of ['knight','orc','caster','frostursa-motion'])fs.copyFileSync(`playtest-artifacts/gaits-carry-final-${design}.png`,`public/gaits-carry-${design}.png`);
  const movie=await page.evaluate(async()=>{
   const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
   const ids=['frostursa','emberhound','pyrehorn','nightmaw','aurel','brakk','syl','nyra'],canvas=document.createElement('canvas');canvas.width=1280;canvas.height=690;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
   const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),stream=canvas.captureStream(24),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:3000000});
   const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
   const start=performance.now();recorder.start();
   const draw=now=>{const time=(now-start)/1000,state=time<2?'idle':time<6?'walk':time<10?'run':'sprint',phase=(time*(state==='idle'?.6:state==='walk'?1.1:state==='run'?1.7:2.2))%1,dir=Math.floor(time/1.7)%8;
    c.fillStyle='#183139';c.fillRect(0,0,1280,690);c.fillStyle='#e7dfc2';c.font='18px monospace';c.fillText(`Fang & Feather / alternating steps + stable carries / ${state} / base forms`,20,30);
    ids.forEach((id,i)=>{const spec=pixelSpec(id),rig=nativePoseRig(spec,{id},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),x=i%4*320+48,y=Math.floor(i/4)*310+52;sc.putImageData(new ImageData(pixels,64,64),0,0);c.drawImage(cell,x,y,192,192);c.drawImage(cell,x+205,y+128,64,64);c.fillStyle='#e7dfc2';c.font='15px monospace';c.fillText(spec.name,x,y+222);});
    if(time<14)requestAnimationFrame(draw);else recorder.stop();
   };requestAnimationFrame(draw);return done;
  });
  fs.writeFileSync('public/gaits-carry-preview.webm',Buffer.from(movie,'base64'));
  const playback=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.src='/public/gaits-carry-preview.webm';await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=2070;const c=canvas.getContext('2d'),times=[];await video.play();
   for(const [i,time]of [4,8,12].entries()){times.push(await new Promise(resolve=>{const sample=(now,meta)=>meta.mediaTime>=time?resolve(meta.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);}));c.drawImage(video,0,i*690);}video.pause();return {times,width:video.videoWidth,height:video.videoHeight,png:canvas.toDataURL().split(',')[1]};
  });
  assert.deepEqual([playback.width,playback.height],[1280,690]);assert.ok(playback.times[2]>playback.times[0]+7);assert.deepEqual(errors,[]);
  fs.writeFileSync('playtest-artifacts/gaits-carry-motion-playback.png',Buffer.from(playback.png,'base64'));fs.writeFileSync('playtest-artifacts/gaits-carry-video.json',JSON.stringify({times:playback.times,width:playback.width,height:playback.height,errors},null,2));
 }
}finally{await browser.close();}
