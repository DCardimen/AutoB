import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,xpNeeded} from '../game.js';
const out=process.env.REWARDS_VIDEO_OUT||'playtest-artifacts/pass-three/rewards-video';fs.mkdirSync(out,{recursive:true});const report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{for(const offline of [false,true])for(const width of [1440,390]){
 const label=`${offline?'offline':'source'}-${width}`,context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const run=makeRun(812,['aurel','brakk']);run.route=generateRoute(run);
 const growth=run.team.map(c=>({...c,before:{level:c.level,xp:0,needed:xpNeeded(c.level)},after:{level:c.level,xp:10,needed:xpNeeded(c.level)},amount:10,levels:0})),reward={won:true,gold:31,xp:10,time:22,growth,levels:[],loot:{key:'motion-test',claimed:false,drops:[{id:'blade-motion',kind:'gear',gear:'sunsteel-edge',quality:1.2,rarity:'Epic'},{id:'coins-motion',kind:'gold',amount:12}]}},lastReport={units:run.team.map(c=>({...c,side:0,maxHp:300,atk:30,armor:10})),growth,killLedger:[],metrics:{}};
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,node:run.route[0][0],foes:[creature('brakk')],phase:'reward',reward,lastReport,profile:{owned:run.team.map(c=>c.id),tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():(requests.push(r.request().url()),r.abort()));
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+(offline?'/Starfall-Menagerie.html':''));await page.waitForFunction(()=>document.querySelector('.rewards-landscape .stage-background-video')?.currentTime>.1);
 const result=await page.evaluate(async()=>{
  const host=document.querySelector('.rewards-landscape'),canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;const ctx=canvas.getContext('2d',{willReadFrequently:true});let previous,last=-1,active=host.querySelector('.stage-background-video');const seams=[],samples=[],nativeFrames=new Map(),start=performance.now();window.rewardVideoTracks=[...host.querySelectorAll('video')];
  return new Promise((resolve,reject)=>{function sample(now){
   if(now-last<35){requestAnimationFrame(sample);return;}last=now;ctx.clearRect(0,0,160,90);for(const v of host.querySelectorAll('video')){ctx.globalAlpha=Number(getComputedStyle(v).opacity);ctx.drawImage(v,0,0,160,90);}ctx.globalAlpha=1;
   const pixels=ctx.getImageData(0,0,160,90).data;let diff=0;if(previous){for(let i=0;i<pixels.length;i+=4)diff+=Math.abs(pixels[i]-previous[i])+Math.abs(pixels[i+1]-previous[i+1])+Math.abs(pixels[i+2]-previous[i+2]);diff/=160*90*3;}samples.push(diff);previous=pixels;
   const nativeSteps=new Map();for(const v of host.querySelectorAll('video')){ctx.clearRect(0,0,160,90);ctx.drawImage(v,0,0,160,90);const next=ctx.getImageData(0,0,160,90).data,before=nativeFrames.get(v);let step=0;if(before){for(let i=0;i<next.length;i+=4)step+=Math.abs(next[i]-before[i])+Math.abs(next[i+1]-before[i+1])+Math.abs(next[i+2]-before[i+2]);step/=160*90*3;}nativeSteps.set(v,step);nativeFrames.set(v,next);}
   const current=host.querySelector('.stage-background-video');if(current!==active){seams.push({diff,recentPeak:Math.max(...samples.slice(-21,-1)),nativeStep:nativeSteps.get(current),opacity:Number(getComputedStyle(current).opacity),elapsed:now-start,time:current.currentTime,ready:current.readyState});active=current;}
   if(seams.length>=2)resolve({seams,maxFrameDelta:Math.max(...samples),duration:active.duration,width:active.videoWidth,height:active.videoHeight,muted:active.muted,rate:active.playbackRate});else if(now-start>18000)reject(Error('Rewards background did not complete two handoffs'));else requestAnimationFrame(sample);
  }requestAnimationFrame(sample);});
 });
 assert.equal(result.width,1920);assert.equal(result.height,1080);assert.equal(result.rate,1);assert.ok(result.muted);assert.ok(result.seams.every(s=>s.ready>=2&&s.time>.1&&s.opacity===1&&s.diff<=s.recentPeak+.2),'decoded loop promotion has no abrupt image jump: '+JSON.stringify(result.seams));
 assert.ok(await page.locator('.rewards-landscape').evaluate(el=>Math.abs(el.getBoundingClientRect().height-innerHeight)<2),'background stays viewport-sized while the rewards scroll');
 await page.screenshot({path:`${out}/${label}-playing.png`});
 // Updating the reward dialog must retain its decoded players and loop phase.
 await page.locator('[data-upgrade]').first().click();assert.ok(await page.evaluate(()=>rewardVideoTracks.every(v=>v.isConnected)));
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);const frozen=await page.evaluate(()=>rewardVideoTracks.map(v=>v.currentTime));await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>rewardVideoTracks.map(v=>v.currentTime)),frozen);assert.ok(await page.evaluate(()=>rewardVideoTracks.every(v=>v.paused)));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!document.querySelector('.rewards-landscape .stage-background-video').paused);
 await page.evaluate(()=>{for(const v of rewardVideoTracks)v.dispatchEvent(new Event('error'));});assert.ok(await page.evaluate(()=>rewardVideoTracks.every(v=>v.hidden&&v.paused)));assert.notEqual(await page.locator('.rewards-landscape').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 await page.locator('.modal-close').click();await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>rewardVideoTracks.every(v=>!v.isConnected&&!v.getAttribute('src'))),'closed rewards release both decoders');
 assert.deepEqual(errors,[]);if(offline)assert.deepEqual(requests,[]);report.push({label,...result,reducedMotion:true,retainedOnPatch:true,posterFallback:true,decoderCleanup:true,errors,requests});const video=page.video();await context.close();await video.saveAs(`${out}/${label}.webm`);
}}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
