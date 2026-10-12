import {GRAND_BATCH,GRAND_ACTIVE_SKILLS,GRAND_AUTO_SKILLS} from './native-batch-two.js';
import {LEGACY_PIXEL_SPECIES} from './pixel-legacy.js';
import {buildEvolutionSkills} from './evolution-skills.js';
import {ROSTER_BATCH,BATCH_ACTIVE_SKILLS,BATCH_AUTO_SKILLS,BATCH_EVOLUTIONS} from './native-batch.js';
// Released native families. The unrelated expedition.js draft stays untouched.
export const NATIVE_SPECIES = [
 {id:'aurel',name:'Aurel',evolvedName:'Dawn Paladin',nativeRig:'knight',element:'tide',role:'Guardian',rarity:'Common',shape:'humanoid',hp:335,atk:23,speed:76,range:56,cd:10,trait:'intercept',habitat:0,skill:'Oathwall',skillDesc:'Shield nearby allies and draw attacks away from fragile companions.'},
 {id:'brakk',name:'Brakk',evolvedName:'Ironjaw',nativeRig:'orc',element:'ember',role:'Striker',rarity:'Common',shape:'humanoid',hp:290,atk:32,speed:70,range:58,cd:11,trait:'retaliation',habitat:1,skill:'Sundering Rush',skillDesc:'A committed charge cracks shields and roots the frontline.'},
 {id:'syl',name:'Syl',evolvedName:'Sylvan Huntress',nativeRig:'elf',element:'grove',role:'Ranger',rarity:'Common',shape:'humanoid',hp:220,atk:27,speed:98,range:245,cd:9,trait:'marksman',habitat:0,skill:'Briar Volley',skillDesc:'Plant a delayed root field under a cluster of enemies.'},
 {id:'nyra',name:'Nyra',evolvedName:'Astral Oracle',nativeRig:'caster',element:'storm',role:'Support',rarity:'Uncommon',shape:'humanoid',hp:245,atk:20,speed:82,range:235,cd:8,trait:'medic',habitat:0,skill:'Silver Sanctuary',skillDesc:'Heal and cleanse the weakest ally; protect your caster to sustain the team.'},
 {id:'emberhound',name:'Emberhound',evolvedName:'Ashhowl Alpha',nativeRig:'wolf',element:'ember',role:'Striker',rarity:'Common',shape:'fox',hp:235,atk:28,speed:112,range:46,cd:8,trait:'pack',habitat:1,skill:'Packfire Leap',skillDesc:'Physically pounce on the backline and leave a burning wound.'},
 {id:'rowan',name:'Rowan',evolvedName:'Moontrail Ranger',nativeRig:'fox',element:'grove',role:'Ranger',rarity:'Common',shape:'humanoid',hp:235,atk:25,speed:92,range:230,cd:10,trait:'pin',habitat:0,skill:'Moontrail Fan',skillDesc:'A spread of aimed shots pressures multiple targets and exposes them.'},
 {id:'cogwalker',name:'Cogwalker',evolvedName:'Runeforge Walker',nativeRig:'mech',element:'storm',role:'Guardian',rarity:'Rare',shape:'golem',hp:390,atk:27,speed:62,range:240,cd:12,trait:'battery',habitat:1,skill:'Reactor Mortar',skillDesc:'A slow, telegraphed blast punishes stationary clusters.'},
 {id:'runespider',name:'Runespider',evolvedName:'Venom Matriarch',nativeRig:'spider',element:'void',role:'Striker',rarity:'Rare',shape:'spider',hp:245,atk:29,speed:102,range:48,cd:9,trait:'poisoner',habitat:2,skill:'Silken Ambush',skillDesc:'A physical ambush applies poison and binds an isolated victim.'},
 {id:'moonjelly',name:'Moonjelly',evolvedName:'Lunar Sovereign',nativeRig:'jelly',element:'tide',role:'Support',rarity:'Legendary',shape:'jelly',hp:330,atk:25,speed:76,range:220,cd:11,trait:'overflow',habitat:2,skill:'Pearl Tide',skillDesc:'Heal the whole team and create a short haste window.'},
].map((s,i)=>({...s,artSheet:'native',artIndex:i,power:1,personality:['disciplined','opportunist','territorial'][i%3]}));
NATIVE_SPECIES.push(...ROSTER_BATCH,...GRAND_BATCH);
for(const s of NATIVE_SPECIES){
 s.evolutionLimit??=({brakk:1,emberhound:1,rowan:1,cogwalker:1}[s.id]??2);
 s.accomplishment??={key:s.role==='Support'?'healed':s.role==='Guardian'?'shielded':s.role==='Ranger'?'skills':'damage',target:s.role==='Support'?240:s.role==='Guardian'?160:s.role==='Ranger'?8:500};
 s.nativeDesign??=s.nativeRig;
 s.powerBand=['grit','morrow'].includes(s.id)?'Modest':['Epic','Legendary'].includes(s.rarity)?'Strong':'Steady';
}
Object.assign(NATIVE_SPECIES.find(s=>s.id==='grit'),{hp:185,atk:21});
Object.assign(NATIVE_SPECIES.find(s=>s.id==='morrow'),{hp:205,atk:23});
export const NATIVE_STARTERS=['aurel','brakk','syl','nyra','emberhound','rowan'];
export const NATIVE_POOLS=[['aurel','syl','nyra','rowan','emberhound','runespider','moonjelly'],['brakk','emberhound','aurel','rowan','cogwalker','nyra','runespider'],['runespider','cogwalker','moonjelly','nyra','aurel','brakk','syl']];
for(const s of [...ROSTER_BATCH,...GRAND_BATCH])NATIVE_POOLS[s.habitat].push(s.id);
export const NATIVE_BOSS_RIGS={elderoot:'mech',solwyrm:'wolf',abyssal:'orc'};
export const NATIVE_ACTIVE_SKILLS=[
 {id:'aurel',name:'Oathwall',kind:'shield',shield:70,taunt:2.5,radius:190,cd:10},
 {id:'brakk',name:'Sundering Rush',kind:'charge',power:2.2,shieldPierce:0.35,root:0.5,cd:11},
 {id:'syl',name:'Briar Volley',kind:'blast',power:1.6,radius:85,delay:0.8,root:1.4,cd:9},
 {id:'nyra',name:'Silver Sanctuary',kind:'heal',heal:82,cleanse:true,cd:8},
 {id:'emberhound',name:'Packfire Leap',kind:'dash',power:2.2,burn:3,backline:true,cd:8},
 {id:'rowan',name:'Moontrail Fan',kind:'salvo',power:1.15,targets:3,cd:10},
 {id:'cogwalker',name:'Reactor Mortar',kind:'blast',power:2.1,radius:105,delay:1,cd:12},
 {id:'runespider',name:'Silken Ambush',kind:'dash',power:2,poison:5,root:0.7,backline:true,cd:9},
 {id:'moonjelly',name:'Pearl Tide',kind:'heal-all',heal:42,haste:2.5,cd:11},
].map(s=>({...s,icon:'✦',desc:NATIVE_SPECIES.find(c=>c.id===s.id).skillDesc}));
NATIVE_ACTIVE_SKILLS.push(...BATCH_ACTIVE_SKILLS,...GRAND_ACTIVE_SKILLS);
export const NATIVE_AUTO_SKILLS=[
 ['aurel','Oathblade','melee',{power:1}],['brakk','Ironjaw Cleave','cleave',{power:1.1,radius:55}],['syl','Thornshaft','bolt',{power:1.05}],['nyra','Silver Spark','bolt',{power:0.85,heal:4}],['emberhound','Packfire Bite','melee',{power:1,burn:1.5}],['rowan','Moontrail Arrow','bolt',{power:1,slow:0.7}],['cogwalker','Brass Cannon','bolt',{power:1.05,radius:35}],['runespider','Venom Fang','melee',{power:0.95,poison:2}],['moonjelly','Pearl Globule','bolt',{power:0.9,heal:5}],
].map(([species,name,kind,params])=>({id:'auto-'+species,species,name,kind,...params,auto:true,icon:'⌁',desc:'Signature '+name.toLowerCase()+'. '+(params.poison?'Poison punishes exposed targets.':params.heal?'Also restores a small amount of allied health.':params.burn?'Leaves a burning wound.':'Uses a committed attack or an aimed physical projectile.')}));
NATIVE_AUTO_SKILLS.push(...BATCH_AUTO_SKILLS,...GRAND_AUTO_SKILLS);
export const NATIVE_EVOLUTIONS={
 aurel:{wild:{name:'Dawn Reaver',desc:'Charged sword strikes deal 2× attack.',chargeDamage:2},warden:{name:'Oathkeeper',desc:'Charged strikes cost 20 stamina, making room for more dodges.',chargeCost:20}},
 brakk:{wild:{name:'Ironjaw Berserker',desc:'Charged axe strikes deal 2.05× attack.',chargeDamage:2.05},warden:{name:'Ironjaw Defender',desc:'+24 poise capacity; hold through heavier impacts.',poise:24}},
 syl:{wild:{name:'Thorn Huntress',desc:'Arrows bypass 20% of shields.',pierce:0.2},warden:{name:'Briar Warden',desc:'Move 12% faster and reach 25 farther to kite threats.',speed:1.12,range:25}},
 nyra:{wild:{name:'Astral Spellweaver',desc:'Healing is 15% stronger.',healing:1.15},warden:{name:'Silver Lifekeeper',desc:'+18 poise capacity protects healing windows.',poise:18}},
 emberhound:{wild:{name:'Ashhowl Pursuer',desc:'Move 15% faster when hunting the backline.',speed:1.15},warden:{name:'Ashhowl Protector',desc:'+20 poise capacity and cheaper 22-stamina charges.',poise:20,chargeCost:22}},
 rowan:{wild:{name:'Moontrail Deadeye',desc:'Arrows bypass 18% of shields.',pierce:0.18},warden:{name:'Moontrail Scout',desc:'+30 reach opens safer firing positions.',range:30}},
 cogwalker:{wild:{name:'Runeforge Artillery',desc:'Blast fields are 22% wider.',area:1.22},warden:{name:'Runeforge Bastion',desc:'+30 poise capacity strengthens the six-legged anchor.',poise:30}},
 runespider:{wild:{name:'Venom Matriarch',desc:'Poison lasts 1.5 seconds longer.',poison:1.5},warden:{name:'Silken Sentinel',desc:'Bites briefly root their victims for 0.3 seconds.',root:0.3}},
 moonjelly:{wild:{name:'Lunar Conductor',desc:'Healing is 18% stronger.',healing:1.18},warden:{name:'Pearl Sovereign',desc:'Move 12% faster and gain +22 poise capacity.',speed:1.12,poise:22}},
};
Object.assign(NATIVE_EVOLUTIONS,BATCH_EVOLUTIONS);
const upgrades={
 aurel:{wild:{signature:{slow:2}},warden:{signature:{radius:230,shield:85}}},
 brakk:{wild:{signature:{burn:3}},warden:{signature:{root:1.2,shieldPierce:.5}}},
 syl:{wild:{signature:{poison:3}},warden:{signature:{root:2,radius:100}}},
 nyra:{wild:{signature:{heal:95}},warden:{signature:{heal:82,cd:6.8}}},
 emberhound:{wild:{signature:{burn:5}},warden:{signature:{root:.8}}},
 rowan:{wild:{signature:{targets:4}},warden:{signature:{slow:2}}},
 cogwalker:{wild:{signature:{burn:3}},warden:{signature:{root:1.2}}},
 runespider:{wild:{signature:{poison:7}},warden:{signature:{root:1.4}}},
 moonjelly:{wild:{signature:{haste:4}},warden:{signature:{shield:30,cleanse:true}}},
};
for(const [id,paths]of Object.entries(upgrades))for(const [path,override]of Object.entries(paths))Object.assign(NATIVE_EVOLUTIONS[id][path],override);
export function nativeEvolution(c){return c?.evolution>0?NATIVE_EVOLUTIONS[c.id]?.[c.evolutionPath]||{}:{};}
export function nativeSkill(c,def){
 if(!def)return def;
 const evo=nativeEvolution(c),override=def.id===c.id?evo.signature:def.id==='auto-'+c.id?evo.auto:null;
 return override?{...def,...override,desc:def.desc+' '+evo.name+': '+evo.desc}:def;
}
export function nativePool(run,type){return NATIVE_POOLS[run.planet].filter(id=>{const s=NATIVE_SPECIES.find(s=>s.id===id);return s?.recruit!=='elite'||['elite','capture','boss'].includes(type);});}
export function lineageLimit(c){return Math.max(c?.evolution||0,NATIVE_SPECIES.find(s=>s.id===c?.id)?.evolutionLimit??2);}
export const ACCOMPLISHMENT_NAMES={damage:'damage dealt',damageTaken:'damage endured',shielded:'damage absorbed by shields',healed:'health restored',dodges:'physical dodges',kills:'knockouts',skills:'cooldown skills resolved'};
export function lineageProgress(c){
 const s=NATIVE_SPECIES.find(s=>s.id===c.id);if(!s)return null;
 const goal=s.accomplishment,stage=c.evolution||0,target=goal.target*(stage?2.5:1),value=c.accomplishments?.[goal.key]||0;
 return {key:goal.key,label:ACCOMPLISHMENT_NAMES[goal.key],value:Math.floor(value),target:Math.ceil(target),ready:value>=target,minimumLevel:stage?6:3};
}
export function settleNativeGrowth(run,battle){
 if(!battle?.done||!battle.growthKey||run.growthSettlements?.includes(battle.growthKey))return false;
 run.growthSettlements??=[];run.growthSettlements.push(battle.growthKey);
 for(const c of run.team){if(!NATIVE_SPECIES.some(s=>s.id===c.id))continue;const u=battle.units.find(u=>u.uid===c.uid&&u.side===0);if(!u)continue;
  c.accomplishments??={};const values={damage:u.damage,damageTaken:u.damageTaken,shielded:u.shieldAbsorbed,healed:u.healed,dodges:u.rollCount,kills:u.kills,skills:u.nativeResolvedSkills||0};
  for(const [key,value]of Object.entries(values))c.accomplishments[key]=(c.accomplishments[key]||0)+Math.max(0,Number(value)||0);
 }
 return true;
}

export const PIXEL_SPECIES=[...LEGACY_PIXEL_SPECIES,...NATIVE_SPECIES];
const pixelRegistry=Object.fromEntries(PIXEL_SPECIES.map(s=>[s.id,s]));
export function pixelSpec(s){return pixelRegistry[typeof s==='string'?s:s.id]||s;}
export const NATIVE_FORM_SKILLS=buildEvolutionSkills(PIXEL_SPECIES);
for(const s of GRAND_BATCH)if(s.evolutionLimit)NATIVE_EVOLUTIONS[s.id]={wild:{name:s.name+' Ravager',desc:'A grand, armored transformation with an exclusive cooldown skill.',speed:1.1},warden:{name:s.name+' Sovereign',desc:'A grand guardian transformation with a new protective cooldown skill.',poise:25}};
