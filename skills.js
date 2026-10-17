import {evolutionSkillIds} from './evolution-skills.js';
import { NATIVE_ACTIVE_SKILLS, NATIVE_AUTO_SKILLS, NATIVE_FORM_SKILLS, PIXEL_SPECIES, pixelSpec } from './native-content.js';
import { EXPANSION_ACTIVE_SKILLS, EXPANSION_AUTO_SKILLS } from "./roster.js";
// 128 abilities: 60 signature auto-attacks + 68 active cooldown skills.
export const ACTIVE_SKILLS = [
  {
    id: "cinderfox",
    name: "Solar Pounce",
    icon: "⌁",
    kind: "dash",
    cd: 8,
    power: 2.4,
    burn: 4,
    color: "#ffad62",
    desc: "Leap at a wounded enemy. A searing bite deals 240% attack and burns for 4s.",
  },
  {
    id: "mossguard",
    name: "Living Bulwark",
    icon: "◒",
    kind: "shield",
    cd: 10,
    shield: 65,
    taunt: 3,
    radius: 210,
    color: "#b4d48b",
    desc: "Grow a living barrier. Nearby allies gain 65 shield; taunt foes for 3s.",
  },
  {
    id: "brookfin",
    name: "Mending Current",
    icon: "≈",
    kind: "heal",
    cd: 8,
    heal: 75,
    cleanse: true,
    color: "#91dce9",
    desc: "A restorative current heals the weakest ally for 75 HP and cleanses burn and poison.",
  },
  {
    id: "voltwing",
    name: "Chain Lightning",
    icon: "ϟ",
    kind: "chain",
    cd: 9,
    power: 1.6,
    targets: 3,
    color: "#d4bdff",
    desc: "Lightning leaps between three enemies, dealing 160% attack to each.",
  },
  {
    id: "pyrehorn",
    name: "Seismic Charge",
    icon: "▴",
    kind: "charge",
    cd: 11,
    power: 2.1,
    radius: 95,
    root: 0.6,
    color: "#ffaf78",
    desc: "Crash into the frontline. A 210% attack shockwave briefly roots nearby enemies.",
  },
  {
    id: "bloomkin",
    name: "Wild Bloom",
    icon: "❋",
    kind: "heal-all",
    cd: 12,
    heal: 38,
    haste: 3,
    color: "#c8de99",
    desc: "Heal all allies for 38 HP. Floral spores hasten their attacks for 3s.",
  },
  {
    id: "glacier",
    name: "Glacial Prism",
    icon: "◇",
    kind: "shield",
    cd: 12,
    shield: 80,
    all: true,
    slow: 4,
    color: "#9ce1f0",
    desc: "Encapsulate the team in 80 shield. A freezing pulse slows nearby enemies for 4s.",
  },
  {
    id: "thornstag",
    name: "Briar Lance",
    icon: "↗",
    kind: "beam",
    cd: 9,
    power: 3,
    root: 2,
    color: "#c0e494",
    desc: "A piercing lance of thorns deals 300% attack and roots its primary target for 2s.",
  },
  {
    id: "nightmaw",
    name: "Shadow Step",
    icon: "✧",
    kind: "blink",
    cd: 9,
    power: 3,
    backline: true,
    lifesteal: 0.2,
    color: "#bd9ef0",
    desc: "Vanish and ambush a backline enemy for 300% attack. Restore 20% damage as health.",
  },
  {
    id: "sparkhare",
    name: "Static Rush",
    icon: "ϟ",
    kind: "dash",
    cd: 7,
    power: 2.5,
    evade: 2,
    color: "#d3c4ff",
    desc: "A lightning-fast dash deals 250% attack and grants high evasion for 2s.",
  },
  {
    id: "solwyrm",
    name: "Sunfire Breath",
    icon: "♨",
    kind: "breath",
    cd: 11,
    power: 3,
    burn: 5,
    radius: 120,
    color: "#ffab61",
    desc: "Exhale a scorching cone for 300% attack. Every target hit burns for 5s.",
  },
  {
    id: "lunacrest",
    name: "Lunar Tide",
    icon: "☾",
    kind: "heal-all",
    cd: 11,
    heal: 55,
    shield: 35,
    color: "#a9e2ea",
    desc: "Moonlight washes over the team, restoring 55 health and granting 35 shield.",
  },
  {
    id: "astralisk",
    name: "Void Rupture",
    icon: "✺",
    kind: "blast",
    cd: 10,
    power: 3,
    radius: 100,
    delay: 1.1,
    color: "#cb9ff8",
    desc: "Open a delayed singularity. After 1.1s, a void detonation deals 300% area damage.",
  },
  {
    id: "tempest",
    name: "Storm Volley",
    icon: "↯",
    kind: "volley",
    cd: 9,
    power: 2.8,
    radius: 100,
    delay: 0.9,
    color: "#dcc6ff",
    desc: "Mark a storm zone. Three lightning strikes converge for 280% area damage.",
  },
  {
    id: "duskcap",
    name: "Dream Spores",
    icon: "✺",
    kind: "spores",
    cd: 9,
    heal: 65,
    power: 0.9,
    poison: 6,
    color: "#c4a5e9",
    desc: "Heal a wounded ally for 65 HP while infecting an enemy with 6s of poison.",
  },
  {
    id: "flintback",
    name: "Molten Shell",
    icon: "◒",
    kind: "shell",
    cd: 11,
    shield: 125,
    power: 1.4,
    burn: 5,
    radius: 150,
    color: "#ffc385",
    desc: "Gain a 125 HP shell. Lava vents deal 140% attack and burn nearby enemies.",
  },
  {
    id: "elderoot",
    name: "Ancient Awakening",
    icon: "❋",
    kind: "awakening",
    cd: 14,
    healPercent: 0.12,
    shield: 45,
    power: 1.8,
    radius: 145,
    color: "#d8e7a5",
    desc: "An ancient aura restores 12% allied health, grants 45 shield, and lashes nearby foes.",
  },
  {
    id: "starborn",
    name: "Event Horizon",
    icon: "✧",
    kind: "blink",
    cd: 11,
    power: 2.4,
    hits: 2,
    evade: 1,
    color: "#f6ddb0",
    desc: "Fold space around a wounded enemy. Two celestial strikes each deal 240% attack.",
  },
  {
    id: "abyssal",
    name: "Gravity Well",
    icon: "◎",
    kind: "gravity",
    cd: 13,
    power: 2.4,
    shield: 75,
    radius: 200,
    color: "#c5a6fa",
    desc: "Shield allies for 75 HP. A gravitational pulse pulls enemies inward and deals 240% attack.",
  },
  {
    id: "coralisk",
    name: "Pressure Jet",
    icon: "➶",
    kind: "beam",
    cd: 8,
    power: 2.3,
    pierce: true,
    color: "#a2e5e3",
    desc: "Fire a pressurized jet through the enemy line for 230% attack to each target.",
  },
  {
    id: "cinderfall",
    name: "Cinderfall",
    icon: "☄",
    kind: "blast",
    cd: 16,
    power: 2.2,
    radius: 85,
    delay: 1,
    burn: 3,
    color: "#ffab72",
    desc: "Call down an ember meteor after a 1s warning. Deals 220% area damage and burns.",
  },
  {
    id: "root-snare",
    name: "Root Snare",
    icon: "❦",
    kind: "blast",
    cd: 15,
    power: 1.3,
    radius: 90,
    delay: 0.8,
    root: 2.5,
    color: "#c5dd97",
    desc: "Roots erupt beneath a foe. Deals 130% area damage and binds enemies for 2.5s.",
  },
  {
    id: "tidal-surge",
    name: "Tidal Surge",
    icon: "≈",
    kind: "wave",
    cd: 16,
    power: 1.6,
    heal: 30,
    knockback: 45,
    radius: 180,
    color: "#9bdfec",
    desc: "Release a tidal wave. Nearby allies heal 30 HP; enemies take 160% attack and are pushed back.",
  },
  {
    id: "overcharge",
    name: "Overcharge",
    icon: "ϟ",
    kind: "buff",
    cd: 15,
    haste: 4,
    evade: 1.5,
    color: "#e0cbff",
    desc: "Overload the nervous system. Gain 40% attack speed for 4s and heightened evasion for 1.5s.",
  },
  {
    id: "soul-siphon",
    name: "Soul Siphon",
    icon: "☾",
    kind: "drain",
    cd: 14,
    power: 2,
    targets: 2,
    lifesteal: 0.5,
    color: "#c9a5f3",
    desc: "Drain two nearby enemies for 200% attack each. Restore half the damage as health.",
  },
  {
    id: "aegis-call",
    name: "Aegis Pulse",
    icon: "◈",
    kind: "shield",
    cd: 20,
    shield: 55,
    all: true,
    taunt: 2,
    color: "#d5e6b4",
    desc: "A resonant pulse gives every living ally 55 shield and draws nearby enemy attention.",
  },
  {
    id: "predator-instinct",
    name: "Predator Instinct",
    icon: "⌁",
    kind: "buff",
    cd: 18,
    haste: 5,
    evade: 2.5,
    attackBoost: 0.18,
    color: "#f4c6a2",
    desc: "Enter the hunt. Gain 18% damage and 40% attack speed for 5s, plus 2.5s evasion.",
  },
  {
    id: "astral-salvo",
    name: "Astral Salvo",
    icon: "✦",
    kind: "salvo",
    cd: 19,
    power: 1.1,
    targets: 3,
    hits: 3,
    color: "#bce3e7",
    desc: "Launch a constellation of three aimed bolts, each dealing 110% attack.",
  },
];
const autoData = [
  [
    "cinderfox",
    "Ember Bite",
    "melee",
    { power: 1, burn: 2 },
    "A quick bite that leaves a 2s ember burn.",
  ],
  [
    "mossguard",
    "Moss Hammer",
    "slam",
    { power: 1, radius: 55 },
    "A heavy stone fist splashes 40% damage onto nearby enemies.",
  ],
  [
    "brookfin",
    "Ripple Bolt",
    "bolt",
    { power: 1, heal: 5 },
    "A waterbolt deals damage and restores 5 HP to a wounded ally.",
  ],
  [
    "voltwing",
    "Spark Feather",
    "chain",
    { power: 0.9, targets: 2 },
    "A charged feather jumps to one nearby enemy for half damage.",
  ],
  [
    "pyrehorn",
    "Horn Cleave",
    "cleave",
    { power: 1.05, radius: 65 },
    "Sweep a molten horn through nearby foes.",
  ],
  [
    "bloomkin",
    "Petal Dart",
    "bolt",
    { power: 0.9, heal: 6 },
    "A living petal strikes a foe and tends a wounded ally.",
  ],
  [
    "glacier",
    "Frost Fist",
    "melee",
    { power: 1, slow: 1.2 },
    "A freezing punch slows its target for 1.2s.",
  ],
  [
    "thornstag",
    "Thorn Rake",
    "melee",
    { power: 1.15, poison: 1 },
    "Rake an enemy with toxic briars.",
  ],
  [
    "nightmaw",
    "Midnight Slash",
    "melee",
    { power: 1.1, lifesteal: 0.15 },
    "A spectral claw restores 15% of damage as health.",
  ],
  [
    "sparkhare",
    "Arc Jab",
    "double",
    { power: 0.55, hits: 2 },
    "Two rapid electric jabs, each at 55% attack.",
  ],
  [
    "solwyrm",
    "Firebrand",
    "bolt",
    { power: 1.1, burn: 2, radius: 35 },
    "A fireball explodes in a small burning splash.",
  ],
  [
    "lunacrest",
    "Moonbeam",
    "beam",
    { power: 0.95, heal: 6 },
    "A lunar ray damages one enemy and gently heals an ally.",
  ],
  [
    "astralisk",
    "Hollow Lance",
    "bolt",
    { power: 1.05, poison: 2 },
    "A void lance corrupts its target for 2s.",
  ],
  [
    "tempest",
    "Storm Feather",
    "chain",
    { power: 1, targets: 2 },
    "A storm quill leaps to an extra target.",
  ],
  [
    "duskcap",
    "Spore Puff",
    "bolt",
    { power: 0.8, poison: 3 },
    "Launch a poisonous spore that infects for 3s.",
  ],
  [
    "flintback",
    "Magma Slam",
    "slam",
    { power: 1, burn: 2, radius: 55 },
    "A molten stomp splashes burn onto close enemies.",
  ],
  [
    "elderoot",
    "Branchbreaker",
    "cleave",
    { power: 1.1, radius: 70, root: 0.35 },
    "Crack the earth and briefly root targets in a wide cleave.",
  ],
  [
    "starborn",
    "Celestial Claws",
    "double",
    { power: 0.65, hits: 2 },
    "Two radiant slashes, each dealing 65% attack.",
  ],
  [
    "abyssal",
    "Gravity Fist",
    "melee",
    { power: 1.2, knockback: 14 },
    "An obsidian strike pushes its target away.",
  ],
  [
    "coralisk",
    "Harpoon Jet",
    "beam",
    { power: 1.05, pierce: true },
    "A thin pressure jet pierces the enemy line.",
  ],
];
ACTIVE_SKILLS.push(...EXPANSION_ACTIVE_SKILLS, ...NATIVE_ACTIVE_SKILLS, ...NATIVE_FORM_SKILLS);
export const AUTO_SKILLS = autoData.map(
  ([species, name, kind, params, desc]) => ({
    id: "auto-" + species,
    species,
    name,
    kind,
    desc,
    icon: "⌁",
    auto: true,
    ...params,
  }),
);
AUTO_SKILLS.push(...EXPANSION_AUTO_SKILLS, ...NATIVE_AUTO_SKILLS);
export const SKILLS = Object.fromEntries(
  [...ACTIVE_SKILLS, ...AUTO_SKILLS].map((s) => [s.id, s]),
);
const elementSkills = {
  ember: "cinderfall",
  grove: "root-snare",
  tide: "tidal-surge",
  storm: "overcharge",
  void: "soul-siphon",
};
export const MAX_COOLDOWN_SKILLS=4;
export const SKILL_UNLOCK_LEVELS=[3,5,7];
export const cooldownSkillSlots=c=>Math.min(MAX_COOLDOWN_SKILLS,1+SKILL_UNLOCK_LEVELS.filter(level=>level<=c.level).length);
function distinctRegularSkills(ids){const known=new Set();return ids.filter(id=>{const s=SKILLS[id],base=s?.baseId||id;if(!s||s.auto||s.evolutionSkill||known.has(base))return false;known.add(base);return true;});}
export const regularSkillIds=c=>distinctRegularSkills([c.id,...c.learnedSkills||[]]).slice(0,cooldownSkillSlots(c));
export function loadoutFor(species, level = 1, creature = null) {
  if(creature?.skillsVersion===2)return {auto:'auto-'+species.id,active:[...new Set([...regularSkillIds(creature),...evolutionSkillIds(creature)])].filter(id=>SKILLS[id])};
  const ids = [species.id, species.secondary || elementSkills[species.element]];
  if (["Rare", "Epic", "Legendary"].includes(species.rarity) || level >= 5)
    ids.push(
      {
        Guardian: "aegis-call",
        Support: "aegis-call",
        Striker: "predator-instinct",
        Ranger: "astral-salvo",
      }[species.role],
    );
  return { auto: "auto-" + species.id, active: [...ids,...evolutionSkillIds(creature)] };
}

export const SKILL_QUALITIES=[{name:'Basic',power:1},{name:'Refined',power:1.12},{name:'Superior',power:1.26},{name:'Mythic',power:1.42}];
const roleForKind=kind=>['heal','heal-all','spores','awakening'].includes(kind)?'Support':['shield','wave','gravity'].includes(kind)?'Guardian':['bolt','salvo','blast','beam','chain'].includes(kind)?'Ranger':'Striker';
const learnable=ACTIVE_SKILLS.filter(s=>!s.evolutionSkill&&!s.compatibilityOnly&&s.cd>0).map(s=>{const family=pixelSpec(s.species||s.id);return {...s,baseId:s.id,role:family?.role||roleForKind(s.kind),element:family?.element||({cinderfall:'ember','root-snare':'grove','tidal-surge':'tide',overcharge:'storm','soul-siphon':'void'}[s.id])};});
for(const base of learnable)for(const [quality,q]of SKILL_QUALITIES.entries()){const id=`learn-${base.id}-${quality}`,skill={...base,id,learned:true,quality,qualityName:q.name,name:`${q.name} ${base.name}`,cd:base.cd*(1-quality*.025)};for(const key of ['power','heal','shield','burn','poison','root','slow','haste','evade','healPercent'])if(typeof base[key]==='number')skill[key]=base[key]*q.power;skill.desc=quality===0?base.desc:`${base.desc} ${q.name}: ${Math.round((q.power-1)*100)}% stronger potency; ${Math.round(quality*2.5)}% shorter base cooldown.`;SKILLS[id]=skill;}
const hash=text=>[...String(text)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,17);
function random(seed){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const qualityWeights={Common:[75,20,5,0],Uncommon:[45,40,14,1],Rare:[20,35,40,5],Epic:[0,15,65,20],Legendary:[0,0,35,65]};
export function skillChoices(c,level=c.level){const species=pixelSpec(c.id),r=random((c.skillSeed??hash(c.uid||c.id))^Math.imul(level,7919)),known=new Set([c.id,...(c.learnedSkills||[]).map(id=>SKILLS[id]?.baseId||id)]),pool=learnable.filter(s=>!known.has(s.baseId)),offers=[];for(let i=0;i<3&&pool.length;i++){const preferred=pool.filter(s=>i===0?s.role===species.role:i===1?s.element===species.element:s.role===species.role&&s.element===species.element),eligible=preferred.length?preferred:pool,weight=s=>(s.role===species.role?6:1)*(s.element===species.element?8:1),sum=eligible.reduce((n,s)=>n+weight(s),0);let roll=r()*sum,index=0;for(;index<eligible.length-1;index++){roll-=weight(eligible[index]);if(roll<0)break;}const base=pool.splice(pool.indexOf(eligible[index]),1)[0],weights=qualityWeights[species.rarity]||qualityWeights.Common;let qroll=r()*100,quality=0;for(;quality<3;quality++){qroll-=weights[quality];if(qroll<0)break;}offers.push(`learn-${base.id}-${quality}`);}return offers;}
export function initializeSkills(c,{migrate=false,enemy=false}={}){
 if(c.skillsVersion===2){normalizeSkillSlots(c);return c;}
 const species=pixelSpec(c.id);if(!species)return c;
 const old=migrate?loadoutFor(species,c.level,c).active:[],oldEvolution=migrate?evolutionSkillIds(c):[];
 c.skillsVersion=2;c.manualSkills=!enemy;c.learnedSkills=old.filter(id=>id!==c.id&&!SKILLS[id]?.evolutionSkill);c.chosenEvolutionSkills=oldEvolution;c.pendingSkills=[];c.skillChoicesThrough=migrate||enemy?c.level:1;
 normalizeSkillSlots(c);return c;
}
export function grantEvolutionSkills(c){
 if(c.skillsVersion!==2)return false;
 // Keep previously selected bonuses, including saved choices from the old menu.
 const previous=c.chosenEvolutionSkills||[],candidates=[...previous,...(c.pendingSkills||[]).filter(o=>o.kind==='evolution').map(o=>o.selected),...c.archivedSkills||[]];
 const granted=[];
 for(let stage=1;stage<=Math.min(2,c.evolution||0);stage++){
  const selected=candidates.find(id=>SKILLS[id]?.evolutionSkill&&SKILLS[id].species===c.id&&SKILLS[id].stage===stage);
  const id=selected||`evolve-${c.id}-${c.evolutionPath||'wild'}-${stage}`;if(SKILLS[id])granted.push(id);
 }
 c.chosenEvolutionSkills=granted;c.pendingSkills=(c.pendingSkills||[]).filter(o=>o.kind!=='evolution');
 return previous.join()!==granted.join();
}
export function normalizeSkillSlots(c){
 if(c.skillsVersion!==2)return;
 const migrating=c.evolutionSkillsVersion!==1;
 grantEvolutionSkills(c);
 // Recover spells displaced by the former shared cap once, without reviving
 // intentionally archived choices on every subsequent save/load.
 const all=distinctRegularSkills([c.id,...c.learnedSkills||[],...(migrating?c.archivedSkills||[]:[])]),active=all.slice(0,cooldownSkillSlots(c));
 c.learnedSkills=active.filter(id=>id!==c.id);
 c.archivedSkills=[...new Set([...c.archivedSkills||[],...all.slice(cooldownSkillSlots(c))])].filter(id=>!active.includes(id)&&!c.chosenEvolutionSkills.includes(id));
 c.evolutionSkillsVersion=1;
 const available=cooldownSkillSlots(c)-active.length;let space=available;const pendingLevels=new Set();
 c.pendingSkills=(c.pendingSkills||[]).filter(o=>o.kind==='level'&&SKILL_UNLOCK_LEVELS.includes(o.level)&&o.level<=c.level&&!pendingLevels.has(o.level)&&space-->0&&pendingLevels.add(o.level));
 if(migrating){
  const unlocked=SKILL_UNLOCK_LEVELS.filter(level=>level<=c.level);
  if(c.manualSkills===false){
   c.pendingSkills=[];
   for(const level of unlocked){if(regularSkillIds(c).length>=cooldownSkillSlots(c))break;const options=skillChoices(c,level);if(options.length)c.learnedSkills.push(options[0]);}
  }else for(const level of unlocked.slice(c.learnedSkills.length)){
   if(c.pendingSkills.length>=available)break;
   if(!pendingLevels.has(level)){const options=skillChoices(c,level);if(options.length)c.pendingSkills.push({key:`level:${level}`,kind:'level',level,options});}
  }
  c.pendingSkills.sort((a,b)=>a.level-b.level);c.skillChoicesThrough=Math.max(c.skillChoicesThrough||1,...unlocked);
  const known=new Set(active.map(id=>SKILLS[id].baseId||id));
  for(const offer of c.pendingSkills)if(offer.options.some(id=>known.has(SKILLS[id]?.baseId||id)))offer.options=skillChoices(c,offer.level);
 }
}
export function queueLevelSkill(c,level=c.level){
 if(c.skillsVersion!==2||!SKILL_UNLOCK_LEVELS.includes(level)||level<=(c.skillChoicesThrough||1))return false;
 c.skillChoicesThrough=level;
 if(regularSkillIds(c).length+(c.pendingSkills||[]).filter(o=>o.kind==='level').length>=cooldownSkillSlots(c))return false;
 const options=skillChoices(c,level);if(!options.length)return false;c.pendingSkills??=[];c.pendingSkills.push({key:`level:${level}`,kind:'level',level,options});return true;
}
export function chooseSkill(c,key,id,replaceId=null){
 const offer=c.pendingSkills?.find(o=>o.key===key),active=regularSkillIds(c);
 if(!offer||offer.kind!=='level'||!offer.options.includes(id)||!SKILLS[id]||SKILLS[id].evolutionSkill||replaceId||active.some(s=>(SKILLS[s].baseId||s)===(SKILLS[id].baseId||id))||active.length>=cooldownSkillSlots(c))return false;
 (c.learnedSkills??=[]).push(id);c.pendingSkills=c.pendingSkills.filter(o=>o!==offer);
 let remaining=cooldownSkillSlots(c)-regularSkillIds(c).length;c.pendingSkills=c.pendingSkills.filter(o=>o.kind==='level'&&remaining-->0);
 for(const future of c.pendingSkills)future.options=skillChoices(c,future.level);return true;
}
export function prepareEnemySkills(c,seed){if(c.skillsVersion===2){normalizeSkillSlots(c);return c;}if(seed!==undefined)c.skillSeed=seed;initializeSkills(c,{enemy:true});return c;}

// Family-specific two-stat talents supplement the original behavioral passive.
// The ordinal within each role makes every released family combination distinct.
export function familyPassive(c){const species=pixelSpec(c.id);if(!species)return {name:'Natural talent',desc:'',effect:{}};const family=PIXEL_SPECIES.filter(s=>s.role===species.role),ordinal=Math.max(0,family.findIndex(s=>s.id===c.id)),a=ordinal%7+1,b=Math.floor(ordinal/7)+1,asc=c.evolution>=2?1:0;const effect=species.role==='Guardian'?{armor:3+a+asc*5,poise:3+b*2+asc*5}:species.role==='Support'?{healing:1+a*.01+asc*.05,staminaRecharge:1+b*.015}:species.role==='Ranger'?{range:5+a*2,crit:b*.005+asc*.015}:{attackSpeed:1+a*.01+asc*.05,dashCooldown:1-b*.015};const labels={armor:'armor',poise:'poise',healing:'healing power',staminaRecharge:'stamina recovery',range:'range',crit:'critical chance',attackSpeed:'basic attack speed',dashCooldown:'dash cooldown time'};const desc=Object.entries(effect).map(([key,value])=>{const flat=['armor','poise','range'].includes(key),n=flat?value:key==='crit'?value*100:(value-1)*100;return `${n>=0?'+':''}${+n.toFixed(1)}${flat?'':key==='crit'?' percentage points':'%'} ${labels[key]}`;}).join(', ');return {name:species.name+"'s "+({Guardian:'Steadfast Oath',Support:'Kindred Spirit',Ranger:'Hunter Instinct',Striker:'Battle Rhythm'}[species.role]),desc:desc+'.'+(asc?' Ascendant passive strengthened.':''),effect};}
export const familyPassiveStats=c=>c.skillsVersion===2?familyPassive(c).effect:{};
