import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import http from 'node:http';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';

// Records the recorded game fight (Rowan vs Brakk) from a camera that follows
// the fox at a three-quarter view, so the life layer reads at normal speed:
// the run and planted feet, pounces, tail and ears, hits, the archery set and
// the victory. Frames come from fixed 60 Hz steps at exactly 30 per second;
// the video is decoded back to check it plays at true speed, and stills are
// kept at native and doubled size.
const directory=process.env.BIPED_REVIEW_OUT||'docs/evidence/fox-next-level';
fs.mkdirSync(directory,{recursive:true});
const root=path.resolve('public/meshy-fox-preview');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await launchReviewBrowser();
const decodeTimes=[.4,.55,1.5,1.62,1.85,3.3,4.15,5.55,9.0,12.4,13.4,14.2];
try{
 const page=await browser.newPage({viewport:{width:960,height:640}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/biped-combat.html`);await page.waitForFunction(()=>window.foxCombat?.ready,null,{timeout:180000});
 const FPS=30;
 await page.evaluate(fps=>{const c=foxCombat;c.pause();const R=c.replay,cam=c.camera;R.reset();c.renderer.setPixelRatio(1);c.renderer.setSize(720,540,false);cam.aspect=720/540;cam.fov=30;cam.updateProjectionMatrix();let yaw=null;
  window.captureLife=(index,format='image/jpeg')=>{while(R.state.time<index/fps-1e-9)R.step(c.STEP);const f=R.fox;yaw=yaw===null?f.rotation.y:yaw+Math.atan2(Math.sin(f.rotation.y-yaw),Math.cos(f.rotation.y-yaw))*.08;
   const a=yaw+.5,d=2.1;cam.position.set(f.position.x+Math.sin(a)*d,.78,f.position.z+Math.cos(a)*d);cam.lookAt(f.position.x,.5,f.position.z);c.render();
   const src=c.renderer.domElement,out=window.lifeCanvas??=document.createElement('canvas');out.width=src.width;out.height=src.height;const g=out.getContext('2d');g.drawImage(src,0,0);
   g.fillStyle='rgba(23,33,39,.72)';g.fillRect(0,0,out.width,30);g.font='16px system-ui';g.fillStyle='#e6cc86';g.fillText(R.state.label,12,20);g.fillStyle='#b5e3b0';const t=R.state.time.toFixed(2)+'s';g.fillText(t,out.width-g.measureText(t).width-12,20);
   return out.toDataURL(format,.9).split(',')[1];};},FPS);
 const writer=webmWriter(`${directory}/life-closeup.webm`,{fps:FPS,bitrate:'2500k'});let frames=0;
 while(!(await page.evaluate(()=>foxCombat.replay.finished))&&frames<FPS*40)writer.write(Buffer.from(await page.evaluate(i=>captureLife(i),frames++),'base64'));
 await writer.finish();
 const data=fs.readFileSync(`${directory}/life-closeup.webm`).toString('base64');
 const decoded=await page.evaluate(async([data,times])=>{
  const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});
  v.currentTime=1e6;await new Promise(r=>v.onseeked=r);const duration=v.duration;
  const cols=4,W=360,H=270,out=document.createElement('canvas');out.width=cols*W;out.height=Math.ceil(times.length/cols)*H;const g=out.getContext('2d');const frames=[];
  for(const [i,time]of times.entries()){if(time>duration)continue;await new Promise(r=>{v.onseeked=r;v.currentTime=time;});const native=document.createElement('canvas');native.width=v.videoWidth;native.height=v.videoHeight;native.getContext('2d').drawImage(v,0,0);frames.push({time,data:native.toDataURL().split(',')[1]});g.drawImage(v,i%cols*W,Math.floor(i/cols)*H,W,H);}
  v.currentTime=2;await new Promise(r=>v.onseeked=r);await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalPlayback=v.currentTime-start>.8&&v.playbackRate===1;v.pause();
  return {sheet:out.toDataURL().split(',')[1],frames,duration,normalPlayback,width:v.videoWidth,height:v.videoHeight};
 },[data,decodeTimes]);
 fs.writeFileSync(`${directory}/life-decoded.png`,Buffer.from(decoded.sheet,'base64'));
 for(const f of decoded.frames)fs.writeFileSync(`${directory}/life-decoded-${f.time}.png`,Buffer.from(f.data,'base64'));
 for(const time of [1.5,5.55]){const f=decoded.frames.find(f=>f.time===time);if(!f)continue;const enlarged=await page.evaluate(async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const c=document.createElement('canvas');c.width=image.width*2;c.height=image.height*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(image,0,0,c.width,c.height);return c.toDataURL().split(',')[1];},f.data);fs.writeFileSync(`${directory}/life-decoded-${time}-enlarged.png`,Buffer.from(enlarged,'base64'));}
 const report={assetSHA256:createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-biped.glb')).digest('hex'),errors,video:{bytes:fs.statSync(`${directory}/life-closeup.webm`).size,duration:decoded.duration,width:decoded.width,height:decoded.height,normalPlayback:decoded.normalPlayback,fightSeconds:frames/FPS,fps:FPS},decodeTimes};
 fs.writeFileSync(`${directory}/life-review.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 if(errors.length||!decoded.normalPlayback||Math.abs(decoded.duration-frames/FPS)>.2)process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
