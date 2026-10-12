import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {GRAND_BATCH} from '../native-batch-two.js';
import {NATIVE_SPECIES} from '../native-content.js';
const ROSTER_BATCH=[...GRAND_BATCH,...NATIVE_SPECIES.filter(s=>['aurel','cogwalker','moonjelly','emberhound'].includes(s.id))];
const output=process.argv[2]||'public/native-roster-preview.mp4';
const encoder=spawn('/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart','-y',output],{stdio:['pipe','ignore','pipe']});
let stderr='';encoder.stderr.on('data',d=>stderr+=d);const complete=new Promise((resolve,reject)=>encoder.on('close',code=>code===0?resolve():reject(Error(stderr))));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto((process.env.BASE_URL||'http://127.0.0.1:3013')+'/index.html');await page.clock.runFor(300);await page.locator('[data-action="roster"]').first().click();
 for(const spec of ROSTER_BATCH){await page.locator('[data-roster="family"]').selectOption(spec.id);await page.locator('[data-roster="state"]').selectOption('run');
  for(let frame=0;frame<60;frame++){
   if(frame===30&&spec.evolutionLimit)await page.locator('[data-roster="form"]').selectOption(String(spec.evolutionLimit));await page.clock.runFor(1000/30);
   const data=await page.locator('#roster-canvas').evaluate((canvas,caption)=>{const out=document.createElement('canvas');out.width=768;out.height=360;const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(canvas,0,0);ctx.fillStyle='#142721';ctx.fillRect(8,4,752,30);ctx.fillStyle='#e5dfbd';ctx.font='14px sans-serif';ctx.fillText(caption,18,24);return out.toDataURL().split(',')[1];},spec.name+' · '+spec.rarity+' · '+(frame<30||!spec.evolutionLimit?'base form':spec.evolutionLimit===2?'ascendant form':'evolved form')+' · eight directions');
   if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
  }
 }
 encoder.stdin.end();await complete;console.log('Recorded 24 seconds at normal speed:',output);
}finally{await browser.close();if(!encoder.stdin.destroyed)encoder.stdin.destroy();}
