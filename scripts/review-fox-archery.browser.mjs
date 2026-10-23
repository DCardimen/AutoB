import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {launchReviewBrowser} from './lib/review-browser.mjs';

// Eight-facing sheets (S, SE, E, NE, N, NW, W, SW) of the archery set at its
// key moments, and the full draw before and after: BEFORE_GLB names the prior
// asset, whose retargeted Bow_Attack reaches full draw at 1.12 s.
const directory=process.env.BIPED_REVIEW_OUT||'docs/evidence/fox-next-level',before=process.env.BEFORE_GLB;
fs.mkdirSync(directory,{recursive:true});
const SHEETS=[['Bow_Ready',[0]],['Bow_Draw',[.13,.26]],['Bow_Release',[.03,.12]],['Bow_Reload',[.08,.15,.3,.45]],['Bow_Nock',[.15]],['Bow_Ready_Enter',[.12,.24,.45]],['Bow_Ready_Exit',[.2,.45]],['Victory',[.5,1.0]]];
const root=path.resolve('public/meshy-fox-preview');let glb=path.resolve(root,'fox-biped.glb');
const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://x').pathname,file=p.endsWith('fox-biped.glb')?glb:path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep)&&file!==glb){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await launchReviewBrowser();
async function sheet(clip,times,out){
 const page=await browser.newPage({viewport:{width:800,height:600}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/biped.html`);await page.waitForFunction(()=>window.foxBiped?.ready,null,{timeout:180000});
 const data=await page.evaluate(([clip,times])=>{const a=foxBiped;a.pause();const size=280,c=document.createElement('canvas');c.width=size*8;c.height=(size+22)*times.length;const g=c.getContext('2d');
  a.renderer.setPixelRatio(1);a.renderer.setSize(size,size,false);a.camera.aspect=1;a.camera.fov=26;a.camera.updateProjectionMatrix();a.controls.enabled=false;
  for(const [r,t]of times.entries())for(let f=0;f<8;f++){a.action(clip);a.pause();a.yaw(f*Math.PI/4);a.seek(t);a.camera.position.set(0,.9,3.5);a.camera.lookAt(0,.55,0);a.renderer.render(a.scene,a.camera);const x=f*size,y=r*(size+22);g.fillStyle='#202d32';g.fillRect(x,y,size,size+22);g.drawImage(a.renderer.domElement,x,y+22);g.fillStyle='white';g.font='13px system-ui';g.fillText(`${clip} ${t}s · ${['S','SE','E','NE','N','NW','W','SW'][f]}`,x+6,y+15);}
  return c.toDataURL().split(',')[1];},[clip,times]);
 fs.writeFileSync(out,Buffer.from(data,'base64'));await page.close();if(errors.length)throw Error(errors.join('\n'));
}
try{
 for(const [clip,times]of SHEETS)await sheet(clip,times,`${directory}/${clip}-eight-views.png`);
 await sheet('Bow_Draw',[.26],`${directory}/draw-after-eight-views.png`);
 if(before){glb=path.resolve(before);await sheet('Bow_Attack',[1.12],`${directory}/draw-before-eight-views.png`);}
 console.log('sheets',SHEETS.length+(before?2:1));
}finally{await browser.close();await new Promise(r=>server.close(r));}
