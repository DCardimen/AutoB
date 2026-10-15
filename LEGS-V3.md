# Legs V3: authored anatomy

V2 replaced the lower sprite with generic shaded tubes. Comparing the original art in all eight facings exposed the problem: crab claws and shells were cut away, heavy animals acquired blocky cuffs, stag hooves lost their texture, and drakes inherited a quadruped stance that did not match their artwork.

V3 keeps the original directional limb shapes and skins their painted pixels to the movement rig. Fur, scales, metal, dark hooves and highlights retain their original palette indices, including collection variants. Hidden far legs stay hidden. Idle feet retain the authored stance; breathing moves the body gently above them. Movement is limited by the source limb length, and the existing 50–150% stride slider remains visible without changing combat stats.

Source-adjacent pixels remain connected during rasterization. Inverse texture samples that form unsupported detached fragments are discarded. Resting claws and mantis scythes are no longer drawn a second time over the artwork. Natural attack contacts and the 3D simulation skeleton remain in use; humanoid leg volumes retain their existing construction.

The apex stag source art contained painted blue/brown ground strips in six facings; V3 removes that scenery and retains dark hoof tips. The evolved crab source frames also contained truncated crystal crowns. Their missing caps now reuse the intact juvenile crystal's painted facets in the evolved palette. The full pose is fitted with headroom, including virtual source rows above the original cell.

## Visual review

- [Crab: original and V3, all forms and facings](public/legs-v3-crab.png)
- [Brass walker](public/legs-v3-mech.png)
- [Stag](public/legs-v3-stag.png)
- [Drake](public/legs-v3-drake.png)
- [Normal-speed playback: eight anatomies, native size and 3× enlargement](public/legs-v3-preview.webm)

`scripts/review-legs-v3.mjs final` produces 12 original/current comparison sheets and eight full-cycle motion sheets, covering 512 additional animated poses. It records the preview and decodes four frames from actual playback. Set `BASE_URL` when the game runs on a port other than 3000.

## Verification

`tests/legs-v3.test.js` audits 13,056 rendered idle/walk/run/sprint poses across 17 natural anatomies, three forms, eight directions and eight gait phases. The audit compares significant detached lower-body clusters with the bind stance; it is a pixel-connectivity check, not a subjective quality score. Additional checks cover exact shared palettes, idle stance, source-relative travel limits, crab crown taper/headroom and visible stride tuning.

Existing collection, creature-attack, humanoid-leg, physical-rig and palette checks remain in the suite. Browser verification covers real source/offline battles, both-team stride settings, natural attack contacts, phone layouts and the Training Glade. Both offline HTML files must be rebuilt after renderer changes.
