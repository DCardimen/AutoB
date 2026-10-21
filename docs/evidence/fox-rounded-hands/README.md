# Rounded orange hands

The base biped fox now has one rounded orange hand mass and one fused thumb nub per side, following the older simple-paw style. Individual glove fingers and their animation channels are removed. The anatomical RIGHT hand holds the bow; the LEFT hand draws. This is the isolated 3D preview, with no gameplay creature or evolution changes.

## Visual review

- [Previous fingered hands](previous-hands.png), [replacement close-ups](hands.png), [assembled motion pilot](motion-pilot.png).
- [Original biped: all eight facings](../fox-biped1/source-eight-views.png). Reviewed anatomy: two arms, two round hands, two legs, the complete original tail and ranger costume. Only the base form is in scope.
- Every one of the 44 actions has an eight-facing sheet here. Coverage is S/SE/E/NE/N/NW/W/SW, including [Run](Run-eight-views.png), [bow draw](Bow_Attack-eight-views.png), [sideways bow](Bow_Attack_Tilted-eight-views.png), [slide](Slide_Shot-eight-views.png), [volley](Crouch_Volley-eight-views.png), both side flips and both travelling jump shots.
- [All complete action cycles](all-actions.webm), [runtime acrobatic transitions](acrobatic-combo.webm), [decoded native frame](decoded-7.9.png), [decoded enlarged frame](decoded-volley-enlarged.png), [decoded contact sheet](decoded-combo-sheet.png). Footage is reviewed at 1x as well as through decoded stills.

## Construction

The source glove surfaces are replaced at the wrist plane, with interpolated boundary vertices for a clean cuff edge. This is an explicit user-requested anatomy and palette exception. The original position, normal and UV arrays are retained as an unchanged prefix; 330 new wrist-edge vertices are appended. All unrelated original body/costume surfaces and texture bytes remain unchanged. Source geometry is retained separately in `fox-biped-source.glb`.

Each new hand is one continuous rounded surface with a small thumb nub. Its orange is the same `#fa5f1d` used by the older simple paws. The leather forearm cuffs remain. Forearm rotations use the authored bind direction without the former axial pronation that twisted the skinned arm. Rigid hand mounts and compensated equipment sockets preserve grip orientation and wrist location; maximum baked-key wrist/grip displacement is below 0.0001 mm. The bow and string use explicit named contact sockets on the new hands, independent of gait phase.

## Checks and limits

- [Unit tests](unit-tests.txt): source data/material preservation, exact replacement coverage, neutral wrists, connected hand mounts, bow/string/arrow and hand contact below the existing 2 mm tolerance, strictly increasing exported key times, and existing tail, jump and run checks.
- [Browser review](browser-review.json): all 44 actions/eight facings, normal-speed decoded playback, runtime combo, mobile layout and no browser errors. Its SHA256 identifies the reviewed delivered asset.
- [Tail audit](tail-audit.json) and [quiver audit](quiver-audit.json): independent exported/interpolated surface checks. The original connected tail-root seam remains the documented exception from the preceding version; these diagnostics cover the rendered body, clothing and boots, while the new hands are reviewed in the separate close-ups and contact checks.
- [glTF validation](gltf-validation.json): zero errors; the same three source-related tangent/skinned-transform warnings remain. Three.js preview playback is verified; other importers are not covered.
- [Both offline builds](offline-builds.txt), [source/offline movement](game-source-offline.txt), [source/offline combat](combat-source-offline.txt). These verify the unchanged production game separately from the 3D preview.

Collision sampling is not a proof over every continuous time value. No additional families or evolution forms are claimed as reviewed.

## Reproduce

The full `scripts/build-fox-biped-motion.mjs` pipeline now ends with `scripts/round-fox-biped-hands.mjs`. To apply just this revision, run the latter against the preceding fingered biped asset, then `node scripts/build-meshy-fox-preview.mjs`. The replacement script refuses to apply itself twice.

Set `BIPED_REVIEW_OUT=docs/evidence/fox-rounded-hands` when running the biped hand, pilot, full browser and collision review scripts. Open `/public/meshy-fox-preview/animated.html?action=Bow_Attack&v=rounded-orange` on the repository server.
