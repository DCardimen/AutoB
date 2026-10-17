import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright';
const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/companion-animation'),manifest=JSON.parse(fs.readFileSync(path.join(out,'video-manifest.json'),'utf8'));
// A file:// movie has an opaque origin in Chromium. Serve the two review
// files together so decoded video pixels can be exported without relaxing
// browser security or passing file-access bypass flags.
const server=http.createServer((req,res)=>{
 const name=req.url==='/review.html'?'review.html':req.url==='/all-companions.mp4'?'all-companions.mp4':null;
 if(!name){res.writeHead(404);res.end();return;}
 const file=path.join(out,name),size=fs.statSync(file).size,range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/),start=range?Number(range[1]):0,end=range&&range[2]?Math.min(size-1,Number(range[2])):size-1;
 if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
 res.writeHead(range?206:200,{'Content-Type':name.endsWith('.mp4')?'video/mp4':'text/html','Content-Length':end-start+1,'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
 const stream=fs.createReadStream(file,{start,end});stream.pipe(res);res.on('close',()=>stream.destroy());
});server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/review.html`);
 const captures=[],targets=manifest.timeline.filter(s=>['walk','run','sprint','attack','cast','death'].includes(s.state)&&[0,1,4,6,7].includes(s.dir)).map(s=>({...s,time:s.start+(s.end-s.start)*.45}));
 await page.evaluate(async()=>{const v=document.querySelector('video');await new Promise((resolve,reject)=>{if(v.readyState>=2)return resolve();v.onloadeddata=resolve;v.onerror=reject;});v.playbackRate=1;await v.play();});
 // Advance through the actual decoder at 1× speed. A seek/screenshot of the
 // generated source cells would not verify the encoded movie's timing.
 const enlarged=new Set();
 for(const [captureIndex,target]of targets.entries()){
  const result=await page.evaluate(async({target,manifest,captureIndex})=>{
   const video=document.querySelector('video');const time=await new Promise(resolve=>{const sample=(now,meta)=>meta.mediaTime>=target.time?resolve(meta.mediaTime):video.requestVideoFrameCallback(sample);video.requestVideoFrameCallback(sample);});
   const ids=[...new Set(['feralfox','drake','troll','dwarf',...Array.from({length:4},(_,i)=>manifest.positions[(captureIndex*4+i)%manifest.positions.length].identity)])];
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=1000+ids.length*210;const c=canvas.getContext('2d');c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;c.drawImage(video,0,0);
   ids.forEach((id,i)=>{const p=manifest.positions.find(p=>p.identity===id);p.forms.forEach((f,j)=>c.drawImage(video,f.x,f.y,64,64,j*240+12,1000+i*210+16,192,192));c.fillStyle='#e7dfc2';c.font='12px monospace';c.fillText(id+' / base - mature - apex / '+target.state,12,1000+i*210+12);});
   return {time,ids,rate:video.playbackRate,width:video.videoWidth,height:video.videoHeight,png:canvas.toDataURL().split(',')[1]};
  },{target,manifest,captureIndex});
  assert.equal(result.rate,1);assert.equal(result.width,manifest.width);assert.equal(result.height,manifest.height);assert.ok(result.time>=target.time&&result.time<target.time+.3,'decoder runs at the authored cadence');
  result.ids.forEach(id=>enlarged.add(id));
  const file=`decoded-${target.dir}-${target.state}.png`;fs.writeFileSync(path.join(out,file),Buffer.from(result.png,'base64'));captures.push({file,time:result.time,state:target.state,dir:target.dir,enlargedFamilies:result.ids});
 }
 await page.evaluate(()=>document.querySelector('video').pause());assert.deepEqual(errors,[]);assert.equal(enlarged.size,41,'every authored family is reviewed in enlarged decoded frames');fs.writeFileSync(path.join(out,'decoded-video.json'),JSON.stringify({playbackRate:1,dimensions:[manifest.width,manifest.height],duration:manifest.duration,enlargedFamilies:[...enlarged],captures,errors},null,2)+'\n');
 console.log(`Decoded normal-speed video: ${captures.length} native/enlarged samples across ${manifest.duration}s; no browser errors.`);
}finally{await browser.close();server.close();}
