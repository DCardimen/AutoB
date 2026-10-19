import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const wrapper=path.resolve(process.argv[2]||'playtest-artifacts/meshy-fox-inline.html');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const errors=[],layouts=[];
try{
  const page=await browser.newPage({viewport:{width:768,height:850}});page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(wrapper).href);
  const frame=page.frames().find(f=>f.parentFrame());await frame.waitForFunction(()=>document.querySelector('video')?.currentTime>.2,{},{timeout:10000});
  for(const width of [320,736,1024]){await page.setViewportSize({width,height:850});await page.waitForTimeout(120);layouts.push(await frame.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth,video:document.querySelector('video').getBoundingClientRect().width})));}
  const video=await frame.evaluate(async()=>{const v=document.querySelector('video');v.pause();const t=v.currentTime;await new Promise(r=>setTimeout(r,180));if(v.currentTime!==t)throw Error('Pause failed');await v.play();return {duration:v.duration,paused:v.paused,readyState:v.readyState,playbackRate:v.playbackRate};});
  if(errors.length||layouts.some(l=>l.content>l.width))throw Error(JSON.stringify({errors,layouts}));
  let live;
  if(process.env.PREVIEW_URL){
    const app=await browser.newPage();app.on('pageerror',e=>errors.push(e.message));await app.goto(process.env.PREVIEW_URL);await app.waitForFunction(()=>window.fox3d?.ready);
    await app.selectOption('#facing','3');await app.selectOption('#motion','joints');await app.check('#bones');await app.check('#weights');
    live=await app.evaluate(()=>({bones:window.fox3d.bones.length,clips:window.fox3d.inspect().animations.length,facing:document.querySelector('#facing').value,canvas:document.querySelector('canvas').width}));
    if(live.bones!==28||live.clips!==2||errors.length)throw Error(JSON.stringify({live,errors}));
  }
  fs.writeFileSync('docs/evidence/meshy-fox-rig/inline-review.json',JSON.stringify({errors,layouts,video,live},null,2));console.log(JSON.stringify({errors,layouts,video,live}));
}finally{await browser.close();}
