import test from "node:test";
import assert from "node:assert/strict";
import {
  Battle,
  makeRun as legacyMakeRun,
  creature,
  BY_ID,
  casualtyRisk,
  CASUALTY_RISK,
  hospitalOffer,
  upgradeHospital,
  trainSurvival,
  settleDefeat,
  deployReserve,
  personalRelic,
  equipRelic,
  linkRelic,
  defaultDeployment,
} from "../game.js";
import {
  sweepCircle,
  movingBodyHit,
  separateBodies,
  strikeContains,
  confineBody,
} from "../arena.js";
function arena(source = "cinderfox", target = "glacier", seed = 31) {
  const run = makeRun(seed);
  run.team = [creature(source, 4)];
  const battle = new Battle(run, [creature(target, 4)], seed),
    u = battle.units[0],
    t = battle.units[1];
  u.x = u.px = 300;
  u.y = u.py = 250;
  t.x = t.px = 360;
  t.y = t.py = 250;
  for (const unit of battle.units) {
    unit.attackTimer = 999;
    unit.dodgeCooldown = 999;
    unit.speed = 0;
    Object.values(unit.cooldowns).forEach((c) => (c.remaining = 999));
  }
  return { run, battle, u, t };
}
function tick(battle, seconds) {
  for (let i = 0; i < Math.ceil(seconds / 0.04); i++) battle.step(0.04);
}
test("swept collision detects a fast projectile crossing a creature between frames", () => {
  const t = sweepCircle({ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 100, y: 0 }, 20);
  assert.ok(Math.abs(t - 0.4) < 1e-9);
  assert.equal(
    sweepCircle({ x: 0, y: 45 }, { x: 200, y: 45 }, { x: 100, y: 0 }, 20),
    null,
  );
  assert.notEqual(
    movingBodyHit(
      { x: 0, y: 86 },
      { x: 200, y: 86 },
      { x: 100, y: 100, px: 100, py: 100, radius: 17 },
    ),
    null,
  );
});
test("friendly and hostile bodies separate by mass and respect arena walls", () => {
  const a = { x: 400, y: 250, radius: 22, mass: 4, hp: 100, side: 0 },
    b = { x: 410, y: 250, radius: 17, mass: 1, hp: 100, side: 1 };
  assert.ok(separateBodies([a, b]) > 0);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 38.9);
  assert.ok(Math.abs(a.x - 400) < Math.abs(b.x - 410));
  a.x = -400;
  a.y = 900;
  confineBody(a);
  assert.ok(a.x >= 77 && a.y <= 438);
});
test("melee waits for contact and cannot follow a target escaping the committed arc", () => {
  const { battle, u, t } = arena();
  const health = t.hp;
  battle.cast(u, u.loadout.auto, t);
  assert.equal(t.hp, health);
  assert.equal(battle.strikes.length, 1);
  assert.equal(strikeContains(battle.strikes[0], t), true);
  t.y = t.py = 360;
  tick(battle, 0.36);
  assert.equal(t.hp, health);
  assert.equal(battle.metrics.whiffs, 1);
});
test("an aligned melee swing actually connects and imparts momentum", () => {
  const { battle, u, t } = arena();
  const health = t.hp;
  battle.cast(u, u.loadout.auto, t);
  tick(battle, 0.24);
  assert.ok(t.hp < health);
  assert.ok(t.impulseX > 0);
  assert.equal(battle.metrics.physicalHits, 1);
  const x = t.x;
  tick(battle, 0.08);
  assert.ok(t.x > x);
});
test("physical projectiles keep their aim and may miss a target that moves sideways", () => {
  const { battle, u, t } = arena("voltwing");
  t.x = t.px = 650;
  battle.projectile(u, t, u.loadout.auto, 1);
  const p = battle.projectiles[0],
    vx = p.vx,
    vy = p.vy,
    health = t.hp;
  t.y = t.py = 400;
  tick(battle, 0.9);
  assert.equal(t.hp, health);
  assert.equal(p.vx, vx);
  assert.equal(p.vy, vy);
  assert.ok(p.y < 260);
});
test("a creature screening the target physically blocks a projectile", () => {
  const run = makeRun(7);
  run.team = [creature("voltwing", 4)];
  const battle = new Battle(
      run,
      [creature("glacier", 4), creature("brookfin", 4)],
      7,
    ),
    u = battle.units[0],
    guard = battle.units[1],
    rear = battle.units[2];
  u.x = 300;
  u.y = 250;
  guard.x = 425;
  guard.y = 250;
  rear.x = 650;
  rear.y = 250;
  for (const unit of battle.units) {
    unit.px = unit.x;
    unit.py = unit.y;
    unit.speed = 0;
    unit.dodgeCooldown = 999;
    unit.attackTimer = 999;
    Object.values(unit.cooldowns).forEach((c) => (c.remaining = 999));
  }
  const hp = rear.hp,
    guardHp = guard.hp;
  battle.projectile(u, rear, u.loadout.auto, 1);
  tick(battle, 0.5);
  assert.equal(rear.hp, hp);
  assert.ok(guard.hp < guardHp);
  assert.equal(battle.metrics.blockedProjectiles, 1);
});
test("dodge stats cannot randomly cancel a hit that physically connects", () => {
  const { battle, u, t } = arena();
  t.dodge = 100;
  t.evade = 20;
  const hp = t.hp;
  battle.hit(t, 20, u, u.loadout.auto, 1, true, "physical");
  assert.ok(t.hp < hp);
  assert.equal(battle.metrics.dodges, 0);
});
test("reactive AI rolls with real displacement and pays stamina; roots prevent the roll", () => {
  const { battle, u, t } = arena();
  t.dodgeCooldown = 0;
  u.x = 300;
  t.x = 352;
  const strike = battle.beginStrike(u, t, u.loadout.auto, 1, { windup: 0.4 });
  const point = { x: t.x, y: t.y };
  tick(battle, 0.36);
  assert.equal(t.rollCount, 1);
  assert.ok(Math.hypot(t.x - point.x, t.y - point.y) > 5);
  assert.ok(t.stamina < 85);
  assert.ok(!strikeContains(strike, t));
  const rooted = arena();
  rooted.t.x = 352;
  rooted.t.dodgeCooldown = 0;
  rooted.t.root = 2;
  rooted.battle.beginStrike(rooted.u, rooted.t, rooted.u.loadout.auto, 1, {
    windup: 0.4,
  });
  tick(rooted.battle, 0.2);
  assert.equal(rooted.t.rollCount, 0);
});
test("stagger breaks poise and cancels an attack still in windup", () => {
  const { battle, u, t } = arena();
  const strike = battle.beginStrike(t, u, t.loadout.auto, 1, { windup: 0.5 });
  t.poise = t.maxPoise - 1;
  battle.applyImpact(t, u, 60, true);
  assert.equal(strike.cancelled, true);
  assert.ok(t.stagger > 0);
  assert.equal(battle.metrics.staggers, 1);
  const hp = u.hp;
  tick(battle, 0.6);
  assert.equal(u.hp, hp);
});
test("heavy melee causes bleed; moving worsens it and cleansing removes it", () => {
  const { battle, u, t } = arena("pyrehorn");
  t.x = t.px = 350;
  battle.cast(u, u.loadout.auto, t);
  tick(battle, 0.36);
  assert.ok(t.bleed > 0);
  const before = t.hp;
  t.motion = 1;
  tick(battle, 0.04);
  assert.ok(t.hp < before);
  battle.cleanse(t);
  assert.equal(t.bleed, 0);
  assert.equal(battle.metrics.cleanses, 1);
});
test("dash attacks travel through the arena instead of instantly moving onto a target", () => {
  const { battle, u, t } = arena();
  t.x = t.px = 570;
  battle.cast(u, "cinderfox", t);
  assert.equal(u.x, 300);
  assert.equal(t.damageTaken, 0);
  tick(battle, 0.28);
  assert.ok(u.x > 300 && u.x < 530);
  assert.equal(t.damageTaken, 0);
  tick(battle, 0.5);
  assert.ok(t.damageTaken > 0);
});
test("death risk follows rarity, and hospital, drills and evolution stack transparently", () => {
  const run = makeRun(1);
  const ids = ["cinderfox", "pyrehorn", "thornstag", "solwyrm", "elderoot"];
  const risks = ids.map((id) => casualtyRisk(run, creature(id)));
  for (let i = 1; i < risks.length; i++) assert.ok(risks[i] < risks[i - 1]);
  const c = run.team[0];
  run.fieldHospital = 3;
  c.survivalTraining = 2;
  c.evolution = 1;
  assert.ok(
    Math.abs(
      casualtyRisk(run, c) - CASUALTY_RISK.Common * 0.7 ** 3 * 0.75 ** 2 * 0.85,
    ) < 1e-10,
  );
});
test("hospital and survival upgrades charge once, cap tiers, and reject unaffordable purchases", () => {
  const run = makeRun(2);
  run.gold = 1000;
  for (let i = 0; i < 3; i++) {
    const { cost } = hospitalOffer(run),
      gold = run.gold;
    assert.equal(upgradeHospital(run), true);
    assert.equal(run.gold, gold - cost);
  }
  const gold = run.gold;
  assert.equal(upgradeHospital(run), false);
  assert.equal(run.gold, gold);
  assert.equal(trainSurvival(run, 0), true);
  assert.equal(trainSurvival(run, 0), true);
  assert.equal(trainSurvival(run, 0), false);
  assert.equal(trainSurvival(run, 50), false);
  const poor = makeRun(3);
  poor.gold = 0;
  assert.equal(upgradeHospital(poor), false);
  assert.equal(trainSurvival(poor, 0), false);
});
test("defeat chooses one active ally, permanently removes an individual and recovers its gems exactly once", () => {
  const run = makeRun(4);
  for (let i = 0; i < run.team.length; i++) {
    const gem = personalRelic("quick-shard");
    run.inventory.push(gem);
    equipRelic(run, i, gem.uid);
    linkRelic(run, i, 0, "auto-" + run.team[i].id);
  }
  let outcome;
  for (let seed = 1; seed < 100; seed++) {
    const copy = structuredClone({ ...run, random: undefined });
    const result = settleDefeat(copy, "battle", seed);
    if (result.lost) {
      outcome = { copy, result, seed };
      break;
    }
  }
  assert.ok(outcome);
  const { copy, result, seed } = outcome;
  assert.equal(copy.team.length, 5);
  assert.equal(copy.fallen.length, 1);
  assert.ok(!copy.team.some((c) => c.uid === result.uid));
  assert.ok(
    copy.inventory.some(
      (g) => g.uid === run.team.find((c) => c.uid === result.uid).relics[0].uid,
    ),
  );
  const snapshot = structuredClone(copy);
  assert.deepEqual(settleDefeat(copy, "battle", seed + 999), result);
  assert.deepEqual(copy, snapshot);
  const loaded = JSON.parse(JSON.stringify(copy));
  assert.deepEqual(settleDefeat(loaded, "battle", 0), result);
  assert.equal(loaded.fallen.length, 1);
});
test("reserves keep their earned progression and replace casualties without creating duplicate cells", () => {
  const run = makeRun(5);
  run.team.forEach((c, i) => (c.deployment = defaultDeployment(c, i)));
  run.team.splice(2, 1);
  const reserve = creature("starborn", 8);
  reserve.evolution = 2;
  reserve.evolutionPath = "wild";
  reserve.survivalTraining = 2;
  reserve.relics = [personalRelic("quick-shard")];
  run.bench = [reserve];
  assert.equal(deployReserve(run, 0), true);
  assert.equal(run.team.length, 6);
  assert.equal(run.bench.length, 0);
  assert.equal(run.team[5], reserve);
  assert.equal(reserve.survivalTraining, 2);
  assert.equal(reserve.evolution, 2);
  assert.equal(
    new Set(run.team.map((c) => `${c.deployment.row}:${c.deployment.column}`))
      .size,
    6,
  );
  assert.equal(deployReserve(run, 0), false);
});

test("protection changes casualty outcomes on matched seeds without changing the chosen ally", () => {
  const template = makeRun(22);
  let plainLosses = 0,
    protectedLosses = 0;
  for (let seed = 1; seed <= 400; seed++) {
    const plain = structuredClone({ ...template, random: undefined }),
      protectedRun = structuredClone({ ...template, random: undefined });
    protectedRun.fieldHospital = 3;
    protectedRun.team.forEach((c) => {
      c.survivalTraining = 2;
      c.evolution = 1;
    });
    const a = settleDefeat(plain, "matched", seed),
      b = settleDefeat(protectedRun, "matched", seed);
    assert.equal(a.uid, b.uid);
    if (b.lost) assert.equal(a.lost, true);
    plainLosses += a.lost;
    protectedLosses += b.lost;
  }
  assert.ok(plainLosses > 150);
  assert.ok(protectedLosses < plainLosses / 3);
});

function makeRun(seed,ids,options={}){return legacyMakeRun(seed,ids,{...options,rulesVersion:11});}
