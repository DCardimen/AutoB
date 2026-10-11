import fs from "node:fs";
import assert from "node:assert/strict";
import {
  makeRun,
  STARTERS,
  BY_ID,
  generateRoute,
  canVisit,
  enterNode,
  nextNode,
  encounter,
  simulate,
  rewardBattle,
  generateShop,
  buyRelic,
  personalRelic,
  PERSONAL_BY_ID,
  equipRelic,
  linkRelic,
  EVENTS,
  applyEvent,
  eventAvailable,
  gainXP,
  evolutionOffer,
  evolveCreature,
  rng,
  pick,
  PERSONAL_RELICS,
} from "../game.js";
import { shopPrice, chaosLevel } from "../tactics.js";
const builds = {
  balanced: STARTERS,
  venom: [
    "duskcap",
    "reedcobra",
    "pipthorn",
    "barkbeetle",
    "dewotter",
    "zipmouse",
  ],
  tide: [
    "coralisk",
    "brineclam",
    "brookfin",
    "dewotter",
    "coalcrab",
    "voltwing",
  ],
  assassins: [
    "nightmaw",
    "gloomkit",
    "onyxarmadillo",
    "dreamslug",
    "cinderfox",
    "brookfin",
  ],
};
const difficulties = [
    { difficulty: "story" },
    { difficulty: "standard" },
    { difficulty: "veteran" },
    { difficulty: "chaos", chaos: 10 },
    { difficulty: "chaos", chaos: 20 },
  ],
  results = [];
function equip(run) {
  for (const item of [...run.inventory]) {
    const heal = [
      "moonstone",
      "reservoir-gem",
      "cleanse-gem",
      "renewal-gem",
      "beacon-gem",
      "heartseed",
    ].includes(item.id);
    const tank = ["ward-stone", "bodyguard-gem", "ironbark"].includes(item.id);
    const indices = run.team
      .map((c, i) => i)
      .sort((a, b) => {
        const sa = BY_ID[run.team[a].id],
          sb = BY_ID[run.team[b].id];
        return (
          ((
            heal
              ? sb.role === "Support"
              : tank
                ? sb.role === "Guardian"
                : ["Striker", "Ranger"].includes(sb.role)
          )
            ? 1
            : 0) -
          ((
            heal
              ? sa.role === "Support"
              : tank
                ? sa.role === "Guardian"
                : ["Striker", "Ranger"].includes(sa.role)
          )
            ? 1
            : 0)
        );
      });
    for (const i of indices) if (equipRelic(run, i, item.uid)) break;
  }
}
const start = performance.now();
for (const options of difficulties)
  for (const [name, ids] of Object.entries(builds)) {
    const row = {
      difficulty: options.difficulty,
      chaos: options.chaos || 0,
      build: name,
      runs: 12,
      wins: 0,
      planets: [0, 0, 0],
      bossLosses: 0,
      battles: 0,
      seedsWon: [],
    };
    const points = ids.reduce(
      (n, id) =>
        n +
        { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 6 }[
          BY_ID[id].rarity
        ],
      0,
    );
    assert.ok(points <= 12);
    for (let seed = 1; seed <= row.runs; seed++) {
      const run = makeRun(seed, ids, options);
      run.route = generateRoute(run);
      let shops = 0;
      equip(run);
      for (
        let step = 0;
        step < 24 && !run.complete && run.integrity > 0;
        step++
      ) {
        run.route ||= generateRoute(run);
        const candidates = run.route[run.depth].filter((n) => canVisit(run, n));
        const score = (n) =>
          n.type === "rest"
            ? run.integrity < 3
              ? 10
              : 6
            : n.type === "shop"
              ? run.gold > 90 && shops === 0
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
        const node = candidates.sort((a, b) => score(b) - score(a))[0];
        enterNode(run, node);
        run.encounterType = node.type;
        if (node.type === "shop") {
          shops++;
          const stock = generateShop(run, node.seed);
          const preferred = [
            "clock",
            "seed",
            "execution-bell",
            "mercy",
            "prism",
            "sanctuary",
            "fangs",
            "bond",
            "overgrowth",
          ];
          for (const id of stock.relics.sort(
            (a, b) =>
              (preferred.includes(a) ? preferred.indexOf(a) : 100) -
              (preferred.includes(b) ? preferred.indexOf(b) : 100),
          ))
            buyRelic(run, id);
          for (const id of stock.personal) {
            const cost = shopPrice(run, PERSONAL_BY_ID[id].cost);
            if (run.gold >= cost) {
              run.gold -= cost;
              run.inventory.push(personalRelic(id));
            }
          }
        } else if (node.type === "rest") {
          if (run.integrity < 3) run.integrity++;
          else
            run.team.forEach((c) => gainXP(c, chaosLevel(run) >= 12 ? 30 : 40));
        } else if (node.type === "event") {
          const event = EVENTS[node.event],
            choices = event.choices
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => eventAvailable(run, c));
          const choice = choices.sort(
            (a, b) =>
              (({
                xp: 5,
                study: 4,
                gold: 4,
                gem: 3,
                life: run.integrity < 3 ? 9 : 0,
                supplies: 3,
                relic: 2,
              })[b.c.kind] || 0) -
              ({
                xp: 5,
                study: 4,
                gold: 4,
                gem: 3,
                life: run.integrity < 3 ? 9 : 0,
                supplies: 3,
                relic: 2,
              }[a.c.kind] || 0),
          )[0];
          if (choice) applyEvent(run, event, choice.i);
        } else {
          equip(run);
          // Spend earned gold on role-specific evolutions and use the scouted counterplan.
          for (let i = 0; i < 6; i++)
            if (evolutionOffer(run, run.team[i]).ready && run.gold >= 75)
              evolveCreature(
                run,
                i,
                ["Guardian", "Support"].includes(BY_ID[run.team[i].id].role)
                  ? "warden"
                  : "wild",
              );
          const foes = encounter(run, node.type, node.seed),
            arch = foes[0].archetype;
          for (const c of run.team)
            c.policy = ["garden", "bastion"].includes(arch)
              ? "healer"
              : "adaptive";
          const b = simulate(run, foes, node.seed);
          row.battles++;
          const won = b.winner === 0;
          rewardBattle(run, node.type, won);
          run.contracts = [];
          if (won) {
            if (run.wins % 3 === 0)
              run.inventory.push(
                personalRelic(pick(PERSONAL_RELICS, rng(node.seed + 888)).id),
              );
            else run.team.forEach((c) => c.training++);
          }
          if (node.type === "boss") {
            if (won) {
              row.planets[run.planet]++;
              shops = 0;
            } else {
              row.bossLosses++;
              continue;
            }
          }
        }
        nextNode(run);
      }
      if (run.complete) {
        row.wins++;
        row.seedsWon.push(seed);
      }
    }
    results.push(row);
    console.log(JSON.stringify(row));
  }
const report = {
  kind: "Deterministic legal starter campaigns with earned resources; not human fun ratings",
  campaigns: results.reduce((n, r) => n + r.runs, 0),
  executionSeconds: (performance.now() - start) / 1000,
  results,
};
fs.writeFileSync(
  "playtest-artifacts/balance-report.json",
  JSON.stringify(report, null, 2),
);
