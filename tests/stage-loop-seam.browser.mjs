import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {makeRun,generateRoute} from '../game.js';
const out='docs/evidence/stage-loop-seam';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report=[];
try{for(const offline of [false,true]){
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:'playtest-artifacts/stage-loop-seam-video',size:{width:1440,height:1000}}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const run=makeRun(83,['aurel','brakk']);run.route=generateRoute(run);await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},{version:7,run,phase:'map',node:null,foes:[],profile:{owned:['aurel','brakk'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto(offline?pathToFileURL(path.resolve('Starfall-Menagerie.html')).href:(process.env.BASE_URL||'http://127.0.0.1:3000'));
 await page.waitForFunction(()=>document.querySelector('.stage-background-video')?.currentTime>.1);
 const result=await page.evaluate(async()=>{
  const host=document.querySelector('.biome-route'),tracks=[...host.querySelectorAll('video')],canvas=document.createElement('canvas');canvas.width=90;canvas.height=160;const c=canvas.getContext('2d',{willReadFrequently:true});let previous,last=-1,elapsed=0;const samples=[],seams=[];let active=document.querySelector('.stage-background-video');
  const start=performance.now();return new Promise((resolve,reject)=>{function sample(now){
   if(now-last<35){requestAnimationFrame(sample);return;}last=now;c.clearRect(0,0,90,160);for(const v of host.querySelectorAll('video')){c.globalAlpha=Number(getComputedStyle(v).opacity);c.drawImage(v,0,0,90,160);}c.globalAlpha=1;
   const image=c.getImageData(0,0,90,160).data;let diff=0;if(previous){for(let i=0;i<image.length;i+=4)diff+=Math.abs(image[i]-previous[i])+Math.abs(image[i+1]-previous[i+1])+Math.abs(image[i+2]-previous[i+2]);diff/=90*160*3;}
   const current=document.querySelector('.stage-background-video');if(current!==active){seams.push({diff,elapsed:now-start,currentTime:current.currentTime,readyState:current.readyState});active=current;}samples.push(diff);previous=image;elapsed=now-start;
   if(seams.length>=2){resolve({samples,seams,rate:active.playbackRate,duration:active.duration,tracks:tracks.length,max:Math.max(...samples),png:canvas.toDataURL().split(',')[1]});}else if(elapsed>18000)reject(Error('No seamless handoffs'));else requestAnimationFrame(sample);
  }requestAnimationFrame(sample);});
 });
 assert.equal(result.tracks,2);assert.equal(result.rate,1);assert.equal(result.seams.length,2);assert.ok(result.seams.every(s=>s.readyState>=2&&s.currentTime>.1));assert.ok(result.seams.every(s=>s.diff<.8),'no visible frame discontinuity on promotion: '+JSON.stringify(result.seams));
 await page.screenshot({path:`${out}/${offline?'offline':'source'}-after-two-loops.png`});fs.writeFileSync(`${out}/${offline?'offline':'source'}-decoded-seam.png`,Buffer.from(result.png,'base64'));report.push({offline,...result,png:undefined,errors});assert.deepEqual(errors,[]);const video=page.video();await context.close();await video.saveAs(`${out}/${offline?'offline':'source'}-normal-speed.webm`);
 }}finally{fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({samples,...r})=>r)));await browser.close();}
