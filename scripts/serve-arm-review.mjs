import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Review movies need byte ranges for reliable native-player scrubbing.
const folder=process.argv.includes('--review=torso-fill')?'torso-fill-review':'arm-animation-review';
const root=fileURLToPath(new URL('../public/'+folder+'/',import.meta.url));
const port=Number(process.argv.find(a=>a.startsWith('--port='))?.slice(7)||3048);
const types={'.html':'text/html; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.png':'image/png','.mp4':'video/mp4','.webm':'video/webm'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404);res.end();return;}
  let start=0,end=stat.size-1;const range=req.headers.range;
  if(range){
   const match=range.match(/^bytes=(\d*)-(\d*)$/);
   if(!match||!match[1]&&!match[2]){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
   if(!match[1])start=Math.max(0,stat.size-Number(match[2]));
   else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
   if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
  }
  res.writeHead(range?206:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache',...(range?{'Content-Range':`bytes ${start}-${end}/${stat.size}`}:{})});
  if(req.method==='HEAD'){res.end();return;}
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });
}).listen(port,'127.0.0.1',()=>console.log(`Arm animation review: http://127.0.0.1:${port}`));
