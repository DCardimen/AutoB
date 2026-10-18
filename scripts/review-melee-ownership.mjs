import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {runtimeFiles,fingerprint} from './animation-contract.mjs';
const out='public/melee-arm-review/sheets';fs.mkdirSync(out,{recursive:true});const inputs=fingerprint(runtimeFiles());
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3047');
 const sheets=await page.evaluate(async()=>{
  const {MELEE_ARM_FAMILIES,authoredParts}=await import('/authored-parts.js'),{authoredSourceFrame,paintAtlasCharacter}=await import('/authored-sprite-renderer.js');
  const {PIXEL_SPECIES}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels,PixelBrush,spritePoint}=await import('/prototype-pixel-art.js');
  const sheets=[];
  for(const identity of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++){
   const prior=new Image();prior.src=`/public/torso-fill-review/sheets/${identity}-${stage}.png`;await prior.decode();
   const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted),canvas=document.createElement('canvas');canvas.width=1728;canvas.height=1280;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);
   const cell=document.createElement('canvas');cell.width=cell.height=64;const ctx=cell.getContext('2d');
   for(let dir=0;dir<8;dir++)for(let row=0;row<8;row++){
    const source=authoredSourceFrame(identity,dir,stage),parts=authoredParts(source,identity,stage,dir);let rgba=new Uint8ClampedArray(16384);
    const label=['original','PR65 stationary body','correct torso alone','moving source ownership','PR65 attack .375','correct attack .375','correct BODY ONLY .375','correct recovery .625'][row];
    if(row===1||row===4){ctx.clearRect(0,0,64,64);ctx.drawImage(prior,dir*216+148,(row===1?2:4)*160+96,64,64,0,0,64,64);}
    else{
     if(row===0||row===2||row===3)for(const p of row===2?[...parts.underbody,...parts.body]:source.pixels){
      const owner=[...parts.arms.profiles.values()].find(a=>!a.occluded&&a.grid.has(p.y*64+p.x)),rgb=row===3?(owner?(owner.side===-1?[255,128,128]:[128,255,220]):p.rgb.map(n=>n*.3)):p.rgb;rgba.set([...rgb,255],(p.y*64+p.x)*4);
     }
     else{
      const rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},'attack',row===7?.625:.375),angle=dir*Math.PI/4;
      if(row===6){const b=new PixelBrush();rig.dir=dir;paintAtlasCharacter(b,rig.id,rig,q=>spritePoint(q,angle));rgba=b.data;}
      else rgba=paintCharacterPixels(rig.id,rig,angle);
     }
     ctx.putImageData(new ImageData(rgba,64,64),0,0);
    }
    c.drawImage(cell,dir*216,row*160+16,144,144);c.drawImage(cell,dir*216+148,row*160+96,64,64);c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(`${identity}/${stage}/${dir} ${label}`,dir*216+2,row*160+12);
   }
   sheets.push({name:`${identity}-${stage}`,png:canvas.toDataURL().split(',')[1]});
  }return sheets;
 });
 for(const s of sheets)fs.writeFileSync(path.join(out,s.name+'.png'),Buffer.from(s.png,'base64'));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({baseline:'31a1fed8c73266ef36364cbaeaa58e3759118a95',inputs,families:7,forms:3,directions:8,sourceCells:168,sheets:sheets.map(s=>s.name+'.png')},null,2)+'\n');
 console.log('21 original / PR65 / corrected ownership, body-only and attack sheets; all 168 melee source cells.');
}finally{await browser.close();}
