import fs from 'node:fs';
import {chromium} from 'playwright';
import {runtimeFiles,fingerprint} from './animation-contract.mjs';
const out='public/melee-clothing-review/sheets';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3047');
 const sheets=await page.evaluate(async()=>{
  const {MELEE_ARM_FAMILIES,authoredParts}=await import('/authored-parts.js'),{authoredSourceFrame,paintAtlasCharacter}=await import('/authored-sprite-renderer.js');
  const {PIXEL_SPECIES}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels,PixelBrush,spritePoint}=await import('/prototype-pixel-art.js');
  const sheets=[];
  for(const identity of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++){
   const prior=new Image();prior.src=`/public/melee-arm-review/sheets/${identity}-${stage}.png`;await prior.decode();
   const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted),canvas=document.createElement('canvas');canvas.width=1728;canvas.height=1600;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);
   const cell=document.createElement('canvas');cell.width=cell.height=64;const ctx=cell.getContext('2d');
   for(let dir=0;dir<8;dir++)for(let row=0;row<10;row++){
    const source=authoredSourceFrame(identity,dir,stage),parts=authoredParts(source,identity,stage,dir);let rgba=new Uint8ClampedArray(16384);
    const label=['original','PR66 cut clothing','complete body and cape','cape / hidden underpaint','moving source arms','PR66 attack .375','attack .125','attack .375','attack .625','BODY ONLY .375'][row];
    if(row===1||row===5){ctx.clearRect(0,0,64,64);ctx.drawImage(prior,dir*216+148,(row===1?2:5)*160+96,64,64,0,0,64,64);}
    else{
     if(row<5){const pixels=row===0?source.pixels:row===2?[...parts.clothing.repairs,...parts.underbody,...parts.body]:row===3?[...parts.clothing.pixels,...parts.clothing.repairs]:[...parts.arms.profiles.values()].flatMap(p=>p.pixels);
      for(const p of pixels)rgba.set([...p.rgb,255],(p.y*64+p.x)*4);
     }else{
      const rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},'attack',row===6?.125:row===8?.625:.375),angle=dir*Math.PI/4;
      if(row===9){const b=new PixelBrush();rig.dir=dir;paintAtlasCharacter(b,rig.id,rig,q=>spritePoint(q,angle));rgba=b.data;}else rgba=paintCharacterPixels(rig.id,rig,angle);
     }ctx.putImageData(new ImageData(rgba,64,64),0,0);
    }
    c.drawImage(cell,dir*216,row*160+16,144,144);c.drawImage(cell,dir*216+148,row*160+96,64,64);c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(`${identity}/${stage}/${dir} ${label}`,dir*216+2,row*160+12);
   }sheets.push({name:`${identity}-${stage}`,png:canvas.toDataURL().split(',')[1]});
  }return sheets;
 });
 for(const s of sheets)fs.writeFileSync(out+'/'+s.name+'.png',Buffer.from(s.png,'base64'));
 const example=await page.evaluate(async png=>{
  const sheet=new Image();sheet.src='data:image/png;base64,'+png;await sheet.decode();
  const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=416;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,1120,416);c.font='12px monospace';c.fillStyle='#e7dfc2';
  const rows=[0,1,2,5,7],labels=['Original authored art','PR66: cut clothing','Complete body / cape','PR66: attack','Complete cape in attack'];
  for(const [r,dir]of [2,3].entries())for(const [col,row]of rows.entries()){
   const x=col*224,y=r*208;c.fillText(labels[col],x+4,y+14);c.fillText('knight form 1 / '+(dir===2?'S':'SW'),x+4,y+28);
   c.drawImage(sheet,dir*216+148,row*160+96,64,64,x,y+48,144,144);c.drawImage(sheet,dir*216+148,row*160+96,64,64,x+152,y+128,64,64);
  }return canvas.toDataURL().split(',')[1];
 },sheets.find(s=>s.name==='knight-1').png);
 fs.writeFileSync('public/melee-clothing-review/before-after.png',Buffer.from(example,'base64'));
 fs.writeFileSync(out+'/manifest.json',JSON.stringify({baseline:'41f51bf8c4e3c63b8ff8785d8e645f0bdd9075a0',inputs:fingerprint(runtimeFiles()),families:7,forms:3,directions:8,sourceCells:168,sheets:sheets.map(s=>s.name+'.png')},null,2)+'\n');
 console.log('21 clothing comparison sheets: original, prior damage, complete garment, arm ownership and combat.');
}finally{await browser.close();}
