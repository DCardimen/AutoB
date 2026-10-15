# Adding creatures without repeating leg and weapon regressions

This guide is required by [AGENTS.md](AGENTS.md). The established renderer skins the original indexed artwork to the physical rig. The physics skeleton describes motion and combat contacts; it is not a replacement for the artist's anatomy.

## Inspect the source first

Compare all eight directional frames and every base/evolution form before editing. Record visible limb count, body silhouette, socket positions, paw/hoof/claw widths, material colors, idle stance and any occluded far limbs. Inspect crowns and feet at the cell edges. A sprite that uses the wolf proxy can still have a different visible stance: the current drake artwork is an explicit example.

Keep original/current comparison sheets. Review the small native sprite as well as enlarged pixels; a plausible skeleton can still produce a bad silhouette or disconnected painted feet. Attack animation should follow the anatomy: canine bites, mantis forelimb slashes, crab pincers and humanoid held weapons have different contacts.

## Register anatomy and footfalls

- Put a distinct anatomy profile in `leg-anatomy.js` and form-specific proportions/equipment in `native-forms.js` when needed. Use the correct source assets for all forms and facings.
- Add each true quadruped design to `QUADRUPEDS` in `creature-leg-volume.js`. The classification guard in `tests/gaits-carry.test.js` rejects an unclassified four-leg physics proxy. An exception requires source-art review, a documented reason and appropriate motion coverage.
- `creatureLegArt` must recognize separately animated visible feet. Touching paws cannot all become one foot region. Keep hidden feet hidden, and bind neighboring visible paws to opposite diagonal groups (physical indices 0/3 versus 1/2).
- Preserve source widths and colors through `skinCreatureLegs`. Hip/socket weights blend continuously into the body, idle foot deltas stay zero, and motion is bounded by source limb length. Check both 50% and 150% stride settings.
- Production legs use the authored skinning path in `authored-sprite-renderer.js`. `debugLegVolumes` is diagnostic only. Do not restore the old horizontal leg cut, generic shaded tubes or visible skeleton overlays.

## Register hands and equipment

Use fixed directional source hand/equipment landmarks, adding an explicit `GEAR` entry when a new silhouette needs one. Account for hidden hands and evolution costumes. Do not derive screen side, wielding hand or weapon choice from animated shoulder/hand positions that cross the torso during walking.

Travelling melee weapons use the relaxed carry; bows and wands keep their intended orientation. Preserve the distinction between hand carry binding and melee carry rotation. Active attacks, casts and bow draws use the physical action pose. Weapon grip and wielding hand must coincide in rendered coordinates; two-handed handles and bowstrings need consistent transforms. Maintain source costume textures when removing a painted hand or old equipment patch.

## Acceptance evidence

Use `tests/gaits-carry.test.js` for actual foot-pixel changes, alternating support, actual grip-side stability and original humanoid costume palettes. New four-leg proxies must be explicitly classified; the test must not silently skip them. Extend the same coverage when introducing a new rig category or special weapon.

Run the relevant existing checks in `tests/legs-v3.test.js`, `tests/legs-v2.test.js`, `tests/melee-weapon-art.test.js`, `tests/prototype-rig.test.js`, `tests/sprite-art-v2.test.js` and the evolution/cell-boundary tests in `tests/grand-forms.test.js`. Keep existing assertion thresholds. Full CI runs the complete suite.

Build both offline files with `npm run build:standalone` and `npm run build:prototype`. Start the game, then run the source/offline live checks in `tests/legs-v2.browser.mjs` and `tests/prototype.browser.mjs`. Include the new anatomy in those scenarios or an equivalent live test when existing rosters do not exercise it.

Run `node scripts/review-gaits-carry.mjs final` and, for natural anatomy changes, `node scripts/review-legs-v3.mjs final`. Extend their specimen lists to include a new family. `BASE_URL` selects the local server; `CHROMIUM_PATH` selects the browser where required. Review full cycles of idle, walk, run, sprint, turns, attacks and falls in every facing and form, including variants and equipment. Inspect decoded normal-speed video frames, not only generated stills. Check that feet alternate, sockets stay attached, materials match, weapons remain the same, and nothing clips.

Link review sheets/video and report coverage in the PR. If repeated tuning cannot produce connected, proportionate motion, revisit the registration or skinning strategy. Do not accept a known visual defect or weaken a test to make the change pass.
