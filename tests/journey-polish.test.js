import test from 'node:test';
import assert from 'node:assert/strict';
import {arenaCamera,arenaPoint} from '../arena-camera.js';
import {rewardArc,rewardsShell} from '../rewards-ui.js';
import {coverGeometry,AMBIENT_SCENES} from '../ambient-art.js';
import {combatTextPresentation,queueCombatText,advanceCombatTexts} from '../combat-text.js';
import {illuminatedEffect,relicBarHTML} from '../relic-ui.js';

test('wide camera preserves proportions and maps clicks back to exact world positions at every viewport',()=>{
 for(const [width,height]of [[1180,540],[840,400],[320,209],[2004,1308]]){
  const c=arenaCamera(width,height),rect={left:37,top:91,width,height};
  for(const [x,y]of [[170,200],[500,327],[832,504]]){
   const p=arenaPoint(rect.left+(x-c.x)*c.scale,rect.top+(y-c.y)*c.scale,rect);
   assert.ok(Math.abs(p.x-x)<1e-9);assert.ok(Math.abs(p.y-y)<1e-9);
   assert.ok(y>=c.y&&y<=c.y+c.height,'combat floor remains in view');
  }
  assert.equal(c.width*c.scale,width);assert.equal(c.height*c.scale,height);
 }
});
test('reward arcs start at their source, rise above the straight path, and arrive exactly at the destination',()=>{
 const a={x:300,y:520},b={x:900,y:200};assert.deepEqual(rewardArc(a,b,0),a);assert.deepEqual(rewardArc(a,b,1),b);assert.ok(rewardArc(a,b,.5).y<360);
});
test('damage feedback retains exact HP amounts, aggregates status ticks, and gentle motion suppresses travel and pops',()=>{
 const b={time:0,combatTexts:[],textSerial:0},u={uid:'victim',x:500,y:430};queueCombatText(b,u,13.7,'crit');queueCombatText(b,u,2,'status');queueCombatText(b,u,3,'status');
 assert.equal(b.combatTexts[1].amount,5);assert.equal(b.combatTexts.length,2);
 const p=combatTextPresentation(b.combatTexts[0],{reducedMotion:true});assert.equal(p.label,'14');assert.equal(p.caption,'CRITICAL');assert.equal(p.rise,0);assert.equal(p.drift,0);assert.equal(p.scale,1);
 assert.equal(combatTextPresentation({...b.combatTexts[0],kind:'heal'}).label,'+14');advanceCombatTexts(b,2);assert.equal(b.combatTexts.length,0);
});
test('background cover aligns the environmental masks with the same crop as the original painting',()=>{
 assert.deepEqual(coverGeometry(1000,500,2000,1000),{x:0,y:0,w:1000,h:500});assert.deepEqual(coverGeometry(320,844,1536,1024),{x:-473,y:0,w:1266,h:844});
 for(const scene of Object.values(AMBIENT_SCENES))for(const polygon of scene.water||[])for(const p of polygon)assert.ok(p.every(n=>n>=0&&n<=1));
});
test('relic inscriptions preserve effect text and escape HTML while illuminating real numeric values',()=>{
 const html=illuminatedEffect('Every 3 hits: 0.55s root & 18% damage. <script>');assert.ok(html.includes('<em>0.55s</em>'));assert.ok(html.includes('&amp;'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
 const bar=relicBarHTML([{id:'fangs',name:'Twin Fangs',color:'#ff9863'}],()=>'+9% basic attack damage.');assert.ok(bar.includes('data-relic-preview="fangs"'));assert.ok(bar.includes('+9% basic attack damage.'));assert.ok(bar.includes('aria-label="Active expedition relics"'));
 assert.equal(illuminatedEffect("attacker's 3s haste"),"attacker&#39;s <em>3s</em> haste");
});
test('a restored reward screen is settled and defeat never exposes a chest or a pack collection target',()=>{
 const options={gold:31,xp:32,time:10,loot:'',upgrades:'',growth:'',capture:'',casualty:'',continueButton:''};assert.ok(rewardsShell({...options,won:true,reveal:false}).includes('rewards-revealed'));const defeat=rewardsShell({...options,won:false});assert.ok(!defeat.includes('class="reward-chest"'));assert.ok(!defeat.includes('reward-reveal-pending'));assert.ok(!defeat.includes('data-reward-pack'));
});
