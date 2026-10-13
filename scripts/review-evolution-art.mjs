import {chromium} from 'playwright';
import fs from 'node:fs';
import {PIXEL_SPECIES} from '../native-content.js';
const all=process.argv.includes('--all');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/chromium'),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1536,height:1200}});await page.goto(process.env.BASE_URL||'http://127.0.0.1:3021');
 let groups=[['benchmarks',['aurel','grit','luma']],['heroes',['aurel','brakk','syl','nyra','rowan','morrow','eira']],['beasts',['emberhound','sunlion','frostursa','crownstag','stormdrake','vesper']],['bodies',['cogwalker','runespider','moonjelly','mireclaw','ironscolopendra','nix']],['families',['brom','tarka','grum','nyxwing','zephyr','sable']]];
 if(all){groups=[];for(let i=0;i<PIXEL_SPECIES.length;i+=10)groups.push(['collection-'+(i/10+1),PIXEL_SPECIES.slice(i,i+10).map(s=>s.id)]);}
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [name,ids]of groups){await page.evaluate(async ({ids,all})=>{
  const {pixelSpec,lineageLimit}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{nativeRigFor}=await import('/grand-designs.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
  const canvas=document.createElement('canvas');canvas.id='stage-review';canvas.width=1536;canvas.height=ids.length*224;document.body.replaceChildren(canvas);document.body.style.margin='0';const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#152328';ctx.fillRect(0,0,canvas.width,canvas.height);
  const cell=document.createElement('canvas');cell.width=cell.height=64;const brush=cell.getContext('2d');
  ids.forEach((id,row)=>{const spec=pixelSpec(id);ctx.font='15px monospace';ctx.fillStyle='#e6d6ad';ctx.fillText(spec.name,8,row*224+18);for(let stage=0;stage<3;stage++){ctx.fillText((all?['BASE','FINAL WILD','FINAL WARDEN']:['JUVENILE','MATURE','APEX'])[stage],stage*512+8,row*224+37);for(let view=0;view<3;view++){const dir=[1,2,5][view],c={id,evolution:all?(stage?lineageLimit({id}):0):stage,evolutionPath:all&&stage===2?'warden':'wild'},rig=nativePoseRig(spec,c,'idle',.25);if(!all)rig.artStage=stage;const pixels=paintCharacterPixels(nativeRigFor(spec,c),rig,dir*Math.PI/4);if(pixels.clipped)throw Error(`${id} ${stage} ${dir}: clipping`);brush.putImageData(new ImageData(pixels,64,64),0,0);const size=all?168:168*[.61,.82,1][stage];ctx.drawImage(cell,stage*512+view*168+(168-size)/2,row*224+211-size,size,size);}}});
 },{ids,all});await page.locator('#stage-review').screenshot({path:`playtest-artifacts/v3-evolution-${name}.png`});console.log(name+' reviewed');}
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync('playtest-artifacts/v3-evolution-browser.json',JSON.stringify({groups,errors},null,2));
}finally{await browser.close();}
