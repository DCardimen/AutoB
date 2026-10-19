# Base fox: eight directional component kits and one working example

Current scope is **Rowan/base only**, following the user's narrowed request. The eight generated component sets cover E, SE, S, SW, W, NW, N and NE. One SW-facing example is assembled and animated for review. This is an isolated preview; the game, production renderer, original source-sprite modules and offline game files are unchanged.

## What changed after visual feedback

The earlier segmented puppet was rejected for disconnected joins, a frontal chest, over-curled knees and incorrect-looking arm bends. This pass paints a continuous torso with its chest, buckle and pelvis turned with the SW head. Whole painted arms and whole short legs replace exposed upper/lower source joins. Boots dominate the short leg silhouette; stride and lift are bounded by the shorter limbs, and the feet remain grounded during support.

The arm solver now targets the wrist, with a separate rigid hand/grip transform. Elbow bending deforms the arm up to the wrist; it does not stretch the glove, fingers or thumb. The anatomical right hand owns the bow; the left hand draws. Real bow tips, palm grip, string draw point and released arrow share their physical coordinates. Cape and tail retain pinned, damped dynamics. Blinking changes the eye artwork without replacing the head silhouette.

The selected SW asset was restyled against the stronger earlier Rowan art board rather than retaining the smoother, brown-eyed interpretation from the initial generated kits. Its original pixel-art character and darker eyes are the benchmark. Sources are retained and generation/correction prompts are in [generation.md](generation.md). This is a review candidate; passing mechanical checks does **not** establish the user's requested 9/10 visual likeness.

## Assets and visual evidence

- [Self-contained working example](../../../public/fox-layered-preview/fox-stocky-motion.html), also emitted directly in the conversation. Select idle/blink, run or bow attack; normal, half and quarter speed; pause; optional guides; stride; and wind.
- [Eight-direction heads and torsos](direction-heads-torsos.png), [all twelve parts in each direction](direction-parts.png), and [right/left glove crops for every direction](hand-review.png).
- [Idle](idle.png), [blink](blink.png), [run](run.png), [full draw](draw.png), [release](release.png), and [optional guides](guides.png).
- [Recorded normal-speed playback with paused inspection poses](normal-speed.webm), [decoded 256-pixel samples](decoded-normal-speed.png), and [2× decoded samples](decoded-enlarged.png). Decoded labels identify actual recording timestamps; the clock includes inspection pauses.
- [Browser report](review.json), [decoded asset checks](direction-checks.json), and [source paths, hashes, crop bounds and anatomical landmarks](../../../public/fox-layered-preview/base-directions.json).

Each facing has twelve independent textures: open/closed head, torso/hips, right/left complete arms, right/left short legs and boots, cape, tail, bow, quiver and arrow. Eight dedicated bow textures replace malformed equipment from the first component generation. All 96 retained parts contain decoded painted pixels. The atlas is 512×384 per direction; the working character raster is 256×256 in a 64-unit logical cell, with no 48-color reduction.

## Hand and thumb review

Reviewed the paired right/left glove crops in all eight generated source views, taking palm/back visibility and foreshortening into account. The SW restyle explicitly preserves a distinct anatomical right glove and left glove: in their downward bind view the right glove's thumb is on the image-left side of its back, and the left glove's thumb is on the image-right side. These are separate painted limbs. Animation rotates the rigid gloves through the wrist; it never swaps them according to screen position or gait phase.

Reviewed SW idle, draw and release at native and enlarged size, including the real grip/string contact pixels and the rigid glove silhouettes. The other seven kits are **source-art drafts**, not reviewed animated hand bindings. Their wrist orientation, thumb visibility and occlusion must be checked again when they are rigged; this pass does not claim eight-direction animation approval. The seven non-SW sources also retain their first-generation rendering and need stylistic harmonization against the selected earlier Rowan reference before production use.

## Validation and remaining scope

- Five Node tests pass: the four original pilot regression tests plus the short-leg test across idle/run/attack and 50%, 100% and 150% stride. The new test checks real ankle reach, planted soles, limited knee deviation, anatomical grip and draw contacts.
- Embedded browser review: 192 rendered SW poses over idle/run/attack at 50% and 150% stride; painted limb/boot contact, pixel boundaries, right palm grip and left draw contact pass. No browser errors. Actual rendered frames retain thousands of colors rather than 48 indexed colors.
- Pause, all twelve inspected parts, normal-speed playback and layouts at 320/736/1024 outer widths pass. The served source preview independently loads one Rowan actor with a 256-pixel raster and right-hand bow.
- All eight atlases are decoded and every part checked for occupied pixels. Original/current source sheets, complete selected source art, and decoded recording samples were visually reviewed at native and enlarged sizes.
- Repository and personal reusable skills include the directional chest, continuous limb, rigid wrist and anatomical thumb checks and pass skill validation.

Evolution forms are intentionally deferred. Seven other directional rigs, complete pace/turn/fall coverage, artistic approval, game integration, offline rebuilds and source/offline live combat remain pending. None is represented as complete by this preview.

## Reproduce

Run `scripts/build-fox-base-directions.mjs` with the eight retained source paths in E, SE, S, SW, W, NW, N, NE order, plus `--bows public/fox-layered-preview/sources/base-bows-master.png`. The sources are `public/fox-layered-preview/sources/rowan-<direction>-master.png`.

Then run `node scripts/build-fox-layered-inline.mjs` and `node --test tests/fox-base-motion.test.js tests/fox-layered-preview.test.js`. Render `public/fox-layered-preview/fox-stocky-motion.html` with the visualization skill's `scripts/render.py` to `playtest-artifacts/fox-stocky-inline-review.html`, then run `node scripts/review-fox-stocky-motion.mjs` followed by `node scripts/inspect-fox-base-art.mjs`.
