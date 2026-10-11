import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  makeRun,
  creature,
  SPECIES,
  STARTERS,
  generateRoute,
} from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(r.status() + " " + r.url());
});
const run = makeRun(234, [
  "ashpup",
  "mossguard",
  "pearlsquid",
  "skyray",
  "worldtortoise",
  "gloomkit",
]);
run.team.forEach((c) => (c.level = 8));
run.gold = 1000;
run.route = generateRoute(run);
const node = run.route[0][0];
run.encounterType = "battle";
const foes = ["kilnram", "cloudlynx", "riftmoth", "floebear"].map((id) =>
  creature(id, 5),
);
foes[0].evolution = 1;
foes[0].evolutionPath = "warden";
const { random, ...data } = run;
await page.addInitScript(
  ({ data, node, foes, owned }) => {
    if (!localStorage.getItem("starfall-menagerie-v1"))
      localStorage.setItem(
        "starfall-menagerie-v1",
        JSON.stringify({
          profile: { owned, runs: 1, tutorial: true, formDiscoveries: {} },
          run: data,
          phase: "prep",
          node,
          foes,
        }),
      );
  },
  { data, node, foes, owned: SPECIES.map((s) => s.id) },
);
await page.goto((process.env.BASE_URL || "http://127.0.0.1:3000"), { waitUntil: "networkidle" });
await page.locator('[data-view="collection"]').click();
assert.equal(await page.locator("[data-codex]").count(), 60);
await page.locator('[data-view="arena"]').click();
await page.locator('[data-creature="0"]').click();
assert.equal(await page.locator(".evolution-form").count(), 3);
await page.locator("[data-equip]").first().click();
await page.locator(".gem-link").selectOption("auto-ashpup");
await page.locator('[data-evolve="wild"]').click();
await page.waitForTimeout(2200);
assert.equal(
  await page.locator(".evolution-reveal h2").innerText(),
  "Ashhowl.",
);
await page.screenshot({
  path: "playtest-artifacts/evolution-reveal.png",
  fullPage: true,
});
await page.locator('[data-action="evolution-back"]').click();
assert.equal(await page.locator(".relic-slot").count(), 2);
assert.equal(await page.locator(".gem-link").inputValue(), "auto-ashpup");
await page.locator('[data-evolve="wild"]').click();
assert.equal(
  await page.evaluate(() => starfall.state.run.team[0].evolution),
  2,
);
await page.locator('[data-action="evolution-back"]').click();
assert.equal(await page.locator(".relic-slot").count(), 3);
assert.equal(await page.locator(".gem-link").inputValue(), "auto-ashpup");
await page.locator('[data-action="close"]').first().click();
await page.locator('[data-creature="1"]').click();
await page.locator('[data-evolve="warden"]').click();
await page.locator('[data-action="evolution-back"]').click();
await page.screenshot({
  path: "playtest-artifacts/evolution-lineage.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({
  path: "playtest-artifacts/evolution-mobile.png",
  fullPage: true,
});
await page.locator('[data-action="close"]').first().click();
await page.setViewportSize({ width: 1440, height: 1050 });
assert.equal(await page.evaluate(() => starfall.state.run.gold), 800);
await page.clock.install();
await page.locator('[data-action="battle"]').click();
await page.clock.runFor(1200);
assert.ok(
  await page.evaluate(() =>
    starfall.state.battle.units.some((u) => u.motion > 0.1),
  ),
);
await page.locator('[data-action="pause"]').click();
const pose = () =>
  page.evaluate(async () => {
    const { creaturePose } = await import("../animation.js");
    const b = starfall.state.battle;
    return { time: b.time, pose: creaturePose(b.units[0], b.time) };
  });
const paused = await pose();
await page.clock.runFor(800);
assert.deepEqual(await pose(), paused);
await page.screenshot({
  path: "playtest-artifacts/animated-combat.png",
  fullPage: true,
});
await page.locator('[data-action="pause"]').click();
await page.locator('[data-speed="3"]').click();
for (let i = 0; i < 45; i++) {
  if (await page.evaluate(() => starfall.state.phase !== "battle")) break;
  await page.clock.runFor(1000);
}
assert.equal(await page.evaluate(() => starfall.state.phase), "reward");
assert.ok(await page.evaluate(() => starfall.state.battle.metrics.skills > 0));
await page.reload({ waitUntil: "networkidle" });
assert.equal(
  await page.evaluate(() => starfall.state.run.team[0].evolution),
  2,
);
assert.equal(
  await page.evaluate(() => starfall.state.run.team[1].evolutionPath),
  "warden",
);
assert.equal(
  await page.evaluate(() => starfall.state.profile.formDiscoveries.ashpup),
  2,
);
assert.equal(
  await page.evaluate(() => starfall.state.run.team[0].relics[0].link),
  "auto-ashpup",
);
assert.deepEqual(errors, []);
fs.writeFileSync(
  "playtest-artifacts/evolution-browser-report.json",
  JSON.stringify(
    {
      checks: [
        "60 codex entries",
        "Wild evolution and ascension",
        "Warden evolution",
        "new sockets and preserved auto-attack gem link",
        "transformation reveal",
        "390px mobile modal without overflow",
        "animated locomotion",
        "pause freezes deterministic pose",
        "completed rendered combat",
        "saved evolution and form discovery survive reload",
      ],
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
console.log("Evolution browser: 10 checks passed, no browser errors.");
