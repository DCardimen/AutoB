import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {journeyFixture,winJourney} from '../tests/journey-fixture.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 for(const offline of [false,true]){
  const tag=offline?'offline':'source',start=Date.now(),marks={}, {page,context,errors}=await journeyFixture(browser,{base,offline,recordVideo:{dir:out+'/journey-video',size:{width:1672,height:941}}});
  marks.arena=(Date.now()-start)/1000;await page.waitForTimeout(1600);await page.locator('[data-relic-preview="venom-clasp"]').hover();await page.waitForTimeout(700);await page.mouse.move(10,200);
  await page.locator('[data-action="battle"]').click();marks.combat=(Date.now()-start)/1000;await page.waitForTimeout(2600);
  await page.evaluate(()=>{const b=starfall.state.battle,u=b.living(0)[0],t=b.living(1)[0];b.damageUnit(t,70,u,u.loadout.auto,0,'hit',false,true);u.hp-=20;b.heal(u,15,u);});marks.damage=(Date.now()-start)/1000;await page.waitForTimeout(800);
  await winJourney(page);marks.reveal=(Date.now()-start)/1000;await page.locator('.rewards-layout.rewards-revealed').waitFor();await page.waitForTimeout(700);
  await page.locator('[data-upgrade]').first().click();await page.locator('[data-action="claim-loot"]').click();marks.collection=(Date.now()-start)/1000;await page.locator('.loot-cache.collected').waitFor();await page.waitForTimeout(700);
  await page.locator('[data-action="continue"]').click();await page.setViewportSize({width:1672,height:941});
  for(const i of [0,1,2]){await page.locator(`[data-planet-preview="${i}"]:visible`).first().click();marks['world'+i]=(Date.now()-start)/1000;await page.waitForTimeout(1600);await page.locator('.modal-close').click();}
  await page.locator('.brand').click();await page.locator('#new-run').click();marks.night=(Date.now()-start)/1000;await page.waitForTimeout(1600);
  if(errors.length)throw new Error(errors.join('\n'));
  const video=page.video();await context.close();const file=`public/journey-polish-${tag}.webm`;await video.saveAs(file);
  fs.writeFileSync(`${out}/journey-${tag}-motion.json`,JSON.stringify({clock:'real browser clock; normal speed',viewport:{width:1672,height:941},marks,seconds:(Date.now()-start)/1000},null,2));
  const ffmpeg=process.env.FFMPEG_PATH||(process.platform==='win32'?path.join(process.env.LOCALAPPDATA,'ms-playwright/ffmpeg-1011/ffmpeg-win64.exe'):'ffmpeg');
  for(const [name,t]of [['arena',marks.arena+.5],['damage',marks.damage+.18],['opening',marks.reveal+.3],['emergence',marks.reveal+1.3],['arrival',marks.reveal+1.85],['collection',marks.collection+.45],['night',marks.night+.6],['water',marks.world0+.5],['lava',marks.world1+.5],['stars',marks.world2+.5]])execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(t),'-i',file,'-frames:v','1','-y',`${out}/journey-${tag}-playback-${name}.png`],{windowsHide:true});
  console.log(tag,JSON.stringify(marks));
 }
}finally{await browser.close();}
