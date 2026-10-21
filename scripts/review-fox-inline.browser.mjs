import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launchReviewBrowser} from './lib/review-browser.mjs';

const directory=process.env.FOX_EVIDENCE_DIR||'docs/evidence/meshy-fox-archer-v3';
const browser=await launchReviewBrowser();
const report={errors:[],previews:[]};
try{
 for(const [name,chapter]of [['rowan-pose-preview','11.06'],['rowan-combat-preview','2.2']]){
  const html=fs.readFileSync(`${directory}/${name}.html`,'utf8');assert.ok(Buffer.byteLength(html)<1_000_000);assert.ok(!html.includes('@@VIDEO@@'));
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.setContent(html);await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
  const widths=[];
  for(const width of [320,736,1024]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));widths.push(width);}
  await page.locator('select').selectOption(chapter);await page.waitForTimeout(500);
  const playback=await page.evaluate(()=>{const v=document.querySelector('video');return {time:v.currentTime,playing:!v.paused,rate:v.playbackRate,duration:v.duration};});
  assert.ok(playback.time>=Number(chapter)&&playback.time<Number(chapter)+1.2);assert.ok(playback.playing&&playback.rate===1);
  report.previews.push({name,bytes:Buffer.byteLength(html),widths,chapter,playback});await page.close();
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(`${directory}/inline-review.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
