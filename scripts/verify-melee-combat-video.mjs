import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {fingerprint,runtimeFiles,hashFile} from './animation-contract.mjs';
const root=process.argv.find(a=>a.startsWith('--review='))?.slice(9)||'public/melee-arm-review',folder=root+'/combat',out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/melee-arms/decoded-individual';fs.mkdirSync(out,{recursive:true});
const inputs=fingerprint([...runtimeFiles(),'Starfall-Menagerie.html','Starfall-Training-Glade.html','public/prototype-bundle.js']);
const reports=fs.readdirSync(folder).filter(n=>/^report(?:-.*)?\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(folder+'/'+n))).filter(r=>r.cases.every(c=>c.captureVersion===2)&&JSON.stringify(r.inputs)===JSON.stringify(inputs));
const records=(reports.find(r=>r.cases.length===104)?[reports.find(r=>r.cases.length===104)]:reports).flatMap(r=>r.cases);
assert.equal(records.length,104);assert.equal(new Set(records.map(c=>c.name)).size,104);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)}),decoded=[];
try{
 const page=await browser.newPage({viewport:{width:1600,height:1200}}),base=process.env.REVIEW_URL||'http://127.0.0.1:3050';await page.goto(base+'/sheets/manifest.json');
 for(let start=0;start<records.length;start+=2){
  const cases=records.slice(start,start+2);for(const c of cases)assert.equal(hashFile(folder+'/'+c.name+'.mp4'),c.videoHash);
  const result=await page.evaluate(async({cases,base})=>{
   document.body.innerHTML='';document.body.style.cssText='background:#183139;display:grid;grid-template-columns:repeat(4,360px);gap:8px';
   const players=await Promise.all(cases.map(async c=>{
    const v=document.createElement('video');v.style.width='360px';v.muted=true;v.preload='auto';v.playsInline=true;v.src=base+'/combat/'+c.name+'.mp4';document.body.append(v);
    await new Promise((resolve,reject)=>{v.oncanplaythrough=resolve;v.onerror=()=>reject(Error(c.name+': video asset error'));});
    if(v.videoWidth!==672||v.videoHeight!==256||Math.abs(v.duration-c.duration)>.1)throw Error(c.name+': wrong video dimensions/duration');
    return {c,v};
   }));
   // Finish initial decoding and the first GPU readback BEFORE starting
   // playback. Otherwise loading the next player drops startup frames in
   // the already playing clip, which measures the harness rather than it.
   for(const {v}of players){const warm=document.createElement('canvas');warm.width=warm.height=64;const x=warm.getContext('2d');x.drawImage(v,344,64,64,64,0,0,64,64);x.getImageData(0,0,64,64);}
   return await Promise.all(players.map(({c,v})=>new Promise(async(resolve,reject)=>{
    let frames=0,last=0,maxGap=0;const images=[],seconds=[1,3,5],timer=setTimeout(()=>reject(Error(c.name+': decoding did not finish')),15000);
    v.onerror=()=>reject(Error(c.name+': video asset error'));
    const frame=(_now,metadata)=>{
     frames++;maxGap=Math.max(maxGap,metadata.mediaTime-last);last=metadata.mediaTime;
     if(images.length<seconds.length&&metadata.mediaTime>=seconds[images.length]){
      const canvas=document.createElement('canvas');canvas.width=216;canvas.height=168;const x=canvas.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#183139';x.fillRect(0,0,216,168);
      x.drawImage(v,344,64,64,64,0,24,144,144);x.drawImage(v,344,64,64,64,148,100,64,64);x.fillStyle='#e7dfc2';x.font='10px monospace';x.fillText(c.name,0,10);x.fillText(metadata.mediaTime.toFixed(2)+'s / 1x decoded',0,22);
      images.push({second:seconds[images.length],mediaTime:metadata.mediaTime,png:canvas.toDataURL().split(',')[1]});
     }
     if(!v.ended)v.requestVideoFrameCallback(frame);
    };
    v.requestVideoFrameCallback(frame);v.onended=()=>{clearTimeout(timer);resolve({name:c.name,playbackRate:v.playbackRate,frames,maxGap,images,duration:v.duration});};await v.play();
   })));
  },{cases,base});
  for(const r of result){
   assert.equal(r.playbackRate,1);assert.equal(r.images.length,3);assert.ok(r.frames>48,r.name+': decoded changing frames');assert.ok(r.maxGap<.3,`${r.name}: ${r.frames} presentations, largest media gap ${r.maxGap.toFixed(3)}s`);
   for(const i of r.images)fs.writeFileSync(`${out}/${r.name}-${i.second}.png`,Buffer.from(i.png,'base64'));
   decoded.push({...r,images:r.images.map(({png,...rest})=>rest)});
  }
  console.log(`Normal-speed individual combat decoded ${decoded.length}/104; native and enlarged captures saved.`);
 }
}finally{await browser.close();}
fs.mkdirSync(root+'/checks',{recursive:true});fs.writeFileSync(root+'/checks/individual-decoded.json',JSON.stringify({status:'passed',inputs,playbackRate:1,cases:decoded},null,2)+'\n');
