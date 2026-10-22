import fs from 'node:fs';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';

// Arm review for the biped fox. ARM_REVIEW_LABEL=before|after names the
// sheets, so the prior asset can be captured first for comparison; the
// sequence video and its decoded frames are written for the current asset.
const out=process.env.BIPED_REVIEW_OUT||'docs/evidence/fox-natural-arms',label=process.env.ARM_REVIEW_LABEL||'after',base=process.env.BASE_URL||'http://127.0.0.1:3117';
fs.mkdirSync(out,{recursive:true});
const poses=[['Idle',0],['Idle',4],['Walk',.25],['Walk',.75],['Run',.16],['Hit_Reaction',.4],['Turn_Left_90',.3],['Dash_Forward',.35],['Dodge_Left',.4],['Duck',.35],['Run_Stop',.3],['Bow_Attack_Enter',.25],['Bow_Attack',0],['Bow_Attack',1.1],['Bow_Attack',1.9]];
const facings=[0,1,2,3,4,5,6,7],names=['S','SE','E','NE','N','NW','W','SW'];
const browser=await launchReviewBrowser();
try{
 const page=await browser.newPage({viewport:{width:900,height:700}});
 await page.goto(`${base}/public/meshy-fox-preview/animated.html?arms=${Date.now()}`);
 await page.waitForFunction(()=>window.foxBiped?.ready,null,{timeout:180000});
 const sheet=(rows,cols,size,camera)=>page.evaluate(({rows,cols,size,camera,names,label})=>{const a=foxBiped;a.pause();const c=document.createElement('canvas');c.width=size*cols.length;c.height=(size+22)*rows.length;const ctx=c.getContext('2d');a.renderer.setSize(size,size,false);a.camera.aspect=1;
  rows.forEach(([name,t],r)=>cols.forEach((y,k)=>{a.action(name);a.yaw(y*Math.PI/4);a.seek(t);a.camera.position.set(...camera.p);a.camera.lookAt(...camera.l);a.camera.updateProjectionMatrix();a.renderer.render(a.scene,a.camera);const x=k*size,yy=r*(size+22);ctx.fillStyle='#202d32';ctx.fillRect(x,yy,size,size+22);ctx.drawImage(a.renderer.domElement,x,yy+22);ctx.fillStyle='white';ctx.font='13px system-ui';ctx.fillText(`${label} · ${name} ${t}s · ${names[y]}`,x+6,yy+16);}));
  return c.toDataURL().split(',')[1];},{rows,cols,size,camera,names,label});
 const full={p:[0,.8,2.6],l:[0,.45,0]},close={p:[0,.62,1.45],l:[0,.47,0]};
 fs.writeFileSync(`${out}/arms-${label}-eight-facings.png`,Buffer.from(await sheet(poses,facings,200,full),'base64'));
 fs.writeFileSync(`${out}/arms-${label}-close.png`,Buffer.from(await sheet(poses.filter((_,i)=>[0,2,5,6,12].includes(i)),[0,1,2,7],300,close),'base64'));
 if(label!=='after')process.exit(0);
 // Normal-speed sequence through rest, travel, reaction, turn and a shot.
 const sequence=[['Idle',1.5],['Walk',2],['Hit_Reaction',1],['Turn_Left_90',.6],['Run',1.28],['Run_Stop',.62],['Bow_Attack_Enter',.5],['Bow_Attack',2.2],['Bow_Attack_Exit',.55],['Idle',1]],writer=webmWriter(`${out}/arms-sequence.webm`,{fps:30,bitrate:'1800k'}),loops=new Set(['Idle','Walk','Run','Bow_Attack']);
 for(const [name,duration]of sequence){await page.evaluate(name=>{const a=foxBiped;a.action(name);a.yaw(Math.PI/4);a.renderer.setSize(640,640,false);a.camera.aspect=1;a.camera.position.set(1.5,.9,2.7);a.camera.lookAt(0,.48,0);a.camera.updateProjectionMatrix();},name);
  for(let f=0;f<Math.ceil(duration*30);f++)writer.write(Buffer.from(await page.evaluate(({t})=>{const a=foxBiped;a.seek(t);a.renderer.render(a.scene,a.camera);return a.renderer.domElement.toDataURL('image/jpeg',.9).split(',')[1];},{t:loops.has(name)?(f/30)%(name==='Idle'?8:name==='Walk'?1:name==='Run'?.64:2.2):Math.min(f/30,duration)}),'base64'));}
 const encoded=await writer.finish();
 const video=fs.readFileSync(`${out}/arms-sequence.webm`).toString('base64'),times=[.4,2.1,3.9,4.7,5.6,7.0,7.9,8.9,10.4,11.9],decoded=await page.evaluate(async({data,times})=>{const v=document.createElement('video');v.src='data:video/webm;base64,'+data;v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j});const frames=[];
  for(const t of times){await new Promise(r=>{v.onseeked=r;v.currentTime=t});const c=document.createElement('canvas');c.width=c.height=640;c.getContext('2d').drawImage(v,0,0);frames.push({t,image:c.toDataURL().split(',')[1]});}
  v.currentTime=0;await v.play();const start=v.currentTime;await new Promise(r=>setTimeout(r,1100));const normalSpeed=v.playbackRate===1&&v.currentTime-start>.8;v.pause();
  const c=document.createElement('canvas');c.width=1600;c.height=688;const ctx=c.getContext('2d');ctx.fillStyle='#202d32';ctx.fillRect(0,0,c.width,c.height);
  for(const [i,f]of frames.entries()){const im=new Image();im.src='data:image/png;base64,'+f.image;await im.decode();const x=i%5*320,y=Math.floor(i/5)*344;ctx.drawImage(im,140,90,360,360,x,y+24,320,320);ctx.fillStyle='white';ctx.font='14px system-ui';ctx.fillText(f.t+'s',x+8,y+17);}
  const sheet=c.toDataURL().split(',')[1],im=new Image();im.src='data:image/png;base64,'+frames[1].image;await im.decode();c.width=c.height=1280;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0,1280,1280);
  return {frames,sheet,enlarged:c.toDataURL().split(',')[1],normalSpeed,duration:v.duration};},{data:video,times});
 fs.writeFileSync(`${out}/arms-decoded-sheet.png`,Buffer.from(decoded.sheet,'base64'));fs.writeFileSync(`${out}/arms-decoded-native.png`,Buffer.from(decoded.frames[1].image,'base64'));fs.writeFileSync(`${out}/arms-decoded-enlarged.png`,Buffer.from(decoded.enlarged,'base64'));
 fs.writeFileSync(`${out}/arms-playback.json`,JSON.stringify({sequence,encoded,decodedDuration:decoded.duration,normalSpeed:decoded.normalSpeed,decodedTimes:times},null,2)+'\n');
 console.log({encoded,normalSpeed:decoded.normalSpeed});
}finally{await browser.close();}
