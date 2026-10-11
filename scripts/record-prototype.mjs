import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
// Capture actual rendered frames at 30 fps. The simulation advances 1/30 second
// per encoded frame, so the resulting preview plays at normal game speed.
const output=process.argv[2]||'playtest-artifacts/prototype-1x.mp4';
fs.mkdirSync('playtest-artifacts',{recursive:true});
const encoder=spawn(process.env.FFMPEG_PATH||'/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-y',output],{stdio:['pipe','ignore','pipe']});
let errors='';encoder.stderr.on('data',d=>errors+=d);const finished=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(errors)));});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:960}});
try{
  await page.clock.install();
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:3003')+'/prototype.html');await page.waitForFunction(()=>prototypeLab.state.artLoaded);
  async function capture(seconds){
    for(let i=0;i<seconds*30;i++){
      await page.clock.runFor(1000/30);
      const data=await page.locator('canvas').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
      if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
    }
  }
  await page.locator('[data-scene="directions"]').click();
  for(const [id,index] of ['knight','orc','elf','caster','wolf'].map((id,i)=>[id,i])){
    await page.locator(`[data-select="0-${id}-${index}"]`).click();await capture(1);
  }
  await page.locator('[data-scene="movement"]').click();await capture(8);
  await page.locator('[data-select="0-knight-0"]').click();await page.locator('#focus-view').click();await capture(4);
  await page.locator('[data-select="0-wolf-4"]').click();await capture(4);
  await page.locator('[data-scene="study"]').click();
  for(const [id,index,pose,seconds] of [['knight',0,'attack',3],['orc',1,'attack',3],['elf',2,'attack',3],['caster',3,'cast',3]]){
    await page.locator(`[data-select="0-${id}-${index}"]`).click();await page.locator('#pose-facing').selectOption('0');await page.locator(`[data-pose="${pose}"]`).click();await capture(seconds);
  }
  await page.locator('#focus-view').click();await page.locator('[data-scene="battle"]').click();await capture(7);
  await page.locator('[data-scene="study"]').click();await page.locator('[data-select="0-orc-1"]').click();await page.locator('#focus-view').click();
  await page.locator('[data-pose="death"]').click();await capture(2);
  encoder.stdin.end();await finished;console.log(`Recorded 42 seconds at normal speed: ${output}`);
}finally{await browser.close();if(!encoder.stdin.destroyed)encoder.stdin.destroy();}
