import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const root = process.cwd();
const input = path.resolve(process.argv[2] || 'C:/Users/David Cardimen/Downloads/Meshy_AI_Character_output.glb');
const output = path.resolve(process.argv[3] || 'playtest-artifacts/meshy-fox');
fs.mkdirSync(output, {recursive:true});
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://local');
  const file = url.pathname === '/input.glb' ? input : path.resolve(root,'.'+url.pathname);
  if (file !== input && !file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');res.end(fs.readFileSync(file));}
  catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
  const context=await browser.newContext({viewport:{width:1000,height:820}});
  const page=await context.newPage();
  page.on('pageerror',e=>console.error(e));
  await page.goto(`http://127.0.0.1:${server.address().port}/public/meshy-fox-preview/index.html?model=/input.glb`);
  await page.waitForFunction(()=>window.fox3d?.ready,{},{timeout:60000});
  fs.writeFileSync(path.join(output,'inspection.json'),JSON.stringify(await page.evaluate(()=>window.fox3d.inspect()),null,2));
  const review=await page.evaluate(()=>{
    const {model,renderer,scene,camera,bones}=window.fox3d,mesh=[];model.traverse(o=>{if(o.isSkinnedMesh)mesh.push(o)});
    const result={frames:0,nonFiniteVertices:0,outOfViewVertices:0,tailVertexTravel:0,headDriftInTailClip:0,directions:['S','SE','E','NE','N','NW','W','SW'],clipNames:window.fox3d.inspect().animations};
    // Check decoded animation/skin output, not just rig metadata.
    document.querySelector('#motion').value='rest';window.fox3d.yaw(0);window.fox3d.seek(0);
    const baseline=mesh.map(m=>Array.from({length:m.geometry.attributes.position.count},(_,i)=>m.getVertexPosition(i,m.position.clone()).clone()));
    camera.updateMatrixWorld(true);
    for(let facing=0;facing<8;facing++)for(const mode of ['tail','joints'])for(let frame=0;frame<32;frame++){
      window.fox3d.yaw(facing*Math.PI/4);
      document.querySelector('#motion').value=mode;window.fox3d.seek(frame/8);
      mesh.forEach((m,n)=>{const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){
        const v=m.getVertexPosition(i,m.position.clone());if(!Number.isFinite(v.x+v.y+v.z))result.nonFiniteVertices++;
        const d=v.distanceTo(baseline[n][i]);if(mode==='tail'&&p.getY(i)>.99)result.headDriftInTailClip=Math.max(result.headDriftInTailClip,d);
        if(p.getX(i)>.55&&p.getY(i)<.67&&p.getZ(i)<-.16)result.tailVertexTravel=Math.max(result.tailVertexTravel,d);
        const screen=v.clone().applyMatrix4(m.matrixWorld).project(camera);if(Math.abs(screen.x)>1||Math.abs(screen.y)>1||Math.abs(screen.z)>1)result.outOfViewVertices++;
      }});result.frames++;
    }
    if(result.nonFiniteVertices||result.outOfViewVertices||result.headDriftInTailClip>1e-6||(bones.some(b=>b.name.startsWith('Tail_'))&&result.tailVertexTravel<.04))throw Error(JSON.stringify(result));
    return result;
  });
  fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(review,null,2));
  await page.selectOption('#motion','rest');
  for(const [name,yaw] of [['front',0],['SE',Math.PI/4],['side',Math.PI/2],['NE',3*Math.PI/4],['back',Math.PI],['NW',5*Math.PI/4],['W',3*Math.PI/2],['SW',7*Math.PI/4]]){
    await page.evaluate(yaw=>{window.fox3d.yaw(yaw);window.fox3d.seek(0);},yaw);
    await page.waitForTimeout(150);
    await page.screenshot({path:path.join(output,name+'.png')});
  }
  for(const mode of ['tail','joints'])for(const [name,yaw]of [['front',0],['quarter',3*Math.PI/4],['back',Math.PI]]){
    await page.selectOption('#motion',mode);
    await page.evaluate(yaw=>window.fox3d.yaw(yaw),yaw);
    for(const t of [0,.7,1.4,2.1]){await page.evaluate(t=>window.fox3d.seek(t),t);await page.waitForTimeout(80);await page.screenshot({path:path.join(output,`${mode}-${name}-${t}.png`)});}
  }
  await page.check('#weights');await page.selectOption('#motion','rest');await page.screenshot({path:path.join(output,'tail-weights.png')});await page.uncheck('#weights');
  const sheet=await page.evaluate(()=>{
    const {renderer,scene,camera}=window.fox3d,c=document.createElement('canvas');c.width=1024;c.height=560;const ctx=c.getContext('2d');ctx.fillStyle='#202d32';ctx.fillRect(0,0,c.width,c.height);ctx.font='16px system-ui';
    renderer.setSize(256,256,false);camera.aspect=1;camera.updateProjectionMatrix();document.querySelector('#motion').value='tail';
    for(let i=0;i<8;i++){window.fox3d.yaw(i*Math.PI/4);window.fox3d.seek(1.4);renderer.render(scene,camera);const x=i%4*256,y=Math.floor(i/4)*280;ctx.drawImage(renderer.domElement,x,y+24,256,256);ctx.fillStyle='#e3ede8';ctx.fillText(['S','SE','E','NE','N','NW','W','SW'][i],x+12,y+20);}
    renderer.setSize(innerWidth,690,false);camera.aspect=innerWidth/690;camera.updateProjectionMatrix();return c.toDataURL('image/png').split(',')[1];
  });fs.writeFileSync(path.join(output,'eight-directions.png'),Buffer.from(sheet,'base64'));
  if(process.env.RECORD){
    for(const mode of ['tail','joints']){
      await page.selectOption('#motion',mode);
      const video=await page.evaluate(async()=>{
        window.fox3d.yaw(3*Math.PI/4);window.fox3d.seek(0);document.querySelector('#pause').click();
        const chunks=[],recorder=new MediaRecorder(window.fox3d.renderer.domElement.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:450000});
        const complete=new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=async()=>{const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);};});
        recorder.start();await new Promise(r=>setTimeout(r,4000));window.fox3d.yaw(Math.PI);await new Promise(r=>setTimeout(r,4000));recorder.stop();return complete;
      });fs.writeFileSync(path.join(output,mode+'.webm'),Buffer.from(video,'base64'));
      const decoded=await page.evaluate(async data=>{
        const video=document.createElement('video');video.src='data:video/webm;base64,'+data;video.muted=true;await new Promise((r,j)=>{video.onloadeddata=r;video.onerror=j;});
        const sheet=document.createElement('canvas');sheet.width=1024;sheet.height=400;const ctx=sheet.getContext('2d');ctx.fillStyle='#202d32';ctx.fillRect(0,0,1024,400);ctx.font='14px system-ui';
        for(let i=0;i<8;i++){const t=i+.35;await new Promise(r=>{video.onseeked=r;video.currentTime=t;});ctx.drawImage(video,i%4*256,Math.floor(i/4)*200+22,256,177);ctx.fillStyle='#e3ede8';ctx.fillText(t.toFixed(2)+'s',i%4*256+8,Math.floor(i/4)*200+17);}
        video.currentTime=0;await video.play();const start=video.currentTime;await new Promise(r=>setTimeout(r,1100));if(video.currentTime-start<.8||video.playbackRate!==1)throw Error('Normal-speed video playback stalled');video.pause();
        return sheet.toDataURL('image/png').split(',')[1];
      },video);fs.writeFileSync(path.join(output,mode+'-decoded.png'),Buffer.from(decoded,'base64'));
    }
  }
  console.log(JSON.stringify({input,output,review}));
  await context.close();
} finally {await browser.close();await new Promise(r=>server.close(r));}
