# Layered fox archer preview

Historical three-tier pilot evidence is retained below. The current entry points now show the user's narrowed base-fox working example; see [the current review](../fox-stocky-motion-preview/README.md). The original `kits.json` and its tests remain as regression coverage, not a claim about the new artwork.

This is an isolated art and animation pilot, not a production game integration. No game entry point, creature renderer, gameplay evolution, weapon-hand convention, or offline game file is changed.

## Coverage

Reviewed the original fox source artwork in all eight directions (E, SE, S, SW, W, NW, N, NE) across all three authored tiers. The new kit and moving pilot cover the front-left/SW three-quarter facing for Rowan, mature art, and Moontrail Ranger/apex. Wild/Warden variants and the remaining seven directional kits are pending review and expansion. Rowan's mature source-art tier is not a new gameplay evolution.

Each tier has 16 independent painted parts. The pilot uses stable anatomical right/left arm ownership, a right-hand bow with a left-hand draw, two-bone limbs with a separate ankle, fixed boot support, local painted-eye blinking, a pinned cloth mesh, and one or five separately constrained tail chains. Diagnostic guides are optional and confined to this preview.

The preview renderer samples the painted meshes into a 64-pixel character cell and resolves colors to each kit's shared 48-color palette. Source art is retained alongside extracted parts. It does not draw generic procedural limbs or use full-character flipbook animation.

## Review surfaces

- [Interactive source preview](../../../public/fox-layered-preview/index.html) — serve the repository and open `/public/fox-layered-preview/`.
- [Self-contained conversation preview](../../../public/fox-layered-preview/inline.html).
- [Independent parts](parts.png), [idle](idle.png), [blink](blink.png), [run](run.png), [bow draw](attack.png), [release](release.png), [optional rig guides](rig-guides.png).
- [Normal-speed recording](normal-speed.webm) and [decoded native/enlarged samples](decoded-normal-speed.png).
- [Original eight-direction artwork](original-directions.png).
- [Original/current native comparison](original-current-native.png) and [3× comparison](original-current-enlarged.png): rows are base/mature/apex; columns 1–8 are original E through NE; column 9 is the new single-facing pilot.
- [Interactive-preview screenshot](inline.png), [browser review report](review.json), and [inline-control checks](inline-checks.json).
- [Generation specification and selected sources](generation.md).

## Validation

- `node --test tests/fox-layered-preview.test.js`: 4 tests pass, covering real source pixels/palette, anatomical grip and string binding, alternating grounded support/ankles at 50% and 150% stride, and bounded cape/tail dynamics under motion, wind, release and long frame gaps.
- `node scripts/review-fox-layered-preview.mjs`: 576 rendered poses, 192 per tier, across idle/run/attack and 50%/150% stride. Painted arm/leg continuity and contact, character-cell boundaries, physical grip/string contacts and pinned roots pass. Layouts fit at 320, 736 and 1100 pixels.
- `node scripts/check-fox-layered-inline.mjs`: embedded images load without network fetches, right-hand bow persists, pause/guides/native-size controls work, tail counts are 1/1/5, all 16 parts are inspectable, and narrow/wide layouts fit.
- The reusable skill passes `skill-creator/scripts/quick_validate.py` and is installed in the user's personal Codex skills folder as `layered-creature-art`.
- Original/current sheets and decoded normal-speed footage were visually reviewed at native and enlarged sizes.

Production gait/anatomy suites, source/offline live combat and both offline game rebuilds remain part of the subsequent integration pass. They are not represented as completed here: the user explicitly requested a layered preview before integration.

## Reproduce

Build the kits from the retained selected master PNGs:

```powershell
node scripts/build-fox-layered-kits.mjs public/fox-layered-preview/sources/rowan-master.png public/fox-layered-preview/sources/mature-master.png public/fox-layered-preview/sources/moontrail-master.png
node --test tests/fox-layered-preview.test.js
node scripts/build-fox-layered-inline.mjs
node scripts/review-fox-layered-preview.mjs
```

The inline checker and decoded-evidence helper use the local visualization skill's standalone wrapper at `playtest-artifacts/fox-layered-inline-review.html`. Create that wrapper from `public/fox-layered-preview/inline.html` with the available visualize skill's `scripts/render.py`, then run `node scripts/check-fox-layered-inline.mjs` and `node scripts/inspect-fox-layered-evidence.mjs`.
