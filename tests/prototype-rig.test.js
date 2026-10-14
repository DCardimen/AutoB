import test from 'node:test';
import assert from 'node:assert/strict';
import {characterRig,localFootContacts,rigFoot,locomotionStride} from '../prototype-rig.js';
import {PrototypeArena,makePrototypeUnit,PROTOTYPE_CHARACTERS,meleeConnects,animationState} from '../prototype-engine.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
test('sideways dodges lead with the correct foot and tilt toward their actual escape direction',()=>{
  for(const id of ['knight','orc','elf','caster','wolf'])for(const sign of [-1,1]){
    const rig=characterRig(id,'dodge',0.5,'',{rollAngle:sign*Math.PI/2});
    assert.ok(rig.sideLean*sign>0);assert.ok(rig.pelvis.y*sign>0);
    for(const leg of rig.legs){assert.equal(leg.clamped,false);if(leg.side*sign>0){assert.equal(leg.foot.planted,false);assert.ok(leg.foot.ground.z>5);}else assert.equal(leg.foot.planted,true);}
  }
});
test('humanoid strides grow with pace while staying compact relative to short legs',()=>{
  for(const spec of PROTOTYPE_CHARACTERS.filter(s=>['knight','orc','elf','caster','fox'].includes(s.id))){
    const walkSteps=120*spec.speed/spec.stride;assert.ok(walkSteps>=100&&walkSteps<=180);
    const walk=locomotionStride(spec.stride,0,0,spec.id),run=locomotionStride(spec.stride,1,0,spec.id),sprint=locomotionStride(spec.stride,1,1,spec.id);
    assert.ok(run>walk&&sprint>run);assert.ok(sprint<spec.stride*1.15,'avoid the old long split stride');
    assert.ok(walk<spec.stride,'walk starts from anatomy-sized steps');
  }
});
test('hips and head stay continuous when the last supporting foot leaves the ground',()=>{
  for(const spec of PROTOTYPE_CHARACTERS)for(const state of ['run','sprint']){
    const duty=rigFoot(0,spec.stride,1,state==='sprint'?1:0).duty;
    const before=characterRig(spec.id,state,duty-1e-6),after=characterRig(spec.id,state,duty+1e-6);
    for(const part of ['pelvis','body','head'])assert.ok(dist(before[part],after[part])<0.001,spec.id+' '+state+' '+part);
  }
});
function fixture(){
  const arena=new PrototypeArena('study'),a=makePrototypeUnit('knight',0,0,350,350),b=makePrototypeUnit('orc',1,0,400,350);
  arena.units=[a,b];return {arena,a,b};
}
test('movement-to-attack transitions begin at the carried pose and settle before active contact',()=>{
  for(const id of ['knight','orc','elf','caster','wolf']){
    const before=characterRig(id,'run',0.21,'',{runBlend:1,motion:1}),transition={gait:0.21,weight:1,runBlend:1,sprintBlend:0,motion:1};
    const after=characterRig(id,id==='caster'?'cast':'attack',0,'windup',{transition});
    for(const part of ['head','body','pelvis'])assert.ok(dist(before[part],after[part])<1e-7,id+' '+part);
    if(before.weapon){assert.ok(dist(before.weapon.grip,after.weapon.grip)<1e-7);assert.ok(dist(before.weapon.tip,after.weapon.tip)<1e-7);}
    const clear=characterRig(id,'attack',0.8,'windup',{transition:{...transition,weight:0}}),normal=characterRig(id,'attack',0.8,'windup');
    assert.ok(dist(clear.head,normal.head)<1e-7);if(normal.weapon)assert.ok(dist(clear.weapon.tip,normal.weapon.tip)<1e-7);
  }
});
test('dash and dodge poses enter and exit at the idle stance without crouch or hand pops',()=>{
  for(const id of ['knight','orc','elf','caster','wolf'])for(const state of ['dash','dodge'])for(const phase of [0,1]){
    const idle=characterRig(id,'idle',0),action=characterRig(id,state,phase);
    for(const part of ['head','body','pelvis'])assert.ok(dist(idle[part],action[part])<1e-7);
    action.legs.forEach((leg,i)=>assert.ok(dist(leg.end,idle.legs[i].end)<1e-7));
    if(idle.weapon)assert.ok(dist(idle.weapon.grip,action.weapon.grip)<1e-7);
  }
});
test('anatomical legs keep their lengths and planted ankle height through full walk/run/sprint cycles',()=>{
  for(const spec of PROTOTYPE_CHARACTERS)for(const state of ['idle','walk','run','sprint'])for(let i=0;i<96;i++){
    const rig=characterRig(spec.id,state,i/96,'',{stride:spec.stride});
    for(const leg of rig.legs){
      assert.ok(Math.abs(dist(leg.root,leg.joint)-leg.upper)<1e-8);
      assert.ok(Math.abs(dist(leg.joint,leg.hock||leg.end)-leg.lower)<1e-8);
      if(leg.hock)assert.ok(Math.abs(dist(leg.hock,leg.end)-leg.hockLength)<1e-8);
      assert.equal(leg.clamped,false,spec.id+' '+state+' must not need a stretched or unreachable leg');
      if(leg.foot.planted)assert.ok(Math.abs(leg.end.z-leg.foot.soleLift-3)<1e-8,'heel/toe support preserves the ground contact while the ankle rises');
    }
  }
});
test('supporting feet remain fixed in world space while creatures move and turn',()=>{
  const arena=new PrototypeArena('movement');let checked=0,turns=0,previous=new Map();
  for(let frame=0;frame<720;frame++){
    arena.step(1/120);
    for(const u of arena.units){
      const old=previous.get(u.uid);
      if(old&&Math.abs(old.facing-u.facing)>0.002)turns++;
      u.groundFeet?.forEach((foot,i)=>{
        const prior=old?.feet[i];
        if(prior?.planted&&foot.planted&&prior.serial===foot.serial){
          assert.ok(Math.hypot(foot.x-prior.x,foot.y-prior.y)<1e-8);
          checked++;
        }
      });
      previous.set(u.uid,{facing:u.facing,feet:u.groundFeet?.map(f=>({...f}))||[]});
    }
  }
  assert.ok(checked>1000);assert.ok(turns>500);
});
test('local foot contacts reproduce fixed world anchors after a body turn',()=>{
  const u=makePrototypeUnit('knight',0,0,300,400);
  u.groundFeet=[{x:310,y:405,z:3,angle:0},{x:298,y:389,z:3,angle:0}];
  for(const facing of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5]){
    u.facing=facing;
    for(const [i,p] of localFootContacts(u).entries()){
      assert.ok(Math.abs(u.x+p.x*Math.cos(facing)-p.y*Math.sin(facing)-u.groundFeet[i].x)<1e-8);
      assert.ok(Math.abs(u.y+p.x*Math.sin(facing)+p.y*Math.cos(facing)-u.groundFeet[i].y)<1e-8);
    }
  }
});
test('both axe hands follow one rigid handle and the contact/recovery pose is continuous',()=>{
  for(const stage of ['windup','recovery'])for(let i=0;i<=96;i++){
    const rig=characterRig('orc','attack',i/96,stage),hand=rig.arms.find(a=>a.side===-1).end,w=rig.weapon;
    assert.ok(dist(hand,{x:w.grip.x-w.axis.x*11,y:w.grip.y,z:w.grip.z-w.axis.z*11})<1e-8);
    for(const arm of rig.arms){
      assert.ok(Math.abs(dist(arm.root,arm.joint)-arm.upper)<1e-8);
      assert.ok(Math.abs(dist(arm.joint,arm.end)-arm.lower)<1e-8);
    }
  }
  for(const id of ['knight','orc']){
    const a=characterRig(id,'attack',1,'windup'),b=characterRig(id,'attack',0,'recovery');
    for(const part of ['body','head','pelvis'])assert.ok(dist(a[part],b[part])<1e-8);
    assert.ok(dist(a.weapon.tip,b.weapon.tip)<1e-8);
    assert.ok(dist(a.weapon.grip,b.weapon.grip)<1e-8);
  }
});
test('walking and running blend continuously and clear the ground during swing',()=>{
  for(let blend=0;blend<=1;blend+=0.05){
    const a=rigFoot(0.2,76,blend),b=rigFoot(0.2,76,blend+0.001);
    assert.ok(Math.abs(a.x-b.x)<0.02);assert.equal(a.z,0);
    assert.ok(rigFoot(0.8,76,blend).z>5);
  }
});
test('the archer draws the animated bowstring with the same hand that holds it',()=>{
  for(let i=20;i<=100;i++){
    const rig=characterRig('elf','attack',i/100,'windup'),w=rig.weapon,hand=rig.arms.find(a=>a.side===1).end;
    const pull={x:w.grip.x-rig.bowString.draw*18,y:w.grip.y,z:w.grip.z};
    assert.ok(dist(hand,pull)<1e-8);
  }
});
test('a target inside the aim cone is missed when the actual blade path cannot reach it',()=>{
  const {arena,a,b}=fixture();b.id='elf';b.radius=15;b.y-=25;
  assert.equal(meleeConnects(a,b,0,a.reach),true);
  arena.attack(a,b);a.action.angle=0;
  for(let i=0;i<90;i++)arena.step(1/120);
  assert.equal(b.hp,b.maxHp);assert.equal(arena.metrics.misses,1);
});
test('connected swings pause their weapon briefly without inflicting duplicate damage',()=>{
  const {arena,a,b}=fixture();arena.attack(a,b);
  while(!arena.metrics.hits)arena.step(1/120);
  assert.ok(a.action.impactHold>0);
  const elapsed=a.action.elapsed,hp=b.hp,hits=arena.metrics.hits;
  arena.step(1/120);assert.equal(a.action.elapsed,elapsed);assert.equal(b.hp,hp);assert.equal(arena.metrics.hits,hits);
  for(let i=0;i<8;i++)arena.step(1/120);assert.ok(a.action.elapsed>elapsed);
});
test('creatures align toward a target before attacking rather than snapping through 180 degrees',()=>{
  const {arena,a,b}=fixture();a.facing=Math.PI;
  assert.equal(arena.attack(a,b),false);assert.equal(a.action,null);
  arena.step(1/120);assert.ok(Math.abs(a.facing-Math.PI)<0.07);assert.ok(a.facing<Math.PI);
  for(let i=0;i<55;i++)arena.step(1/120);
  assert.equal(arena.attack(a,b),true);
});
test('live walking, running and sprinting keep every limb reachable while turning and accelerating',()=>{
  for(const pace of ['walk','run','sprint']){
    const arena=new PrototypeArena('movement');arena.setLocomotion(pace);
    for(let frame=0;frame<600;frame++){
      arena.step(1/120);
      for(const u of arena.units){
        const rig=characterRig(u.id,u.sprintBlend>0.35?'sprint':u.runBlend>0.4?'run':'walk',u.gait%1,'',{
          stride:u.stride,motion:Math.min(1,u.moving/0.5),runBlend:u.runBlend,sprintBlend:u.sprintBlend,acceleration:u.acceleration,feet:localFootContacts(u)});
        for(const limb of [...rig.legs,...rig.arms])assert.equal(limb.clamped,false,`${u.id} ${pace} limb must remain reachable`);
      }
    }
  }
});
test('carried weapons retain their grip through walk/run/sprint, including both axe hands',()=>{
  for(const state of ['idle','walk','run','sprint'])for(let i=0;i<96;i++)for(const id of ['knight','orc','elf','caster']){
    const rig=characterRig(id,state,i/96),w=rig.weapon,grip=rig.arms.find(a=>a.side===(id==='elf'?-1:1)).end;
    assert.ok(dist(grip,w.grip)<1e-8);
    if(id==='orc')assert.ok(dist(rig.arms.find(a=>a.side===-1).end,{x:w.grip.x-w.axis.x*11,y:w.grip.y,z:w.grip.z-w.axis.z*11})<1e-8);
    for(const arm of rig.arms)assert.equal(arm.clamped,false);
  }
});
test('walking rolls heel to toe; sprint adds lift, forward lean and a separate wolf gallop',()=>{
  assert.ok(rigFoot(0,76,false).pitch<0);assert.ok(rigFoot(0.6,76,false).pitch>0);
  for(const spec of PROTOTYPE_CHARACTERS){
    const walk=characterRig(spec.id,'walk',0.78),sprint=characterRig(spec.id,'sprint',0.78);
    assert.ok(sprint.lean>walk.lean+0.1);
    if(spec.id==='wolf')assert.equal(sprint.legs.filter(l=>l.hock).length,2);
  }
  const walk=characterRig('wolf','walk',0),sprint=characterRig('wolf','sprint',0);
  assert.notDeepEqual(walk.legs.map(l=>l.foot.planted),sprint.legs.map(l=>l.foot.planted));
});
