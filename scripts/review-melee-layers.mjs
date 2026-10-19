import fs from 'node:fs';
import {chromium} from 'playwright';
import {fingerprint,runtimeFiles} from './animation-contract.mjs';
const out=(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/melee-layer-review')+'/sheets';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3047');
 const sheets=await page.evaluate(async()=>{
  const {authoredSourceFrame,paintAtlasCharacter}=await import('/authored-sprite-renderer.js'),{authoredParts,MELEE_ARM_FAMILIES}=await import('/authored-parts.js'),{nativePoseRig}=await import('/native-poses.js'),{PIXEL_SPECIES}=await import('/native-content.js'),{paintCharacterPixels,PixelBrush,spritePoint}=await import('/prototype-pixel-art.js');
  const output=[];
  for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++){
   const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1344;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#20323b';c.fillRect(0,0,canvas.width,canvas.height);
   const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);
   for(let dir=0;dir<8;dir++)for(let row=0;row<7;row++){
    const a=authoredSourceFrame(id,dir,stage),p=authoredParts(a,id,stage,dir),cell=document.createElement('canvas');cell.width=cell.height=64;const ctx=cell.getContext('2d');let data=new Uint8ClampedArray(16384);
    if(row<4){const ps=row===0?a.pixels:row===1?[...p.layers['cape-back'],...p.underbody,...p.body]:row===2?p.cape:[...p.arms.profiles.values()].flatMap(a=>a.pixels).concat(p.legs);for(const v of ps)data.set([...v.rgb,255],(v.y*64+v.x)*4);}
    else{const rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},row===4?'idle':'attack',row===4?.25:row===5?.375:.625),angle=dir*Math.PI/4;rig.artStage=stage;if(row===6){const b=new PixelBrush();rig.dir=dir;paintAtlasCharacter(b,rig.id,rig,q=>spritePoint(q,angle));data=b.data;}else data=paintCharacterPixels(rig.id,rig,angle);}
    ctx.putImageData(new ImageData(data,64,64),0,0);c.drawImage(cell,dir*192,row*192+24,128,128);c.drawImage(cell,dir*192+128,row*192+120,64,64);
    c.fillStyle='#efefcf';c.font='10px monospace';c.fillText(`${id} ${stage}/${dir} ${['CONVERTED BIND','LIMBS HIDDEN / FULL BODY','CAPE SURFACE','MOVING LIMBS','IDLE','ATTACK .375','BODY ONLY .625'][row]}`,dir*192+1,row*192+13);
   }output.push({id,stage,png:canvas.toDataURL().split(',')[1]});
  }return output;
 });
 for(const s of sheets)fs.writeFileSync(`${out}/${s.id}-${s.stage}.png`,Buffer.from(s.png,'base64'));
 fs.writeFileSync(out+'/manifest.json',JSON.stringify({inputs:fingerprint(runtimeFiles()),families:7,forms:3,directions:8,sourceCells:168,meaning:'Raw PNG crops live separately in originals/. The first row is the frozen converted bind, not pristine original pixels. Each animated row forces its labeled art stage.',sheets:sheets.map(s=>`${s.id}-${s.stage}.png`)},null,2)+'\n');
}finally{await browser.close();}
