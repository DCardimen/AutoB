import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
// Capture actual rendered frames at 30 fps. The simulation advances 1/30 second
// per encoded frame, so the resulting preview plays at normal game speed.
const output=process.argv[2]||'playtest-artifacts/prototype-1x.mp4';
fs.mkdirSync('playtest-artifacts',{recursive:true});
const encoder=spawn(process.env.FFMPEG_PATH||'/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-y',output],{stdio:['pipe','ignore','pipe']});
let errors='';encoder.stderr.on('data',d=>errors+=d);const finished=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(errors)));});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:960}});
try{
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:3003')+'/prototype.html');await page.clock.runFor(100);await page.waitForFunction(()=>prototypeLab.state.artLoaded);
  // Stop wall-clock advancement: only the explicit 1/30-second step may move
  // simulation time while frames are encoded.

  async function capture(seconds,caption){
    console.log(`Recording ${seconds}s: ${caption}`);
    for(let i=0;i<seconds*30;i++){
      await page.clock.runFor(1000/30);
      const data=await page.locator('canvas').evaluate((c,caption)=>{const frame=document.createElement('canvas');frame.width=c.width;frame.height=c.height;const ctx=frame.getContext('2d');ctx.drawImage(c,0,0);if(caption){ctx.fillStyle='#102018e6';ctx.fillRect(20,20,450,46);ctx.fillStyle='#e6ead5';ctx.font='17px system-ui';ctx.fillText(caption,35,49);}return frame.toDataURL('image/png').split(',')[1];},caption);
      if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
    }
  }
  async function focus(on){if(await page.evaluate(()=>prototypeLab.state.focusView)!==on)await page.locator('#focus-view').click();}
  await page.locator('[data-scene="directions"]').click();
  for(const [id,index] of [['knight',0],['wolf',4]]){
    await page.locator(`[data-select="0-${id}-${index}"]`).click();await capture(2,'Pixel chibi v5 · eight views, one model');
  }
  await page.locator('[data-scene="movement"]').click();await page.locator('[data-pace="walk"]').click();await focus(false);await capture(5,'Walk · planted feet and heel-to-toe steps');
  await page.locator('[data-pace="run"]').click();await capture(4,'Run · longer stride and opposing arm swing');
  await page.locator('#restart').click();await page.locator('[data-select="0-knight-0"]').click();await page.locator('[data-pace="sprint"]').click();
  let box=await page.locator('canvas').boundingBox();await page.mouse.click(box.x+900*box.width/1000,box.y+504.2*box.height/650);
  await capture(1.5,'Sprint · accelerate along your ground order');await focus(true);await capture(1.5,'Sprint · close view at normal speed');
  await page.locator('[data-pace="walk"]').click();await capture(3,'Release sprint · brake and return to walking');
  await page.locator('#restart').click();await page.locator('[data-select="0-wolf-4"]').click();await page.locator('[data-pace="sprint"]').click();await focus(false);
  box=await page.locator('canvas').boundingBox();await page.mouse.click(box.x+100*box.width/1000,box.y+150.4*box.height/650);await focus(true);await capture(3,'Wolf gallop · four legs and rear hock joints');
  await page.locator('[data-scene="study"]').click();await page.locator('[data-select="0-orc-1"]').click();await page.locator('#pose-facing').selectOption('0');await page.locator('[data-pose="walk"]').click();await capture(4,'Orc walk · connected shoulders, hips and knees');
  for(const [id,index,pose,label] of [['knight',0,'attack','Sword · preparation, contact and recovery'],['elf',2,'attack','Bow · draw and release'],['caster',3,'cast','Staff · planted cast and release']]){
    await page.locator(`[data-select="0-${id}-${index}"]`).click();await page.locator(`[data-pose="${pose}"]`).click();await capture(3,label);
  }
  await focus(false);await page.locator('[data-scene="battle"]').click();await capture(5,'Live sparring · physical attacks and dodges');
  await page.locator('[data-scene="study"]').click();await page.locator('[data-select="0-orc-1"]').click();await focus(true);
  await page.locator('[data-pose="death"]').click();await capture(2,'Knockout · folded legs and a grounded fall');
  encoder.stdin.end();await finished;console.log(`Recorded 42 seconds at normal speed: ${output}`);
}finally{await browser.close();if(!encoder.stdin.destroyed)encoder.stdin.destroy();}
