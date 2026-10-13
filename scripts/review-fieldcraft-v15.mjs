import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeRun,generateRoute,encounter} from '../game.js';
import {NATIVE_STARTERS} from '../native-content.js';

const base=process.env.BASE_URL||'http://127.0.0.1:3024';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const report={checks:[],errors:[],externalRequests:[]};
async function fixture(viewport={width:1440,height:1050},offline=false){
 const p=await browser.newPage({viewport,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));
 const r=makeRun(3,NATIVE_STARTERS);r.route=generateRoute(r);const node=r.route[0][0],{random,...run}=r;
 await p.addInitScript(data=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(data));},{version:6,run,node,foes:encounter(r,'battle',node.seed),phase:'prep',profile:{owned:NATIVE_STARTERS,tutorial:true,bonds:{}}});
 const url=offline?base+'/offline-v15':base;
 if(offline){const body=fs.readFileSync('Starfall-Menagerie.html');await p.route('**/*',route=>{if(route.request().url()===url)return route.fulfill({status:200,contentType:'text/html',body});report.externalRequests.push(route.request().url());return route.abort();});}
 await p.clock.install();await p.clock.pauseAt(await p.evaluate(()=>Date.now()+1000));await p.goto(url);await p.waitForFunction(()=>window.starfall);await p.clock.runFor(600);return p;
}
try{
 const p=await fixture();await p.screenshot({path:'public/fieldcraft-v15-desktop.png',fullPage:true});
 await p.locator('[data-action="battle"]').click();
 const encoder=spawn(process.env.FFMPEG_PATH||'/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libvpx','-deadline','realtime','-cpu-used','4','-b:v','2500k','-pix_fmt','yuv420p','-y','public/fieldcraft-v15-motion.webm'],{stdio:['pipe','ignore','pipe']});
 let encoderErrors='';encoder.stderr.on('data',d=>encoderErrors+=d);const encoded=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error(encoderErrors)));});
 for(let frame=0;frame<360;frame++){
  await p.clock.runFor(1000/30);
  const data=await p.locator('#battle-canvas').evaluate(c=>c.toDataURL('image/jpeg',1).split(',')[1]);
  if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
  if([60,150,300].includes(frame))await p.locator('#battle-canvas').screenshot({path:`playtest-artifacts/v15-motion-${frame}.png`});
 }
 encoder.stdin.end();await encoded;report.motion={fps:30,seconds:12,speed:1,source:'actual expedition battle, unchanged inputs'};await p.close();
 const mobile=await fixture({width:390,height:844});await mobile.screenshot({path:'public/fieldcraft-v15-mobile.png'});
 await mobile.locator('[data-creature="0"]').click();await mobile.locator('[data-detail-tab="equipment"]').click();await mobile.clock.runFor(500);
 const source=await mobile.locator('[data-gear-remove="0"]').boundingBox(),target=await mobile.locator('[data-switch-creature="1"]').boundingBox();assert.ok(source&&target);
 const client=await mobile.context().newCDPSession(mobile),x=source.x+source.width/2,y=source.y+source.height/2,tx=target.x+target.width/2,ty=target.y+target.height/2;
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let step=1;step<=12;step++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*step/12,y:y+(ty-y)*step/12}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.equal(await mobile.evaluate(()=>starfall.state.run.team[0].equipment.length),0);assert.equal(await mobile.evaluate(()=>starfall.state.run.team[1].equipment.length),2);
 report.checks.push('Real Chromium touch input transfers held equipment between companions without duplication');await mobile.screenshot({path:'public/fieldcraft-v15-loadout.png'});await mobile.close();
 const offline=await fixture({width:1280,height:960},true);assert.equal(await offline.evaluate(()=>starfall.state.run.rulesVersion),15);assert.equal(await offline.evaluate(()=>starfall.state.run.teamCapacity),2);await offline.locator('[data-action="battle"]').click();
 await offline.evaluate(()=>{const b=starfall.state.battle;for(let i=0;i<2600&&(!b.done||b.captureScene);i++)b.step(.05);});await offline.clock.runFor(3000);assert.equal(await offline.evaluate(()=>starfall.state.phase),'reward');await offline.reload();await offline.clock.runFor(300);
 assert.equal(await offline.evaluate(()=>starfall.state.run.rulesVersion),15);assert.deepEqual(report.externalRequests,[]);await offline.close();report.checks.push('Exact embedded V15 HTML completes native combat and saves/reloads with zero external requests');
 assert.deepEqual(report.errors,[]);fs.writeFileSync('playtest-artifacts/v15-review.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
