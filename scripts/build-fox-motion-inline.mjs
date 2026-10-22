import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {launchReviewBrowser} from './lib/review-browser.mjs';

const directory='docs/evidence/meshy-fox-archer-v3';
// Posters: the idle and double-shot moments decoded by the clip review.
const review=JSON.parse(fs.readFileSync(`${directory}/browser-review.json`,'utf8')),marks=review.decodedMarks;
const cache=process.platform==='win32'?path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData/Local'),'ms-playwright'):path.join(os.homedir(),'.cache/ms-playwright'),ffmpeg=process.env.FFMPEG_PATH||path.join(cache,'ffmpeg-1011',process.platform==='win32'?'ffmpeg-win64.exe':'ffmpeg-linux');
function inlineVideo(name){let file=`${directory}/${name}.webm`;if(fs.statSync(file).size>650000){const out=`${directory}/${name}-inline.webm`;execFileSync(ffmpeg,['-y','-loglevel','error','-i',file,'-vf','scale=480:480','-c:v','libvpx','-b:v','100k','-pix_fmt','yuv420p',out],{windowsHide:true});file=out;}return fs.readFileSync(file).toString('base64');}
const browser=await launchReviewBrowser();
try{
 const page=await browser.newPage();
 for(const [videoName,templateName,outputName,posterName]of [['pose-preview','fox-motion-inline','rowan-pose-preview',`decoded-${marks[0]}`],['combat-preview','fox-combat-inline','rowan-combat-preview',`decoded-${marks[7]}`]]){
  const poster=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=c.height=480;c.getContext('2d').drawImage(image,0,0,480,480);return c.toDataURL('image/jpeg',.70);},'data:image/png;base64,'+fs.readFileSync(`${directory}/${posterName}.png`).toString('base64'));
  const video=inlineVideo(videoName),chapters=review.chapters.filter((_,i)=>videoName==='pose-preview'?i<10:i>=10),offset=videoName==='pose-preview'?0:review.chapters[10].start,options=chapters.map(c=>`<option value="${+(c.start-offset).toFixed(3)}">${c.mode.replace(/([A-Z])/g,' $1')}</option>`).join(''),template=fs.readFileSync(`scripts/${templateName}.template.html`,'utf8').replace(/(<select[^>]*>)[\s\S]*?(<\/select>)/,`$1${options}$2`),html=template.replace('@@VIDEO@@',video).replace('@@POSTER@@',poster),file=`${directory}/${outputName}.html`;
  if(Buffer.byteLength(html)>1_000_000)throw Error('Inline preview exceeds size limit');fs.writeFileSync(file,html);console.log(`${file}: ${Buffer.byteLength(html)} bytes`);
 }
 const video=inlineVideo('acrobatic-combo'),poster='data:image/png;base64,'+fs.readFileSync(`${directory}/combo-decoded-2.4.png`).toString('base64'),html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Rowan v3 · acrobatic combo</title><style>body{margin:0;background:#202d32;color:#edf1e6;font:16px system-ui}main{max-width:760px;margin:auto;padding:16px}video{width:100%;display:block}h1{font-size:20px}</style><main><h1>Rowan v3 · acrobatic combo</h1><video controls playsinline loop poster="${poster}" src="data:video/webm;base64,${video}"></video><p>Run · dash · side flips · vault · jumping double shot · sliding sideways shot · crouched triple volley · duck · brake and pivot.</p></main></html>`;fs.writeFileSync(`${directory}/rowan-acrobatics-preview.html`,html);
}finally{await browser.close();}
