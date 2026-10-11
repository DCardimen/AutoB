import test from 'node:test';
import assert from 'node:assert/strict';
import {PrototypeArena,makePrototypeUnit,PROTOTYPE_CHARACTERS,animationState,directionalFrame,groundToScreen,screenToGround,gaitFoot} from '../prototype-engine.js';
function fixture(source='knight',target='orc',gap=50){
  const arena=new PrototypeArena('study'),a=makePrototypeUnit(source,0,0,350,350),b=makePrototypeUnit(target,1,0,350+gap,350);
  arena.units=[a,b];return {arena,a,b};
}
function advance(arena,seconds){for(let i=0;i<Math.round(seconds*120);i++)arena.step(1/120);}
test('five prototype bodies have distinct mass, stride, and weapon profiles; direction and projection round-trip',()=>{
  assert.equal(PROTOTYPE_CHARACTERS.length,5);assert.equal(new Set(PROTOTYPE_CHARACTERS.map(c=>c.weapon)).size,5);
  for(let turns=-5;turns<=5;turns++)for(let i=0;i<8;i++)assert.equal(directionalFrame(i*Math.PI/4+turns*Math.PI*2),i);
  const p=screenToGround(...Object.values(groundToScreen(300,470)));assert.ok(Math.abs(p.x-300)<1e-9&&Math.abs(p.y-470)<1e-9);
});
test('melee damage follows blade contact after preparation, and sound occurs at that contact',()=>{
  const {arena,a,b}=fixture();arena.attack(a,b);advance(arena,Math.floor(a.windup*0.72*120)/120);
  assert.equal(b.hp,b.maxHp);assert.equal(arena.audio.length,0);
  while(b.hp===b.maxHp&&arena.time<1)arena.step(1/120);
  assert.equal(b.hp,b.maxHp-a.damage);
  const contact=arena.events.find(e=>e.type==='contact');assert.ok(contact);assert.ok(contact.time>=a.windup*0.72&&contact.time<=a.windup+1/120);assert.equal(arena.audio[0].type,'hit');
  assert.ok(Math.hypot(contact.point.x-contact.targetPosition.x,contact.point.y-contact.targetPosition.y)<=contact.targetPosition.radius+4+1e-6);
});
test('a committed melee cannot follow a target leaving its aim',()=>{
  const {arena,a,b}=fixture();arena.attack(a,b);b.y+=125;advance(arena,0.8);
  assert.equal(b.hp,b.maxHp);assert.equal(arena.metrics.misses,1);
});
test('a real stamina-paid roll clears a melee attack; rolls provide no immunity to connected hits',()=>{
  const {arena,a,b}=fixture('knight','elf');b.dodgeCooldown=0;arena.attack(a,b);
  assert.equal(arena.roll(b,Math.PI/2),true);assert.equal(b.stamina,70);
  advance(arena,0.4);assert.ok(b.y>400);assert.equal(b.hp,b.maxHp);assert.equal(arena.metrics.avoided,1);
  const before=b.hp;arena.hit(b,a,10);assert.equal(b.hp,before-10);
});
test('released projectiles keep their aim and strike the first hostile body',()=>{
  const {arena,a,b}=fixture('elf','orc',190),screen=makePrototypeUnit('knight',1,1,440,350);arena.units.push(screen);
  arena.attack(a,b);advance(arena,0.8);assert.equal(b.hp,b.maxHp);assert.equal(screen.hp,screen.maxHp-a.damage);
  const f=fixture('elf','orc',190);f.arena.attack(f.a,f.b);advance(f.arena,0.3);f.b.y+=180;advance(f.arena,3);
  assert.equal(f.b.hp,f.b.maxHp);assert.equal(f.arena.metrics.misses,1);
});
test('the same heavy contact displaces a light body more than an armored one',()=>{
  const light=fixture('orc','elf'),heavy=fixture('orc','knight');
  light.arena.hit(light.b,light.a,59);heavy.arena.hit(heavy.b,heavy.a,59);
  assert.ok(light.b.ix>heavy.b.ix*2);advance(light.arena,0.15);advance(heavy.arena,0.15);
  assert.ok(light.b.x-400>heavy.b.x-400);
});
test('breaking poise cancels a windup, including its eventual projectile',()=>{
  const {arena,a,b}=fixture('orc','caster');arena.attack(b,a);b.poise=30;arena.hit(b,a,59);
  assert.equal(b.action,null);assert.ok(b.stagger>0);assert.equal(arena.metrics.interrupts,1);advance(arena,1);assert.equal(arena.metrics.projectiles,0);
});
test('final deaths keep falling after combat settles, without further hits',()=>{
  const {arena,a,b}=fixture();arena.mode='battle';b.hp=1;arena.hit(b,a,40);arena.step(1/120);
  assert.equal(arena.done,true);assert.equal(animationState(b),'death');const hits=arena.metrics.hits,hp=a.hp;
  advance(arena,1);assert.ok(b.deathTime>0.9);assert.equal(arena.metrics.hits,hits);assert.equal(a.hp,hp);
});
test('prototype battle outcomes and contact times do not depend on display frame interval',()=>{
  const results=[1/120,1/60,1/30,0.1].map(dt=>{
    const a=new PrototypeArena();while(!a.done&&a.time<90)a.step(dt);
    assert.equal(a.done,true);return {winner:a.winner,metrics:a.metrics,contacts:a.events.filter(e=>e.type==='contact').map(e=>[e.time,e.damage,e.uid,e.targetUid]),hp:a.units.map(u=>u.hp)};
  });for(const r of results.slice(1))assert.deepEqual(r,results[0]);
});
test('a planted gait foot cancels actual ground travel instead of sliding',()=>{
  for(const s of PROTOTYPE_CHARACTERS)for(const running of [false,true]){
    const x=400,phase=0.1,travel=7,f0=gaitFoot(phase,s.stride,running),f1=gaitFoot(phase+travel/s.stride,s.stride,running);
    assert.equal(f0.planted,true);assert.equal(f1.planted,true);assert.equal(f0.z,0);assert.equal(f1.z,0);
    assert.ok(Math.abs(x+f0.x-(x+travel+f1.x))<1e-8);
    assert.ok(gaitFoot(0.82,s.stride,running).z>0);
  }
});
test('sprint accelerates smoothly above running speed and spends stamina instead of acting as a dash',()=>{
  const normal=fixture('knight','orc',450),sprint=fixture('knight','orc',450);
  for(const f of [normal,sprint]){f.arena.mode='battle';f.arena.moveOrder(f.a.uid,{x:850,y:350});}
  assert.equal(sprint.arena.setSprint(sprint.a.uid,true),true);
  sprint.arena.step(1/120);assert.ok(Math.hypot(sprint.a.vx,sprint.a.vy)<5);assert.equal(sprint.a.roll,null);
  advance(sprint.arena,1.1-1/120);advance(normal.arena,1.1);
  assert.ok(sprint.a.x-350>(normal.a.x-350)*1.4);
  assert.ok(Math.hypot(sprint.a.vx,sprint.a.vy)>sprint.a.run);
  assert.ok(sprint.a.stamina<80&&sprint.a.stamina>75);assert.equal(animationState(sprint.a),'sprint');
  assert.equal(sprint.arena.setSprint(sprint.a.uid,false),true);
  const before=sprint.a.stamina;advance(sprint.arena,0.5);assert.ok(sprint.a.stamina>before);
});
test('exhausted sprint falls back to walking and requires a fresh request after recovery',()=>{
  const low=new PrototypeArena('movement');low.units[0].stamina=20;low.setLocomotion('sprint');low.step(1/120);
  assert.equal(low.units[0].sprintActive,false);assert.equal(low.setSprint(low.units[0].uid,true),false);
  const arena=new PrototypeArena('movement');arena.setLocomotion('sprint');advance(arena,6);
  assert.ok(arena.units.every(u=>u.sprintExhausted&&!u.sprintActive));
  assert.ok(arena.units.every(u=>u.stamina>8&&u.stamina<40));
  arena.setLocomotion('walk');advance(arena,2);
  assert.equal(arena.setSprint(arena.units[0].uid,true),true);
  advance(arena,0.5);assert.equal(arena.units[0].sprintActive,true);
  const dead=arena.units[1];dead.hp=0;assert.equal(arena.setSprint(dead.uid,true),false);
});
test('sprint movement and fatigue remain deterministic at different display intervals',()=>{
  const results=[1/120,1/60,1/30,0.1].map(dt=>{
    const a=new PrototypeArena('movement');a.setLocomotion('sprint');
    for(let i=0;i<Math.round(2/dt);i++)a.step(dt);
    a.setLocomotion('walk');for(let i=0;i<Math.round(0.6/dt);i++)a.step(dt);
    return a.units.map(u=>({x:u.x,y:u.y,stamina:u.stamina,gait:u.gait,run:u.runBlend,sprint:u.sprintBlend}));
  });for(const r of results.slice(1))assert.deepEqual(r,results[0]);
});
