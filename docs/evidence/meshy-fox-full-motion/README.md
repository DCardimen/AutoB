# Base fox animation preview

This is the first/base Meshy fox only, as requested. It is an isolated 3D asset and review surface. No evolution forms or production game rendering are changed.

## Result

- Shorter arms, inward shoulder pivots, shorter legs, and the original broad boots and costume materials.
- Relaxed hands beside the thighs. The anatomical right fist stays closed around the bow's straight grip section; the left hand approaches, draws, releases and recovers.
- The default GLB pose is already relaxed, with the loose arrow and effects hidden, even when a viewer does not automatically play an animation.
- Eight embedded clips: Idle, Walk, Run, Bow_Attack, Dodge_Left, Dodge_Right, Hit_Reaction and Fall_and_Death.
- A two-state chibi blink with curved black eye lines. The closed state fills only the eye interiors; the head silhouette stays fixed and source eyebrow/fur detail is sampled into the closed patch's vertex colours.
- Watertight sculpted gloves with real grip/string openings, connected cuffs, consistent mirrored thumb anatomy, and bounded wrist rotation.
- Six tail bones and nine cape bones. Constrained damped cloth simulation is baked into the clips. Tail phase lag and action response are baked; these are portable animations rather than a runtime game physics component.
- An additional 142 front/lower tail-fluff vertices are removed from inappropriate thigh weights. The complete visible tail bulb retains its source shape during the limb shortening pass.

The supplied original GLB and the previous `fox-repaired.glb` remain intact. The new output is [fox-animated.glb](../../../public/meshy-fox-preview/fox-animated.glb). Animation sources and CC0 provenance are documented [here](../../../assets/fox-animation-sources/README.md).

## Visual evidence and review scope

Reviewed base fox facings: **S, SE, E, NE, N, NW, W, SW**. These are actual rotations of the 3D mesh, including front and rear diagonal views. No evolution coverage is claimed.

- [Original eight views](../meshy-fox-rig/original-eight-directions.png)
- Current: [idle](idle-eight-views.png), [walk](walk-eight-views.png), [run](run-eight-views.png), [attack](attack-eight-views.png), [dodge left](dodgeLeft-eight-views.png), [dodge right](dodgeRight-eight-views.png), [hit](hit-eight-views.png), [fall](death-eight-views.png), [blink](blink-eight-views.png)
- Normal speed: [video](motion-preview.webm), [decoded contact sheet](motion-decoded.png)
- [Enlarged decoded attack frame](decoded-attack-enlarged.png)
- Native detail: [idle front](idle-front.png), [idle side](idle-side.png), [setup](attack-setup.png), [aim](attack-aim.png), [release](attack-release.png), [blink](blink-front.png), [run](run-side.png), [fall](fall-quarter.png)
- Decoded 640-pixel video frames are also retained individually for native and enlarged review.

Review covers complete gait and attack cycles, setup/draw/aim/release/recovery, both dodges, blink, hit, fall, cape attachments and tail movement. Guides are off in the normal preview. A numerical report alone is not the basis for the visual review.

## Reproduction

Install repository dependencies with `npm ci`; the texture sampler also requires Python with Pillow. It reads the original bitmap to sample mesh vertex colours and does not edit or generate a raster image.

```powershell
node scripts/build-meshy-fox-animated.mjs
node scripts/build-meshy-fox-preview.mjs
node --test tests/meshy-fox-rig.test.js tests/meshy-fox-motion.test.js
node scripts/inspect-fox-motion.mjs
node scripts/review-fox-animated.browser.mjs
node scripts/serve-meshy-fox-preview.mjs
```

Open `http://127.0.0.1:3109/animated.html`. The existing rig diagnostic page links to the newer animation preview. The viewer provides eight facings, orbit, clip selection, time seeking, pause, normal/slow playback, blink and optional rig guides.

## Validation and limits

All **15 unit checks** pass, including the six original rig regressions. They exercise the exported GLB: relaxed default pose; normalized clips and seams; hand/string contacts in all eight views; watertight glove surfaces; real empty grip channels throughout every clip; alternating foot support and level planted soles; mutually exclusive eye states; dodge landings; animated tail/cloth; and all 424 vertices in the inspected tail-bulb region.

`export-review.json` records every exported frame at 60 Hz, geometric intersection checks between unrelated surfaces, finite skinned output, and Khronos glTF validation. The tested surface pairs include fists, forearms, torso, head, bow, string, arrow and tail/legs. Connected cuffs, shoulder roots and normal garment attachment joins are not unrelated surfaces. Collision checks sample the exported frames rather than providing continuous collision detection for arbitrary engine blending.

The final **848 sampled poses** have no detected intersections in those pairs and no non-finite vertices. Right-hand bow contact is exact in the loaded asset; maximum sampled left nock separation is below 0.00000009 source units. The final wrist bend stays below 22 degrees. All nine review states fit completely in all eight camera views, with zero clipped actor/equipment vertices. The generated inline preview was checked at 320, 736 and 1024 pixels, including chapter selection and normal-speed playback.

The glTF validator reports zero errors. Three tangent-space warnings inherit the source material's lack of authored tangents across the separated body/open-head/closed-head primitives; viewers generate tangent space. Unused preserved source accessors are informational. The source textures remain embedded at their original resolution.

Both offline HTML outputs are rebuilt. Source and offline live movement/combat smoke tests verify the existing game still works; they do not claim this 3D preview is integrated into that game. This asset remains a base-form preview for visual review. No numerical art-quality rating is claimed.
