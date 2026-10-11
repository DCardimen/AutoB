import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeRun, generateRoute, encounter, STARTERS } from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const r = makeRun(42);
r.planet = 2;
r.depth = 5;
r.integrity = 2;
r.route = generateRoute(r);
r.encounterType = "boss";
const node = r.route[5][0];
const { random, ...run } = r;
await page.addInitScript(
  ({ run, node, foes, starters }) => {
    if (!localStorage.getItem("starfall-menagerie-v1"))
      localStorage.setItem(
        "starfall-menagerie-v1",
        JSON.stringify({
          profile: { owned: starters, runs: 1, tutorial: true },
          run,
          node,
          foes,
          phase: "prep",
        }),
      );
  },
  { run, node, foes: encounter(r, "boss", node.seed), starters: STARTERS },
);
await page.goto("http://127.0.0.1:3000");
await page.waitForTimeout(300);
await page.clock.install();
await page.locator('[data-speed="3"]').click();
await page.locator('[data-action="battle"]').click();
for (let i = 0; i < 32; i++) {
  if (await page.evaluate(() => starfall.state.phase !== "battle")) break;
  await page.clock.runFor(1000);
}
assert.equal(await page.evaluate(() => starfall.state.battle.winner), 1);
assert.equal(await page.evaluate(() => starfall.state.run.integrity), 1);
await page.locator('[data-action="continue"]').click();
assert.equal(await page.evaluate(() => starfall.state.phase), "prep");
assert.equal(await page.evaluate(() => starfall.state.run.planet), 2);
assert.equal(await page.evaluate(() => starfall.state.run.depth), 5);
assert.equal(await page.locator(".boss-banner").count(), 1);
await page.reload();
await page.clock.runFor(100);
assert.equal(await page.evaluate(() => starfall.state.run.integrity), 1);
assert.equal(await page.evaluate(() => starfall.state.run.depth), 5);
await page.screenshot({
  path: "playtest-artifacts/boss-retreat.png",
  fullPage: true,
});
assert.deepEqual(errors, []);
fs.writeFileSync(
  "playtest-artifacts/boss-regression.json",
  JSON.stringify(
    {
      passed: true,
      checks: [
        "Boss defeat consumes exactly one life",
        "Boss defeat does not advance planet or depth",
        "Retry state persists on reload",
        "Boss health UI appears",
      ],
      errors,
    },
    null,
    2,
  ),
);
console.log("Boss retreat, retry, persistence and health bar checks passed");
await browser.close();
