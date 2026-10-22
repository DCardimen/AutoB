import fs from 'node:fs';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {webmWriter} from './lib/encode-webm.mjs';
const out='docs/evidence/fox-biped1',browser=await launchReviewBrowser();
try{
 const page=await browser.newPage({viewport:{width:900,height:800}});
 await page.goto('http://127.0.0.1:3117/public/meshy-fox-preview/animated.html');await page.waitForFunction(()=>window.foxBiped?.ready);
 const shots=[
  {label:'Nose neutral',clip:'Idle',t:1.9,c:[.08,.72,.77],look:[0,.70,.16]},
  {label:'Right twitch',clip:'Idle',t:2.08,c:[.08,.72,.77],look:[0,.70,.16]},
  {label:'Left twitch',clip:'Idle',t:2.27,c:[.08,.72,.77],look:[0,.70,.16]},
  {label:'Quiver against clothing',clip:'Idle',t:.4,c:[.65,.65,-1.45],look:[0,.50,-.12]},
  {label:'Loaded preparation',clip:'Jump_Shot_Forward',t:.65},
  {label:'Forward shot / apex',clip:'Jump_Shot_Forward',t:1.08},
  {label:'Falling immediately',clip:'Jump_Shot_Forward',t:1.25},
  {label:'Landing absorption',clip:'Jump_Shot_Forward',t:1.44},
  {label:'Backward jump shot',clip:'Jump_Shot_Backward',t:1.08},
  {label:'Sideways bow / slide',clip:'Slide_Shot',t:1.15},
  {label:'Multiple arrows',clip:'Crouch_Volley',t:1.15},
  {label:'Pelvis tail / full length',clip:'Run',t:.3,c:[1.8,.9,-2.5],look:[0,.6,-.1]}
 ];
 const png=await page.evaluate(shots=>{
  const a=foxBiped;a.pause();const s=420,c=document.createElement('canvas');c.width=s*4;c.height=(s+26)*3;const ctx=c.getContext('2d');a.renderer.setSize(s,s,false);a.camera.aspect=1;
  for(const [i,shot]of shots.entries()){
   a.action(shot.clip);a.yaw(0);a.seek(shot.t);a.camera.position.set(...(shot.c||[1.6,1.0,3.4]));a.camera.lookAt(...(shot.look||[0,.68,.12]));a.camera.updateProjectionMatrix();a.renderer.render(a.scene,a.camera);
   const x=i%4*s,y=Math.floor(i/4)*(s+26);ctx.fillStyle='#202d32';ctx.fillRect(x,y,s,s+26);ctx.drawImage(a.renderer.domElement,x,y+26);ctx.fillStyle='white';ctx.font='15px system-ui';ctx.fillText(shot.label,x+9,y+18);
  }return c.toDataURL().split(',')[1];
 },shots);fs.writeFileSync(`${out}/features.png`,Buffer.from(png,'base64'));
 await page.evaluate(()=>{const a=foxBiped;a.action('Idle');a.pause();a.yaw(0);a.renderer.setSize(640,640,false);a.camera.aspect=1;a.camera.position.set(.08,.72,.77);a.camera.lookAt(0,.70,.16);a.camera.updateProjectionMatrix()});
 const writer=webmWriter(`${out}/nose-twitch.webm`,{fps:30,bitrate:'1600k'});
 for(let i=0;i<90;i++)writer.write(Buffer.from(await page.evaluate(t=>{foxBiped.seek(t);foxBiped.renderer.render(foxBiped.scene,foxBiped.camera);return foxBiped.renderer.domElement.toDataURL('image/jpeg',.9).split(',')[1]},1.5+i/30),'base64'));await writer.finish();
 await page.goto('http://127.0.0.1:3117/public/meshy-fox-preview/biped.html?source');await page.waitForFunction(()=>window.foxBiped?.ready);
 const source=await page.evaluate(()=>{const a=foxBiped;a.pause();a.action('Source bind pose');const s=320,c=document.createElement('canvas');c.width=s*4;c.height=(s+24)*2;const ctx=c.getContext('2d');a.renderer.setSize(s,s,false);a.camera.aspect=1;a.camera.position.set(0,.85,3.1);a.camera.lookAt(0,.55,0);a.camera.updateProjectionMatrix();for(let i=0;i<8;i++){a.yaw(i*Math.PI/4);a.renderer.render(a.scene,a.camera);const x=i%4*s,y=Math.floor(i/4)*(s+24);ctx.fillStyle='#202d32';ctx.fillRect(x,y,s,s+24);ctx.drawImage(a.renderer.domElement,x,y+24);ctx.fillStyle='white';ctx.font='14px system-ui';ctx.fillText('Original biped (1) / '+['S','SE','E','NE','N','NW','W','SW'][i],x+8,y+17);}return c.toDataURL().split(',')[1]});fs.writeFileSync(`${out}/source-eight-views.png`,Buffer.from(source,'base64'));console.log('Nose, quiver, jump phases and original eight facings captured');
}finally{await browser.close()}
