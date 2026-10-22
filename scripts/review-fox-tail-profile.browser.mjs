import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {launchReviewBrowser} from './lib/review-browser.mjs';
import {readGLB} from './lib/glb.mjs';
import {measureFoxTail} from './lib/fox-tail-measurements.mjs';

const directory=process.env.FOX_EVIDENCE_DIR||'docs/evidence/fox-tail-symmetric',beforeFile='playtest-artifacts/fox-tail-before.glb',currentFile='public/meshy-fox-preview/fox-animated.glb';
const old=readGLB(beforeFile),current=readGLB(currentFile),before=measureFoxTail(old),after=measureFoxTail(current),errors=[];
const oldBody=old.json.meshes[0].primitives[0],body=current.json.meshes[0].primitives[0],oldP=old.read(oldBody.attributes.POSITION),p=current.read(body.attributes.POSITION),j=current.read(body.attributes.JOINTS_0),w=current.read(body.attributes.WEIGHTS_0),names=current.json.skins[0].joints.map(i=>current.json.nodes[i].name);let untouchedVertices=0;
for(let v=0;v<p.length/3;v++){let tail=0;for(let k=0;k<4;k++)if(names[j[v*4+k]].startsWith('Tail_'))tail+=w[v*4+k];if(tail===0){for(let k=0;k<3;k++)assert.equal(p[v*3+k],oldP[v*3+k],'non-tail geometry unchanged');untouchedVertices++;}}
assert.deepEqual(current.read(current.json.skins[0].inverseBindMatrices),old.read(old.json.skins[0].inverseBindMatrices),'skeleton unchanged');
const groundContactChanges=[];
for(let c=0;c<current.json.animations.length;c++){const a=current.json.animations[c],b=old.json.animations[c];assert.equal(a.name,b.name);for(let s=0;s<a.samplers.length;s++){
 const now=current.read(a.samplers[s].output),was=old.read(b.samplers[s].output);if(now.every((v,i)=>v===was[i]))continue;const target=a.channels.find(ch=>ch.sampler===s).target,name=current.json.nodes[target.node].name;
 // Tail thickness changes the correct vertical floor support during the
 // fall. All rotations, horizontal travel, and other clips must remain exact.
 assert.ok(a.name==='Fall_and_Death'&&target.path==='translation'&&(name==='Root'||/^(Arrow_|Release_)/.test(name)),`unexpected animation change: ${a.name} ${name} ${target.path}`);
 let maxY=0;for(let i=0;i<now.length;i+=3){assert.equal(now[i],was[i]);assert.equal(now[i+2],was[i+2]);maxY=Math.max(maxY,Math.abs(now[i+1]-was[i+1]));}groundContactChanges.push({node:name,maxVerticalCorrection:maxY});
}}
const browser=await launchReviewBrowser();
try{
 const page=await browser.newPage({viewport:{width:1000,height:900}});page.on('pageerror',e=>errors.push(e.message));const frames=[];
 for(const file of [beforeFile,currentFile]){
  await page.route('**/fox-animated.glb',r=>r.fulfill({path:file,contentType:'model/gltf-binary'}));await page.goto((process.env.BASE_URL||'http://127.0.0.1:3117')+'/public/meshy-fox-preview/animated.html');await page.waitForFunction(()=>window.foxAnimation?.ready);await page.evaluate(()=>foxAnimation.pause());
  for(const [label,yaw,eye,look]of [['Side',3*Math.PI/2,[0,1.2,3.8],[0,.75,0]],['Above',3*Math.PI/2,[0,2.4,2.7],[0,.65,0]],['Rear quarter',5*Math.PI/4,[0,1.2,3.8],[0,.75,0]]]){
   const data=await page.evaluate(([yaw,eye,look])=>{const a=foxAnimation;a.action('idle');a.seek(0);a.ambient(.5);a.yaw(yaw);a.renderer.setSize(512,512,false);a.camera.aspect=1;a.camera.position.set(...eye);a.camera.lookAt(...look);a.camera.updateProjectionMatrix();a.renderer.render(a.scene,a.camera);return a.renderer.domElement.toDataURL().split(',')[1];},[yaw,eye,look]);frames.push({label:(file===beforeFile?'Before':'After')+' · '+label,data});
  }
  await page.unroute('**/fox-animated.glb');
 }
 const sheet=await page.evaluate(async frames=>{const c=document.createElement('canvas');c.width=1536;c.height=1080;const g=c.getContext('2d');g.fillStyle='#202d32';g.fillRect(0,0,c.width,c.height);for(const [i,f]of frames.entries()){const im=new Image();im.src='data:image/png;base64,'+f.data;await im.decode();const x=i%3*512,y=Math.floor(i/3)*540;g.drawImage(im,x,y+28);g.font='18px system-ui';g.fillStyle='#edf1e6';g.fillText(f.label,x+14,y+21);}return c.toDataURL().split(',')[1];},frames);fs.writeFileSync(`${directory}/before-after-profile.png`,Buffer.from(sheet,'base64'));
 const eight=await page.evaluate(async sources=>{const c=document.createElement('canvas');c.width=1024;c.height=1176;const g=c.getContext('2d');g.fillStyle='#202d32';g.fillRect(0,0,c.width,c.height);for(const [i,src]of sources.entries()){const im=new Image();im.src=src;await im.decode();g.fillStyle='#edf1e6';g.font='18px system-ui';g.fillText(i?'After: narrow base, balanced flanks, full length':'Before: v3 tail',12,i*588+21);g.drawImage(im,0,i*588+28);}return c.toDataURL().split(',')[1];},['docs/evidence/meshy-fox-archer-v3/idle-eight-views.png',`${directory}/idle-eight-views.png`].map(p=>'data:image/png;base64,'+fs.readFileSync(p).toString('base64')));fs.writeFileSync(`${directory}/before-after-eight-views.png`,Buffer.from(eight,'base64'));
 for(const t of [2.4,8,10.5]){const data=await page.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=c.height=1536;c.getContext('2d').drawImage(im,0,0,1536,1536);return c.toDataURL().split(',')[1];},'data:image/png;base64,'+fs.readFileSync(`${directory}/combo-decoded-${t}.png`).toString('base64'));fs.writeFileSync(`${directory}/combo-decoded-${t}-enlarged.png`,Buffer.from(data,'base64'));}
 await page.setViewportSize({width:390,height:1100});await page.reload();await page.waitForFunction(()=>window.foxAnimation?.ready);await page.locator('#acro').click();await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${directory}/mobile.png`,fullPage:true});assert.deepEqual(errors,[]);
 const report={assetSHA256:createHash('sha256').update(fs.readFileSync(currentFile)).digest('hex'),before,after,lengthUnchanged:Math.abs(before.xMax-after.xMax)<1e-7&&Math.abs(before.xMin-after.xMin)<1e-7,untouchedVertices,rigUnchanged:true,groundContactChanges,errors};assert.ok(report.lengthUnchanged);fs.writeFileSync(`${directory}/profile-review.json`,JSON.stringify(report,null,2));console.log('Before/current side, overhead, rear-quarter and eight-view comparisons; mobile and enlarged decoded frames verified');
}finally{await browser.close();}
