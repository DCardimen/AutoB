# Melee shoulder articulation

The complete body and clothing layers from PR68 remain the artwork baseline. Previously the arms bent at fixed roots while painted deltoids and shoulder armor stayed rigid. Each saved directional arm now includes a shoulder envelope, neutral arm-reach vector and facial exclusion. The original painted shoulder rolls with the solved hand-to-shoulder motion and blends into the chest. Evolved troll, orc, minotaur and dwarf forms use a broader envelope and stronger response; the smaller forms retain restrained motion.

The shoulder field is shared by armor, cloth and the independent torso backing. It rotates around the connected clavicle socket, fades continuously at its edges and bounds displacement smoothly. The renderer solves grips and elbows before painting these surfaces, so it never draws a stationary shoulder beneath the moving one. A continuous signed reach drives the cap: two legal elbow solutions with the same wrist produce exactly the same shoulder pose, and there is no angle-wrap boundary. A dense timing audit caught snapping in an earlier elbow-angle driver; that driver was replaced before delivery. Faces and dwarf beards have saved directional exclusions. Idle poses remain pixel-identical to the approved fixed-shoulder baseline. Occluded arms remain concealed; ragdoll poses retain the established whole-body collapse.

No source PNG, frozen bind, ownership grid, painted limb, palette index, reconstructed background, weapon identity, bone length or contact position is changed. `scripts/register-melee-shoulders.mjs` records the measured envelopes and calibrates neutral reach vectors against the existing idle solver. `melee-shoulder-skin.js` implements the shared field. The indexed layer compiler preserves the registrations losslessly. Sprite revision 21 invalidates old cached poses, and both offline HTML files are rebuilt within the existing 99 MiB standalone limit.

## Reviewed scope and evidence

The [interactive review](../public/melee-shoulder-review/index.html) has a **Shoulder motion** toggle for a direct comparison at the same phase, plus controls that hide the arms to expose the body and cape. The original raw reference and frozen converted bind remain separately labeled. The 21 shoulder sheets compare fixed and moving shoulders in every authored cell.

Coverage is knight, orc, dwarf, troll, goblin, minotaur and rogue: three actual art forms and eight facings, including unused mature artwork. Gameplay coverage is Aurel, Brakk, Brom, Grum, Grit, Tarka, Sable, Mossguard, Glacier, Abyssal, Gravitan and Cloverimp, all 52 available evolution/path variants, separately in source and offline combat. Grum and Sable's gameplay evolution mapping is preserved.

The [verification report](../public/melee-shoulder-review/verification.json) links exact build hashes, tests and five-factor observations. The [individual combat review](../public/melee-shoulder-review/combat.html) includes complete normal-speed clips and native/enlarged attack phases. Both 164-second full-cycle movies cover 17 states, three actual art forms and all eight facings. Their decoded family sheets include movement, turns, attacks, reactions and falls. Recorded visual findings are in [shoulder-visual-review.json](../art/melee-layers/shoulder-visual-review.json).

## Reproduction

Use Node 20 or newer and start `server.js` with `PORT=3055`. Set `BASE_URL=http://127.0.0.1:3055`, `CHROMIUM_PATH` to Chrome/Chromium, and `FFMPEG_PATH` to FFmpeg. Run:

```text
node scripts/register-melee-shoulders.mjs
node scripts/build-melee-layers.mjs --out=public/melee-shoulder-review
node scripts/verify-shoulder-baseline.mjs
node scripts/audit-melee-shoulder-motion.mjs
npm run build:standalone
npm run build:prototype
node scripts/review-melee-shoulders.mjs
node scripts/review-melee-layers.mjs --out=public/melee-shoulder-review
node scripts/inspect-layer-ownership.mjs --out=public/melee-shoulder-review
node scripts/build-melee-layer-review.mjs --out=public/melee-shoulder-review
node scripts/verify-melee-layers.mjs --out=public/melee-shoulder-review
node tests/melee-layer-inspector.browser.mjs --out=public/melee-shoulder-review
node tests/melee-individual.browser.mjs --out=public/melee-shoulder-review
node --test tests/arm-animation.test.js tests/creature-anatomy.test.js tests/gaits-carry.test.js tests/grand-forms.test.js tests/legs-v2.test.js tests/legs-v3.test.js tests/melee-clothing.test.js tests/melee-layer-masters.test.js tests/melee-ownership.test.js tests/melee-shoulders.test.js tests/melee-weapon-art.test.js tests/prototype-rig.test.js tests/sprite-art-v2.test.js
```

Set `REVIEW_URL=http://127.0.0.1:3055/public/melee-shoulder-review`. Encode each path with `scripts/review-companion-animation.mjs --families=melee --path=wild --out=public/melee-shoulder-review/wild` (then warden), and decode each with `scripts/verify-animation-video.mjs --out=...`. Decode individual fights using `scripts/verify-melee-combat-video.mjs --review=public/melee-shoulder-review --out=public/melee-shoulder-review/decoded-individual`. Package with `scripts/package-melee-layer-cycles.mjs --out=public/melee-shoulder-review` and `scripts/package-melee-layer-combat.mjs --out=public/melee-shoulder-review --visual=art/melee-layers/shoulder-visual-review.json`. Inspect the resulting evidence before recording manual findings and passing `--final`; run `tests/melee-layer-review.browser.mjs --out=public/melee-shoulder-review` afterward.

New shoulder tests assert actual cap raster changes, protected face/beard coordinates, unchanged idle and contacts, original body palettes and opaque moving backing. Existing arm, gait/carry, anatomy, clothing, weapon and whole-roster cell assertions retain their thresholds. Wider combat/balance tests still have the previously documented coalcrab/mireclaw reach and shield-counter failures; these are separate from shoulder rendering. Detailed results are in the verification report.

The final [dense timing audit](../public/melee-shoulder-review/checks/shoulder-timing.json) passes 32,760 poses at 65 samples per movement/attack cycle. The largest adjacent shoulder-angle change is 0.2042 radians, below the 0.35 limit; the former elbow-driven flips reached 1.12 radians. Unit coverage also reflects each actual elbow into its other legal IK solution while preserving the wrist and socket, and verifies identical shoulder motion plus fine-phase continuity at the former problem phases.

The juvenile rogue west-facing source (form 0, facing 6) conceals both arms under its cloak. Its shoulder driver is intentionally empty, preserving that authored occlusion. Final packaging checks the exact visible source-arm set in every cell rather than requiring a visible arm where the original artwork has none.

Final validation: 83 targeted tests pass; all 104 individual source/offline fights decode at normal speed. Manual findings cover five factors for each of 12 companions, with 24 phase montages, 14 full-cycle sheets and 13 decoded individual montages. The dense timing audit covers 32,760 poses; full-cycle recordings cover 82,656 poses and 330,624 bone checks. Two unrelated contact/balance failures remain identical to the previous baseline.
