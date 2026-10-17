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

The command exports the parts twice and compares their manifests, runs anatomy/contact/cell checks, rebuilds both offline files, starts a local server when needed, verifies source and dependency-free offline combat, generates comparison sheets and an all-family movie, and decodes that movie at normal speed into native and 3× evidence. A failed check stops the pipeline and records the failure. `BASE_URL` selects an existing game server. `--out=...` changes the evidence directory.

```sh
# Export parts without changing source artwork or rebuilding the game.
npm run animation:parts

# Recover the reviewed source imports as part of the complete pipeline.
npm run animation:pipeline -- --recover-source

# Render/review the normal-speed movie independently.
npm run animation:review
npm run animation:verify-video
```

The pipeline reruns every automated check. The movie cache is accepted only when every runtime input hash and the encoded video's hash match, and the review contains no clipped poses. Pass `--force` to `animation:review` to encode again. No generated parts are embedded a second time in the game: production skins the same indexed artwork, keeping the main offline build below 100 MiB.

Open `playtest-artifacts/animation-pipeline/video/review.html` after a full run. The upper player shows every family/form at native 64px; the selector shows the same decoded frames at 3×. Check an entire cycle, including rear views and action recovery. `pipeline.json` records automated results; visual approval still requires looking at the movie and sheets. New creatures need reviewed registrations rather than a guessed proxy body plan.
