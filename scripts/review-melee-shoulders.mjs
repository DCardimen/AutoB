import fs from 'node:fs';
import {chromium} from 'playwright';
import {fingerprint,runtimeFiles} from './animation-contract.mjs';
const out='public/melee-shoulder-review';fs.mkdirSync(out+'/shoulders',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3055');const result=await page.evaluate(async()=>{
 const {MELEE_ARM_FAMILIES}=await import('/authored-parts.js'),{authoredSourceFrame,paintAtlasCharacter}=await import('/authored-sprite-renderer.js'),{nativePoseRig}=await import('/native-poses.js'),{PIXEL_SPECIES}=await import('/native-content.js'),{PixelBrush,spritePoint,paintCharacterPixels}=await import('/prototype-pixel-art.js');
 const sheets=[],cases=[];
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++){
  const c=document.createElement('canvas');c.width=1536;c.height=1344;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#20323b';x.fillRect(0,0,c.width,c.height);const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);
  for(let dir=0;dir<8;dir++)for(let row=0;row<7;row++){
   const phase=row<4?.375:.625,rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},row===1?'idle':'attack',row===1?.25:phase);rig.artStage=stage;rig.suppressShoulders=row===2||row===4;
   let data;if(row===0){data=new Uint8ClampedArray(16384);for(const p of authoredSourceFrame(id,dir,stage).pixels)data.set([...p.rgb,255],(p.y*64+p.x)*4);}else if(row===6){rig.dir=dir;const b=new PixelBrush();paintAtlasCharacter(b,rig.id,rig,p=>spritePoint(p,dir*Math.PI/4));data=b.data;}else data=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
   const cell=document.createElement('canvas');cell.width=cell.height=64;cell.getContext('2d').putImageData(new ImageData(data,64,64),0,0);x.drawImage(cell,dir*192,row*192+24,128,128);x.drawImage(cell,dir*192+128,row*192+120,64,64);x.fillStyle='#efefcf';x.font='10px monospace';x.fillText(`${id} ${stage}/${dir} ${['CONVERTED BIND','IDLE','FIXED SHOULDERS .375','ROLLING SHOULDERS .375','FIXED SHOULDERS .625','ROLLING SHOULDERS .625','BODY ONLY .625'][row]}`,dir*192,row*192+13);
   if(row===3)cases.push({id,stage,dir,motions:rig.artShoulderSkin.motions.map(m=>({side:m.side,theta:m.theta,bounds:m.source.bounds})),clipped:data.clipped||0});
  }
  sheets.push({id,stage,png:c.toDataURL().split(',')[1]});
 }
 return {sheets,cases};
 });for(const s of result.sheets)fs.writeFileSync(`${out}/shoulders/${s.id}-${s.stage}.png`,Buffer.from(s.png,'base64'));fs.writeFileSync(out+'/checks/shoulder-review.json',JSON.stringify({inputs:fingerprint(runtimeFiles()),cases:result.cases},null,2)+'\n');console.log(JSON.stringify({sheets:result.sheets.length,cells:result.cases.length,clipped:result.cases.filter(c=>c.clipped).length}));
}finally{await browser.close();}
