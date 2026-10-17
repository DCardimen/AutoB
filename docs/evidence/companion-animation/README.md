# Companion animation review

All seven implementation steps are in [the pipeline guide](../../../COMPANION-ANIMATION-PIPELINE.md). The delivered source and both offline builds use independent indexed arms over a complete torso, fixed directional grips, painted leg skinning, connected head/cape motion, and companion-specific anatomy. Evolved Cinderfox uses its actual longer legs; the drake's muzzle stays rigid during travel; bite effects begin at the registered painted mouth.

## Review coverage

Reviewed **41 authored families, all three forms and all eight facings** against their original art. The normal-speed movie contains 1072 frames, 89.33 seconds and 131,856 rendered poses. It covers idle, walk, run, sprint, turning, stopping, attacks, casts and falls. No clipped poses were reported. Tests also cover all 89 collection families, both character-height limits, both stride limits, connected shoulders/hands, original material indices, fixed weapon identity and all 1,128 melee approach cases.

- [Normal-speed review player](video/review.html) — download this folder and open the player to inspect native 64px sprites and the selectable 3× family view.
- [Encoded MP4](video/all-companions.mp4), [input hashes/timeline](video/video-manifest.json), [actual decoder measurements](video/decoded-video.json).
- [Independent parts ZIP](companion-parts.zip) — 984 PNG strips, 123 form sets and their full indexed registration manifest. [Manifest separately](parts-manifest.json). Two exports produced the same SHA-256: `39ee4e143a38190b0f0e3c7c56f6bd7e2cf8ecee15cfdcce3d797bf11600e787`.
- [Source/offline live-combat measurements](live/browser.json). All six scenes (three forms in each build) animate, enter real windup/recovery and register contacts; no page errors or offline network dependencies.

The actual movie was decoded at **1× playback**, without seeking. Thirty captures show native frames and enlarged regions, rotating through all 41 families. Visual review checked authored silhouettes, limb joins, footfall alternation, torso coverage behind swings, cape attachment, muzzle stability, preserved fin/wing roots and cell edges. The source/current sheets below include every form/facing; action sheets show windup, contact and recovery.

Complete 16-frame sequences decoded from the MP4 show three forms at 3×, read left to right across two rows per form: Cinderfox walk ([front](sequences/feralfox-walk-1.png), [rear](sequences/feralfox-walk-6.png)), drake walk ([front](sequences/drake-walk-1.png), [rear](sequences/drake-walk-6.png)), troll swing ([front](sequences/troll-attack-1.png), [rear](sequences/troll-attack-6.png)), dwarf swing ([front](sequences/dwarf-attack-1.png), [rear](sequences/dwarf-attack-6.png)).

## Anatomy decisions and repairs

The drake uses a four-leg physics proxy but has two painted hind legs and folded wings. Only its hind legs are skinned as legs. The ten true quadruped families retain alternating diagonal groups. Winged companions without separate rig arms retain their original painted hands. Wings and fins keep their original source connections through motion. Far-side arms remain occluded where the source requires it; skeleton rib gaps remain intentional.

Complete minotaur horns, skeleton crowns and moth silhouettes were recovered from the source master before downsampling the whole figure. Reviewed ownership masks remove neighboring-row fragments on evolved frost elves and phoenixes while retaining the phoenix's orange flame-tail tips. All repairs use the original indexed material palette. Clipping counts include the base artwork, flying bodies and falls, as well as equipment.

Running the source-recovery script in an isolated copy reproduces all three repaired data modules byte for byte: [SHA-256 comparison](source-recovery.json), [recovery log](logs/source-recovery.log).

## Family sheets

| Family | Three forms × eight facings | Previous renderer/source |
| --- | --- | --- |
| knight | [Original/current](sheets/knight.png) | [Before this pass](before/knight.png) |
| orc | [Original/current](sheets/orc.png) | [Before this pass](before/orc.png) |
| elf | [Original/current](sheets/elf.png) | [Before this pass](before/elf.png) |
| caster | [Original/current](sheets/caster.png) | [Before this pass](before/caster.png) |
| fox | [Original/current](sheets/fox.png) | [Before this pass](before/fox.png) |
| goblin | [Original/current](sheets/goblin.png) | [Before this pass](before/goblin.png) |
| fairy | [Original/current](sheets/fairy.png) | [Before this pass](before/fairy.png) |
| wolf | [Original/current](sheets/wolf.png) | [Before this pass](before/wolf.png) |
| mech | [Original/current](sheets/mech.png) | [Before this pass](before/mech.png) |
| spider | [Original/current](sheets/spider.png) | [Before this pass](before/spider.png) |
| jelly | [Original/current](sheets/jelly.png) | [Before this pass](before/jelly.png) |
| serpent | [Original/current](sheets/serpent.png) | [Before this pass](before/serpent.png) |
| harpy | [Original/current](sheets/harpy.png) | [Before this pass](before/harpy.png) |
| moth | [Original/current](sheets/moth.png) | [Before this pass](before/moth.png) |
| crab | [Original/current](sheets/crab.png) | [Before this pass](before/crab.png) |
| centipede | [Original/current](sheets/centipede.png) | [Before this pass](before/centipede.png) |
| dwarf | [Original/current](sheets/dwarf.png) | [Before this pass](before/dwarf.png) |
| minotaur | [Original/current](sheets/minotaur.png) | [Before this pass](before/minotaur.png) |
| skeleton | [Original/current](sheets/skeleton.png) | [Before this pass](before/skeleton.png) |
| lion | [Original/current](sheets/lion.png) | [Before this pass](before/lion.png) |
| bear | [Original/current](sheets/bear.png) | [Before this pass](before/bear.png) |
| stag | [Original/current](sheets/stag.png) | [Before this pass](before/stag.png) |
| drake | [Original/current](sheets/drake.png) | [Before this pass](before/drake.png) |
| beetle | [Original/current](sheets/beetle.png) | [Before this pass](before/beetle.png) |
| bat | [Original/current](sheets/bat.png) | [Before this pass](before/bat.png) |
| phoenix | [Original/current](sheets/phoenix.png) | [Before this pass](before/phoenix.png) |
| rogue | [Original/current](sheets/rogue.png) | [Before this pass](before/rogue.png) |
| frostelf | [Original/current](sheets/frostelf.png) | [Before this pass](before/frostelf.png) |
| troll | [Original/current](sheets/troll.png) | [Before this pass](before/troll.png) |
| feralfox | [Original/current](sheets/feralfox.png) | [Before this pass](before/feralfox.png) |
| cat | [Original/current](sheets/cat.png) | [Before this pass](before/cat.png) |
| rabbit | [Original/current](sheets/rabbit.png) | [Before this pass](before/rabbit.png) |
| rodent | [Original/current](sheets/rodent.png) | [Before this pass](before/rodent.png) |
| rhino | [Original/current](sheets/rhino.png) | [Before this pass](before/rhino.png) |
| turtle | [Original/current](sheets/turtle.png) | [Before this pass](before/turtle.png) |
| owl | [Original/current](sheets/owl.png) | [Before this pass](before/owl.png) |
| fish | [Original/current](sheets/fish.png) | [Before this pass](before/fish.png) |
| mushroom | [Original/current](sheets/mushroom.png) | [Before this pass](before/mushroom.png) |
| mantis | [Original/current](sheets/mantis.png) | [Before this pass](before/mantis.png) |
| clam | [Original/current](sheets/clam.png) | [Before this pass](before/clam.png) |
| squid | [Original/current](sheets/squid.png) | [Before this pass](before/squid.png) |

## Weapon actions

[aurel](actions/aurel.png) · [brakk](actions/brakk.png) · [brom](actions/brom.png) · [tarka](actions/tarka.png) · [syl](actions/syl.png) · [nyra](actions/nyra.png) · [rowan](actions/rowan.png) · [grit](actions/grit.png) · [grum](actions/grum.png) · [morrow](actions/morrow.png) · [sable](actions/sable.png) · [eira](actions/eira.png). Each sheet includes base, mature and apex forms with body-only, carry, windup, contact and recovery. Original finger pixels remain over the grip and the full torso is visible behind the arm.

## Checks and delivery

[Pipeline manifest](pipeline.json) records all input/output hashes and commands. Both rebuilt offline HTML files remain below 100 MiB. The source and offline journey checks also pass equipment interactions, responsive layouts, battle/pause, rewards and saves ([log](logs/journey-browser.log)).

| Check | Result | Duration | Evidence |
| --- | --- | --- | --- |
| parts | Pass | 5.3 s | [Log](logs/parts.log) |
| parts-repeat | Pass | 5.6 s | [Log](logs/parts-repeat.log) |
| anatomy-tests | Pass | 456.8 s | [Log](logs/anatomy-tests.log) |
| cell-tests | Pass | 1156.4 s | [Log](logs/cell-tests.log) |
| standalone | Pass | 7.1 s | [Log](logs/standalone.log) |
| prototype | Pass | 0.4 s | [Log](logs/prototype.log) |
| source-offline-combat | Pass | 58.9 s | [Log](logs/source-offline-combat.log) |
| live-legs | Pass | 19.3 s | [Log](logs/live-legs.log) |
| live-prototype | Pass | 129.7 s | [Log](logs/live-prototype.log) |
| source-sheets | Pass | 35.2 s | [Log](logs/source-sheets.log) |
| natural-sheets | Pass | 30.6 s | [Log](logs/natural-sheets.log) |
| body-sheets | Pass | 3.0 s | [Log](logs/body-sheets.log) |
| motion-video | Pass | 0.1 s | [Log](logs/motion-video.log) |
| decoded-video | Pass | 89.7 s | [Log](logs/decoded-video.log) |

The [broader unit run](logs/broader-unit-suite.log) reports 472 tests, 468 pass, 2 fail, 2 skipped; its two exhaustive cell tests run separately in the passing pipeline. Two unrelated baseline failures remain: the arena-radius expectation (3.3 versus 6.6) and the linked-counter outcome (1 versus 0). Both reproduce on the original source: [radius](logs/baseline-arena-radius.log), [counter](logs/baseline-counter-link.log). No assertions were lowered and gameplay balance was not changed to suppress these failures.

To recreate: install dependencies, Chromium and FFmpeg, then run `npm run animation:pipeline`. A changed source/registration or a failed check must be reviewed again; cached video requires matching runtime inputs, matching encoded bytes and zero clipped poses.
