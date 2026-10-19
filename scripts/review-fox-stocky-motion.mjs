import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const out=path.resolve('docs/evidence/fox-stocky-motion-preview');fs.mkdirSync(out,{recursive:true});
const wrapper=path.resolve('playtest-artifacts/fox-stocky-inline-review.html');
const sourceRoot=path.resolve('public/fox-layered-preview');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname,target=path.resolve(sourceRoot,'.'+(pathname==='/'?'/index.html':pathname));
 if(!target.startsWith(sourceRoot+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
try{
 const context=await browser.newContext({viewport:{width:1024,height:850},recordVideo:{dir:path.resolve('playtest-artifacts/fox-stocky-video'),size:{width:1024,height:850}}});
 const page=await context.newPage(),started=Date.now(),clips={};page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(wrapper).href);
 const frame=page.frames().find(f=>f.parentFrame());await frame.waitForSelector('#fox-stocky-inline[data-ready="true"]');
 const control=name=>frame.locator('[data-control="'+name+'"]');
 await control('action').selectOption('run');
 await page.waitForTimeout(1200);clips.run=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'run.png')});
 const fps=await frame.evaluate(()=>new Promise(resolve=>{let count=0,start=performance.now();function step(now){count++;if(now-start>=1000)resolve(count*1000/(now-start));else requestAnimationFrame(step);}requestAnimationFrame(step);}));
 await control('pause').click();const paused=await frame.evaluate(()=>window.foxLayeredPreview.pose.time);await page.waitForTimeout(150);
 if(await frame.evaluate(()=>window.foxLayeredPreview.pose.time)!==paused)throw Error('Pause does not hold the pose');
 await control('action').selectOption('idle');await control('pause').click();await page.waitForTimeout(200);clips.idle=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'idle.png')});
 await frame.waitForFunction(()=>window.foxLayeredPreview.pose.blink,{},{timeout:7000});await control('pause').click();await frame.evaluate(()=>window.foxLayeredPreview.seek(2.92));await frame.waitForFunction(()=>window.foxLayeredPreview.pose.blink);await page.waitForTimeout(200);clips.blink=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'blink.png')});await control('pause').click();
 await control('action').selectOption('attack');await page.waitForTimeout(900);await control('pause').click();
 await frame.evaluate(()=>window.foxLayeredPreview.seek(.94));await frame.waitForFunction(()=>Math.abs(window.foxLayeredPreview.pose.shotTime-.94)<.001);clips.draw=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'draw.png')});
 await control('pause').click();await frame.waitForFunction(()=>{const p=window.foxLayeredPreview.pose;return p.releaseAge>=0&&p.releaseAge<.085;});await control('pause').click();
 await frame.evaluate(()=>window.foxLayeredPreview.seek(1.065));await frame.waitForFunction(()=>Math.abs(window.foxLayeredPreview.pose.shotTime-1.065)<.001);clips.release=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'release.png')});
 const canvasRects=await frame.evaluate(()=>window.foxLayeredPreview.actors.map(a=>{const r=a.canvas.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 const frameRect=await page.locator('iframe').boundingBox();
 for(const r of canvasRects){r.x+=frameRect.x;r.y+=frameRect.y;}
 const checks=await frame.evaluate(()=>{
  const {poseAt,createDynamics,stepDynamics,renderCharacter}=window.foxLayeredPreviewTools,results=[];
  const near=(pixels,p,size,radius=2)=>{
   const scale=size/64,cx=p.x*scale,cy=p.y*scale,r=radius*scale;
   for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++)if(x>=0&&x<size&&y>=0&&y<size&&Math.hypot(x-cx,y-cy)<=r&&pixels[(y*size+x)*4+3]>128)return true;
   return false;
  };
  const connected=(pixels,start,end,size)=>{
   const scale=size/64,seen=new Uint8Array(size*size),queue=[];
   for(let y=Math.floor((start.y-2)*scale);y<=Math.ceil((start.y+2)*scale);y++)for(let x=Math.floor((start.x-2)*scale);x<=Math.ceil((start.x+2)*scale);x++)if(x>=0&&x<size&&y>=0&&y<size&&pixels[(y*size+x)*4+3]>128){const n=y*size+x;seen[n]=1;queue.push(n);}
   for(let i=0;i<queue.length;i++){
    const n=queue[i],x=n%size,y=Math.floor(n/size);if(Math.hypot(x-end.x*scale,y-end.y*scale)<=2*scale)return true;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*size+xx;if(xx>=0&&xx<size&&yy>=0&&yy<size&&!seen[k]&&pixels[k*4+3]>128){seen[k]=1;queue.push(k);}}
   }return false;
  };
  for(const actor of window.foxLayeredPreview.actors){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d',{willReadFrequently:true}),sim=createDynamics(actor.kit.form),failures=[];let frames=0,maxTailError=0,colors=0;
   for(const stride of [.5,1.5])for(const action of ['idle','run','attack'])for(let frame=0;frame<32;frame++){
    const time=frame/32*(action==='attack'?2.35:action==='run'?.57:3.5),p=poseAt(action,time,{stride,stocky:true,bowProfile:actor.kit.bowProfile});
    for(let i=0;i<4;i++)stepDynamics(sim,p,1/120,2);
    renderCharacter(ctx,actor.kit,p,sim);const pixels=ctx.getImageData(0,0,256,256).data,issues=[];
    for(const limb of [...p.legs,p.arms.left,p.arms.right])if(!near(pixels,limb.end,256)||!connected(pixels,limb.root,limb.end,256))issues.push('painted limb contact');
    for(const leg of p.legs)if(!near(pixels,leg.foot,256))issues.push('boot sole');
    for(let n=0;n<256;n++)if(pixels[n*4+3]>128||pixels[(255*256+n)*4+3]>128||pixels[(n*256)*4+3]>128||pixels[(n*256+255)*4+3]>128){issues.push('cell boundary');break;}
    if(p.bow.hand!=='right'||Math.hypot(p.bow.grip.x-p.arms.right.grip.x,p.bow.grip.y-p.arms.right.grip.y)>1e-8||!near(pixels,p.bow.grip,256))issues.push('right grip');
    if(p.bow.engaged&&(Math.hypot(p.bow.draw.x-p.arms.left.grip.x,p.bow.draw.y-p.arms.left.grip.y)>1e-8||!near(pixels,p.bow.draw,256)))issues.push('draw hand');
    for(const tail of sim.tails)for(const link of tail.links)maxTailError=Math.max(maxTailError,Math.abs(Math.hypot(link.a.x-link.b.x,link.a.y-link.b.y)-link.rest));
    if(!frames){const set=new Set();for(let n=0;n<pixels.length;n+=4)if(pixels[n+3]>128)set.add((pixels[n]<<16)|(pixels[n+1]<<8)|pixels[n+2]);colors=set.size;}
    if(issues.length)failures.push({action,stride,time,issues});frames++;
   }
   results.push({form:actor.kit.form,frames,colors,maxTailError,tailCount:sim.tails.length,rasterSize:actor.buffer.width,failures});
  }return results;
 });
 await control('guides').check();await page.screenshot({path:path.join(out,'guides.png')});await control('guides').uncheck();
 await frame.locator('summary').click();if(await frame.locator('.part').count()!==12)throw Error('Missing continuous painted parts');await frame.locator('summary').click();
 const layouts=[];for(const width of [320,736,1024]){await page.setViewportSize({width,height:850});await frame.waitForFunction(expected=>innerWidth===expected,width-32);layouts.push(await frame.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));}
 await page.setViewportSize({width:1024,height:850});await control('action').selectOption('run');await control('pause').click();await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'inline.png')});
 const video=page.video();await context.close();fs.copyFileSync(await video.path(),path.join(out,'normal-speed.webm'));
 const sourcePage=await browser.newPage();sourcePage.on('pageerror',e=>errors.push('source: '+e.message));await sourcePage.goto('http://127.0.0.1:'+server.address().port);await sourcePage.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const sourceCheck=await sourcePage.evaluate(()=>({actors:window.foxLayeredPreview.actors.length,raster:window.foxLayeredPreview.actors[0].buffer.width,form:window.foxLayeredPreview.actors[0].kit.form,hand:window.foxLayeredPreview.pose.bow.hand}));
 await sourcePage.locator('summary').click();if(await sourcePage.locator('.part').count()!==12)throw Error('Source inspector missing parts');await sourcePage.close();
 if(sourceCheck.actors!==1||sourceCheck.raster!==256||sourceCheck.form!=='rowan'||sourceCheck.hand!=='right')throw Error('Source app disagrees with embedded preview');
 const report={coverage:{forms:checks.map(c=>c.form),motionDirections:['SW'],targetDirectionCount:8,gameIntegration:false},errors,fps,checks,layouts,clips,canvasRects,sourceCheck};
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,checks:checks.map(c=>({...c,failures:c.failures.slice(0,6),failureCount:c.failures.length}))}));
 if(errors.length||checks.some(c=>c.failures.length||c.colors<=48||c.rasterSize!==256)||layouts.some(l=>l.scroll>l.width))process.exitCode=1;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
