import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeRun,creature,generateRoute} from '../game.js';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync('playtest-artifacts',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const run=makeRun(137,['aurel']);run.team=['aurel','brakk','emberhound'].map(id=>({...creature(id),equipment:[],relics:[]}));run.teamCapacity=6;run.relics=[];run.route=generateRoute(run);
 const foes=['grum','pyrehorn','mireclaw'].map(id=>({...creature(id),equipment:[],relics:[]}));
 await page.addInitScript(saved=>{sessionStorage.setItem('fang-feather-intro','seen');localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));},{version:7,run,node:run.route[0][0],foes,phase:'prep',profile:{owned:run.team.map(u=>u.id),tutorial:true,tuning:{spriteSize:250}}});
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+'/index.html');await page.waitForFunction(()=>window.starfall);await page.locator('[data-action="battle"]').click();
 // Review fixture: extend health and reserve active skills so contact, recoil and physical dodges stay readable.
 await page.evaluate(()=>{for(const u of starfall.state.battle.units){u.hp=u.maxHp=10000;Object.values(u.cooldowns).forEach(cd=>cd.remaining=999);}});
 const movie=await page.evaluate(async()=>{
  const source=document.querySelector('#battle-canvas'),canvas=document.createElement('canvas');canvas.width=1642;canvas.height=654;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const stream=canvas.captureStream(24),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:2500000}),start=performance.now();
  const blob=await new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());resolve(new Blob(chunks,{type:'video/webm'}));};recorder.start();
   const draw=now=>{const b=starfall.state.battle,units=b.units.filter(u=>u.hp>0),x=units.reduce((n,u)=>n+u.x,0)/units.length,y=units.reduce((n,u)=>n+u.y*.58+75,0)/units.length;
    c.fillStyle='#14241f';c.fillRect(0,0,1642,654);c.drawImage(source,0,0,1002,654);c.drawImage(source,Math.max(0,Math.min(682,x-160))/1002*source.width,Math.max(0,Math.min(327,y-180))/654*source.height,320/1002*source.width,327/654*source.height,1002,0,640,654);
    c.fillStyle='#12251de6';c.fillRect(0,610,1642,44);c.fillStyle='#f3e7c7';c.font='16px monospace';c.fillText('Normal speed / native arena view     |     2x detail / solid bodies, contact, dodge and recoil',20,638);
    if(now-start<14000)requestAnimationFrame(draw);else recorder.stop();};requestAnimationFrame(draw);
  });
  const encoded=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});
  const video=document.createElement('video');video.muted=true;video.src=URL.createObjectURL(blob);await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});await video.play();
  const frames=[];for(const time of [3,6,9,12]){const decoded=await new Promise(resolve=>{const frame=(now,meta)=>meta.mediaTime>=time?resolve(meta.mediaTime):video.requestVideoFrameCallback(frame);video.requestVideoFrameCallback(frame);});c.drawImage(video,0,0);frames.push({time:decoded,png:canvas.toDataURL().split(',')[1]});}video.pause();URL.revokeObjectURL(video.src);
  return {video:encoded,frames,metrics:starfall.state.battle.metrics,width:canvas.width,height:canvas.height};
 });
 assert.deepEqual(errors,[]);assert.ok(movie.metrics.bladeContacts>0);fs.writeFileSync('playtest-artifacts/weighted-combat.webm',Buffer.from(movie.video,'base64'));
 movie.frames.forEach((f,i)=>fs.writeFileSync(`playtest-artifacts/weighted-combat-playback-${i}.png`,Buffer.from(f.png,'base64')));
 fs.writeFileSync('playtest-artifacts/weighted-combat-video.json',JSON.stringify({width:movie.width,height:movie.height,times:movie.frames.map(f=>f.time),metrics:movie.metrics,errors,fixture:'three versus three first forms, 250% display size, normal speed; extended health and reserved active skills for contact review'},null,2));console.log('Recorded and decoded normal-speed combat at native and 2x detail sizes.');
}finally{await browser.close();}
