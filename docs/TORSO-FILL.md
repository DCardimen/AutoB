# Body beneath moving arms

Archived PR65 review. Its outer sleeve contour caused a stationary arm shape beneath the moving arm. See [Melee arm ownership](MELEE-ARM-OWNERSHIP.md) and the [current individual combat review](../public/melee-arm-review/index.html) for the correction and current evidence.

The previous arm pass left a narrow strip of repaired torso. Removing a sleeve exposed the larger unpainted cutout beside that strip. Its tests checked the repairs that existed, so they did not catch the missing area.

The body now has an independent indexed underpainting across its full shoulder-to-waist contour, derived from the source shoulder caps, jacket sides and waist. The adjacent torso texture continues into each arm opening. Hair and cape overlays have body material underneath too. The body moves with the trunk, independently of the arms.

The renderer fills the connected body cells between source samples before applying the original painted overlays. This also closes an interior pixel hole exposed by the new test during a get-up pose. The original palette indices, arm shapes, grips and costume overlays are retained. Skeletons keep their authored empty rib spaces; those are an explicit anatomy exception, distinct from missing pixels where an arm was removed.

Reviewed knight, orc, dwarf, troll, elf, caster, fox, goblin, minotaur, skeleton, rogue and frostelf in all three forms and eight facings. The [review](../public/torso-fill-review/index.html) includes 36 direct before/after sheets, body-only mid-swing views, and both evolution-path movies at native and enlarged sizes. The baseline is commit `e9fc1ac` (PR #64). [Verification](../public/torso-fill-review/verification.json) records the exact results and source fingerprints.

The regression suite checks 172 explicit, previously empty melee shoulder locations, including the outer edge of the sleeve opening. It also renders 39,168 body-only poses across all 17 states, forms, paths and facings and checks 35,612,144 torso samples for opacity. Arms and weapons are excluded from those renders, so they cannot conceal a hole. Existing arm, grip, palette, deformation, cell-boundary and gait checks remain enabled.

To inspect the result, run `node scripts/serve-arm-review.mjs --review=torso-fill --port=3049` and open `http://127.0.0.1:3049`.

```sh
node --test tests/torso-fill.test.js tests/swing-body.test.js tests/arm-animation.test.js
npm run build:standalone
npm run build:prototype
node scripts/review-torso-fill.mjs
node tests/arm-animation.browser.mjs --arms-only --out=playtest-artifacts/torso-fill/live
node scripts/review-gaits-carry.mjs final
node scripts/review-companion-animation.mjs --families=arms --out=playtest-artifacts/torso-fill/wild
node scripts/review-companion-animation.mjs --families=arms --path=warden --out=playtest-artifacts/torso-fill/warden
node scripts/verify-animation-video.mjs --out=playtest-artifacts/torso-fill/wild
node scripts/verify-animation-video.mjs --out=playtest-artifacts/torso-fill/warden
```
