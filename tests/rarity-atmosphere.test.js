import test from 'node:test';
import assert from 'node:assert/strict';
import {auraProfile,auraOrbit} from '../rarity-aura.js';
import {captureCelebrationProfile} from '../capture-celebration.js';
import {chestFrameBlend} from '../rewards-ui.js';
import {ELITE_TIER_STRENGTH,eliteTierForSeed,eliteModifier,ELITE_MODIFIERS} from '../elite-modifiers.js';
import {makeRun,encounter,BY_ID,creature,stats,settleCaptureRecruitment,nextLevelPreview,LEVEL_GROWTH} from '../game.js';
test('aura size scales uniformly without changing rarity, team identity or the battle fade',()=>{
 const base=auraProfile('Legendary'),small=auraProfile('Legendary',{size:25}),large=auraProfile('Legendary',{size:200,side:1,battle:true});
 assert.equal(base.size,1);assert.equal(small.size,.25);assert.equal(large.size,2);
 assert.equal(small.radius,base.radius);assert.equal(large.tier,base.tier);assert.equal(large.row,1);assert.equal(large.opacity,base.opacity*.2);
});

test('rarity art increases monotonically, both teams use their authored rows, and battle opacity is exactly 20%',()=>{
 let tier=-1,alpha=-1;
 for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary']){
  const prep=auraProfile(rarity),live=auraProfile(rarity,{battle:true,side:1});
  assert.ok(prep.tier>tier);assert.ok(prep.opacity>alpha);assert.equal(live.opacity,prep.opacity*.2);assert.equal(live.row,1);assert.equal(prep.row,0);tier=prep.tier;alpha=prep.opacity;
 }
 for(const t of [Math.PI/.85,Math.PI*1.5/.85,Math.PI*1.99/.85])assert.equal(auraOrbit(t).visible,false,'rear orbit completely hidden');
 assert.equal(auraOrbit(Math.PI*.5/.85).visible,true);
 assert.deepEqual(auraOrbit(5,{reducedMotion:true}),auraOrbit(100,{reducedMotion:true}));
});
test('capture celebrations grow in confetti, beams, streamers and duration with actual rarity',()=>{
 const profiles=['Common','Uncommon','Rare','Epic','Legendary'].map(captureCelebrationProfile);
 for(let i=1;i<profiles.length;i++)for(const key of ['confetti','beams','streamers','duration'])assert.ok(profiles[i][key]>profiles[i-1][key]);
});
test('chest blends adjacent original frames continuously, easing at both ends',()=>{
 let previous=0;
 for(let i=0;i<=1000;i++){const b=chestFrameBlend(i/1000),position=b.from+b.mix;assert.ok(position>=previous);assert.ok(position-previous<.03);assert.ok(b.to-b.from<=1);previous=position;}
 assert.equal(chestFrameBlend(0).from,0);assert.equal(chestFrameBlend(1).to,11);
});
test('elite tier IV remains the base; III, II, I multiply only the buff by successive 20%',()=>{
 const c=creature('aurel',4),plain=stats(c,[c]);
 for(const m of ELITE_MODIFIERS)for(const tier of [4,3,2,1]){
  const u={...c,eliteModifier:m.id,eliteTier:tier},buff=eliteModifier(u),actual=stats(u,[u]),amount=m.amount*ELITE_TIER_STRENGTH[tier];
  assert.ok(Math.abs(buff.amount-amount)<1e-10);assert.match(buff.tierLabel,/Tier/);
  assert.ok(Math.abs(actual[m.stat]-(m.flat?plain[m.stat]+amount:plain[m.stat]*(1+amount)))<1e-8,m.id+' tier '+tier);
 }
 const counts={1:0,2:0,3:0,4:0};for(let seed=0;seed<10000;seed++)counts[eliteTierForSeed(seed)]++;
 assert.ok(counts[4]>counts[3]&&counts[3]>counts[2]&&counts[2]>counts[1]);assert.ok(counts[4]>6000);
 const r=makeRun(3),enemy={...creature('brakk'),eliteModifier:'warbrand-random',eliteTier:1},result={success:true,uid:enemy.uid,creature:enemy};settleCaptureRecruitment(r,result);assert.equal(r.bench[0].eliteTier,1);
});
test('ordinary first-world rooms are safe from rare packs; Chaos explicitly restores early rarity pressure',()=>{
 const r=makeRun(8,['aurel','brakk']);let highChaosRares=0;
 for(let depth=0;depth<8;depth++)for(let seed=0;seed<300;seed++){
  r.depth=depth;r.difficulty='standard';const foes=encounter(r,'battle',seed),rare=foes.filter(c=>['Rare','Epic','Legendary'].includes(BY_ID[c.id].rarity));
  assert.ok(rare.length<=(depth<3?0:1));assert.ok(foes.every(c=>!['Epic','Legendary'].includes(BY_ID[c.id].rarity)));
  r.difficulty='chaos';r.chaos=16;highChaosRares+=encounter(r,'battle',seed).filter(c=>['Rare','Epic','Legendary'].includes(BY_ID[c.id].rarity)).length;
 }
 assert.ok(highChaosRares>500);
 r.depth=0;r.difficulty='standard';assert.ok(Array.from({length:100},(_,i)=>encounter(r,'elite',i)).flat().some(c=>['Rare','Epic','Legendary'].includes(BY_ID[c.id].rarity)),'elite encounters retain their dangerous rarity pool');
});

test('higher rarity grows faster, previews equal the actual next-level build, without mutation',()=>{
 const r=makeRun(5,['aurel']);let previous=0;
 for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary']){
  const id=Object.values(BY_ID).find(s=>s.rarity===rarity&&!s.boss).id,c={...creature(id,3),balanceVersion:17,equipmentVersion:2,equipment:['ruby-vigor-ring'],genes:{hp:1.1,atk:.9}};
  const before=JSON.stringify(c),preview=nextLevelPreview(c,[c],['fangs']);assert.ok(preview.growthRate>previous);previous=preview.growthRate;
  assert.deepEqual(preview.next,stats({...c,level:4},[{...c,level:4}],['fangs']));assert.equal(JSON.stringify(c),before);assert.equal(preview.growthRate,LEVEL_GROWTH[rarity]);assert.ok(preview.next.hp>preview.current.hp);
 }
});
