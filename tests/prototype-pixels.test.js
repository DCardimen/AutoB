import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {PROTOTYPE_CHARACTERS,ANIMATION_STATES,PrototypeArena,makePrototypeUnit,animationState} from '../prototype-engine.js';
import {characterRig,legLayout} from '../prototype-rig.js';import {exportPixels,LOOP_STATES} from '../prototype-export.js';import {createRagdoll,stepRagdoll,stepCape} from '../prototype-dynamics.js';
test('all exported poses have exact 64px cells, binary alpha and no clipped drawing',()=>{
 let frames=0;for(const {id}of PROTOTYPE_CHARACTERS)for(const state of ANIMATION_STATES)for(let dir=0;dir<8;dir++)for(let i=0;i<8;i++){
  const p=exportPixels(id,state,i/(LOOP_STATES.includes(state)?8:7),dir);assert.equal(p.length,64*64*4);assert.equal(p.clipped,0,`${id} ${state} ${dir} ${i} must fit without cropping`);
  let opaque=0;for(let j=3;j<p.length;j+=4){assert.ok(p[j]===0||p[j]===255,'sprite edges must contain no antialiased pixels');if(p[j])opaque++;}assert.ok(opaque>20);frames++;
 }assert.equal(frames,8640);
});
test('every creature has eight identifiable facings and distinct run, turn, stop and dodge poses',()=>{
 const hash=p=>createHash('sha256').update(p).digest('hex');
 for(const {id}of PROTOTYPE_CHARACTERS){assert.equal(new Set(Array.from({length:8},(_,dir)=>hash(exportPixels(id,'idle',0.25,dir)))).size,8,id+' facing identity');
  const run=new Set(Array.from({length:8},(_,i)=>hash(exportPixels(id,'run',i/8,2))));assert.ok(run.size>=4,id+' must visibly run');
  const poses=['idle','turn','stop','dodge'].map(state=>hash(exportPixels(id,state,0.5,2)));assert.ok(new Set(poses).size>=3,id+' must show distinct physical poses');
 }
});
test('the hound keeps four legs, the walker six, the spider eight and jelly none',()=>{
 for(const [id,count]of [['wolf',4],['mech',6],['spider',8],['jelly',0]])for(const state of ['idle','walk','run','sprint'])for(let i=0;i<16;i++){const rig=characterRig(id,state,i/16);assert.equal(rig.legs.length,count);assert.equal(legLayout(id).length,count);for(const l of rig.legs)assert.equal(l.clamped,false);}
 assert.equal(characterRig('wolf','sprint',0.4).legs.filter(l=>l.hock).length,2);
});
test('ragdolls react to impulse and retain finite constrained joints above their floor radii',()=>{
 for(const {id}of PROTOTYPE_CHARACTERS){const a=createRagdoll(id,characterRig(id),{x:90,y:0}),b=createRagdoll(id,characterRig(id),{x:-90,y:0});
  for(let i=0;i<180;i++){stepRagdoll(a,1/120);stepRagdoll(b,1/120);}assert.ok(a.points.head.x>b.points.head.x,'impact direction must affect the fall');
  for(const p of Object.values(a.points)){assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(p.z>=p.floor);}
  for(const l of a.links){const p=a.points[l.a],q=a.points[l.b];assert.ok(Math.abs(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)-l.length)<1.5,id+' joints must stay connected');}
 }
});
test('a heavy impact causes knockdown and a get-up phase without granting immunity',()=>{
 const arena=new PrototypeArena('study'),source=makePrototypeUnit('orc'),target=makePrototypeUnit('spider',1,0,250,300);arena.units=[source,target];arena.hit(target,source,59);assert.ok(target.knockdown>0);assert.equal(animationState(target),'knockdown');const hp=target.hp;arena.hit(target,source,10,'arrow');assert.equal(target.hp,hp-10);
 for(let i=0;i<80;i++)arena.step(1/120);assert.ok(target.getup>0);assert.equal(animationState(target),'getup');for(let i=0;i<70;i++)arena.step(1/120);assert.equal(target.ragdoll,null);assert.equal(target.knockdown,0);
});
test('cape springs retain motion through braking and settle rather than snapping',()=>{
 const u=makePrototypeUnit('caster');u.vx=180;for(let i=0;i<60;i++)stepCape(u,1/120);const before=u.cape[1].angle;assert.ok(before>0.4);u.vx=0;stepCape(u,1/120);assert.ok(u.cape[1].angle>before*0.8);for(let i=0;i<360;i++)stepCape(u,1/120);assert.ok(Math.abs(u.cape[1].angle)<0.03);
});
