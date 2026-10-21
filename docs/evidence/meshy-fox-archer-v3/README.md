# Rowan archer v3

This updates the existing base-fox 3D preview. Open the [self-contained acrobatic performance](rowan-acrobatics-preview.html), [pose reel](rowan-pose-preview.html), or [combat movement reel](rowan-combat-preview.html). The live viewer is `public/meshy-fox-preview/animated.html`; **Acrobatic combo** runs the actual actor with continuous root motion and cross-fades.

## Changes

- Corrected the visible leg attachment: the complete tail and bind chain move to a centred socket behind the pelvis. Proximal fur and every tail-owned vertex lose their thigh/shin/boot weights. Tunic trim remains on the pelvis. Tail length, thickness, source texture and UVs are retained.
- Added a skinned-triangle collision check and continuous minimal tail correction after ambient sway and target tracking. It includes the proximal fur, costume, cape, legs and boots; it does not hide intersecting geometry or shrink the tail.
- Added jumping double shots, travelling sliding shots, a sideways crouched triple volley, left/right side flips, and a forward vault. Existing dashes, ducks, kiting, braking pivots and alternate bow angles remain available. The run carries its weight lower with less bounce.
- Sideways shots roll the connected shoulder girdle, arms, bow, string and arrows around the aim line, with a counter-rolling head. The right bow hand and left draw hand retain their established contact geometry.
- The sniff lifts and flares the nose pad slightly, with zero forward extrusion and no mouth movement.

## Visual review

The animated form is the uploaded **base fox**, a biped with one tail. All eight views were reviewed: S, SE, E, NE, N, NW, W, SW. The original indexed base/mature/apex sheets and the later mature/Moontrail references were inspected for context; evolution/variant art is unchanged and is not an additional animated 3D deliverable.

- [Original authored directions and all three tiers](../fox-layered-preview/original-directions.png).
- [V2 versus v3 registration](v2-v3-registration.png), [sniff comparison](v2-v3-sniff.png), and [attachment/action close views](attachment-and-acrobatics.png).
- Every clip has an `*-eight-views.png` sheet, including all six new actions. Head, boots, tail, bow and quiver fit their review frames.
- [54-second normal-speed motion reel](motion-preview.webm), [decoded motion sheet](motion-decoded.png), [16.7-second continuous runtime combo](acrobatic-combo.webm), and [decoded combo sheet](combo-decoded-sheet.png).
- Decoded native 768px combo frames and 1536px enlargements cover the flip, slide and volley (`combo-decoded-2.4*`, `combo-decoded-8*`, `combo-decoded-10.5*`). [Mobile combo](mobile-combo.png).
- [34-second live combat](combat-demo.webm), [decoded combat sheet](combat-decoded.png), and [combat results](combat-review.json): 7 shots, 7 hits; normal-speed video verified.

## Validation

- [51 fox tests pass](fox-tests.txt), including portable GLB validation, normalized rotations, sealed loops, grip/string intersections through all animation frames, eight-view hand ownership, face stability, tail ownership, airborne head clearance, real travel, landings, runtime transitions, and the continuous combo.
- [Tail surface audit](tail-surface-audit.json): **11,433 samples at 60 Hz, zero intersections**. It covers every portable clip and runtime poses with two ambient clocks plus a moving aim target. Each report identifies the exact GLB by SHA-256.
- [Browser/action/framing review](browser-review.json), [runtime combo review](combo-review.json), and [inline/mobile-width playback](inline-review.json). Normal-speed videos are decoded and played at 1×.
- [All six core roster regression files pass](roster-regression.json): gait/carry, legs v2/v3, weapon art, prototype rig and sprite art. [All eight grand-form shards pass](grand-forms-sharded.json), covering every original assertion and all 89 families through their forms, variants, directions, motions and cell boundaries.
- Both game offline builds were regenerated. [Source/offline live gait](source-offline-legs.txt) and [prototype combat](source-offline-prototype.txt) scenarios pass, with zero offline external requests. These builds remain unchanged because this is the established isolated 3D preview.

The production indexed game renderer and evolution forms are outside this preview update. No known tail/clothing/boot intersection remains in the reviewed coverage. A pre-existing sub-4mm bow raise IK residual on the upright/tilted angles is unchanged; the exact grip/string contact assertions pass.

## Reproduce

```text
node scripts/build-meshy-fox-animated.mjs
node scripts/build-meshy-fox-preview.mjs
node --test tests/meshy-fox-motion.test.js tests/meshy-fox-archer.test.js tests/meshy-fox-archer-v2.test.js tests/meshy-fox-archer-v3.test.js
node scripts/audit-fox-tail.mjs
node scripts/review-fox-animated.browser.mjs
node scripts/review-fox-combat.browser.mjs
node scripts/test-grand-forms-sharded.mjs
```

For the runtime-combo/mobile review, serve the repository on port 3117 (or set `BASE_URL`), then run `scripts/review-fox-acrobatics.browser.mjs`, `scripts/review-fox-registration.browser.mjs`, `scripts/build-fox-motion-inline.mjs`, and `scripts/review-fox-inline.browser.mjs` in that order. Windows uses installed Chrome; `CHROMIUM_PATH` overrides the browser path.

The roster audit distributes the original `grand-forms.test.js` species loops across eight processes. All original assertions, forms, paths, states, directions and phases remain intact. Its report records the source hash and proves disjoint coverage of all 89 families. Temporary test copies are removed after execution.
