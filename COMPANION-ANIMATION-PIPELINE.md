# Companion animation: seven steps and a repeatable pipeline

The source art defines anatomy. A physics proxy supplies motion and combat intent; it never supplies replacement limbs, guesses a hand, or changes a companion's visible body plan.

1. **Inventory anatomy.** Review all 41 authored families, three forms and eight directions. Record silhouettes, visible and occluded limbs, shoulders, hips, neck, mouth, cape and grip. Original/current sheets are the reference, including exceptions such as a bipedal drake using a four-leg motion proxy.
2. **Separate the artwork.** Build indexed head, complete torso, individual arms, legs and cape layers. Restore the torso hidden by a resting arm before moving the arm. Preserve the palette indices, authored thickness, folds and silhouette. Export each component so a reviewer can inspect it independently.
3. **Register sockets.** Bind hands and shoulders to form-specific directional landmarks. Keep grip identity independent of gait. Connect elbows and hips without exposing a skeleton; retain occluded far limbs. Mouth and weapon contacts use the same registration as the painted part.
4. **Tune locomotion.** Skin painted legs through the whole stride. Quadrupeds alternate diagonal footfalls; short paws and long legs receive different travel limits. Check idle, walk, run, sprint, turns, stops, and the full stride-slider range.
5. **Tune secondary motion.** Move the head as a connected region; avoid isolated muzzle/nose deformation. Use small, body-specific torso and idle motion. Capes lag from their attached shoulder edge. Respect wings, tails, shells, robes, floating bodies and multi-legged designs.
6. **Connect actions.** Review windup, strike and recovery. The painted hand holds the weapon throughout, and the torso remains visible behind it. Bites start at the mouth. Casts, projectiles, shields and two-handed grips follow their actual sockets.
7. **Verify the delivered game.** Check source indices, connected joints, grip/mouth origins, footfalls, material preservation and complete cell bounds. Review original/current sheets and decoded normal-speed video at native and enlarged sizes. Rebuild both offline files and verify source/offline live combat. A known detached or clipped part is unfinished work.

The seven implemented steps and reproducible commands are recorded below. Generated evidence records the source revision, anatomy registration, forms, directions, motion settings, check results and unresolved limitations. Re-running the pipeline must recreate the same parts from the same source and registration rather than infer new anatomy from an animated pose.

The [separate quality review](docs/ANIMATION-PIPELINE-QUALITY-REVIEW.md) records the findings for each stage and links its visual evidence.

## Implementation

| Step | Production implementation | Verification |
| --- | --- | --- |
| 1. Anatomy | `companion-anatomy.js`: all 41 body plans, form-specific shoulders/hands, head/neck and mouth landmarks; `creature-leg-volume.js`: authored foot ownership | Original/current eight-direction sheets for every form; explicit drake biped exception |
| 2. Parts | `authored-parts.js`: separate original indexed arms and complete occluded torso; head, legs and cape ownership; `build-companion-parts.mjs`: eight independent strips per form | 984 deterministic PNG strips; original palette indices and source ownership; no procedural limb mesh |
| 3. Sockets | Fixed directional source hands, source-length arm IK, replay of original finger pixels over the handle | Final rendered finger colors, hand/grip coincidence, opaque shoulder-to-hand paths in all weapon forms |
| 4. Locomotion | Existing painted leg skinning with longer evolved fox leg regions; true quadruped diagonal groups; drake uses its two painted hind legs | Walk/run/sprint, all facings/forms, 50–150% stride, preserved thickness and palette |
| 5. Secondary motion | Smooth neck blend; body-plan idle amplitudes; registered cape ownership and shoulder taper; dragon head excluded from wing motion and locked during travel | Native/enlarged normal-speed video, idle/turn/stop cycles and connected joints |
| 6. Actions | Registered painted lower-jaw deformation, mouth-aligned bite/projectile effects; indexed arms cover a complete torso; authored appendages retain ownership instead of a second procedural set | Bite effect origin matches painted mouth at both height limits; all 1,128 melee approach cases retain reachable hit sweeps |
| 7. Delivery | `animation-pipeline.mjs`, source/offline browser combat, both offline builders, normal-speed encoder/decoder review, CI artifact upload | Input/output hashes, test logs, 41 × 3 × 8 review coverage and no cropped pixels |

The high-resolution source recovery restores complete minotaur horns, skeleton crowns and moth silhouettes before downsampling the whole character. Reviewed ownership masks remove neighboring-row fragments from evolved frost elves and phoenixes. Repairs reuse the original indexed palettes. `sync-authored-atlases.mjs` keeps the three affected reference atlases consistent with runtime data; `import:art` applies these repairs after a complete import.

Wings and fins blend continuously into the head and torso. The renderer preserves connections between neighboring source pixels, including on bodies without legs, and retains the painted hands on winged companions that have no separate arm rig. Whole-pose fitting includes flying bodies and falls. Cell checks count clipping in the base artwork as well as the equipment layers; a failed or clipped movie cannot satisfy the review cache.

## Recreate and verify

Install the repository dependencies and Playwright Chromium. Put FFmpeg on `PATH`, or set `FFMPEG_PATH` to its executable. `CHROMIUM_PATH` can select an installed Chromium browser. Run from the repository:

```sh
npm run animation:pipeline
```

The command records a separate result for each of the seven stages. It exports the parts twice, compares their manifests, decodes all 984 PNG strips, checks exact layer reassembly and original palette colors, runs anatomy/contact/cell checks, rebuilds both offline files, verifies source and dependency-free offline combat, and produces comparison sheets plus a normal-speed movie. The decoder samples all 72 state/facing segments at native and 3× size, including idle, turns, stops and rear views. A failed check stops the pipeline and records the failure. `BASE_URL` selects an existing game server; the pipeline rejects a server whose anatomy source differs from this checkout. `--out=...` changes the evidence directory.

Run any stage separately while tuning its implementation:

```sh
npm run animation:pipeline -- --stage=1
# 1 inventory; 2 part exports; 3 sockets; 4 locomotion;
# 5 secondary motion; 6 actions; 7 delivered game and visual evidence.
```

An independent run writes `stage-N.json` and leaves other stages marked `not-run`. Only a complete successful run sets `completePipeline: true` in `pipeline.json`. Neither result automatically assigns an artistic quality score. The review must still judge shape, connection, pacing, readability and consistency separately for every stage.

```sh
# Export parts without changing source artwork or rebuilding the game.
npm run animation:parts

# Recover the reviewed source imports as part of the complete pipeline.
npm run animation:pipeline -- --recover-source

# Render/review the normal-speed movie independently.
npm run animation:review
npm run animation:verify-video
```

The pipeline reruns every automated check and verifies that its runtime, tool and test inputs stayed unchanged during the run. The movie cache requires matching source/encoder-helper hashes, matching movie bytes, complete contiguous coverage and an existing review player. Concurrent writers cannot share the same output directory. A failed encoder releases its lock and preserves the previous movie. Pass `--force` to `animation:review` to encode again. The independent animation CI job uploads evidence even on failure, so an unrelated general-suite failure cannot prevent animation checks from running. No generated parts are embedded a second time in the game: production skins the same indexed artwork, keeping the main offline build below 100 MiB.

The part manifest records actual decoded-size coverage and an explicit reason for each empty directional layer. Twelve weapon-bearing families have independent indexed arms; natural appendages remain in their authored body or locomotor skin when the body plan has no independent hand rig. Empty strips are an explained anatomy choice, not evidence of an articulated arm. Repaired crystal crowns can use virtual source rows above the imported cell; the complete restored crown must fit inside the exported and rendered cell.

Head motion is bounded by the painted neck blend, with wing motion expressed in the form's own source-pixel scale. Humanoids also use restrained head tilt and a continuous chest-to-pelvis blend. Leg skinning blends between neighboring source feet and limits relative compression by socket-to-sole length, preventing skin reversal during a fall; idle feet keep zero displacement. Every body uses a continuous fall arc for its body plan, rotating the connected skin together. Inverse raster sampling removes that rotation before sampling the source, preserving solid torso texture. Separate regressions check positive local head/collar area across all 29 natural and 12 articulated families, three evolution inputs, eight facings and nine states. Evolution uses its separately authored silhouette. Registered exceptions preserve the evolved jelly tentacle fan, serpent coil flare, crab pincers and bear shoulders; duplicate widening of other already evolved shells and carapaces is removed. Rooted mushroom caps retain their shape instead of inheriting jelly squash.

Open `playtest-artifacts/animation-pipeline/video/review.html` after a full run. The upper player shows every family/form at native 64px; the selector shows the same decoded frames at 3×. Check an entire cycle, including rear views and action recovery. `pipeline.json` records automated results; visual approval still requires looking at the movie and sheets. New creatures need reviewed registrations rather than a guessed proxy body plan.
