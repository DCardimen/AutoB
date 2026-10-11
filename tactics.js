// Shared design data. Rules, scouting, tooltips, and reports use the same definitions.
export const POLICIES = {
  adaptive: {
    name: "Adaptive",
    desc: "Heal only wounded allies; save control for threats; aim areas at clusters.",
  },
  healer: {
    name: "Hunt healers",
    desc: "Prioritize enemy Supports, then Rangers. Taunts still draw attention.",
  },
  breaker: {
    name: "Break armor",
    desc: "Focus shielded enemies and bosses. Useful with shield-breaking supports.",
  },
  guardian: {
    name: "Protect",
    desc: "Intercept enemies threatening your weakest ally; reserve barriers for danger.",
  },
  execute: {
    name: "Finish wounded",
    desc: "Focus the lowest-health enemy and use offensive skills immediately.",
  },
};
export const TRAITS = {
  pursuit: {
    name: "Blood trail",
    desc: "Deal 30% more damage to burning enemies; signature hits extend burn by 2s.",
  },
  intercept: {
    name: "Living cover",
    desc: "Intercept 22% of damage to an ally within 130 units, while above 35% health.",
  },
  cleanser: {
    name: "Springwater",
    desc: "Healing cleanses burn and poison; cleansing grants 25 shield.",
  },
  conductor: {
    name: "Conductive wings",
    desc: "Hits on rooted or slowed enemies chain 35% damage to another enemy.",
  },
  ram: {
    name: "Momentum",
    desc: "Signature hits knock enemies back 55 units; against roots they deal 30% more damage.",
  },
  gardener: {
    name: "Pollination",
    desc: "Every third heal plants 5s of regeneration on its recipient.",
  },
  mirror: {
    name: "Ice mirror",
    desc: "While shielded, absorb 15% less damage and reflect 12% of hits.",
  },
  pin: {
    name: "Thorn marks",
    desc: "Signature hits expose targets for 5s: all allied hits deal 18% more damage.",
  },
  assassin: {
    name: "Silent hunter",
    desc: "Deal 30% more damage to Supports; a kill refreshes 45% of the signature cooldown.",
  },
  counter: {
    name: "Afterimage",
    desc: "Dodging refreshes 1s of the signature cooldown and launches a 60% attack counterbolt.",
  },
  furnace: {
    name: "Heat furnace",
    desc: "Every third signature hit detonates existing burn for 90% attack area damage.",
  },
  overflow: {
    name: "Moon reservoir",
    desc: "35% of excess healing becomes shield, capped at 45% recipient health.",
  },
  implosion: {
    name: "Vacuum",
    desc: "Signature hits pull nearby enemies toward the impact and slow them for 2s.",
  },
  marksman: {
    name: "High ground",
    desc: "Hits deal 22% more damage beyond 230 units; standing too close loses this advantage.",
  },
  parasite: {
    name: "Dream harvest",
    desc: "Hits on poisoned enemies heal the weakest ally for 18% damage dealt.",
  },
  retaliation: {
    name: "Spiked carapace",
    desc: "Reflect 18% of incoming hits while shielded; reflected damage cannot reflect again.",
  },
  symbiosis: {
    name: "Ancient roots",
    desc: "Heal nearby allies for 2% max health each second while above half health.",
  },
  duelist: {
    name: "Isolation",
    desc: "Deal 28% more damage to enemies without a teammate within 140 units.",
  },
  siphon: {
    name: "Shield thief",
    desc: "Steal up to 12 shield on each hit before dealing damage.",
  },
  piercer: {
    name: "Pressure fracture",
    desc: "Hits ignore 35% of shields. A Common shield-breaker stays useful against rare foes.",
  },
  pack: {
    name: "Pack instinct",
    desc: "Auto hits expose their target for 2s; nearby allied Strikers gain 12% attack speed.",
  },
  poisoner: {
    name: "Venom reservoir",
    desc: "Each hit on poison extends poison by 1s and deals 10 additional damage.",
  },
  medic: {
    name: "Emergency care",
    desc: "Heal targets below 35% health for 45% more; smaller heals elsewhere.",
  },
  battery: {
    name: "Charge relay",
    desc: "Every fourth auto hit refreshes 1s of nearby allied signature cooldowns.",
  },
};
const groups = {
  pursuit: "cinderfox ashpup glassfang",
  intercept: "mossguard coalcrab barkbeetle onyxarmadillo",
  cleanser: "brookfin dewotter pearlsquid",
  conductor: "voltwing arcscarab lumenjelly skyray",
  ram: "pyrehorn kilnram thunderram dynamoar",
  gardener: "bloomkin cloverimp pipthorn orchimantis",
  mirror: "glacier mirrormanta brineclam",
  pin: "thornstag reedcobra canopyowl",
  assassin: "nightmaw gloomkit nullraptor",
  counter: "sparkhare zipmouse cloudlynx",
  furnace: "solwyrm wickmoth saffrake",
  overflow: "lunacrest leviacrown",
  implosion: "astralisk gravitan riftmoth",
  marksman: "tempest thunderroc flarefin",
  parasite: "duskcap dreamslug veilspider",
  retaliation: "flintback floebear trenchfang",
  symbiosis: "elderoot worldtortoise mycobear",
  duelist: "starborn riptalon",
  siphon: "abyssal eclipsaur",
  piercer: "coralisk",
  pack: "phoenix",
};
export const CREATURE_TRAITS = Object.fromEntries(
  Object.entries(groups).flatMap(([trait, ids]) =>
    ids.split(" ").map((id) => [id, trait]),
  ),
);
Object.assign(CREATURE_TRAITS, {
  pipthorn: "pack",
  orchimantis: "assassin",
  dewotter: "counter",
  trenchfang: "duelist",
  leviacrown: "marksman",
});
export function traitFor(c) {
  return TRAITS[CREATURE_TRAITS[c.id] || "battery"];
}
export function evolutionMechanic(c, role, path = c.evolutionPath) {
  return (
    {
      "Guardian-wild":
        "Ravager: signature casts grant 5s of 30% retaliation; every hit while shielded exposes its target.",
      "Guardian-warden":
        "Sentinel: intercept 25% of nearby allied damage; signature casts cleanse nearby allies.",
      "Striker-wild":
        "Executioner: killing blows restore 20% health and refresh 55% of signature cooldown.",
      "Striker-warden":
        "Phantom: signature casts grant evasion; successful dodges counterattack for 75% attack.",
      "Ranger-wild":
        "Artillery: signature casts launch an additional 65% attack projectile at a different enemy.",
      "Ranger-warden":
        "Trapper: signature casts leave a delayed binding trap beneath their target; autos expose rooted foes.",
      "Support-wild":
        "Hexweaver: healing also sends a 45% attack curse that weakens an enemy's damage for 3s.",
      "Support-warden":
        "Lifekeeper: half of excess healing becomes shield; signature casts give nearby allies 4s regeneration.",
    }[role + "-" + path] || "Choose an evolution to reshape your signature."
  );
}
export const ARCHETYPES = [
  {
    id: "pack",
    name: "Hunting pack",
    roles: ["Striker", "Striker", "Guardian", "Ranger", "Striker", "Support"],
    desc: "Predators focus wounded allies. Frontline cover and emergency healing buy time.",
    counter: "Protect your healer; use roots and interceptors.",
  },
  {
    id: "bastion",
    name: "Shield wall",
    roles: ["Guardian", "Guardian", "Support", "Ranger", "Guardian", "Ranger"],
    desc: "Guardians begin with shields and defend their healer.",
    counter:
      "Shieldbreaker, Pressure Fracture, or healer hunting defeats their defenses.",
  },
  {
    id: "artillery",
    name: "Storm artillery",
    roles: ["Ranger", "Ranger", "Guardian", "Support", "Ranger", "Striker"],
    desc: "Long-range attackers punish a clustered formation.",
    counter: "Spread your rows and send an assassin to the backline.",
  },
  {
    id: "garden",
    name: "Regrowth circle",
    roles: ["Support", "Guardian", "Support", "Ranger", "Striker", "Guardian"],
    desc: "Two healers sustain a protected frontline.",
    counter:
      "Withering cuts healing; focus a healer instead of splitting damage.",
  },
  {
    id: "venom",
    name: "Venom choir",
    roles: ["Support", "Ranger", "Striker", "Guardian", "Ranger", "Support"],
    desc: "Attacks apply poison. A slow battle favors the choir.",
    counter: "Bring Springwater, Purification, or a fast burst composition.",
  },
  {
    id: "duelists",
    name: "Rift duelists",
    roles: ["Striker", "Ranger", "Striker", "Guardian", "Support", "Striker"],
    desc: "Mobile hunters prefer isolated targets and exposed backlines.",
    counter:
      "Keep a protector beside your support and avoid isolated deployment.",
  },
  {
    id: "swarm",
    name: "Dense swarm",
    roles: ["Striker", "Striker", "Ranger", "Support", "Striker", "Guardian"],
    desc: "A compact, faster swarm overwhelms single-target builds.",
    counter: "Chain, explosions, and area roots punish their clustering.",
  },
  {
    id: "wardens",
    name: "Ancient wardens",
    roles: ["Guardian", "Support", "Ranger", "Guardian", "Striker", "Ranger"],
    desc: "Wardens weaken enemy damage and protect their most injured ally.",
    counter: "Expose targets, split projectiles, and build sustained damage.",
  },
];
export const WEATHER = [
  { id: "clear", name: "Clear skies", desc: "No environmental modifier." },
  {
    id: "pollen",
    name: "Spore wind",
    desc: "Healing is 15% stronger for both sides; poison lasts 1s longer.",
  },
  {
    id: "rain",
    name: "Monsoon",
    desc: "Burn lasts half as long; lightning against slowed targets deals 20% more damage.",
  },
  {
    id: "cinders",
    name: "Solar flare",
    desc: "Burn damage is 40% stronger for both sides. Cleansing becomes valuable.",
  },
  {
    id: "magnet",
    name: "Magnetic storm",
    desc: "Every 10s a marked region erupts. Avoid it or shield through it.",
  },
  {
    id: "void",
    name: "Thin reality",
    desc: "Cooldowns recover 10% faster, but shields are 20% weaker on both sides.",
  },
];
export const BOSS_GUIDES = [
  {
    name: "The Hollow Crown",
    phases: ["Rootbound", "The hungry grove", "Last bloom"],
    desc: "Living roots bind the front. Phase II heals the Crown while its retinue lives; phase III marks a clustered group.",
    counter:
      "Kill its healers first, cleanse roots, and spread against the final bloom.",
  },
  {
    name: "The Sun Eater",
    phases: ["Kindling", "Solar furnace", "Supernova"],
    desc: "Telegraphed flames burn the backline. Phase II absorbs burn to shield itself; phase III lays three delayed eruptions.",
    counter:
      "Bring cleanses and shield-breaking; deploy across rows and avoid feeding burn.",
  },
  {
    name: "The Last Colossus",
    phases: ["Gravity shell", "Event horizon", "Singularity"],
    desc: "The Colossus periodically gathers enemies into gravity wells. Phase II exposes isolated allies; phase III detonates a central well.",
    counter:
      "Use mobility, reserve barriers for wells, and preserve an interceptor near your support.",
  },
];
export const DIFFICULTIES = {
  story: {
    name: "Explorer",
    desc: "Learn combinations: enemies have 20% less health and damage. Unlocks Chaos on victory.",
    health: 0.8,
    attack: 0.8,
  },
  standard: {
    name: "Expedition",
    desc: "The intended campaign. Scout enemies and adapt your six companions.",
    health: 1,
    attack: 1,
  },
  veteran: {
    name: "Veteran",
    desc: "Enemies gain 15% health and 12% damage; elites carry extra shields.",
    health: 1.15,
    attack: 1.12,
  },
  chaos: {
    name: "Chaos",
    desc: "Twenty cumulative challenge tiers. Clear a tier to unlock the next.",
    health: 1,
    attack: 1,
  },
};
export const CHAOS_TIERS = [
  "Elite enemies gain 12% health.",
  "Enemy auto-attacks deal 8% more damage.",
  "Begin with 130 gold instead of 160.",
  "Poison encounters inflict an additional second of poison.",
  "Bosses gain 15% health.",
  "Shop prices rise by 10%.",
  "Start with 4 capture orbs instead of 5.",
  "Elite signatures recharge 10% faster.",
  "Enemy Guardians begin with 40 shield.",
  "Boss phase II begins at 65% health.",
  "All enemies gain 10% health.",
  "Rest training grants 30 EXP instead of 40.",
  "Enemy healers cleanse burn and poison when healing.",
  "Begin with two expedition lives; rests can still restore three.",
  "Magnetic storms arrive every 7s instead of 10s.",
  "Bosses gain 12% attack.",
  "Battle gold rewards are 12% lower.",
  "Boss phase III begins at 40% health.",
  "Elites begin with 3s evasion; expose or outlast their opening.",
  "A boss's living retinue grants it 18% damage reduction.",
];
export function chaosLevel(run) {
  return run.difficulty === "chaos"
    ? Math.max(1, Math.min(20, Number(run.chaos) || 1))
    : 0;
}
export function shopPrice(run, price) {
  return Math.ceil((price * (chaosLevel(run) >= 6 ? 11 : 10)) / 10);
}
export function unlockChaos(profile, run) {
  profile.chaosUnlocked = Math.max(
    profile.chaosUnlocked || 0,
    Math.min(20, chaosLevel(run) + 1),
  );
  if (chaosLevel(run))
    profile.chaosCleared = Math.max(profile.chaosCleared || 0, chaosLevel(run));
}
export function starterPoints(rarity, bond = 0) {
  const cost = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 6 }[
    rarity
  ];
  return Math.max(1, cost - (bond >= 5 ? (rarity === "Legendary" ? 2 : 1) : 0));
}
export function recordBond(profile, id) {
  profile.bonds ||= {};
  profile.bonds[id] = Math.min(5, (profile.bonds[id] || 0) + 1);
  return profile.bonds[id];
}
export const NEW_GEMS = [
  [
    "fracture-gem",
    "Shieldbreaker",
    "▱",
    80,
    "Supported hits bypass 65% of shields and remove 20 additional shield; deal 12% less raw damage.",
    { pierce: 0.65, shred: 20, damage: 0.88 },
  ],
  [
    "fork-gem",
    "Fork",
    "⋔",
    85,
    "Supported hits bounce to two other targets at 40% power. Primary damage is 15% lower.",
    { fork: 2, damage: 0.85 },
  ],
  [
    "frost-gem",
    "Cryostasis",
    "❄",
    65,
    "Supported hits slow for 3s. Hitting burn consumes it for 80% attack steam damage; damage is 10% lower.",
    { chill: 3, steam: 0.8, damage: 0.9 },
  ],
  [
    "venom-gem",
    "Withering",
    "✺",
    70,
    "Supported hits cut enemy healing by 55% for 4s; cooldown is 10% longer.",
    { wither: 4, cooldown: 1.1 },
  ],
  [
    "cleanse-gem",
    "Purification",
    "✧",
    65,
    "Supported casts cleanse burn, poison, and roots from the weakest ally. Damage is 10% lower.",
    { cleanse: 1, damage: 0.9 },
  ],
  [
    "reservoir-gem",
    "Reservoir",
    "☾",
    80,
    "Supported healing converts 60% of excess healing into shield; healing is 15% lower.",
    { overheal: 0.6, healing: 0.85 },
  ],
  [
    "beacon-gem",
    "Healing Beacon",
    "✚",
    85,
    "Supported casts create a 4s healing field at the caster. Allies within 130 units recover 3% max HP per second; cooldown is 20% longer.",
    { beacon: 4, cooldown: 1.2 },
  ],
  [
    "hex-gem",
    "Enfeeble",
    "☽",
    70,
    "Supported hits reduce enemy damage by 25% for 4s; damage is 10% lower.",
    { weaken: 4, damage: 0.9 },
  ],
  [
    "execute-gem",
    "Cull",
    "⌁",
    85,
    "Supported hits deal 60% more damage below 30% target health; damage elsewhere is 12% lower.",
    { execute: 0.6, damage: 0.88 },
  ],
  [
    "trap-gem",
    "Aftershock",
    "◎",
    80,
    "Supported casts leave a delayed 80% attack trap that roots for 2s; cooldown is 15% longer.",
    { trap: 0.8, cooldown: 1.15 },
  ],
  [
    "siphon-gem",
    "Shield Siphon",
    "◈",
    75,
    "Supported hits steal up to 25 enemy shield before impact. Damage is 10% lower.",
    { siphon: 25, damage: 0.9 },
  ],
  [
    "expose-gem",
    "Vulnerability",
    "◇",
    70,
    "Supported hits expose a target for 5s, increasing all allied damage against it by 18%; cooldown is 12% longer.",
    { expose: 5, cooldown: 1.12 },
  ],
  [
    "blood-gem",
    "Blood Price",
    "♥",
    65,
    "Supported casts consume 5% current HP for 45% more damage. Healing is 25% lower; cannot kill the caster.",
    { blood: 0.05, damage: 1.45, healing: 0.75 },
  ],
  [
    "relay-gem",
    "Resonance",
    "∞",
    90,
    "Every supported cooldown cast refreshes nearby allied signatures by 0.8s. Its own cooldown is 20% longer.",
    { relay: 0.8, cooldown: 1.2 },
  ],
  [
    "detonate-gem",
    "Plagueburst",
    "☣",
    85,
    "Supported hits on poisoned targets detonate 60% attack nearby; poison is consumed and raw damage is 15% lower.",
    { detonate: 0.6, damage: 0.85 },
  ],
  [
    "bodyguard-gem",
    "Soul Link",
    "⚑",
    80,
    "Supported casts link the weakest ally for 4s, intercepting 30% of their damage within 200 units. Cooldown is 15% longer.",
    { guard: 4, cooldown: 1.15 },
  ],
  [
    "recoil-gem",
    "Repulsion",
    "↔",
    60,
    "Supported hits knock targets back 35 units. Damage is 8% lower.",
    { knockback: 35, damage: 0.92 },
  ],
  [
    "renewal-gem",
    "Renewal",
    "❋",
    75,
    "Supported casts grant the weakest ally 5s regeneration. Healing is 10% lower.",
    { regen: 5, healing: 0.9 },
  ],
].map(([id, name, icon, cost, desc, support], i) => ({
  id,
  name,
  icon,
  cost,
  desc,
  support,
  color: ["#a6d8d8", "#dac0f4", "#e6ba86"][i % 3],
}));
export const NEW_RELICS = [
  [
    "blood-pact",
    "Blood Covenant",
    "♥",
    125,
    "Allies deal 22% more damage, but healing is 25% weaker.",
  ],
  [
    "mercy",
    "Mercy Engine",
    "✚",
    120,
    "Every ally's first fall below 30% health triggers 20% max-health healing. Once per creature.",
  ],
  [
    "storm-relay",
    "Storm Relay",
    "ϟ",
    140,
    "Every allied dodge refreshes nearby allied signatures by 0.7s; shields are 15% weaker.",
  ],
  [
    "thorn-crown",
    "Thorn Crown",
    "♜",
    125,
    "Shielded Guardians reflect 22% of incoming hit damage; their movement is 10% slower.",
  ],
  [
    "glass-cannon",
    "Glass Constellation",
    "◇",
    135,
    "Rangers deal 30% more damage at long range, but have 15% less health.",
  ],
  [
    "spore-network",
    "Spore Network",
    "❋",
    125,
    "Damage to poisoned enemies heals your weakest ally for 15% of damage; direct healing is 10% weaker.",
  ],
  [
    "execution-bell",
    "Execution Bell",
    "⌁",
    130,
    "An allied kill refreshes every living ally's signatures by 0.7s.",
  ],
  [
    "sanctuary",
    "Sanctuary Loom",
    "⚑",
    115,
    "Allies within 120 units of a Support take 12% less hit damage. Clustering risks enemy areas.",
  ],
  [
    "overgrowth",
    "Overgrowth Vessel",
    "☾",
    135,
    "Half of excess allied healing becomes shield, but cooldowns recharge 8% slower.",
  ],
  [
    "hatchery",
    "Traveler's Hatchery",
    "◈",
    100,
    "A successful capture grants 35 EXP to the active team and refunds 20 gold.",
  ],
  [
    "salvage",
    "Salvager's Compass",
    "☼",
    100,
    "Elites grant an additional support gem; normal battle gold is 10% lower.",
  ],
  [
    "unity",
    "Prismatic Accord",
    "∞",
    145,
    "Five different elements grant 20% attack and 15% max health. Duplicate elements lose this bonus.",
  ],
  [
    "last-light",
    "Last Light",
    "✦",
    140,
    "Once per battle, revive your first fallen ally at 30% health and 2s evasion. Team healing is 10% lower.",
  ],
  [
    "frostfire",
    "Frostfire Crucible",
    "❄",
    120,
    "Hits on enemies that are both burning and slowed detonate steam for 50% attack, consuming burn.",
  ],
  [
    "echo-chamber",
    "Echo Chamber",
    "◈",
    150,
    "Every fourth allied signature repeats at 45% power. All signatures recharge 12% slower.",
  ],
].map(([id, name, icon, cost, desc], i) => ({
  id,
  name,
  icon,
  cost,
  desc,
  color: ["#ddba8d", "#a3d9b2", "#c4b0e8"][i % 3],
}));
export const NEW_EVENTS = [
  {
    title: "The gem surgeon",
    story:
      "A patient artisan offers to reshape the tools your companions carry.",
    choices: [
      {
        title: "Buy a Fork support · 45 gold",
        desc: "Trade focused damage for bouncing hits.",
        kind: "gem",
        cost: 45,
        gem: "fork-gem",
      },
      {
        title: "Exchange one orb for Purification",
        desc: "Prepare for poison and burning encounters.",
        kind: "orb-gem",
        cost: 1,
        gem: "cleanse-gem",
      },
      {
        title: "Observe the workshop",
        desc: "Every companion gains 24 EXP.",
        kind: "xp",
        amount: 24,
      },
    ],
  },
  {
    title: "A wounded shield thief",
    story:
      "A young Coralisk hides behind broken armor. Its pressure jets can bypass shields.",
    choices: [
      {
        title: "Adopt it · 1 orb",
        desc: "Recruit Coralisk and unlock its family permanently.",
        kind: "trade",
        cost: 1,
        creature: "coralisk",
      },
      {
        title: "Learn its technique · 40 gold",
        desc: "Receive Shieldbreaker support.",
        kind: "gem",
        cost: 40,
        gem: "fracture-gem",
      },
      {
        title: "Leave supplies",
        desc: "Spend 20 gold for 36 team EXP.",
        kind: "study",
        cost: 20,
        amount: 36,
      },
    ],
  },
  {
    title: "The blood altar",
    story: "A red constellation promises strength at the cost of comfort.",
    choices: [
      {
        title: "Accept the covenant · 65 gold",
        desc: "Gain Blood Covenant: more damage, weaker healing.",
        kind: "relic",
        cost: 65,
        relic: "blood-pact",
      },
      {
        title: "Take Blood Price · 30 gold",
        desc: "A skill support that consumes health for damage.",
        kind: "gem",
        cost: 30,
        gem: "blood-gem",
      },
      {
        title: "Refuse the bargain",
        desc: "Take 25 gold from the abandoned offerings.",
        kind: "gold",
        amount: 25,
      },
    ],
  },
  {
    title: "The poison garden",
    story: "The plants glow with the same poison that feeds the local choir.",
    choices: [
      {
        title: "Harvest Plagueburst · 45 gold",
        desc: "Detonate poison into area damage.",
        kind: "gem",
        cost: 45,
        gem: "detonate-gem",
      },
      {
        title: "Burn the garden",
        desc: "Gain 55 gold; the next battle's enemies gain 8% attack.",
        kind: "contract",
        gold: 55,
        enemy: 0.08,
      },
      {
        title: "Study the antidote",
        desc: "Receive Purification; spend 1 orb.",
        kind: "orb-gem",
        cost: 1,
        gem: "cleanse-gem",
      },
    ],
  },
  {
    title: "A traveling arena",
    story: "A veteran offers a training contract with a clearly stated price.",
    choices: [
      {
        title: "Train under pressure",
        desc: "Team gains 55 EXP; next battle's enemies gain 12% health.",
        kind: "contract",
        xp: 55,
        health: 0.12,
      },
      {
        title: "Buy tactical notes · 30 gold",
        desc: "Team gains 40 EXP.",
        kind: "study",
        cost: 30,
        amount: 40,
      },
      {
        title: "Sell your observations",
        desc: "Gain 35 gold.",
        kind: "gold",
        amount: 35,
      },
    ],
  },
  {
    title: "The moon reservoir",
    story: "A silver spring turns unused healing into protective water.",
    choices: [
      {
        title: "Bottle the spring · 45 gold",
        desc: "Receive Reservoir support.",
        kind: "gem",
        cost: 45,
        gem: "reservoir-gem",
      },
      {
        title: "Bind the spring · 70 gold",
        desc: "Gain Overgrowth Vessel; slower cooldowns, excess healing becomes shield.",
        kind: "relic",
        cost: 70,
        relic: "overgrowth",
      },
      {
        title: "Rest by the water",
        desc: "Recover one life, up to three.",
        kind: "life",
        amount: 1,
      },
    ],
  },
  {
    title: "The broken relay",
    story: "A machine can distribute its charge or sell it as stored energy.",
    choices: [
      {
        title: "Repair the relay · 60 gold",
        desc: "Gain Storm Relay: dodges refresh allied signatures.",
        kind: "relic",
        cost: 60,
        relic: "storm-relay",
      },
      {
        title: "Extract Resonance · 45 gold",
        desc: "Receive a cooldown-sharing support.",
        kind: "gem",
        cost: 45,
        gem: "relay-gem",
      },
      {
        title: "Sell the battery",
        desc: "Gain 50 gold.",
        kind: "gold",
        amount: 50,
      },
    ],
  },
  {
    title: "The collector's dilemma",
    story:
      "A rare hunter offers a living companion or a tool to complete your build.",
    choices: [
      {
        title: "Recruit Nightmaw · 2 orbs",
        desc: "Unlock a healer-hunting assassin.",
        kind: "trade",
        cost: 2,
        creature: "nightmaw",
      },
      {
        title: "Buy Withering · 40 gold",
        desc: "Counter enemy healing with a support gem.",
        kind: "gem",
        cost: 40,
        gem: "venom-gem",
      },
      {
        title: "Gather abandoned orbs",
        desc: "Receive two capture orbs.",
        kind: "orbs",
        amount: 2,
      },
    ],
  },
  {
    title: "A pact of five colors",
    story:
      "An old explorer asks whether diversity or specialization defines your team.",
    choices: [
      {
        title: "Choose diversity · 80 gold",
        desc: "Gain Prismatic Accord: rewards five different elements.",
        kind: "relic",
        cost: 80,
        relic: "unity",
      },
      {
        title: "Choose specialization · 70 gold",
        desc: "Gain Woven Soul: rewards active elemental bonds.",
        kind: "relic",
        cost: 70,
        relic: "bond",
      },
      {
        title: "Keep your options open",
        desc: "Gain 30 gold and one orb.",
        kind: "supplies",
        gold: 30,
        orbs: 1,
      },
    ],
  },
  {
    title: "The last lantern",
    story:
      "A lantern can save a falling companion, but its light weakens healing.",
    choices: [
      {
        title: "Carry Last Light · 75 gold",
        desc: "Revive one fallen ally each battle; team heals 10% less.",
        kind: "relic",
        cost: 75,
        relic: "last-light",
      },
      {
        title: "Take Mercy Engine · 65 gold",
        desc: "Emergency healing once per companion per battle.",
        kind: "relic",
        cost: 65,
        relic: "mercy",
      },
      {
        title: "Study the flame",
        desc: "Every companion gains 32 EXP.",
        kind: "xp",
        amount: 32,
      },
    ],
  },
  {
    title: "The salvager's wager",
    story: "A salvager will pay now for a more dangerous next encounter.",
    choices: [
      {
        title: "Accept the bounty",
        desc: "Gain 80 gold; next enemy team deals 15% more damage.",
        kind: "contract",
        gold: 80,
        enemy: 0.15,
      },
      {
        title: "Buy the compass · 55 gold",
        desc: "Gain Salvager's Compass: extra elite gems, less normal gold.",
        kind: "relic",
        cost: 55,
        relic: "salvage",
      },
      {
        title: "Take a safe commission",
        desc: "Gain 25 gold.",
        kind: "gold",
        amount: 25,
      },
    ],
  },
  {
    title: "The elemental forge",
    story: "Ice and embers turn inside a furnace with no walls.",
    choices: [
      {
        title: "Forge the Crucible · 65 gold",
        desc: "Gain Frostfire Crucible: combine slow and burn into steam explosions.",
        kind: "relic",
        cost: 65,
        relic: "frostfire",
      },
      {
        title: "Take Cryostasis · 35 gold",
        desc: "Slow enemies and turn existing burn into steam damage.",
        kind: "gem",
        cost: 35,
        gem: "frost-gem",
      },
      {
        title: "Train at the forge",
        desc: "Spend 25 gold for 42 team EXP.",
        kind: "study",
        cost: 25,
        amount: 42,
      },
    ],
  },
];
