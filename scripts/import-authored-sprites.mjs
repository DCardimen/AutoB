// Import the generated art master into deterministic, binary-alpha 64px game cells.
// Browser Canvas is used only for decoding; the game stores palette-indexed pixels.
import fs from 'node:fs';
import {chromium} from 'playwright';
const bodies=process.argv.includes('--bodies'),families=process.argv.includes('--families'),ids=families?['lion','bear','stag','drake','beetle','bat','phoenix','rogue','frostelf','troll']:bodies?['wolf','mech','spider','jelly','serpent','harpy','moth','crab','centipede','dwarf','minotaur','skeleton']:['knight','orc','elf','caster','fox','goblin','fairy'],rows=families?[0,141,271,432,575,691,827,963,1096,1236,1402]:bodies?[0,120,237,340,453,586,723,867,978,1090,1218,1364,1536]:[0,183,345,508,681,854,1000,1174];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage(),source='data:image/png;base64,'+fs.readFileSync(families?'public/authored-families-source.png':bodies?'public/authored-bodies-source.png':'public/authored-characters-source.png').toString('base64');
 const result=await page.evaluate(async({source,ids,rows})=>{
  const img=new Image();img.src=source;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const raw=ctx.getImageData(0,0,img.width,img.height).data,characters={};
  const rgb=(x,y)=>{if(x<0||y<0||x>=img.width||y>=img.height)return [0,0,0,0];const n=(y*img.width+x)*4;return [...raw.slice(n,n+4)];};
  for(let row=0;row<ids.length;row++){
   const cells=[];for(let dir=0;dir<8;dir++){
    const sx=Math.round(dir*img.width/8),ex=Math.round((dir+1)*img.width/8),sy=rows[row],ey=rows[row+1];let left=ex,right=sx,top=ey,bottom=sy;
    for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++)if(rgb(x,y)[3]>=160){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const scale=Math.min(44/(bottom-top+1),(row===6?54:46)/(right-left+1)),width=Math.ceil((right-left+1)*scale),height=Math.ceil((bottom-top+1)*scale),ox=Math.round(32-width/2),oy=45-height,pixels=Array.from({length:4096},()=>null);
    for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
     const samples=[];for(const dy of [.2,.5,.8])for(const dx of [.2,.5,.8]){const c=rgb(Math.floor(left+(xx+dx)/scale),Math.floor(top+(yy+dy)/scale));if(c[3]>=160)samples.push(c);}
     if(samples.length<4)continue;const color=[0,1,2].map(k=>Math.round(samples.reduce((n,c)=>n+c[k],0)/samples.length));pixels[(oy+yy)*64+ox+xx]=color;
    }
    // Drop detached edge specks; silhouettes and held gear remain connected.
    const seen=new Set(),groups=[];for(let n=0;n<4096;n++)if(pixels[n]&&!seen.has(n)){const queue=[n],group=[];seen.add(n);for(let i=0;i<queue.length;i++){const q=queue[i];group.push(q);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const x=q%64+dx,y=Math.floor(q/64)+dy,k=y*64+x;if(x>=0&&x<64&&y>=0&&y<64&&pixels[k]&&!seen.has(k)){seen.add(k);queue.push(k);}}}groups.push(group);}const main=Math.max(...groups.map(g=>g.length));for(const group of groups)if(group.length<Math.max(4,main*.04))for(const k of group)pixels[k]=null;
    cells.push(pixels);
   }
   // A bounded palette shared across all directions preserves material identity.
   const colors=new Map();for(const cell of cells)for(const c of cell)if(c){const key=c.map(v=>Math.round(v/12)*12).join(',');colors.set(key,(colors.get(key)||0)+1);}
   let means=[...colors].sort((a,b)=>b[1]-a[1]).slice(0,48).map(([key])=>key.split(',').map(Number));
   const closest=c=>{let best=0,distance=Infinity;for(let i=0;i<means.length;i++){const d=c.reduce((n,v,k)=>n+(v-means[i][k])**2,0);if(d<distance){distance=d;best=i;}}return best;};
   for(let pass=0;pass<6;pass++){const groups=means.map(()=>({sum:[0,0,0],n:0}));for(const cell of cells)for(const c of cell)if(c){const g=groups[closest(c)];g.n++;c.forEach((v,k)=>g.sum[k]+=v);}means=means.map((c,i)=>groups[i].n?groups[i].sum.map(v=>Math.round(v/groups[i].n)):c);}
   const palette=['000000',...means.map(c=>c.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join(''))],frames=cells.map(cell=>cell.map(c=>(c?closest(c)+1:0).toString(16).padStart(2,'0')).join(''));
   characters[ids[row]]={palette,frames};
  }
  const out=document.createElement('canvas');out.width=512;out.height=ids.length*64;const draw=out.getContext('2d');for(let row=0;row<ids.length;row++)for(let dir=0;dir<8;dir++){const c=characters[ids[row]],data=new Uint8ClampedArray(16384);for(let i=0;i<4096;i++){const n=parseInt(c.frames[dir].slice(i*2,i*2+2),16);if(n){const color=c.palette[n];for(let k=0;k<3;k++)data[i*4+k]=parseInt(color.slice(k*2,k*2+2),16);data[i*4+3]=255;}}draw.putImageData(new ImageData(data,64,64),dir*64,row*64);}return {characters,image:out.toDataURL('image/png')};
 },{source,ids,rows});
 fs.writeFileSync(families?'authored-family-data.js':bodies?'authored-body-data.js':'authored-sprite-data.js','// Imported 64×64, binary-alpha, 48-color directional art. Rebuild with scripts/import-authored-sprites.mjs.\nexport const '+(families?'AUTHORED_FAMILIES':bodies?'AUTHORED_BODIES':'AUTHORED_SPRITES')+'='+JSON.stringify(result.characters)+';\n');
 fs.writeFileSync(families?'public/authored-family-idles.png':bodies?'public/authored-body-idles.png':'public/authored-character-idles.png',Buffer.from(result.image.split(',')[1],'base64'));
 console.log('Imported '+ids.length+' character identities, eight facings each, exact 64×64 cells.');
}finally{await browser.close();}
