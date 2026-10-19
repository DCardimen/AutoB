import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root='public/melee-layer-review',base=process.env.REVIEW_URL||'http://127.0.0.1:3054/public/melee-layer-review';
const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const p=await b.newPage();await p.goto(base+'/sheets/manifest.json');for(const kind of ['wild','warden']){
 const manifest=JSON.parse(fs.readFileSync(`${root}/${kind}/video-manifest.json`)),decoded=JSON.parse(fs.readFileSync(`${root}/${kind}/decoded-video.json`));assert.equal(decoded.status,'passed');assert.equal(decoded.captures.length,136);
 const images=await p.evaluate(async({base,kind,manifest,decoded})=>{
  const rows=manifest.states.length,panels=manifest.positions.map(pos=>{const c=document.createElement('canvas');c.width=1536;c.height=rows*84+24+220;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#183139';x.fillRect(0,0,c.width,c.height);x.fillStyle='#e7dfc2';x.font='12px monospace';x.fillText(`${kind} / ${pos.identity} / real decoded 1x / E,SE,S,SW,W,NW,N,NE / base,mature,apex`,8,16);return {pos,c,x};});
  for(const shot of decoded.captures){const i=new Image();i.src=`${base}/${kind}/${shot.file}`;await i.decode();const row=manifest.states.indexOf(shot.state);
   for(const {pos,x}of panels){x.fillStyle='#e7dfc2';x.font='11px monospace';x.fillText(`${shot.state} / ${shot.dir}`,shot.dir*192+4,24+row*84+12);pos.forms.forEach((f,s)=>x.drawImage(i,f.x,f.y,64,64,shot.dir*192+s*64,24+row*84+18,64,64));
    if(shot.state==='attack'&&[0,2,4,6].includes(shot.dir)){const s=pos.forms[2],col=shot.dir/2;x.fillText(`apex attack / ${shot.dir} / 3x`,col*384+5,24+rows*84+14);x.drawImage(i,s.x,s.y,64,64,col*384,24+rows*84+20,192,192);x.drawImage(i,s.x,s.y,64,64,col*384+200,24+rows*84+140,64,64);}
   }
  }
  return panels.map(({pos,c})=>({family:pos.identity,png:c.toDataURL().split(',')[1]}));
 },{base,kind,manifest,decoded});for(const i of images)fs.writeFileSync(`${root}/${kind}/cycles-${i.family}.png`,Buffer.from(i.png,'base64'));
}}
finally{await b.close();}
console.log('14 family/path sheets package every decoded state, facing and form, plus native/enlarged apex attacks.');
