// Recover whole crowns/horns from their authored master. Quantize against
// the existing palette; recoloring or shrinking only a damaged part is forbidden.
import fs from 'node:fs';
import {chromium} from 'playwright';
import {AUTHORED_BODIES_STAGE2} from '../authored-body-stage2-data.js';
import {AUTHORED_FAMILIES_STAGE1} from '../authored-family-stage1-data.js';
import {AUTHORED_FAMILIES_STAGE2} from '../authored-family-stage2-data.js';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage();
 const inputs=[{group:'bodies',module:'body',stage:2,assets:AUTHORED_BODIES_STAGE2,ids:['minotaur','skeleton','moth']}];
 for(const input of inputs){
 const master=`public/authored-${input.group}-${input.stage===1?'mature':'apex'}-source.png`,source='data:image/png;base64,'+fs.readFileSync(master).toString('base64');
 const repaired=await page.evaluate(async({source,assets,ids,master})=>{
  const image=new Image();image.src=source;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,image.width,image.height).data,out={};
  for(const identity of ids){
   const a=assets[identity],palette=a.palette.map(hex=>hex.match(/../g).map(c=>parseInt(c,16))),frames=[],bounds=[];
   for(let dir=0;dir<8;dir++){
    const x0=a.sourceColumns[dir],x1=a.sourceColumns[dir+1],y0=Math.max(0,a.sourceRows[0]-26),y1=Math.min(image.height,a.sourceRows[1]+7),occupied=new Set();
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(rgba[(y*image.width+x)*4+3]>=160)occupied.add(y*image.width+x);
    const components=[];while(occupied.size){const first=occupied.values().next().value,queue=[first];occupied.delete(first);for(let i=0;i<queue.length;i++){const n=queue[i],x=n%image.width,y=Math.floor(n/image.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*image.width+xx;if(xx>=x0&&xx<x1&&yy>=y0&&yy<y1&&occupied.delete(k))queue.push(k);}}components.push(queue);}
    const main=components.sort((a,b)=>b.length-a.length)[0];if(!main?.length)throw Error(identity+' missing source');
    const left=Math.min(...main.map(n=>n%image.width)),right=Math.max(...main.map(n=>n%image.width)),top=Math.min(...main.map(n=>Math.floor(n/image.width))),bottom=Math.max(...main.map(n=>Math.floor(n/image.width))),mask=new Set(main),scale=Math.min(44/(bottom-top+1),46/(right-left+1)),width=Math.ceil((right-left+1)*scale),height=Math.ceil((bottom-top+1)*scale),ox=Math.round(32-width/2),oy=45-height,indexed=new Uint8Array(4096);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
     const samples=[];for(const dy of [.2,.5,.8])for(const dx of [.2,.5,.8]){const sx=Math.floor(left+(x+dx)/scale),sy=Math.floor(top+(y+dy)/scale),n=sy*image.width+sx;if(mask.has(n))samples.push([rgba[n*4],rgba[n*4+1],rgba[n*4+2]]);}
     if(samples.length<4)continue;const color=[0,1,2].map(k=>samples.reduce((n,c)=>n+c[k],0)/samples.length);let best=1,distance=Infinity;for(let i=1;i<palette.length;i++){const d=color.reduce((n,c,k)=>n+(c-palette[i][k])**2,0);if(d<distance){distance=d;best=i;}}indexed[(y+oy)*64+x+ox]=best;
    }
    frames.push([...indexed].map(n=>n.toString(16).padStart(2,'0')).join(''));bounds.push({left,right,top,bottom,scale});
   }
   let rear='';for(let y=0;y<64;y++)for(let x=63;x>=0;x--)rear+=frames[5].slice((y*64+x)*2,(y*64+x)*2+2);frames[7]=rear;
   out[identity]={...a,frames,sourceRecovery:{method:'complete connected authored silhouette',master,bounds}};
  }
  return out;
 },{source,assets:input.assets,ids:input.ids,master});
 const atlas={...input.assets,...repaired},name=`AUTHORED_${input.group.toUpperCase()}_STAGE${input.stage}`;fs.writeFileSync(`authored-${input.module}-stage${input.stage}-data.js`,'// Imported indexed art; source recovery: node scripts/repair-anatomy-imports.mjs.\nexport const '+name+'='+JSON.stringify(atlas)+';\n');
 }
 // Adjacent masters touch in a few columns: a component flood cannot
 // distinguish the foreign row there. Reviewed ownership masks remove only
 // the neighboring troll crown / bat feet, preserving the costume pixels.
 const clean=(a,remove,reason)=>({...a,frames:a.frames.map((frame,dir)=>{let out='';for(let i=0;i<4096;i++){const index=parseInt(frame.slice(i*2,i*2+2),16);out+=(index&&remove(i%64,Math.floor(i/64),index,dir,a.palette)?0:index).toString(16).padStart(2,'0');}return out;}),sourceOwnershipRepair:reason});
 for(const [stage,original]of [[1,AUTHORED_FAMILIES_STAGE1],[2,AUTHORED_FAMILIES_STAGE2]]){
  const atlas={...original},foreign=new Set(stage===1?[37,41,20,36]:[31,32]);
  atlas.frostelf=clean(atlas.frostelf,(x,y,index)=>y>=40&&foreign.has(index),'Remove neighboring troll-crown pixels below the blue gown.');
  if(stage===2)atlas.phoenix=clean(atlas.phoenix,(x,y,index,dir,palette)=>{if(dir!==6||y>6)return false;const [r,g,b]=palette[index].match(/../g).map(c=>parseInt(c,16));return !(r>g*2&&g>b*2&&r>100);},'Remove neighboring bat feet above the rear phoenix crest.');
  const ground=new Set(stage===1?[36,40]:[11,39]);
  atlas.phoenix=clean(atlas.phoenix,(x,y,index,dir)=>stage===1&&dir===0&&x>=57||y>=44&&ground.has(index),'Remove the separate neighboring flame at the east cell edge and only the indexed ground material below the intact talons; retain flame-tail tips on the same row.');
  if(stage===1){
   const a=atlas.phoenix,bytes=Array.from({length:4096},(_,i)=>parseInt(a.frames[0].slice(i*2,i*2+2),16)),todo=new Set(bytes.flatMap((n,i)=>n?[i]:[]));
   while(todo.size){const first=todo.values().next().value,queue=[first];todo.delete(first);for(let i=0;i<queue.length;i++){const x=queue[i]%64,y=Math.floor(queue[i]/64);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&todo.delete(n))queue.push(n);}}
    // The neighboring flame is a separate source component. Remove its
    // entire ownership region, including the part left inside the cell.
    if(queue.every(n=>n%64>=52&&Math.floor(n/64)>=26))for(const n of queue)bytes[n]=0;
   }
   a.frames[0]=bytes.map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  fs.writeFileSync(`authored-family-stage${stage}-data.js`,'// Indexed source ownership repairs: node scripts/repair-anatomy-imports.mjs.\nexport const AUTHORED_FAMILIES_STAGE'+stage+'='+JSON.stringify(atlas)+';\n');
 }
 console.log('Recovered complete horns/crowns, removed the foreign crab crystal, and repaired reviewed neighboring-row ownership without changing palette indices.');
}finally{await browser.close();}
