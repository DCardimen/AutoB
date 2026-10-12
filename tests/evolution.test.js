import test from "node:test";
import assert from "node:assert/strict";
import {
  SPECIES,
  PLANETS,
  creature,
  makeRun as legacyMakeRun,
  stats,
  relicSlots,
  evolutionOffer,
  evolveCreature,
  equipRelic,
  linkRelic,
  linkedSupport,
  personalRelic,
  rollCapture,
  Battle,
  encounter,
} from "../game.js";
import { creaturePose, spriteBone } from "../animation.js";

test("all 89 families have valid lineages, art cells, and an encounter habitat", () => {
  assert.equal(SPECIES.length, 89);
  assert.equal(new Set(SPECIES.map((s) => s.id)).size, 89);
  assert.equal(new Set(SPECIES.map((s) => s.evolvedName)).size, 89);
  const available = new Set(PLANETS.flatMap((p) => [...p.pool, p.boss]));
  for (const s of SPECIES) {
    if(s.evolutionLimit!==0)assert.ok(s.evolvedName !== s.name);else assert.equal(s.evolvedName,s.name);
    assert.ok(s.artIndex >= 0 && s.artIndex < (s.nativeRig?29:20));
    assert.ok(available.has(s.id), s.id + " cannot be encountered");
  }
});

test("evolution requires a level, gold, and valid path without spending on failure", () => {
  const run = makeRun(1),
    c = run.team[0];
  assert.equal(evolveCreature(run, 0, "wild").success, false);
  assert.equal(run.gold, 160);
  c.level = 5;
  run.gold = 49;
  assert.equal(evolutionOffer(run, c).ready, false);
  assert.equal(evolveCreature(run, 0, "wild").success, false);
  run.gold = 200;
  assert.equal(evolveCreature(run, 0, "invalid").success, false);
  assert.equal(run.gold, 200);
  assert.ok(evolveCreature(run, 0, "wild").success);
  assert.equal(run.gold, 150);
  assert.equal(c.evolution, 1);
  assert.equal(evolveCreature(run, 0, "wild").success, false);
  c.level = 8;
  assert.equal(evolveCreature(run, 0, "warden").success, false);
  assert.equal(run.gold, 150);
  assert.ok(evolveCreature(run, 0, "wild").success);
  assert.equal(run.gold, 50);
  assert.equal(c.evolution, 2);
  assert.equal(evolveCreature(run, 0, "wild").success, false);
});

test("opening wild fights use common and uncommon creatures, while sanctuaries offer rarities", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const run = makeRun(seed);
    for (const foe of encounter(run, "battle", seed)) {
      const family = SPECIES.find((s) => s.id === foe.id);
      assert.ok(["Common", "Uncommon"].includes(family.rarity));
    }
    run.depth = 2;
    assert.ok(
      encounter(run, "capture", seed).some((foe) =>
        ["Rare", "Epic", "Legendary"].includes(
          SPECIES.find((s) => s.id === foe.id).rarity,
        ),
      ),
    );
  }
});

test("transformation preserves identity, experience, equipped gems, and skill links", () => {
  const run = makeRun(2),
    c = run.team[0];
  c.level = 5;
  c.xp = 17;
  equipRelic(run, 0, run.inventory[0].uid);
  linkRelic(run, 0, 0, "auto-cinderfox");
  const uid = c.uid,
    gem = { ...c.relics[0] };
  const before = stats(c, run.team);
  assert.ok(evolveCreature(run, 0, "wild").success);
  assert.equal(c.id, "cinderfox");
  assert.equal(c.uid, uid);
  assert.equal(c.xp, 17);
  assert.deepEqual(c.relics[0], gem);
  assert.equal(relicSlots(c), 2);
  const after = stats(c, run.team);
  assert.ok(after.hp > before.hp && after.atk > before.atk);
  run.inventory.push(personalRelic("echo-prism"));
  assert.ok(equipRelic(run, 0, run.inventory.at(-1).uid));
});

test("Wild and Warden create different damage, healing, cooldown, and shield outcomes", () => {
  const wild = makeRun(3),
    warden = makeRun(3);
  for (const r of [wild, warden]) {
    r.team[1].level = 5;
    r.gold = 500;
  }
  evolveCreature(wild, 1, "wild");
  evolveCreature(warden, 1, "warden");
  assert.ok(
    stats(wild.team[1], wild.team).atk > stats(warden.team[1], warden.team).atk,
  );
  assert.ok(
    stats(warden.team[1], warden.team).hp > stats(wild.team[1], wild.team).hp,
  );
  assert.ok(
    stats(warden.team[1], warden.team).cd < stats(wild.team[1], wild.team).cd,
  );
  assert.equal(linkedSupport(warden.team[1], "mossguard").healing, 1.25);
  const battle = new Battle(warden, [creature("mossguard", 5)], 4);
  battle.cast(battle.units[1], "mossguard", battle.units[6]);
  assert.equal(battle.units[1].shield, 65 * 1.25);
});

test("capture retains an enemy's evolved form; future starters reset progression", () => {
  const run = makeRun(5),
    enemy = creature("ashpup", 5);
  enemy.evolution = 1;
  enemy.evolutionPath = "wild";
  run.random = () => 0;
  const result = rollCapture(run, enemy);
  assert.ok(result.success);
  assert.equal(result.creature.evolution, 1);
  assert.equal(result.creature.evolutionPath, "wild");
  const fresh = makeRun(6, ["ashpup"]);
  assert.equal(fresh.team[0].level, 1);
  assert.equal(fresh.team[0].evolution, 0);
});

test("animation states are distinct, deterministic, and freeze at a fixed game time", () => {
  const base = { id: "ashpup", uid: "stable-id", hp: 100 };
  const idle = creaturePose(base, 1, "fox"),
    walking = creaturePose({ ...base, motion: 1 }, 1, "fox");
  assert.equal(idle.state, "idle");
  assert.equal(walking.state, "walk");
  assert.notEqual(idle.y, walking.y);
  assert.equal(creaturePose({ ...base, attackAnim: 0.18 }, 1).state, "attack");
  assert.equal(creaturePose({ ...base, castAnim: 0.4 }, 1).state, "cast");
  assert.equal(creaturePose({ ...base, hitAnim: 0.2 }, 1).state, "hit");
  assert.equal(creaturePose({ ...base, dodgeAnim: 0.25 }, 1).state, "dodge");
  assert.equal(creaturePose({ ...base, hp: 0 }, 1).state, "fallen");
  assert.deepEqual(creaturePose(base, 1), creaturePose(base, 1));
  assert.notDeepEqual(
    spriteBone(walking, 0.85, 100),
    spriteBone(idle, 0.85, 100),
  );
});

function makeRun(seed,ids,options={}){return legacyMakeRun(seed,ids,{...options,rulesVersion:11});}
