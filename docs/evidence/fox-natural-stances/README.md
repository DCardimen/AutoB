# Natural idle and planted attack stance

The base biped fox now rests with its arms beside its thighs, soft elbows, inward-facing round hands and a lowered bow at the right side. Standing shots use the prior fox's modest stagger with both boots flat on the ground, replacing the raised rear boot and outward knee. The existing rounded orange hands and thumb nubs remain.

## Reference and visual review

- Prior form, reviewed in all eight facings: [idle](prior-form-idle.png), [attack](prior-form-attack.png). The older `fox-animated.glb` is the pose reference, adapted to the supplied biped's authored proportions.
- [New stance close-ups](stance-pilot.png), [assembled motion pilot](motion-pilot.png), [hand close-ups](hands.png).
- [Idle → enter stance → repeated shots → exit → idle](idle-attack-transitions.webm), [decoded sequence](stance-decoded-sheet.png), [native frame](stance-decoded-native.png), [enlarged frame](stance-decoded-enlarged.png), [1x playback check](stance-playback.json). Entry/exit endpoints share the actual new idle and attack transforms.
- All 44 actions have eight-facing sheets here, including [Idle](Idle-eight-views.png), [standing attack](Bow_Attack-eight-views.png), [crouched attack](Bow_Attack_Crouched-eight-views.png) and the upright/tilted/double variants.
- [Complete action cycles](all-actions.webm), [runtime acrobatic combo](acrobatic-combo.webm), [decoded native frame](decoded-7.9.png), [decoded enlarged frame](decoded-volley-enlarged.png), [decoded contact sheet](decoded-combo-sheet.png), [browser review](browser-review.json).

Reviewed scope is **base fox, all 44 actions, S/SE/E/NE/N/NW/W/SW**. Original biped anatomy/materials and the prior form's poses were reviewed before this pass. This remains the isolated 3D preview; no gameplay families or evolution forms are replaced.

## Construction

Standing foot offsets are measured from the prior form relative to its idle feet, then scaled by 0.65 onto the new biped's idle landmarks. Two-bone IK keeps the actual authored legs connected. Forward knee poles, the original flat-boot orientation and neutral toe joints replace the problematic copied ankle pitch. The pelvis lowers by at most 8.5 mm where required to keep the full stance within the original limb lengths. Each sole is fitted to 2 mm above the floor; no limbs are stretched or replaced.

The prior form's relaxed idle is fitted to the biped with wrists below the hips, restrained elbow width and palms facing inward. The bow stays attached to the anatomical RIGHT hand; the LEFT hand draws. The side carry clears the floor. Non-looping idle handoffs ease into the same resting arms, and standing entry/exit explicitly meet the shared poses. Active draw/string contacts remain under the existing tolerance. Run and travelling/acrobatic shots retain their existing leg animation.

The quiver mount is refitted during the affected transitions and turns to retain clothing contact as the arms lower. [Mount adjustments](quiver-refit.json) remain below 6 mm. [Transition sole checks](transition-soles.json) also keep the entry/exit boots clear of the floor.

All meshes, texture bytes, materials and skin weights remain unchanged from the rounded-hand revision. Only animation tracks change, along with the viewer's asset revision key and reproducible build/review tools.

## Validation and limits

- [63 passing tests](unit-tests.txt): existing source/material, hand contact, jump/run/tail checks plus arms-down placement, restrained elbows, lowered bow clearance, planted flat boots throughout all five standing-shot variants, and matching stance entry/exit endpoints below 1 mm.
- [Bow/floor audit](bow-floor.json): the bow stays above the floor in all 28 clips touched by this pass.
- [Tail audit](tail-audit.json), [quiver audit](quiver-audit.json): interpolated/exported surface sampling. The original connected tail-root seam retains its documented exception; sampling is not a continuous mathematical proof. New round hands retain separate grip and visual checks.
- [glTF validation](gltf-validation.json): zero errors and the same three source-related tangent/skinned-transform warnings. Other importers remain unverified.
- [Both offline builds](offline-builds.txt), [source/offline movement](game-source-offline.txt), [source/offline combat](combat-source-offline.txt). These cover unchanged production game behavior separately from the new 3D preview review.

The full motion builder now finishes with `refine-fox-biped-stances.mjs`. It can also be applied once to the preceding rounded-hand asset. `review-fox-stances.browser.mjs` captures the prior-form references and targeted transition video. Set `BIPED_REVIEW_OUT=docs/evidence/fox-natural-stances` for the shared biped browser/collision review tools.
