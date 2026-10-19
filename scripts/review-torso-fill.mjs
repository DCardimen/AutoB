import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {runtimeFiles,fingerprint} from './animation-contract.mjs';
const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/torso-fill-review/sheets';
fs.mkdirSync(out,{recursive:true});const inputs=fingerprint(runtimeFiles());
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000');
 const {sheets,preview}=await page.evaluate(async()=>{
  const {ARM_ANATOMY}=await import('/companion-anatomy.js'),{authoredSourceFrame,paintAtlasCharacter}=await import('/authored-sprite-renderer.js'),{authoredParts}=await import('/authored-parts.js');
  const {PIXEL_SPECIES}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels,PixelBrush,spritePoint}=await import('/prototype-pixel-art.js');
  const sheets=[],preview=document.createElement('canvas');preview.width=768;preview.height=672;const pc=preview.getContext('2d');pc.imageSmoothingEnabled=false;pc.fillStyle='#183139';pc.fillRect(0,0,768,672);
  for(const identity of Object.keys(ARM_ANATOMY))for(let stage=0;stage<3;stage++){
   const prior=new Image();prior.src=`/public/arm-animation-review/arms/${identity}-${stage}.png`;await prior.decode();
   const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted),canvas=document.createElement('canvas');canvas.width=1728;canvas.height=1120;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);
   const cell=document.createElement('canvas');cell.width=cell.height=64;const ctx=cell.getContext('2d');
   for(let dir=0;dir<8;dir++)for(let row=0;row<7;row++){
    const source=authoredSourceFrame(identity,dir,stage),parts=authoredParts(source,identity,stage,dir);let rgba=new Uint8ClampedArray(16384);
    const label=['original','BEFORE body','FILLED body','BEFORE swing .375','FILLED swing .375','FILLED recovery .625','BODY ALONE mid-swing'][row];
    if(row===1||row===3){ctx.clearRect(0,0,64,64);ctx.drawImage(prior,dir*216+148,(row===1?2:5)*160+96,64,64,0,0,64,64);}
    else{
     if(row===0||row===2){for(const p of row===0?source.pixels:[...parts.underbody,...parts.body])rgba.set([...p.rgb,255],(p.y*64+p.x)*4);}
     else{
      const rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},'attack',row===5?.625:.375),angle=dir*Math.PI/4;
      if(row===6){const b=new PixelBrush();rig.dir=dir;paintAtlasCharacter(b,rig.id,rig,q=>spritePoint(q,angle));rgba=b.data;}
      else rgba=paintCharacterPixels(rig.id,rig,angle);
     }
     ctx.putImageData(new ImageData(rgba,64,64),0,0);
    }
    c.drawImage(cell,dir*216,row*160+16,144,144);c.drawImage(cell,dir*216+148,row*160+96,64,64);c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(`${identity}/${stage}/${dir} ${label}`,dir*216+2,row*160+12);
   }
   const examples={knight:[0,'Aurel',0],orc:[1,'Brakk',0],troll:[2,'Grum',2]};
   if(stage===0&&examples[identity]){const [y,name,dir]=examples[identity];[1,2,3,4].forEach((row,x)=>{pc.drawImage(canvas,dir*216+148,row*160+96,64,64,x*192,y*224+24,192,192);pc.fillStyle='#e7dfc2';pc.font='11px monospace';pc.fillText(name+' / '+['Before: empty cutout','Filled body','Before: arm raised','Filled: arm raised'][x],x*192+4,y*224+14);});}
   sheets.push({name:`${identity}-${stage}`,png:canvas.toDataURL().split(',')[1]});
  }return {sheets,preview:preview.toDataURL().split(',')[1]};
 });
 for(const sheet of sheets)fs.writeFileSync(path.join(out,sheet.name+'.png'),Buffer.from(sheet.png,'base64'));
 fs.writeFileSync(path.join(path.dirname(out),'before-after.png'),Buffer.from(preview,'base64'));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({baseline:'e9fc1aca43b75c140b816d2312a4cab0394136a9',inputs,families:12,forms:3,directions:8,sourceCells:288,sheets:sheets.map(s=>s.name+'.png')},null,2)+'\n');
 console.log('36 direct before/after sheets: complete body without arms, swings and recovery, all 288 cells.');
}finally{await browser.close();}
