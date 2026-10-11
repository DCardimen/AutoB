import { SKILLS, loadoutFor } from "./skills.js";
import { EXPANSION_SPECIES } from "./roster.js";
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
    description: "2: skills recharge 18% faster · 4: +18% dodge",
  },
  void: {
    name: "Void",
    color: "#b296df",
    icon: "✧",
    description: "2: +12% lifesteal · 4: execute below 20% HP",
  },
};
export const SPECIES = [
  {
    id: "cinderfox",
    name: "Cinderfox",
    element: "ember",
    role: "Striker",
    rarity: "Common",
    shape: "fox",
    hp: 210,
    atk: 26,
    speed: 77,
    range: 37,
    skill: "Solar pounce",
    skillDesc:
      "Leap at the weakest enemy for 2.4× attack. Leaves a burning trail.",
    cd: 8,
    power: 2.4,
  },
  {
    id: "mossguard",
    name: "Mossguard",
    element: "grove",
    role: "Guardian",
    rarity: "Common",
    shape: "golem",
    hp: 380,
    atk: 19,
    speed: 44,
    range: 39,
    skill: "Living bulwark",
    skillDesc:
      "Grant nearby allies a 60 HP shield and taunt enemies for 3 seconds.",
    cd: 10,
    power: 1,
  },
  {
    id: "brookfin",
    name: "Brookfin",
    element: "tide",
    role: "Support",
    rarity: "Common",
    shape: "fish",
    hp: 235,
    atk: 17,
    speed: 64,
    range: 142,
    skill: "Mending current",
    skillDesc: "Heal the most wounded ally for 70 HP. Removes burn.",
    cd: 8,
    power: 1,
  },
  {
    id: "voltwing",
    name: "Voltwing",
    element: "storm",
    role: "Ranger",
    rarity: "Common",
    shape: "bird",
    hp: 190,
    atk: 24,
    speed: 80,
    range: 166,
    skill: "Chain lightning",
    skillDesc: "Strike three enemies for 1.6× attack each. Has a short windup.",
    cd: 9,
    power: 1.6,
  },
  {
    id: "pyrehorn",
    name: "Pyrehorn",
    element: "ember",
    role: "Guardian",
    rarity: "Uncommon",
    shape: "rhino",
    hp: 350,
    atk: 23,
    speed: 48,
    range: 44,
    skill: "Seismic charge",
    skillDesc: "Charge into the enemy frontline, dealing 2× attack in an area.",
    cd: 11,
    power: 2,
  },
  {
    id: "bloomkin",
    name: "Bloomkin",
    element: "grove",
    role: "Support",
    rarity: "Uncommon",
    shape: "sprite",
    hp: 215,
    atk: 16,
    speed: 69,
    range: 137,
    skill: "Wild bloom",
    skillDesc:
      "Heal all living allies for 35 HP and hasten attacks for 3 seconds.",
    cd: 12,
    power: 1,
  },
  {
    id: "glacier",
    name: "Glacier",
    element: "tide",
    role: "Guardian",
    rarity: "Rare",
    shape: "golem",
    hp: 435,
    atk: 24,
    speed: 41,
    range: 43,
    skill: "Glacial prism",
    skillDesc: "Shield the team for 85 HP. Slow nearby enemies for 4 seconds.",
    cd: 12,
    power: 1,
  },
  {
    id: "thornstag",
    name: "Thornstag",
    element: "grove",
    role: "Striker",
    rarity: "Rare",
    shape: "stag",
    hp: 270,
    atk: 31,
    speed: 79,
    range: 42,
    skill: "Briar lance",
    skillDesc: "Root the weakest enemy, striking for 3× attack.",
    cd: 9,
    power: 3,
  },
  {
    id: "nightmaw",
    name: "Nightmaw",
    element: "void",
    role: "Striker",
    rarity: "Rare",
    shape: "cat",
    hp: 265,
    atk: 32,
    speed: 91,
    range: 38,
    skill: "Shadow step",
    skillDesc: "Teleport behind a ranged enemy and strike for 3× attack.",
    cd: 8,
    power: 3,
  },
  {
    id: "sparkhare",
    name: "Sparkhare",
    element: "storm",
    role: "Striker",
    rarity: "Uncommon",
    shape: "rabbit",
    hp: 205,
    atk: 27,
    speed: 99,
    range: 37,
    skill: "Static rush",
    skillDesc:
      "Dash through the nearest enemy for 2.5× attack and gain evasion.",
    cd: 7,
    power: 2.5,
  },
  {
    id: "solwyrm",
    name: "Solwyrm",
    element: "ember",
    role: "Ranger",
    rarity: "Epic",
    shape: "dragon",
    hp: 305,
    atk: 36,
    speed: 62,
    range: 175,
    skill: "Sunfire breath",
    skillDesc:
      "Breathe a wide cone of fire for 3× attack. Burns all targets hit.",
    cd: 11,
    power: 3,
  },
  {
    id: "lunacrest",
    name: "Lunacrest",
    element: "tide",
    role: "Support",
    rarity: "Epic",
    shape: "fox",
    hp: 285,
    atk: 23,
    speed: 73,
    range: 157,
    skill: "Lunar tide",
    skillDesc: "Heal every ally for 55 HP and grant a 40 HP shield.",
    cd: 11,
    power: 1,
  },
  {
    id: "astralisk",
    name: "Astralisk",
    element: "void",
    role: "Ranger",
    rarity: "Epic",
    shape: "dragon",
    hp: 280,
    atk: 37,
    speed: 70,
    range: 180,
    skill: "Void rupture",
    skillDesc: "Create a delayed singularity, dealing 3× attack in an area.",
    cd: 10,
    power: 3,
  },
  {
    id: "tempest",
    name: "Tempest",
    element: "storm",
    role: "Ranger",
    rarity: "Rare",
    shape: "bird",
    hp: 235,
    atk: 31,
    speed: 85,
    range: 174,
    skill: "Storm volley",
    skillDesc: "Mark an area, then strike everyone inside for 2.8× attack.",
    cd: 9,
    power: 2.8,
  },
  {
    id: "duskcap",
    name: "Duskcap",
    element: "void",
    role: "Support",
    rarity: "Uncommon",
    shape: "mushroom",
    hp: 245,
    atk: 20,
    speed: 53,
    range: 140,
    skill: "Dream spores",
    skillDesc: "Heal the weakest ally for 60 HP and poison the nearest enemy.",
    cd: 9,
    power: 1,
  },
  {
    id: "flintback",
    name: "Flintback",
    element: "ember",
    role: "Guardian",
    rarity: "Rare",
    shape: "turtle",
    hp: 440,
    atk: 22,
    speed: 36,
    range: 41,
    skill: "Molten shell",
    skillDesc: "Gain a 120 HP shield and burn nearby enemies.",
    cd: 11,
    power: 1,
  },
  {
    id: "elderoot",
    name: "Elderoot",
    element: "grove",
    role: "Guardian",
    rarity: "Legendary",
    shape: "stag",
    hp: 510,
    atk: 31,
    speed: 53,
    range: 48,
    skill: "Ancient awakening",
    skillDesc:
      "Restore 15% team HP, shield all allies, and strike a nearby enemy.",
    cd: 13,
    power: 2,
  },
  {
    id: "starborn",
    name: "Starborn",
    element: "storm",
    role: "Striker",
    rarity: "Legendary",
    shape: "cat",
    hp: 370,
    atk: 43,
    speed: 105,
    range: 42,
    skill: "Event horizon",
    skillDesc: "Blink to the weakest enemy and strike twice for 2.4× attack.",
    cd: 10,
    power: 4.8,
  },
  {
    id: "abyssal",
    name: "Abyssal",
    element: "void",
    role: "Guardian",
    rarity: "Legendary",
    shape: "golem",
    hp: 520,
    atk: 33,
    speed: 46,
    range: 49,
    skill: "Gravity well",
    skillDesc:
      "Shield allies for 100 HP and draw a devastating pulse through enemies.",
    cd: 13,
    power: 2.5,
  },
  {
    id: "coralisk",
    name: "Coralisk",
    element: "tide",
    role: "Ranger",
    rarity: "Uncommon",
    shape: "dragon",
    hp: 245,
    atk: 25,
    speed: 65,
    range: 155,
    skill: "Pressure jet",
    skillDesc: "Pierce a line of enemies for 2.3× attack.",
    cd: 8,
    power: 2.3,
  },
];
const originalEvolutionNames = [
  "Embermane",
  "Mosswarden",
  "Tideweaver",
  "Stormplume",
  "Inferhorn",
  "Floracrown",
  "Frosttitan",
  "Briarhart",
  "Umbrapanther",
  "Arcbound",
  "Heliodrake",
  "Moonsovereign",
  "Voidseraph",
  "Tempestlord",
  "Dreamsage",
  "Magmabastion",
  "Yggrahart",
  "Celestiger",
  "Abyssarch",
  "Coralwyrm",
];
SPECIES.forEach((s, i) => {
  s.artSheet = "creatures";
  s.artIndex = i;
  s.evolvedName = originalEvolutionNames[i];
});
SPECIES.push(...EXPANSION_SPECIES);
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
for (const s of EXPANSION_SPECIES) {
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
    desc: "All allies gain 12% dodge chance and 12% movement speed.",
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
  return stage ? `${stage === 2 ? "Ascendant " : ""}${s.evolvedName}` : s.name;
}
export function relicSlots(c) {
  return RELIC_SLOTS[BY_ID[c.id].rarity] + evolutionStage(c);
}
export function evolutionOffer(run, c) {
  const stage = evolutionStage(c),
    level = stage === 0 ? 5 : 8,
    cost = stage === 0 ? 50 : 100;
  if (stage === 2)
    return { ready: false, reason: "Fully ascended", level, cost, stage };
  if (c.level < level)
    return { ready: false, reason: `Reach level ${level}`, level, cost, stage };
  if (run.gold < cost)
    return {
      ready: false,
      reason: `Requires ${cost} gold`,
      level,
      cost,
      stage,
    };
  return { ready: true, reason: "Ready to evolve", level, cost, stage };
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
  return { success: true, name: creatureName(c), stage: c.evolution, path };
}
export function personalRelic(id) {
  if (!PERSONAL_BY_ID[id]) throw new Error("Unknown personal relic");
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
    const relic = PERSONAL_BY_ID[item.id];
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
  return e;
}
export function equipRelic(run, creatureIndex, itemUid) {
  const c = run.team[creatureIndex],
    index = run.inventory.findIndex((i) => i.uid === itemUid);
  if (!c || index < 0 || (c.relics || []).length >= relicSlots(c)) return false;
  const item = run.inventory[index];
  if ((c.relics || []).some((r) => r.id === item.id)) return false;
  c.relics ??= [];
  item.link = c.id;
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
  };
  for (const item of c.relics || []) {
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
    ])
      m[key] += s[key] || 0;
  }
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
  const c = run.team[creatureIndex],
    item = c?.relics?.[slot];
  if (!item) return false;
  const loadout = loadoutFor(BY_ID[c.id], c.level);
  if (![loadout.auto, ...loadout.active].includes(skillId)) return false;
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
export function stats(c, team, relics = []) {
  const s = BY_ID[c.id],
    syn = synergies(team),
    has = (id) => relics.includes(id);
  const growth =
    (1 + (c.level - 1) * 0.105 + (c.training || 0) * 0.07) *
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
  if ((syn.tide || 0) >= 2) hp *= 1.18;
  if (has("banner") && s.role === "Guardian") hp *= 1.22;
  if (has("seed") && s.element === "grove") hp *= 1.12;
  if ((syn.ember || 0) >= 4) atk *= 1.24;
  if (has("bond"))
    atk *= 1 + Object.values(syn).filter((n) => n >= 2).length * 0.05;
  if ((syn.storm || 0) >= 2) cd *= 0.82;
  if (has("clock")) cd *= 0.78;
  if ((syn.storm || 0) >= 4) dodge += 0.18;
  if (has("feather")) {
    dodge += 0.12;
    speed *= 1.12;
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
  hp *= personal.health;
  atk *= personal.attack;
  cd *= personal.cooldown;
  speed *= personal.speed;
  dodge += personal.dodge;
  return {
    hp: Math.round(hp),
    atk: Math.round(atk),
    cd: cd * linkedSupport(c, c.id).cooldown,
    cdFactor: cd / SKILLS[s.id].cd,
    speed,
    dodge,
    range: s.range,
    personal,
  };
}
export function makeRun(seed = Date.now(), ids = STARTERS) {
  const random = rng(seed),
    team = ids.slice(0, 6).map((id) => creature(id));
  while (team.length < 6) team.push(creature(STARTERS[team.length]));
  return {
    seed,
    random,
    team,
    bench: [],
    relics: [],
    inventory: ["scorch-fang", "ward-stone", "quick-shard"].map(personalRelic),
    gold: 160,
    orbs: 5,
    planet: 0,
    depth: 0,
    route: null,
    path: [],
    integrity: 3,
    wins: 0,
    kills: 0,
    stance: "balanced",
    shop: null,
    complete: false,
  };
}
export function generateRoute(run) {
  const r = rng(run.seed + run.planet * 9751);
  const types = [
    ["battle", "battle", "event"],
    ["battle", "shop", "elite"],
    ["capture", "rest", "battle"],
    ["elite", "event", "shop"],
    ["battle", "rest", "capture"],
    ["boss"],
  ];
  return types.map((row, d) =>
    row.map((type, i) => ({
      id: `p${run.planet}-${d}-${i}`,
      type,
      depth: d,
      lane: i,
      seed: Math.floor(r() * 1e8),
    })),
  );
}
export function canVisit(run, node) {
  if (node.depth !== run.depth) return false;
  if (run.depth === 0 || node.type === "boss") return true;
  return Math.abs(node.lane - run.lastLane) <= 1;
}
export function enterNode(run, node) {
  if (!canVisit(run, node)) throw new Error("Node is not reachable");
  run.lastLane = node.lane;
  run.path.push(node.id);
}
export function nextNode(run) {
  run.depth++;
  if (run.depth > 5) {
    run.planet++;
    run.depth = 0;
    run.lastLane = undefined;
    run.route = null;
    if (run.planet >= PLANETS.length) run.complete = true;
  }
}
export function encounter(run, type = "battle", seed = 1) {
  const r = rng(seed),
    p = PLANETS[run.planet],
    base = 1 + run.planet * 2 + Math.floor(run.depth / 2),
    n =
      type === "boss"
        ? 4 + run.planet
        : type === "elite"
          ? 6
          : type === "capture" || run.depth === 0
            ? 4
            : 5;
  const foes = [];
  const rarityRank = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
  const maxRank =
    run.planet === 0 && run.depth < 2
      ? 1
      : run.planet === 0
        ? 2
        : run.planet === 1
          ? 3
          : 4;
  const pool = p.pool.filter((id) => rarityRank[BY_ID[id].rarity] <= maxRank);
  const weights = {
    Common: 5,
    Uncommon: 4,
    Rare: 2.5,
    Epic: 1.2,
    Legendary: 0.4,
  };
  const chooseWild = (available) => {
    let roll =
      r() * available.reduce((sum, id) => sum + weights[BY_ID[id].rarity], 0);
    for (const id of available) {
      roll -= weights[BY_ID[id].rarity];
      if (roll <= 0) return id;
    }
    return available.at(-1);
  };
  for (let i = 0; i < n; i++) {
    const rare = p.pool.filter((id) =>
      ["Rare", "Epic", "Legendary"].includes(BY_ID[id].rarity),
    );
    const id =
      type === "boss" && i === 0
        ? p.boss
        : type === "capture" && i === n - 1 && rare.length
          ? chooseWild(rare)
          : chooseWild(pool);
    const c = creature(id, Math.max(1, base + (type === "elite" ? 1 : 0)));
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
    foes.push(c);
  }
  return foes;
}
export function captureChance(run, c) {
  return Math.min(
    0.97,
    RARITY[BY_ID[c.id].rarity].catch +
      (run.relics.includes("lens") ? 0.18 : 0) +
      (run.encounterType === "capture" ? 0.12 : 0),
  );
}
export function rollCapture(run, c) {
  if (run.orbs <= 0) return { success: false, reason: "No capture orbs" };
  if (run.bench.length >= 12) return { success: false, reason: "Bench full" };
  run.orbs--;
  const success = run.random() < captureChance(run, c);
  if (success) {
    const caught = creature(c.id, Math.max(1, c.level));
    caught.evolution = evolutionStage(c);
    caught.evolutionPath = caught.evolution ? c.evolutionPath : null;
    run.bench.push(caught);
    return { success: true, creature: caught };
  }
  return { success: false };
}
export function buyRelic(run, id) {
  const relic = RELICS.find((r) => r.id === id);
  if (!relic || run.relics.includes(id) || run.gold < relic.cost) return false;
  run.gold -= relic.cost;
  run.relics.push(id);
  return true;
}
export function buyCreature(run, id) {
  const s = BY_ID[id],
    cost = RARITY[s.rarity].cost;
  if (run.gold < cost || run.bench.length >= 12) return false;
  run.gold -= cost;
  run.bench.push(creature(id, 1 + run.planet * 3));
  return true;
}
export function rewardBattle(run, type, won) {
  if (won) {
    run.wins++;
    const gold = Math.round(
      (type === "boss" ? 145 : type === "elite" ? 85 : 48 + run.depth * 4) *
        (run.relics.includes("coin") ? 1.35 : 1),
    );
    run.gold += gold;
    const xp = Math.round(
      (type === "boss" ? 72 : type === "elite" ? 46 : 32 + run.depth * 3) *
        (1 + run.planet * 0.35),
    );
    const levels = [];
    for (const c of run.team) {
      const n = gainXP(c, Math.round(xp * personalEffects(c).xp));
      if (n) levels.push(c.id);
    }
    if (type === "boss") run.orbs += 2;
    return { gold, xp, levels };
  }
  run.integrity--;
  return {
    gold: 0,
    xp: 12,
    levels: run.team
      .filter((c) => gainXP(c, Math.round(12 * personalEffects(c).xp)) > 0)
      .map((c) => c.id),
  };
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
export function applyEvent(run, event, index) {
  const c = event.choices[index];
  if (c.kind === "relic") {
    if (run.gold < c.cost || run.relics.includes(c.relic)) return { ok: false };
    run.gold -= c.cost;
    run.relics.push(c.relic);
  }
  if (c.kind === "trade") {
    if (run.orbs < c.cost || run.bench.length >= 12) return { ok: false };
    run.orbs -= c.cost;
    run.bench.push(creature(c.creature, 1 + run.planet * 3));
  }
  if (c.kind === "risk") {
    if (run.integrity <= 1 || run.bench.length >= 12) return { ok: false };
    if (run.random() < 0.65) {
      run.bench.push(creature(c.creature, 2 + run.planet * 3));
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
  constructor(run, foes, seed = 1) {
    this.run = run;
    this.random = rng(seed);
    this.time = 0;
    this.done = false;
    this.winner = null;
    this.units = [];
    this.projectiles = [];
    this.effects = [];
    this.particles = [];
    this.hazards = [];
    this.queue = [];
    this.log = [];
    this.shake = 0;
    this.metrics = {
      dodges: 0,
      skills: 0,
      damage: 0,
      healing: 0,
      crits: 0,
      echoes: 0,
    };
    this.teamSyn = synergies(run.team);
    this.foeSyn = synergies(foes);
    const add = (c, side, index, team) => {
      const st = stats(c, team, side === 0 ? run.relics : []),
        loadout = loadoutFor(BY_ID[c.id], c.level);
      if (c.boss) {
        st.hp *= 1.35;
        st.atk *= 1.04;
      }
      const rear = st.range > 100,
        x = side === 0 ? (rear ? 160 : 285) : rear ? 840 : 715,
        y = 160 + (index % 3) * 110 + (index >= 3 ? 35 : -25);
      const cooldowns = Object.fromEntries(
        loadout.active.map((id, i) => {
          const total =
            SKILLS[id].cd * st.cdFactor * linkedSupport(c, id).cooldown;
          return [
            id,
            { total, remaining: 1.6 + i * 1.8 + this.random() * 3, casts: 0 },
          ];
        }),
      );
      this.units.push({
        ...c,
        ...st,
        maxHp: st.hp,
        hp: st.hp,
        side,
        x: x + (index >= 3 ? -30 : 25) * (side === 0 ? 1 : -1),
        y,
        px: x,
        py: y,
        loadout,
        cooldowns,
        attackTimer: 0.3 + this.random(),
        skillTimer: cooldowns[c.id].remaining,
        shield: side === 0 && run.relics.includes("prism") ? 65 : 0,
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
    this.say("The gates open. Your expedition enters the arena.");
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
    if ((s.role === "Striker" && stance !== "guard") || stance === "hunt")
      return enemies.sort(
        (a, b) =>
          a.hp / a.maxHp +
          distance(a, u) / 600 -
          (b.hp / b.maxHp + distance(b, u) / 600),
      )[0];
    return enemies.sort((a, b) => distance(a, u) - distance(b, u))[0];
  }
  heal(target, amount, source, skillId = null, show = true, scale = 1) {
    if (!target || target.hp <= 0) return;
    const mod = skillId ? linkedSupport(source, skillId) : { healing: 1 };
    amount *= mod.healing * scale;
    if (source.side === 0 && this.run.relics.includes("seed")) amount *= 1.35;
    const syn = source.side === 0 ? this.teamSyn : this.foeSyn;
    if (syn.grove >= 4) amount *= 1.3;
    const real = Math.min(amount, target.maxHp - target.hp);
    target.hp += real;
    source.healed += real;
    this.metrics.healing += real;
    if (show && real >= 2) {
      this.effect(target.x, target.y - 44, `+${Math.round(real)}`, "#bada9b");
      this.fx("heal", target.x, target.y, "#badf92", {
        r: 36,
        ttl: 0.7,
        max: 0.7,
      });
    }
  }
  hit(target, amount, source, skillId, scale = 1, proc = true) {
    if (!target || target.hp <= 0) return;
    const def = SKILLS[skillId],
      mod = linkedSupport(source, skillId),
      syn = target.side === 0 ? this.teamSyn : this.foeSyn;
    amount *= mod.damage * scale * (source.rage > 0 ? 1.18 : 1);
    if (def.auto && source.side === 0 && this.run.relics.includes("fangs"))
      amount *= 1.18;
    if (syn.tide >= 4) amount *= 0.85;
    if (target.fortify > 0) amount *= 0.88;
    const dodge = target.dodge + (target.evade > 0 ? 0.25 : 0);
    if (this.random() < dodge) {
      target.dodgeAnim = 0.3;
      this.effect(target.x, target.y - 40, "DODGE", "#b5dadd");
      this.metrics.dodges++;
      this.fx("afterimage", target.x, target.y, "#cfdfd4", { r: 30 });
      return 0;
    }
    const crit = this.random() < 0.045 + mod.crit;
    if (crit) {
      amount *= 1.65;
      this.metrics.crits++;
    }
    const shield = Math.min(target.shield, amount);
    target.shield -= shield;
    amount = Math.round(amount - shield);
    target.hp = Math.max(0, target.hp - amount);
    target.flash = 0.16;
    target.hitAnim = 0.22;
    source.damage += amount;
    this.metrics.damage += amount;
    const color = def.color || ELEMENTS[BY_ID[source.id].element].color;
    this.effect(
      target.x + (this.random() - 0.5) * 16,
      target.y - 45,
      amount > 0 ? `${crit ? "✦ " : ""}${amount}` : "BLOCK",
      crit ? "#fff0b3" : target.side === 0 ? "#eeb6a7" : "#f3e5c7",
    );
    this.burst(target.x, target.y - 10, color, crit ? 11 : 5, crit ? 110 : 60);
    this.fx("impact", target.x, target.y - 8, color, { r: crit ? 35 : 23 });
    if (crit || !def.auto) this.shake = Math.min(5, this.shake + 1.3);
    const ownSyn = source.side === 0 ? this.teamSyn : this.foeSyn;
    let steal =
      (ownSyn.void >= 2 ? 0.12 : 0) + (def.lifesteal || 0) + mod.lifesteal;
    if (
      def.auto &&
      source.side === 0 &&
      this.run.relics.includes("fangs") &&
      BY_ID[source.id].role === "Striker"
    )
      steal += 0.08;
    if (steal) this.heal(source, amount * steal, source, null, false);
    if (
      (ownSyn.ember >= 2 && BY_ID[source.id].element === "ember") ||
      def.burn ||
      mod.burn
    )
      target.burn = Math.max(
        target.burn,
        def.burn || 0,
        mod.burn || 0,
        ownSyn.ember >= 2 ? 2 : 0,
      );
    if (def.poison || mod.poison)
      target.poison = Math.max(target.poison, def.poison || 0, mod.poison || 0);
    if (def.root || mod.root)
      target.root = Math.max(target.root, def.root || 0, mod.root || 0);
    if (def.slow) target.slow = Math.max(target.slow, def.slow);
    if (def.knockback) {
      const dx = target.x - source.x,
        dy = target.y - source.y,
        d = Math.hypot(dx, dy) || 1;
      target.x = clamp(target.x + (dx / d) * def.knockback, 55, 945);
      target.y = clamp(target.y + (dy / d) * def.knockback, 90, 460);
    }
    if (ownSyn.void >= 4 && target.hp < target.maxHp * 0.2) target.hp = 0;
    if (proc && mod.explosion) {
      this.hazards.push({
        x: target.x,
        y: target.y,
        r: 55,
        ttl: 0.35,
        total: 0.35,
        source,
        skillId,
        power: mod.explosion,
        scale,
        proc: false,
        color: "#ffbe78",
      });
    }
    if (target.hp === 0) {
      source.kills++;
      this.say(
        `${BY_ID[source.id].name} defeats ${target.bossName || BY_ID[target.id].name}.`,
      );
      this.effect(target.x, target.y - 60, "K.O.", "#edb997");
      this.fx("defeat", target.x, target.y, color, {
        r: 65,
        ttl: 0.85,
        max: 0.85,
      });
      this.burst(target.x, target.y, color, 20, 120);
    }
    return amount;
  }
  supportedUse(u, id, echo) {
    if (echo) return;
    const m = linkedSupport(u, id),
      def = SKILLS[id];
    if (m.shield)
      u.shield = Math.min(u.maxHp * 0.7, u.shield + (def.auto ? 10 : m.shield));
    if (m.bloom)
      this.living(u.side)
        .filter((f) => distance(f, u) < 180)
        .forEach((f) => this.heal(f, def.auto ? 5 : m.bloom, u, id));
    if (m.evade) u.evade = Math.max(u.evade, def.auto ? 0.35 : m.evade);
    if (m.movement > 1) u.movementBuff = def.auto ? 0.5 : 2;
    if (m.fortify) u.fortify = m.fortify;
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
  projectile(u, t, id, power, scale = 1, proc = true) {
    if (!t) return;
    const def = SKILLS[id],
      color = def.color || ELEMENTS[BY_ID[u.id].element].color;
    this.projectiles.push({
      x: u.x,
      y: u.y - 15,
      prevX: u.x,
      prevY: u.y - 15,
      target: t,
      source: u,
      skillId: id,
      power,
      scale,
      proc,
      color,
      speed: def.auto ? 410 : 535,
      skill: !def.auto,
      trail: [],
    });
  }
  zone(u, t, id, power, radius, delay, scale = 1) {
    const def = SKILLS[id],
      m = linkedSupport(u, id);
    this.hazards.push({
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
      r: radius * m.area,
      ttl: delay,
      max: delay,
    });
  }
  cast(u, id, target, scale = 1, echo = false) {
    if (u.hp <= 0) return;
    const def = SKILLS[id],
      m = linkedSupport(u, id),
      auto = def.auto,
      t = target?.hp > 0 ? target : this.target(u);
    if (!t) return;
    this.supportedUse(u, id, echo);
    const shieldScale =
      scale *
      (evolutionStage(u) && u.evolutionPath === "warden"
        ? evolutionStage(u) === 2
          ? 1.5
          : 1.25
        : 1);
    const friends = this.living(u.side),
      enemies = this.living(1 - u.side),
      color = def.color || ELEMENTS[BY_ID[u.id].element].color;
    u.attackAnim = auto ? 0.32 : 0.2;
    if (!auto) {
      u.castAnim = 0.65;
      this.metrics.skills++;
      this.say(`${creatureName(u)} uses ${def.name}${echo ? " · Echo" : ""}.`);
      this.effect(u.x, u.y - 67, def.name, color);
      this.fx("cast", u.x, u.y, color, { r: 45, ttl: 0.65, max: 0.65 });
    }
    const power = (def.power || 1) * u.atk;
    const weakest = friends
      .slice()
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    if (auto) {
      if (["bolt", "chain"].includes(def.kind)) {
        this.projectile(u, t, id, def.power, scale);
        if (def.kind === "chain" || m.targets) {
          enemies
            .filter((e) => e !== t)
            .sort((a, b) => distance(a, t) - distance(b, t))
            .slice(0, (def.targets || 1) - 1 + m.targets)
            .forEach((e) => this.projectile(u, e, id, def.power * 0.6, scale));
        }
      } else if (def.kind === "beam") {
        this.fx("beam", u.x, u.y - 10, color, {
          tx: t.x,
          ty: t.y - 12,
          width: 3,
          ttl: 0.25,
          max: 0.25,
        });
        this.hit(t, power, u, id, scale);
        if (def.pierce || m.targets)
          enemies
            .filter((e) => e !== t && lineDistance(e, u, t) < 30)
            .slice(0, 2 + m.targets)
            .forEach((e) => this.hit(e, power * 0.6, u, id, scale));
      } else {
        this.fx("slash", t.x, t.y - 8, color, {
          face: u.face,
          r: 32,
          ttl: 0.22,
          max: 0.22,
        });
        this.hit(t, power, u, id, scale);
        if (def.kind === "double")
          this.queue.push({
            ttl: 0.13,
            source: u,
            target: t,
            skillId: id,
            scale: scale * (def.hits - 1),
            echo: true,
            single: true,
          });
        if (def.radius || m.targets) {
          enemies
            .filter(
              (e) => e !== t && distance(e, t) < (def.radius || 70) * m.area,
            )
            .slice(0, 1 + m.targets)
            .forEach((e) =>
              this.hit(
                e,
                power * (def.kind === "cleave" ? 0.6 : 0.4),
                u,
                id,
                scale,
              ),
            );
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
          f.burn = 0;
          f.poison = 0;
        }
        this.fx("beam", u.x, u.y - 10, color, {
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
        if (def.shield)
          f.shield = Math.min(
            f.maxHp * 0.7,
            f.shield + def.shield * shieldScale,
          );
        if (def.haste) f.haste = def.haste;
      });
      this.fx("ring", u.x, u.y, color, { r: 220 * m.area, ttl: 0.8, max: 0.8 });
    } else if (def.kind === "shield") {
      friends
        .filter((f) => def.all || distance(f, u) < def.radius * m.area)
        .forEach((f) => {
          f.shield = Math.min(
            f.maxHp * 0.7,
            f.shield + def.shield * shieldScale,
          );
          this.fx("shield", f.x, f.y, color, { r: 38, ttl: 0.9, max: 0.9 });
        });
      if (def.taunt) u.taunt = def.taunt;
      if (def.slow)
        enemies
          .filter((e) => distance(e, u) < 180 * m.area)
          .forEach((e) => (e.slow = def.slow));
    } else if (["dash", "blink", "charge"].includes(def.kind)) {
      let victim = t;
      if (def.backline)
        victim = enemies.find((e) => BY_ID[e.id].range > 100) || t;
      const oldx = u.x,
        oldy = u.y;
      u.x = clamp(victim.x - u.face * 35, 55, 945);
      u.y = clamp(victim.y + 14, 90, 460);
      this.fx("dash", oldx, oldy, color, {
        tx: u.x,
        ty: u.y,
        r: 25,
        ttl: 0.45,
        max: 0.45,
      });
      this.hit(victim, power, u, id, scale);
      this.fx("slash", victim.x, victim.y, color, {
        face: u.face,
        r: 55,
        ttl: 0.3,
        max: 0.3,
      });
      if (def.hits > 1)
        this.queue.push({
          ttl: 0.2,
          source: u,
          target: victim,
          skillId: id,
          scale: scale * (def.hits - 1),
          echo: true,
          single: true,
        });
      if (def.evade) u.evade = def.evade;
      if (def.kind === "charge" || m.targets) {
        enemies
          .filter(
            (e) =>
              e !== victim && distance(e, victim) < (def.radius || 95) * m.area,
          )
          .slice(0, def.radius ? 6 : m.targets)
          .forEach((e) => this.hit(e, power * 0.65, u, id, scale));
        this.fx("ring", victim.x, victim.y, color, {
          r: (def.radius || 95) * m.area,
          ttl: 0.6,
          max: 0.6,
        });
      }
    } else if (["blast", "volley", "breath"].includes(def.kind)) {
      this.zone(u, t, id, def.power, def.radius, def.delay || 0.7, scale);
      if (def.kind === "breath")
        this.fx("breath", u.x, u.y - 14, color, {
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
      this.fx("beam", u.x, u.y - 13, color, {
        tx: t.x,
        ty: t.y - 13,
        width: 9,
        ttl: 0.45,
        max: 0.45,
      });
      this.hit(t, power, u, id, scale);
      enemies
        .filter(
          (e) =>
            e !== t &&
            (def.pierce ? lineDistance(e, u, t) < 40 : distance(e, t) < 80),
        )
        .slice(0, def.pierce ? 6 : m.targets)
        .forEach((e) => this.hit(e, power * 0.75, u, id, scale));
    } else if (def.kind === "chain") {
      const targets = enemies
        .sort((a, b) => distance(a, t) - distance(b, t))
        .slice(0, def.targets + m.targets);
      let from = u;
      targets.forEach((e) => {
        this.fx("lightning", from.x, from.y - 12, color, {
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
      this.fx("ring", u.x, u.y, color, {
        r: 60 * m.area,
        ttl: 0.65,
        max: 0.65,
      });
    } else if (def.kind === "drain") {
      enemies
        .sort((a, b) => distance(a, u) - distance(b, u))
        .slice(0, def.targets + m.targets)
        .forEach((e) => {
          this.fx("beam", e.x, e.y - 10, color, {
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
      this.fx("ring", u.x, u.y, color, {
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
      this.fx("ring", u.x, u.y, color, { r: 260 * m.area, ttl: 1, max: 1 });
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
            e.x += (u.x - e.x) * 0.25;
            e.y += (u.y - e.y) * 0.25;
          }
          this.hit(e, power, u, id, scale);
        });
      this.fx("ring", u.x, u.y, color, {
        r: def.radius * m.area,
        ttl: 0.8,
        max: 0.8,
      });
    }
  }
  step(dt) {
    if (this.done) return;
    dt = Math.min(dt, 0.1);
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 9);
    this.effects = this.effects.filter((e) => (e.ttl -= dt) > 0);
    for (const p of this.particles) {
      p.ttl -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
    }
    this.particles = this.particles.filter((p) => p.ttl > 0);
    for (const u of this.units) {
      if (u.hp <= 0) {
        u.deathTime += dt;
        u.motion = 0;
        continue;
      }
      for (const k of [
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
      ])
        u[k] = Math.max(0, u[k] - dt);
      if (u.burn > 0) u.hp = Math.max(0, u.hp - dt * 7);
      if (u.poison > 0) u.hp = Math.max(0, u.hp - dt * 5);
      const syn = u.side === 0 ? this.teamSyn : this.foeSyn;
      if (syn.grove >= 2 && u.hp > 0)
        u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.01 * dt);
      u.attackTimer -= dt * (u.haste > 0 ? 1.4 : 1);
      for (const cooldown of Object.values(u.cooldowns))
        cooldown.remaining -= dt;
      if (u.boss && u.hp < u.maxHp * 0.5 && !u.enraged) {
        u.enraged = true;
        u.atk = Math.round(u.atk * 1.15);
        Object.values(u.cooldowns).forEach((c) => {
          c.total *= 0.9;
          c.remaining = Math.min(c.remaining, 1.5);
        });
        u.bossPulse = 4;
        this.say(`${u.bossName} enters phase II. The arena trembles.`);
        this.effect(u.x, u.y - 85, "PHASE II", "#f0c393");
        this.fx("ring", u.x, u.y, ELEMENTS[BY_ID[u.id].element].color, {
          r: 230,
          ttl: 1.3,
          max: 1.3,
        });
        this.burst(u.x, u.y, "#dfc5ef", 35, 180);
        this.shake = 5;
      }
      if (u.enraged) {
        u.bossPulse -= dt;
        if (u.bossPulse <= 0) {
          u.bossPulse = 8;
          for (const victim of this.living(1 - u.side).slice(0, 2))
            this.zone(u, victim, u.id, 1.6, 65, 1.2);
        }
      }
      const t = this.target(u);
      if (!t) continue;
      u.face = t.x >= u.x ? 1 : -1;
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
          h.source.side !== u.side && distance(h, u) < h.r + 16 && h.ttl > 0.16,
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
      for (const f of this.living(u.side)) {
        if (f === u) continue;
        const d = distance(f, u);
        if (d < 66 && d > 0) {
          const push = ((66 - d) / 66) * 0.95;
          vx += ((u.x - f.x) / d) * push;
          vy += ((u.y - f.y) / d) * push;
        }
      }
      u.px = u.x;
      u.py = u.y;
      if (u.root <= 0) {
        const movement =
          u.speed * (u.slow > 0 ? 0.5 : 1) * (u.movementBuff > 0 ? 1.3 : 1);
        u.x = clamp(u.x + vx * movement * dt, 55, 945);
        u.y = clamp(u.y + vy * movement * dt, 90, 460);
      }
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
        (id) => u.cooldowns[id].remaining <= 0,
      );
      if (ready && u.dodgeLock <= 0 && u.hp > 0) {
        const cd = u.cooldowns[ready];
        cd.remaining = cd.total;
        cd.casts++;
        this.cast(u, ready, t);
      }
      u.skillTimer = u.cooldowns[u.id].remaining;
      u.cd = u.cooldowns[u.id].total;
      if (
        u.attackTimer <= 0 &&
        dist <= u.range + 12 &&
        u.dodgeLock <= 0 &&
        u.hp > 0
      ) {
        u.attackTimer =
          (sp.role === "Guardian" ? 1.55 : 1.3) *
          linkedSupport(u, u.loadout.auto).attackSpeed;
        this.cast(u, u.loadout.auto, t);
      }
    }
    for (const q of this.queue) {
      q.ttl -= dt;
      if (q.ttl <= 0 && q.source.hp > 0) {
        if (q.single) {
          if (q.target?.hp > 0)
            this.hit(
              q.target,
              q.source.atk * SKILLS[q.skillId].power,
              q.source,
              q.skillId,
              q.scale,
            );
        } else if (q.projectile)
          this.projectile(q.source, q.target, q.skillId, q.power, q.scale);
        else this.cast(q.source, q.skillId, q.target, q.scale, true);
      }
    }
    this.queue = this.queue.filter((q) => q.ttl > 0);
    for (const p of this.projectiles) {
      if (p.target.hp <= 0) {
        p.dead = true;
        continue;
      }
      p.prevX = p.x;
      p.prevY = p.y;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 7) p.trail.shift();
      const dx = p.target.x - p.x,
        dy = p.target.y - 14 - p.y,
        d = Math.hypot(dx, dy);
      if (d < p.speed * dt + 8) {
        this.hit(
          p.target,
          p.source.atk * p.power,
          p.source,
          p.skillId,
          p.scale,
          p.proc,
        );
        const def = SKILLS[p.skillId];
        if (def.radius)
          this.living(1 - p.source.side)
            .filter(
              (e) =>
                e !== p.target &&
                distance(e, p.target) <
                  def.radius * linkedSupport(p.source, p.skillId).area,
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
        p.x += (dx / d) * p.speed * dt;
        p.y += (dy / d) * p.speed * dt;
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    for (const h of this.hazards) {
      h.ttl -= dt;
      if (h.ttl <= 0) {
        const targets = this.living(1 - h.source.side).filter(
          (e) => distance(e, h) < h.r,
        );
        targets.forEach((e) =>
          this.hit(
            e,
            h.source.atk * h.power,
            h.source,
            h.skillId,
            h.scale,
            h.proc,
          ),
        );
        this.fx("nova", h.x, h.y, h.color, { r: h.r, ttl: 0.65, max: 0.65 });
        this.burst(h.x, h.y, h.color, 18, 130);
        this.shake = Math.min(5, this.shake + 2);
        if (!targets.length) this.metrics.dodges++;
      }
    }
    this.hazards = this.hazards.filter((h) => h.ttl > 0);
    if (!this.living(0).length || !this.living(1).length || this.time >= 90) {
      this.done = true;
      const a = this.living(0),
        b = this.living(1);
      this.winner = !a.length
        ? 1
        : !b.length
          ? 0
          : a.reduce((s, u) => s + u.hp / u.maxHp, 0) / this.run.team.length >=
              b.reduce((s, u) => s + u.hp / u.maxHp, 0) /
                (this.units.length - this.run.team.length)
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
