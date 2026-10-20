import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';

const directory='docs/evidence/meshy-fox-full-motion';fs.mkdirSync(directory,{recursive:true});
const root=path.resolve('public/meshy-fox-preview');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[],framing=[];
try{
 const page=await browser.newPage({viewport:{width:1000,height:800}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/animated.html`);await page.waitForFunction(()=>window.foxAnimation?.ready);await page.evaluate(()=>foxAnimation.pause());
 for(const [mode,time]of [['idle',0],['walk',.3],['run',.22],['attack',1.1],['dodgeLeft',.32],['dodgeRight',.32],['hit',.15],['death',2.3],['blink',2.75]]){
  const data=await page.evaluate(([mode,time])=>{
   const a=foxAnimation,{renderer,camera,scene}=a,out=document.createElement('canvas');out.width=1024;out.height=560;const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,1024,560);renderer.setSize(256,256,false);camera.aspect=1;camera.updateProjectionMatrix();
   let clipped=0;
   for(let facing=0;facing<8;facing++){a.action(mode==='blink'?'idle':mode);a.seek(time);a.yaw(facing*Math.PI/4);renderer.render(scene,camera);for(const mesh of a.meshes){let hidden=false;for(let p=mesh;p;p=p.parent)if(!p.visible||Math.abs(p.scale.x*p.scale.y*p.scale.z)<1e-9||/^(Arrow_|Release_)/.test(p.name))hidden=true;if(hidden)continue;const ids=mesh.geometry.index?new Set(mesh.geometry.index.array):Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>i);for(const id of ids){const p=mesh.getVertexPosition(id,mesh.position.clone()).applyMatrix4(mesh.matrixWorld).project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||Math.abs(p.z)>1)clipped++;}}const x=facing%4*256,y=Math.floor(facing/4)*280;c.drawImage(renderer.domElement,x,y+24);c.font='16px system-ui';c.fillStyle='#edf1e6';c.fillText(['S','SE','E','NE','N','NW','W','SW'][facing],x+12,y+19);}
   renderer.setSize(1000,650,false);camera.aspect=1000/650;camera.updateProjectionMatrix();return {image:out.toDataURL().split(',')[1],clipped};
  },[mode,time]);fs.writeFileSync(`${directory}/${mode}-eight-views.png`,Buffer.from(data.image,'base64'));framing.push({mode,clippedVertices:data.clipped});
 }
 for(const [mode,time,yaw,name]of [['idle',0,0,'idle-front'],['idle',0,Math.PI/2,'idle-side'],['idle',2.75,0,'blink-front'],['attack',.3,0,'attack-setup'],['attack',1.1,Math.PI/4,'attack-aim'],['attack',1.2,0,'attack-release'],['run',.22,Math.PI/2,'run-side'],['dodgeRight',.35,Math.PI/4,'dodge-quarter'],['death',2.3,Math.PI/4,'fall-quarter']]){
  await page.evaluate(([m,t,y])=>{foxAnimation.action(m);foxAnimation.seek(t);foxAnimation.yaw(y);},[mode,time,yaw]);await page.waitForTimeout(60);await page.screenshot({path:`${directory}/${name}.png`});
 }
 const video=await page.evaluate(async()=>{
  const a=foxAnimation,{renderer,camera,scene}=a;renderer.setSize(640,640,false);camera.aspect=1;camera.updateProjectionMatrix();
  const out=document.createElement('canvas');out.width=640;out.height=640;const ctx=out.getContext('2d'),chunks=[],rec=new MediaRecorder(out.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:240000});
  const done=new Promise(r=>{rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
  const sequence=[['idle',4,0,4],['walk',2,Math.PI/4,1],['run',1.92,Math.PI/2,.64],['run',1.92,5*Math.PI/4,.64],['attack',4.4,Math.PI/4,2.2],['dodgeLeft',1.25,0,1.25],['dodgeRight',1.25,0,1.25],['hit',1.2,Math.PI/4,1.2],['death',2.4,Math.PI/4,2.4]];
  let index=-1,origin=performance.now();rec.start();await new Promise(resolve=>{
   function frame(now){let elapsed=(now-origin)/1000,i=0;while(i<sequence.length&&elapsed>=sequence[i][1]){elapsed-=sequence[i][1];i++;}if(i===sequence.length){rec.stop();resolve();return;}const [mode,,yaw,period]=sequence[i];if(index!==i){a.action(mode);index=i;}a.seek(Math.min(period-1e-5,elapsed%period));a.yaw(yaw);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0);ctx.fillStyle='#edf1e6';ctx.font='18px system-ui';ctx.fillText(({idle:'Idle / blink',walk:'Walk',run:'Run',attack:'Bow attack',dodgeLeft:'Dodge left',dodgeRight:'Dodge right',hit:'Hit reaction',death:'Fall / death'})[mode],20,32);requestAnimationFrame(frame);}requestAnimationFrame(frame);
  });return done;
 });fs.writeFileSync(`${directory}/motion-preview.webm`,Buffer.from(video,'base64'));
 const decoded=await page.evaluate(async data=>{
  const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});
  const out=document.createElement('canvas');out.width=1024;out.height=560;const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,1024,560);
  const frames=[];for(const [i,time]of [0.6,2.75,4.5,8.4,10.5,11.04,14.55,19.4].entries()){await new Promise(r=>{v.onseeked=r;v.currentTime=time;});const native=document.createElement('canvas');native.width=native.height=640;native.getContext('2d').drawImage(v,0,0);frames.push({time,data:native.toDataURL().split(',')[1]});const x=i%4*256,y=Math.floor(i/4)*280;c.drawImage(v,x,y+24,256,256);c.font='16px system-ui';c.fillStyle='#edf1e6';c.fillText(time.toFixed(2)+'s',x+12,y+19);}
  v.currentTime=0;await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalPlayback=v.currentTime-start>.8&&v.playbackRate===1;v.pause();return {sheet:out.toDataURL().split(',')[1],frames,normalPlayback,duration:v.duration};
 },video);
 fs.writeFileSync(`${directory}/motion-decoded.png`,Buffer.from(decoded.sheet,'base64'));for(const f of decoded.frames)fs.writeFileSync(`${directory}/decoded-${f.time}.png`,Buffer.from(f.data,'base64'));
 if(errors.length||!decoded.normalPlayback||framing.some(f=>f.clippedVertices))throw Error(JSON.stringify({errors,normalPlayback:decoded.normalPlayback,framing}));
 fs.writeFileSync(`${directory}/browser-review.json`,JSON.stringify({errors,normalSpeedPlayback:decoded.normalPlayback,framing,videoBytes:fs.statSync(`${directory}/motion-preview.webm`).size,views:['S','SE','E','NE','N','NW','W','SW'],actions:['idle','walk','run','attack','dodgeLeft','dodgeRight','hit','death','blink']},null,2));console.log('Recorded normal-speed preview and decoded frames');
}finally{await browser.close();await new Promise(r=>server.close(r));}
