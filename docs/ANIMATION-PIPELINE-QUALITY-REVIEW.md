# Separate review of the seven animation stages

Review date: 17 October 2026. Baseline: `648659a` (PR #59). This pass reviews the pipeline and the images it actually produces. A passing assertion does not assign an artistic score. The release bar is readable motion at native size, preserved authored anatomy and materials at enlarged size, connected joints, usable evidence, and repeatable delivery. A visible disconnected, folded or cropped part fails that bar.

Scores are my assessment of the current collection after separate source, layer and decoded-motion review. They are not calculated from test counts. A score of 9 means the stage meets the release bar above; it does not certify future artwork or promise hand-authored motion for an unregistered body plan.

| Stage | Score | Basis for the assessment |
| --- | --- | --- |
| 1. Anatomy inventory | 9/10 | All 41 families, every raw form/facing, visible anatomy and explicit proxy exceptions are recorded and compared with the source. |
| 2. Part separation | 9/10 | Independent layers preserve material and shape; decoded exports reassemble exactly; minotaur fur now belongs to the moving arm. |
| 3. Sockets and grips | 9/10 | Fixed source hands, connected shoulders/elbows, painted fingers over grips and preserved occlusion survive directional action review. |
| 4. Locomotion | 9/10 | Original soles and limb thickness, diagonal footfalls, stable idle, stride limits and evolved front/rear cycles pass visual and pixel checks. |
| 5. Head, torso and secondary motion | 9/10 | Connected necks and collars, complete torso texture, coherent falls, attached cape/wing roots and preserved body-specific shapes. |
| 6. Actions and contact | 9/10 | Windup/contact/recovery retain hand attachment and torso coverage; weapon and mouth origins agree with actual combat contacts. |
| 7. Delivery and reproduction | 9/10 | Complete pipeline passes with unchanged inputs, exact part reassembly, verified encoded playback, both offline builds, real combat and reproducible failure/cache handling. |

## 1. Anatomy inventory

Reviewed the original/current eight-direction sheets for all 41 authored families and all three evolution inputs. The inventory now audits all 984 raw source frames, records their registrations and palette coverage, and documents the drake's two painted hind legs. Restored crystal crowns have explicitly recorded virtual source rows; whole-cell fitting must preserve their complete tips. Single-route families can map an evolution input directly to apex art; the independent part export still contains all three raw source forms.

Families reviewed: knight, orc, elf, caster, fox, goblin, fairy, wolf, mech, spider, jelly, serpent, harpy, moth, crab, centipede, dwarf, minotaur, skeleton, lion, bear, stag, drake, beetle, bat, phoenix, rogue, frostelf, troll, feralfox, cat, rabbit, rodent, rhino, turtle, owl, fish, mushroom, mantis, clam and squid. Facings: E, SE, S, SW, W, NW, N and NE. The rabbit/rodent/rhino/turtle/owl and other variants retain their intentional material remapping; source exports and repair pixels retain the original indices.

## 2. Part separation

The previous manifest could report empty natural layers without explaining them. It now counts actual exported pixels in every facing and names the reason for every empty layer. Verification decodes every PNG, checks checksums and dimensions, reconstructs the original source export, checks all colors against its source palette, and reassembles head, torso, legs, cape and two arms byte for byte.

The 12 weapon-bearing families have independent painted arm layers over restored torso material. Natural appendages remain in the authored body or locomotor skin when there is no independent hand rig. This is an explicit body-plan decision; an empty arm strip is never represented as a finished articulated arm.

Independent inspection of those layers found that the minotaur's warm brown fur was being rejected by a red-cloth filter. Its upper-arm fur is now included in the moving arm rather than left frozen on the body. Forty-eight reviewed shaft landmarks cover both arms, all forms and every facing; the regression checks original indices and prevents a frozen duplicate in the torso.

## 3. Sockets and grips

Reviewed the weapon-bearing forms and facings against their source hands, including rear grips, short juvenile arms, evolved costumes, shields, bows and staffs. Directional hand identity remains independent of gait. Original finger pixels cover the grip; moving an arm reveals torso material rather than transparency. Mouth effects use the rendered painted mouth rather than the proxy nose.

## 4. Locomotion

Reviewed authored feet, adjacent paw ownership, diagonal footfall alternation, source thickness, movement pace and stride-slider extremes. A proxy foot could previously pass above its painted hip during a fall. Skinning now carries the foot with the body and limits relative compression using its actual socket-to-sole length. Smooth blending between neighboring source feet removes hard ownership jumps. Evolved Cinderfox and the bipedal drake receive extra front/rear cycle review.

Idle feet retain exactly zero displacement. The existing stance assertion caught an intermediate regression in the compression limiter; the final limiter applies only during movement, falls and active natural attacks. The assertion is unchanged.

## 5. Head, torso, cape and secondary motion

The broad review found actual skin folds that the old cell-boundary test could not detect. Head travel is now bounded by its painted neck connection. Wing and tail motion enter continuously; wings use the companion's own source-pixel scale. Fairy and harpy use their registered natural head regions. Duplicate widening no longer reshapes already evolved shells and carapaces. Registered exceptions retain the mature jelly tentacle fan, serpent coil flare, crab pincers and bear shoulders that distinguish their evolution forms. The unchanged normalized-silhouette test caught a loss of that identity during review; the defining profiles were restored, with restrained coil flare.

Natural falls rotate the connected skin through a continuous body-plan arc. This preserves a readable fall without stretching a neck or following a proxy particle that spins while settling. Inverse sampling removes the fall rotation before looking up source material, keeping the torso solid. Shells settle gently; quadrupeds roll less than upright and flying bodies. Cape roots and hair remain attached while their outer regions lag.

The close-up humanoid fall review found the same older head-warping defect. Humanoids now use bounded head travel, restrained local head tilt, a continuous chest-to-pelvis blend and the shared connected-body fall arc. Their painted shoulder sockets and weapon grips remain attached. A separate regression checks positive head/collar area for all 12 articulated families through every facing, evolution input and motion state.

Rooted mushroom caps no longer inherit the jelly proxy's squash. A regression measures their actual projected cap landmarks through idle and falls, in every form/facing, against the original painted width.

## 6. Actions and contact

Reviewed windup, release and recovery with the original/current weapon sheets and normal-speed motion. Verify physical hand/grip contact, torso coverage, stable weapon identity, lower-jaw connection, painted mouth origins and reachable melee approaches. The rendering changes do not alter damage or collision reach to make the pictures pass.

## 7. Delivery and reproduction

Each stage runs separately with `npm run animation:pipeline -- --stage=N`. Its result leaves the other six stages marked `not-run`. Only a successful complete run sets `completePipeline: true`.

The movie decoder now covers all 72 state/facing segments, including idle, turn, stop, S, SW and NW. It reads the actual encoded movie at 1×, records sample hashes, and includes every family in enlarged captures. Input hashes cover runtime, tool and test files. A changed checkout, incomplete cached movie, wrong movie bytes or missing player cannot pass. Output locks reject concurrent writers; a failed encoder preserves the last movie and releases its lock. Animation CI runs independently of the general gameplay suite and uploads failure evidence.

The completed review includes both rebuilt offline files, source/offline live combat, exhaustive cell and height checks, original/current sheets, and inspection of decoded motion. Automated coverage does not replace looking at those images.

All 83 focused checks and five separately selected evolution/contact/cloth/cell checks pass. Exhaustive bounds cover 170,136 poses across 17 states plus 24,288 height-limit poses. Twelve source/offline combat scenes cover three evolution inputs and 24 focus families without page errors or offline requests; the Training Glade's combat and pose inspection also pass offline. Both HTML builds remain below 100 MiB. The 89.33-second MP4 contains 131,856 poses with zero clipping, and actual normal-speed browser decoding passes all 72 segments. The broader suite has 480 passes and two unchanged baseline failures (arena radius and linked-counter balance), documented with prior-source reproduction logs in the evidence index. Its two skipped exhaustive tests pass in the separate pipeline run.

## Evidence and reproduction

The implementation and commands are in [the pipeline guide](../COMPANION-ANIMATION-PIPELINE.md). This pass's final evidence, scores and test logs are linked from [the evidence index](evidence/animation-quality/README.md). Baseline art and results remain in [the previous review](evidence/companion-animation/README.md).

## Review of each animated part

These checks are separate from whether a stage command exits successfully:

| Part | Score | Visual acceptance criteria and review findings |
| --- | --- | --- |
| Legs | 9/10 | Painted soles, material thickness, stationary idle stance, diagonal support groups and connected hips through stride extremes and falls. Relative compression follows each source limb's length; neighboring paw weights blend continuously. |
| Arms | 9/10 | Independent original fur, skin and costume regions; complete torso behind the moving arm; source hand identity and occluded far-arm behavior. The minotaur fur-ownership defect was corrected and checked in every form/facing. |
| Head | 9/10 | A connected neck, recognizable crown/horns, restrained travel and tilt, and a fixed drake muzzle during travel. Positive skin-area checks cover natural heads and articulated collars separately; full fall cycles verify the recognizable face. |
| Cape | 9/10 | Original cape material, attached shoulder roots and delayed outer-panel motion through turns, movement, casting and settling. No cape is invented for a family/facing that has no separate painted cape. |
| Torso | 9/10 | Solid indexed material under the arm, continuous chest-to-pelvis deformation, no folded collar during a fall and no exposed replacement skeleton. Inverse sampling handles the whole-body fall rotation before reading the source texture. |
| Unique body shape | 9/10 | Authored wings, fins, shells, coils, tentacles, rooted caps and visible limb counts. Natural bodies use their registered motion and fall amplitudes. Mature anatomy profiles retain evolution identity; mushroom caps do not inherit soft jelly squash. |
