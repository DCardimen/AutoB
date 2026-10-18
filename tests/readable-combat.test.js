import test from 'node:test';
import assert from 'node:assert/strict';
import {arenaCamera,arenaPoint,updateArenaCamera} from '../arena-camera.js';
import {queueCombatText,queueCombatCue,combatTextPresentation} from '../combat-text.js';
import {combatApproach} from '../native-tactics.js';
import {tacticalMove} from '../ai-relics.js';

test('combat keeps silhouettes and weapon margins visible through dashes and viewport changes; targeting uses the displayed camera',()=>{
 const battle={units:[{uid:'a',hp:100,x:360,y:300,nativeScale:.4},{uid:'b',hp:100,x:700,y:640,nativeScale:.6}]};
 for(const [width,height]of [[1420,650],[350,420],[2100,900],[350,300]])for(let frame=0;frame<60;frame++){
  battle.units[1].x=frame<30?700:250;
  const c=updateArenaCamera(width,height,battle,frame/60),rect={left:31,top:87,width,height};
  assert.equal(arenaCamera(width,height,battle),c);
  for(const u of battle.units){
   assert.ok(u.x-85*u.nativeScale>=c.x-1e-8);assert.ok(u.x+85*u.nativeScale<=c.x+c.width+1e-8);
   assert.ok(u.y*.58+75-155*u.nativeScale>=c.y-1e-8);assert.ok(u.y*.58+75<=c.y+c.height+1e-8);
   const p=arenaPoint(rect.left+(u.x-c.x)*c.scale,rect.top+(u.y*.58+75-c.y)*c.scale,rect,battle);
   assert.ok(Math.abs(p.x-u.x)<1e-8);assert.ok(Math.abs(p.y-(u.y*.58+75))<1e-8);
  }
 }
});
test('gentle motion holds the encounter view while the surviving fighters close',()=>{
 const battle={reducedMotion:true,units:[{hp:1,x:300,y:350,nativeScale:.4},{hp:1,x:700,y:450,nativeScale:.4}]};
 const a={...updateArenaCamera(390,450,battle,0)};battle.units[1].x=500;
 const b=updateArenaCamera(390,450,battle,1);assert.equal(b.scale,a.scale);assert.equal(b.x,a.x);assert.equal(b.y,a.y);
});
test('fractional CSS canvas sizes still target the displayed, integer-sized backing canvas',()=>{
 const b={units:[{hp:1,x:500,y:400,nativeScale:.4}]},v=updateArenaCamera(1423,650,b,0),rect={left:17,top:42,width:1422.8125,height:650};
 const p=arenaPoint(rect.left+(500-v.x)*rect.width/v.width,rect.top+(307-v.y)*rect.height/v.height,rect,b);
 assert.ok(Math.abs(p.x-500)<1e-8);assert.ok(Math.abs(p.y-307)<1e-8);
});
test('rapid confirmed hits combine exact amounts; block, dodge and stagger remain distinct cues',()=>{
 const b={combatTexts:[],time:0,textSerial:0},u={uid:'target',side:1,x:500,y:400};
 queueCombatText(b,u,12.3);queueCombatText(b,u,4.8);assert.equal(b.combatTexts.length,1);assert.equal(b.combatTexts[0].amount,17.1);
 for(const kind of ['block','dodge','stagger']){queueCombatCue(b,u,kind);queueCombatCue(b,u,kind);assert.equal(b.combatTexts.filter(t=>t.kind===kind).length,1);assert.equal(combatTextPresentation(b.combatTexts.at(-1)).label,kind.toUpperCase());}
 b.time=.2;queueCombatText(b,u,7);assert.equal(b.combatTexts.filter(t=>t.kind==='hit').length,2);
});
test('ordinary ranged units plant in clear firing positions while explicit kiting still retreats',()=>{
 const u={uid:'ranger',hp:1,x:400,y:400,radius:18,range:210,side:0},t={uid:'melee',hp:1,x:465,y:400,radius:20,side:1};
 const goal=combatApproach(u,t,[u,t]);assert.equal(goal.x,u.x);assert.equal(goal.y,u.y);
 u.aiEffects={kite:true};const retreat=tacticalMove({living:side=>side?[t]:[u]},u,t,goal);assert.ok(retreat.x<u.x);
});
