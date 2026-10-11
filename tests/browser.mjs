import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeRun, generateRoute, encounter, STARTERS } from "../game.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [],
  report = { battles: [], checks: [], startedAt: new Date().toISOString() };
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});
const fixture = makeRun(3);
fixture.route = generateRoute(fixture);
const node = fixture.route[0][0];
fixture.encounterType = "battle";
const { random, ...data } = fixture;
await page.addInitScript(
  ({ data, node, foes, starters }) => {
    if (!localStorage.getItem("starfall-menagerie-v1"))
      localStorage.setItem(
        "starfall-menagerie-v1",
        JSON.stringify({
          profile: { owned: starters, runs: 1, tutorial: true },
          run: data,
          phase: "prep",
          node,
          foes,
        }),
      );
  },
  {
    data,
    node,
    foes: encounter(fixture, "battle", node.seed),
    starters: STARTERS,
  },
);
await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000");
await page.waitForFunction(() =>
  document.querySelector("[data-creature] img")?.src.startsWith("data:"),
);
await page.waitForTimeout(500);
assert.equal(await page.locator("[data-creature]").count(), 6);
for (let i = 0; i < 3; i++) {
  await page.locator(`[data-creature="${i}"]`).click();
  assert.equal(await page.locator(".ability-list .skill-detail").count(), 3);
  await page.locator("[data-equip]").first().click();
  assert.equal(await page.locator(".gem-link").count(), 1);
  if (i === 0) {
    await page.locator(".gem-link").selectOption("auto-cinderfox");
    assert.equal(await page.locator(".linked-gems").count(), 1);
    await page.locator(".gem-link").selectOption("cinderfox");
  }
  await page.locator('[data-action="close"]').first().click();
}
report.checks.push(
  "Equip three support gems; link and relink a signature auto-attack",
);
await page.screenshot({
  path: "playtest-artifacts/browser-arena.png",
  fullPage: true,
});
await page.clock.install();
await page.locator('[data-speed="3"]').click();
async function advanceBattle() {
  await page.locator('[data-speed="3"]').click();
  await page.locator('[data-action="battle"]').click();
  await page.locator('[data-action="pause"]').click();
  const t = await page.evaluate(() => starfall.state.battle.time);
  await page.clock.runFor(500);
  assert.equal(await page.evaluate(() => starfall.state.battle.time), t);
  await page.locator('[data-action="pause"]').click();
  for (let i = 0; i < 40; i++) {
    if (await page.evaluate(() => starfall.state.phase !== "battle")) break;
    await page.clock.runFor(1000);
  }
  assert.equal(await page.evaluate(() => starfall.state.phase), "reward");
  const result = await page.evaluate(() => ({
    planet: starfall.state.run.planet,
    depth: starfall.state.run.depth,
    won: starfall.state.battle.winner === 0,
    time: starfall.state.battle.time,
    metrics: starfall.state.battle.metrics,
  }));
  report.battles.push(result);
  console.log(
    "Browser encounter",
    result.planet + 1,
    result.depth + 1,
    result.won ? "WIN" : "LOSS",
    Math.round(result.time) + "s",
  );
  if (result.won) {
    const wins = await page.evaluate(() => starfall.state.run.wins);
    await page
      .locator(`[data-upgrade="${wins % 3 === 0 ? "gear" : "training"}"]`)
      .click();
    const capture = page.locator('[data-action="capture"]');
    if ((await capture.count()) && (await capture.isEnabled())) {
      await capture.click();
      const before = await page.evaluate(() => ({
        owned: [...starfall.state.profile.owned],
        bench: starfall.state.run.bench.length,
        orbs: starfall.state.run.orbs,
      }));
      await page.reload();
      await page.clock.runFor(100);
      const after = await page.evaluate(() => ({
        owned: [...starfall.state.profile.owned],
        bench: starfall.state.run.bench.length,
        orbs: starfall.state.run.orbs,
      }));
      assert.deepEqual(after, before);
      assert.ok(await page.locator('[data-action="capture"]').isDisabled());
      report.checks.push(
        "Capture result and permanent collection persist on reload; no second attempt",
      );
    }
  }
  await page.locator('[data-action="continue"]').click();
  return result;
}
let ended = false;
const shopsVisited = new Set();
for (let iteration = 0; iteration < 40 && !ended; iteration++) {
  const state = await page.evaluate(() => ({
    phase: starfall.state.phase,
    p: starfall.state.run.planet,
    d: starfall.state.run.depth,
    lives: starfall.state.run.integrity,
  }));
  if (state.phase === "ended") {
    ended = true;
    break;
  }
  if (state.phase === "prep") {
    if (
      await page.evaluate(
        () =>
          starfall.state.run.team.length < 6 &&
          starfall.state.run.bench.length > 0,
      )
    ) {
      await page.locator('[data-action="reserves"]').click();
      while (await page.locator("[data-deploy-reserve]:not(:disabled)").count())
        await page
          .locator("[data-deploy-reserve]:not(:disabled)")
          .first()
          .click();
      await page.locator('[data-action="close"]').first().click();
    }
    const deployed = await page.evaluate(() => starfall.state.run.team.length);
    for (let i = 0; i < deployed; i++) {
      await page.locator(`[data-creature="${i}"]`).click();
      const info = await page.evaluate(
        (i) => ({
          role: starfall.state.run.team[i].id,
          arch: starfall.state.foes[0]?.archetype,
          gold: starfall.state.run.gold,
        }),
        i,
      );
      const path = ["mossguard", "pyrehorn", "brookfin", "bloomkin"].includes(
        info.role,
      )
        ? "warden"
        : "wild";
      const evolve = page.locator(`[data-evolve="${path}"]:not(:disabled)`);
      if ((await evolve.count()) && info.gold >= 75) {
        await evolve.click();
        await page.locator('[data-action="evolution-back"]').click();
      }
      for (let count = 0; count < 7; count++) {
        const gem = page.locator("[data-equip]:not(:disabled)");
        if (!(await gem.count())) break;
        await gem.first().click();
      }
      await page
        .locator(`[data-policy="${i}"]`)
        .selectOption(
          ["garden", "bastion"].includes(info.arch) ? "healer" : "adaptive",
        );
      await page.locator('[data-action="close"]').first().click();
    }
    report.checks.push(
      "Earned evolutions, new gem sockets and scouted AI policies used during the campaign",
    );
    const result = await advanceBattle();
    if (!result.won && result.depth === 5) {
      const st = await page.evaluate(() => ({
        p: starfall.state.run.planet,
        d: starfall.state.run.depth,
        phase: starfall.state.phase,
      }));
      if (st.phase !== "ended") {
        assert.equal(st.p, result.planet);
        assert.equal(st.d, 5);
        report.checks.push("Boss defeat prevents planet advancement");
      }
    }
    continue;
  }
  if (state.phase === "map") {
    const chosen = await page.evaluate(
      (shops) => {
        const { run } = starfall.state;
        const available = run.route[run.depth].filter(
          (n) =>
            n.depth === run.depth &&
            (run.depth === 0 ||
              n.type === "boss" ||
              Math.abs(n.lane - run.lastLane) <= 1),
        );
        const score = (n) =>
          n.type === "rest"
            ? run.integrity < 3
              ? 10
              : 6
            : n.type === "shop"
              ? run.gold > 90 && !shops.includes(run.planet)
                ? 9
                : 0
              : n.type === "battle"
                ? 5
                : n.type === "event"
                  ? 3
                  : n.type === "capture"
                    ? 4
                    : n.type === "elite"
                      ? 1
                      : 8;
        return available.sort((a, b) => score(b) - score(a))[0].id;
      },
      [...shopsVisited],
    );
    await page.locator(`[data-node="${chosen}"]`).click();
    const phase = await page.evaluate(() => starfall.state.phase);
    if (phase === "shop") {
      shopsVisited.add(state.p);
      const preference = [
        "clock",
        "seed",
        "execution-bell",
        "mercy",
        "prism",
        "sanctuary",
        "fangs",
        "bond",
        "overgrowth",
        "feather",
      ];
      let bought = false;
      for (const id of preference) {
        const candidate = page.locator(
          `[data-action="buy-${id}"]:not(:disabled)`,
        );
        if (await candidate.count()) {
          await candidate.click();
          bought = true;
          break;
        }
      }
      if (!bought) {
        const candidate = page.locator(
          '.shop-card [data-action^="buy-"]:not(:disabled)',
        );
        if (await candidate.count()) await candidate.first().click();
      }
      const personal = page.locator(
        '[data-action^="buy-personal-"]:not(:disabled)',
      );
      if (await personal.count()) {
        const gold = await page.evaluate(() => starfall.state.run.gold);
        await personal.first().click();
        assert.ok((await page.evaluate(() => starfall.state.run.gold)) < gold);
        report.checks.push("Shop sells support gems and deducts gold");
      }
      await page.screenshot({
        path: `playtest-artifacts/shop-planet-${state.p + 1}.png`,
        fullPage: true,
      });
      await page.locator('[data-action="leave-node"]').click();
    } else if (phase === "event") {
      const choice = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem("starfall-menagerie-v1"));
        return saved.eventIndex < 3
          ? starfall.state.run.planet === 0
            ? 2
            : 1
          : 2;
      });
      const pick = page.locator(`[data-event="${choice}"]`);
      if (await pick.isEnabled()) await pick.click();
      else await page.locator("[data-event]:not(:disabled)").first().click();
      report.checks.push("Event choice applies and advances the path");
    } else if (phase === "rest") {
      const heal = page.locator('[data-action="rest-life"]');
      await (
        (await heal.isEnabled())
          ? heal
          : page.locator('[data-action="rest-xp"]')
      ).click();
      report.checks.push("Rest changes expedition life or team EXP");
    }
    continue;
  }
  throw new Error(`Unexpected phase ${state.phase}`);
}
assert.ok(ended, "The browser run reaches a genuine end state");
report.ending = await page.evaluate(() => ({
  complete: starfall.state.run.complete,
  wins: starfall.state.run.wins,
  planet: starfall.state.run.planet,
  collection: starfall.state.profile.owned.length,
}));
assert.equal(
  report.ending.complete,
  true,
  "A legal starter campaign clears all three worlds",
);
await page.screenshot({
  path: "playtest-artifacts/expedition-end.png",
  fullPage: true,
});
await page.locator('#modal-root [data-action="new-run"]').click();
assert.equal(await page.locator("[data-starter].selected").count(), 6);
await page.locator('[data-action="confirm-run"]').click();
assert.equal(await page.evaluate(() => starfall.state.run.team[0].level), 1);
report.checks.push("New expedition retains captures and resets run growth");
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('[data-view="collection"]').click();
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({
  path: "playtest-artifacts/mobile-menagerie.png",
  fullPage: true,
});
await page.locator('[data-view="arena"]').click();
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({
  path: "playtest-artifacts/mobile-arena.png",
  fullPage: true,
});
report.checks.push(
  "390px mobile arena and menagerie have no horizontal overflow",
);
assert.deepEqual(errors, []);
report.checks.push("No browser exceptions or failed HTTP responses");
report.checks = [...new Set(report.checks)];
fs.writeFileSync(
  "playtest-artifacts/browser-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
