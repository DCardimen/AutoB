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
export const NATIVE_STARTERS=['aurel','brakk','syl','nyra','emberhound','rowan'];
export const NATIVE_POOLS=[['aurel','syl','nyra','rowan','emberhound','runespider','moonjelly'],['brakk','emberhound','aurel','rowan','cogwalker','nyra','runespider'],['runespider','cogwalker','moonjelly','nyra','aurel','brakk','syl']];
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
export const NATIVE_AUTO_SKILLS=[
 ['aurel','Oathblade','melee',{power:1}],['brakk','Ironjaw Cleave','cleave',{power:1.1,radius:55}],['syl','Thornshaft','bolt',{power:1.05}],['nyra','Silver Spark','bolt',{power:0.85,heal:4}],['emberhound','Packfire Bite','melee',{power:1,burn:1.5}],['rowan','Moontrail Arrow','bolt',{power:1,slow:0.7}],['cogwalker','Brass Cannon','bolt',{power:1.05,radius:35}],['runespider','Venom Fang','melee',{power:0.95,poison:2}],['moonjelly','Pearl Globule','bolt',{power:0.9,heal:5}],
].map(([species,name,kind,params])=>({id:'auto-'+species,species,name,kind,...params,auto:true,icon:'⌁',desc:'Signature '+name.toLowerCase()+'. '+(params.poison?'Poison punishes exposed targets.':params.heal?'Also restores a small amount of allied health.':params.burn?'Leaves a burning wound.':'Uses a committed attack or an aimed physical projectile.')}));
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
export function nativeEvolution(c){return c?.evolution>0?NATIVE_EVOLUTIONS[c.id]?.[c.evolutionPath]||{}:{};}
