import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const hashFile=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const runtimeFiles=()=>fs.readdirSync('.').filter(file=>file.endsWith('.js')&&file!=='expedition.js').sort();
export const fingerprint=files=>Object.fromEntries(files.map(file=>[file,hashFile(file)]));
export const states=['idle','walk','run','sprint','turn','stop','attack','slash','charge','cast','dash','dodge','hit','stagger','knockdown','getup','death'];
export const stages=[
 {id:1,name:'Anatomy inventory'},
 {id:2,name:'Part separation'},
 {id:3,name:'Sockets and grips'},
 {id:4,name:'Locomotion'},
 {id:5,name:'Head, torso and secondary motion'},
 {id:6,name:'Actions and contact'},
 {id:7,name:'Delivery and reproduction'},
];
export function validateVideoManifest(m){
 assert.ok(m&&m.fps>0&&m.width>0&&m.height>0);
 assert.equal(m.forms,3);assert.equal(m.directions,8);assert.deepEqual(m.states,states);
 assert.equal(m.positions.length,m.families);assert.equal(new Set(m.positions.map(p=>p.identity)).size,m.families);
 for(const p of m.positions){assert.deepEqual(p.forms.map(f=>f.stage),[0,1,2]);for(const f of p.forms)assert.ok(f.x>=0&&f.y>=0&&f.x+64<=m.width&&f.y+64<=m.height,'complete native cells');}
 assert.deepEqual(m.clipped,[],'clipped review cannot pass');assert.equal(m.timeline.length,states.length*8);
 let end=0;const covered=new Set();
 for(const segment of m.timeline){assert.equal(segment.start,end);assert.ok(segment.end>segment.start);assert.ok(states.includes(segment.state)&&segment.dir>=0&&segment.dir<8);const key=segment.dir+':'+segment.state;assert.ok(!covered.has(key));covered.add(key);end=segment.end;}
 assert.equal(end,m.duration);assert.ok(Math.abs(m.duration*m.fps-m.frames)<1e-6);assert.equal(m.renderedPoses,m.frames*m.families*3);
 assert.match(m.videoHash,/^[a-f0-9]{64}$/);assert.ok(Object.keys(m.inputs).length>0);
 return m;
}
export function verifiedVideo(folder,inputs){
 try{const m=validateVideoManifest(JSON.parse(fs.readFileSync(path.join(folder,'video-manifest.json'),'utf8')));assert.deepEqual(m.inputs,inputs);assert.equal(hashFile(path.join(folder,'all-companions.mp4')),m.videoHash);assert.ok(fs.existsSync(path.join(folder,'review.html')));return m;}catch{return null;}
}
export function acquireLock(file){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 try{const fd=fs.openSync(file,'wx');fs.writeFileSync(fd,String(process.pid));fs.closeSync(fd);return ()=>{try{if(fs.readFileSync(file,'utf8')===String(process.pid))fs.unlinkSync(file);}catch{}};}
 catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(file,'utf8'));let alive=true;try{process.kill(pid,0);}catch{alive=false;}if(alive)throw Error(`Animation job ${pid} already owns ${file}`);fs.unlinkSync(file);return acquireLock(file);}
}
