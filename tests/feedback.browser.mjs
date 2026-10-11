import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeRun, encounter, STARTERS, generateRoute } from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const run = makeRun(19),
  node = (run.route = generateRoute(run))[0][0],
  foes = encounter(run, node.type, node.seed);
await page.addInitScript(
  (save) => {
    if (!localStorage.getItem("starfall-menagerie-v1"))
      localStorage.setItem("starfall-menagerie-v1", JSON.stringify(save));
  },
  {
    profile: { owned: STARTERS, runs: 1, tutorial: true },
    run,
    node,
    foes,
    phase: "prep",
  },
);
await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000");
await page.locator("#sound").click();
assert.equal(
  await page.locator("#sound").getAttribute("aria-label"),
  "Mute sound",
);
const audio = await page.evaluate(async () => {
  const { Soundscape } = await import("/sound.js");
  const score = new Soundscape();
  score.begin(0, true);
  for (const element of ["ember", "grove", "tide", "storm", "void"]) {
    score.lastEffect = -10;
    score.event({ type: "skill", element, time: 10 });
  }
  for (const type of ["death", "phase", "capture"])
    score.event({ type, time: 12 });
  score.update(2, 0);
  const state = score.context?.state;
  score.setEnabled(false);
  const enabled = score.enabled;
  await score.context?.close();
  return { state, enabled };
});
assert.equal(audio.state, "running");
assert.equal(audio.enabled, false);
await page.locator('[data-action="motion"]').click();
assert.equal(
  await page.evaluate(() => starfall.state.profile.reducedMotion),
  true,
);
await page.reload();
assert.equal(
  await page.evaluate(() => starfall.state.profile.reducedMotion),
  true,
);
await page.locator('[data-action="formation"]').click();
await page.waitForFunction(
  () =>
    Number(
      getComputedStyle(document.querySelector(".modal-backdrop")).opacity,
    ) > 0.99,
);
await page.screenshot({ path: "playtest-artifacts/deployment-v3-visible.png" });
assert.deepEqual(errors, []);
const report = {
  checks: [
    "Optional audio starts after interaction and mutes",
    "All five elemental sounds, phase, death, capture and score execute",
    "Gentle motion persists after reload",
    "Deployment modal reaches full opacity",
  ],
  audio,
  errors,
};
fs.writeFileSync(
  "playtest-artifacts/feedback-browser-report.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
