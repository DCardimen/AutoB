import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import http from 'node:http';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';

// Records the scripted skirmish at true speed, decodes the video back into
// frames and stores the fight summary: shots, hits, gaze error and task order.
// Frames are rendered from the fixed-step simulation at exactly 30 per second.
const directory='docs/evidence/meshy-fox-archer-v2';fs.mkdirSync(directory,{recursive:true});
const root=path.resolve('public/meshy-fox-preview');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await launchReviewBrowser();
const decodeTimes=[1,2.6,3.4,5.6,7.8,9.6,11.5,12.7,14,15.7,17.5,19.7,21.1,23.1,25,31];
try{
 const page=await browser.newPage({viewport:{width:960,height:640}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/combat-demo.html`);await page.waitForFunction(()=>window.foxCombat?.ready);
 const FPS=30,writer=webmWriter(`${directory}/combat-demo.webm`,{fps:FPS,bitrate:'2500k'});
 const total=await page.evaluate(fps=>{const c=foxCombat;c.pause();c.reset();window.captureFrame=index=>{while(c.state.time<index/fps-1e-9)c.step();c.render();const src=c.renderer.domElement,out=window.captureCanvas??=document.createElement('canvas');out.width=src.width;out.height=src.height;const g=out.getContext('2d');g.drawImage(src,0,0);g.fillStyle='rgba(23,33,39,.72)';g.fillRect(0,0,out.width,34);g.font='18px system-ui';g.fillStyle='#e6cc86';g.fillText(c.state.label,14,23);g.fillStyle='#b5e3b0';g.fillText(`${c.state.shots.filter(s=>s.hit).length} / ${c.state.shots.length} hits · ${c.state.time.toFixed(1)}s`,out.width-230,23);return out.toDataURL('image/jpeg',.9).split(',')[1];};return Math.round(c.DURATION*fps);},FPS);
 for(let i=0;i<total;i++)writer.write(Buffer.from(await page.evaluate(i=>captureFrame(i),i),'base64'));
 await writer.finish();
 const recorded={data:fs.readFileSync(`${directory}/combat-demo.webm`).toString('base64'),fight:total/FPS,summary:await page.evaluate(()=>foxCombat.summary())};
 const decoded=await page.evaluate(async([data,times])=>{
  const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});
  // MediaRecorder WebM has no duration until the end is seeked once.
  v.currentTime=1e6;await new Promise(r=>v.onseeked=r);const duration=v.duration;
  const cols=4,W=320,H=213,out=document.createElement('canvas');out.width=cols*W;out.height=Math.ceil(times.length/cols)*(H+22);const g=out.getContext('2d');g.fillStyle='#202d32';g.fillRect(0,0,out.width,out.height);const frames=[];
  for(const [i,time]of times.entries()){await new Promise(r=>{v.onseeked=r;v.currentTime=time;});const native=document.createElement('canvas');native.width=v.videoWidth;native.height=v.videoHeight;native.getContext('2d').drawImage(v,0,0);frames.push({time,data:native.toDataURL().split(',')[1]});const x=i%cols*W,y=Math.floor(i/cols)*(H+22);g.drawImage(v,x,y+22,W,H);g.font='14px system-ui';g.fillStyle='#edf1e6';g.fillText(time.toFixed(1)+'s',x+8,y+16);}
  v.currentTime=2;await new Promise(r=>v.onseeked=r);await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalPlayback=v.currentTime-start>.8&&v.playbackRate===1;v.pause();
  return {sheet:out.toDataURL().split(',')[1],frames,duration,normalPlayback,width:v.videoWidth,height:v.videoHeight};
 },[recorded.data,decodeTimes]);
 fs.writeFileSync(`${directory}/combat-decoded.png`,Buffer.from(decoded.sheet,'base64'));
 for(const f of decoded.frames)fs.writeFileSync(`${directory}/combat-decoded-${f.time}.png`,Buffer.from(f.data,'base64'));
 for(const time of [7.8,23.1]){
  const enlarged=await page.evaluate(async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const c=document.createElement('canvas');c.width=image.width*2;c.height=image.height*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(image,0,0,c.width,c.height);return c.toDataURL().split(',')[1];},decoded.frames.find(f=>f.time===time).data);
  fs.writeFileSync(`${directory}/combat-decoded-${time}-enlarged.png`,Buffer.from(enlarged,'base64'));
 }
 const s=recorded.summary,report={assetSHA256:createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-animated.glb')).digest('hex'),errors,video:{bytes:fs.statSync(`${directory}/combat-demo.webm`).size,duration:decoded.duration,width:decoded.width,height:decoded.height,normalPlayback:decoded.normalPlayback,fightSeconds:recorded.fight,fps:FPS},
  shots:s.shots,hits:s.hits,defeatedAt:s.defeated,gaze:s.gaze,events:s.events,clips:s.history,shotDetail:s.shotsDetail};
 fs.writeFileSync(`${directory}/combat-review.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({errors,shots:s.shots,hits:s.hits,gaze:s.gaze,video:report.video}));
 if(errors.length||s.hits!==s.shots||s.shots<6||!decoded.normalPlayback||Math.abs(decoded.duration-recorded.fight)>.2)process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
