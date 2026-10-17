# Seven-stage animation quality review

This review compares the current game with `648659a` (PR #59). [The separate stage assessments](../../ANIMATION-PIPELINE-QUALITY-REVIEW.md) explain the findings and release criteria. [The pipeline guide](../../../COMPANION-ANIMATION-PIPELINE.md) documents reproduction. All seven stages meet the 9/10 review bar; the individual assessments and limits are recorded in the linked review.

## Review material

- [Anatomy audit](anatomy.json): all 41 authored families, three raw forms and eight facings, including the drake's two painted hind legs and repaired crown rows.
- [Independent parts](companion-parts.zip), [registrations and coverage](parts-manifest.json), [decoded-pixel verification](parts-validation.json). Twelve weapon-bearing families have independent painted arms; natural appendages remain in the registered body or locomotor skin. Every empty directional layer has an explicit reason.
- [Native-size movie and selectable 3× player](video/review.html), [MP4](video/all-companions.mp4), [timeline and input hashes](video/video-manifest.json), [actual 1× browser-decoder results](video/decoded-video.json).
- [Complete automated pipeline results](pipeline.json), [source/offline combat results](live/browser.json), and the [general suite log](logs/full-suite.log).
- [Additional source/offline body-plan combat](extra-live/browser.json): fairy, serpent, mushroom, jelly, bear, mech, fish, squid, harpy, beetle, spider and lion. Recreate with `node docs/evidence/animation-quality/review-extra-combat.mjs` after rebuilding both offline files.

The movie covers idle, walk, run, sprint, turn, stop, attack, cast and death in all eight facings. The browser decoder samples every one of its 72 contiguous segments while playing at normal speed. Native 64px sprites and rotating 3× views cover every family. The additional complete-cycle sheets below are cropped directly from the encoded MP4 without resampling; each row reads left to right, with three evolution inputs shown in successive row groups.

## Close review of full decoded cycles

| Companion / motion | Front | Rear |
| --- | --- | --- |
| Evolved Cinderfox walk | [SE](sequences/feralfox-walk-1.png) | [N](sequences/feralfox-walk-6.png) |
| Drake walk and rigid muzzle | [SE](sequences/drake-walk-1.png) | [N](sequences/drake-walk-6.png) |
| Troll weapon swing | [SE](sequences/troll-attack-1.png) | [N](sequences/troll-attack-6.png) |
| Dwarf weapon swing | [SE](sequences/dwarf-attack-1.png) | [N](sequences/dwarf-attack-6.png) |
| Minotaur arm and grip | [SE](sequences/minotaur-attack-1.png) | [N](sequences/minotaur-attack-6.png) |
| Minotaur head, torso and fall | [SE](sequences/minotaur-death-1.png) | [N](sequences/minotaur-death-6.png) |
| Fairy wing roots and fall | [SE](sequences/fairy-death-1.png) | [N](sequences/fairy-death-6.png) |
| Serpent connected fall | [SE](sequences/serpent-death-1.png) | [N](sequences/serpent-death-6.png) |
| Mushroom cap and idle stance | [SE](sequences/mushroom-idle-1.png) | [N](sequences/mushroom-idle-6.png) |
| Knight cast and cape | [SE](sequences/knight-cast-1.png) | [N](sequences/knight-cast-6.png) |

[Exact decoded frame ranges and hashes](sequences/cycles.json). Recreate these supplementary sheets after the pipeline with `node docs/evidence/animation-quality/review-decoded-cycles.mjs --out=playtest-artifacts/animation-pipeline/video` (set `FFMPEG_PATH` and `CHROMIUM_PATH` if needed).

## Anatomy choices

Original indexed artwork determines visible limbs, socket locations, thickness and costume material. Ten true quadruped families retain diagonal footfall groups. The drake's four-leg proxy drives its two painted hind legs and folded wings; no extra front legs are drawn. Far-side limbs follow the source's occlusion. The original drake muzzle remains rigid during travel.

The minotaur's moving arms now own their ochre fur; the torso no longer retains a frozen duplicate. Torso repairs reuse the same indexed costume material. Head travel follows the short painted neck, and falls rotate a connected body instead of folding its collar. Rooted mushroom caps keep their source width. Registered mature tentacle, coil, pincer and bear-shoulder profiles retain evolution identity; the serpent flare is restrained. These are explicit anatomy decisions rather than generic limbs attached to a shared proxy.

Single-route families may select apex artwork for more than one evolution input. The part archive independently includes all three raw source forms. These results describe the current authored collection, not automatic approval of future creatures or unreviewed anatomy.

## Weapon and costume review

The refreshed action sheets show complete body skin, carry, windup, contact and recovery for each evolution input: [knight](actions/aurel.png), [orc](actions/brakk.png), [elf](actions/syl.png), [caster](actions/nyra.png), [fox](actions/rowan.png), [dwarf](actions/brom.png), [minotaur](actions/tarka.png), [goblin](actions/grit.png), [troll](actions/grum.png), [skeleton](actions/morrow.png), [rogue](actions/sable.png) and [frost elf](actions/eira.png). [Pose measurements](actions/poses.json) accompany the images. Original hand pixels cover the grip, and moving an arm reveals costume material rather than transparency.

## Source/current family sheets

Each family sheet includes three evolution inputs and E, SE, S, SW, W, NW, N and NE. Part layouts show original, head, torso, each arm, legs, cape and reassembly at native size for every raw form/facing. Before/after motion sheets compare walking, attack and fall phases at native and enlarged size.

| Family | Original/current | Independent layers | Before/after motion |
| --- | --- | --- | --- |
| knight | [All forms/facings](sheets/knight.png) | [Layers](parts/knight.png) | See movie |
| orc | [All forms/facings](sheets/orc.png) | [Layers](parts/orc.png) | See movie |
| elf | [All forms/facings](sheets/elf.png) | [Layers](parts/elf.png) | See movie |
| caster | [All forms/facings](sheets/caster.png) | [Layers](parts/caster.png) | See movie |
| fox | [All forms/facings](sheets/fox.png) | [Layers](parts/fox.png) | See movie |
| goblin | [All forms/facings](sheets/goblin.png) | [Layers](parts/goblin.png) | See movie |
| fairy | [All forms/facings](sheets/fairy.png) | See part archive | [SE](comparisons/fairy-1.png) · [N](comparisons/fairy-6.png) |
| wolf | [All forms/facings](sheets/wolf.png) | See part archive | See movie |
| mech | [All forms/facings](sheets/mech.png) | See part archive | [SE](comparisons/mech-1.png) · [N](comparisons/mech-6.png) |
| spider | [All forms/facings](sheets/spider.png) | See part archive | [SE](comparisons/spider-1.png) · [N](comparisons/spider-6.png) |
| jelly | [All forms/facings](sheets/jelly.png) | See part archive | [SE](comparisons/jelly-1.png) · [N](comparisons/jelly-6.png) |
| serpent | [All forms/facings](sheets/serpent.png) | See part archive | [SE](comparisons/serpent-1.png) · [N](comparisons/serpent-6.png) |
| harpy | [All forms/facings](sheets/harpy.png) | See part archive | [SE](comparisons/harpy-1.png) · [N](comparisons/harpy-6.png) |
| moth | [All forms/facings](sheets/moth.png) | See part archive | See movie |
| crab | [All forms/facings](sheets/crab.png) | [Layers](parts/crab.png) | [SE](comparisons/crab-1.png) · [N](comparisons/crab-6.png) |
| centipede | [All forms/facings](sheets/centipede.png) | See part archive | See movie |
| dwarf | [All forms/facings](sheets/dwarf.png) | [Layers](parts/dwarf.png) | See movie |
| minotaur | [All forms/facings](sheets/minotaur.png) | [Layers](parts/minotaur.png) | [SE](comparisons/minotaur-1.png) · [N](comparisons/minotaur-6.png) |
| skeleton | [All forms/facings](sheets/skeleton.png) | [Layers](parts/skeleton.png) | See movie |
| lion | [All forms/facings](sheets/lion.png) | See part archive | [SE](comparisons/lion-1.png) · [N](comparisons/lion-6.png) |
| bear | [All forms/facings](sheets/bear.png) | See part archive | [SE](comparisons/bear-1.png) · [N](comparisons/bear-6.png) |
| stag | [All forms/facings](sheets/stag.png) | See part archive | See movie |
| drake | [All forms/facings](sheets/drake.png) | [Layers](parts/drake.png) | [SE](comparisons/drake-1.png) · [N](comparisons/drake-6.png) |
| beetle | [All forms/facings](sheets/beetle.png) | See part archive | [SE](comparisons/beetle-1.png) · [N](comparisons/beetle-6.png) |
| bat | [All forms/facings](sheets/bat.png) | See part archive | See movie |
| phoenix | [All forms/facings](sheets/phoenix.png) | See part archive | See movie |
| rogue | [All forms/facings](sheets/rogue.png) | [Layers](parts/rogue.png) | See movie |
| frostelf | [All forms/facings](sheets/frostelf.png) | [Layers](parts/frostelf.png) | See movie |
| troll | [All forms/facings](sheets/troll.png) | [Layers](parts/troll.png) | See movie |
| feralfox | [All forms/facings](sheets/feralfox.png) | [Layers](parts/feralfox.png) | [SE](comparisons/feralfox-1.png) · [N](comparisons/feralfox-6.png) |
| cat | [All forms/facings](sheets/cat.png) | See part archive | See movie |
| rabbit | [All forms/facings](sheets/rabbit.png) | See part archive | See movie |
| rodent | [All forms/facings](sheets/rodent.png) | See part archive | See movie |
| rhino | [All forms/facings](sheets/rhino.png) | See part archive | [SE](comparisons/rhino-1.png) · [N](comparisons/rhino-6.png) |
| turtle | [All forms/facings](sheets/turtle.png) | See part archive | See movie |
| owl | [All forms/facings](sheets/owl.png) | See part archive | See movie |
| fish | [All forms/facings](sheets/fish.png) | [Layers](parts/fish.png) | [SE](comparisons/fish-1.png) · [N](comparisons/fish-6.png) |
| mushroom | [All forms/facings](sheets/mushroom.png) | See part archive | [SE](comparisons/mushroom-1.png) · [N](comparisons/mushroom-6.png) |
| mantis | [All forms/facings](sheets/mantis.png) | See part archive | See movie |
| clam | [All forms/facings](sheets/clam.png) | See part archive | See movie |
| squid | [All forms/facings](sheets/squid.png) | See part archive | See movie |

## Validation and limits

The broader unit run finishes with **484 tests: 480 pass, 2 fail and 2 skipped**. The skipped exhaustive cell tests run separately in the complete animation pipeline. The two failures reproduce on the earlier source: arena radius is 6.6 while the assertion expects 3.3 ([baseline proof](../companion-animation/logs/baseline-arena-radius.log)); linked-counter balance returns 0 while the assertion expects 1 ([baseline proof](../companion-animation/logs/baseline-counter-link.log)). [Current full log](logs/full-suite.log). No assertion was lowered and gameplay balance was not changed to suppress either failure.

The 83 focused checks cover original materials, independent arms, directional grips, connected joints, all 89 collection families' gait/bounds, stride limits, head/collar skin, cape roots, reachable action contacts and pipeline failure/cache contracts. Separate natural and articulated deformation checks inspect **26,568 poses and 18,531,018 local head/collar patches**, all with positive area. The exhaustive delivery checks additionally render 170,136 poses across 17 motion states and 24,288 poses at the character-height limits.

Visual review includes all 41 original/current family sheets, independent layer layouts for all 12 articulated families and four natural body plans, 32 before/after motion sheets, all 12 weapon action sheets, decoded native and enlarged frames spanning all 41 families/states/facings, and 20 complete decoded front/rear cycles. The MP4 contains **1,072 frames at 12 fps, 89.33 seconds and 131,856 rendered poses**, with zero reported clipping. Browser decoding checks every one of the 72 segments at 1× playback with no page errors; this is verification of the actual encoded movie, not a source-frame screenshot presented as playback.

Parts use exact original indexed colors. H.264 review video is lossy; it is useful for motion and cell review, while the decoded PNG-part checks establish exact palette preservation. Every new family or changed anatomy still needs source inspection and a new visual review. Independent natural limbs are skinned from the painted body; the archive does not claim a separate hand rig where the creature has none.


## Complete pipeline result

All seven stages pass with unchanged runtime/tool/test inputs and matching delivered-build hashes. Both offline files remain below 100 MiB. Twelve source/offline combat scenes cover three evolution inputs and 24 focus families, record actual contacts and report no page errors or offline network dependencies. The Training Glade and live-leg browser checks also pass.

| Check | Result | Seconds | Evidence |
| --- | --- | --- | --- |
| inventory | Pass | 1.1 | [Log](logs/inventory.log) |
| parts | Pass | 5.4 | [Log](logs/parts.log) |
| parts-repeat | Pass | 5.8 | [Log](logs/parts-repeat.log) |
| decoded-parts | Pass | 7.2 | [Log](logs/decoded-parts.log) |
| part-materials | Pass | 0.2 | [Log](logs/part-materials.log) |
| sockets | Pass | 97.9 | [Log](logs/sockets.log) |
| locomotion | Pass | 276.2 | [Log](logs/locomotion.log) |
| secondary-motion | Pass | 226.6 | [Log](logs/secondary-motion.log) |
| actions | Pass | 111.0 | [Log](logs/actions.log) |
| pipeline-contracts | Pass | 1.7 | [Log](logs/pipeline-contracts.log) |
| cell-tests | Pass | 1211.0 | [Log](logs/cell-tests.log) |
| standalone | Pass | 6.8 | [Log](logs/standalone.log) |
| prototype | Pass | 0.4 | [Log](logs/prototype.log) |
| source-offline-combat | Pass | 60.7 | [Log](logs/source-offline-combat.log) |
| live-legs | Pass | 18.8 | [Log](logs/live-legs.log) |
| live-prototype | Pass | 139.3 | [Log](logs/live-prototype.log) |
| source-sheets | Pass | 8.7 | [Log](logs/source-sheets.log) |
| natural-sheets | Pass | 4.1 | [Log](logs/natural-sheets.log) |
| body-sheets | Pass | 2.9 | [Log](logs/body-sheets.log) |
| motion-video | Pass | 0.1 | [Log](logs/motion-video.log) |
| decoded-video | Pass | 89.7 | [Log](logs/decoded-video.log) |
