# Equipment identities, opening relics and relic art v2

This branch builds on the reference-arena/reward work merged in PR #30 and includes the latest `fang and animal items.png` upload. The original workspace and expedition.js draft were not edited.

## Player behavior

Team confirmation now opens two distinct, seeded relic offers before the first battle. Neither is granted automatically. Choose one or explicitly begin without a relic. Offers and decisions survive reload; choosing saves the grant before its illustration travels into the arena's relic bar. Later elite/boss offers also have a Skip relic button. Shop and event grants use the same arrival animation. Reduced motion grants immediately.

An unfinished expedition restarted before three arena wins makes the next opening pair lesser blessings. Defeat before those three wins also records this rule. Winning three arena battles restores normal opening choices immediately, including when manually restarting before the first world's guardian. Opening/cancelling the team picker and reloading an unconfirmed team do not count as restarts. Reloading a pending offer keeps that exact pair. Starting after a completed expedition also permits normal blessings.

Weapon classes follow family identity through evolution: Aurel/Grit/Sable use swords and daggers; Syl/Rowan/Morrow use bows; Brakk/Brom/Grum/Tarka use two-handed weapons; Nyra/Eira/Luma use spell weapons; Cogwalker uses cannon equipment. Animal families use fangs and jewelry. Checks apply to clicks, pack drops, transfers, and both sides of a reciprocal swap before anything moves. Enemies and starting equipment follow the same rules. Old incompatible equipment returns to the pack with its quality, rarity and provenance intact.

## Art and major relics

The extractor retains all 25 animal-sheet silhouettes, their transparency and source hashes. Fourteen fang/jewelry pieces and six specialist weapons join the equipment catalog. The remaining animal wardrobe illustrations remain available in the asset registry. Item and relic crops now retain up to 256 px instead of 128 px; no invented detail or sharpening halo was painted over the originals. Existing pixel creatures retain nearest-neighbor rendering. Illustrated UI assets use smooth sampling appropriate to the supplied paintings.

Relic art follows named identities and mechanics instead of catalog offsets. Adding an item cannot shuffle existing illustrations. The review export contains all 224 expedition/personal relic identities with the same normalized effect text used in the game. Shared illustrations intentionally identify related mechanics.

[All fifteen major relics](evidence/relic-v2/relic-v2-pacts.png) have executable benefits and drawbacks. Modern-run values include:

| Relic | Benefit | Price |
| --- | --- | --- |
| Bloodglass Crown | +60% attack | −30% health |
| Ironroot Idol | +70% health | −35% movement |
| Captive Hourglass | −40% cooldown time | −30% attack |
| Giant's Fetter | +55% attack | −40% movement |
| Hollow Sanctuary | +70% healing | −40% attack |
| Shattered Citadel | 120 opening shield | −30% health |
| Fevered Wing | +60% basic attack speed | −35% health |
| Restless Moon | +50% movement, −35% dodge cooldown | +40% skill cooldown time |
| Venomous Diadem | Hits apply 4s poison | −30% health |
| Ashen Heart | Hits apply 4s burn | −40% healing |
| Vampire's Vow | 30% damage lifesteal | −35% health |
| Mirror of Thorns | Reflect 35% received damage | +40% cooldown time |
| Burdened Aegis | Skill casts grant 40 team shield, 5s cooldown | −40% movement |
| Waning Veil | Dodges grant 3s evasion, 5s cooldown | −35% attack |
| Starved Comet | Every third hit chains 80% attack | −40% stamina recovery |

## Visual and motion evidence

- [Desktop selection](evidence/relic-v2/relic-source-opening.png), [390 px selection](evidence/relic-v2/relic-source-opening-390.png), [lesser offers](evidence/relic-v2/relic-source-lesser.png), [flight](evidence/relic-v2/relic-source-flight.png), [arrival](evidence/relic-v2/relic-source-arrival.png).
- Real-clock source and offline UI recordings: [source](../public/relic-start-source.webm), [offline](../public/relic-start-offline.webm).
- Creature review: Cogwalker, Onyx Scarab, Mireclaw, Runespider and Iron Scolopendra; all eight directions and available base/evolution artwork, with forms 0/1/2 included in the review. Before/after sheets in this directory retain original and rendered rows, e.g. [beetle](evidence/relic-v2/gaits-carry-v2-after-beetle.png), [walker](evidence/relic-v2/gaits-carry-v2-after-mech.png), [crab](evidence/relic-v2/gaits-carry-v2-after-crab.png).
- The live stride check exposed an unreachable beetle turn anchor. Many-legged landing arcs now fit their unchanged segment lengths before IK; sole height is preserved. No source limb masks, palettes, sockets, quadruped classification or weapon grips were changed.
- [Normal-speed motion video](../public/relic-v2-creature-motion.webm) shows native and 3× sprites simultaneously. FFmpeg decoded [walk](evidence/relic-v2/relic-v2-motion-walk.png), [run](evidence/relic-v2/relic-v2-motion-run.png), and [sprint](evidence/relic-v2/relic-v2-motion-sprint.png) frames were inspected. The broader gait/carry review generated 51 original/current and motion sheets, 1,472 poses, and zero clipped cells.

## Verification and limits

Both offline HTML files were rebuilt. Source/offline browser checks passed for opening choices, reset/death persistence, optional choices, exactly-once grants, arrival animation, reduced motion, equipment interactions, rewards, capture outcomes, live combat/pause, three ambient worlds, settings, and 320/390/768 px layouts. The source/offline 12-creature stride check passes at 50/150/100%, including evolved crab, drake and stag. Focused rules/art/rig tests pass 29/29. See [browser results](evidence/relic-v2/weapon-relic-browser.json), [full unit output](evidence/relic-v2/unit-final.txt), and [focused output](evidence/relic-v2/final-focused.txt).

Full Node 22 suite: **356/358 passed**. The focused 29-test suite and both complete browser flows were repeated after the final three-win recovery change. Two assertions already failed before this work and remain unchanged: `grand-forms.test.js` expects radius 3.3 while the existing weighted footprint is 6.6; `overhaul.test.js` expects the baseline shield encounter to lose, while it already wins. No assertions were relaxed to hide the movement issue. Existing tests that intentionally transferred swords between incompatible families were updated to use compatible recipients or shared accessories, retaining their item-conservation checks.

The offline game is approximately 92.7 MiB after retaining the larger artwork. Reference composition and screenshots were reviewed visually; a numerical 95% image-match score has not been measured.
