import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {makeRun,generateRoute} from '../game.js';

const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const out='playtest-artifacts/stage-background';
fs.mkdirSync(out,{recursive:true});
const report={checks:[],playback:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
async function fixture({offline=false,reduced=false,world=0,failed=false,blocked=false}={}){
 const context=await browser.newContext({viewport:{width:1672,height:941},reducedMotion:reduced?'reduce':'no-preference'});
 const page=await context.newPage(),requests=[];
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
 page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
 if(offline)await context.route('**/*',route=>route.request().isNavigationRequest()&&route.request().url().startsWith('file:')?route.continue():route.abort());
 if(failed)await context.route('**/stage-grasslands.mp4',route=>route.abort());
 const run=makeRun(83,['aurel','brakk']);run.planet=world;run.route=generateRoute(run);
 const saved={version:7,run:JSON.parse(JSON.stringify(run)),phase:'map',node:null,foes:[],profile:{owned:['aurel','brakk'],tutorial:true,reducedMotion:reduced}};
 await page.addInitScript(({saved,blocked})=>{
  localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');
  if(blocked){const play=HTMLMediaElement.prototype.play;let first=true;HTMLMediaElement.prototype.play=function(){if(first){first=false;return Promise.reject(new DOMException('Test autoplay denial','NotAllowedError'));}return play.call(this);};}
 },{saved,blocked});
 await page.goto(offline?pathToFileURL(path.resolve('Starfall-Menagerie.html')).href:base+'/index.html');
 await page.locator('.biome-route').waitFor();await page.evaluate(()=>document.fonts.ready);
 return {page,context,requests};
}
async function frame(page){
 return page.locator('.stage-background-video').evaluate(v=>{
  const c=document.createElement('canvas');c.width=180;c.height=320;c.getContext('2d').drawImage(v,0,0,180,320);return c.toDataURL();
 });
}
try{
 for(const offline of [false,true]){
  const tag=offline?'offline':'source',{page,context,requests}=await fixture({offline});
  await page.waitForFunction(()=>{const v=document.querySelector('.stage-background-video');return v?.readyState>=2&&!v.paused&&v.currentTime>.15;});
  const metadata=await page.locator('.stage-background-video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,loop:v.loop,inline:v.playsInline,src:v.currentSrc,rate:v.playbackRate}));
  assert.equal(metadata.duration,8);assert.equal(metadata.muted,true);assert.equal(metadata.loop,true);assert.equal(metadata.inline,true);assert.equal(metadata.rate,1);
  assert.ok(metadata.width>0&&metadata.height>0);assert.ok(metadata.src.startsWith(offline?'blob:':base));
  const before=await frame(page);await page.waitForTimeout(650);assert.notEqual(await frame(page),before,'actual decoded video frames change');
  if(!offline){
   report.decodedTimes=[];
   for(const target of [1.2,4,7.7]){
    const decoded=await page.locator('.stage-background-video').evaluate((v,target)=>new Promise(resolve=>{
     const capture=(_,meta)=>{if(meta.mediaTime<target){v.requestVideoFrameCallback(capture);return;}const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);resolve({time:meta.mediaTime,png:c.toDataURL().split(',')[1]});};v.requestVideoFrameCallback(capture);
    }),target);
    report.decodedTimes.push(decoded.time);fs.writeFileSync(`${out}/decoded-${target}.png`,Buffer.from(decoded.png,'base64'));
   }
   const detail=await page.locator('.stage-background-video').evaluate(v=>{const c=document.createElement('canvas');c.width=720;c.height=640;c.getContext('2d').drawImage(v,180,700,360,320,0,0,720,640);return c.toDataURL().split(',')[1];});
   fs.writeFileSync(`${out}/decoded-detail-2x.png`,Buffer.from(detail,'base64'));
  }
  for(const [width,height]of [[1672,941],[1440,900],[768,1024],[390,844],[320,720]]){
   await page.setViewportSize({width,height});await page.locator('.biome-route').scrollIntoViewIfNeeded();await page.waitForTimeout(200);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${tag} ${width}: no horizontal overflow`);
   assert.ok(await page.locator('.stage-background-video').evaluate(v=>{const a=v.getBoundingClientRect(),b=v.parentElement.getBoundingClientRect(),s=getComputedStyle(v);return Math.abs(a.width-b.width)<2&&Math.abs(a.height-b.height)<2&&s.objectFit==='cover'&&s.pointerEvents==='none';}),'video covers its scene without blocking controls');
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(80);await page.screenshot({path:`${out}/${tag}-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1672,height:941});await page.locator('.biome-route').scrollIntoViewIfNeeded();
  // Watch the actual eight-second boundary at normal playback speed.
  await page.locator('.stage-background-video').evaluate(v=>{v.currentTime=7.4;});
  await page.waitForFunction(()=>{const v=document.querySelector('.stage-background-video');return v.currentTime<1&&!v.paused&&v.readyState>=2;});
  assert.ok(await page.locator('.stage-background-video').evaluate(v=>v.readyState>=2&&!v.error),'loop retains decoded picture');
  await page.screenshot({path:`${out}/${tag}-loop.png`});
  await page.locator('.stage-background-video').evaluate(v=>{window.reviewVideo=v;});
  const available=page.locator('.route-node.available').first();await available.click();await page.locator('.route-node.route-locked').waitFor();
  assert.ok(await page.evaluate(()=>document.querySelector('.stage-background-video')===window.reviewVideo),'selecting a stage preserves the running video element');
  assert.equal(await page.locator('.field-continue').isEnabled(),true);
  const other=page.locator('.route-node.available').nth(1);await other.focus();await page.keyboard.press('Enter');
  assert.ok((await other.getAttribute('class')).includes('route-locked'),'keyboard selects another stage');
  const thumbnail=await page.locator('.encounter-art').evaluate(el=>({host:el.getBoundingClientRect().toJSON(),canvas:el.querySelector('canvas').getBoundingClientRect().toJSON(),width:el.clientWidth,height:el.clientHeight,borderTop:el.clientTop,borderLeft:el.clientLeft}));
  assert.ok(Math.abs(thumbnail.host.top+thumbnail.borderTop-thumbnail.canvas.top)<1&&Math.abs(thumbnail.host.left+thumbnail.borderLeft-thumbnail.canvas.left)<1&&Math.abs(thumbnail.height-thumbnail.canvas.height)<1&&Math.abs(thumbnail.width-thumbnail.canvas.width)<1,'retained encounter art fills the thumbnail inside its border: '+JSON.stringify(thumbnail));
  await page.screenshot({path:`${out}/${tag}-selected-stage.png`});
  await page.evaluate(()=>document.body.classList.add('gentle-ui'));
  // In-game setting is read by the animation tick, and CSS hides the video.
  await page.evaluate(()=>{starfall.state.profile.reducedMotion=true;});
  await page.waitForFunction(()=>document.querySelector('.stage-background-video').paused);
  assert.equal(await page.locator('.stage-background-video').isVisible(),false);
  assert.ok(await page.locator('.biome-route').evaluate(el=>getComputedStyle(el).backgroundImage.includes('url(')),'authored painting remains in gentle mode');
  await page.screenshot({path:`${out}/${tag}-gentle.png`});
  await page.evaluate(()=>{starfall.state.profile.reducedMotion=false;document.body.classList.remove('gentle-ui');});
  await page.waitForFunction(()=>!document.querySelector('.stage-background-video').paused);
  assert.ok(await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return document.querySelector('.stage-background-video').paused;}),'visibility event pauses video before animation frames are suspended');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>!document.querySelector('.stage-background-video').paused);
  // Moving the scene offscreen stops decoding, then scrolling back resumes it.
  await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='review-spacer';spacer.style.height='200vh';document.body.append(spacer);scrollTo(0,document.body.scrollHeight);});
  await page.waitForFunction(()=>document.querySelector('.stage-background-video').paused);
  await page.locator('.biome-route').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.stage-background-video').paused);
  await page.evaluate(()=>document.querySelector('#review-spacer').remove());
  await available.click();await page.locator('.field-continue').click();await page.locator('#battle-canvas').waitFor();
  await page.waitForFunction(()=>window.reviewVideo.paused&&!window.reviewVideo.hasAttribute('src'));
  assert.equal(await page.locator('.stage-background-video').count(),0);
  await page.locator('[data-action="battle"]').click();await page.waitForFunction(()=>starfall.state.battle?.time>.2);
  await page.screenshot({path:`${out}/${tag}-live-combat.png`});
  if(offline)assert.deepEqual(requests,[],'file:// standalone has no network requests');
  report.playback.push({tag,...metadata,src:offline?'embedded video/mp4 blob':'/public/ui/uploaded/stage-grasslands.mp4'});
  report.checks.push(`${tag}: decoded changing frames, normal-speed loop, five viewport sizes, mouse/keyboard selection, retained player, gentle pause/resume, visibility-event pause/resume, offscreen pause/resume, cleanup, live combat${offline?', file:// with all network blocked':''}`);
  await context.close();
 }
 for(const options of [{reduced:true},{failed:true},{blocked:true}]){
  const {page,context}=await fixture(options),video=page.locator('.stage-background-video');
  if(options.reduced){await page.waitForTimeout(350);assert.ok(await video.evaluate(v=>v.paused));assert.equal(await video.isVisible(),false);}
  if(options.failed){await page.waitForFunction(()=>document.querySelector('.stage-background-video').hidden);assert.equal(await video.isVisible(),false);}
  if(options.blocked){await page.waitForTimeout(350);assert.ok(await video.evaluate(v=>v.paused));assert.equal(await video.isVisible(),true);await page.locator('.map-world-copy h1').click({force:true});await page.waitForFunction(()=>!document.querySelector('.stage-background-video').paused);}
  assert.ok(await page.locator('.biome-route').evaluate(el=>getComputedStyle(el).backgroundImage.includes('url(')));
  await page.locator('.route-node.available').first().click();await page.locator('.route-node.route-locked').waitFor();
  const tag=Object.keys(options)[0];await page.screenshot({path:`${out}/fallback-${tag}.png`});report.checks.push(`${tag}: authored fallback and usable stage selection`);await context.close();
 }
 for(const world of [1,2]){
  const {page,context}=await fixture({world});assert.equal(await page.locator('.stage-background-video').count(),0);assert.equal(await page.locator('.biome-route>canvas.background-motion').count(),1);report.checks.push(`World ${world+1} retains its own animated painting`);await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync(`${out}/browser-checks.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
