import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {PIXEL_SPECIES} from '../native-content.js';
import {MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {makeRun,creature,generateRoute} from '../game.js';
import {fingerprint,runtimeFiles,hashFile} from '../scripts/animation-contract.mjs';

const out=(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/melee-arm-review')+'/combat',base=process.env.BASE_URL||'http://127.0.0.1:3047',only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const specs=PIXEL_SPECIES.filter(s=>MELEE_ARM_FAMILIES.has(s.nativeDesign)&&(!only||only.split(',').includes(s.id)));
const files=[...runtimeFiles(),'Starfall-Menagerie.html','Starfall-Training-Glade.html','public/prototype-bundle.js'],inputs=fingerprint(files);
const ffmpeg=process.env.FFMPEG_PATH||path.resolve('playtest-artifacts/tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
fs.mkdirSync(out,{recursive:true});const report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{for(const offline of [false,true])for(const spec of specs){
 const variants=[{evolution:0,evolutionPath:'wild'},...Array.from({length:spec.evolutionLimit},(_,i)=>i+1).flatMap(evolution=>['wild','warden'].map(evolutionPath=>({evolution,evolutionPath})))];
 for(const variant of variants){
  const {evolution,evolutionPath}=variant,name=`${offline?'offline':'source'}-${spec.id}-${evolution}-${evolutionPath}`,context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const run=makeRun(491,['aurel']);run.team=[{...creature(spec.id),...variant,equipment:[],deploymentPosition:{x:430,y:420}}];run.teamCapacity=1;run.route=generateRoute(run);
  const foes=[{...creature(spec.id==='aurel'?'brakk':'aurel'),equipment:[],deploymentPosition:{x:535,y:420}}];
  await page.addInitScript(saved=>{
   localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...args){
    const [source,x,y,w,h]=args;
    if(this.canvas.width===1002&&this.canvas.height===654&&source.width===64&&source.height===64&&source.spriteTop!==undefined&&args.length===5){
     const u=window.starfall?.state.battle?.units.find(u=>u.side===0);
     if(u&&Math.abs(x+w/2-u.x)<6&&Math.abs(y+h*44/64-(u.y*.58+75))<6)window.__meleeFrame=source;
    }
    return draw.apply(this,args);
   };
  },{version:7,run,node:run.route[0][0],foes,phase:'prep',profile:{owned:[spec.id],tutorial:true}});
  const url=base+(offline?'/Starfall-Menagerie.html':'/index.html');
  if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()&&r.request().url()===url?r.continue():(requests.push(r.request().url()),r.abort()));
  await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto(url);await page.locator('[data-action="battle"]').click();
  await page.evaluate(()=>{for(const u of starfall.state.battle.units){u.hp=u.maxHp=100000;if(u.side===1)u.atk=1;}});
  const movie=path.join(out,name+'.mp4'),encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','12','-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let encoderError='';encoder.stderr.on('data',b=>encoderError+=b);const finished=once(encoder,'close'),seen=new Set(),stills={},hashes=new Set();let minPainted=4096;
  try{for(let frame=0;frame<72;frame++){
   await page.clock.runFor(frame%3===0?84:83);
   const capture=await page.evaluate(({label,variant})=>{
    const state=starfall.state,b=state.battle,u=b.units.find(u=>u.side===0),a=u.nativeActor,action=a.action;
    const phase=action?(action.released?(action.elapsed-action.windup)/(action.duration-action.windup):action.elapsed/action.windup):0;
    const stage=action?(action.released?(phase>.55?'recovery':'contact'):'windup'):u.moving?'travel':'idle';
    const sprite=window.__meleeFrame;if(!sprite)return {missing:true,stage};
    const c=document.createElement('canvas');c.width=672;c.height=256;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#183139';ctx.fillRect(0,0,672,256);
    const arena=document.querySelector('#battle-canvas'),scale=Math.min(320/arena.width,224/arena.height);ctx.drawImage(arena,0,0,arena.width,arena.height,0,24,arena.width*scale,arena.height*scale);
    ctx.drawImage(sprite,344,64,64,64);ctx.drawImage(sprite,464,32,192,192);ctx.fillStyle='#e7dfc2';ctx.font='12px monospace';ctx.fillText(`${label} ${variant} / ${stage} ${phase.toFixed(2)} / ${b.time.toFixed(2)}s`,4,15);ctx.fillText('actual battle frame: native / 3x',336,246);
    const rgba=sprite.getContext('2d').getImageData(0,0,64,64).data,painted=rgba.filter((_,i)=>i%4===3&&rgba[i]>0).length;
    return {png:c.toDataURL().split(',')[1],sprite:sprite.toDataURL().split(',')[1],stage,phase,painted,time:b.time,dir:a.spriteDirection,finite:[u.x,u.y,a.gait].every(Number.isFinite),unit:u.id};
   },{label:spec.name,variant:`${evolution}/${evolutionPath}/${offline?'offline':'source'}`});
   assert.ok(!capture.missing,`${name}: actual battle sprite asset must exist`);assert.equal(capture.unit,spec.id);assert.ok(capture.finite);assert.ok(capture.painted>200,`${name}: complete sprite visible`);
   minPainted=Math.min(minPainted,capture.painted);seen.add(capture.stage);hashes.add(capture.sprite);
   const png=Buffer.from(capture.png,'base64');if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
   if(['windup','contact','recovery'].includes(capture.stage)&&!stills[capture.stage]&&(capture.stage!=='windup'||capture.phase>.3)){
    fs.writeFileSync(path.join(out,`${name}-${capture.stage}.png`),png);fs.writeFileSync(path.join(out,`${name}-${capture.stage}-sprite.png`),Buffer.from(capture.sprite,'base64'));stills[capture.stage]={time:capture.time,dir:capture.dir,phase:capture.phase};
    if(capture.stage==='contact')await page.screenshot({path:path.join(out,name+'-game.png')});
   }
  }}finally{encoder.stdin.end();const [code]=await finished;assert.equal(code,0,encoderError);}
  assert.ok(seen.has('windup')&&seen.has('contact')&&seen.has('recovery'),`${name}: actually performed a complete attack`);assert.ok(hashes.size>12,`${name}: motion is visible`);
  const missingImages=await page.evaluate(()=>[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));assert.deepEqual(missingImages,[]);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  report.push({name,id:spec.id,family:spec.nativeDesign,captureVersion:2,offline,...variant,states:[...seen],stills,distinctFrames:hashes.size,minPainted,frames:72,fps:12,duration:6,videoHash:hashFile(movie),errors,requests,missingImages});
  fs.writeFileSync(out+`/report${only?'-'+only:''}.json`,JSON.stringify({inputs,cases:report},null,2)+'\n');await context.close();console.log(`${name}: actual individual combat, complete attack, ${hashes.size} distinct frames, no missing assets`);
 }
}}finally{await browser.close();}
assert.deepEqual(fingerprint(files),inputs,'runtime and both rebuilt offline files unchanged throughout individual combat review');
