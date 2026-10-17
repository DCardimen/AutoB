import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {png} from '../../../scripts/animation-artifacts.mjs';
import {hashFile,validateVideoManifest} from '../../../scripts/animation-contract.mjs';
const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/animation-quality/video'),m=validateVideoManifest(JSON.parse(fs.readFileSync(path.join(out,'video-manifest.json'),'utf8'))),movie=path.join(out,'all-companions.mp4');
assert.equal(hashFile(movie),m.videoHash);const folder=path.join(out,'sequences');fs.mkdirSync(folder,{recursive:true});
const subjects=[['feralfox','walk'],['drake','walk'],['troll','attack'],['dwarf','attack'],['minotaur','attack'],['minotaur','death'],['fairy','death'],['serpent','death'],['mushroom','idle'],['knight','cast']],results=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{const page=await browser.newPage();for(const [identity,state]of subjects)for(const dir of [1,6]){
 const segment=m.timeline.find(s=>s.state===state&&s.dir===dir),position=m.positions.find(p=>p.identity===identity),start=Math.round(segment.start*m.fps),count=Math.round((segment.end-segment.start)*m.fps),[origin]=position.forms,width=208,height=64,frameSize=width*height*4;
 const filter=`select=between(n\\,${start}\\,${start+count-1}),crop=${width}:${height}:${origin.x}:${origin.y}`;
 const decoded=spawnSync(process.env.FFMPEG_PATH||'ffmpeg',['-v','error','-i',movie,'-vf',filter,'-frames:v',String(count),'-vsync','0','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{windowsHide:true,maxBuffer:frameSize*(count+1),timeout:30000});assert.equal(decoded.status,0,decoded.stderr?.toString());assert.equal(decoded.stdout.length,frameSize*count,'all encoded cycle frames decoded');
 const cells=[];for(let stage=0;stage<3;stage++)for(let frame=0;frame<count;frame++){
  const rgba=new Uint8ClampedArray(64*64*4),x=position.forms[stage].x-origin.x;
  for(let y=0;y<64;y++){const offset=frame*frameSize+(y*width+x)*4;rgba.set(decoded.stdout.subarray(offset,offset+256),y*256);}
  cells.push({stage,frame,png:png(64,64,rgba).toString('base64')});
 }
 const data=await page.evaluate(async({identity,state,dir,count,cells})=>{const rows=Math.ceil(count/8),canvas=document.createElement('canvas');canvas.width=1536;canvas.height=rows*3*210;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#183139';c.fillRect(0,0,canvas.width,canvas.height);for(const cell of cells){const img=new Image();img.src='data:image/png;base64,'+cell.png;await img.decode();const x=cell.frame%8*192,y=(cell.stage*rows+Math.floor(cell.frame/8))*210;c.drawImage(img,x,y+17,192,192);c.fillStyle='#e7dfc2';c.font='10px monospace';c.fillText(identity+' '+state+' dir '+dir+' s'+cell.stage+' f'+cell.frame,x+2,y+12);}return canvas.toDataURL().split(',')[1];},{identity,state,dir,count,cells});
 const file=`${identity}-${state}-${dir}.png`;fs.writeFileSync(path.join(folder,file),Buffer.from(data,'base64'));results.push({identity,state,dir,frames:count,startFrame:start,file,sha256:hashFile(path.join(folder,file))});console.log(file+': '+count+' actual decoded frames per form');
}}finally{await browser.close();}
fs.writeFileSync(path.join(folder,'cycles.json'),JSON.stringify({videoHash:m.videoHash,fps:m.fps,status:'passed',cycles:results},null,2)+'\n');
