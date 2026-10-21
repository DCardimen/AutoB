# Rowan v3: supplied biped (1)

This replaces the isolated 3D fox preview with the newly supplied **biped (1)**. Reviewed scope: **base fox, all 44 actions, S/SE/E/NE/N/NW/W/SW**, original bind geometry, full animation cycles and runtime acrobatic transitions. No gameplay evolution or indexed game artwork is replaced.

The latest running reference supersedes the earlier request to keep Run unchanged. The existing 0.64-second Run is refined into longer, narrower alternating strides, a stronger rear push, tucked foot recovery, forward torso lean and a steadier head. The downloaded Running FBX is retained in the source archive for provenance and is **not** added to the final action library.

## Visual evidence

- [Original model: eight facings](source-eight-views.png), [feature close-ups and jump phases](features.png), [assembled action pilot](motion-pilot.png).
- [Hand and wrist close-ups](hands.png), [hand fitting report](hands.json). Both hands retain authored neutral wrists and curl toward the palm with opposite anatomical axes. Bow and string contacts use the actual palm/finger landmarks.
- [Run phases from the side](reference-run-phases.png), [normal-speed run video](reference-run.webm), [nose twitch close-up video](nose-twitch.webm).
- [All 44 complete action cycles at 30 fps](all-actions.webm), [continuous runtime acrobatic combo at 30 fps](acrobatic-combo.webm), [decoded combo sheet](decoded-combo-sheet.png), [native decoded frame](decoded-7.9.png), [enlarged decoded frame](decoded-volley-enlarged.png).
- Every action has an eight-facing sheet in this directory, including [Run](Run-eight-views.png), [forward jump shot](Jump_Shot_Forward-eight-views.png), [backward jump shot](Jump_Shot_Backward-eight-views.png), [slide](Slide_Shot-eight-views.png), [volley](Crouch_Volley-eight-views.png) and both side flips.
- [Browser review and video chapters](browser-review.json), [mobile viewer](mobile-viewer.png). Encoded footage was decoded and played at 1x. Native and enlarged frames, source anatomy, costume, boots, grips, tail attachment and complete silhouettes were visually reviewed.

## Anatomy and motion

The authored 250,614 triangle corners, positions, normals, UVs, original texture bytes and 69-bone rig are retained. The fox has two legs, two articulated hands, two ears and one full-length tail. No tail sculpt, shortening, replacement feet or procedural limb volumes are introduced. The fox-specific exception remains **RIGHT hand holds the bow; LEFT hand draws**.

The source autorig assigned rear green/gold clothing and brown leather to the tail/thigh. Source palette sampling now separates that clothing from fur; the rear belt follows the pelvis, and tail fur retains its original tail/pelvis blend without thigh influence. The original tail chain starts at the hips. A continuous hinge planner carries the previous safe bend through time, avoiding the different bend directions produced by independent pose projection. Distal joints have restrained, loop-closed waves. Stable playback uses the baked clearance; blends retain runtime tail and quiver checks.

The original connected socket is an anatomy exception in the surface audit: exactly 1,688 source mixed-weight corners within 45 mm of the authored tail socket identify its shared attachment seam. Triangles touching that seam are excluded from tail/body collision diagnostics. **All source triangles remain rendered.** Clothing and boots outside that connected seam remain in the audit. This is documented in the asset metadata and [tail audit](tail-audit.json).

Jump shots have preparation compression, push-off dust, a 9.81 m/s^2 ballistic arc, immediate descent after the apex, landing absorption and deceleration. New forward/backward variants travel 0.72/-0.64 m. The quiver tube, cap, band and brass rim are fitted against the actual clothing surface. The alternating nose twitch moves sideways up to 7 mm and lifts 2.8 mm; it has zero forward extrusion and leaves the mouth unchanged.

## Validation and limits

- [60 passing unit tests](unit-tests.txt): source/material identity, tail and rear-belt weights, finite/normalized clips, skinning parity, fixed bow/string/anatomical pinch contact, neutral wrists, inward curls on both mirrored hands, nose mask, jump physics, supported alternating run and loop closure.
- [Tail surface audit](tail-audit.txt): 16,256 exported/interpolated samples at 240 Hz with zero intersections, with the connected socket exception above. [Continuous planner report](tail-continuous.json).
- [Quiver audit](quiver-audit.json): 4,121 half-frame samples, zero surface intersections; witnessed clothing gaps below 1.9 mm. The reported gap is an upper-bound contact witness, not a globally minimized distance.
- [glTF validation](gltf-validation.json): zero errors. Three warnings remain: runtime-generated tangents, and the supplied skinned mesh's parent/local authoring transforms. The Three.js preview and decoded exports are verified; other importers may interpret those transforms or tangents differently.
- [Both offline builds](offline-builds.txt), [source/offline movement](game-source-offline.txt), [source/offline combat](combat-source-offline.txt) passed. Those game checks verify unchanged production behavior; the new model is exercised by the separate 3D browser review.

The cinematic reference is interpreted for this short-legged fox's authored anatomy. This is a base-form preview, not integration of the 3D model into the indexed-art game. Sampled collision checks do not constitute a mathematical proof over every continuous time value.

## Reproduce

With the supplied extracted folder available, run `node scripts/import-fox-biped.mjs`, `node scripts/build-fox-biped-motion.mjs`, then `node scripts/build-meshy-fox-preview.mjs`. The motion builder refines Run and hand grips, refits the acrobatic quiver mount, closes the tail wave, plans clearance and compacts unused export buffers. Source file sizes and SHA256 hashes are recorded in [the provenance file](../../../public/meshy-fox-preview/biped-provenance.json).

Serve the repository on port 3117. Run `scripts/audit-fox-biped-tail.mjs`, `scripts/audit-fox-biped-quiver.mjs` and the `scripts/review-fox-biped*.browser.mjs` review scripts. Open `/public/meshy-fox-preview/animated.html?action=Run` for the running preview; the viewer also exposes **Nose twitch** and **Acrobatic combo**.
