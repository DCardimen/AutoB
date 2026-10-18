import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_SPECIES,PIXEL_SPECIES,pixelSpec,lineageLimit} from '../native-content.js';
import {nativePosePixels,NATIVE_POSES} from '../native-poses.js';
import {nativeRigFor,capeSpecification} from '../grand-designs.js';
import {creatureWorldScale,creatureTypeFactor,BASE_CREATURE_SCALE,MIN_CREATURE_TYPE_FACTOR,MAX_CREATURE_TYPE_FACTOR} from '../native-size.js';
import {makeRun as legacyMakeRun,creature,Battle,evolveCreature,stats,relicSlots,equipRelic,linkRelic,personalRelic} from '../game.js';
import {loadoutFor,SKILLS} from '../skills.js';
import {equipmentSlots,claimEvolutionGear,equipGear,removeGear,buyGear,equipmentEffects} from '../creature-equipment.js';
import {characterRig} from '../prototype-rig.js';
import {stepPhysicalCape} from '../native-cloth.js';
import {nativeBladePoint,nativeMuzzle,nativeBodyHeight} from '../native-combat.js';
import {queueCombatText,advanceCombatTexts} from '../combat-text.js';
function battleFixture(id='aurel',form=0){const r=makeRun(62,[id],{native:true});r.team=[creature(id,8)];r.team[0].evolution=form;r.team[0].evolutionPath='wild';return {r,b:new Battle(r,[creature('brakk',8)],62)};}
function mask(p){const points=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(p[(y*64+x)*4+3])points.push([x,y]);const minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),w=Math.max(...points.map(p=>p[0]))-minX+1,h=Math.max(...points.map(p=>p[1]))-minY+1;const out=new Set();for(const [x,y]of points)out.add(Math.floor((x-minX)*32/w)+':'+Math.floor((y-minY)*32/h));return out;}
function silhouetteChange(a,b){const A=mask(a),B=mask(b);return 1-[...A].filter(p=>B.has(p)).length/new Set([...A,...B]).size;}

test('arena uses a readable physical size; all families and evolutions stay within 70–150% of the new default',()=>{
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} ≈ ${b}`);
 near(BASE_CREATURE_SCALE,.4);assert.equal(MIN_CREATURE_TYPE_FACTOR,.7);assert.equal(MAX_CREATURE_TYPE_FACTOR,1.5);assert.equal(PIXEL_SPECIES.length,89);assert.equal(NATIVE_SPECIES.length,29);
 near(creatureWorldScale(pixelSpec('aurel')),.4);near(creatureWorldScale(pixelSpec('luma')),.28);near(creatureWorldScale(pixelSpec('ironscolopendra')),.6);
 assert.equal(creatureTypeFactor(pixelSpec('aurel')),1);assert.equal(creatureTypeFactor(pixelSpec('brakk')),1.3);
 for(const s of PIXEL_SPECIES){assert.ok(nativeRigFor(s));for(const evo of [0,1,2]){const factor=creatureTypeFactor(s,{evolution:evo});assert.ok(factor>=MIN_CREATURE_TYPE_FACTOR&&factor<=MAX_CREATURE_TYPE_FACTOR);}}
 const {b}=battleFixture();near(b.units[0].nativeActor.rigScale,.4);near(b.units[0].radius,44*.4);near(b.units[0].range,56*.4);
});
test('an evolution unlocks an executable skill, a separate gear slot and a support socket without destroying links',()=>{
 const {r}=battleFixture();r.team[0].evolution=0;r.gold=300;const gem=personalRelic('quick-shard');r.inventory=[gem];assert.ok(equipRelic(r,0,gem.uid));assert.ok(linkRelic(r,0,0,'auto-aurel'));
 const c=r.team[0],before=loadoutFor(pixelSpec(c.id),c.level,c),slots=relicSlots(c);assert.ok(evolveCreature(r,0,'wild').success);const after=loadoutFor(pixelSpec(c.id),c.level,c);assert.equal(after.active.length,before.active.length+1);assert.equal(equipmentSlots(c),1);assert.equal(relicSlots(c),slots+1);assert.equal(c.relics[0].link,'auto-aurel');
 const id=after.active.at(-1),b=new Battle(r,[creature('brakk',8)],9);assert.ok(b.units[0].cooldowns[id]);b.units[0].x=b.units[1].x-40;b.units[0].y=b.units[1].y;b.cast(b.units[0],id,b.units[1],1,false,true);assert.equal(b.metrics.skills,1);assert.ok(b.hazards.length||b.projectiles.length||b.effects.length);assert.ok(SKILLS[id].evolutionSkill);
 assert.ok(claimEvolutionGear(r,0,'sunsteel-edge'));assert.equal(claimEvolutionGear(r,0,'sunsteel-edge'),false);const uid=r.gearInventory[0].uid,attack=stats(c,r.team).atk;assert.ok(equipGear(r,0,uid));assert.ok(stats(c,r.team).atk>attack);assert.equal(equipGear(r,0,uid),false);assert.ok(removeGear(r,0,0));assert.equal(stats(c,r.team).atk,attack);
 assert.ok(evolveCreature(r,0,'wild').success);assert.equal(equipmentSlots(c),2);assert.equal(loadoutFor(pixelSpec(c.id),c.level,c).active.length,before.active.length+2);assert.ok(claimEvolutionGear(r,0,'reliquary-plate'));const restored=JSON.parse(JSON.stringify(r));assert.equal(claimEvolutionGear(restored,0,'reliquary-plate'),false);
});
test('equipment respects capacity and applies health, healing, cooldown, speed, shields and poise in combat',()=>{
 const {r}=battleFixture('nyra',2);r.gold=1000;for(const id of ['mooncloth-mantle','citadel-core'])assert.ok(buyGear(r,id,1));for(const g of [...r.gearInventory])assert.ok(equipGear(r,0,g.uid));assert.equal(r.gearInventory.length,0);assert.ok(buyGear(r,'windstep-boots'));assert.equal(equipGear(r,0,r.gearInventory[0].uid),false);
 assert.ok(capeSpecification(pixelSpec('emberhound'),{id:'emberhound',evolution:1,equipment:['mooncloth-mantle']}));
 const c=r.team[0],e=equipmentEffects(c),b=new Battle(r,[creature('brakk')],1);assert.equal(e.cooldown,.92);assert.ok(b.units[0].shield>=38);assert.ok(b.units[0].maxPoise>=54);assert.equal(equipmentSlots(creature('solara')),0);assert.equal(buyGear({...r,gold:0},'sunsteel-edge'),false);
});
test('weapon contacts and projectile origins scale with the same body as the rendered rig',()=>{
 for(const [id,form]of [['aurel',0],['cogwalker',1],['morrow',1],['frostursa',2]]){const {b}=battleFixture(id,form),u=b.units[0],t=b.units[1];assert.equal(u.nativeActor.id,nativeRigFor(pixelSpec(id),u));const point=nativeBladePoint(u,{dx:1,dy:0,style:'overhead'},.8);assert.ok(Number.isFinite(point.x+point.y+point.z));assert.ok(Math.hypot(point.x-u.x,point.y-u.y)<110*u.nativeScale);const m=nativeMuzzle(u,t);assert.ok(Number.isFinite(m.x+m.y+m.z));assert.ok(m.z>0);b.projectile(u,t,u.loadout.auto,1);assert.equal(b.projectiles[0].targetZ,nativeBodyHeight(t));assert.ok(b.projectiles[0].flightTime>0);}
});
test('grand evolution changes normalized anatomy instead of passing on enlargement alone',()=>{
 for(const id of ['aurel','brakk','syl','nyra','emberhound','rowan','cogwalker','moonjelly','morrow','nix','mireclaw','frostursa','crownstag']){const s=pixelSpec(id),changes=[1,2,3,5].map(dir=>silhouetteChange(nativePosePixels(s,{id},'idle',.25,dir),nativePosePixels(s,{id,evolution:1,evolutionPath:'wild'},'idle',.25,dir)));assert.ok(changes.reduce((a,b)=>a+b,0)/changes.length>.19,id+': '+changes.join(','));}
});
test('cloth anchors remain on the shoulders while lower panels lag through a turn and settle above the floor',()=>{
 const spec=pixelSpec('aurel'),c={id:'aurel',evolution:1},cloth=capeSpecification(spec,c),rig=characterRig('knight','idle',.2),a={x:400,y:400,facing:0,vx:0,vy:0,run:150,gait:0,rigScale:.675};
 for(let i=0;i<60;i++)stepPhysicalCape(a,rig,cloth,1/60);const before=structuredClone(a.capeMesh);a.facing=Math.PI/2;stepPhysicalCape(a,rig,cloth,1/60);
 assert.ok(Math.abs(a.capeMesh[2].at(-1).y-before[2].at(-1).y)>2);for(let col=0;col<cloth.columns;col++){const anchor=a.capeMesh[col][0];assert.ok(Math.abs(anchor.x-(rig.body.x-5))<.01);assert.ok(Math.abs(anchor.z-(rig.body.z+7))<.01);}
 for(let i=0;i<120;i++)stepPhysicalCape(a,rig,cloth,1/60);for(const col of a.capeMesh)for(const p of col)assert.ok(Number.isFinite(p.x+p.y+p.z)&&p.z>=3);
});
test('damage text reports actual HP loss and absorbed shield on the victim, aggregates status ticks and fades',()=>{
 const {b}=battleFixture(),u=b.units[0],t=b.units[1];t.shield=20;const old=t.hp;b.damageUnit(t,60,u,u.loadout.auto,0,'hit',false,true);const crit=b.combatTexts.find(t=>t.kind==='crit');assert.ok(crit);assert.equal(crit.uid,t.uid);assert.equal(crit.amount,old-t.hp);assert.equal(b.combatTexts.find(t=>t.kind==='shield').amount,20);
 b.damageUnit(t,2,u,u.loadout.auto,0,'status');b.damageUnit(t,3,u,u.loadout.auto,0,'status');assert.equal(b.combatTexts.filter(t=>t.kind==='status').length,1);assert.equal(b.combatTexts.find(t=>t.kind==='status').amount,5);
 u.hp-=30;b.heal(u,20,u);assert.equal(b.combatTexts.find(t=>t.kind==='heal').uid,u.uid);advanceCombatTexts(b,2);assert.equal(b.combatTexts.length,0);
});
test('every pixel family and form remains within its 64-pixel cell during all combat motions',()=>{
 for(const s of PIXEL_SPECIES)for(let evo=0;evo<=lineageLimit({id:s.id});evo++)for(const path of evo?['wild','warden']:['wild'])for(const state of NATIVE_POSES)for(const dir of [0,1,2,3,4,5,6,7])for(const phase of [0,.43,1]){
  const p=nativePosePixels(s,{id:s.id,evolution:evo,evolutionPath:path},state,phase,dir);assert.equal(p.clipped,0,`${s.id} ${evo} ${path} ${state} ${dir} ${phase}`);
 }
});

test('grandfathered ascended companions retain complete valid loadouts even after their family loses an evolution route',()=>{
 for(const id of ['brakk','rowan','emberhound','solara']){const {r}=battleFixture(id,2),c=r.team[0],l=loadoutFor(pixelSpec(id),8,c);assert.equal(l.active.filter(id=>SKILLS[id].evolutionSkill).length,2);for(const id of l.active)assert.ok(SKILLS[id]);const b=new Battle(r,[creature('aurel')],7);assert.equal(Object.keys(b.units[0].cooldowns).length,l.active.length);}
});

test('raised weapons and fallen bodies stay inside cells at both character-height slider limits',()=>{
 for(const spec of PIXEL_SPECIES)for(let evolution=0;evolution<=spec.evolutionLimit;evolution++)for(const state of ['cast','sprint','death'])for(const height of [.85,1.1])for(let dir=0;dir<8;dir++)for(const phase of [.43,.8]){const pixels=nativePosePixels(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase,dir,height);assert.equal(pixels.clipped,0,`${spec.id} ${evolution} ${state} ${dir} ${height}`);}
});

function makeRun(seed,ids,options={}){return legacyMakeRun(seed,ids,{...options,rulesVersion:11});}
