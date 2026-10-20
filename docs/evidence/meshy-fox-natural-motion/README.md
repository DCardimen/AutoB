# Base fox: upward bow and natural motion

This patch updates the isolated Meshy base fox preview. The uploaded model and repaired input are preserved. Evolution forms and the production game's creature renderer are outside this pass.

## Changes

- The carried longbow curves upward. Its undrawn string is straight; the wood flexes with the draw and both string endpoints stay attached. A small cant keeps the upper limb beside the large muzzle. The bow remains in the anatomical right paw, with the left paw pinching the string. The lift and recovery move in front of the tunic. The draw-hand forearm rolls into the pinch without stretching the wrist.
- The complete six-bone tail sits farther behind the hips, trails movement with staggered response, and makes a slower lateral sweep every 6–10 seconds. Distal lag and a soft settling envelope retain the source's curled silhouette. The full tail bulb remains owned by tail bones.
- Separate left/right ear targets rotate the authored ear geometry about weighted roots. Occasional unilateral twitches and a subtle nose sniff run on the ambient clock, independently of locomotion loops. The nose moves about three millimetres in model units; eye vertices remain fixed. The portable Idle includes these gestures; the preview controller layers them over other living actions. Ear twitch and Sniff controls provide direct inspection.
- Run uses shorter travel, smooth lift-off and landing, alternating arm swings, small opposing pelvis/chest turns, and flat planted soles. The original broad boots, short limbs, costume, texture and palette remain intact. Shooting movement velocities match the revised stance travel.
- Curved-line blinking, constrained cape motion, enemy tracking, four shooting movement directions, dash, dodges and the raised-foot fall remain available.

## Visual review

Family/form reviewed: **fox / Meshy base only**. Facings: **S, SE, E, NE, N, NW, W, SW**.

- [Original eight views](../meshy-fox-rig/original-eight-directions.png), current [idle](idle-eight-views.png), [walk](walk-eight-views.png), [run](run-eight-views.png), [attack](attack-eight-views.png)
- [Right ear](earRight-eight-views.png), [left ear](earLeft-eight-views.png), [sniff](sniff-eight-views.png), [tail sweep](tailSwish-eight-views.png), [blink](blink-eight-views.png)
- Shooting [forward](shootForward-eight-views.png), [backward](shootBackward-eight-views.png), [left](shootLeft-eight-views.png), [right](shootRight-eight-views.png)
- [Dash](dash-eight-views.png), [left dodge](dodgeLeft-eight-views.png), [right dodge](dodgeRight-eight-views.png), [hit](hit-eight-views.png), [fall](death-eight-views.png)
- [Normal-speed recording](motion-preview.webm), [decoded frames](motion-decoded.png), enlarged decoded [attack](decoded-attack-enlarged.png) and [run](decoded-run-enlarged.png)
- Short recordings: [poses, tail, run, attack and face gestures](pose-preview.webm), [moving combat](combat-preview.webm)

Reviewed original/current sheets, normal-speed decoded frames at 768 pixels and enlarged attack/run frames at 1536 pixels. The face segment includes the whole head so both ear tips and the nose remain visible. Rig guides are off. The source material's highlights and sculpted fur are preserved; this pass does not replace the uploaded model's art style.

## Verification

- **25 unit checks pass**: source rig/anatomy regressions, normalized clips and seams, all-view grip/string contacts, closed mirrored fur paws, actual paw/gear surface clearance, straight resting string, flexing tip anchors, forward projectile and target tracking, flat foot support/travel, smooth contact velocity, alternating arm swing, ear/nose deformation and independent clock, blink, complete tail ownership/timing, dash and raised-foot fall. [Results](unit-review.json).
- [Export review](export-review.json) and [runtime tracking review](runtime-review.json) each sample **1,682 poses**. Both report no intersections in the tested unrelated surfaces, no non-finite vertices, and no ground penetration beyond floating-point precision. Right grip error is zero; maximum left nock separation is below 0.00000006 model units. Tested pairs include the right paw against the string as well as the wood, left paw/string/arrow, both forearms, torso, head, tail and legs. Intentional cuff/shoulder garment joins are excluded.
- Final IK error is below 0.000000000000001 model units; maximum wrist bend is about 21.3 degrees. Cloth length error stays below 0.0000003 units. Khronos validation reports zero errors and three preserved source material tangent warnings.
- [Browser checks](browser-review.json): 18 states in eight views, complete actor/equipment framing, repeatable scrubbing, moving target contact, ear/sniff buttons and real normal-speed playback. [Inline checks](inline-review.json): chapter selection, normal-speed playback and widths 320/736/1024.
- Both offline HTML files rebuilt. [Source/offline game smoke checks](production-smoke.json) pass for live movement and combat. These are regression checks for the existing game, not a claim of 3D game integration. The pre-existing expedition.js draft was not touched.

The final asset SHA256 is recorded in the browser, export, runtime and unit reports. [Free animation source/license provenance](../../../assets/fox-animation-sources/README.md).

## Reproduce

```powershell
node scripts/build-meshy-fox-animated.mjs
node scripts/build-meshy-fox-preview.mjs
node --test tests/meshy-fox-rig.test.js tests/meshy-fox-motion.test.js
node scripts/inspect-fox-motion.mjs
node scripts/inspect-fox-motion.mjs --tracking
node scripts/review-fox-animated.browser.mjs
node scripts/build-fox-motion-inline.mjs
node scripts/review-fox-inline.browser.mjs
node scripts/serve-meshy-fox-preview.mjs
```

Requires installed project dependencies, Python with Pillow and Chrome. Open `http://127.0.0.1:3109/animated.html`. [Portable GLB](../../../public/meshy-fox-preview/fox-animated.glb), [ambient expressions](../../../public/meshy-fox-preview/fox-expressions.mjs), [preview controller](../../../public/meshy-fox-preview/fox-preview-controller.mjs).

## Limits

This is a base-form preview. Tail, cloth and fall motion are baked in the portable asset; the included controller supplies variable ambient timing and live target tracking. The fall is authored rather than a runtime collision-driven ragdoll. Engine integration, arbitrary animation blending and runtime physics remain separate work. Sampled surface tests are not continuous collision detection. No numerical art-quality score is claimed.
