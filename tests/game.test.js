import test from "node:test";
import assert from "node:assert/strict";
import {
  SPECIES,
  BY_ID,
  STARTERS,
  RELIC_SLOTS,
  PERSONAL_RELICS,
  makeRun,
  creature,
  personalRelic,
  equipRelic,
  unequipRelic,
  linkRelic,
  linkedSupport,
  stats,
  generateRoute,
  canVisit,
  enterNode,
  nextNode,
  encounter,
  captureChance,
  rollCapture,
  buyRelic,
  buyCreature,
  gainXP,
  xpNeeded,
  Battle,
  simulate,
} from "../game.js";
import { ACTIVE_SKILLS, AUTO_SKILLS, SKILLS, loadoutFor } from "../skills.js";

test("562 named abilities, a unique auto per species, and rarity-scaled active loadouts", () => {
  assert.equal(Object.keys(SKILLS).length, 562);
  assert.equal(AUTO_SKILLS.length, 89);
  assert.equal(ACTIVE_SKILLS.length, 473);
  assert.equal(new Set(Object.values(SKILLS).map((s) => s.name)).size, 562);
  for (const s of SPECIES) {
    const l = loadoutFor(s);
    assert.equal(SKILLS[l.auto].species, s.id);
    assert.equal(
      l.active.length,
      ["Rare", "Epic", "Legendary"].includes(s.rarity) ? 3 : 2,
    );
    assert.equal(new Set(l.active).size, l.active.length);
    for (const id of l.active) assert.ok(SKILLS[id]);
  }
});
test("socket capacity is 1–5 and respects equipment ownership", () => {
  assert.deepEqual(Object.values(RELIC_SLOTS), [1, 2, 3, 4, 5]);
  const r = makeRun(1);
  assert.ok(equipRelic(r, 0, r.inventory[0].uid));
  assert.equal(r.inventory.length, 2);
  assert.equal(equipRelic(r, 0, r.inventory[0].uid), false);
  assert.ok(unequipRelic(r, 0, 0));
  assert.equal(r.inventory.length, 3);
  r.team[0] = creature("thornstag");
  for (let i = 0; i < 3; i++) assert.ok(equipRelic(r, 0, r.inventory[0].uid));
  assert.equal(r.team[0].relics.length, 3);
  assert.equal(equipRelic(r, 0, "not-owned"), false);
});
test("a support changes only the linked skill; invalid links are rejected", () => {
  const r = makeRun(2);
  r.inventory = [personalRelic("quick-shard")];
  const original = stats(r.team[0], r.team).cd;
  equipRelic(r, 0, r.inventory[0].uid);
  assert.equal(stats(r.team[0], r.team).cd, original * 0.75);
  assert.ok(linkRelic(r, 0, 0, "cinderfall"));
  assert.equal(stats(r.team[0], r.team).cd, original);
  assert.equal(linkedSupport(r.team[0], "cinderfall").cooldown, 0.75);
  assert.equal(linkedSupport(r.team[0], "cinderfox").cooldown, 1);
  assert.equal(linkRelic(r, 0, 0, "abyssal"), false);
});
test("multiple different gems can modify the same skill, with no duplicate supports", () => {
  const r = makeRun(4);
  r.team[0] = creature("astralisk");
  r.inventory = [
    "echo-prism",
    "spore-ring",
    "wanderers-knot",
    "echo-prism",
  ].map(personalRelic);
  for (let i = 0; i < 3; i++) assert.ok(equipRelic(r, 0, r.inventory[0].uid));
  const support = linkedSupport(r.team[0], "astralisk");
  assert.equal(support.echo, 0.55);
  assert.equal(support.poison, 4);
  assert.equal(support.targets, 1);
  assert.ok(support.area > 1.5);
  assert.equal(equipRelic(r, 0, r.inventory[0].uid), false);
});
test("Spell Echo schedules and executes a second cast", () => {
  const r = makeRun(3);
  r.inventory = [personalRelic("echo-prism")];
  equipRelic(r, 0, r.inventory[0].uid);
  const b = new Battle(r, [creature("mossguard", 3)], 3),
    u = b.units[0],
    t = b.units.at(-1);
  u.x = 250;
  u.y = 250;
  t.x = 310;
  t.y = 250;
  b.cast(u, "cinderfox", t);
  assert.equal(b.metrics.echoes, 1);
  assert.equal(b.queue.filter((q) => q.echo).length, 1);
  for (let i = 0; i < 10; i++) b.step(0.1);
  assert.equal(b.metrics.skills, 2);
  assert.ok(u.damage > 0);
});
test("Convergence adds an actual target to a signature auto-attack", () => {
  const r = makeRun(5);
  r.inventory = [personalRelic("wanderers-knot")];
  equipRelic(r, 3, r.inventory[0].uid);
  linkRelic(r, 3, 0, "auto-voltwing");
  const b = new Battle(
    r,
    [creature("mossguard"), creature("brookfin"), creature("pyrehorn")],
    5,
  );
  b.cast(b.units[3], "auto-voltwing", b.units[6]);
  assert.equal(b.queue.filter((q) => q.projectile).length, 3);
  for (const u of b.units) {
    u.attackTimer = 999;
    Object.values(u.cooldowns).forEach((cd) => (cd.remaining = 999));
  }
  b.step(0.1);
  b.step(0.1);
  assert.equal(b.projectiles.length, 3);
});
test("Fortification on an auto-attack shields its wearer and no teammate", () => {
  const r = makeRun(6);
  r.inventory = [personalRelic("ward-stone")];
  equipRelic(r, 0, r.inventory[0].uid);
  linkRelic(r, 0, 0, "auto-cinderfox");
  const b = new Battle(r, [creature("mossguard")], 6);
  b.cast(b.units[0], "auto-cinderfox", b.units[6]);
  assert.equal(b.units[0].shield, 10);
  assert.equal(b.units[1].shield, 0);
});
test("every active skill has an executable combat effect", () => {
  for (const def of ACTIVE_SKILLS) {
    const species = def.evolutionSkill ? BY_ID[def.species] : SPECIES.find((s) => loadoutFor(s).active.includes(def.id));
    const r = makeRun(15);
    r.team[0] = creature(species.id);
    if(def.evolutionSkill){r.team[0].evolution=def.stage;r.team[0].evolutionPath=def.path;}
    const b = new Battle(
      r,
      [
        creature("mossguard", 4),
        creature("brookfin", 4),
        creature("pyrehorn", 4),
      ],
      15,
    );
    const u = b.units[0];
    b.units.forEach((a, i) => {
      a.x = 400 + (a.side ? 60 : 0) + (i % 3) * 15;
      a.y = 250 + (i % 3) * 15;
      if (!a.side) a.hp = a.maxHp * 0.5;
    });
    b.cast(u, def.id, b.units[6]);
    assert.equal(b.metrics.skills, 1, def.name);
    assert.ok(
      b.effects.length ||
        b.projectiles.length ||
        b.hazards.length ||
        b.queue.length,
      def.name,
    );
  }
});
test("reachable map paths stay in adjacent lanes and a boss ends the planet", () => {
  const r = makeRun(7);
  r.route = generateRoute(r);
  enterNode(r, r.route[0][0]);
  nextNode(r);
  assert.ok(canVisit(r, r.route[1][0]));
  assert.ok(canVisit(r, r.route[1][1]));
  assert.equal(canVisit(r, r.route[1][2]), false);
  assert.throws(() => enterNode(r, r.route[1][2]));
  r.depth = 5;
  nextNode(r);
  assert.equal(r.planet, 1);
  assert.equal(r.depth, 0);
});
test("sanctuaries offer a rare target and a tangible capture bonus", () => {
  const r = makeRun(8);
  r.depth = 2;
  const foes = encounter(r, "capture", 8);
  assert.equal(foes.length, 4);
  assert.ok(
    foes.some((c) =>
      ["Rare", "Epic", "Legendary"].includes(BY_ID[c.id].rarity),
    ),
  );
  const c = creature("thornstag"),
    base = captureChance(r, c);
  r.encounterType = "capture";
  assert.equal(captureChance(r, c), base + 0.12);
});
test("capture consumes exactly one orb and never proceeds without an orb or bench space", () => {
  const r = makeRun(9);
  r.random = () => 0;
  const result = rollCapture(r, creature("elderoot", 3));
  assert.equal(result.success, true);
  assert.equal(r.orbs, 4);
  assert.equal(r.bench[0].id, "elderoot");
  r.orbs = 0;
  assert.ok(rollCapture(r, creature("cinderfox")).reason);
  assert.equal(r.orbs, 0);
});
test("gold is scarce: purchases cannot overspend or duplicate expedition relics", () => {
  const r = makeRun(10);
  r.gold = 144;
  assert.equal(buyRelic(r, "clock"), false);
  r.gold = 145;
  assert.ok(buyRelic(r, "clock"));
  assert.equal(r.gold, 0);
  assert.equal(buyRelic(r, "clock"), false);
  assert.equal(buyCreature(r, "starborn"), false);
});
test("experience carries over through several levels", () => {
  const c = creature("cinderfox");
  assert.equal(gainXP(c, 100), 2);
  assert.equal(c.level, 3);
  assert.equal(c.xp, 16);
  assert.equal(xpNeeded(c.level), 60);
});
test("boss phase two triggers once and accelerates its real cooldowns", () => {
  const r = makeRun(11);
  r.depth = 5;
  const b = new Battle(r, encounter(r, "boss", 11), 11),
    boss = b.units.find((u) => u.boss);
  const cd = boss.cooldowns[boss.id].total;
  boss.hp = boss.maxHp * 0.49;
  b.step(0.05);
  assert.ok(boss.enraged);
  assert.equal(boss.cooldowns[boss.id].total, cd * 0.9);
  b.step(0.05);
  assert.equal(boss.cooldowns[boss.id].total, cd * 0.9);
});
test("representative seeded combat terminates with finite health, skills, healing, and damage", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const r = makeRun(seed);
    r.planet = seed % 3;
    r.depth = seed % 6;
    r.team.forEach((c) => (c.level = 1 + r.planet * 2));
    const b = simulate(
      r,
      encounter(r, seed % 5 === 0 ? "boss" : "battle", seed),
      seed,
    );
    assert.ok(b.done);
    assert.ok([0, 1].includes(b.winner));
    assert.ok(b.time <= 90.1);
    assert.ok(b.metrics.skills > 0);
    assert.ok(b.metrics.damage > 0);
    for (const u of b.units) {
      assert.ok(Number.isFinite(u.hp) && u.hp >= 0 && u.hp <= u.maxHp);
      assert.ok(Number.isFinite(u.x) && Number.isFinite(u.y));
    }
  }
});

test("level-5 awakening unlocks an actual third skill and stronger common stats", () => {
  const r = makeRun(20),
    c = r.team[0];
  c.level = 4;
  const before = stats(c, [c]);
  assert.equal(loadoutFor(BY_ID[c.id], c.level).active.length, 2);
  assert.equal(linkRelic(r, 0, 0, "predator-instinct"), false);
  c.level = 5;
  const after = stats(c, [c]);
  assert.equal(loadoutFor(BY_ID[c.id], c.level).active.length, 3);
  assert.ok(after.atk > before.atk * 1.2);
  const b = new Battle(r, [creature("mossguard", 5)], 20);
  assert.ok(b.units[0].cooldowns["predator-instinct"]);
});
