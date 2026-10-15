import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {makeRun,creature,generateRoute,encounter} from '../game.js';
import {makeLoot} from '../expedition-rules.js';

const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync(out,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1672,height:941},recordVideo:{dir:path.join(out,'uploaded-motion'),size:{width:1672,height:941}}}),page=await context.newPage();
 const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.team.push({...creature('voltwing',1),seat:2,balanceVersion:15,equipment:[],relics:[]});run.route=generateRoute(run);
 const node=run.route[0][0];node.type='elite';run.encounterType='elite';
 let foes;for(let seed=1;seed<1000;seed++){node.seed=seed;foes=encounter(run,'elite',seed).slice(0,2);const loot=makeLoot(run,'elite',foes,seed);if(loot.drops.length===3&&loot.drops.some(d=>d.kind==='gear'))break;}
 const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes,phase:'prep',profile:{owned:['aurel','brakk','voltwing'],tutorial:true}};
 await page.addInitScript(saved=>{localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},saved);
 const started=Date.now(),marks={};
 await page.goto(base);await page.waitForFunction(()=>window.starfall);await page.waitForTimeout(700);
 await page.locator('[data-action="battle"]').click();marks.combat=(Date.now()-started)/1000;await page.waitForTimeout(3500);
 await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,1e6,b.living(0)[0],null,1,'status');b.step(.04);});
 await page.locator('.reward-screen').waitFor();marks.reveal=(Date.now()-started)/1000;
 await page.waitForTimeout(3200);await page.screenshot({path:out+'/uploaded-rewards-motion-settled.png'});
 await page.locator('[data-upgrade]').first().click();await page.waitForTimeout(600);marks.collection=(Date.now()-started)/1000;
 await page.locator('[data-action="claim-loot"]').click();await page.locator('.loot-cache.collected').waitFor();await page.waitForTimeout(1500);
 const video=page.video();await context.close();await video.saveAs('public/uploaded-ui-preview.webm');
 fs.writeFileSync(out+'/uploaded-motion.json',JSON.stringify({rate:'normal speed; real browser clock',viewport:{width:1672,height:941},marks,seconds:(Date.now()-started)/1000},null,2));
 // Decode actual recording frames. Native browser video documents may report
 // a successful seek before their compositor has painted a decoded frame.
 const ffmpeg=process.env.FFMPEG_PATH||(process.platform==='win32'?path.join(process.env.LOCALAPPDATA,'ms-playwright/ffmpeg-1011/ffmpeg-win64.exe'):'ffmpeg');
 for(const [name,time]of [['opening',marks.reveal+.25],['cards',marks.reveal+1.15],['settled',marks.reveal+2.4],['collection',marks.collection+.35]]){
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(time),'-i','public/uploaded-ui-preview.webm','-frames:v','1','-y',out+`/uploaded-playback-${name}.png`],{windowsHide:true});
 }
 console.log(JSON.stringify(marks));
}finally{await browser.close();}
