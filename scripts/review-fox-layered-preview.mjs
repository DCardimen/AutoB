import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve('public/fox-layered-preview'),out=path.resolve('docs/evidence/fox-layered-preview');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const ext=path.extname(target);res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.json':'application/json','.png':'image/png'})[ext]||'application/octet-stream');res.end(fs.readFileSync(target));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
try{
 const context=await browser.newContext({viewport:{width:1100,height:850},deviceScaleFactor:1,recordVideo:{dir:path.resolve('playtest-artifacts/fox-layered-video'),size:{width:1100,height:850}}}),page=await context.newPage(),started=Date.now(),clips={};page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 clips.idle=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'idle.png')});
 await page.waitForFunction(()=>window.foxLayeredPreview?.pose.blink,{},{timeout:16000});clips.blink=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'blink.png')});
 for(const action of ['run','attack']){await page.selectOption('#action',action);await page.waitForTimeout(action==='run'?1800:930);clips[action]=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,action+'.png')});if(action==='attack'){await page.waitForTimeout(135);clips.release=(Date.now()-started)/1000;await page.screenshot({path:path.join(out,'release.png')});}await page.waitForTimeout(1400);}
 const canvasRects=await page.evaluate(()=>window.foxLayeredPreview.actors.map(a=>{const r=a.canvas.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 await page.check('#guides');await page.screenshot({path:path.join(out,'rig-guides.png')});await page.uncheck('#guides');
 await page.locator('summary').click();await page.screenshot({path:path.join(out,'parts.png'),fullPage:true});await page.locator('summary').click();
 const sweep=await page.evaluate(async()=>{
  const m=await import('./model.mjs'),r=await import('./renderer.mjs'),results=[];
  const near=(pixels,p,radius=2)=>{for(let y=Math.floor(p.y-radius);y<=Math.ceil(p.y+radius);y++)for(let x=Math.floor(p.x-radius);x<=Math.ceil(p.x+radius);x++)if(x>=0&&x<64&&y>=0&&y<64&&Math.hypot(x-p.x,y-p.y)<=radius&&pixels[(y*64+x)*4+3])return true;return false;};
  const connected=(pixels,start,end)=>{
   const seen=new Uint8Array(4096),queue=[];for(let y=Math.floor(start.y-2);y<=Math.ceil(start.y+2);y++)for(let x=Math.floor(start.x-2);x<=Math.ceil(start.x+2);x++)if(x>=0&&x<64&&y>=0&&y<64&&pixels[(y*64+x)*4+3]){const n=y*64+x;seen[n]=1;queue.push(n);}
   for(let i=0;i<queue.length;i++){const n=queue[i],x=n%64,y=Math.floor(n/64);if(Math.hypot(x-end.x,y-end.y)<=2)return true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&!seen[k]&&pixels[k*4+3]){seen[k]=1;queue.push(k);}}}return false;
  };
  for(const actor of window.foxLayeredPreview.actors){
   const sim=m.createDynamics(actor.kit.form),canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),failures=[];let frames=0,maxTailError=0,firstImage=null;
   for(const stride of [.5,1.5])for(const action of ['idle','run','attack'])for(let frame=0;frame<32;frame++){
    const time=frame/32*(action==='attack'?2.35:action==='run'?.57:3.5),pose=m.poseAt(action,time,{stride,bowProfile:actor.kit.bowProfile});
    for(let i=0;i<4;i++)m.stepDynamics(sim,pose,1/120,2);
    r.renderCharacter(ctx,actor.kit,pose,sim);const data=ctx.getImageData(0,0,64,64).data,issues=[];
    for(const arm of [pose.arms.right,pose.arms.left])if(!near(data,arm.end)||!connected(data,arm.root,arm.end))issues.push('painted arm contact');
    for(const leg of pose.legs)if(!near(data,leg.end)||!near(data,leg.foot)||!connected(data,leg.root,leg.foot))issues.push('painted leg contact');
    for(let i=0;i<64;i++)if(data[i*4+3]||data[(63*64+i)*4+3]||data[(i*64)*4+3]||data[(i*64+63)*4+3]){issues.push('cell boundary');break;}
    const e=m.dynamicsErrors(sim,pose);maxTailError=Math.max(maxTailError,e.tailLength);
    if(e.bowGrip>1e-8||e.tailRoot>1e-8||e.capeRoot>1e-8)issues.push('physical socket');
    if(pose.bow.engaged&&Math.hypot(pose.bow.draw.x-pose.arms.left.end.x,pose.bow.draw.y-pose.arms.left.end.y)>1e-8)issues.push('string contact');
    if(issues.length){if(!firstImage){r.renderCharacter(ctx,actor.kit,pose,sim,{guides:true});firstImage=canvas.toDataURL('image/png');}failures.push({action,stride,time,issues,legs:pose.legs.map(l=>({root:l.root,joint:l.joint,end:l.end}))});}frames++;
   }
   results.push({form:actor.kit.form,frames,maxTailError,failures,firstImage});
  }
  return results;
 });
 const layouts=[];
 for(const width of [320,736,1100]){await page.setViewportSize({width,height:850});await page.waitForTimeout(60);layouts.push(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));if(width===320)await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});}
 for(const s of sweep)if(s.firstImage){fs.writeFileSync(path.join(out,'failure-'+s.form+'.png'),Buffer.from(s.firstImage.split(',')[1],'base64'));delete s.firstImage;}
 const video=page.video();await context.close();const videoPath=await video.path();fs.copyFileSync(videoPath,path.join(out,'normal-speed.webm'));
 const report={coverage:{forms:['rowan','mature','moontrail'],facings:1,gameIntegration:false},errors,sweep,layouts,clips,canvasRects,video:path.relative(process.cwd(),path.join(out,'normal-speed.webm')).split(path.sep).join('/')};
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,sweep:sweep.map(({failures,...s})=>({...s,failureCount:failures.length,firstFailures:failures.slice(0,4)}))}));
 if(errors.length||sweep.some(s=>s.failures.length)||layouts.some(l=>l.scroll>l.width))process.exitCode=1;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
