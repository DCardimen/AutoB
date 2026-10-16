import test from 'node:test';
import assert from 'node:assert/strict';
import {creature,stats,makeRun,Battle,SPECIES,nextLevelPreview} from '../game.js';
import {SKILLS} from '../skills.js';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const model=(id,level=1)=>({...creature(id,level),balanceVersion:17,equipmentVersion:2,equipment:[]});
const faster=['attackSpeed','actionSpeed','staminaRecharge','speed','dodge','hpRegen'];

test('Common secondary gains are modest and preserve level-one rates',()=>{
 const c=model('aurel'),base=stats(c,[c]),next=stats({...c,level:2},[{...c,level:2}]);
 close(base.attackSpeed,1/1.55);close(base.actionSpeed,1);close(base.staminaRecharge,15);
 close(base.cd,SKILLS.aurel.cd);close(base.dashCooldown,1);close(base.hpRegen,0);close(base.dodge,.045);
 close(next.attackSpeed/base.attackSpeed,1.0125);close(next.actionSpeed/base.actionSpeed,1.01);
 close(next.staminaRecharge/base.staminaRecharge,1.015);close(next.speed/base.speed,1.005);
 close(next.cd/base.cd,1/1.01);close(next.dashCooldown,1/1.01);close(next.hpRegen,.04);close(next.dodge-base.dodge,.0005);
});

test('all companion families gain secondary stats and preview their actual next level without mutation',()=>{
 for(const spec of SPECIES){
  const c=model(spec.id,3);c.equipment=['ruby-vigor-ring'];c.genes={hp:1.1,atk:.95,cd:.9,speed:1.1};
  const before=JSON.stringify(c),preview=nextLevelPreview(c,[c],['clock']);
  assert.deepEqual(preview.next,stats({...c,level:4},[{...c,level:4}],['clock']));
  for(const key of faster)assert.ok(preview.next[key]>preview.current[key],spec.id+' '+key);
  for(const key of ['cd','cdFactor','dashCooldown'])assert.ok(preview.next[key]<preview.current[key],spec.id+' '+key);
  assert.equal(JSON.stringify(c),before);
 }
});

test('secondary gains rise with rarity but remain much smaller than primary growth',()=>{
 let previous=0;
 for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary']){
  const spec=SPECIES.find(s=>s.rarity===rarity),c=model(spec.id),base=stats(c,[c]),next=stats({...c,level:2},[{...c,level:2}]);
  const increase=next.attackSpeed/base.attackSpeed-1;assert.ok(increase>previous&&increase<.022);previous=increase;
  assert.ok(next.staminaRecharge/base.staminaRecharge<1.026);
 }
});

test('cooldown haste stays positive and dodge growth stays bounded at extreme levels',()=>{
 const c=model('solara',10000),st=stats(c,[c]);
 assert.ok(st.cd>0&&st.cdFactor>0&&st.dashCooldown>0);close(st.dodge,.105);
});

test('legacy secondary rates remain unchanged',()=>{
 const c={...model('aurel'),balanceVersion:16},base=stats(c,[c]),later=stats({...c,level:4},[{...c,level:4}]);
 for(const key of [...faster,'cd','cdFactor','dashCooldown'])close(base[key],later[key]);
});

test('live combat consumes improved rates, regeneration and skill cooldowns',()=>{
 const run=makeRun(12,['aurel','brakk']);run.team[0]={...run.team[0],level:4,equipment:[]};
 const c=run.team[0],expected=stats(c,run.team,run.relics),battle=new Battle(run,[creature('syl')],12,{visuals:false}),u=battle.units[0];
 for(const key of [...faster,'cdFactor','dashCooldown'])close(u[key],expected[key]);
 assert.ok(Object.values(u.cooldowns).every(cd=>cd.total>0));
 for(const unit of battle.units){unit.speed=0;unit.attackTimer=999;unit.dodgeCooldown=999;Object.values(unit.cooldowns).forEach(cd=>cd.remaining=999);}
 u.hp=u.maxHp/2;const hp=u.hp;battle.step(.04);close(u.hp-hp,expected.hpRegen*.04);
});
