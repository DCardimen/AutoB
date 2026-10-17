# Skill visuals v2, shop companions and negative armor

Shop recruits now initialize the same five categories as other modern companions: Weapon, Armor, Ring, Boots and Accessory. Loading older recruits repairs duplicate or incompatible categories once and returns those items to the pack with their rolled quality and provenance. Legendary aura capacity remains four.

Armor can fall below zero through Corrosion. Direct-hit mitigation is `A / (100 + abs(A))`, using the existing 1.4 Guardian multiplier for positive armor only. For example, -20 armor increases direct-hit damage by 16.7%; -100 increases it by 50%. Status, reflection and cost damage retain their existing bypass rules. Mitigation totals stay nonnegative, capture warnings use the same formula, and live inspection shows vulnerability after debuffs and temporary buffs.

The v2 visuals replace the former `skill.type` artwork lookup with the actual skill action, family element, weapon affinity, learned quality and evolution path/stage. Shared spell identity remains recognizable across learned variants. Icons use enamel, ivory and worn metal to match the teal/gold interface. Combat adds matching cast sigils, healing petals, ward shields, rooted vines, ice crystals, elemental projectiles, chain lightning, beams and impact motes. Enemy danger outlines and physical projectile cores remain visible at zero effect intensity. Creature pixels, palettes, rigs, gait, collision radii, damage timings and skill cooldowns are unchanged by the visual pass.

## Visual evidence

- [All emblem styles at detail size and 32px](emblems-native-and-detail.png); every one of the 1,030 skill definitions decoded in Chrome.
- [Desktop spell menu](source-skills-1440.png), [phone spell menu](source-skills-390.png), [separate evolution bonuses](source-bonuses-390.png).
- [Desktop learning choices](source-learn-choice-1440.png), [phone learning choices](source-learn-choice-390.png). Layout checks cover 320, 390, 700 and 1440px and reject artwork overlapping skill names/descriptions.
- [Shop Legendary after purchase, reload and deployment](source-legendary-five-slots.png); [same flow offline](offline-legendary-five-slots.png).
- [Live negative armor](source-negative-armor-1440.png); [offline](offline-negative-armor-1440.png).
- [24 effect samples, including danger outlines at zero intensity](effect-materials-and-danger-edges.png).
- Normal-speed recordings: [source](source-combat-normal-speed.webm), [offline](offline-combat-normal-speed.webm). They include menus, ordinary combat, then all 24 mechanic kinds together as a stress check.
- Decoded video: [source native size](source-decoded-2.png), [source enlarged stress detail](source-decoded-detail-2x.png), [offline native size](offline-decoded-2.png), [offline enlarged detail](offline-decoded-detail-2x.png). Playback rate and decoded timestamps are recorded in [visual-review.json](visual-review.json).

## Creature and contact regression review

Original/current sheets were visually reviewed for Nyra/caster, Syl/elf, Morrow/skeleton and Cogwalker/mech: base, first and second evolution, all eight facings. Syl/Nyra Warden bonuses are exercised in menus and live combat; both Syl paths appear on the emblem sheet. The beam origin uses the existing directional muzzle; character height is applied consistently when rendering it.

- [Caster](source-current-caster.png), [elf](source-current-elf.png), [skeleton](source-current-skeleton.png), [mech](source-current-mech.png).
- Automated beam attachment checks cover all 89 families, both paths, stages 0/1/2 and eight facings (4,272 cases), retaining authored equipment identity.
- Existing gait/carry review generated 51 comparison/motion sheets and checked 1,472 poses with zero clipping. Source and offline live checks exercise 12 companions including evolved crab, drake and stag at 50%, 150% and 100% stride, with phone layouts and zero offline network dependencies: [gait-browser.json](gait-browser.json).

## Reproduction

`node --test tests/skill-visuals-v2.test.js tests/companion-rules-v2.test.js tests/manual-skills-v2.test.js tests/evolution-bonus-skills.test.js tests/equipment-capture-polish.test.js tests/aura-stones.test.js` — 66 passing focused checks.

`node tests/skills-v2.browser.mjs` — source/offline desktop and phone menus, all 24 combat kinds, shop purchase/reload/deploy, live vulnerability, reduced motion, zero effect intensity and learning choices. [Browser results](browser.json).

`node scripts/review-skills-v2.mjs` — effect/canvas-state review and actual 1× video decoding. `node scripts/review-gaits-carry.mjs skills-v2` — existing authored-art comparison review. `node tests/legs-v2.browser.mjs` and `node tests/prototype.browser.mjs` — live source/offline creature regression checks.

Both offline HTML builders were run. Training Glade rebuilds byte-identically because its code/assets are unaffected. The main offline game embeds the new icon and canvas code without additional bitmap or network dependencies.

## Full regression result and existing failures

The complete Node suite finished: **460 tests, 458 passed, 2 failed**. [Full output](full-regression.txt). The exhaustive 170,136-frame creature cell test and both character-height boundary checks pass, as do gait, palette and weapon contact checks. The 66 focused feature checks pass separately.

Both failures reproduce identically from an isolated export of the unchanged base commit `8e6063f`:

- `grand-forms`: the arena-size check expects collision radius 3.3 but receives 6.6. [Base reproduction](base-radius-reproduction.txt).
- `overhaul`: the linked-counter-support scenario expects the unmodified team to lose, but it already wins. [Base reproduction](base-counter-reproduction.txt).

Collision settings, these scenario expectations and their assertions were not changed in this PR. No additional failure was introduced by this update.
