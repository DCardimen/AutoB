import test from 'node:test';
import assert from 'node:assert/strict';
import {DeploymentPhysics} from '../deployment-physics.js';
import {SPECIES,creature} from '../game.js';
import {pixelSpec} from '../native-content.js';
import {characterRig} from '../prototype-rig.js';
import {nativeFormRig} from '../native-forms.js';
import {nativeRigFor} from '../grand-designs.js';

test('owl pickup binds a real body landmark without a nonexistent source weapon',()=>{
 for(const id of ['voltwing','tempest','canopyowl','thunderroc'])for(const evolution of [0,1,2]){
  const c={...creature(id),evolution,deploymentPosition:{x:270,y:350}},spec=pixelSpec(id),source=characterRig(nativeRigFor(spec,c),'idle',.25),formed=nativeFormRig(spec,c,source),d=new DeploymentPhysics();
  assert.equal(formed.weapon,null);assert.ok(d.begin(c,0,{x:270,y:260},1,true));assert.notEqual(d.held.key,'weapon');assert.equal(d.held.d.points.weapon,undefined);
  d.move({x:330,y:280});d.update(.04);assert.equal(d.release(),c);assert.ok(Number.isFinite(c.deploymentPosition.x+c.deploymentPosition.y));
 }
});
test('every family/form/path supports pickup, movement, release and recovery at both height limits',()=>{
 let checked=0;
 for(const s of SPECIES)for(const evolution of [0,1,2])for(const evolutionPath of ['wild','warden'])for(const height of [.85,1.1]){
  const c={...creature(s.id),evolution,evolutionPath,deploymentPosition:{x:270,y:235}},d=new DeploymentPhysics();
  assert.ok(d.begin(c,0,{x:270,y:220},height,true),s.id);assert.ok(d.held.d.points[d.held.key],s.id);
  for(let i=1;i<=4;i++){d.move({x:270+i*20,y:220+i*3});d.update(1/60);assert.ok(Number.isFinite(d.held.position.x+d.held.position.y),s.id);}
  d.release();assert.ok(Number.isFinite(c.deploymentPosition.x+c.deploymentPosition.y),s.id);assert.ok(c.deploymentPosition.x<=450);assert.equal(d.held,null);d.update(1.2);assert.equal(d.drops.size,0);checked++;
 }
 assert.equal(checked,SPECIES.length*3*2*2);
});
test('a pointer outside the creature still cannot start a pickup',()=>{
 const d=new DeploymentPhysics();assert.equal(d.begin(creature('voltwing'),0,{x:-1000,y:-1000}),false);assert.equal(d.held,null);
});
