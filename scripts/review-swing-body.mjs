import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const label=process.argv[2]||'after',base=process.env.BASE_URL||'http://127.0.0.1:3000';
fs.mkdirSync('playtest-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>window.starfall);
 const result=await page.evaluate(async()=>{
  const {pixelSpec}=await import('/native-content.js'),{nativePoseRig}=await import('/native-poses.js'),{paintCharacterPixels,spritePoint,SPRITE_ART_REVISION}=await import('/prototype-pixel-art.js'),{paintAtlasCharacter}=await import('/authored-sprite-renderer.js');
  class BodyBrush{
   constructor(){this.data=new Uint8ClampedArray(64*64*4);}
   dot(x,y,color){x=Math.round(x);y=Math.round(y);if(x>=0&&x<64&&y>=0&&y<64)this.data.set([...color.slice(1).match(/../g).map(c=>parseInt(c,16)),255],(y*64+x)*4);}
   rect(x,y,w,h,c){for(let j=Math.round(y);j<Math.round(y+h);j++)for(let i=Math.round(x);i<Math.round(x+w);i++)this.dot(i,j,c);}
   line(a,z,c){const n=Math.max(1,Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)*2));for(let i=0;i<=n;i++)this.dot(a.x+(z.x-a.x)*i/n,a.y+(z.y-a.y)*i/n,c);}
  }
  const rows=['brakk','aurel','brom','tarka','syl','nyra','rowan','grit','grum','morrow','sable','eira'].flatMap(id=>[0,1,2].map(evolution=>({id,evolution}))),cols=[['body',.25,1],['idle',.25,1],['attack',.12,1],['attack',.34,1],['attack',.46,1],['attack',.65,1],['attack',.82,1],['attack',.46,2]];
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=rows.length*154;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const cell=document.createElement('canvas');cell.width=cell.height=64;const sc=cell.getContext('2d'),poses=[];
  rows.forEach(({id,evolution},row)=>{ctx.fillStyle='#10242c';ctx.fillRect(0,row*154,canvas.width,154);ctx.fillStyle='#e4dfc2';ctx.font='12px monospace';ctx.fillText(`${id} stage ${evolution}: body / carry / windup / contact / recovery`,4,row*154+13);cols.forEach(([state,phase,dir],col)=>{
   const spec=pixelSpec(id),rig=nativePoseRig(spec,{id,evolution,evolutionPath:'wild'},state==='body'?'idle':state,phase),angle=dir*Math.PI/4;
   let pixels;
   if(state==='body'){rig.dir=dir;const brush=new BodyBrush();paintAtlasCharacter(brush,spec.nativeRig,rig,q=>spritePoint(q,angle));pixels=brush.data;}
   else pixels=paintCharacterPixels(spec.nativeRig,rig,angle);
   sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(cell,col*128,row*154+20,128,128);poses.push({id,evolution,state,phase,dir,clipped:pixels.clipped||0,bodyRepairs:rig.artBodyRepairs?.length||0});
  });});
  const families=[...new Set(rows.map(row=>row.id))].map((id,i)=>{const out=document.createElement('canvas');out.width=1024;out.height=462;out.getContext('2d').drawImage(canvas,0,i*462,1024,462,0,0,1024,462);return {id,png:out.toDataURL().split(',')[1]};});
  return {png:canvas.toDataURL().split(',')[1],families,poses,artRevision:SPRITE_ART_REVISION};
 });
 assert.deepEqual(errors,[]);assert.ok(result.poses.every(p=>p.clipped===0));
 fs.writeFileSync(`playtest-artifacts/swing-body-${label}.png`,Buffer.from(result.png,'base64'));
 for(const family of result.families)fs.writeFileSync(`playtest-artifacts/swing-body-${label}-${family.id}.png`,Buffer.from(family.png,'base64'));
 fs.writeFileSync(`playtest-artifacts/swing-body-${label}.json`,JSON.stringify({artRevision:result.artRevision,poses:result.poses,errors},null,2)+'\n');
 if(label==='after')fs.writeFileSync('tests/reports/swing-body.json',JSON.stringify({artRevision:result.artRevision,poses:result.poses,errors},null,2)+'\n');
 console.log(`Saved body-only and actual swing frames: ${label}`);
}finally{await browser.close();}
