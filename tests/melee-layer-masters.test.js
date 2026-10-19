import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {authoredParts,MELEE_ARM_FAMILIES} from '../authored-parts.js';
const hash=b=>createHash('sha256').update(b).digest('hex');

test('raw PNG references match the earliest available Git blobs and remain distinct from converted bind artwork',()=>{
 const p=JSON.parse(fs.readFileSync('art/melee-layers/sources.json','utf8'));assert.equal(p.sources.length,10);
 for(const s of p.sources){const original=execFileSync('git',['show',`${s.firstCommit}:${s.file}`],{maxBuffer:30*1024*1024});assert.equal(hash(original),s.sha256);assert.equal(hash(fs.readFileSync(s.file)),s.sha256);}
});
test('saved ownership is independent of runtime color/shape inference in all 168 cells',()=>{
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const a=authoredSourceFrame(id,dir,stage),p=authoredParts(a,id,stage,dir),altered={...a,parts:undefined,pixels:a.pixels.slice().reverse().map(p=>({...p,rgb:[255,0,255],color:'#ff00ff'}))},q=authoredParts(altered,id,stage,dir);
  assert.deepEqual(q.body,p.body);assert.deepEqual([...q.arms.mask],[...p.arms.mask]);assert.deepEqual(q.underbody,p.underbody);
 }
});
test('evolved Grum includes the actual painted upper arm and Sable grips the visible gloves, not cuffs or cloak',()=>{
 for(const stage of [1,2]){
  const grum=authoredParts(authoredSourceFrame('troll',2,stage),'troll',stage,2);assert.ok(grum.arms.mask.has(21*64+22));assert.ok(grum.underbody.some(p=>p.x===22&&p.y===21));
  const sable=authoredParts(authoredSourceFrame('rogue',2,stage),'rogue',stage,2),expected=stage===1?[[18,28],[45,28]]:[[19,29],[44,30]];
  for(const [i,side]of [-1,1].entries()){const p=sable.arms.profiles.get(side);assert.deepEqual(p.end,{x:expected[i][0],y:expected[i][1]});assert.ok(p.grid.has(p.end.y*64+p.end.x));}
  const rear=authoredParts(authoredSourceFrame('rogue',6,stage),'rogue',stage,6);for(const arm of rear.arms.profiles.values()){assert.equal(arm.occluded,false);assert.equal(arm.sourceDir,6);}
 }
});
test('new backing stops at the pelvis, leaves leg air gaps, and covers every saved shoulder socket',()=>{
 for(const file of fs.readdirSync('art/melee-layers/masters')){const m=JSON.parse(fs.readFileSync('art/melee-layers/masters/'+file,'utf8'));
  for(const f of m.facings){const a=authoredSourceFrame(m.identity,f.dir,m.stage),p=authoredParts(a,m.identity,m.stage,f.dir);assert.ok(p.underbody.every(q=>q.y<=f.backingBottom));
   for(const arm of p.arms.profiles.values()){const k=Math.round(arm.root.y)*64+Math.round(arm.root.x);assert.ok([...p.underbody,...p.body].some(q=>q.y*64+q.x===k),'body/cape under every source attachment');}
   assert.equal(p.layers.weapon.length,0);assert.ok(f.notes.some(n=>n.includes('separate equipped weapon renderer')));
  }
 }
});

test('rogue cloak backing uses blue cloth, source floor marks stay out of combat, and bronze hems are not extra boots',()=>{
 for(const stage of [0,1,2]){const m=JSON.parse(fs.readFileSync(`art/melee-layers/masters/rogue-${stage}.json`,'utf8'));
  for(const f of m.facings){const p=authoredParts(authoredSourceFrame('rogue',f.dir,stage),'rogue',stage,f.dir);
   for(const pixel of f.reconstructed.filter(q=>q[3]==='cape'))assert.ok(f.cloakRamp.includes(pixel[2]),'new cloak fabric cannot borrow floor, glove or belt colors');
   for(const q of p.layers.ground)assert.ok(![...p.body,...p.legs].some(v=>v.x===q.x&&v.y===q.y),'source floor is excluded from the animated body');
   assert.ok(p.legRegistration.limbs.length<=2,'bronze cloak trim must not register as another foot');
   for(const q of p.legs)assert.ok(f.legContours.some(([l,r,t,b])=>q.x>=l&&q.x<=r&&q.y>=t&&q.y<=b),'only the individually reviewed painted boots move as legs');
  }
 }
});
