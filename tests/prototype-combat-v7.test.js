import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PrototypeArena,makePrototypeUnit,battleRosters,PROTOTYPE_BY_ID,animationState} from '../prototype-engine.js';
import {characterRig,projectRig,weaponContactPath,canineFoot,legLayout,locomotionStride} from '../prototype-rig.js';
import {paintCharacterPixels,PIXEL_PALETTES} from '../prototype-pixel-art.js';
import {FACE_VIEWS,FACE_IDENTITIES} from '../prototype-faces.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function fixture(){const arena=new PrototypeArena('study'),a=makePrototypeUnit('knight',0,0,350,350),b=makePrototypeUnit('orc',1,0,400,350);arena.units=[a,b];return {arena,a,b};}
test('random battles use six different creatures per side and retain front/backline options',()=>{
 const compositions=new Set();
 for(let seed=0;seed<100;seed++){
  const rosters=battleRosters(seed);assert.deepEqual(rosters,battleRosters(seed));
  for(const ids of rosters){assert.equal(ids.length,6);assert.equal(new Set(ids).size,6);const ranged=ids.filter(id=>PROTOTYPE_BY_ID[id].ranged).length;assert.ok(ranged>=2&&ranged<=4);}
  compositions.add(rosters.map(ids=>ids.slice().sort().join(',')).join('|'));
 }
 assert.ok(compositions.size>70);
 let previous='';for(let i=0;i<12;i++){const arena=new PrototypeArena('battle'),key=arena.rosters.map(ids=>ids.slice().sort().join(',')).join('|');assert.notEqual(key,previous);previous=key;assert.equal(arena.units.length,12);assert.equal(new Set(arena.units.map(u=>u.uid)).size,12);}
});
test('melee alternates overhead and horizontal contact paths; every third attack charges',()=>{
 const {arena,a,b}=fixture();const styles=[];
 for(let i=0;i<6;i++){a.stamina=100;a.action=null;assert.equal(arena.attack(a,b),true);styles.push(a.action.style);assert.equal(a.action.charged,(i+1)%3===0);assert.equal(a.action.anticipation,a.action.charged?3:1);if(a.action.charged){assert.ok(a.action.windup>=0.85);assert.ok(a.action.damage>a.damage*1.5);}}
 assert.deepEqual(styles,['overhead','side','overhead','side','overhead','side']);
 for(const id of ['knight','orc']){const overhead=weaponContactPath(id,0),side=weaponContactPath(id,0,{swing:'side'});assert.notDeepEqual(side,overhead);assert.ok(Math.max(...side.map(p=>p.y))-Math.min(...side.map(p=>p.y))>20);}
});
test('charged strikes withstand stun, knockdown and displacement but remain vulnerable to damage and death',()=>{
 const {arena,a,b}=fixture();assert.equal(arena.chargeAttack(a,b),true);const action=a.action;
 a.poise=110;for(let i=0;i<3;i++)arena.hit(a,b,59,'melee');
 assert.equal(a.action,action);assert.equal(a.hp,a.maxHp-177);assert.equal(a.stagger,0);assert.equal(a.knockdown,0);assert.equal(a.hitTime,0);assert.equal(a.ix,0);assert.equal(a.iy,0);assert.equal(animationState(a),'charge');assert.equal(arena.metrics.armorResists,3);
 for(let i=0;i<190;i++)arena.step(1/120);assert.ok(b.hp<b.maxHp);assert.equal(a.action,null);
 a.stamina=100;arena.chargeAttack(a,b);arena.hit(a,b,999,'melee');assert.equal(a.hp,0);assert.equal(a.action,null);assert.equal(animationState(a),'death');
});
test('an uncharged windup can still be interrupted and a ranged unit cannot queue a charged melee',()=>{
 const {arena,a,b}=fixture();arena.attack(a,b);a.poise=90;arena.hit(a,b,59);assert.equal(a.action,null);assert.ok(a.stagger>0);
 const archer=makePrototypeUnit('elf');assert.equal(arena.chargeAttack(archer,b),false);assert.equal(archer.chargeRequested,false);
});
test('right-handed weapons and both rigid axe grips remain attached through every facing and swing',()=>{
 for(const id of ['knight','orc','caster'])for(const state of ['idle','walk','run','sprint','attack','slash','charge','charge-side','cast'])for(const stage of ['windup','recovery'])for(let i=0;i<=24;i++){
  const rig=characterRig(id,state==='charge-side'?'charge':state,i/24,stage,state==='charge-side'?{swing:'side'}:{}),w=rig.weapon,r=rig.arms.find(a=>a.side===1);assert.equal(w.hand,'right');assert.ok(distance(w.grip,r.end)<1e-8);
  if(id==='orc'){const left=rig.arms.find(a=>a.side===-1).end;assert.ok(distance(left,{x:w.grip.x-w.axis.x*11,y:w.grip.y-w.axis.y*11,z:w.grip.z-w.axis.z*11})<1e-8);}
  for(let dir=0;dir<8;dir++){const a=projectRig(w.grip,dir*Math.PI/4),b=projectRig(r.end,dir*Math.PI/4);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.depth-b.depth)<1e-8);}
  for(const arm of rig.arms){assert.ok(Math.abs(distance(arm.root,arm.joint)-arm.upper)<1e-8);assert.ok(Math.abs(distance(arm.joint,arm.end)-arm.lower)<1e-8);assert.equal(arm.clamped,false,`${id} ${state} ${stage} ${i}: reachable wrist`);}
 }
});
test('directional faces have isolated profiles, no rear eyes and stable distinct identities',()=>{
 assert.deepEqual(FACE_VIEWS.map(v=>v.eyes.length),[1,2,2,2,1,0,0,0]);assert.equal(new Set(Object.values(FACE_IDENTITIES)).size,9);
 const hash=p=>createHash('sha256').update(p).digest('hex');
 for(const id of Object.keys(FACE_IDENTITIES)){assert.ok(PIXEL_PALETTES[id]);const rig=characterRig(id,'idle',0.25);assert.equal(new Set(Array.from({length:8},(_,dir)=>hash(paintCharacterPixels(id,rig,dir*Math.PI/4)))).size,8);}
});
test('the dog uses flat paws, low swing lift, diagonal trot support and an asymmetric gallop',()=>{
 for(let i=0;i<100;i++){const foot=canineFoot(i/100,72,0,0);assert.ok(foot.z<=4.01);if(foot.planted){assert.equal(foot.z,0);assert.equal(foot.pitch,0);}}
 const trot=legLayout('wolf',1,0);assert.equal(trot[0].offset,trot[3].offset);assert.equal(trot[1].offset,trot[2].offset);
 const gallop=legLayout('wolf',1,1);assert.equal(new Set(gallop.map(l=>((l.offset%1)+1)%1)).size,4);
 for(const [run,sprint]of [[0,0],[1,0],[1,1]]){const stride=locomotionStride(72,run,sprint,'wolf'),a=canineFoot(0.05,stride,run,sprint),b=canineFoot(0.05+3/stride,stride,run,sprint);assert.ok(a.planted&&b.planted);assert.ok(Math.abs(a.x-b.x-3)<1e-8);}
});
