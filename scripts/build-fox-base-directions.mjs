import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const args=process.argv.slice(2),bowAt=args.indexOf('--bows'),bowFile=bowAt>=0?args.splice(bowAt,2)[1]:null,pilot=args[0]==='--pilot';
const order=pilot?['SW']:['E','SE','S','SW','W','NW','N','NE'];
const names=['head-open','head-closed','torso','arm-right','arm-left','leg-right','leg-left','cape','tail','bow','quiver','arrow'];
const files=pilot?args.slice(1):args;if(files.length!==order.length)throw Error('Pass eight base-fox sheets in E, SE, S, SW, W, NW, N, NE order, or --pilot SW.png');
const root=path.resolve('public/fox-layered-preview');fs.mkdirSync(path.join(root,'sources'),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();
 const kits=await page.evaluate(async({input,names,bowSrc})=>{
  const kits=[];
  let bowImage,bowPixels;
  if(bowSrc){bowImage=new Image();bowImage.src=bowSrc;await bowImage.decode();const canvas=document.createElement('canvas');canvas.width=bowImage.width;canvas.height=bowImage.height;const c=canvas.getContext('2d');c.drawImage(bowImage,0,0);bowPixels=c.getImageData(0,0,canvas.width,canvas.height).data;}
  for(const {direction,src}of input){
   const image=new Image();image.src=src;await image.decode();const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0);const rgba=sc.getImageData(0,0,image.width,image.height).data;
   const labels=new Int32Array(image.width*image.height),queue=new Int32Array(labels.length),groups=[];
   for(let seed=0;seed<labels.length;seed++){
    if(labels[seed]||rgba[seed*4+3]<=160)continue;
    const id=groups.length+1;let front=0,end=1,sx=0,sy=0,left=image.width,top=image.height,right=0,bottom=0;labels[seed]=id;queue[0]=seed;
    while(front<end){const n=queue[front++],x=n%image.width,y=Math.floor(n/image.width);sx+=x;sy+=y;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*image.width+xx;if(xx<0||xx>=image.width||yy<0||yy>=image.height||labels[k]||rgba[k*4+3]<=160)continue;labels[k]=id;queue[end++]=k;}
    }
    const tile=Math.min(2,Math.floor(sy/end/image.height*3))*4+Math.min(3,Math.floor(sx/end/image.width*4));groups.push({id,count:end,left,right,top,bottom,tile});
   }
   const atlas=document.createElement('canvas');atlas.width=512;atlas.height=384;const ctx=atlas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const parts={};
   for(let tile=0;tile<12;tile++){
    const group=groups.filter(g=>g.tile===tile).sort((a,b)=>b.count-a.count)[0];if(!group)throw Error(direction+' missing '+names[tile]);
    const {left,top,right,bottom}=group,w=right-left+1,h=bottom-top+1,cut=document.createElement('canvas');cut.width=w;cut.height=h;const pixels=new Uint8ClampedArray(w*h*4);
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const n=y*image.width+x;if(labels[n]!==group.id)continue;const d=((y-top)*w+x-left)*4;for(let k=0;k<4;k++)pixels[d+k]=rgba[n*4+k];}
    cut.getContext('2d').putImageData(new ImageData(pixels,w,h),0,0);const s=Math.min(108/w,108/h),pw=Math.ceil(w*s),ph=Math.ceil(h*s),x=tile%4*128+Math.floor((128-pw)/2),y=Math.floor(tile/4)*128+Math.floor((128-ph)/2);ctx.drawImage(cut,x,y,pw,ph);parts[names[tile]]={x,y,w:pw,h:ph,sourceBounds:[left,top,right,bottom]};
   }
   if(bowImage){
    const index=['E','SE','S','SW','W','NW','N','NE'].indexOf(direction),cellW=bowImage.width/4,cellH=bowImage.height/2;
    let left=bowImage.width,right=0,top=bowImage.height,bottom=0;
    for(let y=Math.floor(index/4)*cellH;y<(Math.floor(index/4)+1)*cellH;y++)for(let x=index%4*cellW;x<(index%4+1)*cellW;x++)if(bowPixels[(y*bowImage.width+x)*4+3]>160){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right<=left||bottom<=top)throw Error('Missing directional bow '+direction);
    const w=right-left+1,h=bottom-top+1,s=Math.min(108/w,108/h),pw=Math.ceil(w*s),ph=Math.ceil(h*s),x=128+Math.floor((128-pw)/2),y=256+Math.floor((128-ph)/2);
    ctx.clearRect(128,256,128,128);ctx.drawImage(bowImage,left,top,w,h,x,y,pw,ph);parts.bow={x,y,w:pw,h:ph,sourceBounds:[left,top,right,bottom],source:'sources/base-bows-master.png'};
   }
   const pixels=ctx.getImageData(0,0,512,384).data;
   const centroid=(p,lo,hi)=>{let sx=0,sy=0,n=0;for(let y=Math.floor(p.h*lo);y<p.h*hi;y++)for(let x=0;x<p.w;x++)if(pixels[((p.y+y)*512+p.x+x)*4+3]>128){sx+=x;sy+=y;n++;}if(!n)throw Error('Empty landmark '+direction);return {x:sx/n,y:sy/n};};
   for(const [name,p]of Object.entries(parts))if(/^(arm|leg)-/.test(name)){p.root=centroid(p,.04,.17);p.joint=centroid(p,name.startsWith('arm')?.43:.22,name.startsWith('arm')?.54:.3);p.tip=centroid(p,name.startsWith('arm')?.8:.39,name.startsWith('arm')?.9:.49);}
   const b=parts.bow;b.grip=centroid(b,.46,.54);b.top=centroid(b,0,.06);b.bottom=centroid(b,.94,1);
   kits.push({form:'rowan',direction,parts,indexed:false,continuousLimbs:true,sourceSize:[image.width,image.height],encoded:atlas.toDataURL('image/png').split(',')[1]});
  }return kits;
 },{input:files.map((file,i)=>({direction:order[i],src:'data:image/png;base64,'+fs.readFileSync(file).toString('base64')})),names,bowSrc:bowFile?'data:image/png;base64,'+fs.readFileSync(bowFile).toString('base64'):null});
 const retain=(from,to)=>{if(path.resolve(from).toLowerCase()!==path.resolve(to).toLowerCase())fs.copyFileSync(from,to);};
 if(bowFile)retain(bowFile,path.join(root,'sources/base-bows-master.png'));
 for(let i=0;i<kits.length;i++){
  const k=kits[i];k.image='rowan-'+k.direction+'-parts.png';fs.writeFileSync(path.join(root,k.image),Buffer.from(k.encoded,'base64'));delete k.encoded;
  k.source='sources/rowan-'+k.direction+'-master.png';retain(files[i],path.join(root,k.source));k.sourceSha256=createHash('sha256').update(fs.readFileSync(files[i])).digest('hex');
 }
 const manifest={version:3,coverage:{forms:['rowan'],directionCount:order.length,targetDirectionCount:8,directionOrder:order,motionDirections:['SW'],gameIntegration:false},logicalCellSize:64,rasterSize:256,stocky:true,weaponHand:'right',drawHand:'left',forms:[kits.find(k=>k.direction==='SW')],directions:kits};
 fs.writeFileSync(path.join(root,'base-directions.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(kits.map(k=>({direction:k.direction,parts:Object.keys(k.parts).length}))));
}finally{await browser.close();}
