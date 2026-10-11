import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  makeRun,
  generateRoute,
  encounter,
  STARTERS,
  SPECIES,
  BY_ID,
} from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const base = process.env.BASE_URL || "http://127.0.0.1:3000",
  errors = [],
  report = { checks: [] };
async function fixture(run, phase = "prep", profile = {}, eventIndex = 0) {
  run.route ||= generateRoute(run);
  const node = run.route[run.depth][0];
  if (phase === "shop") node.type = "shop";
  if (phase === "event") node.type = "event";
  run.encounterType = node.type;
  const foes = encounter(run, node.type, node.seed),
    { random, ...data } = run;
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.addInitScript(
    ({ data, node, foes, phase, profile, STARTERS, eventIndex }) => {
      if (!localStorage.getItem("starfall-menagerie-v1"))
        localStorage.setItem(
          "starfall-menagerie-v1",
          JSON.stringify({
            profile: { owned: STARTERS, runs: 1, tutorial: true, ...profile },
            run: data,
            node,
            foes,
            phase,
            eventIndex,
          }),
        );
    },
    { data, node, foes, phase, profile, STARTERS, eventIndex },
  );
  await page.goto(base);
  await page.waitForFunction(() =>
    document.querySelector("[data-creature] img")?.src.startsWith("data:"),
  );
  return page;
}
async function finish(page) {
  for (let i = 0; i < 50; i++) {
    if (await page.evaluate(() => starfall.state.phase !== "battle")) break;
    await page.clock.runFor(1000);
  }
  assert.equal(await page.evaluate(() => starfall.state.phase), "reward");
}
// Fresh-player controls, actual deployed positions, AI policy, and orb reservation on reload.
const page = await fixture(makeRun(77));
await page.locator("#new-run").click();
assert.ok(await page.locator('[data-difficulty="chaos"]').isDisabled());
await page.locator('[data-difficulty="veteran"]').click();
assert.ok(
  await page
    .locator('[data-difficulty="veteran"]')
    .evaluate((e) => e.classList.contains("selected")),
);
await page.locator('[data-action="close"]').first().click();
report.checks.push(
  "Chaos is locked for a fresh profile; selectable base difficulties",
);
await page.locator('[data-action="formation"]').click();
await page.locator('[data-formation-unit="0"]').click();
await page.locator('[data-deploy="0:0"]').click();
await page.locator('[data-policy="0"]').selectOption("healer");
assert.equal(await page.locator(".deployment-grid").count(), 1);
await page.locator('[data-action="close"]').first().click();
assert.deepEqual(
  await page.evaluate(() => starfall.state.run.team[0].deployment),
  { row: 0, column: 0 },
);
assert.equal(
  await page.evaluate(() => starfall.state.run.team[0].policy),
  "healer",
);
report.checks.push(
  "Grid deployment and per-creature AI policy work through the UI",
);
const uid = await page
  .locator("#capture-target option")
  .nth(1)
  .getAttribute("value");
await page.locator("#capture-target").selectOption(uid);
await page.locator("#capture-mode").selectOption("mercy");
await page.clock.install();
await page.locator('[data-action="battle"]').click();
assert.equal(await page.evaluate(() => starfall.state.run.orbs), 4);
await page.reload();
await page.clock.runFor(100);
assert.equal(await page.evaluate(() => starfall.state.phase), "prep");
assert.equal(await page.evaluate(() => starfall.state.run.orbs), 4);
assert.ok(await page.locator("#capture-target").isDisabled());
await page.locator('[data-speed="3"]').click();
await page.locator('[data-action="battle"]').click();
assert.equal(await page.evaluate(() => starfall.state.run.orbs), 4);
await finish(page);
const capture = await page.evaluate(
  () => starfall.state.run.captureReservation.result,
);
assert.ok(capture);
assert.ok(capture.chance > 0);
const before = await page.evaluate(() => ({
  orbs: starfall.state.run.orbs,
  bench: starfall.state.run.bench.length,
  owned: starfall.state.profile.owned.length,
}));
await page.reload();
await page.clock.runFor(100);
assert.deepEqual(
  await page.evaluate(() => ({
    orbs: starfall.state.run.orbs,
    bench: starfall.state.run.bench.length,
    owned: starfall.state.profile.owned.length,
  })),
  before,
);
assert.ok(await page.locator('[data-action="capture"]').isDisabled());
report.capture = capture;
report.checks.push(
  "Tactical capture consumes one orb across reloads and persists its result",
);
await page.locator('[data-action="close"]').count();
await page.locator('[data-action="report"]').last().click();
assert.ok(await page.locator(".report-advice p").count());
await page.locator('[data-action="close"]').first().click();
report.checks.push("Actionable battle report renders actual damage causes");
await page.close();
// A deterministic advanced encounter fixture verifies real victory → Chaos unlock → adoption.
const endRun = makeRun(91);
endRun.planet = 2;
endRun.depth = 5;
endRun.team.forEach((c) => {
  c.level = 9;
  c.training = 4;
  c.evolution = 2;
  c.evolutionPath = ["Guardian", "Support"].includes(BY_ID[c.id].role)
    ? "warden"
    : "wild";
});
endRun.route = generateRoute(endRun);
const end = await fixture(endRun);
await end.clock.install();
await end.locator('[data-speed="3"]').click();
await end.locator('[data-action="battle"]').click();
await finish(end);
assert.equal(await end.evaluate(() => starfall.state.battle.winner), 0);
await end.locator('[data-upgrade="training"]').click();
await end.locator('[data-action="continue"]').click();
assert.equal(await end.evaluate(() => starfall.state.profile.chaosUnlocked), 1);
assert.equal(await end.evaluate(() => starfall.state.profile.starlight), 3);
await end.locator(".chaos-victory").waitFor();
assert.equal(await end.locator(".chaos-victory").count(), 1);
await end.locator('[data-action="end-collection"]').click();
await end.locator('[data-action="legendary-adopt"]').click();
await end.locator("[data-adopt]:not(:disabled)").first().click();
assert.equal(await end.evaluate(() => starfall.state.profile.starlight), 0);
assert.ok(
  await end.evaluate(() =>
    starfall.state.profile.owned.some((id) =>
      [
        "elderoot",
        "starborn",
        "starborn",
        "abyssal",
        "phoenix",
        "worldtortoise",
        "leviacrown",
        "thunderroc",
        "eclipsaur",
      ].includes(id),
    ),
  ),
);
report.checks.push(
  "Real boss victory unlocks Chaos 1 and earns a permanent Legendary adoption",
);
await end.close();
// Cumulative Chaos rules, price display versus purchase, and guaranteed Legendary beacon.
const shopRun = makeRun(111, STARTERS, { difficulty: "chaos", chaos: 20 });
shopRun.gold = 600;
shopRun.depth = 1;
const shop = await fixture(shopRun, "shop", {
  chaosUnlocked: 20,
  chaosCleared: 19,
});
await shop.locator('[data-action="buy-beacon"]').click();
assert.equal(await shop.evaluate(() => starfall.state.run.gold), 501);
assert.equal(await shop.evaluate(() => starfall.state.run.legendaryLure), true);
await shop.locator('[data-action="buy-legendary"]').click();
assert.equal(await shop.evaluate(() => starfall.state.run.gold), 182);
assert.equal(await shop.evaluate(() => starfall.state.run.bench.length), 1);
assert.ok(await shop.locator('[data-action="buy-legendary"]').isDisabled());
await shop.locator('[data-action="leave-node"]').click();
await shop.locator("#new-run").click();
await shop.locator('[data-difficulty="chaos"]').click();
await shop.locator("#chaos-tier").selectOption("20");
assert.equal(await shop.locator(".chaos-rules li").count(), 20);
await shop.locator('[data-action="confirm-run"]').click();
assert.equal(await shop.evaluate(() => starfall.state.run.chaos), 20);
assert.equal(await shop.evaluate(() => starfall.state.run.integrity), 2);
assert.equal(await shop.evaluate(() => starfall.state.run.orbs), 4);
report.checks.push(
  "Chaos 20 applies twenty rules and correct starting resources; shop prices match deductions",
);
await shop.setViewportSize({ width: 390, height: 844 });
await shop.locator('[data-action="formation"]').click();
assert.ok(
  await shop.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await shop.screenshot({
  path: "playtest-artifacts/mobile-deployment-v3.png",
  fullPage: true,
});
await shop.locator('[data-action="close"]').first().click();
await shop.locator("#new-run").click();
assert.ok(
  await shop.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await shop.screenshot({
  path: "playtest-artifacts/mobile-chaos-v3.png",
  fullPage: true,
});
report.checks.push(
  "390px deployment and Chaos selection fit without horizontal overflow",
);
await shop.close();
const mastered = await fixture(makeRun(115), "prep", {
  owned: [...STARTERS, "elderoot", "starborn"],
  bonds: { elderoot: 5, starborn: 5 },
});
await mastered.locator("#new-run").click();
for (const id of STARTERS)
  await mastered.locator(`[data-starter="${id}"]`).click();
for (const id of [
  "elderoot",
  "starborn",
  "cinderfox",
  "mossguard",
  "brookfin",
  "voltwing",
])
  await mastered.locator(`[data-starter="${id}"]`).click();
assert.match(await mastered.locator(".starter-budget").innerText(), /12 \/ 12/);
await mastered.locator('[data-action="confirm-run"]').click();
assert.equal(
  await mastered.evaluate(
    () => starfall.state.run.team.filter((c) => c.bond === 5).length,
  ),
  2,
);
assert.ok(
  await mastered.evaluate(() =>
    starfall.state.run.team.every((c) => c.level === 1 && c.evolution === 0),
  ),
);
report.checks.push(
  "Two mastered Legendary starters fit the twelve-point budget and retain bond bonuses",
);
await mastered.close();
const poorRun = makeRun(117);
poorRun.depth = 2;
poorRun.gold = 0;
poorRun.orbs = 0;
const poor = await fixture(poorRun, "event", {}, 8);
assert.equal(await poor.locator("[data-event]:not(:disabled)").count(), 0);
await poor.locator('[data-action="leave-event"]').click();
assert.equal(await poor.evaluate(() => starfall.state.run.depth), 3);
report.checks.push(
  "Unaffordable events always allow declining; no resource softlock",
);
await poor.close();
assert.deepEqual(errors, []);
report.errors = errors;
fs.writeFileSync(
  "playtest-artifacts/overhaul-browser-report.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
