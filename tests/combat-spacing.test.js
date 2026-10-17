import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,makeRun,creature,BY_ID} from '../game.js';
import {separateBodies} from '../arena.js';
import {combatApproach} from '../native-tactics.js';
import {DEFAULT_TUNING} from '../tuning.js';
import {PIXEL_SPECIES} from '../native-content.js';

function arena(ids=['aurel'],foes=['brakk']){
 const run=makeRun(137,['aurel']);run.team=ids.map(id=>({...creature(id),equipment:[],relics:[]}));run.relics=[];run.teamCapacity=6;
 const b=new Battle(run,foes.map(id=>({...creature(id),equipment:[],relics:[]})),137,{visuals:false});
 for(const u of b.units){u.hp=u.maxHp=10000;u.shield=0;u.dodgeCooldown=999;Object.values(u.cooldowns).forEach(cd=>cd.remaining=999);}
 return b;
}
function clearance(units){let result=Infinity;for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)result=Math.min(result,Math.hypot(units[i].x-units[j].x,units[i].y-units[j].y)-units[i].radius-units[j].radius);return result;}

test('native bodies occupy their visible ground footprint and retain weight across size controls',()=>{
 const b=arena(['aurel','cogwalker'],['grit']);for(const u of b.units)assert.ok(u.radius>=44*u.nativeScale);
 const heavy=b.units[1],light=b.units[2];assert.ok(heavy.mass>light.mass*2);
 const radius=heavy.radius,mass=heavy.mass;b.setTuning({...DEFAULT_TUNING,spriteSize:200});assert.equal(heavy.radius,radius*2);assert.equal(heavy.mass,mass*2);
});
test('a crowded mixed-mass pile separates in two dimensions without pushing through arena walls',()=>{
 const bounds={left:0,right:300,top:0,bottom:300},units=Array.from({length:12},(_,i)=>({uid:String(i),x:150,y:150,radius:10,mass:i%3+1,hp:100,side:i%2}));
 for(let i=0;i<6;i++)separateBodies(units,bounds);
 assert.ok(clearance(units)>-.05,clearance(units));assert.ok(new Set(units.map(u=>Math.round(u.y))).size>4);
 for(const u of units)assert.ok(u.x>=10&&u.x<=290&&u.y>=10&&u.y<=290);
});
test('fast opposing dashes cannot tunnel through each other between fixed steps',()=>{
 const a={x:130,y:100,px:70,py:100,radius:10,mass:3,hp:100},b={x:70,y:100,px:130,py:100,radius:10,mass:1,hp:100};
 separateBodies([a,b],{left:0,right:300,top:0,bottom:300});assert.ok(a.x<b.x);assert.ok(b.x-a.x>=19.98);
});
test('allies reserve different reachable approach positions around a shared opponent',()=>{
 const b=arena(['aurel','brakk','brom'],['grum']),target=b.units.at(-1);target.x=500;target.y=400;
 for(const u of b.units.slice(0,-1)){u.x=350;u.y=400;combatApproach(u,target,b.units,b.bounds);}
 const goals=b.units.slice(0,-1).map(u=>({...u,...u.engagement}));assert.ok(clearance(goals)>-.1,clearance(goals));
 for(const u of goals)assert.ok(Math.hypot(u.x-target.x,u.y-target.y)<=u.range+target.radius+2);
});
test('melee approaches, commits, contacts and recovers while both bodies stay apart',()=>{
 const b=arena(),[a,t]=b.units;a.x=a.px=400;a.y=a.py=400;t.x=t.px=470;t.y=t.py=400;
 let windup=false,recovery=false,impact=false,min=Infinity;
 for(let i=0;i<600;i++){b.step(1/60);min=Math.min(min,clearance(b.units));windup||=!!a.nativeAction&&!a.nativeAction.released;recovery||=!!a.nativeAction?.released;impact||=t.hp<10000;}
 assert.ok(min>-.1,`overlap ${min}`);assert.ok(windup&&recovery&&impact);assert.ok(b.metrics.bladeContacts>0);
});
test('six versus six retain solid footprints through pursuit, crowding and knockback',()=>{
 const b=arena(['aurel','brakk','brom','emberhound','grit','runespider'],['pyrehorn','flintback','mireclaw','crownstag','nightmaw','orchimantis']);let min=Infinity;
 for(let i=0;i<900;i++){b.step(1/60);min=Math.min(min,clearance(b.units));assert.ok(b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));}
 assert.ok(min>-.15,`overlap ${min}`);assert.ok(b.metrics.bladeContacts>20,b.metrics.bladeContacts);assert.ok(new Set(b.units.map(u=>Math.round(u.y/10))).size>4);
});
test('a distant committed swing cannot deal identity-based damage',()=>{
 const b=arena(),[a,t]=b.units;a.speed=t.speed=0;a.x=a.px=350;t.x=t.px=650;a.y=a.py=t.y=t.py=400;
 b.beginStrike(a,t,a.loadout.auto);for(let i=0;i<40;i++)b.step(1/60);assert.equal(t.hp,10000);assert.ok(b.metrics.whiffs>0);
});
test('heavy bodies recoil less than light bodies from the same connected impact',()=>{
 const b=arena(['aurel'],['cogwalker','grit']),[a,heavy,light]=b.units;a.x=300;a.y=heavy.y=light.y=400;heavy.x=light.x=400;
 b.applyImpact(heavy,a,30,false);b.applyImpact(light,a,30,false);assert.ok(light.impulseX>heavy.impulseX*2);
});
test('every melee companion and form reaches actual authored contact from all eight approach directions',()=>{
 const failures=[];let cases=0;
 for(const spec of PIXEL_SPECIES.filter(s=>BY_ID[s.id]?.range<100))for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  const run=makeRun(19,['aurel'],{native:true});run.relics=[];run.team=[{...creature(spec.id),evolution,evolutionPath:'wild',equipment:[],relics:[]}];
  const b=new Battle(run,[creature('aurel')],19,{visuals:false}),[u,t]=b.units;
  for(const a of b.units){a.hp=a.maxHp=10000;a.shield=0;a.dodgeCooldown=999;Object.values(a.cooldowns).forEach(cd=>cd.remaining=999);}
  const angle=dir*Math.PI/4;t.x=t.px=500;t.y=t.py=430;u.x=u.px=500-Math.cos(angle)*50;u.y=u.py=430-Math.sin(angle)*50;u.facing=angle;t.speed=0;t.attackTimer=999;
  for(let i=0;i<480;i++)b.step(1/60);cases++;if(!b.metrics.bladeContacts)failures.push(`${spec.id}/${evolution}/${dir}`);
 }
 assert.equal(cases,1128);assert.deepEqual(failures,[],'body footprints must leave every authored attack physically reachable: '+JSON.stringify(failures));
});

test('offensive abilities wait for actual range while shields and healing keep their support rules',()=>{
 const b=arena(['syl'],['brakk']),[u,t]=b.units;u.x=300;u.y=400;t.x=800;t.y=400;
 assert.equal(b.shouldCast(u,'syl'),false);t.x=450;assert.equal(b.shouldCast(u,'syl'),true);
 u.policy='execute';t.x=800;assert.equal(b.shouldCast(u,'syl'),false,'execute priority cannot bypass ability range');
});
