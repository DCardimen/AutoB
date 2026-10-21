# Natural fox arms

The biped fox's arms read as a T-pose rig that had been folded down. Two retarget defects caused it:

- **Travel and reaction clips lifted the arms to the horizontal.** The builder mapped the prior proxy's hand positions 0.65× toward the chest. The biped's arms are much longer relative to that distance (0.245 m arms, 0.23 m shoulder span, versus the proxy's 0.27 m arms and 0.40 m span), so each elbow folded about 100° and the outward IK pole raised the upper arm. Walk, Hit_Reaction, every Turn/Quick_Turn/Run_Stop, Dash, Dodge, Duck and Fall_and_Death held the upper arms at 74–93° abduction in a chicken-wing pose. The stance pass then eased them down to Idle at each clip end: "T-pose, then hanging down". The prior proxy keeps its arms at rest in these clips, so the lifted pose was purely an artifact.
- **Idle bent its elbows backwards.** The upper arm tilted 25–28° forward while the forearm angled back, so the elbows pointed forward. The bow shots' ready and lowered pose held the bow across the belly with the left elbow lifted out behind.

See [arm-angles-before.txt](arm-angles-before.txt) and [arm-angles-after.txt](arm-angles-after.txt). Each column is abduction/flexion in degrees from hanging, elbow bend, and the bend direction (`fwd`, `bck`, `in` or `OUT`).

## Construction

[`refine-fox-biped-arms.mjs`](../../../scripts/refine-fox-biped-arms.mjs) runs after the natural-stance pass. It builds each arm in the chest frame from three angles: abduction, forward flexion and an elbow that only flexes forward. The rest pose is 17° abduction, 7° flexion, a 36° elbow bend and a slight inward forearm. That clears the hood and shorts and rests the hands just in front of the hips. Two-bone IK reproduces the model exactly (maximum wrist error below 0.001 mm).

- **Rest, travel and reaction clips** take their motion from the prior form's arm *angles* relative to its own idle, not from its scaled positions. Timing and character are kept, and every clip end meets the same rest pose.
- **Walk** adds a counter-swing driven by the biped's own thighs.
- **Run** keeps its authored pump, with abduction brought in to 15–30°.
- **Shots** rest in the same pose before the quiver reach and after the follow-through. The drawing arm blends out by 0.16 s and back from 1.8 s; the bow arm blends from 0.12–0.42 s and back from 1.75–2.1 s. Raise, nock, draw, release and every arrow/string contact are unchanged.
- **Bow_Attack_Enter/Exit** hold the rest arms, so Idle → Enter → Attack → Exit → Idle stays continuous.
- **Side flips and the vault** keep their tucked bow unchanged.

The round paws face the body and follow the forearm with a slight relaxed droop. The bow keeps its authored carry orientation at the new grip. The quiver mount is refitted for every changed clip ([quiver-refit.json](quiver-refit.json)). Meshes, textures, materials and skin weights are unchanged. Only animation tracks and the viewer's asset revision key change.

## Visual review

- Before/after, five key poses in four facings: [before](arms-before-close.png), [after](arms-after-close.png).
- Before/after, 15 poses in all eight facings: [before](arms-before-eight-facings.png), [after](arms-after-eight-facings.png).
- [Normal-speed sequence](arms-sequence.webm) of Idle → Walk → Hit_Reaction → Turn → Run → Run_Stop → Enter → shot → Exit → Idle, with a [decoded sheet](arms-decoded-sheet.png), [native frame](arms-decoded-native.png), [enlarged frame](arms-decoded-enlarged.png) and [1× playback check](arms-playback.json).
- All 44 actions in S/SE/E/NE/N/NW/W/SW (`*-eight-views.png`), plus the [complete action reel](all-actions.webm), [runtime acrobatic combo](acrobatic-combo.webm), its decoded frames and the [browser review](browser-review.json).

Reviewed scope is **the base biped fox, all 44 actions, S/SE/E/NE/N/NW/W/SW**. This is the isolated 3D preview. No gameplay families or evolution forms change.

## Validation and limits

- [74 passing fox tests](unit-tests.txt). The old "idle arms hang beside the thighs" assertion described the rejected pose, so it was replaced with an anatomical one. Every rest, travel and reaction clip must keep upper-arm abduction below 46° and elbows bent at least 15°, and must never bend an elbow backwards. Shots must rest below 24° at both ends. Idle must stay near the body with soft forward elbows, hands in front of the hips and the bow clear of the floor. Against the previous asset this test fails with "Idle Right elbow bends backwards".
- [glTF validation](gltf-validation.txt): zero errors and the same three source-related warnings as before.
- [Both offline builds](offline-builds.txt) and [source/offline game checks](game-source-offline.txt) pass. Production game behaviour is unchanged.
- **Limitation:** the aim itself still uses the retargeted draw. Seen from directly in front, the bow forearm still crosses the chest during the draw. A side-on draw does not fit these proportions: the drawing hand cannot reach a nock in front of the large head. This pass does not change the draw.
