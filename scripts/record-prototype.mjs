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
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:3007')+'/prototype.html');await page.clock.runFor(100);await page.waitForFunction(()=>prototypeLab.state.artLoaded);
  // Stop wall-clock advancement: only the explicit 1/30-second step may move
  // simulation time while frames are encoded.

  async function capture(seconds,caption){
    console.log(`Recording ${seconds}s: ${caption}`);
    for(let i=0;i<seconds*30;i++){
      await page.clock.runFor(1000/30);
      const data=await page.locator('#prototype-canvas').evaluate((c,caption)=>{const frame=document.createElement('canvas');frame.width=c.width;frame.height=c.height;const ctx=frame.getContext('2d');ctx.drawImage(c,0,0);if(caption){ctx.fillStyle='#102018e6';ctx.fillRect(20,20,450,46);ctx.fillStyle='#e6ead5';ctx.font='17px system-ui';ctx.fillText(caption,35,49);}return frame.toDataURL('image/png').split(',')[1];},caption);
      if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
    }
  }
  async function focus(on){if(await page.evaluate(()=>prototypeLab.state.focusView)!==on)await page.locator('#focus-view').click();}
  const select=async id=>{const index=['knight','orc','elf','caster','wolf','fox','mech','spider','jelly'].indexOf(id);await page.locator(`[data-select="0-${id}-${index}"]`).click();};
  await page.locator('[data-scene="directions"]').click();
  for(const id of ['knight','orc','elf','caster','fox']){await select(id);await capture(2,'V7 · distinct faces across eight directions');}
  await select('wolf');await capture(2,'Hound · folded ears and four planted paws');
  await page.locator('[data-scene="movement"]').click();await page.locator('[data-pace="run"]').click();await capture(3,'Nine bodies · readable running rhythms');
  await select('wolf');await focus(true);
  for(const [pace,seconds,label] of [['walk',3,'Hound · flat paws and low swing lift'],['run',3,'Hound · diagonal trot support'],['sprint',4,'Hound · alternating sprint and spine flex']]){await page.locator(`[data-pace="${pace}"]`).click();await capture(seconds,label);}
  await page.locator('[data-scene="study"]').click();
  for(const [id,state,dir,label]of [['knight','attack','0','Overhead · right-hand grip and low guard'],['knight','slash','6','Side slash · right hand in the rear view'],['orc','attack','1','Axe overhead · both fists on one handle'],['orc','slash','5','Axe side slash · depth-aware rear view']]){await select(id);await page.locator(`[data-pose="${state}"]`).click();await page.locator('#pose-facing').selectOption(dir);await capture(2,label);}
  await select('caster');await page.locator('[data-pose="cast"]').click();await page.locator('#pose-facing').selectOption('1');await capture(2,'Mage · silver bob, circlet and held staff');
  await select('knight');await page.locator('[data-pose="stop"]').click();await capture(2,'Fast stop · compressed support and recovery');
  await focus(false);await page.locator('[data-scene="battle"]').click();await capture(8,'Random teams of six · alternating strikes');
  await page.locator('#restart').click();await capture(6,'Restart · a fresh six-creature composition');
  await page.locator('[data-scene="study"]').click();await select('knight');await focus(true);await page.locator('#pose-facing').selectOption('2');await page.locator('[data-pose="charge"]').click();await capture(3,'Charged strike study · long, braced anticipation');
  await select('wolf');await page.locator('[data-pose="sprint"]').click();await page.locator('#pose-facing').selectOption('0');await capture(3,'Hound alternating stride study · front and rear paw pairs');
  await select('orc');await page.locator('[data-pose="death"]').click();await capture(3,'Ragdoll · connected limbs and gravity');
  encoder.stdin.end();await finished;console.log(`Recorded 60 seconds at normal speed: ${output}`);
}finally{await browser.close();if(!encoder.stdin.destroyed)encoder.stdin.destroy();}
