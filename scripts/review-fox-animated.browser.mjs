import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import http from 'node:http';
import {chromium} from 'playwright';

const directory='docs/evidence/meshy-fox-forward-combat';fs.mkdirSync(directory,{recursive:true});
const root=path.resolve('public/meshy-fox-preview');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[],framing=[];
try{
 const page=await browser.newPage({viewport:{width:1000,height:800}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/animated.html`);await page.waitForFunction(()=>window.foxAnimation?.ready);await page.evaluate(()=>foxAnimation.pause());
 const controllerReview=await page.evaluate(()=>{
  const a=foxAnimation;a.action('idle');a.track(-.35);a.seek(.5);const head=a.model.getObjectByName('Head'),first=head.quaternion.clone();
  for(let i=0;i<5;i++){a.seek(.5);a.yaw(0);a.track(-.35);}
  const stableScrubbing=head.quaternion.angleTo(first)<1e-7;
  a.track(.35);const positive=head.rotation.y;a.track(-.35);const independentHeadTracking=positive>0&&head.rotation.y<0&&Math.abs(a.model.getObjectByName('Chest').rotation.y)<1e-7;
  a.action('shootLeft');a.travel(true);a.yaw(0);a.target([0,1.03,3]);a.seek(1.1);
  const bow=a.model.getObjectByName('Bow_Right_Hand'),left=a.model.getObjectByName('Hand_L'),nock=bow.localToWorld(bow.position.clone().set(.12,.025,0)),grip=left.localToWorld(left.position.clone().set(.130,0,0));
  const movingTargetContact=nock.distanceTo(grip),travelWorks=a.model.position.x<-.30;
  a.action('dash');const oneShotDefault=!document.querySelector('#repeat').checked;
  a.track(0,false);a.travel(false);a.action('idle');
  return {stableScrubbing,independentHeadTracking,movingTargetContact,travelWorks,oneShotDefault};
 });
 if(!controllerReview.stableScrubbing||!controllerReview.independentHeadTracking||controllerReview.movingTargetContact>1e-6||!controllerReview.travelWorks||!controllerReview.oneShotDefault)throw Error(JSON.stringify(controllerReview));
 for(const [mode,time]of [['idle',0],['walk',.3],['run',.25],['attack',1.1],['shootForward',1.1],['shootBackward',1.1],['shootLeft',1.1],['shootRight',1.1],['dash',.32],['dodgeLeft',.32],['dodgeRight',.32],['hit',.15],['death',2.3],['blink',2.75],['tailSwish',6.8]]){
  const data=await page.evaluate(([mode,time])=>{
   const a=foxAnimation,{renderer,camera,scene}=a,out=document.createElement('canvas');out.width=1024;out.height=560;const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,1024,560);renderer.setSize(256,256,false);camera.aspect=1;camera.updateProjectionMatrix();
   let clipped=0;
   for(let facing=0;facing<8;facing++){a.track(0,false);a.travel(mode.startsWith('shoot'));a.action(mode==='blink'||mode==='tailSwish'?'idle':mode);a.seek(time);a.yaw(facing*Math.PI/4);renderer.render(scene,camera);for(const mesh of a.meshes){let hidden=false;for(let p=mesh;p;p=p.parent)if(!p.visible||Math.abs(p.scale.x*p.scale.y*p.scale.z)<1e-9||/^(Arrow_|Release_)/.test(p.name))hidden=true;if(hidden)continue;const ids=mesh.geometry.index?new Set(mesh.geometry.index.array):Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>i);for(const id of ids){const p=mesh.getVertexPosition(id,mesh.position.clone()).applyMatrix4(mesh.matrixWorld).project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||Math.abs(p.z)>1)clipped++;}}const x=facing%4*256,y=Math.floor(facing/4)*280;c.drawImage(renderer.domElement,x,y+24);c.font='16px system-ui';c.fillStyle='#edf1e6';c.fillText(['S','SE','E','NE','N','NW','W','SW'][facing],x+12,y+19);}
   renderer.setSize(1000,650,false);camera.aspect=1000/650;camera.updateProjectionMatrix();return {image:out.toDataURL().split(',')[1],clipped};
  },[mode,time]);fs.writeFileSync(`${directory}/${mode}-eight-views.png`,Buffer.from(data.image,'base64'));framing.push({mode,clippedVertices:data.clipped});
 }
 for(const [mode,time,yaw,name]of [['idle',0,0,'idle-front'],['idle',0,Math.PI/2,'idle-side'],['idle',2.75,0,'blink-front'],['attack',.3,0,'attack-setup'],['attack',1.1,Math.PI/4,'attack-aim'],['attack',1.2,0,'attack-release'],['run',.22,Math.PI/2,'run-side'],['dodgeRight',.35,Math.PI/4,'dodge-quarter'],['death',2.3,Math.PI/4,'fall-quarter'],['idle',6.8,Math.PI,'tail-swish-rear'],['shootLeft',1.1,0,'strafe-aim'],['dash',.25,Math.PI/4,'dash-quarter']]){
  await page.evaluate(([m,t,y])=>{foxAnimation.track(0,false);foxAnimation.travel(false);foxAnimation.action(m);foxAnimation.seek(t);foxAnimation.yaw(y);},[mode,time,yaw]);await page.waitForTimeout(60);await page.screenshot({path:`${directory}/${name}.png`});
 }
 const videos=await page.evaluate(async()=>{
  const a=foxAnimation,{renderer,camera,scene}=a;renderer.setSize(768,768,false);camera.aspect=1;camera.updateProjectionMatrix();
  function recorder(size,bitrate){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),chunks=[],rec=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:bitrate});const done=new Promise(r=>{rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});return {canvas,ctx,rec,done};}
  const full=recorder(768,1200000),first=recorder(640,260000),second=recorder(640,260000);
  const sequence=[['idle',8,0,8],['run',1.44,Math.PI/2,.72],['run',1.44,5*Math.PI/4,.72],['attack',2.2,Math.PI/4,2.2],['tracking',2.8,0,8],['shootForward',2.2,Math.PI/4,2.2],['shootBackward',2.2,Math.PI/4,2.2],['shootLeft',2.2,0,2.2],['shootRight',2.2,0,2.2],['dash',.85,Math.PI/4,.85],['dodgeLeft',1.25,0,1.25],['dodgeRight',1.25,0,1.25],['hit',1.2,Math.PI/4,1.2],['death',2.4,Math.PI/4,2.4]];
  const labels={idle:'Idle / blink / occasional tail swish',run:'Compact chibi run',attack:'Forward bow attack',tracking:'Head follows enemy',shootForward:'Shoot while moving forward',shootBackward:'Shoot while moving backward',shootLeft:'Shoot while strafing left',shootRight:'Shoot while strafing right',dash:'Forward dash',dodgeLeft:'Dodge left',dodgeRight:'Dodge right',hit:'Hit reaction',death:'Fall / feet raised'};
  let index=-1,origin=performance.now(),part=first;full.rec.start();first.rec.start();await new Promise(resolve=>{
   function frame(now){const total=(now-origin)/1000;let elapsed=total,i=0;while(i<sequence.length&&elapsed>=sequence[i][1]){elapsed-=sequence[i][1];i++;}if(i===sequence.length){full.rec.stop();part.rec.stop();resolve();return;}const [mode,,yaw,period]=sequence[i];if(index!==i){if(i===5){first.rec.stop();second.rec.start();part=second;}a.track(0,false);a.travel(mode.startsWith('shoot'));a.action(mode==='tracking'?'idle':mode);a.yaw(yaw);if(mode.startsWith('shoot'))a.target([Math.sin(yaw)*3,1.03,Math.cos(yaw)*3]);index=i;}
    a.ambient(total);a.seek(Math.min(period-1e-5,elapsed%period),false);a.yaw(yaw);if(mode==='tracking')a.track(.40*Math.sin(elapsed*2.2));renderer.render(scene,camera);
    for(const out of [full,part]){const size=out.canvas.width;out.ctx.drawImage(renderer.domElement,0,0,size,size);out.ctx.fillStyle='#edf1e6';out.ctx.font='18px system-ui';out.ctx.fillText(labels[mode],20,32);}
    requestAnimationFrame(frame);
   }requestAnimationFrame(frame);
  });return {full:await full.done,first:await first.done,second:await second.done};
 });
 for(const [name,data]of [['motion-preview',videos.full],['pose-preview',videos.first],['combat-preview',videos.second]])fs.writeFileSync(`${directory}/${name}.webm`,Buffer.from(data,'base64'));
 const video=videos.full;
 const decoded=await page.evaluate(async data=>{
  const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});
  const out=document.createElement('canvas');out.width=1024;out.height=840;const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,1024,840);
  const frames=[];for(const [i,time]of [0.6,2.75,6.2,8.4,11.9,14.3,16.98,19.18,21.38,23.58,25.05,31.0].entries()){await new Promise(r=>{v.onseeked=r;v.currentTime=time;});const native=document.createElement('canvas');native.width=native.height=768;native.getContext('2d').drawImage(v,0,0);frames.push({time,data:native.toDataURL().split(',')[1]});const x=i%4*256,y=Math.floor(i/4)*280;c.drawImage(v,x,y+24,256,256);c.font='16px system-ui';c.fillStyle='#edf1e6';c.fillText(time.toFixed(2)+'s',x+12,y+19);}
  v.currentTime=0;await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalPlayback=v.currentTime-start>.8&&v.playbackRate===1;v.pause();return {sheet:out.toDataURL().split(',')[1],frames,normalPlayback,duration:v.duration};
 },video);
 fs.writeFileSync(`${directory}/motion-decoded.png`,Buffer.from(decoded.sheet,'base64'));for(const f of decoded.frames)fs.writeFileSync(`${directory}/decoded-${f.time}.png`,Buffer.from(f.data,'base64'));
 for(const [time,name]of [[11.9,'attack'],[8.4,'run']]){
  const source=decoded.frames.find(f=>f.time===time).data;
  const enlarged=await page.evaluate(async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const c=document.createElement('canvas');c.width=c.height=1536;c.getContext('2d').drawImage(image,0,0,1536,1536);return c.toDataURL().split(',')[1];},source);
  fs.writeFileSync(`${directory}/decoded-${name}-enlarged.png`,Buffer.from(enlarged,'base64'));
 }
 if(errors.length||!decoded.normalPlayback||framing.some(f=>f.clippedVertices))throw Error(JSON.stringify({errors,normalPlayback:decoded.normalPlayback,framing}));
 fs.writeFileSync(`${directory}/browser-review.json`,JSON.stringify({assetSHA256:createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-animated.glb')).digest('hex'),errors,controllerReview,normalSpeedPlayback:decoded.normalPlayback,framing,videoBytes:fs.statSync(`${directory}/motion-preview.webm`).size,views:['S','SE','E','NE','N','NW','W','SW'],actions:['idle','walk','run','attack','shootForward','shootBackward','shootLeft','shootRight','dash','dodgeLeft','dodgeRight','hit','death','blink','tailSwish'],inlineVideoBytes:{pose:fs.statSync(`${directory}/pose-preview.webm`).size,combat:fs.statSync(`${directory}/combat-preview.webm`).size}},null,2));console.log('Recorded normal-speed preview and decoded frames');
}finally{await browser.close();await new Promise(r=>server.close(r));}
