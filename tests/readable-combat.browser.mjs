import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,generateRoute,encounter} from '../game.js';

const out=process.env.PASS_ONE_OUT||'playtest-artifacts/pass-one/review';
fs.mkdirSync(out,{recursive:true});const report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{for(const offline of [false,true])for(const width of [1900,390,2560]){
 const height=width===390?844:935,label=`${offline?'offline':'source'}-${width}`;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width===390?3:width===1900?2:1,hasTouch:width===390,recordVideo:{dir:out,size:{width,height}}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const run=makeRun(337,['aurel','brakk']);run.route=generateRoute(run);const node=run.route[0][0];
 await page.addInitScript(saved=>{
  localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');
  // Measure actual alpha bounds from the painted frames drawn into the scene.
  // This works identically in the bundled, network-isolated offline game.
  const draw=CanvasRenderingContext2D.prototype.drawImage,clear=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas===window.__scene)window.__painted=[];return clear.apply(this,args);};
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   const [source,x,y,w,h]=args;
   if(this.canvas.width===1002&&this.canvas.height===654&&source.width===64&&source.height===64&&args.length===5){
    window.__scene=this.canvas;
    const pixels=source.getContext('2d').getImageData(0,0,64,64).data;let top=64,bottom=-1;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>80){top=Math.min(top,Math.floor((i/4)/64));bottom=Math.max(bottom,Math.floor((i/4)/64));}
    (window.__painted??=[]).push({x,y,w,h,paintedHeight:(bottom-top+1)*h/64});
   }
   return draw.apply(this,args);
  };
 },{version:7,run,node,foes:encounter(run,node.type,node.seed),phase:'prep',profile:{owned:['aurel','brakk'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:3000')+(offline?'/Starfall-Menagerie.html':''));
 await page.locator('[data-action="battle"]').click();await page.waitForTimeout(7500);
 const measurements=await page.evaluate(()=>{
  const b=starfall.state.battle,c=b.viewCamera,canvas=document.querySelector('.arena-viewport canvas'),r=canvas.getBoundingClientRect();
  return {phase:starfall.state.phase,time:b.time,defaults:starfall.state.profile.tuning,camera:c,arena:r.toJSON(),
   heights:(window.__painted||[]).map(p=>p.paintedHeight*c.scale*r.width/c.viewportWidth),
   focus:b.living(1).map(u=>({uid:u.uid,x:r.x+(u.x-c.x)*r.width/c.width,y:r.y+(u.y*.58+75-28*u.nativeScale-c.y)*r.height/c.height})),
   overflow:document.documentElement.scrollWidth-innerWidth,dockBottom:document.querySelector('.arena-control').getBoundingClientRect().bottom,
   targets:[...document.querySelectorAll('.speed-switch button,.pause-btn,.arena-dock button')].filter(e=>e.getBoundingClientRect().width).map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))};
 });
 assert.equal(measurements.phase,'battle');assert.ok(measurements.time>5);assert.ok(measurements.heights.length>=4);
 assert.ok(Object.values(measurements.defaults).every(v=>v===100),'verify at default tuning');
 const sorted=[...measurements.heights].sort((a,b)=>a-b),median=(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;
 assert.ok(median>=(width===390?40:60),`painted median ${median}px`);
 assert.ok(measurements.overflow<=1);assert.ok(measurements.dockBottom<=height-60*(width===390)+1);
 if(width===390)for(const target of measurements.targets)assert.ok(target.height>=44&&target.width>=37,`${target.label} touch target ${target.width}×${target.height}`);
 const target=measurements.focus.at(-1);
 if(width===390)await page.touchscreen.tap(target.x,target.y);else await page.mouse.click(target.x,target.y);
 assert.equal(await page.evaluate(()=>starfall.state.battle.focusUid),target.uid,'zoomed canvas taps focus the displayed enemy');
 await page.screenshot({path:`${out}/${label}.png`,scale:'css'});await page.waitForTimeout(4500);
 // Resize a running fight: camera and controls must adapt without losing combat.
 await page.setViewportSize({width:width===390?1024:390,height:844});await page.waitForTimeout(300);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);report.push({label,median,...measurements,errors});
 const video=page.video();await context.close();await video.saveAs(`${out}/${label}.webm`);
 }}finally{await browser.close();fs.writeFileSync(`${out}/browser.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify(report.map(({label,median,time,heights})=>({label,median,time,heights}))));
