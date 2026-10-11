import fs from "node:fs";
import assert from "node:assert/strict";
import {
  SPECIES,
  PERSONAL_RELICS,
  makeRun,
  generateRoute,
  encounter,
  simulate,
  creature,
  personalRelic,
  equipRelic,
  linkRelic,
  canSupport,
  rng,
  pick,
  BY_ID,
  stats,
  RELICS,
  evolutionStage,
  relicSlots,
} from "../game.js";
import { loadoutFor } from "../skills.js";
import { POLICIES, chaosLevel } from "../tactics.js";
const requestedHours = Number(process.env.SIM_HOURS || 50);
const report = {
  kind: "Automated simulation, NOT human playtime",
  targetHours: requestedHours,
  battles: 0,
  seconds: 0,
  wins: 0,
  timeouts: 0,
  skills: 0,
  dodges: 0,
  echoes: 0,
  crits: 0,
  byPlanet: [0, 0, 0],
  minTime: Infinity,
  maxTime: 0,
  forms: [0, 0, 0],
  chaosTiers: Array(21).fill(0),
  tacticalCaptures: 0,
  weather: {},
  archetypes: {},
};
const start = performance.now();
while (report.seconds < requestedHours * 3600) {
  const seed = report.battles + 1001,
    r = rng(seed),
    run = makeRun(seed);
  run.difficulty =
    seed % 4 === 0 ? "chaos" : seed % 4 === 1 ? "veteran" : "standard";
  run.chaos = 1 + (Math.floor(seed / 4) % 20);
  run.planet = seed % 3;
  run.depth = seed % 6;
  run.team = Array.from({ length: 6 }, () =>
    creature(pick(SPECIES, r).id, 1 + run.planet * 2 + Math.floor(r() * 5)),
  );
  run.team.forEach((c) => {
    c.training = Math.floor(r() * 5);
    c.policy = pick(Object.keys(POLICIES), r);
    c.evolution =
      c.level >= 8
        ? Math.floor(r() * 3)
        : c.level >= 5
          ? Math.floor(r() * 2)
          : 0;
    c.evolutionPath = c.evolution ? (r() < 0.5 ? "wild" : "warden") : null;
    report.forms[evolutionStage(c)]++;
  });
  run.relics = RELICS.filter(() => r() < 0.2).map((v) => v.id);
  for (let index = 0; index < 6; index++) {
    const c = run.team[index],
      loadout = loadoutFor(BY_ID[c.id], c.level),
      gemCount = Math.floor(r() * (relicSlots(c) + 1));
    const options = PERSONAL_RELICS.filter((g) =>
      [loadout.auto, ...loadout.active].some((id) => canSupport(g.id, id)),
    );
    for (let j = 0; j < gemCount; j++) {
      const gem = options.splice(Math.floor(r() * options.length), 1)[0];
      const item = personalRelic(gem.id);
      run.inventory.push(item);
      assert.ok(equipRelic(run, index, item.uid));
      assert.ok(
        linkRelic(
          run,
          index,
          j,
          pick(
            [loadout.auto, ...loadout.active].filter((id) =>
              canSupport(item.id, id),
            ),
            r,
          ),
        ),
      );
    }
  }
  const type =
    run.depth === 5
      ? "boss"
      : seed % 7 === 0
        ? "elite"
        : seed % 5 === 0
          ? "capture"
          : "battle";
  run.route = generateRoute(run);
  const node = pick(run.route[run.depth], r);
  run.encounterType = type;
  const foes = encounter(run, type, node.seed);
  if (seed % 9 === 0)
    run.captureOrder = {
      uid: foes.find((f) => !f.boss)?.uid,
      mode: seed % 2 ? "mercy" : "swift",
    };
  const b = simulate(run, foes, seed);
  report.chaosTiers[chaosLevel(run)]++;
  report.tacticalCaptures += b.metrics.captures;
  report.weather[b.weather] = (report.weather[b.weather] || 0) + 1;
  report.archetypes[b.activeArchetype] =
    (report.archetypes[b.activeArchetype] || 0) + 1;
  assert.ok(b.done && Number.isFinite(b.time));
  for (const u of b.units) {
    assert.ok(Number.isFinite(u.hp) && u.hp >= 0 && u.hp <= u.maxHp);
    assert.ok(Number.isFinite(u.shield) && u.shield >= 0);
    assert.ok(Number.isFinite(u.x) && Number.isFinite(u.y));
  }
  report.battles++;
  report.seconds += b.time;
  report.wins += b.winner === 0;
  report.timeouts += b.time >= 90;
  report.skills += b.metrics.skills;
  report.dodges += b.metrics.dodges;
  report.echoes += b.metrics.echoes;
  report.crits += b.metrics.crits;
  report.byPlanet[run.planet]++;
  report.minTime = Math.min(report.minTime, b.time);
  report.maxTime = Math.max(report.maxTime, b.time);
  if (report.battles % 500 === 0)
    console.log(
      `${report.battles} seeded battles · ${(report.seconds / 3600).toFixed(1)} simulated combat hours`,
    );
}
report.simulatedHours = report.seconds / 3600;
report.executionSeconds = (performance.now() - start) / 1000;
report.winRate = report.wins / report.battles;
report.timeoutRate = report.timeouts / report.battles;
report.meanBattleSeconds = report.seconds / report.battles;
fs.mkdirSync("playtest-artifacts", { recursive: true });
fs.writeFileSync(
  "playtest-artifacts/simulation-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
