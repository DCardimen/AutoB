# Base fox: forward combat and compact movement

This pass updates the isolated Meshy base fox preview. It does not integrate the 3D model into the game or change evolution forms. The supplied GLB and earlier repaired input remain untouched.

## Result

The added leather glove meshes are removed. Simple rounded fur paws replace the detailed fingers, retain mirrored thumb placement, and meet the original wrist bracers. Their orange is sampled from the uploaded forearm texture, RGB (250,95,29). The right paw closes around the bow grip; the left paw pinches the string. Anatomical hand identity is fixed in all views.

The bow is a shallow longbow with a straight grip. The whole attack faces the actor's forward axis (+Z), including its draw, string, arrow, release glint and trajectory. A compact draw and natural shoulder protraction fit the fox's short arms and large muzzle. The draw-hand approach travels outside the chest, rather than passing through it.

Run uses a shorter stride and compact alternating steps with the source broad boots. Separate forward, backward and left/right strafe shooting clips keep locomotion independent of the upper-body attack. Their in-place travel velocities are included in animation extras and used by the preview's Travel control to keep planted feet from sliding. Dash is a forward root-motion burst; left/right dodges remain separate. The fall lifts both boots and includes a small settling response, with body and equipment kept above the ground.

The runtime preview controller lets the head follow an enemy independently at rest and turns the upper body during shooting. `foxAnimation.target([x,y,z])` accepts a fixed world target; the Enemy slider provides a simple visual test. Aim is bounded to about 26 degrees each side, and head pitch is bounded. The shot and loose arrow/effects receive the same upper-body turn. The controller restores its changes before the next mixer sample so scrubbing or repeated poses do not accumulate rotation.

Idle includes an occasional full tail swish. The controller maintains a separate ambient clock, selecting intervals within 6-10 seconds; the portable Idle clip has an eight-second period. Smaller gait response and tip lag remain during movement. The tip crosses both anatomical sides on each sweep. Six tail bones own the complete tail bulb, including the previous 142-vertex repair. The existing nine-bone constrained cape simulation and curved-line blink are retained.

The simpler workflow reuses this model and the existing free CC0 KayKit humanoid tracks, then fits contacts and secondary motion to the fox. [Animation provenance](../../../assets/fox-animation-sources/README.md).

## Visual review

Reviewed family/form: **fox / Meshy base only**. Facings: **S, SE, E, NE, N, NW, W, SW**, including both front and rear diagonals.

- [Original eight views](../meshy-fox-rig/original-eight-directions.png)
- Current [idle](idle-eight-views.png), [walk](walk-eight-views.png), [compact run](run-eight-views.png), [forward attack](attack-eight-views.png)
- Shooting movement: [forward](shootForward-eight-views.png), [backward](shootBackward-eight-views.png), [left](shootLeft-eight-views.png), [right](shootRight-eight-views.png)
- [Dash](dash-eight-views.png), [dodge left](dodgeLeft-eight-views.png), [dodge right](dodgeRight-eight-views.png), [hit](hit-eight-views.png), [fall](death-eight-views.png), [blink](blink-eight-views.png), [tail swish](tailSwish-eight-views.png)
- [Normal-speed recording](motion-preview.webm), [decoded frames](motion-decoded.png), [enlarged decoded attack](decoded-attack-enlarged.png)
- Short recordings: [poses and tracking](pose-preview.webm), [moving combat](combat-preview.webm)
- Native details: [hands at rest](idle-front.png), [aim](attack-aim.png), [moving fire](strafe-aim.png), [dash](dash-quarter.png), [raised feet](fall-quarter.png), [tail from rear](tail-swish-rear.png)

The normal-speed recording uses the actual exported animation mixer. It includes a stationary head-tracking example and moving fire against a fixed world target. Original-resolution textures remain embedded; decoded 768-pixel video frames are retained individually for native/enlarged inspection. Optional rig guides are off.

## Verification

- **20 unit checks pass**, including the six original rig regressions, normalized clips/seams, default relaxed hands, all-view bow/string contacts, simple-paw topology, actual gear/paw geometry, flexing bow-tip anchors, forward projectile travel, head/upper-body aim, planted-foot travel in eight facings, dash landing, raised death feet, blink and tail ownership/timing.
- [Export review](export-review.json) and [runtime tracking review](runtime-review.json) each inspect **1,682 poses**, at 60 Hz and the final pose. Both report no detected intersections in the tested unrelated surfaces, no non-finite geometry, and no ground penetration beyond floating-point precision. Right grip contact is exact; maximum left nock separation is below 0.00000005 source units.
- Tested surface pairs include paws, forearms, torso, head, bow, string, arrow and tail/legs. Intentional cuff/shoulder garment joins are excluded. Final wrist bend is below 24 degrees, without arm stretching; cloth length error is below 0.0000003 units.
- Khronos glTF validation reports zero errors. Three material tangent-space warnings remain from the source material across the split body/head primitives; viewers generate tangents. Preserved unused source accessors are informational.
- [Browser review](browser-review.json) checks 15 states in all eight views, actual normal-speed playback, and complete actor/equipment framing. [Inline review](inline-review.json) covers chapter selection and widths 320/736/1024.
- Both offline HTML files rebuild. [Source/offline live checks](production-smoke.json) pass for the existing game, including animated combat and movement. These checks do not claim 3D game integration.

## Reproduce

Dependencies: `npm ci`, Python with Pillow, and Chrome. The sampler reads the supplied texture for vertex/material colours; it does not edit the bitmap.

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

Open `http://127.0.0.1:3109/animated.html`. The viewer provides all eight facings, orbit, actions, normal/slow playback, scrubbing, blink, enemy tracking, travel and optional rig guides. One-shot actions default to playing once. [Portable animated GLB](../../../public/meshy-fox-preview/fox-animated.glb) and [preview controller](../../../public/meshy-fox-preview/fox-preview-controller.mjs).

## Limits

This is a base-form preview for visual approval. Cloth, tail and the fall are baked in the GLB; live target tracking and variable ambient timing use the included controller. The fall is an authored animation, not a live collision-driven ragdoll. Arbitrary engine blending, runtime ragdoll physics and integration into the production game remain engine work. Sampled geometry checks are not continuous collision detection, and no numerical art-quality rating is claimed.
