import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import http from 'node:http';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';
import {BOW,CLIPS,RELEASE} from '../public/meshy-fox-preview/fox-motion.mjs';

const directory='docs/evidence/meshy-fox-archer-v3';fs.mkdirSync(directory,{recursive:true});
const root=path.resolve('public/meshy-fox-preview');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await launchReviewBrowser();
const errors=[],framing=[];
try{
 const page=await browser.newPage({viewport:{width:1000,height:800}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/animated.html`);await page.waitForFunction(()=>window.foxAnimation?.ready);await page.evaluate(()=>foxAnimation.pause());
 const controllerReview=await page.evaluate(([fullDraw,nockY])=>{
  const a=foxAnimation;a.action('idle');a.track(-.35);a.seek(.5);const head=a.model.getObjectByName('Head'),first=head.quaternion.clone();
  for(let i=0;i<5;i++){a.seek(.5);a.yaw(0);a.track(-.35);}
  const stableScrubbing=head.quaternion.angleTo(first)<1e-7;
  const yaw=n=>{const z=new a.model.position.constructor(0,0,1).applyQuaternion(a.model.getObjectByName(n).getWorldQuaternion(head.quaternion.clone()));return Math.atan2(z.x,z.z);};a.track(.35);const headLeft=yaw('Head'),chestLeft=yaw('Chest');a.track(-.35);const connectedHeadTracking=headLeft>0&&chestLeft>0&&chestLeft<headLeft&&yaw('Head')<0&&yaw('Chest')<0&&yaw('Chest')>yaw('Head');
  a.action('shootLeft');a.travel(true);a.yaw(0);a.target([0,1.03,3]);a.seek(1.15);
  const bow=a.model.getObjectByName('Bow_Right_Hand'),left=a.model.getObjectByName('Hand_L'),nock=bow.localToWorld(bow.position.clone().set(fullDraw,nockY,0)),grip=left.localToWorld(left.position.clone().set(.130,0,0));
  const movingTargetContact=nock.distanceTo(grip),travelWorks=a.model.position.x<-.15;
  a.action('dash');const oneShotDefault=!document.querySelector('#repeat').checked;
  a.track(0,false);a.travel(false);a.action('idle');
  return {stableScrubbing,connectedHeadTracking,movingTargetContact,travelWorks,oneShotDefault};
 },[BOW.fullDraw,BOW.nockY]);
 if(!controllerReview.stableScrubbing||!controllerReview.connectedHeadTracking||controllerReview.movingTargetContact>1e-6||!controllerReview.travelWorks||!controllerReview.oneShotDefault)throw Error(JSON.stringify(controllerReview));
 for(const [id,morph]of [['ears',0],['sniff',2]]){
  await page.locator('#'+id).click();
  await page.waitForFunction(index=>{let active=false;foxAnimation.model.getObjectByName('Fox_Head').traverse(mesh=>{if(mesh.morphTargetInfluences?.[index]>.5)active=true;});return active;},morph);
  await page.evaluate(()=>foxAnimation.pause());
 }
 // Eight views of every reviewed state. Aliases pick a clip moment; blink,
 // anger and ear/nose states are driven by the ambient clock (seek sets it).
 const ALIAS={attackEnterStep:'attackEnter',attackExitStep:'attackExit',quiverReach:'attack',quiverDraw:'attack',quiverCarry:'attack',attackRelease:'attack',bowDrop:'attack',doubleNocked:'attackDouble',doubleLoosed:'attackDouble',angry:'attack',blink:'idle',tailSwish:'idle',earRight:'idle',earLeft:'idle',sniff:'idle'};
 for(const [mode,time]of [['idle',0],['walk',.3],['run',.25],['attackEnterStep',.12],['quiverReach',.28],['quiverDraw',.42],['quiverCarry',.62],['attack',1.15],['attackRelease',RELEASE+.07],['bowDrop',RELEASE+.17],['attackUpright',1.15],['attackTilted',1.15],['attackCrouched',1.15],['doubleNocked',1.15],['doubleLoosed',RELEASE+.07],['attackExitStep',.30],['angry',.9],['shootForward',1.15],['shootBackward',1.15],['shootLeft',1.15],['shootRight',1.15],['shootForwardLeft',1.15],['shootBackwardRight',1.15],['dash',.16],['dashBack',.16],['turnLeft45',.18],['turnRight45',.18],['turnLeft90',.25],['turnRight90',.25],['quickTurnLeft',.30],['runStop',.22],['runStopTurnLeft',.50],['runStopTurnRight90',.40],['dodgeLeft',.14],['dodgeRight',.14],['duck',.25],['jumpShot',1.15],['slideShot',1.15],['crouchVolley',1.15],['sideFlipLeft',.47],['sideFlipRight',.47],['vault',.52],['hit',.10],['death',2.3],['blink',1.415],['tailSwish',6.8],['earRight',1.34],['earLeft',4.14],['sniff',2.17]]){
  const data=await page.evaluate(([mode,time,clip])=>{
   const a=foxAnimation,{renderer,camera,scene}=a,out=document.createElement('canvas');out.width=1024;out.height=560;const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,1024,560);renderer.setSize(256,256,false);camera.aspect=1;camera.updateProjectionMatrix();
   let clipped=0;
   for(let facing=0;facing<8;facing++){a.track(0,false);a.travel(mode.startsWith('shoot'));a.action(clip);a.seek(time);if(!['blink','tailSwish','earRight','earLeft','sniff'].includes(mode))a.ambient(.5);a.yaw(facing*Math.PI/4);renderer.render(scene,camera);for(const mesh of a.meshes){let hidden=false;for(let p=mesh;p;p=p.parent)if(!p.visible||Math.abs(p.scale.x*p.scale.y*p.scale.z)<1e-9||/^(Arrow_|Release_)/.test(p.name))hidden=true;if(hidden)continue;const ids=mesh.geometry.index?new Set(mesh.geometry.index.array):Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>i);for(const id of ids){const p=mesh.getVertexPosition(id,mesh.position.clone()).applyMatrix4(mesh.matrixWorld).project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||Math.abs(p.z)>1)clipped++;}}const x=facing%4*256,y=Math.floor(facing/4)*280;c.drawImage(renderer.domElement,x,y+24);c.font='16px system-ui';c.fillStyle='#edf1e6';c.fillText(['S','SE','E','NE','N','NW','W','SW'][facing],x+12,y+19);}
   renderer.setSize(1000,650,false);camera.aspect=1000/650;camera.updateProjectionMatrix();return {image:out.toDataURL().split(',')[1],clipped};
  },[mode,time,ALIAS[mode]||mode]);fs.writeFileSync(`${directory}/${mode}-eight-views.png`,Buffer.from(data.image,'base64'));framing.push({mode,clippedVertices:data.clipped});
 }
 for(const [mode,time,yaw,name,camera]of [['idle',0,0,'idle-front'],['idle',0,Math.PI/2,'idle-side'],['idle',1.415,0,'blink-front',[0,1.05,1.6,0,1.04,0]],['attack',.9,0,'angry-front',[0,1.05,1.6,0,1.04,0]],['attack',.42,Math.PI,'quiver-draw-rear',[.9,1.4,1.5,0,.8,0]],['attack',.62,Math.PI/4,'quiver-carry'],['attack',1.15,Math.PI/4,'attack-aim'],['attack',RELEASE+.17,Math.PI/4,'bow-drop'],['attackDouble',RELEASE+.07,Math.PI/2,'double-shot'],['attackCrouched',1.15,Math.PI/4,'crouched-shot'],['run',.22,Math.PI/2,'run-side'],['dodgeRight',.14,Math.PI/4,'dodge-quarter'],['runStopTurnLeft',.5,Math.PI/4,'run-stop-turn'],['duck',.25,Math.PI/4,'duck-quarter'],['death',2.3,Math.PI/4,'fall-quarter'],['idle',6.8,Math.PI,'tail-rear'],['shootLeft',1.15,0,'strafe-aim'],['idle',1.34,0,'ear-twitch-front'],['idle',2.17,0,'nose-sniff-front']]){
  await page.evaluate(([m,t,y,c,n])=>{foxAnimation.track(0,false);foxAnimation.travel(false);foxAnimation.action(m);foxAnimation.seek(t);if(!/^(blink|tail|ear|nose)/.test(n))foxAnimation.ambient(.5);foxAnimation.yaw(y);if(c){const cam=foxAnimation.camera;cam.position.set(c[0],c[1],c[2]);cam.lookAt(c[3],c[4],c[5]);}},[mode,time,yaw,camera,name]);await page.waitForTimeout(60);await page.evaluate(()=>foxAnimation.renderer.render(foxAnimation.scene,foxAnimation.camera));await page.screenshot({path:`${directory}/${name}.png`});
 }
 // Each frame is rendered at its exact sequence time and encoded at 30 fps, so
 // the recordings play at true speed even when rendering is slower.
 // Each loop plays on its clip's own period; a stale period would hold the
 // last frame for the difference on every cycle and read as a stutter.
 const FPS=30,total=await page.evaluate(runPeriod=>{
  const a=foxAnimation,{renderer,camera,scene}=a;renderer.setSize(768,768,false);camera.aspect=1;camera.updateProjectionMatrix();
  const sequence=[['idle',8,0,8],['run',2*runPeriod,Math.PI/2,runPeriod],['run',2*runPeriod,5*Math.PI/4,runPeriod],['attackEnter',.5,Math.PI/4,.5],['attack',2.2,Math.PI/4,2.2],['attackUpright',2.2,Math.PI/4,2.2],['attackTilted',2.2,Math.PI/4,2.2],['attackExit',.55,Math.PI/4,.55],['face',2.8,0,8],['angry',2.2,0,2.2],
   ['attackCrouched',2.2,Math.PI/4,2.2],['attackDouble',2.2,Math.PI/2,2.2],['shootForward',2.2,Math.PI/4,2.2],['shootLeft',2.2,0,2.2],['dash',.7,Math.PI/4,.7],['dodgeLeft',.8,0,.8],['dodgeRight',.8,0,.8],['duck',.7,Math.PI/4,.7],['hit',1.0,Math.PI/4,1.0],['turnLeft90',.6,0,.6],['turnRight45',.42,Math.PI/2,.42],['quickTurnLeft',.62,Math.PI/4,.62],['runStop',.62,Math.PI/2,.62],['runStopTurnLeft',.9,Math.PI/4,.9],['dashBack',.66,Math.PI/4,.66],['shootBackwardLeft',2.2,Math.PI/4,2.2],['jumpShot',2.2,Math.PI/4,2.2],['slideShot',2.2,Math.PI/4,2.2],['crouchVolley',2.2,Math.PI/4,2.2],['sideFlipLeft',.95,0,.95],['sideFlipRight',.95,Math.PI/4,.95],['vault',1.05,Math.PI/4,1.05],['death',2.4,Math.PI/4,2.4]];
  const labels={idle:'Idle: small blinks, straight tail',run:'Run',attackEnter:'Take the stance',attack:'Canted shot: quiver draw, nock, loose, bow drop',attackUpright:'Upright bow (stance held)',attackTilted:'Tilted bow (stance held)',attackExit:'Leave the stance',face:'Ear twitch / nose sniff / blink',angry:'Angry while shooting',attackCrouched:'Crouched shot',attackDouble:'Double shot',shootForward:'Shoot while moving forward',shootLeft:'Shoot while strafing left',dash:'Dash',dodgeLeft:'Dodge left',dodgeRight:'Dodge right',duck:'Duck',hit:'Hit reaction',turnLeft90:'Turn left 90',turnRight45:'Turn right 45',quickTurnLeft:'Quick turn 180',runStop:'Run stop',runStopTurnLeft:'Run stop and turn 180',dashBack:'Dash back',shootBackwardLeft:'Shoot while kiting back-left',jumpShot:'Jumping double shot',slideShot:'Sliding sideways shot',crouchVolley:'Low triple volley',sideFlipLeft:'Side flip left',sideFlipRight:'Side flip right',vault:'Forward vault',death:'Fall'};
  const face=new Set(['face','angry']),clipOf=m=>({face:'idle',angry:'attack'})[m]||m;
  const canvases=[768,640].map(size=>{const c=document.createElement('canvas');c.width=c.height=size;return c;});let index=-1;
  window.reviewFrame=total=>{
   let elapsed=total,i=0;while(i<sequence.length-1&&elapsed>=sequence[i][1]){elapsed-=sequence[i][1];i++;}elapsed=Math.min(elapsed,sequence[i][1]-1e-5);const [mode,,yaw,period]=sequence[i];
   if(index!==i){a.track(0,false);a.travel(mode.startsWith('shoot'));a.action(clipOf(mode));a.yaw(yaw);if(mode.startsWith('shoot'))a.target([Math.sin(yaw)*3,1.03,Math.cos(yaw)*3]);index=i;}
   a.ambient(mode==='face'?1.1+elapsed:total);a.seek(mode==='face'?1.1+elapsed:Math.min(period-1e-5,elapsed%period),false);a.yaw(yaw);if(face.has(mode)){camera.position.set(0,1.10,2.0);camera.lookAt(0,1.10,0);}renderer.render(scene,camera);
   return {part:i<10?'pose':'combat',images:canvases.map(c=>{const g=c.getContext('2d');g.drawImage(renderer.domElement,0,0,c.width,c.height);g.fillStyle='#edf1e6';g.font='18px system-ui';g.fillText(labels[mode],20,32);return c.toDataURL('image/jpeg',.9).split(',')[1];})};
  };
  // Decode marks: a moment inside each reviewed segment.
  let at=0;window.reviewMarks=sequence.map(([mode,length])=>{const mark={mode,start:+at.toFixed(3),time:+(at+Math.min(length*.55,length-.05)).toFixed(2)};at+=length;return mark;});
  return sequence.reduce((sum,step)=>sum+step[1],0);
 },CLIPS.run.duration);
 const full=webmWriter(`${directory}/motion-preview.webm`,{fps:FPS,bitrate:'4M'}),parts={pose:webmWriter(`${directory}/pose-preview.webm`,{fps:FPS,bitrate:'180k'}),combat:webmWriter(`${directory}/combat-preview.webm`,{fps:FPS,bitrate:'150k'})};
 const marks=await page.evaluate(()=>window.reviewMarks),pick=['idle','attackEnter','attack','attackUpright','attackTilted','angry','attackCrouched','attackDouble','jumpShot','slideShot','crouchVolley','sideFlipLeft','sideFlipRight','vault','death'].map(m=>marks.find(k=>k.mode===m).time);
 for(let f=0;f<Math.round(total*FPS);f++){const frame=await page.evaluate(t=>reviewFrame(t),f/FPS);full.write(Buffer.from(frame.images[0],'base64'));parts[frame.part].write(Buffer.from(frame.images[1],'base64'));}
 for(const writer of [full,parts.pose,parts.combat])await writer.finish();
 const video=fs.readFileSync(`${directory}/motion-preview.webm`).toString('base64');
 const decoded=await page.evaluate(async([data,pick])=>{
  const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});
  const out=document.createElement('canvas');out.width=1024;out.height=1120;const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,1024,840);
  const frames=[];for(const [i,time]of pick.entries()){await new Promise(r=>{v.onseeked=r;v.currentTime=time;});const native=document.createElement('canvas');native.width=native.height=768;native.getContext('2d').drawImage(v,0,0);frames.push({time,data:native.toDataURL().split(',')[1]});const x=i%4*256,y=Math.floor(i/4)*280;c.drawImage(v,x,y+24,256,256);c.font='16px system-ui';c.fillStyle='#edf1e6';c.fillText(time.toFixed(2)+'s',x+12,y+19);}
  v.currentTime=0;await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalPlayback=v.currentTime-start>.8&&v.playbackRate===1;v.pause();return {sheet:out.toDataURL().split(',')[1],frames,normalPlayback,duration:v.duration};
 },[video,pick]);
 fs.writeFileSync(`${directory}/motion-decoded.png`,Buffer.from(decoded.sheet,'base64'));for(const f of decoded.frames)fs.writeFileSync(`${directory}/decoded-${f.time}.png`,Buffer.from(f.data,'base64'));
 for(const [time,name]of [[pick[2],'attack'],[pick[7],'double']]){
  const source=decoded.frames.find(f=>f.time===time).data;
  const enlarged=await page.evaluate(async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const c=document.createElement('canvas');c.width=c.height=1536;c.getContext('2d').drawImage(image,0,0,1536,1536);return c.toDataURL().split(',')[1];},source);
  fs.writeFileSync(`${directory}/decoded-${name}-enlarged.png`,Buffer.from(enlarged,'base64'));
 }
 if(errors.length||!decoded.normalPlayback||framing.some(f=>f.clippedVertices))throw Error(JSON.stringify({errors,normalPlayback:decoded.normalPlayback,framing}));
 fs.writeFileSync(`${directory}/browser-review.json`,JSON.stringify({assetSHA256:createHash('sha256').update(fs.readFileSync('public/meshy-fox-preview/fox-animated.glb')).digest('hex'),errors,controllerReview,normalSpeedPlayback:decoded.normalPlayback,framing,videoBytes:fs.statSync(`${directory}/motion-preview.webm`).size,views:['S','SE','E','NE','N','NW','W','SW'],actions:framing.map(f=>f.mode),decodedMarks:pick,chapters:marks,inlineVideoBytes:{pose:fs.statSync(`${directory}/pose-preview.webm`).size,combat:fs.statSync(`${directory}/combat-preview.webm`).size}},null,2));console.log('Recorded normal-speed preview and decoded frames');
}finally{await browser.close();await new Promise(r=>server.close(r));}
