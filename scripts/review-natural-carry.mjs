import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:3000',errors=[],checks=[];
fs.mkdirSync('playtest-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const sheet=await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels,SPRITE_ART_REVISION}=await import('/prototype-pixel-art.js');
  const rows=[['brakk',0,'idle',.25],['brakk',1,'idle',.25],['brakk',2,'idle',.25],['brom',0,'idle',.25],['aurel',0,'idle',.25],['tarka',0,'idle',.25],['brakk',0,'run',.25],['brakk',0,'attack',.46]];
  const cv=document.createElement('canvas');cv.width=1024;cv.height=rows.length*154;
  const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10242c';ctx.fillRect(0,0,cv.width,cv.height);ctx.font='12px sans-serif';
  const small=document.createElement('canvas');small.width=small.height=64;const sc=small.getContext('2d'),poses=[];
  rows.forEach(([id,evolution,state,phase],row)=>{
   const spec=pixelSpec(id);ctx.fillStyle='#d9dfca';ctx.fillText(`${spec.name} / stage ${evolution} / ${state}`,5,row*154+14);
   for(let dir=0;dir<8;dir++){
    const rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
    sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(small,dir*128,row*154+20,128,128);
    poses.push({id,evolution,state,dir,clipped:pixels.clipped,grip:rig.artProject(rig.weapon.grip),tip:rig.artProject(rig.weapon.tip)});
   }
  });
  return {png:cv.toDataURL().split(',')[1],poses,artRevision:SPRITE_ART_REVISION};
 });
 assert.ok(sheet.poses.every(p=>p.clipped===0),'complete pose silhouettes');
 fs.writeFileSync('playtest-artifacts/natural-carry-directions.png',Buffer.from(sheet.png,'base64'));
 checks.push('Eight-direction base/evolved carry, running and active attack contact sheet');
 await page.close();
 for(const offline of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),phone=await context.newPage(),external=[];
  phone.on('pageerror',e=>errors.push(e.message));
  if(offline){const body=fs.readFileSync('Starfall-Menagerie.html');await phone.route('**/*',r=>r.request().url()===base+'/offline-carry'?r.fulfill({contentType:'text/html',body}):(external.push(r.request().url()),r.abort()));}
  await phone.goto(offline?base+'/offline-carry':base);await phone.waitForFunction(()=>window.starfall?.state?.run);
  // Use an existing Brakk starter, retaining the real UI and save loader.
  await phone.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('starfall-menagerie-v1')),index=saved.run.team.findIndex(c=>c.id==='brakk');if(index<0)throw new Error('Brakk starter missing');saved.profile.tutorial=true;saved.run.team=[saved.run.team[index],...saved.run.team.filter((_,i)=>i!==index)];localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));});
  await phone.reload();await phone.locator('[data-creature="0"]').click();
  await phone.locator('.modal').waitFor({state:'visible'});
  assert.ok((await phone.locator('.modal').innerText()).includes('Brakk'));
  await phone.locator('.modal img').first().evaluate(img=>img.decode());
  await phone.waitForTimeout(500);
  await phone.locator('.modal').screenshot({path:`playtest-artifacts/natural-carry-${offline?'offline':'source'}-phone.png`});
  if(offline)assert.deepEqual(external,[],'offline requests');
  checks.push(`${offline?'Offline':'Source'}: actual 390px Brakk detail screen${offline?', zero external requests':''}`);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tests/reports/natural-melee-carry.json',JSON.stringify({artRevision:sheet.artRevision,checks,poses:sheet.poses,errors},null,2)+'\n');
 console.log(checks.join('\n'));
}finally{await browser.close();}
