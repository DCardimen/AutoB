import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  makeRun,
  generateRoute,
  encounter,
  STARTERS,
  creature,
  settleDefeat,
  personalRelic,
} from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [],
  report = { checks: [] },
  base = process.env.BASE_URL || "http://127.0.0.1:3000";
async function fixture(run, phase = "prep") {
  run.route ||= generateRoute(run);
  const node = run.route[run.depth][0];
  if (phase === "rest") node.type = "rest";
  run.encounterType = node.type;
  const { random, ...data } = run;
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.addInitScript(
    (save) => {
      if (!localStorage.getItem("starfall-menagerie-v1"))
        localStorage.setItem("starfall-menagerie-v1", JSON.stringify(save));
    },
    {
      profile: { owned: [...STARTERS, "pipthorn"], runs: 1, tutorial: true },
      run: data,
      node,
      foes: encounter(run, node.type, node.seed),
      phase,
    },
  );
  await page.goto(base);
  await page.waitForFunction(() =>
    document.querySelector("[data-creature] img")?.src.startsWith("data:"),
  );
  return page;
}
const careRun = makeRun(13);
careRun.gold = 1000;
const care = await fixture(careRun);
await care.locator('[data-action="field-care"]').click();
assert.match(await care.locator(".casualty-rarities").innerText(), /65%/);
await care.locator('[data-action="hospital-upgrade"]').click();
assert.equal(await care.evaluate(() => starfall.state.run.fieldHospital), 1);
assert.equal(await care.evaluate(() => starfall.state.run.gold), 935);
await care.locator('[data-action="care-creature-0"]').click();
await care.locator('[data-action="survival-0"]').click();
assert.equal(
  await care.evaluate(() => starfall.state.run.team[0].survivalTraining),
  1,
);
assert.equal(await care.evaluate(() => starfall.state.run.gold), 905);
assert.match(
  await care.locator(".survival-panel > strong").innerText(),
  /34.1%/,
);
await care.reload();
assert.equal(await care.evaluate(() => starfall.state.run.fieldHospital), 1);
assert.equal(
  await care.evaluate(() => starfall.state.run.team[0].survivalTraining),
  1,
);
await care.setViewportSize({ width: 390, height: 844 });
await care.locator('[data-action="field-care"]').click();
await care.waitForFunction(
  () =>
    Number(
      getComputedStyle(document.querySelector(".modal-backdrop")).opacity,
    ) > 0.99,
);
assert.ok(
  await care.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await care.screenshot({
  path: "playtest-artifacts/mobile-survival-v4.png",
  fullPage: true,
});
report.checks.push(
  "Rarity odds, paid hospital and personal drills, save reload and 390px care layout",
);
await care.close();
let defeatRun, expected;
for (let seed = 1; seed < 100; seed++) {
  const run = makeRun(seed);
  run.planet = 2;
  run.depth = 5;
  run.route = generateRoute(run);
  const node = run.route[5][0];
  const outcome = settleDefeat(
    structuredClone({ ...run, random: undefined }),
    `${node.id}:1`,
    node.seed + 9973,
  );
  if (outcome.lost) {
    defeatRun = run;
    expected = outcome;
    break;
  }
}
defeatRun.bench = [creature("pipthorn", 4)];
const victim = defeatRun.team.find((c) => c.uid === expected.uid),
  gem = personalRelic("quick-shard");
victim.relics = [{ ...gem, link: "auto-" + victim.id }];
defeatRun.inventory = [];
const loss = await fixture(defeatRun);
await loss.clock.install();
await loss.locator('[data-speed="3"]').click();
await loss.locator('[data-action="battle"]').click();
const committed = await loss.evaluate(
  () => starfall.state.run.defeatReservation,
);
for (let i = 0; i < 60; i++) {
  if (await loss.evaluate(() => starfall.state.phase !== "battle")) break;
  await loss.clock.runFor(1000);
}
assert.equal(await loss.evaluate(() => starfall.state.phase), "reward");
assert.equal(await loss.evaluate(() => starfall.state.battle.winner), 1);
assert.equal(await loss.evaluate(() => starfall.state.run.team.length), 5);
assert.equal(await loss.evaluate(() => starfall.state.run.fallen.length), 1);
assert.equal(
  await loss.evaluate(() => starfall.state.run.fallen[0].uid),
  expected.uid,
);
assert.match(
  await loss.locator(".casualty-result.lost").innerText(),
  /Lost permanently/,
);
assert.ok(
  await loss.evaluate(
    (uid) => starfall.state.run.inventory.some((g) => g.uid === uid),
    gem.uid,
  ),
);
assert.ok(
  await loss.evaluate(
    (id) => starfall.state.profile.owned.includes(id),
    expected.id,
  ),
);
await loss.reload();
await loss.clock.runFor(300);
assert.equal(await loss.evaluate(() => starfall.state.run.fallen.length), 1);
assert.equal(await loss.evaluate(() => starfall.state.run.team.length), 5);
assert.deepEqual(
  await loss.evaluate(() => starfall.state.run.defeatReservation),
  committed,
);
await loss.locator('.casualty-result [data-action="reserves"]').click();
await loss.locator('[data-deploy-reserve="0"]').click();
assert.equal(await loss.evaluate(() => starfall.state.run.team.length), 6);
assert.equal(await loss.evaluate(() => starfall.state.run.bench.length), 0);
assert.ok(
  await loss.evaluate(() =>
    starfall.state.run.team.some((c) => c.id === "pipthorn" && c.level === 4),
  ),
);
await loss.locator('[data-action="close"]').first().click();
await loss.locator('[data-action="reward"]').click();
await loss.locator('[data-action="continue"]').click();
assert.equal(await loss.evaluate(() => starfall.state.phase), "prep");
assert.equal(await loss.evaluate(() => starfall.state.run.depth), 5);
assert.equal(
  await loss.evaluate(() => starfall.state.run.defeatReservation),
  null,
);
await loss.reload();
await loss.clock.runFor(300);
assert.ok(
  await loss.evaluate(
    (uid) => !starfall.state.run.team.some((c) => c.uid === uid),
    expected.uid,
  ),
);
report.casualty = await loss.evaluate(() => starfall.state.run.fallen[0]);
report.checks.push(
  "Actual boss defeat permanently removes one ally, recovers gems, preserves the family, persists one result and deploys an earned reserve",
);
await loss.close();
const restRun = makeRun(49);
restRun.depth = 2;
restRun.gold = 0;
const rest = await fixture(restRun, "rest");
await rest.locator('[data-action="rest-care"]').click();
assert.equal(await rest.evaluate(() => starfall.state.run.fieldHospital), 1);
assert.equal(await rest.evaluate(() => starfall.state.run.depth), 3);
assert.equal(await rest.evaluate(() => starfall.state.run.gold), 0);
report.checks.push(
  "A rest offers a free hospital tier instead of another reward",
);
await rest.close();
const physical = await fixture(makeRun(3));
await physical.clock.install();
await physical.locator('[data-action="battle"]').click();
for (let i = 0; i < 60; i++) {
  await physical.clock.runFor(200);
  if (
    await physical.evaluate(
      () =>
        starfall.state.battle.metrics.physicalHits > 0 &&
        starfall.state.battle.metrics.rolls > 0 &&
        starfall.state.battle.metrics.collisions > 0 &&
        starfall.state.battle.strikes.length > 0,
    )
  )
    break;
}
assert.equal(await physical.evaluate(() => starfall.state.phase), "battle");
assert.ok(
  await physical.evaluate(
    () =>
      starfall.state.battle.metrics.physicalHits > 0 &&
      starfall.state.battle.metrics.collisions > 0 &&
      starfall.state.battle.metrics.rolls > 0,
  ),
);
await physical.locator('[data-action="pause"]').click();
const positions = await physical.evaluate(() =>
  starfall.state.battle.units.map((u) => ({
    x: u.x,
    y: u.y,
    stamina: u.stamina,
  })),
);
await physical.clock.runFor(300);
assert.deepEqual(
  await physical.evaluate(() =>
    starfall.state.battle.units.map((u) => ({
      x: u.x,
      y: u.y,
      stamina: u.stamina,
    })),
  ),
  positions,
);
await physical.screenshot({
  path: "playtest-artifacts/physical-arena-v4.png",
  fullPage: true,
});
report.physics = await physical.evaluate(() => starfall.state.battle.metrics);
report.checks.push(
  "Rendered arena performs physical hits, body collision, reactive rolls and visible windups; pause freezes physics",
);
await physical.close();
assert.deepEqual(errors, []);
report.errors = errors;
fs.writeFileSync(
  "playtest-artifacts/arena-browser-report.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
