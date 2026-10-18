import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/arm-animation');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000');
 const sheets=await page.evaluate(async()=>{
  const {ARM_ANATOMY}=await import('/companion-anatomy.js'),{authoredSourceFrame}=await import('/authored-sprite-renderer.js'),{authoredParts}=await import('/authored-parts.js');
  const {PIXEL_SPECIES}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels}=await import('/prototype-pixel-art.js');
  const sheets=[];
  for(const identity of Object.keys(ARM_ANATOMY))for(let stage=0;stage<3;stage++){
   const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted),canvas=document.createElement('canvas');canvas.width=1728;canvas.height=8*160;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);
   const cell=document.createElement('canvas');cell.width=cell.height=64;const ctx=cell.getContext('2d');
   for(let dir=0;dir<8;dir++)for(let row=0;row<8;row++){
    const source=authoredSourceFrame(identity,dir,stage),parts=authoredParts(source,identity,stage,dir);let rgba=new Uint8ClampedArray(16384),label;
    if(row<3){
     label=['original','arm ownership','body only'][row];
     for(const p of row===2?parts.body:source.pixels){const rgb=row===1?(parts.arms.profiles.get(-1).grid.has(p.y*64+p.x)?[255,128,128]:parts.arms.profiles.get(1).grid.has(p.y*64+p.x)?[128,255,220]:p.rgb.map(n=>n*.3)):p.rgb;rgba.set([...rgb,255],(p.y*64+p.x)*4);}
    }else{
     const phase=row===3?.25:(row-4)*.25+.125,state=row===3?'idle':'attack',rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,phase);
     rgba=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);label=state+' '+phase;
    }
    ctx.putImageData(new ImageData(rgba,64,64),0,0);c.drawImage(cell,dir*216,row*160+16,144,144);c.drawImage(cell,dir*216+148,row*160+96,64,64);
    c.fillStyle='#e7dfc2';c.font='11px monospace';c.fillText(identity+' '+stage+' '+dir+' '+label,dir*216+2,row*160+12);
   }
   sheets.push({name:identity+'-'+stage,png:canvas.toDataURL().split(',')[1]});
  }return sheets;
 });
 for(const sheet of sheets)fs.writeFileSync(path.join(out,sheet.name+'.png'),Buffer.from(sheet.png,'base64'));
 fs.writeFileSync(path.join(out,'review.html'),'<!doctype html><title>Arm ownership and full swings</title><style>body{background:#183139;color:#eee;font:16px system-ui}img{max-width:100%;image-rendering:pixelated}a{color:#bff}</style><h1>Original, arm ownership, isolated torso, idle and complete swing</h1>'+sheets.map(s=>`<h2>${s.name}</h2><a href="${s.name}.png"><img loading="lazy" src="${s.name}.png"></a>`).join(''));
 console.log(`${sheets.length} sheets: all 12 articulated families, 3 forms, 8 facings; original + isolated parts + full swings.`);
}finally{await browser.close();}
