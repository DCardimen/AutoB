import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='playtest-artifacts';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1200}});await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const catalog=await page.evaluate(async()=>{
  const {RELICS}=await import('/game.js'),{WEARER_RELICS}=await import('/wearer-relics.js'),{combatEffectDescription}=await import('/item-effects.js'),{RELIC_ART,UI_ART}=await import('/ui-art.js');
  starfall.state.run.relics=RELICS.map(r=>r.id);document.querySelector('[data-view="arena"]').click();
  const descriptions=new Map([...document.querySelectorAll('[data-relic-preview]')].map(el=>[el.dataset.relicPreview,el.dataset.relicEffect]));
  return [...RELICS,...WEARER_RELICS].map(r=>({id:r.id,name:r.name,art:RELIC_ART[r.id],src:UI_ART[RELIC_ART[r.id]],major:!!r.majorPact,description:descriptions.get(r.id)||combatEffectDescription(r,{rulesVersion:17})}));
 });
 fs.writeFileSync(out+'/relic-v2-illustrations.json',JSON.stringify(catalog.map(({src,...r})=>r),null,2));
 for(const [tag,entries]of [['pacts',catalog.filter(r=>r.major)],...Array.from({length:Math.ceil(catalog.length/40)},(_,i)=>['catalog-'+i,catalog.slice(i*40,i*40+40)])]){
  await page.evaluate(entries=>{
   const style=document.createElement('style');style.textContent='body{margin:0;background:#041d27;color:#e9e9ce;font:13px/1.55 Arial}#relic-gallery{padding:24px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}#relic-gallery article{border:1px solid #597f78;border-radius:10px;background:radial-gradient(ellipse at top,#284c3d,#05252b);padding:18px;min-height:260px;text-align:center}#relic-gallery img{width:112px;height:112px;object-fit:contain}#relic-gallery h3{font:22px Georgia;color:#f1dba5;margin:12px 0}#relic-gallery p{color:#d2e0cf;margin:10px 0}#relic-gallery small{display:block;color:#aebfaa}#relic-gallery article.pact{border-color:#d1a07e}';document.head.append(style);
   document.body.innerHTML='<main id="relic-gallery"></main>';const root=document.querySelector('#relic-gallery');for(const r of entries){const tile=document.createElement('article');tile.className=r.major?'pact':'';const img=new Image();img.src=r.src;tile.append(img);for(const [tag,text]of [['h3',r.name],['p',r.description],['small',r.id+' · '+r.art]]){const el=document.createElement(tag);el.textContent=text;tile.append(el);}root.append(tile);}
  },entries);
  await page.locator('#relic-gallery img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.locator('#relic-gallery').screenshot({path:`${out}/relic-v2-${tag}.png`});
 }
 await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const movie=await page.evaluate(async()=>{
  const {nativePoseRig}=await import('/native-poses.js'),{pixelSpec}=await import('/native-content.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
  const ids=['cogwalker','onyxscarab','mireclaw','runespider','ironscolopendra'],canvas=document.createElement('canvas');canvas.width=1280;canvas.height=840;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d');
  const stream=canvas.captureStream(30),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:4000000}),done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
  const start=performance.now();recorder.start();
  function draw(now){const time=(now-start)/1000,state=time<2?'idle':time<5?'walk':time<8?'run':'sprint',dir=Math.floor(time/1.5)%8,phase=(time*(state==='walk'?1.1:state==='run'?1.7:state==='sprint'?2.2:.6))%1;ctx.fillStyle='#102931';ctx.fillRect(0,0,1280,840);ctx.fillStyle='#eee1ba';ctx.font='16px monospace';ctx.fillText(`Normal-speed painted limb review / ${state} / direction ${dir} / native + 3x`,16,23);
   for(let evolution=0;evolution<3;evolution++)ids.forEach((id,i)=>{const spec=pixelSpec(id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),x=i*256,y=40+evolution*263;sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,x,y,192,192);ctx.drawImage(cell,x+192,y+128,64,64);ctx.fillStyle='#eee1ba';ctx.font='12px monospace';ctx.fillText(id+' · form '+evolution,x+6,y+218);});
   if(time<12)requestAnimationFrame(draw);else recorder.stop();
  }requestAnimationFrame(draw);return done;
 });
 const video='public/relic-v2-creature-motion.webm';fs.writeFileSync(video,Buffer.from(movie,'base64'));
 const ffmpeg=process.env.FFMPEG_PATH||(process.platform==='win32'?path.join(process.env.LOCALAPPDATA,'ms-playwright/ffmpeg-1011/ffmpeg-win64.exe'):'ffmpeg');
 for(const [name,time]of [['idle',1],['walk',3.4],['run',6.5],['sprint',10.5]])execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(time),'-i',video,'-frames:v','1','-y',`${out}/relic-v2-motion-${name}.png`],{windowsHide:true});
 console.log('Reviewed '+catalog.length+' relic identities, 15 pacts, and normal-speed native/enlarged creature motion.');
}finally{await browser.close();}
