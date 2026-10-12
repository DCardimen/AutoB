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
  for(const id of ['knight','wolf']){await select(id);await capture(2,'Native 64×64 · eight directions');}
  await page.locator('[data-scene="movement"]').click();await page.locator('[data-pace="walk"]').click();await capture(3,'Nine bodies · walking and stable support');
  await page.locator('[data-pace="run"]').click();await capture(3,'Running · shorter limbs, longer drive');
  await select('knight');await page.locator('[data-pace="sprint"]').click();await focus(true);await capture(4,'Sprint · physical acceleration and cape lag');
  await page.locator('[data-pace="walk"]').click();await capture(2,'Fast stop · braking and planted recovery');
  await focus(false);let box=await page.locator('#prototype-canvas').boundingBox();await page.mouse.click(box.x+800*box.width/1002,box.y+400*box.height/654);await focus(true);await capture(2,'Change direction · turn, step, continue');
  await select('wolf');await page.locator('[data-pace="sprint"]').click();await capture(4,'Four-legged hound · trot and gallop');
  await page.locator('[data-scene="study"]').click();await select('mech');await page.locator('[data-pose="run"]').click();await page.locator('#pose-facing').selectOption('1');await capture(4,'Six-legged walker · alternating tripods');
  await select('spider');await capture(4,'Eight-legged spider · coordinated scuttle');
  await select('jelly');await capture(2,'Jelly · squash, hop and reform');await page.locator('[data-pose="cast"]').click();await capture(2,'Jelly · channel and release');
  await select('caster');await page.locator('[data-pose="run"]').click();await capture(3,'Silver-haired mage · flowing cape');
  await focus(false);await page.locator('[data-scene="battle"]').click();await select('knight');await page.clock.runFor(800);await page.locator('#order-dodge').click();await capture(4,'Physical dodge · displacement without immunity');
  await page.locator('[data-scene="study"]').click();await focus(true);
  for(const [id,state,seconds,label]of [['knight','attack',2,'Sword · windup, contact and recovery'],['elf','attack',2,'Rogue · aimed bow draw and release'],['caster','cast',1,'Mage · channel and release']]){await select(id);await page.locator(`[data-pose="${state}"]`).click();await capture(seconds,label);}
  await focus(false);await page.locator('[data-scene="battle"]').click();await capture(6,'Live sparring · impacts, recoil and dodging');
  await page.locator('[data-scene="study"]').click();await select('orc');await focus(true);await page.locator('[data-pose="knockdown"]').click();await capture(2,'Knockdown study · constrained ragdoll');await page.locator('[data-pose="getup"]').click();await capture(2,'Get-up study · recover into the standing pose');
  await page.locator('[data-pose="death"]').click();await capture(4,'Death study · gravity, joints and floor contact');
  encoder.stdin.end();await finished;console.log(`Recorded 60 seconds at normal speed: ${output}`);
}finally{await browser.close();if(!encoder.stdin.destroyed)encoder.stdin.destroy();}
