// Import the generated art master into deterministic, binary-alpha 64px game cells.
// Browser Canvas is used only for decoding; the game stores palette-indexed pixels.
import fs from 'node:fs';
import {chromium} from 'playwright';
const dwarf=process.argv.includes('--dwarf');
const legacy=process.argv.includes('--legacy');
const stage=Number(process.argv.find(v=>v.startsWith('--stage='))?.split('=')[1]||0),stageName=['juvenile','mature','apex'][stage];
if(!stageName)throw new Error('Stage must be 0, 1, or 2');
const bodies=dwarf||process.argv.includes('--bodies'),families=process.argv.includes('--families'),ids=legacy?['feralfox','cat','rabbit','rodent','rhino','turtle','owl','fish','mushroom','mantis','clam','squid']:dwarf?['dwarf']:families?['lion','bear','stag','drake','beetle','bat','phoenix','rogue','frostelf','troll']:bodies?['wolf','mech','spider','jelly','serpent','harpy','moth','crab','centipede','dwarf','minotaur','skeleton']:['knight','orc','elf','caster','fox','goblin','fairy'],rows=families?[0,141,271,432,575,691,827,963,1096,1236,1402]:bodies?[0,120,237,340,453,586,723,867,978,1090,1218,1364,1536]:[0,183,345,508,681,854,1000,1174];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/chromium'),args:['--no-sandbox']});
try{
 const group=legacy?'legacy':families?'families':bodies?'bodies':'characters',suffix=stage?'-stage'+stage:'',moduleName=legacy?'authored-legacy':families?'authored-family':bodies?'authored-body':'authored-sprite',exportName=(legacy?'AUTHORED_LEGACY':families?'AUTHORED_FAMILIES':bodies?'AUTHORED_BODIES':'AUTHORED_SPRITES')+(stage?'_STAGE'+stage:'');
 const legacyRows=[[0,124,242,364,474,600,716,835,965,1077,1235,1365,1536],[0,132,247,401,525,645,761,895,1017,1139,1261,1385,1536],[0,130,252,396,494,612,723,841,964,1093,1230,1350,1536]][stage];
 const guides=stage?(families?(stage===1?[0,145,276,445,587,704,822,975,1110,1245,1402]:[0,147,274,444,578,704,815,973,1109,1243,1402]):bodies?(stage===1?[0,123,243,344,487,629,763,911,1012,1119,1247,1381,1536]:[0,125,243,345,483,627,759,914,1019,1119,1248,1382,1536]):stage===1?[0,195,374,552,727,895,1014,1174]:[0,193,356,529,701,863,1005,1174]):rows;
 const page=await browser.newPage(),source='data:image/png;base64,'+fs.readFileSync(`public/authored-${group}-${stageName}-source.png`).toString('base64');
 const artSource=dwarf?'data:image/png;base64,'+fs.readFileSync('public/authored-dwarf-lineage-source.png').toString('base64'):source;
 const result=await page.evaluate(async({source,ids,rows,stage,legacy})=>{
  const img=new Image();img.src=source;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const raw=ctx.getImageData(0,0,img.width,img.height).data,characters={};
  const rgb=(x,y)=>{if(x<0||y<0||x>=img.width||y>=img.height)return [0,0,0,0];const n=(y*img.width+x)*4;return [...raw.slice(n,n+4)];};
  if(legacy)rows=rows.map((guide,i)=>{if(!i||i===rows.length-1)return guide;let best=guide,cost=Infinity;for(let y=guide-12;y<=guide+12;y++){let density=0;for(let x=0;x<img.width;x++)if(rgb(x,y)[3]>=160)density++;const score=density+Math.abs(y-guide)*.08;if(score<cost){cost=score;best=y;}}return best;});
  for(let row=0;row<ids.length;row++){
   const columns=[0];
   for(let col=1;col<8;col++){
    const expected=col*img.width/8,spread=img.width/8*.55;let best=Math.round(expected),score=Infinity;
    for(let x=Math.max(columns.at(-1)+Math.round(img.width/24),Math.round(expected-spread));x<=Math.min(img.width-1,Math.round(expected+spread));x++){
     let density=0;for(let y=rows[row];y<rows[row+1];y++)for(let dx=-1;dx<=1;dx++)density+=rgb(x+dx,y)[3]>=160?1:0;
     const cost=density/3+Math.abs(x-expected)*.08;if(cost<score){best=x;score=cost;}
    }columns.push(best);
   }columns.push(img.width);
   const cells=[];for(let dir=0;dir<8;dir++){
    const sx=columns[dir],ex=columns[dir+1],sy=rows[row],ey=rows[row+1];let left=ex,right=sx,top=ey,bottom=sy;
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
   // Calibrate NE from the genuine NW back view. Generated NE columns often
   // repeat a front profile; a mirrored rear quarter preserves correct facing.
   let rear='';for(let y=0;y<64;y++)for(let x=63;x>=0;x--)rear+=frames[5].slice((y*64+x)*2,(y*64+x)*2+2);frames[7]=rear;
   if(legacy)for(const [target,from]of [[3,1],[4,0]]){let mirrored='';for(let y=0;y<64;y++)for(let x=63;x>=0;x--)mirrored+=frames[from].slice((y*64+x)*2,(y*64+x)*2+2);frames[target]=mirrored;}
   characters[ids[row]]={palette,frames,weaponless:true,stage,sourceColumns:columns,sourceRows:[rows[row],rows[row+1]]};
  }
  const out=document.createElement('canvas');out.width=512;out.height=ids.length*64;const draw=out.getContext('2d');for(let row=0;row<ids.length;row++)for(let dir=0;dir<8;dir++){const c=characters[ids[row]],data=new Uint8ClampedArray(16384);for(let i=0;i<4096;i++){const n=parseInt(c.frames[dir].slice(i*2,i*2+2),16);if(n){const color=c.palette[n];for(let k=0;k<3;k++)data[i*4+k]=parseInt(color.slice(k*2,k*2+2),16);data[i*4+3]=255;}}draw.putImageData(new ImageData(data,64,64),dir*64,row*64);}return {characters,image:out.toDataURL('image/png')};
 },{source:artSource,ids,rows:legacy?legacyRows:dwarf?[[0,287],[287,550],[550,896]][stage]:!stage?(families?[0,141,270,431,578,700,828,967,1109,1246,1402]:bodies?[0,122,242,347,455,594,733,855,964,1076,1214,1356,1536]:[0,191,350,534,707,872,1021,1174]):guides,stage,legacy});
 if(dwarf){
  // The supplied final column faces forward. Mirror the genuine rear-quarter
  // view to retain an actual NE back view rather than accepting false facings.
  const a=result.characters.dwarf;let back='';for(let y=0;y<64;y++)for(let x=63;x>=0;x--)back+=a.frames[5].slice((y*64+x)*2,(y*64+x)*2+2);a.frames[7]=back;
  const previous=await import('../'+moduleName+suffix+'-data.js');result.characters={...previous[exportName],...result.characters};
  result.image=await page.evaluate(characters=>{const out=document.createElement('canvas'),entries=Object.entries(characters);out.width=512;out.height=entries.length*64;const ctx=out.getContext('2d');entries.forEach(([id,a],row)=>{for(let dir=0;dir<8;dir++){const rgba=new Uint8ClampedArray(16384);for(let i=0;i<4096;i++){const n=parseInt(a.frames[dir].slice(i*2,i*2+2),16);if(n){const c=a.palette[n];for(let k=0;k<3;k++)rgba[i*4+k]=parseInt(c.slice(k*2,k*2+2),16);rgba[i*4+3]=255;}}ctx.putImageData(new ImageData(rgba,64,64),dir*64,row*64);}});return out.toDataURL('image/png');},result.characters);
 }
 fs.writeFileSync(moduleName+suffix+'-data.js','// Imported 64×64, binary-alpha, 48-color directional art. Rebuild with scripts/import-authored-sprites.mjs.\nexport const '+exportName+'='+JSON.stringify(result.characters)+';\n');
 fs.writeFileSync('public/'+(legacy?'authored-legacy':families?'authored-family':bodies?'authored-body':'authored-character')+suffix+'-idles.png',Buffer.from(result.image.split(',')[1],'base64'));
 console.log('Imported '+ids.length+' character identities, eight facings each, exact 64×64 cells.');
}finally{await browser.close();}
