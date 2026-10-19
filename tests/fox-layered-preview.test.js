import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodePng} from '../scripts/animation-artifacts.mjs';
import {FORMS,PARTS,poseAt,createDynamics,stepDynamics,dynamicsErrors} from '../public/fox-layered-preview/model.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../public/fox-layered-preview/kits.json',import.meta.url),'utf8'));

test('pilot declares its real coverage and provides complete painted parts for all three authored tiers',()=>{
 assert.equal(manifest.coverage.directionCount,1);assert.equal(manifest.coverage.targetDirectionCount,8);assert.equal(manifest.coverage.gameIntegration,false);
 assert.deepEqual(manifest.forms.map(f=>f.form),FORMS);
 for(const form of manifest.forms){
  assert.deepEqual(Object.keys(form.parts),PARTS);
  const image=decodePng(fs.readFileSync(new URL('../public/fox-layered-preview/'+form.image,import.meta.url))),palette=new Set(form.palette);assert.equal(palette.size,48);
  for(let n=0;n<image.rgba.length;n+=4){assert.ok(image.rgba[n+3]===0||image.rgba[n+3]===255);if(image.rgba[n+3])assert.ok(palette.has([...image.rgba.subarray(n,n+3)].map(v=>v.toString(16).padStart(2,'0')).join('')));}
  for(const [name,p]of Object.entries(form.parts)){
   assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=image.width&&p.y+p.h<=image.height);
   let occupied=0;for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)occupied+=image.rgba[(y*image.width+x)*4+3]>0;
   assert.ok(occupied>8,form.form+'/'+name+' contains actual painted pixels');
  }
 }
});

test('anatomical bow/draw hands and string contact persist through movement and every attack phase',()=>{
 for(const action of ['idle','run','attack'])for(const stride of [.5,1,1.5])for(let i=0;i<240;i++){
  const p=poseAt(action,i/100,{stride});assert.equal(p.bow.hand,'right');assert.equal(p.bow.drawHand,'left');assert.deepEqual(p.bow.grip,p.arms.right.end);
  if(p.bow.engaged)assert.deepEqual(p.bow.draw,p.arms.left.end);
  const a=p.releasedArrow,dx=a.rest.x-a.nock.x,dy=a.rest.y-a.nock.y;assert.ok(Math.abs(dx*a.velocity.y-dy*a.velocity.x)<1e-8,'release follows the physical nock-to-rest direction');assert.ok(dx*a.velocity.x+dy*a.velocity.y>0);
  for(const b of [...p.legs,p.arms.left,p.arms.right]){assert.ok(Math.abs(Math.hypot(b.joint.x-b.root.x,b.joint.y-b.root.y)-b.upper)<1e-8);assert.ok(Math.abs(Math.hypot(b.end.x-b.joint.x,b.end.y-b.joint.y)-b.lower)<1e-8);}
 }
});

test('running alternates planted boots, keeps an independent ankle, and never hops',()=>{
 for(const stride of [.5,1.5]){
  const support=[0,0],lift=[0,0];
  for(let i=0;i<240;i++){
   const p=poseAt('run',i/240*.57,{stride});assert.ok(p.feet.some(f=>f.support));
   p.feet.forEach((f,index)=>{if(f.support){support[index]++;assert.equal(f.y,53);}else lift[index]++;assert.ok(Math.abs(p.legs[index].end.y-(f.y-3))<1e-8);});
  }
  assert.ok(support.every(n=>n>100)&&lift.every(n=>n>60),'both painted boots take support and swing turns');
 }
 for(const time of [0,.4,1,2.9])assert.deepEqual(poseAt('idle',time).feet,[{x:28,y:53,support:true},{x:35,y:53,support:true}]);
});

test('cape and all tails keep pinned roots and bounded lengths under wind, motion, release and long frame gaps',()=>{
 for(const form of FORMS){
  const sim=createDynamics(form);assert.equal(sim.tails.length,form==='moontrail'?5:1);
  for(let i=0;i<1800;i++){
   const action=i<600?'idle':i<1200?'run':'attack',p=poseAt(action,i/60,{stride:1.5});stepDynamics(sim,p,i%150===0?.7:1/60,2);
   const errors=dynamicsErrors(sim,p);assert.equal(errors.tailRoot,0);assert.equal(errors.capeRoot,0);assert.equal(errors.bowGrip,0);assert.ok(errors.tailLength<.05);
   for(const n of [...sim.cloth,...sim.tails.flatMap(t=>t.nodes)])assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y)&&n.x>=0&&n.x<64&&n.y>=0&&n.y<64);
  }
 }
});
