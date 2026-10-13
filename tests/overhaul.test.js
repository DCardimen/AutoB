import test from "node:test";
import assert from "node:assert/strict";
import {
  SPECIES,
  BY_ID,
  PERSONAL_RELICS,
  RELICS,
  EVENTS,
  makeRun as legacyMakeRun,
  creature,
  personalRelic,
  equipRelic,
  linkRelic,
  generateRoute,
  encounter,
  Battle,
  simulate,
  canSupport,
  stats,
  captureChance,
  awardCapture,
  rollCapture,
  buyRelic,
  buyCreature,
  buyLegendaryLure,
  eventAvailable,
  applyEvent,
  setDeployment,
  defaultDeployment,
  evolveCreature,
} from "../game.js";
import {
  CREATURE_TRAITS,
  POLICIES,
  CHAOS_TIERS,
  chaosLevel,
  shopPrice,
  unlockChaos,
  starterPoints,
  recordBond,
} from "../tactics.js";
import { dashPosition, creaturePose, visualUnit } from "../animation.js";
function arena(id = "coralisk", foes = ["mossguard", "brookfin", "pyrehorn"]) {
  const run = makeRun(17);
  run.team[0] = creature(id, 5);
  return new Battle(
    run,
    foes.map((id) => creature(id, 5)),
    17,
  );
}
function gemBattle(gem, id = "thornstag") {
  const run = makeRun(21);
  run.team[0] = creature(id, 5);
  run.inventory = [personalRelic(gem)];
  equipRelic(run, 0, run.inventory[0].uid);
  return new Battle(
    run,
    [
      creature("mossguard", 5),
      creature("brookfin", 5),
      creature("pyrehorn", 5),
    ],
    21,
  );
}
test("every family has a functional specialty; 30 supports and 136 relics have unique IDs", () => {
  for (const c of SPECIES) assert.ok(CREATURE_TRAITS[c.id], c.id);
  assert.equal(PERSONAL_RELICS.length, 30);
  assert.equal(RELICS.length, 136);
  assert.equal(new Set(PERSONAL_RELICS.map((g) => g.id)).size, 30);
  assert.equal(new Set(RELICS.map((g) => g.id)).size, 136);
});
test("route seeds change layouts, scouting and weather, and repeat deterministically", () => {
  const layouts = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const run = makeRun(seed),
      route = generateRoute(run);
    assert.deepEqual(route, generateRoute(run));
    layouts.add(JSON.stringify(route.map((row) => row.map((n) => n.type))));
    assert.equal(route[0][0].type, "battle");
    assert.equal(route[5][0].type, "boss");
    assert.ok(route.flat().every((n) => n.archetype && n.weather));
  }
  assert.ok(layouts.size >= 20);
});
test("six creatures can occupy unique grid cells; moving to an occupied default cell swaps", () => {
  const run = makeRun(1);
  assert.equal(
    new Set(run.team.map((c, i) => JSON.stringify(defaultDeployment(c, i))))
      .size,
    6,
  );
  const before = defaultDeployment(run.team[1], 1);
  const from = defaultDeployment(run.team[0], 0);
  assert.ok(setDeployment(run, 0, before.row, before.column));
  assert.deepEqual(run.team[1].deployment, from);
  assert.equal(setDeployment(run, 0, 4, 1), false);
  const b = new Battle(run, [creature("mossguard")], 1);
  assert.equal(b.units[0].y, [155, 275, 395][before.row] - 15);
});
test("AI holds healing at full health, then releases it when an ally is injured", () => {
  const b = arena("brookfin"),
    u = b.units[0];
  assert.equal(b.shouldCast(u, "brookfin"), false);
  b.units[1].hp *= 0.5;
  assert.equal(b.shouldCast(u, "brookfin"), true);
});
test("healer hunting selects a support; taunts still override it", () => {
  const b = arena("nightmaw"),
    u = b.units[0],
    healer = b.units.find((a) => a.side === 1 && a.id === "brookfin"),
    guard = b.units.find((a) => a.side === 1 && a.id === "mossguard");
  u.policy = "healer";
  assert.equal(b.target(u), healer);
  guard.x = u.x + 50;
  guard.y = u.y;
  guard.taunt = 2;
  assert.equal(b.target(u), guard);
});
test("area AI selects the denser enemy group instead of its isolated initial target", () => {
  const b = arena("astralisk"),
    u = b.units[0],
    enemies = b.living(1);
  enemies[0].x = 900;
  enemies[0].y = 100;
  enemies[1].x = 650;
  enemies[1].y = 300;
  enemies[2].x = 660;
  enemies[2].y = 300;
  assert.notEqual(b.castTarget(u, "astralisk", enemies[0]), enemies[0]);
});
test("a Common pressure-fracture creature bypasses shields while an ordinary hit does not", () => {
  const b = arena("coralisk"),
    u = b.units[0],
    t = b.living(1)[0];
  b.random = () => 0.99;
  t.shield = 1000;
  const hp = t.hp;
  b.hit(t, 100, u, u.loadout.auto);
  assert.ok(t.hp < hp);
  assert.ok(t.shield < 1000);
});
test("Shieldbreaker materially bypasses shields, with the advertised damage tradeoff", () => {
  const b = gemBattle("fracture-gem"),
    u = b.units[0],
    t = b.living(1)[0];
  b.random = () => 0.99;
  t.shield = 1000;
  const hp = t.hp;
  b.hit(t, 100, u, u.id);
  assert.ok(hp - t.hp > 50);
  assert.ok(hp - t.hp < 100);
});
test("Withering reduces actual healing and Fork adds non-recursive projectiles", () => {
  const b = gemBattle("venom-gem"),
    u = b.units[0],
    t = b.living(1)[0];
  b.random = () => 0.99;
  b.hit(t, 10, u, u.id);
  assert.equal(t.wither, 4);
  t.hp = t.maxHp * 0.5;
  const before = t.hp;
  b.heal(t, 100, t);
  assert.equal(Math.round(t.hp - before), 45);
  const fork = gemBattle("fork-gem");
  fork.random = () => 0.99;
  fork.hit(fork.living(1)[0], 50, fork.units[0], fork.units[0].id);
  assert.equal(fork.projectiles.length, 2);
  fork.hit(fork.living(1)[1], 50, fork.units[0], fork.units[0].id, 1, false);
  assert.equal(fork.projectiles.length, 2);
});
test("Reservoir saves excess healing and Purification removes roots, burns and poison", () => {
  const b = gemBattle("reservoir-gem", "brookfin"),
    u = b.units[0];
  b.heal(u, 100, u, u.id);
  assert.ok(u.shield > 0);
  assert.ok(u.shield <= u.maxHp * 0.45);
  const clean = gemBattle("cleanse-gem");
  const ally = clean.units[1];
  ally.hp *= 0.2;
  ally.burn = 5;
  ally.poison = 5;
  ally.root = 3;
  clean.supportedUse(clean.units[0], clean.units[0].id, false);
  assert.equal(ally.root + ally.poison + ally.burn, 0);
});
test("capture odds reward weakening, statuses and Mercy; boss capture is excluded", () => {
  const run = makeRun(4),
    c = creature("elderoot");
  const base = captureChance(run, c);
  const boss = { ...c, boss: true };
  const before = run.orbs;
  assert.ok(rollCapture(run, boss).reason);
  assert.equal(run.orbs, before);
  c.capturePreparation = { healthFraction: 0.25, status: true, mode: "mercy" };
  assert.ok(captureChance(run, c) > base + 0.3);
});
test("tactical capture resolves once and removes a successful target from combat", () => {
  const run = makeRun(5),
    foes = [creature("elderoot", 3)];
  run.captureOrder = { uid: foes[0].uid, mode: "mercy" };
  const b = new Battle(run, foes, 5),
    target = b.living(1)[0];
  target.hp = target.maxHp * 0.3;
  target.root = 2;
  b.random = () => 0;
  b.attemptCapture();
  assert.equal(b.captureResult.success, true);
  assert.equal(target.captured, true);
  assert.equal(target.hp, 0);
  const result = b.captureResult;
  b.attemptCapture();
  assert.equal(b.captureResult, result);
});
test("a resolved capture reservation is reused on replay rather than rerolled", () => {
  const run = makeRun(6),
    foes = [creature("cinderfox")];
  run.captureOrder = { uid: foes[0].uid, mode: "swift" };
  run.captureReservation = {
    result: { uid: foes[0].uid, success: true, creature: foes[0] },
  };
  const b = new Battle(run, foes, 6);
  assert.equal(b.living(1).length, 1);
  assert.equal(b.captureSettled, false);
  b.living(1)[0].hp *= 0.3;
  b.random = () => 0.99;
  b.attemptCapture();
  assert.equal(b.captureResult.success, true);
  assert.equal(b.living(1).length, 0);
});
test("every habitat offers Legendary beacon encounters; beacons cannot be purchased twice", () => {
  for (let planet = 0; planet < 3; planet++) {
    const run = makeRun(7);
    run.planet = planet;
    run.depth = 2;
    assert.ok(buyLegendaryLure(run));
    assert.equal(buyLegendaryLure(run), false);
    assert.ok(
      encounter(run, "capture", 7).some(
        (c) => BY_ID[c.id].rarity === "Legendary",
      ),
    );
  }
});
test("Legendary shop contracts use real gold and bench space; Chaos shop prices agree", () => {
  const run = makeRun(8, undefined, { difficulty: "chaos", chaos: 6 });
  run.gold = shopPrice(run, 290);
  assert.ok(buyCreature(run, "elderoot"));
  assert.equal(run.gold, 0);
  run.gold = shopPrice(run, 220);
  assert.ok(buyRelic(run, "clock"));
  assert.equal(run.gold, 0);
});
test("Chaos unlocks after victory, advances one tier, and stops at twenty", () => {
  const profile = {};
  unlockChaos(profile, makeRun(9));
  assert.equal(profile.chaosUnlocked, 1);
  unlockChaos(
    profile,
    makeRun(10, undefined, { difficulty: "chaos", chaos: 1 }),
  );
  assert.equal(profile.chaosUnlocked, 2);
  assert.equal(profile.chaosCleared, 1);
  unlockChaos(
    profile,
    makeRun(11, undefined, { difficulty: "chaos", chaos: 20 }),
  );
  assert.equal(profile.chaosUnlocked, 20);
  assert.equal(CHAOS_TIERS.length, 20);
});
test("Chaos starting resources and cumulative enemy scaling follow the selected tier", () => {
  const standard = makeRun(12),
    chaos = makeRun(12, undefined, { difficulty: "chaos", chaos: 20 });
  assert.equal(chaos.gold, 130);
  assert.equal(chaos.orbs, 4);
  assert.equal(chaos.integrity, 2);
  const foes = [Object.assign(creature("mossguard", 3), { elite: true })];
  const a = new Battle(standard, foes, 12),
    b = new Battle(chaos, foes, 12);
  assert.ok(b.living(1)[0].maxHp > a.living(1)[0].maxHp);
  assert.ok(b.living(1)[0].shield >= 40);
  assert.equal(chaosLevel(makeRun(12)), 0);
  assert.equal(shopPrice(chaos, 100), 110);
});
test("the three bosses perform different mechanics and transition to a third phase", () => {
  for (let planet = 0; planet < 3; planet++) {
    const run = makeRun(13);
    run.planet = planet;
    run.depth = 5;
    const b = new Battle(run, encounter(run, "boss", 13), 13),
      boss = b.units.find((a) => a.boss);
    boss.hp = boss.maxHp * 0.2;
    b.bossMechanic(boss, 2);
    assert.equal(boss.phase, 3);
    assert.ok(b.hazards.length > 0);
    if (planet === 0) assert.equal(b.hazards.at(-1).root, 1);
    if (planet === 1) assert.equal(b.hazards.length, 3);
    if (planet === 2) assert.equal(b.hazards[0].r, 130);
  }
});
test("interception protects a nearby ally and reports transferred damage", () => {
  const b = arena("mossguard"),
    guard = b.units[0],
    ally = b.units[1],
    enemy = b.living(1)[0];
  guard.x = ally.x;
  guard.y = ally.y;
  const before = ally.hp;
  b.damageUnit(ally, 100, enemy, enemy.id);
  assert.equal(Math.round(before - ally.hp), 78);
  assert.ok(guard.damageTaken > 0);
  assert.ok(b.metrics.intercepts > 0);
});
test("Wild and Warden evolutions change combat behavior, not just statistics", () => {
  const run = makeRun(15);
  run.team[0] = creature("voltwing", 5);
  evolveCreature(run, 0, "wild");
  const b = new Battle(run, [creature("mossguard"), creature("brookfin")], 15);
  b.supportedUse(b.units[0], b.units[0].id, false);
  assert.equal(b.projectiles.length, 1);
  const ward = makeRun(15);
  ward.team[0] = creature("voltwing", 5);
  evolveCreature(ward, 0, "warden");
  const w = new Battle(ward, [creature("mossguard")], 15);
  w.supportedUse(w.units[0], w.units[0].id, false);
  assert.equal(w.hazards[0].root, 2);
});
test("event contracts apply a stated next-battle risk and gem trades respect inventory", () => {
  const run = makeRun(16),
    event = EVENTS.find((e) => e.title === "The salvager's wager");
  assert.ok(applyEvent(run, event, 0).ok);
  assert.equal(run.contracts[0].attack, 0.15);
  const gem = EVENTS.find((e) => e.title === "The gem surgeon");
  run.gold = 44;
  assert.equal(eventAvailable(run, gem.choices[0]), false);
  assert.equal(applyEvent(run, gem, 0).ok, false);
  run.gold = 45;
  assert.ok(applyEvent(run, gem, 0).ok);
  assert.equal(run.inventory.at(-1).id, "fork-gem");
});
test("battle reports explain enemy healing and shield absorption", () => {
  const b = arena();
  const t = b.living(1)[0];
  t.shieldAbsorbed = 150;
  const healer = b.living(1)[1];
  healer.healed = 200;
  const report = b.reportAdvice().join(" ");
  assert.match(report, /Withering/);
  assert.match(report, /Shieldbreaker/);
});
test("animation v2 dashes interpolate and falls progress smoothly at fixed game time", () => {
  const u = {
    id: "cinderfox",
    uid: "stable",
    hp: 100,
    x: 700,
    y: 300,
    dashFrom: { x: 200, y: 150 },
    dashAnim: 0.38,
  };
  assert.deepEqual(dashPosition(u), { x: 200, y: 150 });
  u.dashAnim = 0.28;
  const mid = dashPosition(u);
  assert.ok(mid.x > 200 && mid.x < 700);
  u.dashAnim = 0;
  assert.equal(dashPosition(u).x, 700);
  const first = creaturePose({ ...u, hp: 0, deathTime: 0 }, 1),
    later = creaturePose({ ...u, hp: 0, deathTime: 0.5 }, 1);
  assert.ok(later.rotation < first.rotation);
  assert.deepEqual(later, creaturePose({ ...u, hp: 0, deathTime: 0.5 }, 1));
});

test("repeated capture bonds cap at five and let two mastered Legendary starters fit twelve points", () => {
  const profile = {};
  for (let i = 0; i < 20; i++) recordBond(profile, "elderoot");
  assert.equal(profile.bonds.elderoot, 5);
  assert.equal(starterPoints("Legendary", 5), 4);
  assert.equal(starterPoints("Legendary", 4), 6);
  assert.equal(
    2 * starterPoints("Legendary", 5) + 4 * starterPoints("Common", 0),
    12,
  );
  const run = makeRun(1);
  const c = run.team[0],
    before = stats(c, run.team).hp;
  c.bond = 5;
  assert.ok(stats(c, run.team).hp > before);
  assert.ok(stats(c, run.team).hp <= before * 1.11);
});

test("a correctly linked counter support can turn the same shield encounter into a victory", () => {
  const run = makeRun(4);
  run.team.forEach((c) => (c.level = 4));
  const foes = [
    "mossguard",
    "barkbeetle",
    "brookfin",
    "brineclam",
    "reedcobra",
    "cinderfox",
  ].map((id) => Object.assign(creature(id, 2), { archetype: "bastion" }));
  const baseline = simulate(run, foes, 4);
  assert.equal(baseline.winner, 1);
  run.inventory = [personalRelic("fracture-gem")];
  equipRelic(run, 0, run.inventory[0].uid);
  linkRelic(run, 0, 0, "auto-cinderfox");
  const counter = simulate(run, foes, 4);
  assert.equal(counter.winner, 0);
});

test("support compatibility prevents inert links and automatically chooses a valid skill", () => {
  assert.equal(canSupport("fracture-gem", "brookfin"), false);
  assert.equal(canSupport("fracture-gem", "auto-brookfin"), true);
  assert.equal(canSupport("relay-gem", "auto-cinderfox"), false);
  assert.equal(canSupport("reservoir-gem", "cinderfox"), false);
  const run = makeRun(19);
  run.inventory = [personalRelic("fracture-gem")];
  assert.ok(equipRelic(run, 2, run.inventory[0].uid));
  assert.equal(run.team[2].relics[0].link, "auto-brookfin");
  assert.equal(linkRelic(run, 2, 0, "brookfin"), false);
});

test("combat outcomes are independent of browser frame rate and simulation call interval", () => {
  const run = makeRun(91);
  run.planet = 2;
  run.depth = 5;
  run.team.forEach((c) => {
    c.level = 9;
    c.training = 4;
    c.evolution = 2;
    c.evolutionPath = "wild";
  });
  run.route = generateRoute(run);
  const node = run.route[5][0],
    foes = encounter(run, "boss", node.seed);
  const outcomes = [0.008, 0.016, 0.04, 0.05, 0.1].map((dt) => {
    const b = new Battle(run, foes, node.seed);
    for (let i = 0; i < 15000 && !b.done; i++) b.step(dt);
    assert.ok(b.done);
    return {
      winner: b.winner,
      time: b.time,
      metrics: b.metrics,
      health: b.units.map((u) => u.hp),
    };
  });
  for (const result of outcomes.slice(1)) assert.deepEqual(result, outcomes[0]);
});

test("the final knockout finishes falling without advancing settled combat state", () => {
  const dead = { hp: 0, x: 100, y: 150, deathTime: 0, attackAnim: 0.3 };
  const before = structuredClone(dead);
  const first = visualUnit(dead, 0, 0.2),
    last = visualUnit(dead, 0, 1.6);
  assert.ok(
    creaturePose(last, 1.6, "fox").alpha <
      creaturePose(first, 0.2, "fox").alpha,
  );
  assert.equal(last.attackAnim, 0);
  assert.deepEqual(dead, before);
});

function makeRun(seed,ids,options={}){return legacyMakeRun(seed,ids,{...options,rulesVersion:11});}
