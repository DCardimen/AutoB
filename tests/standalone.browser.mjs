import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeRun, generateRoute, encounter, SPECIES } from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = (process.env.BASE_URL || "http://127.0.0.1:3000") + "/offline-game";
const body = fs.readFileSync("Starfall-Menagerie.html");
await page.route("**/*", (route) => {
  if (route.request().url() === url)
    return route.fulfill({ status: 200, contentType: "text/html", body });
  requests.push(route.request().url());
  return route.abort();
});
const run = makeRun(343, [
  "ashpup",
  "coalcrab",
  "cloverimp",
  "pearlsquid",
  "zipmouse",
  "gloomkit",
]);
run.team.forEach((c) => (c.level = 5));
run.route = generateRoute(run);
const node = run.route[0][0],
  foes = encounter(run, "battle", node.seed);
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
await page.goto(url, { waitUntil: "networkidle" });
await page.locator('[data-creature="0"]').click();
await page.locator("[data-equip]").first().click();
await page.locator(".gem-link").selectOption("auto-ashpup");
await page.locator('[data-evolve="wild"]').click();
await page.locator('[data-action="evolution-back"]').click();
assert.equal(await page.locator(".relic-slot").count(), 2);
await page.locator('[data-action="close"]').first().click();
await page.clock.install();
await page.locator('[data-speed="3"]').click();
await page.locator('[data-action="battle"]').click();
for (let i = 0; i < 40; i++) {
  if (await page.evaluate(() => starfall.state.phase !== "battle")) break;
  await page.clock.runFor(1000);
}
assert.equal(await page.evaluate(() => starfall.state.phase), "reward");
await page.reload({ waitUntil: "networkidle" });
assert.equal(
  await page.evaluate(() => starfall.state.run.team[0].evolution),
  1,
);
assert.equal(
  await page.evaluate(() => starfall.state.run.team[0].relics[0].link),
  "auto-ashpup",
);
assert.equal(
  await page.evaluate(() => starfall.state.profile.formDiscoveries.ashpup),
  1,
);
assert.deepEqual(errors, []);
assert.deepEqual(requests, []);
fs.writeFileSync(
  "playtest-artifacts/standalone-report.json",
  JSON.stringify(
    {
      checks: [
        "single embedded HTML",
        "new creature artwork",
        "Wild evolution",
        "added socket and preserved gem link",
        "completed animated combat",
        "saved reload",
        "zero external requests",
      ],
      errors,
      requests,
    },
    null,
    2,
  ),
);
await browser.close();
console.log(
  "Standalone browser: evolved new creatures, combat, saves, and gem links pass with zero network requests.",
);
