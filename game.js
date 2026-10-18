import {AURA_STONES,AURA_BY_ID,auraCompatibility,auraSlots,updateAuras,tickAuras,assignEnemyStones,enemyStoneDrops} from './aura-stones.js';
import {movementPace,steerMovement} from './movement-tuning.js';
import {assignEliteModifier,applyEliteStats,eliteModifierForSeed,eliteEncounterModifier} from './elite-modifiers.js';
import {LESSER_RELICS} from './opening-relics.js';
import {PACT_RELICS} from './relic-pacts.js';
import {equipmentAffinity} from './equipment-affinity.js';
import {rollStarterGear} from './starter-equipment.js';
import {snapshotNativeMotion} from './native-motion.js';
import {WEARER_BY_ID,WEARER_RELICS,wearerStats,initializeCompanion} from './wearer-relics.js';
import {starterPoints,starterBudget,starterSlots} from './tactics.js';
import {dodgeStyle} from './combat-expansion.js';
import {enrageAt,actionElapsed} from './battle-enrage.js';
import {getTuning,normalizeTuning} from './tuning.js';
import {creatureWorldScale,nativeEntityBounds} from './native-size.js';
import {itemStrength} from './item-effects.js';
import {tacticalTarget,tacticalMove} from './ai-relics.js';
import {spendCapturers,refundCapture,progressive,capacity,rollIndividual,unlockSlots,routeGraph,graphCanVisit,assignEnemyRelics,CAPTURERS,consumeCapturer,addCapturer,newCasualty,recruitOffer} from './expedition-rules.js';
import {EXPEDITION_RELICS,routeModifiers,relicStatFactors,compileRelics,relicDamageFactor,relicReduction,relicEvent,relicFatal,relicTick} from './run-relics.js';
import {equipmentEffects,armorReduction,enemyEquipment,CREATURE_GEAR} from './creature-equipment.js';
import {queueCombatText,queueCombatCue,advanceCombatTexts} from './combat-text.js';
import {CORE_SPECIES} from './core-species.js';
import {evaluateOrders,terrainFor,firstTerrainHit,terrainSteering,confineTerrain,orderGoal,combatApproach,avoidCombatBodies} from './native-tactics.js';
import {NATIVE_BOUNDS,nativeSpawn,initializeNative,nativeAction,advanceNative,nativeBladePoint,nativeStrikeOrigin,nativeHeavy,nativeMuzzle,nativeBodyHeight} from './native-combat.js';
import { NATIVE_SPECIES, NATIVE_STARTERS, NATIVE_POOLS, nativeEvolution, nativeSkill, nativePool, lineageLimit, lineageProgress, settleNativeGrowth } from './native-content.js';
import { SKILLS, loadoutFor,initializeSkills,prepareEnemySkills,queueLevelSkill,grantEvolutionSkills,familyPassiveStats,SKILL_UNLOCK_LEVELS } from "./skills.js";
import { EXPANSION_SPECIES } from "./roster.js";
import {
  sweepCircle,
  bodyProperties,
  movingBodyHit,
  strikeContains,
  separateBodies,
  confineBody,
} from "./arena.js";
import {
  NEW_GEMS,
  NEW_RELICS,
  NEW_EVENTS,
  ARCHETYPES,
  WEATHER,
  CREATURE_TRAITS,
  DIFFICULTIES,
  chaosLevel,
  shopPrice,
  BOSS_GUIDES,
} from "./tactics.js";
// Pure game rules: shared by the browser and the automated simulation harness.
export const ELEMENTS = {
  ember: {
    name: "Ember",
    color: "#ff9863",
    icon: "♨",
    description: "2: attacks burn · 4: +24% attack",
  },
  grove: {
    name: "Grove",
    color: "#a2cb7b",
    icon: "❋",
    description: "2: regenerate 1% HP/sec · 4: +30% healing",
  },
  tide: {
    name: "Tide",
    color: "#78cde3",
    icon: "◈",
    description: "2: +18% max HP · 4: +15% damage reduction",
  },
  storm: {
    name: "Storm",
    color: "#d6b5fc",
    icon: "ϟ",
    description:
      "2: skills recharge 18% faster · 4: faster dodge reactions and rolls",
  },
  void: {
    name: "Void",
    color: "#b296df",
    icon: "✧",
    description: "2: +12% lifesteal · 4: execute below 20% HP",
  },
};
export const SPECIES = [...CORE_SPECIES, ...EXPANSION_SPECIES, ...NATIVE_SPECIES];
export const BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
export const STARTERS = [
  "cinderfox",
  "mossguard",
  "brookfin",
  "voltwing",
  "pyrehorn",
  "bloomkin",
];
export const RARITY = {
  Common: { color: "#9ca69c", cost: 70, catch: 0.92 },
  Uncommon: { color: "#a2cb7b", cost: 100, catch: 0.82 },
  Rare: { color: "#79b9e3", cost: 150, catch: 0.67 },
  Epic: { color: "#c0a0ef", cost: 210, catch: 0.5 },
  Legendary: { color: "#f2c47e", cost: 290, catch: 0.34 },
};
export const PLANETS = [
  {
    name: "Verdant Reach",
    sub: "A world that remembers",
    color: "#a2cb7b",
    biome: "grove",
    boss: "elderoot",
    bossName: "The Hollow Crown",
    pool: [
      "mossguard",
      "bloomkin",
      "thornstag",
      "cinderfox",
      "brookfin",
      "duskcap",
      "sparkhare",
      "voltwing",
    ],
  },
  {
    name: "Cinderwake",
    sub: "Beneath a fractured sun",
    color: "#ff9863",
    biome: "ember",
    boss: "solwyrm",
    bossName: "The Sun Eater",
    pool: [
      "pyrehorn",
      "cinderfox",
      "flintback",
      "solwyrm",
      "nightmaw",
      "tempest",
      "coralisk",
    ],
  },
  {
    name: "The Silent Expanse",
    sub: "Where the stars go to sleep",
    color: "#b296df",
    biome: "void",
    boss: "abyssal",
    bossName: "The Last Colossus",
    pool: [
      "nightmaw",
      "astralisk",
      "glacier",
      "lunacrest",
      "tempest",
      "starborn",
      "duskcap",
    ],
  },
];
// Every new family is encounterable on at least one planet and recruitable at shops.
for (const s of [...EXPANSION_SPECIES, ...NATIVE_SPECIES]) {
  const planet =
    s.element === "grove" || s.element === "tide"
      ? 0
      : s.element === "ember"
        ? 1
        : 2;
  PLANETS[planet].pool.push(s.id);
}
export const RELICS = [
  {
    id: "fangs",
    name: "Twin Fangs",
    icon: "⌁",
    color: "#ff9863",
    desc: "Basic attacks deal 18% more damage. Strikers gain 8% lifesteal.",
    cost: 110,
  },
  {
    id: "clock",
    name: "Broken Hourglass",
    icon: "⌛",
    color: "#d6b5fc",
    desc: "All skill cooldowns recharge 22% faster.",
    cost: 145,
  },
  {
    id: "seed",
    name: "Evergreen Heart",
    icon: "❋",
    color: "#a2cb7b",
    desc: "Healing is 35% stronger. Grove creatures gain 12% max HP.",
    cost: 120,
  },
  {
    id: "prism",
    name: "Prismatic Shell",
    icon: "◈",
    color: "#78cde3",
    desc: "Every ally starts battle with a 65 HP shield.",
    cost: 130,
  },
  {
    id: "lens",
    name: "Hunters’ Lens",
    icon: "◎",
    color: "#f2c47e",
    desc: "Capture chance increases by 18 percentage points.",
    cost: 95,
  },
  {
    id: "banner",
    name: "Vanguard Standard",
    icon: "⚑",
    color: "#e6c284",
    desc: "Guardians gain 22% HP and taunt at the start of battle.",
    cost: 110,
  },
  {
    id: "feather",
    name: "Ghost Feather",
    icon: "〰",
    color: "#b296df",
    desc: "All allies react faster, recharge dodge rolls 0.48s faster, and gain 12% movement speed.",
    cost: 115,
  },
  {
    id: "coin",
    name: "Pilgrim’s Coin",
    icon: "☼",
    color: "#f2c47e",
    desc: "Battle gold rewards increase by 35%.",
    cost: 100,
  },
  {
    id: "bond",
    name: "Woven Soul",
    icon: "∞",
    color: "#a2cb7b",
    desc: "For every active elemental synergy, the team gains 5% attack.",
    cost: 135,
  },
];
RELICS.push(...NEW_RELICS,...EXPEDITION_RELICS,...PACT_RELICS,...LESSER_RELICS);
for(const relic of RELICS)relic.cost=Math.max(220,relic.cost);
export const RELIC_SLOTS = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};
export const PERSONAL_RELICS = [
  {
    id: "scorch-fang",
    name: "Brutality",
    icon: "⌁",
    color: "#f0a374",
    cost: 55,
    desc: "Supported skill deals 28% more damage, but heals 20% less.",
    support: { damage: 1.28, healing: 0.8 },
  },
  {
    id: "ward-stone",
    name: "Fortification",
    icon: "◒",
    color: "#aeca98",
    cost: 55,
    desc: "Using the supported skill grants 35 shield (10 on auto-attacks).",
    support: { shield: 35 },
  },
  {
    id: "quick-shard",
    name: "Acceleration",
    icon: "ϟ",
    color: "#c9b5ed",
    cost: 65,
    desc: "Supported skill recharges 25% faster. Auto-attacks fire 20% faster.",
    support: { cooldown: 0.75, attackSpeed: 0.8 },
  },
  {
    id: "moonstone",
    name: "Restoration",
    icon: "☾",
    color: "#88cddb",
    cost: 60,
    desc: "Supported skill heals 40% more. Its damage also returns 12% as health.",
    support: { healing: 1.4, lifesteal: 0.12 },
  },
  {
    id: "windglass",
    name: "Slipstream",
    icon: "〰",
    color: "#abccdb",
    cost: 65,
    desc: "Using the supported skill grants evasion and a burst of movement.",
    support: { evade: 1.5, movement: 1.3 },
  },
  {
    id: "heartseed",
    name: "Bloom",
    icon: "❋",
    color: "#bdd797",
    cost: 70,
    desc: "Supported skills heal nearby allies for 18 HP (5 on auto-attacks).",
    support: { bloom: 18 },
  },
  {
    id: "hunters-eye",
    name: "Precision",
    icon: "◎",
    color: "#dfbd83",
    cost: 75,
    desc: "Supported hits gain 25% critical chance and 15% damage, with 20% smaller areas.",
    support: { crit: 0.25, damage: 1.15, area: 0.8 },
  },
  {
    id: "ironbark",
    name: "Anchoring",
    icon: "▱",
    color: "#b8bc9c",
    cost: 70,
    desc: "Supported hits root for 0.8s. Skill use grants 12% damage reduction for 3s.",
    support: { root: 0.8, fortify: 3 },
  },
  {
    id: "spore-ring",
    name: "Corruption",
    icon: "✺",
    color: "#b394cf",
    cost: 70,
    desc: "Supported hits inflict 4s poison. Supported areas are 20% wider.",
    support: { poison: 4, area: 1.2 },
  },
  {
    id: "echo-prism",
    name: "Spell Echo",
    icon: "◈",
    color: "#d7b8f3",
    cost: 90,
    desc: "Supported skill repeats after 0.4s at 55% power. Its cooldown is 12% longer.",
    support: { echo: 0.55, cooldown: 1.12 },
  },
  {
    id: "phoenix-ash",
    name: "Combustion",
    icon: "♨",
    color: "#e8a27c",
    cost: 95,
    desc: "Supported hits burn for 5s and explode for 35% attack around the target.",
    support: { burn: 5, explosion: 0.35 },
  },
  {
    id: "wanderers-knot",
    name: "Convergence",
    icon: "∞",
    color: "#b3d1a4",
    cost: 75,
    desc: "Supported skills strike or heal an extra target; area skills gain 30% radius.",
    support: { targets: 1, area: 1.3 },
  },
];
PERSONAL_RELICS.push(...NEW_GEMS);
export const PERSONAL_BY_ID = Object.fromEntries(
  PERSONAL_RELICS.map((r) => [r.id, r]),
);
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pick(arr, r) {
  return arr[Math.floor(r() * arr.length)];
}
export function shuffled(items, random) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
let serial = 0;
const sessionId =
  Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
export function creature(id, level = 1) {
  const s = BY_ID[id];
  return {
    uid: `${id}-${sessionId}-${++serial}`,
    id,
    level,
    xp: 0,
    hp: s.hp,
    training: 0,
    focus: "balanced",
    relics: [],
    evolution: 0,
    evolutionPath: null,
    policy: "adaptive",
    deployment: null,
  };
}
export const EVOLUTION_PATHS = {
  wild: {
    name: "Wild",
    description: "Sharper attacks and a stronger signature skill.",
    color: "#ffb077",
  },
  warden: {
    name: "Warden",
    description: "More health, faster skills, stronger healing and shields.",
    color: "#9ce0cb",
  },
};
export function evolutionStage(c) {
  return Math.max(0, Math.min(2, Math.floor(Number(c?.evolution) || 0)));
}
export function creatureName(c) {
  const s = BY_ID[typeof c === "string" ? c : c.id];
  const stage = typeof c === "string" ? 0 : evolutionStage(c);
  return stage ? `${stage === 2 ? "Ascendant " : ""}${nativeEvolution(c).name||s.evolvedName}` : s.name;
}
export function relicSlots(c) {
  return c.balanceVersion>=17?auraSlots(c):RELIC_SLOTS[BY_ID[c.id].rarity] + evolutionStage(c);
}
export function evolutionOffer(run, c) {
  const limit=lineageLimit(c), accomplishment=lineageProgress(c);
  const stage = evolutionStage(c),
    level = stage === 0 ? 5 : 8,
    cost = stage === 0 ? 50 : 100;
  if (stage >= limit)
    return { ready:false, reason:limit===0?"This family arrives in its final form":"Final form reached",level,cost,stage,limit,accomplishment };
  if (c.level < level && !(accomplishment?.ready && c.level >= accomplishment.minimumLevel))
    return {ready:false,reason:`Reach level ${level} or complete the family accomplishment at level ${accomplishment?.minimumLevel||level}`,level,cost,stage,limit,accomplishment};
  if (run.gold < cost)
    return {
      ready: false,
      reason: `Requires ${cost} gold`,
      level,
      cost,
      stage,
    };
  return {ready:true,reason:"Ready to evolve",level,cost,stage,limit,accomplishment,route:c.level>=level?"level":"accomplishment"};
}
export function evolveCreature(run, index, path) {
  const c = run.team[index];
  if (!c || !EVOLUTION_PATHS[path])
    return {
      success: false,
      reason: "Choose a valid creature and evolution path",
    };
  const offer = evolutionOffer(run, c);
  if (!offer.ready) return { success: false, reason: offer.reason };
  if (offer.stage && c.evolutionPath !== path)
    return {
      success: false,
      reason: "Ascension follows your chosen evolution path",
    };
  run.gold -= offer.cost;
  c.evolution = offer.stage + 1;
  c.evolutionPath = path;
  grantEvolutionSkills(c);
  return { success: true, name: creatureName(c), stage: c.evolution, path };
}
export function personalRelic(id) {
  if (!PERSONAL_BY_ID[id]&&!AURA_BY_ID[id]) throw new Error("Unknown personal relic");
  return { uid: `relic-${sessionId}-${++serial}`, id };
}
export function personalEffects(c) {
  const e = {
    attack: 1,
    health: 1,
    cooldown: 1,
    healing: 1,
    speed: 1,
    dodge: 0,
    regen: 0,
    crit: 0,
    armor: 0,
    shield: 0,
    poison: 0,
    skillPower: 1,
    revive: 0,
    xp: 1,
  };
  for (const item of c.relics || []) {
    const relic = c.balanceVersion>=17?WEARER_BY_ID[item.id]:PERSONAL_BY_ID[item.id];
    if (!relic) continue;
    for (const key of [
      "attack",
      "health",
      "cooldown",
      "healing",
      "speed",
      "skillPower",
      "xp",
    ])
      e[key] *= relic[key] || 1;
    for (const key of [
      "dodge",
      "regen",
      "crit",
      "armor",
      "shield",
      "poison",
      "revive",
    ])
      e[key] += relic[key] || 0;
  }
  const wearer=wearerStats(c);e.attack*=wearer.atk;e.health*=wearer.hp;e.cooldown*=wearer.cd;e.speed*=wearer.speed;e.healing*=wearer.healing;
  const strength=c.balanceVersion>=17?1:itemStrength(c);
  for(const key of ['attack','health','cooldown','healing','speed','skillPower','xp'])e[key]=1+(e[key]-1)*strength;
  for(const key of ['dodge','regen','crit','armor','shield','poison','revive'])e[key]*=strength;
  return e;
}
export function canSupport(itemId, skillId) {
  const mod = PERSONAL_BY_ID[itemId]?.support,
    def = SKILLS[skillId];
  if (!mod || !def) return false;
  if (
    [
      "fracture-gem",
      "fork-gem",
      "frost-gem",
      "venom-gem",
      "hex-gem",
      "execute-gem",
      "siphon-gem",
      "expose-gem",
      "blood-gem",
      "detonate-gem",
      "recoil-gem",
    ].includes(itemId) &&
    !def.power
  )
    return false;
  if (["beacon-gem", "trap-gem", "relay-gem"].includes(itemId) && def.auto)
    return false;
  if (itemId === "reservoir-gem" && !def.heal && !def.healPercent) return false;
  return true;
}
export function equipRelic(run, creatureIndex, itemUid) {
  const c = run.team[creatureIndex],
    index = run.inventory.findIndex((i) => i.uid === itemUid);
  if (!c || index < 0 || (c.relics || []).length >= relicSlots(c)) return false;
  const item = run.inventory[index];
  if(!auraCompatibility(c,item).allowed)return false;
  if ((c.relics || []).some((r) => r.id === item.id)) return false;
  if((run.rulesVersion||0)>=17){initializeCompanion(run,c);delete item.link;c.relics.push(run.inventory.splice(index,1)[0]);return true;}
  const loadout = loadoutFor(BY_ID[c.id], c.level, c);
  const link = [c.id, loadout.auto, ...loadout.active].find((id) =>
    canSupport(item.id, id),
  );
  if (!link) return false;
  c.relics ??= [];
  item.link = link;
  c.relics.push(run.inventory.splice(index, 1)[0]);
  return true;
}
export function unequipRelic(run, creatureIndex, slot) {
  const c = run.team[creatureIndex];
  if (!c?.relics?.[slot]) return false;
  run.inventory.push(c.relics.splice(slot, 1)[0]);
  return true;
}
export function linkedSupport(c, skillId) {
  const m = {
    damage: 1,
    healing: 1,
    cooldown: 1,
    attackSpeed: 1,
    area: 1,
    movement: 1,
    crit: 0,
    shield: 0,
    bloom: 0,
    evade: 0,
    root: 0,
    fortify: 0,
    poison: 0,
    burn: 0,
    lifesteal: 0,
    targets: 0,
    echo: 0,
    explosion: 0,
    pierce: 0,
    shred: 0,
    fork: 0,
    chill: 0,
    steam: 0,
    wither: 0,
    cleanse: 0,
    overheal: 0,
    beacon: 0,
    weaken: 0,
    execute: 0,
    trap: 0,
    siphon: 0,
    expose: 0,
    blood: 0,
    relay: 0,
    detonate: 0,
    guard: 0,
    knockback: 0,
    regen: 0,
  };
  for (const item of c.relics || []) {
    if(c.balanceVersion>=17)continue;
    if ((item.link || c.id) !== skillId) continue;
    const s = PERSONAL_BY_ID[item.id]?.support;
    if (!s) continue;
    for (const key of [
      "damage",
      "healing",
      "cooldown",
      "attackSpeed",
      "area",
      "movement",
    ])
      m[key] *= s[key] || 1;
    for (const key of [
      "crit",
      "shield",
      "bloom",
      "evade",
      "root",
      "fortify",
      "poison",
      "burn",
      "lifesteal",
      "targets",
      "echo",
      "explosion",
      "pierce",
      "shred",
      "fork",
      "chill",
      "steam",
      "wither",
      "cleanse",
      "overheal",
      "beacon",
      "weaken",
      "execute",
      "trap",
      "siphon",
      "expose",
      "blood",
      "relay",
      "detonate",
      "guard",
      "knockback",
      "regen",
    ])
      m[key] += s[key] || 0;
  }
  const strength=itemStrength(c);
  for(const key of ['damage','healing','cooldown','attackSpeed','area','movement'])m[key]=1+(m[key]-1)*strength;
  for(const key of ['crit','shield','bloom','evade','root','fortify','poison','burn','lifesteal','echo','explosion','pierce','shred','chill','wither','overheal','expose','blood','knockback','regen'])m[key]*=strength;
  const stage = evolutionStage(c);
  if (stage && c.evolutionPath === "wild") {
    m.damage *=
      skillId === c.id
        ? stage === 2
          ? 1.28
          : 1.16
        : stage === 2
          ? 1.16
          : 1.08;
  } else if (stage && c.evolutionPath === "warden") {
    m.healing *= stage === 2 ? 1.5 : 1.25;
    m.cooldown *= stage === 2 ? 0.87 : 0.93;
  }
  return m;
}
export function linkRelic(run, creatureIndex, slot, skillId) {
  if((run.rulesVersion||0)>=17)return false;
  const c = run.team[creatureIndex],
    item = c?.relics?.[slot];
  if (!item) return false;
  const loadout = loadoutFor(BY_ID[c.id], c.level, c);
  if (
    ![loadout.auto, ...loadout.active].includes(skillId) ||
    !canSupport(item.id, skillId)
  )
    return false;
  item.link = skillId;
  return true;
}
export function xpNeeded(level) {
  return 24 + level * 12;
}
export function gainXP(c, amount) {
  c.xp += amount;
  let levels = 0;
  while (c.xp >= xpNeeded(c.level)) {
    c.xp -= xpNeeded(c.level);
    c.level++;
    queueLevelSkill(c,c.level);
    levels++;
  }
  return levels;
}
export function synergies(team) {
  const count = {};
  for (const c of team)
    if (c) count[BY_ID[c.id].element] = (count[BY_ID[c.id].element] || 0) + 1;
  return count;
}
export const LEVEL_GROWTH={Common:.105,Uncommon:.115,Rare:.13,Epic:.15,Legendary:.175};
export const levelGrowthRate=c=>(c.balanceVersion||0)>=17?(LEVEL_GROWTH[BY_ID[c.id]?.rarity]||.105):.105;
// Secondary gains are additive to base rates; reciprocal haste keeps cooldowns positive.
export const SECONDARY_LEVEL_GROWTH={attackSpeed:.0125,actionSpeed:.01,staminaRecharge:.015,cooldown:.01,dashCooldown:.01,speed:.005,dodge:.0005,hpRegen:.04};
export function stats(c, team, relics = []) {
  const s = BY_ID[c.id],
    syn = synergies(team),
    has = (id) => relics.includes(id),strength=itemStrength(c);
  const secondaryLevels=(c.balanceVersion>=17?Math.max(0,c.level-1)*levelGrowthRate(c)/.105:0),minor=SECONDARY_LEVEL_GROWTH;
  const growth =
    (1 + (c.level - 1) * levelGrowthRate(c) + (c.training || 0) * (c.balanceVersion>=15?.035:.07)) *
    (c.level >= 5 && ["Common", "Uncommon"].includes(s.rarity) ? 1.2 : 1);
  let hp = s.hp * growth,
    atk = s.atk * growth,
    cd = SKILLS[s.id].cd,
    speed = s.speed,
    dodge = 0.045;
  const stage = evolutionStage(c);
  if (stage) {
    hp *=
      c.evolutionPath === "warden"
        ? stage === 2
          ? 1.35
          : 1.2
        : stage === 2
          ? 1.18
          : 1.1;
    atk *=
      c.evolutionPath === "wild"
        ? stage === 2
          ? 1.25
          : 1.15
        : stage === 2
          ? 1.12
          : 1.06;
  }
  hp *= 1 + Math.max(0, Math.min(5, c.bond || 0)) * 0.02;
  if (has("glass-cannon") && s.role === "Ranger") hp *= 0.85;
  if (has("thorn-crown") && s.role === "Guardian") speed *= 0.9;
  if (has("unity") && Object.keys(syn).length === 5) {
    hp *= 1+.15*strength;
    atk *= 1+.2*strength;
  }
  if (has("overgrowth")) cd *= 1.08;
  if (has("echo-chamber")) cd *= 1.12;
  if ((syn.tide || 0) >= 2) hp *= 1.18;
  if (has("banner") && s.role === "Guardian") hp *= 1+.22*strength;
  if (has("seed") && s.element === "grove") hp *= 1+.12*strength;
  if ((syn.ember || 0) >= 4) atk *= 1.24;
  if (has("bond"))
    atk *= 1 + Object.values(syn).filter((n) => n >= 2).length * .05*strength;
  if ((syn.storm || 0) >= 2) cd *= 0.82;
  if (has("clock")) cd *= 1-.22*strength;
  if ((syn.storm || 0) >= 4) dodge += 0.18;
  if (has("feather")) {
    dodge += .12*strength;
    speed *= 1+.12*strength;
  }
  if (c.focus === "aggressive") {
    atk *= 1.15;
    hp *= 0.92;
  }
  if (c.focus === "defensive") {
    hp *= 1.15;
    atk *= 0.92;
  }
  if (c.focus === "swift") {
    cd *= 0.85;
    atk *= 0.94;
  }
  const personal = personalEffects(c);
  const passive=familyPassiveStats(c),gear=equipmentEffects(c),curios=relicStatFactors([...relics,...(c.boundRelics||[])],strength),genes=c.genes||{};
  hp *= (genes.hp||1)*curios.hp;atk *= (genes.atk||1)*curios.atk;cd *= (genes.cd||1)*curios.cd;speed *= (genes.speed||1)*curios.speed;
  hp *= personal.health * gear.health;
  atk *= personal.attack * gear.attack;
  cd *= personal.cooldown * gear.cooldown / (1+minor.cooldown*secondaryLevels);
  speed *= personal.speed * gear.speed * (nativeEvolution(c).speed || 1);
  dodge += personal.dodge;
  return applyEliteStats({
    armor:c.balanceVersion>=15?({Guardian:34,Striker:12,Ranger:7,Support:9}[s.role]||10)+Math.max(0,c.level-1)*1.5*(levelGrowthRate(c)/.105)+gear.armor+personal.armor*100+(passive.armor||0):0,
    hp: Math.round(hp+gear.hpFlat),
    atk: Math.round(atk+gear.atkFlat),
    cd: cd * linkedSupport(c, c.id).cooldown,
    cdFactor: cd / SKILLS[s.id].cd,
    speed:(speed+gear.speedFlat)*(1+minor.speed*secondaryLevels),
    hpRegen:gear.hpRegen+minor.hpRegen*secondaryLevels,
    dodge:dodge+Math.min(.06,minor.dodge*secondaryLevels),
    range: s.range + (nativeEvolution(c).range || 0)+(passive.range||0),
    attackSpeed:(passive.attackSpeed||1)*curios.attackSpeed*gear.attackSpeed*(1+minor.attackSpeed*secondaryLevels)/((s.role==='Guardian'?1.55:1.3)*linkedSupport(c,loadoutFor(s,c.level,c).auto).attackSpeed),
    actionSpeed:(curios.actionSpeed*gear.actionSpeed+gear.actionSpeedFlat)*(1+minor.actionSpeed*secondaryLevels),
    staminaRecharge:((c.balanceVersion||0)>=17?({Striker:26,Ranger:22,Support:20,Guardian:15}[s.role]||20):20)*(passive.staminaRecharge||1)*curios.regenStamina*gear.regenStamina*(1+minor.staminaRecharge*secondaryLevels),
    dashCooldown:(passive.dashCooldown||1)*curios.dashCooldown*gear.dashCooldown/(1+minor.dashCooldown*secondaryLevels),
    dodgeStyle:(c.balanceVersion||0)>=17?dodgeStyle(s):'roll',
    personal,
  },c);
}
export function nextLevelPreview(c,team=[c],relics=[]){
 const next={...c,level:c.level+1},nextTeam=team.map(u=>u===c||c.uid&&u.uid===c.uid?next:u),s=BY_ID[c.id],before=loadoutFor(s,c.level,c),after=loadoutFor(s,next.level,next);
 return {skillChoice:c.skillsVersion===2&&SKILL_UNLOCK_LEVELS.includes(next.level),level:next.level,rarity:s.rarity,growthRate:levelGrowthRate(c),current:stats(c,team,relics),next:stats(next,nextTeam,relics),newSkills:after.active.filter(id=>!before.active.includes(id))};
}
export function makeRun(seed = Date.now(), ids = STARTERS, options = {}) {
  const random = rng(seed),
    native = options.native ?? ids.every(id=>!!BY_ID[id].nativeRig),
    rulesVersion=options.rulesVersion??17,teamSize=rulesVersion>=15?Math.max(1,Math.min(starterSlots(options),ids.length)):rulesVersion>=12?2:6,
    team = ids.slice(0, teamSize).map((id,i) => {const c=creature(id);c.seat=i;c.starter=true;return rulesVersion>=12?rollIndividual(c,seed+i*1179,true):c;});
  while(team.length<teamSize){const i=team.length,c=creature((native?NATIVE_STARTERS:STARTERS)[i]);c.seat=i;c.starter=true;team.push(rulesVersion>=12?rollIndividual(c,seed+i*1179,true):c);}
  if(rulesVersion>=15){
    const budget=Math.max(3,Math.min(23,options.starterBudget??starterBudget(options)));
    if(team.reduce((points,c)=>points+starterPoints(BY_ID[c.id].rarity,options.starterBonds?.[c.id]||0),0)>budget)throw new Error('Starting companions exceed the starter point budget.');
  }
  if(rulesVersion>=15)team.forEach((c,i)=>{c.balanceVersion=rulesVersion;c.equipmentVersion=2;c.equipment=[equipmentAffinity(c)==='fang'?(i===0?'heartstone-collar':'silver-fang'):i===0?'reliquary-plate':({sword:'sunsteel-edge',bow:'copper-practice-bow','two-handed':'training-maul',staff:'apprentice-staff',cannon:'brass-barrel'}[equipmentAffinity(c)])];});
  const result = {
    seed,
    rulesVersion,
    skillRulesVersion:options.manualSkills?2:1,
    teamCapacity:rulesVersion>=12?Math.max(teamSize,starterSlots(options)):teamSize,
    chaosCleared:Math.max(0,Math.min(20,options.chaosCleared||0)),
    captureTools:rulesVersion>=12?{scout:5,runic:0,astral:0,mythic:0}:undefined,
    native,
    rosterMode: options.rosterMode || (ids.every(id=>!!BY_ID[id].nativeRig)?"authored":"collection"),
    gearInventory: rulesVersion>=17?rollStarterGear(seed,team):[],
    starterGearVersion:rulesVersion>=17?1:undefined,
    difficulty: DIFFICULTIES[options.difficulty]
      ? options.difficulty
      : "standard",
    chaos: Math.max(1, Math.min(20, Math.floor(Number(options.chaos) || 1))),
    legendaryLure: false,
    captureOrder: null,
    fieldHospital: 0,
    fallen: [],
    defeatLedger: {},
    battleSerial: 0,
    contracts: [],
    random,
    team,
    bench: [],
    relics: [],
    inventory: rulesVersion>=17?[]:["scorch-fang", "ward-stone", "quick-shard"].map(personalRelic),
    gold: 160,
    orbs: 5,
    planet: 0,
    depth: 0,
    route: null,
    path: [],
    integrity: 3,
    wins: 0,
    kills: 0,
        nativeResolvedSkills: 0,
    stance: "balanced",
    shop: null,
    complete: false,
  };
  if(options.manualSkills)team.forEach((c,i)=>{c.skillSeed=seed+i*971;initializeSkills(c);});
  // Seeded independently: the opening relic never changes the route RNG stream.
  // The browser commits two saved offers after team selection; no automatic grant.
  const chaos = chaosLevel(result);
  if(chaos>=3)result.teamCapacity=Math.max(3,result.teamCapacity);
  if (chaos >= 3) result.gold = 130;
  if (chaos >= 7){result.orbs=4;if(result.captureTools)result.captureTools.scout=4;}
  if (chaos >= 14) result.integrity = 2;
  return result;
}
export function generateRoute(run) {
  if(progressive(run))return routeGraph(run);
  const r = rng(run.seed + run.planet * 9751);
  const options = [
    ["battle", "battle", "event"],
    ["shop", "elite", "battle"],
    ["capture", "rest", "event"],
    ["elite", "shop", "battle"],
    ["capture", "rest", "event"],
    ["boss"],
  ];
  return options.map((row, d) => {
    const types = [...row];
    if (d > 0 && d < 5)
      for (let j = types.length - 1; j > 0; j--) {
        const k = Math.floor(r() * (j + 1));
        [types[j], types[k]] = [types[k], types[j]];
      }
    if (d === 3 && r() < 0.4) types[types.indexOf("battle")] = "event";
    return types.map((type, i) => ({
      id: `p${run.planet}-${d}-${i}`,
      type,
      depth: d,
      lane: i,
      seed: Math.floor(r() * 1e8),
      archetype: ARCHETYPES[Math.floor(r() * ARCHETYPES.length)].id,
      weather:
        d === 0
          ? "clear"
          : [
              "clear",
              ...[
                ["pollen", "rain"],
                ["cinders", "magnet"],
                ["void", "magnet"],
              ][run.planet],
            ][Math.floor(r() * 3)],
      event: Math.floor(r() * EVENTS.length),
    }));
  });
}
export function encounterInfo(run, node) {
  const arch =
    ARCHETYPES.find((a) => a.id === node?.archetype) || ARCHETYPES[0];
  const weather = WEATHER.find((w) => w.id === node?.weather) || WEATHER[0];
  return { arch, weather, boss: BOSS_GUIDES[Math.min(2, run.planet)], eliteModifier:node?.type==="elite"?eliteEncounterModifier(node.seed):null };
}
export function setDeployment(run, index, row, column) {
  if (
    !run.team[index] ||
    !Number.isInteger(row) ||
    row < 0 ||
    row > 2 ||
    !Number.isInteger(column) ||
    column < 0 ||
    column > 2
  )
    return false;
  const other = run.team.findIndex((c, i) => {
    const d = c.deployment || defaultDeployment(c, i);
    return i !== index && d.row === row && d.column === column;
  });
  const previous = run.team[index].deployment;
  if (other >= 0){run.team[other].deployment=previous||defaultDeployment(run.team[index],index);delete run.team[other].deploymentPosition;}
  run.team[index].deployment = { row, column };delete run.team[index].deploymentPosition;
  return true;
}
export function defaultDeployment(c, index) {
  return {
    row: index % 3,
    column: index >= 3 ? 1 : BY_ID[c.id].range > 100 ? 0 : 2,
  };
}
export function skillDefinition(c,id){return nativeSkill(c,SKILLS[id]);}
export function effectiveSkill(c, id) {
  const def = skillDefinition(c,id),
    mod = linkedSupport(c, id);
  return {
    ...def,
    damageMultiplier: mod.damage,
    healMultiplier: mod.healing,
    radius: Math.round((def.radius || 0) * mod.area),
    addedTargets: mod.targets,
    modifiers: mod,
  };
}
export function canVisit(run, node) {
  if(progressive(run)&&run.route?.[0]?.[0]?.children)return graphCanVisit(run,node);
  if (node.depth !== run.depth) return false;
  if (run.depth === 0 || node.type === "boss") return true;
  return Math.abs(node.lane - run.lastLane) <= 1;
}
export function enterNode(run, node) {
  if (!canVisit(run, node)) throw new Error("Node is not reachable");
  if(progressive(run)&&run.route?.[0]?.[0]?.children&&run.depth>0&&!run.route.flat().find(n=>n.id===run.path.at(-1))?.children.includes(node.id))run.warpsUsed=(run.warpsUsed||0)+1;
  run.lastLane = node.lane;
  run.path.push(node.id);
}
export function nextNode(run) {
  run.depth++;
  if (run.depth >= (run.route?.length||6)) {
    run.planet++;
    run.depth = 0;
    run.lastLane = undefined;run.warpsUsed=0;
    run.route = null;
    if (run.planet >= PLANETS.length) run.complete = true;
  }
}
export function encounter(run, type = "battle", seed = 1) {
  const r = rng(seed),
    p = PLANETS[run.planet],
    base = progressive(run)?1+run.planet*2+Math.floor(run.depth/3):1 + run.planet * 2 + Math.floor(run.depth / 2),
    n = progressive(run)?(run.planet===0&&run.depth<3?(type==="battle"?2+(run.depth>0&&r()<.12?1:0):type==="elite"&&chaosLevel(run)<4?2:3):Math.min(6,type==="boss"?3+run.planet:type==="elite"?3+run.planet:2+run.planet+Math.floor(run.depth/3))):
      type === "boss"
        ? 4 + run.planet
        : type === "elite"
          ? 6
          : type === "capture" || run.depth === 0
            ? 4
            : 5;
  const foes = [];
  const novice=progressive(run)&&run.planet===0&&run.depth<3&&type==="battle",gentleComposition=novice&&r()<.85;
  const scout = run.route?.flat().find((n) => n.seed === seed),
    arch =
      ARCHETYPES.find((a) => a.id === scout?.archetype) ||
      ARCHETYPES[Math.floor(r() * ARCHETYPES.length)];
  const rarityRank = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
  const encounterPool = (run.rulesVersion||0)>=17?SPECIES.filter(s=>!s.boss).map(s=>s.id):run.native&&run.rosterMode!=='collection'?nativePool(run,type):p.pool.filter(id=>!BY_ID[id].nativeRig);
  const maxRank=run.planet===0&&run.depth<3?1:run.planet===0?2:run.planet===1?3:4;
  const pool = (run.rulesVersion||0)>=17?encounterPool:encounterPool.filter(id=>rarityRank[BY_ID[id].rarity]<=maxRank);
  const weights = {
    Common: 5,
    Uncommon: 4,
    Rare: 2.5,
    Epic: 1.2,
    Legendary: 0.4,
  };
  const earlyPressure=chaosLevel(run)>=4,firstWorldNormal=progressive(run)&&run.planet===0&&type==='battle',firstWorldElite=progressive(run)&&run.planet===0&&type==='elite';
  const chooseWild = (available) => {
    if((run.rulesVersion||0)>=17&&novice&&r()<.45)available=pool;
    if(firstWorldNormal){
      const rareLimit=earlyPressure?Math.min(3,1+Math.floor((chaosLevel(run)-4)/6)):run.depth<3?0:1;
      const rareCount=foes.filter(c=>rarityRank[BY_ID[c.id].rarity]>=2).length;
      const eligible=id=>(earlyPressure||rarityRank[BY_ID[id].rarity]<=2)&&(rarityRank[BY_ID[id].rarity]<2||rareCount<rareLimit);
      available=available.filter(eligible);if(!available.length)available=pool.filter(eligible);
    }
    if(firstWorldElite&&!earlyPressure){
      const rareLimit=run.depth<3?1:2,rareCount=foes.filter(c=>rarityRank[BY_ID[c.id].rarity]>=2).length;
      const eligible=id=>rarityRank[BY_ID[id].rarity]<=2&&(rarityRank[BY_ID[id].rarity]<2||rareCount<rareLimit);
      available=available.filter(eligible);if(!available.length)available=pool.filter(eligible);
    }
    if((run.rulesVersion||0)>=17){const fresh=available.filter(id=>!foes.some(c=>c.id===id));if(fresh.length)available=fresh;}
    let roll =
      r() * available.reduce((sum, id) => sum + (weights[BY_ID[id].rarity]*(novice&&rarityRank[BY_ID[id].rarity]>1?(earlyPressure?Math.min(.9,.40+(chaosLevel(run)-4)*.035):.32):1)), 0);
    for (const id of available) {
      roll -= weights[BY_ID[id].rarity]*(novice&&rarityRank[BY_ID[id].rarity]>1?(earlyPressure?Math.min(.9,.40+(chaosLevel(run)-4)*.035):.32):1);
      if (roll <= 0) return id;
    }
    return available.at(-1);
  };
  for (let i = 0; i < n; i++) {
    const rare = encounterPool.filter((id) =>
      ["Rare", "Epic", "Legendary"].includes(BY_ID[id].rarity),
    );
    const id =
      type === "boss" && i === 0
        ? p.boss
        : type === "capture" && i === n - 1 && rare.length
          ? chooseWild(rare)
          : chooseWild(
              pool.filter((id) => BY_ID[id].role === (gentleComposition?(i===0?"Guardian":"Striker"):arch.roles[i])).length
                ? pool.filter((id) => BY_ID[id].role === (gentleComposition?(i===0?"Guardian":"Striker"):arch.roles[i]))
                : pool,
            );
    const legends = encounterPool.filter((id) => BY_ID[id].rarity === "Legendary");
    const chosen =
      type === "capture" &&
      i === n - 1 &&
      legends.length &&
      (run.legendaryLure || (run.planet > 0 && r() < 0.3))
        ? pick(legends, r)
        : id;
    const c = creature(chosen, Math.max(1, base + (type === "elite" ? 1 : 0)));
    if(progressive(run)){rollIndividual(c,seed+i*741);assignEnemyRelics(run,c,type,seed+((run.rulesVersion||0)>=15?0:i*569));if(novice){c.genes.hp*=((run.rulesVersion||0)>=15?.78:.72)+run.depth*.04;c.genes.atk*=((run.rulesVersion||0)>=15?.73:.70)+run.depth*.04;c.encounterTraining="Unseasoned";}}
    c.balanceVersion=run.rulesVersion;c.role=BY_ID[c.id].role;
    c.archetype = arch.id;
    if(run.native)c.terrain=terrainFor(run,seed);
    c.elite = type === "elite";
    c.weather = scout?.weather || "clear";
    c.policy =
      arch.id === "pack"
        ? "execute"
        : arch.id === "duelists"
          ? "healer"
          : arch.id === "bastion"
            ? "guardian"
            : "adaptive";
    if (type === "boss" && i === 0) {
      c.boss = true;
      c.bossName = p.bossName;
    }
    if (c.level >= 5 && ["elite", "boss"].includes(type)) {
      c.evolution = 1;
      c.evolutionPath = ["Guardian", "Support"].includes(BY_ID[c.id].role)
        ? "warden"
        : "wild";
    }
    if((run.rulesVersion||0)>=15)enemyEquipment(c,seed+i*431,run.planet*8+run.depth,chaosLevel(run));
    foes.push(c);
  }
  if(type==="elite")assignEliteModifier(foes,seed,BY_ID);
  if((run.rulesVersion||0)>=17)foes.forEach((c,i)=>assignEnemyStones(c,seed+i*919,run.planet*8+run.depth));
  if(run.skillRulesVersion===2)foes.forEach((c,i)=>prepareEnemySkills(c,seed+i*1217));
  return foes;
}
export function captureChance(run, c) {
  const preparation = c.capturePreparation || {};
  const weak =
    preparation.healthFraction !== undefined
      ? Math.max(0, 0.55 - preparation.healthFraction) * 0.4
      : 0;
  const status = preparation.status ? 0.12 : 0;
  const baseChance=Math.min(
    0.97,
    RARITY[BY_ID[c.id].rarity].catch +
      (run.relics.includes("lens") ? 0.18 : 0) +
      (run.encounterType === "capture" ? 0.12 : 0) +
      weak +
      status +
      (preparation.mode === "mercy" ? 0.08 : 0),
  );
  if(!progressive(run))return baseChance;
  const mods=routeModifiers(run),tier=CAPTURERS[preparation.tool||run.captureOrder?.tool||run.selectedCapturer||"scout"]||CAPTURERS.scout;
  const former=Math.min(.85,baseChance*.5*tier.mult+(preparation.healthFraction<=.3?(mods.captureBonus||0):0)+(preparation.status?(mods.statusCapture||0):0));
  if((run.rulesVersion||0)<15)return former;
  const health=Math.max(0,Math.min(1,preparation.healthFraction??.25));
  // Scout Prism, Mercy mode and the default 25% HP threshold are the baseline.
  const rarity=BY_ID[c.id].rarity, easy=['Common','Uncommon'].includes(rarity);
  const baseline={Common:.90,Uncommon:.85,Rare:.25,Epic:.22,Legendary:.08}[rarity];
  const hp=health;
  if(hp>=1||c.boss)return 0;
  const healthFactor=easy?(hp<=.35?1+(.25-hp)*.6:.94*Math.pow((1-hp)/.65,1.8)):Math.pow((1-hp)/.75,1.8);
  const bonus=((run.relics.includes('lens')?.06:0)+(run.encounterType==='capture'?.04:0)+(preparation.status?.04:0)+(hp<=.3?(mods.captureBonus||0):0)+(preparation.status?(mods.statusCapture||0):0))*Math.min(1,(1-hp)/.75);
  return Math.min(easy?.99:rarity==='Legendary'?.30:.70,(baseline*healthFactor*tier.mult+bonus)*(preparation.mode==='swift'?.94:1));
}
export function rollCapture(run, c) {
  if((run.rulesVersion||0)>=15)return {success:false,reason:"Captures must be selected before battle. Defeated creatures cannot be captured."};
  if (!c || c.boss)
    return {
      success: false,
      reason: "Planet guardians cannot be captured; seek their wild family.",
    };
  if (run.orbs <= 0) return { success: false, reason: "No capture orbs" };
  if (run.bench.length >= 12) return { success: false, reason: "Bench full" };
  if(!consumeCapturer(run,run.selectedCapturer||"scout"))return {success:false,reason:"Selected capturer is unavailable"};
  const success = run.random() < captureChance(run, c);
  if (success) return { success: true, creature: awardCapture(run, c) };
  const result={success:false,tool:run.selectedCapturer||"scout"};result.refunded=refundCapture(run,result,`manual:${run.planet}:${run.depth}:${c.uid}`,run.seed+run.depth*191);return result;
}
export function awardCapture(run, c) {
  const caught = creature(c.id, Math.max(1, c.level));
  if((run.rulesVersion||0)>=15)caught.balanceVersion=run.rulesVersion;
  if(progressive(run)){caught.relics=structuredClone(c.relics||[]);caught.genes=c.genes;caught.nature=c.nature;caught.boundRelics=[...(c.enemyRelics||c.boundRelics||[])];caught.equipment=[...(c.equipment||[])];caught.equipmentVersion=c.equipmentVersion;caught.equipmentQuality=1;caught.equipmentRolls=caught.equipment.map((id,i)=>({...c.equipmentRolls?.[i],id,quality:(c.equipmentRolls?.[i]?.quality??1)*(c.equipmentQuality??1)}));}
  if(c.eliteModifier){caught.eliteModifier=c.eliteModifier;caught.eliteTier=c.eliteTier||4;}
  if(c.skillsVersion===2)Object.assign(caught,{skillsVersion:2,manualSkills:true,learnedSkills:[...c.learnedSkills||[]],chosenEvolutionSkills:[...c.chosenEvolutionSkills||[]],evolutionSkillsVersion:c.evolutionSkillsVersion,archivedSkills:[...c.archivedSkills||[]],pendingSkills:[],skillChoicesThrough:c.level,skillSeed:c.skillSeed});
  caught.evolution = evolutionStage(c);
  caught.evolutionPath = caught.evolution ? c.evolutionPath : null;
  run.bench.push(caught);
  if(progressive(run)){const mod=routeModifiers(run);run.gold+=mod.captureGold||0;if(mod.captureXP)run.team.forEach(u=>gainXP(u,mod.captureXP));}
  if (run.relics.includes("hatchery")) {
    run.gold += 20*itemStrength(run);
    run.team.forEach((u) => gainXP(u, 35*itemStrength(run)));
  }
  return caught;
}
// Settle the battle's recruitment after rewards/casualties. The combat copy
// stays separate, so a saved mid-fight capture cannot duplicate a deployed ally.
export function settleCaptureRecruitment(run, result) {
  if (!result?.success || !BY_ID[result.creature?.id]) return null;
  const key = result.uid || result.creature.uid;
  if (!key) return null;
  run.captureRecruitments ??= {};
  if (run.captureRecruitments[key]) {
    result.recruitment = run.captureRecruitments[key];
    return result.recruitment;
  }
  let caught = [...run.team, ...run.bench].find(c =>
    c.captureSourceUid === key || c.uid === result.creature.uid);
  if (!caught) caught = awardCapture(run, result.creature);
  initializeCompanion(run, caught);
  caught.captureSourceUid = key;
  caught.bond = result.creature.bond || caught.bond || 0;
  const equipmentDrops=(caught.equipment||[]).map((id,slot)=>{
    const roll=caught.equipmentRolls?.[slot]||{};
    return {id:`capture:${key}:gear:${slot}`,kind:'gear',gear:id,
      quality:roll.quality??1,rarity:roll.rarity||'Common',fromCapture:true,
      sourceUid:key,sourceId:caught.id,sourceName:creatureName(caught),sourceLevel:caught.level};
  });
  const stoneDrops=enemyStoneDrops(caught,`capture:${key}`).map(d=>({...d,fromCapture:true}));
  caught.relics=[];caught.equipment=[];caught.equipmentRolls=[];caught.equipmentVersion=2;
  const reserveIndex = run.bench.indexOf(caught);
  if (reserveIndex >= 0 && run.team.length < capacity(run))
    deployReserve(run, reserveIndex);
  const recruitment = { uid: caught.uid, id: caught.id, equipmentDrops,stoneDrops,
    destination: run.team.includes(caught) ? 'team' : 'reserve' };
  if (recruitment.destination === 'team') recruitment.seat = caught.seat;
  run.captureRecruitments[key] = recruitment;
  result.recruitment = recruitment;
  return recruitment;
}
export function buyLegendaryLure(run) {
  const cost = shopPrice(run, 90);
  if (run.legendaryLure || run.gold < cost) return false;
  run.gold -= cost;
  run.legendaryLure = true;
  return true;
}
export function generateShop(run, seed) {
  const r = rng(seed),
    available = RELICS.filter((item) => !item.openingTier && !run.relics.includes(item.id)),
    relics = [];
  while (available.length && relics.length < ((run.rulesVersion||0)>=15?2:3))
    relics.push(available.splice(Math.floor(r() * available.length), 1)[0].id);
  const gear = [...((run.rulesVersion||0)>=17?AURA_STONES:PERSONAL_RELICS)],
    personal = [];
  while (personal.length < 3)
    personal.push(gear.splice(Math.floor(r() * gear.length), 1)[0].id);
  return {
    relics,
    personal,
    stoneReferenceCost:RELICS.find(r=>r.id===relics[0])?.cost||260,
    creature: pick(
      SPECIES.filter((s) => s.rarity !== "Legendary" && (!run.native || run.rosterMode==="collection" || NATIVE_POOLS[run.planet].includes(s.id))),
      r,
    ).id,
    legendary: pick(
      SPECIES.filter((s) => s.rarity === "Legendary" && (!run.native || run.rosterMode==="collection" || NATIVE_POOLS[run.planet].includes(s.id))),
      r,
    ).id,
    recruits: progressive(run)?recruitOffer(run,seed+827,[...Array(3)].map((_,i)=>pick(SPECIES.filter(s=>s.rarity!=="Legendary"&&(!run.native||run.rosterMode==="collection"||NATIVE_POOLS[run.planet].includes(s.id))),r).id)):undefined,
    gear:((run.rulesVersion||0)>=15?CREATURE_GEAR:CREATURE_GEAR.slice(0,6)).slice().sort(()=>r()-.5).slice(0,4).map(g=>g.id),
    sold: [],
    rerolls: 0,
  };
}
export function buyRelic(run, id) {
  const relic = RELICS.find((r) => r.id === id);
  if (
    !relic ||
    run.relics.includes(id) ||
    run.gold < shopPrice(run, relic.cost)
  )
    return false;
  run.gold -= shopPrice(run, relic.cost);
  run.relics.push(id);
  return true;
}
export function buyCreature(run, id) {
  const s = BY_ID[id],
    cost = shopPrice(run, RARITY[s.rarity].cost);
  if (run.gold < cost || run.bench.length >= 12) return false;
  run.gold -= cost;
  const c=creature(id,1+run.planet*3);if(progressive(run))rollIndividual(c,run.seed+run.gold+run.bench.length*317);initializeCompanion(run,c);run.bench.push(c);
  return true;
}
export const CASUALTY_RISK = {
  Common: 0.65,
  Uncommon: 0.5,
  Rare: 0.35,
  Epic: 0.22,
  Legendary: 0.12,
};
export function casualtyRisk(run, c) {
  if(progressive(run))return 1;
  const rarity = BY_ID[c.id]?.rarity;
  return (
    (CASUALTY_RISK[rarity] || 0.65) *
    Math.pow(0.7, Math.min(3, run.fieldHospital || 0)) *
    Math.pow(0.75, Math.min(2, c.survivalTraining || 0)) *
    (evolutionStage(c) ? 0.85 : 1)
  );
}
export function hospitalOffer(run) {
  const level = Math.min(3, run.fieldHospital || 0),
    cost = shopPrice(run, 65 + level * 45);
  return { level, cost, ready: level < 3 && run.gold >= cost };
}
export function upgradeHospital(run) {
  const offer = hospitalOffer(run);
  if (!offer.ready) return false;
  run.gold -= offer.cost;
  run.fieldHospital = offer.level + 1;
  return true;
}
export function trainSurvival(run, index) {
  const c = run.team[index],
    level = c?.survivalTraining || 0,
    cost = shopPrice(run, 30 + level * 30);
  if (!c || level >= 2 || run.gold < cost) return false;
  run.gold -= cost;
  c.survivalTraining = level + 1;
  return true;
}
export function deployReserve(run, benchIndex, targetIndex = run.team.length, targetSeat = null) {
  if(targetSeat!==null&&(!Number.isInteger(targetSeat)||targetSeat<0||targetSeat>=capacity(run)||run.team.some(c=>c.seat===targetSeat)))return false;
  if (
    !Number.isInteger(benchIndex) ||
    !run.bench[benchIndex] ||
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex > run.team.length ||
    targetIndex >= capacity(run)
  )
    return false;
  const reserve = run.bench[benchIndex],
    previous = run.team[targetIndex];
  if (previous) run.bench[benchIndex] = previous;
  else run.bench.splice(benchIndex, 1);
  const used = new Set(
    run.team
      .filter((c, i) => i !== targetIndex)
      .map((c, i) => {
        const d = c.deployment || defaultDeployment(c, run.team.indexOf(c));
        return `${d.row}:${d.column}`;
      }),
  );
  let deployment =
    previous?.deployment ||
    (previous ? defaultDeployment(previous, targetIndex) : null);
  if (!deployment) {
    for (let row = 0; row < 3 && !deployment; row++)
      for (let column = 0; column < 3; column++)
        if (!used.has(`${row}:${column}`)) {
          deployment = { row, column };
          break;
        }
  }
  reserve.seat=targetSeat??previous?.seat??[...Array(capacity(run)).keys()].find(s=>!run.team.some(c=>c.seat===s));
  delete reserve.placement;reserve.deployment = deployment;
  if(previous?.deploymentPosition)reserve.deploymentPosition={...previous.deploymentPosition};else delete reserve.deploymentPosition;
  run.team[targetIndex] = reserve;
  return true;
}
export function settleDefeat(run, key, seed) {
  if(progressive(run))return newCasualty(run,key,seed);
  run.defeatLedger ||= {};
  if (run.defeatLedger[key]) return run.defeatLedger[key];
  const r = rng(seed + 731947),
    selected = run.team[Math.floor(r() * run.team.length)];
  if (!selected)
    return (run.defeatLedger[key] = {
      lost: false,
      reason: "No deployed companion remains",
    });
  const risk = casualtyRisk(run, selected),
    lost = r() < risk;
  const outcome = {
    lost,
    id: selected.id,
    uid: selected.uid,
    name: creatureName(selected),
    rarity: BY_ID[selected.id].rarity,
    level: selected.level,
    risk,
    hospital: run.fieldHospital || 0,
    training: selected.survivalTraining || 0,
    key,
  };
  if (lost) {
    run.team.forEach((c, i) => {
      c.deployment ||= defaultDeployment(c, i);
    });
    run.team = run.team.filter((c) => c.uid !== selected.uid);
    run.inventory.push(
      ...(selected.relics || []).map((item) => {
        const { link, ...recovered } = item;
        return recovered;
      }),
    );
    run.fallen ||= [];
    run.fallen.push({ ...outcome, planet: run.planet, depth: run.depth });
  }
  run.defeatLedger[key] = outcome;
  return outcome;
}
export function rewardBattle(run, type, won, battle = null) {
  settleNativeGrowth(run,battle);
  if (won) {
    run.wins++;
    const gold = Math.round(
      (type === "boss" ? 145 : type === "elite" ? 85 : 48 + run.depth * 4) *
        (run.relics.includes("coin") ? 1+.35*itemStrength(run) : 1) *
        (run.relics.includes("salvage") && type !== "elite" && type !== "boss"
          ? 0.9
          : 1) *
        (chaosLevel(run) >= 17 ? 0.88 : 1) * ((run.rulesVersion||0)>=15?.65:1),
    );
    run.gold += gold;
    const xp = Math.round(
      (type === "boss" ? 72 : type === "elite" ? 46 : 32 + run.depth * 3) *
        (1 + run.planet * 0.35),
    );
    const levels = [],growth=[];
    for (const c of run.team) {
      const before={level:c.level,xp:c.xp,needed:xpNeeded(c.level)},amount=Math.round(xp*personalEffects(c).xp);
      const n = gainXP(c, amount);
      growth.push({uid:c.uid,id:c.id,before,after:{level:c.level,xp:c.xp,needed:xpNeeded(c.level)},amount,levels:n});
      if (n) levels.push(c.id);
    }
    if (type === "boss"){if(progressive(run))addCapturer(run,"runic",2);else run.orbs+=2;}
    const slotsAdded=unlockSlots(run),mods=routeModifiers(run);const bonus=progressive(run)?(type==="battle"?mods.battleGold||0:type==="elite"?Math.round(gold*(mods.eliteGold||0)):Math.round(gold*(mods.bossGold||0)))+(mods.lowGold&&(battle?.startingGold??run.gold-gold)<mods.lowGold?20:0):0;run.gold+=bonus;
    const choicePool=RELICS.filter(r=>!r.openingTier&&!run.relics.includes(r.id)),choiceRandom=rng(run.seed+run.wins*7171);const relicChoices=(run.rulesVersion||0)>=15&&['elite','boss'].includes(type)?[...Array(Math.min(2,choicePool.length))].map(()=>choicePool.splice(Math.floor(choiceRandom()*choicePool.length),1)[0].id):undefined;
    const gearRandom=rng(run.seed+run.wins*3517),equipmentReward=(run.rulesVersion||0)>=15&&run.wins>1&&!['elite','boss'].includes(type)&&gearRandom()<.7?pick(CREATURE_GEAR,gearRandom).id:undefined;
    return { gold:gold+bonus, xp, levels, growth,slotsAdded,relicChoices,equipmentReward };
  }
  run.integrity--;
  const growth=run.team.map(c=>{const before={level:c.level,xp:c.xp,needed:xpNeeded(c.level)},amount=Math.round(12*personalEffects(c).xp),levels=gainXP(c,amount);return {uid:c.uid,id:c.id,before,after:{level:c.level,xp:c.xp,needed:xpNeeded(c.level)},amount,levels};});
  return {gold:0,xp:12,growth,levels:growth.filter(g=>g.levels>0).map(g=>g.id)};
}
export const EVENTS = [
  {
    title: "The sleeping grove",
    story:
      "An ancient creature sleeps beneath a canopy of luminous roots. It dreams in your language. What will you leave behind?",
    choices: [
      {
        title: "Offer 60 gold",
        desc: "Receive the Evergreen Heart relic. A gift that keeps your team alive.",
        kind: "relic",
        cost: 60,
        relic: "seed",
      },
      {
        title: "Disturb the roots",
        desc: "Risk one expedition life for a 65% chance to recruit a Rare Thornstag.",
        kind: "risk",
        creature: "thornstag",
      },
      {
        title: "Rest in its shadow",
        desc: "Every creature gains 22 EXP. No cost, no risk.",
        kind: "xp",
        amount: 22,
      },
    ],
  },
  {
    title: "The star merchant",
    story:
      "A collector of impossible things waits at a crossroads. A small, crackling creature peers out of their coat.",
    choices: [
      {
        title: "Trade 2 capture orbs",
        desc: "Recruit a Rare Tempest. Unlock it permanently as a future starter.",
        kind: "trade",
        cost: 2,
        creature: "tempest",
      },
      {
        title: "Buy a rumor · 40 gold",
        desc: "Gain the Hunters’ Lens relic. Captures become 18% more likely.",
        kind: "relic",
        cost: 40,
        relic: "lens",
      },
      {
        title: "Share your story",
        desc: "Gain 35 gold. Some things are worth remembering.",
        kind: "gold",
        amount: 35,
      },
    ],
  },
  {
    title: "The broken observatory",
    story:
      "A machine still counts the seconds since this world went silent. Its heart could power your expedition, if you dare reach inside.",
    choices: [
      {
        title: "Extract the time core",
        desc: "Spend one expedition life. Gain Broken Hourglass: 22% faster skills.",
        kind: "sacrifice",
        relic: "clock",
      },
      {
        title: "Study the star charts",
        desc: "Your team gains 30 EXP. Knowledge is its own treasure.",
        kind: "xp",
        amount: 30,
      },
      {
        title: "Salvage the telescope",
        desc: "Gain 65 gold to spend at the next outpost.",
        kind: "gold",
        amount: 65,
      },
    ],
  },
];
EVENTS.push(...NEW_EVENTS);
EVENTS.push({
  title: "The celestial migration",
  story:
    "A Legendary family follows an orbital current. A signal beacon can guide one into the next sanctuary.",
  choices: [
    {
      title: "Buy a celestial beacon · 60 gold",
      desc: "The next sanctuary guarantees a Legendary encounter. Capturing still requires victory or a tactical orb.",
      kind: "lure",
      cost: 60,
    },
    {
      title: "Recruit a Starborn · 3 orbs",
      desc: "Unlock Starborn permanently. Requires space on your bench.",
      kind: "trade",
      cost: 3,
      creature: "starborn",
    },
    {
      title: "Chart the migration",
      desc: "Gain one orb and 25 gold.",
      kind: "supplies",
      gold: 25,
      orbs: 1,
    },
  ],
});
export function eventAvailable(run, c) {
  if (!c) return false;
  if (["gem", "study", "lure", "relic"].includes(c.kind) && run.gold < c.cost)
    return false;
  if (["orb-gem", "trade"].includes(c.kind) && run.orbs < c.cost) return false;
  if (c.relic && run.relics.includes(c.relic)) return false;
  if (["trade", "risk"].includes(c.kind) && run.bench.length >= 12)
    return false;
  if (["risk", "sacrifice"].includes(c.kind) && run.integrity <= 1)
    return false;
  if (c.kind === "lure" && run.legendaryLure) return false;
  if (c.kind === "life" && run.integrity >= 3) return false;
  return true;
}
export function eventForRun(run, input) {
  const original=typeof input==='number'?EVENTS[input]:input;
  if(!run.native || run.rosterMode==="collection")return original;
  const event=JSON.parse(JSON.stringify(original));
  for(const choice of event.choices){
    if(!choice.creature||BY_ID[choice.creature]?.nativeRig)continue;
    const old=BY_ID[choice.creature],rank=['Common','Uncommon','Rare','Epic','Legendary'];
    const candidates=NATIVE_POOLS[run.planet].map(id=>BY_ID[id]).sort((a,b)=>Math.abs(rank.indexOf(a.rarity)-rank.indexOf(old.rarity))*3+(a.role!==old.role?1:0)-(Math.abs(rank.indexOf(b.rarity)-rank.indexOf(old.rarity))*3+(b.role!==old.role?1:0)));
    const replacement=candidates[0];choice.creature=replacement.id;
    event.title=event.title.replaceAll(old.name,replacement.name);
    event.story=`A wounded ${replacement.name} waits near a forgotten camp. Its ${replacement.role.toLowerCase()} specialty could change your team. ${replacement.skillDesc}`;
    choice.title=choice.title.replaceAll(old.name,replacement.name);choice.desc=`Recruit ${replacement.name} and permanently discover its native family. Existing resource costs and risks apply.`;
  }
  return event;
}
export function applyEvent(run, event, index) {
  event=eventForRun(run,event);
  const c = event.choices[index];
  if (!eventAvailable(run, c)) return { ok: false };
  if (c.kind === "gem" || c.kind === "orb-gem") {
    if (c.kind === "gem") run.gold -= c.cost;
    else spendCapturers(run,c.cost);
    run.inventory.push(personalRelic(c.gem));
  }
  if (c.kind === "study") {
    run.gold -= c.cost;
    run.team.forEach((u) => gainXP(u, c.amount));
  }
  if (c.kind === "lure") {
    run.gold -= c.cost;
    run.legendaryLure = true;
  }
  if (c.kind === "contract") {
    run.gold += c.gold || 0;
    run.team.forEach((u) => gainXP(u, c.xp || 0));
    (run.contracts ||= []).push({
      attack: c.enemy || 0,
      health: c.health || 0,
    });
  }
  if (c.kind === "life") run.integrity = Math.min(3, run.integrity + c.amount);
  if (c.kind === "orbs") progressive(run)?addCapturer(run,"scout",c.amount):run.orbs+=c.amount;
  if (c.kind === "supplies") {
    run.gold += c.gold;
    progressive(run)?addCapturer(run,"scout",c.orbs):run.orbs+=c.orbs;
  }
  if (c.kind === "relic") {
    if (run.gold < c.cost || run.relics.includes(c.relic)) return { ok: false };
    run.gold -= c.cost;
    run.relics.push(c.relic);
  }
  if (c.kind === "trade") {
    if (run.orbs < c.cost || run.bench.length >= 12) return { ok: false };
    spendCapturers(run,c.cost);
    run.bench.push(initializeCompanion(run,creature(c.creature, 1 + run.planet * 3)));
  }
  if (c.kind === "risk") {
    if (run.integrity <= 1 || run.bench.length >= 12) return { ok: false };
    if (run.random() < 0.65) {
      run.bench.push(initializeCompanion(run,creature(c.creature, 2 + run.planet * 3)));
      return {
        ok: true,
        captured: c.creature,
        message: `${BY_ID[c.creature].name} joins your expedition.`,
      };
    }
    run.integrity--;
    return {
      ok: true,
      message: "The grove strikes back. One expedition life lost.",
    };
  }
  if (c.kind === "sacrifice") {
    if (run.integrity <= 1 || run.relics.includes(c.relic))
      return { ok: false };
    run.integrity--;
    run.relics.push(c.relic);
  }
  if (c.kind === "xp") run.team.forEach((u) => gainXP(u, c.amount));
  if (c.kind === "gold") run.gold += c.amount;
  return {
    ok: true,
    captured: c.creature,
    message:
      c.kind === "trade"
        ? `${BY_ID[c.creature].name} joins your expedition.`
        : "Your choice has changed the expedition.",
  };
}

export class Battle {
  constructor(run, foes, seed = 1, options={}) {
    this.visuals=options.visuals!==false;
    this.tuning=normalizeTuning(options.tuning||getTuning());
    this.enrageAnnounced=false;
    this.run = run;
    this.native=!!run.native;
    this.growthKey=`${run.planet}:${run.depth}:${seed}:${run.wins}:${run.integrity}`;
    this.bounds=this.native?NATIVE_BOUNDS:undefined;
    this.terrain=terrainFor(run,seed);
    this.random = rng(seed);
    this.time = 0;
    this.accumulator = 0;
    this.renderAlpha = 0;
    this.done = false;
    this.winner = null;
    this.units = [];
    this.projectiles = [];
    this.strikes = [];
    this.attackSerial = 0;
    this.cancelledAttacks = new Set();
    this.effects = [];
    this.combatTexts = [];
    this.textSerial = 0;
    this.particles = [];
    this.hazards = [];
    this.queue = [];
    this.log = [];
    this.killLedger = [];
    this.shake = 0;
    this.fields = [];
    this.audioEvents = [];
    this.weather = foes[0]?.weather || "clear";
    this.chaos = chaosLevel(run);
    this.stormTimer = this.chaos >= 15 ? 7 : 10;
    this.signatureCount = 0;
    this.revived = false;
    this.savedCaptureResult = run.captureReservation?.result || null;
    this.startingGold=run.gold;
    this.captureResult = null;
    this.capturePlan = run.captureOrder || null;
    this.captureSettled = false;
    this.captureAttempts=run.captureReservation?.attempts||(this.savedCaptureResult?1:0);
    this.captureHistory=[...(run.captureReservation?.history||[])];
    this.autoRetryAt=null;this.autoRetryBlocked=null;
    this.activeArchetype = foes[0]?.archetype;
    this.damageBySkill = {};
    this.metrics = {
      chargedStrikes:0, armorResists:0, bladeContacts:0, terrainBlocks:0, interruptedSkills:0,
      dodges: 0,
      skills: 0,
        nativeResolvedSkills: 0,
      damage: 0,
      healing: 0,
      crits: 0,
      echoes: 0,
      intercepts: 0,
      shieldDamage: 0,
      wastedHealing: 0,
      statusDamage: 0,
      hazardDamage: 0,
      cleanses: 0,
      traitProcs: 0,
      captures: 0,
      whiffs: 0,
      physicalHits: 0,
      collisions: 0,
      knockbacks: 0,
      staggers: 0,
      rolls: 0,
      blockedProjectiles: 0,
    };
    this.teamSyn = synergies(run.team);
    this.foeSyn = synergies(foes);
    const add = (c, side, index, team) => {
      const model={...c,balanceVersion:run.rulesVersion},st = stats(model, team, side === 0 ? run.relics : c.enemyRelics||[]),
        loadout = loadoutFor(BY_ID[c.id], c.level, c);
      if(c.skillOrder)loadout.active.sort((a,b)=>(c.skillOrder.includes(a)?c.skillOrder.indexOf(a):99)-(c.skillOrder.includes(b)?c.skillOrder.indexOf(b):99));
      const opponentRelics=side===1?[...run.relics,...run.team.flatMap(c=>c.boundRelics||[])]:foes.flatMap(c=>[...(c.enemyRelics||[]),...(c.boundRelics||[])]);st.hp*=relicStatFactors(opponentRelics,itemStrength(run)).enemyHP;
      if (side === 1) {
        const diff = DIFFICULTIES[run.difficulty] || DIFFICULTIES.standard;
        st.hp *=
          diff.health *
          (this.chaos >= 11 ? 1.1 : 1) *
          (c.elite && this.chaos >= 1 ? 1.12 : 1);
        if((run.rulesVersion||0)>=15){const progress=run.planet*8+run.depth;st.hp*=1.04+progress*.02+this.chaos*.014;st.atk*=1.02+progress*.0125+this.chaos*.012;st.cdFactor*=1-Math.min(.15,progress*.006+this.chaos*.003);}
        st.atk *= diff.attack * (c.boss && this.chaos >= 16 ? 1.12 : 1);
        for (const contract of run.contracts || []) {
          st.hp *= 1 + contract.health;
          st.atk *= 1 + contract.attack;
        }
        if (c.elite && this.chaos >= 8) st.cdFactor *= 0.9;
      }
      if (c.boss) {
        st.hp *= 1.65 * (this.chaos >= 5 ? 1.15 : 1);
        st.atk *= 1.04;
      }
      if (this.weather === "void") st.cdFactor *= 0.9;
      const rear = st.range > 100,
        x = side === 0 ? (rear ? 160 : 285) : rear ? 840 : 715,
        y = 160 + (index % 3) * 110 + (index >= 3 ? 35 : -25);
      const deployment =
        side === 0 ? c.deployment || defaultDeployment(c, index) : null;
      const actualX = deployment
        ? [155, 225, 305][deployment.column]
        : x + (index >= 3 ? -30 : 25) * (side === 0 ? 1 : -1);
      const actualY = deployment
        ? [155, 275, 395][deployment.row] + (index >= 3 ? 24 : -15)
        : y;
      const cooldowns = Object.fromEntries(
        loadout.active.map((id, i) => {
          const total =
            skillDefinition(c,id).cd * st.cdFactor * linkedSupport(c, id).cooldown * (['dash','charge'].includes(skillDefinition(c,id).kind)?st.dashCooldown:1);
          return [
            id,
            { total, remaining: 1.6 + i * 1.8 + this.random() * 3, casts: 0 },
          ];
        }),
      );
      this.units.push({
        ...c,
        balanceVersion:run.rulesVersion,role:BY_ID[c.id].role,element:BY_ID[c.id].element,
        ...st,
        ...bodyProperties(BY_ID[c.id], c),
        maxHp: st.hp,
        hp: st.hp,
        side,
        x: actualX,
        y: actualY,
        px: actualX,
        py: actualY,
        loadout,
        cooldowns,
        attackTimer: 0.3 + this.random(),
        skillTimer: cooldowns[c.id].remaining,
        shield: side === 0 && run.relics.includes("prism") ? 65*itemStrength(run) : 0,
        exposed: 0,
        weakened: 0,
        wither: 0,
        regeneration: 0,
        retaliation: 0,
        beaconTimer: 0,
        guardTimer: 0,
        guardUid: null,
        damageTaken: 0,
        shieldAbsorbed: 0,
        statusTaken: 0,
        hazardTaken: 0,
        excessHealing: 0,
        traitHits: 0,
        healCount: 0,
        autoHits: 0,
        mercyUsed: false,
        phase: 1,
        bossMechanicTimer: 5,
        dashAnim: 0,
        dashFrom: null,
        velocityX: 0,
        velocityY: 0,
        impulseX: 0,
        impulseY: 0,
        stamina: 100,
        poise: 0,
        stagger: 0,
        bleed: 0,
        dodgeCooldown: 0.6 + this.random() * 0.5,
        rollTime: 0,
        rollX: 0,
        rollY: 0,
        rollCount: 0,
        actionLock: 0,
        actionId: null,
        targetMemory: null,
        targetTimer: 0,
        threatKey: null,
        reactionTime: 0,
        captured: false,
        burn: 0,
        poison: 0,
        root: 0,
        slow: 0,
        taunt:
          side === 0 &&
          run.relics.includes("banner") &&
          BY_ID[c.id].role === "Guardian"
            ? 3
            : 0,
        haste: 0,
        evade: 0,
        fortify: 0,
        regenBuff: 0,
        movementBuff: 0,
        rage: 0,
        damage: 0,
        healed: 0,
        kills: 0,
        nativeResolvedSkills: 0,
        flash: 0,
        attackAnim: 0,
        castAnim: 0,
        hitAnim: 0,
        dodgeAnim: 0,
        motion: 0,
        deathTime: 0,
        face: side === 0 ? 1 : -1,
        dodgeLock: 0,
        dustTimer: 0,
      });
    };
    run.team.forEach((c, i) => add(c, 0, i, run.team));
    foes.forEach((c, i) => add(c, 1, i, foes));
    for (const [index,u] of this.units.entries()) {
      compileRelics(this,u);u.maxPoise+=u.curioStats.poise+(familyPassiveStats(u).poise||0);u.shield+=u.curioStats.shield;
      u.tuning=this.tuning;
      if(this.native){const position=nativeSpawn(BY_ID[u.id],u,u.side,u.side?index-run.team.length:index);u.x=u.px=position.x;u.y=u.py=position.y;u.nativeHome={...position};initializeNative(u,BY_ID[u.id],this.tuning);}else if(BY_ID[u.id].nativeRig)initializeNative(u,BY_ID[u.id],this.tuning);
      if (
        u.side === 1 &&
        ((this.chaos >= 9 && BY_ID[u.id].role === "Guardian") ||
          u.archetype === "bastion")
      )
        u.shield += 40;
      if (u.side === 1 && u.elite && run.difficulty === "veteran")
        u.shield += 35;
      if (u.side === 1 && u.elite && this.chaos >= 19) u.evade = 3;
      if (u.boss && u.id === "abyssal") u.shield += 100;
      if (this.weather === "void") u.shield *= 0.8;
    }
    updateAuras(this.units);
    this.say("The gates open. Scout, adapt, and let your companions fight.");
  }
  living(side) {
    return this.units.filter((u) => u.side === side && u.hp > 0);
  }
  say(text) {
    this.log.unshift({ time: Math.floor(this.time), text });
    this.log = this.log.slice(0, 60);
  }
  effect(x, y, text, color = "#eee") {
    this.effects.push({ type: "text", x, y, text, color, ttl: 1, max: 1 });
  }
  fx(type, x, y, color, extra = {}) {
    this.effects.push({ type, x, y, color, ttl: 0.45, max: 0.45, ...extra });
  }
  burst(x, y, color, count = 10, force = 75) {
    for (let i = 0; i < count; i++) {
      const a = this.random() * Math.PI * 2,
        v = force * (0.4 + this.random());
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * 0.65 - 10,
        ttl: 0.3 + this.random() * 0.4,
        max: 0.7,
        size: 1 + this.random() * 2.5,
        color,
      });
    }
  }
  target(u) {
    const enemies = this.living(1 - u.side),
      s = BY_ID[u.id],
      stance = u.side === 0 ? this.run.stance : "balanced";
    if (!enemies.length) return null;
    const taunters = enemies.filter((t) => t.taunt > 0 && distance(t, u) < 250);
    if (taunters.length)
      return taunters.sort((a, b) => distance(a, u) - distance(b, u))[0];
    const focus=u.side===0?enemies.find(e=>e.uid===this.focusUid&&this.time<this.focusUntil):null;
    if(focus&&distance(u,focus)<=Math.max(300,u.range*1.5))return focus;
    if((u.side===0&&this.run.stance==='weakest')||u.policy==='weakest')return enemies.sort((a,b)=>a.hp-b.hp||distance(a,u)-distance(b,u))[0];
    if(u.policy==='nearest')return enemies.sort((a,b)=>distance(a,u)-distance(b,u))[0];
    const tactical=tacticalTarget(this,u,enemies);if(tactical)return tactical;
    const rule=this.native?evaluateOrders(u,this.living(u.side),enemies):null;u.triggeredRule=rule;
    const policy = ({protect:"guardian",interrupt:"interrupt",breaker:"breaker",execute:"execute"}[rule?.response]) || u.policy || "adaptive";
    if(policy==="interrupt"){const channel=enemies.filter(e=>e.nativeAction&&!e.nativeAction.released&&!e.nativeAction.charged).sort((a,b)=>distance(a,u)-distance(b,u))[0];if(channel)return channel;}
    if (policy === "healer")
      return enemies.sort(
        (a, b) =>
          (BY_ID[a.id].role === "Support"
            ? -3
            : BY_ID[a.id].role === "Ranger"
              ? -1
              : 0) +
          distance(a, u) / 650 -
          ((BY_ID[b.id].role === "Support"
            ? -3
            : BY_ID[b.id].role === "Ranger"
              ? -1
              : 0) +
            distance(b, u) / 650),
      )[0];
    if (policy === "breaker")
      return enemies.sort(
        (a, b) =>
          (b.boss ? 200 : 0) + b.shield - ((a.boss ? 200 : 0) + a.shield),
      )[0];
    if (policy === "guardian") {
      const friend = this.living(u.side).sort(
        (a, b) => a.hp / a.maxHp - b.hp / b.maxHp,
      )[0];
      return enemies.sort(
        (a, b) => distance(a, friend) - distance(b, friend),
      )[0];
    }
    if (
      policy === "execute" ||
      (s.role === "Striker" && stance !== "guard") ||
      stance === "hunt"
    )
      return enemies.sort(
        (a, b) =>
          a.hp / a.maxHp +
          distance(a, u) / 600 -
          (b.hp / b.maxHp + distance(b, u) / 600),
      )[0];
    return enemies.sort((a, b) => distance(a, u) - distance(b, u))[0];
  }
  focusEnemy(uid){
    const enemy=this.living(1).find(u=>u.uid===uid);if(!enemy||this.done)return false;
    this.focusUid=uid;this.focusUntil=this.time+8;
    this.living(0).forEach(u=>u.targetTimer=0);
    if(!this.native)this.effect(enemy.x,enemy.y-55,'FOCUS · 8s','#f4cf7e');return true;
  }
  get enrage(){return enrageAt((this.run.rulesVersion||0)>=15?this.time:0);}
  setTuning(values){
    this.tuning=normalizeTuning(values);
    for(const u of this.units){
      u.tuning=this.tuning;
      if(!u.nativeActor)continue;
      const next=creatureWorldScale(BY_ID[u.id],u,this.tuning),old=u.nativeScale,ratio=next/old;
      u.nativeScale=next;u.radius*=ratio;if(BY_ID[u.id].range<=100)u.range*=ratio;
      u.mass*=Math.max(.65,next/.15)/Math.max(.65,old/.15);
      u.entityBounds=nativeEntityBounds(BY_ID[u.id],u,NATIVE_BOUNDS,this.tuning);
        u.nativeActor.rigScale=next;u.nativeActor.strideLength=this.tuning.strideLength;u.nativeActor.capeCloth=null;u.nativeActor.groundFeet=null;
      for(const strike of this.strikes)if(strike.source===u&&strike.nativeMelee)strike.reach*=ratio;
      confineBody(u,this.bounds);
    }
  }
  heal(target, amount, source, skillId = null, show = true, scale = 1) {
    if (!target || target.hp <= 0) return;
    const mod = skillId ? linkedSupport(source, skillId) : { healing: 1 };
    amount *= mod.healing * scale * (nativeEvolution(source).healing||1) * equipmentEffects(source).healing*wearerStats(source).healing*(source.curioStats?.healing||1)*(familyPassiveStats(source).healing||1)*(source.auraHealingPower||1)*(target.auraHealingReceived||1);
    if (source.side === 0 && this.run.relics.includes("seed")) amount *= 1+.35*itemStrength(source);
    const syn = source.side === 0 ? this.teamSyn : this.foeSyn;
    if (syn.grove >= 4) amount *= 1.3;
    if (this.weather === "pollen") amount *= 1.15;
    if (target.wither > 0) amount *= 0.45;
    const trait = CREATURE_TRAITS[source.id];
    if (trait === "medic" && target.hp / target.maxHp < 0.35) amount *= 1.45;
    if (source.side === 0) {
      if (this.run.relics.includes("blood-pact")) amount *= 0.75;
      if (this.run.relics.includes("spore-network")) amount *= 0.9;
      if (this.run.relics.includes("last-light")) amount *= 0.9;
    }
    amount *= this.enrage.healing;
    const real = Math.min(amount, target.maxHp - target.hp);
    const excess = Math.max(0, amount - real);
    source.excessHealing += excess;
    this.metrics.wastedHealing += excess;
    let overflow =
      (mod.overheal || 0) +
      (trait === "overflow" ? 0.35 : 0) +
      (source.evolutionPath === "warden" &&
      evolutionStage(source) &&
      BY_ID[source.id].role === "Support"
        ? 0.5
        : 0) +
      (source.side === 0 && this.run.relics.includes("overgrowth") ? .5*itemStrength(source) : 0);
    if (overflow)
      target.shield = Math.min(
        target.maxHp * 0.45,
        target.shield + excess * Math.min(0.85, overflow),
      );
    if (
      trait === "cleanser" ||
      (source.side === 1 &&
        this.chaos >= 13 &&
        BY_ID[source.id].role === "Support")
    ) {
      if (target.burn > 0 || target.poison > 0) {
        target.shield = Math.min(target.maxHp * 0.7, target.shield + 25);
        this.metrics.cleanses++;
      }
      target.burn = 0;
      target.poison = 0;
    }
    if (real > 0 && trait === "gardener" && ++source.healCount % 3 === 0)
      target.regeneration = 5;
    if (
      real > 0 &&
      evolutionStage(source) &&
      source.evolutionPath === "wild" &&
      BY_ID[source.id].role === "Support" &&
      skillId &&
      this.target(source)
    ) {
      const enemy = this.target(source);
      enemy.weakened = 3;
      this.projectile(source, enemy, source.loadout.auto, 0.45, 1, false);
    }
    target.hp += real;
    source.healed += real;
    relicEvent(this,source,"heal",{target,real,excess});
    this.metrics.healing += real;
    if (show && real >= 2) {
      if(this.native)queueCombatText(this,target,real,"heal");else this.effect(target.x, target.y - 44, `+${Math.round(real)}`, "#bada9b");
      this.fx("heal", target.x, target.y, "#badf92", {
        skillId,sourceId:source?.id,sourceUid:source?.uid,victimUid:target.uid,
        r: 36,
        ttl: 0.7,
        max: 0.7,
      });
    }
  }
  refresh(u, seconds) {
    const cd = u.cooldowns[u.id];
    if (cd) cd.remaining = Math.max(0, cd.remaining - seconds);
  }
  cleanse(u) {
    if (u.burn > 0 || u.poison > 0 || u.root > 0 || u.bleed > 0) {
      this.metrics.cleanses++;
      this.effect(u.x, u.y - 45, "CLEANSE", "#a9e7df");
    }
    u.burn = 0;
    u.poison = 0;
    u.root = 0;
    u.bleed = 0;
    u.slow = 0;
  }
  defeat(u, source, skillId) {
    if (u.hp > 0 || u.deathHandled || u.captured) return;
    if(relicFatal(this,u))return;
    if (
      u.side === 0 &&
      this.run.relics.includes("last-light") &&
      !this.revived
    ) {
      this.revived = true;
      u.hp = u.maxHp * .3*itemStrength(u);
      u.evade = 2*itemStrength(u);
      this.say(`${creatureName(u)} returns in the Last Light.`);
      this.fx("nova", u.x, u.y, "#ffe6ac", { r: 90, ttl: 1, max: 1 });
      return;
    }
    u.deathHandled = true;
    this.killLedger.push({time:this.time,sourceUid:source?.uid||null,targetUid:u.uid,skillId:skillId||null});
    relicEvent(this,u,"death");if(source)relicEvent(this,source,"kill",{target:u});
    u.deathTime = 0;
    u.deathFace = u.face;
    if (source) {
      source.kills++;
      const trait = CREATURE_TRAITS[source.id];
      if (trait === "assassin")
        this.refresh(source, source.cooldowns[source.id].total * 0.45);
      if (
        evolutionStage(source) &&
        source.evolutionPath === "wild" &&
        BY_ID[source.id].role === "Striker"
      ) {
        this.refresh(source, source.cooldowns[source.id].total * 0.55);
        this.heal(source, source.maxHp * 0.2, source, null);
      }
      if (source.side === 0 && this.run.relics.includes("execution-bell"))
        this.living(0).forEach((a) => this.refresh(a, .7*itemStrength(a)));
    }
    this.say(
      `${creatureName(u)} falls${skillId ? " to " + SKILLS[skillId]?.name : ""}.`,
    );
    this.effect(u.x, u.y - 55, "K.O.", "#edb997");
    this.fx("defeat", u.x, u.y, "#d6b7e2", { r: 65, ttl: 0.9, max: 0.9 });
    this.burst(u.x, u.y, "#d6b7e2", 20, 120);
    this.audioEvents.push({
      type: "death",
      element: BY_ID[u.id].element,
      time: this.time,
    });
  }
  damageUnit(
    target,
    amount,
    source,
    skillId,
    pierce = 0,
    kind = "hit",
    intercept = true,
    critical = false,
  ) {
    if (!target || target.hp <= 0) return 0;
    if(!['cost','reflection'].includes(kind))amount*=target.auraDamageTaken||1;
    // Interception and relic reflection already derive from an amplified hit.
    if(!['cost','intercept','reflection'].includes(kind))amount*=this.enrage.damage;
    if (intercept && kind === "hit") {
      const guard = this.living(target.side).find(
        (g) =>
          g !== target &&
          g.hp > g.maxHp * 0.35 &&
          ((CREATURE_TRAITS[g.id] === "intercept" &&
            distance(g, target) < 130) ||
            (evolutionStage(g) &&
              g.evolutionPath === "warden" &&
              BY_ID[g.id].role === "Guardian" &&
              distance(g, target) < 140) ||
            (g.guardTimer > 0 &&
              g.guardUid === target.uid &&
              distance(g, target) < 200)),
      );
      if (guard) {
        const share =
          amount *
          (guard.guardTimer > 0
            ? 0.3
            : CREATURE_TRAITS[guard.id] === "intercept"
              ? 0.22
              : 0.25);
        amount -= share;
        this.damageUnit(guard, share, source, skillId, 0, "intercept", false);
        this.metrics.intercepts++;
        this.fx("beam", guard.x, guard.y, "#a9d9be", {
          tx: target.x,
          ty: target.y,
          width: 2,
          ttl: 0.25,
          max: 0.25,
        });
      }
    }
    let prevented=0;
    if(kind!=="cost"){const before=amount;amount*=relicReduction(this,target,source);prevented+=Math.max(0,before-amount);}
    if((this.run.rulesVersion||0)>=15&&!['status','cost','reflection'].includes(kind)){const reduction=armorReduction((target.armor||0)+(target.armorBuffTime>0?target.armorBuff||0:0),target.role),armor=Math.max(0,amount*reduction),amplified=Math.max(0,-amount*reduction);amount*=1-reduction;prevented+=armor;this.metrics.armorPrevented=(this.metrics.armorPrevented||0)+armor;this.metrics.armorAmplified=(this.metrics.armorAmplified||0)+amplified;}
    const blocked = Math.min(
      target.shield,
      amount * (1 - Math.min(0.95, pierce)),
    );
    target.shield -= blocked;
    target.shieldAbsorbed += blocked;
    target.damageMitigated=(target.damageMitigated||0)+prevented+blocked;
    this.metrics.shieldDamage += blocked;
    const old = target.hp;
    target.hp = Math.max(0, target.hp - (amount - blocked));
    if (
      this.capturePlan?.uid === target.uid &&
      !this.captureSettled &&
      (this.run.rulesVersion||0)<15 &&
      !target.boss
    )
      target.hp = Math.max(target.maxHp*(progressive(this.run)?Math.min(.05,(this.capturePlan.threshold||.35)/2):.18), target.hp);
    const dealt = Math.max(0, old - target.hp);
    if(dealt>.5){target.lastHpBeforeHit=old;target.lastHitTime=this.time;}
    target.damageTaken += dealt;
    if(dealt>0&&!["reflection","cost","status","hazard","gear","curio"].includes(kind))relicEvent(this,target,"hurt",{source,target:source,dealt,kind,critical});
    if(this.native){if(dealt>0)queueCombatText(this,target,dealt,kind==="status"?"status":critical?"crit":"hit",source);if(blocked>=1)queueCombatText(this,target,blocked,"shield");}
    if (kind === "status") {
      target.statusTaken += dealt;
      this.metrics.statusDamage += dealt;
    }
    if (kind === "hazard") {
      target.hazardTaken += dealt;
      this.metrics.hazardDamage += dealt;
    }
    if (source&&kind!=="cost") {
      source.damage += dealt;
      this.metrics.damage += dealt;
      this.damageBySkill[skillId] = (this.damageBySkill[skillId] || 0) + dealt;
    }
    if (
      target.side === 0 &&
      this.run.relics.includes("mercy") &&
      !target.mercyUsed &&
      target.hp > 0 &&
      target.hp / target.maxHp < 0.3
    ) {
      target.mercyUsed = true;
      this.heal(target, target.maxHp * .2*itemStrength(target), target);
    }
    this.defeat(target, source, skillId);
    return dealt;
  }
  dodgeProc(u, source) {
    const trait = CREATURE_TRAITS[u.id];
    if (
      trait === "counter" ||
      (evolutionStage(u) &&
        u.evolutionPath === "warden" &&
        BY_ID[u.id].role === "Striker")
    ) {
      this.refresh(u, 1);
      this.projectile(
        u,
        source,
        u.loadout.auto,
        trait === "counter" ? 0.6 : 0.75,
        1,
        false,
      );
      this.metrics.traitProcs++;
    }
    if (u.side === 0 && this.run.relics.includes("storm-relay"))
      this.living(0)
        .filter((a) => distance(a, u) < 200)
        .forEach((a) => this.refresh(a, .7*itemStrength(a)));
  }
  hit(target, amount, source, skillId, scale = 1, proc = true, kind = "hit") {
    if (!target || target.hp <= 0) return 0;
    const def = skillDefinition(source,skillId),
      m = linkedSupport(source, skillId),
      syn = target.side === 0 ? this.teamSyn : this.foeSyn;
    const trait = CREATURE_TRAITS[source.id],
      targetTrait = CREATURE_TRAITS[target.id];
    amount *=
      m.damage *
      scale *
      (source.rage > 0 ? 1.18 : 1) *
      (source.weakened > 0 ? 0.75 : 1);
    if (source.side === 1 && def.auto && this.chaos >= 2) amount *= 1.08;
    if (source.side === 0) {
      if (def.auto && this.run.relics.includes("fangs")) amount *= 1+.18*itemStrength(source);
      if (this.run.relics.includes("blood-pact")) amount *= 1+.22*itemStrength(source);
      if (
        this.run.relics.includes("glass-cannon") &&
        BY_ID[source.id].role === "Ranger" &&
        distance(source, target) > 230
      )
        amount *= 1+.3*itemStrength(source);
      if (this.capturePlan && !this.captureSettled)
        amount *= this.capturePlan.mode === "mercy" ? 0.86 : 0.94;
    }
    if (syn.tide >= 4) amount *= 0.85;
    if (target.fortify > 0) amount *= 0.88;
    if (target.exposed > 0) amount *= 1.18;
    if (targetTrait === "mirror" && target.shield > 0) amount *= 0.85;
    if (
      target.side === 0 &&
      this.run.relics.includes("sanctuary") &&
      this.living(0).some(
        (a) => BY_ID[a.id].role === "Support" && distance(a, target) < 120,
      )
    )
      amount *= 1-.12*itemStrength(target);
    if (
      target.boss &&
      this.chaos >= 20 &&
      this.living(target.side).some((a) => a !== target)
    )
      amount *= 0.82;
    if (trait === "pursuit" && target.burn > 0) amount *= 1.3;
    if (trait === "ram" && target.root > 0) amount *= 1.3;
    if (trait === "assassin" && BY_ID[target.id].role === "Support")
      amount *= 1.3;
    if (trait === "marksman" && distance(source, target) > 230) amount *= 1.22;
    if (
      trait === "duelist" &&
      !this.living(target.side).some(
        (a) => a !== target && distance(a, target) < 140,
      )
    )
      amount *= 1.28;
    if (m.execute && target.hp / target.maxHp < 0.3) amount *= 1 + m.execute;
    if (
      this.weather === "rain" &&
      BY_ID[source.id].element === "storm" &&
      target.slow > 0
    )
      amount *= 1.2;
    amount*=relicDamageFactor(this,source,target,def);
    const crit = this.random() < Math.max(0,0.045 + m.crit+(source.curioStats?.crit||0)+(source.auraCrit||0)+(familyPassiveStats(source).crit||0));
    if (crit) {
      amount *= 1.65;
      this.metrics.crits++;
    }
    const wasShielded = target.shield > 0,
      wasPoisoned = target.poison > 0,
      wasBurning = target.burn > 0;
    const stealShield = (m.siphon || 0) + (trait === "siphon" ? 12 : 0);
    if (stealShield) {
      const stolen = Math.min(target.shield, stealShield);
      target.shield -= stolen;
      source.shield = Math.min(source.maxHp * 0.7, source.shield + stolen);
    }
    if (m.shred) target.shield = Math.max(0, target.shield - m.shred);
    const dealt = this.damageUnit(
      target,
      amount,
      source,
      skillId,
      Math.max(m.pierce, trait === "piercer" ? 0.35 : 0, nativeEvolution(source).pierce||0, def.shieldPierce||0),
      kind, true, crit,
    );
    if(proc)relicEvent(this,source,"hit",{target,dealt,def,skillId,kind,critical:crit});
    target.flash = dealt>0?0.1:0;
    if(this.native&&dealt<=0)queueCombatCue(this,target,"block");
    target.hitAnim = 0.22;
    if (kind === "physical" || kind === "projectile") {
      this.metrics.physicalHits++;
      this.applyImpact(
        target,
        source,
        amount,
        !def.auto || def.kind === "cleave",
      );
    }
    const color = def.color || ELEMENTS[BY_ID[source.id].element].color;
    if(!this.native)this.effect(
      target.x + (this.random() - 0.5) * 16,
      target.y - 45,
      dealt > 0 ? `${crit ? "✦ " : ""}${Math.round(dealt)}` : "BLOCK",
      crit ? "#fff0b3" : target.side === 0 ? "#eeb6a7" : "#f3e5c7",
    );
    this.burst(target.x, target.y - 10, color, crit ? 11 : 4, crit ? 110 : 60);
    this.fx("impact", target.x, target.y - 8, color, { skillId,sourceId:source.id,sourceUid:source.uid,r: crit ? 35 : 23, victimUid:target.uid, angle:Math.atan2(target.y-source.y,target.x-source.x), groundRadius:target.radius, heavy:!def.auto, blocked:dealt<=0, ttl:crit?.32:.26, max:crit?.32:.26 });
    if(dealt>0&&this.run.rulesVersion>=17&&this.visuals&&!this.reducedMotion)this.hitPause=Math.max(this.hitPause||0,crit?.045:!def.auto?.03:0);
    if (dealt>0&&(crit || !def.auto)) this.shake = Math.min(4, this.shake + 1.1);
    this.audioEvents.push({
      type: dealt<=0 ? "block" : crit ? "crit" : def.auto ? "hit" : "skill",
      element: BY_ID[source.id].element,
      time: this.time,
    });
    const ownSyn = source.side === 0 ? this.teamSyn : this.foeSyn;
    let steal =
      (ownSyn.void >= 2 ? 0.12 : 0) + (def.lifesteal || 0) + m.lifesteal;
    if (
      def.auto &&
      source.side === 0 &&
      this.run.relics.includes("fangs") &&
      BY_ID[source.id].role === "Striker"
    )
      steal += 0.08*itemStrength(source);
    if (steal) this.heal(source, dealt * steal, source, null, false);
    if (proc && target.hp > 0) {
      const burn = Math.max(
        def.burn || 0,
        m.burn || 0,
        ownSyn.ember >= 2 && BY_ID[source.id].element === "ember" ? 2 : 0,
      );
      if (burn) {
        target.burn = Math.max(
          target.burn,
          burn * (this.weather === "rain" ? 0.5 : 1),
        );
        target.burnSource = source;
        target.burnSkill = skillId;
      }
      if (def.poison || m.poison || source.archetype === "venom") {
        target.poison = Math.max(
          target.poison,
          (def.poison || m.poison || 2) + (nativeEvolution(source).poison||0) +
            (this.weather === "pollen" ? 1 : 0) +
            (source.side === 1 && this.chaos >= 4 ? 1 : 0),
        );
        target.poisonSource = source;
        target.poisonSkill = skillId;
      }
      if(!target.nativeAction?.charged)target.root = Math.max(target.root, def.root || 0, m.root || 0, nativeEvolution(source).root||0);
      target.slow = Math.max(target.slow, def.slow || 0, m.chill || 0);
      target.exposed = Math.max(
        target.exposed,
        m.expose || 0,
        trait === "pin" && !def.auto ? 5 : trait === "pack" && def.auto ? 2 : 0,
      );
      target.wither = Math.max(target.wither, m.wither || 0);
      target.weakened = Math.max(
        target.weakened,
        m.weaken || 0,
        source.archetype === "wardens" ? 2 : 0,
      );
      if (trait === "pursuit" && !def.auto && target.burn > 0)
        target.burn = Math.min(12, target.burn + 2);
      if (trait === "poisoner" && wasPoisoned) {
        target.poison = Math.min(12, target.poison + 1);
        this.damageUnit(target, 10, source, skillId, 0, "status");
      }
      const push =
        (def.knockback || 0) +
        (m.knockback || 0) +
        (trait === "ram" && !def.auto ? 55 : 0);
      if (push) {
        const d = distance(target, source) || 1;
        target.impulseX +=
          (((target.x - source.x) / d) * push * 7) / target.mass;
        target.impulseY +=
          (((target.y - source.y) / d) * push * 7) / target.mass;
      }
      if (trait === "implosion" && !def.auto)
        this.living(target.side)
          .filter((a) => a !== target && distance(a, target) < 150)
          .forEach((a) => {
            a.impulseX += ((target.x - a.x) * 1.8) / a.mass;
            a.impulseY += ((target.y - a.y) * 1.8) / a.mass;
            a.slow = 2;
          });
      if (
        (trait === "parasite" && wasPoisoned) ||
        (source.side === 0 &&
          this.run.relics.includes("spore-network") &&
          wasPoisoned)
      )
        this.heal(
          this.living(source.side).sort(
            (a, b) => a.hp / a.maxHp - b.hp / b.maxHp,
          )[0],
          dealt * (trait==='parasite'?.18:.15*itemStrength(source)),
          source,
          null,
          false,
        );
      if (trait === "battery" && def.auto && ++source.autoHits % 4 === 0)
        this.living(source.side)
          .filter((a) => a !== source && distance(a, source) < 200)
          .forEach((a) => this.refresh(a, 1));
      if (trait === "pack" && def.auto)
        this.living(source.side)
          .filter(
            (a) => BY_ID[a.id].role === "Striker" && distance(a, source) < 160,
          )
          .forEach((a) => (a.haste = 1.2));
      if (
        evolutionStage(source) &&
        source.evolutionPath === "wild" &&
        BY_ID[source.id].role === "Guardian" &&
        source.shield > 0
      )
        target.exposed = 3;
      if (
        evolutionStage(source) &&
        source.evolutionPath === "warden" &&
        BY_ID[source.id].role === "Ranger" &&
        def.auto &&
        target.root > 0
      )
        target.exposed = 4;
    }
    if (proc) {
      const reflected =
        (wasShielded && targetTrait === "retaliation" ? 0.18 : 0) +
        (wasShielded && targetTrait === "mirror" ? 0.12 : 0) +
        (target.retaliation > 0 ? 0.3 : 0) +
        (wasShielded &&
        target.side === 0 &&
        this.run.relics.includes("thorn-crown") &&
        BY_ID[target.id].role === "Guardian"
          ? .22*itemStrength(target)
          : 0);
      if (reflected)
        this.damageUnit(
          source,
          amount * Math.min(0.45, reflected),
          target,
          target.loadout.auto,
          0,
          "reflect",
          false,
        );
      if (m.fork)
        this.living(target.side)
          .filter((e) => e !== target)
          .sort((a, b) => distance(a, target) - distance(b, target))
          .slice(0, m.fork)
          .forEach((e) =>
            this.projectile(
              source,
              e,
              skillId,
              (def.power || 1) * 0.4,
              scale,
              false,
            ),
          );
      if (trait === "conductor" && (target.root > 0 || target.slow > 0)) {
        const other = this.living(target.side).find((e) => e !== target);
        if (other) {
          this.hit(other, source.atk * 0.35, source, skillId, 1, false);
          this.fx("lightning", target.x, target.y, color, {
            tx: other.x,
            ty: other.y,
            ttl: 0.3,
            max: 0.3,
          });
        }
      }
      let explosion = m.explosion;
      if (m.steam && wasBurning) {
        explosion += m.steam;
        target.burn = 0;
        this.effect(target.x, target.y - 58, "STEAM", "#a2e7ef");
      }
      if (
        source.side === 0 &&
        this.run.relics.includes("frostfire") &&
        wasBurning &&
        target.slow > 0
      ) {
        explosion += .5*itemStrength(source);
        target.burn = 0;
      }
      if (m.detonate && wasPoisoned) {
        explosion += m.detonate;
        target.poison = 0;
      }
      if (
        trait === "furnace" &&
        !def.auto &&
        ++source.traitHits % 3 === 0 &&
        wasBurning
      ) {
        explosion += 0.9;
        target.burn = 0;
      }
      if (explosion)
        this.hazards.push({
          x: target.x,
          y: target.y,
          r: 65,
          ttl: 0.25,
          total: 0.25,
          source,
          skillId,
          power: explosion,
          scale,
          proc: false,
          color,
        });
    }
    if (
      ownSyn.void >= 4 &&
      target.hp > 0 &&
      target.hp < target.maxHp * 0.15 &&
      !target.boss &&
      this.capturePlan?.uid !== target.uid
    ) {
      this.damageUnit(target, target.hp, source, skillId, 1);
    }
    return dealt;
  }
  supportedUse(u, id, echo) {
    if (echo) return;
    const m = linkedSupport(u, id),
      def = skillDefinition(u,id);
    if (m.blood) u.hp = Math.max(1, u.hp - u.hp * m.blood);
    const friends = this.living(u.side).sort(
        (a, b) => a.hp / a.maxHp - b.hp / b.maxHp,
      ),
      weakest = friends[0];
    if (m.cleanse && weakest) this.cleanse(weakest);
    if (m.regen && weakest) weakest.regeneration = def.auto ? 1 : m.regen;
    if (m.guard && weakest && weakest !== u) {
      u.guardTimer = m.guard;
      u.guardUid = weakest.uid;
    }
    if (m.beacon && !def.auto)
      this.fields.push({ x: u.x, y: u.y, r: 130, ttl: m.beacon, source: u });
    if (m.relay && !def.auto)
      friends
        .filter((a) => a !== u && distance(a, u) < 200)
        .forEach((a) => this.refresh(a, m.relay));
    if (m.trap && !def.auto) {
      const victim = this.target(u);
      if (victim) {
        this.zone(u, victim, id, m.trap, 85, 1.1);
        this.hazards.at(-1).root = 2;
      }
    }
    if (m.shield) {
      let amount = def.auto ? 10 : m.shield;
      if (this.weather === "void") amount *= 0.8;
      if (u.side === 0 && this.run.relics.includes("storm-relay"))
        amount *= 0.85;
      u.shield = Math.min(u.maxHp * 0.7, u.shield + amount);
    }
    if (m.bloom)
      this.living(u.side)
        .filter((f) => distance(f, u) < 180)
        .forEach((f) => this.heal(f, def.auto ? 5 : m.bloom, u, id));
    if (m.evade) u.evade = Math.max(u.evade, def.auto ? 0.35 : m.evade);
    if (m.movement > 1) u.movementBuff = def.auto ? 0.5 : 2;
    if (m.fortify) u.fortify = m.fortify;
    const stage = evolutionStage(u),
      role = BY_ID[u.id].role;
    if (!def.auto && id === u.id && stage) {
      if (u.evolutionPath === "wild" && role === "Guardian") u.retaliation = 5;
      if (u.evolutionPath === "warden" && role === "Guardian")
        friends
          .filter((a) => distance(a, u) < 180)
          .forEach((a) => this.cleanse(a));
      if (u.evolutionPath === "warden" && role === "Support")
        friends
          .filter((a) => distance(a, u) < 210)
          .forEach((a) => (a.regeneration = 4));
      if (u.evolutionPath === "warden" && role === "Striker") u.evade = 2.5;
      if (u.evolutionPath === "wild" && role === "Ranger") {
        const victim =
          this.living(1 - u.side).find((a) => a !== this.target(u)) ||
          this.target(u);
        if (victim) this.projectile(u, victim, id, 0.65);
      }
      if (u.evolutionPath === "warden" && role === "Ranger") {
        const victim = this.target(u);
        if (victim) {
          this.zone(u, victim, id, 0.5, 85, 1);
          this.hazards.at(-1).root = 2;
        }
      }
    }
    if (
      !def.auto &&
      id === u.id &&
      u.side === 0 &&
      this.run.relics.includes("echo-chamber") &&
      ++this.signatureCount % 4 === 0
    ) {
      this.queue.push({
        ttl: 0.5,
        source: u,
        target: this.target(u),
        skillId: id,
        scale: .45*itemStrength(u),
        echo: true,
      });
      this.metrics.echoes++;
    }
    if (m.echo) {
      this.queue.push({
        ttl: 0.4,
        source: u,
        target: this.target(u),
        skillId: id,
        scale: m.echo,
        echo: true,
      });
      this.metrics.echoes++;
    }
  }
  // Attacks commit to a direction; a moved target is never hit by identity alone.
  beginStrike(u, target, id, scale = 1, options = {}) {
    if (!target) return null;
    const def = skillDefinition(u,id),
      m = linkedSupport(u, id),
      dx = target.x - u.x,
      dy = target.y - u.y,
      length = Math.hypot(dx, dy) || 1;
    const heavy =
      def.kind === "cleave" || def.kind === "charge" || u.mass > 1.8 || ((this.run.rulesVersion||0)>=15&&nativeHeavy(u));
    const nativeMelee=this.native&&u.nativeActor&&!options.beam;
    if(nativeMelee&&def.auto)u.meleeCount++;
    const chargeCost=nativeEvolution(u).chargeCost||28;
    const charged=nativeMelee&&def.auto&&u.meleeCount%3===0&&u.stamina>=chargeCost-8&&!(u.aiEffects?.captureCare&&this.capturePlan?.uid===target.uid&&!this.captureSettled);
    if(charged){u.stamina-=chargeCost-8;this.metrics.chargedStrikes++;}
    const timing=(this.run.rulesVersion||0)>=17?1.12:1;
    const windup = (charged ? 0.95 : options.windup ?? (def.auto ? (heavy ? 0.3 : 0.22) : 0.36))*timing;
    const strike = {
      key: ++this.attackSerial,
      source: u,
      target,
      skillId: id,
      dx: dx / length,
      dy: dy / length,
      reach: options.reach ?? Math.max(this.native?((this.run.rulesVersion||0)>=15?6:24):48, u.range),
      arc: options.arc ?? (def.kind === "cleave" ? 1.02 : 0.48),
      beam: !!options.beam,
      width: options.width || 12,
      remaining: windup,
      total: windup,
      recovery: (heavy ? 0.24 : 0.18)*timing,
      scale,
      power: options.power ?? (def.power || 1),
      maxTargets:
        options.maxTargets ??
        (def.auto ? 1 + (def.radius ? 1 : 0) + m.targets : 1 + m.targets),
      heavy,
      nativeMelee, charged, style:nativeHeavy(u)&&u.meleeCount%2===0?'side':'overhead',hitUids:[],
      targetRoll: target.rollCount,
      cancelled: false,
    };
    this.strikes.push(strike);
    u.actionId = strike.key;
    u.actionLock = windup + strike.recovery;
    u.attackDuration = windup + strike.recovery;
    u.attackAnim = u.attackDuration;
    u.face = strike.dx >= 0 ? 1 : -1;
    if(nativeMelee){if(charged)strike.power*=nativeEvolution(u).chargeDamage||1.7;nativeAction(u,Math.atan2(strike.dy,strike.dx),windup,strike.recovery,{style:strike.style,charged,heavy});}
    return strike;
  }
  nativeContact(strike,from,to){
    if(!strike.nativeMelee||strike.cancelled||strike.source.hp<=0||to<.72||from>=1)return;
    const u=strike.source,begin=Math.max(.72,from),endPhase=Math.min(1,to);
    for(let i=0;i<4;i++){
      const start=nativeBladePoint(u,strike,begin+(endPhase-begin)*i/4),end=nativeBladePoint(u,strike,begin+(endPhase-begin)*(i+1)/4);
      for(const victim of this.living(1-u.side)){
        if(strike.hitUids.length>=strike.maxTargets)return;
        if(strike.hitUids.includes(victim.uid)||distance(u,victim)>strike.reach+victim.radius+15)continue;
        const contact=sweepCircle(start,end,victim,victim.radius+Math.max(2,5*(u.nativeScale||1))),block=firstTerrainHit(start,end,this.terrain);
        if(contact===null||(block&&block.t<=contact))continue;
        strike.hitUids.push(victim.uid);this.metrics.bladeContacts++;
        this.hit(victim,u.atk*strike.power,u,strike.skillId,strike.scale*(strike.hitUids.length>1?.65:1),true,'physical');
        if(strike.heavy&&victim.hp>0){victim.bleed=Math.max(victim.bleed,3);victim.bleedSource=u;victim.bleedSkill=strike.skillId;}
      }
    }
  }
  registerEvade(unit, source, key) {
    if (!unit || unit.hp <= 0 || unit.lastEvadeKey === key) return;
    unit.lastEvadeKey = key;
    this.metrics.dodges++;
    if(this.native)queueCombatCue(this,unit,"dodge");else this.effect(unit.x, unit.y - 43, "EVADED", "#b5dadd");
    this.dodgeProc(unit, source);
  }
  resolveStrike(strike) {
    const u = strike.source;
    if (strike.cancelled || u.hp <= 0) return;
    const color =
      SKILLS[strike.skillId].color || ELEMENTS[BY_ID[u.id].element].color;
    const naturalEffect=strike.nativeMelee&&u.nativeAttackEffect;
    const naturalTip=naturalEffect?nativeStrikeOrigin(u,strike,1):strike.beam&&this.native?nativeMuzzle(u,{x:u.x+strike.dx*strike.reach,y:u.y+strike.dy*strike.reach}):null;
    this.fx(strike.beam ? "beam" : naturalEffect||"slash", naturalTip?.x??u.x, strike.beam&&this.native?naturalTip.y+14:naturalTip?.y??u.y-12, color, {
      skillId:strike.skillId,sourceId:u.id,sourceUid:u.uid,targetZ:this.native?nativeBodyHeight(strike.target||u):45,
      originZ:naturalTip?.z,
      tx: u.x + strike.dx * strike.reach,
      ty: u.y + strike.dy * strike.reach - (strike.beam&&this.native?0:12),
      angle: Math.atan2(strike.dy, strike.dx),
      face: u.face,
      r: strike.beam ? 30 : strike.reach,
      width: strike.width,
      ttl: 0.22,
      max: 0.22,
    });
    if(strike.nativeMelee){
      if(!strike.hitUids.length){this.metrics.whiffs++;queueCombatCue(this,u,'miss');if(strike.target?.rollCount>strike.targetRoll)this.registerEvade(strike.target,u,strike.key);}
      u.actionId=null;return;
    }
    const targets = this.living(1 - u.side)
      .filter((e) => strikeContains(strike, e)&&(!this.native||!firstTerrainHit(u,e,this.terrain)))
      .sort((a, b) => distance(a, u) - distance(b, u))
      .slice(0, strike.maxTargets);
    for (let i = 0; i < targets.length; i++) {
      const victim = targets[i];
      this.hit(
        victim,
        u.atk * strike.power,
        u,
        strike.skillId,
        strike.scale * (i ? 0.65 : 1),
        true,
        "physical",
      );
      if (strike.heavy && !strike.beam && victim.hp > 0) {
        victim.bleed = Math.max(victim.bleed, 3);
        victim.bleedSource = u;
        victim.bleedSkill = strike.skillId;
      }
    }
    if (!targets.length) {
      this.metrics.whiffs++;
      this.effect(
        u.x + strike.dx * strike.reach,
        u.y + strike.dy * strike.reach - 20,
        "MISS",
        "#b9b1a0",
      );
      if (strike.target?.rollCount > strike.targetRoll)
        this.registerEvade(strike.target, u, strike.key);
    }
    u.actionId = null;
  }
  applyImpact(target, source, strength, heavy) {
    if (target.hp <= 0) return;
    if(target.nativeAction?.charged){this.metrics.armorResists++;target.poise=0;target.hitAnim=0;return;}
    const dx = target.x - source.x,
      dy = target.y - source.y,
      d = Math.hypot(dx, dy) || 1;
    const braced =
      BY_ID[target.id].role === "Guardian" &&
      (target.policy === "guardian" || target.fortify > 0);
    const force =
      (Math.min(175, 35 + strength * 1.1) * (braced ? 0.55 : 1) * this.tuning.knockback/100) /
      (target.mass || 1);
    target.impulseX += (dx / d || source.face) * force;
    target.impulseY += (dy / d) * force;
    this.metrics.knockbacks++;
    target.poise +=
      Math.min(45, strength * 0.38 + (heavy ? 16 : 5)) * (braced ? 0.55 : 1);
    if (target.poise >= target.maxPoise) {
      target.poise = 0;
      target.stagger = target.boss ? 0.2 : 0.52;
      if(this.native&&target.nativeActor&&!target.boss&&heavy&&strength>=50){target.nativeKnockdown=.65;target.nativeGetup=0;this.metrics.knockdowns=(this.metrics.knockdowns||0)+1;}
      target.rollTime = 0;
      target.dashMotion = null;
      for (const attack of this.strikes)
        if (attack.source === target && attack.remaining > 0)
          attack.cancelled = true;
      if (target.actionId !== null) this.cancelledAttacks.add(target.actionId);
      if(this.queue.some(q=>q.nativeCast&&q.source===target&&q.ttl>0))this.metrics.interruptedSkills++;
      target.nativeAction=null;
      target.actionId = null;
      target.actionLock = target.stagger;
      this.metrics.staggers++;
      if(this.native)queueCombatCue(this,target,"stagger");else this.effect(target.x, target.y - 55, "STAGGER", "#ffd99c");
      this.say(
        `${creatureName(target)} loses its footing. The windup is interrupted.`,
      );
    }
  }
  threatFor(u) {
    for (const strike of this.strikes) {
      if (
        strike.source.side === u.side ||
        strike.cancelled ||
        strike.source.hp <= 0 ||
        strike.remaining < 0.025 ||
        strike.remaining > 0.65
      )
        continue;
      if (strikeContains({ ...strike, reach: strike.reach + ((this.run.rulesVersion||0)>=15?Math.max(2,18*(strike.source.nativeScale||1)):18) }, u))
        return {
          key: `strike-${strike.key}`,
          source: strike.source,
          strike,
          deadline: strike.remaining,
        };
    }
    for (const p of this.projectiles) {
      if (p.source.side === u.side || p.dead) continue;
      const end = { x: p.x + p.vx * 0.35, y: p.y + p.vy * 0.35 };
      if (
        movingBodyHit(
          { x: p.x, y: p.y },
          end,
          { ...u, px: u.x, py: u.y },
          p.radius + 7,
        ) !== null
      )
        return {
          key: `shot-${p.key}`,
          source: p.source,
          projectile: p,
          deadline: Math.hypot(u.x - p.x, u.y - 14 - p.y) / p.speed,
        };
    }
    for (const h of this.hazards) {
      if (
        (h.environment || h.source.side !== u.side) &&
        distance(h, u) < h.r + u.radius &&
        h.ttl > 0.04
      )
        return {
          key: `zone-${h.key}`,
          source: h.source,
          hazard: h,
          deadline: h.ttl,
        };
    }
    return null;
  }
  evadeDirection(u, threat) {
    let best = null;
    const rollDistance = 75 * (u.mass > 1.8 ? 0.75 : 1);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        dx = Math.cos(a),
        dy = Math.sin(a),
        point = {
          ...u,
          x: u.x + dx * rollDistance,
          y: u.y + dy * rollDistance,
        };
      let score = 0;
      if (point.x < 80 || point.x > 920 || point.y < (this.native?130:115) || point.y > (this.native?780:435))
        score -= 600;
      for (const other of this.living(u.side))
        if (other !== u)
          score -= Math.max(0, 55 - distance(point, other)) * 1.6;
      for (const h of this.hazards)
        if (h.environment || h.source.side !== u.side)
          score -= Math.max(0, h.r + 25 - distance(point, h)) * 3;
      if(this.native&&firstTerrainHit(u,point,this.terrain,u.radius))score-=700;
      if (threat.strike)
        score += strikeContains(threat.strike, point) ? -150 : 100;
      if (threat.projectile) {
        const p = threat.projectile,
          side =
            Math.abs((point.x - p.x) * p.vy - (point.y - 14 - p.y) * p.vx) /
            p.speed;
        score += Math.min(90, side) * 2;
      }
      if (threat.hazard) score += distance(point, threat.hazard) * 2;
      if (!best || score > best.score) best = { x: dx, y: dy, score };
    }
    return best;
  }
  reactToThreat(u, dt) {
    const threat = this.threatFor(u);
    if (!threat) {
      u.threatKey = null;
      u.reactionTime = 0;
      return;
    }
    if (u.threatKey !== threat.key) {
      u.threatKey = threat.key;
      u.reactionTime = Math.max(
        0.065,
        0.16 - (u.aiEffects?.anticipate?.045:0)-
          u.dodge * 0.26 -
          (RARITY[BY_ID[u.id].rarity].cost >= 180 ? 0.025 : 0),
      );
    }
    u.reactionTime -= dt;
    if (
      u.reactionTime > 0 ||
      u.dodgeCooldown > 0 ||
      u.stamina < (u.aiEffects?.reserveStamina?24:30) ||
      u.root > 0 ||
      u.stagger > 0 || u.nativeKnockdown>0 || u.nativeGetup>0 ||
      u.actionLock > 0 ||
      u.rollTime > 0
    )
      return;
    const direction = this.evadeDirection(u, threat);
    u.rollX = direction.x;
    u.rollY = direction.y;
    u.rollTime = 0.25;
    u.dodgeAnim = 0.32;
    u.dodgeLock = 0.28;
    u.dodgeCooldown = (this.run.rulesVersion||0)>=17?Math.max(.45,(3.1-u.dodge*4-(u.evade>0?1:0))*u.dashCooldown):Math.max(1.5,3.1-u.dodge*4-(u.evade>0?1:0));
    u.stamina -= 30;
    if(u.dodgeStyle==='blink'){
      const from={x:u.x,y:u.y},length=65;
      const to={x:u.x+direction.x*length,y:u.y+direction.y*length};
      if(!this.native||!firstTerrainHit(u,to,this.terrain,u.radius)){u.x=to.x;u.y=to.y;confineBody(u,this.bounds);}
      u.rollTime=0;u.velocityX=u.velocityY=0;
      this.fx('blink',from.x,from.y,'#cdb0ff',{r:40,ttl:.45,max:.45});
      this.fx('blink',u.x,u.y,'#cdb0ff',{r:40,ttl:.45,max:.45});
    }else if(u.dodgeStyle==='barrel'){
      u.barrelHits=new Set();u.shield+=u.maxHp*.025;
    }
    u.rollCount++;
    relicEvent(this,u,"dodge");
    this.metrics.rolls++;
    this.fx("afterimage", u.x, u.y, "#cfdfd4", { r: 30, ttl: 0.4, max: 0.4 });
  }

  projectile(u, t, id, power, scale = 1, proc = true, aim = null) {
    if (!t) return;
    const def = skillDefinition(u,id),
      color = def.color || ELEMENTS[BY_ID[u.id].element].color;
    const speed = def.auto ? 410 : 535,
      mark = aim || t,
      flight = Math.min(0.22, distance(u, mark) / speed);
    const tx = mark.x + (mark.velocityX || 0) * flight,
      ty = mark.y - 14 + (mark.velocityY || 0) * flight;
    const muzzle=this.native?nativeMuzzle(u,mark):{x:u.x,y:u.y-15,z:45};
    const dx = tx - (this.native?muzzle.x:u.x),
      dy = ty - (this.native?muzzle.y:u.y-14),
      length = Math.hypot(dx, dy) || 1;
    this.projectiles.push({
      key: ++this.attackSerial,
      vx: (dx / length) * speed,
      vy: (dy / length) * speed,
      age: 0,
      ttl: 3.4,
      radius: def.auto ? 4 : 7,
      targetRoll: t.rollCount,
      passTime: length / speed + 0.3,
      x: muzzle.x,
      y: muzzle.y,
      prevX: muzzle.x,
      prevY: muzzle.y,
      originZ:muzzle.z,
      targetZ:this.native?nativeBodyHeight(t):45,
      flightTime:length/speed,
      nativeArrow:this.native&&["elf","fox"].includes(u.nativeActor?.id),
      target: t,
      source: u,
      skillId: id,
      power,
      scale,
      proc,
      color,
      speed,
      skill: !def.auto,
      trail: [],
    });
  }
  zone(u, t, id, power, radius, delay, scale = 1) {
    const def = skillDefinition(u,id),
      m = {...linkedSupport(u, id)};
    m.area*=nativeEvolution(u).area||1;
    this.hazards.push({
      key: ++this.attackSerial,
      x: t.x,
      y: t.y,
      r: radius * m.area,
      ttl: delay,
      total: delay,
      source: u,
      skillId: id,
      power,
      scale,
      proc: true,
      color: def.color || ELEMENTS[BY_ID[u.id].element].color,
    });
    this.fx("telegraph", t.x, t.y, def.color || "#b5b1df", {
      skillId:id,sourceId:u.id,sourceUid:u.uid,
      r: radius * m.area,
      ttl: delay,
      max: delay,
    });
  }
  cast(u, id, target, scale = 1, echo = false, committed = false) {
    if (u.hp <= 0) return;
    const def = skillDefinition(u,id),
      m = {...linkedSupport(u, id)},
      auto = def.auto,
      t = this.castTarget(u, id, target?.hp > 0 ? target : this.target(u));
    if (!t) return;
    m.area*=nativeEvolution(u).area||1;
    if(this.native&&u.nativeActor&&!auto&&!echo&&!committed){
      const key=++this.attackSerial;u.actionId=key;u.actionLock=.38*(u.curioStats?.channel||1)+.3;u.stamina=Math.max(0,u.stamina-10);
      nativeAction(u,Math.atan2(t.y-u.y,t.x-u.x),.38*(u.curioStats?.channel||1),.3,{heavy:true,casting:true,skillId:id});
      this.queue.push({ttl:.38*(u.curioStats?.channel||1),source:u,target:t,skillId:id,scale,nativeCast:true,actionKey:key});u.intention="Preparing "+def.name;return;
    }
    if(u.nativeActor&&!echo&&!committed)nativeAction(u,Math.atan2(t.y-u.y,t.x-u.x),auto?((this.run.rulesVersion||0)>=17?.26:.16):((this.run.rulesVersion||0)>=17?.40:.36),auto?((this.run.rulesVersion||0)>=17?.24:.2):((this.run.rulesVersion||0)>=17?.34:.3),{heavy:!auto});
    this.supportedUse(u, id, echo);
    const shieldScale =
      scale *
      (this.weather === "void" ? 0.8 : 1) *
      (u.side === 0 && this.run.relics.includes("storm-relay") ? 0.85 : 1) *
      (evolutionStage(u) && u.evolutionPath === "warden"
        ? evolutionStage(u) === 2
          ? 1.5
          : 1.25
        : 1);
    const friends = this.living(u.side),
      enemies = this.living(1 - u.side),
      color = def.color || ELEMENTS[BY_ID[u.id].element].color;
    const spellFX=(type,x,y,color,extra={})=>this.fx(type,x,y,color,{...extra,skillId:id,sourceId:u.id,sourceUid:u.uid});
    u.attackAnim = auto ? 0.32 : 0.2;
    if (!auto) {
      u.actionLock = Math.max(u.actionLock, 0.22);
      if(!committed)u.stamina = Math.max(0, u.stamina - 10);
      u.castAnim = 0.65;
      this.metrics.skills++;u.nativeResolvedSkills++;u.lastRelicCast=this.time;if(!echo)relicEvent(this,u,"cast",{target:t,skillId:id});
      this.say(`${creatureName(u)} uses ${def.name}${echo ? " · Echo" : ""}.`);
      this.effect(u.x, u.y - 67, def.name, color);
      spellFX("cast", u.x, u.y, color, { r: 45, ttl: 0.65, max: 0.65 });
    }
    const power = (def.power || 1) * u.atk;
    const weakest = friends
      .slice()
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    if (auto) {
      if (["bolt", "chain"].includes(def.kind)) {
        const key = ++this.attackSerial;
        u.actionId = key;
        const shotWindup=(this.run.rulesVersion||0)>=17?.26:.16;
        u.actionLock = shotWindup+((this.run.rulesVersion||0)>=17?.24:.18);
        u.attackDuration = u.actionLock;
        u.attackAnim = u.attackDuration;
        this.queue.push({
          ttl: shotWindup,
          source: u,
          target: t,
          skillId: id,
          power: def.power,
          scale,
          projectile: true,
          actionKey: key,
          aim: {
            x: t.x,
            y: t.y,
            velocityX: t.velocityX,
            velocityY: t.velocityY,
          },
        });
        if (def.kind === "chain" || m.targets) {
          enemies
            .filter((e) => e !== t)
            .sort((a, b) => distance(a, t) - distance(b, t))
            .slice(0, (def.targets || 1) - 1 + m.targets)
            .forEach((e) =>
              this.queue.push({
                ttl: 0.16,
                source: u,
                target: e,
                skillId: id,
                power: def.power * 0.6,
                scale,
                projectile: true,
                actionKey: key,
                aim: {
                  x: e.x,
                  y: e.y,
                  velocityX: e.velocityX,
                  velocityY: e.velocityY,
                },
              }),
            );
        }
      } else if (def.kind === "beam") {
        this.beginStrike(u, t, id, scale, {
          beam: true,
          reach: u.range + 40,
          windup: 0.24,
          width: 8,
          maxTargets: def.pierce ? 3 + m.targets : 1 + m.targets,
        });
      } else {
        const strike = this.beginStrike(u, t, id, scale);
        if (def.kind === "double") {
          this.strikes.push({
            ...strike,
            key: ++this.attackSerial,
            remaining: strike.remaining + 0.13,
            scale: scale * ((def.hits || 2) - 1),
          });
        }
      }
      if (def.heal)
        weakest
          .slice(0, 1 + m.targets)
          .forEach((f) => this.heal(f, def.heal, u, id, true, scale));
      return;
    }
    if (def.kind === "heal") {
      weakest.slice(0, 1 + m.targets).forEach((f) => {
        this.heal(f, def.heal, u, id, true, scale);
        if (def.cleanse) {
          this.cleanse(f);
        }
        spellFX("beam", u.x, u.y - 10, color, {
          tx: f.x,
          ty: f.y - 10,
          width: 5,
          ttl: 0.5,
          max: 0.5,
        });
      });
    } else if (def.kind === "heal-all") {
      friends.forEach((f) => {
        this.heal(f, def.heal, u, id, true, scale);
        if(def.cleanse)this.cleanse(f);
        if (def.shield)
          f.shield = Math.min(
            f.maxHp * 0.7,
            f.shield + def.shield * shieldScale,
          );
        if (def.haste) f.haste = def.haste;
      });
      spellFX("ring", u.x, u.y, color, { r: 220 * m.area, ttl: 0.8, max: 0.8 });
    } else if (def.kind === "shield") {
      friends
        .filter((f) => def.all || distance(f, u) < def.radius * m.area)
        .forEach((f) => {
          f.shield = Math.min(
            f.maxHp * 0.7,
            f.shield + def.shield * shieldScale,
          );
          spellFX("shield", f.x, f.y, color, { victimUid:f.uid,r: 38, ttl: 0.9, max: 0.9 });
        });
      if (def.taunt) u.taunt = def.taunt;
      if (def.slow)
        enemies
          .filter((e) => distance(e, u) < 180 * m.area)
          .forEach((e) => (e.slow = def.slow));
    } else if (["dash", "blink", "charge"].includes(def.kind)) {
      const victim = def.backline
        ? enemies.find((e) => BY_ID[e.id].range > 100) || t
        : t;
      const dx = victim.x - u.x,
        dy = victim.y - u.y,
        length = Math.hypot(dx, dy) || 1,
        speed = def.kind === "charge" ? 440 : 540;
      const travel = Math.min(
          290,
          Math.max(0, length - u.radius - victim.radius - 3),
        ),
        duration = travel / speed;
      const strike = this.beginStrike(u, victim, id, scale, {
        windup: 0.16 + duration + 0.1,
        reach: 62,
        arc: def.kind === "charge" ? 0.95 : 0.55,
        maxTargets: def.kind === "charge" ? 6 : 1 + m.targets,
      });
      u.dashFrom = { x: u.x, y: u.y };
      u.dashAnim = 0.16 + duration + 0.1;
      u.dashDuration = u.dashAnim;
      u.physicalDash = true;
      u.dashMotion = {
        x: dx / length,
        y: dy / length,
        speed,
        delay: 0.16,
        remaining: duration,
      };
      u.stamina = Math.max(0, u.stamina - 12);
      if (def.evade) u.evade = def.evade;
      if (def.hits > 1)
        this.strikes.push({
          ...strike,
          key: ++this.attackSerial,
          remaining: strike.remaining + 0.18,
          scale: scale * (def.hits - 1),
        });
    } else if (["blast", "volley", "breath"].includes(def.kind)) {
      this.zone(u, t, id, def.power, def.radius, def.delay || 0.7, scale);
      if (def.kind === "breath")
        spellFX("breath", u.x, u.y - 14, color, {
          tx: t.x,
          ty: t.y,
          r: def.radius,
          ttl: 0.75,
          max: 0.75,
        });
      if (m.targets) {
        enemies
          .filter((e) => e !== t && distance(e, t) > def.radius)
          .slice(0, m.targets)
          .forEach((e) =>
            this.zone(
              u,
              e,
              id,
              def.power * 0.7,
              def.radius * 0.7,
              def.delay || 0.7,
              scale,
            ),
          );
      }
    } else if (def.kind === "beam") {
      this.beginStrike(u, t, id, scale, {
        beam: true,
        reach: Math.max(300, u.range + 80),
        windup: 0.38,
        width: 16,
        maxTargets: def.pierce ? 6 : 1 + m.targets,
      });
    } else if (def.kind === "chain") {
      const targets = enemies
        .sort((a, b) => distance(a, t) - distance(b, t))
        .slice(0, def.targets + m.targets);
      let from = u;
      targets.forEach((e) => {
        spellFX("lightning", from.x, from.y - 12, color, {
          tx: e.x,
          ty: e.y - 12,
          ttl: 0.35,
          max: 0.35,
        });
        this.hit(e, power, u, id, scale);
        from = e;
      });
    } else if (def.kind === "salvo") {
      enemies
        .sort((a, b) => distance(a, t) - distance(b, t))
        .slice(0, def.targets + m.targets)
        .forEach((e, i) =>
          this.queue.push({
            ttl: 0.14 * i,
            source: u,
            target: e,
            skillId: id,
            power: def.power,
            scale,
            echo: true,
            projectile: true,
          }),
        );
    } else if (def.kind === "buff") {
      u.haste = def.haste;
      u.evade = def.evade || 0;
      if (def.attackBoost) u.rage = def.haste;
      spellFX("ring", u.x, u.y, color, {
        r: 60 * m.area,
        ttl: 0.65,
        max: 0.65,
      });
    } else if (def.kind === "drain") {
      enemies
        .sort((a, b) => distance(a, u) - distance(b, u))
        .slice(0, def.targets + m.targets)
        .forEach((e) => {
          spellFX("beam", e.x, e.y - 10, color, {
            tx: u.x,
            ty: u.y - 10,
            width: 5,
            ttl: 0.5,
            max: 0.5,
          });
          this.hit(e, power, u, id, scale);
        });
    } else if (def.kind === "spores") {
      weakest
        .slice(0, 1 + m.targets)
        .forEach((f) => this.heal(f, def.heal, u, id, true, scale));
      this.zone(u, t, id, def.power, 70, 0.5, scale);
    } else if (def.kind === "shell") {
      u.shield = Math.min(u.maxHp * 0.7, u.shield + def.shield * shieldScale);
      enemies
        .filter((e) => distance(e, u) < def.radius * m.area)
        .forEach((e) => this.hit(e, power, u, id, scale));
      spellFX("ring", u.x, u.y, color, {
        r: def.radius * m.area,
        ttl: 0.75,
        max: 0.75,
      });
    } else if (def.kind === "awakening") {
      friends.forEach((f) => {
        this.heal(f, f.maxHp * def.healPercent, u, id, true, scale);
        f.shield = Math.min(f.maxHp * 0.7, f.shield + def.shield * shieldScale);
      });
      enemies
        .filter((e) => distance(e, u) < def.radius * m.area)
        .forEach((e) => this.hit(e, power, u, id, scale));
      spellFX("ring", u.x, u.y, color, { r: 260 * m.area, ttl: 1, max: 1 });
    } else if (["gravity", "wave"].includes(def.kind)) {
      friends
        .filter((f) => def.kind === "gravity" || distance(f, u) < def.radius)
        .forEach((f) => {
          if (def.heal) this.heal(f, def.heal, u, id, true, scale);
          if (def.shield)
            f.shield = Math.min(
              f.maxHp * 0.7,
              f.shield + def.shield * shieldScale,
            );
        });
      enemies
        .filter((e) => distance(e, u) < def.radius * m.area)
        .forEach((e) => {
          if (def.kind === "gravity") {
            e.impulseX += ((u.x - e.x) * 1.5) / e.mass;
            e.impulseY += ((u.y - e.y) * 1.5) / e.mass;
          }
          this.hit(e, power, u, id, scale);
        });
      spellFX("ring", u.x, u.y, color, {
        r: def.radius * m.area,
        ttl: 0.8,
        max: 0.8,
      });
    }
  }
  castTarget(u, id, fallback) {
    const def = skillDefinition(u,id),
      enemies = this.living(1 - u.side);
    if (!fallback) return null;
    if(this.native&&['heal','heal-all','awakening','shield'].includes(def.kind))return this.living(u.side).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]||fallback;
    if (["blast", "volley", "breath", "chain"].includes(def.kind))
      return (
        enemies.sort(
          (a, b) =>
            enemies.filter((e) => distance(e, b) < (def.radius || 120)).length -
            enemies.filter((e) => distance(e, a) < (def.radius || 120)).length,
        )[0] || fallback
      );
    if (def.backline)
      return (
        enemies.find((e) => BY_ID[e.id].role === "Support") ||
        enemies.find((e) => BY_ID[e.id].range > 100) ||
        fallback
      );
    return fallback;
  }
  shouldCast(u, id) {
    const def = skillDefinition(u,id),
      friends = this.living(u.side),
      enemies = this.living(1 - u.side);
    if (!enemies.length) return false;
    const selected=this.target(u);
    if(u.aiEffects?.captureCare&&this.capturePlan&&!this.captureSettled&&selected?.uid===this.capturePlan.uid&&['cleave','charge','nova'].includes(def.kind))return false;
    if(this.native&&selected&&!['heal','heal-all','awakening','shield','buff','dash','blink','charge'].includes(def.kind)){
      const reach=['melee','cleave','double'].includes(def.kind)?Math.max(u.range+selected.radius,u.radius+selected.radius+1):['nova','shell','gravity','wave'].includes(def.kind)?(def.radius||180)+selected.radius:Math.max(u.range,220)+(def.kind==='beam'?40:0);
      if(distance(u,selected)>reach)return false;
    }
    if(u.aiEffects?.interrupt&&['stun','root'].some(key=>def[key])&&!enemies.some(e=>e.nativeAction&&!e.nativeAction.released&&!e.nativeAction.charged))return false;
    if (
      ["dash", "blink", "charge"].includes(def.kind) &&
      (u.root > 0 || distance(u, this.target(u) || u) >= 340)
    )
      return false;
    if (
      u.policy === "execute" &&
      !["heal", "heal-all", "awakening", "shield"].includes(def.kind)
    )
      return true;
    if (["heal", "heal-all", "awakening"].includes(def.kind))
      return (
        friends.some(
          (a) =>
            a.hp + (this.native?this.queue.filter(q=>q.nativeCast&&q.source.side===u.side&&(skillDefinition(q.source,q.skillId).kind==="heal-all"||q.target?.uid===a.uid)).reduce((n,q)=>n+(skillDefinition(q.source,q.skillId).heal||0),0):0) < a.maxHp * (u.aiEffects?.triage?.72:.82) ||
            (def.cleanse &&
              (a.burn > 0 || a.poison > 0 || a.bleed > 0 || a.root > 0)),
        ) ||
        linkedSupport(u, id).overheal > 0 ||
        (u.side === 0 && this.run.relics.includes("overgrowth"))
      );
    if (["dash", "blink", "charge"].includes(def.kind))
      return u.root <= 0 && distance(u, this.target(u) || u) < 340;
    if (def.kind === "shield")
      return friends.some(
        (a) =>
          a.shield < a.maxHp * 0.2 &&
          (a.hp < a.maxHp * 0.9 ||
            enemies.some((e) => distance(e, a) < 220) ||
            this.hazards.some(
              (h) => h.source.side !== u.side && distance(h, a) < h.r + 30,
            )),
      );
    if (def.kind === "buff")
      return (
        enemies.some((e) => distance(e, u) < u.range + 110) && u.haste <= 0
      );
    if (["shell", "gravity", "wave"].includes(def.kind))
      return (
        enemies.some((e) => distance(e, u) < (def.radius || 180) + 35) ||
        (def.shield && friends.some((a) => a.hp < a.maxHp * 0.7))
      );
    return true;
  }
  bossMechanic(u, dt) {
    const threshold = this.chaos >= 10 ? 0.65 : 0.5;
    if (u.phase === 1 && u.hp / u.maxHp < threshold) {
      u.phase = 2;
      u.enraged = true;
      u.atk = Math.round(u.atk * 1.15);
      Object.values(u.cooldowns).forEach((c) => {
        c.total *= 0.9;
        c.remaining = Math.min(c.remaining, 1.5);
      });
      u.bossMechanicTimer = 1.5;
      this.phaseEffect(u);
    }
    if (u.phase === 2 && u.hp / u.maxHp < (this.chaos >= 18 ? 0.4 : 0.25)) {
      u.phase = 3;
      u.bossMechanicTimer = 1;
      this.phaseEffect(u);
    }
    u.bossMechanicTimer -= dt;
    if (u.bossMechanicTimer > 0) return;
    u.bossMechanicTimer = u.phase === 3 ? 5 : 7;
    const enemies = this.living(1 - u.side),
      friends = this.living(u.side).filter((a) => a !== u);
    if (u.id === "elderoot") {
      const target = enemies
        .filter((a) => a.hp > 0)
        .sort((a, b) => distance(a, u) - distance(b, u))[0];
      if (target) {
        this.zone(
          u,
          target,
          u.id,
          u.phase === 3 ? 2 : 1.15,
          u.phase === 3 ? 110 : 75,
          1.4,
        );
        this.hazards.at(-1).root = u.phase === 1 ? 2 : 1;
      }
      if (u.phase >= 2 && friends.length) {
        this.heal(u, u.maxHp * 0.035 * friends.length, u);
        this.say("Living retinue feeds the Hollow Crown. Hunt its healers.");
      }
    } else if (u.id === "solwyrm") {
      const targets = enemies
        .slice()
        .sort((a, b) => b.range - a.range)
        .slice(0, u.phase === 3 ? 3 : 1);
      targets.forEach((target) =>
        this.zone(
          u,
          target,
          u.id,
          u.phase === 3 ? 2 : 1.4,
          80,
          u.phase === 3 ? 1.6 : 1.3,
        ),
      );
      if (u.phase >= 2) {
        const burning = enemies.filter((a) => a.burn > 0).length;
        u.shield = Math.min(u.maxHp * 0.35, u.shield + burning * 22);
        if (burning)
          this.say(
            "The Sun Eater feeds on your burning companions. Cleanse or fracture its shield.",
          );
      }
    } else {
      const center = enemies.length
        ? {
            x: enemies.reduce((n, a) => n + a.x, 0) / enemies.length,
            y: enemies.reduce((n, a) => n + a.y, 0) / enemies.length,
          }
        : u;
      this.zone(
        u,
        center,
        u.id,
        u.phase === 3 ? 2.4 : 1.35,
        u.phase === 3 ? 130 : 100,
        1.5,
      );
      if (u.phase >= 2)
        enemies.forEach((a) => {
          a.x += (center.x - a.x) * 0.2;
          a.y += (center.y - a.y) * 0.2;
          if (!enemies.some((b) => b !== a && distance(a, b) < 130))
            a.exposed = 3;
        });
      this.say(
        "Gravity well forming. Mobility and reserved shields save lives.",
      );
    }
  }
  phaseEffect(u) {
    this.say(
      `${u.bossName} · ${BOSS_GUIDES[this.run.planet].phases[u.phase - 1]}`,
    );
    this.effect(
      u.x,
      u.y - 85,
      `PHASE ${u.phase === 2 ? "II" : "III"}`,
      "#f0c393",
    );
    this.fx("ring", u.x, u.y, ELEMENTS[BY_ID[u.id].element].color, {
      r: 230,
      ttl: 1.3,
      max: 1.3,
    });
    this.burst(u.x, u.y, "#dfc5ef", 35, 180);
    this.shake = 4;
    this.audioEvents.push({
      type: "phase",
      element: BY_ID[u.id].element,
      time: this.time,
    });
  }
  recordCapture(result){
    result.attempt=this.savedCaptureResult?(this.savedCaptureResult.attempt||this.captureAttempts||1):++this.captureAttempts;
    if(!this.captureHistory.some(r=>r.attempt===result.attempt))this.captureHistory.push(result);
    this.captureResult=result;
  }
  retryCapture(uid,tool){
    if(this.captureScene)return {ok:false,reason:"Wait for the capture lattice to resolve before another attempt."};
    if(this.done||!this.capturePlan||!this.captureSettled||!this.captureResult||this.captureResult.success)return {ok:false,reason:'Retries are available after a planned capture fails, during combat.'};
    if(this.captureAttempts>=3)return {ok:false,reason:'All three capture attempts have been used this round.'};
    const target=this.units.find(u=>u.uid===uid&&u.side===1&&!u.boss&&u.hp>0&&!u.captured);
    if(!target)return {ok:false,reason:'Choose a living, non-boss opponent.'};
    if(target.hp>=target.maxHp)return {ok:false,reason:'Weaken this opponent first. Full-health capture chance is 0%.'};
    if((this.run.rulesVersion||0)<17&&this.run.bench.length>=12)return {ok:false,reason:'Your reserves are full.'};
    if(!CAPTURERS[tool]||!consumeCapturer(this.run,tool))return {ok:false,reason:'That capturer is unavailable.'};
    this.autoRetryAt=null;this.autoRetryBlocked=null;
    this.capturePlan={...this.capturePlan,uid,tool,threshold:1};
    this.run.captureOrder={...this.capturePlan};
    this.savedCaptureResult=null;this.captureSettled=false;
    this.run.captureReservation={...this.run.captureReservation,uid,tool,result:null,attempts:this.captureAttempts,history:[...this.captureHistory]};
    this.attemptCapture();return {ok:true,result:this.captureResult};
  }
  scheduleCaptureRetry(){
    if(!this.done&&this.run.autoCaptureRetry&&this.captureResult&&!this.captureResult.success&&this.captureAttempts<3){this.autoRetryAt=this.time+3;this.autoRetryBlocked=null;}
  }
  setAutoCaptureRetry(enabled){this.run.autoCaptureRetry=!!enabled;if(!enabled){this.autoRetryAt=null;this.autoRetryBlocked=null;}else if(!this.captureScene)this.scheduleCaptureRetry();}
  advanceCaptureRetry(){
    if(!this.run.autoCaptureRetry){this.autoRetryAt=null;return;}
    if(this.autoRetryAt===null||this.time+1e-8<this.autoRetryAt||this.captureScene)return;
    this.autoRetryAt=null;
    const result=this.retryCapture(this.capturePlan?.uid,this.run.selectedCapturer||this.capturePlan?.tool||'scout');
    if(!result.ok){this.autoRetryBlocked=result.reason;this.say('Auto capture stopped: '+result.reason);}
  }
  attemptCapture() {
    if (!this.capturePlan || this.captureSettled) return;
    const target = this.units.find(
      (a) => a.uid === this.capturePlan.uid && a.side === 1 && !a.boss,
    );
    if (!target) {
      this.captureSettled = true;
      return;
    }
    const threshold = this.capturePlan.threshold??(this.capturePlan.mode === "mercy" ? .35 : .55);
    if (target.hp > 0 && target.hp / target.maxHp > threshold) return;
    if(target.hp<=0&&(this.run.rulesVersion||0)>=15){
      this.captureSettled=true;
      this.captureResult={uid:target.uid,tool:this.capturePlan.tool||'scout',success:false,chance:0,reason:'Knocked out before the capturer could lock on.',creature:{id:target.id,level:target.level}};
      this.recordCapture(this.captureResult);
      this.say(`${creatureName(target)} was knocked out before capture. The committed capturer is lost.`);
      return;
    }
    target.capturePreparation = {
      healthFraction: target.hp / target.maxHp,
      status:
        target.burn > 0 ||
        target.poison > 0 ||
        target.root > 0 ||
        target.slow > 0 ||
        target.bleed > 0,
      mode: this.capturePlan.mode,
      tool:this.capturePlan.tool||"scout",
    };
    const chance =
        this.savedCaptureResult?.chance ?? captureChance(this.run, target),
      success = this.savedCaptureResult?.success ?? this.random() < chance;
    this.captureSettled = true;
    if(progressive(this.run))this.captureScene={uid:target.uid,elapsed:0,duration:(this.run.rulesVersion||0)>=17?2.4:1.8,success,chance,tool:this.capturePlan.tool||"scout"};
    this.captureResult = {
      tool:this.capturePlan.tool||"scout",
      success,
      uid: target.uid,
      chance,
      creature: {
        id: target.id,
        level: target.level,
        evolution: target.evolution,
        evolutionPath: target.evolutionPath,
        skillsVersion:target.skillsVersion,learnedSkills:target.learnedSkills,chosenEvolutionSkills:target.chosenEvolutionSkills,evolutionSkillsVersion:target.evolutionSkillsVersion,archivedSkills:target.archivedSkills,skillSeed:target.skillSeed,
        eliteModifier:target.eliteModifier,eliteTier:target.eliteTier,
        capturePreparation: target.capturePreparation,
        relics:structuredClone(target.relics||[]),genes:target.genes,nature:target.nature,enemyRelics:target.enemyRelics,equipment:[...(target.equipment||[])],equipmentRolls:target.equipmentRolls,equipmentQuality:target.equipmentQuality,equipmentVersion:target.equipmentVersion,
      },
    };
    this.recordCapture(this.captureResult);
    this.fx("capture", target.x, target.y, "#aee8de", {
      r: 90,
      ttl: 1.4,
      max: 1.4,
      success,
    });
    this.effect(
      target.x,
      target.y - 80,
      success ? "CAPTURED" : "ESCAPED",
      success ? "#aee8de" : "#eeaa8b",
    );
    if (success) {
      if((this.run.rulesVersion||0)<17){target.hp=0;target.captured=true;}else{
      // The battle copy changes allegiance; persistent roster recruitment is separate.
      target.roundAlly=true;target.originalSide=1;target.side=0;target.captured=false;
      target.hp=Math.max(target.hp,target.maxHp*.45);
      target.burn=target.poison=target.bleed=target.root=target.slow=target.wither=0;
      target.targetMemory=null;target.targetTimer=0;target.nativeAction=null;target.dashMotion=null;
      target.actionLock=0;target.actionId=null;target.attackTimer=.15;
      if(target.nativeActor)target.nativeActor.side=0;
      for(const a of this.strikes)if(a.source===target)a.cancelled=true;
      this.queue=this.queue.filter(q=>q.source!==target&&q.target!==target);
      this.projectiles=this.projectiles.filter(p=>p.source!==target);
      target.range-=(target.auraApplied?.range||0);target.maxPoise-=(target.auraApplied?.maxPoise||0);target.auraApplied={};
      const converted=stats(target,this.living(0),this.run.relics);
      const healthFraction=target.hp/target.maxHp;
      target.maxHp=converted.hp;target.hp=converted.hp*healthFraction;
      for(const key of ['atk','armor','attackSpeed','actionSpeed','staminaRecharge','dashCooldown','speed','hpRegen','dodge','cdFactor'])target[key]=converted[key];
      for(const [id,cd]of Object.entries(target.cooldowns)){
        const total=skillDefinition(target,id).cd*converted.cdFactor*linkedSupport(target,id).cooldown*(['dash','charge'].includes(skillDefinition(target,id).kind)?converted.dashCooldown:1);
        cd.remaining*=total/cd.total;cd.total=total;
      }
      compileRelics(this,target);
      this.living(1).forEach(u=>{u.targetMemory=null;u.targetTimer=0;});
      }
      this.metrics.captures++;
    }
    this.say(
      `${creatureName(target)}: tactical capture ${success ? "succeeds" : "fails"} (${Math.round(chance * 100)}%).`,
    );
    this.audioEvents.push({
      type: "capture",
      element: BY_ID[target.id].element,
      time: this.time,
    });
  }
  reportAdvice() {
    const allies = this.units.filter((a) => a.side === 0),
      notes = [];
    if(this.native){
      if(this.metrics.interruptedSkills)notes.push(`${this.metrics.interruptedSkills} cooldown channels were interrupted. Escort fragile casters or pressure enemy channels first.`);
      if(this.metrics.terrainBlocks)notes.push(`${this.metrics.terrainBlocks} shots stopped at pillars. Flank around cover or use area spells that land over it.`);
      const threat=this.units.filter(u=>u.side===1).sort((a,b)=>b.damage-a.damage)[0];if(threat?.damage>50)notes.push(`${creatureName(threat)} dealt ${Math.round(threat.damage)} damage. ${BY_ID[threat.id].role==="Ranger"?"Use cover and backline pressure.":BY_ID[threat.id].role==="Support"?"Pressure the caster and deny healing windows.":"Screen your vulnerable allies and save dodge stamina."}`);
    }
    const status = allies.reduce((n, a) => n + a.statusTaken, 0),
      hazard = allies.reduce((n, a) => n + a.hazardTaken, 0);
    if (status > 80)
      notes.push(
        `${Math.round(status)} health lost to burn, poison, and bleed. Try Purification or a Springwater healer.`,
      );
    if (hazard > 80)
      notes.push(
        `${Math.round(hazard)} health lost inside marked areas. Spread rows, add mobility, or reserve barriers.`,
      );
    const foes = this.units.filter((a) => a.side === 1),
      healer = foes
        .filter((a) => BY_ID[a.id].role === "Support")
        .sort((a, b) => b.healed - a.healed)[0];
    if (healer?.healed > 80)
      notes.push(
        `${creatureName(healer)} restored ${Math.round(healer.healed)} health. Hunt healers or apply Withering.`,
      );
    const shields = foes.reduce((n, a) => n + a.shieldAbsorbed, 0);
    if (shields > 100)
      notes.push(
        `Enemy shields absorbed ${Math.round(shields)} damage. Shieldbreaker or a Pressure Fracture creature can bypass them.`,
      );
    if (this.metrics.intercepts > 0)
      notes.push(
        `Protectors intercepted ${this.metrics.intercepts} hits. Keep vulnerable allies near them.`,
      );
    if (!notes.length)
      notes.push(
        this.winner === 0
          ? "Your composition handled this encounter. Save gold for the next scouted counter or evolution."
          : "Check target priorities and deployment. Focus one threat and give your backline a nearby protector.",
      );
    return notes.slice(0, 4);
  }
  step(dt) {
    if(!Number.isFinite(dt)||dt<=0)return;
    if(this.hitPause>0&&this.visuals&&!this.reducedMotion){this.hitPause=Math.max(0,this.hitPause-dt);return;}
    if(this.captureScene){this.captureScene.elapsed+=dt;if(this.captureScene.elapsed>=this.captureScene.duration){const failed=!this.captureScene.success;this.captureScene=null;if(failed)this.scheduleCaptureRetry();}else dt*=.18;}
    if(this.done)return;
    this.accumulator += Math.min(dt, 0.1);
    while (this.accumulator + 1e-9 >= 0.04 && !this.done) {
      this.advance(0.04);
      this.accumulator = Math.max(0, this.accumulator - 0.04);
    }
    this.renderAlpha = Math.max(0, Math.min(1, this.accumulator / 0.04));
  }
  advance(dt) {
    if (this.done) return;
    updateAuras(this.units);
    dt = Math.min(dt, 0.1);
    if(this.visuals)for(const u of this.units)snapshotNativeMotion(u);
    const previousTime=this.time;
    this.time += dt;
    tickAuras(this);
    this.advanceCaptureRetry();
    const actionDt=(this.run.rulesVersion||0)>=15?actionElapsed(previousTime,this.time):dt;
    if(this.enrage.active&&!this.enrageAnnounced){
      this.enrageAnnounced=true;this.metrics.enrageTriggered=1;
      this.say('ENRAGE RISING - Each second: +4% damage, +1% action speed, -1 percentage point of healing. Both teams ramp gradually.');
      this.effect(500,180,'ENRAGE','#ffb56e');this.shake=Math.max(this.shake,3);
    }
    this.shake = Math.max(0, this.shake - dt * 9);
    advanceCombatTexts(this,dt);
    this.effects = this.effects.filter((e) => (e.ttl -= dt) > 0);
    for (const p of this.particles) {
      p.ttl -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
    }
    this.particles = this.particles.filter((p) => p.ttl > 0);
    for (const field of this.fields) {
      field.ttl -= dt;
      this.living(field.source.side)
        .filter((a) => distance(a, field) < field.r)
        .forEach((a) =>
          this.heal(a, a.maxHp * 0.03 * dt, field.source, null, false),
        );
    }
    this.fields = this.fields.filter((f) => f.ttl > 0);
    if (this.weather === "magnet") {
      this.stormTimer -= dt;
      if (this.stormTimer <= 0) {
        this.stormTimer = this.chaos >= 15 ? 7 : 10;
        const enemy = this.living(1)[0];
        if (enemy) {
          const mark = {
            x: 250 + this.random() * 500,
            y: 160 + this.random() * 230,
          };
          this.zone(enemy, mark, enemy.id, 0.8, 100, 1.5);
          this.hazards.at(-1).environment = true;
          this.hazards.at(-1).proc = false;
        }
      }
    }
    for (const u of this.units) {
      if (u.hp <= 0) {
        u.deathTime += dt;
        u.motion = 0;
        continue;
      }
      for (const k of [
        "exposed",
        "weakened",
        "wither",
        "regeneration",
        "retaliation",
        "guardTimer",
        "dashAnim",
        "burn",
        "poison",
        "root",
        "slow",
        "taunt",
        "haste",
        "evade",
        "fortify",
        "regenBuff",
        "movementBuff",
        "rage",
        "flash",
        "attackAnim",
        "castAnim",
        "hitAnim",
        "dodgeAnim",
        "dodgeLock",
        "dodgeCooldown",
        "actionLock",
        "stagger",
        "bleed",
      ])
        u[k] = Math.max(0, u[k] - (['attackAnim','castAnim','actionLock'].includes(k)?actionDt*u.actionSpeed:k==='dodgeCooldown'?actionDt:dt));
      u.statusWard=Math.max(0,(u.statusWard||0)-dt);u.armorBuffTime=Math.max(0,(u.armorBuffTime||0)-dt);
      if(u.statusWard>0)for(const ailment of ['burn','poison','bleed','root','slow','stagger','wither','exposed','weakened'])u[ailment]=0;
      if (u.burn > 0)
        this.damageUnit(
          u,
          dt * 7 * (this.weather === "cinders" ? 1.4 : 1),
          u.burnSource,
          u.burnSkill,
          0,
          "status",
          false,
        );
      if (u.poison > 0)
        this.damageUnit(
          u,
          dt * 5,
          u.poisonSource,
          u.poisonSkill,
          0,
          "status",
          false,
        );
      if (u.bleed > 0)
        this.damageUnit(
          u,
          dt * 6 * (u.motion > 0.2 ? 1.6 : 1),
          u.bleedSource,
          u.bleedSkill,
          0,
          "status",
          false,
        );
      if (u.hp <= 0) continue;
      if(u.nativeKnockdown>0){u.nativeKnockdown=Math.max(0,u.nativeKnockdown-dt);if(!u.nativeKnockdown)u.nativeGetup=.45;}else if(u.nativeGetup>0)u.nativeGetup=Math.max(0,u.nativeGetup-dt);
      u.stamina = Math.min(
        100,
        u.stamina + dt * u.staminaRecharge*(u.actionLock > 0 || u.rollTime > 0 ? .45 : 1),
      );
      u.poise = Math.max(0, u.poise - dt * 12);
      if(u.hpRegen>0)this.heal(u,u.hpRegen*dt,u,null,false);
      relicTick(this,u,dt);
      u.targetTimer -= dt;
      this.reactToThreat(u, dt);
      if (u.regeneration > 0)
        this.heal(u, u.maxHp * 0.025 * dt, u, null, false);
      if (CREATURE_TRAITS[u.id] === "symbiosis" && u.hp > u.maxHp * 0.5)
        this.living(u.side)
          .filter((a) => distance(a, u) < 170)
          .forEach((a) => this.heal(a, a.maxHp * 0.02 * dt, u, null, false));
      const syn = u.side === 0 ? this.teamSyn : this.foeSyn;
      if (syn.grove >= 2 && u.hp > 0)
        this.heal(u,u.maxHp*.01*dt,u,null,false);
      u.attackTimer -= actionDt*u.actionSpeed * (u.haste > 0 ? 1.4 : 1);
      for (const cooldown of Object.values(u.cooldowns))
        cooldown.remaining -= actionDt*u.actionSpeed*(u.auraCooldownRate||1);
      if (u.boss) this.bossMechanic(u, actionDt);
      const forced = this.living(1 - u.side).some(
        (e) => e.taunt > 0 && distance(e, u) < 250,
      );
      if (
        u.targetTimer <= 0 ||
        !u.targetMemory ||
        u.targetMemory.hp <= 0 || u.targetMemory.side===u.side ||
        forced
      ) {
        u.targetMemory = this.target(u);
        u.targetTimer = 0.45;
      }
      const t = u.targetMemory;
      if (!t) continue;
      if (u.actionLock <= 0) u.face = t.x >= u.x ? 1 : -1;
      const sp = BY_ID[u.id],
        dist = distance(u, t);
      let vx = 0,
        vy = 0;
      const nearestEnemy = this.living(1 - u.side).sort(
        (a, b) => distance(a, u) - distance(b, u),
      )[0];
      const nearDist = nearestEnemy ? distance(nearestEnemy, u) : 999;
      const hazard = this.hazards.find(
        (h) =>
          (h.environment || h.source.side !== u.side) &&
          distance(h, u) < h.r + 16 &&
          h.ttl > 0.16,
      );
      if (hazard && u.root <= 0) {
        const dx = u.x - hazard.x,
          dy = u.y - hazard.y,
          len = Math.hypot(dx, dy) || 1;
        vx = dx / len || -u.face;
        vy = dy / len || 1;
        u.dodgeLock = 0.2;
      } else if (sp.range > 100 && nearDist < 105) {
        vx = (u.x - nearestEnemy.x) / (nearDist || 1);
        vy = (u.y - nearestEnemy.y) / (nearDist || 1);
      } else if (dist > u.range) {
        vx = (t.x - u.x) / (dist || 1);
        vy = (t.y - u.y) / (dist || 1);
      } else if (dist < u.range * 0.5 && sp.range > 100) {
        vx = (u.x - t.x) / (dist || 1);
        vy = (u.y - t.y) / (dist || 1);
      }
      // Strikers seek a clear side of an occupied front rather than pushing through it.
      const screen = this.living(u.side).find(
        (a) =>
          a !== u && BY_ID[a.id].role === "Guardian" && distance(a, t) < 90,
      );
      if (
        screen &&
        sp.role === "Striker" &&
        dist < 160 &&
        dist > ((this.run.rulesVersion||0)>=15?u.range+Math.max(7,u.radius*2):u.range*.7) &&
        !hazard
      ) {
        const dx = t.x - screen.x,
          dy = t.y - screen.y,
          len = Math.hypot(dx, dy) || 1;
        const direction = u.y < t.y ? -1 : 1;
        const flankOffset=(this.run.rulesVersion||0)>=15?Math.max(10,t.radius*2+u.radius):65;
        const point = {
          x: t.x - (dy / len) * direction * flankOffset,
          y: t.y + (dx / len) * direction * flankOffset,
        };
        const d = distance(u, point) || 1;
        vx = (point.x - u.x) / d;
        vy = (point.y - u.y) / d;
      }
      for (const f of this.living(u.side)) {
        if (f === u) continue;
        const d = distance(f, u);
        const spacing=(this.run.rulesVersion||0)>=15?u.radius+f.radius+Math.max(2,10*(u.nativeScale||1)):66;
        if (d < spacing && d > 0) {
          const push = ((spacing - d) / spacing) * ((this.run.rulesVersion||0)>=15?.8:.95);
          vx += ((u.x - f.x) / d) * push;
          vy += ((u.y - f.y) / d) * push;
        }
      }
      if(this.native){
        const response=evaluateOrders(u,this.living(u.side),this.living(1-u.side)),goal=tacticalMove(this,u,t,orderGoal(u,t,this.living(u.side),this.living(1-u.side),response)||combatApproach(u,t,this.units,this.bounds));
        u.intention=u.nativeAction?(u.nativeAction.charged?"Bracing a charged strike":"Preparing "+(SKILLS[u.nativeAction.skillId]?.name||"a strike")):u.rollTime>0?"Dodging a committed threat":hazard?"Leaving the danger field":goal?.intent||response?.text||(dist>u.range?"Closing on "+creatureName(t):"Attacking "+creatureName(t));
        if(goal&&!hazard){const d=distance(u,goal);vx=d>.4?(goal.x-u.x)/d*Math.min(1,d/12):0;vy=d>.4?(goal.y-u.y)/d*Math.min(1,d/12):0;}
        if(!u.nativeAction&&!hazard&&Math.hypot(vx,vy)>.05){const clear=avoidCombatBodies(u,vx,vy,this.units);vx=clear.x;vy=clear.y;}
        if(!u.nativeAction&&Math.hypot(vx,vy)>.05){const safe=terrainSteering(u,{x:u.x+vx*180,y:u.y+vy*180},this.terrain),d=distance(u,safe)||1;if(safe.x!==u.x+vx*180||safe.y!==u.y+vy*180){vx=(safe.x-u.x)/d;vy=(safe.y-u.y)/d;u.intention="Going around a broken pillar";}}
      }
      u.px = u.x;
      u.py = u.y;
      const rooted = u.root > 0,
        locked = u.actionLock > 0 || u.stagger > 0 || u.nativeKnockdown>0 || u.nativeGetup>0;
      if (u.dashMotion && !rooted && u.stagger <= 0) {
        const dash = u.dashMotion;
        dash.delay -= actionDt;
        if (dash.delay <= 0 && dash.remaining > 0) {
          const travel = Math.min(dt, dash.remaining);
          u.velocityX = dash.x * dash.speed * this.tuning.movementSpeed/100;
          u.velocityY = dash.y * dash.speed * this.tuning.movementSpeed/100;
          u.x += u.velocityX * travel;
          u.y += u.velocityY * travel;
          dash.remaining -= travel;
        } else {
          u.velocityX = 0;
          u.velocityY = 0;
        }
        if (dash.remaining <= 0) u.dashMotion = null;
      } else if (u.rollTime > 0 && !rooted && u.stagger <= 0) {
        const speed = ((this.run.rulesVersion||0)>=17?({barrel:350,sidestep:370,roll:300}[u.dodgeStyle]||300):(u.mass>1.8||u.balanceVersion>=15&&u.role==='Guardian'?225:300)) * this.tuning.movementSpeed/100;
        u.velocityX = u.rollX * speed;
        u.velocityY = u.rollY * speed;
        u.x += u.velocityX * dt;
        u.y += u.velocityY * dt;
        if(u.dodgeStyle==='barrel')for(const enemy of this.living(1-u.side)){if(distance(u,enemy)<u.radius+enemy.radius+14&&!u.barrelHits?.has(enemy.uid)){u.barrelHits??=new Set();u.barrelHits.add(enemy.uid);this.hit(enemy,u.atk*.35,u,u.loadout.auto,1,false,'physical');}}
        u.rollTime = Math.max(0, u.rollTime - dt);
      } else {
        if (rooted) {
          u.rollTime = 0;
          u.dashMotion = null;
        }
        const movement =
          u.speed * this.tuning.movementSpeed/100 * (this.native?movementPace(dist,u.stamina,this.tuning,(this.run.rulesVersion||0)>=15):1) *
          (progressive(this.run)&&this.native&&sp.range>100&&nearestEnemy&&vx*(nearestEnemy.x-u.x)+vy*(nearestEnemy.y-u.y)<-.15?.58:1) *
          (u.slow > 0 ? 0.5 : 1) *
          (u.movementBuff > 0 ? 1.3 : 1) *
          (u.stamina < 20 ? 0.7 : 1);
        const factor=rooted||locked?0:1;
        if((this.run.rulesVersion||0)>=15&&this.native){
          const weight=Math.max(.65,Math.min(1.2,1/Math.sqrt(u.mass||1)));
          const velocity=steerMovement(u.velocityX,u.velocityY,vx,vy,movement,factor,dt,{...this.tuning,acceleration:this.tuning.acceleration*weight});
          u.velocityX=velocity.x;u.velocityY=velocity.y;
        }else{const smoothing=1-Math.exp(-dt*14);u.velocityX+=(vx*movement*factor-u.velocityX)*smoothing;u.velocityY+=(vy*movement*factor-u.velocityY)*smoothing;}
        u.x += u.velocityX * dt;
        u.y += u.velocityY * dt;
        if((this.run.rulesVersion||0)>=15&&Math.hypot(u.velocityX,u.velocityY)>u.speed*this.tuning.movementSpeed/100*1.85)u.stamina=Math.max(0,u.stamina-dt*24);
      }
      u.x += u.impulseX * dt;
      u.y += u.impulseY * dt;
      u.impulseX *= Math.exp(-dt * 9);
      u.impulseY *= Math.exp(-dt * 9);
      confineBody(u,this.bounds);
      if(this.native)confineTerrain(u,this.terrain);
      u.dustTimer -= dt;
      u.motion = Math.min(
        1,
        Math.hypot(u.x - u.px, u.y - u.py) / (u.speed * dt || 1),
      );
      if (Math.abs(vx) + Math.abs(vy) > 0.3 && u.dustTimer <= 0) {
        u.dustTimer = 0.25;
        this.particles.push({
          x: u.x,
          y: u.y + 20,
          vx: -vx * 15,
          vy: -5,
          ttl: 0.3,
          max: 0.3,
          size: 2,
          color: "#c5bda161",
        });
      }
      const ready = u.loadout.active.find(
        (id) => u.cooldowns[id].remaining <= 0 && this.shouldCast(u, id),
      );
      if (
        ready &&
        u.dodgeLock <= 0 &&
        u.actionLock <= 0 &&
        u.stagger <= 0 &&
        !u.nativeKnockdown&&!u.nativeGetup&&
        u.stamina >= (u.aiEffects?.reserveStamina?45:10) &&
        u.hp > 0
      ) {
        const cd = u.cooldowns[ready];
        cd.remaining = cd.total;
        cd.casts++;
        this.cast(u, ready, t);
      }
      u.skillTimer = u.cooldowns[u.id].remaining;
      u.cd = u.cooldowns[u.id].total;
      if (
        u.attackTimer <= 0 &&
        u.actionLock <= 0 &&
        u.stagger <= 0 &&
        !u.nativeKnockdown&&!u.nativeGetup&&
        u.stamina >= (u.aiEffects?.reserveStamina?38:8) &&
        dist <= (this.native&&sp.range<100?Math.max(u.range+12*u.nativeScale,u.radius+t.radius+1+3*u.nativeScale):u.range+12) &&
        (!this.native||!u.nativeActor||Math.abs(Math.atan2(Math.sin(Math.atan2(t.y-u.y,t.x-u.x)-u.facing),Math.cos(Math.atan2(t.y-u.y,t.x-u.x)-u.facing)))<0.5) &&
        u.dodgeLock <= 0 &&
        u.hp > 0
      ) {
        u.attackTimer =
          1/u.attackSpeed;
        u.stamina -= 8;
        this.cast(u, u.loadout.auto, t);
      }
    }
    this.metrics.collisions += separateBodies(this.units,this.bounds);
    for(const u of this.units){if(this.native)confineTerrain(u,this.terrain);if(u.nativeActor)advanceNative(u,dt,this.time,this.visuals,actionDt*u.actionSpeed);}
    for (const strike of this.strikes) {
      const previous=strike.remaining;
      strike.remaining -= actionDt*strike.source.actionSpeed;
      if(strike.nativeMelee)this.nativeContact(strike,1-previous/strike.total,1-strike.remaining/strike.total);
      if (strike.remaining <= 0) this.resolveStrike(strike);
    }
    this.strikes = this.strikes.filter(
      (s) => s.remaining > 0 && !s.cancelled && s.source.hp > 0,
    );
    for (const q of this.queue) {
      q.ttl -= actionDt*(q.source.actionSpeed||1);
      if (
        q.ttl <= 0 &&
        q.source.hp > 0 &&
        !this.cancelledAttacks.has(q.actionKey)
      ) {
        if(q.relicEcho){this.cast(q.source,q.skillId,q.target,q.scale,true,true);}
        else if(q.nativeCast){this.cast(q.source,q.skillId,q.target,q.scale,false,true);q.source.actionId=null;}
        else if (q.single) {
          if (q.target?.hp > 0)
            this.hit(
              q.target,
              q.source.atk * (q.power ?? skillDefinition(q.source,q.skillId).power),
              q.source,
              q.skillId,
              q.scale,
            );
        } else if (q.projectile)
          this.projectile(
            q.source,
            q.target,
            q.skillId,
            q.power,
            q.scale,
            true,
            q.aim,
          );
        else this.cast(q.source, q.skillId, q.target, q.scale, true);
      }
    }
    this.queue = this.queue.filter((q) => q.ttl > 0);
    for (const p of this.projectiles) {
      p.prevX = p.x;
      p.prevY = p.y;
      p.age += dt;
      p.ttl -= dt;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 7) p.trail.shift();
      const end = { x: p.x + p.vx * dt, y: p.y + p.vy * dt };
      const impacts = this.living(1 - p.source.side)
        .map((unit) => ({ unit, t: movingBodyHit(p, end, unit, p.radius) }))
        .filter((h) => h.t !== null)
        .sort((a, b) => a.t - b.t);
      const impact = impacts[0],blocker=this.native?firstTerrainHit({x:p.x,y:p.y+14},{x:end.x,y:end.y+14},this.terrain,p.radius):null;
      if(blocker&&(!impact||blocker.t<=impact.t)){p.x+=(end.x-p.x)*blocker.t;p.y+=(end.y-p.y)*blocker.t;p.dead=true;this.metrics.terrainBlocks++;this.fx("impact",p.x,p.y,p.color,{r:18});continue;}
      if (impact) {
        p.x += (end.x - p.x) * impact.t;
        p.y += (end.y - p.y) * impact.t;
        this.hit(
          impact.unit,
          p.source.atk * p.power,
          p.source,
          p.skillId,
          p.scale,
          p.proc,
          "projectile",
        );
        if (impact.unit !== p.target) this.metrics.blockedProjectiles++;
        const def = skillDefinition(p.source,p.skillId);
        if (def.radius)
          this.living(1 - p.source.side)
            .filter(
              (e) =>
                e !== impact.unit &&
                distance(e, impact.unit) <
                  def.radius * linkedSupport(p.source, p.skillId).area * (nativeEvolution(p.source).area||1),
            )
            .forEach((e) =>
              this.hit(
                e,
                p.source.atk * p.power * 0.4,
                p.source,
                p.skillId,
                p.scale,
                false,
              ),
            );
        p.dead = true;
      } else {
        p.x = end.x;
        p.y = end.y;
        if (
          !p.evadeRecorded &&
          p.age > p.passTime &&
          p.target?.rollCount > p.targetRoll
        ) {
          p.evadeRecorded = true;
          this.registerEvade(p.target, p.source, `shot-${p.key}`);
        }
        if (p.ttl <= 0 || p.x < 25 || p.x > 975 || p.y < (this.native?80:45) || p.y > (this.native?840:490)) {
          p.dead = true;
          this.metrics.whiffs++;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    for (const h of this.hazards) {
      h.ttl -= dt;
      if (h.ttl <= 0) {
        const targets = (
          h.environment
            ? this.units.filter((u) => u.hp > 0)
            : this.living(1 - h.source.side)
        ).filter((e) => distance(e, h) < h.r);
        targets.forEach((e) =>
          this.hit(
            e,
            h.source.atk * h.power,
            h.source,
            h.skillId,
            h.scale,
            h.proc,
            "hazard",
          ),
        );
        if (h.root) targets.forEach((e) => (e.root = Math.max(e.root, h.root)));
        this.fx("nova", h.x, h.y, h.color, { skillId:h.skillId,sourceId:h.source.id,sourceUid:h.source.uid,r: h.r, ttl: 0.65, max: 0.65 });
        this.burst(h.x, h.y, h.color, 18, 130);
        this.shake = Math.min(5, this.shake + 2);
        if (!targets.length) this.metrics.dodges++;
      }
    }
    this.hazards = this.hazards.filter((h) => h.ttl > 0);
    this.attemptCapture();
    if (this.audioEvents.length > 20)
      this.audioEvents = this.audioEvents.slice(-20);
    if (!this.captureScene&&(!this.living(0).length || !this.living(1).length || this.time >= 90)) {
      if (this.capturePlan && !this.captureSettled) {
        const target = this.units.find((u) => u.uid === this.capturePlan.uid);
        this.captureSettled = true;
        this.captureResult = {
          success: false,
          uid: this.capturePlan.uid,
          chance: 0,
          reason: "Capture conditions were not met before the encounter ended.",
          creature: target
            ? {
                id: target.id,
                level: target.level,
                evolution: target.evolution,
                evolutionPath: target.evolutionPath,
        skillsVersion:target.skillsVersion,learnedSkills:target.learnedSkills,chosenEvolutionSkills:target.chosenEvolutionSkills,evolutionSkillsVersion:target.evolutionSkillsVersion,archivedSkills:target.archivedSkills,skillSeed:target.skillSeed,
              }
            : null,
        };
        this.recordCapture(this.captureResult);
      }
      this.done = true;
      const a = this.living(0),
        b = this.living(1);
      this.winner = !a.length
        ? 1
        : !b.length
          ? 0
          : a.reduce((s, u) => s + u.hp / u.maxHp, 0) / this.units.filter(u=>u.side===0).length >=
              b.reduce((s, u) => s + u.hp / u.maxHp, 0) /
                this.units.filter(u=>u.side===1).length
            ? 0
            : 1;
      this.say(
        this.time >= 90
          ? "Time limit reached. Surviving health decides the encounter."
          : this.winner === 0
            ? "The expedition is victorious."
            : "The expedition retreats.",
      );
    }
  }
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function lineDistance(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = clamp(
    ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
    0,
    1,
  );
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export function simulate(run, foes, seed = 1) {
  const b = new Battle(run, foes, seed);
  for (let i = 0; i < 1801 && !b.done; i++) b.step(0.05);
  return b;
}
