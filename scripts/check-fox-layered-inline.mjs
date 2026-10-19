import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const wrapper=path.resolve(process.argv[2]||'playtest-artifacts/fox-layered-inline-review.html'),out=path.resolve(process.argv[3]||'docs/evidence/fox-stocky-motion-preview');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1024,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(wrapper).href);
 const frame=page.frames().find(f=>f.parentFrame());await frame.waitForSelector('#fox-layered-inline[data-ready="true"]');
 const control=name=>frame.locator('[data-control="'+name+'"]');
 await control('action').selectOption('run');await page.waitForTimeout(600);await page.screenshot({path:path.join(out,'inline.png')});
 await control('pause').click();const paused=await frame.evaluate(()=>window.foxLayeredPreview.pose.time);await page.waitForTimeout(150);if((await frame.evaluate(()=>window.foxLayeredPreview.pose.time))!==paused)throw Error('Pause does not stop preview');
 await control('guides').check();await control('native').check();await control('wind').fill('2');await control('stride').fill('1.5');
 const inspection=await frame.evaluate(()=>({native:document.querySelector('[data-control="specimens"]').classList.contains('native'),guides:document.querySelector('[data-control="guides"]').checked,tailCounts:window.foxLayeredPreview.actors.map(a=>a.sim.tails.length)}));
 if(!inspection.native||!inspection.guides||inspection.tailCounts.join(',')!=='1')throw Error('Base-fox inspection controls or tail failed');
 await control('native').uncheck();await control('guides').uncheck();await control('action').selectOption('attack');await control('pause').click();await page.waitForTimeout(1100);
 const hand=await frame.evaluate(()=>window.foxLayeredPreview.pose.bow.hand);if(hand!=='right')throw Error('Bow hand changed');
 await frame.locator('summary').click();if(await frame.locator('.part').count()!==12)throw Error('Missing independent base-fox parts');
 const layouts=[];for(const width of [320,1024]){await page.setViewportSize({width,height:850});await page.waitForTimeout(50);layouts.push(await frame.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));}
 if(errors.length||layouts.some(l=>l.scroll>l.width))throw Error(JSON.stringify({errors,layouts}));
 fs.writeFileSync(path.join(out,'inline-checks.json'),JSON.stringify({errors,inspection,hand,layouts},null,2)+'\n');console.log(JSON.stringify({errors,inspection,hand,layouts}));
}finally{await browser.close();}
