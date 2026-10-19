import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve('public/fox-layered-preview'),out=path.resolve('docs/evidence/fox-stocky-motion-preview');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'base-directions.json'),'utf8'));
const input=manifest.directions.map(k=>({...k,src:'data:image/png;base64,'+fs.readFileSync(path.join(root,k.image)).toString('base64')}));
const report=JSON.parse(fs.readFileSync(path.join(out,'review.json'),'utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();
 const results=await page.evaluate(async({input,report,video})=>{
  const names=Object.keys(input[0].parts),sheet=document.createElement('canvas');sheet.width=1024;sheet.height=32+128*names.length;const ctx=sheet.getContext('2d');ctx.fillStyle='#14242c';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='14px system-ui';
  const hands=document.createElement('canvas');hands.width=1024;hands.height=416;const hc=hands.getContext('2d');hc.fillStyle='#14242c';hc.fillRect(0,0,hands.width,hands.height);hc.font='14px system-ui';
  const overview=document.createElement('canvas');overview.width=1024;overview.height=280;const oc=overview.getContext('2d');oc.fillStyle='#14242c';oc.fillRect(0,0,1024,280);oc.font='14px system-ui';
  const checks=[];
  for(let i=0;i<input.length;i++){
   const k=input[i],image=new Image();image.src=k.src;await image.decode();
   ctx.fillStyle=hc.fillStyle=oc.fillStyle='#e8dfc7';ctx.fillText(k.direction,i*128+8,20);oc.fillText(k.direction,i*128+8,20);
   for(let n=0;n<names.length;n++){const p=k.parts[names[n]],s=Math.min(108/p.w,100/p.h);ctx.drawImage(image,p.x,p.y,p.w,p.h,i*128+64-p.w*s/2,32+n*128+4,p.w*s,p.h*s);ctx.fillText(names[n],i*128+8,32+n*128+120);}
   const xx=i%4*256,yy=Math.floor(i/4)*208;hc.fillText(k.direction+' · anatomical right / left',xx+8,yy+20);
   for(let n=0;n<2;n++){const p=k.parts[n?'arm-left':'arm-right'],v=.64,sw=p.w,sh=p.h*(1-v),s=Math.min(112/sw,150/sh);hc.drawImage(image,p.x,p.y+p.h*v,sw,sh,xx+n*128+64-sw*s/2,yy+40,sw*s,sh*s);}
   for(let n=0;n<2;n++){const p=k.parts[n?'torso':'head-open'],s=Math.min(108/p.w,108/p.h);oc.drawImage(image,p.x,p.y,p.w,p.h,i*128+64-p.w*s/2,32+n*120,p.w*s,p.h*s);}
   const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const pc=c.getContext('2d');pc.drawImage(image,0,0);const px=pc.getImageData(0,0,c.width,c.height).data;
   for(const [name,p]of Object.entries(k.parts)){let occupied=0;for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)occupied+=px[(y*c.width+x)*4+3]>128;if(occupied<20)throw Error('Empty part '+k.direction+'/'+name);}
   checks.push({direction:k.direction,parts:names.length,width:image.width,height:image.height});
  }
  const movie=document.createElement('video');movie.muted=true;movie.src=video;await new Promise((resolve,reject)=>{movie.onloadedmetadata=resolve;movie.onerror=reject;});
  const choices=[['Run',report.clips.run],['Run passing',report.clips.run+.14],['Run support',report.clips.run+.28],['Idle',report.clips.idle],['Blink',report.clips.blink],['Full draw',report.clips.draw],['Release',report.clips.release]];
  const decoded=document.createElement('canvas');decoded.width=1024;decoded.height=576;const dc=decoded.getContext('2d');dc.fillStyle='#14242c';dc.fillRect(0,0,1024,576);dc.font='14px system-ui';
  for(let i=0;i<choices.length;i++){
   const [label,time]=choices[i];movie.currentTime=time;await new Promise(resolve=>movie.onseeked=resolve);const r=report.canvasRects[0],x=r.x+r.width*.1,y=r.y,w=r.width*.8;
   dc.fillStyle='#e8dfc7';dc.fillText('Recorded '+time.toFixed(2)+'s',i%4*256+8,Math.floor(i/4)*288+20);dc.drawImage(movie,x,y,w,w,i%4*256,Math.floor(i/4)*288+28,256,256);
  }
  const enlarged=document.createElement('canvas');enlarged.width=2048;enlarged.height=1152;const ec=enlarged.getContext('2d');ec.imageSmoothingEnabled=false;ec.drawImage(decoded,0,0,2048,1152);
  return {checks,sheet:sheet.toDataURL('image/png'),hands:hands.toDataURL('image/png'),overview:overview.toDataURL('image/png'),decoded:decoded.toDataURL('image/png'),enlarged:enlarged.toDataURL('image/png')};
 },{input,report,video:'data:video/webm;base64,'+fs.readFileSync(path.join(out,'normal-speed.webm')).toString('base64')});
 for(const [key,file]of [['sheet','direction-parts.png'],['hands','hand-review.png'],['overview','direction-heads-torsos.png'],['decoded','decoded-normal-speed.png'],['enlarged','decoded-enlarged.png']])fs.writeFileSync(path.join(out,file),Buffer.from(results[key].split(',')[1],'base64'));
 fs.writeFileSync(path.join(out,'direction-checks.json'),JSON.stringify(results.checks,null,2)+'\n');console.log(JSON.stringify(results.checks));
}finally{await browser.close();}
