import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeRun,creature,generateRoute,encounter} from '../game.js';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativePosePixels} from '../native-poses.js';
import {nativeSpawn} from '../native-combat.js';
import {creatureWorldScale} from '../native-size.js';
import {arenaCamera} from '../arena-camera.js';
import {PIVOT} from '../prototype-pixel-art.js';
const base=process.env.BASE_URL||'http://127.0.0.1:3021',out='playtest-artifacts/deployment-selection';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),report={checks:[],errors:[]};
async function open(offline=false,mobile=false,record=false){
 const run=makeRun(78,['aurel','brakk']);run.team.push({...creature('voltwing'),seat:2});run.route=generateRoute(run);run.expeditionStarted=true;const node=run.route[0][0];node.type='battle';
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,...(record?{recordVideo:{dir:out,size:{width:1440,height:900}}}:{})}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen')},{version:7,run,node,foes:encounter(run,'battle',node.seed),phase:'prep',profile:{owned:['aurel','brakk','voltwing'],tutorial:true}});
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.waitForTimeout(300);

 return {page,context};
}
async function point(page,index){
 const {u,r}=await page.evaluate(index=>{const b=document.querySelector('#battle-canvas').getBoundingClientRect();return {u:starfall.state.run.team[index],r:{x:b.x,y:b.y,width:b.width,height:b.height}}},index);
 const spec=pixelSpec(u.id),pos=nativeSpawn(spec,u,0,index),scale=3*creatureWorldScale(spec,u),pixels=nativePosePixels(spec,u,'idle',.25,0),cam=arenaCamera(r.width,r.height);let sx=0,sy=0,count=0;
 for(let n=0;n<4096;n++)if(pixels[n*4+3]>180){sx+=n%64;sy+=Math.floor(n/64);count++}
 return {x:r.x+(pos.x+(sx/count-PIVOT.x)*scale-cam.x)*cam.scale,y:r.y+(pos.y*.58+75+(sy/count-PIVOT.y)*scale-cam.y)*cam.scale,pos,scale:cam.scale};
}
async function drag(page,index,touch=false){const p=await point(page,index),dx=60*p.scale,dy=8*p.scale;
 if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+dx*i/6,y:p.y+dy*i/6}]});await page.waitForTimeout(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
 else{await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+dx,p.y+dy,{steps:3});await page.waitForTimeout(20);await page.mouse.up();}
 const result=await page.evaluate(index=>starfall.state.run.team[index].deploymentPosition,index);assert.ok(result&&Number.isFinite(result.x+result.y)&&Math.abs(result.x-p.pos.x)>5,JSON.stringify({index,p,result}));return result;
}
try{
 for(const offline of [false,true]){
  const {page,context}=await open(offline);let checked=0;
  for(const spec of PIXEL_SPECIES)for(const evolution of [0,1,2]){
   await page.evaluate(({id,evolution})=>{const run=starfall.state.run;run.team=[{...run.team[0],id,uid:'drag:'+id+':'+evolution,evolution,evolutionPath:'wild',seat:0,equipment:[],deploymentPosition:{x:270,y:evolution===1?235:470}}];},{id:spec.id,evolution});
   try{await drag(page,0);}catch(e){throw new Error(spec.id+' form '+evolution+': '+e.message)}checked++;
  }
  report.checks.push(`${offline?'Offline':'Source'}: ${checked} actual mouse pickup/move/release cases covering every family and all three forms, including high starts`);await context.close();
  const phone=await open(offline,true);await drag(phone.page,2,true);await phone.page.screenshot({path:out+'/'+(offline?'offline':'source')+'-owl-touch.png'});report.checks.push(`${offline?'Offline':'Source'}: real touch drag moves the owl on a 390px phone`);await phone.context.close();
 }
 const {page,context}=await open(false,false,true);for(const evolution of [0,1,2]){await page.evaluate(e=>{const u=starfall.state.run.team[2];u.evolution=e;u.deploymentPosition={x:245,y:620};},evolution);await page.waitForTimeout(700);await drag(page,2);await page.waitForTimeout(600);await page.screenshot({path:out+'/owl-form-'+evolution+'.png'});}
 await page.locator('[data-action="battle"]').click();await page.waitForTimeout(2000);assert.ok(await page.evaluate(()=>starfall.state.battle.time>0));const video=page.video();await context.close();await video.saveAs(out+'/owl-drag-normal-speed.webm');report.checks.push('Recorded normal-speed base/evolved/ascended owl dragging, recovery and subsequent live combat');assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
