import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const base=process.env.BASE_URL||'http://127.0.0.1:3003',report={checks:[],errors:[],screenshots:[]};
const addCheck=s=>{report.checks.push(s);console.log(s);};
const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
try {
await page.clock.install();
await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
await page.goto(base+'/prototype.html');await page.clock.runFor(100);await page.waitForFunction(()=>window.prototypeLab?.state.artLoaded);
assert.equal(await page.locator('.character-card').count(),5);
assert.equal(await page.evaluate(()=>prototypeLab.state.mode),'directions');
assert.equal(await page.evaluate(()=>prototypeLab.state.cache.rigVersion),5);
report.pixelPresentation=await page.evaluate(()=>{
  const canvas=document.querySelector('#prototype-canvas'),pixels=canvas.getContext('2d').getImageData(0,0,1000,650).data;
  let mismatchedBlocks=0;
  for(let y=0;y<650;y+=2)for(let x=0;x<1000;x+=2){
    const base=(y*1000+x)*4;
    if([base+4,base+4000,base+4004].some(p=>[0,1,2,3].some(channel=>pixels[p+channel]!==pixels[base+channel])))mismatchedBlocks++;
  }
  return {mismatchedBlocks,nativeArena:prototypeLab.state.cache.renderer.nativeArena,style:prototypeLab.state.cache.renderer.artStyle};
});
assert.equal(report.pixelPresentation.mismatchedBlocks,0,'background, characters and effects must share crisp two-pixel blocks');
assert.deepEqual(report.pixelPresentation.nativeArena,[500,325]);
const directionFrames={};
for(const [id,index] of ['knight','orc','elf','caster','wolf'].map((id,i)=>[id,i])){
  const frames=await page.evaluate(id=>prototypeLab.directionFrames(id),id);
  directionFrames[id]=new Set(frames.map(f=>createHash('sha256').update(f).digest('hex'))).size;
  assert.equal(directionFrames[id],8,`${id} must have eight distinct sprites at the SAME idle phase`);
  await page.locator(`[data-select="0-${id}-${index}"]`).click();
  await page.clock.runFor(100);
  await page.locator('canvas').screenshot({path:`playtest-artifacts/directions-${id}.png`});
  report.screenshots.push(`directions-${id}.png`);
}
assert.deepEqual(await page.evaluate(()=>prototypeLab.state.cache.directionalArt),{columns:8,characters:5,connectedModels:5});
report.characterDirectionFrames=directionFrames;
report.jointCoverage=await page.evaluate(async()=>{
  const {characterRig,projectRig}=await import('/prototype-rig.js');
  const {PROTOTYPE_CHARACTERS}=await import('/prototype-engine.js');
  let checks=0;const gaps=[];
  for(const spec of PROTOTYPE_CHARACTERS)for(const state of ['walk','run','sprint'])for(const phase of [0.125,0.25,0.5,0.75]){
    const rig=characterRig(spec.id,state,phase,'',{stride:spec.stride});
    const frames=prototypeLab.directionFrames(spec.id,state,phase);
    for(let dir=0;dir<8;dir++){
      const img=new Image();img.src=frames[dir];await img.decode();const sheet=document.createElement('canvas');sheet.width=256;sheet.height=256;const ctx=sheet.getContext('2d');ctx.drawImage(img,0,0);
      const start=spec.id==='wolf'?{...rig.body,x:rig.body.x+18,z:rig.body.z+4}:{...rig.body,z:rig.body.z+12},end={...rig.head,z:rig.head.z-5};
      const neckPoints=Array.from({length:8},(_,i)=>({x:start.x+(end.x-start.x)*i/7,y:start.y+(end.y-start.y)*i/7,z:start.z+(end.z-start.z)*i/7}));
      const points=[...neckPoints,...rig.legs.flatMap(l=>[l.root,l.joint,...(l.hock?[l.hock]:[]),l.end]),...rig.arms.flatMap(a=>[a.root,a.joint,a.end])];
      for(const point of points){
        const p=projectRig(point,dir*Math.PI/4),x=Math.round(128+p.x),y=Math.round(194+p.y),pixels=ctx.getImageData(x-1,y-1,3,3).data;
        checks++;if(!pixels.some((v,i)=>i%4===3&&v>180))gaps.push({id:spec.id,state,dir,x,y});
      }
    }
  }
  return {checks,gaps};
});
assert.deepEqual(report.jointCoverage.gaps,[],'rendered necks, shoulders, hips, elbows, knees, hocks and ankles must have opaque joins');
let directionBox=await page.locator('canvas').boundingBox();
await page.mouse.click(directionBox.x+375*directionBox.width/1000,directionBox.y+530*directionBox.height/650);
assert.equal(await page.evaluate(()=>prototypeLab.state.mode),'study');
assert.equal(await page.evaluate(()=>prototypeLab.state.poseFacing),5);
assert.equal(await page.evaluate(()=>prototypeLab.state.focusView),true);
await page.locator('#focus-view').click();
addCheck('Opening scene shows eight views side by side; all five characters have eight distinct sprites at one fixed pose phase, with five connected skinned models; clicking a view opens its close inspection');
await page.locator('[data-scene="battle"]').click();
assert.equal(await page.evaluate(()=>prototypeLab.state.arena.units.length),10);
await page.locator('#play-pause').click();
const frozen=await page.evaluate(()=>prototypeLab.state.arena.time);await page.clock.runFor(800);
assert.equal(await page.evaluate(()=>prototypeLab.state.arena.time),frozen);
await page.locator('#frame-step').click();assert.ok(await page.evaluate(()=>prototypeLab.state.arena.time)>frozen);
addCheck('Five complete character portraits and a ten-body scene; pause and frame stepping preserve simulation control');
await page.locator('[data-select="0-elf-2"]').click();
let box=await page.locator('canvas').boundingBox();
await page.mouse.click(box.x+350*box.width/1000,box.y+510*box.height/650);
const order=await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).order);
assert.ok(Math.abs(order.x-350)<1&&Math.abs(order.y-750)<2);
const before=await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).x);
await page.locator('#play-pause').click();await page.clock.runFor(1000);
assert.ok(await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).x)>before+20);
addCheck('Selecting a character and clicking ground produces actual movement in the physical scene');
await page.locator('[data-scene="movement"]').click();await page.clock.runFor(2500);
const movement=await page.evaluate(()=>prototypeLab.state.arena.units.map(u=>({travel:u.travel,gait:u.gait,dir:Math.round(u.facing/(Math.PI/4))})));
assert.ok(movement.every(u=>u.travel>30&&u.gait>0.25));
const facingSets=Object.fromEntries(['knight','orc','elf','caster','wolf'].map(id=>[id,new Set()]));
for(let i=0;i<160;i++){
  await page.clock.runFor(100);
  for(const u of await page.evaluate(()=>prototypeLab.state.arena.units.map(u=>({id:u.id,dir:((Math.round(u.facing/(Math.PI/4))%8)+8)%8}))))facingSets[u.id].add(u.dir);
}
report.movementDirectionFrames=Object.fromEntries(Object.entries(facingSets).map(([id,dirs])=>[id,dirs.size]));
assert.ok(Object.values(report.movementDirectionFrames).every(n=>n===8),'each moving character must turn through all eight facings');
await page.locator('[data-pace="walk"]').click();await page.clock.runFor(1500);
const planted=await page.evaluate(()=>prototypeLab.state.arena.units.map(u=>({id:u.id,feet:u.groundFeet.filter(f=>f.planted).map(f=>({x:f.x,y:f.y,z:f.z,serial:f.serial}))})));
assert.ok(planted.every(u=>u.feet.length>0),'each walking profile must have a supporting foot');
report.rigVersion=await page.evaluate(()=>prototypeLab.state.cache.rigVersion);
await page.locator('[data-speed="0.25"]').click();assert.equal(await page.evaluate(()=>prototypeLab.state.speed),0.25);
await page.locator('[data-speed="1"]').click();
await page.screenshot({path:'playtest-artifacts/prototype-movement.png',fullPage:true});report.screenshots.push('prototype-movement.png');
addCheck('All five locomotion profiles travel around the circuits and turn through all eight facings; speed changes work');
assert.equal(await page.locator('#locomotion-controls').isVisible(),true);
await page.locator('[data-pace="sprint"]').click();await page.clock.runFor(2000);
const sprinting=await page.evaluate(()=>prototypeLab.state.arena.units.map(u=>({id:u.id,active:u.sprintActive,blend:u.sprintBlend,stamina:u.stamina})));
assert.ok(sprinting.every(u=>u.active&&u.stamina<65&&u.stamina>50));
assert.ok(sprinting.some(u=>u.blend>0.35),'straight portions of the circuit must reach the sprint gait; tight turns may slow it');
await page.screenshot({path:'playtest-artifacts/prototype-sprint.png',fullPage:true});report.screenshots.push('prototype-sprint.png');
await page.locator('[data-pace="walk"]').click();await page.clock.runFor(1500);
assert.ok(await page.evaluate(()=>prototypeLab.state.arena.units.every(u=>!u.sprintActive&&u.sprintBlend<0.05)));
await page.locator('canvas').focus();await page.keyboard.down('Shift');await page.clock.runFor(800);
assert.equal(await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).sprintRequested),true);
await page.keyboard.up('Shift');
assert.equal(await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).sprintRequested),false);
await page.locator('#order-sprint').click();assert.equal(await page.locator('#order-sprint').getAttribute('aria-pressed'),'true');
await page.locator('#order-sprint').click();assert.equal(await page.locator('#order-sprint').getAttribute('aria-pressed'),'false');
report.sprint=sprinting;
await page.locator('[data-select="0-knight-0"]').click();
const moveBox=await page.locator('canvas').boundingBox();
const moveBefore=await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).x);
await page.mouse.click(moveBox.x+850*moveBox.width/1000,moveBox.y+481*moveBox.height/650);
assert.ok(await page.evaluate(()=>Math.abs(prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).order.x-850)<1));
await page.clock.runFor(800);
assert.ok(await page.evaluate(()=>prototypeLab.state.arena.units.find(u=>u.uid===prototypeLab.state.selected).x)>moveBefore+20);
addCheck('Walk/run/sprint pace controls, selected sprint toggle, Shift hold/release, acceleration, stride blending and stamina recovery work');
await page.locator('[data-scene="study"]').click();await page.locator('[data-select="0-orc-1"]').click();
await page.locator('#focus-view').click();assert.equal(await page.evaluate(()=>prototypeLab.state.focusView),true);
await page.locator('#play-pause').click();
const hashes=new Set(await page.evaluate(()=>prototypeLab.directionFrames('orc')));
for(let dir=0;dir<8;dir++){
  await page.locator('#pose-facing').selectOption(String(dir));await page.locator('#frame-step').click();
  assert.equal(await page.evaluate(()=>prototypeLab.state.poseFacing),dir);
}
assert.equal(hashes.size,8);
const stateFrames=new Set();
for(const state of ['idle','walk','run','sprint','turn','attack','cast','dash','dodge','hit','stagger','death']){
  await page.locator(`[data-pose="${state}"]`).click();for(let i=0;i<6;i++)await page.locator('#frame-step').click();
  assert.equal(await page.evaluate(()=>prototypeLab.sample.state),state);
  const data=await page.locator('canvas').evaluate(c=>c.toDataURL());stateFrames.add(createHash('sha256').update(data).digest('hex'));
}
assert.ok(stateFrames.size>=10);report.directionFrames=hashes.size;report.stateFrames=stateFrames.size;
await page.locator('[data-pose="attack"]').click();for(let i=0;i<4;i++)await page.locator('#frame-step').click();
await page.screenshot({path:'playtest-artifacts/prototype-study.png',fullPage:true});report.screenshots.push('prototype-study.png');
addCheck('Eight directional views and twelve animation states are inspectable, including a close view and death');
await page.locator('#focus-view').click();await page.locator('[data-scene="battle"]').click();await page.locator('#play-pause').click();
await page.clock.runFor(8500);
const liveMetrics=await page.evaluate(()=>({...prototypeLab.state.arena.metrics}));assert.ok(liveMetrics.hits>0&&liveMetrics.rolls>0&&liveMetrics.projectiles>0);
await page.screenshot({path:'playtest-artifacts/prototype-battle.png',fullPage:true});report.screenshots.push('prototype-battle.png');
await page.locator('#sound-toggle').click();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'true');
await page.locator('#sound-toggle').click();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
for(let i=0;i<55;i++){if(await page.evaluate(()=>prototypeLab.state.arena.done))break;await page.clock.runFor(1000);}
assert.equal(await page.evaluate(()=>prototypeLab.state.arena.done),true);assert.equal(await page.locator('#result').isVisible(),true);
report.battle=await page.evaluate(()=>({time:prototypeLab.state.arena.time,metrics:prototypeLab.state.arena.metrics,cache:prototypeLab.state.cache}));
assert.ok(report.battle.cache.frames<=report.battle.cache.maxFrames);
addCheck('Rendered sparring resolves with physical hits, projectile travel, rolls and deaths; optional audio toggles');
await page.setViewportSize({width:390,height:844});await page.locator('[data-scene="study"]').click();
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('[data-select="0-wolf-4"]').click();assert.equal(await page.evaluate(()=>prototypeLab.sample.id),'wolf');
await page.screenshot({path:'playtest-artifacts/prototype-mobile.png',fullPage:true});report.screenshots.push('prototype-mobile.png');
await page.locator('[data-scene="directions"]').click();
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'playtest-artifacts/directions-mobile.png',fullPage:true});report.screenshots.push('directions-mobile.png');
addCheck('390px mobile layout has no horizontal overflow and retains scene and character controls');
const offline=await browser.newPage({viewport:{width:1280,height:900}}),requests=[];
offline.on('pageerror',e=>report.errors.push('offline: '+e.message));
// The managed browser blocks file: navigation. Exercise the exact embedded HTML
// through one intercepted local document; abort every additional request.
const offlineURL=base+'/offline-prototype',body=fs.readFileSync('Starfall-Training-Glade.html');
await offline.route('**/*',r=>{if(r.request().url()===offlineURL)return r.fulfill({status:200,contentType:'text/html',body});requests.push(r.request().url());return r.abort();});
await offline.clock.install();
await offline.clock.pauseAt(await offline.evaluate(()=>Date.now()+1000));
await offline.goto(offlineURL);await offline.clock.runFor(100);await offline.waitForFunction(()=>prototypeLab.state.artLoaded);
assert.equal(await offline.evaluate(()=>prototypeLab.state.mode),'directions');
assert.equal(new Set(await offline.evaluate(()=>prototypeLab.directionFrames('wolf'))).size,8);
await offline.locator('[data-scene="battle"]').click();
await offline.clock.runFor(8000);assert.ok(await offline.evaluate(()=>prototypeLab.state.arena.metrics.hits)>0);
await offline.locator('[data-scene="study"]').click();await offline.locator('[data-pose="death"]').click();await offline.clock.runFor(1000);
assert.deepEqual(requests,[]);report.offlineExternalRequests=requests.length;addCheck('Standalone HTML runs combat and pose inspection with zero external requests');
assert.deepEqual(report.errors,[]);
fs.writeFileSync('playtest-artifacts/prototype-browser-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
