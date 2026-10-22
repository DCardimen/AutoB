# Full-length, symmetrical fox-tail profile

The requested change removes the oversized flank and gives the tail a skinny attached base that gradually widens into a fox-tail body. **Length is retained.** The original painted orange/white texture, UVs, geometry topology, pelvis socket and tail skeleton remain in place.

[Before/after side, overhead and rear-quarter views](before-after-profile.png) · [All eight views](before-after-eight-views.png) · [Normal-speed acrobatic preview](rowan-acrobatics-preview.html)

## Shape and preservation

The bake measures the uploaded tail's actual triangle cross-sections, trims each larger half to match its opposite side, and applies a gradual base taper. It deforms the existing painted vertices rather than replacing the tail with a tube or deleting faces. Surface normals follow the deformation.

- Every one of the 589 tail-owned vertices retains its longitudinal coordinate, including the complete original tip reach.
- Main-body cross-sections have balanced upper/lower and front/back extents; the original one-sided excess is reduced by over 90%. Small authored fur contours remain.
- The base grows progressively into the thicker section; the white tip and material texture are retained.
- Skeleton bind matrices and non-tail geometry are unchanged. Gait, shots, flips, slides and turns retain their animation tracks. The existing automatic floor solver adjusts the fall's vertical support by at most 3.22 mm to fit the slimmer tail; rotations and horizontal travel are unchanged.

[Measured profile, original/current extents, unchanged geometry and animation checks](profile-review.json).

## Coverage and checks

Animated scope: **base fox only**, one tail, eight views S, SE, E, NE, N, NW, W, SW. Original base/mature/apex references were inspected; evolution and variant art are unchanged. This continues the isolated 3D preview from PR #81.

- [55 fox tests](fox-tests.txt): GLB validity, all original motion/contact assertions, exact retained tail reach, measured symmetry, progressive taper, byte-identical painted texture/UVs/material, stable normals, pelvis ownership and real floor contact during the fall.
- [11,433 tail-surface samples at 60 Hz](tail-surface-audit.json): no intersections across all clips, ambient clocks, acrobatic actions and moving-target aim.
- [Full action/framing review](browser-review.json): eight-view action sheets, no clipped review frames, normal-speed playback and decoded frames.
- [16.7-second continuous runtime combo](acrobatic-combo.webm), [decoded native frames](combo-decoded-sheet.png), and 1536px enlarged flip/slide/volley frames (`combo-decoded-2.4-enlarged.png`, `combo-decoded-8-enlarged.png`, `combo-decoded-10.5-enlarged.png`).
- [Live combat](combat-review.json): 7 shots / 7 hits, normal-speed 34-second recording decoded and checked.
- [Self-contained preview playback](inline-review.json) at 320/736/1024px; [mobile interactive preview](mobile.png).
- Both [standalone](standalone-build.txt) and [prototype](prototype-build.txt) offline game builds were regenerated. Their indexed-art outputs are unchanged; source plus offline playback of the changed 3D asset is covered by the live viewer and embedded normal-speed previews.
- The existing [source/offline gait-combat](source-offline-legs.txt) and [source/offline prototype](source-offline-prototype.txt) browser scenarios also pass.

No known disconnected or intersecting tail remains in this coverage. The production indexed renderer is unchanged.

## Reproduce

Set `FOX_EVIDENCE_DIR=docs/evidence/fox-tail-symmetric`, then run the existing animation bake, mesh-preview build, tail audit, action review, acrobatics review, combat review, inline build and inline review scripts. Serve the repo at port 3117 or set `BASE_URL` for browser scripts.

```text
node scripts/build-meshy-fox-animated.mjs
node scripts/build-meshy-fox-preview.mjs
node --test tests/fox-tail-profile.test.js tests/meshy-fox-motion.test.js tests/meshy-fox-archer.test.js tests/meshy-fox-archer-v2.test.js tests/meshy-fox-archer-v3.test.js
node scripts/audit-fox-tail.mjs
```

The comparison script `scripts/review-fox-tail-profile.browser.mjs` takes its original from `playtest-artifacts/fox-tail-before.glb`, saved before this bake. That file is the asset at commit `e398eba`; the committed v3 comparison sheets remain in `docs/evidence/meshy-fox-archer-v3/`.
