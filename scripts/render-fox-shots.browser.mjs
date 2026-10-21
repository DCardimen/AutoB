import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {launchReviewBrowser} from './lib/review-browser.mjs';

// Renders chosen clip moments from chosen cameras into one labelled sheet, for
// close inspection while tuning (tail against the tunic, eyelids, grips).
// Usage: node scripts/render-fox-shots.browser.mjs shots.json out.png
// shots.json: [{mode,t,yaw?,eye:[x,y,z],look:[x,y,z],fov?,label?,ambient?,target?:[x,y,z]}]
const [shotsFile,output,size=320]=process.argv.slice(2),shots=JSON.parse(fs.readFileSync(shotsFile,'utf8'));
const root=path.resolve('public/meshy-fox-preview');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await launchReviewBrowser();
try{
 const page=await browser.newPage({viewport:{width:900,height:700}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/animated.html`);await page.waitForFunction(()=>window.foxAnimation?.ready);
 const image=await page.evaluate(async([shots,size])=>{
  const a=foxAnimation,{renderer,camera,scene}=a,cols=Math.min(4,shots.length),out=document.createElement('canvas');out.width=cols*size;out.height=Math.ceil(shots.length/cols)*(size+22);
  const c=out.getContext('2d');c.fillStyle='#202d32';c.fillRect(0,0,out.width,out.height);a.pause();renderer.setSize(size,size,false);
  for(const [i,s]of shots.entries()){
   a.track(0,false);a.travel(false);a.action(s.mode);a.yaw(s.yaw||0);if(s.target)a.target(s.target);a.seek(s.t);if(s.ambient!==undefined)a.ambient(s.ambient);
   // Optional bone overrides (Euler XYZ in the parent frame) for trying poses.
   if(s.bones){for(const [name,e]of Object.entries(s.bones))a.model.getObjectByName(name).rotation.set(...e);a.model.updateMatrixWorld(true);for(const m of a.meshes)if(m.isSkinnedMesh)m.skeleton.update();}
   camera.fov=s.fov||34;camera.aspect=1;camera.position.set(...s.eye);camera.lookAt(...s.look);camera.updateProjectionMatrix();renderer.render(scene,camera);
   const x=i%cols*size,y=Math.floor(i/cols)*(size+22);c.drawImage(renderer.domElement,x,y+22);c.font='13px system-ui';c.fillStyle='#edf1e6';c.fillText(s.label||`${s.mode} ${s.t}`,x+6,y+15);
  }
  return out.toDataURL().split(',')[1];
 },[shots,Number(size)]);
 fs.writeFileSync(output,Buffer.from(image,'base64'));if(errors.length)console.error(errors);console.log(output);
}finally{await browser.close();await new Promise(r=>server.close(r));}
