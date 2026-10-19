import fs from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),out=(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/melee-layer-review')+'/ownership';fs.mkdirSync(out,{recursive:true});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3053');
 const images=await page.evaluate(async()=>{
  const {authoredSourceFrame}=await import('/authored-sprite-renderer.js'),{authoredParts,MELEE_ARM_FAMILIES}=await import('/authored-parts.js'),result=[];
  for(const id of MELEE_ARM_FAMILIES)for(const stage of [0,1,2])for(const start of [0,4]){
   const c=document.createElement('canvas');c.width=896;c.height=896;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#30434b';ctx.fillRect(0,0,896,896);const cell=document.createElement('canvas');cell.width=cell.height=64;const cc=cell.getContext('2d');
   for(let dir=start;dir<start+4;dir++){
    const a=authoredSourceFrame(id,dir,stage),p=authoredParts(a,id,stage,dir),colors={'left-arm':[255,108,108],'right-arm':[88,242,211],head:[150,150,240],body:[210,170,75],armor:[240,220,140],'cape-back':[105,170,255],'cape-front':[105,170,255],'left-leg':[170,110,240],'right-leg':[210,110,240]};
    for(let col=0;col<4;col++){
     const data=new Uint8ClampedArray(16384),pixels=col===0||col===1?a.pixels:col===2?[...p.layers['cape-back'],...p.underbody,...p.body]:[...p.arms.profiles.values()].flatMap(a=>a.pixels);
     for(const v of pixels)data.set([...(col===1?colors[p.ownership.get(v.y*64+v.x)]||[255,255,255]:v.rgb),255],(v.y*64+v.x)*4);
     cc.putImageData(new ImageData(data,64,64),0,0);const x=col*224,y=(dir-start)*224;ctx.drawImage(cell,x,y+24,192,192);ctx.fillStyle='#efefcf';ctx.font='11px monospace';ctx.fillText(`${id}/${stage}/${dir} ${['BIND','OWNERSHIP','LIMBS HIDDEN','ARMS'][col]}`,x+1,y+15);
    }
   }result.push({name:`${id}-${stage}-${start}`,png:c.toDataURL().split(',')[1]});
  }return result;
 });for(const i of images)fs.writeFileSync(`${out}/${i.name}.png`,Buffer.from(i.png,'base64'));
}finally{await browser.close();}
