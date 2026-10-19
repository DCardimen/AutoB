import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {png} from './animation-artifacts.mjs';
const out=path.resolve('docs/evidence/fox-layered-preview'),original=new Uint8ClampedArray(512*192*4);
for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++)for(const p of authoredSourceFrame('fox',dir,stage).pixels)original.set([...p.rgb,255],((stage*64+p.y)*512+dir*64+p.x)*4);
const originalPng=png(512,192,original);fs.writeFileSync(path.join(out,'original-directions.png'),originalPng);
const report=JSON.parse(fs.readFileSync(path.join(out,'review.json'),'utf8'));
const video='data:video/webm;base64,'+fs.readFileSync(path.resolve(report.video)).toString('base64');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1024,height:720}});await page.goto(pathToFileURL(path.resolve('playtest-artifacts/fox-layered-inline-review.html')).href);
 const frame=page.frames().find(f=>f.parentFrame());await frame.waitForSelector('#fox-layered-inline[data-ready="true"]');
 const images=await frame.evaluate(async({original,video,report})=>{
  const source=new Image();source.src=original;await source.decode();
  const comparison=document.createElement('canvas');comparison.width=576;comparison.height=192;const cc=comparison.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(source,0,0);
  for(let i=0;i<3;i++)cc.drawImage(window.foxLayeredPreview.actors[i].buffer,512,i*64);
  const enlarged=document.createElement('canvas');enlarged.width=1728;enlarged.height=576;const ec=enlarged.getContext('2d');ec.imageSmoothingEnabled=false;ec.drawImage(comparison,0,0,1728,576);
  const movie=document.createElement('video');movie.muted=true;movie.src=video;await new Promise((resolve,reject)=>{movie.onloadedmetadata=resolve;movie.onerror=reject;});
  const choices=[['Idle',report.clips.idle+.2],['Blink',report.clips.blink],['Run',report.clips.run],['Run passing',report.clips.run+.16],['Full draw',report.clips.attack],['Release',report.clips.attack+.13],['Recovery',report.clips.release+.3]];
  const normal=document.createElement('canvas');normal.width=720;normal.height=choices.length*174;const nc=normal.getContext('2d');nc.imageSmoothingEnabled=false;nc.fillStyle='#101d25';nc.fillRect(0,0,normal.width,normal.height);
  for(let row=0;row<choices.length;row++){
   const [label,time]=choices[row];movie.currentTime=time;await new Promise(resolve=>movie.onseeked=resolve);
   nc.fillStyle='#e8dfc7';nc.font='12px system-ui';nc.fillText('Decoded normal speed · '+time.toFixed(2)+'s · native / enlarged',8,row*174+15);
   for(let i=0;i<3;i++){
    const r=report.canvasRects[i],x=r.x+r.width*.1,y=r.y,w=r.width*.8;
    nc.drawImage(movie,x,y,w,w,12+i*72,row*174+42,64,64);
    nc.drawImage(movie,x,y,w,w,266+i*150,row*174+28,128,128);
   }
  }
  return {native:comparison.toDataURL('image/png'),enlarged:enlarged.toDataURL('image/png'),normal:normal.toDataURL('image/png')};
 },{original:'data:image/png;base64,'+originalPng.toString('base64'),video,report});
 for(const [key,name]of [['native','original-current-native.png'],['enlarged','original-current-enlarged.png'],['normal','decoded-normal-speed.png']])fs.writeFileSync(path.join(out,name),Buffer.from(images[key].split(',')[1],'base64'));
 console.log('Saved original eight-direction sheets, layered comparison and decoded native/enlarged motion.');
}finally{await browser.close();}
