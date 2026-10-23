import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {recordGameSkirmish} from '../scripts/record-game-skirmish.mjs';
import {createGameReplay} from '../public/meshy-fox-preview/game-replay.mjs';

// The 3D fight is the game's fight: the committed recording must match a
// fresh run of the game's Battle engine, and the replay must show exactly
// what it decided.
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const recording=JSON.parse(fs.readFileSync('public/meshy-fox-preview/game-skirmish.json'));

test('the committed skirmish is what the current game engine produces',()=>{
 assert.equal(JSON.stringify(recordGameSkirmish()),JSON.stringify(recording),'game rules changed: rerun node scripts/record-game-skirmish.mjs');
 const [rowan,brakk]=recording.units;
 assert.equal(rowan.id,'rowan');assert.deepEqual(rowan.equipment,['copper-practice-bow']);assert.equal(rowan.attackInterval,1.3);assert.equal(rowan.range,230);
 assert.equal(brakk.id,'brakk');assert.equal(recording.foeTraining,'Unseasoned');assert.equal(recording.winner,0);
});

test('the replay places, shoots and lands exactly as the game did',async()=>{
 const b=fs.readFileSync('public/meshy-fox-preview/fox-biped.glb'),asset=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const replay=createGameReplay(asset,new T.Scene(),recording);replay.reset();
 const U=replay.U,bounds=recording.bounds,cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2,shots=recording.events.filter(e=>e.type==='shot'&&e.source===0);
 assert.ok(Math.abs(U-120*recording.units[0].scale/1.102)<1e-9,'units map by the game creature height');
 const names=['smartrigRightArm','smartrigRightForeArm','smartrigLeftArm','smartrigLeftForeArm','smartrigRightHand','smartrigLeftHand','Bow_Right_Hand','smartrigHips','smartrigSpine2','smartrigHead'],bones=names.map(n=>replay.fox.getObjectByName(n)),turns=names.map(()=>[]);
 let prev=null,spawned=0;const spawnTimes=[];
 // Life layer: feet planted under the body, the body kept up, the tail clear.
 const L=replay.life,life={far:0,skate:0,drop:0};let feetBefore=null;
 while(!replay.finished){
  const t=replay.state.time;replay.step(1/60);
  // Ground position is the game's, every frame.
  const i=Math.min(recording.frames.length-2,Math.floor(t/recording.step)),k=Math.min(1,Math.max(0,(t-recording.frames[i].t)/recording.step)),a=recording.frames[i].u[0],c=recording.frames[i+1].u[0];
  assert.ok(Math.abs(replay.fox.position.x-((a.x+(c.x-a.x)*k)-cx)/U)<1e-9&&Math.abs(replay.fox.position.z-((a.y+(c.y-a.y)*k)-cy)/U)<1e-9,`fox off the game's position at ${t.toFixed(3)}s`);
  if(replay.state.arrows.length>spawned){spawned=replay.state.arrows.length;spawnTimes.push(t);}
  const lc=L.ctx,air=lc.dodge&&lc.dodge.p>0&&lc.dodge.p<.82,feet=L.feet.map(f=>({p:f.foot.getWorldPosition(new T.Vector3()),planted:!f.swing&&!air&&!L.skidding}));
  if(!air&&!L.skidding)for(const f of feet)life.far=Math.max(life.far,f.p.clone().sub(replay.fox.position).setY(0).length());
  if(feetBefore)feet.forEach((f,k)=>{if(f.planted&&feetBefore[k].planted)life.skate=Math.max(life.skate,f.p.distanceTo(feetBefore[k].p));});feetBefore=feet;
  life.drop=Math.max(life.drop,L.drop);
  const q=bones.map(o=>o.getWorldQuaternion(new T.Quaternion()));if(prev)q.forEach((x,j)=>turns[j].push(prev[j].angleTo(x)*180/Math.PI));prev=q;
 }
 // One loose arrow per game shot, leaving the bow on the game's shot time.
 assert.equal(spawnTimes.length,shots.length);shots.forEach((s,j)=>assert.ok(Math.abs(spawnTimes[j]-s.t)<=1/60+1e-9,`arrow ${j} leaves at ${spawnTimes[j]} for a game shot at ${s.t}`));
 const summary=replay.summary();assert.equal(summary.arrowsStuck,summary.hitsOnBrakk,'every game hit leaves an arrow in Brakk');
 assert.ok(life.far<.35,`a grounded foot strays ${life.far.toFixed(2)} m from the body`);assert.ok(life.skate<.015,`a planted foot slides ${life.skate.toFixed(3)} m in a frame`);assert.ok(life.drop<=.0501,`the pelvis sinks ${life.drop.toFixed(3)} m to reach the feet`);
 assert.equal(replay.controller.tailMisses||0,0,'the tail always finds a clear pose');
 // Fluid: no isolated per-frame snap well above its neighbours.
 for(const [j,d]of turns.entries())for(let n=1;n<d.length-1;n++)assert.ok(d[n]-Math.max(d[n-1],d[n+1])<30,`${names[j]} snaps ${d[n].toFixed(1)} degrees at frame ${n}`);
});
