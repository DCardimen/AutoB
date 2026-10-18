import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {authoredIdentities} from '../authored-sprite-renderer.js';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {png} from './animation-artifacts.mjs';
import {runtimeFiles,fingerprint,verifiedVideo,acquireLock,validateVideoManifest} from './animation-contract.mjs';

const out=path.resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/companion-animation');fs.mkdirSync(out,{recursive:true});
const evolutionPath=process.argv.includes('--path=warden')?'warden':'wild';
const identities=process.argv.includes('--families=melee')?authoredIdentities.filter(id=>MELEE_ARM_FAMILIES.has(id)):process.argv.includes('--families=arms')?authoredIdentities.filter(id=>ARM_ANATOMY[id]):authoredIdentities;
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputs=fingerprint([...runtimeFiles(),'scripts/review-companion-animation.mjs','scripts/animation-artifacts.mjs','scripts/animation-contract.mjs']);
const lock=path.join(out,'encoding.lock');
const release=acquireLock(lock);process.on('exit',release);let encoder;
try{
if(!process.argv.includes('--force')&&verifiedVideo(out,inputs)?.evolutionPath===evolutionPath&&verifiedVideo(out,inputs)?.families===identities.length){console.log('Verified complete coverage, unchanged animation inputs and encoded video hash; reusing the review.');release();process.exit(0);}
const fps=12,width=960,height=Math.ceil(identities.length/4)*88+32,background=[24,49,57,255];
const states=[['idle',24],['walk',16],['run',12],['sprint',10],['turn',12],['stop',12],['attack',16],['slash',16],['charge',16],['cast',16],['dash',12],['dodge',12],['hit',12],['stagger',12],['knockdown',16],['getup',16],['death',16]];
const specs=identities.map(identity=>PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===(identity==='fairy'?'faerie':identity)&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===(identity==='fairy'?'faerie':identity)));
const positions=specs.map((spec,i)=>({identity:identities[i],id:spec.id,x:i%4*240,y:Math.floor(i/4)*88+32,forms:[0,1,2].map(stage=>({stage,x:i%4*240+stage*72+8,y:Math.floor(i/4)*88+48}))}));
const blank=new Uint8ClampedArray(width*height*4);for(let i=0;i<width*height;i++)blank.set(background,i*4);
// Titles are supplied by the HTML review player; the movie keeps every
// sprite at its exact 64px native size without browser recording drops.
const pending=path.join(out,'all-companions.pending.mp4');
encoder=spawn(process.env.FFMPEG_PATH||'ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s',`${width}x${height}`,'-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','15','-pix_fmt','yuv420p','-movflags','+faststart',pending],{windowsHide:true});
let stderr='',failure;encoder.stderr.on('data',d=>stderr+=d);encoder.stdin.on('error',error=>{failure=error;});
const completed=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(Error(stderr||`FFmpeg exited ${code}`)));});completed.catch(()=>{});
await once(encoder,'spawn');
let frame=0,armChecks=0;const timeline=[],clipped=[],armFailures=[];
for(let dir=0;dir<8;dir++)for(const [state,count]of states){
 const start=frame/fps;
 for(let f=0;f<count;f++){
  if(failure)throw failure;
  const rgba=blank.slice(),phase=f/count;
  for(let i=0;i<specs.length;i++)for(const location of positions[i].forms){
   const rig=nativePoseRig(specs[i],{id:specs[i].id,evolution:location.stage,evolutionPath},state,phase);rig.artStage=location.stage;const pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
   if(pixels.artStage!==location.stage)throw Error('Review art stage differs from its label: '+positions[i].identity);
   if(pixels.clipped)clipped.push({identity:positions[i].identity,stage:location.stage,state,phase,dir,clipped:pixels.clipped});
   for(const arm of rig.arms){
    const profile=rig.artArmSkin?.art.profiles.get(rig.artArmScreens[arm.side]);if(!profile)throw Error('Unregistered procedural arm in '+positions[i].identity);
    const points=[rig.artProject(arm.root),rig.artProject(arm.joint),rig.artProject(arm.end)],source=[profile.root,profile.joint,profile.end],scale=rig.artCreatureFit*(rig.artArmSkin.scale.width+rig.artArmSkin.scale.height)/2;
    for(let part=0;part<2;part++){armChecks++;const actual=Math.hypot(points[part+1].x-points[part].x,points[part+1].y-points[part].y),expected=Math.hypot(source[part+1].x-source[part].x,source[part+1].y-source[part].y)*scale;if(Math.abs(actual-expected)>1e-6)armFailures.push({identity:positions[i].identity,stage:location.stage,state,phase,dir,side:arm.side,part,actual,expected});}
   }
   for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=(y*64+x)*4;if(pixels[n+3])rgba.set(pixels.subarray(n,n+4),((location.y+y)*width+location.x+x)*4);}
  }
  if(f===Math.floor(count*.4)&&dir===1)fs.writeFileSync(path.join(out,`${state}-native.png`),png(width,height,rgba));
  if(!encoder.stdin.write(Buffer.from(rgba.buffer,rgba.byteOffset,rgba.byteLength)))await Promise.race([once(encoder.stdin,'drain'),completed.then(()=>{throw Error('Encoder closed before all frames were written');})]);frame++;
 }
 timeline.push({dir,state,start,end:frame/fps});
 console.log(`Animation review ${dir}/7 ${state}: ${frame} frames`);
}
encoder.stdin.end();await completed;
if(clipped.length)throw Error(`${clipped.length} clipped poses; review is unfinished`);
if(armFailures.length){fs.writeFileSync(path.join(out,'arm-failures.json'),JSON.stringify(armFailures,null,2)+'\n');throw Error(`${armFailures.length} stretched arm segments in the full movie cycles; review is unfinished`);}
fs.writeFileSync(path.join(out,'arm-failures.json'),'[]\n');
fs.renameSync(pending,path.join(out,'all-companions.mp4'));
const manifest={schema:1,inputs,evolutionPath,videoHash:hash(path.join(out,'all-companions.mp4')),fps,width,height,duration:frame/fps,frames:frame,renderedPoses:frame*specs.length*3,families:identities.length,forms:3,directions:8,states:states.map(([state])=>state),positions,timeline,clipped,armChecks,armFailures};
validateVideoManifest(manifest);
fs.writeFileSync(path.join(out,'video-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><meta charset="utf-8"><title>Companion animation review</title><style>body{background:#10262d;color:#e7dfc2;font:14px system-ui;margin:20px}video,canvas{image-rendering:pixelated}video{width:960px;max-width:100%}canvas{border:1px solid #6eafb2}label{display:block;margin:12px 0}#labels{position:absolute;inset:0;pointer-events:none}#labels span{position:absolute;font:10px monospace}.movie{position:relative;width:960px}select{padding:8px;background:#183139;color:inherit}a{color:#9ddcda}</style><h1>${identities.length} families · 3 forms · 8 facings</h1><p>Native 64px sprites. The 3× view below follows the selected family. Playback is normal speed; every encoded frame was rendered, without recording drops.</p><div class="movie"><video controls muted src="all-companions.mp4"></video><div id="labels"></div></div><label>Enlarged family <select id="family"></select></label><canvas width="576" height="192"></canvas><p id="pose"></p><script>const m=${JSON.stringify(manifest)},video=document.querySelector('video'),c=document.querySelector('canvas').getContext('2d'),select=document.querySelector('select');c.imageSmoothingEnabled=false;m.positions.forEach((p,i)=>{select.add(new Option(p.identity,i));const e=document.createElement('span');e.textContent=p.identity+' / base · mature · apex';e.style.left=p.x+8+'px';e.style.top=p.y+'px';labels.append(e)});function draw(){const p=m.positions[select.value||0];c.clearRect(0,0,576,192);p.forms.forEach((f,i)=>c.drawImage(video,f.x,f.y,64,64,i*192,0,192,192));const pose=m.timeline.find(s=>video.currentTime>=s.start&&video.currentTime<s.end);document.querySelector('#pose').textContent=pose?pose.state+' / '+['E','SE','S','SW','W','NW','N','NE'][pose.dir]+' / '+video.currentTime.toFixed(2)+'s':'';requestAnimationFrame(draw)}video.addEventListener('loadeddata',draw);</script>`);
console.log(`Saved ${frame/fps}s normal-speed video: ${manifest.renderedPoses} poses, no clipped pixels.`);
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();release();}
