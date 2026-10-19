import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {PARTS,FORMS} from '../public/fox-layered-preview/model.mjs';
import {png} from './animation-artifacts.mjs';
const sources=process.argv.slice(2);if(sources.length!==3)throw Error('Pass Rowan, mature, Moontrail source-kit PNG paths.');
const out=path.resolve('public/fox-layered-preview');fs.mkdirSync(path.join(out,'sources'),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();
 const input=sources.map((p,i)=>({form:FORMS[i],src:'data:image/png;base64,'+fs.readFileSync(p).toString('base64')}));
 const kits=await page.evaluate(async({input,names})=>{
  const kits=[];
  for(const {form,src}of input){
   const img=new Image();img.src=src;await img.decode();const source=document.createElement('canvas');source.width=img.width;source.height=img.height;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height).data;
   const parts={},cell=64,atlas=document.createElement('canvas');atlas.width=atlas.height=cell*4;const draw=atlas.getContext('2d',{willReadFrequently:true});draw.imageSmoothingEnabled=false;
   const labels=new Int32Array(img.width*img.height),queue=new Int32Array(labels.length),groups=[null];
   for(let seed=0;seed<labels.length;seed++){
    if(labels[seed]||data[seed*4+3]<=160)continue;
    const id=groups.length;let front=0,tail=1,count=0,sumX=0,sumY=0,left=img.width,right=0,top=img.height,bottom=0;queue[0]=seed;labels[seed]=id;
    while(front<tail){const n=queue[front++],x=n%img.width,y=Math.floor(n/img.width);count++;sumX+=x;sumY+=y;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*img.width+xx;if(xx<0||xx>=img.width||yy<0||yy>=img.height||labels[k]||data[k*4+3]<=160)continue;labels[k]=id;queue[tail++]=k;}}
    const tile=Math.min(3,Math.floor(sumY/count/img.height*4))*4+Math.min(3,Math.floor(sumX/count/img.width*4));groups.push({id,count,left,right,top,bottom,tile});
   }
   const rowGuides=[0];
   for(let row=1;row<4;row++){
    const ideal=img.height*row/4;let best=Math.round(ideal),cost=Infinity;
    for(let y=Math.round(ideal-img.height*.055);y<ideal+img.height*.055;y++){
     let density=0;for(let x=0;x<img.width;x++)if(data[(y*img.width+x)*4+3]>160)density++;
     const score=density+Math.abs(y-ideal)*.015;if(score<cost){cost=score;best=y;}
    }rowGuides.push(best);
   }rowGuides.push(img.height);
   for(let row=0;row<4;row++){
    const columns=[0];
    for(let col=1;col<4;col++){
     const ideal=img.width*col/4;let best=Math.round(ideal),cost=Infinity;
     for(let x=Math.round(ideal-img.width*.055);x<ideal+img.width*.055;x++){
      let density=0;for(let y=rowGuides[row];y<rowGuides[row+1];y++)if(data[(y*img.width+x)*4+3]>160)density++;
      const score=density+Math.abs(x-ideal)*.015;if(score<cost){cost=score;best=x;}
     }columns.push(best);
    }columns.push(img.width);
    for(let col=0;col<4;col++){
     const tile=row*4+col,name=names[tile],group=groups.slice(1).filter(g=>g.tile===tile).sort((a,b)=>b.count-a.count)[0];
     if(!group)throw Error(form+' missing component '+name);
     const {left,right,top,bottom}=group;
     if(right<left||bottom<top)throw Error(form+' '+name+' has no painted source');
     const s=Math.min(54/(right-left+1),54/(bottom-top+1)),w=Math.ceil((right-left+1)*s),h=Math.ceil((bottom-top+1)*s),x=col*cell+Math.floor((cell-w)/2),y=row*cell+Math.floor((cell-h)/2);
     const isolated=document.createElement('canvas');isolated.width=right-left+1;isolated.height=bottom-top+1;const raw=new Uint8ClampedArray(isolated.width*isolated.height*4);
     for(let yy=top;yy<=bottom;yy++)for(let xx=left;xx<=right;xx++){const n=yy*img.width+xx;if(labels[n]!==group.id)continue;const at=((yy-top)*isolated.width+xx-left)*4;for(let k=0;k<4;k++)raw[at+k]=data[n*4+k];}
     isolated.getContext('2d').putImageData(new ImageData(raw,isolated.width,isolated.height),0,0);
     draw.drawImage(isolated,x,y,w,h);
     parts[name]={x,y,w,h,sourceBounds:[left,top,right,bottom]};
    }
   }
   const rgba=draw.getImageData(0,0,256,256).data;
   for(let n=0;n<rgba.length;n+=4){if(rgba[n+3]>160)rgba[n+3]=255;else rgba.fill(0,n,n+4);}
   // One stable palette is shared by every independent part of a form.
   const histogram=new Map();for(let n=0;n<rgba.length;n+=4)if(rgba[n+3]){const c=[rgba[n],rgba[n+1],rgba[n+2]].map(v=>Math.min(255,Math.round(v/8)*8)),key=c.join(',');histogram.set(key,(histogram.get(key)||0)+1);}
   let means=[...histogram].sort((a,b)=>b[1]-a[1]).slice(0,48).map(([c])=>c.split(',').map(Number));
   const nearest=c=>{let selected=0,cost=Infinity;for(let i=0;i<means.length;i++){const d=c.reduce((s,v,k)=>s+(v-means[i][k])**2,0);if(d<cost){cost=d;selected=i;}}return selected;};
   for(let pass=0;pass<6;pass++){
    const groups=means.map(()=>({s:[0,0,0],n:0}));for(let n=0;n<rgba.length;n+=4)if(rgba[n+3]){const c=[rgba[n],rgba[n+1],rgba[n+2]],g=groups[nearest(c)];g.n++;c.forEach((v,k)=>g.s[k]+=v);}
    means=means.map((c,i)=>groups[i].n?groups[i].s.map(v=>Math.round(v/groups[i].n)):c);
   }
   for(let n=0;n<rgba.length;n+=4)if(rgba[n+3]){const c=means[nearest([rgba[n],rgba[n+1],rgba[n+2]])];for(let k=0;k<3;k++)rgba[n+k]=c[k];}
   const centroid=(part,lo,hi)=>{
    let sx=0,sy=0,count=0;for(let y=Math.floor(part.h*lo);y<part.h*hi;y++)for(let x=0;x<part.w;x++)if(rgba[((part.y+y)*256+part.x+x)*4+3]){sx+=x;sy+=y;count++;}
    if(!count)throw Error('Empty landmark '+form);return {x:sx/count,y:sy/count};
   };
   for(const name of names.filter(n=>/upper|fore|thigh|calf/.test(n))){const p=parts[name];p.root=centroid(p,.03,.22);p.tip=centroid(p,.77,.95);}
   const b=parts.bow;b.grip=centroid(b,.46,.54);b.top=centroid(b,0,.06);b.bottom=centroid(b,.94,1);
   kits.push({form,parts,palette:means.map(c=>c.map(v=>v.toString(16).padStart(2,'0')).join('')),rgba:[...rgba],rowGuides,sourceSize:[img.width,img.height]});
  }
  return kits;
 },{input,names:PARTS});
 for(let i=0;i<kits.length;i++){
  const kit=kits[i],filename=kit.form+'-parts.png';fs.writeFileSync(path.join(out,filename),png(256,256,new Uint8ClampedArray(kit.rgba)));
  const retained=path.join(out,'sources',kit.form+'-master.png'),resolved=path.resolve(sources[i]),same=process.platform==='win32'?retained.toLowerCase()===resolved.toLowerCase():retained===resolved;
  if(!same)fs.copyFileSync(sources[i],retained);
  delete kit.rgba;kit.image=filename;kit.source='sources/'+kit.form+'-master.png';kit.sourceSha256=createHash('sha256').update(fs.readFileSync(sources[i])).digest('hex');
 }
 const manifest={version:1,coverage:{facing:'front-left three-quarter',directionCount:1,targetDirectionCount:8,forms:FORMS,gameIntegration:false,variantsReviewed:[]},cellSize:64,weaponHand:'right',drawHand:'left',forms:kits};
 fs.writeFileSync(path.join(out,'kits.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({forms:kits.map(k=>({form:k.form,parts:Object.keys(k.parts).length,colors:k.palette.length,sourceSize:k.sourceSize})),coverage:manifest.coverage}));
}finally{await browser.close();}
