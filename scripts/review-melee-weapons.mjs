import {chromium} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
fs.mkdirSync('playtest-artifacts',{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:3000',errors=[];
const browser=await chromium.launch();let page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
const result=await page.evaluate(async()=>{
 const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{renderCharacterFrame}=await import('/prototype-renderer.js');
 const cv=document.createElement('canvas');cv.width=768;cv.height=804;const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10242c';ctx.fillRect(0,0,cv.width,cv.height);
 const ids=['aurel','brakk','brom','tarka','sable','mossguard'];
 for(let row=0;row<ids.length;row++){const spec=pixelSpec(ids[row]);ctx.fillStyle='#c8dbc8';ctx.font='13px sans-serif';ctx.fillText(spec.name,6,row*134+14);for(let ev=0;ev<3;ev++)for(let pose=0;pose<2;pose++){const c={id:spec.id,evolution:ev,evolutionPath:'wild'},r=nativePoseRig(spec,c,pose?'slash':'idle',pose?.46:.25);ctx.drawImage(renderCharacterFrame(spec.nativeRig,r,Math.PI/4),ev*256+pose*128,row*134+16,128,128);}}
 return cv.toDataURL().split(',')[1];
});
fs.writeFileSync('playtest-artifacts/melee-forms.png',Buffer.from(result,'base64'));
await page.evaluate(async()=>{const {creature}=await import('/game.js'),{initializeCompanion}=await import('/wearer-relics.js'),s=starfall.state;s.profile.tutorial=true;s.run.team=['aurel','brakk','brom'].map((id,i)=>({...initializeCompanion(s.run,creature(id,3)),seat:i,placement:{x:180+i*130,y:220+i*110}}));s.run.teamCapacity=3;});
await page.locator('[data-view="map"]:visible').first().click();await page.locator('[data-field-enter]').click();await page.waitForTimeout(500);assert.deepEqual(await page.evaluate(()=>starfall.state.run.team.map(c=>c.id)),['aurel','brakk','brom']);
await page.locator('#battle-canvas').screenshot({path:'playtest-artifacts/melee-arena-desktop.png'});
await page.close();page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.starfall);
await page.evaluate(async()=>{const {creature}=await import('/game.js'),{initializeCompanion}=await import('/wearer-relics.js'),s=starfall.state;s.profile.tutorial=true;s.run.team=['aurel','brakk','brom'].map((id,i)=>({...initializeCompanion(s.run,creature(id,3)),seat:i,placement:{x:180+i*130,y:220+i*110}}));s.run.teamCapacity=3;});
await page.locator('[data-view="map"]:visible').first().click();await page.locator('[data-field-enter]').click();await page.waitForTimeout(500);assert.deepEqual(await page.evaluate(()=>starfall.state.run.team.map(c=>c.id)),['aurel','brakk','brom']);
await page.waitForTimeout(400);await page.locator('#battle-canvas').screenshot({path:'playtest-artifacts/melee-arena-mobile.png'});
fs.writeFileSync('playtest-artifacts/melee-mobile-canvas.png',Buffer.from(await page.locator('#battle-canvas').evaluate(e=>e.toDataURL().split(',')[1]),'base64'));
await page.locator('[data-quick-ai][data-policy="0"]').selectOption('nearest');assert.equal(await page.evaluate(()=>starfall.state.run.team[0].policy),'nearest');
await page.clock.install();await page.locator('[data-action="battle"]').click();await page.clock.runFor(1500);await page.locator('[data-action="pause"]').click();await page.locator('#battle-canvas').screenshot({path:'playtest-artifacts/melee-combat-mobile.png'});assert.deepEqual(errors,[]);fs.writeFileSync('tests/reports/melee-weapon-ui.json',JSON.stringify({forms:['aurel','brakk','brom','tarka','sable','mossguard'],stages:[0,1,2],poses:['idle','slash'],desktopWidth:1440,mobile:{width:390,deviceScaleFactor:3,quickPolicy:'nearest'},errors},null,2)+'\n');await browser.close();
