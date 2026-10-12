# Chibi movement roadmap — target 9/10

The v4 movement review scored attachment 9, proportions 7, walking 7, ground contact 7.5, running/sprinting 7.5, turning/transitions 7.5 and combat motion 7: **7.5/10 overall**. This plan targets **at least 9 in each category**, rather than allowing one strong score to hide a weak one. These are visual review targets, not scores that passing tests automatically earns.

## Art direction

Use original **32-bit-era fantasy pixel art** with chibi characters under the existing fixed isometric camera. The courtyard and creatures must share crisp pixel clusters, earthy greens, warm gray stone, golden lighting and muted cyan accents. Use stepped material shading and restrained dark contours, with exact 64×64 sprite cells and a 334×218 arena grid enlarged to 1002×654 without smoothing. Close inspection magnifies the same world pixel scale; portraits enlarge the same 64×64 source cells. Preserve the forest ruins and open walkable courtyard composition. Humanoids should read at roughly three head heights: broad expressive heads, compact torsos, short sturdy legs, visible hands and substantial boots. The orc is wider and stockier; the elf is light and tapered; the caster has a clear hood/cloak silhouette. The wolf gets a larger expressive face, a compact body and readable paws while retaining quadruped anatomy.

Use clear eyes and brows, shaped hair clumps, simplified armor plates, warm highlights and a restrained palette with one strong identity color per companion. The knight's crest/shield, orc's tusks/axe, elf's ears/bow, caster's hood/staff and wolf's muzzle/tail must remain recognizable at arena scale. Faces, equipment and clothing attach to the shared anatomical pose used by the pixel painter and physical contacts. Chibi proportions must be built into the shared rig, not applied as a disconnected head overlay.

Motion should be playful and expressive while preserving physical weight. Brief anticipation, clear silhouettes, slight compression and delayed hair/cloth motion should support grounded movement. Weapons, supporting soles and actual collisions must continue to agree.

## Delivery order

| Pass | Work | Why it improves the score | Review gate |
|---|---|---|---|
| 1 — Chibi foundation | Rework the five silhouettes, rig proportions, faces, colors and equipment fit; redraw the glade in matching pixel art and unify scene pixel scale; retain all eight views and connected anatomy. | Establishes intentional proportions and character identity before authoring motion for them. | Inspect front, side, back and diagonals at gameplay scale. No neck gaps, changing scale, hidden eyes or unreadable equipment. Creatures, scenery, shadows and effects must belong to the same pixel-art world. |
| 2 — Walk and ground weight | Author contact, loading, passing and push-off poses for each body; retune stride to the shorter legs; coordinate pelvis, chest and head; improve wolf shoulder/spine motion. | Replaces mechanical limb cycling with visible support and weight transfer. | At 1× speed, planted feet stay still, knees remain reachable, the body loads the supporting leg, and stopping finishes a plausible recovery step. |
| 3 — Run, sprint and pivots | Author distinct fast-gait poses, acceleration launches, braking steps, inside-foot pivots and direction-change steps; add restrained head/cloth lag. | Makes speed and direction changes involve the whole body. | Review walk→run→sprint→stop and 45°/90°/180° turns in all views. No rotating on two locked feet, pose pops or exaggerated head wobble. |
| 4 — Combat acting | Author weapon-specific anticipation, hip/shoulder drive, contact and recovery; strengthen recoil and stagger; add bent-body, varied grounded falls. | Gives attacks readable intent and weight beyond correct collision timing. | Sword, two-handed axe, bow, staff and bite each have a distinct action. Grips remain attached, dodges visibly clear attacks, and effects/audio occur at actual contact. |
| 5 — Polish and critical review | Refine face/armor pixel clusters, palette ramps, shadows and secondary motion; profile a six-versus-six scene; review repeated normal-speed clips and unfamiliar player sessions. | Establishes readability, smooth playback and whether the result feels convincing in use. | Re-score all seven categories separately. Any score below 9 returns to its relevant pass; do not expand the roster until the five-body style is stable. |

Each pass may take several implementation/review iterations. Deliver a playable offline HTML and a short normal-speed clip after each meaningful revision. Keep v4 available through Git history for direct comparison.

## Evidence required for each of the seven scores

| Category | v4 baseline | Target | What must be demonstrated |
|---|---:|---:|---|
| Head and limb attachment | 9 | ≥9 | Continuous neck and limb anatomy through locomotion, turning, attacks, hits and falls; equipment remains attached. |
| Proportions and height consistency | 7 | ≥9 | Deliberate chibi shape language, consistent geometry across directions, clear differences between the five bodies and no accidental scale changes. |
| Walking naturalness | 7 | ≥9 | Coordinated shoulders/hips/head, believable support and recovery, and distinct heavy, light and quadruped gaits. |
| Ground contact and weight | 7.5 | ≥9 | Stable sole/paw contact, visible loading and push-off, convincing landings and settled falls. |
| Running and sprinting | 7.5 | ≥9 | Distinct fast gaits, stronger drive, plausible airborne intervals, and controlled acceleration/braking. |
| Turning and transitions | 7.5 | ≥9 | Pivot and change-of-direction steps, pose continuity, and readable movement→attack→movement transitions. |
| Combat movement and impact | 7 | ≥9 | Weapon-specific whole-body acting, correct contact, committed misses, directional dodges and recoil proportional to impact. |

Keep automated checks for welded topology, finite bone weights, limb reach, planted feet, sole penetration, weapon grips and physical contacts. Extend meaningful coverage to new pivot/transition behavior as it is implemented. Review normal-speed clips alongside frame sequences; neither still pictures nor test counts establish animation quality alone.

For the final visual review, **9/10 means consistently convincing and readable at normal speed within the chibi style**, with no recurring distracting attachment, sliding, scale or transition faults. Review front, back, side and diagonal motion, repeated starts/stops and mixed combat. Ask three to five unfamiliar players to assess the same seven categories, retain their written reasons, and report sample size and disagreements. Feedback is a planned review step, not player testing already performed.

Performance must be measured on a named hardware/browser combination, at a stated resolution, with twelve creatures and combat effects. Report frame timing and low-percentile performance separately from the cloud's software renderer. Do not promise a hardware frame rate without measuring it.

## Scope and status

This is a refinement of iteration 1 in the larger [overhaul roadmap](ROADMAP.md). The campaign, roster expansion, progression and gameplay balance remain their own milestones. The 9/10 target here concerns the seven movement qualities; reaching it does not establish a 9/10 whole-game fun score or human playtime.

**Native Pixel v6** now implements the 64×64 art foundation and expands the representative set to nine anatomies at the user's request. Shorter rigs, distinct running, planted support, cape springs, turn/brake poses, physical dodging, particle ragdolls and heavy-hit knockdown/get-up transitions implement portions of passes 2–4. Native exports and the four-view/animation showcases provide repeatable review material. The next refinements are stronger character-specific acting, pixel-cluster detail, repeated normal-speed review and unfamiliar-player feedback. Pass 5 and the seven independent 9/10 reviews remain open; technical checks do not replace them.
