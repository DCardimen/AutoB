import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const out='docs/evidence/skills-v2-companion-rules',browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000');
 const review=await page.evaluate(async()=>{
  const {paintSkillEffect,paintSkillProjectile,paintSkillHazard}=await import('/skill-vfx.js'),{skillIconData}=await import('/skill-visuals.js'),{SKILLS}=await import('/skills.js');
  const samples=[['cinderfall','nova'],['root-snare','nova'],['frostursa','nova'],['abyssal','ring'],['duskcap','ring'],['aurel','shield'],['nyra','heal'],['moonjelly','heal'],['elderoot','cast'],['evolve-syl-warden-2','shield'],['voltwing','lightning'],['soul-siphon','beam'],['thornstag','beam'],['solwyrm','breath'],['overcharge','ring'],['tidal-surge','ring'],['auto-syl','projectile'],['auto-cogwalker','projectile'],['auto-nyra','projectile'],['learn-cinderfall-3','projectile'],['cinderfall','hazard'],['root-snare','hazard'],['evolve-syl-wild-2','cast'],['nyxwing-utility','nova']];
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=864;const c=canvas.getContext('2d');c.fillStyle='#102b30';c.fillRect(0,0,1200,864);
  let draws=0;for(let i=0;i<samples.length;i++){
   const [id,type]=samples[i],x=i%6*200,y=Math.floor(i/6)*216;c.save();c.translate(x,y);c.beginPath();c.rect(1,1,198,214);c.clip();c.fillStyle='#163638';c.fillRect(2,2,196,212);c.strokeStyle='#3e605a';c.strokeRect(2,2,196,212);
   const icon=new Image();icon.src=skillIconData(SKILLS[id]);await icon.decode();c.drawImage(icon,9,9,35,35);c.fillStyle='#e5dfbd';c.font='11px Georgia';c.fillText(SKILLS[id].name,51,26);c.font='10px sans-serif';c.fillStyle='#8ab2ad';c.fillText(type.toUpperCase(),51,41);
   // Same ground projection, canvas state and immutable event records as combat.
   const screen=(x,y)=>({x,y:y*.58+75}),e={skillId:id,sourceId:id.replace('auto-',''),type,ttl:.4,max:.65,r:72,x:100,y:70,width:3};
   if(['beam','lightning','breath'].includes(type))Object.assign(e,{x:35,y:100,tx:165,ty:70,originZ:30,targetZ:30});
   const before=JSON.stringify(e),q=screen(e.x,e.y),transform=c.getTransform(),alpha=c.globalAlpha;
   if(type==='projectile')paintSkillProjectile(c,{skillId:id,source:{id:'syl'},x:110,y:100,vx:120,vy:-15,trail:[{x:65,y:105},{x:80,y:103},{x:95,y:102}],nativeArrow:id==='auto-syl',skill:true},screen,30,.2);
   else if(type==='hazard')paintSkillHazard(c,{...e,source:{id:'syl',side:1},total:1},screen,.4,{intensity:0});
   else paintSkillEffect(c,e,q,screen,45,.4);
   assertSame(JSON.stringify(e),before);assertSame(c.globalAlpha,alpha);assertSame(JSON.stringify(c.getTransform()),JSON.stringify(transform));draws++;c.restore();
  }
  function assertSame(a,b){if(a!==b)throw Error('Painter changed state: '+a+' / '+b);}
  return {png:canvas.toDataURL().split(',')[1],draws};
 });fs.writeFileSync(out+'/effect-materials-and-danger-edges.png',Buffer.from(review.png,'base64'));
 const decode=[];
 for(const mode of ['source','offline']){
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000');await page.setContent('<video muted></video>');
  const frames=await page.evaluate(async url=>{
   const v=document.querySelector('video');v.src=url;await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject;});v.playbackRate=1;await v.play();const frames=[];
   for(const time of [6,3.2,2].map(t=>Math.max(0,v.duration-t))){const actual=await new Promise(resolve=>{const sample=(now,meta)=>meta.mediaTime>=time?resolve(meta.mediaTime):v.requestVideoFrameCallback(sample);v.requestVideoFrameCallback(sample);});const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);const zoom=document.createElement('canvas');zoom.width=1000;zoom.height=600;const z=zoom.getContext('2d');z.imageSmoothingEnabled=false;z.drawImage(v,240,280,500,300,0,0,1000,600);frames.push({actual,png:c.toDataURL().split(',')[1],zoom:zoom.toDataURL().split(',')[1]});}v.pause();return {rate:v.playbackRate,width:v.videoWidth,height:v.videoHeight,frames};
  },'data:video/webm;base64,'+fs.readFileSync(path.resolve(out+`/${mode}-combat-normal-speed.webm`)).toString('base64'));
  assert.equal(frames.rate,1);for(let i=0;i<frames.frames.length;i++){const f=frames.frames[i];fs.writeFileSync(`${out}/${mode}-decoded-${i+1}.png`,Buffer.from(f.png,'base64'));if(i===2)fs.writeFileSync(`${out}/${mode}-decoded-detail-2x.png`,Buffer.from(f.zoom,'base64'));}decode.push({mode,rate:frames.rate,width:frames.width,height:frames.height,decodedTimes:frames.frames.map(f=>f.actual)});
 }
 fs.writeFileSync(out+'/visual-review.json',JSON.stringify({effectSamples:review.draws,paintersPreserveEventsAndCanvasState:true,decode},null,2));console.log(JSON.stringify({effectSamples:review.draws,decode}));
}finally{await browser.close();}
