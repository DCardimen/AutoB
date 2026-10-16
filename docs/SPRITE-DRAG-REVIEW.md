# Sprite dragging, pickup and arena framing

Equipment, personal relics, skills, reserve companions and team cards now carry their sprite under the pointer. Mouse, pen and touch share the same interaction. Legal recipients and equipment categories glow using the actual equip/swap rules on an isolated copy of the run. Wrong equipment categories dim. Invalid drops return to their source; Escape cancels without triggering a click equip. Holding near a dialog edge scrolls continuously.

Successful drops animate the sprite into its refreshed destination with a short fall, compression and settling highlight. The receiving art stays hidden until arrival so there is one moving sprite. Reduced motion uses a brief fade. Companion swaps retain individual equipment and exchange seats. Refreshing a dialog now preserves separate controls with the same action, including its close icon and footer Back button.

Pregame pickup first checks painted pixels, then a small screen-sized margin around the authored silhouette and its marker. It uses the same alive preview as the renderer, including companions whose stored HP is zero. Friendly pickup is resolved before capture targeting. Falling previews clear when a form, roster object or deployment changes; the review caught a Support form switch that otherwise remained drawn at its previous drop location.

The arena shows the complete illustration instead of cover-cropping it in wide viewports. Scenery fits the viewport; creatures and pointer input retain their uniform camera scale. Existing ambient masks use the same scenery geometry. This adds no background animation.

## Validation

- **37/37 unit checks**: loadout compatibility/nonmutation, companion ownership and seats, 1,068 deployment family/form/path/height cases, stale-preview invalidation, camera mapping, equipment/capture regressions, authored gait/carry, anatomy, palette, contacts and sprite boundaries. [Log](evidence/sprite-drag/unit-tests.txt).
- **672 real mouse pickups** across source and offline builds: 267 family/form sprite grabs plus 69 default-position owl/Support marker grabs per build. Marker cases include stored zero HP. Real phone touch moves the owl in both builds. [Report](evidence/sprite-drag/deployment-browser.json).
- Source/offline sprite-drag flows verify equipment, wrong-slot returns, cross-companion beast fangs, personal relics, team swaps, reserve swaps, delayed Escape release, close-icon preservation and real phone touch equipment transfer. 390px and 320px arena layouts need no page scrolling. [Report](evidence/sprite-drag/browser.json).
- Existing source/offline team-selection, capture, equipment and reward flows pass at desktop and phone sizes: stable selection nodes, compatible equipment, live capture odds, capture loot claimed once and departing cards hidden. [Report](evidence/sprite-drag/equipment-regression.txt).
- Both offline HTML builds completed. Browser checks report no errors; offline flows block all requests after navigation. `git diff --check` passes.

## Visual review

- [Grabbed ring and legal slot highlights](evidence/sprite-drag/ring-grab.png), [ring dropping into place](evidence/sprite-drag/ring-falling.png), [completed loadouts](evidence/sprite-drag/completed-loadouts.png), [phone touch transfer](evidence/sprite-drag/touch-loadout.png).
- [Full arena illustration](evidence/sprite-drag/arena-framing.png), [390px arena](evidence/sprite-drag/arena-390.png), [320px arena](evidence/sprite-drag/arena-320.png).
- [Normal-speed item/companion dragging](evidence/sprite-drag/sprite-drag-normal-speed.webm), [normal-speed owl/Support pickup, recovery and live combat](evidence/sprite-drag/owl-support-normal-speed.webm), [decoded native-size and 3× frames](evidence/sprite-drag/decoded-native-and-enlarged.png) at 1.1, 3, 6.8 and 9.5 seconds.

Reviewed original/current owl and caster sheets in all eight directions and all three forms: [owl](evidence/deployment-selection/review-owl.png), [caster](evidence/sprite-drag/review-caster-original-current.png). Reviewed the owl and Nyra in live base/evolved/ascended pickup and combat. No authored sprite, palette, gait, limb socket, physical contact or weapon identity was edited. No new disconnected or clipped limb was observed in these samples. The broader interaction sweep is not a claim of visual animation review for every family.

This PR stacks on the capture forecast PR. The original expedition.js draft was not edited, staged or deleted.
